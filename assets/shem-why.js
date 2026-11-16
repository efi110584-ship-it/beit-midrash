/* כפתורי "💡 למה?" בדפי תצורת השם: לחיצה פותחת / סוגרת את שורת ההסבר שמתחת למילה.
   השורה שמתחת (tr.why-row) מוסתרת ב-hidden; הכפתור מחזיק aria-expanded. */
(function(){
  "use strict";
  document.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest(".why-btn") : null;
    if(!b) return;
    var tr = b.closest("tr");
    var row = tr && tr.nextElementSibling;
    if(!row || !row.classList.contains("why-row")) return;
    var open = row.hidden;
    row.hidden = !open;
    b.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
