/* Optional supports use the lesson's existing sources; no external requests. */
(function(){
  'use strict';
  var start=document.querySelector('.bm-lesson-start');
  if(!start || start.dataset.supportsReady)return;
  start.dataset.supportsReady='true';
  var page=location.pathname.split('/').pop(),kind=start.dataset.lessonKind||'sources';
  var tools=start.querySelector('.bm-lesson-tools');
  var source=document.querySelector('#grid') || document.querySelector('main');
  function el(tag,text,cls){var node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;}
  function details(title){var node=el('details');node.appendChild(el('summary',title));tools.appendChild(node);return node;}
  function button(text,parent,fn){var b=el('button',text);b.type='button';parent.appendChild(b);b.addEventListener('click',fn);return b;}
  function clean(text){return String(text||'').replace(/\s+/g,' ').trim();}
  function answerText(box){
    var copy=box.cloneNode(true);
    copy.querySelectorAll('.bm-answer-head,.bm-answer-orig,.bm-label-replaced,.bm-selfcheck,button,input,textarea,select').forEach(function(node){node.remove();});
    copy.querySelectorAll('li,p').forEach(function(node){node.appendChild(document.createTextNode(' '));});
    return clean(copy.textContent).replace(/^✓\s*תשובה (?:מוצעת|אפשרית)\s*:\s*/, '');
  }
  var glossary={
    verse:['פסוק','יחידת טקסט בתנ״ך שמסומנת במספר בתוך הפרק.'],
    commentator:['פרשן','מי שמסביר את המקור; יש להבחין בין דבריו לבין לשון המקור.'],
    pshat:['פשט','הסבר הפסוק לפי לשונו והקשרו.'],
    midrash:['מדרש','דרך של חז״ל לפרש וללמוד מן המקרא, מעבר לקריאה הפשוטה של לשונו.'],
    prophecy:['נבואה','מסר מאת ה׳ שנמסר באמצעות נביא.'],
    covenant:['ברית','קשר של התחייבות; בפרק בודקים מי הצדדים ומה תוכן ההתחייבות.'],
    exile:['גלות','חיים מחוץ לארץ או למקום שממנו העם הוגלה.'],
    mitzvah:['מצווה','ציווי; בשיעור בודקים מה נדרש לעשות או ממה נדרש להימנע.'],
    reason:['שורש המצווה','הטעם והרעיונות שבעל ספר החינוך מציע להסבר המצווה.'],
    rule:['דין','כלל הלכתי; חשוב לבדוק למי הוא מתייחס ובאילו תנאים.'],
    loan:['הלוואה','נתינת כסף או דבר אחר לשימוש, מתוך התחייבות להחזירו.'],
    interest:['ריבית','תוספת שנדרשת בהקשר של הלוואה; את פרטי האיסור לומדים מן המקורות בשיעור.'],
    pledge:['משכון','נכס שניתן כבטוחה לחוב.'],
    charity:['צדקה','סיוע למי שנזקק לו; בשיעור נלמדים המקורות והדינים הנוגעים לכך.'],
    root:['שורש','אותיות היסוד של משפחת מילים; מזהים אותו לפי המילה וההקשר.'],
    pattern:['משקל','תבנית של שם הנוצרת בשילוב אותיות שורש, ניקוד ולעיתים אותיות נוספות.'],
    binyan:['בניין','תבנית של פועל; למשל קל, נפעל, פיעל והפעיל.'],
    affix:['צורן','רכיב בעל משמעות שמצטרף לבסיס ויוצר מילה או צורה.'],
    participle:['בינוני','צורה המשמשת לציון הווה בפועל, ויכולה לשמש גם כשם או כתואר לפי ההקשר.'],
    action:['שם פעולה','שם המציין את הפעולה עצמה, למשל כתיבה או הליכה.']
  };
  var order=kind==='grammar'?['root','pattern','binyan','affix','participle','action']:kind==='chinuch'?['reason','mitzvah','rule','commentator','verse']:kind==='sources'?['rule','loan','interest','pledge','charity','verse','commentator']:['verse','commentator','prophecy','pshat','midrash','covenant','exile'];
  if(page!=='yonah-1-2.html'){
    var dictionary=details('מילון קצר למילים שבשיעור'),dl=el('dl');dictionary.appendChild(dl);
    var found=order.filter(function(key){return source.textContent.includes(glossary[key][0]);}).slice(0,6);
    if(!found.length)found=kind==='grammar'?['root','pattern']:['verse','commentator'];
    found.forEach(function(key){dl.appendChild(el('dt',glossary[key][0]));dl.appendChild(el('dd',glossary[key][1]));});
  }
  if(!start.querySelector('[data-builder-part]')){
    var builder=details(kind==='grammar'?'בונים פתרון: תשובה, דרך ובדיקה':'בונים תשובה: טענה, ראיה והסבר');
    builder.appendChild(el('p','זו טיוטה אישית שנשמרת במכשיר הזה. היא אינה נשלחת למורה ואינה נבדקת אוטומטית. לאחר שבדקתם אותה, העתיקו אותה לשדה השאלה המתאימה.'));
    var labels=kind==='grammar'?['1. תשובה — מה מצאתם?','2. דרך הפתרון — איך הגעתם לתשובה?','3. בדיקה — איזו דוגמה תומכת בפתרון?']:['1. טענה — מה התשובה לשאלה?','2. ראיה — ציטוט קצר והפניה למקור','3. הסבר — איך הראיה תומכת בטענה?'];
    var placeholders=kind==='grammar'?['השורש / המשקל / הבניין הוא...','זיהיתי... ולכן...','השוויתי למילה...']:['לפי המקור או הפרשן...','בפסוק / במקור... נאמר...','המקור מלמד ש...'];
    labels.forEach(function(label,i){var wrap=el('label',label),field=el('textarea');field.dataset.builderPart=String(i);field.placeholder=placeholders[i];wrap.appendChild(field);builder.appendChild(wrap);});
    var make=el('button','מציגים את הטיוטה');make.type='button';make.dataset.buildAnswer='';builder.appendChild(make);
    var clear=el('button','ניקוי הטיוטה');clear.type='button';clear.dataset.builderClear='';builder.appendChild(clear);
    var result=el('p',null,'bm-builder-result');result.dataset.builderResult='';result.hidden=true;result.setAttribute('role','status');builder.appendChild(result);
  }
  var storeKey='bm-lesson-review-v1:'+page,review={};
  try{var saved=JSON.parse(localStorage.getItem(storeKey)||'{}');if(saved && typeof saved==='object' && !Array.isArray(saved))review=saved;}catch(e){}
  var cards=Array.prototype.slice.call(document.querySelectorAll('.question-block')).filter(function(block){return !block.closest('.bagrut-block,.bagrut-part,[data-stage="bagrut"]') && block.querySelector('.q-text') && block.querySelector('.hint-box');}).map(function(block,i){var field=block.querySelector('[data-id]');return {id:field?field.dataset.id:'card-'+i,question:clean(block.querySelector('.q-text').textContent),answer:answerText(block.querySelector('.hint-box'))};}).filter(function(card){return card.question && card.answer;});
  if(cards.length){
    var session=details('חזרה קצרה: נזכרים לפני שמציצים');
    session.appendChild(el('p','נסו לענות בעל פה, ואז פתחו את התשובה המוצעת. הסימון הוא בדיקה עצמית שלכם. שאלות שסימנתם לחזרה יוצגו קודם בסבב הבא.'));
    var counter=el('p',null,'bm-review-count');counter.setAttribute('role','status');session.appendChild(counter);
    var question=el('p',null,'bm-review-question');session.appendChild(question);
    var answer=el('p',null,'bm-builder-result');answer.hidden=true;session.appendChild(answer);
    var actions=el('div',null,'bm-review-actions');session.appendChild(actions);
    var chosen=[],current=0;
    var reveal=button('הצגת תשובה מוצעת',actions,function(){answer.textContent=chosen[current].answer;answer.hidden=false;reveal.hidden=true;remember.disabled=false;again.disabled=false;});
    function mark(value){review[chosen[current].id]=value;try{localStorage.setItem(storeKey,JSON.stringify(review));}catch(e){}remember.disabled=true;again.disabled=true;counter.textContent=(value==='again'?'סומן לחזרה.':'סימנתם שזכרתם. זהו דיווח עצמי.')+' כרטיס '+(current+1)+' מתוך '+chosen.length;}
    var remember=button('זכרתי',actions,function(){mark('remember');});
    var again=button('רוצה לתרגל שוב',actions,function(){mark('again');});
    var next=button('הכרטיס הבא',actions,function(){if(current<chosen.length-1){current++;render();}else{counter.textContent='סיימתם את החזרה הקצרה. אפשר לחזור לתרגיל או להתחיל סבב נוסף.';next.disabled=true;}});
    button('סבב נוסף',actions,function(){selectCards();render();});
    button('איפוס סימוני החזרה',actions,function(){review={};try{localStorage.removeItem(storeKey);}catch(e){}selectCards();render();counter.textContent='סימוני החזרה אופסו. כרטיס 1 מתוך '+chosen.length;});
    function selectCards(){var flagged=cards.filter(function(c){return review[c.id]==='again';}),rest=cards.filter(function(c){return review[c.id]!=='again';});for(var i=rest.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),temp=rest[i];rest[i]=rest[j];rest[j]=temp;}chosen=flagged.concat(rest).slice(0,3);current=0;}
    function render(){question.textContent=chosen[current].question;answer.hidden=true;answer.textContent='';reveal.hidden=false;remember.disabled=true;again.disabled=true;next.disabled=false;next.textContent=current===chosen.length-1?'סיום החזרה':'הכרטיס הבא';counter.textContent='כרטיס '+(current+1)+' מתוך '+chosen.length;}
    selectCards();render();
  }
  var reading=document.querySelector('.story-summary') || document.querySelector('[data-stage="explain"] .card-body') || document.querySelector('#grid .card-body');
  if(reading && !document.querySelector('[data-read-story]')){
    reading.classList.add('bm-readable-intro');
    var controls=el('div',null,'bm-read-controls'),play=el('button','הקראת ההסבר');play.type='button';play.dataset.readStory='';controls.appendChild(play);
    var stop=el('button','עצירה');stop.type='button';stop.dataset.stopReading='';stop.disabled=true;controls.appendChild(stop);
    var label=el('label','מהירות '),speed=el('select');speed.dataset.readSpeed='';
    [['0.8','איטית'],['1','רגילה']].forEach(function(pair){var option=el('option',pair[1]);option.value=pair[0];option.selected=pair[0]==='1';speed.appendChild(option);});label.appendChild(speed);controls.appendChild(label);
    var note=el('span');note.dataset.readNote='';note.setAttribute('role','status');controls.appendChild(note);reading.insertAdjacentElement('afterend',controls);
  }
})();
