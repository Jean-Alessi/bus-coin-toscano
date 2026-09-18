// 4+1: se muestran 4 imágenes que remiten a una misma palabra, y hay que
// armarla tocando fichas con letras (incluye letras de más, como señuelo).
// Acertar vale 10 monedas; probar una combinación equivocada no resta nada.

const CUATROUNO_PALABRAS = [
  { palabra: 'AMOR', imagenes: ['🤗', '🏖️❤️', '💍', '👶💋'], letras: ['A', 'M', 'O', 'R', 'S', 'T', 'L', 'P', 'E', 'I', 'U', 'G'], pista: 'Sentimiento universal y profundo.' },
  { palabra: 'VIAJE', imagenes: ['🧳', '🛂🎫', '🗺️', '🛫'], letras: ['V', 'I', 'A', 'J', 'E', 'R', 'O', 'N', 'T', 'S', 'M', 'L'], pista: 'Trayecto que se hace de un lugar a otro.' },
  { palabra: 'MÚSICA', imagenes: ['🎧', '🎼', '🎸', '🎤'], letras: ['M', 'Ú', 'S', 'I', 'C', 'A', 'L', 'P', 'E', 'R', 'T', 'O'], pista: 'Arte de combinar los sonidos.' },
  { palabra: 'FRÍO', imagenes: ['🧊', '🏔️', '🧣', '🌡️'], letras: ['F', 'R', 'Í', 'O', 'S', 'C', 'A', 'L', 'N', 'T', 'M', 'U'], pista: 'Temperatura muy baja.' },
  { palabra: 'TRABAJO', imagenes: ['👷', '💻', '💼', '👥'], letras: ['T', 'R', 'A', 'B', 'A', 'J', 'O', 'N', 'S', 'L', 'E', 'M'], pista: 'Actividad realizada a cambio de un salario.' },
  { palabra: 'FUEGO', imagenes: ['🏕️', '🔥', '💥', '🚒'], letras: ['F', 'U', 'E', 'G', 'O', 'R', 'A', 'N', 'S', 'C', 'T', 'L'], pista: 'Calor y luz producidos por combustión.' },
  { palabra: 'LUZ', imagenes: ['💡', '☀️', '🌊🔦', '⚡'], letras: ['L', 'U', 'Z', 'S', 'C', 'A', 'M', 'O', 'P', 'T', 'E', 'R'], pista: 'Energía que hace visible todo lo que nos rodea.' },
  { palabra: 'COMIDA', imagenes: ['🍝', '🍔', '🍇🍎', '🍴'], letras: ['C', 'O', 'M', 'I', 'D', 'A', 'S', 'N', 'R', 'E', 'T', 'L'], pista: 'Sustancia que se ingiere para nutrirse.' },
  { palabra: 'DEPORTE', imagenes: ['⚽', '🏁', '🎾', '🏋️'], letras: ['D', 'E', 'P', 'O', 'R', 'T', 'E', 'S', 'C', 'A', 'L', 'N'], pista: 'Actividad física con fines competitivos o recreativos.' },
  { palabra: 'TIEMPO', imagenes: ['⌚', '⏳', '🌅', '📅'], letras: ['T', 'I', 'E', 'M', 'P', 'O', 'S', 'C', 'L', 'A', 'R', 'N'], pista: 'Magnitud física que mide la duración de eventos.' },
  { palabra: 'ARTE', imagenes: ['🗿', '🎨', '🪨🔨', '🏛️'], letras: ['A', 'R', 'T', 'E', 'S', 'M', 'L', 'O', 'P', 'I', 'U', 'N'], pista: 'Expresión creativa humana.' },
  { palabra: 'AGUA', imagenes: ['💧', '🌊', '🥛', '🚰'], letras: ['A', 'G', 'U', 'A', 'S', 'L', 'N', 'O', 'T', 'R', 'C', 'M'], pista: 'Líquido vital, incoloro e inodoro.' },
  { palabra: 'CIUDAD', imagenes: ['🌃', '🚦', '🗺️', '🌳'], letras: ['C', 'I', 'U', 'D', 'A', 'D', 'E', 'S', 'R', 'L', 'N', 'O'], pista: 'Asentamiento urbano densamente poblado.' },
  { palabra: 'DINERO', imagenes: ['💵', '🪙', '💳', '💰'], letras: ['D', 'I', 'N', 'E', 'R', 'O', 'S', 'C', 'L', 'A', 'M', 'P'], pista: 'Medio de intercambio de bienes y servicios.' },
  { palabra: 'NATURALEZA', imagenes: ['🌲', '🏞️', '🦋🌸', '🏔️'], letras: ['N', 'A', 'T', 'U', 'R', 'A', 'L', 'E', 'Z', 'A', 'S', 'O'], pista: 'Conjunto de todo lo que existe y no ha sido creado por el hombre.' },
  { palabra: 'JUEGO', imagenes: ['♟️', '🎲', '🛝', '🎮'], letras: ['J', 'U', 'E', 'G', 'O', 'S', 'R', 'A', 'L', 'N', 'T', 'M'], pista: 'Actividad recreativa con reglas.' },
  { palabra: 'ESCUELA', imagenes: ['🚌', '🏫', '📝', '📓'], letras: ['E', 'S', 'C', 'U', 'E', 'L', 'A', 'S', 'R', 'O', 'T', 'M'], pista: 'Institución donde se imparte enseñanza.' },
  { palabra: 'SUEÑO', imagenes: ['😴', '🌙', '💭', '⏰'], letras: ['S', 'U', 'E', 'Ñ', 'O', 'S', 'C', 'A', 'L', 'M', 'T', 'R'], pista: 'Estado de reposo o fantasías mientras dormimos.' },
  { palabra: 'PELÍCULA', imagenes: ['🎬', '🎞️', '🍿', '📽️'], letras: ['P', 'E', 'L', 'Í', 'C', 'U', 'L', 'A', 'S', 'T', 'R', 'M'], pista: 'Obra cinematográfica.' },
  { palabra: 'LIBRO', imagenes: ['📚', '📖', '📗', '📕'], letras: ['L', 'I', 'B', 'R', 'O', 'S', 'N', 'A', 'T', 'E', 'P', 'M'], pista: 'Conjunto de hojas escritas y encuadernadas.' },
];

let cuatrounoOrden = [];
let cuatrounoIndex = 0;
let cuatrounoFichas = [];
let cuatrounoConstruida = [];
let cuatrounoFase = 'jugando'; // 'jugando' | 'confirmando' | 'revelado' | 'acertado'
let cuatrounoDesafioActual = '';

function iniciarCuatrouno(){
  cuatrounoOrden = barajar(CUATROUNO_PALABRAS.map((_, i) => i));
  cuatrounoIndex = 0;
  nuevaPalabraCuatrouno();
}

function cuatrounoActual(){
  return CUATROUNO_PALABRAS[cuatrounoOrden[cuatrounoIndex]];
}

function nuevaPalabraCuatrouno(){
  const p = cuatrounoActual();
  cuatrounoFichas = barajar(p.letras).map(letra => ({ letra, usada: false }));
  cuatrounoConstruida = [];
  cuatrounoFase = 'jugando';
  renderCuatrouno();
}

function tocarFichaCuatrouno(i){
  if(cuatrounoFase !== 'jugando' || cuatrounoFichas[i].usada) return;
  cuatrounoFichas[i].usada = true;
  cuatrounoConstruida.push(i);
  renderCuatrouno();
}

function borrarUltimaCuatrouno(){
  if(cuatrounoFase !== 'jugando' || !cuatrounoConstruida.length) return;
  const i = cuatrounoConstruida.pop();
  cuatrounoFichas[i].usada = false;
  renderCuatrouno();
}

function comprobarCuatrouno(){
  const p = cuatrounoActual();
  const armada = cuatrounoConstruida.map(i => cuatrounoFichas[i].letra).join('');
  if(armada === p.palabra){
    reproducirTono('bonus');
    ganarMonedas(5);
    mostrarToast('+5 monedas, ¡la sacaron!', 'gain');
    cuatrounoFase = 'acertado';
  } else {
    reproducirTono('incorrecto');
    mostrarToast('Esa combinación no es... ¡seguí probando!');
  }
  renderCuatrouno();
}

function pedirRevelarCuatrouno(){
  cuatrounoDesafioActual = ACERTIJO_DESAFIOS[Math.floor(Math.random() * ACERTIJO_DESAFIOS.length)];
  cuatrounoFase = 'confirmando';
  renderCuatrouno();
}

function confirmarRevelarCuatrouno(){
  cuatrounoFase = 'revelado';
  renderCuatrouno();
}

function cancelarRevelarCuatrouno(){
  cuatrounoFase = 'jugando';
  renderCuatrouno();
}

function siguienteCuatrouno(){
  if(cuatrounoIndex < cuatrounoOrden.length - 1){
    cuatrounoIndex++;
    nuevaPalabraCuatrouno();
  } else {
    renderResultadoCuatrouno();
  }
}

function renderCuatrouno(){
  const p = cuatrounoActual();
  document.getElementById('cuatrouno-sub').textContent = `Palabra ${cuatrounoIndex + 1} de ${cuatrounoOrden.length}`;
  const cont = document.getElementById('cuatrouno-content');
  const armada = cuatrounoConstruida.map(i => cuatrounoFichas[i].letra).join('');

  let abajoHTML;
  if(cuatrounoFase === 'acertado'){
    abajoHTML = `
      <div class="acertijo-respuesta">
        <div class="section-label">¡Correcto!</div>
        <p>${p.palabra}</p>
      </div>
      <button class="btn-primary" onclick="siguienteCuatrouno()">Siguiente palabra</button>`;
  } else if(cuatrounoFase === 'revelado'){
    abajoHTML = `
      <div class="acertijo-respuesta acertijo-respuesta-neutra">
        <div class="section-label">Era</div>
        <p>${p.palabra}</p>
      </div>
      <button class="btn-primary" onclick="siguienteCuatrouno()">Siguiente palabra</button>`;
  } else if(cuatrounoFase === 'confirmando'){
    abajoHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>${cuatrounoDesafioActual}</h2>
      </div>
      <div class="acertijo-botones">
        <button class="btn-primary" onclick="confirmarRevelarCuatrouno()">Sí, mostrame la palabra</button>
        <button class="btn-ghost" onclick="cancelarRevelarCuatrouno()">No, seguimos pensando</button>
      </div>`;
  } else {
    const fichasHTML = cuatrounoFichas.map((f, i) =>
      `<button class="cuatrouno-ficha ${f.usada ? 'cuatrouno-ficha-usada' : ''}" ${f.usada ? 'disabled' : ''} onclick="tocarFichaCuatrouno(${i})">${f.letra}</button>`
    ).join('');
    abajoHTML = `
      <div class="cuatrouno-armada">${armada || '&nbsp;'}</div>
      <div class="cuatrouno-fichas">${fichasHTML}</div>
      <div class="cuatrouno-acciones">
        <button class="btn-ghost" onclick="borrarUltimaCuatrouno()">Borrar última</button>
        <button class="btn-primary" onclick="comprobarCuatrouno()">Comprobar</button>
      </div>
      <button class="btn-ghost" onclick="pedirRevelarCuatrouno()">No sabemos, mostrar palabra</button>`;
  }

  cont.innerHTML = `
    <div class="progress-bar"><div class="progress-fill" style="width:${((cuatrounoIndex + 1) / cuatrounoOrden.length) * 100}%"></div></div>
    <div class="cuatrouno-grid">${p.imagenes.map(im => `<div class="cuatrouno-imagen">${im}</div>`).join('')}</div>
    <p class="cuatrouno-pista">${p.pista}</p>
    ${abajoHTML}`;
}

function renderResultadoCuatrouno(){
  document.getElementById('cuatrouno-sub').textContent = '4+1';
  document.getElementById('cuatrouno-content').innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>¡Resolviste las 20 palabras!</h2>
      <p>¿Jugamos otra ronda, en otro orden?</p>
    </div>
    <button class="btn-primary" onclick="iniciarCuatrouno()">Jugar de nuevo</button>`;
}
