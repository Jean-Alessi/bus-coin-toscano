// Padelbus: pádel de a 2 (1 contra 1) o de a 4 (2 contra 2) entre pasajeros del mismo viaje, o contra el
// entrenador (bots) para practicar. Las reglas y la física están en padellogica.js; acá está la pantalla, las
// mesas (se arman igual que las de BusColor) y la conexión.
//
// Cómo se conecta: el que arma la mesa es el anfitrión y corre el partido en su celular. Cada jugador mueve
// su propia paleta y manda su posición (salas/{viaje}/padel/vivo/{mesa}/ent/{asiento}); el anfitrión manda a
// todos el estado (…/vivo/{mesa}/estado) unas 12 veces por segundo. Si un jugador se desconecta, un entrenador
// ocupa su lugar. Los lugares vacíos se pueden completar con entrenadores.

const PAD = { CW: 280, CH: 500, OX: 20, OY: 30 };
const PAD_BOTS = [{ n: 'Profe', a: PLZ_BOTS[5].a }, { n: 'Tito', a: PLZ_BOTS[1].a }, { n: 'Lola', a: PLZ_BOTS[0].a }];
const PAD_COLOR_EQ = ['#3A86FF', '#FF7A1A'];

let padelMesas = {};
let padelMesaId = null;
let padelCap = 2;
let padelHasta = 7;
let padelViajeEscuchado = '';
let padelRefEscuchada = null;
let padelSes = null;

const padelRefMesas = () => db.ref('salas/' + codigoViaje + '/padel/mesas');
const padelRefVivo = id => db.ref('salas/' + codigoViaje + '/padel/vivo/' + id);
const padelYo = () => String(miAsiento || 'yo');
const padelEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- Mesas (lobby) ----

function iniciarPadel(){
  if(codigoViaje && padelViajeEscuchado !== codigoViaje){
    if(padelRefEscuchada){ try { padelRefEscuchada.off(); } catch(e){} }
    padelViajeEscuchado = codigoViaje;
    padelRefEscuchada = padelRefMesas();
    padelRefEscuchada.on('value', snap => { padelMesas = snap.val() || {}; padelAlCambiarMesas(); });
  }
  padelRender();
}

function padelMesaActual(){ return padelMesaId ? padelMesas[padelMesaId] : null; }

function padelAlCambiarMesas(){
  if(padelMesaId && !padelMesas[padelMesaId]){
    if(padelSes && !padelSes.local){ padelCerrarSesion(false); if(typeof mostrarToast === 'function') mostrarToast('La mesa se cerró'); }
    padelMesaId = null;
  }
  const mesa = padelMesaActual();
  if(mesa && mesa.fase === 'jugando' && !padelSes) padelArrancar(padelMesaId, mesa, false);
  padelRender();
}

function padelElegirCap(n){ padelCap = n; padelRender(); }
function padelElegirHasta(n){ padelHasta = n; padelRender(); }

function padelCrearMesa(){
  if(!miAsiento || !codigoViaje) return;
  const ref = padelRefMesas().push();
  ref.set({ jugadores: [String(miAsiento)], nombres: { [miAsiento]: miNombre }, av: { [miAsiento]: plazaCompacto() }, capacidad: padelCap, hasta: padelHasta, fase: 'esperando' });
  try { ref.onDisconnect().remove(); } catch(e){}
  padelMesaId = ref.key;
  padelRender();
}

function padelUnirse(id){
  if(!miAsiento) return;
  const yo = String(miAsiento);
  padelRefMesas().child(id).transaction(m => {
    if(!m || m.fase !== 'esperando') return m;
    const jug = m.jugadores || [];
    if(jug.indexOf(yo) >= 0 || jug.length >= m.capacidad) return m;
    m.jugadores = jug.concat([yo]);
    m.nombres = Object.assign({}, m.nombres, { [yo]: miNombre });
    m.av = Object.assign({}, m.av, { [yo]: plazaCompacto() });
    if(m.jugadores.length >= m.capacidad) m.fase = 'jugando';
    return m;
  }, (err, ok, snap) => {
    const v = snap && snap.val ? snap.val() : null;
    if(ok && v && (v.jugadores || []).indexOf(yo) >= 0){ padelMesaId = id; padelAlCambiarMesas(); } // el evento local ya pasó: acá arranca si ya está completa
    else if(typeof mostrarToast === 'function') mostrarToast('La mesa ya está completa');
  });
}

// El que armó la mesa puede empezar ya: los lugares libres los ocupan entrenadores.
function padelCompletarConBots(){
  const m = padelMesaActual(), yo = String(miAsiento);
  if(!m || m.fase !== 'esperando' || (m.jugadores || [])[0] !== yo) return;
  const jugadores = m.jugadores.slice(), bots = [], nombres = Object.assign({}, m.nombres), av = Object.assign({}, m.av);
  let k = 0;
  while(jugadores.length < m.capacidad){
    const id = 'bot' + (k + 1), b = PAD_BOTS[k % PAD_BOTS.length];
    jugadores.push(id); bots.push(id); nombres[id] = '🤖 ' + b.n; av[id] = b.a; k++;
  }
  padelRefMesas().child(padelMesaId).update({ jugadores, bots, nombres, av, fase: 'jugando' });
}

function padelPracticar(cap){
  const yo = padelYo();
  const jugadores = [yo], bots = [], nombres = { [yo]: miNombre || 'Vos' }, av = { [yo]: typeof plazaCompacto === 'function' ? plazaCompacto() : {} };
  let k = 0;
  while(jugadores.length < cap){ const id = 'bot' + (k + 1), b = PAD_BOTS[k % PAD_BOTS.length]; jugadores.push(id); bots.push(id); nombres[id] = '🤖 ' + b.n; av[id] = b.a; k++; }
  padelArrancar(null, { jugadores, bots, nombres, av, capacidad: cap, hasta: padelHasta, fase: 'jugando' }, true);
}

// Salir de la mesa mientras espera: si la armé yo, se borra; si no, me saco de la lista.
function padelSalirDeMesa(){
  const m = padelMesaActual(), yo = String(miAsiento);
  if(m && m.fase === 'esperando'){
    if((m.jugadores || [])[0] === yo) padelRefMesas().child(padelMesaId).remove();
    else padelRefMesas().child(padelMesaId).transaction(x => {
      if(!x || x.fase !== 'esperando') return x;
      x.jugadores = (x.jugadores || []).filter(a => a !== yo);
      if(x.nombres) delete x.nombres[yo];
      if(x.av) delete x.av[yo];
      return x;
    });
  }
  padelMesaId = null;
  padelRender();
}

// Para la flecha de volver (app.js): si estoy en un partido o esperando en una mesa, primero vuelvo a la lista.
function padelVolver(){
  if(padelSes){
    const s = padelSes;
    if(s.est.fase !== 'fin' && !s.local && s.est.puntos[0] + s.est.puntos[1] > 0 && !confirm(s.host ? '¿Salir del partido? Se termina para todos.' : '¿Salir del partido? Un entrenador juega en tu lugar.')) return true;
    const eraLocal = s.local;
    padelCerrarSesion(true);
    if(!eraLocal) padelMesaId = null;
    padelRender();
    return true;
  }
  if(padelMesaId){ padelSalirDeMesa(); return true; }
  return false;
}

// ---- Insignia en la plaza: cuántas mesas esperan jugadores ----

let padelPlazaRef = null, padelPlazaCb = null, padelPlazaDatos = {};
function padelPlazaIniciar(){
  padelPlazaAlSalir();
  if(typeof codigoViaje === 'undefined' || !codigoViaje) return;
  padelPlazaRef = padelRefMesas();
  padelPlazaCb = padelPlazaRef.on('value', s => { padelPlazaDatos = s.val() || {}; if(typeof plazaRenderAccion === 'function') plazaRenderAccion(); });
}
function padelPlazaAlSalir(){
  if(padelPlazaRef && padelPlazaCb){ try { padelPlazaRef.off('value', padelPlazaCb); } catch(e){} }
  padelPlazaRef = null; padelPlazaCb = null; padelPlazaDatos = {};
}
function padelResumen(){
  let esperan = 0, jugando = 0, mejor = null;
  Object.keys(padelPlazaDatos).forEach(id => {
    const m = padelPlazaDatos[id];
    if(!m) return;
    if(m.fase === 'esperando'){ esperan++; const n = (m.jugadores || []).length; if(!mejor || n > mejor.n) mejor = { n, cap: m.capacidad || 2 }; }
    else if(m.fase === 'jugando') jugando++;
  });
  return { esperan, jugando, mejor };
}
function padelInsignia(){
  const r = padelResumen();
  if(r.mejor) return '🎾 ' + r.mejor.n + '/' + r.mejor.cap;
  if(r.jugando) return '▶ ' + r.jugando;
  return null;
}
function padelSubtitulo(base){
  const r = padelResumen();
  if(r.mejor) return (r.esperan === 1 ? '1 mesa espera' : r.esperan + ' mesas esperan') + ' jugadores (' + r.mejor.n + '/' + r.mejor.cap + '). ¡Sumate!';
  if(r.jugando) return r.jugando + (r.jugando === 1 ? ' partido en juego' : ' partidos en juego') + '. Podés armar otro.';
  return base + ' · Todavía no hay mesas abiertas';
}

// Fachada de Padelbus en la plaza: techo de vidrio con la cancha vista desde arriba y una pelota que rebota.
function plazaDibujarPadel(ctx, e){
  ctx.fillStyle = 'rgba(0,0,0,.14)'; arcRR(ctx, e.x + 4, e.y + 8, e.w, e.h, 12); ctx.fill();
  ctx.fillStyle = '#0E7C86'; arcRR(ctx, e.x, e.y, e.w, e.h, 12); ctx.fill();
  const cx = e.x + 14, cy = e.y + 14, cw = e.w - 28, ch = e.h - 50;
  ctx.fillStyle = '#2E6FD0'; arcRR(ctx, cx, cy, cw, ch, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.strokeRect(cx + 5, cy + 5, cw - 10, ch - 10);
  ctx.beginPath(); ctx.moveTo(cx + cw / 2, cy + 5); ctx.lineTo(cx + cw / 2, cy + ch - 5); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.2;
  [cx + cw * 0.27, cx + cw * 0.73].forEach(x => { ctx.beginPath(); ctx.moveTo(x, cy + 5); ctx.lineTo(x, cy + ch - 5); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(cx + cw * 0.27, cy + ch / 2); ctx.lineTo(cx + cw * 0.73, cy + ch / 2); ctx.stroke();
  ctx.fillStyle = '#1a2233'; ctx.fillRect(cx + cw / 2 - 2, cy + 3, 4, ch - 6);
  const t = plz.t * 1.6, u = (t % 2) / 2, ida = Math.floor(t / 2) % 2 === 0;
  const bx = cx + 12 + (ida ? u : 1 - u) * (cw - 24), alto = Math.abs(Math.sin(u * Math.PI * 2.2)) * 12;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(bx, cy + ch / 2 + 6, 5, 2.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#D9F236'; ctx.beginPath(); ctx.arc(bx, cy + ch / 2 + 2 - alto, 4.6, 0, 7); ctx.fill();
  arcLogo(ctx, cx + cw * 0.14, cy + ch / 2, 22, '#fff');
  ctx.fillStyle = '#0F2A4D'; arcRR(ctx, e.x, e.y + e.h - 28, e.w, 28, 12); ctx.fill();
  ctx.fillStyle = '#FFD84D'; ctx.font = '800 15px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🎾 PADELBUS', e.x + e.w / 2, e.y + e.h - 13.5);
  const z = plazaZonaPuerta(e);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; arcRR(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
  ctx.fillStyle = '#5A3A22'; arcRR(ctx, e.x + e.w / 2 - 15, e.y - 2, 30, 20, 6); ctx.fill();
  ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(e.x + e.w / 2 + 9, e.y + 8, 2.2, 0, 7); ctx.fill();
}

// ---- Pantallas ----

function padelRender(){
  const cont = document.getElementById('padel-content');
  if(!cont || padelSes) return;
  const vista = document.getElementById('view-padel');
  if(vista) vista.classList.remove('juego-inmersivo');
  const sub = document.getElementById('padel-sub');
  const mesa = padelMesaActual();
  if(sub) sub.textContent = mesa ? 'En una mesa' : 'De a 2 o de a 4, con rebote en las paredes';
  if(mesa && mesa.fase === 'esperando') padelRenderEspera(cont, mesa);
  else padelRenderLobby(cont);
}

function padelRenderLobby(cont){
  const yo = String(miAsiento);
  const lista = Object.keys(padelMesas).map(id => Object.assign({ id }, padelMesas[id])).filter(m => m && m.jugadores);
  const filas = lista.length ? lista.map(m => {
    const nombres = m.jugadores.map(a => padelEsc((m.nombres || {})[a] || '?')).join(', ');
    const estado = m.fase === 'esperando' ? `Esperando jugadores (${m.jugadores.length}/${m.capacidad}) · a ${m.hasta}` : m.fase === 'jugando' ? 'Jugando' : 'Terminada';
    const estoy = m.jugadores.indexOf(yo) >= 0;
    const puedo = m.fase === 'esperando' && m.jugadores.length < m.capacidad && !estoy;
    return `<div class="bingo-roster-item"><span>${nombres}<br><span style="font-size:11px;color:var(--gray);">${estado}</span></span><span class="bingo-roster-derecha">
      ${estoy && m.fase === 'jugando' ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="padelMesaId='${m.id}'; padelArrancar('${m.id}', padelMesas['${m.id}'], false);">Volver</button>` : ''}
      ${estoy && m.fase === 'esperando' ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="padelMesaId='${m.id}'; padelRender();">Entrar</button>` : ''}
      ${puedo ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;background:#3B9B5A;color:#fff;border-color:#3B9B5A;" onclick="padelUnirse('${m.id}')">Unirme</button>` : ''}
    </span></div>`;
  }).join('') : '<p style="color:var(--gray);font-size:13px;">Todavía no hay mesas. ¡Armá la primera o practicá con el entrenador!</p>';
  const op = (v, actual, fn, txt) => `<button class="gbtn ${actual === v ? 'gbtn-sel' : 'gbtn-no'}" onclick="${fn}(${v})">${txt}</button>`;
  cont.innerHTML = `
    ${gEscenaHTML('cielo', `
      ${gDialogoHTML('🎾 Padelbus', 'Cancha con paredes de vidrio. Arrastrá el dedo para moverte: la paleta pega sola cuando la pelota está cerca. Con 🎈 tirás un globo al fondo, y si la pelota viene alta, ¡remate!')}
      <div class="g-dialogo-sub" style="text-align:center;margin-bottom:6px;font-weight:700;">¿Cuántos juegan?</div>
      <div class="g-acciones" style="grid-template-columns:1fr 1fr;">${op(2, padelCap, 'padelElegirCap', '1 contra 1')}${op(4, padelCap, 'padelElegirCap', '2 contra 2')}</div>
      <div class="g-dialogo-sub" style="text-align:center;margin:8px 0 6px;font-weight:700;">¿A cuántos puntos?</div>
      <div class="g-acciones" style="grid-template-columns:repeat(3,1fr);">${[5, 7, 10].map(n => op(n, padelHasta, 'padelElegirHasta', String(n))).join('')}</div>
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="padelCrearMesa()">Crear mesa nueva</button></div>
      <div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-violeta" style="font-size:15px;" onclick="padelPracticar(padelCap)">🤖 Practicar con el entrenador</button></div>`)}
    <div class="section-label">Mesas</div>
    ${filas}`;
}

function padelRenderEspera(cont, mesa){
  const yo = String(miAsiento), soyAnfitrion = (mesa.jugadores || [])[0] === yo;
  const lugares = Array.from({ length: mesa.capacidad }).map((_, i) => {
    const id = mesa.jugadores[i], eq = i % 2;
    return `<div class="pad-lugar" style="--c:${PAD_COLOR_EQ[eq]};${id ? '' : 'opacity:.45;'}"><b>${id ? padelEsc((mesa.nombres || {})[id] || '?') : 'Libre'}</b><small>Equipo ${eq ? 'naranja' : 'azul'}</small></div>`;
  }).join('');
  cont.innerHTML = gEscenaHTML('cielo', `
    ${gDialogoHTML('Esperando jugadores...', `${mesa.jugadores.length} de ${mesa.capacidad} · a ${mesa.hasta} puntos. Se juega apenas se sumen los que faltan.`)}
    <div class="pad-lugares">${lugares}</div>
    ${soyAnfitrion && mesa.jugadores.length < mesa.capacidad ? '<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-violeta" style="font-size:15px;" onclick="padelCompletarConBots()">🤖 Empezar ya: los lugares libres los ocupa el entrenador</button></div>' : ''}
    <div class="g-pie"><span onclick="padelSalirDeMesa()">‹ ${soyAnfitrion ? 'Cancelar esta mesa' : 'Salir de la mesa'}</span></div>`);
}

// ---- Partido ----

function padelArrancar(id, mesa, local){
  if(padelSes) return;
  const yo = padelYo();
  const ids = (mesa.jugadores || []).map(String);
  const equipos = [[], []];
  ids.forEach((x, i) => equipos[i % 2].push(x));
  const bots = (mesa.bots || []).map(String);
  const est = padelNuevoPartido(equipos, mesa.hasta || 7, bots);
  const idx = ids.indexOf(yo);
  padelSes = {
    id, local: !!local, est, yo, eq: idx >= 0 ? idx % 2 : 0, host: !!local || ids[0] === yo, ids, nombres: mesa.nombres || {}, av: mesa.av || {}, bots, hayBots: bots.length > 0,
    obj: null, teclas: {}, ultimo: 0, raf: 0, snap: null, snapNuevo: false, evVisto: -1, g: 0, sv: 0, svVisto: {}, n: 0, ent: {}, visto: {}, vistoT: {}, inicio: performance.now(),
    enviado: 0, publicado: 0, recibido: performance.now(), premiado: false, escrito: false, cartel: '', dir: {}, ultimaFase: 'saque', canvas: null, ctx: null, oyentes: [], punto: null,
  };
  const s = padelSes;
  if(!local){
    if(s.host){
      const ref = padelRefVivo(id).child('ent');
      const cb = ref.on('value', snap => { s.ent = snap.val() || {}; });
      s.oyentes.push({ ref, cb });
      try { padelRefVivo(id).onDisconnect().remove(); } catch(e){}
    } else {
      const ref = padelRefVivo(id).child('estado');
      const cb = ref.on('value', snap => { const v = snap.val(); if(v){ s.snap = v; s.snapNuevo = true; s.recibido = performance.now(); } });
      s.oyentes.push({ ref, cb });
      try { padelRefVivo(id).child('ent').child(yo).onDisconnect().remove(); } catch(e){}
    }
  }
  padelRenderPartido();
  s.raf = requestAnimationFrame(padelBucle);
}

function padelCerrarSesion(borrar){
  const s = padelSes;
  if(!s) return;
  padelSes = null;
  cancelAnimationFrame(s.raf);
  s.oyentes.forEach(o => { try { o.ref.off('value', o.cb); } catch(e){} });
  if(!s.local && borrar){
    try {
      if(s.host){ padelRefMesas().child(s.id).remove(); padelRefVivo(s.id).remove(); }
      else padelRefVivo(s.id).child('ent').child(s.yo).remove();
    } catch(e){}
  }
  const vista = document.getElementById('view-padel');
  if(vista) vista.classList.remove('juego-inmersivo');
}

function padelRenderPartido(){
  const cont = document.getElementById('padel-content'), s = padelSes;
  if(!cont || !s) return;
  document.getElementById('view-padel').classList.add('juego-inmersivo');
  const sub = document.getElementById('padel-sub');
  if(sub) sub.textContent = s.local ? 'Práctica con el entrenador' : 'En partido';
  cont.innerHTML = gEscenaHTML('cielo', `
    <div class="g-hud pad-hud"><span class="g-pill pad-pill" id="pad-pill-yo"></span><span class="g-pill" id="pad-pill-hasta"></span><span class="g-pill pad-pill" id="pad-pill-rival"></span></div>
    <div class="pad-caja"><canvas class="pad-canvas"></canvas><div class="pad-cartel" id="pad-cartel"></div></div>
    <div class="g-acciones pad-botones"><button class="gbtn" id="pad-globo" onclick="padelPedirGlobo()">🎈 Globo</button><button class="gbtn gbtn-quiero" id="pad-sacar" onclick="padelPedirSaque()" style="display:none;">🎾 Sacar</button></div>
    <div class="pad-ayuda">Arrastrá el dedo para moverte · 🎈 = tu próximo golpe es un globo</div>
    <div class="g-pie"><span onclick="padelVolver()">‹ Salir del partido</span></div>`, 'pad-escena');
  s.canvas = cont.querySelector('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  s.canvas.width = PAD.CW * dpr; s.canvas.height = PAD.CH * dpr;
  s.ctx = s.canvas.getContext('2d');
  s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const aMundo = ev => {
    const r = s.canvas.getBoundingClientRect();
    let x = (ev.clientX - r.left) * PAD.CW / r.width - PAD.OX, y = (ev.clientY - r.top) * PAD.CH / r.height - PAD.OY;
    if(s.eq === 1){ x = PADEL.W - x; y = PADEL.H - y; }
    return { x: Math.max(0, Math.min(PADEL.W, x)), y: Math.max(0, Math.min(PADEL.H, y)) };
  };
  let apretado = false;
  s.canvas.addEventListener('pointerdown', ev => { ev.preventDefault(); apretado = true; try { s.canvas.setPointerCapture(ev.pointerId); } catch(e){} s.obj = aMundo(ev); });
  s.canvas.addEventListener('pointermove', ev => { if(apretado) s.obj = aMundo(ev); });
  const soltar = () => { apretado = false; };
  s.canvas.addEventListener('pointerup', soltar);
  s.canvas.addEventListener('pointercancel', soltar);
  s.cartel = ''; s.hud = '';
  padelActualizarHUD();
}

// Teclado (para probar en la compu): flechas para moverse, espacio para el globo, Enter para sacar.
document.addEventListener('keydown', e => {
  if(!padelSes) return;
  if(e.key.startsWith('Arrow')){ padelSes.teclas[e.key] = true; e.preventDefault(); }
  else if(e.key === ' '){ padelPedirGlobo(); e.preventDefault(); }
  else if(e.key === 'Enter'){ padelPedirSaque(); }
});
document.addEventListener('keyup', e => { if(padelSes) delete padelSes.teclas[e.key]; });

function padelPedirGlobo(){
  const s = padelSes;
  if(!s || s.est.fase === 'fin') return;
  s.g++; s.globoHasta = performance.now() + 1400;
  const b = document.getElementById('pad-globo'); if(b) b.classList.add('pad-armado');
  if(typeof reproducirNota === 'function') reproducirNota(880, 0.08, 'sine');
}

function padelPedirSaque(){
  const s = padelSes;
  if(!s || s.est.fase !== 'saque' || s.est.sacador !== s.yo) return;
  if(s.host){ padelProcesarEventos(padelSacar(s.est, s.yo)); }
  else { s.sv++; padelEnviarEnt(true); }
}

function padelEnviarEnt(ya){
  const s = padelSes;
  if(!s || s.host || s.local) return;
  const ahora = performance.now();
  if(!ya && ahora - s.enviado < 90) return;
  s.enviado = ahora; s.n++;
  const j = s.est.jug[s.yo];
  padelRefVivo(s.id).child('ent').child(s.yo).set({ x: Math.round(j.x * 10) / 10, y: Math.round(j.y * 10) / 10, vx: Math.round(j.vx || 0), g: s.g, sv: s.sv, n: s.n });
}

// ---- Bucle ----

function padelBucle(ts){
  const s = padelSes;
  if(!s) return;
  const vista = document.getElementById('view-padel');
  if(!vista || !vista.classList.contains('active')){ padelCerrarSesion(true); padelMesaId = null; return; }
  const dt = s.ultimo ? Math.min(0.05, (ts - s.ultimo) / 1000) : 0.016;
  s.ultimo = ts;
  padelPasoSesion(s, dt);
  padelDibujar(s);
  s.raf = requestAnimationFrame(padelBucle);
}

function padelProcesarEventos(evs){
  (evs || []).forEach(padelSonido);
}

function padelSonido(ev){
  const t = typeof ev === 'string' ? ev : ev.t;
  if(typeof reproducirNota !== 'function') return;
  if(t === 'golpe' || t === 'saque') reproducirNota(520, 0.06, 'square');
  else if(t === 'globo') reproducirNota(700, 0.12, 'triangle');
  else if(t === 'remate'){ reproducirNota(300, 0.1, 'sawtooth'); }
  else if(t === 'piso') reproducirNota(190, 0.05, 'sine');
  else if(t === 'pared') reproducirNota(300, 0.06, 'triangle');
  else if(t === 'red') reproducirNota(130, 0.12, 'sawtooth');
  else if(t === 'punto' && ev.eq !== undefined){
    const gane = ev.eq === padelSes.eq;
    if(typeof reproducirMelodia === 'function') reproducirMelodia(gane ? [660, 880] : [330, 247], 110, 'triangle');
  } else if(t === 'fin'){
    if(typeof reproducirMelodia === 'function') reproducirMelodia(ev.eq === padelSes.eq ? [523, 659, 784, 1046] : [392, 330, 262], 130, 'sine');
  }
}

function padelPasoSesion(s, dt){
  const est = s.est, ahora = performance.now();
  const j = est.jug[s.yo];
  // mi movimiento (con el dedo o las flechas)
  let tx = null, ty = null;
  if(j){
    const T = s.teclas;
    if(T.ArrowLeft || T.ArrowRight || T.ArrowUp || T.ArrowDown){
      const sg = s.eq === 1 ? -1 : 1;
      tx = j.x + ((T.ArrowRight ? 1 : 0) - (T.ArrowLeft ? 1 : 0)) * sg * 60;
      ty = j.y + ((T.ArrowDown ? 1 : 0) - (T.ArrowUp ? 1 : 0)) * sg * 60;
    } else if(s.obj){ tx = s.obj.x; ty = s.obj.y; }
    if(tx !== null) padelMoverJugador(est, j, tx, ty, PADEL.VEL, dt); else j.vx *= 0.7;
  }
  if(s.globoHasta && ahora > s.globoHasta){ s.globoHasta = 0; const b = document.getElementById('pad-globo'); if(b) b.classList.remove('pad-armado'); }

  if(s.host){
    const entradas = {};
    if(j) entradas[s.yo] = { x: j.x, y: j.y, vx: j.vx, g: s.g };
    Object.keys(est.jug).forEach(id => {
      if(id === s.yo || s.bots.indexOf(id) >= 0) return;
      const e = s.ent[id];
      if(e){
        if(e.n !== s.visto[id]){ s.visto[id] = e.n; s.vistoT[id] = ahora; }
        entradas[id] = e;
        if(typeof e.sv === 'number' && e.sv !== (s.svVisto[id] || 0)){ s.svVisto[id] = e.sv; if(est.fase === 'saque' && est.sacador === id) padelProcesarEventos(padelSacar(est, id)); }
      }
      // si alguien deja de mandar su posición, un entrenador juega en su lugar
      est.jug[id].bot = ahora - (s.vistoT[id] || s.inicio) > 5000 && !s.local;
    });
    const evs = padelPaso(est, dt, entradas);
    padelProcesarEventos(evs);
    if(est.fase === 'fin' && !s.escrito && !s.local){
      s.escrito = true;
      padelRefMesas().child(s.id).update({ fase: 'terminado', ganador: est.ganador });
    }
    s.publicado -= dt;
    if(!s.local && s.publicado <= 0){ s.publicado = 0.08; padelRefVivo(s.id).child('estado').set(padelCompactar(est)); }
  } else {
    est.t += dt;
    if(s.snapNuevo){
      s.snapNuevo = false;
      padelAplicar(est, s.snap, s.yo);
      if(s.evVisto < 0) s.evVisto = s.snap.e;
      const nuevos = Math.min(4, s.snap.e - s.evVisto);
      if(nuevos > 0 && s.snap.el){
        const lista = s.snap.el.slice(-nuevos);
        lista.forEach(t => padelSonido(t === 'punto' || t === 'fin' ? { t, eq: s.snap.pe >= 0 ? s.snap.pe : s.snap.g } : t));
      }
      s.evVisto = s.snap.e;
    }
    if(est.fase === 'juego' || est.fase === 'punto') padelFisica(est.bola, dt, null);
    const k = 1 - Math.exp(-14 * dt);
    Object.keys(est.jug).forEach(id => { if(id === s.yo) return; const o = est.jug[id]; o.x += ((o.objX || o.x) - o.x) * k; o.y += ((o.objY || o.y) - o.y) * k; });
    padelEnviarEnt(false);
    if(ahora - s.recibido > 9000 && est.fase !== 'fin'){
      padelCerrarSesion(false); padelMesaId = null;
      if(typeof mostrarToast === 'function') mostrarToast('Se perdió la conexión con el anfitrión');
      padelRender();
      return;
    }
  }

  // Monedas al terminar (habilidad, con tope por día como los videojuegos)
  if(est.fase === 'fin' && !s.premiado){
    s.premiado = true;
    const gane = est.ganador === s.eq;
    const n = gane ? (s.hayBots ? 3 : 8) : (s.hayBots ? 0 : 2);
    s.ganadas = n > 0 && typeof arcOtorgarMonedas === 'function' ? arcOtorgarMonedas('padelbus', n) : 0;
    s.cartel = '';
  }
  if(est.fase !== 'fin' && s.premiado && s.ultimaFase === 'fin'){ s.premiado = false; s.escrito = false; s.cartel = ''; }
  s.ultimaFase = est.fase;
  padelActualizarHUD();
}

// ---- Marcador y carteles ----

function padelNombre(s, id){ return String((s.nombres || {})[id] || (id === s.yo ? 'Vos' : '?')); }

function padelActualizarHUD(){
  const s = padelSes;
  if(!s) return;
  const est = s.est, eq = s.eq, otro = 1 - eq;
  const clave = [est.puntos.join('-'), est.fase, est.sacador, est.msg, est.ganador, est.hasta].join('|');
  if(clave === s.hud) return;
  s.hud = clave;
  const set = (id, html) => { const el = document.getElementById(id); if(el) el.innerHTML = html; };
  const dobles = est.equipos[eq].length > 1;
  set('pad-pill-yo', (dobles ? 'Nosotros' : 'Vos') + ' <b>' + est.puntos[eq] + '</b>');
  set('pad-pill-hasta', 'a ' + est.hasta);
  set('pad-pill-rival', (dobles ? 'Ellos' : padelEsc(padelNombre(s, est.equipos[otro][0]))) + ' <b>' + est.puntos[otro] + '</b>');
  const py = document.getElementById('pad-pill-yo'), pr = document.getElementById('pad-pill-rival');
  if(py) py.style.borderColor = PAD_COLOR_EQ[eq]; if(pr) pr.style.borderColor = PAD_COLOR_EQ[otro];
  const sacar = document.getElementById('pad-sacar');
  if(sacar) sacar.style.display = est.fase === 'saque' && est.sacador === s.yo ? '' : 'none';
  const cartel = document.getElementById('pad-cartel');
  if(!cartel) return;
  if(est.fase === 'fin'){
    const gane = est.ganador === eq;
    const premio = s.ganadas ? `<div class="pad-premio">+${s.ganadas} 🪙</div>` : '';
    cartel.innerHTML = `<div class="pad-fin"><div class="pad-fin-titulo">${gane ? '🏆 ¡Ganaron!' : 'Perdieron esta vez'}</div><div class="pad-fin-sub">${est.puntos[eq]} a ${est.puntos[otro]}${s.hayBots ? ' · con entrenador' : ''}</div>${premio}
      <div class="g-acciones" style="grid-template-columns:1fr;">${s.host ? '<button class="gbtn gbtn-quiero" onclick="padelRevancha()">🔄 Revancha</button>' : '<div class="pad-fin-sub">Que el anfitrión pida la revancha…</div>'}<button class="gbtn gbtn-no" onclick="padelVolver()">Salir</button></div></div>`;
    cartel.style.pointerEvents = 'auto';
    return;
  }
  cartel.style.pointerEvents = 'none';
  if(est.fase === 'punto') cartel.innerHTML = `<div class="pad-msg">${padelEsc(est.msg)}<small>Punto para ${est.puntoEq === eq ? (dobles ? 'ustedes' : 'vos') : (dobles ? 'ellos' : padelEsc(padelNombre(s, est.equipos[otro][0])))}</small></div>`;
  else if(est.fase === 'saque') cartel.innerHTML = est.sacador === s.yo ? '<div class="pad-msg">Tu saque<small>Tocá 🎾 Sacar (o saca solo en unos segundos)</small></div>' : `<div class="pad-msg pad-msg-chico">Saca ${padelEsc(padelNombre(s, est.sacador))}</div>`;
  else cartel.innerHTML = '';
}

function padelRevancha(){
  const s = padelSes;
  if(!s || !s.host || s.est.fase !== 'fin') return;
  const nuevo = padelNuevoPartido(s.est.equipos, s.est.hasta, s.bots);
  s.est = nuevo; s.premiado = false; s.escrito = false; s.ultimaFase = 'saque'; s.hud = '';
  if(!s.local) padelRefMesas().child(s.id).update({ fase: 'jugando', ganador: null });
  padelActualizarHUD();
}

// ---- Dibujo ----

function padelDibujar(s){
  const ctx = s.ctx, est = s.est, W = PADEL.W, H = PADEL.H, OX = PAD.OX, OY = PAD.OY, flip = s.eq === 1;
  const X = x => OX + (flip ? W - x : x), Y = y => OY + (flip ? H - y : y);
  ctx.clearRect(0, 0, PAD.CW, PAD.CH);
  // Alrededor: pared de vidrio con tubos de metal
  ctx.fillStyle = '#0F2A4D'; ctx.fillRect(0, 0, PAD.CW, PAD.CH);
  const g = ctx.createLinearGradient(0, OY, 0, OY + H);
  g.addColorStop(0, '#2C6BCB'); g.addColorStop(0.5, '#3C7FE0'); g.addColorStop(1, '#2C6BCB');
  ctx.fillStyle = g; ctx.fillRect(OX, OY, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.07)'; for(let i = 0; i < H; i += 40) if((i / 40) % 2 === 0) ctx.fillRect(OX, OY + i, W, 20);
  // vidrios (fondo y laterales)
  ctx.fillStyle = 'rgba(190,230,255,.28)'; ctx.fillRect(OX - 12, OY - 14, W + 24, 14); ctx.fillRect(OX - 12, OY + H, W + 24, 14);
  ctx.fillRect(OX - 12, OY, 12, H); ctx.fillRect(OX + W, OY, 12, H);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.strokeRect(OX - 12, OY - 14, W + 24, H + 28);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
  for(let i = 1; i < 4; i++){ const x = OX - 12 + (W + 24) * i / 4; [OY - 14, OY + H].forEach(y => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke(); }); }
  for(let i = 1; i < 6; i++){ const y = OY + H * i / 6; [OX - 12, OX + W].forEach(x => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y); ctx.stroke(); }); }
  arcLogo(ctx, PAD.CW / 2, OY - 7, 12, '#fff'); arcLogo(ctx, PAD.CW / 2, OY + H + 7, 12, '#fff');
  // líneas
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5; ctx.strokeRect(OX, OY, W, H);
  ctx.lineWidth = 2;
  [PADEL.RED - 130, PADEL.RED + 130].forEach(y => { ctx.beginPath(); ctx.moveTo(OX, Y(y)); ctx.lineTo(OX + W, Y(y)); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(OX + W / 2, Y(PADEL.RED - 130)); ctx.lineTo(OX + W / 2, Y(PADEL.RED + 130)); ctx.stroke();
  ctx.globalAlpha = 0.16; arcLogo(ctx, OX + W / 2, Y(PADEL.H - 90), 70, null); arcLogo(ctx, OX + W / 2, Y(90), 70, null); ctx.globalAlpha = 1;
  // red
  const ry = Y(PADEL.RED);
  ctx.fillStyle = 'rgba(15,20,35,.55)'; ctx.fillRect(OX - 4, ry - 4, W + 8, 8);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; for(let x = OX; x < OX + W; x += 7){ ctx.beginPath(); ctx.moveTo(x, ry - 4); ctx.lineTo(x, ry + 4); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.fillRect(OX - 4, ry - 5, W + 8, 2.5);
  ctx.fillStyle = '#8E99AB'; [OX - 8, OX + W + 8].forEach(x => { ctx.beginPath(); ctx.arc(x, ry, 5, 0, 7); ctx.fill(); });
  arcLogo(ctx, OX + W / 2, ry, 16, '#fff');

  // jugadores y pelota, de arriba hacia abajo para que se tapen bien
  const b = est.bola;
  const lista = Object.keys(est.jug).map(id => est.jug[id]).sort((a, c) => Y(a.y) - Y(c.y));
  lista.forEach(j => padelDibujarJugador(s, ctx, j, X(j.x), Y(j.y), b, X(b.x)));
  // sombra y pelota
  const bx = X(b.x), by = Y(b.y), alto = Math.max(0, b.z);
  ctx.fillStyle = 'rgba(0,0,0,' + (0.32 - Math.min(0.2, alto / 700)).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(bx, by + 1, 6 + alto * 0.012, 3 + alto * 0.006, 0, 0, 7); ctx.fill();
  const r = 6 + alto * 0.012, cy = by - alto * 0.55;
  ctx.fillStyle = '#D9F236'; ctx.beginPath(); ctx.arc(bx, cy, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8FA10F'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx - r * 0.55, cy, r * 0.9, -0.9, 0.9); ctx.stroke();
}

function padelDibujarJugador(s, ctx, j, px, py, b, bxPantalla){
  const mio = j.id === s.yo, color = PAD_COLOR_EQ[j.eq];
  // aro del equipo y alcance de la paleta
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(px, py, 15, 5.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(px, py, 15, 5.5, 0, 0, 7); ctx.stroke();
  if(mio){ ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(px, py, PADEL.ALCANCE, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  const dir = bxPantalla >= px ? 1 : -1;
  const av = (s.av || {})[j.id];
  const img = typeof avatarSprite === 'function' ? avatarSprite(av || {}) : null;
  ctx.save(); ctx.translate(px, py - 2);
  if(dir < 0) ctx.scale(-1, 1);
  if(img && img.complete && img.naturalWidth) ctx.drawImage(img, -18, -46, 36, 43);
  else { ctx.fillStyle = color; arcRR(ctx, -9, -34, 18, 30, 7); ctx.fill(); }
  // raqueta: gira cuando pega
  const sw = Math.max(0, 1 - (s.est.t - j.golpeT) / 0.25), ang = -0.6 + sw * 1.7 * (j.eq === s.eq ? -1 : -1);
  ctx.translate(13, -20); ctx.rotate(ang);
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(0, -18, 8, 10, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; [[-2.5, -21], [2.5, -21], [0, -16]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1, 0, 7); ctx.fill(); });
  ctx.restore();
  // nombre
  const nombre = mio ? 'Vos' : padelNombre(s, j.id);
  ctx.font = '700 9.5px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(nombre).width + 8;
  ctx.fillStyle = 'rgba(15,42,77,.78)'; arcRR(ctx, px - tw / 2, py - 56, tw, 13, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(nombre, px, py - 49.5);
}
