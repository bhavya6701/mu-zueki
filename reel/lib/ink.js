// Ink lines for the reel kit: thin, long, wiggly pen strokes that run behind the type and the icons.
// Inside a shot: s.zip(t), s.carry(icon, t), s.whip(word, t), s.ring(word, t), s.guides(row, t).
(function () {
  const T = window.TIMELINE;
  const NS = "http://www.w3.org/2000/svg";
  const { COLOR, fx } = R;

  // There are only a handful in the whole reel and each one does something: it zips across on a beat,
  // carries an icon in on its tip, whips through a word as the word lands, or lassoes a word.
  const INK_WIDTH = 4;

  // A wiggly line from a to b as a dense list of points: two waves across its direction plus a few
  // curls where the pen loops over itself. `pinned` makes it start and end exactly on a and b.
  function wiggle(random, a, b, amp, pinned) {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const along = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    const across = [-along[1], along[0]];
    const f1 = 1.4 + random() * 1.8;
    const f2 = 4 + random() * 4;
    const p1 = random() * 6.28;
    const p2 = random() * 6.28;
    const curls = [];
    for (let i = 0, n = 2 + Math.floor(random() * 3); i < n; i++) {
      curls.push({ at: 0.1 + random() * 0.75, span: (150 + random() * 90) / length, r: (36 + random() * 44) * (random() < 0.5 ? 1 : -1) });
    }
    const points = [];
    const count = Math.max(60, Math.round(length / 12));
    for (let i = 0; i <= count; i++) {
      const u = i / count;
      const envelope = pinned ? Math.pow(Math.sin(Math.PI * u), 0.6) : 1;
      let off = envelope * amp * (Math.sin(6.28 * f1 * u + p1) + 0.4 * Math.sin(6.28 * f2 * u + p2));
      let back = 0;
      curls.forEach((curl) => {
        if (u < curl.at || u > curl.at + curl.span) return;
        const turn = (6.28 * (u - curl.at)) / curl.span;
        back -= Math.abs(curl.r) * 1.5 * Math.sin(turn) * envelope;
        off += curl.r * (1 - Math.cos(turn)) * envelope;
      });
      points.push([a[0] + along[0] * (u * length + back) + across[0] * off, a[1] + along[1] * (u * length + back) + across[1] * off]);
    }
    return points;
  }
  // The position a fraction p of the way along a list of points.
  function tracer(points) {
    const run = [0];
    for (let i = 1; i < points.length; i++) run.push(run[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    const total = run[run.length - 1];
    return (p) => {
      const want = Math.max(0, Math.min(1, p)) * total;
      let i = 1;
      while (i < run.length - 1 && run[i] < want) i++;
      const part = (want - run[i - 1]) / (run[i] - run[i - 1] || 1);
      return [points[i - 1][0] + (points[i][0] - points[i - 1][0]) * part, points[i - 1][1] + (points[i][1] - points[i - 1][1]) * part];
    };
  }
  // A point just outside the frame, on a random edge.
  function offFrame(random) {
    const edge = Math.floor(random() * 4);
    return edge === 0 ? [-80, 200 + random() * 1500] : edge === 1 ? [1160, 200 + random() * 1500] : edge === 2 ? [random() * 1080, -80] : [random() * 1080, 2000];
  }

  function inkPath(s, points, color) {
    if (!s.ink) {
      s.ink = document.createElementNS(NS, "svg");
      s.ink.setAttribute("width", 1080);
      s.ink.setAttribute("height", 1920);
      s.ink.style.cssText = "position:absolute;left:0;top:0;overflow:visible";
      // First in the layer, so the lines pass behind the icons as well as the type.
      s.layer.insertBefore(s.ink, s.layer.firstChild);
    }
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M" + points.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L"));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color || s.fg);
    path.setAttribute("stroke-width", INK_WIDTH);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("pathLength", 1);
    s.ink.appendChild(path);
    return path;
  }
  // Where a row or word sits in the frame (its laid-out box, before any motion).
  function boxOf(s, node) {
    const box = { x: 0, y: 0, w: node.offsetWidth, h: node.offsetHeight };
    for (let n = node; n && n !== s.stage; n = n.offsetParent) {
      box.x += n.offsetLeft;
      box.y += n.offsetTop;
    }
    box.x += s.stage.offsetLeft;
    box.y += s.stage.offsetTop;
    return box;
  }

  function addInkTools(s, seed) {
    const random = R.rng(seed);
    // These are measured against the finished layout, so they are queued while the shot is built.
    s.later = [];
    const queued = (draw) => (...args) => s.later.push(() => draw(...args));
    // The laid-out box of a row or word: { x, y, w, h } in frame pixels. Only valid once the shot is built.
    s.boxOf = (node) => boxOf(s, node);
    const tint = () => (random() < 0.3 && s.bg !== COLOR.red ? COLOR.red : s.fg);

    // A stretch of line that races across the frame at any angle and is gone.
    s.zip = queued((t) => {
      const angle = random() * Math.PI;
      const dir = [Math.cos(angle), Math.sin(angle)];
      const through = [180 + random() * 720, 380 + random() * 1000];
      const far = random() < 0.35 ? 150 + random() * 300 : 1300;
      const flip = random() < 0.5 ? 1 : -1;
      const a = [through[0] - dir[0] * 1300 * flip, through[1] - dir[1] * 1300 * flip];
      const b = [through[0] + dir[0] * far * flip, through[1] + dir[1] * far * flip];
      const path = inkPath(s, wiggle(random, a, b, 50 + random() * 70, false), tint());
      path.setAttribute("stroke-dasharray", "0.5 2");
      R.tl.fromTo(path, { strokeDashoffset: 0.5 }, { strokeDashoffset: -1, duration: 0.42, ease: "power1.inOut" }, t);
    });

    // A line runs in from off the frame with an icon riding its tip; the icon is dropped at its place
    // and the line is pulled away behind it.
    s.carry = queued((node, t) => {
      const pin = node.parentNode;
      const home = [parseFloat(pin.style.left), parseFloat(pin.style.top)];
      const turn = (-(parseFloat(pin.style.rotate) || 0) * Math.PI) / 180;
      const points = wiggle(random, offFrame(random), home, 70 + random() * 50, true);
      const path = inkPath(s, points, tint());
      path.setAttribute("stroke-dasharray", "1 1");
      const at = tracer(points);
      const state = { drawn: 0, gone: 0 };
      const apply = () => {
        path.setAttribute("stroke-dashoffset", state.gone ? -state.gone : 1 - state.drawn);
        const p = at(state.drawn);
        const dx = p[0] - home[0];
        const dy = p[1] - home[1];
        // The pin may be tilted, and the icon moves in the pin's own axes.
        gsap.set(node, { x: dx * Math.cos(turn) - dy * Math.sin(turn), y: dx * Math.sin(turn) + dy * Math.cos(turn) });
      };
      apply();
      fx.show(node, t);
      R.tl.to(state, { drawn: 1, duration: 0.36, ease: "power3.out", onUpdate: apply }, t);
      R.tl.fromTo(node, { rotation: -18 }, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }, t + 0.2);
      R.tl.to(state, { gone: 1, duration: 0.2, ease: "power2.in", onUpdate: apply }, t + 0.42);
    });

    // A line whips straight through a word as it lands, and the word is knocked by it.
    s.whip = queued((node, t, color) => {
      const b = boxOf(s, node);
      const centre = [b.x + b.w / 2, b.y + b.h / 2];
      const angle = (random() - 0.5) * 1.1;
      const flip = random() < 0.5 ? 1 : -1;
      const dir = [Math.cos(angle) * flip, Math.sin(angle) * flip];
      const a = [centre[0] - dir[0] * 1200, centre[1] - dir[1] * 1200];
      const c = [centre[0] + dir[0] * 1200, centre[1] + dir[1] * 1200];
      const path = inkPath(s, wiggle(random, a, c, 60 + random() * 40, false), color || tint());
      path.setAttribute("stroke-dasharray", "1 1");
      R.tl.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.13, ease: "power2.out" }, t - 0.03);
      R.tl.to(path, { strokeDashoffset: -1, duration: 0.16, ease: "power2.in" }, t + 0.2);
      R.tl.to(node, { x: dir[0] * 34, rotation: flip * 3.5, duration: 0.06, ease: "power2.out" }, t + 0.04);
      R.tl.to(node, { x: 0, rotation: 0, duration: 0.45, ease: "elastic.out(1, 0.35)" }, t + 0.1);
    });

    // A lasso thrown around a word; the word is squeezed as the loop closes.
    s.ring = queued((node, t, color) => {
      const b = boxOf(s, node);
      const points = [];
      const start = random() * 6.28;
      for (let i = 0; i <= 80; i++) {
        const a = start + (i / 80) * 6.28 * 1.25;
        const grow = 1 + (i / 80) * 0.14 + 0.05 * Math.sin(a * 3 + start);
        points.push([b.x + b.w / 2 + Math.cos(a) * (b.w / 2 + 30) * grow, b.y + b.h / 2 + Math.sin(a) * (b.h / 2 + 10) * grow]);
      }
      // The loose end of the rope trails off the frame.
      const tail = wiggle(random, points[points.length - 1], offFrame(random), 40, true);
      const path = inkPath(s, points.concat(tail), color || tint());
      path.setAttribute("stroke-dasharray", "1 1");
      R.tl.fromTo(path, { strokeDashoffset: -1 }, { strokeDashoffset: 0, duration: 0.2, ease: "power2.out" }, t);
      R.tl.to(path, { strokeDashoffset: -1, duration: 0.2, ease: "power2.in" }, t + 0.5);
      R.tl.to(node, { scaleX: 0.92, scaleY: 0.86, duration: 0.07, ease: "power2.out" }, t + 0.16);
      R.tl.to(node, { scaleX: 1, scaleY: 1, duration: 0.3, ease: "back.out(3)" }, t + 0.23);
    });

    // Dashed guide lines above and below a row, edge to edge, flashed for a moment.
    s.guides = queued((node, t, hold) => {
      const b = boxOf(s, node);
      [b.y - 6, b.y + b.h + 6].forEach((y) => {
        const line = inkPath(s, [[-40, y], [1120, y]], COLOR.red);
        line.removeAttribute("pathLength");
        line.setAttribute("stroke-width", 3);
        line.setAttribute("stroke-dasharray", "16 12");
        fx.show(line, t);
        R.tl.set(line, { autoAlpha: 0 }, t + (hold || 0.2));
      });
    });
  }

  // The beat stops for the spoken sign-off, and so do the lines.
  const lastSection = T.sections[T.sections.length - 1];
  const musicEnd = /outro/i.test(lastSection.label) ? lastSection.start : T.duration_seconds;

  // options.lines: how many loose lines zip through the shot, each on one of its beats.
  function decorate(s, options) {
    if (!options.lines) return;
    s.later = [];
    const random = R.rng(Math.round(s.t0 * 1000) + 17);
    const beats = T.beats.filter((beat) => beat >= s.t0 + 0.1 && beat < s.t1 - 0.3 && beat < musicEnd);
    for (let n = 0; n < options.lines && beats.length; n++) s.zip(beats.splice(Math.floor(random() * beats.length), 1)[0]);
    s.later.forEach((draw) => draw());
    s.later = [];
  }

  R.ink = {
    tools: addInkTools,
    // Called once a shot's rows are all in place: draws what the shot asked for, then its loose lines.
    finish(s, options) {
      s.later.forEach((draw) => draw());
      decorate(s, options);
    },
  };
})();
