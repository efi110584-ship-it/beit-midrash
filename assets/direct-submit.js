/* שליחת מטלה ישירות למורה, ללא הורדת קובץ ידנית -
   בונה מהתשובות שכבר מולאו בדף קובץ PDF ("דף תשובות": השאלה ומתחתיה
   התשובה), ושולח אותו כקובץ מצורף לאותו Web App (Google Apps Script)
   שכבר משמש את submit.html.
   למה PDF: קובץ HTML נפתח ב-Gmail וב-Google Drive כקוד, וצריך "פתיחה
   באמצעות Google Docs". קובץ PDF נפתח ישר כדף מסודר.
   אם יצירת ה-PDF נכשלת (דפדפן ישן מאוד) - נשלח קובץ HTML כמו קודם,
   כדי שאף הגשה לא תאבד. */
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

  function sentAt(){
    var d = new Date();
    return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear() + ', ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function answeredLine(opts){
    if(!opts.total) return '';
    return 'נענו ' + opts.items.length + ' מתוך ' + opts.total + ' שאלות';
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

  /* ============================================================
     דף התשובות כ-PDF
     הדפדפן מצייר כל עמוד על canvas (הוא מסדר נכון עברית מימין לשמאל,
     ניקוד, מספרים ואנגלית), וכל עמוד נכנס ל-PDF כתמונה.
     עמוד A4 ברזולוציה של 150 נקודות לאינץ׳.
     ============================================================ */
  var PAGE_W = 1240, PAGE_H = 1754, MARGIN = 96, FOOTER = 60;
  var BODY = '"Heebo", "Arial Hebrew", Arial, sans-serif';
  var TITLE = '"Frank Ruhl Libre", "David Libre", "Times New Roman", serif';
  var INK = '#1F3A4D', MUTED = '#6B6557', BOX_BG = '#F7F1E1', BOX_LINE = '#D8C9A3', RULE = '#C99A4C';
  var PAD = 22;
  var FONTS = {
    title:  { font: '900 50px ' + TITLE, lh: 66 },
    meta:   { font: '30px ' + BODY, lh: 46 },
    label:  { font: 'bold 30px ' + BODY, lh: 44 },
    answer: { font: '30px ' + BODY, lh: 48 },
    footer: { font: '22px ' + BODY, lh: 30 }
  };

  /* פירוק מילה ארוכה לאותיות, בלי להפריד ניקוד וטעמים מהאות שלהם */
  function clusters(word){
    return word.match(/[\s\S][֑-ׇ̀-ͯ‌‍️]*/g) || [];
  }

  function wrap(ctx, text, width){
    var lines = [];
    String(text).replace(/\r\n?/g, '\n').split('\n').forEach(function(par){
      var words = par.split(/[ \t]+/).filter(Boolean);
      if(!words.length){ lines.push(''); return; }
      var line = '';
      words.forEach(function(w){
        var tryLine = line ? line + ' ' + w : w;
        if(ctx.measureText(tryLine).width <= width){ line = tryLine; return; }
        if(line) lines.push(line);
        line = '';
        if(ctx.measureText(w).width <= width){ line = w; return; }
        clusters(w).forEach(function(ch){
          if(line && ctx.measureText(line + ch).width > width){ lines.push(line); line = ''; }
          line += ch;
        });
      });
      lines.push(line);
    });
    while(lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    return lines;
  }

  /* שלב 1: פריסה - מחליטים מה נכתב בכל עמוד (עדיין בלי לצייר) */
  function layoutPages(ctx, opts){
    var right = PAGE_W - MARGIN, width = PAGE_W - 2 * MARGIN;
    var bottom = PAGE_H - MARGIN - FOOTER;
    var pages = [], ops, y;
    function newPage(){ ops = []; pages.push(ops); y = MARGIN; }
    function text(kind, str, x, align, color){
      ops.push({ t: 'text', font: FONTS[kind].font, text: str, x: x == null ? right : x, y: y + FONTS[kind].lh * 0.72, align: align || 'right', color: color || INK });
      y += FONTS[kind].lh;
    }
    function lines(kind, str, w){ ctx.font = FONTS[kind].font; return wrap(ctx, str, w); }
    newPage();

    /* כותרת: שם המטלה, התלמיד, הכיתה, מתי נשלח */
    lines('title', opts.assignment || 'מטלה', width).forEach(function(l){ text('title', l); });
    y += 6;
    text('meta', 'שם: ' + opts.studentName + (opts.studentClass ? '   ·   כיתה: ' + opts.studentClass : ''));
    text('meta', 'נשלח: ' + sentAt() + (answeredLine(opts) ? '   ·   ' + answeredLine(opts) : ''), null, 'right', MUTED);
    y += 14;
    ops.push({ t: 'rect', x: MARGIN, y: y, w: width, h: 3, fill: RULE });
    y += 40;

    opts.items.forEach(function(item){
      var label = lines('label', item.label, width);
      var answer = lines('answer', item.value, width - 2 * PAD);
      var lh = FONTS.answer.lh;
      /* השאלה לא נשארת לבד בתחתית עמוד: צריך מקום גם לשורה או שתיים מהתשובה */
      var need = label.length * FONTS.label.lh + 10 + 2 * PAD + Math.min(answer.length, 2) * lh;
      if(y + need > bottom && y > MARGIN) newPage();
      label.forEach(function(l){ text('label', l); });
      y += 10;
      var i = 0;
      while(i < answer.length){
        var fit = Math.floor((bottom - y - 2 * PAD) / lh);
        if(fit < 1){ newPage(); continue; }
        var chunk = answer.slice(i, i + fit);
        var h = chunk.length * lh + 2 * PAD;
        ops.push({ t: 'rect', x: MARGIN, y: y, w: width, h: h, fill: BOX_BG, stroke: BOX_LINE });
        y += PAD;
        chunk.forEach(function(l){ text('answer', l, right - PAD); });
        y += PAD;
        i += chunk.length;
        if(i < answer.length) newPage();
      }
      y += 38;
    });
    return pages;
  }

  /* שלב 2: ציור כל עמוד ושמירה כתמונת JPEG */
  function drawPage(canvas, ctx, ops, n, total){
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ops.concat([{ t: 'text', font: FONTS.footer.font, text: 'עמוד ' + n + ' מתוך ' + total + '   ·   בית המדרש הדיגיטלי', x: PAGE_W / 2, y: PAGE_H - MARGIN + 16, align: 'center', color: MUTED }])
      .forEach(function(op){
        if(op.t === 'rect'){
          ctx.fillStyle = op.fill;
          ctx.fillRect(op.x, op.y, op.w, op.h);
          if(op.stroke){ ctx.strokeStyle = op.stroke; ctx.lineWidth = 2; ctx.strokeRect(op.x + 1, op.y + 1, op.w - 2, op.h - 2); }
          return;
        }
        ctx.font = op.font;
        ctx.fillStyle = op.color;
        ctx.textAlign = op.align;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(op.text, op.x, op.y);
      });
    var data = canvas.toDataURL('image/jpeg', 0.82);
    if(data.indexOf('data:image/jpeg;base64,') !== 0) throw new Error('הדפדפן לא יצר תמונת JPEG');
    var bin = atob(data.slice(data.indexOf(',') + 1));
    var bytes = new Uint8Array(bin.length);
    for(var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return bytes;
  }

  /* שלב 3: קובץ PDF פשוט - בכל עמוד תמונה אחת בגודל A4 */
  function latin1(str){
    var b = new Uint8Array(str.length);
    for(var i = 0; i < str.length; i++) b[i] = str.charCodeAt(i) & 0xFF;
    return b;
  }
  function pdfText(str){ /* מחרוזת עברית בתוך PDF: UTF-16BE בקידוד הקסדצימלי */
    var hex = 'FEFF';
    for(var i = 0; i < str.length; i++) hex += ('000' + str.charCodeAt(i).toString(16).toUpperCase()).slice(-4);
    return '<' + hex + '>';
  }
  function buildPdf(images, title){
    var chunks = [], pos = 0, offsets = [];
    function add(x){ var b = typeof x === 'string' ? latin1(x) : x; chunks.push(b); pos += b.length; }
    function obj(n, body){ offsets[n] = pos; add(n + ' 0 obj\n' + body + '\nendobj\n'); }
    var W = '595.28', H = '841.89';
    var count = images.length, infoObj = 3 + 3 * count;
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    var kids = images.map(function(_, i){ return (3 + 3 * i) + ' 0 R'; }).join(' ');
    obj(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + count + ' >>');
    images.forEach(function(img, i){
      var pageObj = 3 + 3 * i, contentObj = pageObj + 1, imageObj = pageObj + 2;
      obj(pageObj, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /P' + i + ' ' + imageObj + ' 0 R >> >> /Contents ' + contentObj + ' 0 R >>');
      var draw = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /P' + i + ' Do Q';
      obj(contentObj, '<< /Length ' + draw.length + ' >>\nstream\n' + draw + '\nendstream');
      offsets[imageObj] = pos;
      add(imageObj + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + PAGE_W + ' /Height ' + PAGE_H +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.length + ' >>\nstream\n');
      add(img);
      add('\nendstream\nendobj\n');
    });
    obj(infoObj, '<< /Title ' + pdfText(title) + ' /Creator ' + pdfText('בית המדרש הדיגיטלי') + ' >>');
    var xref = pos, size = infoObj + 1;
    var table = 'xref\n0 ' + size + '\n0000000000 65535 f \n';
    for(var n = 1; n < size; n++) table += ('0000000000' + offsets[n]).slice(-10) + ' 00000 n \n';
    add(table + 'trailer\n<< /Size ' + size + ' /Root 1 0 R /Info ' + infoObj + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    var out = new Uint8Array(pos), at = 0;
    chunks.forEach(function(c){ out.set(c, at); at += c.length; });
    return out;
  }
  function bytesToBase64(bytes){
    var s = '';
    for(var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }

  /* הגופנים של האתר (Heebo, Frank Ruhl Libre) - אם הדף כבר טוען אותם */
  function fontsReady(){
    if(!document.fonts || !document.fonts.load) return Promise.resolve();
    var wait = Promise.all([FONTS.title.font, FONTS.label.font, FONTS.answer.font].map(function(f){
      return document.fonts.load(f, 'אבג').catch(function(){});
    }));
    return Promise.race([wait, new Promise(function(r){ setTimeout(r, 1500); })]);
  }

  function buildAnswersPdf(opts){
    var canvas = document.createElement('canvas');
    canvas.width = PAGE_W; canvas.height = PAGE_H;
    canvas.setAttribute('dir', 'rtl');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;left:-99999px;top:0;width:10px;height:14px;visibility:hidden;';
    document.body.appendChild(canvas);
    try{
      var ctx = canvas.getContext('2d');
      if(!ctx) throw new Error('אין canvas');
      if('direction' in ctx) ctx.direction = 'rtl';
      var pages = layoutPages(ctx, opts);
      var images = pages.map(function(ops, i){ return drawPage(canvas, ctx, ops, i + 1, pages.length); });
      var pdf = buildPdf(images, opts.assignment + ' - ' + opts.studentName);
      return { pages: pages, images: images, bytes: pdf };
    } finally {
      canvas.parentNode.removeChild(canvas);
    }
  }

  function labelFor(field){
    if(field.dataset && field.dataset.submitLabel) return field.dataset.submitLabel;
    var labelledBy = field.getAttribute('aria-labelledby');
    if(labelledBy){
      var labelEl = document.getElementById(labelledBy);
      if(labelEl && labelEl.textContent.trim()) return labelEl.textContent.trim();
    }
    var ariaLabel = field.getAttribute('aria-label');
    if(ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
    return field.dataset.id || 'שאלה';
  }

  function safeName(str){ return str.replace(/[\\/:*?"<>|]/g, ' '); }

  /* הקובץ שיישלח: PDF, ואם זה לא מצליח - HTML כמו קודם */
  function buildFile(opts){
    return fontsReady().then(function(){
      var pdf = buildAnswersPdf(opts);
      return {
        fileName: safeName(opts.assignment + ' - ' + opts.studentName + '.pdf'),
        fileMimeType: 'application/pdf',
        fileBase64: bytesToBase64(pdf.bytes)
      };
    }).catch(function(err){
      if(window.console) console.warn('PDF לא נוצר, נשלח HTML במקום:', err);
      return {
        fileName: safeName(opts.assignment + ' - ' + opts.studentName + '.html'),
        fileMimeType: 'text/html',
        fileBase64: utf8ToBase64(buildAnswersHtml(opts))
      };
    });
  }

  /**
   * opts: { studentName, studentClass, assignment, fields: [HTMLElement,...], items, total, notes }
   * fields - רשימת שדות .answer לאסוף מהם תשובות (ריקים מדולגים).
   * items - במקום fields: רשימה מוכנה של { label, value } (למשל בחירות במבחן אמריקאי).
   * total - כמה שאלות יש בדף (לא חובה): בראש דף התשובות יופיע "נענו X מתוך Y שאלות".
   * מחזיר Promise שמתממש לתוצאת ה-fetch המפוענחת (JSON).
   */
  function sendDirectSubmission(opts){
    var items = (opts.items || opts.fields
      .map(function(f){ return { label: labelFor(f), value: (f.value || '').trim() }; }))
      .filter(function(item){ return item.value.length > 0; });

    if(items.length === 0){
      return Promise.reject(new Error('לא מולאו עדיין תשובות בדף.'));
    }

    var doc = {
      studentName: opts.studentName,
      studentClass: opts.studentClass,
      assignment: opts.assignment,
      total: opts.total || 0,
      items: items
    };

    return buildFile(doc).then(function(file){
      var payload = {
        studentName: opts.studentName,
        studentClass: opts.studentClass || '',
        assignment: opts.assignment,
        notes: opts.notes || '',
        fileName: file.fileName,
        fileMimeType: file.fileMimeType,
        fileBase64: file.fileBase64
      };
      return fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    }).then(function(response){ return response.json(); });
  }

  window.BeitMidrashDirectSubmit = {
    send: sendDirectSubmission,
    /* לבדיקות ולתצוגה מקדימה: בונה את דף התשובות בלי לשלוח */
    preview: function(opts){ return fontsReady().then(function(){ return buildAnswersPdf(opts); }); }
  };
})();
