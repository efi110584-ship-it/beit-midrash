/* ============================================================
   בקרת שיעור - כלים משותפים למורה (טבלת "שיעור חי" בדף הבית,
   והחלון "👥 שיעור חי" בסרגל הכחול - assets/class-dock.js)
   ============================================================
   - watch(res): משווה לרענון הקודם ומקפיץ התראה (עם צליל) כשתלמיד
     יוצא מהדף, מדביק טקסט, או מתנתק - רק אם המורה הפעיל התראות קופצות.
     ברירת המחדל: כבוי, כי מסך המורה מוקרן לכיתה וההתראות מסיחות.
     המצב נראה בכל מקרה בטבלה ובמספר הכתום על כפתור "שיעור חי".
   - timelineHtml(s): כל האירועים של תלמיד, מהחדש לישן.
   - soundButton(): כפתור להפעלה/כיבוי של ההתראות הקופצות והצליל (נשמר במכשיר).
   הנתונים מגיעים מ-presenceList בסקריפט (apps-script/Code.gs).
   ============================================================ */
(function(){
  "use strict";
  if(window.BM_LIVEMON) return;
  var SOUND_KEY = "bm-live-alerts";   /* "1" = התראות קופצות וצליל פועלים */
  var prev = {};          /* קוד שיעור -> { sid -> {status, pastes} } */
  var flashTimer = null, baseTitle = document.title, unseen = 0;
  var audio = null;

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function pad(n){ return String(n).padStart(2, "0"); }
  function clock(t){ var d = new Date(t); return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }
  function dur(sec){
    sec = Math.max(0, Math.round(sec || 0));
    if(sec < 60) return sec + " שנ׳";
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + pad(s) + " דק׳";
  }
  function whyText(w){ return w === "blur" ? "חלון אחר" : (w === "split" ? "מסך מפוצל" : "יצא מהדף"); }
  function pageName(p){
    if(!p) return "";
    if(p === "index.html") return "דף הבית";
    var T = window.BM_TASKS, w = T ? T.findByPage(p) : null;
    if(w) return w.topic ? w.topic.title : w.unit.title;
    var u = (window.BM_UNITS || []).filter(function(x){ return x.url === p; })[0];   /* גם דפים של המורה, כמו המבחן */
    return u ? u.title : p;
  }

  function soundOn(){ try{ return localStorage.getItem(SOUND_KEY) === "1"; }catch(e){ return false; } }
  function beep(kind){
    if(!soundOn()) return;
    try{
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if(audio.state === "suspended") audio.resume();
      var now = audio.currentTime;
      var tones = kind === "paste" ? [660, 990] : (kind === "gone" ? [440] : (kind === "help" ? [523, 784] : [880, 660, 880]));
      tones.forEach(function(f, i){
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + i * 0.16);
        g.gain.exponentialRampToValueAtTime(0.25, now + i * 0.16 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 0.14);
        o.connect(g); g.connect(audio.destination);
        o.start(now + i * 0.16); o.stop(now + i * 0.16 + 0.15);
      });
    }catch(e){ /* בלי צליל */ }
  }
  /* הדפדפן מאפשר צליל רק אחרי לחיצה של המשתמש - מכינים את הצליל בלחיצה הראשונה */
  document.addEventListener("click", function once(){
    document.removeEventListener("click", once, true);
    try{ audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if(audio.state === "suspended") audio.resume(); }catch(e){}
  }, true);

  function injectStyle(){
    if(document.getElementById("bmLiveMonCss")) return;
    var st = document.createElement("style");
    st.id = "bmLiveMonCss";
    st.textContent =
      ".bm-lmon-stack{position:fixed;top:12px;left:12px;z-index:10050;display:flex;flex-direction:column;gap:8px;max-width:min(360px,calc(100vw - 24px));direction:rtl}" +
      ".bm-lmon-toast{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:#fff;color:#0B2A5B;" +
      "border:2px solid #E8650C;box-shadow:0 10px 26px rgba(11,42,91,.25);font:600 15px/1.4 Heebo,Rubik,Arial,sans-serif}" +
      ".bm-lmon-toast.paste{border-color:#7A3FC4}.bm-lmon-toast.gone{border-color:#8A93A6}.bm-lmon-toast.help{border-color:#C2410C;background:#FFF4EA}" +
      ".bm-lmon-work{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;font-size:13px;line-height:1.35}" +
      ".bm-lmon-task{font-weight:600;color:#0B2A5B}.bm-lmon-tname{color:#56637A}" +
      ".bm-lmon-prog{display:inline-flex;align-items:center;gap:5px;font-variant-numeric:tabular-nums;color:#0B2A5B}" +
      ".bm-lmon-bar{display:inline-block;width:56px;height:7px;border-radius:999px;background:#E3E8F0;overflow:hidden}" +
      ".bm-lmon-bar i{display:block;height:100%;background:#1F8A5B;border-radius:999px}" +
      ".bm-lmon-idle{padding:1px 8px;border-radius:999px;background:#FFF1D6;color:#8A4B00;font-weight:600}" +
      ".bm-lmon-help{padding:1px 8px;border-radius:999px;background:#C2410C;color:#fff;font-weight:700;white-space:nowrap}" +
      ".bm-lmon-tl .help{color:#C2410C;font-weight:600}" +
      ".bm-lmon-toast small{display:block;font-weight:400;color:#56637A;font-size:13px}" +
      ".bm-lmon-toast button{margin-inline-start:auto;border:0;background:transparent;font-size:18px;cursor:pointer;color:#56637A;min-width:28px;min-height:28px}" +
      ".bm-lmon-tl{list-style:none;margin:0;padding:6px 0 2px;display:flex;flex-direction:column;gap:3px;font-size:13.5px}" +
      ".bm-lmon-tl li{display:flex;gap:8px;align-items:baseline}" +
      ".bm-lmon-tl time{font-variant-numeric:tabular-nums;color:#56637A;flex:none;direction:ltr}" +
      ".bm-lmon-tl .out{color:#A3470A;font-weight:600}.bm-lmon-tl .paste{color:#6A2FB4;font-weight:600}" +
      "@media print{.bm-lmon-stack{display:none}}";
    document.head.appendChild(st);
  }
  function stack(){
    var s = document.getElementById("bmLmonStack");
    if(!s){ injectStyle(); s = document.createElement("div"); s.id = "bmLmonStack"; s.className = "bm-lmon-stack"; s.setAttribute("role", "alert"); document.body.appendChild(s); }
    return s;
  }
  function toast(kind, title, sub){
    if(!soundOn()) return;   /* התראות כבויות - רק הטבלה והמספר על הכפתור */
    var t = document.createElement("div");
    t.className = "bm-lmon-toast " + kind;
    t.innerHTML = '<div>' + esc(title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div><button type="button" aria-label="סגירה">✕</button>';
    t.querySelector("button").addEventListener("click", function(){ t.remove(); });
    var s = stack();
    s.insertBefore(t, s.firstChild);
    while(s.children.length > 6) s.lastChild.remove();
    setTimeout(function(){ t.remove(); }, 15000);
    beep(kind);
    flashTitle();
  }
  function flashTitle(){
    if(document.visibilityState === "visible" && document.hasFocus()) return;
    unseen++;
    if(flashTimer) return;
    var on = false;
    flashTimer = setInterval(function(){
      on = !on;
      document.title = on ? "🟠 (" + unseen + ") בקרת שיעור" : baseTitle;
    }, 1000);
  }
  function stopFlash(){
    if(flashTimer){ clearInterval(flashTimer); flashTimer = null; document.title = baseTitle; }
    unseen = 0;
  }
  window.addEventListener("focus", stopFlash);
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "visible") stopFlash(); });

  /* res - התשובה של presenceList. ברענון הראשון רק זוכרים, בלי התראות */
  function watch(res){
    if(!res || !res.lesson) return;
    var code = res.lesson.code, before = prev[code], now = {};
    (res.students || []).forEach(function(s){
      var id = s.sid || s.name;
      now[id] = { status:s.status, pastes:s.pastes || 0, dups:s.dups || 0, help:(s.help >= 0) };
      if(!before) return;
      var b = before[id];
      var name = s.name || "ללא שם";
      if(s.status === "out" && (!b || b.status !== "out"))
        toast("out", "🟠 " + name + " - " + whyText(s.outWhy), "יצא ב-" + clock(s.outSince || Date.now()) + " · יציאה מספר " + ((s.leaves || 0) + 1));
      if(b && (s.pastes || 0) > b.pastes){
        var last = (s.ev || []).filter(function(e){ return e.k === "paste"; }).pop();
        toast("paste", "📋 " + name + " הדביק/ה טקסט", (last && last.len ? last.len + " תווים · " : "") + (pageName(last && last.page || s.page) || ""));
      }
      if(s.help >= 0 && (!b || !b.help))
        toast("help", "✋ " + name + " מבקש/ת עזרה", (s.tasks && s.task ? "משימה " + s.task + " מתוך " + s.tasks + " · " : "") + (pageName(s.page) || ""));
      if(b && (s.dups || 0) > (b.dups || 0))
        toast("paste", "⚠ ניסו להיכנס בשם " + name, "ממכשיר אחר - הכניסה נחסמה");
      if(s.status === "kicked") return;
      if(s.status === "gone" && b && b.status === "in")
        toast("gone", "⚪ " + name + " התנתק/ה", "המכשיר לא מדווח יותר מדקה");
    });
    prev[code] = now;
  }

  function timelineHtml(s){
    var ev = (s.ev || []).slice().reverse();
    if(s.status === "out" && s.outSince) ev.unshift({ k:"outnow", at:s.outSince, why:s.outWhy });
    if(!ev.length) return '<p class="bm-lmon-empty">אין אירועים עדיין.</p>';
    return '<ul class="bm-lmon-tl">' + ev.map(function(e){
      var txt, cls = "";
      if(e.k === "outnow"){ cls = "out"; txt = "🟠 " + whyText(e.why) + " - עדיין בחוץ (" + dur(s.outFor) + ")"; }
      else if(e.k === "out"){ cls = "out"; txt = "🟠 " + whyText(e.why) + " · חזר/ה אחרי " + dur(e.sec); }
      else if(e.k === "paste"){ cls = "paste"; txt = "📋 הדביק/ה טקסט" + (e.len ? " (" + e.len + " תווים)" : "") + (e.page ? " · " + pageName(e.page) : ""); }
      else if(e.k === "join") txt = "🟢 נכנס/ה לשיעור" + (e.page ? " · " + pageName(e.page) : "");
      else if(e.k === "page") txt = "↪ עבר/ה לדף: " + pageName(e.page);
      else if(e.k === "bye") txt = "יצא/ה ממצב שיעור (לחץ/ה \"יציאה\")";
      else if(e.k === "kick"){ cls = "out"; txt = "🚫 המורה הוציא/ה מהשיעור"; }
      else if(e.k === "unkick") txt = "↩ המורה החזיר/ה לשיעור";
      else if(e.k === "help"){ cls = "help"; txt = "✋ ביקש/ה עזרה"; }
      else if(e.k === "helpOff") txt = "✋ ביטל/ה את בקשת העזרה";
      else if(e.k === "helpAck") txt = "👍 המורה סימן/ה שטיפל/ה בבקשת העזרה";
      else if(e.k === "dup"){ cls = "paste"; txt = "⚠ מישהו ניסה להיכנס בשם הזה ממכשיר אחר - הכניסה נחסמה"; }
      else txt = e.k;
      return '<li><time>' + clock(e.at) + '</time><span class="' + cls + '">' + esc(txt) + '</span></li>';
    }).join("") + '</ul>';
  }

  /* מה התלמיד עושה בדף: משימה X מתוך Y, כמה תשובות כתב, ו"💤 בלי כתיבה" אחרי 3 דקות.
     הנתונים מגיעים מהתלמיד בכל דיווח (assets/lesson-mode.js), דרך presenceList בשרת. */
  var IDLE_SEC = 180;
  function isIdle(s){ return s.status === "in" && s.fields > 0 && s.idle >= IDLE_SEC; }
  function workHtml(s){
    if(s.status === "kicked" || s.status === "bye") return "";
    var out = [];
    if(s.tasks > 0) out.push('<span class="bm-lmon-task">' + (s.task ? "משימה " + s.task + "/" + s.tasks : "כל השאלות") + '</span>' +
      (s.taskName && s.task ? ' <span class="bm-lmon-tname">' + esc(s.taskName) + '</span>' : ''));
    if(s.fields > 0){
      var pct = Math.round(Math.min(1, (s.ans || 0) / s.fields) * 100);
      out.push('<span class="bm-lmon-prog" title="תיבות תשובה שכתב/ה בדף הזה"><span class="bm-lmon-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span>✍️ ' + (s.ans || 0) + '/' + s.fields + '</span>');
    }
    if(isIdle(s)) out.push('<span class="bm-lmon-idle" title="לא כתב/ה ולא עבר/ה משימה">💤 ' + Math.floor(s.idle / 60) + ' דק׳ בלי כתיבה</span>');
    return out.length ? '<span class="bm-lmon-work">' + out.join("") + '</span>' : '';
  }
  function helpBadge(s){
    return s.help >= 0 ? '<span class="bm-lmon-help">✋ מבקש/ת עזרה · ' + dur(s.help) + '</span>' : '';
  }

  function soundButton(){
    var b = document.createElement("button");
    b.type = "button";
    function paint(){
      b.textContent = soundOn() ? "🔔 התראות קופצות וצליל: פועל" : "🔕 התראות קופצות וצליל: כבוי";
      b.title = "כשהמסך מוקרן לכיתה - עדיף כבוי. המצב של כל תלמיד מופיע בכל מקרה ברשימה.";
      b.setAttribute("aria-pressed", String(soundOn()));
    }
    b.addEventListener("click", function(){
      try{ localStorage.setItem(SOUND_KEY, soundOn() ? "0" : "1"); }catch(e){}
      if(!soundOn()){ var st = document.getElementById("bmLmonStack"); if(st) st.innerHTML = ""; stopFlash(); }
      paint();
      if(soundOn()) beep("out");
    });
    paint();
    return b;
  }

  window.BM_LIVEMON = { watch:watch, timelineHtml:timelineHtml, soundButton:soundButton, dur:dur, clock:clock, whyText:whyText, esc:esc,
                        workHtml:workHtml, helpBadge:helpBadge, isIdle:isIdle, injectStyle:injectStyle };
})();
