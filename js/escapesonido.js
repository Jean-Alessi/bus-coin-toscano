// Sonido de la Bus-queda (los juegos de escape): todo generado con Web Audio, sin archivos. Hay un ambiente
// que zumba y se pone más tenso según la situación, un latido que se acelera con el miedo, y efectos sueltos:
// crujidos, susurros, golpes, teléfono, pasos y el susto fuerte (el "stinger").

const ESS = { ctx: null, master: null, comp: null, ruido: null, on: true, drone: null, modo: '', latidoTimer: 0, latidoBpm: 0, vol: 0.55 };
try { ESS.on = localStorage.getItem('busmac-escape-sonido') !== 'no'; } catch(e){}

const essActivo = () => ESS.on && !(typeof sonidoActivado !== 'undefined' && !sonidoActivado);

function essContexto(){
  if(ESS.ctx) { if(ESS.ctx.state === 'suspended') ESS.ctx.resume(); return ESS.ctx; }
  try {
    const c = ESS.ctx = new (window.AudioContext || window.webkitAudioContext)();
    ESS.comp = c.createDynamicsCompressor(); ESS.comp.threshold.value = -20; ESS.comp.ratio.value = 8;
    ESS.master = c.createGain(); ESS.master.gain.value = ESS.vol;
    // Todo pasa por un filtro suave que corta los agudos: así nada suena chillón ni cansa.
    ESS.lp = c.createBiquadFilter(); ESS.lp.type = 'lowpass'; ESS.lp.frequency.value = 3200; ESS.lp.Q.value = 0.4;
    ESS.master.connect(ESS.lp); ESS.lp.connect(ESS.comp); ESS.comp.connect(c.destination);
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
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03 + 0.015 * tens, t + 3.5);
  f.type = 'lowpass'; f.frequency.value = 120 + 50 * tens; f.Q.value = 1;
  lfo.frequency.value = 0.06 + 0.04 * tens; lg.gain.value = 60 + 50 * tens; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
  const os = [[55, 'sine'], [55.6, 'sine'], [110.3, 'sine'], [82.4, 'triangle']];
  if(tens >= 1) os.push([116.5 + (tens > 1 ? 2 : 0), 'sine']);
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
    essOsc('sine', 62, t, 0.2, 0.3, 40); essOsc('sine', 56, t + 0.19, 0.24, 0.2, 36);
  };
  una(); ESS.latidoTimer = setInterval(una, 60000 / bpm);
}

// ---- Efectos ----
function essCrujido(){ if(!essListo()) return; const t = ESS.ctx.currentTime, p = Math.random() * 1.4 - 0.7; essOsc('triangle', 110 + Math.random() * 30, t, 0.8, 0.05, 62, p); essRuido(t, 0.7, 0.05, 'bandpass', 420, 180, 3, p); }
function essChirrido(){ if(!essListo()) return; const t = ESS.ctx.currentTime, p = Math.random() * 1.4 - 0.7; essOsc('sine', 330, t, 1.1, 0.03, 520, p); essOsc('sine', 520, t + 0.6, 0.8, 0.025, 380, p); }
function essSusurro(){
  if(!essListo()) return;
  const t = ESS.ctx.currentTime, p = Math.random() * 1.6 - 0.8; let k = 0;
  for(let i = 0; i < 4 + Math.floor(Math.random() * 3); i++){ const d = 0.1 + Math.random() * 0.2; essRuido(t + k, d * 1.6, 0.05, 'bandpass', 700 + Math.random() * 700, null, 1.6, p); k += d + 0.1 + Math.random() * 0.15; }
}
function essGolpe(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essRuido(t, 0.4, 0.14, 'lowpass', 320, 80, 1); essOsc('sine', 80, t, 0.5, 0.4, 38); }
function essPuerta(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essRuido(t, 0.35, 0.08, 'lowpass', 500, 150, 1); essOsc('triangle', 110, t, 0.2, 0.06, 65); }
function essPasos(n){ if(!essListo()) return; const t = ESS.ctx.currentTime; for(let i = 0; i < (n || 3); i++) essRuido(t + i * 0.52, 0.14, 0.1, 'lowpass', 200, 100, 1, i % 2 ? 0.4 : -0.4); }
function essZumbido(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('triangle', 100, t, 0.3, 0.04); essOsc('sine', 200, t + 0.05, 0.2, 0.025); }
function essApagon(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sine', 200, t, 1.4, 0.12, 30); essRuido(t, 0.6, 0.08, 'lowpass', 900, 70, 1); essGolpe(); }
function essEncender(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essZumbido(); essOsc('sine', 60, t, 1.4, 0.14, 120); }
function essTelefono(veces){
  if(!essListo()) return; const t = ESS.ctx.currentTime;
  for(let i = 0; i < (veces || 2); i++){ const s = t + i * 1.1; essOsc('sine', 420, s, 0.38, 0.07); essOsc('sine', 530, s, 0.38, 0.07); essOsc('sine', 420, s + 0.42, 0.38, 0.06); essOsc('sine', 530, s + 0.42, 0.38, 0.06); }
}
function essCampana(){ if(!essListo()) return; const t = ESS.ctx.currentTime; [[330, 0.12], [495, 0.06], [660, 0.035]].forEach(([f, v]) => essOsc('sine', f, t, 3.2, v)); }
// El susto fuerte: un golpe de ruido, un racimo de notas que chocan y un chillido que cae.
function essSusto(fuerte){
  if(!essListo()) return; const t = ESS.ctx.currentTime, v = fuerte ? 1 : 0.65;
  essRuido(t, 0.5, 0.1 * v, 'lowpass', 900, 150, 0.7);
  [196, 207.7, 233.1, 277.2].forEach((f, i) => essOsc(i % 2 ? 'triangle' : 'sine', f, t, 1.5, 0.07 * v));
  essOsc('sine', 740, t, 0.9, 0.04 * v, 230); essOsc('sine', 52, t, 0.9, 0.35 * v, 30);
}
function essTick(){ if(!essListo()) return; essOsc('sine', 620, ESS.ctx.currentTime, 0.06, 0.05); }
function essItem(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sine', 523, t, 0.14, 0.06); essOsc('sine', 784, t + 0.09, 0.26, 0.06); }
function essError(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sine', 170, t, 0.3, 0.07, 110); }
function essExito(){ if(!essListo()) return; const t = ESS.ctx.currentTime; [523, 659, 784, 988].forEach((f, i) => essOsc('sine', f, t + i * 0.1, 0.55, 0.06)); }
function essTecla(){ if(!essListo()) return; essOsc('sine', 480 + Math.random() * 60, ESS.ctx.currentTime, 0.06, 0.04); }
function essMotor(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('triangle', 42, t, 2.4, 0.14, 85); essRuido(t, 2.4, 0.06, 'lowpass', 140, 300, 1); }
// Final: acorde cálido y una cajita de música (contrasta con todo el miedo anterior).
function essFinal(){
  if(!essListo()) return; essAmbiente('final');
  const t = ESS.ctx.currentTime;
  [[130.8, 0], [164.8, 0.4], [196, 0.8], [261.6, 1.2]].forEach(([f, d]) => essOsc('sine', f, t + d, 6, 0.07));
  [523, 659, 784, 659, 523, 392, 523, 659, 784, 988].forEach((f, i) => essOsc('sine', f, t + 1 + i * 0.42, 1, 0.05));
}
function essAlternar(){
  ESS.on = !ESS.on;
  try { localStorage.setItem('busmac-escape-sonido', ESS.on ? 'si' : 'no'); } catch(e){}
  if(!ESS.on){ essTodoParar(); } else if(ESS.modo) { const m = ESS.modo; ESS.modo = ''; essAmbiente(m); }
  return ESS.on;
}

// ---- Más efectos para las otras aventuras ----
function essGota(){ if(!essListo()) return; const t = ESS.ctx.currentTime, p = Math.random() * 1.2 - 0.6; essOsc('sine', 900, t, 0.2, 0.05, 420, p); essOsc('sine', 760, t + 0.24, 0.3, 0.02, 360, p); }
function essTic(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sine', 900, t, 0.05, 0.04); essOsc('sine', 700, t + 0.5, 0.05, 0.03); }
function essRadio(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essRuido(t, 1.6, 0.05, 'bandpass', 700, 1500, 1.5); essOsc('sine', 392, t + 1.2, 0.3, 0.04); }
function essNota(f){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sine', f, t, 1.6, 0.1); essOsc('sine', f * 2, t, 1, 0.03); }
function essArrastre(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essRuido(t, 1.1, 0.09, 'lowpass', 380, 100, 1, -0.5); essOsc('triangle', 70, t, 1.1, 0.03, 45, -0.5); }
function essCajaMusica(){ if(!essListo()) return; const t = ESS.ctx.currentTime; [659, 784, 698, 659, 587, 659, 523, 587].forEach((f, i) => { essOsc('sine', f * (i % 3 === 2 ? 1.01 : 1), t + i * 0.45, 0.9, 0.05); essOsc('sine', f * 2, t + i * 0.45, 0.4, 0.015); }); }
function essViento(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essRuido(t, 3, 0.05, 'bandpass', 260, 600, 1.6); essRuido(t + 0.4, 2.5, 0.035, 'bandpass', 500, 260, 1.6); }
function essAlarma(){ if(!essListo()) return; const t = ESS.ctx.currentTime; for(let i = 0; i < 6; i++) essOsc('sine', i % 2 ? 440 : 587, t + i * 0.35, 0.32, 0.06); }
function essMotorFalla(){ if(!essListo()) return; const t = ESS.ctx.currentTime; for(let i = 0; i < 5; i++) essOsc('triangle', 55 + i * 6, t + i * 0.32, 0.3, 0.1, 38); essRuido(t, 1.6, 0.04, 'lowpass', 220, 100, 1); }
function essPlaca(){ if(!essListo()) return; const t = ESS.ctx.currentTime; essOsc('sine', 587, t, 0.12, 0.05); essOsc('sine', 880, t + 0.1, 0.22, 0.05); }
function essLlaves(){ if(!essListo()) return; const t = ESS.ctx.currentTime; for(let i = 0; i < 6; i++) essOsc('sine', 1100 + Math.random() * 500, t + i * 0.07, 0.14, 0.025); }
