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

  var BASE = (function(){
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^\/]*$/, "") : "assets/";
  })();
  var POLL_MS = 15000;
  var SEEN_KEY = "bm-dock-seen";

  function token(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  // Shared teacher controls load on the home page too, including after teacher login.
  var quickScript = document.createElement("script");
  quickScript.src = BASE + "lesson-quick.js?v=20261023-1";
  document.head.appendChild(quickScript);
  var isTeacher = !!token();
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
        s.src = BASE + n + ".js";
        s.onload = ok; s.onerror = fail;
        document.head.appendChild(s);
      });
      return loading[n];
    }));
  }

  /* ---------- עיצוב ---------- */
  var css =
    ".bmd{position:fixed;inset-inline-end:0;top:50%;transform:translateY(-50%);z-index:9990;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 6px;" +
      "background:#0B2A5B;border-radius:16px 0 0 16px;box-shadow:0 8px 24px rgba(11,42,91,.3);font-family:Heebo,Rubik,Arial,sans-serif;direction:rtl}" +
    ".bmd[hidden]{display:none}" +
    ".bmd-role{font-size:10px;color:#FFD9B8;font-weight:700;margin-bottom:2px}" +
    ".bmd-b{position:relative;width:50px;height:50px;border:0;border-radius:12px;background:rgba(255,255,255,.1);color:#fff;font-size:23px;line-height:1;cursor:pointer;display:grid;place-items:center}" +
    ".bmd-b:hover{background:rgba(255,255,255,.2)}" +
    ".bmd-b[aria-expanded=true]{background:#FF7A1A}" +
    ".bmd-b:focus-visible{outline:3px solid #FFD9B8;outline-offset:2px}" +
    ".bmd-b[hidden]{display:none}" +
    ".bmd-dot{position:absolute;top:5px;left:5px;width:10px;height:10px;border-radius:50%;background:#2BD38C;box-shadow:0 0 0 3px rgba(43,211,140,.35)}" +
    ".bmd-dot[hidden]{display:none}" +
    ".bmd-lbl{font-size:10px;color:#fff;opacity:.85;margin-bottom:6px;white-space:nowrap}" +
    ".bmd-lbl[hidden]{display:none}" +
    ".bmd-p{position:fixed;inset-inline-end:74px;top:12px;bottom:12px;width:min(440px, calc(100vw - 92px));z-index:9991;background:#fff;border-radius:18px;" +
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
    ".bmd-t{position:fixed;inset-inline-end:74px;top:50%;transform:translateY(-50%);z-index:9992;max-width:min(320px, calc(100vw - 92px));display:flex;align-items:center;gap:8px;" +
      "padding:10px 14px;border:0;border-radius:12px;background:#B42318;color:#fff;font:700 15px/1.35 Heebo,Rubik,Arial,sans-serif;direction:rtl;text-align:right;cursor:pointer;box-shadow:0 10px 26px rgba(180,35,24,.35)}" +
    ".bmd-t[hidden]{display:none}" +
    "@media (max-width:600px){" +
      ".bmd{padding:6px 4px}.bmd-b{width:42px;height:42px;font-size:20px}.bmd-lbl{display:none}" +
      ".bmd-p{inset:auto 8px 8px 8px;top:10%;width:auto}" +
      ".bmd-t{inset-inline-end:58px}" +
    "}" +
    "@media print{.bmd,.bmd-p,.bmd-t{display:none !important}}";
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
  dock.className = "bmd";
  dock.setAttribute("aria-label", "כלים לשיעור");
  dock.hidden = !isTeacher;
  dock.innerHTML = (isTeacher ? '<span class="bmd-role">מורה</span>' : '') + TOOLS.map(function(t){
    return '<button type="button" class="bmd-b" data-tool="' + t.id + '" aria-expanded="false" aria-controls="bmdPanel" title="' + t.title + '"' + (isTeacher ? '' : ' hidden') + '>' +
      '<span aria-hidden="true">' + t.ico + '</span><span class="bmd-dot" hidden></span><span class="vh" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">' + t.title + '</span></button>' +
      '<span class="bmd-lbl" data-lbl="' + t.id + '"' + (isTeacher ? '' : ' hidden') + ' aria-hidden="true">' + t.label + '</span>';
  }).join("");
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
  var liveBg = null, liveOpenSids = {};
  function liveCodeNow(){ try{ return sessionStorage.getItem("bm-live-code") || ""; }catch(e){ return ""; } }
  function livePanelShown(){ return openTool === "live" && !panel.hidden; }
  function renderLive(res){
    var LM = window.BM_LIVEMON;
    if(!res.lesson){
      body.innerHTML = '<p class="bmd-note">אין כרגע שיעור עם בקרה. כדי להפעיל: אזור אישי ← "בשיעור" ← קוד לשיעור ← לבחור כיתה ב"בקרת שיעור".</p>';
      return;
    }
    var order = { out:0, gone:1, "in":2, bye:3 };
    var list = (res.students || []).slice().sort(function(a, b){ return (order[a.status] - order[b.status]) || (b.leaves - a.leaves); });
    var n = { "in":0, out:0 };
    list.forEach(function(s){ if(n[s.status] !== undefined) n[s.status]++; });
    var many = (res.lessons || []).length > 1;
    body.innerHTML = (many ? '<div class="bmd-btns">' + res.lessons.map(function(x){
        return '<button type="button" class="bmd-btn" data-live-code="' + esc(x.code) + '"' + (x.code === res.lesson.code ? ' aria-pressed="true" style="font-weight:700"' : ' aria-pressed="false"') + '>' + (x.cls ? 'כיתה ' + (x.cls === "יב" ? 'י"ב' : 'י"א') + ' · ' : '') + 'קוד ' + esc(x.code) + '</button>';
      }).join("") + '</div>' : '') +
      '<div class="bmd-btns" id="bmdLiveSound"><button type="button" class="bmd-btn" data-nav-here="' + esc(res.lesson.code) + '" style="font-weight:700">📍 העבר את הכיתה לכאן</button></div>' +
      (res.lesson.nav ? '<p class="bmd-note">נשלחו ל: <b>' + esc(res.lesson.nav.label || res.lesson.nav.url) + '</b> · כבר שם: ' +
        list.filter(function(x){ return x.page === String(res.lesson.nav.url).split("#")[0] && x.status !== "bye"; }).length + ' מתוך ' +
        list.filter(function(x){ return x.status !== "bye"; }).length + '</p>' : '') +
      '<p class="bmd-note">קוד ' + esc(res.lesson.code) + ' · ' + esc(res.lesson.label || "") + ' · 🟢 בדף: <b>' + n["in"] + '</b> · 🟠 מחוץ לדף: <b>' + n.out + '</b></p>' +
      (list.length ? '<ul class="bmd-pres">' + list.map(function(s){
        var sid = s.sid || s.name || "", open = !!liveOpenSids[sid];
        var stt = s.status === "out" ? "🟠 " + (LM ? LM.whyText(s.outWhy) + " · " + LM.dur(s.outFor) : "מחוץ לדף")
          : s.status === "gone" ? "⚪ לא מחובר" : s.status === "bye" ? "יצא ממצב שיעור" : "🟢 בדף";
        var extra = (s.leaves || 0) + " יציאות" + (s.outTotal && LM ? " · " + LM.dur(s.outTotal) + " בחוץ" : "") + (s.pastes ? " · 📋 " + s.pastes + " הדבקות" : "");
        return '<li class="' + (s.status === "out" ? "is-out" : "") + '" data-sid="' + esc(sid) + '" style="cursor:pointer;flex-wrap:wrap" title="לחיצה: כל מה שקרה אצל התלמיד">' +
          '<b>' + (open ? "▾ " : "◂ ") + esc(s.name || "ללא שם") + '</b><span>' + esc(stt) + '</span><small style="flex-basis:100%">' + esc(extra) + '</small>' +
          (open && LM ? '<div style="flex-basis:100%">' + LM.timelineHtml(s) + '</div>' : '') + '</li>';
      }).join("") + '</ul>' : '<p class="bmd-note">עדיין אף תלמיד לא נכנס עם הקוד.</p>') +
      '<p class="bmd-note">מתעדכן כל 5 שניות. כל יציאה מעל 3 שניות נספרת, וגם מעבר לחלון אחר. על יציאה, הדבקת טקסט או ניתוק קופצת התראה עם צליל, גם כשהחלון הזה סגור. לחיצה על תלמיד: כל מה שקרה אצלו.</p>';
    if(LM){ var sb = LM.soundButton(); sb.className = "bmd-btn"; body.querySelector("#bmdLiveSound").appendChild(sb); }
  }
  function liveTick(){
    return post({ action:"presenceList", code:liveCodeNow() }).then(function(res){
      if(livePanelShown() && authMsg(res)) return;
      if(!res || !res.ok){ if(livePanelShown()) body.innerHTML = '<p class="bmd-msg">' + esc((res && res.error) || "לא הצלחנו לטעון.") + '</p>'; return; }
      if(window.BM_LIVEMON) window.BM_LIVEMON.watch(res);
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
      var nb = e.target.closest && e.target.closest("[data-nav-here]");
      if(nb){
        nb.disabled = true; nb.textContent = "שולחים…";
        post({ action:"lessonNav", code:nb.getAttribute("data-nav-here"), url:page, label:pageLabel() }).then(function(res){
          if(authMsg(res)) return;
          if(res && res.ok) toastMsg("✓ נשלח. התלמידים יעברו לדף הזה תוך כ-15 שניות.");
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
      var li = e.target.closest && e.target.closest("li[data-sid]");
      if(li && !e.target.closest("button")){
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
