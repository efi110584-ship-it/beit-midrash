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
  var assignment = btn.getAttribute('data-assignment') || document.title;
  var KEY = 'bm-sent:' + (location.pathname.split('/').pop() || 'index.html');

  /* דף שאין לו שמירה משלו לשם ולכיתה (data-bm-persist) - שומרים כאן */
  [nameEl, classEl].forEach(function(inp){
    if(!inp || !inp.hasAttribute('data-bm-persist')) return;
    var k = 'bm-student:' + inp.getAttribute('data-bm-persist') + ':' + inp.id;
    try{ var v = localStorage.getItem(k); if(v && !inp.value) inp.value = v; }catch(e){}
    inp.addEventListener('input', function(){ try{ localStorage.setItem(k, inp.value); }catch(e){} });
  });

  function clean(t){ return String(t || '').replace(/\s+/g, ' ').trim(); }
  function short(t){ t = clean(t); return t.length > 140 ? t.slice(0, 140) + '…' : t; }

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
      var p = (part || bb).querySelector('p'); if(p) out.push(short(p.textContent));
      return out.join(' · ');
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
  function collect(){
    var items = [], total = 0;
    document.querySelectorAll('.answer').forEach(function(f){
      if(f.tagName !== 'TEXTAREA' && f.tagName !== 'INPUT') return;
      total++;
      var v = clean(f.value) ? String(f.value).trim() : '';
      if(v) items.push({ label: labelOf(f), value: v });
    });
    document.querySelectorAll('.mc-group').forEach(function(g){
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
  function readLast(){ try{ return JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){ return null; } }
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
  function nothingYet(){
    open('warn', function(h){
      h.textContent = 'עוד לא כתבתם תשובות בדף הזה';
      panel.appendChild(el('p', null, 'כתבו לפחות תשובה אחת, ואז לחצו שוב על "שלחו למורה".'));
      actions().appendChild(button('חזרה לדף', '', close));
    });
  }
  function confirmSend(data){
    open('confirm', function(h){
      h.textContent = 'לשלוח למורה?';
      panel.appendChild(el('p', null, 'זה מה שיישלח:'));
      var ul = el('ul', 'bm-send-list');
      ul.appendChild(el('li', null, 'שם: ' + clean(nameEl.value)));
      ul.appendChild(el('li', null, 'כיתה: ' + (classEl && clean(classEl.value) ? clean(classEl.value) : 'לא כתבתם כיתה')));
      ul.appendChild(el('li', null, (data.items.length === 1 ? 'תשובה אחת' : data.items.length + ' תשובות') + ' מתוך ' + data.total + ' שאלות בדף' + (data.items.length < data.total ? ' (שאלות בלי תשובה לא יישלחו)' : '')));
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
      studentClass: classEl ? clean(classEl.value) : '',
      assignment: assignment,
      items: data.items
    }).then(function(res){
      if(!(res && res.ok)) throw new Error((res && res.error) || 'השרת לא אישר את הקבלה');
      try{ localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), n: data.items.length })); }catch(e){}
      showLast();
      open('ok', function(h){
        h.textContent = '✅ התשובות נשלחו למורה';
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
    var data = collect();
    if(!data.items.length){ nothingYet(); return; }
    confirmSend(data);
  }

  btn.addEventListener('click', start);
  panel.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !btn.disabled) close(); });
  showLast();
})();
