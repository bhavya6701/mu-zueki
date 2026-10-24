// The sign-off, line 45: the beat is gone and the idol world comes back for "That's the tape. Mu-Zueki."
// It ends on the same pastel ground the reel opens on, so the loop is seamless.
(function () {
  const { fx, cir: C } = R;
  const K = C.idol;
  const { idol } = R.day;
  const { ROSE, MINT } = C;

  idol([45], (s) => {
    const t = s.times(45);
    K.sparkles(s, 12, 91);
    const tape = K.words(s, ["that's", "the", "tape."], { w: 780, color: ROSE });
    K.bounce(tape[0], s.t0, 0.7);
    K.bounce(tape[1], t[1]);
    K.bounce(tape[2], t[2]);
    K.bounce(K.row(s, "Mu-Zueki", { w: 860, max: 240 }), t[3]);
    const chip = K.chip(190, MINT);
    s.add(chip.el);
    K.bounce(chip.el, t[3] + 0.15);
    // It waves goodbye.
    R.tl.to(chip.el, { rotation: 11, duration: 0.22, yoyo: true, repeat: 5, ease: "sine.inOut" }, t[3] + 0.55);
    K.hearts(s, 10, t[3], 92);
    fx.show(s.row("thursday, oct 8 · not financial advice", { font: "mono", upper: false, w: 660, color: ROSE }), s.cap(45).end + 0.3);
  }, { caption: false, chapter: "07 / SIGN-OFF" });
})();
