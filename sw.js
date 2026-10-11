// Cable size by length: offline support.
// After changing icons or adding files, raise VERSION so phones refresh everything.
const VERSION = "1";
const SHELL = "cable-shell-v" + VERSION;
const FONTS = "cable-fonts-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans+Hebrew:wght@400;500;600;700&display=swap";

// Keep the Latin (Barlow), Hebrew and Arabic font files so every language looks right offline.
async function keepFonts() {
  const cache = await caches.open(FONTS);
  const res = await fetch(FONT_CSS, { mode: "cors" });
  if (!res.ok) return;
  await cache.put(FONT_CSS, res.clone());
  const css = await res.text();
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  const urls = [];
  let m;
  while ((m = re.exec(css))) {
    const subset = m[1], block = m[2];
    const src = /url\(([^)]+)\)/.exec(block);
    if (!src) continue;
    if (subset === "hebrew" || subset === "arabic" || (subset === "latin" && /Barlow/.test(block))) {
      urls.push(src[1].replace(/["']/g, ""));
    }
  }
  await Promise.all(urls.map(async (u) => {
    try {
      const r = await fetch(u, { mode: "cors" });
      if (r.ok) await cache.put(u, r);
    } catch (e) { /* skip this file */ }
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.addAll(ASSETS);
    await keepFonts().catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => (k.startsWith("cable-shell-") && k !== SHELL) || (k.startsWith("cable-fonts-") && k !== FONTS))
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fonts: saved copy first, network only if it was never saved.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req, { ignoreVary: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
    return;
  }

  // The app itself: open instantly from the saved copy, refresh it in the background.
  if (url.origin === self.location.origin) {
    const key = req.mode === "navigate" ? "./index.html" : req;
    event.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req).then((res) => {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(() => null);
      event.waitUntil(fresh.then(() => undefined));
      return hit || (await fresh) || (await cache.match("./index.html")) || Response.error();
    })());
  }
});
