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
  return `<svg viewBox="0 0 24 24" width="130" height="130" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${visibles.join('')}</svg>`;
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

  const slots = palabra.split('').map(l => {
    const visible = ahorcadoLetrasAdivinadas.has(l) || ahorcadoFase !== 'jugando';
    const perdida = visible && ahorcadoFase === 'perdido' && !ahorcadoLetrasAdivinadas.has(l);
    return `<span class="ah-slot${perdida ? ' ah-slot-perdida' : ''}">${visible ? l : ''}</span>`;
  }).join('');

  const letras = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  const tecladoHTML = letras.map(l => {
    const usada = ahorcadoLetrasAdivinadas.has(l);
    let clase = 'ah-tecla';
    if(usada) clase += palabra.includes(l) ? ' ah-tecla-ok' : ' ah-tecla-mal';
    const deshabilitada = usada || ahorcadoFase !== 'jugando';
    return `<button class="${clase}" ${deshabilitada ? 'disabled' : ''} onclick="adivinarLetraAhorcado('${l}')">${l}</button>`;
  }).join('');

  const vidas = '❤️'.repeat(AHORCADO_ERRORES_MAX - ahorcadoErrores) + '🖤'.repeat(ahorcadoErrores);

  let abajoHTML = '';
  if(ahorcadoFase === 'ganado'){
    abajoHTML = `
      ${gDialogoHTML('🎉 ¡Bien!', 'La adivinaste: +2 monedas')}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="siguienteAhorcado()">Siguiente palabra</button></div>`;
  } else if(ahorcadoFase === 'perdido'){
    abajoHTML = `
      ${gDialogoHTML('Se acabaron los intentos', `Era <b>${palabra}</b>`)}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="siguienteAhorcado()">Siguiente palabra</button></div>`;
  }

  cont.innerHTML = gEscenaHTML('pizarra', `
    <div class="g-hud"><span class="g-pill">📝 ${ahorcadoIndex + 1}/${ahorcadoOrden.length}</span><span class="g-pill">🪙 <span class="js-monedas">${monedasCoin}</span></span></div>
    <div class="ah-tablero">
      <div class="ah-dibujo">${ahorcadoDibujo(ahorcadoErrores)}</div>
      <div class="ah-vidas">${vidas}</div>
      <div class="ah-palabra">${slots}</div>
    </div>
    ${abajoHTML}
    <div class="ah-teclado">${tecladoHTML}</div>`);
}

function renderResultadoAhorcado(){
  document.getElementById('ahorcado-sub').textContent = 'Ahorcado';
  document.getElementById('ahorcado-content').innerHTML = gEscenaHTML('pizarra', `
    ${gDialogoHTML('🏁 ¡Terminaste la ronda!', '¿Jugamos otra tanda de palabras?')}
    <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="iniciarAhorcado()">Jugar de nuevo</button></div>`);
}
