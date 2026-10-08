// Verse 4, lines 25 to 30: double time. Two fast shots, each ending in windows that keep popping back.
(function () {
  const { fx, win: W } = R;
  const { mono, shot, RED } = R.day;
  const { BLUE, ORANGE } = W;

  // The same small window opened again at each "again".
  function again(s, text, times, color, dark) {
    times.forEach((time, i) => {
      const box = W.frame("again.exe", { w: 440, dark, pad: 14 });
      box.body.textContent = text;
      box.body.style.cssText += `font-size:48px;font-weight:800;color:${color}`;
      s.put(box.el, 400 + i * 230, 1215 + i * 80);
      W.open(box, time);
    });
  }

  // "Oil goes up / and the inflation fear / is back again, back again"
  shot([25, 26, 27], true, (s) => {
    const a = s.times(25);
    const b = s.times(26);
    const c = s.times(27);
    const oil = W.cards(s, ["o", "i", "l"], [ORANGE], { size: 190, dark: true });
    oil.forEach((card, i) => W.open(card, s.t0 + i * 0.05));
    fx.slam(mono(s, "goes up", { w: 520, color: ORANGE }), a[1], 1.4, 0.16);
    oil.forEach((card, i) => R.tl.to(card.el, { y: -40, duration: 0.14, ease: "power3.out" }, a[2] + i * 0.03));
    fx.slam(mono(s, "inflation fear", { w: 780 }), b[2], 1.4, 0.16);
    again(s, "back again", [c[2], c[4]], ORANGE, true);
  }, { caption: false });

  // "Chips go down / and the S&P / is in the red again, red again"
  shot([28, 29, 30], false, (s) => {
    const a = s.times(28);
    const b = s.times(29);
    const c = s.times(30);
    W.ascii(s, 28);
    const chips = W.cards(s, ["c", "h", "i", "p", "s"], [BLUE], { size: 150 });
    chips.forEach((card, i) => W.open(card, s.t0 + i * 0.03));
    fx.slam(mono(s, "go down", { w: 500, color: RED }), a[1], 1.4, 0.16);
    chips.forEach((card, i) => R.tl.to(card.el, { y: 46, rotation: (i % 2 ? 1 : -1) * 4, duration: 0.14, ease: "power3.in" }, a[2] + i * 0.03));
    fx.show(mono(s, "s&p 500", { w: 560 }), b[2]);
    fx.slam(mono(s, "in the red", { w: 720, color: RED }), c[3], 1.5, 0.16);
    again(s, "red again", [c[4], c[6]], RED, false);
  }, { caption: false });
})();
