// El Impostor: se juega en grupos chicos (no todo el micro a la vez, como
// Bingo o Trivia). Todos reciben la misma palabra secreta menos uno o dos
// impostores. El rol de la app es solo repartir el rol EN SECRETO a cada
// celular (nada de pasarse un papelito ni un único teléfono) — las pistas,
// la discusión y la votación son en voz alta, fuera de la app, como en el
// juego real.
//
// El "director" del juego es el organizador del viaje (el mismo PIN que
// usa para manejar Bingo y Tutti Frutti) — es quien creó el código, así
// que es quien está a cargo también acá: reparte los roles, corta la
// ronda, carga a quién votó el grupo y arranca la próxima. No hace falta
// que juegue él mismo (puede repartir roles sin anotarse a recibir palabra).

const IMPOSTOR_MIN_JUGADORES = 3;
// Al menos el doble de inocentes que de impostores, para que el juego
// siga teniendo sentido (ej. con 6 anotados, como mucho 2 impostores).
function impostorMaxImpostores(cantidadJugadores){
  return Math.max(1, Math.floor(cantidadJugadores / 3));
}

const IMPOSTOR_BANCO = [
  { categoria: 'Animales', palabra: 'León' }, { categoria: 'Animales', palabra: 'Elefante' },
  { categoria: 'Animales', palabra: 'Jirafa' }, { categoria: 'Animales', palabra: 'Cocodrilo' },
  { categoria: 'Animales', palabra: 'Pingüino' }, { categoria: 'Animales', palabra: 'Canguro' },
  { categoria: 'Animales', palabra: 'Delfín' }, { categoria: 'Animales', palabra: 'Tiburón' },
  { categoria: 'Películas', palabra: 'Titanic' }, { categoria: 'Películas', palabra: 'Frozen' },
  { categoria: 'Películas', palabra: 'Avatar' }, { categoria: 'Películas', palabra: 'Shrek' },
  { categoria: 'Películas', palabra: 'Rocky' }, { categoria: 'Películas', palabra: 'Gladiador' },
  { categoria: 'Películas', palabra: 'Coco' }, { categoria: 'Películas', palabra: 'Toy Story' },
  { categoria: 'Comidas', palabra: 'Empanada' }, { categoria: 'Comidas', palabra: 'Asado' },
  { categoria: 'Comidas', palabra: 'Milanesa' }, { categoria: 'Comidas', palabra: 'Pizza' },
  { categoria: 'Comidas', palabra: 'Choripán' }, { categoria: 'Comidas', palabra: 'Locro' },
  { categoria: 'Comidas', palabra: 'Alfajor' }, { categoria: 'Comidas', palabra: 'Helado' },
  { categoria: 'Lugares', palabra: 'Playa' }, { categoria: 'Lugares', palabra: 'Montaña' },
  { categoria: 'Lugares', palabra: 'Aeropuerto' }, { categoria: 'Lugares', palabra: 'Hospital' },
  { categoria: 'Lugares', palabra: 'Escuela' }, { categoria: 'Lugares', palabra: 'Cancha' },
  { categoria: 'Lugares', palabra: 'Boliche' }, { categoria: 'Lugares', palabra: 'Terminal de ómnibus' },
  { categoria: 'Profesiones', palabra: 'Bombero' }, { categoria: 'Profesiones', palabra: 'Médico' },
  { categoria: 'Profesiones', palabra: 'Profesor' }, { categoria: 'Profesiones', palabra: 'Chofer' },
  { categoria: 'Profesiones', palabra: 'Cocinero' }, { categoria: 'Profesiones', palabra: 'Policía' },
  { categoria: 'Profesiones', palabra: 'Peluquero' }, { categoria: 'Profesiones', palabra: 'Piloto' },
  { categoria: 'Objetos', palabra: 'Paraguas' }, { categoria: 'Objetos', palabra: 'Mochila' },
  { categoria: 'Objetos', palabra: 'Bicicleta' }, { categoria: 'Objetos', palabra: 'Guitarra' },
  { categoria: 'Objetos', palabra: 'Anteojos' }, { categoria: 'Objetos', palabra: 'Billetera' },
  { categoria: 'Objetos', palabra: 'Termo' }, { categoria: 'Objetos', palabra: 'Almohada' },
  { categoria: 'Deportes', palabra: 'Fútbol' }, { categoria: 'Deportes', palabra: 'Tenis' },
  { categoria: 'Deportes', palabra: 'Básquet' }, { categoria: 'Deportes', palabra: 'Rugby' },
  { categoria: 'Deportes', palabra: 'Vóley' }, { categoria: 'Deportes', palabra: 'Boxeo' },
  { categoria: 'Deportes', palabra: 'Truco' }, { categoria: 'Deportes', palabra: 'Ajedrez' },
];

let impostorEstado = null;
let impostorAnotados = {};
let impostorRondaPremiada = null; // evita premiar dos veces la misma ronda
let impostorCantidadElegida = 1; // cuántos impostores para la próxima ronda, se elige en el lobby

function impostorEstadoVacio(){
  return { fase: 'lobby', categoria: null, palabra: null, impostores: [], jugadores: [], ronda: 0, votoGrupal: null };
}

function impostorRefEstado(){ return db.ref(`salas/${codigoViaje}/impostor/estado`); }
function impostorRefAnotados(){ return db.ref(`salas/${codigoViaje}/impostor/anotados`); }

let impostorListenersListos = false;

function iniciarImpostor(){
  if(!impostorListenersListos){
    impostorListenersListos = true;
    impostorRefEstado().on('value', snap => {
      const anterior = impostorEstado;
      impostorEstado = Object.assign(impostorEstadoVacio(), snap.val() || {});
      if(anterior && anterior.ronda !== impostorEstado.ronda) impostorRondaPremiada = null;
      if(impostorEstado.fase === 'revelado') impostorPremiarSiCorresponde();
      renderImpostor();
    });
    impostorRefAnotados().on('value', snap => {
      impostorAnotados = snap.val() || {};
      if(impostorEstado && impostorEstado.fase === 'lobby') renderImpostor();
    });
  } else {
    renderImpostor();
  }
}

function impostorAnotarme(){
  if(!miAsiento) return;
  impostorRefAnotados().child(String(miAsiento)).set(miNombre);
}

function impostorSalirDelGrupo(){
  if(!miAsiento) return;
  impostorRefAnotados().child(String(miAsiento)).remove();
}

function impostorOrdenAsientos(mapa){
  return Object.keys(mapa).sort((a, b) => Number(a) - Number(b));
}

// El director es el organizador del viaje (mismo PIN que Bingo/Tutti
// Frutti), no un anotado del grupo — así el coordinador que arma el
// viaje maneja también este juego, sin depender de quién se anotó primero.
function impostorEsDirector(){
  return bingoEsOrganizador();
}

function impostorElegirCantidad(cantidad){
  impostorCantidadElegida = cantidad;
  renderImpostor();
}

function impostorEmpezarRonda(){
  if(!impostorEsDirector()) return;
  const jugadores = impostorOrdenAsientos(impostorAnotados);
  if(jugadores.length < IMPOSTOR_MIN_JUGADORES) return;
  const elegido = IMPOSTOR_BANCO[Math.floor(Math.random() * IMPOSTOR_BANCO.length)];
  const cantidadImpostores = Math.min(impostorCantidadElegida, impostorMaxImpostores(jugadores.length));
  const impostores = barajar(jugadores.slice()).slice(0, cantidadImpostores);
  const nuevaRonda = (impostorEstado ? impostorEstado.ronda : 0) + 1;
  impostorRefEstado().set({
    fase: 'jugando',
    categoria: elegido.categoria,
    palabra: elegido.palabra,
    impostores,
    jugadores,
    ronda: nuevaRonda,
    votoGrupal: null,
  });
}

function impostorTerminarYVotar(){
  if(!impostorEsDirector()) return;
  if(!impostorEstado || impostorEstado.fase !== 'jugando') return;
  impostorRefEstado().child('fase').set('votando');
}

function impostorVotar(asientoSospechoso){
  if(!impostorEsDirector()) return;
  if(!impostorEstado || impostorEstado.fase !== 'votando') return;
  impostorRefEstado().update({ fase: 'revelado', votoGrupal: String(asientoSospechoso) });
}

// Cada celular se premia a sí mismo, así las monedas van a quien corresponde
// (mismo criterio que se usa en Bingo y Tutti Frutti). Gana el que corresponde
// según cómo terminó la votación del grupo, no según lo que decida un solo celular.
function impostorPremiarSiCorresponde(){
  if(!miAsiento || !impostorEstado || impostorEstado.fase !== 'revelado') return;
  if(impostorRondaPremiada === impostorEstado.ronda) return;
  if(!impostorEstado.jugadores.includes(String(miAsiento))) return;
  impostorRondaPremiada = impostorEstado.ronda;

  const soyImpostor = impostorEstado.impostores.includes(String(miAsiento));
  const grupoAcerto = impostorEstado.votoGrupal && impostorEstado.impostores.includes(String(impostorEstado.votoGrupal));

  if(soyImpostor && !grupoAcerto){
    ganarMonedas(20);
    mostrarToast('¡Engañaste a todos! +20 monedas', 'gain');
  } else if(!soyImpostor && grupoAcerto){
    ganarMonedas(15);
    mostrarToast('¡Descubrieron al impostor! +15 monedas', 'gain');
  }
}

function impostorNuevaRonda(){
  if(!impostorEsDirector() || !impostorEstado) return;
  impostorRefEstado().set(impostorEstadoVacio());
}

function impostorTerminarJuego(){
  if(!impostorEsDirector()) return;
  db.ref(`salas/${codigoViaje}/impostor`).remove();
}

function impostorListaAnotadosHTML(){
  const asientos = impostorOrdenAsientos(impostorAnotados);
  if(!asientos.length) return '<p class="im-nota">Todavía no se anotó nadie.</p>';
  return `<div class="bingo-roster">${asientos.map(a => `
    <div class="bingo-roster-item"><span>Asiento ${a} — ${impostorAnotados[a]}</span></div>`).join('')}</div>`;
}

function renderImpostor(){
  const cont = document.getElementById('impostor-content');
  if(!cont || !impostorEstado) return;
  document.getElementById('impostor-sub').textContent =
    impostorEstado.fase === 'lobby' ? 'Para grupos chicos, no todo el micro' :
    impostorEstado.fase === 'jugando' ? 'Ronda en curso' :
    impostorEstado.fase === 'votando' ? 'Votación' : 'Resultado';

  if(impostorEstado.fase === 'lobby'){
    const anotado = miAsiento && impostorAnotados[String(miAsiento)] != null;
    const soyDirector = impostorEsDirector();
    const asientos = impostorOrdenAsientos(impostorAnotados);
    const maxImpostores = impostorMaxImpostores(asientos.length);
    if(impostorCantidadElegida > maxImpostores) impostorCantidadElegida = maxImpostores;
    const selectorCantidadHTML = soyDirector && asientos.length >= IMPOSTOR_MIN_JUGADORES
      ? `<div class="g-dialogo-sub" style="text-align:center;margin:8px 0 6px;font-weight:800;">¿Cuántos impostores?</div>
         <div class="g-acciones" style="grid-template-columns:repeat(${Math.min(maxImpostores, 4)},1fr);">
           ${Array.from({ length: maxImpostores }, (_, i) => i + 1).map(n => `
             <button class="gbtn ${impostorCantidadElegida === n ? 'gbtn-sel' : 'gbtn-no'}" onclick="impostorElegirCantidad(${n})">${n}</button>
           `).join('')}
         </div>`
      : '';
    let controlHTML = '';
    if(soyDirector){
      controlHTML = `<div class="g-acciones"><button class="gbtn gbtn-rojo gbtn-ancho" style="font-size:15px;" onclick="impostorEmpezarRonda()" ${asientos.length >= IMPOSTOR_MIN_JUGADORES ? '' : 'disabled'}>Repartir roles y arrancar (${asientos.length}/${IMPOSTOR_MIN_JUGADORES})</button></div>`;
    } else if(anotado){
      controlHTML = `<p class="im-nota">Sos parte del grupo. El organizador del viaje es quien reparte los roles y arranca.</p>`;
    }
    cont.innerHTML = gEscenaHTML('espia', `
      <div class="im-portada">🕵️</div>
      ${gDialogoHTML('El Impostor', `Se juega con el grupo con el que viajás (mínimo ${IMPOSTOR_MIN_JUGADORES}), no con todo el micro. Todos reciben la misma palabra menos el o los impostores. Las pistas, la charla y la votación son en voz alta: la app solo reparte el rol en secreto.`)}
      <div class="g-acciones">${anotado
        ? `<button class="gbtn gbtn-no gbtn-ancho" onclick="impostorSalirDelGrupo()">Salir del grupo</button>`
        : `<button class="gbtn gbtn-ancho" onclick="impostorAnotarme()">Anotarme a este grupo</button>`}</div>
      ${impostorListaAnotadosHTML()}
      ${selectorCantidadHTML}
      ${controlHTML}
      ${soyDirector ? '' : bingoPinHTML()}`);
    return;
  }

  const soyJugador = impostorEstado.jugadores.includes(String(miAsiento));

  if(impostorEstado.fase === 'jugando'){
    if(!soyJugador){
      cont.innerHTML = gEscenaHTML('espia', `
        <div class="im-portada">🕵️</div>
        ${gDialogoHTML('Hay una ronda en curso', 'Otro grupo está jugando ahora. Esperá a que termine, o anotate para la próxima.')}
        ${miAsiento && impostorAnotados[String(miAsiento)] != null ? '' : `<div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="impostorAnotarme()">Anotarme para la próxima</button></div>`}`);
      return;
    }
    const soyImpostor = impostorEstado.impostores.includes(String(miAsiento));
    const rolHTML = soyImpostor ? `
      <div class="im-carta im-carta-impostor">
        <div class="im-carta-emoji">🤫</div>
        <div class="im-carta-titulo">SOS EL IMPOSTOR</div>
        <div class="im-carta-texto">No sabés la palabra. Escuchá bien las pistas de los demás e inventá una pista ambigua para no llamar la atención.</div>
        <div class="im-cat">Categoría: ${impostorEstado.categoria}</div>
      </div>` : `
      <div class="im-carta">
        <div class="im-cat">${impostorEstado.categoria}</div>
        <div class="im-carta-sub">Tu palabra secreta</div>
        <div class="im-palabra-grande">${impostorEstado.palabra}</div>
      </div>
      <p class="im-nota">Por turnos, cada uno dice una palabra relacionada con esta. El impostor no la sabe: atento a quién duda o tira algo raro.</p>`;
    cont.innerHTML = gEscenaHTML('espia', `
      ${rolHTML}
      ${impostorEsDirector()
        ? `<div class="g-acciones"><button class="gbtn gbtn-rojo gbtn-ancho" onclick="impostorTerminarYVotar()">Terminar ronda y votar</button></div>`
        : `<p class="im-nota">Cuando terminen las pistas, el organizador del viaje corta la ronda para pasar a votar.</p>`}`);
    return;
  }

  if(impostorEstado.fase === 'votando'){
    if(!impostorEsDirector()){
      cont.innerHTML = gEscenaHTML('espia', `<div class="im-portada">🗳️</div>${gDialogoHTML('Votando...', 'Discutan en voz alta a quién señalan. El organizador del viaje va a cargar el resultado.')}`);
      return;
    }
    const opcionesHTML = impostorEstado.jugadores.map(a => `
      <button class="gbtn gbtn-no im-voto" onclick="impostorVotar('${a}')">Asiento ${a} — ${impostorAnotados[a] || '?'}</button>
    `).join('');
    cont.innerHTML = gEscenaHTML('espia', `
      <div class="im-portada">🗳️</div>
      ${gDialogoHTML('¿A quién señaló el grupo?', 'Discutan en voz alta y, cuando decidan, tocá el nombre que votó la mayoría.')}
      <div class="im-votos">${opcionesHTML}</div>`);
    return;
  }

  // fase === 'revelado'
  const nombresImpostores = impostorEstado.impostores.map(a => impostorAnotados[a] || `Asiento ${a}`).join(', ');
  const grupoAcerto = impostorEstado.votoGrupal && impostorEstado.impostores.includes(String(impostorEstado.votoGrupal));
  const votado = impostorEstado.votoGrupal ? (impostorAnotados[impostorEstado.votoGrupal] || `Asiento ${impostorEstado.votoGrupal}`) : null;
  const controlesRevelado = impostorEsDirector()
    ? `<div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="impostorNuevaRonda()">Nueva ronda</button></div>
       <div class="g-pie"><span onclick="impostorTerminarJuego()">Terminar el juego</span></div>`
    : `<p class="im-nota">El organizador del viaje decide si juegan otra ronda.</p>`;
  cont.innerHTML = gEscenaHTML('espia', `
    <div class="im-portada">${grupoAcerto ? '✅' : '🎭'}</div>
    ${gDialogoHTML(grupoAcerto ? '¡Lo descubrieron!' : 'El impostor se salvó', `${votado ? `El grupo votó a ${votado}. ` : ''}El impostor era: <strong>${nombresImpostores}</strong>.`)}
    <p class="im-nota">Categoría: ${impostorEstado.categoria} · Palabra secreta: <strong>${impostorEstado.palabra}</strong></p>
    ${controlesRevelado}`);
}
