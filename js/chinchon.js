// Chinchón, para 2 a 4 jugadores. Usa el mismo sistema de "mesas" que
// Escoba: varias mesas pueden convivir dentro del mismo código de viaje.
//
// Mazo de 50 cartas: las 48 del palo español completo (con 8 y 9 incluidos,
// a diferencia de Escoba/Truco que los sacan) más 2 comodines. Un comodín
// reemplaza cualquier carta dentro de un grupo o una escalera. Podés cerrar
// la mano cuando, formando tus grupos (mismo número, palos distintos) y
// escaleras (3+ consecutivas del mismo palo), te queda como máximo 1 carta
// suelta. Si te quedan las 7 cartas combinadas (0 sueltas), es un "Chinchón"
// y los demás duplican lo que sumarían esa mano. Se juegan manos seguidas
// hasta que alguien llega a 100 puntos acumulados — ahí gana quien tenga
// MENOS puntos. Sin "hueso"/corte con penalidad parcial: eso queda afuera
// a propósito para no complicar de más.

const CHINCHON_ORDEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CHINCHON_META_PUNTOS = 100;
const CHINCHON_VALOR_COMODIN_SUELTO = 20;

function chinchonValor(numero){ return numero <= 9 ? numero : 10; }
function chinchonValorSuelta(carta){ return carta.comodin ? CHINCHON_VALOR_COMODIN_SUELTO : chinchonValor(carta.numero); }

function chinchonEsGrupo(cartas){
  if(cartas.length < 3) return false;
  const reales = cartas.filter(c => !c.comodin);
  if(!reales.length) return false;
  const numero = reales[0].numero;
  if(!reales.every(c => c.numero === numero)) return false;
  const palos = reales.map(c => c.palo);
  return new Set(palos).size === palos.length;
}

// Con comodines, una escalera ya no exige que todas las posiciones estén
// presentes: alcanza con que las cartas reales quepan en un tramo del mismo
// palo, y que haya suficientes comodines (más lugar libre en las puntas)
// para tapar los huecos que falten.
function chinchonEsEscalera(cartas){
  if(cartas.length < 3) return false;
  const reales = cartas.filter(c => !c.comodin);
  const comodines = cartas.length - reales.length;
  if(!reales.length) return false;
  const palo = reales[0].palo;
  if(!reales.every(c => c.palo === palo)) return false;
  const posiciones = reales.map(c => CHINCHON_ORDEN.indexOf(c.numero));
  if(new Set(posiciones).size !== posiciones.length) return false;
  const min = Math.min(...posiciones), max = Math.max(...posiciones);
  const huecosInternos = (max - min + 1) - reales.length;
  if(huecosInternos > comodines) return false;
  const comodinesSobrantes = comodines - huecosInternos;
  const espacioDisponible = min + (CHINCHON_ORDEN.length - 1 - max);
  return comodinesSobrantes <= espacioDisponible;
}

function chinchonEsCombinacionValida(cartas){
  return chinchonEsGrupo(cartas) || chinchonEsEscalera(cartas);
}

// Todos los subconjuntos (de 3 o más) de la mano que forman una combinación
// válida. Con 7 cartas como mucho son 2^7 subconjuntos a revisar: rapidísimo.
function chinchonTodasCombinaciones(mano){
  const combos = [];
  const n = mano.length;
  for(let mask = 1; mask < (1 << n); mask++){
    const idxs = [];
    for(let i = 0; i < n; i++) if(mask & (1 << i)) idxs.push(i);
    if(idxs.length < 3) continue;
    if(chinchonEsCombinacionValida(idxs.map(i => mano[i]))) combos.push(idxs);
  }
  return combos;
}

// Busca la combinación de grupos/escaleras (sin repetir cartas entre sí)
// que deja la menor cantidad de puntos sueltos.
function chinchonMejorParticion(mano){
  const combos = chinchonTodasCombinaciones(mano);
  const todosIndices = mano.map((_, i) => i);
  let mejor = { deadwood: mano.reduce((s, c) => s + chinchonValorSuelta(c), 0), sueltas: todosIndices };
  function buscar(usados){
    const sueltas = todosIndices.filter(i => !usados.has(i));
    const deadwood = sueltas.reduce((s, i) => s + chinchonValorSuelta(mano[i]), 0);
    if(deadwood < mejor.deadwood) mejor = { deadwood, sueltas };
    for(const combo of combos){
      if(combo.some(i => usados.has(i))) continue;
      const nuevo = new Set(usados);
      combo.forEach(i => nuevo.add(i));
      buscar(nuevo);
    }
  }
  buscar(new Set());
  return mejor;
}

function chinchonPuedeCerrar(mano){
  if(!mano || mano.length !== 7) return false;
  return chinchonMejorParticion(mano).sueltas.length <= 1;
}

// En el juego real se corta después de levantar una carta: tenés 8, tirás una
// boca abajo para cortar y las 7 que quedan tienen que estar ligadas (a lo
// sumo 1 suelta). Antes se revisaba la mano de 8 como si fueran 7, así que
// nunca se podía cortar.
function chinchonPuedeCerrarDescartando(mano, indiceDescarte){
  if(!mano || mano.length !== 8 || indiceDescarte == null || indiceDescarte < 0 || indiceDescarte >= mano.length) return false;
  return chinchonPuedeCerrar(mano.filter((_, i) => i !== indiceDescarte));
}

function chinchonExisteCierre(mano){
  if(!mano || mano.length !== 8) return false;
  return mano.some((_, i) => chinchonPuedeCerrarDescartando(mano, i));
}

let chinchonMesas = {};
let chinchonMesaIdActual = null;
let chinchonCartaSeleccionada = null;
let chinchonCapacidadElegida = 2;

function chinchonRefMesas(){ return db.ref(`salas/${codigoViaje}/chinchon/mesas`); }

let chinchonListenersListos = false;

function iniciarChinchon(){
  if(!chinchonListenersListos){
    chinchonListenersListos = true;
    chinchonRefMesas().on('value', snap => {
      chinchonMesas = snap.val() || {};
      renderChinchon();
    });
  } else {
    renderChinchon();
  }
}

function chinchonMesaActual(){
  return chinchonMesaIdActual ? chinchonMesas[chinchonMesaIdActual] : null;
}

function chinchonElegirCapacidad(n){
  chinchonCapacidadElegida = n;
  renderChinchon();
}

function chinchonCrearMesa(){
  if(!miAsiento) return;
  const ref = chinchonRefMesas().push();
  ref.set({
    jugadores: [String(miAsiento)],
    nombres: { [miAsiento]: miNombre },
    capacidad: chinchonCapacidadElegida,
    fase: 'esperando',
  });
  chinchonMesaIdActual = ref.key;
}

function chinchonCrearMazo(){
  const mazo = [];
  ESCOBA_PALOS.forEach(palo => CHINCHON_ORDEN.forEach(numero => mazo.push({ palo, numero })));
  mazo.push({ comodin: true }, { comodin: true });
  return barajar(mazo);
}

function chinchonRepartirMano(jugadores){
  const mazo = chinchonCrearMazo();
  const mano = {};
  jugadores.forEach(a => { mano[a] = mazo.splice(0, 7); });
  const descarte = mazo.splice(0, 1);
  return { mano, mazo, descarte };
}

function chinchonUnirseAMesa(mesaId){
  if(!miAsiento) return;
  const mesa = chinchonMesas[mesaId];
  if(!mesa || mesa.fase !== 'esperando' || mesa.jugadores.includes(String(miAsiento)) || mesa.jugadores.length >= mesa.capacidad) return;
  const jugadores = mesa.jugadores.concat([String(miAsiento)]);
  const nombres = Object.assign({}, mesa.nombres, { [miAsiento]: miNombre });
  const updates = { jugadores, nombres };

  if(jugadores.length === mesa.capacidad){
    const { mano, mazo, descarte } = chinchonRepartirMano(jugadores);
    const puntajeTotal = {};
    jugadores.forEach(a => { puntajeTotal[a] = 0; });
    Object.assign(updates, {
      mano, mazo, descarte, puntajeTotal,
      turno: jugadores[0], robado: false, manoNumero: 1,
      resultadoMano: null, ganadorFinal: null, fase: 'jugando',
    });
  }
  chinchonRefMesas().child(mesaId).update(updates);
  chinchonMesaIdActual = mesaId;
}

function chinchonVolverAlLobby(){
  chinchonMesaIdActual = null;
  chinchonCartaSeleccionada = null;
  chinchonModoOrden = false;
  chinchonOrdenElegido = null;
  renderChinchon();
}

function chinchonTerminarMesa(mesaId){
  chinchonRefMesas().child(mesaId).remove();
  if(chinchonMesaIdActual === mesaId) chinchonVolverAlLobby();
}

function chinchonSiguienteJugador(mesa, asiento){
  const idx = mesa.jugadores.indexOf(String(asiento));
  return mesa.jugadores[(idx + 1) % mesa.jugadores.length];
}

// Se toca directamente la carta del mazo/descarte en la mesa (como en
// Escoba), en vez de un botón aparte. "Levantar" = del mazo boca abajo,
// "alzar" = el descarte boca arriba, siguiendo la jerga real del juego.
function chinchonLevantarDelMazo(){
  const mesa = chinchonMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento) || mesa.robado) return;
  const mazo = (mesa.mazo || []).slice();
  if(!mazo.length) return;
  const carta = mazo.pop();
  const mano = (mesa.mano[String(miAsiento)] || []).concat([carta]);
  chinchonRefMesas().child(chinchonMesaIdActual).update({ mazo, [`mano/${miAsiento}`]: mano, robado: true });
}

function chinchonAlzarDescarte(){
  const mesa = chinchonMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento) || mesa.robado) return;
  const descarte = (mesa.descarte || []).slice();
  if(!descarte.length) return;
  const carta = descarte.pop();
  const mano = (mesa.mano[String(miAsiento)] || []).concat([carta]);
  chinchonRefMesas().child(chinchonMesaIdActual).update({ descarte, [`mano/${miAsiento}`]: mano, robado: true });
}

function chinchonToggleCarta(indice){
  chinchonCartaSeleccionada = chinchonCartaSeleccionada === indice ? null : indice;
  renderChinchon();
}

// Modo para acomodar tu propia mano en el orden que quieras (no afecta el
// juego para nada, es solo para vos): tocás una carta, tocás otra, y se
// intercambian de lugar. Se guarda en Firebase para que el orden no se
// pierda en el próximo render, pero solo vos lo ves así.
let chinchonModoOrden = false;
let chinchonOrdenElegido = null;

function chinchonToggleModoOrden(){
  chinchonModoOrden = !chinchonModoOrden;
  chinchonOrdenElegido = null;
  chinchonCartaSeleccionada = null;
  renderChinchon();
}

function chinchonOrdenarTocar(indice){
  const mesa = chinchonMesaActual();
  if(!mesa) return;
  if(chinchonOrdenElegido == null || chinchonOrdenElegido === indice){
    chinchonOrdenElegido = chinchonOrdenElegido === indice ? null : indice;
    renderChinchon();
    return;
  }
  const miMano = (mesa.mano[String(miAsiento)] || []).slice();
  const tmp = miMano[chinchonOrdenElegido];
  miMano[chinchonOrdenElegido] = miMano[indice];
  miMano[indice] = tmp;
  chinchonOrdenElegido = null;
  chinchonRefMesas().child(chinchonMesaIdActual).update({ [`mano/${miAsiento}`]: miMano });
}

function chinchonDescartar(){
  const mesa = chinchonMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento) || !mesa.robado) return;
  if(chinchonCartaSeleccionada == null) return;
  const miMano = mesa.mano[String(miAsiento)];
  const carta = miMano[chinchonCartaSeleccionada];
  const nuevaMano = miMano.filter((_, i) => i !== chinchonCartaSeleccionada);
  const descarte = (mesa.descarte || []).concat([carta]);
  const siguiente = chinchonSiguienteJugador(mesa, miAsiento);
  chinchonCartaSeleccionada = null;

  if(!(mesa.mazo || []).length){
    chinchonCerrarMano(mesa, null, { [miAsiento]: nuevaMano }, descarte);
    return;
  }
  chinchonRefMesas().child(chinchonMesaIdActual).update({
    [`mano/${miAsiento}`]: nuevaMano, descarte, turno: siguiente, robado: false,
  });
}

function chinchonCerrar(){
  const mesa = chinchonMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento) || !mesa.robado) return;
  const miMano = mesa.mano[String(miAsiento)];
  const indice = chinchonCartaSeleccionada;
  if(!chinchonPuedeCerrarDescartando(miMano, indice)) return;
  const cartaDescartada = miMano[indice];
  const manoFinal = miMano.filter((_, i) => i !== indice);
  chinchonCartaSeleccionada = null;
  chinchonCerrarMano(mesa, String(miAsiento), { [String(miAsiento)]: manoFinal }, (mesa.descarte || []).concat([cartaDescartada]));
}

// Cierra la mano actual (por corte de alguien, o porque se acabó el mazo) y
// calcula el puntaje de todos según su mejor combinación posible.
function chinchonCerrarMano(mesa, cerroAsiento, manoActualizadaOverride, descarteFinal){
  const manoFinal = Object.assign({}, mesa.mano, manoActualizadaOverride || {});
  const deadwoodPorJugador = {};
  mesa.jugadores.forEach(a => {
    deadwoodPorJugador[a] = chinchonMejorParticion(manoFinal[a] || []).deadwood;
  });
  const chinchonPerfecto = cerroAsiento && deadwoodPorJugador[cerroAsiento] === 0 && (manoFinal[cerroAsiento] || []).length === 7
    ? chinchonMejorParticion(manoFinal[cerroAsiento]).sueltas.length === 0 : false;

  const puntajeTotal = Object.assign({}, mesa.puntajeTotal);
  mesa.jugadores.forEach(a => {
    if(a === cerroAsiento) return; // quien cierra suma 0 en esta mano
    const suma = chinchonPerfecto ? deadwoodPorJugador[a] * 2 : deadwoodPorJugador[a];
    puntajeTotal[a] = (puntajeTotal[a] || 0) + suma;
  });

  const alguienLlego = mesa.jugadores.some(a => puntajeTotal[a] >= CHINCHON_META_PUNTOS);
  const resultadoMano = { cerroAsiento, chinchonPerfecto, deadwoodPorJugador, mano: mesa.manoNumero };

  if(alguienLlego){
    const ganadorFinal = mesa.jugadores.reduce((mejor, a) => puntajeTotal[a] < puntajeTotal[mejor] ? a : mejor, mesa.jugadores[0]);
    chinchonRefMesas().child(chinchonMesaIdActual).update({
      mano: manoFinal, descarte: descarteFinal, puntajeTotal, resultadoMano,
      fase: 'terminado', ganadorFinal,
    });
    return;
  }

  // Arranca la próxima mano: reparte de nuevo, rota quién empieza.
  const jugadores = mesa.jugadores;
  const siguienteInicia = chinchonSiguienteJugador(mesa, mesa.jugadores[(mesa.manoNumero - 1) % jugadores.length]);
  const { mano, mazo, descarte } = chinchonRepartirMano(jugadores);
  chinchonRefMesas().child(chinchonMesaIdActual).update({
    puntajeTotal, resultadoMano,
    mano, mazo, descarte,
    turno: siguienteInicia, robado: false,
    manoNumero: (mesa.manoNumero || 1) + 1,
  });
}

let chinchonPremiadoMesa = null;

function chinchonPremiarSiCorresponde(mesa){
  if(!miAsiento || !mesa || mesa.fase !== 'terminado' || !mesa.ganadorFinal) return;
  if(chinchonPremiadoMesa === chinchonMesaIdActual) return;
  if(!mesa.jugadores.includes(String(miAsiento))) return;
  chinchonPremiadoMesa = chinchonMesaIdActual;
  if(String(mesa.ganadorFinal) === String(miAsiento)){
    ganarMonedas(25);
    mostrarToast('¡Ganaste el Chinchón! +25 monedas', 'gain');
  } else {
    mostrarToast(`Ganó ${mesa.nombres[mesa.ganadorFinal]} con menos puntos.`);
  }
}

function chinchonCartaHTML(carta, seleccionada, onclick){
  return naipeHTML(carta, 'media', onclick, seleccionada);
}

function renderChinchonLobby(){
  const cont = document.getElementById('chinchon-content');
  const mesasArray = Object.keys(chinchonMesas).map(id => Object.assign({ id }, chinchonMesas[id]));
  const listaHTML = mesasArray.length ? mesasArray.map(m => {
    const nombres = m.jugadores.map(a => m.nombres[a]).join(', ');
    const estado = m.fase === 'esperando' ? `Esperando jugadores (${m.jugadores.length}/${m.capacidad})` : m.fase === 'jugando' ? `Jugando (mano ${m.manoNumero})` : 'Terminada';
    const puedoUnirme = m.fase === 'esperando' && m.jugadores.length < m.capacidad && !m.jugadores.includes(String(miAsiento));
    const puedoEntrar = m.jugadores.includes(String(miAsiento));
    return `<div class="bingo-roster-item">
      <span>${nombres}<br><span style="font-size:11px;color:var(--gray);">${estado}</span></span>
      <span class="bingo-roster-derecha">
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="chinchonMesaIdActual='${m.id}'; renderChinchon();">Entrar</button>` : ''}
        ${puedoUnirme ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;background:#3B9B5A;color:#fff;border-color:#3B9B5A;" onclick="chinchonUnirseAMesa('${m.id}')">Unirme</button>` : ''}
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" onclick="chinchonTerminarMesa('${m.id}')" title="Eliminar mesa">✕</button>` : ''}
      </span>
    </div>`;
  }).join('') : '<p style="color:var(--gray);font-size:13px;">Todavía no hay mesas. ¡Armá la primera!</p>';

  cont.innerHTML = `
    ${gEscenaHTML('madera', `
      ${gDialogoHTML('Chinchón', 'De 2 a 4 jugadores. Armá grupos (mismo número, distinto palo) y escaleras (3+ seguidas del mismo palo) para bajar tus puntos. Cerrá cuando te quede como mucho 1 carta suelta.')}
      <div class="g-dialogo-sub" style="text-align:center;margin-bottom:6px;font-weight:700;">¿Con cuántos jugadores?</div>
      <div class="g-acciones g-acciones-3">
        ${[2, 3, 4].map(n => `<button class="gbtn ${chinchonCapacidadElegida === n ? 'gbtn-sel' : 'gbtn-no'}" onclick="chinchonElegirCapacidad(${n})">${n}</button>`).join('')}
      </div>
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="chinchonCrearMesa()">Crear mesa nueva</button></div>`)}
    <div class="section-label">Mesas</div>
    ${listaHTML}`;
}

function renderChinchonMesa(){
  const cont = document.getElementById('chinchon-content');
  const mesa = chinchonMesaActual();
  if(!mesa){ chinchonVolverAlLobby(); return; }

  if(mesa.fase === 'esperando'){
    cont.innerHTML = gEscenaHTML('madera', `
      ${gDialogoHTML('Esperando jugadores...', `${mesa.jugadores.length} de ${mesa.capacidad}. Compartí la app para que se sumen los que falten.`)}
      <div class="m-rival-mano" style="margin:6px 0 10px;">${Array.from({ length: mesa.capacidad }).map((_, i) => `<div class="m-dorso" style="${i < mesa.jugadores.length ? '' : 'opacity:.3;'}"></div>`).join('')}</div>
      <div class="g-pie"><span onclick="chinchonVolverAlLobby()">‹ Volver a la lista de mesas</span><span onclick="chinchonTerminarMesa('${chinchonMesaIdActual}')">Cancelar esta mesa</span></div>`);
    return;
  }

  const marcadorHTML = `<div class="g-hud g-hud-compacto">${mesa.jugadores.map(a => {
    const yo = String(a) === String(miAsiento);
    return `<div class="g-score ${yo ? 'g-score-yo' : ''}"><span class="g-score-nombre">${yo ? 'Vos' : mesa.nombres[a]}</span><span class="g-score-puntos">${(mesa.puntajeTotal && mesa.puntajeTotal[a]) || 0}<small> pts</small></span></div>`;
  }).join('')}</div>`;

  if(mesa.fase === 'terminado'){
    const ganador = mesa.ganadorFinal;
    cont.innerHTML = gEscenaHTML('madera', `
      ${marcadorHTML}
      ${gDialogoHTML(String(ganador) === String(miAsiento) ? '🏆 ¡Ganaste!' : `Ganó ${mesa.nombres[ganador]}`, `Terminó con menos puntos acumulados (a ${CHINCHON_META_PUNTOS} se termina el juego).`)}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="chinchonTerminarMesa('${chinchonMesaIdActual}')">Cerrar esta mesa</button></div>
      <div class="g-pie"><span onclick="chinchonVolverAlLobby()">‹ Volver a la lista de mesas</span></div>`);
    chinchonPremiarSiCorresponde(mesa);
    return;
  }

  const soyTurno = String(mesa.turno) === String(miAsiento);
  const miMano = (mesa.mano && mesa.mano[String(miAsiento)]) || [];
  const descarteTope = (mesa.descarte || [])[(mesa.descarte || []).length - 1];
  const hayCierre = soyTurno && mesa.robado && chinchonExisteCierre(miMano);
  const puedoCerrar = hayCierre && chinchonPuedeCerrarDescartando(miMano, chinchonCartaSeleccionada);
  const puedeLevantar = soyTurno && !mesa.robado;
  const mazoLen = (mesa.mazo || []).length;

  // Se toca directamente el mazo o el descarte sobre el tapete, como en una
  // mesa real, en vez de botones aparte.
  const mazoActivo = puedeLevantar && mazoLen;
  const mazoHTML = `<div class="truco-jugada">
    <button class="m-dorso-media ${mazoActivo ? 'm-dorso-activo' : ''}" ${mazoActivo ? `onclick="chinchonLevantarDelMazo()"` : 'disabled'} aria-label="Levantar del mazo"></button>
    <div class="truco-jugada-nombre">Mazo (${mazoLen})</div>
  </div>`;
  const descarteHTML = descarteTope ? `<div class="truco-jugada">
    ${chinchonCartaHTML(descarteTope, false, puedeLevantar ? 'chinchonAlzarDescarte()' : null)}
    <div class="truco-jugada-nombre">Descarte</div>
  </div>` : `<div class="truco-vacio">Sin descarte todavía</div>`;

  let accionesHTML = '';
  if(soyTurno && mesa.robado){
    accionesHTML = `
      <div class="g-acciones">
        <button class="gbtn" onclick="chinchonDescartar()" ${chinchonCartaSeleccionada == null ? 'disabled' : ''}>Descartarme</button>
        ${hayCierre ? `<button class="gbtn gbtn-rojo gbtn-chico-texto" onclick="chinchonCerrar()" ${puedoCerrar ? '' : 'disabled'}>🏁 Cortar</button>` : ''}
      </div>
      ${hayCierre && !puedoCerrar ? '<p class="g-ayuda">¡Podés cortar! Elegí la carta que tirás para cortar</p>' : ''}`;
  }

  const otros = mesa.jugadores.filter(a => a !== String(miAsiento));
  const otrosHTML = `<div class="m-rivales m-rivales-chicos">${otros.map(a => {
    const cant = (mesa.mano[a] || []).length;
    return `<div class="m-rival"><div class="m-rival-nombre">${mesa.nombres[a]}</div><div class="m-rival-mano">${Array.from({ length: cant }).map(() => '<div class="m-dorso"></div>').join('')}</div></div>`;
  }).join('')}</div>`;

  const manoHTML = miMano.map((c, i) => chinchonModoOrden
    ? chinchonCartaHTML(c, chinchonOrdenElegido === i, `chinchonOrdenarTocar(${i})`)
    : chinchonCartaHTML(c, chinchonCartaSeleccionada === i, soyTurno && mesa.robado ? `chinchonToggleCarta(${i})` : null)
  ).join('');

  const turnoTxt = soyTurno ? (mesa.robado ? '¡Elegí qué descartar!' : '¡Levantá del mazo o del descarte!') : `Turno de ${mesa.nombres[mesa.turno]}`;
  const ayuda = soyTurno ? (mesa.robado ? 'Tocá la carta que querés tirar' : 'Tocá el mazo o el descarte para levantar') : 'Esperá tu turno';

  cont.innerHTML = gEscenaHTML('madera', `
    ${marcadorHTML}
    ${otrosHTML}
    <div class="m-tapete">
      <div class="g-chips"><span class="g-chip">Mano ${mesa.manoNumero}</span></div>
      <div class="truco-jugadas">${mazoHTML}${descarteHTML}</div>
    </div>
    <div class="m-turno-wrap"><span class="m-turno ${soyTurno ? 'm-turno-mio' : ''}">${turnoTxt}</span></div>
    ${accionesHTML}
    <div class="m-mano m-mano-solapada" style="--solape:${miMano.length > 7 ? 29 : 20}px">${manoHTML}</div>
    <div class="g-pie"><span onclick="chinchonToggleModoOrden()">${chinchonModoOrden ? '✅ Listo' : '🔀 Ordenar mis cartas'}</span><span onclick="chinchonTerminarMesa('${chinchonMesaIdActual}')">Abandonar mesa</span></div>`);
}

function renderChinchon(){
  const cont = document.getElementById('chinchon-content');
  if(!cont) return;
  document.getElementById('chinchon-sub').textContent = chinchonMesaIdActual ? 'En una mesa' : 'Elegí o creá una mesa';
  const enMesa = !!(chinchonMesaIdActual && chinchonMesas[chinchonMesaIdActual]);
  document.getElementById('view-chinchon').classList.toggle('juego-inmersivo', enMesa);
  if(enMesa) renderChinchonMesa();
  else { chinchonMesaIdActual = null; renderChinchonLobby(); }
}
