// Plaza Busmac: un mundo visto desde arriba donde se ven caminar los
// pasajeros del mismo viaje. Tocás un lugar y tu personaje camina hasta ahí;
// los edificios son las puertas a los juegos, el ranking, la boutique y los
// comercios.
//
// Para cuidar la conexión y que no se amontone la gente, la plaza se divide en
// salas de hasta 12 personas. No hay chat libre: solo frases ya armadas.
// Cada celular escribe su posición en Firebase (salas/{viaje}/plaza/{sala}/
// {asiento}) unas 3 veces por segundo mientras camina, y la borra al salir.

const PLZ = { W: 640, H: 1200, VW: 340, VH: 450, SALA_MAX: 12, VEL: 96, VIVO_MS: 25000 };
const PLZ_SUELO = 1040; // la plaza llega hasta acá; más abajo está la calle donde para el micro
const PLZ_FRASES = ['¡Hola! 👋', '¿Jugamos?', '¡Buen viaje! 🚌', '¡Vamos!', 'Buena jugada 👏', '😂', '¡Qué calor!', 'Gracias 🙌'];

// Edificios: puertas a otras pantallas. 'lado' dice hacia dónde mira la puerta.
const PLZ_COL = [16, 180, 344, 508]; // 4 columnas de 116 de ancho con pasillos de 48
const PLZ_EDIFICIOS = [
  // Arriba: edificios con puerta hacia abajo.
  { id: 'arcade', nombre: 'Arcade', sub: 'Video juegos', emoji: '🎮', x: PLZ_COL[0], y: 24, w: 116, h: 120, color: '#E5586E', lado: 'abajo', ir: () => { if(typeof juegosAbiertos !== 'undefined') juegosAbiertos.video = true; showView('juegos'); } },
  { id: 'cartas', nombre: 'Salón de cartas', sub: 'Truco, Chinchón y más', emoji: '🃏', x: PLZ_COL[1], y: 24, w: 116, h: 120, color: '#3B9B5A', lado: 'abajo', ir: () => { if(typeof juegosAbiertos !== 'undefined') juegosAbiertos.grupoCartas = true; showView('juegos'); } },
  { id: 'boutique', nombre: 'Boutique', sub: 'Vestí a tu personaje', emoji: '👕', x: PLZ_COL[2], y: 24, w: 116, h: 120, color: '#7E57FF', lado: 'abajo', ir: () => showView('avatar') },
  { id: 'escenario', nombre: 'Escenario', sub: 'Trivia y bingo en vivo', emoji: '🎤', x: PLZ_COL[3], y: 24, w: 116, h: 120, color: '#D62839', lado: 'abajo', ir: () => feriaEscenario() },
  // El micro de dos pisos, estacionado en la calle (afuera de la plaza): de acá bajan todos (ver micro.js).
  { id: 'micro', micro: true, nombre: 'Micro', sub: 'Mirá quién sigue arriba y buscá a alguien', emoji: '🚌', x: 170, y: 1090, w: 300, h: 100, color: '#0F2A4D', lado: 'arriba', ir: () => microAbrir() },
  // Feria, primera fila: puestos donde se pasa una vez y se hace fila (ver feria.js).
  { id: 'kiosco', puesto: true, nombre: 'Kiosco', sub: 'Pedí una golosina de cortesía', emoji: '🍬', x: PLZ_COL[0], y: 520, w: 116, h: 100, color: '#F28482', lado: 'abajo', ir: () => feriaIntentar('kiosco') },
  { id: 'agencia', puesto: true, nombre: 'Agencia', sub: 'Promos y descuentos', emoji: '✈️', x: PLZ_COL[1], y: 520, w: 116, h: 100, color: '#3A86FF', lado: 'abajo', ir: () => feriaIntentar('agencia') },
  { id: 'sorteo', puesto: true, nombre: 'Sorteo', sub: 'Retirá tu número', emoji: '🎟️', x: PLZ_COL[2], y: 520, w: 116, h: 100, color: '#9D4EDD', lado: 'abajo', ir: () => feriaIntentar('sorteo') },
  { id: 'radio', puesto: true, nombre: 'Radio', sub: 'Votá la música del micro', emoji: '📻', x: PLZ_COL[3], y: 520, w: 116, h: 100, color: '#FF9F1C', lado: 'abajo', ir: () => feriaIntentar('radio') },
  // Feria, segunda fila.
  { id: 'coordinador', puesto: true, nombre: 'Coordinador', sub: 'Pedí algo para el viaje', emoji: '🧑‍✈️', x: PLZ_COL[0], y: 700, w: 116, h: 100, color: '#2A9D8F', lado: 'abajo', ir: () => feriaIntentar('coordinador') },
  { id: 'farmacia', puesto: true, nombre: 'Farmacia', sub: '¿Te sentís mal? Avisá acá', emoji: '💊', x: PLZ_COL[1], y: 700, w: 116, h: 100, color: '#D62839', lado: 'abajo', ir: () => feriaIntentar('farmacia') },
  { id: 'buzon', puesto: true, nombre: 'Buzón', sub: 'Contanos cómo viajás', emoji: '📮', x: PLZ_COL[2], y: 700, w: 116, h: 100, color: '#E76F51', lado: 'abajo', ir: () => feriaIntentar('buzon') },
  { id: 'cartelera', puesto: true, nombre: 'Cartelera', sub: 'Horarios y actividades', emoji: '📋', x: PLZ_COL[3], y: 700, w: 116, h: 100, color: '#577590', lado: 'abajo', ir: () => feriaIntentar('cartelera') },
  // Abajo: edificios con puerta hacia arriba.
  { id: 'ranking', nombre: 'Ranking', sub: 'Mirá cómo vas', emoji: '🏆', x: PLZ_COL[0], y: 900, w: 116, h: 120, color: '#E6A817', lado: 'arriba', ir: () => showView('ranking') },
  { id: 'comercios', nombre: 'Comercios', sub: 'Descuentos del destino', emoji: '🏪', x: PLZ_COL[1], y: 900, w: 116, h: 120, color: '#2FB5B5', lado: 'arriba', ir: () => showView('comercios') },
  { id: 'premios', nombre: 'Premios', sub: 'Lo que podés ganar', emoji: '🎁', x: PLZ_COL[2], y: 900, w: 116, h: 120, color: '#FF7A1A', lado: 'arriba', ir: () => showView('tienda') },
  { id: 'foto', nombre: 'Fotos', sub: 'Foto grupal con marco', emoji: '📸', x: PLZ_COL[3], y: 900, w: 116, h: 120, color: '#4361EE', lado: 'arriba', ir: () => feriaFotoGrupal() },
];
const PLZ_FUENTE = { x: 320, y: 340, r: 44 };

// El parque del centro: cosas para hacer. 'zona' es donde hay que pararse para usarlas;
// 'pose' es cómo se ve el personaje (1 hamaca, 2 salto, 3 sentado) y lo ven todos.
const PLZ_ATRACCIONES = [
  { id: 'hamacas', nombre: 'Hamacas', emoji: '🛝', verbo: 'Hamacarte', sub: 'Se hamacan hasta 3 a la vez', pose: 1, zona: { x: 36, y: 290, w: 178, h: 80 }, slots: [{ x: 78, y: 322 }, { x: 124, y: 322 }, { x: 170, y: 322 }] },
  { id: 'trampolin', nombre: 'Cama elástica', emoji: '🤸', verbo: 'Saltar', sub: '¡Saltá todo lo que quieras!', pose: 2, zona: { x: 438, y: 296, w: 124, h: 70 } },
  { id: 'banco1', nombre: 'Banco', emoji: '🪑', verbo: 'Sentarte', sub: 'Descansá y mirá la plaza', pose: 3, zona: { x: 60, y: 420, w: 110, h: 60 }, slots: [{ x: 96, y: 452 }, { x: 134, y: 452 }] },
  { id: 'banco2', nombre: 'Banco', emoji: '🪑', verbo: 'Sentarte', sub: 'Descansá y mirá la plaza', pose: 3, zona: { x: 470, y: 420, w: 110, h: 60 }, slots: [{ x: 506, y: 452 }, { x: 544, y: 452 }] },
  { id: 'correo', nombre: 'Correo', emoji: '💌', verbo: 'Abrir el buzón', sub: 'Invitaciones entre pasajeros', fn: 'cartitasAbrir', zona: { x: 284, y: 424, w: 72, h: 70 } },
  { id: 'fuente', nombre: 'Fuente de los deseos', emoji: '🪙', verbo: 'Pedir un deseo', sub: 'Tirá una moneda (gratis) y mirá qué sale', deseo: true, dentro: (x, y) => { const d = Math.hypot(x - PLZ_FUENTE.x, y - (PLZ_FUENTE.y + 4)); return d > 36 && d < 78; } },
];
const PLZ_DESEOS = ['Vas a conocer un lugar mágico ✨', 'Hoy te toca la mejor vista 🌄', 'Alguien te invita un mate 🧉', 'Se viene una gran aventura 🚌', 'Vas a hacer un amigo nuevo 🤝', 'Mañana sale un día de sol ☀️', 'Ganás la próxima partida 🎮', 'Te espera una sorpresa 🎁'];
const plazaNombre = () => 'Plaza ' + marcaCorta();

let plz = {
  activo: false, sala: 1, yo: { x: 320, y: 440, dir: 1 }, obj: null, otros: {}, cam: { x: 0, y: 0 }, t: 0, ultimoEnvio: 0, ultimoLatido: 0,
  bots: [], offset: 0, listener: null, ref: null, raf: 0, ultimo: 0, burbuja: null, menuAbierto: false, puerta: null, canvas: null, ctx: null, conectado: false,
};

// Viajes de demostración (código que empieza con DEMO): además de las personas de
// verdad, la plaza suma pasajeros ficticios que caminan y hablan, para ver cómo se ve
// con gente. Viven solo en este celular, no se escriben en ninguna base de datos.
const plazaEsDemo = () => /^DEMO/i.test((typeof codigoViaje !== 'undefined' && codigoViaje) || '');
const PLZ_BOTS = [
  { n: 'Sofi', a: { remera: 'hawaiana', peloEstilo: 'largo', peloColor: 3, caraAcc: 'sol', cara: 'contento', fondo: 'atardecer' } },
  { n: 'Lucho', a: { remera: 'busmac', gorra: 'visera', peloEstilo: 'corto', peloColor: 0, piel: 2, manoAcc: 'mate' } },
  { n: 'Cami', a: { remera: 'egresado', gorra: 'birrete', peloEstilo: 'rulos', peloColor: 1, piel: 4, cara: 'guino' } },
  { n: 'Tomi', a: { remera: 'rayas', peloEstilo: 'flequillo', peloColor: 2, caraAcc: 'anteojos', manoAcc: 'valija' } },
  { n: 'Vale', a: { remera: 'estrellas', gorra: 'lana', peloEstilo: 'colita', peloColor: 4, piel: 0, cara: 'sorpresa' } },
  { n: 'Nico', a: { remera: 'chofer', peloEstilo: 'rapado', peloColor: 0, piel: 5, caraAcc: 'bigote' } },
  { n: 'Agus', a: { remera: 'celeste', gorra: 'paja', peloEstilo: 'corto', peloColor: 3, manoAcc: 'mochila', cara: 'contento' } },
  { n: 'Mica', a: { remera: 'dorada', gorra: 'corona', peloEstilo: 'largo', peloColor: 5, piel: 1, caraAcc: 'sol' } },
];

function plazaPuntoLibre(){
  for(let i = 0; i < 40; i++){
    const x = 50 + Math.random() * 540, y = 190 + Math.random() * 350;
    if(!plazaChoca(x, y)) return { x, y };
  }
  return { x: 320, y: 450 };
}

function plazaCrearBots(){
  return PLZ_BOTS.map(b => {
    const ini = plazaPuntoLibre(), obj = plazaPuntoLibre();
    return { n: b.n, a: b.a, x: ini.x, y: ini.y, tx: obj.x, ty: obj.y, dir: 1, espera: Math.random() * 3, caminando: false, m: null, hasta: 0 };
  });
}

function plazaMoverBots(dt){
  plz.bots.forEach(b => {
    if(b.espera > 0){ b.espera -= dt; b.caminando = false; return; }
    const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
    if(d < 4){
      b.espera = 1 + Math.random() * 4; b.caminando = false;
      const o = plazaPuntoLibre(); b.tx = o.x; b.ty = o.y;
      if(Math.random() < 0.4){ b.m = Math.floor(Math.random() * PLZ_FRASES.length); b.hasta = performance.now() + 4200; }
      return;
    }
    const vx = dx / d, vy = dy / d;
    const px = b.x + vx * 70 * dt, py = b.y + vy * 70 * dt;
    let movio = false;
    if(!plazaChoca(px, b.y)){ b.x = px; movio = true; }
    if(!plazaChoca(b.x, py)){ b.y = py; movio = true; }
    if(!movio){ const o = plazaPuntoLibre(); b.tx = o.x; b.ty = o.y; b.espera = 0.3; }
    if(vx) b.dir = vx > 0 ? 1 : -1;
    b.caminando = true;
  });
}

function plazaActualizarCantidad(){
  const el = document.getElementById('plaza-cantidad');
  if(el) el.textContent = (Object.keys(plz.otros).length + plz.bots.length + 1) + ' en la plaza' + (plazaEsDemo() ? ' (demo)' : '');
}

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
  const g = plz.posGuardada;
  plz.yo = g && g.viaje === (typeof codigoViaje !== 'undefined' ? codigoViaje : '') && Date.now() - g.t < 600000
    ? { x: g.x, y: g.y, dir: 1 }
    : { x: 320 + Math.floor((Math.random() - 0.5) * 16), y: (typeof MIC_SALIDA_Y === 'number' ? MIC_SALIDA_Y : 1036), dir: 1 };
  plz.pose = null;
  plz.enMicro = false; plz.buscado = null; plz.ultimaActividad = performance.now();
  plz.t = 0; plz.conectado = false;
  plz.bots = plazaEsDemo() ? plazaCrearBots() : [];
  plazaRender();
  plazaActualizarCantidad();
  if(typeof feriaIniciar === 'function') feriaIniciar();
  if(typeof cartitasIniciar === 'function') cartitasIniciar();
  const online = typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre;
  if(online) plazaConectar();
  plz.ultimo = 0;
  plz.raf = requestAnimationFrame(plazaBucle);
}

// Elige la sala: si ya estoy en una (me reconecté), esa; si el viaje tiene cursos y elegí
// el mío, la sala de mi curso (con partes si el curso es grande); si no, la primera
// sala general con lugar. 'forzada' es una sala que el pasajero eligió a mano.
async function plazaConectar(forzada){
  try {
    db.ref('.info/serverTimeOffset').once('value').then(s => { plz.offset = s.val() || 0; });
    const [snap, snapCursos] = await Promise.all([db.ref(`salas/${codigoViaje}/plaza`).once('value'), db.ref(`salas/${codigoViaje}/cursos`).once('value')]);
    const salas = snap.val() || {};
    const cv = snapCursos.val();
    plz.cursos = (Array.isArray(cv) ? cv : (cv ? Object.keys(cv).map(k => cv[k]) : [])).map(String);
    const ahora = plazaAhora(), yo = String(miAsiento);
    const vivos = k => Object.keys(salas[k] || {}).filter(a => a !== yo && ahora - (((salas[k] || {})[a] || {}).t || 0) < PLZ.VIVO_MS).length;
    const estoyEn = k => { const m = (salas[k] || {})[yo]; return !!m && ahora - (m.t || 0) < PLZ.VIVO_MS; };
    let elegida = forzada || Object.keys(salas).find(estoyEn) || null;
    if(!elegida){
      const miCurso = typeof cursosMio === 'function' ? cursosMio() : '';
      const idx = miCurso ? plz.cursos.indexOf(miCurso) : -1;
      for(let k = 1; idx >= 0 && k <= 20 && !elegida; k++){ const key = 'c' + (idx + 1) + '-' + k; if(vivos(key) < PLZ.SALA_MAX) elegida = key; }
      for(let i = 1; i <= 30 && !elegida; i++){ const key = String(i); if(vivos(key) < PLZ.SALA_MAX) elegida = key; }
    }
    if(!plz.activo) return;
    if(plz.ref){ // viene de otra sala: se despide de ahí
      try { if(plz.listener) plz.ref.off('value', plz.listener); plz.ref.child(yo).remove(); } catch(e){}
      plz.otros = {};
    }
    plz.sala = String(elegida || '1');
    plz.ref = plazaRefSala();
    const miRef = plz.ref.child(yo);
    miRef.onDisconnect().remove();
    plz.conectado = true;
    plazaEnviar(true);
    plz.listener = plz.ref.on('value', s => plazaRecibir(s.val() || {}));
    plazaActualizarSala();
  } catch(e){ plz.conectado = false; }
}

// "c2-1" = sala 1 del curso número 2; "3" = sala general 3.
function plazaEtiquetaSala(k){
  const m = /^c(\d+)-(\d+)$/.exec(String(k));
  if(m){
    const nombre = (plz.cursos || [])[Number(m[1]) - 1] || 'Curso';
    return Number(m[2]) > 1 ? nombre + ' · ' + m[2] : nombre;
  }
  return 'Sala ' + k;
}

function plazaActualizarSala(){
  const el = document.getElementById('plaza-sala');
  if(el) el.textContent = plz.conectado ? plazaEtiquetaSala(plz.sala) : plazaNombre();
}

async function plazaAbrirSalas(){
  const cont = document.getElementById('plaza-salas');
  if(!cont) return;
  if(!plz.conectado){ if(typeof mostrarToast === 'function') mostrarToast('Entrá a un viaje para cambiar de sala'); return; }
  const snap = await db.ref(`salas/${codigoViaje}/plaza`).once('value');
  const salas = snap.val() || {};
  const ahora = plazaAhora(), yo = String(miAsiento);
  const cuenta = k => Object.keys(salas[k] || {}).filter(a => ahora - (((salas[k] || {})[a] || {}).t || 0) < PLZ.VIVO_MS).length;
  const claves = new Set(Object.keys(salas).filter(k => cuenta(k) > 0));
  claves.add(String(plz.sala));
  const miCurso = typeof cursosMio === 'function' ? cursosMio() : '';
  const idx = miCurso ? (plz.cursos || []).indexOf(miCurso) : -1;
  if(idx >= 0) claves.add('c' + (idx + 1) + '-1');
  for(let i = 1; i <= 30; i++){ if(!claves.has(String(i)) || cuenta(String(i)) < PLZ.SALA_MAX){ claves.add(String(i)); break; } }
  const orden = k => { const m = /^c(\d+)-(\d+)$/.exec(k); return m ? [0, Number(m[1]), Number(m[2])] : [1, Number(k), 0]; };
  const lista = Array.from(claves).sort((a, b) => { const x = orden(a), y = orden(b); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; });
  cont.innerHTML = `<div class="plz-modal"><div class="plz-modal-caja"><h3 class="fer-titulo">🚪 Salas de la plaza</h3><p class="fer-sub">Elegí dónde querés estar. Cada sala admite ${PLZ.SALA_MAX} personas.</p>${lista.map(k => {
    const n = cuenta(k) + (String(k) === String(plz.sala) && !salas[k] ? 1 : 0), actual = String(k) === String(plz.sala), llena = !actual && n >= PLZ.SALA_MAX;
    return `<div class="plz-sala-fila${actual ? ' actual' : ''}"><span>${plazaEtiquetaSala(k)}<small>${n}/${PLZ.SALA_MAX}</small></span>${actual ? '<b>Estás acá</b>' : `<button class="gbtn gbtn-chico-texto" ${llena ? 'disabled' : ''} onclick="plazaIrASala('${k}')">${llena ? 'Llena' : 'Entrar'}</button>`}</div>`;
  }).join('')}<div class="fer-botones"><button class="gbtn gbtn-ancho gbtn-no" onclick="plazaCerrarSalas()">Cerrar</button></div></div></div>`;
}

function plazaCerrarSalas(){ const c = document.getElementById('plaza-salas'); if(c) c.innerHTML = ''; }

async function plazaIrASala(k){
  plazaCerrarSalas();
  if(String(k) === String(plz.sala)) return;
  await plazaConectar(String(k));
}

function plazaAlSalir(silencioso){
  cancelAnimationFrame(plz.raf);
  if(plz.activo && !plz.enMicro) plz.posGuardada = { x: plz.yo.x, y: plz.yo.y, t: Date.now(), viaje: (typeof codigoViaje !== 'undefined' ? codigoViaje : '') };
  plz.pose = null;
  if(typeof feriaAlSalir === 'function') feriaAlSalir();
  if(typeof cartitasAlSalir === 'function') cartitasAlSalir();
  if(plz.ref){
    try {
      if(plz.listener) plz.ref.off('value', plz.listener);
      if(typeof miAsiento !== 'undefined' && miAsiento) plz.ref.child(String(miAsiento)).remove();
    } catch(e){}
  }
  plz.ref = null; plz.listener = null; plz.activo = false; plz.conectado = false; plz.enMicro = false; plz.buscado = null;
  plazaCerrarSalas();
  if(typeof microSoltar === 'function'){ microSoltar(); MIC.abierto = false; const cm = document.getElementById('plaza-micro'); if(cm) cm.innerHTML = ''; }
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
  const datos = { x: Math.round(plz.yo.x), y: Math.round(plz.yo.y), t: firebase.database.ServerValue.TIMESTAMP, cu: (typeof feria !== 'undefined' && feria.cumple) ? 1 : null, p: plz.pose ? plz.pose.p : null };
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
      m: typeof d.m === 'number' ? d.m : null, mt: d.mt || 0, cu: !!d.cu, p: typeof d.p === 'number' ? d.p : 0, fase: (parseInt(a, 10) || 0) % 7,
    };
  });
  plz.otros = nuevos;
  plazaActualizarCantidad();
}

function plazaDecir(i){
  if(i < 0 || i >= PLZ_FRASES.length) return;
  plz.ultimaActividad = performance.now();
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
    <div class="g-hud"><span class="g-pill" id="plaza-cantidad">1 en la plaza</span><span class="g-pill" id="plaza-sala">${plazaNombre()}</span></div>
    <div class="plz-caja"><canvas class="plz-canvas"></canvas></div>
    <div id="plaza-modal"></div>
    <div id="plaza-salas"></div>
    <div id="plaza-micro"></div>
    <div id="plaza-cartas"></div>
    <div id="plaza-accion" class="plz-accion"></div>
    <div id="plaza-menu"></div>
    <div class="g-acciones plz-botones"><button class="gbtn gbtn-chico-texto" onclick="plazaToggleMenu()">💬 Decir</button><button class="gbtn gbtn-chico-texto" onclick="showView('avatar')">👕 Personaje</button><button class="gbtn gbtn-chico-texto" onclick="plazaAbrirSalas()">🚪 Sala</button><button class="gbtn gbtn-chico-texto" onclick="feriaPasaporte()">📒 Pasaporte</button><button class="gbtn gbtn-chico-texto" onclick="microAbrir()">🚌 Micro</button></div>`, 'plz-escena');
  plz.canvas = cont.querySelector('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  plz.canvas.width = PLZ.VW * dpr; plz.canvas.height = PLZ.VH * dpr;
  plz.ctx = plz.canvas.getContext('2d');
  plz.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  plazaEntrada();
  plazaAjustar();
  setTimeout(plazaAjustar, 250);
  plazaRenderMenu();
  plazaRenderAccion();
}

function plazaAjustar(){
  const vista = document.getElementById('view-plaza');
  if(!plz.canvas || !vista || !vista.classList.contains('active')) return;
  const caja = plz.canvas.parentElement;
  caja.style.width = '100%';
  const top = caja.getBoundingClientRect().top - vista.getBoundingClientRect().top + vista.scrollTop;
  let resto = 0;
  for(let el = caja.nextElementSibling; el; el = el.nextElementSibling) if(getComputedStyle(el).position !== 'absolute') resto += el.offsetHeight;
  const libre = vista.clientHeight - top - Math.max(100, resto + 20);
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
  if(plz.pose){ el.innerHTML = '<button class="gbtn gbtn-ancho" onclick="plazaSoltarPose()">⬇️ Bajarme</button><div class="plz-accion-sub">O tocá un lugar para irte caminando.</div>'; return; }
  el.innerHTML = e
    ? `<button class="gbtn gbtn-ancho" onclick="plazaEntrar('${e.id}')">${e.emoji} ${e.verbo ? e.verbo : 'Entrar: ' + e.nombre}</button><div class="plz-accion-sub">${e.puesto && typeof feriaSubtitulo === 'function' ? feriaSubtitulo(e.id) : e.sub}</div>`
    : '<div class="plz-accion-sub">Tocá un lugar para caminar. Acercate a una puerta o a una atracción del parque.</div>';
}

function plazaEntrar(id){
  const a = PLZ_ATRACCIONES.find(x => x.id === id);
  if(a){ plazaAtraccion(a); return; }
  const e = PLZ_EDIFICIOS.find(x => x.id === id);
  if(e) e.ir();
}

// Hamacas, cama elástica, bancos y fuente. Las poses las ven todos los de la sala.
function plazaOcupada(slot, pose){
  const cerca = (x, y) => Math.abs(x - slot.x) < 8 && Math.abs(y - slot.y) < 8;
  return Object.keys(plz.otros).some(k => plz.otros[k].p === pose && cerca(plz.otros[k].tx, plz.otros[k].ty)) || plz.bots.some(b => b.pose === pose && cerca(b.x, b.y));
}
function plazaAtraccion(a){
  if(a.deseo){ plazaDeseo(); return; }
  if(a.fn){ if(typeof window[a.fn] === 'function') window[a.fn](); return; }
  let pos = { x: plz.yo.x, y: plz.yo.y };
  if(a.slots){
    const libres = a.slots.filter(s => !plazaOcupada(s, a.pose)).sort((s, t) => Math.hypot(s.x - plz.yo.x, s.y - plz.yo.y) - Math.hypot(t.x - plz.yo.x, t.y - plz.yo.y));
    if(!libres.length){ if(typeof mostrarToast === 'function') mostrarToast('Está todo ocupado, esperá un ratito'); return; }
    pos = libres[0];
  }
  plz.yo.x = pos.x; plz.yo.y = pos.y; plz.yo.dir = 1; plz.obj = null;
  plz.pose = { p: a.pose, id: a.id };
  plz.ultimaActividad = performance.now();
  plazaEnviar(false);
  plazaRenderAccion();
  if(typeof reproducirTono === 'function') reproducirTono('tick');
}
function plazaSoltarPose(){
  if(!plz.pose) return;
  plz.pose = null;
  plz.yo.y += 8;
  plazaEnviar(false);
  plz.puerta = null; // se vuelve a calcular
  plazaRenderAccion();
}
function plazaDeseo(){
  const ahora = performance.now();
  if(plz.deseoHasta && ahora < plz.deseoHasta){ if(typeof mostrarToast === 'function') mostrarToast('Esperá un momento para pedir otro deseo'); return; }
  plz.deseoHasta = ahora + 8000;
  plz.burbuja = { texto: PLZ_DESEOS[Math.floor(Math.random() * PLZ_DESEOS.length)], hasta: ahora + 6000 };
  plz.monedaFuente = ahora;
  plz.ultimaActividad = ahora;
  if(typeof reproducirTono === 'function') reproducirTono('bonus');
}

// ---- Entrada táctil: tocar o arrastrar = caminar hacia ahí ----

function plazaEntrada(){
  const c = plz.canvas;
  let apretado = false;
  const aMundo = ev => {
    const r = c.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * PLZ.VW / r.width + plz.cam.x, y: (ev.clientY - r.top) * PLZ.VH / r.height + plz.cam.y };
  };
  c.addEventListener('pointerdown', ev => { ev.preventDefault(); apretado = true; try { c.setPointerCapture(ev.pointerId); } catch(e){} plz.obj = aMundo(ev); if(plz.buscado) plz.buscado.sigue = false; });
  c.addEventListener('pointermove', ev => { if(apretado) plz.obj = aMundo(ev); });
  const soltar = () => { apretado = false; };
  c.addEventListener('pointerup', soltar);
  c.addEventListener('pointercancel', soltar);
}

const plazaTeclas = {};
document.addEventListener('keydown', e => { if(plz.activo && e.key.startsWith('Arrow')){ plazaTeclas[e.key] = true; plz.ultimaActividad = performance.now(); if(plz.buscado) plz.buscado.sigue = false; e.preventDefault(); } });
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
  if(plz.pose){
    if(vx || vy || plz.obj) plazaSoltarPose(); else { plz.caminando = false; return; }
  }
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
  if(plz.pose) return null;
  for(const e of PLZ_EDIFICIOS){
    const z = plazaZonaPuerta(e);
    if(yo.x > z.x && yo.x < z.x + z.w && yo.y > z.y && yo.y < z.y + z.h) return e;
  }
  for(const a of PLZ_ATRACCIONES){
    const z = a.zona;
    if(a.dentro ? a.dentro(yo.x, yo.y) : (yo.x > z.x && yo.x < z.x + z.w && yo.y > z.y && yo.y < z.y + z.h)) return a;
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
  plazaMoverBots(dt);
  if(typeof microControlarInactividad === 'function') microControlarInactividad(ahora);
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
  // Calle de abajo, donde estaciona el micro
  ctx.fillStyle = '#C9CED8'; ctx.fillRect(0, PLZ_SUELO, PLZ.W, 14);
  ctx.fillStyle = '#7C8493'; ctx.fillRect(0, PLZ_SUELO + 14, PLZ.W, PLZ.H - PLZ_SUELO - 14);
  ctx.fillStyle = 'rgba(255,216,77,.9)';
  for(let x = 6; x < PLZ.W; x += 56) ctx.fillRect(x, PLZ_SUELO + 78, 30, 4);
  // Plaza de baldosas
  ctx.fillStyle = '#E7DCC5'; arcRR(ctx, 10, 10, PLZ.W - 20, PLZ_SUELO - 20, 22); ctx.fill();
  for(let y = 0; y < PLZ_SUELO - 10; y += 40){
    for(let x = 0; x < PLZ.W; x += 40){
      if(((x + y) / 40) % 2 === 0){ ctx.fillStyle = 'rgba(160,130,90,.10)'; ctx.fillRect(x, y, 40, 40); }
    }
  }
  // Césped del parque del centro
  ctx.fillStyle = 'rgba(127,199,122,.6)'; arcRR(ctx, 26, 196, PLZ.W - 52, 316, 44); ctx.fill();
  // Caminos principales
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.fillRect(PLZ.W / 2 - 34, 150, 68, PLZ_SUELO - 190);
  for(let i = 0; i < 3; i++){ // pasillos entre columnas de edificios
    const gx = PLZ_COL[i] + 116;
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(gx, 150, 48, PLZ_SUELO - 190);
    ctx.fillStyle = 'rgba(160,130,90,.25)'; for(let y = 160; y < PLZ_SUELO - 50; y += 26) ctx.fillRect(gx + 23, y, 2, 12);
  }
}

// Parque: hamacas, cama elástica y bancos (las poses de la gente se dibujan con cada personaje).
function plazaPosOcupadas(pose){
  const l = [];
  Object.keys(plz.otros).forEach(k => { if(plz.otros[k].p === pose) l.push({ x: plz.otros[k].tx, y: plz.otros[k].ty }); });
  plz.bots.forEach(b => { if(b.pose === pose) l.push({ x: b.x, y: b.y }); });
  if(plz.pose && plz.pose.p === pose) l.push({ x: plz.yo.x, y: plz.yo.y });
  return l;
}
function plazaDibujarParque(ctx){
  const ocupa = (l, s) => l.some(o => Math.abs(o.x - s.x) < 8 && Math.abs(o.y - s.y) < 8);
  // Hamacas: estructura con tres asientos
  const barra = 244, ham = PLZ_ATRACCIONES[0];
  ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  [[50, 40, 62], [198, 186, 210]].forEach(([ax, b1, b2]) => { ctx.moveTo(b1, 336); ctx.lineTo(ax, barra); ctx.lineTo(b2, 336); });
  ctx.moveTo(50, barra); ctx.lineTo(198, barra); ctx.stroke();
  const ocH = plazaPosOcupadas(1);
  ham.slots.forEach((s, i) => {
    if(ocupa(ocH, s)) return;
    const th = Math.sin(plz.t * 1.2 + i) * 0.12, L = 62, sx = s.x + L * Math.sin(th), sy = barra + L * Math.cos(th);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x - 9, barra); ctx.lineTo(sx - 9, sy); ctx.moveTo(s.x + 9, barra); ctx.lineTo(sx + 9, sy); ctx.stroke();
    ctx.fillStyle = '#E5586E'; arcRR(ctx, sx - 13, sy - 3, 26, 7, 3); ctx.fill();
  });
  // Cama elástica
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(500, 340, 66, 24, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2B3A67'; ctx.beginPath(); ctx.ellipse(500, 328, 60, 25, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(500, 328, 60, 25, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(500, 328, 34, 12, 0, 0, 7); ctx.fill();
  arcLogo(ctx, 500, 326, 20, '#fff');
  // Bancos
  [[96, 452], [506, 452]].forEach(([x, y]) => {
    ctx.fillStyle = 'rgba(0,0,0,.14)'; arcRR(ctx, x - 20, y + 4, 86, 10, 5); ctx.fill();
    ctx.fillStyle = '#8A5A2B'; arcRR(ctx, x - 22, y - 26, 82, 10, 4); ctx.fill();
    ctx.fillStyle = '#B8793B'; arcRR(ctx, x - 22, y - 12, 82, 12, 4); ctx.fill();
    ctx.fillStyle = '#5A3A22'; ctx.fillRect(x - 18, y, 5, 10); ctx.fillRect(x + 49, y, 5, 10);
  });
  if(typeof cartitasDibujarBuzon === 'function') cartitasDibujarBuzon(ctx);
  // Flores
  [[240, 410], [400, 410], [215, 250], [430, 240], [270, 485], [372, 485]].forEach(([x, y], i) => arcEmoji(ctx, i % 2 ? '🌼' : '🌷', x, y, 20));
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
  for(let k = 0; k < 10; k++){ // gotitas que suben y caen
    const a = k * Math.PI / 5 + plz.t * 0.5, h = (plz.t * 1.1 + k * 0.31) % 1;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * (8 + h * 28), f.y - 10 - Math.sin(h * Math.PI) * 30 + Math.sin(a) * 5, 1 + 2 * (1 - h), 0, 7); ctx.fill();
  }
  if(plz.monedaFuente && performance.now() - plz.monedaFuente < 1500){ // la moneda cae al agua
    const u = (performance.now() - plz.monedaFuente) / 1500;
    arcEmoji(ctx, '🪙', f.x + 30 - u * 30, f.y - 60 + Math.sin(u * Math.PI) * -30 + u * 60, 16);
    ctx.strokeStyle = 'rgba(255,255,255,' + (1 - u) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, 10 + u * 30, 5 + u * 14, 0, 0, 7); ctx.stroke();
  }
}

// Toldo a rayas y cartel con la gente que espera, para los puestos de la feria.
function plazaDibujarToldo(ctx, e){
  const alto = 16;
  for(let i = 0; i < 10; i++){
    ctx.fillStyle = i % 2 ? '#fff' : 'rgba(0,0,0,.28)';
    ctx.fillRect(e.x + i * (e.w / 10), e.y + e.h - alto - 40, e.w / 10 + 0.5, alto);
    ctx.beginPath(); ctx.arc(e.x + (i + 0.5) * (e.w / 10), e.y + e.h - 40, e.w / 20, 0, Math.PI); ctx.fillStyle = i % 2 ? '#fff' : 'rgba(0,0,0,.28)'; ctx.fill();
  }
  const ins = typeof feriaInsignia === 'function' ? feriaInsignia(e.id) : null;
  if(ins){
    ctx.font = '800 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(ins).width + 16;
    ctx.fillStyle = '#0F2A4D'; arcRR(ctx, e.x + e.w - w - 6, e.y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(ins, e.x + e.w - w / 2 - 6, e.y + 0.5);
  }
}

function plazaDibujarEdificio(ctx, e){
  if(e.micro && typeof plazaDibujarMicro === 'function'){ plazaDibujarMicro(ctx, e); return; }
  const abajo = e.lado === 'abajo'; // la puerta mira hacia abajo y el cartel va arriba (o al revés)
  const bandaY = abajo ? e.y : e.y + e.h - 26;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; arcRR(ctx, e.x + 4, e.y + 8, e.w, e.h, 12); ctx.fill();
  ctx.fillStyle = e.color; arcRR(ctx, e.x, e.y, e.w, e.h, 12); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; arcRR(ctx, e.x, bandaY, e.w, 26, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 14px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let tam = 14; while(tam > 9 && ctx.measureText(e.nombre).width > e.w - 12){ tam--; ctx.font = '800 ' + tam + 'px Poppins, sans-serif'; }
  ctx.fillText(e.nombre, e.x + e.w / 2, bandaY + 13.5);
  const centroY = abajo ? e.y + e.h / 2 + 8 : e.y + e.h / 2 - 6;
  if(!e.puesto) arcEmoji(ctx, e.emoji, e.x + e.w / 2, centroY, 34);
  [e.x + 24, e.x + e.w - 24].forEach(vx => { ctx.fillStyle = 'rgba(255,255,255,.55)'; arcRR(ctx, vx - 14, abajo ? e.y + 40 : e.y + 44, 28, 26, 5); ctx.fill(); });
  if(e.puesto){
    plazaDibujarToldo(ctx, e);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(e.x + e.w / 2, e.y + 42, 17, 0, 7); ctx.fill();
    arcEmoji(ctx, e.emoji, e.x + e.w / 2, e.y + 43, 24);
  }
  // Puerta y baldosa de entrada
  const z = plazaZonaPuerta(e);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; arcRR(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
  const px = e.x + e.w / 2 - 15, py = abajo ? e.y + e.h - 36 : e.y;
  ctx.fillStyle = '#5A3A22'; arcRR(ctx, px, py, 30, 36, 6); ctx.fill();
  ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(px + 24, py + 20, 2.4, 0, 7); ctx.fill();
}

function plazaDibujarPersonaje(ctx, x, y, puesto, nombre, dir, caminando, burbuja, cumple, pose, fase){
  fase = fase || 0;
  let dx = 0, alto = 0;
  if(pose === 1){ // en la hamaca: péndulo
    const th = Math.sin(plz.t * 2.4 + fase) * 0.5, L = 62;
    dx = L * Math.sin(th); alto = 76 - L * Math.cos(th);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 9, y - 78); ctx.lineTo(x + dx - 9, y - alto - 4); ctx.moveTo(x + 9, y - 78); ctx.lineTo(x + dx + 9, y - alto - 4); ctx.stroke();
    ctx.fillStyle = '#E5586E'; arcRR(ctx, x + dx - 13, y - alto - 4, 26, 7, 3); ctx.fill();
  } else if(pose === 2){ alto = Math.abs(Math.sin(plz.t * 5 + fase)) * 50; }
  const bob = pose ? 0 : (caminando ? Math.abs(Math.sin(plz.t * 11)) * 3 : 0);
  const X = x + dx, Y = y - alto - bob + (pose === 3 ? 6 : 0);
  const sombra = 1 - Math.min(0.5, alto / 100);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(pose === 1 ? x : X, y, 13 * sombra, 5 * sombra, 0, 0, 7); ctx.fill();
  const img = (typeof avatarSprite === 'function') ? avatarSprite(puesto) : null;
  const w = 46, h = 55;
  if(img && img.complete && img.naturalWidth){
    ctx.save();
    ctx.translate(X, Y);
    if(dir < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h + 2, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = '#F5C29B'; ctx.beginPath(); ctx.arc(X, Y - 30, 14, 0, 7); ctx.fill();
  }
  if(pose === 3){ ctx.fillStyle = '#B8793B'; arcRR(ctx, X - 16, Y - 6, 32, 6, 3); ctx.fill(); }
  if(cumple) arcEmoji(ctx, '🎂', X + 17, Y - h + 8, 18);
  // Nombre
  ctx.font = '700 10px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(nombre).width + 10;
  const ny = pose === 2 ? y : Y;
  ctx.fillStyle = 'rgba(15,42,77,.72)'; arcRR(ctx, X - tw / 2, ny + 7, tw, 15, 7.5); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(nombre, X, ny + 14.5);
  if(burbuja){
    ctx.font = '700 11px Poppins, sans-serif';
    const bw = ctx.measureText(burbuja).width + 16;
    const by = Y - h - 24;
    ctx.fillStyle = '#fff'; arcRR(ctx, X - bw / 2, by, bw, 22, 11); ctx.fill();
    ctx.beginPath(); ctx.moveTo(X - 5, by + 21); ctx.lineTo(X, by + 28); ctx.lineTo(X + 5, by + 21); ctx.fill();
    ctx.fillStyle = '#0F2A4D'; ctx.fillText(burbuja, X, by + 11.5);
  }
}

function plazaDibujar(ctx){
  ctx.save();
  ctx.fillStyle = '#7FC77A'; ctx.fillRect(0, 0, PLZ.VW, PLZ.VH);
  ctx.translate(-Math.round(plz.cam.x), -Math.round(plz.cam.y));
  plazaDibujarFondo(ctx);
  // Adornos en los bordes
  [[26, 200], [614, 200], [26, 400], [614, 400], [26, 470], [614, 470], [26, 850], [614, 850]].forEach(([x, y], i) => arcEmoji(ctx, i % 3 === 0 ? '🌳' : i % 3 === 1 ? '🌷' : '🌲', x, y, 28));
  plazaDibujarParque(ctx);
  plazaDibujarFuente(ctx);
  PLZ_EDIFICIOS.forEach(e => plazaDibujarEdificio(ctx, e));

  const ahoraMs = performance.now(), ahoraServidor = plazaAhora();
  const personajes = Object.keys(plz.otros).map(a => ({ y: plz.otros[a].y, o: plz.otros[a] }));
  plz.bots.forEach(b => personajes.push({ y: b.y, bot: b }));
  personajes.push({ y: plz.yo.y, yo: true });
  personajes.sort((a, b) => a.y - b.y).forEach(p => {
    if(p.yo){
      const burbuja = plz.burbuja && ahoraMs < plz.burbuja.hasta ? plz.burbuja.texto : null;
      plazaDibujarPersonaje(ctx, plz.yo.x, plz.yo.y, plazaCompacto(), 'Vos', plz.yo.dir, plz.caminando, burbuja, typeof feria !== 'undefined' && feria.cumple, plz.pose ? plz.pose.p : 0, plz.pose ? (parseInt(miAsiento, 10) || 0) % 7 : 0);
    } else if(p.bot){
      const b = p.bot;
      plazaDibujarPersonaje(ctx, b.x, b.y, b.a, b.n, b.dir, b.caminando, b.m != null && ahoraMs < b.hasta ? PLZ_FRASES[b.m] : null, false, b.pose || 0, b.fase || 0);
    } else {
      const o = p.o;
      const dice = o.m != null && ahoraServidor - o.mt < 4500 ? PLZ_FRASES[o.m] : null;
      const caminando = Math.hypot(o.tx - o.x, o.ty - o.y) > 3;
      plazaDibujarPersonaje(ctx, o.x, o.y, o.avatar, o.nombre.slice(0, 10), o.dir, caminando, dice, o.cu, o.p, o.fase);
    }
  });

  if(typeof microDibujarBuscado === 'function') microDibujarBuscado(ctx, ahoraMs);
  // Marca del destino
  if(plz.obj){
    ctx.strokeStyle = 'rgba(15,42,77,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(plz.obj.x, plz.obj.y, 6 + Math.sin(plz.t * 8) * 1.5, 0, 7); ctx.stroke();
  }
  ctx.restore();
  if(typeof microDibujarFlechaBorde === 'function') microDibujarFlechaBorde(ctx);
}

// Tarjeta de Inicio: lleva a la plaza.
function plazaTarjetaHomeHTML(){
  return `<div class="av-home plz-home" onclick="showView('plaza')"><div class="plz-home-img">🏘️</div><div class="av-home-txt"><h3>${plazaNombre()}</h3><p>Encontrate con los del viaje y entrá a los juegos</p></div><span class="av-home-flecha">›</span></div>`;
}
