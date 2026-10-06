/* הכיתה הדיגיטלית - בדיקת תשובות ליחידת המשקלים
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
    var note = wrap && wrap.querySelector('.bm-field-feedback');
    if(note) note.remove();
    var described = (f.el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function(id){ return id !== 'bm-feedback-' + f.el.dataset.id; });
    if(described.length) f.el.setAttribute('aria-describedby', described.join(' ')); else f.el.removeAttribute('aria-describedby');
    f.el.removeAttribute('aria-invalid');
  }

  function gradeField(f){
    clearFieldMark(f);
    if(f.grade === false || !isFieldFilled(f) || f.expected == null) return;
    var expectedList = Array.isArray(f.expected) ? f.expected : [f.expected];
    var ok = expectedList.some(function(exp){ return exactMatch(f.el.value, exp); });
    markField(f, ok);
    var wrap=f.el.closest('.answer-wrap');
    if(wrap){
      var note=document.createElement('span');
      note.className='bm-field-feedback';
      note.id='bm-feedback-'+f.el.dataset.id;
      var expected=expectedList[0];
      var name=f.el.getAttribute('aria-label')||'';
      var explanation;
      if(/משקל/.test(name)) explanation='המשקל הוא '+expected+'. השוו לתבנית ושמרו על הניקוד והאותיות הנוספות.';
      else if(/שורש/.test(name)) explanation='השורש הוא '+expected+'. חפשו את האותיות המשותפות למילים מאותה משפחה.';
      else if(/בניין/.test(name)) explanation='הבניין הוא '+expected+'. השוו לצורת הפועל ולדגמי הבינוני בטבלת ההסבר.';
      else if(/חלק דיבור|תפקיד/.test(name)) explanation='חלק הדיבור הוא '+expected+'. בדקו את תפקיד המילה במשפט: פעולה, שם או תכונה.';
      else explanation='התשובה המצופה היא '+expected+'. עיינו בהסבר ובדוגמה שלפני הטבלה.';
      note.textContent=ok ? 'נכון' : 'נסו שוב: '+explanation;
      wrap.appendChild(note);
      var existing=f.el.getAttribute('aria-describedby');
      f.el.setAttribute('aria-describedby',(existing?existing+' ':'')+note.id);
      f.el.setAttribute('aria-invalid',ok?'false':'true');
    }
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
    var exam = /final-test/.test(location.pathname);
    if(gateNote) gateNote.setAttribute('role','status');

    function allFilled(){
      return fields.every(isFieldFilled) && mcGroups.every(isMcAnswered);
    }

    function updateReadiness(){
      var ready = exam ? allFilled() : fields.some(isFieldFilled) || mcGroups.some(isMcAnswered);
      checkBtn.disabled = !ready;
      if(gateNote) gateNote.textContent = ready
        ? (exam ? 'כל השדות מלאים - אפשר ללחוץ "בדקו תשובות".' : 'אפשר לבדוק את התשובות שמילאתם, לתקן ולהמשיך למקבץ הבא.')
        : (exam ? 'מלאו את כל השדות (כולל שאלות הבחירה) כדי לפתוח את כפתור הבדיקה.' : 'מלאו תשובה אחת לפחות כדי לבדוק ולהתקדם בקצב שלכם.');
    }

    function runCheck(){
      if(exam ? !allFilled() : !fields.some(isFieldFilled) && !mcGroups.some(isMcAnswered)) return;
      fields.forEach(gradeField);
      mcGroups.forEach(gradeMcGroup);
      checkBtn.textContent = '🔄 בדקו שוב';
      if(gateNote) gateNote.textContent = 'נבדק! אפשר לתקן תשובות וללחוץ שוב על "בדקו שוב" בכל שלב.';
      if(allFilled() && typeof onChecked === 'function') onChecked();
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
      function changed(){ clearFieldMark(f); updateReadiness(); }
      f.el.addEventListener('input', changed);
      f.el.addEventListener('change', changed);
    });

    // Practice tables display five rows at a time; hidden rows keep all answers.
    if(!exam) document.querySelectorAll('table.mishkal-table').forEach(function(table){
      var rows=Array.prototype.slice.call(table.querySelectorAll('tbody tr')).filter(function(row){ return !!row.querySelector('.answer'); });
      if(rows.length<=5) return;
      var page=0, all=false, pages=Math.ceil(rows.length/5);
      var nav=document.createElement('nav');nav.className='bm-table-nav';nav.setAttribute('aria-label','מקבצי תרגול במשקלים');
      function button(text,action){ var b=document.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',action);nav.appendChild(b);return b; }
      var prev=button('המקבץ הקודם',function(){page=Math.max(0,page-1);render();});
      var label=document.createElement('span');label.setAttribute('role','status');nav.appendChild(label);
      var next=button('המקבץ הבא',function(){page=Math.min(pages-1,page+1);render();});
      var toggle=button('הצגת כל השורות',function(){all=!all;render();});
      function render(){
        rows.forEach(function(row,index){row.classList.toggle('bm-practice-hidden',!all && Math.floor(index/5)!==page);});
        label.textContent=all ? 'כל '+rows.length+' השורות' : 'מקבץ '+(page+1)+' מתוך '+pages+' · שורות '+(page*5+1)+'–'+Math.min(rows.length,(page+1)*5);
        prev.disabled=all||page===0;next.disabled=all||page===pages-1;
        toggle.textContent=all?'חזרה למקבצים':'הצגת כל השורות';
      }
      table.parentElement.insertAdjacentElement('afterend',nav);render();
    });

    checkBtn.addEventListener('click', runCheck);
    updateReadiness();

    return { updateReadiness: updateReadiness, runCheck: runCheck, clearAllMarks: clearAllMarks, allFilled: allFilled };
  }

  return { normalize: normalize, exactMatch: exactMatch, wire: wire };
})();
