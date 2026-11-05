/**
 * Fixes "Delivery in 5 to 7 day" → "Delivery in 5 to 7 days" in product DOM.
 * Covers product pages, homepage featured products, and ScaleUp-injected content.
 * Does not change already-correct "days" (avoids "dayss").
 */
(function () {
  var NEEDLE = /Delivery in 5 to 7 day(?!s)/g;
  var REPLACEMENT = 'Delivery in 5 to 7 days';
  var ROOT_SELECTOR = 'product-info, .product__info-container, .product';

  function fixTextNodes(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      if (!value || value.indexOf('Delivery in 5 to 7 day') === -1) continue;
      var next = value.replace(NEEDLE, REPLACEMENT);
      if (next !== value) node.nodeValue = next;
    }
  }

  function run() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(fixTextNodes);
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

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.setTimeout(function () {
      observer.disconnect();
      run();
    }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
