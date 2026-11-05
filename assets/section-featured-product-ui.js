/**
 * Homepage featured-product UI helpers — tag ScaleUp-injected trust badges
 * and product highlights for scoped CSS; place qty + Customize/ATC in one row.
 * Presentation only; no feature changes.
 */
(function () {
  var ROOT_SELECTOR = '.homepage-featured-product-ui product-info, .homepage-featured-product-ui .product__info-container';
  var CUSTOMIZE_SELECTOR = '#scaleup-product-button, [id="scaleup-product-button"]';
  var ATC_SELECTOR = '.product-form__submit';
  var QTY_SELECTOR = '.product-form__quantity';
  var ROW_CLASS = 'pui-qty-customize-row';

  function findTrustBadges(scope) {
    if (!scope) return null;
    var nodes = scope.querySelectorAll('div, ul, section, aside, nav');
    var best = null;
    var bestLen = Infinity;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.hasAttribute('data-estimated-delivery')) continue;
      if (node.querySelector && node.querySelector('[data-estimated-delivery]')) continue;

      var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 20 || text.length > 180) continue;
      if (!/100%\s*secure payment/i.test(text)) continue;
      if (!/Free Shipping/i.test(text)) continue;
      if (!/Premium Quality/i.test(text)) continue;

      if (text.length < bestLen) {
        best = node;
        bestLen = text.length;
      }
    }

    return best;
  }

  function tagHighlights(trust) {
    if (!trust || !trust.parentNode) return null;
    var next = trust.nextElementSibling;
    while (next) {
      if (next.hasAttribute && next.hasAttribute('data-estimated-delivery')) {
        next = next.nextElementSibling;
        continue;
      }
      if (next.classList && next.classList.contains('share-button')) break;

      var hasList = next.matches && (next.matches('ul, ol') || next.querySelector('ul, ol'));
      var isDesc =
        next.classList &&
        (next.classList.contains('product__info-description') ||
          next.classList.contains('product__accordion') ||
          next.classList.contains('product-highlights'));

      if (hasList || isDesc) {
        next.classList.add('product-highlights');
        return next;
      }
      next = next.nextElementSibling;
    }
    return null;
  }

  function renameHighlightsHeading(root) {
    if (!root || root.getAttribute('data-highlights-titled') === '1') return;

    var content =
      root.querySelector('.accordion__content') ||
      (root.classList && root.classList.contains('accordion__content') ? root : root);

    if (!content) return;

    var child = content.firstElementChild;
    while (child) {
      if (child.matches && child.matches('ul, ol')) break;

      if (child.matches && child.matches('h1, h2, h3, h4, h5, p, strong, b, div')) {
        if (child.querySelector && child.querySelector('ul, ol, li')) {
          child = child.nextElementSibling;
          continue;
        }

        var text = (child.textContent || '').replace(/\s+/g, ' ').trim();
        if (
          text &&
          text.length < 140 &&
          !/^product highlights$/i.test(text) &&
          !/^key features$/i.test(text) &&
          !/^material:/i.test(text) &&
          !/^fit:/i.test(text) &&
          !/^delivery in /i.test(text)
        ) {
          if (child.matches('p') && child.querySelector('strong, b')) {
            var label = child.querySelector('strong, b');
            label.textContent = 'Product Highlights';
          } else {
            child.textContent = 'Product Highlights';
          }
          child.classList.add('product-highlights__heading');
          root.setAttribute('data-highlights-titled', '1');
          content.setAttribute('data-highlights-titled', '1');
          break;
        }
      }
      child = child.nextElementSibling;
    }
  }

  function ensureRowBefore(referenceNode) {
    var parent = referenceNode && referenceNode.parentNode;
    if (!parent) return null;

    var existing = referenceNode.closest && referenceNode.closest('.' + ROW_CLASS);
    if (existing) return existing;

    var prev = referenceNode.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains(ROW_CLASS)) return prev;

    var row = document.createElement('div');
    row.className = ROW_CLASS;
    parent.insertBefore(row, referenceNode);
    return row;
  }

  function placeActionBesideQuantity(scope) {
    if (!scope) return null;

    var qty = scope.querySelector(QTY_SELECTOR);
    if (!qty || !qty.parentNode) return null;

    var customize = scope.querySelector(CUSTOMIZE_SELECTOR);
    var atc = scope.querySelector(ATC_SELECTOR);

    // Prefer Customize over ATC when both exist.
    if (customize) {
      if (atc) {
        var formButtonsRestore = atc.closest('.product-form__buttons');
        if (formButtonsRestore && atc.parentNode && atc.parentNode.classList.contains(ROW_CLASS)) {
          formButtonsRestore.insertBefore(atc, formButtonsRestore.firstChild);
        }
      }

      var customizeRow = qty.closest('.' + ROW_CLASS);
      if (!customizeRow) {
        customizeRow = document.createElement('div');
        customizeRow.className = ROW_CLASS;
        qty.parentNode.insertBefore(customizeRow, qty);
        customizeRow.appendChild(qty);
      }

      if (customize.parentNode !== customizeRow) {
        customizeRow.appendChild(customize);
      }
      return customizeRow;
    }

    if (!atc) return qty.closest('.' + ROW_CLASS);

    var formButtons = atc.closest('.product-form__buttons');
    if (!formButtons) return null;

    var row = atc.closest('.' + ROW_CLASS) || qty.closest('.' + ROW_CLASS);
    if (!row || row.parentNode !== formButtons) {
      row = ensureRowBefore(atc);
      if (!row) return null;
      if (row.parentNode !== formButtons) {
        formButtons.insertBefore(row, atc);
      }
    }

    if (qty.parentNode !== row) {
      row.insertBefore(qty, row.firstChild);
    }
    if (atc.parentNode !== row) {
      row.appendChild(atc);
    }

    return row;
  }

  function syncCustomizeLink(scope) {
    var link = scope.querySelector('a.product-form__submit[href*="scaleup-designer"]');
    if (!link) return;
    var variantInput = scope.querySelector('.product-variant-id');
    if (!variantInput) return;

    function update() {
      link.href = link.href.replace(/variant=\d+/, 'variant=' + variantInput.value);
    }

    if (!link.getAttribute('data-customize-sync')) {
      link.setAttribute('data-customize-sync', '1');
      new MutationObserver(update).observe(variantInput, { attributes: true, attributeFilter: ['value'] });
      variantInput.addEventListener('change', update);
    }
  }

  function run() {
    var scopes = document.querySelectorAll(ROOT_SELECTOR);
    if (!scopes.length) return;

    scopes.forEach(function (scope) {
      placeActionBesideQuantity(scope);
      syncCustomizeLink(scope);

      var trust = findTrustBadges(scope);
      if (trust) {
        trust.classList.add('product-trust-badges');
        var highlights = tagHighlights(trust);
        if (highlights) renameHighlightsHeading(highlights);
      }

      scope.querySelectorAll('.product-highlights, .product__info-description').forEach(function (node) {
        renameHighlightsHeading(node);
      });
    });
  }

  function start() {
    run();

    if (!window.MutationObserver || !document.body) return;

    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (!document.querySelector('.homepage-featured-product-ui')) return;
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        run();
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.setTimeout(function () {
      observer.disconnect();
      run();
    }, 12000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  document.addEventListener('shopify:section:load', run);
})();
