/* ============================================================
   יחידות הלימוד באתר - מקום אחד לכל הדפים
   ============================================================
   דף הבית מציג מכאן את כרטיסי היחידות והחיפוש; טופס ההגשה ודפי העבודה
   משתמשים בזה כדי לשלוח למורה "יחידה · נושא"; ולוח ההגשות מסדר לפיו.
   האתר מציג בכוונה רק כרטיס אחד לכל ספר/יחידה מרכזית. הכניסה לפרקים
   מתבצעת מתוך עמוד-המרכז (ה-hub) של כל יחידה. כדי להוסיף/לשנות יחידה
   או נושא, עורכים את הרשימה הזו בלבד. */
(function(){
  "use strict";
  var UNITS = [
    { key:"yonah", class:"יא", subject:"תנך",
      icon:"\u{1F30A}", title:"ספר יונה",
      desc:"מסע קריאה בארבעה פרקי הספר - שאלות, פרשנים והעמקה, פרק אחר פרק.",
      chapters:3, chaptersLabel:"פרקים", url:"yonah-hub.html",
      topics:[
        { title:"פרקים א'-ב' - הבריחה לתרשיש ותפילת יונה", url:"yonah-1-2.html", k:"נינוה דג מלחים" },
        { title:"פרק ג' - נינוה שבה בתשובה", url:"yonah-3.html", k:"נינוה תשובה" },
        { title:"פרק ד' - הקיקיון", url:"yonah-4.html", k:"קיקיון" },
        { title:"שאלות בגרות אמיתיות - ספר יונה", url:"yonah-bagrut-questions.html", k:"בגרות", extra:true },
        { title:"שאלות אמריקאיות על כל הספר", url:"yonah-quiz.html", k:"שאלות אמריקאיות", extra:true }
      ] },
    { key:"leket", class:"יא", subject:"תושבע",
      icon:"\u{1F4DC}", title:"לקט מצוות",
      desc:"קובץ המצוות הנלמדות השנה - הגדרה, שורש, דינים ולמעשה לכל מצווה.",
      chapters:15, chaptersLabel:"מצוות", url:"leket-mitzvot-hub.html",
      topics:[
        { title:"אהבת הגרים (מצוה תל\"א)", url:"ahavat-gerim.html", k:"גר" },
        { title:"אהבת ישראל (מצוה רמ\"ג)", url:"ahavat-israel.html" },
        { title:"הלוואה לעני (מצוה ס\"ז)", url:"halvaa.html" },
        { title:"כיבוד הורים (מצוה ל\"ג)", url:"kibud-avot.html", k:"אב ואם" },
        { title:"כיבוד חכמים (מצוה רנ\"ז)", url:"kibud-chachamim.html" },
        { title:"קידוש החודש (רמב\"ם, עשה קנ\"ג)", url:"kidush-hachodesh.html" },
        { title:"קידוש השבת (מצוה ל\"א)", url:"kidush-shabbat.html", k:"שבת" },
        { title:"שלא לשבור עצם בפסח (מצוה ט\"ז)", url:"korban-pesach.html", k:"קרבן פסח" },
        { title:"קריאת שמע (מצוה ת\"כ)", url:"kriat-shema.html" },
        { title:"לא תעשוק ושכר שכיר (מצוות רכ\"ח ור\"ל)", url:"lo-taashok-schar-sachir.html", k:"שכר" },
        { title:"לא תסור (מצוה תצ\"ו)", url:"lo-tasur.html" },
        { title:"אונאת דברים (מצוה של\"ח)", url:"onaat-dvarim.html" },
        { title:"תלמוד תורה (מצוה תי\"ט)", url:"talmud-torah.html" },
        { title:"תפילה (מצוה תל\"ג)", url:"tefila.html" },
        { title:"תוכחה (מצוה רל\"ט)", url:"tochacha.html" }
      ] },
    { key:"bereshit", class:"יא", subject:"תנך",
      icon:"\u{1F3DE}️", title:"ספר בראשית",
      desc:"מסע קריאה בפרקי ספר בראשית - שאלות, פרשנים והעמקה, פרק אחר פרק.",
      chapters:14, chaptersLabel:"פרקים", url:"bereshit-hub.html",
      topics:[
        { title:"פרק י\"ב - לך לך וירידה למצרים", url:"bereshit-12.html", k:"אברהם שרה" },
        { title:"פרק ט\"ו - ברית בין הבתרים", url:"bereshit-15.html", k:"אברהם" },
        { title:"פרק י\"ז - ברית המילה", url:"bereshit-17.html", k:"אברהם" },
        { title:"פרק י\"ח - הכנסת אורחים וסדום", url:"bereshit-18.html", k:"אברהם שרה" },
        { title:"פרק כ\"ב - עקדת יצחק", url:"bereshit-22.html", k:"אברהם עקדה" },
        { title:"פרק כ\"ה - מכירת הבכורה", url:"bereshit-25.html", k:"יעקב עשו" },
        { title:"פרקים כ\"ז-כ\"ח - גניבת הברכות", url:"bereshit-27.html", k:"יעקב עשו יצחק" },
        { title:"פרק כ\"ח - סולם יעקב", url:"bereshit-28.html", k:"יעקב" },
        { title:"פרקים ל\"ב-ל\"ג - המאבק והפיוס", url:"bereshit-32.html", k:"יעקב עשו" },
        { title:"פרק ל\"ז - מכירת יוסף", url:"bereshit-37.html", k:"יוסף אחיו" },
        { title:"פרק מ\"ב - ירידת האחים למצרים", url:"bereshit-42.html", k:"יוסף אחיו" },
        { title:"פרק מ\"ד - נאום יהודה", url:"bereshit-44.html", k:"יוסף אחיו גביע" },
        { title:"פרק מ\"ה - התוודעות יוסף", url:"bereshit-45.html", k:"יוסף אחיו" },
        { title:"פרק נ' - מות יעקב ויוסף ואחיו", url:"bereshit-50.html", k:"יוסף אחיו" }
      ] },
    { key:"yeshayahu", class:"יא", subject:"תנך",
      icon:"\u{1F4DC}", title:"ספר ישעיהו",
      desc:"נבואות ישעיהו - חזון ישעיהו, משל הכרם, חזון האחרית, הצום הרצוי ונחמת ירושלים.",
      chapters:6, chaptersLabel:"יחידות", url:"yeshayahu-hub.html",
      topics:[
        { title:"פרק א' - חזון ישעיהו", url:"yeshayahu-1.html" },
        { title:"פרק ב' - חזון הר בית ה' (אחרית הימים)", url:"yeshayahu-2.html", k:"אחרית" },
        { title:"פרק ה' - משל הכרם", url:"yeshayahu-5.html", k:"כרם" },
        { title:"פרק י\"א - חזון האחרית", url:"yeshayahu-11.html", k:"משיח" },
        { title:"פרק מ' - נחמת ירושלים", url:"yeshayahu-40.html", k:"נחמו" },
        { title:"פרק נ\"ח - הצום הרצוי", url:"yeshayahu-58.html", k:"צום" }
      ] },
    { key:"ivrit", class:"יא", subject:"עברית",
      icon:"\u{1F4D3}", title:"עברית - דקדוק",
      desc:"כל חומרי הדקדוק במקום אחד - בניינים, גזרות ותרגול.",
      chapters:12, chaptersLabel:"קטגוריות", url:"ivrit-hub.html",
      topics:[
        { title:"גזרת השלמים", url:"ivrit-shlemim-unit.html", k:"שלמים" },
        { title:"גזרת המרובעים", url:"ivrit-merubaim-unit.html" },
        { title:"גזרת חפ\"נ (חסרי פ\"נ)", url:"ivrit-hafan-unit.html", k:"חפן" },
        { title:"גזרת חפי\"צ (חסרי פ\"יצ)", url:"ivrit-hafitz-unit.html" },
        { title:"גזרת נחי פ\"א", url:"ivrit-nechei-pa-unit.html" },
        { title:"גזרת נחי פ\"ו (פ\"י/ו)", url:"ivrit-nechei-pv-unit.html", k:"פי" },
        { title:"גזרת נחי ע\"ו (ע\"י/ו)", url:"ivrit-nechei-av-unit.html", k:"עי" },
        { title:"גזרת נחי ל\"א", url:"ivrit-nechei-la-unit.html" },
        { title:"גזרת נחי ל\"ה (ל\"י/ה)", url:"ivrit-nechei-lh-unit.html", k:"לי" },
        { title:"גזרת הכפולים (ע\"ע)", url:"ivrit-kfulim-unit.html" },
        { title:"בניינים - טבלה ותרגול", url:"ivrit-binyanim.html", k:"בניין" },
        { title:"משקלים", url:"ivrit-mishkalim-hub.html", k:"משקל" },
        { title:"משקלים, שיעור 1: מהו משקל", url:"ivrit-mishkalim-1.html", k:"משקלים שיעור 1", extra:true },
        { title:"משקלים, שיעור 2: משקל בגזרות הנחים", url:"ivrit-mishkalim-2.html", k:"משקלים שיעור 2", extra:true },
        { title:"משקלים, שיעור 3: בינוני והקשר שלו למשקל", url:"ivrit-mishkalim-3.html", k:"משקלים שיעור 3", extra:true },
        { title:"משקלים, שיעור 4: שמות פעולה", url:"ivrit-mishkalim-4.html", k:"משקלים שיעור 4", extra:true },
        { title:"משקלים, שיעור 5: משמעות המשקל", url:"ivrit-mishkalim-5.html", k:"משקלים שיעור 5", extra:true },
        { title:"משקלים, שיעור 6: שורש+משקל לעומת בסיס+צורן", url:"ivrit-mishkalim-6.html", k:"משקלים שיעור 6", extra:true },
        { title:"משקלים, שיעור 7: ההקשר קובע", url:"ivrit-mishkalim-7.html", k:"משקלים שיעור 7", extra:true },
        { title:"משקלים, שיעור 8: הכנה לבגרות", url:"ivrit-mishkalim-8.html", k:"משקלים שיעור 8", extra:true },
        { title:"משקלים, מבחן מסכם", url:"ivrit-mishkalim-final-test.html", k:"משקלים מבחן מסכם", extra:true },
        { title:"טבלת הגזרות ותרגול", url:"ivrit-gzarot.html", k:"גזרות", extra:true },
        { title:"טבלת סימני זיהוי לגזרות", url:"ivrit-gzarot-simanim.html", k:"סימנים", extra:true },
        { title:"מבחן מסכם על הגזרות", url:"ivrit-gzarot-final-test.html", k:"מבחן", extra:true }
      ] },
    { key:"devarim", class:"יב", subject:"תנך",
      icon:"\u{1F4D6}", title:"ספר דברים",
      desc:"נאומו האחרון של משה רבנו לעם ישראל - יחידת הפתיחה לספר דברים.",
      chapters:1, chaptersLabel:"יחידות", url:"petichah.html",
      topics:[
        { title:"יחידת הפתיחה - נאומו האחרון של משה", url:"petichah.html", k:"משה" }
      ] },
    { key:"ezra-nechemia", class:"יב", subject:"תנך",
      icon:"\u{1F4EF}", title:"עזרא ונחמיה",
      desc:"תקופת בית שני - הצהרת כורש, בניין המקדש, עליית עזרא, בניית חומת ירושלים ומנהיגותו של נחמיה.",
      chapters:8, chaptersLabel:"פרקים", url:"ezra-nechemia-hub.html",
      topics:[
        { title:"עזרא א'-ב' - הצהרת כורש והעליות בימיו", url:"ezra-1-2.html", k:"כורש" },
        { title:"עזרא ג'-ד' - בניית המזבח והעיכובים בבנייה", url:"ezra-3-4.html", k:"מקדש" },
        { title:"עזרא ה'-ו' - חידוש בניית המקדש", url:"ezra-5-6.html", k:"מקדש" },
        { title:"עזרא ז' - עליית עזרא הסופר", url:"ezra-7.html" },
        { title:"נחמיה א'-ב' - עליית נחמיה", url:"nechemia-1-2.html" },
        { title:"נחמיה ג'-י\"ב - בניית החומה", url:"nechemia-3-12.html", k:"חומה" },
        { title:"נחמיה ה' - בניינה הפנימי של ירושלים", url:"nechemia-5.html", k:"עניים" },
        { title:"נחמיה י', י\"ג - המצב הרוחני בימי נחמיה", url:"nechemia-10-13.html", k:"שבת" }
      ] },
    { key:"neviim", class:"יב", subject:"תנך",
      icon:"\u{1F4A7}", title:"פרקי נביאים",
      desc:"מלכי יהודה האחרונים בספר מלכים ב', נבואות ירמיהו לפני החורבן ואחריו, ונבואות הגאולה של יחזקאל.",
      chapters:10, chaptersLabel:"פרקים", url:"neviim-hub.html",
      topics:[
        { title:"מלכים ב' כ\"א - מלכות מנשה", url:"melachim-b-21.html", k:"מנשה" },
        { title:"מלכים ב' כ\"ב-כ\"ג - מלכות יאשיהו", url:"melachim-b-22-23.html", k:"יאשיהו" },
        { title:"מלכים ב' כ\"ג-כ\"ד - ימי יהואחז ויהויקים", url:"melachim-b-23-24.html" },
        { title:"מלכים ב' כ\"ד-כ\"ה - ימי יהויכין וצדקיהו", url:"melachim-b-24-25.html", k:"חורבן" },
        { title:"ירמיהו א' - הקדשת ירמיהו", url:"yirmiyahu-1.html" },
        { title:"ירמיהו ז', כ\"ו - נבואת היכל ה' ומשפט ירמיהו", url:"yirmiyahu-7-26.html" },
        { title:"ירמיהו כ\"ח - נביאי השקר", url:"yirmiyahu-28.html", k:"חנניה" },
        { title:"ירמיהו ל\"א - נבואת נחמה", url:"yirmiyahu-31.html" },
        { title:"ירמיהו ל\"ו - המגילה וקריעתה", url:"yirmiyahu-36.html" },
        { title:"יחזקאל ל\"ו-ל\"ז - נבואות הגאולה", url:"yechezkel-36-37.html", k:"עצמות" }
      ] },
    { key:"ptp", class:"יב", subject:"תושבע",
      icon:"\u2696\uFE0F", title:"פתוח תפתח",
      desc:"יחידת המצוות שבספר דברים - שמיטת כספים, צדקה, ריבית, משכון ועוד.",
      chapters:8, chaptersLabel:"נושאים", url:"ptp-hub.html",
      topics:[
        { title:"מבוא ליחידת \"פתוח תפתח\"", url:"ptp-mavo.html" },
        { title:"שמיטת כספים", url:"ptp-shmitat-ksafim.html" },
        { title:"צדקה והלוואה", url:"ptp-tzedaka-halvaa.html" },
        { title:"איסור ריבית", url:"ptp-ribit.html" },
        { title:"דיני משכון", url:"ptp-mashkon.html" },
        { title:"הלנת שכר", url:"ptp-halanat-sachar.html" },
        { title:"מצוות הענקה", url:"ptp-hanaka.html" },
        { title:"מתנות עניים", url:"ptp-matnot-aniyim.html" }
      ] },
    { key:"yonah-exam", class:"teacher", subject:"מבחן", category:"מבחנים",
      icon:"\u{1F4DD}", title:"מבחן מסכם - ספר יונה",
      desc:"מבחן דיגיטלי מקיף על כל ארבעת פרקי הספר. הכניסה למבחן דורשת קוד מהמורה.",
      chapters:1, chaptersLabel:"מבחן", url:"yonah-exam.html" },
    { key:"bereshit-answers", class:"teacher", subject:"מורה", category:"ספר בראשית",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - פרקי אברהם ושרה",
      desc:"תשובות תמציתיות ברמת בגרות לכל שאלות דפי העבודה בחמשת פרקי אברהם ושרה, עם אפשרות הקראה לכל נושא.",
      chapters:5, chaptersLabel:"פרקים", url:"bereshit-answers-hub.html" },
    { key:"bereshit-yaakov-esav-answers", class:"teacher", subject:"מורה", category:"ספר בראשית",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - פרקי יעקב ועשיו",
      desc:"תשובות תמציתיות ברמת בגרות לכל שאלות דפי העבודה בפרקי יעקב ועשיו (כ\"ה, כ\"ז-כ\"ח, ל\"ב-ל\"ג), עם אפשרות הקראה לכל נושא.",
      chapters:4, chaptersLabel:"פרקים", url:"bereshit-yaakov-esav-answers-hub.html" },
    { key:"bereshit-yosef-answers", class:"teacher", subject:"מורה", category:"ספר בראשית",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - פרקי יוסף ואחיו",
      desc:"תשובות תמציתיות ברמת בגרות לכל שאלות דפי העבודה בפרקי יוסף ואחיו (ל\"ז, מ\"ב-מ\"ג, מ\"ד, מ\"ה, נ'), עם אפשרות הקראה לכל נושא.",
      chapters:5, chaptersLabel:"פרקים", url:"bereshit-yosef-answers-hub.html" },
    { key:"yeshayahu-answers", class:"teacher", subject:"מורה", category:"ספר ישעיהו",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - ספר ישעיהו",
      desc:"תשובות תמציתיות ברמת בגרות לכל שאלות דפי העבודה בששת פרקי ישעיהו, עם אפשרות הקראה לכל נושא.",
      chapters:6, chaptersLabel:"פרקים", url:"yeshayahu-answers-hub.html" },
    { key:"ezra-nechemia-answers", class:"teacher", subject:"מורה", category:"עזרא ונחמיה",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - עזרא ונחמיה",
      desc:"תשובות תמציתיות ברמת בגרות לכל שאלות דפי העבודה בשמונת פרקי עזרא ונחמיה, עם אפשרות הקראה לכל נושא.",
      chapters:8, chaptersLabel:"פרקים", url:"ezra-nechemia-answers-hub.html" },
    { key:"neviim-answers", class:"teacher", subject:"מורה", category:"פרקי נביאים",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - פרקי נביאים",
      desc:"תשובות תמציתיות ברמת בגרות לכל שאלות דפי העבודה בעשרת פרקי מלכים ב', ירמיהו ויחזקאל, עם אפשרות הקראה לכל נושא.",
      chapters:10, chaptersLabel:"פרקים", url:"neviim-answers-hub.html" },
    { key:"yonah-answers", class:"teacher", subject:"מורה", category:"ספר יונה",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - ספר יונה",
      desc:"תשובות תמציתיות ברמת בגרות לכל 43 שאלות דף העבודה על פרקי יונה, עם הפסוקים והפרשנים לצד כל שאלה ואפשרות הקראה.",
      chapters:3, chaptersLabel:"פרקים", url:"yonah-answers-hub.html" },
    { key:"leket-answers", class:"teacher", subject:"מורה", category:"לקט מצוות",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - לקט מצוות",
      desc:"תשובות תמציתיות ברמת בגרות לכל 185 שאלות דפי העבודה על 15 המצוות, עם מקורות ספר החינוך לצד כל שאלה ואפשרות הקראה.",
      chapters:15, chaptersLabel:"מצוות", url:"leket-mitzvot-answers-hub.html" },
    { key:"ptp-answers", class:"teacher", subject:"מורה", category:"פתוח תפתח",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - פתוח תפתח",
      desc:"תשובות תמציתיות ברמת בגרות לכל 46 שאלות דפי העבודה על 8 נושאי היחידה, עם הפסוקים ורש\"י לצד כל שאלה ואפשרות הקראה.",
      chapters:8, chaptersLabel:"נושאים", url:"ptp-answers-hub.html" },
    { key:"petichah-answers", class:"teacher", subject:"מורה", category:"ספר דברים",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - יחידת הפתיחה",
      desc:"תשובות מלאות ברמת בגרות לכל 42 שאלות דף העבודה, על ששת נושאי יחידת הפתיחה לספר דברים - מבוססות על חוברת הלימוד והתשובות המקוריות של המורה.",
      chapters:6, chaptersLabel:"נושאים", url:"petichah-answers.html" },
    { key:"ivrit-binyanim-gzarot-answers", class:"teacher", subject:"מורה", category:"עברית - בניינים וגזרות",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - בניינים וגזרות",
      desc:"מפתחות התשובות לשני דפי התרגול: 20 מילים קשות מגזרת השלמים לזיהוי שורש ובניין, ו-20 מילים קשות ברבים לזיהוי שורש וגזרה.",
      chapters:2, chaptersLabel:"דפי תרגול", url:"ivrit-binyanim-gzarot-answers.html" },
    { key:"ivrit-hafan-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:'מחוון תשובות - גזרת חפ"נ וחפי"צ',
      desc:"מפתח תשובות מלא לדף העבודה על גזרות חפ\"נ וחפי\"צ - שורש, בניין, שם הפועל ושם הפעולה לכל משפט.",
      chapters:37, chaptersLabel:"משפטים", url:"ivrit-hafan-hafitz-answers.html" },
    { key:"ivrit-lh-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:'מחוון תשובות - גזרת נחי ל"ה',
      desc:"מפתח תשובות מלא לדף העבודה על גזרת נחי ל\"ה - שורש, בניין, שם הפועל ושם הפעולה לכל משפט.",
      chapters:20, chaptersLabel:"משפטים", url:"ivrit-nechei-lh-answers.html" },
    { key:"ivrit-pa-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:'מחוון תשובות - גזרת נחי פ"א',
      desc:"מפתח תשובות מלא לדף העבודה על גזרת נחי פ\"א - שורש, בניין, שם הפועל ושם הפעולה לכל משפט.",
      chapters:19, chaptersLabel:"משפטים", url:"ivrit-nechei-pa-answers.html" },
    { key:"ivrit-la-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:'מחוון תשובות - גזרת נחי ל"א',
      desc:"מפתח תשובות מלא לדף העבודה על גזרת נחי ל\"א - שורש, בניין, שם הפועל ושם הפעולה לכל משפט.",
      chapters:21, chaptersLabel:"משפטים", url:"ivrit-nechei-la-answers.html" },
    { key:"ivrit-pv-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:'מחוון תשובות - גזרת נחי פ"ו',
      desc:"מפתח תשובות מלא לדף העבודה על גזרת נחי פ\"ו - שורש, בניין, שם הפועל ושם הפעולה לכל משפט.",
      chapters:18, chaptersLabel:"משפטים", url:"ivrit-nechei-pv-answers.html" },
    { key:"ivrit-av-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:'מחוון תשובות - גזרת נחי ע"ו',
      desc:"מפתח תשובות מלא לדף העבודה על גזרת נחי ע\"ו - שורש, בניין, שם הפועל ושם הפעולה לכל משפט.",
      chapters:19, chaptersLabel:"משפטים", url:"ivrit-nechei-av-answers.html" },
    { key:"ivrit-kfulim-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:'מחוון תשובות - גזרת כפולים',
      desc:"מפתח תשובות מלא לדף העבודה על גזרת הכפולים (ע\"ע) - שורש, בניין, שם הפועל ושם הפעולה לכל משפט.",
      chapters:15, chaptersLabel:"משפטים", url:"ivrit-kfulim-answers.html" },
    { key:"ivrit-final-test-answers", class:"teacher", subject:"מורה", category:"עברית - גזרות",
      icon:"\u{1F5DD}️", title:"מחוון תשובות - מבחן מסכם על הגזרות",
      desc:"מפתח תשובות מלא ל-62 המילים במבחן המסכם - שורש וגזרה לכל מילה, כולל שמות פעולה ושמות עצם.",
      chapters:62, chaptersLabel:"מילים", url:"ivrit-gzarot-final-test-answers.html" },
    { key:"ivrit-mishkalim-answers", class:"teacher", subject:"מורה", category:"עברית - משקלים",
      icon:"\u{1F5DD}️", title:"מחוון מרוכז - יחידת משקלים",
      desc:"כל מפתחות התשובות של שמונת שיעורי יחידת המשקלים ושל המבחן המסכם, במקום אחד - בלי צורך לפתוח כל שיעור בנפרד.",
      chapters:8, chaptersLabel:"שיעורים", url:"ivrit-mishkalim-answers.html" },
    { key:"bogrim-data", class:"teacher", subject:"מורה", category:"בוגרים",
      icon:"\u{1F393}", title:"בוגרים - ניתוח ומיון",
      desc:"נתוני כל מחזורי הבוגרים (א-ט) במקום אחד - שירות צבאי ולאומי, קרבי, השכלה ותעסוקה, עם סינון ומיון. פרטי, לעיני הצוות בלבד.",
      chapters:9, chaptersLabel:"מחזורים", url:"bogrim-data.html" },
    { key:"bogrim-plan", class:"teacher", subject:"מורה", category:"בוגרים",
      icon:"\u{1F5FA}️", title:"תוכנית עבודה - בוגרים",
      desc:"תוכנית העבודה השנתית של תוכנית הבוגרים לפי תבנית המוסד: ייעוד, חזון, מטרות, יעדי SMART וחמשת הצירים, עם לוח שנתי. ניתן להדפיס או לשמור כ-PDF.",
      chapters:5, chaptersLabel:"צירים", url:"bogrim-plan.html" }
  ];
  window.BM_UNITS = UNITS;

  /* ============ מטלה = יחידה · נושא ============
     שם מטלה שנשלח למורה: "לקט מצוות · אהבת ישראל". כך לוח ההגשות יודע
     לסדר כל עבודה לפי יחידה ולפי נושא, ולתת ציון לכל נושא בנפרד. */
  var SEP = " · ";

  /* מירכאות וגרש רגילים נמחקים בשם הקובץ בדרייב - מחליפים בגרשיים עבריים */
  function fileSafe(s){ return String(s || "").replace(/"/g, "״").replace(/'/g, "׳").replace(/\s+/g, " ").trim(); }
  function norm(s){
    return String(s || "").replace(/[֑-ׇ]/g, "").replace(/["'׳״׳״]/g, "")
      .replace(/[-־–—,.()/:]/g, " ").replace(/\s+/g, " ").trim();
  }
  /* החלק המרכזי של שם נושא: בלי סוגריים ובלי תיאור אחרי מקף */
  function topicCore(title){ return String(title || "").split(" (")[0].split(" - ")[0].trim(); }
  function topicLabel(t){ return fileSafe(topicCore(t.title) === t.title ? t.title : t.title); }

  function studentUnits(){ return UNITS.filter(function(u){ return u.class !== "teacher"; }); }

  function assignmentFor(unit, topic){
    return fileSafe(unit.title) + SEP + (topic ? fileSafe(topic.title) : "כל היחידה");
  }
  function findByPage(page){
    page = String(page || "").split("#")[0];
    var units = studentUnits();
    for(var i = 0; i < units.length; i++){
      var u = units[i];
      if(u.url === page) return { unit:u, topic:null };
      var ts = u.topics || [];
      for(var j = 0; j < ts.length; j++) if(ts[j].url === page) return { unit:u, topic:ts[j] };
    }
    return null;
  }

  /* מילות זיהוי לכל יחידה - כדי לסדר גם הגשות ישנות, שנשלחו בלי "יחידה · נושא" */
  var GENERIC = { "ספר":1, "פרקי":1, "פרק":1, "פרקים":1, "יחידת":1, "דקדוק":1, "גזרת":1, "מצוות":1, "איסור":1, "דיני":1, "מבוא":1, "שלא":1, "הפתיחה":1 };
  function unitTokens(u){
    var out = [];
    function add(w){ w = norm(w); if(w.length >= 3 && !GENERIC[w] && out.indexOf(w) === -1) out.push(w); }
    norm(u.title).split(" ").forEach(add);
    (u.topics || []).forEach(function(t){
      var core = norm(topicCore(t.title));
      /* "פרקים א ב" משותף לכמה ספרים - לא מזהה יחידה */
      if(core.length >= 3 && !GENERIC[core.split(" ")[0]]) add(core);
      add(core.split(" ")[0]);
      String(t.k || "").split(" ").forEach(function(w){ if(w.length >= 3) add(w); });
    });
    return out;
  }
  /* "לקט מצוות · אהבת ישראל" או שם ישן ("אהבת ישראל", "יונה פרק ג") ← {unit, topic} */
  function classifyTask(task){
    task = String(task || "");
    var units = studentUnits();
    var cut = task.indexOf(SEP);
    if(cut !== -1){
      var uTitle = norm(task.slice(0, cut)), tTitle = task.slice(cut + SEP.length);
      for(var i = 0; i < units.length; i++) if(norm(units[i].title) === uTitle) return { unit:units[i].title, topic:tTitle };
      return { unit:task.slice(0, cut), topic:tTitle };
    }
    var nt = " " + norm(task) + " ";
    var best = null, bestLen = 0;
    units.forEach(function(u){
      unitTokens(u).forEach(function(tok){
        if(tok.length > bestLen && nt.indexOf(" " + tok + " ") !== -1){ best = u; bestLen = tok.length; }
      });
    });
    if(!best) return { unit:"אחר", topic:task };
    if(norm(task) === norm(best.title)) return { unit:best.title, topic:"לא צוין נושא" };
    /* נושא בתוך היחידה: הנושא שהחלק המרכזי שלו מופיע בשם המטלה */
    var topic = null, tLen = 0;
    (best.topics || []).forEach(function(t){
      [norm(topicCore(t.title)), norm(t.k || "")].forEach(function(phrase){
        if(phrase.length >= 3 && phrase.length > tLen && nt.indexOf(" " + phrase + " ") !== -1){ topic = t; tLen = phrase.length; }
      });
    });
    return { unit:best.title, topic:topic ? fileSafe(topic.title) : task };
  }

  window.BM_TASKS = { SEP:SEP, units:studentUnits, assignmentFor:assignmentFor, findByPage:findByPage, classify:classifyTask, fileSafe:fileSafe };
})();
