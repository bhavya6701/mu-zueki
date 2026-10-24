// The "film" look: a slow night film for a slow sung song. The day's footage fills the frame; over it
// run drawn rain, a vignette and film grain, so clips from different places share one weather. The lyric
// is set in a thin serif, each word fading up as it is sung, with one word in sodium yellow; a held note
// gets its word set large, growing for as long as the note lasts. Shots dip through black instead of
// punching in. Figures live on objects of the place: an LED price signboard, a pump counter, a card.
// Shots carry look: "film". Reference: reel/templates/film.md.
(function () {
  const T = window.TIMELINE;
  const BONE = "#F4EFE6";
  const SODIUM = "#F5D547";
  const AMBER = "#FFB52E";
  const GREEN = "#5CFF8F";
  const RED = "#FF5A4D";
  const F = (R.film = { BONE, SODIUM, AMBER, GREEN, RED });

  Object.assign(R.FONT, { serif: '"Instrument Serif"', serifi: '"Instrument Serif"' });
  Object.assign(R.WEIGHT, { serif: 400, serifi: "italic 400" });
  R.fontFaces.push('400 100px "Instrument Serif"', 'italic 400 100px "Instrument Serif"');

  function el(tag, css, parent, text) {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (parent) parent.appendChild(node);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  // Decoration is allowed to sit under and over other things.
  const loose = (node) => (node.setAttribute("data-layout-allow-overlap", ""), node.setAttribute("data-layout-allow-overflow", ""), node);
  F.box = (css, parent, text) => el("div", css, parent, text);
  const SHADOW = "0 2px 22px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.7)";

  // The first downbeat after a time, and the beats inside a shot.
  F.downbeat = (time) => T.downbeats.find((beat) => beat > time) || time;
  // Just after the last word of lyric line n starts.
  F.lastWord = (n) => { const words = T.captions[n - 1].words; return words[words.length - 1].start + 0.15; };
  F.beats = (s, list = T.beats) => list.filter((beat) => beat >= s.t0 + 0.05 && beat < s.t1 - 0.05);

  // ---- the weather over every shot ----
  // Film grain: one tile of noise over the whole reel, moved to a new place every other frame.
  function grain() {
    const random = R.rng(4711);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    const image = context.createImageData(256, 256);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 128 + (random() - 0.5) * 150;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    const node = loose(el("div", `position:absolute;left:-256px;top:-256px;width:1592px;height:2432px;z-index:40;pointer-events:none;opacity:0.11;mix-blend-mode:overlay;background:url(${canvas.toDataURL()})`, document.getElementById("root")));
    for (let t = 0; t < T.duration_seconds; t += 1 / 20) R.tl.set(node, { x: Math.round(random() * 250), y: Math.round(random() * 250) }, t);
  }

  // Rain streaks falling through a shot, already in flight when the shot opens.
  // `from`: the rain is only seen from that time (a shot that goes from indoors to the street).
  F.rain = function (s, count, seed, from) {
    const random = R.rng(seed || Math.round(s.t0 * 1000) + 3);
    const holder = loose(el("div", "position:absolute;inset:0;rotate:7deg;scale:1.25;pointer-events:none", s.layer));
    if (from !== undefined) R.fx.show(holder, from);
    for (let i = 0; i < count; i++) {
      const length = 90 + random() * 170;
      const node = el("div", `position:absolute;left:${Math.round(random() * 1080)}px;top:${-length - 20}px;width:${random() < 0.3 ? 3 : 2}px;height:${Math.round(length)}px;` +
        `background:linear-gradient(to bottom, rgba(215,230,255,0), rgba(215,230,255,${(0.16 + random() * 0.26).toFixed(2)}))`, holder);
      const fall = 0.5 + random() * 0.4;
      const first = random() * 2200;
      // The first pass starts part of the way down, so the rain does not begin with the cut.
      R.tl.fromTo(node, { y: first }, { y: 2300, duration: fall * (1 - first / 2300), ease: "none" }, s.t0);
      const wait = random() * 0.5;
      const start = s.t0 + fall * (1 - first / 2300) + wait;
      const passes = Math.ceil((s.t1 - start) / (fall + wait));
      if (passes > 0) R.tl.fromTo(node, { y: 0 }, { y: 2300, duration: fall, ease: "none", repeat: passes - 1, repeatDelay: wait, immediateRender: false }, start);
    }
  };

  // A film shot over the day's footage: vignette, a dark foot under the lyric, rain, and a dip through
  // black at each end. o.rain: streaks (0 for none), o.dip: [in, out] seconds, o.foot: darkness under the lyric.
  let grained = false;
  F.shot = function (caps, build, o) {
    o = Object.assign({ rain: 26, dip: [0.32, 0.32], foot: 0.6, ground: "clear", pulse: 0.05 }, o);
    R.shot(Object.assign({ caps, ground: o.ground, look: "film", caption: false, punch: false }, o.at !== undefined ? { at: o.at } : {}), (s) => {
      if (!grained) (grained = true), grain();
      loose(el("div", `position:absolute;inset:0;background:radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.62) 100%)`, s.layer));
      if (o.foot) loose(el("div", `position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 48%, rgba(0,0,0,${o.foot}) 70%, rgba(0,0,0,${Math.min(0.9, o.foot + 0.2)}) 100%)`, s.layer));
      if (o.rain) F.rain(s, o.rain);
      const veil = loose(el("div", "position:absolute;inset:0;background:#000;z-index:5;opacity:0;pointer-events:none", s.box));
      const [dipIn, dipOut] = o.dip;
      if (dipIn && s.t0 > 0.05) R.tl.fromTo(veil, { opacity: 0.92 }, { opacity: 0, duration: dipIn, ease: "power1.out", immediateRender: false }, s.t0);
      if (dipOut && s.t1 < T.duration_seconds - 0.05) R.tl.fromTo(veil, { opacity: 0 }, { opacity: 0.92, duration: dipOut, ease: "power1.in", immediateRender: false }, s.t1 - dipOut);
      s.veil = veil;
      // the picture breathes with the bar
      if (o.pulse) F.beats(s, T.downbeats).forEach((beat) => F.swell(s, beat, o.pulse));
      build(s);
    });
  };

  // ---- the lyric ----
  // Lyric line n in the serif, each word fading up on the time it is sung. o.hi: indexes of the words in
  // yellow, o.it: indexes in italic, o.y: top of the line, o.size, o.out: when the line fades (default: with the shot).
  F.line = function (s, n, o) {
    o = Object.assign({ y: 1190, size: 84, hi: [], it: [], w: 880 }, o);
    const words = s.cap(n).words;
    const times = s.times(n);
    const holder = el("div", `position:absolute;left:${(1080 - o.w) / 2}px;width:${o.w}px;top:${o.y}px;display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start;gap:0 0.26em;` +
      `font-family:"Instrument Serif";font-weight:400;font-size:${o.size}px;line-height:1.08;letter-spacing:0.005em;color:${BONE};text-shadow:${SHADOW};text-transform:none;z-index:3`, s.layer);
    const nodes = words.map((word, i) => {
      const span = el("span", "display:inline-block;white-space:nowrap", holder, word.text);
      if (o.hi.includes(i)) span.style.color = SODIUM;
      if (o.it.includes(i)) span.style.fontStyle = "italic";
      // The first word of the song is there on the first frame.
      if (times[i] > 0.05) R.tl.fromTo(span, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, Math.max(0, times[i] - 0.06));
      return span;
    });
    if (o.out !== undefined) R.tl.to(holder, { opacity: 0, duration: 0.4, ease: "power1.in" }, o.out);
    nodes.holder = holder;
    return nodes;
  };

  // A held word set large: it fades up at t and keeps growing until `until`, then lets go.
  F.big = function (s, text, t, until, o) {
    o = Object.assign({ y: 760, w: 860, max: 520, color: SODIUM, italic: true, grow: 0.14 }, o);
    const size = Math.min(o.max, (100 * o.w) / R.measure(text, o.italic ? "serifi" : "serif"));
    const node = el("div", `font-family:"Instrument Serif";font-style:${o.italic ? "italic" : "normal"};font-size:${size}px;line-height:1;white-space:nowrap;color:${o.color};text-transform:none;` +
      // a slight colour fringe, as an old lens gives
      `text-shadow:-3px 0 0 rgba(255,60,60,0.28), 3px 0 0 rgba(60,200,255,0.28), 0 4px 40px rgba(0,0,0,0.8)`, null, text);
    s.put(node, 540, o.y);
    node.style.visibility = "hidden";
    R.tl.fromTo(node, { autoAlpha: 0, scale: 1 - o.grow / 2, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" }, t);
    R.tl.fromTo(node, { scale: 1 - o.grow / 2 }, { scale: 1 + o.grow / 2, duration: until - t, ease: "none", immediateRender: false }, t);
    R.tl.to(node, { autoAlpha: 0, duration: 0.45, ease: "power1.in" }, until - 0.45);
    return node;
  };

  // A soft swell of light on a time (a downbeat, an instrument coming in).
  F.swell = function (s, t, strength = 0.1, color = "255,225,170") {
    const node = loose(el("div", `position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse 90% 55% at 50% 30%, rgba(${color},1), rgba(${color},0) 70%)`, s.layer));
    R.tl.fromTo(node, { opacity: 0 }, { opacity: strength, duration: 0.12, ease: "power2.out", immediateRender: false }, t);
    R.tl.to(node, { opacity: 0, duration: 0.9, ease: "power2.out" }, t + 0.12);
  };

  // ---- things of the place ----
  // Something that comes on like a tube or a sign: a stutter, then steady.
  F.lightUp = function (node, t) {
    node.style.visibility = "hidden";
    [[0, 0.85], [0.05, 0.15], [0.1, 0.9], [0.16, 0.4], [0.22, 1]].forEach(([dt, alpha]) => R.tl.set(node, { autoAlpha: alpha }, t + dt));
  };
  // A failing light between two times; it ends at `rest`.
  F.flicker = function (node, from, to, rest = 0.3, seed = 9) {
    const random = R.rng(seed);
    for (let t = from; t < to; t += 0.05 + random() * 0.16) R.tl.set(node, { opacity: random() < 0.45 ? 0.2 + random() * 0.3 : 0.85 + random() * 0.15 }, t);
    R.tl.set(node, { opacity: rest }, to);
  };
  F.fade = (node, t, duration = 0.4) => R.tl.to(node, { autoAlpha: 0, duration, ease: "power1.in" }, t);
  F.rise = function (node, t, duration = 0.55) {
    node.style.visibility = "hidden";
    R.tl.fromTo(node, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration, ease: "power2.out" }, t);
  };

  // The station's LED price signboard. rows: [{ label, value, note, color }]. Returns { el, rows, values, notes }.
  F.board = function (rows, o) {
    o = Object.assign({ w: 800, size: 96 }, o);
    const board = el("div", `width:${o.w}px;padding:30px 34px 34px;background:linear-gradient(180deg,#101316,#07090B);border:3px solid #2B3036;border-radius:20px;` +
      "box-shadow:0 40px 90px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06);display:flex;flex-direction:column;gap:22px;text-transform:none");
    const out = { el: board, rows: [], values: [], notes: [] };
    rows.forEach((row) => {
      const line = el("div", "display:flex;flex-direction:column;gap:6px", board);
      const head = el("div", `display:flex;justify-content:space-between;align-items:baseline;font-family:"Space Grotesk";font-weight:700;font-size:30px;letter-spacing:0.16em;color:#AEB6C0`, line);
      el("span", "", head, row.label);
      const note = el("span", `font-family:"JetBrains Mono";font-weight:800;letter-spacing:0.02em;font-size:34px;color:${row.noteColor || GREEN};text-shadow:0 0 14px ${row.noteColor || GREEN}88`, head, row.note || "");
      const color = row.color || AMBER;
      const value = el("div", `position:relative;font-family:"JetBrains Mono";font-weight:800;font-size:${o.size}px;line-height:1.02;letter-spacing:0.02em;white-space:nowrap;color:${color};text-shadow:0 0 22px ${color}AA, 0 0 4px ${color}`, line, row.value);
      // the dots of the display
      loose(el("div", "position:absolute;inset:0;background-image:radial-gradient(circle, rgba(0,0,0,0) 46%, rgba(4,6,8,0.7) 52%);background-size:7px 7px;pointer-events:none", value));
      out.rows.push(line);
      out.values.push(value);
      out.notes.push(note);
    });
    return out;
  };

  // The pump's counter: two windows of pale digits. Returns { el, top, bottom }.
  F.counter = function (labels, o) {
    o = Object.assign({ w: 720 }, o);
    const body = el("div", `width:${o.w}px;padding:28px;background:linear-gradient(180deg,#23282D,#14181C);border:3px solid #3A4048;border-radius:16px;box-shadow:0 40px 90px rgba(0,0,0,0.6);display:flex;flex-direction:column;gap:20px;text-transform:none`);
    const out = { el: body };
    ["top", "bottom"].forEach((key, i) => {
      const cell = el("div", "display:flex;flex-direction:column;gap:8px", body);
      el("div", `font-family:"Space Grotesk";font-weight:700;font-size:26px;letter-spacing:0.18em;color:#9AA3AD`, cell, labels[i]);
      out[key] = el("div", `padding:10px 22px;background:#0A120D;border:2px solid #05080A;border-radius:8px;text-align:right;font-family:"JetBrains Mono";font-weight:800;font-size:${i ? 64 : 104}px;line-height:1.05;color:#E4F2CE;text-shadow:0 0 16px rgba(190,255,170,0.45)`, cell, "");
    });
    return out;
  };

  // A weather-style card for the night's indexes (after the "Today" weather card by jamik-dev on Uiverse.io, MIT).
  // rows: [{ name, value, up }]. Returns { el, rows }.
  F.card = function (title, rows, o) {
    o = Object.assign({ w: 680 }, o);
    const card = el("div", `width:${o.w}px;padding:34px 40px 38px;border-radius:44px;background:linear-gradient(160deg, rgba(34,52,84,0.92), rgba(12,20,36,0.94));border:1.5px solid rgba(255,255,255,0.16);` +
      "box-shadow:0 40px 90px rgba(0,0,0,0.6);display:flex;flex-direction:column;gap:20px;text-transform:none;color:#F4EFE6");
    const head = el("div", "display:flex;justify-content:space-between;align-items:center", card);
    el("div", `font-family:"Instrument Serif";font-size:76px;line-height:1`, head, title);
    // a cloud with rain under it
    head.insertAdjacentHTML("beforeend", '<svg width="110" height="100" viewBox="0 0 110 100" fill="none"><path d="M30 58a20 20 0 0 1 4-39 26 26 0 0 1 50 6 17 17 0 0 1-2 33z" fill="#C9D6EA"/>' +
      '<g stroke="#8FC1FF" stroke-width="5" stroke-linecap="round"><path d="M36 70l-6 16"/><path d="M56 70l-6 16"/><path d="M76 70l-6 16"/></g></svg>');
    const out = { el: card, rows: [] };
    rows.forEach((row) => {
      const line = el("div", `display:flex;justify-content:space-between;align-items:baseline;padding-top:18px;border-top:1.5px solid rgba(255,255,255,0.14);font-family:"Space Grotesk";font-weight:700;font-size:40px`, card);
      el("span", "letter-spacing:0.04em", line, row.name);
      el("span", `font-family:"JetBrains Mono";font-weight:800;color:${row.up ? GREEN : RED}`, line, (row.up ? "▲ " : "▼ ") + row.value);
      out.rows.push(line);
    });
    return out;
  };

  // A notice for what comes tomorrow: a label and a list of names. Returns { el, items }.
  F.notice = function (label, names, o) {
    o = Object.assign({ w: 780 }, o);
    const body = el("div", `width:${o.w}px;padding:30px 38px 34px;border-radius:34px;background:rgba(14,16,20,0.86);border:1.5px solid rgba(255,255,255,0.16);box-shadow:0 40px 90px rgba(0,0,0,0.6);display:flex;flex-direction:column;gap:12px;text-transform:none`);
    el("div", `font-family:"Space Grotesk";font-weight:700;font-size:28px;letter-spacing:0.2em;color:${SODIUM}`, body, label);
    const out = { el: body, items: [] };
    names.forEach((name) => out.items.push(el("div", `font-family:"Instrument Serif";font-size:66px;line-height:1.08;color:${BONE}`, body, name)));
    return out;
  };

  // A cassette whose reels turn (after the cassette card by Praashoo7 on Uiverse.io, MIT). Returns { el, reels }.
  F.cassette = function (label, o) {
    o = Object.assign({ w: 620 }, o);
    const h = Math.round(o.w * 0.62);
    const body = el("div", `position:relative;width:${o.w}px;height:${h}px;border-radius:26px;background:linear-gradient(180deg,#26282C,#131416);border:3px solid #3A3D42;box-shadow:0 40px 90px rgba(0,0,0,0.7)`);
    el("div", `position:absolute;left:6%;right:6%;top:8%;height:30%;border-radius:10px;background:#E9E2CF;display:flex;align-items:center;justify-content:center;font-family:"Instrument Serif";font-style:italic;font-size:${Math.round(o.w * 0.085)}px;color:#1A1A1A;text-transform:none`, body, label);
    const window_ = el("div", `position:absolute;left:18%;right:18%;top:46%;height:34%;border-radius:${h}px;background:#07080A;border:3px solid #44484E;display:flex;align-items:center;justify-content:space-between;padding:0 6%`, body);
    const out = { el: body, reels: [] };
    for (let i = 0; i < 2; i++) {
      const size = Math.round(h * 0.25);
      const reel = el("div", `width:${size}px;height:${size}px;border-radius:50%;border:5px solid #D8D2C2;background:repeating-conic-gradient(#D8D2C2 0 12deg, transparent 12deg 60deg)`, window_);
      out.reels.push(reel);
    }
    ["left:4%;top:5%", "right:4%;top:5%", "left:4%;bottom:5%", "right:4%;bottom:5%"].forEach((at) => el("div", `position:absolute;${at};width:12px;height:12px;border-radius:50%;background:#5A5E64`, body));
    return out;
  };
  F.spin = (node, from, to, turns = 1) => R.tl.fromTo(node, { rotation: 0 }, { rotation: 360 * turns, duration: to - from, ease: "none", immediateRender: false }, from);
})();
