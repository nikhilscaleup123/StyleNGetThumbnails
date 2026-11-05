function initHeaderMenuHover() {
  const inlineMenu = document.querySelector('.header__inline-menu');
  if (!inlineMenu) return;

  inlineMenu.querySelectorAll('header-menu').forEach((menu) => {
    const details = menu.querySelector('details');
    if (!details) return;

    menu.addEventListener('mouseenter', () => {
      details.setAttribute('open', '');
    });

    menu.addEventListener('mouseleave', () => {
      details.removeAttribute('open');
    });
  });
}

initHeaderMenuHover();
