/* ============================================================
   שליחה למורה אחרי כל נושא - דפי התנ"ך של כיתה י"ב
   ============================================================
   בסוף כל נושא בדף (topic-col / topic-section), ובסוף כל כרטיס שאלות בגרות, מופיע כפתור
   "שלחו למורה את התשובות על הנושא הזה". הוא שולח רק את התשובות של
   אותו נושא - אין צורך להגיע לסוף הדף.
   השליחה עצמה - assets/direct-submit.js (כמו הכפתור הראשי). שם הנושא
   נשלח בשדה ההערות, כך שבלוח ההגשות ההגשה נשארת בשורה של הפרק.
   הכפתור יושב בתוך השאלה האחרונה של הנושא, ולכן בדף שמחולק למשימות
   (assets/steps.js) הוא מופיע יחד עם המשימה האחרונה של הנושא.
   בפתוח תפתח - כפתור כזה אחרי שאלות הבגרות של כל מצווה.
   ============================================================ */
(function(){
  "use strict";
  var page = location.pathname.split("/").pop() || "";
  var T = window.BM_TASKS;
  var where = T && T.findByPage(page);
  if(!where || where.unit.class !== "יב") return;
  /* פתוח תפתח (בחינת הבגרות בתנ"ך, שאלון 2371): רק שאלות הבגרות - הלשונית בדף המרכזי והכרטיס בכל מצווה */
  var ptpOnly = where.unit.key === "ptp";
  if(where.unit.subject !== "תנך" && !ptpOnly) return;
  var api = window.BeitMidrashDirectSubmit;
  var nameEl = document.getElementById("studentName");
  var classEl = document.getElementById("studentClass");
  if(!api || !nameEl) return;
  var main = document.querySelector("main");
  if(!main) return;
  var assignment = T.assignmentFor(where.unit, where.topic);
  var WHAT = ptpOnly ? "בשאלות האלה" : "בנושא הזה";

  function arr(x){ return Array.prototype.slice.call(x || []); }
  function clean(t){ return String(t || "").replace(/\s+/g, " ").trim(); }
  function textOf(el){
    if(!el) return "";
    var c = el.cloneNode(true);
    arr(c.querySelectorAll('[aria-hidden="true"]')).forEach(function(x){ x.remove(); });
    return clean(c.textContent);
  }
  function fields(root){
    return arr(root.querySelectorAll("textarea.answer, input.answer")).filter(function(f){
      return f.type !== "radio" && f.type !== "checkbox";
    });
  }

  /* ---------- הנושאים בדף ---------- */
  var sections = [];
  if(ptpOnly){
    arr(main.querySelectorAll(".bq-panel")).forEach(function(panel){
      var chip = document.getElementById(panel.getAttribute("aria-labelledby") || "");
      if(fields(panel).length) sections.push({ root: panel, title: "שאלות בגרות · " + textOf(chip),
                                               assignment: T.fileSafe(where.unit.title) + T.SEP + "שאלות בגרות" });
    });
    arr(main.querySelectorAll('section.card[data-stage="bagrut"]')).forEach(function(card){
      if(fields(card).length) sections.push({ root: card, title: "שאלות בגרות · " + clean((card.querySelector(".card-title") || {}).textContent) });
    });
  }
  if(!ptpOnly) arr(main.querySelectorAll(".topic-col, .topic-section")).forEach(function(col){
    if(col.parentElement.closest(".topic-col, .topic-section") || !fields(col).length) return;
    var t = col.querySelector(".topic-title, .topic-banner h2, .topic-banner h3");
    sections.push({ root: col, title: clean(t && t.textContent) });
  });
  if(!ptpOnly) arr(main.querySelectorAll("section.card")).forEach(function(card){
    if(card.closest(".topic-col, .topic-section") || !fields(card).length) return;
    sections.push({ root: card, title: clean((card.querySelector(".card-title") || {}).textContent) });
  });
  if(!sections.length) return;

  var css = document.createElement("style");
  css.textContent =
    ".bm-secsend{margin-top:.9rem;padding:.75rem .9rem;border-radius:12px;background:#EEF4FB;border:1px dashed #9DB6D8;display:flex;flex-direction:column;gap:.5rem}" +
    ".bm-secsend-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}" +
    ".bm-secsend button{min-height:44px;padding:.55rem 1rem;border-radius:10px;border:1px solid #123A78;background:#fff;color:#123A78;font:inherit;font-weight:700;cursor:pointer}" +
    ".bm-secsend button.bm-secsend-go{background:#123A78;color:#fff}" +
    ".bm-secsend button:disabled{opacity:.6;cursor:default}" +
    ".bm-secsend button:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
    ".bm-secsend-msg{margin:0;font-size:.95rem;line-height:1.5;color:#15283D}" +
    ".bm-secsend-msg:empty{display:none}" +
    ".bm-secsend-msg.is-ok{color:#0A6B4C;font-weight:700}" +
    ".bm-secsend-msg.is-err{color:#B42318;font-weight:700}" +
    ".bm-secsend-last{margin:0;font-size:.85rem;color:#4E5B72}" +
    ".bm-secsend-last:empty{display:none}" +
    "@media print{.bm-secsend{display:none !important}}";
  document.head.appendChild(css);

  function fmt(t){
    var d = new Date(t), now = new Date();
    var hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    return (d.toDateString() === now.toDateString() ? "היום" : d.getDate() + "." + (d.getMonth() + 1)) + " בשעה " + hm;
  }

  sections.forEach(function(sec, idx){
    var blocks = arr(sec.root.querySelectorAll(".question-block, .bagrut-part"));
    var host = blocks.length ? blocks[blocks.length - 1] : sec.root.querySelector(".card-body") || sec.root;
    var key = "bm-secsent:" + page + ":" + idx;
    var box = document.createElement("div");
    box.className = "bm-secsend";
    box.innerHTML =
      '<div class="bm-secsend-row"><button type="button" class="bm-secsend-btn">' + (ptpOnly ? "📤 שלחו למורה את התשובות לשאלות הבגרות" : "📤 שלחו למורה את התשובות על הנושא הזה") + '</button></div>' +
      '<p class="bm-secsend-msg" role="status" aria-live="polite"></p>' +
      '<p class="bm-secsend-last"></p>';
    host.appendChild(box);
    var row = box.querySelector(".bm-secsend-row");
    var btn = box.querySelector(".bm-secsend-btn");
    var msg = box.querySelector(".bm-secsend-msg");
    var last = box.querySelector(".bm-secsend-last");
    btn.setAttribute("aria-label", "שלחו למורה את התשובות על הנושא: " + (sec.title || "נושא " + (idx + 1)));

    function showLast(){
      try{
        var l = JSON.parse(localStorage.getItem(key) || "null");
        last.textContent = l ? "✅ נשלח למורה " + fmt(l.t) + " (" + (l.n === 1 ? "תשובה אחת" : l.n + " תשובות") + ")." : "";
      }catch(e){ last.textContent = ""; }
    }
    showLast();
    function say(text, kind){ msg.textContent = text; msg.className = "bm-secsend-msg" + (kind ? " is-" + kind : ""); }
    function reset(){ arr(row.querySelectorAll(".bm-secsend-go, .bm-secsend-cancel")).forEach(function(b){ b.remove(); }); btn.hidden = false; }

    btn.addEventListener("click", function(){
      say("");
      if(!clean(nameEl.value)){
        say("✏️ כתבו קודם את השם שלכם בשורה \"שם\" שבראש הדף.", "err");
        nameEl.focus(); nameEl.scrollIntoView({ block: "center" });
        return;
      }
      if(classEl && !api.classCode(classEl.value)){
        say("✏️ כתבו את הכיתה שלכם בשורה \"כיתה\" שבראש הדף (למשל י\"ב).", "err");
        classEl.focus(); classEl.scrollIntoView({ block: "center" });
        return;
      }
      var fs = fields(sec.root);
      var filled = fs.filter(function(f){ return clean(f.value); });
      if(!filled.length){ say("עוד לא כתבתם תשובות " + WHAT + ".", "err"); return; }
      say("לשלוח למורה " + (filled.length === 1 ? "תשובה אחת" : filled.length + " תשובות") + " מתוך " + fs.length + " " + WHAT + "?" +
          (filled.length < fs.length ? " (שאלות בלי תשובה לא יישלחו)" : ""));
      btn.hidden = true;
      var go = document.createElement("button");
      go.type = "button"; go.className = "bm-secsend-go"; go.textContent = "✅ כן, לשלוח";
      var cancel = document.createElement("button");
      cancel.type = "button"; cancel.className = "bm-secsend-cancel"; cancel.textContent = "ביטול";
      row.appendChild(go); row.appendChild(cancel);
      go.focus();
      cancel.addEventListener("click", function(){ reset(); say(""); btn.focus(); });
      go.addEventListener("click", function(){
        go.disabled = cancel.disabled = true;
        go.textContent = "שולח...";
        say("שולח את התשובות... זה לוקח כמה שניות.");
        api.send({
          studentName: clean(nameEl.value),
          studentClass: classEl ? classEl.value : "",
          assignment: sec.assignment || assignment,
          notes: "נושא: " + (sec.title || "נושא " + (idx + 1)),
          fields: fs,
          total: fs.length
        }).then(function(res){
          if(!(res && res.ok)) throw new Error((res && res.error) || "השרת לא אישר את הקבלה");
          try{ localStorage.setItem(key, JSON.stringify({ t: Date.now(), n: filled.length })); }catch(e){}
          reset(); showLast();
          say("✅ התשובות נשלחו למורה. הן נשארות שמורות גם בדף.", "ok");
        }).catch(function(err){
          reset();
          say("❌ השליחה לא הצליחה. בדקו שיש חיבור לאינטרנט ונסו שוב." + (err && err.message ? " (" + err.message + ")" : ""), "err");
        });
      });
    });
  });
})();
