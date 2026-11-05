/**
 * Compact sticky buy box:
 * - ScaleUp Customize OR Add to cart
 * - Desktop: visible only while Description accordion is expanded,
 *   hidden after the description ends
 * - Mobile: Notable-style full-width bottom bar. Shows after the main
 *   button scrolls above the screen, stays while scrolling down, hides
 *   when that button is on screen again
 */
(function () {
  var MEDIA_QUERY = '(min-width: 750px)';
  var CUSTOMIZE_SELECTOR = '#scaleup-product-button, [id="scaleup-product-button"]';
  var DESC_SELECTOR = '#ProductMediaDescription, .product__media-description';

  function init() {
    var bar = document.getElementById('StickyCustomize');
    var stickyBtn = document.getElementById('StickyCustomizeButton');
    var stickyPrice = document.getElementById('StickyCustomizePrice');
    var stickyQty = document.getElementById('StickyQtyInput');
    var stickyQtyMinus = document.getElementById('StickyQtyMinus');
    var stickyQtyPlus = document.getElementById('StickyQtyPlus');
    if (!bar || !stickyBtn) return;

    var sectionId = bar.getAttribute('data-section-id');
    var atcLabel = bar.getAttribute('data-atc-label') || 'Add to cart';
    var customizeLabel = bar.getAttribute('data-customize-label') || 'Customize';
    var mql = window.matchMedia(MEDIA_QUERY);
    var sourceBtn = null;
    var sourceMode = 'cart';
    var observer = null;
    var descObserver = null;
    var syncingQty = false;

    function mainQtyInput() {
      return document.getElementById('Quantity-' + sectionId);
    }

    function mainPriceEl() {
      return document.getElementById('price-' + sectionId);
    }

    function variantRoot() {
      return document.getElementById('variant-selects-' + sectionId);
    }

    function atcButton() {
      return document.getElementById('ProductSubmitButton-' + sectionId);
    }

    function descriptionRoot() {
      return document.querySelector(DESC_SELECTOR);
    }

    function descriptionDetails() {
      var root = descriptionRoot();
      if (!root) return null;
      var details = root.querySelector('details');
      if (details) return details;
      return root.querySelector('.product-accordion-tabs__header');
    }

    function setStickyLabel(text) {
      var labelNode = stickyBtn.querySelector('.sticky-customize__button-label');
      if (labelNode) labelNode.textContent = text;
      else stickyBtn.textContent = text;
    }

    function updateCtaAppearance() {
      if (sourceMode === 'customize') {
        setStickyLabel(customizeLabel);
        stickyBtn.disabled = false;
        stickyBtn.classList.add('sticky-customize__button--customize');
        stickyBtn.classList.remove('sticky-customize__button--cart');
      } else {
        var labelEl = sourceBtn && sourceBtn.querySelector('span');
        var label = labelEl && labelEl.textContent ? labelEl.textContent.trim() : '';
        setStickyLabel(label || atcLabel);
        stickyBtn.disabled = !!(sourceBtn && sourceBtn.disabled);
        stickyBtn.classList.add('sticky-customize__button--cart');
        stickyBtn.classList.remove('sticky-customize__button--customize');
      }
    }

    function findSource() {
      var customize = document.querySelector(CUSTOMIZE_SELECTOR);
      if (customize) {
        sourceBtn = customize;
        sourceMode = 'customize';
        updateCtaAppearance();
        return sourceBtn;
      }

      var atc = atcButton();
      if (atc) {
        sourceBtn = atc;
        sourceMode = 'cart';
        updateCtaAppearance();
        return sourceBtn;
      }

      sourceBtn = null;
      return null;
    }

    function syncPageOffset(open) {
      if (open && !mql.matches) {
        document.documentElement.classList.add('sticky-customize-open');
        window.requestAnimationFrame(function () {
          document.documentElement.style.setProperty('--sticky-customize-offset', bar.offsetHeight + 'px');
        });
      } else {
        document.documentElement.classList.remove('sticky-customize-open');
        document.documentElement.style.removeProperty('--sticky-customize-offset');
      }
    }

    function setVisible(show) {
      if (show) {
        syncFromMain();
        bar.hidden = false;
        window.requestAnimationFrame(function () {
          bar.classList.add('is-visible');
          syncPageOffset(true);
        });
      } else {
        bar.classList.remove('is-visible');
        syncPageOffset(false);
        window.setTimeout(function () {
          if (!bar.classList.contains('is-visible')) bar.hidden = true;
        }, 250);
      }
    }

    function syncPrice() {
      if (!stickyPrice) return;
      var price = mainPriceEl();
      if (price) stickyPrice.innerHTML = price.innerHTML;
    }

    function syncOptionSelected() {
      var root = variantRoot();
      if (!root) return;
      bar.querySelectorAll('.sticky-customize__value').forEach(function (btn) {
        var name = btn.getAttribute('data-option-name');
        var value = btn.getAttribute('data-value');
        var input = root.querySelector(
          'input[type="radio"][name="' + CSS.escape(name) + '"][value="' + CSS.escape(value) + '"]'
        );
        var selected = !!(input && input.checked);
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
        if (selected) {
          var labelSelected = bar.querySelector('[data-selected-swatch-value="' + CSS.escape(name) + '"]');
          if (labelSelected) labelSelected.textContent = value;
        }
      });
    }

    function syncQtyFromMain() {
      if (syncingQty || !stickyQty) return;
      var main = mainQtyInput();
      if (!main) return;
      syncingQty = true;
      stickyQty.value = main.value;
      stickyQty.min = main.min || stickyQty.min;
      if (main.max) stickyQty.max = main.max;
      syncingQty = false;
    }

    function syncFromMain() {
      syncPrice();
      syncOptionSelected();
      syncQtyFromMain();
    }

    function writeQtyToMain(value) {
      var main = mainQtyInput();
      if (!main) return;
      syncingQty = true;
      main.value = value;
      main.dispatchEvent(new Event('change', { bubbles: true }));
      syncingQty = false;
      if (stickyQty) stickyQty.value = main.value;
    }

    function isDescriptionExpanded() {
      var root = descriptionRoot();
      if (!root) return false;
      var details = root.querySelector('details');
      if (details) return !!details.open;
      var header = root.querySelector('.product-accordion-tabs__header');
      if (header) return header.getAttribute('aria-expanded') === 'true';
      return false;
    }

    /** Description block has not fully scrolled above the viewport yet. */
    function isBeforeDescriptionEnd() {
      var root = descriptionRoot();
      if (!root) return false;
      return root.getBoundingClientRect().bottom > 80;
    }

    /** Primary CTA has scrolled above the fold (avoid showing sticky next to main button). */
    function hasScrolledPastSource() {
      if (!findSource()) return false;
      return sourceBtn.getBoundingClientRect().bottom < 8;
    }

    function shouldShowSticky() {
      if (!hasScrolledPastSource()) return false;
      if (mql.matches) {
        return isDescriptionExpanded() && isBeforeDescriptionEnd();
      }
      return true;
    }

    function updateVisibility() {
      setVisible(shouldShowSticky());
    }

    function bindObservers() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (descObserver) {
        descObserver.disconnect();
        descObserver = null;
      }
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);

      findSource();

      observer = new IntersectionObserver(updateVisibility, {
        root: null,
        threshold: [0, 0.01, 1],
      });
      if (sourceBtn) observer.observe(sourceBtn);

      if (mql.matches) {
        var desc = descriptionRoot();
        var details = descriptionDetails();
        if (desc) {
          descObserver = new IntersectionObserver(updateVisibility, {
            root: null,
            threshold: [0, 0.01, 0.1, 1],
          });
          descObserver.observe(desc);
        }

        if (details && !details.dataset.stickyBound) {
          details.dataset.stickyBound = '1';
          if (details.tagName === 'DETAILS') {
            details.addEventListener('toggle', updateVisibility);
          }
        }
      }

      window.__stickyAccordionChanged = updateVisibility;

      window.addEventListener('scroll', updateVisibility, { passive: true });
      window.addEventListener('resize', updateVisibility, { passive: true });
      updateVisibility();
    }

    function optionWrap(el) {
      var node = el && el.parentElement;
      var depth = 0;
      while (node && depth < 8 && node !== document.body && !bar.contains(node)) {
        if (node.querySelector(':scope > .apc-opt-req')) return node;
        node = node.parentElement;
        depth += 1;
      }
      return el ? el.parentElement : null;
    }

    function isMarkedRequired(el) {
      if (!el || el.disabled) return false;
      if (el.required || el.getAttribute('aria-required') === 'true') return true;
      var dataReq = el.getAttribute('data-required');
      if (dataReq === 'true' || dataReq === '1') return true;
      var wrap = optionWrap(el);
      return !!(wrap && wrap.querySelector(':scope > .apc-opt-req'));
    }

    function isSkippableControl(el) {
      if (!el || el.disabled || el.type === 'hidden') return true;
      if (bar.contains(el)) return true;

      var node = el.parentElement;
      while (node && node !== document.body) {
        if (node.hasAttribute('hidden')) return true;
        var style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') return true;
        node = node.parentElement;
      }
      return false;
    }

    function groupHasSelection(el) {
      if (!el.name) return !!el.checked;
      var group = document.querySelectorAll(
        'input[type="' + el.type + '"][name="' + CSS.escape(el.name) + '"]'
      );
      for (var i = 0; i < group.length; i++) {
        if (group[i].checked) return true;
      }
      return false;
    }

    function controlIsEmpty(el) {
      if (el.type === 'checkbox' || el.type === 'radio') return !groupHasSelection(el);
      if (el.type === 'file') return !(el.files && el.files.length);
      return String(el.value || '').trim() === '';
    }

    function collectFields() {
      var list = [];
      var seen = [];

      function add(el) {
        if (!el || seen.indexOf(el) !== -1) return;
        if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT') return;
        seen.push(el);
        list.push(el);
      }

      var productRoot = document.getElementById('MainProduct-' + sectionId);
      var info = document.getElementById('ProductInfo-' + sectionId);
      var root = productRoot || info;
      if (root) {
        var inside = root.querySelectorAll('input, textarea, select');
        for (var i = 0; i < inside.length; i++) add(inside[i]);
      }

      var form = sourceBtn && sourceBtn.closest('form');
      if (form && form.id) {
        var linked = document.querySelectorAll('[form="' + CSS.escape(form.id) + '"]');
        for (var j = 0; j < linked.length; j++) add(linked[j]);
      }

      return list;
    }

    /** First empty required text, dropdown, file, radio, or checkbox. */
    function firstMissingRequiredField() {
      var fields = collectFields();
      var seenGroup = {};
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i];
        if (isSkippableControl(el)) continue;
        if ((el.type === 'radio' || el.type === 'checkbox') && el.name) {
          if (seenGroup[el.type + ':' + el.name]) continue;
          seenGroup[el.type + ':' + el.name] = true;
        }
        if (!isMarkedRequired(el)) continue;
        if (controlIsEmpty(el)) return el;
      }
      return null;
    }

    function scrollTargetFor(field) {
      var wrap = optionWrap(field);
      if (field.type === 'file' && wrap) {
        var drop = wrap.querySelector('.file-drop-area');
        if (drop) return drop;
      }
      if (wrap) {
        var wrapRect = wrap.getBoundingClientRect();
        var wrapStyle = window.getComputedStyle(wrap);
        if (
          wrapStyle.display !== 'none' &&
          wrapStyle.visibility !== 'hidden' &&
          wrapRect.width > 0 &&
          wrapRect.height > 0
        ) {
          return wrap;
        }
      }

      var node = field;
      while (node && node !== document.body) {
        var rect = node.getBoundingClientRect();
        var style = window.getComputedStyle(node);
        if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0) {
          return node;
        }
        node = node.parentElement;
      }
      return field;
    }

    function scrollToField(field) {
      var details = field.parentElement;
      while (details) {
        if (details.tagName === 'DETAILS') details.open = true;
        details = details.parentElement;
      }

      var wrap = optionWrap(field);
      if (wrap) {
        var msg = wrap.querySelector(':scope > .apc-opt-req');
        if (msg) msg.style.display = 'block';
      }

      var fieldRect = field.getBoundingClientRect();
      if (
        field.required &&
        fieldRect.width > 0 &&
        fieldRect.height > 0 &&
        typeof field.reportValidity === 'function'
      ) {
        field.reportValidity();
      }

      var target = scrollTargetFor(field);
      var header = document.querySelector('.header-wrapper');
      var offset = 96;
      if (header) {
        var headerBottom = header.getBoundingClientRect().bottom;
        offset = headerBottom > 0 ? headerBottom + 16 : 16;
      }
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      window.setTimeout(function () {
        if (typeof field.focus === 'function') field.focus({ preventScroll: true });
      }, 350);
    }

    var loadingWatch = null;
    var loadingTimer = null;

    function setStickyLoading(on) {
      var spinner = stickyBtn.querySelector('.loading__spinner');
      stickyBtn.classList.toggle('is-loading', on);
      if (on) stickyBtn.setAttribute('aria-busy', 'true');
      else stickyBtn.removeAttribute('aria-busy');
      if (spinner) spinner.classList.toggle('hidden', !on);
      if (loadingTimer) {
        window.clearTimeout(loadingTimer);
        loadingTimer = null;
      }
      if (!on && loadingWatch) {
        loadingWatch.disconnect();
        loadingWatch = null;
      }
      if (on) {
        loadingTimer = window.setTimeout(function () {
          setStickyLoading(false);
        }, 12000);
      }
    }

    function watchSourceLoading(target) {
      if (loadingWatch) loadingWatch.disconnect();
      loadingWatch = new MutationObserver(function () {
        if (!target.classList.contains('loading')) setStickyLoading(false);
      });
      loadingWatch.observe(target, { attributes: true, attributeFilter: ['class'] });
    }

    stickyBtn.addEventListener('click', function () {
      if (stickyBtn.classList.contains('is-loading')) return;
      if (!findSource()) return;
      if (sourceBtn.disabled || sourceBtn.getAttribute('aria-disabled') === 'true') return;

      if (sourceMode === 'cart') {
        var missing = firstMissingRequiredField();
        if (missing) {
          scrollToField(missing);
          return;
        }
      }

      sourceBtn.click();

      if (sourceMode === 'cart' && sourceBtn.classList.contains('loading')) {
        setStickyLoading(true);
        watchSourceLoading(sourceBtn);
      }
    });

    bar.addEventListener('click', function (event) {
      var btn = event.target.closest('.sticky-customize__value');
      if (!btn || !bar.contains(btn)) return;
      var name = btn.getAttribute('data-option-name');
      var value = btn.getAttribute('data-value');
      var root = variantRoot();
      if (!root) return;
      var input = root.querySelector(
        'input[type="radio"][name="' + CSS.escape(name) + '"][value="' + CSS.escape(value) + '"]'
      );
      if (!input || input.disabled || input.classList.contains('disabled')) return;
      input.click();
      window.setTimeout(syncFromMain, 50);
      window.setTimeout(syncFromMain, 250);
    });

    if (stickyQtyMinus) {
      stickyQtyMinus.addEventListener('click', function () {
        var main = mainQtyInput();
        if (!main) return;
        var minus = main.closest('quantity-input');
        if (minus) {
          var btn = minus.querySelector('button[name="minus"]');
          if (btn) btn.click();
        } else {
          var next = Math.max(parseInt(main.min || '1', 10), parseInt(main.value || '1', 10) - 1);
          writeQtyToMain(String(next));
        }
        window.setTimeout(syncQtyFromMain, 30);
      });
    }

    if (stickyQtyPlus) {
      stickyQtyPlus.addEventListener('click', function () {
        var main = mainQtyInput();
        if (!main) return;
        var wrap = main.closest('quantity-input');
        if (wrap) {
          var btn = wrap.querySelector('button[name="plus"]');
          if (btn) btn.click();
        } else {
          var next = parseInt(main.value || '1', 10) + 1;
          if (main.max) next = Math.min(parseInt(main.max, 10), next);
          writeQtyToMain(String(next));
        }
        window.setTimeout(syncQtyFromMain, 30);
      });
    }

    if (stickyQty) {
      stickyQty.addEventListener('change', function () {
        writeQtyToMain(stickyQty.value);
      });
    }

    var mainQty = mainQtyInput();
    if (mainQty) {
      mainQty.addEventListener('change', syncQtyFromMain);
      mainQty.addEventListener('input', syncQtyFromMain);
    }

    var root = variantRoot();
    if (root) {
      root.addEventListener('change', function () {
        window.setTimeout(syncFromMain, 30);
        window.setTimeout(syncFromMain, 200);
      });
    }

    var priceEl = mainPriceEl();
    if (priceEl && window.MutationObserver) {
      new MutationObserver(syncPrice).observe(priceEl, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    mql.addEventListener('change', bindObservers);

    bindObservers();
    var tries = 0;
    var findTimer = window.setInterval(function () {
      tries += 1;
      var prevMode = sourceMode;
      var found = findSource();
      if (found && (sourceMode !== prevMode || tries === 1)) {
        bindObservers();
      }
      if (descriptionRoot() && tries > 2) {
        bindObservers();
      }
      if (tries > 40) window.clearInterval(findTimer);
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
