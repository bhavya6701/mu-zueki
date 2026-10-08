// Verse 3, lines 17 to 24: the mood turns to oil. Orange takes over from blue.
(function () {
  const { fx, win: W } = R;
  const { mono, words, shot, RED } = R.day;
  const { BLUE, ORANGE } = W;

  // "Then crude got rude, / Brent up 4%"
  shot([17, 18], true, (s) => {
    const a = s.times(17);
    const b = s.times(18);
    const crude = words(s, ["then", "crude"], { w: 640 });
    fx.slam(crude[0], a[0], 1.4, 0.16);
    fx.slam(crude[1], a[1], 1.4, 0.16);
    const rude = words(s, ["got", "rude"], { w: 640 });
    fx.slam(rude[0], a[2], 1.4, 0.16);
    fx.slam(rude[1], a[3], 1.7, 0.2);
    rude[1].style.color = ORANGE;
    const chart = W.chart("brent.chart", [7, 7.2, 7.1, 7.9, 8.4, 8.2, 9.3, 9.8, 10.4], a[1], s.cap(18).end + 0.4, { w: 760, h: 170, color: ORANGE, dark: true });
    s.add(chart.el);
    W.open(chart, a[1] - 0.05);
    const up = W.cards(s, ["+4%"], [ORANGE], { size: 220, dark: true, title: "brent.glyph" })[0];
    W.open(up, b[0]);
    fx.shake(s.punch, b[0] + 0.04, 20);
  });

  // "$104 a barrel, / that's where it went"
  shot([19, 20], false, (s) => {
    const a = s.times(19);
    const b = s.times(20);
    W.ascii(s, 19);
    const price = W.cards(s, ["$", "1", "0", "4"], [ORANGE], { size: 200 });
    price.forEach((card, i) => W.open(card, s.t0 + i * 0.07));
    fx.show(mono(s, "a barrel", { w: 520 }), a[1]);
    const bar = W.progress("brent crude", s.t0, a[2], { w: 700, label: "$104.28", color: ORANGE });
    s.add(bar.el);
    fx.show(mono(s, "that's where it went", { w: 660, font: "mono" }), b[0]);
    W.cursor(s, [{ t: s.t0, x: 860, y: 430 }, { t: a[2], on: bar.el, dx: 300, click: true }]);
  });

  // "9 tankers attacked near Hormuz, / one week"
  shot([21, 22], true, (s) => {
    const a = s.times(21);
    const b = s.times(22);
    fx.slam(mono(s, "9 tankers", { w: 720 }), s.t0, 1.4, 0.16);
    // Nine ships on the map; they go red one after another.
    const map = W.frame("hormuz.map", { dark: true, pad: 18 });
    map.body.style.cssText += "display:grid;grid-template-columns:repeat(3,96px);gap:14px";
    const span = s.cap(21).end + 0.5 - s.t0;
    for (let i = 0; i < 9; i++) {
      const ship = document.createElement("div");
      ship.style.cssText = `height:70px;border:3px solid ${BLUE}`;
      map.body.appendChild(ship);
      R.tl.set(ship, { backgroundColor: RED, borderColor: RED }, s.t0 + 0.08 + (i * span) / 9);
    }
    s.add(map.el);
    W.open(map, s.t0);
    fx.show(mono(s, "attacked near hormuz", { w: 700, font: "mono" }), a[2]);
    fx.slam(mono(s, "one week", { w: 460, color: ORANGE }), b[0], 1.5, 0.2);
  });

  // "Hurricane shut a quarter of the Gulf, / that's bleak"
  shot([23, 24], false, (s) => {
    const a = s.times(23);
    const b = s.times(24);
    W.ascii(s, 23);
    const storm = W.cards(s, ["@"], [BLUE], { size: 210, title: "isaias.glyph" })[0];
    W.open(storm, s.t0);
    R.tl.fromTo(storm.letter, { rotation: 0 }, { rotation: -720, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    fx.slam(mono(s, "hurricane", { w: 720 }), a[0], 1.4, 0.16);
    // Gulf output: a full bar that loses a quarter.
    const gulf = W.frame("gulf.output", { w: 700, pad: 16 });
    const track = document.createElement("div");
    track.className = "win-track";
    const fill = document.createElement("div");
    fill.className = "win-fill";
    fill.style.background = W.ORANGE;
    track.appendChild(fill);
    const note = document.createElement("div");
    note.className = "win-note";
    note.innerHTML = "<span>shut in</span><span></span>";
    gulf.body.append(track, note);
    s.add(gulf.el);
    W.open(gulf, a[1] - 0.05);
    R.tl.fromTo(fill, { scaleX: 1 }, { scaleX: 0.75, duration: a[3] - a[1], ease: "power2.out" }, a[1]);
    fx.count(note.lastChild, a[1], 0, 25, a[3] - a[1], (v) => "-" + Math.round(v) + "%");
    fx.show(mono(s, "a quarter of the gulf", { w: 700, font: "mono" }), a[3]);
    fx.slam(mono(s, "that's bleak", { w: 660 }), b[0], 1.5, 0.2);
  });
})();
