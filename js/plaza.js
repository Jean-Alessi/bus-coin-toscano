// Plaza Busmac: un mundo visto desde arriba donde se ven caminar los
// pasajeros del mismo viaje. Tocás un lugar y tu personaje camina hasta ahí;
// los edificios son las puertas a los juegos, el ranking, la boutique y los
// comercios.
//
// Para cuidar la conexión y que no se amontone la gente, la plaza se divide en
// salas de hasta 12 personas. No hay chat libre: solo frases ya armadas.
// Cada celular escribe su posición en Firebase (salas/{viaje}/plaza/{sala}/
// {asiento}) unas 3 veces por segundo mientras camina, y la borra al salir.

const PLZ = { W: 640, H: 700, VW: 300, VH: 440, SALA_MAX: 12, VEL: 96, VIVO_MS: 25000 };
const PLZ_FRASES = ['¡Hola! 👋', '¿Jugamos?', '¡Buen viaje! 🚌', '¡Vamos!', 'Buena jugada 👏', '😂', '¡Qué calor!', 'Gracias 🙌'];

// Edificios: puertas a otras pantallas. 'lado' dice hacia dónde mira la puerta.
const PLZ_EDIFICIOS = [
  { id: 'arcade', nombre: 'Arcade', sub: 'Video juegos', emoji: '🎮', x: 24, y: 24, w: 188, h: 120, color: '#E5586E', lado: 'abajo', ir: () => { if(typeof juegosAbiertos !== 'undefined') juegosAbiertos.video = true; showView('juegos'); } },
  { id: 'cartas', nombre: 'Salón de cartas', sub: 'Truco, Chinchón y más', emoji: '🃏', x: 226, y: 24, w: 188, h: 120, color: '#3B9B5A', lado: 'abajo', ir: () => { if(typeof juegosAbiertos !== 'undefined') juegosAbiertos.grupoCartas = true; showView('juegos'); } },
  { id: 'boutique', nombre: 'Boutique', sub: 'Vestí a tu personaje', emoji: '👕', x: 428, y: 24, w: 188, h: 120, color: '#7E57FF', lado: 'abajo', ir: () => showView('avatar') },
  { id: 'ranking', nombre: 'Ranking', sub: 'Mirá cómo vas', emoji: '🏆', x: 24, y: 556, w: 188, h: 120, color: '#E6A817', lado: 'arriba', ir: () => showView('ranking') },
  { id: 'comercios', nombre: 'Comercios', sub: 'Descuentos del destino', emoji: '🏪', x: 226, y: 556, w: 188, h: 120, color: '#2FB5B5', lado: 'arriba', ir: () => showView('comercios') },
  { id: 'premios', nombre: 'Premios', sub: 'Lo que podés ganar', emoji: '🎁', x: 428, y: 556, w: 188, h: 120, color: '#FF7A1A', lado: 'arriba', ir: () => showView('tienda') },
];
const PLZ_FUENTE = { x: 320, y: 350, r: 44 };
const plazaNombre = () => 'Plaza ' + marcaCorta();

let plz = {
  activo: false, sala: 1, yo: { x: 320, y: 440, dir: 1 }, obj: null, otros: {}, cam: { x: 0, y: 0 }, t: 0, ultimoEnvio: 0, ultimoLatido: 0,
  offset: 0, listener: null, ref: null, raf: 0, ultimo: 0, burbuja: null, menuAbierto: false, puerta: null, canvas: null, ctx: null, conectado: false,
};

function plazaAhora(){ return Date.now() + (plz.offset || 0); }
function plazaRefSala(){ return db.ref(`salas/${codigoViaje}/plaza/${plz.sala}`); }

function plazaZonaPuerta(e){
  return e.lado === 'abajo'
    ? { x: e.x + e.w / 2 - 36, y: e.y + e.h, w: 72, h: 40 }
    : { x: e.x + e.w / 2 - 36, y: e.y - 40, w: 72, h: 40 };
}

// ---- Entrada y salida ----

function iniciarPlaza(){
  plazaAlSalir(true);
  const titulo = document.querySelector('#view-plaza h1');
  if(titulo) titulo.textContent = plazaNombre();
  plz.activo = true;
  plz.otros = {}; plz.obj = null; plz.puerta = null; plz.menuAbierto = false; plz.burbuja = null;
  plz.yo = { x: 320, y: 450 + Math.floor(Math.random() * 40), dir: 1 };
  plz.t = 0; plz.conectado = false;
  plazaRender();
  const online = typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre;
  if(online) plazaConectar();
  plz.ultimo = 0;
  plz.raf = requestAnimationFrame(plazaBucle);
}

async function plazaConectar(){
  try {
    db.ref('.info/serverTimeOffset').once('value').then(s => { plz.offset = s.val() || 0; });
    const snap = await db.ref(`salas/${codigoViaje}/plaza`).once('value');
    const salas = snap.val() || {};
    const ahora = plazaAhora();
    let elegida = 1;
    for(let i = 1; i <= 30; i++){
      const s = salas[i] || {};
      const mia = s[miAsiento];
      if(mia && ahora - (mia.t || 0) < PLZ.VIVO_MS){ elegida = i; break; }
      const vivos = Object.keys(s).filter(a => a !== String(miAsiento) && ahora - (s[a].t || 0) < PLZ.VIVO_MS);
      if(vivos.length < PLZ.SALA_MAX){ elegida = i; break; }
    }
    if(!plz.activo) return;
    plz.sala = elegida;
    plz.ref = plazaRefSala();
    const miRef = plz.ref.child(String(miAsiento));
    miRef.onDisconnect().remove();
    plz.conectado = true;
    plazaEnviar(true);
    plz.listener = plz.ref.on('value', s => plazaRecibir(s.val() || {}));
  } catch(e){ plz.conectado = false; }
}

function plazaAlSalir(silencioso){
  cancelAnimationFrame(plz.raf);
  if(plz.ref){
    try {
      if(plz.listener) plz.ref.off('value', plz.listener);
      if(typeof miAsiento !== 'undefined' && miAsiento) plz.ref.child(String(miAsiento)).remove();
    } catch(e){}
  }
  plz.ref = null; plz.listener = null; plz.activo = false; plz.conectado = false;
  if(!silencioso) plz.otros = {};
}

function plazaCompacto(){
  if(typeof avatarPuestoActual !== 'function') return {};
  const p = avatarPuestoActual(), c = {};
  Object.keys(p).forEach(k => { if(p[k] != null) c[k] = p[k]; });
  return c;
}

function plazaEnviar(completo){
  if(!plz.ref || !plz.conectado) return;
  const datos = { x: Math.round(plz.yo.x), y: Math.round(plz.yo.y), t: firebase.database.ServerValue.TIMESTAMP };
  if(completo){ datos.n = String(miNombre).slice(0, 14); datos.a = plazaCompacto(); }
  plz.ref.child(String(miAsiento)).update(datos);
  plz.ultimoEnvio = performance.now();
}

function plazaRecibir(datos){
  const ahora = plazaAhora();
  const nuevos = {};
  Object.keys(datos).forEach(a => {
    if(a === String(miAsiento)) return;
    const d = datos[a];
    if(!d || typeof d.x !== 'number' || ahora - (d.t || 0) > PLZ.VIVO_MS) return;
    const previo = plz.otros[a];
    nuevos[a] = {
      nombre: String(d.n || 'Pasajero'), avatar: d.a || {},
      tx: Math.max(0, Math.min(PLZ.W, d.x)), ty: Math.max(0, Math.min(PLZ.H, d.y)),
      x: previo ? previo.x : d.x, y: previo ? previo.y : d.y, dir: previo ? previo.dir : 1,
      m: typeof d.m === 'number' ? d.m : null, mt: d.mt || 0,
    };
  });
  plz.otros = nuevos;
  const el = document.getElementById('plaza-cantidad');
  if(el) el.textContent = (Object.keys(nuevos).length + 1) + ' en la plaza';
}

function plazaDecir(i){
  if(i < 0 || i >= PLZ_FRASES.length) return;
  plz.burbuja = { texto: PLZ_FRASES[i], hasta: performance.now() + 4500 };
  plz.menuAbierto = false;
  if(plz.ref && plz.conectado) plz.ref.child(String(miAsiento)).update({ m: i, mt: firebase.database.ServerValue.TIMESTAMP, t: firebase.database.ServerValue.TIMESTAMP });
  plazaRenderMenu();
  reproducirTono('tick');
}

function plazaToggleMenu(){ plz.menuAbierto = !plz.menuAbierto; plazaRenderMenu(); }

// ---- Pantalla ----

function plazaRender(){
  const cont = document.getElementById('plaza-content');
  if(!cont) return;
  document.getElementById('view-plaza').classList.add('juego-inmersivo');
  cont.innerHTML = gEscenaHTML('cielo', `
    <div class="g-hud"><span class="g-pill" id="plaza-cantidad">1 en la plaza</span><span class="g-pill">${plazaNombre()}</span></div>
    <div class="plz-caja"><canvas class="plz-canvas"></canvas></div>
    <div id="plaza-accion" class="plz-accion"></div>
    <div id="plaza-menu"></div>
    <div class="g-acciones plz-botones"><button class="gbtn gbtn-chico-texto" onclick="plazaToggleMenu()">💬 Decir algo</button><button class="gbtn gbtn-chico-texto" onclick="showView('avatar')">👕 Mi personaje</button></div>`, 'plz-escena');
  plz.canvas = cont.querySelector('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  plz.canvas.width = PLZ.VW * dpr; plz.canvas.height = PLZ.VH * dpr;
  plz.ctx = plz.canvas.getContext('2d');
  plz.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  plazaEntrada();
  plazaAjustar();
  plazaRenderMenu();
  plazaRenderAccion();
}

function plazaAjustar(){
  const vista = document.getElementById('view-plaza');
  if(!plz.canvas || !vista || !vista.classList.contains('active')) return;
  const caja = plz.canvas.parentElement;
  caja.style.width = '100%';
  const top = caja.getBoundingClientRect().top - vista.getBoundingClientRect().top + vista.scrollTop;
  const libre = vista.clientHeight - top - 150;
  const escena = caja.parentElement, est = getComputedStyle(escena);
  const util = escena.clientWidth - parseFloat(est.paddingLeft) - parseFloat(est.paddingRight);
  const w = Math.max(170, Math.min(util, libre * PLZ.VW / PLZ.VH));
  caja.style.width = w + 'px';
}
window.addEventListener('resize', plazaAjustar);

function plazaRenderMenu(){
  const el = document.getElementById('plaza-menu');
  if(!el) return;
  el.innerHTML = plz.menuAbierto ? `<div class="plz-menu">${PLZ_FRASES.map((f, i) => `<button class="plz-frase" onclick="plazaDecir(${i})">${f}</button>`).join('')}</div>` : '';
}

function plazaRenderAccion(){
  const el = document.getElementById('plaza-accion');
  if(!el) return;
  const e = plz.puerta;
  el.innerHTML = e
    ? `<button class="gbtn gbtn-ancho" onclick="plazaEntrar('${e.id}')">${e.emoji} Entrar: ${e.nombre}</button><div class="plz-accion-sub">${e.sub}</div>`
    : '<div class="plz-accion-sub">Tocá un lugar para caminar. Acercate a una puerta para entrar.</div>';
}

function plazaEntrar(id){
  const e = PLZ_EDIFICIOS.find(x => x.id === id);
  if(e) e.ir();
}

// ---- Entrada táctil: tocar o arrastrar = caminar hacia ahí ----

function plazaEntrada(){
  const c = plz.canvas;
  let apretado = false;
  const aMundo = ev => {
    const r = c.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * PLZ.VW / r.width + plz.cam.x, y: (ev.clientY - r.top) * PLZ.VH / r.height + plz.cam.y };
  };
  c.addEventListener('pointerdown', ev => { ev.preventDefault(); apretado = true; try { c.setPointerCapture(ev.pointerId); } catch(e){} plz.obj = aMundo(ev); });
  c.addEventListener('pointermove', ev => { if(apretado) plz.obj = aMundo(ev); });
  const soltar = () => { apretado = false; };
  c.addEventListener('pointerup', soltar);
  c.addEventListener('pointercancel', soltar);
}

const plazaTeclas = {};
document.addEventListener('keydown', e => { if(plz.activo && e.key.startsWith('Arrow')){ plazaTeclas[e.key] = true; e.preventDefault(); } });
document.addEventListener('keyup', e => { delete plazaTeclas[e.key]; });

// ---- Movimiento ----

function plazaChoca(x, y){
  if(x < 14 || x > PLZ.W - 14 || y < 22 || y > PLZ.H - 8) return true;
  if(Math.hypot(x - PLZ_FUENTE.x, y - (PLZ_FUENTE.y + 4)) < PLZ_FUENTE.r - 4) return true;
  for(const e of PLZ_EDIFICIOS){
    if(x > e.x - 6 && x < e.x + e.w + 6 && y > e.y + 24 && y < e.y + e.h) return true;
  }
  return false;
}

function plazaMover(dt){
  const yo = plz.yo;
  let vx = 0, vy = 0;
  if(plazaTeclas.ArrowLeft) vx -= 1; if(plazaTeclas.ArrowRight) vx += 1;
  if(plazaTeclas.ArrowUp) vy -= 1; if(plazaTeclas.ArrowDown) vy += 1;
  if(vx || vy){ plz.obj = null; }
  else if(plz.obj){
    const dx = plz.obj.x - yo.x, dy = plz.obj.y - yo.y, d = Math.hypot(dx, dy);
    if(d < 5){ plz.obj = null; } else { vx = dx / d; vy = dy / d; }
  }
  plz.caminando = !!(vx || vy);
  if(!plz.caminando) return;
  const n = Math.hypot(vx, vy) || 1;
  const px = yo.x + vx / n * PLZ.VEL * dt, py = yo.y + vy / n * PLZ.VEL * dt;
  let movio = false;
  if(!plazaChoca(px, yo.y)){ yo.x = px; movio = true; }
  if(!plazaChoca(yo.x, py)){ yo.y = py; movio = true; }
  if(!movio) plz.obj = null;
  if(vx) yo.dir = vx > 0 ? 1 : -1;
}

function plazaPuertaCercana(){
  const yo = plz.yo;
  for(const e of PLZ_EDIFICIOS){
    const z = plazaZonaPuerta(e);
    if(yo.x > z.x && yo.x < z.x + z.w && yo.y > z.y && yo.y < z.y + z.h) return e;
  }
  return null;
}

// ---- Bucle ----

function plazaBucle(ts){
  if(!plz.activo) return;
  const vista = document.getElementById('view-plaza');
  if(!vista || !vista.classList.contains('active')){ plazaAlSalir(); return; }
  const dt = plz.ultimo ? Math.min(0.05, (ts - plz.ultimo) / 1000) : 0.016;
  plz.ultimo = ts;
  plazaPaso(dt);
  plz.raf = requestAnimationFrame(plazaBucle);
}

function plazaPaso(dt){
  plz.t += dt;
  plazaMover(dt);
  const ahora = performance.now();
  if(plz.conectado){
    if(plz.caminando && ahora - plz.ultimoEnvio > 330) plazaEnviar(false);
    else if(ahora - plz.ultimoEnvio > 9000) plazaEnviar(true);
  }
  // Los demás se acercan suavemente a donde dicen estar.
  const k = 1 - Math.exp(-7 * dt);
  Object.keys(plz.otros).forEach(a => {
    const o = plz.otros[a], antes = o.x;
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;
    if(Math.abs(o.x - antes) > 0.05) o.dir = o.x > antes ? 1 : -1;
  });
  // Cámara
  plz.cam.x = Math.max(0, Math.min(PLZ.W - PLZ.VW, plz.yo.x - PLZ.VW / 2));
  plz.cam.y = Math.max(0, Math.min(PLZ.H - PLZ.VH, plz.yo.y - PLZ.VH / 2 - 20));
  const puerta = plazaPuertaCercana();
  if((puerta && puerta.id) !== (plz.puerta && plz.puerta.id)){ plz.puerta = puerta; plazaRenderAccion(); }
  if(plz.ctx) plazaDibujar(plz.ctx);
}

// ---- Dibujo ----

function plazaDibujarFondo(ctx){
  ctx.fillStyle = '#7FC77A'; ctx.fillRect(0, 0, PLZ.W, PLZ.H);
  // Plaza de baldosas
  ctx.fillStyle = '#E7DCC5'; arcRR(ctx, 10, 10, PLZ.W - 20, PLZ.H - 20, 22); ctx.fill();
  for(let y = 0; y < PLZ.H; y += 40){
    for(let x = 0; x < PLZ.W; x += 40){
      if(((x + y) / 40) % 2 === 0){ ctx.fillStyle = 'rgba(160,130,90,.10)'; ctx.fillRect(x, y, 40, 40); }
    }
  }
  // Caminos principales
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.fillRect(PLZ.W / 2 - 34, 150, 68, PLZ.H - 310);
  ctx.fillRect(40, PLZ.H / 2 - 22, PLZ.W - 80, 44);
}

function plazaDibujarFuente(ctx){
  const f = PLZ_FUENTE;
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 10, f.r + 4, f.r * .62, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#B8C2D1'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * .72, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6AC2FF'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, f.r - 7, f.r * .72 - 7, 0, 0, 7); ctx.fill();
  const ondas = 0.5 + 0.5 * Math.sin(plz.t * 2.4);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, 14 + ondas * 14, 8 + ondas * 8, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = '#C7CEDA'; arcRR(ctx, f.x - 9, f.y - 26, 18, 30, 6); ctx.fill();
  arcLogo(ctx, f.x, f.y - 38, 30, '#fff');
}

function plazaDibujarEdificio(ctx, e){
  const abajo = e.lado === 'abajo'; // la puerta mira hacia abajo y el cartel va arriba (o al revés)
  const bandaY = abajo ? e.y : e.y + e.h - 26;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; arcRR(ctx, e.x + 4, e.y + 8, e.w, e.h, 12); ctx.fill();
  ctx.fillStyle = e.color; arcRR(ctx, e.x, e.y, e.w, e.h, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; arcRR(ctx, e.x, bandaY, e.w, 26, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 14px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e.nombre, e.x + e.w / 2, bandaY + 13.5);
  const centroY = abajo ? e.y + e.h / 2 + 8 : e.y + e.h / 2 - 6;
  arcEmoji(ctx, e.emoji, e.x + e.w / 2, centroY, 34);
  [e.x + 24, e.x + e.w - 24].forEach(vx => { ctx.fillStyle = 'rgba(255,255,255,.55)'; arcRR(ctx, vx - 14, abajo ? e.y + 40 : e.y + 44, 28, 26, 5); ctx.fill(); });
  // Puerta y baldosa de entrada
  const z = plazaZonaPuerta(e);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; arcRR(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
  const px = e.x + e.w / 2 - 15, py = abajo ? e.y + e.h - 36 : e.y;
  ctx.fillStyle = '#5A3A22'; arcRR(ctx, px, py, 30, 36, 6); ctx.fill();
  ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(px + 24, py + 20, 2.4, 0, 7); ctx.fill();
}

function plazaDibujarPersonaje(ctx, x, y, puesto, nombre, dir, caminando, burbuja){
  const bob = caminando ? Math.abs(Math.sin(plz.t * 11)) * 3 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, y, 13, 5, 0, 0, 7); ctx.fill();
  const img = (typeof avatarSprite === 'function') ? avatarSprite(puesto) : null;
  const w = 46, h = 55;
  if(img && img.complete && img.naturalWidth){
    ctx.save();
    ctx.translate(x, y - bob);
    if(dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h + 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = '#F5C29B'; ctx.beginPath(); ctx.arc(x, y - 30 - bob, 14, 0, 7); ctx.fill();
  }
  // Nombre
  ctx.font = '700 10px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(nombre).width + 10;
  ctx.fillStyle = 'rgba(15,42,77,.72)'; arcRR(ctx, x - tw / 2, y + 7, tw, 15, 7.5); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(nombre, x, y + 14.5);
  if(burbuja){
    ctx.font = '700 11px Poppins, sans-serif';
    const bw = ctx.measureText(burbuja).width + 16;
    const by = y - h - 24 - bob;
    ctx.fillStyle = '#fff'; arcRR(ctx, x - bw / 2, by, bw, 22, 11); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 5, by + 21); ctx.lineTo(x, by + 28); ctx.lineTo(x + 5, by + 21); ctx.fill();
    ctx.fillStyle = '#0F2A4D'; ctx.fillText(burbuja, x, by + 11.5);
  }
}

function plazaDibujar(ctx){
  ctx.save();
  ctx.fillStyle = '#7FC77A'; ctx.fillRect(0, 0, PLZ.VW, PLZ.VH);
  ctx.translate(-Math.round(plz.cam.x), -Math.round(plz.cam.y));
  plazaDibujarFondo(ctx);
  // Adornos en los bordes
  [[26, 200], [614, 200], [26, 330], [614, 330], [26, 460], [614, 460], [100, 350], [540, 350]].forEach(([x, y], i) => arcEmoji(ctx, i % 3 === 0 ? '🌳' : i % 3 === 1 ? '🌷' : '🌲', x, y, 28));
  plazaDibujarFuente(ctx);
  PLZ_EDIFICIOS.forEach(e => plazaDibujarEdificio(ctx, e));

  const ahoraMs = performance.now(), ahoraServidor = plazaAhora();
  const personajes = Object.keys(plz.otros).map(a => ({ y: plz.otros[a].y, o: plz.otros[a] }));
  personajes.push({ y: plz.yo.y, yo: true });
  personajes.sort((a, b) => a.y - b.y).forEach(p => {
    if(p.yo){
      const burbuja = plz.burbuja && ahoraMs < plz.burbuja.hasta ? plz.burbuja.texto : null;
      plazaDibujarPersonaje(ctx, plz.yo.x, plz.yo.y, plazaCompacto(), 'Vos', plz.yo.dir, plz.caminando, burbuja);
    } else {
      const o = p.o;
      const dice = o.m != null && ahoraServidor - o.mt < 4500 ? PLZ_FRASES[o.m] : null;
      const caminando = Math.hypot(o.tx - o.x, o.ty - o.y) > 3;
      plazaDibujarPersonaje(ctx, o.x, o.y, o.avatar, o.nombre.slice(0, 10), o.dir, caminando, dice);
    }
  });

  // Marca del destino
  if(plz.obj){
    ctx.strokeStyle = 'rgba(15,42,77,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(plz.obj.x, plz.obj.y, 6 + Math.sin(plz.t * 8) * 1.5, 0, 7); ctx.stroke();
  }
  ctx.restore();
}

// Tarjeta de Inicio: lleva a la plaza.
function plazaTarjetaHomeHTML(){
  return `<div class="av-home plz-home" onclick="showView('plaza')"><div class="plz-home-img">🏘️</div><div class="av-home-txt"><h3>${plazaNombre()}</h3><p>Encontrate con los del viaje y entrá a los juegos</p></div><span class="av-home-flecha">›</span></div>`;
}
