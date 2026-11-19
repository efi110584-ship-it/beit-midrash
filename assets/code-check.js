/* בדיקת "קוד המחוונים" בלי לכתוב את הקוד עצמו בדף.
   שומרים רק "טביעת אצבע" מוצפנת (PBKDF2-SHA256, 400,000 סבבים), כך שמי שפותח את קוד הדף לא רואה את הקוד.
   BM_CODE_OK(קלט) מחזיר Promise עם true/false. */
(function(){
  "use strict";
  var SALT = "bm-yeshi-code-v1", ITER = 400000;
  var HASH = "b03a702bf1eaab34431ac43149a370cda6d15ef77a50418f63b858de80d4ba11";
  window.BM_CODE_OK = function(input){
    input = String(input == null ? "" : input).trim();
    if(!input || !window.crypto || !crypto.subtle || !window.TextEncoder) return Promise.resolve(false);
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(input), "PBKDF2", false, ["deriveBits"])
      .then(function(key){
        return crypto.subtle.deriveBits({ name:"PBKDF2", salt:enc.encode(SALT), iterations:ITER, hash:"SHA-256" }, key, 256);
      })
      .then(function(bits){
        var hex = Array.prototype.map.call(new Uint8Array(bits), function(b){ return ("0" + b.toString(16)).slice(-2); }).join("");
        return hex === HASH;
      })
      .catch(function(){ return false; });
  };
})();
