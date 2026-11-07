// 2026-W44, the tape (lines 9-23): the S&P close, the Nasdaq bleeding, Nvidia's drag, three red indexes,
// AI burning through the bag, and the one green shot: small caps walking free at dawn.
(function () {
  const A = R.arc;
  const shot = (caps, o, build) => R.shot(Object.assign({ caps, look: "arcade", ground: "clear", caption: false }, o), build);
  const fmt = (v) => Math.round(v).toLocaleString("en-US");

  // 9-11: the trading desk; the S&P rolls down to its close, the week's loss, the health bar takes the hit.
  shot([9, 10, 11], {}, (s) => {
    A.scrim(s, 0.6);
    A.flash(s, s.t0, "#FFFFFF", 0.2, 0.7);
    A.sub(s, "S&P 500 close");
    const close = A.row(s, "7,624", { color: A.WHITE, max: 230 });
    R.fx.count(close, s.w(9, 0), 7623.68, 7580.07, 0.9, fmt);
    const wk = A.row(s, "-0.6% WEEK", { color: A.RED, w: 760, max: 130 });
    R.fx.slam(wk, s.w(10, 0));
    s.pfx("ui/health-bar-hit", { at: s.w(11, 0), x: 500, y: 1000, scale: 5, front: true, opts: { from: 0.8, to: 0.45 } });
  });

  // 12-13: Wall Street again, redder; the Nasdaq bleeds.
  shot([12, 13], {}, (s) => {
    A.plate(s, "wallstreet", { from: 1.3, to: 1.18, x: -60, filter: "saturate(1.4) brightness(0.8) hue-rotate(-8deg)" });
    A.scrim(s, 0.3);
    A.flash(s, s.t0, "#FF3B3B", 0.25, 0.5);
    const nq = A.row(s, "NASDAQ", { color: A.WHITE, max: 170 });
    R.fx.slam(nq, s.w(12, 0));
    const pct = A.row(s, "-2.9%", { color: A.RED, max: 260 });
    R.fx.slam(pct, s.w(12, 2));
    s.pfx("ui/damage-number", { at: s.w(12, 2), x: 330, y: 1070, scale: 5, front: true, opts: { text: "-2.9%" } });
    const red = A.sub(s, "A Friday in red", { color: A.RED });
    R.fx.rise(red, s.w(13, 0));
    A.flash(s, s.w(13, 3), "#FF3B3B", 0.3, 0.35);
  });

  // 14-15: the chip, graded red; a zap on "down", a critical hit for the heaviest drag.
  shot([14, 15], {}, (s) => {
    A.scrim(s, 0.4);
    const nv = A.row(s, "NVIDIA", { color: A.WHITE, max: 190 });
    R.fx.slam(nv, s.w(14, 0));
    s.pfx("lightning/zap-hit", { at: s.w(14, 1), x: 540, y: 980, scale: 7, front: true });
    s.pfx("ui/crit-number", { at: s.w(14, 2), x: 500, y: 930, scale: 5, front: true, opts: { text: "-4.9%", label: "DRAG" } });
    R.fx.shake(s.punch, s.w(14, 1), 16);
  });

  // 16-17: all three indexes in red, a red burst for every chart.
  shot([16, 17], { ground: "navy" }, (s) => {
    A.decline(s, s.t0, { y0: 380, y1: 1080, duration: 1.4, seed: 51 });
    const names = ["S&P 500", "NASDAQ", "DOW"];
    names.forEach((name, i) => {
      const r = A.row(s, name + " ▼", { color: A.RED, w: 720, max: 130 });
      R.fx.side(r, s.w(16, i), i % 2 ? -1 : 1);
    });
    [[270, 640, 17, 1], [810, 820, 17, 3], [540, 1150, 17, 4]].forEach(([x, y, n, i], k) =>
      s.pfx("explosions/firework-burst", { at: s.w(n, i), x, y, scale: 3, palette: "blood", seed: k + 1 }));
  });

  // 18-19: the data centre; pillars of fire up the racks as AI burns through the bag.
  shot([18, 19], {}, (s) => {
    A.scrim(s, 0.4);
    const fear = A.sub(s, "Wall Street fears the spending");
    R.fx.rise(fear, s.w(18, 0));
    const burn = A.row(s, "AI BURNING", { color: A.GOLD, max: 150 });
    R.fx.slam(burn, s.w(19, 0));
    const bag = A.row(s, "THROUGH THE BAG", { color: A.WHITE, w: 760, max: 100 });
    R.fx.rise(bag, s.w(19, 2));
    s.pfx("fire/flame-pillar", { at: s.w(18, 2), x: 150, y: 1340, scale: 4 });
    s.pfx("fire/flame-pillar", { at: s.w(19, 1), x: 930, y: 1340, scale: 4, seed: 7 });
  });

  // 20-21: dawn on a small-town street, the one green shot; small caps level up.
  shot([20, 21], {}, (s) => {
    A.plate(s, "dawn", { from: 1.12, to: 1.02, y: -30 });
    A.scrim(s, 0.25);
    A.flash(s, s.t0, "#FFE9A8", 0.35, 0.8);
    s.pfx("holy/sunburst", { x: 860, y: 380, scale: 5, palette: "gold", opacity: 0.8 });
    const small = A.sub(s, "Only small caps smiling", { color: A.GREEN });
    R.fx.rise(small, s.w(20, 0));
    const rus = A.row(s, "RUSSELL 2000", { color: A.WHITE, w: 760, max: 120 });
    R.fx.slam(rus, s.w(21, 0));
    const up = A.row(s, "+1.3%", { color: A.GREEN, max: 260 });
    R.fx.pop(up, s.w(21, 2));
    s.pfx("ui/level-up", { at: s.w(21, 0), x: 500, y: 1360, scale: 3, palette: "heal", opts: { text: "+1.3%" } });
  });

  // 22-23: big tech paid the bill, the little guys walk off free with the coin.
  shot([22, 23], {}, (s) => {
    A.plate(s, "dawn", { from: 1.02, to: 1.1, y: 20, x: 40 });
    A.scrim(s, 0.25);
    s.pfx("weather/fireflies", { fit: "cover", palette: "gold", opacity: 0.7 });
    A.sub(s, "Russell 2000 +1.3%", { color: A.GREEN });
    const paid = A.row(s, "BIG TECH PAID", { color: A.RED, max: 130 });
    R.fx.slam(paid, s.w(22, 2));
    const free = A.sub(s, "The little guys walked free", { color: A.GREEN });
    R.fx.rise(free, s.w(23, 0));
    s.pfx("pickups/coin-spin", { at: s.w(23, 0), x: 540, y: 1180, scale: 7, front: true, palette: "gold" });
  });
})();
