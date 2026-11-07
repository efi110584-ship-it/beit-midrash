/* ============================================================
   גיבוי לאקסל - במסך הראשי של האזור האישי
   ============================================================
   לוחצים "הורדת גיבוי" -> השרת מחזיר את כל מה שנשמר רק בו (action: backup, עם סיסמת המורה)
   -> נבנה קובץ אקסל עם לשוניות: נוכחות, סיכום לפי תלמיד, מבחנים, משימות, רשימות כיתה, הודעה.
   הספרייה לאקסל (SheetJS) נטענת רק בלחיצה. תאריך הגיבוי האחרון נזכר בדפדפן הזה.
   window.BM_TEACHER_BACKUP.mount() נקרא מ-index.html אחרי שאזור המורה נבנה.
   ============================================================ */
(function(){
  "use strict";
  var LIB = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  var LAST_KEY = "bm-teacher-last-backup";
  var REMIND_DAYS = 14;
  var CLS = { "יא":"י״א 4", "יב":"י״ב 2", all:"כל הכיתות" };
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
  function loadLib(){
    if(window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function(ok, bad){
      var s = document.createElement("script");
      s.src = LIB; s.onload = function(){ window.XLSX ? ok(window.XLSX) : bad(new Error("ספריית האקסל לא נטענה")); };
      s.onerror = function(){ bad(new Error("אין חיבור לטעינת ספריית האקסל")); };
      document.head.appendChild(s);
    });
  }
  function heDate(iso){ var p = String(iso || "").split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(iso || ""); }
  function dayName(iso){ var p = String(iso).split("-"); return DAYN[new Date(+p[0], +p[1] - 1, +p[2]).getDay()]; }
  function today(){ var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function abc(a, b){ return String(a).localeCompare(String(b), "he"); }

  /* ---------- בניית הלשוניות ---------- */
  function sheets(data){
    var att = data.attendance || {}, rows = [], per = {};
    Object.keys(att).sort().forEach(function(date){
      var day = att[date] || {};
      Object.keys(day).sort(function(a, b){ return (+a.split("|")[0]) - (+b.split("|")[0]) || abc(a, b); }).forEach(function(key){
        var e = day[key] || {}, hour = +key.split("|")[0], cls = key.split("|")[1];
        var base = [heDate(date), dayName(date), hour, e.s || "", CLS[cls] || cls, CHECKN[e.k || "p"] || ""];
        var names = {};
        Object.keys(e.m || {}).forEach(function(n){ names[n] = 1; });
        Object.keys(e.e || {}).forEach(function(n){ names[n] = 1; });
        var list = Object.keys(names).sort(abc);
        if(e.k === "x"){ rows.push(base.concat(["—", "השיעור לא התקיים", ""])); return; }
        if(!list.length){ rows.push(base.concat(["—", "כולם נוכחים", ""])); return; }
        list.forEach(function(n){
          var evs = (e.e && e.e[n] || []).map(function(c){ return EVN[c] || c; });
          rows.push(base.concat([n, MARK[(e.m || {})[n]] || "נוכח", evs.join(", ")]));
          var k = cls + "|" + n, s = per[k] || (per[k] = { cls:cls, name:n, a:0, l:0, c:0, b:0, n:0, h:0 });
          if((e.m || {})[n]) s[(e.m || {})[n]]++;
          (e.e && e.e[n] || []).forEach(function(c){ if(s[c] !== undefined) s[c]++; });
        });
      });
    });
    var attSheet = [["תאריך", "יום", "שעה", "שיעור", "כיתה", "בדיקת נוכחות", "תלמיד", "סטטוס", "אירועים"]].concat(rows);

    /* סיכום לפי תלמיד - כל תלמידי הרשימה, גם מי שלא חסר אף פעם */
    var rosters = data.rosters || {};
    Object.keys(rosters).forEach(function(c){ (rosters[c] || []).forEach(function(n){ var k = c + "|" + n; if(!per[k]) per[k] = { cls:c, name:n, a:0, l:0, c:0, b:0, n:0, h:0 }; }); });
    var sumSheet = [["כיתה", "תלמיד", "חיסורים", "איחורים", "מחמאות", "הערות התנהגות", "ללא מחשב נייד", "ללא שיעורי בית"]].concat(
      Object.keys(per).map(function(k){ return per[k]; })
        .sort(function(x, y){ return abc(x.cls, y.cls) || (y.a - x.a) || abc(x.name, y.name); })
        .map(function(s){ return [CLS[s.cls] || s.cls, s.name, s.a, s.l, s.c, s.b, s.n, s.h]; }));

    var examSheet = [["תאריך", "כיתה", "מקצוע", "נושא", "הערה"]].concat((data.exams || []).slice()
      .sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; })
      .map(function(x){ return [heDate(x.date), CLS[x.cls] || x.cls || "", x.subject || "", x.title || "", x.note || ""]; }));

    var taskSheet = [["תאריך הגשה", "כיתה", "משימה", "דף באתר", "קישור", "הערה", "למי"]].concat((data.assignments || []).map(function(a){
      return [heDate(a.due), CLS[a.cls] || a.cls || "", a.title || "", a.page || "", a.link || "", a.note || "", (a.names && a.names.length) ? a.names.join(", ") : "כל הכיתה"];
    }));

    var cols = Object.keys(rosters).sort(abc), max = 0;
    cols.forEach(function(c){ max = Math.max(max, (rosters[c] || []).length); });
    var rosterSheet = [cols.map(function(c){ return CLS[c] || c; })];
    for(var i = 0; i < max; i++) rosterSheet.push(cols.map(function(c){ return (rosters[c] || [])[i] || ""; }));

    var ann = data.announcement, annText = ann ? (typeof ann === "string" ? ann : ann.text || "") : "";
    var infoSheet = [["גיבוי מהאתר", heDate(today())], ["נוכחות נשמרת בשרת 45 יום, ולכן כדאי לגבות פעם בשבועיים."], [], ["ההודעה לתלמידים כרגע:"], [annText || "(אין הודעה)"]];

    return [["נוכחות", attSheet, [12, 8, 6, 18, 12, 12, 24, 18, 32]], ["סיכום לפי תלמיד", sumSheet, [10, 24, 10, 10, 10, 14, 14, 14]],
            ["מבחנים", examSheet, [12, 12, 14, 40, 30]], ["משימות", taskSheet, [12, 10, 36, 28, 30, 30, 30]],
            ["רשימות כיתה", rosterSheet, [24, 24]], ["מידע", infoSheet, [40, 14]]];
  }

  function download(X, data){
    var wb = X.utils.book_new();
    sheets(data).forEach(function(s){
      var ws = X.utils.aoa_to_sheet(s[1]);
      ws["!cols"] = s[2].map(function(w){ return { wch:w }; });
      if(s[1].length > 1 && s[0] !== "מידע" && s[0] !== "רשימות כיתה") ws["!autofilter"] = { ref: X.utils.encode_range({ s:{ r:0, c:0 }, e:{ r:s[1].length - 1, c:s[1][0].length - 1 } }) };
      X.utils.book_append_sheet(wb, ws, s[0]);
    });
    wb.Workbook = { Views:[{ RTL:true }] };
    /* הורדה ישירה (בלי writeFile, כדי ששם הקובץ יישמר בכל דפדפן) */
    var buf = X.write(wb, { bookType:"xlsx", type:"array" });
    var url = URL.createObjectURL(new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    var a = document.createElement("a");
    a.href = url; a.download = "beit-midrash-backup-" + today() + ".xlsx";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
  }

  /* ---------- הכרטיס במסך הראשי ---------- */
  function lastText(){
    var t = 0; try{ t = +localStorage.getItem(LAST_KEY) || 0; }catch(e){}
    if(!t) return { text:"עוד לא נעשה גיבוי מהמחשב הזה.", old:true };
    var days = Math.floor((Date.now() - t) / 864e5), d = new Date(t);
    return { text:"גיבוי אחרון: " + d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear() + (days ? " (לפני " + days + " ימים)" : " (היום)"), old:days >= REMIND_DAYS };
  }
  function css(){
    if(document.getElementById("bmBackupCss")) return;
    var st = document.createElement("style");
    st.id = "bmBackupCss";
    st.textContent =
      "#teacherTools .bk-card{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;background:#fff;border:1px solid #DCE4F1;border-radius:16px;padding:14px 18px;margin:18px 0 0}" +
      "#teacherTools .bk-card.is-old{border-color:#f0b98a;background:#fff8f0}" +
      "#teacherTools .bk-txt{flex:1;min-width:14rem}#teacherTools .bk-txt strong{display:block;font-family:'Rubik','Heebo',sans-serif;font-size:1.05rem;color:#0E1B33}" +
      "#teacherTools .bk-txt span{display:block;color:#56637A;font-size:.9rem}#teacherTools .bk-card.is-old .bk-last{color:#c2410c;font-weight:700}" +
      "#teacherTools .bk-btn{font:inherit;font-weight:700;border:0;background:#0B2A5B;color:#fff;border-radius:10px;padding:10px 16px;cursor:pointer}" +
      "#teacherTools .bk-btn:hover{background:#123A78}#teacherTools .bk-btn:disabled{opacity:.6;cursor:default}" +
      "#teacherTools .bk-btn:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      "#teacherTools .bk-msg{flex-basis:100%;margin:0;font-size:.9rem;color:#56637A}#teacherTools .bk-msg.is-err{color:#B42318;font-weight:700}#teacherTools .bk-msg.is-ok{color:#1F7A4D;font-weight:700}";
    document.head.appendChild(st);
  }
  function paint(card){
    var l = lastText();
    card.classList.toggle("is-old", l.old);
    card.querySelector(".bk-last").textContent = l.text + (l.old ? " כדאי לגבות עכשיו." : "");
  }
  function mount(){
    var home = document.getElementById("ttPanel-home");
    if(!home || document.getElementById("bkCard")) return;
    css();
    var card = document.createElement("section");
    card.className = "bk-card"; card.id = "bkCard"; card.setAttribute("aria-labelledby", "bkTitle");
    card.innerHTML = '<div class="bk-txt"><strong id="bkTitle">💾 גיבוי לאקסל</strong><span>נוכחות, סיכום לפי תלמיד, מבחנים, משימות ורשימות הכיתה - בקובץ אחד במחשב שלך.</span><span class="bk-last"></span></div>' +
      '<button type="button" class="bk-btn" id="bkBtn">⬇️ הורדת גיבוי</button><p class="bk-msg" id="bkMsg" role="status"></p>';
    home.appendChild(card);
    paint(card);
    var btn = card.querySelector("#bkBtn"), msg = card.querySelector("#bkMsg");
    btn.addEventListener("click", function(){
      btn.disabled = true; msg.className = "bk-msg"; msg.textContent = "אוסף את הנתונים מהשרת…";
      Promise.all([post({ action:"backup" }), loadLib()]).then(function(r){
        download(r[1], r[0]);
        try{ localStorage.setItem(LAST_KEY, String(Date.now())); }catch(e){}
        paint(card);
        msg.className = "bk-msg is-ok"; msg.textContent = "✓ הקובץ ירד לתיקיית ההורדות. כדאי להעביר אותו לתיקייה קבועה.";
      }).catch(function(e){
        msg.className = "bk-msg is-err";
        msg.textContent = /פעולה לא מוכרת/.test(e.message) ? "צריך קודם לעדכן את Code.gs ב-Apps Script (גרסה חדשה)." : "הגיבוי לא הצליח: " + e.message;
      }).then(function(){ btn.disabled = false; });
    });
  }

  window.BM_TEACHER_BACKUP = { mount:mount, _sheets:sheets };
})();
