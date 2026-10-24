// The double-time burst, lines 25 to 32: the shortest shots in the reel, and no running caption.
(function () {
  const { fx, cir: C } = R;
  const { hard, heavy, heavies, mono } = R.day;
  const { INK, BONE, FLARE, GREEN } = C;
  const quiet = { caption: false };

  // "Dow stayed green / but the screen stayed mean,"
  hard([25, 26], "ink", "04 / TAPE", (s) => {
    const a = s.times(25);
    const b = s.times(26);
    const dow = heavies(s, ["DOW", "STAYED"], { w: 800, color: GREEN });
    fx.slam(dow[0], a[0], 1.4, 0.1);
    fx.slam(dow[1], a[1], 1.4, 0.1);
    fx.slam(heavy(s, "GREEN", { w: 800, color: GREEN }), a[2], 1.6, 0.12);
    const screen = heavies(s, ["SCREEN", "STAYED"], { w: 864 });
    fx.slam(screen[0], b[2], 1.4, 0.1);
    fx.slam(screen[1], b[3], 1.4, 0.1);
    const mean = heavy(s, "MEAN", { w: 800, color: FLARE });
    fx.slam(mean, b[4], 1.8, 0.14);
    C.glitch(mean, b[4] + 0.02, { dur: 0.18 });
    fx.shake(s.punch, b[4] + 0.02, 18);
  }, quiet);

  // "chip machine lost steam,"
  hard([27], "ink", "04 / TAPE", (s) => {
    const t = s.times(27);
    const chip = heavies(s, ["CHIP", "MACHINE"], { w: 864 });
    fx.slam(chip[0], t[0], 1.4, 0.1);
    fx.slam(chip[1], t[1], 1.4, 0.1);
    fx.slam(heavy(s, "LOST", { w: 520, color: FLARE }), t[2], 1.6, 0.12);
    // The steam thins out and drifts off.
    const steam = heavy(s, "STEAM", { w: 620 });
    fx.show(steam, t[3]);
    R.tl.to(steam, { letterSpacing: "0.45em", opacity: 0.25, y: -56, duration: s.t1 - t[3], ease: "power1.out" }, t[3]);
  }, quiet);

  // "wake up from the dream" One beat of white.
  hard([28], "bone", "04 / TAPE", (s) => {
    fx.slam(heavy(s, "WAKE UP", { w: 880 }), s.t0, 1.8, 0.12);
    fx.show(mono(s, "from the dream", { w: 480 }), s.t0 + 0.16);
  }, quiet);

  // "Then the heat came in / from the sea, not the screen," The frame turns the colour of the oil story.
  hard([29, 30], "flare", "05 / OIL", (s) => {
    fx.slam(heavy(s, "HEAT", { w: 800 }), s.t0, 2, 0.12);
    const sea = C.wave(900, 110, INK, 3, 11);
    s.add(sea.el);
    R.tl.fromTo(sea.line, { x: 0 }, { x: -450, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    fx.show(mono(s, "from the sea, not the screen", { w: 720 }), s.cap(30).start);
  }, quiet);

  // "crude hit the scene / and the crude got mean"
  hard([31, 32], "ink", "05 / OIL", (s) => {
    const b = s.times(32);
    const crude = heavy(s, "CRUDE", { w: 864, color: FLARE });
    fx.slam(crude, s.t0, 2.2, 0.14);
    C.glitch(crude, s.t0 + 0.02, { colors: [BONE, "#7FE3F0"], dur: 0.2 });
    const mean = heavies(s, ["GOT", "MEAN"], { w: 800 });
    fx.slam(mean[0], b[3], 1.4, 0.1);
    fx.slam(mean[1], b[4], 1.8, 0.12);
    fx.shake(s.punch, b[4] + 0.02, 16);
  }, quiet);
})();
