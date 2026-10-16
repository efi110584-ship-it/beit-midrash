/* ============================================================
   מצב שיעור (בקרת שיעור) - כיתה י"א
   ============================================================
   פועל רק אחרי שתלמיד נכנס עם קוד לשיעור שהמורה הפעיל בו בקרה
   (הכניסה בדף הבית שומרת את פרטי השיעור במכשיר עד סוף תוקף הקוד).
   כל עוד הדף פתוח, הוא מדווח לסקריפט של המורה:
     in  - התלמיד בדף (בכניסה לדף, וכל דקה)
     out - התלמיד עבר ללשונית/אפליקציה אחרת
     bye - התלמיד לחץ "יציאה ממצב שיעור"
   התלמיד רואה כל הזמן פס קטן שאומר שהבקרה פעילה. האתר לא יודע ולא
   מדווח לאן התלמיד יצא - רק שיצא מהדף ומתי חזר.
   ============================================================ */
(function(){
  "use strict";
  var KEY = "bm-lesson-mode";
  var st = null;
  try{ st = JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){}
  if(!st || !st.code || !st.sid) return;
  if(!(st.until > Date.now())){ try{ localStorage.removeItem(KEY); }catch(e){} return; }
  var API = window.BM_API_URL;
  if(!API) return;

  var page = location.pathname.split("/").pop() || "index.html";
  var leaves = st.leaves || 0;
  var timer = null;
  var bar = null;

  function save(){ try{ st.leaves = leaves; localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} }

  function send(state, onDone){
    var body = JSON.stringify({ action:"presence", code:st.code, sid:st.sid, name:st.name, page:page, state:state, t:Date.now() });
    try{
      fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:body, keepalive:true })
        .then(function(r){ return r.json(); })
        .then(function(res){
          if(res && res.ended){ end(); return; }
          if(res && res.ok && onDone) onDone(res);
        })
        .catch(function(){ /* בלי חיבור - ננסה שוב בדיווח הבא */ });
    }catch(e){}
  }

  /* ---------- הפס שמראה לתלמיד שהבקרה פעילה ---------- */
  function injectStyle(){
    var css =
      ".bm-lm-bar{position:fixed;inset-inline-start:12px;bottom:12px;z-index:9998;display:flex;align-items:center;gap:8px;" +
      "max-width:calc(100vw - 24px);padding:7px 8px 7px 12px;border-radius:999px;background:#0B2A5B;color:#fff;" +
      "font:500 14px/1.3 Heebo,Rubik,Arial,sans-serif;box-shadow:0 6px 18px rgba(11,42,91,.3);direction:rtl}" +
      ".bm-lm-dot{width:10px;height:10px;border-radius:50%;background:#2BD38C;flex:none}" +
      ".bm-lm-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".bm-lm-exit{flex:none;border:0;border-radius:999px;background:rgba(255,255,255,.16);color:#fff;" +
      "font:inherit;font-size:13px;padding:5px 10px;cursor:pointer;min-height:32px}" +
      ".bm-lm-exit:hover{background:rgba(255,255,255,.26)}" +
      ".bm-lm-exit:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      ".bm-lm-toast{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:9999;max-width:calc(100vw - 32px);" +
      "padding:12px 18px;border-radius:12px;background:#FFEBDC;color:#8A3D07;border:1px solid #F6CFAF;" +
      "font:700 15px/1.4 Heebo,Rubik,Arial,sans-serif;box-shadow:0 10px 26px rgba(11,42,91,.2);direction:rtl;text-align:center}" +
      "@media print{.bm-lm-bar,.bm-lm-toast{display:none}}";
    var el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
  }
  function showBar(){
    injectStyle();
    bar = document.createElement("div");
    bar.className = "bm-lm-bar";
    bar.setAttribute("role", "status");
    bar.innerHTML =
      '<span class="bm-lm-dot" aria-hidden="true"></span>' +
      '<span class="bm-lm-text">מצב שיעור: המורה רואה אם יוצאים מהדף</span>' +
      '<button type="button" class="bm-lm-exit">יציאה</button>';
    bar.querySelector(".bm-lm-exit").addEventListener("click", function(){
      if(!confirm("לצאת ממצב שיעור? המורה יראה שיצאת.")) return;
      send("bye");
      end();
    });
    document.body.appendChild(bar);
  }
  function toast(text){
    var t = document.createElement("div");
    t.className = "bm-lm-toast";
    t.setAttribute("role", "alert");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 6000);
  }
  function end(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    if(timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    if(bar) bar.remove();
  }

  function onVisibility(){
    if(document.visibilityState === "hidden"){
      send("out");
    } else {
      send("in", function(res){
        if(res.leaves > leaves){
          toast("חזרת לדף. יצאת מהדף " + (res.leaves === 1 ? "פעם אחת" : res.leaves + " פעמים") + " בשיעור הזה.");
        }
        leaves = res.leaves;
        save();
      });
    }
  }

  function start(){
    showBar();
    send("in", function(res){ leaves = res.leaves; save(); });
    document.addEventListener("visibilitychange", onVisibility);
    timer = setInterval(function(){
      if(!(st.until > Date.now())){ end(); return; }
      if(document.visibilityState === "visible") send("in", function(res){ leaves = res.leaves; save(); });
    }, 60000);
  }

  if(document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
