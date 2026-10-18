// sample "now" is wed 21 oct, 16:23:19 utc+3; ism services prints at 17:00:00.
// the countdown runs from there, so the sketch always reads the same way.
(function () {
  var left = 36 * 60 + 41; // seconds until 17:00:00
  var els = document.querySelectorAll('[data-countdown]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function draw() {
    var s = Math.max(0, left);
    var t = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
    for (var i = 0; i < els.length; i++) els[i].textContent = t;
  }
  draw();
  setInterval(function () { left -= 1; draw(); }, 1000);
})();
