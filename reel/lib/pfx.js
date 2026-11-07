// pixelfx effects on the reel's timeline: s.pfx("explosions/big-explosion", { at, x, y, scale }) inside a shot.
// The library (lib/pixelfx/, MIT) draws pixel art into a small frame; here each effect gets its own canvas, scaled up
// with crisp pixels and placed on the 1080x1920 frame, and is drawn at whatever time the timeline is seeked to.
// Effect ids, sizes and lengths: lib/pixelfx/docs/CATALOG.md. Reference: reel/templates/pixelfx.md.
(function () {
  const { core, effects } = window.PFX;
  const STEP = 1 / 120; // simulated effects always advance in this step, so a frame is the same however it is reached
  const W = 1080, H = 1920;

  // One effect as a canvas. o: x, y (where the effect's anchor lands on the frame, px), scale (px per effect pixel),
  // fit: "cover" (fill the frame; x, y ignored), act: true (played by pixelfx's stock character, with its wind-up),
  // bg (a colour behind the effect's pixels, else transparent), plus the effect's own options: palette (a PAL name
  // or a list of hex colours, dark to bright), seed, flip, angle, light and anything in its meta.options.
  function make(id, o) {
    const mod = effects[id];
    if (!mod) throw new Error(`pixelfx: no effect "${id}" (see lib/pixelfx/docs/CATALOG.md)`);
    const meta = mod.meta;
    let w, h, ox, oy;
    if (o.act) {
      const b = core.actBounds(mod, o);
      w = b.x1 - b.x0; h = b.y1 - b.y0; ox = -b.x0; oy = -b.y0;
    } else {
      [w, h] = meta.size;
      [ox, oy] = meta.origin || [0, 0];
    }
    const scale = o.fit === "cover" ? Math.ceil(Math.max(W / w, H / h)) : o.scale || 6;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.className = "pfx";
    canvas.style.width = w * scale + "px";
    canvas.style.height = h * scale + "px";
    if (o.fit === "cover") {
      canvas.style.left = (W - w * scale) / 2 + "px";
      canvas.style.top = (H - h * scale) / 2 + "px";
    } else {
      canvas.style.left = (o.x ?? W / 2) - ox * scale + "px";
      canvas.style.top = (o.y ?? H / 2) - oy * scale + "px";
    }
    const ctx = canvas.getContext("2d");
    const frame = core.createFrame(w, h);
    const img = new ImageData(w, h);
    const bg = o.bg ? core.hex(o.bg) : null;
    const palette = typeof o.palette === "string" ? core.PAL[o.palette] : o.palette;
    const opts = Object.assign({}, o.opts, { x: ox, y: oy, seed: o.seed ?? 1, flip: o.flip, angle: o.angle, light: o.light });
    if (palette) opts.palette = palette;
    for (const k of Object.keys(opts)) if (opts[k] === undefined) delete opts[k];

    let live = null, steps = 0;
    const start = () => (o.act ? core.createAct(mod, opts) : core.createFx(mod, opts));
    // A one-shot played as an act starts at its first pose, before the effect's own t = 0.
    const lead = o.act ? -core.actSpan(mod).from : 0;
    return {
      canvas,
      meta,
      lead,
      // Length on the timeline: a one-shot's own duration (plus its act's wind-up and recovery); a loop has none.
      length: meta.loop ? Infinity : o.act ? core.actSpan(mod).to + lead : meta.duration,
      // The frame `local` seconds after the effect began. Seeking back rebuilds it from its seed.
      draw(local) {
        const k = Math.max(0, Math.round(local / STEP));
        if (!live || k < steps) {
          live = start();
          steps = 0;
        }
        for (; steps < k; steps++) live.update(STEP);
        core.clearFrame(frame);
        if (o.act) live.draw(frame);
        else {
          live.draw(frame, "back");
          live.draw(frame, "front");
        }
        core.composite(frame, img.data, bg);
        ctx.putImageData(img, 0, 0);
      },
    };
  }

  R.pfx = { make, effects, PAL: core.PAL };

  // The sound cue an effect gives (kit.js R.cue): by its category, at the effect's own t = 0, or at the moments in
  // HITS for effects whose contact comes later. Ambient loops (weather, auras) give none: the music carries them.
  const KIND = { explosions: ["impact", 1.4], impacts: ["impact", 1], lightning: ["zap", 1.1], finance: ["impact", 1.1],
    ui: ["pop", 0.9], pickups: ["coin", 0.8], spawn: ["coin", 0.9], transitions: ["whoosh", 0.9], fire: ["burst", 1],
    scifi: ["zap", 1], melee: ["whoosh", 0.9], projectiles: ["whoosh", 0.8], moves: ["impact", 1] };
  const HITS = { "finance/red-candles": (o) => [0.28, 0.28 + (o.opts?.gap ?? 0.5), 0.28 + 2 * (o.opts?.gap ?? 0.5)] };
  R.pfx.cues = function (id, o, at) {
    const kind = KIND[id.split("/")[0]];
    if (!kind || effects[id].meta.loop) return;
    (HITS[id] ? HITS[id](o) : [0]).forEach((dt, i) => R.cue(at + dt, kind[0], { weight: kind[1], id: `${id}:${R.cues.length}:${i}` }));
  };

  // In a shot: the effect's own t = 0 (its hit, burst or first frame) lands at `at` (song seconds; an act's wind-up
  // starts before it). It stays until `until` (default: a one-shot's end, or the shot's end for a loop). front: true
  // puts it over the type; the default is behind it. Returns the canvas.
  R.pfx.inShot = function (s, id, o) {
    o = Object.assign({ at: s.t0 }, o);
    const fx = make(id, o);
    R.pfx.cues(id, o, o.at);
    o = Object.assign({}, o, { at: o.at - fx.lead });
    const until = o.until ?? Math.min(s.t1 + 0.5, o.at + fx.length);
    const box = document.createElement("div");
    box.className = "pfx-box";
    box.style.zIndex = o.front ? 3 : 1;
    box.style.visibility = "hidden";
    if (o.opacity !== undefined) box.style.opacity = o.opacity;
    box.appendChild(fx.canvas);
    (o.front ? s.punch : s.layer).appendChild(box);
    fx.draw(0);
    const clock = { t: 0 };
    R.tl.set(box, { visibility: "visible" }, o.at);
    R.tl.fromTo(clock, { t: 0 }, { t: until - o.at, duration: until - o.at, ease: "none", onUpdate: () => fx.draw(clock.t) }, o.at);
    R.tl.set(box, { visibility: "hidden" }, until);
    return fx.canvas;
  };
})();
