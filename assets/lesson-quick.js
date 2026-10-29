/* Teacher lesson controls. Reuses createLesson, lessonsList and lessonNav. */
(function(){
  'use strict';
  if(window.BM_QUICK_LESSON)return;
  var API=window.BM_API_URL;
  if(!API)return;
  var page=location.pathname.split('/').pop() || 'index.html';
  var lessons=[],selected=null,busy=false,loaded=false,refreshing=false,lastRefresh=0,lastToken='';
  var bar,dialog,info,message,sendButton,opener;
  function token(){try{return sessionStorage.getItem('bm-teacher-token') || '';}catch(e){return '';}}
  function storedCode(){try{return sessionStorage.getItem('bm-live-code') || (window.BM_TEACHER_ROOM && window.BM_TEACHER_ROOM.get()) || '';}catch(e){return '';}}
  function labelOfPage(){
    var task=window.BM_TASKS && window.BM_TASKS.findByPage(page);
    if(task)return task.unit.title+(task.topic?' · '+task.topic.title:'');
    var title=document.querySelector('h1');return (title ? title.textContent.trim() : document.title).slice(0,120) || 'דף השיעור';
  }
  function className(cls){return cls==='יב'?'י״ב':'י״א';}
  function canSendPage(){return /^[\w.-]+\.html$/.test(page) && !/answers|^index\.html$|^feedback\.html$|^screen\.html$|^submit(?:-thanks)?\.html$|^bogrim-data\.html$/.test(page);}
  function node(tag,text,cls){var n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function post(data){
    var auth=token();if(!auth)return Promise.reject(Error('יש להיכנס לאזור המורה כדי להפעיל שיעור.'));
    return fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({},data,{password:auth}))})
      .then(function(r){if(!r.ok)throw Error('אין חיבור לשרת כרגע. נסו שוב.');return r.json();})
      .then(function(r){if(token()!==auth)throw Error('הכניסה למורה השתנתה. היכנסו שוב לאזור האישי.');if(!r || !r.ok)throw Error(r && r.auth===false?'הכניסה למורה הסתיימה. היכנסו שוב באזור האישי.':(r && r.error) || 'הפעולה לא הצליחה.');return r;});
  }
  function pick(lesson){
    selected=lesson || null;
    if(selected){
      try{sessionStorage.setItem('bm-live-code',selected.code);}catch(e){}
      if(window.BM_TEACHER_ROOM)window.BM_TEACHER_ROOM.set(selected.code,selected.until);
      document.dispatchEvent(new CustomEvent('bm-lesson-changed',{detail:{code:selected.code}}));
    }
    render();
  }
  function render(){
    if(!bar)return;
    var teacher=!!token();bar.hidden=true;   /* הפס הכחול בתחתית הוסתר לבקשת המורה; החלון של "התחלת שיעור" עדיין נפתח מהאזור האישי */
    document.body.classList.remove('bm-quick-teacher');
    if(!teacher){if(dialog.open)dialog.close();selected=null;return;}
    if(selected && selected.until<=Date.now())selected=null;
    info.textContent=selected?'כיתה '+className(selected.cls)+' · קוד '+selected.code:(loaded?'אין שיעור נבחר':'טוען שיעורים…');
    sendButton.hidden=!selected;
    sendButton.disabled=busy || !selected;
    bar.querySelector('[data-quick-start]').disabled=busy;
    bar.querySelector('[data-quick-switch]').hidden=!lessons.length;
    bar.querySelector('[data-quick-switch]').disabled=busy;
    if(!canSendPage())sendButton.hidden=true;
  }
  function refresh(){
    if(refreshing || !token())return Promise.resolve();
    refreshing=true;lastRefresh=Date.now();
    return post({action:'lessonsList'}).then(function(r){
      // Only monitored lessons can deliver navigation through presence polling.
      lessons=(r.lessons || []).filter(function(l){return l.monitor===true && /^[0-9]{4}$/.test(String(l.code)) && ['יא','יב'].indexOf(l.cls)!==-1 && Number(l.until)>Date.now();});
      var wanted=storedCode();
      selected=lessons.filter(function(l){return l.code===wanted;})[0] || null;
      loaded=true;render();
    }).catch(function(e){message.textContent=e.message;loaded=true;render();}).finally(function(){refreshing=false;});
  }
  function closeDialog(){dialog.close();if(opener && opener.isConnected)opener.focus();}
  function openDialog(){
    if(!token())return;
    opener=document.activeElement;dialog.replaceChildren();
    var heading=node('h2','התחלת שיעור');heading.id='bmQuickTitle';dialog.appendChild(heading);
    dialog.appendChild(node('p','בחרו כיתה וקבלו קוד. התלמידים מקלידים אותו פעם אחת בדף הבית. בקרת השיעור תהיה פעילה וגלויה לתלמידים.'));
    if(lessons.length){
      var label=node('label','שיעור שכבר פעיל');label.htmlFor='bmQuickExisting';dialog.appendChild(label);
      var old=node('select');old.id='bmQuickExisting';var empty=node('option','בחרו שיעור קיים');empty.value='';old.appendChild(empty);
      lessons.forEach(function(l){var option=node('option','כיתה '+className(l.cls)+' · קוד '+l.code);option.value=l.code;old.appendChild(option);});
      dialog.appendChild(old);
      old.addEventListener('change',function(){var lesson=lessons.filter(function(l){return l.code===old.value;})[0];if(lesson){pick(lesson);message.textContent='נבחר שיעור בכיתה '+className(lesson.cls)+'.';closeDialog();}});
      dialog.appendChild(node('p','או התחילו שיעור חדש:'));
    }
    var label=node('label','לאיזו כיתה?');label.htmlFor='bmQuickClass';dialog.appendChild(label);
    var cls=node('select');cls.id='bmQuickClass';
    [['','בחרו כיתה'],['יא','י״א'],['יב','י״ב']].forEach(function(x){var o=node('option',x[1]);o.value=x[0];cls.appendChild(o);});dialog.appendChild(cls);
    var note=node('p');note.setAttribute('role','status');dialog.appendChild(note);
    var actions=node('div',null,'bmq-actions'),start=node('button','התחלת שיעור וקבלת קוד'),cancel=node('button','ביטול');
    start.type=cancel.type='button';start.disabled=true;cancel.addEventListener('click',closeDialog);actions.append(start,cancel);dialog.appendChild(actions);
    cls.addEventListener('change',function(){start.disabled=!cls.value;});
    start.addEventListener('click',function(){
      if(busy || ['יא','יב'].indexOf(cls.value)===-1)return;
      busy=true;start.disabled=true;cls.disabled=true;cancel.disabled=true;render();note.textContent='יוצר קוד לשיעור…';
      // The home page starts in the existing live waiting room; other pages start here.
      var initial=canSendPage()?page:'live.html';
      post({action:'createLesson',url:initial,label:initial==='live.html'?'ממתינים לתחילת השיעור':labelOfPage(),monitor:true,cls:cls.value})
        .then(function(r){
          if(!/^[0-9]{4}$/.test(String(r.code)) || !Number.isFinite(Number(r.until)) || Number(r.until)<=Date.now())throw Error('לא התקבל קוד תקין. רעננו את רשימת השיעורים לפני ניסיון נוסף.');
          var lesson={code:String(r.code),cls:cls.value,until:Number(r.until),monitor:true,url:r.url,label:r.label};
          lessons.unshift(lesson);pick(lesson);
          heading.textContent='השיעור מוכן — כיתה '+className(lesson.cls);
          dialog.replaceChildren(heading,node('p','התלמידים נכנסים לדף הבית ומקלידים את הקוד:'),node('strong',lesson.code,'bmq-code'),node('p','הקוד נשאר איתם גם כשתעבירו אותם לדף אחר. אין צורך ליצור קוד נוסף.'));
          var finish=node('button','ממשיכים לשיעור');finish.type='button';finish.addEventListener('click',closeDialog);dialog.appendChild(finish);finish.focus();
          message.textContent='קוד '+lesson.code+' לכיתה '+className(lesson.cls)+'. פתחו דף ולחצו ״העבר את הכיתה לכאן״.';
        }).catch(function(e){note.textContent=e.message+' אם הקוד נוצר אך התשובה לא הגיעה, בדקו ״בחירת שיעור״ לפני יצירה חוזרת.';cls.disabled=false;cancel.disabled=false;start.disabled=!cls.value;})
        .finally(function(){busy=false;render();});
    });
    dialog.showModal();cls.focus();
  }
  function sendHere(){
    if(busy || !selected || !canSendPage())return;
    if(selected.until<=Date.now()){selected=null;render();message.textContent='תוקף הקוד הסתיים. התחילו שיעור חדש.';return;}
    var lesson=selected;busy=true;render();message.textContent='מעביר את כיתה '+className(lesson.cls)+' לדף הזה…';
    var pos=window.BeitMidrashSteps&&window.BeitMidrashSteps.position?window.BeitMidrashSteps.position():null;
    var hash=pos?'#bmstep-'+pos.step+(pos.key&&/^[\w-]+$/.test(pos.key)?'-'+pos.key:''):'';
    post({action:'lessonNav',code:lesson.code,url:page+hash,label:labelOfPage()+(pos?' · משימה '+pos.step:'')})
      .then(function(){message.textContent='✓ נשלח לכיתה '+className(lesson.cls)+' · קוד '+lesson.code+'. התלמידים המחוברים יעברו לכאן בתוך כ־15 שניות.';})
      .catch(function(e){message.textContent=e.message;})
      .finally(function(){busy=false;render();});
  }
  function mount(){
    var style=node('style');style.textContent='.bmq[hidden],.bmq [hidden]{display:none!important}.bmq{position:fixed;bottom:10px;inset-inline:12px;z-index:9988;display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#0b2a5b;color:#fff;border-radius:14px;padding:12px 16px;box-shadow:0 6px 24px #123a7833;font:16px/1.5 Heebo,Rubik,Arial,sans-serif;direction:rtl}.bmq button,.bmq-dialog button{min-height:44px;border:1px solid #b9c7db;border-radius:10px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer;background:#fff;color:#123a78}.bmq button[data-quick-send]{background:#ffdfad;color:#162e50}.bmq button:disabled,.bmq-dialog button:disabled{opacity:.6;cursor:wait}.bmq-info{font-weight:700}.bmq-message{flex-basis:100%;margin:0;font-size:14px}.bmq-message:empty{display:none}.bm-quick-teacher{padding-bottom:150px!important}.bmq-dialog{max-width:460px;width:calc(100% - 48px);box-sizing:border-box;border:1px solid #ccd5e4;border-radius:18px;padding:24px;color:#10264b;font:17px/1.6 Heebo,Rubik,Arial,sans-serif;direction:rtl;text-align:right}.bmq-dialog::backdrop{background:#10264b88}.bmq-dialog h2{margin-top:0}.bmq-dialog label{display:block;font-weight:700;margin-top:12px}.bmq-dialog select{width:100%;padding:12px;border-radius:10px;font:inherit}.bmq-actions{display:flex;gap:10px;flex-wrap:wrap}.bmq-code{display:block;font-size:56px;text-align:center;direction:ltr;letter-spacing:.12em;color:#123a78}.bmq button:focus-visible,.bmq-dialog :focus-visible{outline:3px solid #ff7a1a;outline-offset:3px}@media(max-width:600px){.bmq{inset-inline:6px;bottom:6px;padding:10px;gap:7px}.bmq button{padding:8px 11px;font-size:14px}.bmq-info{font-size:14px}}@media print{.bmq,.bmq-dialog{display:none!important}.bm-quick-teacher{padding-bottom:0!important}}';document.head.appendChild(style);
    bar=node('section',null,'bmq');bar.hidden=true;bar.setAttribute('aria-label','ניהול השיעור');
    var start=node('button','התחלת שיעור');start.type='button';start.dataset.quickStart='';start.addEventListener('click',openDialog);
    info=node('span',null,'bmq-info');
    var change=node('button','בחירת שיעור');change.type='button';change.dataset.quickSwitch='';change.addEventListener('click',function(){refresh().then(openDialog);});
    sendButton=node('button','העבר את הכיתה לכאן');sendButton.type='button';sendButton.dataset.quickSend='';sendButton.addEventListener('click',sendHere);
    message=node('p',null,'bmq-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
    bar.append(start,info,change,sendButton,message);document.body.appendChild(bar);
    dialog=node('dialog',null,'bmq-dialog');dialog.setAttribute('aria-labelledby','bmQuickTitle');dialog.addEventListener('cancel',function(e){if(busy)e.preventDefault();});document.body.appendChild(dialog);
    window.BM_QUICK_LESSON={open:openDialog,refresh:refresh};
    function sync(){var auth=token();if(auth!==lastToken){lastToken=auth;selected=null;lessons=[];loaded=false;render();if(auth)refresh();}else{render();if(auth && document.visibilityState==='visible' && Date.now()-lastRefresh>60000)refresh();}}
    sync();setInterval(sync,1500);
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')sync();});
    document.addEventListener('bm-quick-start',openDialog);
    document.addEventListener('bm-lesson-changed',function(e){if(e.detail && (!selected || selected.code!==e.detail.code))refresh();});
  }
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
