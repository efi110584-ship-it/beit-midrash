/* ============================================================
   "המערכת היום" - שורה אחת בדף הבית (מעל לוח המבחנים)
   ============================================================
   קובייה לכל שעה של יום הלימודים, עם מתג: המערכת של המורה / י"א 4 / י"ב 2.
   הנתונים מ-assets/my-schedule.js (BM_MY_SCHEDULE) - רק מקצועות, בלי מידע על תלמידים.
   אחרי 16:00, ובשישי/שבת - מוצג יום הלימודים הבא.
   הבחירה במתג נשמרת במכשיר (localStorage).
   ============================================================ */
(function(){
  "use strict";
  var DAYN = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  var KEY = "bm-daystrip-view";

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function day0(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function isoOf(d){ return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function schoolDay(){
    var now = new Date(), d = day0(now);
    if(d.getDay() <= 4 && now.getHours() >= 16) d.setDate(d.getDate() + 1);
    while(d.getDay() > 4) d.setDate(d.getDate() + 1);
    var n = Math.round((d - day0(now)) / 86400000);
    return { d:d, label:n === 0 ? "היום" : n === 1 ? "מחר" : "" };
  }

  function css(){
    if(document.getElementById("dsCss")) return;
    var st = document.createElement("style");
    st.id = "dsCss";
    st.textContent =
      ".ds{background:#fff;border:1px solid #DCE4F1;border-radius:14px;padding:12px 14px 14px;margin:0 0 14px;color:#0E1B33;text-align:right}" +
      ".ds-h{display:flex;align-items:center;gap:8px 10px;flex-wrap:wrap;margin:0 0 10px}" +
      ".ds-h h2{margin:0;font-size:1.05rem;font-weight:700}" +
      ".ds-when{color:#56637A;font-size:.9rem}" +
      ".ds-seg{display:inline-flex;border:1px solid #DCE4F1;border-radius:999px;padding:2px;margin-inline-start:auto;background:#F4F7FD}" +
      ".ds-seg button{border:0;background:transparent;font:inherit;font-size:.86rem;font-weight:600;color:#56637A;padding:4px 12px;border-radius:999px;cursor:pointer}" +
      ".ds-seg button[aria-pressed=true]{background:#0B2A5B;color:#fff}" +
      ".ds-seg button:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      ".ds-hours{list-style:none;margin:0;padding:0;display:grid;gap:6px}" +
      ".ds-hr{border-radius:10px;padding:6px 7px;min-height:56px;font-size:.84rem;line-height:1.3;background:#F2F5F9;color:#56637A;min-width:0}" +
      ".ds-hr b{display:block;font-size:.72rem;opacity:.75;font-weight:700}" +
      ".ds-hr span{display:block;font-weight:600;overflow-wrap:anywhere}" +
      ".ds-hr small{display:block;font-size:.72rem;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".ds-hr.is-free{background:transparent;border:1px dashed #DCE4F1;color:#9AA6B8}" +
      ".ds-hr.t-ya{background:#E4F3EF;color:#0F6B5F}.ds-hr.t-yb{background:#EBEDFB;color:#3542A0}.ds-hr.t-both{background:#FFF2D6;color:#8A5300}" +
      ".ds-hr.t-tutor{background:#FBEAF1;color:#9B2C5C}.ds-hr.t-prep{background:#fff;border:1px dashed #C7D2E3}" +
      ".ds-hr.t-cls{background:#fff;border:1px solid #DCE4F1;color:#0E1B33}" +
      ".ds-empty{color:#56637A;margin:4px 0}" +
      "@media(max-width:900px){.ds-hours{grid-auto-flow:column;grid-auto-columns:minmax(92px,1fr);overflow-x:auto;padding-bottom:4px}}" +
      "@media print{.ds{display:none}}";
    document.head.appendChild(st);
  }

  function draw(box, view){
    var S = window.BM_MY_SCHEDULE;
    var sd = schoolDay(), wd = sd.d.getDay();
    box.querySelector(".ds-when").textContent = (sd.label ? sd.label + " · " : "") + "יום " + DAYN[wd] + " " + sd.d.getDate() + "." + (sd.d.getMonth() + 1);
    Array.prototype.forEach.call(box.querySelectorAll(".ds-seg button"), function(b){ b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === view)); });
    var cells = [];
    for(var h = 0; h <= 8; h++){
      var cls = "is-free", main = "", sub = "";
      if(view === "me"){
        var s = (S.weekFor(isoOf(sd.d))[wd] || [])[h];
        if(s){
          main = s.subject;
          if(s.kind === "lesson"){ cls = "t-" + (s.cls === "both" ? "both" : s.cls === "יב" ? "yb" : "ya"); sub = S.clsName[s.cls]; }
          else cls = s.kind === "tutor" ? "t-tutor" : s.kind === "prep" ? "t-prep" : "";
        }
      }else{
        var c = ((S.classes[view] || [])[wd] || [])[h];
        if(c){ main = c[0]; sub = c[1]; cls = c[2] ? (view === "יב" ? "t-yb" : "t-ya") : "t-cls"; }
      }
      cells.push({ h:h, cls:cls, main:main, sub:sub });
    }
    while(cells.length && !cells[cells.length - 1].main) cells.pop();   /* בלי שעות ריקות בסוף היום */
    var ul = box.querySelector(".ds-hours");
    ul.style.gridTemplateColumns = cells.length && window.matchMedia("(min-width:901px)").matches ? "repeat(" + cells.length + ",minmax(0,1fr))" : "";
    ul.innerHTML = cells.length ? cells.map(function(x){
      return '<li class="ds-hr ' + x.cls + '"' + (x.sub ? ' title="' + esc(x.main + " · " + x.sub) + '"' : "") + '><b>שעה ' + x.h + '</b>' +
        (x.main ? '<span>' + esc(x.main) + '</span>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : "") : '<span>—</span>') + '</li>';
    }).join("") : '<li class="ds-empty">אין לימודים ביום הזה.</li>';
  }

  function mount(el){
    var S = window.BM_MY_SCHEDULE;
    if(!el || !S || !S.classes || !S.weekFor) return;
    css();
    var view = "me";
    try{ view = localStorage.getItem(KEY) || "me"; }catch(e){}
    if(view !== "me" && !S.classes[view]) view = "me";
    el.innerHTML = '<section class="ds" aria-labelledby="dsTitle"><div class="ds-h"><h2 id="dsTitle">🗓️ המערכת</h2><span class="ds-when"></span>' +
      '<span class="ds-seg" role="group" aria-label="איזו מערכת להציג">' +
      '<button type="button" data-v="me">הרב אפרים</button><button type="button" data-v="יא">' + esc(S.clsName["יא"]) + '</button><button type="button" data-v="יב">' + esc(S.clsName["יב"]) + '</button>' +
      '</span></div><ol class="ds-hours"></ol></section>';
    var box = el.firstChild;
    box.querySelector(".ds-seg").addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest("button[data-v]");
      if(!b) return;
      view = b.getAttribute("data-v");
      try{ localStorage.setItem(KEY, view); }catch(err){}
      draw(box, view);
    });
    draw(box, view);
  }

  window.BM_DAY_STRIP = { mount:mount };
  function init(){ mount(document.getElementById("dayStrip")); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
