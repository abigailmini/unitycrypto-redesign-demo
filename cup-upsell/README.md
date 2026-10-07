# 🏆 XYZ Cup — Upsell Kit

A self-contained, drop-in **sales layer** for the FundedXYZ competition
("XYZ Cup" — live at `app.fundedxyz.com/competition/uc-uptober`).

**The problem it solves:** the competition today is pure UI/UX with **zero
upsell** — nothing pushes free participants to buy a **real X Mode account**.
This kit turns competition traffic into X Mode purchases.

**Live demo:** https://abigailmini.github.io/unitycrypto-redesign-demo/cup-upsell/

> ⚠️ This kit is **framework-agnostic** (vanilla JS/CSS) so it can be dropped
> onto the external FundedXYZ competition platform without touching its stack.
> The demo page simulates the real Uptober cup so David can click through all
> five pieces. It is **not deployed to the live platform** — that needs David's
> approval + access to the FundedXYZ app repo (not in abigailmini/FriesAI).

---

## What's in the box (the 5 pieces)

| # | Piece | What it does |
|---|-------|--------------|
| 1 | 🎰 **Lucky Draw wheel** | First-visit spin popup. *Everyone wins* a promo code (10 / 20 / 30% off, weighted). The win moment is the purchase trigger → CTA opens X Mode checkout with the code pre-applied. 48h countdown for urgency. |
| 2 | ⏰ **Recurring upsell** | Session toast every ~12 min **and** at key moments (leaderboard view). Frequency-capped (max 3/session) and dismissible, so it never infuriates. |
| 3 | 🎁 **Congrats voucher** | Fires after joining the competition: "You unlocked 30% OFF X Mode…". Optional email of the same voucher if ESP is wired. |
| 4 | ⚖️ **Free vs X Mode** | The decision-point comparison (inline at the account chooser **or** as a modal). Real X Mode is the visually obvious/default choice. |
| 5 | 🎫 **Promo mechanics** | Code engine (tiers, %, expiry, redemption). Works client-side out of the box; wires to a backend if you give it endpoints. |

All copy is **bilingual EN / 中文** (auto-detects `html lang` / browser, with a
live toggle). Tone is David's brand: *Reward up to 90% · Low risk, high return ·
Use Real Account, get Real REWARD.*

---

## Integrate (2 lines + init)

```html
<link rel="stylesheet" href="/cup-upsell/xyz-cup-upsell.css">
<script src="/cup-upsell/xyz-cup-upsell.js" defer></script>
<script>
  XYZCupUpsell.init({
    checkoutBase: "https://app.fundedxyz.com/register?referral=UFC931",
    promoParam: "promo",     // the query param your checkout reads for a code
    lang: null               // null = auto-detect
  });
</script>
```

Then hook it into the real competition flow:

```js
// at the account chooser (decision point)
XYZCupUpsell.renderCompare("#account-chooser", {
  onJoinFree: () => myJoinFreeFlow()
});

// right after a user joins the competition
XYZCupUpsell.onJoinCompetition({ email: user.email /* optional */ });

// when the leaderboard/rewards page is viewed
XYZCupUpsell.onLeaderboardView();
```

### Full API
`init(cfg)` · `openSpin()` · `openCompare(opts)` · `renderCompare(el,opts)` ·
`onJoinCompetition({tier,email})` · `onLeaderboardView()` · `showRecurring(opts)` ·
`getActiveCode()` · `checkoutUrl()` · `setLang("en"|"zh")` · `track(ev,props)`

---

## Promo codes → checkout (how it maps)

- **Client-side (default):** the kit generates a code like `XYZCUP30AB12`, stores
  it in `localStorage` with a 48h expiry, and appends `&promo=XYZCUP30AB12` to
  `checkoutBase`. No backend required to demo/ship the UI.
- **Backend (recommended for real money):** set `api.issue` / `api.redeem` /
  `api.email`. A zero-dependency reference server lives in
  [`backend/promo-server.js`](backend/promo-server.js):
  - `POST /promo/issue {tier}` → `{code,pct,expiresAt}`
  - `GET  /promo/validate?code=` → checkout verifies before discounting
  - `POST /promo/redeem {code}` → call on successful purchase (one-time)
  - `POST /promo/email {email,code,...}` → send the voucher (stub → wire ESP)
  - `GET  /promo/stats` → issued / redeemed / conversion funnel

  ```js
  XYZCupUpsell.init({
    api: {
      issue:  "https://api.fundedxyz.com/promo/issue",
      redeem: "https://api.fundedxyz.com/promo/redeem",
      email:  "https://api.fundedxyz.com/promo/email"
    }
  });
  ```

> **The actual discount must be applied by the FundedXYZ checkout.** This kit
> carries the code to checkout and tracks intent; the checkout has to read the
> code and reduce the price. FundedXYZ already has referral codes
> (`referral=UFC931`) and, in `ufc-user-dashboard`, an email-referral-code system
> + subaccount email infra — codes can map onto that rather than a new table.

---

## Analytics / conversion tracking

Every moment fires an event: `init, spin_shown, spin_started, spin_won,
code_issued, code_copied, congrats_shown, congrats_emailed, recurring_shown,
recurring_dismissed, compare_shown, compare_join_free, checkout_click,
fab_click`. Sinks (first found wins):

1. `cfg.analytics(event, props)` if provided
2. `window.dataLayer.push({event:"xcu_...", ...})` (GTM)
3. `window.gtag("event","xcu_...", props)` (GA4)
4. `console.debug` fallback

---

## ⚠️ David's decisions before public push

The kit ships the UI with real numbers, but confirm these before going live:

1. **Discount tiers (10/20/30%)** — these are a **sales decision I picked**, not
   existing policy. Confirm the real max discount on X Mode and the odds/weights.
   (Edit `CFG.tiers`.)
2. **Checkout promo param** — I used `&promo=CODE`. Confirm the real param name
   the FundedXYZ checkout reads (or whether codes ride the existing referral
   system). (Edit `CFG.promoParam` / wire `api`.)
3. **`xModePriceFrom` ($180)** — from the SEO site; confirm current price.
4. **Email infra** — demo stubs the email. Wire `api.email` to the real ESP
   (FundedXYZ subaccount email infra exists in `ufc-user-dashboard`).
5. **Deploy to the live competition** — needs the FundedXYZ app repo (external;
   not in abigailmini/FriesAI) + David's go-ahead.

**Already verified as REAL live policy (safe to state publicly):**
`90%` profit split · `2×` X Mode ROI multiplier · funded accounts up to `$25,000`
— all shown live on `app.fundedxyz.com/competition/uc-uptober`.
