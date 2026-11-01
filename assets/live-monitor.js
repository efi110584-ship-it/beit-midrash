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
      ".bm-lcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin:8px 0 6px}" +
      ".bm-lcard{display:flex;flex-direction:column;gap:6px;min-width:0;padding:12px;border:1px solid #DCE4F1;border-top:5px solid #1F8A5B;border-radius:14px;background:#fff;color:#0E1B33;cursor:pointer;text-align:right}" +
      ".bm-lcard:hover{box-shadow:0 6px 16px rgba(20,34,59,.1)}" +
      ".bm-lcard:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      ".bm-lcard.is-open{grid-column:1/-1;cursor:default}" +
      ".bm-lc-nm{font-weight:800;overflow-wrap:anywhere}" +
      ".bm-lc-tk{font-size:.84rem;color:#56637A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".bm-lc-bar{display:block;height:6px;border-radius:999px;background:#E3E8F0;overflow:hidden}.bm-lc-bar i{display:block;height:100%;background:#1F8A5B;border-radius:999px}" +
      ".bm-lc-st{font-size:.82rem;font-weight:700;color:#1F8A5B}" +
      ".bm-lc-pg{font-size:.78rem;color:#8A4B00}" +
      ".bm-lc-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}" +
      ".bm-lcard.is-help{border-top-color:#C2410C;background:#FFF0EA;box-shadow:0 0 0 3px rgba(194,65,12,.22)}.bm-lcard.is-help .bm-lc-st{color:#C2410C}" +
      ".bm-lcard.is-out{border-top-color:#E8650C;background:#FFF7F0}.bm-lcard.is-out .bm-lc-st{color:#A3470A}" +
      ".bm-lcard.is-idle{border-top-color:#D9A93A;background:#FFFBEF}.bm-lcard.is-idle .bm-lc-st{color:#8A5B00}" +
      ".bm-lcard.is-gone{border-top-color:#AEB5C2;background:#F6F7F9}.bm-lcard.is-gone .bm-lc-st{color:#56637A}.bm-lcard.is-gone:not(.is-open){opacity:.75}" +
      ".bm-lcard.is-done .bm-lc-bar i{background:#1F5FBF}" +
      "@media (prefers-reduced-motion: no-preference){.bm-lcard.is-help{animation:bmLcPulse 2.4s ease-in-out infinite}}" +
      "@keyframes bmLcPulse{0%,100%{box-shadow:0 0 0 3px rgba(194,65,12,.22)}50%{box-shadow:0 0 0 6px rgba(194,65,12,.12)}}" +
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
  /* כרטיסי תלמידים בשיעור חי (במקום טבלה): צבע לפי מצב - ✋ עזרה, 🟠 מחוץ לדף, 💤 תקוע, ירוק עובד, אפור לא מחובר.
     open = { sid:1 } - כרטיסים פתוחים (ציר זמן וכפתורים). navPage - הדף שהכיתה נשלחה אליו (כדי לסמן מי בדף אחר). */
  function cardsHtml(list, open, navPage, btnClass){
    btnClass = btnClass || "";
    /* סדר: ✋ עזרה (מי שמחכה הכי הרבה ראשון) · 🟠 מחוץ לדף · 💤 תקוע · עובדים · לא מחוברים בסוף */
    function rank(s){ return s.status === "kicked" ? 6 : s.status === "bye" ? 5 : s.status === "gone" ? 4 : s.help >= 0 ? 0 : s.status === "out" ? 1 : isIdle(s) ? 2 : 3; }
    list = list.slice().sort(function(a, b){ return (rank(a) - rank(b)) || ((b.help || 0) - (a.help || 0)) || String(a.name).localeCompare(String(b.name), "he"); });
    return '<div class="bm-lcards" role="list">' + list.map(function(s){
      var sid = s.sid || s.name || "", isOpen = !!(open && open[sid]);
      var cls = s.status === "kicked" || s.status === "bye" || s.status === "gone" ? "is-gone"
        : s.help >= 0 ? "is-help" : s.status === "out" ? "is-out" : isIdle(s) ? "is-idle" : "";
      var done = s.fields > 0 && s.ans >= s.fields;
      if(done) cls += " is-done";
      var st = s.status === "kicked" ? "🚫 הוצא/ה מהשיעור" : s.status === "bye" ? "יצא/ה ממצב שיעור" : s.status === "gone" ? "⚪ לא מחובר/ת"
        : s.help >= 0 ? "✋ מבקש/ת עזרה · " + dur(s.help)
        : s.status === "out" ? "🟠 " + whyText(s.outWhy) + " · " + dur(s.outFor)
        : isIdle(s) ? "💤 " + Math.floor(s.idle / 60) + " דק׳ בלי כתיבה"
        : done ? "✓ סיים/ה את כל התשובות"
        : s.fields > 0 ? "✍️ " + (s.ans || 0) + "/" + s.fields + " תשובות" : "🟢 בדף";
      var pct = s.fields > 0 ? Math.round(Math.min(1, (s.ans || 0) / s.fields) * 100) : (s.tasks > 0 && s.task ? Math.round(s.task / s.tasks * 100) : 0);
      var tk = s.tasks > 0 ? (s.task ? "משימה " + s.task + "/" + s.tasks + (s.taskName ? " · " + s.taskName : "") : "כל השאלות") : (pageName(s.page) || "-");
      var other = navPage && s.page && s.page !== navPage && s.status !== "gone" && s.status !== "bye" ? '<span class="bm-lc-pg">📍 בדף אחר: ' + esc(pageName(s.page)) + '</span>' : "";
      return '<div class="bm-lcard ' + cls + (isOpen ? ' is-open' : '') + '" role="listitem"><div data-sid="' + esc(sid) + '" role="button" tabindex="0" aria-expanded="' + isOpen + '" style="display:flex;flex-direction:column;gap:6px;outline:0">' +
        '<span class="bm-lc-nm">' + (s.help >= 0 ? "✋ " : "") + esc(s.name || "ללא שם") + (s.dups ? ' <span title="ניסו להיכנס בשם הזה ממכשיר אחר">⚠</span>' : '') + '</span>' +
        '<span class="bm-lc-tk" title="' + esc(tk) + '">' + esc(tk) + '</span>' +
        '<span class="bm-lc-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
        '<span class="bm-lc-st">' + esc(st) + '</span>' + other + '</div>' +
        (isOpen ? '<div class="bm-lc-acts">' +
          (s.help >= 0 ? '<button type="button" class="' + btnClass + '" data-help-done="' + esc(s.sid) + '">✓ טיפלתי בבקשה</button>' : '') +
          '<button type="button" class="' + btnClass + '" data-kick="' + esc(s.sid) + '"' + (s.kicked ? ' data-undo="1"' : '') + ' data-name="' + esc(s.name || "") + '">' + (s.kicked ? "↩ החזרה לשיעור" : "🚫 הוצאה מהשיעור") + '</button></div>' +
          '<div style="font-size:.85rem;color:#56637A">' + (s.leaves || 0) + ' יציאות' + (s.outTotal ? ' · ' + dur(s.outTotal) + ' בחוץ' : '') + (s.pastes ? ' · 📋 ' + s.pastes + ' הדבקות' : '') + '</div>' +
          timelineHtml(s) : '') +
        '</div>';
    }).join("") + '</div>';
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
                        workHtml:workHtml, helpBadge:helpBadge, isIdle:isIdle, injectStyle:injectStyle, cardsHtml:cardsHtml, pageName:pageName };
})();
