/* ============================================================
   יחידות הגזרות בעברית - שלושה עמודים
   ============================================================
   במקום משימות קטנות (assets/steps.js), כל יחידת גזרה מוצגת כשלושה עמודים:
     עמוד 1 - הסבר הגזרה (מה הגזרה, טבלת הבניינים, שלבי הפתרון, דוגמאות)
     עמוד 2 - התרגול: כל הטבלה בבת אחת
     עמוד 3 - שאלות בסגנון בגרות: כל השאלות יחד
   שום תוכן לא זז ולא נמחק - רק מוצג עמוד אחד בכל פעם. בהדפסה הכול מוצג.
   העמוד האחרון שבו התלמיד היה נזכר במכשיר, ונרשם ל"המשיכו מהמקום שבו הפסקתם".
   ============================================================ */
(function(){
  "use strict";
  var PAGE = location.pathname.split("/").pop() || "";
  var KEY = "bm-unitpage:" + PAGE;
  var KEY_LAST = "bm-last-place-v1";

  function arr(x){ return Array.prototype.slice.call(x); }
  var lesson = ["lesson", "buildings", "method", "solved"].map(function(id){ return document.getElementById(id); }).filter(Boolean);
  var practice = arr(document.querySelectorAll("#grid section.card:not(.gzb-card), #grid article.card:not(.gzb-card)"));
  var bagrut = arr(document.querySelectorAll(".gzb-card"));
  if(!lesson.length || !bagrut.length) return;

  function rows(cards){
    return cards.reduce(function(n, c){
      return n + arr(c.querySelectorAll("tbody tr")).filter(function(tr){ return tr.querySelector(".answer"); }).length;
    }, 0);
  }
  var PAGES = [
    { id:"explain", n:1, ico:"📖", title:"הסבר הגזרה", sub:"מה מזהים ואיך פותרים", cards:lesson },
    { id:"practice", n:2, ico:"✏️", title:"תרגול", sub:rows(practice) + " משפטים בטבלה אחת", cards:practice },
    { id:"bagrut", n:3, ico:"🎓", title:"שאלות בסגנון בגרות", sub:bagrut.length + " שאלות", cards:bagrut }
  ].filter(function(p){ return p.cards.length; });
  PAGES.forEach(function(p, i){ p.n = i + 1; });

  /* ---------- עיצוב ---------- */
  var css =
    ".up-off{display:none !important}" +
    /* כל טבלת התרגול גלויה בדף - בלי תיבת גלילה פנימית */
    ".hafan-scroll-wrap{max-height:none !important;overflow-y:visible !important;overflow-x:auto}" +
    ".up-nav{max-width:1200px;margin:0 auto 18px;padding:0 1.5rem;box-sizing:border-box}" +
    ".up-tabs{display:grid;grid-template-columns:repeat(" + PAGES.length + ",minmax(0,1fr));gap:8px;padding:6px;background:#fff;border:1px solid #DCE4F1;border-radius:16px;box-shadow:0 4px 14px rgba(11,42,91,.08)}" +
    ".up-tab{position:relative;display:flex;align-items:center;gap:10px;min-height:60px;padding:8px 12px;border:0;border-radius:12px;background:transparent;color:#123A78;font:inherit;text-align:right;cursor:pointer}" +
    ".up-tab:hover{background:#F4F7FC}" +
    ".up-tab[aria-current=page]{background:#123A78;color:#fff;box-shadow:0 3px 10px rgba(18,58,120,.25)}" +
    ".up-tab:focus-visible,.up-go:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
    ".up-n{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#E3EBF7;color:#123A78;font-weight:700;font-family:Rubik,sans-serif}" +
    ".up-tab[aria-current=page] .up-n{background:#fff}" +
    ".up-tab.is-done .up-n{background:#0D8A63;color:#fff}" +
    ".up-txt{display:flex;flex-direction:column;min-width:0;line-height:1.25}" +
    ".up-txt b{font-size:1.02rem}.up-txt small{font-size:.8rem;opacity:.8}" +
    ".up-foot{grid-column:1 / -1;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:6px 0 0}" +
    ".up-go{display:inline-flex;align-items:center;gap:8px;min-height:50px;padding:10px 20px;border:1px solid #DCE4F1;border-radius:12px;background:#fff;color:#123A78;font:inherit;font-weight:700;font-size:1rem;cursor:pointer}" +
    ".up-go--next{background:#FF7A1A;border-color:#FF7A1A;color:#fff;margin-inline-start:auto}" +
    ".up-go[hidden]{display:none}" +
    "@media (max-width:700px){.up-nav{padding:0 .8rem}.up-tab{flex-direction:column;justify-content:center;text-align:center;gap:4px;min-height:70px;padding:6px 4px}.up-txt small{display:none}.up-txt b{font-size:.9rem}}" +
    "@media print{.up-off{display:block !important}.up-nav,.up-foot{display:none !important}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- סרגל העמודים (למעלה) ---------- */
  var nav = document.createElement("nav");
  nav.className = "up-nav";
  nav.setAttribute("aria-label", "עמודי היחידה");
  nav.innerHTML = '<div class="up-tabs">' + PAGES.map(function(p){
    return '<button type="button" class="up-tab" data-page="' + p.id + '">' +
      '<span class="up-n" aria-hidden="true">' + p.n + '</span>' +
      '<span class="up-txt"><b><span aria-hidden="true">' + p.ico + ' </span>' + p.title + '</b><small>' + p.sub + '</small></span></button>';
  }).join("") + '</div>';
  var main = document.getElementById("main-content") || lesson[0].parentNode;
  main.parentNode.insertBefore(nav, main);

  /* ---------- כפתורי הקודם / הבא (למטה) ---------- */
  var foot = document.createElement("div");
  foot.className = "up-foot";
  foot.innerHTML = '<button type="button" class="up-go" data-go="-1"></button><button type="button" class="up-go up-go--next" data-go="1"></button>';
  var lastCard = bagrut[bagrut.length - 1];
  lastCard.parentNode.insertBefore(foot, lastCard.nextSibling);

  var current = 0;
  function show(i, fromUser){
    current = Math.max(0, Math.min(PAGES.length - 1, i));
    PAGES.forEach(function(p, j){ p.cards.forEach(function(c){ c.classList.toggle("up-off", j !== current); }); });
    arr(nav.querySelectorAll(".up-tab")).forEach(function(b, j){
      if(j === current) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    var prev = foot.querySelector('[data-go="-1"]'), next = foot.querySelector('[data-go="1"]');
    prev.hidden = current === 0;
    next.hidden = current === PAGES.length - 1;
    if(current > 0) prev.textContent = "→ הקודם: " + PAGES[current - 1].title;
    if(current < PAGES.length - 1) next.textContent = "הבא: " + PAGES[current + 1].title + " ←";
    try{ localStorage.setItem(KEY, PAGES[current].id); }catch(e){}
    if(history.replaceState) history.replaceState(null, "", "#" + PAGES[current].id);
    if(PAGES[current].id === "explain") markDone(0);
    saveLast();
    if(fromUser) nav.scrollIntoView({ behavior:"smooth", block:"start" });
  }
  nav.addEventListener("click", function(e){
    var b = e.target.closest(".up-tab"); if(!b) return;
    show(PAGES.map(function(p){ return p.id; }).indexOf(b.getAttribute("data-page")), true);
  });
  foot.addEventListener("click", function(e){
    var b = e.target.closest("[data-go]"); if(!b) return;
    show(current + Number(b.getAttribute("data-go")), true);
  });

  /* ---------- סימון עמוד שהושלם ---------- */
  var seenExplain = false;
  function fields(p){ return arr(document.querySelectorAll("input.answer, select.answer, textarea.answer, .gzb-card [data-answer]")).filter(function(f){ return p.cards.some(function(c){ return c.contains(f); }); }); }
  function isDone(p, j){
    if(p.id === "explain") return seenExplain;
    var fs = fields(p);
    return fs.length > 0 && fs.every(function(f){ return String(f.value || "").trim() !== ""; });
  }
  function markDone(j){ if(PAGES[j] && PAGES[j].id === "explain") seenExplain = true; refreshDone(); }
  function refreshDone(){
    arr(nav.querySelectorAll(".up-tab")).forEach(function(b, j){
      var d = isDone(PAGES[j], j);
      b.classList.toggle("is-done", d);
      b.setAttribute("aria-label", "עמוד " + PAGES[j].n + ": " + PAGES[j].title + (d ? " - הושלם" : ""));
    });
  }
  document.addEventListener("input", refreshDone);
  document.addEventListener("change", refreshDone);

  function saveLast(){
    var finished = PAGES.every(function(p, j){ return isDone(p, j); });
    try{
      localStorage.setItem(KEY_LAST, JSON.stringify({
        page:PAGE, title:document.title + " · " + PAGES[current].title,
        task:current + 1, total:PAGES.length, finished:finished, t:Date.now()
      }));
    }catch(e){}
  }

  /* ---------- התחלה: לפי הכתובת (#practice), או העמוד האחרון במכשיר ---------- */
  var ids = PAGES.map(function(p){ return p.id; });
  var start = ids.indexOf((location.hash || "").slice(1));
  if(start === -1){ try{ start = ids.indexOf(localStorage.getItem(KEY) || ""); }catch(e){} }
  /* אחרי שהדף שחזר את התשובות השמורות */
  setTimeout(function(){ show(start === -1 ? 0 : start); refreshDone(); }, 0);
})();
