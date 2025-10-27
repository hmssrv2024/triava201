'use strict';
(function(){
  const STORAGE_KEY='smartBandClaimed';
  const GIFT_AMOUNT=1000;
  const CODE='54494614184';
  const WHATSAPP='+18133584564';
  let claimed=false;

  function loadStatus(){
    claimed=localStorage.getItem(STORAGE_KEY)==='true';
  }

  function saveStatus(){
    localStorage.setItem(STORAGE_KEY,'true');
  }

  function buildMessage(){
    const name=(window.currentUser&&((currentUser.fullName||'')||(currentUser.name||'')))||'';
    return `Hola, mi nombre es ${name}. Tengo el código ganador ${CODE} del Xiaomi Smart Band 10 de parte Remeex Visa y necesito reclamar mi premio.`;
  }

  function updateUI(){
    const bar=document.getElementById('gift-progress-bar');
    const congrats=document.getElementById('gift-congrats');
    const btn=document.getElementById('claim-gift-btn');
    if(!bar) return;
    const balance=(window.currentUser&&currentUser.balance&&currentUser.balance.usd)||0;
    bar.style.width=Math.min(100,(balance/GIFT_AMOUNT)*100)+'%';
    if(balance>=GIFT_AMOUNT && !claimed){
      if(congrats) congrats.style.display='block';
      if(btn) btn.style.display='inline-block';
    }else{
      if(congrats) congrats.style.display='none';
      if(btn) btn.style.display='none';
    }
    if(btn) btn.disabled=claimed;
  }

  function claimGift(){
    if(claimed) return;
    saveStatus();
    claimed=true;
    const url=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url,'_blank');
    updateUI();
  }

  function setup(){
    loadStatus();
    updateUI();
    const btn=document.getElementById('claim-gift-btn');
    if(btn) btn.addEventListener('click',claimGift);
  }

  window.addEventListener('DOMContentLoaded',setup);
  window.updateGiftProgress=updateUI;
})();
