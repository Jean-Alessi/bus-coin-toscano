// Dibujar y Adivinar: por turnos, uno dibuja con el dedo una palabra secreta
// y el resto adivina escribiendo (estilo Pictionary/Skribbl). Reutiliza el
// mismo banco de palabras de El Impostor y el mismo patrón de grupo chico +
// director = organizador del viaje.
//
// Sincronización del dibujo: cada trazo completo (desde que se apoya el dedo
// hasta que se levanta) se manda entero a Firebase una sola vez — mandar
// cada punto por separado saturaría de escrituras. Mientras se dibuja, el
// trazo se ve al instante en el propio celular (dibujado localmente); en el
// resto de los celulares aparece recién cuando se levanta el dedo.

const DIBUJAR_MIN_JUGADORES = 2;

const DIBUJAR_COLORES = [
  { nombre: 'Negro', valor: '#1A1A1A' },
  { nombre: 'Rojo', valor: '#D64545' },
  { nombre: 'Azul', valor: '#2D6CDF' },
  { nombre: 'Amarillo', valor: '#F2B705' },
];

let dibujarEstado = null;
let dibujarAnotados = {};
let dibujarIntentos = {};
let dibujarRondaPremiada = null;
let dibujarCanvas = null;
let dibujarCtx = null;
let dibujarDibujando = false;
let dibujarTrazoActual = null;
let dibujarColorActual = DIBUJAR_COLORES[0].valor;

function dibujarEstadoVacio(){
  return { fase: 'lobby', jugadores: [], turno: 0, palabra: null, categoria: null, trazos: [], adivinada: false, ganador: null, ronda: 0 };
}

function dibujarRefEstado(){ return db.ref(`salas/${codigoViaje}/dibujar/estado`); }
function dibujarRefAnotados(){ return db.ref(`salas/${codigoViaje}/dibujar/anotados`); }
function dibujarRefIntentos(){ return db.ref(`salas/${codigoViaje}/dibujar/intentos`); }

let dibujarListenersListos = false;

function iniciarDibujar(){
  if(!dibujarListenersListos){
    dibujarListenersListos = true;
    dibujarRefEstado().on('value', snap => {
      dibujarEstado = Object.assign(dibujarEstadoVacio(), snap.val() || {});
      if(dibujarEstado.adivinada) dibujarPremiarSiCorresponde();
      renderDibujar();
    });
    dibujarRefAnotados().on('value', snap => {
      dibujarAnotados = snap.val() || {};
      if(dibujarEstado && dibujarEstado.fase === 'lobby') renderDibujar();
    });
    dibujarRefIntentos().on('value', snap => {
      dibujarIntentos = snap.val() || {};
      if(dibujarEstado && dibujarEstado.fase === 'jugando') renderDibujar();
    });
  } else {
    renderDibujar();
  }
}

function dibujarOrdenAsientos(mapa){
  return Object.keys(mapa).sort((a, b) => Number(a) - Number(b));
}

function dibujarEsDirector(){
  return bingoEsOrganizador();
}

function dibujarAnotarme(){
  if(!miAsiento) return;
  dibujarRefAnotados().child(String(miAsiento)).set(miNombre);
}

function dibujarSalirDelGrupo(){
  if(!miAsiento) return;
  dibujarRefAnotados().child(String(miAsiento)).remove();
}

function dibujarAsientoDelTurno(){
  if(!dibujarEstado || !dibujarEstado.jugadores.length) return null;
  return dibujarEstado.jugadores[dibujarEstado.turno % dibujarEstado.jugadores.length];
}

function dibujarPalabraAlAzar(){
  return IMPOSTOR_BANCO[Math.floor(Math.random() * IMPOSTOR_BANCO.length)];
}

function dibujarEmpezarRonda(){
  if(!dibujarEsDirector()) return;
  const jugadores = dibujarOrdenAsientos(dibujarAnotados);
  if(jugadores.length < DIBUJAR_MIN_JUGADORES) return;
  const elegido = dibujarPalabraAlAzar();
  const nuevaRonda = (dibujarEstado ? dibujarEstado.ronda : 0) + 1;
  dibujarRefIntentos().set(null);
  dibujarRefEstado().set({
    fase: 'jugando',
    jugadores: barajar(jugadores.slice()),
    turno: 0,
    palabra: elegido.palabra,
    categoria: elegido.categoria,
    trazos: [],
    adivinada: false,
    ganador: null,
    ronda: nuevaRonda,
  });
}

function dibujarSiguienteTurno(){
  if(!dibujarEsDirector() || !dibujarEstado) return;
  const elegido = dibujarPalabraAlAzar();
  dibujarRefIntentos().set(null);
  dibujarRefEstado().update({
    turno: dibujarEstado.turno + 1,
    palabra: elegido.palabra,
    categoria: elegido.categoria,
    trazos: [],
    adivinada: false,
    ganador: null,
  });
}

function dibujarTerminarJuego(){
  if(!dibujarEsDirector()) return;
  db.ref(`salas/${codigoViaje}/dibujar`).remove();
}

// Solo el que está dibujando puede borrar, y solo mientras nadie adivinó
// todavía — así puede arrancar de nuevo si se equivocó o si no le entienden,
// sin depender de una goma pixel por pixel (con la pantalla chica del
// celular, borrar todo y volver a intentar es mucho más práctico).
function dibujarBorrarTodo(){
  if(!dibujarEstado || dibujarEstado.fase !== 'jugando' || dibujarEstado.adivinada) return;
  if(String(miAsiento) !== String(dibujarAsientoDelTurno())) return;
  dibujarRefEstado().update({ trazos: [] });
}

function dibujarElegirColor(valor){
  dibujarColorActual = valor;
  renderDibujar();
}

function dibujarNormalizar(s){
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function dibujarAdivinar(){
  const input = document.getElementById('dibujar-adivinanza-input');
  const texto = input ? input.value.trim() : '';
  if(!texto || !miAsiento) return;
  if(!dibujarEstado || dibujarEstado.fase !== 'jugando' || dibujarEstado.adivinada) return;
  if(String(miAsiento) === String(dibujarAsientoDelTurno())) return; // el que dibuja no adivina
  const correcto = dibujarNormalizar(texto) === dibujarNormalizar(dibujarEstado.palabra);
  dibujarRefIntentos().push({ asiento: String(miAsiento), nombre: miNombre, texto, correcto });
  if(correcto){
    dibujarRefEstado().update({ adivinada: true, ganador: String(miAsiento) });
  }
  if(input) input.value = '';
}

// Cada celular se premia a sí mismo (mismo criterio que el resto de los
// juegos). La clave ronda-turno evita acreditar dos veces la misma manito.
function dibujarPremiarSiCorresponde(){
  if(!miAsiento || !dibujarEstado || !dibujarEstado.adivinada) return;
  const clave = `${dibujarEstado.ronda}-${dibujarEstado.turno}`;
  if(dibujarRondaPremiada === clave) return;
  const soyGanador = String(miAsiento) === String(dibujarEstado.ganador);
  const soyDibujante = String(miAsiento) === String(dibujarAsientoDelTurno());
  if(!soyGanador && !soyDibujante) return;
  dibujarRondaPremiada = clave;
  if(soyGanador){
    ganarMonedas(15);
    mostrarToast('¡Lo adivinaste! +15 monedas', 'gain');
  } else if(soyDibujante){
    ganarMonedas(10);
    mostrarToast('¡Te lo adivinaron! +10 monedas', 'gain');
  }
}

function dibujarListaAnotadosHTML(){
  const asientos = dibujarOrdenAsientos(dibujarAnotados);
  if(!asientos.length) return '<p style="color:var(--gray);font-size:13px;">Todavía no se anotó nadie.</p>';
  return `<div class="bingo-roster">${asientos.map(a => `
    <div class="bingo-roster-item"><span>Asiento ${a} — ${dibujarAnotados[a]}</span></div>`).join('')}</div>`;
}

function dibujarCoordsDesdeEvento(e){
  const rect = dibujarCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width * dibujarCanvas.width;
  const y = (e.clientY - rect.top) / rect.height * dibujarCanvas.height;
  return { x, y };
}

function dibujarActivarDibujo(){
  const terminarTrazo = () => {
    if(!dibujarDibujando) return;
    dibujarDibujando = false;
    if(dibujarTrazoActual && dibujarTrazoActual.puntos.length > 1){
      const trazos = (dibujarEstado.trazos || []).concat([dibujarTrazoActual]);
      dibujarRefEstado().update({ trazos });
    }
    dibujarTrazoActual = null;
  };
  dibujarCanvas.addEventListener('pointerdown', e => {
    const { x, y } = dibujarCoordsDesdeEvento(e);
    dibujarDibujando = true;
    dibujarTrazoActual = { color: dibujarColorActual, puntos: [{ x, y }] };
    dibujarCtx.strokeStyle = dibujarColorActual;
    dibujarCtx.beginPath();
    dibujarCtx.moveTo(x, y);
  });
  dibujarCanvas.addEventListener('pointermove', e => {
    if(!dibujarDibujando) return;
    const { x, y } = dibujarCoordsDesdeEvento(e);
    dibujarTrazoActual.puntos.push({ x, y });
    dibujarCtx.lineTo(x, y);
    dibujarCtx.stroke();
  });
  dibujarCanvas.addEventListener('pointerup', terminarTrazo);
  dibujarCanvas.addEventListener('pointerleave', terminarTrazo);
}

function dibujarRedibujarTodo(){
  if(!dibujarCtx) return;
  dibujarCtx.clearRect(0, 0, dibujarCanvas.width, dibujarCanvas.height);
  dibujarCtx.lineWidth = 5;
  dibujarCtx.lineCap = 'round';
  dibujarCtx.lineJoin = 'round';
  (dibujarEstado.trazos || []).forEach(trazo => {
    const puntos = trazo && trazo.puntos;
    if(!puntos || puntos.length < 2) return;
    dibujarCtx.strokeStyle = trazo.color || '#1A1A1A';
    dibujarCtx.beginPath();
    dibujarCtx.moveTo(puntos[0].x, puntos[0].y);
    puntos.slice(1).forEach(p => dibujarCtx.lineTo(p.x, p.y));
    dibujarCtx.stroke();
  });
}

function renderDibujar(){
  const cont = document.getElementById('dibujar-content');
  if(!cont || !dibujarEstado) return;

  // Este render se dispara con cada trazo nuevo de quien dibuja y con cada
  // intento de CUALQUIER jugador (no solo el tuyo) -- sin guardar esto, cada
  // vez que otro escribía algo, reconstruir el HTML entero te borraba lo que
  // vos estabas tipeando en tu propio campo de adivinanza.
  const inputPrevio = document.getElementById('dibujar-adivinanza-input');
  const valorPrevio = inputPrevio ? inputPrevio.value : '';
  const teniaFoco = !!inputPrevio && inputPrevio === document.activeElement;
  const cursorPrevio = inputPrevio ? inputPrevio.selectionStart : null;

  document.getElementById('dibujar-sub').textContent =
    dibujarEstado.fase === 'lobby' ? 'Para grupos chicos, no todo el micro' : 'Turno en curso';

  if(dibujarEstado.fase === 'lobby'){
    const anotado = miAsiento && dibujarAnotados[String(miAsiento)] != null;
    const soyDirector = dibujarEsDirector();
    const asientos = dibujarOrdenAsientos(dibujarAnotados);
    let controlHTML = '';
    if(soyDirector){
      controlHTML = `<button class="btn-primary" onclick="dibujarEmpezarRonda()" ${asientos.length >= DIBUJAR_MIN_JUGADORES ? '' : 'disabled'}>Empezar (${asientos.length}/${DIBUJAR_MIN_JUGADORES})</button>`;
    } else if(anotado){
      controlHTML = `<p class="tienda-nota">Sos parte del grupo. El organizador del viaje arranca cuando quiera.</p>`;
    }
    cont.innerHTML = `
      ${soyDirector ? '' : bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>🎨 Dibujar y Adivinar</h2>
        <p>Se juega con el grupo con el que viajás (mínimo ${DIBUJAR_MIN_JUGADORES}). Por turnos, uno dibuja con el dedo una palabra secreta y el resto adivina escribiendo.</p>
      </div>
      ${anotado
        ? `<button class="btn-ghost" style="width:100%;" onclick="dibujarSalirDelGrupo()">Salir del grupo</button>`
        : `<button class="btn-primary" onclick="dibujarAnotarme()">Anotarme a este grupo</button>`}
      ${dibujarListaAnotadosHTML()}
      ${controlHTML}`;
    dibujarCanvas = null;
    dibujarCtx = null;
    return;
  }

  // fase 'jugando'
  const asientoTurno = dibujarAsientoDelTurno();
  const soyDibujante = String(miAsiento) === String(asientoTurno);
  const nombreDibujante = dibujarAnotados[asientoTurno] || `Asiento ${asientoTurno}`;
  const intentosHTML = Object.values(dibujarIntentos || {}).slice(-6).reverse().map(i => `
    <div class="dibujar-intento ${i.correcto ? 'dibujar-intento-correcto' : ''}">${i.correcto ? '✅' : '💬'} ${i.nombre}: ${i.correcto ? '¡' + i.texto + '!' : i.texto}</div>
  `).join('') || '<p style="color:var(--gray);font-size:12px;">Nadie escribió todavía.</p>';

  const encabezado = soyDibujante
    ? `<div class="hero" style="margin-top:8px;"><h2>Te toca dibujar</h2><p>Categoría: ${dibujarEstado.categoria}. Tu palabra: <strong>${dibujarEstado.palabra}</strong></p></div>`
    : `<div class="hero" style="margin-top:8px;"><h2>${nombreDibujante} está dibujando</h2><p>Categoría: ${dibujarEstado.categoria}. Escribí qué creés que es.</p></div>`;

  let controlesHTML = '';
  if(dibujarEstado.adivinada){
    const nombreGanador = dibujarAnotados[dibujarEstado.ganador] || `Asiento ${dibujarEstado.ganador}`;
    controlesHTML = `
      <div class="hero" style="margin-top:8px;"><h2>✅ ¡${nombreGanador} adivinó!</h2><p>Era: <strong>${dibujarEstado.palabra}</strong></p></div>
      ${dibujarEsDirector() ? `<button class="btn-primary" onclick="dibujarSiguienteTurno()">Siguiente turno</button>` : `<p class="tienda-nota">Esperá a que el organizador pase al siguiente turno.</p>`}
      <p class="link-chico" onclick="dibujarTerminarJuego()">Terminar el juego</p>`;
  } else if(!soyDibujante){
    controlesHTML = `
      <input type="text" id="dibujar-adivinanza-input" class="bingo-input-numero" style="width:100%;" placeholder="¿Qué es?" maxlength="40" onkeydown="if(event.key==='Enter') dibujarAdivinar()">
      <button class="btn-primary" onclick="dibujarAdivinar()">Adivinar</button>`;
  } else if(dibujarEsDirector()){
    controlesHTML = `<p class="link-chico" onclick="dibujarSiguienteTurno()">Nadie adivinó, pasar de turno</p>`;
  }

  const herramientasHTML = (soyDibujante && !dibujarEstado.adivinada) ? `
    <div class="dibujar-herramientas">
      <div class="dibujar-colores">
        ${DIBUJAR_COLORES.map(c => `
          <button class="dibujar-color-swatch ${dibujarColorActual === c.valor ? 'dibujar-color-swatch-selected' : ''}" style="background:${c.valor};" onclick="dibujarElegirColor('${c.valor}')" title="${c.nombre}" aria-label="${c.nombre}"></button>
        `).join('')}
      </div>
      <button class="btn-ghost dibujar-btn-borrar" onclick="dibujarBorrarTodo()">🗑️ Borrar todo</button>
    </div>` : '';

  cont.innerHTML = `
    ${encabezado}
    <canvas id="dibujar-canvas" class="dibujar-canvas" width="300" height="300"></canvas>
    ${herramientasHTML}
    <div class="dibujar-intentos">${intentosHTML}</div>
    ${controlesHTML}`;

  dibujarCanvas = document.getElementById('dibujar-canvas');
  dibujarCtx = dibujarCanvas.getContext('2d');
  dibujarRedibujarTodo();
  if(soyDibujante && !dibujarEstado.adivinada) dibujarActivarDibujo();

  const inputNuevo = document.getElementById('dibujar-adivinanza-input');
  if(inputNuevo && valorPrevio){
    inputNuevo.value = valorPrevio;
    if(teniaFoco){
      inputNuevo.focus();
      if(cursorPrevio != null) inputNuevo.setSelectionRange(cursorPrevio, cursorPrevio);
    }
  }
}
