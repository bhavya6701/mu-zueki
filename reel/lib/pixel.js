// Pixel-art sprites drawn as crisp SVG squares. PIX.make("coin", 12) returns an <svg> 12 px per pixel.
(function () {
  const INK = "#111111";
  const PALETTE = {
    k: INK,
    w: "#FFFFFF",
    l: "#D5D3CF",
    g: "#8A8884",
    y: "#F6C636",
    o: "#C98A12",
    r: "#E23A2E",
    d: "#9E1F18",
    n: "#49B45A",
    m: "#2B7335",
  };

  const ART = {
    coin: [
      "....yyyy....",
      "..yyyyyyyy..",
      ".yyywwyyyyo.",
      ".yywyookyyo.",
      "yyywyookyyoo",
      "yyyyyookyyoo",
      "yyyyyookyyoo",
      "yyyyyookyyoo",
      ".yyyyookyoo.",
      ".yyyykkkyoo.",
      "..yyyyyooo..",
      "....oooo....",
    ],
    bill: [
      "mmmmmmmmmmmmmmmmmm",
      "mnnnnnnnnnnnnnnnnm",
      "mnmnnnnnwwnnnnnmnm",
      "mnnnnnnwnnwnnnnnnm",
      "mnnnnnnnwnnnnnnnnm",
      "mnnnnnnnnwnnnnnnnm",
      "mnnnnnnwnnwnnnnnnm",
      "mnmnnnnnwwnnnnnmnm",
      "mnnnnnnnnnnnnnnnnm",
      "mmmmmmmmmmmmmmmmmm",
    ],
    calendar: [
      "..g......g..",
      "rrrrrrrrrrrr",
      "rrrrrrrrrrrr",
      "rrrrrrrrrrrr",
      "wwwwwwwwwwww",
      "wwwkkkkkkwww",
      "wwwwwwwkkwww",
      "wwwwwwkkwwww",
      "wwwwwkkwwwww",
      "wwwwwkkwwwww",
      "wwwwwwwwwwww",
      "llllllllllll",
    ],
    fed: [
      ".......ww.......",
      ".....wwwwww.....",
      "...wwwwwwwwww...",
      ".wwwwwwwwwwwwww.",
      "llllllllllllllll",
      ".ww.ww.ww.ww.ww.",
      ".ww.ww.ww.ww.ww.",
      ".ww.ww.ww.ww.ww.",
      ".ww.ww.ww.ww.ww.",
      ".ww.ww.ww.ww.ww.",
      "llllllllllllllll",
      "wwwwwwwwwwwwwwww",
    ],
    bell: [
      ".....yy.....",
      "....yyyy....",
      "...ywyyyo...",
      "...ywyyyo...",
      "..yywyyyoo..",
      "..yywyyyoo..",
      "..yyyyyyoo..",
      ".yyyyyyyyoo.",
      ".yyyyyyyooo.",
      "yyyyyyyyyooo",
      ".....oo.....",
      ".....oo.....",
    ],
    down: [
      "...rrr...",
      "...rrr...",
      "...rrr...",
      "...rrr...",
      "...rrr...",
      "rrrrrrrrr",
      ".rrrrrrr.",
      "..rrrrr..",
      "...rrr...",
      "....r....",
    ],
    tick: [".......nn", "......nnn", ".....nnn.", "nn..nnn..", "nnnnnn...", ".nnnn....", "..nn....."],
    cross: ["rr...rr", "rrr.rrr", ".rrrrr.", "..rrr..", ".rrrrr.", "rrr.rrr", "rr...rr"],
    block: ["rr", "rr"],
  };
  ART.up = ART.down.slice().reverse();

  // A round white clock face with twelve marks; the hands are added by PIX.clock.
  ART.face = (function () {
    const size = 15;
    const rows = [];
    for (let y = 0; y < size; y++) {
      let row = "";
      for (let x = 0; x < size; x++) {
        const distance = Math.hypot(x - 7, y - 7);
        const mark = (x === 7 && (y === 1 || y === 13)) || (y === 7 && (x === 1 || x === 13));
        row += distance > 7.4 ? "." : distance > 6.3 ? "g" : mark ? "k" : "w";
      }
      rows.push(row);
    }
    return rows;
  })();

  const NS = "http://www.w3.org/2000/svg";

  function make(name, cell, options) {
    const outline = !options || options.outline !== false;
    const art = ART[name];
    const pad = outline ? 1 : 0;
    const cols = Math.max(...art.map((row) => row.length)) + pad * 2;
    const rows = art.length + pad * 2;
    const at = (x, y) => {
      const row = art[y - pad];
      const ch = row === undefined ? undefined : row[x - pad];
      return ch === undefined || ch === "." ? null : ch;
    };
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "pix");
    svg.setAttribute("width", cols * cell);
    svg.setAttribute("height", rows * cell);
    svg.setAttribute("viewBox", `0 0 ${cols} ${rows}`);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; ) {
        let ch = at(x, y);
        // A transparent pixel that touches a filled one becomes the outline.
        if (!ch && outline && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) ch = "k";
        if (!ch) {
          x++;
          continue;
        }
        const fill = PALETTE[ch];
        let run = 1;
        const same = (nx) => {
          let next = at(nx, y);
          if (!next && outline && (at(nx - 1, y) || at(nx + 1, y) || at(nx, y - 1) || at(nx, y + 1))) next = "k";
          return next && PALETTE[next] === fill;
        };
        while (x + run < cols && same(x + run)) run++;
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", run + 0.02);
        rect.setAttribute("height", 1.02);
        rect.setAttribute("fill", fill);
        svg.appendChild(rect);
        x += run;
      }
    }
    return svg;
  }

  // A clock whose hands can be turned: returns { el, hour, minute }.
  function clock(cell) {
    const el = document.createElement("div");
    const size = 17 * cell;
    el.style.cssText = `position:relative;width:${size}px;height:${size}px;flex-shrink:0`;
    el.appendChild(make("face", cell));
    const hand = (length, width) => {
      const div = document.createElement("div");
      div.style.cssText =
        `position:absolute;left:${size / 2 - (width * cell) / 2}px;top:${size / 2 - length * cell}px;` +
        `width:${width * cell}px;height:${length * cell}px;background:${INK};transform-origin:50% 100%`;
      el.appendChild(div);
      return div;
    };
    return { el, minute: hand(5.5, 1), hour: hand(3.5, 1) };
  }

  window.PIX = { make, clock, names: Object.keys(ART), INK };
})();
