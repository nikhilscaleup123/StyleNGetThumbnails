class CartDrawerRecommendations extends HTMLElement {
  constructor() {
    super();
    this.loadedProductId = null;
    this.loading = false;
    this.cartUpdateUnsubscriber = undefined;
  }

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.onCartUpdate.bind(this));
    this.addEventListener('click', this.onClick.bind(this));
    this.load();
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  onCartUpdate(event) {
    if (event?.source === 'product-form' || event?.source === 'cart-drawer-recommendations') {
      return;
    }

    const itemCount = event?.cartData?.item_count;
    if (itemCount === 0) {
      this.hidden = true;
      this.clearSlots();
      this.loadedProductId = null;
      this.syncDrawerLayout();
      return;
    }

    const productId = event?.cartData?.items?.[0]?.product_id;
    if (productId) {
      this.dataset.productId = String(productId);
    }

    this.hidden = false;
    this.load(true);
  }

  onClick(event) {
    const button = event.target.closest('[data-variant-id]');
    if (!button || button.tagName !== 'BUTTON') return;

    event.preventDefault();
    this.addVariant(button);
  }

  getRecommendationUrl(intent, limit) {
    const base = this.dataset.urlBase;
    const sectionId = this.dataset.sectionId;
    const productId = this.dataset.productId;

    if (!base || !sectionId || !productId) return null;

    const url = new URL(base, window.location.origin);
    url.searchParams.set('section_id', sectionId);
    url.searchParams.set('product_id', productId);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('intent', intent);
    return url.toString();
  }

  clearSlots() {
    this.querySelectorAll('[data-recommendations-slot]').forEach((slot) => {
      slot.hidden = true;
      slot.innerHTML = '';
    });
  }

  syncDrawerLayout() {
    const drawerInner = this.closest('.drawer__inner');
    if (!drawerInner) return;

    const hasVisibleSlot = !this.hidden && Array.from(this.querySelectorAll('[data-recommendations-slot]')).some(
      (slot) => !slot.hidden
    );

    drawerInner.classList.toggle('drawer__inner--has-recs', hasVisibleSlot);
  }

  async load(force = false) {
    const productId = this.dataset.productId;
    if (!productId) {
      this.hidden = true;
      this.syncDrawerLayout();
      return;
    }

    if (!force && this.loadedProductId === productId) return;
    if (this.loading) return;

    this.loading = true;
    this.hidden = false;

    const requests = [];

    if (this.dataset.crossSellEnabled === 'true') {
      requests.push(
        this.fetchIntent('related', this.dataset.crossSellLimit || 4)
      );
    }

    if (this.dataset.upsellEnabled === 'true') {
      requests.push(
        this.fetchIntent('complementary', this.dataset.upsellLimit || 2)
      );
    }

    try {
      await Promise.all(requests);
      this.loadedProductId = productId;

      const hasVisibleSlot = Array.from(this.querySelectorAll('[data-recommendations-slot]')).some(
        (slot) => !slot.hidden
      );
      this.hidden = !hasVisibleSlot;
      this.syncDrawerLayout();
    } catch (error) {
      console.error(error);
      this.syncDrawerLayout();
    } finally {
      this.loading = false;
    }
  }

  async fetchIntent(intent, limit) {
    const slot = this.querySelector(`[data-recommendations-slot="${intent}"]`);
    if (!slot) return;

    slot.hidden = false;

    const url = this.getRecommendationUrl(intent, limit);
    if (!url) {
      slot.hidden = true;
      return;
    }

    const response = await fetch(url);
    if (!response.ok) {
      slot.hidden = true;
      slot.innerHTML = '';
      return;
    }

    const text = await response.text();
    const html = new DOMParser().parseFromString(text, 'text/html');
    const content = html.querySelector(`.cart-drawer-recs--${intent === 'complementary' ? 'upsell' : 'cross-sell'}`)
      || html.querySelector(`[data-intent="${intent}"]`)
      || html.querySelector('.cart-drawer-recs');

    if (content && content.innerHTML.trim()) {
      if (intent === 'complementary') {
        const relatedTitles = new Set(
          Array.from(this.querySelectorAll('[data-recommendations-slot="related"] .cart-drawer-rec-card__title')).map(
            (el) => el.textContent.trim()
          )
        );
        content.querySelectorAll('.cart-drawer-recs__item').forEach((item) => {
          const title = item.querySelector('.cart-drawer-rec-card__title')?.textContent.trim();
          if (title && relatedTitles.has(title)) item.remove();
        });
        if (!content.querySelector('.cart-drawer-recs__item')) {
          slot.innerHTML = '';
          slot.hidden = true;
          return;
        }
      }

      slot.innerHTML = '';
      slot.appendChild(document.importNode(content, true));
      slot.hidden = false;
    } else {
      slot.innerHTML = '';
      slot.hidden = true;
    }
  }

  async addVariant(button) {
    const cart = document.querySelector('cart-drawer');
    if (!cart || button.getAttribute('aria-disabled') === 'true') return;

    const variantId = button.dataset.variantId;
    if (!variantId) return;

    button.setAttribute('aria-disabled', 'true');
    button.classList.add('loading');
    const spinner = button.querySelector('.loading__spinner');
    if (spinner) spinner.classList.remove('hidden');

    const formData = new FormData();
    formData.append('id', variantId);
    formData.append('quantity', '1');
    formData.append(
      'sections',
      cart.getSectionsToRender().map((section) => section.id).join(',')
    );
    formData.append('sections_url', window.location.pathname);
    cart.setActiveElement(document.activeElement);

    try {
      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      config.body = formData;

      const response = await fetch(`${routes.cart_add_url}`, config);
      const data = await response.json();

      if (data.status) {
        console.error(data.description || data.message);
        return;
      }

      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'cart-drawer-recommendations',
        productVariantId: variantId,
        cartData: data,
      });

      cart.renderContents(data);
    } catch (error) {
      console.error(error);
    } finally {
      button.classList.remove('loading');
      button.removeAttribute('aria-disabled');
      if (spinner) spinner.classList.add('hidden');
    }
  }
}

customElements.define('cart-drawer-recommendations', CartDrawerRecommendations);
