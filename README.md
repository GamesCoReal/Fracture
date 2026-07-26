# Drift — Geometric Universe

A relaxing, endless-progression tap game built with vanilla HTML/CSS/JS. No frameworks, no build step, no server required to play — works fully offline once loaded.

## Running it

**Quickest (works, but skips the offline service worker):**
Open `index.html` directly in Safari on iPhone (AirDrop the folder to yourself, or use the Files app).

**Recommended (full offline install + "Add to Home Screen"):**
Host the folder anywhere static (GitHub Pages, Netlify, Cloudflare Pages, or `python3 -m http.server` on your own machine for local testing), then visit it once in Safari over https/localhost. That lets the service worker (`sw.js`) cache everything, and `localStorage` gets a stable origin for saves. After that first visit, it works with the network off, and you can add it to your home screen for an app-like feel.

## What's here

```
index.html            shell + panel layout
manifest.json / sw.js  installability + offline caching
css/style.css          all visual styling (dark theme, panels, research tree)
js/config/              shapes.js, powers.js, abilities.js, upgrades.js — all game data
js/core/                save.js, audio.js, performance.js, entities.js, physics.js, render.js
js/systems/              powers.js (tap resolution), abilities.js, autotapper.js
js/ui/                   one file per bottom-nav tab, plus ui.js (tab/panel controller)
js/main.js               game loop + input wiring
```

## How it plays

- Tap a shape: **Small** shapes are destroyed, **Medium** and **Large** shapes split down a tier.
- **Corrupted** shapes (Medium/Large only, purple glow) spawn a shape you haven't unlocked yet when destroyed.
- Spend the single currency (◆) in **Research** to unlock new shapes along a branching tree, in **Upgrades** for endless spawn/world tuning, and in **Powers** for tap-changing powers and persistent abilities (Gravity Well, Auto Tapper).
- Long-press the world to place your Gravity Well once it's unlocked.
- Everything autosaves to `localStorage` — refreshing Safari won't lose progress.
- A performance system watches your frame rate and automatically scales the number of active shapes to hold 60 FPS; you can also pin it to High or Low in Settings.

## Extending it

Add new shapes by editing the `build()` function in `js/config/shapes.js` — every node just needs `sides` (0 = circle), optional `star`/`rounded`, `parents`, and a `level` (drives cost + rarity). New powers/abilities follow the same declarative pattern in `js/config/powers.js` and `js/config/abilities.js`.
