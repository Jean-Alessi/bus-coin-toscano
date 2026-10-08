// Memoria: juego solo, sin cronómetro (acá el desafío es recordar, no la
// velocidad). Arranca con pocas cartas y cada nivel duplica la cantidad de
// pares — 4, 8 y 16 pares (8, 16 y 32 cartas) — para que se pueda jugar un
// rato corto o largo según las ganas.

const MEMORIA_LOGO = 'busmac-logo';
const MEMORIA_EMOJIS = ['🚌','🧳','🗺️','🎫','📸','🕶️','⛰️','🏖️','🌅','🎒','🧭','🍔','🥤','🎶','📱','🛣️', MEMORIA_LOGO];
const MEMORIA_NIVELES = [4, 8, 16]; // pares por nivel

let memoriaNivel = 0;
let memoriaCartas = [];
let memoriaVolteadas = []; // índices boca arriba sin resolver todavía (0, 1 o 2 mientras se revisa)
let memoriaBloqueado = false; // true mientras se muestran dos cartas que no combinan, antes de darlas vuelta
let memoriaIntentos = 0;
let memoriaFlipIdx = -1; // carta que se acaba de dar vuelta (para animarla una sola vez)
let memoriaFase = 'jugando'; // 'jugando' | 'nivel-completo' | 'juego-completo'

function iniciarMemoria(){
  memoriaNivel = 0;
  prepararNivelMemoria();
}

function prepararNivelMemoria(){
  const pares = MEMORIA_NIVELES[memoriaNivel];
  const emojisNivel = barajar(MEMORIA_EMOJIS.slice()).slice(0, pares);
  const mazo = barajar(emojisNivel.concat(emojisNivel));
  memoriaCartas = mazo.map(emoji => ({ emoji, resuelta: false }));
  memoriaVolteadas = [];
  memoriaBloqueado = false;
  memoriaIntentos = 0;
  memoriaFase = 'jugando';
  renderMemoria();
}

function tocarCartaMemoria(i){
  if(memoriaBloqueado || memoriaFase !== 'jugando') return;
  if(memoriaCartas[i].resuelta || memoriaVolteadas.includes(i)) return;

  memoriaVolteadas.push(i);
  memoriaFlipIdx = i;
  if(memoriaVolteadas.length < 2){
    renderMemoria();
    return;
  }

  memoriaIntentos++;
  const [a, b] = memoriaVolteadas;
  if(memoriaCartas[a].emoji === memoriaCartas[b].emoji){
    memoriaCartas[a].resuelta = true;
    memoriaCartas[b].resuelta = true;
    memoriaVolteadas = [];
    reproducirTono('correcto');
    ganarMonedas(4);
    if(memoriaCartas.every(c => c.resuelta)){
      memoriaFase = (memoriaNivel === MEMORIA_NIVELES.length - 1) ? 'juego-completo' : 'nivel-completo';
    }
    renderMemoria();
  } else {
    memoriaBloqueado = true;
    reproducirTono('incorrecto');
    renderMemoria();
    setTimeout(() => {
      memoriaVolteadas = [];
      memoriaBloqueado = false;
      renderMemoria();
    }, 800);
  }
}

function siguienteNivelMemoria(){
  memoriaNivel++;
  prepararNivelMemoria();
}

function renderMemoria(){
  const cont = document.getElementById('memoria-content');
  if(!cont) return;
  document.getElementById('memoria-sub').textContent = `Nivel ${memoriaNivel + 1} de ${MEMORIA_NIVELES.length} · ${MEMORIA_NIVELES[memoriaNivel]} pares`;
  document.getElementById('view-memoria').classList.toggle('juego-inmersivo', memoriaFase === 'jugando');

  if(memoriaFase === 'nivel-completo'){
    cont.innerHTML = gEscenaHTML('menta', `
      <div class="mem-portada">⭐</div>
      ${gDialogoHTML(`¡Nivel ${memoriaNivel + 1} completo!`, `Lo lograste en ${memoriaIntentos} intentos. El próximo nivel tiene el doble de cartas.`)}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="siguienteNivelMemoria()">Siguiente nivel</button></div>`);
    return;
  }

  if(memoriaFase === 'juego-completo'){
    cont.innerHTML = gEscenaHTML('menta', `
      <div class="mem-portada">🏆</div>
      ${gDialogoHTML(`¡Completaste los ${MEMORIA_NIVELES.length} niveles!`, 'Mirá cómo quedaste parado en el Ranking, o jugá de nuevo desde el nivel 1.')}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="iniciarMemoria()">Jugar de nuevo</button></div>`);
    return;
  }

  const pares = MEMORIA_NIVELES[memoriaNivel];
  const resueltas = memoriaCartas.filter(c => c.resuelta).length / 2;
  const cartasHTML = memoriaCartas.map((c, i) => {
    const volteada = c.resuelta || memoriaVolteadas.includes(i);
    let clase = 'mem-carta';
    if(volteada) clase += ' mem-carta-cara';
    if(c.resuelta) clase += ' mem-carta-resuelta';
    if(i === memoriaFlipIdx) clase += ' mem-flip';
    const contenido = c.emoji === MEMORIA_LOGO ? '<img src="icons/icon-192.png" alt="Logo" class="mem-logo-img">' : c.emoji;
    return `<button class="${clase}" onclick="tocarCartaMemoria(${i})">${volteada ? contenido : ''}</button>`;
  }).join('');
  memoriaFlipIdx = -1;

  cont.innerHTML = gEscenaHTML('menta', `
    <div class="g-hud"><span class="g-pill">🎯 ${memoriaIntentos}</span><span class="g-pill">✅ ${resueltas}/${pares}</span><span class="g-pill">🪙 <span class="js-monedas">${monedasCoin}</span></span></div>
    <div class="mem-grid mem-grid-${pares}">${cartasHTML}</div>`);
}
