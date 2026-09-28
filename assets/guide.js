/* ============================================================
   בית המדרש הדיגיטלי - עזרים בלמידה (שלב ג׳)
   ============================================================
   - פתיח למשפט לכל שאלה. כפתור אחד מסתיר / מציג את כל הפתיחים
     (הבחירה נשמרת במכשיר).
   - רמזים מדורגים: רמז קטן ← מילת מפתח ← מבנה התשובה ← התשובה המלאה
     (כפתור "הצג תשובה" הקיים בדף).
   - "פירוק השאלה" מתחת לכל שאלת בגרות: מה שואלים, כמה חלקים,
     מילות ההוראה, מה חייב להופיע בתשובה, וניקוד - רק אם הוא כתוב
     בשאלון עצמו. לא ממציאים חלוקת נקודות.
   - תשובות: הפרדה בולטת בין "תשובת המחוון הרשמית" ל"תשובה אפשרית",
     והתשובה מוצגת כנקודות. המילים עצמן לא משתנות - הטקסט המקורי
     נשאר בדף (מוסתר), ורק מוצג מחולק לשורות.
   - בשלב "מנסים לבד" (מסלול הלמידה, assets/steps.js) אין פתיח ורמזים.

   התוכן של כל דף (פתיחים, רמזים, פירוק) נמצא בקובץ נפרד -
   assets/guide/<שם הדף>.js - כדי שיהיה קל לבדוק ולתקן אותו:
     window.BM_GUIDE = { items: { "<data-id>": {
       starter: "לפי ספר החינוך, המצווה היא...",
       hints: ["רמז קטן", "מילת מפתח", "מבנה התשובה"],
       breakdown: { what: "...", parts: "...", must: "..." } } } };
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
    if(box.hasAttribute("data-bm-ready")) return;
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
     2. פירוק שאלת בגרות
     ============================================================ */
  var WORDS = [
    [/הסבירו/, "הסבירו", "לכתוב במילים שלכם למה או איך - לא רק להעתיק."],
    [/ציינו/, "ציינו", "לכתוב בקצרה, בלי הסבר ארוך."],
    [/הביאו ראי/, "הביאו ראיה", "להביא מהכתוב מילים או פרט שמוכיחים את התשובה."],
    [/בססו/, "בססו", "להראות מאיפה בכתוב לקחתם את התשובה - עם ציטוט."],
    [/העתיקו/, "העתיקו", "לכתוב מילה במילה מתוך הכתוב, בתוך מירכאות."],
    [/הוכיחו/, "הוכיחו", "להראות בעזרת פרט מהכתוב שהטענה נכונה."],
    [/ניגוד|הבדל|השוו|דמיון/, "השוואה", "לכתוב על שני הצדדים: מה בצד אחד, ומה בצד השני."],
    [/תארו/, "תארו", "לספר מה קרה, לפי הסדר."],
    [/נמקו|מדוע/, "מדוע / נמקו", "לכתוב את הסיבה."],
    [/בלשונכם/, "בלשונכם", "במילים שלכם, לא בהעתקה."],
    [/עיינו/, "עיינו", "קודם לקרוא את מה שצוין - התשובה נמצאת שם."],
    [/"נכון"|נכון" או "לא נכון/, "נכון / לא נכון", "לכתוב ליד כל היגד אם הוא נכון או לא נכון."],
    [/(?:על פי|לפי) (?:מה ש|פירוש ש)למדתם/, "על פי מה שלמדתם", "אפשר לענות לפי פירוש שלמדתם בכיתה - מספיק פירוש אחד."],
    [/(?:על פי|לפי) (?:המשך )?(?:דברי )?(?:בעל )?ספר החינוך/, "על פי ספר החינוך", "התשובה צריכה להיות לפי מה שכתוב בספר החינוך - לא לפי דעה אחרת."],
    [/(?:על פי|לפי) (?:פרק [א-ת]׳?)/, "על פי הפרק", "התשובה צריכה להיות מתוך הפרק שצוין בלבד."]
  ];

  function questionText(f){
    var part = f.closest(".bagrut-part");
    if(part){
      var c = part.cloneNode(true);
      arr(c.querySelectorAll(".bagrut-part-label, textarea, input, button, .hint-box")).forEach(function(x){ x.remove(); });
      arr(c.querySelectorAll("*")).forEach(function(x){ if(/(^|\s)bm-/.test(x.className || "") && x.parentNode) x.remove(); });
      return norm(c.textContent);
    }
    var qb = f.closest(".question-block");
    var q = qb && qb.querySelector(".q-text");
    return q ? norm(q.textContent) : "";
  }

  // ניקוד - רק אם כתוב בשאלון. "(8 נקודות)" בסוף סעיף א(2) הוא הניקוד שכתוב לסעיף א׳
  function pointsFor(f){
    var qb = f.closest(".question-block");
    var lbl = qb && qb.querySelector(".part-label");
    var letter = lbl ? norm(lbl.textContent).charAt(0) : null;
    function pts(el){ var m = norm(el && el.textContent).match(/\((\d+)\s*נקודות\)/); return m ? m[1] : null; }
    if(qb && letter){
      var group = [qb], s;
      for(s = qb.previousElementSibling; s && !s.classList.contains("exam-tag"); s = s.previousElementSibling){ if(s.classList.contains("question-block")) group.unshift(s); }
      for(s = qb.nextElementSibling; s && !s.classList.contains("exam-tag"); s = s.nextElementSibling){ if(s.classList.contains("question-block")) group.push(s); }
      group = group.filter(function(q){ var l = q.querySelector(".part-label"); return l && norm(l.textContent).charAt(0) === letter; });
      for(var i = 0; i < group.length; i++){
        var n = pts(group[i].querySelector(".q-text"));
        if(n){
          if(group.length === 1) return n + " נקודות (כך כתוב בשאלון).";
          return "בשאלון כתוב (" + n + " נקודות) בסוף סעיף " + letter + "׳. איך הנקודות מתחלקות בין החלקים של הסעיף - לא כתוב בשאלון.";
        }
      }
      return null;
    }
    var own = questionText(f).match(/\((\d+)\s*נקודות\)/);
    return own ? own[1] + " נקודות (כך כתוב בשאלון)." : null;
  }

  var NUM_WORDS = { "שני": 2, "שתי": 2, "שלושה": 3, "שלוש": 3, "ארבעה": 4, "ארבע": 4 };
  function autoParts(text){
    // רשימת היגדים או מקרים ("לפניכם חמישה היגדים...") - המספרים אינם חלקי תשובה, ולא מנחשים
    if(/היגד/.test(text) || /לפניכם\s+\S+\s+(מקרים|מצבים|משפטים)/.test(text)) return null;
    var nums = text.match(/(?:^|\s)[1-9]\.\s/g);
    if(nums && nums.length >= 2) return nums.length + " חלקים (ממוספרים " + nums.map(function(x){ return norm(x).replace(".", ""); }).join(", ") + ").";
    // "ציינו שני הבדלים" - כמה פריטים צריך לכתוב
    var m = text.match(/(?:ציינו|כתבו|הביאו|הסבירו|הציגו|תארו|העתיקו|מנו|מהם|מהן)\s+(?:[^\s]+\s+){0,2}?(שני|שתי|שלושה|שלוש|ארבעה|ארבע)\s+([א-ת"׳'״-]+)/);
    if(m) return "צריך לכתוב " + NUM_WORDS[m[1]] + ": \"" + m[1] + " " + m[2] + "\".";
    return null;
  }

  function addBreakdown(f, d){
    var text = questionText(f);
    var b = d.breakdown || {};
    var rows = [];
    if(b.what) rows.push(["מה שואלים?", b.what]);
    var parts = b.parts || autoParts(text);
    if(parts) rows.push(["כמה חלקים?", parts]);
    var words = [];
    WORDS.forEach(function(w){ if(w[0].test(text) && !words.some(function(x){ return x[0] === w[1]; })) words.push([w[1], w[2]]); });
    if(words.length) rows.push(["מילות ההוראה", words]);
    if(b.must) rows.push(["מה חייב להופיע בתשובה?", b.must]);
    var points = pointsFor(f);
    if(points) rows.push(["ניקוד", points]);
    if(!rows.length) return;

    var wrap = make("div", "bm-breakdown");
    var btn = make("button", "bm-breakdown-btn", "🧩 פירוק השאלה - מה בדיוק צריך לעשות?");
    btn.type = "button";
    var panel = make("div", "bm-breakdown-panel");
    panel.id = newId("bd");
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", panel.id);
    var dl = make("dl", "bm-bd-list");
    rows.forEach(function(r){
      var row = make("div", "bm-bd-row");
      row.appendChild(make("dt", "", r[0]));
      var dd = make("dd");
      if(Array.isArray(r[1])){
        var ul = make("ul", "bm-bd-words");
        r[1].forEach(function(w){
          var li = make("li");
          li.appendChild(make("b", "", w[0]));
          li.appendChild(document.createTextNode(" - " + w[1]));
          ul.appendChild(li);
        });
        dd.appendChild(ul);
      } else {
        dd.textContent = r[1];
      }
      row.appendChild(dd);
      dl.appendChild(row);
    });
    panel.appendChild(dl);
    wrap.appendChild(btn); wrap.appendChild(panel);
    btn.addEventListener("click", function(){
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
    f.insertAdjacentElement("beforebegin", wrap);
  }

  /* ============================================================
     3. פתיח למשפט
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
     4. רמזים מדורגים
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
     5. לכל שאלה: פירוק (בבגרות), פתיח, רמזים
     ============================================================ */
  // שאלת בגרות: בתוך שאלה מבחינה (.bagrut-block), בשלב "שאלת בגרות" של מסלול הלמידה,
  // אחרי תגית שנת בחינה (.exam-tag), או שאלה שנפתחת במילים "שאלת בגרות"
  function isBagrut(f, stage){
    if(f.closest(".bagrut-part, .bagrut-block") || stage === "bagrut") return true;
    var qb = f.closest(".question-block");
    if(!qb) return false;
    for(var s = qb.previousElementSibling; s; s = s.previousElementSibling){ if(s.classList.contains("exam-tag")) return true; }
    var q = qb.querySelector(".q-text");
    return !!q && /^שאלת בגרות/.test(norm(q.textContent));
  }
  var anyStarter = false;
  arr(main.querySelectorAll("textarea.answer")).forEach(function(f){
    var id = f.getAttribute("data-id");
    var d = (id && ITEMS[id]) || {};
    var host = f.closest("[data-bm-stage]");
    var stage = host ? host.getAttribute("data-bm-stage") : null;
    if(isBagrut(f, stage)) addBreakdown(f, d);
    if(stage === "open") return;
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
