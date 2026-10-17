// El micro de dos pisos: lleva a los pasajeros entre las 5 paradas del mundo y se puede mirar por
// dentro. "Paradas" deja ir a cualquier parada (viaje libre); "Asientos" muestra los dos pisos con
// cada asiento numerado, quién sigue sentado (en la Estación) y quién está paseando por alguna
// parada, y permite ir a buscar a cualquiera por su número de asiento.
// Quien está un rato sin hacer nada en un mapa vuelve solo a la Estación.
//
// Datos (solo lectura, ya existen): ranking/puntos/{asiento} → nombre + personaje, capacidad,
// y la presencia (plaza/{parada}/{sala}/{asiento}).

const MIC = { abierto: false, tab: 'asientos', piso: 'abajo', pas: {}, pres: {}, cap: 0, sel: null, oyentes: [], avisado: false };
const MIC_ABAJO = 12;                // asientos del piso de abajo (los últimos números)
const MIC_ASIENTOS = 60;             // si el viaje no dice cuántos son: 1 al 48 arriba + 49 al 60 abajo
const MIC_MAX = 100;                 // tope de asientos dibujados
const MIC_INACTIVO_MS = 180000;      // sin hacer nada: vuelve al micro
const MIC_AVISO_MS = 150000;         // y se le avisa 30 s antes

const micEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const micEnLinea = () => !!(typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre);
const micToast = (m, t) => { if(typeof mostrarToast === 'function') mostrarToast(m, t); };

// ---- Asientos ----

function microAsientos(){
  const claves = Object.keys(MIC.pas);
  const nums = claves.filter(a => /^\d+$/.test(a)).map(a => parseInt(a, 10)).filter(n => n > 0 && n <= MIC_MAX);
  const n = Math.min(MIC_MAX, Math.ceil(Math.max(MIC.cap || MIC_ASIENTOS, MIC_ABAJO, ...nums) / 4) * 4);
  const lista = [];
  for(let i = 1; i <= n; i++) lista.push(String(i));
  claves.filter(a => !lista.includes(a)).sort().forEach(a => lista.push(a)); // números raros, al final
  return lista;
}
function microPisos(){
  // Arriba van del 1 en adelante; los últimos 12 números son el piso de abajo.
  const l = microAsientos(), base = l.filter(a => /^\d+$/.test(a) && parseInt(a, 10) <= MIC_MAX), raros = l.filter(a => !base.includes(a));
  return { arriba: base.slice(0, -MIC_ABAJO).concat(raros), abajo: base.slice(-MIC_ABAJO) };
}
function microPisoDe(a){ return microPisos().arriba.includes(String(a)) ? 'arriba' : 'abajo'; }

// 'libre' (nadie), 'micro' (sentado, en la Estación) o 'plaza' (paseando por una parada).
function microEstado(a){
  if(String(a) === String(miAsiento)) return typeof plz !== 'undefined' && plz.activo && plz.conectado ? 'plaza' : 'micro';
  if(!MIC.pas[a]) return 'libre';
  return MIC.pres[a] ? 'plaza' : 'micro';
}

// La presencia está en plaza/{parada}/{sala}/{asiento}.
function microLeerPresencia(raiz){
  const ahora = typeof plazaAhora === 'function' ? plazaAhora() : Date.now();
  const pres = {};
  Object.keys(raiz || {}).forEach(sector => {
    const salas = raiz[sector];
    if(!salas || typeof salas !== 'object' || typeof salas.x === 'number') return;
    Object.keys(salas).forEach(sala => Object.keys(salas[sala] || {}).forEach(a => {
      const d = salas[sala][a];
      if(!d || typeof d.x !== 'number' || ahora - (d.t || 0) > PLZ.VIVO_MS) return;
      if(!pres[a] || (d.t || 0) > pres[a].t) pres[a] = { sector, sala, x: d.x, y: d.y, t: d.t || 0 };
    }));
  });
  return pres;
}

// ---- Abrir y cerrar ----

function microContenedor(){
  const a = document.querySelector('.view.active');
  return document.getElementById(a && a.id === 'view-estacion' ? 'estacion-micro' : 'plaza-micro');
}

// Desde el botón 🚌 de los mapas: abre directo en las paradas.
function microAbrirParadas(){ microAbrir('paradas'); }

function microAbrir(tab){
  if(!micEnLinea()){ micToast('Entrá a un viaje para ver el micro'); return; }
  microSoltar();
  MIC.abierto = true; MIC.tab = tab === 'paradas' ? 'paradas' : 'asientos'; MIC.sel = String(miAsiento); MIC.pas = {}; MIC.pres = {};
  MIC.piso = null;
  const escuchar = (ruta, f) => { const r = db.ref('salas/' + codigoViaje + '/' + ruta); const cb = r.on('value', s => { f(s.val()); microPintar(); }); MIC.oyentes.push({ r, cb }); };
  escuchar('ranking/puntos', v => { MIC.pas = v || {}; if(!MIC.piso) MIC.piso = microPisoDe(miAsiento); });
  escuchar('plaza', v => { MIC.pres = microLeerPresencia(v); });
  db.ref('salas/' + codigoViaje + '/capacidad').once('value').then(s => { MIC.cap = Number(s.val()) || 0; microPintar(); });
  const cont = microContenedor();
  if(!cont) return;
  cont.innerHTML = `<div class="plz-modal"><div class="plz-modal-caja mic-caja">
    <h3 class="fer-titulo">🚌 Micro de dos pisos</h3>
    <div class="mic-modos"><button id="mic-modo-paradas" onclick="microModo('paradas')">🗺️ Paradas</button><button id="mic-modo-asientos" onclick="microModo('asientos')">💺 Asientos</button></div>
    <div id="mic-cuerpo"></div></div></div>`;
  MIC.piso = MIC.piso || microPisoDe(miAsiento);
  microPintar();
}

function microModo(t){ MIC.tab = t; microPintar(); }

function microSoltar(){
  MIC.oyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  MIC.oyentes = [];
}

function microCerrar(){
  micCerrarSiempre();
}
function micCerrarSiempre(){
  MIC.abierto = false;
  microSoltar();
  ['plaza-micro', 'estacion-micro'].forEach(id => { const c = document.getElementById(id); if(c) c.innerHTML = ''; });
}

// ---- Pintar ----

function microAsientoHTML(a){
  const p = MIC.pas[a], st = microEstado(a), yo = String(a) === String(miAsiento);
  const dibujo = p || yo
    ? (typeof avatarMiniHTML === 'function' ? avatarMiniHTML(yo && typeof avatarPuestoActual === 'function' ? avatarPuestoActual() : (p && p.avatar) || {}, 34) : '🙂')
    : '<span class="mic-vacio">💺</span>';
  return `<button class="mic-asiento ${st}${yo ? ' yo' : ''}${MIC.sel === String(a) ? ' sel' : ''}" data-a="${micEsc(a)}" onclick="microElegir(this.dataset.a)"><b>${micEsc(a)}</b>${dibujo}${st === 'plaza' ? '<em>🚶</em>' : ''}</button>`;
}

function microFilaHTML(fila){
  const c = i => fila[i] != null ? microAsientoHTML(fila[i]) : '<span class="mic-hueco"></span>';
  return `<div class="mic-fila">${c(0)}${c(1)}<span class="mic-pasillo"></span>${c(2)}${c(3)}</div>`;
}

function microDetalleHTML(){
  const a = MIC.sel;
  if(a == null) return '<p class="fer-sub">Tocá un asiento para ver quién es.</p>';
  const p = MIC.pas[a], yo = String(a) === String(miAsiento), st = microEstado(a);
  if(!p && !yo) return `<p class="fer-texto">Asiento ${micEsc(a)}: <b>libre</b></p>`;
  const nombre = yo ? 'Vos' : (p.nombre || 'Pasajero');
  const dibujo = typeof avatarSVG === 'function' ? avatarSVG(yo && typeof avatarPuestoActual === 'function' ? avatarPuestoActual() : (p && p.avatar) || {}, 58) : '';
  const pr = yo ? (typeof plz !== 'undefined' && plz.activo ? { sector: plz.sector, sala: plz.sala } : null) : MIC.pres[a];
  const sec = pr && PLZ_SECTORES[pr.sector];
  const donde = st === 'plaza'
    ? `🚶 Paseando${sec ? ' por ' + micEsc(sec.emoji + ' ' + sec.corto) : ''}${!yo && pr && typeof plazaEtiquetaSala === 'function' ? ' · ' + micEsc(plazaEtiquetaSala(pr.sala)) : ''}`
    : '💺 En el micro, en su asiento';
  const boton = (!yo && st === 'plaza' ? `<button class="gbtn gbtn-ancho" data-a="${micEsc(a)}" onclick="microBuscar(this.dataset.a)">📍 Ir a buscar a ${micEsc(nombre)}</button>` : '')
    + (!yo && p && typeof cartitasActivas === 'function' && cartitasActivas() ? `<button class="gbtn gbtn-ancho" data-a="${micEsc(a)}" onclick="cartitasNuevaPara(this.dataset.a)">💌 Mandar una cartita</button>` : '');
  return `<div class="mic-detalle"><div class="mic-det-av">${dibujo}</div><div><div class="fer-texto"><b>${micEsc(nombre)}</b></div><div class="fer-sub">Asiento ${micEsc(a)}${p && p.curso ? ' · ' + micEsc(p.curso) : ''}<br>${donde}</div></div></div>${boton}`;
}

function microPintar(){
  const cont = document.getElementById('mic-cuerpo');
  if(!cont || !MIC.abierto) return;
  ['paradas', 'asientos'].forEach(t => { const b = document.getElementById('mic-modo-' + t); if(b) b.className = MIC.tab === t ? 'on' : ''; });
  const enMapa = typeof plz !== 'undefined' && plz.activo && document.querySelector('.view.active') && document.querySelector('.view.active').id === 'view-plaza';
  if(MIC.tab === 'paradas'){
    cont.innerHTML = `<p class="fer-sub">Viaje libre: elegí a qué parada querés ir, cuando quieras.</p>
      <div class="est-lista est-lista-chica">${mundoParadasHTML(mundoContar(MIC.pres), enMapa ? plz.sector : null, 'mundoIrA')}</div>
      <div class="fer-botones">${enMapa ? '<button class="gbtn gbtn-ancho" onclick="microVolver()">🚌 Ir a la Estación</button>' : ''}<button class="gbtn gbtn-ancho gbtn-no" onclick="microCerrar()">Cerrar</button></div>`;
    return;
  }
  const pisos = microPisos();
  const piso = MIC.piso || 'abajo';
  const lista = pisos[piso];
  const filas = [];
  for(let i = 0; i < lista.length; i += 4) filas.push(lista.slice(i, i + 4));
  const sentados = Object.keys(MIC.pas).filter(a => microEstado(a) === 'micro').length + (MIC.pas[String(miAsiento)] ? 0 : (enMapa ? 0 : 1));
  const afuera = Object.keys(MIC.pas).filter(a => microEstado(a) === 'plaza').length + (MIC.pas[String(miAsiento)] ? 0 : (enMapa ? 1 : 0));
  const tab = (id, txt) => `<button class="mic-tab ${piso === id ? 'on' : ''}" onclick="microPiso('${id}')">${txt}</button>`;
  cont.innerHTML = `
    <div class="mic-buscar"><input type="number" inputmode="numeric" min="1" placeholder="Buscar asiento nº" oninput="microBuscarNumero(this.value)"></div>
    <div class="mic-resumen"><span>💺 En el micro <b>${sentados}</b></span><span>🚶 Paseando <b>${afuera}</b></span></div>
    <div class="mic-tabs">${tab('arriba', '⬆️ Piso de arriba')}${tab('abajo', '⬇️ Piso de abajo')}</div>
    <div class="mic-bus mic-${piso}">
      ${piso === 'abajo' ? '<div class="mic-frente">🧑‍✈️ Chofer</div>' : '<div class="mic-frente">🌄 Vista panorámica</div>'}
      ${filas.length ? filas.map(microFilaHTML).join('') : '<div class="fer-vacio">No hay asientos en este piso.</div>'}
    </div>
    <div class="mic-detalle-caja">${microDetalleHTML()}</div>
    <div class="fer-botones">
      ${enMapa ? '<button class="gbtn gbtn-ancho" onclick="microVolver()">🚌 Ir a la Estación</button>' : ''}<button class="gbtn gbtn-ancho gbtn-no" onclick="microCerrar()">Cerrar</button>
    </div>`;
}

function microPiso(id){ MIC.piso = id; microPintar(); }
function microElegir(a){ MIC.sel = String(a); microPintar(); }

function microBuscarNumero(v){
  const a = String(parseInt(v, 10));
  if(!v || a === 'NaN' || !microAsientos().includes(a)) return;
  MIC.sel = a; MIC.piso = microPisoDe(a);
  microPintar();
}

// ---- Volver a la Estación y buscar ----

// "Volver al micro" = ir a la Estación: se sale de la sala del mapa (los demás dejan de verme).
function microVolver(auto){
  micCerrarSiempre();
  if(typeof showView === 'function') showView('estacion');
  micToast(auto ? '🚌 Volviste a la Estación porque no hacías nada. ¡Subite a otra parada cuando quieras!' : '🚌 Volviste a la Estación');
}

// Va a la parada y a la sala de esa persona y camina hasta ella.
async function microBuscar(a){
  const pr = MIC.pres[a];
  if(!pr){ micToast('Ya no está paseando por ahí'); microPintar(); return; }
  const nombre = String((MIC.pas[a] && MIC.pas[a].nombre) || 'Pasajero');
  micCerrarSiempre();
  const vista = document.querySelector('.view.active');
  const enMapa = vista && vista.id === 'view-plaza' && plz.activo;
  const marca = { a: String(a), hasta: performance.now() + 30000, sigue: true, nombre };
  if(enMapa && pr.sector === plz.sector){
    if(String(pr.sala) !== String(plz.sala)) await plazaIrASala(pr.sala);
    plz.buscado = marca;
  } else {
    plz.sector = pr.sector; plz.salaPreferida = pr.sala; plz.posGuardada = null; plz.buscadoPendiente = marca;
    if(enMapa) iniciarPlaza(); else showView('plaza');
  }
  micToast('📍 Yendo a buscar a ' + nombre);
}

// ---- Inactividad (se llama en cada cuadro de la plaza) ----

function microControlarInactividad(ahora){
  if(!plz.conectado) return;
  if(!plz.ultimaActividad || plz.caminando || plz.obj || plz.pose || plz.menuAbierto || (typeof feria !== 'undefined' && (feria.dentro || feria.panel))) plz.ultimaActividad = ahora;
  const quieto = ahora - plz.ultimaActividad;
  if(quieto > MIC_INACTIVO_MS){ microVolver(true); return; }
  if(quieto > MIC_AVISO_MS && !MIC.avisado){ MIC.avisado = true; micToast('Si no hacés nada, en 30 segundos volvés a la Estación 🚌'); }
  if(quieto < MIC_AVISO_MS) MIC.avisado = false;
}

// Marca "buscado": un aro y una flecha sobre la persona, y un cartel en el borde si queda fuera de la pantalla.
function microDibujarBuscado(ctx, ahoraMs){
  const b = plz.buscado;
  if(!b) return;
  if(ahoraMs > b.hasta){ plz.buscado = null; return; }
  const o = plz.otros[b.a];
  if(!o) return;
  const d = Math.hypot(o.x - plz.yo.x, o.y - plz.yo.y);
  if(b.sigue && d < 45){ b.sigue = false; plz.obj = null; b.hasta = Math.min(b.hasta, ahoraMs + 6000); }
  else if(b.sigue) plz.obj = { x: o.x, y: o.y + 14 };
  const pulso = Math.sin(plz.t * 7);
  ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(o.x, o.y, 24 + pulso * 3, 10 + pulso * 1.5, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = '#FFD84D';
  const fy = o.y - 100 + Math.abs(pulso) * 5;
  ctx.beginPath(); ctx.moveTo(o.x - 9, fy); ctx.lineTo(o.x + 9, fy); ctx.lineTo(o.x, fy + 13); ctx.fill();
}

// Cartel fijo al borde de la pantalla apuntando a quien se busca (se dibuja sin mover la cámara).
function microDibujarFlechaBorde(ctx){
  const b = plz.buscado, o = b && plz.otros[b.a];
  if(!o) return;
  const sx = o.x - plz.cam.x, sy = o.y - plz.cam.y - 28;
  if(sx > 18 && sx < PLZ.VW - 18 && sy > 18 && sy < PLZ.VH - 18) return;
  const x = Math.max(24, Math.min(PLZ.VW - 24, sx)), y = Math.max(24, Math.min(PLZ.VH - 24, sy));
  ctx.fillStyle = '#0F2A4D'; ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill();
  ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '800 15px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('📍', x, y + 1);
  ctx.font = '700 9px Poppins, sans-serif';
  ctx.fillStyle = 'rgba(15,42,77,.85)'; const w = ctx.measureText(b.nombre).width + 8;
  const ty = y > PLZ.VH / 2 ? y - 28 : y + 28;
  arcRR(ctx, x - w / 2, ty - 7, w, 14, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(b.nombre, x, ty);
}

// ---- El edificio del micro en el mapa ----

function plazaDibujarMicro(ctx, e){
  ctx.fillStyle = 'rgba(0,0,0,.14)'; arcRR(ctx, e.x + 4, e.y + 10, e.w, e.h, 14); ctx.fill();
  // Carrocería de dos pisos
  ctx.fillStyle = e.color; arcRR(ctx, e.x, e.y, e.w, e.h - 10, 14); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(e.x, e.y + (e.h - 10) / 2 - 2, e.w, 4);
  for(let piso = 0; piso < 2; piso++){
    for(let i = 0; i < 7; i++){
      const wx = e.x + 14 + i * 40, wy = e.y + 12 + piso * 40;
      if(piso === 1 && i === 3){ arcLogo(ctx, wx + 15, wy + 12, 28, '#fff'); continue; }
      ctx.fillStyle = 'rgba(190,230,255,.92)';
      arcRR(ctx, wx, wy, 30, 24, 5); ctx.fill();
    }
  }
  // Ruedas
  [e.x + 52, e.x + e.w - 52].forEach(rx => {
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(rx, e.y + e.h - 10, 14, 0, 7); ctx.fill();
    ctx.fillStyle = '#B8C2D1'; ctx.beginPath(); ctx.arc(rx, e.y + e.h - 10, 6, 0, 7); ctx.fill();
  });
  ctx.fillStyle = '#fff'; ctx.font = '800 10px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('MICRO DE DOS PISOS', e.x + e.w / 2, e.y + 44);
  // Baldosa de entrada
  const z = plazaZonaPuerta(e);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; arcRR(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
  ctx.fillStyle = '#0F2A4D'; ctx.font = '800 11px Poppins, sans-serif';
  ctx.fillText('🚌 Subir', z.x + z.w / 2, z.y + z.h / 2);
}
