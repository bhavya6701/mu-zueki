// The drop and the first rap section, lines 5 to 16: the $50 billion correction and the chip selloff.
(function () {
  const { fx, cir: C } = R;
  const { box, hard, heavy, heavies, mono, plate } = R.day;
  const { INK, BONE, FLARE, WHITE, CYAN } = C;
  const EMBER = "#E8300C"; // the flare colour for type on the bone ground, a touch darker so it reads

  // "50, not 70," The drop: the whole frame turns flare and the number lands.
  hard([5], "flare", "01 / DROP", (s) => {
    const t = s.times(5);
    const flash = box(`position:absolute;inset:0;z-index:7;background:${WHITE}`, s.box);
    R.tl.fromTo(flash, { opacity: 1 }, { opacity: 0, duration: 0.14, ease: "power2.out" }, s.t0);
    fx.slam(heavy(s, "50", { w: 900, max: 560 }), s.t0, 2.6, 0.2);
    fx.shake(s.punch, s.t0 + 0.03, 36);
    const not = heavies(s, ["NOT", "70"], { w: 560, color: WHITE });
    fx.show(not[0].parentNode, t[1]);
    R.mark(not[1], t[2], { color: INK, weight: 16, duration: 0.1 });
    fx.slam(s.put(C.sfx("ドンッ", { size: 170, color: WHITE, stroke: INK }), 800, 425, -12), s.t0 + 0.04, 2, 0.18);
  });

  // "Financial Times reported"
  hard([6], "ink", "01 / DROP", (s) => {
    const t = s.times(6);
    const ring = C.rings(1000, { color: "rgba(239,236,230,0.3)", accent: "rgba(255,59,20,0.55)", seed: 6 });
    s.put(ring.el, 540, 770);
    C.spin(ring, s.t0, s.t1, 30);
    const fin = heavy(s, "FINANCIAL", { w: 880 });
    fx.slam(fin, s.t0, 1.5, 0.18);
    C.glitch(fin, s.t0 + 0.02);
    const times = heavy(s, "TIMES", { w: 880, color: FLARE });
    fx.slam(times, t[1], 1.5, 0.18);
    C.glitch(times, t[1] + 0.02, { colors: [CYAN, BONE] });
    fx.show(mono(s, "reported · oct 08", { w: 520 }), t[2]);
  });

  // "OpenAI's yearly revenue, / the old math got sorted"
  hard([7, 8], "ink", "01 / DROP", (s) => {
    const a = s.times(7);
    const b = s.times(8);
    fx.show(mono(s, "openai · yearly revenue", { w: 660 }), s.t0);
    const sum = box(`font-family:${R.FONT.heavy};font-size:158px;line-height:1;color:${BONE};-webkit-text-stroke:0.1em ${INK};paint-order:stroke fill`, null, "$50B");
    const badge = C.badge(560, sum, { seed: 7 });
    s.add(badge.el);
    C.spin(badge.rings, s.t0, s.t1, 55);
    R.tl.fromTo(badge.el, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power4.out" }, a[1]);
    // The old math, sorted: 70 struck out, 50 kept.
    const math = heavies(s, ["70", "50"], { w: 520, gap: 0.7 });
    fx.show(math[0].parentNode, b[1]);
    R.mark(math[0], b[3], { color: FLARE, weight: 16, duration: 0.14 });
    R.tl.set(math[0], { opacity: 0.45 }, b[3]);
    R.tl.set(math[1], { color: FLARE }, b[4]);
    R.tl.fromTo(math[1], { scale: 1 }, { scale: 1.18, duration: 0.2, ease: "back.out(3)" }, b[4]);
  });

  // "$20 billion short, / and no, nobody shorted" A manga panel: speed lines, a bubble, a thud.
  hard([9, 10], "bone", "02 / SHORT", (s) => {
    const a = s.times(9);
    const b = s.times(10);
    C.speed(s, { color: INK, cy: 800, inner: 370, seed: 9 });
    const bubble = C.bubble("nobody shorted", { size: 50 });
    s.add(bubble);
    fx.pop(bubble, b[2], 0.2);
    const disc = box(`width:460px;height:460px;border-radius:50%;background:${FLARE};border:12px solid ${INK};display:flex;align-items:center;justify-content:center;font-family:${R.FONT.heavy};font-size:176px;color:${INK}`, null, "-20");
    s.add(disc);
    fx.slam(disc, s.t0, 2.2, 0.2);
    fx.shake(s.punch, s.t0 + 0.03, 22);
    fx.slam(plate(heavy(s, "BILLION SHORT", { w: 800 }), BONE), a[2], 1.5, 0.16);
    fx.slam(s.put(C.sfx("ドッ", { size: 170, color: EMBER, stroke: INK }), 205, 1215, -14), s.t0 + 0.06, 2, 0.16);
  }, { hud: false });

  // "Chips on the table / and the hot hand folded"
  hard([11, 12], "ink", "02 / SHORT", (s) => {
    const b = s.times(12);
    fx.show(mono(s, "chips on the table", { w: 620 }), s.t0);
    const table = C.grid(4, Array(12).fill("dot"), 180, 12);
    s.add(table.el);
    table.tiles.forEach((tile, i) => fx.pop(tile, s.t0 + i * 0.035, 0.16));
    // The hand folds: the chips go dark one after another.
    const random = R.rng(12);
    const order = table.tiles.map((tile) => [random(), tile]).sort((x, y) => x[0] - y[0]).map((pair) => pair[1]);
    order.forEach((tile, i) => {
      const at = b[2] + (i * (b[4] + 0.25 - b[2])) / order.length;
      R.tl.set(tile, { background: INK }, at);
      R.tl.set(tile.firstChild, { background: "rgba(239,236,230,0.22)" }, at);
    });
    const folded = heavy(s, "FOLDED", { w: 864, color: FLARE });
    fx.slam(folded, b[4], 1.6, 0.2);
    C.glitch(folded, b[4] + 0.02);
  });

  // "Nvidia down near 3%, / Intel down past 5"
  hard([13, 14], "ink", "03 / CHIPS", (s) => {
    const a = s.times(13);
    const b = s.times(14);
    fx.slam(heavy(s, "NVIDIA", { w: 760 }), s.t0, 1.5, 0.16);
    fx.slam(heavy(s, "-3%", { w: 520, max: 220, color: FLARE }), a[3], 2, 0.18);
    fx.slam(heavy(s, "INTEL", { w: 660 }), b[0], 1.5, 0.16);
    fx.slam(heavy(s, "-5%", { w: 620, max: 250, color: FLARE }), b[3], 2.2, 0.18);
    fx.shake(s.punch, b[3] + 0.03, 18);
  });

  // "Stale intel on the revenue, / watch the sector dive" The drums drop out, so the frame goes still.
  hard([15, 16], "ink", "03 / CHIPS", (s) => {
    const a = s.times(15);
    const b = s.times(16);
    s.put(C.rings(820, { count: 1, accent: "rgba(239,236,230,0.45)" }).el, 540, 765);
    const stale = s.words(["stale", "intel", "on", "the", "revenue,"], { font: "mono", upper: false, w: 780 });
    stale.forEach((word, i) => fx.show(word, a[i]));
    fx.show(mono(s, "watch the sector", { w: 520 }), b[0]);
    const dive = heavy(s, "DIVE", { w: 760, max: 330, color: FLARE });
    fx.show(dive, b[3]);
    R.tl.to(dive, { y: 1500, rotation: 8, duration: 0.4, ease: "power2.in" }, Math.max(b[3] + 0.1, s.t1 - 0.34));
  }, { still: true });
})();
