// Juegos de acción (se dibujan en un canvas): Corredor del Micro, Vuelo y
// Serpiente. Comparten este motor: pantalla de inicio, bucle de juego,
// entrada táctil (toque y deslizar) o teclado, récord guardado en el celular
// y monedas al terminar la partida.
//
// Las monedas salen del puntaje, con un tope por partida y otro por día para
// cada juego: así nadie junta monedas (y puntos del ranking) jugando todo el
// día sin parar. Todo es habilidad: no hay azar de por medio.

const ARC_TOPE_DIA = 40; // monedas por juego por día
const ARC_TOPE_PARTIDA = 15; // monedas por partida

function arcFechaHoy(){ return new Date().toLocaleDateString('en-CA'); }
function arcLeer(clave, defecto){
  try { const v = JSON.parse(localStorage.getItem(clave)); return v == null ? defecto : v; } catch(e){ return defecto; }
}
function arcGuardar(clave, valor){ try { localStorage.setItem(clave, JSON.stringify(valor)); } catch(e){} }
function arcMejor(id){ return arcLeer('arcade-mejor-' + id, 0); }

// Entrega monedas respetando el tope diario del juego; devuelve cuántas entregó.
function arcOtorgarMonedas(id, ganadas){
  const hoy = arcFechaHoy();
  let est = arcLeer('arcade-dia', null);
  if(!est || est.fecha !== hoy) est = { fecha: hoy, juegos: {} };
  const ya = est.juegos[id] || 0;
  const otorgar = Math.max(0, Math.min(ganadas, ARC_TOPE_DIA - ya));
  est.juegos[id] = ya + otorgar;
  arcGuardar('arcade-dia', est);
  if(otorgar > 0) ganarMonedas(otorgar);
  return otorgar;
}

// ---- Utilidades de dibujo ----

const ARC_FUENTE_EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

function arcRR(ctx, x, y, w, h, r){
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// El logo de Busmac (la B) para usarlo como pieza o adorno dentro de los juegos.
// 'fondo' (opcional) le dibuja un disco detrás para que se lea sobre colores oscuros.
const ARC_LOGO = new Image();
ARC_LOGO.src = 'logo-empresa.png';
function arcLogo(ctx, x, y, tam, fondo){
  if(fondo){
    ctx.fillStyle = fondo;
    ctx.beginPath(); ctx.arc(x, y, tam * 0.62, 0, 7); ctx.fill();
  }
  if(ARC_LOGO.complete && ARC_LOGO.naturalWidth){
    const w = tam * ARC_LOGO.naturalWidth / ARC_LOGO.naturalHeight;
    ctx.drawImage(ARC_LOGO, x - w / 2, y - tam / 2, w, tam);
  } else {
    ctx.fillStyle = '#F28A1E';
    ctx.font = '800 ' + Math.round(tam) + 'px "Baloo 2", Poppins, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('b', x, y);
  }
}

function arcEmoji(ctx, emoji, x, y, tam){
  ctx.font = `${tam}px ${ARC_FUENTE_EMOJI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
}

function arcCartel(ctx, texto, ancho, y, alfa){
  if(alfa <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alfa);
  ctx.font = '800 13px Poppins, sans-serif';
  const w = ctx.measureText(texto).width + 24;
  ctx.fillStyle = 'rgba(15,42,77,.85)';
  arcRR(ctx, (ancho - w) / 2, y, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, ancho / 2, y + 13.5);
  ctx.restore();
}

function arcMezcla(a, b, t){
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// ---- Corredor del Micro: tres carriles, esquivar y juntar monedas ----

function arcCrearCorredor(){
  const ANCHO = 300, ALTO = 460;
  const CARRILES = [80, 150, 220];
  const TRAMOS = [
    { nombre: 'Ruta 8 · Pampa', lado: [118, 190, 84], deco: ['🌳', '🌾', '🐄', '🏡', '🌻'] },
    { nombre: 'Ruta 40 · Cordillera', lado: [150, 140, 128], deco: ['🏔️', '⛰️', '🌲', '🪨', '🦙'] },
    { nombre: 'Ruta 3 · Costa Atlántica', lado: [232, 207, 140], deco: ['🌴', '⛱️', '🏖️', '🐚', '🦀'] },
  ];
  const OBSTACULOS = [
    { e: '🚧', tam: 34 }, { e: '🐄', tam: 36 }, { e: '🪨', tam: 34 }, { e: '🛢️', tam: 32 }, { e: '🚜', tam: 40 },
  ];
  const TRAMO_LARGO = 4200;

  const j = {
    ancho: ANCHO, alto: ALTO,
    carril: 1, x: CARRILES[1], dist: 0, vel: 170, monedas: 0, puntaje: 0,
    obst: [], proxFila: 240, decor: [], proxDecor: 0, scroll: 0,
    muriendo: 0, terminado: false, tramoMostrado: -1, cartel: 0, cartelTexto: '', t: 0,
  };

  function tramoActual(){ return Math.floor(j.dist / TRAMO_LARGO) % TRAMOS.length; }

  function sumarFila(){
    const libre = Math.floor(Math.random() * 3);
    const hayMoneda = Math.random() < 0.55;
    for(let c = 0; c < 3; c++){
      if(c === libre){
        if(hayMoneda) j.obst.push({ tipo: 'moneda', c, y: -30, tam: 18 });
        continue;
      }
      if(Math.random() < 0.7){
        const o = OBSTACULOS[Math.floor(Math.random() * OBSTACULOS.length)];
        j.obst.push({ tipo: 'obst', c, y: -40, e: o.e, tam: o.tam });
      }
    }
  }

  j.toque = (x) => { if(j.muriendo) return; j.mover(x < ANCHO / 2 ? -1 : 1); };
  j.deslizar = (dir) => { if(dir === 'izq') j.mover(-1); else if(dir === 'der') j.mover(1); };
  j.tecla = (k) => { if(k === 'ArrowLeft' || k === 'a') j.mover(-1); else if(k === 'ArrowRight' || k === 'd') j.mover(1); };
  j.mover = (d) => { if(!j.muriendo) j.carril = Math.max(0, Math.min(2, j.carril + d)); };

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.muriendo){
      j.muriendo += dt;
      if(j.muriendo > 0.7) j.terminado = true;
      return;
    }
    j.vel = Math.min(400, 170 + j.dist * 0.018);
    const avance = j.vel * dt;
    j.dist += avance;
    j.scroll = (j.scroll + avance) % 60;
    j.x += (CARRILES[j.carril] - j.x) * Math.min(1, dt * 14);

    j.proxFila -= avance;
    if(j.proxFila <= 0){
      sumarFila();
      j.proxFila = Math.max(190, 300 - j.dist * 0.008);
    }
    j.proxDecor -= avance;
    if(j.proxDecor <= 0){
      const deco = TRAMOS[tramoActual()].deco;
      for(let lado = 0; lado < 2; lado++){
        if(Math.random() < 0.8){
          j.decor.push({
            y: -30, lado, e: deco[Math.floor(Math.random() * deco.length)],
            x: lado ? 270 + Math.random() * 16 : 30 - Math.random() * 16, tam: 20 + Math.random() * 10,
          });
        }
      }
      j.proxDecor = 55 + Math.random() * 25;
    }
    j.decor.forEach(d => { d.y += avance; });
    j.decor = j.decor.filter(d => d.y < ALTO + 40);

    const busX = j.x, busY = 360, busW = 38, busH = 66;
    j.obst.forEach(o => { o.y += avance; });
    for(let i = j.obst.length - 1; i >= 0; i--){
      const o = j.obst[i];
      if(o.y > ALTO + 50){ j.obst.splice(i, 1); continue; }
      const ox = CARRILES[o.c];
      const choca = Math.abs(ox - busX) < (busW / 2 + o.tam / 2 - 8) && o.y + o.tam / 2 > busY + 6 && o.y - o.tam / 2 < busY + busH - 6;
      if(!choca) continue;
      if(o.tipo === 'moneda'){
        j.monedas++;
        if(j.premio && j.monedas % 4 === 0) j.premio(1);
        j.obst.splice(i, 1);
        reproducirTono('correcto');
      } else {
        j.muriendo = 0.001;
        reproducirTono('fin');
      }
    }
    j.puntaje = Math.floor(j.dist / 10) + j.monedas * 5;

    const tr = tramoActual();
    if(tr !== j.tramoMostrado){
      j.tramoMostrado = tr;
      j.cartelTexto = '📍 ' + TRAMOS[tr].nombre;
      j.cartel = 2.6;
    }
    if(j.cartel > 0) j.cartel -= dt;
  };

  j.dibujar = (ctx) => {
    const tr = tramoActual();
    const t = (j.dist % TRAMO_LARGO) / TRAMO_LARGO;
    const col = t > 0.92 ? arcMezcla(TRAMOS[tr].lado, TRAMOS[(tr + 1) % TRAMOS.length].lado, (t - 0.92) / 0.08) : TRAMOS[tr].lado;
    ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    j.decor.forEach(d => arcEmoji(ctx, d.e, d.x, d.y, d.tam));

    // Ruta
    ctx.fillStyle = '#3B4252';
    ctx.fillRect(45, 0, 210, ALTO);
    ctx.fillStyle = '#fff';
    ctx.fillRect(45, 0, 4, ALTO);
    ctx.fillRect(251, 0, 4, ALTO);
    ctx.fillStyle = '#F5D547';
    for(let carril = 1; carril < 3; carril++){
      const x = 45 + carril * 70 - 2;
      for(let y = -60 + j.scroll; y < ALTO; y += 60) ctx.fillRect(x, y, 4, 32);
    }

    // Objetos
    j.obst.forEach(o => {
      const x = CARRILES[o.c];
      if(o.tipo === 'moneda'){
        ctx.fillStyle = '#C9A227';
        ctx.beginPath(); ctx.arc(x, o.y, 11, 0, 7); ctx.fill();
        ctx.fillStyle = '#FFD84D';
        ctx.beginPath(); ctx.arc(x, o.y, 8.5, 0, 7); ctx.fill();
        arcLogo(ctx, x, o.y + 0.5, 14);
      } else {
        arcEmoji(ctx, o.e, x, o.y, o.tam);
      }
    });

    // Micro
    ctx.save();
    ctx.translate(j.x, 360);
    if(j.muriendo) ctx.translate(Math.sin(j.muriendo * 70) * 4, 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    arcRR(ctx, -17, 6, 38, 66, 8); ctx.fill();
    ctx.fillStyle = '#0F2A4D';
    arcRR(ctx, -19, 0, 38, 66, 8); ctx.fill();
    ctx.fillStyle = '#E6A817';
    ctx.fillRect(-19, 30, 38, 7);
    ctx.fillStyle = '#BFE6FF';
    arcRR(ctx, -15, 4, 30, 14, 4); ctx.fill();
    ctx.fillStyle = '#1D4378';
    arcRR(ctx, -14, 40, 28, 20, 4); ctx.fill();
    arcLogo(ctx, 0, 50, 17, '#fff');
    ctx.fillStyle = '#FFF3B0';
    ctx.beginPath(); ctx.arc(-13, 1, 3, 0, 7); ctx.arc(13, 1, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#E5484D';
    ctx.fillRect(-16, 63, 7, 3); ctx.fillRect(9, 63, 7, 3);
    if(j.muriendo){
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, .6 - j.muriendo)})`;
      arcRR(ctx, -19, 0, 38, 66, 8); ctx.fill();
    }
    ctx.restore();

    arcCartel(ctx, j.cartelTexto, ANCHO, 10, j.cartel);
  };

  return j;
}

// ---- Vuelo: un avioncito de papel entre torres ----

function arcCrearVuelo(){
  const ANCHO = 300, ALTO = 460, SUELO = 426, TORRE_W = 54, HUECO = 132, SEPARACION = 172;
  const j = {
    ancho: ANCHO, alto: ALTO,
    y: 220, vy: 0, esperando: true, torres: [], puntaje: 0, t: 0, nubes: [],
    muriendo: 0, terminado: false, scroll: 0,
  };
  for(let i = 0; i < 4; i++) j.nubes.push({ x: Math.random() * ANCHO, y: 30 + Math.random() * 200, r: 14 + Math.random() * 14, v: 8 + Math.random() * 10 });

  function nuevaTorre(x){ return { x, centro: 120 + Math.random() * (SUELO - 120 - 80), pasada: false }; }
  j.torres.push(nuevaTorre(ANCHO + 60));
  j.torres.push(nuevaTorre(ANCHO + 60 + SEPARACION));

  j.toque = () => {
    if(j.muriendo) return;
    j.esperando = false;
    j.vy = -285;
    reproducirTono('tick');
  };
  j.tecla = (k) => { if(k === ' ' || k === 'ArrowUp') j.toque(); };

  j.actualizar = (dt) => {
    j.t += dt;
    j.nubes.forEach(n => { n.x -= n.v * dt; if(n.x < -40) { n.x = ANCHO + 40; n.y = 30 + Math.random() * 200; } });
    if(j.muriendo){
      j.muriendo += dt;
      j.vy += 900 * dt; j.y += j.vy * dt;
      if(j.y > SUELO - 8) j.y = SUELO - 8;
      if(j.muriendo > 0.8) j.terminado = true;
      return;
    }
    if(j.esperando){ j.y = 220 + Math.sin(j.t * 4) * 8; return; }
    const vel = Math.min(150, 105 + j.puntaje * 2);
    j.scroll = (j.scroll + vel * dt) % 40;
    j.vy = Math.min(430, j.vy + 820 * dt);
    j.y += j.vy * dt;
    if(j.y < 8){ j.y = 8; j.vy = 0; }

    j.torres.forEach(t => { t.x -= vel * dt; });
    if(j.torres[0].x < -TORRE_W - 10){
      j.torres.shift();
      const ult = j.torres[j.torres.length - 1];
      j.torres.push(nuevaTorre(ult.x + SEPARACION));
    }
    const px = 90;
    j.torres.forEach(t => {
      if(!t.pasada && t.x + TORRE_W < px - 10){
        t.pasada = true; j.puntaje++;
        if(j.premio && j.puntaje % 2 === 0) j.premio(1);
        reproducirTono('correcto');
      }
      const dentroX = px + 9 > t.x + 3 && px - 9 < t.x + TORRE_W - 3;
      if(dentroX && (j.y - 7 < t.centro - HUECO / 2 || j.y + 7 > t.centro + HUECO / 2)) j.matar();
    });
    if(j.y > SUELO - 8) j.matar();
  };
  j.matar = () => { if(j.muriendo) return; j.muriendo = 0.001; j.vy = -120; reproducirTono('fin'); };

  function torre(ctx, x, y, w, h, tapaArriba){
    if(h <= 0) return;
    ctx.fillStyle = '#2A4E86';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#FFD84D';
    for(let fy = y + 8; fy < y + h - 6; fy += 16){
      for(let fx = x + 9; fx < x + w - 8; fx += 14){
        if(((fx + fy) | 0) % 3 !== 0) ctx.fillRect(fx, fy, 6, 8);
      }
    }
    ctx.fillStyle = '#E6A817';
    ctx.fillRect(x - 3, tapaArriba ? y + h - 10 : y, w + 6, 10);
  }

  j.dibujar = (ctx) => {
    const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
    cielo.addColorStop(0, '#4FB3FF'); cielo.addColorStop(1, '#CFEBFF');
    ctx.fillStyle = cielo; ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    j.nubes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, 7); ctx.arc(n.x + n.r * .9, n.y + 3, n.r * .75, 0, 7); ctx.arc(n.x - n.r * .9, n.y + 4, n.r * .65, 0, 7);
      ctx.fill();
    });
    // Siluetas lejanas
    ctx.fillStyle = 'rgba(120,170,225,.55)';
    for(let i = 0; i < 9; i++){
      const bx = i * 38 - (j.scroll % 38), bh = 40 + ((i * 53) % 50);
      ctx.fillRect(bx, SUELO - bh, 30, bh);
    }

    j.torres.forEach(t => {
      torre(ctx, t.x, 0, TORRE_W, t.centro - HUECO / 2, true);
      torre(ctx, t.x, t.centro + HUECO / 2, TORRE_W, SUELO - (t.centro + HUECO / 2), false);
      arcLogo(ctx, t.x + TORRE_W / 2, t.centro - HUECO / 2 - 26, 22, 'rgba(255,255,255,.92)');
      arcLogo(ctx, t.x + TORRE_W / 2, t.centro + HUECO / 2 + 26, 22, 'rgba(255,255,255,.92)');
    });

    ctx.fillStyle = '#5BBF5A'; ctx.fillRect(0, SUELO, ANCHO, ALTO - SUELO);
    ctx.fillStyle = '#3E9B4A';
    for(let x = -40 + (j.scroll % 40); x < ANCHO; x += 40) ctx.fillRect(x, SUELO + 6, 20, 5);
    ctx.fillStyle = '#7A5A33'; ctx.fillRect(0, SUELO, ANCHO, 4);

    // Avioncito de papel
    ctx.save();
    ctx.translate(90, j.y);
    ctx.rotate(Math.max(-0.5, Math.min(0.9, j.vy / 420)));
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.moveTo(18, 3); ctx.lineTo(-13, -8); ctx.lineTo(-13, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-13, -11); ctx.lineTo(-6, 0); ctx.lineTo(-13, 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#C9D8EE';
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-6, 0); ctx.lineTo(-13, 11); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8FA9CC'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-6, 0); ctx.stroke();
    ctx.restore();

    if(j.esperando){
      ctx.fillStyle = 'rgba(15,42,77,.85)';
      ctx.font = '800 14px Poppins, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Tocá para volar', ANCHO / 2, 120);
    } else {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(15,42,77,.8)'; ctx.lineWidth = 4;
      ctx.font = '800 34px "Baloo 2", Poppins, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(String(j.puntaje), ANCHO / 2, 50);
      ctx.fillText(String(j.puntaje), ANCHO / 2, 50);
    }
    if(j.muriendo){
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, .55 - j.muriendo)})`;
      ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  };

  return j;
}

// ---- Serpiente: comé medialunas y mates sin chocarte ----

function arcCrearSerpiente(){
  const COLS = 15, FILAS = 21, C = 20, ANCHO = COLS * C, ALTO = FILAS * C;
  const FRUTAS = ['🥐', '🧉', '🍪', 'B', 'B'];
  const DIR = { izq: [-1, 0], der: [1, 0], arr: [0, -1], abj: [0, 1] };
  const j = {
    ancho: ANCHO, alto: ALTO,
    cuerpo: [[6, 10], [5, 10], [4, 10]], dir: DIR.der, cola: [], fruta: null, frutaE: '🥐',
    acum: 0, puntaje: 0, muriendo: 0, terminado: false, t: 0, gracia: 0.5,
  };

  function ponerFruta(){
    let x, y;
    do { x = Math.floor(Math.random() * COLS); y = Math.floor(Math.random() * FILAS); }
    while(j.cuerpo.some(s => s[0] === x && s[1] === y));
    j.fruta = [x, y];
    j.frutaE = FRUTAS[Math.floor(Math.random() * FRUTAS.length)];
  }
  ponerFruta();

  function girar(nombre){
    const d = DIR[nombre];
    if(!d || j.muriendo) return;
    const ultima = j.cola.length ? j.cola[j.cola.length - 1] : j.dir;
    if(d[0] === -ultima[0] && d[1] === -ultima[1]) return;
    if(d[0] === ultima[0] && d[1] === ultima[1]) return;
    if(j.cola.length < 2) j.cola.push(d);
  }
  j.deslizar = girar;
  j.tecla = (k) => {
    const mapa = { ArrowLeft: 'izq', ArrowRight: 'der', ArrowUp: 'arr', ArrowDown: 'abj', a: 'izq', d: 'der', w: 'arr', s: 'abj' };
    if(mapa[k]) girar(mapa[k]);
  };
  j.toque = (x, y) => {
    // Sin deslizar: tocar a un costado o arriba/abajo de la cabeza también gira.
    const cab = j.cuerpo[0], cx = cab[0] * C + C / 2, cy = cab[1] * C + C / 2;
    const dx = x - cx, dy = y - cy;
    if(j.dir[0] !== 0) girar(dy < 0 ? 'arr' : 'abj');
    else girar(dx < 0 ? 'izq' : 'der');
  };

  j.actualizar = (dt) => {
    j.t += dt;
    if(j.muriendo){
      j.muriendo += dt;
      if(j.muriendo > 0.7) j.terminado = true;
      return;
    }
    if(j.gracia > 0){ j.gracia -= dt; return; }
    const paso = Math.max(0.085, 0.17 - j.puntaje * 0.003);
    j.acum += dt;
    while(j.acum >= paso && !j.muriendo){
      j.acum -= paso;
      if(j.cola.length) j.dir = j.cola.shift();
      const cab = j.cuerpo[0];
      const nx = cab[0] + j.dir[0], ny = cab[1] + j.dir[1];
      const come = j.fruta[0] === nx && j.fruta[1] === ny;
      const cuerpoReal = come ? j.cuerpo : j.cuerpo.slice(0, -1);
      if(nx < 0 || ny < 0 || nx >= COLS || ny >= FILAS || cuerpoReal.some(s => s[0] === nx && s[1] === ny)){
        j.muriendo = 0.001;
        reproducirTono('fin');
        return;
      }
      j.cuerpo.unshift([nx, ny]);
      if(come){
        j.puntaje++;
        if(j.premio && j.puntaje % 2 === 0) j.premio(1);
        reproducirTono('correcto');
        ponerFruta();
      } else {
        j.cuerpo.pop();
      }
    }
  };

  j.dibujar = (ctx) => {
    for(let y = 0; y < FILAS; y++){
      for(let x = 0; x < COLS; x++){
        ctx.fillStyle = (x + y) % 2 ? '#2F7D4F' : '#2A7248';
        ctx.fillRect(x * C, y * C, C, C);
      }
    }
    if(j.frutaE === 'B') arcLogo(ctx, j.fruta[0] * C + C / 2, j.fruta[1] * C + C / 2, 17 + Math.sin(j.t * 6) * 1.5, '#FFF3B0');
    else arcEmoji(ctx, j.frutaE, j.fruta[0] * C + C / 2, j.fruta[1] * C + C / 2 + 1, 17 + Math.sin(j.t * 6) * 1.5);

    const n = j.cuerpo.length;
    for(let i = n - 1; i >= 0; i--){
      const s = j.cuerpo[i];
      const f = n > 1 ? i / (n - 1) : 0;
      const g = arcMezcla([255, 216, 77], [91, 232, 141], f);
      ctx.fillStyle = i === 0 ? '#FFD84D' : `rgb(${g[0]},${g[1]},${g[2]})`;
      arcRR(ctx, s[0] * C + 1, s[1] * C + 1, C - 2, C - 2, i === 0 ? 8 : 6);
      ctx.fill();
    }
    // Ojos de la cabeza, según hacia dónde mira
    const cab = j.cuerpo[0];
    const cx = cab[0] * C + C / 2, cy = cab[1] * C + C / 2;
    const px = -j.dir[1], py = j.dir[0];
    ctx.fillStyle = '#fff';
    [-1, 1].forEach(lado => {
      ctx.beginPath(); ctx.arc(cx + j.dir[0] * 4 + px * lado * 4, cy + j.dir[1] * 4 + py * lado * 4, 3, 0, 7); ctx.fill();
    });
    ctx.fillStyle = '#0F2A4D';
    [-1, 1].forEach(lado => {
      ctx.beginPath(); ctx.arc(cx + j.dir[0] * 5 + px * lado * 4, cy + j.dir[1] * 5 + py * lado * 4, 1.5, 0, 7); ctx.fill();
    });
    if(j.muriendo){
      ctx.fillStyle = `rgba(229,72,77,${Math.max(0, .5 - j.muriendo * .6)})`;
      ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  };

  return j;
}

// ---- Motor ----

const ARC_JUEGOS = {
  corredor: {
    titulo: 'Corredor del Micro', tema: 'noche', crear: arcCrearCorredor, emojiFin: '💥', textoFin: '¡Chocaste!',
    instrucciones: 'Tocá a la izquierda o a la derecha para cambiar de carril. Esquivá los obstáculos y juntá monedas.',
    monedas: p => Math.min(15, Math.floor(p / 40)),
  },
  vuelo: {
    titulo: 'Vuelo', tema: 'cielo', crear: arcCrearVuelo, emojiFin: '🛬', textoFin: '¡Aterrizaje forzoso!',
    instrucciones: 'Tocá la pantalla para subir. Pasá entre las torres sin tocarlas.',
    monedas: p => Math.min(12, p),
  },
  serpiente: {
    titulo: 'Serpiente', tema: 'menta', crear: arcCrearSerpiente, emojiFin: '🐍', textoFin: '¡Te mordiste la cola!',
    instrucciones: 'Deslizá el dedo para girar. Comé medialunas y mates, y no choques con las paredes ni con vos misma.',
    monedas: p => Math.min(12, p),
  },
};

const arc = { enVivo: 0, id: null, def: null, juego: null, fase: 'menu', raf: 0, ultimo: 0, canvas: null, ctx: null, puntosMostrados: -1 };

// Monedas durante la partida (al pasar de nivel, completar una línea, etc.):
// cada juego llama j.premio(n). Cuentan para el tope de la partida y del día.
function arcPremioVivo(n){
  if(!arc.id || arc.fase !== 'jugando') return;
  const permitido = Math.min(n, ARC_TOPE_PARTIDA - arc.enVivo);
  if(permitido <= 0) return;
  const dado = arcOtorgarMonedas(arc.id, permitido);
  arc.enVivo += dado;
  if(dado > 0 && typeof mostrarToast === 'function') mostrarToast('+' + dado + ' 🪙', 'gain');
}

function arcDetener(){
  cancelAnimationFrame(arc.raf);
  arc.fase = 'menu';
}

function arcIniciarVista(id){
  arcDetener();
  const def = ARC_JUEGOS[id];
  const cont = document.getElementById('arc-' + id + '-content');
  if(!def || !cont) return;
  arc.id = id; arc.def = def;
  document.getElementById('view-' + id).classList.remove('juego-inmersivo');
  const sub = document.getElementById('arc-' + id + '-sub');
  if(sub) sub.textContent = 'Mejor: ' + arcMejor(id);

  arc.juego = def.crear();
  cont.innerHTML = gEscenaHTML(def.tema, `
    <div class="g-hud">
      <span class="g-pill">🏁 <span class="arc-puntos">0</span></span>
      <span class="g-pill">⭐ <span class="arc-mejor">${arcMejor(id)}</span></span>
      <span class="g-pill">🪙 <span class="js-monedas">${monedasCoin}</span></span>
    </div>
    <div class="arc-caja"><canvas class="arc-canvas"></canvas><div class="arc-overlay"></div></div>`, 'arc-escena');
  arc.canvas = cont.querySelector('canvas');
  arcPrepararCanvas();
  arcEntrada(arc.canvas);
  arcOverlay('menu');
  arcAjustar();
  arc.juego.dibujar(arc.ctx);
}

function arcPrepararCanvas(){
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = arc.canvas, j = arc.juego;
  c.width = j.ancho * dpr; c.height = j.alto * dpr;
  arc.ctx = c.getContext('2d');
  arc.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Ajusta el tamaño visible del canvas para que entre en la pantalla sin scroll.
function arcAjustar(){
  if(!arc.id || !arc.canvas) return;
  const vista = document.getElementById('view-' + arc.id);
  const caja = arc.canvas.parentElement;
  if(!vista || !caja || !vista.classList.contains('active')) return;
  const ratio = arc.juego.ancho / arc.juego.alto;
  caja.style.width = '100%';
  const top = caja.getBoundingClientRect().top - vista.getBoundingClientRect().top + vista.scrollTop;
  const libre = vista.clientHeight - top - 30;
  const escena = caja.parentElement, est = getComputedStyle(escena);
  const util = escena.clientWidth - parseFloat(est.paddingLeft) - parseFloat(est.paddingRight);
  const w = Math.max(170, Math.min(util, libre * ratio));
  caja.style.width = w + 'px';
}
window.addEventListener('resize', arcAjustar);

function arcOverlay(modo, datos){
  const ov = arc.canvas.parentElement.querySelector('.arc-overlay');
  if(modo === 'jugando'){ ov.innerHTML = ''; ov.style.display = 'none'; return; }
  ov.style.display = 'flex';
  const def = arc.def;
  if(modo === 'menu'){
    ov.innerHTML = `${gDialogoHTML(def.titulo, def.instrucciones)}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="arcJugar()">¡Jugar!</button></div>`;
  } else {
    ov.innerHTML = `<div class="arc-fin-icono">${def.emojiFin}</div>
      ${gDialogoHTML(def.textoFin, `Puntaje <b>${datos.puntaje}</b> · Mejor <b>${datos.mejor}</b>${datos.record ? ' 🎉 ¡Récord!' : ''}<br>${datos.monedas > 0 ? `+${datos.monedas} monedas` : (datos.topeDia ? 'Hoy ya juntaste el máximo de monedas en este juego' : 'Seguí practicando para ganar monedas')}`)}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="arcJugar()">Jugar de nuevo</button></div>`;
  }
}

function arcJugar(){
  if(!arc.id) return;
  cancelAnimationFrame(arc.raf);
  arc.juego = arc.def.crear();
  arc.juego.premio = arcPremioVivo;
  arc.enVivo = 0;
  arc.fase = 'jugando';
  arc.puntosMostrados = -1;
  document.getElementById('view-' + arc.id).classList.add('juego-inmersivo');
  const puntos = document.querySelector('#view-' + arc.id + ' .arc-puntos');
  if(puntos) puntos.textContent = '0';
  arcOverlay('jugando');
  arcPrepararCanvas();
  arcAjustar();
  arc.ultimo = 0;
  arc.raf = requestAnimationFrame(arcBucle);
}

function arcBucle(ts){
  if(arc.fase !== 'jugando') return;
  const vista = document.getElementById('view-' + arc.id);
  if(!vista || !vista.classList.contains('active')){ arc.fase = 'menu'; return; }
  const dt = arc.ultimo ? Math.min(0.05, (ts - arc.ultimo) / 1000) : 0.016;
  arc.ultimo = ts;
  arcPaso(dt);
  if(arc.fase === 'jugando') arc.raf = requestAnimationFrame(arcBucle);
}

// Un cuadro: actualiza, dibuja y revisa si terminó (también lo usan las pruebas).
function arcPaso(dt){
  const j = arc.juego;
  j.actualizar(dt);
  j.dibujar(arc.ctx);
  if(j.puntaje !== arc.puntosMostrados){
    arc.puntosMostrados = j.puntaje;
    const el = document.querySelector('#view-' + arc.id + ' .arc-puntos');
    if(el) el.textContent = j.puntaje;
  }
  if(j.terminado) arcTerminar();
}

function arcTerminar(){
  arc.fase = 'fin';
  cancelAnimationFrame(arc.raf);
  const id = arc.id, p = arc.juego.puntaje;
  const anterior = arcMejor(id);
  const record = p > anterior;
  if(record) arcGuardar('arcade-mejor-' + id, p);
  const queria = Math.min(ARC_TOPE_PARTIDA, arc.def.monedas(p));
  const dadas = arc.enVivo + arcOtorgarMonedas(id, Math.max(0, queria - arc.enVivo));
  document.getElementById('view-' + id).classList.remove('juego-inmersivo');
  const mejor = Math.max(p, anterior);
  const elMejor = document.querySelector('#view-' + id + ' .arc-mejor');
  if(elMejor) elMejor.textContent = mejor;
  const sub = document.getElementById('arc-' + id + '-sub');
  if(sub) sub.textContent = 'Mejor: ' + mejor;
  arcOverlay('fin', { puntaje: p, mejor, record, monedas: dadas, topeDia: queria > 0 && dadas === 0 });
  arcAjustar();
  if(typeof analyticsRegistrar === 'function') analyticsRegistrar('partida_arcade', { juego: id, puntaje: p });
}

// Entrada. Cada juego define solo lo que usa:
//  toque(x, y)        al apoyar el dedo (o al soltar, si toqueAlSoltar y no se movió)
//  deslizar(dir)      cada ~22 px de arrastre: 'izq' | 'der' | 'arr' | 'abj'
//  lanzar(dir)        un movimiento rápido y largo (flick) al soltar
//  arrastrar(x, y)    posición del dedo mientras está apoyado (coordenadas del juego)
//  soltar()           al levantar el dedo
//  tecla(k) / teclaSuelta(k)   teclado, para probar desde la compu
function arcEntrada(canvas){
  let origen = null, inicio = null;
  // Para juegos que usan varios dedos a la vez (flippers, joystick + botones):
  // punteros(lista) recibe todos los puntos apoyados, en coordenadas del juego.
  const punteros = new Map();
  const avisar = () => { const g = arc.juego; if(g && g.punteros) g.punteros(Array.from(punteros.values())); };
  const logico = e => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * arc.juego.ancho / r.width, (e.clientY - r.top) * arc.juego.alto / r.height];
  };
  canvas.addEventListener('pointerdown', e => {
    if(arc.fase !== 'jugando') return;
    e.preventDefault();
    origen = { x: e.clientX, y: e.clientY };
    inicio = { x: e.clientX, y: e.clientY, t: performance.now(), movido: false };
    const [x, y] = logico(e);
    const j = arc.juego;
    punteros.set(e.pointerId, [x, y]);
    try { canvas.setPointerCapture(e.pointerId); } catch(err){}
    avisar();
    if(j.arrastrar) j.arrastrar(x, y);
    if(j.toque && !j.toqueAlSoltar) j.toque(x, y);
  });
  canvas.addEventListener('pointermove', e => {
    if(punteros.has(e.pointerId) && arc.fase === 'jugando'){ punteros.set(e.pointerId, logico(e)); avisar(); }
    if(!origen || arc.fase !== 'jugando') return;
    const j = arc.juego;
    if(j.arrastrar){ const [x, y] = logico(e); j.arrastrar(x, y); }
    if(Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 12) inicio.movido = true;
    if(!j.deslizar) return;
    const dx = e.clientX - origen.x, dy = e.clientY - origen.y;
    if(Math.hypot(dx, dy) < 22) return;
    j.deslizar(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'izq' : 'der') : (dy < 0 ? 'arr' : 'abj'));
    origen = { x: e.clientX, y: e.clientY };
  });
  const soltar = e => {
    if(origen && inicio && arc.fase === 'jugando'){
      const j = arc.juego;
      if(j.toqueAlSoltar && j.toque && !inicio.movido && e.type === 'pointerup'){ const [x, y] = logico(e); j.toque(x, y); }
      const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
      if(j.lanzar && e.type === 'pointerup' && performance.now() - inicio.t < 260 && Math.hypot(dx, dy) > 55){
        j.lanzar(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'izq' : 'der') : (dy < 0 ? 'arr' : 'abj'));
      }
    }
    if(e.type !== 'pointerleave'){ punteros.delete(e.pointerId); avisar(); }
    if(arc.juego && arc.juego.soltar) arc.juego.soltar();
    origen = null; inicio = null;
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  canvas.addEventListener('pointerleave', soltar);
}

document.addEventListener('keydown', e => {
  if(arc.fase !== 'jugando' || !arc.juego.tecla) return;
  if(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  if(!e.repeat) arc.juego.tecla(e.key);
});
document.addEventListener('keyup', e => {
  if(arc.fase === 'jugando' && arc.juego.teclaSuelta) arc.juego.teclaSuelta(e.key);
});
