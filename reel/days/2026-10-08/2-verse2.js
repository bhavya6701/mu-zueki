// Verse 2, lines 5 to 16: the OpenAI revenue number and the chip selloff.
(function () {
  const { fx, win: W } = R;
  const { mono, words, shot, RED, FALL } = R.day;
  const { BLUE, ORANGE } = W;

  // "Financial Times put a number / on the floor"
  shot([5, 6], false, (s) => {
    const a = s.times(5);
    const b = s.times(6);
    W.ascii(s, 5);
    const paper = W.frame("ft.com", { w: 760 });
    const head = document.createElement("div");
    head.textContent = "financial times";
    head.style.cssText = "font-size:58px;font-weight:800;margin-bottom:14px";
    paper.body.appendChild(head);
    [1, 0.9, 0.96, 0.6].forEach((length, i) => {
      const line = document.createElement("div");
      line.style.cssText = `height:10px;width:${length * 100}%;margin-top:12px;background:${s.fg};transform-origin:0 50%`;
      paper.body.appendChild(line);
      R.tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.14, ease: "power2.out" }, a[1] + i * 0.06);
    });
    s.add(paper.el);
    W.open(paper, s.t0);
    const put = words(s, ["put", "a", "number"], { w: 720 });
    put.forEach((word, i) => fx.slam(word, a[i + 2], 1.4, 0.16));
    fx.show(mono(s, "on the floor", { w: 520, font: "mono" }), b[0]);
    const number = W.cards(s, ["#"], [BLUE], { size: 190 })[0];
    W.open(number, a[4]);
    R.tl.to(number.el, { y: 190, rotation: -9, duration: 0.4, ease: "bounce.out" }, b[2]);
    W.cursor(s, [{ t: s.t0, x: 880, y: 1230 }, { t: a[4], on: number.el, click: true }]);
  });

  // "OpenAI at $50 billion, / thought it was more"
  shot([7, 8], true, (s) => {
    const a = s.times(7);
    const b = s.times(8);
    const revenue = W.table("openai.revenue", [["annualized", "$50B"], ["estimate", "$70B"]], { w: 700, dark: true });
    revenue.el.style.fontSize = "40px";
    s.add(revenue.el);
    W.open(revenue, s.t0);
    fx.show(revenue.rows[0], s.t0);
    fx.show(revenue.rows[1], b[0]);
    const money = W.cards(s, ["$", "5", "0", "B"], [BLUE, BLUE, BLUE, ORANGE], { size: 190, dark: true });
    money.forEach((card, i) => W.open(card, a[i]));
    fx.show(mono(s, "thought it was more", { w: 660, font: "mono" }), b[0]);
    const bar = W.progress("vs estimate", a[0], s.cap(8).end, { w: 700, to: 71, label: "50 of 70", color: BLUE, dark: true });
    s.add(bar.el);
  });

  // "70 was the estimate, / 20 short of the score" — the line the song is built around.
  shot([9, 10], false, (s) => {
    const a = s.times(9);
    const b = s.times(10);
    W.ascii(s, 9);
    const estimate = W.cards(s, ["70"], [s.fg], { size: 230 })[0];
    W.open(estimate, s.t0);
    fx.show(mono(s, "was the estimate", { w: 560, font: "mono" }), a[1]);
    const gap = W.cards(s, ["-20"], [RED], { size: 290 })[0];
    W.open(gap, b[0]);
    fx.shake(s.punch, b[0] + 0.04, 22);
    const short = words(s, ["short", "of", "the", "score"], { w: 780 });
    short.forEach((word, i) => fx.slam(word, b[i + 1], 1.3, 0.14));
    W.cursor(s, [{ t: s.t0, on: estimate.el, dx: 150, dy: 60 }, { t: b[0], on: gap.el, dx: 170, dy: 80, click: true }]);
  });

  // "Count it like Anthropic counts, / 20 out the door"
  shot([11, 12], true, (s) => {
    const a = s.times(11);
    const b = s.times(12);
    const sheet = W.table("count.sh", [["$ count --like anthropic", ""], ["estimate", "70"], ["annualized", "50"], ["gap", "-20", RED]], { w: 760, dark: true });
    sheet.el.style.fontSize = "38px";
    s.add(sheet.el);
    W.open(sheet, s.t0);
    [a[0], a[2], a[3], a[4]].forEach((time, i) => fx.show(sheet.rows[i], time));
    const twenty = W.cards(s, ["20"], [RED], { size: 240, dark: true })[0];
    W.open(twenty, b[0]);
    fx.show(mono(s, "out the door", { w: 560 }), b[1]);
    R.tl.to(twenty.el, { x: 1200, rotation: 14, duration: 0.3, ease: "power3.in" }, b[3]);
  });

  // "Nvidia down near 3%, / Intel down 5"
  shot([13, 14], false, (s) => {
    const a = s.times(13);
    const b = s.times(14);
    W.ascii(s, 13);
    fx.show(mono(s, "nvidia", { w: 420 }), a[0]);
    const nvidia = W.cards(s, ["-3%"], [RED], { size: 150, title: "nvda.glyph" })[0];
    W.open(nvidia, a[3]);
    fx.show(mono(s, "intel", { w: 350 }), b[0]);
    const intel = W.cards(s, ["-5%"], [RED], { size: 150, title: "intc.glyph" })[0];
    W.open(intel, b[2]);
    fx.shake(s.punch, b[2] + 0.04, 14);
    const chart = W.chart("chips.chart", FALL, s.t0, s.t1 - 0.1, { w: 760, h: 130, color: RED });
    s.add(chart.el);
    W.open(chart, s.t0);
    W.cursor(s, [{ t: s.t0, x: 860, y: 430 }, { t: a[3], on: nvidia.el, dx: 150, click: true }, { t: b[2], on: intel.el, dx: 150, click: true }]);
  });

  // "Chips were all in, / now the chips took a dive"
  shot([15, 16], true, (s) => {
    const a = s.times(15);
    const b = s.times(16);
    const chips = W.cards(s, ["c", "h", "i", "p", "s"], [BLUE, ORANGE], { size: 150, dark: true });
    chips.forEach((card, i) => W.open(card, s.t0 + i * 0.04));
    fx.slam(mono(s, "all in", { w: 440 }), a[3], 1.4, 0.16);
    const now = words(s, ["now", "the", "chips"], { w: 600, font: "mono" });
    now.forEach((word, i) => fx.show(word, b[i]));
    fx.slam(mono(s, "took a dive", { w: 760, color: RED }), b[3], 1.5, 0.2);
    chips.forEach((card, i) => R.tl.to(card.el, { y: 1400, rotation: (i % 2 ? 1 : -1) * 26, duration: 0.5, ease: "power2.in" }, b[5] + i * 0.04));
  });
})();
