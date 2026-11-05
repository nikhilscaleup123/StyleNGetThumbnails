(function () {
  function initHomepageFooterAccordion() {
    var footer = document.querySelector('.homepage-footer-ui');
    if (!footer) return;

    var accordions = footer.querySelectorAll('.footer-accordion');
    var mobileQuery = window.matchMedia('(max-width: 749px)');

    function syncAccordions() {
      accordions.forEach(function (accordion) {
        if (mobileQuery.matches) {
          accordion.removeAttribute('open');
        } else {
          accordion.setAttribute('open', '');
        }
      });
    }

    syncAccordions();

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', syncAccordions);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(syncAccordions);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomepageFooterAccordion);
  } else {
    initHomepageFooterAccordion();
  }
})();
