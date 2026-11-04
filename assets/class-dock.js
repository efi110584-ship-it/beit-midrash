/* ============================================================
   סרגל הכלים בצד המסך - בכל דף באתר
   ============================================================
   מורה (נכנס לאזור האישי באותה לשונית): הסרגל תמיד גלוי, עם
     ❓ לוח שיתופי · ☁️ ענן מילים · 🗳️ הצבעה · 📋 סקר · 👥 שיעור חי
     לחיצה פותחת חלון בצד המסך - הדף נשאר פתוח מאחור.
   תלמיד: הסרגל מופיע רק כשהמורה פתח משהו (לוח או פעילות), עם הודעה
     קטנה. לחיצה על האייקון פותחת את הכלי בחלון בצד.
   מה פתוח עכשיו - נבדק בסקריפט (dockState) כל כמה שניות.
   כל לוח ופעילות שייכים לקוד של שיעור (assets/bm-api.js - BM_ROOM / BM_TEACHER_ROOM):
     תלמיד רואה את מה שנפתח לקוד שהקליד, ומורה מנהל את מה שנפתח לכיתה שבחר.
   הרכיבים עצמם נטענים רק כשצריך:
     assets/question-board.js · assets/live-widget.js · assets/live-teacher.js · assets/live-render.js
   ============================================================ */
(function(){
  "use strict";
  if(window.BM_DOCK) return;
  window.BM_DOCK = true;
  var API = window.BM_API_URL;
  var page = location.pathname.split("/").pop() || "index.html";
  if(!API || page === "screen.html") return;
  /* "איך התלמידים רואים" - תצוגת תלמיד נקייה, בלי סרגל המורה */
  if(page === "live.html" && /[?&]preview=1(&|$)/.test(location.search)) return;
  /* תלמיד שמחובר ל"האזור האישי שלי" (my.html): השם בדפי העבודה נלקח מרשימת הכיתה,
     כדי שכל עבודה תגיע לתיקייה שלו ותופיע אצלו באזור האישי. */
  (function(){
    var me = null;
    try{ me = JSON.parse(localStorage.getItem("bm-student") || "null"); }catch(e){}
    var el = document.getElementById("studentName");
    if(!me || !me.name || !el) return;
    function fill(){
      if(el.value !== me.name){
        el.value = me.name;
        el.dispatchEvent(new Event("input", { bubbles:true }));
        el.dispatchEvent(new Event("change", { bubbles:true }));
      }
      el.readOnly = true;
      el.title = "השם נלקח מהאזור האישי שלך";
    }
    fill();
    window.addEventListener("load", fill);
    /* גם הכיתה: כל התלמידים ברשימת י"א הם מ-י"א 4, וברשימת י"ב מ-י"ב 2.
       אם קבוצה משתנה - מעדכנים כאן (חשוב: לפי המספר העבודה מגיעה למורה הנכון). */
    var GROUP = { "יא": ["י\"א 4", "יא4"], "יב": ["י\"ב 2", "יב2"] };
    var ce = document.getElementById("studentClass"), g = GROUP[me.cls];
    if(!ce || !g) return;
    function fillCls(){
      var v = g[0];
      if(ce.tagName === "SELECT"){
        var opt = [].filter.call(ce.options, function(o){ return o.value === g[1]; })[0] ||
                  [].filter.call(ce.options, function(o){ return o.value === me.cls; })[0];
        if(!opt) return;
        v = opt.value;
      }
      if(ce.value !== v){
        ce.value = v;
        ce.dispatchEvent(new Event("input", { bubbles:true }));
        ce.dispatchEvent(new Event("change", { bubbles:true }));
      }
      if(ce.tagName === "SELECT") ce.style.pointerEvents = "none"; else ce.readOnly = true;
      ce.title = "הכיתה נלקחה מהאזור האישי שלך";
    }
    fillCls();
    window.addEventListener("load", fillCls);
  })();
  /* תלמיד מחובר: ההתקדמות בדף (אחוז המשימות שהושלמו ותשובות שנכתבו) נשמרת בשרת,
     ומופיעה אצלו באזור האישי מכל מכשיר. נשלח רק כשמשהו השתנה, ולא יותר מפעם ב-30 שניות. */
  (function(){
    var me = null;
    try{ me = JSON.parse(localStorage.getItem("bm-student") || "null"); }catch(e){}
    if(!me || !me.tok) return;
    var last = "", lastAt = 0, timer = null;
    function measure(){
      var f = document.querySelectorAll("textarea.answer"), ans = 0;
      for(var i = 0; i < f.length; i++){ if(String(f[i].value || "").trim().length >= 2) ans++; }
      if(!f.length) return null;
      var S = window.BeitMidrashSteps, pct = Math.round(ans / f.length * 100);
      try{ if(S && S.requiredPercent) pct = S.requiredPercent(); }catch(e){}
      return { pct:pct, ans:ans, fields:f.length };
    }
    function send(now){
      var m = measure();
      if(!m) return;
      var sig = m.pct + "|" + m.ans + "|" + m.fields;
      if(sig === last) return;
      var wait = 30000 - (Date.now() - lastAt);
      if(!now && wait > 0){ clearTimeout(timer); timer = setTimeout(function(){ send(true); }, wait); return; }
      last = sig; lastAt = Date.now();
      try{
        fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, keepalive:true,
          body:JSON.stringify({ action:"studentProgress", tok:me.tok, page:page, pct:m.pct, ans:m.ans, fields:m.fields }) })
          .then(function(r){ return r.json(); })
          .then(function(res){ if(res && res.login){ try{ localStorage.removeItem("bm-student"); }catch(e){} } })
          .catch(function(){ last = ""; });
      }catch(e){}
    }
    var typing = null;
    document.addEventListener("input", function(){ clearTimeout(typing); typing = setTimeout(function(){ send(false); }, 4000); }, true);
    document.addEventListener("bm-steps-change", function(){ send(false); });
    document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "hidden") send(true); });
    window.addEventListener("pagehide", function(){ send(true); });
    setTimeout(function(){ send(true); }, 2500);   /* כניסה לדף - גם דף שעוד לא התחילו (0%) נרשם כ"נפתח" */
  })();

  var BASE = (function(){
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^\/]*$/, "") : "assets/";
  })();
  var POLL_MS = 15000;
  var SEEN_KEY = "bm-dock-seen";

  function token(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  // Shared teacher controls load on the home page too, including after teacher login.
  var quickScript = document.createElement("script");
  quickScript.src = BASE + "lesson-quick.js?v=20261024-1";
  document.head.appendChild(quickScript);
  var isTeacher = !!token();
  /* פרטים שמיועדים רק למורה (למשל תוויות מיקוד הבגרות) - מוצגים רק כשהמורה מחובר */
  try{ if(isTeacher || sessionStorage.getItem("teacherAreaUnlocked") === "1") document.documentElement.classList.add("bm-teacher-view"); }catch(e){}
  if(isTeacher && page === "index.html") return;   /* בדף הבית יש למורה את האזור האישי */

  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  }
  function get(params){ return fetch(API + "?" + new URLSearchParams(params).toString()).then(function(r){ return r.json(); }); }
  function post(body){
    body.password = token();
    return fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body) }).then(function(r){ return r.json(); });
  }
  var loading = {};
  function need(names){
    return Promise.all(names.map(function(n){
      var globals = { "live-render":"BM_LIVE", "live-widget":"BM_LIVEWIDGET", "live-teacher":"BM_LIVETEACHER", "question-board":"BM_QBOARD", "live-monitor":"BM_LIVEMON" };
      if(window[globals[n]]) return Promise.resolve();
      if(!loading[n]) loading[n] = new Promise(function(ok, fail){
        var s = document.createElement("script");
        s.src = BASE + n + ".js?v=20261101-3";
        s.onload = ok; s.onerror = fail;
        document.head.appendChild(s);
      });
      return loading[n];
    }));
  }

  /* ---------- עיצוב ---------- */
  var css =
    /* הסרגל: כפתור אחד 🧰 בפינה השמאלית התחתונה (מעל כפתור "חזרה למעלה"). לחיצה פותחת מעליו את הכלים.
       אצל תלמיד (כשיש פעילות) - הכלים מוצגים ישר, בלי הכפתור. */
    ".bmd{position:fixed;inset-inline-end:16px;bottom:80px;z-index:9990;display:flex;flex-direction:column-reverse;align-items:center;gap:6px;padding:6px;" +
      "background:#0B2A5B;border-radius:18px;box-shadow:0 8px 24px rgba(11,42,91,.3);font-family:Heebo,Rubik,Arial,sans-serif;direction:rtl}" +
    ".bmd-i{display:flex;flex-direction:column;align-items:center;gap:2px}" +
    ".bmd-i:has(> .bmd-b[hidden]){display:none}" +
    ".bmd.is-t:not(.is-open) .bmd-i,.bmd.is-t:not(.is-open) .bmd-role{display:none}" +
    ".bmd-tog{font-size:25px}" +
    ".bmd.is-open .bmd-tog{background:rgba(255,255,255,.22)}" +
    ".bmd[hidden]{display:none}" +
    ".bmd-role{font-size:10px;color:#FFD9B8;font-weight:700}" +
    ".bmd-b{position:relative;width:50px;height:50px;border:0;border-radius:12px;background:rgba(255,255,255,.1);color:#fff;font-size:23px;line-height:1;cursor:pointer;display:grid;place-items:center}" +
    ".bmd-b:hover{background:rgba(255,255,255,.2)}" +
    ".bmd-b[aria-expanded=true]{background:#FF7A1A}" +
    ".bmd-b:focus-visible{outline:3px solid #FFD9B8;outline-offset:2px}" +
    ".bmd-b[hidden]{display:none}" +
    ".bmd-cnt{position:absolute;top:-4px;left:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#FF7A1A;color:#fff;font:700 12px/20px Heebo,Rubik,Arial,sans-serif;text-align:center}.bmd-cnt[hidden]{display:none}" +
    ".bmd-dot{position:absolute;top:5px;left:5px;width:10px;height:10px;border-radius:50%;background:#2BD38C;box-shadow:0 0 0 3px rgba(43,211,140,.35)}" +
    ".bmd-dot[hidden]{display:none}" +
    ".bmd-lbl{font-size:10px;color:#fff;opacity:.85;white-space:nowrap}" +
    ".bmd-lbl[hidden]{display:none}" +
    ".bmd-p{position:fixed;inset-inline-end:92px;top:12px;bottom:12px;width:min(440px, calc(100vw - 110px));z-index:9991;background:#fff;border-radius:18px;" +
      "box-shadow:0 18px 50px rgba(11,42,91,.32);display:flex;flex-direction:column;overflow:hidden;font-family:Heebo,Rubik,Arial,sans-serif;direction:rtl;color:#0E1B33;text-align:right}" +
    ".bmd-p[hidden]{display:none}" +
    ".bmd-ph{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#F4F7FC;border-bottom:1px solid #DCE4F1}" +
    ".bmd-ph h2{flex:1;margin:0;font-size:1.1rem;color:#123A78;line-height:1.3;font-family:inherit}" +
    ".bmd-x{flex:none;width:40px;height:40px;border:0;border-radius:10px;background:transparent;font-size:20px;cursor:pointer;color:#0E1B33}" +
    ".bmd-x:hover{background:#E3EBF7}.bmd-x:focus-visible{outline:3px solid #FF7A1A}" +
    ".bmd-pb{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:12px;font-size:16px;line-height:1.5}" +
    ".bmd-ctl{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid #DCE4F1;border-radius:14px;background:#FBFCFE}" +
    ".bmd-on{display:flex;align-items:center;gap:8px;margin:0;padding:8px 10px;border-radius:10px;background:#DDF3EA;color:#0A6B4C;font-weight:700}" +
    ".bmd-on::before{content:'';width:10px;height:10px;border-radius:50%;background:#0D8A63;flex:none}" +
    ".bmd-in{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #9FB3D6;border-radius:10px;font:inherit;color:#0E1B33;background:#fff}" +
    ".bmd-btns{display:flex;flex-wrap:wrap;gap:6px}" +
    ".bmd-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:7px 14px;border:1px solid #DCE4F1;border-radius:10px;background:#fff;color:#123A78;font:inherit;font-weight:700;font-size:.92rem;cursor:pointer;text-decoration:none}" +
    ".bmd-btn:hover{background:#F4F7FC}.bmd-btn:disabled{opacity:.6}" +
    ".bmd-btn--primary{background:#123A78;border-color:#123A78;color:#fff}.bmd-btn--primary:hover{background:#0B2A5B}" +
    ".bmd-btn--warn{color:#8A3D07}" +
    ".bmd-btn:focus-visible,.bmd-in:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
    ".bmd-label{font-weight:700;font-size:.92rem}" +
    ".bmd-note{margin:0;font-size:.88rem;color:#4E5B72}" +
    ".bmd-msg{margin:0;font-size:.92rem;color:#8A3D07}.bmd-msg:empty{display:none}" +
    ".bmd-old{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}" +
    ".bmd-old li{display:flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid #E3EAF5;border-radius:10px}" +
    ".bmd-old span{flex:1;font-size:.92rem;min-width:0;overflow-wrap:anywhere}" +
    ".bmd-old small{display:block;color:#56637A;font-size:.78rem}" +
    ".bmd-pres{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}" +
    ".bmd-pres li{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;background:#F7F9FD}" +
    ".bmd-pres li.is-out{background:#FFF1E6}" +
    ".bmd-pres b{flex:1}.bmd-pres small{color:#56637A}" +
    ".bmd-t{position:fixed;inset-inline-end:92px;bottom:80px;z-index:9992;max-width:min(320px, calc(100vw - 110px));display:flex;align-items:center;gap:8px;" +
      "padding:10px 14px;border:0;border-radius:12px;background:#B42318;color:#fff;font:700 15px/1.35 Heebo,Rubik,Arial,sans-serif;direction:rtl;text-align:right;cursor:pointer;box-shadow:0 10px 26px rgba(180,35,24,.35)}" +
    ".bmd-t[hidden]{display:none}" +
    ".bmd-cb{position:fixed;inset-inline-start:16px;bottom:76px;z-index:9990;width:58px;height:58px;border:0;border-radius:50%;background:#123A78;color:#fff;font-size:27px;line-height:1;" +
      "cursor:pointer;display:grid;place-items:center;box-shadow:0 8px 20px rgba(11,42,91,.35)}" +
    ".bmd-cb[hidden]{display:none}.bmd-cb:hover{background:#0B2A5B}.bmd-cb.is-on{background:#0D8A63}" +
    ".bmd-cb:focus-visible{outline:3px solid #FF7A1A;outline-offset:3px}" +
    ".bmd-cb-n{position:absolute;top:-4px;inset-inline-end:-4px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#FF7A1A;color:#fff;font:700 13px/22px Heebo,Rubik,Arial,sans-serif}" +
    ".bmd-cb-n[hidden]{display:none}" +
    ".bmd-cp{position:fixed;inset-inline-start:16px;bottom:146px;z-index:9991;width:min(380px, calc(100vw - 32px));max-height:min(70vh, 560px);background:#fff;border-radius:18px;" +
      "box-shadow:0 18px 50px rgba(11,42,91,.32);display:flex;flex-direction:column;overflow:hidden;font-family:Heebo,Rubik,Arial,sans-serif;direction:rtl;color:#0E1B33;text-align:right}" +
    ".bmd-cp[hidden]{display:none}" +
    ".bmd-cp .bmd-ph h2{flex:1;margin:0;font-size:1.05rem;color:#123A78}" +
    "@media (max-width:760px){.bmd-cb{bottom:140px}.bmd-cp{bottom:208px}}" +
    "@media (max-width:600px){" +
      ".bmd{padding:5px;gap:4px;inset-inline-end:8px}.bmd-b{width:42px;height:42px;font-size:20px}.bmd-lbl{display:none}" +
      ".bmd-p{inset:auto 8px 8px 8px;top:10%;width:auto}" +
      ".bmd-t{inset-inline-end:60px}" +
    "}" +
    "@media print{.bmd,.bmd-p,.bmd-t,.bmd-cb,.bmd-cp{display:none !important}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- מבנה ---------- */
  var TOOLS = [
    { id:"board",  ico:"❓", label:"לוח",       title:"לוח שיתופי" },
    { id:"cloud",  ico:"☁️", label:"ענן",       title:"ענן מילים" },
    { id:"poll",   ico:"🗳️", label:"הצבעה",     title:"הצבעה על דילמה" },
    { id:"survey", ico:"📋", label:"סקר",       title:"סקר" },
    { id:"live",   ico:"👥", label:"שיעור חי",  title:"שיעור חי - מי בדף" }
  ];
  var dock = document.createElement("nav");
  dock.className = "bmd" + (isTeacher ? " is-t" : "");
  dock.setAttribute("aria-label", "כלים לשיעור");
  dock.hidden = !isTeacher;
  dock.innerHTML = (isTeacher ? '<button type="button" class="bmd-b bmd-tog" aria-expanded="false" title="כלים לשיעור" aria-label="כלים לשיעור"><span aria-hidden="true">🧰</span><span class="bmd-cnt bmd-tog-cnt" hidden></span></button>' : '') + TOOLS.map(function(t){
    return '<span class="bmd-i"><button type="button" class="bmd-b" data-tool="' + t.id + '" aria-expanded="false" aria-controls="bmdPanel" title="' + t.title + '"' + (isTeacher ? '' : ' hidden') + '>' +
      '<span aria-hidden="true">' + t.ico + '</span><span class="bmd-dot" hidden></span>' + (t.id === "live" ? '<span class="bmd-cnt" hidden></span>' : '') + '<span class="vh" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">' + t.title + '</span></button>' +
      '<span class="bmd-lbl" data-lbl="' + t.id + '"' + (isTeacher ? '' : ' hidden') + ' aria-hidden="true">' + t.label + '</span></span>';
  }).join(""); + (isTeacher ? '<span class="bmd-role">מורה</span>' : '');
  /* 🧰 פתיחה וסגירה של הכלים (אצל המורה). נזכר במכשיר */
  var togBtn = dock.querySelector(".bmd-tog");
  function dockOpen(on){
    dock.classList.toggle("is-open", on);
    if(togBtn) togBtn.setAttribute("aria-expanded", String(on));
    try{ localStorage.setItem("bmd-open", on ? "1" : ""); }catch(e){}
  }
  if(togBtn){
    var wasOpen = false; try{ wasOpen = localStorage.getItem("bmd-open") === "1"; }catch(e){}
    dockOpen(wasOpen);
    togBtn.addEventListener("click", function(e){ e.stopPropagation(); dockOpen(!dock.classList.contains("is-open")); });
  }
  var panel = document.createElement("section");
  panel.className = "bmd-p";
  panel.id = "bmdPanel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "bmdTitle");
  panel.innerHTML = '<div class="bmd-ph"><span aria-hidden="true" id="bmdIco"></span><h2 id="bmdTitle" tabindex="-1"></h2>' +
    '<button type="button" class="bmd-x" aria-label="סגירת החלון">✕</button></div><div class="bmd-pb" id="bmdBody"></div>';
  var toast = document.createElement("button");
  toast.type = "button";
  toast.className = "bmd-t";
  toast.hidden = true;
  function mountUi(){
    document.body.appendChild(dock);
    document.body.appendChild(panel);
    document.body.appendChild(toast);
  }
  if(document.body) mountUi(); else document.addEventListener("DOMContentLoaded", mountUi);

  var body = panel.querySelector("#bmdBody");
  var titleEl = panel.querySelector("#bmdTitle");
  var icoEl = panel.querySelector("#bmdIco");
  var btn = function(id){ return dock.querySelector('[data-tool="' + id + '"]'); };

  /* ---------- מצב: מה פתוח עכשיו ---------- */
  var state = { board:null, activity:null };
  var openTool = null, widget = null, extraTimer = null, toastTimer = null;

  function readSeen(){ try{ return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); }catch(e){ return {}; } }
  function markSeen(kind, id){ var s = readSeen(); s[kind] = id; try{ localStorage.setItem(SEEN_KEY, JSON.stringify(s)); }catch(e){} }

  function actTool(){ return state.activity ? state.activity.type : null; }
  function applyState(){
    var at = actTool();
    TOOLS.forEach(function(t){
      var b = btn(t.id), lbl = dock.querySelector('[data-lbl="' + t.id + '"]');
      var active = t.id === "board" ? !!state.board : (t.id === at);
      b.querySelector(".bmd-dot").hidden = !active;
      if(!isTeacher){
        var show = active && !(t.id !== "board" && page === "live.html");
        b.hidden = !show; lbl.hidden = !show;
      }
    });
    if(!isTeacher) dock.hidden = !!token() /* המורה נכנס עכשיו לאזור האישי בדף הבית */ ||
      !Array.prototype.some.call(dock.querySelectorAll(".bmd-b"), function(b){ return !b.hidden; });
    /* תלמיד: הכלי שהיה פתוח נסגר אצל המורה */
    if(!isTeacher && openTool){
      if(openTool === "board" && (!state.board || state.board.id !== widgetKey)) closePanel();
      else if(openTool !== "board" && (!state.activity || state.activity.id !== widgetKey)) closePanel();
    }
    if(!isTeacher) notifyNew();
  }
  function notifyNew(){
    var seen = readSeen(), msg = null, tool = null;
    if(state.board && seen.board !== state.board.id && openTool !== "board"){ msg = "🔴 המורה פתח לוח שיתופי"; tool = "board"; }
    else if(state.activity && seen.act !== state.activity.id && openTool !== state.activity.type && page !== "live.html"){
      msg = "🔴 המורה פתח " + ({ cloud:"ענן מילים", poll:"הצבעה", survey:"סקר" }[state.activity.type] || "פעילות"); tool = state.activity.type;
    }
    if(!msg){ return; }
    toast.textContent = msg + " - לחצו כאן";
    toast.hidden = false;
    toast.onclick = function(){ toast.hidden = true; openPanel(tool); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.hidden = true; }, 9000);
    if(tool === "board") markSeen("board", state.board.id); else markSeen("act", state.activity.id);
  }
  function room(){
    if(isTeacher) return window.BM_TEACHER_ROOM ? window.BM_TEACHER_ROOM.get() : "";
    return window.BM_ROOM ? window.BM_ROOM() : "";
  }
  function poll(){
    var q = { action:"dockState", room:room() };
    if(isTeacher) q.exact = "1";   /* למורה - רק מה שפתוח לכיתה שבחר */
    return get(q).then(function(res){
      if(!res || !res.ok) return;
      state = { board:res.board || null, activity:res.activity || null };
      applyState();
    }).catch(function(){});
  }

  /* ---------- החלון ---------- */
  var widgetKey = null, lastFocus = null;
  function cleanup(){
    if(widget && widget.destroy) widget.destroy();
    widget = null; widgetKey = null;
    clearInterval(extraTimer); extraTimer = null;
    body.innerHTML = "";
  }
  function closePanel(){
    cleanup();
    panel.hidden = true;
    if(openTool){ var b = btn(openTool); b.setAttribute("aria-expanded", "false"); }
    openTool = null;
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openPanel(tool){
    if(openTool === tool){ closePanel(); return; }
    cleanup();
    if(openTool) btn(openTool).setAttribute("aria-expanded", "false");
    openTool = tool;
    lastFocus = btn(tool);
    btn(tool).setAttribute("aria-expanded", "true");
    var t = TOOLS.filter(function(x){ return x.id === tool; })[0];
    icoEl.textContent = t.ico;
    titleEl.textContent = t.title;
    panel.hidden = false;
    toast.hidden = true;
    body.innerHTML = '<p class="bmd-note">טוען…</p>';
    var p = isTeacher ? teacherPanel(tool) : studentPanel(tool);
    Promise.resolve(p).catch(function(){ body.innerHTML = '<p class="bmd-msg">לא הצלחנו לטעון. בדקו את החיבור לאינטרנט.</p>'; });
    titleEl.focus();
  }
  panel.querySelector(".bmd-x").addEventListener("click", closePanel);
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && !panel.hidden) closePanel(); });
  dock.addEventListener("click", function(e){
    var b = e.target.closest(".bmd-b"); if(!b) return;
    openPanel(b.getAttribute("data-tool"));
  });

  /* ---------- תלמיד ---------- */
  function studentPanel(tool){
    if(tool === "board"){
      if(!state.board) return;
      markSeen("board", state.board.id);
      titleEl.textContent = state.board.title;
      return need(["question-board"]).then(function(){
        body.innerHTML = '<div></div>';
        widgetKey = state.board.id;
        widget = window.BM_QBOARD.mount(body.firstChild, state.board.id, { intro:"כתבו שאלה או רעיון. כל הכיתה רואה את מה שנכתב." });
      });
    }
    if(!state.activity) return;
    markSeen("act", state.activity.id);
    return need(["live-render", "live-widget"]).then(function(){
      body.innerHTML = '<div></div>';
      widgetKey = state.activity.id;
      widget = window.BM_LIVEWIDGET.mount(body.firstChild, { compact:true });
    });
  }

  /* ---------- מורה ---------- */
  function authMsg(res){
    if(res && res.auth === false){ body.innerHTML = '<p class="bmd-msg">הסיסמה לא בתוקף. צריך להיכנס שוב לאזור האישי בדף הבית.</p>'; return true; }
    return false;
  }
  function pageTitle(){
    var h = document.querySelector("h1");
    var t = (h && h.textContent || document.title || "").replace(/\s+/g, " ").trim();
    return t.split("|")[0].replace(/^(דף עבודה|דף סיכום|תרגול)\s*[—–-]\s*/, "").trim().slice(0, 80);
  }
  function teacherPanel(tool){
    if(tool === "board") return teacherBoard();
    if(tool === "live") return teacherLive();
    return need(["live-render", "live-teacher"]).then(function(){
      body.innerHTML = '<div></div>';
      widget = window.BM_LIVETEACHER.mount(body.firstChild, {
        type:tool,
        isActive:function(){ return !panel.hidden; },
        onChange:poll
      });
    });
  }

  /* "לאיזו כיתה" בראש החלון של הלוח (assets/live-teacher.js) */
  function addPicker(){
    var box = document.createElement("div");
    body.insertBefore(box, body.firstChild);
    window.BM_LIVETEACHER.roomPicker(box, function(){ poll().then(function(){ cleanup(); teacherBoard(); }); });
  }
  function teacherBoard(){
    return need(["question-board", "live-render", "live-teacher"]).then(function(){ return poll(); }).then(function(){
      body.innerHTML = "";
      addPicker();
      var ctl = document.createElement("div");
      ctl.className = "bmd-ctl";
      body.appendChild(ctl);
      if(state.board){
        var b = state.board;
        titleEl.textContent = b.title;
        ctl.innerHTML = '<p class="bmd-on">פתוח לתלמידים עכשיו</p>' +
          '<div class="bmd-btns">' +
            '<a class="bmd-btn" href="screen.html?board=' + encodeURIComponent(b.id) + '" target="_blank" rel="noopener">📺 על המקרן</a>' +
            '<button type="button" class="bmd-btn bmd-btn--warn" data-a="close">סגירת הלוח לתלמידים</button>' +
            '<button type="button" class="bmd-btn" data-a="new">לוח חדש</button>' +
          '</div><p class="bmd-msg" role="status"></p>';
        var area = document.createElement("div");
        body.appendChild(area);
        widget = window.BM_QBOARD.mount(area, b.id, { intro:"כך התלמידים רואים את הלוח. אפשר לסמן \"נדון בכיתה\" או למחוק שאלה." });
        ctl.addEventListener("click", function(e){
          var a = e.target.closest("[data-a]"); if(!a) return;
          if(a.getAttribute("data-a") === "new"){ cleanup(); newBoardForm(); return; }
          a.disabled = true;
          post({ action:"boardSet", open:false, room:room() }).then(function(res){
            if(authMsg(res)) return;
            poll().then(function(){ cleanup(); teacherBoard(); });
          }).catch(function(){ a.disabled = false; ctl.querySelector(".bmd-msg").textContent = "אין חיבור לשרת כרגע."; });
        });
      } else {
        newBoardForm();
      }
    });
  }
  function newBoardForm(){
    titleEl.textContent = "לוח שיתופי";
    body.innerHTML =
      '<div class="bmd-ctl">' +
        '<label class="bmd-label" for="bmdBoardTitle">כותרת הלוח (התלמידים יראו אותה)</label>' +
        '<input id="bmdBoardTitle" class="bmd-in" type="text" maxlength="120" value="' + esc("שאלות על " + pageTitle()) + '">' +
        '<div class="bmd-btns"><button type="button" class="bmd-btn bmd-btn--primary" id="bmdBoardOpen">פתיחת הלוח לתלמידים</button></div>' +
        '<p class="bmd-note">הלוח יופיע אצל התלמידים של הכיתה שבחרתם למעלה, בכל דף שהם נמצאים בו. לוח חדש סוגר את הקודם של אותה כיתה (השאלות שבו נשמרות).</p>' +
        '<p class="bmd-msg" role="status"></p>' +
      '</div>' +
      '<div class="bmd-ctl"><span class="bmd-label">לוחות קודמים</span><ul class="bmd-old" id="bmdOld"><li><span>טוען…</span></li></ul></div>';
    addPicker();
    var msg = body.querySelector(".bmd-msg");
    body.querySelector("#bmdBoardOpen").addEventListener("click", function(){
      var title = body.querySelector("#bmdBoardTitle").value.trim();
      if(title.length < 2){ msg.textContent = "כתבו כותרת ללוח."; return; }
      var b = this; b.disabled = true; msg.textContent = "פותחים…";
      post({ action:"boardOpen", title:title, page:page, room:room() }).then(function(res){
        b.disabled = false;
        if(authMsg(res)) return;
        if(!res || !res.ok){ msg.textContent = (res && res.error) || "לא הצלחנו לפתוח."; return; }
        poll().then(function(){ cleanup(); teacherBoard(); });
      }).catch(function(){ b.disabled = false; msg.textContent = "אין חיבור לשרת כרגע."; });
    });
    post({ action:"boardList", room:room() }).then(function(res){
      if(authMsg(res)) return;
      var list = (res && res.boards) || [];
      var ul = body.querySelector("#bmdOld"); if(!ul) return;
      ul.innerHTML = list.length ? list.slice(0, 20).map(function(b){
        var d = b.created ? new Date(b.created) : null;
        return '<li><span>' + esc(b.title) + (d ? '<small>' + d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear() + '</small>' : '') + '</span>' +
          '<button type="button" class="bmd-btn" data-view="' + esc(b.id) + '">צפייה</button>' +
          '<button type="button" class="bmd-btn" data-reopen="' + esc(b.id) + '">פתיחה מחדש</button></li>';
      }).join("") : '<li><span>עוד אין לוחות קודמים.</span></li>';
      ul.addEventListener("click", function(e){
        var r = e.target.closest("[data-reopen]"), v = e.target.closest("[data-view]");
        if(r){
          r.disabled = true;
          post({ action:"boardSet", id:r.getAttribute("data-reopen"), open:true, room:room() }).then(function(res2){
            if(authMsg(res2)) return;
            poll().then(function(){ cleanup(); teacherBoard(); });
          });
        } else if(v){
          var id = v.getAttribute("data-view"), b = list.filter(function(x){ return x.id === id; })[0];
          cleanup();
          titleEl.textContent = b ? b.title : "לוח";
          body.innerHTML = '<div class="bmd-btns"><button type="button" class="bmd-btn" id="bmdBack">‹ חזרה</button>' +
            '<a class="bmd-btn" href="screen.html?board=' + encodeURIComponent(id) + '" target="_blank" rel="noopener">📺 על המקרן</a></div><div></div>';
          body.querySelector("#bmdBack").addEventListener("click", function(){ cleanup(); newBoardForm(); });
          widget = window.BM_QBOARD.mount(body.lastChild, id, { intro:"לוח קודם (סגור לתלמידים)." });
        }
      });
    }).catch(function(){});
  }

  /* שיעור חי: אחרי שפותחים את החלון פעם אחת, הבדיקה ממשיכה כל 5 שניות גם כשהחלון סגור,
     כדי שהתראות על יציאה מהדף והדבקת טקסט יגיעו (assets/live-monitor.js) */
  var liveBg = null, liveOpenSids = {}, liveShownCode = "";
  /* 💬 שאלות פרטיות מתלמידים (assets/lesson-mode.js): התשובה שהמורה כותב נשמרת כאן בין רענון לרענון */
  var chatDraft = {}, chatFocus = "";
  function chatHtml(s){
    if(!s.chat || !s.chat.m || !s.chat.m.length) return "";
    var u = s.chat.u || 0;
    return '<div class="bmd-chat" data-chat-for="' + esc(s.sid) + '" style="flex-basis:100%;margin-top:4px;padding:8px;border-radius:10px;border:1.5px solid ' + (u ? '#0D8A63' : '#C6D2E6') + ';background:#fff;display:flex;flex-direction:column;gap:4px">' +
      '<b style="font-size:13px">💬 שאלה פרטית' + (u ? ' · <span style="color:#0D8A63">' + u + ' חדשות</span>' : '') + ' <span style="font-weight:400">(רק אתם רואים)</span></b>' +
      s.chat.m.slice(-6).map(function(x){
        return '<span style="padding:3px 8px;border-radius:8px;font-size:14px;' + (x.f === "t" ? 'background:#E5F6EE;align-self:flex-end' : 'background:#EEF3FB;align-self:flex-start') + '">' +
          '<b>' + (x.f === "t" ? "אני" : esc(s.name || "התלמיד")) + ':</b> ' + esc(x.x) + '</span>';
      }).join("") +
      '<form class="bmd-chat-form" data-chat-sid="' + esc(s.sid) + '" style="display:flex;gap:6px">' +
        '<input type="text" maxlength="500" aria-label="תשובה ל' + esc(s.name || "") + '" placeholder="תשובה..." data-chat-in="' + esc(s.sid) + '" style="flex:1;min-width:0;min-height:34px;padding:3px 8px;border:1.5px solid #C6D2E6;border-radius:8px;font:inherit">' +
        '<button type="submit" class="bmd-btn" style="min-height:34px;padding:3px 10px;font-size:13px;font-weight:700">שליחה</button>' +
        (u ? '<button type="button" class="bmd-btn" style="min-height:34px;padding:3px 10px;font-size:13px" data-chat-seen="' + esc(s.sid) + '">✓ ראיתי</button>' : '') +
      '</form></div>';
  }
  function liveCodeNow(){ try{ return sessionStorage.getItem("bm-live-code") || ""; }catch(e){ return ""; } }
  function livePanelShown(){ return openTool === "live" && !panel.hidden; }
  function renderLive(res){
    var LM = window.BM_LIVEMON;
    if(!res.lesson){
      body.innerHTML = '<p class="bmd-note">אין כרגע שיעור עם בקרה. כדי להפעיל: אזור אישי ← "בשיעור" ← קוד לשיעור ← לבחור כיתה ב"בקרת שיעור".</p>';
      return;
    }
    liveShownCode = res.lesson.code;
    if(LM && LM.injectStyle) LM.injectStyle();
    var order = { out:0, gone:1, "in":2, bye:3, kicked:4 };
    /* ✋ מבקשים עזרה - ראשונים (מי שמחכה הכי הרבה זמן למעלה) */
    var chatU = function(s){ return (s.chat && s.chat.u) || 0; };
    var list = (res.students || []).slice().sort(function(a, b){
      return (chatU(b) - chatU(a)) || ((b.help >= 0) - (a.help >= 0)) || ((b.help || 0) - (a.help || 0)) || (order[a.status] - order[b.status]) || (b.leaves - a.leaves);
    });
    var chatN = list.reduce(function(t, s){ return t + chatU(s); }, 0);
    var n = { "in":0, out:0 };
    list.forEach(function(s){ if(n[s.status] !== undefined) n[s.status]++; });
    var helpN = list.filter(function(s){ return s.help >= 0; }).length, idleN = LM ? list.filter(LM.isIdle).length : 0;
    var many = (res.lessons || []).length > 1;
    body.innerHTML = (many ? '<div class="bmd-btns">' + res.lessons.map(function(x){
        return '<button type="button" class="bmd-btn" data-live-code="' + esc(x.code) + '"' + (x.code === res.lesson.code ? ' aria-pressed="true" style="font-weight:700"' : ' aria-pressed="false"') + '>' + (x.cls ? 'כיתה ' + (x.cls === "יב" ? 'י"ב' : 'י"א') + ' · ' : '') + 'קוד ' + esc(x.code) + '</button>';
      }).join("") + '</div>' : '') +
      '<div class="bmd-btns" id="bmdLiveSound"><button type="button" class="bmd-btn" data-nav-here="' + esc(res.lesson.code) + '" style="font-weight:700">📍 העבר את הכיתה לכאן</button>' +
        '<button type="button" class="bmd-btn" data-nav-here="' + esc(res.lesson.code) + '" data-nav-lock="1" style="font-weight:700" title="התלמידים יעברו לכאן ולא יוכלו לעבור לדף או למשימה אחרת עד שתשחררו">🔒 העבר ונעל כאן</button>' +
        (res.lesson.nav && /#bmlock-/.test(String(res.lesson.nav.url)) ? '<button type="button" class="bmd-btn" data-nav-here="' + esc(res.lesson.code) + '" data-nav-free="' + esc(String(res.lesson.nav.url).split("#")[0]) + '">🔓 שחרור הנעילה</button>' : '') +
        '</div>' +
      (res.lesson.nav && /#bmlock-/.test(String(res.lesson.nav.url)) ? '<p class="bmd-note" style="font-weight:700">🔒 הכיתה נעולה על הדף הזה. התלמידים לא יכולים לעבור לדף או למשימה אחרת.</p>' : '') +
      (res.lesson.nav ? '<p class="bmd-note">נשלחו ל: <b>' + esc(res.lesson.nav.label || res.lesson.nav.url) + '</b> · כבר שם: ' +
        list.filter(function(x){ return x.page === String(res.lesson.nav.url).split("#")[0] && x.status !== "bye"; }).length + ' מתוך ' +
        list.filter(function(x){ return x.status !== "bye"; }).length + '</p>' : '') +
      '<p class="bmd-note">קוד ' + esc(res.lesson.code) + ' · ' + esc(res.lesson.label || "") + ' · 🟢 בדף: <b>' + n["in"] + '</b> · 🟠 מחוץ לדף: <b>' + n.out + '</b>' +
        (chatN ? ' · 💬 הודעות חדשות: <b>' + chatN + '</b>' : '') +
        (helpN ? ' · ✋ מבקשים עזרה: <b>' + helpN + '</b>' : '') + (idleN ? ' · 💤 בלי כתיבה: <b>' + idleN + '</b>' : '') + '</p>' +
      (list.length ? '<ul class="bmd-pres">' + list.map(function(s){
        var sid = s.sid || s.name || "", open = !!liveOpenSids[sid];
        var stt = s.status === "kicked" ? "🚫 הוצא מהשיעור" : s.status === "out" ? "🟠 " + (LM ? LM.whyText(s.outWhy) + " · " + LM.dur(s.outFor) : "מחוץ לדף")
          : s.status === "gone" ? "⚪ לא מחובר" : s.status === "bye" ? "יצא ממצב שיעור" : "🟢 בדף";
        var extra = (s.leaves || 0) + " יציאות" + (s.outTotal && LM ? " · " + LM.dur(s.outTotal) + " בחוץ" : "") + (s.pastes ? " · 📋 " + s.pastes + " הדבקות" : "") + (s.dups ? " · ⚠ ניסו להיכנס בשם הזה ממכשיר אחר" : "");
        return '<li class="' + (s.status === "out" ? "is-out" : "") + '" data-sid="' + esc(sid) + '" style="cursor:pointer;flex-wrap:wrap" title="לחיצה: כל מה שקרה אצל התלמיד">' +
          '<b>' + (open ? "▾ " : "◂ ") + esc(s.name || "ללא שם") + '</b><span>' + esc(stt) + '</span>' + (LM ? LM.helpBadge(s) : '') +
          (LM && LM.workHtml(s) ? '<span style="flex-basis:100%">' + LM.workHtml(s) + '</span>' : '') +
          '<small style="flex-basis:100%">' + esc(extra) + '</small>' +
          '<span style="flex-basis:100%;display:flex;gap:6px;flex-wrap:wrap">' +
            (s.help >= 0 ? '<button type="button" class="bmd-btn" style="min-height:34px;padding:3px 10px;font-size:13px;font-weight:700" data-help-done="' + esc(s.sid) + '">✓ טיפלתי בבקשה</button>' : '') +
            '<button type="button" class="bmd-btn" style="min-height:34px;padding:3px 10px;font-size:13px" data-kick="' + esc(s.sid) + '"' + (s.kicked ? ' data-undo="1"' : '') + ' data-name="' + esc(s.name || "") + '">' + (s.kicked ? "↩ החזרה לשיעור" : "🚫 הוצאה מהשיעור") + '</button></span>' +
          chatHtml(s) +
          (open && LM ? '<div style="flex-basis:100%">' + LM.timelineHtml(s) + '</div>' : '') + '</li>';
      }).join("") + '</ul>' : '<p class="bmd-note">עדיין אף תלמיד לא נכנס עם הקוד.</p>') +
      '<p class="bmd-note">✋ = התלמיד לחץ "צריך עזרה". 💤 = לא כתב ולא עבר משימה 3 דקות. "משימה" ו-✍️ מתעדכנים כל 15 שניות.</p>' +
      '<p class="bmd-note">מתעדכן כל 5 שניות. נספרת יציאה מהדף מעל 5 שניות, ומעבר לחלון אחר מעל 10 שניות. המספר הכתום על כפתור 👥 = כמה תלמידים מחוץ לדף עכשיו. התראות קופצות וצליל כבויים, אלא אם מפעילים אותם כאן (עדיף לא כשהמסך מוקרן). לחיצה על תלמיד: כל מה שקרה אצלו.</p>';
    if(LM){ var sb = LM.soundButton(); sb.className = "bmd-btn"; body.querySelector("#bmdLiveSound").appendChild(sb); }
    bindChat(body);
  }
  /* שדה התשובה בצ'אט: מה שהמורה התחיל לכתוב חוזר אחרי כל רענון, והשליחה עוברת לשרת (action=chatReply) */
  function bindChat(root){
    Array.prototype.forEach.call(root.querySelectorAll("[data-chat-in]"), function(inp){
      var k = inp.getAttribute("data-chat-in");
      if(chatDraft[k]) inp.value = chatDraft[k];
      inp.addEventListener("input", function(){ chatDraft[k] = inp.value; });
      inp.addEventListener("focus", function(){ chatFocus = k; });
      inp.addEventListener("blur", function(){ if(chatFocus === k) chatFocus = ""; });
      if(chatFocus === k){ inp.focus(); try{ inp.setSelectionRange(inp.value.length, inp.value.length); }catch(e){} }
    });
    Array.prototype.forEach.call(root.querySelectorAll(".bmd-chat-form"), function(f){
      f.addEventListener("submit", function(e){
        e.preventDefault();
        var k = f.getAttribute("data-chat-sid"), inp = f.querySelector("input"), text = inp.value.trim();
        if(!text) return;
        f.querySelector("button[type=submit]").disabled = true;
        post({ action:"chatReply", code:liveShownCode || liveCodeNow(), sid:k, text:text }).then(function(r){
          if(authMsg(r)) return;
          if(!r || !r.ok){ toastMsg((r && r.error) || "השליחה לא הצליחה."); return; }
          delete chatDraft[k]; chatFocus = "";
          liveTick();
        }).catch(function(){ toastMsg("אין חיבור לשרת כרגע."); });
      });
    });
  }

  /* ---------- 💬 בלון הצ'אט של המורה (צד ימין, למטה) ----------
     מופיע כשיש בשיעור שאלות פרטיות. המספר = הודעות שעוד לא ראיתם. נפתח לבד כשמגיעה שאלה חדשה. */
  var cb = null, cbPanel = null, cbOpen = false, cbLastU = 0;
  function cbMake(){
    if(cb) return;
    cb = document.createElement("button");
    cb.type = "button"; cb.className = "bmd-cb"; cb.hidden = true;
    cb.setAttribute("aria-haspopup", "dialog"); cb.setAttribute("aria-expanded", "false"); cb.setAttribute("aria-controls", "bmdChatPanel");
    cb.innerHTML = '<span aria-hidden="true">💬</span><span class="bmd-cb-n" hidden></span>';
    cbPanel = document.createElement("section");
    cbPanel.className = "bmd-cp"; cbPanel.id = "bmdChatPanel"; cbPanel.hidden = true;
    cbPanel.setAttribute("role", "dialog"); cbPanel.setAttribute("aria-label", "שאלות פרטיות מתלמידים");
    cbPanel.innerHTML = '<div class="bmd-ph"><span aria-hidden="true">💬</span><h2>שאלות מתלמידים</h2><button type="button" class="bmd-x" aria-label="סגירה">✕</button></div>' +
      '<p class="bmd-note" style="padding:6px 12px 0">רק אתם רואים את השאלות. התשובה מגיעה רק לתלמיד ששאל.</p><div class="bmd-pb bmd-cp-b"></div>';
    document.body.appendChild(cb); document.body.appendChild(cbPanel);
    cb.addEventListener("click", function(){ cbOpen = !cbOpen; cbShow(); if(cbOpen) liveTick(); });
    cbPanel.querySelector(".bmd-x").addEventListener("click", function(){ cbOpen = false; cbShow(); cb.focus(); });
    cbPanel.addEventListener("keydown", function(e){ if(e.key === "Escape"){ cbOpen = false; cbShow(); cb.focus(); } });
    cbPanel.addEventListener("click", function(e){
      var sb = e.target.closest("[data-chat-seen]");
      if(!sb) return;
      sb.disabled = true;
      post({ action:"chatSeen", code:liveShownCode || liveCodeNow(), sid:sb.getAttribute("data-chat-seen") }).then(function(){ liveTick(); }).catch(function(){ sb.disabled = false; });
    });
  }
  function cbShow(){ if(!cb) return; cbPanel.hidden = !cbOpen; cb.setAttribute("aria-expanded", String(cbOpen)); }
  function cbRender(res){
    var list = res && res.lesson ? (res.students || []).filter(function(s){ return s.chat && s.chat.m && s.chat.m.length; }) : [];
    if(!list.length){ if(cb){ cb.hidden = true; cbOpen = false; cbShow(); } cbLastU = 0; return; }
    cbMake();
    cb.hidden = false;
    var u = list.reduce(function(t, s){ return t + (s.chat.u || 0); }, 0);
    var n = cb.querySelector(".bmd-cb-n");
    n.textContent = u; n.hidden = !u;
    cb.classList.toggle("is-on", !!u);
    cb.setAttribute("aria-label", u ? u + " שאלות חדשות מתלמידים" : "שאלות מתלמידים");
    if(u > cbLastU) cbOpen = true;   /* שאלה חדשה - הבלון נפתח לבד */
    cbLastU = u;
    cbShow();
    if(!cbOpen) return;
    list.sort(function(a, b){ return (b.chat.u || 0) - (a.chat.u || 0) || b.chat.m[b.chat.m.length - 1].at - a.chat.m[a.chat.m.length - 1].at; });
    var box = cbPanel.querySelector(".bmd-cp-b");
    box.innerHTML = list.map(function(s){ return '<div><b>' + esc(s.name || "ללא שם") + '</b>' + chatHtml(s) + '</div>'; }).join("");
    bindChat(box);
  }

  function liveTick(){
    return post({ action:"presenceList", code:liveCodeNow() }).then(function(res){
      if(livePanelShown() && authMsg(res)) return;
      if(!res || !res.ok){ if(livePanelShown()) body.innerHTML = '<p class="bmd-msg">' + esc((res && res.error) || "לא הצלחנו לטעון.") + '</p>'; return; }
      if(window.BM_LIVEMON) window.BM_LIVEMON.watch(res);
      cbRender(res);
      var cnt = btn("live") && btn("live").querySelector(".bmd-cnt");
      if(cnt){
        var outN = res.lesson ? (res.students || []).filter(function(s){ return s.status === "out"; }).length : 0;
        var hlpN = res.lesson ? (res.students || []).filter(function(s){ return s.help >= 0; }).length : 0;
        var chN = res.lesson ? (res.students || []).filter(function(s){ return s.chat && s.chat.u; }).length : 0;
        cnt.textContent = outN + hlpN + chN; cnt.hidden = !(outN + hlpN + chN);
        var tc = dock.querySelector(".bmd-tog-cnt");
        if(tc){ tc.textContent = cnt.textContent; tc.hidden = cnt.hidden; tc.title = ""; }
        cnt.title = outN + " מחוץ לדף" + (hlpN ? " · " + hlpN + " מבקשים עזרה" : "") + (chN ? " · " + chN + " שאלות חדשות בצ'אט" : "");
      }
      if(livePanelShown()) renderLive(res);
      return !!res.lesson;
    }).catch(function(){ if(livePanelShown()) body.innerHTML = '<p class="bmd-msg">אין חיבור לשרת כרגע.</p>'; });
  }
  /* כל 5 שניות כשיש שיעור עם בקרה, כל 30 שניות כשאין */
  /* שם הדף לתלמידים ולמורה: לפי רשימת היחידות, ואם אין - כותרת הדף */
  function pageLabel(){
    var T = window.BM_TASKS, w = T ? T.findByPage(page) : null;
    if(w) return w.topic ? w.unit.title + " · " + w.topic.title : w.unit.title;
    var u = (window.BM_UNITS || []).filter(function(x){ return x.url === page; })[0];
    return u ? u.title : (document.querySelector("h1") || document).textContent.trim().slice(0, 80) || page;
  }
  function toastMsg(t){
    var p = document.createElement("p");
    p.className = "bmd-note"; p.setAttribute("role", "status"); p.textContent = t; p.style.fontWeight = "700";
    if(livePanelShown()) body.insertBefore(p, body.firstChild);
  }
  function startLiveBg(){
    if(liveBg) return;
    liveBg = true;
    (function next(){
      liveTick().then(function(active){ setTimeout(next, active ? 5000 : 30000); });
    })();
  }
  if(isTeacher) need(["live-monitor"]).then(startLiveBg).catch(function(){});
  function teacherLive(){
    if(!body.__bmLiveBound) body.addEventListener("click", function(e){
      if(!livePanelShown()) return;
      var hb = e.target.closest && e.target.closest("[data-help-done]");
      if(hb){
        e.stopPropagation();
        hb.disabled = true;
        post({ action:"helpDone", code:liveShownCode || liveCodeNow(), sid:hb.getAttribute("data-help-done") }).then(function(res){
          if(authMsg(res)) return;
          if(!res || !res.ok){ hb.disabled = false; toastMsg((res && res.error) || "הפעולה לא הצליחה."); return; }
          liveTick();
        }).catch(function(){ hb.disabled = false; toastMsg("אין חיבור לשרת כרגע."); });
        return;
      }
      var kb = e.target.closest && e.target.closest("[data-kick]");
      if(kb){
        e.stopPropagation();
        var undo = kb.hasAttribute("data-undo"), nm = kb.getAttribute("data-name") || "התלמיד";
        if(!undo && !confirm("להוציא את " + nm + " מהשיעור?\nהמסך אצלו/ה ייסגר תוך כמה שניות, ולא יהיה אפשר להיכנס שוב לשיעור הזה עד שתחזירו.")) return;
        kb.disabled = true;
        post({ action:"kickStudent", code:liveShownCode || liveCodeNow(), sid:kb.getAttribute("data-kick"), undo:undo }).then(function(res){
          if(authMsg(res)) return;
          if(!res || !res.ok){ kb.disabled = false; toastMsg((res && res.error) || "הפעולה לא הצליחה."); return; }
          liveTick();
        }).catch(function(){ kb.disabled = false; toastMsg("אין חיבור לשרת כרגע."); });
        return;
      }
      var nb = e.target.closest && e.target.closest("[data-nav-here]");
      if(nb){
        nb.disabled = true; nb.textContent = "שולחים…";
        /* גם המשימה שהמורה עומד בה ("משימה 3 מתוך 8") - התלמידים יגיעו בדיוק אליה */
        var pos = window.BeitMidrashSteps && window.BeitMidrashSteps.position ? window.BeitMidrashSteps.position() : null;
        var lockIt = nb.hasAttribute("data-nav-lock"), freePage = nb.getAttribute("data-nav-free");
        var hash = pos ? "#bm" + (lockIt ? "lock" : "step") + "-" + pos.step + (pos.key && /^[\w-]+$/.test(pos.key) ? "-" + pos.key : "") : (lockIt ? "#bmlock-0" : "");
        var navUrl = freePage ? freePage + "#bmfree-0" : page + hash;
        var navLabel = freePage ? "שחרור הנעילה" : pageLabel() + (pos ? " · משימה " + pos.step : "") + (lockIt ? " · 🔒 נעול" : "");
        post({ action:"lessonNav", code:nb.getAttribute("data-nav-here"), url:navUrl, label:navLabel }).then(function(res){
          if(authMsg(res)) return;
          if(res && res.ok) toastMsg(freePage ? "✓ הנעילה שוחררה. התלמידים יכולים לעבור בין המשימות." : lockIt ? "✓ נשלח ונעול. התלמידים יעברו לכאן תוך כ-15 שניות וישארו כאן עד שתשחררו." : "✓ נשלח. התלמידים יעברו לדף הזה תוך כ-15 שניות.");
          else toastMsg((res && res.error) || "השליחה לא הצליחה.");
          setTimeout(liveTick, 4000);   /* שההודעה תישאר רגע לפני שהחלון מתרענן */
        }).catch(function(){ toastMsg("אין חיבור לשרת כרגע."); setTimeout(liveTick, 4000); });
        return;
      }
      var b = e.target.closest && e.target.closest("[data-live-code]");
      if(b){
        try{ sessionStorage.setItem("bm-live-code", b.getAttribute("data-live-code")); }catch(err){}
        liveTick(); return;
      }
      var cs = e.target.closest && e.target.closest("[data-chat-seen]");
      if(cs){
        e.stopPropagation();
        cs.disabled = true;
        post({ action:"chatSeen", code:liveShownCode || liveCodeNow(), sid:cs.getAttribute("data-chat-seen") }).then(function(){ liveTick(); }).catch(function(){ cs.disabled = false; });
        return;
      }
      var li = e.target.closest && e.target.closest("li[data-sid]");
      if(li && !e.target.closest("button") && !e.target.closest(".bmd-chat")){
        var sid = li.getAttribute("data-sid");
        if(liveOpenSids[sid]) delete liveOpenSids[sid]; else liveOpenSids[sid] = 1;
        liveTick();
      }
    });
    body.__bmLiveBound = true;
    return need(["live-monitor"]).catch(function(){}).then(function(){
      startLiveBg();
      return liveTick();
    });
  }

  /* ---------- התחלה ---------- */
  poll();
  setInterval(function(){ if(document.visibilityState === "visible") poll(); }, POLL_MS);
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "visible") poll(); });
})();
