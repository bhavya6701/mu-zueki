// The hook: four shots, one per line. It opens the reel and returns near the end with the grounds
// swapped and more going on. `n` is the lyric line number, so both passes follow their own sung times.
(function () {
  const { fx, COLOR } = R;
  const SWARM = ["coin", "bill", "calendar", "bell", "fed", "down", "cross", "coin", "bill", "down", "bell", "coin"];

  // "Wednesday, win streak, now it's done"
  function wednesday(n, ground) {
    R.shot({ caps: [n], ground, lines: 1 }, (s) => {
      const day = s.scribble("Wednesday", { size: 300, seed: 3 });
      day.draw(s.t0, 0.3, s.t1);
      const [win, streak] = s.words(["WIN", "STREAK"], { w: 840 });
      fx.slam(win, s.w(n, 1));
      fx.slam(streak, s.w(n, 2));
      const done = s.row("now it's done", { w: 520, font: "text" });
      fx.rise(done, s.w(n, 3));
      R.mark(win.parentNode, s.w(n, 5), { weight: 22 });
      fx.shake(s.punch, s.w(n, 5), 14);
      s.carry(s.put(s.pix("calendar", 13), 850, 400, 9), s.t0 + 0.04);
    });
  }

  // "Dow down 341"
  function dowDown(n, ground, swarm) {
    R.shot({ caps: [n], ground }, (s) => {
      const [dow, down] = s.words(["DOW", "DOWN"], { w: 760 });
      fx.slam(dow, s.w(n, 0));
      fx.side(down, s.w(n, 1), -1);
      const number = s.row("341", { w: 864, max: 470, color: COLOR.red });
      fx.slam(number, s.w(n, 2), 2.6, 0.34);
      fx.count(number, s.w(n, 2), 0, 341, 0.3, (v) => String(Math.round(v)));
      fx.shake(s.punch, s.w(n, 2) + 0.05, 26);
      if (!swarm) s.whip(number, s.w(n, 2), s.fg);
      const points = s.row("-341.41 points", { w: 520, font: "text" });
      fx.rise(points, s.cap(n).end);
      const chart = R.chart(-1, 14, 10, COLOR.red, 21);
      s.add(chart.el);
      chart.bars.forEach((bar, i) => fx.show(bar, s.cap(n).end + 0.05 + i * 0.06));

      if (!swarm) return;
      // The icons scatter, get sucked into the number as it lands, then burst back out.
      const random = R.rng(41);
      SWARM.forEach((name, i) => {
        const angle = (i / SWARM.length) * Math.PI * 2 + random() * 0.4;
        const x = Math.cos(angle) * (330 + random() * 150);
        const y = Math.sin(angle) * (430 + random() * 220);
        const icon = s.put(s.pix(name, 9 + Math.round(random() * 4)), 540, 780);
        const hit = s.w(n, 2);
        R.tl.fromTo(
          icon,
          { x: 0, y: 0, scale: 0, rotation: random() * 90 - 45 },
          { x, y, scale: 1, rotation: random() * 40 - 20, duration: 0.3, ease: "back.out(1.6)" },
          s.t0 + 0.04 + i * 0.025,
        );
        R.tl.to(icon, { x: 0, y: 0, scale: 0, duration: 0.2, ease: "power3.in" }, hit - 0.2);
        R.tl.to(icon, { x: x * 1.25, y: y * 1.2, scale: 1.15, duration: 0.4, ease: "power4.out" }, hit + 0.06);
        R.tl.to(icon, { rotation: "+=" + (random() * 50 - 25), y: "+=" + (40 + random() * 60), duration: s.t1 - hit - 0.46, ease: "none" }, hit + 0.46);
      });
    });
  }

  // "Yields hit a 24-year high"
  function yieldsHigh(n, ground) {
    R.shot({ caps: [n], ground }, (s) => {
      fx.slam(s.row("YIELDS", { w: 620 }), s.w(n, 0));
      fx.rise(s.row("hit a", { w: 200, font: "text" }), s.w(n, 1));
      const years = s.scribble("24-year", { size: 240, seed: 9, color: COLOR.red });
      years.draw(s.w(n, 3), 0.34, s.t1);
      const high = s.row("HIGH", { w: 864, max: 290 });
      fx.squash(high, s.w(n, 4));
      fx.shake(s.punch, s.w(n, 4) + 0.04, 16);
      const chart = R.chart(1, 14, 10, s.fg, 33);
      s.add(chart.el);
      const step = (s.w(n, 4) - s.t0) / chart.bars.length;
      chart.bars.forEach((bar, i) => fx.show(bar, s.t0 + 0.05 + i * step));
    });
  }

  // "Streak is done, 341"
  function streakDone(n, ground) {
    R.shot({ caps: [n], ground }, (s) => {
      const words = s.words(["STREAK", "IS", "DONE"], { w: 864 });
      words.forEach((word, i) => fx.slam(word, s.w(n, i)));
      R.mark(words[0].parentNode, s.w(n, 2) + 0.05, { weight: 20 });
      const number = s.row("341", { w: 900, max: 520, color: COLOR.red });
      fx.slam(number, s.w(n, 3), 3.2, 0.36);
      fx.shake(s.punch, s.w(n, 3) + 0.05, 30);
      s.rain("coin", 11, 12, s.cap(n).end - 0.1, s.t1 - s.cap(n).end, n);
    });
  }

  R.hook = { wednesday, dowDown, yieldsHigh, streakDone };

  // Opening pass: lines 1 to 4.
  wednesday(1, "light");
  dowDown(2, "dark", false);
  yieldsHigh(3, "light");
  streakDone(4, "dark");
})();
