/* ============================================================
   מחוון למורה ביחידות הגזרות בעברית
   ============================================================
   אותו דף בדיוק, עם כל התשובות: ivrit-XXX-unit.html?key=1
   - נפתח רק למורה (כניסה לאזור האישי, או קוד המחוונים).
   - כל שדה מתמלא בתשובה הנכונה: בתרגול לפי CORRECT_ANSWERS של הדף,
     בשאלות הבגרות לפי data-answer. בשאלות פתוחות - תשובה לדוגמה (data-model).
   - השדות נעולים, ולא נשמר שום דבר במכשיר (הערכים לא נכתבים דרך אירועי input).
   ============================================================ */
(function(){
  "use strict";
  if(!/[?&]key(=|&|$)/.test(location.search)) return;
  var ANSWERS_CODE = "5703531"; /* אותו קוד כמו בשאר דפי המחוונים */
  var root = document.documentElement;
  root.classList.add("ak-mode");

  function arr(x){ return Array.prototype.slice.call(x); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); }
  function unlocked(){
    try{ return sessionStorage.getItem("teacherAreaUnlocked") === "1" || !!sessionStorage.getItem("bm-teacher-token"); }
    catch(e){ return false; }
  }

  var css = document.createElement("style");
  css.textContent =
    ".ak-banner{position:sticky;top:0;z-index:50;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;padding:10px 16px;background:#1F4E46;color:#fff;font-size:1rem;line-height:1.5;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.15)}" +
    ".ak-banner a{color:#fff}" +
    ".ak-banner button{min-height:40px;padding:6px 16px;border:0;border-radius:10px;background:#fff;color:#1F4E46;font:inherit;font-weight:700;cursor:pointer}" +
    ".ak-banner button:focus-visible{outline:3px solid #FFB86B;outline-offset:2px}" +
    ".ak-mode.ak-on .student-bar,.ak-mode.ak-on .privacy-note,.ak-mode.ak-on .progress-wrap,.ak-mode.ak-on .save-note," +
    ".ak-mode.ak-on .up-sendbox,.ak-mode.ak-on #sendToTeacherBtn,.ak-mode.ak-on #bmSendLast,.ak-mode.ak-on #bmSendPanel,.ak-mode.ak-on #clearBtn," +
    ".ak-mode.ak-on #checkAnswersBtn,.ak-mode.ak-on .gzb-tools,.ak-mode.ak-on .up-note,.ak-mode.ak-on .bm-send-gate-note{display:none !important}" +
    ".ak-mode.ak-on .answer.ak-ans{background:#EAF6EF !important;border-color:#2E7D4F !important;color:#14422A !important;font-weight:600;opacity:1;-webkit-text-fill-color:#14422A}" +
    ".ak-mode.ak-on select.answer.ak-ans{cursor:default}" +
    ".ak-mode.ak-on .answer.ak-open{background:#FFFBEF !important;border-style:dashed !important}" +
    ".ak-alt{display:block;margin-top:3px;font-size:.82rem;color:#2E5E4E;line-height:1.4}" +
    ".ak-model{display:block;margin-top:5px;padding:6px 10px;border-radius:8px;background:#FFF4DC;border:1px solid #EBCB8B;color:#5A3E1E;font-size:.92rem;line-height:1.55}" +
    ".ak-model b{color:#7A4A12}" +
    "@media print{.ak-banner{position:static;box-shadow:none}}";
  document.head.appendChild(css);

  var banner = document.createElement("div");
  banner.className = "ak-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "מחוון למורה");
  banner.textContent = "🗝️ טוען את המחוון…";
  document.body.insertBefore(banner, document.body.firstChild);
  var plain = location.pathname.split("/").pop() || "";

  function lockedView(){
    banner.innerHTML = '<span>🔒 זהו מחוון למורה. כדי לראות את התשובות צריך להיכנס לאזור האישי, או להקליד את קוד המחוונים.</span>' +
      '<button type="button" id="akUnlock">פתחו את המחוון</button>';
    document.getElementById("akUnlock").addEventListener("click", function(){
      var code = prompt("הקלידו את קוד המחוונים:");
      if(code === null) return;
      if(code.trim() === ANSWERS_CODE){
        try{ sessionStorage.setItem("teacherAreaUnlocked", "1"); }catch(e){}
        fill();
      } else {
        alert("קוד שגוי. נסו שוב.");
      }
    });
  }

  function altNote(f, alts){
    var extra = alts.slice(1).filter(Boolean);
    if(!extra.length || f.tagName === "SELECT") return;
    var shown = extra.slice(0, 4).join(" · ") + (extra.length > 4 ? " ועוד" : "");
    var s = document.createElement("span");
    s.className = "ak-alt";
    s.textContent = "מתקבל גם: " + shown;
    f.parentNode.insertBefore(s, f.nextSibling);
  }
  function modelNote(f, text){
    var s = document.createElement("span");
    s.className = "ak-model";
    s.innerHTML = "<b>תשובה לדוגמה:</b> " + esc(text);
    f.parentNode.insertBefore(s, f.nextSibling);
  }

  var done = false;
  function fill(){
    if(done) return;
    done = true;
    root.classList.add("ak-on");
    banner.innerHTML = '<span>🗝️ <b>מחוון למורה</b> - אותו דף כמו אצל התלמידים, עם כל התשובות. השדות נעולים, ושום דבר לא נשמר.</span>' +
      '<a href="' + esc(plain) + '">לדף של התלמידים ›</a>';
    var CA = null;
    try{ CA = (typeof CORRECT_ANSWERS !== "undefined") ? CORRECT_ANSWERS : null; }catch(e){ CA = null; }

    arr(document.querySelectorAll("input.answer, select.answer, textarea.answer")).forEach(function(f){
      if(f.type === "radio" || f.type === "checkbox" || f.hasAttribute("data-bm-persist")) return;
      var id = f.getAttribute("data-id");
      var ans = f.getAttribute("data-answer");
      var model = f.getAttribute("data-model");
      f.classList.remove("is-correct", "is-wrong");
      var m = f.nextElementSibling;
      if(m && m.classList.contains("check-mark")){ m.textContent = ""; m.className = "check-mark"; }
      if(ans){
        var alts = ans.split("|");
        f.value = alts[0];
        f.classList.add("ak-ans");
        altNote(f, alts);
      } else if(CA && id && Object.prototype.hasOwnProperty.call(CA, id)){
        f.value = String(CA[id]).split("/").map(function(s){ return s.trim(); }).join(" / ");
        f.classList.add("ak-ans");
      } else {
        f.value = "";
        f.placeholder = "שאלה פתוחה - נבדקת על ידי המורה";
        f.classList.add("ak-open");
        if(model) modelNote(f, model);
      }
      if(f.tagName === "SELECT") f.disabled = true; else f.readOnly = true;
      f.setAttribute("aria-readonly", "true");
    });

    /* תשובות לדוגמה שקיימות כבר בדף (שאלות ההסבר) - פתוחות ומוצגות */
    arr(document.querySelectorAll("details")).forEach(function(d){
      var sm = d.querySelector("summary");
      if(sm && /תשוב/.test(sm.textContent)){
        d.classList.remove("up-hide");
        d.hidden = false;
        d.open = true;
        sm.textContent = "תשובה לדוגמה";
      }
    });
  }

  function start(){ if(unlocked()) fill(); else lockedView(); }
  /* ממלאים אחרי שכל הסקריפטים של הדף שחזרו תשובות שמורות */
  if(document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
