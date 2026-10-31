/* ============================================================
   שליחה למורה - כפתור אחד (שלב ג׳)
   במקום שלושה כפתורים (הורדת PDF, דף הגשה, שליחה ישירה) יש בדף
   כפתור אחד: "שלחו למורה". לפני השליחה מופיע בתוך הדף (לא בחלון
   קופץ) מה בדיוק יישלח: השם, הכיתה וכמה תשובות. אחרי השליחה כתוב
   בבירור אם היא הצליחה, ומתי נשלח לאחרונה.
   השליחה עצמה - דרך assets/direct-submit.js (אותו Web App כמו קודם).
   ============================================================ */
(function(){
  "use strict";
  var btn = document.getElementById('sendToTeacherBtn');
  var panel = document.getElementById('bmSendPanel');
  if(!btn || !panel) return;
  var nameEl = document.getElementById('studentName');
  var classEl = document.getElementById('studentClass');
  var lastEl = document.getElementById('bmSendLast');
  /* שם המטלה למורה: "יחידה · נושא" (למשל "לקט מצוות · אהבת ישראל"), לפי הדף הזה
     ברשימת היחידות (assets/units-data.js). כך כל נושא מקבל אצל המורה שורה וציון משלו. */
  var PAGE = location.pathname.split('/').pop() || 'index.html';
  /* דף עם כמה נושאים (בית, חינוך ומשפחה): הדף שם על הכפתור data-topic-url של הנושא
     הפתוח (למשל "bayit-chinuch-mishpacha.html#t-tovim"), ונשלח רק הנושא הזה, עם שורה משלו אצל המורה. */
  function topicUrl(){ return btn.getAttribute('data-topic-url') || ''; }
  function whereNow(){
    var T = window.BM_TASKS, u = topicUrl();
    if(!T) return null;
    if(u){   /* findByPage מתעלם מה-# - כאן מחפשים את הנושא המדויק */
      var us = T.units();
      for(var i = 0; i < us.length; i++){
        var ts = us[i].topics || [];
        for(var j = 0; j < ts.length; j++) if(ts[j].url === u) return { unit:us[i], topic:ts[j] };
      }
    }
    return T.findByPage(PAGE);
  }
  function assignmentNow(){
    var where = whereNow();
    return where ? window.BM_TASKS.assignmentFor(where.unit, where.topic) : (btn.getAttribute('data-assignment') || document.title);
  }
  function topicTitle(){
    var where = topicUrl() && whereNow();
    return where && where.topic ? where.topic.title : '';
  }
  function sentKey(){ return 'bm-sent:' + (topicUrl() || PAGE); }
  /* המורה ביקש לתקן את העבודה הקודמת במטלה הזו (assets/feedback.js שומר את זה) - ההגשה תסומן אצלו כתיקון */
  function pendingRedo(){
    try{ var m = JSON.parse(localStorage.getItem('bm-redo') || '{}') || {}; var r = m[assignmentNow()]; return r && r.of ? r : null; }catch(e){ return null; }
  }
  function clearRedo(){
    try{ var m = JSON.parse(localStorage.getItem('bm-redo') || '{}') || {}; delete m[assignmentNow()]; localStorage.setItem('bm-redo', JSON.stringify(m)); }catch(e){}
  }

  /* דף שאין לו שמירה משלו לשם ולכיתה (data-bm-persist) - שומרים כאן */
  [nameEl, classEl].forEach(function(inp){
    if(!inp || !inp.hasAttribute('data-bm-persist')) return;
    var k = 'bm-student:' + inp.getAttribute('data-bm-persist') + ':' + inp.id;
    try{ var v = localStorage.getItem(k); if(v && !inp.value) inp.value = v; }catch(e){}
    inp.addEventListener('input', function(){ try{ localStorage.setItem(k, inp.value); }catch(e){} });
  });

  function clean(t){ return String(t || '').replace(/\s+/g, ' ').trim(); }
  function short(t){ t = clean(t); return t.length > 300 ? t.slice(0, 300) + '…' : t; }

  /* ---------- שם השאלה, כפי שיופיע אצל המורה ---------- */
  function examTagFor(el){
    var n = el;
    while(n && n.previousElementSibling === null && n.parentElement && !n.parentElement.matches('section, main')) n = n.parentElement;
    for(var p = n && n.previousElementSibling; p; p = p.previousElementSibling){
      if(p.matches('.exam-tag')) return clean(p.textContent).replace(/^📅\s*/, '');
      if(p.matches('h2, h3, .exam-tag')) break;
    }
    return '';
  }
  function labelOf(field){
    var bb = field.closest('.bagrut-block');
    if(bb){
      var out = [];
      var src = bb.querySelector('.src'); if(src) out.push(clean(src.textContent));
      var part = field.closest('.bagrut-part');
      var pl = part && part.querySelector('.bagrut-part-label'); if(pl) out.push(clean(pl.textContent));
      /* כל נוסח השאלה (גם סעיפים ב', 1, 2...), לא רק המשפט הראשון - כדי שהמורה יראה בקובץ על מה ענו */
      var ps = Array.prototype.filter.call((part || bb).querySelectorAll('p'), function(p){
        return !p.closest('.hint-box') && !p.classList.contains('bagrut-note') && (part || !p.closest('.bagrut-part'));
      }).map(function(p){ return clean(p.textContent); }).filter(Boolean);
      if(ps.length){ var q = ps.join(' '); out.push(q.length > 900 ? q.slice(0, 900) + '…' : q); }
      return out.join(' · ');
    }
    /* שאלות בגרות בכרטיסים (בית, חינוך ומשפחה): מועד · שאלה · סעיף · נוסח הסעיף */
    var bq = field.closest('.bh-q');
    if(bq){
      var parts = [];
      var ex = bq.querySelector('.bh-exam'), qn = bq.querySelector('.bh-qn');
      if(ex || qn) parts.push(clean((ex ? ex.textContent : '') + ' ' + (qn ? qn.textContent : '')).replace(/^📅\s*/, ''));
      var bp = field.closest('.bh-part'), letter = bp && bp.querySelector('.bh-letter');
      var sub = field.closest('.bh-sub'), subq = sub && sub.querySelector('.bh-subq');
      parts.push('סעיף ' + (letter ? clean(letter.textContent) : '') + (subq ? ' ' + clean((subq.querySelector('b') || {}).textContent || '') : ''));
      var txt = bp ? Array.prototype.filter.call(bp.children, function(c){ return c.tagName === 'P'; }).map(function(c){ return clean(c.textContent); }).join(' ') : '';
      if(subq) txt = (txt ? txt + ' ' : '') + clean(subq.textContent).replace(/^\(\d+\)\s*/, '');
      if(txt) parts.push(txt.length > 900 ? txt.slice(0, 900) + '…' : txt);
      return parts.join(' · ');
    }
    var qb = field.closest('.question-block');
    var q = qb && qb.querySelector('.q-text');
    if(q){
      var num = qb.querySelector('.q-num, .part-label');
      var tag = examTagFor(qb);
      return (tag ? tag + ' · ' : '') + (num ? clean(num.textContent) + '. ' : '') + short(q.textContent);
    }
    var by = field.getAttribute('aria-labelledby');
    var byEl = by && document.getElementById(by);
    if(byEl && clean(byEl.textContent)) return short(byEl.textContent);
    return clean(field.getAttribute('aria-label')) || field.getAttribute('data-id') || 'שאלה';
  }

  /* ---------- מה יש לשלוח ---------- */
  /* דף שמסמן חלק לשליחה (data-submit-scope) - שולחים רק אותו.
     בבראשית, ישעיהו, יונה, לקט מצוות ופתוח תפתח: בדף שיש בו חלק של שאלות בגרות
     (section.card[data-stage="bagrut"], ובפתוח תפתח גם .bq-panel) שולחים רק את התשובות
     לשאלות הבגרות. דף העבודה עצמו נשאר לתרגול, ולא נשלח. שם המטלה לא משתנה. */
  var BAGRUT_ONLY_UNITS = ['leket', 'bereshit', 'yeshayahu', 'yonah', 'ptp'];
  var BAGRUT_ROOT = 'section.card[data-stage="bagrut"], .bq-panel';
  var BAGRUT_SCOPE = BAGRUT_ROOT + ', [data-bm-stage="bagrut"], .bagrut-block';
  var bagrutRoots = Array.prototype.slice.call(document.querySelectorAll(BAGRUT_ROOT));
  var bagrutOnly = (function(){
    var T = window.BM_TASKS;
    var where = T && T.findByPage(PAGE);
    return !!(where && BAGRUT_ONLY_UNITS.indexOf(where.unit.key) !== -1 && bagrutRoots.length);
  })();
  /* בדפים האלה הכפתור עובר לסוף חלק שאלות הבגרות, יחד עם החלונית, "מה נשלח?" ו"נשלח לאחרונה" */
  if(bagrutOnly){
    var lastRoot = bagrutRoots[bagrutRoots.length - 1];
    var host = lastRoot.matches('.bq-panel') ? lastRoot.parentElement : (lastRoot.querySelector('.card-body') || lastRoot);
    var box = document.createElement('div');
    box.className = 'bm-bagrut-send';
    box.style.cssText = 'margin-top:1rem;padding-top:.9rem;border-top:1px dashed var(--paper-line, #DCE4F1);display:flex;flex-direction:column;gap:.6rem;align-items:flex-start';
    btn.textContent = '📤 שלחו למורה את שאלות הבגרות';
    box.appendChild(btn);
    var info = null;
    Array.prototype.some.call(document.querySelectorAll('.bm-save-info p, #printHelp p'), function(p){
      if(/מה נשלח/.test(p.textContent)){ info = p; return true; }
      return false;
    });
    if(!info) info = document.createElement('p');
    info.innerHTML = '<span aria-hidden="true">📤</span> <b>מה נשלח?</b> נשלחים למורה השם, הכיתה והתשובות על שאלות הבגרות בלבד.';
    info.style.margin = '0';
    box.appendChild(info);
    panel.style.alignSelf = 'stretch';
    box.appendChild(panel);
    if(lastEl) box.appendChild(lastEl);
    host.appendChild(box);
  }
  function inScope(el){
    if(bagrutOnly) return !!el.closest(BAGRUT_SCOPE);
    var sc = document.querySelectorAll('[data-submit-scope]');
    if(!sc.length) return true;
    return Array.prototype.some.call(sc, function(s){ return s.contains(el); });
  }
  function collect(){
    var items = [], total = 0;
    document.querySelectorAll('.answer').forEach(function(f){
      if(!inScope(f)) return;
      if(!/^(TEXTAREA|INPUT|SELECT)$/.test(f.tagName)) return;
      if(f.matches('input[type=radio], input[type=checkbox]')) return;
      total++;
      var v = clean(f.value) ? String(f.value).trim() : '';
      if(f.tagName === 'SELECT' && v){
        v = Array.prototype.filter.call(f.options, function(o){ return o.selected && !o.disabled; }).map(function(o){ return clean(o.textContent); }).join(', ');
      }
      if(v) items.push({ label: labelOf(f), value: v });
    });
    document.querySelectorAll('.mc-group').forEach(function(g){
      if(!inScope(g)) return;
      total++;
      var checked = g.querySelector('input[type="radio"]:checked');
      if(!checked) return;
      var opt = checked.closest('.mc-option');
      var mark = opt && opt.getAttribute('data-correct') === 'true' ? ' (תשובה נכונה)' : (opt ? ' (תשובה לא נכונה)' : '');
      items.push({ label: labelOf(g), value: clean((opt || checked.parentElement).textContent) + mark });
    });
    return { items: items, total: total };
  }

  /* ---------- "נשלח לאחרונה" ---------- */
  function readLast(){ try{ return JSON.parse(localStorage.getItem(sentKey()) || 'null'); }catch(e){ return null; } }
  function fmt(t){
    var d = new Date(t), now = new Date();
    var hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return (d.toDateString() === now.toDateString() ? 'היום' : d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear()) + ' בשעה ' + hm;
  }
  function showLast(){
    var last = readLast();
    if(!lastEl) return;
    lastEl.hidden = !last;
    if(last) lastEl.textContent = '✅ נשלח למורה ' + fmt(last.t) + ' (' + (last.n === 1 ? 'תשובה אחת' : last.n + ' תשובות') + ').';
  }

  /* ---------- החלונית שבתוך הדף ---------- */
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function button(text, cls, onClick){ var b = el('button', 'btn ' + (cls || ''), text); b.type = 'button'; b.addEventListener('click', onClick); return b; }
  function open(kind, build){
    panel.innerHTML = '';
    panel.className = 'bm-send-panel bm-send-' + kind;
    var h = el('h2', 'bm-send-title'); h.tabIndex = -1;
    panel.appendChild(h);
    build(h);
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    h.focus();
  }
  function close(){
    panel.hidden = true; panel.innerHTML = '';
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  }
  function actions(){ var a = el('div', 'bm-send-actions'); panel.appendChild(a); return a; }

  function askName(){
    open('warn', function(h){
      h.textContent = '✏️ כתבו קודם את השם שלכם';
      panel.appendChild(el('p', null, 'כדי שהמורה יידע ממי התשובות, צריך לכתוב שם בשורה "שם" שלמעלה.'));
      var a = actions();
      a.appendChild(button('למילוי השם', 'primary', function(){ panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); nameEl.focus(); nameEl.scrollIntoView({ block: 'center' }); }));
      a.appendChild(button('חזרה לדף', '', close));
    });
  }
  /* השרת שומר כל הגשה בתיקיית הכיתה - צריך כיתה שאפשר לזהות: י"א או י"ב */
  function classCode(){
    var api = window.BeitMidrashDirectSubmit;
    return (api && api.classCode && classEl) ? api.classCode(classEl.value) : '';
  }
  /* בכיתה י"א אפשר לכתוב גם את מספר הכיתה (1-4) - לפיו העבודה מגיעה למורה הנכון.
     בלי מספר העבודה נשלחת כרגיל. */
  function sectionCode(){
    var api = window.BeitMidrashDirectSubmit;
    return (api && api.sectionCode && classEl) ? api.sectionCode(classEl.value) : '';
  }
  function classLabel(){
    return classCode() === 'יא' ? ('י"א ' + sectionCode()).trim() : 'י"ב';
  }
  function askClass(){
    open('warn', function(h){
      h.textContent = '✏️ כתבו את הכיתה שלכם';
      panel.appendChild(el('p', null, 'בשורה "כיתה" שלמעלה כתבו את הכיתה, למשל י"א 3 או י"ב. כך העבודה תגיע למורה שלכם.'));
      var a = actions();
      a.appendChild(button('למילוי הכיתה', 'primary', function(){ panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); classEl.focus(); classEl.scrollIntoView({ block: 'center' }); }));
      a.appendChild(button('חזרה לדף', '', close));
    });
  }
  function nothingYet(){
    open('warn', function(h){
      h.textContent = bagrutOnly ? 'עוד לא עניתם על שאלות הבגרות' : topicTitle() ? 'עוד לא כתבתם תשובות בנושא הזה' : 'עוד לא כתבתם תשובות בדף הזה';
      panel.appendChild(el('p', null, bagrutOnly ? 'למורה נשלחות רק התשובות לשאלות הבגרות שבסוף הדף. ענו לפחות על סעיף אחד שם, ואז לחצו שוב על "שלחו למורה".' : 'כתבו לפחות תשובה אחת, ואז לחצו שוב על "שלחו למורה".'));
      actions().appendChild(button('חזרה לדף', '', close));
    });
  }
  function confirmSend(data){
    open('confirm', function(h){
      h.textContent = 'לשלוח למורה?';
      panel.appendChild(el('p', null, 'זה מה שיישלח:'));
      var ul = el('ul', 'bm-send-list');
      ul.appendChild(el('li', null, 'שם: ' + clean(nameEl.value)));
      ul.appendChild(el('li', null, 'כיתה: ' + classLabel()));
      if(topicTitle()) ul.appendChild(el('li', null, 'נושא: ' + topicTitle() + ' (רק השאלות בנושא הזה)'));
      if(pendingRedo()) ul.appendChild(el('li', null, '🔁 זו הגשה מתוקנת - המורה יראה אותה ליד הציון הקודם.'));
      ul.appendChild(el('li', null, (data.items.length === 1 ? 'תשובה אחת' : data.items.length + ' תשובות') + ' מתוך ' + data.total + (bagrutOnly ? ' סעיפים בשאלות הבגרות' : topicTitle() ? ' סעיפים בנושא' : ' סעיפי תשובה בדף') + (data.items.length < data.total ? ' (שאלות בלי תשובה לא יישלחו)' : '')));
      if(bagrutOnly) ul.appendChild(el('li', null, 'נשלחות רק התשובות לשאלות הבגרות. דף העבודה עצמו נשאר אצלכם לתרגול.'));
      panel.appendChild(ul);
      panel.appendChild(el('p', 'bm-send-note', 'רק זה נשלח - שום דבר אחר מהמחשב. אי אפשר לבטל שליחה, אבל אפשר לשלוח שוב אחר כך, והגרסה החדשה תגיע למורה.'));
      var a = actions();
      a.appendChild(button('✅ כן, לשלוח עכשיו', 'primary', function(){ send(data, this); }));
      a.appendChild(button('עוד לא - חזרה לדף', '', close));
    });
  }
  function send(data, sendBtn){
    if(!window.BeitMidrashDirectSubmit){ failed('החיבור לשליחה לא נטען.'); return; }
    sendBtn.disabled = true; sendBtn.textContent = 'שולח...';
    btn.disabled = true;
    var status = el('p', 'bm-send-progress', 'שולח את התשובות... זה לוקח כמה שניות.');
    status.setAttribute('role', 'status');
    panel.appendChild(status);
    window.BeitMidrashDirectSubmit.send({
      studentName: clean(nameEl.value),
      studentClass: classCode(),
      section: sectionCode(),
      assignment: assignmentNow(),
      redoOf: (pendingRedo() || {}).of || '',
      items: data.items,
      total: data.total
    }).then(function(res){
      if(!(res && res.ok)) throw new Error((res && res.error) || 'השרת לא אישר את הקבלה');
      try{ localStorage.setItem(sentKey(), JSON.stringify({ t: Date.now(), n: data.items.length })); }catch(e){}
      var wasRedo = !!pendingRedo();
      clearRedo();
      showLast();
      open('ok', function(h){
        h.textContent = wasRedo ? '✅ התיקון נשלח למורה' : '✅ התשובות נשלחו למורה';
        panel.appendChild(el('p', null, (data.items.length === 1 ? 'נשלחה תשובה אחת' : 'נשלחו ' + data.items.length + ' תשובות') + ', ' + fmt(Date.now()) + '. התשובות נשארות שמורות גם בדף.'));
        actions().appendChild(button('סגירה', '', close));
      });
    }).catch(function(err){ failed(err && err.message); })
      .then(function(){ btn.disabled = false; });
  }
  function failed(msg){
    open('error', function(h){
      h.textContent = '❌ השליחה לא הצליחה';
      panel.appendChild(el('p', null, 'בדקו שיש חיבור לאינטרנט ונסו שוב. התשובות שלכם שמורות בדף ולא נמחקו.'));
      if(msg) panel.appendChild(el('p', 'bm-send-note', 'פרטים למורה: ' + msg));
      var a = actions();
      a.appendChild(button('לנסות שוב', 'primary', start));
      a.appendChild(button('חזרה לדף', '', close));
    });
  }
  function start(){
    if(nameEl && !clean(nameEl.value)){ askName(); return; }
    if(classEl && !classCode()){ askClass(); return; }
    var data = collect();
    if(!data.items.length){ nothingYet(); return; }
    confirmSend(data);
  }

  /* ---------- בדפים עם חלוקה למשימות (assets/steps.js) - השליחה נפתחת רק במשימה האחרונה ---------- */
  var gateNote = null;
  function applyStepsGate(){
    var steps = window.BeitMidrashSteps;
    if(!steps || typeof steps.isAtEnd !== 'function') return; /* אין חלוקה למשימות בדף הזה */
    if(bagrutOnly) return; /* הכפתור יושב בסוף שאלות הבגרות ושולח רק אותן - אין צורך לחכות למשימה האחרונה */
    var atEnd = steps.isAtEnd();
    btn.disabled = !atEnd;
    btn.title = atEnd ? '' : 'השליחה נפתחת במשימה האחרונה בדף';
    if(!atEnd && !gateNote){
      gateNote = el('span', 'bm-send-gate-note', '🔒 השליחה תיפתח במשימה האחרונה בדף');
      btn.insertAdjacentElement('afterend', gateNote);
    } else if(atEnd && gateNote){
      gateNote.remove();
      gateNote = null;
    }
  }
  document.addEventListener('bm-steps-change', applyStepsGate);

  btn.addEventListener('click', start);
  /* הדף החליף נושא - סוגרים חלונית פתוחה ומעדכנים "נשלח לאחרונה" לנושא החדש */
  document.addEventListener('bm-send-scope-change', function(){
    if(!panel.hidden){ panel.hidden = true; panel.innerHTML = ''; btn.setAttribute('aria-expanded', 'false'); }
    showLast();
  });
  panel.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !btn.disabled) close(); });
  showLast();
  applyStepsGate();
})();
