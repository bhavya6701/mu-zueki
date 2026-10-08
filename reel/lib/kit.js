// The reel kit: shots, rows of fitted type, captions, scribbled lettering and the moves.
// A scene file calls R.shot({ caps: [lyric line numbers], ground }, (s) => { ... }) once per shot.
// Every time comes from the day's timeline (window.TIMELINE); nothing is hard-coded to a second.
(function () {
  const T = window.TIMELINE;
  const NS = "http://www.w3.org/2000/svg";
  const COLOR = { light: "#E9E7E4", dark: "#0B0B0B", red: "#E23A2E", ink: "#111111", white: "#F4F2EE" };
  const GROUND = {
    light: { bg: COLOR.light, fg: COLOR.ink },
    dark: { bg: COLOR.dark, fg: COLOR.white },
    red: { bg: COLOR.red, fg: COLOR.dark },
    // the windows look
    paper: { bg: "#F4F3EC", fg: "#151515" },
    term: { bg: "#0C0C0C", fg: "#F4F3EC" },
  };
  const FONT = { display: '"Archivo Black"', text: '"Space Grotesk"', hand: '"Reenie Beanie"', mono: '"JetBrains Mono"', monoBold: '"JetBrains Mono"' };
  const WEIGHT = { display: 400, text: 700, hand: 400, mono: 400, monoBold: 800 };

  const R = (window.R = { COLOR, GROUND, FONT, shots: [], fx: {}, duration: T.duration_seconds });
  let tl = null;

  // Repeatable pseudo-random numbers, so every render of a frame is identical.
  R.rng = function (seed) {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  };

  const canvas = document.createElement("canvas").getContext("2d");
  // Width of text at 100 px in one of the three fonts.
  R.measure = function (text, font) {
    canvas.font = `${WEIGHT[font]} 100px ${FONT[font]}`;
    return canvas.measureText(text).width;
  };

  function el(tag, className, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  }

  const cap = (n) => T.captions[n - 1];

  R.shot = (options, build) => R.shots.push({ options, build });

  // ---- moves: all placed on the one timeline at absolute song time ----
  const fx = R.fx;
  fx.slam = (node, t, from = 1.7, duration = 0.3) =>
    tl.fromTo(node, { scale: from, opacity: 0 }, { scale: 1, opacity: 1, duration, ease: "power4.out" }, t);
  fx.pop = (node, t, duration = 0.28) =>
    tl.fromTo(node, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration, ease: "back.out(2.2)" }, t);
  fx.rise = (node, t, duration = 0.3) =>
    tl.fromTo(node, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration, ease: "power3.out" }, t);
  fx.side = (node, t, direction = 1, duration = 0.32) =>
    tl.fromTo(
      node,
      { x: direction * 1100, skewX: direction * -14, opacity: 0 },
      { x: 0, skewX: 0, opacity: 1, duration, ease: "power4.out" },
      t,
    );
  fx.squash = (node, t, duration = 0.3) =>
    tl.fromTo(
      node,
      { scaleY: 0, opacity: 0, transformOrigin: "50% 100%" },
      { scaleY: 1, opacity: 1, duration, ease: "back.out(1.7)" },
      t,
    );
  // A short hit: the node jumps around its place and settles.
  fx.shake = (node, t, amount = 18) => {
    const offsets = [[1, -0.6], [-0.8, 0.7], [0.6, 0.4], [-0.4, -0.3], [0.2, 0.2], [0, 0]];
    offsets.forEach(([x, y], i) => tl.set(node, { x: x * amount, y: y * amount }, t + i * 0.035));
  };
  // A number that rolls from one value to another; format turns the value into text.
  fx.count = (node, t, from, to, duration, format) => {
    const value = { v: from };
    node.textContent = format(from);
    tl.to(value, { v: to, duration, ease: "power2.out", onUpdate: () => (node.textContent = format(value.v)) }, t);
  };
  // Something that is simply not there until its moment.
  fx.show = (node, t) => {
    node.style.visibility = "hidden";
    tl.set(node, { autoAlpha: 1 }, t);
  };

  // ---- lettering ----
  // Hand-scribbled lettering that draws itself: three loose outlines of each letter, then the letters boil.
  R.scribble = function (text, options) {
    // `w` caps the width: the word is drawn smaller if it would not fit.
    const fit = options.w ? options.w / (R.measure(text, "hand") / 100 + 0.5) : Infinity;
    const size = Math.min(options.size, fit);
    const color = options.color;
    const random = R.rng(options.seed || 1);
    const scale = size / 100;
    const pad = size * 0.25;
    const width = R.measure(text, "hand") * scale + pad * 2;
    const height = size * 1.15;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "scribble");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    const dash = size * 7;
    const passes = [
      { width: size * 0.034, x: 0, y: 0, rotate: 0 },
      { width: size * 0.016, x: size * 0.02, y: -size * 0.015, rotate: -1.4 },
      { width: size * 0.012, x: -size * 0.015, y: size * 0.02, rotate: 1.6 },
    ];
    const layers = passes.map((pass) => {
      const group = document.createElementNS(NS, "g");
      svg.appendChild(group);
      const letters = [];
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") continue;
        const letter = document.createElementNS(NS, "text");
        letter.textContent = text[i];
        letter.setAttribute("x", pad + R.measure(text.slice(0, i), "hand") * scale + pass.x + (random() - 0.5) * size * 0.02);
        letter.setAttribute("y", size * 0.86 + pass.y);
        letter.setAttribute("font-family", "Reenie Beanie");
        letter.setAttribute("font-size", size);
        letter.setAttribute("fill", "none");
        letter.setAttribute("stroke", color);
        letter.setAttribute("stroke-width", pass.width);
        letter.setAttribute("stroke-linecap", "round");
        letter.setAttribute("stroke-linejoin", "round");
        letter.setAttribute("stroke-dasharray", dash);
        letter.setAttribute("stroke-dashoffset", dash);
        group.appendChild(letter);
        letters.push(letter);
      }
      return { group, letters, pass };
    });
    return {
      el: svg,
      // Draw the word from t over `duration`, then keep it alive until `until`.
      draw(t, duration, until) {
        layers.forEach((layer, k) => {
          const step = (duration * 0.55) / Math.max(1, layer.letters.length - 1);
          layer.letters.forEach((letter, i) =>
            tl.to(letter, { strokeDashoffset: 0, duration: duration * 1.6, ease: "none" }, t + i * step + k * 0.03),
          );
          for (let at = t, n = 0; at < until; at += 0.13, n++) {
            tl.set(
              layer.group,
              {
                rotation: layer.pass.rotate + (random() - 0.5) * 1.6,
                x: (random() - 0.5) * size * 0.022,
                y: (random() - 0.5) * size * 0.022,
                svgOrigin: `${width / 2} ${height / 2}`,
              },
              at,
            );
          }
        });
      },
    };
  };

  // A scribbled line through or under a node (a strike or an underline). `at` is 0..1 of the node's height.
  R.mark = function (node, t, options) {
    const o = Object.assign({ at: 0.52, color: COLOR.red, weight: 16, duration: 0.22, seed: 7 }, options);
    const random = R.rng(o.seed);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "mark");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    const y = o.at * 100;
    const wobble = () => y + (random() - 0.5) * 14;
    const d = `M0 ${wobble()} L100 ${wobble()} L3 ${wobble()} L97 ${wobble()}`;
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", o.color);
    path.setAttribute("stroke-width", o.weight);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(path);
    node.appendChild(svg);
    // Wiped on from the left; the negative insets keep the thick stroke from being trimmed.
    tl.fromTo(svg, { clipPath: "inset(-60% 105% -60% -5%)" }, { clipPath: "inset(-60% -5% -60% -5%)", duration: o.duration, ease: "power2.out" }, t);
    return svg;
  };

  // A pixel chart that walks up or down: returns { el, bars } with the bars hidden until revealed.
  R.chart = function (direction, count, cell, color, seed) {
    const random = R.rng(seed || 11);
    const box = el("div");
    box.style.cssText = `display:flex;align-items:flex-end;gap:${cell}px;height:${cell * 16}px`;
    const bars = [];
    let level = direction > 0 ? 2 : 14;
    for (let i = 0; i < count; i++) {
      level = Math.max(1, Math.min(16, level + direction * (random() < 0.75 ? 1 + Math.round(random()) : -1)));
      const bar = el("div", "", box);
      bar.style.cssText = `width:${cell * 2}px;height:${level * cell}px;background:${color};flex-shrink:0`;
      bars.push(bar);
    }
    return { el: box, bars };
  };


  // ---- building the timeline ----
  R.build = function (timeline) {
    tl = R.tl = timeline;
    const root = document.getElementById("root");
    const shots = R.shots;
    shots.forEach((shot) => (shot.t0 = shot.options.at !== undefined ? shot.options.at : cap(shot.options.caps[0]).start));
    shots.sort((a, b) => a.t0 - b.t0);
    shots.forEach((shot, i) => (shot.t1 = i < shots.length - 1 ? shots[i + 1].t0 : T.duration_seconds));

    shots.forEach((shot) => {
      const { options, t0, t1 } = shot;
      const ground = GROUND[options.ground];
      // A look is a CSS class on the shot; it restyles the caption and anything else the look owns.
      const box = el("div", "shot" + (options.look ? " look-" + options.look : ""), root);
      box.style.background = ground.bg;
      box.style.color = ground.fg;
      const cam = el("div", "cam", box);
      const punch = el("div", "punch", cam);
      const layer = el("div", "layer", punch);
      const stage = el("div", "stage", punch);

      tl.set(box, { autoAlpha: 1 }, t0);
      // A shot whose successor wipes in over it (`over` seconds) stays up until the wipe is done.
      const next = shots[shots.indexOf(shot) + 1];
      if (next) tl.set(box, { autoAlpha: 0 }, t1 + (next.options.over || 0));
      // Every shot lands with a small punch and then keeps pushing in slowly, so nothing ever sits still.
      tl.fromTo(cam, { scale: 1 }, { scale: 1.07, duration: t1 - t0, ease: "none" }, t0);
      tl.fromTo(punch, { scale: 1.09 }, { scale: 1, duration: 0.24, ease: "power3.out" }, t0);

      const s = {
        t0,
        t1,
        fg: ground.fg,
        bg: ground.bg,
        box,
        punch,
        layer,
        stage,
        cap,
        // Start time of word i (from 0) of lyric line n.
        w: (n, i) => cap(n).words[i].start,
        // Start times of every word of line n. Words the listener gave the same time (it happens in fast
        // passages) are spread evenly up to the next word that has its own time, so each still lands apart.
        times(n) {
          const words = cap(n).words;
          const out = words.map((word) => word.start);
          for (let i = 0; i < out.length; ) {
            let j = i;
            while (j + 1 < out.length && words[j + 1].start === words[i].start) j++;
            const next = j + 1 < out.length ? words[j + 1].start : cap(n).end;
            for (let k = i; k <= j; k++) out[k] = words[i].start + ((next - words[i].start) * (k - i)) / (j - i + 1);
            i = j + 1;
          }
          return out;
        },
        // Any element as a row in the stack.
        add(node) {
          const row = el("div", "row", stage);
          row.appendChild(node);
          return row;
        },
        // One row of type, sized so it is `w` px wide (never taller than `max` px).
        row(text, o) {
          return s.words([text], o)[0];
        },
        // One row made of separately animated words. Returns the word elements.
        words(list, o) {
          // font: any key of FONT. upper: false keeps the text as written (the default is capitals).
          o = Object.assign({ w: 864, max: 420, font: "display", upper: true }, o);
          const row = el("div", "row" + (o.font === "text" ? " text" : ""), stage);
          if (o.font !== "display" && o.font !== "text") {
            row.style.fontFamily = FONT[o.font];
            row.style.fontWeight = WEIGHT[o.font];
            row.style.lineHeight = 1.05;
          }
          if (!o.upper) row.style.textTransform = "none";
          const gap = o.font === "display" ? 0.22 : o.font === "text" ? 0.3 : 0.6;
          const shown = (word) => (o.upper ? word.toUpperCase() : word);
          const natural = list.reduce((sum, word) => sum + R.measure(shown(word), o.font), 0) + (list.length - 1) * gap * 100;
          const size = Math.min(o.max, (100 * o.w) / natural);
          row.style.fontSize = size + "px";
          row.style.gap = gap + "em";
          if (o.color) row.style.color = o.color;
          return list.map((word) => {
            const span = el("span", "word" + (o.cls ? " " + o.cls : ""), row);
            span.textContent = word;
            return span;
          });
        },
        scribble(text, o) {
          const scribble = R.scribble(text, Object.assign({ color: ground.fg, w: 860 }, o));
          s.add(scribble.el);
          return scribble;
        },
        // Place an element with its centre at x, y of the 1080x1920 frame, outside the stack.
        put(node, x, y, rotate) {
          const pin = el("div", "pin", layer);
          pin.style.left = x + "px";
          pin.style.top = y + "px";
          if (rotate) pin.style.rotate = rotate + "deg";
          pin.appendChild(node);
          return node;
        },
        pix: (name, cell, o) => PIX.make(name, cell, o),
        // Sprites that fall through the frame from t for `duration`.
        rain(name, cell, count, t, duration, seed) {
          const random = R.rng(seed || 5);
          for (let i = 0; i < count; i++) {
            const node = s.put(PIX.make(name, cell), 120 + random() * 840, -160);
            const start = t + random() * duration * 0.55;
            tl.fromTo(
              node,
              { y: 0, rotation: random() * 60 - 30 },
              { y: 2300, rotation: random() * 240 - 120, duration: 0.9 + random() * 0.5, ease: "power1.in" },
              start,
            );
          }
        },
      };

      if (options.caption !== false) {
        const caption = el("div", "caption", box);
        options.caps.forEach((n, i) => {
          const line = el("div", "capline", caption);
          const next = options.caps[i + 1];
          if (i > 0) {
            line.style.visibility = "hidden";
            tl.set(line, { autoAlpha: 1 }, cap(n).start);
          }
          if (next) tl.set(line, { autoAlpha: 0 }, cap(next).start);
          cap(n).words.forEach((word, k) => {
            const span = el("span", "", line);
            span.textContent = word.text;
            // The first word of a shot is already there on the cut.
            if (i === 0 && k === 0) return;
            tl.fromTo(span, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, word.start);
          });
        });
      }
      R.ink.tools(s, Math.round(t0 * 1000) + 5);
      shot.build(s);
      R.ink.finish(s, options);
    });
  };
})();
