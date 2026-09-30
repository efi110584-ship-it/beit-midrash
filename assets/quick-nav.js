/* ============================================================
   הכיתה הדיגיטלית - כפתור "מעבר מהיר" (כפתור הקסם)
   ============================================================
   כפתור צף שמופיע בכל דפי האתר (נטען מתוך assets/a11y.js), ופותח
   תפריט קטן: בחירת כיתה (י"א / י"ב), רשימת היחידות של אותה כיתה,
   ודף הבית / אזור אישי. היחידה שבה נמצאים עכשיו מסומנת "אתם כאן",
   והתפריט נפתח אוטומטית על הכיתה שלה.

   רשימת היחידות כאן צריכה להתאים לרשימת UNITS שב-index.html -
   כשמוסיפים יחידה חדשה לדף הבית, מוסיפים אותה גם כאן.
   ============================================================ */
(function(){
  "use strict";
  if(window.__bmQuickNav) return;
  window.__bmQuickNav = true;

  var GRADES = [
    { key:"יא", label:'כיתה י"א', tab:"tab-ya", units:[
      { key:"yonah",     icon:"🌊", title:"ספר יונה",      url:"yonah-hub.html" },
      { key:"leket",     icon:"📜", title:"לקט מצוות",     url:"leket-mitzvot-hub.html" },
      { key:"bereshit",  icon:"🏞️", title:"ספר בראשית",    url:"bereshit-hub.html" },
      { key:"yeshayahu", icon:"📜", title:"ספר ישעיהו",    url:"yeshayahu-hub.html" },
      { key:"ivrit",     icon:"📓", title:"עברית - דקדוק", url:"ivrit-hub.html" }
    ]},
    { key:"יב", label:'כיתה י"ב', tab:"tab-yb", units:[
      { key:"devarim",       icon:"📖", title:"ספר דברים",   url:"petichah.html" },
      { key:"ezra-nechemia", icon:"📯", title:"עזרא ונחמיה", url:"ezra-nechemia-hub.html" },
      { key:"neviim",        icon:"💧", title:"פרקי נביאים", url:"neviim-hub.html" },
      { key:"ptp",           icon:"⚖️", title:"פתוח תפתח",   url:"ptp-hub.html" }
    ]}
  ];

  /* איזו יחידה מכיל הדף הנוכחי - לפי תחילת שם הקובץ */
  var PREFIXES = [
    [/^yonah-(?!answers|exam)/, "yonah"],
    [/^bereshit-(?!answers|yaakov-esav-answers|yosef-answers)/, "bereshit"],
    [/^yeshayahu-(?!answers)/, "yeshayahu"],
    [/^ivrit-(?!.*answers)/, "ivrit"],
    [/^petichah/, "devarim"],
    [/^(ezra|nechemia)-(?!nechemia-answers)/, "ezra-nechemia"],
    [/^(melachim|yirmiyahu|yechezkel|neviim-hub)/, "neviim"],
    [/^ptp-(?!answers)/, "ptp"],
    [/^(leket-mitzvot-hub|ahavat-|kibud-|lo-tasur|lo-taashok|halvaa|kidush-|korban-pesach|kriat-shema|onaat-dvarim|talmud-torah|tefila|tochacha)/, "leket"]
  ];
  var STORE_KEY = "bm-quicknav-grade";

  function load(){ try{ return localStorage.getItem(STORE_KEY); }catch(e){ return null; } }
  function save(v){ try{ localStorage.setItem(STORE_KEY, v); }catch(e){} }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }

  var page = decodeURIComponent((location.pathname.split("/").pop() || "index.html"));
  var currentUnit = null, currentGrade = null;
  for(var i = 0; i < PREFIXES.length; i++){
    if(PREFIXES[i][0].test(page)){ currentUnit = PREFIXES[i][1]; break; }
  }
  GRADES.forEach(function(g){
    g.units.forEach(function(u){ if(u.key === currentUnit) currentGrade = g.key; });
  });

  var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">' +
    '<path d="M4 20 15 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M16 3.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8zM20.5 10l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5zM9.5 3l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" fill="currentColor"/></svg>';

  function build(){
    var wrap = document.createElement("div");
    wrap.className = "bm-qnav";
    var html =
      '<button type="button" class="bm-qnav-toggle" aria-expanded="false" aria-controls="bm-qnav-panel">' +
        ICON + '<span class="bm-qnav-toggle-text">מעבר מהיר</span>' +
      '</button>' +
      '<nav class="bm-qnav-panel" id="bm-qnav-panel" aria-label="מעבר מהיר בין כיתות ויחידות" hidden>' +
        '<p class="bm-qnav-title">לאן עוברים?</p>' +
        '<div class="bm-qnav-grades" role="group" aria-label="בחירת כיתה">';
    GRADES.forEach(function(g){
      html += '<button type="button" class="bm-qnav-grade" data-grade="' + esc(g.key) + '" aria-pressed="false">' + esc(g.label) + '</button>';
    });
    html += '</div>';
    GRADES.forEach(function(g){
      html += '<ul class="bm-qnav-units" data-grade-list="' + esc(g.key) + '" hidden>';
      g.units.forEach(function(u){
        var here = u.key === currentUnit;
        html += '<li><a href="' + esc(u.url) + '"' + (here ? ' class="is-here" aria-current="page"' : '') + '>' +
          '<span class="bm-qnav-icon" aria-hidden="true">' + u.icon + '</span>' +
          '<span class="bm-qnav-name">' + esc(u.title) + '</span>' +
          (here ? '<span class="bm-qnav-here">אתם כאן</span>' : '') +
        '</a></li>';
      });
      html += '<li><a class="bm-qnav-all" href="index.html#' + esc(g.tab) + '">כל היחידות של ' + esc(g.label) + ' ←</a></li>';
      html += '</ul>';
    });
    html +=
        '<div class="bm-qnav-footer">' +
          '<a href="index.html"><span aria-hidden="true">🏠</span> דף הבית</a>' +
          '<a href="index.html#tab-teacher"><span aria-hidden="true">🗝️</span> אזור אישי</a>' +
        '</div>' +
      '</nav>';
    wrap.innerHTML = html;
    // בדף הבית אין כפתור נגישות צף - אז הכפתור יורד לפינה עצמה
    if(!document.querySelector(".bm-a11y")) wrap.classList.add("bm-qnav--solo");
    document.body.appendChild(wrap);

    var toggle = wrap.querySelector(".bm-qnav-toggle");
    var panel = wrap.querySelector(".bm-qnav-panel");
    var gradeBtns = wrap.querySelectorAll(".bm-qnav-grade");
    var lists = wrap.querySelectorAll(".bm-qnav-units");

    function showGrade(key){
      Array.prototype.forEach.call(gradeBtns, function(b){ b.setAttribute("aria-pressed", b.getAttribute("data-grade") === key ? "true" : "false"); });
      Array.prototype.forEach.call(lists, function(l){ l.hidden = l.getAttribute("data-grade-list") !== key; });
    }
    showGrade(currentGrade || load() || GRADES[0].key);

    Array.prototype.forEach.call(gradeBtns, function(b){
      b.addEventListener("click", function(){
        var key = b.getAttribute("data-grade");
        showGrade(key); save(key);
      });
    });

    function setOpen(open){
      if(open){
        // לא לפתוח שני תפריטים צפים אחד על השני (סוגרים את הנגישות לפני הפתיחה)
        var a11y = document.querySelector('.bm-a11y-toggle[aria-expanded="true"]');
        if(a11y) a11y.click();
      }
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if(open){
        var first = panel.querySelector('.bm-qnav-grade[aria-pressed="true"]');
        if(first) first.focus();
      }
    }
    toggle.addEventListener("click", function(){ setOpen(panel.hidden); });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && !panel.hidden){ setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function(e){
      if(!panel.hidden && !wrap.contains(e.target)) setOpen(false);
    });
    // כשפותחים את תפריט הנגישות - סוגרים את תפריט המעבר המהיר
    document.addEventListener("click", function(e){
      if(e.target.closest && e.target.closest(".bm-a11y-toggle") && !panel.hidden) setOpen(false);
    }, true);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
