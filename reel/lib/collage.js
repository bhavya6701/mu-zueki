// The "collage" look: a torn-paper street collage over stock footage. Type sits on torn tape strips,
// cream paper scraps are pasted over the edges of the footage, rubber stamps slam on, and reaction GIFs
// (footage clips on track 1) are framed as white die-cut stickers. Shots carry look: "collage" and the
// ground "clear", so the day's footage shows through. Everything moves in small stop-motion steps.
(function () {
  const T = window.TIMELINE;
  const NS = "http://www.w3.org/2000/svg";
  const CREAM = "#EDE4D0";
  const PAPER = "#F6F0E2";
  const INK = "#141210";
  const RED = "#D7261E";
  const YELLOW = "#F5C518";
  const WHITE = "#FFFFFF";
  const C = (R.clg = { CREAM, PAPER, INK, RED, YELLOW, WHITE });
  const tl = () => R.tl;

  Object.assign(R.FONT, { tall: '"Anton"' });
  Object.assign(R.WEIGHT, { tall: 400 });
  if (!R.fontFaces.includes('400 100px "Anton"')) R.fontFaces.push('400 100px "Anton"');

  function el(tag, css, parent, text) {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (parent) parent.appendChild(node);
    if (text !== undefined) node.textContent = text;
    node.setAttribute("data-layout-allow-overlap", "");
    node.setAttribute("data-layout-allow-overflow", "");
    return node;
  }
  C.box = (css, parent, text) => el("div", css, parent, text);

  // A ragged edge: points along a line, nudged in and out, for torn paper and tape ends.
  function ragged(random, n, depth) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push([i / n, (random() - 0.5) * depth]);
    return out;
  }
  // A clip-path polygon for a strip with torn left and right ends (in % of the box).
  function tornEnds(random) {
    const left = ragged(random, 7, 6).map(([t, d]) => `${3 + d}% ${t * 100}%`);
    const right = ragged(random, 7, 6).map(([t, d]) => `${97 + d}% ${100 - t * 100}%`);
    return `polygon(${left.join(",")},${right.join(",")})`;
  }

  // ---- moves ----
  // A paper slap: lands a little big and turned, then settles in three stop-motion steps. (A piece is
  // already turned by its pin, so the turn here is relative to that; the third argument is ignored.)
  C.slap = (node, t) =>
    tl().fromTo(node, { scale: 1.35, rotation: -7, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.15, ease: "steps(3)" }, t);
  C.show = (node, t) => ((node.style.visibility = "hidden"), tl().set(node, { autoAlpha: 1 }, t));
  // Small turns on every beat of the shot: the cut-outs never sit still, like an animated collage.
  // (Like C.slap, the turn is relative to the pin; the third argument is ignored.)
  C.boil = function (s, node, _rot, amount = 1.2, seed = 3) {
    const rot = 0;
    const random = R.rng(seed);
    T.beats.forEach((beat) => {
      if (beat <= s.t0 + 0.16 || beat >= s.t1) return;
      tl().set(node, { rotation: rot + (random() - 0.5) * amount * 2, x: (random() - 0.5) * 6, y: (random() - 0.5) * 6 }, beat);
    });
  };
  // The whole frame jolts on a hit.
  C.jolt = (s, t, amount = 16) =>
    [[1, -0.6], [-0.8, 0.7], [0.5, 0.3], [0, 0]].forEach(([x, y], i) => tl().set(s.punch, { x: x * amount, y: y * amount }, t + i * 0.04));

  // ---- pieces ----
  // A strip of tape with a word on it, its middle at x, y. o: size (font px), bg, fg, rot, font, seed, pad.
  C.tape = function (s, text, x, y, o) {
    o = Object.assign({ size: 120, bg: CREAM, fg: INK, rot: 0, font: "tall", seed: 1, w: 900 }, o);
    const random = R.rng(o.seed);
    const fit = Math.min(o.size, (o.w * 100) / (R.measure(text.toUpperCase(), o.font) + 60));
    const strip = el("div", `font-family:${R.FONT[o.font]};font-weight:${R.WEIGHT[o.font]};font-size:${fit}px;line-height:1;white-space:nowrap;text-transform:uppercase;` +
      `background:${o.bg};color:${o.fg};padding:0.12em 0.42em 0.08em;clip-path:${tornEnds(random)};box-shadow:0 6px 0 rgba(0,0,0,0.25)`);
    strip.textContent = text;
    s.put(strip, x, y, o.rot);
    return strip;
  };
  // A torn scrap of paper pasted over the footage: w x h at x, y (top left), turned by rot.
  C.scrap = function (s, x, y, w, h, o) {
    o = Object.assign({ color: PAPER, rot: 0, seed: 2 }, o);
    const random = R.rng(o.seed);
    const pts = [];
    ragged(random, 10, 0.05).forEach(([t, d]) => pts.push([t, d]));
    ragged(random, 14, 0.05).forEach(([t, d]) => pts.push([1 + d, t]));
    ragged(random, 10, 0.05).forEach(([t, d]) => pts.push([1 - t, 1 + d]));
    ragged(random, 14, 0.05).forEach(([t, d]) => pts.push([d, 1 - t]));
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.setAttribute("viewBox", "-0.05 -0.05 1.1 1.1");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.cssText = `position:absolute;left:${x}px;top:${y}px;rotate:${o.rot}deg;overflow:visible;filter:drop-shadow(0 8px 6px rgba(0,0,0,0.35))`;
    const poly = document.createElementNS(NS, "polygon");
    poly.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
    poly.setAttribute("fill", o.color);
    svg.appendChild(poly);
    svg.setAttribute("data-layout-allow-overlap", "");
    svg.setAttribute("data-layout-allow-overflow", "");
    s.layer.appendChild(svg);
    return svg;
  };
  // A rubber stamp: a red ink border around capitals, turned, with the ink missing in spots.
  C.stamp = function (s, text, x, y, o) {
    o = Object.assign({ size: 130, color: RED, rot: -8, w: 760 }, o);
    const fit = Math.min(o.size, (o.w * 100) / (R.measure(text, "tall") + 80));
    const stamp = el("div", `font-family:"Anton";font-size:${fit}px;line-height:1;white-space:nowrap;color:${o.color};border:0.08em solid ${o.color};` +
      `border-radius:0.12em;padding:0.08em 0.3em 0.02em;letter-spacing:0.04em;background:rgba(246,240,226,0.95);` +
      `-webkit-mask-image:repeating-radial-gradient(circle at 30% 40%, #000 0 6px, rgba(0,0,0,0.9) 7px 9px);mask-image:repeating-radial-gradient(circle at 30% 40%, #000 0 6px, rgba(0,0,0,0.9) 7px 9px)`);
    stamp.textContent = text;
    s.put(stamp, x, y, o.rot);
    return stamp;
  };
  // Turns one of the day's GIF clips (a <video> placed by footage.json) into a die-cut sticker that
  // slaps on at t: a thick white border, a drop shadow and a turn.
  C.sticker = function (id, t, rot = -4) {
    const video = document.getElementById(id);
    if (!video) return null;
    video.style.border = "16px solid #fff";
    video.style.borderRadius = "18px";
    video.style.boxShadow = "0 18px 0 rgba(0,0,0,0.3)";
    video.style.boxSizing = "border-box";
    video.style.zIndex = "4";
    tl().fromTo(video, { scale: 1.5, rotation: rot - 10 }, { scale: 1, rotation: rot, duration: 0.18, ease: "steps(3)" }, t);
    return video;
  };
  // A paper reveal: the shot opens under a cream sheet that tears away upward from t.
  C.rip = function (s, t, dur = 0.26) {
    const random = R.rng(Math.round(t * 100));
    const edge = ragged(random, 18, 3).map(([u, d]) => `${u * 100}% ${100 + d}%`).reverse();
    const sheet = el("div", `position:absolute;left:-20px;right:-20px;top:-20px;height:1990px;background:${PAPER};z-index:5;` +
      `clip-path:polygon(0 0,100% 0,${edge.join(",")});filter:drop-shadow(0 12px 8px rgba(0,0,0,0.4))`, s.punch);
    tl().fromTo(sheet, { y: 0 }, { y: -2100, duration: dur, ease: "power2.in" }, t);
    return sheet;
  };

  // ---- drawn gags (marker drawings that draw themselves) ----
  function drawing(s, x, y, w, h, paths, t, o) {
    o = Object.assign({ color: INK, weight: 14, rot: 0, dur: 0.3 }, o);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.overflow = "visible";
    paths.forEach((p, i) => {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", p.d);
      path.setAttribute("fill", p.fill || "none");
      path.setAttribute("stroke", p.color || o.color);
      path.setAttribute("stroke-width", p.weight || o.weight);
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.appendChild(path);
      const length = p.length || 2000;
      path.setAttribute("stroke-dasharray", length);
      path.setAttribute("stroke-dashoffset", length);
      const at = t + (p.at !== undefined ? p.at : (i * o.dur) / paths.length);
      tl().to(path, { strokeDashoffset: 0, duration: p.dur || o.dur, ease: "none" }, at);
      if (p.fill) {
        path.style.fillOpacity = 0;
        tl().set(path, { fillOpacity: 1 }, at + (p.dur || o.dur));
      }
    });
    s.put(svg, x, y, o.rot);
    return svg;
  }
  C.drawing = drawing;
  // An arrow that tries to go up, gets crossed out, and a question mark.
  C.forgot = (s, x, y, t) =>
    drawing(s, x, y, 420, 460, [
      { d: "M210 420 L210 70 M110 170 L210 60 L310 170", weight: 26, color: WHITE },
      { d: "M70 110 L350 390 M350 110 L70 390", weight: 30, color: RED, at: 0.32 },
      { d: "M370 60 C 430 0, 470 90, 410 120 C 385 135, 385 160, 386 180 M386 228 L386 232", weight: 18, color: YELLOW, at: 0.5 },
    ], t);
  // A pickaxe striking a bar, with sparks.
  C.pickaxe = (s, x, y, t) => {
    const axe = drawing(s, x, y, 520, 440, [
      { d: "M90 400 L330 120", weight: 26, color: "#7A4A22" },
      { d: "M200 60 C 300 40, 400 90, 470 190 C 400 140, 320 120, 250 130 Z", weight: 14, color: INK, fill: "#9AA3AD" },
    ], t, { dur: 0.16 });
    const sparks = drawing(s, x + 150, y + 30, 300, 300, [
      { d: "M150 150 L150 20", weight: 12, color: YELLOW },
      { d: "M150 150 L270 70", weight: 12, color: YELLOW },
      { d: "M150 150 L290 190", weight: 12, color: YELLOW },
      { d: "M150 150 L40 60", weight: 12, color: YELLOW },
    ], t + 0.22, { dur: 0.08 });
    axe.style.scale = "1.6";
    sparks.style.scale = "1.6";
    tl().fromTo(axe, { rotation: -40, transformOrigin: "20% 90%" }, { rotation: 0, duration: 0.16, ease: "power4.in" }, t);
    return { axe, sparks };
  };
  // A microphone that falls and bounces: a round grille on a tapered handle.
  C.mic = (s, x, y, t) => {
    const mic = drawing(s, x, y, 240, 460, [
      { d: "M120 20 a 80 80 0 1 0 0.1 0 Z", weight: 12, fill: "#B9BEC4", color: INK },
      { d: "M60 70 L180 70 M45 100 L195 100 M45 130 L195 130 M60 160 L180 160 M90 35 L90 175 M120 22 L120 180 M150 35 L150 175", weight: 6, color: "#5C6168" },
      { d: "M78 190 L162 190 L140 440 L100 440 Z", weight: 12, fill: "#26282B", color: INK },
    ], t - 0.3, { dur: 0.12 });
    mic.style.scale = "1.15";
    tl().fromTo(mic, { y: -900, rotation: -20 }, { y: 0, rotation: 28, duration: 0.42, ease: "bounce.out" }, t);
    return mic;
  };

  // ---- shots ----
  // A shot over the day's footage in the collage look.
  C.over = (caps, build, more) => R.shot(Object.assign({ caps, ground: "clear", look: "collage" }, more), build);
})();
