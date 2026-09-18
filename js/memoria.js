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

  if(memoriaFase === 'nivel-completo'){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>¡Nivel ${memoriaNivel + 1} completo!</h2>
        <p>Lo lograste en ${memoriaIntentos} intentos. El próximo nivel tiene el doble de cartas.</p>
      </div>
      <button class="btn-primary" onclick="siguienteNivelMemoria()">Siguiente nivel</button>`;
    return;
  }

  if(memoriaFase === 'juego-completo'){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>¡Completaste los ${MEMORIA_NIVELES.length} niveles!</h2>
        <p>Mirá cómo quedaste parado en el Ranking, o jugá de nuevo desde el nivel 1.</p>
      </div>
      <button class="btn-primary" onclick="iniciarMemoria()">Jugar de nuevo</button>`;
    return;
  }

  const cartasHTML = memoriaCartas.map((c, i) => {
    const volteada = c.resuelta || memoriaVolteadas.includes(i);
    const clase = 'memoria-carta' + (volteada ? ' memoria-carta-volteada' : '') + (c.resuelta ? ' memoria-carta-resuelta' : '');
    const contenido = c.emoji === MEMORIA_LOGO ? '<img src="icons/icon-192.png" alt="Logo" class="memoria-logo-img">' : c.emoji;
    return `<button class="${clase}" onclick="tocarCartaMemoria(${i})">${volteada ? contenido : ''}</button>`;
  }).join('');

  cont.innerHTML = `
    <p class="tienda-nota">Intentos: ${memoriaIntentos}</p>
    <div class="memoria-grid">${cartasHTML}</div>`;
}
