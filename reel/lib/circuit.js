// The "circuit" look: a black, red-orange and bone world with a HUD frame, concentric rings, manga speed
// lines, tile grids and glitch-sliced type, and its pastel twin for a sweet intro (R.cir.idol).
// Shots carry look: "circuit" (grounds ink, flare, bone) or look: "idol" (ground candy).
(function () {
  const T = window.TIMELINE;
  const NS = "http://www.w3.org/2000/svg";
  const { fx } = R;
  const INK = "#060606";
  const BONE = "#EFECE6";
  const FLARE = "#FF3B14";
  const WHITE = "#FFFFFF";
  const CYAN = "#7FE3F0";
  const GREEN = "#3DDC84";
  const PINK = "#E0147A";
  const ROSE = "#B0145A";
  const CANDY = "#FFE0EC";
  const MINT = "#9BE8D4";
  const LEMON = "#FFE66D";
  const LILAC = "#CDBBFF";
  const C = (R.cir = { INK, BONE, FLARE, WHITE, CYAN, GREEN, PINK, ROSE, CANDY, MINT, LEMON, LILAC });

  Object.assign(R.GROUND, {
    ink: { bg: INK, fg: BONE },
    flare: { bg: FLARE, fg: INK },
    bone: { bg: BONE, fg: INK },
    candy: { bg: CANDY, fg: ROSE },
  });
  Object.assign(R.FONT, { heavy: '"Dela Gothic One"', cute: '"Mochiy Pop One"' });
  Object.assign(R.WEIGHT, { heavy: 400, cute: 400 });
  R.fontFaces.push('400 100px "Dela Gothic One"', ['400 100px "Dela Gothic One"', "ドンッゴガーキラ"], '400 100px "Mochiy Pop One"');

  function el(tag, className, parent, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function svg(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }
  // Decoration is allowed to sit on top of other things.
  const loose = (node) => (node.setAttribute("data-layout-allow-overlap", ""), node);

  // The beats (and, with `half`, the half beats) that fall inside a shot.
  C.beats = function (s, half) {
    const out = [];
    T.beats.forEach((beat) => [beat, half ? beat + T.seconds_per_beat / 2 : null].forEach((time) => time !== null && time >= s.t0 && time < s.t1 && out.push(time)));
    return out;
  };

  // ---- the frame ----
  // The HUD around every shot: title, running timecode, corner marks, a level strip that jumps on the
  // beat and the chapter label. It sits outside the camera, so it holds still while the shot pushes in.
  C.hud = function (s, chapter, options) {
    const o = Object.assign({ title: "MU-ZUEKI", sub: "TAPE " + T.episode.replace(/-/g, "."), live: true }, options);
    const hud = loose(el("div", "hud", s.box));
    hud.style.color = o.color || s.fg;
    const place = (node, css) => ((node.style.cssText += css), node);
    place(el("div", "", hud), "left:52px;top:248px").innerHTML = `${o.title}<small>${o.sub}</small>`;
    const clock = place(el("div", "", hud), "right:52px;top:248px;text-align:right");
    const time = el("span", "", clock, "T+00.00");
    el("small", "", clock, `${T.bpm.toFixed(1)} BPM`);
    const tick = { v: s.t0 };
    const stamp = () => (time.textContent = "T+" + tick.v.toFixed(2).padStart(5, "0"));
    stamp();
    R.tl.to(tick, { v: s.t1, duration: s.t1 - s.t0, ease: "none", onUpdate: stamp }, s.t0);
    [["left:30px;top:236px", "3px 0 0 3px"], ["right:30px;top:236px", "3px 3px 0 0"], ["left:30px;top:1500px", "0 0 3px 3px"], ["right:30px;top:1500px", "0 3px 3px 0"]].forEach(
      ([at, widths]) => place(el("div", "hud-corner", hud), `${at};border-width:${widths}`),
    );
    el("div", "hud-ticks", hud);
    place(el("div", "", hud), "right:52px;top:1474px;text-align:right").textContent = chapter;
    const strip = el("div", "hud-bars", hud);
    const random = R.rng(Math.round(s.t0 * 977) + 3);
    const bars = Array.from({ length: 26 }, () => el("i", "", strip));
    gsap.set(bars, { scaleY: 0.12 });
    if (o.live) {
      C.beats(s, true).forEach((time, n) => bars.forEach((bar, i) => R.tl.set(bar, { scaleY: Math.max(0.1, (n % 2 ? 0.55 : 1) * (0.25 + random() * 0.75) * (1 - i / 60)) }, time)));
    }
    return hud;
  };

  // ---- type ----
  // A burst of horizontal slice glitches on a word: bands of it jump sideways in two colours, then settle.
  C.glitch = function (node, t, options) {
    const o = Object.assign({ dur: 0.26, colors: [CYAN, FLARE], amp: 38, steps: 5 }, options);
    const random = R.rng(Math.round(t * 1000) + 11);
    const copies = o.colors.map((color) => {
      const copy = loose(node.cloneNode(true));
      copy.style.cssText += `;position:absolute;left:0;top:0;margin:0;color:${color};visibility:hidden`;
      copy.setAttribute("aria-hidden", "true");
      node.appendChild(copy);
      return copy;
    });
    for (let i = 0; i < o.steps; i++) {
      const at = t + (i * o.dur) / o.steps;
      copies.forEach((copy, k) => {
        const top = random() * 78;
        const band = 10 + random() * 26;
        R.tl.set(copy, { autoAlpha: 1, x: (random() - 0.5) * 2 * o.amp * (k ? -1 : 1), clipPath: `inset(${top}% -20% ${Math.max(0, 100 - top - band)}% -20%)` }, at);
      });
    }
    copies.forEach((copy) => R.tl.set(copy, { autoAlpha: 0 }, t + o.dur));
    return node;
  };
  // Letters knocked off their baseline, for a word that says it is not straight.
  C.bend = function (word, amount) {
    const letters = Array.from(word.textContent);
    word.textContent = "";
    letters.forEach((letter, i) => {
      const span = el("span", "", word, letter);
      span.style.cssText = `display:inline-block;transform:translateY(${(Math.sin(i * 1.7) * amount).toFixed(1)}px) rotate(${(Math.sin(i * 1.7 + 1) * 9).toFixed(1)}deg)`;
    });
    return word;
  };
  // A sound-effect word in the manga manner: heavy, outlined, tilted where it is put.
  C.sfx = function (text, options) {
    const o = Object.assign({ size: 150, color: FLARE, stroke: INK, weight: 0.12 }, options);
    const node = loose(el("div", "cir-sfx", null, text));
    node.style.cssText = `font-size:${o.size}px;color:${o.color};-webkit-text-stroke:${o.weight}em ${o.stroke}`;
    return node;
  };
  // A speech bubble.
  C.bubble = function (text, options) {
    const o = Object.assign({ size: 54, color: INK, bg: WHITE, font: "heavy", pad: "0.7em 1.3em" }, options);
    const node = loose(el("div", "cir-bubble"));
    node.style.cssText = `font-family:${R.FONT[o.font]};font-size:${o.size}px;color:${o.color};background:${o.bg};border:6px solid ${o.color};padding:${o.pad}`;
    loose(el("span", "", node, text));
    const tail = el("i", "", node);
    tail.style.cssText = `background:${o.bg};border-right:6px solid ${o.color};border-bottom:6px solid ${o.color}`;
    return node;
  };

  // ---- shapes ----
  // Concentric dashed rings with a ring of tick marks. Returns { el, layers } for C.spin.
  C.rings = function (size, options) {
    const o = Object.assign({ color: BONE, accent: FLARE, count: 5, seed: 2 }, options);
    const random = R.rng(o.seed);
    const root = svg("svg", { width: size, height: size, viewBox: "-104 -104 208 208" });
    root.style.cssText = "display:block;flex-shrink:0;overflow:visible";
    const layers = [];
    for (let i = 1; i <= o.count; i++) {
      const group = svg("g", {}, root);
      const outer = i === o.count;
      svg("circle", { r: (100 * i) / o.count - (outer ? 0 : 5), fill: "none", stroke: outer ? o.accent : o.color, "stroke-width": outer ? 3.4 : 1.3,
        "stroke-dasharray": outer ? "none" : `${(2 + random() * 12).toFixed(1)} ${(1.5 + random() * 7).toFixed(1)}` }, group);
      layers.push(group);
    }
    const ticks = svg("g", {}, root);
    let d = "";
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r0 = i % 6 ? 90 : 84;
      d += `M${(Math.cos(a) * r0).toFixed(2)} ${(Math.sin(a) * r0).toFixed(2)}L${(Math.cos(a) * 96).toFixed(2)} ${(Math.sin(a) * 96).toFixed(2)}`;
    }
    svg("path", { d, stroke: o.color, "stroke-width": 1.1, fill: "none" }, ticks);
    layers.push(ticks);
    return { el: root, layers };
  };
  // Turn the rings against each other from t0 to t1.
  C.spin = (rings, t0, t1, speed) =>
    rings.layers.forEach((group, i) =>
      R.tl.fromTo(group, { rotation: 0 }, { rotation: (i % 2 ? -1 : 1) * (speed || 40) * (t1 - t0) * (1 + i * 0.25), duration: t1 - t0, ease: "none", svgOrigin: "0 0" }, t0),
    );
  // Rings with something set in the middle: a square holding both. Returns { el, rings }.
  C.badge = function (size, content, options) {
    const box = el("div");
    box.style.cssText = `position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;flex-shrink:0`;
    const rings = C.rings(size, options);
    rings.el.style.cssText += ";position:absolute;left:0;top:0";
    box.appendChild(rings.el);
    if (content) {
      content.style.position = "relative";
      box.appendChild(loose(content));
    }
    return { el: box, rings };
  };
  // Manga speed lines radiating from a point, behind everything in the shot. They twitch on the beat.
  C.speed = function (s, options) {
    const o = Object.assign({ color: INK, cx: 540, cy: 780, inner: 330, count: 120, seed: 4, opacity: 1, plate: true }, options);
    const random = R.rng(o.seed);
    const root = svg("svg", { width: 1080, height: 1920 });
    root.style.cssText = `position:absolute;left:0;top:0;opacity:${o.opacity}`;
    const group = svg("g", {}, root);
    let d = "";
    for (let i = 0; i < o.count; i++) {
      const a = (i / o.count) * Math.PI * 2 + random() * 0.04;
      const half = 0.003 + random() * 0.014;
      const r0 = o.inner * (0.85 + random() * 0.6);
      const point = (angle, r) => `${(o.cx + Math.cos(angle) * r).toFixed(1)} ${(o.cy + Math.sin(angle) * r).toFixed(1)}`;
      d += `M${point(a, r0)}L${point(a - half, 1700)}L${point(a + half, 1700)}Z`;
    }
    svg("path", { d, fill: o.color }, group);
    s.layer.insertBefore(root, s.layer.firstChild);
    if (o.plate !== false) {
      // The running caption gets a panel of its own, so it is not read through the lines.
      const panel = el("div", "", s.box);
      panel.style.cssText = `position:absolute;left:70px;right:70px;top:1312px;height:160px;z-index:2;background:${s.bg};border:6px solid ${o.color}`;
    }
    C.beats(s, true).forEach((time) => R.tl.set(group, { rotation: (random() - 0.5) * 7, svgOrigin: `${o.cx} ${o.cy}` }, time));
    return root;
  };
  // A three-armed swirl: a storm seen from above.
  C.swirl = function (size, color) {
    const root = svg("svg", { width: size, height: size, viewBox: "-100 -100 200 200" });
    root.style.cssText = "display:block;flex-shrink:0";
    for (let k = 0; k < 3; k++) {
      svg("path", { d: "M0 0A44 44 0 0 1 0 -88", fill: "none", stroke: color, "stroke-width": 30, "stroke-linecap": "round", transform: `rotate(${k * 120})` }, root);
    }
    return root;
  };
  // A sine line `cycles` long, wider than its window so it can be slid sideways. Returns { el, line }.
  C.wave = function (width, height, color, cycles, weight) {
    const box = el("div");
    box.style.cssText = `width:${width}px;height:${height}px;overflow:hidden;flex-shrink:0`;
    const root = svg("svg", { width: width * 2, height }, box);
    root.style.display = "block";
    let d = "";
    for (let x = 0; x <= width * 2; x += 8) d += `${x ? "L" : "M"}${x} ${(height / 2 + Math.sin((x / width) * cycles * Math.PI * 2) * (height / 2 - (weight || 6))).toFixed(1)}`;
    svg("path", { d, fill: "none", stroke: color, "stroke-width": weight || 6, "stroke-linejoin": "round" }, root);
    return { el: box, line: root };
  };
  // A row of bars stepping down (dir -1) or up (dir 1). Returns { el, bars }.
  C.bars = function (count, width, height, color, dir, seed) {
    const random = R.rng(seed || 6);
    const box = el("div");
    box.style.cssText = `display:flex;align-items:flex-end;gap:${Math.round(width / count / 4)}px;width:${width}px;height:${height}px;flex-shrink:0`;
    const bars = [];
    for (let i = 0; i < count; i++) {
      const along = dir > 0 ? i / (count - 1) : 1 - i / (count - 1);
      const bar = el("div", "", box);
      bar.style.cssText = `flex:1;height:${Math.round(Math.max(0.06, Math.min(1, along * 0.85 + 0.1 + (random() - 0.5) * 0.22)) * 100)}%;background:${color}`;
      bars.push(bar);
    }
    return { el: box, bars };
  };

  // ---- tiles ----
  // One square tile. kinds: dot, ring, half, wave, bar, void, solid.
  C.tile = function (kind, cell, seed) {
    const tile = el("div", "cir-tile");
    tile.style.cssText = `width:${cell}px;height:${cell}px;background:${INK};box-shadow:inset 0 0 0 2px rgba(239,236,230,0.28)`;
    if (kind === "dot") {
      tile.style.background = FLARE;
      el("div", "", tile).style.cssText = `width:46%;height:46%;border-radius:50%;background:${INK}`;
    } else if (kind === "ring") {
      tile.appendChild(C.rings(cell * 0.84, { count: 3, seed: seed || 3 }).el);
    } else if (kind === "half") {
      tile.style.backgroundImage = `radial-gradient(${BONE} 30%, transparent 33%)`;
      tile.style.backgroundSize = `${Math.round(cell / 9)}px ${Math.round(cell / 9)}px`;
    } else if (kind === "wave") {
      tile.appendChild(C.wave(cell, cell * 0.5, BONE, 2.5, 4).el);
    } else if (kind === "bar") {
      tile.appendChild(C.bars(9, cell * 0.8, cell * 0.7, BONE, seed % 2 ? 1 : -1, seed).el);
    } else if (kind === "solid") {
      tile.style.background = BONE;
    }
    return tile;
  };
  // A grid of tiles. kinds is a list, one per cell, row by row. Returns { el, tiles }.
  C.grid = function (cols, kinds, cell, gap) {
    const box = el("div");
    box.style.cssText = `display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:${gap === undefined ? 10 : gap}px;flex-shrink:0`;
    const tiles = kinds.map((kind, i) => box.appendChild(C.tile(kind, cell, i + 1)));
    return { el: box, tiles };
  };

  // ---- the pastel twin ----
  const K = (C.idol = {});
  // Polka-dot screentone drifting behind the shot.
  K.tone = function (s) {
    const tone = el("div");
    tone.style.cssText = "position:absolute;inset:-100px;background-image:radial-gradient(#FFC4DC 21%, transparent 23%), radial-gradient(#FFF3B8 15%, transparent 17%);background-size:64px 64px, 64px 64px;background-position:0 0, 32px 32px";
    s.layer.insertBefore(tone, s.layer.firstChild);
    R.tl.fromTo(tone, { x: 0, y: 0 }, { x: 64, y: -64, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    return tone;
  };
  const shape = (size, d, color, view) => {
    const root = svg("svg", { width: size, height: size, viewBox: view || "-50 -50 100 100" });
    root.style.cssText = "display:block;flex-shrink:0;overflow:visible";
    svg("path", { d, fill: color, stroke: WHITE, "stroke-width": 5, "stroke-linejoin": "round", "paint-order": "stroke" }, root);
    return root;
  };
  K.star = (size, color) => shape(size, "M0 -50Q7 -7 50 0Q7 7 0 50Q-7 7 -50 0Q-7 -7 0 -50Z", color || WHITE);
  K.heart = (size, color) => shape(size, "M0 40C-58 -2 -42 -46 -20 -46C-8 -46 0 -36 0 -28C0 -36 8 -46 20 -46C42 -46 58 -2 0 40Z", color || PINK);
  // Stars in the margins that twinkle on the beat until `until`.
  K.sparkles = function (s, count, seed, until) {
    const random = R.rng(seed);
    const colors = [WHITE, LEMON, WHITE, LILAC];
    const beats = C.beats(s, true).filter((time) => time < (until || s.t1));
    for (let i = 0; i < count; i++) {
      const side = random() < 0.5;
      const x = side ? (random() < 0.5 ? 60 + random() * 150 : 870 + random() * 150) : 80 + random() * 920;
      const y = side ? 300 + random() * 960 : random() < 0.5 ? 290 + random() * 110 : 1180 + random() * 110;
      const star = s.put(K.star(40 + random() * 70, colors[i % colors.length]), x, y, random() * 40 - 20);
      gsap.set(star, { scale: 0.5 + random() * 0.5 });
      beats.forEach((time, n) => (n + i) % 2 === 0 && R.tl.fromTo(star, { scale: 1.25 }, { scale: 0.55, duration: T.seconds_per_beat * 0.9, ease: "power2.out", immediateRender: false }, time));
    }
  };
  // Hearts that float up from the bottom of the frame from t.
  K.hearts = function (s, count, t, seed) {
    const random = R.rng(seed);
    for (let i = 0; i < count; i++) {
      const heart = s.put(K.heart(50 + random() * 60, [PINK, "#FF7DB6", "#FF4F9A"][i % 3]), 90 + random() * 900, 1320, random() * 30 - 15);
      const start = t + random() * 0.9;
      fx.show(heart, start);
      R.tl.fromTo(heart, { y: 0, x: 0 }, { y: -1150 - random() * 300, x: (random() - 0.5) * 160, duration: 1.5 + random() * 0.9, ease: "power1.out" }, start);
    }
  };
  // A little microchip with a face. mood: "smile" or "shock". Returns { el, mouth }.
  K.chip = function (size, color, mood) {
    const chip = el("div");
    chip.style.cssText = `position:relative;width:${size}px;height:${size}px;flex-shrink:0`;
    const part = (css) => (el("div", "", chip).style.cssText = "position:absolute;" + css);
    const line = "#7A1E4B";
    for (let i = 0; i < 3; i++) {
      part(`left:-9%;top:${22 + i * 22}%;width:14%;height:9%;background:${line};border-radius:4px`);
      part(`right:-9%;top:${22 + i * 22}%;width:14%;height:9%;background:${line};border-radius:4px`);
    }
    part(`inset:4%;background:${color || MINT};border:${Math.round(size * 0.055)}px solid ${line};border-radius:22%`);
    part(`left:27%;top:36%;width:11%;height:14%;background:${line};border-radius:50%`);
    part(`right:27%;top:36%;width:11%;height:14%;background:${line};border-radius:50%`);
    part("left:14%;top:52%;width:15%;height:9%;background:#FF9CC4;border-radius:50%");
    part("right:14%;top:52%;width:15%;height:9%;background:#FF9CC4;border-radius:50%");
    const smile = el("div", "", chip);
    smile.style.cssText = `position:absolute;left:38%;top:52%;width:24%;height:14%;border:${Math.round(size * 0.05)}px solid ${line};border-top:0;border-radius:0 0 60% 60%`;
    const shock = el("div", "", chip);
    shock.style.cssText = `position:absolute;left:42%;top:56%;width:16%;height:18%;border:${Math.round(size * 0.05)}px solid ${line};border-radius:50%;visibility:hidden`;
    return {
      el: chip,
      // The smile becomes a round "o" at t.
      shock(t) {
        R.tl.set(smile, { autoAlpha: 0 }, t);
        R.tl.set(shock, { autoAlpha: 1 }, t);
      },
    };
  };
  // A wrapped sweet.
  K.candy = function (size, color) {
    const root = svg("svg", { width: size * 1.7, height: size, viewBox: "-85 -50 170 100" });
    root.style.cssText = "display:block;flex-shrink:0;overflow:visible";
    const paint = { fill: color || "#FF7DB6", stroke: WHITE, "stroke-width": 6, "stroke-linejoin": "round", "paint-order": "stroke" };
    svg("path", Object.assign({ d: "M-36 0L-82 -34L-70 0L-82 34Z" }, paint), root);
    svg("path", Object.assign({ d: "M36 0L82 -34L70 0L82 34Z" }, paint), root);
    svg("circle", Object.assign({ r: 38 }, paint), root);
    svg("path", { d: "M-20 -30Q8 -6 -16 32M6 -36Q30 -4 12 34", fill: "none", stroke: WHITE, "stroke-width": 7, "stroke-linecap": "round" }, root);
    return root;
  };
  // Rows of cute outlined type. Same arguments as s.words; returns the word elements.
  K.words = function (s, list, options) {
    const words = s.words(list, Object.assign({ font: "cute", upper: false, color: PINK, lh: 1.2 }, options));
    words.forEach((word) => word.classList.add("idol-text"));
    return words;
  };
  K.row = (s, text, options) => K.words(s, [text], options)[0];
  // Something bounces in.
  K.bounce = (node, t, from) => R.tl.fromTo(node, { scale: from === undefined ? 0.2 : from, opacity: from === undefined ? 0 : 1 }, { scale: 1, opacity: 1, duration: 0.36, ease: "back.out(2.6)" }, t);
  // Something hops on each of the given beats.
  K.hop = (node, beats, height) =>
    beats.forEach((time) => {
      R.tl.to(node, { y: -(height || 28), duration: 0.09, ease: "power2.out" }, time);
      R.tl.to(node, { y: 0, duration: 0.2, ease: "bounce.out" }, time + 0.09);
    });
})();
