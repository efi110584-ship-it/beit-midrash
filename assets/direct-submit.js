/* שליחת מטלה ישירות למורה, ללא הורדת קובץ ידנית -
   בונה קובץ HTML קטן מהתשובות שכבר מולאו בדף, ושולח אותו כקובץ
   מצורף לאותו Web App (Google Apps Script) שכבר משמש את submit.html. */
(function(){
  "use strict";

  var ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbwkhxAu28oe10-Mli0tSUj-pb0rpxGmEioPdquopkPrnIvKw2TZmZw1PmlwhDZ3AUSPXw/exec';

  function escapeHtml(str){
    return String(str || '').replace(/[&<>"']/g, function(c){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
    });
  }

  function utf8ToBase64(str){
    return btoa(unescape(encodeURIComponent(str)));
  }

  function buildAnswersHtml(opts){
    var rows = opts.items.map(function(item){
      return '<div style="margin-bottom:1.4rem;">' +
        '<div style="font-weight:700;margin-bottom:.35rem;color:#1F3A4D;">' + escapeHtml(item.label) + '</div>' +
        '<div style="white-space:pre-wrap;background:#F7F1E1;border:1px solid #D8C9A3;border-radius:6px;padding:.6rem .85rem;line-height:1.6;">' + escapeHtml(item.value) + '</div>' +
      '</div>';
    }).join('');
    return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">' +
      '<title>' + escapeHtml(opts.assignment) + ' - ' + escapeHtml(opts.studentName) + '</title></head>' +
      '<body style="font-family:Arial, Heebo, sans-serif; max-width:700px; margin:2rem auto; padding:0 1rem; color:#1F3A4D;">' +
      '<h1 style="font-size:1.4rem;">' + escapeHtml(opts.assignment) + '</h1>' +
      '<p><b>שם:</b> ' + escapeHtml(opts.studentName) + (opts.studentClass ? ' &nbsp;&nbsp; <b>כיתה:</b> ' + escapeHtml(opts.studentClass) : '') + '</p>' +
      '<hr style="border:none;border-top:1px solid #D8C9A3;margin:1rem 0 1.4rem;">' +
      rows +
      '</body></html>';
  }

  function labelFor(field){
    var labelledBy = field.getAttribute('aria-labelledby');
    if(labelledBy){
      var labelEl = document.getElementById(labelledBy);
      if(labelEl && labelEl.textContent.trim()) return labelEl.textContent.trim();
    }
    var ariaLabel = field.getAttribute('aria-label');
    if(ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
    return field.dataset.id || 'שאלה';
  }

  /**
   * opts: { studentName, studentClass, assignment, fields: [HTMLElement,...], notes }
   * fields - רשימת שדות .answer לאסוף מהם תשובות (ריקים מדולגים).
   * מחזיר Promise שמתממש לתוצאת ה-fetch המפוענחת (JSON).
   */
  function sendDirectSubmission(opts){
    var items = opts.fields
      .map(function(f){ return { label: labelFor(f), value: (f.value || '').trim() }; })
      .filter(function(item){ return item.value.length > 0; });

    if(items.length === 0){
      return Promise.reject(new Error('לא מולאו עדיין תשובות בדף.'));
    }

    var html = buildAnswersHtml({
      studentName: opts.studentName,
      studentClass: opts.studentClass,
      assignment: opts.assignment,
      items: items
    });

    var payload = {
      studentName: opts.studentName,
      studentClass: opts.studentClass || '',
      assignment: opts.assignment,
      notes: opts.notes || '',
      fileName: (opts.assignment + ' - ' + opts.studentName + '.html').replace(/[\\/:*?"<>|]/g, ' '),
      fileMimeType: 'text/html',
      fileBase64: utf8ToBase64(html)
    };

    return fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function(response){ return response.json(); });
  }

  window.BeitMidrashDirectSubmit = { send: sendDirectSubmission };
})();
