// 2026-10-12, second verse (lines 10 to 14): oil at $106, Micron down, memory chips.
(function () {
  const { film: F } = R;
  const { RED } = F;

  // "Brent crude, $106 a barrel" Barrels; the signboard shows the settle.
  F.shot([10], (s) => {
    const board = F.board([{ label: "BRENT CRUDE · A BARREL", value: "$106.65", note: "▲ 1.8%" }]);
    s.put(board.el, 540, 600);
    F.lightUp(board.el, s.w(10, 2));
    F.line(s, 10, { hi: [2] });
  }, { rain: 0 });

  // "Staring down that barrel, in the rain" The hand on the nozzle.
  F.shot([11], (s) => {
    F.line(s, 11, { hi: [6], it: [3] });
  }, { rain: 34 });

  // "Micron fell —" Rings in a puddle.
  F.shot([12], (s) => {
    const board = F.board([{ label: "MICRON", value: "$989.04", color: RED, note: "▼ 3.88%", noteColor: RED }]);
    s.put(board.el, 540, 600);
    F.lightUp(board.el, s.w(12, 1));
    F.line(s, 12);
  }, { rain: 36 });

  // "Nearly 4%, just gone" The figure is there, and then it is not.
  F.shot([13], (s) => {
    const t = s.times(13);
    const figure = F.box(`font-family:"JetBrains Mono";font-weight:800;font-size:190px;line-height:1;white-space:nowrap;color:${RED};text-shadow:0 0 34px rgba(255,90,77,0.6), 0 4px 30px rgba(0,0,0,0.8)`, null, "−3.88%");
    s.put(figure, 540, 640);
    F.rise(figure, t[1], 0.4);
    R.tl.to(figure, { autoAlpha: 0, scale: 1.12, filter: "blur(18px)", duration: 0.7, ease: "power1.in" }, t[3]);
    const line = F.line(s, 13, { hi: [1] });
    R.tl.to(line[3], { opacity: 0.35, duration: 0.5 }, t[3] + 0.3);
  }, { rain: 0 });

  // "Memory chips... forgot the way back home" A memory stick, then tail lights leaving; "home" is held.
  F.shot([14], (s) => {
    const t = s.times(14);
    F.rain(s, 26, 0, t[3]);
    F.swell(s, t[3], 0.1, "255,120,90");
    const line = F.line(s, 14, { hi: [6], it: [2], out: s.cap(14).end + 0.2 });
    F.big(s, "home", t[6], s.t1 - 0.1, { y: 640, max: 420, grow: 0.18 });
    R.tl.to(line[6], { opacity: 0, duration: 0.3 }, t[6] + 0.3);
  }, { rain: 0, dip: [0.32, 0.4] });
})();
