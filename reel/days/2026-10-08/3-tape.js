// The second rap section, lines 17 to 24: the hi-hats switch to triplets and the names go by like a ticker.
(function () {
  const { fx, cir: C } = R;
  const { box, hard, heavy, heavies, mono } = R.day;
  const { INK, BONE, FLARE, WHITE } = C;
  const third = TIMELINE.seconds_per_beat / 3;

  // A strip of four pattern tiles that blink in threes, one tile per triplet step.
  function strip(s, kinds) {
    const tiles = C.grid(4, kinds, 180, 12);
    s.add(tiles.el);
    C.beats(s).forEach((beat, n) => {
      [0, 1, 2].forEach((k) => {
        const tile = tiles.tiles[(n * 3 + k) % 4];
        R.tl.set(tile, { opacity: 0.18 }, beat + k * third);
        R.tl.set(tile, { opacity: 1 }, beat + k * third + third * 0.8);
      });
    });
    return tiles;
  }

  // "Micron down 5-plus, / Oracle too in the session"
  hard([17, 18], "ink", "03 / CHIPS", (s) => {
    const a = s.times(17);
    const b = s.times(18);
    strip(s, ["half", "ring", "bar", "wave"]);
    fx.slam(heavy(s, "MICRON", { w: 800 }), s.t0, 1.5, 0.14);
    const down = heavies(s, ["DOWN", "5%+"], { w: 620, color: FLARE });
    fx.slam(down[0], a[1], 1.4, 0.14);
    fx.slam(down[1], a[2], 1.8, 0.16);
    fx.slam(heavy(s, "ORACLE", { w: 800 }), b[0], 1.5, 0.14);
    fx.show(mono(s, "too, in the session", { w: 540 }), b[1]);
  });

  // "Arm and Marvell 6-plus, / that's an arm-twisting lesson"
  hard([19, 20], "ink", "03 / CHIPS", (s) => {
    const a = s.times(19);
    const b = s.times(20);
    strip(s, ["wave", "bar", "ring", "half"]);
    const arm = heavy(s, "ARM", { w: 460 });
    fx.slam(arm, s.t0, 1.5, 0.14);
    fx.slam(heavy(s, "MARVELL", { w: 820 }), a[2], 1.5, 0.14);
    const down = heavies(s, ["DOWN", "6%+"], { w: 620, color: FLARE });
    fx.slam(down[0], a[3], 1.4, 0.14);
    fx.slam(down[1], a[3] + 0.12, 1.8, 0.16);
    fx.show(mono(s, "an arm-twisting lesson", { w: 620 }), b[0]);
    // The arm gets twisted.
    R.tl.to(arm, { rotation: -14, skewX: 26, duration: 0.3, ease: "back.out(3)" }, b[2]);
  });

  // "Nasdaq down 1.3% / under pressure" Two plates close in and the number is squeezed.
  hard([21, 22], "flare", "04 / TAPE", (s) => {
    const a = s.times(21);
    const b = s.times(22);
    fx.slam(heavy(s, "NASDAQ", { w: 840 }), s.t0, 1.5, 0.14);
    fx.slam(heavy(s, "-1.3%", { w: 880, max: 330, color: WHITE }), a[2], 2.2, 0.18);
    fx.shake(s.punch, a[2] + 0.03, 20);
    fx.show(mono(s, "under pressure", { w: 600 }), b[0]);
    const top = s.put(box(`width:940px;height:44px;background:${INK}`), 540, 320);
    const bottom = s.put(box(`width:940px;height:44px;background:${INK}`), 540, 1215);
    R.tl.to(top, { y: 210, duration: 0.22, ease: "power4.out" }, b[0]);
    R.tl.to(bottom, { y: -215, duration: 0.22, ease: "power4.out" }, b[0]);
    R.tl.to(s.stage, { scaleY: 0.62, duration: 0.22, ease: "power4.out" }, b[0]);
  });

  // "S&P down 0.5%, / second straight off the record"
  hard([23, 24], "ink", "04 / TAPE", (s) => {
    const a = s.times(23);
    const b = s.times(24);
    fx.slam(heavy(s, "S&P 500", { w: 800 }), s.t0, 1.5, 0.14);
    fx.slam(heavy(s, "-0.5%", { w: 700, max: 270, color: FLARE }), a[2], 2, 0.18);
    fx.show(mono(s, "second straight", { w: 560 }), b[0]);
    // The record: a disc that slides off the frame on "off the record".
    const label = box(`width:118px;height:118px;border-radius:50%;background:${FLARE};border:10px solid ${INK}`);
    const record = C.badge(360, label, { count: 7, seed: 23, accent: BONE });
    s.add(record.el);
    C.spin(record.rings, s.t0, s.t1, 130);
    fx.pop(record.el, b[0], 0.2);
    R.tl.to(record.el, { x: 980, rotation: 50, duration: 0.42, ease: "power3.in" }, b[2]);
  });
})();
