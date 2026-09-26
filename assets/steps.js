/* ============================================================
   בית המדרש הדיגיטלי - דף עבודה במשימות קטנות (אב־טיפוס, שלב ב׳)
   ============================================================
   במקום דף ארוך עם עשרות שאלות, הדף מוצג כמשימות של 3-7 שאלות,
   עם "הקודם" / "הבא", ובאפשרות לחזור לתצוגה המלאה ("הצג את כל השאלות").
   שום תוכן לא נמחק או משתנה: כל הכרטיסים נשארים בדף, ורק מוסתרים
   בזמן שעובדים על משימה אחרת. בהדפסה ובשליחה למורה - הכול נכלל.

   מה עוד הסקריפט עושה:
   - מד התקדמות שסופר רק שאלות חובה: בקבוצת "בחרו 2 מתוך 3"
     שתי תשובות = הקבוצה הושלמה (data-choose על ה-choice-note).
   - מצב לכל שאלה: הושלמה / נבדקה (נכונה / דורשת חזרה) / סומנה לחזרה.
     "נבדקה" = התלמיד השווה לתשובה שבדף (אחרי "הצג תשובה").
   - שומר במכשיר באיזו משימה התלמיד עומד, ורושם את "המקום האחרון"
     כדי שדף הבית יציג "המשיכו מהמקום שבו הפסקתם".
   העיצוב ב-assets/steps.css.
   ============================================================ */
(function(){
  "use strict";

  var main = document.querySelector("main");
  var grid = main ? main.querySelector(".grid") : null;
  if(!grid) return;

  var PAGE = location.pathname.split("/").pop() || "index.html";
  var KEY_POS = "bm-steps-pos:" + PAGE;
  var KEY_STATUS = "bm-steps-status:" + PAGE;
  var KEY_VIEW = "bm-steps-view";
  var KEY_LAST = "bm-last-place-v1";
  var MIN_Q = 4, MAX_Q = 7, SMALL_Q = 3;   // משימה נסגרת אחרי 4 שאלות, לא יותר מ-7, ומשימה של פחות מ-3 מתמזגת

  function load(key, fallback){
    try{ var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch(e){ return fallback; }
  }
  function save(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* אחסון חסום */ } }
  function make(tag, cls, text){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(text !== undefined) e.textContent = text;
    return e;
  }
  function cleanText(node){
    var c = node.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[aria-hidden="true"]'), function(x){ x.remove(); });
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function isFilled(f){ return !!(f.value && f.value.trim()); }

  var fields = Array.prototype.slice.call(grid.querySelectorAll("textarea.answer, input.answer"));
  if(!fields.length) return;
  fields.forEach(function(f, i){ if(!f.dataset.id) f.dataset.id = "field-" + i; });

  /* ---------- 1. שאלות חובה, וקבוצות בחירה ("ענו על 2 מתוך 3") ---------- */
  function chooseCount(note){
    var n = parseInt(note.getAttribute("data-choose"), 10);
    if(!isNaN(n)) return n;
    var m = note.textContent.match(/לפחות\s*(?:על\s*)?(\d+|אחד|אחת|שניים|שתיים|שני|שתי)/);
    if(!m) return null;
    var words = { "אחד":1, "אחת":1, "שניים":2, "שתיים":2, "שני":2, "שתי":2 };
    return words[m[1]] || parseInt(m[1], 10) || null;
  }

  var unitOf = new Map();   // שדה -> יחידת חובה { fields, need, note }
  var units = [];
  Array.prototype.forEach.call(grid.querySelectorAll(".choice-note"), function(note){
    var need = chooseCount(note);
    if(!need) return;
    var members = [];
    for(var sib = note.nextElementSibling; sib && !sib.classList.contains("choice-note"); sib = sib.nextElementSibling){
      if(!sib.classList.contains("question-block")) continue;
      if(!sib.querySelector(".choice-chip")) break;
      var f = sib.querySelector("textarea.answer, input.answer");
      if(f) members.push(f);
    }
    if(members.length > need){
      var u = { fields: members, need: need, note: note };
      units.push(u);
      members.forEach(function(f){ unitOf.set(f, u); });
    }
  });
  fields.forEach(function(f){
    if(unitOf.has(f)) return;
    var optional = !!f.closest("[data-optional]");
    var u = { fields: [f], need: optional ? 0 : 1, note: null };
    units.push(u);
    unitOf.set(f, u);
  });
  function unitDone(u){ return Math.min(u.fields.filter(isFilled).length, u.need); }

  /* ---------- 2. חלוקה למשימות של 3-7 שאלות ---------- */
  var cards = Array.prototype.filter.call(grid.children, function(c){ return c.matches("section.card"); });
  var blocks = [];
  cards.forEach(function(card){
    var cardFields = fields.filter(function(f){ return card.contains(f); });
    var bagrut = card.querySelectorAll(".bagrut-block");
    var isBagrutCard = bagrut.length > 0 && !card.querySelector(".question-block");
    var titleEl = card.querySelector(".card-title");
    var title = titleEl ? cleanText(titleEl) : "";
    if(isBagrutCard && cardFields.length > MAX_Q && bagrut.length > 1){
      // כרטיס שאלות בגרות גדול - כל שאלת בגרות (על סעיפיה) היא יחידה בפני עצמה
      Array.prototype.forEach.call(bagrut, function(b){
        var src = b.querySelector(".src");
        blocks.push({ card: card, part: b, kind: "bagrut", title: src ? cleanText(src) : title,
          fields: fields.filter(function(f){ return b.contains(f); }) });
      });
    } else {
      blocks.push({ card: card, part: null, kind: isBagrutCard ? "bagrut" : "regular", title: title, fields: cardFields });
    }
  });

  var tasks = [], cur = null;
  blocks.forEach(function(b){
    var n = b.fields.length;
    if(!cur || (cur.count > 0 && (cur.kind !== b.kind || cur.count >= MIN_Q || cur.count + n > MAX_Q))){
      cur = { blocks: [], count: 0, kind: b.kind };
      tasks.push(cur);
    }
    if(cur.count === 0) cur.kind = b.kind;
    cur.blocks.push(b);
    cur.count += n;
  });
  for(var i = tasks.length - 1; i > 0; i--){
    var t = tasks[i], p = tasks[i - 1];
    if(t.count === 0 || (t.count < SMALL_Q && p.kind === t.kind && p.count + t.count <= MAX_Q)){
      p.blocks = p.blocks.concat(t.blocks);
      p.count += t.count;
      tasks.splice(i, 1);
    }
  }
  if(tasks.length < 2) return;   // דף קצר - אין צורך בחלוקה

  var bagrutNo = 0, bagrutTotal = tasks.filter(function(t){ return t.kind === "bagrut"; }).length;
  tasks.forEach(function(t, idx){
    t.index = idx;
    t.fields = [];
    t.blocks.forEach(function(b){ t.fields = t.fields.concat(b.fields); });
    t.units = units.filter(function(u){ return u.fields.some(function(f){ return t.fields.indexOf(f) !== -1; }); });
    t.need = t.units.reduce(function(s, u){ return s + u.need; }, 0);
    if(t.kind === "bagrut"){
      bagrutNo++;
      t.title = "תרגול שאלות בגרות" + (bagrutTotal > 1 ? " (" + bagrutNo + " מתוך " + bagrutTotal + ")" : "");
    } else {
      var first = t.blocks.filter(function(b){ return b.fields.length; })[0] || t.blocks[0];
      t.title = first.title;
    }
  });
  function taskOf(f){ for(var k = 0; k < tasks.length; k++){ if(tasks[k].fields.indexOf(f) !== -1) return tasks[k]; } return null; }
  function taskDone(t){ return t.units.reduce(function(s, u){ return s + unitDone(u); }, 0); }
  function totalNeed(){ return units.reduce(function(s, u){ return s + u.need; }, 0); }
  function totalDone(){ return units.reduce(function(s, u){ return s + unitDone(u); }, 0); }
  function requiredPercent(){ var n = totalNeed(); return n ? Math.round(totalDone() / n * 100) : 0; }

  /* ---------- 3. מצב כל שאלה: נבדקה / נכונה / דורשת חזרה ---------- */
  var status = load(KEY_STATUS, {}) || {};
  function st(f){ return status[f.dataset.id] || {}; }
  function setSt(f, patch){
    var s = {}, old = st(f), k;
    for(k in old) s[k] = old[k];
    for(k in patch) s[k] = patch[k];
    status[f.dataset.id] = s;
    save(KEY_STATUS, status);
  }
  function needsReview(f){ var s = st(f); return !!(s.flag || s.verdict === "review"); }
  var hasModelAnswers = !!grid.querySelector(".hint-btn");

  /* ---------- 4. בניית הממשק ---------- */
  var root = document.documentElement;
  root.classList.add("bm-steps");
  var ui = new Map();

  fields.forEach(function(f){
    var row = make("div", "bm-qstatus");
    var pos = make("span", "bm-qpos");
    var state = make("span", "bm-qstate");
    var flag = make("button", "bm-flag", "🔖 סמנו לחזרה");
    flag.type = "button";
    flag.setAttribute("aria-pressed", "false");
    if(f.getAttribute("aria-labelledby")) flag.setAttribute("aria-describedby", f.getAttribute("aria-labelledby"));
    row.appendChild(pos); row.appendChild(state); row.appendChild(flag);
    f.insertAdjacentElement("afterend", row);
    ui.set(f, { pos: pos, state: state, flag: flag, check: null });
    flag.addEventListener("click", function(){
      var s = st(f), on = !needsReview(f);
      setSt(f, { flag: on, verdict: on ? s.verdict : (s.verdict === "review" ? null : s.verdict) });
      refresh();
    });
  });

  units.forEach(function(u){
    if(!u.note) return;
    u.doneEl = make("span", "bm-choice-done", "✓ עניתם על מספיק שאלות כאן - אפשר להמשיך");
    u.doneEl.hidden = true;
    u.note.appendChild(u.doneEl);
  });

  // בדיקה עצמית - מופיעה בתוך תיבת "הצג תשובה" אחרי שפותחים אותה
  document.addEventListener("click", function(e){
    var btn = e.target && e.target.closest ? e.target.closest(".hint-btn") : null;
    if(!btn || !grid.contains(btn)) return;
    setTimeout(function(){
      var box = btn.nextElementSibling;
      if(!box || !box.classList.contains("hint-box") || box.hidden) return;
      var f = btn.parentElement.querySelector("textarea.answer, input.answer");
      if(!f || !ui.has(f) || box.querySelector(".bm-selfcheck")) return;
      var wrap = make("div", "bm-selfcheck");
      wrap.setAttribute("role", "group");
      wrap.setAttribute("aria-label", "בדיקה עצמית");
      wrap.appendChild(make("span", "bm-selfcheck-q", "השוויתם? התשובה שלי:"));
      [["ok", "✓ נכונה"], ["review", "↺ צריך לחזור על זה"]].forEach(function(v){
        var b = make("button", "bm-verdict", v[1]);
        b.type = "button";
        b.setAttribute("data-verdict", v[0]);
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function(){
          var nv = st(f).verdict === v[0] ? null : v[0];
          setSt(f, { verdict: nv, flag: nv === "review" ? true : (nv === "ok" ? false : st(f).flag) });
          refresh();
        });
        wrap.appendChild(b);
      });
      box.appendChild(wrap);
      ui.get(f).check = wrap;
      refresh();
    }, 0);
  });

  // פס המשימות בראש הדף
  var bar = make("section", "bm-taskbar");
  bar.setAttribute("aria-labelledby", "bm-task-heading");
  var head = make("div", "bm-taskbar-head");
  var heading = make("h2", "bm-task-heading");
  heading.id = "bm-task-heading";
  heading.tabIndex = -1;
  var viewBtn = make("button", "bm-view-btn");
  viewBtn.type = "button";
  head.appendChild(heading); head.appendChild(viewBtn);

  var pills = make("ol", "bm-pills");
  pills.setAttribute("aria-label", "המשימות בדף");
  tasks.forEach(function(t, idx){
    var li = make("li"), b = make("button", "bm-pill", String(idx + 1));
    b.type = "button";
    b.addEventListener("click", function(){ go(idx, true); });
    li.appendChild(b); pills.appendChild(li);
    t.pill = b;
  });
  var sumLi = make("li"), sumPill = make("button", "bm-pill bm-pill-summary", "סיכום");
  sumPill.type = "button";
  sumPill.addEventListener("click", function(){ go(tasks.length, true); });
  sumLi.appendChild(sumPill); pills.appendChild(sumLi);

  var prog = make("div", "bm-progress");
  var progLabel = make("span", "bm-progress-label");
  var track = make("div", "bm-track");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-label", "התקדמות בשאלות החובה");
  // מקטע אחד לכל משימה - מתמלא לפי שאלות החובה שבה
  tasks.forEach(function(t){
    var seg = make("span", "bm-seg");
    t.segFill = make("span", "bm-seg-fill");
    seg.appendChild(t.segFill);
    track.appendChild(seg);
  });
  prog.appendChild(progLabel); prog.appendChild(track);
  var hint = make("p", "bm-task-hint");
  bar.appendChild(head); bar.appendChild(pills); bar.appendChild(prog); bar.appendChild(hint);
  main.insertBefore(bar, grid);

  // סיכום בסוף
  var summary = make("section", "bm-summary");
  summary.setAttribute("aria-labelledby", "bm-summary-title");
  var sumTitle = make("h2", "bm-summary-title", "סיכום: איפה אני עומד/ת?");
  sumTitle.id = "bm-summary-title";
  var stats = make("dl", "bm-stats");
  var reviewWrap = make("div", "bm-review");
  var sumNote = make("p", "bm-summary-note");
  summary.appendChild(sumTitle); summary.appendChild(stats); summary.appendChild(reviewWrap); summary.appendChild(sumNote);
  grid.insertAdjacentElement("afterend", summary);

  // ניווט "הקודם" / "הבא" בסוף המשימה
  var nav = make("nav", "bm-task-nav");
  nav.setAttribute("aria-label", "מעבר בין משימות");
  var prevBtn = make("button", "btn bm-prev", "→ הקודם");
  var navCount = make("span", "bm-nav-count");
  var nextBtn = make("button", "btn primary bm-next");
  prevBtn.type = nextBtn.type = "button";
  var doneMsg = make("p", "bm-task-done");
  doneMsg.setAttribute("role", "status");
  nav.appendChild(prevBtn); nav.appendChild(navCount); nav.appendChild(nextBtn); nav.appendChild(doneMsg);
  summary.insertAdjacentElement("afterend", nav);
  prevBtn.addEventListener("click", function(){ go(current - 1, true); });
  nextBtn.addEventListener("click", function(){ go(current + 1, true); });

  /* ---------- 5. מצב תצוגה ומיקום ---------- */
  var params = new URLSearchParams(location.search);
  var view = params.get("view") === "all" ? "all" : (params.get("view") === "steps" ? "steps" : load(KEY_VIEW, "steps"));
  if(params.get("view")) save(KEY_VIEW, view);
  var current = Math.max(0, Math.min(tasks.length, parseInt(load(KEY_POS, 0), 10) || 0));
  var lastDoneState = null;

  viewBtn.addEventListener("click", function(){
    view = view === "all" ? "steps" : "all";
    save(KEY_VIEW, view);
    apply();
    heading.focus();
  });

  function setOff(elm, off){ elm.classList.toggle("bm-off", off); }

  function apply(){
    var all = view === "all";
    root.classList.toggle("bm-steps-all", all);
    var visible = new Set(all ? blocks : (current < tasks.length ? tasks[current].blocks : []));
    cards.forEach(function(card){
      var cardBlocks = blocks.filter(function(b){ return b.card === card; });
      setOff(card, !cardBlocks.some(function(b){ return visible.has(b); }));
      cardBlocks.forEach(function(b){ if(b.part) setOff(b.part, !visible.has(b)); });
    });
    setOff(summary, !all && current < tasks.length);
    setOff(nav, all);
    setOff(pills, all);
    viewBtn.textContent = all ? "חזרה לתצוגה לפי משימות" : "📋 הצג את כל השאלות";
    refresh();
  }

  function go(idx, fromUser){
    current = Math.max(0, Math.min(tasks.length, idx));
    lastDoneState = null;
    save(KEY_POS, current);
    apply();
    saveLast();
    if(fromUser) heading.focus();
  }

  function saveLast(){
    save(KEY_LAST, {
      page: PAGE, title: document.title,
      task: Math.min(current, tasks.length - 1) + 1, total: tasks.length,
      finished: totalDone() >= totalNeed(), t: Date.now()
    });
  }

  /* ---------- 6. עדכון כל התצוגה ---------- */
  function refresh(){
    var all = view === "all";

    fields.forEach(function(f){
      var u = ui.get(f), s = st(f), t = taskOf(f);
      u.pos.textContent = (!all && t) ? "שאלה " + (t.fields.indexOf(f) + 1) + " מתוך " + t.fields.length : "";
      u.pos.hidden = all;
      var key, text;
      if(s.verdict === "ok"){ key = "ok"; text = "✓ נבדקה: נכונה"; }
      else if(s.verdict === "review"){ key = "review"; text = "↺ נבדקה: דורשת חזרה"; }
      else if(isFilled(f)){ key = s.flag ? "review" : "done"; text = s.flag ? "✓ הושלמה · מסומנת לחזרה" : "✓ הושלמה"; }
      else { key = s.flag ? "review" : "empty"; text = s.flag ? "○ טרם נענתה · מסומנת לחזרה" : "○ טרם נענתה"; }
      u.state.textContent = text;
      u.state.setAttribute("data-state", key);
      u.flag.setAttribute("aria-pressed", String(needsReview(f)));
      if(u.check){
        Array.prototype.forEach.call(u.check.querySelectorAll(".bm-verdict"), function(b){
          b.setAttribute("aria-pressed", String(s.verdict === b.getAttribute("data-verdict")));
        });
      }
    });

    units.forEach(function(u){ if(u.doneEl) u.doneEl.hidden = unitDone(u) < u.need; });

    var tasksDone = 0;
    tasks.forEach(function(t, idx){
      var done = taskDone(t) >= t.need;
      if(done) tasksDone++;
      var flagged = t.fields.some(needsReview);
      t.pill.classList.toggle("is-done", done);
      t.pill.classList.toggle("has-flag", flagged);
      if(idx === current) t.pill.setAttribute("aria-current", "step"); else t.pill.removeAttribute("aria-current");
      t.pill.setAttribute("aria-label", "משימה " + (idx + 1) + ": " + t.title + (done ? " - הושלמה" : "") + (flagged ? " - יש בה שאלות לחזרה" : ""));
      t.segFill.style.width = (t.need ? Math.round(taskDone(t) / t.need * 100) : 100) + "%";
    });
    if(current === tasks.length) sumPill.setAttribute("aria-current", "step"); else sumPill.removeAttribute("aria-current");

    var pct = requiredPercent();
    track.setAttribute("aria-valuenow", String(pct));
    track.setAttribute("aria-valuetext", "הושלמו " + tasksDone + " מתוך " + tasks.length + " משימות, " + pct + "% משאלות החובה");
    progLabel.textContent = "הושלמו " + tasksDone + " מתוך " + tasks.length + " משימות";

    if(all){
      heading.innerHTML = "";
      heading.appendChild(make("span", "bm-of", "תצוגה מלאה"));
      heading.appendChild(document.createTextNode("כל השאלות בדף"));
      hint.textContent = "השאלות מסודרות לפי המשימות. אפשר לחזור בכל רגע לתצוגה לפי משימות.";
    } else if(current < tasks.length){
      var t = tasks[current];
      heading.innerHTML = "";
      heading.appendChild(make("span", "bm-of", "משימה " + (current + 1) + " מתוך " + tasks.length));
      heading.appendChild(document.createTextNode(t.title));
      hint.textContent = "במשימה הזו " + t.fields.length + " שאלות" +
        (t.need < t.fields.length ? " - בחלקן אפשר לבחור, ומספיק לענות על " + t.need + "." : ".") +
        " כשתסיימו, לחצו \"הבא\".";
    } else {
      heading.innerHTML = "";
      heading.appendChild(make("span", "bm-of", "סוף הדף"));
      heading.appendChild(document.createTextNode("סיכום"));
      hint.textContent = "כאן רואים מה הושלם, מה נבדק, ומה כדאי לחזור עליו.";
    }

    prevBtn.hidden = current === 0;
    nextBtn.hidden = current >= tasks.length;
    nextBtn.textContent = current === tasks.length - 1 ? "סיימתי - לסיכום ←" : "הבא ←";
    navCount.textContent = current < tasks.length ? "משימה " + (current + 1) + " מתוך " + tasks.length : "";

    // הודעת עידוד כשמשימה הושלמה עכשיו (לא בכל הקלדה)
    if(current < tasks.length){
      var nowDone = taskDone(tasks[current]) >= tasks[current].need;
      if(lastDoneState === false && nowDone) doneMsg.textContent = "✓ כל הכבוד! סיימתם את המשימה הזו.";
      else if(!nowDone) doneMsg.textContent = "";
      lastDoneState = nowDone;
    } else {
      doneMsg.textContent = "";
    }

    renderSummary(tasksDone);
  }

  function renderSummary(tasksDone){
    var checked = 0, ok = 0, review = [];
    fields.forEach(function(f){
      var s = st(f);
      if(s.verdict) checked++;
      if(s.verdict === "ok") ok++;
      if(needsReview(f)) review.push(f);
    });
    stats.innerHTML = "";
    function stat(label, value, cls){
      var box = make("div", "bm-stat" + (cls ? " " + cls : ""));
      box.appendChild(make("dt", "", label));
      box.appendChild(make("dd", "", value));
      stats.appendChild(box);
    }
    stat("הושלמו", totalDone() + " מתוך " + totalNeed() + " שאלות חובה", "is-done");
    stat("משימות שהושלמו", tasksDone + " מתוך " + tasks.length);
    if(hasModelAnswers){
      stat("נבדקו מול התשובה", String(checked));
      stat("נכונות", String(ok), "is-ok");
    }
    stat("דורשות חזרה", String(review.length), "is-review");

    reviewWrap.innerHTML = "";
    if(review.length){
      reviewWrap.appendChild(make("h3", "bm-review-title", "שאלות שכדאי לחזור עליהן"));
      var list = make("ul", "bm-review-list");
      review.forEach(function(f){
        var t = taskOf(f);
        var lbl = f.getAttribute("aria-labelledby") ? document.getElementById(f.getAttribute("aria-labelledby")) : null;
        var partLbl = f.closest(".bagrut-part") ? f.closest(".bagrut-part").querySelector(".bagrut-part-label") : null;
        var text = lbl ? cleanText(lbl) : (partLbl ? t.title + " - " + cleanText(partLbl) : t.title);
        if(text.length > 90) text = text.slice(0, 88) + "…";
        var li = make("li");
        var b = make("button", "bm-review-go", "משימה " + (t.index + 1) + ": " + text);
        b.type = "button";
        b.addEventListener("click", function(){ go(t.index, false); f.focus(); });
        li.appendChild(b); list.appendChild(li);
      });
      reviewWrap.appendChild(list);
    }
    sumNote.textContent = hasModelAnswers
      ? "\"נבדקה\" פירושו שהשוויתם את התשובה שלכם לתשובה שבדף (בכפתור \"הצג תשובה\") וסימנתם אם היא נכונה."
      : "בדף הזה אין תשובות לבדיקה עצמית - המורה יבדוק את התשובות. אפשר לסמן שאלות שתרצו לחזור עליהן.";
  }

  /* ---------- 7. אירועים: הקלדה, ניקוי, הדפסה ---------- */
  var lastSaveTimer = null;
  document.addEventListener("input", function(e){
    if(!e.target || !ui.has(e.target)) return;
    refresh();
    clearTimeout(lastSaveTimer);
    lastSaveTimer = setTimeout(saveLast, 600);
  });

  var clearBtn = document.getElementById("clearBtn");
  if(clearBtn){
    clearBtn.addEventListener("click", function(){
      setTimeout(function(){
        if(fields.every(function(f){ return !isFilled(f); })){ status = {}; save(KEY_STATUS, status); }
        refresh();
      }, 0);
    });
  }

  // בהדפסה / PDF - כל המשימות מודפסות. (הגובה של שדות שהיו מוסתרים מחושב מחדש)
  var hiddenBeforePrint = [];
  window.addEventListener("beforeprint", function(){
    hiddenBeforePrint = Array.prototype.slice.call(document.querySelectorAll(".bm-off"));
    hiddenBeforePrint.forEach(function(x){ x.classList.remove("bm-off"); });
    fields.forEach(function(f){
      if(f.tagName === "TEXTAREA" && hiddenBeforePrint.some(function(x){ return x.contains(f); })){
        f.style.height = "auto";
        f.style.height = (f.scrollHeight + 4) + "px";
      }
    });
  });
  window.addEventListener("afterprint", function(){
    hiddenBeforePrint.forEach(function(x){ x.classList.add("bm-off"); });
    hiddenBeforePrint = [];
  });

  window.BeitMidrashSteps = { requiredPercent: requiredPercent };

  apply();
  saveLast();
})();
