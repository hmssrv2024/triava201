(function(){
  const STORAGE_KEY = 'remeexUserActivity';
  let selectedActivity = null;

  function saveActivities(list){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch(e) {}
  }

  function loadActivities(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e){ return []; }
  }

  window.logUserActivity = function(type, status, details){
    const acts = loadActivities();
    acts.push({ type, status, details: details || '', date: Date.now() });
    while(acts.length > 20) acts.shift();
    saveActivities(acts);
  };

  function renderActivityLog(){
    const listEl = document.getElementById('activity-log-list');
    if(!listEl) return;
    const acts = loadActivities().slice().reverse();
    listEl.innerHTML = '';
    if(!acts.length){
      const empty = document.createElement('div');
      empty.className = 'no-history';
      empty.textContent = 'No hay actividad registrada.';
      listEl.appendChild(empty);
      return;
    }
    acts.forEach((act, idx) => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      item.textContent = `[${new Date(act.date).toLocaleString()}] ${act.type} - ${act.status}`;
      item.addEventListener('click', () => {
        document.querySelectorAll('#activity-log-list .activity-item').forEach(i=>i.classList.remove('selected'));
        item.classList.add('selected');
        selectedActivity = act;
      });
      listEl.appendChild(item);
    });
  }

  window.openReportsOverlay = function(){
    selectedActivity = null;
    renderActivityLog();
    const overlay = document.getElementById('reports-overlay');
    if(overlay) overlay.style.display = 'flex';
    const descEl = document.getElementById('report-description');
    if(descEl) descEl.value = '';
    const categoryEl = document.getElementById('report-category');
    if(categoryEl) categoryEl.value = '';
    const emailEl = document.getElementById('report-email');
    if(emailEl) emailEl.value = '';
    const fileEl = document.getElementById('report-file');
    if(fileEl) fileEl.value = '';
    const err1 = document.getElementById('report-description-error');
    const err2 = document.getElementById('report-category-error');
    if(err1) err1.style.display = 'none';
    if(err2) err2.style.display = 'none';
  };

  function closeReportsOverlay(){
    const overlay = document.getElementById('reports-overlay');
    if(overlay) overlay.style.display = 'none';
  }

  function sendReportViaWhatsApp(){
    const descEl = document.getElementById('report-description');
    const errorEl = document.getElementById('report-description-error');
    const categoryEl = document.getElementById('report-category');
    const categoryError = document.getElementById('report-category-error');
    const emailEl = document.getElementById('report-email');
    const fileEl = document.getElementById('report-file');

    const text = (descEl ? descEl.value : '').trim();
    const category = (categoryEl ? categoryEl.value : '').trim();

    let valid = true;
    if(!category){
      if(categoryError) categoryError.style.display = 'block';
      valid = false;
    } else if(categoryError){
      categoryError.style.display = 'none';
    }

    if(!text){
      if(errorEl) errorEl.style.display = 'block';
      valid = false;
    } else if(errorEl){
      errorEl.style.display = 'none';
    }

    if(!valid) return;

    const spinner = document.querySelector('.visa-spinner');
    if(spinner) spinner.style.display = 'block';

    let msg = '*Reporte de Remeex Visa*\n';
    if(selectedActivity){
      msg += '*Actividad:* ' + selectedActivity.type + ' - ' + selectedActivity.status + '\n';
      if(selectedActivity.details) msg += '*Detalles:* ' + selectedActivity.details + '\n';
      msg += '*Fecha:* ' + new Date(selectedActivity.date).toLocaleString() + '\n';
    }
    msg += '*Tipo:* ' + category + '\n';
    msg += '*Descripcion:* ' + text + '\n';
    if(emailEl && emailEl.value.trim()) msg += '*Email:* ' + emailEl.value.trim() + '\n';
    if(fileEl && fileEl.files.length) msg += '*Adjunto:* ' + fileEl.files[0].name + ' (enviar manualmente)\n';

    const url = 'https://wa.me/+17373018059?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');

    if(spinner) spinner.style.display = 'none';
    closeReportsOverlay();
    if(typeof showToast === 'function') {
      showToast('success', 'Reporte generado', 'Se abrió WhatsApp con tu reporte.');
    }
  }

  window.setupReportsOverlay = function(){
    const grid = document.querySelector('#help-overlay .help-grid');
    if(grid){
      const item = document.createElement('div');
      item.id = 'help-report';
      item.className = 'help-item';
      item.innerHTML = '<div class="help-icon warning"><i class="fas fa-exclamation-circle"></i></div>'+
                       '<div class="help-name">Reportar problema</div>'+
                       '<div class="help-description">Crear ticket</div>';
      grid.appendChild(item);
      item.addEventListener('click', () => { openReportsOverlay(); });
    }

    const closeBtn = document.getElementById('reports-close-btn');
    if(closeBtn) closeBtn.addEventListener('click', closeReportsOverlay);
    const sendBtn = document.getElementById('send-report-btn');
    if(sendBtn) sendBtn.addEventListener('click', sendReportViaWhatsApp);

    const reportsSection = document.getElementById('reports-section');
    if(reportsSection){
      let btn = document.getElementById('open-report-from-settings');
      const container = reportsSection.querySelector('.settings-content');
      if(!btn && container){
        btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.id = 'open-report-from-settings';
        btn.textContent = 'Nuevo Reporte';
        container.insertBefore(btn, container.firstChild);
      }
      if(btn) btn.addEventListener('click', openReportsOverlay);
    }
  };
})();
