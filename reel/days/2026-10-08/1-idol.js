// 2026-10-08, second version: a sweet idol-pop intro, a beat drop, then hard rap (the circuit look).
// This file: the helpers the day shares, the four intro shots (lines 1 to 4) and the cut to black.
(function () {
  const { fx, cir: C } = R;
  const K = C.idol;
  const { PINK, ROSE, MINT, LEMON, LILAC, CANDY } = C;

  // A plain element with inline CSS.
  const box = (css, parent, text) => {
    const node = document.createElement("div");
    node.style.cssText = css;
    if (parent) parent.appendChild(node);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  // A pastel shot: polka dots, the HUD in pink.
  const idol = (caps, build, more) =>
    R.shot(Object.assign({ caps, ground: "candy", look: "idol" }, more), (s) => {
      K.tone(s);
      C.hud(s, (more && more.chapter) || "00 / IDOL MODE", { sub: "SWEET INTRO" });
      build(s);
    });
  // A hard shot on the ink, flare or bone ground, with the HUD unless more.hud is false.
  const hard = (caps, ground, chapter, build, more) =>
    R.shot(Object.assign({ caps, ground, look: "circuit" }, more), (s) => {
      if (!more || more.hud !== false) C.hud(s, chapter, { live: !(more && more.still) });
      build(s);
    });
  const heavy = (s, text, o) => s.row(text, Object.assign({ font: "heavy" }, o));
  const heavies = (s, list, o) => s.words(list, Object.assign({ font: "heavy" }, o));
  const mono = (s, text, o) => s.row(text, Object.assign({ font: "monoBold", w: 600, gap: 0.5 }, o));
  // Text that sits on speed lines gets a plate of the ground colour behind it.
  const plate = (node, color) => ((node.style.cssText += `;background:${color};padding:0 0.18em`), node);
  R.day = { box, idol, hard, heavy, heavies, mono, plate };

  // "Thursday morning, candy day"
  idol([1], (s) => {
    const t = s.times(1);
    K.sparkles(s, 9, 11);
    // Already on screen in the very first frame, so the reel never opens on an empty ground.
    K.bounce(K.row(s, "Thursday", { w: 820, max: 230 }), s.t0, 0.74);
    K.bounce(K.row(s, "morning", { w: 440, color: ROSE }), t[1]);
    const sweets = box("display:flex;gap:34px");
    const beats = C.beats(s, true);
    ["#FF7DB6", LEMON, MINT].forEach((color, i) => {
      const sweet = sweets.appendChild(K.candy(110, color));
      K.bounce(sweet, t[2] + i * 0.06);
      K.hop(sweet, beats.filter((time, n) => time > t[2] + 0.4 && n % 3 === i));
    });
    s.add(sweets);
    const candy = K.words(s, ["candy", "day"], { w: 720 });
    K.bounce(candy[0], t[2]);
    K.bounce(candy[1], t[3] + 0.1);
    K.hearts(s, 6, s.t0 + 0.2, 12);
  });

  // "Shiny chips come out to play"
  idol([2], (s) => {
    const t = s.times(2);
    K.sparkles(s, 10, 21);
    const shiny = K.words(s, ["shiny", "chips"], { w: 780 });
    K.bounce(shiny[0], s.t0, 0.7);
    K.bounce(shiny[1], t[1]);
    const line = box("display:flex;gap:26px");
    const beats = C.beats(s, true);
    [MINT, LILAC, LEMON, "#FFB3D1"].forEach((color, i) => {
      const chip = K.chip(170, color);
      line.appendChild(chip.el);
      K.bounce(chip.el, t[1] + 0.05 + i * 0.09);
      K.hop(chip.el, beats.filter((time, n) => time > t[1] + 0.6 && n % 2 === i % 2), 34);
    });
    s.add(line);
    K.bounce(K.row(s, "come out to play", { w: 740, color: ROSE }), t[2]);
    K.hearts(s, 5, t[2], 22);
  });

  // "$70 billion, yay yay yay"
  idol([3], (s) => {
    C.speed(s, { color: "#FFFFFF", cy: 720, inner: 400, opacity: 0.9, seed: 31, plate: false });
    K.sparkles(s, 6, 33);
    K.bounce(K.row(s, "$70", { w: 800, max: 400 }), s.t0, 0.55);
    K.bounce(K.row(s, "billion", { w: 600 }), s.t0 + 0.12);
    // One "yay!" on each of the next three half beats.
    const beats = C.beats(s, true).filter((time) => time > s.t0 + 0.2);
    [[215, 400, -10], [868, 372, 9], [540, 1195, -4]].forEach(([x, y, tilt], i) => {
      const yay = s.put(C.bubble("yay!", { font: "cute", color: PINK, size: 66 }), x, y, tilt);
      K.bounce(yay, beats[i] !== undefined ? beats[i] : s.t0 + 0.3 + i * 0.28);
    });
    K.hearts(s, 8, s.t0, 32);
  });

  // "Uh-oh, 50, did you say?" The number changes, the colour drains and everything stops moving.
  idol([4], (s) => {
    const t = s.times(4);
    K.sparkles(s, 8, 41, t[1]);
    K.bounce(K.row(s, "uh-oh", { w: 520, color: ROSE }), s.t0, 0.7);
    const cell = box("position:relative;width:800px;height:350px");
    const digits = (text, color) => {
      const node = box(`position:absolute;inset:0;text-align:center;font-family:${R.FONT.cute};font-size:300px;line-height:350px;color:${color}`, cell, text);
      node.className = "idol-text";
      node.setAttribute("data-layout-allow-overlap", "");
      return node;
    };
    const seventy = digits("$70", PINK);
    const fifty = digits("$50", "#3A3A3A");
    s.add(cell);
    fx.show(fifty, t[1]);
    // A flicker between the two before the fifty holds.
    [0, 0.07, 0.14, 0.21].forEach((delay, i) => {
      R.tl.set(seventy, { autoAlpha: i % 2 ? 1 : 0 }, t[1] + delay);
      R.tl.set(fifty, { autoAlpha: i % 2 ? 0 : 1 }, t[1] + delay);
    });
    R.tl.set(seventy, { autoAlpha: 0 }, t[1] + 0.28);
    R.tl.set(fifty, { autoAlpha: 1 }, t[1] + 0.28);
    C.glitch(fifty, t[1], { colors: ["#111111", C.FLARE], amp: 46, dur: 0.3 });
    const chip = K.chip(190, MINT);
    s.add(chip.el);
    K.bounce(chip.el, s.t0 + 0.1);
    chip.shock(t[1]);
    K.bounce(s.put(C.bubble("did you say?", { font: "cute", color: ROSE, size: 50 }), 800, 322, 7), t[2]);
    fx.slam(s.put(C.sfx("ガーン", { size: 110, color: "#4A4A4A", stroke: "#FFFFFF" }), 235, 1190, -12), t[1] + 0.05, 1.8, 0.18);
    R.tl.fromTo(s.punch.parentNode, { filter: "grayscale(0)" }, { filter: "grayscale(1)", duration: 0.7, ease: "power2.out" }, t[1]);
  });

  // The beat cuts out: the pastel picture collapses to a line and goes dark, like a set switched off.
  R.shot({ at: TIMELINE.captions[3].end, ground: "ink", look: "circuit", caption: false }, (s) => {
    const glow = s.put(box(`width:1000px;height:10px;background:${CANDY}`), 540, 780);
    const life = s.t1 - s.t0;
    R.tl.fromTo(glow, { scaleY: 130, scaleX: 1 }, { scaleY: 1, duration: life * 0.35, ease: "power3.in" }, s.t0);
    R.tl.to(glow, { scaleX: 0, duration: life * 0.4, ease: "power2.in" }, s.t0 + life * 0.35);
  });
})();
