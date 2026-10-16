/* ============================================================
   הבית הדיגיטלי של תיכון יש"י - סקריפט השרת (Google Apps Script)
   ============================================================
   מה הסקריפט עושה:
   1. קולט הגשות מהאתר (טופס ההגשה וכפתור "שלחו למורה") - בדיוק כמו
      קודם: שומר את הקובץ בדרייב, רושם שורה בגיליון ושולח מייל.
   2. הודעה מהמורה - המורה כותב באזור האישי, התלמידים רואים בדף הבית.
   3. קוד לשיעור - המורה יוצר קוד של 4 ספרות, התלמידים מקלידים אותו
      בדף הבית ומגיעים ישר לדף הנכון.
   4. לוח הגשות - רשימת ההגשות לפי מקצוע, מטלה וסטטוס, עם "סימון כנבדק".

   הסיסמה של האזור האישי נשמרת בהגדרות הסקריפט (Script Properties)
   בשם TEACHER_PASSWORD - לא בקוד ולא באתר.
   ============================================================ */

const CONFIG = {
  FOLDER_NAME: 'הגשות תלמידים - בית המדרש',
  SPREADSHEET_NAME: 'הבית הדיגיטלי - הגשות',
  LOG_SHEET: 'יומן הגשות',
  ROSTER_SHEET: 'תלמידים',
  TZ: 'Asia/Jerusalem',
  SEND_EMAIL: true,          // מייל למורה על כל הגשה
  LESSON_HOURS: 12,          // כמה שעות קוד לשיעור נשאר פעיל
  MAX_FAILED_LOGINS: 10,     // אחרי כמה ניסיונות שגויים לחסום זמנית
  LOCKOUT_MINUTES: 15
};

const HEADERS = ['מזהה', 'תאריך', 'שם התלמיד', 'כיתה', 'מקצוע', 'מטלה', 'הערות',
                 'שם הקובץ', 'קישור לקובץ', 'סטטוס', 'נבדק בתאריך'];
const COL = { ID: 0, DATE: 1, NAME: 2, CLS: 3, SUBJECT: 4, TASK: 5, NOTES: 6,
              FILE: 7, URL: 8, STATUS: 9, CHECKED_AT: 10 };
const STATUS_HE = { pending: 'ממתין לבדיקה', checked: 'נבדק' };
const SUBJECTS = ['תנ"ך', 'תושב"ע', 'עברית'];
const PAGE_RE = /^[\w.-]+\.html(#[\w-]+)?$/;   // רק דפים של האתר עצמו

/* ---------------- כניסה ---------------- */

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    switch (p.action) {
      case 'announcement': return json_(getAnnouncement_());
      case 'lesson':       return json_(findLesson_(p.code));
      default:             return json_({ ok: true, status: 'הסקריפט פעיל' });
    }
  } catch (err) {
    return json_(fail_(err));
  }
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = data.action || 'submit';   // הגשות מהאתר לא שולחות action
    switch (action) {
      case 'submit':          return json_(handleSubmit_(data));
      case 'login':           requireTeacher_(data.token); return json_({ ok: true });
      case 'setAnnouncement': requireTeacher_(data.token); return json_(setAnnouncement_(data.text));
      case 'createLesson':    requireTeacher_(data.token); return json_(createLesson_(data.url, data.label));
      case 'submissions':     requireTeacher_(data.token); return json_(listSubmissions_());
      case 'check':           requireTeacher_(data.token); return json_(markChecked_(data.id));
      default:                return json_({ ok: false, error: 'פעולה לא מוכרת' });
    }
  } catch (err) {
    return json_(fail_(err));
  }
}

/* ---------------- הגשות ---------------- */

function handleSubmit_(data) {
  if (!data.studentName || !data.assignment || !data.fileBase64) {
    throw new Error('חסרים פרטים בהגשה');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const root = getFolder_(DriveApp.getRootFolder(), CONFIG.FOLDER_NAME);
    const folder = getFolder_(root, data.studentClass || 'ללא כיתה');
    const now = new Date();
    const stamp = Utilities.formatDate(now, CONFIG.TZ, 'yyyy-MM-dd HH-mm');
    const name = cleanName_(data.studentName + ' - ' + data.assignment + ' - ' + stamp + ' - ' + (data.fileName || 'הגשה'));
    const blob = Utilities.newBlob(Utilities.base64Decode(data.fileBase64),
                                   data.fileMimeType || 'application/octet-stream', name);
    const file = folder.createFile(blob);
    const subject = normalizeSubject_(data.subject, data.assignment);

    logSheet_().appendRow([
      Utilities.getUuid(), now, clip_(data.studentName, 100), clip_(data.studentClass || '', 20),
      subject, clip_(data.assignment, 200), clip_(data.notes || '', 1000),
      file.getName(), file.getUrl(), STATUS_HE.pending, ''
    ]);

    if (CONFIG.SEND_EMAIL) {
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: 'הגשה חדשה: ' + data.studentName + ' (' + (data.studentClass || '') + ') - ' + data.assignment,
        htmlBody: '<div dir="rtl" style="font-family:Arial">' +
          '<b>תלמיד/ה:</b> ' + esc_(data.studentName) + '<br>' +
          '<b>כיתה:</b> ' + esc_(data.studentClass || '') + '<br>' +
          '<b>מקצוע:</b> ' + esc_(subject) + '<br>' +
          '<b>מטלה:</b> ' + esc_(data.assignment) + '<br>' +
          (data.notes ? '<b>הערות:</b> ' + esc_(data.notes) + '<br>' : '') +
          '<br><a href="' + file.getUrl() + '">פתיחת הקובץ בדרייב</a></div>',
        attachments: [blob]
      });
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function listSubmissions_() {
  const values = logSheet_().getDataRange().getValues().slice(1);
  const rows = values.filter(function (r) { return r[COL.ID]; }).map(function (r) {
    const d = r[COL.DATE] instanceof Date ? r[COL.DATE] : new Date(r[COL.DATE]);
    return {
      id: String(r[COL.ID]),
      name: String(r[COL.NAME]),
      cls: String(r[COL.CLS]),
      subject: normalizeSubject_(r[COL.SUBJECT], r[COL.TASK]),
      task: String(r[COL.TASK]),
      date: isNaN(d) ? '' : Utilities.formatDate(d, CONFIG.TZ, 'dd.MM.yyyy HH:mm'),
      ts: isNaN(d) ? 0 : d.getTime(),
      url: String(r[COL.URL] || ''),
      status: String(r[COL.STATUS]) === STATUS_HE.checked ? 'checked' : 'pending'
    };
  });
  rows.sort(function (a, b) { return b.ts - a.ts; });

  /* "לא הוגשו": תלמידים מגיליון "תלמידים" שלא הגישו מטלה שתלמידים
     אחרים מאותה כיתה כבר הגישו. אם הגיליון ריק - אין שורות כאלה. */
  const roster = rosterSheet_().getDataRange().getValues().slice(1)
    .filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) { return { name: String(r[0]).trim(), cls: normClass_(r[1]) }; });
  const handed = {};
  const tasks = {};
  rows.forEach(function (r) {
    const cls = normClass_(r.cls);
    handed[normName_(r.name) + '|' + r.task] = true;
    tasks[cls + '|' + r.task] = { cls: r.cls, task: r.task, subject: r.subject };
  });
  const missing = [];
  Object.keys(tasks).forEach(function (k) {
    const t = tasks[k];
    roster.forEach(function (s) {
      if (s.cls === normClass_(t.cls) && !handed[normName_(s.name) + '|' + t.task]) {
        missing.push({ id: '', name: s.name, cls: t.cls, subject: t.subject, task: t.task,
                       date: '', ts: 0, url: '', status: 'missing' });
      }
    });
  });

  return { ok: true, rows: rows.concat(missing), rosterSize: roster.length };
}

function markChecked_(id) {
  if (!id) throw new Error('חסר מזהה הגשה');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = logSheet_();
    const ids = sh.getRange(1, COL.ID + 1, sh.getLastRow(), 1).getValues();
    for (let i = 1; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sh.getRange(i + 1, COL.STATUS + 1, 1, 2).setValues([[STATUS_HE.checked, new Date()]]);
        return { ok: true };
      }
    }
    throw new Error('ההגשה לא נמצאה');
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- הודעה מהמורה ---------------- */

function getAnnouncement_() {
  const raw = PropertiesService.getScriptProperties().getProperty('ANNOUNCEMENT');
  const a = raw ? JSON.parse(raw) : { text: '', updated: '' };
  return { ok: true, text: a.text || '', updated: a.updated || '' };
}

function setAnnouncement_(text) {
  const clean = clip_(String(text || '').trim(), 500);
  PropertiesService.getScriptProperties().setProperty('ANNOUNCEMENT',
    JSON.stringify({ text: clean, updated: new Date().toISOString() }));
  return { ok: true, text: clean };
}

/* ---------------- קוד לשיעור ---------------- */

function readLessons_() {
  const raw = PropertiesService.getScriptProperties().getProperty('LESSONS');
  const all = raw ? JSON.parse(raw) : {};
  const now = Date.now();
  Object.keys(all).forEach(function (c) { if (all[c].exp < now) delete all[c]; });
  return all;
}

function createLesson_(url, label) {
  url = String(url || '');
  if (!PAGE_RE.test(url)) throw new Error('יעד לא תקין');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const all = readLessons_();
    let code;
    do { code = String(1000 + Math.floor(Math.random() * 9000)); } while (all[code]);
    all[code] = { url: url, label: clip_(String(label || url), 120),
                  exp: Date.now() + CONFIG.LESSON_HOURS * 3600 * 1000 };
    PropertiesService.getScriptProperties().setProperty('LESSONS', JSON.stringify(all));
    return { ok: true, code: code, label: all[code].label, hours: CONFIG.LESSON_HOURS };
  } finally {
    lock.releaseLock();
  }
}

function findLesson_(code) {
  code = String(code || '');
  if (!/^\d{4}$/.test(code)) return { ok: false, error: 'not_found' };
  const l = readLessons_()[code];
  return l ? { ok: true, url: l.url, label: l.label } : { ok: false, error: 'not_found' };
}

/* ---------------- סיסמה ---------------- */

function requireTeacher_(token) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('failed_logins') || 0);
  if (fails >= CONFIG.MAX_FAILED_LOGINS) {
    throw authError_('יותר מדי ניסיונות שגויים. נסו שוב בעוד ' + CONFIG.LOCKOUT_MINUTES + ' דקות.');
  }
  const pw = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD');
  if (!pw) throw authError_('עדיין לא נקבעה סיסמה בהגדרות הסקריפט.');
  if (!token || String(token) !== String(pw)) {
    cache.put('failed_logins', String(fails + 1), CONFIG.LOCKOUT_MINUTES * 60);
    throw authError_('הסיסמה שגויה.');
  }
}

function authError_(msg) { const e = new Error(msg); e.auth = true; return e; }

/* ---------------- גיליונות ותיקיות ---------------- */

function spreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* נמחק - ניצור חדש */ }
  }
  const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(getFolder_(DriveApp.getRootFolder(), CONFIG.FOLDER_NAME));
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function logSheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(CONFIG.LOG_SHEET);
  if (!sh) {
    sh = ss.getSheets()[0];
    if (sh.getLastRow() > 0 || sh.getName() === CONFIG.ROSTER_SHEET) sh = ss.insertSheet();
    sh.setName(CONFIG.LOG_SHEET);
    sh.setRightToLeft(true);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.hideColumns(COL.ID + 1);
  }
  return sh;
}

function rosterSheet_() {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(CONFIG.ROSTER_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.ROSTER_SHEET);
    sh.setRightToLeft(true);
    sh.appendRow(['שם התלמיד', 'כיתה']);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function getFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/* ---------------- עזרים ---------------- */

function normalizeSubject_(subject, task) {
  const s = String(subject || '').replace(/["'׳״]/g, '');
  if (s === 'תנך') return 'תנ"ך';
  if (s === 'תושבע') return 'תושב"ע';
  if (s === 'עברית') return 'עברית';
  const t = String(task || '');
  if (/עברית|גזר|משקל|בניין|שורש/.test(t)) return 'עברית';
  if (/פתוח תפתח|מצו|ספר החינוך|הלכ|משנה|גמרא/.test(t)) return 'תושב"ע';
  return 'תנ"ך';
}
function normClass_(c) { return String(c || '').replace(/["'׳״\s]/g, ''); }
function normName_(n) { return String(n || '').replace(/["'׳״]/g, '').replace(/\s+/g, ' ').trim(); }
function cleanName_(s) { return String(s).replace(/[\\/:*?"<>|]/g, '-').slice(0, 200); }
function clip_(s, n) { return String(s == null ? '' : s).slice(0, n); }
function esc_(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fail_(err) { return { ok: false, error: String((err && err.message) || err), code: err && err.auth ? 'auth' : 'error' }; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------------- להפעלה ידנית מתוך העורך ----------------
   בחרו "authorize" בתפריט שליד כפתור ▶ ולחצו ▶. זה מאשר הרשאות,
   יוצר את התיקייה ואת הגיליון, ובודק שהסיסמה נקבעה. */
function authorize() {
  logSheet_();
  rosterSheet_();
  MailApp.getRemainingDailyQuota();
  const pw = PropertiesService.getScriptProperties().getProperty('TEACHER_PASSWORD');
  Logger.log(pw ? 'הכול מוכן. הסיסמה נקבעה.' : 'ההרשאות אושרו. עכשיו צריך לקבוע סיסמה (TEACHER_PASSWORD).');
  Logger.log('הגיליון: ' + spreadsheet_().getUrl());
}
