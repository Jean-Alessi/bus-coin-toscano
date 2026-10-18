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


// ---- Aviso de versión nueva ----
// Si la app quedó abierta (o instalada) con una versión vieja, avisa y deja actualizar con un
// toque. Compara los scripts y estilos con "?v=N" de esta página con los del index.html del
// servidor (que se pide sin usar la copia guardada). Revisa al abrir, al volver a la app y cada 3 minutos.
(function(){
  const huella = nodos => Array.from(nodos).map(n => n.getAttribute('src') || n.getAttribute('href') || '').filter(x => /\?v=\d+/.test(x)).sort().join('|');
  const mia = huella(document.querySelectorAll('script[src], link[rel="stylesheet"]'));
  let avisado = false;
  async function revisar(){
    if(avisado || !navigator.onLine) return;
    try {
      const r = await fetch(location.pathname.replace(/[^/]*$/, '') + 'index.html?_=' + Date.now(), { cache: 'no-store' });
      if(!r.ok) return;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      const server = huella(doc.querySelectorAll('script[src], link[rel="stylesheet"]'));
      if(server && server !== mia) mostrar();
    } catch(e){}
  }
  function mostrar(){
    avisado = true;
    const b = document.createElement('div');
    b.className = 'nueva-version';
    b.innerHTML = '🔄 Hay una versión nueva <button type="button">Actualizar</button>';
    b.querySelector('button').onclick = () => location.reload();
    (document.querySelector('.screen') || document.body).appendChild(b);
  }
  window.addEventListener('load', () => setTimeout(revisar, 2500));
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') revisar(); });
  setInterval(revisar, 180000);
  window.pwaRevisarVersion = revisar;
})();
