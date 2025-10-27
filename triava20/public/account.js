(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const orders = JSON.parse(localStorage.getItem('lpOrders') || '[]');
    const addresses = JSON.parse(localStorage.getItem('lpAddresses') || '[]');
    const invoices = JSON.parse(localStorage.getItem('lpInvoices') || '[]');
    if(!orders.length || !addresses.length || !invoices.length) return;

    const pendingNatRaw = localStorage.getItem('lpPendingNationalization');
    const pendingNat = pendingNatRaw ? JSON.parse(pendingNatRaw) : null;
    const natDone = localStorage.getItem('lpNationalizationDone') === 'true';
    const startTs = pendingNat && pendingNat.createdAt ? parseInt(pendingNat.createdAt, 10) : 0;
    const enforce = pendingNat && !natDone && (Date.now() - startTs >= 30 * 60 * 1000);
    if(enforce &&
       !location.pathname.endsWith('na.html') &&
       !location.pathname.endsWith('micuenta.html')){
      window.location.href = 'na.html';
      return;
    }
    const lastOrder = orders[orders.length - 1];
    const eta = lastOrder.shipping && lastOrder.shipping.eta;
    const today = new Date().toISOString().slice(0,10);
    if(eta && today > eta){
      ['lpUser','lpOrders','lpInvoices','lpClaims','lpPolicies','lpPayments','lpAddresses']
        .forEach(k => localStorage.removeItem(k));
      return;
    }
    const link = document.getElementById('account-link');
    if(link){
      link.style.display = 'inline-block';
      link.classList && link.classList.remove('disabled');
      link.removeAttribute('aria-disabled');
      const user = JSON.parse(localStorage.getItem('lpUser') || '{}');
      const hasInfo = user.name && user.doc && user.phone;
      link.setAttribute('href', hasInfo ? 'micuenta.html' : 'informacion.html');
    }
  });
})();
