// Truco con envido (sin flor), para 2, 4 o 6 jugadores. Usa el mismo sistema
// de "mesas" que Escoba y Chinchón, y el mismo mazo español de 40 cartas de
// escoba.js (escobaCrearMazo, ESCOBA_PALOS, ESCOBA_SIMBOLO_PALO).
//
// De a 4 o 6 se arman dos equipos alternando asientos según el orden en que
// se unieron a la mesa (1º y 3º equipo A, 2º y 4º equipo B, etc.) — así los
// compañeros quedan "cruzados" en la mesa como en el truco real.
//
// Partida a 15 puntos (de a 2) o a 30 puntos (de a 4 o 6, los clásicos "15
// buenos y 15 malos" simplificados en un único acumulado a 30).
//
// Versión simplificada a propósito: el envido no tiene contracantos (se
// canta Envido, Real Envido o Falta Envido una sola vez por mano, y se
// responde Quiero/No quiero) y tiene que cantarse antes que el truco — una
// vez cantado el truco ya no se puede cantar envido en esa mano.

const TRUCO_PUNTOS_QUERIDO = { 1: 2, 2: 3, 3: 4 };
const TRUCO_PUNTOS_NO_QUERIDO = { 1: 1, 2: 2, 3: 3 };
const TRUCO_NOMBRE_NIVEL = { 1: 'Truco', 2: 'Retruco', 3: 'Vale Cuatro' };
const TRUCO_NOMBRE_ENVIDO = { envido: 'Envido', real_envido: 'Real Envido', falta_envido: 'Falta Envido' };

// Jerarquía de cartas del truco (14 = más alta). El mazo de escoba.js ya
// excluye el 8 y el 9, así que no hace falta contemplarlos acá.
function trucoValorCarta(carta){
  const { numero, palo } = carta;
  if(numero === 1 && palo === 'espada') return 14;
  if(numero === 1 && palo === 'basto') return 13;
  if(numero === 7 && palo === 'espada') return 12;
  if(numero === 7 && palo === 'oro') return 11;
  if(numero === 3) return 10;
  if(numero === 2) return 9;
  if(numero === 1) return 8; // 1 de oro / 1 de copa
  if(numero === 12) return 7;
  if(numero === 11) return 6;
  if(numero === 10) return 5;
  if(numero === 7) return 4; // 7 de basto / 7 de copa
  if(numero === 6) return 3;
  if(numero === 5) return 2;
  return 1; // 4
}

function trucoValorEnvidoCarta(numero){ return numero <= 7 ? numero : 0; }

function trucoEnvidoDeMano(cartas){
  const porPalo = {};
  (cartas || []).forEach(c => { (porPalo[c.palo] = porPalo[c.palo] || []).push(c); });
  let mejor = 0;
  Object.values(porPalo).forEach(grupo => {
    if(grupo.length >= 2){
      const valores = grupo.map(c => trucoValorEnvidoCarta(c.numero)).sort((a, b) => b - a);
      const suma = valores[0] + valores[1] + 20;
      if(suma > mejor) mejor = suma;
    }
  });
  if(mejor === 0 && cartas && cartas.length){
    mejor = Math.max(...cartas.map(c => trucoValorEnvidoCarta(c.numero)));
  }
  return mejor;
}

function trucoEquipoDe(jugadores, asiento){
  return jugadores.indexOf(String(asiento)) % 2 === 0 ? 'A' : 'B';
}
function trucoOtroEquipo(equipo){ return equipo === 'A' ? 'B' : 'A'; }

function trucoCompaneros(mesa, asiento){
  const equipo = trucoEquipoDe(mesa.jugadores, asiento);
  return mesa.jugadores.filter(a => a !== String(asiento) && trucoEquipoDe(mesa.jugadores, a) === equipo);
}
function trucoRivales(mesa, asiento){
  const equipo = trucoEquipoDe(mesa.jugadores, asiento);
  return mesa.jugadores.filter(a => trucoEquipoDe(mesa.jugadores, a) !== equipo);
}
function trucoMejorEnvidoDeEquipo(mesa, equipo){
  let mejor = -1;
  mesa.jugadores.filter(a => trucoEquipoDe(mesa.jugadores, a) === equipo).forEach(a => {
    const v = trucoEnvidoDeMano((mesa.mano && mesa.mano[a]) || []);
    if(v > mejor) mejor = v;
  });
  return mejor;
}

let trucoMesas = {};
let trucoMesaIdActual = null;
let trucoCapacidadElegida = 2;

function trucoRefMesas(){ return db.ref(`salas/${codigoViaje}/truco/mesas`); }

let trucoListenersListos = false;

function iniciarTruco(){
  if(!trucoListenersListos){
    trucoListenersListos = true;
    trucoRefMesas().on('value', snap => {
      trucoMesas = snap.val() || {};
      trucoRevisarFoldNuevo();
      renderTruco();
    });
  } else {
    renderTruco();
  }
}

// La app no "hace trampa", pero sin ver las cartas de quien se fue al mazo
// no hay forma de confirmarlo. Cuando alguien se va, se le muestra a todos
// (una sola vez, con un toast) con qué cartas se fue.
let trucoFoldBaseline = {};

function trucoRevisarFoldNuevo(){
  const mesa = trucoMesaActual();
  if(!mesa || !trucoMesaIdActual) return;
  const clave = mesa.resultadoMano && mesa.resultadoMano.motivo === 'mazo' ? String(mesa.resultadoMano.manoNumero) : null;
  const previa = trucoFoldBaseline[trucoMesaIdActual];
  trucoFoldBaseline[trucoMesaIdActual] = clave;
  if(previa === undefined || !clave || clave === previa) return;
  const r = mesa.resultadoMano;
  const soyYo = String(r.seFue) === String(miAsiento);
  const cartasTxt = (r.manoRevelada || []).map(c => escobaNombreCarta(c)).join(', ') || 'sin cartas';
  const quien = soyYo ? 'Te fuiste' : `${mesa.nombres[r.seFue] || `Asiento ${r.seFue}`} se fue`;
  mostrarToast(`🏳️ ${quien} al mazo con: ${cartasTxt}`);
}

function trucoMesaActual(){
  return trucoMesaIdActual ? trucoMesas[trucoMesaIdActual] : null;
}

function trucoElegirCapacidad(n){
  trucoCapacidadElegida = n;
  renderTruco();
}

function trucoCrearMesa(){
  if(!miAsiento) return;
  const ref = trucoRefMesas().push();
  ref.set({
    jugadores: [String(miAsiento)],
    nombres: { [miAsiento]: miNombre },
    capacidad: trucoCapacidadElegida,
    fase: 'esperando',
  });
  trucoMesaIdActual = ref.key;
}

function trucoRepartirMano(jugadores){
  const mazo = escobaCrearMazo();
  const mano = {};
  jugadores.forEach(a => { mano[a] = mazo.splice(0, 3); });
  return mano;
}

function trucoUnirseAMesa(mesaId){
  if(!miAsiento) return;
  const mesa = trucoMesas[mesaId];
  if(!mesa || mesa.fase !== 'esperando' || mesa.jugadores.includes(String(miAsiento)) || mesa.jugadores.length >= mesa.capacidad) return;
  const jugadores = mesa.jugadores.concat([String(miAsiento)]);
  const nombres = Object.assign({}, mesa.nombres, { [miAsiento]: miNombre });
  const updates = { jugadores, nombres };

  if(jugadores.length === mesa.capacidad){
    Object.assign(updates, {
      mano: trucoRepartirMano(jugadores),
      manoAsiento: jugadores[0], turno: jugadores[0], trickLider: jugadores[0],
      trickNumero: 0, trickJugadas: [], tricksResultados: [], historialTricks: [],
      puntajeEquipos: { A: 0, B: 0 },
      metaPuntos: mesa.capacidad === 2 ? 15 : 30,
      truco: { nivel: 0, estado: null }, pendienteTruco: null,
      envido: { estado: 'nadie' }, pendienteEnvido: null,
      manoNumero: 1, resultadoMano: null, ganadorFinal: null,
      fase: 'jugando',
    });
  }
  trucoRefMesas().child(mesaId).update(updates);
  trucoMesaIdActual = mesaId;
}

function trucoVolverAlLobby(){
  trucoMesaIdActual = null;
  renderTruco();
}

function trucoTerminarMesa(mesaId){
  trucoRefMesas().child(mesaId).remove();
  if(trucoMesaIdActual === mesaId) trucoVolverAlLobby();
}

function trucoSiguienteJugador(mesa, asiento){
  const idx = mesa.jugadores.indexOf(String(asiento));
  return mesa.jugadores[(idx + 1) % mesa.jugadores.length];
}

// Decide quién se lleva la mano (las 3 rondas) a partir de los resultados de
// cada ronda ('A'/'B'/null si fue parda). Reglas clásicas: dos rondas
// seguidas ganadas por el mismo equipo cierran la mano; una parda no le
// quita la mano a quien ganó la ronda anterior; si las dos primeras rondas
// las ganó cada equipo, decide la tercera (y si esa es parda, gana quien
// ganó la primera); si las dos primeras son pardas, decide la tercera (y si
// también es parda, gana el equipo del jugador que era mano).
function trucoGanadorDeMano(tricksResultados, equipoMano){
  if(tricksResultados.length < 2) return null;
  const [t1, t2, t3] = tricksResultados;
  if(t1 && t2){
    if(t1 === t2) return t1;
    if(tricksResultados.length < 3) return null;
    return t3 || t1;
  }
  if(t1 && !t2) return t1;
  if(!t1 && t2) return t2;
  if(tricksResultados.length < 3) return null;
  return t3 || equipoMano;
}

function trucoAplicarPuntosYContinuar(mesa, equipoGanador, puntos, resumenExtra){
  const puntajeEquipos = Object.assign({ A: 0, B: 0 }, mesa.puntajeEquipos);
  puntajeEquipos[equipoGanador] = (puntajeEquipos[equipoGanador] || 0) + puntos;
  const resultadoMano = Object.assign({ equipoGanador, puntos, manoNumero: mesa.manoNumero }, resumenExtra || {});

  if(puntajeEquipos[equipoGanador] >= mesa.metaPuntos){
    return { puntajeEquipos, resultadoMano, fase: 'terminado', ganadorFinal: equipoGanador, pendienteTruco: null, pendienteEnvido: null };
  }
  const manoAsiento = trucoSiguienteJugador(mesa, mesa.manoAsiento);
  return {
    puntajeEquipos, resultadoMano,
    mano: trucoRepartirMano(mesa.jugadores),
    manoAsiento, turno: manoAsiento, trickLider: manoAsiento,
    trickNumero: 0, trickJugadas: [], tricksResultados: [], historialTricks: [],
    truco: { nivel: 0, estado: null }, pendienteTruco: null,
    envido: { estado: 'nadie' }, pendienteEnvido: null,
    manoNumero: (mesa.manoNumero || 1) + 1,
  };
}

function trucoJugarCarta(indice){
  const mesa = trucoMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || mesa.pendienteTruco || mesa.pendienteEnvido) return;
  if(String(mesa.turno) !== String(miAsiento)) return;
  const miMano = (mesa.mano && mesa.mano[String(miAsiento)]) || [];
  const carta = miMano[indice];
  if(!carta) return;

  const nuevaMano = miMano.filter((_, i) => i !== indice);
  const trickJugadas = (mesa.trickJugadas || []).concat([{ asiento: String(miAsiento), carta }]);
  const updates = { [`mano/${miAsiento}`]: nuevaMano };

  if(trickJugadas.length < mesa.jugadores.length){
    updates.trickJugadas = trickJugadas;
    updates.turno = trucoSiguienteJugador(mesa, miAsiento);
    trucoRefMesas().child(trucoMesaIdActual).update(updates);
    return;
  }

  let mejorValor = -1, ganadoresIdx = [];
  trickJugadas.forEach((j, i) => {
    const v = trucoValorCarta(j.carta);
    if(v > mejorValor){ mejorValor = v; ganadoresIdx = [i]; }
    else if(v === mejorValor) ganadoresIdx.push(i);
  });
  const equiposGanadores = new Set(ganadoresIdx.map(i => trucoEquipoDe(mesa.jugadores, trickJugadas[i].asiento)));
  const trickGanador = equiposGanadores.size === 1 ? Array.from(equiposGanadores)[0] : null;
  // El líder de la próxima ronda tiene que ser un asiento, no la letra de
  // equipo: el primero de los que ganaron esta ronda (si hay parda entre
  // compañeros del mismo equipo, cualquiera de ellos sirve).
  const asientoGanador = trickGanador ? trickJugadas[ganadoresIdx[0]].asiento : null;

  const tricksResultados = (mesa.tricksResultados || []).concat([trickGanador]);
  const nuevoTrickNumero = (mesa.trickNumero || 0) + 1;
  const nuevoLider = asientoGanador || mesa.trickLider;

  updates.historialTricks = (mesa.historialTricks || []).concat([trickJugadas]);
  updates.trickJugadas = [];
  updates.tricksResultados = tricksResultados;
  updates.trickNumero = nuevoTrickNumero;
  updates.trickLider = nuevoLider;
  updates.turno = nuevoLider;

  const equipoMano = trucoEquipoDe(mesa.jugadores, mesa.manoAsiento);
  const ganadorMano = trucoGanadorDeMano(tricksResultados, equipoMano);
  if(ganadorMano || nuevoTrickNumero >= 3){
    const equipoGanador = ganadorMano || trucoEquipoDe(mesa.jugadores, nuevoLider);
    const puntos = mesa.truco && mesa.truco.estado === 'aceptado' ? TRUCO_PUNTOS_QUERIDO[mesa.truco.nivel] : 1;
    // trucoAplicarPuntosYContinuar puede devolver un "mano" (objeto entero,
    // la mano nueva repartida), que en Firebase no puede convivir en el
    // mismo update() con la key puntual "mano/<asiento>" de arriba (una es
    // ancestro de la otra) — la sacamos porque de todos modos queda pisada.
    delete updates[`mano/${miAsiento}`];
    Object.assign(updates, trucoAplicarPuntosYContinuar(mesa, equipoGanador, puntos, { motivo: 'jugada', nivel: mesa.truco ? mesa.truco.nivel : 0 }));
  }

  trucoRefMesas().child(trucoMesaIdActual).update(updates);
}

function trucoCantarTruco(){
  const mesa = trucoMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || mesa.pendienteTruco || mesa.pendienteEnvido) return;
  if(String(mesa.turno) !== String(miAsiento)) return;
  if((mesa.truco.nivel || 0) >= 3) return;
  const nivelPedido = (mesa.truco.nivel || 0) + 1;
  trucoRefMesas().child(trucoMesaIdActual).update({
    pendienteTruco: { nivelPedido, cantadoPor: String(miAsiento), equipoCantador: trucoEquipoDe(mesa.jugadores, miAsiento) },
  });
}

function trucoResponderTruco(accion){
  const mesa = trucoMesaActual();
  const p = mesa && mesa.pendienteTruco;
  if(!p) return;
  const miEquipo = trucoEquipoDe(mesa.jugadores, miAsiento);
  if(miEquipo === p.equipoCantador) return;

  if(accion === 'escalar'){
    if(p.nivelPedido >= 3) return;
    trucoRefMesas().child(trucoMesaIdActual).update({
      pendienteTruco: { nivelPedido: p.nivelPedido + 1, cantadoPor: String(miAsiento), equipoCantador: miEquipo },
    });
    return;
  }
  if(accion === 'quiero'){
    trucoRefMesas().child(trucoMesaIdActual).update({
      truco: { nivel: p.nivelPedido, estado: 'aceptado' }, pendienteTruco: null,
    });
    return;
  }
  if(accion === 'no_quiero'){
    const puntos = TRUCO_PUNTOS_NO_QUERIDO[p.nivelPedido];
    const updates = trucoAplicarPuntosYContinuar(mesa, p.equipoCantador, puntos, { motivo: 'truco_no_querido', nivel: p.nivelPedido });
    updates.pendienteTruco = null;
    trucoRefMesas().child(trucoMesaIdActual).update(updates);
  }
}

// Cualquiera se puede ir al mazo en cualquier momento de la mano (no hace
// falta que sea tu turno): se termina ahí mismo y el equipo rival se lleva
// los puntos que estaban en juego (el valor del truco ya aceptado, o 1 si
// todavía no se cantó nada).
function trucoIrseAlMazo(){
  const mesa = trucoMesaActual();
  if(!mesa || mesa.fase !== 'jugando') return;
  if(!confirm('¿Seguro que te vas al mazo? El equipo rival se lleva los puntos de esta mano.')) return;
  const miEquipo = trucoEquipoDe(mesa.jugadores, miAsiento);
  const equipoRival = trucoOtroEquipo(miEquipo);
  const puntos = mesa.truco && mesa.truco.estado === 'aceptado' ? TRUCO_PUNTOS_QUERIDO[mesa.truco.nivel] : 1;
  const miManoActual = (mesa.mano && mesa.mano[String(miAsiento)]) || [];
  const updates = trucoAplicarPuntosYContinuar(mesa, equipoRival, puntos, { motivo: 'mazo', seFue: String(miAsiento), manoRevelada: miManoActual });
  updates.pendienteTruco = null;
  updates.pendienteEnvido = null;
  trucoRefMesas().child(trucoMesaIdActual).update(updates);
}

function trucoEnvidoDisponible(mesa){
  return mesa && mesa.fase === 'jugando' && (mesa.trickNumero || 0) === 0 && (mesa.truco.nivel || 0) === 0
    && !mesa.pendienteTruco && !mesa.pendienteEnvido && mesa.envido && mesa.envido.estado === 'nadie';
}

function trucoCantarEnvido(tipo){
  const mesa = trucoMesaActual();
  if(!trucoEnvidoDisponible(mesa)) return;
  if(String(mesa.turno) !== String(miAsiento)) return;
  trucoRefMesas().child(trucoMesaIdActual).update({
    pendienteEnvido: { tipo, cantadoPor: String(miAsiento), equipoCantador: trucoEquipoDe(mesa.jugadores, miAsiento) },
  });
}

function trucoResponderEnvido(accion){
  const mesa = trucoMesaActual();
  const p = mesa && mesa.pendienteEnvido;
  if(!p) return;
  const miEquipo = trucoEquipoDe(mesa.jugadores, miAsiento);
  if(miEquipo === p.equipoCantador) return;

  if(accion === 'no_quiero'){
    const puntajeEquipos = Object.assign({ A: 0, B: 0 }, mesa.puntajeEquipos);
    puntajeEquipos[p.equipoCantador] = (puntajeEquipos[p.equipoCantador] || 0) + 1;
    trucoRefMesas().child(trucoMesaIdActual).update({
      puntajeEquipos, pendienteEnvido: null,
      envido: { estado: 'resuelto', tipo: p.tipo, resultado: { ganador: p.equipoCantador, puntos: 1, noQuerido: true } },
    });
    return;
  }
  if(accion === 'quiero'){
    const valorA = trucoMejorEnvidoDeEquipo(mesa, 'A');
    const valorB = trucoMejorEnvidoDeEquipo(mesa, 'B');
    const equipoMano = trucoEquipoDe(mesa.jugadores, mesa.manoAsiento);
    const ganador = valorA === valorB ? equipoMano : (valorA > valorB ? 'A' : 'B');
    const puntajeGanadorActual = (mesa.puntajeEquipos && mesa.puntajeEquipos[ganador]) || 0;
    const puntos = p.tipo === 'envido' ? 2 : p.tipo === 'real_envido' ? 3 : Math.max(1, mesa.metaPuntos - puntajeGanadorActual);
    const puntajeEquipos = Object.assign({ A: 0, B: 0 }, mesa.puntajeEquipos);
    puntajeEquipos[ganador] = (puntajeEquipos[ganador] || 0) + puntos;
    const updates = {
      puntajeEquipos, pendienteEnvido: null,
      envido: { estado: 'resuelto', tipo: p.tipo, resultado: { ganador, puntos, valorA, valorB } },
    };
    if(puntajeEquipos[ganador] >= mesa.metaPuntos){
      updates.fase = 'terminado';
      updates.ganadorFinal = ganador;
    }
    trucoRefMesas().child(trucoMesaIdActual).update(updates);
  }
}

let trucoPremiadoMesa = null;

function trucoPremiarSiCorresponde(mesa){
  if(!miAsiento || !mesa || mesa.fase !== 'terminado' || !mesa.ganadorFinal) return;
  if(trucoPremiadoMesa === trucoMesaIdActual) return;
  if(!mesa.jugadores.includes(String(miAsiento))) return;
  trucoPremiadoMesa = trucoMesaIdActual;
  const miEquipo = trucoEquipoDe(mesa.jugadores, miAsiento);
  const a = mesa.puntajeEquipos.A, b = mesa.puntajeEquipos.B;
  if(miEquipo === mesa.ganadorFinal){
    ganarMonedas(25);
    mostrarToast(`¡Ganó tu equipo el Truco ${a} a ${b}! +25 monedas`, 'gain');
  } else {
    mostrarToast(`Ganó el equipo rival ${mesa.ganadorFinal === 'A' ? a : b} a ${mesa.ganadorFinal === 'A' ? b : a}. ¡A la próxima!`);
  }
}

function renderTrucoLobby(){
  const cont = document.getElementById('truco-content');
  const mesasArray = Object.keys(trucoMesas).map(id => Object.assign({ id }, trucoMesas[id]));
  const listaHTML = mesasArray.length ? mesasArray.map(m => {
    const nombres = m.jugadores.map(a => m.nombres[a]).join(', ');
    const estado = m.fase === 'esperando' ? `Esperando jugadores (${m.jugadores.length}/${m.capacidad})` : m.fase === 'jugando' ? `Jugando (mano ${m.manoNumero})` : 'Terminada';
    const puedoUnirme = m.fase === 'esperando' && m.jugadores.length < m.capacidad && !m.jugadores.includes(String(miAsiento));
    const puedoEntrar = m.jugadores.includes(String(miAsiento));
    return `<div class="bingo-roster-item">
      <span>${nombres} <span style="color:var(--gray);font-size:11px;">(${m.capacidad === 2 ? '1 vs 1' : m.capacidad === 4 ? '2 vs 2' : '3 vs 3'})</span><br><span style="font-size:11px;color:var(--gray);">${estado}</span></span>
      <span class="bingo-roster-derecha">
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="trucoMesaIdActual='${m.id}'; renderTruco();">Entrar</button>` : ''}
        ${puedoUnirme ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;background:#3B9B5A;color:#fff;border-color:#3B9B5A;" onclick="trucoUnirseAMesa('${m.id}')">Unirme</button>` : ''}
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" onclick="trucoTerminarMesa('${m.id}')" title="Eliminar mesa">✕</button>` : ''}
      </span>
    </div>`;
  }).join('') : '<p style="color:var(--gray);font-size:13px;">Todavía no hay mesas. ¡Armá la primera!</p>';

  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>🂮 Truco</h2>
      <p>Con envido, sin flor. De a 2 se juega 1 vs 1 a 15 puntos; de a 4 o 6 se arman equipos (2 vs 2 o 3 vs 3) a 30 puntos.</p>
    </div>
    <div class="section-label">¿Con cuántos jugadores?</div>
    <div class="chip-row" style="margin-bottom:14px;">
      ${[2, 4, 6].map(n => `<div class="chip ${trucoCapacidadElegida === n ? 'selected' : ''}" onclick="trucoElegirCapacidad(${n})">${n}</div>`).join('')}
    </div>
    <button class="btn-primary" onclick="trucoCrearMesa()">Crear mesa nueva</button>
    <div class="section-label" style="margin-top:16px;">Mesas</div>
    ${listaHTML}`;
}

function trucoBannerPendiente(mesa){
  const miEquipo = trucoEquipoDe(mesa.jugadores, miAsiento);

  if(mesa.pendienteTruco){
    const p = mesa.pendienteTruco;
    const nombreNivel = TRUCO_NOMBRE_NIVEL[p.nivelPedido];
    if(miEquipo === p.equipoCantador){
      return `<div class="hero" style="margin-top:8px;"><h2>Cantaste ${nombreNivel}</h2><p>Esperando que el equipo rival responda...</p></div>`;
    }
    const proximoNivel = TRUCO_NOMBRE_NIVEL[p.nivelPedido + 1];
    return `
      <div class="hero" style="margin-top:8px;"><h2>${mesa.nombres[p.cantadoPor]} cantó ${nombreNivel}</h2><p>¿Querés?</p></div>
      <button class="btn-primary" onclick="trucoResponderTruco('quiero')">Quiero</button>
      ${proximoNivel ? `<button class="btn-ghost" onclick="trucoResponderTruco('escalar')">¡${proximoNivel}!</button>` : ''}
      <p class="link-chico" onclick="trucoResponderTruco('no_quiero')">No quiero</p>`;
  }

  if(mesa.pendienteEnvido){
    const p = mesa.pendienteEnvido;
    const nombreTipo = TRUCO_NOMBRE_ENVIDO[p.tipo];
    if(miEquipo === p.equipoCantador){
      return `<div class="hero" style="margin-top:8px;"><h2>Cantaste ${nombreTipo}</h2><p>Esperando que el equipo rival responda...</p></div>`;
    }
    return `
      <div class="hero" style="margin-top:8px;"><h2>${mesa.nombres[p.cantadoPor]} cantó ${nombreTipo}</h2><p>¿Querés?</p></div>
      <button class="btn-primary" onclick="trucoResponderEnvido('quiero')">Quiero</button>
      <p class="link-chico" onclick="trucoResponderEnvido('no_quiero')">No quiero</p>`;
  }

  return null;
}

function renderTrucoMesa(){
  const cont = document.getElementById('truco-content');
  const mesa = trucoMesaActual();
  if(!mesa){ trucoVolverAlLobby(); return; }

  if(mesa.fase === 'esperando'){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;"><h2>Esperando jugadores...</h2><p>${mesa.jugadores.length} de ${mesa.capacidad}. Compartí la app para que se sumen los que falten.</p></div>
      <p class="link-chico" onclick="trucoVolverAlLobby()">‹ Volver a la lista de mesas</p>
      <p class="link-chico" onclick="trucoTerminarMesa('${trucoMesaIdActual}')">Cancelar esta mesa</p>`;
    return;
  }

  const miEquipo = trucoEquipoDe(mesa.jugadores, miAsiento);
  const rivalEquipo = trucoOtroEquipo(miEquipo);
  const companeros = trucoCompaneros(mesa, miAsiento).map(a => mesa.nombres[a]);
  const rivales = trucoRivales(mesa, miAsiento).map(a => mesa.nombres[a]);

  const marcadorHTML = `<div class="escoba-marcador">
    <div>🫲 Tu equipo${companeros.length ? ` (con ${companeros.join(', ')})` : ''}: ${mesa.puntajeEquipos[miEquipo] || 0} / ${mesa.metaPuntos}</div>
    <div>Rival (${rivales.join(', ')}): ${mesa.puntajeEquipos[rivalEquipo] || 0} / ${mesa.metaPuntos}</div>
  </div>`;

  if(mesa.fase === 'terminado'){
    const gano = mesa.ganadorFinal === miEquipo;
    cont.innerHTML = `
      ${marcadorHTML}
      <div class="hero" style="margin-top:8px;">
        <h2>🏁 ${gano ? '¡Ganó tu equipo!' : 'Ganó el equipo rival'}</h2>
        <p>${mesa.puntajeEquipos.A} a ${mesa.puntajeEquipos.B} puntos (a ${mesa.metaPuntos} se termina).</p>
      </div>
      <button class="btn-primary" onclick="trucoTerminarMesa('${trucoMesaIdActual}')">Cerrar esta mesa</button>
      <p class="link-chico" onclick="trucoVolverAlLobby()">‹ Volver a la lista de mesas</p>`;
    trucoPremiarSiCorresponde(mesa);
    return;
  }

  const bannerPendiente = trucoBannerPendiente(mesa);
  const miMano = (mesa.mano && mesa.mano[String(miAsiento)]) || [];
  const soyTurno = !mesa.pendienteTruco && !mesa.pendienteEnvido && String(mesa.turno) === String(miAsiento);

  const otrosDorsoHTML = mesa.jugadores.filter(a => a !== String(miAsiento)).map(a => {
    const cant = (mesa.mano && mesa.mano[a] || []).length;
    return `<div class="section-label">Cartas de ${mesa.nombres[a]} (${cant})</div>
      <div class="escoba-fila">${Array.from({ length: cant }).map(() => '<div class="escoba-carta escoba-carta-dorso"></div>').join('')}</div>`;
  }).join('');

  const trickHTML = (mesa.trickJugadas || []).map(j => `
    <div style="text-align:center;">
      ${escobaCartaHTML(j.carta, false, null)}
      <div style="font-size:10px;color:#EAF3EC;">${String(j.asiento) === String(miAsiento) ? 'Vos' : mesa.nombres[j.asiento]}</div>
    </div>`).join('') || '<p style="font-size:12px;">Nadie jugó todavía en esta ronda.</p>';

  // Sin esto, apenas se resuelve una ronda las cartas jugadas desaparecían
  // del todo y no quedaba forma de ver qué se tiró antes en esta mano — igual
  // que en la mesa real, donde las cartas ya jugadas quedan a la vista.
  const historialHTML = (mesa.historialTricks || []).map((trick, ti) => {
    const resultado = (mesa.tricksResultados || [])[ti];
    const textoResultado = resultado == null ? 'Empataron (parda)' : resultado === miEquipo ? 'Ganó tu equipo' : 'Ganó el rival';
    return `
      <div class="section-label">Ronda ${ti + 1} — ${textoResultado}</div>
      <div class="tapete-mesa"><div class="escoba-fila">${trick.map(j => `
        <div style="text-align:center;">
          ${escobaCartaHTML(j.carta, false, null)}
          <div style="font-size:10px;color:#EAF3EC;">${String(j.asiento) === String(miAsiento) ? 'Vos' : mesa.nombres[j.asiento]}</div>
        </div>`).join('')}</div></div>`;
  }).join('');

  let accionesHTML = '';
  if(soyTurno){
    const chipsEnvido = trucoEnvidoDisponible(mesa) ? `
      <div class="chip-row" style="margin-bottom:10px;">
        <div class="chip" onclick="trucoCantarEnvido('envido')">Envido</div>
        <div class="chip" onclick="trucoCantarEnvido('real_envido')">Real Envido</div>
        <div class="chip" onclick="trucoCantarEnvido('falta_envido')">Falta Envido</div>
      </div>` : '';
    const nombreProximoTruco = TRUCO_NOMBRE_NIVEL[(mesa.truco.nivel || 0) + 1];
    const chipTruco = nombreProximoTruco ? `<button class="btn-ghost" style="margin-bottom:10px;" onclick="trucoCantarTruco()">¡${nombreProximoTruco}!</button>` : '';
    accionesHTML = chipsEnvido + chipTruco;
  }

  const envidoResuelto = mesa.envido && mesa.envido.estado === 'resuelto' ? `<p style="font-size:12px;color:var(--gray);">${TRUCO_NOMBRE_ENVIDO[mesa.envido.tipo]}: ganó el equipo ${mesa.envido.resultado.ganador === miEquipo ? 'tuyo' : 'rival'} (+${mesa.envido.resultado.puntos}).</p>` : '';
  const trucoEstadoTxt = mesa.truco && mesa.truco.nivel ? `<p style="font-size:12px;color:var(--gray);">En juego: ${TRUCO_NOMBRE_NIVEL[mesa.truco.nivel]}${mesa.truco.estado === 'aceptado' ? ' (querido)' : ''} — vale ${TRUCO_PUNTOS_QUERIDO[mesa.truco.nivel]} puntos.</p>` : '';

  cont.innerHTML = `
    ${marcadorHTML}
    ${bannerPendiente || `
      <div class="hero" style="margin-top:8px;">
        <h2>${soyTurno ? 'Tu turno' : `Turno de ${mesa.nombres[mesa.turno]}`}</h2>
        <p>Mano ${mesa.manoNumero}, ronda ${(mesa.trickNumero || 0) + 1} de 3.</p>
      </div>
      ${accionesHTML}`}
    ${envidoResuelto}
    ${trucoEstadoTxt}
    ${otrosDorsoHTML}
    ${historialHTML}
    <div class="section-label">${(mesa.historialTricks || []).length ? 'Ronda actual' : 'Mesa (esta ronda)'}</div>
    <div class="tapete-mesa"><div class="escoba-fila">${trickHTML}</div></div>
    <div class="section-label">Tu mano</div>
    <div class="escoba-fila">${miMano.map((c, i) => escobaCartaHTML(c, false, soyTurno ? `trucoJugarCarta(${i})` : null)).join('')}</div>
    <p class="link-chico" onclick="trucoIrseAlMazo()">🏳️ Irme al mazo</p>
    <p class="link-chico" onclick="trucoTerminarMesa('${trucoMesaIdActual}')">Abandonar esta mesa</p>`;
}

function renderTruco(){
  const cont = document.getElementById('truco-content');
  if(!cont) return;
  document.getElementById('truco-sub').textContent = trucoMesaIdActual ? 'En una mesa' : 'Elegí o creá una mesa';
  if(trucoMesaIdActual && trucoMesas[trucoMesaIdActual]) renderTrucoMesa();
  else { trucoMesaIdActual = null; renderTrucoLobby(); }
}
