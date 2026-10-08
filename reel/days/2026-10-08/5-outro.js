// The hook's return (lines 31 to 34, grounds swapped) and the spoken sign-off (line 35).
(function () {
  const { fx, win: W } = R;
  const { mono, shot, RED, GREEN } = R.day;
  const { BLUE, ORANGE } = W;

  R.day.hook(31, true);

  // "That's the tape. Mu-Zueki." The beat is gone: a terminal prints the day, then the name.
  shot([35], true, (s) => {
    const t = s.times(35);
    const tape = W.table("tape.txt", [["$ cat tape.txt", ""], ["nasdaq", "-345.35", RED], ["brent", "+4%", ORANGE], ["dow", "+51.77", GREEN]], { w: 700, dark: true });
    tape.el.style.fontSize = "40px";
    s.add(tape.el);
    W.open(tape, s.t0);
    W.type(tape, s.t0, 0.12);
    fx.show(mono(s, "that's the tape.", { w: 640, font: "mono" }), t[2]);
    W.stack(s, "mu-zueki", 3, t[3], 0.09, { w: 700, color: BLUE });
    fx.show(mono(s, "oct 8, 2026 · not financial advice", { w: 660, font: "mono" }), s.cap(35).end + 0.3);
  }, { caption: false });

  // The last second is back on paper, where the reel starts, with the name set as glyph cards.
  R.shot({ at: R.duration - 1.2, ground: "paper", look: "windows", caption: false }, (s) => {
    W.ascii(s, 99);
    // Two rows: eight cards side by side would not fit the width.
    const name = W.cards(s, ["m", "u"], [BLUE, ORANGE], { size: 150 }).concat(W.cards(s, ["z", "u", "e", "k", "i"], [ORANGE, BLUE], { size: 150 }));
    name.forEach((card, i) => W.open(card, s.t0 + 0.06 + i * 0.045));
    fx.show(mono(s, "thursday, october 8", { w: 520, font: "mono" }), s.t0 + 0.5);
    W.cursor(s, [{ t: s.t0, x: 860, y: 1200 }, { t: s.t0 + 0.5, on: name[6].el, dx: 30, dy: 50, click: true }]);
  });
})();
