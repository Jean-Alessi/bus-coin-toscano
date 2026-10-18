// Feria de la Plaza: puestos donde cada pasajero pasa a hacer algo.
//   🍬 Kiosco: golosina de cortesía que el coordinador lleva al asiento (una vez).
//   ✈️ Agencia: promos de viajes y un código de descuento (una vez).
//   🎟️ Sorteo: retira su número (una vez; lo habilita y sortea el organizador).
//   📻 Radio: vota la música del micro (una vez).
//   🧑‍✈️ Coordinador: pide algo para el viaje (manta, agua, cargar el celular...) o
//      avisa que cumple años. Un pedido por vez.
//   💊 Farmacia: avisa que se siente mal (dolor de cabeza, mareo...). Un pedido por
//      vez y siempre lo atiende el coordinador, que decide qué darle.
//   📮 Buzón: califica el viaje (una vez).
//   📋 Cartelera: horarios y actividades (se puede volver las veces que quiera).
// En los puestos con fila entra una persona por vez; las demás esperan y entran
// solas cuando les toca. El "Pasaporte" junta un sello por cada puesto visitado.
//
// Todo vive en Firebase dentro del viaje (salas/{viaje}/...):
//   feria/{puesto}/{adentro, fila, hecho, visitas}   estado de cada puesto
//   feriaConfig                                       menús y textos del organizador
//   pedidos, servicios, farmacia, consultas, cumples  lo que le llega al coordinador
//   radio/votos, encuestas, sorteo, pasaporte         votos, calificaciones, sorteo y premios
// El coordinador ve todo junto en la bandeja de pedidos (pedidos.js).

const FERIA_DEFECTO = {
  kiosco: ['Alfajor', 'Caramelos', 'Bombón', 'Chicle', 'Turrón'],
  promos: [
    { t: 'Bariloche 7 noches', d: 'Aéreo, hotel y excursiones', off: 10 },
    { t: 'Mendoza fin de semana largo', d: 'Bodegas y alta montaña', off: 8 },
    { t: 'Viaje de egresados 2027', d: 'Reservá tu lugar hoy', off: 5 },
  ],
  radio: ['Cumbia', 'Rock nacional', 'Pop', 'Reggaetón', 'Folklore', 'Cuarteto', 'Clásicos en español', 'Electrónica'],
  servicios: ['Una manta', 'Agua', 'Cargar el celular', 'Parada para el baño', 'Consulta al coordinador'],
  farmacia: ['Dolor de cabeza', 'Dolor de panza', 'Mareo o náuseas', 'Alergia', 'Curita o venda', 'Dolor de garganta'],
  barra: ['Jugo de naranja', 'Limonada', 'Gaseosa', 'Agua con gas', 'Café', 'Licuado de frutilla'],
  cartelera: ['08:00 | Salida', '12:30 | Parada para almorzar', '21:00 | Bingo en vivo', '22:00 | Trivia en vivo'],
};
const FERIA_VIVO_MS = 60000; // si alguien deja de dar señales adentro de un puesto, se libera
const FERIA_EMOJIS = { alfajor: '🍪', caramelos: '🍬', bombon: '🍫', 'bombón': '🍫', chicle: '🫧', turron: '🥜', 'turrón': '🥜', mate: '🧉', agua: '💧', gaseosa: '🥤', galletitas: '🍪', chocolate: '🍫' };
const FERIA_NOMBRES = { kiosco: 'Kiosco', agencia: 'Agencia de viajes', sorteo: 'Sorteo', radio: 'Radio del micro', coordinador: 'Coordinador', farmacia: 'Farmacia', buzon: 'Buzón del viaje', cartelera: 'Cartelera' };
const FERIA_EMOJI_PUESTO = { kiosco: '🍬', agencia: '✈️', sorteo: '🎟️', radio: '📻', coordinador: '🧑‍✈️', farmacia: '💊', buzon: '📮', cartelera: '📋' };
const FERIA_COLA = ['kiosco', 'agencia', 'sorteo', 'radio', 'coordinador', 'farmacia', 'buzon']; // puestos con fila
const FERIA_LIBRES = ['cartelera']; // sin fila: se puede volver
const FERIA_PREGUNTAS = ['¿Cómo fue el viaje en general?', '¿Cómo te atendió el coordinador?', '¿Volverías a viajar con nosotros?'];
const FERIA_PREMIO_PASAPORTE = 30; // monedas por completar el pasaporte

const feria = {
  activa: false, stands: {}, config: null, sorteo: null, radio: null, pedido: null, servicio: null, farm: null, pasaporte: null,
  cumple: false, cumples: null, oyentes: [], dentro: null, latido: null, panel: null, avisados: {}, tomando: {}, encuesta: [0, 0, 0], cumplesVistos: null,
};

const feriaEsc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const feriaYo = () => String(miAsiento);
const feriaEnLinea = () => !!(typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre);
function feriaRef(ruta){ return db.ref('salas/' + codigoViaje + '/' + ruta); }
function feriaAhora(){ return typeof plazaAhora === 'function' ? plazaAhora() : Date.now(); }
function feriaToast(m, tipo){ if(typeof mostrarToast === 'function') mostrarToast(m, tipo); }
const feriaTS = () => firebase.database.ServerValue.TIMESTAMP;

// ---- Datos ----

function feriaListaDe(v){ return Array.isArray(v) ? v.filter(x => x != null) : (v ? Object.keys(v).map(k => v[k]) : []); }
function feriaLista(clave){
  const l = feriaListaDe(feria.config && feria.config[clave]).map(String).filter(Boolean);
  return l.length ? l : FERIA_DEFECTO[clave];
}
function feriaKiosco(){ return feriaLista('kiosco'); }
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
  const visito = !!(crudo.visitas && crudo.visitas[feriaYo()]);
  return { adentro, fila, hecho, visito };
}

function feriaPendiente(id){
  if(id === 'coordinador') return feria.servicio && feria.servicio.estado === 'pendiente' ? feria.servicio : null;
  if(id === 'farmacia') return feria.farm && feria.farm.estado === 'pendiente' ? feria.farm : null;
  return null;
}

function feriaSubtitulo(id){
  if(!feriaEnLinea()) return 'Disponible cuando estés en un viaje';
  if(FERIA_LIBRES.includes(id)) return 'Pasá cuando quieras';
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
  if(!feria.activa || FERIA_LIBRES.includes(id)) return null;
  const s = feriaStand(id);
  if(s.fila.length) return '👥 ' + s.fila.length;
  if(s.adentro) return '🔒';
  return null;
}

// ---- Conexión ----

function feriaIniciar(){
  feriaAlSalir();
  feria.activa = true;
  Object.assign(feria, { stands: {}, config: null, sorteo: null, radio: null, pedido: null, servicio: null, farm: null, pasaporte: null, cumple: false, cumples: null, panel: null, cumplesVistos: null });
  if(!feriaEnLinea()) return;
  const yo = feriaYo();
  const escuchar = (ruta, f) => { const r = feriaRef(ruta); const cb = r.on('value', s => f(s.val())); feria.oyentes.push({ r, cb }); };
  escuchar('feria', v => { feria.stands = v || {}; feriaAlCambiar(); });
  escuchar('feriaConfig', v => { feria.config = v; feriaRenderPanel(); });
  escuchar('sorteo', v => { feria.sorteo = v; feriaAvisarGanador(); feriaRenderPanel(); });
  escuchar('radio', v => { feria.radio = v; feriaRenderPanel(); });
  escuchar('pasaporte/' + yo, v => { feria.pasaporte = v; feriaRenderPanel(); });
  escuchar('pedidos/' + yo, v => {
    if(feria.pedido && feria.pedido.estado !== 'entregado' && v && v.estado === 'entregado') feriaToast('¡Ya te llevaron tu ' + v.item + '! 🎉', 'gain');
    feria.pedido = v; feriaRenderPanel();
  });
  escuchar('servicios/' + yo, v => {
    if(feria.servicio && feria.servicio.estado === 'pendiente' && v && v.estado === 'atendido') feriaToast('El coordinador atendió tu pedido: ' + v.tipo, 'gain');
    feria.servicio = v; feriaRenderPanel();
  });
  escuchar('farmacia/' + yo, v => {
    if(feria.farm && feria.farm.estado === 'pendiente' && v && v.estado === 'atendido') feriaToast('El coordinador atendió tu pedido de farmacia', 'gain');
    feria.farm = v; feriaRenderPanel();
  });
  escuchar('cumples', v => {
    feria.cumples = v || {};
    feria.cumple = !!(v && v[yo]);
    // Aviso a todos cuando alguien nuevo avisa que cumple años (no con lo que ya había).
    if(feria.cumplesVistos){
      Object.keys(feria.cumples).forEach(a => { if(!feria.cumplesVistos[a] && a !== yo) feriaToast('🎂 ¡Hoy cumple años ' + (feria.cumples[a].n || 'alguien') + '!'); });
    }
    feria.cumplesVistos = Object.keys(feria.cumples).reduce((o, a) => { o[a] = true; return o; }, {});
  });
}

function feriaAlSalir(){
  feria.oyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  feria.oyentes = [];
  if(feriaEnLinea()){
    try {
      if(feria.dentro) feriaRef('feria/' + feria.dentro + '/adentro').remove();
      FERIA_COLA.forEach(id => { if(feria.stands[id] && feria.stands[id].fila && feria.stands[id].fila[feriaYo()]) feriaRef('feria/' + id + '/fila/' + feriaYo()).remove(); });
    } catch(e){}
  }
  clearInterval(feria.latido); feria.latido = null;
  feria.dentro = null; feria.activa = false; feria.panel = null;
  const modal = document.getElementById('plaza-modal'); if(modal) modal.innerHTML = '';
}

// Cuando cambia algo en los puestos: refresca los textos y entra solo al que le toca.
function feriaAlCambiar(){
  if(typeof plazaRenderAccion === 'function') plazaRenderAccion();
  FERIA_COLA.forEach(id => {
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

function feriaVisita(id){
  if(feriaEnLinea()) feriaRef('feria/' + id + '/visitas/' + feriaYo()).set(true);
}

function feriaIntentar(id){
  if(!feriaEnLinea()){ feriaToast('Entrá a un viaje para usar la feria'); return; }
  if(FERIA_LIBRES.includes(id)){ feriaVisita(id); feria.panel = { id, modo: 'dentro' }; feriaRenderPanel(); return; }
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
      feriaVisita(id);
      feria.encuesta = [0, 0, 0];
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
  ref.set({ n: String(miNombre).slice(0, 14), o: feriaTS() });
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

// ---- Pantallas ----

function feriaEmojiDe(item){ return FERIA_EMOJIS[String(item).toLowerCase()] || '🍬'; }
function feriaOpciones(items, funcion, clase){
  return `<div class="fer-items">${items.map((it, i) => `<button class="fer-item ${clase || ''}" onclick="${funcion}(${i})"><span>${clase === 'fer-item-txt' ? '' : feriaEmojiDe(it)}</span>${feriaEsc(it)}</button>`).join('')}</div>`;
}

function feriaVotosRadio(){
  const votos = (feria.radio && feria.radio.votos) || {};
  const canciones = feriaLista('radio');
  const cuenta = canciones.map(() => 0);
  Object.keys(votos).forEach(a => { if(cuenta[votos[a]] != null) cuenta[votos[a]]++; });
  return canciones.map((c, i) => ({ c, n: cuenta[i], i })).sort((x, y) => y.n - x.n || x.i - y.i);
}
function feriaRadioHTML(){
  const t = feriaVotosRadio();
  const total = t.reduce((s, x) => s + x.n, 0);
  return `<div class="fer-tabla">${t.slice(0, 4).map((x, k) => `<div class="fer-barra"><span>${k === 0 && x.n ? '🏆 ' : ''}${feriaEsc(x.c)}</span><i style="width:${total ? Math.round(x.n / total * 100) : 0}%"></i><b>${x.n}</b></div>`).join('')}</div>`;
}

function feriaRenderPanel(){
  const cont = document.getElementById('plaza-modal');
  if(!cont) return;
  const p = feria.panel;
  if(!p){ cont.innerHTML = ''; return; }
  let cuerpo = '', botones = '';
  const cerrar = '<button class="gbtn gbtn-ancho gbtn-no" onclick="feriaCerrarPanel()">Salir</button>';

  if(p.modo === 'pasaporte') {
    const d = feriaPasaporteDatos();
    cuerpo = `<h3 class="fer-titulo">📒 Pasaporte de la feria</h3><p class="fer-sub">Visitá cada puesto y juntá todos los sellos. Si lo completás, ganás ${FERIA_PREMIO_PASAPORTE} monedas para tu personaje${feria.sorteo && feria.sorteo.activo ? ' y un número extra del sorteo' : ''}.</p>
      <div class="fer-sellos">${d.sellos.map(s => `<div class="fer-sello ${s.ok ? 'ok' : ''}"><span>${FERIA_EMOJI_PUESTO[s.id]}</span><small>${feriaEsc(FERIA_NOMBRES[s.id])}</small>${s.ok ? '<b>✓</b>' : ''}</div>`).join('')}</div>
      <p class="fer-texto">${d.ok} de ${d.sellos.length} sellos</p>`;
    botones = d.reclamado ? '<p class="fer-sub">¡Ya cobraste tu premio del pasaporte! 🎉</p>' : (d.completo ? '<button class="gbtn gbtn-ancho" onclick="feriaReclamarPasaporte()">🎁 Reclamar mi premio</button>' : '');
    botones += cerrar;
  } else if(p.modo === 'tienda'){
    const s = feria.sorteo || {}, premio = s.premio || 'una remera Busmac';
    const nums = Object.keys(s.numeros || {}).length, mio = feria.stands.sorteo && feria.stands.sorteo.hecho && feria.stands.sorteo.hecho[feriaYo()];
    cuerpo = `<h3 class="fer-titulo">🛍️ Tienda Busmac</h3><div class="fer-grande">👕</div><p class="fer-texto">Se sortea: <b>${feriaEsc(premio)}</b></p>
      <p class="fer-sub">${s.activo ? 'El sorteo está abierto: retirá tu número en el puesto (uno por persona).' : 'El sorteo todavía no está abierto. El coordinador avisa cuándo.'}</p>
      <p class="fer-texto">${nums} número${nums === 1 ? '' : 's'} repartido${nums === 1 ? '' : 's'}${mio && mio.num ? ' · El tuyo: <b>#' + mio.num + '</b>' : ''}</p>
      ${s.ganador ? '<p class="fer-texto">🎉 Ganó el número <b>#' + s.ganador.num + '</b> (' + feriaEsc(s.ganador.n || '') + ')</p>' : ''}`;
    botones = (s.activo && !(mio && mio.num) ? '<button class="gbtn gbtn-ancho" onclick="feriaIrAlSorteo()">🎟️ Ir al puesto del sorteo</button>' : '') + cerrar;
  } else if(p.modo === 'escenario'){
    cuerpo = `<h3 class="fer-titulo">🎤 Escenario</h3><p class="fer-texto">Acá se juega en vivo con todo el micro.</p>`;
    botones = `<button class="gbtn gbtn-ancho" onclick="feriaIrA('triviavivo')">🧠 Trivia en vivo</button><button class="gbtn gbtn-ancho" onclick="feriaIrA('bingo')">🎱 Bingo</button>${cerrar}`;
  } else if(p.modo === 'foto'){
    cuerpo = `<h3 class="fer-titulo">📸 Foto grupal</h3><canvas id="fer-foto" width="600" height="420" class="fer-foto"></canvas><p class="fer-sub">Una foto con los personajes de tu sala y el marco de ${feriaEsc(typeof marcaCorta === 'function' ? marcaCorta() : 'la agencia')}.</p>`;
    botones = `<button class="gbtn gbtn-ancho" onclick="feriaGuardarFoto()">💾 Guardar foto</button>${(typeof navigator !== 'undefined' && navigator.share) ? '<button class="gbtn gbtn-ancho" onclick="feriaCompartirFoto()">📤 Compartir</button>' : ''}${cerrar}`;
  } else if(p.modo === 'fila'){
    const s = feriaStand(p.id);
    const pos = s.fila.findIndex(f => f.a === feriaYo());
    cuerpo = `<h3 class="fer-titulo">${FERIA_EMOJI_PUESTO[p.id]} ${feriaEsc(FERIA_NOMBRES[p.id])}</h3><p class="fer-texto">Estás en la fila. ${s.adentro ? 'Ahora está adentro <b>' + feriaEsc(s.adentro.n) + '</b>.' : ''}</p><div class="fer-pos">${pos >= 0 ? pos + 1 : '-'}°</div><p class="fer-sub">de ${s.fila.length} en la fila. Cuando sea tu turno entrás solo, podés seguir caminando.</p>`;
    botones = '<button class="gbtn gbtn-ancho gbtn-no" onclick="feriaSalirDeLaFila()">Salir de la fila</button>';
  } else if(p.modo === 'ya'){
    if(p.id === 'kiosco'){
      const ped = feria.pedido;
      cuerpo = ped ? `<div class="fer-grande">${feriaEmojiDe(ped.item)}</div><p class="fer-texto">Ya pediste: <b>${feriaEsc(ped.item)}</b></p><p class="fer-sub">${ped.estado === 'entregado' ? '¡Entregado! ✅' : 'El coordinador te lo lleva a tu asiento.'}</p>` : '<p class="fer-texto">Ya pasaste por el kiosco.</p>';
    } else if(p.id === 'agencia'){
      const c = feria.stands.agencia && feria.stands.agencia.hecho && feria.stands.agencia.hecho[feriaYo()];
      cuerpo = c && c.cupon ? `<div class="fer-cupon">${feriaEsc(c.cupon)}</div><p class="fer-texto">Tu descuento en <b>${feriaEsc(c.promo || '')}</b> (${Number(c.off) || 0}% menos)</p><p class="fer-sub">Mostralo en la agencia. Un asesor también va a contactarte en el viaje.</p>` : '<p class="fer-texto">Ya pediste tu descuento.</p>';
    } else if(p.id === 'sorteo'){
      const c = feria.stands.sorteo && feria.stands.sorteo.hecho && feria.stands.sorteo.hecho[feriaYo()];
      cuerpo = `<p class="fer-texto">Ya retiraste tu número:</p><div class="fer-pos">${c && c.num ? '#' + c.num : '?'}</div>${feriaSorteoEstadoHTML()}`;
    } else if(p.id === 'radio'){
      cuerpo = `<h3 class="fer-titulo">📻 Radio del micro</h3><p class="fer-texto">Ya votaste. Así van las votaciones:</p>${feriaRadioHTML()}`;
    } else {
      cuerpo = `<p class="fer-texto">¡Gracias! Ya nos contaste cómo viajás. 💙</p>`;
    }
    botones = cerrar;
  } else if(p.modo === 'resultado'){
    cuerpo = p.html;
    botones = '<button class="gbtn gbtn-ancho" onclick="feriaCerrarPanel()">¡Gracias!</button>';
  } else { // dentro del puesto
    const id = p.id;
    if(id === 'kiosco'){
      cuerpo = `<h3 class="fer-titulo">🍬 Kiosco</h3><p class="fer-texto">Elegí una golosina de cortesía. ¡El coordinador te la lleva a tu asiento! Podés pedir una sola vez.</p>${feriaOpciones(feriaKiosco(), 'feriaPedirKiosco')}`;
    } else if(id === 'agencia'){
      cuerpo = `<h3 class="fer-titulo">✈️ Agencia de viajes</h3><p class="fer-texto">Mirá las promos y pedí tu descuento. Podés elegir una sola vez.</p><div class="fer-promos">${feriaPromos().map((pr, i) => `<div class="fer-promo"><div><b>${feriaEsc(pr.t)}</b><div class="fer-sub">${feriaEsc(pr.d || '')}</div></div><button class="gbtn gbtn-chico-texto" onclick="feriaPedirPromo(${i})">${Number(pr.off) ? pr.off + '% off' : 'Quiero'}</button></div>`).join('')}</div>`;
    } else if(id === 'sorteo'){
      const sorteo = feria.sorteo || {};
      if(!sorteo.activo) cuerpo = '<h3 class="fer-titulo">🎟️ Sorteo</h3><p class="fer-texto">El sorteo todavía no está abierto. Pasá más tarde: el coordinador lo avisa.</p>';
      else cuerpo = `<h3 class="fer-titulo">🎟️ Sorteo</h3>${sorteo.premio ? `<p class="fer-texto">Premio: <b>${feriaEsc(sorteo.premio)}</b></p>` : ''}<p class="fer-sub">Retirá tu número. Es uno por persona y el sorteo lo hace el coordinador.</p>`;
      botones = sorteo.activo ? '<button class="gbtn gbtn-ancho" onclick="feriaRetirarNumero()">🎟️ Retirar mi número</button>' : '';
    } else if(id === 'radio'){
      cuerpo = `<h3 class="fer-titulo">📻 Radio del micro</h3><p class="fer-texto">Votá qué música querés escuchar. Se vota una sola vez; el chofer pone la más votada.</p>${feriaOpciones(feriaLista('radio'), 'feriaVotarRadio', 'fer-item-txt')}${feriaRadioHTML()}`;
    } else if(id === 'coordinador'){
      const pen = feriaPendiente('coordinador');
      cuerpo = pen
        ? `<h3 class="fer-titulo">🧑‍✈️ Coordinador</h3><p class="fer-texto">Ya tenés un pedido en camino: <b>${feriaEsc(pen.tipo)}</b>.</p><p class="fer-sub">Cuando el coordinador lo atienda vas a poder pedir otra cosa.</p>`
        : `<h3 class="fer-titulo">🧑‍✈️ Coordinador</h3><p class="fer-texto">¿Qué necesitás? El coordinador lo recibe y te lo lleva.</p>${feriaOpciones(feriaLista('servicios'), 'feriaPedirServicio', 'fer-item-txt')}<button class="fer-item fer-item-cumple" onclick="feriaAvisarCumple()"><span>🎂</span>¡Hoy es mi cumpleaños!</button>`;
    } else if(id === 'farmacia'){
      const pen = feriaPendiente('farmacia');
      cuerpo = pen
        ? `<h3 class="fer-titulo">💊 Farmacia</h3><p class="fer-texto">Ya avisaste: <b>${feriaEsc(pen.motivo)}</b>.</p><p class="fer-sub">El coordinador va a ir a verte. Si te sentís peor, avisale a un adulto.</p>`
        : `<h3 class="fer-titulo">💊 Farmacia</h3><p class="fer-texto">¿Te sentís mal? Elegí qué te pasa y el coordinador va a verte.</p><p class="fer-aviso-fer">El coordinador te consulta antes de darte cualquier medicamento.</p>${feriaOpciones(feriaLista('farmacia'), 'feriaPedirFarmacia', 'fer-item-txt')}<button class="fer-item fer-item-urgente" onclick="feriaPedirFarmacia(-1)"><span>🚨</span>Necesito ayuda ahora</button>`;
    } else if(id === 'buzon'){
      const listo = feria.encuesta.every(v => v > 0);
      cuerpo = `<h3 class="fer-titulo">📮 Buzón del viaje</h3><p class="fer-sub">Tres preguntas rápidas. Solo se contesta una vez.</p>${FERIA_PREGUNTAS.map((q, i) => `<div class="fer-pregunta"><div class="fer-texto">${q}</div><div class="fer-estrellas">${[1, 2, 3, 4, 5].map(v => `<button class="${feria.encuesta[i] >= v ? 'on' : ''}" onclick="feriaPuntuar(${i},${v})">★</button>`).join('')}</div></div>`).join('')}`;
      botones = `<button class="gbtn gbtn-ancho" ${listo ? '' : 'disabled'} onclick="feriaEnviarEncuesta()">Enviar</button>`;
    } else if(id === 'cartelera'){
      const l = feriaLista('cartelera');
      cuerpo = `<h3 class="fer-titulo">📋 Cartelera</h3><div class="fer-cartelera">${l.map(x => { const [h, t] = String(x).split('|').map(s => s.trim()); return t ? `<div class="fer-cart-fila"><b>${feriaEsc(h)}</b><span>${feriaEsc(t)}</span></div>` : `<div class="fer-cart-fila"><span>${feriaEsc(h)}</span></div>`; }).join('')}</div>`;
    }
    botones += (id === 'cartelera' ? '<button class="gbtn gbtn-ancho" onclick="feriaCerrarPanel()">Cerrar</button>' : '<button class="gbtn gbtn-ancho gbtn-no" onclick="feriaCerrarPanel()">Salir</button>');
  }
  cont.innerHTML = `<div class="plz-modal"><div class="plz-modal-caja">${cuerpo}<div class="fer-botones">${botones}</div></div></div>`;
  if(p.modo === 'foto') setTimeout(feriaDibujarFoto, 30);
}

function feriaSorteoEstadoHTML(){
  const g = feria.sorteo && feria.sorteo.ganador;
  if(!g) return '<p class="fer-sub">El coordinador anuncia el ganador en la plaza.</p>';
  return `<p class="fer-texto">🎉 Ganó el número <b>#${g.num}</b> (${feriaEsc(g.n || '')})</p>`;
}

// ---- Acciones ----

function feriaTerminarPuesto(id, dato, html, marcarHecho){
  if(marcarHecho !== false) feriaRef('feria/' + id + '/hecho/' + feriaYo()).set(dato || true);
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
  feriaRef('pedidos/' + feriaYo()).set({ n: String(miNombre).slice(0, 30), item, t: feriaTS(), estado: 'pendiente' });
  feriaTerminarPuesto('kiosco', { item, t: feriaTS() }, `<div class="fer-grande">${feriaEmojiDe(item)}</div><p class="fer-texto">¡Pedido listo! El coordinador te lleva <b>${feriaEsc(item)}</b> a tu asiento.</p>`);
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
  feriaRef('consultas/' + feriaYo()).set({ n: String(miNombre).slice(0, 30), promo: pr.t, off: Number(pr.off) || 0, cupon, t: feriaTS(), estado: 'nueva' });
  feriaTerminarPuesto('agencia', { promo: pr.t, off: Number(pr.off) || 0, cupon }, `<div class="fer-cupon">${cupon}</div><p class="fer-texto">Tu descuento en <b>${feriaEsc(pr.t)}</b>${Number(pr.off) ? ': <b>' + Number(pr.off) + '% menos</b>' : ''}.</p><p class="fer-sub">Mostrá este código en la agencia. Un asesor también va a contactarte durante el viaje.</p>`);
}

function feriaRetirarNumero(){
  if(feria.dentro !== 'sorteo' || !(feria.sorteo && feria.sorteo.activo)) return;
  feriaRef('sorteo/proximo').transaction(n => (n || 0) + 1).then(r => {
    if(!r || !r.committed) return;
    const num = r.snapshot.val();
    feriaRef('sorteo/numeros/' + feriaYo()).set({ num, n: String(miNombre).slice(0, 30), t: feriaTS() });
    feriaTerminarPuesto('sorteo', { num }, `<p class="fer-texto">Tu número del sorteo es:</p><div class="fer-pos">#${num}</div><p class="fer-sub">Guardalo. El coordinador anuncia el ganador en la plaza.</p>`);
  });
}

function feriaVotarRadio(i){
  if(feria.dentro !== 'radio') return;
  const cancion = feriaLista('radio')[i];
  if(cancion == null) return;
  feriaRef('radio/votos/' + feriaYo()).set(i);
  feriaTerminarPuesto('radio', true, `<p class="fer-texto">¡Votaste <b>${feriaEsc(cancion)}</b>! 🎶</p><p class="fer-sub">Así van las votaciones:</p>${feriaRadioHTMLTrasVoto(i)}`);
}
function feriaRadioHTMLTrasVoto(i){
  const t = feriaVotosRadio().map(x => Object.assign({}, x, { n: x.n + (x.i === i && !((feria.radio && feria.radio.votos) || {})[feriaYo()] ? 1 : 0) })).sort((x, y) => y.n - x.n || x.i - y.i);
  const total = t.reduce((s, x) => s + x.n, 0);
  return `<div class="fer-tabla">${t.slice(0, 4).map((x, k) => `<div class="fer-barra"><span>${k === 0 && x.n ? '🏆 ' : ''}${feriaEsc(x.c)}</span><i style="width:${total ? Math.round(x.n / total * 100) : 0}%"></i><b>${x.n}</b></div>`).join('')}</div>`;
}

function feriaPedirServicio(i){
  if(feria.dentro !== 'coordinador' || feriaPendiente('coordinador')) return;
  const tipo = feriaLista('servicios')[i];
  if(!tipo) return;
  feriaRef('servicios/' + feriaYo()).set({ n: String(miNombre).slice(0, 30), tipo, t: feriaTS(), estado: 'pendiente' });
  feriaTerminarPuesto('coordinador', null, `<div class="fer-grande">🧑‍✈️</div><p class="fer-texto">¡Listo! El coordinador recibió tu pedido: <b>${feriaEsc(tipo)}</b>.</p>`, false);
}

function feriaAvisarCumple(){
  if(feria.dentro !== 'coordinador') return;
  feriaRef('cumples/' + feriaYo()).set({ n: String(miNombre).slice(0, 30), t: feriaTS(), estado: 'nuevo' });
  feriaTerminarPuesto('coordinador', null, '<div class="fer-grande">🎂</div><p class="fer-texto">¡Feliz cumpleaños! 🎉 El coordinador va a avisarlo en el micro y en la plaza te va a aparecer una torta.</p>', false);
}

function feriaPedirFarmacia(i){
  if(feria.dentro !== 'farmacia' || feriaPendiente('farmacia')) return;
  const urgente = i < 0;
  const motivo = urgente ? 'Necesita ayuda ahora' : feriaLista('farmacia')[i];
  if(!motivo) return;
  feriaRef('farmacia/' + feriaYo()).set({ n: String(miNombre).slice(0, 30), motivo, urgente, t: feriaTS(), estado: 'pendiente' });
  feriaTerminarPuesto('farmacia', null, `<div class="fer-grande">${urgente ? '🚨' : '💊'}</div><p class="fer-texto">${urgente ? '¡Aviso enviado!' : 'Listo, avisamos al coordinador.'} Va a ir a verte${urgente ? ' enseguida' : ''}.</p><p class="fer-sub">Si te sentís peor, avisale a un adulto.</p>`, false);
}

function feriaPuntuar(q, v){ feria.encuesta[q] = v; feriaRenderPanel(); }

function feriaEnviarEncuesta(){
  if(feria.dentro !== 'buzon' || !feria.encuesta.every(v => v > 0)) return;
  const [a, b, c] = feria.encuesta;
  feriaRef('encuestas/' + feriaYo()).set({ a, b, c, t: feriaTS() });
  feriaTerminarPuesto('buzon', true, '<div class="fer-grande">💙</div><p class="fer-texto">¡Gracias por contarnos cómo viajás!</p>');
}

function feriaAvisarGanador(){
  const g = feria.sorteo && feria.sorteo.ganador;
  if(!g || feria.avisados[g.t]) return;
  feria.avisados[g.t] = true;
  const mios = feria.sorteo.numeros || {};
  const mio = [feriaYo(), feriaYo() + 'p'].some(k => mios[k] && mios[k].num === g.num);
  feriaToast(mio ? '🎉 ¡¡Ganaste el sorteo!! Número #' + g.num : '🎉 ¡Ganó el número #' + g.num + ' (' + (g.n || '') + ')!', 'gain');
}

// ---- Escenario ----

function feriaEscenario(){
  feria.panel = { id: 'escenario', modo: 'escenario' };
  feriaRenderPanel();
}
// Tienda Busmac (Shopping): vidriera del sorteo de remeras. Solo se sortea; no se vende.
function feriaTienda(){
  feria.panel = { id: 'tienda', modo: 'tienda' };
  feriaRenderPanel();
}
function feriaIrAlSorteo(){
  feriaCerrarPanel();
  if(typeof plazaCaminarA === 'function') plazaCaminarA('sorteo');
}

function feriaIrA(vista){
  feria.panel = null; feriaRenderPanel();
  showView(vista);
}

// ---- Pasaporte ----

function feriaPasaporteDatos(){
  const sellos = Object.keys(FERIA_NOMBRES).map(id => ({ id, ok: feriaStand(id).visito || feriaStand(id).hecho }));
  const ok = sellos.filter(s => s.ok).length;
  return { sellos, ok, completo: ok === sellos.length, reclamado: !!feria.pasaporte };
}

function feriaPasaporte(){
  if(!feriaEnLinea()){ feriaToast('Entrá a un viaje para usar el pasaporte'); return; }
  feria.panel = { id: 'pasaporte', modo: 'pasaporte' };
  feriaRenderPanel();
}

function feriaReclamarPasaporte(){
  const d = feriaPasaporteDatos();
  if(!d.completo || d.reclamado) return;
  feriaRef('pasaporte/' + feriaYo()).set({ t: feriaTS() });
  if(typeof regalarMonedas === 'function') regalarMonedas(FERIA_PREMIO_PASAPORTE);
  const extra = feria.sorteo && feria.sorteo.activo;
  if(extra){
    feriaRef('sorteo/proximo').transaction(n => (n || 0) + 1).then(r => {
      if(r && r.committed) feriaRef('sorteo/numeros/' + feriaYo() + 'p').set({ num: r.snapshot.val(), n: String(miNombre).slice(0, 30), t: feriaTS(), extra: true });
    });
  }
  feriaToast('¡Pasaporte completo! +' + FERIA_PREMIO_PASAPORTE + ' monedas' + (extra ? ' y un número extra' : ''), 'gain');
  if(typeof reproducirTono === 'function') reproducirTono('bonus');
}

// ---- Foto grupal: un dibujo con los personajes de la sala (sin cámara ni fotos reales) ----

function feriaPersonajesDeLaSala(){
  const lista = [{ n: 'Vos', a: typeof plazaCompacto === 'function' ? plazaCompacto() : {} }];
  if(typeof plz !== 'undefined'){
    Object.keys(plz.otros || {}).forEach(k => lista.push({ n: plz.otros[k].nombre, a: plz.otros[k].avatar }));
    (plz.bots || []).forEach(b => lista.push({ n: b.n, a: b.a }));
  }
  return lista.slice(0, 18);
}

function feriaDibujarFoto(intento){
  const c = document.getElementById('fer-foto');
  if(!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const cielo = ctx.createLinearGradient(0, 0, 0, H);
  cielo.addColorStop(0, '#4FB3FF'); cielo.addColorStop(0.6, '#CFEBFF'); cielo.addColorStop(1, '#F3E7C9');
  ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#7FC77A'; ctx.fillRect(0, H * 0.62, W, H * 0.38);
  ctx.fillStyle = '#E7DCC5'; ctx.fillRect(0, H * 0.7, W, H * 0.3);
  const gente = feriaPersonajesDeLaSala();
  const porFila = gente.length > 8 ? 6 : Math.max(1, Math.min(gente.length, 4));
  const filas = Math.ceil(gente.length / porFila);
  let faltan = false;
  const tamAlto = Math.min(150, (H * 0.5) / filas), tamAncho = tamAlto * 0.84;
  gente.forEach((g, i) => {
    const fila = Math.floor(i / porFila), col = i % porFila;
    const enFila = Math.min(porFila, gente.length - fila * porFila);
    const x = W / 2 + (col - (enFila - 1) / 2) * (tamAncho + 18);
    const y = H * 0.5 + fila * tamAlto * 0.55 + tamAlto * 0.7;
    const img = typeof avatarSprite === 'function' ? avatarSprite(g.a) : null;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y, tamAncho * 0.38, 7, 0, 0, 7); ctx.fill();
    if(img && img.complete && img.naturalWidth) ctx.drawImage(img, x - tamAncho / 2, y - tamAlto, tamAncho, tamAlto);
    else faltan = true;
    ctx.font = '700 13px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#0F2A4D';
    ctx.fillText(String(g.n).slice(0, 10), x, y + 18);
  });
  // Marco con el logo en las esquinas
  ctx.lineWidth = 14; ctx.strokeStyle = '#fff'; ctx.strokeRect(7, 7, W - 14, H - 14);
  ctx.lineWidth = 3; ctx.strokeStyle = '#E6A817'; ctx.strokeRect(16, 16, W - 32, H - 32);
  if(typeof arcLogo === 'function'){ [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]].forEach(([x, y]) => arcLogo(ctx, x, y, 44, '#fff')); }
  ctx.fillStyle = 'rgba(15,42,77,.85)'; ctx.fillRect(W / 2 - 150, 22, 300, 30);
  ctx.fillStyle = '#fff'; ctx.font = '800 16px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Plaza ' + (typeof marcaCorta === 'function' ? marcaCorta() : 'Busmac') + ' · ' + new Date().toLocaleDateString('es-AR'), W / 2, 38);
  ctx.textBaseline = 'alphabetic';
  if(faltan && (intento || 0) < 6) setTimeout(() => feriaDibujarFoto((intento || 0) + 1), 250);
}

function feriaFotoGrupal(){
  feriaVisita('foto');
  feria.panel = { id: 'foto', modo: 'foto' };
  feriaRenderPanel();
}

function feriaGuardarFoto(){
  const c = document.getElementById('fer-foto');
  if(!c) return;
  c.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'foto-plaza.png';
    document.body.appendChild(a); a.click(); a.remove();
    feriaToast('Foto guardada');
  });
}

function feriaCompartirFoto(){
  const c = document.getElementById('fer-foto');
  if(!c || !navigator.share) return;
  c.toBlob(blob => {
    const archivo = new File([blob], 'foto-plaza.png', { type: 'image/png' });
    const datos = { files: [archivo], title: 'Mi foto en la plaza' };
    if(navigator.canShare && !navigator.canShare(datos)){ feriaGuardarFoto(); return; }
    navigator.share(datos).catch(() => {});
  });
}

// ---- Panel del organizador (botón 🎪 en Viajes): menús y textos del puesto ----

let adminFeriaAbiertaPara = null;

function adminToggleFeria(codigo){
  adminFeriaAbiertaPara = adminFeriaAbiertaPara === codigo ? null : codigo;
  renderAdminViajes();
}

function adminEventoAnunciar(codigo){
  const t = document.getElementById('admin-evento-texto-' + codigo), s = document.getElementById('admin-evento-sector-' + codigo);
  const texto = (t ? t.value : '').trim().slice(0, 70), sector = s ? s.value : 'plaza';
  if(!texto){ feriaToast('Escribí qué pasa y dónde'); return; }
  db.ref('salas/' + codigo + '/ajustes/evento').set({ texto, sector, t: firebase.database.ServerValue.TIMESTAMP }).then(() => { feriaToast('Evento anunciado'); renderAdminViajes(); });
}
function adminEventoBorrar(codigo){
  db.ref('salas/' + codigo + '/ajustes/evento').remove().then(() => { feriaToast('Aviso borrado'); renderAdminViajes(); });
}
function adminTunel(codigo, valor){
  db.ref('salas/' + codigo + '/ajustes/tunel').set(valor === 'off' ? 'off' : null).then(() => { feriaToast(valor === 'off' ? 'Túnel apagado' : 'Túnel activo'); renderAdminViajes(); });
}
function adminTunelMensaje(codigo){
  const el = document.getElementById('admin-tunel-msg-' + codigo);
  const v = (el ? el.value : '').trim().slice(0, 120);
  db.ref('salas/' + codigo + '/ajustes/tunelMensaje').set(v || null).then(() => { feriaToast('Mensaje del túnel guardado'); renderAdminViajes(); });
}
function adminBoliche(codigo, valor){
  db.ref('salas/' + codigo + '/ajustes/boliche').set(valor === 'off' ? 'off' : null).then(() => { feriaToast(valor === 'off' ? 'Boliche cerrado' : 'Boliche abierto'); renderAdminViajes(); });
}
function adminModoApp(codigo, valor){
  db.ref('salas/' + codigo + '/ajustes/modo').set(valor === 'clasico' ? 'clasico' : null).then(() => { feriaToast(valor === 'clasico' ? 'Modo clásico: sin mundo' : 'Modo mundo: micro y paradas'); renderAdminViajes(); });
}
function adminParadaReal(codigo, valor){
  const n = parseInt(valor, 10);
  db.ref('salas/' + codigo + '/ajustes/paradaReal').set(isNaN(n) || n < 0 ? null : n).then(() => { feriaToast('Recorrido actualizado'); renderAdminViajes(); });
}
function adminProximoBingo(codigo){
  const el = document.getElementById('admin-bingo-' + codigo);
  const v = (el ? el.value : '').trim().slice(0, 40);
  db.ref('salas/' + codigo + '/ajustes/proximoBingo').set(v || null).then(() => { feriaToast(v ? 'Bingo anunciado: ' + v : 'Aviso de bingo borrado'); renderAdminViajes(); });
}

function adminCartitasModo(codigo, valor){
  db.ref('salas/' + codigo + '/ajustes/cartitas').set(valor === 'amistad' || valor === 'todo' ? valor : null).then(() => { feriaToast('Cartitas: ' + (valor === 'todo' ? 'con cartas de amor' : valor === 'amistad' ? 'solo amistad' : 'apagadas')); renderAdminViajes(); });
}

function adminFeriaGuardarLista(codigo, clave){
  const el = document.getElementById('admin-feria-' + clave + '-' + codigo);
  const items = (el ? el.value : '').split('\n').map(l => l.trim().slice(0, 60)).filter(Boolean).slice(0, 14);
  db.ref('salas/' + codigo + '/feriaConfig/' + clave).set(items.length ? items : null).then(() => { feriaToast('Guardado'); renderAdminViajes(); });
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
    const g = { num: v[a].num, n: v[a].n || '', asiento: a.replace(/p$/, ''), t: Date.now() };
    db.ref('salas/' + codigo + '/sorteo/ganador').set(g).then(() => { feriaToast('Ganó el #' + g.num + ' (' + g.n + ', asiento ' + g.asiento + ')', 'gain'); renderAdminViajes(); });
  });
}

function adminFeriaReiniciarSorteo(codigo){
  if(typeof confirm === 'function' && !confirm('¿Borrar los números repartidos y el ganador?')) return;
  const u = {}; ['numeros', 'ganador', 'proximo'].forEach(k => { u[k] = null; });
  db.ref('salas/' + codigo + '/sorteo').update(u).then(() => db.ref('salas/' + codigo + '/feria/sorteo/hecho').remove()).then(() => { feriaToast('Sorteo reiniciado'); renderAdminViajes(); });
}

function adminFeriaListaHTML(codigo, clave, titulo, ayuda, items){
  return `<div class="fer-admin-t">${titulo} <small>${ayuda}</small></div><textarea id="admin-feria-${clave}-${codigo}" rows="4">${feriaEsc(items.join('\n'))}</textarea><button class="btn-primary" onclick="adminFeriaGuardarLista('${codigo}','${clave}')">Guardar</button>`;
}

function adminFeriaPanelHTML(codigo, viaje){
  if(adminFeriaAbiertaPara !== codigo) return '';
  const cfg = (viaje && viaje.feriaConfig) || {};
  const de = clave => { const l = feriaListaDe(cfg[clave]).map(String); return l.length ? l : FERIA_DEFECTO[clave]; };
  const promos = feriaListaDe(cfg.promos).length ? feriaListaDe(cfg.promos) : FERIA_DEFECTO.promos;
  const sorteo = (viaje && viaje.sorteo) || {};
  const numeros = sorteo.numeros || {};
  const g = sorteo.ganador;
  const votos = ((viaje && viaje.radio) || {}).votos || {};
  const canciones = de('radio'), cuenta = canciones.map(() => 0);
  Object.keys(votos).forEach(a => { if(cuenta[votos[a]] != null) cuenta[votos[a]]++; });
  const topRadio = canciones.map((c, i) => ({ c, n: cuenta[i] })).sort((x, y) => y.n - x.n).filter(x => x.n).slice(0, 3).map(x => feriaEsc(x.c) + ' ×' + x.n).join(' · ') || 'Todavía no hay votos';
  const enc = Object.keys((viaje && viaje.encuestas) || {}).map(a => viaje.encuestas[a]);
  const prom = k => enc.length ? (enc.reduce((s, e) => s + (Number(e[k]) || 0), 0) / enc.length).toFixed(1) : '-';
  const pasaportes = Object.keys((viaje && viaje.pasaporte) || {}).length;
  return `<div class="fer-admin">
    <div class="fer-aviso">📥 Todos los pedidos (kiosco, farmacia, coordinador, agencia y cumpleaños) están juntos en <b>la bandeja de pedidos</b>: botón 📥 de esta fila.</div>
    ${adminFeriaListaHTML(codigo, 'kiosco', '🍬 Menú del kiosco', '(uno por línea)', de('kiosco'))}
    <div class="fer-admin-t">✈️ Promos de la agencia <small>(Título | detalle | descuento)</small></div>
    <textarea id="admin-feria-promos-${codigo}" rows="4">${feriaEsc(promos.map(p => [p.t, p.d || '', p.off || 0].join(' | ')).join('\n'))}</textarea>
    <button class="btn-primary" onclick="adminFeriaGuardarPromos('${codigo}')">Guardar promos</button>
    ${adminFeriaListaHTML(codigo, 'servicios', '🧑‍✈️ Pedidos al coordinador', '(uno por línea)', de('servicios'))}
    ${adminFeriaListaHTML(codigo, 'farmacia', '💊 Opciones de la farmacia', '(uno por línea)', de('farmacia'))}
    ${adminFeriaListaHTML(codigo, 'radio', '📻 Música de la radio', '(uno por línea)', canciones)}
    <div class="fer-sub-admin">Más votadas: <b>${topRadio}</b></div>
    ${adminFeriaListaHTML(codigo, 'cartelera', '📋 Cartelera', '(Hora | Actividad)', de('cartelera'))}

    <div class="fer-admin-t">🎟️ Sorteo</div>
    <label class="fer-check"><input type="checkbox" id="admin-feria-sorteo-activo-${codigo}" ${sorteo.activo ? 'checked' : ''}> Sorteo abierto (se pueden retirar números)</label>
    <input type="text" id="admin-feria-sorteo-premio-${codigo}" value="${feriaEsc(sorteo.premio || '')}" placeholder="Premio (ej: una remera Busmac)">
    <button class="btn-primary" onclick="adminFeriaGuardarSorteo('${codigo}')">Guardar sorteo</button>
    <div class="fer-sub-admin">Números repartidos: <b>${Object.keys(numeros).length}</b>${g ? ' · Ganador: <b>#' + g.num + '</b> (' + feriaEsc(g.n || '') + ', asiento ' + feriaEsc(g.asiento || '') + ')' : ''}</div>
    <div class="fer-botones-admin"><button class="btn-primary" onclick="adminFeriaSortear('${codigo}')">🎲 Sortear ahora</button><button class="fer-mini" onclick="adminFeriaReiniciarSorteo('${codigo}')">Reiniciar</button></div>
    <div class="fer-aviso">Antes de sortear premios de verdad, consultá si tu provincia exige autorización para sorteos.</div>

    <div class="fer-admin-t">🌎 Modo de la app <small>(cómo la ven los pasajeros)</small></div>
    <select class="fer-select" onchange="adminModoApp('${codigo}', this.value)"><option value="mundo" ${viaje && viaje.ajustes && viaje.ajustes.modo === 'clasico' ? '' : 'selected'}>Mundo: micro con 5 paradas y personajes</option><option value="clasico" ${viaje && viaje.ajustes && viaje.ajustes.modo === 'clasico' ? 'selected' : ''}>Clásico: menú de siempre, sin mundo</option></select>
    <div class="fer-admin-t">🗺️ Recorrido real <small>(dónde está el micro ahora; usa las líneas de la cartelera)</small></div>
    <select class="fer-select" onchange="adminParadaReal('${codigo}', this.value)"><option value="-1">Todavía no salimos</option>${de('cartelera').map((l, i) => `<option value="${i}" ${viaje && viaje.ajustes && viaje.ajustes.paradaReal === i ? 'selected' : ''}>${feriaEsc(l)}</option>`).join('')}</select>
    <div class="fer-admin-t">📢 Anunciar un evento <small>(aparece en todas las paradas con un botón para ir; dura 3 horas)</small></div>
    <input type="text" id="admin-evento-texto-${codigo}" placeholder="Ej: Karaoke en el Salón de eventos" value="${feriaEsc((viaje && viaje.ajustes && viaje.ajustes.evento && viaje.ajustes.evento.texto) || '')}">
    <select class="fer-select" id="admin-evento-sector-${codigo}">${PLZ_ORDEN_SECTORES.map(id => `<option value="${id}" ${viaje && viaje.ajustes && viaje.ajustes.evento && viaje.ajustes.evento.sector === id ? 'selected' : ''}>${feriaEsc(PLZ_SECTORES[id].emoji + ' ' + PLZ_SECTORES[id].nombre)}</option>`).join('')}</select>
    <div class="fer-botones-admin"><button class="btn-primary" onclick="adminEventoAnunciar('${codigo}')">📢 Anunciar</button><button class="fer-mini" onclick="adminEventoBorrar('${codigo}')">Borrar aviso</button></div>
    <div class="fer-admin-t">🕺 Confitería bailable <small>(entrada en la Plaza; salas de 12 personas)</small></div>
    <select class="fer-select" onchange="adminBoliche('${codigo}', this.value)"><option value="on" ${viaje && viaje.ajustes && viaje.ajustes.boliche === 'off' ? '' : 'selected'}>Abierta</option><option value="off" ${viaje && viaje.ajustes && viaje.ajustes.boliche === 'off' ? 'selected' : ''}>Cerrada</option></select>
    ${adminFeriaListaHTML(codigo, 'barra', '🍹 Bebidas de la barra', '(uno por línea; sin alcohol en viajes con menores)', de('barra'))}
    <div class="fer-admin-t">🕳️ Túnel secreto <small>(una tapa escondida en un mapa; cofre de 10 monedas por persona)</small></div>
    <select class="fer-select" onchange="adminTunel('${codigo}', this.value)"><option value="on" ${viaje && viaje.ajustes && viaje.ajustes.tunel === 'off' ? '' : 'selected'}>Activo</option><option value="off" ${viaje && viaje.ajustes && viaje.ajustes.tunel === 'off' ? 'selected' : ''}>Apagado</option></select>
    <input type="text" id="admin-tunel-msg-${codigo}" placeholder="Premio extra (ej: mostrale el código al coordinador y te lleva un alfajor)" value="${feriaEsc((viaje && viaje.ajustes && viaje.ajustes.tunelMensaje) || '')}">
    <button class="btn-primary" onclick="adminTunelMensaje('${codigo}')">Guardar mensaje</button>
    <div class="fer-sub-admin">Descubridores: <b>${Object.keys((viaje && viaje.tunel && viaje.tunel.descubridores) || {}).length}</b></div>
    <div class="fer-admin-t">🎱 Próximo bingo <small>(se ve en todas las paradas; hora tipo 21:30 o un texto)</small></div>
    <input type="text" id="admin-bingo-${codigo}" value="${feriaEsc((viaje && viaje.ajustes && viaje.ajustes.proximoBingo) || '')}" placeholder="Ej: 21:30">
    <button class="btn-primary" onclick="adminProximoBingo('${codigo}')">Anunciar bingo</button>
    <div class="fer-admin-t">💌 Cartitas entre pasajeros <small>(frases armadas, sin texto libre)</small></div>
    <select class="fer-select" onchange="adminCartitasModo('${codigo}', this.value)"><option value="off" ${!(viaje && viaje.ajustes && (viaje.ajustes.cartitas === 'amistad' || viaje.ajustes.cartitas === 'todo')) ? 'selected' : ''}>Apagadas</option><option value="amistad" ${viaje && viaje.ajustes && viaje.ajustes.cartitas === 'amistad' ? 'selected' : ''}>Solo amistad (mate, juegos, charla)</option><option value="todo" ${viaje && viaje.ajustes && viaje.ajustes.cartitas === 'todo' ? 'selected' : ''}>Con cartas de amor ("te espero en el banco")</option></select>
    <div class="fer-aviso">En viajes con menores recomendamos "Solo amistad" o dejarlas apagadas. Cada pasajero puede mandar 3 en todo el viaje, quien recibe puede bloquear o avisarte, y los avisos llegan a la bandeja 📥 como 🚩.</div>
    <div class="fer-admin-t">📮 Buzón del viaje <small>(${enc.length} respuestas)</small></div>
    <div class="fer-sub-admin">General: <b>${prom('a')}</b> · Coordinador: <b>${prom('b')}</b> · Volverían: <b>${prom('c')}</b> <small>(de 5)</small></div>
    <div class="fer-admin-t">📒 Pasaportes completados: <b>${pasaportes}</b></div>
  </div>`;
}
