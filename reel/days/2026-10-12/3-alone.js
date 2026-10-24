// 2026-10-12, the bare passage (lines 15 to 18), the close (19, 20) and the sign-off.
(function () {
  const { film: F } = R;
  const { BONE } = F;

  // "Chips slid —" The band drops out on the downbeat; rain on glass, and a wait before the voice.
  F.shot([15], (s) => {
    F.line(s, 15);
  }, { at: F.downbeat(F.lastWord(14)), rain: 14, pulse: 0 });

  // "Only the Dow closed high" The station again, and the line alone.
  F.shot([16], (s) => {
    F.line(s, 16, { hi: [4], y: 860, size: 112, w: 800 });
  }, { rain: 18, foot: 0.35, pulse: 0 });

  // "Tomorrow the big banks..." One name on each word.
  F.shot([17], (s) => {
    const t = s.times(17);
    const notice = F.notice("TOMORROW · EARNINGS", ["JPMorgan", "Goldman Sachs", "Citigroup", "Wells Fargo"]);
    s.put(notice.el, 540, 700);
    F.rise(notice.el, s.t0 + 0.05, 0.35);
    notice.items.forEach((item, i) => F.rise(item, t[i] + 0.08, 0.35));
    F.line(s, 17, { hi: [0] });
  }, { rain: 12, pulse: 0 });

  // "tonight, the rain" Water off the roof. The band comes back on the downbeat before the close.
  F.shot([18], (s) => {
    F.line(s, 18, { hi: [2], out: s.cap(18).end + 0.5 });
  }, { rain: 40, pulse: 0.09 });

  // "Signboard flickers low" The board again, failing.
  F.shot([19], (s) => {
    const board = F.board([{ label: "DOW JONES", value: "51,850.55", note: "▲ 195.60" }]);
    s.put(board.el, 540, 600);
    F.flicker(board.el, s.w(19, 1), s.w(19, 2) + 0.45, 0.28);
    F.line(s, 19, { hi: [2] });
  }, { rain: 30 });

  // "The Dow walks home alone" The walker, from further off.
  F.shot([20], (s) => {
    const line = F.line(s, 20, { hi: [4] });
    F.big(s, "alone", s.w(20, 4), s.t1 - 0.05, { y: 600, max: 420, grow: 0.12 });
    R.tl.to(line[4], { opacity: 0, duration: 0.3 }, s.w(20, 4) + 0.3);
  }, { rain: 18, dip: [0.3, 0.55] });

  // The music has ended; only the rain is left. The sign-off, on a tape.
  F.shot([21], (s) => {
    const tape = F.cassette("That's the tape.");
    s.put(tape.el, 540, 700);
    F.rise(tape.el, s.t0 + 0.15, 0.6);
    tape.reels.forEach((reel) => F.spin(reel, s.t0, s.t1, 1.2));
    const name = F.box(`font-family:"Instrument Serif";font-size:150px;line-height:1;white-space:nowrap;color:${BONE};text-transform:none`, null, "Mu-Zueki");
    s.put(name, 540, 1090);
    F.rise(name, s.w(21, 3), 0.6);
  }, { ground: "dark", rain: 30, foot: 0, pulse: 0, dip: [0.5, 0] });
})();
