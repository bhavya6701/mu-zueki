// The "stitch" look: the whole 9:16 frame as an embroidered cloth, after the appliqué and embroidery of
// Kutch and Kathiawad. Felt grounds, cut cloth pieces with a running stitch round their edge, mirror work,
// sawtooth borders, and stitched lettering. Every picture is drawn in one 1080x1920 SVG per shot, so
// things are placed in frame coordinates. Shots carry look: "stitch".
(function () {
  const T = window.TIMELINE;
  const NS = "http://www.w3.org/2000/svg";
  const BLACK = "#17130F";
  const RED = "#9A1F22";
  const MADDER = "#C2301F";
  const INDIGO = "#1F2C73";
  const BLUE = "#3E63C9";
  const MUSTARD = "#D9A21B";
  const ORANGE = "#E0661A";
  const CREAM = "#F0E4C9";
  const WHITE = "#FBF6EA";
  const GREEN = "#2F7A46";
  const PINK = "#D1437A";
  const SKIN = "#C68A5C";
  const GLASS = "#BFD6DC";
  const S = (R.st = { BLACK, RED, MADDER, INDIGO, BLUE, MUSTARD, ORANGE, CREAM, WHITE, GREEN, PINK, SKIN });

  // Each ground with the cloths of its border: the edge strip, the bands above and below, the caption strip.
  const CLOTH = {
    "s-black": { bg: BLACK, fg: CREAM, edge: RED, band: INDIGO, strip: RED, tooth: [MUSTARD, MADDER] },
    "s-red": { bg: RED, fg: CREAM, edge: BLACK, band: BLACK, strip: BLACK, tooth: [MUSTARD, CREAM] },
    "s-indigo": { bg: INDIGO, fg: CREAM, edge: MADDER, band: BLACK, strip: BLACK, tooth: [MUSTARD, MADDER] },
    "s-mustard": { bg: MUSTARD, fg: BLACK, edge: RED, band: INDIGO, strip: BLACK, tooth: [RED, CREAM] },
    "s-orange": { bg: ORANGE, fg: BLACK, edge: BLACK, band: INDIGO, strip: BLACK, tooth: [MUSTARD, CREAM] },
    "s-cream": { bg: CREAM, fg: BLACK, edge: RED, band: BLACK, strip: BLACK, tooth: [MADDER, MUSTARD] },
  };
  Object.keys(CLOTH).forEach((name) => (R.GROUND[name] = { bg: CLOTH[name].bg, fg: CLOTH[name].fg }));
  Object.assign(R.FONT, { baloo: '"Baloo Bhai 2"' });
  Object.assign(R.WEIGHT, { baloo: 800 });
  R.fontFaces.push('800 100px "Baloo Bhai 2"');

  const mk = (S.mk = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  });
  const circleD = (cx, cy, r) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  const rectD = (x, y, w, h, r = 0) =>
    r ? `M ${x + r} ${y} h ${w - 2 * r} q ${r} 0 ${r} ${r} v ${h - 2 * r} q 0 ${r} ${-r} ${r} h ${-(w - 2 * r)} q ${-r} 0 ${-r} ${-r} v ${-(h - 2 * r)} q 0 ${-r} ${r} ${-r} Z` : `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
  const polyD = (points) => "M " + points.map((p) => p.join(" ")).join(" L ") + " Z";
  Object.assign(S, { circleD, rectD, polyD });

  // The beats (and, with `half`, the half beats) that fall inside a shot.
  S.beats = function (s, half) {
    const out = [];
    T.beats.forEach((beat) => [beat, half ? beat + T.seconds_per_beat / 2 : null].forEach((time) => time !== null && time >= s.t0 && time < s.t1 && out.push(time)));
    return out;
  };

  // ---- cloth ----
  // A group placed at x, y (and scaled); what is drawn inside it is drawn around its own origin.
  // Its `_move` is the group to slide about the frame: that one moves in frame pixels whatever the scale.
  S.at = (parent, x, y, k = 1) => {
    const move = mk("g", {}, mk("g", { transform: `translate(${x} ${y})` }, parent));
    const body = mk("g", { transform: `scale(${k})` }, move);
    body._move = move;
    return body;
  };
  // A cut piece of cloth with a running stitch round its edge. o.thread null leaves the edge bare.
  S.piece = function (parent, d, fill, o) {
    o = Object.assign({ thread: CREAM, sw: 3.5, dash: "10 8" }, o);
    const g = mk("g", {}, parent);
    mk("path", { d, fill }, g);
    if (o.thread) mk("path", { d, fill: "none", stroke: o.thread, "stroke-width": o.sw, "stroke-dasharray": o.dash, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    return g;
  };
  // A line of stitches.
  S.thread = (parent, d, color = CREAM, o) => {
    o = Object.assign({ sw: 4, dash: "12 9" }, o);
    return mk("path", { d, fill: "none", stroke: color, "stroke-width": o.sw, "stroke-dasharray": o.dash, "stroke-linecap": "round", "stroke-linejoin": "round" }, parent);
  };
  // A round mirror sewn down with a ring of thread.
  S.mirror = function (parent, cx, cy, r, thread = MUSTARD) {
    const g = mk("g", {}, parent);
    mk("circle", { cx, cy, r, fill: thread }, g);
    mk("circle", { cx, cy, r: r * 0.86, fill: "none", stroke: BLACK, "stroke-width": r * 0.12, "stroke-dasharray": `${r * 0.16} ${r * 0.16}` }, g);
    mk("circle", { cx, cy, r: r * 0.58, fill: GLASS }, g);
    mk("path", { d: `M ${cx - r * 0.34} ${cy - r * 0.1} q ${r * 0.1} ${-r * 0.3} ${r * 0.4} ${-r * 0.32}`, fill: "none", stroke: WHITE, "stroke-width": r * 0.1, "stroke-linecap": "round" }, g);
    return g;
  };
  // A row of triangles: `n` teeth from x across w, pointing down (dir 1) or up (dir -1) from y.
  S.saw = function (parent, x, y, w, h, n, fills, dir = 1, thread) {
    const g = mk("g", {}, parent);
    const step = w / n;
    const teeth = [];
    for (let i = 0; i < n; i++) teeth.push(S.piece(g, polyD([[x + i * step, y], [x + (i + 1) * step, y], [x + (i + 0.5) * step, y + dir * h]]), fills[i % fills.length], { thread: thread === undefined ? null : thread, sw: 2.5, dash: "7 6" }));
    return { g, teeth };
  };
  // Stitched lettering, centred on x, y and fitted to w wide (never over o.max px high).
  S.text = function (parent, text, x, y, w, o) {
    o = Object.assign({ max: 300, fill: CREAM, thread: null, font: "baloo" }, o);
    const size = Math.min(o.max, (100 * w) / R.measure(text, o.font));
    const node = mk("text", { x, y, "text-anchor": "middle", "dominant-baseline": "central", "font-size": size, fill: o.fill }, parent);
    node.style.fontFamily = R.FONT[o.font];
    node.style.fontWeight = R.WEIGHT[o.font];
    if (o.thread) {
      node.setAttribute("stroke", o.thread);
      node.setAttribute("stroke-width", size * 0.03);
      node.setAttribute("stroke-dasharray", `${size * 0.075} ${size * 0.06}`);
      node.setAttribute("stroke-linecap", "round");
    }
    node.textContent = text;
    return node;
  };
  // A cloth label: a strip with stitched edges and lettering on it. Returns the group.
  S.label = function (parent, text, x, y, w, o) {
    o = Object.assign({ h: 84, fill: BLACK, color: CREAM, thread: MUSTARD }, o);
    const g = mk("g", {}, parent);
    S.piece(g, rectD(x - w / 2, y - o.h / 2, w, o.h, 8), o.fill, { thread: o.thread, sw: 3 });
    S.text(g, text, x, y + 2, w - 44, { max: o.h * 0.62, fill: o.color });
    return g;
  };

  // ---- moves (cut-out animation: pieces are put down, they do not glide) ----
  // GSAP turns a piece about the middle of its own outline when the tween says so.
  const MID = "50% 50%";
  // A piece put down on the cloth: it lands a little crooked and settles.
  S.drop = (node, t, o) => {
    o = Object.assign({ from: -70, turn: 8, dur: 0.26 }, o);
    return R.tl.fromTo(node, { y: o.from, rotation: o.turn, opacity: 0, transformOrigin: MID }, { y: 0, rotation: 0, opacity: 1, duration: o.dur, ease: "back.out(2.2)" }, t);
  };
  S.pop = (node, t, dur = 0.24) => R.tl.fromTo(node, { scale: 0, opacity: 0, transformOrigin: MID }, { scale: 1, opacity: 1, duration: dur, ease: "back.out(2.4)" }, t);
  S.slam = (node, t, from = 1.8, dur = 0.2) => R.tl.fromTo(node, { scale: from, opacity: 0, transformOrigin: MID }, { scale: 1, opacity: 1, duration: dur, ease: "power4.out" }, t);
  S.show = (node, t) => ((node.style.visibility = "hidden"), R.tl.set(node, { autoAlpha: 1 }, t));
  S.hide = (node, t) => R.tl.set(node, { autoAlpha: 0 }, t);
  // A bump on each of `times`.
  S.pulse = (node, times, amount = 0.1, dur = 0.28) => times.forEach((time) => R.tl.fromTo(node, { scale: 1 + amount, transformOrigin: MID }, { scale: 1, duration: dur, ease: "power2.out", immediateRender: false }, time));
  // Stitches that are sewn across from left to right: the node is uncovered over `dur`.
  let clips = 0;
  S.sew = function (node, t, dur, box) {
    const id = "sew" + ++clips;
    const clip = mk("clipPath", { id }, node.ownerSVGElement);
    const rect = mk("rect", { x: box[0], y: box[1], width: 0, height: box[3] }, clip);
    node.setAttribute("clip-path", `url(#${id})`);
    R.tl.fromTo(rect, { attr: { width: 0 } }, { attr: { width: box[2] }, duration: dur, ease: "none" }, t);
  };

  // ---- the cloth itself ----
  // The picture layer of a shot: one SVG the size of the frame, inside the camera.
  S.canvas = (s) => mk("svg", { viewBox: "0 0 1080 1920", width: 1080, height: 1920, style: "position:absolute;left:0;top:0;overflow:visible" }, s.layer);
  // The border sewn round the whole frame, outside the camera so it holds still: an edge strip, a band of
  // mirror work with a hanging toran above, a band of patchwork below, and the strip the caption sits on.
  // The mirrors wink and the patches take turns on the beat.
  S.border = function (s, ground) {
    const c = CLOTH[ground];
    const root = mk("svg", { viewBox: "0 0 1080 1920", width: 1080, height: 1920, style: "position:absolute;left:0;top:0;z-index:2", "data-layout-allow-overlap": "" }, s.box);
    const beats = S.beats(s);
    // top band and toran
    S.piece(root, rectD(0, 0, 1080, 214), c.band, { thread: null });
    S.thread(root, "M 40 196 H 1040", CREAM, { sw: 3, dash: "9 8" });
    const mirrors = [];
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 140;
      S.piece(root, polyD([[x, 62], [x + 52, 114], [x, 166], [x - 52, 114]]), i % 2 ? MADDER : MUSTARD, { thread: CREAM, sw: 2.5, dash: "7 6" });
      mirrors.push(S.mirror(root, x, 114, 24, i % 2 ? MUSTARD : PINK));
    }
    const toran = S.saw(root, 22, 214, 1036, 62, 14, c.tooth, 1, CREAM);
    // caption strip
    S.piece(root, rectD(22, 1306, 1036, 150), c.strip, { thread: null });
    S.thread(root, "M 44 1322 H 1036", MUSTARD, { sw: 3, dash: "9 8" });
    S.thread(root, "M 44 1440 H 1036", MUSTARD, { sw: 3, dash: "9 8" });
    // bottom band
    S.piece(root, rectD(0, 1506, 1080, 414), c.band, { thread: null });
    S.saw(root, 22, 1506, 1036, 46, 14, c.tooth, -1, CREAM);
    S.thread(root, "M 40 1528 H 1040", CREAM, { sw: 3, dash: "9 8" });
    const patches = [];
    const cloths = [MADDER, MUSTARD, GREEN, PINK, BLUE];
    for (let i = 0; i < 5; i++) {
      const x = 62 + i * 196;
      const g = mk("g", {}, root);
      S.piece(g, rectD(x, 1570, 172, 172, 6), cloths[i], { thread: CREAM, sw: 3 });
      if (i % 2) {
        S.piece(g, polyD([[x + 86, 1594], [x + 148, 1656], [x + 86, 1718], [x + 24, 1656]]), BLACK, { thread: MUSTARD, sw: 2.5, dash: "7 6" });
        S.mirror(g, x + 86, 1656, 26, CREAM);
      } else {
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          mk("path", { d: polyD([[x + 86 + Math.cos(a - 0.3) * 22, 1656 + Math.sin(a - 0.3) * 22], [x + 86 + Math.cos(a) * 66, 1656 + Math.sin(a) * 66], [x + 86 + Math.cos(a + 0.3) * 22, 1656 + Math.sin(a + 0.3) * 22]]), fill: k % 2 ? CREAM : BLACK }, g);
        }
        S.mirror(g, x + 86, 1656, 22, BLACK);
      }
      patches.push(g);
    }
    for (let i = 0; i < 3; i++) S.thread(root, `M 40 ${1778 + i * 34} H 1040`, [MUSTARD, CREAM, MADDER][i], { sw: 4, dash: i === 1 ? "4 12" : "16 10" });
    // edge strip
    mk("rect", { x: 11, y: 11, width: 1058, height: 1898, fill: "none", stroke: c.edge, "stroke-width": 22 }, root);
    mk("rect", { x: 30, y: 30, width: 1020, height: 1860, fill: "none", stroke: CREAM, "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, root);
    // life on the beat
    beats.forEach((time, n) => {
      mirrors.forEach((mirror, i) => (i + n) % 2 === 0 && R.tl.fromTo(mirror, { scale: 1.35, transformOrigin: MID }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, time));
      R.tl.fromTo(patches[n % 5], { scale: 1.12, rotation: n % 2 ? 4 : -4, transformOrigin: MID }, { scale: 1, rotation: 0, duration: 0.34, ease: "back.out(3)", immediateRender: false }, time);
      toran.teeth.forEach((tooth, i) => R.tl.fromTo(tooth, { rotation: (i + n) % 2 ? 7 : -7, svgOrigin: `${22 + (i + 0.5) * 74} 214` }, { rotation: 0, duration: 0.4, ease: "sine.out", immediateRender: false }, time));
    });
    return root;
  };

  // ---- motifs ----
  // The sun: a mustard disc in a ring of cloth rays.
  S.sun = function (parent, x, y, r, o) {
    o = Object.assign({ rays: 16, fills: [ORANGE, MADDER], disc: MUSTARD }, o);
    const g = S.at(parent, x, y);
    const rays = mk("g", {}, g);
    for (let i = 0; i < o.rays; i++) {
      const a = (i / o.rays) * Math.PI * 2;
      const w = (Math.PI / o.rays) * 0.8;
      S.piece(rays, polyD([[Math.cos(a - w) * r * 1.02, Math.sin(a - w) * r * 1.02], [Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6], [Math.cos(a + w) * r * 1.02, Math.sin(a + w) * r * 1.02]]), o.fills[i % o.fills.length], { thread: CREAM, sw: 2.5, dash: "7 6" });
    }
    const disc = S.piece(g, circleD(0, 0, r), o.disc, { thread: BLACK, sw: 4 });
    S.thread(g, circleD(0, 0, r * 0.62), MADDER, { sw: 4, dash: "4 12" });
    return { g, rays, disc };
  };
  // The bard: turban, curled moustache, one hand at his ear and one thrown out to the crowd.
  // Drawn around the middle of his face (a head 100 in radius).
  S.bard = function (parent, x, y, k) {
    const g = S.at(parent, x, y, k);
    S.piece(g, "M -215 380 L -130 108 Q 0 70 130 108 L 215 380 Z", WHITE, { thread: MADDER });
    [-70, -24, 24, 70].forEach((px) => S.thread(g, `M ${px} 150 L ${px * 1.6} 372`, MADDER, { sw: 3, dash: "8 9" }));
    S.piece(g, "M -62 96 Q 0 150 62 96 L 46 150 Q 0 190 -46 150 Z", MUSTARD, { thread: BLACK, sw: 2.5 });
    // the arm thrown out
    const arm = mk("g", {}, g);
    S.piece(arm, polyD([[112, 118], [150, 96], [322, 6], [338, 46], [150, 168]]), WHITE, { thread: MADDER });
    S.piece(arm, circleD(344, 14, 34), SKIN, { thread: BLACK, sw: 2.5 });
    // the hand at the ear
    S.piece(g, polyD([[-112, 120], [-152, 104], [-176, -28], [-132, -30], [-120, 60]]), WHITE, { thread: MADDER });
    S.piece(g, circleD(-128, -6, 34), SKIN, { thread: BLACK, sw: 2.5 });
    const head = mk("g", {}, g);
    S.piece(head, circleD(0, 0, 100), SKIN, { thread: BLACK, sw: 3 });
    // turban
    S.piece(head, "M 96 -44 Q 150 10 132 104 Q 112 60 100 -4 Z", MADDER, { thread: MUSTARD, sw: 2.5 });
    S.piece(head, "M -118 -24 Q -136 -160 0 -176 Q 136 -160 118 -24 Q 0 -78 -118 -24 Z", MADDER, { thread: MUSTARD });
    S.thread(head, "M -104 -66 Q 0 -124 104 -66", MUSTARD, { sw: 3.5, dash: "9 8" });
    S.thread(head, "M -82 -110 Q 0 -160 82 -110", MUSTARD, { sw: 3.5, dash: "9 8" });
    S.piece(head, circleD(44, -168, 36), ORANGE, { thread: CREAM, sw: 2.5 });
    const random = R.rng(41);
    for (let i = 0; i < 16; i++) mk("circle", { cx: -90 + random() * 180, cy: -150 + random() * 86, r: 4.5, fill: CREAM }, head);
    // face
    [-38, 38].forEach((ex) => {
      mk("ellipse", { cx: ex, cy: -6, rx: 19, ry: 12, fill: WHITE, stroke: BLACK, "stroke-width": 3 }, head);
      mk("circle", { cx: ex, cy: -6, r: 7, fill: BLACK }, head);
      mk("path", { d: `M ${ex - 24} -30 Q ${ex} -44 ${ex + 24} -30`, fill: "none", stroke: BLACK, "stroke-width": 8, "stroke-linecap": "round" }, head);
    });
    S.thread(head, "M 0 2 L -6 30 L 8 32", BLACK, { sw: 3, dash: "6 6" });
    mk("circle", { cx: 0, cy: -58, r: 7, fill: MADDER }, head);
    const mouth = mk("ellipse", { cx: 0, cy: 70, rx: 26, ry: 15, fill: "#4A0C10", stroke: BLACK, "stroke-width": 3 }, head);
    [-1, 1].forEach((side) => mk("path", { d: `M ${side * 4} 42 Q ${side * 44} 30 ${side * 80} 54 Q ${side * 100} 68 ${side * 96} 40`, fill: "none", stroke: BLACK, "stroke-width": 15, "stroke-linecap": "round" }, head));
    mk("circle", { cx: 100, cy: 34, r: 11, fill: MUSTARD, stroke: BLACK, "stroke-width": 2.5 }, head);
    return { g, head, mouth, arm };
  };
  // The bard speaks: his mouth opens on each of `times` and his arm beats the air.
  S.speak = function (bard, times) {
    times.forEach((time, i) => {
      R.tl.fromTo(bard.mouth, { scaleY: 1.5, scaleX: 1.15, svgOrigin: "0 70" }, { scaleY: 0.45, scaleX: 1, duration: 0.2, ease: "power2.in", immediateRender: false }, time);
      R.tl.fromTo(bard.arm, { rotation: i % 2 ? -9 : 7, svgOrigin: "130 130" }, { rotation: 0, duration: 0.3, ease: "back.out(3)", immediateRender: false }, time);
    });
  };
  // A dhol with its two sticks; beat(times) strikes it.
  S.dhol = function (parent, x, y, k) {
    const g = S.at(parent, x, y, k);
    const drum = mk("g", {}, g);
    S.piece(drum, rectD(-120, -70, 240, 140, 46), ORANGE, { thread: BLACK });
    S.thread(drum, "M -96 -58 L -58 58 L -20 -58 L 18 58 L 56 -58 L 94 58", CREAM, { sw: 4, dash: "10 7" });
    [-1, 1].forEach((side) => S.piece(drum, `M ${side * 108} -74 q ${side * 44} 74 0 148 q ${side * -20} -74 0 -148 Z`, CREAM, { thread: MADDER, sw: 3 }));
    const sticks = [-1, 1].map((side) => {
      const stick = mk("g", {}, g);
      mk("path", { d: `M ${side * 150} -40 L ${side * 236} -150`, stroke: CREAM, "stroke-width": 13, "stroke-linecap": "round" }, stick);
      mk("circle", { cx: side * 150, cy: -40, r: 13, fill: MUSTARD }, stick);
      return stick;
    });
    return {
      g, drum,
      beat(times) {
        times.forEach((time, i) => {
          const side = i % 2 ? 1 : -1;
          R.tl.fromTo(sticks[i % 2], { rotation: side * -26, svgOrigin: `${side * 236} -150` }, { rotation: 0, duration: 0.12, ease: "power3.in", immediateRender: false }, time - 0.1);
          R.tl.fromTo(drum, { scaleX: 1.07, scaleY: 0.9, transformOrigin: MID }, { scaleX: 1, scaleY: 1, duration: 0.24, ease: "elastic.out(1,0.4)", immediateRender: false }, time);
        });
      },
    };
  };
  // A small cloth figure standing on its feet at the origin (about 150 tall). arms: "up" or "down".
  S.person = function (parent, x, y, k, o) {
    o = Object.assign({ cloth: WHITE, turban: MADDER, arms: "down", thread: BLACK }, o);
    const g = S.at(parent, x, y, k);
    [-14, 4].forEach((lx) => mk("rect", { x: lx, y: -42, width: 10, height: 42, fill: BLACK }, g));
    const hands = o.arms === "up" ? [[-48, -152], [48, -152]] : [[-44, -58], [44, -58]];
    hands.forEach(([hx, hy], i) => mk("path", { d: `M ${i ? 20 : -20} -98 L ${hx} ${hy}`, stroke: o.cloth, "stroke-width": 13, "stroke-linecap": "round" }, g));
    S.piece(g, polyD([[-36, -40], [36, -40], [20, -106], [-20, -106]]), o.cloth, { thread: o.thread, sw: 2.5, dash: "6 5" });
    mk("circle", { cx: 0, cy: -124, r: 20, fill: SKIN, stroke: BLACK, "stroke-width": 2 }, g);
    if (o.turban) mk("path", { d: "M -23 -128 Q 0 -168 23 -128 Q 0 -140 -23 -128 Z", fill: o.turban }, g);
    return g;
  };
  // A horse in profile facing right, about 330 wide, standing on y = 130. gallop(times) throws its legs.
  S.horse = function (parent, x, y, k, o) {
    o = Object.assign({ body: MADDER, saddle: MUSTARD, thread: CREAM, flip: false }, o);
    const outer = S.at(parent, x, y, k);
    // The bob of the gallop has its own group, so sliding the horse along and lifting it never fight.
    const bob = mk("g", {}, outer);
    const g = mk("g", o.flip ? { transform: "scale(-1 1)" } : {}, bob);
    const legs = [[78, 1], [48, -1], [-58, 1], [-88, -1]].map(([lx, phase]) => {
      const leg = mk("g", {}, g);
      S.piece(leg, rectD(lx - 11, 28, 22, 96, 6), o.body, { thread: o.thread, sw: 2.5, dash: "7 6" });
      mk("rect", { x: lx - 12, y: 114, width: 24, height: 16, rx: 4, fill: BLACK }, leg);
      leg._x = lx;
      leg._phase = phase;
      return leg;
    });
    const tail = S.piece(g, "M -108 -34 Q -186 -40 -172 78 Q -146 26 -110 -2 Z", BLACK, { thread: o.thread, sw: 2.5, dash: "7 6" });
    S.piece(g, rectD(-112, -52, 224, 104, 50), o.body, { thread: o.thread });
    const neck = mk("g", {}, g);
    S.piece(neck, polyD([[52, -36], [104, -152], [152, -130], [116, -2]]), o.body, { thread: o.thread });
    S.piece(neck, polyD([[96, -160], [150, -182], [208, -130], [198, -104], [150, -118], [116, -120]]), o.body, { thread: o.thread });
    [[[108, -160], [102, -206], [128, -174]], [[130, -172], [138, -214], [152, -178]]].forEach((ear) => mk("path", { d: polyD(ear), fill: o.body, stroke: o.thread, "stroke-width": 2 }, neck));
    S.thread(neck, "M 62 -52 L 108 -150", BLACK, { sw: 7, dash: "5 9" });
    mk("circle", { cx: 170, cy: -142, r: 6, fill: BLACK }, neck);
    S.thread(neck, "M 150 -176 L 164 -114 M 200 -112 L 132 -40", MUSTARD, { sw: 3, dash: "7 6" });
    S.piece(g, rectD(-48, -62, 96, 76, 8), o.saddle, { thread: BLACK, sw: 3 });
    [-22, 0, 22].forEach((mx) => S.mirror(g, mx, -24, 9, PINK));
    S.saw(g, -48, 14, 96, 16, 6, [PINK, CREAM], 1);
    return {
      g: outer._move, body: g, legs, tail, neck,
      // Two poses, thrown and gathered, changing on each of `times`; the body lifts with the throw.
      gallop(times, reach = 34) {
        times.forEach((time, n) => {
          legs.forEach((leg) => R.tl.set(leg, { rotation: (n % 2 ? 1 : -1) * leg._phase * reach, svgOrigin: `${leg._x} 34` }, time));
          R.tl.fromTo(bob, { y: n % 2 ? -16 : 0 }, { y: n % 2 ? 0 : -16, duration: 0.16, ease: "sine.out", immediateRender: false }, time);
          R.tl.set(tail, { rotation: n % 2 ? 12 : -8, svgOrigin: "-108 -20" }, time);
        });
      },
      stand(time) {
        legs.forEach((leg) => R.tl.set(leg, { rotation: 0, svgOrigin: `${leg._x} 34` }, time));
        R.tl.set(bob, { y: 0 }, time);
      },
    };
  };
  // A crown.
  S.crown = (parent, x, y, k, fill = MUSTARD) => {
    const g = S.at(parent, x, y, k);
    S.piece(g, "M -50 30 L -58 -22 L -28 4 L 0 -40 L 28 4 L 58 -22 L 50 30 Z", fill, { thread: BLACK, sw: 2.5, dash: "6 5" });
    [[-58, -24], [0, -42], [58, -24]].forEach(([cx, cy]) => mk("circle", { cx, cy, r: 8, fill: MADDER, stroke: BLACK, "stroke-width": 2 }, g));
    return g;
  };
  // A palace arch (a jharokha) standing on y, w wide and h tall.
  S.arch = (parent, x, y, w, h, fill, o) =>
    S.piece(parent, `M ${x - w / 2} ${y} V ${y - h * 0.6} Q ${x - w / 2} ${y - h * 0.86} ${x - w * 0.2} ${y - h * 0.9} Q ${x} ${y - h * 1.08} ${x + w * 0.2} ${y - h * 0.9} Q ${x + w / 2} ${y - h * 0.86} ${x + w / 2} ${y - h * 0.6} V ${y} Z`, fill, o);
  // A signal tower standing on its origin, 430 tall: two cloth legs, stitched braces, a mirror on top and
  // three pairs of signal arcs. fall(t, side) brings it down; quiet(t, dur) takes the arcs away one by one.
  S.tower = function (parent, x, y, k, o) {
    o = Object.assign({ cloth: CREAM, thread: BLACK, arc: MUSTARD }, o);
    const g = S.at(parent, x, y, k);
    [-1, 1].forEach((side) => S.piece(g, polyD([[side * 86, 0], [side * 58, 0], [side * 4, -400], [side * 16, -400]]), o.cloth, { thread: o.thread, sw: 2.5, dash: "7 6" }));
    let zig = "M -66 -30";
    for (let i = 1; i <= 7; i++) zig += ` L ${(i % 2 ? 1 : -1) * (66 - i * 8)} ${-30 - i * 48}`;
    S.thread(g, zig, o.cloth, { sw: 5, dash: "11 7" });
    mk("rect", { x: -7, y: -440, width: 14, height: 50, fill: o.cloth }, g);
    S.mirror(g, 0, -448, 22, MADDER);
    const arcs = [1, 2, 3].map((n) => {
      const pair = mk("g", {}, g);
      [-1, 1].forEach((side) => S.thread(pair, `M ${side * (22 + n * 28)} ${-448 - n * 26} Q ${side * (40 + n * 40)} -448 ${side * (22 + n * 28)} ${-448 + n * 26}`, o.arc, { sw: 7, dash: "12 8" }));
      return pair;
    });
    return {
      g, arcs,
      quiet(t, dur) {
        [2, 1, 0].forEach((n, i) => R.tl.set(arcs[n], { autoAlpha: 0 }, t + (i * dur) / 3));
      },
      fall(t, side = 1, dur = 0.5) {
        R.tl.to(g, { rotation: side * 86, svgOrigin: `${side * 72} 0`, duration: dur, ease: "bounce.out" }, t);
      },
      rock(t, angles, step = 0.2) {
        angles.forEach((angle, i) => R.tl.to(g, { rotation: angle, svgOrigin: `${angle > 0 ? 72 : -72} 0`, duration: step, ease: "sine.inOut" }, t + i * step));
      },
    };
  };
  // A spear with its point at the origin, the shaft running up and away at the given angle.
  S.spear = function (parent, x, y, k, angle) {
    const outer = mk("g", { transform: `translate(${x} ${y}) rotate(${angle}) scale(${k})` }, parent);
    const g = mk("g", {}, outer);
    mk("rect", { x: -8, y: -720, width: 16, height: 640, fill: CREAM, stroke: BLACK, "stroke-width": 2 }, g);
    S.piece(g, "M 0 0 Q 46 -70 0 -150 Q -46 -70 0 0 Z", GLASS, { thread: BLACK, sw: 3 });
    S.saw(g, -30, -196, 60, 40, 3, [MADDER, MUSTARD, MADDER], 1, CREAM);
    S.thread(g, "M 0 -160 V -700", MADDER, { sw: 4, dash: "14 22" });
    return g;
  };
  // A water pot.
  S.pot = function (parent, x, y, k, fill) {
    const g = S.at(parent, x, y, k);
    S.piece(g, "M -34 -108 H 34 L 28 -84 Q 92 -56 84 12 Q 74 70 0 72 Q -74 70 -84 12 Q -92 -56 -28 -84 Z", fill, { thread: CREAM });
    S.thread(g, "M -76 -10 Q 0 22 76 -10", CREAM, { sw: 4, dash: "4 11" });
    S.saw(g, -60, 10, 120, 22, 6, [CREAM, BLACK], 1);
    return g;
  };
  // A balance: tilt(t, degrees, dur) swings the beam and the pans keep hanging level.
  S.scale = function (parent, x, y, k) {
    const g = S.at(parent, x, y, k);
    S.piece(g, polyD([[-70, 0], [70, 0], [16, -40], [16, -430], [-16, -430], [-16, -40]]), BLACK, { thread: MUSTARD });
    const beam = mk("g", {}, g);
    S.piece(beam, rectD(-330, -444, 660, 26, 10), MADDER, { thread: CREAM, sw: 3 });
    S.mirror(g, 0, -431, 24, MUSTARD);
    const pans = [-1, 1].map((side) => {
      const pan = mk("g", {}, g);
      S.thread(pan, `M ${side * 310} -431 L ${side * 310 - 96} -250 M ${side * 310} -431 L ${side * 310 + 96} -250`, CREAM, { sw: 4, dash: "10 8" });
      S.piece(pan, `M ${side * 310 - 120} -250 H ${side * 310 + 120} Q ${side * 310} -160 ${side * 310 - 120} -250 Z`, MUSTARD, { thread: BLACK, sw: 3 });
      return pan;
    });
    const state = { a: 0 };
    const place = () => {
      gsap.set(beam, { rotation: state.a, svgOrigin: "0 -431" });
      const rad = (state.a * Math.PI) / 180;
      pans.forEach((pan, i) => {
        const side = i ? 1 : -1;
        gsap.set(pan, { x: side * 310 * (Math.cos(rad) - 1), y: side * 310 * Math.sin(rad) });
      });
    };
    place();
    return { g, pans, tilt: (t, degrees, dur, ease = "elastic.out(1,0.45)") => R.tl.to(state, { a: degrees, duration: dur, ease, onUpdate: place }, t) };
  };
  // A coin: a small mirror with a mustard ring.
  S.coin = (parent, x, y, r) => S.mirror(parent, x, y, r, MUSTARD);
  // A four-pointed star of stitches, and a sickle moon.
  S.star = (parent, x, y, r, color = CREAM) => S.thread(parent, `M ${x - r} ${y} H ${x + r} M ${x} ${y - r} V ${y + r} M ${x - r * 0.6} ${y - r * 0.6} L ${x + r * 0.6} ${y + r * 0.6} M ${x - r * 0.6} ${y + r * 0.6} L ${x + r * 0.6} ${y - r * 0.6}`, color, { sw: 3, dash: "5 5" });
  S.moon = (parent, x, y, r) => S.piece(parent, `M ${x} ${y - r} A ${r} ${r} 0 1 0 ${x} ${y + r} A ${r * 1.5} ${r * 1.5} 0 0 1 ${x} ${y - r} Z`, CREAM, { thread: MUSTARD, sw: 3 });
})();
