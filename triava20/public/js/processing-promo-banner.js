// Carousel for promo banners during document verification

document.addEventListener('DOMContentLoaded', function () {
  const banner = document.getElementById('processing-promo-banner');
  const img = document.getElementById('processing-promo-image');
  const close = document.getElementById('processing-promo-close');

  if (!banner || !img) return;

  const images = [
    'img/Bannerremeexfamilia.png',
    'img/bannerremeexjovendevenezuela.png',
    'img/bannerremeexchicadevenezuela.png',
    'img/bannerremeexchav.png',
    'img/bannerremeexzelle.png',
    'soytechnoremeex.png',
    'farmatodoremeex.png',
    'Morgan Maxwell (2).png',
    'Morgan Maxwell (7).png',
    'westernremeexpromo.png',
    'multimaxremeexpromo.png',
    'clxsamsunpromo.png',
    'becoremeexpromo.png',
    'motosberapromo.png',
    'tarjetaremeex.png',
    'aunsoloclick.png',
    'zinliremeex.png'
  ];

  let index = 0;
  let interval;

  function startCarousel() {
    img.src = images[index];
    interval = setInterval(() => {
      index = (index + 1) % images.length;
      img.src = images[index];
    }, 10000);
  }

  function show() {
    if (banner.style.display === 'block') return;
    const oldBanner = document.getElementById('promo-banner');
    if (oldBanner) {
      oldBanner.style.display = 'none';
      // Ensure the regular promo banner does not reappear
      localStorage.setItem('securityNoticeClosed', 'true');
    }
    banner.style.display = 'block';
    startCarousel();
  }

  function hide() {
    banner.style.display = 'none';
    clearInterval(interval);
    if (typeof window.checkBannersVisibility === 'function') {
      window.checkBannersVisibility();
    }
  }

  if (close) {
    close.addEventListener('click', hide);
  }

  window.showProcessingPromo = show;
  window.hideProcessingPromo = hide;
});
