/* כתובת סקריפט השרת (Google Apps Script) - מקום אחד לכל האתר.
   כל מי ששולח לשרת קורא מכאן: טופס ההגשה, כפתור "שלחו למורה",
   ודף הבית (הודעה מהמורה, קוד לשיעור, לוח הגשות ואזור אישי).
   אחרי פריסה חדשה של הסקריפט - מחליפים כאן את הכתובת, ורק כאן. */
window.BM_API_URL = 'https://script.google.com/macros/s/AKfycbwkhxAu28oe10-Mli0tSUj-pb0rpxGmEioPdquopkPrnIvKw2TZmZw1PmlwhDZ3AUSPXw/exec';

/* "חדר" = קוד השיעור. כל מורה מפעיל פעילות (ענן מילים, הצבעה, סקר) ולוח שאלות
   לתלמידים של הקוד שלו, וכך כמה מורים עובדים במקביל בלי להפריע זה לזה.
   BM_ROOM()            - הקוד שהתלמיד הקליד (ריק = בלי קוד)
   BM_TEACHER_ROOM.get() / .set(code, until) - לאיזה שיעור המורה מפעיל עכשיו (נשמר במחשב עד סוף השיעור) */
(function(){
  function item(key){
    try{
      var v = JSON.parse(localStorage.getItem(key) || "null");
      return (v && v.code && (!v.until || v.until > Date.now())) ? v : null;
    }catch(e){ return null; }
  }
  function read(store, key){ var v = item(key); return v ? String(v.code) : ""; }
  window.BM_ROOM = function(){
    /* הקוד האחרון שהתלמיד הקליד (עם בקרה או בלי) - זה שתוקפו נגמר הכי מאוחר */
    var m = item("bm-lesson-mode"), k = item("bm-lesson-key");
    var v = !m ? k : !k ? m : ((k.until || 0) > (m.until || 0) ? k : m);
    return v ? String(v.code) : "";
  };
  /* שם התלמיד בשיעור עם בקרה ננעל במכשיר עד סוף השיעור: גם אחרי "יציאה" וכניסה מחדש
     עם אותו קוד - אותו שם ואותו מזהה. כך אי אפשר להיכנס שוב בשם של תלמיד אחר. */
  window.BM_LESSON_LOCK = {
    get: function(code){
      try{
        var m = JSON.parse(localStorage.getItem("bm-lesson-names") || "{}"), v = m[String(code)];
        return (v && v.name && v.sid && v.until > Date.now()) ? v : null;
      }catch(e){ return null; }
    },
    set: function(code, name, sid, until, tok){
      try{
        var m = JSON.parse(localStorage.getItem("bm-lesson-names") || "{}"), now = Date.now();
        Object.keys(m).forEach(function(k){ if(!(m[k] && m[k].until > now)) delete m[k]; });
        m[String(code)] = { name:name, sid:sid, until:until, tok:tok || "" };
        localStorage.setItem("bm-lesson-names", JSON.stringify(m));
      }catch(e){}
    }
  };
  /* כניסה לשיעור עם תעודת זהות (כשהמורה שמר רשימת כיתה): השרת מחזיר את השם מן הרשימה ואסימון.
     תעודת הזהות לא נשמרת במכשיר. */
  window.BM_LESSON_ID = function(code, id){
    return fetch(window.BM_API_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body:JSON.stringify({ action:"lessonIdentify", code:code, id:id }) }).then(function(r){ return r.json(); });
  };
  /* כניסת מורה לבדיקה לשיעור עם בקרה - עם סיסמת האזור האישי במקום ת"ז. הסיסמה לא נשמרת במכשיר. */
  window.BM_LESSON_TEACHER = function(code, password){
    return fetch(window.BM_API_URL, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body:JSON.stringify({ action:"lessonTeacher", code:code, password:password }) }).then(function(r){ return r.json(); });
  };
  window.BM_LESSON_LOCK.clear = function(code){
    try{
      var m = JSON.parse(localStorage.getItem("bm-lesson-names") || "{}");
      delete m[String(code)];
      localStorage.setItem("bm-lesson-names", JSON.stringify(m));
    }catch(e){}
  };
  window.BM_TEACHER_ROOM = {
    get: function(){ return read(localStorage, "bm-teacher-room"); },
    set: function(code, until){
      try{
        if(code) localStorage.setItem("bm-teacher-room", JSON.stringify({ code:String(code), until:until || Date.now() + 12 * 3600 * 1000 }));
        else localStorage.setItem("bm-teacher-room", JSON.stringify({ code:"", until:0 }));
      }catch(e){}
    }
  };
})();
