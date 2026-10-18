// Cadáver Exquisito: cada anotado responde una sola pregunta de la historia
// sin ver las respuestas de los demás — recién al final se arma todo junto,
// y por eso suele salir una historia disparatada. Mismo patrón que El
// Impostor: se juega en un grupo chico (no todo el micro), y el director es
// el organizador del viaje (mismo PIN que Bingo).

const CUENTO_MIN_JUGADORES = 2;

const CUENTO_PLANTILLAS = [
  { nombre: 'Un encuentro', preguntas: ['¿Quién? (un personaje, real o inventado)', '¿Dónde estaba?', '¿Qué estaba haciendo?', '¿A quién se encontró?', '¿Qué le dijo?', '¿Qué le contestó?', '¿Cómo terminó todo?'],
    historia: r => `${r[0]} estaba en ${r[1]}, ${r[2]}. De repente se encontró con ${r[3]}. Le dijo: "${r[4]}". Y ${r[3]} le contestó: "${r[5]}". Al final, ${r[6]}.` },
  { nombre: 'Viaje en micro', preguntas: ['¿Quién viajaba en el micro?', '¿A dónde iba?', '¿Qué llevaba en la valija?', '¿Quién se subió en una parada?', '¿Qué anunció el chofer por el micrófono?', '¿Qué pasó en el camino?', '¿Cómo terminó el viaje?'],
    historia: r => `${r[0]} viajaba en el micro rumbo a ${r[1]}, con ${r[2]} en la valija. En una parada se subió ${r[3]}. El chofer anunció: "${r[4]}". En el camino, ${r[5]}. Al final, ${r[6]}.` },
  { nombre: 'Noticia de último momento', preguntas: ['¿Quién es el protagonista de la noticia?', '¿Qué hizo?', '¿Dónde pasó?', '¿Cuándo pasó?', '¿Por qué lo hizo?', '¿Qué dijo un testigo?', '¿Cómo terminó todo?'],
    historia: r => `ÚLTIMO MOMENTO: ${r[0]} ${r[1]} en ${r[2]}, ${r[3]}. Según contó, lo hizo porque ${r[4]}. Un testigo declaró: "${r[5]}". Finalmente, ${r[6]}.` },
  { nombre: 'Aventura fantástica', preguntas: ['¿Qué héroe o criatura? (inventalo)', '¿Qué poder especial tenía?', '¿Cuál era su misión?', '¿Quién lo ayudó?', '¿Qué obstáculo apareció?', '¿Qué descubrió al final?', '¿Cómo lo festejaron?'],
    historia: r => `Había una vez ${r[0]} con el poder de ${r[1]}. Su misión era ${r[2]}. Lo ayudó ${r[3]}, pero apareció ${r[4]}. Al final descubrió ${r[5]}. Y lo festejaron así: ${r[6]}.` },
  { nombre: 'Receta imposible', preguntas: ['¿Cómo se llama el plato?', '¿Cuál es el ingrediente principal?', '¿Qué ingrediente raro lleva?', '¿Cuánto tiempo se cocina?', '¿Qué pasó cuando lo probaron?', '¿Quién lo comió primero?', '¿Qué dijo esa persona?'],
    historia: r => `Hoy cocinamos ${r[0]}. Lleva ${r[1]} y también ${r[2]}. Se cocina ${r[3]}. Cuando lo probaron, ${r[4]}. El primero en comerlo fue ${r[5]}, que dijo: "${r[6]}".` },
  { nombre: 'Película de cine', preguntas: ['¿Cómo se llama la película?', '¿Quién es el protagonista?', '¿Quién es el villano?', '¿Dónde transcurre?', '¿Cuál es la gran escena de acción?', '¿Cuál es el giro sorpresa?', '¿Cómo es el final?'],
    historia: r => `En "${r[0]}", ${r[1]} se enfrenta a ${r[2]} en ${r[3]}. La gran escena de acción: ${r[4]}. Pero, sorpresa: ${r[5]}. Y el final: ${r[6]}.` },
  { nombre: 'Postal de vacaciones', preguntas: ['¿Desde qué lugar escribís?', '¿Con quién fuiste?', '¿Qué fue lo mejor?', '¿Qué fue lo peor?', '¿Qué comiste?', '¿Qué se rompió o se perdió?', '¿Cómo te despedís?'],
    historia: r => `Querida familia: les escribo desde ${r[0]}. Vine con ${r[1]}. Lo mejor fue ${r[2]} y lo peor, ${r[3]}. Comimos ${r[4]}. Lástima que ${r[5]}. ${r[6]}.` },
  { nombre: 'Gran misterio', preguntas: ['¿Qué desapareció misteriosamente?', '¿Dónde se vio por última vez?', '¿Quién es el principal sospechoso?', '¿Qué pista apareció?', '¿Qué dijo el sospechoso al ser interrogado?', '¿Quién resolvió el caso?', '¿Dónde estaba en realidad?'],
    historia: r => `¡Gran misterio! Desapareció ${r[0]}. Se vio por última vez en ${r[1]}. El principal sospechoso: ${r[2]}. La pista: ${r[3]}. Al ser interrogado, dijo: "${r[4]}". El caso lo resolvió ${r[5]} y resultó que estaba ${r[6]}.` },
];

// Plantilla de la historia en curso (la elige el director al empezar y queda guardada en el estado).
function cuentoPlantilla(){
  const i = cuentoEstado && typeof cuentoEstado.plantilla === 'number' ? cuentoEstado.plantilla : 0;
  return CUENTO_PLANTILLAS[i] || CUENTO_PLANTILLAS[0];
}
const cuentoPreguntas = () => cuentoPlantilla().preguntas;


let cuentoEstado = null;
let cuentoAnotados = {};
let cuentoRondaPremiada = null;

function cuentoEstadoVacio(){
  return { fase: 'lobby', jugadores: [], turno: 0, respuestas: [], ronda: 0 };
}

function cuentoRefEstado(){ return db.ref(`salas/${codigoViaje}/cuento/estado`); }
function cuentoRefAnotados(){ return db.ref(`salas/${codigoViaje}/cuento/anotados`); }

let cuentoListenersListos = false;

function iniciarCuento(){
  if(!cuentoListenersListos){
    cuentoListenersListos = true;
    cuentoRefEstado().on('value', snap => {
      const anterior = cuentoEstado;
      cuentoEstado = Object.assign(cuentoEstadoVacio(), snap.val() || {});
      if(anterior && anterior.ronda !== cuentoEstado.ronda) cuentoRondaPremiada = null;
      if(cuentoEstado.fase === 'revelado') cuentoPremiarSiCorresponde();
      renderCuento();
    });
    cuentoRefAnotados().on('value', snap => {
      cuentoAnotados = snap.val() || {};
      if(cuentoEstado && cuentoEstado.fase === 'lobby') renderCuento();
    });
  } else {
    renderCuento();
  }
}

function cuentoOrdenAsientos(mapa){
  return Object.keys(mapa).sort((a, b) => Number(a) - Number(b));
}

function cuentoEsDirector(){
  return bingoEsOrganizador();
}

function cuentoAnotarme(){
  if(!miAsiento) return;
  grupoAnotarse(cuentoRefAnotados(), String(miAsiento), miNombre);
}

function cuentoSalirDelGrupo(){
  if(!miAsiento) return;
  cuentoRefAnotados().child(String(miAsiento)).remove();
}

function cuentoEmpezar(){
  if(!cuentoEsDirector()) return;
  const jugadores = cuentoOrdenAsientos(cuentoAnotados);
  if(jugadores.length < CUENTO_MIN_JUGADORES) return;
  const nuevaRonda = (cuentoEstado ? cuentoEstado.ronda : 0) + 1;
  const previos = cuentoEstado && cuentoEstado.jugadores && cuentoEstado.jugadores.length ? cuentoEstado.jugadores : [];
  const ultimo = previos.length ? previos[(Math.max(1, cuentoEstado.turno) - 1) % previos.length] : null; // quien respondió último en la historia anterior
  const orden = azarBarajar(jugadores.map(String));
  if(ultimo != null && orden.length > 1 && orden[0] === String(ultimo)){ const j = 1 + Math.floor(Math.random() * (orden.length - 1)); const t = orden[0]; orden[0] = orden[j]; orden[j] = t; }
  cuentoRefEstado().set({
    fase: 'jugando',
    jugadores: orden,
    turno: 0,
    respuestas: [],
    plantilla: azarSiguiente('cuento', CUENTO_PLANTILLAS.length, 2),
    ronda: nuevaRonda,
  });
}

function cuentoAsientoDelTurno(){
  if(!cuentoEstado || !cuentoEstado.jugadores.length) return null;
  return cuentoEstado.jugadores[cuentoEstado.turno % cuentoEstado.jugadores.length];
}

function cuentoEnviarRespuesta(){
  const input = document.getElementById('cuento-respuesta-input');
  const texto = input ? input.value.trim() : '';
  if(!texto) return;
  if(!cuentoEstado || cuentoEstado.fase !== 'jugando') return;
  if(String(miAsiento) !== String(cuentoAsientoDelTurno())) return;
  const respuestas = (cuentoEstado.respuestas || []).concat(texto);
  const siguienteTurno = cuentoEstado.turno + 1;
  const terminado = siguienteTurno >= cuentoPreguntas().length;
  cuentoRefEstado().update({
    respuestas,
    turno: siguienteTurno,
    fase: terminado ? 'revelado' : 'jugando',
  });
}

// Cada celular se premia a sí mismo (mismo criterio que Bingo/Impostor), así
// las monedas van a quien corresponde sin depender de un solo dispositivo.
function cuentoPremiarSiCorresponde(){
  if(!miAsiento || !cuentoEstado || cuentoEstado.fase !== 'revelado') return;
  if(cuentoRondaPremiada === cuentoEstado.ronda) return;
  if(!cuentoEstado.jugadores.includes(String(miAsiento))) return;
  cuentoRondaPremiada = cuentoEstado.ronda;
  ganarMonedas(10);
  mostrarToast('¡Cuento terminado! +10 monedas', 'gain');
}

function cuentoNuevoCuento(){
  if(!cuentoEsDirector() || !cuentoEstado) return;
  cuentoRefEstado().set(cuentoEstadoVacio());
}

function cuentoTerminarJuego(){
  if(!cuentoEsDirector()) return;
  db.ref(`salas/${codigoViaje}/cuento`).remove();
}

function cuentoArmarHistoria(){
  return cuentoPlantilla().historia(cuentoEstado.respuestas);
}

function cuentoListaAnotadosHTML(){
  const asientos = cuentoOrdenAsientos(cuentoAnotados);
  if(!asientos.length) return '<p class="cu-nota">Todavía no se anotó nadie.</p>';
  return `<div class="bingo-roster">${asientos.map(a => `
    <div class="bingo-roster-item"><span>Asiento ${a} — ${cuentoAnotados[a]}</span></div>`).join('')}</div>`;
}

function renderCuento(){
  const cont = document.getElementById('cuento-content');
  if(!cont || !cuentoEstado) return;
  document.getElementById('cuento-sub').textContent =
    cuentoEstado.fase === 'lobby' ? 'Para grupos chicos, no todo el micro' :
    cuentoEstado.fase === 'jugando' ? `${cuentoPlantilla().nombre}: línea ${cuentoEstado.turno + 1} de ${cuentoPreguntas().length}` : 'La historia';

  if(cuentoEstado.fase === 'lobby'){
    const anotado = miAsiento && cuentoAnotados[String(miAsiento)] != null;
    const soyDirector = cuentoEsDirector();
    const asientos = cuentoOrdenAsientos(cuentoAnotados);
    let controlHTML = '';
    if(soyDirector){
      controlHTML = `<div class="g-acciones"><button class="gbtn gbtn-ancho" style="font-size:15px;" onclick="cuentoEmpezar()" ${asientos.length >= CUENTO_MIN_JUGADORES ? '' : 'disabled'}>Empezar el cuento (${asientos.length}/${CUENTO_MIN_JUGADORES})</button></div>`;
    } else if(anotado){
      controlHTML = `<p class="cu-nota">Sos parte del grupo. El organizador del viaje arranca cuando quiera.</p>`;
    }
    cont.innerHTML = gEscenaHTML('libro', `
      <div class="cu-portada">📖</div>
      ${gDialogoHTML('Cadáver Exquisito', `Se juega con el grupo con el que viajás (de ${CUENTO_MIN_JUGADORES} a ${JUEGO_GRUPO_MAX} jugadores). Cada uno responde una sola pregunta sin ver las demás. Al final se arma toda la historia junta, y suele salir así de rara.`)}
      <div class="g-acciones">${anotado
        ? `<button class="gbtn gbtn-no gbtn-ancho" onclick="cuentoSalirDelGrupo()">Salir del grupo</button>`
        : grupoBotonAnotarmeHTML('cuentoAnotarme', asientos.length)}</div>
      ${cuentoListaAnotadosHTML()}
      ${controlHTML}
      ${soyDirector ? '' : bingoPinHTML()}`);
    return;
  }

  if(cuentoEstado.fase === 'jugando'){
    const asientoTurno = cuentoAsientoDelTurno();
    const soyDelTurno = String(miAsiento) === String(asientoTurno);
    const nombreDelTurno = cuentoAnotados[asientoTurno] || `Asiento ${asientoTurno}`;
    const pregunta = cuentoPreguntas()[cuentoEstado.turno];
    const progreso = `<div class="g-hud"><span class="g-pill">✍️ ${cuentoEstado.turno + 1}/${cuentoPreguntas().length}</span></div>`;
    if(soyDelTurno){
      cont.innerHTML = gEscenaHTML('libro', `
        ${progreso}
        <div class="cu-hoja">
          <div class="cu-hoja-sup">Te toca a vos</div>
          <div class="cu-pregunta">${pregunta}</div>
          <input type="text" id="cuento-respuesta-input" class="cu-input" placeholder="Escribí tu respuesta..." maxlength="80" onkeydown="if(event.key==='Enter') cuentoEnviarRespuesta()">
        </div>
        <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="cuentoEnviarRespuesta()">Enviar</button></div>`);
    } else {
      cont.innerHTML = gEscenaHTML('libro', `
        ${progreso}
        <div class="cu-portada">✍️</div>
        ${gDialogoHTML('Escribiendo...', `Le toca a ${nombreDelTurno}. Nadie ve las respuestas de los demás hasta el final.`)}`);
    }
    return;
  }

  // fase 'revelado'
  cont.innerHTML = gEscenaHTML('libro', `
    <div class="cu-portada">📖</div>
    <div class="cu-hoja cu-hoja-historia">
      <div class="cu-hoja-sup">${cuentoPlantilla().nombre}: la historia quedó así...</div>
      <p class="cu-historia">${cuentoArmarHistoria()}</p>
    </div>
    ${cuentoEsDirector()
      ? `<div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="cuentoNuevoCuento()">Nuevo cuento</button></div>
         <div class="g-pie"><span onclick="cuentoTerminarJuego()">Terminar el juego</span></div>`
      : `<p class="cu-nota">El organizador del viaje decide si arman otro cuento.</p>`}`);
}
