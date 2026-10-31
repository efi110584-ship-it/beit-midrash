/* ספירה לאחור לבגרות - ממלא את מספר הימים בכל .bc-item[data-date] */
(function(){
  var items = document.querySelectorAll(".bagrut-countdown .bc-item[data-date]");
  if(!items.length) return;
  var now = new Date();
  var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  for(var i = 0; i < items.length; i++){
    var it = items[i];
    var p = String(it.getAttribute("data-date")).split("-");
    var exam = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    var d = Math.round((exam - today) / 86400000);
    var num = it.querySelector(".bc-num"), unit = it.querySelector(".bc-unit");
    if(!num || !unit) continue;
    if(d > 1){ num.textContent = d; unit.textContent = "ימים"; }
    else if(d === 1){ num.textContent = "מחר"; unit.textContent = ""; it.classList.add("bc-soon"); }
    else if(d === 0){ num.textContent = "היום"; unit.textContent = "בהצלחה!"; it.classList.add("bc-soon"); }
    else { it.hidden = true; }
    if(d > 1 && d <= 14) it.classList.add("bc-soon");
  }
  var box = document.querySelector(".bagrut-countdown");
  if(box && !box.querySelector(".bc-item:not([hidden])")) box.hidden = true;
})();
