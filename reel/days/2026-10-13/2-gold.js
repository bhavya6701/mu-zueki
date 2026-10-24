// Verse 2, lines 20 to 30: JPMorgan's profit lands as a phone notification, Goldman strikes gold, both
// stocks bump down the steps, "wait for it", the brass stab cuts to the Fed, and the heat is on.
(function () {
  const { clg: C } = R;
  const { PAPER, INK, RED, YELLOW, WHITE } = C;
  const { over } = R.day;
  const U = R.slap.ui;
  const T = window.TIMELINE;
  const tl = () => R.tl;
  const GREEN = "#1E9E4A";

  // "JPMorgan banked $15.3 billion, / up 6%" A deposit notification slides in at "banked".
  over([20, 21], (s) => {
    const a = s.times(20);
    const b = s.times(21);
    C.slap(C.tape(s, "JPMorgan", 540, 340, { size: 180, bg: PAPER, rot: -3, seed: 31 }), s.t0);
    const toast = s.put(U.toast("$", "JPMORGAN CHASE · Q3 PROFIT", "+$15.3 billion", { accent: GREEN, w: 820, shadow: INK }), 540, 760, -2);
    R.slap.side(toast, a[1], 1, 0.22);
    C.slap(C.stamp(s, "UP 6%", 700, 1120, { size: 170, color: GREEN, rot: -8 }), b[1]);
  });

  // "Goldman struck gold, profit up 29%," A pickaxe strikes the bar on "struck".
  over([22], (s) => {
    const a = s.times(22);
    C.slap(C.tape(s, "Goldman", 540, 340, { size: 190, bg: YELLOW, rot: -3, seed: 32 }), s.t0);
    C.pickaxe(s, 520, 760, a[1]);
    C.jolt(s, a[1] + 0.18, 16);
    C.slap(C.stamp(s, "PROFIT +29%", 560, 1150, { size: 140, color: GREEN, rot: 6 }), a[3]);
  });

  // "trading paid the rent"
  over([23], (s) => {
    const a = s.times(23);
    C.slap(C.tape(s, "trading", 540, 420, { size: 190, bg: PAPER, rot: 2, seed: 33 }), s.t0);
    C.slap(C.stamp(s, "RENT: PAID", 540, 900, { size: 170, rot: -9 }), a[1]);
    C.jolt(s, a[1] + 0.02, 12);
  });

  // "Then both their stocks walked down / these same steps I'm sitting on" The stairs run backwards and
  // the dog bumps down them on "walked".
  over([24, 25], (s) => {
    const a = s.times(24);
    const b = s.times(25);
    C.slap(C.tape(s, "both stocks", 540, 320, { size: 120, bg: INK, fg: PAPER, rot: -2, seed: 34 }), s.t0);
    C.sticker("g04", a[4], 4);
    C.slap(C.tape(s, "these same steps", 540, 1200, { size: 110, bg: RED, fg: PAPER, rot: 2, seed: 35 }), b[0]);
  });

  // "Wait for it —" The sticker holds the frame until the brass stab.
  over([26], (s) => {
    C.sticker("g05", s.t0, -3);
  });

  // The cut to the Fed lands on the brass stab (the first downbeat after "Wait for it"), just before the line.
  // (The dash at the end of the line is timed as a word of its own, so the last spoken word is used.)
  const spoken = T.captions[25].words.filter((word) => /[a-z0-9]/i.test(word.text));
  const stab = T.downbeats.find((beat) => beat > spoken[spoken.length - 1].start + 0.15);

  // "Two Fed voices say one more hike / before the year is gone"
  over([27, 28], (s) => {
    const a = s.times(27);
    const b = s.times(28);
    C.jolt(s, s.t0 + 0.02, 22);
    C.slap(C.tape(s, "two Fed voices", 540, 340, { size: 130, bg: PAPER, rot: -3, seed: 36 }), a[0]);
    C.slap(C.stamp(s, "+1 HIKE", 540, 820, { size: 220, rot: -8 }), a[6]);
    C.slap(C.tape(s, "before year-end", 540, 1180, { size: 110, bg: INK, fg: PAPER, rot: 2, seed: 37 }), b[0]);
  }, { at: stab });

  // "Heating oil and diesel, Collins says," / "the heat is on" This is fine slaps on at "diesel".
  over([29], (s) => {
    const a = s.times(29);
    C.slap(C.tape(s, "heating oil", 540, 330, { size: 150, bg: YELLOW, rot: -4, seed: 38 }), a[0]);
    C.sticker("g06", a[3], 4);
    C.slap(C.stamp(s, "DIESEL", 540, 1170, { size: 150, color: WHITE, rot: 5 }), a[3]);
  });
  over([30], (s) => {
    const a = s.times(30);
    C.slap(C.tape(s, "Collins says", 540, 330, { size: 120, bg: PAPER, rot: 3, seed: 39 }), s.t0);
    C.slap(C.stamp(s, "HEAT: ON", 540, 1180, { size: 160, rot: -6 }), a[1]);
    C.jolt(s, a[1] + 0.02, 14);
  });
})();
