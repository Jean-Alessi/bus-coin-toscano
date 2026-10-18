// Confitería bailable: se entra desde la Plaza y es un lugar aparte (otro mapa con sus propias
// salas de hasta 12 personas: cuando una se llena, se abre la siguiente). Tiene pista de baile con
// luces que laten al ritmo, bola de espejos, cabina del DJ (cambia el estilo para toda la sala) y
// una barra SIN alcohol (jugos, limonada, gaseosa...).
// La música se genera en el celular con Web Audio (no hay archivos): cumbia, pop, electrónica y lento.
// Datos: salas/{viaje}/boliche/dj → { estilo, n (quién), t }; ajustes/boliche ('off' lo apaga);
// feriaConfig/barra (lista de bebidas).

const BOLICHE_ESTILOS = {
  cumbia: { nombre: 'Cumbia', emoji: '🪘', bpm: 98, kick: [0, 8], snare: [4, 12], hat: [2, 6, 10, 14],
    bajo: [110, 0, 110, 131, 0, 110, 0, 147, 110, 0, 110, 131, 0, 98, 0, 110], lead: [0, 0, 330, 0, 392, 0, 330, 0, 0, 0, 294, 0, 330, 0, 262, 0] },
  pop: { nombre: 'Pop', emoji: '🎤', bpm: 116, kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14],
    bajo: [98, 0, 98, 0, 110, 0, 110, 0, 131, 0, 131, 0, 110, 0, 98, 0], lead: [392, 0, 0, 440, 0, 392, 0, 0, 523, 0, 0, 494, 0, 440, 0, 0] },
  electro: { nombre: 'Electrónica', emoji: '🎧', bpm: 128, kick: [0, 4, 8, 12], snare: [12], hat: [2, 6, 10, 14, 15],
    bajo: [0, 82, 0, 82, 0, 82, 0, 98, 0, 82, 0, 82, 0, 110, 0, 98], lead: [523, 0, 659, 0, 784, 0, 659, 0, 523, 0, 659, 0, 880, 0, 784, 0] },
  lento: { nombre: 'Lento', emoji: '💞', bpm: 72, kick: [0, 10], snare: [8], hat: [0, 4, 8, 12],
    bajo: [87, 0, 0, 0, 87, 0, 0, 0, 98, 0, 0, 0, 82, 0, 0, 0], lead: [349, 0, 0, 0, 0, 0, 440, 0, 392, 0, 0, 0, 0, 0, 330, 0] },
};
const BOLICHE_BEBIDAS = ['Jugo de naranja', 'Limonada', 'Gaseosa', 'Agua con gas', 'Café', 'Licuado de frutilla'];
const BOLICHE_ESPERA_DJ_MS = 15000;
const BOLICHE_MAX_BEBIDAS = 3;       // cuántas bebidas se pueden tener en la mano
const BOLICHE_BEBIDA_MS = 180000;    // y cuánto dura cada una
const BOLICHE_BARMAN = ['¡Salud! 🥂', 'Buena elección 😉', 'Marchando, bien fría ❄️', 'Invita la casa (es de mentirita 😄)', '¡Ahí va!'];

const bol = { bebidas: [], brindis: 0, ctx: null, master: null, ruido: null, timer: null, paso: 0, proximo: 0, t0: 0, estilo: 'cumbia', quien: '', on: true, ref: null, oyente: null, panel: null, ultimoDj: 0 };

const bolEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bolEnLinea = () => !!(typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre);

// ---- Entrar y salir ----

function bolicheIniciar(){
  bolicheAlSalir();
  bol.panel = null;
  if(bolEnLinea()){
    bol.ref = db.ref('salas/' + codigoViaje + '/boliche/dj');
    bol.oyente = bol.ref.on('value', s => {
      const v = s.val(), antes = bol.estilo;
      if(v && BOLICHE_ESTILOS[v.estilo]){
        bol.estilo = v.estilo; bol.quien = v.n || '';
        if(antes !== bol.estilo && bol.timer && typeof mostrarToast === 'function') mostrarToast('🎧 ' + (v.n || 'El DJ') + ' puso ' + BOLICHE_ESTILOS[v.estilo].nombre);
      }
      bolicheRender();
    });
  }
  bolicheMusicaIniciar();
}

function bolicheAlSalir(){
  if(bol.ref && bol.oyente){ try { bol.ref.off('value', bol.oyente); } catch(e){} }
  bol.ref = null; bol.oyente = null; bol.panel = null;
  bolicheMusicaParar();
  const c = document.getElementById('plaza-boliche'); if(c) c.innerHTML = '';
}

// Desde la plaza: la puerta del boliche. Al salir, aparecés frente a la puerta.
function bolicheEntrar(){ plazaIrASector('boliche'); }
function bolicheSalir(){
  const e = (PLZ_SECTORES.plaza.armar().edificios || []).find(x => x.id === 'boliche');
  const z = e ? plazaZonaPuerta(e) : { x: 530, y: 680, w: 72, h: 40 };
  plazaCambiarSector('plaza', { x: z.x + z.w / 2, y: z.y + z.h / 2 + 6 });
}

// ---- Música (Web Audio, sin archivos) ----

function bolicheEstilo(){ return BOLICHE_ESTILOS[bol.estilo] || BOLICHE_ESTILOS.cumbia; }

function bolicheContexto(){
  if(bol.ctx) return bol.ctx;
  try {
    bol.ctx = new (window.AudioContext || window.webkitAudioContext)();
    bol.master = bol.ctx.createGain(); bol.master.gain.value = 0.55; bol.master.connect(bol.ctx.destination);
    const n = bol.ctx.sampleRate * 0.5, b = bol.ctx.createBuffer(1, n, bol.ctx.sampleRate), d = b.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    bol.ruido = b;
  } catch(e){ bol.ctx = null; }
  return bol.ctx;
}

function bolicheMusicaIniciar(){
  if(bol.timer) return;
  if(typeof sonidoActivado !== 'undefined' && !sonidoActivado) return;
  if(!bol.on) return;
  const c = bolicheContexto();
  if(!c) return;
  try { if(c.state === 'suspended') c.resume(); } catch(e){}
  bol.paso = 0; bol.t0 = bol.proximo = c.currentTime + 0.08;
  bol.timer = setInterval(bolicheTick, 25);
}

function bolicheMusicaParar(){
  if(bol.timer){ clearInterval(bol.timer); bol.timer = null; }
  if(bol.ctx){ try { bol.ctx.close(); } catch(e){} bol.ctx = null; bol.master = null; bol.ruido = null; }
}

function bolicheTick(){
  const c = bol.ctx;
  if(!c) return;
  const est = bolicheEstilo(), dur = 60 / est.bpm / 4;
  while(bol.proximo < c.currentTime + 0.14){
    bolicheNota(est, bol.paso, bol.proximo);
    bol.proximo += dur; bol.paso = (bol.paso + 1) % 16;
  }
}

function bolicheNota(est, paso, t){
  if(est.kick.includes(paso)) bolicheBombo(t);
  if(est.snare.includes(paso)) bolicheRuido(t, 1800, 0.22, 0.13);
  if(est.hat.includes(paso)) bolicheRuido(t, 7000, 0.10, 0.04);
  if(est.bajo[paso]) bolicheTono(t, est.bajo[paso], 'triangle', 0.30, 0.24);
  if(est.lead[paso]) bolicheTono(t, est.lead[paso], 'square', 0.05, 0.16);
}

function bolicheBombo(t){
  const c = bol.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g); g.connect(bol.master); o.start(t); o.stop(t + 0.2);
}
function bolicheRuido(t, corte, vol, dur){
  const c = bol.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = bol.ruido; f.type = 'highpass'; f.frequency.value = corte;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(bol.master); s.start(t); s.stop(t + dur + 0.02);
}
function bolicheTono(t, freq, onda, vol, dur){
  const c = bol.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = onda; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(bol.master); o.start(t); o.stop(t + dur + 0.02);
}

// Pulso para las luces: cuántos tiempos pasaron (decimal). Funciona aunque no haya sonido.
function bolicheTiempos(){
  const bpm = bolicheEstilo().bpm;
  if(bol.ctx && bol.timer) return (bol.ctx.currentTime - bol.t0) * bpm / 60;
  return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 * bpm / 60;
}

// ---- Paneles: DJ y barra ----

function bolicheAbrirDj(){ bol.panel = 'dj'; bolicheRender(); }
function bolicheAbrirBarra(){ bol.panel = 'barra'; bolicheRender(); }
function bolicheCerrar(){ bol.panel = null; bolicheRender(); }

function bolicheElegirEstilo(id){
  if(!BOLICHE_ESTILOS[id]) return;
  const ahora = Date.now();
  if(ahora - bol.ultimoDj < BOLICHE_ESPERA_DJ_MS){ if(typeof mostrarToast === 'function') mostrarToast('Dejá sonar un ratito esta canción 🎶'); return; }
  bol.ultimoDj = ahora;
  bol.estilo = id; bol.quien = String(miNombre || '').slice(0, 14);
  if(bolEnLinea()) db.ref('salas/' + codigoViaje + '/boliche/dj').set({ estilo: id, n: bol.quien, t: firebase.database.ServerValue.TIMESTAMP });
  bolicheMusicaIniciar();
  bolicheRender();
}

function bolicheAlternarMusica(){
  bol.on = !bol.on;
  if(bol.on) bolicheMusicaIniciar(); else bolicheMusicaParar();
  bolicheRender();
}

function bolicheBebidas(){
  const l = typeof feria !== 'undefined' && feria.config ? feriaListaDe(feria.config.barra).map(String).filter(Boolean) : [];
  return l.length ? l : BOLICHE_BEBIDAS;
}
function bolicheEmojiBebida(n){
  const t = String(n).toLowerCase();
  if(/caf[eé]|t[eé]\b/.test(t)) return '☕';
  if(/limon|naranja|jugo|licuado/.test(t)) return /limon/.test(t) ? '🍋' : '🧃';
  if(/agua/.test(t)) return '💧';
  if(/mate/.test(t)) return '🧉';
  return '🥤';
}
// Las bebidas que tengo en la mano (se vencen solas; todo es de mentirita).
function bolicheMisBebidas(){
  const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
  bol.bebidas = bol.bebidas.filter(b => ahora < b.hasta);
  return bol.bebidas;
}
// Emojis de mis bebidas, juntos, para mostrarlas sobre el personaje (null si no tengo).
function bolicheBebidasEmoji(){
  const l = bolicheMisBebidas();
  return l.length ? l.map(b => b.e).join('') : null;
}

function bolichePedirBebida(i){
  const n = bolicheBebidas()[i];
  if(n == null) return;
  if(bolicheMisBebidas().length >= BOLICHE_MAX_BEBIDAS){ if(typeof mostrarToast === 'function') mostrarToast('Ya tenés ' + BOLICHE_MAX_BEBIDAS + ' en la mano: dejá una en la barra 🍹'); return; }
  const ahora = typeof performance !== 'undefined' ? performance.now() : Date.now();
  bol.bebidas.push({ n: String(n), e: bolicheEmojiBebida(n), hasta: ahora + BOLICHE_BEBIDA_MS });
  if(typeof plz !== 'undefined') plz.ultimaActividad = ahora;
  if(typeof plazaEnviar === 'function') plazaEnviar(false);
  if(typeof mostrarToast === 'function') mostrarToast('🧑‍🍳 ' + BOLICHE_BARMAN[Math.floor(Math.random() * BOLICHE_BARMAN.length)]);
  if(typeof reproducirMelodia === 'function') reproducirMelodia([880, 1319], 90, 'sine');
  bolicheRender();
}
function bolicheDejarBebida(i){
  const l = bolicheMisBebidas();
  if(i < 0 || i >= l.length) return;
  l.splice(i, 1);
  if(typeof plazaEnviar === 'function') plazaEnviar(false);
  bolicheRender();
}

// Brindis: los de la sala ven chispas sobre tu personaje y los que están cerca reciben un aviso.
function bolicheBrindar(){
  if(!bolicheMisBebidas().length){ if(typeof mostrarToast === 'function') mostrarToast('Pedí una bebida para brindar 🥂'); return; }
  plz.brindisT = true;
  bol.brindis = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 2200;
  if(typeof plazaEnviar === 'function') plazaEnviar(false);
  if(typeof reproducirMelodia === 'function') reproducirMelodia([1319, 1568, 2093], 70, 'triangle');
  bolicheCerrar();
}

function bolicheRender(){
  const cont = document.getElementById('plaza-boliche');
  if(!cont) return;
  if(!bol.panel){ cont.innerHTML = ''; return; }
  const cerrar = '<button class="gbtn gbtn-ancho gbtn-no" onclick="bolicheCerrar()">Cerrar</button>';
  let cuerpo = '';
  if(bol.panel === 'dj'){
    const est = bolicheEstilo();
    cuerpo = `<h3 class="fer-titulo">🎧 Cabina del DJ</h3>
      <p class="fer-texto">Suena: <b>${est.emoji} ${bolEsc(est.nombre)}</b>${bol.quien ? ' · puesta por ' + bolEsc(bol.quien) : ''}</p>
      <div class="fer-items">${Object.keys(BOLICHE_ESTILOS).map(id => `<button class="fer-item fer-item-txt${bol.estilo === id ? ' bol-actual' : ''}" onclick="bolicheElegirEstilo('${id}')"><span>${BOLICHE_ESTILOS[id].emoji}</span>${bolEsc(BOLICHE_ESTILOS[id].nombre)}</button>`).join('')}</div>
      <button class="fer-item fer-item-cumple" onclick="bolicheAlternarMusica()"><span>${bol.on ? '🔊' : '🔇'}</span>${bol.on ? 'Música activada (tocá para silenciar en este celular)' : 'Música silenciada (tocá para activar)'}</button>
      <p class="fer-sub">El estilo cambia para toda la sala. Si el sonido de la app está apagado, tampoco suena acá.</p>`;
  } else {
    const mias = bolicheMisBebidas();
    cuerpo = `<h3 class="fer-titulo">🍹 Barra</h3><p class="fer-texto">¿Qué te sirvo? <small>(todo de mentirita, sin alcohol)</small></p>
      <p class="fer-sub">Podés llevar hasta ${BOLICHE_MAX_BEBIDAS} bebidas.</p>
      <div class="fer-items">${bolicheBebidas().map((b, i) => `<button class="fer-item fer-item-txt" onclick="bolichePedirBebida(${i})"><span>${bolicheEmojiBebida(b)}</span>${bolEsc(b)}</button>`).join('')}</div>
      <div class="fer-admin-t bol-mano-t">En tu mano (${mias.length}/${BOLICHE_MAX_BEBIDAS})</div>
      <div class="bol-mano">${mias.length ? mias.map((b, i) => `<button class="bol-copa" onclick="bolicheDejarBebida(${i})" title="Dejar en la barra"><span>${b.e}</span>${bolEsc(b.n)} ✕</button>`).join('') : '<small>Todavía no pediste nada.</small>'}</div>
      ${mias.length ? '<button class="gbtn gbtn-ancho" onclick="bolicheBrindar()">🥂 ¡Brindar!</button>' : ''}`;
  }
  cont.innerHTML = `<div class="plz-modal bol-modal"><div class="plz-modal-caja bol-caja">${cuerpo}<div class="fer-botones">${cerrar}</div></div></div>`;
}

// ---- Dibujo: la sala, las luces y la fachada ----

function bolicheLuz(h, a){ return 'hsla(' + (((h % 360) + 360) % 360).toFixed(0) + ',85%,58%,' + a.toFixed(2) + ')'; }

PLZ_DECOR.boliche = function(ctx){
  const b = bolicheTiempos(), t = plz.t;
  // Pista de baile: baldosas de colores que laten
  const x0 = 150, y0 = 224, tam = 42;
  for(let j = 0; j < 6; j++) for(let i = 0; i < 8; i++){
    const on = (i + j + Math.floor(b)) % 2;
    ctx.fillStyle = bolicheLuz(i * 28 + j * 36 + b * 30, on ? 0.62 : 0.28);
    ctx.fillRect(x0 + i * tam + 1, y0 + j * tam + 1, tam - 2, tam - 2);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, tam * 8, tam * 6);
  // Rayos de luz desde el techo
  [[150, 0], [320, 0], [490, 0]].forEach(([x, y], i) => {
    const ang = Math.sin(t * 0.9 + i * 2) * 0.55;
    ctx.fillStyle = bolicheLuz(i * 110 + t * 40, 0.14);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.tan(ang - 0.18) * 300 + 20, 330); ctx.lineTo(x + Math.tan(ang + 0.18) * 300 - 20, 330); ctx.closePath(); ctx.fill();
  });
  // Bola de espejos y sus destellos sobre la pista
  const bx = 320, by = 176;
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, by - 22); ctx.stroke();
  const gr = ctx.createRadialGradient(bx - 6, by - 6, 2, bx, by, 24); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#8b93a8');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bx, by, 22, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
  for(let k = -2; k <= 2; k++){ ctx.beginPath(); ctx.ellipse(bx, by, 22, Math.abs(k) * 5 + 3, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(bx, by, Math.abs(k) * 5 + 3, 22, t * 0.8, 0, 7); ctx.stroke(); }
  for(let k = 0; k < 16; k++){
    const a = t * 0.8 + k * Math.PI / 8, rx = 40 + (k % 4) * 42, ry = 18 + (k % 3) * 22;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.35 * Math.sin(t * 3 + k)).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(bx + Math.cos(a) * rx, 338 + Math.sin(a) * ry, 3.2, 0, 7); ctx.fill();
  }
  // Cabina del DJ
  const pulso = 1 + 0.08 * Math.max(0, Math.cos(b * Math.PI * 2));
  ctx.fillStyle = '#0d0b1c'; arcRR(ctx, 230, 24, 180, 86, 12); ctx.fill();
  ctx.strokeStyle = bolicheLuz(b * 40, 0.9); ctx.lineWidth = 3; arcRR(ctx, 230, 24, 180, 86, 12); ctx.stroke();
  arcEmoji(ctx, '🎧', 320, 58, 34); arcEmoji(ctx, '🎛️', 320, 94, 22);
  [[198, 52], [442, 52]].forEach(([x, y]) => { // parlantes que laten con el bajo
    ctx.fillStyle = '#16142b'; arcRR(ctx, x - 22, y - 30, 44, 80, 8); ctx.fill();
    ctx.fillStyle = '#2b2840'; ctx.beginPath(); ctx.arc(x, y - 6, 15 * pulso, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d3a58'; ctx.beginPath(); ctx.arc(x, y + 30, 8 * pulso, 0, 7); ctx.fill();
  });
  // Barra
  ctx.fillStyle = '#2c1c14'; arcRR(ctx, 440, 24, 180, 110, 12); ctx.fill();
  ctx.fillStyle = '#5a3a22'; arcRR(ctx, 440, 96, 180, 38, 10); ctx.fill();
  ctx.strokeStyle = bolicheLuz(300 + b * 20, 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(446, 98); ctx.lineTo(614, 98); ctx.stroke();
  ['🍹', '🥤', '🍋', '🧃', '🍊'].forEach((e, i) => arcEmoji(ctx, e, 466 + i * 34, 40, 20));
  arcEmoji(ctx, '🧑‍🍳', 530, 72, 30);
  [466, 530, 594].forEach(x => { ctx.fillStyle = '#7E57FF'; ctx.beginPath(); ctx.arc(x, 150, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#3a2a66'; ctx.fillRect(x - 2, 156, 4, 14); });
  // Sillones
  [[16, 214], [558, 304]].forEach(([x, y]) => {
    ctx.fillStyle = '#5b2a86'; arcRR(ctx, x, y, 66, 48, 12); ctx.fill();
    ctx.fillStyle = '#7a3fb0'; arcRR(ctx, x + 4, y + 20, 58, 24, 8); ctx.fill();
    ctx.fillStyle = '#4a2070'; arcRR(ctx, x - 4, y + 10, 10, 34, 5); ctx.fill(); arcRR(ctx, x + 60, y + 10, 10, 34, 5); ctx.fill();
  });
  // Salida
  ctx.fillStyle = 'rgba(255,255,255,.12)'; arcRR(ctx, 270, 556, 100, 50, 10); ctx.fill();
  ctx.fillStyle = '#5A3A22'; arcRR(ctx, 296, 584, 48, 34, 6); ctx.fill();
  ctx.fillStyle = '#e8f0ff'; ctx.font = '800 11px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪 SALIDA', 320, 570);
};

// Fachada del boliche en la plaza: cartel de neón y bola de espejos.
function plazaDibujarNeon(ctx, e){
  const b = bolicheTiempos();
  ctx.fillStyle = 'rgba(0,0,0,.14)'; arcRR(ctx, e.x + 4, e.y + 8, e.w, e.h, 12); ctx.fill();
  ctx.fillStyle = '#17102e'; arcRR(ctx, e.x, e.y, e.w, e.h, 12); ctx.fill();
  ctx.strokeStyle = bolicheLuz(300 + b * 25, 0.95); ctx.lineWidth = 3; arcRR(ctx, e.x + 2, e.y + 2, e.w - 4, e.h - 4, 11); ctx.stroke();
  ctx.fillStyle = bolicheLuz(180 + b * 25, 1); ctx.font = '800 13px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('BAILABLE', e.x + e.w / 2, e.y + 16);
  const cx = e.x + e.w / 2, cy = e.y + 58;
  const gr = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, 20); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#8b93a8');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, 19, 7, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, 7, 19, plz.t * 0.8, 0, 7); ctx.stroke();
  for(let k = 0; k < 6; k++){ ctx.fillStyle = bolicheLuz(k * 60 + b * 50, 0.8); ctx.beginPath(); ctx.arc(cx + Math.cos(plz.t + k) * 30, cy + Math.sin(plz.t * 1.3 + k) * 22, 2.4, 0, 7); ctx.fill(); }
  const z = plazaZonaPuerta(e);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; arcRR(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
  ctx.fillStyle = '#5A3A22'; arcRR(ctx, e.x + e.w / 2 - 15, e.y + e.h - 36, 30, 36, 6); ctx.fill();
  ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(e.x + e.w / 2 + 9, e.y + e.h - 16, 2.4, 0, 7); ctx.fill();
}
