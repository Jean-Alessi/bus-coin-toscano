// Solitario (Klondike) con baraja francesa. Se juega tocando: tocás una carta
// para elegirla y después tocás adónde querés llevarla. Tocar de nuevo la carta
// elegida (o la última de una columna) la manda a su pila si puede subir.
// Sacás de a una carta del mazo y podés pasar por el mazo las veces que quieras.

let sol = null;

function solNuevaPartida(){
  const mazo = frBarajar(frMazo());
  const tab = [];
  for(let i = 0; i < 7; i++) tab.push(mazo.splice(0, i + 1).map((c, k) => ({ c, up: k === i })));
  sol = {
    tab, mazo: mazo.map(c => ({ c, up: false })), desc: [], base: [[], [], [], []],
    sel: null, historial: [], movs: 0, ganado: false, nBase: 0, cw: sol ? sol.cw : 44,
  };
}

function iniciarSolitario(){
  solNuevaPartida();
  solRender();
}

function solSnap(){
  sol.historial.push(JSON.stringify({ tab: sol.tab, mazo: sol.mazo, desc: sol.desc, base: sol.base, movs: sol.movs, nBase: sol.nBase }));
  if(sol.historial.length > 80) sol.historial.shift();
}

function solDeshacer(){
  if(!sol || !sol.historial.length || sol.ganado) return;
  const e = JSON.parse(sol.historial.pop());
  Object.assign(sol, e);
  sol.sel = null;
  solRender();
}

const solRojo = c => frEsRoja(c);

function solPuedeBase(c){ return sol.base[c.p].length === c.v - 1; }
function solPuedeColumna(col, c){
  const cartas = sol.tab[col];
  if(!cartas.length) return c.v === 13;
  const tope = cartas[cartas.length - 1];
  return tope.up && solRojo(tope.c) !== solRojo(c) && tope.c.v === c.v + 1;
}

// Cartas elegidas como lista ({c}), o null.
function solCartasSel(){
  const s = sol.sel;
  if(!s) return null;
  if(s.o === 'desc') return sol.desc.length ? [sol.desc[sol.desc.length - 1]] : null;
  const col = sol.tab[s.col];
  return col && col[s.idx] && col[s.idx].up ? col.slice(s.idx) : null;
}

function solQuitarSel(){
  const s = sol.sel;
  if(s.o === 'desc') return [sol.desc.pop()];
  const col = sol.tab[s.col];
  const sacadas = col.splice(s.idx);
  if(col.length && !col[col.length - 1].up) col[col.length - 1].up = true;
  return sacadas;
}

function solMoverA(destino){
  const cartas = solCartasSel();
  if(!cartas) return false;
  const primera = cartas[0].c;
  if(destino.t === 'base'){
    if(cartas.length !== 1 || primera.p !== destino.p || !solPuedeBase(primera)) return false;
    solSnap();
    solQuitarSel();
    sol.base[destino.p].push(cartas[0]);
    sol.nBase++;
    solAlSubirABase();
  } else {
    if(sol.sel.o === 'tab' && sol.sel.col === destino.col) return false;
    if(!solPuedeColumna(destino.col, primera)) return false;
    solSnap();
    solQuitarSel().forEach(x => sol.tab[destino.col].push(x));
  }
  sol.movs++;
  sol.sel = null;
  solRevisarVictoria();
  return true;
}

function solAlSubirABase(){
  if(sol.nBase % 8 === 0 && typeof arcOtorgarMonedas === 'function'){
    const dado = arcOtorgarMonedas('solitario', 1);
    if(dado > 0 && typeof mostrarToast === 'function') mostrarToast('+' + dado + ' 🪙', 'gain');
  }
  reproducirTono('correcto');
}

function solRevisarVictoria(){
  if(sol.base.reduce((s, b) => s + b.length, 0) < 52) return;
  sol.ganado = true;
  if(typeof arcOtorgarMonedas === 'function'){
    const dado = arcOtorgarMonedas('solitario', 10);
    if(dado > 0 && typeof mostrarToast === 'function') mostrarToast('+' + dado + ' 🪙', 'gain');
  }
  reproducirTono('bonus');
}

// Manda a las pilas todas las cartas que puedan subir, una por una.
function solAuto(){
  if(!sol || sol.ganado) return;
  let movio = false, seguir = true;
  while(seguir){
    seguir = false;
    const candidatas = [];
    if(sol.desc.length) candidatas.push({ o: 'desc' });
    sol.tab.forEach((col, i) => { if(col.length) candidatas.push({ o: 'tab', col: i, idx: col.length - 1 }); });
    for(const s of candidatas){
      sol.sel = s;
      const cs = solCartasSel();
      if(cs && cs.length === 1 && solPuedeBase(cs[0].c)){
        if(solMoverA({ t: 'base', p: cs[0].c.p })){ movio = true; seguir = true; break; }
      }
    }
  }
  sol.sel = null;
  solRender();
}

function solClick(tipo, a, b){
  if(!sol || sol.ganado) return;
  if(tipo === 'mazo'){
    solSnap();
    if(sol.mazo.length){ const x = sol.mazo.pop(); x.up = true; sol.desc.push(x); }
    else if(sol.desc.length){ sol.mazo = sol.desc.reverse().map(x => ({ c: x.c, up: false })); sol.desc = []; }
    else { sol.historial.pop(); return; }
    sol.sel = null; sol.movs++;
    reproducirTono('tick');
    solRender();
    return;
  }
  if(tipo === 'desc'){
    if(!sol.desc.length) return;
    if(sol.sel && sol.sel.o === 'desc'){
      const c = sol.desc[sol.desc.length - 1].c;
      if(!solMoverA({ t: 'base', p: c.p })) sol.sel = null;
    } else sol.sel = { o: 'desc' };
    solRender();
    return;
  }
  if(tipo === 'base'){
    if(sol.sel) solMoverA({ t: 'base', p: a });
    solRender();
    return;
  }
  if(tipo === 'vacia'){
    if(sol.sel) solMoverA({ t: 'col', col: a });
    solRender();
    return;
  }
  if(tipo === 'tab'){
    const col = sol.tab[a];
    if(!col[b] || !col[b].up) return;
    const ultima = b === col.length - 1;
    if(sol.sel && sol.sel.o === 'tab' && sol.sel.col === a && sol.sel.idx === b){
      // Tocar de nuevo la misma carta: probar mandarla a su pila.
      if(ultima && solMoverA({ t: 'base', p: col[b].c.p })) { solRender(); return; }
      sol.sel = null;
    } else if(sol.sel && ultima && solMoverA({ t: 'col', col: a })){
      // Se movió a esta columna.
    } else {
      sol.sel = { o: 'tab', col: a, idx: b };
    }
    solRender();
  }
}

function solRender(){
  const cont = document.getElementById('solitario-content');
  if(!cont) return;
  const vista = document.getElementById('view-solitario');
  vista.classList.toggle('juego-inmersivo', !sol.ganado);
  document.getElementById('solitario-sub').textContent = `${sol.movs} movimientos`;

  const cw = sol.cw, ch = Math.round(cw * 1.42), gap = 4;
  const abierta = Math.round(cw * 0.42), cerrada = Math.round(cw * 0.17);
  const estiloCarta = `--cw:${cw}px;`;

  const selT = sol.sel && sol.sel.o === 'tab' ? sol.sel : null;
  const selDesc = sol.sel && sol.sel.o === 'desc';

  const mazoHTML = sol.mazo.length
    ? frDorsoHTML({ onclick: "solClick('mazo')", estilo: estiloCarta })
    : frHuecoHTML({ onclick: "solClick('mazo')", estilo: estiloCarta, texto: '↻' });
  const descHTML = sol.desc.length
    ? frCartaHTML(sol.desc[sol.desc.length - 1].c, { onclick: "solClick('desc')", sel: selDesc, estilo: estiloCarta })
    : frHuecoHTML({ estilo: estiloCarta });
  const basesCeldas = sol.base.map((pila, p) => pila.length
    ? frCartaHTML(pila[pila.length - 1].c, { onclick: `solClick('base',${p})`, estilo: estiloCarta })
    : frHuecoHTML({ onclick: `solClick('base',${p})`, estilo: estiloCarta, texto: `<span class="sol-palo-hueco ${p === 1 || p === 2 ? 'fc-rojo' : ''}">${FR_PALOS[p]}</span>` })).map(h => `<div class="sol-celda">${h}</div>`).join('');

  const columnasHTML = sol.tab.map((col, i) => {
    if(!col.length) return `<div class="sol-col" style="height:${ch}px">${frHuecoHTML({ onclick: `solClick('vacia',${i})`, estilo: estiloCarta, texto: 'K' })}</div>`;
    let y = 0;
    const cartas = col.map((x, k) => {
      const top = y;
      y += x.up ? abierta : cerrada;
      if(!x.up) return `<div class="sol-pos" style="top:${top}px">${frDorsoHTML({ estilo: estiloCarta })}</div>`;
      const elegida = selT && selT.col === i && k >= selT.idx;
      return `<div class="sol-pos" style="top:${top}px">${frCartaHTML(x.c, { onclick: `solClick('tab',${i},${k})`, sel: elegida, estilo: estiloCarta })}</div>`;
    }).join('');
    return `<div class="sol-col" style="height:${y - (col[col.length - 1].up ? abierta : cerrada) + ch}px">${cartas}</div>`;
  }).join('');

  const fin = sol.ganado ? `<div class="sol-fin">${gDialogoHTML('¡Ganaste el solitario! 🎉', `Lo resolviste en ${sol.movs} movimientos.`)}<div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="iniciarSolitario()">Jugar de nuevo</button></div></div>` : '';

  cont.innerHTML = gEscenaHTML('casino', `
    <div class="g-hud"><span class="g-pill">🂡 ${sol.nBase}/52</span><span class="g-pill">👆 ${sol.movs}</span><span class="g-pill">🪙 <span class="js-monedas">${monedasCoin}</span></span></div>
    <div class="sol-tablero" style="--cw:${cw}px; --gap:${gap}px;">
      <div class="sol-fila-alta"><div class="sol-celda">${mazoHTML}</div><div class="sol-celda">${descHTML}</div><div class="sol-celda"></div>${basesCeldas}</div>
      <div class="sol-fila-baja">${columnasHTML}</div>
    </div>
    ${fin}
    <div class="g-acciones sol-acciones"><button class="gbtn gbtn-chico-texto" onclick="solDeshacer()" ${sol.historial.length ? '' : 'disabled'}>↩ Deshacer</button><button class="gbtn gbtn-chico-texto" onclick="solAuto()">⚡ Subir</button><button class="gbtn gbtn-chico-texto" onclick="iniciarSolitario()">🔄 Nueva</button></div>`, 'sol-escena');

  // Ajusta el ancho de las cartas al ancho disponible (7 columnas) y redibuja si cambió.
  const tablero = cont.querySelector('.sol-tablero');
  const disponible = tablero ? tablero.clientWidth : 0;
  if(disponible > 0){
    const nuevo = Math.max(30, Math.min(58, Math.floor((disponible - 6 * gap) / 7)));
    if(nuevo !== sol.cw){ sol.cw = nuevo; solRender(); }
  }
}
