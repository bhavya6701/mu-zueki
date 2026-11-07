// 2026-W44, the hook again (lines 24-31): the same beats in other worlds, faster, bigger, and the screen
// switches off into the Fed.
(function () {
  const A = R.arc;
  const shot = (caps, o, build) => R.shot(Object.assign({ caps, look: "arcade", ground: "clear", caption: false }, o), build);
  const top = (s) => (s.stage.style.justifyContent = "flex-start");

  // 24-25: the cabinet again, coins pouring out.
  shot([24, 25], {}, (s) => {
    top(s);
    A.flash(s, s.t0, "#FFFFFF", 0.2, 0.7);
    A.sub(s, "Last week of October");
    const g = A.glitch(s, "THE AI BILL", s.w(25, 1), { size: 118, duration: 0.3, seed: 12 });
    R.fx.show(g.row, s.w(25, 1));
    const due = A.row(s, "CAME DUE", { color: A.GOLD, w: 700, max: 150 });
    R.fx.slam(due, s.w(25, 3), 1.6, 0.22);
    s.pfx("spawn/coin-drop", { at: s.w(25, 4), x: 540, y: 1290, scale: 5, palette: "gold", seed: 5 });
    s.pfx("ui/coin-collect", { at: s.w(24, 0), x: 400, y: 1040, scale: 4, front: true, palette: "gold" });
  });

  // 26-27: the storm skyline this time; the line falls, the sky lights up on "hit".
  shot([26, 27], {}, (s) => {
    A.plate(s, "storm", { from: 1.16, to: 1.04 });
    A.scrim(s, 0.3);
    A.decline(s, s.w(26, 1), { y0: 480, y1: 1220, duration: 0.7, seed: 33 });
    s.pfx("lightning/lightning-strike", { at: s.w(26, 1), x: 540, y: 1250, scale: 4 });
    R.fx.shake(s.punch, s.w(26, 1), 24);
    A.flash(s, s.w(26, 1), "#FFFFFF", 0.25, 0.75);
    A.sub(s, "Friday · S&P 500");
    const worst = A.row(s, "WORST DAY", { color: A.RED, max: 190 });
    R.fx.slam(worst, s.w(27, 0));
    const june = A.row(s, "SINCE JUNE", { color: A.WHITE, w: 640, max: 120 });
    R.fx.rise(june, s.w(27, 2));
  });

  // 28-29: the candles again, in the data centre's glow.
  shot([28, 29], {}, (s) => {
    A.plate(s, "datacenter", { from: 1.1, to: 1.0, filter: "brightness(0.55)" });
    s.pfx("finance/red-candles", { at: s.w(28, 0) - 0.28, x: 540, y: 1360, scale: 5, seed: 9, opts: { gap: 0.4 } });
    top(s);
    const three = A.row(s, "3 RED WEEKS", { color: A.RED, max: 150 });
    R.fx.slam(three, s.w(28, 0));
    const sp = A.sub(s, "Spending outran the cash", { color: A.GOLD });
    R.fx.rise(sp, s.w(29, 0));
  });

  // 30-31: the money burns again, the crash, and the screen switches off.
  shot([30, 31], {}, (s) => {
    A.scrim(s, 0.45);
    A.glitch(s, "BILL CAME", s.w(30, 0), { size: 130, duration: 0.2, reach: 10, seed: 3 });
    const due = A.glitch(s, "DUE", s.w(30, 3), { size: 260, duration: 0.55, reach: 46, color: A.GOLD, seed: 8 });
    R.fx.show(due.row, s.w(30, 2));
    const crash = A.row(s, "TECH CRASH", { color: A.RED, max: 130 });
    R.fx.slam(crash, s.w(31, 3));
    s.pfx("explosions/small-explosion", { at: s.w(31, 3), x: 540, y: 1290, scale: 3, seed: 6 });
    R.fx.shake(s.punch, s.w(31, 3), 26);
    A.crtOff(s, s.t1 - 0.3);
  });
})();
