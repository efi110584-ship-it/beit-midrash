/* ============================================================
   פעילות חיה - הצד של המורה (הפעלה, תוצאות, עצירה)
   ============================================================
   window.BM_LIVETEACHER.mount(container, opts) בונה בתוך container:
   - בחירת סוג: ענן מילים / הצבעה על דילמה / סקר (עם בונה שאלות)
   - בזמן שהפעילות רצה: התוצאות מתעדכנות, עצירה, סיום, הצגה על המקרן
   משמש את האזור האישי בדף הבית (לשונית "בשיעור") ואת החלון שנפתח
   מסרגל הכלים בצד המסך (assets/class-dock.js).
   צריך את assets/live-render.js ואת assets/bm-api.js. כל פעולה נשלחת
   עם הסיסמה שנשמרה בכניסה לאזור האישי (sessionStorage).
   opts: {
     type: "cloud" | "poll" | "survey"  - הסוג שנבחר מראש
     header: true - כותרת "פעילות חיה" עם כפתור המקרן
     isActive: () => bool - לבדוק תוצאות רק כשהחלון גלוי
     onAuthFail: (res) => void - הסיסמה כבר לא בתוקף
   }
   בראש הרכיב - "לאיזו כיתה": הקוד של השיעור שהפעילות שייכת לו. התלמידים של
   הקוד הזה בלבד יראו את הפעילות, כך שכמה מורים יכולים להפעיל במקביל.
   window.BM_LIVETEACHER.roomPicker(container, onChange) - אותה בחירה, גם ללוח
   השאלות בסרגל הכלים.
   ============================================================ */
(function(){
  "use strict";
  if(window.BM_LIVETEACHER) return;

  var PLACEHOLDER = {
    cloud:'לדוגמה: מילה אחת שמתארת את אברהם בפרק י"ב',
    poll:'לדוגמה: האם אברם צדק כשביקש משרי לומר שהיא אחותו?',
    survey:'לדוגמה: משוב על השיעור'
  };
  var TYPES = [
    ["cloud", "☁️", "ענן מילים", "כל תלמיד כותב עד 3 מילים"],
    ["poll", "🗳️", "הצבעה על דילמה", "בוחרים תשובה ומנמקים במשפט"],
    ["survey", "📋", "סקר", "כמה שאלות: בחירה, דירוג 1-5, פתוחה"]
  ];
  var SQ_KINDS = [["choice","בחירה מכמה אפשרויות"],["scale","דירוג 1-5"],["text","תשובה פתוחה"]];
  var SURVEY_TEMPLATE = [
    { q:"עד כמה השיעור היה ברור לך?", kind:"scale" },
    { q:"מה הכי עזר לך ללמוד היום?", kind:"choice", options:["ההסבר של המורה","דף העבודה","העבודה בזוגות","השאלות של חברים"] },
    { q:"מה עדיין לא ברור לך?", kind:"text" }
  ];

  function token(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  }
  function post(body){
    body.password = token();
    return fetch(window.BM_API_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); });
  }

  var css =
    ".lt{display:flex;flex-direction:column;gap:12px;color:#0E1B33;font-family:Heebo,Rubik,Arial,sans-serif;line-height:1.5}" +
    ".lt *{box-sizing:border-box}.lt [hidden]{display:none !important}" +
    ".lt .vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
    ".lt-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}" +
    ".lt-h{margin:0;font-family:'Frank Ruhl Libre',serif;font-size:1.35rem;font-weight:700;color:#123A78}" +
    ".lt-sub{margin:0;font-size:.92rem;color:#4E5B72}" +
    ".lt-label{font-weight:700;font-size:.95rem}" +
    ".lt-in{width:100%;padding:10px 12px;border:1px solid #9FB3D6;border-radius:10px;font:inherit;font-size:1rem;color:#0E1B33;background:#fff}" +
    ".lt-btns{display:flex;flex-wrap:wrap;gap:8px}" +
    ".lt-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 16px;border:1px solid #DCE4F1;border-radius:10px;background:#fff;color:#123A78;font:inherit;font-weight:700;font-size:.95rem;cursor:pointer;text-decoration:none}" +
    ".lt-btn:hover{background:#F4F7FC}.lt-btn:disabled{opacity:.6;cursor:default}" +
    ".lt-btn--primary{background:#123A78;border-color:#123A78;color:#fff}.lt-btn--primary:hover{background:#0B2A5B}" +
    ".lt-btn--small{min-height:36px;padding:5px 12px;font-size:.88rem}" +
    ".lt-btn--quiet{border-color:transparent;background:transparent;color:#56637A}" +
    ".lt-btn:focus-visible,.lt-type:focus-visible,.lt-in:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
    ".lt-types{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}" +
    ".lt-type{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center;padding:10px 12px;border:2px solid #DCE4F1;border-radius:12px;background:#fff;color:#0E1B33;font:inherit;text-align:right;cursor:pointer}" +
    ".lt-type .ico{grid-row:1/3;font-size:1.6rem}.lt-type b{color:#123A78}.lt-type small{font-size:.8rem;color:#4E5B72}" +
    ".lt-type[aria-pressed=true]{border-color:#123A78;background:#F4F7FC;box-shadow:inset 0 0 0 1px #123A78}" +
    ".lt-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px}" +
    ".lt-sqs{margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:8px}" +
    ".lt-sq{display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid #DCE4F1;border-radius:10px;background:#FBFCFE}" +
    ".lt-sq-top{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.lt-sq-top .lt-sq-q{flex:1 1 200px}.lt-sq-top select{flex:0 1 170px;width:auto}" +
    ".lt-check{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid #DCE4F1;border-radius:10px;background:#F4F7FC;font-size:.9rem;cursor:pointer}" +
    ".lt-check input{width:18px;height:18px;margin-top:2px;flex:none;accent-color:#123A78}" +
    ".lt-now{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0;font-size:1.05rem}" +
    ".lt-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:.82rem;font-weight:700;white-space:nowrap}" +
    ".lt-pill--on{background:#DDF3EA;color:#0A6B4C}.lt-pill--off{background:#FFEBDC;color:#8A3D07}" +
    ".lt-results{padding:10px;border:1px solid #DCE4F1;border-radius:12px;background:#FBFCFE;display:flex;flex-direction:column;gap:12px}" +
    ".lt-people summary{cursor:pointer;font-weight:700;color:#123A78;min-height:36px;display:flex;align-items:center}" +
    ".lt-plist{margin:6px 0 0;padding-inline-start:20px;columns:200px;font-size:.92rem}" +
    ".lt-note{margin:0;font-size:.88rem;color:#4E5B72}" +
    ".lt-msg{margin:0;font-size:.95rem;color:#4E5B72}.lt-msg:empty{display:none}" +
    ".lt-room{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:10px 12px;border:1px solid #F3C9A4;border-radius:12px;background:#FFF6EE;font-family:Heebo,Rubik,Arial,sans-serif;font-size:.95rem;color:#0E1B33}" +
    ".lt-room label{font-weight:700}" +
    ".lt-room select{flex:1 1 220px;min-height:40px;padding:6px 10px;border:1px solid #9FB3D6;border-radius:10px;font:inherit;background:#fff;color:#0E1B33}" +
    ".lt-room select:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
    ".lt-room small{flex-basis:100%;font-size:.82rem;color:#5B4A3A}";

  function ensureCss(){
    if(document.getElementById("ltStyle")) return;
    var st = document.createElement("style"); st.id = "ltStyle"; st.textContent = css; document.head.appendChild(st);
  }
  var TR = {   /* assets/bm-api.js */
    get:function(){ return window.BM_TEACHER_ROOM ? window.BM_TEACHER_ROOM.get() : ""; },
    set:function(c, u){ if(window.BM_TEACHER_ROOM) window.BM_TEACHER_ROOM.set(c, u); }
  };
  function room(){ return TR.get(); }
  function screenUrl(extra){
    var q = [];
    if(room()) q.push("room=" + encodeURIComponent(room()));
    if(extra) q.push(extra);
    return "screen.html" + (q.length ? "?" + q.join("&") : "");
  }

  /* ---------- "לאיזו כיתה" - בחירת הקוד ---------- */
  var pickerUid = 0;
  function roomPicker(box, onChange){
    ensureCss();
    var id = "ltRoom" + (++pickerUid);
    box.classList.add("lt-room");
    box.innerHTML = '<label for="' + id + '">🎯 לאיזו כיתה?</label><select id="' + id + '"><option value="">טוען את הקודים…</option></select>' +
      '<small>רק התלמידים שנכנסו עם הקוד הזה יראו את מה שתפעילו. כך מורה אחר שמפעיל משהו לכיתה שלו לא יחליף את שלכם.</small>';
    var sel = box.querySelector("select");
    var lessons = [];
    function fill(){
      var cur = room();
      if(cur && !lessons.some(function(l){ return l.code === cur; })){ TR.set(""); cur = ""; }
      sel.innerHTML = lessons.map(function(l){
        return '<option value="' + esc(l.code) + '">קוד ' + esc(l.code) + (l.label ? ' · ' + esc(l.label) : '') + '</option>';
      }).join("") + '<option value="">כל התלמידים באתר (בלי קוד)</option>';
      sel.value = cur;
    }
    function refresh(){
      return post({ action:"lessonsList" }).then(function(res){
        if(!res || !res.ok) return;
        var before = room();
        lessons = res.lessons || [];
        fill();
        if(room() !== before && onChange) onChange(room());
      }).catch(function(){});
    }
    sel.addEventListener("change", function(){
      var l = lessons.filter(function(x){ return x.code === sel.value; })[0];
      TR.set(sel.value, l && l.until);
      if(onChange) onChange(room());
    });
    refresh();
    return { refresh:refresh };
  }

  var uid = 0;
  function mount(root, opts){
    opts = opts || {};
    ensureCss();
    uid++;
    var P = "lt" + uid + "-";
    var $ = function(id){ return root.querySelector("#" + P + id); };
    var type = opts.type || "cloud";
    var state = null;
    var L = window.BM_LIVE;

    root.classList.add("lt");
    root.innerHTML =
      (opts.header ? '<div class="lt-head"><h3 class="lt-h">פעילות חיה</h3>' +
        '<a class="lt-btn lt-screen" href="screen.html" target="_blank" rel="noopener">📺 הצג על המקרן</a></div>' : '') +
      '<div id="' + P + 'room"></div>' +
      '<div id="' + P + 'new" class="lt" style="gap:10px">' +
        '<p class="lt-sub">התלמידים רואים את הפעילות בסרגל הכלים בצד המסך, בכל דף שהם נמצאים בו (וגם בכפתור האדום בדף הבית). התוצאות מתעדכנות כאן ועל המקרן.</p>' +
        '<div class="lt-types" role="group" aria-label="סוג הפעילות">' + TYPES.map(function(t){
          return '<button type="button" class="lt-type" data-type="' + t[0] + '" aria-pressed="false"><span class="ico" aria-hidden="true">' + t[1] + '</span><b>' + t[2] + '</b><small>' + t[3] + '</small></button>';
        }).join("") + '</div>' +
        '<label for="' + P + 'prompt" class="lt-label" id="' + P + 'promptLabel">השאלה לתלמידים</label>' +
        '<input id="' + P + 'prompt" class="lt-in" type="text" maxlength="160">' +
        '<div id="' + P + 'optsWrap" class="lt" style="gap:6px" hidden>' +
          '<span class="lt-label" id="' + P + 'optsLabel">האפשרויות (2 עד 4)</span>' +
          '<div class="lt-opts" role="group" aria-labelledby="' + P + 'optsLabel">' + ["כן", "לא", "תלוי", ""].map(function(v, i){
            return '<input id="' + P + 'opt' + i + '" class="lt-in" type="text" maxlength="40" aria-label="אפשרות ' + (i + 1) + '" value="' + v + '"' + (i === 3 ? ' placeholder="רביעית (לא חובה)"' : '') + '>';
          }).join("") + '</div>' +
        '</div>' +
        '<div id="' + P + 'survey" class="lt" style="gap:8px" hidden>' +
          '<div class="lt-btns"><button type="button" class="lt-btn lt-btn--small" id="' + P + 'tpl">✨ מילוי לדוגמה: משוב על השיעור</button></div>' +
          '<ol class="lt-sqs" id="' + P + 'sqs"></ol>' +
          '<div class="lt-btns"><button type="button" class="lt-btn lt-btn--small" id="' + P + 'sqAdd">+ הוספת שאלה</button></div>' +
          '<label class="lt-check"><input type="checkbox" id="' + P + 'anon"> <span><b>סקר אנונימי</b> - התלמידים לא כותבים שם, וגם אתם לא תראו מי ענה מה.</span></label>' +
        '</div>' +
        '<div class="lt-btns"><button type="button" class="lt-btn lt-btn--primary" id="' + P + 'start">הפעלה לתלמידים</button></div>' +
      '</div>' +
      '<div id="' + P + 'run" class="lt" style="gap:10px" hidden>' +
        '<p class="lt-now"><span class="lt-pill" id="' + P + 'badge"></span><b id="' + P + 'nowPrompt"></b></p>' +
        '<div class="lt-btns">' +
          '<button type="button" class="lt-btn" id="' + P + 'toggle"></button>' +
          '<button type="button" class="lt-btn" id="' + P + 'clear">סיום הפעילות</button>' +
          (opts.header ? '' : '<a class="lt-btn lt-screen" href="screen.html" target="_blank" rel="noopener">📺 על המקרן</a>') +
        '</div>' +
        '<div class="lt-results" id="' + P + 'results" aria-live="polite"></div>' +
        '<details class="lt-people"><summary id="' + P + 'peopleSum">מי ענה</summary><div id="' + P + 'people"></div></details>' +
      '</div>' +
      '<p class="lt-msg" id="' + P + 'msg" role="status" aria-live="polite"></p>';

    var msg = $("msg"), prompt = $("prompt");
    function authFail(res){
      if(res && res.auth === false){
        if(opts.onAuthFail) opts.onAuthFail(res); else msg.textContent = "הסיסמה לא בתוקף - צריך להיכנס שוב לאזור האישי בדף הבית.";
        return true;
      }
      return false;
    }
    function netErr(){ msg.textContent = "אין חיבור לשרת כרגע. בדקו את האינטרנט ונסו שוב."; }

    /* ---------- בונה הסקר ---------- */
    function sqRow(q, i){
      q = q || { q:"", kind:"choice", options:[] };
      return '<li class="lt-sq" data-i="' + i + '"><div class="lt-sq-top">' +
        '<label class="vh" for="' + P + 'sqQ' + i + '">שאלה ' + (i + 1) + '</label>' +
        '<input id="' + P + 'sqQ' + i + '" class="lt-in lt-sq-q" type="text" maxlength="160" placeholder="השאלה" value="' + esc(q.q) + '">' +
        '<label class="vh" for="' + P + 'sqK' + i + '">סוג שאלה ' + (i + 1) + '</label>' +
        '<select id="' + P + 'sqK' + i + '" class="lt-in lt-sq-kind">' + SQ_KINDS.map(function(k){
          return '<option value="' + k[0] + '"' + (q.kind === k[0] ? " selected" : "") + '>' + k[1] + '</option>';
        }).join("") + '</select>' +
        '<button type="button" class="lt-btn lt-btn--small lt-btn--quiet lt-sq-del" aria-label="מחיקת שאלה ' + (i + 1) + '">✕</button></div>' +
        '<label class="vh" for="' + P + 'sqO' + i + '">אפשרויות לשאלה ' + (i + 1) + '</label>' +
        '<input id="' + P + 'sqO' + i + '" class="lt-in lt-sq-opts" type="text" maxlength="250" placeholder="האפשרויות, מופרדות בפסיק: כן, לא, לא בטוח"' +
          ' value="' + esc((q.options || []).join(", ")) + '"' + (q.kind === "choice" ? "" : " hidden") + '></li>';
    }
    function readSurvey(){
      return Array.prototype.map.call(root.querySelectorAll(".lt-sq"), function(li){
        var kind = li.querySelector(".lt-sq-kind").value;
        var q = { q:li.querySelector(".lt-sq-q").value.trim(), kind:kind };
        if(kind === "choice") q.options = li.querySelector(".lt-sq-opts").value.split(/[,،]/).map(function(o){ return o.trim(); }).filter(Boolean);
        return q;
      });
    }
    function renderRows(list){
      $("sqs").innerHTML = list.map(sqRow).join("");
      $("sqAdd").disabled = list.length >= 8;
    }
    $("sqAdd").addEventListener("click", function(){
      var list = readSurvey(); list.push({ q:"", kind:"choice", options:[] }); renderRows(list);
      var last = root.querySelector(".lt-sq:last-child .lt-sq-q"); if(last) last.focus();
    });
    $("tpl").addEventListener("click", function(){
      if(!prompt.value.trim()) prompt.value = "משוב על השיעור";
      renderRows(SURVEY_TEMPLATE);
    });
    $("sqs").addEventListener("change", function(e){
      if(!e.target.classList.contains("lt-sq-kind")) return;
      e.target.closest(".lt-sq").querySelector(".lt-sq-opts").hidden = e.target.value !== "choice";
    });
    $("sqs").addEventListener("click", function(e){
      var del = e.target.closest(".lt-sq-del"); if(!del) return;
      var list = readSurvey();
      list.splice(Number(del.closest(".lt-sq").getAttribute("data-i")), 1);
      renderRows(list.length ? list : [{ q:"", kind:"scale" }]);
    });

    /* ---------- סוג ---------- */
    var typeBtns = Array.prototype.slice.call(root.querySelectorAll(".lt-type"));
    function setType(t){
      type = t;
      typeBtns.forEach(function(b){ b.setAttribute("aria-pressed", String(b.getAttribute("data-type") === t)); });
      prompt.placeholder = PLACEHOLDER[t];
      $("optsWrap").hidden = t !== "poll";
      $("survey").hidden = t !== "survey";
      $("promptLabel").textContent = t === "survey" ? "כותרת הסקר" : "השאלה לתלמידים";
      if(t === "survey" && !root.querySelector(".lt-sq")) renderRows([{ q:"", kind:"scale" }]);
    }
    typeBtns.forEach(function(b){ b.addEventListener("click", function(){ setType(b.getAttribute("data-type")); }); });
    setType(type);

    /* ---------- הפעלה / עצירה / סיום ---------- */
    $("start").addEventListener("click", function(){
      var text = prompt.value.trim();
      if(text.length < 3){ msg.textContent = type === "survey" ? "כתבו כותרת לסקר." : "כתבו את השאלה לתלמידים."; prompt.focus(); return; }
      var opts4 = [0, 1, 2, 3].map(function(i){ return $("opt" + i).value.trim(); }).filter(Boolean);
      if(type === "poll" && opts4.length < 2){ msg.textContent = "צריך לפחות שתי אפשרויות."; return; }
      var questions = type === "survey" ? readSurvey().filter(function(q){ return q.q; }) : [];
      if(type === "survey"){
        if(!questions.length){ msg.textContent = "כתבו לפחות שאלה אחת לסקר."; return; }
        var bad = questions.filter(function(q){ return q.kind === "choice" && q.options.length < 2; })[0];
        if(bad){ msg.textContent = 'בשאלה "' + bad.q + '" צריך לפחות שתי אפשרויות, מופרדות בפסיק.'; return; }
      }
      var btn = this; btn.disabled = true; msg.textContent = "מפעילים…";
      post({ action:"actStart", type:type, prompt:text, options:opts4, questions:questions, anonymous:$("anon").checked, room:room() }).then(function(res){
        btn.disabled = false;
        if(authFail(res)) return;
        if(!res || !res.ok){ msg.textContent = (res && res.error) || "ההפעלה לא הצליחה."; return; }
        msg.textContent = "✓ הפעילות פועלת. התלמידים יכולים לענות.";
        prompt.value = "";
        render(res);
        if(opts.onChange) opts.onChange();
      }).catch(function(){ btn.disabled = false; netErr(); });
    });
    $("toggle").addEventListener("click", function(){
      if(!state || !state.activity) return;
      var btn = this; btn.disabled = true;
      post({ action:"actOpen", open:!state.activity.open, room:room() }).then(function(res){
        btn.disabled = false;
        if(authFail(res)) return;
        if(res && res.ok){ state.activity = res.activity; render(state); if(opts.onChange) opts.onChange(); }
      }).catch(function(){ btn.disabled = false; netErr(); });
    });
    $("clear").addEventListener("click", function(){
      if(!confirm("לסיים את הפעילות? התשובות של התלמידים יימחקו.")) return;
      var btn = this; btn.disabled = true;
      post({ action:"actClear", room:room() }).then(function(res){
        btn.disabled = false;
        if(authFail(res)) return;
        msg.textContent = res && res.ok ? "✓ הפעילות הסתיימה. אפשר להפעיל פעילות חדשה." : ((res && res.error) || "לא הצליח.");
        render({ activity:null });
        if(opts.onChange) opts.onChange();
      }).catch(function(){ btn.disabled = false; netErr(); });
    });

    /* ---------- תוצאות ---------- */
    function render(res){
      state = res;
      var a = res.activity;
      $("new").hidden = !!a;
      $("run").hidden = !a;
      if(!a) return;
      var r = res.results || {};
      var badge = $("badge");
      badge.className = "lt-pill " + (a.open ? "lt-pill--on" : "lt-pill--off");
      badge.textContent = (a.type === "cloud" ? "☁️ ענן מילים" : (a.type === "survey" ? "📋 סקר" + (a.anonymous ? " אנונימי" : "") : "🗳️ הצבעה")) + " · " + (a.open ? "פתוח לתשובות" : "התשובות נעצרו");
      $("nowPrompt").textContent = a.prompt;
      $("toggle").textContent = a.open ? "⏸ עצירת התשובות" : "▶ פתיחה מחדש";
      $("results").innerHTML = !L ? "" : a.type === "survey" ? L.surveyHtml(a, r, "small", { showTexts:true, withNames:!a.anonymous, limit:80 })
        : a.type === "cloud" ? L.cloudHtml(r.words, "small")
        : L.pollHtml(a, r, "small") + L.reasonsHtml(a, r, "small", true, 40);
      var people = r.people || [];
      $("peopleSum").textContent = "מי ענה (" + (a.anonymous ? (r.count || 0) : people.length) + ")";
      $("people").innerHTML = a.anonymous ? '<p class="lt-note">סקר אנונימי - השמות לא נשמרים.</p>'
        : people.length ? '<ul class="lt-plist">' + people.map(function(p){
          var ans = a.type === "survey" ? "" : (a.type === "cloud" ? (p.words || []).join(", ") : ((a.options || [])[p.o] || ""));
          return '<li><b>' + esc(p.name) + '</b>' + (ans ? ' - ' + esc(ans) : '') + '</li>';
        }).join("") + '</ul>' : '<p class="lt-note">עוד אף תלמיד לא ענה.</p>';
    }
    function links(){
      Array.prototype.forEach.call(root.querySelectorAll(".lt-screen"), function(a){ a.href = screenUrl(); });
    }
    var asked = "";
    function load(){
      var r = asked = room();
      links();
      return post({ action:"actResults", room:r }).then(function(res){
        if(r !== asked) return;   /* בינתיים בחרו כיתה אחרת */
        if(authFail(res)) return;
        if(res && res.ok) render(res);
      }).catch(function(){});
    }
    var picker = roomPicker($("room"), function(){ msg.textContent = ""; load(); });
    load();
    var timer = setInterval(function(){
      if(!root.isConnected){ clearInterval(timer); return; }
      if(document.visibilityState !== "visible" || !state || !state.activity) return;
      if(opts.isActive && !opts.isActive()) return;
      load();
    }, 5000);

    return {
      reload: load,
      refreshRooms: function(){ return picker.refresh().then(load); },
      setType: function(t){ if(!state || !state.activity) setType(t); },
      destroy: function(){ clearInterval(timer); root.innerHTML = ""; }
    };
  }

  window.BM_LIVETEACHER = { mount: mount, roomPicker: roomPicker, screenUrl: screenUrl };
})();
