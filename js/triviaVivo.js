// Trivia en Vivo: a diferencia de Trivia (cada uno para sí mismo, a su
// ritmo), acá todo el micro contesta la MISMA pregunta al mismo tiempo, con
// puntos extra por rapidez — estilo Kahoot. La maneja el organizador del
// viaje (mismo PIN que Bingo), igual que Tutti Frutti: bus-wide, sin
// anotarse antes, cualquiera con asiento puede responder.
//
// El paso de una pregunta a la siguiente lo corta el organizador a mano
// (no hay avance automático por tiempo), para no depender de que todos los
// relojes de todos los celulares estén perfectamente sincronizados.

const TRIVIA_VIVO_DURACION_MS = 12000;
const TRIVIA_VIVO_CANTIDAD_PREGUNTAS = 8;

let triviaVivoEstado = null;
let triviaVivoRespuestas = {};
let triviaVivoYaRespondi = {};
let triviaVivoPremiado = {};
let triviaVivoTimerInterval = null;

function triviaVivoEstadoVacio(){
  return { fase: 'esperando', preguntas: [], indice: 0, vencePregunta: null, mostrarResultado: false, ronda: 0 };
}

function triviaVivoRefEstado(){ return db.ref(`salas/${codigoViaje}/triviaVivo/estado`); }
function triviaVivoRefRespuestas(){ return db.ref(`salas/${codigoViaje}/triviaVivo/respuestas`); }

let triviaVivoListenersListos = false;

function iniciarTriviaVivo(){
  if(!triviaVivoListenersListos){
    triviaVivoListenersListos = true;
    triviaVivoRefEstado().on('value', snap => {
      const anterior = triviaVivoEstado;
      triviaVivoEstado = Object.assign(triviaVivoEstadoVacio(), snap.val() || {});
      if(anterior && anterior.ronda !== triviaVivoEstado.ronda){
        triviaVivoYaRespondi = {};
        triviaVivoPremiado = {};
      }
      if(triviaVivoEstado.mostrarResultado) triviaVivoPremiarSiCorresponde();
      renderTriviaVivo();
    });
    triviaVivoRefRespuestas().on('value', snap => {
      triviaVivoRespuestas = snap.val() || {};
      if(triviaVivoEstado) renderTriviaVivo();
    });
  } else {
    renderTriviaVivo();
  }
}

function triviaVivoEsOrganizador(){
  return bingoEsOrganizador();
}

function triviaVivoEmpezar(temaId){
  if(!triviaVivoEsOrganizador()) return;
  const banco = temaId && TEMAS[temaId] ? TEMAS[temaId].preguntas : Object.values(TEMAS).flatMap(t => t.preguntas);
  const preguntas = barajar(banco).slice(0, TRIVIA_VIVO_CANTIDAD_PREGUNTAS).map(barajarOpciones);
  const nuevaRonda = (triviaVivoEstado ? triviaVivoEstado.ronda : 0) + 1;
  triviaVivoRefRespuestas().set(null);
  triviaVivoRefEstado().set({
    fase: 'jugando',
    preguntas,
    indice: 0,
    vencePregunta: Date.now() + TRIVIA_VIVO_DURACION_MS,
    mostrarResultado: false,
    ronda: nuevaRonda,
  });
}

function triviaVivoResponder(opcion){
  if(!triviaVivoEstado || triviaVivoEstado.fase !== 'jugando' || triviaVivoEstado.mostrarResultado) return;
  if(!miAsiento) return;
  if(triviaVivoYaRespondi[triviaVivoEstado.indice]) return;
  triviaVivoYaRespondi[triviaVivoEstado.indice] = true;
  const ms = Math.max(0, (triviaVivoEstado.vencePregunta || 0) - Date.now());
  triviaVivoRefRespuestas().child(String(triviaVivoEstado.indice)).child(String(miAsiento)).set({ opcion, ms });
  renderTriviaVivo();
}

function triviaVivoMostrarResultado(){
  if(!triviaVivoEsOrganizador() || !triviaVivoEstado) return;
  triviaVivoRefEstado().update({ mostrarResultado: true });
}

function triviaVivoSiguiente(){
  if(!triviaVivoEsOrganizador() || !triviaVivoEstado) return;
  const siguiente = triviaVivoEstado.indice + 1;
  if(siguiente >= triviaVivoEstado.preguntas.length){
    triviaVivoRefEstado().update({ fase: 'terminado' });
    return;
  }
  triviaVivoRefEstado().update({
    indice: siguiente,
    vencePregunta: Date.now() + TRIVIA_VIVO_DURACION_MS,
    mostrarResultado: false,
  });
}

// Cada celular se premia a sí mismo (mismo criterio que el resto de los
// juegos): así nunca depende de que un solo dispositivo calcule los puntos
// de todos. El bonus por rapidez usa el tiempo que quedaba cuando respondió.
function triviaVivoPremiarSiCorresponde(){
  if(!miAsiento || !triviaVivoEstado) return;
  const indice = triviaVivoEstado.indice;
  if(triviaVivoPremiado[indice]) return;
  const miRespuesta = (triviaVivoRespuestas[indice] || {})[String(miAsiento)];
  if(!miRespuesta) return;
  triviaVivoPremiado[indice] = true;
  const pregunta = triviaVivoEstado.preguntas[indice];
  if(miRespuesta.opcion === pregunta.correcta){
    const bonus = Math.round(10 * (miRespuesta.ms / TRIVIA_VIVO_DURACION_MS));
    const puntos = 10 + Math.min(10, Math.max(0, bonus));
    ganarMonedas(puntos);
    mostrarToast(`¡Correcto! +${puntos} monedas`, 'gain');
  }
}

function triviaVivoConteoRespuestas(){
  const respuestasIndice = triviaVivoRespuestas[triviaVivoEstado.indice] || {};
  return Object.keys(respuestasIndice).length;
}

function triviaVivoActualizarBarra(){
  const fill = document.getElementById('triviavivo-timer-fill');
  if(!fill || !triviaVivoEstado || !triviaVivoEstado.vencePregunta) return;
  const restante = Math.max(0, triviaVivoEstado.vencePregunta - Date.now());
  const pct = Math.max(0, Math.min(100, (restante / TRIVIA_VIVO_DURACION_MS) * 100));
  fill.style.width = pct + '%';
}

function renderTriviaVivo(){
  const cont = document.getElementById('triviavivo-content');
  if(!cont || !triviaVivoEstado) return;
  clearInterval(triviaVivoTimerInterval);

  if(triviaVivoEstado.fase === 'esperando'){
    document.getElementById('triviavivo-sub').textContent = 'Todo el micro compite junto';
    const soyOrganizador = triviaVivoEsOrganizador();
    cont.innerHTML = soyOrganizador ? `
      <div class="hero" style="margin-top:8px;">
        <h2>🧠⚡ Trivia en Vivo</h2>
        <p>Todos responden la misma pregunta al mismo tiempo. Elegí un tema (o mezclalos todos) para arrancar.</p>
      </div>
      <div class="section-label">Temas</div>
      ${Object.keys(TEMAS).map(id => `<div class="card" onclick="triviaVivoEmpezar('${id}')">
        <div class="icon">${icono(TEMAS[id].icono)}</div>
        <div class="txt"><h3>${TEMAS[id].nombre}</h3><p>${TEMAS[id].preguntas.length} preguntas</p></div>
      </div>`).join('')}
      <button class="btn-ghost" onclick="triviaVivoEmpezar(null)">🔀 Mezclar todos los temas</button>
    ` : `
      ${bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>🧠⚡ Trivia en Vivo</h2>
        <p>Esperá a que el organizador del viaje arranque la trivia.</p>
      </div>`;
    return;
  }

  if(triviaVivoEstado.fase === 'terminado'){
    document.getElementById('triviavivo-sub').textContent = 'Terminó';
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>🏁 ¡Terminó la Trivia en Vivo!</h2>
        <p>Mirá cómo quedaste en el Ranking del micro.</p>
      </div>
      ${triviaVivoEsOrganizador() ? `<button class="btn-primary" onclick="triviaVivoEmpezar(null)">Jugar de nuevo</button>` : ''}`;
    return;
  }

  // fase 'jugando'
  const indice = triviaVivoEstado.indice;
  const pregunta = triviaVivoEstado.preguntas[indice];
  document.getElementById('triviavivo-sub').textContent = `Pregunta ${indice + 1} de ${triviaVivoEstado.preguntas.length}`;
  const miRespuesta = (triviaVivoRespuestas[indice] || {})[String(miAsiento)];
  const cantidadRespondio = triviaVivoConteoRespuestas();

  if(triviaVivoEstado.mostrarResultado){
    const acerte = miRespuesta && miRespuesta.opcion === pregunta.correcta;
    cont.innerHTML = `
      <div class="question-box">
        <div class="qnum">${pregunta.cat}</div>
        <h3>${pregunta.text}</h3>
      </div>
      <div id="q-options">${pregunta.opciones.map((op, i) => `
        <div class="option ${i === pregunta.correcta ? 'correct' : (miRespuesta && miRespuesta.opcion === i ? 'wrong' : '')}">${op}</div>
      `).join('')}</div>
      <p class="tienda-nota" style="margin-top:10px;">${miRespuesta ? (acerte ? '¡La tenías! 🎉' : 'Esta vez no...') : 'No llegaste a responder.'}</p>
      ${triviaVivoEsOrganizador()
        ? `<button class="btn-primary" onclick="triviaVivoSiguiente()">${indice + 1 >= triviaVivoEstado.preguntas.length ? 'Ver resultado final' : 'Siguiente pregunta'}</button>`
        : `<p class="tienda-nota">Esperá a que el organizador pase a la siguiente.</p>`}`;
    return;
  }

  cont.innerHTML = `
    <div class="progress-bar"><div class="progress-fill" id="triviavivo-timer-fill" style="width:100%"></div></div>
    <div class="question-box">
      <div class="qnum">${pregunta.cat}</div>
      <h3>${pregunta.text}</h3>
    </div>
    <div id="q-options">${pregunta.opciones.map((op, i) => `
      <div class="option" ${miRespuesta ? 'style="opacity:0.6;pointer-events:none;"' : `onclick="triviaVivoResponder(${i})"`}>${op}</div>
    `).join('')}</div>
    <p class="tienda-nota" style="margin-top:10px;">${miRespuesta ? 'Ya respondiste. Esperando a los demás...' : 'Tocá tu respuesta.'} (${cantidadRespondio} respondieron)</p>
    ${triviaVivoEsOrganizador() ? `<button class="btn-ghost" onclick="triviaVivoMostrarResultado()">Cortar y mostrar resultado</button>` : ''}`;
  triviaVivoActualizarBarra();
  triviaVivoTimerInterval = setInterval(triviaVivoActualizarBarra, 200);
}
