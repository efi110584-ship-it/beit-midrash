/**
 * הבית הדיגיטלי של תיכון יש"י - סקריפט Google Apps Script
 *
 * מה הסקריפט עושה:
 * 1. קולט הגשות מהאתר (submit.html ו-assets/direct-submit.js) ושומר אותן בתיקיות הקיימות:
 *    הגשות תלמידים > י"א / י"ב > תיקייה אישית של התלמיד > "שם התלמיד - מטלה - תאריך"
 * 2. לוח הגשות למורה: מציג את כל ההגשות, כולל אלה שכבר היו בתיקיות. מוגן בסיסמה.
 * 3. הודעה מהמורה בדף הבית.
 * 4. קוד לשיעור.
 * 5. ציון והערה לכל עבודה (רק המורה רואה אותם). אפשר גם להסתיר עבודה מהלוח (הקובץ נשאר בדרייב).
 *    בדפים עם תשובה אחת נכונה (עברית, מבחנים אמריקאיים) האתר שולח גם "בדיקה אוטומטית":
 *    כמה תשובות נכונות מתוך כמה. היא מוצגת למורה כהצעה לציון - המורה מאשר.
 * 6. בקרת שיעור: בזמן שיעור עם קוד, המורה רואה מי מהתלמידים נמצא בדף ומי יצא ממנו.
 *    התלמיד רואה על המסך שהבקרה פעילה. המידע נשמר עד 6 שעות ונמחק לבד.
 * 7. לוח שאלות בדפי הפרקים (כמו פאדלט): התלמידים כותבים שאלות שעולות מהתקציר,
 *    כל הכיתה רואה אותן, והמורה יכול לסמן "נדון בכיתה" או למחוק.
 * 9. סרגל הכלים בצד המסך (assets/class-dock.js): המורה פותח לוח שיתופי מכל דף, והוא מופיע
 *    אצל כל התלמידים. בכל רגע פתוח לוח אחד; הלוחות הקודמים נשמרים (עד QB_KEEP).
 * 8. פעילות חיה בכיתה: ענן מילים, הצבעה על דילמה או סקר (כמה שאלות, אפשר בלי שמות). המורה מפעיל מהאזור האישי,
 *    התלמידים עונים בדף "פעילות בכיתה" (live.html), והתוצאות מוצגות על המקרן (screen.html).
 *    פעילות חדשה מוחקת את התשובות של הקודמת.
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
var MONITOR_CLASSES = ['יא'];
// עבודות שמגיעות למורה אחרת (התיקייה והמייל שלה - במאפייני הסקריפט:
// OTHER_TEACHER_FOLDER_ID ו-OTHER_TEACHER_EMAIL). רק אצלה - לא בלוח ההגשות.
// אפשר גם סיכום אחד בערב במקום מייל על כל הגשה (OTHER_TEACHER_DIGEST, ראו sendDailyDigest).
var OTHER_TEACHER = { cls: 'יא', sections: ['1', '3'], subjects: ['תנ"ך', 'תושב"ע'] };      // כיתות שבהן אפשר להפעיל בקרת שיעור (כרגע רק י"א)
var AWAY_GRACE_SEC = 15;           // יציאה קצרה מזה (למשל מעבר בין דפים באתר) לא נספרת
var GONE_AFTER_SEC = 150;          // תלמיד שלא דיווח זמן כזה - "לא מחובר"

// לוחות שאלות ישנים שהיו קבועים בדף (נשמרים כדי שאפשר לפתוח אותם שוב מהסרגל).
var QBOARDS = ['bereshit-12'];
var QBOARD_TITLES = [{ id: 'bereshit-12', title: 'בראשית י"ב - שאלות על התקציר', page: 'bereshit-12.html', created: 0 }];
var QB_MAX_ITEMS = 150;            // הכי הרבה שאלות בלוח אחד
var QB_MAX_LEN = 200;              // אורך שאלה מקסימלי
var QB_KEEP = 60;                  // כמה לוחות מהסרגל נשמרים (הישנים נמחקים עם השאלות שלהם)

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
    if (p.action === 'lessonLock') return json_(lessonLock_(p.page, p.code));
    if (p.action === 'qbList') return json_(qbList_(p.board));
    if (p.action === 'actCurrent') return json_(actCurrent_());
    if (p.action === 'dockState') return json_(dockState_());
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

    // לוח שאלות: הוספת שאלה ו"גם אני שואל" (בלי סיסמה)
    if (data.action === 'qbAdd') return json_(qbAdd_(data));
    if (data.action === 'qbLike') return json_(qbLike_(data.board, data.id));

    // פעילות חיה: תשובה של תלמיד (בלי סיסמה)
    if (data.action === 'actRespond') return json_(actRespond_(data));

    // כל השאר - רק עם סיסמה
    if (!checkPassword_(data.password)) return json_({ ok: false, auth: false, error: 'סיסמה שגויה' });

    switch (data.action) {
      case 'login':           return json_({ ok: true });
      case 'list':            return json_({ ok: true, submissions: listSubmissions_() });
      case 'markChecked':     return json_(markChecked_(data.fileId, data.checked !== false));
      case 'setAnnouncement': return json_(setAnnouncement_(data.text));
      case 'createLesson':    return json_(createLesson_(data.url, data.label, data.monitor === true, data.cls));
      case 'presenceList':    return json_(presenceList_(data.code));
      case 'clearLesson':     return json_(clearLesson_(data.code));
      case 'lessonsList':     return json_({ ok: true, lessons: lessonsList_() });
      case 'setGrade':        return json_(setGrade_(data.fileId, data.grade, data.comment));
      case 'setHidden':       return json_(setHidden_(data.fileId, data.hidden === true));
      case 'qbDelete':        return json_(qbDelete_(data.board, data.id));
      case 'qbMark':          return json_(qbMark_(data.board, data.id, data.done === true));
      case 'actStart':        return json_(actStart_(data.type, data.prompt, data.options, data.questions, data.anonymous === true));
      case 'actOpen':         return json_(actOpen_(data.open === true));
      case 'actClear':        return json_(actClear_());
      case 'actResults':      return json_(actTeacher_());
      case 'boardOpen':       return json_(boardOpen_(data.title, data.page));
      case 'boardSet':        return json_(boardSet_(data.id, data.open === true));
      case 'boardList':       return json_({ ok: true, boards: qbBoardsList_().concat(QBOARD_TITLES), active: getJson_('QB_ACTIVE') });
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
  var section = normSection_(d.section || d.studentClass);
  if (!name || !task || !cls || !d.fileBase64) return { ok: false, error: 'חסרים פרטים בהגשה' };

  var bytes = Utilities.base64Decode(d.fileBase64);
  if (bytes.length > MAX_BYTES) return { ok: false, error: 'הקובץ גדול מ-5MB' };

  var file;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // מונע יצירת שתי תיקיות לאותו תלמיד בהגשות בו-זמניות
  try {
    var subject = subjectOf_(task);
    var histFolder = subject === 'היסטוריה' ? historyClassFolder_(cls, true) : null;
    var otherFolder = (!histFolder && isOtherTeacher_(cls, section, subject)) ? otherTeacherFolder_(cls, section) : null;
    var routed = histFolder || otherFolder;
    var classFolder = routed || DriveApp.getFolderById(CLASS_FOLDERS[cls]);
    var studentFolder = routed ? findOrCreateIn_(routed, name) : findOrCreateStudentFolder_(classFolder, name);
    var date = Utilities.formatDate(new Date(), TZ, DATE_FORMAT);
    var fileName = safe_(name + ' - ' + task + ' - ' + date) + extension_(d.fileName, d.fileMimeType);
    file = studentFolder.createFile(Utilities.newBlob(bytes, d.fileMimeType || 'application/octet-stream', fileName));
    if (d.notes) file.setDescription('הערות: ' + clean_(d.notes));
  } finally {
    lock.releaseLock();
  }
  var auto = autoScore_(d.autoScore);
  if (auto) PropertiesService.getScriptProperties().setProperty('auto_' + file.getId(), JSON.stringify(auto));

  // למורה האחרת - כשהסיכום היומי מופעל (OTHER_TEACHER_DIGEST = 1): לא מייל על כל הגשה,
  // אלא מייל אחד בערב עם כל ההגשות של היום (sendDailyDigest). אחרת - מייל רגיל על כל הגשה.
  if (otherFolder && PropertiesService.getScriptProperties().getProperty('OTHER_TEACHER_DIGEST') === '1') {
    PropertiesService.getScriptProperties().setProperty('dg_' + Date.now() + '_' + Math.floor(Math.random() * 1e6), JSON.stringify({
      n: name, c: (cls === 'יא' ? 'י"א' : 'י"ב') + (section ? ' ' + section : ''), t: task, u: file.getUrl(),
      a: auto ? auto.c + '/' + auto.t : ''
    }));
  } else if (NOTIFY_BY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: (histFolder && historyEmail_()) || (otherFolder && otherTeacherEmail_()) || Session.getEffectiveUser().getEmail(),
        subject: 'הגשה חדשה: ' + name + ' - ' + task,
        body: 'שם: ' + name + '\nכיתה: ' + cls + (section ? ' ' + section : '') + '\nמטלה: ' + task +
              (d.notes ? '\nהערות: ' + clean_(d.notes) : '') +
              (auto ? '\nבדיקה אוטומטית: ' + auto.c + ' נכונות מתוך ' + auto.t + ' (' + Math.round(auto.c * 100 / auto.t) + ')' : '') +
              '\n\nקישור לקובץ: ' + file.getUrl()
      });
    } catch (err) { /* ההגשה נשמרה גם אם המייל נכשל */ }
  }
  return { ok: true, fileId: file.getId() };
}

// ---------- הגשות בהיסטוריה - למורה ההיסטוריה ----------
// במאפייני הסקריפט: HISTORY_FOLDER_ID (תיקייה ב-Drive, משותפת עם מורה ההיסטוריה)
// ו-HISTORY_TEACHER_EMAIL (לשם נשלח המייל על הגשה חדשה). בלי HISTORY_FOLDER_ID -
// הגשות בהיסטוריה נשמרות כמו כל השאר. בתוך התיקייה: תיקייה לכל כיתה, ובה תיקייה לכל תלמיד.
function historyClassFolder_(cls, create) {
  var id = PropertiesService.getScriptProperties().getProperty('HISTORY_FOLDER_ID');
  if (!id) return null;
  var root;
  try { root = DriveApp.getFolderById(String(id).trim()); } catch (e) { return null; }
  var label = cls === 'יא' ? 'כיתה י"א' : (cls === 'יב' ? 'כיתה י"ב' : 'כיתה ' + cls);
  var it = root.getFoldersByName(label);
  if (it.hasNext()) return it.next();
  return create ? root.createFolder(label) : null;
}
function findOrCreateIn_(folder, name) {
  var key = nameKey_(name);
  var it = folder.getFolders();
  while (it.hasNext()) { var f = it.next(); if (nameKey_(f.getName()) === key) return f; }
  return folder.createFolder(name);
}
// מספר הכיתה בשכבה ("3", או "יא3" / "י"א 3") -> "3"
function normSection_(v) {
  var m = String(v || '').replace(/["'׳״\s.-]/g, '').match(/([1-9])$/);
  return m ? m[1] : '';
}

// ---------- עבודות למורה אחרת (OTHER_TEACHER למעלה) ----------
function isOtherTeacher_(cls, section, subject) {
  return cls === OTHER_TEACHER.cls && OTHER_TEACHER.sections.indexOf(section) >= 0 &&
         OTHER_TEACHER.subjects.indexOf(subject) >= 0;
}
// בתוך התיקייה של המורה: תיקייה לכל כיתה ("כיתה י"א 3"), ובה תיקייה לכל תלמיד.
// בלי OTHER_TEACHER_FOLDER_ID - העבודה נשמרת כרגיל.
function otherTeacherFolder_(cls, section) {
  var id = PropertiesService.getScriptProperties().getProperty('OTHER_TEACHER_FOLDER_ID');
  if (!id) return null;
  var root;
  try { root = DriveApp.getFolderById(String(id).trim()); } catch (e) { return null; }
  var label = 'כיתה ' + (cls === 'יא' ? 'י"א' : 'י"ב') + ' ' + section;
  var it = root.getFoldersByName(label);
  return it.hasNext() ? it.next() : root.createFolder(label);
}
function otherTeacherEmail_() {
  var e = String(PropertiesService.getScriptProperties().getProperty('OTHER_TEACHER_EMAIL') || '').trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : '';
}

// ---------- סיכום יומי למורה האחרת ----------
// מפעילים כך: במאפייני הסקריפט OTHER_TEACHER_DIGEST = 1, ובעורך (שעון ⏰ "טריגרים") טריגר
// לפונקציה sendDailyDigest - "מבוסס זמן", "טיימר יומי", 20:00-21:00. ביום בלי הגשות - לא נשלח כלום.
function sendDailyDigest() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var keys = Object.keys(all).filter(function (k) { return k.indexOf('dg_') === 0; }).sort();
  if (!keys.length) return;
  var to = otherTeacherEmail_();
  if (to) {
    var byClass = {};
    keys.forEach(function (k) {
      var x; try { x = JSON.parse(all[k]); } catch (e) { return; }
      (byClass[x.c] = byClass[x.c] || []).push(x);
    });
    var lines = [];
    Object.keys(byClass).sort().forEach(function (c) {
      lines.push('כיתה ' + c + ':');
      byClass[c].forEach(function (x) {
        lines.push('• ' + x.n + ' - ' + x.t + (x.a ? ' (בדיקה אוטומטית: ' + x.a + ')' : '') + '\n  ' + x.u);
      });
      lines.push('');
    });
    var date = Utilities.formatDate(new Date(), TZ, DATE_FORMAT);
    MailApp.sendEmail({
      to: to,
      subject: 'הגשות של היום (' + date + ') - ' + keys.length + (keys.length === 1 ? ' עבודה' : ' עבודות'),
      body: 'אלה העבודות שהגיעו היום מהאתר:\n\n' + lines.join('\n') +
            '\nכל העבודות נמצאות גם בתיקייה המשותפת ב-Google Drive.'
    });
  }
  keys.forEach(function (k) { props.deleteProperty(k); });
}

function historyEmail_() {
  var e = String(PropertiesService.getScriptProperties().getProperty('HISTORY_TEACHER_EMAIL') || '').trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : '';
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
    var hf = historyClassFolder_(cls, false);   // הגשות בהיסטוריה (תיקייה נפרדת, משותפת עם מורה ההיסטוריה)
    if (hf) {
      collectFiles_(hf, cls, null, out, checked);
      var hit = hf.getFolders();
      while (hit.hasNext()) { var hs = hit.next(); collectFiles_(hs, cls, hs.getName(), out, checked); }
    }
  });
  var grades = gradeMap_();
  var hidden = hiddenMap_();
  var autos = autoMap_();
  out.forEach(function (x) {
    x.auto = (x.id && autos[x.id]) || null;
    var g = x.id && grades[x.id];
    x.grade = g ? g.g : '';
    x.comment = g ? g.c : '';
    x.hidden = !!(x.id && hidden[x.id]);
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
  if (/היסטוריה|לאומיות|סוציאליזם/.test(t)) return 'היסטוריה';
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

// ---------- בדיקה אוטומטית ----------
// auto_<מזהה הקובץ> = {c: נכונות, t: מתוך}. נשלח מהאתר יחד עם ההגשה.
function autoScore_(a) {
  if (!a) return null;
  var c = Math.floor(Number(a.correct)), t = Math.floor(Number(a.total));
  if (!(t > 0 && t <= 1000 && c >= 0 && c <= t)) return null;
  return { c: c, t: t };
}
function autoMap_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var map = {};
  Object.keys(props).forEach(function (k) {
    if (k.indexOf('auto_') !== 0) return;
    try { map[k.slice(5)] = JSON.parse(props[k]); } catch (e) {}
  });
  return map;
}

// ---------- הסתרת עבודה מהלוח ----------
// hid_<מזהה הקובץ> = 1. הקובץ עצמו לא נמחק מהדרייב, ואפשר להחזיר אותו ללוח.
function hiddenMap_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var map = {};
  Object.keys(props).forEach(function (k) { if (k.indexOf('hid_') === 0) map[k.slice(4)] = true; });
  return map;
}
function setHidden_(fileId, hidden) {
  if (!/^[\w-]{10,}$/.test(String(fileId || ''))) return { ok: false, error: 'מזהה קובץ לא תקין' };
  var props = PropertiesService.getScriptProperties();
  if (hidden) props.setProperty('hid_' + fileId, '1'); else props.deleteProperty('hid_' + fileId);
  return { ok: true, hidden: hidden };
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
// כמה קודים יכולים להיות פעילים במקביל - כל מורה והקוד שלו, ולכל קוד דף, נעילה ובקרה משלו.
// נשמרים במאפיין LESSONS: { "4821": { code, url, label, created, monitor, cls }, ... }.
// קוד שעברו עליו LESSON_HOURS שעות נמחק לבד.
function lessonAlive_(l) { return !!(l && l.code && Date.now() - l.created < LESSON_HOURS * 3600 * 1000); }
function lessonUntil_(l) { return l.created + LESSON_HOURS * 3600 * 1000; }
function lessons_() {
  var all = getJson_('LESSONS') || {};
  var old = getJson_('LESSON');   // קוד מהגרסה הקודמת, שבה היה רק קוד אחד
  if (old && old.code && !all[old.code]) all[old.code] = old;
  var out = {};
  Object.keys(all).forEach(function (c) { if (lessonAlive_(all[c])) out[c] = all[c]; });
  return out;
}
function saveLessons_(all) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('LESSONS', JSON.stringify(all));
  props.deleteProperty('LESSON');
}
function lessonsList_() {
  var all = lessons_();
  return Object.keys(all).map(function (c) {
    var l = all[c];
    return { code: l.code, url: l.url, label: l.label, monitor: !!l.monitor, cls: l.cls || '', created: l.created, until: lessonUntil_(l) };
  }).sort(function (a, b) { return b.created - a.created; });
}

function createLesson_(url, label, monitor, cls) {
  url = String(url || '').trim();
  if (!/^[\w.-]+\.html(#[\w-]+)?$/.test(url)) return { ok: false, error: 'כתובת עמוד לא תקינה' };
  cls = normClass_(cls);
  if (monitor && MONITOR_CLASSES.indexOf(cls) < 0) return { ok: false, error: 'בקרת שיעור פעילה כרגע רק לכיתה י"א' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var all = lessons_();
    var code;
    do { code = String(Math.floor(1000 + Math.random() * 9000)); } while (all[code]);
    var lesson = { code: code, url: url, label: clean_(label).slice(0, 120), created: Date.now(),
                   monitor: !!monitor, cls: monitor ? cls : '' };
    all[code] = lesson;
    saveLessons_(all);
    return { ok: true, code: code, url: url, label: lesson.label, monitor: lesson.monitor, until: lessonUntil_(lesson) };
  } finally {
    lock.releaseLock();
  }
}

// ביטול קוד אחד. בלי קוד (גרסה ישנה של האתר) - מבטלים את כל הקודים.
function clearLesson_(code) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var all = lessons_();
    if (code) delete all[String(code)];
    else all = {};
    saveLessons_(all);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function findLesson_(code) {
  var l = lessons_()[String(code || '')];
  if (l) {
    return { ok: true, url: l.url, label: l.label, monitor: !!l.monitor, cls: l.cls || '', until: lessonUntil_(l) };
  }
  return { ok: false, error: 'הקוד לא נמצא' };
}

// דף שיש לו קוד פעיל נפתח רק למי שנכנס עם אחד הקודים של אותו דף. שאר הדפים פתוחים.
// הקוד עצמו לא נשלח לדף - רק אם הדף נעול או לא.
function lessonLock_(page, code) {
  var all = lessons_();
  page = String(page || '');
  var here = Object.keys(all).map(function (c) { return all[c]; })
    .filter(function (l) { return String(l.url || '').split('#')[0] === page; });
  if (!here.length) return { ok: true, locked: false, lessonPage: '' };
  var until = Math.max.apply(null, here.map(lessonUntil_));
  var locked = !here.some(function (l) { return l.code === String(code || ''); });
  return { ok: true, locked: locked, lessonPage: page, until: until };
}

// ---------- בקרת שיעור ----------
// כל דף באתר שנפתח בזמן שיעור עם בקרה מדווח: "in" (התלמיד בדף), "out" (יצא מהדף),
// "bye" (יצא ממצב שיעור). שומרים רק בזיכרון זמני (CacheService) - נמחק לבד אחרי 6 שעות.
function monitoredLesson_(code) {
  var l = lessons_()[String(code || '')];
  return (l && l.monitor) ? l : null;
}

function presence_(d) {
  var l = monitoredLesson_(d.code);
  if (!l) return { ok: false, ended: true };
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
    var act = getJson_('ACTIVITY');
    return { ok: true, leaves: p.leaves, act: (act && act.open) ? { id: act.id, prompt: act.prompt } : null };
  } finally {
    lock.releaseLock();
  }
}

// code - איזה שיעור להציג. בלי קוד (או קוד שכבר לא פעיל) - השיעור עם הבקרה שנוצר אחרון.
// lessons - כל השיעורים הפעילים עם בקרה, כדי שהמורה יוכל לבחור ביניהם.
function presenceList_(code) {
  var mon = lessonsList_().filter(function (x) { return x.monitor; });
  var pick = mon.filter(function (x) { return x.code === String(code || ''); })[0] || mon[0];
  var l = pick ? lessons_()[pick.code] : null;
  if (!l) return { ok: true, lesson: null, lessons: [], students: [] };
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
  return { ok: true, lesson: { code: l.code, label: l.label, url: l.url, cls: l.cls },
           lessons: mon.map(function (x) { return { code: x.code, label: x.label }; }), students: out };
}

// ---------- לוח שאלות ----------
// כל שאלה נשמרת במאפיין נפרד: qb_<דף>_<מזהה>
function qbBoard_(board) {
  board = String(board || '');
  if (QBOARDS.indexOf(board) !== -1) return board;
  if (/^d[a-z0-9]{4,14}$/.test(board) && qbBoardsList_().some(function (b) { return b.id === board; })) return board;
  return '';
}
// לוח פתוח לכתיבה רק כשהוא הלוח הפעיל בסרגל.
function qbIsOpen_(board) {
  var a = getJson_('QB_ACTIVE');
  return !!(a && a.id === board);
}
function qbBoardsList_() { return getJson_('QB_LIST') || []; }
function boardOpen_(title, page) {
  title = clean_(title).slice(0, 120);
  if (title.length < 2) return { ok: false, error: 'כתבו כותרת ללוח.' };
  page = String(page || '').slice(0, 80);
  if (!/^[\w.-]+\.html$/.test(page)) page = '';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var b = { id: 'd' + Date.now().toString(36), title: title, page: page, created: Date.now() };
    var list = [b].concat(qbBoardsList_());
    list.slice(QB_KEEP).forEach(function (old) {          // לוחות ישנים מאוד - נמחקים עם השאלות שלהם
      Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf('qb_' + old.id + '_') === 0) props.deleteProperty(k); });
    });
    props.setProperty('QB_LIST', JSON.stringify(list.slice(0, QB_KEEP)));
    props.setProperty('QB_ACTIVE', JSON.stringify({ id: b.id, title: b.title }));
    return { ok: true, board: b };
  } finally {
    lock.releaseLock();
  }
}
function boardSet_(id, open) {
  var props = PropertiesService.getScriptProperties();
  if (!open) { props.deleteProperty('QB_ACTIVE'); return { ok: true, active: null }; }
  id = qbBoard_(id);
  if (!id) return { ok: false, error: 'הלוח לא נמצא' };
  var b = qbBoardsList_().concat(QBOARD_TITLES).filter(function (x) { return x.id === id; })[0] || { id: id, title: 'לוח שאלות' };
  props.setProperty('QB_ACTIVE', JSON.stringify({ id: b.id, title: b.title }));
  return { ok: true, active: { id: b.id, title: b.title } };
}
// מה פתוח עכשיו לתלמידים - הסרגל בודק את זה כל כמה שניות
function dockState_() {
  var b = getJson_('QB_ACTIVE'), a = getJson_('ACTIVITY');
  return { ok: true,
           board: b ? { id: b.id, title: b.title } : null,
           activity: (a && a.open) ? { id: a.id, type: a.type, prompt: a.prompt } : null };
}
function qbItems_(board) {
  var props = PropertiesService.getScriptProperties().getProperties();
  var prefix = 'qb_' + board + '_';
  var out = [];
  Object.keys(props).forEach(function (k) {
    if (k.indexOf(prefix) !== 0) return;
    try {
      var v = JSON.parse(props[k]);
      out.push({ id: k.slice(prefix.length), name: v.n || '', text: v.q || '', t: v.t || 0, likes: v.l || 0, done: !!v.d });
    } catch (e) {}
  });
  out.sort(function (a, b) { return b.t - a.t; });
  return out;
}
function qbList_(board) {
  board = qbBoard_(board);
  if (!board) return { ok: false, error: 'אין לוח שאלות בדף הזה' };
  return { ok: true, items: qbItems_(board), open: qbIsOpen_(board), now: Date.now() };
}
function qbAdd_(d) {
  var board = qbBoard_(d.board);
  if (!board) return { ok: false, error: 'אין לוח שאלות בדף הזה' };
  var name = clean_(d.name).slice(0, 40);
  var text = clean_(d.text).slice(0, QB_MAX_LEN);
  if (name.length < 2) return { ok: false, error: 'כתבו את השם שלכם.' };
  if (text.length < 4) return { ok: false, error: 'כתבו שאלה.' };
  if (!qbIsOpen_(board)) return { ok: false, closed: true, error: 'המורה סגר את הלוח.' };
  var cache = CacheService.getScriptCache();
  var burst = Number(cache.get('qbBurst_' + board) || 0);
  if (burst >= 60) return { ok: false, error: 'נשלחו הרבה שאלות בבת אחת. נסו שוב בעוד דקה.' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, error: 'השרת עמוס. נסו שוב.' };
  try {
    if (qbItems_(board).length >= QB_MAX_ITEMS) return { ok: false, error: 'הלוח מלא. בקשו מהמורה לפנות מקום.' };
    var id = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
    var item = { n: name, q: text, t: Date.now(), l: 0, d: false };
    PropertiesService.getScriptProperties().setProperty('qb_' + board + '_' + id, JSON.stringify(item));
    cache.put('qbBurst_' + board, String(burst + 1), 60);
    return { ok: true, item: { id: id, name: name, text: text, t: item.t, likes: 0, done: false } };
  } finally {
    lock.releaseLock();
  }
}
function qbUpdate_(board, id, fn) {
  board = qbBoard_(board);
  id = String(id || '').replace(/[^a-z0-9]/g, '');
  if (!board || !id) return { ok: false, error: 'שאלה לא נמצאה' };
  var key = 'qb_' + board + '_' + id;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, error: 'השרת עמוס. נסו שוב.' };
  try {
    var props = PropertiesService.getScriptProperties();
    var v = props.getProperty(key);
    if (!v) return { ok: false, gone: true, error: 'השאלה כבר לא בלוח' };
    var item = JSON.parse(v);
    if (fn(item) === 'delete') { props.deleteProperty(key); return { ok: true }; }
    props.setProperty(key, JSON.stringify(item));
    return { ok: true, likes: item.l || 0, done: !!item.d };
  } finally {
    lock.releaseLock();
  }
}
function qbLike_(board, id) { return qbUpdate_(board, id, function (it) { it.l = (it.l || 0) + 1; }); }
function qbMark_(board, id, done) { return qbUpdate_(board, id, function (it) { it.d = done; }); }
function qbDelete_(board, id) { return qbUpdate_(board, id, function () { return 'delete'; }); }

// ---------- פעילות חיה (ענן מילים / הצבעה) ----------
// הפעילות עצמה במאפיין ACTIVITY, וכל תשובה במאפיין נפרד: ar_<פעילות>_<תלמיד>
function actPublic_(a) {
  return { id: a.id, type: a.type, prompt: a.prompt, options: a.options || [], questions: a.questions || [],
           anonymous: !!a.anonymous, open: !!a.open, created: a.created };
}
function actResponses_(a) {
  var props = PropertiesService.getScriptProperties().getProperties();
  var prefix = 'ar_' + a.id + '_';
  var out = [];
  Object.keys(props).forEach(function (k) {
    if (k.indexOf(prefix) !== 0) return;
    try { var v = JSON.parse(props[k]); v.sid = k.slice(prefix.length); out.push(v); } catch (e) {}
  });
  out.sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
  return out;
}
function actWordKey_(w) {
  return String(w || '').replace(/[\u0591-\u05C7]/g, '').replace(/["'״׳.,!?;:()\-–—]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}
function actResults_(a, withNames) {
  var list = actResponses_(a);
  if (a.type === 'cloud') {
    var map = {}, order = [];
    list.forEach(function (r) {
      (r.v || []).forEach(function (w) {
        var k = actWordKey_(w);
        if (!k) return;
        if (!map[k]) { map[k] = { w: w, c: 0 }; order.push(k); }
        map[k].c++;
      });
    });
    var words = order.map(function (k) { return map[k]; }).sort(function (x, y) { return y.c - x.c; });
    var res = { count: list.length, words: words };
    if (withNames) res.people = list.map(function (r) { return { name: r.n, words: r.v || [] }; });
    return res;
  }
  if (a.type === 'survey') {
    var named = withNames && !a.anonymous;
    var qs = (a.questions || []).map(function (q, qi) {
      var r = { kind: q.kind, answered: 0 };
      if (q.kind === 'choice') r.counts = q.options.map(function () { return 0; });
      if (q.kind === 'scale') { r.counts = [0, 0, 0, 0, 0]; r.sum = 0; }
      if (q.kind === 'text') r.texts = [];
      list.forEach(function (resp) {
        var v = (resp.v || [])[qi];
        if (v === null || v === undefined || v === '') return;
        r.answered++;
        if (q.kind === 'choice' && v >= 0 && v < r.counts.length) r.counts[v]++;
        if (q.kind === 'scale' && v >= 1 && v <= 5) { r.counts[v - 1]++; r.sum += v; }
        if (q.kind === 'text') { var x = { t: String(v) }; if (named) x.n = resp.n; r.texts.push(x); }
      });
      if (q.kind === 'scale') r.avg = r.answered ? Math.round(r.sum / r.answered * 10) / 10 : 0;
      if (r.texts) r.texts = r.texts.reverse().slice(0, 80);
      return r;
    });
    var sres = { count: list.length, questions: qs };
    if (named) sres.people = list.map(function (resp) { return { name: resp.n }; });
    return sres;
  }
  var counts = (a.options || []).map(function () { return 0; });
  var reasons = [];
  list.forEach(function (r) {
    if (r.v >= 0 && r.v < counts.length) counts[r.v]++;
    if (r.r) { var x = { o: r.v, r: r.r }; if (withNames) x.n = r.n; reasons.push(x); }
  });
  var out = { count: list.length, counts: counts, reasons: reasons.reverse().slice(0, 60) };
  if (withNames) out.people = list.map(function (r) { return { name: r.n, o: r.v }; });
  return out;
}
function actCurrent_() {
  var a = getJson_('ACTIVITY');
  if (!a) return { ok: true, activity: null };
  return { ok: true, activity: actPublic_(a), results: actResults_(a, false) };
}
function actTeacher_() {
  var a = getJson_('ACTIVITY');
  if (!a) return { ok: true, activity: null };
  return { ok: true, activity: actPublic_(a), results: actResults_(a, true) };
}
function actRespond_(d) {
  var a = getJson_('ACTIVITY');
  if (!a || String(d.id || '') !== a.id) return { ok: false, ended: true, error: 'הפעילות הזאת כבר הסתיימה.' };
  if (!a.open) return { ok: false, closed: true, error: 'המורה סגר את התשובות.' };
  var sid = String(d.sid || '').replace(/[^\w-]/g, '').slice(0, 40);
  var name = a.anonymous ? '' : clean_(d.name).slice(0, 40);
  if (!sid) return { ok: false, error: 'חסר מזהה' };
  if (!a.anonymous && name.length < 2) return { ok: false, error: 'כתבו את השם שלכם.' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, error: 'השרת עמוס. נסו שוב.' };
  try {
    var props = PropertiesService.getScriptProperties();
    var key = 'ar_' + a.id + '_' + sid;
    var prev = null;
    try { prev = JSON.parse(props.getProperty(key) || 'null'); } catch (e) {}
    var item = { n: name, t: Date.now() };
    if (a.type === 'survey') {
      var given = d.answers || [];
      var answers = (a.questions || []).map(function (q, qi) {
        var v = given[qi];
        if (v === null || v === undefined || v === '') return null;
        if (q.kind === 'choice') { v = Number(v); return (v >= 0 && v < q.options.length && Math.floor(v) === v) ? v : null; }
        if (q.kind === 'scale') { v = Number(v); return (v >= 1 && v <= 5 && Math.floor(v) === v) ? v : null; }
        v = clean_(v).slice(0, 300);
        return v || null;
      });
      if (!answers.some(function (x) { return x !== null; })) return { ok: false, error: 'ענו לפחות על שאלה אחת.' };
      item.v = answers;
    } else if (a.type === 'cloud') {
      var w = clean_(d.word).slice(0, 25);
      if (!actWordKey_(w)) return { ok: false, error: 'כתבו מילה.' };
      var words = (prev && prev.v) || [];
      if (words.some(function (x) { return actWordKey_(x) === actWordKey_(w); })) return { ok: false, error: 'כבר כתבתם את המילה הזאת.' };
      if (words.length >= 3) return { ok: false, error: 'אפשר לכתוב עד 3 מילים.' };
      words.push(w);
      item.v = words;
    } else {
      var v = Number(d.option);
      if (!(v >= 0 && v < (a.options || []).length) || Math.floor(v) !== v) return { ok: false, error: 'בחרו תשובה.' };
      item.v = v;
      item.r = clean_(d.reason).slice(0, 140);
    }
    props.setProperty(key, JSON.stringify(item));
    return { ok: true, mine: item.v, reason: item.r || '', results: actResults_(a, false) };

  } finally {
    lock.releaseLock();
  }
}
function actDeleteResponses_() {
  var props = PropertiesService.getScriptProperties();
  Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf('ar_') === 0) props.deleteProperty(k); });
}
function actStart_(type, prompt, options, questions, anonymous) {
  type = (type === 'poll' || type === 'survey') ? type : 'cloud';
  prompt = clean_(prompt).slice(0, 160);
  if (prompt.length < 3) return { ok: false, error: type === 'survey' ? 'כתבו כותרת לסקר.' : 'כתבו את השאלה לתלמידים.' };
  var qs = [];
  if (type === 'survey') {
    qs = (questions || []).slice(0, 8).map(function (q) {
      var kind = (q && (q.kind === 'choice' || q.kind === 'scale')) ? q.kind : 'text';
      var item = { q: clean_(q && q.q).slice(0, 160), kind: kind };
      if (kind === 'choice') item.options = ((q && q.options) || []).map(function (o) { return clean_(o).slice(0, 40); }).filter(function (o) { return o; }).slice(0, 6);
      return item;
    }).filter(function (q) { return q.q && (q.kind !== 'choice' || q.options.length >= 2); });
    if (!qs.length) return { ok: false, error: 'הוסיפו לפחות שאלה אחת (בשאלת בחירה - לפחות שתי אפשרויות).' };
  }
  var opts = [];
  if (type === 'poll') {
    opts = (options || []).map(function (o) { return clean_(o).slice(0, 40); }).filter(function (o) { return o; }).slice(0, 4);
    if (opts.length < 2) return { ok: false, error: 'צריך לפחות שתי אפשרויות להצבעה.' };
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    actDeleteResponses_();
    var a = { id: Date.now().toString(36), type: type, prompt: prompt, options: opts, questions: qs,
              anonymous: type === 'survey' && !!anonymous, open: true, created: Date.now() };
    PropertiesService.getScriptProperties().setProperty('ACTIVITY', JSON.stringify(a));
    return { ok: true, activity: actPublic_(a), results: actResults_(a, true) };
  } finally {
    lock.releaseLock();
  }
}
function actOpen_(open) {
  var a = getJson_('ACTIVITY');
  if (!a) return { ok: false, error: 'אין פעילות פעילה' };
  a.open = open;
  PropertiesService.getScriptProperties().setProperty('ACTIVITY', JSON.stringify(a));
  return { ok: true, activity: actPublic_(a) };
}
function actClear_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    actDeleteResponses_();
    PropertiesService.getScriptProperties().deleteProperty('ACTIVITY');
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
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
  var v = String(c || '').replace(/["'׳״\s.-]/g, '').replace(/[0-9]+$/, '');
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
