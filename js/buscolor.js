// BusColor: nuestro propio juego de cartas de colores, para 2 a 6 jugadores.
// Mismo espíritu que el clásico juego de cartas de colores (números 0-9,
// saltar turno, cambiar el sentido, +2, comodín y comodín +4) pero con
// nombre y mazo propios de Busmac. El dorso de la carta lleva el logo B,
// igual que en Escoba/Chinchón/Truco. Usa el mismo sistema de "mesas" que
// esos juegos: varias mesas pueden convivir dentro del mismo código de viaje.
//
// Cuando a alguien le queda 1 sola carta tiene que avisar tocando el botón
// de "Última carta" antes de que un rival lo agarre: pasados 3 segundos sin
// avisar, cualquier otro jugador puede tocar "Se olvidó" y le hace levantar 2
// de penitencia. Igual que en el mazo real, agrega tensión sin depender de
// que alguien "diga" nada en voz alta (todo queda registrado en la mesa).
//
// Simplificación a propósito, para no complicar de más: los +2/+4 no se
// acumulan entre sí (el que le toca, roba y pierde el turno, sin poder
// pasarle la carga al siguiente).

const BUSCOLOR_COLORES = ['rojo', 'amarillo', 'verde', 'azul'];
const BUSCOLOR_COLOR_HEX = { rojo: '#C22F2F', amarillo: '#E3A916', verde: '#2A8A4A', azul: '#2258A8' };
const BUSCOLOR_COLOR_NOMBRE = { rojo: 'Rojo', amarillo: 'Amarillo', verde: 'Verde', azul: 'Azul' };

function buscolorCrearMazo(){
  const mazo = [];
  BUSCOLOR_COLORES.forEach(color => {
    mazo.push({ color, tipo: 'numero', numero: 0 });
    for(let n = 1; n <= 9; n++){
      mazo.push({ color, tipo: 'numero', numero: n });
      mazo.push({ color, tipo: 'numero', numero: n });
    }
    ['saltar', 'reversa', '+2'].forEach(tipo => {
      mazo.push({ color, tipo });
      mazo.push({ color, tipo });
    });
  });
  for(let i = 0; i < 4; i++){
    mazo.push({ color: null, tipo: 'comodin' });
    mazo.push({ color: null, tipo: 'comodin+4' });
  }
  return barajar(mazo);
}

// Reparte 7 cartas a cada jugador y da vuelta la primera del descarte. Si esa
// primera carta es un comodín, se vuelve a barajar (así el color inicial de
// la mesa siempre está definido).
function buscolorRepartirMano(jugadores){
  let mazo = buscolorCrearMazo();
  const mano = {};
  jugadores.forEach(a => { mano[a] = mazo.splice(0, 7); });
  let primera = mazo.pop();
  while(!primera.color){
    mazo = barajar(mazo.concat([primera]));
    primera = mazo.pop();
  }
  return {
    mano, mazo, descarte: [primera],
    colorActual: primera.color, tipoActual: primera.tipo,
    numeroActual: primera.tipo === 'numero' ? primera.numero : null,
  };
}

let buscolorMesas = {};
let buscolorMesaIdActual = null;
let buscolorCapacidadElegida = 2;
let buscolorEligiendoIndice = null;

function buscolorRefMesas(){ return db.ref(`salas/${codigoViaje}/buscolor/mesas`); }

let buscolorListenersListos = false;

function iniciarBuscolor(){
  if(!buscolorListenersListos){
    buscolorListenersListos = true;
    buscolorRefMesas().on('value', snap => {
      buscolorMesas = snap.val() || {};
      if(buscolorMesaIdActual) buscolorRevisarUltimaCarta(buscolorMesas[buscolorMesaIdActual]);
      renderBuscolor();
    });
  } else {
    renderBuscolor();
  }
}

function buscolorMesaActual(){
  return buscolorMesaIdActual ? buscolorMesas[buscolorMesaIdActual] : null;
}

function buscolorElegirCapacidad(n){
  buscolorCapacidadElegida = n;
  renderBuscolor();
}

function buscolorCrearMesa(){
  if(!miAsiento) return;
  const ref = buscolorRefMesas().push();
  ref.set({
    jugadores: [String(miAsiento)],
    nombres: { [miAsiento]: miNombre },
    capacidad: buscolorCapacidadElegida,
    fase: 'esperando',
  });
  buscolorMesaIdActual = ref.key;
}

function buscolorUnirseAMesa(mesaId){
  if(!miAsiento) return;
  const mesa = buscolorMesas[mesaId];
  if(!mesa || mesa.fase !== 'esperando' || mesa.jugadores.includes(String(miAsiento)) || mesa.jugadores.length >= mesa.capacidad) return;
  const jugadores = mesa.jugadores.concat([String(miAsiento)]);
  const nombres = Object.assign({}, mesa.nombres, { [miAsiento]: miNombre });
  const updates = { jugadores, nombres };

  if(jugadores.length === mesa.capacidad){
    const rep = buscolorRepartirMano(jugadores);
    Object.assign(updates, rep, { sentido: 1, turno: jugadores[0], robado: false, fase: 'jugando' });
  }
  buscolorRefMesas().child(mesaId).update(updates);
  buscolorMesaIdActual = mesaId;
}

function buscolorVolverAlLobby(){
  buscolorMesaIdActual = null;
  buscolorEligiendoIndice = null;
  renderBuscolor();
}

function buscolorTerminarMesa(mesaId){
  buscolorRefMesas().child(mesaId).remove();
  if(buscolorMesaIdActual === mesaId) buscolorVolverAlLobby();
}

function buscolorSiguienteAsiento(mesa, asiento, sentido){
  const idx = mesa.jugadores.indexOf(String(asiento));
  const n = mesa.jugadores.length;
  return mesa.jugadores[(idx + sentido + n) % n];
}

function buscolorPuedeJugarCarta(carta, mesa){
  if(!carta.color) return true;
  if(carta.color === mesa.colorActual) return true;
  if(carta.tipo !== 'numero' && carta.tipo === mesa.tipoActual) return true;
  if(carta.tipo === 'numero' && mesa.tipoActual === 'numero' && carta.numero === mesa.numeroActual) return true;
  return false;
}

// Saca una carta del mazo. Si el mazo se queda vacío, recicla el descarte
// (menos la carta de arriba, que se queda ahí) barajándolo como mazo nuevo.
function buscolorRobarUnaCarta(mazo, descarte){
  if(mazo.length){
    const nuevoMazo = mazo.slice();
    const carta = nuevoMazo.pop();
    return { carta, mazo: nuevoMazo, descarte };
  }
  if(descarte.length > 1){
    const tope = descarte[descarte.length - 1];
    const reciclado = barajar(descarte.slice(0, -1));
    const carta = reciclado.pop();
    return { carta, mazo: reciclado, descarte: [tope] };
  }
  return { carta: null, mazo: [], descarte };
}

// Guarda o limpia, dentro del mismo objeto de updates que ya se va a mandar
// a Firebase, el aviso de "última carta" de un asiento puntual. Va por
// asiento (no un solo campo para toda la mesa) porque en una mesa de 3 a 6
// puede haber más de un jugador con 1 sola carta al mismo tiempo.
function buscolorActualizarUltimaCarta(mesa, asiento, nuevaLongitud, updates){
  asiento = String(asiento);
  const yaFlagueado = mesa.ultimaCarta && mesa.ultimaCarta[asiento];
  if(nuevaLongitud === 1){
    updates[`ultimaCarta/${asiento}`] = { avisada: false, momento: Date.now() };
  } else if(yaFlagueado){
    updates[`ultimaCarta/${asiento}`] = null;
  }
}

function buscolorCalcularSiguienteTurno(mesa, jugadorQueJugo, carta){
  let sentido = mesa.sentido || 1;
  let saltos = 1;
  let jugadorPenalizado = null;
  let cartasPenalizado = 0;
  if(carta.tipo === 'reversa'){
    if(mesa.jugadores.length === 2){ saltos = 2; }
    else { sentido = -sentido; }
  } else if(carta.tipo === 'saltar'){
    saltos = 2;
  } else if(carta.tipo === '+2'){
    saltos = 2; jugadorPenalizado = buscolorSiguienteAsiento(mesa, jugadorQueJugo, sentido); cartasPenalizado = 2;
  } else if(carta.tipo === 'comodin+4'){
    saltos = 2; jugadorPenalizado = buscolorSiguienteAsiento(mesa, jugadorQueJugo, sentido); cartasPenalizado = 4;
  }
  let asiento = jugadorQueJugo;
  for(let i = 0; i < saltos; i++) asiento = buscolorSiguienteAsiento(mesa, asiento, sentido);
  return { sentido, siguienteTurno: asiento, jugadorPenalizado, cartasPenalizado };
}

function buscolorLevantar(){
  const mesa = buscolorMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento) || mesa.robado) return;
  const r = buscolorRobarUnaCarta((mesa.mazo || []).slice(), (mesa.descarte || []).slice());
  if(!r.carta) return;
  const mano = (mesa.mano[String(miAsiento)] || []).concat([r.carta]);
  const updates = {
    mazo: r.mazo, descarte: r.descarte, [`mano/${miAsiento}`]: mano, robado: true,
  };
  buscolorActualizarUltimaCarta(mesa, miAsiento, mano.length, updates);
  buscolorRefMesas().child(buscolorMesaIdActual).update(updates);
}

function buscolorPasarTurno(){
  const mesa = buscolorMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento) || !mesa.robado) return;
  const siguiente = buscolorSiguienteAsiento(mesa, String(miAsiento), mesa.sentido || 1);
  buscolorRefMesas().child(buscolorMesaIdActual).update({ turno: siguiente, robado: false });
}

// Tocar una carta de tu mano intenta jugarla directo (como en Escoba), sin
// botón aparte. Si es comodín, primero hay que elegir de qué color sigue.
function buscolorTocarCarta(indice){
  const mesa = buscolorMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento)) return;
  const carta = (mesa.mano[String(miAsiento)] || [])[indice];
  if(!carta || !buscolorPuedeJugarCarta(carta, mesa)) return;
  if(!carta.color){
    buscolorEligiendoIndice = indice;
    renderBuscolor();
    return;
  }
  buscolorJugarCarta(indice, null);
}

function buscolorElegirColorComodin(color){
  if(buscolorEligiendoIndice == null) return;
  buscolorJugarCarta(buscolorEligiendoIndice, color);
  buscolorEligiendoIndice = null;
}

function buscolorJugarCarta(indice, colorElegido){
  const mesa = buscolorMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento)) return;
  const miMano = (mesa.mano[String(miAsiento)] || []).slice();
  const carta = miMano[indice];
  if(!carta || !buscolorPuedeJugarCarta(carta, mesa)) return;
  if(!carta.color && !colorElegido) return;

  const nuevaMano = miMano.filter((_, i) => i !== indice);
  const descarte = (mesa.descarte || []).concat([carta]);
  const colorActual = carta.color || colorElegido;
  buscolorEligiendoIndice = null;

  if(nuevaMano.length === 0){
    const updatesFin = {
      [`mano/${miAsiento}`]: nuevaMano, descarte,
      colorActual, tipoActual: carta.tipo, numeroActual: carta.tipo === 'numero' ? carta.numero : null,
      fase: 'terminado', ganador: String(miAsiento), robado: false,
    };
    buscolorActualizarUltimaCarta(mesa, miAsiento, 0, updatesFin);
    buscolorRefMesas().child(buscolorMesaIdActual).update(updatesFin);
    return;
  }

  const { sentido, siguienteTurno, jugadorPenalizado, cartasPenalizado } = buscolorCalcularSiguienteTurno(mesa, String(miAsiento), carta);
  const updates = {
    [`mano/${miAsiento}`]: nuevaMano, descarte,
    colorActual, tipoActual: carta.tipo, numeroActual: carta.tipo === 'numero' ? carta.numero : null,
    sentido, turno: siguienteTurno, robado: false,
  };
  buscolorActualizarUltimaCarta(mesa, miAsiento, nuevaMano.length, updates);

  if(cartasPenalizado && jugadorPenalizado){
    let mazo = (mesa.mazo || []).slice();
    let descarteTrabajo = descarte.slice();
    const manoPenalizado = (mesa.mano[jugadorPenalizado] || []).slice();
    for(let i = 0; i < cartasPenalizado; i++){
      const r = buscolorRobarUnaCarta(mazo, descarteTrabajo);
      mazo = r.mazo; descarteTrabajo = r.descarte;
      if(r.carta) manoPenalizado.push(r.carta);
    }
    updates[`mano/${jugadorPenalizado}`] = manoPenalizado;
    updates.mazo = mazo;
    updates.descarte = descarteTrabajo;
    buscolorActualizarUltimaCarta(mesa, jugadorPenalizado, manoPenalizado.length, updates);
  }

  buscolorRefMesas().child(buscolorMesaIdActual).update(updates);
}

// Avisar a tiempo: el propio jugador toca el botón apenas ve que le queda 1
// sola carta, así queda a salvo de que lo agarren.
function buscolorCantarUltimaCarta(){
  const mesa = buscolorMesaActual();
  if(!mesa) return;
  const flag = mesa.ultimaCarta && mesa.ultimaCarta[String(miAsiento)];
  if(!flag || flag.avisada) return;
  buscolorRefMesas().child(buscolorMesaIdActual).update({ [`ultimaCarta/${miAsiento}/avisada`]: true });
}

// Agarrar a un rival que se olvidó de avisar: solo se puede pasados los 3
// segundos, y le hace levantar 2 cartas de penitencia.
function buscolorAtraparOlvido(asientoOlvidadizo){
  const mesa = buscolorMesaActual();
  if(!mesa) return;
  asientoOlvidadizo = String(asientoOlvidadizo);
  if(asientoOlvidadizo === String(miAsiento)) return;
  const flag = mesa.ultimaCarta && mesa.ultimaCarta[asientoOlvidadizo];
  if(!flag || flag.avisada) return;
  if(Date.now() - (flag.momento || 0) < 3000) return;

  let mazo = (mesa.mazo || []).slice();
  let descarte = (mesa.descarte || []).slice();
  const mano = (mesa.mano[asientoOlvidadizo] || []).slice();
  for(let i = 0; i < 2; i++){
    const r = buscolorRobarUnaCarta(mazo, descarte);
    mazo = r.mazo; descarte = r.descarte;
    if(r.carta) mano.push(r.carta);
  }
  buscolorRefMesas().child(buscolorMesaIdActual).update({
    [`mano/${asientoOlvidadizo}`]: mano, mazo, descarte,
    [`ultimaCarta/${asientoOlvidadizo}`]: null,
    avisoOlvido: { asiento: asientoOlvidadizo, momento: Date.now() },
  });
}

let buscolorPremiadoMesa = null;

function buscolorPremiarSiCorresponde(mesa){
  if(!miAsiento || !mesa || mesa.fase !== 'terminado' || !mesa.ganador) return;
  if(buscolorPremiadoMesa === buscolorMesaIdActual) return;
  if(!mesa.jugadores.includes(String(miAsiento))) return;
  buscolorPremiadoMesa = buscolorMesaIdActual;
  if(String(mesa.ganador) === String(miAsiento)){
    ganarMonedas(25);
    mostrarToast('¡BusColor! Te quedaste sin cartas primero. +25 monedas', 'gain');
  } else {
    mostrarToast(`Ganó ${mesa.nombres[mesa.ganador]}, se quedó sin cartas primero.`);
  }
}

// Avisos de "última carta": comparo el mapa ultimaCarta (y el marcador
// avisoOlvido) contra lo que había en el render anterior, para mostrarle a
// TODOS los jugadores el mismo aviso en el mismo momento, sin depender de
// quién hizo el toque que originó el cambio.
let buscolorEstadoBaseline = {};

function buscolorRevisarUltimaCarta(mesa){
  if(!mesa || mesa.fase !== 'jugando') return;
  const clave = buscolorMesaIdActual;
  const anterior = buscolorEstadoBaseline[clave] || { flags: {}, olvidoMomento: null };
  const actualFlags = mesa.ultimaCarta || {};

  Object.keys(actualFlags).forEach(asiento => {
    const actual = actualFlags[asiento];
    const previo = anterior.flags[asiento];
    if(!previo){
      const quien = String(asiento) === String(miAsiento) ? 'Te quedaste' : `${mesa.nombres[asiento]} se quedó`;
      mostrarToast(`🔔 ${quien} con 1 carta — ¡que no se olvide de avisar!`);
    } else if(actual.avisada && !previo.avisada){
      const quien = String(asiento) === String(miAsiento) ? '¡Avisaste' : `${mesa.nombres[asiento]} avisó`;
      mostrarToast(`📣 ${quien} "última carta" a tiempo!`);
    }
  });

  const olvidoMomento = (mesa.avisoOlvido && mesa.avisoOlvido.momento) || null;
  if(olvidoMomento && olvidoMomento !== anterior.olvidoMomento){
    const asientoOlvido = mesa.avisoOlvido.asiento;
    const quien = String(asientoOlvido) === String(miAsiento) ? 'Te olvidaste' : `${mesa.nombres[asientoOlvido]} se olvidó`;
    mostrarToast(`😅 ${quien} de avisar "última carta" — levantó 2 de penitencia`);
  }

  const flagsCopia = {};
  Object.keys(actualFlags).forEach(a => { flagsCopia[a] = { avisada: !!actualFlags[a].avisada }; });
  buscolorEstadoBaseline[clave] = { flags: flagsCopia, olvidoMomento };
}

// Mientras un rival todavía está dentro de la ventana de 3 segundos, no hay
// ningún cambio en Firebase que dispare un re-render cuando se cumplan: hay
// que programarlo del lado del cliente para que el botón "Se olvidó" aparezca solo.
let buscolorTimerCatch = null;

function buscolorProgramarRevisionCatch(ms){
  if(buscolorTimerCatch) return;
  buscolorTimerCatch = setTimeout(() => {
    buscolorTimerCatch = null;
    renderBuscolor();
  }, Math.max(ms, 50));
}

// "soloVista" es para cartas que se muestran pero nunca se tocan (el tope
// del descarte): tienen que verse a todo color igual, no "apagadas" como
// una carta de la mano que no combina.
function buscolorCartaHTML(carta, seleccionada, onclick, soloVista){
  const claseColor = carta.color ? `buscolor-carta-${carta.color}` : 'buscolor-carta-negra';
  let marca, centro;
  if(carta.tipo === 'numero'){ marca = carta.numero; centro = `<span class="buscolor-carta-simbolo">${carta.numero}</span>`; }
  else if(carta.tipo === 'saltar'){ marca = '🚫'; centro = `<span class="buscolor-carta-simbolo">🚫</span>`; }
  else if(carta.tipo === 'reversa'){ marca = '🔁'; centro = `<span class="buscolor-carta-simbolo">🔁</span>`; }
  else if(carta.tipo === '+2'){ marca = '+2'; centro = `<span class="buscolor-carta-simbolo">+2</span>`; }
  else if(carta.tipo === 'comodin'){ marca = '★'; centro = `<span class="buscolor-carta-comodin-icono"></span>`; }
  else { marca = '+4'; centro = `<span class="buscolor-carta-comodin-icono"></span><span class="buscolor-carta-mas4">+4</span>`; }
  const clases = `buscolor-carta ${claseColor} ${seleccionada ? 'buscolor-carta-seleccionada' : ''} ${soloVista ? 'buscolor-carta-vista' : ''}`;
  const atributos = onclick ? `onclick="${onclick}"` : (soloVista ? '' : 'disabled');
  const etiqueta = soloVista ? 'div' : 'button';
  return `<${etiqueta} class="${clases}" ${atributos}>
    <span class="bc-esq bc-esq-1">${marca}</span>
    <span class="bc-oval">${centro}</span>
    <span class="bc-esq bc-esq-2">${marca}</span>
  </${etiqueta}>`;
}

function renderBuscolorLobby(){
  const cont = document.getElementById('buscolor-content');
  const mesasArray = Object.keys(buscolorMesas).map(id => Object.assign({ id }, buscolorMesas[id]));
  const listaHTML = mesasArray.length ? mesasArray.map(m => {
    const nombres = m.jugadores.map(a => m.nombres[a]).join(', ');
    const estado = m.fase === 'esperando' ? `Esperando jugadores (${m.jugadores.length}/${m.capacidad})` : m.fase === 'jugando' ? 'Jugando' : 'Terminada';
    const puedoUnirme = m.fase === 'esperando' && m.jugadores.length < m.capacidad && !m.jugadores.includes(String(miAsiento));
    const puedoEntrar = m.jugadores.includes(String(miAsiento));
    return `<div class="bingo-roster-item">
      <span>${nombres}<br><span style="font-size:11px;color:var(--gray);">${estado}</span></span>
      <span class="bingo-roster-derecha">
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="buscolorMesaIdActual='${m.id}'; renderBuscolor();">Entrar</button>` : ''}
        ${puedoUnirme ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;background:#3B9B5A;color:#fff;border-color:#3B9B5A;" onclick="buscolorUnirseAMesa('${m.id}')">Unirme</button>` : ''}
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" onclick="buscolorTerminarMesa('${m.id}')" title="Eliminar mesa">✕</button>` : ''}
      </span>
    </div>`;
  }).join('') : '<p style="color:var(--gray);font-size:13px;">Todavía no hay mesas. ¡Armá la primera!</p>';

  cont.innerHTML = `
    ${gEscenaHTML('grafito', `
      ${gDialogoHTML('BusColor', 'De 2 a 6 jugadores. Jugá una carta que combine en color, número o símbolo con la de arriba. El primero en quedarse sin cartas gana.')}
      <div class="g-dialogo-sub" style="text-align:center;margin-bottom:6px;font-weight:700;">¿Con cuántos jugadores?</div>
      <div class="g-acciones" style="grid-template-columns:repeat(5,1fr);">
        ${[2, 3, 4, 5, 6].map(n => `<button class="gbtn ${buscolorCapacidadElegida === n ? 'gbtn-sel' : 'gbtn-no'}" onclick="buscolorElegirCapacidad(${n})">${n}</button>`).join('')}
      </div>
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="buscolorCrearMesa()">Crear mesa nueva</button></div>`)}
    <div class="section-label">Mesas</div>
    ${listaHTML}`;
}

function renderBuscolorMesa(){
  const cont = document.getElementById('buscolor-content');
  const mesa = buscolorMesaActual();
  if(!mesa){ buscolorVolverAlLobby(); return; }

  if(mesa.fase === 'esperando'){
    cont.innerHTML = gEscenaHTML('grafito', `
      ${gDialogoHTML('Esperando jugadores...', `${mesa.jugadores.length} de ${mesa.capacidad}. Compartí la app para que se sumen los que falten.`)}
      <div class="m-rival-mano" style="margin:6px 0 10px;">${Array.from({ length: mesa.capacidad }).map((_, i) => `<div class="m-dorso" style="${i < mesa.jugadores.length ? '' : 'opacity:.3;'}"></div>`).join('')}</div>
      <div class="g-pie"><span onclick="buscolorVolverAlLobby()">‹ Volver a la lista de mesas</span><span onclick="buscolorTerminarMesa('${buscolorMesaIdActual}')">Cancelar esta mesa</span></div>`);
    return;
  }

  const marcadorHTML = `<div class="g-hud g-hud-varios">${mesa.jugadores.map(a => {
    const flag = (mesa.ultimaCarta || {})[a];
    const badge = flag && !flag.avisada ? ' 🔔' : '';
    const yo = String(a) === String(miAsiento);
    return `<div class="g-score ${yo ? 'g-score-yo' : ''}"><span class="g-score-nombre">${yo ? 'Vos' : mesa.nombres[a]}</span><span class="g-score-puntos" style="font-size:20px;">${((mesa.mano || {})[a] || []).length}<small>🂠${badge}</small></span></div>`;
  }).join('')}</div>`;

  if(mesa.fase === 'terminado'){
    cont.innerHTML = gEscenaHTML('grafito', `
      ${marcadorHTML}
      ${gDialogoHTML(String(mesa.ganador) === String(miAsiento) ? '🏆 ¡Ganaste!' : `Ganó ${mesa.nombres[mesa.ganador]}`, 'Se quedó sin cartas primero.')}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="buscolorTerminarMesa('${buscolorMesaIdActual}')">Cerrar esta mesa</button></div>
      <div class="g-pie"><span onclick="buscolorVolverAlLobby()">‹ Volver a la lista de mesas</span></div>`);
    buscolorPremiarSiCorresponde(mesa);
    return;
  }

  const soyTurno = String(mesa.turno) === String(miAsiento);
  const miMano = (mesa.mano && mesa.mano[String(miAsiento)]) || [];
  const descarteTope = (mesa.descarte || [])[(mesa.descarte || []).length - 1];
  const puedeLevantar = soyTurno && !mesa.robado;
  const mazoLen = (mesa.mazo || []).length;

  if(soyTurno && buscolorEligiendoIndice != null){
    cont.innerHTML = gEscenaHTML('grafito', `
      ${marcadorHTML}
      ${gDialogoHTML('Elegí de qué color sigue', 'Jugaste un comodín: elegí el color con el que continúa la mesa.')}
      <div class="buscolor-elegir-color">
        ${BUSCOLOR_COLORES.map(c => `<button style="background:${BUSCOLOR_COLOR_HEX[c]};" onclick="buscolorElegirColorComodin('${c}')" title="${BUSCOLOR_COLOR_NOMBRE[c]}"></button>`).join('')}
      </div>`);
    return;
  }

  const mazoSeVePuedeUsar = puedeLevantar && mazoLen;
  const mazoHTML = `<div class="truco-jugada">
    <button class="m-dorso-media ${mazoSeVePuedeUsar ? 'm-dorso-activo' : ''}" style="width:62px;height:92px;" ${mazoSeVePuedeUsar ? `onclick="buscolorLevantar()"` : 'disabled'} aria-label="Levantar del mazo"></button>
    <div class="truco-jugada-nombre">Mazo (${mazoLen})</div>
  </div>`;
  const descarteHTML = descarteTope ? `<div class="truco-jugada">
    ${buscolorCartaHTML(descarteTope, false, null, true)}
    <div class="truco-jugada-nombre">Descarte</div>
  </div>` : '<div class="truco-vacio">Sin descarte todavía</div>';

  const colorActualHTML = `<span class="g-chip"><span class="buscolor-color-punto" style="background:${BUSCOLOR_COLOR_HEX[mesa.colorActual]};"></span> Color: ${BUSCOLOR_COLOR_NOMBRE[mesa.colorActual]}</span>`;

  const hayJugada = miMano.some(c => buscolorPuedeJugarCarta(c, mesa));

  let accionesHTML = '';
  if(soyTurno && mesa.robado){
    accionesHTML = `<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-no" style="font-size:14px;" onclick="buscolorPasarTurno()">🚫 Pasar turno, no tengo con qué jugar</button></div>`;
  }

  // El aviso de "última carta" y la posibilidad de agarrar a un rival que se
  // olvidó valen en cualquier momento, sea o no tu turno.
  let ultimaCartaHTML = '';
  const miFlag = (mesa.ultimaCarta || {})[String(miAsiento)];
  if(miFlag && !miFlag.avisada){
    ultimaCartaHTML += `<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-violeta" onclick="buscolorCantarUltimaCarta()">🔔 ¡Avisar "Última carta"!</button></div>`;
  }
  Object.keys(mesa.ultimaCarta || {}).filter(a => a !== String(miAsiento) && mesa.ultimaCarta[a] && !mesa.ultimaCarta[a].avisada).forEach(a => {
    const flag = mesa.ultimaCarta[a];
    const faltan = 3000 - (Date.now() - (flag.momento || 0));
    if(faltan <= 0){
      ultimaCartaHTML += `<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-rojo" style="font-size:13px;" onclick="buscolorAtraparOlvido('${a}')">😅 ¡${mesa.nombres[a]} se olvidó de avisar! Agarralo (+2)</button></div>`;
    } else {
      buscolorProgramarRevisionCatch(faltan);
    }
  });

  // Fila compacta de rivales (nombre + cuánto le queda), que además resalta
  // de un vistazo a quién le toca jugar.
  const otros = mesa.jugadores.filter(a => a !== String(miAsiento));
  const otrosHTML = otros.length ? `
    <div class="buscolor-rivales">
      ${otros.map(a => {
        const cant = ((mesa.mano || {})[a] || []).length;
        const flag = (mesa.ultimaCarta || {})[a];
        const badge = flag && !flag.avisada ? ' 🔔' : '';
        const esSuTurno = String(mesa.turno) === a;
        return `<div class="buscolor-rival-chip ${esSuTurno ? 'buscolor-rival-chip-turno' : ''}">
          <span class="buscolor-rival-nombre">${mesa.nombres[a]}</span>
          <span class="buscolor-rival-cant">${cant} 🂠${badge}</span>
        </div>`;
      }).join('')}
    </div>` : '';

  // Las cartas que no combinan se muestran apagadas y sin acción: así queda
  // claro de un vistazo cuáles sirven, en vez de tocar y que no pase nada.
  const manoHTML = miMano.map((c, i) => {
    const jugable = soyTurno && buscolorPuedeJugarCarta(c, mesa);
    return buscolorCartaHTML(c, false, jugable ? `buscolorTocarCarta(${i})` : null);
  }).join('');

  let mensajeTurno;
  if(!soyTurno) mensajeTurno = `Turno de ${mesa.nombres[mesa.turno]}`;
  else if(hayJugada) mensajeTurno = '¡Tu turno!';
  else if(!mesa.robado) mensajeTurno = 'Tu turno: sin jugada';
  else mensajeTurno = 'Tu turno: seguís sin jugada';

  let mensajeAyuda;
  if(!soyTurno) mensajeAyuda = 'Esperá a que juegue.';
  else if(hayJugada) mensajeAyuda = 'Tocá una carta que combine, o el mazo para levantar.';
  else if(!mesa.robado) mensajeAyuda = 'Ninguna combina. Tocá el mazo para levantar una.';
  else mensajeAyuda = 'Seguís sin ninguna que combine. Tocá "Pasar turno".';

  cont.innerHTML = gEscenaHTML('grafito', `
    ${otrosHTML}
    <div class="m-tapete m-tapete-grafito">
      <div class="g-chips">${colorActualHTML}</div>
      <div class="truco-jugadas">${mazoHTML}${descarteHTML}</div>
    </div>
    <div class="m-turno-wrap"><span class="m-turno ${soyTurno ? 'm-turno-mio' : ''}">${mensajeTurno}</span></div>
    <p class="g-ayuda">${mensajeAyuda}</p>
    ${ultimaCartaHTML}
    ${accionesHTML}
    <div class="bc-mano">${manoHTML}</div>
    <div class="g-pie"><span></span><span onclick="buscolorTerminarMesa('${buscolorMesaIdActual}')">Abandonar mesa</span></div>`);
}

function renderBuscolor(){
  const cont = document.getElementById('buscolor-content');
  if(!cont) return;
  document.getElementById('buscolor-sub').textContent = buscolorMesaIdActual ? 'En una mesa' : 'Elegí o creá una mesa';
  const enMesa = !!(buscolorMesaIdActual && buscolorMesas[buscolorMesaIdActual]);
  document.getElementById('view-buscolor').classList.toggle('juego-inmersivo', enMesa);
  if(enMesa) renderBuscolorMesa();
  else { buscolorMesaIdActual = null; renderBuscolorLobby(); }
}
