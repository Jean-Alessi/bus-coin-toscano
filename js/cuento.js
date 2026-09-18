// Cadáver Exquisito: cada anotado responde una sola pregunta de la historia
// sin ver las respuestas de los demás — recién al final se arma todo junto,
// y por eso suele salir una historia disparatada. Mismo patrón que El
// Impostor: se juega en un grupo chico (no todo el micro), y el director es
// el organizador del viaje (mismo PIN que Bingo).

const CUENTO_MIN_JUGADORES = 2;

const CUENTO_PREGUNTAS = [
  '¿Quién? (un personaje, real o inventado)',
  '¿Dónde estaba?',
  '¿Qué estaba haciendo?',
  '¿A quién se encontró?',
  '¿Qué le dijo?',
  '¿Qué le contestó?',
  '¿Cómo terminó todo?',
];

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
  cuentoRefAnotados().child(String(miAsiento)).set(miNombre);
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
  cuentoRefEstado().set({
    fase: 'jugando',
    jugadores: barajar(jugadores.slice()),
    turno: 0,
    respuestas: [],
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
  const terminado = siguienteTurno >= CUENTO_PREGUNTAS.length;
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
  const r = cuentoEstado.respuestas;
  return `${r[0]} estaba en ${r[1]}, ${r[2]}. De repente se encontró con ${r[3]}. Le dijo: "${r[4]}". Y ${r[3]} le contestó: "${r[5]}". Al final, ${r[6]}.`;
}

function cuentoListaAnotadosHTML(){
  const asientos = cuentoOrdenAsientos(cuentoAnotados);
  if(!asientos.length) return '<p style="color:var(--gray);font-size:13px;">Todavía no se anotó nadie.</p>';
  return `<div class="bingo-roster">${asientos.map(a => `
    <div class="bingo-roster-item"><span>Asiento ${a} — ${cuentoAnotados[a]}</span></div>`).join('')}</div>`;
}

function renderCuento(){
  const cont = document.getElementById('cuento-content');
  if(!cont || !cuentoEstado) return;
  document.getElementById('cuento-sub').textContent =
    cuentoEstado.fase === 'lobby' ? 'Para grupos chicos, no todo el micro' :
    cuentoEstado.fase === 'jugando' ? `Línea ${cuentoEstado.turno + 1} de ${CUENTO_PREGUNTAS.length}` : 'La historia';

  if(cuentoEstado.fase === 'lobby'){
    const anotado = miAsiento && cuentoAnotados[String(miAsiento)] != null;
    const soyDirector = cuentoEsDirector();
    const asientos = cuentoOrdenAsientos(cuentoAnotados);
    let controlHTML = '';
    if(soyDirector){
      controlHTML = `<button class="btn-primary" onclick="cuentoEmpezar()" ${asientos.length >= CUENTO_MIN_JUGADORES ? '' : 'disabled'}>Empezar el cuento (${asientos.length}/${CUENTO_MIN_JUGADORES})</button>`;
    } else if(anotado){
      controlHTML = `<p class="tienda-nota">Sos parte del grupo. El organizador del viaje arranca cuando quiera.</p>`;
    }
    cont.innerHTML = `
      ${soyDirector ? '' : bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>📖 Cadáver Exquisito</h2>
        <p>Se juega con el grupo con el que viajás (mínimo ${CUENTO_MIN_JUGADORES}). Cada uno responde una sola pregunta sin ver las demás — al final se arma toda la historia junta, y suele salir así de rara.</p>
      </div>
      ${anotado
        ? `<button class="btn-ghost" style="width:100%;" onclick="cuentoSalirDelGrupo()">Salir del grupo</button>`
        : `<button class="btn-primary" onclick="cuentoAnotarme()">Anotarme a este grupo</button>`}
      ${cuentoListaAnotadosHTML()}
      ${controlHTML}`;
    return;
  }

  if(cuentoEstado.fase === 'jugando'){
    const asientoTurno = cuentoAsientoDelTurno();
    const soyDelTurno = String(miAsiento) === String(asientoTurno);
    const nombreDelTurno = cuentoAnotados[asientoTurno] || `Asiento ${asientoTurno}`;
    const pregunta = CUENTO_PREGUNTAS[cuentoEstado.turno];
    if(soyDelTurno){
      cont.innerHTML = `
        <div class="hero" style="margin-top:8px;">
          <h2>Te toca a vos</h2>
          <p>${pregunta}</p>
        </div>
        <input type="text" id="cuento-respuesta-input" class="bingo-input-numero" style="width:100%;" placeholder="Tu respuesta" maxlength="80" onkeydown="if(event.key==='Enter') cuentoEnviarRespuesta()">
        <button class="btn-primary" onclick="cuentoEnviarRespuesta()">Enviar</button>`;
    } else {
      cont.innerHTML = `
        <div class="hero" style="margin-top:8px;">
          <h2>✍️ Escribiendo...</h2>
          <p>Le toca a ${nombreDelTurno}. Nadie ve las respuestas de los demás hasta el final.</p>
        </div>`;
    }
    return;
  }

  // fase 'revelado'
  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>📖 La historia quedó así...</h2>
      <p>${cuentoArmarHistoria()}</p>
    </div>
    ${cuentoEsDirector()
      ? `<button class="btn-primary" onclick="cuentoNuevoCuento()">Nuevo cuento</button>
         <p class="link-chico" onclick="cuentoTerminarJuego()">Terminar el juego</p>`
      : `<p class="tienda-nota" style="margin-top:14px;">El organizador del viaje decide si arman otro cuento.</p>`}`;
}
