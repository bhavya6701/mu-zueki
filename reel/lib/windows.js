// The "windows" look: a paper-coloured desktop of hairline windows, monospace type, meters and a cursor
// that clicks things open. Use with shots whose options carry look: "windows" and ground "paper" or "term".
(function () {
  const T = window.TIMELINE;
  const NS = "http://www.w3.org/2000/svg";
  const { fx } = R;
  const BLUE = "#3F74DE";
  const ORANGE = "#CF700C";
  const W = (R.win = { BLUE, ORANGE });

  function el(tag, className, parent, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // A window: a title bar and a body. Returns { el, body, bar }; put it with s.put or s.add.
  W.frame = function (title, options) {
    const o = Object.assign({ w: 0, h: 0, dark: false, pad: 22 }, options);
    const box = el("div", "win" + (o.dark ? " dark" : ""));
    // Windows pile up on purpose, like a busy desktop.
    box.setAttribute("data-layout-allow-overlap", "");
    if (o.w) box.style.width = o.w + "px";
    const bar = el("div", "win-bar", box);
    el("span", "", bar, title);
    el("span", "", bar, "×");
    const body = el("div", "win-body", box);
    [bar, body, ...bar.children].forEach((node) => node.setAttribute("data-layout-allow-overlap", ""));
    body.style.padding = o.pad + "px";
    if (o.h) body.style.height = o.h + "px";
    return { el: box, body, bar };
  };
  // A window opens the way they do on a desktop: it is simply there, a touch small, then full size.
  W.open = (frame, t) => R.tl.fromTo(frame.el || frame, { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: "power3.out" }, t);
  W.close = (frame, t) => R.tl.to(frame.el || frame, { scale: 0.9, opacity: 0, duration: 0.1, ease: "power2.in" }, t);

  // A card holding one big letter or figure, like a glyph in a font editor.
  // options: { color, size, dark, title }. Returns the frame with .letter, the element holding the text.
  W.glyph = function (text, options) {
    const o = Object.assign({ color: BLUE, size: 220, dark: false }, options);
    const frame = W.frame(o.title || text.toLowerCase() + ".glyph", { pad: 6, dark: o.dark });
    frame.letter = el("div", "win-glyph", frame.body, text);
    frame.letter.style.fontSize = o.size + "px";
    frame.letter.style.color = o.color;
    return frame;
  };
  // A row of glyph cards, one per text, cycling through the colours. Returns the frames.
  W.cards = function (s, texts, colors, options) {
    const box = el("div", "win-cards");
    const frames = texts.map((text, i) => {
      const frame = W.glyph(text, Object.assign({}, options, { color: colors[i % colors.length] }));
      box.appendChild(frame.el);
      return frame;
    });
    s.add(box);
    return frames;
  };

  // A list of label/value lines, like a metrics panel. rows: [[label, value, colour?], ...]
  W.table = function (title, rows, options) {
    const frame = W.frame(title, options);
    frame.rows = rows.map(([label, value, color]) => {
      const row = el("div", "win-row", frame.body);
      el("span", "", row, label);
      const cell = el("span", "", row, value);
      if (color) cell.style.color = color;
      return row;
    });
    return frame;
  };
  // Reveal a table's lines one after another from t.
  W.type = (frame, t, step) => frame.rows.forEach((row, i) => fx.show(row, t + i * (step || 0.06)));

  // An installer-style progress bar that fills from t0 to t1 and counts its percentage.
  W.progress = function (title, t0, t1, options) {
    const o = Object.assign({ w: 420, to: 100, label: "loading" }, options);
    const frame = W.frame(title, { w: o.w, pad: 16, dark: o.dark });
    const track = el("div", "win-track", frame.body);
    const fill = el("div", "win-fill", track);
    if (o.color) fill.style.background = o.color;
    const note = el("div", "win-note", frame.body);
    const name = el("span", "", note, o.label);
    const percent = el("span", "", note, "0%");
    R.tl.fromTo(fill, { scaleX: 0 }, { scaleX: o.to / 100, duration: t1 - t0, ease: "none" }, t0);
    fx.count(percent, t0, 0, o.to, t1 - t0, (v) => Math.round(v) + "%");
    frame.label = name;
    return frame;
  };

  // A spectrum meter whose bars jump on every beat and half beat between t0 and t1.
  W.spectrum = function (title, t0, t1, options) {
    const o = Object.assign({ w: 460, h: 170, bars: 22, color: BLUE, dark: true, seed: 3, fall: 0 }, options);
    const frame = W.frame(title, { w: o.w, dark: o.dark, pad: 16 });
    const meter = el("div", "win-meter", frame.body);
    meter.style.height = o.h + "px";
    const random = R.rng(o.seed);
    const bars = [];
    for (let i = 0; i < o.bars; i++) {
      const bar = el("div", "", meter);
      bar.style.background = o.color;
      bars.push(bar);
    }
    const shape = (i) => 0.25 + 0.75 * Math.sin((Math.PI * (i + 0.5)) / o.bars);
    const times = [];
    T.beats.forEach((beat) => [beat, beat + T.seconds_per_beat / 2].forEach((time) => time >= t0 && time < t1 && times.push(time)));
    gsap.set(bars, { scaleY: 0.08, transformOrigin: "50% 100%" });
    times.forEach((time, n) => {
      // `fall` (0 to 1) tilts the meter down over its life, for a day that is selling off.
      const level = 1 - o.fall * (n / Math.max(1, times.length - 1));
      bars.forEach((bar, i) => {
        const peak = Math.max(0.06, shape(i) * level * (0.45 + random() * 0.55) * (n % 2 ? 0.7 : 1));
        R.tl.to(bar, { scaleY: peak, duration: 0.05, ease: "power2.out" }, time);
        R.tl.to(bar, { scaleY: peak * 0.45, duration: T.seconds_per_beat / 2 - 0.06, ease: "power1.in" }, time + 0.05);
      });
    });
    return frame;
  };

  // A line chart drawn with a hairline, from a list of values (first to last). Draws itself from t0 to t1.
  W.chart = function (title, values, t0, t1, options) {
    const o = Object.assign({ w: 460, h: 200, color: BLUE, dark: false }, options);
    const frame = W.frame(title, { w: o.w, dark: o.dark, pad: 16 });
    const svg = document.createElementNS(NS, "svg");
    const inner = o.w - 32 - 4;
    svg.setAttribute("width", inner);
    svg.setAttribute("height", o.h);
    svg.style.display = "block";
    const low = Math.min(...values);
    const high = Math.max(...values);
    const points = values.map((v, i) => [(i / (values.length - 1)) * inner, 8 + (1 - (v - low) / (high - low || 1)) * (o.h - 16)]);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M" + points.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L"));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", o.color);
    path.setAttribute("stroke-width", 5);
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("pathLength", 1);
    path.setAttribute("stroke-dasharray", "1 1");
    svg.appendChild(path);
    frame.body.appendChild(svg);
    R.tl.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: t1 - t0, ease: "power1.inOut" }, t0);
    return frame;
  };

  // The same word stacked, each copy heavier than the last, one copy per `step` from t. Returns the rows.
  W.stack = function (s, word, count, t, step, options) {
    const o = Object.assign({ w: 700 }, options);
    const rows = [];
    for (let i = 0; i < count; i++) {
      const row = s.row(word, { w: o.w, font: i > count / 2 ? "monoBold" : "mono", upper: false, max: 200 });
      row.style.webkitTextStroke = ((i % Math.ceil(count / 2 + 0.5)) * 0.018).toFixed(3) + "em currentColor";
      if (o.color && i === count - 1) row.style.color = o.color;
      fx.show(row, t + i * step);
      rows.push(row);
    }
    return rows;
  };

  // A patch of faint machine text behind everything, drifting slowly through the shot.
  W.ascii = function (s, seed) {
    const random = R.rng(seed || 9);
    // Drawn on a canvas: it is texture, not text to be read.
    const box = document.createElement('canvas');
    box.className = 'win-ascii';
    box.width = 1080;
    box.height = 2050;
    const pen = box.getContext('2d');
    pen.font = '400 29px "JetBrains Mono"';
    pen.fillStyle = BLUE;
    const glyphs = '01l:.+1010oO|i1:01';
    for (let row = 0; row < 64; row++) {
      let line = '';
      for (let col = 0; col < 62; col++) line += glyphs[Math.floor(random() * glyphs.length)];
      pen.fillText(line, 0, 28 + row * 32);
    }
    const spots = [0, 1, 2].map(() => 'radial-gradient(ellipse ' + (260 + random() * 240) + 'px ' + (220 + random() * 260) + 'px at ' + random() * 100 + '% ' + (10 + random() * 80) + '%, #000 35%, transparent 72%)');
    box.style.maskImage = spots.join(',');
    box.style.webkitMaskImage = spots.join(',');
    s.layer.insertBefore(box, s.layer.firstChild);
    R.tl.fromTo(box, { y: 0 }, { y: -60, duration: s.t1 - s.t0, ease: 'none' }, s.t0);
    return box;
  };

  // The cursor. stops: [{ t, x, y, click? }]: it arrives at each stop at time t; a click dips it and
  // throws a small ring, which is the cue for whatever opens there.
  // A stop may aim at an element instead of x and y: { t, on: node, dx?, dy? } points at its centre.
  W.cursor = function (s, stops) {
    s.later.push(() => drawCursor(s, stops.map((stop) => {
      if (!stop.on) return stop;
      const box = s.box(stop.on);
      return Object.assign({}, stop, { x: box.x + box.w / 2 + (stop.dx || 0), y: box.y + box.h / 2 + (stop.dy || 0) });
    })));
  };
  function drawCursor(s, stops) {
    const arrow = document.createElementNS(NS, "svg");
    arrow.setAttribute("width", 46);
    arrow.setAttribute("height", 64);
    arrow.setAttribute("viewBox", "0 0 23 32");
    arrow.style.cssText = "position:absolute;left:0;top:0;z-index:5;overflow:visible";
    const shape = document.createElementNS(NS, "path");
    shape.setAttribute("d", "M2 2 L2 25 L8 19.5 L12 29 L16 27.3 L12 18 L20 18 Z");
    shape.setAttribute("fill", "#111111");
    shape.setAttribute("stroke", "#F4F3EC");
    shape.setAttribute("stroke-width", 1.6);
    shape.setAttribute("stroke-linejoin", "round");
    arrow.appendChild(shape);
    s.punch.appendChild(arrow);
    gsap.set(arrow, { x: stops[0].x, y: stops[0].y });
    stops.forEach((stop, i) => {
      if (i > 0) {
        const travel = Math.min(0.32, Math.max(0.12, stop.t - stops[i - 1].t - 0.04));
        R.tl.to(arrow, { x: stop.x, y: stop.y, duration: travel, ease: "power3.inOut" }, stop.t - travel);
      }
      if (!stop.click) return;
      R.tl.to(arrow, { scale: 0.8, duration: 0.05, ease: "power2.out", transformOrigin: "10% 10%" }, stop.t);
      R.tl.to(arrow, { scale: 1, duration: 0.12, ease: "power2.out" }, stop.t + 0.05);
      const ring = el("div", "win-click", s.punch);
      ring.style.left = stop.x + "px";
      ring.style.top = stop.y + "px";
      R.tl.fromTo(ring, { scale: 0.2, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.3, ease: "power2.out" }, stop.t);
    });
  }
})();
