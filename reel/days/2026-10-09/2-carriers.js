// The second stanza, lines 11 to 18: three cell towers, one carrier's card on each, the signal bars
// falling; then a rocket, a satellite and a screen of static.
(function () {
  const { fx, slap: G } = R;
  const { over, put, word, head } = R.day;
  const { YELLOW, PINK, BLACK, PURPLE, WHITE } = G;
  const U = G.ui;
  const T = window.TIMELINE;

  // "Down goes T-Mobile, 13%," The drums drop out: dhol and voice only.
  over([11], (s) => {
    const a = s.times(11);
    const c = head(s, 640);
    G.drop(G.edge(G.row(c, ["DOWN"], "tall", { w: 760, max: 360, color: WHITE })[0]), s.t0, 0.3);
    fx.shake(s.punch, s.t0 + 0.24, 20);
    const card = U.carrier("T-Mobile", "-13.27%");
    s.put(card.el, 540, 1120);
    G.pop(card.el, a[2]);
    card.drop(a[3], 0.7);
    const figure = G.stick(word(s, ["-13%"], "sticker", 540, 850, { w: 640, max: 260, rot: -4 })[0], PINK, WHITE, BLACK);
    G.slam(figure, a[3], 2.2, 0.18);
  });

  // "dropped like a call, a dog of a day" An incoming-call screen, and the notification over it.
  over([12], (s) => {
    const b = s.times(12);
    const toast = s.put(U.toast("X", "T-MOBILE · CALL STATUS", "Call dropped", { accent: PINK, w: 740 }), 540, 520, -3);
    G.drop(toast, b[0], 0.34);
    const dog = word(s, ["A DOG OF A DAY"], "wide", 540, 1190, { w: 760 })[0];
    G.plate(dog, YELLOW, BLACK, "0.12em 0.3em");
    G.slam(dog, b[5]);
  }, { scrim: { top: 0.2, bottom: 0.7 } });

  // "AT&T aches, near 10% breaks,"
  over([13], (s) => {
    const a = s.times(13);
    const c = head(s, 760);
    G.slam(G.edge(G.row(c, ["AT&T"], "tall", { w: 700, max: 340, color: WHITE })[0]), s.t0, 1.9, 0.16);
    const near = G.row(c, ["NEAR", "-10%"], "sticker", { w: 820, max: 220 });
    near.forEach((node) => G.stick(node, YELLOW, BLACK, BLACK));
    G.pop(near[0], a[2]);
    G.slam(near[1], a[3], 2, 0.16);
    const card = U.carrier("AT&T", "-9.81%", { shadow: YELLOW });
    s.put(card.el, 540, 1120);
    G.pop(card.el, s.t0 + 0.08);
    card.drop(a[1], 0.5);
    // "breaks": the card snaps out of line.
    R.tl.to(card.el, { rotation: 7, y: 20, duration: 0.14, ease: "back.out(4)" }, a[4]);
    fx.shake(s.punch, a[4] + 0.02, 14);
  });

  // "worst since 2000, washed away" A wave takes it.
  over([14], (s) => {
    const b = s.times(14);
    const c = head(s, 760);
    const worst = G.row(c, ["WORST SINCE"], "wide", { w: 620 })[0];
    G.plate(worst, BLACK, WHITE, "0.1em 0.3em");
    G.slam(G.edge(G.row(c, ["2000"], "tall", { w: 760, max: 400, color: WHITE })[0]), b[2], 2, 0.16);
    const washed = word(s, ["washed", "away"], "serif", 540, 1100, { w: 720, color: WHITE });
    washed.forEach((node, i) => (G.edge(node, BLACK, 0.07), G.rise(node, b[3 + i])));
    // "washed away": the words drain off the bottom through the long hold.
    const from = Math.max(b[4] + 0.35, s.t0 + 0.6);
    washed.forEach((node, i) => R.tl.to(node, { y: 900, rotation: i ? 14 : -10, opacity: 0, duration: 0.9, ease: "power2.in" }, from + i * 0.12));
  });

  // "Verizon reeling, near 9% bleeding," The kick and the strings are back.
  over([15], (s) => {
    const a = s.times(15);
    G.flash(s, s.t0, WHITE, 0.1);
    const c = head(s, 760);
    const verizon = G.edge(G.row(c, ["VERIZON"], "tall", { max: 300, color: WHITE })[0]);
    G.slam(verizon, s.t0, 1.9, 0.16);
    // "reeling": it rocks and never quite settles.
    [-6, 5, -4, 3, -2, 1].forEach((angle, i) => R.tl.to(verizon, { rotation: angle, duration: 0.16, ease: "sine.inOut" }, s.t0 + 0.18 + i * 0.16));
    const near = G.row(c, ["NEAR", "-9%"], "sticker", { w: 760, max: 220 });
    near.forEach((node) => G.stick(node, PINK, WHITE, BLACK));
    G.pop(near[0], a[2]);
    G.slam(near[1], a[3], 2, 0.16);
    const card = U.carrier("Verizon", "-8.75%", { shadow: PINK });
    s.put(card.el, 540, 1120);
    G.pop(card.el, s.t0 + 0.08);
    card.drop(s.t0 + 0.2, 0.5);
    G.arrows(s, a[4], { color: PINK, up: false, n: 9, size: 40, seed: 15 });
  });

  // "victor turned prey"
  over([16], (s) => {
    const b = s.times(16);
    const victor = word(s, ["VICTOR"], "wide", 540, 520, { w: 620, color: WHITE })[0];
    G.edge(victor);
    R.mark(victor, b[1], { color: PINK, weight: 18, duration: 0.1 });
    const prey = G.edge(word(s, ["PREY"], "tall", 540, 900, { w: 820, max: 520, color: WHITE })[0]);
    G.slam(prey, b[2], 2.4, 0.14);
    fx.shake(s.punch, b[2] + 0.03, 18);
  });

  // "SpaceX signs for spectrum," A launch, and the deal signed.
  over([17], (s) => {
    const a = s.times(17);
    const c = head(s, 620);
    G.slam(G.edge(G.row(c, ["SPACEX"], "tall", { max: 320, color: WHITE })[0]), s.t0, 1.9, 0.16);
    const spectrum = word(s, ["800 MHz SPECTRUM"], "wide", 540, 960, { w: 760 })[0];
    G.plate(spectrum, PURPLE, WHITE, "0.14em 0.3em");
    G.slam(spectrum, a[3]);
    const signed = U.button("Signed", { bg: YELLOW, size: 60 });
    signed.style.position = "relative";
    const cursor = U.cursor(70);
    cursor.el.style.cssText += ";right:-30px;bottom:-50px";
    signed.appendChild(cursor.el);
    s.put(signed, 540, 1160);
    G.pop(signed, a[1], 0.18);
    cursor.click(a[1] + 0.14);
  });

  // "Starlink's the spear," A satellite over the earth; the spear is one stroke across the frame.
  over([17], (s) => {
    const a = s.times(17);
    const c = head(s, 640);
    const starlink = G.row(c, ["STARLINK'S THE"], "wide", { w: 700 })[0];
    G.plate(starlink, BLACK, WHITE, "0.1em 0.3em");
    const spear = G.stick(G.row(c, ["SPEAR"], "sticker", { w: 700, max: 260 })[0], PINK, WHITE, BLACK);
    G.slam(spear, a[6], 2.2, 0.14);
    const shaft = G.block(s, -500, 1500, 2200, 16, WHITE, -62);
    R.tl.fromTo(shaft, { x: 1500 }, { x: -200, duration: 0.14, ease: "power4.in" }, a[6] - 0.08);
    fx.shake(s.punch, a[6] + 0.05, 18);
  }, { at: T.captions[16].words[4].start });

  // "three carriers here, none carried the day" Everything but the kick cuts: static, and three switches off.
  over([18], (s) => {
    const a = s.times(18);
    [["T-Mobile", "-13.27%"], ["AT&T", "-9.81%"], ["Verizon", "-8.75%"]].forEach(([name, move], i) => {
      const card = U.card("width:820px;display:flex;align-items:center;gap:22px;padding:18px 30px;border-radius:30px", PINK);
      G.box(`flex:1;text-align:left;font-family:${R.FONT.display};font-size:48px;text-transform:uppercase`, card, name);
      G.box(`font-family:${R.FONT.tall};font-size:56px;color:#C40F3F`, card, move);
      const toggle = U.toggle(130, { state: true });
      card.appendChild(toggle.el);
      s.put(card, 540, 700 + i * 150, i % 2 ? 2 : -2);
      // "three carriers here": they land one per word; "none": the switches go off down the list.
      G.side(card, a[i], i % 2 ? -1 : 1, 0.2);
      toggle.set(a[3] + i * 0.1, false);
    });
    const none = G.edge(word(s, ["NONE"], "tall", 540, 420, { w: 700, max: 330, color: YELLOW })[0]);
    G.slam(none, a[3], 2.4, 0.16);
    G.flash(s, a[3], WHITE, 0.1);
    fx.shake(s.punch, a[3] + 0.03, 20);
    const day = word(s, ["CARRIED THE DAY"], "wide", 540, 1190, { w: 760 })[0];
    G.plate(day, YELLOW, BLACK, "0.12em 0.3em");
    G.slam(day, a[4]);
    G.pulse(none, G.beats(s).filter((time) => time > a[6] + 0.1), 0.05);
  }, { scrim: { top: 0.35, bottom: 0.7 } });
})();
