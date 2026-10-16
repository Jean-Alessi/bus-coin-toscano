// Baraja francesa (poker): 52 cartas con ♠ ♥ ♦ ♣. La usan el Solitario, el
// Póker de video y el Texas Hold'em. El dorso lleva la B de Busmac.
// Una carta es { p: 0..3 (palo), v: 1..13 (A, 2..10, J, Q, K) }.

const FR_PALOS = ['♠', '♥', '♦', '♣'];
const FR_VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const FR_NOMBRES_PALO = ['picas', 'corazones', 'diamantes', 'tréboles'];

function frMazo(){
  const m = [];
  for(let p = 0; p < 4; p++) for(let v = 1; v <= 13; v++) m.push({ p, v });
  return m;
}

function frBarajar(lista){
  const a = lista.slice();
  for(let i = a.length - 1; i > 0; i--){
    const k = Math.floor(Math.random() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

const frEsRoja = c => c.p === 1 || c.p === 2;
const frValor = c => FR_VALORES[c.v - 1];
const frEtiqueta = c => frValor(c) + ' de ' + FR_NOMBRES_PALO[c.p];

// opts: { onclick, sel, extra (clases), estilo }
function frCartaHTML(c, opts){
  const o = opts || {};
  const clases = `fcarta ${frEsRoja(c) ? 'fc-rojo' : 'fc-negro'}${o.sel ? ' fc-sel' : ''}${o.extra ? ' ' + o.extra : ''}`;
  const palo = FR_PALOS[c.p], valor = frValor(c);
  const centro = c.v >= 11 ? `<span class="fc-figura">${valor}</span><span class="fc-figura-palo">${palo}</span>` : palo;
  const attrs = `${o.onclick ? ` onclick="${o.onclick}"` : ''}${o.estilo ? ` style="${o.estilo}"` : ''}`;
  return `<div class="${clases}" role="img" aria-label="${frEtiqueta(c)}"${attrs}>
    <span class="fc-esq">${valor}${palo}</span>
    <span class="fc-centro">${centro}</span>
  </div>`;
}

function frDorsoHTML(opts){
  const o = opts || {};
  const attrs = `${o.onclick ? ` onclick="${o.onclick}"` : ''}${o.estilo ? ` style="${o.estilo}"` : ''}`;
  return `<div class="fcarta fc-dorso${o.extra ? ' ' + o.extra : ''}"${attrs}><img src="logo-empresa.png?v=2" alt=""></div>`;
}

function frHuecoHTML(opts){
  const o = opts || {};
  const attrs = `${o.onclick ? ` onclick="${o.onclick}"` : ''}${o.estilo ? ` style="${o.estilo}"` : ''}`;
  return `<div class="fcarta fc-hueco${o.extra ? ' ' + o.extra : ''}"${attrs}>${o.texto || ''}</div>`;
}
