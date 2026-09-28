/* ============================================================
   בית המדרש הדיגיטלי - עזרים בלמידה (שלב ג׳)
   ============================================================
   - פתיח למשפט לכל שאלה. כפתור אחד מסתיר / מציג את כל הפתיחים
     (הבחירה נשמרת במכשיר).
   - רמזים מדורגים: רמז קטן ← מילת מפתח ← מבנה התשובה ← התשובה המלאה
     (כפתור "הצג תשובה" הקיים בדף).
   - שאלות בגרות נשארות נקיות (בקשת המורה): רק השאלה, תיבת תשובה
     וכפתור "הצג תשובה". אין פתיח, רמזים, "פירוק שאלה" או תווית
     מחוון, והתשובה מוצגת כפי שהיא כתובה בדף.
   - תשובות (בשאר השאלות): הפרדה בולטת בין "תשובת המחוון הרשמית" ל"תשובה אפשרית",
     והתשובה מוצגת כנקודות. המילים עצמן לא משתנות - הטקסט המקורי
     נשאר בדף (מוסתר), ורק מוצג מחולק לשורות.
   - בשלב "מנסים לבד" (מסלול הלמידה, assets/steps.js) אין פתיח ורמזים.

   התוכן של כל דף (פתיחים, רמזים) נמצא בקובץ נפרד -
   assets/guide/<שם הדף>.js - כדי שיהיה קל לבדוק ולתקן אותו:
     window.BM_GUIDE = { items: { "<data-id>": {
       starter: "לפי ספר החינוך, המצווה היא...",
       hints: ["רמז קטן", "מילת מפתח", "מבנה התשובה"],
       breakdown: { ... } } } };   // breakdown - כבר לא מוצג בדף
   סוג התשובה: data-answer-kind="official|suggested" על כרטיס (או על
   main); כותרת "תשובה מוצעת" / "תשובה אפשרית" בתיבת התשובה גוברת תמיד.
   העיצוב ב-assets/guide.css.
   ============================================================ */
(function(){
  "use strict";

  var DATA = window.BM_GUIDE || {};
  var ITEMS = DATA.items || {};
  var PAGE = location.pathname.split("/").pop() || "index.html";
  var KEY_STARTERS = "bm-guide-starters";
  var KEY_HINTS = "bm-guide-hints:" + PAGE;
  var LEVELS = ["רמז קטן", "מילת מפתח", "מבנה התשובה"];

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
  function norm(t){ return (t || "").replace(/\s+/g, " ").trim(); }
  var uid = 0;
  function newId(p){ uid++; return "bmg-" + p + "-" + uid; }

  var main = document.querySelector("main");
  if(!main) return;

  /* ============================================================
     0. שאלות בגרות - בלי תוספות
     ============================================================ */
  // שאלת בגרות: בתוך שאלה מבחינה (.bagrut-block), בשלב "שאלת בגרות" של מסלול הלמידה,
  // אחרי תגית שנת בחינה (.exam-tag), או שאלה שנפתחת במילים "שאלת בגרות".
  // (אותו כלל ב-assets/steps.js, שם - בלי שורת מצב ובדיקה עצמית)
  function isBagrut(f){
    var host = f.closest("[data-bm-stage]");
    if(f.closest(".bagrut-part, .bagrut-block") || (host && host.getAttribute("data-bm-stage") === "bagrut")) return true;
    var qb = f.closest(".question-block");
    if(!qb) return false;
    for(var s = qb.previousElementSibling; s; s = s.previousElementSibling){ if(s.classList.contains("exam-tag")) return true; }
    var q = qb.querySelector(".q-text");
    return !!q && /^שאלת בגרות/.test(norm(q.textContent));
  }
  arr(main.querySelectorAll("textarea.answer")).forEach(function(f){
    if(!isBagrut(f)) return;
    f.setAttribute("data-bm-bagrut", "1");
    for(var s = f.nextElementSibling; s; s = s.nextElementSibling){
      if(s.classList.contains("hint-box")){ s.setAttribute("data-bm-bagrut", "1"); break; }
      if(s.matches("textarea, input, .question-block")) break;
    }
  });

  /* ============================================================
     1. תשובות: מחוון רשמי / תשובה אפשרית, ותשובה כנקודות
     ============================================================ */
  // תיבה בלי כותרת "✓ ..." - לא מסמנים. "תשובה מוצעת/אפשרית" - תמיד אפשרית.
  // "דגם התשובה" - בדפי לקט המצוות כתוב במפורש שזה "דגם התשובה הרשמי".
  // כל השאר - תשובה אפשרית, אלא אם הכרטיס (או הדף) מסומן data-answer-kind="official".
  function answerKind(box, label){
    if(!label) return null;
    var lt = label.textContent;
    if(/מוצעת|אפשרית/.test(lt)) return "suggested";
    var host = box.closest("[data-answer-kind]");
    if(host) return host.getAttribute("data-answer-kind");
    if(/דגם|מחוון/.test(lt)) return "official";
    return DATA.answers || "suggested";
  }

  // מחלקים את נוסח התשובה לשורות - בלי לשנות אף מילה
  function splitAnswer(text){
    var t = text;
    t = t.replace(/\(\s*((?:או|אפשר גם|אפשרות נוספת)\s*:[^()]*)\)/g, "\u0001$1\u0001");
    t = t.replace(/\s*(הערה למעריכים:)/g, "\u0001$1");
    var numbered = /(?:^|\s)1\.\s/.test(t) && /\s2\.\s/.test(t);
    if(numbered){
      t = t.replace(/(^|\s)([1-9])\.\s/g, "\u0001$2. ");
    } else {
      t = t.replace(/;\s+/g, ";\u0001");
      t = t.replace(/([.!?])\s+(?=[א-ת"'״(])/g, "$1\u0001");
    }
    var out = [];
    t.split("\u0001").map(norm).filter(Boolean).forEach(function(p){
      // שארית קצרה (למשל משבירת שורות של PDF) מצטרפת לשורה שלפניה
      if(out.length && p.length < 12 && !/^[1-9]\.\s/.test(p)) out[out.length - 1] += " " + p;
      else out.push(p);
    });
    return out;
  }

  function bulletize(box, label){
    var nodes = arr(box.childNodes).filter(function(n){
      return n !== label && !(n.nodeType === 1 && /(^|\s)bm-/.test(n.className || ""));
    });
    if(nodes.some(function(n){ return n.nodeType === 1 && !/^(P|BR|Q|I|EM|STRONG|B|SPAN)$/.test(n.tagName); })) return;
    var pieces = splitAnswer(norm(nodes.map(function(n){ return n.textContent; }).join(" ")));
    if(pieces.length < 2) return;
    var list = make("ul", "bm-answer-list");
    pieces.forEach(function(p){
      var li = make("li", "", p);
      if(/^[1-9]\.\s/.test(p)) li.className = "is-num";
      else if(/^(או|אפשר גם|אפשרות נוספת)\s*:/.test(p)) li.className = "is-alt";
      else if(/^הערה למעריכים:/.test(p)) li.className = "is-note";
      list.appendChild(li);
    });
    var orig = make("div", "bm-answer-orig");
    orig.hidden = true;   // הנוסח המקורי נשאר בדף כפי שהוא
    nodes.forEach(function(n){ orig.appendChild(n); });
    box.appendChild(list);
    box.appendChild(orig);
  }

  function prepareAnswer(box){
    if(box.hasAttribute("data-bm-ready") || box.hasAttribute("data-bm-bagrut")) return;
    box.setAttribute("data-bm-ready", "1");
    var first = box.firstElementChild;
    var label = first && first.tagName === "B" && /✓/.test(first.textContent) && box.firstChild === first ? first : null;
    if(!label && first && first.tagName === "B" && /✓/.test(first.textContent) && !norm(box.firstChild.textContent)) label = first;
    var kind = answerKind(box, label);
    if(kind === "official" || kind === "suggested"){
      box.setAttribute("data-kind", kind);
      var head = make("div", "bm-answer-head");
      head.setAttribute("data-kind", kind);
      head.appendChild(make("span", "bm-answer-badge", kind === "official" ? "✅ תשובת המחוון הרשמית" : "💡 תשובה אפשרית"));
      head.appendChild(make("span", "bm-answer-sub", kind === "official" ? "כך כתוב במחוון של הבחינה" : "תשובה לדוגמה - לא מהמחוון הרשמי"));
      box.insertBefore(head, box.firstChild);
      if(label) label.classList.add("bm-label-replaced");
    }
    if(label) bulletize(box, label);
  }
  arr(main.querySelectorAll(".hint-box")).forEach(prepareAnswer);

  // כפתור "הצג תשובה" בשאלה שנוספה לדף שאין בו סקריפט משלו לכך
  main.addEventListener("click", function(e){
    var b = e.target && e.target.closest ? e.target.closest("button[data-bm-toggle]") : null;
    if(!b) return;
    var box = b.nextElementSibling;
    if(!box || !box.classList.contains("hint-box")) return;
    box.hidden = !box.hidden;
    b.textContent = box.hidden ? "🔎 הצג תשובה" : "🙈 הסתר תשובה";
  });

  /* ============================================================
     2. פתיח למשפט
     ============================================================ */
  var startersOn = load(KEY_STARTERS, true) !== false;

  // כל "..." בפתיח = מקום להשלים. בתיבה: כל חלק בשורה משלו, והסמן בסוף השורה הראשונה
  function starterLines(s){
    var lines = s.split(/…|\.\.\./).map(norm);
    if(lines.length > 1 && !lines[lines.length - 1]) lines.pop();
    // רווח אחרי מילה שלמה; בלי רווח אחרי אות שמתחברת למילה הבאה ("הסיבה היא ש")
    return lines.map(function(l){ return /(^|\s)(ש|כש|מש|וש|ב|ל|מ|ה|ו|כ)$/.test(l) ? l : l + " "; });
  }

  function addStarter(f, s){
    var box = make("div", "bm-starter");
    box.appendChild(make("span", "bm-starter-label", "💬 אפשר להתחיל כך:"));
    var txt = make("span", "bm-starter-text", s);
    txt.id = newId("st");
    box.appendChild(txt);
    var copy = make("button", "bm-starter-copy", "✍️ העתיקו לתיבה");
    copy.type = "button";
    copy.setAttribute("aria-describedby", txt.id);
    var msg = make("span", "bm-starter-msg");
    msg.setAttribute("role", "status");
    box.appendChild(copy); box.appendChild(msg);
    copy.addEventListener("click", function(){
      if(norm(f.value)){
        msg.textContent = "בתיבה כבר כתוב משהו, ולכן הפתיח לא הועתק.";
        return;
      }
      var lines = starterLines(s);
      f.value = lines.join("\n");
      f.dispatchEvent(new Event("input", { bubbles: true }));   // שמירה אוטומטית ומד ההתקדמות
      msg.textContent = "";
      f.focus();
      var caret = lines[0].length;
      try{ f.setSelectionRange(caret, caret); }catch(e){ /* אין תמיכה */ }
    });
    f.insertAdjacentElement("beforebegin", box);
  }

  /* ============================================================
     3. רמזים מדורגים
     ============================================================ */
  var hintLevel = load(KEY_HINTS, {}) || {};

  function addHints(f, id, hints){
    var parent = f.parentElement;
    var answerBtn = null;
    for(var s = f.nextElementSibling; s; s = s.nextElementSibling){
      if(s.classList.contains("hint-btn")){ answerBtn = s; break; }
      if(s.matches("textarea, input, .question-block")) break;
    }
    var wrap = make("div", "bm-hints");
    var list = make("ol", "bm-hint-list");
    list.id = newId("hl");
    list.setAttribute("aria-live", "polite");
    var more = make("button", "bm-hint-more");
    more.type = "button";
    more.setAttribute("aria-controls", list.id);
    var end = make("p", "bm-hint-end");
    var reset = make("button", "bm-hint-reset", "הסתירו את הרמזים");
    reset.type = "button";
    wrap.appendChild(more); wrap.appendChild(list); wrap.appendChild(end); wrap.appendChild(reset);

    function render(){
      var lvl = Math.min(hintLevel[id] || 0, hints.length);
      list.textContent = "";
      for(var i = 0; i < lvl; i++){
        var li = make("li");
        li.appendChild(make("b", "", (LEVELS[i] || "רמז") + ": "));
        li.appendChild(document.createTextNode(hints[i]));
        list.appendChild(li);
      }
      list.hidden = lvl === 0;
      more.hidden = lvl >= hints.length;
      more.textContent = lvl === 0 ? "💡 רמז קטן" : "💡 עוד רמז: " + (LEVELS[lvl] || "רמז נוסף");
      end.hidden = lvl < hints.length;
      end.textContent = answerBtn
        ? "זה היה הרמז האחרון. עדיין קשה? אפשר ללחוץ על \"הצג תשובה\"."
        : "אלה כל הרמזים. בדף הזה אין תשובה מלאה - המורה יבדוק את מה שכתבתם.";
      reset.hidden = lvl === 0;
    }
    more.addEventListener("click", function(){
      hintLevel[id] = Math.min((hintLevel[id] || 0) + 1, hints.length);
      save(KEY_HINTS, hintLevel);
      render();
    });
    reset.addEventListener("click", function(){
      hintLevel[id] = 0;
      save(KEY_HINTS, hintLevel);
      render();
      more.focus();
    });
    render();

    if(answerBtn) parent.insertBefore(wrap, answerBtn);
    else {
      var after = f.nextElementSibling && f.nextElementSibling.classList.contains("bm-qstatus") ? f.nextElementSibling : f;
      after.insertAdjacentElement("afterend", wrap);
    }
  }

  /* ============================================================
     4. לכל שאלה (חוץ משאלות בגרות): פתיח, רמזים
     ============================================================ */
  var anyStarter = false;
  arr(main.querySelectorAll("textarea.answer")).forEach(function(f){
    var id = f.getAttribute("data-id");
    var d = (id && ITEMS[id]) || {};
    var host = f.closest("[data-bm-stage]");
    var stage = host ? host.getAttribute("data-bm-stage") : null;
    if(f.hasAttribute("data-bm-bagrut") || stage === "open") return;
    if(d.starter){ addStarter(f, d.starter); anyStarter = true; }
    if(d.hints && d.hints.length) addHints(f, id, d.hints);
  });

  /* ---------- כפתור אחד שמסתיר / מציג את כל פתיחי המשפט ---------- */
  function syncStarters(){
    document.documentElement.classList.toggle("bm-no-starters", !startersOn);
    arr(document.querySelectorAll(".bm-tool-starters")).forEach(function(b){ b.setAttribute("aria-pressed", String(startersOn)); });
  }
  if(anyStarter){
    var bars = arr(document.querySelectorAll(".bm-taskbar"));
    var targets = bars.length ? bars : [main.querySelector(".grid") || main.firstElementChild];
    targets.forEach(function(t){
      if(!t) return;
      var tools = make("div", "bm-tools");
      var b = make("button", "bm-tool-starters", "💬 פתיחי משפט");
      b.type = "button";
      b.addEventListener("click", function(){
        startersOn = !startersOn;
        save(KEY_STARTERS, startersOn);
        syncStarters();
      });
      tools.appendChild(b);
      if(bars.length) t.appendChild(tools); else t.parentElement.insertBefore(tools, t);
    });
  }
  syncStarters();
})();
