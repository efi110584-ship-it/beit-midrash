/* ============================================================
   פעילות חיה - הצד של התלמיד (ענן מילים / הצבעה / סקר)
   ============================================================
   window.BM_LIVEWIDGET.mount(container, opts) בונה בתוך container את
   הפעילות שהמורה הפעיל, ובודק כל כמה שניות אם הפעילות הוחלפה או נסגרה.
   משמש את דף "פעילות בכיתה" (live.html) ואת החלון שנפתח מסרגל הכלים
   בצד המסך (assets/class-dock.js).
   צריך את assets/live-render.js (התוצאות) ואת assets/bm-api.js.
   opts: { compact: true בחלון הצד, onNone: כשאין יותר פעילות }
   ============================================================ */
(function(){
  "use strict";
  if(window.BM_LIVEWIDGET) return;

  var css =
    ".lw{--navy:#0B2A5B;--blue:#123A78;--orange:#FF7A1A;--ink:#0E1B33;--muted:#56637A;--line:#DCE4F1;--ok:#0D8A63;--err:#B42318;display:flex;flex-direction:column;gap:14px;color:var(--ink);font-family:Heebo,Rubik,Arial,sans-serif;line-height:1.55}" +
    ".lw *{box-sizing:border-box}" +
    ".lw [hidden]{display:none !important}" +
    ".lw .visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
    ".lw .lw-h{margin:0;font-family:'Frank Ruhl Libre',serif;font-size:1.75rem;line-height:1.3;color:var(--blue);text-wrap:balance}" +
    ".lw form{margin:0}" +
    ".lw.lw-compact .card{padding:14px;box-shadow:none;border-radius:14px}" +
    ".lw.lw-compact .lw-h{font-size:1.3rem}.lw.lw-compact .opt{min-height:50px;font-size:1rem}" +
    ".lw .card{background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px; box-shadow:0 4px 14px rgba(11,42,91,.08); display:flex; flex-direction:column; gap:14px;}" +
    ".lw .eyebrow{margin:0; font-size:.9rem; font-weight:700; color:var(--orange);}" +
    ".lw h1{margin:0; font-family:\"Frank Ruhl Libre\",serif; font-size:1.75rem; line-height:1.3; color:var(--blue); text-wrap:balance;}" +
    ".lw .hint{margin:0; color:var(--muted); font-size:.95rem;}" +
    ".lw label{font-weight:700; font-size:.95rem;}" +
    ".lw .field{display:flex; flex-direction:column; gap:5px;}" +
    ".lw input[type=text],.lw textarea{width:100%; padding:12px 14px; border:1px solid #9FB3D6; border-radius:12px; font:inherit; color:var(--ink); background:#fff;}" +
    ".lw textarea{min-height:70px; resize:vertical;}" +
    ".lw input:focus-visible,.lw textarea:focus-visible,.lw button:focus-visible,.lw a:focus-visible{outline:3px solid var(--orange); outline-offset:2px;}" +
    ".lw .row{display:flex; gap:8px;}" +
    ".lw .row input{flex:1 1 auto; min-width:0;}" +
    ".lw .btn{min-height:50px; padding:10px 22px; border:0; border-radius:12px; background:var(--blue); color:#fff; font:inherit; font-weight:700; font-size:1.05rem; cursor:pointer;}" +
    ".lw .btn:disabled{opacity:.55; cursor:default;}" +
    ".lw .opts{display:grid; gap:10px;}" +
    ".lw .opt{display:flex; align-items:center; gap:12px; min-height:58px; padding:10px 16px; border:2px solid var(--line); border-radius:14px; background:#fff; font:inherit; font-size:1.1rem; font-weight:700; color:var(--ink); cursor:pointer; text-align:right;}" +
    ".lw .opt::before{content:\"\"; flex:none; width:22px; height:22px; border-radius:50%; border:2px solid #9FB3D6;}" +
    ".lw .opt[aria-pressed=\"true\"]{border-color:var(--blue); background:#F4F7FC;}" +
    ".lw .opt[aria-pressed=\"true\"]::before{border-color:var(--blue); background:radial-gradient(circle, var(--blue) 45%, transparent 50%);}" +
    ".lw .sq{margin:0; padding:14px; border:1px solid var(--line); border-radius:14px; display:flex; flex-direction:column; gap:10px;}" +
    ".lw .sq + .sq{margin-top:12px;}" +
    ".lw .sq legend{padding:0 6px; font-weight:700; font-size:1.05rem; color:var(--ink);}" +
    ".lw .sq-n{display:inline-grid; place-items:center; width:1.6em; height:1.6em; margin-inline-end:6px; border-radius:50%; background:var(--blue); color:#fff; font-size:.85em;}" +
    ".lw .scale{display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;}" +
    ".lw .scale-btn{min-height:54px; border:2px solid var(--line); border-radius:12px; background:#fff; font:inherit; font-size:1.25rem; font-weight:700; color:var(--ink); cursor:pointer;}" +
    ".lw .scale-btn[aria-pressed=\"true\"]{border-color:var(--blue); background:var(--blue); color:#fff;}" +
    ".lw .scale-ends{display:flex; justify-content:space-between; font-size:.85rem; color:var(--muted);}" +
    ".lw .anon{margin:0; padding:8px 12px; border-radius:10px; background:#E4EEEA; color:#1F5A4D; font-size:.95rem;}" +
    ".lw .msg{margin:0; font-size:.98rem;}" +
    ".lw .msg.is-err{color:var(--err); } .msg.is-ok{ color:var(--ok);}" +
    ".lw .msg:empty{display:none;}" +
    ".lw .mine{display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:.95rem;}" +
    ".lw .chip{padding:3px 12px; border-radius:999px; background:#DDF3EA; color:#0A6B4C; font-weight:700;}" +
    ".lw .results-h{margin:0; font-size:1.1rem; color:var(--blue);}" +
    ".lw .waiting{text-align:center; padding:34px 20px;}" +
    ".lw .waiting .big{font-size:3rem; line-height:1;}" +
    ".lw .closed{padding:8px 12px; border-radius:10px; background:#FFEBDC; color:#8A3D07; font-weight:700; margin:0;}";

  var uid = 0;
  function mount(root, opts){
    opts = opts || {};
    if(!document.getElementById("lwStyle")){
      var st = document.createElement("style"); st.id = "lwStyle"; st.textContent = css; document.head.appendChild(st);
    }
    uid++;
    var P = "lw" + uid + "-";
    root.classList.add("lw");
    if(opts.compact) root.classList.add("lw-compact");
    root.innerHTML =
      '  <section class="card waiting" id="' + P + 'lvLoading"><p class="hint">טוען…</p></section>' +
      '  <section class="card waiting" id="' + P + 'lvNone" hidden>' +
      '    <div class="big" aria-hidden="true">⏳</div>' +
      '    <h2 class="lw-h">עוד אין פעילות</h2>' +
      '    <p class="hint">כשהמורה יפעיל פעילות, היא תופיע כאן לבד. אין צורך לרענן.</p>' +
      '  </section>' +
      '  <section class="card" id="' + P + 'lvAct" hidden>' +
      '    <p class="eyebrow" id="' + P + 'lvType"></p>' +
      '    <h2 class="lw-h" id="' + P + 'lvPrompt"></h2>' +
      '    <p class="closed" id="' + P + 'lvClosed" hidden>המורה סגר את התשובות. אפשר לראות את התוצאות למטה.</p>' +
      '    <form id="' + P + 'lvForm" novalidate>' +
      '      <div class="field" id="' + P + 'lvNameField">' +
      '        <label for="' + P + 'lvName">השם שלכם</label>' +
      '        <input type="text" id="' + P + 'lvName" maxlength="40" autocomplete="name">' +
      '      </div>' +
      '      <div id="' + P + 'lvCloudForm" hidden>' +
      '        <div class="field">' +
      '          <label for="' + P + 'lvWord">מילה אחת (אפשר עד 3 מילים, כל אחת בנפרד)</label>' +
      '          <div class="row">' +
      '            <input type="text" id="' + P + 'lvWord" maxlength="25" autocomplete="off" enterkeyhint="send">' +
      '            <button type="submit" class="btn" id="' + P + 'lvWordBtn">שליחה</button>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '      <div id="' + P + 'lvPollForm" hidden>' +
      '        <div class="opts" id="' + P + 'lvOpts" role="group" aria-label="אפשרויות"></div>' +
      '        <div class="field" style="margin-top:12px">' +
      '          <label for="' + P + 'lvReason">למה? משפט אחד (לא חובה)</label>' +
      '          <textarea id="' + P + 'lvReason" maxlength="140"></textarea>' +
      '        </div>' +
      '        <button type="submit" class="btn" id="' + P + 'lvVoteBtn" style="margin-top:12px">שליחת ההצבעה</button>' +
      '      </div>' +
      '      <div id="' + P + 'lvSurveyForm" hidden>' +
      '        <p class="anon" id="' + P + 'lvAnon" hidden>🔒 סקר אנונימי - המורה לא רואה מי ענה מה. אין צורך לכתוב שם.</p>' +
      '        <div id="' + P + 'lvSurveyQs"></div>' +
      '        <button type="submit" class="btn" id="' + P + 'lvSurveyBtn" style="margin-top:14px">שליחת הסקר</button>' +
      '      </div>' +
      '      <p class="msg" id="' + P + 'lvMsg" role="status" aria-live="polite" style="margin-top:10px"></p>' +
      '    </form>' +
      '    <div class="mine" id="' + P + 'lvMine" hidden></div>' +
      '  </section>' +
      '  <section class="card" id="' + P + 'lvResults" hidden>' +
      '    <h2 class="results-h" id="' + P + 'lvResultsH">מה הכיתה ענתה</h2>' +
      '    <div id="' + P + 'lvResultsBody" aria-live="polite"></div>' +
      '  </section>';
    var API = window.BM_API_URL, L = window.BM_LIVE;
    var $ = function(id){ return root.querySelector("#" + P + id); };
    var POLL_MS = 8000;
    var current = null, results = null, myAnswer = null, selected = null;

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
    function savedName(){ try{ return localStorage.getItem("bm-qb-name") || localStorage.getItem("bm-lesson-name") || ""; }catch(e){ return ""; } }
    function mineKey(id){ return "bm-live-" + id; }
    function loadMine(id){ try{ return JSON.parse(localStorage.getItem(mineKey(id)) || "null"); }catch(e){ return null; } }
    function saveMine(id, v){ try{ localStorage.setItem(mineKey(id), JSON.stringify(v)); }catch(e){} }
    function msg(t, kind){ var m = $("lvMsg"); m.textContent = t || ""; m.className = "msg" + (kind ? " is-" + kind : ""); }

    $("lvName").value = savedName() || (opts.preview ? "המורה (בדיקה)" : "");

    function show(which){
      $("lvLoading").hidden = which !== "loading";
      $("lvNone").hidden = which !== "none";
      $("lvAct").hidden = which !== "act";
      $("lvResults").hidden = which !== "act";
    }

    function renderMine(){
      var box = $("lvMine");
      if(!current || myAnswer === null || myAnswer === undefined){ box.hidden = true; return; }
      if(current.type === "cloud"){
        box.innerHTML = '<span>המילים שלכם:</span>' + myAnswer.map(function(w){ return '<span class="chip">' + L.esc(w) + '</span>'; }).join("") +
          (myAnswer.length >= 3 ? '<span class="hint">(כתבתם 3 מילים - זה המקסימום)</span>' : '');
      } else if(current.type === "survey"){
        box.innerHTML = '<span class="chip">✓ שלחתם את הסקר</span><span class="hint">אפשר לשנות תשובות ולשלוח שוב.</span>';
      } else {
        box.innerHTML = '<span>הצבעתם: </span><span class="chip">' + L.esc(current.options[myAnswer]) + '</span><span class="hint">אפשר לשנות ולשלוח שוב.</span>';
      }
      box.hidden = false;
    }

    function renderResults(){
      var body = $("lvResultsBody");
      if(!current) return;
      /* בהצבעה רואים את התוצאות רק אחרי שהצבעתם (או כשהמורה סגר) - כדי לא להשפיע */
      var canSee = current.type === "cloud" || myAnswer !== null || !current.open;
      if(!canSee){ body.innerHTML = '<p class="hint">התוצאות יופיעו אחרי ש' + (current.type === "survey" ? "תשלחו את הסקר" : "תצביעו") + '.</p>'; return; }
      var count = (results && results.count) || 0;
      $("lvResultsH").textContent = "מה הכיתה ענתה" + (count ? " (" + count + (count === 1 ? " תלמיד)" : " תלמידים)") : "");
      body.innerHTML = current.type === "survey" ? L.surveyHtml(current, results, "normal", { showTexts:false })
        : current.type === "cloud" ? L.cloudHtml(results && results.words, "normal")
        : L.pollHtml(current, results, "normal", myAnswer) + (results && results.reasons && results.reasons.length ? '<h3 class="results-h" style="margin-top:16px;font-size:1rem">למה בחרו כך</h3>' + L.reasonsHtml(current, results, "normal", false, 8) : "");
    }

    function setup(act){
      current = act;
      myAnswer = loadMine(act.id);
      selected = current.type === "poll" && myAnswer !== null ? myAnswer : null;
      $("lvType").textContent = act.type === "cloud" ? "☁️ ענן מילים" : (act.type === "survey" ? "📋 סקר" : "🗳️ הצבעה");
      $("lvSurveyForm").hidden = act.type !== "survey";
      $("lvAnon").hidden = !act.anonymous;
      if(act.type === "survey") buildSurvey(act, Array.isArray(myAnswer) ? myAnswer : []);
      $("lvPrompt").textContent = act.prompt;
      $("lvCloudForm").hidden = act.type !== "cloud";
      $("lvPollForm").hidden = act.type !== "poll";
      if(act.type === "poll"){
        $("lvOpts").innerHTML = act.options.map(function(o, i){
          return '<button type="button" class="opt" data-i="' + i + '" aria-pressed="' + (selected === i) + '">' + L.esc(o) + '</button>';
        }).join("");
      }
      msg("");
      $("lvWord").value = "";
      $("lvReason").value = "";
    }

    /* הסקר: שאלת בחירה, דירוג 1-5 או תשובה פתוחה */
    var surveySel = [];
    function buildSurvey(act, prev){
      surveySel = act.questions.map(function(q, i){ return q.kind === "text" ? null : (prev[i] === undefined ? null : prev[i]); });
      $("lvSurveyQs").innerHTML = act.questions.map(function(q, i){
        var inner;
        if(q.kind === "choice"){
          inner = '<div class="opts" role="group" aria-label="' + L.esc(q.q) + '">' + q.options.map(function(o, j){
            return '<button type="button" class="opt" data-q="' + i + '" data-v="' + j + '" aria-pressed="' + (surveySel[i] === j) + '">' + L.esc(o) + '</button>';
          }).join("") + '</div>';
        } else if(q.kind === "scale"){
          inner = '<div class="scale" role="group" aria-label="' + L.esc(q.q) + ' - דירוג מ-1 עד 5">' + [1, 2, 3, 4, 5].map(function(v){
            return '<button type="button" class="scale-btn" data-q="' + i + '" data-v="' + v + '" aria-pressed="' + (surveySel[i] === v) + '">' + v + '</button>';
          }).join("") + '</div><div class="scale-ends" aria-hidden="true"><span>1 · בכלל לא</span><span>5 · מאוד</span></div>';
        } else {
          inner = '<label class="visually-hidden" for="' + P + 'lvSq' + i + '">' + L.esc(q.q) + '</label>' +
            '<textarea id="' + P + 'lvSq' + i + '" data-q="' + i + '" maxlength="300">' + L.esc(prev[i] || "") + '</textarea>';
        }
        return '<fieldset class="sq"><legend><span class="sq-n" aria-hidden="true">' + (i + 1) + '</span>' + L.esc(q.q) + '</legend>' + inner + '</fieldset>';
      }).join("");
    }
    $("lvSurveyQs").addEventListener("click", function(e){
      var b = e.target.closest("[data-v]"); if(!b) return;
      var qi = Number(b.getAttribute("data-q")), v = Number(b.getAttribute("data-v"));
      surveySel[qi] = surveySel[qi] === v ? null : v;
      Array.prototype.forEach.call(b.parentNode.children, function(x){ x.setAttribute("aria-pressed", String(Number(x.getAttribute("data-v")) === surveySel[qi])); });
      msg("");
    });

    function applyOpen(){
      var open = current && current.open;
      $("lvClosed").hidden = !!open;
      $("lvForm").hidden = !open;
      $("lvNameField").hidden = (current && current.anonymous) || (!!savedName() && $("lvName").value.trim().length >= 2 && myAnswer !== null);
      if(current && current.type === "cloud" && myAnswer && myAnswer.length >= 3) $("lvCloudForm").hidden = true;
    }

    function load(){
      var room = window.BM_ROOM ? window.BM_ROOM() : "";   /* הקוד שהתלמיד הקליד - הפעילות של הכיתה שלו */
      fetch(API + "?action=actCurrent" + (room ? "&room=" + encodeURIComponent(room) : "")).then(function(r){ return r.json(); }).then(function(res){
        if(!res || !res.ok){ return; }
        if(!res.activity){ current = null; show("none"); if(opts.onNone) opts.onNone(); return; }
        if(!current || current.id !== res.activity.id) setup(res.activity);
        else current.open = res.activity.open;
        results = res.results;
        show("act");
        applyOpen(); renderMine(); renderResults();
      }).catch(function(){
        if(!current) { show("none"); $("lvNone").querySelector(".hint").textContent = "אין חיבור לאינטרנט כרגע. ננסה שוב בעוד כמה שניות."; }
      });
    }

    $("lvOpts").addEventListener("click", function(e){
      var b = e.target.closest(".opt"); if(!b) return;
      selected = Number(b.getAttribute("data-i"));
      Array.prototype.forEach.call($("lvOpts").children, function(x){ x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      msg("");
    });

    $("lvForm").addEventListener("submit", function(e){
      e.preventDefault();
      if(!current) return;
      var name = current.anonymous ? "" : $("lvName").value.replace(/\s+/g, " ").trim();
      if(!current.anonymous && name.length < 2){ $("lvNameField").hidden = false; msg("כתבו את השם שלכם.", "err"); $("lvName").focus(); return; }
      var body = { action:"actRespond", id:current.id, sid:sid(), name:name };
      var btn;
      if(current.type === "survey"){
        var answers = current.questions.map(function(q, i){
          if(q.kind !== "text") return surveySel[i];
          var ta = $("lvSq" + i);
          return ta && ta.value.trim() ? ta.value.trim() : null;
        });
        if(!answers.some(function(x){ return x !== null; })){ msg("ענו לפחות על שאלה אחת.", "err"); return; }
        body.answers = answers; btn = $("lvSurveyBtn");
      } else if(current.type === "cloud"){
        var w = $("lvWord").value.replace(/\s+/g, " ").trim();
        if(!w){ msg("כתבו מילה.", "err"); $("lvWord").focus(); return; }
        body.word = w; btn = $("lvWordBtn");
      } else {
        if(selected === null){ msg("בחרו אחת מהאפשרויות.", "err"); return; }
        body.option = selected; body.reason = $("lvReason").value; btn = $("lvVoteBtn");
      }
      btn.disabled = true; msg("שולחים…");
      fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body) })
        .then(function(r){ return r.json(); }).then(function(res){
          btn.disabled = false;
          if(!res || !res.ok){ msg((res && res.error) || "השליחה לא הצליחה. נסו שוב.", "err"); if(res && (res.ended || res.closed)) load(); return; }
          if(name){ try{ localStorage.setItem("bm-qb-name", name); }catch(err){} }
          myAnswer = res.mine; saveMine(current.id, myAnswer); results = res.results;
          $("lvWord").value = "";
          msg(current.type === "cloud" ? "✓ המילה נוספה לענן." : (current.type === "survey" ? "✓ תודה! הסקר נשלח." : "✓ ההצבעה נקלטה."), "ok");
          applyOpen(); renderMine(); renderResults();
          if(current.type === "cloud" && myAnswer.length < 3) $("lvWord").focus();
        }).catch(function(){ btn.disabled = false; msg("אין חיבור לאינטרנט כרגע. נסו שוב.", "err"); });
    });

    function onVisible(){ if(document.visibilityState === "visible") load(); }
    load();
    var timer = setInterval(function(){ if(document.visibilityState === "visible") load(); }, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return {
      reload: load,
      destroy: function(){ clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); root.innerHTML = ""; }
    };

  }

  window.BM_LIVEWIDGET = { mount: mount };
})();
