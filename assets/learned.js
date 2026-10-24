/* "✓ למדנו" - סימון של נושאים שכבר נלמדו בכיתה, בכפתורי הנושאים בדפי המרכז (topic-pill).
   כדי לסמן נושא: מוסיפים את המזהה שלו לרשימה של הדף (המזהה הוא מה שבא אחרי "tab-btn-" בכפתור).
   כל התלמידים רואים את הסימון. */
window.BM_LEARNED = {
  "leket-mitzvot-hub.html": ["lo-tasur", "ahavat-gerim", "ahavat-israel", "kibud-avot", "halvaa"]
};

(function(){
  "use strict";
  var page = location.pathname.split("/").pop() || "index.html";
  var keys = (window.BM_LEARNED || {})[page];
  if(!keys || !keys.length) return;
  function run(){
    var st = document.createElement("style");
    st.textContent =
      ".bm-learned-tag{display:inline-flex;align-items:center;gap:2px;margin-inline-start:6px;padding:1px 7px;border-radius:999px;" +
      "background:#E3F4EC;color:#0A6B4C;font-size:.72rem;font-weight:700;white-space:nowrap}" +
      ".topic-pill[aria-selected=\"true\"] .bm-learned-tag{background:#fff;color:#0A6B4C}" +
      "@media print{.bm-learned-tag{display:none}}";
    document.head.appendChild(st);
    keys.forEach(function(k){
      var b = document.getElementById("tab-btn-" + k);
      if(!b || b.querySelector(".bm-learned-tag")) return;
      var t = document.createElement("span");
      t.className = "bm-learned-tag";
      t.textContent = "✓ למדנו";
      b.appendChild(t);
      var label = b.getAttribute("aria-label");
      b.setAttribute("aria-label", (label || b.textContent.replace("✓ למדנו", "").trim()) + " - למדנו כבר");
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
