/* ============================================================
   תרגול אישי - בדיוק במה שהתלמיד טעה
   ============================================================
   ביחידות הגזרות בעברית: אחרי ששולחים למורה את שאלות הבגרות, הדף בודק
   (בלי לסמן על המסך) באילו סוגי סעיפים היו טעויות - שורש, בניין, שם הפועל -
   ומציע תרגילים נוספים מאותו סוג, מתוך טבלת התרגול של היחידה עצמה (עמוד 2).
   התלמיד לא רואה אילו סעיפים בבגרות שגויים, ולא כמה - רק במה כדאי להתאמן.
   התרגילים נבדקים באותה בדיקה של עמוד התרגול (CORRECT_ANSWERS / BM_FIELD_OK).
   ההמלצה נשמרת בדפדפן, ומוצגת שוב כשחוזרים לדף - עד השליחה הבאה.
   ============================================================ */
(function(){
  "use strict";
  var PAGE = location.pathname.split("/").pop() || "";
  var KEY = "bm-practice:" + PAGE;
  var PER_SKILL = 3, MAX_ITEMS = 8;
  var BINYANIM = ["kal", "nifal", "piel", "pual", "hifil", "hufal", "hitpael"];
  var SKILLS = {
    shoresh: { name: "שורש", ask: "מה השורש?" },
    binyan:  { name: "בניין", ask: "מה הבניין?" },
    hapoal:  { name: "שם הפועל", ask: "מה שם הפועל?" }
  };

  if(typeof CORRECT_ANSWERS === "undefined") return;
  var bagrut = document.querySelectorAll(".gzb-card");
  if(!bagrut.length) return;

  function arr(x){ return Array.prototype.slice.call(x); }
  function ok(f){ try{ return window.BM_FIELD_OK ? window.BM_FIELD_OK(f) : null; }catch(e){ return null; } }

  /* סוג הסעיף בשאלות הבגרות */
  function skillOf(f){
    var a = f.getAttribute("data-answer") || "";
    if(f.tagName === "SELECT") return a.split("|").some(function(x){ return BINYANIM.indexOf(x) !== -1; }) ? "binyan" : "";
    if(/\./.test(a)) return "shoresh";
    if(/^ל/.test(a) || /שם הפועל/.test(f.getAttribute("aria-label") || "")) return "hapoal";
    return "";
  }
  /* באילו סוגים היו טעויות (או סעיפים ריקים) */
  function weakSkills(){
    var found = {};
    arr(document.querySelectorAll(".gzb-card [data-answer]")).forEach(function(f){
      var s = skillOf(f);
      if(s && ok(f) === false) found[s] = true;
    });
    return Object.keys(SKILLS).filter(function(s){ return found[s]; });
  }

  /* מאגר התרגילים: שורות טבלת התרגול (עמוד 2) - משפט, ושדה לכל סוג */
  function pool(skill){
    var out = [];
    arr(document.querySelectorAll('#grid tr')).forEach(function(tr){
      var inp = tr.querySelector('input[data-id$="-' + skill + '"]');
      var sent = tr.querySelector(".hafan-sentence");
      if(!inp || !sent) return;
      var id = inp.getAttribute("data-id");
      if(!Object.prototype.hasOwnProperty.call(CORRECT_ANSWERS, id)) return;
      out.push({ id: id, skill: skill, done: ok(inp) === true });
    });
    /* קודם מה שעוד לא נפתר נכון בעמוד התרגול, ובכל קבוצה - בסדר אקראי */
    function shuffle(a){ for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    return shuffle(out.filter(function(x){ return !x.done; })).concat(shuffle(out.filter(function(x){ return x.done; })));
  }
  function build(skills){
    var items = [];
    skills.forEach(function(s){ items = items.concat(pool(s).slice(0, PER_SKILL)); });
    return items.slice(0, MAX_ITEMS).map(function(x){ return { id: x.id, skill: x.skill }; });
  }
  /* המשפט של תרגיל - תמיד מתוך הדף עצמו (לא מהזיכרון בדפדפן) */
  function sentenceOf(id){
    var inp = document.querySelector('#grid input[data-id="' + String(id).replace(/["\\]/g, "") + '"]');
    var tr = inp && inp.closest("tr"), sent = tr && tr.querySelector(".hafan-sentence");
    return sent ? sent.innerHTML.replace(/<span class="num">[^<]*<\/span>\s*/, "") : "";
  }

  /* ---------- התיבה בדף ---------- */
  var box = document.createElement("section");
  box.id = "bmPractice";
  box.className = "card bm-practice";
  box.setAttribute("aria-label", "תרגול אישי");
  box.hidden = true;
  box.style.cssText = "margin:1rem auto;max-width:900px;padding:1rem 1.2rem;border:2px solid var(--teal, #0D8A63);border-radius:16px;background:var(--paper-card, #fff);";
  var anchor = document.getElementById("bmSendPanel") || document.querySelector(".toolbar");
  if(!anchor) return;
  anchor.parentNode.insertBefore(box, anchor.nextSibling);

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]; }); }
  function render(data){
    if(data && data.items) data.items = data.items.filter(function(x){
      return x && SKILLS[x.skill] && Object.prototype.hasOwnProperty.call(CORRECT_ANSWERS, x.id) && (x.html = sentenceOf(x.id));
    });
    if(data && data.skills) data.skills = data.skills.filter(function(s){ return SKILLS[s]; });
    if(!data || !data.items || !data.items.length || !data.skills.length){ box.hidden = true; box.innerHTML = ""; return; }
    var names = data.skills.map(function(s){ return SKILLS[s].name; });
    box.innerHTML =
      '<h2 class="card-title" style="margin:0 0 .3rem">🎯 תרגול אישי</h2>' +
      '<p style="margin:0 0 .8rem;line-height:1.7">כדאי להתאמן עוד ב<b>' + esc(names.join(", ").replace(/, ([^,]*)$/, " וב$1")) + '</b>. ' +
        'הנה ' + data.items.length + ' תרגילים בדיוק בזה. כותבים תשובה ולוחצים "בדיקה".</p>' +
      '<ol class="bm-practice-list" style="margin:0;padding-inline-start:1.4rem;display:flex;flex-direction:column;gap:.8rem">' +
      data.items.map(function(x, i){
        return '<li><div style="margin-bottom:.35rem">' + x.html + '</div>' +
          '<label for="bmPr' + i + '" style="font-weight:700;margin-inline-end:.5rem">' + esc(SKILLS[x.skill].ask) + '</label>' +
          '<input type="text" id="bmPr' + i + '" class="answer table-cell" data-pr="' + esc(x.id) + '" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" style="max-width:12rem">' +
          ' <button type="button" class="btn" data-pr-check="' + i + '">בדיקה</button>' +
          ' <span class="bm-practice-res" id="bmPrRes' + i + '" role="status" aria-live="polite" style="font-weight:700"></span></li>';
      }).join("") + '</ol>' +
      '<p style="margin:.8rem 0 0;font-size:.9rem;color:var(--ink-soft, #56637A)">התרגילים לקוחים מעמוד התרגול של היחידה. התשובות כאן לא נשלחות למורה.</p>';
    box.hidden = false;
  }

  var tries = {};
  box.addEventListener("click", function(e){
    var b = e.target.closest("[data-pr-check]");
    if(!b) return;
    var i = b.getAttribute("data-pr-check");
    var inp = document.getElementById("bmPr" + i), res = document.getElementById("bmPrRes" + i);
    if(!inp || !res) return;
    if(!inp.value.trim()){ res.textContent = "כתבו תשובה קודם."; res.style.color = ""; inp.focus(); return; }
    /* אותה בדיקה של עמוד התרגול: עותק עם ה-data-id של השדה המקורי */
    var probe = document.createElement("input");
    probe.setAttribute("data-id", inp.getAttribute("data-pr"));
    probe.value = inp.value;
    var good = ok(probe) === true;
    tries[i] = (tries[i] || 0) + (good ? 0 : 1);
    if(good){ res.textContent = "✓ נכון!"; res.style.color = "var(--teal, #0D8A63)"; }
    else if(tries[i] >= 2){
      var ans = String(CORRECT_ANSWERS[inp.getAttribute("data-pr")] || "").split("/")[0];
      res.textContent = "✗ התשובה: " + ans; res.style.color = "var(--rust, #B42318)";
    } else { res.textContent = "✗ עוד לא. נסו שוב."; res.style.color = "var(--rust, #B42318)"; }
  });

  function save(data){ try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){} }
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){ return null; } }

  /* אחרי שליחה מוצלחת (assets/send-to-teacher.js) */
  document.addEventListener("bm-sent", function(){
    var skills = weakSkills();
    var data = skills.length ? { skills: skills, items: build(skills), t: Date.now() } : null;
    save(data);
    render(data && JSON.parse(JSON.stringify(data)));
    if(data && data.items.length) setTimeout(function(){ box.scrollIntoView({ block:"start", behavior:"smooth" }); }, 400);
  });
  /* חזרה לדף: ההמלצה מהשליחה האחרונה */
  var last = load();
  if(last) render(last);
  tries = {};
})();
