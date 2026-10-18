/* תרגול בסגנון בגרות ביחידות הגזרות: בדיקה (ירוק/אדום) ושמירה בדפדפן.
   כל שדה עם data-answer נבדק; חלופות מופרדות ב-"|". */
(function(){
  var cards = document.querySelectorAll('.gzb-card');
  if(!cards.length) return;
  var KEY = 'gzb:' + location.pathname.split('/').pop();
  var FINALS = { 'ך':'כ', 'ם':'מ', 'ן':'נ', 'ף':'פ', 'ץ':'צ' };
  function letters(s){
    return String(s || '').replace(/[֑-ׇ]/g, '').replace(/[^א-ת]/g, '')
      .replace(/[ךםןףץ]/g, function(c){ return FINALS[c]; });
  }
  function fields(root){ return Array.prototype.slice.call((root || document).querySelectorAll('.gzb-card [data-answer]')); }
  /* חלופה באות אחת (י/ו.ש.ב, ע.ש.י/ה) - כל אחת מהאפשרויות נבדקת */
  function slashVariants(str){
    str = String(str || '').replace(/[֑-ׇ]/g, '');
    var m = str.match(/(^|[^א-ת])([א-ת])\s*\/\s*([א-ת])(?![א-ת])/);
    if(!m || !/^(יו|וי|הי|יה)$/.test(m[2] + m[3])) return [str];
    var i = m.index + m[1].length, rest = str.slice(m.index + m[0].length);
    return slashVariants(str.slice(0, i) + m[2] + rest).concat(slashVariants(str.slice(0, i) + m[3] + rest));
  }
  function isRight(f){
    var v = f.value;
    if(f.tagName === 'SELECT') return f.getAttribute('data-answer').split('|').indexOf(v) !== -1;
    return slashVariants(v).some(function(x){ return matches(f, letters(x)); });
  }
  function matches(f, got){
    return f.getAttribute('data-answer').split('|').some(function(a){
      var want = letters(a);
      if(got === want) return true;
      // בהעתקת פועל ממשפט - מקבלים גם עם אות שימוש צמודה (ו/ש/ה/כ/ל/ב/מ)
      return f.getAttribute('data-kind') === 'word' && /^[ושהכלבמ]{1,2}$/.test(got.slice(0, got.length - want.length)) && got.slice(-want.length) === want;
    });
  }
  /* לבדיקה האוטומטית בשליחה למורה (assets/autoscore.js) - בלי לסמן על המסך */
  (window.BM_SCORERS = window.BM_SCORERS || []).push(function(){
    var sc = document.querySelectorAll("[data-submit-scope]");
    var fs = fields().filter(function(f){ return !sc.length || Array.prototype.some.call(sc, function(s){ return s.contains(f); }); });
    return { correct: fs.filter(function(f){ return f.value && isRight(f); }).length, total: fs.length };
  });
  function markOf(f){
    var m = f.nextElementSibling;
    if(!m || !m.classList.contains('check-mark')){
      m = document.createElement('span');
      m.className = 'check-mark';
      m.id = 'mark-' + f.getAttribute('data-id');
      f.after(m);
    }
    return m;
  }
  function clear(f){
    f.classList.remove('is-correct', 'is-wrong');
    f.removeAttribute('aria-invalid');
    var m = f.nextElementSibling;
    if(m && m.classList.contains('check-mark')){ m.classList.remove('is-correct', 'is-wrong'); m.textContent = ''; }
  }
  function check(group){
    var card = document.getElementById(group);
    var list = fields(card), right = 0, empty = 0;
    list.forEach(function(f){
      clear(f);
      if(!String(f.value).trim()){ empty++; return; }
      var ok = isRight(f), m = markOf(f);
      if(ok) right++;
      f.classList.add(ok ? 'is-correct' : 'is-wrong');
      m.classList.add(ok ? 'is-correct' : 'is-wrong');
      m.innerHTML = ok ? '✓<span class="bm-sr-only"> - נכון</span>' : '✗<span class="bm-sr-only"> - לא נכון, נסו שוב</span>';
      f.setAttribute('aria-describedby', m.id);
      f.setAttribute('aria-invalid', ok ? 'false' : 'true');
    });
    var sum = card.querySelector('.gzb-summary');
    if(sum) sum.textContent = '✓ ' + right + ' מתוך ' + list.length + ' נכונות' + (empty ? ' · עוד ' + empty + ' שדות ריקים' : '') +
      (right === list.length ? ' - כל הכבוד! 🌟' : '');
  }
  var all = Array.prototype.slice.call(document.querySelectorAll('.gzb-card .answer'));
  function save(){
    var d = {};
    all.forEach(function(f){ d[f.getAttribute('data-id')] = f.value; });
    try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){}
  }
  try{
    var d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if(d) all.forEach(function(f){
      var v = d[f.getAttribute('data-id')];
      if(v && !String(f.value).trim()) f.value = v;
    });
  }catch(e){}
  var t = null;
  all.forEach(function(f){
    var on = function(){ clear(f); clearTimeout(t); t = setTimeout(save, 400); };
    f.addEventListener('input', on);
    if(f.tagName === 'SELECT') f.addEventListener('change', on);
  });
  document.querySelectorAll('.gzb-check').forEach(function(b){
    b.addEventListener('click', function(){ check(b.getAttribute('data-group')); });
  });
})();
