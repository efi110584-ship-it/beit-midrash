/* ============================================================
   בית המדרש הדיגיטלי - נגישות משותפת לכל דפי האתר
   ============================================================
   נטען ב-<head> של כל דף (לפני שהתוכן מוצג), כדי שהעדפות הנגישות
   השמורות - גודל טקסט, ניגודיות גבוהה וריווח אותיות - יחולו מיד,
   בלי "הבהוב" של העיצוב הרגיל.

   ההעדפות נשמרות ב-localStorage באותם מפתחות שדף הבית השתמש בהם
   מלכתחילה (a11y-font-step / a11y-contrast / a11y-letterspace),
   כך שבחירה שנעשתה בדף אחד עוברת אוטומטית לכל שאר דפי האתר.

   אם בדף כבר יש תפריט נגישות משלו (דף הבית, #a11y-panel) - הסקריפט
   רק מחבר אליו את ההתנהגות. בכל דף אחר הוא מוסיף כפתור נגישות צף.
   העיצוב של כל זה נמצא ב-assets/a11y.css.
   ============================================================ */
(function(){
  "use strict";

  var KEY_FONT = "a11y-font-step";
  var KEY_CONTRAST = "a11y-contrast";
  var KEY_SPACING = "a11y-letterspace";
  var FONT_STEPS = { "-1":0.9, "0":1, "1":1.15, "2":1.3, "3":1.5 };
  var MIN_STEP = -1, MAX_STEP = 3;
  var root = document.documentElement;

  function load(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
  function save(key, val){ try{ localStorage.setItem(key, val); }catch(e){ /* אחסון חסום - ההגדרה תחול רק בדף הנוכחי */ } }
  function clampStep(n){ return isNaN(n) ? 0 : Math.max(MIN_STEP, Math.min(MAX_STEP, n)); }

  var state = {};
  function readState(){
    state.font = clampStep(parseInt(load(KEY_FONT), 10));
    state.contrast = load(KEY_CONTRAST) === "1";
    state.spacing = load(KEY_SPACING) === "1";
  }

  function apply(){
    root.style.setProperty("--font-scale", String(FONT_STEPS[String(state.font)]));
    root.classList.toggle("a11y-contrast", state.contrast);
    root.classList.toggle("a11y-spacing", state.spacing);
    syncControls();
  }

  /* מעדכן את מצב הכפתורים (לחוץ/לא לחוץ, אחוז הגדלה) בכל תפריט שבדף */
  function syncControls(){
    if(!document.body) return;
    each("[data-a11y='contrast']", function(b){ b.setAttribute("aria-pressed", String(state.contrast)); });
    each("[data-a11y='spacing']", function(b){ b.setAttribute("aria-pressed", String(state.spacing)); });
    each("[data-font-step='-1']", function(b){ b.setAttribute("aria-disabled", String(state.font <= MIN_STEP)); });
    each("[data-font-step='1']", function(b){ b.setAttribute("aria-disabled", String(state.font >= MAX_STEP)); });
    each("[data-a11y-level]", function(el){ el.textContent = Math.round(FONT_STEPS[String(state.font)] * 100) + "%"; });
  }

  function each(sel, fn){ Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  // חל מיד, עוד לפני שגוף הדף נטען
  readState();
  apply();

  /* ---------- הפחתת תנועה גם בגלילה שהדפים מפעילים ב-JS ----------
     CSS לא יכול לעצור scrollTo({behavior:"smooth"}), ולכן - רק אצל מי
     שביקש במערכת ההפעלה להפחית תנועה - גלילה "חלקה" הופכת לקפיצה מיידית. */
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    var noSmooth = function(opts){
      return (opts && typeof opts === "object" && opts.behavior === "smooth")
        ? Object.assign({}, opts, { behavior: "auto" }) : opts;
    };
    ["scrollTo", "scrollBy"].forEach(function(fn){
      var orig = window[fn];
      window[fn] = function(a, b){ return arguments.length > 1 ? orig.call(window, a, b) : orig.call(window, noSmooth(a)); };
    });
    var origIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function(opts){ return origIntoView.call(this, noSmooth(opts)); };
  }

  // שינוי שנעשה בלשונית אחרת של האתר מתעדכן גם כאן
  window.addEventListener("storage", function(e){
    if(e.key === KEY_FONT || e.key === KEY_CONTRAST || e.key === KEY_SPACING){ readState(); apply(); }
  });

  /* ---------- לחיצות על כפתורי הנגישות (בכל תפריט שבדף) ---------- */
  document.addEventListener("click", function(e){
    var btn = e.target && e.target.closest ? e.target.closest("[data-font-step],[data-a11y]") : null;
    if(!btn || btn.getAttribute("aria-disabled") === "true") return;

    var step = btn.getAttribute("data-font-step");
    var action = btn.getAttribute("data-a11y");
    if(step !== null){
      state.font = step === "reset" ? 0 : clampStep(state.font + (parseInt(step, 10) > 0 ? 1 : -1));
      save(KEY_FONT, String(state.font));
    } else if(action === "contrast"){
      state.contrast = !state.contrast;
      save(KEY_CONTRAST, state.contrast ? "1" : "0");
    } else if(action === "spacing"){
      state.spacing = !state.spacing;
      save(KEY_SPACING, state.spacing ? "1" : "0");
    } else if(action === "reset"){
      state.font = 0; state.contrast = false; state.spacing = false;
      save(KEY_FONT, "0"); save(KEY_CONTRAST, "0"); save(KEY_SPACING, "0");
    } else {
      return;
    }
    apply();
  });

  /* ---------- פתיחה/סגירה של תפריט (כפתור + לוח) ---------- */
  function setupDisclosure(toggle, panel, closeOnFocusOut){
    if(!toggle || !panel) return;
    function setOpen(open){
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    }
    toggle.addEventListener("click", function(){
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && !panel.hidden){ setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function(e){
      if(!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    if(closeOnFocusOut){
      closeOnFocusOut.addEventListener("focusout", function(e){
        if(e.relatedTarget && !closeOnFocusOut.contains(e.relatedTarget)) setOpen(false);
      });
    }
  }

  var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="4.6" r="2.3" fill="currentColor"/>' +
    '<path d="M4 9.2c3.2 1.2 5.6 1.6 8 1.6s4.8-.4 8-1.6M12 10.8v10M8.5 21l1.7-6M15.5 21l-1.7-6" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round"/></svg>';

  function buildWidget(){
    var wrap = document.createElement("div");
    wrap.className = "bm-a11y";
    wrap.innerHTML =
      '<button type="button" class="bm-a11y-toggle" aria-expanded="false" aria-controls="bm-a11y-panel">' +
        ICON + '<span class="bm-a11y-toggle-text">נגישות</span>' +
      '</button>' +
      '<div class="bm-a11y-panel" id="bm-a11y-panel" role="region" aria-label="הגדרות נגישות" hidden>' +
        '<p class="bm-a11y-title">הגדרות נגישות</p>' +
        '<div class="bm-a11y-row" role="group" aria-label="גודל טקסט">' +
          '<span class="bm-a11y-label" aria-hidden="true">גודל טקסט</span>' +
          '<button type="button" class="bm-a11y-step" data-font-step="-1" aria-label="הקטנת טקסט">א−</button>' +
          '<span class="bm-a11y-level-wrap" aria-live="polite"><span class="bm-sr-only">גודל טקסט </span><span data-a11y-level>100%</span></span>' +
          '<button type="button" class="bm-a11y-step" data-font-step="1" aria-label="הגדלת טקסט">א+</button>' +
        '</div>' +
        '<button type="button" class="bm-a11y-switch" data-a11y="contrast" aria-pressed="false">ניגודיות גבוהה</button>' +
        '<button type="button" class="bm-a11y-switch" data-a11y="spacing" aria-pressed="false">ריווח מוגבר בין אותיות</button>' +
        '<button type="button" class="bm-a11y-reset" data-a11y="reset">איפוס ההגדרות</button>' +
        '<p class="bm-a11y-note">הבחירות נשמרות במכשיר הזה ועוברות לכל דפי האתר.</p>' +
      '</div>';

    // מיד אחרי "דלג לתוכן הראשי" - כך שזה הדבר השני שמגיעים אליו במקלדת
    var skip = document.querySelector(".bm-skip-link, .skip-link");
    if(skip && skip.parentNode === document.body) document.body.insertBefore(wrap, skip.nextSibling);
    else document.body.insertBefore(wrap, document.body.firstChild);

    setupDisclosure(wrap.querySelector(".bm-a11y-toggle"), wrap.querySelector(".bm-a11y-panel"), wrap);
  }

  /* ---------- "דלג לתוכן הראשי" - העברת הפוקוס בפועל אל התוכן ---------- */
  function setupSkipLinks(){
    each(".bm-skip-link, .skip-link", function(link){
      link.addEventListener("click", function(e){
        var id = (link.getAttribute("href") || "").replace(/^#/, "");
        var target = id && document.getElementById(id);
        if(!target){
          target = document.querySelector("main, [role='main'], h1");
          if(!target) return;
          if(id && !target.id) target.id = id;
        }
        e.preventDefault();
        if(!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus();
      });
    });
  }

  /* ---------- כפתורי "הצג תשובה" / רמז - מצב פתוח/סגור לקורא המסך ----------
     כל דף מחליף בעצמו את התיבה (hint-box) שאחרי הכפתור; כאן רק מוסיפים
     aria-expanded ו-aria-controls, ומעדכנים אותם אחרי כל לחיצה. */
  var hintCounter = 0;
  function syncHintButton(btn){
    var box = btn.nextElementSibling;
    if(!box || !box.classList.contains("hint-box")) return;
    if(!box.id) box.id = "bm-hint-box-" + (++hintCounter);
    btn.setAttribute("aria-controls", box.id);
    btn.setAttribute("aria-expanded", box.hidden ? "false" : "true");
  }
  document.addEventListener("click", function(e){
    var btn = e.target && e.target.closest ? e.target.closest(".hint-btn") : null;
    // אחרי שהמאזין של הדף עצמו כבר פתח/סגר את התיבה
    if(btn) setTimeout(function(){ syncHintButton(btn); }, 0);
  });

  /* ---------- חלון קופץ (aria-modal) - Tab נשאר בתוך החלון עד שסוגרים אותו ---------- */
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  document.addEventListener("keydown", function(e){
    if(e.key !== "Tab") return;
    var dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
    for(var i = 0; i < dialogs.length; i++){
      var dlg = dialogs[i];
      if(!dlg.getClientRects().length) continue;   // החלון סגור
      var items = Array.prototype.filter.call(dlg.querySelectorAll(FOCUSABLE), function(el){ return el.getClientRects().length; });
      if(!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if(!dlg.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
      else if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      return;
    }
  });

  function init(){
    setupSkipLinks();
    each(".hint-btn", syncHintButton);
    var ownPanel = document.getElementById("a11y-panel");
    if(ownPanel) setupDisclosure(document.getElementById("a11y-toggle"), ownPanel, null);
    else buildWidget();
    syncControls();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
