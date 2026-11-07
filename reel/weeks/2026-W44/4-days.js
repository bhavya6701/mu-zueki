// 2026-W44, the days (lines 32-46): Wednesday's Fed hold, Thursday's Alphabet storm and Amazon's spending,
// Intel's guidance, and Friday's worst day since 1974.
(function () {
  const A = R.arc;
  const shot = (caps, o, build) => R.shot(Object.assign({ caps, look: "arcade", ground: "clear", caption: false }, o), build);
  const fmtB = (v) => "$" + Math.round(v) + "B";

  // 32-33: the Fed (footage), the decision as a notification card.
  shot([32, 33], {}, (s) => {
    A.scrim(s, 0.45);
    A.flash(s, s.t0, "#FFFFFF", 0.3, 1);
    const wed = A.sub(s, "Wednesday · The Fed");
    R.fx.rise(wed, s.t0 + 0.05);
    A.toast(s, s.w(32, 3), "Rate decision", "HOLD", { note: "3.75% - 4.00%" });
    s.pfx("arcane/rune-circle", { x: 540, y: 1200, scale: 6, palette: "ice", opacity: 0.8 });
  });

  // 34-35: the Fed plate; ten to two, and the two who wanted a hike.
  shot([34, 35], {}, (s) => {
    A.plate(s, "fed", { from: 1.12, to: 1.02 });
    A.scrim(s, 0.35);
    const vote = A.row(s, "10-2", { color: A.WHITE, max: 300 });
    R.fx.slam(vote, s.w(34, 0));
    const dis = A.sub(s, "Two dissents");
    R.fx.rise(dis, s.w(34, 3));
    const hike = A.row(s, "WANTED A HIKE", { color: A.GOLD, w: 760, max: 110 });
    R.fx.slam(hike, s.w(35, 2));
    s.pfx("ui/combo-counter", { at: s.w(35, 2), x: 500, y: 1050, scale: 3, palette: "volt", opts: { count: 2, label: "HIKE" } });
  });

  // 36-37: Thursday, the storm breaks over Alphabet.
  shot([36, 37], {}, (s) => {
    A.plate(s, "storm", { from: 1.08, to: 1.0, y: -20 });
    s.pfx("weather/storm", { fit: "cover", opacity: 0.55, seed: 3 });
    A.scrim(s, 0.25);
    const thu = A.sub(s, "Thursday");
    R.fx.rise(thu, s.t0 + 0.05);
    const al = A.row(s, "ALPHABET", { color: A.WHITE, max: 160 });
    R.fx.slam(al, s.w(36, 1));
    const pct = A.row(s, "-12.6%", { color: A.RED, max: 230 });
    R.fx.slam(pct, s.w(36, 3));
    s.pfx("lightning/lightning-strike", { at: s.w(36, 2), x: 560, y: 1290, scale: 4 });
    A.flash(s, s.w(36, 2), "#FFFFFF", 0.25, 0.85);
    R.fx.shake(s.punch, s.w(36, 2), 26);
    const ever = A.sub(s, "Worst day ever", { color: A.RED });
    R.fx.rise(ever, s.w(37, 0));
  });

  // 38-39: half a trillion gone; cash flow negative; the storm keeps flashing.
  shot([38, 39], {}, (s) => {
    A.plate(s, "storm", { from: 1.2, to: 1.1, x: 50, filter: "brightness(0.85)" });
    s.pfx("weather/storm", { fit: "cover", opacity: 0.55, seed: 8 });
    A.scrim(s, 0.3);
    const half = A.sub(s, "Half a trillion");
    R.fx.rise(half, s.t0 + 0.05);
    const gone = A.glitch(s, "$500B GONE", s.w(38, 3), { size: 130, duration: 0.45, reach: 30, color: A.RED, seed: 17 });
    R.fx.show(gone.row, s.w(38, 2));
    const fcf = A.sub(s, "Cash flow negative", { color: A.GOLD });
    R.fx.rise(fcf, s.w(39, 0));
    s.pfx("lightning/zap-hit", { at: s.w(39, 3), x: 540, y: 1180, scale: 6, front: true });
  });

  // 40: Amazon, the data centre plate; coins pour into the racks as the spending rolls up.
  shot([40], {}, (s) => {
    A.plate(s, "datacenter", { from: 1.06, to: 1.18 });
    A.scrim(s, 0.3);
    const am = A.row(s, "AMAZON", { color: A.WHITE, max: 170 });
    R.fx.slam(am, s.w(40, 0));
    const big = A.row(s, "$220B", { color: A.GOLD, max: 260 });
    R.fx.count(big, s.w(40, 2), 0, 220, 0.6, fmtB);
    const yr = A.sub(s, "Capital spending this year");
    R.fx.rise(yr, s.w(40, 4));
    s.pfx("spawn/coin-drop", { at: s.w(40, 2), x: 540, y: 1300, scale: 5, palette: "gold", seed: 3 });
  });

  // 41-42: the racks again (footage); a black hole swallows the cash.
  shot([41, 42], {}, (s) => {
    A.scrim(s, 0.45);
    s.pfx("shadow/black-hole", { x: 500, y: 1380, scale: 3 });
    const ttm = A.sub(s, "Cash flow");
    R.fx.rise(ttm, s.t0 + 0.05);
    const out = A.row(s, "-$42.4B", { color: A.RED, max: 250 });
    R.fx.slam(out, s.w(42, 0));
  });

  // 43-44: Intel (the chip, drained grey); the guidance range, counting down.
  shot([43, 44], {}, (s) => {
    A.scrim(s, 0.4);
    const it = A.row(s, "INTEL", { color: A.WHITE, max: 190 });
    R.fx.slam(it, s.w(43, 0));
    const g = A.sub(s, "Q4 guide");
    R.fx.rise(g, s.w(43, 1));
    const range = A.row(s, "$15-16B", { color: A.GOLD, max: 220 });
    R.fx.slam(range, s.w(44, 0));
    s.pfx("ui/countdown", { at: s.w(44, 0), x: 500, y: 1180, scale: 3, palette: "blood" });
  });

  // 45-46: the beat drops out, then Friday: a white-out and a mushroom cloud, the worst since 1974.
  shot([45, 46], { ground: "navy" }, (s) => {
    A.flash(s, s.t0, "#FFFFFF", 0.45, 1);
    s.pfx("explosions/nuke", { at: s.w(45, 1), x: 540, y: 1360, scale: 3 });
    R.fx.shake(s.punch, s.w(45, 1), 30);
    const fri = A.sub(s, "Friday · Intel");
    R.fx.rise(fri, s.t0 + 0.05);
    const pct = A.row(s, "-28.5%", { color: A.RED, max: 250 });
    R.fx.slam(pct, s.w(45, 3));
    const yr = A.row(s, "WORST SINCE 1974", { color: A.WHITE, w: 760, max: 96 });
    R.fx.slam(yr, s.w(46, 0));
  });
})();
