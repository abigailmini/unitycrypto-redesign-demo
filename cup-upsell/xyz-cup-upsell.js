/* =====================================================================
   XYZ CUP — Upsell Kit  v1.0   (self-contained, framework-agnostic)
   Drop-in sales layer for the FundedXYZ competition ("XYZ Cup").
   Goal: convert free competition traffic into real X Mode purchases.

   Include (2 lines):
     <link rel="stylesheet" href="/cup-upsell/xyz-cup-upsell.css">
     <script src="/cup-upsell/xyz-cup-upsell.js" defer></script>
   Then (optional) configure + init:
     <script>XYZCupUpsell.init({ checkoutBase: "...", lang: "en" });</script>

   Public API:
     XYZCupUpsell.init(cfg)
     XYZCupUpsell.openSpin()                 // force the lucky-draw wheel
     XYZCupUpsell.openCompare(opts)          // Free vs X Mode decision modal
     XYZCupUpsell.renderCompare(el, opts)    // inline Free vs X Mode into a node
     XYZCupUpsell.onJoinCompetition(opts)    // fire congrats voucher (+ email)
     XYZCupUpsell.onLeaderboardView()        // key-moment upsell trigger
     XYZCupUpsell.getActiveCode()            // -> {code, pct, expiresAt} | null
     XYZCupUpsell.setLang("en"|"zh")
   ===================================================================== */
(function (w, d) {
  "use strict";
  if (w.XYZCupUpsell && w.XYZCupUpsell.__ready) return;

  /* ------------------------------------------------------------------ *
   * Config — numbers below are REAL FundedXYZ competition policy as of
   * 2026-10 (live on app.fundedxyz.com/competition/uc-uptober):
   *   - X Mode gains count 2x (losses 1x)        -> rewardMultiplier
   *   - Profit sharing split up to 90%           -> profitSplit
   *   - Funded accounts up to $25,000            -> topFunded
   * Discount % tiers below are a SALES decision — confirm with David
   * before public push (see README "David's decisions").
   * ------------------------------------------------------------------ */
  var DEFAULTS = {
    // Where "Buy X Mode" sends the user. Promo code is appended as &promo=CODE.
    checkoutBase: "https://app.fundedxyz.com/register?referral=UFC931",
    promoParam: "promo",                 // <-- confirm the real checkout param name
    lang: null,                          // null = auto-detect (html lang / navigator)
    // discount tiers for the lucky draw (weight = relative odds). Everyone wins.
    tiers: [
      { pct: 10, weight: 50, label: "10%" },
      { pct: 20, weight: 35, label: "20%" },
      { pct: 30, weight: 15, label: "30%" }
    ],
    codeTtlHours: 48,                    // promo expiry window (urgency)
    spinOnFirstVisit: true,
    recurringEnabled: true,
    recurringEveryMin: 12,               // time-based upsell cadence
    recurringMaxPerSession: 3,           // frequency cap (don't infuriate)
    rewardMultiplier: "2X",              // REAL policy
    profitSplit: "90%",                  // REAL policy (up to)
    topFunded: "$25,000",                // REAL policy (up to)
    xModePriceFrom: "$180",              // from pricing.html (confirm current)
    // Backend endpoints (optional). If unset, codes are issued client-side and
    // redemption tracking is best-effort (analytics event only).
    api: {
      issue: null,                       // POST {tier} -> {code,pct,expiresAt}
      redeem: null,                      // POST {code} -> {ok}
      email: null                        // POST {email,code,pct,expiresAt}
    },
    // Analytics sink. Defaults to dataLayer/gtag if present; override to capture.
    analytics: null                      // function(event, props){}
  };

  var CFG = {};
  var LS = "xcu_v1";
  var SS = "xcu_sess_v1";

  /* ------------------------------ i18n ------------------------------ */
  var T = {
    spin_eyebrow:   { en: "🎰 Lucky Draw",                         zh: "🎰 幸运抽奖" },
    spin_title:     { en: "Spin to unlock your X Mode discount",   zh: "转动转盘，解锁你的 X Mode 折扣" },
    spin_sub:       { en: "Every trader wins. Compete with a REAL account and earn up to 90% reward.", zh: "人人有奖。用真实账户参赛，赚取高达 90% 的奖励。" },
    spin_cta:       { en: "SPIN NOW",                              zh: "立即转动" },
    spin_spinning:  { en: "Spinning…",                            zh: "转动中…" },
    won_eyebrow:    { en: "🎉 You won!",                           zh: "🎉 恭喜中奖！" },
    won_title:      { en: 'You won <span class="xcu-hl">{PCT}% OFF</span> X Mode', zh: '你赢得 X Mode <span class="xcu-hl">{PCT}% 折扣</span>' },
    won_sub:        { en: "Use it now — compete with a REAL account and enjoy up to {SPLIT} reward. Low risk, high return.", zh: "立即使用 —— 用真实账户参赛，享受高达 {SPLIT} 的奖励。低风险，高回报。" },
    use_code:       { en: "Use Real Account, get Real REWARD →",   zh: "用真实账户，拿真实奖励 →" },
    maybe_later:    { en: "Maybe later",                           zh: "稍后再说" },
    copy:           { en: "Copy",                                  zh: "复制" },
    copied:         { en: "Copied ✓",                             zh: "已复制 ✓" },
    expires_in:     { en: "Expires in",                            zh: "折扣剩余" },
    expired:        { en: "Expired",                               zh: "已过期" },
    r_reward:       { en: "Reward",                                zh: "奖励" },
    r_roi:          { en: "ROI multiplier",                        zh: "ROI 倍数" },
    r_funded:       { en: "Funded up to",                          zh: "资金高达" },
    congrats_eyebrow:{ en: "🎁 Participant reward",                zh: "🎁 参赛者奖励" },
    congrats_title: { en: "You're in! You unlocked {PCT} OFF X Mode", zh: "报名成功！你解锁了 X Mode {PCT} 折扣" },
    congrats_sub:   { en: "Buy X Mode now and enjoy up to {SPLIT} reward in this competition — your gains count {MULT}.", zh: "立即购买 X Mode，在本次比赛中享受高达 {SPLIT} 奖励 —— 你的收益按 {MULT} 计算。" },
    email_sent:     { en: "We also emailed your code.",            zh: "优惠码也已发送到你的邮箱。" },
    recur_eyebrow:  { en: "⏰ Limited time",                        zh: "⏰ 限时" },
    recur_title:    { en: "Real X Mode = {MULT} the reward",       zh: "真实 X Mode = {MULT} 奖励" },
    recur_sub:      { en: "Free accounts earn limited rewards. Upgrade to a REAL account and your gains count {MULT} — up to {SPLIT} split.", zh: "免费账户奖励有限。升级到真实账户，收益按 {MULT} 计算 —— 高达 {SPLIT} 分成。" },
    recur_cta:      { en: "Upgrade to X Mode",                     zh: "升级到 X Mode" },
    cmp_title:      { en: "Choose your account",                  zh: "选择你的账户" },
    cmp_sub:        { en: "Real Account = Real REWARD. Pick how you compete.", zh: "真实账户 = 真实奖励。选择你的参赛方式。" },
    cmp_free:       { en: "Free Account",                          zh: "免费账户" },
    cmp_free_sub:   { en: "Join the competition",                 zh: "参加比赛" },
    cmp_x:          { en: "X Mode · REAL Account",                 zh: "X Mode · 真实账户" },
    cmp_x_sub:      { en: "Compete for the real prize",           zh: "争夺真实大奖" },
    cmp_best:       { en: "★ Recommended",                         zh: "★ 推荐" },
    cmp_join_free:  { en: "Join free",                             zh: "免费参加" },
    cmp_buy_x:      { en: "Buy X Mode",                            zh: "购买 X Mode" },
    cmp_buy_x_code: { en: "Buy X Mode · {PCT} OFF",               zh: "购买 X Mode · {PCT} 折扣" },
    fab:            { en: "{PCT} OFF X Mode",                      zh: "X Mode {PCT} 折扣" },
    // comparison bullet copy
    f_reward_free:  { en: "Limited reward",                        zh: "奖励有限" },
    f_reward_x:     { en: "Up to {SPLIT} reward",                 zh: "高达 {SPLIT} 奖励" },
    f_roi_free:     { en: "Gains count 1×",                        zh: "收益按 1× 计算" },
    f_roi_x:        { en: "Gains count {MULT} (2× ROI)",          zh: "收益按 {MULT} 计算（2× ROI）" },
    f_funded_free:  { en: "No funded account",                     zh: "无资金账户" },
    f_funded_x:     { en: "Funded up to {FUNDED}",                zh: "资金账户高达 {FUNDED}" },
    f_payout_free:  { en: "Not eligible for cash prizes",          zh: "无资格获得现金大奖" },
    f_payout_x:     { en: "Eligible for every cup prize",          zh: "有资格获得所有赛事奖金" },
    f_price_x:      { en: "From {PRICE}",                          zh: "低至 {PRICE} 起" }
  };

  function tr(key, vars) {
    var lang = CFG.lang === "zh" ? "zh" : "en";
    var s = (T[key] && T[key][lang]) || (T[key] && T[key].en) || key;
    if (vars) for (var k in vars) s = s.replace(new RegExp("{" + k + "}", "g"), vars[k]);
    return s;
  }
  function rvars() {
    return { SPLIT: CFG.profitSplit, MULT: CFG.rewardMultiplier, FUNDED: CFG.topFunded, PRICE: CFG.xModePriceFrom };
  }

  /* --------------------------- storage ------------------------------ */
  function load() { try { return JSON.parse(w.localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function save(o) { try { w.localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function sget(k) { try { return w.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { w.sessionStorage.setItem(k, v); } catch (e) {} }

  /* -------------------------- analytics ----------------------------- */
  function track(event, props) {
    props = props || {};
    props.kit = "xyz-cup-upsell";
    try {
      if (typeof CFG.analytics === "function") { CFG.analytics(event, props); return; }
      if (w.dataLayer && w.dataLayer.push) w.dataLayer.push(Object.assign({ event: "xcu_" + event }, props));
      if (typeof w.gtag === "function") w.gtag("event", "xcu_" + event, props);
      if (!w.dataLayer && typeof w.gtag !== "function") console.debug("[xcu]", event, props);
    } catch (e) {}
  }

  /* ---------------------- promo code engine ------------------------- */
  function pickTier() {
    var total = CFG.tiers.reduce(function (s, t) { return s + (t.weight || 1); }, 0);
    var r = Math.random() * total, acc = 0;
    for (var i = 0; i < CFG.tiers.length; i++) { acc += (CFG.tiers[i].weight || 1); if (r <= acc) return CFG.tiers[i]; }
    return CFG.tiers[CFG.tiers.length - 1];
  }
  function genCodeStr(pct) {
    var n = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "XYZCUP" + pct + n;
  }
  function getActiveCode() {
    var s = load();
    if (s.code && s.expiresAt && Date.now() < s.expiresAt) return { code: s.code, pct: s.pct, expiresAt: s.expiresAt };
    return null;
  }
  // Issue (or reuse) a promo code for a tier. Returns a Promise.
  function issueCode(tier) {
    var existing = getActiveCode();
    if (existing) return Promise.resolve(existing);
    var expiresAt = Date.now() + CFG.codeTtlHours * 3600e3;
    var finish = function (payload) {
      var s = load();
      s.code = payload.code; s.pct = payload.pct; s.expiresAt = payload.expiresAt;
      save(s);
      track("code_issued", { code: payload.code, pct: payload.pct });
      return payload;
    };
    if (CFG.api && CFG.api.issue) {
      return fetch(CFG.api.issue, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.pct })
      }).then(function (r) { return r.json(); })
        .then(function (j) { return finish({ code: j.code, pct: j.pct || tier.pct, expiresAt: j.expiresAt || expiresAt }); })
        .catch(function () { return finish({ code: genCodeStr(tier.pct), pct: tier.pct, expiresAt: expiresAt }); });
    }
    return Promise.resolve(finish({ code: genCodeStr(tier.pct), pct: tier.pct, expiresAt: expiresAt }));
  }
  function checkoutUrl() {
    var ac = getActiveCode();
    var url = CFG.checkoutBase;
    if (ac) url += (url.indexOf("?") > -1 ? "&" : "?") + encodeURIComponent(CFG.promoParam) + "=" + encodeURIComponent(ac.code);
    return url;
  }
  function goCheckout(source) {
    var ac = getActiveCode();
    track("checkout_click", { source: source, code: ac ? ac.code : null, pct: ac ? ac.pct : null });
    if (ac && CFG.api && CFG.api.redeem) {
      // best-effort mark intent; don't block navigation
      try { navigator.sendBeacon ? navigator.sendBeacon(CFG.api.redeem, JSON.stringify({ code: ac.code })) : null; } catch (e) {}
    }
    w.open(checkoutUrl(), "_blank", "noopener");
  }

  /* ----------------------------- DOM -------------------------------- */
  var root; // .xcu-root container that scopes language + styles
  function ensureRoot() {
    if (root) return root;
    root = d.createElement("div");
    root.className = "xcu-root";
    root.setAttribute("data-lang", CFG.lang === "zh" ? "zh" : "en");
    d.body.appendChild(root);
    return root;
  }
  function el(tag, cls, html) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function overlay(wide) {
    ensureRoot();
    var ov = el("div", "xcu-overlay");
    var modal = el("div", "xcu-modal" + (wide ? " xcu-wide" : ""));
    var close = el("button", "xcu-close", "&times;");
    close.setAttribute("aria-label", "Close");
    modal.appendChild(close);
    ov.appendChild(modal);
    root.appendChild(ov);
    function shut() { ov.classList.remove("is-open"); setTimeout(function () { ov.remove(); }, 300); }
    close.onclick = shut;
    ov.addEventListener("click", function (e) { if (e.target === ov) shut(); });
    requestAnimationFrame(function () { ov.classList.add("is-open"); });
    return { ov: ov, modal: modal, body: null, shut: shut };
  }

  function rewardStrip() {
    var v = rvars();
    return '<div class="xcu-rewards">' +
      '<div class="xcu-reward"><b>' + v.SPLIT + '</b><span data-x="en">' + tr("r_reward") + '</span><span data-x="zh">' + T.r_reward.zh + '</span></div>' +
      '<div class="xcu-reward"><b>' + v.MULT + '</b><span data-x="en">' + T.r_roi.en + '</span><span data-x="zh">' + T.r_roi.zh + '</span></div>' +
      '<div class="xcu-reward"><b>' + v.FUNDED + '</b><span data-x="en">' + T.r_funded.en + '</span><span data-x="zh">' + T.r_funded.zh + '</span></div>' +
      '</div>';
  }

  function countdownEl(expiresAt) {
    var box = el("div", "xcu-count");
    function fmt() {
      var ms = expiresAt - Date.now();
      if (ms <= 0) { box.innerHTML = tr("expired"); return false; }
      var h = Math.floor(ms / 3600e3), m = Math.floor((ms % 3600e3) / 60e3), s = Math.floor((ms % 60e3) / 1e3);
      var pad = function (x) { return (x < 10 ? "0" : "") + x; };
      box.innerHTML = tr("expires_in") + " <b>" + pad(h) + ":" + pad(m) + ":" + pad(s) + "</b>";
      return true;
    }
    fmt();
    var t = setInterval(function () { if (!fmt()) clearInterval(t); }, 1000);
    return box;
  }

  function codeBlock(payload) {
    var wrap = el("div");
    var cw = el("div", "xcu-codewrap");
    var code = el("span", "xcu-code", payload.code);
    var copy = el("button", "xcu-copy", tr("copy"));
    copy.onclick = function () {
      try { navigator.clipboard.writeText(payload.code); } catch (e) {}
      copy.textContent = tr("copied"); copy.classList.add("is-done");
      track("code_copied", { code: payload.code });
    };
    cw.appendChild(code); cw.appendChild(copy);
    wrap.appendChild(cw);
    wrap.appendChild(countdownEl(payload.expiresAt));
    return wrap;
  }

  /* --------------------------- confetti ----------------------------- */
  function confetti(mount) {
    var c = el("div", "xcu-confetti");
    var colors = ["#edc443", "#f6d466", "#00d4aa", "#ffffff", "#e74c3c"];
    for (var i = 0; i < 60; i++) {
      var p = el("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.8 + Math.random() * 1.6) + "s";
      p.style.animationDelay = (Math.random() * .4) + "s";
      p.style.transform = "rotate(" + (Math.random() * 360) + "deg)";
      c.appendChild(p);
    }
    mount.appendChild(c);
    setTimeout(function () { c.remove(); }, 3600);
  }

  /* ===================================================================
     1) 🎰 LUCKY DRAW SPIN WHEEL
     =================================================================== */
  function openSpin(opts) {
    opts = opts || {};
    var o = overlay(false);
    var b = el("div", "xcu-body");
    var tiers = CFG.tiers;
    var seg = 360 / (tiers.length * 2); // duplicate tiers around the wheel for a fuller look
    var labels = [];
    for (var i = 0; i < tiers.length * 2; i++) labels.push(tiers[i % tiers.length]);

    // build conic-gradient wheel
    var stops = [], colA = "#1b1d22", colB = "#23262c";
    for (var j = 0; j < labels.length; j++) {
      var c = j % 2 ? colA : colB;
      stops.push(c + " " + (seg * j) + "deg " + (seg * (j + 1)) + "deg");
    }
    b.innerHTML =
      '<div class="xcu-eyebrow">' + tr("spin_eyebrow") + '</div>' +
      '<h3 class="xcu-h">' + tr("spin_title") + '</h3>' +
      '<p class="xcu-p">' + tr("spin_sub") + '</p>' +
      '<div class="xcu-wheel-stage">' +
        '<div class="xcu-wheel-ptr"></div>' +
        '<div class="xcu-wheel" style="background:conic-gradient(' + stops.join(",") + ')"></div>' +
        '<div class="xcu-wheel-hub">🏆</div>' +
      '</div>';
    var spinBtn = el("button", "xcu-btn xcu-spinbtn", tr("spin_cta"));
    b.appendChild(spinBtn);
    o.modal.appendChild(b);

    // label overlay text around wheel
    var wheel = b.querySelector(".xcu-wheel");
    for (var k = 0; k < labels.length; k++) {
      var lab = el("div", null, labels[k].label);
      lab.style.cssText = "position:absolute;left:50%;top:10px;transform-origin:0 120px;" +
        "transform:translateX(-50%) rotate(" + (seg * k + seg / 2) + "deg);" +
        "font-weight:800;font-size:13px;color:#edc443;";
      b.querySelector(".xcu-wheel-stage").appendChild(lab);
    }

    track("spin_shown", {});
    var spun = false;
    spinBtn.onclick = function () {
      if (spun) return; spun = true;
      spinBtn.textContent = tr("spin_spinning"); spinBtn.disabled = true;
      var tier = pickTier();
      track("spin_started", { tier: tier.pct });
      // choose a landing segment matching the won tier
      var idxs = [];
      for (var m = 0; m < labels.length; m++) if (labels[m].pct === tier.pct) idxs.push(m);
      var land = idxs[Math.floor(Math.random() * idxs.length)];
      var targetDeg = 360 * 6 - (seg * land + seg / 2); // 6 full turns + align
      wheel.style.transform = "rotate(" + targetDeg + "deg)";
      setTimeout(function () {
        issueCode(tier).then(function (payload) {
          confetti(o.modal);
          renderWon(o, b, payload);
        });
      }, 4700);
    };
    return o;
  }

  function renderWon(o, b, payload) {
    track("spin_won", { pct: payload.pct, code: payload.code });
    b.innerHTML =
      '<div class="xcu-eyebrow">' + tr("won_eyebrow") + '</div>' +
      '<h3 class="xcu-h">' + tr("won_title", { PCT: payload.pct }) + '</h3>' +
      '<p class="xcu-p">' + tr("won_sub", rvars()) + '</p>';
    b.appendChild(codeBlock(payload));
    b.insertAdjacentHTML("beforeend", rewardStrip());
    var cta = el("a", "xcu-btn", "🚀 " + tr("use_code"));
    cta.href = checkoutUrl(); cta.target = "_blank"; cta.rel = "noopener";
    cta.onclick = function (e) { e.preventDefault(); goCheckout("spin_won"); };
    b.appendChild(cta);
    var later = el("button", "xcu-dismiss", tr("maybe_later"));
    later.onclick = function () { o.shut(); showFab(); };
    b.appendChild(later);
    syncLang();
  }

  /* ===================================================================
     2) ⏰ RECURRING UPSELL TOAST  (+ key-moment triggers)
     =================================================================== */
  var recurTimer = null;
  function recurCount() { return parseInt(sget(SS + "_recur") || "0", 10); }
  function bumpRecur() { sset(SS + "_recur", String(recurCount() + 1)); }

  function showToast(opts) {
    opts = opts || {};
    ensureRoot();
    // don't stack
    var ex = root.querySelector(".xcu-toast"); if (ex) ex.remove();
    var ac = getActiveCode();
    var t = el("div", "xcu-toast");
    var close = el("button", "xcu-close", "&times;");
    var titleKey = opts.titleKey || "recur_title";
    var subKey = opts.subKey || "recur_sub";
    var eyebrow = opts.eyebrow || tr("recur_eyebrow");
    t.appendChild(close);
    t.insertAdjacentHTML("beforeend",
      '<div class="xcu-eyebrow">' + eyebrow + '</div>' +
      '<div class="xcu-th">' + tr(titleKey, rvars()) + '</div>' +
      '<div class="xcu-tp">' + tr(subKey, rvars()) + '</div>');
    var cta = el("a", "xcu-btn",
      ac ? "🚀 " + tr("cmp_buy_x_code", { PCT: ac.pct + "%" }) : "🚀 " + tr("recur_cta"));
    cta.href = checkoutUrl(); cta.target = "_blank"; cta.rel = "noopener";
    cta.onclick = function (e) { e.preventDefault(); goCheckout(opts.source || "recurring"); };
    t.appendChild(cta);
    root.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-open"); });
    track("recurring_shown", { source: opts.source || "recurring", code: ac ? ac.code : null });
    var auto = setTimeout(hide, opts.autoHideMs || 14000);
    function hide() { clearTimeout(auto); t.classList.remove("is-open"); setTimeout(function () { t.remove(); }, 300); if (getActiveCode()) showFab(); }
    close.onclick = function () { track("recurring_dismissed", {}); hide(); };
  }

  function startRecurring() {
    if (!CFG.recurringEnabled) return;
    if (recurTimer) clearInterval(recurTimer);
    recurTimer = setInterval(function () {
      if (recurCount() >= CFG.recurringMaxPerSession) { clearInterval(recurTimer); return; }
      if (root && root.querySelector(".xcu-overlay.is-open")) return; // don't interrupt a modal
      bumpRecur();
      showToast({ source: "recurring_timer" });
    }, CFG.recurringEveryMin * 60e3);
  }

  function onLeaderboardView() {
    if (recurCount() >= CFG.recurringMaxPerSession) return;
    bumpRecur();
    showToast({ source: "leaderboard", eyebrow: tr("recur_eyebrow"),
      titleKey: "recur_title", subKey: "recur_sub" });
  }

  /* ===================================================================
     3) 🎁 CONGRATULATION VOUCHER  (after joining competition)
     =================================================================== */
  function onJoinCompetition(opts) {
    opts = opts || {};
    var tier = opts.tier ? { pct: opts.tier } : pickTier();
    // force the top tier for the "congrats" moment unless a code already exists
    if (!getActiveCode() && !opts.tier) tier = CFG.tiers[CFG.tiers.length - 1];
    issueCode(tier).then(function (payload) {
      var o = overlay(false);
      var b = el("div", "xcu-body");
      b.innerHTML =
        '<div class="xcu-eyebrow">' + tr("congrats_eyebrow") + '</div>' +
        '<h3 class="xcu-h">' + tr("congrats_title", { PCT: payload.pct + "%" }) + '</h3>' +
        '<p class="xcu-p">' + tr("congrats_sub", rvars()) + '</p>';
      b.appendChild(codeBlock(payload));
      b.insertAdjacentHTML("beforeend", rewardStrip());
      var cta = el("a", "xcu-btn", "🚀 " + tr("use_code"));
      cta.href = checkoutUrl(); cta.target = "_blank"; cta.rel = "noopener";
      cta.onclick = function (e) { e.preventDefault(); goCheckout("congrats"); };
      b.appendChild(cta);
      var later = el("button", "xcu-dismiss", tr("maybe_later"));
      later.onclick = function () { o.shut(); showFab(); };
      b.appendChild(later);
      o.modal.appendChild(b);
      confetti(o.modal);
      syncLang();
      track("congrats_shown", { pct: payload.pct, code: payload.code });
      // email the voucher if infra configured / email known
      var email = opts.email || null;
      if (email && CFG.api && CFG.api.email) {
        fetch(CFG.api.email, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, code: payload.code, pct: payload.pct, expiresAt: payload.expiresAt })
        }).then(function () {
          track("congrats_emailed", { code: payload.code });
          var note = el("p", "xcu-p", "📧 " + tr("email_sent")); note.style.marginTop = "10px";
          b.appendChild(note);
        }).catch(function () {});
      }
    });
  }

  /* ===================================================================
     4) FREE vs X MODE  (decision-point comparison)
     =================================================================== */
  function compareHTML(opts) {
    opts = opts || {};
    var v = rvars();
    var ac = getActiveCode();
    var buyLabel = ac ? tr("cmp_buy_x_code", { PCT: ac.pct + "%" }) : tr("cmp_buy_x");
    var priceLine = ac
      ? '<div class="xcu-pricetag"><span class="xcu-strike">' + v.PRICE + '</span> → ' + tr("f_price_x", v) + ' · ' + ac.pct + '% OFF</div>'
      : '<div class="xcu-pricetag">' + tr("f_price_x", v) + '</div>';
    return '' +
      '<div class="xcu-compare">' +
        '<div class="xcu-col">' +
          '<h4>' + tr("cmp_free") + '</h4><div class="xcu-sub">' + tr("cmp_free_sub") + '</div>' +
          '<ul class="xcu-feat">' +
            '<li class="xcu-no"><span class="xcu-ic">✕</span>' + tr("f_reward_free") + '</li>' +
            '<li class="xcu-no"><span class="xcu-ic">✕</span>' + tr("f_roi_free") + '</li>' +
            '<li class="xcu-no"><span class="xcu-ic">✕</span>' + tr("f_funded_free") + '</li>' +
            '<li class="xcu-no"><span class="xcu-ic">✕</span>' + tr("f_payout_free") + '</li>' +
          '</ul>' +
          '<div class="xcu-big">—</div><div class="xcu-pricetag">&nbsp;</div>' +
          '<div class="xcu-cta-slot"><button class="xcu-btn xcu-btn--ghost" data-xcu="join-free">' + tr("cmp_join_free") + '</button></div>' +
        '</div>' +
        '<div class="xcu-col xcu-col--x">' +
          '<span class="xcu-tag">' + tr("cmp_best") + '</span>' +
          '<h4>' + tr("cmp_x") + '</h4><div class="xcu-sub">' + tr("cmp_x_sub") + '</div>' +
          '<ul class="xcu-feat">' +
            '<li><span class="xcu-ic">✓</span>' + tr("f_reward_x", v) + '</li>' +
            '<li><span class="xcu-ic">✓</span>' + tr("f_roi_x", v) + '</li>' +
            '<li><span class="xcu-ic">✓</span>' + tr("f_funded_x", v) + '</li>' +
            '<li><span class="xcu-ic">✓</span>' + tr("f_payout_x") + '</li>' +
          '</ul>' +
          '<div class="xcu-big">' + v.SPLIT + '</div>' + priceLine +
          '<div class="xcu-cta-slot"><button class="xcu-btn" data-xcu="buy-x">🚀 ' + buyLabel + '</button></div>' +
        '</div>' +
      '</div>';
  }

  function wireCompare(scope, opts) {
    opts = opts || {};
    var buy = scope.querySelector('[data-xcu="buy-x"]');
    var free = scope.querySelector('[data-xcu="join-free"]');
    if (buy) buy.onclick = function () { goCheckout(opts.source || "compare"); };
    if (free) free.onclick = function () {
      track("compare_join_free", {});
      if (typeof opts.onJoinFree === "function") opts.onJoinFree();
    };
    track("compare_shown", { source: opts.source || "compare" });
  }

  // inline render into an existing element (e.g. the account chooser)
  function renderCompare(target, opts) {
    var node = typeof target === "string" ? d.querySelector(target) : target;
    if (!node) return;
    if (!node.classList.contains("xcu-root")) node.classList.add("xcu-root");
    node.setAttribute("data-lang", CFG.lang === "zh" ? "zh" : "en");
    node.innerHTML = compareHTML(opts);
    wireCompare(node, opts);
  }

  // modal version
  function openCompare(opts) {
    opts = opts || {};
    var o = overlay(true);
    var b = el("div", "xcu-body");
    b.innerHTML =
      '<div class="xcu-eyebrow">' + (opts.eyebrow || "🏆 " + tr("cmp_best").replace("★ ", "")) + '</div>' +
      '<h3 class="xcu-h">' + tr("cmp_title") + '</h3>' +
      '<p class="xcu-p">' + tr("cmp_sub") + '</p>' + compareHTML(opts);
    o.modal.appendChild(b);
    var mergedOpts = Object.assign({}, opts, { onJoinFree: function () {
      o.shut();
      if (typeof opts.onJoinFree === "function") opts.onJoinFree();
    } });
    wireCompare(b, mergedOpts);
    syncLang();
    return o;
  }

  /* ---------------------- floating re-open badge -------------------- */
  var fab = null;
  function showFab() {
    var ac = getActiveCode();
    if (!ac) return;
    ensureRoot();
    if (fab) fab.remove();
    fab = el("button", "xcu-fab",
      '<span class="xcu-fab-x">🎁</span> ' + tr("fab", { PCT: ac.pct + "%" }));
    fab.onclick = function () { track("fab_click", { code: ac.code }); showToast({ source: "fab" }); };
    root.appendChild(fab);
  }

  /* ------------------------- language sync -------------------------- */
  function syncLang() {
    if (root) root.setAttribute("data-lang", CFG.lang === "zh" ? "zh" : "en");
  }
  function setLang(l) { CFG.lang = (l === "zh" ? "zh" : "en"); syncLang(); }
  function detectLang() {
    var htmlLang = (d.documentElement.getAttribute("lang") || "").toLowerCase();
    if (htmlLang.indexOf("zh") === 0) return "zh";
    var nav = (w.navigator.language || "").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : "en";
  }

  /* ------------------------------ init ------------------------------ */
  function init(user) {
    CFG = Object.assign({}, DEFAULTS, user || {});
    CFG.api = Object.assign({}, DEFAULTS.api, (user && user.api) || {});
    if (!CFG.lang) CFG.lang = detectLang();
    ensureRoot();
    if (getActiveCode()) showFab();
    // first-visit lucky draw
    var s = load();
    if (CFG.spinOnFirstVisit && !s.spun_once && !getActiveCode()) {
      s.spun_once = true; save(s);
      setTimeout(function () { openSpin(); }, CFG.spinDelayMs || 1200);
    }
    startRecurring();
    track("init", { lang: CFG.lang, hasCode: !!getActiveCode() });
    return w.XYZCupUpsell;
  }

  w.XYZCupUpsell = {
    __ready: true,
    init: init,
    openSpin: openSpin,
    openCompare: openCompare,
    renderCompare: renderCompare,
    onJoinCompetition: onJoinCompetition,
    onLeaderboardView: onLeaderboardView,
    showRecurring: showToast,
    getActiveCode: getActiveCode,
    checkoutUrl: checkoutUrl,
    setLang: setLang,
    track: track,
    _cfg: function () { return CFG; }
  };
})(window, document);
