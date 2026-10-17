/* ============================================================
   בדיקה אוטומטית בשליחה למורה
   ============================================================
   בדפים שיש בהם תשובה אחת נכונה (שורש, בניין, גזרה, משקל, מבחן
   אמריקאי), נספר כמה תשובות נכונות - לפי אותם כללים שהדף עצמו בודק
   בהם - והתוצאה נשלחת למורה יחד עם ההגשה (assets/direct-submit.js).
   הספירה לא מסמנת כלום על המסך של התלמיד.
   שאלה שלא נענתה נספרת כשגויה.

   מקורות הספירה:
   1. מבחן אמריקאי: כל ‎.mc-group‎ שיש בו ‎.mc-option[data-correct="true"]‎
   2. דפים עם CORRECT_ANSWERS ו-checkAnswer() בתוך הדף - נבדק עותק של
      השדה, כדי שהסימון ירוק/אדום לא יופיע אצל התלמיד
   3. בודקים שמוסיפים את עצמם ל-window.BM_SCORERS
      (assets/gzara-bagrut.js, assets/mishkal-answer-check.js)
   ============================================================ */
(function(){
  "use strict";
  window.BM_SCORERS = window.BM_SCORERS || [];

  /* דף שמסמן חלק לשליחה (data-submit-scope, למשל שאלות הבגרות ביחידות העברית) -
     נספר רק מה שבתוכו. בלי סימון - כל הדף */
  function inScope(el){
    var sc = document.querySelectorAll("[data-submit-scope]");
    if(!sc.length) return true;
    return Array.prototype.some.call(sc, function(s){ return s.contains(el); });
  }

  function mcScore(){
    var groups = Array.prototype.filter.call(document.querySelectorAll(".mc-group"), function(g){
      return g.querySelector('.mc-option[data-correct="true"]') && inScope(g);
    });
    var correct = 0;
    groups.forEach(function(g){
      var checked = g.querySelector('input[type="radio"]:checked');
      var opt = checked && checked.closest(".mc-option");
      if(opt && opt.getAttribute("data-correct") === "true") correct++;
    });
    return { correct:correct, total:groups.length };
  }

  function inlineScore(){
    if(typeof CORRECT_ANSWERS === "undefined" || typeof checkAnswer !== "function") return null;
    var keys = CORRECT_ANSWERS;
    var fields = Array.prototype.filter.call(document.querySelectorAll("input[data-id], textarea[data-id], select[data-id]"), function(f){
      return Object.prototype.hasOwnProperty.call(keys, f.getAttribute("data-id")) && inScope(f);
    });
    var correct = 0;
    fields.forEach(function(f){
      /* עותק מנותק של השדה, עם מקום לסימן אחריו - הבדיקה של הדף רצה עליו ולא על השדה האמיתי */
      var wrap = document.createElement("div");
      var copy = f.cloneNode(true);
      copy.removeAttribute("id");
      copy.value = f.value;
      wrap.appendChild(copy);
      wrap.appendChild(document.createElement("span"));
      try{ if(checkAnswer(copy) === true) correct++; }catch(e){}
    });
    return { correct:correct, total:fields.length };
  }

  window.BM_AUTOSCORE = function(){
    var correct = 0, total = 0;
    [mcScore, inlineScore].concat(window.BM_SCORERS).forEach(function(fn){
      try{
        var r = fn();
        if(r && r.total > 0){ correct += r.correct; total += r.total; }
      }catch(e){}
    });
    return total ? { correct:correct, total:total } : null;
  };
})();
