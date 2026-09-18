// Ahorcado clásico: adivinan una palabra letra por letra desde un teclado
// en pantalla. 6 errores permitidos antes de perder la palabra. Acertarla
// completa vale 10 monedas; un error no resta nada, solo achica el margen.

const AHORCADO_PALABRAS = [
  'COLECTIVO', 'VENTANILLA', 'VALIJA', 'ASIENTO', 'CHOFER', 'RUTA', 'PEAJE',
  'MOCHILA', 'PASAJERO', 'EQUIPAJE', 'DESTINO', 'VIAJE', 'BOLETO', 'PARADA',
  'AUTOPISTA', 'PAISAJE', 'MONTAÑA', 'CUMPLEAÑOS', 'AMISTAD', 'VACACIONES',
  'AVENTURA', 'RECUERDO', 'FOTOGRAFIA', 'CANCION', 'GUITARRA', 'BINGO',
  'TRIVIA', 'SORPRESA', 'MONEDAS', 'PREMIO', 'GASEOSA', 'ALMOHADA', 'MANTA',
  'AURICULARES', 'CELULAR', 'CARGADOR', 'MAPA', 'BRUJULA', 'LINTERNA',
  'TERMO', 'MATE', 'GUIA', 'EXCURSION', 'HOSPEDAJE', 'RESERVA', 'ITINERARIO',
  'ANECDOTA', 'KILOMETRO', 'ESTACION', 'SIESTA',
];

const AHORCADO_PALABRAS_POR_SESION = 50;
const AHORCADO_ERRORES_MAX = 6;

let ahorcadoOrden = [];
let ahorcadoIndex = 0;
let ahorcadoLetrasAdivinadas = new Set();
let ahorcadoErrores = 0;
let ahorcadoFase = 'jugando'; // 'jugando' | 'ganado' | 'perdido'

function iniciarAhorcado(){
  ahorcadoOrden = barajar(AHORCADO_PALABRAS.map((_, i) => i)).slice(0, AHORCADO_PALABRAS_POR_SESION);
  ahorcadoIndex = 0;
  nuevaPalabraAhorcado();
}

function nuevaPalabraAhorcado(){
  ahorcadoLetrasAdivinadas = new Set();
  ahorcadoErrores = 0;
  ahorcadoFase = 'jugando';
  renderAhorcado();
}

function ahorcadoPalabraActual(){
  return AHORCADO_PALABRAS[ahorcadoOrden[ahorcadoIndex]];
}

// Dibujo clásico de la horca: se arma de a partes según los errores acumulados.
function ahorcadoDibujo(errores){
  const partes = [
    '<line x1="4" y1="21" x2="20" y2="21"/><line x1="7" y1="21" x2="7" y2="3"/><line x1="7" y1="3" x2="15" y2="3"/><line x1="15" y1="3" x2="15" y2="6"/>',
    '<circle cx="15" cy="9" r="3"/>',
    '<line x1="15" y1="12" x2="15" y2="17"/>',
    '<line x1="15" y1="14" x2="12" y2="16"/>',
    '<line x1="15" y1="14" x2="18" y2="16"/>',
    '<line x1="15" y1="17" x2="13" y2="20"/>',
    '<line x1="15" y1="17" x2="17" y2="20"/>',
  ];
  const visibles = partes.slice(0, 1 + Math.min(errores, AHORCADO_ERRORES_MAX));
  return `<svg viewBox="0 0 24 24" width="90" height="90" fill="none" stroke="#0F2A4D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${visibles.join('')}</svg>`;
}

function adivinarLetraAhorcado(letra){
  if(ahorcadoFase !== 'jugando' || ahorcadoLetrasAdivinadas.has(letra)) return;
  ahorcadoLetrasAdivinadas.add(letra);
  const palabra = ahorcadoPalabraActual();

  if(!palabra.includes(letra)){
    reproducirTono('incorrecto');
    ahorcadoErrores++;
    if(ahorcadoErrores >= AHORCADO_ERRORES_MAX){
      ahorcadoFase = 'perdido';
      reproducirTono('fin');
      mostrarToast('Se acabaron los intentos...');
    }
  } else {
    const completa = palabra.split('').every(ch => ahorcadoLetrasAdivinadas.has(ch));
    if(completa){
      reproducirTono('bonus');
      ganarMonedas(2);
      mostrarToast('+2 monedas, ¡la adivinaste!', 'gain');
      ahorcadoFase = 'ganado';
    } else {
      reproducirTono('correcto');
    }
  }
  renderAhorcado();
}

function siguienteAhorcado(){
  if(ahorcadoIndex < ahorcadoOrden.length - 1){
    ahorcadoIndex++;
    nuevaPalabraAhorcado();
  } else {
    renderResultadoAhorcado();
  }
}

function renderAhorcado(){
  const palabra = ahorcadoPalabraActual();
  document.getElementById('ahorcado-sub').textContent = `Palabra ${ahorcadoIndex + 1} de ${ahorcadoOrden.length}`;
  const cont = document.getElementById('ahorcado-content');

  const blancos = palabra.split('')
    .map(l => (ahorcadoLetrasAdivinadas.has(l) || ahorcadoFase !== 'jugando') ? l : '_')
    .join(' ');

  const letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  const tecladoHTML = letras.map(l => {
    const usada = ahorcadoLetrasAdivinadas.has(l);
    let clase = 'ahorcado-tecla';
    if(usada) clase += palabra.includes(l) ? ' ahorcado-tecla-correcta' : ' ahorcado-tecla-incorrecta';
    const deshabilitada = usada || ahorcadoFase !== 'jugando';
    return `<button class="${clase}" ${deshabilitada ? 'disabled' : ''} onclick="adivinarLetraAhorcado('${l}')">${l}</button>`;
  }).join('');

  let abajoHTML = '';
  if(ahorcadoFase === 'ganado'){
    abajoHTML = `
      <div class="acertijo-respuesta">
        <div class="section-label">¡Bien!</div>
        <p>${palabra}</p>
      </div>
      <button class="btn-primary" onclick="siguienteAhorcado()">Siguiente palabra</button>`;
  } else if(ahorcadoFase === 'perdido'){
    abajoHTML = `
      <div class="acertijo-respuesta acertijo-respuesta-neutra">
        <div class="section-label">Era</div>
        <p>${palabra}</p>
      </div>
      <button class="btn-primary" onclick="siguienteAhorcado()">Siguiente palabra</button>`;
  }

  cont.innerHTML = `
    <div class="progress-bar"><div class="progress-fill" style="width:${((ahorcadoIndex + 1) / ahorcadoOrden.length) * 100}%"></div></div>
    <div class="question-box" style="text-align:center;">
      <div class="ahorcado-dibujo">${ahorcadoDibujo(ahorcadoErrores)}</div>
      <div class="ahorcado-palabra">${blancos}</div>
      <div class="ahorcado-vidas">Errores: ${ahorcadoErrores} / ${AHORCADO_ERRORES_MAX}</div>
    </div>
    ${abajoHTML}
    <div class="ahorcado-teclado">${tecladoHTML}</div>`;
}

function renderResultadoAhorcado(){
  document.getElementById('ahorcado-sub').textContent = 'Ahorcado';
  document.getElementById('ahorcado-content').innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>¡Terminaste la ronda!</h2>
      <p>¿Jugamos otra tanda de palabras?</p>
    </div>
    <button class="btn-primary" onclick="iniciarAhorcado()">Jugar de nuevo</button>`;
}
