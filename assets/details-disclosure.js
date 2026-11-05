class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.isMegaMenu = this.mainDetailsToggle.classList.contains('mega-menu');
    this.closeDelay = null;

    if (this.isMegaMenu) {
      this.initMegaMenuHover();
    }
  }

  isDesktop() {
    return window.matchMedia('(min-width: 990px)').matches;
  }

  initMegaMenuHover() {
    const openMenu = () => {
      clearTimeout(this.closeDelay);
      this.mainDetailsToggle.setAttribute('open', '');
    };

    const scheduleClose = () => {
      clearTimeout(this.closeDelay);
      this.closeDelay = setTimeout(() => {
        this.close();
      }, 200);
    };

    [this, this.content].forEach((element) => {
      element.addEventListener('mouseenter', () => {
        if (!this.isDesktop()) return;
        openMenu();
      });

      element.addEventListener('mouseleave', () => {
        if (!this.isDesktop()) return;
        scheduleClose();
      });
    });
  }

  onFocusOut() {
    if (this.isMegaMenu && this.isDesktop()) return;

    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}

customElements.define('header-menu', HeaderMenu);
