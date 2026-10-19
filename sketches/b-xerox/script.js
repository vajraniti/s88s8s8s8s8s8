// one heartbeat: the 17:00 row counts down. the sample week says it is wed 21 oct 2026, 16:23 utc+3,
// so the clock starts there when the page opens (the legend under the table says so).
(function () {
  var NOW = Date.parse('2026-10-21T16:23:00+03:00');
  var PRINT = Date.parse('2026-10-21T17:00:00+03:00');
  var started = Date.now();
  var slot = document.querySelector('[data-countdown]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    if (!slot) return;
    var left = Math.round((PRINT - (NOW + (Date.now() - started))) / 1000);
    slot.textContent = left > 0
      ? 't-' + pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left / 60) % 60) + ':' + pad(left % 60)
      : 'printing.';
  }
  tick();
  setInterval(tick, 1000);

  // the copy you are looking at gets worse the further down you go: copy 3 at the top, copy 11 at the end
  var gen = document.querySelector('[data-gen]');
  var last = -1;
  function onScroll() {
    if (!gen) return;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var f = Math.min(1, Math.max(0, window.scrollY / max));
    var n = 3 + Math.round(f * 8);
    if (n !== last) { gen.textContent = 'copy ' + pad(n); last = n; }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
