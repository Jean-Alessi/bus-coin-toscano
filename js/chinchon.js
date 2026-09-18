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
  if(!chinchonPuedeCerrar(miMano)) return;
  chinchonCerrarMano(mesa, String(miAsiento), {}, mesa.descarte || []);
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
  if(carta.comodin){
    return `<button class="escoba-carta escoba-carta-comodin ${seleccionada ? 'escoba-carta-seleccionada' : ''}" ${onclick ? `onclick="${onclick}"` : 'disabled'}>
      <span class="escoba-carta-numero" style="font-size:20px;">★</span>
      <span style="font-size:9px;font-weight:700;">Comodín</span>
    </button>`;
  }
  return `<button class="escoba-carta escoba-carta-${carta.palo} ${seleccionada ? 'escoba-carta-seleccionada' : ''}" ${onclick ? `onclick="${onclick}"` : 'disabled'}>
    <span class="escoba-carta-numero">${carta.numero === 10 ? 'Sota' : carta.numero === 11 ? 'Caballo' : carta.numero === 12 ? 'Rey' : carta.numero}</span>
    <span class="escoba-carta-palo">${escobaIconoPalo(carta.palo)}</span>
  </button>`;
}

// Las cartas del rival en abanico (boca abajo), como se ven en una mesa
// real, en vez de una fila plana. Cada una se rota y se corre un poco según
// qué tan lejos está del centro de la mano.
function chinchonAbanicoHTML(cantidad){
  const medio = (cantidad - 1) / 2;
  const cartas = Array.from({ length: cantidad }).map((_, i) => {
    const offset = i - medio;
    const rot = offset * 9;
    const dx = offset * 24;
    const dy = Math.abs(offset) * 5;
    return `<div class="escoba-carta escoba-carta-dorso" style="position:absolute; left:50%; top:0; margin-left:-25px; transform:translate(${dx}px, ${dy}px) rotate(${rot}deg); z-index:${i};"></div>`;
  }).join('');
  return `<div class="abanico-cartas">${cartas}</div>`;
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
    <div class="hero" style="margin-top:8px;">
      <h2>🂡 Chinchón</h2>
      <p>De 2 a 4 jugadores. Armá grupos (mismo número, distinto palo) y escaleras (3+ seguidas del mismo palo) para bajar tus puntos. Cerrá cuando te quede como mucho 1 carta suelta.</p>
    </div>
    <div class="section-label">¿Con cuántos jugadores?</div>
    <div class="chip-row" style="margin-bottom:14px;">
      ${[2, 3, 4].map(n => `<div class="chip ${chinchonCapacidadElegida === n ? 'selected' : ''}" onclick="chinchonElegirCapacidad(${n})">${n}</div>`).join('')}
    </div>
    <button class="btn-primary" onclick="chinchonCrearMesa()">Crear mesa nueva</button>
    <div class="section-label" style="margin-top:16px;">Mesas</div>
    ${listaHTML}`;
}

function renderChinchonMesa(){
  const cont = document.getElementById('chinchon-content');
  const mesa = chinchonMesaActual();
  if(!mesa){ chinchonVolverAlLobby(); return; }

  if(mesa.fase === 'esperando'){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;"><h2>Esperando jugadores...</h2><p>${mesa.jugadores.length} de ${mesa.capacidad}. Compartí la app para que se sumen los que falten.</p></div>
      <p class="link-chico" onclick="chinchonVolverAlLobby()">‹ Volver a la lista de mesas</p>
      <p class="link-chico" onclick="chinchonTerminarMesa('${chinchonMesaIdActual}')">Cancelar esta mesa</p>`;
    return;
  }

  const marcadorHTML = `<div class="escoba-marcador">${mesa.jugadores.map(a =>
    `<div>${String(a) === String(miAsiento) ? '🫲 Vos' : mesa.nombres[a]}: ${(mesa.puntajeTotal && mesa.puntajeTotal[a]) || 0} puntos</div>`
  ).join('')}</div>`;

  if(mesa.fase === 'terminado'){
    const ganador = mesa.ganadorFinal;
    cont.innerHTML = `
      ${marcadorHTML}
      <div class="hero" style="margin-top:8px;">
        <h2>🏁 ${String(ganador) === String(miAsiento) ? '¡Ganaste!' : `Ganó ${mesa.nombres[ganador]}`}</h2>
        <p>Terminó con menos puntos acumulados (a ${CHINCHON_META_PUNTOS} se termina el juego).</p>
      </div>
      <button class="btn-primary" onclick="chinchonTerminarMesa('${chinchonMesaIdActual}')">Cerrar esta mesa</button>
      <p class="link-chico" onclick="chinchonVolverAlLobby()">‹ Volver a la lista de mesas</p>`;
    chinchonPremiarSiCorresponde(mesa);
    return;
  }

  const soyTurno = String(mesa.turno) === String(miAsiento);
  const miMano = (mesa.mano && mesa.mano[String(miAsiento)]) || [];
  const descarteTope = (mesa.descarte || [])[(mesa.descarte || []).length - 1];
  const puedoCerrar = soyTurno && mesa.robado && chinchonPuedeCerrar(miMano);
  const puedeLevantar = soyTurno && !mesa.robado;
  const mazoLen = (mesa.mazo || []).length;

  // Se toca directamente el mazo o el descarte sobre el tapete, como en
  // Escoba, en vez de botones aparte.
  const mazoHTML = `<div style="text-align:center;">
    <button class="escoba-carta escoba-carta-dorso" ${puedeLevantar && mazoLen ? `onclick="chinchonLevantarDelMazo()"` : 'disabled'}></button>
    <div style="font-size:10px;color:#EAF3EC;">Mazo (${mazoLen})</div>
  </div>`;
  const descarteHTML = descarteTope ? `<div style="text-align:center;">
    ${chinchonCartaHTML(descarteTope, false, puedeLevantar ? 'chinchonAlzarDescarte()' : null)}
    <div style="font-size:10px;color:#EAF3EC;">Descarte</div>
  </div>` : `<p style="font-size:12px;">Sin descarte todavía</p>`;

  let accionesHTML = '';
  if(soyTurno && mesa.robado){
    accionesHTML = `
      <button class="btn-primary" onclick="chinchonDescartar()" ${chinchonCartaSeleccionada == null ? 'disabled' : ''}>Descartarme</button>
      ${puedoCerrar ? `<button class="btn-ghost" onclick="chinchonCerrar()">🏁 Cerrar la mano</button>` : ''}`;
  }

  const otros = mesa.jugadores.filter(a => a !== String(miAsiento));
  const otrosAbanicoHTML = otros.map(a => {
    const cant = (mesa.mano[a] || []).length;
    return `<div class="section-label">Cartas de ${mesa.nombres[a]} (${cant})</div>${chinchonAbanicoHTML(cant)}`;
  }).join('');

  const manoHTML = miMano.map((c, i) => chinchonModoOrden
    ? chinchonCartaHTML(c, chinchonOrdenElegido === i, `chinchonOrdenarTocar(${i})`)
    : chinchonCartaHTML(c, chinchonCartaSeleccionada === i, soyTurno && mesa.robado ? `chinchonToggleCarta(${i})` : null)
  ).join('');

  cont.innerHTML = `
    ${marcadorHTML}
    <div class="hero" style="margin-top:8px;">
      <h2>${soyTurno ? (mesa.robado ? 'Elegí qué descartar' : 'Tu turno: tocá el mazo o el descarte') : `Turno de ${mesa.nombres[mesa.turno]}`}</h2>
      <p>Mano ${mesa.manoNumero}</p>
    </div>
    ${otrosAbanicoHTML}
    <div class="section-label">Mesa</div>
    <div class="tapete-mesa"><div class="escoba-fila">${mazoHTML}${descarteHTML}</div></div>
    ${accionesHTML}
    <div class="section-label" style="display:flex; justify-content:space-between; align-items:center;">
      <span>Tu mano</span>
      <span class="link-chico" style="margin:0;" onclick="chinchonToggleModoOrden()">${chinchonModoOrden ? '✅ Listo' : '🔀 Ordenar mis cartas'}</span>
    </div>
    <div class="escoba-fila">${manoHTML}</div>
    <p class="link-chico" onclick="chinchonTerminarMesa('${chinchonMesaIdActual}')">Abandonar esta mesa</p>`;
}

function renderChinchon(){
  const cont = document.getElementById('chinchon-content');
  if(!cont) return;
  document.getElementById('chinchon-sub').textContent = chinchonMesaIdActual ? 'En una mesa' : 'Elegí o creá una mesa';
  if(chinchonMesaIdActual && chinchonMesas[chinchonMesaIdActual]) renderChinchonMesa();
  else { chinchonMesaIdActual = null; renderChinchonLobby(); }
}
