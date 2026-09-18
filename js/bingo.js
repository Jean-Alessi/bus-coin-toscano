let bingo = null;
let bingoPasajeros = {};
let bingoCartones = {};
let bingoSeleccion = [];
let bingoMostrandoPin = false;

// El PIN de organizador vive en js/marca.js (MARCA.pinOrganizador), para
// que cambiarlo por cliente sea un solo lugar en todo el código.
const BINGO_PIN_ORGANIZADOR = MARCA.pinOrganizador;
const BINGO_CANTIDAD_CARTON = 12;
const BINGO_TAMANO_CARTON = 3;
// Números del cartón: 00 al 99, como en un bingo/lotería tradicional.
const BINGO_NUMEROS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0'));

// Significado de cada número al estilo de las loterías populares (libro de los
// sueños): se canta el número y, al lado, su significado.
const BINGO_SIGNIFICADOS = [
  'el huevo', 'el sol', 'la luna', 'el gato', 'la casa', 'el perro', 'la serpiente', 'la suerte',
  'el dinero', 'el viaje', 'el pez', 'los mellizos', 'el reloj', 'la mala suerte', 'la fiesta', 'la niña',
  'el vino', 'la discusión', 'el engaño', 'el cura', 'el político', 'el marinero', 'el loco', 'la mujer',
  'el toro', 'el auto', 'la mentira', 'el general', 'el casamiento', 'el café', 'el árbol', 'el rey',
  'el avión', 'la cruz', 'el corazón', 'la abeja', 'el cementerio', 'el barco', 'el ladrón', 'el sombrero',
  'el caballo', 'el policía', 'el pan', 'el fuego', 'los dientes', 'la lluvia', 'el vecino', 'el preso',
  'el muerto', 'el chancho', 'el tren', 'la bandera', 'el baile', 'la carta', 'el dinero perdido', 'el tesoro',
  'el robo', 'el regalo', 'el barrio', 'el teléfono', 'la vejez', 'el mar', 'la tormenta', 'la escuela',
  'el trabajo', 'la familia', 'el chisme', 'el terreno', 'el vestido', 'el amor', 'el fantasma', 'la sorpresa',
  'el regreso', 'el pájaro', 'el puente', 'el sueño', 'el espejo', 'la suerte doble', 'el paraguas', 'el camino',
  'la montaña', 'el río', 'el desierto', 'la estrella', 'el reloj de arena', 'el fuego lento', 'el invierno', 'el verano',
  'el manantial', 'el otoño', 'la primavera', 'el anillo', 'la boda', 'el bebé', 'la escalera', 'el puerto',
  'la brújula', 'el faro', 'el ancla', 'el horizonte',
];

function bingoArmarLlamada(numero){
  const significado = BINGO_SIGNIFICADOS[Number(numero)] || '';
  return `<span class="bingo-numero-resaltado">${numero}</span><span class="bingo-numero-significado">${significado}</span>`;
}

// ---- Multi-celular, con el organizador manejando cada paso:
//   1. 'cerrado'  — todavía no se abrió el bingo. Nadie se puede anotar.
//   2. 'anotando' — el organizador abrió la anotación ("Comenzar el bingo").
//                   Los pasajeros se anotan con su nombre + asiento.
//   3. 'armando'  — el organizador cerró la anotación y dejó armar los
//                   cartones. Ve en vivo (✓ verde) quién ya completó el
//                   suyo, y puede sacar a cualquiera de la lista.
//   4. 'jugando'  — el organizador arrancó el sorteo. Solo juega quien
//                   llegó a completar su cartón antes de este paso; el que
//                   quedó sin armar espera a la próxima partida.
// "Jugar de nuevo" vuelve a 'armando' (no directo a 'jugando'), para que
// quien se quedó sin cartón tenga otra chance antes de que arranque el
// sorteo siguiente.
//
// Ser organizador es una marca local del celular (vía PIN), no depende de
// quién llegó primero ni se pierde si se reinicia la partida.
//
// El marcado del cartón es manual: cada uno toca sus propios números a
// medida que van saliendo (no se marcan solos). Para que nadie pueda tocar
// un número que no salió y "ganar" por error, bingoTocarNumero() solo
// acepta el toque si ese número ya está en bingo.sorteados — así, si el
// sistema detecta un cartón lleno, es matemáticamente imposible que sea un
// falso positivo: todo lo marcado fue, sin excepción, validado contra lo
// que realmente se cantó. ----

function bingoRefEstado(){ return db.ref(`salas/${codigoViaje}/bingo/estado`); }
function bingoRefPasajeros(){ return db.ref(`salas/${codigoViaje}/bingo/pasajeros`); }
function bingoRefCartones(){ return db.ref(`salas/${codigoViaje}/bingo/cartones`); }

function bingoEstadoVacio(){
  return { fase: 'cerrado', bolsa: [], sorteados: [], ultimaLlamada: null, ganadorCartonLleno: null };
}

function bingoEsOrganizador(){
  return localStorage.getItem('bingo-organizador') === 'si';
}

// Deja de ser organizador en ESTE celular/navegador (útil para volver a probar
// la vista de pasajero, o si se marcó por error). No afecta a otros dispositivos.
function bingoCerrarSesionOrganizador(){
  localStorage.removeItem('bingo-organizador');
  renderBingo();
}

function bingoRegistrarPasajero(asiento, nombre){
  bingoRefPasajeros().child(String(asiento)).set(nombre);
}

// El pasajero se anota por su cuenta, pero solo mientras el organizador
// tiene la anotación abierta — así el organizador controla exactamente
// quién entra a jugar esta partida.
function bingoAnotarme(){
  if(!miAsiento || !bingo || bingo.fase !== 'anotando') return;
  bingoRegistrarPasajero(miAsiento, miNombre);
}

function bingoSalirDelBingo(){
  if(!miAsiento || !bingo || bingo.fase !== 'anotando') return;
  bingoRefPasajeros().child(String(miAsiento)).remove();
}

// El organizador saca a quien no quiere que juegue, en cualquier momento.
function bingoEliminarPasajero(asiento){
  if(!bingoEsOrganizador()) return;
  bingoRefPasajeros().child(String(asiento)).remove();
  bingoRefCartones().child(String(asiento)).remove();
}

function bingoAbrirAnotacion(){
  if(!bingoEsOrganizador()) return;
  bingoRefEstado().update({ fase: 'anotando' });
}

function bingoAbrirArmado(){
  if(!bingoEsOrganizador() || !bingo || bingo.fase !== 'anotando') return;
  bingoRefEstado().update({ fase: 'armando' });
}

let bingoListenersListos = false;

function iniciarBingo(){
  if(!bingoListenersListos){
    bingoListenersListos = true;
    bingoRefEstado().on('value', snap => {
      // Firebase no guarda arrays vacíos ni null: se completan los campos que
      // falten con los valores por defecto para que el resto del código no rompa.
      const anterior = bingo;
      bingo = Object.assign(bingoEstadoVacio(), snap.val() || {});
      // El sonido se dispara acá (no en bingoSortear) para que suene en el
      // celular de cada pasajero cuando le llega el número nuevo, no solo en
      // el del organizador que lo sorteó.
      if(anterior){
        if((bingo.sorteados || []).length > (anterior.sorteados || []).length) reproducirTono('tick');
        if(bingo.ganadorCartonLleno && !anterior.ganadorCartonLleno) reproducirTono('bonus');
      }
      renderBingo();
    });
    bingoRefPasajeros().on('value', snap => {
      bingoPasajeros = snap.val() || {};
      renderBingo();
    });
    bingoRefCartones().on('value', snap => {
      bingoCartones = snap.val() || {};
      renderBingo();
    });
  } else {
    renderBingo();
  }
}

function bingoMostrarPinOrganizador(){
  bingoMostrandoPin = true;
  renderBingo();
  if(typeof renderImpostor === 'function') renderImpostor();
}

function bingoIntentarSerOrganizador(){
  const input = document.getElementById('bingo-pin-input');
  const pin = input ? input.value.trim() : '';
  const error = document.getElementById('bingo-pin-error');
  if(pin !== BINGO_PIN_ORGANIZADOR){
    if(error) error.textContent = 'PIN incorrecto';
    return;
  }
  localStorage.setItem('bingo-organizador', 'si');
  bingoMostrandoPin = false;
  renderBingo();
  // El mismo PIN también da el rol de director en El Impostor — si esa
  // pantalla está abierta (o se abrió antes en esta sesión), se refresca
  // también para que aparezcan sus controles sin tener que ir y volver.
  if(typeof renderImpostor === 'function') renderImpostor();
}

function bingoToggleNumero(numero){
  const idx = bingoSeleccion.indexOf(numero);
  if(idx !== -1){
    bingoSeleccion.splice(idx, 1);
  } else if(bingoSeleccion.length < BINGO_CANTIDAD_CARTON){
    bingoSeleccion.push(numero);
  }
  renderBingo();
}

function bingoConfirmarCarton(){
  if(!bingo || bingo.fase !== 'armando') return;
  if(bingoSeleccion.length !== BINGO_CANTIDAD_CARTON || !miAsiento) return;
  // De menor a mayor, no en el orden en que se fueron tocando al elegirlos —
  // así es mucho más fácil ubicar cada número cuando se canta uno.
  const numeros = bingoSeleccion.slice().sort((a, b) => Number(a) - Number(b));
  bingoRefCartones().child(String(miAsiento)).set({ nombres: numeros, marcados: [] });
}

function bingoEmpezarJuego(){
  if(!bingoEsOrganizador() || !bingo || bingo.fase !== 'armando') return;
  const conCarton = Object.keys(bingoCartones).filter(a => bingoCartones[a] && bingoCartones[a].nombres && bingoCartones[a].nombres.length === BINGO_CANTIDAD_CARTON);
  if(!conCarton.length) return;
  bingoRefEstado().update({
    bolsa: barajar(BINGO_NUMEROS.slice()),
    sorteados: [],
    ultimaLlamada: null,
    ganadorCartonLleno: null,
    fase: 'jugando',
  });
}

// update() con solo los campos que cambian, nunca un .set() del objeto
// entero — si se pisara todo el estado con la copia local del organizador,
// un "cantar número" que llega justo después de que alguien completó su
// cartón podría borrar el ganadorCartonLleno recién declarado (el
// organizador todavía no se había enterado de ese cambio).
function bingoSortear(){
  if(!bingoEsOrganizador()) return;
  const bolsa = (bingo.bolsa || []).slice();
  if(!bolsa.length) return;
  const numero = bolsa.pop();
  const sorteados = (bingo.sorteados || []).concat(numero);
  bingoRefEstado().update({ bolsa, sorteados, ultimaLlamada: bingoArmarLlamada(numero) });
}

// Cada pasajero toca sus propios números a medida que van saliendo. Solo se
// acepta si el número ya fue cantado (si no, no hace nada — así no hay
// forma de marcar por error algo que no salió). Tocar de nuevo un número ya
// marcado lo desmarca, por si alguien se confunde de casillero.
function bingoTocarNumero(indice){
  if(!miAsiento) return;
  if(!bingo || bingo.fase !== 'jugando') return;
  const miCarton = bingoCartones[String(miAsiento)];
  if(!miCarton || !miCarton.nombres) return;
  const numero = miCarton.nombres[indice];
  if(!(bingo.sorteados || []).includes(numero)) return;

  const marcados = (miCarton.marcados || []).slice();
  const idx = marcados.indexOf(indice);
  if(idx !== -1) marcados.splice(idx, 1);
  else marcados.push(indice);
  miCarton.marcados = marcados;
  bingoRefCartones().child(String(miAsiento)).child('marcados').set(marcados);

  // Como cada marca ya está validada contra lo realmente sorteado, un
  // cartón lleno acá es un bingo genuino — se declara desde el propio
  // celular del ganador, así las monedas se acreditan a quien corresponde.
  // update() puntual (no un .set() del objeto entero): así esto no se
  // pierde si justo se cruza con un "cantar número" del organizador.
  if(marcados.length === BINGO_CANTIDAD_CARTON && !bingo.ganadorCartonLleno){
    bingoRefEstado().update({ ganadorCartonLleno: String(miAsiento) });
    ganarMonedas(100);
    mostrarToast('¡BINGO! +100 monedas', 'gain');
  }
}

// Pide confirmación antes de dar por terminada la partida — así el
// organizador no la cierra de un toque apurado sin haber cantado bien al
// ganador delante de todos.
function bingoConfirmarJugarDeNuevo(){
  const mensaje = bingo.ganadorCartonLleno
    ? `¿Seguro que querés empezar una partida nueva? Se va a perder de la pantalla que ganó ${bingoPasajeros[bingo.ganadorCartonLleno] || 'asiento ' + bingo.ganadorCartonLleno}.`
    : '¿Seguro que querés empezar una partida nueva?';
  if(confirm(mensaje)) bingoJugarDeNuevo();
}

// Vuelve a 'armando' (no directo a 'jugando'): quien se quedó sin cartón
// esta vez tiene otra chance de armarlo antes de que arranque el sorteo
// siguiente. Los cartones ya armados se conservan, solo se limpian las marcas.
function bingoJugarDeNuevo(){
  if(!bingoEsOrganizador()) return;
  const cartonesLimpios = {};
  Object.keys(bingoCartones).forEach(a => { cartonesLimpios[a] = Object.assign({}, bingoCartones[a], { marcados: [] }); });
  bingoRefEstado().update({
    bolsa: [],
    sorteados: [],
    ultimaLlamada: null,
    ganadorCartonLleno: null,
    fase: 'armando',
  });
  bingoRefCartones().set(cartonesLimpios);
}

// interactivo = true solo cuando se muestra el propio cartón durante la
// partida: ahí cada celda se puede tocar. Antes de empezar (armando el
// cartón) o mostrándole a alguien un cartón ajeno, queda solo de lectura.
function bingoCartonHTML(asiento, titulo, carton, interactivo){
  const marcados = carton.marcados || [];
  const sorteados = (bingo && bingo.sorteados) || [];
  const badges = [];
  if(bingo.ganadorCartonLleno === asiento) badges.push('<span class="bingo-badge bingo-badge-full">¡BINGO!</span>');
  return `
    <div class="bingo-carton">
      <div class="bingo-carton-titulo">${titulo} ${badges.join(' ')}</div>
      <div class="bingo-grid" style="grid-template-columns:repeat(${BINGO_TAMANO_CARTON},1fr)">
        ${carton.nombres.map((n, i) => {
          const marcado = marcados.includes(i);
          const disponible = !marcado && sorteados.includes(n);
          const clases = ['bingo-celda'];
          if(marcado) clases.push('bingo-marcada');
          if(interactivo && disponible) clases.push('bingo-celda-disponible');
          if(interactivo) clases.push('bingo-celda-clickeable');
          const onclick = interactivo ? ` onclick="bingoTocarNumero(${i})"` : '';
          return `<div class="${clases.join(' ')}"${onclick}>${n}</div>`;
        }).join('')}
      </div>
    </div>`;
}

function bingoPinHTML(){
  if(!bingoMostrandoPin){
    return `<button class="btn-organizador-link" onclick="bingoMostrarPinOrganizador()">👤 ¿Sos el organizador? Entrá acá</button>`;
  }
  return `
    <div class="bingo-pin-box">
      <input type="password" id="bingo-pin-input" class="bingo-input-numero" inputmode="numeric" maxlength="4" placeholder="PIN del organizador">
      <button class="btn-primary" onclick="bingoIntentarSerOrganizador()">Entrar como organizador</button>
      <p id="bingo-pin-error" class="bingo-pin-error"></p>
    </div>`;
}

function bingoOrdenAsientos(mapa){
  return Object.keys(mapa).sort((a, b) => Number(a) - Number(b));
}

function renderBingo(){
  const container = document.getElementById('bingo-content');
  if(!container || !bingo) return;

  if(bingoEsOrganizador()){
    renderBingoOrganizador(container);
    return;
  }
  renderBingoPasajero(container);
}

function renderBingoOrganizador(container){
  // El organizador no juega, así que no cuenta como "pasajero anotado".
  const asientos = bingoOrdenAsientos(bingoPasajeros).filter(a => a !== String(miAsiento));
  const completos = asientos.filter(a => bingoCartones[a] && bingoCartones[a].nombres && bingoCartones[a].nombres.length === BINGO_CANTIDAD_CARTON);
  const listaHTML = asientos.length
    ? asientos.map(a => {
      const listo = bingoCartones[a] && bingoCartones[a].nombres && bingoCartones[a].nombres.length === BINGO_CANTIDAD_CARTON;
      return `<div class="bingo-roster-item ${listo ? 'bingo-roster-listo' : ''}">
        <span>Asiento ${a} — ${bingoPasajeros[a]}</span>
        <span class="bingo-roster-derecha">
          <span>${listo ? '✓ Listo' : 'Armando cartón...'}</span>
          <button class="btn-eliminar-pasajero" onclick="bingoEliminarPasajero('${a}')" title="Sacar del bingo">✕</button>
        </span>
      </div>`;
    }).join('')
    : '<p style="color:var(--gray);font-size:13px;">Todavía no se anotó nadie.</p>';

  if(bingo.fase === 'cerrado'){
    container.innerHTML = `
      <div class="section-label">Panel del organizador</div>
      <div class="hero" style="margin-top:8px;">
        <h2>Listo para arrancar</h2>
        <p>Cuando toqués "Comenzar el bingo" los pasajeros van a poder anotarse.</p>
      </div>
      <button class="btn-primary" onclick="bingoAbrirAnotacion()">Comenzar el bingo</button>
      <p class="link-chico" onclick="bingoCerrarSesionOrganizador()">Cerrar sesión de organizador</p>`;
    return;
  }

  if(bingo.fase === 'anotando'){
    container.innerHTML = `
      <div class="section-label">Panel del organizador</div>
      <div class="hero" style="margin-top:8px;">
        <h2>Anotación abierta</h2>
        <p>${asientos.length} anotado${asientos.length === 1 ? '' : 's'}. Sacá a quien no quieras que juegue, y cuando estén los que quieras, pasá a armar los cartones.</p>
      </div>
      <div class="bingo-roster">${listaHTML}</div>
      <button class="btn-primary" onclick="bingoAbrirArmado()" ${asientos.length ? '' : 'disabled'}>Empezar a armar cartones</button>
      <p class="link-chico" onclick="bingoCerrarSesionOrganizador()">Cerrar sesión de organizador</p>`;
    return;
  }

  if(bingo.fase === 'armando'){
    container.innerHTML = `
      <div class="section-label">Panel del organizador</div>
      <div class="hero" style="margin-top:8px;">
        <h2>Armando los cartones</h2>
        <p>${completos.length} de ${asientos.length} ya completaron su cartón de ${BINGO_CANTIDAD_CARTON} números. El que no llegue a armarlo no juega esta partida.</p>
      </div>
      <div class="bingo-roster">${listaHTML}</div>
      <button class="btn-primary" onclick="bingoEmpezarJuego()" ${completos.length ? '' : 'disabled'}>Empezar el bingo</button>
      <p class="link-chico" onclick="bingoAbrirAnotacion()">‹ Volver a la anotación (para que se sume alguien más)</p>
      <p class="link-chico" onclick="bingoCerrarSesionOrganizador()">Cerrar sesión de organizador</p>`;
    return;
  }

  // fase 'jugando'
  const terminado = !!bingo.ganadorCartonLleno;
  const bolsa = bingo.bolsa || [];
  const sorteados = bingo.sorteados || [];
  // Con cartones de 12 números puede pasar que se canten los 100 y nadie
  // complete el suyo — sin esto, el botón quedaba en "Cantar número"
  // deshabilitado para siempre, sin ninguna forma de arrancar de nuevo.
  const bolsaAgotada = !terminado && bolsa.length === 0;
  const historialHTML = sorteados.length
    ? sorteados.slice().reverse().map((n, i) => `<span class="bingo-chip${i === 0 ? ' bingo-chip-ultimo' : ''}">${n}</span>`).join('')
    : '<span class="bingo-chip bingo-chip-vacio">Todavía nada</span>';
  const bannerFinal = terminado
    ? `<div class="hero" style="margin-top:8px;"><h2>¡BINGO!</h2><p>Ganó ${bingoPasajeros[bingo.ganadorCartonLleno]} (asiento ${bingo.ganadorCartonLleno}) con el cartón lleno.</p></div>`
    : bolsaAgotada
      ? `<div class="hero" style="margin-top:8px;"><h2>Se cantaron los 100 números</h2><p>Nadie completó el cartón esta vez.</p></div>`
      : '';
  container.innerHTML = `
    <div class="section-label">Panel del organizador</div>
    ${bannerFinal}
    <div class="bingo-sorteo">
      <div class="bingo-ultimo">${bingo.ultimaLlamada || '—'}</div>
      ${terminado || bolsaAgotada
        ? `<button class="btn-primary" onclick="bingoConfirmarJugarDeNuevo()">Jugar de nuevo</button>`
        : `<button class="btn-primary" onclick="bingoSortear()" ${bolsa.length === 0 ? 'disabled' : ''}>Cantar número</button>`}
    </div>
    <div class="section-label">Ya salieron (${sorteados.length}/${BINGO_NUMEROS.length})</div>
    <div class="bingo-historial">${historialHTML}</div>
    <div class="section-label">Pasajeros (${completos.length} de ${asientos.length} con cartón)</div>
    <div class="bingo-roster">${listaHTML}</div>
    <p class="link-chico" onclick="bingoCerrarSesionOrganizador()">Cerrar sesión de organizador</p>`;
}

function renderBingoPasajero(container){
  if(!miAsiento || !miNombre){
    container.innerHTML = `<p style="color:var(--gray);font-size:13px;">Volvé al inicio y completá tu nombre y asiento para jugar.</p>`;
    return;
  }

  const anotado = bingoPasajeros[String(miAsiento)] != null;
  const miCarton = bingoCartones[String(miAsiento)];
  const tengoCartonCompleto = !!(miCarton && miCarton.nombres && miCarton.nombres.length === BINGO_CANTIDAD_CARTON);

  if(bingo.fase === 'cerrado'){
    container.innerHTML = `
      ${bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>🎱 Bingo</h2>
        <p>Todavía no arrancó. Esperá a que el organizador abra la anotación.</p>
      </div>`;
    return;
  }

  if(bingo.fase === 'anotando'){
    container.innerHTML = `
      ${bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>${anotado ? '¡Ya te anotaste!' : 'Se abrió el bingo'}</h2>
        <p>${anotado ? 'Esperá a que el organizador abra armar los cartones.' : `Anotate para jugar con el asiento ${miAsiento}.`}</p>
      </div>
      ${anotado
        ? `<button class="btn-ghost" style="width:100%;" onclick="bingoSalirDelBingo()">Salir del bingo</button>`
        : `<button class="btn-primary" onclick="bingoAnotarme()">Anotarme al bingo</button>`}`;
    return;
  }

  if(bingo.fase === 'armando'){
    if(!anotado){
      container.innerHTML = `
        ${bingoPinHTML()}
        <div class="hero" style="margin-top:8px;">
          <h2>No te anotaste a tiempo</h2>
          <p>La anotación para esta partida ya cerró. Esperá a que el organizador abra la próxima.</p>
        </div>`;
      return;
    }
    if(!tengoCartonCompleto){
      const itemNumero = (n) => {
        const marcado = bingoSeleccion.includes(n);
        return `<div class="bingo-nombre-item ${marcado ? 'bingo-nombre-elegido' : ''}" onclick="bingoToggleNumero('${n}')">${n}</div>`;
      };
      container.innerHTML = `
        ${bingoPinHTML()}
        <div class="hero" style="margin-top:8px;">
          <h2>Armá tu cartón</h2>
          <p>Elegí exactamente ${BINGO_CANTIDAD_CARTON} números del 00 al 99. Vas a jugar con el asiento ${miAsiento}. Este va a ser tu cartón para todo el viaje, en todas las partidas.</p>
        </div>
        <div class="section-label">Elegidos: ${bingoSeleccion.length}/${BINGO_CANTIDAD_CARTON}</div>
        <div class="bingo-lista-nombres">${BINGO_NUMEROS.map(itemNumero).join('')}</div>
        <button class="btn-primary" onclick="bingoConfirmarCarton()" ${bingoSeleccion.length === BINGO_CANTIDAD_CARTON ? '' : 'disabled'}>Confirmar mi cartón</button>`;
      return;
    }
    const asientos = Object.keys(bingoPasajeros);
    const completos = asientos.filter(a => bingoCartones[a] && bingoCartones[a].nombres && bingoCartones[a].nombres.length === BINGO_CANTIDAD_CARTON);
    container.innerHTML = `
      ${bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>Ya armaste tu cartón</h2>
        <p>Esperando a que el organizador arranque (${completos.length}/${asientos.length} ya están listos).</p>
      </div>
      ${bingoCartonHTML(String(miAsiento), `Tu cartón (asiento ${miAsiento})`, miCarton, false)}`;
    return;
  }

  // fase 'jugando'
  if(!tengoCartonCompleto){
    container.innerHTML = `
      ${bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>Esta vuelta no jugás</h2>
        <p>${anotado ? 'No llegaste a armar tu cartón a tiempo.' : 'No te anotaste para esta partida.'} Esperá a que el organizador arranque otra.</p>
      </div>`;
    return;
  }
  const terminado = !!bingo.ganadorCartonLleno;
  const bolsaAgotada = !terminado && (bingo.bolsa || []).length === 0;
  const sorteados = bingo.sorteados || [];
  const historialHTML = sorteados.length
    ? sorteados.slice().reverse().map((n, i) => `<span class="bingo-chip${i === 0 ? ' bingo-chip-ultimo' : ''}">${n}</span>`).join('')
    : '<span class="bingo-chip bingo-chip-vacio">Todavía nada</span>';
  const bannerFinal = terminado
    ? `<div class="hero" style="margin-top:8px;"><h2>¡BINGO!</h2><p>Ganó ${bingoPasajeros[bingo.ganadorCartonLleno]} (asiento ${bingo.ganadorCartonLleno}) con el cartón lleno.</p></div>`
    : bolsaAgotada
      ? `<div class="hero" style="margin-top:8px;"><h2>Se cantaron los 100 números</h2><p>Nadie completó el cartón esta vez.</p></div>`
      : '';
  container.innerHTML = `
    ${bingoPinHTML()}
    <div class="section-label">Tu asiento es el ${miAsiento}</div>
    ${bannerFinal}
    <div class="bingo-sorteo">
      <div class="bingo-ultimo">${bingo.ultimaLlamada || '—'}</div>
      <p class="bingo-espera">${terminado || bolsaAgotada ? 'Esperá a que el organizador arranque otra partida.' : 'El organizador va cantando los números.'}</p>
    </div>
    <div class="section-label">Ya salieron (${sorteados.length}/${BINGO_NUMEROS.length})</div>
    <div class="bingo-historial">${historialHTML}</div>
    ${miCarton ? bingoCartonHTML(String(miAsiento), `Tu cartón (asiento ${miAsiento})`, miCarton, !terminado && !bolsaAgotada) : ''}
    ${!terminado && !bolsaAgotada ? '<p class="bingo-espera">Tocá tus números a medida que van saliendo.</p>' : ''}`;
}
