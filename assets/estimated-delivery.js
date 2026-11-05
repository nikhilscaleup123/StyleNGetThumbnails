/**
 * Estimated delivery: today + 5 to + 7 working days (Sat/Sun excluded).
 * Uses the visitor's local calendar date (any timezone).
 * UI: Customize or Add to cart sits beside quantity; delivery stays full-width
 * under that row / buy buttons. Presentation only — no feature changes.
 */
(function () {
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var CUSTOMIZE_SELECTOR = '#scaleup-product-button, [id="scaleup-product-button"]';
  var ATC_SELECTOR =
    '.product__info-container .product-form__submit, product-info .product-form__submit';
  var QTY_SELECTOR = '.product__info-container .product-form__quantity, product-info .product-form__quantity';
  var ROW_CLASS = 'pui-qty-customize-row';
  var OBSERVE_MS = 12000;

  function addWorkingDays(fromDate, days) {
    var d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    var added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      var day = d.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return d;
  }

  function formatDay(date) {
    var dd = String(date.getDate()).padStart(2, '0');
    return dd + ' ' + MONTHS[date.getMonth()];
  }

  function formatRange(start, end) {
    return formatDay(start) + ' \u2013 ' + formatDay(end);
  }

  function updateDates(root) {
    var target = root.querySelector('[data-estimated-delivery-range]');
    if (!target) return;

    var today = new Date();
    var start = addWorkingDays(today, 5);
    var end = addWorkingDays(today, 7);
    target.textContent = formatRange(start, end);
  }

  function getDeliveryEl() {
    var nodes = document.querySelectorAll('[data-estimated-delivery]');
    if (!nodes.length) return null;
    for (var i = 1; i < nodes.length; i++) {
      nodes[i].parentNode && nodes[i].parentNode.removeChild(nodes[i]);
    }
    return nodes[0];
  }

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

  function placeActionBesideQuantity() {
    var qty = document.querySelector(QTY_SELECTOR);
    if (!qty || !qty.parentNode) return null;

    var customize = document.querySelector(CUSTOMIZE_SELECTOR);
    var atc = document.querySelector(ATC_SELECTOR);

    // Customize products: keep existing Notable row (qty + Customize). Prefer Customize over ATC.
    if (customize) {
      if (atc) {
        var formButtons = atc.closest('.product-form__buttons');
        if (formButtons && atc.parentNode && atc.parentNode.classList.contains(ROW_CLASS)) {
          formButtons.insertBefore(atc, formButtons.firstChild);
        }
      }

      var row = qty.closest('.' + ROW_CLASS);
      if (!row) {
        row = document.createElement('div');
        row.className = ROW_CLASS;
        qty.parentNode.insertBefore(row, qty);
        row.appendChild(qty);
      }

      if (customize.parentNode !== row) {
        row.appendChild(customize);
      }
      return row;
    }

    // ATC products: put qty + Add to cart in a row inside the form (submit must stay in form).
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

  function placeDelivery(el) {
    if (!el) return false;

    var customize = document.querySelector(CUSTOMIZE_SELECTOR);
    var btn = customize || document.querySelector(ATC_SELECTOR);
    var row = placeActionBesideQuantity() || document.querySelector('.' + ROW_CLASS);
    var scope =
      (btn && (btn.closest('product-info') || btn.closest('.product__info-container') || btn.closest('.product__info-wrapper'))) ||
      (row && (row.closest('product-info') || row.closest('.product__info-container') || row.closest('.product__info-wrapper'))) ||
      document.querySelector('product-info') ||
      document.querySelector('.product__info-container') ||
      document.body;

    var trust = findTrustBadges(scope);
    if (trust) {
      trust.classList.add('product-trust-badges');
      var highlights = tagHighlights(trust);
      if (highlights) renameHighlightsHeading(highlights);
    }

    document.querySelectorAll('.product-highlights, .product__info-description, .product__media-description').forEach(function (node) {
      renameHighlightsHeading(node);
    });

    // Customize: full-width delivery directly under qty + Customize row.
    if (customize && row && row.parentNode) {
      if (row.nextElementSibling === el) return true;
      row.insertAdjacentElement('afterend', el);
      return true;
    }

    // ATC: keep delivery under Buy it now / form buttons.
    if (trust && trust.parentNode) {
      if (el.nextElementSibling === trust || trust.previousElementSibling === el) {
        return true;
      }
      trust.parentNode.insertBefore(el, trust);
      return true;
    }

    var formButtons = document.querySelector(
      '.product__info-container .product-form__buttons, product-info .product-form__buttons'
    );
    if (formButtons && formButtons.parentNode) {
      if (formButtons.nextElementSibling === el) return true;
      formButtons.insertAdjacentElement('afterend', el);
      return true;
    }

    if (row && row.parentNode) {
      if (row.nextElementSibling === el) return true;
      row.insertAdjacentElement('afterend', el);
      return true;
    }

    return false;
  }

  function run() {
    placeActionBesideQuantity();
    var el = getDeliveryEl();
    if (!el) return;
    updateDates(el);
    placeDelivery(el);
  }

  function start() {
    run();

    if (!window.MutationObserver || !document.body) return;

    var scheduled = false;
    var observer = new MutationObserver(function () {
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
    }, OBSERVE_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  document.addEventListener('shopify:section:load', run);
})();
