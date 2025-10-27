if (!sessionStorage.getItem('preloadDone')) {
  if (typeof window.initPreload === 'function') {
    window.initPreload().finally(() => {
      sessionStorage.setItem('preloadDone', 'true');
    });
  }
}
