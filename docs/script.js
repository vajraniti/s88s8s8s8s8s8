// hiranya. data.json says what the week is (it is rebuilt every few minutes from the calendar,
// fred and the gold chart); the page keeps its own clock for everything that counts down.
//
// for looking without waiting:
//   ?now=2026-10-21T16:23   pretend it is that time, utc+3
//   ?data=other.json        read another data file from this folder
(function () {
  'use strict';

  var TZ = 3 * 3600e3;                                 // the page lives in utc+3
  var POLL = 120e3;                                    // ask for fresh data every two minutes
  var DAY = 864e5;
  // the toner glyph cells in img/t/: every digit shares one advance (arimo has tabular digits)
  var G = { h: 605, x: 14, digit: { w: 280, adv: 128.1 }, colon: { w: 213, adv: 61.1 } };
  var FAR = 90 * 60e3;                                 // how long "came and went" stays up top

  var q = new URLSearchParams(location.search);
  var offset = 0;
  if (q.get('now')) {
    var pretend = Date.parse(q.get('now') + ':00+03:00');
    if (!isNaN(pretend)) offset = pretend - Date.now();
  }
  function clock() { return Date.now() + offset; }
  var source = /^[\w.-]+\.json$/.test(q.get('data') || '') ? q.get('data') : 'data.json';

  // ---------------------------------------------------------------- small things
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function local(ms) { return new Date(ms + TZ); }
  function hm(ms) { var d = local(ms); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
  function dayKey(ms) { var d = local(ms); return d.getUTCFullYear() * 400 + d.getUTCMonth() * 32 + d.getUTCDate(); }
  var WD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var DAYS = { sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday' };
  var MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function wd(ms) { return WD[local(ms).getUTCDay()]; }

  var ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function say(n) { return n < 20 ? ones[n] : n < 100 ? tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '') : String(n); }
  function times(n) { return n === 1 ? 'once' : n === 2 ? 'twice' : say(n) + ' times'; }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function set(sel, text) { $$(sel).forEach(function (el) { el.textContent = text; }); }

  // ---------------------------------------------------------------- the pen
  // every mark is drawn with its own small wobble, seeded by what it marks, so it stays put on redraw
  function seeded(key) {
    var h = 2166136261;
    for (var i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
    return function () {
      h |= 0; h = h + 0x6D2B79F5 | 0;
      var t = Math.imul(h ^ h >>> 15, 1 | h);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r, sd) {
    var u = r() || 1e-9, v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
  }
  function f2(n) { return n.toFixed(2); }

  // impact as strokes: three for high, two for medium, each with its own lean and taper
  function tally(n, key) {
    var r = seeded('tally' + key), d = [];
    for (var i = 0; i < n; i++) {
      var x0 = 2.5 + i * 5.4 + gauss(r, 0.35), top = 1.2 + gauss(r, 0.5), bot = 14.2 + gauss(r, 0.45);
      var lean = 0.5 + gauss(r, 0.35), w1 = 0.95 + gauss(r, 0.12), w2 = 0.55 + gauss(r, 0.08);
      d.push('M' + f2(x0 - w1) + ',' + f2(top) + ' L' + f2(x0 + w1) + ',' + f2(top + 0.3) + ' L' +
             f2(x0 + lean + w2) + ',' + f2(bot) + ' L' + f2(x0 + lean - w2) + ',' + f2(bot + 0.2) + 'Z');
    }
    return '<svg class="tally" viewBox="0 0 18 16" aria-hidden="true"><path d="' + d.join(' ') + '"/></svg>';
  }

  // one tapered pen stroke from (x0,y0) to (x1,y1)
  function seg(r, x0, y0, x1, y1, w0, w1, n) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy), nx = -dy / L, ny = dx / L;
    var top = [], bot = [], drift = 0;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      drift += gauss(r, 0.12) * 0.25;
      var x = x0 + dx * t, y = y0 + dy * t + drift, w = (w0 + (w1 - w0) * t) * (1 + gauss(r, 0.05));
      top.push(f2(x + nx * w / 2) + ',' + f2(y + ny * w / 2));
      bot.unshift(f2(x - nx * w / 2) + ',' + f2(y - ny * w / 2));
    }
    return 'M' + top.concat(bot).join(' L') + 'Z';
  }
  function arrow(key) {
    var r = seeded('arrow' + key);
    var y = 5.2 + gauss(r, 0.25), tip = 16.2 + gauss(r, 0.3);
    var d = seg(r, 0.8 + gauss(r, 0.2), y + gauss(r, 0.3), tip, y, 1.55, 1.25, 14) + ' ' +
            seg(r, tip + 0.2, y, tip - 4.6 + gauss(r, 0.3), y - 3.6 + gauss(r, 0.3), 1.45, 1.0, 6) + ' ' +
            seg(r, tip + 0.2, y, tip - 4.4 + gauss(r, 0.3), y + 3.5 + gauss(r, 0.3), 1.45, 1.0, 6);
    return '<svg class="ar" viewBox="0 0 18 10" role="img" aria-label="so"><path d="' + d + '"/></svg>';
  }
  // the book's rule with the "->" drawn as arrows; an arrow never parts from what it points at
  function ruleHTML(text, key) {
    var parts = text.split(' -> '), out = esc(parts[0]);
    for (var i = 1; i < parts.length; i++) out += ' <span class="nb">' + arrow(key + ':' + i) + ' ' + esc(parts[i]) + '</span>';
    return out;
  }
  var MOVE = {
    up: '<svg class="mv" viewBox="0 0 10 10" role="img" aria-label="up"><path d="M0.7,9.1 L9.5,8.8 L5.3,0.8Z"/></svg>',
    down: '<svg class="mv" viewBox="0 0 10 10" role="img" aria-label="down"><path d="M0.5,1.2 L9.3,1.5 L4.6,9.2Z"/></svg>'
  };
  var BRACKET = 'M13.8,-0.3 L13.1,0.0 L12.6,0.4 L12.0,0.7 L11.4,1.1 L10.8,1.6 L10.2,2.1 L9.8,2.4 L9.3,2.6 L8.6,3.0 L8.0,3.6 L7.5,3.9 L7.1,4.1 L6.6,4.4 L5.8,5.0 L5.2,6.4 L5.1,10.1 L4.9,13.6 L4.7,17.2 L4.6,21.0 L4.4,24.6 L4.3,28.3 L4.1,32.0 L3.9,35.6 L3.8,39.3 L3.6,42.8 L3.5,46.5 L3.4,50.1 L3.2,53.7 L3.1,57.3 L2.9,60.3 L2.5,61.9 L2.2,63.7 L1.9,65.4 L1.7,67.2 L1.4,69.0 L1.1,70.6 L0.9,72.5 L0.7,74.4 L0.4,76.0 L0.2,77.8 L-0.1,79.6 L-0.3,81.4 L-0.5,83.1 L-0.9,84.8 L-0.8,86.7 L-0.5,88.6 L-0.2,90.4 L0.2,92.2 L0.5,94.0 L0.9,95.7 L1.3,97.5 L1.5,99.2 L2.0,101.1 L2.4,102.8 L2.7,104.7 L3.0,106.5 L3.3,108.3 L3.6,110.2 L4.0,111.9 L4.0,114.6 L4.0,118.2 L4.0,121.5 L4.0,125.0 L4.0,128.4 L4.1,131.9 L4.1,135.4 L4.1,138.9 L4.1,142.4 L4.2,145.9 L4.2,149.4 L4.2,152.9 L4.2,156.3 L4.2,159.8 L4.2,163.3 L4.7,164.6 L5.5,165.3 L6.1,165.8 L6.6,166.2 L7.2,166.8 L7.8,167.3 L8.4,167.8 L9.0,168.3 L9.5,168.7 L10.1,169.2 L10.6,169.9 L11.2,170.3 L11.7,170.9 L12.3,171.6 L12.8,172.1 L13.2,171.7 L12.6,171.2 L12.0,170.6 L11.5,170.0 L11.0,169.5 L10.4,168.9 L9.9,168.3 L9.5,167.8 L9.0,167.2 L8.5,166.6 L8.0,166.0 L7.5,165.3 L6.9,164.9 L6.3,164.3 L5.9,163.9 L5.7,163.2 L5.7,159.8 L5.8,156.3 L5.8,152.9 L5.8,149.4 L5.8,145.9 L5.8,142.4 L5.9,138.9 L5.9,135.4 L5.9,131.9 L5.8,128.4 L5.9,125.0 L5.9,121.5 L5.9,118.2 L5.9,114.6 L5.9,111.7 L5.5,109.8 L5.2,108.0 L4.9,106.1 L4.6,104.4 L4.3,102.4 L3.9,100.7 L3.5,98.8 L3.3,97.1 L3.0,95.3 L2.6,93.6 L2.3,91.8 L2.0,90.0 L1.7,88.3 L1.4,86.5 L1.4,85.0 L1.7,83.5 L1.9,81.6 L2.1,79.9 L2.4,78.2 L2.6,76.3 L2.8,74.6 L3.1,72.8 L3.3,71.0 L3.6,69.3 L3.8,67.5 L4.2,65.8 L4.4,64.1 L4.7,62.3 L5.0,60.5 L5.2,57.4 L5.3,53.8 L5.4,50.1 L5.5,46.5 L5.6,42.9 L5.7,39.4 L5.8,35.7 L5.9,32.1 L6.1,28.4 L6.2,24.7 L6.4,21.1 L6.6,17.3 L6.7,13.7 L6.8,10.1 L6.9,6.5 L7.1,6.0 L7.4,5.9 L7.9,5.6 L8.5,5.2 L9.1,4.7 L9.5,4.1 L10.0,3.8 L10.5,3.5 L11.1,3.1 L11.6,2.5 L12.1,2.0 L12.6,1.6 L13.1,1.1 L13.6,0.7 L14.1,0.1Z';
  var UNDERLINE = '<svg viewBox="0 0 152 8" preserveAspectRatio="none" aria-hidden="true"><path d="M0.0,4.1 L2.5,4.4 L4.8,4.5 L7.2,4.6 L9.5,4.7 L11.8,5.0 L14.3,5.2 L16.7,5.3 L19.0,5.2 L21.4,5.1 L23.7,5.4 L26.1,5.5 L28.5,5.4 L30.8,5.3 L33.1,5.3 L35.4,5.4 L37.8,5.5 L40.2,5.4 L42.4,5.5 L44.9,5.7 L47.3,5.7 L49.6,5.9 L52.0,6.1 L54.4,6.1 L56.8,6.2 L59.2,6.1 L61.5,6.2 L64.0,6.1 L66.4,6.1 L68.7,6.1 L71.3,6.2 L74.0,6.0 L76.7,6.0 L79.4,5.8 L82.1,5.7 L84.8,5.6 L87.5,5.4 L90.2,5.5 L93.0,5.5 L95.7,5.3 L98.4,5.3 L101.1,5.3 L103.9,5.1 L106.7,5.1 L109.4,4.7 L112.2,4.6 L114.9,4.6 L117.6,4.5 L120.3,4.4 L122.9,4.4 L125.6,4.1 L128.3,4.2 L130.9,4.0 L133.6,4.0 L136.4,3.8 L139.1,3.8 L141.8,3.7 L144.6,3.8 L147.3,3.7 L150.1,3.7 L150.1,3.2 L147.3,3.2 L144.6,3.3 L141.8,3.2 L139.1,3.3 L136.4,3.0 L133.6,3.0 L130.9,2.9 L128.3,3.0 L125.6,2.9 L122.9,3.0 L120.3,3.0 L117.5,3.0 L114.9,3.1 L112.1,3.0 L109.3,3.1 L106.6,3.4 L103.9,3.4 L101.1,3.5 L98.4,3.5 L95.6,3.5 L92.9,3.7 L90.2,3.7 L87.4,3.6 L84.7,3.7 L82.1,3.8 L79.3,3.9 L76.6,4.0 L73.9,4.1 L71.3,4.2 L68.8,4.1 L66.4,4.1 L64.0,4.1 L61.5,4.1 L59.2,4.0 L56.8,4.1 L54.4,4.0 L52.1,4.1 L49.8,3.9 L47.4,3.8 L45.0,3.8 L42.5,3.6 L40.2,3.6 L37.8,3.7 L35.5,3.7 L33.1,3.6 L30.7,3.7 L28.4,3.8 L26.1,4.0 L23.8,3.9 L21.4,3.6 L19.0,3.7 L16.6,3.9 L14.3,3.9 L12.0,3.7 L9.6,3.5 L7.2,3.5 L4.8,3.5 L2.5,3.6 L0.1,3.6Z"/></svg>';
  var NOWLINE = 'M-0.0,6.2 L5.6,6.2 L11.3,6.2 L16.9,6.2 L22.6,6.3 L28.3,6.2 L33.9,6.2 L39.6,6.3 L45.2,6.3 L50.9,6.3 L56.6,6.3 L62.2,6.2 L67.8,6.3 L73.5,6.2 L79.2,6.2 L84.9,6.0 L90.5,6.0 L96.2,5.9 L101.9,5.9 L107.6,5.8 L113.2,5.9 L118.9,5.9 L124.5,6.0 L130.2,5.9 L135.9,5.9 L141.6,5.9 L147.2,6.0 L152.8,5.9 L158.5,5.8 L164.2,5.8 L169.8,5.8 L175.5,5.9 L181.2,5.9 L186.9,5.9 L192.6,6.0 L198.2,6.0 L203.9,6.0 L209.5,6.0 L215.2,6.0 L220.8,5.9 L226.5,5.9 L232.2,5.9 L237.9,5.9 L243.5,5.9 L249.1,5.9 L254.8,5.9 L260.4,6.0 L266.1,6.0 L271.7,5.9 L277.3,5.9 L282.9,5.9 L288.6,5.9 L294.3,5.9 L299.9,5.8 L306.0,5.8 L312.0,6.0 L318.0,6.0 L324.1,6.0 L330.1,6.0 L336.1,6.0 L342.2,6.0 L348.2,6.0 L354.2,5.9 L360.3,6.0 L366.3,6.1 L372.4,6.1 L378.4,6.1 L384.4,6.2 L390.5,6.2 L396.5,6.2 L402.6,6.2 L408.7,6.2 L414.7,6.3 L420.8,6.4 L426.8,6.3 L432.9,6.4 L438.9,6.6 L444.9,6.6 L450.9,6.5 L457.0,6.6 L463.0,6.6 L469.0,6.6 L475.1,6.6 L481.2,6.6 L487.1,6.6 L493.1,6.7 L499.1,6.7 L505.1,6.8 L511.1,6.9 L517.2,6.9 L523.2,7.0 L529.3,7.0 L535.3,7.0 L541.4,6.9 L547.6,7.0 L553.6,6.9 L559.6,6.8 L565.6,6.8 L571.7,6.8 L577.8,6.8 L583.8,7.0 L589.8,6.9 L595.9,7.0 L601.9,7.2 L608.0,7.2 L613.9,7.3 L620.0,7.3 L627.3,7.2 L634.7,7.2 L642.1,7.1 L649.5,7.0 L656.8,6.9 L664.2,6.9 L671.6,6.8 L678.9,6.7 L686.3,6.6 L693.6,6.7 L700.9,6.6 L708.2,6.5 L715.6,6.5 L722.9,6.4 L730.4,6.3 L737.7,6.2 L745.1,6.1 L752.5,6.0 L759.9,5.9 L767.2,5.9 L774.5,5.9 L781.9,6.0 L789.3,5.9 L796.7,5.9 L804.0,5.8 L811.4,5.9 L818.7,5.8 L826.1,5.8 L833.5,5.7 L840.8,5.6 L848.2,5.6 L855.5,5.5 L862.9,5.4 L870.2,5.3 L877.6,5.2 L885.0,5.0 L892.3,5.1 L899.7,5.0 L907.0,5.0 L914.3,4.9 L921.7,4.8 L929.1,4.7 L936.4,4.7 L943.7,4.6 L951.1,4.5 L958.5,4.4 L965.8,4.3 L973.2,4.2 L980.5,4.3 L987.9,4.2 L995.2,4.2 L1002.6,4.2 L1010.0,4.1 L1010.0,3.7 L1002.6,3.8 L995.2,3.8 L987.9,3.8 L980.5,3.9 L973.2,3.8 L965.8,3.9 L958.5,4.0 L951.1,4.1 L943.7,4.2 L936.4,4.3 L929.1,4.3 L921.7,4.3 L914.3,4.3 L907.0,4.3 L899.7,4.2 L892.3,4.3 L885.0,4.2 L877.6,4.3 L870.2,4.4 L862.9,4.4 L855.5,4.5 L848.2,4.7 L840.8,4.6 L833.4,4.7 L826.1,4.7 L818.7,4.7 L811.4,4.8 L804.0,4.7 L796.7,4.7 L789.3,4.7 L781.9,4.8 L774.5,4.7 L767.2,4.7 L759.9,4.7 L752.5,4.8 L745.1,4.8 L737.7,4.9 L730.4,5.0 L722.9,5.1 L715.6,5.2 L708.2,5.2 L700.9,5.3 L693.6,5.3 L686.3,5.3 L678.9,5.3 L671.6,5.5 L664.2,5.5 L656.8,5.6 L649.5,5.6 L642.1,5.7 L634.7,5.7 L627.3,5.7 L620.0,5.8 L614.0,5.8 L608.0,5.7 L601.9,5.7 L595.9,5.5 L589.8,5.4 L583.8,5.5 L577.8,5.3 L571.7,5.3 L565.6,5.3 L559.6,5.3 L553.6,5.3 L547.5,5.4 L541.4,5.4 L535.3,5.4 L529.3,5.4 L523.2,5.4 L517.2,5.3 L511.1,5.2 L505.1,5.1 L499.2,5.1 L493.2,5.1 L487.2,5.0 L481.2,4.9 L475.1,5.0 L469.0,5.0 L463.0,5.0 L457.0,4.9 L450.9,4.9 L444.9,5.0 L438.9,5.0 L432.9,4.8 L426.8,4.7 L420.8,4.7 L414.7,4.7 L408.7,4.6 L402.6,4.5 L396.5,4.5 L390.5,4.5 L384.5,4.6 L378.4,4.4 L372.4,4.4 L366.3,4.5 L360.3,4.4 L354.3,4.3 L348.2,4.4 L342.1,4.4 L336.1,4.5 L330.1,4.5 L324.1,4.5 L318.0,4.5 L312.0,4.4 L306.0,4.3 L299.9,4.3 L294.2,4.4 L288.6,4.3 L282.9,4.4 L277.3,4.4 L271.7,4.4 L266.0,4.5 L260.4,4.5 L254.8,4.3 L249.1,4.4 L243.5,4.4 L237.9,4.4 L232.2,4.5 L226.5,4.5 L220.8,4.5 L215.2,4.6 L209.5,4.6 L203.9,4.6 L198.2,4.6 L192.6,4.6 L186.9,4.5 L181.2,4.6 L175.5,4.6 L169.8,4.6 L164.2,4.5 L158.5,4.6 L152.8,4.7 L147.2,4.8 L141.6,4.7 L135.9,4.7 L130.2,4.7 L124.5,4.8 L118.9,4.7 L113.2,4.7 L107.6,4.6 L101.9,4.8 L96.2,4.8 L90.5,4.9 L84.8,5.0 L79.2,5.1 L73.5,5.2 L67.8,5.3 L62.2,5.3 L56.6,5.3 L50.9,5.4 L45.2,5.4 L39.6,5.4 L33.9,5.4 L28.3,5.4 L22.6,5.5 L16.9,5.5 L11.3,5.5 L5.6,5.6 L-0.0,5.8Z';

  // the tallies scratched into the night: one mark per call the book made, the lies crossed out
  function scratches(calls, key) {
    var r = seeded('scratch' + key), d = [], W = Math.max(300, 70 + calls.length * 72);
    function line(x0, y0, x1, y1, w) {
      d.push(seg(r, x0, y0, x1, y1, w, w * 0.8, 22));
    }
    calls.forEach(function (c, i) {
      var x = 42 + i * 72 + gauss(r, 4), top = 15 + gauss(r, 3), bot = 232 + gauss(r, 4), lean = gauss(r, 4);
      for (var k = 0; k < 3; k++) line(x + k * 2.6 + gauss(r, 0.6), top + k * 3, x + lean + k * 2.4, bot - k * 3.5, 2.4 - k * 0.5);
      if (c === 'lied') {
        for (var j = 0; j < 3; j++) line(x - 38 + j * 1.6, 202 - j * 2.2, x + 66 + j * 1.2, 48 - j * 1.4, 2.1 - j * 0.4);
      }
    });
    return { d: d.join(' '), w: W };
  }

  // ---------------------------------------------------------------- toner type
  function toner(el, s, flip) {
    var x = 0, html = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), g = c === ':' ? G.colon : G.digit;
      var name = (c === ':' ? 'colon' : c) + ((i + flip) % 2 ? 'b' : 'a');   // a repeated digit is never the same copy
      html += '<img src="img/t/' + name + '.png" alt="" style="left:' + ((x - G.x) / G.h).toFixed(4) +
              'em;width:' + (g.w / G.h).toFixed(4) + 'em">';
      x += g.adv;
    }
    el.innerHTML = html;
    el.style.width = ((x + 10) / G.h).toFixed(4) + 'em';
  }

  // ---------------------------------------------------------------- the data
  var DATA = null, EVENTS = [], WEEK0 = 0;
  function load(data) {
    DATA = data;
    WEEK0 = Date.parse(data.week.start);
    EVENTS = data.events.map(function (e, i) { return { e: e, ms: Date.parse(e.time), i: i }; })
                        .sort(function (a, b) { return a.ms - b.ms || a.i - b.i; });   // same minute: the calendar's order
    drawGold();
    var mon = local(WEEK0), fri = local(WEEK0 + 4 * DAY);
    set('[data-week-no]', String(data.week.iso_week));
    set('[data-week-title]', 'week ' + data.week.iso_week + ', ' + MON[mon.getUTCMonth()] + ' ' + mon.getUTCDate() + ' to ' +
        (fri.getUTCMonth() !== mon.getUTCMonth() ? MON[fri.getUTCMonth()] + ' ' : '') + fri.getUTCDate());
    var gen = Date.parse(data.generated_at);
    set('[data-updated]', isNaN(gen) ? 'just now' : wd(gen) + ' ' + hm(gen) + ' utc+3');
    shown = null;
  }

  // gold this week, in the sky over the word: monday 00:00 at the left, saturday 00:00 at the right
  function drawGold() {
    var pts = (DATA.gold && DATA.gold.points) || [];
    var fig = $('[data-gold]'), path = $('[data-goldline]'), now = $('[data-xau-now]');
    if (pts.length < 2) { path.setAttribute('d', ''); fig.hidden = true; return; }
    var lo = Infinity, hi = -Infinity;
    pts.forEach(function (p) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); });
    // a quiet hour stays quiet: less than half a percent of the price is never stretched over the
    // whole height, it sits flat in the middle (an hour into monday is a few dollars, not a cliff)
    var span = Math.max(hi - lo, hi * 0.005);
    lo = (hi + lo - span) / 2;
    var r = seeded('gold' + DATA.week.start), d = '', last = null, X = 0, Y = 0;
    pts.forEach(function (p) {
      var ms = p[0] * 1000;
      X = Math.min(1000, Math.max(0, (ms - WEEK0) / (5 * DAY) * 1000 + gauss(r, 0.35)));
      Y = 270 - (p[1] - lo) / span * 240 + gauss(r, 1.2);
      // the pen lifts where the market was shut
      d += (last === null || ms - last > 2 * 3600e3 ? ' M' : ' L') + X.toFixed(1) + ',' + Y.toFixed(1);
      last = ms;
    });
    path.setAttribute('d', d.trim());
    var first = pts[0][1], price = pts[pts.length - 1][1];
    fig.hidden = false;
    fig.setAttribute('aria-label', 'gold this week: ' + first.toFixed(1) + ' at the open, ' + price.toFixed(1) + ' now');
    now.style.left = (X / 10).toFixed(2) + '%';
    now.style.top = (Y / 3).toFixed(2) + '%';
    now.classList.toggle('flip', X > 820);   // friday's tag would run off the chart
    now.querySelector('span').textContent = price.toFixed(1);
  }

  // ---------------------------------------------------------------- the week
  function passed(x, t) { return x.ms <= t; }
  function nextOf(t) { for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].ms > t) return EVENTS[i]; return null; }
  function numberOut(x) { return x.e.actual != null; }

  function rowsHTML(t) {
    var next = nextOf(t), today = dayKey(t);
    var days = [], byDay = {};
    EVENTS.forEach(function (x) {
      var k = dayKey(x.ms);
      if (!byDay[k]) { byDay[k] = []; days.push(k); }
      byDay[k].push(x);
    });
    var lies = EVENTS.filter(function (x) { return x.e.verdict === 'lied'; });

    // the notes in the right margin
    var notes = {}, spans = {}, skip = {};
    EVENTS.forEach(function (x) {
      var e = x.e, n = '';
      if (e.verdict === 'lied') {
        var hot = parseFloat(e.actual) > parseFloat(e.forecast);
        n = e.noun + ' came in ' + (hot ? 'hot' : 'cold') + ' and gold went ' + e.gold_did +
            ' anyway. somebody didn’t read the book. or the book is old.';
      } else if (e.verdict === 'shrug') n = 'gold shrugged. maybe it already knew.';
      else if (next && x === next) n = 'this is the one.';
      else if (passed(x, t) && e.kind === 'data' && !numberOut(x)) {
        n = e.tracked ? 'it came and went. the number isn’t in yet.' : 'this number isn’t in any free feed. look it up.';
      } else if (!passed(x, t) && e.kind !== 'data') n = 'no numbers. just a voice.';
      notes[e.id] = n;
    });
    // a crowded minute gets one note across its rows
    days.forEach(function (k) {
      var group = [];
      byDay[k].concat([null]).forEach(function (x) {
        if (x && group.length && group[0].ms === x.ms) { group.push(x); return; }
        if (group.length >= 3 && group.every(function (g) { return !notes[g.e.id]; })) {
          notes[group[0].e.id] = DAYS[wd(group[0].ms)] + ' is loud. ' + say(group.length) + ' numbers land at once at ' + hm(group[0].ms) + '.';
          spans[group[0].e.id] = group.length;
          group.slice(1).forEach(function (g) { skip[g.e.id] = true; });
        }
        group = x ? [x] : [];
      });
    });

    var html = '', nowPlaced = false;
    function nowRow() {
      nowPlaced = true;
      return '<tr class="now" data-now><td class="t" data-clock>' + hm(t) + '</td><td colspan="7" class="now-c">' +
             '<span class="now-w">you are here</span><svg class="now-line" viewBox="0 0 1012 10" preserveAspectRatio="none" aria-hidden="true"><path d="' +
             NOWLINE + '"/></svg></td><td class="aside"></td></tr>';
    }
    days.forEach(function (k, di) {
      var first = byDay[k][0].ms, cls = k === today ? ' today' : k > today ? ' later' : ' past';
      var d = local(first).getUTCDate();
      html += '<tbody class="day' + cls + '"><tr class="dayrow"><th colspan="8" scope="rowgroup">' +
              '<span class="sr">' + d + '</span><span class="dnum toner" aria-hidden="true" data-toner="' + d + '" data-flip="' + (1 + di) + '"></span>' +
              '<span class="dname">' + wd(first) + '</span>' + (k === today ? '<span class="dnote">today</span>' : '') +
              '</th><td class="aside"></td></tr>';
      byDay[k].forEach(function (x) {
        if (k === today && !nowPlaced && x.ms > t) html += nowRow();
        html += eventRow(x, t, next, notes[x.e.id], spans[x.e.id], skip[x.e.id]);
        if (next && x === next) html += playbook(x, t, lies);
      });
      if (k === today && !nowPlaced) html += nowRow();
      html += '</tbody>';
    });
    return html;
  }

  function eventRow(x, t, next, note, span, noAside) {
    var e = x.e, out = passed(x, t), cls = ['ev'];
    if (out) cls.push('out');
    if (e.verdict === 'lied') cls.push('lied');
    if (next && x === next) cls.push('next');
    if (out && e.kind === 'data' && !numberOut(x)) cls.push('passed');
    var n = e.impact === 'high' ? 3 : 2;

    var actual;
    if (e.kind !== 'data') actual = '<td class="n a tba">&ndash;</td>';
    else if (numberOut(x)) actual = '<td class="n a">' + esc(e.actual) + '</td>';
    else if (next && x === next) actual = '<td class="n a tba">t.b.a.</td>';
    else actual = '<td class="n a tba">&ndash;</td>';

    var gold = '<td class="n g"></td>';
    if (e.gold) {
      var mv = e.gold.move, sign = mv > 0 ? '+' : mv < 0 ? '&minus;' : '';
      gold = '<td class="n g">' + (mv > 0 ? MOVE.up : mv < 0 ? MOVE.down : '') + sign + Math.abs(mv).toFixed(2) +
             (e.gold.final ? '' : '<span class="sofar">so far</span>') + '</td>';
    }

    var rule = e.book;
    // a number under the forecast reads the book from below
    if (numberOut(x) && e.book_below && e.book_said && e.book_said !== e.above) rule = e.book_below;
    if (next && x === next && e.kind === 'data' && e.above) rule += '. below -> gold ' + (e.above === 'down' ? 'up' : 'down') + '.';
    var r = ruleHTML(rule, e.id);
    var book;
    if (e.verdict === 'lied') book = '<span class="rule"><s class="pencil">' + r + '</s></span><span class="lie">the book lied.</span>';
    else if (e.verdict === 'right') book = '<span class="rule">' + r + '</span><span class="vd">as written</span>';
    else if (e.verdict === 'shrug') book = '<span class="rule">' + r + '</span><span class="vd">gold shrugged</span>';
    else if (numberOut(x) && !e.book_said && e.kind === 'data' && e.forecast) {
      book = '<span class="rule">' + r + '</span><span class="vd">in line. the book has nothing to say</span>';
    } else book = '<span class="rule">' + r + '</span>';

    var aside = noAside ? '' : '<td class="aside"' + (span ? ' rowspan="' + span + '"' : '') + '>' +
                (note ? '<p' + (next && x === next ? ' data-next-aside' : '') + '>' + esc(note) + '</p>' : '') + '</td>';
    return '<tr class="' + cls.join(' ') + '" data-id="' + esc(e.id) + '">' +
           '<td class="t">' + hm(x.ms) + '</td>' +
           '<td class="imp" aria-label="' + e.impact + ' impact">' + tally(n, e.id) + '</td>' +
           '<td class="evn">' + esc(e.title) + '<small>' + esc(e.id) + '</small></td>' +
           actual +
           '<td class="n' + (e.forecast ? '' : ' tba') + '">' + (e.forecast ? esc(e.forecast) : '&ndash;') + '</td>' +
           '<td class="n' + (e.previous ? '' : ' tba') + '">' + (e.previous ? esc(e.previous) : '&ndash;') + '</td>' +
           gold + '<td class="bk">' + book + '</td>' + aside + '</tr>';
  }

  function afterLine(lies, t) {
    var past = lies.filter(function (x) { return x.ms <= t; });
    if (past.length) {
      var x = past[0], hot = parseFloat(x.e.actual) > parseFloat(x.e.forecast);
      return 'remember ' + DAYS[wd(x.ms)] + '. <span class="u">a ' + (hot ? 'hot' : 'cold') + ' number is not a promise.' + UNDERLINE + '</span>';
    }
    return 'the book has held all week. <span class="u">it will not hold forever.' + UNDERLINE + '</span>';
  }

  function playbook(x, t, lies) {
    var e = x.e, items = [];
    var mark = e.forecast || e.previous;
    if (e.kind === 'data') {
      if (mark) {
        var sag = 'the dollar wakes up and gold sags. usually for an hour, rarely for the whole day.';
        var lift = 'the dollar flinches and gold gets its colour back. people were waiting for an excuse.';
        items.push(['above <span class="fig">' + esc(mark) + '</span>', e.above === 'up' ? lift : sag]);
        items.push(['below <span class="fig">' + esc(mark) + '</span>', e.above === 'up' ? sag : lift]);
        items.push(['right on it', 'nobody cares. the spread does, though.']);
      }
    } else {
      items.push(['hawkish', 'rates stay high in every sentence. the dollar stands up and gold sits down.']);
      items.push(['dovish', 'one soft word about cuts and gold remembers what it is for.']);
    }
    items.push(['<span class="fig">' + hm(x.ms) + ':00</span>', e.kind === 'data'
      ? 'the spread doubles, and the first candle lies. wait for the five-minute close.'
      : 'the first headline lies. so does the second.']);
    items.push(['after', afterLine(lies, t)]);
    var dl = items.map(function (it) { return '<dt>' + it[0] + '</dt><dd>' + it[1] + '</dd>'; }).join('');
    return '<tr class="playbook" data-for="' + esc(e.id) + '"><td colspan="8"><div class="pb">' +
           '<svg class="bracket" viewBox="0 0 16 174" preserveAspectRatio="none" aria-hidden="true" style="grid-row:1 / span ' + items.length + '"><path d="' + BRACKET + '"/></svg>' +
           '<dl>' + dl + '</dl></div></td><td class="aside"></td></tr>';
  }

  // ---------------------------------------------------------------- drawing it all
  var shown = null;
  function render(t) {
    var cal = $('.cal');
    $$('.cal tbody').forEach(function (tb) { tb.remove(); });
    $('[data-empty]').hidden = EVENTS.length > 0;
    cal.insertAdjacentHTML('beforeend', rowsHTML(t));
    $$('.dnum.toner').forEach(function (el) { toner(el, el.getAttribute('data-toner'), +el.getAttribute('data-flip')); });

    var next = nextOf(t);
    var big = $('[data-bigtime]'), cap = $('[data-bigtime-cap]');
    var shownEv = next || EVENTS[EVENTS.length - 1];
    if (shownEv) {
      toner(big, hm(shownEv.ms), 0);
      var sameDay = dayKey(shownEv.ms) === dayKey(t);
      var when = hm(shownEv.ms) + ':00 utc+3' + (sameDay ? '' : ', ' + wd(shownEv.ms) + ' ' + local(shownEv.ms).getUTCDate());
      big.setAttribute('aria-label', (next ? 'next release at ' : 'the last release was at ') + hm(shownEv.ms) + ' utc+3');
      cap.innerHTML = esc(when) + '<br>' + (next ? esc(shownEv.e.id) : 'that was the last one');
    } else {
      big.innerHTML = ''; cap.textContent = 'nothing on the calendar';
    }

    // the voice up top
    var printed = EVENTS.filter(function (x) { return passed(x, t) && x.e.kind === 'data'; });
    var lied = EVENTS.filter(function (x) { return x.e.verdict === 'lied'; }).length;
    var right = EVENTS.filter(function (x) { return x.e.verdict === 'right'; }).length;
    set('[data-voice-printed]', !printed.length ? 'nothing has printed yet.'
      : (printed.length === 1 ? 'one has printed. ' : say(printed.length) + ' have printed. ') +
        (lied ? (printed.length === 1 ? 'it lied.' : say(lied) + ' of them lied.') : 'none of them lied.'));
    var waiting = EVENTS.filter(function (x) { return passed(x, t) && x.e.kind === 'data' && x.e.tracked && !numberOut(x) && t - x.ms < FAR; });
    var gone = $('[data-gone]');
    if (waiting.length) {
      var lastMs = waiting[waiting.length - 1].ms;
      var group = waiting.filter(function (x) { return x.ms === lastMs; });
      gone.hidden = false;
      gone.textContent = list(group.map(function (x) { return x.e.title.toLowerCase(); })) + ': ' + hm(lastMs) +
        ' came and went. ' + (group.length > 1 ? 'no numbers yet.' : 'no number yet.');
    } else gone.hidden = true;
    set('[data-next-name]', next ? next.e.title.toLowerCase() : '');

    // the night
    set('[data-book-right]', right ? 'the book was right ' + times(right) + ' this week.' : 'the book has not been right once this week.');
    set('[data-book-lied]', lied ? times(lied) + ' it lied.' : 'it has not lied yet.');
    var calls = EVENTS.filter(function (x) { return x.e.verdict === 'right' || x.e.verdict === 'lied'; })
                      .map(function (x) { return x.e.verdict; });
    var sc = $('[data-scratch]');
    if (calls.length) {
      var s = scratches(calls, DATA.week.start);
      sc.removeAttribute('hidden');           // an svg has no .hidden property
      sc.setAttribute('viewBox', '0 0 ' + s.w + ' 260');
      sc.style.width = (20.8 * s.w / 300).toFixed(2) + 'vw';
      sc.querySelector('path').setAttribute('d', s.d);
      sc.setAttribute('aria-label', say(calls.length) + ' tally marks scratched into the dark. ' +
        (lied ? say(lied) + ' of them crossed out.' : 'none crossed out.'));
    } else sc.setAttribute('hidden', '');
    var lastEv = EVENTS[EVENTS.length - 1], lastEl = $('[data-last]');
    if (!lastEv) lastEl.innerHTML = 'no releases on the calendar this week.';
    else if (lastEv.ms > t) {
      lastEl.innerHTML = 'that’s the week.<br>on ' + DAYS[wd(lastEv.ms)] + ' at ' + hm(lastEv.ms) + ' ' +
        (lastEv.e.kind === 'data' ? 'the last number prints,' : 'someone in a suit will talk,') +
        '<br>and gold will either listen or not.';
    } else lastEl.innerHTML = 'that was the week.<br>gold listened when it wanted to.';
  }

  var early = $('[data-voice-early]'), wait = $('[data-wait]'), weekdayLine = $('[data-weekday-line]');
  function setWait(next, t) {
    if (!next) { wait.innerHTML = 'that was the week.<br>go stand outside.'; return; }
    var m = Math.ceil((next.ms - t) / 60000);
    if (m <= 1) { wait.innerHTML = 'it is about to print.<br>go stand outside.<br>the number will print without you.'; return; }
    if (m < 60) { wait.innerHTML = 'you have <span>' + say(m) + '</span> minutes.<br>go stand outside.<br>the number will print without you.'; return; }
    var h = Math.floor(m / 60);
    if (h < 48) { wait.innerHTML = 'you have <span>' + (h === 1 ? 'an hour' : say(h) + ' hours') + '.</span><br>go to sleep.<br>the number will print without you.'; return; }
    wait.innerHTML = 'you have <span>' + say(Math.floor(h / 24)) + ' days.</span><br>go to sleep.<br>the number will print without you.';
  }

  function tick() {
    if (!DATA) return;
    var t = clock(), next = nextOf(t);
    var sig = DATA.generated_at + '|' + (next ? next.e.id : '-') + '|' + dayKey(t);
    if (sig !== shown) { shown = sig; render(t); }

    var waiting = EVENTS.filter(function (x) { return passed(x, t) && x.e.kind === 'data' && x.e.tracked && !numberOut(x) && t - x.ms < FAR; });
    if (waiting.length) early.textContent = waiting.length === 1 ? 'you missed one.' : 'you missed ' + say(waiting.length) + '.';
    else if (!next) early.textContent = 'you’re late.';
    else early.textContent = next.ms - t < 10 * 60e3 ? 'you’re just in time.' : 'you’re early.';

    set('[data-clock]', hm(t));
    var d = local(t);
    set('[data-clock-long]', wd(t) + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', ' + hm(t));
    var w = wd(t);
    weekdayLine.textContent = w === 'fri' ? 'it’s friday.' : (w === 'sat' || w === 'sun') ? 'it’s the weekend.' : 'it’s only ' + DAYS[w] + '.';

    var count = $('[data-count]');
    if (!next) { count.textContent = 'nothing left this week.'; }
    else {
      var left = next.ms - t, s = Math.max(0, Math.ceil(left / 1000));
      if (left > DAY) {
        count.innerHTML = '<span data-next-name>' + esc(next.e.title.toLowerCase()) + '</span> on ' + DAYS[wd(next.ms)] + ' at ' + hm(next.ms);
      } else {
        count.innerHTML = '<span data-next-name>' + esc(next.e.title.toLowerCase()) + '</span> in <span class="tnum" data-countdown>' +
          pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60) + '</span>';
      }
    }
    setWait(next, t);
  }

  function fetchData() {
    return fetch(source, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(source + ': ' + r.status); return r.json(); })
      .then(function (data) {
        if (!DATA || data.generated_at !== DATA.generated_at) { load(data); tick(); }
      })
      .catch(function (err) {
        if (!DATA) {
          $('[data-empty]').hidden = false;
          $('[data-empty]').textContent = 'the week did not load. the fog is all there is for now.';
        }
        if (window.console) console.warn('hiranya:', err);
      });
  }

  fetchData().then(function () {
    // tick on the second, so the countdown never skips
    setTimeout(function () { tick(); setInterval(tick, 1000); }, 1000 - (clock() % 1000));
    setInterval(fetchData, POLL);
  });
})();
