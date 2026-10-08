// Verse 2, lines 5 to 16: six quick shots, the ground flipping on each.
(function () {
  const { fx, COLOR } = R;

  // "One day past the records / and the floor starts creaking"
  R.shot({ caps: [5, 6], ground: "light", lines: 1 }, (s) => {
    fx.rise(s.row("one day past the", { w: 500, font: "text" }), s.w(5, 0));
    const records = s.row("RECORDS", { w: 864 });
    fx.slam(records, s.w(5, 4));
    const floor = s.words(["FLOOR", "STARTS", "CREAKING"], { w: 760 });
    floor.forEach((word, i) => fx.rise(word, s.w(6, i + 2), 0.2));
    s.ring(floor[2], s.w(6, 4) + 0.06, COLOR.red);
    // The crack runs under the word, then the word gives way.
    R.mark(records.parentNode, s.w(6, 2), { at: 1.02, color: s.fg, weight: 9, duration: 0.3, seed: 12 });
    R.tl.to(records, { rotation: -5, y: 34, duration: 0.22, ease: "power4.out", transformOrigin: "0% 100%" }, s.w(6, 4));
    fx.shake(s.punch, s.w(6, 4), 12);
  });

  // "S&P and Dow / 5-day streaks, done streaking"
  R.shot({ caps: [7, 8], ground: "dark" }, (s) => {
    const tags = s.words(["S&P 500", "DOW"], { w: 800, cls: "tag" });
    fx.slam(tags[0], s.w(7, 0));
    fx.slam(tags[1], s.w(7, 2));
    // Five green days, then all five crossed out.
    const days = document.createElement("div");
    days.style.cssText = "display:flex;gap:26px";
    const cells = [0, 1, 2, 3, 4].map(() => {
      const cell = document.createElement("div");
      cell.style.cssText = "position:relative;width:110px;height:100px;display:flex;align-items:center;justify-content:center";
      const tick = cell.appendChild(s.pix("tick", 11));
      const cross = cell.appendChild(s.pix("cross", 12));
      cross.style.position = "absolute";
      days.appendChild(cell);
      return { tick, cross };
    });
    s.add(days);
    cells.forEach(({ tick, cross }, i) => {
      fx.pop(tick, s.w(8, 0) + i * 0.035, 0.18);
      R.tl.set(tick, { opacity: 0 }, s.w(8, 2) + i * 0.03);
      fx.pop(cross, s.w(8, 2) + i * 0.03, 0.18);
    });
    const done = s.row("DONE", { w: 560, color: COLOR.red });
    fx.slam(done, s.w(8, 2), 2.2);
    fx.shake(s.punch, s.w(8, 2) + 0.04, 18);
    // "streaking": the two indices streak off the frame.
    R.tl.to(tags[0].parentNode, { x: 1300, skewX: -22, duration: 0.34, ease: "power3.in" }, s.w(8, 3));
  });

  // "10-year yield / above 5.3%, peaking"
  R.shot({ caps: [9, 10], ground: "light" }, (s) => {
    fx.rise(s.row("10-year yield", { w: 560, font: "text" }), s.w(9, 0), 0.2);
    const rate = s.row("5.3%", { w: 820, max: 400, color: COLOR.red });
    fx.slam(rate, s.w(10, 1), 2);
    fx.count(rate, s.w(10, 1), 4.6, 5.3, 0.26, (v) => v.toFixed(1) + "%");
    fx.squash(s.row("PEAKING", { w: 700 }), s.w(10, 2));
    const peak = s.row("5.365% intraday", { w: 520, font: "text" });
    fx.rise(peak, s.cap(10).end + 0.1);
    [[170, 400, 0], [930, 380, 0.08], [880, 1190, 0.16]].forEach(([x, y, delay], i) => {
      const arrow = s.put(s.pix("up", 12 + i * 2), x, y);
      fx.pop(arrow, s.w(10, 1) + delay, 0.2);
      R.tl.to(arrow, { y: -150, duration: s.t1 - s.w(10, 1) - delay - 0.2, ease: "none" }, s.w(10, 1) + delay + 0.2);
    });
  });

  // "Highest since 2002 / that's the bond market speaking"
  R.shot({ caps: [11, 12], ground: "dark" }, (s) => {
    fx.rise(s.row("highest since", { w: 500, font: "text" }), s.w(11, 0), 0.2);
    const year = s.row("2002", { w: 864, max: 380 });
    fx.slam(year, s.w(11, 2), 2);
    fx.count(year, s.w(11, 2), 2026, 2002, 0.34, (v) => String(Math.round(v)));
    const market = s.words(["BOND", "MARKET"], { w: 720 });
    fx.slam(market[0], s.w(12, 2));
    fx.slam(market[1], s.w(12, 3));
    fx.squash(s.row("SPEAKING", { w: 600, color: COLOR.red }), s.w(12, 4));
    fx.pop(s.put(s.pix("calendar", 12), 860, 400, 8), s.w(11, 0) + 0.06);
    s.carry(s.put(s.pix("bill", 12), 240, 1190, -10), s.w(12, 0));
    // The bond market "speaks": a little level meter beside the note.
    const meter = document.createElement("div");
    meter.style.cssText = "display:flex;align-items:center;gap:12px;height:120px";
    s.put(meter, 470, 1190);
    [0.5, 1, 0.7, 0.9, 0.4].forEach((level, i) => {
      const bar = document.createElement("div");
      bar.style.cssText = `width:14px;height:${level * 120}px;background:${COLOR.red}`;
      meter.appendChild(bar);
      R.tl.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: 0.1, ease: "power2.out" }, s.w(12, 4) + i * 0.03);
      R.tl.to(bar, { scaleY: 0.3, duration: 0.09, repeat: 1, yoyo: true, ease: "power1.inOut" }, s.w(12, 4) + 0.14 + i * 0.02);
    });
  });

  // "Small caps took it hardest / Russell down 1.3"
  R.shot({ caps: [13, 14], ground: "light" }, (s) => {
    const small = s.row("small caps", { w: 230, font: "text" });
    small.style.textTransform = "lowercase";
    fx.rise(small, s.w(13, 0), 0.18);
    const took = s.words(["TOOK", "IT"], { w: 600 });
    fx.slam(took[0], s.w(13, 2));
    fx.slam(took[1], s.w(13, 3));
    fx.slam(s.row("HARDEST", { w: 864 }), s.w(13, 4), 2.2);
    fx.shake(s.punch, s.w(13, 4) + 0.04, 16);
    fx.side(s.row("Russell 2000", { w: 520, font: "text", cls: "tag" }), s.w(14, 0), 1, 0.24);
    const drop = s.row("-1.3%", { w: 720, max: 300, color: COLOR.red });
    fx.slam(drop, s.w(14, 2), 2.2);
    s.rain("block", 14, 16, s.w(13, 4), s.t1 - s.w(13, 4), 14);
  });

  // "Borrowing costs more now / nothing here is free"
  R.shot({ caps: [15, 16], ground: "dark" }, (s) => {
    fx.slam(s.row("BORROWING", { w: 864 }), s.w(15, 0));
    const costs = s.words(["COSTS", "MORE", "NOW"], { w: 820 });
    costs.forEach((word, i) => fx.slam(word, s.w(15, i + 1)));
    const coins = document.createElement("div");
    coins.style.cssText = "display:flex;gap:14px";
    const stack = [0, 1, 2, 3, 4, 5].map(() => coins.appendChild(s.pix("coin", 9)));
    s.add(coins);
    stack.forEach((coin, i) => fx.pop(coin, s.w(15, 1) + i * 0.06, 0.2));
    const nothing = s.words(["NOTHING", "HERE", "IS", "FREE"], { w: 864 });
    nothing.forEach((word, i) => fx.rise(word, s.w(16, i), 0.16));
    R.mark(nothing[3], s.w(16, 3) + 0.1, { weight: 16, seed: 16 });
    // The coins leave: nothing is free.
    stack.forEach((coin, i) => R.tl.to(coin, { y: -1500, rotation: 200, duration: 0.5, ease: "power3.in" }, s.cap(16).end + i * 0.05));
  });
})();
