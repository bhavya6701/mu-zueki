// 2026-10-08, the windows look. The hook: four shots, one per line. It opens the reel (lines 1 to 4)
// and returns near the end (lines 31 to 34) with the paper and terminal grounds swapped.
(function () {
  const { fx, COLOR, win: W } = R;
  const RED = COLOR.red;
  const GREEN = "#2E9E5B";
  const FALL = [10, 9.6, 9.7, 9, 8.6, 8.8, 7.9, 7.4, 7];

  // Bold lower-case monospace row; `o.font: "mono"` gives the light weight.
  const mono = (s, text, o) => s.row(text, Object.assign({ font: "monoBold", upper: false }, o));
  const words = (s, list, o) => s.words(list, Object.assign({ font: "monoBold", upper: false }, o));
  const shot = (caps, dark, build, more) =>
    R.shot(Object.assign({ caps, ground: dark ? "term" : "paper", look: "windows" }, more), build);

  // "Thursday, chips sell, Nasdaq fell"
  function thursday(n, dark) {
    shot([n], dark, (s) => {
      const t = s.times(n);
      W.ascii(s, n);
      W.stack(s, "thursday", 3, s.t0, 0.08, { w: 520 });
      const chips = words(s, ["chips", "sell"], { w: 640 });
      fx.slam(chips[0], t[1], 1.4, 0.18);
      fx.slam(chips[1], t[2], 1.4, 0.18);
      const chart = W.chart("nasdaq.chart", FALL, t[3], s.cap(n).end + 0.3, { w: 760, h: 180, color: RED, dark });
      s.add(chart.el);
      W.open(chart, t[3] - 0.06);
      fx.slam(mono(s, "nasdaq fell", { w: 700, color: RED }), t[4], 1.5, 0.2);
      fx.shake(s.punch, t[4] + 0.04, 14);
      W.cursor(s, [{ t: s.t0, x: 860, y: 1240 }, { t: t[3] - 0.06, on: chart.bar, click: true }, { t: s.t1 - 0.05, x: 900, y: 1180 }]);
    });
  }

  // "345 points, rang that bell"
  function points(n, dark) {
    shot([n], dark, (s) => {
      const t = s.times(n);
      const digits = W.cards(s, ["3", "4", "5"], [RED], { size: 250, dark });
      digits.forEach((card, i) => W.open(card, t[0] + i * 0.07));
      fx.show(mono(s, "points", { w: 380, font: "mono" }), t[1]);
      fx.slam(mono(s, "rang that bell", { w: 660 }), t[2], 1.4, 0.2);
      const log = W.table("close.log", [["nasdaq", "-345.35", RED], ["s&p 500", "-0.5%", RED], ["s&p close", "7,765.36"]], { w: 640, dark });
      log.el.style.fontSize = "36px";
      s.add(log.el);
      W.open(log, s.cap(n).end);
      W.type(log, s.cap(n).end, 0.1);
      // The bell: the cursor hits the last digit and all three ring.
      digits.forEach((card, i) => {
        [9, -7, 5, -3, 0].forEach((angle, k) => R.tl.to(card.el, { rotation: angle, duration: 0.07, ease: "sine.inOut" }, t[4] + i * 0.03 + k * 0.07));
      });
      W.cursor(s, [{ t: s.t0, x: 880, y: 1200 }, { t: t[4], on: digits[2].el, click: true }]);
    });
  }

  // "Dow up 52, hard to tell"
  function dow(n, dark) {
    shot([n], dark, (s) => {
      const t = s.times(n);
      W.ascii(s, n);
      const board = W.table("index.board", [["nasdaq", "-345.35", RED], ["s&p 500", "-0.5%", RED], ["dow", "+51.77", GREEN]], { w: 760, dark });
      board.el.style.fontSize = "46px";
      s.add(board.el);
      W.open(board, s.t0);
      W.type(board, s.t0, 0.08);
      const up = words(s, ["dow", "up", "52"], { w: 720 });
      up.forEach((word, i) => fx.slam(word, t[i], 1.4, 0.18));
      up[2].style.color = GREEN;
      fx.show(mono(s, "hard to tell", { w: 520, font: "mono" }), t[3]);
      // A switch that cannot make up its mind.
      const toggle = W.frame("direction", { pad: 14, dark });
      toggle.body.style.cssText += "display:flex;gap:14px;font-size:44px";
      const pills = ["up", "down"].map((name) => {
        const pill = document.createElement("span");
        pill.textContent = name;
        pill.style.cssText = "padding:4px 26px;border:3px solid currentColor";
        toggle.body.appendChild(pill);
        return pill;
      });
      s.add(toggle.el);
      W.open(toggle, t[3] - 0.05);
      const flips = [t[3], t[4], t[5], t[5] + 0.08, t[5] + 0.16, t[5] + 0.24];
      const on = { backgroundColor: s.fg, color: s.bg };
      const off = { backgroundColor: "transparent", color: s.fg };
      R.tl.set(pills[0], on, s.t0);
      flips.forEach((time, i) => {
        R.tl.set(pills[i % 2], off, time);
        R.tl.set(pills[(i + 1) % 2], on, time);
      });
      W.cursor(s, [{ t: s.t0, x: 860, y: 420 }, { t: t[3], on: toggle.body, click: true }, { t: t[4], on: toggle.body, dx: 40, click: true }, { t: t[5], on: toggle.body, dx: -30, click: true }]);
    });
  }

  // "Chips sell, chips sell, Nasdaq fell": sell orders pile up as windows, then the index drops.
  function chipsSell(n, dark) {
    shot([n], dark, (s) => {
      const t = s.times(n);
      const spacer = document.createElement("div");
      spacer.style.height = "500px";
      s.add(spacer);
      const last = t[t.length - 1];
      for (let i = 0; i < 6; i++) {
        const order = W.frame(`chip${i + 1}.exe`, { w: 420, dark, pad: 14 });
        order.body.textContent = "sell";
        order.body.style.cssText += `font-size:64px;font-weight:800;color:${RED}`;
        s.put(order.el, 330 + i * 72, 400 + i * 76);
        W.open(order, s.t0 + (i * (last - s.t0)) / 6);
      }
      fx.slam(mono(s, "nasdaq fell", { w: 760, color: RED }), last, 1.5, 0.2);
      fx.shake(s.punch, last + 0.04, 18);
      const bar = W.progress("selling.exe", s.t0, s.cap(n).end, { w: 700, label: "sell orders", color: RED, dark });
      s.add(bar.el);
    });
  }

  R.day = { mono, words, shot, RED, GREEN, FALL, hook: (n, dark) => [thursday, points, dow, chipsSell].forEach((make, i) => make(n + i, i % 2 ? !dark : dark)) };

  // Opening pass: lines 1 to 4, starting on paper.
  R.day.hook(1, false);
})();
