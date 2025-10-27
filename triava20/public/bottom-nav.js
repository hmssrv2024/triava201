function getRecargaPage(){
  try{
    const reg = JSON.parse(localStorage.getItem('visaRegistrationCompleted') || '{}');
    return reg.useOldRecarga ? 'recarga3.html' : 'homevisa.html';
  }catch(e){
    return 'homevisa.html';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    // Cargar el fragmento utilizando una ruta sin extensión
    fetch('bottom-nav').then(res => res.text()),
    fetch('global-data.js').then(res => res.text())
  ]).then(([html, dataJs]) => {
    const container = document.getElementById('bottom-nav-container') || document.body;
    container.insertAdjacentHTML('beforeend', html);
    const script = document.createElement('script');
    script.textContent = dataJs;
    document.body.appendChild(script);
    const base = getRecargaPage();
    container.querySelectorAll('a[href^="recarga"]').forEach(a => {
      const href = a.getAttribute('href');
      const hashIndex = href.indexOf('#');
      const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
      a.setAttribute('href', base + hash);
    });
    document.dispatchEvent(new Event('bottomNavLoaded'));
  });
});
