/**
 * Testimonials UI — fade-up stagger + mobile carousel dots.
 */
(function () {
  var ROOT = '.testimonials-ui';
  var CARD = '.testimonials-ui__reveal';
  var HEADING = '.testimonials-ui__heading-reveal';
  var MOBILE_MQ = '(max-width: 767px)';

  function init(scope) {
    var root =
      scope && scope.matches && scope.matches(ROOT)
        ? scope
        : (scope || document).querySelector(ROOT);

    if (!root) return;

    initReveal(root);
    initCarousel(root);
  }

  function initReveal(root) {
    var targets = root.querySelectorAll(CARD);
    var heading = root.querySelector(HEADING);
    var all = heading ? [heading].concat(Array.from(targets)) : Array.from(targets);

    if (all.length === 0) return;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      (window.Shopify && Shopify.designMode)
    ) {
      all.forEach(function (el) {
        el.classList.add('testimonials-ui__reveal--visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('testimonials-ui__reveal--visible');
          obs.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12,
      }
    );

    targets.forEach(function (el, index) {
      el.style.setProperty('--testimonial-index', String(index));
      observer.observe(el);
    });

    if (heading) observer.observe(heading);
  }

  function initCarousel(root) {
    var list = root.querySelector('.multicolumn-list');
    var existing = root.querySelector('.testimonials-ui__dots');
    if (existing) existing.remove();
    if (!list) return;

    if (root._testimonialsCarouselCleanup) {
      root._testimonialsCarouselCleanup();
      root._testimonialsCarouselCleanup = null;
    }

    if (!window.matchMedia(MOBILE_MQ).matches) return;

    var slides = list.querySelectorAll('.multicolumn-list__item');
    if (slides.length < 2) return;

    var dots = document.createElement('div');
    dots.className = 'testimonials-ui__dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Customer reviews');

    slides.forEach(function (_, index) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'testimonials-ui__dot' + (index === 0 ? ' is-active' : '');
      btn.setAttribute('aria-label', 'Show review ' + (index + 1));
      btn.addEventListener('click', function () {
        var left =
          slides[index].getBoundingClientRect().left -
          list.getBoundingClientRect().left +
          list.scrollLeft;
        list.scrollTo({ left: left, behavior: 'smooth' });
      });
      dots.appendChild(btn);
    });

    list.parentNode.appendChild(dots);

    var dotButtons = dots.querySelectorAll('.testimonials-ui__dot');

    function updateDots() {
      var width = list.clientWidth || 1;
      var index = Math.round(list.scrollLeft / width);
      index = Math.max(0, Math.min(slides.length - 1, index));
      dotButtons.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    list.addEventListener('scroll', updateDots, { passive: true });
    updateDots();

    root._testimonialsCarouselCleanup = function () {
      list.removeEventListener('scroll', updateDots);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });

  var mobileMq = window.matchMedia(MOBILE_MQ);
  function onBreakpointChange() {
    var root = document.querySelector(ROOT);
    if (root) initCarousel(root);
  }
  if (mobileMq.addEventListener) {
    mobileMq.addEventListener('change', onBreakpointChange);
  } else if (mobileMq.addListener) {
    mobileMq.addListener(onBreakpointChange);
  }
})();
