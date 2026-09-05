/* ============================================================
   מעקב התקדמות משותף לדף הבית ("המשך ללמוד")
   ============================================================
   סקריפט קטן ועצמאי שמתווסף לכל דף עבודה, בלי לגעת במנגנון
   השמירה הפרטי של אותו דף (STORAGE_KEY/localStorage משלו נשארים
   בדיוק כפי שהיו). כל מה שהוא עושה הוא לעקוב כמה שדות מולאו,
   ולשמור רשומה קטנה ומשותפת שדף הבית קורא כדי להציג כרטיס
   "המשך ללמוד" לדף האחרון שבו התלמיד התקדם.
   ============================================================ */
(function(){
  "use strict";
  var REGISTRY_KEY = "site-progress-v1";

  function currentTitle(){
    var h1 = document.querySelector("header h1");
    return (h1 && h1.textContent.trim()) || document.title || location.pathname;
  }

  function computePercent(){
    var fields = document.querySelectorAll(".answer");
    if(!fields.length) return null;
    var filled = 0;
    fields.forEach(function(f){ if(f.value && f.value.trim().length > 0) filled++; });
    return Math.round((filled / fields.length) * 100);
  }

  function save(){
    var percent = computePercent();
    if(percent === null) return;
    try{
      var raw = localStorage.getItem(REGISTRY_KEY);
      var registry = raw ? JSON.parse(raw) : {};
      registry[location.pathname.split("/").pop()] = {
        title: currentTitle(),
        percent: percent,
        updatedAt: Date.now()
      };
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
    }catch(e){ /* אחסון חסום בדפדפן - פשוט מדלגים */ }
  }

  var timer = null;
  document.addEventListener("input", function(e){
    if(!e.target || !e.target.classList || !e.target.classList.contains("answer")) return;
    clearTimeout(timer);
    timer = setTimeout(save, 700);
  });

  // רישום ראשוני (גם בלי הקלדה), כדי שדף שכבר נטען עם תשובות שמורות ייספר
  window.addEventListener("load", function(){ setTimeout(save, 500); });
})();
