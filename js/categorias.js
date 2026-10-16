// Categorías Viajeras: un solitario de palabras. Cada categoría (En el micro,
// Equipaje, Destinos...) tiene una carta con su nombre y 4 palabras. Hay que
// llevar primero la carta de la categoría a un lugar vacío de arriba y después
// apilarle sus 4 palabras. Se juntan cartas de la misma categoría en las
// columnas para destapar las de abajo, y la B de Busmac es un comodín que vale
// para cualquier categoría. Se juega tocando: tocás una carta y después tocás
// adónde va (tocar de nuevo la carta elegida la manda arriba si puede).

const CAT_BANCO = [
  { id: 'micro', nombre: 'En el micro', items: ['Butaca', 'Ventana', 'Pasillo', 'Bodega', 'Cinturón', 'Baño'] },
  { id: 'equipaje', nombre: 'Equipaje', items: ['Valija', 'Mochila', 'Neceser', 'Bolso', 'Campera', 'Almohada'] },
  { id: 'destinos', nombre: 'Destinos', items: ['Bariloche', 'Mendoza', 'Córdoba', 'Salta', 'Iguazú', 'Ushuaia'] },
  { id: 'comida', nombre: 'Comida de viaje', items: ['Sándwich', 'Alfajor', 'Mate', 'Galletas', 'Fruta', 'Termo'] },
  { id: 'ruta', nombre: 'En la ruta', items: ['Peaje', 'Banquina', 'Curva', 'Puente', 'Señal', 'Rotonda'] },
  { id: 'documentos', nombre: 'Papeles', items: ['DNI', 'Pasaje', 'Voucher', 'Seguro', 'Reserva', 'Permiso'] },
  { id: 'calor', nombre: 'Para el calor', items: ['Gorra', 'Crema', 'Ojotas', 'Agua', 'Abanico', 'Toalla'] },
  { id: 'playa', nombre: 'Playa', items: ['Reposera', 'Balde', 'Pelota', 'Arena', 'Olas', 'Caracol'] },
  { id: 'musica', nombre: 'Música', items: ['Casetera', 'Parlante', 'Radio', 'Playlist', 'Guitarra', 'Cumbia'] },
  { id: 'juegos', nombre: 'Juegos', items: ['Truco', 'Chinchón', 'Bingo', 'Ajedrez', 'Dados', 'Escoba'] },
  { id: 'ropa', nombre: 'Ropa', items: ['Remera', 'Pantalón', 'Buzo', 'Botas', 'Medias', 'Bufanda'] },
  { id: 'animales', nombre: 'Animales', items: ['Vaca', 'Caballo', 'Oveja', 'Guanaco', 'Zorro', 'Cóndor'] },
  { id: 'equipo', nombre: 'El equipo', items: ['Chofer', 'Guía', 'Auxiliar', 'Mecánico', 'Pasajero', 'Azafata'] },
  { id: 'clima', nombre: 'El clima', items: ['Sol', 'Lluvia', 'Viento', 'Niebla', 'Nieve', 'Tormenta'] },
  { id: 'montana', nombre: 'Montaña', items: ['Cerro', 'Sendero', 'Refugio', 'Glaciar', 'Cumbre', 'Cascada'] },
  { id: 'ciudad', nombre: 'En la ciudad', items: ['Plaza', 'Museo', 'Terminal', 'Hotel', 'Mercado', 'Catedral'] },
];
const CAT_POR_CATEGORIA = 4; // palabras por categoría (más la carta de la categoría)

let cat = null;

function catBarajar(lista){ return typeof frBarajar === 'function' ? frBarajar(lista) : lista.slice().sort(() => Math.random() - 0.5); }

// El reparto siempre se puede ganar. Se arma un orden oculto de las cartas en el que
// la carta de cada categoría va antes que sus palabras, y las columnas se llenan para
// que arriba de todo queden siempre las cartas "más tempranas" de ese orden (las del
// mazo pueden ser cualquiera, porque se recicla sin límite). Así, jugando siempre la
// carta más temprana que queda, cada una tiene su lugar listo. Las categorías se
// entreveran al azar, así que no se nota el orden.
function catNuevoNivel(nivel, conservar){
  const n = Math.min(5, 3 + Math.floor((nivel - 1) / 2));
  const elegidas = catBarajar(CAT_BANCO).slice(0, n);
  let idc = 0;
  const secuencias = elegidas.map(c => {
    const seq = [{ id: ++idc, tipo: 'cab', cat: c.id, texto: c.nombre }];
    catBarajar(c.items).slice(0, CAT_POR_CATEGORIA).forEach(t => seq.push({ id: ++idc, tipo: 'item', cat: c.id, texto: t }));
    return seq;
  });
  // Entrevera las secuencias al azar (cada una conserva su orden interno).
  const orden = [];
  const quedan = secuencias.map(s => s.slice());
  while(quedan.some(s => s.length)){
    const vivas = quedan.filter(s => s.length);
    orden.push(vivas[Math.floor(Math.random() * vivas.length)].shift());
  }
  const comodin = { id: ++idc, tipo: 'com', cat: null, texto: 'Comodín' };
  // El mazo se lleva una parte al azar; el resto va a las columnas respetando el orden.
  const cantMazo = Math.round((orden.length + 1) * 0.3);
  const posMazo = new Set(catBarajar(orden.map((_, i) => i)).slice(0, Math.max(0, cantMazo - 1)));
  const stock = catBarajar(orden.filter((_, i) => posMazo.has(i)).concat([comodin]));
  const enMesa = orden.filter((_, i) => !posMazo.has(i));
  const tab = Array.from({ length: n }, () => []);
  for(let i = enMesa.length - 1, k = 0; i >= 0; i--, k++) tab[k % n].push({ c: enMesa[i], up: false });
  tab.forEach(col => { if(col.length) col[col.length - 1].up = true; });
  return {
    nivel, n, categorias: elegidas, tab, stock, desc: [],
    slots: Array.from({ length: n }, () => ({ cat: null, cartas: [] })),
    sel: null, pista: null, historial: [], movs: conservar ? conservar.movs : 0, ganado: false,
    cw: (conservar && conservar.cw) || (cat && cat.cw) || 60, nivelGanado: false,
  };
}

function iniciarCategorias(){
  cat = catNuevoNivel(1);
  catRender();
}

function catNuevaPartida(){ cat = catNuevoNivel(cat.nivel); catRender(); }
function catSiguienteNivel(){ cat = catNuevoNivel(cat.nivel + 1, cat); catRender(); }

function catSnap(){
  cat.historial.push(JSON.stringify({ tab: cat.tab, stock: cat.stock, desc: cat.desc, slots: cat.slots, movs: cat.movs }));
  if(cat.historial.length > 80) cat.historial.shift();
}
function catDeshacer(){
  if(!cat.historial.length || cat.nivelGanado) return;
  Object.assign(cat, JSON.parse(cat.historial.pop()));
  cat.sel = null; cat.pista = null;
  catRender();
}

// ---- Reglas ----

// Categoría de la carta k de una columna; un comodín toma la de la carta de abajo.
function catEfectiva(cartas, k){
  if(cartas[k].tipo !== 'com') return cartas[k].cat;
  for(let j = k - 1; j >= 0; j--) if(cartas[j].tipo !== 'com') return cartas[j].cat;
  return null;
}

function catGrupoValido(col, idx){
  const cartas = col.map(x => x.c);
  if(!col[idx] || !col[idx].up) return false;
  const base = catEfectiva(cartas, idx);
  for(let k = idx + 1; k < cartas.length; k++){
    const e = catEfectiva(cartas, k);
    if(base !== null && e !== null && e !== base) return false;
  }
  return true;
}

function catPuedeASlot(carta, s){
  const slot = cat.slots[s];
  if(!slot.cat) return carta.tipo === 'cab';
  if(slot.cartas.length >= CAT_POR_CATEGORIA + 1) return false;
  if(carta.tipo === 'com') return true;
  return carta.tipo === 'item' && carta.cat === slot.cat.id;
}

function catPuedeAColumna(carta, ci){
  const col = cat.tab[ci];
  if(!col.length) return true;
  const tope = col[col.length - 1];
  if(!tope.up) return false;
  if(carta.tipo === 'com') return true;
  const e = catEfectiva(col.map(x => x.c), col.length - 1);
  return e === null || e === carta.cat;
}

function catSeleccion(){
  const s = cat.sel;
  if(!s) return null;
  if(s.o === 'desc') return cat.desc.length ? [cat.desc[cat.desc.length - 1]] : null;
  const col = cat.tab[s.col];
  if(!col || !col[s.idx] || !col[s.idx].up) return null;
  return col.slice(s.idx).map(x => x.c);
}

function catQuitarSeleccion(){
  const s = cat.sel;
  if(s.o === 'desc') return [cat.desc.pop()];
  const col = cat.tab[s.col];
  const sacadas = col.splice(s.idx).map(x => x.c);
  if(col.length && !col[col.length - 1].up) col[col.length - 1].up = true;
  return sacadas;
}

function catMoverA(destino){
  const cartas = catSeleccion();
  if(!cartas) return false;
  if(destino.t === 'slot'){
    if(cartas.length !== 1 || !catPuedeASlot(cartas[0], destino.i)) return false;
    catSnap();
    catQuitarSeleccion();
    const slot = cat.slots[destino.i];
    const c = cartas[0];
    if(!slot.cat) slot.cat = cat.categorias.find(x => x.id === c.cat);
    slot.cartas.push(c);
    reproducirTono('correcto');
    if(slot.cartas.length === CAT_POR_CATEGORIA + 1) catCategoriaCompleta();
  } else {
    if(cat.sel.o === 'tab' && cat.sel.col === destino.i) return false;
    if(!catPuedeAColumna(cartas[0], destino.i)) return false;
    if(cat.sel.o === 'tab' && !cat.tab[destino.i].length && cat.sel.idx === 0) return false; // mover una columna entera a una vacía no sirve
    catSnap();
    catQuitarSeleccion().forEach(c => cat.tab[destino.i].push({ c, up: true }));
    reproducirTono('tick');
  }
  cat.movs++;
  cat.sel = null; cat.pista = null;
  catRevisarVictoria();
  return true;
}

function catCategoriaCompleta(){
  if(typeof arcOtorgarMonedas === 'function'){
    const dado = arcOtorgarMonedas('categorias', 2);
    if(dado > 0 && typeof mostrarToast === 'function') mostrarToast('¡Categoría completa! +' + dado + ' 🪙', 'gain');
  }
}

function catRevisarVictoria(){
  if(!cat.slots.every(s => s.cartas.length === CAT_POR_CATEGORIA + 1)) return;
  cat.ganado = true; cat.nivelGanado = true;
  // Estrellas según los movimientos: con menos de lo "justo" para este nivel, tres.
  const justo = Math.round((cat.n * (CAT_POR_CATEGORIA + 1) + 1) * 1.45);
  cat.estrellas = cat.movs <= justo ? 3 : cat.movs <= justo * 1.5 ? 2 : 1;
  if(typeof arcOtorgarMonedas === 'function'){
    const dado = arcOtorgarMonedas('categorias', 5 + (cat.estrellas === 3 ? 2 : 0));
    if(dado > 0 && typeof mostrarToast === 'function') mostrarToast('+' + dado + ' 🪙', 'gain');
  }
  reproducirTono('bonus');
}

function catClick(tipo, a, b){
  if(!cat || cat.nivelGanado) return;
  cat.pista = null;
  if(tipo === 'mazo'){
    catSnap();
    if(cat.stock.length) cat.desc.push(cat.stock.pop());
    else if(cat.desc.length){ cat.stock = cat.desc.reverse(); cat.desc = []; }
    else { cat.historial.pop(); return; }
    cat.sel = null; cat.movs++;
    reproducirTono('tick');
    catRender();
    return;
  }
  if(tipo === 'desc'){
    if(!cat.desc.length) return;
    if(cat.sel && cat.sel.o === 'desc'){
      const c = cat.desc[cat.desc.length - 1];
      const s = cat.slots.findIndex((_, i) => catPuedeASlot(c, i));
      if(s >= 0) catMoverA({ t: 'slot', i: s }); else cat.sel = null;
    } else cat.sel = { o: 'desc' };
    catRender();
    return;
  }
  if(tipo === 'slot'){
    if(cat.sel) catMoverA({ t: 'slot', i: a });
    catRender();
    return;
  }
  if(tipo === 'vacia'){
    if(cat.sel) catMoverA({ t: 'col', i: a });
    catRender();
    return;
  }
  if(tipo === 'tab'){
    const col = cat.tab[a];
    if(!col[b] || !col[b].up) return;
    const ultima = b === col.length - 1;
    if(cat.sel && cat.sel.o === 'tab' && cat.sel.col === a && cat.sel.idx === b){
      if(ultima){
        const s = cat.slots.findIndex((_, i) => catPuedeASlot(col[b].c, i));
        if(s >= 0){ catMoverA({ t: 'slot', i: s }); catRender(); return; }
      }
      cat.sel = null;
    } else if(cat.sel && ultima && catMoverA({ t: 'col', i: a })){
      // se movió a esta columna
    } else if(catGrupoValido(col, b)){
      cat.sel = { o: 'tab', col: a, idx: b };
    } else {
      cat.sel = null;
      if(typeof mostrarToast === 'function') mostrarToast('Esas cartas no son de la misma categoría');
    }
    catRender();
  }
}

// ---- Pista: busca una jugada útil y la marca ----

function catBuscarPista(){
  const fuentes = [];
  if(cat.desc.length) fuentes.push({ o: 'desc', cartas: [cat.desc[cat.desc.length - 1]], etiqueta: cat.desc[cat.desc.length - 1].texto });
  cat.tab.forEach((col, ci) => {
    col.forEach((x, idx) => {
      if(x.up && catGrupoValido(col, idx)) fuentes.push({ o: 'tab', col: ci, idx, cartas: col.slice(idx).map(y => y.c), etiqueta: x.c.texto });
    });
  });
  // 1) algo que suba a un lugar de arriba
  for(const f of fuentes){
    if(f.cartas.length !== 1 || (f.o === 'tab' && f.idx !== cat.tab[f.col].length - 1)) continue;
    const s = cat.slots.findIndex((_, i) => catPuedeASlot(f.cartas[0], i));
    if(s >= 0) return { fuente: f, destino: { t: 'slot', i: s }, texto: 'Llevá "' + f.etiqueta + '" arriba' };
  }
  // 2) juntar cartas para destapar una de abajo
  for(const f of fuentes){
    if(f.o !== 'tab' || f.idx === 0) continue;
    if(cat.tab[f.col][f.idx - 1].up) continue;
    for(let ci = 0; ci < cat.tab.length; ci++){
      if(ci !== f.col && cat.tab[ci].length && catPuedeAColumna(f.cartas[0], ci)) return { fuente: f, destino: { t: 'col', i: ci }, texto: 'Mové "' + f.etiqueta + '" para destapar una carta' };
    }
  }
  // 3) juntar de la misma categoría
  for(const f of fuentes){
    for(let ci = 0; ci < cat.tab.length; ci++){
      if((f.o === 'tab' && ci === f.col) || !cat.tab[ci].length) continue;
      if(f.o === 'tab' && f.idx === 0) continue;
      if(catPuedeAColumna(f.cartas[0], ci) && catEfectiva(cat.tab[ci].map(x => x.c), cat.tab[ci].length - 1) === (f.cartas[0].tipo === 'com' ? null : f.cartas[0].cat)) return { fuente: f, destino: { t: 'col', i: ci }, texto: 'Juntá "' + f.etiqueta + '" con las de su categoría' };
    }
  }
  if(cat.stock.length || cat.desc.length) return { fuente: null, destino: null, texto: 'Sacá una carta del mazo' };
  return null;
}

function catPedirPista(){
  if(!cat || cat.nivelGanado) return;
  const p = catBuscarPista();
  if(!p){ if(typeof mostrarToast === 'function') mostrarToast('No veo jugadas: probá deshacer o empezar otra'); return; }
  cat.sel = p.fuente ? (p.fuente.o === 'desc' ? { o: 'desc' } : { o: 'tab', col: p.fuente.col, idx: p.fuente.idx }) : null;
  cat.pista = p.destino || (p.fuente ? null : { t: 'mazo' });
  if(typeof mostrarToast === 'function') mostrarToast(p.texto);
  catRender();
}

// ---- Dibujo ----

const catEsc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function catCartaHTML(c, o){
  const clases = 'cat-carta' + (c.tipo === 'cab' ? ' cat-cab' : '') + (c.tipo === 'com' ? ' cat-com' : '') + (o.sel ? ' cat-sel' : '') + (o.pista ? ' cat-pista' : '');
  const onclick = o.onclick ? ` onclick="${o.onclick}"` : '';
  let interior;
  if(c.tipo === 'com'){
    interior = `<img class="cat-logo-grande" src="logo-empresa.png?v=2" alt=""><div class="cat-texto cat-texto-com">Comodín</div>`;
  } else if(c.tipo === 'cab'){
    const cuenta = o.cuenta != null ? `<span class="cat-cuenta">${o.cuenta}/${CAT_POR_CATEGORIA}</span>` : '';
    interior = `<div class="cat-barra"><img class="cat-logo-chico" src="logo-empresa.png?v=2" alt="">${cuenta}</div><div class="cat-texto">${catEsc(c.texto)}</div>`;
  } else {
    const etiqueta = o.categoria ? `<div class="cat-mini">${catEsc(o.categoria)}</div>` : '';
    const cuenta = o.cuenta != null ? `<span class="cat-cuenta cat-cuenta-sola">${o.cuenta}/${CAT_POR_CATEGORIA}</span>` : '';
    interior = `${etiqueta}${cuenta}<div class="cat-texto">${catEsc(c.texto)}</div>`;
  }
  return `<div class="${clases}" style="--cw:${cat.cw}px"${onclick}>${interior}</div>`;
}
function catDorsoHTML(o){
  return `<div class="cat-carta cat-dorso${o && o.pista ? ' cat-pista' : ''}" style="--cw:${cat.cw}px"${o && o.onclick ? ` onclick="${o.onclick}"` : ''}><img class="cat-logo-dorso" src="logo-empresa.png?v=2" alt=""></div>`;
}
function catHuecoHTML(o){
  return `<div class="cat-carta cat-hueco${o.pista ? ' cat-pista' : ''}" style="--cw:${cat.cw}px"${o.onclick ? ` onclick="${o.onclick}"` : ''}>${o.contenido || ''}</div>`;
}

function catRender(){
  const cont = document.getElementById('categorias-content');
  if(!cont) return;
  const vista = document.getElementById('view-categorias');
  vista.classList.toggle('juego-inmersivo', !cat.nivelGanado);
  document.getElementById('categorias-sub').textContent = 'Nivel ' + cat.nivel;

  const cw = cat.cw, ch = Math.round(cw * 1.32), abierta = Math.round(cw * 0.5), cerrada = Math.round(cw * 0.17);
  const sel = cat.sel, pista = cat.pista;

  const slotsHTML = cat.slots.map((s, i) => {
    const pistaAca = pista && pista.t === 'slot' && pista.i === i;
    if(!s.cat) return `<div class="cat-celda">${catHuecoHTML({ onclick: `catClick('slot',${i})`, pista: pistaAca, contenido: `<img class="cat-logo-hueco" src="logo-empresa.png?v=2" alt="">` })}</div>`;
    const tope = s.cartas[s.cartas.length - 1];
    const cuenta = s.cartas.length - 1;
    const completo = s.cartas.length === CAT_POR_CATEGORIA + 1;
    const carta = s.cartas.length === 1 ? tope : Object.assign({}, tope);
    return `<div class="cat-celda${completo ? ' cat-completa' : ''}">${catCartaHTML(carta, { onclick: `catClick('slot',${i})`, pista: pistaAca, cuenta, categoria: tope.tipo === 'cab' ? null : s.cat.nombre })}</div>`;
  }).join('');

  const mazoHTML = cat.stock.length
    ? `<div class="cat-mazo-wrap">${catDorsoHTML({ onclick: "catClick('mazo')", pista: pista && pista.t === 'mazo' })}<span class="cat-mazo-cuenta">${cat.stock.length}</span></div>`
    : catHuecoHTML({ onclick: "catClick('mazo')", pista: pista && pista.t === 'mazo', contenido: '<span class="cat-reciclar">↻</span>' });
  const descHTML = cat.desc.length
    ? catCartaHTML(cat.desc[cat.desc.length - 1], { onclick: "catClick('desc')", sel: sel && sel.o === 'desc' })
    : catHuecoHTML({});

  const columnasHTML = cat.tab.map((col, ci) => {
    if(!col.length) return `<div class="cat-col" style="height:${ch}px">${catHuecoHTML({ onclick: `catClick('vacia',${ci})`, pista: pista && pista.t === 'col' && pista.i === ci })}</div>`;
    let y = 0;
    const cartas = col.map((x, k) => {
      const top = y;
      y += x.up ? abierta : cerrada;
      if(!x.up) return `<div class="cat-pos" style="top:${top}px">${catDorsoHTML({})}</div>`;
      const elegida = sel && sel.o === 'tab' && sel.col === ci && k >= sel.idx;
      const pistaAca = pista && pista.t === 'col' && pista.i === ci && k === col.length - 1;
      return `<div class="cat-pos" style="top:${top}px">${catCartaHTML(x.c, { onclick: `catClick('tab',${ci},${k})`, sel: elegida, pista: pistaAca })}</div>`;
    }).join('');
    const alto = y - (col[col.length - 1].up ? abierta : cerrada) + ch;
    return `<div class="cat-col" style="height:${alto}px">${cartas}</div>`;
  }).join('');

  const completas = cat.slots.filter(s => s.cartas.length === CAT_POR_CATEGORIA + 1).length;
  const fin = cat.nivelGanado ? `<div class="cat-fin">${gDialogoHTML('¡Nivel ' + cat.nivel + ' completo! 🎉', ['⭐'.repeat(cat.estrellas || 1) + '☆'.repeat(3 - (cat.estrellas || 1)), 'Armaste todas las categorías en ' + cat.movs + ' movimientos.'].join('<br>'))}<div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="catSiguienteNivel()">Siguiente nivel</button></div></div>` : '';

  cont.innerHTML = gEscenaHTML('cielo', `
    <div class="g-hud"><span class="g-pill">🏷️ ${completas}/${cat.n}</span><span class="g-pill">👆 ${cat.movs}</span><span class="g-pill">🪙 <span class="js-monedas">${monedasCoin}</span></span></div>
    <div class="cat-fila-mazo"><div class="cat-mazo-par">${mazoHTML}${descHTML}</div>
      <div class="cat-botones"><button class="gbtn gbtn-chico-texto" onclick="catDeshacer()" ${cat.historial.length ? '' : 'disabled'}>↩</button><button class="gbtn gbtn-chico-texto" onclick="catPedirPista()">💡 Pista</button><button class="gbtn gbtn-chico-texto" onclick="catNuevaPartida()">🔄</button></div></div>
    <div class="cat-tablero" style="--n:${cat.n}">
      <div class="cat-fila-slots">${slotsHTML}</div>
      <div class="cat-fila-cols">${columnasHTML}</div>
    </div>
    ${fin}`, 'cat-escena');

  const tablero = cont.querySelector('.cat-tablero');
  const disponible = tablero ? tablero.clientWidth : 0;
  if(disponible > 0){
    const gap = 6;
    const nuevo = Math.max(40, Math.min(84, Math.floor((disponible - (cat.n - 1) * gap) / cat.n)));
    if(nuevo !== cat.cw){ cat.cw = nuevo; catRender(); }
  }
}
