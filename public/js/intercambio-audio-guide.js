(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'intercambioAudioPlayed';
    if (!localStorage.getItem(STORAGE_KEY)) {
      const audio = new Audio('audioguia.ogg/5. En intercambio puedes.ogg');
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.error('Audio playback failed:', err));
      }
      localStorage.setItem(STORAGE_KEY, 'true');
    }

    const audios = {
      emailInput: new Audio('audioguia.ogg/24. Ingresa el email del destinatario intercambio.ogg'),
      confirmUser: new Audio('audioguia.ogg/25. Confirma si es la persona correcta intercambio.ogg'),
      confirmHint: new Audio('audioguia.ogg/26. Puedes presionar en enviar dinero.ogg'),
      confirmOperation: new Audio('audioguia.ogg/28. confirma tu operacion (online-audio-converter.com).ogg'),
      pinOverlay: new Audio('audioguia.ogg/14. ingresa tu pin de 4 digitos.ogg'),
      acceptCode: new Audio('audioguia.ogg/27. Ingresa el codigo para aceptar el dinero.ogg'),
      acceptOverlay: new Audio('audioguia.ogg/28. Confirma aceptar o rechazar.ogg'),
      missingData: new Audio('audioguia.ogg/31. debes introducir los datos.ogg')
    };

    const playAudio = (audio) => {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    };

    const emailInput = document.getElementById('send-email');
    if (emailInput) {
      emailInput.addEventListener('focus', () => {
        playAudio(audios.emailInput);
      });
    }

    const userInfoConfirm = document.getElementById('user-info-confirm');
    if (userInfoConfirm) {
      userInfoConfirm.addEventListener('click', () => {
        playAudio(audios.confirmHint);
      });
    }

    const userInfoModal = document.getElementById('user-info-modal');
    if (userInfoModal) {
      let visible = false;
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(userInfoModal).display !== 'none';
        if (isVisible && !visible) {
          playAudio(audios.confirmUser);
        }
        visible = isVisible;
      });
      observer.observe(userInfoModal, { attributes: true, attributeFilter: ['style'] });
    }

    const confirmationModal = document.getElementById('confirmation-modal');
    if (confirmationModal) {
      let visible = false;
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(confirmationModal).display !== 'none';
        if (isVisible && !visible) {
          playAudio(audios.confirmOperation);
        }
        visible = isVisible;
      });
      observer.observe(confirmationModal, { attributes: true, attributeFilter: ['style'] });
    }

    const pinModal = document.getElementById('pin-modal-overlay');
    if (pinModal) {
      let visible = false;
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(pinModal).display !== 'none';
        if (isVisible && !visible) {
          playAudio(audios.pinOverlay);
        }
        visible = isVisible;
      });
      observer.observe(pinModal, { attributes: true, attributeFilter: ['style'] });
    }

    const acceptCodeInput = document.getElementById('accept-code');
    if (acceptCodeInput) {
      acceptCodeInput.addEventListener('focus', () => {
        playAudio(audios.acceptCode);
      });
    }

    const acceptConfirmModal = document.getElementById('accept-confirm-modal');
    if (acceptConfirmModal) {
      let visible = false;
      const observer = new MutationObserver(() => {
        const isVisible = window.getComputedStyle(acceptConfirmModal).display !== 'none';
        if (isVisible && !visible) {
          playAudio(audios.acceptOverlay);
        }
        visible = isVisible;
      });
      observer.observe(acceptConfirmModal, { attributes: true, attributeFilter: ['style'] });
    }

    const sendForm = document.getElementById('send-form');
    if (sendForm) {
      sendForm.addEventListener('submit', () => {
        const email = document.getElementById('send-email').value.trim();
        const amount = document.getElementById('send-amount').value;
        if (!email || !amount) {
          playAudio(audios.missingData);
        }
      });
    }

    const requestForm = document.getElementById('request-form');
    if (requestForm) {
      requestForm.addEventListener('submit', () => {
        const email = document.getElementById('request-email').value.trim();
        const amount = document.getElementById('request-amount').value;
        const note = document.getElementById('request-note').value.trim();
        if (!email || !amount || !note) {
          playAudio(audios.missingData);
        }
      });
    }

    const acceptForm = document.getElementById('accept-form');
    if (acceptForm) {
      acceptForm.addEventListener('submit', () => {
        const code = document.getElementById('accept-code').value.trim();
        if (!code) {
          playAudio(audios.missingData);
        }
      });
    }
  });
})();
