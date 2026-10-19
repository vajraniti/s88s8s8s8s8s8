// the sample "now" is wed 21 oct, 16:23 utc+3. ism services prints at 17:00, 37 minutes away.
// everything that tells the time runs off one counter: the clock, the now-line, the minutes in the
// margin and at the bottom of the page. at zero the number prints into the table.
// (for looking at the ending without waiting: ?t=5 starts five seconds before 17:00.)
(function () {
  var START = 37 * 60;
  var q = /[?&]t=(\d+)/.exec(location.search);
  var left = q ? Math.min(START, parseInt(q[1], 10)) : START;
  var PRINTED = '52.6';           // sample value for the sketch: above the 52.0 forecast

  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var counters = $$('[data-countdown]');
  var clocks = $$('[data-clock]');
  var mins = $$('[data-mins]');
  var words = $$('[data-words]');
  var ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
  function say(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function set(list, text) { for (var i = 0; i < list.length; i++) list[i].textContent = text; }

  function draw() {
    var h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), s = left % 60;
    set(counters, pad(h) + ':' + pad(m) + ':' + pad(s));
    var nowSec = 17 * 3600 - left;                     // seconds since midnight, utc+3
    set(clocks, pad(Math.floor(nowSec / 3600)) + ':' + pad(Math.floor(nowSec % 3600 / 60)));
    var mLeft = Math.ceil(left / 60);
    set(mins, String(mLeft));
    set(words, say(mLeft));
  }

  function print() {
    var cell = document.querySelector('[data-actual]');
    if (cell) cell.innerHTML = '<span class="ink r4">' + PRINTED + '</span>';
    var xau = document.querySelector('[data-next] td.xau');
    if (xau) xau.innerHTML = '<span class="tba">wait</span>';
    var note = document.querySelector('.note');
    if (note) {
      note.classList.add('printed');
      var hit = note.querySelector('[data-case="above"]');
      if (hit) hit.classList.add('applies');
    }
    var pb = document.querySelector('[data-pb-count]');
    if (pb) pb.textContent = 'printed at 17:00.';
    var aside = document.querySelector('[data-next-aside]');
    if (aside) aside.textContent = 'it printed above. the book says gold goes down now. watch it, don’t touch it.';
    // the now-line moves under the release that just happened
    var now = document.querySelector('[data-now]'), pbRow = document.querySelector('tr.playbook');
    if (now && pbRow) {
      pbRow.parentNode.insertBefore(now, pbRow.nextSibling);
      var t = now.querySelector('[data-now-text]');
      if (t) t.textContent = 'now. it printed. the rest of the week is still under the snow.';
    }
    var line = document.querySelector('[data-count-line]');
    if (line) line.textContent = '17:00, ism services printed ' + PRINTED + '.';
    var tl = document.querySelector('.count .t');
    if (tl) tl.textContent = 'printed.';
    var wait = document.querySelector('[data-wait]');
    if (wait) wait.innerHTML = 'it printed while you were reading.<br>go stand outside anyway.<br>gold will do what it does without you.';
  }

  draw();
  if (left === 0) { print(); return; }
  var timer = setInterval(function () {
    left -= 1;
    draw();
    if (left <= 0) { clearInterval(timer); print(); }
  }, 1000);
})();
