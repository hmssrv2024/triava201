// Modular audio guide for transfer wizard
(function() {
  const stepAudios = {
    1: new Audio('audioguia.ogg/9. Elige metodo de retiro.ogg'),
    2: new Audio('audioguia.ogg/10.1. Cuanto dinero quieres retirar a tu banco.ogg'),
    3: new Audio('audioguia.ogg/11. Selecciona tu banco.ogg'),
    4: new Audio('audioguia.ogg/12. introduce los datos de retiro.ogg'),
    5: new Audio('audioguia.ogg/13. Confirma los datos de retiro.ogg'),
    pin: new Audio('audioguia.ogg/14. ingresa tu pin de 4 digitos.ogg')
  };

  let lastPlayed = null;

  function playForStep(step) {
    if (lastPlayed === step) return;
    const audio = stepAudios[step];
    if (audio) {
      audio.play().catch(() => {});
      lastPlayed = step;
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const steps = [1, 2, 3, 4, 5].map(i => document.getElementById(`wizard-step-${i}`));
    const pinOverlay = document.getElementById('pin-modal-overlay');

    if (steps.some(step => !step)) return;

    const observer = new MutationObserver(function() {
      steps.forEach((stepEl, idx) => {
        if (stepEl.classList.contains('active')) {
          playForStep(idx + 1);
        }
      });
    });

    steps.forEach(stepEl => {
      observer.observe(stepEl, { attributes: true, attributeFilter: ['class'] });
    });

    steps.forEach((stepEl, idx) => {
      if (stepEl.classList.contains('active')) {
        playForStep(idx + 1);
      }
    });

    if (pinOverlay) {
      const pinObserver = new MutationObserver(function() {
        const style = window.getComputedStyle(pinOverlay);
        if (style.display !== 'none') {
          playForStep('pin');
        }
      });
      pinObserver.observe(pinOverlay, { attributes: true, attributeFilter: ['style'] });
    }
  });
})();
