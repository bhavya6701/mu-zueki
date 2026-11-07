// Bundles pixelfx (src/core and every effect in src/fx/index.js) into pixelfx.js, one classic script that sets
// window.PFX = { core, effects } for the reel. Run after adding or changing an effect:
//   node tools/index.mjs   (only when an effect file was added or removed: regenerates src/fx/index.js)
//   node build.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";

const BANNER = "// pixelfx (MIT, see lib/pixelfx/LICENSE and NOTICE.md), bundled by build.mjs. Do not edit.\n";

writeFileSync("entry.js",
  'import * as core from "./src/core/index.js";\nimport { effects } from "./src/fx/index.js";\nwindow.PFX = { core, effects };\n');
try {
  execFileSync("npx", ["--yes", "esbuild@0.25.10", "entry.js", "--bundle", "--format=iife", "--minify",
    "--legal-comments=none", "--outfile=pixelfx.js"], { stdio: "inherit", shell: process.platform === "win32" });
} finally {
  rmSync("entry.js", { force: true });
}
writeFileSync("pixelfx.js", BANNER + readFileSync("pixelfx.js", "utf8"));
