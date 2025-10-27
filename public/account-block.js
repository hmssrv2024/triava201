(function(){
  function checkAccountBlock(){
    const raw = localStorage.getItem('accountBlock');
    if(!raw) return;
    let block;
    try { block = JSON.parse(raw); } catch(e){
      localStorage.removeItem('accountBlock');
      return;
    }
    if(!block || typeof block !== 'object') return;
    const end = block.start + block.duration;
    const now = Date.now();
    if(now >= end){
      localStorage.removeItem('accountBlock');
      return;
    }
    const overlay = document.getElementById('account-block-overlay') || document.createElement('div');
    overlay.id = 'account-block-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.color = '#fff';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.textAlign = 'center';
    overlay.style.padding = '20px';
    overlay.innerHTML = '<h2>Cuenta bloqueada</h2><p>Por seguridad tu cuenta está temporalmente bloqueada.</p>';
    if(!overlay.parentNode){
      document.body.appendChild(overlay);
    }
    const app = document.getElementById('app');
    if(app) app.style.pointerEvents = 'none';
    document.documentElement.style.overflow = 'hidden';
    overlay.style.pointerEvents = 'auto';
    const chatFrame = document.querySelector('iframe[title*="chat"]');
    if(chatFrame) chatFrame.style.pointerEvents = 'auto';
    setTimeout(() => {
      overlay.remove();
      localStorage.removeItem('accountBlock');
      if(app) app.style.pointerEvents = '';
      document.documentElement.style.overflow = '';
    }, end - now);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', checkAccountBlock);
  } else {
    checkAccountBlock();
  }
  window.checkAccountBlock = checkAccountBlock;
})();
