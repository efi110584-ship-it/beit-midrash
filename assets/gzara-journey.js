/* ============================================================
   הכיתה הדיגיטלית - מנוע "מסע למידה" אינטראקטיבי להסבר גזרה
   ============================================================
   רכיב גנרי (לא תלוי בשום גזרה ספציפית): מקבל קונטיינר ואובייקט
   תוכן (ראו את ivrit-nechei-pa.html לדוגמת שימוש), ומרנדר רצף
   מסכים עם פס התקדמות, כפתורי ניווט, ומנגנוני אינטראקציה
   (בחירה עם משוב, משחק עם ניקוד, שאלון סיום).

   כדי להוסיף גזרה חדשה: להעתיק את אובייקט התוכן מ-ivrit-nechei-pa.html,
   להחליף את הטקסטים/הדוגמאות, ולקרוא ל-BeitMidrashJourney.init(...)
   מהעמוד החדש. שום שינוי בקובץ הזה לא נדרש.

   סוגי מסכים (screen.type): intro, teach, rule, trap, game, examSteps,
   rootsTable, exceptions, summary, finalQuiz, result.
   ============================================================ */
window.BeitMidrashJourney = (function(){
  "use strict";

  function el(tag, cls, html){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }
  function normalize(str){ return (str || '').replace(/[֑-ׇ]/g, '').trim(); }

  /* ---------- בניית ה-DOM של מסך בודד, לפי סוגו ---------- */
  function renderScreen(screen){
    var wrap = el('section', 'gj-screen');
    var card = el('div', 'gj-card' + (screen.heroCard ? ' gj-hero' : ''));

    switch(screen.type){
      case 'intro':
        card.innerHTML =
          '<p class="gj-lede">' + screen.lede + '</p>' +
          '<div class="gj-tag">' + screen.tag + '</div>' +
          (screen.sub ? '<p class="gj-lede" style="margin-top:1.1rem;">' + screen.sub + '</p>' : '') +
          '<div class="gj-giant">' + screen.rootHtml + '</div>' +
          '<div class="gj-giant">' + screen.letterHtml + '</div>';
        break;

      case 'teach':
        card.innerHTML =
          '<h2 class="gj-h2">' + screen.title + '</h2>' +
          '<p class="gj-lede">' + screen.lede1 + '</p>' +
          '<div class="gj-giant">' + screen.baseHtml + '</div>' +
          '<div class="gj-arrow-step">⬇️ ' + screen.arrowLabel + '</div>' +
          '<div class="gj-giant">' + screen.futureHtml + '</div>' +
          '<p class="gj-lede" style="margin-top:1rem;">' + screen.lede2 + '</p>' +
          '<div class="gj-tag">' + screen.tag + '</div>';
        break;

      case 'rule':
        var exHtml = screen.examples.map(function(x){
          return '<div class="gj-ex-card"><div class="gj-word">' + x.html + '</div>' +
            '<span class="gj-chip' + (x.bad ? ' gj-chip-bad' : '') + '">' + x.tag + '</span></div>';
        }).join('');
        card.innerHTML =
          (screen.eyebrow ? '<div class="gj-h2" style="opacity:.75; font-size:1rem;">' + screen.eyebrow + '</div>' : '') +
          '<div class="gj-giant">' + screen.ruleHtml + '</div>' +
          '<p class="gj-lede">' + screen.lede + '</p>' +
          '<div class="gj-examples">' + exHtml + '</div>';
        break;

      case 'trap':
        card.innerHTML =
          '<h2 class="gj-h2">' + screen.title + '</h2>' +
          '<p class="gj-lede">' + screen.lede + '</p>' +
          '<div class="gj-giant gj-small">' + screen.baseHtml + '</div>' +
          '<div class="gj-arrow-step">⬇️ ' + screen.arrowLabel + '</div>' +
          '<div class="gj-giant gj-small">' + screen.trapHtml + '</div>' +
          '<p class="gj-lede" style="margin-top:1rem; font-weight:700;">' + screen.question + '</p>' +
          '<div class="gj-choice-row">' +
            '<button class="gj-choice-btn" data-trap="' + (screen.choiceA.right ? '1' : '0') + '">' + screen.choiceA.label + '</button>' +
            '<button class="gj-choice-btn" data-trap="' + (screen.choiceB.right ? '1' : '0') + '">' + screen.choiceB.label + '</button>' +
          '</div>' +
          '<div class="gj-feedback gj-ok" data-feedback="ok">' + screen.feedbackOk + '</div>' +
          '<div class="gj-feedback gj-bad" data-feedback="bad">' + screen.feedbackBad + '</div>';
        break;

      case 'game':
      case 'finalQuiz':
        card.innerHTML =
          (screen.title ? '<h2 class="gj-h2">' + screen.title + '</h2>' : '') +
          (screen.lede ? '<p class="gj-lede">' + screen.lede + '</p>' : '') +
          '<div class="gj-game-head"><span data-gq-counter></span><span class="gj-game-score" data-gq-score>0 / 0</span></div>' +
          '<div class="gj-giant" data-gq-word style="margin-bottom:1.1rem;"></div>' +
          '<div class="gj-game-choices">' +
            '<button class="gj-gc-btn gj-opt-b" data-gq-choice="' + screen.optionB.value + '">' + screen.optionB.label + '</button>' +
            '<button class="gj-gc-btn gj-opt-a" data-gq-choice="' + screen.optionA.value + '">' + screen.optionA.label + '</button>' +
          '</div>' +
          '<div class="gj-feedback gj-ok" data-gq-feedback="ok">🎉 מצוין!</div>' +
          '<div class="gj-feedback gj-bad" data-gq-feedback="bad">' + (screen.wrongHint || '💡 כמעט! נסו לזהות את הסימן שלמדנו.') + '</div>';
        break;

      case 'examSteps':
        var stepsHtml = screen.steps.map(function(s, i){
          return (i > 0 ? '<div class="gj-step-arrow">⬇️</div>' : '') + '<div class="gj-step-chip">' + s + '</div>';
        }).join('');
        card.innerHTML =
          '<h2 class="gj-h2">' + screen.title + '</h2>' +
          '<div class="gj-steps-list">' + stepsHtml + '</div>' +
          '<div class="gj-tag" style="margin-top:1.2rem;">' + screen.finalTag + '</div>';
        break;

      case 'rootsTable':
        var thead = '<tr>' + screen.columns.map(function(c){ return '<th>' + c + '</th>'; }).join('') + '</tr>';
        var tbody = screen.rows.map(function(r){
          return '<tr>' + r.map(function(c){ return '<td>' + c + '</td>'; }).join('') + '</tr>';
        }).join('');
        card.innerHTML =
          '<h2 class="gj-h2">' + screen.title + '</h2>' +
          (screen.lede ? '<p class="gj-lede">' + screen.lede + '</p>' : '') +
          '<table class="gj-roots-table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>';
        break;

      case 'exceptions':
        card.innerHTML =
          '<h2 class="gj-h2">' + screen.title + '</h2>' +
          '<div class="gj-exceptions-roots">' + screen.rootsHtml + '</div>' +
          '<p class="gj-lede">' + screen.lede + '</p>' +
          '<div class="gj-exceptions-compare">' +
            '<div class="gj-giant">' + screen.leftHtml + '</div>' +
            '<span class="gj-vs">וגם</span>' +
            '<div class="gj-giant">' + screen.rightHtml + '</div>' +
          '</div>' +
          '<p class="gj-lede" style="margin-top:1rem;">' + screen.note + '</p>';
        break;

      case 'summary':
        var pointsHtml = screen.points.map(function(p, i){
          return '<div class="gj-summary-point"><span class="gj-summary-num">' + (i + 1) + '</span><span>' + p + '</span></div>';
        }).join('');
        card.innerHTML =
          '<h2 class="gj-h2" style="font-size:1.6rem;">🏆 ' + screen.title + '</h2>' +
          '<div class="gj-summary-points">' + pointsHtml + '</div>' +
          '<div class="gj-giant" style="font-size:clamp(1.8rem,7vw,2.6rem);">' + screen.bigRuleHtml + '</div>';
        break;

      case 'result':
        card.className = 'gj-card gj-result-card';
        card.innerHTML =
          '<div class="gj-result-icon" data-result-icon></div>' +
          '<h2 class="gj-h2" data-result-title></h2>' +
          '<div class="gj-result-score" data-result-score></div>' +
          '<p class="gj-lede" data-result-msg></p>' +
          '<div class="gj-result-actions">' +
            '<button class="gj-ghost-btn" data-retry>🔁 חזרה על ההסבר</button>' +
            '<a class="gj-next" style="margin:0; text-decoration:none; display:inline-block;" href="' + screen.practiceHref + '">🚀 אני רוצה לתרגל</a>' +
          '</div>';
        break;
    }

    wrap.appendChild(card);
    return wrap;
  }

  /* ---------- מנגנון משחק/שאלון (משותף ל-game ו-finalQuiz) ---------- */
  function makeGameController(screenEl, screenData){
    var state = { i: 0, correct: 0, questions: screenData.questions };
    var wordEl = screenEl.querySelector('[data-gq-word]');
    var counterEl = screenEl.querySelector('[data-gq-counter]');
    var scoreEl = screenEl.querySelector('[data-gq-score]');
    var feedbackOk = screenEl.querySelector('[data-gq-feedback="ok"]');
    var feedbackBad = screenEl.querySelector('[data-gq-feedback="bad"]');
    var choiceBtns = screenEl.querySelectorAll('[data-gq-choice]');

    function showQuestion(){
      feedbackOk.classList.remove('gj-show');
      feedbackBad.classList.remove('gj-show');
      choiceBtns.forEach(function(b){ b.disabled = false; });
      var q = state.questions[state.i];
      wordEl.innerHTML = q.html;
      counterEl.textContent = 'שאלה ' + (state.i + 1) + ' מתוך ' + state.questions.length;
      scoreEl.textContent = state.correct + ' / ' + state.i;
    }

    function answer(value, onAnswered){
      var right = normalize(value) === normalize(state.questions[state.i].answer);
      if(right) state.correct++;
      feedbackOk.classList.toggle('gj-show', right);
      feedbackBad.classList.toggle('gj-show', !right);
      choiceBtns.forEach(function(b){ b.disabled = true; });
      state.i++;
      scoreEl.textContent = state.correct + ' / ' + Math.min(state.i, state.questions.length);
      var done = state.i >= state.questions.length;
      if(onAnswered) onAnswered(done);
    }

    choiceBtns.forEach(function(b){
      b.addEventListener('click', function(){ controller.onChoice && controller.onChoice(b.dataset.gqChoice); });
    });

    var controller = { state: state, showQuestion: showQuestion, answer: answer, onChoice: null };
    return controller;
  }

  /* ---------- אתחול מלא ---------- */
  function init(container, data){
    container.innerHTML = '';
    container.classList.add('gj-wrap');

    var progress = el('div', 'gj-progress');
    var stage = el('div', 'gj-stage');
    container.appendChild(progress);
    container.appendChild(stage);

    var screens = data.screens.map(renderScreen);
    screens.forEach(function(s){ stage.appendChild(s); });
    screens.forEach(function(_, i){ progress.appendChild(el('div', 'gj-dot', String(i + 1))); });
    var dots = Array.from(progress.children);

    var current = 0;
    var gameControllers = {}; // index -> controller, for 'game' / 'finalQuiz' screens

    function go(i, skipScroll){
      current = Math.max(0, Math.min(screens.length - 1, i));
      screens.forEach(function(s, k){ s.classList.toggle('gj-active', k === current); });
      dots.forEach(function(d, k){
        d.classList.toggle('gj-current', k === current);
        d.classList.toggle('gj-done', k < current);
      });
      var ctl = gameControllers[current];
      if(ctl && ctl.state.i === 0 && ctl.state.correct === 0) ctl.showQuestion();
      // בטעינה הראשונה לא גוללים כלל, כדי לא "לבלוע" את הכותרת ופס ההתקדמות -
      // רק במעברים הבאים (לחיצה על "הלאה") גוללים לתחילת המסך החדש.
      if(!skipScroll) stage.scrollIntoView({ behavior:'smooth', block:'start' });
    }

    var resultIndex = data.screens.findIndex(function(s){ return s.type === 'result'; });

    // כפתור "הקודם" - זהה בכל מסך (חוץ מהראשון, ששם אין לאן לחזור, ומסך
    // התוצאה, ששם יש כבר "חזרה על ההסבר"). חוזר צעד אחד בלי לגעת במצב
    // המשחק/השאלון של המסך שאליו חוזרים.
    function makePrevButton(i){
      var prevBtn = el('button', 'gj-prev', '→ הקודם');
      if(i === 0) prevBtn.hidden = true;
      prevBtn.addEventListener('click', function(){ go(current - 1); });
      return prevBtn;
    }
    function insertNavRow(screenEl, i, nextBtn){
      var row = el('div', 'gj-nav-row');
      row.appendChild(makePrevButton(i));
      row.appendChild(nextBtn);
      screenEl.querySelector('.gj-card').insertAdjacentElement('afterend', row);
    }

    data.screens.forEach(function(sData, i){
      var screenEl = screens[i];

      if(sData.type === 'result'){
        var retryBtn = screenEl.querySelector('[data-retry]');
        retryBtn.addEventListener('click', function(){
          Object.keys(gameControllers).forEach(function(k){
            gameControllers[k].state.i = 0;
            gameControllers[k].state.correct = 0;
          });
          go(0);
        });
        return; // אין כפתור "הלאה"/"הקודם" במסך התוצאה
      }

      if(sData.type === 'trap'){
        var nextBtn = el('button', 'gj-next', sData.nextLabel || 'הלאה ←');
        nextBtn.disabled = true;
        nextBtn.addEventListener('click', function(){ if(!nextBtn.disabled) go(current + 1); });
        insertNavRow(screenEl, i, nextBtn);
        screenEl.querySelectorAll('[data-trap]').forEach(function(choiceBtn){
          choiceBtn.addEventListener('click', function(){
            var right = choiceBtn.dataset.trap === '1';
            screenEl.querySelector('[data-feedback="ok"]').classList.toggle('gj-show', right);
            screenEl.querySelector('[data-feedback="bad"]').classList.toggle('gj-show', !right);
            if(right) nextBtn.disabled = false;
          });
        });
        return;
      }

      if(sData.type === 'game'){
        var ctl = makeGameController(screenEl, sData);
        gameControllers[i] = ctl;
        var gNext = el('button', 'gj-next', 'הלאה ←');
        gNext.hidden = true;
        gNext.addEventListener('click', function(){
          if(ctl.state.i < ctl.state.questions.length){ ctl.showQuestion(); gNext.hidden = true; }
          else { go(current + 1); }
        });
        insertNavRow(screenEl, i, gNext);
        ctl.onChoice = function(value){
          ctl.answer(value, function(done){
            gNext.hidden = false;
            gNext.textContent = done ? 'המשך ←' : 'השאלה הבאה ←';
          });
        };
        return;
      }

      if(sData.type === 'finalQuiz'){
        var qctl = makeGameController(screenEl, sData);
        gameControllers[i] = qctl;
        var resultEl = screens[resultIndex];
        var resultData = data.screens[resultIndex];
        var prevOnly = el('div', 'gj-nav-row');
        prevOnly.appendChild(makePrevButton(i));
        screenEl.querySelector('.gj-card').insertAdjacentElement('afterend', prevOnly);
        qctl.onChoice = function(value){
          qctl.answer(value, function(done){
            if(done){
              window.setTimeout(function(){
                var pct = Math.round(qctl.state.correct / qctl.state.questions.length * 100);
                var good = pct >= (sData.passPercent || 60);
                resultEl.querySelector('[data-result-icon]').textContent = good ? '🏆' : '💪';
                resultEl.querySelector('[data-result-title]').textContent = good ? 'מעולה!' : 'כמעט שם!';
                resultEl.querySelector('[data-result-score]').textContent = qctl.state.correct + ' / ' + qctl.state.questions.length;
                resultEl.querySelector('[data-result-msg]').textContent = good ? sData.passMsgGood : sData.passMsgRetry;
                go(resultIndex);
              }, 700);
            } else {
              window.setTimeout(function(){ qctl.showQuestion(); }, 700);
            }
          });
        };
        return;
      }

      // מסכי מידע רגילים: intro / teach / rule / examSteps / rootsTable / exceptions / summary
      var plainNext = el('button', 'gj-next', sData.nextLabel || 'הלאה ←');
      plainNext.addEventListener('click', function(){ go(current + 1); });
      insertNavRow(screenEl, i, plainNext);
    });

    go(0, true);
  }

  return { init: init };
})();
