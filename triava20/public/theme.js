(function(){
  function applyTheme(){
    const theme = localStorage.getItem('remeexTheme');
    document.body.classList.remove('dark-mode','silver-mode','gold-mode');
    if(theme === 'dark') document.body.classList.add('dark-mode');
    if(theme === 'silver') document.body.classList.add('silver-mode');
    if(theme === 'gold') document.body.classList.add('gold-mode');
  }
    function init(){
      applyTheme();
      const darkToggle = document.getElementById('dark-mode-toggle');
      const silverToggle = document.getElementById('silver-mode-toggle');
      const goldToggle = document.getElementById('gold-mode-toggle');
      if(darkToggle){
      darkToggle.checked = localStorage.getItem('remeexTheme') === 'dark';
      darkToggle.addEventListener('change', () => {
        if(darkToggle.checked){
          localStorage.setItem('remeexTheme','dark');
          if(silverToggle) silverToggle.checked = false;
          if(goldToggle) goldToggle.checked = false;
        }else{
          localStorage.removeItem('remeexTheme');
        }
        applyTheme();
        });
      }
      if(silverToggle){
      silverToggle.checked = localStorage.getItem('remeexTheme') === 'silver';
      silverToggle.addEventListener('change', () => {
        if(silverToggle.checked){
          localStorage.setItem('remeexTheme','silver');
          if(darkToggle) darkToggle.checked = false;
          if(goldToggle) goldToggle.checked = false;
        }else{
          localStorage.removeItem('remeexTheme');
        }
        applyTheme();
        });
      }
      if(goldToggle){
      goldToggle.checked = localStorage.getItem('remeexTheme') === 'gold';
      goldToggle.addEventListener('change', () => {
        if(goldToggle.checked){
          localStorage.setItem('remeexTheme','gold');
          if(darkToggle) darkToggle.checked = false;
          if(silverToggle) silverToggle.checked = false;
        }else{
          localStorage.removeItem('remeexTheme');
        }
        applyTheme();
        });
      }
      window.addEventListener('storage', (e) => {
        if(e.key === 'remeexTheme'){
          applyTheme();
          if(darkToggle) darkToggle.checked = e.newValue === 'dark';
          if(silverToggle) silverToggle.checked = e.newValue === 'silver';
          if(goldToggle) goldToggle.checked = e.newValue === 'gold';
        }
      });
    }
  document.addEventListener('DOMContentLoaded', init);
  window.applyTheme = applyTheme;
})();
