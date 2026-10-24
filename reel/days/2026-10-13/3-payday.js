// The breakdown (lines 31 to 33), the last hook (34 to 37) and the sign-off (38): the Dow close counts
// up on a dark board, payday, the hook again in new layouts, and a dropped mic.
(function () {
  const { fx, clg: C } = R;
  const { PAPER, INK, RED, YELLOW, WHITE } = C;
  const { over } = R.day;
  const tl = () => R.tl;

  // "Dow closed at 51,670" Bass and drums only: one figure on the dark board.
  over([31], (s) => {
    const a = s.times(31);
    C.slap(C.tape(s, "Dow close", 540, 420, { size: 150, bg: PAPER, rot: -2, seed: 41 }), s.t0);
    const figure = C.tape(s, "51,670", 540, 800, { size: 250, bg: YELLOW, rot: 2, seed: 42, w: 940 });
    C.slap(figure, a[3]);
    fx.count(figure, a[3], 50000, 51670, Math.min(0.9, s.t1 - a[3] - 0.1), (v) => Math.round(v).toLocaleString("en-US"));
  });

  // "Down 180 points" / "on a payday Tuesday"
  over([32], (s) => {
    const a = s.times(32);
    C.slap(C.stamp(s, "−180", 540, 640, { size: 300, rot: -7 }), a[1]);
    C.jolt(s, a[1] + 0.02, 18);
    C.drawing(s, 840, 1000, 160, 300, [{ d: "M80 20 L80 260 M20 190 L80 270 L140 190", weight: 26, color: RED }], a[2], { dur: 0.18 });
    C.slap(C.tape(s, "points", 470, 1020, { size: 120, rot: 3, seed: 43 }), a[2]);
  });
  over([33], (s) => {
    const a = s.times(33);
    C.slap(C.stamp(s, "PAYDAY", 540, 520, { size: 230, color: RED, rot: -8 }), a[2]);
    C.slap(C.tape(s, "Tuesday", 540, 1160, { size: 170, bg: RED, fg: PAPER, rot: 3, seed: 44 }), a[3]);
  });

  // The hook again, the whole band back: the paper tears away on the first word.
  over([34], (s) => {
    const a = s.times(34);
    C.rip(s, s.t0);
    C.slap(C.tape(s, "banks got paid", 540, 300, { size: 115, bg: PAPER, rot: 3, seed: 45 }), a[1]);
    C.sticker("g07", a[2], -5);
    C.jolt(s, a[2] + 0.02, 14);
  });
  over([35], (s) => {
    const a = s.times(35);
    const shares = C.tape(s, "shares", 540, 330, { size: 200, bg: RED, fg: PAPER, rot: 2, seed: 46 });
    C.slap(shares, a[2]);
    tl().to(shares, { x: 1300, rotation: 14, duration: Math.max(0.3, s.t1 - a[3] - 0.05), ease: "power2.in" }, a[3]);
    C.slap(C.stamp(s, "SLID AWAY", 540, 1130, { size: 150, rot: -5 }), a[3]);
  });
  over([36], (s) => {
    const a = s.times(36);
    C.slap(C.stamp(s, "BILLIONS", 540, 330, { size: 180, color: INK, rot: -4 }), s.t0);
    C.slap(C.tape(s, "in the bag", 540, 1180, { size: 150, bg: YELLOW, rot: 3, seed: 47 }), a[1]);
  });
  over([37], (s) => {
    const a = s.times(37);
    C.sticker("g08", a[2], 5);
    C.slap(C.tape(s, "still red", 540, 1170, { size: 170, bg: RED, fg: PAPER, rot: -3, seed: 48 }), a[2]);
    C.jolt(s, a[2] + 0.02, 16);
  });

  // "That's the tape. Mu-Zueki." The beat is out; the tape label, then the mic drops on the name.
  over([38], (s) => {
    const a = s.times(38);
    C.rip(s, s.t0, 0.22);
    C.slap(C.tape(s, "that's the tape", 540, 420, { size: 150, bg: PAPER, rot: -3, seed: 49 }), a[0] + 0.05);
    C.mic(s, 540, 860, a[3]);
    C.slap(C.stamp(s, "MU-ZUEKI", 540, 1160, { size: 170, color: RED, rot: 6 }), a[3] + 0.2);
  });
})();
