(function () {
  function redirectToRegistration() {
    try {
      window.location.replace('registro.html');
    } catch (error) {
      console.error('No se pudo redirigir a registro.html', error);
      window.location.href = 'registro.html';
    }
  }

  function hasCompletedRegistration() {
    try {
      var stored = localStorage.getItem('visaRegistrationCompleted');
      if (!stored) {
        return false;
      }

      var data;
      try {
        data = JSON.parse(stored);
      } catch (parseError) {
        console.warn('Datos de registro inválidos detectados.', parseError);
        return false;
      }

      return Boolean(data && data.completed);
    } catch (storageError) {
      console.error('No se pudo acceder al almacenamiento local.', storageError);
      return false;
    }
  }

  function enforceGuard() {
    if (!hasCompletedRegistration()) {
      redirectToRegistration();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceGuard, { once: true });
  } else {
    enforceGuard();
  }
})();
