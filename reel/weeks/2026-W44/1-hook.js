// 2026-W44, the hook (lines 1-8): the bill comes due on the arcade cabinet, the S&P's worst day since June,
// three red weeks, and the crash. Look: arcade (lib/arcade.js), effects from pixelfx (lib/pfx.js).
(function () {
  const A = R.arc;
  const shot = (caps, o, build) => R.shot(Object.assign({ caps, look: "arcade", ground: "clear", caption: false }, o), build);
  const top = (s) => (s.stage.style.justifyContent = "flex-start");

  // 1-2: the cabinet (footage, keyed) with the bill falling due; coins spill out on "due".
  shot([1, 2], {}, (s) => {
    top(s);
    A.sub(s, "Last week of October", { color: A.WHITE });
    const g = A.glitch(s, "THE AI BILL", s.w(2, 1), { size: 118, duration: 0.3 });
    const due = A.row(s, "CAME DUE", { color: A.GOLD, w: 700, max: 150 });
    R.fx.slam(due, s.w(2, 3), 1.6, 0.22);
    R.fx.show(g.row, s.w(2, 1));
    s.pfx("pickups/coin-spin", { x: 540, y: 1250, scale: 7, front: true, palette: "gold" });
    s.pfx("spawn/coin-drop", { at: s.w(2, 4), x: 540, y: 1290, scale: 5, palette: "gold" });
  });

  // 3-4: Wall Street at night, the S&P line falls off the screen, an explosion on "hit".
  shot([3, 4], {}, (s) => {
    A.plate(s, "wallstreet", { from: 1.14, to: 1.04 });
    A.scrim(s, 0.35);
    A.flash(s, s.t0, "#FFFFFF", 0.2, 0.8);
    A.decline(s, s.w(3, 1), { y0: 520, y1: 1200, duration: 0.8 });
    s.pfx("explosions/big-explosion", { at: s.w(3, 1), x: 540, y: 1290, scale: 3, opacity: 0.9 });
    s.pfx("ui/damage-number", { at: s.w(3, 3), x: 330, y: 1070, scale: 5, front: true, opts: { text: "-1.8%" } });
    R.fx.shake(s.punch, s.w(3, 1), 22);
    A.flash(s, s.w(3, 1), "#FF3B3B", 0.3, 0.45);
    A.sub(s, "Friday · S&P 500");
    const worst = A.row(s, "WORST DAY", { color: A.RED, max: 190 });
    R.fx.slam(worst, s.w(4, 0));
    const june = A.row(s, "SINCE JUNE", { color: A.WHITE, w: 640, max: 120 });
    R.fx.rise(june, s.w(4, 2));
  });

  // 5-6: three red weekly candles slam down, one per word.
  shot([5, 6], { ground: "navy" }, (s) => {
    s.pfx("finance/red-candles", { at: s.w(5, 0) - 0.28, x: 540, y: 1360, scale: 5, opts: { gap: 0.4 } });
    top(s);
    const three = A.row(s, "3 RED WEEKS", { color: A.RED, max: 150 });
    R.fx.slam(three, s.w(5, 0));
    const sp = A.sub(s, "Spending outran the cash", { color: A.GOLD });
    R.fx.rise(sp, s.w(6, 0));
  });

  // 7-8: money burning; "bill came due" twice, the second torn apart; the crash.
  shot([7, 8], {}, (s) => {
    A.scrim(s, 0.45);
    A.glitch(s, "BILL CAME", s.w(7, 0), { size: 130, duration: 0.2, reach: 10 });
    const due = A.glitch(s, "DUE", s.w(7, 3), { size: 260, duration: 0.55, reach: 46, color: A.GOLD, seed: 4 });
    R.fx.show(due.row, s.w(7, 2));
    const crash = A.row(s, "TECH CRASH", { color: A.RED, max: 130 });
    R.fx.slam(crash, s.w(8, 3));
    s.pfx("explosions/small-explosion", { at: s.w(8, 3), x: 540, y: 1290, scale: 3 });
    R.fx.shake(s.punch, s.w(8, 3), 26);
    A.flash(s, s.w(8, 3), "#FFFFFF", 0.25, 0.7);
    s.pfx("transitions/glitch-wipe", { at: s.t1 - 0.6, fit: "cover", front: true, opts: { color: "#0b0b0b" } });
  });
})();
