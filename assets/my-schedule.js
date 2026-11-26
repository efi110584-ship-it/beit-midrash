/* ============================================================
   "המערכת שלי" - המערכת השבועית של המורה (באזור האישי בלבד)
   ============================================================
   הנתונים הועתקו ממערכת סקולי (שבוע רגיל). רק השעות של המורה עצמו -
   בלי שמות של מורים אחרים ובלי שום מידע על תלמידים.
   kind:
     lesson - שיעור בכיתה (cls: "יא" / "יב" / "both") - עליו לוקחים נוכחות
     tutor  - פרטני
     role   - תפקיד / שיחות אישיות
     meet   - ישיבות
     prep   - הכנה לבגרות
   נוכחות: לוחצים על שיעור -> רשימת הכיתה (attRoster) -> נוכח / איחור / חסר -> attSave.
   הרשימה והנוכחות נשמרות רק בשרת (apps-script/Code.gs), לא בקוד האתר.
   שינויים במערכת: "✏️ שינוי במערכת" - שינוי ליום אחד או קבוע מתאריך. נשמרים בשרת
   (schedEditsGet / schedEditsSave), ועותק במכשיר כדי שגם פס המערכת בדף הבית יציג אותם.
   window.BM_MY_SCHEDULE.mount(el) נקרא מ-index.html כשנפתחת הלשונית.
   ============================================================ */
(function(){
  "use strict";
  var DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];
  var HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  function L(subject, cls, note){ return { kind:"lesson", subject:subject, cls:cls, note:note || "" }; }
  function K(kind, subject, note){ return { kind:kind, subject:subject, note:note || "" }; }
  var PRAY = L("תפילה ופתיחת יום", "both");
  var HEB = L("עברית", "יא", "קבוצה משותפת עם יא2");
  /* WEEK[יום][שעה] - יום 0 = ראשון. המערכת הנוכחית - מיום ראשון 8.11.2026 */
  var WEEK = [
    [PRAY, L('תושב"ע', "יב"), K("role", "תפקיד"), L('תושב"ע', "יא"), L('תנ"ך', "יב"), L('תנ"ך', "יא"), K("meet", "ישיבת הנהלה"), K("meet", "ישיבת הנהלה"), K("prep", "הכנה לבגרות")],
    [PRAY, K("role", "תפקיד"), L("מכינה לחיים", "יא"), L('תנ"ך', "יא"), HEB, L('תנ"ך', "יב"), K("role", "תפקיד"), L('תנ"ך', "יב"), K("prep", "הכנה לבגרות")],
    [PRAY, K("tutor", "פרטני"), K("role", "תפקיד"), K("tutor", 'פרטני מעו"ף'), HEB, HEB, L('תושב"ע', "יא"), L('תושב"ע', "יא"), K("prep", "הכנה לבגרות")],
    [PRAY, L("מכינה לחיים", "יב"), L('תושב"ע', "יב"), L('תושב"ע', "יא"), L('תנ"ך', "יא"), K("meet", "קהילת הוראה דיפרנציאלית"), K("tutor", 'פרטני מעו"ף'), K("tutor", 'פרטני מעו"ף'), K("role", "תפקיד")],
    [PRAY, L('תושב"ע', "יב"), K("prep", "הכנה לבגרות"), K("role", "שיחות אישיות"), K("role", "תפקיד"), K("role", "תפקיד"), K("meet", "ישיבת מחנכים תיכון"), K("meet", "ישיבת כיתה יב2"), K("prep", "הכנה לבגרות")]
  ];
  var WEEK_FROM = "2026-11-08";
  /* המערכת הקודמת (עד 7.11.2026) - כדי שנוכחות שנשמרה לפני השינוי תוצג ליד השיעור הנכון */
  var WEEK_OLD = [
    [PRAY, L('תושב"ע', "יא"), K("role", "תפקיד"), L('תושב"ע', "יב"), L('תושב"ע', "יב"), L('תנ"ך', "יא"), K("meet", "ישיבת הנהלה"), K("meet", "ישיבת הנהלה"), K("prep", "הכנה לבגרות")],
    [PRAY, K("role", "תפקיד"), L("מכינה לחיים", "יא"), L('תנ"ך', "יא"), HEB, L('תנ"ך', "יב"), K("role", "תפקיד"), K("role", "תפקיד"), K("prep", "הכנה לבגרות")],
    [PRAY, K("tutor", "פרטני"), K("role", "תפקיד"), K("tutor", 'פרטני מעו"ף'), HEB, HEB, L('תושב"ע', "יא"), L('תושב"ע', "יא"), K("prep", "הכנה לבגרות")],
    [PRAY, L("מכינה לחיים", "יב"), L('תושב"ע', "יב"), L('תושב"ע', "יא"), L('תנ"ך', "יא"), K("meet", "קהילת הוראה דיפרנציאלית"), K("tutor", 'פרטני מעו"ף'), K("tutor", 'פרטני מעו"ף'), K("prep", "הכנה לבגרות")],
    [PRAY, L('תנ"ך', "יב"), L('תנ"ך', "יב"), K("role", "שיחות אישיות"), K("meet", "ישיבת כיתה יב2"), K("role", "תפקיד"), K("meet", "ישיבת מחנכים תיכון"), K("role", "תפקיד"), K("prep", "הכנה לבגרות")]
  ];
  /* ---------- שינויים שהמורה מכניס באתר (נשמרים בשרת - schedEditsGet / schedEditsSave) ----------
     perm: { from, d, h, cell } - שינוי קבוע מתאריך from, ביום d בשבוע, בשעה h
     once: { date, h, cell }    - שינוי לתאריך אחד
     cell = null - השעה פנויה / בוטלה. שינוי ליום אחד גובר על שינוי קבוע, ושינוי קבוע גובר על המערכת שבקוד.
     עותק נשמר במכשיר, כדי שגם פס "המערכת" בדף הבית (assets/day-strip.js) יציג את השינויים. */
  var EDITS_KEY = "bm-sched-edits", edits = { perm:[], once:[] }, editsVer = 0, memo = {};
  try{ var ce = JSON.parse(localStorage.getItem(EDITS_KEY) || "null"); if(ce && Array.isArray(ce.perm) && Array.isArray(ce.once)) edits = ce; }catch(e){}
  function setEdits(e){
    edits = { perm:(e && e.perm) || [], once:(e && e.once) || [] }; editsVer++; memo = {};
    try{ localStorage.setItem(EDITS_KEY, JSON.stringify(edits)); }catch(x){}
  }
  function baseCell(date, d, h){ return ((String(date) >= WEEK_FROM ? WEEK : WEEK_OLD)[d] || [])[h] || null; }
  /* איזה שינוי קובע את השעה הזו בתאריך הזה (או null - המערכת הרגילה) */
  function editAt(date, h){
    var d = wd(date), i, best = null;
    for(i = edits.once.length - 1; i >= 0; i--) if(edits.once[i].date === date && edits.once[i].h === h) return { type:"once", e:edits.once[i] };
    edits.perm.forEach(function(e){ if(e.d === d && e.h === h && e.from <= date && (!best || e.from >= best.from)) best = e; });
    return best ? { type:"perm", e:best } : null;
  }
  function cellFor(date, h){
    var d = wd(date); if(d > 4) return null;
    var ed = editAt(date, h);
    return ed ? (ed.e.cell || null) : baseCell(date, d, h);
  }
  /* המערכת של השבוע שבו נמצא התאריך: [יום 0-4][שעה 0-8] - כל יום לפי התאריך שלו */
  function wk(date){
    var sun = parse(date || iso(new Date())); sun.setDate(sun.getDate() - sun.getDay());
    var key = iso(sun) + "|" + editsVer;
    if(memo[key]) return memo[key];
    var g = [0, 1, 2, 3, 4].map(function(d){
      var dd = new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + d), ds = iso(dd);
      return HOURS.map(function(h){ return cellFor(ds, h); });
    });
    memo[key] = g;
    return g;
  }
  var CLS_NAME = { "יא":"י״א 4", "יב":"י״ב 2", "both":"י״א 4 + י״ב 2" };


  /* מערכות הכיתות (מסקולי, שבוע רגיל) - רק מקצועות, בלי שמות מורים. [שם, פירוט, 1 = שיעור שלך]; 0 = אין שיעור */
  var CLASSES = {
   "יב":[[["תפילה ופתיחת יום","",1],
    ["תושב\"ע","",1],
    ["אנגלית","הקבצות C / E / G",0],
    ["חינוך גופני","",0],
    ["תנ\"ך","",1],
    ["פיזיקה","",0],
    ["פיזיקה","",0],
    ["פיזיקה","",0],0],
    [["תפילה ופתיחת יום","",1],
    ["אנגלית","הקבצות C / E / G",0],
    ["מגמות","מדעי המחשב / תקשורת מעשי",0],
    ["מגמות","מדעי המחשב / תקשורת מעשי",0],
    ["מגמות","מדעי המחשב / תקשורת מעשי",0],
    ["תנ\"ך","",1],
    ["מחשבת ישראל","",0],
    ["תנ\"ך","",1],0],
    [["תפילה ופתיחת יום","",1],
    ["פיזיקה","",0],
    ["אנגלית","הקבצות C / E / G",0],
    ["אנגלית","הקבצות C / E / G",0],
    ["מגמות","מוט\"ל / פיזיקה",0],
    ["מחשבת ישראל","",0],
    ["מחשבת ישראל","",0],
    ["ספרות","",0],0],
    [["תפילה ופתיחת יום","",1],
    ["מכינה לחיים","",1],
    ["תושב\"ע","",1],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["מגמות","מדעי המחשב / תקשורת עיוני",0],0,0,0],
    [["תפילה ופתיחת יום","",1],
    ["תושב\"ע","",1],
    ["מגמות","מוט\"ל / פיזיקה",0],
    ["מגמות","מדעי המחשב / תקשורת עיוני",0],
    ["מגמות","מדעי המחשב / תקשורת עיוני",0],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],0],
    [0,["מדעי המחשב פרויקט","",0],
    ["מדעי המחשב פרויקט","",0],
    ["מדעי המחשב פרויקט","",0],0,0,0,0,0]],
   "יא":[[["תפילה ופתיחת יום","",1],
    ["היסטוריה","",0],
    ["אנגלית","הקבצות C / E / G",0],
    ["תושב\"ע","",1],
    ["אזרחות","",0],
    ["תנ\"ך","",1],
    ["חינוך גופני","",0],
    ["היסטוריה","",0],0],
    [["תפילה ופתיחת יום","",1],
    ["אנגלית","הקבצות C / E / G",0],
    ["מכינה לחיים","",1],
    ["תנ\"ך","",1],
    ["עברית","וגם עברית עולים",1],
    ["מגמות","ביולוגיה / מדעי המחשב / מוט\"ל / סדנת אמנות / פיזיקה / תקשורת מעשי",0],
    ["מגמות","ביולוגיה / מדעי המחשב / מוט\"ל / סדנת אמנות / פיזיקה / תקשורת מעשי",0],
    ["מגמות","ביולוגיה / מדעי המחשב / מוט\"ל / סדנת אמנות / פיזיקה / תקשורת מעשי",0],
    ["פיזיקה","",0]],
    [["תפילה ופתיחת יום","",1],
    ["אזרחות","",0],
    ["אנגלית","הקבצות C / E / G",0],
    ["אנגלית","הקבצות C / E / G",0],
    ["עברית","וגם עברית עולים",1],
    ["עברית","וגם עברית עולים",1],
    ["תושב\"ע","",1],
    ["תושב\"ע","",1],0],
    [["תפילה ופתיחת יום","",1],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["תושב\"ע","",1],
    ["תנ\"ך","",1],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["תגבור מתמטיקה","",0],
    ["תגבור מתמטיקה","",0],
    ["תגבור מתמטיקה","",0]],
    [["תפילה ופתיחת יום","",1],
    ["ספרות","",0],
    ["אזרחות","",0],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["מתמטיקה","הקבצות 3 / 4 / 5 יח״ל",0],
    ["מגמות","אמנות / ביולוגיה / מדעי המחשב / מוט\"ל / פיזיקה / תקשורת עיוני",0],
    ["מגמות","אמנות / ביולוגיה / מדעי המחשב / מוט\"ל / פיזיקה / תקשורת עיוני",0],
    ["מגמות","אמנות / ביולוגיה / מדעי המחשב / מוט\"ל / פיזיקה / תקשורת עיוני",0],
    ["פיזיקה","",0]],
    [0,0,0,0,0,0,0,0,0]]
};

  /* כמו בדיווח הנוכחות בסקולי */
  var MARK = { a:"חיסור", p:"נוכח", l:"איחור" };
  var EV = [["c", "⭐ מחמאה"], ["b", "הערת התנהגות"], ["n", "ללא מחשב נייד"], ["h", "ללא שיעורי בית"]];
  var EVN = { c:"מחמאה", b:"הערת התנהגות", n:"ללא מחשב נייד", h:"ללא שיעורי בית" };
  var CHECK = [["p", "פיזי"], ["o", "מקוון"], ["v", "קולי"], ["x", "לא התקיים"]];
  var CHECKN = { p:"פיזי", o:"מקוון", v:"קולי", x:"לא התקיים" };
  var st = { date:"", day:{}, dayLoaded:"", rosters:{}, open:null, marks:{}, events:{}, kind:"p", dirty:false, busy:false, view:"me", edit:false, edH:null };
  var root = null;

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function tone(s){ return s.kind === "lesson" ? "c-" + (s.cls === "both" ? "both" : s.cls === "יב" ? "yb" : "ya") : "k-" + s.kind; }
  function chip(s){ return s.kind === "lesson" ? CLS_NAME[s.cls] : ""; }
  function clsList(s){ return s.cls === "both" ? ["יא", "יב"] : [s.cls]; }
  function nk(n){ return String(n || "").replace(/\s+/g, " ").trim(); }

  /* תאריכים - לפי השעון המקומי */
  function iso(d){ return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s){ var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function wd(s){ return parse(s).getDay(); }
  function nice(s){ var d = parse(s); return "יום " + (["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"][d.getDay()]) + " " + d.getDate() + "." + (d.getMonth() + 1); }
  function shift(s, by){ var d = parse(s); do { d.setDate(d.getDate() + by); } while(d.getDay() > 4); return iso(d); }
  /* היום בשבוע הנוכחי (מראשון האחרון) */
  function dateOfWeekday(i){ var d = new Date(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate()); d.setDate(d.getDate() - d.getDay() + i); return iso(d); }
  function todayIso(){ return iso(new Date()); }
  function isToday(s){ return s === iso(new Date()); }

  function token(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  function post(body){
    body.password = token();
    return fetch(window.BM_API_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); })
      .then(function(r){ if(!r || !r.ok) throw new Error((r && r.error) || "הפעולה לא הושלמה"); return r; });
  }

  function css(){
    if(document.getElementById("bmSchedCss")) return;
    var el = document.createElement("style");
    el.id = "bmSchedCss";
    el.textContent =
      ".sch{--ya:#0F6B5F;--ya-bg:#E4F3EF;--yb:#3542A0;--yb-bg:#EBEDFB;--both:#8A5300;--both-bg:#FFF2D6;--tutor:#9B2C5C;--tutor-bg:#FBEAF1;--mute:#56637A;--mute-bg:#F2F5F9;--line:#DCE4F1;--ink:#0E1B33;--ok:#1F7A4D;--late:#A15C00;--abs:#B42318;color:var(--ink)}" +
      ".sch h3{font-family:'Rubik','Heebo',sans-serif;margin:0 0 10px;font-size:1.2rem}" +
      ".sch-today{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin:0 0 18px}" +
      ".sch-today-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px}.sch-today-h h3{margin:0}" +
      ".sch-daynav{display:flex;align-items:center;gap:6px;margin-inline-start:auto}" +
      ".sch-daynav button,.sch-btn{font:inherit;border:1px solid var(--line);background:#fff;border-radius:10px;padding:7px 12px;cursor:pointer;color:var(--ink)}" +
      ".sch-daynav button:hover,.sch-btn:hover{border-color:#B8C7E0}" +
      ".sch-daynav input{font:inherit;border:1px solid var(--line);border-radius:10px;padding:6px 8px}" +
      ".sch-btn--primary{background:#0B2A5B;border-color:#0B2A5B;color:#fff;font-weight:700}.sch-btn--primary:hover{background:#123A78}" +
      ".sch-btn:disabled{opacity:.55;cursor:default}" +
      ".sch :focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      ".sch-strip{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}" +
      ".sch-slot{display:flex;flex-direction:column;align-items:flex-start;gap:3px;width:100%;height:100%;text-align:right;font:inherit;border-radius:12px;padding:10px 12px;border:1px solid transparent;min-width:0}" +
      "button.sch-slot{cursor:pointer;border-color:rgba(14,27,51,.08)}button.sch-slot:hover{box-shadow:0 4px 14px rgba(20,34,59,.12)}" +
      ".sch-slot.is-open{box-shadow:0 0 0 3px #0B2A5B}" +
      ".sch-slot .sch-h{font-size:.8rem;font-weight:700;opacity:.8;font-variant-numeric:tabular-nums}" +
      ".sch-slot strong{font-family:'Rubik','Heebo',sans-serif;font-size:1.02rem;line-height:1.25}" +
      ".sch-slot small{font-size:.82rem}" +
      ".sch-badge{display:inline-block;margin-top:4px;font-size:.78rem;font-weight:700;border-radius:999px;padding:2px 9px;background:#fff;color:var(--mute);border:1px solid var(--line)}" +
      ".sch-badge.is-done{color:var(--ok);border-color:#B7E0C9}.sch-badge.is-miss{color:var(--abs);border-color:#F3C2BD}" +
      ".sch-sheet{scroll-margin-top:96px;background:#fff;border:2px solid #0B2A5B;border-radius:16px;padding:16px 18px;margin:0 0 18px}" +
      ".sch-sheet-h{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 10px}.sch-sheet-h h3{margin:0}" +
      ".sch-sheet-h .sch-x{margin-inline-start:auto}" +
      ".sch-tools{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}" +
      ".sch-count{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px;font-size:.92rem}" +
      ".sch-count span{border-radius:999px;padding:4px 12px;font-weight:700;font-variant-numeric:tabular-nums}" +
      ".sch-count .n-p{background:#E7F5EE;color:var(--ok)}.sch-count .n-l{background:#FFF1DC;color:var(--late)}.sch-count .n-a{background:#FDECEA;color:var(--abs)}" +
      ".sch-cls-h{font-family:'Rubik','Heebo',sans-serif;font-size:1.02rem;margin:14px 0 6px}" +
      ".sch-names{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:0 22px}" +
      ".sch-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #EEF2F8}" +
      ".sch-row .sch-nm{flex:1;min-width:0;font-weight:600}" +
      ".sch-row .sch-pc{font-size:.8rem;color:var(--ok);font-weight:700;margin-inline-start:4px}" +
      ".sch-seg{display:inline-flex;border:1px solid var(--line);border-radius:10px;overflow:hidden;flex:none}" +
      ".sch-seg label{position:relative;cursor:pointer}" +
      ".sch-seg input{position:absolute;opacity:0;width:1px;height:1px}" +
      ".sch-seg span{display:block;padding:6px 11px;font-size:.88rem;color:var(--mute);border-inline-start:1px solid var(--line)}" +
      ".sch-seg label:first-child span{border-inline-start:0}" +
      ".sch-seg input:focus-visible+span{outline:3px solid #FF7A1A;outline-offset:-3px}" +
      ".sch-seg input[value=p]:checked+span{background:#E7F5EE;color:var(--ok);font-weight:700}" +
      ".sch-seg input[value=l]:checked+span{background:#FFE7C2;color:var(--late);font-weight:700}" +
      ".sch-seg input[value=a]:checked+span{background:#FAD7D3;color:var(--abs);font-weight:700}" +
      ".sch-row.is-a .sch-nm{color:var(--abs)}.sch-row.is-l .sch-nm{color:var(--late)}" +
      ".sch-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:14px 0 0}" +
      ".sch-msg{color:var(--mute);font-size:.92rem;margin:0}.sch-msg.is-err{color:var(--abs);font-weight:700}.sch-msg.is-ok{color:var(--ok);font-weight:700}" +
      ".sch-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:#fff}" +
      ".sch-grid{width:100%;min-width:640px;border-collapse:separate;border-spacing:0;table-layout:fixed}" +
      ".sch-grid th{font-family:'Rubik','Heebo',sans-serif;font-weight:700;font-size:.95rem;padding:10px 6px;background:#F7F9FC;border-bottom:1px solid var(--line)}" +
      ".sch-grid th.is-today{background:#0B2A5B;color:#fff}" +
      ".sch-grid th.sch-hcol,.sch-grid td.sch-hcol{width:52px;text-align:center;color:var(--mute);font-variant-numeric:tabular-nums}" +
      ".sch-grid td{padding:4px;border-bottom:1px solid #EEF2F8;vertical-align:top}" +
      ".sch-grid tr:last-child td{border-bottom:0}" +
      ".sch-grid td.is-today{background:#F4F7FD}" +
      ".sch-grid .sch-slot{padding:7px 9px;min-height:52px;border-radius:10px;gap:2px}" +
      ".sch-grid .sch-slot strong{font-size:.95rem;line-height:1.2}.sch-grid .sch-slot small{font-size:.76rem;opacity:.9}" +
      ".c-ya{background:var(--ya-bg);color:var(--ya)}.c-yb{background:var(--yb-bg);color:var(--yb)}.c-both{background:var(--both-bg);color:var(--both)}" +
      ".k-tutor{background:var(--tutor-bg);color:var(--tutor)}.k-role,.k-meet{background:var(--mute-bg);color:var(--mute)}" +
      ".k-prep{background:#fff;color:var(--mute);border:1px dashed #C7D2E3!important}" +
      ".sch-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin:12px 0 0;padding:0;list-style:none;font-size:.88rem;color:var(--mute)}" +
      ".sch-legend li{display:flex;align-items:center;gap:6px}.sch-legend i{width:14px;height:14px;border-radius:4px;display:inline-block}" +
      ".sch-note{color:var(--mute);font-size:.88rem;margin:10px 0 0}" +
      ".sch-stats{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}.sch-stats span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:.88rem}" +
      ".sch-stats b{font-variant-numeric:tabular-nums}" +
      ".sch-sum{background:#fff;border:1px solid var(--line);border-radius:16px;margin:0 0 18px}" +
      ".sch-sum>summary{cursor:pointer;padding:14px 18px;font-family:'Rubik','Heebo',sans-serif;font-weight:700;font-size:1.1rem;list-style:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap}" +
      ".sch-sum>summary::-webkit-details-marker{display:none}.sch-sum>summary:after{content:'▾';margin-inline-start:auto;color:var(--mute)}.sch-sum[open]>summary:after{content:'▴'}" +
      ".sch-sum-b{padding:0 18px 16px}" +
      ".sch-sum table{width:100%;border-collapse:collapse;font-size:.94rem}.sch-sum th,.sch-sum td{text-align:right;padding:8px 6px;border-bottom:1px solid #EEF2F8;vertical-align:top}" +
      ".sch-sum th{color:var(--mute);font-weight:600;font-size:.85rem}.sch-sum td.num{font-variant-numeric:tabular-nums;color:var(--mute);width:44px}" +
      ".sch-sum .t-a{color:var(--abs);font-weight:600}.sch-sum .t-l{color:var(--late);font-weight:600}.sch-sum .t-ok{color:var(--ok)}.sch-sum .t-miss{color:var(--abs);font-weight:700}" +
      ".sch-sum-w{overflow-x:auto}" +
      ".sch-steps{margin:12px 0 0;padding-inline-start:20px;color:var(--ink);font-size:.92rem;line-height:1.6}" +
      ".sch-kind{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:0 0 12px;font-size:.92rem}.sch-kind b{color:var(--mute);font-weight:600}" +
      ".sch-kind label{display:inline-flex;align-items:center;gap:5px;cursor:pointer}" +
      ".sch-row{flex-wrap:wrap}.sch-evs{display:flex;flex-wrap:wrap;gap:4px;flex-basis:100%;padding:2px 0 2px}" +
      ".sch-ev{font:inherit;font-size:.78rem;border:1px solid var(--line);background:#fff;color:var(--mute);border-radius:999px;padding:3px 9px;cursor:pointer}" +
      ".sch-ev[aria-pressed=true]{background:#EEF3FB;border-color:#7F95BE;color:#0B2A5B;font-weight:700}" +
      ".sch-ev[data-e=c][aria-pressed=true]{background:#E4F3EF;border-color:#7CC3AE;color:var(--ya)}" +
      ".sch-count .n-e{background:#EEF3FB;color:#0B2A5B}" +
      ".sch-sum .t-e{color:#0B2A5B;font-size:.88rem}" +
      ".sch-views{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}" +
      ".sch-views button{font:inherit;border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 14px;cursor:pointer;color:var(--ink)}" +
      ".sch-views button[aria-pressed=true]{background:#0B2A5B;border-color:#0B2A5B;color:#fff;font-weight:700}" +
      ".sch-slot.is-mine{box-shadow:inset 0 0 0 2px currentColor}.sch-mine{font-size:.72rem;font-weight:700}" +
      ".c-cls{background:var(--mute-bg);color:var(--ink)}.c-grp{background:#F7F3FF;color:#4B3A8C}" +
      "@media(max-width:520px){.sch-names{grid-template-columns:1fr}.sch-seg span{padding:6px 8px}}";
    document.head.appendChild(el);
  }

  /* מצב הנוכחות של שיעור בתאריך שנבחר */
  function savedFor(h, s){
    var out = { done:0, need:clsList(s).length, a:0, l:0, x:0 };
    clsList(s).forEach(function(c){
      var e = st.day[h + "|" + c];
      if(e){ out.done++; if(e.k === "x") out.x++; Object.keys(e.m || {}).forEach(function(n){ out[e.m[n]]++; }); }
    });
    return out;
  }
  function badge(h, s){
    if(st.dayLoaded !== st.date) return '<span class="sch-badge">…</span>';
    var v = savedFor(h, s);
    if(v.x) return '<span class="sch-badge">לא התקיים</span>';
    if(v.done < v.need) return '<span class="sch-badge is-miss">' + (v.done ? 'נשמרה כיתה אחת' : 'לא נלקחה נוכחות') + '</span>';
    return '<span class="sch-badge is-done">✓ ' + (v.a || v.l ? (v.a ? (v.a === 1 ? 'חיסור 1' : 'חיסורים ' + v.a) : '') + (v.a && v.l ? ' · ' : '') + (v.l ? (v.l === 1 ? 'איחור 1' : 'איחורים ' + v.l) : '') : 'כולם נוכחים') + '</span>';
  }
  function slotHtml(s, d, h, withBadge){
    var inner = '<span class="sch-h">שעה ' + h + '</span><strong>' + esc(s.subject) + '</strong>' +
      (chip(s) ? '<small>' + esc(chip(s)) + (s.note && !withBadge ? ' · ' + esc(s.note) : '') + '</small>' : '');
    if(s.kind !== "lesson") return '<div class="sch-slot ' + tone(s) + '">' + inner + '</div>';
    var open = st.open && st.open.h === h && wd(st.date) === d && withBadge;
    return '<button type="button" class="sch-slot ' + tone(s) + (open ? ' is-open' : '') + '" data-d="' + d + '" data-h="' + h + '" aria-label="נוכחות: ' + esc(s.subject + ', ' + CLS_NAME[s.cls] + ', שעה ' + h) + '">' + inner + (withBadge ? badge(h, s) : '') + '</button>';
  }

  function dayHtml(){
    var d = wd(st.date);
    var head = '<div class="sch-today-h"><h3 id="schTodayH">' + (isToday(st.date) ? 'היום · ' : '') + nice(st.date) + '</h3>' +
      '<div class="sch-daynav"><button type="button" data-nav="-1" aria-label="יום קודם">→</button>' +
      '<input type="date" id="schDate" value="' + st.date + '" aria-label="בחירת תאריך">' +
      '<button type="button" data-nav="1" aria-label="יום הבא">←</button>' +
      (isToday(st.date) ? '' : '<button type="button" data-nav="0">היום</button>') +
      (d <= 4 ? '<button type="button" class="sch-ed-toggle" data-ed-toggle="1" aria-pressed="' + !!st.edit + '">' + (st.edit ? '✓ סיום שינויים' : '✏️ שינוי במערכת') + '</button>' : '') + '</div></div>';
    if(d > 4) return head + '<p class="sch-msg">ביום הזה אין לך שיעורים.</p>';
    if(st.edit) return head + editDayHtml();
    return head + '<ul class="sch-strip">' + wk(st.date)[d].map(function(s, h){ return s ? '<li>' + slotHtml(s, d, h, true) + '</li>' : ''; }).join("") + '</ul>' +
      '<p class="sch-note">לוחצים על שיעור כדי לסמן נוכחות. כולם מסומנים "נוכח" - מסמנים רק חיסור, איחור או אירוע.</p>';
  }

  function gridHtml(){
    var t = new Date().getDay();
    var head = '<tr><th class="sch-hcol" scope="col">שעה</th>' + DAYS.map(function(d, i){
      return '<th scope="col"' + (i === t ? ' class="is-today" aria-current="date"' : '') + '>' + d + (i === t ? ' · היום' : '') + '</th>';
    }).join("") + '</tr>';
    var rows = HOURS.map(function(h){
      return '<tr><td class="sch-hcol">' + h + '</td>' + DAYS.map(function(_, d){
        var s = wk(todayIso())[d][h], ed = editAt(dateOfWeekday(d), h);
        var cls = (d === t ? 'is-today' : '') + (ed ? ' is-ed' : '');
        return '<td' + (cls ? ' class="' + cls.trim() + '"' : '') + (ed ? ' title="שונה באתר"' : '') + '>' + (s ? slotHtml(s, d, h, false) : (ed ? '<div class="sch-slot k-free"><strong>בוטל / פנוי</strong></div>' : '')) + '</td>';
      }).join("") + '</tr>';
    }).join("");
    return '<div class="sch-wrap"><table class="sch-grid" aria-label="המערכת השבועית"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* מערכת של כיתה שלמה (מסקולי) */
  function classGridHtml(k){
    var t = new Date().getDay(), days = (CLASSES[k][5] || []).some(Boolean) ? DAYS.concat(["שישי"]) : DAYS;
    var head = '<tr><th class="sch-hcol" scope="col">שעה</th>' + days.map(function(d, i){
      return '<th scope="col"' + (i === t ? ' class="is-today" aria-current="date"' : '') + '>' + d + (i === t ? ' · היום' : '') + '</th>';
    }).join("") + '</tr>';
    var rows = HOURS.map(function(h){
      return '<tr><td class="sch-hcol">' + h + '</td>' + days.map(function(_, d){
        var c = (CLASSES[k][d] || [])[h];
        if(!c) return '<td' + (d === t ? ' class="is-today"' : '') + '></td>';
        var cl = c[2] ? (k === "יב" ? "c-yb" : "c-ya") : (c[1] ? "c-grp" : "c-cls");
        return '<td' + (d === t ? ' class="is-today"' : '') + '><div class="sch-slot ' + cl + (c[2] ? ' is-mine' : '') + '"><strong>' + esc(c[0]) + '</strong>' +
          (c[1] ? '<small>' + esc(c[1]) + '</small>' : '') + (c[2] ? '<span class="sch-mine">★ השיעור שלך</span>' : '') + '</div></td>';
      }).join("") + '</tr>';
    }).join("");
    return '<div class="sch-wrap"><table class="sch-grid" aria-label="המערכת של ' + CLS_NAME[k] + '"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }
  function weekHtml(){
    var views = [["me", "המערכת שלי"], ["יא", "כיתה י״א 4"], ["יב", "כיתה י״ב 2"]];
    var tabs = '<div class="sch-views" role="group" aria-label="איזו מערכת להציג">' + views.map(function(v){
      return '<button type="button" data-view="' + v[0] + '" aria-pressed="' + (st.view === v[0]) + '">' + v[1] + '</button>';
    }).join("") + '</div>';
    if(st.view === "me") return '<h3>השבוע כולו</h3>' + tabs + stats() + gridHtml() +
        '<ul class="sch-legend" aria-label="מקרא">' +
          '<li><i class="c-ya"></i>שיעור בי״א 4</li><li><i class="c-yb"></i>שיעור בי״ב 2</li><li><i class="c-both"></i>שתי הכיתות יחד</li>' +
          '<li><i class="k-tutor"></i>פרטני</li><li><i class="k-role"></i>תפקיד / ישיבה</li><li><i class="k-prep"></i>הכנה לבגרות</li>' +
        '</ul>' +
        '<p class="sch-note">לפי המערכת בסקולי (שבוע רגיל), כולל השינויים שהכנסת באתר (מסומנים במסגרת מקווקוות). ביום שישי אין לך שעות. לחיצה על שיעור בטבלה פותחת את הנוכחות שלו בשבוע הנוכחי.</p>' + editsListHtml();
    return '<h3>המערכת של ' + CLS_NAME[st.view] + '</h3>' + tabs + classGridHtml(st.view) +
      '<ul class="sch-legend" aria-label="מקרא"><li><i class="' + (st.view === "יב" ? "c-yb" : "c-ya") + '"></i>השיעורים שלך</li><li><i class="c-cls"></i>שיעור לכל הכיתה</li><li><i class="c-grp"></i>הקבצות ומגמות (כמה קבוצות במקביל)</li></ul>' +
      '<p class="sch-note">לפי המערכת של הכיתה בסקולי (שבוע רגיל), בלי שמות המורים.' + ' עודכן ל-8.11.2026.' + '</p>';
  }

  function stats(){
    var n = { "יא":0, "יב":0, both:0 };
    wk(todayIso()).forEach(function(day){ day.forEach(function(s){ if(s && s.kind === "lesson") n[s.cls]++; }); });
    return '<div class="sch-stats"><span>שיעורים בי״א 4: <b>' + n["יא"] + '</b></span><span>שיעורים בי״ב 2: <b>' + n["יב"] + '</b></span><span>תפילה ופתיחת יום: <b>' + n.both + '</b></span></div>';
  }

  /* ---------- סיכום היום לסקולי ---------- */
  function dayRows(){
    var d = wd(st.date), rows = [];
    if(d > 4) return rows;
    wk(st.date)[d].forEach(function(s, h){
      if(!s || s.kind !== "lesson") return;
      clsList(s).forEach(function(k){
        var e = st.day[h + "|" + k], a = [], l = [], ev = [];
        var abc = function(x, y){ return x.localeCompare(y, "he"); };
        if(e){
          Object.keys(e.m || {}).sort(abc).forEach(function(n){ (e.m[n] === "a" ? a : l).push(n); });
          EV.forEach(function(x){
            var who = Object.keys(e.e || {}).filter(function(n){ return (e.e[n] || []).indexOf(x[0]) >= 0; }).sort(abc);
            if(who.length) ev.push(EVN[x[0]] + ": " + who.join(", "));
          });
        }
        rows.push({ h:h, subject:s.subject, cls:k, done:!!e, kind:(e && e.k) || "p", a:a, l:l, ev:ev });
      });
    });
    return rows;
  }
  function summaryText(rows){
    return "נוכחות - " + nice(st.date) + " (" + st.date.split("-").reverse().join("/") + ")\n" + rows.map(function(r){
      return "שעה " + r.h + " · " + r.subject + " · " + CLS_NAME[r.cls] + ": " +
        (!r.done ? "לא נלקחה נוכחות - לא לעדכן" : r.kind === "x" ? "השיעור לא התקיים" :
          "בדיקת נוכחות: " + CHECKN[r.kind] + " | " + (!r.a.length && !r.l.length ? "כולם נוכחים" :
          (r.a.length ? "חיסור: " + r.a.join(", ") : "") + (r.a.length && r.l.length ? " | " : "") + (r.l.length ? "איחור: " + r.l.join(", ") : "")) +
          (r.ev.length ? " | " + r.ev.join(" | ") : ""));
    }).join("\n");
  }
  function chromePrompt(rows){
    var date = st.date.split("-").reverse().join("/");
    return "אני רוצה שתזין נוכחות במערכת סקולי (app.schooly.co.il) בשבילי. אני כבר מחובר.\n\n" +
      "התאריך: " + nice(st.date) + ", " + date + ".\n" +
      "המורה: לוי אפרים. לעדכן רק את השיעורים שלי שמופיעים ברשימה למטה.\n\n" +
      "איך לעבוד:\n" +
      "1. פתח את \"מערכת ושיעורים\" ועבור לשבוע של התאריך הזה.\n" +
      "2. בכל שיעור ברשימה: פתח את השיעור (לשונית \"אירועים בשיעור\"). ב\"בדיקת נוכחות\" בחר את הסוג שכתוב (פיזי / מקוון / קולי). סמן \"נוכח\" לכל התלמידים, ואז סמן \"חיסור\" או \"איחור\" רק לשמות שכתובים כאן.\n" +
      "   אם כתובים גם מחמאה / הערת התנהגות / ללא מחשב נייד / ללא שיעורי בית - סמן אותם רק לשמות שכתובים. אם הערת התנהגות דורשת טקסט - שאל אותי מה לכתוב.\n" +
      "   שיעור שכתוב לידו \"השיעור לא התקיים\" - סמן בבדיקת נוכחות \"לא התקיים\" ותו לא.\n" +
      "3. בשיעור הראשון - לפני שאתה שומר, עצור והראה לי מה סימנת. אחרי שאאשר, המשך בשאר השיעורים בלי לעצור.\n" +
      "4. אם שם מהרשימה לא נמצא בכיתה, או ששיעור לא נמצא - אל תנחש. דלג וכתוב לי בסוף.\n" +
      "5. שיעור שכתוב לידו \"לא נלקחה נוכחות\" - לא לגעת בו.\n" +
      "6. אל תשנה שום דבר אחר בסקולי (לא נושא, לא ציונים, לא הודעות).\n" +
      "7. בסוף תן לי סיכום קצר: אילו שיעורים עודכנו, ומה דילגת ולמה.\n\n" +
      summaryText(rows);
  }
  function summaryHtml(){
    if(wd(st.date) > 4) return "";
    var rows = dayRows(), miss = rows.filter(function(r){ return !r.done; }).length;
    var abs = 0, late = 0; rows.forEach(function(r){ abs += r.a.length; late += r.l.length; });
    var loading = st.dayLoaded !== st.date;
    return '<details class="sch-sum" id="schSum"' + (st.sumOpen ? ' open' : '') + '><summary>📤 סיכום היום לסקולי' +
      '<span class="sch-badge ' + (miss ? 'is-miss' : 'is-done') + '">' + (loading ? '…' : miss ? 'חסרה נוכחות ב-' + miss + ' שיעורים' : '✓ כל השיעורים מוכנים') + '</span></summary>' +
      '<div class="sch-sum-b">' +
        '<div class="sch-sum-w"><table><thead><tr><th>שעה</th><th>שיעור</th><th>חיסור</th><th>איחור</th><th>אירועים</th></tr></thead><tbody>' +
        rows.map(function(r){
          return '<tr><td class="num">' + r.h + '</td><td>' + esc(r.subject) + ' · ' + CLS_NAME[r.cls] + '</td>' +
            (!r.done ? '<td colspan="3" class="t-miss">לא נלקחה נוכחות</td>' : r.kind === "x" ? '<td colspan="3">השיעור לא התקיים</td>' :
              (!r.a.length && !r.l.length ? '<td colspan="2" class="t-ok">כולם נוכחים' + (r.kind !== "p" ? ' (' + CHECKN[r.kind] + ')' : '') + '</td>' :
                '<td class="t-a">' + (r.a.map(esc).join(", ") || "—") + '</td><td class="t-l">' + (r.l.map(esc).join(", ") || "—") + '</td>') +
              '<td class="t-e">' + (r.ev.map(esc).join("<br>") || "—") + '</td>') + '</tr>';
        }).join("") + '</tbody></table></div>' +
        '<p class="sch-msg" style="margin-top:8px">סה״כ: ' + abs + ' חיסורים · ' + late + ' איחורים</p>' +
        '<div class="sch-foot"><button type="button" class="sch-btn sch-btn--primary" data-act="copyPrompt">🤖 העתקת הוראה ל-Claude בכרום</button>' +
        '<button type="button" class="sch-btn" data-act="copySum">העתקת הסיכום בלבד</button><p class="sch-msg" id="schSumMsg" role="status"></p></div>' +
        '<ol class="sch-steps"><li>לוחצים "העתקת הוראה ל-Claude בכרום".</li><li>פותחים את סקולי בכרום (מחוברים כרגיל) ופותחים את חלונית Claude בצד.</li><li>מדביקים (Ctrl+V) ושולחים. Claude יעצור אחרי השיעור הראשון כדי שתאשר.</li></ol>' +
      '</div></details>';
  }
  function copy(text){
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function(ok, bad){
      var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try{ document.execCommand("copy") ? ok() : bad(); }catch(e){ bad(e); } finally { t.remove(); }
    });
  }

  /* ---------- דף הנוכחות של שיעור ---------- */
  function counts(){
    var c = { p:0, l:0, a:0, e:0 };
    st.open.cls.forEach(function(k){ (st.rosters[k] || []).forEach(function(n){ c[st.marks[k][n] || "p"]++; c.e += (st.events[k][n] || []).length; }); });
    return c;
  }
  function countHtml(){
    var c = counts();
    return '<span class="n-a">חיסור ' + c.a + '</span><span class="n-p">נוכחים ' + c.p + '</span><span class="n-l">איחור ' + c.l + '</span>' + (c.e ? '<span class="n-e">אירועים ' + c.e + '</span>' : '');
  }
  function sheetHtml(){
    var o = st.open; if(!o) return "";
    var s = wk(st.date)[wd(st.date)][o.h];
    var body;
    var missing = o.cls.filter(function(k){ return st.rosters[k] === undefined; });
    if(missing.length) body = '<p class="sch-msg">טוען את רשימת הכיתה…</p>';
    else {
      var kind = '<div class="sch-kind" role="radiogroup" aria-label="בדיקת נוכחות"><b>בדיקת נוכחות:</b>' + CHECK.map(function(x){
        return '<label><input type="radio" name="schKind" value="' + x[0] + '"' + (st.kind === x[0] ? ' checked' : '') + '>' + x[1] + '</label>';
      }).join("") + '</div>';
      if(st.kind === "x") body = kind + '<p class="sch-msg">השיעור יסומן "לא התקיים" - בלי נוכחות.</p>';
      else body = kind + '<div class="sch-count" aria-live="polite">' + countHtml() + '</div>' +
        '<div class="sch-tools"><button type="button" class="sch-btn" data-act="site">💻 חיסור לכל מי שלא נכנס לשיעור באתר</button><button type="button" class="sch-btn" data-act="all">כולם נוכחים, בלי אירועים</button></div>' +
        o.cls.map(function(k){
          var names = st.rosters[k] || [];
          var list = !names.length ? '<p class="sch-msg is-err">אין רשימה שמורה לכיתה ' + CLS_NAME[k] + '. מעלים אותה ב"ניהול שיעור" ← "ניהול רשימות הכיתה".</p>' :
            '<ul class="sch-names">' + names.map(function(n, i){
              var v = st.marks[k][n] || "p", id = "sch-" + k + "-" + i;
              return '<li class="sch-row is-' + v + '"><span class="sch-nm" id="' + id + '">' + esc(n) + (o.site && o.site[nk(n)] ? '<span class="sch-pc" title="נכנס לשיעור באתר">💻</span>' : '') + '</span>' +
                '<span class="sch-seg" role="radiogroup" aria-labelledby="' + id + '">' + ["a", "p", "l"].map(function(m){
                  return '<label><input type="radio" name="' + id + '" value="' + m + '" data-k="' + k + '" data-n="' + esc(n) + '"' + (v === m ? ' checked' : '') + '><span>' + MARK[m] + '</span></label>';
                }).join("") + '</span>' +
                '<span class="sch-evs">' + EV.map(function(x){
                  var on = (st.events[k][n] || []).indexOf(x[0]) >= 0;
                  return '<button type="button" class="sch-ev" data-e="' + x[0] + '" data-k="' + k + '" data-n="' + esc(n) + '" aria-pressed="' + on + '">' + x[1] + '</button>';
                }).join("") + '</span></li>';
            }).join("") + '</ul>';
          return (o.cls.length > 1 ? '<h4 class="sch-cls-h">' + CLS_NAME[k] + '</h4>' : '') + list;
        }).join("");
      body +=
        '<div class="sch-foot"><button type="button" class="sch-btn sch-btn--primary" data-act="save"' + (st.busy ? ' disabled' : '') + '>שמירת נוכחות</button><p class="sch-msg" id="schMsg" role="status">' + (st.dirty ? 'יש שינויים שלא נשמרו.' : '') + '</p></div>';
    }
    return '<section class="sch-sheet" id="schSheet" aria-labelledby="schSheetH"><div class="sch-sheet-h"><h3 id="schSheetH">📋 ' + esc(s.subject) + ' · ' + CLS_NAME[s.cls] + '</h3><span class="sch-msg">שעה ' + o.h + ' · ' + nice(st.date) + '</span>' +
      '<button type="button" class="sch-btn sch-x" data-act="close">סגירה</button></div>' + body + '</section>';
  }

  /* ---------- מצב "שינוי במערכת" ---------- */
  var ED_KINDS = [["lesson", "שיעור בכיתה"], ["tutor", "פרטני"], ["role", "תפקיד / שיחות אישיות"], ["meet", "ישיבה"], ["prep", "הכנה לבגרות"], ["free", "שעה פנויה / בוטל"]];
  var ED_SUBJ = ['תנ"ך', 'תושב"ע', "עברית", "מחשבת ישראל", "היסטוריה", "מכינה לחיים", "תפילה ופתיחת יום", "פרטני", "תפקיד", "שיחות אישיות", "ישיבת צוות", "ישיבת הנהלה", "הכנה לבגרות"];
  var ED_DEF = { tutor:"פרטני", role:"תפקיד", meet:"ישיבה", prep:"הכנה לבגרות" };
  var DAYN = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];
  function short(ds){ var x = parse(ds); return x.getDate() + "." + (x.getMonth() + 1); }
  function editDayHtml(){
    var date = st.date;
    return '<p class="sch-note">בוחרים שעה ומשנים אותה. השינוי נשמר באתר בלבד - בסקולי לא משתנה כלום.</p>' +
      '<ul class="sch-strip sch-edit">' + HOURS.map(function(h){
        var s = cellFor(date, h), ed = editAt(date, h);
        return '<li><button type="button" class="sch-slot ' + (s ? tone(s) : 'k-free') + (st.edH === h ? ' is-open' : '') + (ed ? ' is-ed' : '') + '" data-ed-h="' + h + '" aria-label="שינוי שעה ' + h + '">' +
          '<span class="sch-h">שעה ' + h + '</span><strong>' + (s ? esc(s.subject) : 'שעה פנויה') + '</strong>' + (s && chip(s) ? '<small>' + esc(chip(s)) + '</small>' : '') +
          (ed ? '<span class="sch-badge">✎ ' + (ed.type === "once" ? 'רק ביום הזה' : 'קבוע מ-' + short(ed.e.from)) + '</span>' : '') + '</button></li>';
      }).join("") + '</ul>' + editFormHtml() + '<p class="sch-msg" id="schEdMsg" role="status" aria-live="polite"></p>';
  }
  function editFormHtml(){
    var h = st.edH; if(h === null || h === undefined) return "";
    var date = st.date, s = cellFor(date, h), ed = editAt(date, h), kind = s ? s.kind : "free";
    var opt = function(list, cur){ return list.map(function(x){ return '<option value="' + x[0] + '"' + (x[0] === cur ? ' selected' : '') + '>' + x[1] + '</option>'; }).join(""); };
    return '<form class="sch-edform" id="schEdForm" onsubmit="return false" aria-label="שינוי שעה ' + h + '">' +
      '<h4>שעה ' + h + ' · ' + nice(date) + '</h4>' +
      '<label>מה יש בשעה הזו?<select id="schEdKind">' + opt(ED_KINDS, kind) + '</select></label>' +
      '<label data-ed-f="subj"' + (kind === "free" ? ' hidden' : '') + '>מקצוע / שם<input id="schEdSubj" list="schEdList" maxlength="40" value="' + esc(s ? s.subject : '') + '"></label>' +
      '<datalist id="schEdList">' + ED_SUBJ.map(function(x){ return '<option value="' + esc(x) + '">'; }).join("") + '</datalist>' +
      '<label data-ed-f="cls"' + (kind === "lesson" ? '' : ' hidden') + '>כיתה<select id="schEdCls">' + opt([["יא", CLS_NAME["יא"]], ["יב", CLS_NAME["יב"]], ["both", "שתי הכיתות יחד"]], s && s.cls ? s.cls : "יא") + '</select></label>' +
      '<label data-ed-f="note"' + (kind === "free" ? ' hidden' : '') + '>הערה (לא חובה)<input id="schEdNote" maxlength="60" value="' + esc(s && s.note ? s.note : '') + '"></label>' +
      '<fieldset><legend>לכמה זמן?</legend>' +
        '<label><input type="radio" name="schEdScope" value="once"' + (ed && ed.type === "perm" ? '' : ' checked') + '> רק ב' + nice(date) + ' (ביטול, החלפה, טיול)</label>' +
        '<label><input type="radio" name="schEdScope" value="perm"' + (ed && ed.type === "perm" ? ' checked' : '') + '> קבוע - מ-' + short(date) + ' והלאה, בכל יום ' + DAYN[wd(date)] + '</label>' +
      '</fieldset>' +
      '<div class="sch-edbtns"><button type="button" class="is-main" data-ed-act="save">שמירה</button><button type="button" data-ed-act="cancel">ביטול</button>' +
        (ed ? '<button type="button" data-ed-act="reset">↺ החזרה למה שהיה</button>' : '') + '</div></form>';
  }
  function editsListHtml(){
    var n = edits.perm.length + edits.once.length; if(!n) return "";
    var cellTxt = function(c){ return c ? c.subject + (c.kind === "lesson" ? " (" + CLS_NAME[c.cls] + ")" : "") : "שעה פנויה / בוטל"; };
    var once = edits.once.map(function(e, i){ return { k:"once:" + i, sort:e.date, t:nice(e.date) + " · שעה " + e.h + ": " + cellTxt(e.cell) + " - רק ביום הזה" }; });
    var perm = edits.perm.map(function(e, i){ return { k:"perm:" + i, sort:e.from, t:"מ-" + short(e.from) + ", כל יום " + DAYN[e.d] + " · שעה " + e.h + ": " + cellTxt(e.cell) + " - קבוע" }; });
    var all = perm.concat(once).sort(function(a, b){ return a.sort < b.sort ? 1 : -1; });
    return '<details class="sch-edlist"><summary>✎ שינויים שהכנסתי באתר (' + n + ')</summary><ul>' + all.map(function(x){
      return '<li><span>' + esc(x.t) + '</span><button type="button" data-ed-del="' + x.k + '" aria-label="מחיקת השינוי: ' + esc(x.t) + '">🗑️ מחיקה</button></li>';
    }).join("") + '</ul></details>';
  }
  function edMsg(text, kind){ var m = document.getElementById("schEdMsg") || document.getElementById("schMsg"); if(m){ m.textContent = text; m.className = "sch-msg" + (kind ? " is-" + kind : ""); } }
  function saveEdits(next, done){
    if(st.busy) return;
    st.busy = true; edMsg("שומר…");
    post({ action:"schedEditsSave", edits:next }).then(function(r){
      st.busy = false; setEdits(r.edits || next); st.edH = null; render(); edMsg(done || "✓ נשמר.", "ok");
    }).catch(function(e){
      st.busy = false;
      edMsg(/פעולה לא מוכרת/.test(e.message) ? "השינוי לא נשמר: צריך לעדכן את Code.gs ב-Apps Script לגרסה עם שינויי המערכת." : "השינוי לא נשמר: " + e.message, "err");
    });
  }
  function edVal(id){ var x = document.getElementById(id); return x ? String(x.value || "").trim() : ""; }
  function edSave(){
    var h = st.edH, date = st.date, kind = edVal("schEdKind"), cell = null;
    if(kind !== "free"){
      var subj = edVal("schEdSubj");
      if(!subj){ edMsg("כתבו מקצוע או שם לשעה הזו.", "err"); var f = document.getElementById("schEdSubj"); if(f) f.focus(); return; }
      cell = { kind:kind, subject:subj, note:edVal("schEdNote") };
      if(kind === "lesson") cell.cls = edVal("schEdCls") || "יא";
    }
    var scope = (root.querySelector('input[name="schEdScope"]:checked') || {}).value || "once", d = wd(date);
    var next = { perm:edits.perm.slice(), once:edits.once.filter(function(e){ return !(e.date === date && e.h === h); }) };
    if(scope === "perm"){
      next.perm = next.perm.filter(function(e){ return !(e.d === d && e.h === h && e.from === date); });
      next.perm.push({ from:date, d:d, h:h, cell:cell });
    } else next.once.push({ date:date, h:h, cell:cell });
    saveEdits(next, scope === "perm" ? "✓ נשמר: מ-" + short(date) + " והלאה, בכל יום " + DAYN[d] + "." : "✓ נשמר ל" + nice(date) + ".");
  }
  function edReset(){
    var h = st.edH, date = st.date, ed = editAt(date, h); if(!ed) return;
    var next = { perm:edits.perm.slice(), once:edits.once.slice() };
    if(ed.type === "once") next.once = next.once.filter(function(e){ return e !== ed.e; });
    else {
      if(ed.e.from !== date && !confirm("זה שינוי קבוע מ-" + short(ed.e.from) + ". למחוק אותו לכל השבועות?")) return;
      next.perm = next.perm.filter(function(e){ return e !== ed.e; });
    }
    saveEdits(next, "✓ השעה חזרה למה שהיה.");
  }
  function edDelete(key){
    var p = key.split(":"), list = p[0] === "perm" ? edits.perm : edits.once, item = list[+p[1]];
    if(!item || !confirm("למחוק את השינוי הזה?")) return;
    var next = { perm:edits.perm.filter(function(e){ return e !== item; }), once:edits.once.filter(function(e){ return e !== item; }) };
    saveEdits(next, "✓ השינוי נמחק.");
  }
  function loadEdits(){
    post({ action:"schedEditsGet" }).then(function(r){
      var before = JSON.stringify(edits);
      setEdits(r.edits);
      if(JSON.stringify(edits) !== before && root) render();
    }).catch(function(){ /* שרת ישן או אין חיבור - ממשיכים עם מה שנשמר במכשיר */ });
  }
  function edCss(){
    if(document.getElementById("bmSchedEdCss")) return;
    var el = document.createElement("style"); el.id = "bmSchedEdCss";
    el.textContent =
      ".sch-ed-toggle{margin-inline-start:6px;font-weight:700}" +
      ".sch-ed-toggle[aria-pressed=true]{background:#0B2A5B!important;color:#fff!important;border-color:#0B2A5B!important}" +
      ".sch-edit .sch-slot{cursor:pointer;width:100%;text-align:inherit;font:inherit}" +
      ".sch-slot.k-free{background:#fff;border:1.5px dashed #AEBBD3;color:#56637A}" +
      ".sch-slot.is-ed,td.is-ed .sch-slot{outline:2px dashed #E8650C;outline-offset:-3px}" +
      ".sch-edform{margin:14px 0;padding:16px;border:2px solid #0B2A5B;border-radius:14px;background:#F5F8FD;display:grid;gap:10px;max-width:520px}" +
      ".sch-edform h4{margin:0;color:#0B2A5B;font-size:1.05rem}" +
      ".sch-edform label{display:grid;gap:4px;font-weight:600;color:#0B2A5B}" +
      ".sch-edform label[hidden]{display:none}" +
      ".sch-edform select,.sch-edform input:not([type=radio]){font:inherit;min-height:44px;padding:8px 10px;border:1px solid #C6D2E6;border-radius:8px;background:#fff;color:#0E1B33;box-sizing:border-box;width:100%}" +
      ".sch-edform fieldset{border:1px solid #C6D2E6;border-radius:10px;padding:8px 12px;margin:0;display:grid;gap:6px}" +
      ".sch-edform fieldset label{display:flex;align-items:center;gap:8px;font-weight:500}" +
      ".sch-edform legend{font-weight:700;color:#0B2A5B;padding:0 4px}" +
      ".sch-edbtns{display:flex;flex-wrap:wrap;gap:8px}" +
      ".sch-edbtns button,.sch-edlist button{font:inherit;min-height:44px;padding:8px 16px;border-radius:10px;border:1.5px solid #0B2A5B;background:#fff;color:#0B2A5B;font-weight:700;cursor:pointer}" +
      ".sch-edbtns button.is-main{background:#0B2A5B;color:#fff}" +
      ".sch-edlist{margin-top:14px}.sch-edlist summary{cursor:pointer;font-weight:700;color:#0B2A5B;min-height:44px;display:flex;align-items:center}" +
      ".sch-edlist ul{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}" +
      ".sch-edlist li{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;border:1px solid #DCE4F1;border-radius:10px;background:#fff}" +
      ".sch-edlist li span{min-width:0;overflow-wrap:anywhere}" +
      ".sch-edit .sch-slot:focus-visible,.sch-edform :focus-visible,.sch-edlist button:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}";
    document.head.appendChild(el);
  }

  function render(focusSel){
    root.innerHTML =
      '<div class="sch">' +
        '<section class="sch-today" aria-labelledby="schTodayH">' + dayHtml() + '</section>' +
        sheetHtml() + summaryHtml() +
        weekHtml() +
      '</div>';
    if(focusSel){ var f = root.querySelector(focusSel); if(f) f.focus(); }
  }
  function msg(text, kind){ var m = document.getElementById("schMsg"); if(m){ m.textContent = text; m.className = "sch-msg" + (kind ? " is-" + kind : ""); } }

  function loadDay(){
    var date = st.date;
    return post({ action:"attDay", date:date }).then(function(r){
      if(st.date !== date) return;
      st.day = r.day || {}; st.dayLoaded = date; render();
    }).catch(function(){ if(st.date === date){ st.day = {}; st.dayLoaded = date; render(); } });
  }
  function setDate(d){
    if(st.dirty && !confirm("יש נוכחות שלא נשמרה. לעבור בכל זאת?")) return false;
    st.date = d; st.open = null; st.dirty = false; st.dayLoaded = ""; st.day = {};
    render(); loadDay(); return true;
  }
  function loadRoster(k){
    if(st.rosters[k] !== undefined) return Promise.resolve();
    return post({ action:"attRoster", cls:k }).then(function(r){ st.rosters[k] = r.names || []; })
      .catch(function(e){ st.rosters[k] = []; });
  }
  function openLesson(h){
    var s = wk(st.date)[wd(st.date)][h];
    if(!s || s.kind !== "lesson") return;
    if(st.open && st.open.h === h) return;
    if(st.dirty && !confirm("יש נוכחות שלא נשמרה. לעבור בכל זאת?")) return;
    var cls = clsList(s), marks = {}, events = {}, kind = "p";
    cls.forEach(function(k){
      var e = st.day[h + "|" + k];
      marks[k] = Object.assign({}, (e && e.m) || {});
      events[k] = {}; Object.keys((e && e.e) || {}).forEach(function(n){ events[k][n] = e.e[n].slice(); });
      if(e && e.k) kind = e.k;
    });
    st.open = { h:h, cls:cls, site:null }; st.marks = marks; st.events = events; st.kind = kind; st.dirty = false;
    render();
    Promise.all(cls.map(loadRoster)).then(function(){ if(st.open && st.open.h === h){ render(); var sh = document.getElementById("schSheet"); if(sh) sh.scrollIntoView({ block:"start", behavior:"smooth" }); } });
  }

  /* מי נכנס לשיעור באתר (בקרת השיעור) - לפי הכיתה */
  function fromSite(){
    var o = st.open; if(!o) return;
    msg("בודק מי נכנס לשיעור באתר…");
    post({ action:"presenceList" }).then(function(r){
      var codes = (r.lessons || []).filter(function(l){ return o.cls.indexOf(l.cls) >= 0; }).map(function(l){ return l.code; });
      if(!codes.length) throw new Error("אין עכשיו שיעור פתוח באתר לכיתה הזו.");
      return Promise.all(codes.map(function(c){ return post({ action:"presenceList", code:c }); }));
    }).then(function(list){
      var seen = {};
      list.forEach(function(r){ (r.students || []).forEach(function(x){ if(!x.kicked) seen[nk(x.name)] = 1; }); });
      if(st.open !== o) return;
      o.site = seen;
      var n = 0;
      o.cls.forEach(function(k){ (st.rosters[k] || []).forEach(function(name){ if(!seen[nk(name)] && st.marks[k][name] !== "a"){ st.marks[k][name] = "a"; n++; } }); });
      st.dirty = true; render();
      msg(Object.keys(seen).length + " נכנסו לשיעור באתר. " + (n ? "סומנו " + n + " חיסורים - בדקו ושמרו." : "כולם נכנסו."), "ok");
    }).catch(function(e){ msg(e.message, "err"); });
  }

  function save(){
    var o = st.open; if(!o || st.busy) return;
    var s = wk(st.date)[wd(st.date)][o.h];
    st.busy = true; render(); msg("שומר…");
    var date = st.date;
    Promise.all(o.cls.filter(function(k){ return st.kind === "x" || (st.rosters[k] || []).length; }).map(function(k){
      var m = {}, ev = {}, kind = st.kind;
      if(kind !== "x"){
        Object.keys(st.marks[k]).forEach(function(n){ if(st.marks[k][n] !== "p") m[n] = st.marks[k][n]; });
        Object.keys(st.events[k]).forEach(function(n){ if((st.events[k][n] || []).length) ev[n] = st.events[k][n].slice(); });
      }
      return post({ action:"attSave", date:date, hour:o.h, cls:k, subject:s.subject, marks:m, events:ev, kind:kind }).then(function(){ st.day[o.h + "|" + k] = { s:s.subject, t:Date.now(), m:m, e:ev, k:kind }; });
    })).then(function(){
      st.busy = false; st.dirty = false; render(); msg("✓ הנוכחות נשמרה.", "ok");
    }).catch(function(e){ st.busy = false; render(); msg("לא נשמר: " + e.message, "err"); });
  }

  function bind(){
    root.addEventListener("toggle", function(e){ if(e.target.id === "schSum") st.sumOpen = e.target.open; }, true);
    root.addEventListener("click", function(e){
      var b = e.target.closest("button"); if(!b || !root.contains(b)) return;
      if(b.hasAttribute("data-view")){ st.view = b.getAttribute("data-view"); render('[data-view="' + st.view + '"]'); return; }
      if(b.hasAttribute("data-ed-toggle")){
        if(!st.edit && st.dirty && !confirm("יש נוכחות שלא נשמרה. לעבור לשינוי המערכת בכל זאת?")) return;
        st.edit = !st.edit; st.edH = null; st.open = null; st.dirty = false; render(".sch-ed-toggle"); return;
      }
      if(b.hasAttribute("data-ed-h")){ var eh = +b.getAttribute("data-ed-h"); st.edH = st.edH === eh ? null : eh; render(st.edH === null ? '[data-ed-h="' + eh + '"]' : "#schEdKind"); return; }
      if(b.hasAttribute("data-ed-act")){
        var ea = b.getAttribute("data-ed-act");
        if(ea === "save") edSave(); else if(ea === "reset") edReset(); else { var back = st.edH; st.edH = null; render('[data-ed-h="' + back + '"]'); }
        return;
      }
      if(b.hasAttribute("data-ed-del")){ edDelete(b.getAttribute("data-ed-del")); return; }
      if(b.hasAttribute("data-e")){
        var ek = b.getAttribute("data-k"), en = b.getAttribute("data-n"), code = b.getAttribute("data-e");
        var arr = st.events[ek][en] || (st.events[ek][en] = []), at = arr.indexOf(code);
        if(at >= 0) arr.splice(at, 1); else arr.push(code);
        b.setAttribute("aria-pressed", String(at < 0));
        st.dirty = true;
        var cb = root.querySelector(".sch-count"); if(cb) cb.innerHTML = countHtml();
        msg("יש שינויים שלא נשמרו.");
        return;
      }
      if(b.hasAttribute("data-nav")){
        var v = +b.getAttribute("data-nav");
        setDate(v === 0 ? iso(new Date()) : shift(st.date, v));
      } else if(b.hasAttribute("data-h")){
        var d = +b.getAttribute("data-d"), h = +b.getAttribute("data-h");
        if(wd(st.date) !== d && !setDate(dateOfWeekday(d))) return;
        openLesson(h);
      } else {
        var a = b.getAttribute("data-act");
        if(a === "close"){ if(st.dirty && !confirm("יש נוכחות שלא נשמרה. לסגור בכל זאת?")) return; st.open = null; st.dirty = false; render(); }
        else if(a === "all"){ st.open.cls.forEach(function(k){ st.marks[k] = {}; st.events[k] = {}; }); st.dirty = true; render(); }
        else if(a === "site") fromSite();
        else if(a === "save") save();
        else if(a === "copyPrompt" || a === "copySum"){
          var rows = dayRows(), sm = document.getElementById("schSumMsg");
          copy(a === "copyPrompt" ? chromePrompt(rows) : summaryText(rows)).then(function(){
            if(sm){ sm.className = "sch-msg is-ok"; sm.textContent = a === "copyPrompt" ? "✓ הועתק. עכשיו מדביקים בחלונית של Claude בכרום, כשסקולי פתוח." : "✓ הסיכום הועתק."; }
          }).catch(function(){ if(sm){ sm.className = "sch-msg is-err"; sm.textContent = "ההעתקה לא הצליחה. נסו שוב."; } });
        }
      }
    });
    root.addEventListener("change", function(e){
      var t = e.target;
      if(t.id === "schDate" && /^\d{4}-\d{2}-\d{2}$/.test(t.value)){ setDate(t.value); return; }
      if(t.id === "schEdKind"){
        var fk = t.value, form = document.getElementById("schEdForm");
        if(form){
          form.querySelector('[data-ed-f="subj"]').hidden = fk === "free";
          form.querySelector('[data-ed-f="note"]').hidden = fk === "free";
          form.querySelector('[data-ed-f="cls"]').hidden = fk !== "lesson";
          var sj = document.getElementById("schEdSubj");
          if(sj && ED_DEF[fk] && (!sj.value || /^(פרטני|תפקיד|ישיבה|הכנה לבגרות)$/.test(sj.value))) sj.value = ED_DEF[fk];
        }
        return;
      }
      if(t.name === "schKind"){ st.kind = t.value; st.dirty = true; render('input[name="schKind"]:checked'); msg("יש שינויים שלא נשמרו."); return; }
      if(t.type === "radio" && t.hasAttribute("data-k")){
        var k = t.getAttribute("data-k"), n = t.getAttribute("data-n");
        if(t.value === "p") delete st.marks[k][n]; else st.marks[k][n] = t.value;
        st.dirty = true;
        var row = t.closest(".sch-row"); if(row) row.className = "sch-row is-" + t.value;
        var box = root.querySelector(".sch-count");
        if(box) box.innerHTML = countHtml();
        msg("יש שינויים שלא נשמרו.");
      }
    });
  }

  function mount(el){
    if(!el || el.dataset.schMounted) return;
    el.dataset.schMounted = "1";
    root = el; css(); edCss(); bind();
    st.date = iso(new Date());
    render(); loadDay(); loadEdits();
  }

  window.BM_MY_SCHEDULE = { mount:mount, week:WEEK, days:DAYS, clsName:CLS_NAME, classes:CLASSES, weekFor:wk };
})();
