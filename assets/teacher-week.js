/* ============================================================
   סיכום שבועי לקלוד - במסך הראשי של האזור האישי
   ============================================================
   לוחצים "הכנת סיכום" -> השרת מחזיר את כל מה שקרה בימים האחרונים (action: weekSummary, עם סיסמת המורה)
   -> נבנה טקסט מסודר: שיעורים עם בקרה, נוכחות, הגשות וציונים, מה מחכה לבדיקה, משימות, מבחנים והודעה.
   אפשר להעתיק אותו ולהדביק בשיחה עם Claude, או להוריד כקובץ.
   window.BM_TEACHER_WEEK.mount() נקרא מ-index.html אחרי שאזור המורה נבנה.
   ============================================================ */
(function(){
  "use strict";
  var CLS = { "יא":"י״א 4", "יב":"י״ב 2" };
  var MARK = { a:"חיסור", l:"איחור" };
  var EVN = { c:"מחמאה", b:"הערת התנהגות", n:"ללא מחשב נייד", h:"ללא שיעורי בית" };
  var CHECKN = { p:"פיזי", o:"מקוון", v:"קולי", x:"לא התקיים" };
  var DAYN = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];

  function token(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  function post(body){
    body.password = token();
    return fetch(window.BM_API_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body) })
      .then(function(r){ return r.json(); })
      .then(function(r){ if(!r || !r.ok) throw new Error((r && r.error) || "השרת לא החזיר נתונים"); return r; });
  }
  function cls(c){ return CLS[c] || c || ""; }
  function heDate(iso){ var p = String(iso || "").split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(iso || ""); }
  function dayName(iso){ var p = String(iso).split("-"); return DAYN[new Date(+p[0], +p[1] - 1, +p[2]).getDay()]; }
  function fromTime(t){ var d = new Date(t); return "יום " + DAYN[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function abc(a, b){ return String(a).localeCompare(String(b), "he"); }
  function mins(sec){ sec = +sec || 0; return sec < 60 ? sec + " שנ׳" : Math.round(sec / 60) + " דק׳"; }
  function cell(v){ return String(v == null ? "" : v).replace(/\|/g, "/").replace(/\s+/g, " ").trim(); }

  /* ---------- בניית הטקסט ---------- */
  function build(d){
    var L = [];
    L.push("# סיכום שבועי - הבית הדיגיטלי של תיכון יש\"י");
    L.push("טווח: " + heDate(d.from) + " עד " + heDate(d.to) + " (" + d.days + " ימים). הנתונים מהאתר, בלי תעודות זהות.");
    L.push("");

    /* 1. שיעורים עם בקרה */
    var les = (d.lessons || []).slice().sort(function(a, b){ return a.created - b.created; });
    L.push("## 1. שיעורים עם בקרה (" + les.length + ")");
    if(!les.length) L.push("לא נשמרו השבוע דוחות של שיעורים עם בקרה.");
    les.forEach(function(x){
      L.push("### " + (x.label || "שיעור") + " · " + (cls(x.cls) || "כיתה לא צוינה") + " · " + fromTime(x.created));
      if(x.url) L.push("- דף: " + x.url);
      var st = x.students || [];
      L.push("- תלמידים בשיעור: " + (st.length || x.count || 0));
      var flagged = st.filter(function(s){ return s.leaves > 0 || s.pastes > 0 || s.kicked; });
      if(flagged.length){
        L.push("- יצאו מהדף / הדביקו טקסט:");
        flagged.forEach(function(s){
          var parts = [];
          if(s.leaves) parts.push("יצא " + s.leaves + " פעמים, סה״כ " + mins(s.outSec) + " מחוץ לדף");
          if(s.pastes) parts.push(s.pastes + " הדבקות");
          if(s.kicked) parts.push("הוצא מהשיעור");
          L.push("  - " + s.name + ": " + parts.join(", "));
        });
      } else if(st.length) L.push("- כל התלמידים נשארו בדף.");
      var ok = st.filter(function(s){ return !(s.leaves > 0 || s.pastes > 0 || s.kicked); }).map(function(s){ return s.name; }).sort(abc);
      if(ok.length && flagged.length) L.push("- נשארו בדף כל השיעור: " + ok.join(", "));
    });
    L.push("");

    /* 2. נוכחות */
    var att = d.attendance || {}, dates = Object.keys(att).sort();
    L.push("## 2. נוכחות ואירועים");
    if(!dates.length) L.push("לא נרשמה נוכחות בימים האלה.");
    var per = {};
    dates.forEach(function(date){
      var day = att[date] || {};
      L.push("### יום " + dayName(date) + " " + heDate(date));
      Object.keys(day).sort(function(a, b){ return (+a.split("|")[0]) - (+b.split("|")[0]); }).forEach(function(key){
        var e = day[key] || {}, hour = key.split("|")[0], c = key.split("|")[1];
        var head = "- שעה " + hour + " · " + cls(c) + (e.s ? " · " + e.s : "") + (e.k && e.k !== "p" && e.k !== "x" ? " (" + (CHECKN[e.k] || e.k) + ")" : "");
        if(e.k === "x"){ L.push(head + ": השיעור לא התקיים"); return; }
        var groups = {};
        Object.keys(e.m || {}).forEach(function(n){ var k = MARK[e.m[n]] || e.m[n]; (groups[k] = groups[k] || []).push(n); var p = per[c + "|" + n] || (per[c + "|" + n] = { c:c, n:n, a:0, l:0 }); if(e.m[n] === "a") p.a++; if(e.m[n] === "l") p.l++; });
        Object.keys(e.e || {}).forEach(function(n){ (e.e[n] || []).forEach(function(code){ var k = EVN[code] || code; (groups[k] = groups[k] || []).push(n); }); });
        var parts = Object.keys(groups).map(function(k){ return k + ": " + groups[k].sort(abc).join(", "); });
        L.push(head + ": " + (parts.length ? parts.join(" · ") : "כולם נוכחים"));
      });
    });
    var many = Object.keys(per).map(function(k){ return per[k]; }).filter(function(p){ return p.a + p.l >= 2; })
      .sort(function(x, y){ return (y.a + y.l) - (x.a + x.l) || abc(x.n, y.n); });
    if(many.length){
      L.push("### חיסורים ואיחורים חוזרים השבוע");
      many.forEach(function(p){ L.push("- " + p.n + " (" + cls(p.c) + "): " + p.a + " חיסורים, " + p.l + " איחורים"); });
    }
    L.push("");

    /* 3. הגשות */
    var subs = (d.submissions || []).slice().sort(function(a, b){ return a.time - b.time; });
    L.push("## 3. הגשות השבוע (" + subs.length + ")");
    if(!subs.length) L.push("לא היו הגשות.");
    else {
      L.push("| תאריך | כיתה | תלמיד | משימה | סטטוס | ציון | הערה |");
      L.push("|---|---|---|---|---|---|---|");
      subs.forEach(function(x){
        var grade = x.grade !== "" ? x.grade : (x.fbg !== "" ? x.fbg + " (הצעת Claude, לא אושר)" : (x.auto !== "" ? x.auto + "% (בדיקה אוטומטית)" : ""));
        var status = (x.status === "checked" ? "נבדק" : "מחכה לבדיקה") + (x.isRedo ? ", תיקון" : "") + (x.redo ? ", נשלח לתיקון" : "");
        L.push("| " + [x.date, cls(x.cls), x.student, x.task, status, grade, x.comment].map(cell).join(" | ") + " |");
      });
      var byTask = {};
      subs.forEach(function(x){ var g = x.grade !== "" ? +x.grade : NaN; if(isNaN(g)) return; var k = x.task + " · " + cls(x.cls); (byTask[k] = byTask[k] || []).push(g); });
      var ks = Object.keys(byTask);
      if(ks.length){
        L.push("");
        L.push("ממוצע ציונים לפי משימה:");
        ks.sort(abc).forEach(function(k){ var a = byTask[k]; L.push("- " + k + ": " + Math.round(a.reduce(function(s, v){ return s + v; }, 0) / a.length) + " (" + a.length + " ציונים)"); });
      }
    }
    L.push("");

    /* 4. מחכות לבדיקה */
    var pend = (d.pending || []).slice().sort(function(a, b){ return b.days - a.days; });
    L.push("## 4. עבודות שמחכות לבדיקה (" + pend.length + ")");
    if(!pend.length) L.push("אין עבודות שמחכות.");
    pend.forEach(function(x){ L.push("- " + x.student + " (" + cls(x.cls) + "): " + x.task + " · הוגש " + x.date + (x.days ? " (לפני " + x.days + " ימים)" : " (היום)") + (x.fbg !== "" ? " · Claude הציע " + x.fbg : "")); });
    L.push("");

    /* 5. משימות */
    var tasks = d.assignments || [];
    L.push("## 5. משימות (" + tasks.length + ")");
    if(!tasks.length) L.push("אין משימות בטווח הזה.");
    tasks.forEach(function(a){
      L.push("### " + a.title + " · " + cls(a.cls) + " · להגשה עד " + heDate(a.due));
      if(a.page) L.push("- דף באתר: " + a.page);
      if(a.link) L.push("- קישור: " + a.link);
      L.push("- סיימו: " + a.done.length + " מתוך " + a.total + (a.done.length ? " (" + a.done.slice().sort(abc).join(", ") + ")" : ""));
      if(a.notDone.length) L.push("- עוד לא סיימו: " + a.notDone.slice().sort(abc).join(", "));
      if(a.sent.length) L.push("- שלחו למורה: " + a.sent.length);
    });
    L.push("");

    /* 6. מבחנים */
    var ex = (d.exams || []).slice().sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    L.push("## 6. מבחנים (" + ex.length + ")");
    if(!ex.length) L.push("אין מבחנים ברשימה.");
    ex.forEach(function(x){ L.push("- " + heDate(x.date) + " · " + cls(x.cls) + " · " + [x.subject, x.title].filter(Boolean).join(": ") + (x.note ? " (" + x.note + ")" : "")); });
    L.push("");

    /* 7. הודעה */
    var ann = d.announcement, annText = ann ? (typeof ann === "string" ? ann : ann.text || "") : "";
    L.push("## 7. ההודעה לתלמידים באתר");
    L.push(annText || "(אין הודעה)");
    return L.join("\n");
  }

  /* ---------- הכרטיס במסך הראשי ---------- */
  function css(){
    if(document.getElementById("bmWeekCss")) return;
    var st = document.createElement("style");
    st.id = "bmWeekCss";
    st.textContent =
      "#teacherTools .wk-card .visually-hidden{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
      "#teacherTools .wk-card{background:#fff;border:1px solid #DCE4F1;border-radius:16px;padding:14px 18px;margin:18px 0 0}" +
      "#teacherTools .wk-top{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}" +
      "#teacherTools .wk-txt{flex:1;min-width:14rem}#teacherTools .wk-txt strong{display:block;font-family:'Rubik','Heebo',sans-serif;font-size:1.05rem;color:#0E1B33}" +
      "#teacherTools .wk-txt span{display:block;color:#56637A;font-size:.9rem}" +
      "#teacherTools .wk-btn{font:inherit;font-weight:700;border:0;background:#0B2A5B;color:#fff;border-radius:10px;padding:10px 16px;cursor:pointer}" +
      "#teacherTools .wk-btn.alt{background:#fff;color:#0B2A5B;border:1px solid #0B2A5B}" +
      "#teacherTools .wk-btn:hover{filter:brightness(1.1)}#teacherTools .wk-btn:disabled{opacity:.6;cursor:default}" +
      "#teacherTools .wk-btn:focus-visible,#teacherTools .wk-days:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      "#teacherTools .wk-days{font:inherit;border:1px solid #DCE4F1;border-radius:10px;padding:9px 10px;background:#fff}" +
      "#teacherTools .wk-out{margin-top:12px}#teacherTools .wk-out[hidden]{display:none}" +
      "#teacherTools .wk-text{width:100%;box-sizing:border-box;min-height:16rem;font:inherit;font-size:.88rem;line-height:1.5;border:1px solid #DCE4F1;border-radius:12px;padding:10px;direction:rtl;white-space:pre;overflow:auto}" +
      "#teacherTools .wk-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}" +
      "#teacherTools .wk-msg{margin:8px 0 0;font-size:.9rem;color:#56637A}#teacherTools .wk-msg.is-err{color:#B42318;font-weight:700}#teacherTools .wk-msg.is-ok{color:#1F7A4D;font-weight:700}";
    document.head.appendChild(st);
  }
  function mount(){
    var home = document.getElementById("ttPanel-home");
    if(!home || document.getElementById("wkCard")) return;
    css();
    var card = document.createElement("section");
    card.className = "wk-card"; card.id = "wkCard"; card.setAttribute("aria-labelledby", "wkTitle");
    card.innerHTML =
      '<div class="wk-top"><div class="wk-txt"><strong id="wkTitle">🗓️ סיכום שבועי לקלוד</strong>' +
      '<span>כל מה שקרה באתר: שיעורים, נוכחות, הגשות וציונים, מה מחכה לבדיקה, משימות ומבחנים - בטקסט אחד להעתקה.</span></div>' +
      '<label class="visually-hidden" for="wkDays">טווח</label><select class="wk-days" id="wkDays"><option value="7">7 ימים אחרונים</option><option value="14">14 ימים אחרונים</option><option value="30">30 ימים אחרונים</option></select>' +
      '<button type="button" class="wk-btn" id="wkBtn">📋 הכנת סיכום</button></div>' +
      '<p class="wk-msg" id="wkMsg" role="status"></p>' +
      '<div class="wk-out" id="wkOut" hidden><label class="visually-hidden" for="wkText">הסיכום</label><textarea class="wk-text" id="wkText" readonly></textarea>' +
      '<div class="wk-acts"><button type="button" class="wk-btn" id="wkCopy">📋 העתקה</button><button type="button" class="wk-btn alt" id="wkDl">⬇️ הורדה כקובץ</button></div></div>';
    home.appendChild(card);
    var btn = card.querySelector("#wkBtn"), msg = card.querySelector("#wkMsg"), out = card.querySelector("#wkOut"), ta = card.querySelector("#wkText");
    function say(t, k){ msg.className = "wk-msg" + (k ? " is-" + k : ""); msg.textContent = t; }
    btn.addEventListener("click", function(){
      btn.disabled = true; say("אוסף את הנתונים מהשרת… (זה יכול לקחת כמה שניות)");
      post({ action:"weekSummary", days:+card.querySelector("#wkDays").value }).then(function(r){
        ta.value = build(r); out.hidden = false;
        say("✓ הסיכום מוכן. לוחצים \"העתקה\" ומדביקים בשיחה עם Claude.", "ok");
      }).catch(function(e){
        say(/פעולה לא מוכרת/.test(e.message) ? "צריך קודם לעדכן את Code.gs ב-Apps Script (גרסה חדשה)." : "לא הצלחנו להכין את הסיכום: " + e.message, "err");
      }).then(function(){ btn.disabled = false; });
    });
    card.querySelector("#wkCopy").addEventListener("click", function(){
      var done = function(){ say("✓ הועתק. עכשיו מדביקים בשיחה עם Claude (Ctrl+V).", "ok"); };
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function(){ ta.select(); document.execCommand("copy"); done(); });
      else { ta.select(); document.execCommand("copy"); done(); }
    });
    card.querySelector("#wkDl").addEventListener("click", function(){
      var d = new Date(), iso = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
      var url = URL.createObjectURL(new Blob(["﻿" + ta.value], { type:"text/markdown;charset=utf-8" }));
      var a = document.createElement("a"); a.href = url; a.download = "week-summary-" + iso + ".md";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
    });
  }

  window.BM_TEACHER_WEEK = { mount:mount, _build:build };
})();
