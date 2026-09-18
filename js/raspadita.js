// Raspadita del día: una por pasajero por día (se guarda en este celular,
// no hace falta Firebase). 3 cuadraditos que se tocan para revelar — no es
// un raspado de verdad con el dedo (eso es mucho más frágil entre celulares
// distintos), pero se siente igual de bien. 3 logos = 100 monedas;
// 3 iguales que no sean el logo = 10 monedas.

// Pesos para que el premio grande sea especial y poco frecuente, pero pase
// "algo" con más regularidad que si todos los símbolos salieran parejo.
const RASPADITA_SIMBOLOS = [
  { id: 'logo', peso: 3, tipo: 'logo' },
  { id: 'trebol', peso: 5, emoji: '🍀' },
  { id: 'estrella', peso: 5, emoji: '⭐' },
  { id: 'regalo', peso: 5, emoji: '🎁' },
];

let raspaditaResultado = [];
let raspaditaReveladas = [];
let raspaditaYaJugadaHoy = false;
let raspaditaPremio = 0;
let raspaditaFechaActual = null;

function raspaditaFechaHoy(){
  return new Date().toISOString().slice(0, 10);
}

function raspaditaPoolPonderado(){
  const pool = [];
  RASPADITA_SIMBOLOS.forEach(s => { for(let i = 0; i < s.peso; i++) pool.push(s); });
  return pool;
}

function raspaditaSortear(){
  const pool = raspaditaPoolPonderado();
  return [0, 1, 2].map(() => pool[Math.floor(Math.random() * pool.length)]);
}

function raspaditaGuardar(){
  localStorage.setItem('raspadita-estado', JSON.stringify({
    fecha: raspaditaFechaActual,
    resultado: raspaditaResultado,
    reveladas: raspaditaReveladas,
    premio: raspaditaPremio,
  }));
}

// Solo vuelve a armar el estado cuando cambia el día (o la primera vez) —
// así una recarga de página en el mismo día no pierde lo ya revelado.
function raspaditaAsegurarEstado(){
  const hoy = raspaditaFechaHoy();
  if(raspaditaFechaActual === hoy) return;
  raspaditaFechaActual = hoy;

  const guardado = JSON.parse(localStorage.getItem('raspadita-estado') || 'null');
  if(guardado && guardado.fecha === hoy){
    raspaditaResultado = guardado.resultado;
    raspaditaReveladas = guardado.reveladas;
    raspaditaPremio = guardado.premio || 0;
  } else {
    raspaditaResultado = raspaditaSortear();
    raspaditaReveladas = [];
    raspaditaPremio = 0;
    raspaditaGuardar();
  }
  raspaditaYaJugadaHoy = raspaditaReveladas.length >= 3;
}

function raspaditaTocar(i){
  raspaditaAsegurarEstado();
  if(raspaditaYaJugadaHoy || raspaditaReveladas.includes(i)) return;
  raspaditaReveladas.push(i);
  reproducirTono('tick');

  if(raspaditaReveladas.length === 3){
    raspaditaYaJugadaHoy = true;
    const [a, b, c] = raspaditaResultado;
    if(a.id === b.id && b.id === c.id){
      raspaditaPremio = a.tipo === 'logo' ? 100 : 10;
      ganarMonedas(raspaditaPremio);
      reproducirTono(raspaditaPremio === 100 ? 'bonus' : 'correcto');
      mostrarToast(`¡Ganaste ${raspaditaPremio} monedas en la raspadita!`, 'gain');
    }
  }
  raspaditaGuardar();
  renderHome();
}

function raspaditaCasilleroHTML(i){
  const revelada = raspaditaReveladas.includes(i);
  if(!revelada){
    return `<button class="raspadita-casillero" onclick="raspaditaTocar(${i})">🎫</button>`;
  }
  const simbolo = raspaditaResultado[i];
  const contenido = simbolo.tipo === 'logo' ? `<img src="logo-empresa.png" alt="Logo">` : simbolo.emoji;
  return `<button class="raspadita-casillero raspadita-revelada" disabled>${contenido}</button>`;
}

function raspaditaHTML(){
  raspaditaAsegurarEstado();
  const mensaje = raspaditaYaJugadaHoy
    ? (raspaditaPremio > 0
        ? `¡Ganaste ${raspaditaPremio} monedas! Volvé mañana por otra raspadita.`
        : 'Nada esta vez. Volvé mañana por otra raspadita.')
    : 'Tocá los 3 cuadraditos: 3 logos son 100 monedas, 3 iguales son 10.';
  return `
    <div class="card raspadita-card">
      <div class="raspadita-titulo">🎟️ Raspadita del día</div>
      <p class="raspadita-mensaje">${mensaje}</p>
      <div class="raspadita-grid">${[0, 1, 2].map(raspaditaCasilleroHTML).join('')}</div>
    </div>`;
}
