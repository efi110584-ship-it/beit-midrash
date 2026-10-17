/* ============================================================
   פעילות חיה - תצוגת התוצאות (ענן מילים ועמודות הצבעה)
   ============================================================
   משותף לשלושה מקומות: דף התלמיד (live.html), המקרן (screen.html)
   והאזור האישי בדף הבית. כל מקום קובע את הגודל עם "size":
   "small" (אזור אישי), "normal" (תלמיד), "big" (מקרן).
   ============================================================ */
(function(){
  "use strict";
  var COLORS = ["#123A78", "#E0791F", "#0D8A63", "#8E3B8E", "#B8520A", "#2B6CB0", "#A3470A", "#0A6B4C"];
  var BAR_COLORS = ["#123A78", "#E0791F", "#0D8A63", "#8E3B8E"];

  function esc(s){
    return String(s || "").replace(/[&<>"']/g, function(c){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  }

  /* ענן: המילה הנפוצה באמצע, והשאר מתפזרות לשני הצדדים */
  function cloudHtml(words, size){
    if(!words || !words.length) return '<p class="lv-none">עוד אין מילים. הן יופיעו כאן ברגע שהתלמידים יכתבו.</p>';
    var list = words.slice(0, size === "small" ? 40 : 70);
    var max = list[0].c, min = list[list.length - 1].c;
    var lo = size === "big" ? 1.6 : (size === "small" ? 0.95 : 1.1);
    var hi = size === "big" ? 6 : (size === "small" ? 2.2 : 3.2);
    var arranged = [];
    list.forEach(function(w, i){ if(i % 2) arranged.push(w); else arranged.unshift(w); });
    return '<div class="lv-cloud lv-' + (size || "normal") + '" role="list">' + arranged.map(function(w){
      var k = max === min ? 1 : (w.c - min) / (max - min);
      var fs = (lo + (hi - lo) * Math.sqrt(k)).toFixed(2);
      var idx = list.indexOf(w);
      return '<span role="listitem" class="lv-word" style="font-size:' + fs + 'rem;color:' + COLORS[idx % COLORS.length] + '" title="' + w.c + '">' +
        esc(w.w) + (w.c > 1 ? '<span class="visually-hidden"> (' + w.c + ')</span>' : '') + '</span>';
    }).join("") + '</div>';
  }

  function pollHtml(activity, results, size, mine){
    var opts = activity.options || [];
    var counts = (results && results.counts) || opts.map(function(){ return 0; });
    var total = counts.reduce(function(a, b){ return a + b; }, 0);
    return '<div class="lv-bars lv-' + (size || "normal") + '">' + opts.map(function(o, i){
      var n = counts[i] || 0;
      var pct = total ? Math.round(n * 100 / total) : 0;
      return '<div class="lv-bar' + (mine === i ? " is-mine" : "") + '">' +
        '<div class="lv-bar-top"><span class="lv-bar-label">' + esc(o) + (mine === i ? ' <span class="lv-bar-mine">✓ הבחירה שלכם</span>' : '') + '</span>' +
        '<span class="lv-bar-num">' + pct + '% <span class="lv-bar-n">(' + n + ')</span></span></div>' +
        '<div class="lv-bar-track"><div class="lv-bar-fill" style="width:' + pct + '%;background:' + BAR_COLORS[i % BAR_COLORS.length] + '"></div></div>' +
      '</div>';
    }).join("") + '</div>';
  }

  function reasonsHtml(activity, results, size, withNames, limit){
    var list = ((results && results.reasons) || []).slice(0, limit || 12);
    if(!list.length) return "";
    var opts = activity.options || [];
    return '<ul class="lv-reasons lv-' + (size || "normal") + '">' + list.map(function(r){
      return '<li class="lv-reason" style="border-inline-start-color:' + BAR_COLORS[r.o % BAR_COLORS.length] + '">' +
        '<span class="lv-reason-opt" style="color:' + BAR_COLORS[r.o % BAR_COLORS.length] + '">' + esc(opts[r.o] || "") + '</span>' +
        '<span class="lv-reason-text">' + esc(r.r) + '</span>' +
        (withNames && r.n ? '<span class="lv-reason-name">' + esc(r.n) + '</span>' : '') +
      '</li>';
    }).join("") + '</ul>';
  }

  /* סקר: לכל שאלה - עמודות (בחירה / דירוג 1-5) או רשימת תשובות פתוחות.
     opts.showTexts - להציג תשובות פתוחות (מורה ומקרן); opts.withNames - עם שמות (רק מורה, ורק בסקר עם שמות) */
  var SCALE_LABELS = ["1 · בכלל לא", "2", "3", "4", "5 · מאוד"];
  function surveyHtml(activity, results, size, opts){
    opts = opts || {};
    var qs = activity.questions || [], rs = (results && results.questions) || [];
    return '<div class="lv-survey lv-' + (size || "normal") + '">' + qs.map(function(q, i){
      var r = rs[i] || { answered:0 };
      var body;
      if(q.kind === "choice") body = pollHtml({ options:q.options }, { counts:r.counts || [] }, size);
      else if(q.kind === "scale") body = '<p class="lv-scale-avg">ממוצע: <b>' + (r.avg || 0) + '</b> מתוך 5</p>' + pollHtml({ options:SCALE_LABELS }, { counts:r.counts || [] }, size);
      else if(!opts.showTexts) body = '<p class="lv-none lv-none--quiet">התשובות הפתוחות מוצגות למורה.</p>';
      else {
        var texts = (r.texts || []).slice(0, opts.limit || 40);
        body = texts.length ? '<ul class="lv-texts">' + texts.map(function(x){
          return '<li class="lv-text">' + esc(x.t) + (opts.withNames && x.n ? '<span class="lv-text-name">' + esc(x.n) + '</span>' : '') + '</li>';
        }).join("") + '</ul>' : '<p class="lv-none lv-none--quiet">עוד אין תשובות.</p>';
      }
      return '<section class="lv-sq"><h3 class="lv-sq-h"><span class="lv-sq-n">' + (i + 1) + '</span><span class="lv-sq-q">' + esc(q.q) + '</span>' +
        '<span class="lv-sq-count">' + (r.answered || 0) + ' ענו</span></h3>' + body + '</section>';
    }).join("") + '</div>';
  }

  var css =
    ".lv-none{margin:0;padding:18px;text-align:center;color:#56637A;border:1px dashed #9FB3D6;border-radius:14px}" +
    ".lv-cloud{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.15em .55em;padding:14px 8px;line-height:1.15}" +
    ".lv-word{font-weight:700;font-family:'Rubik','Heebo',Arial,sans-serif;white-space:nowrap;animation:lvIn .4s ease-out}" +
    "@keyframes lvIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}" +
    ".lv-bars{display:flex;flex-direction:column;gap:12px}" +
    ".lv-bar-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:5px}" +
    ".lv-bar-label{font-weight:700;color:#0E1B33}" +
    ".lv-bar-mine{font-size:.78em;font-weight:700;color:#0D8A63}" +
    ".lv-bar-num{font-family:'Rubik',sans-serif;font-weight:700;color:#0E1B33;font-variant-numeric:tabular-nums;white-space:nowrap}" +
    ".lv-bar-n{font-weight:400;color:#56637A;font-size:.85em}" +
    ".lv-bar-track{height:18px;border-radius:999px;background:#E6ECF5;overflow:hidden}" +
    ".lv-bar-fill{height:100%;border-radius:999px;transition:width .6s ease}" +
    ".lv-bar.is-mine .lv-bar-track{box-shadow:0 0 0 2px #0D8A63}" +
    ".lv-big .lv-bar-top{font-size:2rem}.lv-big .lv-bar-track{height:42px}.lv-big.lv-bars{gap:26px}" +
    ".lv-small .lv-bar-top{font-size:.92rem}.lv-small .lv-bar-track{height:12px}" +
    ".lv-reasons{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}" +
    ".lv-reason{display:flex;flex-direction:column;gap:3px;padding:10px 12px;background:#fff;border:1px solid #DCE4F1;border-inline-start:5px solid;border-radius:10px}" +
    ".lv-reason-opt{font-size:.8rem;font-weight:700}" +
    ".lv-reason-text{color:#0E1B33;line-height:1.45;overflow-wrap:anywhere}" +
    ".lv-reason-name{font-size:.8rem;color:#56637A}" +
    ".lv-big.lv-reasons{grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}" +
    ".lv-big .lv-reason-text{font-size:1.45rem}.lv-big .lv-reason-opt{font-size:1.05rem}" +
    ".lv-survey{display:grid;gap:14px}" +
    ".lv-big.lv-survey{grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:22px}" +
    ".lv-survey.lv-big .lv-bars{gap:10px}.lv-survey.lv-big .lv-bar-top{font-size:1.3rem;margin-bottom:3px}.lv-survey.lv-big .lv-bar-track{height:22px}" +
    ".lv-sq{display:flex;flex-direction:column;gap:10px;padding:14px;background:#fff;border:1px solid #DCE4F1;border-radius:14px}" +
    ".lv-sq-h{display:flex;align-items:baseline;gap:8px;margin:0;font-size:1.05rem;color:#0E1B33;line-height:1.4}" +
    ".lv-big .lv-sq-h{font-size:1.7rem}" +
    ".lv-sq-n{flex:none;display:inline-grid;place-items:center;width:1.6em;height:1.6em;border-radius:50%;background:#123A78;color:#fff;font-size:.8em;font-family:'Rubik',sans-serif}" +
    ".lv-sq-q{flex:1 1 auto}" +
    ".lv-sq-count{flex:none;font-size:.8em;font-weight:400;color:#56637A;white-space:nowrap}" +
    ".lv-scale-avg{margin:0;color:#0E1B33}.lv-scale-avg b{font-family:'Rubik',sans-serif;font-size:1.3em;color:#123A78}" +
    ".lv-big .lv-scale-avg{font-size:1.5rem}" +
    ".lv-none--quiet{padding:10px;font-size:.92rem}" +
    ".lv-texts{list-style:none;margin:0;padding:0;display:grid;gap:8px}" +
    ".lv-text{padding:8px 12px;background:#F7F9FD;border:1px solid #E3EAF5;border-radius:10px;color:#0E1B33;line-height:1.45;overflow-wrap:anywhere}" +
    ".lv-big .lv-text{font-size:1.4rem}" +
    ".lv-text-name{display:block;margin-top:2px;font-size:.8rem;color:#56637A}" +
    "@media (prefers-reduced-motion:reduce){.lv-word{animation:none}.lv-bar-fill{transition:none}}";
  if(!document.getElementById("lvStyle")){
    var st = document.createElement("style");
    st.id = "lvStyle";
    st.textContent = css;
    document.head.appendChild(st);
  }

  window.BM_LIVE = { esc:esc, cloudHtml:cloudHtml, pollHtml:pollHtml, reasonsHtml:reasonsHtml, surveyHtml:surveyHtml };
})();
