/* ============================================================
   למורה בלבד, בדפי העבודה:
   1. כפתור "🗝️ מחוון" - פותח בלשונית חדשה את המחוון של הדף
      (לפרק המתאים בדף המחוונים, או לאותו דף עם ?key=1).
   2. "👁 הצג תשובה" ליד כל שאלה, ו"👁 כל התשובות" - מציג את התשובה בתוך הדף עצמו,
      מתוך התשובות שכבר יש בדף (data-answer / data-model / CORRECT_ANSWERS / תשובון בית חינוך ומשפחה).
   מורה = נכנס לאזור האישי (bm-teacher-token) או פתח מחוון בקוד (teacherAreaUnlocked) - כמו class-dock.js.
   תלמידים לא רואים כלום מזה. התשובות מוצגות בתיבה נפרדת ולא נכתבות לשדות התלמיד.
   הכפתורים במרכז התחתון - לא מתנגשים בחלון הכיתה (שמאל) ובמעבר המהיר (ימין).
   ============================================================ */
(function(){
  "use strict";
  var MAP = {
"ahavat-gerim.html": "leket-mitzvot-answers-hub.html#chapter-ahavat-gerim",
"ahavat-israel.html": "leket-mitzvot-answers-hub.html#chapter-ahavat-israel",
"bayit-chinuch-mishpacha.html": "?key=1",
"bereshit-12-questions.html": "bereshit-answers-hub.html#chapter-12",
"bereshit-12-summary.html": "bereshit-answers-hub.html#chapter-12",
"bereshit-12-text.html": "bereshit-answers-hub.html#chapter-12",
"bereshit-12.html": "bereshit-answers-hub.html#chapter-12",
"bereshit-15-questions.html": "bereshit-answers-hub.html#chapter-15",
"bereshit-15-summary.html": "bereshit-answers-hub.html#chapter-15",
"bereshit-15-text.html": "bereshit-answers-hub.html#chapter-15",
"bereshit-15.html": "bereshit-answers-hub.html#chapter-15",
"bereshit-17-questions.html": "bereshit-answers-hub.html#chapter-17",
"bereshit-17-summary.html": "bereshit-answers-hub.html#chapter-17",
"bereshit-17-text.html": "bereshit-answers-hub.html#chapter-17",
"bereshit-17.html": "bereshit-answers-hub.html#chapter-17",
"bereshit-18-questions.html": "bereshit-answers-hub.html#chapter-18",
"bereshit-18-summary.html": "bereshit-answers-hub.html#chapter-18",
"bereshit-18-text.html": "bereshit-answers-hub.html#chapter-18",
"bereshit-18.html": "bereshit-answers-hub.html#chapter-18",
"bereshit-22-questions.html": "bereshit-answers-hub.html#chapter-22",
"bereshit-22-summary.html": "bereshit-answers-hub.html#chapter-22",
"bereshit-22-text.html": "bereshit-answers-hub.html#chapter-22",
"bereshit-22.html": "bereshit-answers-hub.html#chapter-22",
"bereshit-25-questions.html": "bereshit-yaakov-esav-answers-hub.html#chapter-25",
"bereshit-25-summary.html": "bereshit-yaakov-esav-answers-hub.html#chapter-25",
"bereshit-25-text.html": "bereshit-yaakov-esav-answers-hub.html#chapter-25",
"bereshit-25.html": "bereshit-yaakov-esav-answers-hub.html#chapter-25",
"bereshit-27-questions.html": "bereshit-yaakov-esav-answers-hub.html#chapter-27",
"bereshit-27-summary.html": "bereshit-yaakov-esav-answers-hub.html#chapter-27",
"bereshit-27-text.html": "bereshit-yaakov-esav-answers-hub.html#chapter-27",
"bereshit-27.html": "bereshit-yaakov-esav-answers-hub.html#chapter-27",
"bereshit-28-questions.html": "bereshit-yaakov-esav-answers-hub.html#chapter-28",
"bereshit-28-summary.html": "bereshit-yaakov-esav-answers-hub.html#chapter-28",
"bereshit-28-text.html": "bereshit-yaakov-esav-answers-hub.html#chapter-28",
"bereshit-28.html": "bereshit-yaakov-esav-answers-hub.html#chapter-28",
"bereshit-32-questions.html": "bereshit-yaakov-esav-answers-hub.html#chapter-32",
"bereshit-32-summary.html": "bereshit-yaakov-esav-answers-hub.html#chapter-32",
"bereshit-32-text.html": "bereshit-yaakov-esav-answers-hub.html#chapter-32",
"bereshit-32.html": "bereshit-yaakov-esav-answers-hub.html#chapter-32",
"bereshit-37-questions.html": "bereshit-yosef-answers-hub.html#chapter-37",
"bereshit-37-summary.html": "bereshit-yosef-answers-hub.html#chapter-37",
"bereshit-37-text.html": "bereshit-yosef-answers-hub.html#chapter-37",
"bereshit-37.html": "bereshit-yosef-answers-hub.html#chapter-37",
"bereshit-42-questions.html": "bereshit-yosef-answers-hub.html#chapter-42",
"bereshit-42-summary.html": "bereshit-yosef-answers-hub.html#chapter-42",
"bereshit-42-text.html": "bereshit-yosef-answers-hub.html#chapter-42",
"bereshit-42.html": "bereshit-yosef-answers-hub.html#chapter-42",
"bereshit-44-questions.html": "bereshit-yosef-answers-hub.html#chapter-44",
"bereshit-44-summary.html": "bereshit-yosef-answers-hub.html#chapter-44",
"bereshit-44-text.html": "bereshit-yosef-answers-hub.html#chapter-44",
"bereshit-44.html": "bereshit-yosef-answers-hub.html#chapter-44",
"bereshit-45-questions.html": "bereshit-yosef-answers-hub.html#chapter-45",
"bereshit-45-summary.html": "bereshit-yosef-answers-hub.html#chapter-45",
"bereshit-45-text.html": "bereshit-yosef-answers-hub.html#chapter-45",
"bereshit-45.html": "bereshit-yosef-answers-hub.html#chapter-45",
"bereshit-50-questions.html": "bereshit-yosef-answers-hub.html#chapter-50",
"bereshit-50-summary.html": "bereshit-yosef-answers-hub.html#chapter-50",
"bereshit-50-text.html": "bereshit-yosef-answers-hub.html#chapter-50",
"bereshit-50.html": "bereshit-yosef-answers-hub.html#chapter-50",
"bereshit-avraham-exam.html": "?key=1",
"leket-mitzvot-exam.html": "?key=1",
"ezra-1-2-questions.html": "ezra-nechemia-answers-hub.html#chapter-ezra1-2",
"ezra-1-2-summary.html": "ezra-nechemia-answers-hub.html#chapter-ezra1-2",
"ezra-1-2-text.html": "ezra-nechemia-answers-hub.html#chapter-ezra1-2",
"ezra-1-2.html": "ezra-nechemia-answers-hub.html#chapter-ezra1-2",
"ezra-3-4-questions.html": "ezra-nechemia-answers-hub.html#chapter-ezra3-4",
"ezra-3-4-summary.html": "ezra-nechemia-answers-hub.html#chapter-ezra3-4",
"ezra-3-4-text.html": "ezra-nechemia-answers-hub.html#chapter-ezra3-4",
"ezra-3-4.html": "ezra-nechemia-answers-hub.html#chapter-ezra3-4",
"ezra-5-6-questions.html": "ezra-nechemia-answers-hub.html#chapter-ezra5-6",
"ezra-5-6-summary.html": "ezra-nechemia-answers-hub.html#chapter-ezra5-6",
"ezra-5-6-text.html": "ezra-nechemia-answers-hub.html#chapter-ezra5-6",
"ezra-5-6.html": "ezra-nechemia-answers-hub.html#chapter-ezra5-6",
"ezra-7-questions.html": "ezra-nechemia-answers-hub.html#chapter-ezra7",
"ezra-7-summary.html": "ezra-nechemia-answers-hub.html#chapter-ezra7",
"ezra-7-text.html": "ezra-nechemia-answers-hub.html#chapter-ezra7",
"ezra-7.html": "ezra-nechemia-answers-hub.html#chapter-ezra7",
"halvaa.html": "leket-mitzvot-answers-hub.html#chapter-halvaa",
"history-29281.html": "?key=1",
"history-bagrut.html": "?key=1",
"history-leumiut.html": "?key=1",
"history-milchama.html": "?key=1",
"history-sotzializm.html": "?key=1",
"ivrit-bagrut-11281-a.html": "?key=1",
"ivrit-bagrut-11281-b.html": "?key=1",
"ivrit-bagrut-exam.html": "?key=1",
"ivrit-bagrut-prep.html": "?key=1",
"ivrit-binyanim.html": "ivrit-binyanim-gzarot-answers.html",
"ivrit-focus-2027-names.html": "ivrit-focus-2027-teacher-answers.html",
"ivrit-focus-2027-reading.html": "ivrit-focus-2027-teacher-answers.html",
"ivrit-focus-2027-verbs-a.html": "ivrit-focus-2027-teacher-answers.html",
"ivrit-focus-2027-verbs-b.html": "ivrit-focus-2027-teacher-answers.html",
"ivrit-gzarot-final-test.html": "ivrit-gzarot-final-test-answers.html",
"ivrit-gzarot.html": "ivrit-binyanim-gzarot-answers.html",
"ivrit-hafan-unit.html": "?key=1",
"ivrit-infinitive-action.html": "ivrit-mishkalim-answers.html",
"ivrit-merubaim-unit.html": "?key=1",
"ivrit-mishkalim-1.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-2.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-3.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-4.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-5.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-6.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-7.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-8.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-final-test.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-hub.html": "ivrit-mishkalim-answers.html",
"ivrit-mishkalim-more.html": "ivrit-mishkalim-answers.html",
"ivrit-names-study.html": "?key=1",
"ivrit-nechei-av-unit.html": "?key=1",
"ivrit-nechei-la-unit.html": "?key=1",
"ivrit-nechei-lh-unit.html": "?key=1",
"ivrit-nechei-pv-unit.html": "?key=1",
"ivrit-odd-one-out.html": "ivrit-mishkalim-answers.html",
"ivrit-other-formation.html": "ivrit-mishkalim-answers.html",
"ivrit-shem-1.html": "ivrit-shem-answers.html#part-1",
"ivrit-shem-10.html": "ivrit-shem-answers.html#part-10",
"ivrit-shem-2.html": "ivrit-shem-answers.html#part-2",
"ivrit-shem-3.html": "ivrit-shem-answers.html#part-3",
"ivrit-shem-4.html": "ivrit-shem-answers.html#part-4",
"ivrit-shem-5.html": "ivrit-shem-answers.html#part-5",
"ivrit-shem-6.html": "ivrit-shem-answers.html#part-6",
"ivrit-shem-7.html": "ivrit-shem-answers.html#part-7",
"ivrit-shem-8.html": "ivrit-shem-answers.html#part-8",
"ivrit-shem-9.html": "ivrit-shem-answers.html#part-9",
"ivrit-shlemim-unit.html": "?key=1",
"ivrit-suffix-meanings.html": "ivrit-mishkalim-answers.html",
"ivrit-tzurat-hashem.html": "ivrit-shem-answers.html",
"ivrit-verbs-exam.html": "?key=1",
"ivrit-verbs-review.html": "?key=1",
"kibud-avot.html": "leket-mitzvot-answers-hub.html#chapter-kibud-avot",
"kibud-chachamim.html": "leket-mitzvot-answers-hub.html#chapter-kibud-chachamim",
"kidush-hachodesh.html": "leket-mitzvot-answers-hub.html#chapter-kidush-hachodesh",
"kidush-shabbat.html": "leket-mitzvot-answers-hub.html#chapter-kidush-shabbat",
"korban-pesach.html": "leket-mitzvot-answers-hub.html#chapter-korban-pesach",
"kriat-shema.html": "leket-mitzvot-answers-hub.html#chapter-kriat-shema",
"lo-taashok-schar-sachir.html": "leket-mitzvot-answers-hub.html#chapter-lo-taashok",
"lo-tasur-review.html": "leket-mitzvot-answers-hub.html#chapter-lo-tasur",
"lo-tasur-summary.html": "leket-mitzvot-answers-hub.html#chapter-lo-tasur",
"ahavat-gerim-summary.html": "leket-mitzvot-answers-hub.html#chapter-ahavat-gerim",
"lo-tasur.html": "leket-mitzvot-answers-hub.html#chapter-lo-tasur",
"machshava.html": "?key=1&view=all",
"melachim-b-21-questions.html": "neviim-answers-hub.html#chapter-mb21",
"melachim-b-21-summary.html": "neviim-answers-hub.html#chapter-mb21",
"melachim-b-21-text.html": "neviim-answers-hub.html#chapter-mb21",
"melachim-b-21.html": "neviim-answers-hub.html#chapter-mb21",
"melachim-b-22-23-questions.html": "neviim-answers-hub.html#chapter-mb22-23",
"melachim-b-22-23-summary.html": "neviim-answers-hub.html#chapter-mb22-23",
"melachim-b-22-23-text.html": "neviim-answers-hub.html#chapter-mb22-23",
"melachim-b-22-23.html": "neviim-answers-hub.html#chapter-mb22-23",
"melachim-b-23-24-questions.html": "neviim-answers-hub.html#chapter-mb23-24",
"melachim-b-23-24-summary.html": "neviim-answers-hub.html#chapter-mb23-24",
"melachim-b-23-24-text.html": "neviim-answers-hub.html#chapter-mb23-24",
"melachim-b-23-24.html": "neviim-answers-hub.html#chapter-mb23-24",
"melachim-b-24-25-questions.html": "neviim-answers-hub.html#chapter-mb24-25",
"melachim-b-24-25-summary.html": "neviim-answers-hub.html#chapter-mb24-25",
"melachim-b-24-25-text.html": "neviim-answers-hub.html#chapter-mb24-25",
"melachim-b-24-25.html": "neviim-answers-hub.html#chapter-mb24-25",
"nechemia-1-2-questions.html": "ezra-nechemia-answers-hub.html#chapter-nech1-2",
"nechemia-1-2-summary.html": "ezra-nechemia-answers-hub.html#chapter-nech1-2",
"nechemia-1-2-text.html": "ezra-nechemia-answers-hub.html#chapter-nech1-2",
"nechemia-1-2.html": "ezra-nechemia-answers-hub.html#chapter-nech1-2",
"nechemia-10-13-questions.html": "ezra-nechemia-answers-hub.html#chapter-nech10-13",
"nechemia-10-13-summary.html": "ezra-nechemia-answers-hub.html#chapter-nech10-13",
"nechemia-10-13-text.html": "ezra-nechemia-answers-hub.html#chapter-nech10-13",
"nechemia-10-13.html": "ezra-nechemia-answers-hub.html#chapter-nech10-13",
"nechemia-3-12-questions.html": "ezra-nechemia-answers-hub.html#chapter-nech3-12",
"nechemia-3-12-summary.html": "ezra-nechemia-answers-hub.html#chapter-nech3-12",
"nechemia-3-12-text.html": "ezra-nechemia-answers-hub.html#chapter-nech3-12",
"nechemia-3-12.html": "ezra-nechemia-answers-hub.html#chapter-nech3-12",
"nechemia-5-questions.html": "ezra-nechemia-answers-hub.html#chapter-nech5",
"nechemia-5-summary.html": "ezra-nechemia-answers-hub.html#chapter-nech5",
"nechemia-5-text.html": "ezra-nechemia-answers-hub.html#chapter-nech5",
"nechemia-5.html": "ezra-nechemia-answers-hub.html#chapter-nech5",
"onaat-dvarim.html": "leket-mitzvot-answers-hub.html#chapter-onaat-dvarim",
"petichah.html": "petichah-answers.html",
"ptp-exam.html": "ptp-exam-answers.html",
"ptp-halanat-sachar.html": "ptp-answers-hub.html#chapter-halanat-sachar",
"ptp-hanaka.html": "ptp-answers-hub.html#chapter-hanaka",
"ptp-mashkon.html": "ptp-answers-hub.html#chapter-mashkon",
"ptp-matnot-aniyim.html": "ptp-answers-hub.html#chapter-matnot-aniyim",
"ptp-mavo.html": "ptp-answers-hub.html#chapter-mavo",
"ptp-review.html": "ptp-answers-hub.html",
"ptp-ribit.html": "ptp-answers-hub.html#chapter-ribit",
"ptp-shmitat-ksafim.html": "ptp-answers-hub.html#chapter-shmita",
"ptp-tzedaka-halvaa.html": "ptp-answers-hub.html#chapter-tzedaka",
"talmud-torah.html": "talmud-torah-answers.html",
"history-yishuv.html": "history-yishuv-answers.html",
"tefila.html": "leket-mitzvot-answers-hub.html#chapter-tefila",
"tochacha.html": "leket-mitzvot-answers-hub.html#chapter-tochacha",
"yechezkel-36-37-questions.html": "neviim-answers-hub.html#chapter-yech36-37",
"yechezkel-36-37-summary.html": "neviim-answers-hub.html#chapter-yech36-37",
"yechezkel-36-37-text.html": "neviim-answers-hub.html#chapter-yech36-37",
"yechezkel-36-37.html": "neviim-answers-hub.html#chapter-yech36-37",
"yeshayahu-1-questions.html": "yeshayahu-answers-hub.html#chapter-1",
"yeshayahu-1-summary.html": "yeshayahu-answers-hub.html#chapter-1",
"yeshayahu-1-text.html": "yeshayahu-answers-hub.html#chapter-1",
"yeshayahu-1.html": "yeshayahu-answers-hub.html#chapter-1",
"yeshayahu-11-questions.html": "yeshayahu-answers-hub.html#chapter-11",
"yeshayahu-11-summary.html": "yeshayahu-answers-hub.html#chapter-11",
"yeshayahu-11-text.html": "yeshayahu-answers-hub.html#chapter-11",
"yeshayahu-11.html": "yeshayahu-answers-hub.html#chapter-11",
"yeshayahu-2-questions.html": "yeshayahu-answers-hub.html#chapter-2",
"yeshayahu-2-summary.html": "yeshayahu-answers-hub.html#chapter-2",
"yeshayahu-2-text.html": "yeshayahu-answers-hub.html#chapter-2",
"yeshayahu-2.html": "yeshayahu-answers-hub.html#chapter-2",
"yeshayahu-40-questions.html": "yeshayahu-answers-hub.html#chapter-40",
"yeshayahu-40-summary.html": "yeshayahu-answers-hub.html#chapter-40",
"yeshayahu-40-text.html": "yeshayahu-answers-hub.html#chapter-40",
"yeshayahu-40.html": "yeshayahu-answers-hub.html#chapter-40",
"yeshayahu-5-questions.html": "yeshayahu-answers-hub.html#chapter-5",
"yeshayahu-5-summary.html": "yeshayahu-answers-hub.html#chapter-5",
"yeshayahu-5-text.html": "yeshayahu-answers-hub.html#chapter-5",
"yeshayahu-5.html": "yeshayahu-answers-hub.html#chapter-5",
"yeshayahu-58-questions.html": "yeshayahu-answers-hub.html#chapter-58",
"yeshayahu-58-summary.html": "yeshayahu-answers-hub.html#chapter-58",
"yeshayahu-58-text.html": "yeshayahu-answers-hub.html#chapter-58",
"yeshayahu-58.html": "yeshayahu-answers-hub.html#chapter-58",
"yirmiyahu-1-questions.html": "neviim-answers-hub.html#chapter-yir1",
"yirmiyahu-1-summary.html": "neviim-answers-hub.html#chapter-yir1",
"yirmiyahu-1-text.html": "neviim-answers-hub.html#chapter-yir1",
"yirmiyahu-1.html": "neviim-answers-hub.html#chapter-yir1",
"yirmiyahu-28-questions.html": "neviim-answers-hub.html#chapter-yir28",
"yirmiyahu-28-summary.html": "neviim-answers-hub.html#chapter-yir28",
"yirmiyahu-28-text.html": "neviim-answers-hub.html#chapter-yir28",
"yirmiyahu-28.html": "neviim-answers-hub.html#chapter-yir28",
"yirmiyahu-31-questions.html": "neviim-answers-hub.html#chapter-yir31",
"yirmiyahu-31-summary.html": "neviim-answers-hub.html#chapter-yir31",
"yirmiyahu-31-text.html": "neviim-answers-hub.html#chapter-yir31",
"yirmiyahu-31.html": "neviim-answers-hub.html#chapter-yir31",
"yirmiyahu-36-questions.html": "neviim-answers-hub.html#chapter-yir36",
"yirmiyahu-36-summary.html": "neviim-answers-hub.html#chapter-yir36",
"yirmiyahu-36-text.html": "neviim-answers-hub.html#chapter-yir36",
"yirmiyahu-36.html": "neviim-answers-hub.html#chapter-yir36",
"yirmiyahu-7-26-questions.html": "neviim-answers-hub.html#chapter-yir7-26",
"yirmiyahu-7-26-summary.html": "neviim-answers-hub.html#chapter-yir7-26",
"yirmiyahu-7-26-text.html": "neviim-answers-hub.html#chapter-yir7-26",
"yirmiyahu-7-26.html": "neviim-answers-hub.html#chapter-yir7-26",
"yonah-1-2.html": "yonah-answers-hub.html#chapter-ch1-2",
"yonah-3.html": "yonah-answers-hub.html#chapter-ch3",
"yonah-4.html": "yonah-answers-hub.html#chapter-ch4"
};
  function teacher(){ try{ return !!sessionStorage.getItem("bm-teacher-token") || sessionStorage.getItem("teacherAreaUnlocked") === "1"; }catch(e){ return false; } }
  if(!teacher() || /[?&]key(=|&|$)/.test(location.search)) return;
  var page = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  var target = MAP[page];
  if(!target) return;
  function arr(x){ return Array.prototype.slice.call(x); }
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); }

  var css = document.createElement("style");
  css.textContent =
    ".bm-tbar{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:9989;display:flex;gap:8px;padding:6px;border-radius:999px;background:rgba(255,255,255,.92);box-shadow:0 6px 20px rgba(0,0,0,.18);backdrop-filter:blur(4px)}" +
    ".bm-tbar a,.bm-tbar button{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:8px 16px;border-radius:999px;border:0;background:#1F4E46;color:#fff;font:700 .98rem Rubik,Heebo,Arial,sans-serif;text-decoration:none;cursor:pointer;white-space:nowrap}" +
    ".bm-tbar button{background:#A9752E}.bm-tbar button[aria-pressed=true]{background:#7A4A12}" +
    ".bm-tbar a:focus-visible,.bm-tbar button:focus-visible,.tk-show:focus-visible{outline:3px solid #FF7A1A;outline-offset:2px}" +
    ".tk-show{display:inline-flex;align-items:center;gap:5px;margin-inline-start:auto;padding:4px 12px;border:1.5px solid #A9752E;border-radius:999px;background:#FFF7EA;color:#7A4A12;font:600 .88rem Rubik,Heebo,Arial,sans-serif;cursor:pointer}" +
    ".tk-show[aria-pressed=true]{background:#A9752E;color:#fff}" +
    ".tk-ans{display:block;margin:6px 0 2px;padding:6px 10px;border-radius:8px;background:#EAF6EF;border:1px solid #9FD0B5;color:#14422A;font-size:.95rem;line-height:1.55;text-align:right}" +
    ".tk-ans b{color:#0D6B47}.tk-ans ul{margin:.2rem 0 0;padding-inline-start:1.1rem}.tk-ans[hidden]{display:none}" +
    "@media print{.bm-tbar,.tk-show,.tk-ans{display:none!important}}" +
    "@media (max-width:560px){.bm-tbar a,.bm-tbar button{padding:8px 12px;font-size:.9rem}}";
  document.head.appendChild(css);

  /* ---- 1. הכפתורים בתחתית ---- */
  var bar = document.createElement("div");
  bar.className = "bm-tbar";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "כלי מורה");
  var href = target.charAt(0) === "?" ? page + target + (location.hash || "") : target;
  bar.innerHTML = '<a href="' + esc(href) + '" target="_blank" title="המחוון של הדף הזה (נפתח בלשונית חדשה)"><span aria-hidden="true">🗝️</span> מחוון</a>';
  document.body.appendChild(bar);

  /* ---- 2. "הצג תשובה" בתוך הדף ---- */
  var CA = null;
  try{ CA = (typeof CORRECT_ANSWERS !== "undefined") ? CORRECT_ANSWERS : null; }catch(e){ CA = null; }
  function answerOf(f){
    var id = f.getAttribute("data-id");
    var a = f.getAttribute("data-answer");
    if(a){
      var alts = a.split("|");
      if(f.tagName === "SELECT"){
        var labels = arr(f.options).filter(function(o){ return alts.indexOf(o.value) !== -1; }).map(function(o){ return o.textContent.trim(); });
        return esc(labels.join(" / ") || a);
      }
      return "<b>" + esc(alts[0]) + "</b>" + (alts.length > 1 ? " <small>(מתקבל גם: " + esc(alts.slice(1).join(" / ")) + ")</small>" : "");
    }
    if(f.getAttribute("data-model")) return esc(f.getAttribute("data-model"));
    if(CA && id && Object.prototype.hasOwnProperty.call(CA, id)) return "<b>" + esc(CA[id]) + "</b>";
    /* מפתחות נוספים בדף: HARD20_CORRECT_ANSWERS, TEST_CORRECT_ANSWERS וכו' */
    for(var k in window){ if(/CORRECT_ANSWERS$/.test(k)){ try{ var o = window[k]; if(o && typeof o === "object" && id && Object.prototype.hasOwnProperty.call(o, id)) return "<b>" + esc(o[id]) + "</b>"; }catch(e){} } }
    var K = window.BHM_KEY;
    if(K && id && K[id]){ var L = K[id]; return L.length > 1 ? "<ul>" + L.map(function(l){ return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>" : esc(L[0]); }
    return "";
  }
  var groups = [];
  function build(){
    var fields = arr(document.querySelectorAll("input.answer, input.ans, select.answer, select.ans, textarea.answer")).filter(function(f){
      return f.type !== "radio" && f.type !== "checkbox" && !f.hasAttribute("data-bm-persist");
    });
    var found = 0;
    fields.forEach(function(f){
      if(f.__tk) return;
      var html = answerOf(f);
      if(!html) return;
      f.__tk = 1; found++;
      var box = document.createElement("span");
      box.className = "tk-ans";
      box.hidden = true;
      box.innerHTML = "✓ " + html;
      var after = f.nextElementSibling && /check-mark|answer-mark/.test(f.nextElementSibling.className) ? f.nextElementSibling : f;
      after.parentNode.insertBefore(box, after.nextSibling);
      var card = f.closest(".card, .bh-q, article, .gzb-card, section") || document.body;
      var g = groups.filter(function(x){ return x.card === card; })[0];
      if(!g){ g = { card:card, boxes:[] }; groups.push(g); }
      g.boxes.push(box);
    });
    groups.forEach(function(g){
      if(g.btn) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "tk-show"; b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span aria-hidden="true">👁</span> הצג תשובה';
      b.addEventListener("click", function(){ setGroup(g, b.getAttribute("aria-pressed") !== "true"); });
      g.btn = b;
      var head = g.card.querySelector(".card-head, .bh-q-head, .bh-part-head, h2, h3");
      if(head && g.card.contains(head)){ if(/card-head|bh-q-head|bh-part-head/.test(head.className)){ head.style.display = head.style.display || ""; head.appendChild(b); } else head.parentNode.insertBefore(b, head.nextSibling); }
      else g.card.insertBefore(b, g.card.firstChild);
    });
    return found;
  }
  function setGroup(g, on){
    g.boxes.forEach(function(x){ x.hidden = !on; });
    g.btn.setAttribute("aria-pressed", String(on));
    g.btn.innerHTML = '<span aria-hidden="true">👁</span> ' + (on ? "הסתר תשובה" : "הצג תשובה");
  }
  var allBtn = null;
  function addAll(){
    if(allBtn || !groups.length) return;
    allBtn = document.createElement("button");
    allBtn.type = "button"; allBtn.setAttribute("aria-pressed", "false");
    allBtn.innerHTML = '<span aria-hidden="true">👁</span> כל התשובות';
    allBtn.title = "הצגה או הסתרה של כל התשובות בדף";
    allBtn.addEventListener("click", function(){
      var on = allBtn.getAttribute("aria-pressed") !== "true";
      groups.forEach(function(g){ setGroup(g, on); });
      allBtn.setAttribute("aria-pressed", String(on));
      allBtn.innerHTML = '<span aria-hidden="true">👁</span> ' + (on ? "הסתר הכול" : "כל התשובות");
    });
    bar.appendChild(allBtn);
  }
  function run(){ build(); addAll(); }
  /* בית חינוך ומשפחה: התשובון נטען רק למורה */
  if(page === "bayit-chinuch-mishpacha.html" && !window.BHM_KEY){
    var s = document.createElement("script"); s.src = "assets/bayit-chinuch-mishpacha-key.js?v=2"; s.onload = run; document.head.appendChild(s);
  }
  if(document.readyState === "complete") run(); else window.addEventListener("load", run);
})();
