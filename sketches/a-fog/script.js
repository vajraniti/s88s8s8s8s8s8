// the sample "now" is wed 21 oct, 16:23:19 utc+3; ism services prints at 17:00:00.
// the countdown runs from there. when it reaches zero the line stops counting and says so,
// because the sheet still has no number for it.
(function () {
  var left = 36 * 60 + 41; // seconds until 17:00:00
  var nums = document.querySelectorAll('[data-countdown]');
  var lines = document.querySelectorAll('[data-count-line]');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function draw() {
    if (left <= 0) {
      for (var j = 0; j < lines.length; j++) lines[j].textContent = '17:00:00 came and went. no number yet.';
      clearInterval(timer);
      return;
    }
    var t = pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left / 60) % 60) + ':' + pad(left % 60);
    for (var i = 0; i < nums.length; i++) nums[i].textContent = t;
  }
  var timer = setInterval(function () { left -= 1; draw(); }, 1000);
  draw();
})();
