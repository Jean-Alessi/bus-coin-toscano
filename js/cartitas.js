// Cartitas de la plaza: invitaciones entre pasajeros ("te espero en el banco de la plaza").
// Pensadas para que nadie quede expuesto ni incómodo:
//   - Los mensajes son frases armadas (no hay texto libre) y siempre van firmados.
//   - El organizador las enciende por viaje (apagadas por defecto): "Solo amistad" o "Con cartas de amor".
//     En viajes con menores se recomienda "Solo amistad".
//   - Máximo 3 cartitas por pasajero en todo el viaje, y una sola por persona.
//   - Quien recibe puede decir "¡Dale!", "Hoy no" (el que mandó NO se entera del rechazo),
//     "No recibir más" (bloquea a esa persona) o "Avisar al coordinador" (llega a la bandeja 📥).
//
// Datos en salas/{viaje}/:  ajustes/cartitas, cartitas/{destino}/{origen}, cartitasRespuestas/{origen}/{destino},
// cartitasBloqueo/{destino}/{origen}, cartitasEnv/{origen} (contador), cartitasReportes/{id}.

const CARTITAS_TIPOS = [
  { id: 'mate', emoji: '🧉', txt: '¿Te sumás a tomar unos mates?', amor: false },
  { id: 'juego', emoji: '🎮', txt: '¿Jugamos algo juntos?', amor: false },
  { id: 'foto', emoji: '📸', txt: '¿Nos sacamos una foto juntos?', amor: false },
  { id: 'charla', emoji: '🤝', txt: 'Quiero conocerte, ¿charlamos un rato?', amor: false },
  { id: 'banco', emoji: '💌', txt: 'Te espero en el banco de la plaza', amor: true },
  { id: 'carta', emoji: '💘', txt: 'Tengo algo lindo para decirte, ¿nos vemos en la plaza?', amor: true },
];
const CARTITAS_MAX = 3;

const cartitas = { modo: 'off', recibidas: {}, oyentes: [], panel: null, destino: null, destinoNombre: '', nuevas: 0, primera: true, respVistas: {} };

const carEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const carEnLinea = () => !!(typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre);
const carRef = ruta => db.ref('salas/' + codigoViaje + '/' + ruta);
const carToast = (m, t) => { if(typeof mostrarToast === 'function') mostrarToast(m, t); };
const carTipo = id => CARTITAS_TIPOS.find(t => t.id === id) || CARTITAS_TIPOS[0];

function cartitasActivas(){ return cartitas.modo === 'amistad' || cartitas.modo === 'todo'; }
function cartitasTiposPermitidos(){ return CARTITAS_TIPOS.filter(t => !t.amor || cartitas.modo === 'todo'); }

// ---- Conexión (mientras se está en la plaza) ----

function cartitasIniciar(){
  cartitasAlSalir();
  Object.assign(cartitas, { modo: 'off', recibidas: {}, nuevas: 0, primera: true, panel: null });
  if(!carEnLinea()) return;
  const yo = String(miAsiento);
  let vistas = {};
  try { vistas = JSON.parse(localStorage.getItem('cartitas-resp-' + codigoViaje + '-' + yo) || '{}'); } catch(e){}
  cartitas.respVistas = vistas;
  const escuchar = (ruta, f) => { const r = carRef(ruta); const cb = r.on('value', s => f(s.val())); cartitas.oyentes.push({ r, cb }); };
  escuchar('ajustes/cartitas', v => { cartitas.modo = v === 'amistad' || v === 'todo' ? v : 'off'; cartitasRender(); });
  escuchar('cartitas/' + yo, v => {
    const previas = cartitas.recibidas;
    cartitas.recibidas = v || {};
    const nuevas = Object.keys(cartitas.recibidas).filter(a => cartitas.recibidas[a].estado === 'nueva');
    cartitas.nuevas = nuevas.length;
    if(cartitas.primera){
      if(nuevas.length && cartitasActivas()) carToast('💌 Tenés ' + nuevas.length + ' cartita' + (nuevas.length === 1 ? '' : 's') + ' esperándote en el buzón del parque');
    } else {
      nuevas.filter(a => !previas[a]).forEach(a => carToast('💌 ' + (cartitas.recibidas[a].n || 'Alguien') + ' te mandó una cartita', 'gain'));
    }
    cartitas.primera = false;
    cartitasRender();
  });
  escuchar('cartitasRespuestas/' + yo, v => {
    Object.keys(v || {}).forEach(a => {
      if(cartitas.respVistas[a]) return;
      cartitas.respVistas[a] = true;
      carToast('🎉 ' + (v[a].n || 'Alguien') + ' dijo que sí: ' + carTipo(v[a].tipo).txt.toLowerCase(), 'gain');
    });
    try { localStorage.setItem('cartitas-resp-' + codigoViaje + '-' + yo, JSON.stringify(cartitas.respVistas)); } catch(e){}
  });
}

function cartitasAlSalir(){
  cartitas.oyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  cartitas.oyentes = [];
  cartitas.panel = null;
  const c = document.getElementById('plaza-cartas'); if(c) c.innerHTML = '';
}

// ---- Pantallas ----

function cartitasAbrir(){
  if(!carEnLinea()){ carToast('Entrá a un viaje para usar el correo'); return; }
  cartitas.panel = 'buzon';
  cartitasRender();
}
function cartitasNuevaPara(asiento){
  if(!cartitasActivas()){ carToast('Las cartitas no están activadas en este viaje'); return; }
  cartitas.panel = 'enviar'; cartitas.destino = asiento ? String(asiento) : null; cartitas.destinoNombre = '';
  if(asiento) cartitasBuscarDestino(asiento);
  cartitasRender();
}
function cartitasCerrar(){ cartitas.panel = null; cartitasRender(); }

function cartitasBuscarDestino(v){
  const a = String(parseInt(v, 10));
  cartitas.destino = a === 'NaN' ? null : a; cartitas.destinoNombre = '';
  if(!cartitas.destino) { cartitasRender(); return; }
  carRef('ranking/puntos/' + cartitas.destino).once('value').then(s => {
    const d = s.val();
    cartitas.destinoNombre = d && d.nombre ? String(d.nombre) : '';
    cartitasRender();
  });
}

function cartitasRender(){
  const cont = document.getElementById('plaza-cartas');
  if(!cont) return;
  if(!cartitas.panel){ cont.innerHTML = ''; return; }
  let cuerpo = '', botones = '';
  const cerrar = '<button class="gbtn gbtn-ancho gbtn-no" onclick="cartitasCerrar()">Cerrar</button>';
  if(!cartitasActivas()){
    cuerpo = '<h3 class="fer-titulo">💌 Correo del parque</h3><p class="fer-texto">Las cartitas no están activadas en este viaje.</p><p class="fer-sub">Si querés usarlas, pedile al coordinador que las active.</p>';
    botones = cerrar;
  } else if(cartitas.panel === 'enviar'){
    const yo = String(miAsiento), d = cartitas.destino;
    const quedan = cartitas.quedan;
    cuerpo = `<h3 class="fer-titulo">💌 Mandar una cartita</h3><p class="fer-sub">Elegí el asiento de la persona y una frase. Va firmada con tu nombre. Podés mandar ${CARTITAS_MAX} en todo el viaje.</p>
      <input type="number" inputmode="numeric" class="car-input" placeholder="Nº de asiento" value="${d ? carEsc(d) : ''}" onchange="cartitasBuscarDestino(this.value)">
      ${d ? (d === yo ? '<p class="fer-sub">Ese sos vos 🙂</p>' : (cartitas.destinoNombre ? `<p class="fer-texto">Para: <b>${carEsc(cartitas.destinoNombre)}</b> (asiento ${carEsc(d)})</p>` : '<p class="fer-sub">Buscando... o no hay nadie en ese asiento.</p>')) : ''}
      ${cartitas.destinoNombre && d !== yo ? `<div class="fer-items car-tipos">${cartitasTiposPermitidos().map(t => `<button class="fer-item fer-item-txt car-tipo" onclick="cartitasEnviar('${t.id}')"><span>${t.emoji}</span>${carEsc(t.txt)}</button>`).join('')}</div>` : ''}`;
    botones = '<button class="gbtn gbtn-ancho gbtn-no" onclick="cartitas.panel=\'buzon\';cartitasRender()">Volver al buzón</button>';
  } else {
    const claves = Object.keys(cartitas.recibidas).filter(a => !['gracias', 'bloqueada', 'reportada'].includes(cartitas.recibidas[a].estado)).sort((x, y) => (cartitas.recibidas[y].t || 0) - (cartitas.recibidas[x].t || 0));
    cuerpo = `<h3 class="fer-titulo">💌 Buzón del parque</h3>${claves.length ? claves.map(a => {
      const c = cartitas.recibidas[a], t = carTipo(c.tipo);
      return `<div class="car-item"><div><b>${carEsc(c.n || 'Alguien')}</b> <small>asiento ${carEsc(a)}</small></div><div class="car-txt">${t.emoji} ${carEsc(t.txt)}</div>${c.estado === 'nueva'
        ? `<div class="car-botones"><button class="gbtn gbtn-chico-texto" onclick="cartitasResponder('${carEsc(a)}','dale')">💙 ¡Dale!</button><button class="gbtn gbtn-chico-texto" onclick="cartitasResponder('${carEsc(a)}','no')">🙂 Hoy no</button></div><div class="car-mas"><button class="car-chico" onclick="cartitasResponder('${carEsc(a)}','bloquear')">No recibir más de esta persona</button> · <button class="car-chico" onclick="cartitasResponder('${carEsc(a)}','reportar')">Avisar al coordinador</button></div>`
        : '<div class="fer-sub">Dijiste que sí 💙</div>'}</div>`;
    }).join('') : '<p class="fer-sub">No tenés cartitas por ahora.</p>'}`;
    botones = `<button class="gbtn gbtn-ancho" onclick="cartitasNuevaPara()">✍️ Mandar una cartita</button>${cerrar}`;
  }
  cont.innerHTML = `<div class="plz-modal"><div class="plz-modal-caja">${cuerpo}<div class="fer-botones">${botones}</div></div></div>`;
}

// ---- Acciones ----

async function cartitasEnviar(tipoId){
  const dest = cartitas.destino, yo = String(miAsiento);
  const t = cartitasTiposPermitidos().find(x => x.id === tipoId);
  if(!t || !dest || dest === yo || !cartitas.destinoNombre) return;
  if(!cartitasActivas()){ carToast('Las cartitas no están activadas'); return; }
  const ya = await carRef('cartitas/' + dest + '/' + yo).once('value');
  if(ya.exists()){ carToast('Ya le mandaste una cartita a esa persona'); return; }
  const bloq = await carRef('cartitasBloqueo/' + dest + '/' + yo).once('value');
  const cont = await carRef('cartitasEnv/' + yo).transaction(n => (n || 0) < CARTITAS_MAX ? (n || 0) + 1 : undefined);
  if(!cont || !cont.committed){ carToast('Ya mandaste ' + CARTITAS_MAX + ' cartitas en este viaje'); return; }
  if(!bloq.exists()) await carRef('cartitas/' + dest + '/' + yo).set({ n: String(miNombre).slice(0, 20), tipo: t.id, t: firebase.database.ServerValue.TIMESTAMP, estado: 'nueva' });
  carToast('💌 Cartita enviada a ' + cartitas.destinoNombre, 'gain');
  cartitas.panel = 'buzon'; cartitas.destino = null; cartitas.destinoNombre = '';
  cartitasRender();
}

function cartitasResponder(de, accion){
  const yo = String(miAsiento), c = cartitas.recibidas[de];
  if(!c || c.estado !== 'nueva') return;
  const ref = carRef('cartitas/' + yo + '/' + de);
  if(accion === 'dale'){
    ref.update({ estado: 'dale' });
    carRef('cartitasRespuestas/' + de + '/' + yo).set({ n: String(miNombre).slice(0, 20), tipo: c.tipo, t: firebase.database.ServerValue.TIMESTAMP });
    carToast('¡Genial! Le avisamos 💙');
  } else if(accion === 'no'){
    ref.update({ estado: 'gracias' }); // el que mandó no se entera
  } else if(accion === 'bloquear'){
    ref.update({ estado: 'bloqueada' });
    carRef('cartitasBloqueo/' + yo + '/' + de).set(true);
    carToast('Listo, no vas a recibir más cartitas de esa persona');
  } else if(accion === 'reportar'){
    ref.update({ estado: 'reportada' });
    carRef('cartitasBloqueo/' + yo + '/' + de).set(true);
    carRef('cartitasReportes').push({ de: String(de), n: c.n || '', para: yo, paraN: String(miNombre).slice(0, 20), tipo: c.tipo, t: firebase.database.ServerValue.TIMESTAMP, estado: 'nuevo' });
    carToast('Avisamos al coordinador. Gracias por contarlo.');
  }
}

// El buzón del parque en el mapa: cartel con la cantidad de cartitas nuevas.
function cartitasDibujarBuzon(ctx){
  const x = 320, y = 470;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6B4A2B'; ctx.fillRect(x - 3, y - 30, 6, 34);
  ctx.fillStyle = '#E5334B'; arcRR(ctx, x - 18, y - 56, 36, 28, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; arcRR(ctx, x - 12, y - 49, 24, 5, 2.5); ctx.fill();
  arcEmoji(ctx, '💌', x, y - 36, 16);
  if(cartitas.nuevas > 0 && cartitasActivas()){
    ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(x + 16, y - 58, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#0F2A4D'; ctx.font = '800 11px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(cartitas.nuevas), x + 16, y - 57.5);
  }
}
