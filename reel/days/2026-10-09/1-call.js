// 2026-10-09 as a mixed-media reel: stock footage cut to each lyric line (footage.json), with type,
// figures and interface elements over it in the slap look. The lyric runs as a caption line.
// This file: the helpers the day shares, the call (lines 1 and 2) and the first stanza (lines 3 to 10).
(function () {
  const { fx, slap: G } = R;
  const { YELLOW, PINK, BLACK, PURPLE, WHITE, GREEN } = G;
  const U = G.ui;

  // A shot over the day's footage: nothing painted but a veil for legibility.
  const over = (caps, build, more) =>
    R.shot(Object.assign({ caps, ground: "clear", look: "slap" }, more), (s) => {
      if (!more || more.scrim !== false) G.scrim(s, more && more.scrim);
      build(s);
    });
  // A row of words that arrive one per time in `times`, by the move `how`.
  const put = (col, words, voice, o, times, how = G.pop, ...rest) => {
    const nodes = G.row(col, words, voice, o);
    G.each(nodes, times, how, ...rest);
    return nodes;
  };
  // One row of type placed with its middle at x, y of the frame (o.rot turns it).
  const word = (s, words, voice, x, y, o) => {
    const holder = G.box("display:flex;flex-direction:column;align-items:center");
    s.put(holder, x, y, o && o.rot);
    return G.row(holder, words, voice, o);
  };
  // The band at the top of the frame where the headline of a shot goes.
  const head = (s, bottom = 700) => G.col(s, { top: 250, bottom, gap: 10 });
  R.day = { over, put, word, head };

  // "Friday, the Dow, 423, flying" A hall of trading screens.
  over([1], (s) => {
    const t = s.times(1);
    const c = head(s, 820);
    // On screen from the first frame.
    G.plate(G.row(c, ["FRIDAY"], "tall", { w: 520, max: 190 })[0], YELLOW, BLACK);
    put(c, ["THE", "DOW"], "wide", { w: 520, color: WHITE }, [t[1], t[2]]).forEach((node) => G.edge(node));
    const figure = G.stick(G.row(c, ["+423"], "sticker", { w: 820, max: 330 })[0], WHITE, BLACK, PINK);
    G.slam(figure, t[3], 2.2, 0.18);
    fx.count(figure, t[3], 0, 423, 0.6, (v) => "+" + Math.round(v));
    fx.shake(s.punch, t[3] + 0.03, 16);
    const toast = s.put(U.toast("+", "DOW JONES · FRIDAY", "flying", { accent: GREEN, w: 620 }), 540, 1130, -3);
    G.side(toast, t[4], 1, 0.24);
    G.arrows(s, t[4], { color: YELLOW, up: true, n: 12, seed: 1 });
  });

  // "Week of the records, and Wall Street wins" Candles climbing.
  over([2], (s) => {
    const t = s.times(2);
    const c = head(s, 760);
    G.plate(G.row(c, ["WEEK OF THE"], "wide", { w: 560 })[0], BLACK, WHITE, "0.1em 0.3em");
    const records = G.edge(G.row(c, ["RECORDS"], "tall", { w: 864, max: 330, color: YELLOW })[0]);
    G.grow(records, t[3], 0.24);
    const wall = word(s, ["WALL", "STREET"], "wide", 540, 960, { w: 720, color: WHITE });
    wall.forEach((node) => G.edge(node));
    G.show(wall[0].parentNode, t[5]);
    const wins = G.stick(word(s, ["WINS"], "sticker", 540, 1150, { w: 620, max: 280, rot: -4 })[0], YELLOW, BLACK, BLACK);
    G.slam(wins, t[7], 2.4, 0.18);
    G.flash(s, t[7], WHITE);
    fx.shake(s.punch, t[7] + 0.03, 20);
  });

  // "King is the Dow, 51,650 now, / keeping the crown" The full beat lands on a roar.
  over([3, 4], (s) => {
    const a = s.times(3);
    const b = s.times(4);
    G.flash(s, s.t0, YELLOW, 0.14);
    const c = head(s, 720);
    const king = G.edge(G.row(c, ["KING"], "tall", { w: 700, max: 380, color: YELLOW })[0]);
    G.slam(king, s.t0, 2.2, 0.18);
    fx.shake(s.punch, s.t0 + 0.03, 24);
    const dow = G.row(c, ["IS THE DOW"], "wide", { w: 600 })[0];
    G.plate(dow, BLACK, WHITE, "0.1em 0.3em");
    G.show(dow, a[1]);
    const level = G.stick(word(s, ["51,650"], "sticker", 540, 1040, { w: 864, max: 270 })[0], WHITE, BLACK, PINK);
    G.show(level, a[4]);
    fx.count(level, a[4], 51227, 51650, 0.55, (v) => Math.round(v).toLocaleString("en-US"));
    const crown = s.put(U.toast("#1", "STILL", "keeping the crown", { accent: YELLOW, w: 700 }), 540, 1230, 2);
    G.pop(crown, b[0]);
    R.tl.fromTo(king, { y: -40 }, { y: 0, duration: 0.4, ease: "bounce.out", immediateRender: false }, b[2]);
  });

  // "S&P strides, 0.6% higher, / shy of its high, standing its ground" A slider that stops short of its flag.
  over([5, 6], (s) => {
    const a = s.times(5);
    const b = s.times(6);
    const c = head(s, 760);
    G.slam(G.edge(G.row(c, ["S&P"], "wide", { w: 520, max: 190, color: WHITE })[0]), s.t0, 1.8, 0.16);
    G.slam(G.edge(G.row(c, ["+0.6%"], "tall", { w: 780, max: 330, color: YELLOW })[0]), a[2], 2, 0.18);
    const slider = U.slider(840, { label: "S&P 500", flag: "ALL-TIME HIGH", shadow: PURPLE });
    s.put(slider.el, 540, 1090);
    G.pop(slider.el, s.t0 + 0.1);
    // It strides: one step per word, the last stopping just short of the flag.
    [0.3, 0.58, 0.82, 0.955].forEach((stop, i) => slider.to(a[i] + 0.12, stop, 0.24));
    // "standing its ground": the thumb plants itself.
    R.tl.fromTo(slider.thumb, { scaleY: 0.5, scaleX: 1.4 }, { scaleY: 1, scaleX: 1, duration: 0.4, ease: "elastic.out(1,0.4)", immediateRender: false }, b[4]);
    fx.shake(s.punch, b[4] + 0.02, 12);
  });

  // "Nasdaq is near them, three of them cheering," The crowd, and three switches going on.
  over([7], (s) => {
    const a = s.times(7);
    const c = head(s, 900);
    G.slam(G.row(c, ["NASDAQ"], "tall", { max: 320, color: BLACK })[0], s.t0, 1.8, 0.16);
    put(c, ["is", "near", "them,"], "serif", { w: 600, color: BLACK }, [a[1], a[2], a[3]], G.rise);
    const three = G.stick(G.row(c, ["THREE"], "sticker", { w: 760, max: 280 })[0], PINK, BLACK, BLACK);
    G.pop(three, a[4]);
    const card = U.card("display:flex;gap:30px;align-items:center;padding:28px 40px", PINK);
    ["DOW", "S&P", "NDQ"].forEach((name, i) => {
      const cell = G.box(`display:flex;flex-direction:column;align-items:center;gap:12px;font-family:${R.FONT.display};font-size:30px`, card, name);
      const toggle = U.toggle(150);
      cell.appendChild(toggle.el);
      toggle.set(a[4] + 0.1 + i * 0.12, true);
    });
    s.put(card, 540, 1130);
    G.pop(card, a[3]);
  }, { scrim: false });

  // "green for the week, none knocked down"
  over([8], (s) => {
    const b = s.times(8);
    const c = head(s, 720);
    G.slam(G.edge(G.row(c, ["GREEN"], "tall", { max: 360, color: GREEN })[0]), s.t0, 2, 0.16);
    put(c, ["for", "the", "week,"], "serif", { w: 620, color: WHITE }, [b[1], b[2], b[3]], G.rise).forEach((node) => G.edge(node, BLACK, 0.07));
    G.slam(G.edge(word(s, ["NONE"], "wide", 540, 980, { w: 460, color: WHITE })[0]), b[4]);
    const knocked = word(s, ["KNOCKED DOWN"], "tall", 540, 1170, { w: 760, max: 200 })[0];
    G.plate(knocked, GREEN, BLACK);
    G.slam(knocked, b[5]);
    // It takes the knock and stays up.
    R.tl.fromTo(knocked, { rotation: -9 }, { rotation: 0, duration: 0.5, ease: "elastic.out(1,0.3)", immediateRender: false }, b[6] + 0.05);
    G.arrows(s, s.t0, { color: GREEN, up: true, n: 9, seed: 8 });
  });

  // "Russell the runt, small-cap grunt,"
  over([9], (s) => {
    const a = s.times(9);
    const c = head(s, 620);
    G.grow(G.edge(G.row(c, ["RUSSELL"], "tall", { max: 300, color: WHITE })[0]), s.t0, 0.22);
    const toast = s.put(U.toast("R", "RUSSELL 2000 · SMALL-CAP", "the runt", { accent: PINK, w: 720 }), 540, 1090, 3);
    G.side(toast, a[1], -1, 0.24);
    const grunt = G.stick(word(s, ["GRUNT"], "sticker", 720, 880, { w: 440, max: 200, rot: 8 })[0], YELLOW, BLACK, BLACK);
    G.pop(grunt, a[4]);
  });

  // "red for the week, run out of town" The screens go red and the words leave.
  over([10], (s) => {
    const b = s.times(10);
    const c = head(s, 700);
    const red = G.row(c, ["RED"], "tall", { w: 620, max: 380, color: PINK })[0];
    G.edge(red, WHITE, 0.05);
    G.slam(red, s.t0, 2, 0.16);
    const week = G.row(c, ["FOR THE WEEK"], "wide", { w: 600 })[0];
    G.plate(week, BLACK, WHITE, "0.1em 0.3em");
    G.show(week, b[1]);
    const figure = G.stick(word(s, ["-0.9%"], "sticker", 540, 960, { w: 700, max: 260 })[0], PINK, WHITE, BLACK);
    G.pop(figure, b[0] + 0.08);
    const run = word(s, ["RUN", "OUT", "OF", "TOWN"], "wide", 540, 1180, { w: 820, color: YELLOW });
    run.forEach((node, i) => (G.edge(node), G.side(node, b[4 + i], 1, 0.16)));
    R.tl.to(s.layer, { x: -1400, duration: 0.2, ease: "power3.in" }, s.t1 - 0.2);
  });
})();
