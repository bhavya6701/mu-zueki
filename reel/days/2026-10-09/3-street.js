// The third stanza, lines 19 to 27, and the sign-off: the trading hall, the street, a banquet, breaking
// glass, frost, a supermarket trolley, cash over coins, an empty wallet, and a cassette for the tape.
(function () {
  const { fx, slap: G } = R;
  const { over, put, word, head } = R.day;
  const { YELLOW, PINK, BLACK, PURPLE, WHITE } = G;
  const U = G.ui;
  const T = window.TIMELINE;

  // "Loud is the Street,"
  over([19], (s) => {
    const a = s.times(19);
    G.slam(G.edge(word(s, ["LOUD"], "tall", 540, 640, { w: 864, max: 560, color: YELLOW })[0]), s.t0, 2.4, 0.14);
    fx.shake(s.punch, s.t0 + 0.03, 26);
    const street = word(s, ["IS THE STREET"], "wide", 540, 1120, { w: 760 })[0];
    G.plate(street, BLACK, WHITE, "0.12em 0.3em");
    G.slam(street, a[1]);
  });

  // "but the crowd on the street,"
  over([20], (s) => {
    const b = s.times(20);
    const crowd = word(s, ["but", "the", "crowd"], "serif", 540, 520, { w: 780, color: WHITE });
    crowd.forEach((node, i) => (G.edge(node, BLACK, 0.07), i && G.rise(node, b[i], 0.12)));
    const street = word(s, ["ON THE STREET"], "wide", 540, 1130, { w: 800 })[0];
    G.plate(street, YELLOW, BLACK, "0.12em 0.3em");
    G.slam(street, b[3]);
  });

  // "can't join the feast, the laughter's lost" The banquet, and a button that will not press.
  over([21], (s) => {
    const a = s.times(21);
    const c = head(s, 620);
    G.slam(G.edge(G.row(c, ["CAN'T"], "tall", { w: 760, max: 340, color: WHITE })[0]), s.t0, 2, 0.14);
    const button = U.button("Join the feast", { off: true, size: 58 });
    button.style.position = "relative";
    const cursor = U.cursor(74);
    cursor.el.style.cssText += ";right:-26px;bottom:-54px";
    button.appendChild(cursor.el);
    s.put(button, 540, 900);
    G.pop(button, a[1], 0.16);
    // Two clicks; the button only shakes its head.
    [a[2], a[3]].forEach((time) => {
      cursor.click(time);
      [16, -14, 9, -4, 0].forEach((x, i) => R.tl.set(button, { x }, time + 0.04 + i * 0.035));
    });
    const lost = G.stick(word(s, ["LOST"], "sticker", 540, 1150, { w: 560, max: 250, rot: -3 })[0], WHITE, BLACK, PINK);
    G.pop(lost, a[6], 0.16);
    // "lost": the word goes faint.
    R.tl.to(lost, { opacity: 0.35, duration: 0.12 }, Math.min(a[6] + 0.14, s.t1 - 0.12));
  });

  // "Consumer mood cracks, 46.3," Glass breaks behind the reading.
  over([22], (s) => {
    const a = s.times(22);
    const c = head(s, 720);
    const mood = G.row(c, ["CONSUMER MOOD"], "wide", { w: 700 })[0];
    G.plate(mood, BLACK, WHITE, "0.1em 0.3em");
    const cracks = G.edge(G.row(c, ["CRACKS"], "tall", { max: 330, color: YELLOW })[0]);
    G.slam(cracks, a[2], 2, 0.14);
    fx.shake(s.punch, a[2] + 0.03, 20);
    const reading = G.stick(word(s, ["46.3"], "sticker", 540, 1060, { w: 760, max: 360 })[0], WHITE, BLACK, PINK);
    G.slam(reading, a[3], 2.2, 0.16);
  });

  // "a five-month low, cold as the frost"
  over([23], (s) => {
    const b = s.times(23);
    const toast = s.put(U.toast("5", "LOWEST SINCE MAY", "Five-month low", { accent: "#BFE3FF", w: 800, shadow: PURPLE }), 540, 520, -2);
    G.side(toast, b[1], 1, 0.24);
    G.drop(G.edge(word(s, ["LOW"], "tall", 540, 850, { w: 620, max: 360, color: WHITE })[0]), b[2], 0.3);
    fx.shake(s.punch, b[2] + 0.24, 14);
    const cold = word(s, ["COLD AS THE FROST"], "wide", 540, 1180, { w: 800 })[0];
    G.plate(cold, PURPLE, WHITE, "0.12em 0.3em");
    G.slam(cold, b[3]);
  }, { scrim: { top: 0.3, bottom: 0.6 } });

  // "Prices, they fear, 4.7% in a year, / patience is tossed" A price tag that goes up a notch.
  over([24, 25], (s) => {
    const a = s.times(24);
    const b = s.times(25);
    const c = head(s, 620);
    G.slam(G.edge(G.row(c, ["PRICES"], "tall", { max: 320, color: YELLOW })[0]), s.t0, 1.9, 0.16);
    const tag = U.tag("4.6%", "4.7%", { size: 200 });
    s.put(tag.el, 540, 940, -5);
    G.pop(tag.el, a[1]);
    tag.flip(a[3]);
    fx.shake(s.punch, a[3] + 0.03, 14);
    const year = word(s, ["EXPECTED IN A YEAR"], "wide", 540, 1200, { w: 720 })[0];
    G.plate(year, BLACK, WHITE, "0.12em 0.3em");
    G.slam(year, a[4]);
    G.arrows(s, a[3], { color: YELLOW, up: true, n: 9, seed: 24 });
    // "patience is tossed": the word arrives and is thrown out of the frame.
    const patience = word(s, ["PATIENCE"], "wide", 540, 700, { w: 720, rot: 4 })[0];
    G.plate(patience, PINK, WHITE, "0.12em 0.3em");
    G.slam(patience, b[0]);
    R.tl.to(patience, { x: 1100, y: -1400, rotation: 50, duration: 0.3, ease: "power2.in" }, Math.max(b[2], s.t1 - 0.3));
  });

  // "Kings count the gains, crowd counts the change," The frame splits: notes above, coins below.
  over([26], (s) => {
    const a = s.times(26);
    // Until the crowd's half comes in, the lower half is black.
    const cover = G.block(s, 0, 960, 1080, 960, BLACK);
    G.hide(cover, a[4]);
    G.block(s, 0, 952, 1080, 16, YELLOW);
    G.slam(G.edge(word(s, ["KINGS"], "tall", 540, 440, { w: 700, max: 300, color: YELLOW })[0]), s.t0, 1.9, 0.14);
    const gains = word(s, ["count the gains"], "serif", 540, 760, { w: 700 })[0];
    G.plate(gains, WHITE, BLACK, "0.06em 0.3em");
    G.show(gains, a[1]);
    G.slam(G.edge(word(s, ["CROWD"], "tall", 540, 1150, { w: 700, max: 280, color: WHITE })[0]), a[4], 1.9, 0.14);
  }, { scrim: { top: 0.35, bottom: 0.3 } });

  // "record week reigns, who carries the cost" An empty wallet, and the one word.
  over([27], (s) => {
    const a = s.times(27);
    const c = head(s, 560);
    const week = G.row(c, ["RECORD WEEK"], "wide", { w: 700 })[0];
    G.plate(week, YELLOW, BLACK, "0.1em 0.3em");
    put(c, ["reigns,"], "serif", { w: 380, color: WHITE }, [a[2]], G.rise).forEach((node) => G.edge(node, BLACK, 0.07));
    const who = word(s, ["WHO CARRIES THE"], "wide", 540, 1180, { w: 760 })[0];
    G.plate(who, BLACK, WHITE, "0.12em 0.3em");
    G.slam(who, a[3]);
    const cost = G.edge(word(s, ["COST"], "tall", 540, 860, { w: 900, max: 560, color: YELLOW })[0]);
    G.slam(cost, a[6], 3, 0.14);
    G.hide(c, a[6]);
    G.flash(s, a[6], WHITE, 0.1);
    fx.shake(s.punch, a[6] + 0.03, 30);
  });

  // The beat cuts dead on "cost": the cut falls on the first downbeat after the word starts.
  const words = T.captions[26].words;
  const last = words[words.length - 1].start;
  const cut = T.downbeats.find((beat) => beat > last + 0.15) || last + 0.3;

  // "That's the tape. Mu-Zueki." A cassette turning in its deck.
  over([28], (s) => {
    const t = s.times(28);
    const tape = word(s, ["THAT'S THE TAPE"], "wide", 540, 480, { w: 760 })[0];
    G.plate(tape, YELLOW, BLACK, "0.12em 0.3em");
    G.slam(tape, t[0]);
    const name = word(s, ["MU-", "ZUEKI"], "sticker", 540, 1130, { w: 864, max: 240, gap: 0 });
    name.forEach((part) => G.stick(part, YELLOW, BLACK, PINK));
    G.slam(name[0].parentNode, t[3], 2, 0.18);
  }, { at: cut, caption: false, scrim: { top: 0.4, bottom: 0.7 } });
})();
