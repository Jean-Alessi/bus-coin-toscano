// Ruleta del día: un giro por pasajero por día (se guarda en este celular,
// no hace falta Firebase). Siempre da premio: los 12 casilleros tienen la
// misma chance, así que lo que se ve en la rueda es lo que realmente puede
// tocar. Para cambiar la economía basta con editar RULETA_PREMIOS.

const RULETA_PREMIOS = [5, 10, 5, 20, 5, 10, 5, 50, 5, 10, 5, 25];
const RULETA_COLORES = [
  { bg: '#FF5E62', fg: '#FFFFFF' },
  { bg: '#FFD84D', fg: '#4A2A00' },
  { bg: '#4FB8FF', fg: '#FFFFFF' },
  { bg: '#5BE88D', fg: '#0F4A26' },
];
const RULETA_VUELTAS = 5;
const RULETA_DURACION_MS = 4200;

let ruletaGirando = false;
let ruletaAngulo = 0; // rotación acumulada de la rueda, en grados

// Fecha local (no UTC): con UTC el "día" se reiniciaba a las 21 h en Argentina.
function ruletaFechaHoy(){
  return new Date().toLocaleDateString('en-CA');
}

function ruletaLeerEstado(){
  try { return JSON.parse(localStorage.getItem('ruleta-estado') || 'null'); } catch(e){ return null; }
}

function ruletaGuardarEstado(estado){
  try { localStorage.setItem('ruleta-estado', JSON.stringify(estado)); } catch(e){}
}

// Estado de HOY, o null si todavía no giró.
function ruletaEstadoDeHoy(){
  const estado = ruletaLeerEstado();
  return estado && estado.fecha === ruletaFechaHoy() ? estado : null;
}

// Si se cerró la app justo mientras giraba, el premio quedó registrado pero
// sin entregar: se entrega la próxima vez que se dibuja la ruleta.
function ruletaAcreditarPendiente(){
  const estado = ruletaEstadoDeHoy();
  if(!estado || estado.acreditado || ruletaGirando) return;
  estado.acreditado = true;
  ruletaGuardarEstado(estado);
  ganarMonedas(estado.premio);
  mostrarToast(`¡Ganaste ${estado.premio} monedas en la ruleta!`, 'gain');
}

function ruletaGirar(){
  if(ruletaGirando || ruletaEstadoDeHoy()) return;
  ruletaGirando = true;

  const cantidad = RULETA_PREMIOS.length;
  const paso = 360 / cantidad;
  const indice = Math.floor(Math.random() * cantidad);
  const premio = RULETA_PREMIOS[indice];

  // El puntero está arriba (0°); el casillero i ocupa de i*paso a (i+1)*paso
  // en sentido horario. Para que quede bajo el puntero hay que girar la rueda
  // hasta que el centro de ese casillero (con un poco de desvío, para que
  // no caiga siempre clavado al medio) llegue a 0°.
  const desvio = (Math.random() - 0.5) * paso * 0.6;
  const destino = (360 - ((indice * paso + paso / 2 + desvio) % 360)) % 360;
  const actual = ((ruletaAngulo % 360) + 360) % 360;
  ruletaAngulo += ((destino - actual + 360) % 360) + 360 * RULETA_VUELTAS;

  ruletaGuardarEstado({ fecha: ruletaFechaHoy(), premio, angulo: ruletaAngulo, acreditado: false });

  const rueda = document.getElementById('ruleta-rueda');
  const boton = document.getElementById('ruleta-boton');
  if(boton){ boton.disabled = true; boton.textContent = 'Girando...'; }
  if(rueda){
    rueda.style.transition = `transform ${RULETA_DURACION_MS}ms cubic-bezier(.12,.65,.08,1)`;
    rueda.style.transform = `rotate(${ruletaAngulo}deg)`;
  }

  setTimeout(() => {
    ruletaGirando = false;
    const estado = ruletaEstadoDeHoy();
    if(estado && !estado.acreditado){
      estado.acreditado = true;
      ruletaGuardarEstado(estado);
      ganarMonedas(estado.premio);
      reproducirTono(estado.premio >= 25 ? 'bonus' : 'correcto');
      mostrarToast(`¡Ganaste ${estado.premio} monedas en la ruleta!`, 'gain');
    }
    const vistaActiva = document.querySelector('.view.active');
    if(vistaActiva && vistaActiva.id === 'view-home') renderHome();
  }, RULETA_DURACION_MS + 150);
}

function ruletaSVG(angulo){
  const cantidad = RULETA_PREMIOS.length;
  const paso = 360 / cantidad;
  const R = 94;
  const punto = (grados, radio) => {
    const rad = grados * Math.PI / 180;
    return [100 + radio * Math.sin(rad), 100 - radio * Math.cos(rad)];
  };

  const gajos = RULETA_PREMIOS.map((premio, i) => {
    const [x1, y1] = punto(i * paso, R);
    const [x2, y2] = punto((i + 1) * paso, R);
    const color = RULETA_COLORES[i % RULETA_COLORES.length];
    const medio = i * paso + paso / 2;
    return `<path d="M100,100 L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${color.bg}" stroke="#fff" stroke-width="1.5"/>
      <g transform="rotate(${medio - 90} 100 100)"><text x="${100 + R - 9}" y="100" text-anchor="end" dominant-baseline="central" fill="${color.fg}" font-size="${premio >= 10 ? 15 : 17}" font-weight="800" font-family="Baloo 2, Poppins, sans-serif">${premio}</text></g>`;
  }).join('');

  const luces = RULETA_PREMIOS.map((_, i) => {
    const [x, y] = punto(i * paso, R + 3);
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.6" fill="#FFF3B0"/>`;
  }).join('');

  return `<svg viewBox="0 -16 200 216" class="ruleta-svg" role="img" aria-label="Ruleta del día">
    <g id="ruleta-rueda" style="transform-box:fill-box; transform-origin:center; transform:rotate(${angulo}deg);">
      <circle cx="100" cy="100" r="${R + 5}" fill="#fff"/>
      ${gajos}
      ${luces}
    </g>
    <circle cx="100" cy="100" r="22" fill="#fff" stroke="#C9A227" stroke-width="4"/>
    <clipPath id="ruleta-recorte"><circle cx="100" cy="100" r="17"/></clipPath>
    <image href="icons/icon-192.png" x="83" y="83" width="34" height="34" clip-path="url(#ruleta-recorte)"/>
    <polygon points="88,-13 112,-13 100,12" fill="#fff" stroke="#E5484D" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
}

function ruletaHTML(){
  ruletaAcreditarPendiente();
  const estado = ruletaEstadoDeHoy();
  const yaGiro = !!estado;
  if(yaGiro) ruletaAngulo = estado.angulo;
  const mensaje = yaGiro
    ? (ruletaGirando ? '¡Ahí va...!' : `Hoy ganaste ${estado.premio} monedas. Volvé mañana por otro giro.`)
    : 'Un giro por día. ¡Probá tu suerte!';
  return `
    <div class="escena escena-neon ruleta-card">
      <div class="ruleta-titulo">🎡 Ruleta del día</div>
      <p class="ruleta-mensaje">${mensaje}</p>
      <div class="ruleta-rueda-wrap">${ruletaSVG(ruletaAngulo)}</div>
      <div class="g-acciones"><button class="gbtn gbtn-ancho" id="ruleta-boton" onclick="ruletaGirar()" ${yaGiro ? 'disabled' : ''}>${ruletaGirando ? 'Girando...' : yaGiro ? 'Volvé mañana' : '¡Girar!'}</button></div>
    </div>`;
}
