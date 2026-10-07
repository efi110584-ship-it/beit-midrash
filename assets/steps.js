/* ============================================================
   הכיתה הדיגיטלית - דף עבודה במשימות קטנות (שלב ב׳)
   ============================================================
   במקום דף ארוך עם עשרות שאלות, הדף מוצג כמשימות של 3-7 שאלות,
   עם "הקודם" / "הבא", ובאפשרות לחזור לתצוגה המלאה ("הצג את כל השאלות",
   או ?view=all בכתובת - למורה). שום תוכן לא נמחק או משתנה: כל השאלות
   נשארות בדף, ורק מוסתרות בזמן שעובדים על משימה אחרת.
   בהדפסה, ב-PDF ובשליחה למורה - הכול נכלל.

   מה הסקריפט מזהה בכל סוג דף:
   - כרטיסי שאלות (section.card / article.card) ועמודות נושא (topic-col)
   - כרטיס גדול מחולק לפי: שאלת בגרות (.bagrut-block / .exam-tag),
     ענף שאלות (.qb-topic), שורת טבלה, או שאלה (.question-block)
   - דף עם לשוניות נושאים (.topic-section) - רצף משימות נפרד לכל נושא
   - שאלות פתוחות, שאלות בחירה (.mc-group - נבדקות אוטומטית) וטבלאות

   בנוסף:
   - מד התקדמות שסופר רק שאלות חובה: בקבוצת "בחרו 2 מתוך 3"
     שתי תשובות = הקבוצה הושלמה (data-choose על ה-choice-note).
   - מצב לכל שאלה: הושלמה / נבדקה (נכונה / דורשת חזרה) / סומנה לחזרה.
   - שומר במכשיר באיזו משימה התלמיד עומד, ורושם את "המקום האחרון"
     כדי שדף הבית יציג "המשיכו מהמקום שבו הפסקתם".

   מסלול למידה (שלב ג׳) - רק בדף שיש בו data-stage על כרטיסים:
   הסבר קצר ← דוגמה פתורה ← מתרגלים ביחד ← מנסים לבד ← שאלת בגרות ← סיכום.
   data-stage מסמן את הכרטיס הראשון של כל שלב (הכרטיסים שאחריו שייכים
   לאותו שלב). משימה לא חוצה שלבים; משימת קריאה (בלי שאלות) נחשבת
   הושלמה אחרי שצפו בה. כרטיסי שלב "summary" (מה למדנו, תרגול נוסף)
   מוצגים במסך הסיכום.
   העיצוב ב-assets/site.css (חלק "steps").
   ============================================================ */
(function(){
  "use strict";

  var PAGE = location.pathname.split("/").pop() || "index.html";
  var KEY_VIEW = "bm-steps-view";
  var KEY_LAST = "bm-last-place-v1";
  var MIN_Q = 4, MAX_Q = 7, SMALL_Q = 3;   // משימה נסגרת אחרי 4 שאלות, לא יותר מ-7, ומשימה של פחות מ-3 מתמזגת
  var STAGES = [
    ["explain", "הסבר קצר", "📖"],
    ["example", "דוגמה פתורה", "✏️"],
    ["intro", "תקציר", "📋"],
    ["guided", "מתרגלים ביחד", "🤝"],
    ["learn_together", "לומדים ביחד", "🤝"],
    ["open", "מנסים לבד", "💪"],
    ["bagrut_example", "דוגמה: פתרון שאלת בגרות", "🎓"],
    ["bagrut", "שאלת בגרות", "🎓"],
    ["summary", "סיכום", "✅"]
  ];
  var STAGE = {};
  STAGES.forEach(function(s){ STAGE[s[0]] = { name: s[1], icon: s[2] }; });
  var STAGE_HINT = {
    explain: "קראו את ההסבר בעיון. כשתסיימו, לחצו \"הבא\".",
    example: "ראו איך עונים על שאלה - צעד אחר צעד. אחר כך תתרגלו בעצמכם.",
    intro: "קראו את תקציר הפרק בעיון. כשתסיימו, לחצו \"הבא\".",
    learn_together: "לומדים את הפרק יחד - אפשר להיעזר בפתיחים וברמזים כשצריך.",
    open: "עכשיו נסו לבד - בלי פתיח ובלי רמזים. אחרי שתכתבו, אפשר לבדוק את התשובה.",
    bagrut_example: "ראו איך עונים על שאלת בגרות אמיתית - צעד אחר צעד. אחר כך תתרגלו בעצמכם, בלי אפשרות לראות תשובה.",
    bagrut: "השאלות מבחינות בגרות אמיתיות."
  };

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
  function arr(list){ return Array.prototype.slice.call(list); }
  function cleanText(node){
    if(!node) return "";
    var c = node.cloneNode(true);
    arr(c.querySelectorAll('[aria-hidden="true"]')).forEach(function(x){ x.remove(); });
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function shorten(t, n){ return t.length > n ? t.slice(0, n - 1) + "…" : t; }

  var params = new URLSearchParams(location.search);
  var view = params.get("view") === "all" ? "all" : (params.get("view") === "steps" ? "steps" : load(KEY_VIEW, "steps"));
  if(params.get("view")) save(KEY_VIEW, view);

  /* ---------- איפה יש דפי עבודה בדף ---------- */
  var main = document.querySelector("main");
  if(!main) return;
  var containers = arr(main.querySelectorAll(".topic-section")).filter(function(s){ return s.querySelector(".grid"); })
    .map(function(s){
      var t = s.querySelector(".topic-title");
      return { root: s, grid: s.querySelector(".grid"), key: s.id || "", title: t ? cleanText(t) : "" };
    });
  if(!containers.length){
    var g = main.querySelector(".grid");
    if(g) containers = [{ root: main, grid: g, key: "", title: "" }];
  }

  var instances = [];
  containers.forEach(function(c, n){
    var inst = createStepper(c, n);
    if(inst) instances.push(inst);
  });
  if(!instances.length) return;
  document.documentElement.classList.add("bm-steps");

  function requiredPercent(){
    var need = 0, done = 0;
    instances.forEach(function(i){ need += i.totalNeed(); done += i.totalDone(); });
    return need ? Math.round(done / need * 100) : 0;
  }
  function isAtEnd(){ return instances.every(function(i){ return i.atEnd(); }); }
  window.BeitMidrashSteps = { requiredPercent: requiredPercent, isAtEnd: isAtEnd };

  function applyAll(){ instances.forEach(function(i){ i.apply(); }); }

  /* ---------- אירועים משותפים: הקלדה, בחירה, ניקוי, הדפסה ---------- */
  var lastSaveTimer = null;
  function onChange(e){
    var t = e.target;
    if(!t || !t.closest) return;
    instances.forEach(function(i){
      if(i.owns(t)){
        i.refresh();
        clearTimeout(lastSaveTimer);
        lastSaveTimer = setTimeout(i.saveLast, 600);
      }
    });
    document.dispatchEvent(new CustomEvent("bm-steps-change"));
  }
  document.addEventListener("input", onChange);
  document.addEventListener("change", onChange);

  var clearBtn = document.getElementById("clearBtn");
  if(clearBtn){
    clearBtn.addEventListener("click", function(){
      setTimeout(function(){ instances.forEach(function(i){ i.afterClear(); }); }, 0);
    });
  }

  var hiddenBeforePrint = [];
  window.addEventListener("beforeprint", function(){
    hiddenBeforePrint = arr(document.querySelectorAll(".bm-off"));
    hiddenBeforePrint.forEach(function(x){ x.classList.remove("bm-off"); });
    // שדות שהיו מוסתרים - הגובה שלהם מחושב מחדש, כדי שכל התשובה תודפס
    arr(document.querySelectorAll("textarea.answer")).forEach(function(f){
      if(hiddenBeforePrint.some(function(x){ return x.contains(f); })){
        f.style.height = "auto";
        f.style.height = (f.scrollHeight + 4) + "px";
      }
    });
  });
  window.addEventListener("afterprint", function(){
    hiddenBeforePrint.forEach(function(x){ x.classList.add("bm-off"); });
    hiddenBeforePrint = [];
  });

  applyAll();
  // "המקום האחרון" - לפי הנושא הפתוח (בדף עם לשוניות) או הדף עצמו
  var visibleInst = instances.filter(function(i){ return !i.root.hidden; })[0] || instances[0];
  visibleInst.saveLast();

  /* ============================================================
     רצף משימות אחד (לדף רגיל - אחד; לדף עם לשוניות - אחד לכל נושא)
     ============================================================ */
  function createStepper(c, n){
    var grid = c.grid, root = c.root;
    var suffix = c.key ? "#" + c.key : "";
    var KEY_POS = "bm-steps-pos:" + PAGE + suffix;
    var KEY_STATUS = "bm-steps-status:" + PAGE + suffix;
    var ID = "bm" + n;

    /* ---------- 0. מסלול למידה: לאיזה שלב שייך כל כרטיס ---------- */
    var children = arr(grid.children).filter(function(ch){ return ch.tagName !== "SCRIPT"; });
    var hasPath = children.some(function(ch){ return STAGE[ch.getAttribute("data-stage")]; });
    var stageOf = new Map(), stageNow = "guided";
    if(hasPath){
      children.forEach(function(ch){
        var s = ch.getAttribute("data-stage");
        if(STAGE[s]) stageNow = s;
        stageOf.set(ch, stageNow);
        ch.setAttribute("data-bm-stage", stageNow);   // assets/guide.js נשען על זה (למשל: בשלב "מנסים לבד" אין רמזים)
      });
    }
    // "מה למדנו" ו"תרגול נוסף" - לא משימות, אלא חלק ממסך הסיכום
    var endCards = children.filter(function(ch){ return stageOf.get(ch) === "summary"; });
    var taskChildren = children.filter(function(ch){ return endCards.indexOf(ch) === -1; });

    /* ---------- 1. הפריטים: שאלה פתוחה, תא בטבלה, שאלת בחירה ---------- */
    // שאלת בגרות נשארת נקייה - בלי שורת מצב ובדיקה עצמית (אותו כלל כמו ב-assets/guide.js)
    function isBagrut(el){
      var host = el.closest("[data-bm-stage]");
      if(el.closest(".bagrut-part, .bagrut-block") || (host && host.getAttribute("data-bm-stage") === "bagrut")) return true;
      var qb = el.closest(".question-block");
      if(!qb) return false;
      for(var s = qb.previousElementSibling; s; s = s.previousElementSibling){ if(s.classList.contains("exam-tag")) return true; }
      var q = qb.querySelector(".q-text");
      return !!q && /^שאלת בגרות/.test(cleanText(q));
    }
    var items = [];
    arr(grid.querySelectorAll("textarea.answer, input.answer, .mc-group")).forEach(function(el, i){
      if(endCards.some(function(ec){ return ec.contains(el); })) return;
      var type = el.classList.contains("mc-group") ? "mc" : (el.closest("table") ? "cell" : "text");
      var id = el.getAttribute("data-id") || el.getAttribute("data-qid") || ("item-" + i);
      items.push({ el: el, type: type, id: id, bagrut: type === "text" && isBagrut(el) });
    });
    if(items.length < SMALL_Q) return null;
    var itemOf = new Map();
    items.forEach(function(it){ itemOf.set(it.el, it); });

    function isFilled(it){
      if(it.type === "mc") return !!it.el.querySelector("input:checked");
      return !!(it.el.value && it.el.value.trim());
    }
    function mcVerdict(it){
      var chosen = it.el.querySelector("input:checked");
      if(!chosen) return null;
      var opt = chosen.closest("[data-correct]");
      return opt ? (opt.getAttribute("data-correct") === "true" ? "ok" : "review") : null;
    }

    /* ---------- 2. שאלות חובה, וקבוצות בחירה ("ענו על 2 מתוך 3") ---------- */
    function chooseCount(note){
      var k = parseInt(note.getAttribute("data-choose"), 10);
      if(!isNaN(k)) return k;
      var m = note.textContent.match(/לפחות\s*(?:על\s*)?(\d+|אחד|אחת|שניים|שתיים|שני|שתי)/);
      if(!m) return null;
      var words = { "אחד":1, "אחת":1, "שניים":2, "שתיים":2, "שני":2, "שתי":2 };
      return words[m[1]] || parseInt(m[1], 10) || null;
    }
    var unitOf = new Map(), units = [];
    arr(grid.querySelectorAll(".choice-note")).forEach(function(note){
      var need = chooseCount(note);
      if(!need) return;
      var members = [];
      for(var sib = note.nextElementSibling; sib && !sib.classList.contains("choice-note"); sib = sib.nextElementSibling){
        if(!sib.classList.contains("question-block")) continue;
        if(!sib.querySelector(".choice-chip")) break;
        var f = sib.querySelector("textarea.answer, input.answer");
        if(f && itemOf.has(f)) members.push(itemOf.get(f));
      }
      if(members.length > need){
        var u = { items: members, need: need, note: note };
        units.push(u);
        members.forEach(function(it){ unitOf.set(it, u); });
      }
    });
    items.forEach(function(it){
      if(unitOf.has(it)) return;
      var u = { items: [it], need: it.el.closest("[data-optional]") ? 0 : 1, note: null };
      units.push(u);
      unitOf.set(it, u);
    });
    function unitDone(u){ return Math.min(u.items.filter(isFilled).length, u.need); }
    function totalNeed(){ return units.reduce(function(s, u){ return s + u.need; }, 0); }
    function totalDone(){ return units.reduce(function(s, u){ return s + unitDone(u); }, 0); }

    /* ---------- 3. חלוקה לגושים, וגוש גדול - לחלקים ---------- */
    function itemsIn(els){ return items.filter(function(it){ return els.some(function(e){ return e.contains(it.el); }); }); }
    function titleOf(el){
      var t = el.querySelector(".card-title, .topic-title, h2, h3");
      return t ? cleanText(t) : "";
    }
    // רצף אחים ב-DOM: כל חלק מתחיל בסמן (למשל .exam-tag) וכולל את מה שאחריו
    function ranges(markers){
      var parent = markers[0].parentElement, out = [], cur = null;
      arr(parent.children).forEach(function(ch){
        if(markers.indexOf(ch) !== -1 || !cur){ cur = []; out.push(cur); }
        cur.push(ch);
      });
      return out;
    }
    function splitParts(child){
      var list;
      list = arr(child.querySelectorAll(".bagrut-block"));
      if(list.length > 1) return list.map(function(b){ var s = b.querySelector(".src"); return { els: [b], title: cleanText(s) }; });
      list = arr(child.querySelectorAll(".qb-topic"));
      if(list.length > 1) return list.map(function(b){ return { els: [b], title: cleanText(b.querySelector(".qb-root-label")) }; });
      list = arr(child.querySelectorAll(".exam-tag"));
      if(list.length > 1 && list.every(function(m){ return m.parentElement === list[0].parentElement; })){
        return ranges(list).map(function(r){ return { els: r, title: cleanText(r.filter(function(e){ return e.classList.contains("exam-tag"); })[0]) }; });
      }
      list = arr(child.querySelectorAll("tbody > tr")).filter(function(tr){ return tr.querySelector("input.answer, textarea.answer"); });
      if(list.length > 1) return list.map(function(tr){ return { els: [tr], title: "", row: true }; });
      list = arr(child.querySelectorAll(".question-block"));
      if(list.length > 1 && list.every(function(q){ return q.parentElement === list[0].parentElement; })){
        // כל שאלה עם הפסוק/הפרשן שלפניה
        var parent = list[0].parentElement, out = [], pending = [];
        arr(parent.children).forEach(function(ch){
          pending.push(ch);
          if(list.indexOf(ch) !== -1){ out.push({ els: pending, title: "" }); pending = []; }
        });
        if(pending.length && out.length) out[out.length - 1].els = out[out.length - 1].els.concat(pending);
        return out;
      }
      return null;
    }

    var blocks = [];
    taskChildren.forEach(function(child){
      var its = itemsIn([child]);
      var bagrut = child.querySelectorAll(".bagrut-block").length > 0 && !child.querySelector(".question-block");
      var kind = bagrut ? "bagrut" : "regular";
      var title = titleOf(child);
      var stage = stageOf.get(child);
      var parts = its.length > MAX_Q ? splitParts(child) : null;
      if(parts){
        parts.forEach(function(p){
          var pits = itemsIn(p.els);
          blocks.push({ card: child, els: p.els, items: pits, size: p.row ? (pits.length ? 1 : 0) : pits.length,
            kind: kind, title: p.title || title, row: !!p.row, stage: stage });
        });
      } else {
        blocks.push({ card: child, els: [child], items: its, size: its.length, kind: kind, title: title, row: false, stage: stage });
      }
    });

    /* ---------- 4. קיבוץ למשימות של 3-7 (במסלול למידה - בלי לחצות שלבים) ---------- */
    var totalSize = blocks.reduce(function(s, b){ return s + b.size; }, 0);
    var tasks = [], cur = null;
    if(totalSize <= MAX_Q && !hasPath){
      tasks.push({ blocks: blocks.slice(), size: totalSize, kind: "regular" });   // דף קצר - משימה אחת
    } else {
      blocks.forEach(function(b){
        // כרטיס עם data-keep-together: כל השאלות שבו נשארות במשימה אחת
        // (לא נחצות ב-4/7, גם לא מתמזגות עם הכרטיס שלפני/אחרי).
        var curCard = cur && cur.blocks.length ? cur.blocks[cur.blocks.length - 1].card : null;
        var curKeep = !!(curCard && curCard.hasAttribute("data-keep-together"));
        var cardChanged = curCard && curCard !== b.card;
        var breakForKeep = cardChanged && (curKeep || b.card.hasAttribute("data-keep-together"));
        if(!cur || cur.stage !== b.stage || (cur.size > 0 && (cur.kind !== b.kind || breakForKeep || (!curKeep && (cur.size >= MIN_Q || cur.size + b.size > MAX_Q))))){
          cur = { blocks: [], size: 0, kind: b.kind, stage: b.stage };
          tasks.push(cur);
        }
        if(cur.size === 0) cur.kind = b.kind;
        cur.blocks.push(b);
        cur.size += b.size;
      });
      for(var i = tasks.length - 1; i > 0; i--){
        var t = tasks[i], p = tasks[i - 1];
        if(p.stage !== t.stage) continue;
        // משימה ריקה תמיד מתמזגת; משימה קטנה לא מתמזגת אם מישהו מהצדדים
        // מסומן data-keep-together - גם אם קטנה, היא נשארת מסך נפרד.
        var tKeep = t.size > 0 && t.blocks.length && t.blocks[0].card.hasAttribute("data-keep-together");
        var pKeep = p.blocks.length && p.blocks[p.blocks.length - 1].card.hasAttribute("data-keep-together");
        if(t.size > 0 && (tKeep || pKeep)) continue;
        if(t.size === 0 || (t.size < SMALL_Q && p.kind === t.kind && p.size + t.size <= MAX_Q)){
          p.blocks = p.blocks.concat(t.blocks);
          p.size += t.size;
          tasks.splice(i, 1);
        }
      }
    }
    var single = tasks.length === 1;

    var bagrutNo = 0, bagrutTotal = tasks.filter(function(t){ return t.kind === "bagrut"; }).length;
    tasks.forEach(function(t, idx){
      t.index = idx;
      t.items = [];
      t.blocks.forEach(function(b){ t.items = t.items.concat(b.items); });
      t.units = units.filter(function(u){ return u.items.some(function(it){ return t.items.indexOf(it) !== -1; }); });
      t.need = t.units.reduce(function(s, u){ return s + u.need; }, 0);
      t.rowsOnly = t.blocks.every(function(b){ return b.row || !b.items.length; });
      if(t.kind === "bagrut"){
        bagrutNo++;
        t.title = "תרגול שאלות בגרות" + (bagrutTotal > 1 ? " (" + bagrutNo + " מתוך " + bagrutTotal + ")" : "");
      } else {
        var titles = [];
        t.blocks.forEach(function(b){ if((b.items.length || !t.items.length) && b.title && titles.indexOf(b.title) === -1) titles.push(b.title); });
        t.title = shorten(titles.slice(0, 2).join(" · ") + (titles.length > 2 ? " ועוד" : ""), 90) || c.title || "המשימה בדף";
      }
    });
    function taskOf(it){ for(var k = 0; k < tasks.length; k++){ if(tasks[k].items.indexOf(it) !== -1) return tasks[k]; } return null; }
    function taskDone(t){ return t.units.reduce(function(s, u){ return s + unitDone(u); }, 0); }
    // משימת קריאה (הסבר / דוגמה פתורה) - הושלמה אחרי שצפו בה
    function seenKey(t){ return t.stage + ":" + t.index; }
    function isTaskDone(t){
      if(t.need) return taskDone(t) >= t.need;
      return hasPath ? !!(status.__seen && status.__seen[seenKey(t)]) : true;
    }
    function markSeen(t){
      if(!hasPath || t.need || isTaskDone(t)) return;
      var s = status.__seen || {};
      s[seenKey(t)] = true;
      status.__seen = s;
      save(KEY_STATUS, status);
    }

    /* ---------- 5. מצב כל שאלה ---------- */
    var status = load(KEY_STATUS, {}) || {};
    function st(it){
      if(it.bagrut) return {};             // בשאלת בגרות אין סימון לחזרה / בדיקה עצמית
      var s = status[it.id] || {};
      if(it.type === "mc"){ var v = mcVerdict(it); return { flag: s.flag, verdict: v }; }
      return s;
    }
    function setSt(it, patch){
      var s = {}, old = status[it.id] || {}, k;
      for(k in old) s[k] = old[k];
      for(k in patch) s[k] = patch[k];
      status[it.id] = s;
      save(KEY_STATUS, status);
    }
    function needsReview(it){ var s = st(it); return !!(s.flag || s.verdict === "review"); }
    var hasSelfCheck = items.some(function(it){ return it.type !== "mc" && !it.bagrut && it.el.parentElement.querySelector(".hint-btn"); });
    var hasFlag = items.some(function(it){ return it.type === "text" && !it.bagrut; });
    var hasMc = items.some(function(it){ return it.type === "mc"; });

    /* ---------- 6. בניית הממשק ---------- */
    var ui = new Map();
    items.forEach(function(it){
      if(it.type !== "text" || it.bagrut) return;      // בטבלה, בשאלת בחירה ובשאלת בגרות - אין שורת מצב
      var f = it.el;
      var row = make("div", "bm-qstatus");
      var pos = make("span", "bm-qpos");
      var state = make("span", "bm-qstate");
      var flag = make("button", "bm-flag", "🔖 סמנו לחזרה");
      flag.type = "button";
      flag.setAttribute("aria-pressed", "false");
      if(f.getAttribute("aria-labelledby")) flag.setAttribute("aria-describedby", f.getAttribute("aria-labelledby"));
      row.appendChild(pos); row.appendChild(state); row.appendChild(flag);
      f.insertAdjacentElement("afterend", row);
      ui.set(it, { pos: pos, state: state, flag: flag, check: null });
      flag.addEventListener("click", function(){
        var s = st(it), on = !needsReview(it);
        setSt(it, { flag: on, verdict: on ? s.verdict : (s.verdict === "review" ? null : s.verdict) });
        refresh();
      });
    });

    units.forEach(function(u){
      if(!u.note) return;
      u.doneEl = make("span", "bm-choice-done", "✓ עניתם על מספיק שאלות כאן - אפשר להמשיך");
      u.doneEl.hidden = true;
      u.note.appendChild(u.doneEl);
    });

    // בדיקה עצמית - בתוך תיבת "הצג תשובה", אחרי שפותחים אותה
    grid.addEventListener("click", function(e){
      var btn = e.target && e.target.closest ? e.target.closest(".hint-btn") : null;
      if(!btn) return;
      setTimeout(function(){
        var box = btn.nextElementSibling;
        if(!box || !box.classList.contains("hint-box") || box.hidden) return;
        var f = btn.parentElement.querySelector("textarea.answer, input.answer");
        var it = f && itemOf.get(f);
        if(!it || !ui.has(it) || box.querySelector(".bm-selfcheck")) return;
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
            var nv = st(it).verdict === v[0] ? null : v[0];
            setSt(it, { verdict: nv, flag: nv === "review" ? true : (nv === "ok" ? false : st(it).flag) });
            refresh();
          });
          wrap.appendChild(b);
        });
        box.appendChild(wrap);
        ui.get(it).check = wrap;
        refresh();
      }, 0);
    });

    // פס המשימות
    var bar = make("section", "bm-taskbar");
    bar.setAttribute("aria-labelledby", ID + "-heading");
    var head = make("div", "bm-taskbar-head");
    var heading = make("h2", "bm-task-heading");
    heading.id = ID + "-heading";
    heading.tabIndex = -1;
    var viewBtn = make("button", "bm-view-btn");
    viewBtn.type = "button";
    head.appendChild(heading);
    if(!single) head.appendChild(viewBtn);

    var pills = make("ol", "bm-pills");
    pills.setAttribute("aria-label", "המשימות" + (c.title ? " בנושא " + c.title : " בדף"));
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
    tasks.forEach(function(t){
      var seg = make("span", "bm-seg");
      t.segFill = make("span", "bm-seg-fill");
      seg.appendChild(t.segFill);
      track.appendChild(seg);
    });
    prog.appendChild(progLabel); prog.appendChild(track);
    var hint = make("p", "bm-task-hint");

    // מסלול הלמידה - שלבי הנושא, והשלב שבו התלמיד נמצא
    var path = null, pathItems = [];
    if(hasPath){
      path = make("ol", "bm-path");
      path.setAttribute("aria-label", "מסלול הלמידה");
      STAGES.forEach(function(s){
        var key = s[0];
        var first = -1;
        for(var k = 0; k < tasks.length; k++){ if(tasks[k].stage === key){ first = k; break; } }
        if(key !== "summary" && first === -1) return;
        var li = make("li", "bm-path-step"), b = make("button", "bm-path-btn");
        b.type = "button";
        b.appendChild(make("span", "bm-path-icon", s[2])).setAttribute("aria-hidden", "true");
        b.appendChild(make("span", "bm-path-name", s[1]));
        b.addEventListener("click", function(){ go(key === "summary" ? tasks.length : first, true); });
        li.appendChild(b); path.appendChild(li);
        pathItems.push({ key: key, name: s[1], btn: b });
      });
    }

    bar.appendChild(head);
    if(path) bar.appendChild(path);
    if(!single) bar.appendChild(pills);
    bar.appendChild(prog); bar.appendChild(hint);
    grid.parentElement.insertBefore(bar, grid);

    // סיכום
    var summary = make("section", "bm-summary");
    summary.setAttribute("aria-labelledby", ID + "-summary-title");
    var sumTitle = make("h2", "bm-summary-title", single ? "איפה אני עומד/ת?" : "סיכום: איפה אני עומד/ת?");
    sumTitle.id = ID + "-summary-title";
    var stats = make("dl", "bm-stats");
    var reviewWrap = make("div", "bm-review");
    var sumNote = make("p", "bm-summary-note");
    summary.appendChild(sumTitle); summary.appendChild(stats); summary.appendChild(reviewWrap); summary.appendChild(sumNote);
    if(endCards.length){
      // במסלול למידה: קודם "איפה אני עומד/ת", ואחריו "מה למדנו" ו"תרגול נוסף"
      summary.classList.add("bm-summary-in-grid");
      grid.insertBefore(summary, endCards[0]);
    } else {
      grid.insertAdjacentElement("afterend", summary);
    }

    // "הקודם" / "הבא"
    var nav = make("nav", "bm-task-nav");
    nav.setAttribute("aria-label", "מעבר בין משימות");
    var prevBtn = make("button", "btn bm-prev", "→ הקודם");
    var navCount = make("span", "bm-nav-count");
    var nextBtn = make("button", "btn primary bm-next");
    prevBtn.type = nextBtn.type = "button";
    var doneMsg = make("p", "bm-task-done");
    doneMsg.setAttribute("role", "status");
    nav.appendChild(prevBtn); nav.appendChild(navCount); nav.appendChild(nextBtn); nav.appendChild(doneMsg);
    var navAnchor = endCards.length ? grid : summary;
    navAnchor.insertAdjacentElement("afterend", nav);
    prevBtn.addEventListener("click", function(){ go(current - 1, true); });
    nextBtn.addEventListener("click", function(){ go(current + 1, true); });

    // אם למשימה הנוכחית יש toolbar פנימי בכרטיס עצמו (למשל "בדקו לי את
    // התשובות") - "הקודם/הבא" עובר לשם, לאותה שורה, במקום להופיע בנפרד
    // מתחת לכל האזור. בדף/משימה בלי toolbar כזה - הניווט נשאר במקומו הרגיל.
    function placeNav(){
      var host = null;
      if(view !== "all" && !single && current < tasks.length){
        tasks[current].blocks.some(function(b){
          var t = b.card.querySelector(":scope > .card-body > .toolbar");
          if(t){ host = t; return true; }
          return false;
        });
      }
      if(host){
        if(nav.parentElement !== host) host.appendChild(nav);
      } else if(nav.parentElement !== navAnchor.parentElement || nav.previousElementSibling !== navAnchor){
        navAnchor.insertAdjacentElement("afterend", nav);
      }
    }

    /* ---------- 7. מצב תצוגה ומיקום ---------- */
    var current = single ? 0 : Math.max(0, Math.min(tasks.length, parseInt(load(KEY_POS, 0), 10) || 0));
    var lastDoneState = null;

    viewBtn.addEventListener("click", function(){
      view = view === "all" ? "steps" : "all";
      save(KEY_VIEW, view);
      applyAll();
      heading.focus();
    });

    function setOff(elm, off){ elm.classList.toggle("bm-off", off); }

    function apply(){
      var all = view === "all" || single;
      var visible = new Set(all ? blocks : (current < tasks.length ? tasks[current].blocks : []));
      taskChildren.forEach(function(child){
        var own = blocks.filter(function(b){ return b.card === child; });
        setOff(child, !own.some(function(b){ return visible.has(b); }));
        own.forEach(function(b){ if(b.els[0] !== child) b.els.forEach(function(e){ setOff(e, !visible.has(b)); }); });
      });
      endCards.forEach(function(ch){ setOff(ch, !all && current < tasks.length); });
      if(!all && current < tasks.length) markSeen(tasks[current]);
      setOff(summary, !all && current < tasks.length);
      placeNav();
      setOff(nav, all);
      setOff(pills, view === "all");
      viewBtn.textContent = view === "all" ? "חזרה לתצוגה לפי משימות" : "📋 הצג את כל השאלות";
      refresh();
      document.dispatchEvent(new CustomEvent("bm-steps-change"));
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
        page: PAGE, title: document.title + (c.title ? " · " + c.title : ""),
        task: Math.min(current, tasks.length - 1) + 1, total: tasks.length,
        finished: totalDone() >= totalNeed(), t: Date.now()
      });
    }

    /* ---------- 8. עדכון התצוגה ---------- */
    function setHeading(small, big){
      heading.textContent = "";
      heading.appendChild(make("span", "bm-of", small));
      heading.appendChild(document.createTextNode(big));
    }

    function refresh(){
      var all = view === "all" || single;

      items.forEach(function(it){
        var u = ui.get(it);
        if(!u) return;
        var s = st(it), t = taskOf(it);
        var textItems = t.items.filter(function(x){ return x.type === "text"; });
        u.pos.textContent = (!all && t) ? "שאלה " + (textItems.indexOf(it) + 1) + " מתוך " + textItems.length : "";
        u.pos.hidden = all;
        var key, text;
        if(s.verdict === "ok"){ key = "ok"; text = "✓ נבדקה: נכונה"; }
        else if(s.verdict === "review"){ key = "review"; text = "↺ נבדקה: דורשת חזרה"; }
        else if(isFilled(it)){ key = s.flag ? "review" : "done"; text = s.flag ? "✓ הושלמה · מסומנת לחזרה" : "✓ הושלמה"; }
        else { key = s.flag ? "review" : "empty"; text = s.flag ? "○ טרם נענתה · מסומנת לחזרה" : "○ טרם נענתה"; }
        u.state.textContent = text;
        u.state.setAttribute("data-state", key);
        u.flag.setAttribute("aria-pressed", String(needsReview(it)));
        if(u.check){
          arr(u.check.querySelectorAll(".bm-verdict")).forEach(function(b){
            b.setAttribute("aria-pressed", String(s.verdict === b.getAttribute("data-verdict")));
          });
        }
      });

      units.forEach(function(u){ if(u.doneEl) u.doneEl.hidden = unitDone(u) < u.need; });

      var tasksDone = 0;
      tasks.forEach(function(t, idx){
        var done = isTaskDone(t);
        if(done) tasksDone++;
        var flagged = t.items.some(needsReview);
        t.pill.classList.toggle("is-done", done);
        t.pill.classList.toggle("has-flag", flagged);
        if(idx === current && view !== "all") t.pill.setAttribute("aria-current", "step"); else t.pill.removeAttribute("aria-current");
        t.pill.setAttribute("aria-label", "משימה " + (idx + 1) + ": " + (t.stage ? STAGE[t.stage].name + " - " : "") + t.title + (done ? (t.need ? " - מולאה" : " - נצפתה") : "") + (flagged ? " - יש בה שאלות לחזרה" : ""));
        t.segFill.style.width = (t.need ? Math.round(taskDone(t) / t.need * 100) : (done ? 100 : 0)) + "%";
      });
      if(current === tasks.length && view !== "all") sumPill.setAttribute("aria-current", "step"); else sumPill.removeAttribute("aria-current");

      // מסלול הלמידה: השלב הנוכחי מודגש, שלב שכל המשימות בו הושלמו - מסומן ✓
      var stageHere = current < tasks.length ? tasks[current].stage : "summary";
      bar.setAttribute("data-bm-now", view === "all" ? "all" : (stageHere || ""));   // assets/site.css (guide): בשאלת בגרות - בלי כפתור "פתיחי משפט"
      pathItems.forEach(function(p){
        var inStage = p.key === "summary" ? tasks : tasks.filter(function(t){ return t.stage === p.key; });
        var done = inStage.every(isTaskDone);
        var here = view !== "all" && p.key === stageHere;
        p.btn.parentElement.classList.toggle("is-done", done);
        if(here) p.btn.setAttribute("aria-current", "step"); else p.btn.removeAttribute("aria-current");
        p.btn.setAttribute("aria-label", "שלב במסלול: " + p.name + (done ? (p.key === "explain" || p.key === "example" ? " - נצפה" : " - מולא") : "") + (here ? " - אתם כאן" : ""));
      });

      // הרבה משימות - מציגים רק את הראשונה, האחרונה ואלה שליד הנוכחית, ולא "קיר" של מספרים
      if(tasks.length > (hasPath ? 5 : 7)){   // עם מסלול למידה - שורת מספרים קצרה יותר
        var prevShown = true, here = Math.min(current, tasks.length - 1);
        tasks.forEach(function(t, idx){
          var show = idx === 0 || idx === tasks.length - 1 || Math.abs(idx - here) <= 1;
          var li = t.pill.parentElement;
          li.hidden = !show;
          li.classList.toggle("bm-gap-before", show && !prevShown);
          prevShown = show;
        });
      }

      var need = totalNeed(), done = totalDone();
      var pct = need ? Math.round(done / need * 100) : 0;
      track.setAttribute("aria-valuenow", String(pct));
      if(single){
        progLabel.textContent = "עניתם על " + done + " מתוך " + need + " שאלות חובה";
        track.setAttribute("aria-valuetext", progLabel.textContent);
      } else {
        progLabel.textContent = "נצפו או מולאו " + tasksDone + " מתוך " + tasks.length + " משימות";
        track.setAttribute("aria-valuetext", progLabel.textContent + ", " + pct + "% משאלות החובה");
      }

      var t0 = tasks[Math.min(current, tasks.length - 1)];
      var noun = t0.rowsOnly ? "שורות בטבלה" : "שאלות";
      var count = t0.rowsOnly ? t0.blocks.filter(function(b){ return b.row; }).length : t0.items.length;
      if(single){
        setHeading(c.title ? c.title : "המשימה בדף הזה", count + " " + noun);
        hint.textContent = t0.need < t0.items.length ? "בחלק מהשאלות אפשר לבחור - מספיק לענות על " + t0.need + "." : "הדף קצר - כל השאלות מוצגות יחד.";
      } else if(view === "all"){
        setHeading("תצוגה מלאה", c.title ? "כל השאלות בנושא " + c.title : "כל השאלות בדף");
        hint.textContent = "השאלות מסודרות לפי המשימות. אפשר לחזור בכל רגע לתצוגה לפי משימות.";
      } else if(current < tasks.length){
        var tc = tasks[current];
        setHeading("משימה " + (current + 1) + " מתוך " + tasks.length + (tc.stage ? " · " + STAGE[tc.stage].name : "") + (c.title ? " · " + c.title : ""), tc.title);
        if(!tc.items.length){
          hint.textContent = STAGE_HINT[tc.stage] || "קראו את הכתוב. כשתסיימו, לחצו \"הבא\".";
        } else {
          hint.textContent = "במשימה הזו " + count + " " + noun +
            (tc.need < tc.items.length && !tc.rowsOnly ? " - בחלקן אפשר לבחור, ומספיק לענות על " + tc.need + "." : ".") +
            " כשתסיימו, לחצו \"הבא\".";
          var extra = STAGE_HINT[tc.stage];
          if(tc.stage === "guided" && window.BM_GUIDE) extra = "בשאלות יש פתיח למשפט ורמזים - השתמשו בהם כשצריך.";
          if(extra) hint.textContent += " " + extra;
        }
      } else {
        setHeading("סוף " + (c.title ? "הנושא" : "הדף"), "סיכום");
        hint.textContent = "כאן רואים מה הושלם, מה נבדק, ומה כדאי לחזור עליו.";
      }

      prevBtn.hidden = current === 0;
      nextBtn.hidden = current >= tasks.length;
      nextBtn.textContent = current === tasks.length - 1 ? "סיימתי - לסיכום ←" : "הבא ←";
      navCount.textContent = current < tasks.length ? "משימה " + (current + 1) + " מתוך " + tasks.length : "";

      // הודעת עידוד כשמשימה הושלמה עכשיו (לא בכל הקלדה)
      if(!single && current < tasks.length){
        var nowDone = taskDone(tasks[current]) >= tasks[current].need;
        if(lastDoneState === false && nowDone) doneMsg.textContent = "✓ כל הכבוד! סיימתם את המשימה הזו.";
        else if(!nowDone) doneMsg.textContent = "";
        lastDoneState = nowDone;
      } else {
        doneMsg.textContent = "";
      }

      renderSummary(tasksDone);
    }

    function describe(it){
      var t = taskOf(it);
      var lbl = it.el.getAttribute("aria-labelledby") ? document.getElementById(it.el.getAttribute("aria-labelledby")) : null;
      if(!lbl && it.el.closest(".question-block")) lbl = it.el.closest(".question-block").querySelector(".q-text");
      var part = it.el.closest(".bagrut-part") ? it.el.closest(".bagrut-part").querySelector(".bagrut-part-label") : null;
      var text = lbl ? cleanText(lbl) : (part ? t.title + " - " + cleanText(part) : (it.el.getAttribute("aria-label") || t.title));
      return shorten((single ? "" : "משימה " + (t.index + 1) + ": ") + text, 100);
    }

    function renderSummary(tasksDone){
      var checked = 0, ok = 0, review = [];
      items.forEach(function(it){
        var s = st(it);
        if(s.verdict) checked++;
        if(s.verdict === "ok") ok++;
        if(needsReview(it)) review.push(it);
      });
      stats.textContent = "";
      function stat(label, value, cls){
        var box = make("div", "bm-stat" + (cls ? " " + cls : ""));
        box.appendChild(make("dt", "", label));
        box.appendChild(make("dd", "", value));
        stats.appendChild(box);
      }
      stat("הושלמו", totalDone() + " מתוך " + totalNeed() + " שאלות חובה", "is-done");
      if(!single) stat("משימות שנצפו או מולאו", tasksDone + " מתוך " + tasks.length);
      if(hasSelfCheck || hasMc){
        stat("נבדקו", String(checked));
        stat("נכונות", String(ok), "is-ok");
      }
      if(hasFlag || hasMc) stat("דורשות חזרה", String(review.length), "is-review");

      reviewWrap.textContent = "";
      if(review.length){
        reviewWrap.appendChild(make("h3", "bm-review-title", "שאלות שכדאי לחזור עליהן"));
        var list = make("ul", "bm-review-list");
        review.forEach(function(it){
          var li = make("li");
          var b = make("button", "bm-review-go", describe(it));
          b.type = "button";
          b.addEventListener("click", function(){
            var t = taskOf(it);
            if(!single && view !== "all") go(t.index, false);
            var target = it.type === "mc" ? it.el.querySelector("input") : it.el;
            if(target) target.focus();
          });
          li.appendChild(b); list.appendChild(li);
        });
        reviewWrap.appendChild(list);
      }
      var notes = [];
      if(hasSelfCheck) notes.push("\"נבדקה\" פירושו שהשוויתם את התשובה שלכם לתשובה שבדף (בכפתור \"הצג תשובה\") וסימנתם אם היא נכונה.");
      if(hasMc) notes.push("שאלות הבחירה נבדקות אוטומטית; תשובה לא נכונה מסומנת לחזרה.");
      if(!hasSelfCheck && !hasMc && hasFlag) notes.push("בדף הזה אין תשובות לבדיקה עצמית - המורה יבדוק את התשובות. אפשר לסמן שאלות שתרצו לחזור עליהן.");
      sumNote.textContent = notes.join(" ");
    }

    return {
      root: root,
      apply: apply,
      refresh: refresh,
      saveLast: saveLast,
      totalNeed: totalNeed,
      totalDone: totalDone,
      atEnd: function(){ return single || view === "all" || current >= tasks.length - 1 || totalDone() >= totalNeed(); },
      owns: function(el){ return grid.contains(el); },
      afterClear: function(){
        if(!items.some(isFilled)){ status = {}; save(KEY_STATUS, status); }
        refresh();
      }
    };
  }
})();
