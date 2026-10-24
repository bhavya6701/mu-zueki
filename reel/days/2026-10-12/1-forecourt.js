// 2026-10-12 as a night film: a petrol pump in the rain, the day's figures on the station's signboard.
// Footage is cut to the lyric lines in footage.json; the lyric is set in serif over it (look: film).
// This file: the first verse (lines 1 to 5) and the hook (lines 6 to 9).
(function () {
  const { fx, film: F } = R;
  const { RED } = F;

  // "Monday night, a petrol pump, the rain" The station, wide.
  F.shot([1], (s) => {
    F.line(s, 1, { hi: [6] });
  }, { rain: 32 });

  // "The Dow rose 195... / up high" The signboard comes on with the Dow; "high" is held.
  F.shot([2, 3], (s) => {
    const board = F.board([{ label: "DOW JONES", value: "51,850.55", note: "▲ 195.60" }]);
    s.put(board.el, 540, 560);
    F.lightUp(board.el, s.w(2, 1));
    F.lightUp(board.notes[0], s.w(2, 3));
    F.line(s, 2, { hi: [3], out: s.cap(3).start - 0.5 });
    const up = F.line(s, 3, { it: [0, 1], hi: [1] });
    F.big(s, "high", s.w(3, 1), s.t1 - 0.05, { y: 930, max: 400 });
    R.tl.to(up[1], { opacity: 0, duration: 0.3 }, s.w(3, 1) + 0.25);
  });

  // "Nasdaq fell —" Rain on the ground; the board's second row is red.
  F.shot([4], (s) => {
    const board = F.board([{ label: "NASDAQ", value: "27,245.90", color: RED, note: "▼ 0.44%", noteColor: RED }]);
    s.put(board.el, 540, 600);
    F.lightUp(board.el, s.t0 + 0.12);
    F.line(s, 4);
  }, { rain: 36, dip: [0.2, 0.2] });

  // "The other indexes slipped tonight" He reads it on his phone: the night's card.
  F.shot([5], (s) => {
    const card = F.card("Tonight", [
      { name: "Dow", value: "0.38%", up: true },
      { name: "S&P 500", value: "0.06%", up: false },
      { name: "Nasdaq", value: "0.44%", up: false },
    ]);
    s.put(card.el, 540, 1000);
    F.rise(card.el, s.t0 + 0.1);
    [s.w(5, 1), s.w(5, 2), s.w(5, 3)].forEach((t, i) => F.rise(card.rows[i], t, 0.4));
    F.line(s, 5, { hi: [4], y: 1250 });
  }, { rain: 22 });

  // "Oil runs high, the chips fall low" The nozzle, then a chip on "the chips": the hook's one hard cut.
  F.shot([6], (s) => {
    const t = s.times(6);
    const oil = F.board([{ label: "BRENT CRUDE", value: "▲ 1.8%" }], { w: 620, size: 104 });
    s.put(oil.el, 540, 620);
    F.lightUp(oil.el, t[0] + 0.1);
    R.tl.set(oil.el, { autoAlpha: 0 }, t[3]);
    const chips = F.board([{ label: "MICRON", value: "▼ 3.88%", color: RED }], { w: 620, size: 104 });
    s.put(chips.el, 540, 620);
    F.lightUp(chips.el, t[4]);
    F.swell(s, t[3], 0.12, "150,200,255");
    const words = F.line(s, 6, { hi: [2] });
    words[6].style.color = RED;
    // the words do what they say
    R.tl.to(words[2], { y: -16, duration: 0.6, ease: "power2.out" }, t[2] + 0.3);
    R.tl.to(words[6], { y: 16, duration: 0.6, ease: "power2.out" }, t[6] + 0.3);
  }, { rain: 0 });

  // "The pump keeps humming, on and slow" The gauge, and the counter turning.
  F.shot([7], (s) => {
    const t = s.times(7);
    const counter = F.counter(["BRENT · $ A BARREL", "UP TODAY"]);
    s.put(counter.el, 540, 500);
    F.rise(counter.el, s.t0 + 0.1);
    fx.count(counter.top, s.t0 + 0.1, 104.72, 106.65, t[6] - s.t0 + 0.3, (v) => v.toFixed(2));
    counter.bottom.textContent = "+1.93";
    F.lightUp(counter.bottom, t[6]);
    F.line(s, 7, { hi: [6] });
  }, { rain: 0 });

  // "One index up —" The empty road. Nothing else: the breath.
  F.shot([8], (s) => {
    F.line(s, 8, { out: s.cap(8).end + 0.3 });
  }, { rain: 40 });

  // "The Dow walks home alone" The longest hold of the song.
  F.shot([9], (s) => {
    const line = F.line(s, 9, { hi: [4], out: s.cap(9).end + 0.5 });
    F.big(s, "alone", s.w(9, 4), s.t1 - 0.25, { y: 600, max: 420, grow: 0.2 });
    R.tl.to(line[4], { opacity: 0, duration: 0.3 }, s.w(9, 4) + 0.3);
  }, { rain: 18, dip: [0.4, 0.5] });
})();
