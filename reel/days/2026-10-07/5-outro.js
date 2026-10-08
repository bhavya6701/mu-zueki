// The hook's return (lines 31 to 34, grounds swapped) and the spoken sign-off (line 35).
(function () {
  const { fx, COLOR } = R;

  R.hook.wednesday(31, "dark");
  R.hook.dowDown(32, "light", true);
  R.hook.yieldsHigh(33, "dark");
  R.hook.streakDone(34, "light");

  // "That's the tape. Mu-Zueki." The beat is gone: wide letters, then the signature.
  R.shot({ caps: [35], ground: "dark", caption: false }, (s) => {
    const tape = s.words(["THAT'S", "THE", "TAPE."], { w: 520 });
    tape.forEach((word, i) => R.tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 0.1 }, s.w(35, i)));
    R.tl.fromTo(tape[0].parentNode, { letterSpacing: "0em" }, { letterSpacing: "0.34em", duration: s.t1 - s.t0, ease: "power2.out" }, s.t0);
    const name = s.scribble("Mu-Zueki", { size: 300, seed: 35 });
    name.draw(s.w(35, 3), 0.45, s.t1);
    R.mark(name.el.parentNode, s.cap(35).end, { at: 0.95, weight: 12, duration: 0.3, seed: 36 });
    fx.rise(s.row("Oct 7, 2026 · not financial advice", { w: 600, font: "text" }), s.cap(35).end + 0.25);
  });

  // The ending: a circle opens from the signature into the light ground, and the day's icons settle on a loose grid around
  // the signature. The loop back to "Wednesday" is then a cut between two frames of the same colour.
  const SPRITE_WIDTH = { coin: 12, bill: 18, calendar: 12, bell: 12, fed: 16, down: 9, up: 9, tick: 9, cross: 7 };
  const openAt = Math.min(R.duration - 1.2, TIMELINE.captions[34].end + 0.7);
  R.shot({ at: openAt, over: 0.5, ground: "light", caption: false }, (s) => {
    const origin = "540px 800px";
    R.tl.fromTo(s.box, { clipPath: "circle(0px at " + origin + ")" }, { clipPath: "circle(2300px at " + origin + ")", duration: 0.5, ease: "power3.inOut" }, s.t0);

    const name = R.scribble("Mu-Zueki", { size: 190, seed: 35, color: s.fg, w: 480 });
    s.put(name.el, 540, 810);
    name.draw(s.t0 + 0.2, 0.25, s.t1);

    // One cell per item on a 3 x 5 grid (the middle cell is the signature), nudged off-centre so it reads
    // as scattered but nothing collides or bunches up.
    const random = R.rng(77);
    const cells = [];
    [360, 585, 810, 1035, 1260].forEach((y, row) =>
      [210, 540, 870].forEach((x) => (x === 540 && y === 810 ? 0 : cells.push({ x: x + (row % 2 ? 46 : -46) * (y === 810 ? 0 : 1), y }))),
    );
    for (let k = cells.length - 1; k > 0; k--) {
      const j = Math.floor(random() * (k + 1));
      [cells[k], cells[j]] = [cells[j], cells[k]];
    }
    const items = ["coin", "bill", "calendar", "bell", "fed", "down", "up", "tick", "cross", "coin"];
    cells.forEach((cell, k) => {
      const x = cell.x + (random() - 0.5) * 120;
      const y = cell.y + (random() - 0.5) * 90;
      const t = s.t0 + 0.24 + k * 0.04;
      let node;
      if (k < items.length) {
        node = s.put(s.pix(items[k], Math.round((96 + random() * 50) / SPRITE_WIDTH[items[k]])), x, y, random() * 28 - 14);
      } else {
        node = document.createElement("div");
        node.style.cssText = "width:16px;height:16px;border-radius:50%;background:" + s.fg;
        s.put(node, x, y);
      }
      R.tl.fromTo(node, { scale: 0, y: 30 }, { scale: 1, y: 0, duration: 0.34, ease: "back.out(1.8)" }, t);
      R.tl.to(node, { y: (random() - 0.5) * 22, rotation: (random() - 0.5) * 8, duration: s.t1 - t - 0.34, ease: "sine.inOut" }, t + 0.34);
      // A thin red loop thrown around a few of them.
      if (k < items.length && k % 3 === 0) {
        const loop = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        loop.setAttribute("width", 220);
        loop.setAttribute("height", 200);
        loop.style.overflow = "visible";
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M150 30 C 60 -10 -10 60 20 130 C 50 200 190 190 205 110 C 215 50 150 10 90 24");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", COLOR.red);
        path.setAttribute("stroke-width", 4);
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("pathLength", 1);
        path.setAttribute("stroke-dasharray", "1 1");
        path.setAttribute("stroke-dashoffset", 1);
        loop.appendChild(path);
        s.put(loop, x, y, random() * 360);
        R.tl.to(path, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, t + 0.3);
      }
    });
  });
})();
