/* כפתור "הצג תשובה" גנרי - הופך את תיבת ה-hint-box הסמוכה לגלויה/מוסתרת.
   משמש בעיקר עבור בלוקי שאלות בגרות אמיתיות (bagrut-block), שאין להן
   textarea לתשובת תלמיד - רק שאלה מקורית וכפתור לצפייה בדגם התשובה. */
(function(){
  "use strict";
  document.querySelectorAll(".hint-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      var box = btn.nextElementSibling;
      if(!box) return;
      var showing = box.hidden;
      box.hidden = !showing;
      btn.textContent = showing ? "🙈 הסתר תשובה" : "🔎 הצג תשובה";
    });
  });
})();
