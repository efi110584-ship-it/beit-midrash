/**
 * הבית הדיגיטלי של תיכון יש"י - סקריפט Google Apps Script
 *
 * מה הסקריפט עושה:
 * 1. קולט הגשות מהאתר (submit.html ו-assets/direct-submit.js) ושומר אותן בתיקיות הקיימות:
 *    הגשות תלמידים > י"א / י"ב > תיקייה אישית של התלמיד > "שם התלמיד - מטלה - תאריך"
 * 2. לוח הגשות למורה: מציג את כל ההגשות, כולל אלה שכבר היו בתיקיות. מוגן בסיסמה.
 * 3. הודעה מהמורה בדף הבית.
 * 4. קוד לשיעור.
 * 5. ציון והערה לכל עבודה (רק המורה רואה אותם).
 * 6. בקרת שיעור: בזמן שיעור עם קוד, המורה רואה מי מהתלמידים נמצא בדף ומי יצא ממנו.
 *    התלמיד רואה על המסך שהבקרה פעילה. המידע נשמר עד 6 שעות ונמחק לבד.
 *
 * הסיסמה לא כתובה כאן. קובעים אותה ב: הגדרות הפרויקט (גלגל השיניים) > מאפייני סקריפט
 *   שם המאפיין: TEACHER_PASSWORD     ערך: הסיסמה שבחרתם
 */

// ---------- הגדרות ----------
var ROOT_FOLDER_ID = '1BtOgKt0cRP6h_1kb9TXUR_6EHTku9uqD'; // הגשות תלמידים - בית המדרש הדיגיטלי (לתיעוד בלבד)
var CLASS_FOLDERS = {
  'יא': '1b8UTqYD5MKBoR8cMvOzrfdTOwNS_97wn',
  'יב': '1pg85VsBBaccfgY8lHoB3UaZ3RV5AoGz4'
};
var TZ = 'Asia/Jerusalem';
var DATE_FORMAT = 'dd.MM.yyyy';
var MAX_BYTES = 5 * 1024 * 1024;   // 5MB, כמו באתר
var NOTIFY_BY_EMAIL = true;        // מייל למורה על כל הגשה חדשה
var LESSON_HOURS = 12;             // כמה שעות קוד לשיעור נשאר בתוקף
var MONITOR_CLASSES = ['יא'];      // כיתות שבהן אפשר להפעיל בקרת שיעור (כרגע רק י"א)
var AWAY_GRACE_SEC = 15;           // יציאה קצרה מזה (למשל מעבר בין דפים באתר) לא נספרת
var GONE_AFTER_SEC = 150;          // תלמיד שלא דיווח זמן כזה - "לא מחובר"

// מטלות שרוצים לראות בהן גם "לא הוגש".
// הסקריפט בודק אילו תלמידים (תיקיות אישיות) עוד לא הגישו את המטלה.
// כותבים את שם המטלה בדיוק כמו בשם הקובץ. דוגמה:  'יא': ['דף עבודה - יונה פרק א'],
var TRACKED_TASKS = {
  'יא': [],
  'יב': []
};

// ---------- נקודות כניסה ----------
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'announcement') return json_({ ok: true, announcement: getJson_('ANNOUNCEMENT') });
    if (p.action === 'lesson') return json_(findLesson_(p.code));
    return json_({ ok: true, service: 'beit-midrash' });
  } catch (err) {
    return json_({ ok: false, error: msg_(err) });
  }
}

function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'בקשה לא תקינה' }); }

  try {
    // הגשה רגילה מהאתר (בלי action) - בדיוק כמו היום
    if (!data.action || data.action === 'submit') return json_(saveSubmission_(data));

    // דיווח נוכחות מדף של תלמיד בזמן שיעור עם בקרה (בלי סיסמה - רק עם קוד השיעור)
    if (data.action === 'presence') return json_(presence_(data));

    // כל השאר - רק עם סיסמה
    if (!checkPassword_(data.password)) return json_({ ok: false, auth: false, error: 'סיסמה שגויה' });

    switch (data.action) {
      case 'login':           return json_({ ok: true });
      case 'list':            return json_({ ok: true, submissions: listSubmissions_() });
      case 'markChecked':     return json_(markChecked_(data.fileId, data.checked !== false));
      case 'setAnnouncement': return json_(setAnnouncement_(data.text));
      case 'createLesson':    return json_(createLesson_(data.url, data.label, data.monitor === true, data.cls));
      case 'presenceList':    return json_(presenceList_());
      case 'clearLesson':     PropertiesService.getScriptProperties().deleteProperty('LESSON'); return json_({ ok: true });
      case 'setGrade':        return json_(setGrade_(data.fileId, data.grade, data.comment));
    }
    return json_({ ok: false, error: 'פעולה לא מוכרת' });
  } catch (err) {
    return json_({ ok: false, error: msg_(err) });
  }
}

// ---------- קליטת הגשה ----------
function saveSubmission_(d) {
  var name = clean_(d.studentName);
  var task = clean_(d.assignment);
  var cls = normClass_(d.studentClass);
  if (!name || !task || !cls || !d.fileBase64) return { ok: false, error: 'חסרים פרטים בהגשה' };

  var bytes = Utilities.base64Decode(d.fileBase64);
  if (bytes.length > MAX_BYTES) return { ok: false, error: 'הקובץ גדול מ-5MB' };

  var file;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // מונע יצירת שתי תיקיות לאותו תלמיד בהגשות בו-זמניות
  try {
    var classFolder = DriveApp.getFolderById(CLASS_FOLDERS[cls]);
    var studentFolder = findOrCreateStudentFolder_(classFolder, name);
    var date = Utilities.formatDate(new Date(), TZ, DATE_FORMAT);
    var fileName = safe_(name + ' - ' + task + ' - ' + date) + extension_(d.fileName, d.fileMimeType);
    file = studentFolder.createFile(Utilities.newBlob(bytes, d.fileMimeType || 'application/octet-stream', fileName));
    if (d.notes) file.setDescription('הערות: ' + clean_(d.notes));
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_BY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: 'הגשה חדשה: ' + name + ' - ' + task,
        body: 'שם: ' + name + '\nכיתה: ' + cls + '\nמטלה: ' + task +
              (d.notes ? '\nהערות: ' + clean_(d.notes) : '') + '\n\nקישור לקובץ: ' + file.getUrl()
      });
    } catch (err) { /* ההגשה נשמרה גם אם המייל נכשל */ }
  }
  return { ok: true, fileId: file.getId() };
}

// מחפשים את התיקייה של התלמיד בשתי הכיתות (כמו בסקריפט הקודם):
// 1. אותו שם בדיוק ("אריה כהן", "אריה  כהן", "אריה-כהן").
// 2. אם התלמיד כתב לפחות שתי מילים, וכולן מופיעות בשם התיקייה - גם בלי שם אמצעי,
//    בסדר הפוך או בכתיב מלא/חסר ("איוב נועם" ← "נועם אדיסו איוב"). רק אם יש תיקייה אחת כזו.
// 3. אחרת - תיקייה חדשה בכיתה שנשלחה.
function findOrCreateStudentFolder_(classFolder, name) {
  var key = nameKey_(name);
  var typed = looseWords_(name);
  var close = [];
  var ids = Object.keys(CLASS_FOLDERS);
  for (var c = 0; c < ids.length; c++) {
    var it = DriveApp.getFolderById(CLASS_FOLDERS[ids[c]]).getFolders();
    while (it.hasNext()) {
      var f = it.next();
      if (nameKey_(f.getName()) === key) return f;
      if (typed.length >= 2 && containsAll_(looseWords_(f.getName()), typed)) close.push(f);
    }
  }
  if (close.length === 1) return close[0];
  return classFolder.createFolder(name); // תלמיד חדש - תיקייה אישית חדשה, באותו מבנה
}

// מפתח להשוואת שמות: בלי רווחים, מקפים, נקודות וגרשיים
function nameKey_(name) {
  return String(name || '').replace(/[\s\-_.'"`׳״]/g, '');
}

// מילים בשם, בכתיב "חסר" (בלי ו', י', ובלי א' באמצע מילה), כדי ש"משיח"/"מושיח" ייחשבו אותו שם
function looseWords_(name) {
  return String(name || '')
    .replace(/["'`׳״.]/g, '')
    .split(/[\s\-_־]+/)
    .map(function (w) { return w.replace(/[וי]/g, '').replace(/(?!^)א/g, ''); })
    .filter(function (w) { return w.length > 0; });
}

// האם כל המילים שהתלמיד כתב נמצאות בשם התיקייה (כל מילה פעם אחת)
function containsAll_(have, want) {
  var pool = have.slice();
  for (var i = 0; i < want.length; i++) {
    var j = pool.indexOf(want[i]);
    if (j < 0) return false;
    pool.splice(j, 1);
  }
  return true;
}

// ---------- לוח הגשות ----------
function listSubmissions_() {
  var checked = checkedMap_();
  var out = [];
  Object.keys(CLASS_FOLDERS).forEach(function (cls) {
    var classFolder = DriveApp.getFolderById(CLASS_FOLDERS[cls]);
    collectFiles_(classFolder, cls, null, out, checked); // קבצים שנמצאים ישר בתיקיית הכיתה
    var students = [];
    var it = classFolder.getFolders();
    while (it.hasNext()) {
      var sf = it.next();
      students.push(sf.getName());
      collectFiles_(sf, cls, sf.getName(), out, checked);
    }
    addMissing_(cls, students, out);
  });
  var grades = gradeMap_();
  out.forEach(function (x) {
    var g = x.id && grades[x.id];
    x.grade = g ? g.g : '';
    x.comment = g ? g.c : '';
  });
  out.sort(function (a, b) { return b.time - a.time; });
  return out;
}

function collectFiles_(folder, cls, studentName, out, checked) {
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var p = parseName_(f.getName());
    var created = f.getDateCreated();
    var task = p.task || p.raw;
    out.push({
      id: f.getId(),
      student: studentName || p.student || '',
      task: task,
      subject: subjectOf_(task),
      cls: cls,
      date: p.date || Utilities.formatDate(created, TZ, DATE_FORMAT),
      time: created.getTime(),
      status: checked[f.getId()] ? 'checked' : 'pending',
      url: f.getUrl(),
      notes: f.getDescription() || ''
    });
  }
}

// "שם התלמיד - מטלה - תאריך.pdf"  (המטלה עצמה יכולה להכיל " - ")
// מזהה גם את שמות הקבצים מהסקריפט הקודם: "... - 16-10-2026 1430"
function parseName_(fileName) {
  var raw = String(fileName).replace(/\.[A-Za-z0-9]{1,5}$/, '').trim();
  var parts = raw.split(' - ').map(function (s) { return s.trim(); });
  if (parts.length < 2) return { raw: raw };
  var student = parts.shift();
  var date = '';
  if (parts.length > 1 && /^\d{1,2}[.\/-]\d{1,2}([.\/-]\d{2,4})?( \d{3,4}| \d{1,2}:\d{2})?$/.test(parts[parts.length - 1])) {
    date = parts.pop().split(' ')[0].replace(/[\/-]/g, '.');
  }
  return { raw: raw, student: student, task: parts.join(' - '), date: date };
}

function addMissing_(cls, students, out) {
  (TRACKED_TASKS[cls] || []).forEach(function (task) {
    var nt = normTask_(task);
    students.forEach(function (s) {
      var ns = normName_(s);
      var has = out.some(function (x) { return x.cls === cls && normName_(x.student) === ns && normTask_(x.task) === nt; });
      if (!has) out.push({ id: '', student: s, task: task, subject: subjectOf_(task), cls: cls, date: '', time: 0, status: 'missing', url: '', notes: '' });
    });
  });
}

function subjectOf_(task) {
  var t = normTask_(task);
  if (/עברית|דקדוק|גזר|בניין|בנינים|משקל|שורש|נחי|חפנ|חפיצ|כפולים|שלמים/.test(t)) return 'עברית';
  if (/תושבע|מצוו|לקט|פתוח תפתח|צדקה|ריבית|משכון|שמיטת|הלכ|אהבת|גרים/.test(t)) return 'תושב"ע';
  return 'תנ"ך';
}

function checkedMap_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var map = {};
  Object.keys(props).forEach(function (k) { if (k.indexOf('chk_') === 0) map[k.slice(4)] = true; });
  return map;
}

function markChecked_(fileId, checked) {
  if (!/^[\w-]{10,}$/.test(String(fileId || ''))) return { ok: false, error: 'מזהה קובץ לא תקין' };
  var props = PropertiesService.getScriptProperties();
  if (checked) props.setProperty('chk_' + fileId, '1'); else props.deleteProperty('chk_' + fileId);
  return { ok: true };
}

// ---------- ציונים ----------
// נשמרים במאפייני הסקריפט, ליד הסימון "נבדק": grade_<מזהה הקובץ> = {g: ציון, c: הערה}
function gradeMap_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var map = {};
  Object.keys(props).forEach(function (k) {
    if (k.indexOf('grade_') !== 0) return;
    try { map[k.slice(6)] = JSON.parse(props[k]); } catch (e) { /* ערך פגום - מדלגים */ }
  });
  return map;
}

function setGrade_(fileId, grade, comment) {
  if (!/^[\w-]{10,}$/.test(String(fileId || ''))) return { ok: false, error: 'מזהה קובץ לא תקין' };
  var g = String(grade == null ? '' : grade).trim();
  var c = clean_(comment).slice(0, 300);
  if (g !== '' && !/^\d{1,3}$/.test(g)) return { ok: false, error: 'הציון צריך להיות מספר בין 0 ל-100' };
  if (g !== '' && Number(g) > 100) return { ok: false, error: 'הציון צריך להיות מספר בין 0 ל-100' };
  var props = PropertiesService.getScriptProperties();
  if (g === '' && c === '') {
    props.deleteProperty('grade_' + fileId);       // מחיקת ציון
  } else {
    props.setProperty('grade_' + fileId, JSON.stringify({ g: g, c: c, t: Date.now() }));
    props.setProperty('chk_' + fileId, '1');       // עבודה עם ציון נחשבת "נבדקה"
  }
  return { ok: true, grade: g, comment: c };
}

// ---------- הודעה מהמורה ----------
function setAnnouncement_(text) {
  var t = clean_(text).slice(0, 300);
  var props = PropertiesService.getScriptProperties();
  if (!t) { props.deleteProperty('ANNOUNCEMENT'); return { ok: true, announcement: null }; }
  var a = { text: t, updated: Date.now() };
  props.setProperty('ANNOUNCEMENT', JSON.stringify(a));
  return { ok: true, announcement: a };
}

// ---------- קוד לשיעור ----------
function createLesson_(url, label, monitor, cls) {
  url = String(url || '').trim();
  if (!/^[\w.-]+\.html(#[\w-]+)?$/.test(url)) return { ok: false, error: 'כתובת עמוד לא תקינה' };
  cls = normClass_(cls);
  if (monitor && MONITOR_CLASSES.indexOf(cls) < 0) return { ok: false, error: 'בקרת שיעור פעילה כרגע רק לכיתה י"א' };
  var code = String(Math.floor(1000 + Math.random() * 9000));
  var lesson = { code: code, url: url, label: clean_(label).slice(0, 120), created: Date.now(),
                 monitor: !!monitor, cls: monitor ? cls : '' };
  PropertiesService.getScriptProperties().setProperty('LESSON', JSON.stringify(lesson));
  return { ok: true, code: code, url: url, label: lesson.label, monitor: lesson.monitor };
}

function findLesson_(code) {
  var l = getJson_('LESSON');
  if (l && String(code || '') === l.code && Date.now() - l.created < LESSON_HOURS * 3600 * 1000) {
    return { ok: true, url: l.url, label: l.label, monitor: !!l.monitor, cls: l.cls || '',
             until: l.created + LESSON_HOURS * 3600 * 1000 };
  }
  return { ok: false, error: 'הקוד לא נמצא' };
}

// ---------- בקרת שיעור ----------
// כל דף באתר שנפתח בזמן שיעור עם בקרה מדווח: "in" (התלמיד בדף), "out" (יצא מהדף),
// "bye" (יצא ממצב שיעור). שומרים רק בזיכרון זמני (CacheService) - נמחק לבד אחרי 6 שעות.
function activeMonitoredLesson_() {
  var l = getJson_('LESSON');
  if (!l || !l.monitor || Date.now() - l.created >= LESSON_HOURS * 3600 * 1000) return null;
  return l;
}

function presence_(d) {
  var l = activeMonitoredLesson_();
  if (!l || String(d.code || '') !== l.code) return { ok: false, ended: true };
  var sid = String(d.sid || '').replace(/[^\w-]/g, '').slice(0, 40);
  if (!sid) return { ok: false, error: 'חסר מזהה' };
  var name = clean_(d.name).slice(0, 60);
  var page = String(d.page || '').slice(0, 80);
  if (!/^[\w.-]+\.html$/.test(page)) page = '';
  var state = d.state === 'out' ? 'out' : (d.state === 'bye' ? 'bye' : 'in');
  var t = Number(d.t) || Date.now();

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, busy: true };
  try {
    var cache = CacheService.getScriptCache();
    var key = 'pres_' + l.code;
    var all = {};
    try { all = JSON.parse(cache.get(key) || '{}'); } catch (e) { all = {}; }
    var now = Date.now();
    var p = all[sid] || { name: name, leaves: 0, state: 'in', outSince: 0, t: 0 };
    if (t < (p.t || 0)) return { ok: true, leaves: p.leaves };   // דיווח ישן שהגיע מאוחר - מתעלמים
    p.t = t;
    if (name) p.name = name;
    if (page) p.page = page;
    if (state === 'out') {
      if (p.state !== 'out') { p.state = 'out'; p.outSince = now; }
    } else if (state === 'in') {
      if (p.state === 'out' && now - p.outSince > AWAY_GRACE_SEC * 1000) p.leaves++;
      p.state = 'in';
      p.outSince = 0;
    } else {
      p.state = 'bye';
    }
    p.last = now;
    all[sid] = p;
    cache.put(key, JSON.stringify(all), 21600);
    return { ok: true, leaves: p.leaves };
  } finally {
    lock.releaseLock();
  }
}

function presenceList_() {
  var l = activeMonitoredLesson_();
  if (!l) return { ok: true, lesson: null, students: [] };
  var all = {};
  try { all = JSON.parse(CacheService.getScriptCache().get('pres_' + l.code) || '{}'); } catch (e) { all = {}; }
  var now = Date.now();
  var out = Object.keys(all).map(function (sid) {
    var p = all[sid];
    var status;
    if (p.state === 'bye') status = 'bye';
    else if (p.state === 'out') status = (now - p.outSince > AWAY_GRACE_SEC * 1000) ? 'out' : 'in';
    else status = (now - p.last > GONE_AFTER_SEC * 1000) ? 'gone' : 'in';
    return { name: p.name || '', page: p.page || '', status: status, leaves: p.leaves || 0,
             outFor: p.state === 'out' ? Math.round((now - p.outSince) / 1000) : 0,
             lastAgo: Math.round((now - (p.last || now)) / 1000) };
  });
  return { ok: true, lesson: { code: l.code, label: l.label, url: l.url, cls: l.cls }, students: out };
}

// ---------- סיסמה ----------
function checkPassword_(pw) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('pwFails') || 0);
  if (fails >= 10) throw new Error('יותר מדי ניסיונות. נסו שוב בעוד 10 דקות.');
  var real = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD');
  if (!real) throw new Error('עוד לא נקבעה סיסמה (TEACHER_PASSWORD במאפייני הסקריפט).');
  if (String(pw || '') === real) return true;
  cache.put('pwFails', String(fails + 1), 600);
  return false;
}

// ---------- עזר ----------
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function getJson_(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  try { return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function msg_(err) { return String((err && err.message) || err); }
function clean_(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function safe_(s) { return String(s).replace(/[\\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim(); }
function normName_(s) { return clean_(s).replace(/["'׳״]/g, ''); }
function normTask_(s) { return clean_(s).replace(/["'׳״]/g, '').replace(/[-–—,.:]/g, ' ').replace(/\s+/g, ' ').trim(); }
function normClass_(c) {
  var v = String(c || '').replace(/["'׳״\s]/g, '');
  return CLASS_FOLDERS[v] ? v : '';
}
function extension_(fileName, mime) {
  var m = String(fileName || '').match(/\.[A-Za-z0-9]{1,5}$/);
  if (m) return m[0].toLowerCase();
  var map = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'text/html': '.html',
    'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx' };
  return map[mime] || '';
}

// ---------- בדיקה ידנית ----------
// בוחרים "בדיקה" ברשימת הפונקציות למעלה ולוחצים "הפעלה".
// ביומן יופיע כמה הגשות נמצאו (אמור להיות בערך 40) ודוגמה של 3 הראשונות.
function בדיקה() {
  var list = listSubmissions_();
  Logger.log('נמצאו ' + list.length + ' הגשות');
  Logger.log(JSON.stringify(list.slice(0, 3), null, 2));
}
