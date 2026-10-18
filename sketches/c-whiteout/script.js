// the sample "now" is wed 21 oct, 16:23 utc+3. ism services prints at 17:00: 37 minutes away.
// the counters start there and run down in real seconds. nothing else moves.
(function () {
  var left = 37 * 60;
  var els = document.querySelectorAll('[data-countdown]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function draw() {
    var h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), s = left % 60;
    var t = pad(h) + ':' + pad(m) + ':' + pad(s);
    for (var i = 0; i < els.length; i++) els[i].textContent = t;
  }
  draw();
  setInterval(function () {
    if (left > 0) { left -= 1; draw(); }
  }, 1000);
})();
