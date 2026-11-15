/* סקר בתוך דף לימוד.
   סימון בדף:
   <div class="page-poll" data-poll="מזהה-ייחודי">
     <p class="pp-q">השאלה</p>
     <div class="pp-opts"><button type="button" data-v="0">...</button> ...</div>
   </div>
   כל תלמיד מצביע פעם אחת (נשמר בשרת לפי המזהה של המכשיר), ואינו רואה מה הצביעו האחרים.
   מורה מחובר (סיסמה באזור האישי) רואה כפתור "הצגת תוצאות" ו"איפוס". */
(function(){
  var API = window.BM_API_URL;
  if(!document.getElementById("pp-style")){
    var st = document.createElement("style");
    st.id = "pp-style";
    st.textContent =
      ".page-poll{ --pp-acc:var(--acc,#A9752E); }" +
      ".page-poll .pp-label{ display:flex; align-items:center; gap:.4rem; font-weight:700; color:var(--pp-acc); font-size:.9rem; margin-bottom:.35rem; }" +
      ".page-poll .pp-q{ margin:0 0 .9rem; font-size:1.02rem; line-height:1.75; max-width:80ch; }" +
      ".page-poll .pp-opts{ display:flex; flex-direction:column; gap:.55rem; max-width:640px; }" +
      ".page-poll .pp-opt{ display:flex; align-items:center; gap:.7rem; width:100%; text-align:start; font:inherit; font-size:1rem; line-height:1.5; padding:.7rem .9rem; border:1.5px solid rgba(0,0,0,.14); border-radius:12px; background:#fff; color:inherit; cursor:pointer; transition:border-color .15s, background .15s; }" +
      ".page-poll .pp-opt:hover:not(:disabled){ border-color:var(--pp-acc); }" +
      ".page-poll .pp-opt:focus-visible{ outline:3px solid var(--pp-acc); outline-offset:2px; }" +
      ".page-poll .pp-opt[aria-pressed=true]{ border-color:var(--pp-acc); background:rgba(169,117,46,.10); font-weight:600; }" +
      ".page-poll .pp-opt:disabled{ cursor:default; opacity:.6; }" +
      ".page-poll .pp-opt[aria-pressed=true]:disabled{ opacity:1; }" +
      ".page-poll .pp-letter{ flex:none; display:inline-grid; place-items:center; width:1.9rem; height:1.9rem; border-radius:50%; background:rgba(0,0,0,.06); font-weight:700; }" +
      ".page-poll .pp-opt[aria-pressed=true] .pp-letter{ background:var(--pp-acc); color:#fff; }" +
      ".page-poll .pp-row{ display:flex; flex-wrap:wrap; align-items:center; gap:.6rem; margin-top:.9rem; }" +
      ".page-poll .pp-btn{ font:inherit; font-weight:700; padding:.55rem 1.2rem; border-radius:999px; border:none; background:var(--pp-acc); color:#fff; cursor:pointer; }" +
      ".page-poll .pp-btn:disabled{ opacity:.5; cursor:default; }" +
      ".page-poll .pp-btn.pp-ghost{ background:transparent; color:var(--pp-acc); border:1.5px solid var(--pp-acc); }" +
      ".page-poll .pp-msg{ font-size:.95rem; }" +
      ".page-poll .pp-msg.is-ok{ color:#0D7A57; font-weight:600; }" +
      ".page-poll .pp-msg.is-err{ color:#B42318; }" +
      ".page-poll .pp-teacher{ margin-top:1.1rem; padding-top:.9rem; border-top:1px dashed rgba(0,0,0,.18); }" +
      ".page-poll .pp-teacher-t{ font-size:.85rem; font-weight:700; opacity:.75; }" +
      ".page-poll .pp-res{ display:flex; flex-direction:column; gap:.5rem; max-width:640px; margin-top:.6rem; }" +
      ".page-poll .pp-bar-l{ display:flex; justify-content:space-between; gap:.6rem; font-size:.92rem; }" +
      ".page-poll .pp-bar{ height:.75rem; border-radius:999px; background:rgba(0,0,0,.07); overflow:hidden; }" +
      ".page-poll .pp-bar > i{ display:block; height:100%; background:var(--pp-acc); border-radius:999px; }" +
      "@media print{ .page-poll .pp-row, .page-poll .pp-teacher{ display:none; } }";
    document.head.appendChild(st);
  }

  function sid(){
    var v = "";
    try{ v = localStorage.getItem("bm-sid") || ""; }catch(e){}
    if(!v){
      var a = new Uint8Array(9); crypto.getRandomValues(a);
      v = Array.prototype.map.call(a, function(b){ return ("0" + b.toString(16)).slice(-2); }).join("");
      try{ localStorage.setItem("bm-sid", v); }catch(e){}
    }
    return v;
  }
  function teacherToken(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  function post(body){
    return fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); });
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); }

  function setup(box){
    var id = box.getAttribute("data-poll");
    var KEY = "bm-pagepoll-" + id;
    var opts = Array.prototype.slice.call(box.querySelectorAll(".pp-opts [data-v]"));
    var letters = ["א", "ב", "ג", "ד", "ה", "ו"];
    opts.forEach(function(b, i){
      b.classList.add("pp-opt");
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="pp-letter" aria-hidden="true">' + letters[i] + '</span><span>' + b.innerHTML + '</span>';
    });
    var row = document.createElement("div");
    row.className = "pp-row";
    row.innerHTML = '<button type="button" class="pp-btn" disabled>שליחת ההצבעה</button><span class="pp-msg" role="status" aria-live="polite"></span>';
    box.appendChild(row);
    var send = row.querySelector(".pp-btn"), msg = row.querySelector(".pp-msg");
    var selected = null;

    function say(t, kind){ msg.textContent = t || ""; msg.className = "pp-msg" + (kind ? " is-" + kind : ""); }
    function mark(v){ opts.forEach(function(b){ b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-v")) === v)); }); }
    function lockVoted(v){
      mark(v);
      opts.forEach(function(b){ b.disabled = true; });
      send.hidden = true;
      say("✓ ההצבעה שלכם נקלטה. התוצאות יוצגו בכיתה.", "ok");
    }

    var saved = null;
    try{ saved = JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){}
    if(saved && typeof saved.v === "number") lockVoted(saved.v);

    opts.forEach(function(b){
      b.addEventListener("click", function(){
        if(b.disabled) return;
        selected = Number(b.getAttribute("data-v"));
        mark(selected);
        send.disabled = false;
        say("אפשר להצביע פעם אחת בלבד - בדקו את הבחירה ולחצו \"שליחת ההצבעה\".");
      });
    });

    send.addEventListener("click", function(){
      if(selected === null) return;
      send.disabled = true;
      say("שולח...");
      post({ action:"pagePollVote", poll:id, sid:sid(), option:selected }).then(function(res){
        if(res && res.ok){
          var v = typeof res.mine === "number" ? res.mine : selected;
          try{ localStorage.setItem(KEY, JSON.stringify({ v:v, t:Date.now() })); }catch(e){}
          lockVoted(v);
          if(res.already) say("✓ כבר הצבעתם בסקר הזה. התוצאות יוצגו בכיתה.", "ok");
        }else if(res && res.auth === false){
          send.disabled = false;
          say("הסקר עוד לא זמין. בקשו מהמורה לעדכן את האתר.", "err");
        }else{
          send.disabled = false;
          say((res && res.error) || "משהו השתבש. נסו שוב.", "err");
        }
      }).catch(function(){ send.disabled = false; say("אין חיבור לאינטרנט כרגע. נסו שוב.", "err"); });
    });

    /* למורה: תוצאות ואיפוס */
    if(!teacherToken()) return;
    var t = document.createElement("div");
    t.className = "pp-teacher";
    t.innerHTML = '<div class="pp-teacher-t">למורה בלבד (התלמידים לא רואים את החלק הזה)</div>' +
      '<div class="pp-row"><button type="button" class="pp-btn" data-act="show">הצגת תוצאות</button>' +
      '<button type="button" class="pp-btn pp-ghost" data-act="reset">איפוס הסקר</button>' +
      '<span class="pp-msg" role="status" aria-live="polite"></span></div><div class="pp-res" hidden></div>';
    box.appendChild(t);
    var tmsg = t.querySelector(".pp-msg"), resBox = t.querySelector(".pp-res");
    function tsay(s, kind){ tmsg.textContent = s || ""; tmsg.className = "pp-msg" + (kind ? " is-" + kind : ""); }
    function showResults(){
      tsay("טוען...");
      post({ action:"pagePollResults", poll:id, password:teacherToken() }).then(function(res){
        if(!res || !res.ok){ tsay((res && res.error) || "לא הצלחתי לטעון.", "err"); return; }
        tsay(res.total + " הצביעו");
        resBox.hidden = false;
        resBox.innerHTML = opts.map(function(b, i){
          var c = res.counts[i] || 0, pct = res.total ? Math.round(c * 100 / res.total) : 0;
          var label = b.querySelector("span:last-child").textContent;
          return '<div><div class="pp-bar-l"><span><b>' + letters[i] + '.</b> ' + esc(label) + '</span><span>' + c + ' (' + pct + '%)</span></div>' +
                 '<div class="pp-bar"><i style="width:' + pct + '%"></i></div></div>';
        }).join("");
        t.querySelector('[data-act="show"]').textContent = "רענון התוצאות";
      }).catch(function(){ tsay("אין חיבור לאינטרנט כרגע.", "err"); });
    }
    t.querySelector('[data-act="show"]').addEventListener("click", showResults);
    t.querySelector('[data-act="reset"]').addEventListener("click", function(){
      if(!confirm("למחוק את כל ההצבעות בסקר הזה ולהתחיל מחדש?")) return;
      post({ action:"pagePollReset", poll:id, password:teacherToken() }).then(function(res){
        if(!res || !res.ok){ tsay((res && res.error) || "לא הצלחתי לאפס.", "err"); return; }
        try{ localStorage.removeItem(KEY); }catch(e){}
        resBox.hidden = true;
        tsay("הסקר אופס - כל ההצבעות נמחקו, ומעכשיו נספרות הצבעות חדשות.", "ok");
      }).catch(function(){ tsay("אין חיבור לאינטרנט כרגע.", "err"); });
    });
  }

  function init(){ Array.prototype.forEach.call(document.querySelectorAll(".page-poll[data-poll]"), setup); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
