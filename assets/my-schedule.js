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

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function tone(s){ return s.kind === "lesson" ? "c-" + (s.cls === "both" ? "both" : s.cls === "יב" ? "yb" : "ya") : "k-" + s.kind; }
  function chip(s){ return s.kind === "lesson" ? CLS_NAME[s.cls] : ""; }
  /* היום הקרוב שיש בו לימודים: שישי ושבת -> ראשון */
  function todayIdx(){ var d = new Date().getDay(); return d <= 4 ? d : -1; }

  function css(){
    if(document.getElementById("bmSchedCss")) return;
    var st = document.createElement("style");
    st.id = "bmSchedCss";
    st.textContent =
      ".sch{--ya:#0F6B5F;--ya-bg:#E4F3EF;--yb:#3542A0;--yb-bg:#EBEDFB;--both:#8A5300;--both-bg:#FFF2D6;--tutor:#9B2C5C;--tutor-bg:#FBEAF1;--mute:#56637A;--mute-bg:#F2F5F9;--line:#DCE4F1;--ink:#0E1B33;color:var(--ink)}" +
      ".sch h3{font-family:'Rubik','Heebo',sans-serif;margin:0 0 10px;font-size:1.2rem}" +
      ".sch-today{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin:0 0 18px}" +
      ".sch-today-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 10px}.sch-today-h h3{margin:0}.sch-today-h span{color:var(--mute);font-size:.92rem}" +
      ".sch-strip{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}" +
      ".sch-strip li{display:flex;flex-direction:column;gap:3px;border-radius:12px;padding:10px 12px;border:1px solid transparent;min-width:0}" +
      ".sch-strip .sch-h{font-size:.8rem;font-weight:700;opacity:.8;font-variant-numeric:tabular-nums}" +
      ".sch-strip strong{font-family:'Rubik','Heebo',sans-serif;font-size:1.02rem;line-height:1.25}" +
      ".sch-strip small{font-size:.82rem}" +
      ".sch-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:16px;background:#fff}" +
      ".sch-grid{width:100%;min-width:640px;border-collapse:separate;border-spacing:0;table-layout:fixed}" +
      ".sch-grid th{font-family:'Rubik','Heebo',sans-serif;font-weight:700;font-size:.95rem;padding:10px 6px;background:#F7F9FC;border-bottom:1px solid var(--line);position:sticky;top:0}" +
      ".sch-grid th.is-today{background:#0B2A5B;color:#fff}" +
      ".sch-grid th.sch-hcol,.sch-grid td.sch-hcol{width:52px;text-align:center;color:var(--mute);font-variant-numeric:tabular-nums}" +
      ".sch-grid td{padding:4px;border-bottom:1px solid #EEF2F8;vertical-align:top}" +
      ".sch-grid tr:last-child td{border-bottom:0}" +
      ".sch-grid td.is-today{background:#F4F7FD}" +
      ".sch-cell{display:flex;flex-direction:column;gap:2px;border-radius:10px;padding:7px 9px;min-height:52px;border:1px solid transparent}" +
      ".sch-cell b{font-family:'Rubik','Heebo',sans-serif;font-size:.95rem;line-height:1.2}.sch-cell small{font-size:.76rem;opacity:.9}" +
      ".c-ya{background:var(--ya-bg);color:var(--ya)}.c-yb{background:var(--yb-bg);color:var(--yb)}.c-both{background:var(--both-bg);color:var(--both)}" +
      ".k-tutor{background:var(--tutor-bg);color:var(--tutor)}.k-role,.k-meet{background:var(--mute-bg);color:var(--mute)}" +
      ".k-prep{background:#fff;color:var(--mute);border:1px dashed #C7D2E3!important}" +
      ".sch-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin:12px 0 0;padding:0;list-style:none;font-size:.88rem;color:var(--mute)}" +
      ".sch-legend li{display:flex;align-items:center;gap:6px}.sch-legend i{width:14px;height:14px;border-radius:4px;display:inline-block}" +
      ".sch-note{color:var(--mute);font-size:.88rem;margin:10px 0 0}" +
      ".sch-stats{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}.sch-stats span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:.88rem}" +
      ".sch-stats b{font-variant-numeric:tabular-nums}";
    document.head.appendChild(st);
  }

  function stripHtml(d){
    return '<ul class="sch-strip">' + WEEK[d].map(function(s, h){
      return '<li class="' + tone(s) + '"><span class="sch-h">שעה ' + h + '</span><strong>' + esc(s.subject) + '</strong>' + (chip(s) ? '<small>' + esc(chip(s)) + '</small>' : '') + '</li>';
    }).join("") + '</ul>';
  }

  function gridHtml(today){
    var head = '<tr><th class="sch-hcol" scope="col">שעה</th>' + DAYS.map(function(d, i){
      return '<th scope="col"' + (i === today ? ' class="is-today" aria-current="date"' : '') + '>' + d + (i === today ? ' · היום' : '') + '</th>';
    }).join("") + '</tr>';
    var rows = HOURS.map(function(h){
      return '<tr><td class="sch-hcol">' + h + '</td>' + DAYS.map(function(_, d){
        var s = WEEK[d][h];
        if(!s) return '<td' + (d === today ? ' class="is-today"' : '') + '></td>';
        return '<td' + (d === today ? ' class="is-today"' : '') + '><div class="sch-cell ' + tone(s) + '"><b>' + esc(s.subject) + '</b>' + (chip(s) ? '<small>' + esc(chip(s)) + (s.note ? ' · ' + esc(s.note) : '') + '</small>' : '') + '</div></td>';
      }).join("") + '</tr>';
    }).join("");
    return '<div class="sch-wrap"><table class="sch-grid" aria-label="המערכת השבועית"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  function stats(){
    var n = { "יא":0, "יב":0, both:0 };
    WEEK.forEach(function(day){ day.forEach(function(s){ if(s && s.kind === "lesson") n[s.cls]++; }); });
    return '<div class="sch-stats"><span>שיעורים בי״א 4: <b>' + n["יא"] + '</b></span><span>שיעורים בי״ב 2: <b>' + n["יב"] + '</b></span><span>תפילה ופתיחת יום: <b>' + n.both + '</b></span></div>';
  }

  function mount(el){
    if(!el || el.dataset.schMounted) return;
    el.dataset.schMounted = "1";
    css();
    var t = todayIdx(), show = t < 0 ? 0 : t;
    el.innerHTML =
      '<div class="sch">' +
        '<section class="sch-today" aria-labelledby="schTodayH">' +
          '<div class="sch-today-h"><h3 id="schTodayH">' + (t < 0 ? 'יום ראשון הקרוב' : 'היום · יום ' + DAYS[t]) + '</h3><span>' + (t < 0 ? 'היום אין לימודים' : '') + '</span></div>' +
          stripHtml(show) +
        '</section>' +
        '<h3>השבוע כולו</h3>' + stats() + gridHtml(t) +
        '<ul class="sch-legend" aria-label="מקרא">' +
          '<li><i class="c-ya"></i>שיעור בי״א 4</li><li><i class="c-yb"></i>שיעור בי״ב 2</li><li><i class="c-both"></i>שתי הכיתות יחד</li>' +
          '<li><i class="k-tutor"></i>פרטני</li><li><i class="k-role"></i>תפקיד / ישיבה</li><li><i class="k-prep"></i>הכנה לבגרות</li>' +
        '</ul>' +
        '<p class="sch-note">לפי המערכת בסקולי (שבוע רגיל). ביום שישי אין לך שעות.</p>' +
      '</div>';
  }

  window.BM_MY_SCHEDULE = { mount:mount, week:WEEK, days:DAYS, clsName:CLS_NAME };
})();
