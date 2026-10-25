/* ============================================================
   המשוב של המורה - מה שהתלמיד רואה
   ============================================================
   כשהמורה בודק עבודה ומאשר בלוח ההגשות, התלמיד רואה:
   - בדף העבודה עצמו: את הציון ואת הסיכום בראש הדף, ומתחת לכל שאלה
     הסבר קצר - מה היה טוב ומה חסר (למה ירדו נקודות).
     הדף יודע אילו עבודות נשלחו מהמכשיר הזה (localStorage "bm-my-subs",
     נשמר ב-assets/direct-submit.js). נטען מ-assets/a11y.js רק אם יש כאלה.
   - בדף feedback.html?id=<מזהה העבודה>: המשוב המלא, לקישור שהמורה שולח.
   המשוב מגיע מהסקריפט (action=feedback), ורק אחרי אישור המורה.
   התלמיד רואה בעיקר את הטעויות: שאלה שנענתה נכון מקבלת רק סימן ✅ קצר,
   ושאלה חלקית או חסרה - תיבה עם מה בדיוק צריך לתקן. בראש הדף - רשימת "מה לתקן".
   ============================================================ */
(function(){
  "use strict";
  if(window.BM_FEEDBACK) return;
  var API = window.BM_API_URL;
  var page = location.pathname.split("/").pop() || "index.html";
  var STATUS = {
    full:    { ico:"✅", label:"תשובה מלאה" },
    partial: { ico:"🟡", label:"תשובה חלקית" },
    miss:    { ico:"❌", label:"חסר בתשובה" }
  };

  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  }
  function css(){
    if(document.getElementById("bmFbStyle")) return;
    var st = document.createElement("style");
    st.id = "bmFbStyle";
    st.textContent =
      ".bm-fb{font-family:Heebo,Rubik,Arial,sans-serif;direction:rtl;text-align:right;color:#0E1B33}" +
      ".bm-fb-top{max-width:860px;margin:1rem auto;padding:1rem 1.2rem;background:#fff;border:2px solid #123A78;border-radius:16px;box-shadow:0 6px 18px rgba(18,58,120,.12);display:flex;flex-direction:column;gap:.6rem}" +
      ".bm-fb-head{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}" +
      ".bm-fb-grade{flex:none;display:grid;place-items:center;width:76px;height:76px;border-radius:50%;background:#123A78;color:#fff;font-size:1.9rem;font-weight:700;font-variant-numeric:tabular-nums}" +
      ".bm-fb-grade small{display:block;font-size:.7rem;font-weight:500;line-height:1;opacity:.85}" +
      ".bm-fb-title{flex:1 1 220px;margin:0;font-size:1.15rem;line-height:1.4}" +
      ".bm-fb-title span{display:block;font-size:.9rem;font-weight:400;color:#4E5B72}" +
      ".bm-fb-sum{margin:0;padding:.7rem .9rem;background:#F4F7FC;border-radius:12px;line-height:1.7}" +
      ".bm-fb-legend{margin:0;font-size:.9rem;color:#4E5B72}" +
      ".bm-fb-legend a{color:#123A78;font-weight:700}" +
      ".bm-fb-q{margin:.6rem 0 .2rem;padding:.65rem .85rem;border-radius:12px;border:1px solid;border-inline-start-width:6px;line-height:1.65;font-size:1rem}" +
      ".bm-fb-q b{display:block;margin-bottom:.15rem}" +
      ".bm-fb-q--full{background:#E9F6EF;border-color:#7CC4A0;color:#0B4F37}" +
      ".bm-fb-q--partial{background:#FFF6E0;border-color:#E6B85C;color:#5E4300}" +
      ".bm-fb-q--miss{background:#FDECEA;border-color:#E59A92;color:#7A1C14}" +
      ".bm-fb-list{display:flex;flex-direction:column;gap:.2rem;margin:0;padding:0;list-style:none}" +
      ".bm-fb-qtext{display:block;font-weight:400;color:#33415C;font-size:.95rem;margin-bottom:.25rem}" +
      ".bm-fb-ok{display:inline-block;margin:.35rem 0 .1rem;padding:.15rem .6rem;border-radius:999px;background:#E9F6EF;color:#0B4F37;font-weight:700;font-size:.9rem}" +
      ".bm-fb-fix{margin:0;display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}" +
      ".bm-fb-fix b{margin-inline-end:.2rem}" +
      ".bm-fb-fix a{display:inline-block;padding:.2rem .7rem;border-radius:999px;background:#FDECEA;color:#7A1C14;font-weight:700;text-decoration:none;border:1px solid #E59A92}" +
      ".bm-fb-fix a.is-partial{background:#FFF6E0;color:#5E4300;border-color:#E6B85C}" +
      ".bm-fb-fix a:focus-visible{outline:3px solid #E8650C;outline-offset:2px}" +
      ".bm-fb-good{margin:0;padding:.55rem .85rem;border-radius:12px;background:#E9F6EF;color:#0B4F37;line-height:1.6}" +
      ".bm-fb-h{margin:.4rem 0 0;font-size:1.05rem}" +
      ".bm-fb-redo{margin:0;padding:.8rem 1rem;border-radius:12px;background:#FFF1DF;border:2px solid #E8650C;color:#5A2E04;display:flex;flex-direction:column;gap:.5rem;line-height:1.6}" +
      ".bm-fb-redo b{font-size:1.08rem}" +
      ".bm-fb-redo-actions{display:flex;flex-wrap:wrap;gap:.5rem}" +
      ".bm-fb-redo-actions button{min-height:42px;padding:.35rem .9rem;border-radius:10px;border:1.5px solid #E8650C;background:#fff;color:#5A2E04;font:inherit;font-weight:700;cursor:pointer}" +
      ".bm-fb-redo-actions button.is-main{background:#E8650C;color:#fff}" +
      ".bm-fb-redo-actions button:focus-visible{outline:3px solid #123A78;outline-offset:2px}" +
      ".bm-fb-redo-done{margin:0;padding:.6rem .9rem;border-radius:12px;background:#E9F6EF;color:#0B4F37;font-weight:700}" +
      "@media print{.bm-fb-top{box-shadow:none}.bm-fb-redo-actions{display:none}}";
    document.head.appendChild(st);
  }
  function fmtDate(t){
    var d = new Date(t);
    return isNaN(d) ? "" : d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
  }
  function gradeHtml(fb){
    return fb.grade !== "" ? '<div class="bm-fb-grade" aria-label="הציון: ' + esc(fb.grade) + '"><span>' + esc(fb.grade) + '<small>ציון</small></span></div>' : "";
  }
  function isOk(x){ return x.s === "full"; }

  /* ---------- "המורה ביקש לתקן ולשלוח שוב" ----------
     bm-redo במכשיר: { "<שם המטלה>": { of: "<מזהה העבודה הקודמת>" } } - כך "שלחו למורה"
     (assets/send-to-teacher.js) יודע שזו הגשה מתוקנת, והיא מגיעה למורה עם הציון הקודם. */
  function redoStore(a, of){
    if(!a) return;
    try{
      var m = JSON.parse(localStorage.getItem("bm-redo") || "{}") || {};
      if(of) m[a] = { of: of, t: Date.now() };
      else delete m[a];
      localStorage.setItem("bm-redo", JSON.stringify(m));
    }catch(e){}
  }
  function redoHtml(fb, inPage){
    if(fb.redoSent) return '<p class="bm-fb-redo-done">✓ שלחת תיקון. המורה יבדוק אותו ויחזיר משוב.</p>';
    if(!fb.redo) return "";
    return '<div class="bm-fb-redo" role="note"><b>🔁 המורה ביקש לתקן ולשלוח שוב</b>' +
      '<span>' + (inPage ? 'התשובות שלך שמורות בדף. תקנו את השאלות שמסומנות ❌ או 🟡 (ההסבר מופיע מתחת לכל אחת), ואז לחצו "שלחו למורה".'
                         : 'התשובות שלך שמורות בדף העבודה, במכשיר שממנו שלחת. פתחו אותו, תקנו את מה שמסומן, ולחצו "שלחו למורה".') + '</span>' +
      (inPage ? '<span class="bm-fb-redo-actions"><button type="button" class="is-main" data-redo-go="fix">✏️ לשאלה הראשונה לתיקון</button>' +
                '<button type="button" data-redo-go="send">📤 לשליחה מחדש</button></span>' : '') + '</div>';
  }
  /* מעבר לשדה בדף - גם אם הוא בלשונית סגורה (למשל נושא אחר בבית, חינוך ומשפחה) */
  function goTo(el){
    if(!el) return;
    var panel = el.closest('[role="tabpanel"][hidden]');
    var tab = panel && document.querySelector('[role="tab"][aria-controls="' + panel.id + '"]');
    if(tab) tab.click();
    /* דף עם חלוקה למשימות (assets/steps.js): השאלה במשימה אחרת - עוברים לתצוגת "כל השאלות" */
    if(!el.getClientRects().length){
      var all = document.querySelector(".bm-view-btn");
      if(all && /כל השאלות/.test(all.textContent)) all.click();
    }
    el.scrollIntoView({ block:"center", behavior:"smooth" });
    if(el.focus) el.focus({ preventScroll:true });
  }
  function label(x, i){ return x.n ? "שאלה " + x.n : (x.q ? String(x.q).replace(/\s+/g, " ").slice(0, 40) + (String(x.q).length > 40 ? "…" : "") : "שאלה " + (i + 1)); }
  function itemHtml(x, withQ, anchor){
    var st = STATUS[x.s] || STATUS.partial;
    return '<div class="bm-fb bm-fb-q bm-fb-q--' + (STATUS[x.s] ? x.s : "partial") + '" role="note"' + (anchor ? ' id="' + anchor + '" tabindex="-1"' : '') + '>' +
      '<b><span aria-hidden="true">' + st.ico + '</span> ' + (x.n ? 'שאלה ' + esc(x.n) + ': ' : '') + st.label + (isOk(x) ? '' : ' - מה לתקן:') + '</b>' +
      (withQ && x.q ? '<span class="bm-fb-qtext">' + esc(x.q) + '</span>' : '') +
      esc(x.text) + '</div>';
  }
  /* "מה לתקן": קישורים לשאלות שלא נענו נכון. ואם הכול נכון - מילה טובה */
  function fixListHtml(items, prefix){
    var bad = [], good = 0;
    items.forEach(function(x, i){ if(isOk(x)) good++; else bad.push({ x:x, i:i }); });
    if(!items.length) return "";
    if(!bad.length) return '<p class="bm-fb-good">🎉 כל התשובות נכונות! כל הכבוד.</p>';
    return '<p class="bm-fb-fix"><b>מה לתקן (' + bad.length + '):</b>' + bad.map(function(b){
      return '<a href="#' + prefix + b.i + '" class="' + (b.x.s === "partial" ? "is-partial" : "") + '">' + (b.x.s === "partial" ? "🟡 " : "❌ ") + esc(label(b.x, b.i)) + '</a>';
    }).join("") + '</p>' + (good ? '<p class="bm-fb-legend">✅ ענית נכון על ' + (good === 1 ? 'שאלה אחת' : good + ' שאלות') + '.</p>' : '');
  }
  function markSeen(id){
    try{
      var s = JSON.parse(localStorage.getItem("bm-fb-seen") || "[]");
      if(s.indexOf(id) === -1){ s.push(id); localStorage.setItem("bm-fb-seen", JSON.stringify(s.slice(-200))); }
    }catch(e){}
  }
  /* קישור משוב שנפתח במכשיר שלא שלח את העבודה: מוסיפים אותה לרשימה, כדי שהמשוב יופיע גם בדף העבודה ובדף הבית */
  function rememberLink(id, fb){
    try{
      var list = JSON.parse(localStorage.getItem("bm-my-subs") || "[]");
      if(list.some(function(x){ return x && x.id === id; })) return;
      if(!/^[\w.-]+\.html$/.test(fb.page || "")) return;
      list.unshift({ id: id, page: fb.page, a: fb.assignment || "", n: "", t: Date.now() });
      localStorage.setItem("bm-my-subs", JSON.stringify(list.slice(0, 80)));
    }catch(e){}
  }
  function load(id){
    return fetch(API + "?action=feedback&id=" + encodeURIComponent(id)).then(function(r){ return r.json(); });
  }

  /* ---------- בדף העבודה: ציון בראש הדף, הסבר מתחת לכל שאלה ---------- */
  function inPage(sub, fb){
    css();
    markSeen(sub.id);
    var top = document.createElement("section");
    top.className = "bm-fb bm-fb-top";
    top.setAttribute("aria-label", "המשוב של המורה");
    top.innerHTML =
      '<div class="bm-fb-head">' + gradeHtml(fb) +
        '<h2 class="bm-fb-title">📝 המורה בדק את העבודה ששלחת' +
          '<span>' + esc(fb.assignment || sub.a) + (sub.n ? ' · ' + esc(sub.n) : '') + (sub.t ? ' · נשלחה ב-' + fmtDate(sub.t) : '') + '</span></h2></div>' +
      (fb.summary ? '<p class="bm-fb-sum">' + esc(fb.summary) + '</p>' : '') +
      (fb.comment && fb.comment !== fb.summary ? '<p class="bm-fb-sum">' + esc(fb.comment) + '</p>' : '') +
      redoHtml(fb, true) +
      fixListHtml(fb.items || [], "bmFbIt") +
      '<p class="bm-fb-legend">ליד כל שאלה שצריך לתקן מופיע הסבר. ' +
        '<a href="feedback.html?id=' + encodeURIComponent(sub.id) + '">לכל המשוב בעמוד אחד ›</a></p>';
    var anchor = document.querySelector(".student-bar") || document.querySelector("header");
    var main = document.querySelector("main");
    if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(top, anchor.nextSibling);
    else if(main) main.insertBefore(top, main.firstChild);
    else document.body.insertBefore(top, document.body.firstChild);

    (fb.items || []).forEach(function(x, i){
      if(!x.id) return;
      var field = document.querySelector('.answer[data-id="' + x.id.replace(/["\\]/g, "") + '"]');
      if(!field) return;
      var box = document.createElement("div");
      box.innerHTML = isOk(x) ? '<span class="bm-fb bm-fb-ok" id="bmFbIt' + i + '">✅ נכון</span>' : itemHtml(x, false, "bmFbIt" + i);
      field.parentNode.insertBefore(box.firstChild, field.nextSibling);
    });
    if(fb.redo && !fb.redoSent) redoStore(sub.a, sub.id);
    else if(fb.redoSent) redoStore(sub.a, "");
    Array.prototype.forEach.call(top.querySelectorAll("[data-redo-go]"), function(b){
      b.addEventListener("click", function(){
        if(b.getAttribute("data-redo-go") === "send"){ goTo(document.getElementById("sendToTeacherBtn")); return; }
        var first = null;
        (fb.items || []).some(function(x, i){ if(isOk(x)) return false; first = document.getElementById("bmFbIt" + i); return !!first; });
        var field = first && first.previousElementSibling;
        goTo(field && field.matches && field.matches(".answer") ? field : first);
      });
    });
    /* קישור "מה לתקן" לשאלה שלא נמצאה בדף (למשל בדף אחר של היחידה) - לעמוד המשוב המלא */
    Array.prototype.forEach.call(top.querySelectorAll('.bm-fb-fix a'), function(a){
      if(!document.getElementById(a.getAttribute("href").slice(1))) a.href = "feedback.html?id=" + encodeURIComponent(sub.id) + a.getAttribute("href").replace("bmFbIt", "bmFbFull");
    });
  }

  /* ---------- feedback.html - המשוב המלא בעמוד אחד ---------- */
  function fullPage(root){
    css();
    var id = (new URLSearchParams(location.search).get("id") || "").replace(/[^\w-]/g, "");
    if(!id){ root.innerHTML = '<p class="bm-fb-sum">הקישור לא שלם. בקשו מהמורה קישור חדש.</p>'; return; }
    root.innerHTML = '<p class="bm-fb-sum">טוען את המשוב…</p>';
    load(id).then(function(res){
      var fb = res && res.ok && res.feedback;
      if(!fb){ root.innerHTML = '<p class="bm-fb-sum">המשוב עוד לא מוכן. המורה יפרסם אותו אחרי הבדיקה.</p>'; return; }
      document.title = "משוב - " + (fb.assignment || "עבודה");
      markSeen(id);
      rememberLink(id, fb);
      root.innerHTML =
        '<div class="bm-fb bm-fb-top">' +
          '<div class="bm-fb-head">' + gradeHtml(fb) +
            '<h1 class="bm-fb-title">📝 משוב על העבודה' +
              '<span>' + esc(fb.student) + (fb.assignment ? ' · ' + esc(fb.assignment) : '') + (fb.sent ? ' · ' + esc(fb.sent) : '') + '</span></h1></div>' +
          (fb.summary ? '<p class="bm-fb-sum">' + esc(fb.summary) + '</p>' : '') +
          (fb.comment && fb.comment !== fb.summary ? '<p class="bm-fb-sum">' + esc(fb.comment) + '</p>' : '') +
          redoHtml(fb, false) +
          (/^[\w.-]+\.html$/.test(fb.page || "") ? '<p class="bm-fb-legend"><a href="' + esc(fb.page) + '">לדף העבודה ›</a> (התשובות שלך שמורות שם, במכשיר שממנו שלחת)</p>' : '') +
          fixListHtml(fb.items || [], "bmFbFull") +
          ((fb.items || []).some(function(x){ return !isOk(x); }) ? '<h2 class="bm-fb-h">איפה טעית ומה לתקן</h2>' : '') +
          '<ul class="bm-fb-list">' + (fb.items || []).map(function(x, i){ return isOk(x) ? '' : '<li>' + itemHtml(x, true, "bmFbFull" + i) + '</li>'; }).join("") + '</ul>' +
          ((fb.items || []).some(isOk) ? '<details class="bm-fb-legend"><summary>✅ השאלות שענית עליהן נכון</summary><ul class="bm-fb-list">' +
            (fb.items || []).map(function(x, i){ return isOk(x) ? '<li>' + itemHtml(x, true, "bmFbFull" + i) + '</li>' : ''; }).join("") + '</ul></details>' : '') +
        '</div>';
      var h = (location.hash || "").slice(1), t = h && document.getElementById(h);
      if(t){ if(t.closest("details")) t.closest("details").open = true; t.scrollIntoView({ block:"center" }); t.focus(); }
    }).catch(function(){ root.innerHTML = '<p class="bm-fb-sum">אין חיבור לאינטרנט כרגע. נסו שוב בעוד רגע.</p>'; });
  }

  window.BM_FEEDBACK = { fullPage: fullPage };
  if(!API) return;
  var full = document.getElementById("bmFeedbackFull");
  if(full){ fullPage(full); return; }

  var subs = [];
  try{ subs = JSON.parse(localStorage.getItem("bm-my-subs") || "[]"); }catch(e){}
  subs = subs.filter(function(x){ return x && x.page === page && x.id; }).slice(0, 6);
  /* מהחדשה לישנה; מציגים את המשוב העדכני ביותר שהמורה כבר פרסם (ובנושאים נפרדים - לכל נושא) */
  var seen = {};
  subs.reduce(function(p, sub){
    return p.then(function(){
      var key = sub.n || sub.a || "*";   /* לכל מטלה (נושא) - המשוב העדכני שלה */
      if(seen[key]) return;
      return load(sub.id).then(function(res){
        if(res && res.ok && res.feedback){ seen[key] = true; inPage(sub, res.feedback); }
      }).catch(function(){});
    });
  }, Promise.resolve());
})();
