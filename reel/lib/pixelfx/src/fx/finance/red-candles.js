import { Particles, Lights, P, Rng, fit, sparkle, clamp, seg, ease, WHITE, mix } from "../../core/index.js";

export const meta = {
  name: "Red candles",
  desc: "Three red candlesticks slam down one after another, each lower than the last, in sparks and red light; a dotted trend line cuts down through them and they crumble away.",
  tags: ["finance", "chart", "candles", "market", "loss", "downtrend", "one-shot"],
  size: [192, 300],
  origin: [96, 288],
  duration: 3.4,
  loop: false,
  fps: 30,
  bg: "dark",
  // gap: seconds between the candles (0.5 is one beat at 120 BPM)
  options: { palette: ["#14040a", "#3a0a14", "#6a101c", "#a01824", "#d42a30", "#ff5a50", "#ff9a8a", "#ffe0d8"], gap: 0.5, seed: 4 },
};

// Each candle: centre x, body top and bottom (y up is negative), wick lengths. A downtrend: each opens below the last.
const CANDLES = [
  { x: -38, top: -104, bot: -70, up: 7, down: 6 },
  { x: 0, top: -80, bot: -44, up: 6, down: 8 },
  { x: 38, top: -54, bot: -14, up: 9, down: 6 },
];
const W = 13, FALL = 0.2, DROP = 150, LINE = 0.25, FADE = 0.7;

export function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), gap = o.gap;
  const ps = new Particles({ rng: R, ground: () => 8, sparks: [WHITE, C[7], C[5], C[3]] }), lights = new Lights();
  const land = CANDLES.map((_, i) => 0.08 + FALL + i * gap);
  const hit = CANDLES.map(() => false);
  const last = land[2];
  let t = 0;
  return {
    update(dt) {
      t += dt;
      CANDLES.forEach((c, i) => {
        if (hit[i] || t < land[i]) return;
        hit[i] = true;
        const y = c.bot;
        lights.add(c.x, (c.top + c.bot) / 2, 46, C[4], 0.8, 0.45);
        lights.add(c.x, y, 16, WHITE, 0.7, 0.1);
        // sparks off the foot of the candle, chips of the body falling away
        for (let k = 0; k < 14; k++) {
          const an = R.range(-Math.PI, 0), sp = R.range(80, 230);
          ps.spawn(P.SPARK, c.x + R.range(-W / 2, W / 2), y, Math.cos(an) * sp, Math.sin(an) * sp * 0.8, R.range(0.15, 0.4));
        }
        for (let k = 0; k < 6; k++)
          ps.spawn(P.GRIT, c.x + R.range(-W / 2, W / 2), y + R.range(-4, 0), R.range(-60, 60), R.range(-90, -20), R.range(0.5, 0.9), C[2 + Math.floor(R.range(0, 3))]);
        for (let k = 0; k < 3; k++) ps.spawn(P.DUST, c.x + R.range(-8, 8), y, R.range(-25, 25), R.range(-12, -4), R.range(0.5, 0.9), C[2]);
      });
      // while they stand, a few embers rise off the bodies
      if (t > land[0] && t < meta.duration - FADE - 0.1 && R.range(0, 1) < dt * 14) {
        const c = CANDLES[Math.floor(R.range(0, 3))];
        ps.spawn(P.EMBER, c.x + R.range(-W / 2, W / 2), R.range(c.top, c.bot), R.range(-6, 6), R.range(-30, -14), R.range(0.5, 1), C[R.range(0, 1) < 0.5 ? 5 : 6]);
      }
      // crumbling from the top: chips break off at the line that is eating each candle and fall away
      const dk = seg(t, meta.duration - FADE - 0.1, meta.duration - 0.25);
      if (dk > 0 && dk < 1)
        CANDLES.forEach((c) => {
          const y = -130 + 140 * dk * 1.2;
          if (y < c.top - c.up || y > c.bot + c.down || R.range(0, 1) > dt * 60) return;
          ps.spawn(P.GRIT, c.x + R.range(-W / 2, W / 2), y, R.range(-30, 30), R.range(-20, 10), R.range(0.25, 0.45), C[2 + Math.floor(R.range(0, 4))]);
          if (R.range(0, 1) < 0.3) ps.spawn(P.SPARK, c.x + R.range(-W / 2, W / 2), y, R.range(-60, 60), R.range(-50, 0), R.range(0.1, 0.2));
        });
      ps.update(dt);
      lights.update(dt);
    },

    draw(p) {
      const dissolve = seg(t, meta.duration - FADE - 0.1, meta.duration - 0.1);
      // the trend line: dotted, drawn down through the candle bodies after the last one lands
      const lk = seg(t, last + 0.12, last + 0.12 + LINE);
      if (lk > 0 && dissolve < 1) {
        const x0 = CANDLES[0].x - 14, y0 = CANDLES[0].top - 10, x1 = CANDLES[2].x + 14, y1 = CANDLES[2].bot + 10;
        const n = Math.floor(ease.outCubic(lk) * 46);
        for (let i = 0; i <= n; i++) {
          const u = i / 46, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
          if (i % 3 === 2) continue;
          const gone = dissolve > 0 && (y - (-130)) / 140 < dissolve * 1.2;
          if (!gone) {
            p.dot(x, y, i === n ? WHITE : C[6]);
            p.light(x, y, C[4], 0.35);
          }
        }
        if (lk < 1) sparkle(p, x0 + (x1 - x0) * ease.outCubic(lk), y0 + (y1 - y0) * ease.outCubic(lk), 4, WHITE, C[5], 0.8);
      }
      CANDLES.forEach((c, i) => {
        const start = land[i] - FALL;
        if (t < start) return;
        const fall = clamp((t - start) / FALL);
        // falls in with gravity, then a squash on landing that springs back
        const off = fall < 1 ? -DROP * (1 - ease.inQuad(fall)) : 0;
        const since = t - land[i];
        const sq = since > 0 ? Math.exp(-since * 14) * Math.cos(since * 40) * 0.18 : 0;
        const h = c.bot - c.top, hh = h * (1 - sq), ww = W * (1 + sq * 0.8);
        const top = c.bot - hh + off, bot = c.bot + off, x0 = c.x - ww / 2;
        const hot = since >= 0 && since < 0.05, warm = since > 0 ? clamp(1 - since / 0.4) : 0;
        // streak behind a falling candle
        if (fall < 1) for (let s = 1; s < 5; s++) p.rect(x0 + 2, top - s * 7, ww - 4, 5, C[3], 0.5 - s * 0.1);
        const cut = (y, x = 0) => dissolve > 0 && (y - (-130)) / 140 < dissolve * 1.2 - 0.05 * ((Math.floor(x) * 5 + i * 3) % 4) / 4;
        // wicks
        for (let y = top - c.up; y < top; y++) if (!cut(y)) p.dot(c.x, y, hot ? WHITE : C[5]);
        for (let y = bot; y < bot + c.down; y++) if (!cut(y)) p.dot(c.x, y, hot ? WHITE : C[5]);
        // body: dark outline, a lit left rim, a shaded right side, the face glowing when it has just landed
        for (let y = Math.floor(top); y < bot; y++) {
          for (let x = Math.floor(x0); x < x0 + ww; x++) {
            if (cut(y, x)) continue;
            const edge = x === Math.floor(x0) || x >= Math.floor(x0 + ww) - 1 || y === Math.floor(top) || y >= bot - 1;
            let col = edge ? C[1] : x < x0 + 3 ? C[5] : x > x0 + ww - 4 ? C[2] : C[3];
            if (!edge && warm > 0) col = mix(col, C[6], warm * 0.6);
            if (!edge && y === Math.floor(top) + 1) col = C[6];
            p.px(x, y, hot && !edge ? WHITE : col);
          }
        }
        const breathe = since > 0 ? 0.04 * Math.sin(since * Math.PI * 4) : 0;
        const gTop = Math.max(top, -130 + 140 * dissolve * 1.2);
        if (gTop < bot) p.glowLine(c.x, gTop, c.x, bot, 7, C[4], (0.12 + breathe + warm * 0.35) * (1 - dissolve));
      });
      ps.draw(p);
      lights.draw(p);
    },
  };
}
