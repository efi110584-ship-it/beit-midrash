/* בית המדרש הדיגיטלי - בדיקת תשובות ליחידת המשקלים
   מנגנון משותף לכל שיעורי היחידה: התלמיד ממלא הכל, ורק אז לוחץ
   "בדקו תשובות" (הכפתור נעול עד שכל השדות מלאים). בלחיצה - כל שדה
   מסומן בוי/איקס, בלי אפשרות "להציץ" באמצע העבודה. */
window.MishkalAnswerCheck = (function(){
  "use strict";
  var NIKUD_RE = /[֑-ׇֽֿׁׂׅׄ]/g;
  var PUNCT_RE = /[־\-|,:;."'׳״()]/g;

  function normalize(str){
    return (str || '')
      .replace(NIKUD_RE, '')
      .replace(PUNCT_RE, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function exactMatch(studentVal, expected){
    return normalize(studentVal) === normalize(expected);
  }

  function isFieldFilled(f){
    return (f.el.value || '').trim().length > 0;
  }

  function isMcAnswered(group){
    return !!group.querySelector('input[type="radio"]:checked');
  }

  function markField(f, ok){
    f.el.classList.remove('is-correct', 'is-wrong');
    f.el.classList.add(ok ? 'is-correct' : 'is-wrong');
    var wrap = f.el.closest('.answer-wrap');
    var mark = wrap ? wrap.querySelector('.answer-mark') : null;
    if(mark){
      mark.textContent = ok ? '✓' : '✗';
      mark.className = 'answer-mark ' + (ok ? 'correct' : 'wrong');
      mark.setAttribute('aria-label', ok ? 'תשובה נכונה' : 'תשובה שגויה');
    }
  }

  function clearFieldMark(f){
    f.el.classList.remove('is-correct', 'is-wrong');
    var wrap = f.el.closest('.answer-wrap');
    var mark = wrap ? wrap.querySelector('.answer-mark') : null;
    if(mark){ mark.textContent = ''; mark.className = 'answer-mark'; mark.removeAttribute('aria-label'); }
  }

  function gradeField(f){
    if(f.grade === false) return;
    var expectedList = Array.isArray(f.expected) ? f.expected : [f.expected];
    var ok = expectedList.some(function(exp){ return exactMatch(f.el.value, exp); });
    markField(f, ok);
  }

  function gradeMcGroup(group){
    var checked = group.querySelector('input[type="radio"]:checked');
    group.querySelectorAll('.mc-option').forEach(function(o){ o.classList.remove('is-correct', 'is-wrong', 'is-selected'); });
    var feedback = group.closest('.question-block') ? group.closest('.question-block').querySelector('.mc-feedback') : null;
    if(!checked) return;
    var option = checked.closest('.mc-option');
    var ok = option.dataset.correct === 'true';
    option.classList.add(ok ? 'is-correct' : 'is-wrong');
    if(!ok){
      var correctOpt = group.querySelector('.mc-option[data-correct="true"]');
      if(correctOpt) correctOpt.classList.add('is-correct');
    }
    if(feedback){
      feedback.textContent = ok ? '✓ נכון!' : '✗ לא נכון';
      feedback.className = 'mc-feedback ' + (ok ? 'correct' : 'wrong');
    }
  }

  function clearMcGroupMark(group){
    group.querySelectorAll('.mc-option').forEach(function(o){ o.classList.remove('is-correct', 'is-wrong'); });
    var checked = group.querySelector('input[type="radio"]:checked');
    if(checked) checked.closest('.mc-option').classList.add('is-selected');
    var feedback = group.closest('.question-block') ? group.closest('.question-block').querySelector('.mc-feedback') : null;
    if(feedback){ feedback.textContent = ''; feedback.className = 'mc-feedback'; }
  }

  function wire(config){
    var fields = config.fields || [];
    var mcGroups = config.mcGroups || [];
    var checkBtn = config.checkBtn;
    var gateNote = config.gateNote;
    var onChecked = config.onChecked;
    var onCleared = config.onCleared;

    function allFilled(){
      return fields.every(isFieldFilled) && mcGroups.every(isMcAnswered);
    }

    function updateReadiness(){
      var ready = allFilled();
      checkBtn.disabled = !ready;
      if(gateNote) gateNote.textContent = ready
        ? 'כל השדות מלאים - אפשר ללחוץ "בדקו תשובות".'
        : 'מלאו את כל השדות (כולל שאלות הבחירה) כדי לפתוח את כפתור הבדיקה.';
    }

    function runCheck(){
      if(!allFilled()) return;
      fields.forEach(gradeField);
      mcGroups.forEach(gradeMcGroup);
      checkBtn.textContent = '🔄 בדקו שוב';
      if(gateNote) gateNote.textContent = 'נבדק! אפשר לתקן תשובות וללחוץ שוב על "בדקו שוב" בכל שלב.';
      if(typeof onChecked === 'function') onChecked();
    }

    function clearAllMarks(){
      fields.forEach(clearFieldMark);
      mcGroups.forEach(clearMcGroupMark);
      checkBtn.textContent = '✅ בדקו תשובות';
      updateReadiness();
      if(typeof onCleared === 'function') onCleared();
    }

    mcGroups.forEach(function(group){
      group.querySelectorAll('.mc-option').forEach(function(option){
        option.addEventListener('click', function(){
          var radio = option.querySelector('input[type="radio"]');
          radio.checked = true;
          group.querySelectorAll('.mc-option').forEach(function(o){ o.classList.remove('is-selected', 'is-correct', 'is-wrong'); });
          option.classList.add('is-selected');
          var feedback = group.closest('.question-block') ? group.closest('.question-block').querySelector('.mc-feedback') : null;
          if(feedback){ feedback.textContent = ''; feedback.className = 'mc-feedback'; }
          updateReadiness();
        });
      });
    });

    fields.forEach(function(f){
      f.el.addEventListener('input', updateReadiness);
      f.el.addEventListener('change', updateReadiness);
    });

    checkBtn.addEventListener('click', runCheck);
    updateReadiness();

    return { updateReadiness: updateReadiness, runCheck: runCheck, clearAllMarks: clearAllMarks, allFilled: allFilled };
  }

  return { normalize: normalize, exactMatch: exactMatch, wire: wire };
})();
