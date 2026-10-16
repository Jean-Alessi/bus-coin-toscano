// Bombas y Bloques (estilo Bomberman) y Aventura del Pasajero (plataformas),
// sobre el motor de arcade.js. La B de Busmac es parte del juego: la bomba,
// el premio de vida extra, las monedas y la remera del pasajero.

// ---- Bombas y Bloques ----

function arcCrearBombas(){
  const COLS = 11, FILAS = 13, C = 26, ANCHO = COLS * C, ALTO = FILAS * C + 26;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const COLORES_ENEMIGO = ['#E5484D', '#FF9A3D', '#E25BC4', '#2FB5B5', '#7E57FF'];

  const j = {
    ancho: ANCHO, alto: ALTO, toqueAlSoltar: true,
    nivel: 1, vidas: 3, puntaje: 0, mapa: [], bombas: [], llamas: [], items: [], enemigos: [],
    jugador: null, maxBombas: 1, alcance: 2, rapido: 0, quiereDir: null, origen: null, previos: 0,
    estado: 'jugando', espera: 0, escudo: 0, muriendo: 0, terminado: false, t: 0, ultimaBomba: -1,
    cartel: 0, cartelTexto: '',
  };
  // Celdas: '#' borde, 'P' pilar, 'B' bloque, '.' libre
  function armarMapa(){
    j.mapa = [];
    for(let y = 0; y < FILAS; y++){
      const fila = [];
      for(let x = 0; x < COLS; x++){
        if(x === 0 || y === 0 || x === COLS - 1 || y === FILAS - 1) fila.push('#');
        else if(x % 2 === 0 && y % 2 === 0) fila.push('P');
        else if((x <= 2 && y <= 2)) fila.push('.');
        else fila.push(Math.random() < 0.52 ? 'B' : '.');
      }
      j.mapa.push(fila);
    }
    j.bombas = []; j.llamas = []; j.items = [];
    const cant = Math.min(7, 2 + j.nivel);
    j.enemigos = [];
    const libres = [];
    for(let y = 1; y < FILAS - 1; y++) for(let x = 1; x < COLS - 1; x++) if(j.mapa[y][x] !== 'P' && Math.abs(x - 1) + Math.abs(y - 1) > 7) libres.push([x, y]);
    for(let i = 0; i < cant && libres.length; i++){
      const k = Math.floor(Math.random() * libres.length);
      const [x, y] = libres.splice(k, 1)[0];
      j.mapa[y][x] = '.';
      const e = nuevaEntidad(x, y);
      e.color = COLORES_ENEMIGO[i % COLORES_ENEMIGO.length];
      e.dir = DIRS[Math.floor(Math.random() * 4)];
      j.enemigos.push(e);
    }
    j.jugador = nuevaEntidad(1, 1);
    j.escudo = 2;
  }
  function nuevaEntidad(x, y){ return { x, y, nx: x, ny: y, prog: 0, dir: [0, 0] }; }
  const hayBomba = (x, y) => j.bombas.some(b => b.x === x && b.y === y);
  const solidoParaJugador = (x, y) => {
    const c = j.mapa[y] && j.mapa[y][x];
    if(!c || c !== '.') return true;
    // Una bomba bloquea, salvo la que el jugador acaba de poner y todavía pisa.
    return j.bombas.some(b => b.x === x && b.y === y && !b.pisable);
  };
  const solidoParaEnemigo = (x, y) => {
    const c = j.mapa[y] && j.mapa[y][x];
    return !c || c !== '.' || hayBomba(x, y);
  };
  const hayLlama = (x, y) => j.llamas.some(l => l.x === x && l.y === y);
  function posicion(e){ return [e.x + (e.nx - e.x) * e.prog, e.y + (e.ny - e.y) * e.prog]; }
  function tileActual(e){ const [px, py] = posicion(e); return [Math.round(px), Math.round(py)]; }

  function mover(e, vel, dt, decidir){
    let paso = vel * dt, guardia = 0;
    while(paso > 0 && guardia++ < 5){
      if(e.nx === e.x && e.ny === e.y){
        decidir(e);
        if(e.nx === e.x && e.ny === e.y){ e.prog = 0; return; }
        e.prog = 0;
      }
      const falta = 1 - e.prog;
      if(paso >= falta){ paso -= falta; e.x = e.nx; e.y = e.ny; e.prog = 0; e.nx = e.x; e.ny = e.y; }
      else { e.prog += paso; paso = 0; }
    }
  }
  function invertir(e){
    const x = e.x, y = e.y;
    e.x = e.nx; e.y = e.ny; e.nx = x; e.ny = y; e.prog = 1 - e.prog; e.dir = [-e.dir[0], -e.dir[1]];
  }

  function decidirJugador(e){
    const q = j.quiereDir;
    if(!q) return;
    if(!solidoParaJugador(e.x + q[0], e.y + q[1])){ e.dir = q; e.nx = e.x + q[0]; e.ny = e.y + q[1]; }
  }
  function decidirEnemigo(e){
    const ok = d => !solidoParaEnemigo(e.x + d[0], e.y + d[1]) && !hayLlama(e.x + d[0], e.y + d[1]);
    const opciones = DIRS.filter(ok);
    if(!opciones.length){ e.nx = e.x; e.ny = e.y; return; }
    const sinVuelta = opciones.filter(d => !(d[0] === -e.dir[0] && d[1] === -e.dir[1]));
    const base = sinVuelta.length ? sinVuelta : opciones;
    const sigue = base.find(d => d[0] === e.dir[0] && d[1] === e.dir[1]);
    const d = (sigue && Math.random() < 0.7) ? sigue : base[Math.floor(Math.random() * base.length)];
    e.dir = d; e.nx = e.x + d[0]; e.ny = e.y + d[1];
  }

  function ponerBomba(){
    if(j.estado !== 'jugando' || j.t - j.ultimaBomba < 0.25) return;
    if(j.bombas.length >= j.maxBombas) return;
    const [x, y] = tileActual(j.jugador);
    if(hayBomba(x, y) || j.mapa[y][x] !== '.') return;
    j.bombas.push({ x, y, t: 2.2, alcance: j.alcance, pisable: true });
    j.ultimaBomba = j.t;
    reproducirTono('tick');
  }

  function explotar(b){
    const k = j.bombas.indexOf(b);
    if(k < 0) return;
    j.bombas.splice(k, 1);
    const celdas = [[b.x, b.y]];
    DIRS.forEach(d => {
      for(let i = 1; i <= b.alcance; i++){
        const x = b.x + d[0] * i, y = b.y + d[1] * i;
        const c = j.mapa[y] && j.mapa[y][x];
        if(!c || c === '#' || c === 'P') break;
        celdas.push([x, y]);
        if(c === 'B'){
          j.mapa[y][x] = '.';
          j.puntaje += 10;
          const r = Math.random();
          if(r < 0.07) j.items.push({ x, y, tipo: 'vida', t0: j.t });
          else if(r < 0.2) j.items.push({ x, y, tipo: 'alcance', t0: j.t });
          else if(r < 0.32) j.items.push({ x, y, tipo: 'bomba', t0: j.t });
          else if(r < 0.4) j.items.push({ x, y, tipo: 'rapido', t0: j.t });
          break;
        }
        const otra = j.bombas.find(o => o.x === x && o.y === y);
        if(otra){ otra.t = 0; }
      }
    });
    celdas.forEach(([x, y]) => { j.llamas.push({ x, y, t: 0.5, creada: j.t }); });
    reproducirTono('bonus');
  }

  j.punteros = (lista) => {
    if(lista.length > j.previos && lista.length >= 2) ponerBomba(); // segundo dedo = bomba
    j.previos = lista.length;
    if(!lista.length){ j.origen = null; j.quiereDir = null; return; }
    const p = lista[0];
    if(!j.origen) j.origen = { x: p[0], y: p[1] };
    const dx = p[0] - j.origen.x, dy = p[1] - j.origen.y;
    if(Math.hypot(dx, dy) < 12){ j.quiereDir = null; return; }
    j.quiereDir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? [-1, 0] : [1, 0]) : (dy < 0 ? [0, -1] : [0, 1]);
    const k = Math.hypot(dx, dy);
    if(k > 36){ j.origen.x += dx / k * (k - 36); j.origen.y += dy / k * (k - 36); }
    const q = j.quiereDir, e = j.jugador;
    if(q[0] === -e.dir[0] && q[1] === -e.dir[1] && (e.nx !== e.x || e.ny !== e.y)) invertir(e);
  };
  j.toque = () => ponerBomba();
  const teclas = {};
  j.tecla = (k) => { teclas[k] = true; if(k === ' ') ponerBomba(); };
  j.teclaSuelta = (k) => { delete teclas[k]; };
  function dirTeclado(){
    if(teclas.ArrowUp) return [0, -1]; if(teclas.ArrowDown) return [0, 1];
    if(teclas.ArrowLeft) return [-1, 0]; if(teclas.ArrowRight) return [1, 0];
    return null;
  }

  armarMapa();
  j.cartelTexto = 'Arrastrá para moverte · tocá para poner una bomba'; j.cartel = 4;

  function morir(){
    if(j.estado !== 'jugando' || j.escudo > 0) return;
    j.estado = 'muerto'; j.muriendo = 0.001;
    reproducirTono('fin');
  }

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.cartel > 0) j.cartel -= dt;
    j.llamas.forEach(l => { l.t -= dt; });
    j.llamas = j.llamas.filter(l => l.t > 0);
    if(j.estado === 'muerto'){
      j.muriendo += dt;
      if(j.muriendo > 1.1){
        j.vidas--;
        if(j.vidas <= 0){ j.terminado = true; return; }
        j.jugador = nuevaEntidad(1, 1); j.escudo = 2.2; j.estado = 'jugando'; j.maxBombas = Math.max(1, j.maxBombas - 1); j.alcance = Math.max(2, j.alcance - 1);
      }
      return;
    }
    if(j.estado === 'nivel'){
      j.espera -= dt;
      if(j.espera <= 0){ j.nivel++; armarMapa(); j.estado = 'jugando'; j.cartelTexto = 'Nivel ' + j.nivel; j.cartel = 2; }
      return;
    }
    if(j.escudo > 0) j.escudo -= dt;

    const dirT = dirTeclado();
    if(dirT) j.quiereDir = dirT; else if(!j.origen) j.quiereDir = null;
    const velJ = 4.1 + j.rapido * 0.7;
    mover(j.jugador, velJ, dt, decidirJugador);
    // La bomba deja de ser "pisable" cuando el jugador sale de su casilla.
    const [tx, ty] = tileActual(j.jugador);
    j.bombas.forEach(b => { if(b.pisable && (b.x !== tx || b.y !== ty)) b.pisable = false; });

    j.enemigos.forEach(e => mover(e, 2.2 + j.nivel * 0.18, dt, decidirEnemigo));

    j.bombas.slice().forEach(b => { b.t -= dt; if(b.t <= 0) explotar(b); });

    // Recoger ítems
    for(let i = j.items.length - 1; i >= 0; i--){
      const it = j.items[i];
      if(it.x === tx && it.y === ty){
        j.items.splice(i, 1);
        j.puntaje += 50;
        if(it.tipo === 'vida'){ j.vidas = Math.min(5, j.vidas + 1); if(j.premio) j.premio(2); }
        else if(it.tipo === 'alcance') j.alcance = Math.min(6, j.alcance + 1);
        else if(it.tipo === 'bomba') j.maxBombas = Math.min(4, j.maxBombas + 1);
        else j.rapido = Math.min(3, j.rapido + 1);
        reproducirTono('correcto');
      }
    }
    // Las llamas destruyen los ítems que ya estaban sueltos (no los que caen en esa misma explosión)
    j.llamas.forEach(l => {
      const k = j.items.findIndex(it => it.x === l.x && it.y === l.y && it.t0 < l.creada - 0.001);
      if(k >= 0) j.items.splice(k, 1);
    });

    // Daño a enemigos
    for(let i = j.enemigos.length - 1; i >= 0; i--){
      const [ex, ey] = tileActual(j.enemigos[i]);
      if(hayLlama(ex, ey)){ j.enemigos.splice(i, 1); j.puntaje += 100; reproducirTono('correcto'); }
    }
    // Daño al jugador
    if(hayLlama(tx, ty)) morir();
    const [px, py] = posicion(j.jugador);
    if(j.estado === 'jugando' && j.enemigos.some(e => { const [ex, ey] = posicion(e); return Math.hypot(ex - px, ey - py) < 0.7; })) morir();

    if(j.estado === 'jugando' && !j.enemigos.length){
      j.estado = 'nivel'; j.espera = 1.4; j.puntaje += 200;
      if(j.premio) j.premio(3);
      reproducirTono('bonus');
    }
  };

  function enemigo(ctx, e){
    const [px, py] = posicion(e);
    const x = px * C + C / 2, y = py * C + C / 2;
    ctx.fillStyle = e.color; arcRR(ctx, x - 9, y - 9, 18, 16, 5); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(x - 5, y + 8, 3, 0, 7); ctx.arc(x + 5, y + 8, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, y - 2, 3.2, 0, 7); ctx.arc(x + 4, y - 2, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#0F2A4D'; ctx.beginPath(); ctx.arc(x - 4 + e.dir[0] * 1.3, y - 2 + e.dir[1] * 1.3, 1.5, 0, 7); ctx.arc(x + 4 + e.dir[0] * 1.3, y - 2 + e.dir[1] * 1.3, 1.5, 0, 7); ctx.fill();
  }

  j.dibujar = (ctx) => {
    ctx.fillStyle = '#1F5B3A'; ctx.fillRect(0, 0, ANCHO, ALTO);
    for(let y = 0; y < FILAS; y++){
      for(let x = 0; x < COLS; x++){
        const c = j.mapa[y][x], px = x * C, py = y * C;
        ctx.fillStyle = (x + y) % 2 ? '#2F7D4F' : '#2A7248'; ctx.fillRect(px, py, C, C);
        if(c === '#'){
          ctx.fillStyle = '#3A4256'; ctx.fillRect(px, py, C, C);
          ctx.fillStyle = '#4C566C'; ctx.fillRect(px + 2, py + 2, C - 4, C - 4);
        } else if(c === 'P'){
          ctx.fillStyle = '#6A7388'; arcRR(ctx, px + 1, py + 1, C - 2, C - 2, 4); ctx.fill();
          ctx.fillStyle = '#9AA3B8'; arcRR(ctx, px + 4, py + 4, C - 10, C - 10, 3); ctx.fill();
        } else if(c === 'B'){
          // Valija de viaje
          ctx.fillStyle = '#B5651D'; arcRR(ctx, px + 2, py + 3, C - 4, C - 5, 4); ctx.fill();
          ctx.fillStyle = '#8B4A12'; ctx.fillRect(px + 2, py + C / 2 - 1, C - 4, 2);
          ctx.fillStyle = '#E6A817'; ctx.fillRect(px + C / 2 - 2, py + 3, 4, C - 5);
          ctx.strokeStyle = '#6B3A10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + C / 2 - 4, py + 3); ctx.lineTo(px + C / 2 - 4, py + 1); ctx.lineTo(px + C / 2 + 4, py + 1); ctx.lineTo(px + C / 2 + 4, py + 3); ctx.stroke();
        }
      }
    }
    j.items.forEach(it => {
      const x = it.x * C + C / 2, y = it.y * C + C / 2;
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
      if(it.tipo === 'vida') arcLogo(ctx, x, y, 15);
      else arcEmoji(ctx, it.tipo === 'alcance' ? '🔥' : it.tipo === 'bomba' ? '💣' : '⚡', x, y + 1, 13);
    });
    j.bombas.forEach(b => {
      const x = b.x * C + C / 2, y = b.y * C + C / 2, p = 1 + Math.sin(j.t * 10) * 0.07;
      ctx.fillStyle = '#12161F'; ctx.beginPath(); ctx.arc(x, y + 1, 10.5 * p, 0, 7); ctx.fill();
      arcLogo(ctx, x, y + 1, 13, 'rgba(255,255,255,.92)');
      ctx.strokeStyle = '#E6A817'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 5, y - 8); ctx.lineTo(x + 9, y - 12); ctx.stroke();
      ctx.fillStyle = Math.floor(j.t * 12) % 2 ? '#FF5E62' : '#FFD84D'; ctx.beginPath(); ctx.arc(x + 9.5, y - 12.5, 2.2, 0, 7); ctx.fill();
    });
    j.llamas.forEach(l => {
      const x = l.x * C, y = l.y * C, k = Math.min(1, l.t / 0.25);
      ctx.fillStyle = 'rgba(255,120,40,' + (0.55 + 0.45 * k) + ')'; arcRR(ctx, x + 2, y + 2, C - 4, C - 4, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,120,' + (0.7 * k + 0.2) + ')'; arcRR(ctx, x + 7, y + 7, C - 14, C - 14, 4); ctx.fill();
    });
    j.enemigos.forEach(e => enemigo(ctx, e));

    // Jugador: un micro mirando hacia donde va
    const [jx, jy] = posicion(j.jugador);
    if(!(j.escudo > 0 && Math.floor(j.t * 12) % 2)){
      ctx.save();
      ctx.translate(jx * C + C / 2, jy * C + C / 2);
      const dir = (j.jugador.dir[0] || j.jugador.dir[1]) ? j.jugador.dir : [0, 1];
      const escala = j.estado === 'muerto' ? Math.max(0, 1 - j.muriendo) : 1;
      ctx.rotate(Math.atan2(dir[1], dir[0]) + Math.PI / 2 + (j.estado === 'muerto' ? j.muriendo * 10 : 0));
      ctx.scale(escala, escala);
      ctx.fillStyle = '#0F2A4D'; arcRR(ctx, -8, -10, 16, 20, 4); ctx.fill();
      ctx.fillStyle = '#E6A817'; ctx.fillRect(-8, -1, 16, 3);
      ctx.fillStyle = '#BFE6FF'; arcRR(ctx, -6, -9, 12, 5, 2); ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#fff'; ctx.font = '800 13px Poppins, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText('Nivel ' + j.nivel + ' · 💣' + j.maxBombas + ' 🔥' + j.alcance, 8, FILAS * C + 14);
    ctx.textAlign = 'right'; ctx.font = '14px ' + ARC_FUENTE_EMOJI;
    ctx.fillText('❤️'.repeat(Math.max(0, j.vidas)), ANCHO - 8, FILAS * C + 14);
    if(j.cartel > 0) arcCartel(ctx, j.cartelTexto, ANCHO, 6, Math.min(1, j.cartel));
    if(j.estado === 'nivel') arcCartel(ctx, '¡Nivel completo!', ANCHO, 160, 1);
  };

  return j;
}

// ---- Aventura del Pasajero: plataformas con monedas B ----

function arcCrearPlataformas(){
  const ANCHO = 300, ALTO = 460, T = 20, SUELO = 14; // fila donde empieza el piso
  const ESC = 1.3, VIS_W = ANCHO / ESC, VIS_H = ALTO / ESC; // el mundo se dibuja agrandado
  const GRAV = 1150, SALTO = 400, VEL = 98;
  const j = {
    ancho: ANCHO, alto: ALTO,
    nivel: 1, vidas: 3, puntaje: 0, monedas: 0, columnas: 0, alturas: [], bloques: new Set(), coinsLista: [], enemigos: [], bandera: 0,
    p: null, camara: 0, izq: false, der: false, salto: false, saltoPrevio: false, t: 0,
    estado: 'jugando', espera: 0, muriendo: 0, terminado: false, cartel: 0, cartelTexto: '',
  };
  const botones = {
    izq: { x: 40, y: 430, r: 27 }, der: { x: 104, y: 430, r: 27 }, salto: { x: 258, y: 428, r: 31 },
  };

  function generar(){
    const largo = 110 + j.nivel * 14;
    j.columnas = largo;
    j.alturas = Array(largo).fill(SUELO);
    j.bloques = new Set(); j.coinsLista = []; j.enemigos = [];
    let x = 10;
    const maxHueco = 2; // huecos de 2 casillas: saltables con margen en cualquier nivel
    while(x < largo - 14){
      const r = Math.random();
      if(r < 0.3){ // hueco con moneda arriba
        const ancho = 2 + Math.floor(Math.random() * (maxHueco - 1));
        for(let i = 0; i < ancho; i++) j.alturas[x + i] = -1;
        for(let i = -1; i <= ancho; i++) j.coinsLista.push({ x: (x + i) * T + T / 2, y: (SUELO - 3 - (i >= 0 && i < ancho ? 1 : 0)) * T, ok: false });
        x += ancho + 2 + Math.floor(Math.random() * 3);
      } else if(r < 0.5){ // escalón
        const alto = 1 + Math.floor(Math.random() * 2);
        const ancho = 2 + Math.floor(Math.random() * 3);
        for(let i = 0; i < ancho; i++) j.alturas[x + i] = SUELO - alto;
        j.coinsLista.push({ x: (x + ancho / 2) * T, y: (SUELO - alto - 2) * T, ok: false });
        x += ancho + 2;
      } else if(r < 0.68){ // plataforma flotante con monedas
        const alto = 3 + Math.floor(Math.random() * 2);
        const ancho = 3 + Math.floor(Math.random() * 3);
        for(let i = 0; i < ancho; i++){
          j.bloques.add((x + i) + ',' + (SUELO - alto));
          j.coinsLista.push({ x: (x + i) * T + T / 2, y: (SUELO - alto - 1) * T, ok: false });
        }
        x += ancho + 3;
      } else if(r < 0.9){ // enemigo patrullando
        const ancho = 5 + Math.floor(Math.random() * 3);
        j.enemigos.push({ x: (x + 1) * T, y: SUELO * T - 14, vx: -(28 + j.nivel * 3), izq: x * T, der: (x + ancho) * T, viva: true });
        j.coinsLista.push({ x: (x + 3) * T, y: (SUELO - 2) * T, ok: false });
        x += ancho + 2;
      } else { // tramo con monedas en fila
        for(let i = 0; i < 5; i++) j.coinsLista.push({ x: (x + i) * T + T / 2, y: (SUELO - 1) * T - 4, ok: false });
        x += 7;
      }
    }
    j.bandera = (largo - 8) * T;
    ponerJugador();
  }
  function ponerJugador(){
    j.p = { x: 3 * T, y: (SUELO - 1) * T - 4, vx: 0, vy: 0, enSuelo: false, dir: 1, invulnerable: 1.2 };
    j.camara = 0;
  }
  const solido = (tx, ty) => {
    if(tx < 0) return true;
    if(tx >= j.columnas) return false;
    const h = j.alturas[tx];
    if(h >= 0 && ty >= h) return true;
    return j.bloques.has(tx + ',' + ty);
  };
  const PW = 12, PH = 18;
  function mover(dt){
    const p = j.p;
    // Horizontal
    const ax = (j.der ? 1 : 0) - (j.izq ? 1 : 0);
    p.vx = ax * VEL;
    if(ax) p.dir = ax;
    p.x += p.vx * dt;
    let x0 = Math.floor((p.x - PW / 2) / T), x1 = Math.floor((p.x + PW / 2 - 0.01) / T);
    let y0 = Math.floor((p.y - PH) / T), y1 = Math.floor((p.y - 0.01) / T);
    for(let ty = y0; ty <= y1; ty++){
      if(p.vx > 0 && solido(x1, ty)){ p.x = x1 * T - PW / 2; break; }
      if(p.vx < 0 && solido(x0, ty)){ p.x = (x0 + 1) * T + PW / 2; break; }
    }
    // Vertical
    p.vy += GRAV * dt;
    if(p.vy > 700) p.vy = 700;
    p.y += p.vy * dt;
    p.enSuelo = false;
    x0 = Math.floor((p.x - PW / 2 + 0.5) / T); x1 = Math.floor((p.x + PW / 2 - 0.5) / T);
    if(p.vy >= 0){
      const ty = Math.floor(p.y / T);
      for(let tx = x0; tx <= x1; tx++){
        if(solido(tx, ty) && !solido(tx, ty - 1) && p.y - p.vy * dt <= ty * T + 1){ p.y = ty * T; p.vy = 0; p.enSuelo = true; break; }
      }
      if(!p.enSuelo){
        // pegado a una pared al caer pisando justo el borde
        for(let tx = x0; tx <= x1; tx++){ if(solido(tx, ty) && p.y > ty * T && p.y - ty * T < 6){ p.y = ty * T; p.vy = 0; p.enSuelo = true; break; } }
      }
    } else {
      const ty = Math.floor((p.y - PH) / T);
      for(let tx = x0; tx <= x1; tx++){ if(solido(tx, ty)){ p.y = (ty + 1) * T + PH; p.vy = 0; break; } }
    }
  }

  j.punteros = (lista) => {
    const dentro = (b, pt) => Math.hypot(pt[0] - b.x, pt[1] - b.y) < b.r + 14;
    j.izq = lista.some(pt => dentro(botones.izq, pt));
    j.der = lista.some(pt => dentro(botones.der, pt));
    j.salto = lista.some(pt => dentro(botones.salto, pt));
  };
  j.tecla = (k) => { if(k === 'ArrowLeft' || k === 'a') j.izq = true; else if(k === 'ArrowRight' || k === 'd') j.der = true; else if(k === ' ' || k === 'ArrowUp' || k === 'w') j.salto = true; };
  j.teclaSuelta = (k) => { if(k === 'ArrowLeft' || k === 'a') j.izq = false; else if(k === 'ArrowRight' || k === 'd') j.der = false; else if(k === ' ' || k === 'ArrowUp' || k === 'w') j.salto = false; };

  generar();
  j.cartelTexto = 'Usá los botones de abajo'; j.cartel = 3;

  function perderVida(){
    if(j.estado !== 'jugando') return;
    j.estado = 'muerto'; j.muriendo = 0.001;
    reproducirTono('fin');
  }

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.cartel > 0) j.cartel -= dt;
    if(j.estado === 'muerto'){
      j.muriendo += dt;
      j.p.vy += GRAV * dt; j.p.y += j.p.vy * dt;
      if(j.muriendo > 1.1){
        j.vidas--;
        if(j.vidas <= 0){ j.terminado = true; return; }
        // Reaparece al principio del nivel, sin perder lo juntado
        ponerJugador(); j.estado = 'jugando';
        j.enemigos.forEach(e => { e.viva = true; });
      }
      return;
    }
    if(j.estado === 'nivel'){
      j.espera -= dt;
      if(j.espera <= 0){ j.nivel++; generar(); j.estado = 'jugando'; j.cartelTexto = 'Nivel ' + j.nivel; j.cartel = 2; }
      return;
    }
    const p = j.p;
    if(p.invulnerable > 0) p.invulnerable -= dt;

    // Salto: se levanta con la velocidad y se corta si se suelta antes
    if(j.salto && p.enSuelo){ p.vy = -SALTO; p.enSuelo = false; reproducirTono('tick'); }
    if(!j.salto && p.vy < -140) p.vy = -140;
    mover(dt);

    // Enemigos
    j.enemigos.forEach(e => {
      if(!e.viva) return;
      e.x += e.vx * dt;
      if(e.x < e.izq){ e.x = e.izq; e.vx = Math.abs(e.vx); }
      if(e.x > e.der){ e.x = e.der; e.vx = -Math.abs(e.vx); }
      const solapaX = Math.abs(e.x - p.x) < (PW + 14) / 2;
      const solapaY = p.y > e.y - 12 && p.y - PH < e.y + 14;
      if(solapaX && solapaY){
        if(p.vy > 60 && p.y - 8 < e.y + 2){ e.viva = false; p.vy = -260; j.puntaje += 50; reproducirTono('correcto'); }
        else if(p.invulnerable <= 0) perderVida();
      }
    });
    // Monedas B
    j.coinsLista.forEach(c => {
      if(c.ok) return;
      if(Math.abs(c.x - p.x) < 14 && Math.abs(c.y - (p.y - PH / 2)) < 16){
        c.ok = true; j.monedas++; j.puntaje += 10;
        if(j.premio && j.monedas % 6 === 0) j.premio(1);
        reproducirTono('correcto');
      }
    });
    // Se cayó
    if(p.y > VIS_H + 40) perderVida();
    // Bandera
    if(p.x > j.bandera && j.estado === 'jugando'){
      j.estado = 'nivel'; j.espera = 1.5; j.puntaje += 200;
      if(j.premio) j.premio(3);
      reproducirTono('bonus');
    }
    j.camara = Math.max(0, Math.min(j.columnas * T - VIS_W, p.x - 85));
  };

  function dibujarPasajero(ctx, p, muerto){
    ctx.save();
    ctx.translate(p.x - j.camara, p.y);
    if(p.invulnerable > 0 && Math.floor(j.t * 14) % 2 && !muerto) ctx.globalAlpha = 0.4;
    ctx.scale(p.dir, 1);
    const paso = p.enSuelo && Math.abs(p.vx) > 1 ? Math.sin(j.t * 16) * 3 : 0;
    ctx.fillStyle = '#2B3A67'; ctx.fillRect(-4, -6, 3.5, 6 + paso * 0.4); ctx.fillRect(0.5, -6, 3.5, 6 - paso * 0.4);
    ctx.fillStyle = '#E6A817'; arcRR(ctx, -6, -14, 12, 9, 3); ctx.fill();
    ctx.fillStyle = '#F2C9A0'; ctx.beginPath(); ctx.arc(0, -16.5, 4.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#0F2A4D'; ctx.fillRect(-4.6, -21, 9.2, 3);
    ctx.fillStyle = '#12161F'; ctx.fillRect(1.6, -17, 1.4, 1.8);
    arcLogo(ctx, 0, -9.5, 7);
    // Valija
    ctx.fillStyle = '#B5651D'; ctx.fillRect(5, -7, 6, 6);
    ctx.restore();
  }

  j.dibujar = (ctx) => {
    const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
    cielo.addColorStop(0, '#4FB3FF'); cielo.addColorStop(0.75, '#CFEBFF'); cielo.addColorStop(1, '#E8F7FF');
    ctx.fillStyle = cielo; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.save(); ctx.scale(ESC, ESC);
    // Colinas con paralaje
    ctx.fillStyle = 'rgba(120,190,150,.55)';
    for(let i = -1; i < 5; i++){ const bx = i * 110 - (j.camara * 0.3) % 110; ctx.beginPath(); ctx.ellipse(bx + 60, SUELO * T + 4, 70, 46, 0, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for(let i = 0; i < 4; i++){ const cx = ((i * 140 - j.camara * 0.15) % 460 + 460) % 460 - 80; ctx.beginPath(); ctx.arc(cx, 70 + (i % 2) * 40, 14, 0, 7); ctx.arc(cx + 14, 74 + (i % 2) * 40, 11, 0, 7); ctx.arc(cx - 14, 76 + (i % 2) * 40, 9, 0, 7); ctx.fill(); }

    const x0 = Math.floor(j.camara / T), x1 = Math.ceil((j.camara + ANCHO) / T);
    for(let tx = x0; tx <= x1; tx++){
      if(tx < 0 || tx >= j.columnas) continue;
      const h = j.alturas[tx];
      if(h >= 0){
        const px = tx * T - j.camara;
        ctx.fillStyle = '#8B5A2B'; ctx.fillRect(px, h * T, T, ALTO - h * T);
        ctx.fillStyle = '#6E4620'; for(let ty = h + 1; ty < 24; ty++){ ctx.fillRect(px + ((ty + tx) % 2) * 10, ty * T + 8, 8, 3); }
        ctx.fillStyle = '#5BBF5A'; ctx.fillRect(px, h * T, T, 6);
        ctx.fillStyle = '#7ED27D'; ctx.fillRect(px, h * T, T, 2);
      }
    }
    j.bloques.forEach(k => {
      const [tx, ty] = k.split(',').map(Number);
      const px = tx * T - j.camara;
      if(px < -T || px > ANCHO) return;
      ctx.fillStyle = '#C0622F'; ctx.fillRect(px, ty * T, T, T);
      ctx.fillStyle = '#E6A817'; ctx.fillRect(px + 1, ty * T + 1, T - 2, 4);
      ctx.fillStyle = '#8F3F18'; ctx.fillRect(px + 1, ty * T + T - 4, T - 2, 3);
    });

    // Bandera de llegada con la B
    const bx = j.bandera - j.camara;
    if(bx > -40 && bx < ANCHO + 40){
      ctx.fillStyle = '#E8ECF5'; ctx.fillRect(bx, (SUELO - 6) * T, 3, 6 * T);
      ctx.fillStyle = '#0F2A4D'; ctx.beginPath(); ctx.moveTo(bx + 3, (SUELO - 6) * T); ctx.lineTo(bx + 33, (SUELO - 6) * T + 11); ctx.lineTo(bx + 3, (SUELO - 6) * T + 22); ctx.fill();
      arcLogo(ctx, bx + 14, (SUELO - 6) * T + 11, 14, '#fff');
    }

    j.coinsLista.forEach(c => {
      if(c.ok) return;
      const px = c.x - j.camara;
      if(px < -20 || px > ANCHO + 20) return;
      const bob = Math.sin(j.t * 5 + c.x) * 2;
      arcLogo(ctx, px, c.y + bob, 15, '#FFE9A6');
    });

    j.enemigos.forEach(e => {
      if(!e.viva) return;
      const px = e.x - j.camara;
      if(px < -20 || px > ANCHO + 20) return;
      // Cono ambulante
      ctx.fillStyle = '#FF7A1A'; ctx.beginPath(); ctx.moveTo(px - 8, e.y + 14); ctx.lineTo(px, e.y - 8); ctx.lineTo(px + 8, e.y + 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(px - 5, e.y + 1, 10, 3);
      ctx.fillRect(px - 8, e.y + 12, 16, 3);
      ctx.fillStyle = '#12161F'; ctx.beginPath(); ctx.arc(px - 2.5, e.y - 1, 1.4, 0, 7); ctx.arc(px + 2.5, e.y - 1, 1.4, 0, 7); ctx.fill();
    });

    dibujarPasajero(ctx, j.p, j.estado === 'muerto');
    ctx.restore();

    // HUD
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(15,42,77,.85)'; ctx.lineWidth = 3;
    ctx.font = '800 14px Poppins, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const hud = 'Nivel ' + j.nivel;
    ctx.strokeText(hud, 10, 18); ctx.fillText(hud, 10, 18);
    arcLogo(ctx, 100, 18, 15);
    ctx.strokeText('× ' + j.monedas, 112, 18); ctx.fillText('× ' + j.monedas, 112, 18);
    ctx.textAlign = 'right'; ctx.font = '14px ' + ARC_FUENTE_EMOJI;
    ctx.fillText('❤️'.repeat(Math.max(0, j.vidas)), ANCHO - 10, 18);

    // Botones táctiles
    const boton = (b, texto, activo) => {
      ctx.fillStyle = activo ? 'rgba(255,216,77,.85)' : 'rgba(15,42,77,.55)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '800 ' + (b.r > 29 ? 15 : 24) + 'px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(texto, b.x, b.y + 1);
    };
    boton(botones.izq, '◀', j.izq); boton(botones.der, '▶', j.der); boton(botones.salto, 'SALTAR', j.salto);

    if(j.cartel > 0) arcCartel(ctx, j.cartelTexto, ANCHO, 40, Math.min(1, j.cartel));
    if(j.estado === 'nivel') arcCartel(ctx, '¡Llegaste! Nivel completo', ANCHO, 120, 1);
    if(j.estado === 'muerto'){ ctx.fillStyle = 'rgba(229,72,77,' + Math.min(.4, j.muriendo * .6) + ')'; ctx.fillRect(0, 0, ANCHO, ALTO); }
  };

  return j;
}

ARC_JUEGOS.bombas = {
  titulo: 'Bombas y Bloques', tema: 'menta', crear: arcCrearBombas, emojiFin: '💣', textoFin: '¡Explotaste!',
  instrucciones: 'Arrastrá el dedo para moverte y tocá con otro dedo (o tocá sin mover) para poner una bomba. Rompé las valijas y sacá de la ruta a los enemigos. ¡Alejate antes de que explote!',
  monedas: p => Math.min(15, Math.floor(p / 150)),
};
ARC_JUEGOS.plataformas = {
  titulo: 'Aventura del Pasajero', tema: 'cielo', crear: arcCrearPlataformas, emojiFin: '🧳', textoFin: '¡Se terminó el viaje!',
  instrucciones: 'Corré con ◀ ▶ y saltá con SALTAR (mantené apretado para saltar más alto). Juntá las B de Busmac, saltale encima a los conos y llegá a la bandera.',
  monedas: p => Math.min(15, Math.floor(p / 100)),
};
