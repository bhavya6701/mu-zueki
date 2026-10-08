// Verse 4, lines 25 to 30: double time, so the shots are the shortest in the reel.
(function () {
  const { fx, COLOR } = R;

  // "Yields won't yield"
  R.shot({ caps: [25], ground: "dark", caption: false, lines: 1 }, (s) => {
    fx.slam(s.row("YIELDS", { w: 864 }), s.w(25, 0));
    fx.side(s.row("WON'T", { w: 864, color: COLOR.red }), s.w(25, 1), 1, 0.2);
    const last = s.row("YIELD", { w: 864 });
    fx.squash(last, s.w(25, 2), 0.2);
  });

  // "no they won't back down"
  R.shot({ caps: [26], ground: "light", caption: false, lines: 1 }, (s) => {
    const no = s.words(["NO", "THEY", "WON'T"], { w: 864 });
    no.forEach((word, i) => fx.slam(word, s.t0 + i * 0.07, 1.5, 0.18));
    const back = s.words(["BACK", "DOWN"], { w: 864 });
    fx.slam(back[0], s.w(26, 3), 1.6, 0.18);
    fx.slam(back[1], s.w(26, 4), 1.6, 0.18);
    back[1].style.color = COLOR.red;
    fx.pop(s.put(s.pix("down", 18), 540, 1130), s.w(26, 4), 0.18);
  });

  // "got the whole tape red": the whole frame is red, with the tape running across it.
  R.shot({ caps: [27], ground: "red", caption: false }, (s) => {
    ["WHOLE", "TAPE", "RED"].forEach((word, i) => {
      const row = s.row(word, { w: 864, max: 330, color: i === 2 ? COLOR.white : COLOR.dark });
      fx.slam(row, i === 0 ? s.t0 : s.w(27, i + 2), 1.6, 0.16);
    });
    [330, 1230].forEach((y, k) => {
      const tape = document.createElement("div");
      tape.style.cssText = "display:flex;gap:34px;filter:brightness(0)";
      for (let i = 0; i < 16; i++) tape.appendChild(s.pix("down", 9, { outline: false }));
      s.put(tape, 540, y);
      R.tl.fromTo(tape, { x: k ? -160 : 160 }, { x: k ? 160 : -160, duration: s.t1 - s.t0, ease: "none" }, s.t0);
    });
  });

  // "Then a strong bond auction"
  R.shot({ caps: [28], ground: "dark" }, (s) => {
    fx.slam(s.row("STRONG", { w: 700 }), s.w(28, 2), 1.6, 0.2);
    const auction = s.words(["BOND", "AUCTION"], { w: 864 });
    fx.slam(auction[0], s.w(28, 3), 1.6, 0.2);
    fx.slam(auction[1], s.w(28, 4), 1.6, 0.2);
    fx.rise(s.row("$39B of 10-year notes", { w: 560, font: "text" }), s.w(28, 3), 0.16);
    s.carry(s.put(s.pix("bill", 14), 540, 420, -6), s.t0);
    const sold = s.put(Object.assign(document.createElement("div"), { className: "row tag", textContent: "SOLD" }), 800, 1190, -10);
    sold.style.cssText = `font-size:96px;color:${COLOR.red}`;
    fx.slam(sold, s.w(28, 4) + 0.06, 2.4, 0.2);
  });

  // "cooled it off / pulled it back from the edge"
  R.shot({ caps: [29, 30], ground: "light" }, (s) => {
    const cooled = s.words(["COOLED", "IT", "OFF"], { w: 864 });
    cooled.forEach((word, i) => fx.slam(word, s.w(29, i), 1.5, 0.18));
    // The heat drains out of the gauge.
    const gauge = document.createElement("div");
    gauge.style.cssText = `width:700px;height:40px;border:7px solid ${s.fg};padding:5px`;
    const heat = gauge.appendChild(document.createElement("div"));
    heat.style.cssText = `width:100%;height:100%;background:${COLOR.red};transform-origin:0 50%`;
    s.add(gauge);
    R.tl.fromTo(heat, { scaleX: 1 }, { scaleX: 0.28, duration: 0.42, ease: "power3.out" }, s.t0 + 0.04);
    const pulled = s.words(["PULLED", "IT", "BACK"], { w: 864 });
    // The line starts at the right edge and is hauled back to the middle.
    fx.side(pulled[0].parentNode, s.w(30, 0), 1, 0.3);
    const edge = s.words(["from the", "EDGE"], { w: 600, font: "text" });
    fx.rise(edge[0], s.w(30, 3), 0.12);
    fx.slam(edge[1], s.w(30, 5), 2, 0.16);
    edge[1].style.color = COLOR.red;
    const line = document.createElement("div");
    line.style.cssText = `width:10px;height:1100px;background:${COLOR.red}`;
    s.put(line, 1030, 780);
  });
})();
