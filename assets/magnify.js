(function () {
  const ZOOM_SCALE = 2.2;
  const DESKTOP_MIN_WIDTH = 1024;
  const TRANSITION_MS = 200;

  function isDesktop() {
    return window.innerWidth >= DESKTOP_MIN_WIDTH;
  }

  function initZoom(image) {
    if (image._hoverZoomInit) return;
    image._hoverZoomInit = true;

    const container = image.closest('.product__media') || image.parentElement;
    container.style.overflow = 'hidden';

    image.style.transition = `transform ${TRANSITION_MS}ms ease`;
    image.style.willChange = 'transform';
    image.style.transformOrigin = '0 0';

    let rafId = null;
    let active = false;
    let cx = 0;
    let cy = 0;

    function update() {
      if (!active) return;
      const rect = container.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
      const yPct = Math.max(0, Math.min(1, (cy - rect.top) / rect.height));
      const tx = -xPct * (ZOOM_SCALE - 1) * rect.width;
      const ty = -yPct * (ZOOM_SCALE - 1) * rect.height;
      image.style.transform = `translate(${tx}px, ${ty}px) scale(${ZOOM_SCALE})`;
      rafId = null;
    }

    function onEnter() {
      if (!isDesktop()) return;
      active = true;
    }

    function onMove(e) {
      if (!active) return;
      cx = e.clientX;
      cy = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(update);
    }

    function onLeave() {
      active = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      image.style.transform = '';
    }

    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
  }

  function init() {
    document.querySelectorAll('.image-magnify-hover').forEach(initZoom);
  }

  init();
  new MutationObserver(init).observe(document.body, { childList: true, subtree: true });
})();
