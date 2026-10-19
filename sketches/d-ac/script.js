// hiranya. everything that tells the time runs off the week's data (the json block in index.html
// is ../data.json, verbatim) and one clock that starts at the sample "now", wed 21 oct, 16:23 utc+3.
//
// the big time always shows the next release that has not printed yet. when its countdown runs
// out, the release is marked "came and went", and the big time moves on to the one after it.
// the voice up top and in the night counts from the same data.
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
  // "16:30" -> "16:30"; anything that is not a time of day -> null
  function hhmm(s) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(s || '');
    if (!m || +m[1] > 23 || +m[2] > 59) return null;
    return pad(+m[1]) + ':' + m[2];
  }

  var now0 = Date.parse(DATA.now);
  var local0 = new Date(now0 + TZ);
  var Y = local0.getUTCFullYear(), M = local0.getUTCMonth(), D0 = local0.getUTCDate();
  function at(day, hm) {                      // "wed 21", "17:00" -> ms
    var d = parseInt(day.split(' ')[1], 10), p = hm.split(':');
    return Date.UTC(Y, M, d, +p[0], +p[1]) - TZ;
  }
  var events = DATA.events.map(function (e) { return { e: e, ms: at(e.day, e.time) }; });

  var nextQ = hhmm(q.get('next'));
  if (nextQ) events.forEach(function (x) {
    if (x.e.status === 'next') { x.e.time = nextQ; x.ms = at(x.e.day, nextQ); }
  });
  var waiting = events.filter(function (x) { return x.e.status !== 'released'; })
                      .sort(function (a, b) { return a.ms - b.ms; });

  var start = now0;
  var nowQ = hhmm(q.get('now'));
  if (nowQ) start = Date.UTC(Y, M, D0, +nowQ.slice(0, 2), +nowQ.slice(3)) - TZ;
  var tQ = q.get('t');
  if (tQ !== null && /^\d{1,6}$/.test(tQ)) {
    var first = waiting.filter(function (x) { return x.ms > start; })[0];
    if (first) start = first.ms - (+tQ) * 1000;
  }
  var loaded = Date.now();
  function clock() { return start + (Date.now() - loaded); }

  // ---- words
  var ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function say(n) { return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : ''); }
  function times(n) { return n === 1 ? 'once' : n === 2 ? 'twice' : say(n) + ' times'; }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  var DAYS = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday' };
  var WD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  // ---- the table follows the data: every row shows its release time from the data,
  // and the rows of a day are kept in time order (a moved release moves its row)
  var rows = {};
  $$('tr[data-id]').forEach(function (tr) { rows[tr.getAttribute('data-id')] = tr; });
  var byId = {};
  events.forEach(function (x) {
    byId[x.e.id] = x;
    var tr = rows[x.e.id], td = tr && tr.querySelector('td.t');
    if (td) td.textContent = x.e.time;
  });
  $$('tbody.day').forEach(function (tb) {
    var evs = Array.prototype.slice.call(tb.querySelectorAll('tr[data-id]'));
    var order = evs.slice().sort(function (a, b) {
      var A = byId[a.getAttribute('data-id')], B = byId[b.getAttribute('data-id')];
      return (A ? A.ms : 0) - (B ? B.ms : 0) || evs.indexOf(a) - evs.indexOf(b);
    });
    if (order.every(function (tr, i) { return tr === evs[i]; })) return;
    order.forEach(function (tr) {
      var pb = tb.querySelector('tr.playbook[data-for="' + tr.getAttribute('data-id') + '"]');
      tb.appendChild(tr); if (pb) tb.appendChild(pb);
    });
  });
  // the playbook quotes its release's numbers and time from the data
  $$('tr.playbook[data-for]').forEach(function (pb) {
    var x = byId[pb.getAttribute('data-for')]; if (!x) return;
    set(pb.querySelectorAll('[data-pb-time]'), x.e.time + ':00');
    if (x.e.forecast) set(pb.querySelectorAll('[data-pb-forecast]'), x.e.forecast);
    if (x.e.previous) set(pb.querySelectorAll('[data-pb-previous]'), x.e.previous);
  });

  // ---- toner type: the same glyph cells set the big time and the day numbers
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
  $$('.dayrow .dnum').forEach(function (el, i) {
    var n = el.textContent.trim();
    if (!/^\d{1,2}$/.test(n)) return;
    var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = n;
    var g = document.createElement('span'); g.className = 'dnum toner'; g.setAttribute('aria-hidden', 'true');
    toner(g, n, 1 + i);
    el.parentNode.replaceChild(g, el);
    g.parentNode.insertBefore(sr, g);
  });

  // ---- the big time
  var big = document.querySelector('[data-bigtime]');
  var cap = document.querySelector('[data-bigtime-cap]');
  function setBig(ev) {
    var s = ev.e.time;
    toner(big, s, 0);
    var day = ev.e.day.split(' ');
    var today = parseInt(day[1], 10) === new Date(clock() + TZ).getUTCDate();
    big.setAttribute('aria-label', 'next release at ' + s + ' utc+3' + (today ? '' : ', ' + DAYS[day[0]]));
    cap.innerHTML = s + ':00 utc+3' + (today ? '' : ', ' + day[0] + ' ' + day[1]) + '<br>' + ev.e.id;
    set($$('[data-next-name]'), ev.e.title.toLowerCase());
  }

  // ---- the voice: counted from the data, not written in
  var printed = DATA.events.filter(function (e) { return e.status === 'released' && e.actual != null; });
  var lied = printed.filter(function (e) { return /lied/.test(e.verdict || ''); }).length;
  var right = printed.filter(function (e) { return /right/.test(e.verdict || ''); }).length;
  set($$('[data-voice-printed]'), (printed.length === 1 ? 'one has printed. ' : say(printed.length) + ' have printed. ') +
    (lied ? (printed.length === 1 ? 'it lied.' : say(lied) + ' of them lied.') : 'none of them lied.'));
  set($$('[data-book-right]'), right ? 'the book was right ' + times(right) + ' this week.' : 'the book has not been right once this week.');
  set($$('[data-book-lied]'), lied ? times(lied) + ' it lied.' : 'it has not lied yet.');
  var last = events.slice().sort(function (a, b) { return a.ms - b.ms; })[events.length - 1];
  if (last) {
    set($$('[data-last-day]'), DAYS[last.e.day.split(' ')[0]]);
    set($$('[data-last-time]'), last.e.time);
  }

  var wait = document.querySelector('[data-wait]');
  function setWait(left) {
    var m = Math.ceil(left / 60000);
    if (m <= 1) { wait.innerHTML = 'it is about to print.<br>go stand outside.<br>the number will print without you.'; return; }
    if (m < 60) { wait.innerHTML = 'you have <span>' + say(m) + '</span> minutes.<br>go stand outside.<br>the number will print without you.'; return; }
    var h = Math.floor(m / 60);
    wait.innerHTML = 'you have <span>' + (h === 1 ? 'an hour' : say(Math.min(h, 99)) + ' hours') + '.</span><br>go to sleep.<br>the number will print without you.';
  }

  // ---- "you are here" goes into today, right above today's first release that has not happened
  // yet, or at the end of today when today is done. (on a day with no releases: above the next one.)
  var nowRow = document.querySelector('[data-now]');
  function dayOf(tb) {
    var r = tb.querySelector('tr[data-id]'), x = r && byId[r.getAttribute('data-id')];
    return x ? parseInt(x.e.day.split(' ')[1], 10) : null;
  }
  function placeNow(t) {
    if (!nowRow) return;
    var today = new Date(t + TZ).getUTCDate();
    var tb = $$('tbody.day').filter(function (b) { return dayOf(b) === today; })[0];
    var all = tb ? Array.prototype.slice.call(tb.querySelectorAll('tr[data-id]')) : $$('tr[data-id]'), ahead = null;
    for (var i = 0; i < all.length && !ahead; i++) {
      var x = byId[all[i].getAttribute('data-id')];
      if (x && x.ms > t) ahead = all[i];
    }
    if (ahead) {
      if (ahead.previousElementSibling !== nowRow) ahead.parentNode.insertBefore(nowRow, ahead);
    } else if (tb) {
      if (tb.lastElementChild !== nowRow) tb.appendChild(nowRow);
    } else if (all.length) {
      var lastTb = all[all.length - 1].parentNode;
      if (lastTb.lastElementChild !== nowRow) lastTb.appendChild(nowRow);
    }
  }

  var gone = document.querySelector('[data-gone]');
  var early = document.querySelector('[data-voice-early]');
  var weekdayLine = document.querySelector('[data-weekday-line]');
  var shown = null, timer = null, nPassed = -1;
  function tick() {
    var t = clock();
    var next = null, passed = [];
    waiting.forEach(function (x) { if (x.ms <= t) passed.push(x); else if (!next) next = x; });

    if (passed.length !== nPassed) {
      nPassed = passed.length;
      passed.forEach(function (x) {         // printed, but the sample has no number for it
        var tr = rows[x.e.id];
        if (!tr || tr.classList.contains('passed')) return;
        tr.classList.add('passed'); tr.classList.remove('next');
        var a = tr.querySelector('td.a'); if (a) a.textContent = '–';
        var pb = tr.nextElementSibling; if (pb && pb.classList.contains('playbook')) pb.classList.add('spent');
        var aside = tr.querySelector('[data-next-aside]'); if (aside) aside.textContent = 'it came and went. nobody has the number.';
      });
      if (passed.length) {
        // the latest releases that went by, all of them if several went at once
        var lastMs = passed[passed.length - 1].ms;
        var group = passed.filter(function (x) { return x.ms === lastMs; });
        gone.hidden = false;
        gone.textContent = list(group.map(function (x) { return x.e.title.toLowerCase(); })) + ': ' +
          group[0].e.time + ' came and went. ' + (group.length > 1 ? 'no numbers yet.' : 'no number yet.');
        early.textContent = passed.length === 1 ? 'you missed one.' : 'you missed ' + say(passed.length) + '.';
      } else {
        gone.hidden = true;
        early.textContent = 'you’re early.';
      }
    }

    var local = new Date(t + TZ);
    var hm = pad(local.getUTCHours()) + ':' + pad(local.getUTCMinutes());
    var wd = WD[local.getUTCDay()];
    set($$('[data-clock]'), hm);
    set($$('[data-clock-long]'), wd + ' ' + local.getUTCDate() + ' oct ' + local.getUTCFullYear() + ', ' + hm);
    weekdayLine.textContent = wd === 'fri' ? 'it’s friday.' : (wd === 'sat' || wd === 'sun') ? 'it’s the weekend.' : 'it’s only ' + DAYS[wd] + '.';
    placeNow(t);

    if (!next) {
      set($$('[data-countdown]'), '00:00:00');
      early.textContent = 'you’re late.';
      wait.innerHTML = 'that was the week.<br>go stand outside.';
      clearInterval(timer);
      return;
    }
    if (shown !== next) {
      shown = next; setBig(next);
      var r = rows[next.e.id]; if (r) r.classList.add('next');
    }
    var left = next.ms - t, s = Math.max(0, Math.ceil(left / 1000));
    set($$('[data-countdown]'), pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60));
    setWait(left);
  }
  tick();
  // tick on the second, so the countdown never skips
  setTimeout(function () { tick(); timer = setInterval(tick, 1000); }, 1000 - ((Date.now() - loaded) % 1000));
})();
