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
  var myCode = key && (key.page === page || key.nav === page) ? key.code : "";   /* nav - דף שהמורה שלח אליו את הכיתה */

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
      ".bm-lock-wait{font-size:1.05rem;color:#4E5B72}" +
      ".bm-lock button.bm-lock-teacher{min-height:36px;margin-top:4px;background:none;color:#123A78;font-size:.92rem;font-weight:600;text-decoration:underline;text-underline-offset:3px}" +
      ".bm-lock button.bm-lock-teacher:hover{background:none;color:#0B2A5B}";
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
          '<label for="bmLockNameInput" id="bmLockNameLabel">השם המלא שלכם</label>' +
          '<input id="bmLockNameInput" type="text" autocomplete="name" maxlength="60">' +
        '</div>' +
        '<button type="submit" id="bmLockBtn">כניסה לשיעור</button>' +
        '<p class="bm-lock-msg" id="bmLockMsg" role="status" aria-live="polite"></p>' +
        '<button type="button" class="bm-lock-teacher" id="bmLockTeacher" hidden>👨‍🏫 כניסת מורה לבדיקה</button>' +
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
    var tBtn = document.getElementById("bmLockTeacher");
    var lab = document.getElementById("bmLockNameLabel");
    var pending = null;
    codeIn.focus();
    codeIn.addEventListener("input", function(){
      var clean = codeIn.value.replace(/\D/g, "").slice(0, 4);
      if(clean !== codeIn.value) codeIn.value = clean;
      msg.textContent = ""; pending = null; nameBox.hidden = true; nameIn.readOnly = false; nameIn.type = "text"; tBtn.hidden = true;
    });
    /* כניסת מורה לבדיקה: סיסמת האזור האישי במקום ת"ז. בבקרה המורה מופיע בנפרד, לא נספר ולא בדוח. */
    function askName(code, res){
      var lk = window.BM_LESSON_LOCK && window.BM_LESSON_LOCK.get(code);
      var idMode = !!res.idLogin && !(lk && lk.tok);
      pending = { code:code, res:res, idMode:idMode };
      msg.textContent = "";
      lab.textContent = idMode ? "מספר תעודת הזהות שלכם (9 ספרות)" : "השם המלא שלכם";
      nameIn.type = "text";
      nameIn.setAttribute("inputmode", idMode ? "numeric" : "text");
      nameIn.setAttribute("autocomplete", idMode ? "off" : "name");
      nameIn.maxLength = idMode ? 9 : 60;
      nameIn.readOnly = !!lk && !idMode;
      if(idMode){ nameIn.value = ""; msg.textContent = "בשיעור הזה נכנסים עם תעודת זהות."; }
      else if(lk){ nameIn.value = lk.name; msg.textContent = "נכנסת כבר לשיעור הזה בשם \"" + lk.name + "\". באמצע שיעור אי אפשר להחליף שם."; }
      else try{ nameIn.value = nameIn.value || localStorage.getItem("bm-lesson-name") || ""; }catch(err){}
      tBtn.textContent = "👨‍🏫 כניסת מורה לבדיקה";
      tBtn.hidden = false;
      nameBox.hidden = false;
      nameIn.focus();
    }
    tBtn.addEventListener("click", function(){
      if(!pending) return;
      if(pending.teacher){ askName(pending.code, pending.res); return; }
      pending.teacher = true;
      lab.textContent = "הסיסמה של האזור האישי";
      nameIn.type = "password";
      nameIn.setAttribute("autocomplete", "current-password");
      nameIn.maxLength = 100;
      nameIn.readOnly = false;
      nameIn.value = "";
      tBtn.textContent = "↩ חזרה לכניסת תלמיד";
      msg.textContent = "";
      nameIn.focus();
    });
    function enter(code, res, name, tok, fromId){
      var until = res.until || (Date.now() + 12 * 3600 * 1000);
      write(KEY_STORE, { code:code, page:res.url.split("#")[0], until:until });
      if(res.monitor){
        var lk = window.BM_LESSON_LOCK && window.BM_LESSON_LOCK.get(code), sid;
        if(lk){ sid = lk.sid; if(!fromId){ name = lk.name; tok = lk.tok || ""; } }
        else {
          var a = new Uint8Array(9);
          (window.crypto || window.msCrypto).getRandomValues(a);
          sid = Array.prototype.map.call(a, function(b){ return ("0" + b.toString(16)).slice(-2); }).join("");
        }
        if((!lk || fromId) && window.BM_LESSON_LOCK) window.BM_LESSON_LOCK.set(code, name, sid, until, tok);
        try{
          localStorage.setItem("bm-lesson-name", name);
          localStorage.setItem("bm-lesson-mode", JSON.stringify({ code:code, name:name, sid:sid, until:until, tok:tok || "", label:res.label || "", leaves:0 }));
        }catch(e){}
      }
      if(res.url.split("#")[0] === page) location.reload();
      else location.href = res.url;
    }
    form.addEventListener("submit", function(e){
      e.preventDefault();
      if(pending){
        if(pending.teacher){
          var pw = nameIn.value;
          if(!pw){ msg.textContent = "הקלידו את הסיסמה של האזור האישי."; nameIn.focus(); return; }
          var pt = pending;
          btn.disabled = true; msg.textContent = "בודקים…";
          window.BM_LESSON_TEACHER(pt.code, pw).then(function(r){
            if(pending !== pt) return;
            if(r && r.auth === false){ msg.textContent = "הסיסמה לא נכונה."; nameIn.select(); return; }
            if(!r || !r.ok){ msg.textContent = (r && r.error) || "לא הצלחנו להיכנס. נסו שוב."; return; }
            nameIn.value = ""; nameIn.type = "text";
            enter(pt.code, pt.res, r.name, r.tok, true);
          }).catch(function(){ msg.textContent = "אין חיבור לשרת כרגע. נסו שוב בעוד רגע."; })
            .then(function(){ btn.disabled = false; });
          return;
        }
        if(pending.idMode){
          var id = nameIn.value.replace(/\D/g, "");
          if(id.length < 5){ msg.textContent = "הקלידו את מספר תעודת הזהות שלכם (9 ספרות)."; nameIn.focus(); return; }
          var p0 = pending;
          btn.disabled = true; msg.textContent = "בודקים…";
          window.BM_LESSON_ID(p0.code, id).then(function(r){
            if(pending !== p0) return;
            if(!r || !r.ok){ msg.textContent = (r && r.error) || "לא הצלחנו לזהות. נסו שוב."; nameIn.select(); return; }
            nameIn.value = "";
            enter(p0.code, p0.res, r.name, r.tok, true);
          }).catch(function(){ msg.textContent = "אין חיבור לשרת כרגע. נסו שוב בעוד רגע."; })
            .then(function(){ btn.disabled = false; });
          return;
        }
        var name = nameIn.value.replace(/\s+/g, " ").trim();
        if(name.length < 2){ msg.textContent = "כתבו את השם המלא שלכם."; nameIn.focus(); return; }
        enter(pending.code, pending.res, name, "", false);
        return;
      }
      var code = codeIn.value;
      if(!/^\d{4}$/.test(code)){ msg.textContent = "הקוד הוא 4 ספרות."; codeIn.focus(); return; }
      btn.disabled = true;
      msg.textContent = "בודקים…";
      fetch(API + "?action=lesson&code=" + encodeURIComponent(code)).then(function(r){ return r.json(); }).then(function(res){
        if(!(res && res.ok && /^[\w.-]+\.html(#[\w-]+)?$/.test(res.url || ""))){ msg.textContent = "הקוד לא נכון. בדקו מול הלוח."; codeIn.select(); return; }
        if(res.monitor){ askName(code, res); return; }
        enter(code, res, "", "", false);
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
     in    - התלמיד בדף (בכניסה לדף, וכל 15 שניות)
     out   - התלמיד עבר ללשונית/אפליקציה אחרת (reason:"hidden"),
             לחלון אחר כשהדף עדיין גלוי (reason:"blur"), או פיצל את המסך (reason:"split")
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
  var stopped = false;

  function save(){ try{ st.leaves = leaves; localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} }

  function send(state, onDone, extra, retry){
    var msg = { action:"presence", code:st.code, sid:st.sid, name:st.name, tok:st.tok || "", page:page, state:state, t:Date.now(),
                work:work(), helpId:st.helpId || "" };
    if(extra) for(var k in extra) msg[k] = extra[k];
    var body = JSON.stringify(msg);
    /* השרת עסוק (הרבה תלמידים מדווחים יחד) או שהחיבור נפל - מנסים שוב פעם אחת, עם אותו זמן.
       בלי זה "חזרתי לדף" יכול ללכת לאיבוד, והמורה רואה יציאה שלא הייתה. */
    function again(){ if(!retry && !stopped) setTimeout(function(){ sendRaw(body, onDone, true); }, 1200 + Math.random() * 1500); }
    sendRaw(body, onDone, retry, again);
  }
  function sendRaw(body, onDone, retried, again){
    try{
      fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:body, keepalive:true })
        .then(function(r){ return r.json(); })
        .then(function(res){
          if(res && res.ended){ end(); return; }
          if(res && res.nameTaken){ nameTaken(); return; }
          if(res && res.kicked){ kickedOut(); return; }
          if(res && res.needId){ needId(); return; }
          if(res && res.busy){ if(again) again(); return; }
          if(res && res.ok) navCheck(res.nav);
          if(res && res.ok) helpCheck(res);
          if(res && res.ok && !window.BM_DOCK) actNotice(res.act);   /* בדפים עם סרגל הכלים - הסרגל מודיע */
          if(res && res.ok && onDone) onDone(res);
        })
        .catch(function(){ if(again) again(); });
    }catch(e){}
  }
  /* השם כבר מחובר לשיעור ממכשיר אחר - לא נכנסים בו */
  function nameTaken(){
    var who = st ? st.name : "";
    end();
    var c = document.createElement("div");
    c.setAttribute("role", "alertdialog");
    c.style.cssText = "position:fixed;inset:0;z-index:10002;display:flex;align-items:center;justify-content:center;padding:20px;" +
      "background:#0B2A5B;color:#fff;text-align:center;direction:rtl;font:700 18px/1.5 Heebo,Rubik,Arial,sans-serif";
    c.innerHTML = '<div><div style="font-size:44px" aria-hidden="true">⛔</div><p style="margin:10px 0 6px">השם "' + esc(who) + '" כבר נמצא בשיעור ממכשיר אחר</p>' +
      '<p style="margin:0 0 14px;font-weight:400;font-size:16px">אי אפשר להיכנס לשיעור בשם של תלמיד אחר. אם זה השם שלך - קרא/י למורה. המורה רואה את הניסיון.</p>' +
      '<a href="index.html" style="color:#FFD9B8">לדף הבית</a></div>';
    document.body.appendChild(c);
  }
  /* בשיעור הזה נכנסים עם תעודת זהות (המורה שמר רשימת כיתה) - צריך להיכנס מחדש עם הקוד */
  function needId(){
    if(stopped) return;
    var code = st ? st.code : "";
    end();
    if(window.BM_LESSON_LOCK && window.BM_LESSON_LOCK.clear) window.BM_LESSON_LOCK.clear(code);
    var c = document.createElement("div");
    c.setAttribute("role", "alertdialog");
    c.style.cssText = "position:fixed;inset:0;z-index:10002;display:flex;align-items:center;justify-content:center;padding:20px;" +
      "background:#0B2A5B;color:#fff;text-align:center;direction:rtl;font:700 18px/1.5 Heebo,Rubik,Arial,sans-serif";
    c.innerHTML = '<div><div style="font-size:44px" aria-hidden="true">🪪</div><p style="margin:10px 0 6px">בשיעור הזה נכנסים עם תעודת זהות</p>' +
      '<p style="margin:0 0 14px;font-weight:400;font-size:16px">חזרו לדף הבית, הקלידו שוב את הקוד מהלוח, ואחר כך את מספר תעודת הזהות שלכם.</p>' +
      '<a href="index.html" style="color:#FFD9B8">לדף הבית</a></div>';
    document.body.appendChild(c);
  }
  /* המורה הוציא את התלמיד מהשיעור: מצב השיעור נסגר, וגם הגישה לדף הנעול של השיעור */
  function kickedOut(){
    if(stopped) return;
    var code = st ? st.code : "";
    end();
    try{
      var k = JSON.parse(localStorage.getItem("bm-lesson-key") || "null");
      if(k && String(k.code) === String(code)) localStorage.removeItem("bm-lesson-key");
    }catch(e){}
    var c = document.createElement("div");
    c.setAttribute("role", "alertdialog");
    c.style.cssText = "position:fixed;inset:0;z-index:10002;display:flex;align-items:center;justify-content:center;padding:20px;" +
      "background:#0B2A5B;color:#fff;text-align:center;direction:rtl;font:700 18px/1.5 Heebo,Rubik,Arial,sans-serif";
    c.innerHTML = '<div><div style="font-size:44px" aria-hidden="true">🚫</div><p style="margin:10px 0 6px">המורה הוציא אותך מהשיעור</p>' +
      '<p style="margin:0 0 14px;font-weight:400;font-size:16px">אם לדעתך זו טעות - פנה/י למורה.</p>' +
      '<a href="index.html" style="color:#FFD9B8">לדף הבית</a></div>';
    document.body.appendChild(c);
  }
  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"']/g, function(ch){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]; }); }

  /* ---------- מה התלמיד עושה בדף (בשביל טבלת "שיעור חי" אצל המורה) ----------
     task/tasks - באיזו משימה (0 = "כל השאלות" או דף בלי משימות), name - שם המשימה,
     ans/fields - כמה תיבות תשובה כתובות מתוך כמה יש בדף, idle - כמה שניות עברו מאז שכתב או עבר משימה. */
  var lastAct = Date.now();
  function touch(){ lastAct = Date.now(); }
  function work(){
    var w = { task:0, tasks:0, name:"", ans:0, fields:0, idle:Math.round((Date.now() - lastAct) / 1000) };
    try{
      var S = window.BeitMidrashSteps;
      if(S && S.navs && S.navs.length){
        var nv = S.navs.filter(function(n){ return n.shown && n.shown(); })[0] || S.navs[0], i = nv.info();
        w.tasks = i.total || 0;
        w.task = i.all ? 0 : (i.current || 0) + 1;
        w.name = String((i.all ? "כל השאלות" : (i.tasks && i.tasks[i.current])) || "").slice(0, 60);
      }
    }catch(e){}
    var f = document.querySelectorAll("textarea.answer");
    w.fields = f.length;
    for(var k = 0; k < f.length; k++){ if(String(f[k].value || "").trim().length >= 2) w.ans++; }
    return w;
  }
  /* ✋ צריך עזרה: מזהה לבקשה נשמר במכשיר (גם במעבר בין דפים). כשהמורה לוחץ "טיפלתי" -
     השרת מחזיר את המזהה ב-helpAck, והבקשה יורדת אצל התלמיד. */
  function helpPaint(){
    var b = bar && bar.querySelector(".bm-lm-help");
    if(!b) return;
    var on = !!st.helpId;
    b.textContent = on ? "✋ ביקשת עזרה · ביטול" : "✋ צריך עזרה";
    b.setAttribute("aria-pressed", String(on));
    b.classList.toggle("is-on", on);
  }
  function helpToggle(){
    if(st.helpId){ st.helpId = ""; save(); helpPaint(); send("in"); return; }
    st.helpId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    save(); helpPaint();
    send("in", function(){ toast("✋ המורה רואה שביקשת עזרה."); });
  }
  function helpCheck(res){
    if(st.helpId && res.helpAck && res.helpAck === st.helpId){
      st.helpId = ""; save(); helpPaint();
      toast("👍 המורה ראה/תה את הבקשה שלך ויגיע/תגיע אליך.");
    }
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
      ".bm-lm-help{flex:none;border:0;border-radius:999px;background:#FFD9B8;color:#5A2A00;font:inherit;font-size:13px;font-weight:700;" +
      "padding:5px 10px;cursor:pointer;min-height:32px}" +
      ".bm-lm-help.is-on{background:#FF7A1A;color:#fff}" +
      ".bm-lm-help:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
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
      '<span class="bm-lm-text">מצב שיעור: המורה רואה באיזו משימה אתם, יציאות מהדף והדבקת טקסט</span>' +
      '<button type="button" class="bm-lm-help" aria-pressed="false">✋ צריך עזרה</button>' +
      '<button type="button" class="bm-lm-exit">יציאה</button>';
    bar.querySelector(".bm-lm-help").addEventListener("click", helpToggle);
    bar.querySelector(".bm-lm-exit").addEventListener("click", function(){
      if(!confirm("לצאת ממצב שיעור? המורה יראה שיצאת.")) return;
      send("bye");
      end();
    });
    document.body.appendChild(bar);
    helpPaint();
  }
  /* נעילה על דף: בדף הנעול - בלי מעבר בין משימות; בדף אחר באתר - חוזרים לדף הנעול */
  function lockHash(){ return "#bmlock-" + st.lock.step + (st.lock.key ? "-" + st.lock.key : ""); }
  function applyLock(){
    var on = !!(st && st.lock && st.lock.page === page);
    var S = window.BeitMidrashSteps;
    if(S && S.lock) S.lock(on && st.lock.step > 0);   /* step 0 = נעילה על הדף בלבד (המורה היה בתצוגה המלאה) */
    if(bar){
      var tx = bar.querySelector(".bm-lm-text");
      if(tx) tx.textContent = on ? "🔒 המורה נעל את הדף: נשארים בדף ובמשימה הזאת" : "מצב שיעור: המורה רואה יציאות מהדף והדבקת טקסט";
    }
  }
  function toast(text){
    var t = document.createElement("div");
    t.className = "bm-lm-toast";
    t.setAttribute("role", "alert");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 6000);
  }
  /* המורה שלח את הכיתה לדף: עוברים לבד, פעם אחת לכל שליחה (אם התלמיד חוזר אחורה - לא מחזירים אותו).
     שומרים את הדף ב-bm-lesson-key.nav, כדי שדף נעול (למשל מבחן) ייפתח עם קוד השיעור. */
  var navigating = false;
  function navCheck(nav){
    if(!nav || !nav.id || navigating || st.navSeen === nav.id) return;
    st.navSeen = nav.id; save();
    var target = String(nav.url || "").split("#")[0];
    if(!/^[\w.-]+\.html$/.test(target)) return;
    try{
      var k = JSON.parse(localStorage.getItem("bm-lesson-key") || "null") || { code:st.code, page:"", until:st.until };
      if(k.code === st.code){ k.nav = target; localStorage.setItem("bm-lesson-key", JSON.stringify(k)); }
    }catch(e){}
    /* #bmstep-3 = משימה; #bmlock-3 = משימה + נעילה (התלמיד לא יוצא מהדף ומהמשימה); #bmfree-0 = שחרור הנעילה */
    var stepM = String(nav.url || "").match(/#bm(step|lock|free)-(\d+)(?:-([\w-]+))?$/);
    st.lock = (stepM && stepM[1] === "lock") ? { page:target, step:+stepM[2], key:stepM[3] || "" } : null;
    save();
    applyLock();
    if(target === page){
      var S = window.BeitMidrashSteps;
      if(stepM && stepM[1] !== "free" && +stepM[2] > 0 && S && S.goTo){
        toast("המורה מעביר את הכיתה" + (nav.label ? ": " + nav.label : "") + "…");
        S.goTo(+stepM[2], stepM[3] || "");
      } else if(stepM && stepM[1] === "free"){
        toast("🔓 המורה שחרר את הנעילה. אפשר לעבור בין המשימות.");
      }
      return;
    }
    navigating = true;
    markNav();
    toast("המורה מעביר את הכיתה" + (nav.label ? ": " + nav.label : "") + "…");
    setTimeout(function(){ location.href = nav.url; }, 1500);
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
    stopped = true;
    try{ localStorage.removeItem(KEY); }catch(e){}
    if(timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", comeBack);
    window.removeEventListener("resize", onResize);
    if(splitCover) splitCover.remove();
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
    if(!isOut || splitNow || document.visibilityState !== "visible" || !document.hasFocus()) return;
    isOut = false;
    send("in", function(res){
      if(res.leaves > leaves){
        toast("חזרת לדף. יצאת מהדף " + (res.leaves === 1 ? "פעם אחת" : res.leaves + " פעמים") + " בשיעור הזה.");
      }
      leaves = res.leaves;
      save();
    });
  }
  /* מסך מפוצל (אייפד/אנדרואיד, או חלון קטן ב-Stage Manager): הדף נהיה צר הרבה יותר מהמסך
     (או נמוך הרבה יותר, כשלא מקלידים - כדי שהמקלדת לא תיחשב). רק במכשירי מגע, כדי שחלון
     מחשב שאינו מוגדל לא ייחשב. בזמן פיצול הדף מוסתר, והמורה רואה "מסך מפוצל". */
  var splitNow = false, splitCover = null, splitTimer = null;
  function touchDevice(){
    return (navigator.maxTouchPoints || 0) > 0 && !!window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  }
  function isSplit(){
    if(!touchDevice()) return false;
    var sw = screen.width, sh = screen.height;
    if(!sw || !sh) return false;
    var land;
    if(screen.orientation && screen.orientation.type) land = screen.orientation.type.indexOf("landscape") === 0;
    else if(typeof window.orientation === "number") land = Math.abs(window.orientation) === 90;
    else land = window.innerWidth > window.innerHeight;
    var fullW = land ? Math.max(sw, sh) : Math.min(sw, sh), fullH = land ? Math.min(sw, sh) : Math.max(sw, sh);
    var de = document.documentElement, w = de.clientWidth || window.innerWidth, h = de.clientHeight || window.innerHeight;   /* לא מושפע מהגדלה באצבעות */
    if(w < fullW * 0.85) return true;
    var a = document.activeElement, typing = a && (a.tagName === "TEXTAREA" || a.tagName === "INPUT" || a.isContentEditable);
    return !typing && h < fullH * 0.6;
  }
  function checkSplit(){
    var now = isSplit();
    if(now === splitNow) return;
    splitNow = now;
    if(now){
      if(!splitCover){
        splitCover = document.createElement("div");
        splitCover.setAttribute("role", "alertdialog");
        splitCover.style.cssText = "position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px;" +
          "background:#0B2A5B;color:#fff;text-align:center;direction:rtl;font:700 18px/1.5 Heebo,Rubik,Arial,sans-serif";
        splitCover.innerHTML = '<div><div style="font-size:44px" aria-hidden="true">📱</div><p style="margin:10px 0 6px">המסך מפוצל</p>' +
          '<p style="margin:0;font-weight:400;font-size:16px">כדי להמשיך, חזרו למסך מלא. המורה רואה שהמסך מפוצל.</p></div>';
      }
      document.body.appendChild(splitCover);
      isOut = false; goOut("split");
    } else {
      if(splitCover) splitCover.remove();
      comeBack();
    }
  }
  function onResize(){ clearTimeout(splitTimer); splitTimer = setTimeout(checkSplit, 400); }
  /* מה לא נחשב יציאה:
     - לחיצה בתוך מסגרת שבדף (סרטון, מצגת, טופס) - הפוקוס עובר למסגרת, אבל התלמיד עדיין בדף.
     - חלונית של האתר עצמו (אישור, הודעה, הדפסה).
     - מעבר לדף אחר באתר (קישור, או המורה שהעביר את הכיתה) - הדף הבא מדווח שהתלמיד בו. */
  var dialogUntil = 0, navAt = 0;
  function markNav(){ navAt = Date.now(); }
  ["alert", "confirm", "prompt", "print"].forEach(function(fn){
    var orig = window[fn];
    if(typeof orig !== "function") return;
    window[fn] = function(){
      dialogUntil = Date.now() + 600000;
      try{ return orig.apply(window, arguments); }
      finally{ dialogUntil = Date.now() + 1500; }
    };
  });
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if(a && st.lock && st.lock.page === page){
      try{
        var lu = new URL(a.href, location.href);
        if(lu.origin === location.origin && lu.pathname !== location.pathname){
          e.preventDefault(); e.stopPropagation();
          toast("🔒 המורה ביקש להישאר בדף הזה.");
          return;
        }
      }catch(err){}
    }
    if(!a || e.defaultPrevented || e.button > 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if(a.target && a.target !== "_self") return;
    try{ var u = new URL(a.href, location.href); if(u.origin === location.origin && u.pathname !== location.pathname) markNav(); }catch(err){}
  }, true);
  document.addEventListener("submit", markNav, true);
  function innocentBlur(){
    var a = document.activeElement;
    return (a && a.tagName === "IFRAME") || Date.now() < dialogUntil;
  }
  function onBlur(){ setTimeout(function(){ if(document.visibilityState === "visible" && !document.hasFocus() && !innocentBlur()) goOut("blur"); }, 300); }
  function onPaste(e){
    var t = e.target;
    if(!t || !(t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && /^(text|search|)$/.test(t.type || "")) || t.isContentEditable)) return;
    var len = 0;
    try{ len = ((e.clipboardData || window.clipboardData).getData("text") || "").length; }catch(err){}
    send("paste", null, { len:len });
  }
  function onVisibility(){
    if(document.visibilityState === "hidden"){
      if(Date.now() - navAt < 4000) return;   /* עובר לדף אחר באתר */
      isOut = false; goOut("hidden");
    }
    else comeBack();
  }

  function start(){
    /* הכיתה נעולה על דף אחר - חוזרים אליו מיד */
    if(st.lock && st.lock.page && st.lock.page !== page){ location.replace(st.lock.page + lockHash()); return; }
    showBar();
    applyLock();
    document.addEventListener("bm-steps-ready", applyLock);
    send("in", function(res){ leaves = res.leaves; save(); });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", comeBack);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("input", touch, true);
    document.addEventListener("bm-steps-change", touch);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    checkSplit();
    timer = setInterval(function(){
      if(!(st.until > Date.now())){ end(); return; }
      if(document.visibilityState === "visible" && !isOut) send("in", function(res){ leaves = res.leaves; save(); });
    }, 15000);
  }

  if(document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
