/* נעילת תשובות בגרות - בשלב "שאלות בגרות אמיתיות" (data-stage="bagrut")
   הכפתור "הצג תשובה" לא פותח את דגם התשובה עד שמקלידים קוד מורה.
   אחרי קוד נכון - כל התשובות בדף נפתחות כרגיל עד סגירת הלשונית.
   המאזין יושב על window בשלב ה-capture, ולכן פועל לפני המאזין של הדף עצמו. */
(function(){
  "use strict";
  // גיבוב של הקוד (לא הקוד עצמו), כדי שלא יופיע גלוי בקוד הדף
  var CODE_HASH = "1qjzjxi";
  var KEY = "bm-bagrut-unlocked:" + location.pathname;

  function hash(s){
    var h = 5381;
    for(var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  var unlocked = false;
  try { unlocked = sessionStorage.getItem(KEY) === "1"; } catch(e){}

  function isLockedButton(btn){
    if(!btn.closest('[data-stage="bagrut"], .bagrut-block, .bagrut-part')) return false;
    var box = btn.nextElementSibling;
    // רק פתיחה ננעלת; סגירה של תשובה פתוחה - תמיד מותרת
    return !!box && box.classList.contains("hint-box") && box.hidden;
  }

  var dlg = null, input, err, pendingBtn = null, lastFocus = null;
  function build(){
    dlg = document.createElement("div");
    dlg.className = "bm-lock-overlay";
    dlg.setAttribute("hidden", "");
    dlg.innerHTML =
      '<div class="bm-lock-box" role="dialog" aria-modal="true" aria-labelledby="bm-lock-title" dir="rtl">' +
        '<h2 id="bm-lock-title" class="bm-lock-title">🔒 התשובות נעולות</h2>' +
        '<p class="bm-lock-text">כדי לראות את דגם התשובה לשאלות הבגרות יש להקליד את הקוד שקיבלתם מהמורה.</p>' +
        '<form class="bm-lock-form">' +
          '<label class="bm-lock-label" for="bm-lock-input">קוד:</label>' +
          '<input id="bm-lock-input" class="bm-lock-input" type="password" inputmode="numeric" autocomplete="off">' +
          '<p class="bm-lock-err" role="alert"></p>' +
          '<div class="bm-lock-actions">' +
            '<button type="submit" class="bm-lock-ok">פתיחה</button>' +
            '<button type="button" class="bm-lock-cancel">ביטול</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    var css = document.createElement("style");
    css.textContent =
      '.bm-lock-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px;}' +
      '.bm-lock-overlay[hidden]{display:none;}' +
      '.bm-lock-box{background:#fff;color:#222;border-radius:14px;padding:22px 24px;max-width:380px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.3);font-family:inherit;text-align:right;}' +
      '.bm-lock-title{margin:0 0 8px;font-size:1.3rem;}' +
      '.bm-lock-text{margin:0 0 14px;font-size:1rem;line-height:1.5;}' +
      '.bm-lock-label{display:block;font-weight:600;margin-bottom:6px;}' +
      '.bm-lock-input{width:100%;box-sizing:border-box;font-size:1.2rem;padding:8px 10px;border:2px solid #999;border-radius:8px;letter-spacing:.2em;text-align:center;direction:ltr;}' +
      '.bm-lock-err{color:#b00020;min-height:1.3em;margin:6px 0;font-weight:600;}' +
      '.bm-lock-actions{display:flex;gap:10px;}' +
      '.bm-lock-actions button{flex:1;font-size:1rem;padding:9px;border-radius:8px;cursor:pointer;font-family:inherit;border:2px solid #555;background:#fff;color:#222;}' +
      '.bm-lock-actions .bm-lock-ok{background:#2a4d8f;border-color:#2a4d8f;color:#fff;}';
    document.head.appendChild(css);
    document.body.appendChild(dlg);
    input = dlg.querySelector(".bm-lock-input");
    err = dlg.querySelector(".bm-lock-err");
    dlg.querySelector("form").addEventListener("submit", function(e){
      e.preventDefault();
      if(hash(input.value.trim()) === CODE_HASH){
        unlocked = true;
        try { sessionStorage.setItem(KEY, "1"); } catch(e2){}
        var btn = pendingBtn;
        close();
        if(btn) btn.click();
      } else {
        err.textContent = "הקוד שגוי. נסו שוב.";
        input.select();
      }
    });
    dlg.querySelector(".bm-lock-cancel").addEventListener("click", close);
    dlg.addEventListener("click", function(e){ if(e.target === dlg) close(); });
    dlg.addEventListener("keydown", function(e){ if(e.key === "Escape") close(); });
  }
  function open(btn){
    if(!dlg) build();
    pendingBtn = btn;
    lastFocus = document.activeElement;
    input.value = "";
    err.textContent = "";
    dlg.removeAttribute("hidden");
    input.focus();
  }
  function close(){
    dlg.setAttribute("hidden", "");
    pendingBtn = null;
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.addEventListener("click", function(e){
    if(unlocked) return;
    var btn = e.target && e.target.closest ? e.target.closest(".hint-btn, button[data-bm-toggle]") : null;
    if(!btn || !isLockedButton(btn)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    open(btn);
  }, true);
})();
