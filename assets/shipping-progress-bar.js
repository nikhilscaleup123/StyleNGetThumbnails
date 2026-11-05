/**
 * Celebrate once when cart rewards progress reaches the final milestone.
 */
(function () {
  const STORAGE_KEY = 'cartRewardStage';
  let scheduled = null;

  function celebrate(bar) {
    if (!bar || bar.dataset.celebrated === 'true') return;
    bar.dataset.celebrated = 'true';
    bar.classList.add('is-celebrating');

    window.setTimeout(() => {
      bar.classList.remove('is-celebrating');
    }, 2200);
  }

  function checkBars() {
    document.querySelectorAll('[data-shipping-progress]').forEach((bar) => {
      const stage = Number(bar.getAttribute('data-stage') || 0);
      const previous = sessionStorage.getItem(STORAGE_KEY);

      sessionStorage.setItem(STORAGE_KEY, String(stage));

      if (stage === 3 && previous !== null && Number(previous) < 3) {
        celebrate(bar);
      }
    });
  }

  function scheduleCheck() {
    window.clearTimeout(scheduled);
    scheduled = window.setTimeout(checkBars, 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleCheck);
  } else {
    scheduleCheck();
  }

  const observer = new MutationObserver(scheduleCheck);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
