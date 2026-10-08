// Sudoku: juego solo, sin cronómetro (como Memoria, acá importa pensar bien,
// no la velocidad). Tres niveles según cuántas celdas ya vienen dadas. Los
// 16 tableros de SUDOKU_BANCO están generados y verificados de antemano
// (solución única cada uno) — no se genera nada nuevo en el celular.

const SUDOKU_BANCO = {
  facil: [
    { puzzle: [[1,0,0,0,0,3,2,0,0],[0,0,8,6,4,0,1,7,0],[0,2,0,5,7,1,0,0,3],[0,0,6,9,2,0,3,0,7],[2,7,9,0,0,5,8,1,6],[5,0,0,0,0,0,0,0,0],[3,4,0,0,8,0,6,9,0],[0,0,0,0,5,9,7,0,0],[0,0,1,0,6,4,5,3,8]], solucion: [[1,5,7,8,9,3,2,6,4],[9,3,8,6,4,2,1,7,5],[6,2,4,5,7,1,9,8,3],[4,1,6,9,2,8,3,5,7],[2,7,9,4,3,5,8,1,6],[5,8,3,7,1,6,4,2,9],[3,4,5,1,8,7,6,9,2],[8,6,2,3,5,9,7,4,1],[7,9,1,2,6,4,5,3,8]] },
    { puzzle: [[0,5,3,2,0,0,0,4,7],[7,1,0,8,0,3,0,2,0],[2,0,0,7,0,4,0,3,8],[0,0,0,4,0,0,0,6,2],[4,0,2,5,0,7,0,0,3],[0,0,7,9,3,2,4,8,5],[0,0,1,0,0,5,8,9,0],[0,0,0,1,0,0,0,5,0],[9,0,0,0,2,0,3,7,0]], solucion: [[8,5,3,2,9,6,1,4,7],[7,1,4,8,5,3,6,2,9],[2,9,6,7,1,4,5,3,8],[5,3,9,4,8,1,7,6,2],[4,8,2,5,6,7,9,1,3],[1,6,7,9,3,2,4,8,5],[6,2,1,3,7,5,8,9,4],[3,7,8,1,4,9,2,5,6],[9,4,5,6,2,8,3,7,1]] },
    { puzzle: [[0,0,0,0,3,4,8,0,0],[3,5,6,0,7,0,2,0,0],[1,8,0,0,9,5,0,0,3],[0,2,9,1,0,7,3,0,0],[0,0,5,0,2,9,1,8,6],[8,4,0,5,6,0,0,0,2],[9,0,8,3,5,6,0,0,0],[5,1,0,0,0,0,6,0,8],[0,0,0,9,0,8,0,0,0]], solucion: [[2,9,7,6,3,4,8,1,5],[3,5,6,8,7,1,2,4,9],[1,8,4,2,9,5,7,6,3],[6,2,9,1,8,7,3,5,4],[7,3,5,4,2,9,1,8,6],[8,4,1,5,6,3,9,7,2],[9,7,8,3,5,6,4,2,1],[5,1,3,7,4,2,6,9,8],[4,6,2,9,1,8,5,3,7]] },
    { puzzle: [[3,2,6,0,8,0,0,0,0],[0,0,0,0,2,0,8,6,4],[4,0,5,6,1,9,7,2,0],[6,0,2,8,4,0,0,0,9],[0,0,0,9,3,0,2,0,6],[0,1,3,0,0,6,0,0,0],[0,6,1,4,0,0,0,5,7],[5,0,8,0,6,0,9,0,0],[0,4,9,0,0,0,6,0,8]], solucion: [[3,2,6,7,8,4,5,9,1],[1,9,7,5,2,3,8,6,4],[4,8,5,6,1,9,7,2,3],[6,7,2,8,4,5,1,3,9],[8,5,4,9,3,1,2,7,6],[9,1,3,2,7,6,4,8,5],[2,6,1,4,9,8,3,5,7],[5,3,8,1,6,7,9,4,2],[7,4,9,3,5,2,6,1,8]] },
    { puzzle: [[8,0,3,0,4,6,2,5,0],[4,0,9,1,0,2,8,0,0],[5,2,0,8,0,3,0,0,0],[9,5,0,0,0,0,0,3,8],[0,4,0,3,0,9,5,7,0],[0,3,7,0,2,0,4,0,0],[0,9,1,0,8,5,3,4,0],[0,8,0,0,7,0,1,0,0],[0,6,0,0,0,0,9,8,0]], solucion: [[8,1,3,7,4,6,2,5,9],[4,7,9,1,5,2,8,6,3],[5,2,6,8,9,3,7,1,4],[9,5,2,4,1,7,6,3,8],[1,4,8,3,6,9,5,7,2],[6,3,7,5,2,8,4,9,1],[2,9,1,6,8,5,3,4,7],[3,8,5,9,7,4,1,2,6],[7,6,4,2,3,1,9,8,5]] },
    { puzzle: [[0,0,5,7,9,0,0,1,3],[4,0,0,0,2,3,7,9,0],[0,7,3,0,0,0,8,0,2],[7,0,0,0,0,0,9,3,0],[0,0,4,3,7,9,1,0,5],[3,9,1,0,0,0,0,7,4],[5,3,0,4,8,0,6,2,0],[0,6,0,0,3,0,0,4,0],[0,0,0,0,5,2,0,0,7]], solucion: [[6,2,5,7,9,8,4,1,3],[4,1,8,5,2,3,7,9,6],[9,7,3,1,4,6,8,5,2],[7,5,6,2,1,4,9,3,8],[2,8,4,3,7,9,1,6,5],[3,9,1,8,6,5,2,7,4],[5,3,7,4,8,1,6,2,9],[8,6,2,9,3,7,5,4,1],[1,4,9,6,5,2,3,8,7]] },
  ],
  medio: [
    { puzzle: [[0,0,0,0,0,0,9,7,0],[0,5,8,0,0,9,0,0,0],[0,0,1,3,4,0,0,0,0],[0,0,7,2,3,1,8,0,0],[0,0,2,8,9,6,0,1,0],[1,8,0,4,0,0,0,0,0],[4,0,5,0,0,3,0,0,1],[9,0,0,1,0,0,0,0,2],[8,0,0,5,6,0,4,0,0]], solucion: [[2,3,4,6,1,5,9,7,8],[6,5,8,7,2,9,1,3,4],[7,9,1,3,4,8,5,2,6],[5,6,7,2,3,1,8,4,9],[3,4,2,8,9,6,7,1,5],[1,8,9,4,5,7,2,6,3],[4,2,5,9,7,3,6,8,1],[9,7,6,1,8,4,3,5,2],[8,1,3,5,6,2,4,9,7]] },
    { puzzle: [[4,0,0,0,0,3,0,0,0],[0,0,3,9,2,0,6,1,7],[0,0,0,1,0,0,0,9,0],[1,5,0,0,0,9,3,0,0],[0,0,0,7,5,0,0,0,0],[8,2,0,0,4,0,0,7,5],[0,0,0,4,0,7,0,0,0],[0,0,5,0,1,8,0,0,0],[7,4,1,5,0,0,0,3,2]], solucion: [[4,1,9,6,7,3,2,5,8],[5,8,3,9,2,4,6,1,7],[6,7,2,1,8,5,4,9,3],[1,5,7,8,6,9,3,2,4],[9,3,4,7,5,2,1,8,6],[8,2,6,3,4,1,9,7,5],[2,9,8,4,3,7,5,6,1],[3,6,5,2,1,8,7,4,9],[7,4,1,5,9,6,8,3,2]] },
    { puzzle: [[0,0,0,0,0,0,0,0,3],[0,6,3,4,2,0,0,0,0],[0,0,0,0,0,8,5,0,2],[0,5,0,8,0,0,9,0,0],[2,0,6,7,5,0,0,1,0],[0,0,0,6,9,0,0,0,4],[6,0,4,5,0,9,0,0,1],[1,8,0,0,0,7,0,0,0],[5,3,9,0,0,0,8,4,0]], solucion: [[9,2,5,1,7,6,4,8,3],[8,6,3,4,2,5,1,7,9],[7,4,1,9,3,8,5,6,2],[4,5,7,8,1,3,9,2,6],[2,9,6,7,5,4,3,1,8],[3,1,8,6,9,2,7,5,4],[6,7,4,5,8,9,2,3,1],[1,8,2,3,4,7,6,9,5],[5,3,9,2,6,1,8,4,7]] },
    { puzzle: [[0,0,9,0,1,0,8,6,0],[0,0,0,8,0,2,0,7,0],[3,4,8,0,0,9,0,0,5],[8,0,1,6,3,4,0,0,2],[4,0,0,0,0,0,0,0,0],[2,0,7,0,0,0,0,0,9],[0,0,4,0,8,0,0,2,1],[0,1,0,0,0,0,6,0,0],[6,0,0,2,0,1,0,4,0]], solucion: [[7,2,9,3,1,5,8,6,4],[1,5,6,8,4,2,9,7,3],[3,4,8,7,6,9,2,1,5],[8,9,1,6,3,4,7,5,2],[4,3,5,9,2,7,1,8,6],[2,6,7,1,5,8,4,3,9],[9,7,4,5,8,6,3,2,1],[5,1,2,4,7,3,6,9,8],[6,8,3,2,9,1,5,4,7]] },
    { puzzle: [[0,0,6,2,7,0,4,9,3],[0,4,0,0,5,0,0,0,1],[8,0,0,0,0,0,0,0,0],[0,6,0,0,0,3,9,0,0],[0,3,0,0,9,0,0,7,5],[0,0,0,1,0,0,3,2,0],[0,1,0,9,0,6,0,3,2],[9,0,0,3,0,0,0,0,0],[0,8,3,0,0,7,1,4,0]], solucion: [[1,5,6,2,7,8,4,9,3],[3,4,7,6,5,9,2,8,1],[8,2,9,4,3,1,5,6,7],[2,6,5,7,4,3,9,1,8],[4,3,1,8,9,2,6,7,5],[7,9,8,1,6,5,3,2,4],[5,1,4,9,8,6,7,3,2],[9,7,2,3,1,4,8,5,6],[6,8,3,5,2,7,1,4,9]] },
    { puzzle: [[0,0,8,0,0,2,1,0,4],[0,0,0,7,4,6,9,0,0],[0,0,0,0,8,9,0,0,0],[0,0,1,2,0,0,0,9,0],[3,0,0,0,9,0,0,0,5],[0,5,9,3,0,0,0,2,6],[0,4,0,0,2,5,0,0,0],[5,0,0,0,0,0,0,0,0],[0,6,0,4,1,3,5,8,2]], solucion: [[7,9,8,5,3,2,1,6,4],[2,1,5,7,4,6,9,3,8],[4,3,6,1,8,9,2,5,7],[6,7,1,2,5,4,8,9,3],[3,2,4,6,9,8,7,1,5],[8,5,9,3,7,1,4,2,6],[1,4,3,8,2,5,6,7,9],[5,8,2,9,6,7,3,4,1],[9,6,7,4,1,3,5,8,2]] },
  ],
  dificil: [
    { puzzle: [[0,8,0,0,0,0,0,0,5],[1,0,7,0,4,0,0,0,0],[0,0,0,3,0,2,0,0,8],[0,0,0,4,3,0,9,0,0],[8,0,0,2,0,0,0,4,0],[3,5,0,9,0,0,0,0,2],[0,0,8,0,0,0,0,0,0],[0,0,1,0,0,0,0,6,0],[7,9,3,8,5,0,0,0,0]], solucion: [[4,8,2,6,1,9,7,3,5],[1,3,7,5,4,8,2,9,6],[9,6,5,3,7,2,4,1,8],[2,7,6,4,3,5,9,8,1],[8,1,9,2,6,7,5,4,3],[3,5,4,9,8,1,6,7,2],[6,2,8,1,9,4,3,5,7],[5,4,1,7,2,3,8,6,9],[7,9,3,8,5,6,1,2,4]] },
    { puzzle: [[0,2,0,0,0,0,9,0,0],[0,0,4,0,0,5,7,0,1],[0,0,0,0,3,0,0,0,4],[0,0,2,5,8,0,0,0,0],[0,0,0,3,0,0,0,5,0],[0,0,5,6,0,9,1,2,0],[4,0,1,0,0,0,0,0,0],[0,0,0,8,2,0,5,1,9],[0,0,0,0,6,0,0,0,0]], solucion: [[1,2,8,4,7,6,9,3,5],[6,3,4,2,9,5,7,8,1],[5,9,7,1,3,8,2,6,4],[3,1,2,5,8,7,4,9,6],[9,4,6,3,1,2,8,5,7],[8,7,5,6,4,9,1,2,3],[4,8,1,9,5,3,6,7,2],[7,6,3,8,2,4,5,1,9],[2,5,9,7,6,1,3,4,8]] },
    { puzzle: [[0,0,7,0,9,0,0,3,0],[0,0,0,0,0,3,2,5,0],[9,3,0,0,0,1,0,0,0],[0,9,0,1,0,0,4,0,0],[0,0,6,2,0,5,0,0,0],[0,4,5,0,0,0,1,0,0],[3,0,4,0,5,0,9,0,0],[7,0,0,0,0,0,0,0,6],[0,0,0,0,8,9,0,0,0]], solucion: [[5,2,7,6,9,4,8,3,1],[4,6,1,8,7,3,2,5,9],[9,3,8,5,2,1,6,7,4],[8,9,3,1,6,7,4,2,5],[1,7,6,2,4,5,3,9,8],[2,4,5,9,3,8,1,6,7],[3,1,4,7,5,6,9,8,2],[7,8,9,3,1,2,5,4,6],[6,5,2,4,8,9,7,1,3]] },
    { puzzle: [[1,0,2,0,0,0,0,4,5],[0,6,0,3,0,8,0,0,0],[5,0,8,0,0,0,0,0,0],[4,8,0,9,0,0,0,0,0],[0,0,0,0,0,4,7,0,0],[7,0,0,0,0,6,0,5,0],[0,0,0,0,0,0,2,7,0],[8,9,0,1,7,0,0,3,0],[0,0,7,0,0,0,0,0,8]], solucion: [[1,3,2,7,6,9,8,4,5],[9,6,4,3,5,8,1,2,7],[5,7,8,4,2,1,6,9,3],[4,8,5,9,1,7,3,6,2],[6,2,9,5,3,4,7,8,1],[7,1,3,2,8,6,4,5,9],[3,4,1,8,9,5,2,7,6],[8,9,6,1,7,2,5,3,4],[2,5,7,6,4,3,9,1,8]] },
  ],
};

const SUDOKU_NOMBRE_NIVEL = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
const SUDOKU_PREMIO_NIVEL = { facil: 15, medio: 20, dificil: 25 };

let sudokuNivelElegido = 'facil';
let sudokuPuzzle = null;
let sudokuSolucion = null;
let sudokuTablero = null; // lo que va tocando el jugador, arranca como copia del puzzle
let sudokuSeleccion = null; // {r,c} o null
let sudokuErrores = 0;
let sudokuFase = 'inicio'; // 'inicio' | 'jugando' | 'ganado'

function iniciarSudoku(){
  sudokuFase = 'inicio';
  renderSudoku();
}

function sudokuElegirNivel(nivel){
  sudokuNivelElegido = nivel;
  renderSudoku();
}

function sudokuComenzar(){
  const banco = SUDOKU_BANCO[sudokuNivelElegido];
  const elegido = banco[Math.floor(Math.random() * banco.length)];
  sudokuPuzzle = elegido.puzzle;
  sudokuSolucion = elegido.solucion;
  sudokuTablero = elegido.puzzle.map(fila => fila.slice());
  sudokuSeleccion = null;
  sudokuErrores = 0;
  sudokuFase = 'jugando';
  renderSudoku();
}

function sudokuEsFija(r, c){ return sudokuPuzzle[r][c] !== 0; }

function sudokuTocarCelda(r, c){
  if(sudokuFase !== 'jugando' || sudokuEsFija(r, c)) return;
  sudokuSeleccion = { r, c };
  renderSudoku();
}

function sudokuCompleto(){
  for(let r = 0; r < 9; r++) for(let c = 0; c < 9; c++){
    if(sudokuTablero[r][c] !== sudokuSolucion[r][c]) return false;
  }
  return true;
}

function sudokuIngresarNumero(n){
  if(sudokuFase !== 'jugando' || !sudokuSeleccion) return;
  const { r, c } = sudokuSeleccion;
  sudokuTablero[r][c] = n;
  const correcto = n === sudokuSolucion[r][c];
  reproducirTono(correcto ? 'correcto' : 'incorrecto');
  if(!correcto) sudokuErrores++;
  if(sudokuCompleto()){
    sudokuFase = 'ganado';
    const premio = SUDOKU_PREMIO_NIVEL[sudokuNivelElegido] + (sudokuErrores === 0 ? 10 : 0);
    ganarMonedas(premio);
    reproducirTono('bonus');
    mostrarToast(sudokuErrores === 0 ? `¡Sudoku perfecto, sin errores! +${premio} monedas` : `¡Completaste el sudoku! +${premio} monedas`, 'gain');
  }
  renderSudoku();
}

function sudokuBorrarCelda(){
  if(sudokuFase !== 'jugando' || !sudokuSeleccion) return;
  const { r, c } = sudokuSeleccion;
  sudokuTablero[r][c] = 0;
  renderSudoku();
}

function sudokuCeldaClases(r, c){
  const clases = ['sd-celda'];
  const valor = sudokuTablero[r][c];
  if(sudokuEsFija(r, c)) clases.push('sd-celda-fija');
  else if(valor !== 0){
    clases.push(valor === sudokuSolucion[r][c] ? 'sd-celda-correcta' : 'sd-celda-incorrecta');
  }
  if(sudokuSeleccion){
    const { r: sr, c: sc } = sudokuSeleccion;
    if(sr === r && sc === c) clases.push('sd-celda-elegida');
    else if(sr === r || sc === c || (Math.floor(sr / 3) === Math.floor(r / 3) && Math.floor(sc / 3) === Math.floor(c / 3))) clases.push('sd-celda-relacion');
    if(valor !== 0 && valor === sudokuTablero[sr][sc] && !(sr === r && sc === c)) clases.push('sd-celda-igual');
  }
  if((c + 1) % 3 === 0 && c !== 8) clases.push('sd-borde-derecho');
  if((r + 1) % 3 === 0 && r !== 8) clases.push('sd-borde-abajo');
  return clases.join(' ');
}

function renderSudoku(){
  const cont = document.getElementById('sudoku-content');
  if(!cont) return;
  document.getElementById('view-sudoku').classList.toggle('juego-inmersivo', sudokuFase === 'jugando');

  if(sudokuFase === 'inicio'){
    document.getElementById('sudoku-sub').textContent = 'Elegí un nivel';
    cont.innerHTML = gEscenaHTML('noche', `
      ${gDialogoHTML('🔢 Sudoku', 'Completá el tablero para que cada fila, columna y cuadro de 3x3 tenga los números del 1 al 9 sin repetir.')}
      <div class="g-dialogo-sub" style="text-align:center;margin:6px 0;font-weight:700;">Elegí el nivel</div>
      <div class="g-acciones g-acciones-3">
        ${Object.keys(SUDOKU_NOMBRE_NIVEL).map(n => `<button class="gbtn ${sudokuNivelElegido === n ? 'gbtn-sel' : 'gbtn-no'}" onclick="sudokuElegirNivel('${n}')">${SUDOKU_NOMBRE_NIVEL[n]}</button>`).join('')}
      </div>
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="sudokuComenzar()">Comenzar</button></div>`);
    return;
  }

  document.getElementById('sudoku-sub').textContent = `Nivel ${SUDOKU_NOMBRE_NIVEL[sudokuNivelElegido]}`;

  if(sudokuFase === 'ganado'){
    cont.innerHTML = gEscenaHTML('noche', `
      <div class="vj-portada">🏁</div>
      ${gDialogoHTML('¡Completaste el Sudoku!', sudokuErrores === 0 ? 'Sin ningún error: perfecto.' : `Con ${sudokuErrores} error${sudokuErrores === 1 ? '' : 'es'} en el camino.`)}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="iniciarSudoku()">Jugar de nuevo</button></div>`);
    return;
  }

  const filasHTML = sudokuTablero.map((fila, r) => `
    <div class="sd-fila">
      ${fila.map((valor, c) => `<button class="${sudokuCeldaClases(r, c)}" ${sudokuEsFija(r, c) ? 'disabled' : ''} onclick="sudokuTocarCelda(${r},${c})">${valor || ''}</button>`).join('')}
    </div>`).join('');

  const numerosHTML = [1,2,3,4,5,6,7,8,9].map(n => `<button class="sd-tecla" onclick="sudokuIngresarNumero(${n})">${n}</button>`).join('');

  cont.innerHTML = gEscenaHTML('noche', `
    <div class="g-hud"><span class="g-pill">❌ ${sudokuErrores}</span><span class="g-pill">${SUDOKU_NOMBRE_NIVEL[sudokuNivelElegido]}</span><span class="g-pill">🪙 <span class="js-monedas">${monedasCoin}</span></span></div>
    <div class="sd-tablero">${filasHTML}</div>
    <div class="sd-teclado">${numerosHTML}<button class="sd-tecla sd-tecla-borrar" onclick="sudokuBorrarCelda()">✕</button></div>
    <div class="g-pie"><span onclick="iniciarSudoku()">‹ Elegir otro nivel</span></div>`);
}
