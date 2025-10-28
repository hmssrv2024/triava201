const resourcesToPreload = self.__PRECACHE_ASSETS || [];

function detectBrowser(){
  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';

  if(/firefox|fxios/i.test(ua)){
    return 'firefox';
  }

  if(/opr|opera/i.test(ua)){
    return 'opera';
  }

  if(/edg/i.test(ua)){
    return 'edge';
  }

  const isSafari = /safari/i.test(ua) && !/chrome|crios|crmo|android|edg|opr|firefox/i.test(ua);
  if(isSafari){
    return 'safari';
  }

  if(/chrome|crios|chromium/i.test(ua) && /google/i.test(vendor)){
    return 'chrome';
  }

  return 'other';
}

function ensureMeta(head, name, content){
  let meta = document.querySelector(`meta[name="${name}"]`);
  if(!meta){
    meta = document.createElement('meta');
    meta.name = name;
    head.appendChild(meta);
  }
  if(typeof content === 'string'){
    meta.content = content;
  }
  return meta;
}

function ensureLink(head, rel, attributes){
  let link = Array.from(document.querySelectorAll(`link[rel="${rel}"]`)).find(existing => {
    return Object.entries(attributes).every(([key, value]) => existing.getAttribute(key) === value);
  });

  if(!link){
    link = document.createElement('link');
    link.rel = rel;
    head.appendChild(link);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    link.setAttribute(key, value);
  });

  return link;
}

function removeSelectors(selectors){
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(node => node.remove());
  });
}

function injectPWA(){
  const head = document.head || document.getElementsByTagName('head')[0];
  const browser = detectBrowser();
  const html = document.documentElement;

  if(html){
    html.dataset.browser = browser;
    html.classList.add(`is-${browser}`);
  }

  if(!document.querySelector('link[rel="manifest"]')){
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = 'https://visa.remeexvisa.com/manifest.json';
    manifestLink.crossOrigin = 'anonymous';
    head.appendChild(manifestLink);
  }

  ensureMeta(head, 'theme-color', '#1434CB');
  ensureMeta(head, 'application-name', 'Remeex VISA');

  const isSafari = browser === 'safari';

  if(isSafari){
    ensureLink(head, 'apple-touch-icon', { href: 'visabluapple.png', sizes: '180x180' });
    ensureLink(head, 'apple-touch-icon', { href: 'icons8-visa-color-152.png', sizes: '152x152' });
    ensureLink(head, 'apple-touch-startup-image', { href: 'visabluapple.png' });
    ensureMeta(head, 'apple-mobile-web-app-capable', 'yes');
    ensureMeta(head, 'apple-mobile-web-app-status-bar-style', 'default');
    ensureMeta(head, 'apple-mobile-web-app-title', 'Remeex VISA');
  }else{
    removeSelectors([
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-startup-image"]',
      'meta[name="apple-mobile-web-app-capable"]',
      'meta[name="apple-mobile-web-app-status-bar-style"]',
      'meta[name="apple-mobile-web-app-title"]'
    ]);
  }
}

function injectLoader(){
  const style = document.createElement('style');
  style.textContent = `#page-loader{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1434CB,#051937);color:#fff;font-family:'Segoe UI',Tahoma,sans-serif;}#page-loader.hidden{opacity:0;visibility:hidden;transition:opacity .3s;}#page-loader .brand-logo{width:168px;margin-bottom:1rem;filter:brightness(0) invert(1);transform:translateY(-10px);}#page-loader .spinner{width:48px;height:48px;border:5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto;}#page-loader .progress-text{margin-top:1rem;font-size:1rem;text-shadow:0 1px 2px rgba(0,0,0,0.3);text-align:center;color:#fff;}#page-loader .progress{width:80%;height:8px;background:rgba(255,255,255,0.2);border-radius:4px;margin-top:1rem;overflow:hidden;}#page-loader .progress-bar{height:100%;width:0;background:#fff;transition:width .3s;}#page-loader .connection-warning{margin-top:.5rem;font-size:.9rem;text-shadow:0 1px 2px rgba(0,0,0,0.3);text-align:center;color:#fff;}@keyframes spin{to{transform:rotate(360deg);}}`;
  document.head.appendChild(style);
  const loader = document.createElement('div');
  loader.id = 'page-loader';
  loader.innerHTML = '<img class="brand-logo" src="remeexvisa2025_blanco.png" alt="Visa Logo"><div class="spinner"></div><p class="progress-text">Cargando... 0%</p><div class="progress"><div class="progress-bar"></div></div><p class="connection-warning">Tu conexión a internet es muy débil...</p>';
  document.body.appendChild(loader);
  const weakConnectionAudio = new Audio('audioguia.ogg/b14_cargando_tu_conexion_es_debil.ogg');
  const disableWeakConnectionAudio = () => {
    loader.removeEventListener('click', playWeakConnectionAudio);
    loader.removeEventListener('touchstart', playWeakConnectionAudio);
  };
  const playWeakConnectionAudio = () => {
    weakConnectionAudio.currentTime = 0;
    weakConnectionAudio.play().catch(disableWeakConnectionAudio);
  };
  loader.addEventListener('click', playWeakConnectionAudio);
  loader.addEventListener('touchstart', playWeakConnectionAudio);
  weakConnectionAudio.addEventListener('error', disableWeakConnectionAudio);
  const bar = loader.querySelector('.progress-bar');
  const text = loader.querySelector('.progress-text');
  loader.updateProgress = (percent)=>{
    bar.style.width = percent + '%';
    text.textContent = `Cargando... ${percent}%`;
  };
  return loader;
}

async function cacheResource(cache, url, attempt = 1) {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (response.ok) {
      await cache.put(url, response.clone());
      return true;
    }
  } catch (e) {
    if (attempt < 3) {
      return cacheResource(cache, url, attempt + 1);
    }
  }
  return false;
}

async function preloadResources(loader) {
  if (!('caches' in window)) return;
  const cache = await caches.open('precache-v1');
  let loaded = 0;
  for (const url of resourcesToPreload) {
    await cacheResource(cache, url);
    loaded++;
    const percent = Math.round((loaded / resourcesToPreload.length) * 100);
    if (loader && typeof loader.updateProgress === 'function') {
      loader.updateProgress(percent);
    }
  }
}

function lazyLoadImages(){
  document.querySelectorAll('img:not([loading])').forEach(img=>{
    img.setAttribute('loading','lazy');
  });
}

injectPWA();
document.addEventListener('DOMContentLoaded', lazyLoadImages);

async function initPreload() {
  const loader = injectLoader();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        if ('sync' in reg) {
          reg.sync.register('sync-datos').catch(() => {});
        }
        if ('periodicSync' in reg) {
          reg.periodicSync
            .register('actualizacion-app', { minInterval: 24 * 60 * 60 * 1000 })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }
  await preloadResources(loader);
  loader.classList.add('hidden');
  setTimeout(() => loader.remove(), 300);
}

window.initPreload = initPreload;

const VAPID_PUBLIC_KEY = 'BF_PCjGHa-lLDUDscV2Fmp9ciIfUPu6NDF2KgZzkCmujAHObRSgJjA0zGKKHdHJ3oNHEfc_wFvdT81jb05oYlX0';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function solicitarMensajesImportantes() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'default') {
    const aceptar = confirm('¿Quieres recibir mensajes importantes sobre tu cuenta?');
    if (!aceptar) return false;
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return false;
  }
  if (Notification.permission !== 'granted') return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function enviarMensajeImportante() {
  await fetch('/api/notify', { method: 'POST' });
}

window.solicitarMensajesImportantes = solicitarMensajesImportantes;
window.enviarMensajeImportante = enviarMensajeImportante;

// Prefetch de rutas probables cuando el usuario permanece en una sección
function prefetchLink(url) {
  if (document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  if (/\.js$/.test(url)) link.as = 'script';
  else if (/\.css$/.test(url)) link.as = 'style';
  else link.as = 'document';
  document.head.appendChild(link);
}

function setupSectionPrefetch() {
  if (!('IntersectionObserver' in window)) return;
  document.querySelectorAll('section').forEach(section => {
    let timer;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            section.querySelectorAll('a[href]').forEach(a => {
              const href = a.getAttribute('href');
              if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
              prefetchLink(href);
            });
          }, 2000);
        } else {
          clearTimeout(timer);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(section);
  });
}

// Prefetch para SPA tras la primera interacción del usuario
function setupSPAPrefetch() {
  let triggered = false;
  const run = () => {
    if (triggered) return;
    triggered = true;
    import(/* webpackPrefetch: true */ '/spa.js').catch(() => {});
  };
  ['mousemove', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, run, { once: true });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSectionPrefetch();
  setupSPAPrefetch();
});

// Ajusta el espacio superior cuando se usa window-controls-overlay
if ('windowControlsOverlay' in navigator) {
  const actualizarOverlay = () => {
    const rect = navigator.windowControlsOverlay?.titlebarAreaRect;
    const height = typeof rect?.height === 'number' ? rect.height : 0;
    document.body.style.paddingTop = height + 'px';
  };
  actualizarOverlay();
  navigator.windowControlsOverlay.addEventListener('geometrychange', actualizarOverlay);
}

// Manejo básico de archivos abiertos con file_handlers
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async params => {
    if (!params.files.length) return;
    const file = await params.files[0].getFile();
    console.log('Archivo recibido:', file.name);
  });
}
