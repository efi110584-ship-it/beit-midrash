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
 * 10. לוח מבחנים: המורה מפרסם מבחנים (כיתה, מקצוע, חומר, תאריך) מהאזור האישי,
 *    והם מופיעים בדף הבית אצל התלמידים של אותה כיתה עד יום המבחן (כולל). מבחן שעבר נמחק לבד.
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
var MONITOR_CLASSES = ['יא', 'יב'];
// עבודות שמגיעות למורה אחרת (התיקייה והמייל שלה - במאפייני הסקריפט:
// OTHER_TEACHER_FOLDER_ID ו-OTHER_TEACHER_EMAIL). רק אצלה - לא בלוח ההגשות.
// אפשר גם סיכום אחד בערב במקום מייל על כל הגשה (OTHER_TEACHER_DIGEST, ראו sendDailyDigest).
var OTHER_TEACHER = { cls: 'יא', sections: ['1', '3'], subjects: ['תנ"ך', 'תושב"ע'] };
// עבודות תושב"ע (לקט מצוות) של י"א 2 - לכתובת נפרדת. במאפייני הסקריפט:
// YA2_TSB_EMAIL (המייל) ו-YA2_TSB_FOLDER_ID (תיקייה בדרייב, לא חובה).
// בלי תיקייה - העבודה נשמרת כרגיל ומופיעה בלוח ההגשות, ורק המייל עליה נשלח לכתובת הזו.
var YA2_TSB = { cls: 'יא', sections: ['2'], subjects: ['תושב"ע'] };
var AWAY_GRACE_SEC = 3;            // יציאה קצרה מזה (מעבר בין דפים באתר) לא נספרת
var GONE_AFTER_SEC = 75;           // תלמיד שלא דיווח זמן כזה - "לא מחובר" (התלמיד מדווח כל 30 שניות)
var PRES_LOG_MAX = 20;             // כמה אירועים אחרונים נשמרים לכל תלמיד (יציאות, הדבקות, כניסה)

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
    if (p.action === 'exams') return json_({ ok: true, exams: examsUpcoming_() });
    if (p.action === 'lesson') return json_(findLesson_(p.code));
    if (p.action === 'lessonLock') return json_(lessonLock_(p.page, p.code));
    if (p.action === 'batchReviewStatus') return json_({ok:true,batchReview:1,maxBatch:30,approval:'teacher_only'});
    if (p.action === 'feedback') return json_(feedbackPublic_(p.id));
    if (p.action === 'qbList') return json_(qbList_(p.board));
    if (p.action === 'actCurrent') return json_(actCurrent_(p.room, p.exact === '1'));
    if (p.action === 'dockState') return json_(dockState_(p.room, p.exact === '1'));
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
      case 'list':            return json_({ ok: true, submissions: listSubmissions_(data.fresh === true) });
      case 'markChecked':     return json_(markChecked_(data.fileId, data.checked !== false));
      case 'setAnnouncement': return json_(setAnnouncement_(data.text));
      case 'examSave':        return json_(examSave_(data));
      case 'examDelete':      return json_(examDelete_(data.id));
      case 'createLesson':    return json_(createLesson_(data.url, data.label, data.monitor === true, data.cls));
      case 'presenceList':    return json_(presenceList_(data.code));
      case 'clearLesson':     return json_(clearLesson_(data.code));
      case 'lessonNav':       return json_(lessonNav_(data.code, data.url, data.label));
      case 'lessonsList':     return json_({ ok: true, lessons: lessonsList_() });
      case 'setGrade':        return json_(setGrade_(data.fileId, data.grade, data.comment, data.publishFb));
      case 'acceptSuggested': return json_(acceptSuggested_(data.ids));
      case 'feedbackGet':     return json_(feedbackTeacher_(data.fileId));
      case 'feedbackBatchPreview': return json_(feedbackBatchPreview_(data.ids));
      case 'approveFeedbackBatch': return json_(approveFeedbackBatch_(data.entries, data.confirmed === true));
      case 'setHidden':       return json_(setHidden_(data.fileId, data.hidden === true));
      case 'qbDelete':        return json_(qbDelete_(data.board, data.id));
      case 'qbMark':          return json_(qbMark_(data.board, data.id, data.done === true));
      case 'actStart':        return json_(actStart_(data.type, data.prompt, data.options, data.questions, data.anonymous === true, data.room));
      case 'actOpen':         return json_(actOpen_(data.open === true, data.room));
      case 'actClear':        return json_(actClear_(data.room));
      case 'actResults':      return json_(actTeacher_(data.room));
      case 'boardOpen':       return json_(boardOpen_(data.title, data.page, data.room));
      case 'boardSet':        return json_(boardSet_(data.id, data.open === true, data.room));
      case 'boardList':       return json_({ ok: true, boards: qbBoardsList_().concat(QBOARD_TITLES), active: qbActives_()[liveRoom_(data.room)] || null });
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
    var ya2 = !histFolder && !otherFolder && matchesRoute_(YA2_TSB, cls, section, subject);
    var ya2Folder = ya2 ? otherTeacherFolder_(cls, section, 'YA2_TSB_FOLDER_ID') : null;
    if (ya2Folder) otherFolder = ya2Folder;
    var routed = histFolder || otherFolder;
    var classFolder = routed || DriveApp.getFolderById(CLASS_FOLDERS[cls]);
    var studentFolder = routed ? findOrCreateIn_(routed, name) : findOrCreateStudentFolder_(classFolder, name);
    var date = Utilities.formatDate(new Date(), TZ, DATE_FORMAT);
    var fileName = safe_(name + ' - ' + task + ' - ' + date) + extension_(d.fileName, d.fileMimeType);
    file = studentFolder.createFile(Utilities.newBlob(bytes, d.fileMimeType || 'application/octet-stream', fileName));
    if (d.notes) file.setDescription('הערות: ' + clean_(d.notes));
    // ללוח ההגשות (אצל המורה האחרת הקובץ לא מופיע בלוח, ולכן גם לא במטמון)
    if (!otherFolder) subsCacheAdd_(subsEntry_(file, cls, studentFolder.getName(), null));
  } finally {
    lock.releaseLock();
  }
  var auto = autoScore_(d.autoScore);
  if (auto) PropertiesService.getScriptProperties().setProperty('auto_' + file.getId(), JSON.stringify(auto));

  // למורה האחרת - כשהסיכום היומי מופעל (OTHER_TEACHER_DIGEST = 1): לא מייל על כל הגשה,
  // אלא מייל אחד בערב עם כל ההגשות של היום (sendDailyDigest). אחרת - מייל רגיל על כל הגשה.
  if (otherFolder && !ya2 && PropertiesService.getScriptProperties().getProperty('OTHER_TEACHER_DIGEST') === '1') {
    PropertiesService.getScriptProperties().setProperty('dg_' + Date.now() + '_' + Math.floor(Math.random() * 1e6), JSON.stringify({
      n: name, c: (cls === 'יא' ? 'י"א' : 'י"ב') + (section ? ' ' + section : ''), t: task, u: file.getUrl(),
      a: auto ? auto.c + '/' + auto.t : ''
    }));
  } else if (NOTIFY_BY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: (histFolder && historyEmail_()) || (ya2 && propEmail_('YA2_TSB_EMAIL')) || (otherFolder && otherTeacherEmail_()) || Session.getEffectiveUser().getEmail(),
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
  return matchesRoute_(OTHER_TEACHER, cls, section, subject);
}
function matchesRoute_(r, cls, section, subject) {
  return cls === r.cls && r.sections.indexOf(section) >= 0 && r.subjects.indexOf(subject) >= 0;
}
// בתוך התיקייה של המורה: תיקייה לכל כיתה ("כיתה י"א 3"), ובה תיקייה לכל תלמיד.
// בלי OTHER_TEACHER_FOLDER_ID - העבודה נשמרת כרגיל.
function otherTeacherFolder_(cls, section, prop) {
  var id = PropertiesService.getScriptProperties().getProperty(prop || 'OTHER_TEACHER_FOLDER_ID');
  if (!id) return null;
  var root;
  try { root = DriveApp.getFolderById(String(id).trim()); } catch (e) { return null; }
  var label = 'כיתה ' + (cls === 'יא' ? 'י"א' : 'י"ב') + ' ' + section;
  var it = root.getFoldersByName(label);
  return it.hasNext() ? it.next() : root.createFolder(label);
}
// הגדרה של הכתובת ל"תושב"ע י"א 2" - כשמסך "מאפייני סקריפט" נעול (יותר מ-50 מאפיינים, בגלל הציונים).
// כותבים את המייל בין המירכאות, שומרים, בוחרים בתפריט שלמעלה את setYa2TsbEmail ולוחצים "הפעלה".
// אפשר גם תיקייה (לא חובה). אחרי ההפעלה הכתובת שמורה, ואפשר למחוק אותה מכאן.
function setYa2TsbEmail() {
  var email = '';      // ← המייל, למשל 'name@gmail.com'
  var folderId = '';   // ← לא חובה: הקוד של התיקייה בדרייב (מה שבא אחרי /folders/ בכתובת)
  var props = PropertiesService.getScriptProperties();
  email = String(email).trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { Logger.log('❌ לא נשמר: כתבו מייל תקין בין המירכאות'); return; }
  props.setProperty('YA2_TSB_EMAIL', email);
  if (String(folderId).trim()) props.setProperty('YA2_TSB_FOLDER_ID', String(folderId).trim());
  Logger.log('✓ נשמר: עבודות תושב"ע של י"א 2 יישלחו ל-' + email + (String(folderId).trim() ? ' (ויישמרו בתיקייה)' : ''));
}

function otherTeacherEmail_() { return propEmail_('OTHER_TEACHER_EMAIL'); }
function propEmail_(prop) {
  var e = String(PropertiesService.getScriptProperties().getProperty(prop) || '').trim();
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
// מעבר על כל תיקיות התלמידים ב-Drive איטי (כל קובץ - כמה קריאות ל-Drive). לכן התוצאה נשמרת
// במטמון (CacheService) עד 6 שעות, וכל הגשה חדשה נוספת אליו מיד (subsCacheAdd_). מעבר מלא -
// רק כשהמטמון ריק או כשהמורה לוחץ "רענון" בלוח (fresh). הציונים, "נבדק", ההסתרה והמשובים
// נקראים בכל פעם מחדש, ולכן תמיד מעודכנים.
var SUBS_CACHE = 'subs_v1', SUBS_TTL = 21600, SUBS_CHUNK = 40000;
function subsCacheGet_() {
  var c = CacheService.getScriptCache();
  var n = Number(c.get(SUBS_CACHE + '_n'));
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(SUBS_CACHE + '_' + i);
  var got = c.getAll(keys), s = '';
  for (i = 0; i < n; i++) { if (got[keys[i]] == null) return null; s += got[keys[i]]; }
  try { return JSON.parse(s); } catch (e) { return null; }
}
function subsCachePut_(list) {
  var s = JSON.stringify(list), map = {}, n = Math.max(1, Math.ceil(s.length / SUBS_CHUNK));
  for (var i = 0; i < n; i++) map[SUBS_CACHE + '_' + i] = s.slice(i * SUBS_CHUNK, (i + 1) * SUBS_CHUNK);
  map[SUBS_CACHE + '_n'] = String(n);
  try { CacheService.getScriptCache().putAll(map, SUBS_TTL); } catch (e) { /* בלי מטמון - פשוט איטי יותר */ }
}
// הגשה חדשה: נכנסת לראש הרשימה שבמטמון (אם יש), ושורת "לא הוגש" של אותה מטלה יורדת
function subsCacheAdd_(entry) {
  var list = subsCacheGet_();
  if (!list) return;
  var ns = normName_(entry.student), nt = normTask_(entry.task);
  list = list.filter(function (x) {
    return !(x.status === 'missing' && x.cls === entry.cls && normName_(x.student) === ns && normTask_(x.task) === nt);
  });
  list.unshift(entry);
  subsCachePut_(list);
}
function listSubmissions_(fresh) {
  var out = fresh ? null : subsCacheGet_();
  if (!out) { out = scanSubmissions_(); subsCachePut_(out); }
  var props = PropertiesService.getScriptProperties().getProperties();   // קריאה אחת לכל המאפיינים
  var checked = checkedMap_(props), grades = gradeMap_(props), hidden = hiddenMap_(props), autos = autoMap_(props);
  var fbs = feedbackIndex_(props, fresh);   // "רענון" - גם ציונים חדשים מהבדיקה עם Claude, בלי לחכות
  out.forEach(function (x) {
    if (x.status !== 'missing') x.status = checked[x.id] ? 'checked' : 'pending';
    x.auto = (x.id && autos[x.id]) || null;
    x.fb = (x.id && fbs.st[x.id]) || '';
    x.fbg = (x.id && fbs.g[x.id]) || '';
    var g = x.id && grades[x.id];
    x.grade = g ? g.g : '';
    x.comment = g ? g.c : '';
    x.hidden = !!(x.id && hidden[x.id]);
  });
  out.sort(function (a, b) { return b.time - a.time; });
  return out;
}
// להפעלה מטריגר זמן (כל 10 דקות, מוגדר ידנית בעורך: טריגרים ← הוספת טריגר ← keepWarm).
// שומר את הסקריפט "ער" כדי שיענה מהר יותר, ומכין מראש את רשימת ההגשות כשהמטמון התרוקן.
function keepWarm() {
  if (!subsCacheGet_()) subsCachePut_(scanSubmissions_());
}
function scanSubmissions_() {
  var checked = {};
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
  return out;
}

function collectFiles_(folder, cls, studentName, out, checked) {
  var it = folder.getFiles();
  while (it.hasNext()) out.push(subsEntry_(it.next(), cls, studentName, checked));
}
function subsEntry_(f, cls, studentName, checked) {
  var p = parseName_(f.getName());
  var created = f.getDateCreated();
  var task = p.task || p.raw;
  return {
    id: f.getId(),
    student: studentName || p.student || '',
    task: task,
    subject: subjectOf_(task),
    cls: cls,
    date: p.date || Utilities.formatDate(created, TZ, DATE_FORMAT),
    time: created.getTime(),
    status: checked && checked[f.getId()] ? 'checked' : 'pending',
    url: f.getUrl(),
    notes: f.getDescription() || ''
  };
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
  if (/פתוח תפתח/.test(t)) return 'תנ"ך';   // יחידת תנ"ך (שאלון 2371), למרות שהנושאים בה הם מצוות
  if (/עברית|דקדוק|גזר|בניין|בנינים|משקל|שורש|נחי|חפנ|חפיצ|כפולים|שלמים/.test(t)) return 'עברית';
  if (/תושבע|מצוו|לקט|הלכ|אהבת|גרים/.test(t)) return 'תושב"ע';
  return 'תנ"ך';
}

function checkedMap_(props) {
  props = props || PropertiesService.getScriptProperties().getProperties();
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
function autoMap_(props) {
  props = props || PropertiesService.getScriptProperties().getProperties();
  var map = {};
  Object.keys(props).forEach(function (k) {
    if (k.indexOf('auto_') !== 0) return;
    try { map[k.slice(5)] = JSON.parse(props[k]); } catch (e) {}
  });
  return map;
}

// ---------- הסתרת עבודה מהלוח ----------
// hid_<מזהה הקובץ> = 1. הקובץ עצמו לא נמחק מהדרייב, ואפשר להחזיר אותו ללוח.
function hiddenMap_(props) {
  props = props || PropertiesService.getScriptProperties().getProperties();
  var map = {};
  Object.keys(props).forEach(function (k) { if (k.indexOf('hid_') === 0) map[k.slice(4)] = true; });
  return map;
}
function setHiddenUnlocked_(fileId, hidden) {
  if (!/^[\w-]{10,}$/.test(String(fileId || ''))) return { ok: false, error: 'מזהה קובץ לא תקין' };
  var props = PropertiesService.getScriptProperties();
  if (hidden) props.setProperty('hid_' + fileId, '1'); else props.deleteProperty('hid_' + fileId);
  return { ok: true, hidden: hidden };
}

// ---------- ציונים ----------
// נשמרים במאפייני הסקריפט, ליד הסימון "נבדק": grade_<מזהה הקובץ> = {g: ציון, c: הערה}
function gradeMap_(props) {
  props = props || PropertiesService.getScriptProperties().getProperties();
  var map = {};
  Object.keys(props).forEach(function (k) {
    if (k.indexOf('grade_') !== 0) return;
    try { map[k.slice(6)] = JSON.parse(props[k]); } catch (e) { /* ערך פגום - מדלגים */ }
  });
  return map;
}

// publishFb: true - המשוב המפורט (fb_<מזהה>.json) נחשף לתלמיד; false - מוסתר; בלי - לא משתנה
function setGradeUnlocked_(fileId, grade, comment, publishFb) {
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
  if (publishFb === true) props.setProperty('fbpub_' + fileId, '1');
  if (publishFb === false) props.deleteProperty('fbpub_' + fileId);
  return { ok: true, grade: g, comment: c, fbPublished: props.getProperty('fbpub_' + fileId) === '1' };
}

// רישום הציונים שהבדיקה עם Claude הציעה (fb_<מזהה>.json) כציון בלוח ההגשות - לכמה עבודות בבת אחת.
// רק לעבודות שעוד אין להן ציון. המשוב לא נשלח לתלמיד (את זה עושים ב"📨 שליחה").
function acceptSuggestedUnlocked_(ids) {
  ids = (ids || []).map(String).filter(function (id) { return /^[\w-]{10,}$/.test(id); }).slice(0, 300);
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var fbs = feedbackIndex_(all, true), grades = gradeMap_(all);
  var done = {};
  ids.forEach(function (id) {
    var g = fbs.g[id];
    if (!batchReviewCheck_(feedbackRead_(id)).ready) return;
    if (g == null || g === '' || (grades[id] && grades[id].g !== '')) return;
    props.setProperty('grade_' + id, JSON.stringify({ g: String(g), c: (grades[id] && grades[id].c) || '', t: Date.now() }));
    props.setProperty('chk_' + id, '1');
    done[id] = String(g);
  });
  return { ok: true, grades: done, n: Object.keys(done).length };
}

// ---------- משוב מפורט לתלמיד ----------
// המשוב (ציון מוצע, סיכום והסבר לכל שאלה) נשמר כקובץ טקסט ב-Drive בשם fb_<מזהה העבודה>.json.
// התלמיד רואה אותו רק אחרי שהמורה אישר בלוח ההגשות (fbpub_<מזהה> = 1), עם הציון שהמורה שמר.
// התלמיד ניגש לפי מזהה העבודה - הוא נשמר רק במכשיר שממנו נשלחה העבודה, או בקישור שהמורה שולח.
function feedbackFile_(id) {
  if (!/^[\w-]{10,}$/.test(String(id || ''))) return null;
  var it = DriveApp.getFilesByName('fb_' + id + '.json');
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) return f; }
  return null;
}
function feedbackRead_(id) {
  var f = feedbackFile_(id);
  if (!f) return null;
  try {
    var fb = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
    return (fb && fb.fileId === id) ? fb : null;
  } catch (e) { return null; }
}
// אילו עבודות יש להן משוב: { st: { מזהה: 'draft' | 'pub' }, g: { מזהה: ציון מוצע } }
// הציון המוצע נשמר בתיאור הקובץ ("grade=73"), כדי לא לפתוח כל קובץ בכל טעינה של הלוח.
// קובץ בלי תיאור נקרא פעם אחת, והציון נכתב לתיאור שלו.
function feedbackGradeOf_(f) {
  var m = /^grade=(\d{0,3})/.exec(f.getDescription() || '');
  if (m) return m[1];
  var g = '';
  try {
    var fb = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
    if (fb && fb.grade != null && /^\d{1,3}$/.test(String(fb.grade))) g = String(fb.grade);
  } catch (e) {}
  try { f.setDescription('grade=' + g); } catch (e) {}   // "grade=" ריק = אין ציון מוצע
  return g;
}
function feedbackIndex_(props, fresh) {
  props = props || PropertiesService.getScriptProperties().getProperties();
  var cache = CacheService.getScriptCache();
  var list = null;
  if (!fresh) { try { list = JSON.parse(cache.get('fb_idx2') || 'null'); } catch (e) { list = null; } }
  if (!list) {   // חיפוש ב-Drive - פעם בשתי דקות לכל היותר
    list = [];
    var it = DriveApp.searchFiles("title contains 'fb_' and trashed = false");
    while (it.hasNext()) {
      var f = it.next();
      var m = /^fb_([\w-]{10,})\.json$/.exec(f.getName());
      if (m) list.push([m[1], feedbackGradeOf_(f)]);
    }
    try { cache.put('fb_idx2', JSON.stringify(list), 120); } catch (e) {}
  }
  var out = { st: {}, g: {} };
  list.forEach(function (x) {
    out.st[x[0]] = props['fbpub_' + x[0]] === '1' ? 'pub' : 'draft';
    if (x[1] !== '') out.g[x[0]] = x[1];
  });
  return out;
}
function feedbackTeacher_(id) {
  var fb = feedbackRead_(String(id || ''));
  if (!fb) return { ok: false, error: 'אין משוב לעבודה הזאת' };
  return { ok: true, feedback: fb, published: PropertiesService.getScriptProperties().getProperty('fbpub_' + id) === '1' };
}
function feedbackPublic_(id) {
  id = String(id || '');
  if (!/^[\w-]{10,}$/.test(id)) return { ok: false, error: 'קישור לא תקין' };
  if (PropertiesService.getScriptProperties().getProperty('fbpub_' + id) !== '1') return { ok: true, feedback: null };
  var fb = feedbackRead_(id);
  if (!fb) return { ok: true, feedback: null };
  var g = gradeMap_()[id];
  return { ok: true, feedback: {
    student: fb.student || '', assignment: fb.assignment || '', page: fb.page || '', sent: fb.sent || '',
    grade: g && g.g !== '' ? g.g : (fb.grade == null ? '' : String(fb.grade)),
    comment: g ? g.c : '',
    summary: fb.summary || '',
    items: (fb.items || []).slice(0, 60).map(function (x) {
      return { id: String(x.id || ''), n: x.n, q: String(x.q || ''), s: String(x.s || ''), text: String(x.text || '') };
    })
  } };
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

// ---------- לוח מבחנים ----------
// נשמר במאפייני הסקריפט (EXAMS). מבחן מופיע עד סוף יום המבחן, ואחר כך נמחק בשמירה הבאה.
var EXAMS_MAX = 40;
var EXAM_CLASSES = ['יא', 'יב', 'all'];
function examsUpcoming_() {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var list = getJson_('EXAMS');
  return (Array.isArray(list) ? list : [])
    .filter(function (x) { return x && x.date >= today; })
    .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
}
function examsWrite_(list) {
  PropertiesService.getScriptProperties().setProperty('EXAMS', JSON.stringify(list));
  return { ok: true, exams: list };
}
function examSave_(d) {
  var date = String(d.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'חסר תאריך למבחן.' };
  if (date < Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd')) return { ok: false, error: 'התאריך כבר עבר.' };
  var title = clean_(d.title).slice(0, 120);
  if (!title) return { ok: false, error: 'כתבו על איזה חומר המבחן.' };
  var exam = {
    id: '',
    cls: EXAM_CLASSES.indexOf(d.cls) !== -1 ? d.cls : 'all',
    subject: clean_(d.subject).slice(0, 30),
    title: title,
    date: date,
    note: clean_(d.note).slice(0, 200)
  };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var list = examsUpcoming_();
    var old = d.id ? list.filter(function (x) { return x.id === d.id; })[0] : null;
    exam.id = old ? old.id : Utilities.getUuid().slice(0, 8);
    list = list.filter(function (x) { return x.id !== exam.id; });
    if (list.length >= EXAMS_MAX) return { ok: false, error: 'יש כבר ' + EXAMS_MAX + ' מבחנים בלוח. מחקו מבחן לפני שמוסיפים חדש.' };
    list.push(exam);
    list.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return examsWrite_(list);
  } finally {
    lock.releaseLock();
  }
}
function examDelete_(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return examsWrite_(examsUpcoming_().filter(function (x) { return x.id !== id; }));
  } finally {
    lock.releaseLock();
  }
}

// ---------- קוד לשיעור ----------
// כמה קודים יכולים להיות פעילים במקביל - כל מורה והקוד שלו, ולכל קוד דף, נעילה ובקרה משלו.
// נשמרים במאפיין LESSONS: { "4821": { code, url, label, created, monitor, cls, nav }, ... }.
// nav - הדף שהמורה שלח אליו את הכיתה (lessonNav_).
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
  if (monitor && MONITOR_CLASSES.indexOf(cls) < 0) return { ok: false, error: 'בקרת שיעור אפשרית רק לכיתה י"א או י"ב' };
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

// "שליחת הכיתה לדף": המורה בוחר דף, וכל תלמיד שנכנס עם הקוד (שיעור עם בקרה) עובר אליו לבד
// בדיווח הנוכחות הבא (presence_ מחזיר את nav). בלי url - מבטלים את השליחה.
function lessonNav_(code, url, label) {
  url = String(url || '').trim();
  if (url && !/^[\w.-]+\.html(#[\w-]+)?$/.test(url)) return { ok: false, error: 'כתובת עמוד לא תקינה' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var all = lessons_();
    var l = all[String(code || '')];
    if (!l) return { ok: false, error: 'הקוד כבר לא פעיל' };
    if (!l.monitor) return { ok: false, error: 'שליחה לדף עובדת רק בשיעור עם בקרה' };
    l.nav = url ? { id: String(Date.now()), url: url, label: clean_(label).slice(0, 120), at: Date.now() } : null;
    saveLessons_(all);
    return { ok: true, nav: l.nav };
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
    var gone = code ? [String(code)] : Object.keys(all);
    if (code) delete all[String(code)];
    else all = {};
    saveLessons_(all);
    gone.forEach(clearRoom_);   // הפעילות והלוח של השיעור שבוטל נסגרים איתו
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
  // דף שהמורה שלח אליו את הכיתה - פתוח למי שנכנס עם הקוד של אותו שיעור
  var mine = all[String(code || '')];
  if (mine && mine.nav && String(mine.nav.url).split('#')[0] === page) return { ok: true, locked: false, lessonPage: page, until: lessonUntil_(mine) };
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
  var state = d.state === 'out' ? 'out' : (d.state === 'bye' ? 'bye' : (d.state === 'paste' ? 'paste' : 'in'));
  // blur = חלון/אפליקציה אחרת כשהדף עדיין גלוי; split = מסך מפוצל (הדף נהיה צר/נמוך הרבה יותר מהמסך)
  var reason = (d.reason === 'blur' || d.reason === 'split') ? d.reason : 'hidden';
  var t = Number(d.t) || Date.now();

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false, busy: true };
  try {
    var cache = CacheService.getScriptCache();
    var key = 'pres_' + l.code;
    var all = {};
    try { all = JSON.parse(cache.get(key) || '{}'); } catch (e) { all = {}; }
    var now = Date.now();
    var isNew = !all[sid];
    var p = all[sid] || { name: name, leaves: 0, state: 'in', outSince: 0, t: 0, outTotal: 0, pastes: 0, ev: [] };
    if (!p.ev) p.ev = [];
    if (t < (p.t || 0)) return { ok: true, leaves: p.leaves };   // דיווח ישן שהגיע מאוחר - מתעלמים
    p.t = t;
    if (name) p.name = name;
    if (page && page !== p.page && !isNew) p.ev.push({ k: 'page', at: now, page: page });
    if (page) p.page = page;
    if (isNew) p.ev.push({ k: 'join', at: now, page: page });
    if (state === 'paste') {
      // הדבקת טקסט בתיבת תשובה - לא משנה את המצב, רק נרשם
      p.pastes = (p.pastes || 0) + 1;
      p.ev.push({ k: 'paste', at: now, len: Math.max(0, Math.min(100000, Number(d.len) || 0)), page: page });
    } else if (state === 'out') {
      if (p.state !== 'out') { p.state = 'out'; p.outSince = now; p.outReason = reason; }
    } else if (state === 'in') {
      if (p.state === 'out') {
        var away = now - p.outSince;
        if (away > AWAY_GRACE_SEC * 1000) {
          p.leaves++;
          p.outTotal = (p.outTotal || 0) + Math.round(away / 1000);
          p.ev.push({ k: 'out', at: p.outSince, back: now, sec: Math.round(away / 1000), why: p.outReason || 'hidden' });
        }
      } else if (p.state === 'bye') {
        p.ev.push({ k: 'join', at: now, page: page });
      }
      p.state = 'in';
      p.outSince = 0;
    } else {
      p.state = 'bye';
      p.ev.push({ k: 'bye', at: now });
    }
    if (p.ev.length > PRES_LOG_MAX) p.ev = p.ev.slice(-PRES_LOG_MAX);
    p.last = now;
    all[sid] = p;
    cache.put(key, JSON.stringify(all), 21600);
    var act = actFor_(l.code, true);
    return { ok: true, leaves: p.leaves, act: (act && act.open) ? { id: act.id, prompt: act.prompt } : null,
             nav: l.nav ? { id: l.nav.id, url: l.nav.url, label: l.nav.label } : null };
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
    var outFor = p.state === 'out' ? Math.round((now - p.outSince) / 1000) : 0;
    return { sid: sid, name: p.name || '', page: p.page || '', status: status, leaves: p.leaves || 0,
             outFor: outFor, outWhy: p.state === 'out' ? (p.outReason || 'hidden') : '',
             outSince: p.state === 'out' ? p.outSince : 0,
             outTotal: (p.outTotal || 0) + (status === 'out' ? outFor : 0), pastes: p.pastes || 0,
             ev: p.ev || [], lastAgo: Math.round((now - (p.last || now)) / 1000) };
  });
  return { ok: true, lesson: { code: l.code, label: l.label, url: l.url, cls: l.cls, nav: l.nav || null },
           lessons: mon.map(function (x) { return { code: x.code, label: x.label, cls: x.cls }; }), students: out, now: now };
}

// ---------- "חדרים": פעילות ולוח לכל שיעור ----------
// חדר = קוד השיעור. מורה מפעיל פעילות / לוח לחדר שבחר; תלמיד רואה את מה שפתוח בחדר של הקוד
// שהקליד, ואם שם אין כלום - את מה שנפתח בלי קוד (חדר ""). כך כמה מורים עובדים במקביל.
function roomOf_(room) { return String(room || '').replace(/[^0-9]/g, '').slice(0, 6); }
// חדר של שיעור שכבר נגמר (או קוד לא נכון) = חדר "" - כדי שמורה ותלמיד תמיד יגיעו לאותו מקום
function liveRoom_(room) {
  room = roomOf_(room);
  return (room && lessons_()[room]) ? room : '';
}
function clearRoom_(room) {
  room = roomOf_(room);
  if (!room) return;
  var m = acts_();
  if (m[room]) { actDeleteResponses_(m[room].id); delete m[room]; saveActs_(m); }
  var q = qbActives_();
  if (q[room]) { delete q[room]; saveQbActives_(q); }
}

// ---------- לוח שאלות ----------
// כל שאלה נשמרת במאפיין נפרד: qb_<דף>_<מזהה>. הלוח הפעיל בכל חדר - במאפיין QB_ACTIVES.
function qbActives_() {
  var m = getJson_('QB_ACTIVES') || {};
  var old = getJson_('QB_ACTIVE');   // מהגרסה הקודמת, שבה היה לוח פעיל אחד לכולם
  if (old && old.id && !m['']) m[''] = old;
  return m;
}
function saveQbActives_(m) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('QB_ACTIVES', JSON.stringify(m));
  props.deleteProperty('QB_ACTIVE');
}
function qbBoard_(board) {
  board = String(board || '');
  if (QBOARDS.indexOf(board) !== -1) return board;
  if (/^d[a-z0-9]{4,14}$/.test(board) && qbBoardsList_().some(function (b) { return b.id === board; })) return board;
  return '';
}
// לוח פתוח לכתיבה רק כשהוא הלוח הפעיל בסרגל.
function qbIsOpen_(board) {
  var m = qbActives_();
  return Object.keys(m).some(function (r) { return m[r] && m[r].id === board; });
}
function qbBoardsList_() { return getJson_('QB_LIST') || []; }
function boardOpen_(title, page, room) {
  room = liveRoom_(room);
  title = clean_(title).slice(0, 120);
  if (title.length < 2) return { ok: false, error: 'כתבו כותרת ללוח.' };
  page = String(page || '').slice(0, 80);
  if (!/^[\w.-]+\.html$/.test(page)) page = '';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var b = { id: 'd' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), title: title, page: page, created: Date.now() };
    var list = [b].concat(qbBoardsList_());
    list.slice(QB_KEEP).forEach(function (old) {          // לוחות ישנים מאוד - נמחקים עם השאלות שלהם
      Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf('qb_' + old.id + '_') === 0) props.deleteProperty(k); });
    });
    props.setProperty('QB_LIST', JSON.stringify(list.slice(0, QB_KEEP)));
    var m = qbActives_();
    m[room] = { id: b.id, title: b.title };
    saveQbActives_(m);
    return { ok: true, board: b };
  } finally {
    lock.releaseLock();
  }
}
function boardSet_(id, open, room) {
  room = liveRoom_(room);
  var m = qbActives_();
  if (!open) { delete m[room]; saveQbActives_(m); return { ok: true, active: null }; }
  id = qbBoard_(id);
  if (!id) return { ok: false, error: 'הלוח לא נמצא' };
  var b = qbBoardsList_().concat(QBOARD_TITLES).filter(function (x) { return x.id === id; })[0] || { id: id, title: 'לוח שאלות' };
  m[room] = { id: b.id, title: b.title };
  saveQbActives_(m);
  return { ok: true, active: { id: b.id, title: b.title } };
}
// מה פתוח עכשיו לתלמידים - הסרגל בודק את זה כל כמה שניות
// exact - למורה: רק מה שפתוח בחדר שלו, בלי מה שנפתח בלי קוד
function dockState_(room, exact) {
  room = liveRoom_(room);
  var q = qbActives_();
  var b = q[room] || (room && !exact ? q[''] : null), a = actFor_(room, !exact);
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

// ---------- פעילות חיה (ענן מילים / הצבעה / סקר) ----------
// הפעילות של כל חדר במאפיין ACTIVITIES ({ חדר: פעילות }), וכל תשובה במאפיין נפרד: ar_<פעילות>_<תלמיד>
function acts_() {
  var m = getJson_('ACTIVITIES') || {};
  var old = getJson_('ACTIVITY');   // מהגרסה הקודמת, שבה הייתה פעילות אחת לכולם
  if (old && old.id && !m['']) m[''] = old;
  return m;
}
function saveActs_(m) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('ACTIVITIES', JSON.stringify(m));
  props.deleteProperty('ACTIVITY');
}
// הפעילות של חדר. fallback - לתלמיד: אם בחדר שלו אין פעילות, הפעילות שנפתחה בלי קוד
function actFor_(room, fallback) {
  var m = acts_();
  return m[room] || (fallback && room ? m[''] : null) || null;
}
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
function actCurrent_(room, exact) {   // exact - למקרן: רק הפעילות של הכיתה הזאת
  var a = actFor_(liveRoom_(room), !exact);
  if (!a) return { ok: true, activity: null };
  return { ok: true, activity: actPublic_(a), results: actResults_(a, false) };
}
function actTeacher_(room) {
  var a = acts_()[liveRoom_(room)];
  if (!a) return { ok: true, activity: null };
  return { ok: true, activity: actPublic_(a), results: actResults_(a, true) };
}
function actRespond_(d) {
  var m = acts_();
  var a = Object.keys(m).map(function (r) { return m[r]; }).filter(function (x) { return x && x.id === String(d.id || ''); })[0];
  if (!a) return { ok: false, ended: true, error: 'הפעילות הזאת כבר הסתיימה.' };
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
function actDeleteResponses_(id) {
  var props = PropertiesService.getScriptProperties();
  var prefix = 'ar_' + id + '_';
  Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf(prefix) === 0) props.deleteProperty(k); });
}
function actStart_(type, prompt, options, questions, anonymous, room) {
  room = liveRoom_(room);
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
    var m = acts_(), alive = lessons_();
    Object.keys(m).forEach(function (r) {   // פעילות קודמת באותו חדר, ופעילויות של שיעורים שכבר נגמרו - נמחקות עם התשובות
      if (r === room || (r && !alive[r])) { actDeleteResponses_(m[r].id); delete m[r]; }
    });
    var a = { id: Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), type: type, prompt: prompt, options: opts, questions: qs,
              anonymous: type === 'survey' && !!anonymous, open: true, created: Date.now(), room: room };
    m[room] = a;
    saveActs_(m);
    return { ok: true, activity: actPublic_(a), results: actResults_(a, true) };
  } finally {
    lock.releaseLock();
  }
}
function actOpen_(open, room) {
  room = liveRoom_(room);
  var m = acts_();
  var a = m[room];
  if (!a) return { ok: false, error: 'אין פעילות פעילה' };
  a.open = open;
  saveActs_(m);
  return { ok: true, activity: actPublic_(a) };
}
function actClear_(room) {
  room = liveRoom_(room);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var m = acts_();
    if (m[room]) { actDeleteResponses_(m[room].id); delete m[room]; saveActs_(m); }
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

function setGrade_(fileId, grade, comment, publishFb) {
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000)) return {ok:false,error:"מתבצעת שמירה אחרת. נסו שוב"};
  try {return setGradeUnlocked_(fileId, grade, comment, publishFb);} finally {lock.releaseLock();}
}

function setHidden_(fileId, hidden) {
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000)) return {ok:false,error:"מתבצעת שמירה אחרת. נסו שוב"};
  try {return setHiddenUnlocked_(fileId, hidden);} finally {lock.releaseLock();}
}

function acceptSuggested_(ids) {
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(5000)) return {ok:false,error:"מתבצעת שמירה אחרת. נסו שוב"};
  try {return acceptSuggestedUnlocked_(ids);} finally {lock.releaseLock();}
}

// Draft only. These actions run behind the existing teacher password check.
// review metadata comes from the validated grading process, never from pupil input.
function batchReviewCheck_(fb) {
  var reasons = [];
  if (!fb || fb.v !== 1 || !Array.isArray(fb.items) || !fb.items.length)
    return { ready:false, reasons:['לא נמצא משוב מלא ותקין'] };
  var r = fb.review;
  if (!r || r.version !== 1 || r.ready !== true || !Array.isArray(r.reasons) || r.reasons.length)
    reasons.push('המשוב דורש עיון מורה או נוצר לפני בדיקות התקינות החדשות');
  var checks = r && r.checks;
  if (!checks || checks.rubricMatched !== true || checks.complete !== true || checks.scoresValid !== true || checks.evidenceValid !== true)
    reasons.push('אין אישור מלא להתאמת המחוון, שלמות הבדיקה והראיות');
  if (typeof fb.grade !== 'number' || !Number.isInteger(fb.grade) || fb.grade < 0 || fb.grade > 100)
    reasons.push('הציון אינו תקין');
  var expected = r && r.expectedItemIds, ids = Object.create(null), valid = true;
  if (!Array.isArray(expected) || !expected.length || expected.some(function(id){return typeof id !== 'string' || !id;}) || new Set(expected).size !== expected.length)
    valid = false;
  fb.items.forEach(function(x){
    if (!x || typeof x.id !== 'string' || !x.id || ids[x.id] || !['full','partial','miss'].includes(x.s) || typeof x.text !== 'string' || !x.text.trim()) valid = false;
    else ids[x.id] = true;
    if (x && (x.copied === true || x.needsReview === true)) reasons.push('שאלה שסומנה לעיון או חשד להעתקה');
  });
  if (!valid || expected.length !== fb.items.length || expected.some(function(id){return !ids[id];}))
    reasons.push('רשימת השאלות אינה מלאה או כוללת כפילות');
  return {ready:reasons.length === 0,reasons:Array.from(new Set(reasons))};
}

function batchReviewSnapshot_(fb, saved, published, hidden) {
  var text = JSON.stringify({feedback:fb, saved:saved || null, published:published || '', hidden:hidden || ''});
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8)
    .map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
}

function batchReviewOne_(id) {
  var props = PropertiesService.getScriptProperties(), fb = feedbackRead_(id);
  var saved = props.getProperty('grade_'+id), published = props.getProperty('fbpub_'+id), hidden = props.getProperty('hid_'+id);
  var check = batchReviewCheck_(fb), selected = fb && fb.grade;
  if (published === '1') check = {ready:false,reasons:['המשוב כבר פורסם']};
  if (hidden === '1') check = {ready:false,reasons:['העבודה מוסתרת']};
  if (saved) {
    try {
      var old = JSON.parse(saved);
      if (old.g !== '' && old.g != null) {
        if (!/^\d{1,3}$/.test(String(old.g)) || Number(old.g)>100) throw Error('grade');
        selected = Number(old.g); // Preserve a grade the teacher has already changed.
      }
    } catch(e) {check={ready:false,reasons:['הציון השמור דורש עיון']};}
  }
  return {id:id,ready:check.ready,reasons:check.reasons,grade:selected == null ? null : selected,
    snapshot:batchReviewSnapshot_(fb,saved,published,hidden)};
}

function feedbackBatchPreview_(ids) {
  if (!Array.isArray(ids) || ids.length > 30) return {ok:false,error:'בחרו עד 30 עבודות בכל סבב'};
  var seen = {}, rows = [];
  ids.forEach(function(raw){
    var id = String(raw || '');
    if (!/^[\w-]{10,}$/.test(id) || seen[id]) return;
    seen[id]=true;
    try {rows.push(batchReviewOne_(id));}
    catch(e) {rows.push({id:id,ready:false,reasons:['לא הצלחנו לקרוא את המשוב'],grade:null});}
  });
  return {ok:true,rows:rows};
}

function approveFeedbackBatch_(entries, confirmed) {
  if (!confirmed || !Array.isArray(entries) || !entries.length || entries.length > 30)
    return {ok:false,error:'נדרש אישור מפורש לסיכום של עד 30 עבודות'};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'מתבצעת שמירה אחרת. נסו שוב בעוד רגע'};
  var done=[], failed=[], seen={};
  try {
    entries.forEach(function(entry){
      var id=entry && String(entry.id || '');
      if (!/^[\w-]{10,}$/.test(id) || seen[id]) {failed.push({id:id,error:'מזהה לא תקין או כפול'});return;}
      seen[id]=true;
      try {
        var fresh=batchReviewOne_(id);
        if (!fresh.ready || !entry.snapshot || fresh.snapshot !== entry.snapshot) {
          failed.push({id:id,error:'המשוב או הציון השתנו, או שהעבודה דורשת עיון. רעננו את הסיכום'});return;
        }
        var props=PropertiesService.getScriptProperties(), saved=props.getProperty('grade_'+id), comment='';
        if(saved) comment=JSON.parse(saved).c || '';
        var result=setGradeUnlocked_(id,String(fresh.grade),comment,true);
        if (!result.ok || result.fbPublished !== true) throw Error('save');
        done.push({id:id,grade:result.grade});
      } catch(e) {failed.push({id:id,error:'לא הצלחנו לשמור. בדקו את מצב העבודה לפני ניסיון נוסף'});}
    });
  } finally {lock.releaseLock();}
  return {ok:true,done:done,failed:failed};
}

// Pure self-test: does not read or write student submissions, Drive or properties.
function batchReviewSelfTest() {
  var fb={v:1,grade:60,items:[{id:'q1',s:'partial',text:'תשובת דמה'}],review:{version:1,ready:true,reasons:[],expectedItemIds:['q1'],checks:{rubricMatched:true,complete:true,scoresValid:true,evidenceValid:true}}};
  if(!batchReviewCheck_(fb).ready) throw Error('valid');
  fb.grade=0;if(!batchReviewCheck_(fb).ready)throw Error('low grade');
  fb.grade=101;if(batchReviewCheck_(fb).ready)throw Error('invalid grade');
  fb.grade=60;fb.items[0].needsReview=true;if(batchReviewCheck_(fb).ready)throw Error('review flag');
  fb.items[0].needsReview=false;delete fb.review;if(batchReviewCheck_(fb).ready)throw Error('legacy');
  console.log('Batch review self-test: 5 pure checks passed; no submissions read or changed.');
  return {ok:true,checks:5};
}
