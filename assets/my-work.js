/* ============================================================
   "העבודות שלי" בדף הבית - לתלמיד
   ============================================================
   מציג את העבודות שנשלחו מהמכשיר הזה (localStorage "bm-my-subs",
   נשמר ב-assets/direct-submit.js, או כשפותחים קישור משוב מהמורה):
   - עבודה שהמורה כבר בדק ופרסם לה משוב: ציון וקישור למשוב המלא.
   - עבודה שעוד לא נבדקה: "נשלחה, ממתינה לבדיקה".
   משוב שהתלמיד עוד לא ראה מסומן "חדש" (localStorage "bm-fb-seen").
   ============================================================ */
(function(){
  "use strict";
  var API = window.BM_API_URL;
  var box = document.getElementById("myWork");
  if(!API || !box) return;
  var MAX = 6, CACHE = "bm-fb-cache", TTL = 5 * 60 * 1000;

  function read(key, store, def){ try{ return JSON.parse((store || localStorage).getItem(key) || "null") || def; }catch(e){ return def; } }
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  }
  function fmt(t){ var d = new Date(t); return isNaN(d) ? "" : d.getDate() + "." + (d.getMonth() + 1); }

  var subs = read("bm-my-subs", null, []).filter(function(x){ return x && x.id; });
  /* אותה עבודה פעמיים (נשלחה שוב) - מציגים רק את האחרונה */
  var byKey = {};
  subs = subs.filter(function(x){ var k = x.page + "|" + (x.n || ""); if(byKey[k]) return false; byKey[k] = true; return true; }).slice(0, MAX);
  if(!subs.length) return;

  var cache = read(CACHE, sessionStorage, {});
  function status(id){
    var c = cache[id];
    if(c && Date.now() - c.t < TTL) return Promise.resolve(c.fb);
    return fetch(API + "?action=feedback&id=" + encodeURIComponent(id)).then(function(r){ return r.json(); }).then(function(res){
      var fb = res && res.ok ? (res.feedback || null) : null;
      cache[id] = { t: Date.now(), fb: fb ? { grade: fb.grade, assignment: fb.assignment } : null };
      try{ sessionStorage.setItem(CACHE, JSON.stringify(cache)); }catch(e){}
      return cache[id].fb;
    }).catch(function(){ return undefined; });
  }

  Promise.all(subs.map(function(s){ return status(s.id); })).then(function(list){
    var seen = read("bm-fb-seen", null, []);
    var fresh = 0;
    var rows = subs.map(function(s, i){
      var fb = list[i];
      var name = esc((fb && fb.assignment) || s.a || "עבודה") + (s.n ? ' <span class="my-work-topic">' + esc(s.n) + '</span>' : "");
      var del = '<button type="button" class="my-work-del" data-del="' + esc(s.page + "|" + (s.n || "")) + '" aria-label="' +
        esc("הסרה מהרשימה: " + ((fb && fb.assignment) || s.a || "עבודה") + (s.n ? " " + s.n : "")) + '">✕</button>';
      if(fb){
        var isNew = seen.indexOf(s.id) === -1;
        if(isNew) fresh++;
        return '<li class="my-work-row is-done' + (isNew ? ' is-new' : '') + '">' +
          '<a href="feedback.html?id=' + encodeURIComponent(s.id) + '" data-fb="' + esc(s.id) + '">' +
            '<span class="my-work-name">' + (isNew ? '<span class="my-work-new">חדש</span>' : '') + name + '</span>' +
            '<span class="my-work-state">✅ נבדקה' + (fb.grade !== "" ? ' · ציון <b>' + esc(fb.grade) + '</b>' : '') + ' · למשוב ›</span>' +
          '</a>' + del + '</li>';
      }
      return '<li class="my-work-row"><span class="my-work-body"><span class="my-work-name">' + name + '</span>' +
        '<span class="my-work-state">⏳ נשלחה ב-' + fmt(s.t) + ', ממתינה לבדיקה</span></span>' + del + '</li>';
    }).join("");
    box.innerHTML =
      '<h2 class="my-work-title">' + (fresh ? '📝 יש לך משוב חדש מהמורה!' : '📝 העבודות שלי') + '</h2>' +
      '<ul class="my-work-list">' + rows + '</ul>' +
      '<p class="my-work-note">רק עבודות שנשלחו מהמכשיר הזה. <a href="my.html">כל העבודות שלך, מכל מכשיר - באזור האישי ›</a></p>';
    box.classList.toggle("has-new", fresh > 0);
    box.hidden = false;
    box.addEventListener("click", function(e){
      /* ✕ - מסיר רק מהרשימה במכשיר הזה. העבודה עצמה כבר אצל המורה */
      var d = e.target.closest && e.target.closest("[data-del]");
      if(d){
        if(!confirm("להסיר את העבודה מהרשימה?\nהיא תוסר רק מהרשימה במכשיר הזה - העבודה עצמה כבר נשלחה למורה.")) return;
        var key = d.getAttribute("data-del");
        var left = read("bm-my-subs", null, []).filter(function(x){ return !x || (x.page + "|" + (x.n || "")) !== key; });
        try{ localStorage.setItem("bm-my-subs", JSON.stringify(left)); }catch(err){}
        var li = d.closest("li");
        if(li) li.parentNode.removeChild(li);
        if(!box.querySelector(".my-work-row")) box.hidden = true;
        return;
      }
      var a = e.target.closest && e.target.closest("[data-fb]");
      if(!a) return;
      var s = read("bm-fb-seen", null, []);
      if(s.indexOf(a.getAttribute("data-fb")) === -1){ s.push(a.getAttribute("data-fb")); try{ localStorage.setItem("bm-fb-seen", JSON.stringify(s.slice(-200))); }catch(err){} }
    });
  });
})();
