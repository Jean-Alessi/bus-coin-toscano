// Laberinto del Micro (comecocos), Defensa del Garage (tanquecitos) y Pinball,
// sobre el motor de arcade.js. La B de Busmac aparece como pieza de cada uno:
// la pastilla de poder, el garage que hay que defender y los rebotadores.

// ---- Laberinto del Micro ----

const LAB_MAPA = [
  '###############',
  '#o...........o#',
  '#.###.###.###.#',
  '#.............#',
  '#.##.#####.##.#',
  '#.##.......##.#',
  '#....## ##....#',
  '####.## ##.####',
  '####.#   #.####',
  '####.#####.####',
  '#.............#',
  '#.#.#.###.#.#.#',
  '#.#...###...#.#',
  '#.#.#.....#.#.#',
  '#...#.###.#...#',
  '#.#.........#.#',
  '#.#.##...##.#.#',
  '#o..#.....#..o#',
  '#.###.###.###.#',
  '#.............#',
  '###############',
];

function arcCrearLaberinto(){
  const COLS = 15, FILAS = 21, C = 20, ANCHO = 300, ALTO = 446;
  const DIRS = { izq: [-1, 0], der: [1, 0], arr: [0, -1], abj: [0, 1] };
  const COLORES_CAMION = ['#E5484D', '#FF9A3D', '#E25BC4', '#2FB5B5'];
  const libre = (x, y) => y >= 0 && y < FILAS && x >= 0 && x < COLS && LAB_MAPA[y][x] !== '#';
  const esCasa = (x, y) => (y === 8 && x >= 6 && x <= 8) || (x === 7 && y === 7);

  const j = {
    ancho: ANCHO, alto: ALTO,
    nivel: 1, vidas: 3, puntaje: 0, puntos: [], restantes: 0, comidos: 0,
    bus: null, camiones: [], miedo: 0, combo: 0, estado: 'listo', espera: 1.4,
    muriendo: 0, terminado: false, t: 0,
  };

  function llenarPuntos(){
    j.puntos = LAB_MAPA.map(f => f.split('').map(c => c === '.' ? 1 : c === 'o' ? 2 : 0));
    j.restantes = j.puntos.reduce((s, f) => s + f.filter(Boolean).length, 0);
  }

  function nuevaEntidad(x, y){ return { x, y, nx: x, ny: y, prog: 0, dir: [0, 0] }; }

  function ponerPersonajes(){
    j.bus = nuevaEntidad(7, 19);
    j.bus.dir = [-1, 0];
    j.bus.want = [-1, 0];
    j.camiones = [[7, 6], [6, 8], [7, 8], [8, 8]].map((p, i) => {
      const c = nuevaEntidad(p[0], p[1]);
      c.id = i; c.color = COLORES_CAMION[i];
      c.estado = i === 0 ? 'caza' : 'casa';
      c.espera = i === 0 ? 0 : 1.5 + i * 2.2;
      c.dir = [i % 2 ? 1 : -1, 0];
      return c;
    });
    j.miedo = 0; j.combo = 0;
    j.estado = 'listo'; j.espera = 1.4;
  }

  function llegoAlSiguiente(e){ e.x = e.nx; e.y = e.ny; e.prog = 0; }

  // Avanza una entidad por el laberinto; 'decidir' elige hacia dónde seguir en cada cruce.
  function mover(e, vel, dt, decidir, alLlegar){
    let paso = vel * dt, guardia = 0;
    while(paso > 0 && guardia++ < 5){
      if(e.nx === e.x && e.ny === e.y){
        decidir(e);
        if(e.nx === e.x && e.ny === e.y){ e.prog = 0; return; }
        e.prog = 0;
      }
      const falta = 1 - e.prog;
      if(paso >= falta){
        paso -= falta;
        llegoAlSiguiente(e);
        if(alLlegar) alLlegar(e);
        e.nx = e.x; e.ny = e.y;
      } else {
        e.prog += paso; paso = 0;
      }
    }
  }
  function invertir(e){
    const x = e.x, y = e.y;
    e.x = e.nx; e.y = e.ny; e.nx = x; e.ny = y; e.prog = 1 - e.prog;
    e.dir = [-e.dir[0], -e.dir[1]];
  }
  function posicion(e){
    return [(e.x + (e.nx - e.x) * e.prog) * C + C / 2, (e.y + (e.ny - e.y) * e.prog) * C + C / 2];
  }

  function decidirBus(e){
    const w = e.want;
    if(w && libre(e.x + w[0], e.y + w[1])){ e.dir = w; }
    else if(!libre(e.x + e.dir[0], e.y + e.dir[1])){ e.nx = e.x; e.ny = e.y; return; }
    e.nx = e.x + e.dir[0]; e.ny = e.y + e.dir[1];
  }
  function alLlegarBus(e){
    const p = j.puntos[e.y][e.x];
    if(!p) return;
    j.puntos[e.y][e.x] = 0; j.restantes--;
    if(p === 1){
      j.puntaje += 10; j.comidos++;
      if(j.premio && j.comidos % 40 === 0) j.premio(1);
      reproducirTono('tick');
    } else {
      j.puntaje += 50; j.combo = 0;
      j.miedo = Math.max(3, 7 - j.nivel * 0.5);
      j.camiones.forEach(c => { if(c.estado === 'caza' || c.estado === 'sale'){ c.estado = 'asusta'; if(c.nx !== c.x || c.ny !== c.y) invertir(c); } });
      reproducirTono('bonus');
    }
  }

  function objetivoCamion(c){
    const b = j.bus;
    if(c.estado === 'ojos') return [7, 8];
    if(c.estado === 'sale') return [7, 5];
    if(c.id === 0) return [b.x, b.y];
    if(c.id === 1) return [b.x + b.dir[0] * 3, b.y + b.dir[1] * 3];
    if(c.id === 2) return Math.random() < 0.5 ? [1, 1] : [13, 19];
    return Math.hypot(c.x - b.x, c.y - b.y) > 6 ? [b.x, b.y] : [1, 19];
  }
  function decidirCamion(c){
    const opciones = Object.values(DIRS).filter(d => {
      const nx = c.x + d[0], ny = c.y + d[1];
      if(!libre(nx, ny)) return false;
      if(d[0] === -c.dir[0] && d[1] === -c.dir[1]) return false;
      if((c.estado === 'caza' || c.estado === 'asusta') && esCasa(nx, ny)) return false;
      return true;
    });
    let elegida;
    if(!opciones.length){
      elegida = [-c.dir[0], -c.dir[1]];
      if(!libre(c.x + elegida[0], c.y + elegida[1])){ c.nx = c.x; c.ny = c.y; return; }
    } else if(c.estado === 'asusta' || (c.estado === 'caza' && Math.random() < 0.2)){
      elegida = opciones[Math.floor(Math.random() * opciones.length)];
    } else {
      const obj = objetivoCamion(c);
      elegida = opciones.reduce((mejor, d) => {
        const dist = (c.x + d[0] - obj[0]) ** 2 + (c.y + d[1] - obj[1]) ** 2 + Math.random() * 0.01;
        return !mejor || dist < mejor.dist ? { d, dist } : mejor;
      }, null).d;
    }
    c.dir = elegida; c.nx = c.x + elegida[0]; c.ny = c.y + elegida[1];
  }
  function alLlegarCamion(c){
    if(c.estado === 'sale' && c.y <= 5) c.estado = 'caza';
    if(c.estado === 'ojos' && c.x === 7 && c.y === 8){ c.estado = 'casa'; c.espera = 1.5; }
  }

  llenarPuntos();
  ponerPersonajes();

  j.deslizar = (dir) => {
    const d = DIRS[dir];
    if(!d || j.estado === 'muerto') return;
    j.bus.want = d;
    const b = j.bus;
    if(d[0] === -b.dir[0] && d[1] === -b.dir[1] && (b.nx !== b.x || b.ny !== b.y)){ invertir(b); b.dir = d; }
  };
  j.tecla = (k) => {
    const mapa = { ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'arr', ArrowDown: 'abj', a: 'izq', d: 'der', w: 'arr', s: 'abj' };
    if(mapa[k]) j.deslizar(mapa[k]);
  };
  j.toque = (x, y) => {
    // Sin deslizar: tocar a un lado, arriba o abajo del micro lo hace girar hacia ahí.
    const [px, py] = posicion(j.bus);
    const dx = x - px, dy = y - py;
    j.deslizar(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'izq' : 'der') : (dy < 0 ? 'arr' : 'abj'));
  };

  function perder(){
    j.estado = 'muerto'; j.muriendo = 0.001; reproducirTono('fin');
  }

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.estado === 'listo'){
      j.espera -= dt;
      if(j.espera <= 0) j.estado = 'jugando';
      return;
    }
    if(j.estado === 'muerto'){
      j.muriendo += dt;
      if(j.muriendo > 1){
        j.vidas--;
        if(j.vidas <= 0){ j.terminado = true; return; }
        ponerPersonajes();
      }
      return;
    }
    if(j.estado === 'nivel'){
      j.espera -= dt;
      if(j.espera <= 0){ j.nivel++; llenarPuntos(); ponerPersonajes(); }
      return;
    }
    if(j.miedo > 0){
      j.miedo -= dt;
      if(j.miedo <= 0){ j.camiones.forEach(c => { if(c.estado === 'asusta') c.estado = 'caza'; }); }
    }
    const velBus = 4.6 + j.nivel * 0.15; // casillas por segundo (antes 6.6: muy rápido)
    mover(j.bus, velBus, dt, decidirBus, alLlegarBus);

    j.camiones.forEach(c => {
      if(c.estado === 'casa'){
        c.espera -= dt;
        if(c.espera <= 0){ c.estado = 'sale'; c.dir = [0, -1]; }
        return;
      }
      const vel = c.estado === 'ojos' ? 9 : c.estado === 'asusta' ? 2.6 : 3.8 + j.nivel * 0.15;
      mover(c, vel, dt, decidirCamion, alLlegarCamion);
    });

    const [bx, by] = posicion(j.bus);
    for(const c of j.camiones){
      if(c.estado === 'casa' || c.estado === 'ojos') continue;
      const [cx, cy] = posicion(c);
      if(Math.hypot(bx - cx, by - cy) > C * 0.62) continue;
      if(c.estado === 'asusta'){
        c.estado = 'ojos';
        j.combo++;
        j.puntaje += 200 * j.combo;
        reproducirTono('correcto');
      } else {
        perder();
        return;
      }
    }
    if(j.restantes <= 0){
      j.estado = 'nivel'; j.espera = 1.3;
      if(j.premio) j.premio(3);
      reproducirTono('bonus');
    }
  };

  function paredes(ctx){
    for(let y = 0; y < FILAS; y++){
      for(let x = 0; x < COLS; x++){
        if(LAB_MAPA[y][x] !== '#') continue;
        const px = x * C, py = y * C;
        ctx.fillStyle = '#2A4BD8';
        arcRR(ctx, px + 3, py + 3, C - 6, C - 6, 4); ctx.fill();
        if(x + 1 < COLS && LAB_MAPA[y][x + 1] === '#') ctx.fillRect(px + C - 4, py + 3, 8, C - 6);
        if(y + 1 < FILAS && LAB_MAPA[y + 1][x] === '#') ctx.fillRect(px + 3, py + C - 4, C - 6, 8);
      }
    }
    ctx.fillStyle = '#0B1236';
    for(let y = 0; y < FILAS; y++){
      for(let x = 0; x < COLS; x++){
        if(LAB_MAPA[y][x] !== '#') continue;
        const px = x * C, py = y * C;
        arcRR(ctx, px + 6, py + 6, C - 12, C - 12, 2); ctx.fill();
        if(x + 1 < COLS && LAB_MAPA[y][x + 1] === '#') ctx.fillRect(px + C - 6, py + 6, 12, C - 12);
        if(y + 1 < FILAS && LAB_MAPA[y + 1][x] === '#') ctx.fillRect(px + 6, py + C - 6, C - 12, 12);
      }
    }
  }

  function dibujarMicro(ctx, x, y, dir, escala){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(dir[1], dir[0]) + Math.PI / 2);
    ctx.scale(escala, escala);
    ctx.fillStyle = '#0F2A4D'; arcRR(ctx, -6.5, -8.5, 13, 17, 3.5); ctx.fill();
    ctx.fillStyle = '#E6A817'; ctx.fillRect(-6.5, -0.5, 13, 2.4);
    ctx.fillStyle = '#BFE6FF'; arcRR(ctx, -5, -7.5, 10, 4, 1.5); ctx.fill();
    ctx.fillStyle = '#FFF3B0'; ctx.fillRect(-5.5, -9, 2.4, 1.6); ctx.fillRect(3.1, -9, 2.4, 1.6);
    ctx.restore();
  }

  function dibujarCamion(ctx, c){
    const [x, y] = posicion(c);
    const asustado = c.estado === 'asusta';
    const parpadea = asustado && j.miedo < 1.6 && Math.floor(j.t * 8) % 2 === 0;
    if(c.estado !== 'ojos'){
      ctx.fillStyle = asustado ? (parpadea ? '#fff' : '#3B5BFF') : c.color;
      arcRR(ctx, x - 8, y - 8, 16, 14, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.arc(x - 4.5, y + 7, 2.6, 0, 7); ctx.arc(x + 4.5, y + 7, 2.6, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - 3.2, y - 2, 2.6, 0, 7); ctx.arc(x + 3.2, y - 2, 2.6, 0, 7); ctx.fill();
    ctx.fillStyle = asustado ? '#fff' : '#0F2A4D';
    const ox = c.dir[0] * 1.2, oy = c.dir[1] * 1.2;
    ctx.beginPath(); ctx.arc(x - 3.2 + ox, y - 2 + oy, 1.2, 0, 7); ctx.arc(x + 3.2 + ox, y - 2 + oy, 1.2, 0, 7); ctx.fill();
    if(asustado && !parpadea){
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x - 4, y + 3); ctx.lineTo(x - 2, y + 1.5); ctx.lineTo(x, y + 3); ctx.lineTo(x + 2, y + 1.5); ctx.lineTo(x + 4, y + 3); ctx.stroke();
    }
  }

  j.dibujar = (ctx) => {
    ctx.fillStyle = '#0B1236'; ctx.fillRect(0, 0, ANCHO, ALTO);
    paredes(ctx);
    // Puertita de la casa
    ctx.fillStyle = '#FF9AD5'; ctx.fillRect(7 * C + 2, 7 * C + C - 3, C - 4, 3);

    for(let y = 0; y < FILAS; y++){
      for(let x = 0; x < COLS; x++){
        const p = j.puntos[y][x];
        if(p === 1){
          ctx.fillStyle = '#FFE9A6'; ctx.beginPath(); ctx.arc(x * C + C / 2, y * C + C / 2, 2.3, 0, 7); ctx.fill();
        } else if(p === 2){
          // Pastilla de poder: la B de Busmac
          arcLogo(ctx, x * C + C / 2, y * C + C / 2, 19 + Math.sin(j.t * 6) * 1.5, '#fff');
        }
      }
    }

    j.camiones.forEach(c => dibujarCamion(ctx, c));
    const [bx, by] = posicion(j.bus);
    if(j.estado === 'muerto'){
      const k = Math.max(0, 1 - j.muriendo);
      dibujarMicro(ctx, bx, by, [Math.cos(j.muriendo * 14), Math.sin(j.muriendo * 14)], 1.25 * k);
    } else {
      dibujarMicro(ctx, bx, by, j.bus.dir[0] || j.bus.dir[1] ? j.bus.dir : [0, -1], 1.25);
    }

    // Marcador de abajo
    ctx.fillStyle = '#fff'; ctx.font = '800 13px Poppins, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText('Nivel ' + j.nivel, 10, FILAS * C + 14);
    ctx.textAlign = 'right';
    ctx.font = '14px ' + ARC_FUENTE_EMOJI;
    ctx.fillText('🚌'.repeat(Math.max(0, j.vidas)), ANCHO - 10, FILAS * C + 14);
    if(j.estado === 'listo') arcCartel(ctx, '¡Listo!', ANCHO, 9 * C + 2, 1);
    if(j.estado === 'nivel') arcCartel(ctx, '¡Nivel completo!', ANCHO, 9 * C + 2, 1);
  };

  return j;
}

// ---- Defensa del Garage: un tanquecito que defiende la base ----

const TANQUE_MAPAS = [
  [
    '.............', '.BB.BB.BB.BB.', '.BB.BB.BB.BB.', '.BB.BB.BB.BB.', '.BB.BB.BB.BB.',
    '......S......', 'SS..BB.BB..SS', '.............', '.BB.......BB.', '.BB.BB.BB.BB.',
    '.BB.BB.BB.BB.', '......S......', '.BB.BB.BB.BB.', '.BB.BB.BB.BB.', '.BB.......BB.',
    '.....BBB.....', '.....BGB.....',
  ],
  [
    '.............', '.SB.BB.BB.BS.', '.BB.BB.BB.BB.', '.BB.SS.SS.BB.', '.BB.BB.BB.BB.',
    '......B......', 'BB..BBSBB..BB', '.............', '.BB.S...S.BB.', '.BB.BB.BB.BB.',
    '.BB.BB.BB.BB.', '......S......', '.BB.BB.BB.BB.', '.BB.......BB.', '.BB.BB.BB.BB.',
    '.....BBB.....', '.....BGB.....',
  ],
  [
    '.............', '..BB.....BB..', '..BB.SSS.BB..', '.............', 'BB.BB.B.BB.BB',
    '.............', '..S..BBB..S..', '.............', '.BB.BB.BB.BB.', '.............',
    'SS.BB...BB.SS', '.............', '.BB.BB.BB.BB.', '.BB.......BB.', '.............',
    '.....BBB.....', '.....BGB.....',
  ],
];

function arcCrearTanque(){
  const COLS = 13, FILAS = 17, C = 22, ANCHO = COLS * C, ALTO = FILAS * C + 24;
  const MEDIO = 9; // medio tanque, para choques
  const DIRS = { arr: [0, -1], abj: [0, 1], izq: [-1, 0], der: [1, 0] };
  const j = {
    ancho: ANCHO, alto: ALTO,
    nivel: 1, vidas: 3, puntaje: 0, mapa: [], jugador: null, enemigos: [], balas: [], porSalir: 0, escudo: 0,
    origen: null, apunta: null, muriendo: 0, terminado: false, t: 0, spawnT: 1, cartel: 0, cartelTexto: '', baseViva: true, parpadeo: 0,
  };

  function cargarMapa(){
    j.mapa = TANQUE_MAPAS[(j.nivel - 1) % TANQUE_MAPAS.length].map(f => f.split(''));
    j.enemigos = []; j.balas = [];
    j.porSalir = 8 + j.nivel * 2;
    j.spawnT = 1;
    ponerJugador();
  }
  function ponerJugador(){
    j.jugador = { x: 4.5 * C, y: 16.5 * C, dir: DIRS.arr, enfriamiento: 0 };
    j.escudo = 2.2;
  }
  const solido = (tx, ty) => tx < 0 || ty < 0 || tx >= COLS || ty >= FILAS || 'BSG'.includes(j.mapa[ty][tx]);
  function chocaMapa(x, y){
    const x0 = Math.floor((x - MEDIO) / C), x1 = Math.floor((x + MEDIO - 0.01) / C);
    const y0 = Math.floor((y - MEDIO) / C), y1 = Math.floor((y + MEDIO - 0.01) / C);
    for(let ty = y0; ty <= y1; ty++) for(let tx = x0; tx <= x1; tx++) if(solido(tx, ty)) return true;
    return false;
  }
  function chocaTanques(t, x, y){
    const otros = [j.jugador].concat(j.enemigos);
    return otros.some(o => o !== t && Math.abs(o.x - x) < MEDIO * 2 - 2 && Math.abs(o.y - y) < MEDIO * 2 - 2);
  }
  function moverTanque(t, dir, vel, dt){
    if(dir !== t.dir){
      // Al girar se alinea con la grilla para poder entrar por los pasillos.
      if(dir[0] !== 0){ const cy = (Math.floor(t.y / C) + 0.5) * C; if(Math.abs(cy - t.y) < 10 && !chocaMapa(t.x, cy)) t.y = cy; }
      else { const cx = (Math.floor(t.x / C) + 0.5) * C; if(Math.abs(cx - t.x) < 10 && !chocaMapa(cx, t.y)) t.x = cx; }
      t.dir = dir;
    }
    const nx = t.x + dir[0] * vel * dt, ny = t.y + dir[1] * vel * dt;
    if(!chocaMapa(nx, ny) && !chocaTanques(t, nx, ny)){ t.x = nx; t.y = ny; return true; }
    return false;
  }
  function disparar(t, propia){
    if(t.enfriamiento > 0) return;
    if(j.balas.some(b => b.dueno === t)) return;
    j.balas.push({ x: t.x + t.dir[0] * 12, y: t.y + t.dir[1] * 12, dir: t.dir, dueno: t, propia });
    t.enfriamiento = propia ? 0.22 : 0.8;
    if(propia) reproducirTono('ruleta');
  }

  j.punteros = (lista) => {
    if(!lista.length){ j.origen = null; j.apunta = null; return; }
    const p = lista[0];
    if(!j.origen) j.origen = { x: p[0], y: p[1] };
    const dx = p[0] - j.origen.x, dy = p[1] - j.origen.y;
    if(Math.hypot(dx, dy) < 10){ j.apunta = null; return; }
    j.apunta = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? DIRS.izq : DIRS.der) : (dy < 0 ? DIRS.arr : DIRS.abj);
    // El centro del joystick sigue al dedo, así girar es rápido.
    const k = Math.hypot(dx, dy);
    if(k > 34){ j.origen.x += dx / k * (k - 34); j.origen.y += dy / k * (k - 34); }
  };
  let teclasActivas = {};
  j.tecla = (k) => { teclasActivas[k] = true; };
  j.teclaSuelta = (k) => { delete teclasActivas[k]; };
  function dirTeclado(){
    if(teclasActivas.ArrowUp) return DIRS.arr; if(teclasActivas.ArrowDown) return DIRS.abj;
    if(teclasActivas.ArrowLeft) return DIRS.izq; if(teclasActivas.ArrowRight) return DIRS.der;
    return null;
  }

  cargarMapa();
  j.cartelTexto = 'Arrastrá para moverte. Disparás solo.'; j.cartel = 3.5;

  function nuevoEnemigo(){
    const cols = [0, 6, 12];
    const col = cols[Math.floor(Math.random() * 3)];
    const x = (col + 0.5) * C, y = 0.5 * C;
    if(j.enemigos.some(e => Math.abs(e.x - x) < 24 && Math.abs(e.y - y) < 24)) return;
    if(Math.abs(j.jugador.x - x) < 24 && Math.abs(j.jugador.y - y) < 24) return;
    j.enemigos.push({ x, y, dir: DIRS.abj, enfriamiento: 1, cambio: 0.5 + Math.random(), rapido: Math.random() < 0.25 });
    j.porSalir--;
  }

  function perderVida(){
    if(j.escudo > 0) return;
    j.vidas--;
    reproducirTono('fin');
    if(j.vidas <= 0){ j.muriendo = 0.001; return; }
    ponerJugador();
  }

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.cartel > 0) j.cartel -= dt;
    if(j.muriendo){
      j.muriendo += dt;
      if(j.muriendo > 1) j.terminado = true;
      return;
    }
    if(j.escudo > 0) j.escudo -= dt;
    const J = j.jugador;
    J.enfriamiento -= dt;

    const dirJ = dirTeclado() || j.apunta;
    if(dirJ) moverTanque(J, dirJ, 82 + j.nivel * 2, dt);
    disparar(J, true);

    j.spawnT -= dt;
    const maxVivos = Math.min(4, 2 + Math.floor(j.nivel / 2));
    if(j.porSalir > 0 && j.enemigos.length < maxVivos && j.spawnT <= 0){ nuevoEnemigo(); j.spawnT = 1.6; }

    j.enemigos.forEach(e => {
      e.enfriamiento -= dt; e.cambio -= dt;
      const vel = (e.rapido ? 78 : 54) + j.nivel * 3;
      const avanzo = moverTanque(e, e.dir, vel, dt);
      if(!avanzo || e.cambio <= 0){
        const base = [6.5 * C, 16.5 * C];
        const r = Math.random();
        let candidatas;
        if(r < 0.4) candidatas = Math.abs(base[0] - e.x) > Math.abs(base[1] - e.y) ? [base[0] < e.x ? DIRS.izq : DIRS.der, DIRS.abj] : [DIRS.abj, base[0] < e.x ? DIRS.izq : DIRS.der];
        else if(r < 0.7) candidatas = Math.abs(J.x - e.x) > Math.abs(J.y - e.y) ? [J.x < e.x ? DIRS.izq : DIRS.der, J.y < e.y ? DIRS.arr : DIRS.abj] : [J.y < e.y ? DIRS.arr : DIRS.abj, J.x < e.x ? DIRS.izq : DIRS.der];
        else { const todas = Object.values(DIRS); candidatas = [todas[Math.floor(Math.random() * 4)]]; }
        e.dir = candidatas[0];
        if(!avanzo && candidatas[1] && Math.random() < 0.6) e.dir = candidatas[1];
        e.cambio = 0.6 + Math.random() * 1.2;
      }
      const alineadoJ = (Math.abs(e.x - J.x) < 12 && ((e.dir === DIRS.abj && J.y > e.y) || (e.dir === DIRS.arr && J.y < e.y)))
        || (Math.abs(e.y - J.y) < 12 && ((e.dir === DIRS.der && J.x > e.x) || (e.dir === DIRS.izq && J.x < e.x)));
      if(alineadoJ || Math.random() < dt * 0.7) disparar(e, false);
    });

    // Balas
    j.balas.forEach(b => {
      if(b.muerta) return;
      const v = b.propia ? 270 : 200;
      b.x += b.dir[0] * v * dt; b.y += b.dir[1] * v * dt;
      const tx = Math.floor(b.x / C), ty = Math.floor(b.y / C);
      let muere = false;
      if(b.x < 0 || b.y < 0 || b.x >= COLS * C || b.y >= FILAS * C) muere = true;
      else {
        const c = j.mapa[ty][tx];
        if(c === 'B'){ j.mapa[ty][tx] = '.'; muere = true; reproducirTono('tick'); }
        else if(c === 'S') muere = true;
        else if(c === 'G'){ muere = true; if(!b.propia){ j.baseViva = false; j.muriendo = 0.001; reproducirTono('fin'); } }
      }
      if(!muere){
        if(b.propia){
          const k = j.enemigos.findIndex(e => Math.abs(e.x - b.x) < MEDIO + 2 && Math.abs(e.y - b.y) < MEDIO + 2);
          if(k >= 0){ j.enemigos.splice(k, 1); j.puntaje += 100; muere = true; reproducirTono('correcto'); }
        } else if(Math.abs(J.x - b.x) < MEDIO + 1 && Math.abs(J.y - b.y) < MEDIO + 1){
          muere = true; perderVida();
        }
      }
      if(!muere){
        const otra = j.balas.find(o => o !== b && !o.muerta && o.propia !== b.propia && Math.abs(o.x - b.x) < 5 && Math.abs(o.y - b.y) < 5);
        if(otra){ otra.muerta = true; muere = true; }
      }
      if(muere) b.muerta = true;
    });
    j.balas = j.balas.filter(b => !b.muerta);
    if(j.muriendo) return;

    if(j.porSalir <= 0 && !j.enemigos.length){
      j.nivel++;
      j.puntaje += 100;
      if(j.premio) j.premio(3);
      reproducirTono('bonus');
      cargarMapa();
      j.cartelTexto = '¡Nivel ' + j.nivel + '!'; j.cartel = 2;
    }
  };

  function tanque(ctx, t, color, esJugador){
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(Math.atan2(t.dir[1], t.dir[0]) + Math.PI / 2);
    ctx.fillStyle = '#2B2F3A'; ctx.fillRect(-9, -9, 4, 18); ctx.fillRect(5, -9, 4, 18);
    ctx.fillStyle = color; arcRR(ctx, -6, -8, 12, 16, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-4, -6, 3, 12);
    ctx.fillStyle = '#1B1F2A'; ctx.fillRect(-1.6, -15, 3.2, 11);
    ctx.fillStyle = esJugador ? '#fff' : 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(0, 1, 4.2, 0, 7); ctx.fill();
    ctx.restore();
    if(esJugador) arcLogo(ctx, t.x, t.y, 8);
  }

  j.dibujar = (ctx) => {
    ctx.fillStyle = '#222B3C'; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = '#1A2230'; ctx.fillRect(0, 0, COLS * C, FILAS * C);
    for(let y = 0; y < FILAS; y++){
      for(let x = 0; x < COLS; x++){
        const c = j.mapa[y][x], px = x * C, py = y * C;
        if(c === 'B'){
          ctx.fillStyle = '#C0622F'; ctx.fillRect(px + 0.5, py + 0.5, C - 1, C - 1);
          ctx.fillStyle = '#8F3F18';
          ctx.fillRect(px + 0.5, py + C / 2 - 0.5, C - 1, 1.5);
          ctx.fillRect(px + C / 2 - 0.5, py + 0.5, 1.5, C / 2 - 1);
          ctx.fillRect(px + C / 4, py + C / 2 + 1, 1.5, C / 2 - 1.5);
          ctx.fillRect(px + 3 * C / 4, py + C / 2 + 1, 1.5, C / 2 - 1.5);
        } else if(c === 'S'){
          ctx.fillStyle = '#9AA3B2'; ctx.fillRect(px + 0.5, py + 0.5, C - 1, C - 1);
          ctx.fillStyle = '#C7CEDA'; ctx.fillRect(px + 3, py + 3, C - 6, C - 6);
          ctx.fillStyle = '#7C8596'; ctx.fillRect(px + 6, py + 6, C - 12, C - 12);
        } else if(c === 'G'){
          // El garage de Busmac: la base a defender, con la B
          ctx.fillStyle = '#0F2A4D'; arcRR(ctx, px + 1, py + 2, C - 2, C - 3, 4); ctx.fill();
          ctx.fillStyle = '#E6A817'; ctx.fillRect(px + 1, py + 2, C - 2, 3);
          arcLogo(ctx, px + C / 2, py + C / 2 + 2, 15, '#fff');
        }
      }
    }
    if(!j.baseViva){
      ctx.fillStyle = 'rgba(229,72,77,.6)'; ctx.fillRect(6 * C, 16 * C, C, C);
    }
    j.enemigos.forEach(e => tanque(ctx, e, e.rapido ? '#E5484D' : '#8D95A5', false));
    if(!(j.escudo > 0 && Math.floor(j.t * 12) % 2)) tanque(ctx, j.jugador, '#E6A817', true);
    if(j.escudo > 0){
      ctx.strokeStyle = 'rgba(120,200,255,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(j.jugador.x, j.jugador.y, 14, 0, 7); ctx.stroke();
    }
    j.balas.forEach(b => {
      ctx.fillStyle = b.propia ? '#FFF3B0' : '#FF8A8A';
      ctx.beginPath(); ctx.arc(b.x, b.y, 2.6, 0, 7); ctx.fill();
    });

    ctx.fillStyle = '#fff'; ctx.font = '800 13px Poppins, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText('Nivel ' + j.nivel + ' · 🎯 ' + (j.porSalir + j.enemigos.length), 10, FILAS * C + 13);
    ctx.textAlign = 'right'; ctx.font = '14px ' + ARC_FUENTE_EMOJI;
    ctx.fillText('❤️'.repeat(Math.max(0, j.vidas)), ANCHO - 10, FILAS * C + 13);
    if(j.cartel > 0) arcCartel(ctx, j.cartelTexto, ANCHO, 150, Math.min(1, j.cartel));
    if(j.muriendo){
      ctx.fillStyle = 'rgba(229,72,77,' + Math.min(.5, j.muriendo * .8) + ')'; ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  };

  return j;
}

// ---- Pinball: flippers, rebotadores con la B y tres bolas ----

function arcCrearPinball(){
  const ANCHO = 300, ALTO = 470, R = 7, GRAV = 560;
  const PALETA = 50, PIVOTE_I = [90, 424], PIVOTE_D = [210, 424];
  const ANG_REPOSO = 0.5, ANG_ARRIBA = -0.48; // radianes (positivo = hacia abajo)
  const PARED = [
    // Paredes y guías (cada una es un segmento)
    [10, 70, 10, 360], [290, 70, 290, 470], [10, 360, 90, 414], [264, 360, 210, 414],
    [10, 70, 62, 14], [62, 14, 238, 14], [238, 14, 290, 70],
    [264, 112, 264, 462], // pared del carril de lanzamiento
    [264, 462, 290, 462], // piso del carril
    [10, 360, 10, 470],
  ];
  const REBOTADORES = [
    { x: 100, y: 150, r: 20 }, { x: 200, y: 150, r: 20 }, { x: 150, y: 214, r: 20 },
  ];
  const OBJETIVOS = [{ x: 58, y: 230, r: 9 }, { x: 242, y: 230, r: 9 }];

  const j = {
    ancho: ANCHO, alto: ALTO,
    bola: { x: 277, y: 440, vx: 0, vy: 0 }, estado: 'lanzar', bolas: 3, puntaje: 0, t: 0,
    izq: { a: ANG_REPOSO, w: 0, activa: false }, der: { a: ANG_REPOSO, w: 0, activa: false },
    luces: [0, 0, 0, 0, 0], quieta: 0, flashes: [], muriendo: 0, terminado: false, cartel: 0, cartelTexto: '',
    lanzamientos: 0,
  };
  j.cartelTexto = 'Tocá para lanzar'; j.cartel = 99;

  j.punteros = (lista) => {
    j.izq.activa = lista.some(p => p[0] < ANCHO / 2);
    j.der.activa = lista.some(p => p[0] >= ANCHO / 2);
  };
  j.toque = () => {
    if(j.estado !== 'lanzar') return;
    j.estado = 'juego';
    j.bola.vy = -930 - Math.random() * 40; j.bola.vx = 0;
    j.cartel = 0;
    reproducirTono('bonus');
  };
  j.tecla = (k) => {
    if(k === 'ArrowLeft') j.izq.activa = true;
    else if(k === 'ArrowRight') j.der.activa = true;
    else if(k === ' ' || k === 'ArrowDown') j.toque();
  };
  j.teclaSuelta = (k) => { if(k === 'ArrowLeft') j.izq.activa = false; else if(k === 'ArrowRight') j.der.activa = false; };

  function puntoMasCercano(px, py, x1, y1, x2, y2){
    const dx = x2 - x1, dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    return { x: x1 + dx * t, y: y1 + dy * t, t };
  }
  // Rebote contra un segmento; (vsx, vsy) es la velocidad de la superficie (flippers en movimiento).
  function rebotarSegmento(b, x1, y1, x2, y2, rest, vsx, vsy, grosor){
    const c = puntoMasCercano(b.x, b.y, x1, y1, x2, y2);
    let nx = b.x - c.x, ny = b.y - c.y;
    const d = Math.hypot(nx, ny), limite = R + (grosor || 0);
    if(d >= limite || d === 0) return false;
    nx /= d; ny /= d;
    b.x = c.x + nx * limite; b.y = c.y + ny * limite;
    const rvx = b.vx - (vsx || 0), rvy = b.vy - (vsy || 0);
    const vn = rvx * nx + rvy * ny;
    if(vn < 0){
      b.vx -= (1 + rest) * vn * nx;
      b.vy -= (1 + rest) * vn * ny;
    }
    return { t: c.t, vn };
  }

  function paleta(p, pivote, signo, dt){
    const objetivo = p.activa ? ANG_ARRIBA : ANG_REPOSO;
    const previo = p.a;
    const paso = 15 * dt;
    if(Math.abs(objetivo - p.a) <= paso) p.a = objetivo; else p.a += Math.sign(objetivo - p.a) * paso;
    p.w = (p.a - previo) / dt;
    // extremo de la paleta (la izquierda mira a la derecha, la derecha a la izquierda)
    return [pivote[0] + signo * Math.cos(p.a) * PALETA, pivote[1] + Math.sin(p.a) * PALETA];
  }

  function perderBola(){
    j.bolas--;
    reproducirTono('fin');
    if(j.bolas <= 0){ j.muriendo = 0.001; return; }
    j.bola = { x: 277, y: 440, vx: 0, vy: 0 };
    j.estado = 'lanzar'; j.cartelTexto = 'Tocá para lanzar'; j.cartel = 99; j.quieta = 0;
  }

  let ultimoPuntos = 0;
  j.actualizar = (dt) => {
    j.t += dt;
    j.flashes = j.flashes.filter(f => (f.t -= dt) > 0);
    if(j.muriendo){ j.muriendo += dt; if(j.muriendo > 0.9) j.terminado = true; return; }
    const extI = paleta(j.izq, PIVOTE_I, 1, dt);
    const extD = paleta(j.der, PIVOTE_D, -1, dt);
    const b = j.bola;
    if(j.estado === 'lanzar'){ b.x = 277; b.y = 440 + Math.sin(j.t * 4) * 2; return; }

    const sub = 5, h = dt / sub;
    for(let s = 0; s < sub; s++){
      b.vy += GRAV * h;
      const vmax = 1100, v = Math.hypot(b.vx, b.vy);
      if(v > vmax){ b.vx *= vmax / v; b.vy *= vmax / v; }
      b.x += b.vx * h; b.y += b.vy * h;

      PARED.forEach(p => rebotarSegmento(b, p[0], p[1], p[2], p[3], 0.45));
      // Paletas: velocidad de la superficie = w x r
      [[j.izq, PIVOTE_I, extI, 1], [j.der, PIVOTE_D, extD, -1]].forEach(([p, pv, ext, sg]) => {
        const c = puntoMasCercano(b.x, b.y, pv[0], pv[1], ext[0], ext[1]);
        const rx = c.x - pv[0], ry = c.y - pv[1];
        const omega = sg * p.w;
        const vsx = -omega * ry, vsy = omega * rx;
        const r = rebotarSegmento(b, pv[0], pv[1], ext[0], ext[1], 0.35, vsx, vsy, 5);
        if(r && Math.abs(p.w) > 1){ reproducirTono('tick'); }
      });
      REBOTADORES.forEach((rb, i) => {
        const dx = b.x - rb.x, dy = b.y - rb.y, d = Math.hypot(dx, dy), limite = R + rb.r;
        if(d < limite && d > 0){
          const nx = dx / d, ny = dy / d;
          b.x = rb.x + nx * limite; b.y = rb.y + ny * limite;
          const vn = b.vx * nx + b.vy * ny;
          if(vn < 0){ b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; }
          b.vx += nx * 170; b.vy += ny * 170;
          j.puntaje += 50;
          j.flashes.push({ x: rb.x, y: rb.y, r: rb.r, t: 0.18 });
          reproducirTono('correcto');
        }
      });
      OBJETIVOS.forEach((ob, i) => {
        const dx = b.x - ob.x, dy = b.y - ob.y, d = Math.hypot(dx, dy), limite = R + ob.r;
        if(d < limite && d > 0){
          const nx = dx / d, ny = dy / d;
          b.x = ob.x + nx * limite; b.y = ob.y + ny * limite;
          const vn = b.vx * nx + b.vy * ny;
          if(vn < 0){ b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny; }
          j.luces[i] = 1; j.puntaje += 25; j.flashes.push({ x: ob.x, y: ob.y, r: ob.r, t: 0.15 });
          reproducirTono('tick');
          if(j.luces[0] && j.luces[1]){ j.luces = [0, 0, 0, 0, 0]; j.puntaje += 300; if(j.premio) j.premio(2); reproducirTono('bonus'); }
        }
      });
    }
    // Si la bola vuelve a caer al carril y se frena, se puede lanzar de nuevo.
    if(b.x > 264 && b.y > 440 && Math.hypot(b.vx, b.vy) < 40){ j.estado = 'lanzar'; b.vx = 0; b.vy = 0; j.cartelTexto = 'Tocá para lanzar'; j.cartel = 99; }
    // Si se queda clavada mucho tiempo se le da un empujoncito.
    if(Math.hypot(b.vx, b.vy) < 12) j.quieta += dt; else j.quieta = 0;
    if(j.quieta > 2.5){ b.vx += (Math.random() - 0.5) * 220; b.vy -= 160; j.quieta = 0; }

    if(b.y > ALTO + 14) perderBola();
    if(j.puntaje - ultimoPuntos >= 500){ ultimoPuntos += 500; if(j.premio) j.premio(1); }
  };

  j.dibujar = (ctx) => {
    const fondo = ctx.createLinearGradient(0, 0, 0, ALTO);
    fondo.addColorStop(0, '#2B1B66'); fondo.addColorStop(1, '#10204F');
    ctx.fillStyle = fondo; ctx.fillRect(0, 0, ANCHO, ALTO);
    // Dibujo del campo: borde
    ctx.fillStyle = '#0B1236';
    ctx.beginPath(); ctx.moveTo(10, 70); ctx.lineTo(62, 14); ctx.lineTo(238, 14); ctx.lineTo(290, 70); ctx.lineTo(290, 470); ctx.lineTo(10, 470); ctx.closePath(); ctx.fill();
    // Carril de lanzamiento
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(266, 112, 22, 358);
    ctx.fillStyle = '#E6A817'; ctx.fillRect(268, 452, 18, 6);

    ctx.strokeStyle = '#6A7BFF'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    PARED.forEach(p => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.stroke(); });

    // Rebotadores con la B
    REBOTADORES.forEach(rb => {
      const flash = j.flashes.find(f => f.x === rb.x && f.y === rb.y);
      ctx.fillStyle = flash ? '#FFF3B0' : '#E6A817';
      ctx.beginPath(); ctx.arc(rb.x, rb.y, rb.r + (flash ? 3 : 0), 0, 7); ctx.fill();
      ctx.fillStyle = '#0F2A4D'; ctx.beginPath(); ctx.arc(rb.x, rb.y, rb.r - 5, 0, 7); ctx.fill();
      arcLogo(ctx, rb.x, rb.y, rb.r * 1.15, '#fff');
    });
    OBJETIVOS.forEach((ob, i) => {
      ctx.fillStyle = j.luces[i] ? '#5BE88D' : '#3B4A8F';
      ctx.beginPath(); ctx.arc(ob.x, ob.y, ob.r, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    });

    // Paletas
    [[j.izq, PIVOTE_I, 1], [j.der, PIVOTE_D, -1]].forEach(([p, pv, signo]) => {
      const ex = pv[0] + signo * Math.cos(p.a) * PALETA, ey = pv[1] + Math.sin(p.a) * PALETA;
      ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pv[0], pv[1]); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#E6A817'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(pv[0], pv[1]); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = '#0F2A4D'; ctx.beginPath(); ctx.arc(pv[0], pv[1], 4, 0, 7); ctx.fill();
    });

    const b = j.bola;
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.arc(b.x, b.y, R + 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#E8ECF5'; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, 2.4, 0, 7); ctx.fill();

    ctx.fillStyle = '#fff'; ctx.font = '800 13px Poppins, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText('Bolas', 16, 32);
    for(let i = 0; i < j.bolas; i++){ ctx.fillStyle = '#E8ECF5'; ctx.beginPath(); ctx.arc(62 + i * 14, 32, 5, 0, 7); ctx.fill(); }
    if(j.cartel > 0) arcCartel(ctx, j.cartelTexto, ANCHO, 310, 1);
    if(j.muriendo){ ctx.fillStyle = 'rgba(229,72,77,' + Math.min(.45, j.muriendo * .7) + ')'; ctx.fillRect(0, 0, ANCHO, ALTO); }
  };

  return j;
}

ARC_JUEGOS.laberinto = {
  titulo: 'Laberinto del Micro', tema: 'noche', crear: arcCrearLaberinto, pad: 'cruz', padAlto: 128, emojiFin: '🚚', textoFin: '¡Te atraparon los camiones!',
  instrucciones: `Tocá las flechas de abajo para girar (o deslizá el dedo) y juntá todos los puntos. El logo de ${marcaCorta()} te da poder para sacar de la ruta a los camiones.`,
  monedas: p => Math.min(15, Math.floor(p / 150)),
};
ARC_JUEGOS.tanque = {
  titulo: 'Defensa del Garage', tema: 'noche', crear: arcCrearTanque, emojiFin: '💥', textoFin: '¡Cayó el garage!',
  instrucciones: `Arrastrá el dedo para mover tu tanque (dispara solo). Defendé el garage de ${marcaCorta()} y no dejes pasar a los enemigos.`,
  monedas: p => Math.min(15, Math.floor(p / 120)),
};
ARC_JUEGOS.pinball = {
  titulo: 'Pinball', tema: 'noche', crear: arcCrearPinball, emojiFin: '🎱', textoFin: '¡Se acabaron las bolas!',
  instrucciones: 'Tocá para lanzar. Mantené apretado el lado izquierdo o derecho para mover cada paleta y pegale a los rebotadores con la B.',
  monedas: p => Math.min(15, Math.floor(p / 250)),
};
