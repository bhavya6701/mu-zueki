// 2026-W44, the double-time run and the sign-off (lines 47-53): one cut and one hit per phrase, then back
// to the cabinet, which switches off for the loop.
(function () {
  const A = R.arc;
  const shot = (caps, o, build) => R.shot(Object.assign({ caps, look: "arcade", ground: "clear", caption: false }, o), build);

  // 47-51: flash cuts, a word pair and an effect on each.
  const cuts = [
    [47, ["SPEND IT", "BURN IT"], [0, 2], "explosions/small-explosion", 2, { scale: 3 }],
    [48, ["BUILD IT", "PROVE IT"], [0, 2], "scifi/emp-blast", 2, { scale: 6, palette: "gold" }],
    [49, ["SHOW THE STREET", "IT'S REAL"], [0, 3], "impacts/blunt-hit", 4, { scale: 7 }],
    [50, ["EVERY CHIP", "EVERY SERVER"], [0, 3], "lightning/zap-hit", 1, { scale: 7 }],
    [51, ["EVERY DOLLAR", "EVERY DEAL"], [0, 2], "spawn/coin-drop", 1, { scale: 5, palette: "gold" }],
  ];
  cuts.forEach(([n, words, at, fx, hit, o], k) =>
    shot([n], { punch: true }, (s) => {
      A.scrim(s, 0.62);
      A.flash(s, s.t0, k % 2 ? "#FF3B3B" : "#FFFFFF", 0.12, 0.6);
      words.forEach((w, i) => {
        const r = A.row(s, w, { color: i ? A.GOLD : A.WHITE, w: 680, max: 150 });
        R.fx.slam(r, s.w(n, at[i]), 1.5, 0.16);
      });
      s.pfx(fx, Object.assign({ at: s.w(n, hit), x: 540, y: 1250, seed: k + 2 }, o));
      R.fx.shake(s.punch, s.w(n, hit), 14);
    }));

  // 52-53: back at the cabinet; the bill came due, the name, and the screen switches off.
  shot([52, 53], {}, (s) => {
    s.stage.style.justifyContent = "flex-start";
    A.flash(s, s.t0, "#FFFFFF", 0.3, 0.8);
    const g = A.glitch(s, "BILL CAME DUE.", s.w(52, 0), { size: 104, duration: 0.6, reach: 24, seed: 21 });
    R.fx.show(g.row, s.w(52, 0));
    const tape = A.sub(s, "That's the tape");
    R.fx.rise(tape, s.w(53, 0));
    const name = A.row(s, "MU-ZUEKI", { color: A.GOLD, w: 760, max: 150 });
    R.fx.slam(name, s.w(53, 3));
    s.pfx("pickups/coin-spin", { x: 540, y: 1250, scale: 7, front: true, palette: "gold", until: R.duration - 0.5 });
    A.crtOff(s, R.duration - 0.55);
  });
})();
