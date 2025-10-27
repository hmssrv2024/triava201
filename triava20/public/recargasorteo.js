'use strict';
(function(){
  const STORAGE_KEY = 'remeexRaffle';
  const FOLD = 'fold';
  const FLIP = 'flip';
  function getRaffleEnd(){
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth()+2, 0, 23,59,59,999);
    return end.getTime();
  }
  function load(){
    try{
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if(data.end && Date.now() <= data.end){ return data; }
    }catch(e){}
    return {};
  }
  function save(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function generateTicket(){
    const num = Math.floor(Math.random()*900000)+100000;
    return '#'+num.toLocaleString('de-DE');
  }
  function updateCountdown(end){
    const el = document.getElementById('raffle-countdown');
    if(!el) return;
    const days = Math.max(0, Math.ceil((end - Date.now())/86400000));
    el.textContent = days;
  }
  function showSelection(){
    const selection=document.getElementById('raffle-selection');
    const info=document.getElementById('raffle-info');
    const btn=document.getElementById('participate-btn');
    if(selection) selection.style.display='block';
    if(info) info.style.display='none';
    if(btn) btn.disabled=true;
    document.querySelectorAll('.raffle-option').forEach(o=>{
      o.classList.remove('selected');
      const inp=o.querySelector('input');
      if(inp) inp.checked=false;
    });
  }
  function showInfo(data){
    const selection=document.getElementById('raffle-selection');
    const info=document.getElementById('raffle-info');
    if(selection) selection.style.display='none';
    if(info){
      info.style.display='block';
      const model=data.choice===FOLD?'Samsung Galaxy Fold 7':'Samsung Galaxy Flip 7';
      const nameEl=document.getElementById('raffle-selected');
      const ticketEl=document.getElementById('raffle-ticket');
      if(nameEl) nameEl.textContent=model;
      if(ticketEl) ticketEl.textContent=data.ticket;
      updateCountdown(data.end);
    }
  }
  function openOverlay(){
    const overlay=document.getElementById('promo-raffle-overlay');
    const subtitle=document.getElementById('raffle-subtitle');
    const desc=document.getElementById('raffle-description');
    const titleEl=overlay?overlay.querySelector('.modal-title'):null;
    const data=load();
    const end=data.end||getRaffleEnd();
    if(subtitle){
      subtitle.textContent='Participa hasta '+new Date(end).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
    }
    if(desc){
      desc.innerHTML='Selecciona tu modelo favorito y participa por uno de los <strong>100 dispositivos</strong> que estamos sorteando:';
    }
    if(titleEl){
      const name=((window.currentUser||{}).fullName||(window.currentUser||{}).name||'').split(' ')[0];
      if(name){
        titleEl.textContent=name+', Sorteo del Mes';
      }
    }
    if(data.choice){ showInfo(Object.assign({},data,{end})); }
    else{ showSelection(); }
    if(overlay) overlay.style.display='flex';
  }
  function closeOverlay(){
    const overlay=document.getElementById('promo-raffle-overlay');
    if(overlay) overlay.style.display='none';
  }
  function participate(){
    const input=document.querySelector('.raffle-option input:checked');
    if(!input) return;
    const data={ end:getRaffleEnd(), choice:input.value, ticket:generateTicket() };
    save(data);
    closeOverlay();
    const success=document.getElementById('raffle-success-overlay');
    const ticketEl=document.getElementById('raffle-success-ticket');
    if(ticketEl) ticketEl.textContent=data.ticket;
    if(success){
      success.style.display='flex';
      if(typeof confetti==='function'){ confetti({particleCount:200,spread:80,origin:{y:0.6}}); }
    }
  }
  function setup(){
    const openBtn=document.getElementById('promo-nav-btn');
    const closeBtn=document.getElementById('raffle-close');
    const closeIcon=document.getElementById('raffle-close-top');
    const overlay=document.getElementById('promo-raffle-overlay');
    const partBtn=document.getElementById('participate-btn');
    const successClose=document.getElementById('raffle-success-close');
    if(openBtn) openBtn.addEventListener('click',openOverlay);
    if(closeBtn) closeBtn.addEventListener('click',closeOverlay);
    if(closeIcon) closeIcon.addEventListener('click',closeOverlay);
    if(overlay) overlay.addEventListener('click',e=>{ if(e.target===overlay) closeOverlay(); });
    if(partBtn) partBtn.addEventListener('click',participate);
    if(successClose) successClose.addEventListener('click',()=>{
      const s=document.getElementById('raffle-success-overlay');
      if(s) s.style.display='none';
    });
    document.querySelectorAll('.raffle-option input').forEach(inp=>{
      inp.addEventListener('change',function(){
        const opt=this.closest('.raffle-option');
        document.querySelectorAll('.raffle-option').forEach(o=>o.classList.remove('selected'));
        if(opt) opt.classList.add('selected');
        if(partBtn) partBtn.disabled=false;
      });
    });
  }
  window.openRaffleOverlay=openOverlay;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
