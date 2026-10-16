// Más juegos de acción sobre el motor de arcade.js: Tetris, Arkanoid
// (Ladrillos) y Estacionar el micro.

// ---- Tetris: tablero de 10 x 20 ----

function arcCrearTetris(){
  const COLS = 10, FILAS = 20, C = 22, ANCHO = 300, ALTO = 440;
  const PIEZAS = {
    I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]],
  };
  const COLORES = { I: '#4FB8FF', O: '#FFD84D', T: '#B66DFF', S: '#5BE88D', Z: '#FF5E62', J: '#4F7BFF', L: '#FF9A3D' };
  const PUNTOS_LINEAS = [0, 100, 300, 500, 800];

  const j = {
    ancho: ANCHO, alto: ALTO, toqueAlSoltar: true,
    tablero: Array.from({ length: FILAS }, () => Array(COLS).fill(null)),
    pieza: null, siguiente: null, bolsa: [], acum: 0, puntaje: 0, lineas: 0, nivel: 1,
    flash: null, muriendo: 0, terminado: false, t: 0,
  };

  function sacarTipo(){
    if(!j.bolsa.length){
      j.bolsa = Object.keys(PIEZAS);
      for(let i = j.bolsa.length - 1; i > 0; i--){
        const k = Math.floor(Math.random() * (i + 1));
        [j.bolsa[i], j.bolsa[k]] = [j.bolsa[k], j.bolsa[i]];
      }
    }
    return j.bolsa.pop();
  }
  const rotar = m => m[0].map((_, i) => m.map(f => f[i]).reverse());
  function choca(m, x, y){
    for(let r = 0; r < m.length; r++){
      for(let c = 0; c < m[r].length; c++){
        if(!m[r][c]) continue;
        const tx = x + c, ty = y + r;
        if(tx < 0 || tx >= COLS || ty >= FILAS) return true;
        if(ty >= 0 && j.tablero[ty][tx]) return true;
      }
    }
    return false;
  }
  function nueva(){
    const tipo = j.siguiente || sacarTipo();
    j.siguiente = sacarTipo();
    const m = PIEZAS[tipo].map(f => f.slice());
    j.pieza = { tipo, m, x: Math.floor((COLS - m[0].length) / 2), y: 0 };
    if(choca(j.pieza.m, j.pieza.x, j.pieza.y)){
      j.muriendo = 0.001;
      reproducirTono('fin');
    }
  }
  nueva();

  function fijar(){
    const p = j.pieza;
    p.m.forEach((fila, r) => fila.forEach((v, c) => {
      if(v && p.y + r >= 0) j.tablero[p.y + r][p.x + c] = p.tipo;
    }));
    const llenas = [];
    j.tablero.forEach((f, i) => { if(f.every(Boolean)) llenas.push(i); });
    if(llenas.length){
      j.flash = { filas: llenas, t: 0.22 };
      j.puntaje += PUNTOS_LINEAS[llenas.length] * j.nivel;
      j.lineas += llenas.length;
      j.nivel = 1 + Math.floor(j.lineas / 8);
      reproducirTono('bonus');
      j.pieza = null;
    } else {
      reproducirTono('tick');
      nueva();
    }
  }

  function mover(dx){
    if(!j.pieza || j.flash || j.muriendo) return;
    if(!choca(j.pieza.m, j.pieza.x + dx, j.pieza.y)) j.pieza.x += dx;
  }
  function girar(){
    if(!j.pieza || j.flash || j.muriendo) return;
    const m = rotar(j.pieza.m);
    for(const dx of [0, -1, 1, -2, 2]){
      if(!choca(m, j.pieza.x + dx, j.pieza.y)){ j.pieza.m = m; j.pieza.x += dx; return; }
    }
  }
  function bajar(){
    if(!j.pieza || j.flash || j.muriendo) return false;
    if(choca(j.pieza.m, j.pieza.x, j.pieza.y + 1)) return false;
    j.pieza.y++;
    return true;
  }
  function caerYa(){
    if(!j.pieza || j.flash || j.muriendo) return;
    let n = 0;
    while(bajar()) n++;
    j.puntaje += n * 2;
    fijar();
  }

  j.toque = () => girar();
  j.deslizar = (dir) => {
    if(dir === 'izq') mover(-1);
    else if(dir === 'der') mover(1);
    else if(dir === 'abj'){ if(bajar()){ j.puntaje += 1; j.acum = 0; } }
  };
  j.lanzar = (dir) => { if(dir === 'abj') caerYa(); };
  j.tecla = (k) => {
    if(k === 'ArrowLeft' || k === 'a') mover(-1);
    else if(k === 'ArrowRight' || k === 'd') mover(1);
    else if(k === 'ArrowUp' || k === 'w') girar();
    else if(k === 'ArrowDown' || k === 's'){ if(bajar()){ j.puntaje += 1; j.acum = 0; } }
    else if(k === ' ') caerYa();
  };

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.muriendo){
      j.muriendo += dt;
      if(j.muriendo > 0.9) j.terminado = true;
      return;
    }
    if(j.flash){
      j.flash.t -= dt;
      if(j.flash.t <= 0){
        const llenas = j.flash.filas;
        j.tablero = j.tablero.filter((_, i) => !llenas.includes(i));
        while(j.tablero.length < FILAS) j.tablero.unshift(Array(COLS).fill(null));
        j.flash = null;
        nueva();
      }
      return;
    }
    j.acum += dt;
    const paso = Math.max(0.09, 0.85 - (j.nivel - 1) * 0.07);
    while(j.acum >= paso && !j.muriendo && !j.flash){
      j.acum -= paso;
      if(!bajar()){ fijar(); break; }
    }
  };

  function celda(ctx, x, y, color, alfa){
    ctx.globalAlpha = alfa == null ? 1 : alfa;
    ctx.fillStyle = color;
    arcRR(ctx, x + 1, y + 1, C - 2, C - 2, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    arcRR(ctx, x + 3, y + 3, C - 6, 5, 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  j.dibujar = (ctx) => {
    ctx.fillStyle = '#12224A'; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = '#0B1733'; ctx.fillRect(0, 0, COLS * C, ALTO);
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    for(let x = 1; x < COLS; x++){ ctx.beginPath(); ctx.moveTo(x * C, 0); ctx.lineTo(x * C, ALTO); ctx.stroke(); }
    for(let y = 1; y < FILAS; y++){ ctx.beginPath(); ctx.moveTo(0, y * C); ctx.lineTo(COLS * C, y * C); ctx.stroke(); }

    j.tablero.forEach((fila, y) => fila.forEach((tipo, x) => { if(tipo) celda(ctx, x * C, y * C, COLORES[tipo]); }));

    if(j.pieza && !j.muriendo){
      let gy = j.pieza.y;
      while(!choca(j.pieza.m, j.pieza.x, gy + 1)) gy++;
      j.pieza.m.forEach((fila, r) => fila.forEach((v, c) => {
        if(v){
          if(gy !== j.pieza.y){
            ctx.strokeStyle = COLORES[j.pieza.tipo]; ctx.globalAlpha = .45; ctx.lineWidth = 2;
            arcRR(ctx, (j.pieza.x + c) * C + 2, (gy + r) * C + 2, C - 4, C - 4, 4); ctx.stroke(); ctx.globalAlpha = 1;
          }
          celda(ctx, (j.pieza.x + c) * C, (j.pieza.y + r) * C, COLORES[j.pieza.tipo]);
        }
      }));
    }
    if(j.flash){
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * Math.sin(j.flash.t * 40) ** 2})`;
      j.flash.filas.forEach(f => ctx.fillRect(0, f * C, COLS * C, C));
    }

    // Panel lateral
    const px = COLS * C + 8;
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    arcRR(ctx, px, 12, 72, 86, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 11px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SIGUIENTE', px + 36, 26);
    if(j.siguiente){
      const m = PIEZAS[j.siguiente], t = 15;
      const ox = px + 36 - (m[0].length * t) / 2, oy = 62 - (m.length * t) / 2 + 6;
      m.forEach((fila, r) => fila.forEach((v, c) => {
        if(v){
          ctx.fillStyle = COLORES[j.siguiente];
          arcRR(ctx, ox + c * t + 1, oy + r * t + 1, t - 2, t - 2, 3); ctx.fill();
        }
      }));
    }
    const dato = (titulo, valor, y) => {
      ctx.fillStyle = 'rgba(255,255,255,.1)'; arcRR(ctx, px, y, 72, 48, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '700 10px Poppins, sans-serif'; ctx.fillText(titulo, px + 36, y + 14);
      ctx.fillStyle = '#fff'; ctx.font = '800 17px "Baloo 2", Poppins, sans-serif'; ctx.fillText(String(valor), px + 36, y + 33);
    };
    dato('NIVEL', j.nivel, 110);
    dato('LÍNEAS', j.lineas, 166);
    if(j.muriendo){
      ctx.fillStyle = `rgba(229,72,77,${Math.min(.5, j.muriendo * .8)})`;
      ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  };

  return j;
}

// ---- Ladrillos (Arkanoid): rebotá la pelota y rompé todo ----

function arcCrearLadrillos(){
  const ANCHO = 300, ALTO = 460, PALA_W = 58, PALA_H = 10, PALA_Y = 428, R = 5;
  const COLS = 8, BW = 33, BH = 14, GAP = 2, X0 = 11, Y0 = 56;
  const COLORES = ['#FF5E62', '#FF9A3D', '#FFD84D', '#5BE88D', '#4FB8FF', '#B66DFF'];

  const j = {
    ancho: ANCHO, alto: ALTO,
    nivel: 1, vidas: 3, puntaje: 0, pala: ANCHO / 2, objetivo: ANCHO / 2, pelota: null, ladrillos: [],
    pegada: true, velocidad: 215, muriendo: 0, terminado: false, t: 0, cartel: 0, cartelTexto: '', teclas: 0,
  };

  function armar(){
    const filas = Math.min(4 + j.nivel, 8);
    j.ladrillos = [];
    for(let f = 0; f < filas; f++){
      for(let c = 0; c < COLS; c++){
        const dura = j.nivel >= 2 && f < Math.min(j.nivel - 1, 2);
        j.ladrillos.push({ x: X0 + c * (BW + GAP), y: Y0 + f * (BH + GAP), vida: dura ? 2 : 1, color: COLORES[f % COLORES.length] });
      }
    }
    j.velocidad = 215 + (j.nivel - 1) * 18;
    ponerPelota();
  }
  function ponerPelota(){
    j.pegada = true;
    j.pelota = { x: j.pala, y: PALA_Y - R - 1, vx: 0, vy: 0 };
  }
  armar();
  j.cartelTexto = 'Tocá para lanzar'; j.cartel = 99;

  function lanzar(){
    if(!j.pegada || j.muriendo) return;
    j.pegada = false;
    const ang = (Math.random() * 0.6 - 0.3);
    j.pelota.vx = Math.sin(ang) * j.velocidad;
    j.pelota.vy = -Math.cos(ang) * j.velocidad;
    j.cartel = 0;
  }
  j.toque = () => lanzar();
  j.arrastrar = (x) => { j.objetivo = x; };
  j.tecla = (k) => {
    if(k === ' ' || k === 'ArrowUp') lanzar();
    else if(k === 'ArrowLeft') j.teclas = -1;
    else if(k === 'ArrowRight') j.teclas = 1;
  };
  j.teclaSuelta = (k) => { if(k === 'ArrowLeft' || k === 'ArrowRight') j.teclas = 0; };

  function pasoFisico(dt){
    const p = j.pelota;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if(p.x < R){ p.x = R; p.vx = Math.abs(p.vx); }
    if(p.x > ANCHO - R){ p.x = ANCHO - R; p.vx = -Math.abs(p.vx); }
    if(p.y < R){ p.y = R; p.vy = Math.abs(p.vy); }

    // Pala
    if(p.vy > 0 && p.y + R >= PALA_Y && p.y - R <= PALA_Y + PALA_H && p.x >= j.pala - PALA_W / 2 - R && p.x <= j.pala + PALA_W / 2 + R){
      let rel = Math.max(-1, Math.min(1, (p.x - j.pala) / (PALA_W / 2)));
      // Pegarle justo al medio mandaría la pelota derecho para siempre: se la desvía un poco.
      if(Math.abs(rel) < 0.14) rel = (Math.random() < 0.5 ? -1 : 1) * (0.14 + Math.random() * 0.1);
      const ang = rel * 1.05;
      p.vx = Math.sin(ang) * j.velocidad;
      p.vy = -Math.cos(ang) * j.velocidad;
      p.y = PALA_Y - R;
      reproducirTono('tick');
    }

    // Ladrillos
    for(let i = 0; i < j.ladrillos.length; i++){
      const b = j.ladrillos[i];
      const cx = Math.max(b.x, Math.min(p.x, b.x + BW)), cy = Math.max(b.y, Math.min(p.y, b.y + BH));
      const dx = p.x - cx, dy = p.y - cy;
      if(dx * dx + dy * dy > R * R) continue;
      const penX = Math.min(p.x + R - b.x, b.x + BW - (p.x - R));
      const penY = Math.min(p.y + R - b.y, b.y + BH - (p.y - R));
      if(penX < penY) p.vx = -p.vx; else p.vy = -p.vy;
      b.vida--;
      j.puntaje += 10;
      if(b.vida <= 0){ j.ladrillos.splice(i, 1); reproducirTono('correcto'); } else reproducirTono('tick');
      break;
    }
  }

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.muriendo){
      j.muriendo += dt;
      if(j.muriendo > 0.8) j.terminado = true;
      return;
    }
    if(j.teclas) j.objetivo = Math.max(0, Math.min(ANCHO, j.objetivo + j.teclas * 340 * dt));
    const destino = Math.max(PALA_W / 2, Math.min(ANCHO - PALA_W / 2, j.objetivo));
    j.pala += (destino - j.pala) * Math.min(1, dt * 22);
    if(j.cartel > 0 && j.cartel < 50) j.cartel -= dt;

    if(j.pegada){ j.pelota.x = j.pala; return; }
    const sub = 3;
    for(let i = 0; i < sub && !j.muriendo; i++){
      pasoFisico(dt / sub);
      if(j.pelota.y > ALTO + 10){
        j.vidas--;
        if(j.vidas <= 0){ j.muriendo = 0.001; reproducirTono('fin'); }
        else { ponerPelota(); reproducirTono('incorrecto'); j.cartelTexto = 'Tocá para lanzar'; j.cartel = 99; }
        return;
      }
    }
    if(!j.ladrillos.length){
      j.puntaje += 50;
      j.nivel++;
      armar();
      reproducirTono('bonus');
      j.cartelTexto = '¡Nivel ' + j.nivel + '!'; j.cartel = 99;
    }
  };

  j.dibujar = (ctx) => {
    const fondo = ctx.createLinearGradient(0, 0, 0, ALTO);
    fondo.addColorStop(0, '#2B1B66'); fondo.addColorStop(1, '#0F1B4A');
    ctx.fillStyle = fondo; ctx.fillRect(0, 0, ANCHO, ALTO);

    j.ladrillos.forEach(b => {
      ctx.fillStyle = b.color;
      arcRR(ctx, b.x, b.y, BW, BH, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(b.x + 3, b.y + 2, BW - 6, 3);
      if(b.vida > 1){
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
        arcRR(ctx, b.x + 1, b.y + 1, BW - 2, BH - 2, 3); ctx.stroke();
      }
    });

    // Pala (un micro de costado)
    const px = j.pala - PALA_W / 2;
    ctx.fillStyle = '#E6A817'; arcRR(ctx, px, PALA_Y, PALA_W, PALA_H, 5); ctx.fill();
    ctx.fillStyle = '#0F2A4D'; arcRR(ctx, px + 3, PALA_Y + 2, PALA_W - 6, PALA_H - 4, 3); ctx.fill();
    ctx.fillStyle = '#BFE6FF';
    for(let k = 0; k < 4; k++) ctx.fillRect(px + 8 + k * 11, PALA_Y + 3, 7, 3);

    const p = j.pelota;
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, R + 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill();

    ctx.fillStyle = '#fff'; ctx.font = '800 13px Poppins, sans-serif'; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText('Nivel ' + j.nivel, 10, 22);
    ctx.textAlign = 'right';
    ctx.font = `14px ${ARC_FUENTE_EMOJI}`;
    ctx.fillText('❤️'.repeat(Math.max(0, j.vidas)), ANCHO - 10, 22);
    if(j.cartel > 0) arcCartel(ctx, j.cartelTexto, ANCHO, 330, 1);
    if(j.muriendo){
      ctx.fillStyle = `rgba(229,72,77,${Math.min(.5, j.muriendo * .8)})`;
      ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  };

  return j;
}

// ---- Estacionar el micro: entrá al lugar libre sin tocar nada ----

function arcCrearParking(){
  const ANCHO = 300, ALTO = 460, N = 5, Y0 = 34, PROF = 78, BUS_W = 28, BUS_L = 58, V = 88, GIRO = 1.55;
  const COLORES_AUTO = ['#E5484D', '#4F7BFF', '#5BBF5A', '#B66DFF', '#FF9A3D', '#2FB5B5'];

  const j = {
    ancho: ANCHO, alto: ALTO,
    nivel: 1, vidas: 3, puntaje: 0, estado: 'jugando', espera: 0, cartel: 0, cartelTexto: '',
    steer: 0, teclas: 0, bus: null, coches: [], conos: [], bordes: [], meta: null, slotW: 56, x0: 0,
    muriendo: 0, terminado: false, t: 0, sacudida: 0,
  };

  function armar(){
    j.slotW = Math.max(38, 58 - (j.nivel - 1) * 4);
    const total = N * j.slotW;
    j.x0 = (ANCHO - total) / 2;
    const meta = Math.floor(Math.random() * N);
    j.meta = { x: j.x0 + meta * j.slotW, w: j.slotW, y: Y0, h: PROF };
    j.coches = [];
    for(let i = 0; i < N; i++){
      if(i === meta) continue;
      j.coches.push({ x: j.x0 + i * j.slotW + 4, y: Y0 + 6, w: j.slotW - 8, h: PROF - 12, color: COLORES_AUTO[(i + j.nivel) % COLORES_AUTO.length] });
    }
    j.bordes = [];
    if(j.x0 > 1){
      j.bordes.push({ x: 0, y: Y0 - 6, w: j.x0, h: PROF + 6 });
      j.bordes.push({ x: ANCHO - j.x0, y: Y0 - 6, w: j.x0, h: PROF + 6 });
    }
    j.conos = [];
    const cant = Math.min(4, j.nivel - 1);
    for(let i = 0; i < cant; i++){
      j.conos.push({ x: 40 + Math.random() * 220, y: 210 + Math.random() * 150, r: 8 });
    }
    const centroMeta = j.meta.x + j.meta.w / 2;
    const desvio = Math.min(1, (j.nivel - 1) / 3);
    const bx = Math.max(40, Math.min(260, centroMeta + (Math.random() - 0.5) * (80 + 120 * desvio)));
    j.bus = { x: bx, y: 424, a: -Math.PI / 2 + (Math.random() - 0.5) * 0.7 * desvio };
    // Los conos no pueden aparecer encima del micro al arrancar.
    j.conos = j.conos.filter(c => Math.hypot(c.x - j.bus.x, c.y - j.bus.y) > 70);
    j.estado = 'jugando';
  }
  armar();
  j.cartelTexto = 'Mantené apretado a un lado para girar'; j.cartel = 4;

  j.arrastrar = (x) => { j.steer = x < ANCHO / 2 ? -1 : 1; };
  j.soltar = () => { j.steer = 0; };
  j.tecla = (k) => { if(k === 'ArrowLeft') j.teclas = -1; else if(k === 'ArrowRight') j.teclas = 1; };
  j.teclaSuelta = (k) => { if(k === 'ArrowLeft' || k === 'ArrowRight') j.teclas = 0; };

  function puntosBus(){
    const b = j.bus, ca = Math.cos(b.a), sa = Math.sin(b.a), pts = [];
    for(const u of [-1, -0.5, 0, 0.5, 1]){
      for(const v of [-1, 0, 1]){
        pts.push([b.x + ca * u * BUS_L / 2 - sa * v * BUS_W / 2, b.y + sa * u * BUS_L / 2 + ca * v * BUS_W / 2]);
      }
    }
    return pts;
  }
  function hayChoque(){
    const rects = j.coches.concat(j.bordes);
    for(const [x, y] of puntosBus()){
      if(x < 2 || x > ANCHO - 2 || y > ALTO - 2) return true;
      for(const r of rects){
        if(x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
      }
      for(const c of j.conos){
        if(Math.hypot(x - c.x, y - c.y) < c.r + 1.5) return true;
      }
    }
    return false;
  }
  function fallar(texto){
    j.estado = 'fallo'; j.espera = 0.9; j.cartelTexto = texto; j.cartel = 1.2; j.sacudida = 0.4;
    j.vidas--;
    reproducirTono('fin');
  }

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.cartel > 0) j.cartel -= dt;
    if(j.sacudida > 0) j.sacudida -= dt;
    if(j.estado !== 'jugando'){
      j.espera -= dt;
      if(j.espera > 0) return;
      if(j.estado === 'ok'){ j.nivel++; armar(); }
      else if(j.vidas <= 0){ j.terminado = true; }
      else armar();
      return;
    }
    const dir = j.teclas || j.steer;
    const b = j.bus;
    b.a += dir * GIRO * dt;
    b.x += Math.cos(b.a) * V * dt;
    b.y += Math.sin(b.a) * V * dt;

    if(hayChoque()){ fallar('¡Chocaste!'); return; }
    const frenteY = b.y + Math.sin(b.a) * BUS_L / 2;
    if(frenteY <= j.meta.y + 8){
      const torcido = Math.abs(b.a + Math.PI / 2);
      if(torcido > 0.26){ fallar('¡Quedó torcido!'); return; }
      j.estado = 'ok'; j.espera = 0.9; j.puntaje = j.nivel;
      j.cartelTexto = '¡Bien estacionado!'; j.cartel = 1.2;
      reproducirTono('bonus');
    }
  };

  function dibujarMicro(ctx, x, y, a, w, l, color){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    const k = l / 66, kw = w / 38;
    ctx.scale(kw, k);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; arcRR(ctx, -17, -31, 38, 66, 8); ctx.fill();
    ctx.fillStyle = color || '#0F2A4D'; arcRR(ctx, -19, -33, 38, 66, 8); ctx.fill();
    ctx.fillStyle = '#E6A817'; ctx.fillRect(-19, -3, 38, 7);
    ctx.fillStyle = '#BFE6FF'; arcRR(ctx, -15, -29, 30, 14, 4); ctx.fill();
    ctx.fillStyle = '#1D4378'; arcRR(ctx, -14, 7, 28, 20, 4); ctx.fill();
    ctx.fillStyle = '#FFF3B0'; ctx.beginPath(); ctx.arc(-13, -32, 3, 0, 7); ctx.arc(13, -32, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#E5484D'; ctx.fillRect(-16, 30, 7, 3); ctx.fillRect(9, 30, 7, 3);
    ctx.restore();
  }

  j.dibujar = (ctx) => {
    ctx.save();
    if(j.sacudida > 0) ctx.translate(Math.sin(j.t * 90) * 3, 0);
    ctx.fillStyle = '#4B5260'; ctx.fillRect(0, 0, ANCHO, ALTO);
    // Textura de asfalto
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for(let i = 0; i < 40; i++) ctx.fillRect((i * 97) % ANCHO, (i * 53) % ALTO, 3, 2);

    // Vereda y paredes del fondo
    ctx.fillStyle = '#9AA3B2'; ctx.fillRect(0, 0, ANCHO, Y0 - 4);
    ctx.fillStyle = '#7E8797'; ctx.fillRect(0, Y0 - 6, ANCHO, 3);
    j.bordes.forEach(r => { ctx.fillStyle = '#9AA3B2'; ctx.fillRect(r.x, r.y, r.w, r.h); });

    // Líneas de los lugares
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
    for(let i = 0; i <= N; i++){
      const x = j.x0 + i * j.slotW;
      ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y0 + PROF); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(j.x0, Y0 + PROF); ctx.lineTo(j.x0 + N * j.slotW, Y0 + PROF); ctx.stroke();

    // Lugar libre
    const m = j.meta;
    const pulso = 0.25 + 0.15 * Math.sin(j.t * 5);
    ctx.fillStyle = `rgba(91,232,141,${pulso})`; ctx.fillRect(m.x + 1, m.y, m.w - 2, m.h);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '800 26px "Baloo 2", Poppins, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('P', m.x + m.w / 2, m.y + m.h / 2);

    j.coches.forEach(c => {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; arcRR(ctx, c.x + 2, c.y + 2, c.w, c.h, 8); ctx.fill();
      ctx.fillStyle = c.color; arcRR(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; arcRR(ctx, c.x + 4, c.y + c.h - 24, c.w - 8, 14, 4); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.3)'; arcRR(ctx, c.x + 4, c.y + 8, c.w - 8, 18, 4); ctx.fill();
    });
    j.conos.forEach(c => {
      ctx.fillStyle = '#FF7A1A'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * .55, 0, 7); ctx.fill();
      ctx.fillStyle = '#FF7A1A'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * .25, 0, 7); ctx.fill();
    });

    dibujarMicro(ctx, j.bus.x, j.bus.y, j.bus.a, BUS_W, BUS_L, j.estado === 'fallo' ? '#7A1F2A' : null);

    ctx.fillStyle = 'rgba(15,42,77,.8)'; arcRR(ctx, 8, ALTO - 30, 130, 22, 11); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 12px Poppins, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('Nivel ' + j.nivel, 18, ALTO - 19);
    ctx.font = `12px ${ARC_FUENTE_EMOJI}`; ctx.textAlign = 'right';
    ctx.fillText('❤️'.repeat(Math.max(0, j.vidas)), 130, ALTO - 19);
    ctx.restore();
    arcCartel(ctx, j.cartelTexto, ANCHO, 12, j.cartel);
  };

  return j;
}

ARC_JUEGOS.tetris = {
  titulo: 'Tetris', tema: 'noche', crear: arcCrearTetris, emojiFin: '🧱', textoFin: '¡Se llenó el tablero!',
  instrucciones: 'Arrastrá para mover la pieza, tocá para girarla y deslizá rápido hacia abajo para soltarla. Completá líneas.',
  monedas: p => Math.min(12, Math.floor(p / 120)),
};
ARC_JUEGOS.ladrillos = {
  titulo: 'Ladrillos', tema: 'noche', crear: arcCrearLadrillos, emojiFin: '💥', textoFin: '¡Se acabaron las vidas!',
  instrucciones: 'Mové el micro con el dedo para que la pelota no se caiga y rompé todos los ladrillos. Tocá para lanzar.',
  monedas: p => Math.min(12, Math.floor(p / 60)),
};
ARC_JUEGOS.parking = {
  titulo: 'Estacionar el Micro', tema: 'cielo', crear: arcCrearParking, emojiFin: '🅿️', textoFin: '¡Sin intentos!',
  instrucciones: 'El micro avanza solo. Mantené apretado a la izquierda o a la derecha para girar y entrá derecho al lugar libre (la P). Tenés 3 intentos.',
  monedas: p => Math.min(12, p * 3),
};
