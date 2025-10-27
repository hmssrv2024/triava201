'use strict';
(function(){
  const STORAGE_KEY = 'remeexPoints';
  const MAX_POINTS = 10000;
  let points = 0;
  let history = [];

  function load(){
    try{
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      points = data.points || 0;
      history = Array.isArray(data.history) ? data.history : [];
    }catch(e){
      points = 0; history = []; }
  }

  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify({points, history}));
  }

  function addHistory(desc, pts){
    history.push({desc, pts, date: getCurrentDateTime()});
    if(history.length>50) history = history.slice(-50);
  }

  function addPoints(desc, pts){
    if(pts<=0) return;
    const available = MAX_POINTS - points;
    if(available<=0) return;
    const toAdd = Math.min(pts, available);
    points += toAdd;
    addHistory(desc, toAdd);
    save();
    updateUI();
  }

  function redeemPoints(amount){
    const maxUsd = Math.floor(points/100);
    if(maxUsd<=0) return;
    let usd = parseInt(amount,10);
    if(!usd || usd>maxUsd) usd = maxUsd;
    if(usd < 1) return;
    const pts = usd*100;
    points -= pts;
    addHistory('Canjeado', -pts);
    save();

    let prevUsd = 0;
    if(window.currentUser){
      prevUsd = currentUser.balance.usd || 0;
      currentUser.balance.usd += usd;
      currentUser.balance.bs += usd*CONFIG.EXCHANGE_RATES.USD_TO_BS;
      currentUser.balance.eur += usd*CONFIG.EXCHANGE_RATES.USD_TO_EUR;
    }

    if(typeof saveBalanceData==='function') saveBalanceData();
    if(typeof adjustTierAfterBalanceChange==='function') adjustTierAfterBalanceChange(prevUsd, prevUsd + usd);

    if(typeof addTransaction==='function') addTransaction({
      type:'deposit',
      id: 'points_'+Date.now(),
      amount: usd,
      amountBs: usd*CONFIG.EXCHANGE_RATES.USD_TO_BS,
      amountEur: usd*CONFIG.EXCHANGE_RATES.USD_TO_EUR,
      date: getCurrentDateTime(),
      description:`Canje de ${pts} puntos`,
      bankName:'Remeex Visa',
      bankLogo:'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhnBzNdjl6bNp-nIdaiHVENczJhwlJNA7ocsyiOObMmzbu8at0dY5yGcZ9cLxLF39qI6gwNfqBxlkTDC0txVULEwQVwGkeEzN0Jq9MRTRagA48mh18UqTlR4WhsXOLAEZugUyhqJHB19xJgnkpe-S5VOWFgzpKFwctv3XP9XhH41vNTvq0ZS-nik58Qhr-O/s320/remeex.png',
      status:'completed'
    });

    if(typeof saveTransactionsData==='function') saveTransactionsData();
    if(typeof updateMainBalanceDisplay==='function') updateMainBalanceDisplay();
    if(typeof updateDashboardUI==='function') updateDashboardUI();
    if(typeof updateRecentTransactions==='function') updateRecentTransactions();
    if(typeof updateUserUI==='function') updateUserUI();

    updateUI();
    const overlay = document.getElementById('points-success-overlay');
    const amountEl = document.getElementById('points-success-amount');
    if(amountEl) amountEl.textContent = formatCurrency(usd, 'usd');
    if(overlay) {
      overlay.style.display = 'flex';
      if(typeof confetti==='function') confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  }

  function updateUI(){
    const amountEl = document.getElementById('points-amount');
    const usdEl = document.getElementById('points-usd');
    const progressBar = document.getElementById('points-progress-bar');
    const inputEl = document.getElementById('redeem-points-input');
    const historyEl = document.getElementById('points-history');
    if(amountEl) amountEl.textContent = points;
    if(usdEl) usdEl.textContent = formatCurrency(points/100, 'usd');
    if(progressBar) progressBar.style.width = Math.min((points/MAX_POINTS)*100, 100) + '%';
    if(inputEl){
      const maxRedeem = Math.floor(points/100);
      inputEl.max = maxRedeem;
      if(maxRedeem < 1){
        inputEl.value = 0;
        inputEl.disabled = true;
      } else {
        if(!inputEl.value || inputEl.value < 1) inputEl.value = 1;
        if(inputEl.value > maxRedeem) inputEl.value = maxRedeem;
        inputEl.disabled = false;
      }
    }
    if(historyEl){
      historyEl.innerHTML = '';
      const items = history.slice(-5).reverse();
      if(!items.length){
        const li=document.createElement('li');
        li.textContent='Sin historial';
        historyEl.appendChild(li);
      } else {
        items.forEach(h=>{
          const li=document.createElement('li');
          const sign = h.pts>0?'+':'';
          li.textContent=`${h.desc} ${sign}${h.pts}`;
          historyEl.appendChild(li);
        });
      }
    }

    if(typeof updateAccountTierDisplay==='function'){
      updateAccountTierDisplay();
    }
  }

  function fromTransaction(tx){
    if(!tx) return;
    const desc = (tx.description||'').toLowerCase();
    if(desc.includes('canje de puntos')) return;
    if(tx.type==='deposit'){
      if(desc.includes('pago') || desc.includes('recarga') || desc.includes('tarjeta')){
        const pts = Math.min(Math.round(tx.amount||0), 5000);
        addPoints('Recarga de saldo', pts);
        return;
      }
    }
    if(desc.includes('intercambio') || desc.includes('donaci')){
      addPoints('Intercambio/Donación', 50);
    }
  }

  function checkRegistration(){
    if(localStorage.getItem('visaRegistrationCompleted') && !localStorage.getItem('pointsReg')){
      addPoints('Registro exitoso', 100);
      localStorage.setItem('pointsReg','true');
    }
  }

  function checkVerification(){
    const status = localStorage.getItem(CONFIG.STORAGE_KEYS.VERIFICATION);
    if(status==='verified' && !localStorage.getItem('pointsVer')){
      addPoints('Verificación de documento', 200);
      localStorage.setItem('pointsVer','true');
    }
  }

  window.addEventListener('storage', e=>{
    if(e.key===CONFIG.STORAGE_KEYS.VERIFICATION && e.newValue==='verified'){
      checkVerification();
    }
  });

  function init(){
    load();
    checkRegistration();
    checkVerification();
    updateUI();
    const redeemBtn = document.getElementById('redeem-points-btn');
    const inputEl = document.getElementById('redeem-points-input');
    if(redeemBtn) redeemBtn.addEventListener('click', ()=>redeemPoints(inputEl ? inputEl.value : undefined));
    const closeBtn = document.getElementById('points-success-close');
    const successOverlay = document.getElementById('points-success-overlay');
    if(closeBtn) closeBtn.addEventListener('click', ()=>{ if(successOverlay) successOverlay.style.display='none'; });
    if(successOverlay) successOverlay.addEventListener('click', e=>{ if(e.target===successOverlay) successOverlay.style.display='none'; });
  }

  if(document.readyState === 'loading'){
    window.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }

  const origAddTransaction = window.addTransaction;
  window.addTransaction = function(tx){
    if(origAddTransaction) origAddTransaction(tx);
    try{ fromTransaction(tx); }catch(e){}
  };

  const origAdjustTier = window.adjustTierAfterBalanceChange;
  window.adjustTierAfterBalanceChange = function(p,n){
    const prevTier = window.getAccountTier ? getAccountTier(p) : '';
    const newTier = window.getAccountTier ? getAccountTier(n) : '';
    if(origAdjustTier) origAdjustTier(p,n);
    if(prevTier!==newTier){ addPoints('Ascenso de nivel', 100); }
  };

  function getPoints(){ return points; }

  window.remeexPoints = { add:addPoints, redeem:redeemPoints, updateUI, fromTransaction, getPoints };
})();
