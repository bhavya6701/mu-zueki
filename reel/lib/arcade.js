// The "arcade" look: the week as an arcade game played on a CRT. Every shot is a world inside the screen
// (scanlines, pixel grid, glass sheen and vignette over everything, after the registry's yt-screen-warp),
// a white flash opens each new world, pixelfx effects (lib/pfx.js) land on the hits, and numbers are set in
// a glowing pixel face. Shots carry look: "arcade". Reference: reel/templates/arcade.md.
(function () {
  const T = window.TIMELINE;
  const NS = "http://www.w3.org/2000/svg";
  const NAVY = "#0B0D1A";
  const RED = "#FF3B3B";
  const GOLD = "#FFC94A";
  const GREEN = "#47E06A";
  const WHITE = "#F4F2EE";
  const CYAN = "#6BE3FF";
  const A = (R.arc = { NAVY, RED, GOLD, GREEN, WHITE, CYAN });
  const tl = () => R.tl;

  R.GROUND.navy = { bg: NAVY, fg: WHITE };
  Object.assign(R.FONT, { pixel: '"Silkscreen"' });
  Object.assign(R.WEIGHT, { pixel: 700 });
  if (!R.fontFaces.includes('700 100px "Silkscreen"')) R.fontFaces.push('700 100px "Silkscreen"');

  function el(tag, cls, parent, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (parent) parent.appendChild(node);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // A Gemini plate (reel/media/WEEK/plates/NAME.jpg) as the shot's world, drifting slowly the whole shot.
  // o: from/to (scale), y (px of drift, negative is up), filter (a CSS filter for the grade), x (px offset).
  A.plate = function (s, name, o = {}) {
    const img = el("img", "arc-plate");
    img.src = `media/${T.episode}/plates/${name}.jpg`;
    if (o.filter) img.style.filter = o.filter;
    s.layer.insertBefore(img, s.layer.firstChild);
    tl().fromTo(img, { scale: o.from ?? 1.1, x: o.x ?? 0, y: 0 },
      { scale: o.to ?? 1.02, x: o.x ?? 0, y: o.y ?? -50, duration: s.t1 - s.t0 + 0.3, ease: "none" }, s.t0);
    return img;
  };

  // A full-frame flash (white by default) that opens a world or marks a hit.
  A.flash = function (s, t, color = "#FFFFFF", duration = 0.22, peak = 1) {
    // a flash that opens a world is a transition; one on a hit sounds with the hit
    if (Math.abs(t - s.t0) < 0.02) R.cue(t, "whoosh", { weight: 0.7 * peak, dur: duration });
    const f = el("div", "arc-flash", s.box);
    f.style.background = color;
    f.style.opacity = 0;
    tl().set(f, { opacity: peak }, t);
    tl().to(f, { opacity: 0, duration, ease: "power2.out" }, t + 0.001);
    return f;
  };

  // A dark wash over a plate or footage so the type reads (strength 0..1), heavier at the middle band.
  A.scrim = function (s, strength = 0.55) {
    const d = el("div", "arc-scrim", s.layer);
    d.style.opacity = strength;
    return d;
  };

  // A row of glowing pixel type. o as for s.row, plus color and glow (px). Returns the word spans.
  A.words = function (s, list, o = {}) {
    const spans = s.words(list, Object.assign({ font: "pixel", w: 760, max: 300 }, o));
    spans.forEach((sp) => {
      sp.classList.add("arc-glow");
      if (o.color) sp.style.color = o.color;
    });
    return spans;
  };
  A.row = (s, text, o) => A.words(s, [text], o)[0];

  // Small widely spaced type under a big figure, as in the reference's year cards.
  A.sub = function (s, text, o = {}) {
    const span = s.row(text, Object.assign({ font: "mono", w: 600, max: 34, upper: true }, o));
    span.classList.add("arc-sub");
    if (o.color) span.style.color = o.color;
    return span;
  };

  // RGB-split type (after the registry's rgb-glitch-text): a red and a cyan copy tear away from the solid
  // one for `duration` seconds from t, in steps, then snap back into register.
  A.glitch = function (s, text, t, o = {}) {
    // never wider than the stage (inside the safe margins)
    const size = Math.min(o.size || 150, (100 * (o.w || 760)) / R.measure(text, "pixel"));
    const box = el("div", "arc-glitch");
    box.style.fontSize = size + "px";
    const red = el("span", "arc-g-red", box, text);
    const cyan = el("span", "arc-g-cyan", box, text);
    const solid = el("strong", "", box, text);
    solid.style.color = o.color || WHITE;
    // the two ghosts sit on the solid copy on purpose
    [box, red, cyan, solid].forEach((n) => n.setAttribute("data-layout-allow-overlap", ""));
    const row = s.add(box);
    const random = R.rng(o.seed || 9);
    const reach = o.reach || 18;
    const steps = Math.round((o.duration ?? 0.35) / 0.045);
    for (let i = 0; i < steps; i++) {
      const at = t + i * 0.045;
      tl().set(red, { x: (random() - 0.3) * reach, y: (random() - 0.5) * reach * 0.3 }, at);
      tl().set(cyan, { x: -(random() - 0.3) * reach, y: (random() - 0.5) * reach * 0.3 }, at);
      tl().set(solid, { x: (random() - 0.5) * reach * 0.25, skewX: (random() - 0.5) * 12 }, at);
    }
    R.cue(t, "glitch", { weight: 0.9, dur: steps * 0.045 });
    const end = t + steps * 0.045;
    tl().set([red, cyan, solid], { x: 0, y: 0, skewX: 0 }, end);
    return { row, box, solid };
  };

  // A price line that draws itself downward (after the registry's decline-chart): from t over `duration`,
  // across the frame between y0 and y1 (frame px), jagged but always falling, with a hot dot at its head.
  A.decline = function (s, t, o = {}) {
    const o2 = Object.assign({ y0: 560, y1: 1180, n: 22, duration: 0.9, color: RED, seed: 21 }, o);
    const random = R.rng(o2.seed);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "arc-line");
    svg.setAttribute("viewBox", "0 0 1080 1920");
    const pts = [];
    for (let i = 0; i <= o2.n; i++) {
      const u = i / o2.n;
      const trend = o2.y0 + (o2.y1 - o2.y0) * Math.pow(u, 1.6);
      pts.push([60 + u * 960, trend + (i % 2 ? -1 : 1) * random() * 46]);
    }
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = document.createElementNS(NS, "path");
    area.setAttribute("d", d + ` L1020 1920 L60 1920 Z`);
    area.setAttribute("fill", o2.color);
    area.setAttribute("opacity", "0.14");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", o2.color);
    path.setAttribute("stroke-width", "10");
    path.setAttribute("stroke-linejoin", "miter");
    path.setAttribute("stroke-dasharray", "4000");
    path.setAttribute("stroke-dashoffset", "4000");
    svg.appendChild(area);
    svg.appendChild(path);
    s.layer.appendChild(svg);
    tl().to(path, { strokeDashoffset: 0, duration: o2.duration, ease: "power2.in" }, t);
    tl().fromTo(area, { opacity: 0 }, { opacity: 0.14, duration: o2.duration, ease: "none" }, t);
    return { svg, end: pts[pts.length - 1] };
  };

  // A retro notification card (after uiverse.io's level-up notification by MijailVillegas): a title band,
  // a value, and a bar that fills. Slides in from the side in steps at t.
  A.toast = function (s, t, title, value, o = {}) {
    const card = el("div", "arc-toast");
    el("div", "arc-toast-title", card, title);
    el("div", "arc-toast-value", card, value);
    const bar = el("div", "arc-toast-bar", card);
    const fill = el("div", "arc-toast-fill", bar);
    if (o.note) el("div", "arc-toast-note", card, o.note);
    s.add(card);
    R.cue(t + 0.12, "whoosh", { weight: 0.6, dur: 0.24 });
    R.cue(t + 0.85, "tick", { weight: 0.8 });
    tl().fromTo(card, { x: 1100 }, { x: 0, duration: 0.24, ease: "steps(4)" }, t);
    tl().fromTo(fill, { scaleX: 0 }, { scaleX: o.fill ?? 1, duration: 0.6, ease: "steps(8)" }, t + 0.25);
    return card;
  };

  // The screen switching off: the picture collapses to a bright line, then to a dot, then black.
  A.crtOff = function (s, t) {
    R.cue(t + 0.13, "switch", { weight: 1.1 });
    const line = el("div", "arc-crt-line", s.box);
    line.style.visibility = "hidden";
    tl().to(s.punch, { scaleY: 0.006, duration: 0.14, ease: "power3.in" }, t);
    tl().set(line, { visibility: "visible" }, t + 0.13);
    tl().set(s.box, { backgroundColor: "#000000" }, t + 0.13);
    tl().fromTo(line, { scaleX: 1, opacity: 1 }, { scaleX: 0.01, duration: 0.16, ease: "power2.in" }, t + 0.14);
    tl().to(line, { opacity: 0, duration: 0.12 }, t + 0.32);
  };
})();
