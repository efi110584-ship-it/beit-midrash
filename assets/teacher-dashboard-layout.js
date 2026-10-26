
window.BM_SUBJECT_LESSON={mount:function(){'use strict';
if(document.getElementById('subject-lesson-form'))return;
var busy=false,uncertain=false;
var panel=document.getElementById('ttPanel-lesson'),oldStart=document.getElementById('ttQuickStart'),starter=oldStart.closest('.tt-card');
function el(tag,text){var e=document.createElement(tag);if(text)e.textContent=text;return e;}
var subjects=[['תנך','תנ״ך','📖'],['תושבע','תושב״ע','📚'],['עברית','עברית','א'],['היסטוריה','היסטוריה','🏛']];
var units=(window.BM_UNITS||[]).filter(function(u){return u.class!=='teacher';});var chosenSubject='תנך';
var wrap=el('section');wrap.className='subject-launcher';var title=el('h3','איזה מקצוע מלמדים?');wrap.append(title);
var tabs=el('div');tabs.className='subject-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','בחירת מקצוע לשיעור');
var form=el('form');form.id='subject-lesson-form';form.setAttribute('role','tabpanel');form.className='subject-form';
var tabButtons=[];subjects.forEach(function(s,i){var b=el('button',s[2]+' '+s[1]);b.type='button';b.id='subject-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',form.id);b.addEventListener('click',function(){chooseSubject(s[0]);});b.addEventListener('keydown',function(e){var next=null;if(e.key==='ArrowLeft')next=(i+1)%subjects.length;if(e.key==='ArrowRight')next=(i+subjects.length-1)%subjects.length;if(e.key==='Home')next=0;if(e.key==='End')next=subjects.length-1;if(next!==null){e.preventDefault();tabButtons[next].click();tabButtons[next].focus();}});tabButtons.push(b);tabs.append(b);});wrap.append(tabs);
var picks=el('div');picks.className='subject-picks';
function field(id,label){var box=el('div'),l=el('label',label),s=el('select');s.id=id;s.required=true;l.htmlFor=id;box.append(l,s);picks.append(box);return s;}
var cls=field('subject-class','1. כיתה'),unit=field('subject-unit','2. יחידה'),page=field('subject-page','3. דף לימוד');
function option(select,value,text){var o=el('option',text);o.value=value;select.append(o);}
option(cls,'','בחרו כיתה');option(cls,'יא','כיתה י״א');option(cls,'יב','כיתה י״ב');form.append(picks);
var status=el('p');status.setAttribute('role','status');status.className='subject-status';form.append(status);
var summary=el('p');summary.className='subject-summary';form.append(summary);
var start=el('button','התחלת שיעור');start.type='submit';start.className='tt-btn tt-btn--primary subject-start';start.disabled=true;form.append(start);
form.append(el('p','לאחר פתיחת שיעור באתר: התלמידים מזינים קוד שיעור ות״ז, בהתאם לרשימת הכיתה השמורה.'));wrap.append(form);
var heading=starter.querySelector('.tt-h');if(heading)heading.textContent='פתיחת שיעור לפי מקצוע';
var intro=starter.querySelector('.tt-sub');if(intro)intro.textContent='מקצוע ← כיתה ← יחידה ודף ← התחלת שיעור. הבחירה מסננת רק את החומרים המתאימים.';
oldStart.hidden=true;var advanced=starter.querySelector('details');if(advanced)advanced.hidden=true;
starter.insertBefore(wrap,starter.querySelector('.td-id-readiness')||oldStart);
var lastHelp=oldStart.nextElementSibling;if(lastHelp&&lastHelp.classList.contains('td-entry-note'))lastHelp.hidden=true;
function matchingUnits(){return units.filter(function(u){return u.subject===chosenSubject&&u.class===cls.value;});}
function chooseSubject(value){chosenSubject=value;subjects.forEach(function(s,i){var active=s[0]===value;tabButtons[i].setAttribute('aria-selected',String(active));tabButtons[i].tabIndex=active?0:-1;if(active)form.setAttribute('aria-labelledby',tabButtons[i].id);});loadUnits();}
function loadUnits(){unit.replaceChildren();option(unit,'','בחרו יחידה');page.replaceChildren();option(page,'','בחרו תחילה יחידה');page.disabled=true;start.disabled=true;start.textContent='התחלת שיעור';summary.textContent='';if(typeof result!=='undefined'&&result)result.hidden=true;var found=matchingUnits();found.forEach(function(u){option(unit,u.key,u.title);});unit.disabled=!cls.value||!found.length;status.textContent=!cls.value?'בחרו כיתה כדי לראות את יחידות המקצוע.':!found.length?'לא נמצאו באתר יחידות במקצוע הזה לכיתה שבחרתם. אפשר לבחור כיתה או מקצוע אחר.':'מוצגות רק יחידות המקצוע והכיתה שבחרתם.';}
function loadPages(){if(typeof result!=='undefined'&&result)result.hidden=true;page.replaceChildren();option(page,'','בחרו דף לימוד');var u=matchingUnits().filter(function(x){return x.key===unit.value;})[0];page.disabled=!u;if(u){option(page,u.url,u.title+' — עמוד היחידה');(u.topics||[]).forEach(function(t){if(t.url&&t.title)option(page,t.url,t.title);});}update();}
function selection(){var u=matchingUnits().filter(function(x){return x.key===unit.value;})[0];if(!u)return null;var pages=[{title:u.title+' — עמוד היחידה',url:u.url}].concat(u.topics||[]);var p=pages.filter(function(x){return x.url===page.value;})[0];if(!p)return null;return {subject:subjects.filter(function(s){return s[0]===chosenSubject;})[0][1],cls:cls.options[cls.selectedIndex].textContent,unit:u.title,page:p.title,url:p.url};}
function update(){var s=selection();start.disabled=!s||busy||uncertain;if(!busy)start.textContent='התחלת שיעור';summary.textContent=s?s.subject+' · '+s.cls+' · '+s.page:'';}
cls.addEventListener('change',loadUnits);unit.addEventListener('change',loadPages);page.addEventListener('change',update);

var result=el('section');result.className='subject-live-result';result.hidden=true;result.setAttribute('aria-label','קוד השיעור');form.append(result);
var recovery=el('button','רענון הקודים הקיימים לפני ניסיון נוסף');recovery.type='button';recovery.hidden=true;recovery.className='tt-btn';form.append(recovery);
var retry=el('button','בדקתי את הקודים — אפשר לפתוח שיעור חדש');retry.type='button';retry.hidden=true;retry.className='tt-btn';form.append(retry);
function token(){try{return sessionStorage.getItem('bm-teacher-token')||'';}catch(e){return '';}}
async function post(data){var auth=token();if(!auth)throw Error('יש להיכנס לאזור האישי לפני פתיחת שיעור.');var response=await fetch(window.BM_API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({},data,{password:auth}))});if(!response.ok)throw Error('אין חיבור תקין לשרת.');var r=await response.json();if(token()!==auth)throw Error('הכניסה למורה השתנתה. היכנסו שוב.');if(!r||!r.ok)throw Error((r&&r.error)||'הפעולה לא הושלמה.');return r;}
function pick(code,until){try{sessionStorage.setItem('bm-live-code',code);}catch(e){}if(window.BM_TEACHER_ROOM)window.BM_TEACHER_ROOM.set(code,until);document.dispatchEvent(new CustomEvent('bm-lesson-changed',{detail:{code:code}}));if(window.BM_QUICK_LESSON)window.BM_QUICK_LESSON.refresh().catch(function(){});}
function showCreated(r,s){result.replaceChildren();result.hidden=false;result.append(el('h4','השיעור מוכן'),el('p',s.subject+' · '+s.cls+' · '+s.page));var code=el('strong',r.code);code.className='subject-real-code';code.setAttribute('aria-label','קוד השיעור: '+r.code.split('').join(' '));result.append(code,el('p','התלמידים מזינים קוד זה בדף הבית, ואז ת״ז אם קיימת לכיתה רשימה שמורה. בקרת השיעור פעילה וגלויה לתלמידים.'));var link=el('a','פתיחת דף השיעור ←');link.href=s.url;link.className='tt-btn tt-btn--primary';result.append(link);}
form.addEventListener('submit',async function(e){e.preventDefault();var s=selection();if(!s||busy||uncertain)return;if(!token()){status.textContent='יש להיכנס לאזור האישי לפני פתיחת שיעור.';return;}if(!/^[\w.-]+\.html(#[\w-]+)?$/.test(s.url)){status.textContent='כתובת דף לא תקינה.';return;}
 busy=true;start.disabled=true;cls.disabled=unit.disabled=page.disabled=true;tabButtons.forEach(function(b){b.disabled=true;});status.textContent='יוצר קוד לשיעור…';result.hidden=true;
 try{var response=await post({action:'createLesson',url:s.url,label:(s.unit+' · '+s.page).slice(0,120),monitor:true,cls:cls.value});if(!/^[0-9]{4}$/.test(String(response.code))||!Number.isFinite(Number(response.until))||Number(response.until)<=Date.now())throw Error('לא התקבל קוד תקין.');response.code=String(response.code);pick(response.code,Number(response.until));showCreated(response,s);status.textContent='✓ השיעור נפתח. הקוד מוביל ישירות לדף שבחרתם.';start.textContent='השיעור נפתח';}
 catch(error){uncertain=true;recovery.hidden=false;status.textContent=error.message+' ייתכן שהקוד נוצר אך התשובה לא הגיעה. בדקו את הקודים הקיימים לפני פתיחה נוספת.';}
 finally{busy=false;cls.disabled=false;unit.disabled=false;page.disabled=false;tabButtons.forEach(function(b){b.disabled=false;});start.disabled=true;}
});
recovery.addEventListener('click',async function(){if(busy)return;busy=true;recovery.disabled=true;try{var r=await post({action:'lessonsList'});var list=(r.lessons||[]).filter(function(l){return l.monitor===true&&/^[0-9]{4}$/.test(String(l.code))&&Number(l.until)>Date.now();});result.replaceChildren();result.hidden=false;result.append(el('h4','הקודים הפעילים'));list.forEach(function(l){var row=el('p','כיתה '+(l.cls==='יב'?'י״ב':'י״א')+' · קוד '+l.code+' · '+(l.label||'שיעור'));var use=el('button','בחירת קוד '+l.code);use.type='button';use.className='tt-btn';use.addEventListener('click',function(){pick(String(l.code),Number(l.until));status.textContent='נבחר קוד קיים '+l.code+'. אפשר להמשיך מהשיעור הפעיל בלי ליצור קוד נוסף.';});row.append(use);result.append(row);});if(!list.length)result.append(el('p','אין קודים פעילים עם בקרה.'));retry.hidden=false;status.textContent='בדקו אם השיעור כבר מופיע ברשימה לפני ניסיון נוסף.';}catch(error){status.textContent=error.message;}finally{busy=false;recovery.disabled=false;}});
retry.addEventListener('click',function(){uncertain=false;retry.hidden=true;recovery.hidden=true;result.hidden=true;update();status.textContent='אפשר לפתוח שיעור חדש כעת.';});
// Main dashboard shortcut opens this picker, not the previous generic start dialog.
oldStart.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();document.getElementById('ttTab-lesson').click();tabButtons.find(function(b){return b.getAttribute('aria-selected')==='true';}).focus();},true);
chooseSubject(chosenSubject);
}};

(function(){'use strict';
window.BM_TEACHER_LAYOUT={mount:function(){
var root=document.getElementById('teacherTools');if(!root||root.dataset.dashboardMounted)return;root.dataset.dashboardMounted='1';
var nav=root.querySelector('.tt-nav');nav.setAttribute('aria-orientation','vertical');
function el(tag,text,cls){var e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;if(cls==='td-shortcut-icon'){var paths={'▶':'<path d="M3 5c3-1 6 0 9 2 3-2 6-3 9-2v14c-3-1-6 0-9 2-3-2-6-3-9-2z"/><path d="M12 7v14"/>','▤':'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>','▥':'<path d="M4 4h6v16H4zM10 4h5v16h-5zM17 4l4 15-4 1-4-15"/>','✉':'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'};e.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[text]||'')+'</svg>';e.setAttribute('aria-hidden','true');}return e;}
var homeTab=el('button',null,'tt-nav-tab');homeTab.type='button';homeTab.id='ttTab-home';homeTab.dataset.panel='home';homeTab.setAttribute('role','tab');homeTab.setAttribute('aria-controls','ttPanel-home');homeTab.setAttribute('aria-selected','false');homeTab.tabIndex=-1;homeTab.append(el('span','⌂','tt-nav-icon'),el('span','המסך הראשי','tt-nav-label'));nav.prepend(homeTab);
[['lesson','ניהול שיעור'],['board','עבודות וציונים'],['keys','חומרי הוראה'],['exams','הודעות ומועדים']].forEach(function(x){var t=document.getElementById('ttTab-'+x[0]);t.querySelector('.tt-nav-label').textContent=x[1];nav.append(t);});
var home=el('div',null,'tt-panel td-home');home.id='ttPanel-home';home.setAttribute('role','tabpanel');home.setAttribute('aria-labelledby','ttTab-home');home.hidden=true;
home.append(el('p','בית מדרש · סביבת המורה','td-eyebrow'),el('h2','שלום, הרב אפרים','td-title'),el('p','מה נלמד היום?','td-subtitle'));
var quick=el('div',null,'td-quick');function go(id){document.getElementById('ttTab-'+id).click();}
[['▶','התחלת שיעור','בחירת כיתה וקוד לתלמידים','lesson','ttQuickStart'],['▤','עבודות לבדיקה','הגשות, ציונים ומשוב','board',null],['▥','מחוונים','תשובות וחומרי הוראה','keys','tkSearch'],['✉','הודעה לתלמידים','פרסום הודעה בעמוד הבית','exams','ttAnnounce']].forEach(function(x){var b=el('button',null,'td-shortcut');b.type='button';b.append(el('span',x[0],'td-shortcut-icon'),el('strong',x[1]),el('span',x[2],'td-shortcut-note'));b.addEventListener('click',function(){go(x[3]);if(x[4]){var target=document.getElementById(x[4]);target.focus();if(x[4]==='ttQuickStart')target.click();}});quick.append(b);});home.append(quick);
var overview=el('section',null,'td-overview');overview.append(el('h3','מה דורש טיפול?'));var pending=el('p','מצב ההגשות יופיע לאחר טעינת הנתונים.');overview.append(pending);home.append(overview);
var hero=el('section',null,'td-study-hero');
var heroText=el('div',null,'td-study-copy');heroText.append(el('h3','מתחילים שיעור'),el('p','פותחים כיתה, מזמינים את התלמידים ומתחילים ללמוד.'));
var startButton=quick.children[0];startButton.querySelector('strong').textContent='בחירת כיתה ופתיחת שיעור';heroText.append(startButton);hero.append(heroText);home.insertBefore(hero,quick);
var lower=el('div',null,'td-lower');var recent=el('section',null,'td-recent');
var recentTitle=el('h3','חוזרים לחומר האחרון');recent.append(recentTitle);
var unitList=window.BM_UNITS||[];var teacherUnits=unitList.filter(function(u){return u.class==='teacher';});var recentCards=el('div',null,'td-materials');recent.append(recentCards);
function recentData(){var urls=[];try{var list=JSON.parse(localStorage.getItem('bm-teacher-recent')||'[]');if(Array.isArray(list))urls=list.filter(function(url){return typeof url==='string';});}catch(e){}var found=[];urls.forEach(function(url){var unit=teacherUnits.filter(function(u){return u.url===url;})[0];if(unit&&!found.some(function(u){return u.url===unit.url;}))found.push(unit);});return found.slice(0,2);}
function drawRecent(){recentCards.replaceChildren();var units=recentData();recentTitle.textContent=units.length?'חוזרים לחומר האחרון':'חומרי הוראה בהישג יד';
if(!units.length){var bible=teacherUnits.filter(function(u){return /בראשית/.test(u.title+' '+u.category);})[0],hebrew=teacherUnits.filter(function(u){return /עברית/.test(u.category);})[0];units=[bible,hebrew].filter(Boolean);}
units.forEach(function(u){var a=el('a',null,'td-material');a.href=u.url;var hebrew=/עברית/.test(u.category);var visual=el('span',null,hebrew?'td-material-visual td-material-hebrew':'td-material-visual td-material-bible');visual.setAttribute('aria-hidden','true');if(hebrew)visual.append(el('span','א ב ג'));a.append(visual,el('strong',String(u.title).replace(/^מחוון (תשובות|מרוכז)\s*[-–—]\s*/,'')),el('span',u.category||'חומרי הוראה','td-material-category'));a.addEventListener('click',function(){var urls=[];try{var old=JSON.parse(localStorage.getItem('bm-teacher-recent')||'[]');if(Array.isArray(old))urls=old.filter(function(url){return typeof url==='string'&&url!==u.url;});localStorage.setItem('bm-teacher-recent',JSON.stringify([u.url].concat(urls).slice(0,4)));}catch(e){}});recentCards.append(a);});
if(!units.length)recentCards.append(el('p','חומרי ההוראה זמינים דרך התפריט והחיפוש.'));}
drawRecent();document.getElementById('ttPanel-keys').addEventListener('click',function(){setTimeout(drawRecent,0);});
var openKeys=el('button','כל חומרי ההוראה ←','tt-btn td-all-materials');openKeys.type='button';openKeys.addEventListener('click',function(){go('keys');document.getElementById('tkSearch').focus();});recent.append(openKeys);lower.append(recent);
var notes=el('section',null,'td-notes');notes.append(el('h3','מקום לרעיונות לשיעור'),el('p','מחשבה, שאלה לדיון או משהו לזכור לפעם הבאה.'));var note=el('textarea');note.id='td-private-note';note.maxLength=3000;note.rows=5;note.placeholder='הרעיונות שלי…';note.setAttribute('aria-label','רעיונות אישיים לשיעור');var noteStatus=el('p','נשמר רק בדפדפן הזה; לא נשלח לתלמידים.','td-note-status');noteStatus.setAttribute('role','status');try{note.value=localStorage.getItem('bm-teacher-private-note-v1')||'';}catch(e){noteStatus.textContent='השמירה המקומית אינה זמינה בדפדפן הזה.';}note.addEventListener('input',function(){try{localStorage.setItem('bm-teacher-private-note-v1',note.value);noteStatus.textContent='נשמר בדפדפן הזה בלבד.';}catch(e){noteStatus.textContent='לא ניתן לשמור כעת. העתיקו את הטקסט לפני היציאה.';}});notes.append(note,noteStatus);lower.append(notes);home.append(lower);root.append(home);

var announcement=document.getElementById('ttAnnounce');if(announcement)document.getElementById('ttPanel-exams').prepend(announcement.closest('.tt-card'));
[['lesson','ניהול שיעור','התחלת שיעור, קוד לתלמידים וכלי הכיתה במקום אחד.'],['board','עבודות וציונים','בדיקה ← עיון ואישור ← שליחה לתלמיד.'],['keys','חומרי הוראה','חיפוש מחוונים ומבחנים לפי מקצוע ונושא.'],['exams','הודעות ומועדים','הודעות לתלמידים ולוח המבחנים.']].forEach(function(p){var header=el('header',null,'td-panel-header');header.append(el('h2',p[1],'td-title'),el('p',p[2],'td-subtitle'));document.getElementById('ttPanel-'+p[0]).prepend(header);});

// A single lesson-entry route; retain the original controls and all IDs.
var lessonPanel=document.getElementById('ttPanel-lesson'),startControl=document.getElementById('ttQuickStart'),roster=document.getElementById('ttRoster');
if(lessonPanel&&startControl&&roster){
 var starter=startControl.closest('.tt-card');starter.classList.add('td-lesson-start');
 var intro=starter.querySelector('.tt-sub');if(intro)intro.textContent='בוחרים כיתה ומקבלים קוד. התלמידים מזינים את הקוד בדף הבית, ואז את תעודת הזהות שלהם.';
 var heading=starter.querySelector('.tt-h');if(heading)heading.textContent='פתיחת שיעור — כניסה עם ת״ז';
 startControl.textContent='בחירת כיתה ופתיחת שיעור';
 var status=document.getElementById('ttRosterNow');var readiness=el('section',null,'td-id-readiness');readiness.setAttribute('aria-label','מצב רשימות הכיתה לכניסה עם תעודת זהות');readiness.append(el('strong','כניסה עם תעודת זהות'));
 if(status)readiness.append(status);
 readiness.append(el('p','הכניסה עם ת״ז מופעלת בכיתה שיש לה רשימה שמורה. בלי רשימה המערכת עדיין מאפשרת כניסה בשם — כמו בגרסה הקיימת.','td-entry-note'));starter.insertBefore(readiness,startControl);
 var help=el('p','לאחר הכניסה: פותחים את דף הלימוד ולוחצים בסרגל על ״העבר את הכיתה לכאן״. אין צורך ליצור קוד נוסף.','td-entry-note');startControl.insertAdjacentElement('afterend',help);
 var activity=document.getElementById('ttAct');if(activity){activity.hidden=true;activity.setAttribute('aria-hidden','true');}
 var advanced=starter.querySelector('details');if(advanced){advanced.classList.add('td-lesson-advanced');var sum=advanced.querySelector('summary');if(sum)sum.textContent='אפשרויות מתקדמות לפתיחת שיעור';}
 var toolsNote=el('p','סקר, ענן מילים ושאר פעילויות הכיתה זמינים בסרגל הצד בכל דף שיעור.','td-entry-note td-tools-note');lessonPanel.append(toolsNote);
 function foldCard(card,label){if(!card)return;var fold=el('details',null,'td-lesson-fold'),summary=el('summary',label);card.insertAdjacentElement('beforebegin',fold);fold.append(summary,card);return fold;}
 foldCard(roster,'ניהול רשימות הכיתה לכניסה עם ת״ז');
 foldCard(document.getElementById('ttReports'),'דוחות של שיעורים קודמים');
 // Put the main entry first, then current lesson monitoring, then occasional setup/report tools.
 var header=lessonPanel.querySelector('.td-panel-header');if(header){var subtitle=header.querySelector('.td-subtitle');if(subtitle)subtitle.textContent='פתיחת שיעור פשוטה, עם מצב הכניסה בתעודת זהות במקום ברור.';}
}

if(window.BM_SUBJECT_LESSON)window.BM_SUBJECT_LESSON.mount();
var badge=document.getElementById('ttNavPending');function update(){pending.textContent=badge&&!badge.hidden?badge.textContent+' הגשות ממתינות לבדיקה. פתח את עבודות וציונים להמשך טיפול.':'לצפייה במצב העבודות העדכני, פתח את עבודות וציונים.';}if(badge)new MutationObserver(update).observe(badge,{attributes:true,childList:true,subtree:true});update();
}};
})();
