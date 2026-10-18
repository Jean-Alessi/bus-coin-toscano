// "Instalá la app": ofrece agregar Bus Coin a la pantalla de inicio del
// celular. En Android/Chrome se puede disparar el instalador nativo
// (evento beforeinstallprompt, que exige un service worker registrado);
// en iPhone (Safari) esa API no existe, así que se muestran los pasos
// manuales (compartir > agregar a inicio). Se puede cerrar y no vuelve a
// insistir (se guarda en este celular).

let pwaDeferredPrompt = null;
let pwaPromptListo = false;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  pwaDeferredPrompt = e;
  pwaPromptListo = true;
  if(document.getElementById('view-home')?.classList.contains('active')) renderHome();
});

window.addEventListener('appinstalled', () => {
  pwaDeferredPrompt = null;
  localStorage.setItem('pwa-instalar-oculto', 'si');
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

function pwaYaInstalada(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function pwaEsIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function pwaOcultarAviso(){
  localStorage.setItem('pwa-instalar-oculto', 'si');
  renderHome();
}

function pwaInstalar(){
  if(!pwaDeferredPrompt) return;
  pwaDeferredPrompt.prompt();
  pwaDeferredPrompt.userChoice.finally(() => { pwaDeferredPrompt = null; });
}

function pwaInstalarHTML(){
  if(pwaYaInstalada() || localStorage.getItem('pwa-instalar-oculto') === 'si') return '';

  if(pwaPromptListo){
    return `
      <div class="card" onclick="pwaInstalar()">
        <div class="icon">📲</div>
        <div class="txt"><h3>Instalá Bus Coin</h3><p>Tocá para sumarla a tu pantalla de inicio</p></div>
      </div>
      <p class="link-chico" onclick="pwaOcultarAviso()">Ahora no</p>`;
  }

  if(pwaEsIOS()){
    return `
      <div class="card">
        <div class="icon">📲</div>
        <div class="txt"><h3>Instalá Bus Coin</h3><p>Tocá compartir (⬆️) y elegí "Agregar a inicio"</p></div>
      </div>
      <p class="link-chico" onclick="pwaOcultarAviso()">Ahora no</p>`;
  }

  // Chrome/Android no siempre dispara "beforeinstallprompt" enseguida (pide
  // algo de interacción previa con el sitio, que en un viaje de micro puede
  // no llegar a darse), así que mientras tanto se deja igual el paso a paso
  // manual — el menú del navegador siempre puede instalar si la app cumple
  // los requisitos, aunque el cartel automático no haya aparecido.
  return `
    <div class="card">
      <div class="icon">📲</div>
      <div class="txt"><h3>Instalá Bus Coin</h3><p>Menú ⋮ del navegador → "Instalar aplicación" (o "Agregar a pantalla de inicio")</p></div>
    </div>
    <p class="link-chico" onclick="pwaOcultarAviso()">Ahora no</p>`;
}


// ---- Versión nueva (sin carteles) ----
// Si la app quedó abierta o guardada con una versión vieja, se actualiza sola: al abrirla, cada minuto y medio
// y al volver a ella. Para no cortar nada importante, solo recarga cuando estás en una pantalla de
// navegación (Inicio, Estación, mapas, Ranking, etc.), no adentro de un juego, y como mucho una vez cada
// 10 minutos (así nunca entra en bucle). Compara los scripts y estilos con "?v=N" de esta página con los del
// index.html del servidor (pedido sin usar la copia guardada). window.APP_VERSION es un número que cambia
// con cada versión (se ve al pie de la Estación).
(function(){
  const huella = nodos => Array.from(nodos).map(n => n.getAttribute('src') || n.getAttribute('href') || '').filter(x => /\?v=\d+/.test(x)).sort().join('|');
  const mia = huella(document.querySelectorAll('script[src], link[rel="stylesheet"]'));
  window.APP_VERSION = (mia.match(/\?v=\d+/g) || []).reduce((s, x) => s + parseInt(x.slice(3), 10), 0);
  const ahora = () => Date.now();
  const leer = k => { try { return Number(sessionStorage.getItem(k) || 0); } catch(e){ return 0; } };
  const guardar = k => { try { sessionStorage.setItem(k, String(ahora())); } catch(e){} };
  const SEGURAS = ['home', 'estacion', 'plaza', 'juegos', 'ranking', 'tienda', 'comercios', 'avatar'];
  async function hayNueva(){
    if(!navigator.onLine) return false;
    try {
      const r = await fetch(location.pathname.replace(/[^/]*$/, '') + 'index.html?_=' + ahora(), { cache: 'no-store' });
      if(!r.ok) return false;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      const server = huella(doc.querySelectorAll('script[src], link[rel="stylesheet"]'));
      return !!server && server !== mia;
    } catch(e){ return false; }
  }
  async function revisar(alAbrir){
    if(ahora() - leer('auto-recarga') < 10 * 60 * 1000) return; // como mucho una vez cada 10 minutos
    if(!(await hayNueva())) return;
    const v = document.querySelector('.view.active');
    const id = v ? v.id.replace('view-', '') : '';
    if(alAbrir === true || SEGURAS.includes(id)){ guardar('auto-recarga'); location.reload(); }
  }
  window.addEventListener('load', () => setTimeout(() => revisar(true), 2500));
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') revisar(); });
  setInterval(revisar, 90000);
  window.pwaRevisarVersion = revisar;
})();
