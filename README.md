# Cable size by length: phone app

This folder is a ready-to-host phone app (a PWA). Once it is online at an https:// address,
anyone can install it from the link and use it without internet.

1. Upload everything in this folder, keeping the `icons` folder, to any static HTTPS host:
   GitHub Pages, Netlify, Cloudflare Pages, or a server you already run.
   A subfolder works too, for example https://example.com/cable/
2. Send the link (WhatsApp is fine).
   - Android: open it in Chrome and tap Install (or ⋮, then Install app).
   - iPhone: open it in Safari, tap Share, then Add to Home Screen.

The app shows these install steps itself, in English, Hebrew and Arabic.

Updating: replace index.html on the host. Phones pick up the new version the second
time they open the app. If you change the icons or add files, also raise VERSION at the
top of sw.js.
