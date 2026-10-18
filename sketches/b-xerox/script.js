// the sample week says it is wed 21 oct 2026, 16:23 utc+3. the clock starts there.
(function () {
  var NOW = Date.parse('2026-10-21T16:23:00+03:00');
  var PRINT = Date.parse('2026-10-21T17:00:00+03:00');
  var started = Date.now();
  var slots = document.querySelectorAll('[data-countdown]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var left = Math.round((PRINT - (NOW + (Date.now() - started))) / 1000);
    var text;
    if (left > 0) {
      text = 't-' + pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left / 60) % 60) + ':' + pad(left % 60);
    } else {
      text = 'printing.';
    }
    for (var i = 0; i < slots.length; i++) slots[i].textContent = text;
  }
  tick();
  setInterval(tick, 1000);
})();
