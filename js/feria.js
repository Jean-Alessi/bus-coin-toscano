// Feria de la Plaza: puestos donde cada pasajero puede pasar UNA vez.
//   🍬 Kiosco: pide una golosina de cortesía; el coordinador se la lleva al asiento.
//   ✈️ Agencia: ve las promos de viajes y pide un descuento (queda un código y un
//      aviso para que la agencia lo contacte).
//   🎟️ Sorteo: retira su número (el organizador lo habilita y hace el sorteo).
// En cada puesto entra una persona por vez; las demás hacen fila y entran solas
// cuando les toca. Todo vive en Firebase dentro del viaje:
//   salas/{viaje}/feria/{puesto}/{adentro, fila, hecho}   estado de cada puesto
//   salas/{viaje}/feriaConfig                              menú y promos del organizador
//   salas/{viaje}/pedidos/{asiento}                        pedidos del kiosco
//   salas/{viaje}/consultas/{asiento}                      pedidos de descuento
//   salas/{viaje}/sorteo/{activo, premio, proximo, numeros, ganador}

const FERIA_DEFECTO = {
  kiosco: ['Alfajor', 'Caramelos', 'Bombón', 'Chicle', 'Turrón'],
  promos: [
    { t: 'Bariloche 7 noches', d: 'Aéreo, hotel y excursiones', off: 10 },
    { t: 'Mendoza fin de semana largo', d: 'Bodegas y alta montaña', off: 8 },
    { t: 'Viaje de egresados 2027', d: 'Reservá tu lugar hoy', off: 5 },
  ],
};
const FERIA_VIVO_MS = 60000; // si alguien deja de dar señales adentro de un puesto, se libera
const FERIA_EMOJIS = { alfajor: '🍪', caramelos: '🍬', bombon: '🍫', 'bombón': '🍫', chicle: '🫧', turron: '🥜', 'turrón': '🥜', mate: '🧉', agua: '💧', gaseosa: '🥤', galletitas: '🍪', chocolate: '🍫' };
const FERIA_NOMBRES = { kiosco: 'Kiosco', agencia: 'Agencia de viajes', sorteo: 'Sorteo' };

const feria = { activa: false, stands: {}, config: null, sorteo: null, pedido: null, oyentes: [], dentro: null, latido: null, panel: null, avisados: {}, tomando: {} };

const feriaEsc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const feriaYo = () => String(miAsiento);
const feriaEnLinea = () => !!(typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre);
function feriaRef(ruta){ return db.ref('salas/' + codigoViaje + '/' + ruta); }
function feriaAhora(){ return typeof plazaAhora === 'function' ? plazaAhora() : Date.now(); }
function feriaToast(m, tipo){ if(typeof mostrarToast === 'function') mostrarToast(m, tipo); }

// ---- Datos ----

function feriaListaDe(v){ return Array.isArray(v) ? v.filter(x => x != null) : (v ? Object.keys(v).map(k => v[k]) : []); }

function feriaKiosco(){
  const l = feriaListaDe(feria.config && feria.config.kiosco).map(String).filter(Boolean);
  return l.length ? l : FERIA_DEFECTO.kiosco;
}
function feriaPromos(){
  const l = feriaListaDe(feria.config && feria.config.promos).filter(p => p && p.t);
  return l.length ? l : FERIA_DEFECTO.promos;
}

function feriaStand(id){
  const crudo = feria.stands[id] || {};
  const ahora = feriaAhora();
  const adentro = crudo.adentro && (ahora - (crudo.adentro.t || 0) < FERIA_VIVO_MS) ? crudo.adentro : null;
  const fila = Object.keys(crudo.fila || {}).map(a => ({ a, n: crudo.fila[a].n, o: crudo.fila[a].o || 0 })).sort((x, y) => x.o - y.o);
  const hecho = !!(crudo.hecho && crudo.hecho[feriaYo()]);
  return { adentro, fila, hecho };
}

function feriaSubtitulo(id){
  if(!feriaEnLinea()) return 'Disponible cuando estés en un viaje';
  const s = feriaStand(id);
  if(s.hecho) return 'Ya pasaste por acá ✅';
  if(feria.dentro === id) return 'Estás adentro';
  const pos = s.fila.findIndex(f => f.a === feriaYo());
  if(pos >= 0) return 'Sos el ' + (pos + 1) + '° en la fila';
  if(s.adentro) return 'Ocupado' + (s.fila.length ? ' · ' + s.fila.length + ' en la fila' : ' · tocá para hacer la fila');
  if(s.fila.length) return 'Hay fila · tocá para sumarte';
  return 'Libre: pasá cuando quieras';
}

// Texto corto que se dibuja arriba de cada puesto en la plaza.
function feriaInsignia(id){
  if(!feria.activa) return null;
  const s = feriaStand(id);
  if(s.fila.length) return '👥 ' + s.fila.length;
  if(s.adentro) return '🔒';
  return null;
}

// ---- Conexión ----

function feriaIniciar(){
  feriaAlSalir();
  feria.activa = true;
  feria.stands = {}; feria.config = null; feria.sorteo = null; feria.pedido = null; feria.panel = null;
  if(!feriaEnLinea()) return;
  const escuchar = (ruta, f) => { const r = feriaRef(ruta); const cb = r.on('value', s => f(s.val())); feria.oyentes.push({ r, cb }); };
  escuchar('feria', v => { feria.stands = v || {}; feriaAlCambiar(); });
  escuchar('feriaConfig', v => { feria.config = v; feriaRenderPanel(); });
  escuchar('sorteo', v => { feria.sorteo = v; feriaAvisarGanador(); feriaRenderPanel(); });
  escuchar('pedidos/' + feriaYo(), v => {
    if(feria.pedido && feria.pedido.estado !== 'entregado' && v && v.estado === 'entregado') feriaToast('¡Ya te llevaron tu ' + v.item + '! 🎉', 'gain');
    feria.pedido = v; feriaRenderPanel();
  });
}

function feriaAlSalir(){
  feria.oyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  feria.oyentes = [];
  if(feriaEnLinea()){
    try {
      if(feria.dentro) feriaRef('feria/' + feria.dentro + '/adentro').remove();
      Object.keys(FERIA_NOMBRES).forEach(id => { if(feria.stands[id] && feria.stands[id].fila && feria.stands[id].fila[feriaYo()]) feriaRef('feria/' + id + '/fila/' + feriaYo()).remove(); });
    } catch(e){}
  }
  clearInterval(feria.latido); feria.latido = null;
  feria.dentro = null; feria.activa = false; feria.panel = null;
  const modal = document.getElementById('plaza-modal'); if(modal) modal.innerHTML = '';
}

// Cuando cambia algo en los puestos: refresca los textos y entra solo al que le toca.
function feriaAlCambiar(){
  if(typeof plazaRenderAccion === 'function') plazaRenderAccion();
  Object.keys(FERIA_NOMBRES).forEach(id => {
    const s = feriaStand(id);
    const pos = s.fila.findIndex(f => f.a === feriaYo());
    if(pos === 0 && !s.adentro && feria.dentro !== id && !feria.tomando[id] && !s.hecho){
      feria.tomando[id] = true;
      feriaToast('¡Te toca en ' + FERIA_NOMBRES[id] + '!', 'gain');
      feriaTomarLugar(id);
    }
  });
  if(feria.panel && feria.panel.modo === 'fila') feriaRenderPanel();
}

// ---- Entrar, hacer fila, salir ----

function feriaIntentar(id){
  if(!feriaEnLinea()){ feriaToast('Entrá a un viaje para usar la feria'); return; }
  const s = feriaStand(id);
  if(s.hecho){ feria.panel = { id, modo: 'ya' }; feriaRenderPanel(); return; }
  if(feria.dentro === id){ feria.panel = { id, modo: 'dentro' }; feriaRenderPanel(); return; }
  if(s.fila.some(f => f.a === feriaYo())){ feria.panel = { id, modo: 'fila' }; feriaRenderPanel(); return; }
  if(feria.dentro){ feriaToast('Primero terminá en el otro puesto'); return; }
  if(!s.adentro && !s.fila.length) feriaTomarLugar(id);
  else feriaHacerFila(id);
}

function feriaTomarLugar(id){
  const ref = feriaRef('feria/' + id + '/adentro');
  ref.transaction(actual => {
    const libre = !actual || feriaAhora() - (actual.t || 0) >= FERIA_VIVO_MS || String(actual.a) === feriaYo();
    return libre ? { a: feriaYo(), n: miNombre, t: feriaAhora() } : undefined;
  }).then(r => {
    feria.tomando[id] = false;
    if(r && r.committed){
      feria.dentro = id;
      try { ref.onDisconnect().remove(); } catch(e){}
      feriaQuitarDeFila(id);
      clearInterval(feria.latido);
      feria.latido = setInterval(() => { if(feria.dentro) feriaRef('feria/' + feria.dentro + '/adentro').update({ t: feriaAhora() }); }, 15000);
      feria.panel = { id, modo: 'dentro' };
      feriaRenderPanel();
      if(typeof plazaRenderAccion === 'function') plazaRenderAccion();
    } else {
      feriaHacerFila(id);
    }
  });
}

function feriaHacerFila(id){
  const ref = feriaRef('feria/' + id + '/fila/' + feriaYo());
  ref.set({ n: String(miNombre).slice(0, 14), o: firebase.database.ServerValue.TIMESTAMP });
  try { ref.onDisconnect().remove(); } catch(e){}
  feria.panel = { id, modo: 'fila' };
  feriaRenderPanel();
}

function feriaQuitarDeFila(id){ feriaRef('feria/' + id + '/fila/' + feriaYo()).remove(); }

function feriaSalirDeLaFila(){
  if(feria.panel) feriaQuitarDeFila(feria.panel.id);
  feriaCerrarPanel();
}

function feriaSalirDelPuesto(){
  if(feria.dentro){ feriaRef('feria/' + feria.dentro + '/adentro').remove(); }
  clearInterval(feria.latido); feria.latido = null;
  feria.dentro = null;
}

function feriaCerrarPanel(){
  if(feria.dentro) feriaSalirDelPuesto();
  feria.panel = null;
  feriaRenderPanel();
  if(typeof plazaRenderAccion === 'function') plazaRenderAccion();
}

// ---- Pantallas de cada puesto ----

function feriaEmojiDe(item){ return FERIA_EMOJIS[String(item).toLowerCase()] || '🍬'; }

function feriaRenderPanel(){
  const cont = document.getElementById('plaza-modal');
  if(!cont) return;
  const p = feria.panel;
  if(!p){ cont.innerHTML = ''; return; }
  const nombre = FERIA_NOMBRES[p.id];
  let cuerpo = '', botones = '';
  const cerrar = '<button class="gbtn gbtn-ancho gbtn-no" onclick="feriaCerrarPanel()">Salir</button>';

  if(p.modo === 'fila'){
    const s = feriaStand(p.id);
    const pos = s.fila.findIndex(f => f.a === feriaYo());
    cuerpo = `<p class="fer-texto">Estás en la fila. ${s.adentro ? 'Ahora está adentro <b>' + feriaEsc(s.adentro.n) + '</b>.' : ''}</p><div class="fer-pos">${pos >= 0 ? pos + 1 : '-'}°</div><p class="fer-sub">de ${s.fila.length} en la fila. Cuando sea tu turno entrás solo, podés seguir caminando.</p>`;
    botones = '<button class="gbtn gbtn-ancho gbtn-no" onclick="feriaSalirDeLaFila()">Salir de la fila</button>';
  } else if(p.modo === 'ya'){
    if(p.id === 'kiosco'){
      const ped = feria.pedido;
      cuerpo = ped ? `<div class="fer-grande">${feriaEmojiDe(ped.item)}</div><p class="fer-texto">Ya pediste: <b>${feriaEsc(ped.item)}</b></p><p class="fer-sub">${ped.estado === 'entregado' ? '¡Entregado! ✅' : 'El coordinador te lo lleva a tu asiento.'}</p>` : '<p class="fer-texto">Ya pasaste por el kiosco.</p>';
    } else if(p.id === 'agencia'){
      cuerpo = '<p class="fer-texto">Ya pediste tu descuento. Mostrá tu código en la agencia, o buscalo en tu consulta.</p>';
      const c = feria.stands.agencia && feria.stands.agencia.hecho && feria.stands.agencia.hecho[feriaYo()];
      if(c && c.cupon) cuerpo = `<div class="fer-cupon">${feriaEsc(c.cupon)}</div><p class="fer-texto">Tu código de descuento: <b>${feriaEsc(c.promo || '')}</b> (${Number(c.off) || 0}% menos)</p><p class="fer-sub">Mostralo en la agencia. Un asesor también va a contactarte en el viaje.</p>`;
    } else {
      const c = feria.stands.sorteo && feria.stands.sorteo.hecho && feria.stands.sorteo.hecho[feriaYo()];
      cuerpo = `<p class="fer-texto">Ya retiraste tu número:</p><div class="fer-pos">${c && c.num ? '#' + c.num : '?'}</div>${feriaSorteoEstadoHTML()}`;
    }
    botones = cerrar;
  } else if(p.modo === 'resultado'){
    cuerpo = p.html;
    botones = '<button class="gbtn gbtn-ancho" onclick="feriaCerrarPanel()">¡Gracias!</button>';
  } else { // dentro
    if(p.id === 'kiosco'){
      cuerpo = `<h3 class="fer-titulo">🍬 Kiosco</h3><p class="fer-texto">Elegí una golosina de cortesía. ¡El coordinador te la lleva a tu asiento! Podés pedir una sola vez.</p><div class="fer-items">${feriaKiosco().map((it, i) => `<button class="fer-item" onclick="feriaPedirKiosco(${i})"><span>${feriaEmojiDe(it)}</span>${feriaEsc(it)}</button>`).join('')}</div>`;
    } else if(p.id === 'agencia'){
      cuerpo = `<h3 class="fer-titulo">✈️ Agencia de viajes</h3><p class="fer-texto">Mirá las promos y pedí tu descuento. Podés elegir una sola vez.</p><div class="fer-promos">${feriaPromos().map((pr, i) => `<div class="fer-promo"><div><b>${feriaEsc(pr.t)}</b><div class="fer-sub">${feriaEsc(pr.d || '')}</div></div><button class="gbtn gbtn-chico-texto" onclick="feriaPedirPromo(${i})">${Number(pr.off) ? pr.off + '% off' : 'Quiero'}</button></div>`).join('')}</div>`;
    } else {
      const sorteo = feria.sorteo || {};
      if(!sorteo.activo) cuerpo = '<h3 class="fer-titulo">🎟️ Sorteo</h3><p class="fer-texto">El sorteo todavía no está abierto. Pasá más tarde: el coordinador lo avisa.</p>';
      else cuerpo = `<h3 class="fer-titulo">🎟️ Sorteo</h3>${sorteo.premio ? `<p class="fer-texto">Premio: <b>${feriaEsc(sorteo.premio)}</b></p>` : ''}<p class="fer-sub">Retirá tu número. Es uno por persona y el sorteo lo hace el coordinador.</p>`;
      botones = sorteo.activo ? '<button class="gbtn gbtn-ancho" onclick="feriaRetirarNumero()">🎟️ Retirar mi número</button>' : '';
    }
    botones += (botones ? '' : '') + `<button class="gbtn gbtn-ancho gbtn-no" onclick="feriaCerrarPanel()">Salir sin pedir</button>`;
  }
  cont.innerHTML = `<div class="plz-modal"><div class="plz-modal-caja">${cuerpo}<div class="fer-botones">${botones}</div></div></div>`;
}

function feriaSorteoEstadoHTML(){
  const g = feria.sorteo && feria.sorteo.ganador;
  if(!g) return '<p class="fer-sub">El coordinador anuncia el ganador en la plaza.</p>';
  return `<p class="fer-texto">🎉 Ganó el número <b>#${g.num}</b> (${feriaEsc(g.n || '')})</p>`;
}

// ---- Acciones ----

function feriaTerminarPuesto(id, dato, html){
  feriaRef('feria/' + id + '/hecho/' + feriaYo()).set(dato || true);
  feriaSalirDelPuesto();
  feria.panel = { id, modo: 'resultado', html };
  feriaRenderPanel();
  if(typeof plazaRenderAccion === 'function') plazaRenderAccion();
  if(typeof reproducirTono === 'function') reproducirTono('bonus');
}

function feriaPedirKiosco(i){
  if(feria.dentro !== 'kiosco') return;
  const item = feriaKiosco()[i];
  if(!item) return;
  feriaRef('pedidos/' + feriaYo()).set({ n: String(miNombre).slice(0, 30), item, t: firebase.database.ServerValue.TIMESTAMP, estado: 'pendiente' });
  feriaTerminarPuesto('kiosco', { item, t: firebase.database.ServerValue.TIMESTAMP }, `<div class="fer-grande">${feriaEmojiDe(item)}</div><p class="fer-texto">¡Pedido listo! El coordinador te lleva <b>${feriaEsc(item)}</b> a tu asiento.</p>`);
}

function feriaCodigoCupon(){
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = 'BM-';
  for(let i = 0; i < 5; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return c;
}

function feriaPedirPromo(i){
  if(feria.dentro !== 'agencia') return;
  const pr = feriaPromos()[i];
  if(!pr) return;
  const cupon = feriaCodigoCupon();
  feriaRef('consultas/' + feriaYo()).set({ n: String(miNombre).slice(0, 30), promo: pr.t, off: Number(pr.off) || 0, cupon, t: firebase.database.ServerValue.TIMESTAMP, estado: 'nueva' });
  feriaTerminarPuesto('agencia', { promo: pr.t, off: Number(pr.off) || 0, cupon }, `<div class="fer-cupon">${cupon}</div><p class="fer-texto">Tu descuento en <b>${feriaEsc(pr.t)}</b>${Number(pr.off) ? ': <b>' + Number(pr.off) + '% menos</b>' : ''}.</p><p class="fer-sub">Mostrá este código en la agencia. Un asesor también va a contactarte durante el viaje.</p>`);
}

function feriaRetirarNumero(){
  if(feria.dentro !== 'sorteo' || !(feria.sorteo && feria.sorteo.activo)) return;
  feriaRef('sorteo/proximo').transaction(n => (n || 0) + 1).then(r => {
    if(!r || !r.committed) return;
    const num = r.snapshot.val();
    feriaRef('sorteo/numeros/' + feriaYo()).set({ num, n: String(miNombre).slice(0, 30), t: firebase.database.ServerValue.TIMESTAMP });
    feriaTerminarPuesto('sorteo', { num }, `<p class="fer-texto">Tu número del sorteo es:</p><div class="fer-pos">#${num}</div><p class="fer-sub">Guardalo. El coordinador anuncia el ganador en la plaza.</p>`);
  });
}

function feriaAvisarGanador(){
  const g = feria.sorteo && feria.sorteo.ganador;
  if(!g || feria.avisados[g.t]) return;
  feria.avisados[g.t] = true;
  const mio = feria.sorteo.numeros && feria.sorteo.numeros[feriaYo()] && feria.sorteo.numeros[feriaYo()].num === g.num;
  feriaToast(mio ? '🎉 ¡¡Ganaste el sorteo!! Número #' + g.num : '🎉 ¡Ganó el número #' + g.num + ' (' + (g.n || '') + ')!', 'gain');
}

// ---- Panel del organizador (botón 🎪 en Viajes) ----

let adminFeriaAbiertaPara = null;

function adminToggleFeria(codigo){
  adminFeriaAbiertaPara = adminFeriaAbiertaPara === codigo ? null : codigo;
  renderAdminViajes();
}

function adminFeriaGuardarMenu(codigo){
  const el = document.getElementById('admin-feria-menu-' + codigo);
  const items = (el ? el.value : '').split('\n').map(l => l.trim().slice(0, 30)).filter(Boolean).slice(0, 12);
  db.ref('salas/' + codigo + '/feriaConfig/kiosco').set(items.length ? items : null).then(() => { feriaToast('Menú del kiosco guardado'); renderAdminViajes(); });
}

function adminFeriaGuardarPromos(codigo){
  const el = document.getElementById('admin-feria-promos-' + codigo);
  const promos = (el ? el.value : '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 8).map(l => {
    const [t, d, off] = l.split('|').map(x => (x || '').trim());
    return { t: (t || '').slice(0, 50), d: (d || '').slice(0, 90), off: Math.max(0, Math.min(100, parseInt(off, 10) || 0)) };
  }).filter(p => p.t);
  db.ref('salas/' + codigo + '/feriaConfig/promos').set(promos.length ? promos : null).then(() => { feriaToast('Promos guardadas'); renderAdminViajes(); });
}

function adminFeriaGuardarSorteo(codigo){
  const act = document.getElementById('admin-feria-sorteo-activo-' + codigo);
  const premio = document.getElementById('admin-feria-sorteo-premio-' + codigo);
  db.ref('salas/' + codigo + '/sorteo').update({ activo: !!(act && act.checked), premio: (premio ? premio.value : '').trim().slice(0, 80) }).then(() => { feriaToast('Sorteo guardado'); renderAdminViajes(); });
}

function adminFeriaSortear(codigo){
  db.ref('salas/' + codigo + '/sorteo/numeros').once('value').then(snap => {
    const v = snap.val() || {};
    const claves = Object.keys(v);
    if(!claves.length){ feriaToast('Todavía nadie retiró un número'); return; }
    const a = claves[Math.floor(Math.random() * claves.length)];
    const g = { num: v[a].num, n: v[a].n || '', asiento: a, t: Date.now() };
    db.ref('salas/' + codigo + '/sorteo/ganador').set(g).then(() => { feriaToast('Ganó el #' + g.num + ' (' + g.n + ', asiento ' + a + ')', 'gain'); renderAdminViajes(); });
  });
}

function adminFeriaReiniciarSorteo(codigo){
  if(typeof confirm === 'function' && !confirm('¿Borrar los números repartidos y el ganador?')) return;
  const u = {}; ['numeros', 'ganador', 'proximo'].forEach(k => { u[k] = null; });
  db.ref('salas/' + codigo + '/sorteo').update(u).then(() => db.ref('salas/' + codigo + '/feria/sorteo/hecho').remove()).then(() => { feriaToast('Sorteo reiniciado'); renderAdminViajes(); });
}

function adminFeriaEntregar(codigo, asiento, entregado){
  db.ref('salas/' + codigo + '/pedidos/' + asiento + '/estado').set(entregado ? 'entregado' : 'pendiente').then(() => renderAdminViajes());
}

function adminFeriaPanelHTML(codigo, viaje){
  if(adminFeriaAbiertaPara !== codigo) return '';
  const cfg = (viaje && viaje.feriaConfig) || {};
  const menu = feriaListaDe(cfg.kiosco).length ? feriaListaDe(cfg.kiosco).map(String) : FERIA_DEFECTO.kiosco;
  const promos = feriaListaDe(cfg.promos).length ? feriaListaDe(cfg.promos) : FERIA_DEFECTO.promos;
  const sorteo = (viaje && viaje.sorteo) || {};
  const pedidos = (viaje && viaje.pedidos) || {};
  const consultas = (viaje && viaje.consultas) || {};
  const numeros = sorteo.numeros || {};
  const cuentaItems = {};
  Object.keys(pedidos).forEach(a => { if(pedidos[a].estado !== 'entregado') cuentaItems[pedidos[a].item] = (cuentaItems[pedidos[a].item] || 0) + 1; });
  const pendientesTxt = Object.keys(cuentaItems).map(k => k + ' ×' + cuentaItems[k]).join(' · ');
  const filasPedidos = Object.keys(pedidos).sort((x, y) => (pedidos[x].estado === 'entregado') - (pedidos[y].estado === 'entregado')).map(a => {
    const p = pedidos[a], ok = p.estado === 'entregado';
    return `<div class="fer-fila ${ok ? 'fer-fila-ok' : ''}"><span>Asiento <b>${feriaEsc(a)}</b> · ${feriaEsc(p.n || '')} · ${feriaEsc(p.item)}</span><button class="fer-mini" onclick="adminFeriaEntregar('${codigo}','${feriaEsc(a)}',${!ok})">${ok ? '✅ Entregado' : 'Marcar entregado'}</button></div>`;
  }).join('') || '<div class="fer-vacio">Todavía no hay pedidos.</div>';
  const filasConsultas = Object.keys(consultas).map(a => { const c = consultas[a]; return `<div class="fer-fila"><span>Asiento <b>${feriaEsc(a)}</b> · ${feriaEsc(c.n || '')} · ${feriaEsc(c.promo)} (${Number(c.off) || 0}%) · <b>${feriaEsc(c.cupon)}</b></span></div>`; }).join('') || '<div class="fer-vacio">Todavía no hay consultas.</div>';
  const g = sorteo.ganador;
  return `<div class="fer-admin">
    <div class="fer-admin-t">🍬 Menú del kiosco <small>(uno por línea)</small></div>
    <textarea id="admin-feria-menu-${codigo}" rows="4">${feriaEsc(menu.join('\n'))}</textarea>
    <button class="btn-primary" onclick="adminFeriaGuardarMenu('${codigo}')">Guardar menú</button>

    <div class="fer-admin-t">✈️ Promos de la agencia <small>(Título | detalle | descuento)</small></div>
    <textarea id="admin-feria-promos-${codigo}" rows="4">${feriaEsc(promos.map(p => [p.t, p.d || '', p.off || 0].join(' | ')).join('\n'))}</textarea>
    <button class="btn-primary" onclick="adminFeriaGuardarPromos('${codigo}')">Guardar promos</button>

    <div class="fer-admin-t">🎟️ Sorteo</div>
    <label class="fer-check"><input type="checkbox" id="admin-feria-sorteo-activo-${codigo}" ${sorteo.activo ? 'checked' : ''}> Sorteo abierto (se pueden retirar números)</label>
    <input type="text" id="admin-feria-sorteo-premio-${codigo}" value="${feriaEsc(sorteo.premio || '')}" placeholder="Premio (ej: una remera Busmac)">
    <button class="btn-primary" onclick="adminFeriaGuardarSorteo('${codigo}')">Guardar sorteo</button>
    <div class="fer-sub-admin">Números repartidos: <b>${Object.keys(numeros).length}</b>${g ? ' · Ganador: <b>#' + g.num + '</b> (' + feriaEsc(g.n || '') + ', asiento ' + feriaEsc(g.asiento || '') + ')' : ''}</div>
    <div class="fer-botones-admin"><button class="btn-primary" onclick="adminFeriaSortear('${codigo}')">🎲 Sortear ahora</button><button class="fer-mini" onclick="adminFeriaReiniciarSorteo('${codigo}')">Reiniciar</button></div>
    <div class="fer-aviso">Antes de sortear premios de verdad, consultá si tu provincia exige autorización para sorteos.</div>

    <div class="fer-admin-t">📦 Pedidos del kiosco ${pendientesTxt ? '<small>Falta entregar: ' + feriaEsc(pendientesTxt) + '</small>' : ''}</div>
    ${filasPedidos}
    <div class="fer-admin-t">🧾 Consultas de la agencia</div>
    ${filasConsultas}
  </div>`;
}
