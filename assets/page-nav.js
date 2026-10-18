/* ============================================================
   פס ניווט בראש הדף - בין הפרקים ובתוך הפרק
   ============================================================
   נטען מתוך assets/a11y.js (שנמצא בכל דפי האתר), ומופיע רק בדף של
   פרק / נושא (לפי assets/units-data.js, או לפי שורת "פרק קודם / הבא"
   שבתחתית הדף). הפס נשאר למעלה גם כשגוללים:
     → פרק קודם · 📚 הפרקים · 🧭 בדף הזה · → משימה 3 מתוך 8 ← · פרק הבא ←
   - "הפרקים": כל הפרקים / הנושאים ביחידה, הנוכחי מסומן.
   - "בדף הזה": בדף שמחולק למשימות (assets/steps.js) - רשימת המשימות;
     בדף רגיל - הכותרות שבדף, וקפיצה אליהן.
   - "משימה X מתוך Y": הקודמת / הבאה, בלי לגלול לסוף המשימה.
   השורה שבתחתית הדף נשארת כמו שהיא.
   ============================================================ */
(function(){
  "use strict";
  if(window.__bmPageNav) return;
  window.__bmPageNav = true;

  var page = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  if(/^(index|screen|submit|live|submissions)\.html$/.test(page) || /[?&]key(=|&|$)/.test(location.search)) return;
  var BASE = (function(){
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^\/]*$/, "") : "assets/";
  })();

  function arr(x){ return Array.prototype.slice.call(x || []); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function text(el){ return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function short(t, n){ t = String(t || ""); return t.length > n ? t.slice(0, n - 1) + "…" : t; }
  /* שם קצר לנושא: בלי סוגריים ובלי תיאור אחרי מקף ("פרק ט"ו - ברית בין הבתרים" -> "פרק ט"ו") */
  function core(t){ return String(t || "").split(" (")[0].split(" - ")[0].trim(); }

  function withData(fn){
    if(window.BM_TASKS) return fn();
    var s = document.createElement("script");
    s.src = BASE + "units-data.js";
    s.onload = fn;
    s.onerror = fn;
    document.head.appendChild(s);
  }

  /* ---------- איפה אנחנו ---------- */
  function locate(){
    var T = window.BM_TASKS;
    if(!T) return null;
    var w = T.findByPage(page);
    if(!w){
      /* דפי משנה של פרק (טקסט, סיכום, כרטיסיות...) - שייכים לפרק עצמו */
      var basePage = page.replace(/-(text|summary|questions|flashcards|flowchart|matching-game|wheel|escape-room|quiz)\.html$/, ".html");
      if(basePage !== page) w = T.findByPage(basePage);
      if(w) w.sub = true;
    }
    return w;
  }

  /* "לפרק הבא (פרק ד׳)" -> "פרק ד׳" */
  function chLabel(t){
    var m = t.match(/^(?:ל?פרק|ל?נושא|ל?דף)?\s*(?:ה?קודם|ה?בא)\s*\((.+)\)$/);
    return m ? m[1].trim() : t;
  }
  function bottomNav(){
    var nav = document.querySelector("nav.chapter-nav");
    if(!nav) return {};
    var out = {};
    arr(nav.querySelectorAll("a[href]")).forEach(function(a){
      var t = text(a);
      if(/^→/.test(t)) out.prev = { href: a.getAttribute("href"), label: chLabel(t.replace(/^→\s*/, "")) };
      else if(/←$/.test(t)) out.next = { href: a.getAttribute("href"), label: chLabel(t.replace(/\s*←$/, "")) };
    });
    return out;
  }

  function neighbors(w){
    if(!w || !w.topic || w.sub) return {};
    var list = (w.unit.topics || []).filter(function(t){ return !t.extra; });
    var i = list.indexOf(w.topic);
    if(i < 0) return {};
    var out = {};
    if(i > 0) out.prev = { href: list[i - 1].url, label: core(list[i - 1].title) };
    if(i < list.length - 1) out.next = { href: list[i + 1].url, label: core(list[i + 1].title) };
    return out;
  }

  /* ---------- עיצוב ---------- */
  function css(){
    var st = document.createElement("style");
    st.id = "bm-pnav-style";
    st.textContent =
      "html.bm-pnav-on{--bm-pnav-h:48px}" +
      "html.bm-pnav-on body{padding-top:var(--bm-pnav-h) !important}" +
      "html.bm-pnav-on .bm-a11y{top:calc(var(--bm-pnav-h) + .5rem) !important}" +
      "html.bm-pnav-on .topic-nav-wrap,html.bm-pnav-on nav.tabs,html.bm-pnav-on .section-nav,html.bm-pnav-on .ak-banner{top:var(--bm-pnav-h) !important}" +
      "html.bm-pnav-on [id]{scroll-margin-top:calc(var(--bm-pnav-h) + 12px)}" +
      ".bm-pnav{position:fixed;top:0;inset-inline:0;z-index:9000;height:var(--bm-pnav-h);box-sizing:border-box;display:flex;align-items:center;gap:6px;" +
        "padding:0 10px;background:#0B2A5B;color:#fff;direction:rtl;font:500 15px/1.2 Heebo,Rubik,Arial,sans-serif;box-shadow:0 2px 10px rgba(11,42,91,.25)}" +
      ".bm-pnav a,.bm-pnav button{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:4px 10px;border-radius:10px;border:0;" +
        "background:rgba(255,255,255,.1);color:#fff;font:inherit;text-decoration:none;cursor:pointer;white-space:nowrap}" +
      ".bm-pnav a:hover,.bm-pnav button:hover{background:rgba(255,255,255,.2)}" +
      ".bm-pnav a:focus-visible,.bm-pnav button:focus-visible{outline:3px solid #FFB86B;outline-offset:1px}" +
      ".bm-pnav button[aria-expanded=true]{background:#fff;color:#0B2A5B}" +
      ".bm-pnav-ch{max-width:24vw;overflow:hidden}" +
      ".bm-pnav-ch span{overflow:hidden;text-overflow:ellipsis}" +
      ".bm-pnav-mid{flex:1;display:flex;justify-content:center;align-items:center;gap:6px;min-width:0}" +
      ".bm-pnav-gap{flex:0 0 auto;width:36px}" +
      ".bm-pnav-task{display:inline-flex;align-items:center;gap:2px;padding:0 2px;border-radius:12px;background:rgba(255,255,255,.08)}" +
      ".bm-pnav-task[hidden]{display:none}" +
      ".bm-pnav-task button{padding:4px 9px;background:transparent;font-size:17px}" +
      ".bm-pnav-task button:disabled{opacity:.35;cursor:default}" +
      ".bm-pnav-slash{display:none}" +
      ".bm-pnav-count{white-space:nowrap;padding:0 4px;font-variant-numeric:tabular-nums;color:#DCE6F5}" +
      ".bm-pnav-pop{position:fixed;top:calc(var(--bm-pnav-h) + 6px);left:50%;transform:translateX(-50%);z-index:9001;width:min(440px,calc(100vw - 24px));" +
        "max-height:min(70vh,520px);overflow:auto;box-sizing:border-box;padding:10px;border-radius:14px;background:#fff;color:#15283D;" +
        "box-shadow:0 14px 34px rgba(11,42,91,.28);border:1px solid #DCE4F1;direction:rtl;font:400 15px/1.45 Heebo,Rubik,Arial,sans-serif}" +
      ".bm-pnav-pop h2{margin:2px 6px 8px;font-size:15px;color:#4E5B72;font-weight:600}" +
      ".bm-pnav-pop ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}" +
      ".bm-pnav-pop a,.bm-pnav-pop button{display:flex;width:100%;box-sizing:border-box;align-items:baseline;gap:8px;padding:9px 10px;border:0;border-radius:10px;" +
        "background:transparent;color:#123A78;font:inherit;text-align:start;text-decoration:none;cursor:pointer}" +
      ".bm-pnav-pop a:hover,.bm-pnav-pop button:hover{background:#EEF3FB}" +
      ".bm-pnav-pop a:focus-visible,.bm-pnav-pop button:focus-visible{outline:3px solid #FFB86B;outline-offset:-2px}" +
      ".bm-pnav-pop [aria-current]{background:#E3ECFA;font-weight:700}" +
      ".bm-pnav-pop .bm-pnav-num{flex:0 0 auto;min-width:1.6em;color:#4E5B72;font-variant-numeric:tabular-nums}" +
      ".bm-pnav-pop .bm-pnav-here{margin-inline-start:auto;font-size:12px;color:#0A6B4C;font-weight:700}" +
      ".bm-pnav-pop .bm-pnav-sep{height:1px;margin:6px 4px;background:#E3E6EB}" +
      ".bm-pnav-pop .bm-pnav-hub{color:#4E5B72;font-size:14px}" +
      "@media (max-width:620px){.bm-pnav{gap:4px;padding:0 6px;font-size:14px}.bm-pnav-lbl{display:none}.bm-pnav-slash{display:inline}.bm-pnav a,.bm-pnav button{padding:4px 8px}.bm-pnav-ch{max-width:22vw}}" +
      "@media (max-width:380px){.bm-pnav-ch span{display:none}}" +
      "@media print{.bm-pnav,.bm-pnav-pop{display:none !important}html.bm-pnav-on body{padding-top:0 !important}}";
    document.head.appendChild(st);
  }

  /* ---------- בניית הפס ---------- */
  function build(w, ch){
    css();
    document.documentElement.classList.add("bm-pnav-on");
    var bar = document.createElement("nav");
    bar.className = "bm-pnav";
    bar.setAttribute("aria-label", "ניווט בין הפרקים ובתוך הדף");

    function chLink(dir){
      var d = ch[dir];
      if(!d) return '<span class="bm-pnav-gap" aria-hidden="true"></span>';
      var arrow = dir === "prev" ? "→" : "←";
      var label = short(d.label, 22);
      var inner = dir === "prev" ? arrow + ' <span>' + esc(label) + '</span>' : '<span>' + esc(label) + '</span> ' + arrow;
      return '<a class="bm-pnav-ch" href="' + esc(d.href) + '" title="' + (dir === "prev" ? "הקודם: " : "הבא: ") + esc(d.label) + '" aria-label="' + (dir === "prev" ? "הקודם: " : "הבא: ") + esc(d.label) + '">' + inner + '</a>';
    }
    var hasUnit = !!(w && w.unit);
    bar.innerHTML =
      chLink("prev") +
      '<div class="bm-pnav-mid">' +
        (hasUnit ? '<button type="button" data-pop="units" aria-expanded="false" aria-controls="bm-pnav-pop"><span aria-hidden="true">📚</span><span class="bm-pnav-lbl">הפרקים</span></button>' : '') +
        '<button type="button" data-pop="page" aria-expanded="false" aria-controls="bm-pnav-pop"><span aria-hidden="true">🧭</span><span class="bm-pnav-lbl">בדף הזה</span></button>' +
        '<span class="bm-pnav-task" hidden>' +
          '<button type="button" data-task="-1" aria-label="המשימה הקודמת">→</button>' +
          '<span class="bm-pnav-count" aria-live="polite"></span>' +
          '<button type="button" data-task="1" aria-label="המשימה הבאה">←</button>' +
        '</span>' +
      '</div>' +
      chLink("next");
    document.body.insertBefore(bar, document.body.firstChild);
    var skip = document.querySelector(".bm-skip-link");
    if(skip) document.body.insertBefore(skip, bar);   /* "דלג לתוכן" נשאר הראשון במקלדת */

    var pop = document.createElement("div");
    pop.className = "bm-pnav-pop";
    pop.id = "bm-pnav-pop";
    pop.hidden = true;
    document.body.appendChild(pop);
    var openBtn = null;

    /* ---------- המשימות (assets/steps.js) ---------- */
    function stepsNav(){
      var S = window.BeitMidrashSteps;
      if(!S || !S.navs) return null;
      for(var i = 0; i < S.navs.length; i++){ if(S.navs[i].shown()) return S.navs[i]; }
      return null;
    }
    var taskBox = bar.querySelector(".bm-pnav-task");
    var count = bar.querySelector(".bm-pnav-count");
    var prevT = bar.querySelector('[data-task="-1"]'), nextT = bar.querySelector('[data-task="1"]');
    function syncTask(){
      var n = stepsNav();
      var info = n && n.info();
      if(!info || info.all || info.single || info.total < 2){ taskBox.hidden = true; return; }
      taskBox.hidden = false;
      var atSum = info.current >= info.total;
      count.innerHTML = atSum ? "סיכום" : '<span class="bm-pnav-lbl">משימה </span>' + (info.current + 1) +
        '<span class="bm-pnav-lbl"> מתוך </span><span class="bm-pnav-slash">/</span>' + info.total;
      count.setAttribute("aria-label", atSum ? "סיכום" : "משימה " + (info.current + 1) + " מתוך " + info.total);
      prevT.disabled = info.current <= 0;
      nextT.disabled = atSum;
      nextT.setAttribute("aria-label", info.current === info.total - 1 ? "לסיכום" : "המשימה הבאה");
    }
    [prevT, nextT].forEach(function(b){
      b.addEventListener("click", function(){
        var n = stepsNav(); if(!n) return;
        n.go(n.info().current + parseInt(b.getAttribute("data-task"), 10));
        syncTask();
      });
    });
    document.addEventListener("bm-steps-change", syncTask);
    document.addEventListener("bm-steps-ready", syncTask);
    document.addEventListener("click", function(e){ if(e.target.closest && e.target.closest(".topic-nav, .topic-tab, [role=tab]")) setTimeout(syncTask, 0); });
    syncTask();

    /* ---------- החלונית ---------- */
    function close(focusBack){
      if(pop.hidden) return;
      pop.hidden = true;
      if(openBtn){ openBtn.setAttribute("aria-expanded", "false"); if(focusBack) openBtn.focus(); }
      openBtn = null;
    }
    function unitsHtml(){
      var u = w.unit, here = w.topic;
      var list = u.topics || [];
      var html = '<h2>' + esc(u.title) + '</h2><ul>';
      var extraStarted = false;
      list.forEach(function(t, i){
        if(t.extra && !extraStarted){ extraStarted = true; html += '</ul><div class="bm-pnav-sep" role="separator"></div><ul>'; }
        var cur = here === t;
        html += '<li><a href="' + esc(t.url) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
          (t.extra ? '' : '<span class="bm-pnav-num">' + (i + 1) + '</span>') +
          '<span>' + esc(t.title) + '</span>' + (cur ? '<span class="bm-pnav-here">אתם כאן</span>' : '') + '</a></li>';
      });
      html += '</ul><div class="bm-pnav-sep" role="separator"></div><ul><li><a class="bm-pnav-hub" href="' + esc(u.url) + '">↖ לדף היחידה - ' + esc(u.title) + '</a></li></ul>';
      return html;
    }
    function pageTargets(){
      var main = document.querySelector("main") || document.body;
      var seen = [];
      return arr(main.querySelectorAll("h2, .topic-title, .topic-heading")).filter(function(h){
        if(h.closest(".bm-pnav, .bm-pnav-pop, .bm-taskbar, .bm-summary, .bm-lock, [hidden], .bm-off")) return false;
        if(!(h.offsetWidth || h.offsetHeight || h.getClientRects().length)) return false;
        var t = text(h);
        if(!t || seen.indexOf(t) >= 0) return false;
        seen.push(t);
        return true;
      }).slice(0, 40);
    }
    function pageHtml(){
      var n = stepsNav(), info = n && n.info();
      if(info && !info.all && !info.single && info.total > 1){
        var html = '<h2>' + esc(info.topic ? "המשימות - " + info.topic : "המשימות בדף") + '</h2><ul>';
        info.tasks.forEach(function(t, i){
          var cur = i === info.current;
          html += '<li><button type="button" data-go="' + i + '"' + (cur ? ' aria-current="step"' : '') + '><span class="bm-pnav-num">' + (i + 1) + '</span><span>' + esc(t || "משימה " + (i + 1)) + '</span>' + (cur ? '<span class="bm-pnav-here">אתם כאן</span>' : '') + '</button></li>';
        });
        html += '<li><button type="button" data-go="' + info.total + '"' + (info.current >= info.total ? ' aria-current="step"' : '') + '><span class="bm-pnav-num">✓</span><span>סיכום: איפה אני עומד/ת?</span></button></li></ul>';
        return html;
      }
      var hs = pageTargets();
      if(!hs.length) return '<h2>בדף הזה</h2><ul><li><button type="button" data-top="1"><span class="bm-pnav-num">↑</span><span>לראש הדף</span></button></li></ul>';
      var out = '<h2>בדף הזה</h2><ul><li><button type="button" data-top="1"><span class="bm-pnav-num">↑</span><span>לראש הדף</span></button></li>';
      hs.forEach(function(h, i){
        out += '<li><button type="button" data-jump="' + i + '"><span class="bm-pnav-num">' + (i + 1) + '</span><span>' + esc(short(text(h), 70)) + '</span></button></li>';
      });
      pop._targets = hs;
      return out + '</ul>';
    }
    function smooth(){ return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; }
    bar.addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest("[data-pop]");
      if(!b) return;
      if(openBtn === b){ close(false); return; }
      close(false);
      pop.innerHTML = b.getAttribute("data-pop") === "units" ? unitsHtml() : pageHtml();
      pop.setAttribute("aria-label", b.getAttribute("data-pop") === "units" ? "הפרקים ביחידה" : "בדף הזה");
      pop.hidden = false;
      openBtn = b;
      b.setAttribute("aria-expanded", "true");
      var cur = pop.querySelector("[aria-current]") || pop.querySelector("a, button");
      if(cur){ cur.focus({ preventScroll: true }); cur.scrollIntoView({ block: "nearest" }); }
    });
    pop.addEventListener("click", function(e){
      var t = e.target.closest && e.target.closest("button");
      if(!t) return;
      if(t.hasAttribute("data-go")){
        var n = stepsNav(); if(n) n.go(parseInt(t.getAttribute("data-go"), 10));
        close(false); syncTask();
      } else if(t.hasAttribute("data-jump")){
        var h = pop._targets && pop._targets[parseInt(t.getAttribute("data-jump"), 10)];
        close(false);
        if(h){
          var y = h.getBoundingClientRect().top + window.pageYOffset - (bar.offsetHeight + 14);
          window.scrollTo({ top: Math.max(0, y), behavior: smooth() });
          if(!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
          h.focus({ preventScroll: true });
        }
      } else if(t.hasAttribute("data-top")){
        close(false);
        window.scrollTo({ top: 0, behavior: smooth() });
      }
    });
    document.addEventListener("click", function(e){
      if(pop.hidden) return;
      if(e.target.closest && (e.target.closest(".bm-pnav-pop") || e.target.closest(".bm-pnav"))) return;
      close(false);
    });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !pop.hidden) close(true); });
  }

  function start(){
    withData(function(){
      var w = locate();
      var ch = bottomNav();
      if(!ch.prev && !ch.next){ var nb = neighbors(w); ch.prev = nb.prev; ch.next = nb.next; }
      var hasSteps = !!document.querySelector("main .grid") && !!document.querySelector('script[src*="steps.js"]');
      /* הפס מופיע רק בדף של פרק/נושא: יש לו מקום ברשימת היחידה, או "פרק קודם / הבא", או משימות */
      if(!(w && (w.topic || w.sub)) && !ch.prev && !ch.next && !hasSteps) return;
      build(w, ch);
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
