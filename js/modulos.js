// Carga por partes: cada juego o pantalla grande se descarga recién cuando alguien la abre (antes se bajaban los 79 archivos al abrir la app).
// Es la etapa 2 de la división de la app (ver DIVISION.md). Acá está TODO lo que hay que tocar para sumar o mover un archivo:
//   - MODULOS: nombre -> { f: archivos (en orden de carga, con su ?v=N), n: módulos que necesita }
//   - VISTAS: qué módulo hay que tener cargado antes de abrir cada pantalla
//   - FUNCIONES: funciones que se llaman desde botones fijos del HTML o desde otros paneles; si su módulo no cargó, lo cargan y la llaman
// Lo que NO está acá se carga siempre con la app (index.html): firebase, marca, agencias, iconos, escenas, sonido, nucleo, puntos, cursos, avatar, mundo, app...
// Al cambiar un archivo de un módulo, subir su ?v=N acá (no en index.html).

const MODULOS = {
  trivia: { f: ['trivia.js?v=79'] },
  acertijos: { f: ['acertijos.js?v=76'] },
  pensamiento: { f: ['pensamiento.js?v=76'], n: ['acertijos'] },
  cuatrouno: { f: ['cuatrouno.js?v=76'], n: ['acertijos'] },
  ahorcado: { f: ['ahorcado.js?v=76'] },
  valija: { f: ['valija.js?v=77'] },
  memoria: { f: ['memoria.js?v=5'] },
  sudoku: { f: ['sudoku.js?v=3'] },
  patrones: { f: ['patrones.js?v=2'] },
  sopa: { f: ['sopa.js?v=4'] },
  cartasfr: { f: ['cartasfr.js?v=3'] },
  solitario: { f: ['solitario.js?v=1'], n: ['cartasfr'] },
  categorias: { f: ['categorias.js?v=3'], n: ['cartasfr'] },
  poker: { f: ['pokerlib.js?v=1'], n: ['cartasfr'] },
  videopoker: { f: ['videopoker.js?v=2'], n: ['poker'] },
  texas: { f: ['texaslogica.js?v=2', 'texas.js?v=3'], n: ['poker'] },
  arcade: { f: ['arcade.js?v=8', 'arcade2.js?v=3', 'arcade3.js?v=11', 'arcade4.js?v=3'] },
  bingo: { f: ['bingo.js?v=78'] },
  tutifruti: { f: ['tutifruti.js?v=76'], n: ['acertijos'] },
  palabras: { f: ['palabras.js?v=1'] },
  impostor: { f: ['impostor.js?v=12'], n: ['palabras'] },
  dibujar: { f: ['dibujar.js?v=7'], n: ['palabras'] },
  cuento: { f: ['cuento.js?v=4'] },
  triviaVivo: { f: ['triviaVivo.js?v=1'], n: ['trivia'] },
  escoba: { f: ['escoba.js?v=12'] },
  chinchon: { f: ['chinchon.js?v=8'] },
  buscolor: { f: ['buscolor.js?v=7'] },
  copa: { f: ['truco.js?v=9', 'copa.js?v=2'], n: ['trivia'] },
  comercios: { f: ['comercios.js?v=11', 'flyers.js?v=1'] },
  vidriera: { f: ['vidriera.js?v=1'], n: ['comercios'] },
  tienda: { f: ['tienda.js?v=76'] },
  plaza: { f: ['plaza.js?v=26', 'feria.js?v=10', 'sectores.js?v=9', 'estacion.js?v=6', 'mesas.js?v=1', 'tunel.js?v=1', 'boliche.js?v=9', 'seleccion.js?v=4', 'micro.js?v=7', 'cartitas.js?v=2'] },
  padel: { f: ['padellogica.js?v=1', 'padelbus.js?v=2'], n: ['plaza'] },
  escape: { f: ['escapesonido.js?v=8', 'escape.js?v=11', 'escape1.js?v=3', 'escapelib.js?v=1', 'escape2.js?v=1', 'escape3.js?v=1', 'escape4.js?v=1', 'escape5.js?v=1'] },
  plaza3d: { f: ['plaza3dmod.js?v=3', 'plaza3d.js?v=12'], n: ['plaza'] },
  admin: { f: ['pedidos.js?v=2'], n: ['comercios', 'vidriera', 'copa', 'plaza'] },
};

const MODULOS_VISTAS = { 'comercios': 'comercios', 'trivia': 'trivia', 'acertijos': 'acertijos', 'pensamiento': 'pensamiento', 'ahorcado': 'ahorcado', 'cuatrouno': 'cuatrouno', 'valija': 'valija', 'memoria': 'memoria', 'corredor': 'arcade', 'vuelo': 'arcade', 'serpiente': 'arcade', 'tetris': 'arcade', 'ladrillos': 'arcade', 'parking': 'arcade', 'laberinto': 'arcade', 'tanque': 'arcade', 'pinball': 'arcade', 'bombas': 'arcade', 'plataformas': 'arcade', 'solitario': 'solitario', 'videopoker': 'videopoker', 'texas': 'texas', 'estacion': 'plaza', 'plaza': 'plaza', 'categorias': 'categorias', 'sudoku': 'sudoku', 'patrones': 'patrones', 'sopa': 'sopa', 'tutifruti': 'tutifruti', 'impostor': 'impostor', 'bingo': 'bingo', 'triviavivo': 'triviaVivo', 'cuento': 'cuento', 'dibujar': 'dibujar', 'escoba': 'escoba', 'chinchon': 'chinchon', 'vidriera': 'vidriera', 'copa': 'copa', 'truco': 'copa', 'buscolor': 'buscolor', 'busqueda': 'escape', 'escape': 'escape', 'padel': 'padel', 'tienda': 'tienda' };

const MODULOS_FUNCIONES = { mostrarAdminComercios: 'comercios', mostrarAdminVidriera: 'vidriera', adminToggleFeria: 'plaza', adminToggleCopa: 'copa', adminCambiarPueblo: 'vidriera', pedidosToggle: 'admin', plazaAlternar3D: 'plaza3d' };

const modulosHechos = new Set();      // módulos ya cargados
const modulosEnCurso = {};            // módulo -> promesa
const modulosArchivosCargados = new Set();
let modulosTurno = 0, modulosTimerCargando = 0;

function modulosListo(nombre){ return modulosHechos.has(nombre); }

// Archivos (en orden, sin repetir) que hacen falta para tener estos módulos, con sus dependencias primero.
function modulosArchivosDe(nombres, vistos){
  vistos = vistos || new Set(); const out = [];
  (Array.isArray(nombres) ? nombres : [nombres]).forEach(n => {
    if(vistos.has(n)) return; vistos.add(n);
    const m = MODULOS[n]; if(!m) throw new Error('Módulo desconocido: ' + n);
    (m.n || []).forEach(d => modulosArchivosDe(d, vistos).forEach(f => out.push(f)));
    m.f.forEach(f => out.push(f));
  });
  return out;
}

function modulosScript(archivo){
  return new Promise((ok, mal) => {
    if(modulosArchivosCargados.has(archivo)) return ok();
    const s = document.createElement('script');
    s.src = 'js/' + archivo;
    s.onload = () => { modulosArchivosCargados.add(archivo); ok(); };
    s.onerror = () => { s.remove(); mal(new Error('No se pudo cargar ' + archivo)); };
    document.head.appendChild(s);
  });
}

// Carga uno o varios módulos (con lo que necesitan). Devuelve una promesa.
function modulosCargar(nombres){
  return Promise.all((Array.isArray(nombres) ? nombres : [nombres]).map(modulosCargarUno));
}
function modulosCargarUno(nombre){
  const m = MODULOS[nombre]; if(!m) return Promise.reject(new Error('Módulo desconocido: ' + nombre));
  if(modulosHechos.has(nombre)) return Promise.resolve();
  if(modulosEnCurso[nombre]) return modulosEnCurso[nombre];
  modulosEnCurso[nombre] = (async () => {
    for(const d of (m.n || [])) await modulosCargarUno(d);
    for(const f of m.f) await modulosScript(f);
    modulosHechos.add(nombre);
  })().finally(() => { delete modulosEnCurso[nombre]; });
  return modulosEnCurso[nombre];
}

function modulosMostrarCargando(si){
  let el = document.getElementById('cargando-modulo');
  if(!el && si){ el = document.createElement('div'); el.id = 'cargando-modulo'; el.className = 'cargando-modulo'; el.innerHTML = '<span>🚌</span> Cargando…'; document.body.appendChild(el); }
  if(el) el.classList.toggle('show', !!si);
}

// Abre una pantalla: si su módulo ya está, sigue en el momento (igual que antes); si no, lo descarga y recién entonces sigue.
// Si mientras tanto la persona tocó otra cosa, la pantalla vieja se descarta.
function modulosParaVista(vista, siguiente){
  const mod = MODULOS_VISTAS[vista];
  if(!mod || modulosHechos.has(mod)) return siguiente();
  const turno = ++modulosTurno;
  clearTimeout(modulosTimerCargando); modulosTimerCargando = setTimeout(() => modulosMostrarCargando(true), 250);
  return modulosCargar(mod).then(() => {
    clearTimeout(modulosTimerCargando); modulosMostrarCargando(false);
    if(turno === modulosTurno) return siguiente();
  }).catch(err => {
    clearTimeout(modulosTimerCargando); modulosMostrarCargando(false);
    console.error(err);
    if(typeof mostrarToast === 'function') mostrarToast('No se pudo cargar esta parte. Revisá tu conexión y probá de nuevo.');
  });
}

// Después de mostrar el inicio, con el celular tranquilo, se bajan en segundo plano las partes que aportan tarjetas o avisos al inicio y a la lista de
// juegos (la Vidriera del día y los desafíos de la Copa). Así aparecen solas sin que nadie espere. Con ahorro de datos o conexión 2G no se hace.
let modulosOciosoPedido = false;
function modulosPrecargarDeInicio(){
  if(modulosOciosoPedido) return; modulosOciosoPedido = true;
  const c = navigator.connection;
  if(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
  const ir = () => modulosCargar(['vidriera', 'copa']).then(() => {
    if(document.querySelector('#view-home.active') && typeof renderHome === 'function') renderHome();
    else if(document.querySelector('#view-juegos.active') && typeof renderJuegos === 'function') renderJuegos();
  }).catch(() => {});
  (window.requestIdleCallback || (f => setTimeout(f, 2500)))(ir, { timeout: 6000 });
}

// Funciones "de entrada": se pueden llamar antes de que cargue su módulo.
Object.keys(MODULOS_FUNCIONES).forEach(nombre => {
  const puente = function(...args){
    return modulosCargar(MODULOS_FUNCIONES[nombre]).then(() => (typeof window[nombre] === 'function' && window[nombre] !== puente) ? window[nombre](...args) : undefined);
  };
  if(typeof window[nombre] !== 'function') window[nombre] = puente;
});

// Cuando la app se abre desde un QR de un comercio (?canjear=1) o de un cupón (?cupon=1), el arranque necesita ese módulo ya: se escribe antes de que siga la página.
(function(){
  const q = new URLSearchParams(location.search), pre = [];
  if(q.get('canjear') === '1') pre.push('comercios');
  if(q.get('cupon') === '1') pre.push('vidriera');
  if(!pre.length) return;
  modulosArchivosDe(pre).forEach(f => { document.write('<script src="js/' + f + '"><\/script>'); modulosArchivosCargados.add(f); });
  pre.forEach(n => modulosHechos.add(n));
  (function marcar(ns){ ns.forEach(n => { modulosHechos.add(n); marcar(MODULOS[n].n || []); }); })(pre);
})();
