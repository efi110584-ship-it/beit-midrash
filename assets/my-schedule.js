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
  /* WEEK[יום][שעה] - יום 0 = ראשון */
  var WEEK = [
    [PRAY, L('תושב"ע', "יא"), K("role", "תפקיד"), L('תושב"ע', "יב"), L('תושב"ע', "יב"), L('תנ"ך', "יא"), K("meet", "ישיבת הנהלה"), K("meet", "ישיבת הנהלה"), K("prep", "הכנה לבגרות")],
    [PRAY, K("role", "תפקיד"), L("מכינה לחיים", "יא"), L('תנ"ך', "יא"), HEB, L('תנ"ך', "יב"), K("role", "תפקיד"), K("role", "תפקיד"), K("prep", "הכנה לבגרות")],
    [PRAY, K("tutor", "פרטני"), K("role", "תפקיד"), K("tutor", 'פרטני מעו"ף'), HEB, HEB, L('תושב"ע', "יא"), L('תושב"ע', "יא"), K("prep", "הכנה לבגרות")],
    [PRAY, L("מכינה לחיים", "יב"), L('תושב"ע', "יב"), L('תושב"ע', "יא"), L('תנ"ך', "יא"), K("meet", "קהילת הוראה דיפרנציאלית"), K("tutor", 'פרטני מעו"ף'), K("tutor", 'פרטני מעו"ף'), K("prep", "הכנה לבגרות")],
    [PRAY, L('תנ"ך', "יב"), L('תנ"ך', "יב"), K("role", "שיחות אישיות"), K("meet", "ישיבת כיתה יב2"), K("role", "תפקיד"), K("meet", "ישיבת מחנכים תיכון"), K("role", "תפקיד"), K("prep", "הכנה לבגרות")]
  ];
  var CLS_NAME = { "יא":"י״א 4", "יב":"י״ב 2", "both":"י״א 4 + י״ב 2" };


  var MARK = { p:"נוכח", l:"איחור", a:"חסר" };
  var st = { date:"", day:{}, dayLoaded:"", rosters:{}, open:null, marks:{}, dirty:false, busy:false };
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
      ".sch-names{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:0 18px}" +
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
      "@media(max-width:520px){.sch-names{grid-template-columns:1fr}.sch-seg span{padding:6px 8px}}";
    document.head.appendChild(el);
  }

  /* מצב הנוכחות של שיעור בתאריך שנבחר */
  function savedFor(h, s){
    var out = { done:0, need:clsList(s).length, a:0, l:0 };
    clsList(s).forEach(function(c){
      var e = st.day[h + "|" + c];
      if(e){ out.done++; Object.keys(e.m || {}).forEach(function(n){ out[e.m[n]]++; }); }
    });
    return out;
  }
  function badge(h, s){
    if(st.dayLoaded !== st.date) return '<span class="sch-badge">…</span>';
    var v = savedFor(h, s);
    if(v.done < v.need) return '<span class="sch-badge is-miss">' + (v.done ? 'נשמרה כיתה אחת' : 'לא נלקחה נוכחות') + '</span>';
    return '<span class="sch-badge is-done">✓ ' + (v.a || v.l ? (v.a ? (v.a === 1 ? 'חסר 1' : 'חסרים ' + v.a) : '') + (v.a && v.l ? ' · ' : '') + (v.l ? (v.l === 1 ? 'איחור 1' : 'איחורים ' + v.l) : '') : 'כולם נוכחים') + '</span>';
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
      (isToday(st.date) ? '' : '<button type="button" data-nav="0">היום</button>') + '</div></div>';
    if(d > 4) return head + '<p class="sch-msg">ביום הזה אין לך שיעורים.</p>';
    return head + '<ul class="sch-strip">' + WEEK[d].map(function(s, h){ return '<li>' + slotHtml(s, d, h, true) + '</li>'; }).join("") + '</ul>' +
      '<p class="sch-note">לוחצים על שיעור כדי לסמן נוכחות. כולם מסומנים "נוכח" - מסמנים רק מי שחסר או איחר.</p>';
  }

  function gridHtml(){
    var t = new Date().getDay();
    var head = '<tr><th class="sch-hcol" scope="col">שעה</th>' + DAYS.map(function(d, i){
      return '<th scope="col"' + (i === t ? ' class="is-today" aria-current="date"' : '') + '>' + d + (i === t ? ' · היום' : '') + '</th>';
    }).join("") + '</tr>';
    var rows = HOURS.map(function(h){
      return '<tr><td class="sch-hcol">' + h + '</td>' + DAYS.map(function(_, d){
        var s = WEEK[d][h];
        return '<td' + (d === t ? ' class="is-today"' : '') + '>' + (s ? slotHtml(s, d, h, false) : '') + '</td>';
      }).join("") + '</tr>';
    }).join("");
    return '<div class="sch-wrap"><table class="sch-grid" aria-label="המערכת השבועית"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  function stats(){
    var n = { "יא":0, "יב":0, both:0 };
    WEEK.forEach(function(day){ day.forEach(function(s){ if(s && s.kind === "lesson") n[s.cls]++; }); });
    return '<div class="sch-stats"><span>שיעורים בי״א 4: <b>' + n["יא"] + '</b></span><span>שיעורים בי״ב 2: <b>' + n["יב"] + '</b></span><span>תפילה ופתיחת יום: <b>' + n.both + '</b></span></div>';
  }

  /* ---------- דף הנוכחות של שיעור ---------- */
  function counts(){
    var c = { p:0, l:0, a:0 };
    st.open.cls.forEach(function(k){ (st.rosters[k] || []).forEach(function(n){ c[st.marks[k][n] || "p"]++; }); });
    return c;
  }
  function sheetHtml(){
    var o = st.open; if(!o) return "";
    var s = WEEK[wd(st.date)][o.h];
    var body;
    var missing = o.cls.filter(function(k){ return st.rosters[k] === undefined; });
    if(missing.length) body = '<p class="sch-msg">טוען את רשימת הכיתה…</p>';
    else {
      var c = counts();
      body = '<div class="sch-count" aria-live="polite"><span class="n-p">נוכחים ' + c.p + '</span><span class="n-l">איחור ' + c.l + '</span><span class="n-a">חסרים ' + c.a + '</span></div>' +
        '<div class="sch-tools"><button type="button" class="sch-btn" data-act="site">💻 חסר לכל מי שלא נכנס לשיעור באתר</button><button type="button" class="sch-btn" data-act="all">כולם נוכחים</button></div>' +
        o.cls.map(function(k){
          var names = st.rosters[k] || [];
          var list = !names.length ? '<p class="sch-msg is-err">אין רשימה שמורה לכיתה ' + CLS_NAME[k] + '. מעלים אותה ב"ניהול שיעור" ← "ניהול רשימות הכיתה".</p>' :
            '<ul class="sch-names">' + names.map(function(n, i){
              var v = st.marks[k][n] || "p", id = "sch-" + k + "-" + i;
              return '<li class="sch-row is-' + v + '"><span class="sch-nm" id="' + id + '">' + esc(n) + (o.site && o.site[nk(n)] ? '<span class="sch-pc" title="נכנס לשיעור באתר">💻</span>' : '') + '</span>' +
                '<span class="sch-seg" role="radiogroup" aria-labelledby="' + id + '">' + ["p", "l", "a"].map(function(m){
                  return '<label><input type="radio" name="' + id + '" value="' + m + '" data-k="' + k + '" data-n="' + esc(n) + '"' + (v === m ? ' checked' : '') + '><span>' + MARK[m] + '</span></label>';
                }).join("") + '</span></li>';
            }).join("") + '</ul>';
          return (o.cls.length > 1 ? '<h4 class="sch-cls-h">' + CLS_NAME[k] + '</h4>' : '') + list;
        }).join("") +
        '<div class="sch-foot"><button type="button" class="sch-btn sch-btn--primary" data-act="save"' + (st.busy ? ' disabled' : '') + '>שמירת נוכחות</button><p class="sch-msg" id="schMsg" role="status">' + (st.dirty ? 'יש שינויים שלא נשמרו.' : '') + '</p></div>';
    }
    return '<section class="sch-sheet" id="schSheet" aria-labelledby="schSheetH"><div class="sch-sheet-h"><h3 id="schSheetH">📋 ' + esc(s.subject) + ' · ' + CLS_NAME[s.cls] + '</h3><span class="sch-msg">שעה ' + o.h + ' · ' + nice(st.date) + '</span>' +
      '<button type="button" class="sch-btn sch-x" data-act="close">סגירה</button></div>' + body + '</section>';
  }

  function render(focusSel){
    root.innerHTML =
      '<div class="sch">' +
        '<section class="sch-today" aria-labelledby="schTodayH">' + dayHtml() + '</section>' +
        sheetHtml() +
        '<h3>השבוע כולו</h3>' + stats() + gridHtml() +
        '<ul class="sch-legend" aria-label="מקרא">' +
          '<li><i class="c-ya"></i>שיעור בי״א 4</li><li><i class="c-yb"></i>שיעור בי״ב 2</li><li><i class="c-both"></i>שתי הכיתות יחד</li>' +
          '<li><i class="k-tutor"></i>פרטני</li><li><i class="k-role"></i>תפקיד / ישיבה</li><li><i class="k-prep"></i>הכנה לבגרות</li>' +
        '</ul>' +
        '<p class="sch-note">לפי המערכת בסקולי (שבוע רגיל). ביום שישי אין לך שעות. לחיצה על שיעור בטבלה פותחת את הנוכחות שלו בשבוע הנוכחי.</p>' +
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
    var s = WEEK[wd(st.date)][h];
    if(!s || s.kind !== "lesson") return;
    if(st.open && st.open.h === h) return;
    if(st.dirty && !confirm("יש נוכחות שלא נשמרה. לעבור בכל זאת?")) return;
    var cls = clsList(s), marks = {};
    cls.forEach(function(k){ var e = st.day[h + "|" + k]; marks[k] = Object.assign({}, (e && e.m) || {}); });
    st.open = { h:h, cls:cls, site:null }; st.marks = marks; st.dirty = false;
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
      msg(Object.keys(seen).length + " נכנסו לשיעור באתר. " + (n ? "סומנו " + n + " חסרים - בדקו ושמרו." : "כולם נכנסו."), "ok");
    }).catch(function(e){ msg(e.message, "err"); });
  }

  function save(){
    var o = st.open; if(!o || st.busy) return;
    var s = WEEK[wd(st.date)][o.h];
    st.busy = true; render(); msg("שומר…");
    var date = st.date;
    Promise.all(o.cls.filter(function(k){ return (st.rosters[k] || []).length; }).map(function(k){
      var m = {}; Object.keys(st.marks[k]).forEach(function(n){ if(st.marks[k][n] !== "p") m[n] = st.marks[k][n]; });
      return post({ action:"attSave", date:date, hour:o.h, cls:k, subject:s.subject, marks:m }).then(function(){ st.day[o.h + "|" + k] = { s:s.subject, t:Date.now(), m:m }; });
    })).then(function(){
      st.busy = false; st.dirty = false; render(); msg("✓ הנוכחות נשמרה.", "ok");
    }).catch(function(e){ st.busy = false; render(); msg("לא נשמר: " + e.message, "err"); });
  }

  function bind(){
    root.addEventListener("click", function(e){
      var b = e.target.closest("button"); if(!b || !root.contains(b)) return;
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
        else if(a === "all"){ st.open.cls.forEach(function(k){ st.marks[k] = {}; }); st.dirty = true; render(); }
        else if(a === "site") fromSite();
        else if(a === "save") save();
      }
    });
    root.addEventListener("change", function(e){
      var t = e.target;
      if(t.id === "schDate" && /^\d{4}-\d{2}-\d{2}$/.test(t.value)){ setDate(t.value); return; }
      if(t.type === "radio" && t.hasAttribute("data-k")){
        var k = t.getAttribute("data-k"), n = t.getAttribute("data-n");
        if(t.value === "p") delete st.marks[k][n]; else st.marks[k][n] = t.value;
        st.dirty = true;
        var row = t.closest(".sch-row"); if(row) row.className = "sch-row is-" + t.value;
        var c = counts(), box = root.querySelector(".sch-count");
        if(box) box.innerHTML = '<span class="n-p">נוכחים ' + c.p + '</span><span class="n-l">איחור ' + c.l + '</span><span class="n-a">חסרים ' + c.a + '</span>';
        msg("יש שינויים שלא נשמרו.");
      }
    });
  }

  function mount(el){
    if(!el || el.dataset.schMounted) return;
    el.dataset.schMounted = "1";
    root = el; css(); bind();
    st.date = iso(new Date());
    render(); loadDay();
  }

  window.BM_MY_SCHEDULE = { mount:mount, week:WEEK, days:DAYS, clsName:CLS_NAME };
})();
