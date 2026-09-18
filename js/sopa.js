// Sopa de letras temática: destinos y cosas del micro/viaje, para buscar en
// una grilla de letras. Igual que Sudoku y Patrones, los puzzles ya vienen
// generados y verificados de antes (con un script de Node aparte que revisa
// que cada palabra esté realmente en la grilla) — acá no se genera nada al
// vuelo, solo se muestra y se juega.
//
// Para elegir una palabra se toca la primera letra y después la última
// (nada de arrastrar el dedo, para que funcione igual de bien en cualquier
// pantalla): si esas dos celdas forman una línea recta (horizontal,
// vertical o diagonal) y coinciden con una palabra pendiente —leída en
// cualquiera de los dos sentidos—, queda marcada como encontrada.

const SOPA_BANCO = {"facil":[{"size":8,"palabras":["PARANA","MICRO","GUARDA","BUTACA","SALTA","EQUIPAJE"],"grid":["AYOEXGWI","TIPJDUEQ","LVPARANA","AMXGGRFW","SDZIRDEO","EQUIPAJE","PACATUBQ","MICROFEO"],"posiciones":{"EQUIPAJE":{"inicio":[5,0],"fin":[5,7]},"PARANA":{"inicio":[2,2],"fin":[2,7]},"GUARDA":{"inicio":[0,5],"fin":[5,5]},"BUTACA":{"inicio":[6,6],"fin":[6,1]},"MICRO":{"inicio":[7,0],"fin":[7,4]},"SALTA":{"inicio":[4,0],"fin":[0,0]}}},{"size":8,"palabras":["CORDOBA","MALETA","USHUAIA","JUJUY","ALMOHADA","RUFINO"],"grid":["GABODROC","YYRILJEW","ADAHOMLA","ONIFURZV","USHUAIAU","ATELAMIK","WYUJUJYU","OUGUHMAG"],"posiciones":{"ALMOHADA":{"inicio":[2,7],"fin":[2,0]},"CORDOBA":{"inicio":[0,7],"fin":[0,1]},"USHUAIA":{"inicio":[4,0],"fin":[4,6]},"MALETA":{"inicio":[5,5],"fin":[5,0]},"RUFINO":{"inicio":[3,5],"fin":[3,0]},"JUJUY":{"inicio":[6,5],"fin":[6,1]}}},{"size":8,"palabras":["GUARDA","CORDOBA","FORMOSA","JUJUY","SALTA","MENDOZA"],"grid":["LMENDOZA","MLIDFEPQ","SLFBUCNG","VFORMOSA","NJUJUYRD","CORDOBAT","HGUARDAI","PYSALTAZ"],"posiciones":{"CORDOBA":{"inicio":[5,0],"fin":[5,6]},"FORMOSA":{"inicio":[3,1],"fin":[3,7]},"MENDOZA":{"inicio":[0,1],"fin":[0,7]},"GUARDA":{"inicio":[6,1],"fin":[6,6]},"JUJUY":{"inicio":[4,1],"fin":[4,5]},"SALTA":{"inicio":[7,2],"fin":[7,6]}}},{"size":8,"palabras":["MALETA","ROSARIO","CORDOBA","IGUAZU","TUCUMAN","BOLETO"],"grid":["OBOLETOO","DUZAUGII","BHHUDOER","GENOGOUA","TUCUMANS","ABODROCO","NVSBJAIR","LMALETAE"],"posiciones":{"ROSARIO":{"inicio":[6,7],"fin":[0,7]},"CORDOBA":{"inicio":[5,6],"fin":[5,0]},"TUCUMAN":{"inicio":[4,0],"fin":[4,6]},"MALETA":{"inicio":[7,1],"fin":[7,6]},"IGUAZU":{"inicio":[1,6],"fin":[1,1]},"BOLETO":{"inicio":[0,1],"fin":[0,6]}}},{"size":8,"palabras":["MICRO","TERMINAL","GUARDA","BUTACA","ROSARIO","VIAJE"],"grid":["XBBLAALQ","DJLOCDAB","TGQIARNE","BSMRTAIJ","KHQAUUMA","KZWSBGRI","BYNORJEV","MICROCTL"],"posiciones":{"TERMINAL":{"inicio":[7,6],"fin":[0,6]},"ROSARIO":{"inicio":[7,3],"fin":[1,3]},"GUARDA":{"inicio":[5,5],"fin":[0,5]},"BUTACA":{"inicio":[5,4],"fin":[0,4]},"MICRO":{"inicio":[7,0],"fin":[7,4]},"VIAJE":{"inicio":[6,7],"fin":[2,7]}}},{"size":8,"palabras":["CORDOBA","ALMOHADA","CINTURON","BUTACA","PARANA","EQUIPAJE"],"grid":["IENANYXA","LJWCODJL","MABORAYM","BPURUNIO","OITDTAXH","DUAONRSA","VQCBIALD","QEAACPZA"],"posiciones":{"ALMOHADA":{"inicio":[0,7],"fin":[7,7]},"CINTURON":{"inicio":[7,4],"fin":[0,4]},"EQUIPAJE":{"inicio":[7,1],"fin":[0,1]},"CORDOBA":{"inicio":[1,3],"fin":[7,3]},"BUTACA":{"inicio":[2,2],"fin":[7,2]},"PARANA":{"inicio":[7,5],"fin":[2,5]}}}],"dificil":[{"size":11,"palabras":["BUTACA","VENTANILLA","RUTA","JUJUY","MOCHILA","CORRIENTES","IGUAZU","CHOFER"],"grid":["HYUJUJJEOCK","GUZAUGINBRY","AMUFMBUTACA","SETNEIRROCI","IZIMUAOAGLP","YIUMOCHILAH","VRCHOFERADB","OURMUMTIUTA","ZTZDNWQJSMB","GAAVJBHBKWM","VENTANILLAM"],"posiciones":{"VENTANILLA":{"inicio":[10,0],"fin":[10,9]},"CORRIENTES":{"inicio":[3,9],"fin":[3,0]},"MOCHILA":{"inicio":[5,3],"fin":[5,9]},"BUTACA":{"inicio":[2,5],"fin":[2,10]},"IGUAZU":{"inicio":[1,6],"fin":[1,1]},"CHOFER":{"inicio":[6,2],"fin":[6,7]},"JUJUY":{"inicio":[0,5],"fin":[0,1]},"RUTA":{"inicio":[6,1],"fin":[9,1]}}},{"size":11,"palabras":["NEUQUEN","BUTACA","RUTA","RUFINO","PARANA","JUJUY","EQUIPAJE","MALETA"],"grid":["VKSISMALETA","DCKEBBMNYHI","ONIFUREMITO","NACATUBJZUS","IINRQQKMLBB","KMVUUVAKXLA","MOETOTPORHN","JNOUMMABPJA","RHDCLFAUSLR","ZTEQUIPAJEA","MUUJTJUJUYP"],"posiciones":{"EQUIPAJE":{"inicio":[9,2],"fin":[9,9]},"NEUQUEN":{"inicio":[7,1],"fin":[1,7]},"BUTACA":{"inicio":[3,6],"fin":[3,1]},"RUFINO":{"inicio":[2,5],"fin":[2,0]},"PARANA":{"inicio":[10,10],"fin":[5,10]},"MALETA":{"inicio":[0,5],"fin":[0,10]},"JUJUY":{"inicio":[10,5],"fin":[10,9]},"RUTA":{"inicio":[4,3],"fin":[7,6]}}},{"size":11,"palabras":["CORRIENTES","VIAJE","CATAMARCA","MENDOZA","TERMINAL","PARANA","ROSARIO","GUARDA"],"grid":["AZODNEMABDC","ADRAUGCPEVA","KOWTTROHSJT","UPYUTNROPKA","AOLHNOREJTM","NITERMINALA","ARTQNPEBGDR","RAPFOJNUHLC","ASSTXOTDNQA","POVIAJEECYR","NRPRBSSEFLM"],"posiciones":{"CORRIENTES":{"inicio":[1,6],"fin":[10,6]},"CATAMARCA":{"inicio":[0,10],"fin":[8,10]},"TERMINAL":{"inicio":[5,2],"fin":[5,9]},"MENDOZA":{"inicio":[0,6],"fin":[0,0]},"ROSARIO":{"inicio":[10,1],"fin":[4,1]},"PARANA":{"inicio":[9,0],"fin":[4,0]},"GUARDA":{"inicio":[1,5],"fin":[1,0]},"VIAJE":{"inicio":[9,2],"fin":[9,6]}}},{"size":11,"palabras":["GUARDA","RUTA","JUJUY","VENTANILLA","USHUAIA","BARILOCHE","ASIENTO","VIAJE"],"grid":["IIEOUBTBTRO","EXJVSQZARVT","BGAEHGNRACN","BBINUJWIJRE","YYVTAGMLUFI","FUJAIUIOJRS","WSDNAVKCUUA","ZCBIIMRHYTR","UVVLVXPEKAX","LYQLAHUJILW","KGUARDAZINN"],"posiciones":{"VENTANILLA":{"inicio":[1,3],"fin":[10,3]},"BARILOCHE":{"inicio":[0,7],"fin":[8,7]},"USHUAIA":{"inicio":[0,4],"fin":[6,4]},"ASIENTO":{"inicio":[6,10],"fin":[0,10]},"GUARDA":{"inicio":[10,1],"fin":[10,6]},"JUJUY":{"inicio":[3,8],"fin":[7,8]},"VIAJE":{"inicio":[4,2],"fin":[0,2]},"RUTA":{"inicio":[5,9],"fin":[8,9]}}},{"size":11,"palabras":["BOLETO","CORDOBA","MOCHILA","GUARDA","VENTANILLA","RUFINO","ALMOHADA","POSADAS"],"grid":["AGUARDAIOMX","LVSONIFURKC","LKAJUIGWPOL","IADJKCMGRAE","NLAWJOXDLHX","AISEGJOMLBM","THOEABOJOQO","NCPGAHTLAQW","EOZTATEYPRN","VMGDUTBUQYE","HAAYOOQNRJJ"],"posiciones":{"VENTANILLA":{"inicio":[9,0],"fin":[0,0]},"ALMOHADA":{"inicio":[3,9],"fin":[10,2]},"CORDOBA":{"inicio":[1,10],"fin":[7,4]},"MOCHILA":{"inicio":[9,1],"fin":[3,1]},"POSADAS":{"inicio":[7,2],"fin":[1,2]},"BOLETO":{"inicio":[5,9],"fin":[10,4]},"GUARDA":{"inicio":[0,1],"fin":[0,6]},"RUFINO":{"inicio":[1,8],"fin":[1,3]}}},{"size":11,"palabras":["JUJUY","BARILOCHE","MOCHILA","ASIENTO","EQUIPAJE","CORRIENTES","PASAJE","BOLETO"],"grid":["SROSITNCBGT","ZAENDHFOAAA","LWLEYSLRRSL","DDYUJUJRIII","IOVWNMQILEH","EQUIPAJEONC","EBOLETONCTO","TIQVYLDTHOM","UWODILYEEKQ","EJASAPCSZYU","KWKCPADSFNO"],"posiciones":{"CORRIENTES":{"inicio":[0,7],"fin":[9,7]},"BARILOCHE":{"inicio":[0,8],"fin":[8,8]},"EQUIPAJE":{"inicio":[5,0],"fin":[5,7]},"MOCHILA":{"inicio":[7,10],"fin":[1,10]},"ASIENTO":{"inicio":[1,9],"fin":[7,9]},"PASAJE":{"inicio":[9,5],"fin":[9,0]},"BOLETO":{"inicio":[6,1],"fin":[6,6]},"JUJUY":{"inicio":[3,6],"fin":[3,2]}}}]};

const SOPA_NOMBRE_NIVEL = { facil: 'Fácil', dificil: 'Difícil' };
const SOPA_PREMIO_PALABRA = 2;
const SOPA_PREMIO_COMPLETAR = { facil: 6, dificil: 9 };

let sopaNivel = null;
let sopaIndice = 0;
let sopaPuzzle = null;
let sopaEncontradas = new Set();
let sopaCeldasEncontradas = {};

function iniciarSopa(){
  sopaNivel = null;
  sopaAdjuntarListeners();
  renderSopa();
}

function sopaElegirNivel(nivel){
  sopaNivel = nivel;
  sopaIndice = Math.floor(Math.random() * SOPA_BANCO[nivel].length);
  sopaComenzar();
}

function sopaComenzar(){
  sopaPuzzle = SOPA_BANCO[sopaNivel][sopaIndice];
  sopaEncontradas = new Set();
  sopaCeldasEncontradas = {};
  sopaInicio = null;
  renderSopa();
}

function sopaOtroPuzzle(){
  sopaIndice = (sopaIndice + 1) % SOPA_BANCO[sopaNivel].length;
  sopaComenzar();
}

function sopaVolverANiveles(){
  sopaNivel = null;
  renderSopa();
}

function sopaClaveCelda(fila, col){ return `${fila}-${col}`; }

// Todas las celdas ya encontradas, para pintarlas distinto en la grilla.
function sopaCeldasEncontradasSet(){
  const set = new Set();
  Object.values(sopaCeldasEncontradas).forEach(celdas => celdas.forEach(([f,c]) => set.add(sopaClaveCelda(f,c))));
  return set;
}

// Selección por arrastre: apoyás el dedo en la primera letra, arrastrás
// hasta la última y soltás — se ve resaltada toda la línea a medida que
// pasás por las letras. También funciona con dos toques separados (apoyar
// y soltar en la primera letra sin arrastrar, después tocar la última) para
// quien prefiera ir letra por letra.
let sopaInicioArrastre = null;
let sopaFinArrastre = null;
let sopaArrastreActivo = false;

function sopaEsLineaRecta(inicio, fin){
  const df = fin.fila - inicio.fila, dc = fin.col - inicio.col;
  return df === 0 || dc === 0 || Math.abs(df) === Math.abs(dc);
}

// Todas las celdas entre inicio y fin (si forman línea recta), para
// resaltar la selección completa mientras se arrastra el dedo.
function sopaCeldasSeleccionActual(){
  if(!sopaInicioArrastre) return new Set();
  const inicio = sopaInicioArrastre;
  const fin = sopaFinArrastre || sopaInicioArrastre;
  if(!sopaEsLineaRecta(inicio, fin)) return new Set([sopaClaveCelda(inicio.fila, inicio.col)]);
  const df = Math.sign(fin.fila - inicio.fila), dc = Math.sign(fin.col - inicio.col);
  const largo = Math.max(Math.abs(fin.fila - inicio.fila), Math.abs(fin.col - inicio.col)) + 1;
  const set = new Set();
  let f = inicio.fila, c = inicio.col;
  for(let i = 0; i < largo; i++){ set.add(sopaClaveCelda(f, c)); f += df; c += dc; }
  return set;
}

function sopaFinalizarSeleccion(){
  const inicio = sopaInicioArrastre;
  const fin = sopaFinArrastre;
  sopaInicioArrastre = null;
  sopaFinArrastre = null;
  sopaArrastreActivo = false;

  if(!inicio || !fin || (inicio.fila === fin.fila && inicio.col === fin.col)){ renderSopa(); return; }
  if(!sopaEsLineaRecta(inicio, fin)){ renderSopa(); return; }

  const df = Math.sign(fin.fila - inicio.fila);
  const dc = Math.sign(fin.col - inicio.col);
  const largo = Math.max(Math.abs(fin.fila - inicio.fila), Math.abs(fin.col - inicio.col)) + 1;
  let leida = '';
  const celdas = [];
  let f = inicio.fila, c = inicio.col;
  for(let i = 0; i < largo; i++){
    leida += sopaPuzzle.grid[f][c];
    celdas.push([f, c]);
    f += df; c += dc;
  }
  const invertida = leida.split('').reverse().join('');
  const palabra = sopaPuzzle.palabras.find(p => !sopaEncontradas.has(p) && (p === leida || p === invertida));

  if(palabra){
    sopaEncontradas.add(palabra);
    sopaCeldasEncontradas[palabra] = celdas;
    ganarMonedas(SOPA_PREMIO_PALABRA);
    reproducirTono('correcto');
    if(sopaEncontradas.size === sopaPuzzle.palabras.length){
      const premio = SOPA_PREMIO_COMPLETAR[sopaNivel];
      setTimeout(() => {
        ganarMonedas(premio);
        reproducirTono('bonus');
        mostrarToast(`¡Sopa completa! +${premio} monedas`, 'gain');
        renderSopa();
      }, 350);
    }
  }
  renderSopa();
}

function sopaCeldaEnPunto(x, y){
  const el = document.elementFromPoint(x, y);
  const btn = el && el.closest ? el.closest('.sopa-celda') : null;
  if(!btn) return null;
  return { fila: Number(btn.dataset.fila), col: Number(btn.dataset.col) };
}

function sopaManejarInicio(celda){
  if(!sopaPuzzle || !celda) return;
  if(sopaInicioArrastre && !sopaArrastreActivo){
    // Ya había una primera letra elegida con un toque simple (sin arrastre):
    // este es el segundo toque, así que cierra la selección.
    if(celda.fila === sopaInicioArrastre.fila && celda.col === sopaInicioArrastre.col){
      sopaInicioArrastre = null; sopaFinArrastre = null; renderSopa();
      return;
    }
    sopaFinArrastre = celda;
    sopaFinalizarSeleccion();
    return;
  }
  sopaInicioArrastre = celda;
  sopaFinArrastre = celda;
  sopaArrastreActivo = true;
  renderSopa();
}

function sopaManejarMovimiento(celda){
  if(!sopaArrastreActivo || !celda || !sopaInicioArrastre) return;
  if(!sopaEsLineaRecta(sopaInicioArrastre, celda)) return;
  if(sopaFinArrastre && sopaFinArrastre.fila === celda.fila && sopaFinArrastre.col === celda.col) return;
  sopaFinArrastre = celda;
  renderSopa();
}

function sopaManejarFin(){
  if(!sopaArrastreActivo) return;
  sopaArrastreActivo = false;
  const inicio = sopaInicioArrastre, fin = sopaFinArrastre;
  if(inicio && fin && (inicio.fila !== fin.fila || inicio.col !== fin.col)){
    sopaFinalizarSeleccion(); // fue un arrastre real: ya cierra la selección
  }
  // si soltó en la misma celda (fue un toque simple), queda "armada" la
  // primera letra esperando el segundo toque — no se resetea acá.
}

// Delegado sobre el contenedor (no cada celda), así sigue funcionando
// después de que renderSopa() rearma todo el HTML de adentro.
function sopaAdjuntarListeners(){
  const cont = document.getElementById('sopa-content');
  if(!cont || cont.dataset.sopaListo) return;
  cont.dataset.sopaListo = '1';

  cont.addEventListener('pointerdown', e => {
    const celda = sopaCeldaEnPunto(e.clientX, e.clientY);
    if(!celda) return;
    e.preventDefault();
    sopaManejarInicio(celda);
  });
  cont.addEventListener('pointermove', e => {
    if(!sopaArrastreActivo) return;
    sopaManejarMovimiento(sopaCeldaEnPunto(e.clientX, e.clientY));
  });
  cont.addEventListener('pointerup', sopaManejarFin);
  cont.addEventListener('pointercancel', () => {
    sopaArrastreActivo = false; sopaInicioArrastre = null; sopaFinArrastre = null; renderSopa();
  });
}

function sopaCeldaHTML(fila, col, tamano){
  const letra = sopaPuzzle.grid[fila][col];
  const clave = sopaClaveCelda(fila, col);
  const encontrada = sopaCeldasEncontradasSet().has(clave);
  const seleccionada = sopaCeldasSeleccionActual().has(clave);
  const clases = ['sopa-celda'];
  if(encontrada) clases.push('sopa-celda-encontrada');
  if(seleccionada) clases.push('sopa-celda-seleccionada');
  return `<button class="${clases.join(' ')}" data-fila="${fila}" data-col="${col}" style="width:${tamano}px;height:${tamano}px;font-size:${Math.round(tamano*0.42)}px;">${letra}</button>`;
}

function renderSopaNiveles(){
  const cont = document.getElementById('sopa-content');
  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>🔎 Sopa de letras</h2>
      <p>Destinos y cosas del micro y del viaje, escondidos en la grilla. Arrastrá el dedo desde la primera letra hasta la última para marcar una palabra (o tocá una y después la otra, sin arrastrar).</p>
    </div>
    <div class="section-label">Elegí un nivel</div>
    ${Object.keys(SOPA_NOMBRE_NIVEL).map(n => `<button class="btn-primary" style="margin-bottom:10px;" onclick="sopaElegirNivel('${n}')">${SOPA_NOMBRE_NIVEL[n]}</button>`).join('')}`;
}

function renderSopaJuego(){
  const cont = document.getElementById('sopa-content');
  sopaAdjuntarListeners();
  const tamano = sopaPuzzle.size <= 8 ? 36 : 27;
  const filasHTML = sopaPuzzle.grid.map((_, fila) =>
    `<div class="sopa-fila">${sopaPuzzle.grid[fila].split('').map((_, col) => sopaCeldaHTML(fila, col, tamano)).join('')}</div>`
  ).join('');

  const listaHTML = sopaPuzzle.palabras.map(p =>
    `<span class="sopa-palabra ${sopaEncontradas.has(p) ? 'sopa-palabra-encontrada' : ''}">${p}</span>`
  ).join('');

  const completo = sopaEncontradas.size === sopaPuzzle.palabras.length;

  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>${completo ? '¡Completaste la sopa!' : `Nivel ${SOPA_NOMBRE_NIVEL[sopaNivel]}`}</h2>
      <p>${completo ? 'Encontraste las ' + sopaPuzzle.palabras.length + ' palabras.' : `Encontradas ${sopaEncontradas.size} de ${sopaPuzzle.palabras.length}`}</p>
    </div>
    <div class="sopa-grilla">${filasHTML}</div>
    <div class="sopa-lista-palabras">${listaHTML}</div>
    ${completo ? `<button class="btn-primary" onclick="sopaOtroPuzzle()">Jugar otra sopa</button>` : ''}
    <p class="link-chico" onclick="sopaVolverANiveles()">‹ Cambiar de nivel</p>`;
}

function renderSopa(){
  const cont = document.getElementById('sopa-content');
  if(!cont) return;
  document.getElementById('sopa-sub').textContent = sopaNivel ? `Nivel ${SOPA_NOMBRE_NIVEL[sopaNivel]}` : 'Elegí un nivel';
  if(sopaNivel && sopaPuzzle) renderSopaJuego();
  else renderSopaNiveles();
}
