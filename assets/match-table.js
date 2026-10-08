/* ============================================================
   משחק התאמה מתוך טבלת סיכום.
   כל <table data-match-game> הופכת למשחק: התלמיד מקיש על "מה נאמר
   או נעשה" ואז על "המשמעות" המתאימה. בסיום (או בבקשה) מוצגת הטבלה
   המלאה. בלי JavaScript ובהדפסה - הטבלה מוצגת כרגיל.
   שורה בטבלה: [מרכיב, מה נאמר או נעשה, המשמעות].
   עיצוב: assets/site.css (".mm-").
   ============================================================ */
(function(){
  "use strict";

  function shuffle(list){
    var a = list.slice(), i, j, t;
    do {
      for(i = a.length - 1; i > 0; i--){ j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    } while(a.length > 2 && a.every(function(x, k){ return x === list[k]; }));
    return a;
  }

  function el(tag, cls, html){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(html != null) n.innerHTML = html;
    return n;
  }

  function init(table){
    var wrap = table.closest(".table-wrap") || table;
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr")).map(function(tr, i){
      var c = tr.cells;
      return { id: i, title: c[0].innerHTML, said: c[1].innerHTML, meaning: c[2].innerHTML };
    });
    if(rows.length < 2) return;

    var game = el("div", "mm-game");
    game.innerHTML =
      '<p class="mm-intro">🧩 <b>משחק התאמה:</b> הקישו על מה שנאמר או נעשה בטקס, ואחר כך על המשמעות שלו.</p>' +
      '<div class="mm-bar"><span class="mm-stat">✓ <b class="mm-done">0</b> / ' + rows.length + '</span>' +
      '<span class="mm-stat">ניסיונות: <b class="mm-tries">0</b></span>' +
      '<button type="button" class="mm-link mm-show">הצגת הטבלה המלאה</button></div>' +
      '<p class="mm-feedback" role="status" aria-live="polite"></p>' +
      '<div class="mm-board">' +
        '<div class="mm-col"><div class="mm-col-label" id="mmL' + uid + '">מה נאמר או נעשה</div><div class="mm-list mm-left" role="group" aria-labelledby="mmL' + uid + '"></div></div>' +
        '<div class="mm-col"><div class="mm-col-label" id="mmR' + uid + '">המשמעות</div><div class="mm-list mm-right" role="group" aria-labelledby="mmR' + uid + '"></div></div>' +
      '</div>' +
      '<div class="mm-win" hidden><p class="mm-win-line"></p>' +
      '<button type="button" class="mm-btn mm-again">↺ לשחק שוב</button></div>';
    uid++;
    wrap.parentNode.insertBefore(game, wrap);
    wrap.hidden = true;
    wrap.classList.add("mm-table");

    var left = game.querySelector(".mm-left"), right = game.querySelector(".mm-right");
    var doneEl = game.querySelector(".mm-done"), triesEl = game.querySelector(".mm-tries");
    var fb = game.querySelector(".mm-feedback"), win = game.querySelector(".mm-win");
    var showBtn = game.querySelector(".mm-show");
    var narrow = window.matchMedia("(max-width: 700px)");
    var selL = null, selR = null, done = 0, tries = 0;

    function say(msg, kind){ fb.textContent = msg; fb.className = "mm-feedback" + (kind ? " " + kind : ""); }

    function card(side, row){
      var b = el("button", "mm-card");
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.dataset.id = row.id;
      b.innerHTML = side === "L"
        ? '<span class="mm-title">' + row.title + '</span><span class="mm-said">' + row.said + '</span>'
        : '<span class="mm-said">' + row.meaning + '</span>';
      b.addEventListener("click", function(){ pick(side, b); });
      return b;
    }

    function setSel(b, on){ if(!b) return; b.classList.toggle("is-sel", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }

    function pick(side, b){
      if(b.classList.contains("is-ok")) return;
      if(side === "L"){ setSel(selL, false); selL = (selL === b) ? null : b; setSel(selL, !!selL); }
      else { setSel(selR, false); selR = (selR === b) ? null : b; setSel(selR, !!selR); }
      if(selL && selR) check();
      else if(selL && side === "L" && narrow.matches){
        var first = right.querySelector(".mm-card:not(.is-ok)");
        if(first) first.scrollIntoView({ behavior: "smooth", block: "center" });
        say("עכשיו בחרו את המשמעות המתאימה.");
      }
    }

    function check(){
      tries++; triesEl.textContent = tries;
      var a = selL, b = selR;
      if(a.dataset.id === b.dataset.id){
        done++; doneEl.textContent = done;
        [a, b].forEach(function(x){
          setSel(x, false); x.classList.add("is-ok"); x.setAttribute("aria-disabled", "true");
          x.insertAdjacentHTML("afterbegin", '<span class="mm-num" aria-hidden="true">' + done + '</span>');
        });
        say("✓ נכון! " + (done < rows.length ? "המשיכו לזוג הבא." : ""), "ok");
        selL = selR = null;
        if(done === rows.length) finish();
        else if(narrow.matches){
          var next = left.querySelector(".mm-card:not(.is-ok)");
          if(next) next.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        [a, b].forEach(function(x){ x.classList.add("is-bad"); });
        say("✗ לא מתאים - קראו שוב את שני הכרטיסים ונסו זוג אחר.", "bad");
        setTimeout(function(){ [a, b].forEach(function(x){ x.classList.remove("is-bad"); setSel(x, false); }); }, 650);
        selL = selR = null;
      }
    }

    function finish(){
      win.hidden = false;
      win.querySelector(".mm-win-line").textContent = "🎉 כל הכבוד! התאמתם את כל " + rows.length + " הזוגות ב-" + tries + " ניסיונות. הטבלה המלאה מוצגת למטה.";
      wrap.hidden = false; showBtn.hidden = true;
      win.querySelector(".mm-again").focus();
    }

    function start(){
      left.innerHTML = ""; right.innerHTML = "";
      rows.forEach(function(r){ left.appendChild(card("L", r)); });
      shuffle(rows).forEach(function(r){ right.appendChild(card("R", r)); });
      selL = selR = null; done = 0; tries = 0;
      doneEl.textContent = 0; triesEl.textContent = 0;
      win.hidden = true; wrap.hidden = true; showBtn.hidden = false;
      say("");
    }

    showBtn.addEventListener("click", function(){
      wrap.hidden = !wrap.hidden;
      showBtn.textContent = wrap.hidden ? "הצגת הטבלה המלאה" : "הסתרת הטבלה";
    });
    game.querySelector(".mm-again").addEventListener("click", function(){
      start();
      var f = left.querySelector(".mm-card"); if(f) f.focus();
    });
    start();
  }

  var uid = 0;
  function boot(){ Array.prototype.forEach.call(document.querySelectorAll("table[data-match-game]"), init); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
