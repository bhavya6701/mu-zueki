// The last rap section, lines 33 to 44: oil. It ends on a half-time breakdown, so the last shots are slow.
(function () {
  const { fx, cir: C } = R;
  const { box, hard, heavy, heavies, mono, plate } = R.day;
  const { INK, BONE, FLARE, WHITE } = C;
  const EMBER = "#E8300C";

  // "9 tankers hit this week / near the Strait of Hormuz" Nine marks on a scope, lit one after another.
  hard([33, 34], "ink", "05 / OIL", (s) => {
    const scope = C.rings(980, { color: "rgba(239,236,230,0.3)", accent: "rgba(255,59,20,0.6)", count: 6, seed: 33 });
    s.put(scope.el, 540, 770);
    C.spin(scope, s.t0, s.t1, 70);
    fx.slam(heavy(s, "9 TANKERS", { w: 864 }), s.t0, 1.5, 0.16);
    const fleet = C.grid(3, Array(9).fill("void"), 150, 12);
    s.add(fleet.el);
    const life = s.t1 - s.t0;
    fleet.tiles.forEach((tile, i) => R.tl.set(tile, { background: FLARE }, s.t0 + 0.1 + (i * (life - 0.3)) / 9));
    fx.show(mono(s, "this week · strait of hormuz", { w: 760 }), s.t0 + life * 0.3);
  });

  // "Nothing moving straight / when the sea lane's bad news"
  hard([35, 36], "ink", "05 / OIL", (s) => {
    const a = s.times(35);
    const b = s.times(36);
    fx.slam(heavy(s, "NOTHING", { w: 820 }), a[0], 1.5, 0.16);
    fx.slam(heavy(s, "MOVING", { w: 820 }), a[1], 1.5, 0.16);
    // "Straight" is the one word that is not.
    fx.slam(C.bend(heavy(s, "STRAIGHT", { w: 840, color: FLARE }), 24), a[2], 1.6, 0.18);
    const sea = C.wave(880, 90, BONE, 4, 7);
    s.add(sea.el);
    fx.show(sea.el, b[0]);
    R.tl.fromTo(sea.line, { x: 0 }, { x: -440, duration: s.t1 - b[0], ease: "none" }, b[0]);
    fx.show(mono(s, "the sea lane's bad news", { w: 660 }), b[1]);
  });

  // "Hurricane Isaias / shut a quarter of the Gulf" The second manga panel: the storm as a spinning mark.
  hard([37, 38], "bone", "05 / OIL", (s) => {
    const b = s.times(38);
    C.speed(s, { color: INK, cy: 770, inner: 350, seed: 37 });
    const bubble = C.bubble("HURRICANE ISAIAS", { size: 54 });
    s.add(bubble);
    fx.pop(bubble, s.t0, 0.18);
    const eye = box(`width:400px;height:400px;border-radius:50%;background:${INK};border:10px solid ${EMBER};display:flex;align-items:center;justify-content:center`);
    const storm = eye.appendChild(C.swirl(310, BONE));
    s.add(eye);
    fx.slam(eye, s.t0 + 0.05, 1.8, 0.2);
    R.tl.fromTo(storm, { rotation: 0 }, { rotation: -900, duration: s.t1 - s.t0, ease: "none", transformOrigin: "50% 50%" }, s.t0);
    const shut = heavies(s, ["SHUT", "1/4"], { w: 640 });
    plate(shut[0], BONE);
    plate(shut[1], EMBER);
    fx.slam(shut[0], b[0], 1.5, 0.14);
    fx.slam(shut[1], b[2], 1.8, 0.16);
    fx.show(plate(mono(s, "of the gulf", { w: 420 }), BONE), b[3]);
    fx.slam(s.put(C.sfx("ゴゴゴ", { size: 130, color: EMBER, stroke: INK }), 250, 1230, -9), s.t0 + 0.1, 1.8, 0.16);
  }, { hud: false });

  // "500,000 barrels a day / pulled off the shelf"
  hard([39, 40], "ink", "05 / OIL", (s) => {
    const a = s.times(39);
    const b = s.times(40);
    const count = heavy(s, "500,000", { w: 864 });
    fx.count(count, s.t0, 0, 500000, 0.45, (v) => (Math.round(v / 1000) * 1000).toLocaleString("en-US"));
    fx.show(mono(s, "barrels a day", { w: 560 }), a[1]);
    const shelf = box(`display:flex;gap:16px;padding:0 10px 0;border-bottom:10px solid ${BONE}`);
    const barrels = Array.from({ length: 8 }, () =>
      box(`width:82px;height:124px;border-radius:16px;background:linear-gradient(${FLARE} 0 22%, ${INK} 22% 29%, ${FLARE} 29% 71%, ${INK} 71% 78%, ${FLARE} 78%)`, shelf),
    );
    s.add(shelf);
    barrels.forEach((barrel, i) => fx.pop(barrel, s.t0 + 0.1 + i * 0.04, 0.16));
    barrels.forEach((barrel, i) => R.tl.to(barrel, { x: 1200, rotation: 40, duration: 0.46, ease: "power3.in" }, b[0] + (7 - i) * 0.05));
    fx.show(mono(s, "pulled off the shelf", { w: 600 }), b[0]);
  });

  // "Brent up 4% to $104, / a fever, not a price" Half time: one number fills the frame.
  hard([41, 42], "flare", "06 / PRICE", (s) => {
    const b = s.times(42);
    fx.show(mono(s, "brent crude · up 4%", { w: 660 }), s.t0);
    const price = heavy(s, "$104", { w: 960, max: 420 });
    fx.slam(price, s.t0, 1.5, 0.4);
    R.tl.to(price, { scale: 1.1, duration: s.t1 - s.t0 - 0.4, ease: "none" }, s.t0 + 0.4);
    const fever = heavies(s, ["A", "FEVER,"], { w: 600, color: WHITE });
    fx.show(fever[0].parentNode, b[0]);
    const not = heavies(s, ["NOT A", "PRICE"], { w: 680 });
    fx.show(not[0].parentNode, b[2]);
  });

  // "They marked the future down / and made the fossils rise" The closing bar, held to the end of the beat.
  hard([43, 44], "ink", "06 / PRICE", (s) => {
    const a = s.times(43);
    const b = s.times(44);
    fx.show(mono(s, "they marked", { w: 380 }), s.t0);
    const future = heavy(s, "THE FUTURE", { w: 800 });
    fx.slam(future, a[2], 1.4, 0.25);
    const down = heavy(s, "DOWN", { w: 520 });
    fx.show(down, a[4]);
    R.tl.to([future, down], { y: 12, opacity: 0.4, duration: 0.5, ease: "power2.out" }, a[4] + 0.1);
    fx.show(mono(s, "and made the", { w: 400 }), b[0]);
    const fossils = heavy(s, "FOSSILS", { w: 864, color: FLARE });
    R.tl.fromTo(fossils, { y: 240, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, b[3]);
    const rise = heavy(s, "RISE", { w: 640, color: FLARE });
    R.tl.fromTo(rise, { y: 240, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, b[4]);
    R.tl.to([fossils, rise], { y: -46, duration: Math.max(0.2, s.t1 - b[4] - 0.5), ease: "none" }, b[4] + 0.5);
  });
})();
