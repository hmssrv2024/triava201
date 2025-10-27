// Rotates Remeex promotional banners

document.addEventListener('DOMContentLoaded', function () {
  var wrapper = document.querySelector('#promo-banner .remeex-full-banner-wrapper');
  if (!wrapper) return;

  var items = wrapper.querySelectorAll('.security-notice-item');
  if (items.length === 0) return;

  var index = 0;

  items.forEach(function(item, i) {
    if (i !== 0) item.style.display = 'none';
  });

  function showNext() {
    items[index].style.display = 'none';
    index = (index + 1) % items.length;
    items[index].style.display = 'block';
  }

  setInterval(showNext, 8000);
});
