// Bandeja de pedidos del viaje: un solo lugar donde el coordinador / organizador ve
// todo lo que piden los pasajeros desde la plaza y lo va marcando como atendido.
//   🍬 Kiosco (pedidos/{asiento})        → "Entregado"
//   💊 Farmacia (farmacia/{asiento})     → "Atendido"   (las urgentes salen primero)
//   🧑‍✈️ Coordinador (servicios/{asiento}) → "Atendido"
//   🎂 Cumpleaños (cumples/{asiento})    → "Avisado"
//   ✈️ Agencia (consultas/{asiento})     → "Contactado"
// Se abre con el botón 📥 de cada viaje en el panel del organizador.

const PED_TIPOS = {
  reportes:  { carpeta: 'cartitasReportes', emoji: '🚩', nombre: 'Reportes', hecho: 'revisado', pendiente: 'nuevo', boton: 'Revisado' },
  farmacia:  { carpeta: 'farmacia',  emoji: '💊', nombre: 'Farmacia',     hecho: 'atendido',  pendiente: 'pendiente', boton: 'Atendido' },
  servicios: { carpeta: 'servicios', emoji: '🧑‍✈️', nombre: 'Coordinador',  hecho: 'atendido',  pendiente: 'pendiente', boton: 'Atendido' },
  pedidos:   { carpeta: 'pedidos',   emoji: '🍬', nombre: 'Kiosco',       hecho: 'entregado', pendiente: 'pendiente', boton: 'Entregado' },
  cumples:   { carpeta: 'cumples',   emoji: '🎂', nombre: 'Cumpleaños',   hecho: 'avisado',   pendiente: 'nuevo',     boton: 'Avisado' },
  consultas: { carpeta: 'consultas', emoji: '✈️', nombre: 'Agencia',      hecho: 'contactado', pendiente: 'nueva',    boton: 'Contactado' },
};
const PED_ORDEN = ['reportes', 'farmacia', 'servicios', 'pedidos', 'cumples', 'consultas'];

let pedidosAbiertoPara = null;
let pedidosDatos = {};     // viaje → { farmacia:{}, servicios:{}, ... }
let pedidosOyentes = [];   // listeners activos del viaje abierto
let pedidosFiltro = 'todos';

const pedEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pedidosCortar(){
  pedidosOyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  pedidosOyentes = []; pedidosDatos = {};
}

// Escucha los pedidos de hasta 8 viajes a la vez para poder mostrar el numerito en el
// botón 📥 aunque la bandeja esté cerrada. Se vuelve a llamar cada vez que se dibuja
// la lista de viajes; los que ya no están se sueltan.
function pedidosVigilar(codigos){
  const quedan = (codigos || []).slice(0, 8);
  pedidosOyentes.filter(o => !quedan.includes(o.viaje)).forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  pedidosOyentes = pedidosOyentes.filter(o => quedan.includes(o.viaje));
  quedan.forEach(viaje => {
    if(pedidosOyentes.some(o => o.viaje === viaje)) return;
    const d = pedidosDatos[viaje] = {};
    PED_ORDEN.forEach(t => {
      const r = db.ref('salas/' + viaje + '/' + PED_TIPOS[t].carpeta);
      const cb = r.on('value', s => { const nuevo = s.val() || {}; pedidosDetectarNuevos(viaje, t, nuevo); d[t] = nuevo; pedidosRefrescar(viaje); });
      pedidosOyentes.push({ viaje, r, cb });
    });
  });
}

// Cantidad de pedidos sin atender de un viaje (para el numerito del botón).
function pedidosPendientes(viaje){
  const d = pedidosDatos[viaje] || {};
  let n = 0;
  PED_ORDEN.forEach(t => Object.keys(d[t] || {}).forEach(a => { if((d[t][a] || {}).estado === PED_TIPOS[t].pendiente) n++; }));
  return n;
}

// Lista plana de todos los pedidos, urgentes primero y luego los más viejos.
function pedidosLista(viaje){
  const d = pedidosDatos[viaje] || {}, lista = [];
  PED_ORDEN.forEach(t => Object.keys(d[t] || {}).forEach(a => {
    const x = d[t][a] || {};
    lista.push({ tipo: t, asiento: a, x, hecho: x.estado === PED_TIPOS[t].hecho, urgente: !!x.urgente && x.estado === PED_TIPOS[t].pendiente, t: Number(x.t) || 0 });
  }));
  return lista.sort((p, q) => (p.hecho - q.hecho) || (q.urgente - p.urgente) || (p.t - q.t));
}

function pedidosToggle(viaje){
  pedidosAbiertoPara = pedidosAbiertoPara === viaje ? null : viaje;
  pedidosFiltro = 'todos';
  renderAdminViajes();
}

// Redibuja solo la bandeja (no toda la pantalla) cuando llega un pedido nuevo.
function pedidosRefrescar(viaje){
  const el = document.getElementById('pedidos-' + viaje);
  if(el) el.outerHTML = pedidosPanelHTML(viaje, true);
  const b = document.getElementById('pedidos-num-' + viaje);
  if(b){ const n = pedidosPendientes(viaje); b.textContent = n ? ' ' + n : ''; }
}

function pedidosFiltrar(viaje, f){ pedidosFiltro = f; pedidosRefrescar(viaje); }

function pedidosMarcar(viaje, tipo, asiento){
  const t = PED_TIPOS[tipo];
  if(!t) return;
  db.ref('salas/' + viaje + '/' + t.carpeta + '/' + asiento).update({ estado: t.hecho, tHecho: firebase.database.ServerValue.TIMESTAMP });
}

function pedidosLimpiarHechos(viaje){
  if(typeof confirm === 'function' && !confirm('¿Borrar de la bandeja los pedidos ya atendidos?')) return;
  const d = pedidosDatos[viaje] || {}, u = {};
  PED_ORDEN.forEach(t => Object.keys(d[t] || {}).forEach(a => {
    if((d[t][a] || {}).estado === PED_TIPOS[t].hecho && t !== 'cumples') u[PED_TIPOS[t].carpeta + '/' + a] = null;
  }));
  if(!Object.keys(u).length){ mostrarToast('No hay nada para limpiar'); return; }
  db.ref('salas/' + viaje).update(u).then(() => mostrarToast('Bandeja limpia'));
}

function pedidosDetalle(p){
  const x = p.x;
  if(p.tipo === 'farmacia') return (x.urgente ? '🚨 ' : '') + pedEsc(x.motivo);
  if(p.tipo === 'servicios') return pedEsc(x.tipo);
  if(p.tipo === 'pedidos') return 'Quiere: ' + pedEsc(x.item);
  if(p.tipo === 'cumples') return '¡Cumple años hoy!';
  if(p.tipo === 'reportes') return '🚩 ' + pedEsc(x.paraN) + ' (asiento ' + pedEsc(x.para) + ') avisó por una cartita de ' + pedEsc(x.n) + ' (asiento ' + pedEsc(x.de) + ')';
  return pedEsc(x.promo) + (Number(x.off) ? ' (' + Number(x.off) + '% off)' : '') + ' · cupón ' + pedEsc(x.cupon);
}

function pedidosHora(ms){
  if(!ms) return '';
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function pedidosPanelHTML(viaje, siempre){
  if(!siempre && pedidosAbiertoPara !== viaje) return '';
  if(pedidosAbiertoPara !== viaje) return `<div id="pedidos-${viaje}"></div>`;
  const todos = pedidosLista(viaje);
  const cuenta = t => todos.filter(p => p.tipo === t && !p.hecho).length;
  const lista = todos.filter(p => pedidosFiltro === 'todos' || p.tipo === pedidosFiltro);
  const pendientes = todos.filter(p => !p.hecho).length;
  const chip = (id, txt, n) => `<button class="ped-chip ${pedidosFiltro === id ? 'on' : ''}" onclick="pedidosFiltrar('${viaje}','${id}')">${txt}${n ? ' <b>' + n + '</b>' : ''}</button>`;
  return `<div class="ped-panel" id="pedidos-${viaje}">
    <div class="ped-titulo">📥 Pedidos del viaje <small>${pendientes ? pendientes + ' sin atender' : 'todo al día ✅'}</small></div>
    <div class="ped-chips">${chip('todos', 'Todos', pendientes)}${PED_ORDEN.map(t => chip(t, PED_TIPOS[t].emoji + ' ' + PED_TIPOS[t].nombre, cuenta(t))).join('')}</div>
    <div class="ped-lista">${lista.length ? lista.map(p => `
      <div class="ped-fila ${p.hecho ? 'ped-hecho' : ''} ${p.urgente ? 'ped-urgente' : ''}">
        <div class="ped-emoji">${PED_TIPOS[p.tipo].emoji}</div>
        <div class="ped-txt"><b>${pedEsc(p.x.n || 'Pasajero')}</b> <small>asiento ${pedEsc(p.tipo === 'reportes' ? p.x.de : p.asiento)} · ${pedidosHora(p.t)}</small><div>${pedidosDetalle(p)}</div></div>
        ${p.hecho ? '<span class="ped-ok">✓</span>' : `<button class="fer-mini" onclick="pedidosMarcar('${viaje}','${p.tipo}','${pedEsc(p.asiento)}')">${PED_TIPOS[p.tipo].boton}</button>`}
      </div>`).join('') : '<div class="fer-vacio">No hay pedidos todavía. Cuando un pasajero pida algo en la plaza, aparece acá.</div>'}</div>
    <div class="fer-botones-admin"><button class="fer-mini" onclick="pedidosLimpiarHechos('${viaje}')">🧹 Limpiar atendidos</button></div>
  </div>`;
}

// ---- Avisos al coordinador: suena, vibra y avisa cuando entra un pedido nuevo ----
// Anda mientras la app está abierta en este celular (el panel de viajes escucha los pedidos). Se prende con el botón 🔔 del panel.
// Sin servidor: si el celular está bloqueado o la app cerrada, el sistema la pausa y el aviso puede no llegar (para eso, el WhatsApp).
let pedidosConocidos = {};          // 'viaje|tipo' → asientos pendientes ya vistos (la primera lectura no avisa)
let pedidosWakeLock = null, pedidosTitulo = '', pedidosTituloTimer = 0;
function pedidosAvisosActivos(){ try { return localStorage.getItem('avisos-pedidos') === 'si'; } catch(e){ return false; } }

function pedidosDetectarNuevos(viaje, tipo, datos){
  const pend = PED_TIPOS[tipo].pendiente, clave = viaje + '|' + tipo;
  const ahora = Object.keys(datos).filter(a => (datos[a] || {}).estado === pend);
  const antes = pedidosConocidos[clave];
  pedidosConocidos[clave] = new Set(ahora);
  if(!antes) return;
  const nuevos = ahora.filter(a => !antes.has(a)).map(a => ({ tipo, asiento: a, x: datos[a] || {} }));
  if(nuevos.length && pedidosAvisosActivos()) pedidosAvisar(viaje, nuevos);
}

function pedidosSonar(urgente){
  try {
    if(!sonidoAudioCtx) sonidoAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sonidoAudioCtx; if(ctx.state === 'suspended') ctx.resume();
    (urgente ? [988, 784, 988, 784, 988] : [784, 988, 1175]).forEach((f, i) => {
      const t0 = ctx.currentTime + i * 0.24, osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = f; osc.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.35, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.start(t0); osc.stop(t0 + 0.23);
    });
  } catch(e){}
}

function pedidosAvisar(viaje, nuevos){
  const urgente = nuevos.some(n => n.x.urgente), n0 = nuevos[0], t = PED_TIPOS[n0.tipo];
  const texto = t.emoji + ' ' + (n0.x.n || 'Asiento ' + n0.asiento) + ' (asiento ' + n0.asiento + '): ' + (n0.x.item || n0.x.tipo || n0.x.motivo || t.nombre) + (nuevos.length > 1 ? ' y ' + (nuevos.length - 1) + ' más' : '');
  pedidosSonar(urgente);
  try { if(navigator.vibrate) navigator.vibrate(urgente ? [500, 200, 500, 200, 500] : [300, 150, 300]); } catch(e){}
  if(typeof mostrarToast === 'function') mostrarToast('📥 ' + (urgente ? '🚨 URGENTE · ' : '') + viaje + ' · ' + texto);
  // título de la pestaña parpadeando hasta que se vuelva a mirar
  if(!pedidosTituloTimer){
    pedidosTitulo = document.title; let k = 0;
    pedidosTituloTimer = setInterval(() => { document.title = (k++ % 2 ? pedidosTitulo : '📥 ¡Pedido nuevo!'); if(!document.hidden && k > 6){ clearInterval(pedidosTituloTimer); pedidosTituloTimer = 0; document.title = pedidosTitulo; } }, 900);
  }
  // si la app está en segundo plano pero viva, también como notificación del celular
  try {
    if('Notification' in window && Notification.permission === 'granted' && document.hidden){
      const op = { body: texto, icon: 'icons/icon-192.png', tag: 'pedido', renotify: true, vibrate: [300, 150, 300] };
      if(navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification('📥 Pedido nuevo', op)); else new Notification('📥 Pedido nuevo', op);
    }
  } catch(e){}
}

async function pedidosPedirPantalla(){
  try { if('wakeLock' in navigator && !pedidosWakeLock){ pedidosWakeLock = await navigator.wakeLock.request('screen'); pedidosWakeLock.addEventListener('release', () => { pedidosWakeLock = null; }); } } catch(e){}
}
document.addEventListener('visibilitychange', () => { if(!document.hidden && pedidosAvisosActivos()) pedidosPedirPantalla(); });
if(pedidosAvisosActivos()) pedidosPedirPantalla();

// Botón 🔔 del panel: prende o apaga los avisos de este celular. Al prenderlos hace sonar una prueba (el navegador exige un toque para dejar sonar).
function pedidosAvisosToggle(){
  if(pedidosAvisosActivos()){
    try { localStorage.setItem('avisos-pedidos', 'no'); } catch(e){}
    if(pedidosWakeLock){ try { pedidosWakeLock.release(); } catch(e){} pedidosWakeLock = null; }
    mostrarToast('Avisos de pedidos apagados');
  } else {
    try { localStorage.setItem('avisos-pedidos', 'si'); } catch(e){}
    pedidosSonar(false); try { if(navigator.vibrate) navigator.vibrate(200); } catch(e){}
    try { if('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch(e){}
    pedidosPedirPantalla();
    mostrarToast('🔔 Avisos activados: suena y vibra con cada pedido. Dejá la app abierta y la pantalla prendida.');
  }
  if(typeof renderAdminViajes === 'function') renderAdminViajes();
}
