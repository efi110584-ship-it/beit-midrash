/* ============================================================
   נעילת הדף של השיעור
   ============================================================
   כל עוד יש קוד פעיל, הדף שהמורה בחר לקוד נפתח רק למי שהקליד את הקוד
   (בדף הבית, או כאן במסך הנעילה). שאר הדפים - כולל כרטיסיות החזרה -
   פתוחים תמיד. כשהקוד נגמר או מבוטל, הדף פתוח שוב לכולם.
   מורה שנכנס לאזור האישי (באותה לשונית) לא ננעל.
   אם אין חיבור לשרת - הדף נשאר פתוח.
   ============================================================ */
(function(){
  "use strict";
  var API = window.BM_API_URL;
  var page = location.pathname.split("/").pop() || "index.html";
  if(!API || page === "index.html" || page === "screen.html" || /-(questions|answers)\.html$/.test(page)) return;
  try{
    if(sessionStorage.getItem("bm-teacher-token") || sessionStorage.getItem("teacherAreaUnlocked") === "1") return;
  }catch(e){}

  var KEY_STORE = "bm-lesson-key";   /* {code, page, until} - הקוד שהתלמיד הקליד */
  var HINT_STORE = "bm-lesson-lock"; /* {page, until} - איזה דף נעול עכשיו (כדי להסתיר מיד בכניסה) */
  function read(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } }
  function write(k, v){ try{ if(v) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k); }catch(e){} }
  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }

  var key = read(KEY_STORE);
  if(key && !(key.until > Date.now())){ write(KEY_STORE, null); key = null; }
  var hint = read(HINT_STORE);
  var myCode = key && key.page === page ? key.code : "";

  var cover = null, prevOverflow = "";
  function css(){
    if(document.getElementById("bm-lock-style")) return;
    var st = document.createElement("style");
    st.id = "bm-lock-style";
    st.textContent =
      ".bm-lock{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;" +
        "background:#F3F6FB;direction:rtl;font-family:Heebo,Rubik,Arial,sans-serif;overflow:auto}" +
      ".bm-lock-box{width:100%;max-width:420px;padding:26px 22px;border-radius:18px;background:#fff;border:1px solid #DCE4F1;" +
        "box-shadow:0 12px 30px rgba(11,42,91,.12);text-align:center;color:#1B2A44}" +
      ".bm-lock-ico{font-size:40px;line-height:1}" +
      ".bm-lock h2{margin:10px 0 6px;font-size:1.35rem;color:#0B2A5B;text-wrap:balance}" +
      ".bm-lock p{margin:0 0 14px;font-size:1rem;line-height:1.55;color:#4E5B72}" +
      ".bm-lock form{display:flex;flex-direction:column;gap:10px;align-items:stretch}" +
      ".bm-lock label{font-weight:700;color:#123A78}" +
      ".bm-lock input{min-height:48px;padding:8px 12px;border:2px solid #C9D5EA;border-radius:12px;font:inherit;font-size:1.3rem;text-align:center}" +
      ".bm-lock input.bm-lock-code{letter-spacing:.3em;direction:ltr}" +
      ".bm-lock input.bm-lock-code:placeholder-shown{letter-spacing:normal;direction:rtl}" +
      ".bm-lock input:focus-visible{outline:3px solid #FFB86B;outline-offset:2px;border-color:#123A78}" +
      ".bm-lock button{min-height:48px;border:0;border-radius:12px;background:#123A78;color:#fff;font:inherit;font-weight:700;font-size:1.05rem;cursor:pointer}" +
      ".bm-lock button:hover{background:#0B2A5B}" +
      ".bm-lock button:focus-visible,.bm-lock a:focus-visible{outline:3px solid #FFB86B;outline-offset:2px}" +
      ".bm-lock-msg{min-height:1.4em;margin:0;font-weight:700;color:#B42318}" +
      ".bm-lock-links{display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:center;margin-top:16px}" +
      ".bm-lock-links a{color:#123A78;font-weight:700}" +
      ".bm-lock-wait{font-size:1.05rem;color:#4E5B72}";
    (document.head || document.documentElement).appendChild(st);
  }
  function show(html){
    css();
    if(!cover){
      cover = document.createElement("div");
      cover.className = "bm-lock";
      cover.setAttribute("role", "dialog");
      cover.setAttribute("aria-modal", "true");
      cover.setAttribute("aria-label", "הדף נעול");
      (document.body || document.documentElement).appendChild(cover);
      if(document.body){ prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    }
    cover.innerHTML = '<div class="bm-lock-box">' + html + '</div>';
  }
  function open(){
    if(!cover) return;
    cover.remove();
    cover = null;
    if(document.body) document.body.style.overflow = prevOverflow;
  }
  function whenBody(fn){ if(document.body) fn(); else document.addEventListener("DOMContentLoaded", fn); }

  function lockedView(){
    var qPage = page.replace(/\.html$/, "-questions.html");
    show(
      '<div class="bm-lock-ico" aria-hidden="true">🔒</div>' +
      '<h2>הדף הזה פתוח עכשיו רק עם קוד</h2>' +
      '<p>המורה פתח את הדף לשיעור. כדי להיכנס, הקלידו את הקוד שעל הלוח.</p>' +
      '<form id="bmLockForm" novalidate>' +
        '<label for="bmLockCode">הקוד מהמורה</label>' +
        '<input id="bmLockCode" class="bm-lock-code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="4 ספרות">' +
        '<div id="bmLockName" hidden>' +
          '<p>בשיעור הזה <b>המורה רואה אם יוצאים מהדף</b> (לא לאן יוצאים).</p>' +
          '<label for="bmLockNameInput">השם המלא שלכם</label>' +
          '<input id="bmLockNameInput" type="text" autocomplete="name" maxlength="60">' +
        '</div>' +
        '<button type="submit" id="bmLockBtn">כניסה לשיעור</button>' +
        '<p class="bm-lock-msg" id="bmLockMsg" role="status" aria-live="polite"></p>' +
      '</form>' +
      '<div class="bm-lock-links"><a href="index.html">לדף הבית</a><a href="' + esc(qPage) + '" id="bmLockCards" hidden>לכרטיסיות החזרה של הפרק</a></div>'
    );
    fetch(qPage, { method:"HEAD" }).then(function(r){ var a = document.getElementById("bmLockCards"); if(r.ok && a) a.hidden = false; }).catch(function(){});
    var form = document.getElementById("bmLockForm");
    var codeIn = document.getElementById("bmLockCode");
    var nameBox = document.getElementById("bmLockName");
    var nameIn = document.getElementById("bmLockNameInput");
    var msg = document.getElementById("bmLockMsg");
    var btn = document.getElementById("bmLockBtn");
    var pending = null;
    codeIn.focus();
    codeIn.addEventListener("input", function(){
      var clean = codeIn.value.replace(/\D/g, "").slice(0, 4);
      if(clean !== codeIn.value) codeIn.value = clean;
      msg.textContent = ""; pending = null; nameBox.hidden = true;
    });
    function enter(code, res, name){
      var until = res.until || (Date.now() + 12 * 3600 * 1000);
      write(KEY_STORE, { code:code, page:res.url.split("#")[0], until:until });
      if(res.monitor){
        var a = new Uint8Array(9);
        (window.crypto || window.msCrypto).getRandomValues(a);
        var sid = Array.prototype.map.call(a, function(b){ return ("0" + b.toString(16)).slice(-2); }).join("");
        try{
          localStorage.setItem("bm-lesson-name", name);
          localStorage.setItem("bm-lesson-mode", JSON.stringify({ code:code, name:name, sid:sid, until:until, label:res.label || "", leaves:0 }));
        }catch(e){}
      }
      if(res.url.split("#")[0] === page) location.reload();
      else location.href = res.url;
    }
    form.addEventListener("submit", function(e){
      e.preventDefault();
      if(pending){
        var name = nameIn.value.replace(/\s+/g, " ").trim();
        if(name.length < 2){ msg.textContent = "כתבו את השם המלא שלכם."; nameIn.focus(); return; }
        enter(pending.code, pending.res, name);
        return;
      }
      var code = codeIn.value;
      if(!/^\d{4}$/.test(code)){ msg.textContent = "הקוד הוא 4 ספרות."; codeIn.focus(); return; }
      btn.disabled = true;
      msg.textContent = "בודקים…";
      fetch(API + "?action=lesson&code=" + encodeURIComponent(code)).then(function(r){ return r.json(); }).then(function(res){
        if(!(res && res.ok && /^[\w.-]+\.html(#[\w-]+)?$/.test(res.url || ""))){ msg.textContent = "הקוד לא נכון. בדקו מול הלוח."; codeIn.select(); return; }
        if(res.monitor){
          pending = { code:code, res:res };
          msg.textContent = "";
          try{ nameIn.value = nameIn.value || localStorage.getItem("bm-lesson-name") || ""; }catch(err){}
          nameBox.hidden = false;
          nameIn.focus();
          return;
        }
        enter(code, res, "");
      }).catch(function(){ msg.textContent = "אין חיבור לשרת כרגע. נסו שוב בעוד רגע."; })
        .then(function(){ btn.disabled = false; });
    });
  }

  /* אם ידוע שהדף הזה נעול עכשיו - מסתירים מיד, עד שהשרת עונה */
  var waitTimer = null;
  if(hint && hint.page === page && hint.until > Date.now() && !myCode){
    whenBody(function(){
      if(cover) return;
      show('<div class="bm-lock-ico" aria-hidden="true">⏳</div><p class="bm-lock-wait">רגע, בודקים אם הדף פתוח…</p>');
    });
    waitTimer = setTimeout(open, 8000);
  }

  fetch(API + "?action=lessonLock&page=" + encodeURIComponent(page) + "&code=" + encodeURIComponent(myCode))
    .then(function(r){ return r.json(); })
    .then(function(res){
      clearTimeout(waitTimer);
      if(!res || !res.ok || typeof res.locked !== "boolean"){ open(); return; }
      /* כמה קודים במקביל: זוכרים רק את הדף הזה (נעול או לא), בלי למחוק מידע על דפים אחרים */
      if(res.lessonPage) write(HINT_STORE, { page:res.lessonPage, until:res.until });
      else if(hint && hint.page === page) write(HINT_STORE, null);
      if(res.locked) whenBody(lockedView);
      else open();
    })
    .catch(function(){ clearTimeout(waitTimer); open(); });
})();

/* ============================================================
   מצב שיעור (בקרת שיעור) - כיתות י"א וי"ב
   ============================================================
   פועל רק אחרי שתלמיד נכנס עם קוד לשיעור שהמורה הפעיל בו בקרה
   (הכניסה בדף הבית שומרת את פרטי השיעור במכשיר עד סוף תוקף הקוד).
   כל עוד הדף פתוח, הוא מדווח לסקריפט של המורה:
     in    - התלמיד בדף (בכניסה לדף, וכל 30 שניות)
     out   - התלמיד עבר ללשונית/אפליקציה אחרת (reason:"hidden"),
             או לחלון אחר כשהדף עדיין גלוי (reason:"blur")
     paste - התלמיד הדביק טקסט בתיבת תשובה (len - כמה תווים)
     bye   - התלמיד לחץ "יציאה ממצב שיעור"
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

  function send(state, onDone, extra){
    var msg = { action:"presence", code:st.code, sid:st.sid, name:st.name, page:page, state:state, t:Date.now() };
    if(extra) for(var k in extra) msg[k] = extra[k];
    var body = JSON.stringify(msg);
    try{
      fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:body, keepalive:true })
        .then(function(r){ return r.json(); })
        .then(function(res){
          if(res && res.ended){ end(); return; }
          if(res && res.ok && !window.BM_DOCK) actNotice(res.act);   /* בדפים עם סרגל הכלים - הסרגל מודיע */
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
      ".bm-lm-act{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;" +
      "max-width:calc(100vw - 24px);padding:10px 10px 10px 16px;border-radius:14px;background:#B42318;color:#fff;" +
      "font:700 15px/1.35 Heebo,Rubik,Arial,sans-serif;box-shadow:0 10px 26px rgba(180,35,24,.35);direction:rtl;text-decoration:none}" +
      ".bm-lm-act-go{flex:none;padding:5px 12px;border-radius:999px;background:#fff;color:#B42318}" +
      ".bm-lm-act-x{flex:none;border:0;background:transparent;color:#fff;font-size:18px;cursor:pointer;min-width:32px;min-height:32px}" +
      ".bm-lm-act:focus-visible,.bm-lm-act-x:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
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
      '<span class="bm-lm-text">מצב שיעור: המורה רואה יציאות מהדף והדבקת טקסט</span>' +
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
  /* המורה פתח פעילות חיה (ענן / הצבעה) - הודעה עם קישור, פעם אחת לכל פעילות */
  var actEl = null;
  function actNotice(act){
    if(!act || page === "live.html"){ if(actEl && !act){ actEl.remove(); actEl = null; } return; }
    if(st.actSeen === act.id || actEl) return;
    actEl = document.createElement("div");
    actEl.className = "bm-lm-act";
    actEl.setAttribute("role", "alert");
    actEl.innerHTML = '<a class="bm-lm-act" style="position:static;transform:none;box-shadow:none;padding:0" href="live.html">' +
      '<span>🔴 המורה פתח פעילות</span><span class="bm-lm-act-go">להשתתפות ›</span></a>' +
      '<button type="button" class="bm-lm-act-x" aria-label="סגירה">✕</button>';
    function seen(){ st.actSeen = act.id; save(); }
    actEl.querySelector("a").addEventListener("click", seen);
    actEl.querySelector("button").addEventListener("click", function(){ seen(); actEl.remove(); actEl = null; });
    document.body.appendChild(actEl);
  }

  function end(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    if(timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", comeBack);
    document.removeEventListener("paste", onPaste, true);
    if(bar) bar.remove();
    if(actEl) actEl.remove();
  }

  /* יציאה = הדף הוסתר (לשונית/אפליקציה אחרת) או שהחלון איבד פוקוס (חלון אחר במחשב, שורת הכתובת).
     isOut מונע דיווח כפול כששני האירועים קורים יחד. */
  var isOut = false;
  function goOut(why){
    if(isOut) return;
    isOut = true;
    send("out", null, { reason:why });
  }
  function comeBack(){
    if(!isOut || document.visibilityState !== "visible" || !document.hasFocus()) return;
    isOut = false;
    send("in", function(res){
      if(res.leaves > leaves){
        toast("חזרת לדף. יצאת מהדף " + (res.leaves === 1 ? "פעם אחת" : res.leaves + " פעמים") + " בשיעור הזה.");
      }
      leaves = res.leaves;
      save();
    });
  }
  function onBlur(){ setTimeout(function(){ if(document.visibilityState === "visible" && !document.hasFocus()) goOut("blur"); }, 300); }
  function onPaste(e){
    var t = e.target;
    if(!t || !(t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && /^(text|search|)$/.test(t.type || "")) || t.isContentEditable)) return;
    var len = 0;
    try{ len = ((e.clipboardData || window.clipboardData).getData("text") || "").length; }catch(err){}
    send("paste", null, { len:len });
  }
  function onVisibility(){
    if(document.visibilityState === "hidden"){ isOut = false; goOut("hidden"); }
    else comeBack();
  }

  function start(){
    showBar();
    send("in", function(res){ leaves = res.leaves; save(); });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", comeBack);
    document.addEventListener("paste", onPaste, true);
    timer = setInterval(function(){
      if(!(st.until > Date.now())){ end(); return; }
      if(document.visibilityState === "visible" && !isOut) send("in", function(res){ leaves = res.leaves; save(); });
    }, 30000);
  }

  if(document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
