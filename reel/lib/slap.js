// The "slap" look: a hip hop lyric video. The words are the picture: every lyric is set large in one of
// four voices (tall condensed, wide heavy, bold italic serif, round sticker letters) on flat yellow, pink,
// black, purple or white, and each word lands on the time it is sung. Behind the type, full-frame
// devices (rays, dots, a grid, fanning bars, stripes, a ghost word) keep the whole 9:16 in use.
// There is no caption line and nothing in the corners. Shots carry look: "slap".
(function () {
  const T = window.TIMELINE;
  const YELLOW = "#F7CB15";
  const PINK = "#E8134F";
  const BLACK = "#121210";
  const PURPLE = "#5B21E6";
  const WHITE = "#FFFFFF";
  const GREEN = "#22C55E";
  const G = (R.slap = { YELLOW, PINK, BLACK, PURPLE, WHITE, GREEN });

  Object.assign(R.GROUND, {
    "k-yellow": { bg: YELLOW, fg: BLACK },
    "k-pink": { bg: PINK, fg: BLACK },
    "k-black": { bg: BLACK, fg: WHITE },
    "k-purple": { bg: PURPLE, fg: WHITE },
    "k-white": { bg: WHITE, fg: BLACK },
  });
  // The four voices. `lh` is the line height that packs rows of capitals of that face tightly.
  const VOICE = {
    tall: { font: "tall", lh: 0.98, gap: 0.16, upper: true },
    wide: { font: "display", lh: 0.9, gap: 0.32, upper: true },
    serif: { font: "serifb", lh: 1.08, gap: 0.24, upper: false },
    sticker: { font: "baloo", lh: 1.0, gap: 0.2, upper: true },
  };
  Object.assign(R.FONT, { tall: '"Anton"', serifb: '"Playfair Display"', baloo: '"Baloo Bhai 2"' });
  Object.assign(R.WEIGHT, { tall: 400, serifb: "italic 900", baloo: 800 });
  R.fontFaces.push('400 100px "Anton"', 'italic 900 100px "Playfair Display"', '800 100px "Baloo Bhai 2"');

  function el(tag, css, parent, text) {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (parent) parent.appendChild(node);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  // Decoration is allowed to sit under and over other things.
  const loose = (node) => (node.setAttribute("data-layout-allow-overlap", ""), node.setAttribute("data-layout-allow-overflow", ""), node);
  G.box = (css, parent, text) => el("div", css, parent, text);

  // The beats (and, with `half`, the half beats) that fall inside a shot.
  G.beats = function (s, half) {
    const out = [];
    T.beats.forEach((beat) => [beat, half ? beat + T.seconds_per_beat / 2 : null].forEach((time) => time !== null && time >= s.t0 && time < s.t1 && out.push(time)));
    return out;
  };

  // ---- type ----
  // A column of rows between two heights of the frame, centred, for the lyric of a shot.
  G.col = function (s, o) {
    o = Object.assign({ top: 250, bottom: 1480, gap: 14, align: "center" }, o);
    const col = el("div", `position:absolute;left:108px;right:108px;top:${o.top}px;height:${o.bottom - o.top}px;display:flex;flex-direction:column;align-items:${o.align};justify-content:center;gap:${o.gap}px;z-index:2`, s.layer);
    col.setAttribute("data-col", o.bottom - o.top);
    return col;
  };
  // Stretch the rows of a column upwards until it fills its height (the tall poster look), by at most
  // `most`. Called once a shot's rows are all in; this is what keeps the type using the whole 9:16.
  G.fill = function (col, most = 1.75) {
    const rows = Array.from(col.children);
    const gaps = (rows.length - 1) * parseFloat(col.style.gap);
    const total = rows.reduce((sum, row) => sum + row.offsetHeight, 0);
    if (!total) return;
    const factor = Math.min(most, (Number(col.getAttribute("data-col")) * 0.97 - gaps) / total);
    if (factor <= 1.02) return;
    rows.forEach((row) => {
      row.style.transform = `scaleY(${factor.toFixed(3)})`;
      row.style.margin = `${((row.offsetHeight * (factor - 1)) / 2).toFixed(1)}px 0`;
    });
  };
  // One row of words in a voice, fitted to w px wide (never over max px). Returns the word elements.
  G.row = function (col, words, voice, o) {
    const v = VOICE[voice];
    o = Object.assign({ w: 864, max: 520, color: null, gap: v.gap, rotate: 0 }, o);
    const shown = words.map((word) => (v.upper ? word.toUpperCase() : word));
    const natural = shown.reduce((sum, word) => sum + R.measure(word, v.font), 0) + (shown.length - 1) * o.gap * 100;
    const size = Math.min(o.max, (100 * o.w) / natural);
    const row = el("div", `display:flex;flex-shrink:0;justify-content:center;align-items:center;white-space:nowrap;gap:${o.gap}em;font-family:${R.FONT[v.font]};font-size:${size}px;line-height:${o.lh || v.lh}`, col);
    row.style.fontWeight = voice === "serif" ? 900 : R.WEIGHT[v.font];
    if (voice === "serif") row.style.fontStyle = "italic";
    if (o.color) row.style.color = o.color;
    if (o.rotate) row.style.rotate = o.rotate + "deg";
    return shown.map((word) => el("span", "display:inline-block;position:relative", row, word));
  };
  // Sticker letters: a thick outline and a hard shadow.
  G.stick = function (node, fill, edge, shadow) {
    node.style.cssText += `;color:${fill};-webkit-text-stroke:0.13em ${edge};paint-order:stroke fill;text-shadow:0.07em 0.08em 0 ${shadow || edge}`;
    return node;
  };
  // Outline only.
  G.hollow = (node, color, weight = 0.03) => ((node.style.cssText += `;color:transparent;-webkit-text-stroke:${weight}em ${color}`), node);

  // ---- how a word arrives ----
  const tl = () => R.tl;
  G.slam = (node, t, from = 2, dur = 0.16) => tl().fromTo(node, { scale: from, opacity: 0 }, { scale: 1, opacity: 1, duration: dur, ease: "power4.out" }, t);
  G.pop = (node, t, dur = 0.22) => tl().fromTo(node, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: dur, ease: "back.out(2.6)" }, t);
  G.drop = (node, t, dur = 0.32) => tl().fromTo(node, { y: -1500, opacity: 1 }, { y: 0, duration: dur, ease: "bounce.out" }, t);
  G.rise = (node, t, dur = 0.22) => tl().fromTo(node, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: dur, ease: "power3.out" }, t);
  G.side = (node, t, dir = 1, dur = 0.22) => tl().fromTo(node, { x: dir * 1200, skewX: dir * -16, opacity: 1 }, { x: 0, skewX: 0, duration: dur, ease: "power4.out" }, t);
  G.grow = (node, t, dur = 0.26) => tl().fromTo(node, { scaleY: 0, opacity: 1, transformOrigin: "50% 100%" }, { scaleY: 1, duration: dur, ease: "back.out(2)" }, t);
  G.show = (node, t) => ((node.style.visibility = "hidden"), tl().set(node, { autoAlpha: 1 }, t));
  G.hide = (node, t) => tl().set(node, { autoAlpha: 0 }, t);
  // Words of a row arriving one by one: `how` is a move above, `times` one time per word.
  G.each = (nodes, times, how, ...rest) => nodes.forEach((node, i) => how(node, times[Math.min(i, times.length - 1)], ...rest));
  // A bump on each of `times`.
  G.pulse = (node, times, amount = 0.07, dur = 0.26) => times.forEach((time) => tl().fromTo(node, { scale: 1 + amount }, { scale: 1, duration: dur, ease: "power2.out", immediateRender: false }, time));
  // A colour over the whole shot for an instant.
  G.flash = function (s, t, color, dur = 0.12) {
    const node = loose(el("div", `position:absolute;inset:0;z-index:7;background:${color};opacity:0`, s.box));
    tl().fromTo(node, { opacity: 1 }, { opacity: 0, duration: dur, ease: "power2.out", immediateRender: false }, t);
  };

  // ---- what fills the frame behind the type (all of it, edge to edge) ----
  const back = (s, css) => loose(el("div", "position:absolute;z-index:0;" + css, s.layer));
  // Rays from a point, turning slowly.
  G.rays = function (s, o) {
    o = Object.assign({ x: 540, y: 960, color: "rgba(18,18,16,0.1)", step: 9, turn: 20 }, o);
    const node = back(s, `left:${o.x - 1800}px;top:${o.y - 1800}px;width:3600px;height:3600px;background:repeating-conic-gradient(${o.color} 0 ${o.step}deg, transparent ${o.step}deg ${o.step * 2}deg)`);
    tl().fromTo(node, { rotation: 0 }, { rotation: o.turn, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    return node;
  };
  // Halftone dots over the frame, drifting.
  G.dots = function (s, o) {
    o = Object.assign({ color: "rgba(255,255,255,0.14)", cell: 44, size: 9, drift: 44 }, o);
    const node = back(s, `left:-100px;top:-100px;width:1280px;height:2120px;background-image:radial-gradient(${o.color} ${o.size}px, transparent ${o.size + 1}px);background-size:${o.cell}px ${o.cell}px`);
    tl().fromTo(node, { x: 0, y: 0 }, { x: o.drift, y: o.drift, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    return node;
  };
  // A ruled grid.
  G.grid = function (s, o) {
    o = Object.assign({ color: "rgba(18,18,16,0.12)", cell: 90 }, o);
    return back(s, `inset:0;background-image:linear-gradient(${o.color} 3px, transparent 3px),linear-gradient(90deg, ${o.color} 3px, transparent 3px);background-size:${o.cell}px ${o.cell}px`);
  };
  // Bars fanning out of a corner, one per time in `times`.
  G.fan = function (s, times, o) {
    o = Object.assign({ color: "rgba(18,18,16,0.16)", corner: "bl", n: times.length, spread: 78, length: 2400, thick: 170 }, o);
    const left = o.corner[1] === "l";
    const bottom = o.corner[0] === "b";
    return times.map((time, i) => {
      const angle = (bottom ? -1 : 1) * (left ? 1 : -1) * (6 + (i * o.spread) / Math.max(1, o.n - 1));
      const bar = back(s, `${left ? "left" : "right"}:-80px;${bottom ? "bottom" : "top"}:${-o.thick / 2}px;width:${o.length}px;height:${o.thick}px;background:${o.color};transform-origin:${left ? "0" : "100%"} 50%`);
      tl().fromTo(bar, { rotation: bottom === left ? 20 : -20, scaleX: 0 }, { rotation: angle, scaleX: 1, duration: 0.3, ease: "power3.out" }, time);
      return bar;
    });
  };
  // Slanted stripes across the frame, sliding.
  G.stripes = function (s, o) {
    o = Object.assign({ color: "rgba(18,18,16,0.1)", width: 70, angle: -24, drift: 140 }, o);
    const node = back(s, `left:-700px;top:-500px;width:2500px;height:2900px;background:repeating-linear-gradient(90deg, ${o.color} 0 ${o.width}px, transparent ${o.width}px ${o.width * 2}px);rotate:${o.angle}deg`);
    tl().fromTo(node, { x: 0 }, { x: o.drift, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    return node;
  };
  // One huge word behind everything, running off the frame.
  G.ghost = function (s, text, o) {
    o = Object.assign({ color: "rgba(255,255,255,0.08)", size: 900, x: 540, y: 960, rotate: -90, voice: "tall", drift: 120 }, o);
    const v = VOICE[o.voice];
    const node = back(s, `left:${o.x}px;top:${o.y}px;width:0;height:0;display:flex;align-items:center;justify-content:center;rotate:${o.rotate}deg`);
    // Painted on a canvas, not set as page text: it is texture, and is not meant to be read.
    const shown = v.upper ? text.toUpperCase() : text;
    const word = document.createElement("canvas");
    word.width = Math.ceil((R.measure(shown, v.font) * o.size) / 100) + 40;
    word.height = Math.ceil(o.size * 1.3);
    word.style.cssText = "flex-shrink:0";
    const pen = word.getContext("2d");
    pen.font = `${voice900(o.voice)} ${o.size}px ${R.FONT[v.font]}`;
    pen.textAlign = "center";
    pen.textBaseline = "middle";
    pen.fillStyle = o.color;
    pen.fillText(shown, word.width / 2, word.height / 2);
    node.appendChild(word);
    tl().fromTo(word, { x: -o.drift }, { x: o.drift, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    return word;
  };
  const voice900 = (voice) => (voice === "serif" ? 900 : R.WEIGHT[VOICE[voice].font]);
  // The frame filled with one phrase in rows, alternately strong and faint, sliding against each other.
  G.wall = function (s, text, o) {
    o = Object.assign({ rows: 11, size: 190, color: "rgba(18,18,16,0.22)", voice: "wide", drift: 300 }, o);
    const v = VOICE[o.voice];
    const wall = back(s, "left:0;top:-40px;width:1080px;height:2000px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between");
    for (let i = 0; i < o.rows; i++) {
      const row = el("div", `white-space:nowrap;margin-left:-500px;font-family:${R.FONT[v.font]};font-weight:${voice900(o.voice)};font-size:${o.size}px;line-height:0.95;color:${o.color}`, wall, Array(8).fill(v.upper ? text.toUpperCase() : text).join("  "));
      if (i % 2) row.style.opacity = 0.45;
      tl().fromTo(row, { x: i % 2 ? -o.drift : 0 }, { x: i % 2 ? 0 : -o.drift, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    }
    return wall;
  };
  // A flat block of colour (a panel, a bar, a strip), placed by its corner; rotate turns it.
  G.block = (s, x, y, w, h, color, rotate = 0) => back(s, `left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${color};rotate:${rotate}deg`);
  // Triangles streaming through the frame from t (up for a gain, down for a loss).
  G.arrows = function (s, t, o) {
    o = Object.assign({ color: PINK, n: 12, up: true, size: 70, seed: 3 }, o);
    const random = R.rng(o.seed);
    for (let i = 0; i < o.n; i++) {
      const size = o.size * (0.6 + random() * 0.9);
      const node = back(s, `left:${60 + random() * 900}px;top:${o.up ? 2000 : -200}px;width:0;height:0;border-left:${size / 2}px solid transparent;border-right:${size / 2}px solid transparent;border-${o.up ? "bottom" : "top"}:${size}px solid ${o.color}`);
      tl().fromTo(node, { y: 0 }, { y: o.up ? -2500 : 2500, duration: 0.7 + random() * 0.7, ease: "none" }, t + random() * Math.max(0.2, s.t1 - t - 0.6));
    }
  };

  // ---- over footage ----
  // A dark veil at the top and bottom of a shot, so type and the lyric line read over any footage.
  G.scrim = (s, o) => {
    o = Object.assign({ top: 0.5, bottom: 0.5 }, o);
    return back(s, `inset:0;background:linear-gradient(180deg, rgba(0,0,0,${o.top}) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 58%, rgba(0,0,0,${o.bottom}) 74%, rgba(0,0,0,${o.bottom * 0.5}) 100%)`);
  };
  // A word on a flat plate of colour.
  G.plate = (node, bg, fg, pad = "0 0.14em") => ((node.style.cssText += `;background:${bg};color:${fg};padding:${pad}`), node);
  // A hard dark edge for plain type that sits straight on footage.
  G.edge = (node, color = BLACK, weight = 0.09) => ((node.style.cssText += `;-webkit-text-stroke:${weight}em ${color};paint-order:stroke fill`), node);

  // ---- interface elements (drawn in the look's colours; the toggle, the notification and the signal
  // bars follow elements from Uiverse.io, MIT licence, rebuilt so the timeline drives them) ----
  const U = (G.ui = {});
  const font = (name, size) => `font-family:${R.FONT[name]};font-weight:${R.WEIGHT[name]};font-size:${size}px;line-height:1`;
  // A white card with a black edge and a hard shadow.
  U.card = (css, shadow = BLACK) => el("div", `position:relative;background:${WHITE};color:${BLACK};border:6px solid ${BLACK};border-radius:36px;box-shadow:12px 12px 0 ${shadow};padding:26px 32px;flex-shrink:0;` + (css || ""));
  // Four signal bars: set(t, level) lights that many.
  U.bars = function (height, level = 4) {
    const wrap = el("div", `display:flex;align-items:flex-end;gap:${height * 0.1}px;height:${height}px;flex-shrink:0`);
    const bars = [0.4, 0.6, 0.8, 1].map((f, i) => el("div", `width:${height * 0.2}px;height:${f * 100}%;border-radius:${height * 0.05}px;background:${i < level ? BLACK : "rgba(18,18,16,0.2)"}`, wrap));
    return { el: wrap, set: (t, n) => bars.forEach((bar, i) => tl().set(bar, { background: i < n ? BLACK : "rgba(18,18,16,0.2)" }, t)) };
  };
  // A carrier's card: initial, name, signal bars with a status word, and the day's move.
  // drop(t, dur) takes the bars away one by one and changes the status.
  U.carrier = function (name, move, o) {
    o = Object.assign({ w: 860, up: "CONNECTED", down: "NO SERVICE", shadow: PINK }, o);
    const card = U.card(`width:${o.w}px;display:flex;align-items:center;gap:24px`, o.shadow);
    el("div", `width:104px;height:104px;border-radius:50%;background:${BLACK};color:${WHITE};display:flex;align-items:center;justify-content:center;flex-shrink:0;${font("display", 56)}`, card, name[0]);
    const text = el("div", "flex:1;text-align:left;min-width:0", card);
    el("div", font("display", 50) + ";text-transform:uppercase;white-space:nowrap", text, name);
    const line = el("div", `display:flex;align-items:center;gap:14px;margin-top:12px;${font("display", 25)};letter-spacing:0.04em`, text);
    const bars = U.bars(34);
    line.appendChild(bars.el);
    const status = el("div", "display:grid", line);
    const up = el("div", "grid-area:1/1", status, o.up);
    const down = el("div", "grid-area:1/1;color:#C40F3F;visibility:hidden", status, o.down);
    el("div", font("tall", 84) + `;color:#C40F3F;flex-shrink:0`, card, move);
    return {
      el: card, bars,
      drop(t, dur) {
        [3, 2, 1, 0].forEach((level, i) => bars.set(t + (i * dur) / 4, level));
        tl().set(up, { autoAlpha: 0 }, t + dur * 0.75);
        tl().set(down, { autoAlpha: 1 }, t + dur * 0.75);
      },
    };
  };
  // A notification: a round badge, a small title and a line under it.
  U.toast = function (badge, title, text, o) {
    o = Object.assign({ w: 760, accent: YELLOW, shadow: BLACK }, o);
    const card = U.card(`width:${o.w}px;display:flex;align-items:center;gap:24px;border-radius:999px;padding:20px 40px 20px 22px`, o.shadow);
    el("div", `width:92px;height:92px;border-radius:50%;background:${o.accent};border:5px solid ${BLACK};display:flex;align-items:center;justify-content:center;flex-shrink:0;${font("display", 46)}`, card, badge);
    const body = el("div", "text-align:left;min-width:0", card);
    el("div", font("display", 24) + ";letter-spacing:0.08em;opacity:0.7;white-space:nowrap", body, title);
    el("div", font("display", 44) + ";line-height:1.12;text-transform:uppercase;white-space:nowrap", body, text);
    return card;
  };
  // A pill switch: set(t, on) throws the knob across.
  U.toggle = function (width, o) {
    o = Object.assign({ on: GREEN, off: "#C9C9C4", state: false }, o);
    const height = width * 0.5;
    const pad = height * 0.14;
    const pill = el("div", `position:relative;width:${width}px;height:${height}px;border-radius:${height}px;border:5px solid ${BLACK};background:${o.state ? o.on : o.off};flex-shrink:0`);
    const knob = el("div", `position:absolute;left:${pad - 5}px;top:${pad - 5}px;width:${height - pad * 2}px;height:${height - pad * 2}px;border-radius:50%;background:${BLACK}`, pill);
    gsap.set(knob, { x: o.state ? width - height : 0 });
    return {
      el: pill,
      set(t, on) {
        tl().to(knob, { x: on ? width - height : 0, duration: 0.16, ease: "back.out(2.4)" }, t);
        tl().set(pill, { background: on ? o.on : o.off }, t + 0.05);
      },
    };
  };
  // A slider in a card, with a flag at the far end: to(t, fraction, dur) moves the thumb.
  U.slider = function (width, o) {
    o = Object.assign({ label: "", flag: "", fill: GREEN }, o);
    const card = U.card(`width:${width}px;padding:26px 44px 40px`, o.shadow || BLACK);
    const head = el("div", `display:flex;justify-content:space-between;align-items:center;${font("display", 30)};margin-bottom:44px`, card);
    el("span", "", head, o.label);
    el("span", `background:${BLACK};color:${WHITE};padding:8px 16px;border-radius:10px;font-size:24px;letter-spacing:0.05em`, head, o.flag);
    const span = width - 100;
    const rail = el("div", `position:relative;width:${span}px;height:20px;border-radius:10px;background:rgba(18,18,16,0.16)`, card);
    const fill = el("div", `position:absolute;inset:0;border-radius:10px;background:${o.fill};transform-origin:0 50%`, rail);
    el("div", `position:absolute;right:-3px;top:-34px;width:6px;height:88px;background:${BLACK}`, rail);
    const thumb = el("div", `position:absolute;left:-32px;top:-22px;width:64px;height:64px;border-radius:50%;background:${WHITE};border:7px solid ${BLACK}`, rail);
    gsap.set(fill, { scaleX: 0 });
    return {
      el: card, thumb,
      to(t, fraction, dur, ease = "back.out(1.6)") {
        tl().to(thumb, { x: fraction * span, duration: dur, ease }, t);
        tl().to(fill, { scaleX: fraction, duration: dur, ease }, t);
      },
    };
  };
  // A button; `off` draws it disabled.
  U.button = function (text, o) {
    o = Object.assign({ bg: YELLOW, size: 52, off: false }, o);
    return el("div", `${font("display", o.size)};text-transform:uppercase;white-space:nowrap;padding:0.55em 1.1em;border-radius:999px;border:6px ${o.off ? "dashed" : "solid"} ${BLACK};color:${o.off ? "rgba(18,18,16,0.55)" : BLACK};background:${o.off ? "#E4E4DF" : o.bg};` + (o.off ? "" : `box-shadow:10px 10px 0 ${BLACK}`), null, text);
  };
  // A pointer; click(t) presses it and rings the spot.
  U.cursor = function (size) {
    const wrap = loose(el("div", `position:absolute;width:${size}px;height:${size}px`));
    const ring = loose(el("div", `position:absolute;left:${-size * 0.4}px;top:${-size * 0.4}px;width:${size}px;height:${size}px;border-radius:50%;border:6px solid ${WHITE};opacity:0`, wrap));
    const arrow = el("div", `width:0;height:0;border-left:${size * 0.34}px solid transparent;border-right:${size * 0.34}px solid transparent;border-bottom:${size * 0.9}px solid ${WHITE};rotate:-28deg;filter:drop-shadow(0 0 0 ${BLACK}) drop-shadow(3px 3px 0 ${BLACK}) drop-shadow(-3px -3px 0 ${BLACK}) drop-shadow(3px -3px 0 ${BLACK}) drop-shadow(-3px 3px 0 ${BLACK})`, wrap);
    return {
      el: wrap,
      click(t) {
        tl().fromTo(arrow, { scale: 0.75 }, { scale: 1, duration: 0.2, ease: "back.out(3)" }, t);
        tl().fromTo(ring, { scale: 0.2, opacity: 1 }, { scale: 1.6, opacity: 0, duration: 0.3, ease: "power2.out" }, t);
      },
    };
  };
  // A price tag with a hole and two figures, one behind the other: flip(t) shows the second.
  U.tag = function (first, second, o) {
    o = Object.assign({ size: 150, bg: YELLOW }, o);
    const tag = el("div", `position:relative;display:flex;align-items:center;gap:26px;background:${o.bg};color:${BLACK};border:7px solid ${BLACK};border-radius:28px 110px 110px 28px;box-shadow:12px 12px 0 ${BLACK};padding:22px 70px 22px 40px;flex-shrink:0`);
    const value = el("div", `display:grid;${font("tall", o.size)}`, tag);
    const a = el("div", "grid-area:1/1", value, first);
    const b = el("div", "grid-area:1/1;visibility:hidden;color:#C40F3F", value, second);
    el("div", `width:34px;height:34px;border-radius:50%;background:${BLACK};flex-shrink:0`, tag);
    return {
      el: tag,
      flip(t) {
        tl().set(a, { autoAlpha: 0 }, t);
        tl().set(b, { autoAlpha: 1 }, t);
        tl().fromTo(tag, { scale: 1.2, rotation: -5 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t);
      },
    };
  };
})();
