/* ============================================================
   לוח שאלות (כמו פאדלט) - מתחת לתקציר הפרק
   ============================================================
   בדף שיש בו <section data-qboard="שם-הדף"> הסקריפט בונה:
   - טופס קצר: שם + שאלה (עם פתיחי משפט למי שמתקשה להתחיל)
   - לוח פתקים צבעוניים עם כל השאלות של הכיתה, מתעדכן לבד
   - כפתור "גם אני שואל/ת" על כל שאלה
   מורה שנכנס לאזור האישי (באותה לשונית) רואה גם "נדון בכיתה" ו"מחיקה".
   השאלות נשמרות בסקריפט של המורה (Code.gs, QBOARDS).
   ============================================================ */
(function(){
  "use strict";
  var root = document.querySelector("[data-qboard]");
  var API = window.BM_API_URL;
  if(!root || !API) return;
  var board = root.getAttribute("data-qboard");
  var body = root.querySelector(".card-body") || root;
  var MAX = 200;
  var POLL_MS = 15000;
  var MINE_KEY = "bm-qb-mine";
  var LIKED_KEY = "bm-qb-liked";
  var STARTERS = ["למה", "איך ייתכן ש", "מה היה קורה אם", "מה הכוונה ב", "האם"];
  var COLORS = ["#FFF3B8", "#FFD9E1", "#D6ECFF", "#D9F5E3", "#EBDFFF", "#FFE2C6"];

  var items = [];
  var lastJson = "";
  var timer = null;

  function teacherToken(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  function readSet(key){ try{ return JSON.parse(localStorage.getItem(key) || "[]"); }catch(e){ return []; } }
  function addToSet(key, v){
    var a = readSet(key);
    if(a.indexOf(v) === -1){ a.push(v); if(a.length > 300) a = a.slice(-300); }
    try{ localStorage.setItem(key, JSON.stringify(a)); }catch(e){}
  }
  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  }
  function ago(t){
    var s = Math.max(0, (Date.now() - t) / 1000);
    if(s < 60) return "עכשיו";
    var m = Math.round(s / 60);
    if(m < 60) return m === 1 ? "לפני דקה" : "לפני " + m + " דקות";
    var h = Math.round(m / 60);
    if(h < 24) return h === 1 ? "לפני שעה" : (h === 2 ? "לפני שעתיים" : "לפני " + h + " שעות");
    var d = new Date(t);
    return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
  }
  function colorOf(id){
    var h = 0;
    for(var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  function get(params){
    return fetch(API + "?" + new URLSearchParams(params).toString()).then(function(r){ return r.json(); });
  }
  function post(data){
    return fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(data) })
      .then(function(r){ return r.json(); });
  }

  /* ---------- עיצוב ---------- */
  var css =
    ".qw-intro{margin:0 0 12px;color:var(--ink-soft,#4B6577);font-size:1rem;line-height:1.6}" +
    ".qw-form{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px dashed var(--gold-soft,#C99A4C);border-radius:14px;background:rgba(255,255,255,.65)}" +
    ".qw-row{display:flex;flex-wrap:wrap;gap:10px}" +
    ".qw-field{display:flex;flex-direction:column;gap:4px;min-width:0}" +
    ".qw-field--name{flex:0 1 220px}.qw-field--q{flex:1 1 100%}" +
    ".qw-label{font-weight:700;font-size:.95rem;color:var(--ink,#1F3A4D)}" +
    ".qw-input,.qw-text{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #B9A57E;border-radius:10px;background:#fff;color:#1F2A33;font:inherit;font-size:1rem}" +
    ".qw-text{min-height:78px;resize:vertical;line-height:1.5}" +
    ".qw-input:focus-visible,.qw-text:focus-visible,.qw-btn:focus-visible,.qw-chip:focus-visible,.qw-act:focus-visible{outline:3px solid var(--focus-ring,#1857C4);outline-offset:2px}" +
    ".qw-starters{display:flex;flex-wrap:wrap;align-items:center;gap:6px}" +
    ".qw-starters-label{font-size:.88rem;color:var(--ink-soft,#4B6577)}" +
    ".qw-chip{min-height:34px;padding:4px 12px;border:1px solid #D8C9A3;border-radius:999px;background:#fff;color:var(--ink,#1F3A4D);font:inherit;font-size:.9rem;cursor:pointer}" +
    ".qw-chip:hover{background:#FBF3E2}" +
    ".qw-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px}" +
    ".qw-btn{min-height:46px;padding:10px 20px;border:0;border-radius:12px;background:var(--ink,#1F3A4D);color:#fff;font:inherit;font-weight:700;font-size:1rem;cursor:pointer}" +
    ".qw-btn:disabled{opacity:.6;cursor:default}" +
    ".qw-count{font-size:.85rem;color:var(--ink-soft,#4B6577);font-variant-numeric:tabular-nums}" +
    ".qw-msg{margin:0;font-size:.95rem;color:#8B2E1F}.qw-msg.is-ok{color:#1F7A4D}.qw-msg:empty{display:none}" +
    ".qw-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px;margin:18px 0 10px}" +
    ".qw-total{font-weight:700;color:var(--ink,#1F3A4D)}" +
    ".qw-live{font-size:.85rem;color:var(--ink-soft,#4B6577)}" +
    ".qw-wall{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;align-items:start}" +
    ".qw-note{box-sizing:border-box;min-width:0;padding:12px 14px 10px;border-radius:4px 4px 14px 4px;" +
      "box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px rgba(60,40,10,.10);color:#1F2A33}" +
    ".qw-note.is-new{animation:qwIn .35s ease-out}" +
    "@keyframes qwIn{from{transform:translateY(-6px) scale(.98);opacity:.2}to{transform:none;opacity:1}}" +
    "@media (prefers-reduced-motion:reduce){.qw-note.is-new{animation:none}}" +
    ".qw-q{margin:0 0 8px;font-size:1.05rem;line-height:1.5;font-weight:600;overflow-wrap:anywhere}" +
    ".qw-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:.82rem;color:#4A4F57}" +
    ".qw-name{font-weight:700}" +
    ".qw-mine{padding:1px 7px;border-radius:999px;background:rgba(255,255,255,.7);font-size:.75rem;font-weight:700}" +
    ".qw-done{display:inline-block;margin:0 0 6px;padding:2px 8px;border-radius:999px;background:#1F7A4D;color:#fff;font-size:.76rem;font-weight:700}" +
    ".qw-note.is-done .qw-q{opacity:.75}" +
    ".qw-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}" +
    ".qw-act{min-height:34px;padding:4px 10px;border:1px solid rgba(0,0,0,.14);border-radius:999px;background:rgba(255,255,255,.75);color:#1F2A33;font:inherit;font-size:.85rem;cursor:pointer}" +
    ".qw-act:hover{background:#fff}.qw-act[aria-pressed=true]{background:#1F3A4D;color:#fff;border-color:#1F3A4D}" +
    ".qw-act:disabled{cursor:default;opacity:.8}" +
    ".qw-act--del{color:#8B2E1F}" +
    ".qw-empty{padding:22px;text-align:center;border:1px dashed #D8C9A3;border-radius:14px;color:var(--ink-soft,#4B6577)}" +
    ".qw-teacher{margin:0 0 10px;padding:6px 12px;border-radius:10px;background:#E4EEEA;color:#1F5A4D;font-size:.9rem}" +
    ".qw-teacher a{color:#123A78;font-weight:700;white-space:nowrap}" +
    "@media print{.qw-form,.qw-acts,.qw-live{display:none}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- מבנה ---------- */
  var savedName = "";
  try{ savedName = localStorage.getItem("bm-qb-name") || localStorage.getItem("bm-lesson-name") || ""; }catch(e){}
  body.innerHTML =
    '<p class="qw-intro">קראתם את התקציר? כתבו <b>שאלה אחת</b> שעלתה לכם - משהו שלא הבנתם, שהפתיע אתכם או שמעניין אתכם לדעת. כל הכיתה רואה את השאלות, ונדבר עליהן בשיעור.</p>' +
    (teacherToken() ? '<p class="qw-teacher">🗝️ אתם מחוברים כמורה: אפשר לסמן שאלה "נדון בכיתה" או למחוק אותה. ' +
      '<a href="screen.html?board=' + encodeURIComponent(board) + '" target="_blank" rel="noopener">📺 הצגת הלוח על המקרן</a></p>' : '') +
    '<form class="qw-form" novalidate>' +
      '<div class="qw-row">' +
        '<div class="qw-field qw-field--name"><label class="qw-label" for="qwName">השם שלכם</label>' +
          '<input class="qw-input" id="qwName" type="text" maxlength="40" autocomplete="name" value="' + esc(savedName) + '"></div>' +
        '<div class="qw-field qw-field--q"><label class="qw-label" for="qwText">השאלה שלכם</label>' +
          '<textarea class="qw-text" id="qwText" maxlength="' + MAX + '" placeholder="לדוגמה: למה ה\' לא אומר לאברם לאן הוא הולך?"></textarea></div>' +
      '</div>' +
      '<div class="qw-starters" role="group" aria-label="פתיחי משפט"><span class="qw-starters-label">לא יודעים איך להתחיל? בחרו:</span>' +
        STARTERS.map(function(s){ return '<button type="button" class="qw-chip" data-starter="' + esc(s) + '">' + esc(s) + '…</button>'; }).join("") +
      '</div>' +
      '<div class="qw-foot">' +
        '<button type="submit" class="qw-btn" id="qwSend">הוספת השאלה ללוח</button>' +
        '<span class="qw-count" id="qwCount" aria-live="polite">0/' + MAX + '</span>' +
      '</div>' +
      '<p class="qw-msg" id="qwMsg" role="status" aria-live="polite"></p>' +
    '</form>' +
    '<div class="qw-head"><span class="qw-total" id="qwTotal" aria-live="polite"></span><span class="qw-live">הלוח מתעדכן לבד</span></div>' +
    '<ul class="qw-wall" id="qwWall" aria-label="שאלות הכיתה"></ul>' +
    '<p class="qw-empty" id="qwEmpty" hidden>עוד אין שאלות בלוח. תהיו הראשונים!</p>';

  var form = body.querySelector(".qw-form");
  var nameEl = body.querySelector("#qwName");
  var textEl = body.querySelector("#qwText");
  var sendBtn = body.querySelector("#qwSend");
  var countEl = body.querySelector("#qwCount");
  var msgEl = body.querySelector("#qwMsg");
  var wall = body.querySelector("#qwWall");
  var emptyEl = body.querySelector("#qwEmpty");
  var totalEl = body.querySelector("#qwTotal");

  function setMsg(text, ok){ msgEl.textContent = text || ""; msgEl.classList.toggle("is-ok", !!ok); }

  textEl.addEventListener("input", function(){ countEl.textContent = textEl.value.length + "/" + MAX; setMsg(""); });
  body.querySelector(".qw-starters").addEventListener("click", function(e){
    var b = e.target.closest("[data-starter]");
    if(!b) return;
    var cur = textEl.value.trim();
    var isStarter = STARTERS.some(function(s){ return cur === s; });
    if(!cur || isStarter) textEl.value = b.getAttribute("data-starter") + " ";
    textEl.focus();
    textEl.setSelectionRange(textEl.value.length, textEl.value.length);
    countEl.textContent = textEl.value.length + "/" + MAX;
  });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var name = nameEl.value.replace(/\s+/g, " ").trim();
    var text = textEl.value.replace(/\s+/g, " ").trim();
    if(name.length < 2){ setMsg("כתבו את השם שלכם."); nameEl.focus(); return; }
    if(text.length < 4 || STARTERS.indexOf(text) !== -1){ setMsg("כתבו את השאלה עד הסוף."); textEl.focus(); return; }
    sendBtn.disabled = true;
    setMsg("שולחים…", true);
    post({ action:"qbAdd", board:board, name:name, text:text }).then(function(res){
      sendBtn.disabled = false;
      if(!res || !res.ok){ setMsg((res && res.error) || "השליחה לא הצליחה. נסו שוב."); return; }
      try{ localStorage.setItem("bm-qb-name", name); }catch(err){}
      addToSet(MINE_KEY, res.item.id);
      items = [res.item].concat(items.filter(function(x){ return x.id !== res.item.id; }));
      lastJson = "";
      render(res.item.id);
      textEl.value = "";
      countEl.textContent = "0/" + MAX;
      setMsg("✓ השאלה שלכם נוספה ללוח.", true);
    }).catch(function(){
      sendBtn.disabled = false;
      setMsg("אין חיבור לאינטרנט כרגע. נסו שוב.");
    });
  });

  /* ---------- הלוח ---------- */
  function render(newId){
    var json = JSON.stringify(items);
    if(json === lastJson && !newId) return;
    lastJson = json;
    var mine = readSet(MINE_KEY), liked = readSet(LIKED_KEY);
    var isTeacher = !!teacherToken();
    totalEl.textContent = items.length ? (items.length === 1 ? "שאלה אחת בלוח" : items.length + " שאלות בלוח") : "";
    emptyEl.hidden = items.length > 0;
    wall.innerHTML = items.map(function(it){
      var isMine = mine.indexOf(it.id) !== -1;
      var didLike = liked.indexOf(it.id) !== -1;
      var likeLabel = "🙋 גם אני שואל/ת" + (it.likes ? " · " + it.likes : "");
      return '<li class="qw-note' + (it.done ? " is-done" : "") + (it.id === newId ? " is-new" : "") + '" style="background:' + colorOf(it.id) + '" data-id="' + esc(it.id) + '">' +
        (it.done ? '<span class="qw-done">✓ נדון בכיתה</span>' : '') +
        '<p class="qw-q">' + esc(it.text) + '</p>' +
        '<div class="qw-meta"><span class="qw-name">' + esc(it.name) + '</span><span>' + esc(ago(it.t)) + '</span>' +
          (isMine ? '<span class="qw-mine">השאלה שלכם</span>' : '') + '</div>' +
        '<div class="qw-acts">' +
          (isMine ? (it.likes ? '<span class="qw-act" aria-label="' + it.likes + ' תלמידים שואלים גם">🙋 ' + it.likes + '</span>' : '')
                  : '<button type="button" class="qw-act" data-act="like" aria-pressed="' + didLike + '"' + (didLike ? " disabled" : "") + '>' + likeLabel + '</button>') +
          (isTeacher ? '<button type="button" class="qw-act" data-act="done" aria-pressed="' + it.done + '">' + (it.done ? "בטל סימון" : "✓ נדון בכיתה") + '</button>' +
                       '<button type="button" class="qw-act qw-act--del" data-act="del">🗑 מחיקה</button>' : '') +
        '</div>' +
      '</li>';
    }).join("");
  }

  wall.addEventListener("click", function(e){
    var b = e.target.closest("[data-act]");
    if(!b) return;
    var li = b.closest(".qw-note");
    var id = li.getAttribute("data-id");
    var it = items.filter(function(x){ return x.id === id; })[0];
    if(!it) return;
    var act = b.getAttribute("data-act");
    if(act === "like"){
      if(readSet(LIKED_KEY).indexOf(id) !== -1) return;
      addToSet(LIKED_KEY, id);
      it.likes = (it.likes || 0) + 1;
      render();
      post({ action:"qbLike", board:board, id:id }).then(function(res){
        if(res && res.ok){ it.likes = res.likes; render(); }
      }).catch(function(){});
    } else if(act === "done" || act === "del"){
      if(act === "del" && !confirm("למחוק את השאלה מהלוח?")) return;
      b.disabled = true;
      var req = act === "del" ? { action:"qbDelete", board:board, id:id, password:teacherToken() }
                              : { action:"qbMark", board:board, id:id, done:!it.done, password:teacherToken() };
      post(req).then(function(res){
        b.disabled = false;
        if(res && res.auth === false){ alert("צריך להיכנס שוב לאזור האישי בדף הבית."); return; }
        if(!res || (!res.ok && !res.gone)){ alert((res && res.error) || "הפעולה לא הצליחה."); return; }
        if(act === "del" || res.gone) items = items.filter(function(x){ return x.id !== id; });
        else it.done = res.done;
        render();
      }).catch(function(){ b.disabled = false; alert("אין חיבור לאינטרנט כרגע."); });
    }
  });

  function load(){
    return get({ action:"qbList", board:board }).then(function(res){
      if(!res || !res.ok){ totalEl.textContent = (res && res.error) || ""; return; }
      items = res.items || [];
      render();
    }).catch(function(){ totalEl.textContent = "אין חיבור לשרת כרגע - השאלות יופיעו כשהחיבור יחזור."; });
  }
  load();
  timer = setInterval(function(){ if(document.visibilityState === "visible") load(); }, POLL_MS);
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "visible") load(); });
  /* "לפני X דקות" מתעדכן גם בלי שאלות חדשות */
  setInterval(function(){ lastJson = ""; render(); }, 60000);
})();
