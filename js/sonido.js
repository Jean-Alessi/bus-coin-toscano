// Sonidos compartidos por todos los juegos: tonos generados por código (sin
// archivos de audio que descargar). El mute se guarda en el celular y aplica
// a todos los juegos a la vez, para que en el micro cada uno decida si
// quiere sonido o no sin tener que apagarlo juego por juego.
let sonidoAudioCtx = null;
let sonidoActivado = localStorage.getItem('busmac-sonido') !== 'no';

function reproducirTono(tipo){
  if(!sonidoActivado) return;
  try {
    if(!sonidoAudioCtx) sonidoAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sonidoAudioCtx;
    if(ctx.state === 'suspended') ctx.resume();
    const ahora = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const config = {
      correcto: { freq: 880, dur: 0.12, onda: 'sine' },
      incorrecto: { freq: 180, dur: 0.15, onda: 'sawtooth' },
      tick: { freq: 660, dur: 0.06, onda: 'square' },
      fin: { freq: 220, dur: 0.4, onda: 'triangle' },
      bonus: { freq: 1046, dur: 0.35, onda: 'sine' },
    }[tipo] || { freq: 440, dur: 0.1, onda: 'sine' };
    osc.type = config.onda;
    osc.frequency.value = config.freq;
    gain.gain.setValueAtTime(0.15, ahora);
    gain.gain.exponentialRampToValueAtTime(0.001, ahora + config.dur);
    osc.start(ahora);
    osc.stop(ahora + config.dur);
  } catch(e){ /* si el navegador bloquea el audio, seguimos sin sonido */ }
}

function iconoSonido(){
  return sonidoActivado ? '🔊' : '🔇';
}

function toggleSonido(){
  sonidoActivado = !sonidoActivado;
  localStorage.setItem('busmac-sonido', sonidoActivado ? 'si' : 'no');
  document.querySelectorAll('.btn-mute').forEach(btn => btn.textContent = iconoSonido());
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-mute').forEach(btn => btn.textContent = iconoSonido());
});
