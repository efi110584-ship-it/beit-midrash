/* ============================================================
   המסך הראשי של המורה - "מה מחכה לי היום"
   ============================================================
   נבנה מעל המסך הראשי של assets/teacher-dashboard-layout.js (בלי לשנות אותו):
   - ארבעה ריבועים: עבודות לבדיקה · משימות פעילות · מבחנים השבוע · בשיעור עכשיו
   - "מתחילים שיעור" כפס קטן
   - "דורש טיפול" ו"מועדים קרובים"
   הנתונים: teacherSummary ו-presenceList (apps-script/Code.gs, עם סיסמת המורה),
   והמבחנים מ-?action=exams. נטען רק כשהמסך הראשי גלוי, והריבוע של השיעור החי מתעדכן כל 20 שניות.
   window.BM_TEACHER_HOME.mount() נקרא מ-index.html אחרי שאזור המורה נבנה.
   ============================================================ */
(function(){
  "use strict";
  var BAGRUT = [ { cls:"יב", date:"2027-01-25", title:"בגרות חורף (2371)" }, { cls:"יא", date:"2027-05-20", title:"בגרות קיץ (2381)" } ];
  var WD = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function token(){ try{ return sessionStorage.getItem("bm-teacher-token") || ""; }catch(e){ return ""; } }
  function post(body){
    body.password = token();
    return fetch(window.BM_API_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body) }).then(function(r){ return r.json(); });
  }
  function getExams(){
    /* גם המבחנים שהוכנסו ישירות לאתר (assets/exams-seed.js), כמו בלוח המבחנים בדף הבית */
    function seed(list){
      var add = (window.BM_EXAMS_SEED || []).filter(function(x){ return !list.some(function(y){ return y.date === x.date && y.cls === x.cls && y.subject === x.subject; }); });
      return list.concat(add).sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    }
    return fetch(window.BM_API_URL + "?action=exams").then(function(r){ return r.json(); }).then(function(res){ return seed(res && res.ok ? res.exams || [] : []); }).catch(function(){ return seed([]); });
  }
  function day0(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parse(iso){ var p = String(iso).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function daysTo(iso){ return Math.round((parse(iso) - day0(new Date())) / 86400000); }
  function short(iso){ var d = parse(iso); return d.getDate() + "." + (d.getMonth() + 1); }
  function clsName(c){ return c === "יב" ? 'י"ב' : c === "יא" ? 'י"א' : 'י"א וי"ב'; }
  function go(panel, focusId){
    var t = document.getElementById("ttTab-" + panel);
    if(t) t.click();
    if(focusId){
      var f = document.getElementById(focusId);
      if(f){
        var det = f.closest && f.closest("details");
        if(det) det.open = true;
        f.scrollIntoView({ block:"center" });
        if(f.focus) f.focus();
      }
    }
  }

  function css(){
    if(document.getElementById("bmTeacherHomeCss")) return;
    var st = document.createElement("style");
    st.id = "bmTeacherHomeCss";
    st.textContent =
      "#teacherTools .th-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:4px 0 16px}" +
      "#teacherTools .th-tile{position:relative;display:flex;flex-direction:column;gap:6px;text-align:right;background:#fff;border:1px solid #DCE4F1;border-radius:16px;padding:16px 18px;font:inherit;color:#0E1B33;cursor:pointer;min-width:0}" +
      "#teacherTools .th-tile:hover{border-color:#B8C7E0;box-shadow:0 6px 18px rgba(20,34,59,.08)}" +
      "#teacherTools .th-tile:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      "#teacherTools .th-lbl{display:flex;gap:8px;align-items:center;color:#56637A;font-weight:600;font-size:.95rem}" +
      "#teacherTools .th-num{font-family:'Rubik','Heebo',sans-serif;font-weight:900;font-size:2.5rem;line-height:1;color:#0B2A5B;font-variant-numeric:tabular-nums}" +
      "#teacherTools .th-meta{font-size:.88rem;color:#56637A;min-height:1.3em}" +
      "#teacherTools .th-go{position:absolute;inset-inline-end:16px;top:14px;color:#FF7A1A;font-weight:700}" +
      "#teacherTools .th-extra{display:block}#teacherTools .th-bar{display:block;height:7px;border-radius:999px;background:#E3E8F0;overflow:hidden}#teacherTools .th-bar i{display:block;height:100%;background:#1f8a5b;border-radius:999px}" +
      "#teacherTools .th-tile.is-hot{border-color:#f0b98a;background:#fff8f0}#teacherTools .th-tile.is-hot .th-num{color:#c2410c}" +
      "#teacherTools .th-tile.is-live{background:#0B2A5B;border-color:#0B2A5B;color:#fff}#teacherTools .th-tile.is-live .th-num{color:#fff}" +
      "#teacherTools .th-tile.is-live .th-lbl,#teacherTools .th-tile.is-live .th-meta{color:#C3CFDD}#teacherTools .th-tile.is-live .th-go{color:#fff6df}" +
      "#teacherTools .th-dot{width:9px;height:9px;border-radius:50%;background:#ff6b5e;display:inline-block}" +
      "#teacherTools .td-study-hero.th-compact{min-height:0;background:linear-gradient(110deg,#0B2A5B,#123A78);border-radius:16px;border-color:#0B2A5B;margin:0 0 16px}" +
      "#teacherTools .td-study-hero.th-compact:before{display:none}" +
      "#teacherTools .td-study-hero.th-compact .td-study-copy{width:100%;padding:14px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}" +
      "#teacherTools .td-study-hero.th-compact .td-study-copy h3{font-size:1.35rem;margin:0}" +
      "#teacherTools .td-study-hero.th-compact .td-study-copy p{margin:0;flex:1;min-width:12rem}" +
      "#teacherTools .td-study-hero.th-compact .td-shortcut{width:auto;margin-inline-start:auto}" +
      "#teacherTools .th-two{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;margin:0 0 20px}" +
      "#teacherTools .th-box{background:#fff;border:1px solid #DCE4F1;border-radius:16px;padding:16px 18px;min-width:0}" +
      "#teacherTools .th-box h3{margin:0 0 8px;font-family:'Rubik','Heebo',sans-serif;font-size:1.2rem;color:#0E1B33}" +
      "#teacherTools .th-list{list-style:none;margin:0;padding:0}" +
      "#teacherTools .th-item{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #E8EEF7}#teacherTools .th-item:last-child{border-bottom:0}" +
      "#teacherTools .th-ic{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#EEF3FB}" +
      "#teacherTools .th-item small{display:block;color:#56637A;font-size:.85rem}" +
      "#teacherTools .th-act{margin-inline-start:auto;flex:none;border:0;background:transparent;color:#1F5FBF;font:inherit;font-weight:700;cursor:pointer;padding:6px 4px;white-space:nowrap}" +
      "#teacherTools .th-act:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px;border-radius:6px}" +
      "#teacherTools .th-date{flex:none;width:54px;text-align:center;border:1px solid #DCE4F1;border-radius:10px;padding:4px 0;line-height:1.15}" +
      "#teacherTools .th-date b{display:block;font-size:1.05rem;color:#0B2A5B}#teacherTools .th-date span{font-size:.75rem;color:#56637A}" +
      "#teacherTools .th-side{margin-inline-start:auto;flex:none;font-size:.85rem;color:#56637A}" +
      "#teacherTools .th-empty{color:#56637A;margin:6px 0}" +
      "#teacherTools .th-day{background:#fff;border:1px solid #DCE4F1;border-radius:16px;padding:12px 16px 14px;margin:4px 0 16px}" +
      "#teacherTools .th-day-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px}" +
      "#teacherTools .th-day-h h3{margin:0;font-family:'Rubik','Heebo',sans-serif;font-size:1.1rem;color:#0E1B33}" +
      "#teacherTools .th-day-when{color:#56637A;font-size:.9rem}" +
      "#teacherTools .th-seg{display:inline-flex;border:1px solid #DCE4F1;border-radius:999px;padding:2px;margin-inline-start:auto;background:#F4F7FD}" +
      "#teacherTools .th-seg button{border:0;background:transparent;font:inherit;font-size:.88rem;font-weight:600;color:#56637A;padding:4px 12px;border-radius:999px;cursor:pointer}" +
      "#teacherTools .th-seg button[aria-pressed=true]{background:#0B2A5B;color:#fff}" +
      "#teacherTools .th-seg button:focus-visible,#teacherTools .th-week:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
      "#teacherTools .th-week{border:0;background:transparent;color:#1F5FBF;font:inherit;font-weight:700;font-size:.9rem;cursor:pointer;padding:4px}" +
      "#teacherTools .th-hours{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:6px}" +
      "#teacherTools .th-hr{border-radius:10px;padding:6px 7px;min-height:58px;font-size:.84rem;line-height:1.3;background:#F2F5F9;color:#56637A;min-width:0}" +
      "#teacherTools .th-hr b{display:block;font-size:.72rem;opacity:.75;font-weight:700}" +
      "#teacherTools .th-hr span{display:block;font-weight:600;overflow-wrap:anywhere}" +
      "#teacherTools .th-hr small{display:block;font-size:.72rem;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#teacherTools .th-hr.is-free{background:transparent;border:1px dashed #DCE4F1;color:#9AA6B8}" +
      "#teacherTools .th-hr.t-ya{background:#E4F3EF;color:#0F6B5F}#teacherTools .th-hr.t-yb{background:#EBEDFB;color:#3542A0}#teacherTools .th-hr.t-both{background:#FFF2D6;color:#8A5300}" +
      "#teacherTools .th-hr.t-tutor{background:#FBEAF1;color:#9B2C5C}#teacherTools .th-hr.t-prep{background:#fff;border:1px dashed #C7D2E3}" +
      "#teacherTools .th-hr.t-cls{background:#fff;border:1px solid #DCE4F1;color:#0E1B33}" +
      "@media(max-width:900px){#teacherTools .th-hours{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(96px,1fr);overflow-x:auto;padding-bottom:4px}}" +
      "@media(max-width:1100px){#teacherTools .th-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}#teacherTools .th-two{grid-template-columns:1fr}}" +
      "@media(max-width:480px){#teacherTools .th-tiles{grid-template-columns:1fr}}";
    document.head.appendChild(st);
  }

  function tile(id, icon, label, panel){
    var b = document.createElement("button");
    b.type = "button"; b.className = "th-tile"; b.id = id;
    b.innerHTML = '<span class="th-go" aria-hidden="true">›</span><span class="th-lbl">' + icon + ' ' + esc(label) + '</span>' +
      '<span class="th-num">…</span><span class="th-extra"></span><span class="th-meta"></span>';
    b.addEventListener("click", function(){ go(panel); });
    return b;
  }
  function setTile(id, num, meta, extra, cls){
    var b = document.getElementById(id);
    if(!b) return;
    b.querySelector(".th-num").textContent = num;
    b.querySelector(".th-meta").textContent = meta || "";
    b.querySelector(".th-extra").innerHTML = extra || "";
    b.classList.toggle("is-hot", cls === "hot");
    b.classList.toggle("is-live", cls === "live");
    b.setAttribute("aria-label", b.querySelector(".th-lbl").textContent.trim() + ": " + num + (meta ? ". " + meta : ""));
  }


  /* ---------- "היום שלי": שורה אחת עם שעות היום (המערכת שלי / מערכת הכיתה) ---------- */
  var DAYN = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  var dayView = "me";
  try{ dayView = localStorage.getItem("bm-th-dayview") || "me"; }catch(e){}
  function schoolDay(){
    /* אחרי 16:00, או בשישי/שבת - מציגים את יום הלימודים הבא */
    var d = day0(new Date());
    if(d.getDay() <= 4 && new Date().getHours() >= 16) d.setDate(d.getDate() + 1);
    while(d.getDay() > 4) d.setDate(d.getDate() + 1);
    var n = Math.round((d - day0(new Date())) / 86400000);
    return { d:d, label:n === 0 ? "היום" : n === 1 ? "מחר" : "" };
  }
  function isoOf(d){ return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function drawDay(box){
    var S = window.BM_MY_SCHEDULE;
    var sd = schoolDay(), wd = sd.d.getDay();
    box.querySelector(".th-day-when").textContent = (sd.label ? sd.label + " · " : "") + "יום " + DAYN[wd] + " " + sd.d.getDate() + "." + (sd.d.getMonth() + 1);
    Array.prototype.forEach.call(box.querySelectorAll(".th-seg button"), function(b){ b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === dayView)); });
    var cells = [];
    for(var h = 0; h <= 8; h++){
      var cls = "is-free", main = "", sub = "";
      if(dayView === "me"){
        var s = (S.weekFor(isoOf(sd.d))[wd] || [])[h];
        if(s){
          main = s.subject;
          if(s.kind === "lesson"){ cls = "t-" + (s.cls === "both" ? "both" : s.cls === "יב" ? "yb" : "ya"); sub = S.clsName[s.cls]; }
          else { cls = s.kind === "tutor" ? "t-tutor" : s.kind === "prep" ? "t-prep" : ""; }
        }
      }else{
        var c = ((S.classes[dayView] || [])[wd] || [])[h];
        if(c){ main = c[0]; sub = c[1]; cls = c[2] ? (dayView === "יב" ? "t-yb" : "t-ya") : "t-cls"; if(c[2]) sub = "השיעור שלך"; }
      }
      cells.push({ h:h, cls:cls, main:main, sub:sub });
    }
    /* בלי שעות ריקות בסוף היום */
    while(cells.length && !cells[cells.length - 1].main) cells.pop();
    var ul = box.querySelector(".th-hours");
    ul.style.gridTemplateColumns = cells.length && window.matchMedia("(min-width:901px)").matches ? "repeat(" + cells.length + ",minmax(0,1fr))" : "";
    ul.innerHTML = cells.length ? cells.map(function(x){
      return '<li class="th-hr ' + x.cls + '"' + (x.sub ? ' title="' + esc(x.main + ' · ' + x.sub) + '"' : '') + '><b>שעה ' + x.h + '</b>' + (x.main ? '<span>' + esc(x.main) + '</span>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '') : '<span>—</span>') + '</li>';
    }).join("") : '<li class="th-empty">אין שיעורים ביום הזה.</li>';
  }
  function mountDay(){
    if(!window.BM_MY_SCHEDULE || !window.BM_MY_SCHEDULE.classes) return null;
    var S = window.BM_MY_SCHEDULE;
    var box = document.createElement("section");
    box.className = "th-day";
    box.setAttribute("aria-labelledby", "thDayH");
    box.innerHTML = '<div class="th-day-h"><h3 id="thDayH">🗓️ המערכת</h3><span class="th-day-when"></span>' +
      '<span class="th-seg" role="group" aria-label="איזו מערכת להציג">' +
      '<button type="button" data-v="me">שלי</button><button type="button" data-v="יא">' + esc(S.clsName["יא"]) + '</button><button type="button" data-v="יב">' + esc(S.clsName["יב"]) + '</button></span>' +
      '<button type="button" class="th-week">כל השבוע ›</button></div><ol class="th-hours"></ol>';
    box.querySelector(".th-seg").addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest("button[data-v]");
      if(!b) return;
      dayView = b.getAttribute("data-v");
      try{ localStorage.setItem("bm-th-dayview", dayView); }catch(err){}
      drawDay(box);
    });
    box.querySelector(".th-week").addEventListener("click", function(){ go("sched"); });
    drawDay(box);
    return box;
  }

  var home, attnList, dueList, liveTimer = null, examsCache = [];

  function mount(){
    home = document.getElementById("ttPanel-home");
    if(!home || home.dataset.thMounted) return;
    home.dataset.thMounted = "1";
    css();
    var d = new Date();
    var sub = home.querySelector(".td-subtitle");
    if(sub) sub.textContent = "יום " + WD[d.getDay()] + ", " + d.getDate() + "." + (d.getMonth() + 1) + " · מה מחכה לך היום";

    var tiles = document.createElement("div");
    tiles.className = "th-tiles";
    tiles.setAttribute("role", "group");
    tiles.setAttribute("aria-label", "מה מחכה לי היום");
    tiles.append(tile("thSubs", "📥", "עבודות לבדיקה", "board"), tile("thTasks", "📌", "משימות פעילות", "tasks"),
                 tile("thExams", "📅", "מבחנים השבוע", "exams"), tile("thLive", '<span class="th-dot" aria-hidden="true"></span>', "בשיעור עכשיו", "lesson"));
    var hero = home.querySelector(".td-study-hero");
    if(hero){ hero.classList.add("th-compact"); hero.parentNode.insertBefore(tiles, hero); }
    else if(sub) sub.insertAdjacentElement("afterend", tiles);
    else home.prepend(tiles);
    var dayBox = mountDay();
    if(dayBox) tiles.parentNode.insertBefore(dayBox, tiles);

    var two = document.createElement("div");
    two.className = "th-two";
    two.innerHTML = '<section class="th-box" aria-labelledby="thAttnH"><h3 id="thAttnH">דורש טיפול</h3><ul class="th-list" id="thAttn"><li class="th-empty">טוענים…</li></ul></section>' +
      '<section class="th-box" aria-labelledby="thDueH"><h3 id="thDueH">מועדים קרובים</h3><ul class="th-list" id="thDue"><li class="th-empty">טוענים…</li></ul></section>';
    var overview = home.querySelector(".td-overview");
    var quick = home.querySelector(".td-quick");
    var anchor = overview || (quick && quick.nextSibling) || null;
    home.insertBefore(two, anchor);
    if(overview) overview.hidden = true;   /* "מה דורש טיפול?" הישן - מוחלף ברשימה האמיתית */
    attnList = document.getElementById("thAttn");
    dueList = document.getElementById("thDue");
    two.addEventListener("click", function(e){
      var b = e.target.closest && e.target.closest("[data-go]");
      if(b) go(b.getAttribute("data-go"), b.getAttribute("data-focus"));
    });

    var tab = document.getElementById("ttTab-home");
    if(tab) tab.addEventListener("click", function(){ setTimeout(refresh, 0); });
    refresh();
  }

  function visible(){ return home && !home.hidden; }
  function refresh(){
    if(!visible()) return;
    Promise.all([post({ action:"teacherSummary" }).catch(function(){ return null; }), getExams()]).then(function(r){
      examsCache = r[1] || [];
      draw(r[0], examsCache);
    });
    live();
    clearInterval(liveTimer);
    liveTimer = setInterval(function(){ if(visible()) live(); else clearInterval(liveTimer); }, 20000);
  }

  function live(){
    var code = ""; try{ code = sessionStorage.getItem("bm-live-code") || ""; }catch(e){}
    post({ action:"presenceList", code:code }).then(function(res){
      if(!res || !res.ok){ setTile("thLive", "-", "אין חיבור כרגע", "", "live"); return; }
      if(!res.lesson){ setTile("thLive", "0", "אין שיעור פעיל · לחצו כדי לפתוח שיעור", "", "live"); return; }
      var st = res.students || [];
      var inN = st.filter(function(s){ return s.status === "in" || s.status === "out"; }).length;
      var help = st.filter(function(s){ return s.help >= 0; }).length, out = st.filter(function(s){ return s.status === "out"; }).length;
      var meta = [];
      if(help) meta.push("✋ " + help + " מבקשים עזרה");
      if(out) meta.push("🟠 " + out + " מחוץ לדף");
      if(!meta.length) meta.push("קוד " + res.lesson.code + (res.lesson.label ? " · " + res.lesson.label : ""));
      setTile("thLive", String(inN), meta.join(" · "), "", "live");
    }).catch(function(){ setTile("thLive", "-", "אין חיבור כרגע", "", "live"); });
  }

  function draw(sum, exams){
    var weekExams = exams.filter(function(x){ var n = daysTo(x.date); return n >= 0 && n <= 7; });
    var nx = weekExams[0];
    setTile("thExams", String(weekExams.length), nx ? (nx.title + " · יום " + WD[parse(nx.date).getDay()] + " " + short(nx.date)) : "אין מבחנים בשבוע הקרוב");

    if(!sum || !sum.ok){
      var why = sum && sum.auth === false ? "צריך להיכנס שוב לאזור המורה" : "הנתונים יופיעו אחרי עדכון הסקריפט של Google";
      setTile("thSubs", "-", why); setTile("thTasks", "-", why);
      attnList.innerHTML = '<li class="th-empty">' + esc(why) + '.</li>';
      drawDue([], exams);
      return;
    }
    setTile("thSubs", String(sum.pending), sum.pendingOld ? sum.pendingOld + " מחכות יותר משבוע" : (sum.pending ? "הכול מהשבוע האחרון" : "הכול בדוק ✓"), "", sum.pendingOld ? "hot" : "");
    var tasks = sum.tasks || [], tot = 0, done = 0;
    tasks.forEach(function(t){ tot += t.total; done += t.done; });
    var pct = tot ? Math.round(done / tot * 100) : 0;
    setTile("thTasks", String(tasks.length), tasks.length ? pct + "% מהתלמידים השלימו את הדף" : "אין משימות פעילות · לחצו כדי לשייך",
      tasks.length ? '<span class="th-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' : "");

    /* דורש טיפול */
    var items = [];
    if(sum.pendingOld) items.push({ ic:"📥", t:sum.pendingOld + " עבודות מחכות לבדיקה יותר משבוע", s:(sum.oldTop || []).join(" · "), go:"board", act:"לבדיקה" });
    if(sum.redo) items.push({ ic:"✏️", t:sum.redo + (sum.redo === 1 ? " תיקון חדש מחכה" : " תיקונים חדשים מחכים") + " לבדיקה", s:"תלמידים ששלחו עבודה מתוקנת", go:"board", act:"לבדיקה" });
    tasks.forEach(function(t){
      var n = daysTo(t.due);
      if(n <= 3 && t.notStarted) items.push({ ic:"📌", t:'משימה "' + t.title + '" - ' + t.notStarted + " עוד לא התחילו", s:"כיתה " + clsName(t.cls) + " · להגיש " + (n === 0 ? "היום" : n === 1 ? "מחר" : "עד " + short(t.due)), go:"tasks", act:"למצב" });
    });
    Object.keys(sum.accounts || {}).forEach(function(c){
      var a = sum.accounts[c];
      if(a.roster && a.missing) items.push({ ic:"👤", t:a.missing + " תלמידים ב" + clsName(c) + " עוד לא נכנסו לאזור האישי", s:"בלי זה אין מעקב משימות והתקדמות אצלם", go:"lesson", focus:"ttAccShow", act:"לרשימה" });
      if(!a.roster) items.push({ ic:"🪪", t:"אין רשימת כיתה עם ת״ז ל" + clsName(c), s:"צריך אותה לאזור האישי, למשימות ולכניסה לשיעור", go:"lesson", focus:"ttRosterText", act:"להוספה" });
    });
    attnList.innerHTML = items.length ? items.slice(0, 6).map(function(x){
      return '<li class="th-item"><span class="th-ic" aria-hidden="true">' + x.ic + '</span><span>' + esc(x.t) + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</span>' +
        '<button type="button" class="th-act" data-go="' + x.go + '"' + (x.focus ? ' data-focus="' + x.focus + '"' : '') + '>' + esc(x.act) + ' ›</button></li>';
    }).join("") : '<li class="th-empty">אין כרגע משהו דחוף. 🎉</li>';
    drawDue(tasks, exams);
  }

  function drawDue(tasks, exams){
    var list = [];
    tasks.forEach(function(t){ list.push({ date:t.due, ic:"📌", t:t.title + " · " + clsName(t.cls), side:t.total ? t.done + "/" + t.total + " השלימו" : "" }); });
    exams.forEach(function(x){ if(daysTo(x.date) >= 0) list.push({ date:x.date, ic:"📅", t:x.title + " · " + clsName(x.cls), side:"" }); });
    BAGRUT.forEach(function(b){ if(daysTo(b.date) >= 0) list.push({ date:b.date, ic:"🎓", t:b.title + " · " + clsName(b.cls), side:"" }); });
    list.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    dueList.innerHTML = list.length ? list.slice(0, 6).map(function(x){
      var n = daysTo(x.date), d = parse(x.date);
      var side = x.side || (n === 0 ? "היום" : n === 1 ? "מחר" : "בעוד " + n + " ימים");
      return '<li class="th-item"><span class="th-date"><b>' + short(x.date) + '</b><span>יום ' + WD[d.getDay()] + '</span></span><span>' + x.ic + ' ' + esc(x.t) + '</span><span class="th-side">' + esc(side) + '</span></li>';
    }).join("") : '<li class="th-empty">אין מועדים קרובים.</li>';
  }

  window.BM_TEACHER_HOME = { mount:mount, refresh:refresh };
})();
