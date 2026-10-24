// 2026-10-13 as a torn-paper street collage (lib/collage.js) over stock footage (footage.json), with
// reaction GIFs framed as stickers. This file: the shared helpers, Verse 1 (lines 1 to 12), the hook
// (13 to 19) and the brass break before Verse 2.
(function () {
  const { fx, clg: C } = R;
  const { CREAM, PAPER, INK, RED, YELLOW, WHITE } = C;
  const tl = () => R.tl;

  // Two scraps of paper pasted over the edges of the frame, so every shot reads as a collage.
  const edges = (s, seed) => {
    const random = R.rng(seed);
    C.scrap(s, -60 + random() * 40, -70, 360 + random() * 140, 230, { rot: -6 + random() * 5, seed });
    C.scrap(s, 760 - random() * 80, 1700 - random() * 40, 420, 300, { rot: 4 + random() * 4, seed: seed + 9 });
  };
  const over = (caps, build, more) =>
    C.over(caps, (s) => {
      edges(s, Math.round(s.t0 * 10) + 1);
      build(s);
    }, more);
  R.day = { over, edges };

  // "Tuesday, bank tower steps," On screen from the first frame.
  over([1], (s) => {
    const a = s.times(1);
    const day = C.tape(s, "Tuesday", 540, 420, { size: 210, bg: RED, fg: PAPER, rot: -4, seed: 3 });
    C.boil(s, day, -4);
    const steps = C.tape(s, "bank tower steps", 540, 640, { size: 96, rot: 3, seed: 4 });
    C.slap(steps, a[2], 3);
  });

  // "revolving doors spin round" The label spins with the door, in steps.
  over([2], (s) => {
    const a = s.times(2);
    const spin = C.tape(s, "spin", 540, 520, { size: 230, bg: YELLOW, rot: 0, seed: 5 });
    C.slap(spin, a[2]);
    tl().to(spin, { rotation: 360, duration: s.t1 - a[2] - 0.05, ease: "steps(8)" }, a[2] + 0.16);
  });

  // "Banks brought billions home,"
  over([3], (s) => {
    const a = s.times(3);
    const billions = C.tape(s, "billions", 540, 430, { size: 200, bg: YELLOW, rot: -3, seed: 6 });
    C.slap(billions, a[2], -3);
    const home = C.stamp(s, "HOME", 760, 1120, { size: 150, rot: 9 });
    C.slap(home, a[3], 9);
  });

  // "and the market still went down" A marker arrow falls through the red board.
  over([4], (s) => {
    const a = s.times(4);
    C.slap(C.tape(s, "still", 330, 420, { size: 170, rot: -5, seed: 7 }), a[3], -5);
    C.drawing(s, 700, 820, 300, 520, [{ d: "M150 20 L150 470 M40 350 L150 480 L260 350", weight: 34, color: WHITE }], a[4], { dur: 0.22 });
    C.slap(C.tape(s, "went down", 540, 1170, { size: 150, bg: RED, fg: PAPER, rot: 4, seed: 8 }), a[4], 4);
  });

  // "Taxi horns are honking," Two horns, one per beat.
  over([5], (s) => {
    const a = s.times(5);
    const one = C.stamp(s, "HONK!", 330, 480, { size: 170, color: YELLOW, rot: -12 });
    C.slap(one, a[1], -12);
    const two = C.stamp(s, "HONK!", 730, 820, { size: 150, color: YELLOW, rot: 10 });
    C.slap(two, a[3], 10);
    C.jolt(s, a[3] + 0.02, 12);
  });

  // "suits with coffee leaving town"
  over([6], (s) => {
    const a = s.times(6);
    C.slap(C.tape(s, "suits + coffee", 540, 400, { size: 130, rot: -3, seed: 9 }), a[0], -3);
    const town = C.tape(s, "leaving town", 540, 1180, { size: 140, bg: INK, fg: PAPER, rot: 2, seed: 10 });
    C.slap(town, a[3], 2);
    tl().to(town, { x: 1300, duration: 0.3, ease: "power2.in" }, Math.max(a[3] + 0.3, s.t1 - 0.32));
  });

  // "S&P near flat, / just under its record crown" A flat marker line, and a paper crown just above it.
  over([7, 8], (s) => {
    const a = s.times(7);
    const b = s.times(8);
    C.slap(C.tape(s, "S&P 500", 540, 380, { size: 170, bg: PAPER, rot: -2, seed: 11 }), s.t0, -2);
    C.drawing(s, 540, 860, 900, 60, [{ d: "M20 30 C 200 22, 400 38, 600 28 S 820 30, 880 30", weight: 22, color: YELLOW }], a[2], { dur: 0.28 });
    C.slap(C.tape(s, "near flat", 330, 990, { size: 110, rot: -4, seed: 12 }), a[2], -4);
    const crown = C.drawing(s, 540, 690, 300, 200, [
      { d: "M30 170 L30 60 L95 120 L150 30 L205 120 L270 60 L270 170 Z", weight: 16, color: INK, fill: YELLOW },
    ], b[4], { dur: 0.2 });
    C.boil(s, crown, 0, 2, 4);
    C.slap(C.tape(s, "just under the record", 540, 1180, { size: 100, bg: RED, fg: PAPER, rot: 2, seed: 13 }), b[0], 2);
  });

  // "Memory stocks forgot the way up, / two days in a row" The arrow up gets crossed out.
  over([9, 10], (s) => {
    const a = s.times(9);
    const b = s.times(10);
    C.slap(C.tape(s, "memory stocks", 540, 380, { size: 150, bg: PAPER, rot: -3, seed: 14 }), s.t0, -3);
    C.forgot(s, 540, 820, a[2]);
    C.slap(C.stamp(s, "DAY 2", 760, 1150, { size: 160, rot: -10 }), b[1], -10);
    C.jolt(s, b[1] + 0.02, 14);
  });

  // "Doorman laughs, he's seen this movie, / every quarter, same old sound" The laughing man is cut out
  // onto the paper; the "here we go again" sticker slaps on at "seen".
  over([11, 12], (s) => {
    const a = s.times(11);
    const b = s.times(12);
    C.slap(C.tape(s, "the doorman laughs", 540, 330, { size: 110, bg: INK, fg: PAPER, rot: -2, seed: 15 }), s.t0, -2);
    C.sticker("g01", a[3], -4);
    C.slap(C.stamp(s, "EVERY QUARTER", 540, 1170, { size: 110, rot: 6 }), b[0], 6);
  });

  // "The banks got paid," Cash rains on the paper; the cash sticker slaps on at "got".
  over([13], (s) => {
    const a = s.times(13);
    C.slap(C.tape(s, "the banks got paid", 540, 330, { size: 120, bg: YELLOW, rot: -3, seed: 16 }), s.t0, -3);
    C.sticker("g02", a[2], 5);
    C.jolt(s, a[2] + 0.02, 14);
  });

  // "but the shares slid away" The label slides off the frame.
  over([14], (s) => {
    const a = s.times(14);
    const shares = C.tape(s, "the shares", 540, 330, { size: 150, w: 760, bg: PAPER, rot: -2, seed: 17 });
    C.slap(shares, a[2], -2);
    tl().to(shares, { x: -1300, rotation: -14, duration: Math.max(0.3, s.t1 - a[3] - 0.05), ease: "power2.in" }, a[3]);
    C.slap(C.tape(s, "slid away", 540, 1150, { size: 150, bg: RED, fg: PAPER, rot: 3, seed: 18 }), a[3], 3);
  });

  // "Billions in the bag"
  over([15], (s) => {
    const a = s.times(15);
    C.slap(C.tape(s, "billions", 540, 330, { size: 170, bg: YELLOW, rot: -3, seed: 19 }), s.t0, -3);
    C.slap(C.stamp(s, "IN THE BAG", 540, 1170, { size: 130, rot: -6 }), a[3], -6);
  });

  // "and still red on the day" The red-candle sticker.
  over([16], (s) => {
    const a = s.times(16);
    C.sticker("g03", a[2], -5);
    C.slap(C.stamp(s, "STILL RED", 540, 1170, { size: 150, rot: 5 }), a[2], 5);
    C.jolt(s, a[2] + 0.02, 16);
  });

  // "Fat on the profit, / thin on the price" The same gold, set fat and then thin.
  over([17, 18], (s) => {
    const a = s.times(17);
    const b = s.times(18);
    const fat = C.tape(s, "fat", 540, 560, { size: 260, font: "display", bg: YELLOW, rot: -3, seed: 20 });
    tl().fromTo(fat, { scaleX: 0.6, opacity: 0 }, { scaleX: 1.55, opacity: 1, duration: 0.18, ease: "back.out(2)" }, a[0]);
    C.slap(C.tape(s, "on the profit", 540, 760, { size: 90, rot: 2, seed: 21 }), a[2]);
    const thin = C.tape(s, "thin", 540, 1010, { size: 240, bg: INK, fg: PAPER, rot: 2, seed: 22 });
    tl().fromTo(thin, { scaleX: 1.2, opacity: 0 }, { scaleX: 0.38, scaleY: 1.25, opacity: 1, duration: 0.18, ease: "back.out(2)" }, b[0]);
    C.slap(C.tape(s, "on the price", 540, 1190, { size: 90, rot: -2, seed: 23 }), b[2]);
  });

  // "Nearly flat, alright" Three stamps, one per "alright" beat.
  over([19], (s) => {
    const a = s.times(19);
    C.slap(C.tape(s, "nearly flat", 540, 380, { size: 160, rot: -2, seed: 24 }), s.t0, -2);
    const beats = R.slap.beats(s).filter((t) => t >= a[2] - 0.05).slice(0, 3);
    const times = [a[2]].concat(beats.filter((t) => t > a[2] + 0.2)).slice(0, 3);
    [[540, 760, -8], [420, 960, 6], [640, 1160, -4]].forEach(([x, y, rot], i) => {
      if (times[i] === undefined) return;
      const stamp = C.stamp(s, "ALRIGHT", x, y, { size: 150 - i * 10, rot, color: i === 2 ? YELLOW : RED });
      C.slap(stamp, times[i], rot);
    });
  });

  // The brass break before Verse 2: the paper tears away on the downbeat, earnings-day labels land on the beats.
  R.shot({ at: 25.03, caps: [], caption: false, ground: "clear", look: "collage" }, (s) => {
    edges(s, 77);
    C.rip(s, s.t0);
    const beats = R.slap.beats(s);
    C.slap(C.tape(s, "bank", 540, 560, { size: 230, bg: RED, fg: PAPER, rot: -4, seed: 25 }), beats[1] || s.t0 + 0.3, -4);
    C.slap(C.tape(s, "earnings", 540, 800, { size: 200, bg: PAPER, rot: 3, seed: 26 }), beats[2] || s.t0 + 0.6, 3);
    C.slap(C.stamp(s, "DAY", 620, 1060, { size: 170, rot: -9 }), beats[3] || s.t0 + 0.9, -9);
  });
})();
