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
