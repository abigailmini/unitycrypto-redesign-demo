# UnityCrypto / UFC — Guided Career-Path Redesign Demo

**Live demo:** https://abigailmini.github.io/unitycrypto-redesign-demo/

A clickable UI/UX redesign prototype for David's UnityCrypto member app
(`app.unitycrypto.com` / Unity Fund Challenge). Static HTML/CSS/JS, mock data,
no backend. Built to mirror **their** dark visual language — the design tokens
(colors, fonts, card styles, belt system) were pulled directly from the live app.

---

## The problem (from the audit)

The live member app dumps a new trader into an "everything-everywhere" dashboard:
$0, a flat progress bar, 9 affiliate logos, 3 "Coming Soon" pages, and no answer
to the one question that matters — **"what do I do next?"**

The result: **573 of 634 members (90.4%) are stuck at White belt** with no visible
next step. The public site (`ufc.unitycrypto.com`) is exciting; the app itself is empty.

## The fix: ONE guided path, not 10 menus

This demo rebuilds the home screen around a single idea — **a career quest line**.

### What changed

| # | Live app today | This demo |
|---|----------------|-----------|
| 1 | Belt bar shows `$0 · Next White · $0 to go` (confusing) | **Belt hero front and center**: "White Trader → next: Yellow", real % + "$X to Yellow", a live "YOU ARE HERE" marker |
| 2 | Dismissable Chinese-only onboarding modal | **Step-by-step onboarding rail** — 6 numbered quest steps, video-first, locked/unlocked/done states, "you are here", simulates progression on click |
| 3 | Zero community data inside the app | **Live community energy strip**: $12.25M goal bar, recent withdrawals feed, top-3 leaderboard + *your* rank, belt distribution |
| 4 | 10-icon nav sprawl | **Slim nav**: Home / Earn / Community / Learn (+ profile) |
| 5 | Learning 100% paywalled, prices hidden | **Learn page**: Stage 1 unlocked **free** with a video list; Stages 2–4 locked with price + "what is X/Y/Z Mode?" explained upfront |
| 6 | Name bug "David Yag Mini", red "REJECTED $0", Chinese-only copy | **Fixed**: name spelled right, no scary red stats, **EN / 中文 toggle** in the top bar |
| 7 | Desktop-only single scroll | **Mobile responsive** |

### The onboarding rail (the heart of the ask)

A game-style quest line where each step unlocks the next:

1. ▶️ **Watch: How Unity works** (2 min) — video-first
2. Register FundedXYZ & link your UID
3. ▶️ **Watch: Pass your first challenge**
4. Start Stage 1: Discover (free lesson)
5. Join the monthly community sprint
6. First withdrawal 🎉

Click through it — steps complete, the belt bar fills, withdrawn total climbs,
and a celebratory toast fires. Everything is front-loaded around the trader's
next single action.

---

## Try it

- **Click the gold button on the current step** to advance the quest.
- **Video steps** open a placeholder player → "Mark watched & continue".
- **EN / 中文 toggle** (top-right) switches the whole onboarding rail + chrome.
- **Double-click the yellow demo banner** to reset the journey.

## Files

```
index.html   guided dashboard home (belt hero + quest rail + community energy)
learn.html   redesigned Learn page (Stage 1 free, paywall done right)
styles.css   design tokens mirrored 1:1 from app.unitycrypto.com
app.js       quest progression, belt simulation, i18n, video modal, toast
original/    saved rendered HTML + design tokens from the real app (reference)
```

## Design fidelity

Tokens lifted straight from the live app's CSS custom properties, e.g.
`--bg:#0b0e14`, `--card:#11141cd9`, `--gold:#f0b90b`, belt colors, gold gradients,
Inter / JetBrains Mono. It should *feel* like their app, not a foreign template.

## Caveats

- **Persuasion prototype, not production.** Mock data, no auth, no real videos/embeds.
- Community numbers are the real audit figures ($12.25M, 573 White, etc.) used as static mock data.
- Progression state is stored in `localStorage` for the demo only.

*Built by Sam (coding agent) for David, from Max's audit of app.unitycrypto.com.*
