// hiranya, sketch D. everything that tells the time runs off the week's data (the json block in
// index.html is ../data.json, verbatim) and one clock that starts at the sample "now",
// wed 21 oct, 16:23 utc+3.
//
// the big time always shows the next release that has not printed yet. when its countdown runs
// out, the release is marked "came and went", and the big time moves on to the one after it.
//
// for looking at it without waiting:
//   ?next=16:30   moves the release marked "next" in the data (ism services) to 16:30 that day
//   ?t=5          starts the clock five seconds before the next release
//   ?now=23:10    starts the clock at that time on the sample day
(function () {
  'use strict';
  var DATA = JSON.parse(document.getElementById('week-data').textContent);
  // the toner glyph cells in img/t/: all digits share one advance (arimo has tabular digits)
  var G = { h: 605, x: 14, digit: { w: 280, adv: 128.1 }, colon: { w: 213, adv: 61.1 } };
  var TZ = 3 * 3600e3;                        // utc+3
  var q = new URLSearchParams(location.search);
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function set(list, text) { list.forEach(function (el) { el.textContent = text; }); }

  var now0 = Date.parse(DATA.now);
  var local0 = new Date(now0 + TZ);
  var Y = local0.getUTCFullYear(), M = local0.getUTCMonth(), D0 = local0.getUTCDate();
  function at(day, hm) {                      // "wed 21", "17:00" -> ms
    var d = parseInt(day.split(' ')[1], 10), p = hm.split(':');
    return Date.UTC(Y, M, d, +p[0], +p[1]) - TZ;
  }
  var events = DATA.events.map(function (e) { return { e: e, ms: at(e.day, e.time) }; });

  var nextQ = q.get('next');
  if (nextQ && /^\d{1,2}:\d{2}$/.test(nextQ)) {
    var hm = nextQ.split(':');
    events.forEach(function (x) {
      if (x.e.status === 'next') { x.e.time = pad(+hm[0]) + ':' + hm[1]; x.ms = at(x.e.day, x.e.time); }
    });
  }
  var waiting = events.filter(function (x) { return x.e.status !== 'released'; })
                      .sort(function (a, b) { return a.ms - b.ms; });

  var start = now0;
  var nowQ = q.get('now');
  if (nowQ && /^\d{1,2}:\d{2}$/.test(nowQ)) {
    var nq = nowQ.split(':');
    start = Date.UTC(Y, M, D0, +nq[0], +nq[1]) - TZ;
  }
  var tQ = q.get('t');
  if (tQ !== null && /^\d+$/.test(tQ)) {
    var first = waiting.filter(function (x) { return x.ms > start; })[0];
    if (first) start = first.ms - (+tQ) * 1000;
  }
  var loaded = Date.now();
  function clock() { return start + (Date.now() - loaded); }

  // the table follows the data: every row shows its release time from the data
  var rows = {};
  $$('tr[data-id]').forEach(function (tr) { rows[tr.getAttribute('data-id')] = tr; });
  events.forEach(function (x) {
    var tr = rows[x.e.id], td = tr && tr.querySelector('td.t');
    if (td) td.textContent = x.e.time;
  });

  // ---- the big time, set from loose glyphs
  var big = document.querySelector('[data-bigtime]');
  var cap = document.querySelector('[data-bigtime-cap]');
  function setBig(ev) {
    var s = ev.e.time, x = 0, html = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), g = c === ':' ? G.colon : G.digit;
      var name = (c === ':' ? 'colon' : c) + (i % 2 ? 'b' : 'a');   // repeated digits are never the same copy
      html += '<img src="img/t/' + name + '.png" alt="" style="left:' + ((x - G.x) / G.h).toFixed(4) +
              'em;width:' + (g.w / G.h).toFixed(4) + 'em">';
      x += g.adv;
    }
    big.innerHTML = html;
    big.style.width = ((x + 10) / G.h).toFixed(4) + 'em';
    var day = ev.e.day.split(' ');
    var today = parseInt(day[1], 10) === new Date(clock() + TZ).getUTCDate();
    big.setAttribute('aria-label', 'next release at ' + s + ' utc+3' + (today ? '' : ', ' + day[0]));
    cap.innerHTML = s + ':00 utc+3' + (today ? '' : ', ' + day[0] + ' ' + day[1]) + '<br>' + ev.e.id;
    set($$('[data-next-name]'), ev.e.title.toLowerCase());
  }

  // ---- words for the bottom of the page
  var ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function say(n) { return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : ''); }
  var wait = document.querySelector('[data-wait]');
  function setWait(left) {
    var m = Math.ceil(left / 60000);
    if (m <= 1) { wait.innerHTML = 'it is about to print.<br>go stand outside.<br>the number will print without you.'; return; }
    if (m < 60) { wait.innerHTML = 'you have <span>' + say(m) + '</span> minutes.<br>go stand outside.<br>the number will print without you.'; return; }
    var h = Math.floor(m / 60);
    wait.innerHTML = 'you have <span>' + (h === 1 ? 'an hour' : say(Math.min(h, 99)) + ' hours') + '.</span><br>go to sleep.<br>the number will print without you.';
  }

  // ---- "you are here" goes under the last release that has happened
  var nowRow = document.querySelector('[data-now]');
  function placeNow(t) {
    var last = null;
    events.forEach(function (x) { if (x.ms <= t && rows[x.e.id]) last = x; });
    if (!last || !nowRow) return;
    var tr = rows[last.e.id], after = tr.nextElementSibling;
    if (after && after.classList.contains('playbook')) tr = after;
    if (tr.nextElementSibling !== nowRow) tr.parentNode.insertBefore(nowRow, tr.nextElementSibling);
  }

  var gone = document.querySelector('[data-gone]');
  var shown = null, timer = null;
  function tick() {
    var t = clock();
    var next = null, passed = [];
    waiting.forEach(function (x) { if (x.ms <= t) passed.push(x); else if (!next) next = x; });

    passed.forEach(function (x) {         // printed, but the sample has no number for it
      var tr = rows[x.e.id];
      if (tr && !tr.classList.contains('passed')) {
        tr.classList.add('passed'); tr.classList.remove('next');
        var a = tr.querySelector('[data-actual]'); if (a) a.textContent = 'no number yet';
        var pb = tr.nextElementSibling; if (pb && pb.classList.contains('playbook')) pb.classList.add('spent');
        var aside = tr.querySelector('[data-next-aside]'); if (aside) aside.textContent = 'it came and went. nobody has the number.';
        gone.hidden = false;
        gone.textContent = x.e.title.toLowerCase() + ': ' + x.e.time + ' came and went. no number yet.';
      }
    });

    var local = new Date(t + TZ);
    var hhmm = pad(local.getUTCHours()) + ':' + pad(local.getUTCMinutes());
    set($$('[data-clock]'), hhmm);
    set($$('[data-clock-long]'), ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][local.getUTCDay()] + ' ' +
      local.getUTCDate() + ' oct ' + local.getUTCFullYear() + ', ' + hhmm);
    placeNow(t);

    if (!next) {
      set($$('[data-countdown]'), '00:00:00');
      wait.innerHTML = 'that was the week.<br>go stand outside.';
      clearInterval(timer);
      return;
    }
    if (shown !== next) {
      shown = next; setBig(next);
      var r = rows[next.e.id]; if (r) r.classList.add('next');
      set($$('.playbook[data-for="' + next.e.id + '"] [data-pb-time]'), next.e.time + ':00');
    }
    var left = next.ms - t, s = Math.max(0, Math.ceil(left / 1000));
    set($$('[data-countdown]'), pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60));
    setWait(left);
  }
  tick();
  // tick on the second, so the countdown never skips
  setTimeout(function () { tick(); timer = setInterval(tick, 1000); }, 1000 - ((Date.now() - loaded) % 1000));
})();
