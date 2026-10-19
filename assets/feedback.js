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
      "@media print{.bm-fb-top{box-shadow:none}}";
    document.head.appendChild(st);
  }
  function fmtDate(t){
    var d = new Date(t);
    return isNaN(d) ? "" : d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
  }
  function gradeHtml(fb){
    return fb.grade !== "" ? '<div class="bm-fb-grade" aria-label="הציון: ' + esc(fb.grade) + '"><span>' + esc(fb.grade) + '<small>ציון</small></span></div>' : "";
  }
  function itemHtml(x, withQ){
    var st = STATUS[x.s] || STATUS.partial;
    return '<div class="bm-fb bm-fb-q bm-fb-q--' + (STATUS[x.s] ? x.s : "partial") + '" role="note">' +
      '<b><span aria-hidden="true">' + st.ico + '</span> משוב מהמורה' + (x.n ? ' על שאלה ' + esc(x.n) : '') + ': ' + st.label + '</b>' +
      (withQ && x.q ? '<span class="bm-fb-qtext">' + esc(x.q) + '</span>' : '') +
      esc(x.text) + '</div>';
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
      '<p class="bm-fb-legend">מתחת לכל שאלה בדף מופיע הסבר: ✅ מלאה · 🟡 חלקית · ❌ חסר. ' +
        '<a href="feedback.html?id=' + encodeURIComponent(sub.id) + '">לכל המשוב בעמוד אחד ›</a></p>';
    var anchor = document.querySelector(".student-bar") || document.querySelector("header");
    var main = document.querySelector("main");
    if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(top, anchor.nextSibling);
    else if(main) main.insertBefore(top, main.firstChild);
    else document.body.insertBefore(top, document.body.firstChild);

    (fb.items || []).forEach(function(x){
      if(!x.id) return;
      var field = document.querySelector('.answer[data-id="' + x.id.replace(/["\\]/g, "") + '"]');
      if(!field) return;
      var box = document.createElement("div");
      box.innerHTML = itemHtml(x, false);
      field.parentNode.insertBefore(box.firstChild, field.nextSibling);
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
          (/^[\w.-]+\.html$/.test(fb.page || "") ? '<p class="bm-fb-legend"><a href="' + esc(fb.page) + '">לדף העבודה ›</a> (התשובות שלך שמורות שם, במכשיר שממנו שלחת)</p>' : '') +
          '<ul class="bm-fb-list">' + (fb.items || []).map(function(x){ return '<li>' + itemHtml(x, true) + '</li>'; }).join("") + '</ul>' +
        '</div>';
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
      var key = sub.n || "*";
      if(seen[key]) return;
      return load(sub.id).then(function(res){
        if(res && res.ok && res.feedback){ seen[key] = true; inPage(sub, res.feedback); }
      }).catch(function(){});
    });
  }, Promise.resolve());
})();
