(function () {
  var overlay = document.getElementById("pwOverlay");
  if (!overlay) return;
  var opened = false, autoTimer = null;

  function open() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    opened = true;
  }
  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // 1) Auto-fire ~1.3s after load
  autoTimer = setTimeout(open, 1300);

  // 2) Close controls
  document.getElementById("pwClose").addEventListener("click", close);
  document.getElementById("pwLater").addEventListener("click", close);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  // CTA — demo only (no real payment)
  document.getElementById("pwCta").addEventListener("click", function () {
    var cta = document.getElementById("pwCta");
    cta.textContent = "Starting your Trader Career…";
    cta.style.filter = "brightness(1.1)";
    setTimeout(close, 900);
  });

  // 3) Open paywall when clicking any Trader Career stage / locked / buy item.
  // Also neutralize internal navigation so the static demo never leaves the page.
  var TRIGGERS = ".uc-btn, .ln-tile, .ln-road-node, .ln-card, .ln-preview-player, .ln-lock, .ln-intro-cta, .pw-video-play";

  document.addEventListener(
    "click",
    function (e) {
      // ignore clicks inside the modal itself
      if (e.target.closest("#pwOverlay")) return;

      var trigger = e.target.closest(TRIGGERS);
      if (trigger) {
        e.preventDefault();
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        open();
        return;
      }

      // block internal <a href="/..."> navigation (static replica)
      var a = e.target.closest("a[href]");
      if (a) {
        var href = a.getAttribute("href") || "";
        if (href.charAt(0) === "/" || href.charAt(0) === "#") {
          e.preventDefault();
        }
      }
    },
    true
  );
})();
