/* Menú del header único: hamburguesa, dropdown de Huerto Rentable y página activa. */
(function (factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    var start = function () { api.mount(document); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})(function () {
  var NARROW = "(max-width: 900px)";
  var COARSE = "(hover: none), (pointer: coarse)";

  function isTapMode(match) {
    return !!(match(NARROW) || match(COARSE));
  }

  /**
   * Primer toque en touch/móvil abre. El segundo toque (o el clic de escritorio) navega.
   * @returns {{preventDefault: boolean, open: boolean, navigate: boolean}}
   */
  function onParentClick(tapMode, isOpen) {
    if (!tapMode) return { preventDefault: false, open: isOpen, navigate: true };
    if (!isOpen) return { preventDefault: true, open: true, navigate: false };
    return { preventDefault: false, open: true, navigate: true };
  }

  function mount(doc) {
    var header = doc.getElementById("site-header");
    if (!header || header.getAttribute("data-sh-ready") === "1") return;
    header.setAttribute("data-sh-ready", "1");

    var toggle = header.querySelector(".sh-toggle");
    var menu = doc.getElementById("site-nav-menu");
    var dd = doc.getElementById("hr-nav-dd");
    var link = doc.getElementById("hr-nav-link");

    function tapMode() {
      var view = doc.defaultView || window;
      return isTapMode(function (q) { return view.matchMedia(q).matches; });
    }

    function setExpanded(open) {
      if (link) link.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function closeDrawer() {
      if (!menu || !toggle) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
    }

    function openDrawer() {
      if (!menu || !toggle) return;
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Cerrar menú");
    }

    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        if (menu.classList.contains("is-open")) closeDrawer();
        else openDrawer();
      });
      menu.querySelectorAll("a").forEach(function (a) {
        if (a === link) return;
        a.addEventListener("click", closeDrawer);
      });
    }

    if (dd && link) {
      function syncHoverExpanded() {
        if (dd.classList.contains("is-dismissed")) {
          setExpanded(false);
          return;
        }
        var open = dd.classList.contains("is-open") || dd.matches(":hover") || dd.matches(":focus-within");
        setExpanded(open);
      }

      link.addEventListener("click", function (e) {
        var next = onParentClick(tapMode(), dd.classList.contains("is-open"));
        if (next.preventDefault) e.preventDefault();
        dd.classList.toggle("is-open", next.open);
        if (next.open) dd.classList.remove("is-dismissed");
        setExpanded(next.open);
        if (next.navigate) closeDrawer();
      });

      dd.addEventListener("mouseenter", function () {
        dd.classList.remove("is-dismissed");
        syncHoverExpanded();
      });
      dd.addEventListener("mouseleave", function () {
        dd.classList.remove("is-dismissed");
        if (!tapMode()) dd.classList.remove("is-open");
        syncHoverExpanded();
      });
      dd.addEventListener("focusin", syncHoverExpanded);
      dd.addEventListener("focusout", function () {
        setTimeout(function () {
          if (!dd.contains(doc.activeElement)) dd.classList.remove("is-dismissed");
          syncHoverExpanded();
        }, 0);
      });

      doc.addEventListener("pointerdown", function (e) {
        if (!dd.contains(e.target)) {
          dd.classList.remove("is-open");
          dd.classList.add("is-dismissed");
          setExpanded(false);
        }
      });

      doc.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var drawerOpen = menu && menu.classList.contains("is-open");
        var ddOpen = dd.classList.contains("is-open") || dd.matches(":hover") || dd.matches(":focus-within");
        if (!drawerOpen && !ddOpen) return;
        dd.classList.remove("is-open");
        dd.classList.add("is-dismissed");
        setExpanded(false);
        closeDrawer();
        if (dd.contains(doc.activeElement)) link.focus();
      });
    }

    var path = (doc.location && doc.location.pathname) || "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    if (path.endsWith("/index.html")) path = path.slice(0, -"/index.html".length) || "/";
    var hrFamily = {
      "/huerto-rentable.html": true,
      "/huerto-rentable-35.html": true,
      "/huerto-rentable-55.html": true,
      "/spice-partner.html": true,
      "/huerto-rentable-35-info.html": true
    };
    header.querySelectorAll(".sh-links a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) !== "/") return;
      var hit = href === path || (a === link && hrFamily[path]);
      if (!hit) return;
      a.classList.add("sh-current");
      if (a !== link || href === path) a.setAttribute("aria-current", "page");
    });
  }

  return {
    NARROW: NARROW,
    COARSE: COARSE,
    isTapMode: isTapMode,
    onParentClick: onParentClick,
    mount: mount
  };
});
