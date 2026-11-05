if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        if (!this.elements.thumbnails) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target));
        });
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();

        this.syncThumbnailsWidth = this.syncThumbnailsWidth.bind(this);
        this.mql.addEventListener('change', this.syncThumbnailsWidth);
        window.addEventListener('resize', debounce(this.syncThumbnailsWidth, 100));
        if (document.readyState === 'complete') {
          this.syncThumbnailsWidth();
        } else {
          window.addEventListener('load', this.syncThumbnailsWidth, { once: true });
        }
        requestAnimationFrame(() => this.syncThumbnailsWidth());
      }

      syncThumbnailsWidth() {
        if (!this.elements.thumbnails) return;

        // Mobile: let CSS use full width — don't sync constrained desktop width
        if (!this.mql.matches) {
          this.style.removeProperty('--gallery-media-width');
          return;
        }

        const activeMedia =
          this.elements.viewer.querySelector('.product__media-item.is-active .product-media-container') ||
          this.elements.viewer.querySelector('.product__media-item .product-media-container');

        if (!activeMedia) {
          this.style.removeProperty('--gallery-media-width');
          return;
        }

        const width = Math.round(activeMedia.getBoundingClientRect().width);
        if (width > 0) {
          this.style.setProperty('--gallery-media-width', `${width}px`);
        }
      }

      onSlideChanged(event) {
        const slide = event.detail.currentElement;
        if (!slide) return;

        const activeSlide = this.elements.viewer.querySelector('[data-media-id].is-active');
        if (activeSlide && slide.dataset.mediaId !== activeSlide.dataset.mediaId) return;

        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${slide.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
        this.syncThumbnailsWidth();
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia = this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`);
        if (!activeMedia) return;

        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia.classList.add('is-active');

        if (prepend) {
          activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.viewer.resetPages) this.elements.viewer.resetPages();
          if (this.elements.thumbnails && this.elements.thumbnails.resetPages) {
            this.elements.thumbnails.resetPages();
          }
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        if (activeThumbnail) {
          this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
        }
        requestAnimationFrame(() => this.syncThumbnailsWidth());
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
          this.syncThumbnailsWidth();
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}
