// Escoba de 15, para 2 jugadores. Primer juego de cartas con el sistema de
// "mesas": dentro del mismo código de viaje pueden convivir varias mesas
// jugando al mismo tiempo, sin necesitar un código aparte para cada grupo —
// cada uno crea o se une a una mesa abierta, y arranca sola cuando se llena.
//
// Mazo español de 40 cartas (sin 8 ni 9). Para las combinaciones que suman
// 15, la Sota vale 8, el Caballo 9 y el Rey 10 (por eso el mazo no tiene
// esos dos números: dejarían dos cartas con el mismo valor de combinación).

const ESCOBA_PALOS = ['oro', 'copa', 'espada', 'basto'];
const ESCOBA_NUMEROS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const ESCOBA_NOMBRE_NUMERO = { 10: 'Sota', 11: 'Caballo', 12: 'Rey' };

// Dibujos propios en vez de emoji: el 🌳 de basto se confundía con la copa de
// un árbol o su tronco. Cada palo tiene su forma y color reales del mazo
// español (oro=moneda, copa=cáliz, espada=hoja recta, basto=garrote de
// madera), para poder distinguirlos de un vistazo aunque la carta sea chica.
const ESCOBA_ICONO_PALO = {
  oro: '<circle cx="12" cy="12" r="8.5" fill="#F5C242" stroke="#B8860B" stroke-width="1.4"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#B8860B" stroke-width="1.1"/>',
  copa: '<path d="M6.5 3.5h11l-.6 5.2a5 5 0 0 1-9.8 0l-.6-5.2Z" fill="#D64545" stroke="#8B2E2E" stroke-width="1.1"/><path d="M12 13.5V18M8.3 20.5h7.4" stroke="#8B2E2E" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  espada: '<path d="M12 2 13.5 14.6h-3Z" fill="#2D3E50"/><path d="M7.6 15h8.8" stroke="#2D3E50" stroke-width="2" stroke-linecap="round"/><rect x="11.1" y="15.6" width="1.8" height="3.6" rx="0.8" fill="#2D3E50"/><circle cx="12" cy="20.1" r="1.2" fill="#2D3E50"/>',
  basto: '<path d="M7.5 20 17 5.3" stroke="#8B5E34" stroke-width="4.6" stroke-linecap="round"/><circle cx="17" cy="5.3" r="3" fill="#A9713F" stroke="#6B4423" stroke-width="1"/>',
};

function escobaIconoPalo(palo, size){
  size = size || 20;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${ESCOBA_ICONO_PALO[palo] || ''}</svg>`;
}

function escobaValor(numero){ return numero <= 7 ? numero : { 10: 8, 11: 9, 12: 10 }[numero]; }
function escobaNombreCarta(carta){ return `${ESCOBA_NOMBRE_NUMERO[carta.numero] || carta.numero} de ${carta.palo}`; }

function escobaCrearMazo(){
  const mazo = [];
  ESCOBA_PALOS.forEach(palo => ESCOBA_NUMEROS.forEach(numero => mazo.push({ palo, numero })));
  return barajar(mazo);
}

let escobaMesas = {};
let escobaMesaIdActual = null;
let escobaCartaSeleccionada = null;
let escobaMesaSeleccionada = new Set();

function escobaRefMesas(){ return db.ref(`salas/${codigoViaje}/escoba/mesas`); }

let escobaListenersListos = false;

function iniciarEscoba(){
  if(!escobaListenersListos){
    escobaListenersListos = true;
    escobaRefMesas().on('value', snap => {
      escobaMesas = snap.val() || {};
      renderEscoba();
    });
  } else {
    renderEscoba();
  }
}

function escobaMesaActual(){
  return escobaMesaIdActual ? escobaMesas[escobaMesaIdActual] : null;
}

function escobaOtroJugador(mesa){
  return mesa.jugadores.find(a => a !== String(miAsiento));
}

function escobaCrearMesa(){
  if(!miAsiento) return;
  const ref = escobaRefMesas().push();
  ref.set({
    jugadores: [String(miAsiento)],
    nombres: { [miAsiento]: miNombre },
    fase: 'esperando',
  });
  // No se renderiza acá: escobaMesas todavía no tiene esta mesa (recién se
  // está escribiendo). El listener de escobaRefMesas() la trae enseguida y
  // dispara el render con los datos ya confirmados.
  escobaMesaIdActual = ref.key;
}

function escobaUnirseAMesa(mesaId){
  if(!miAsiento) return;
  const mesa = escobaMesas[mesaId];
  if(!mesa || mesa.fase !== 'esperando' || mesa.jugadores.includes(String(miAsiento)) || mesa.jugadores.length >= 2) return;
  const jugadores = mesa.jugadores.concat([String(miAsiento)]);
  const nombres = Object.assign({}, mesa.nombres, { [miAsiento]: miNombre });

  const mazo = escobaCrearMazo();
  const mesaCartas = mazo.splice(0, 4);
  const mano = {};
  jugadores.forEach(a => { mano[a] = mazo.splice(0, 3); });
  const capturas = {}; const escobasIniciales = {};
  jugadores.forEach(a => { capturas[a] = []; escobasIniciales[a] = 0; });

  escobaRefMesas().child(mesaId).update({
    jugadores, nombres, mano, mesaCartas, mazo,
    turno: jugadores[0],
    capturas, escobas: escobasIniciales,
    ganadorUltimaCaptura: null,
    fase: 'jugando',
  });
  // Ídem: se espera al listener para renderizar con los datos repartidos ya
  // confirmados, en vez de la copia local (todavía en fase 'esperando').
  escobaMesaIdActual = mesaId;
}

function escobaVolverAlLobby(){
  escobaMesaIdActual = null;
  escobaCartaSeleccionada = null;
  escobaMesaSeleccionada = new Set();
  renderEscoba();
}

function escobaTerminarMesa(mesaId){
  escobaRefMesas().child(mesaId).remove();
  if(escobaMesaIdActual === mesaId) escobaVolverAlLobby();
}

function escobaToggleCartaMano(indice){
  escobaCartaSeleccionada = escobaCartaSeleccionada === indice ? null : indice;
  renderEscoba();
}

function escobaToggleCartaMesa(indice){
  if(escobaMesaSeleccionada.has(indice)) escobaMesaSeleccionada.delete(indice);
  else escobaMesaSeleccionada.add(indice);
  renderEscoba();
}

function escobaSumaSeleccionMesa(mesa){
  const mesaCartas = mesa.mesaCartas || [];
  return Array.from(escobaMesaSeleccionada).reduce((acc, i) => acc + escobaValor(mesaCartas[i].numero), 0);
}

// true si lo que hay tocado (carta de mano + cartas de mesa elegidas) es una
// jugada válida: sin nada de mesa siempre vale (bajar la carta sin capturar),
// con algo de mesa elegido tiene que sumar exactamente 15 junto a la carta.
function escobaJugadaValida(mesa){
  if(escobaCartaSeleccionada == null) return false;
  if(escobaMesaSeleccionada.size === 0) return true;
  const carta = mesa.mano[String(miAsiento)][escobaCartaSeleccionada];
  return escobaSumaSeleccionMesa(mesa) + escobaValor(carta.numero) === 15;
}

// Regla de "alzar de la mesa": si entre las cartas que ya están sobre la
// mesa hay una combinación que suma 15 (sin necesitar ninguna carta de tu
// mano), el que tiene el turno la puede levantar gratis, y recién después
// juega su carta normal -- no le consume el turno. Pasa lo mismo con el
// reparto inicial: si las 4 cartas del centro ya suman 15 entre ellas, el
// primero en jugar (jugadores[0]) es el único con el turno en ese momento,
// así que tiene la prioridad de alzarlas antes que nadie más juegue.
function escobaAlzarLibreDeMesa(){
  const mesa = escobaMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento)) return;
  const indicesMesa = Array.from(escobaMesaSeleccionada);
  if(indicesMesa.length < 2 || escobaSumaSeleccionMesa(mesa) !== 15) return;

  const mesaCartasActual = mesa.mesaCartas || [];
  const capturadas = indicesMesa.map(i => mesaCartasActual[i]);
  const nuevaMesaCartas = mesaCartasActual.filter((_, i) => !indicesMesa.includes(i));
  const capturas = Object.assign({}, mesa.capturas || {});
  capturas[miAsiento] = (capturas[miAsiento] || []).concat(capturadas);
  const escobas = Object.assign({}, mesa.escobas || {});
  if(nuevaMesaCartas.length === 0) escobas[miAsiento] = (escobas[miAsiento] || 0) + 1;

  escobaMesaSeleccionada = new Set();
  escobaRefMesas().child(escobaMesaIdActual).update({
    mesaCartas: nuevaMesaCartas,
    [`capturas/${miAsiento}`]: capturas[miAsiento] || [],
    [`escobas/${miAsiento}`]: escobas[miAsiento] || 0,
    ganadorUltimaCaptura: String(miAsiento),
  });
}

function escobaCalcularResultado(mesa, capturas, escobas){
  const [a, b] = mesa.jugadores;
  const cartasA = (capturas[a] || []).length, cartasB = (capturas[b] || []).length;
  const orosA = (capturas[a] || []).filter(c => c.palo === 'oro').length;
  const orosB = (capturas[b] || []).filter(c => c.palo === 'oro').length;
  const veloA = (capturas[a] || []).some(c => c.palo === 'oro' && c.numero === 7);
  const veloB = (capturas[b] || []).some(c => c.palo === 'oro' && c.numero === 7);
  const puntos = {};
  puntos[a] = (escobas[a] || 0) + (veloA ? 1 : 0) + (cartasA > cartasB ? 1 : 0) + (orosA > orosB ? 1 : 0);
  puntos[b] = (escobas[b] || 0) + (veloB ? 1 : 0) + (cartasB > cartasA ? 1 : 0) + (orosB > orosA ? 1 : 0);
  const ganador = puntos[a] === puntos[b] ? null : (puntos[a] > puntos[b] ? a : b);
  return { puntos, ganador };
}

function escobaJugarCarta(){
  const mesa = escobaMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || String(mesa.turno) !== String(miAsiento)) return;
  if(!escobaJugadaValida(mesa)) return;

  const miMano = mesa.mano[String(miAsiento)];
  const carta = miMano[escobaCartaSeleccionada];
  const indicesMesa = Array.from(escobaMesaSeleccionada);
  const nuevaMano = miMano.filter((_, i) => i !== escobaCartaSeleccionada);

  // OJO: Firebase no guarda un valor "null" como tal (equivale a borrar esa
  // key), así que el "ganadorUltimaCaptura: null" inicial del reparto nunca
  // queda escrito de verdad -- acá lee undefined, no null. Sin este "|| null"
  // el update de abajo rompía apenas nadie había capturado nada todavía.
  // Firebase también borra "mesaCartas" cuando queda en un array vacío (una
  // escoba completa la deja así) -- de ahí este "|| []", sin el cual la
  // jugada siguiente rompía leyendo .filter/.concat de undefined y el juego
  // quedaba trabado justo después de hacer una escoba.
  const mesaCartasActual = mesa.mesaCartas || [];
  let nuevaMesaCartas, capturas = Object.assign({}, mesa.capturas || {}), escobas = Object.assign({}, mesa.escobas || {}), ganadorUltimaCaptura = mesa.ganadorUltimaCaptura || null;
  if(indicesMesa.length > 0){
    const capturadas = indicesMesa.map(i => mesaCartasActual[i]).concat([carta]);
    nuevaMesaCartas = mesaCartasActual.filter((_, i) => !indicesMesa.includes(i));
    capturas[miAsiento] = (capturas[miAsiento] || []).concat(capturadas);
    ganadorUltimaCaptura = String(miAsiento);
    if(nuevaMesaCartas.length === 0) escobas[miAsiento] = (escobas[miAsiento] || 0) + 1;
  } else {
    nuevaMesaCartas = mesaCartasActual.concat([carta]);
  }

  const otro = escobaOtroJugador(mesa);
  const manoOtroVacia = (mesa.mano[otro] || []).length === 0;
  const updates = {
    [`mano/${miAsiento}`]: nuevaMano,
    mesaCartas: nuevaMesaCartas,
    turno: otro,
    // Sin el "|| []" / "|| 0", si todavía no capturaste nada en la partida
    // esto queda undefined (Firebase borró el array vacío inicial al
    // repartir) y Firebase rechaza el update entero -- por eso "jugar sin
    // capturar" antes de tu primera captura no se guardaba.
    [`capturas/${miAsiento}`]: capturas[miAsiento] || [],
    [`escobas/${miAsiento}`]: escobas[miAsiento] || 0,
    ganadorUltimaCaptura,
  };

  if(nuevaMano.length === 0 && manoOtroVacia){
    const mazo = (mesa.mazo || []).slice();
    if(mazo.length >= mesa.jugadores.length * 3){
      mesa.jugadores.forEach(a => { updates[`mano/${a}`] = mazo.splice(0, 3); });
      updates.mazo = mazo;
    } else {
      // Se acabó el mazo: termina la partida. Lo que quedó en la mesa se lo
      // lleva quien hizo la última captura (regla estándar de la escoba).
      if(ganadorUltimaCaptura && nuevaMesaCartas.length){
        capturas[ganadorUltimaCaptura] = (capturas[ganadorUltimaCaptura] || []).concat(nuevaMesaCartas);
        updates[`capturas/${ganadorUltimaCaptura}`] = capturas[ganadorUltimaCaptura];
        updates.mesaCartas = [];
      }
      updates.fase = 'terminado';
      updates.resultado = escobaCalcularResultado(mesa, capturas, escobas);
    }
  }

  // Este reset va ANTES del update, no después: Firebase dispara el
  // listener local de .on('value') en el mismo instante en que se llama a
  // .update() (antes de confirmar nada con el servidor), así que si se
  // resetea después, el primer render ya llega con la mesa/mano nuevas pero
  // el índice de selección todavía apuntando a la carta vieja -- eso rompía
  // la captura con "Cannot read properties of undefined (reading 'numero')".
  escobaCartaSeleccionada = null;
  escobaMesaSeleccionada = new Set();
  escobaRefMesas().child(escobaMesaIdActual).update(updates);
}

let escobaPremiadoMesa = null;

function escobaPremiarSiCorresponde(mesa){
  if(!miAsiento || !mesa || mesa.fase !== 'terminado' || !mesa.resultado) return;
  if(escobaPremiadoMesa === escobaMesaIdActual) return;
  if(!mesa.jugadores.includes(String(miAsiento))) return;
  escobaPremiadoMesa = escobaMesaIdActual;
  const { puntos, ganador } = mesa.resultado;
  if(ganador == null){
    ganarMonedas(10);
    mostrarToast(`Empataron ${puntos[mesa.jugadores[0]]} a ${puntos[mesa.jugadores[1]]}. +10 monedas`, 'gain');
  } else if(String(ganador) === String(miAsiento)){
    ganarMonedas(20);
    mostrarToast(`¡Ganaste la escoba ${puntos[ganador]} a ${puntos[escobaOtroJugador(mesa)]}! +20 monedas`, 'gain');
  } else {
    mostrarToast(`Perdiste ${puntos[String(miAsiento)]} a ${puntos[ganador]}. ¡A la próxima!`);
  }
}

function escobaCartaHTML(carta, seleccionada, onclick){
  return `<button class="escoba-carta escoba-carta-${carta.palo} ${seleccionada ? 'escoba-carta-seleccionada' : ''}" ${onclick ? `onclick="${onclick}"` : 'disabled'}>
    <span class="escoba-carta-numero">${ESCOBA_NOMBRE_NUMERO[carta.numero] || carta.numero}</span>
    <span class="escoba-carta-palo">${escobaIconoPalo(carta.palo)}</span>
  </button>`;
}

function renderEscobaLobby(){
  const cont = document.getElementById('escoba-content');
  const mesasArray = Object.keys(escobaMesas).map(id => Object.assign({ id }, escobaMesas[id]));
  const listaHTML = mesasArray.length ? mesasArray.map(m => {
    const nombresJugadores = m.jugadores.map(a => m.nombres[a]).join(' vs ');
    const estado = m.fase === 'esperando' ? `Esperando rival (${m.jugadores.length}/2)` : m.fase === 'jugando' ? 'Jugando...' : 'Terminada';
    const puedoUnirme = m.fase === 'esperando' && m.jugadores.length < 2 && !m.jugadores.includes(String(miAsiento));
    const puedoEntrar = m.jugadores.includes(String(miAsiento));
    return `<div class="bingo-roster-item">
      <span>${nombresJugadores}<br><span style="font-size:11px;color:var(--gray);">${estado}</span></span>
      <span class="bingo-roster-derecha">
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="escobaMesaIdActual='${m.id}'; renderEscoba();">Entrar</button>` : ''}
        ${puedoUnirme ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;background:#3B9B5A;color:#fff;border-color:#3B9B5A;" onclick="escobaUnirseAMesa('${m.id}')">Unirme</button>` : ''}
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" onclick="escobaTerminarMesa('${m.id}')" title="Eliminar mesa">✕</button>` : ''}
      </span>
    </div>`;
  }).join('') : '<p style="color:var(--gray);font-size:13px;">Todavía no hay mesas. ¡Armá la primera!</p>';

  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>🃏 Escoba de 15</h2>
      <p>Para 2 jugadores. Jugá una carta y combinala con las de la mesa para sumar 15 y llevártelas — si dejás la mesa vacía, es una escoba y vale un punto extra.</p>
    </div>
    <div class="section-label">Mesas</div>
    ${listaHTML}
    <button class="btn-primary" onclick="escobaCrearMesa()">Crear mesa nueva</button>`;
}

function renderEscobaMesa(){
  const cont = document.getElementById('escoba-content');
  const mesa = escobaMesaActual();
  if(!mesa){ escobaVolverAlLobby(); return; }

  if(mesa.fase === 'esperando'){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;"><h2>Esperando rival...</h2><p>Compartí la app con alguien más del viaje para que se una a esta mesa.</p></div>
      <p class="link-chico" onclick="escobaVolverAlLobby()">‹ Volver a la lista de mesas</p>
      <p class="link-chico" onclick="escobaTerminarMesa('${escobaMesaIdActual}')">Cancelar esta mesa</p>`;
    return;
  }

  const soyTurno = mesa.fase === 'jugando' && String(mesa.turno) === String(miAsiento);
  const otro = escobaOtroJugador(mesa);
  const miMano = (mesa.mano && mesa.mano[String(miAsiento)]) || [];
  const manoOtroLen = (mesa.mano && mesa.mano[otro] || []).length;

  const cabezeraHTML = `
    <div class="escoba-marcador">
      <div>🫲 Vos: ${((mesa.capturas || {})[String(miAsiento)] || []).length} cartas, ${(mesa.escobas || {})[String(miAsiento)] || 0} escobas</div>
      <div>${mesa.nombres[otro] || 'Rival'}: ${((mesa.capturas || {})[otro] || []).length} cartas, ${(mesa.escobas || {})[otro] || 0} escobas</div>
    </div>`;

  if(mesa.fase === 'terminado'){
    const { puntos, ganador } = mesa.resultado;
    const resultadoTexto = ganador == null ? '¡Empataron!' : (String(ganador) === String(miAsiento) ? '¡Ganaste!' : `Ganó ${mesa.nombres[ganador]}`);
    cont.innerHTML = `
      ${cabezeraHTML}
      <div class="hero" style="margin-top:8px;">
        <h2>🏁 ${resultadoTexto}</h2>
        <p>${puntos[String(miAsiento)]} a ${puntos[otro]} puntos.</p>
      </div>
      <button class="btn-primary" onclick="escobaTerminarMesa('${escobaMesaIdActual}')">Cerrar esta mesa</button>
      <p class="link-chico" onclick="escobaVolverAlLobby()">‹ Volver a la lista de mesas</p>`;
    escobaPremiarSiCorresponde(mesa);
    return;
  }

  const mesaCartasHTML = (mesa.mesaCartas || []).map((c, i) => escobaCartaHTML(c, escobaMesaSeleccionada.has(i), soyTurno ? `escobaToggleCartaMesa(${i})` : null)).join('') || '<p style="font-size:12px;">Mesa vacía</p>';
  const manoHTML = miMano.map((c, i) => escobaCartaHTML(c, escobaCartaSeleccionada === i, soyTurno ? `escobaToggleCartaMano(${i})` : null)).join('');
  const sumaMesaSola = escobaCartaSeleccionada == null && escobaMesaSeleccionada.size > 0 ? escobaSumaSeleccionMesa(mesa) : null;
  const sumaActual = escobaCartaSeleccionada != null ? escobaSumaSeleccionMesa(mesa) + escobaValor(miMano[escobaCartaSeleccionada].numero) : null;
  const sumaParaMostrar = sumaActual != null ? sumaActual : sumaMesaSola;

  // Si tocás solo cartas de la mesa (sin elegir ninguna de tu mano) y ya
  // suman 15 entre ellas, se pueden alzar gratis -- sin gastar tu jugada.
  // Recién después seguís tu turno normal (elegís tu carta y jugás como
  // siempre). Cubre tanto un 15 que quedó pendiente de una jugada anterior
  // como el caso del reparto inicial, si las 4 cartas del centro ya suman
  // 15: en ese momento solo el primero en jugar tiene el turno, así que
  // tiene la prioridad para alzarlas antes que nadie más toque nada.
  let botonAccionHTML = '';
  if(soyTurno){
    if(escobaCartaSeleccionada != null){
      botonAccionHTML = `<button class="btn-primary" onclick="escobaJugarCarta()" ${escobaJugadaValida(mesa) ? '' : 'disabled'}>${escobaMesaSeleccionada.size ? 'Alzar' : 'Tirar'}</button>`;
    } else if(escobaMesaSeleccionada.size >= 2){
      botonAccionHTML = `<button class="btn-primary" onclick="escobaAlzarLibreDeMesa()" ${sumaMesaSola === 15 ? '' : 'disabled'}>Alzar de la mesa (sin jugar carta)</button>`;
    }
  }

  cont.innerHTML = `
    ${cabezeraHTML}
    <div class="hero" style="margin-top:8px;">
      <h2>${soyTurno ? 'Tu turno' : `Turno de ${mesa.nombres[otro]}`}</h2>
      <p>${soyTurno ? 'Tocá una carta tuya y, si querés, cartas de la mesa que sumen 15 con ella. Si ves cartas de la mesa que ya suman 15 entre ellas, las podés alzar gratis antes de jugar tu carta.' : 'Esperá a que juegue su carta.'}</p>
    </div>
    <div class="section-label">Cartas de ${mesa.nombres[otro]} (${manoOtroLen})</div>
    <div class="escoba-fila">${Array.from({ length: manoOtroLen }).map(() => '<div class="escoba-carta escoba-carta-dorso"></div>').join('')}</div>
    <div class="section-label">Mesa${sumaParaMostrar != null ? ` — suma elegida: ${sumaParaMostrar}/15` : ''}</div>
    <div class="tapete-mesa"><div class="escoba-fila">${mesaCartasHTML}</div></div>
    <div class="section-label">Tu mano</div>
    <div class="escoba-fila">${manoHTML}</div>
    ${botonAccionHTML}
    <p class="link-chico" onclick="escobaTerminarMesa('${escobaMesaIdActual}')">Abandonar esta mesa</p>`;
}

function renderEscoba(){
  const cont = document.getElementById('escoba-content');
  if(!cont) return;
  document.getElementById('escoba-sub').textContent = escobaMesaIdActual ? 'En una mesa' : 'Elegí o creá una mesa';
  if(escobaMesaIdActual && escobaMesas[escobaMesaIdActual]) renderEscobaMesa();
  else { escobaMesaIdActual = null; renderEscobaLobby(); }
}
