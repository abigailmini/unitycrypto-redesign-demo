#!/usr/bin/env python3
"""Build /learning-demo : faithful static replica of the live app.unitycrypto.com /learning
page + a paywall closing-strength popup. Static-only (scripts stripped so no auth redirect)."""
import re, pathlib

SRC = pathlib.Path("original/learning.html")
OUT = pathlib.Path("learning-demo/index.html")
OUT.parent.mkdir(parents=True, exist_ok=True)

html = SRC.read_text(encoding="utf-8")

# 1) Strip ALL <script>...</script> blocks (prevents Next.js hydration + sign-in redirect).
html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.DOTALL|re.IGNORECASE)
# also self-closing / async empty script tags
html = re.sub(r"<script\b[^>]*/>", "", html, flags=re.IGNORECASE)

# 2) Repoint root-absolute assets to the live app. The Sept snapshot referenced a stale
#    global CSS chunk (now 404 after a redeploy); swap it for the current one. Strip the
#    per-deploy ?dpl= cache-bust so immutable chunk/font paths resolve regardless of deploy.
html = html.replace('0zcocs0w029iu.css', '0ijq6fzj~vh0y.css')   # stale global chunk -> current
html = re.sub(r'\?dpl=dpl_[A-Za-z0-9]+', '', html)              # drop per-deploy query
html = html.replace('"/_next/', '"https://app.unitycrypto.com/_next/')
html = re.sub(r'href="/(icon\.png|apple-icon\.png|manifest\.webmanifest)',
              r'href="https://app.unitycrypto.com/\1', html)

# 3) Replace the inert free-preview mux-player with a styled poster box (keeps layout intact).
html = re.sub(
    r'<mux-player\b[^>]*></mux-player>',
    '<div style="width:100%;aspect-ratio:16/9;border-radius:10px;overflow:hidden;'
    'background:linear-gradient(135deg,#11141c,#0b0e14);border:1px solid var(--card-border,#23262f);'
    'display:flex;align-items:center;justify-content:center;gap:12px;color:var(--text-3,#5f646d)">'
    '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#f0b90b" stroke-width="1.5">'
    '<circle cx="12" cy="12" r="10"></circle><path d="M10 8l6 4-6 4V8z" fill="#f0b90b" stroke="none"></path></svg>'
    '<span style="font-size:13px;letter-spacing:.04em">Free preview</span></div>',
    html, flags=re.IGNORECASE)

# 4) Paywall modal (CSS + markup + behaviour), injected before </body>.
MODAL = r"""
<style id="tc-paywall-style">
  #tcPaywall{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;
    padding:20px;background:rgba(5,7,11,.78);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  #tcPaywall.is-open{display:flex;animation:tcFade .22s ease}
  @keyframes tcFade{from{opacity:0}to{opacity:1}}
  #tcPaywall .tc-card{position:relative;width:100%;max-width:468px;max-height:92vh;overflow-y:auto;
    background:var(--card,#11141c);background-color:#11141c;border:1px solid rgba(240,185,11,.28);
    border-radius:18px;padding:22px 22px 24px;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.03);
    animation:tcPop .26s cubic-bezier(.2,.9,.3,1.2)}
  @keyframes tcPop{from{transform:translateY(14px) scale(.97);opacity:0}to{transform:none;opacity:1}}
  #tcPaywall .tc-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;
    border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#cfd3db;cursor:pointer;
    display:grid;place-items:center;transition:.15s;font-size:0}
  #tcPaywall .tc-x:hover{background:rgba(255,255,255,.1);color:#fff;transform:rotate(90deg)}
  #tcPaywall .tc-video{width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;
    background:radial-gradient(120% 120% at 30% 20%,#1a1f2b,#0b0e14);border:1px solid rgba(240,185,11,.22);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin-bottom:18px}
  #tcPaywall .tc-play{width:58px;height:58px;border-radius:50%;background:rgba(240,185,11,.12);
    border:1px solid rgba(240,185,11,.5);display:grid;place-items:center}
  #tcPaywall .tc-video-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;
    letter-spacing:.22em;color:#f0b90b;text-transform:uppercase}
  #tcPaywall .tc-eyebrow{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;
    letter-spacing:.22em;color:#f0b90b;text-transform:uppercase;text-align:center}
  #tcPaywall h2{font-size:23px;font-weight:900;letter-spacing:-.02em;line-height:1.18;color:#fff;
    margin:10px 0 0;text-align:center}
  #tcPaywall .tc-sub{font-size:14px;line-height:1.6;color:var(--text-2,#aab0bd);margin:12px 0 0;text-align:center}
  #tcPaywall .tc-sub b{color:#fff}
  #tcPaywall .tc-stages{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0 0}
  #tcPaywall .tc-stage{font-size:11px;font-weight:700;color:#e7e9ee;background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:5px 11px}
  #tcPaywall .tc-kicker{margin:18px 0 0;padding:14px 16px;border-radius:12px;
    background:linear-gradient(135deg,rgba(240,185,11,.14),rgba(249,115,22,.08));
    border:1px solid rgba(240,185,11,.35);text-align:center}
  #tcPaywall .tc-kicker .tc-free{display:inline-block;font-weight:900;color:#f0b90b;font-size:15px;letter-spacing:.01em}
  #tcPaywall .tc-kicker p{margin:6px 0 0;font-size:13.5px;line-height:1.55;color:#e7e9ee}
  #tcPaywall .tc-kicker p b{color:#f0b90b}
  #tcPaywall .tc-cta{display:block;width:100%;margin:20px 0 0;padding:16px 18px;border:0;border-radius:13px;
    background:linear-gradient(135deg,#f0b90b,#f97316);color:#0a0d12;font-size:16px;font-weight:900;
    letter-spacing:-.01em;text-align:center;text-decoration:none;cursor:pointer;
    box-shadow:0 10px 30px rgba(240,185,11,.3);transition:.15s}
  #tcPaywall .tc-cta:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(240,185,11,.42)}
  #tcPaywall .tc-cta small{display:block;font-size:11px;font-weight:700;opacity:.8;margin-top:2px}
  #tcPaywall .tc-fine{margin:12px 0 0;font-size:11px;line-height:1.5;color:var(--text-3,#6b707b);text-align:center}
  #tcPaywall .tc-dismiss{display:block;margin:10px auto 0;background:none;border:0;color:var(--text-3,#6b707b);
    font-size:12.5px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
  #tcPaywall .tc-dismiss:hover{color:#aab0bd}
</style>
<div id="tcPaywall" role="dialog" aria-modal="true" aria-labelledby="tcTitle">
  <div class="tc-card">
    <button class="tc-x" type="button" aria-label="Close" onclick="tcClosePaywall()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>
    </button>
    <div class="tc-video">
      <div class="tc-play"><svg width="24" height="24" viewBox="0 0 24 24" fill="#f0b90b"><path d="M8 5v14l11-7z"></path></svg></div>
      <div class="tc-video-label">Closing Video</div>
    </div>
    <div class="tc-eyebrow">Unlock · Trader Career</div>
    <h2 id="tcTitle">Invest $150 to unlock your<br>full Trader Career</h2>
    <p class="tc-sub">One payment opens <b>everything</b> — the complete e-learning library plus all <b>4 stages</b> of the trader career path.</p>
    <div class="tc-stages">
      <span class="tc-stage">1 · Discover</span>
      <span class="tc-stage">2 · Build</span>
      <span class="tc-stage">3 · Achieve</span>
      <span class="tc-stage">4 · Legacy</span>
    </div>
    <div class="tc-kicker">
      <span class="tc-free">It's actually FREE.</span>
      <p>Your $150 comes straight back as a <b>$150 FundedXYZ voucher</b> — use it to buy any challenge and start trading right away.</p>
    </div>
    <a href="#" class="tc-cta" onclick="return false;">Pay $150 — Start Trader Career<small>$150 voucher returned instantly</small></a>
    <p class="tc-fine">Secure checkout · Voucher auto-applied to your FundedXYZ account</p>
    <button class="tc-dismiss" type="button" onclick="tcClosePaywall()">Maybe later</button>
  </div>
</div>
<!-- tc-paywall-behaviour -->
<script id="tcPaywallJs">
(function(){
  var modal=document.getElementById('tcPaywall');
  var opened=false;
  window.tcOpenPaywall=function(){modal.classList.add('is-open');document.body.style.overflow='hidden';opened=true;};
  window.tcClosePaywall=function(){modal.classList.remove('is-open');document.body.style.overflow='';};
  // Backdrop click closes (but not clicks inside the card)
  modal.addEventListener('click',function(e){if(e.target===modal)tcClosePaywall();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')tcClosePaywall();});
  // Any "unlock / buy X Mode / Trader Career" trigger on the page opens the paywall.
  function wire(){
    var triggers=document.querySelectorAll('a.btn-gold, .career-strip-col, .stage-card, .btn-gold');
    triggers.forEach(function(el){
      el.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();tcOpenPaywall();},true);
    });
  }
  if(document.readyState!=='loading')wire();else document.addEventListener('DOMContentLoaded',wire);
  // Auto-fire once on load so the closing pitch is seen (closing-strength test).
  setTimeout(function(){if(!opened)tcOpenPaywall();},1300);
})();
</script>
"""
html = html.replace("</body>", MODAL + "\n</body>")

OUT.write_text(html, encoding="utf-8")
print("wrote", OUT, len(html), "bytes; scripts stripped, modal injected")
