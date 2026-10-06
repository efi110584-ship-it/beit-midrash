/* Shared lesson controls; all drafts stay on this device. */
(function(){
  'use strict';
  var start=document.querySelector('.bm-lesson-start');
  if(!start) return;
  start.querySelector('[data-lesson-start]').addEventListener('click',function(){
    var task=document.querySelector('.bm-taskbar') || document.querySelector('#grid');
    if(task){task.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});var h=task.querySelector('h2,button');if(h) h.focus();}
  });
  var page=location.pathname.split('/').pop();
  var key=page==='yonah-1-2.html'?'bm-yonah-answer-builder-v1':'bm-answer-builder-v1:'+page;
  var fields=Array.prototype.slice.call(start.querySelectorAll('[data-builder-part]'));
  var result=start.querySelector('[data-builder-result]');
  try{var saved=JSON.parse(localStorage.getItem(key)||'[]');fields.forEach(function(f,i){f.value=typeof saved[i]==='string'?saved[i]:'';});}catch(e){}
  fields.forEach(function(f){f.addEventListener('input',function(){try{localStorage.setItem(key,JSON.stringify(fields.map(function(x){return x.value;})));}catch(e){} result.hidden=true;});});
  start.querySelector('[data-build-answer]').addEventListener('click',function(){
    var parts=fields.map(function(f){return f.value.trim();});
    result.textContent=parts.every(Boolean)?parts.join('\n'):'מלאו את שלושת החלקים כדי לקבל טיוטה שלמה.';
    result.hidden=false;
  });
  start.querySelector('[data-builder-clear]').addEventListener('click',function(){fields.forEach(function(f){f.value='';});result.hidden=true;try{localStorage.removeItem(key);}catch(e){} fields[0].focus();});
  document.querySelectorAll('[data-knowledge-check]').forEach(function(check){
    check.querySelector('button').addEventListener('click',function(){
      var selected=check.querySelector('input:checked');
      var feedback=check.querySelector('[role=status]');
      if(!selected){feedback.textContent='בחרו תשובה ואז בדקו.';return;}
      feedback.textContent=(selected.value==='correct'?'✓ נכון. ':'כדאי לנסות שוב. ')+check.getAttribute('data-explanation');
    });
  });
  var read=document.querySelector('[data-read-story]'), stop=document.querySelector('[data-stop-reading]');
  var note=document.querySelector('[data-read-note]');
  if(!read || !stop || !note) return;
  if(!('speechSynthesis' in window)){read.disabled=true;note.textContent='הקראה אינה נתמכת בדפדפן הזה.';return;}
  var readGeneration=0;
  read.addEventListener('click',function(){
    var generation=++readGeneration;
    speechSynthesis.cancel();
    var text=document.querySelector('.story-summary,.bm-readable-intro');
    if(!text) return;
    var readable=text.cloneNode(true);
    readable.querySelectorAll('textarea,input,select,button,.hint-box,.bm-selfcheck').forEach(function(e){e.remove();});
    var utterance=new SpeechSynthesisUtterance(readable.textContent);
    utterance.lang='he-IL';utterance.rate=Number(document.querySelector('[data-read-speed]').value);
    var voice=speechSynthesis.getVoices().find(function(v){return /^he(?:-|_)/i.test(v.lang);});
    if(voice) utterance.voice=voice;
    note.textContent='הקראה פועלת. איכות העברית תלויה בקולות המותקנים במכשיר.';
    stop.disabled=false;
    utterance.onend=function(){if(generation!==readGeneration)return;note.textContent='ההקראה הסתיימה.';stop.disabled=true;};
    utterance.onerror=function(){if(generation!==readGeneration)return;note.textContent='לא ניתן להקריא כרגע. בדקו אם מותקן קול בעברית במכשיר.';stop.disabled=true;};
    speechSynthesis.speak(utterance);
  });
  stop.addEventListener('click',function(){readGeneration++;speechSynthesis.cancel();stop.disabled=true;note.textContent='ההקראה נעצרה.';});
  window.addEventListener('pagehide',function(){readGeneration++;speechSynthesis.cancel();});
})();
