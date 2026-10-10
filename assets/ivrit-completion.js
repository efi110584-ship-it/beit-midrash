/* מסירים סימון קודם בזמן עריכה; בדיקה נעשית רק בלחיצה. */
function clearHebrewAnswerMark(input){
 input.classList.remove('is-correct','is-wrong');input.removeAttribute('aria-invalid');
 var mark=input.nextElementSibling;
 if(mark&&mark.matches('.check-mark,.answer-mark')){mark.classList.remove('is-correct','is-wrong','correct','wrong');mark.textContent='';}
}
