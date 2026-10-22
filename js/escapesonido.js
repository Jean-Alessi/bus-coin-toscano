// Sonido de la Bus-queda (los juegos de escape): todo generado con Web Audio, sin archivos. Hay un ambiente
// que zumba y se pone más tenso según la situación, un latido que se acelera con el miedo, y efectos sueltos:
// crujidos, susurros, golpes, teléfono, pasos y el susto fuerte (el "stinger").

const ESS = { ctx: null, master: null, comp: null, ruido: null, on: true, drone: null, modo: '', latidoTimer: 0, latidoBpm: 0, vol: 0.85 };
try { ESS.on = localStorage.getItem('busmac-escape-sonido') !== 'no'; } catch(e){}

const essActivo = () => ESS.on && !(typeof sonidoActivado !== 'undefined' && !sonidoActivado);

function essContexto(){
  if(ESS.ctx) { if(ESS.ctx.state === 'suspended') ESS.ctx.resume(); return ESS.ctx; }
  try {
    const c = ESS.ctx = new (window.AudioContext || window.webkitAudioContext)();
    ESS.comp = c.createDynamicsCompressor(); ESS.comp.threshold.value = -14; ESS.comp.ratio.value = 6;
    ESS.master = c.createGain(); ESS.master.gain.value = ESS.vol;
    ESS.master.connect(ESS.comp); ESS.comp.connect(c.destination);
    const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    ESS.ruido = b;
  } catch(e){ ESS.ctx = null; }
  return ESS.ctx;
}

// Pequeñas piezas para armar los sonidos.
function essOsc(tipo, f, t0, dur, vol, f2, pan){
  const c = ESS.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, t0);
  if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.min(0.03, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); essSalida(g, pan); o.start(t0); o.stop(t0 + dur + 0.05);
  return o;
}
function essRuido(t0, dur, vol, filtro, f1, f2, q, pan){
  const c = ESS.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = ESS.ruido; s.loop = true;
  f.type = filtro || 'bandpass'; f.frequency.setValueAtTime(f1 || 1000, t0); if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur); f.Q.value = q || 1;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.min(0.04, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); essSalida(g, pan); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
}
function essSalida(nodo, pan){
  const c = ESS.ctx;
  if(pan && c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = pan; nodo.connect(p); p.connect(ESS.master); }
  else nodo.connect(ESS.master);
}
const essListo = () => essActivo() && essContexto();

// ---- Ambiente ----
// modo: 'calma' (zumbido grave), 'tension' (más grave y con una nota que desafina), 'oscuro' (aún más), 'final' (se apaga).
function essAmbiente(modo){
  if(!essListo()){ ESS.modo = modo; return; }
  if(ESS.drone && ESS.modo === modo) return;
  essAmbienteParar(0.6);
  ESS.modo = modo;
  if(modo === 'final' || modo === 'silencio') return;
  const c = ESS.ctx, t = c.currentTime, g = c.createGain(), f = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain();
  const tens = modo === 'tension' ? 1 : modo === 'oscuro' ? 1.6 : 0.5;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 + 0.03 * tens, t + 2.5);
  f.type = 'lowpass'; f.frequency.value = 150 + 90 * tens; f.Q.value = 3;
  lfo.frequency.value = 0.06 + 0.04 * tens; lg.gain.value = 60 + 50 * tens; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  const os = [[55, 'sawtooth'], [55.7, 'sawtooth'], [110.4, 'sine'], [82.4, 'triangle']];
  if(tens >= 1) os.push([116.5 + (tens > 1 ? 3 : 0), 'sine'], [233.1, 'triangle']);
  const lista = os.map(([fr, tipo]) => { const o = c.createOscillator(); o.type = tipo; o.frequency.value = fr; o.connect(f); o.start(); return o; });
  f.connect(g); g.connect(ESS.master);
  ESS.drone = { g, lista: lista.concat([lfo]) };
}
function essAmbienteParar(seg){
  const d = ESS.drone; if(!d || !ESS.ctx) return;
  const c = ESS.ctx, t = c.currentTime;
  try { d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(Math.max(0.0001, d.g.gain.value), t); d.g.gain.exponentialRampToValueAtTime(0.0001, t + (seg || 0.5)); d.lista.forEach(o => o.stop(t + (seg || 0.5) + 0.1)); } catch(e){}
  ESS.drone = null;
}
function essTodoParar(){ essLatido(0); essAmbienteParar(0.3); ESS.modo = ''; }

// Latido del corazón (bpm 0 = apagado).
function essLatido(bpm){
  if(ESS.latidoBpm === bpm) return;
  ESS.latidoBpm = bpm; clearInterval(ESS.latidoTimer); ESS.latidoTimer = 0;
  if(!bpm) return;
  const una = () => {
    if(!essListo()) return;
    const c = ESS.ctx, t = c.currentTime;
    essOsc('sine', 70, t, 0.16, 0.5, 38); essOsc('sine', 62, t + 0.17, 0.2, 0.36, 34);
  };
  una(); ESS.latidoTimer = setInterval(una, 60000 / bpm);
}

// ---- Efectos ----
function essCrujido(){ if(!essListo()) return; const t = ESS.ctx.currentTime, p = Math.random() * 1.4 - 0.7; essOsc('sawtooth', 95 + Math.random() * 30, t, 0.7, 0.06, 55, p); essRuido(t, 0.7, 0.16, 'bandpass', 700, 220, 6, p); }
function essChirrido(){ if(!essListo()) return; const t = ESS.ctx.currentTime, p = Math.random() * 1.4 - 0.7; essOsc('sine', 420, t, 0.9, 0.05, 780, p); essOsc('sine', 780, t + 0.5, 0.6, 0.04, 520, p); }
function essSusurro(){
  if(!essListo()) return;
  const t = ESS.ctx.currentTime, p = Math.random() * 1.6 - 0.8; let k = 0;
  for(let i = 0; i < 4 + Math.floor(Math.random() * 3); i++){ const d = 0.1 + Math.random() * 0.2; essRuido(t + k, d, 0.2, 'bandpass', 1500 + Math.random() * 1800, null, 2.5, p); k += d + 0.06 + Math.random() * 0.1; }
}
function essGolpe(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essRuido(t, 0.5, 0.5, 'lowpass', 500, 90, 1); essOsc('sine', 90, t, 0.45, 0.55, 40); }
function essPuerta(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essRuido(t, 0.35, 0.22, 'lowpass', 900, 200, 1); essOsc('square', 130, t, 0.18, 0.06, 70); }
function essPasos(n){ if(!essListo()) return; const t = ESS.ctx.currentTime; for(let i = 0; i < (n || 3); i++) essRuido(t + i * 0.52, 0.12, 0.24, 'lowpass', 260, 120, 1, i % 2 ? 0.4 : -0.4); }
function essZumbido(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('square', 100, t, 0.3, 0.05); essOsc('square', 200, t + 0.05, 0.2, 0.03); essRuido(t, 0.25, 0.1, 'highpass', 3000, null, 1); }
function essApagon(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sawtooth', 220, t, 1.2, 0.18, 30); essRuido(t, 0.5, 0.25, 'lowpass', 2500, 80, 1); essGolpe(); }
function essEncender(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essZumbido(); essOsc('sine', 60, t, 1.4, 0.2, 120); }
function essTelefono(veces){
  if(!essListo()) return; const t = ESS.ctx.currentTime;
  for(let i = 0; i < (veces || 2); i++){ const s = t + i * 1.1; essOsc('sine', 480, s, 0.38, 0.12); essOsc('sine', 620, s, 0.38, 0.12); essOsc('sine', 480, s + 0.42, 0.38, 0.1); essOsc('sine', 620, s + 0.42, 0.38, 0.1); }
}
function essCampana(){ if(!essListo()) return; const t = ESS.ctx.currentTime; [[330, 0.2], [495, 0.1], [660, 0.07], [850, 0.04]].forEach(([f, v]) => essOsc('sine', f, t, 3.2, v)); }
// El susto fuerte: un golpe de ruido, un racimo de notas que chocan y un chillido que cae.
function essSusto(fuerte){
  if(!essListo()) return; const t = ESS.ctx.currentTime, v = fuerte ? 1 : 0.65;
  essRuido(t, 0.9, 0.45 * v, 'highpass', 1500, 300, 0.7);
  [233.1, 246.9, 311.1, 349.2, 466.2].forEach((f, i) => essOsc(i % 2 ? 'square' : 'sawtooth', f, t, 1.3, 0.08 * v));
  essOsc('sawtooth', 1900, t, 0.8, 0.12 * v, 260); essOsc('sine', 50, t, 0.7, 0.6 * v, 28);
}
function essTick(){ if(!essListo()) return; essOsc('triangle', 780, ESS.ctx.currentTime, 0.05, 0.07); }
function essItem(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('triangle', 660, t, 0.12, 0.09); essOsc('triangle', 990, t + 0.09, 0.2, 0.09); }
function essError(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sawtooth', 160, t, 0.25, 0.07, 110); }
function essExito(){ if(!essListo()) return; const t = ESS.ctx.currentTime; [523, 659, 784, 1046].forEach((f, i) => essOsc('triangle', f, t + i * 0.1, 0.5, 0.09)); }
function essTecla(){ if(!essListo()) return; essOsc('square', 520 + Math.random() * 60, ESS.ctx.currentTime, 0.04, 0.035); }
function essMotor(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sawtooth', 40, t, 2.2, 0.16, 85); essRuido(t, 2.2, 0.14, 'lowpass', 160, 380, 1); }
// Final: acorde cálido y una cajita de música (contrasta con todo el miedo anterior).
function essFinal(){
  if(!essListo()) return; essAmbiente('final');
  const t = ESS.ctx.currentTime;
  [[130.8, 0], [164.8, 0.4], [196, 0.8], [261.6, 1.2]].forEach(([f, d]) => essOsc('sine', f, t + d, 6, 0.1));
  [523, 659, 784, 659, 523, 392, 523, 659, 784, 1046].forEach((f, i) => essOsc('triangle', f, t + 1 + i * 0.42, 0.9, 0.07));
}
function essAlternar(){
  ESS.on = !ESS.on;
  try { localStorage.setItem('busmac-escape-sonido', ESS.on ? 'si' : 'no'); } catch(e){}
  if(!ESS.on){ essTodoParar(); } else if(ESS.modo) { const m = ESS.modo; ESS.modo = ''; essAmbiente(m); }
  return ESS.on;
}
