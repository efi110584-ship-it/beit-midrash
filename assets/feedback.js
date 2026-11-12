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
      ".bm-fb-bad{display:inline-block;margin:.35rem .3rem .1rem;padding:.15rem .6rem;border-radius:999px;background:#FDECEA;color:#7A1C14;border:1px solid #E59A92;font-weight:700;font-size:.9rem}" +
      ".bm-fb-bad.is-fixed{background:#F4F7FC;color:#33415C;border-color:#B9C4D8}" +
      ".bm-fb-go{display:inline-flex;align-items:center;min-height:48px;padding:.4rem 1.2rem;border-radius:12px;background:#E8650C;color:#fff;font-weight:700;font-size:1.08rem;text-decoration:none}" +
      ".bm-fb-go:focus-visible{outline:3px solid #123A78;outline-offset:2px}" +
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
  function redoHtml(fb, inPage, local, noLocal){
    if(fb.redoSent) return '<p class="bm-fb-redo-done">✓ שלחת תיקון. המורה יבדוק אותו ויחזיר משוב.</p>';
    if(!fb.redo) return "";
    /* בדיקה אוטומטית, והתשובות לא שמורות במכשיר הזה (נשלחו ממחשב אחר) - אין מה לסמן */
    if(inPage && noLocal) return '<div class="bm-fb-redo" role="note"><b>🔁 המורה ביקש לתקן ולשלוח שוב</b>' +
      '<span>התשובות ששלחת לא שמורות במכשיר הזה. הכי טוב לפתוח את הדף במכשיר שממנו שלחת - שם יסומן ❌ ליד כל סעיף שצריך לתקן. ' +
      'אפשר גם לענות כאן שוב על השאלות וללחוץ "שלחו למורה".</span>' +
      '<span class="bm-fb-redo-actions"><button type="button" data-redo-go="send">📤 לשליחה מחדש</button></span></div>';
    return '<div class="bm-fb-redo" role="note"><b>🔁 המורה ביקש לתקן ולשלוח שוב</b>' +
      '<span>' + (inPage ? (local ? 'התשובות שלך שמורות בדף. הסעיפים שצריך לתקן מסומנים ❌ (התשובה לא נכונה, או שלא ענית). תקנו אותם, ואז לחצו "שלחו למורה".'
                                  : 'התשובות שלך שמורות בדף. תקנו את השאלות שמסומנות ❌ או 🟡 (ההסבר מופיע מתחת לכל אחת), ואז לחצו "שלחו למורה".')
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
    /* יחידות הגזרות (assets/unit-pages.js): השדה בעמוד אחר של היחידה */
    if(!el.getClientRects().length && window.BM_UNIT_GOTO) window.BM_UNIT_GOTO(el);
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

  /* ---------- עבודה שנבדקה אוטומטית (בלי משוב מפורט מהמורה) ----------
     הדף עצמו יודע אם כל תשובה נכונה (assets/autoscore.js - BM_FIELD_OK), לפי התשובות השמורות בדף.
     מסמנים ❌ רק ליד הסעיפים השגויים או החסרים - בלי לחשוף את התשובה הנכונה. */
  function fieldLabel(f){
    var al = String(f.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
    var gc = f.closest(".gzb-card"), gt = gc && gc.querySelector(".card-title");
    if(al && gt && al.indexOf("·") === -1) al = gt.textContent.replace(/\s+/g, " ").trim() + " · " + al;
    return al || "סעיף";
  }
  function localItems(){
    if(typeof window.BM_FIELD_OK !== "function") return [];
    var scopes = document.querySelectorAll("[data-submit-scope]");
    var fields = Array.prototype.filter.call(document.querySelectorAll(".answer[data-id]"), function(f){
      if(!/^(INPUT|SELECT|TEXTAREA)$/.test(f.tagName)) return false;
      return !scopes.length || Array.prototype.some.call(scopes, function(s){ return s.contains(f); });
    });
    var out = [], filled = 0;
    fields.forEach(function(f){
      var ok = window.BM_FIELD_OK(f);
      if(ok === null) return;
      var empty = !String(f.value || "").trim();
      if(!empty) filled++;
      out.push({ id: f.getAttribute("data-id"), q: fieldLabel(f), s: ok ? "full" : "miss", empty: empty, local: true });
    });
    /* במכשיר אחר אין תשובות שמורות - לא מסמנים הכול כשגוי */
    return filled ? out : [];
  }

  /* המורה ביקש תיקון: התשובות ששלח התלמיד (מהשרת) חוזרות לשדות הריקים בדף -
     כך אפשר לתקן גם במכשיר אחר, או כשהמבחן נשלח לבד בסוף הזמן. שדה שכבר כתוב בו משהו - לא נוגעים. */
  function restoreAnswers(a){
    if(!a || !a.values || (a.page && a.page !== page)) return;
    var groups = document.querySelectorAll(".mc-group");
    Object.keys(a.values).forEach(function(k){
      var v = String(a.values[k]);
      var m = /^mc:(\d+)$/.exec(k);
      if(m){
        var g = groups[+m[1]], opts = g ? g.querySelectorAll('input[type="radio"]') : [];
        if(!g || g.querySelector('input[type="radio"]:checked') || !opts[+v]) return;
        opts[+v].checked = true;
        opts[+v].dispatchEvent(new Event("change", { bubbles:true }));
        return;
      }
      var f = document.querySelector('.answer[data-id="' + k.replace(/["\\]/g, "") + '"]');
      if(!f || !/^(INPUT|SELECT|TEXTAREA)$/.test(f.tagName) || String(f.value || "").trim()) return;
      f.value = v;
      f.dispatchEvent(new Event("input", { bubbles:true }));
      f.dispatchEvent(new Event("change", { bubbles:true }));
    });
  }

  /* ---------- בדף העבודה: ציון בראש הדף, הסבר מתחת לכל שאלה ---------- */
  function inPage(sub, fb){
    css();
    markSeen(sub.id);
    if(fb.redo && !fb.redoSent){
      restoreAnswers(fb.answers);
      var studentName = document.getElementById("studentName");
      if(studentName && !studentName.value && fb.student){
        studentName.value = fb.student;
        studentName.dispatchEvent(new Event("input", { bubbles:true }));
      }
    }
    var items = fb.items || [];
    var local = false;
    if(!items.length && fb.auto){ items = localItems(); local = items.length > 0; }
    var top = document.createElement("section");
    top.className = "bm-fb bm-fb-top";
    top.setAttribute("aria-label", "המשוב של המורה");
    top.innerHTML =
      '<div class="bm-fb-head">' + gradeHtml(fb) +
        '<h2 class="bm-fb-title">📝 המורה בדק את העבודה ששלחת' +
          '<span>' + esc(fb.assignment || sub.a) + (sub.n ? ' · ' + esc(sub.n) : '') + (sub.t ? ' · נשלחה ב-' + fmtDate(sub.t) : '') + '</span></h2></div>' +
      (fb.summary ? '<p class="bm-fb-sum">' + esc(fb.summary) + '</p>' : '') +
      (fb.comment && fb.comment !== fb.summary ? '<p class="bm-fb-sum">' + esc(fb.comment) + '</p>' : '') +
      redoHtml(fb, true, local, !!fb.auto && !local) +
      fixListHtml(items, "bmFbIt") +
      (local ? '<p class="bm-fb-legend">ליד כל סעיף שצריך לתקן מופיע ❌. התשובות הנכונות לא מוצגות - נסו לבד.</p>'
             : fb.auto ? '<p class="bm-fb-legend">התשובות שלך שמורות בדף העבודה במכשיר שממנו שלחת. פתחו אותו שם כדי לראות מה לתקן.</p>'
             : '<p class="bm-fb-legend">ליד כל שאלה שצריך לתקן מופיע הסבר. ' +
        '<a href="feedback.html?id=' + encodeURIComponent(sub.id) + '">לכל המשוב בעמוד אחד ›</a></p>');
    var anchor = document.querySelector(".student-bar") || document.querySelector("header");
    var main = document.querySelector("main");
    if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(top, anchor.nextSibling);
    else if(main) main.insertBefore(top, main.firstChild);
    else document.body.insertBefore(top, document.body.firstChild);

    items.forEach(function(x, i){
      if(!x.id) return;
      var field = document.querySelector('.answer[data-id="' + x.id.replace(/["\\]/g, "") + '"]');
      if(!field) return;
      if(x.local){
        if(isOk(x)) return;   /* תשובה נכונה - בלי סימון, כדי לא להעמיס על הטבלה */
        var tag = document.createElement("span");
        tag.className = "bm-fb bm-fb-bad";
        tag.id = "bmFbIt" + i;
        tag.tabIndex = -1;
        tag.textContent = x.empty ? "❌ לא ענית - השלימו" : "❌ לא נכון - תקנו";
        field.parentNode.insertBefore(tag, field.nextSibling);
        /* אחרי שינוי: "✏️ שונה" - בלי לגלות אם התיקון נכון (כך אי אפשר לנחש עד שהסימן נעלם) */
        var changed = function(){ tag.classList.add("is-fixed"); tag.textContent = "✏️ שונה"; };
        field.addEventListener("input", changed);
        field.addEventListener("change", changed);
        return;
      }
      var box = document.createElement("div");
      box.innerHTML = isOk(x) ? '<span class="bm-fb bm-fb-ok" id="bmFbIt' + i + '">✅ נכון</span>' : itemHtml(x, false, "bmFbIt" + i);
      field.parentNode.insertBefore(box.firstChild, field.nextSibling);
    });
    if(fb.redo && !fb.redoSent) redoStore(fb.assignment || sub.a, sub.id);
    else if(fb.redoSent) redoStore(fb.assignment || sub.a, "");
    Array.prototype.forEach.call(top.querySelectorAll("[data-redo-go]"), function(b){
      b.addEventListener("click", function(){
        if(b.getAttribute("data-redo-go") === "send"){ goTo(document.getElementById("sendToTeacherBtn")); return; }
        var first = null;
        items.some(function(x, i){ if(isOk(x)) return false; first = document.getElementById("bmFbIt" + i); return !!first; });
        var field = first && first.previousElementSibling;
        goTo(field && field.matches && field.matches(".answer") ? field : first);
      });
    });
    /* קישור "מה לתקן" לשאלה שלא נמצאה בדף (למשל בדף אחר של היחידה) - לעמוד המשוב המלא */
    Array.prototype.forEach.call(top.querySelectorAll('.bm-fb-fix a'), function(a){
      var target = document.getElementById(a.getAttribute("href").slice(1));
      if(!target){ if(!local) a.href = "feedback.html?id=" + encodeURIComponent(sub.id) + a.getAttribute("href").replace("bmFbIt", "bmFbFull"); return; }
      /* מעבר לשדה עצמו - גם אם הוא בעמוד אחר של היחידה */
      a.addEventListener("click", function(e){
        e.preventDefault();
        var field = target.previousElementSibling;
        goTo(field && field.matches && field.matches(".answer") ? field : target);
      });
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
          (fb.redo && !fb.redoSent ? '' : redoHtml(fb, false)) +
          (/^[\w.-]+\.html$/.test(fb.page || "") ? (fb.redo && !fb.redoSent
            ? '<div class="bm-fb-redo" role="note"><b>🔁 המורה ביקש לתקן ולשלוח שוב</b><span>לחצו על הכפתור - דף המבחן ייפתח עם התשובות ששלחתם, וליד כל סעיף שצריך לתקן יופיע ❌. תקנו ולחצו "שלחו למורה".</span></div><p class="bm-fb-redo-actions"><a class="bm-fb-go" href="' + esc(fb.page) + '?fb=' + encodeURIComponent(id) + '">✏️ לתיקון בדף ' + (/מבחן/.test(fb.assignment || "") ? 'המבחן' : 'העבודה') + ' ›</a></p>'
            : '<p class="bm-fb-legend"><a href="' + esc(fb.page) + '">לדף העבודה ›</a> (התשובות שלך שמורות שם, במכשיר שממנו שלחת)</p>') : '') +
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

  function localSubs(){
    var subs = [];
    try{ subs = JSON.parse(localStorage.getItem("bm-my-subs") || "[]"); }catch(e){}
    return subs.filter(function(x){ return x && x.page === page && x.id; }).slice(0, 6);
  }

  /* ---------- תלמיד מחובר לאזור האישי (my.html) ----------
     העבודות שלו נשמרות גם בשרת (action=studentWork). כך המשוב והבקשה לתיקון מופיעים בדף
     גם כשהעבודה לא נשלחה מהמכשיר הזה - למשל מבחן שנשלח לבד בסוף הזמן, או נשלח ממחשב אחר. */
  function taskKey(t){ return String(t || "").replace(/["'׳״:*?<>|\\\/]/g, " ").replace(/\s+/g, " ").trim(); }
  function pageTasks(){
    var out = {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-assignment]"), function(b){ var k = taskKey(b.getAttribute("data-assignment")); if(k) out[k] = 1; });
    try{ if(window.BM_SEND_API){ var k = taskKey(window.BM_SEND_API.data().assignment); if(k) out[k] = 1; } }catch(e){}
    return out;
  }
  function serverSubs(){
    var me = null;
    try{ me = JSON.parse(localStorage.getItem("bm-student") || "null"); }catch(e){}
    if(!(me && me.tok) || !document.getElementById("sendToTeacherBtn")) return Promise.resolve();
    var CK = "bm-stu-work", work = null;
    try{ var c = JSON.parse(sessionStorage.getItem(CK) || "null"); if(c && c.tok === me.tok && Date.now() - c.t < 180000) work = c.work; }catch(e){}
    var got = work ? Promise.resolve(work) : fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" },
        body:JSON.stringify({ action:"studentWork", tok:me.tok }) })
      .then(function(r){ return r.json(); })
      .then(function(res){
        var w = res && res.ok ? (res.work || []) : [];
        try{ sessionStorage.setItem(CK, JSON.stringify({ tok:me.tok, t:Date.now(), work:w })); }catch(e){}
        return w;
      });
    return got.then(function(w){
      var mine = pageTasks();
      var add = (w || []).filter(function(x){ return x && x.id && x.pub && mine[taskKey(x.task)]; });
      if(!add.length) return;
      try{
        var list = JSON.parse(localStorage.getItem("bm-my-subs") || "[]");
        /* מהישנה לחדשה, כדי שהחדשה תהיה ראשונה ברשימה */
        add.slice().reverse().forEach(function(x){
          if(list.some(function(y){ return y && y.id === x.id; })) return;
          list.unshift({ id:String(x.id), page:page, a:String(x.task || ""), n:"", t:x.time || Date.now() });
        });
        list.sort(function(a, b){ return (b && b.t || 0) - (a && a.t || 0); });
        localStorage.setItem("bm-my-subs", JSON.stringify(list.slice(0, 80)));
      }catch(e){}
    }).catch(function(){});
  }

  /* הדף נפתח מהכפתור "לתיקון" בעמוד המשוב (?fb=<מזהה>) - זוכרים את העבודה במכשיר הזה */
  (function(){
    var id = (new URLSearchParams(location.search).get("fb") || "").replace(/[^\w-]/g, "");
    if(!id) return;
    try{
      var list = JSON.parse(localStorage.getItem("bm-my-subs") || "[]");
      list = list.filter(function(x){ return x && x.id !== id; });
      list.unshift({ id:id, page:page, a:"", n:"", t:Date.now() });
      localStorage.setItem("bm-my-subs", JSON.stringify(list.slice(0, 80)));
    }catch(e){}
  })();

  /* מהחדשה לישנה; מציגים את המשוב העדכני ביותר שהמורה כבר פרסם (ובנושאים נפרדים - לכל נושא) */
  var seen = {};
  /* הדף צריך להיות טעון עד הסוף: התשובות השמורות חזרו לשדות, והבדיקה (assets/autoscore.js) קיימת */
  var pageReady = new Promise(function(res){
    function go(){ setTimeout(res, 50); }
    if(document.readyState === "complete") go(); else window.addEventListener("load", go);
  });
  serverSubs().then(function(){ return pageReady; }).then(function(){ localSubs().reduce(function(p, sub){
    return p.then(function(){
      var key = sub.n || sub.a || "*";   /* לכל מטלה (נושא) - המשוב העדכני שלה */
      if(seen[key]) return;
      return load(sub.id).then(function(res){
        if(res && res.ok && res.feedback){ seen[key] = true; return pageReady.then(function(){ inPage(sub, res.feedback); }); }
      }).catch(function(){});
    });
  }, Promise.resolve()); });
})();
