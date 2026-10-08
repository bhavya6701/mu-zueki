// Verse 3, lines 17 to 24: the Fed minutes, ending on the line the whole song is built around.
(function () {
  const { fx, COLOR } = R;

  // "2 p.m., Fed minutes hit / read every line"
  R.shot({ caps: [17, 18], ground: "light" }, (s) => {
    const clock = PIX.clock(13);
    s.add(clock.el);
    gsap.set(clock.hour, { rotation: 60 }); // two o'clock
    fx.pop(clock.el, s.t0, 0.2);
    fx.slam(s.row("2 PM", { w: 460 }), s.t0 + 0.04);
    const minutes = s.words(["FED", "MINUTES"], { w: 864 });
    fx.slam(minutes[0], s.t0 + 0.1);
    fx.slam(minutes[1], s.t0 + 0.16);
    const hit = s.row("HIT", { w: 420, color: COLOR.red });
    fx.slam(hit, s.w(17, 4), 2.4);
    s.whip(hit, s.w(17, 4), s.fg);
    fx.shake(s.punch, s.w(17, 4) + 0.04, 22);
    // "read every line": the lines of the document fill in.
    const page = document.createElement("div");
    page.style.cssText = "display:flex;flex-direction:column;gap:12px;width:620px";
    [1, 0.86, 0.94, 0.7].forEach((length, i) => {
      const line = document.createElement("div");
      line.style.cssText = `height:14px;width:${length * 100}%;background:${s.fg};transform-origin:0 50%`;
      page.appendChild(line);
      R.tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.14, ease: "power2.out" }, s.w(18, 0) + i * 0.07);
    });
    s.add(page);
    s.carry(s.put(s.pix("fed", 10), 880, 420, 6), s.t0 + 0.06);
  });

  // "All 12 backed the hike / quarter point, they signed"
  R.shot({ caps: [19, 20], ground: "dark" }, (s) => {
    const votes = document.createElement("div");
    votes.style.cssText = "display:grid;grid-template-columns:repeat(6,110px);gap:14px 18px;justify-items:center";
    const ticks = Array.from({ length: 12 }, () => votes.appendChild(s.pix("tick", 10)));
    s.add(votes);
    ticks.forEach((tick, i) => fx.pop(tick, s.t0 + i * 0.024, 0.14));
    const tally = s.row("12-0", { w: 620, max: 300 });
    fx.slam(tally, s.w(19, 4), 2.2);
    fx.shake(s.punch, s.w(19, 4) + 0.04, 18);
    const quarter = s.words(["QUARTER", "POINT"], { w: 820 });
    fx.slam(quarter[0], s.w(20, 0));
    fx.slam(quarter[1], s.w(20, 1) + 0.12);
    const hike = s.row("+0.25% to 3.75-4.00%", { w: 600, font: "text", cls: "pill" });
    hike.style.background = COLOR.red;
    hike.style.color = COLOR.white;
    fx.pop(hike, s.w(20, 1) + 0.24, 0.22);
    const signed = s.scribble("signed", { size: 230, seed: 20 });
    signed.draw(s.w(20, 2), 0.3, s.t1);
  });

  // "Most see one more raise / before the year-end chime"
  R.shot({ caps: [21, 22], ground: "light" }, (s) => {
    fx.rise(s.row("most see", { w: 380, font: "text" }), s.t0, 0.16);
    const more = s.words(["ONE", "MORE"], { w: 820 });
    fx.slam(more[0], s.t0 + 0.12);
    fx.slam(more[1], s.w(21, 3));
    fx.squash(s.row("RAISE", { w: 760, color: COLOR.red }), s.w(21, 4));
    fx.rise(s.row("before year-end", { w: 560, font: "text" }), s.w(22, 0), 0.2);
    const bell = s.pix("bell", 13);
    s.add(bell);
    fx.pop(bell, s.w(22, 2), 0.2);
    // The chime: the bell swings on the word, into the beat of silence.
    const chime = s.w(22, 3);
    [22, -16, 11, -6, 0].forEach((angle, i) =>
      R.tl.to(bell, { rotation: angle, duration: 0.09, ease: "sine.inOut", transformOrigin: "50% 0%" }, chime - 0.18 + i * 0.09),
    );
  });

  // "They gave us the minutes / but they never gave the time" — nothing else on screen.
  R.shot({ caps: [23, 24], ground: "dark", caption: false }, (s) => {
    const clock = PIX.clock(9);
    s.add(clock.el);
    R.tl.fromTo(clock.minute, { rotation: 0 }, { rotation: 360 * 5, duration: s.t1 - s.t0, ease: "power1.in" }, s.t0);
    R.tl.fromTo(clock.hour, { rotation: 60 }, { rotation: 60 + 150, duration: s.t1 - s.t0, ease: "power1.in" }, s.t0);
    const gave = s.words(["they", "gave", "us", "the"], { w: 560, font: "text" });
    gave.forEach((word, i) => fx.rise(word, s.w(23, i), 0.14));
    const minutes = s.row("MINUTES", { w: 864 });
    fx.slam(minutes, s.w(23, 4), 2);
    s.guides(minutes, s.w(23, 4), 0.26);
    const never = s.words(["but", "they", "never", "gave", "the"], { w: 660, font: "text" });
    never.forEach((word, i) => fx.rise(word, s.w(24, i), 0.14));
    const time = s.row("TIME", { w: 864, max: 400, color: COLOR.red });
    fx.slam(time, s.w(24, 5), 3, 0.36);
    s.whip(time, s.w(24, 5), COLOR.white);
    R.tl.to(s.punch, { scale: 1.14, duration: 0.3, ease: "power4.out" }, s.w(24, 5));
    fx.shake(s.punch, s.w(24, 5) + 0.05, 24);
  });
})();
