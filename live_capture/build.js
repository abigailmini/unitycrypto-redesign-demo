const fs = require("fs");

let h = fs.readFileSync("live_raw.html", "utf8");

// 1) Strip ALL scripts (static replica; no hydration)
h = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
h = h.replace(/<script\b[^>]*\/>/gi, "");

// 2) Remove preload/prefetch links for scripts & fonts & manifest (avoid 404s)
h = h.replace(/<link\b[^>]*rel="preload"[^>]*as="script"[^>]*>/gi, "");
h = h.replace(/<link\b[^>]*rel="preload"[^>]*as="font"[^>]*>/gi, "");
h = h.replace(/<link\b[^>]*rel="manifest"[^>]*>/gi, "");
h = h.replace(/<link\b[^>]*rel="modulepreload"[^>]*>/gi, "");

// 3) Rewrite the 4 CSS <link> hrefs -> local assets/css/<name>.css
h = h.replace(/href="\/_next\/static\/chunks\/([^"?]+)\.css[^"]*"/gi,
  (m, name) => `href="assets/css/${name}.css"`);

// 4) image preload + icon links -> local
h = h.replace(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*href="\/career\/([^"?]+)"[^>]*>/gi,
  (m, f) => `<link rel="preload" as="image" href="assets/img/${f}">`);
h = h.replace(/<link\b([^>]*)rel="icon"([^>]*)href="\/icon\.png[^"]*"([^>]*)>/gi,
  `<link rel="icon" type="image/png" href="assets/img/icon.png">`);
h = h.replace(/<link\b[^>]*rel="apple-touch-icon"[^>]*>/gi,
  `<link rel="apple-touch-icon" href="assets/img/icon.png">`);

// 5) Rewrite any remaining /career/*.svg (img src etc.) -> assets/img/
h = h.replace(/(src|href)="\/career\/([^"?]+)(\?[^"]*)?"/gi,
  (m, attr, f) => `${attr}="assets/img/${f}"`);

// 6) Replace the mux-player element with a static poster (16:9)
h = h.replace(/<mux-player\b[\s\S]*?<\/mux-player>/i,
  `<div class="pw-livevideo" role="img" aria-label="欢迎来到 Trader Career · 1:11">
     <img src="assets/video_poster.png" alt="Trader Career intro video" />
     <span class="pw-livevideo-play" aria-hidden="true"></span>
   </div>`);

// Safety: neutralize any stray mux-player self-reference / leftover tag
h = h.replace(/<mux-player\b[^>]*>/gi, "");
h = h.replace(/<\/mux-player>/gi, "");

// 7) Inject paywall CSS before </head>
const css = fs.readFileSync("paywall.css", "utf8");
h = h.replace("</head>", `<style id="pw-styles">\n${css}\n</style>\n</head>`);

// 8) Inject paywall markup + JS before </body>
const markup = fs.readFileSync("paywall.html", "utf8");
const js = fs.readFileSync("paywall.js", "utf8");
h = h.replace("</body>", `${markup}\n<script>\n${js}\n</script>\n</body>`);

fs.writeFileSync("../learning.html", h);
console.log("built ../learning.html", h.length, "bytes");
// sanity checks
console.log("remaining <script src:", (h.match(/<script[^>]*src=/gi)||[]).length);
console.log("remaining /_next refs:", (h.match(/\/_next\//g)||[]).length);
console.log("remaining mux-player:", (h.match(/mux-player/gi)||[]).length);
