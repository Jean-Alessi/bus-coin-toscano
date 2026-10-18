// Las 5 paradas del micro: cada una es un lugar distinto del mundo (un "sector") con su
// propio mapa, y cada sector se divide en salas de hasta 12 personas (ver plaza.js).
//   🛍️ Shopping   comercios, boutique, premios, agencia y sorteo de remeras
//   🎮 Arcade     video juegos, desafíos para jugar solo y ranking
//   🃏 Mesas      cartas (y póker si el organizador lo habilita)
//   📣 Eventos    bingo, trivia en vivo y juegos en grupo
//   🏘️ Plaza      parque, farmacia, coordinador, citas, buzón, radio y fotos
// Cada sector devuelve sus edificios (puertas a pantallas o puestos de la feria) y sus
// atracciones (cosas que se usan parándose cerca), más cómo se dibuja el fondo.

const PLZ_ORDEN_SECTORES = ['shopping', 'arcade', 'mesas', 'eventos', 'plaza'];

function plzItem(id, nombre, emoji, color, sub, ir, extra){
  return Object.assign({ id, nombre, emoji, color, sub, ir, w: 116, h: 120, lado: 'abajo' }, extra || {});
}
const plzPuesto = (id, nombre, emoji, color, sub) => plzItem(id, nombre, emoji, color, sub, () => feriaIntentar(id), { puesto: true, h: 100 });
const plzVista = (id, nombre, emoji, color, sub, vista) => plzItem(id, nombre, emoji, color, sub, () => showView(vista), { compacto: true, h: 84 });
function plzGrilla(items, y0, pitch){
  items.forEach((e, i) => { e.x = PLZ_COL[i % 4]; e.y = y0 + Math.floor(i / 4) * pitch; });
  return items;
}
function plzParada(s){
  return { id: 'parada', nombre: 'Parada del micro', emoji: '🚏', verbo: 'Subir al micro', sub: 'Elegí a qué parada ir', fn: 'microAbrirParadas', zona: { x: s.parada.x - 44, y: s.parada.y - 28, w: 88, h: 64 } };
}

const PLZ_SECTORES = {
  shopping: {
    id: 'shopping', nombre: 'Shopping Busmac', corto: 'Shopping', emoji: '🛍️', color: '#E5586E',
    desc: 'Comercios con descuentos, boutique, premios y el sorteo de remeras',
    H: 600, fuera: '#B98BAE', suelo: '#F7E9F3', baldosa: 'rgba(229,88,110,.10)', borde: '#E5586E',
    parada: { x: 320, y: 528 }, spawn: { x: 320, y: 448 }, libre: { x0: 40, x1: 600, y0: 190, y1: 290 }, decor: 'shopping',
    armar(){
      const arriba = plzGrilla([
        plzItem('comercios', 'Comercios', '🏪', '#2FB5B5', 'Descuentos del destino', () => showView('comercios')),
        plzItem('boutique', 'Boutique', '👕', '#7E57FF', 'Vestí a tu personaje', () => showView('avatar')),
        plzItem('premios', 'Premios', '🎁', '#FF7A1A', 'Lo que podés ganar', () => showView('tienda')),
        plzPuesto('agencia', 'Agencia', '✈️', '#3A86FF', 'Promos y descuentos'),
      ], 24, 0);
      const sorteo = plzPuesto('sorteo', 'Sorteo', '🎟️', '#9D4EDD', 'Retirá tu número para el sorteo');
      sorteo.x = PLZ_COL[1]; sorteo.y = 300;
      const tienda = plzItem('tienda', 'Tienda Busmac', '👕', '#FF7A1A', 'Remeras Busmac: se sortean entre los pasajeros', () => feriaTienda());
      tienda.x = PLZ_COL[2]; tienda.y = 300;
      const foto = plzItem('foto', 'Fotomatón', '📸', '#4361EE', 'Foto grupal con marco', () => feriaFotoGrupal());
      foto.x = PLZ_COL[3]; foto.y = 300;
      return { edificios: arriba.concat([sorteo, tienda, foto]), atracciones: [plzParada(this)] };
    },
  },
  arcade: {
    id: 'arcade', nombre: 'Sala de juegos', corto: 'Arcade', emoji: '🎮', color: '#7E57FF',
    desc: '11 video juegos, desafíos para jugar solo y el ranking',
    H: 650, fuera: '#12142B', suelo: '#2B2F55', baldosa: 'rgba(120,140,255,.13)', borde: '#7E57FF',
    parada: { x: 320, y: 592 }, spawn: { x: 320, y: 512 }, libre: { x0: 40, x1: 600, y0: 180, y1: 270 }, decor: null,
    armar(){
      const v = (id, nombre, emoji, color, sub, vista) => plzVista(id, nombre, emoji, color, sub, vista);
      const items = plzGrilla([
        v('corredor', 'Corredor', '🚌', '#E5586E', 'Esquivá obstáculos y juntá monedas', 'corredor'),
        v('vuelo', 'Vuelo', '✈️', '#3A86FF', 'Pasá entre las torres', 'vuelo'),
        v('serpiente', 'Serpiente', '🐍', '#3B9B5A', 'Comé medialunas sin chocarte', 'serpiente'),
        v('tetris', 'Tetris', '🧩', '#9D4EDD', 'Completá líneas', 'tetris'),
        v('ladrillos', 'Ladrillos', '🧱', '#D62839', 'Rebotá la pelota y rompé todo', 'ladrillos'),
        v('parking', 'Estacionar', '🅿️', '#2A9D8F', 'Entrá derecho al lugar libre', 'parking'),
        v('laberinto', 'Laberinto', '🟡', '#E6A817', 'Juntá todo y escapá de los camiones', 'laberinto'),
        v('tanque', 'Garage', '🛡️', '#577590', 'Protegé el garage de Busmac', 'tanque'),
        v('pinball', 'Pinball', '🎰', '#FF6B9D', 'Paletas, rebotadores y puntos', 'pinball'),
        v('bombas', 'Bombas', '💣', '#FF7A1A', 'Abrite paso y sacá a los enemigos', 'bombas'),
        v('plataformas', 'Aventura', '🏃', '#4361EE', 'Corré, saltá y juntá las B', 'plataformas'),
        plzItem('mente', 'Mente', '🧠', '#2FB5B5', 'Desafiá tu mente: juegos para vos solo', () => { if(typeof juegosAbiertos !== 'undefined') juegosAbiertos.solo = true; showView('juegos'); }, { compacto: true, h: 84 }),
        plzItem('ranking', 'Ranking', '🏆', '#E6A817', 'Mirá cómo vas', () => showView('ranking'), { compacto: true, h: 84 }),
      ], 24, 130);
      return { edificios: items, atracciones: [plzParada(this)] };
    },
  },
  mesas: {
    id: 'mesas', nombre: 'Salón de mesas', corto: 'Mesas', emoji: '🃏', color: '#3B9B5A',
    desc: 'Truco, Chinchón, Escoba y póker (si el organizador lo habilita)',
    H: 520, fuera: '#1E4D31', suelo: '#2F7D4F', baldosa: 'rgba(255,255,255,.07)', borde: '#E6A817',
    parada: { x: 320, y: 450 }, spawn: { x: 320, y: 372 }, libre: { x0: 40, x1: 600, y0: 180, y1: 270 }, decor: null,
    armar(){
      // Cada juego es una mesa redonda con sillas: se ve cuántas esperan jugadores (ver mesas.js).
      const v = (id, nombre, emoji, color, sub, vista, juego) => plzItem(id, nombre, emoji, color, sub, () => showView(vista), { mesa: true, juego, insignia: juego ? () => mesasInsignia(juego) : null, subDin: juego ? () => mesasSubtitulo(juego, sub) : null });
      const lista = [
        v('truco', 'Truco', '🃏', '#D62839', 'De a 2, 4 o 6, con envido', 'truco', 'truco'),
        v('chinchon', 'Chinchón', '🂡', '#3A86FF', 'De 2 a 4: grupos y escaleras', 'chinchon', 'chinchon'),
        v('escoba', 'Escoba de 15', '🧹', '#E6A817', 'De a 2: sumá 15', 'escoba', 'escoba'),
        v('buscolor', 'BusColor', '🎨', '#9D4EDD', 'De 2 a 6: quedate sin cartas', 'buscolor', 'buscolor'),
      ];
      plzGrilla(lista, 24, 0);
      if(typeof pokerHabilitado !== 'undefined' && pokerHabilitado){
        const poker = plzGrilla([
          v('videopoker', 'Póker de video', '♠️', '#2A9D8F', 'Armá la mejor mano', 'videopoker'),
          v('texas', 'Texas Hold\'em', '🤠', '#577590', 'De 2 a 6 en la mesa', 'texas', 'texas'),
        ], 200, 0);
        return { edificios: lista.concat(poker), atracciones: [plzParada(this)] };
      }
      return { edificios: lista, atracciones: [plzParada(this)] };
    },
  },
  eventos: {
    id: 'eventos', nombre: 'Salón de eventos', corto: 'Eventos', emoji: '📣', color: '#D62839',
    desc: 'Bingo, trivia en vivo, Tutti Frutti y juegos para todo el grupo',
    H: 520, fuera: '#4A2B1E', suelo: '#D9B48A', baldosa: 'rgba(0,0,0,.07)', borde: '#D62839',
    parada: { x: 320, y: 450 }, spawn: { x: 320, y: 372 }, libre: { x0: 40, x1: 600, y0: 180, y1: 270 }, decor: 'eventos',
    armar(){
      const v = (id, nombre, emoji, color, sub, vista) => plzItem(id, nombre, emoji, color, sub, () => showView(vista));
      const fila1 = plzGrilla([
        v('bingo', 'Bingo', '🎱', '#D62839', 'Números del 00 al 99', 'bingo'),
        v('triviavivo', 'Trivia en vivo', '🧠', '#3A86FF', 'Todos contra todos', 'triviavivo'),
        v('tutifruti', 'Tutti Frutti', '🔤', '#3B9B5A', 'Una letra, todo el viaje', 'tutifruti'),
        v('impostor', 'El Impostor', '🕵️', '#577590', 'Para tu grupo', 'impostor'),
      ], 24, 0);
      const fila2 = plzGrilla([
        v('cuento', 'Cadáver Exquisito', '📖', '#9D4EDD', 'Una historia entre todos', 'cuento'),
        v('dibujar', 'Dibujar', '🖍️', '#FF7A1A', 'Uno dibuja, el resto adivina', 'dibujar'),
      ], 200, 0);
      return { edificios: fila1.concat(fila2), atracciones: [plzParada(this)] };
    },
  },
  boliche: {
    id: 'boliche', nombre: 'Confitería bailable', corto: 'Boliche', emoji: '🕺', color: '#7E57FF', interior: true, sinPasillos: true, maxSala: 12,
    desc: 'Música, luces, bola de espejos y barra',
    H: 620, fuera: '#07060f', suelo: '#15102b', baldosa: 'rgba(255,255,255,.025)', borde: '#FF4DDB',
    parada: null, spawn: { x: 320, y: 506 }, libre: { x0: 60, x1: 580, y0: 240, y1: 470 }, decor: 'boliche',
    armar(){
      const atracciones = [
        { id: 'dj', nombre: 'Cabina del DJ', emoji: '🎧', verbo: 'Cambiar la música', sub: 'Elegí el estilo para toda la sala', fn: 'bolicheAbrirDj', subDin: () => 'Suena: ' + bolicheEstilo().emoji + ' ' + bolicheEstilo().nombre + ' · elegí el estilo', zona: { x: 250, y: 118, w: 140, h: 46 } },
        { id: 'barra', nombre: 'Barra', emoji: '🍹', verbo: 'Pedir algo en la barra', sub: 'Jugos, limonada y más (sin alcohol)', fn: 'bolicheAbrirBarra', zona: { x: 450, y: 138, w: 160, h: 46 } },
        { id: 'pista', nombre: 'Pista de baile', emoji: '🕺', verbo: 'Bailar', sub: '¡A mover el cuerpo!', pose: 4, subDin: () => '♪ ' + bolicheEstilo().nombre + ' · tocá un lugar para dejar de bailar', zona: { x: 150, y: 224, w: 336, h: 252 } },
        { id: 'sillon1', nombre: 'Sillón', emoji: '🛋️', verbo: 'Sentarte', sub: 'Descansá un rato', pose: 3, zona: { x: 12, y: 262, w: 100, h: 54 }, slots: [{ x: 38, y: 250 }, { x: 62, y: 250 }] },
        { id: 'sillon2', nombre: 'Sillón', emoji: '🛋️', verbo: 'Sentarte', sub: 'Descansá un rato', pose: 3, zona: { x: 526, y: 352, w: 100, h: 54 }, slots: [{ x: 582, y: 340 }, { x: 606, y: 340 }] },
        { id: 'salir', nombre: 'Salida', emoji: '🚪', verbo: 'Salir a la plaza', sub: 'Volvés a la plaza', fn: 'bolicheSalir', zona: { x: 260, y: 548, w: 120, h: 60 } },
      ];
      return { edificios: [], atracciones, bloques: [{ x: 226, y: 20, w: 188, h: 92 }, { x: 436, y: 20, w: 188, h: 116 }] };
    },
  },
  plaza: {
    id: 'plaza', nombre: 'Plaza Busmac', corto: 'Plaza', emoji: '🏘️', color: '#2A9D8F',
    desc: 'Parque, farmacia, coordinador, lugar de citas, buzón, radio y fotos',
    H: 740, fuera: '#7FC77A', suelo: '#E7DCC5', baldosa: 'rgba(160,130,90,.10)', borde: null, parque: true,
    fuente: { x: 320, y: 340, r: 44 },
    parada: { x: 320, y: 528 }, spawn: { x: 320, y: 448 }, libre: { x0: 50, x1: 590, y0: 190, y1: 500 }, decor: 'plaza',
    armar(){
      const arriba = plzGrilla([
        plzPuesto('kiosco', 'Kiosco', '🍬', '#F28482', 'Pedí una golosina de cortesía'),
        plzPuesto('radio', 'Radio', '📻', '#FF9F1C', 'Votá la música del micro'),
        plzPuesto('coordinador', 'Coordinador', '🧑‍✈️', '#2A9D8F', 'Pedí algo para el viaje'),
        plzPuesto('farmacia', 'Farmacia', '💊', '#D62839', '¿Te sentís mal? Avisá acá'),
      ], 24, 0);
      const abajo = plzGrilla([
        plzPuesto('buzon', 'Buzón', '📮', '#E76F51', 'Contanos cómo viajás'),
        plzPuesto('cartelera', 'Cartelera', '📋', '#577590', 'Horarios y actividades'),
        plzItem('citas', 'Lugar de citas', '❤️', '#FF4D6D', 'Invitaciones para mate, juegos o conocerse', () => cartitasAbrir()),
        (typeof mundo === 'undefined' || mundo.bolicheOn !== false) ? plzItem('boliche', 'Bailable', '🕺', '#7E57FF', 'Confitería bailable: música, luces y barra', () => bolicheEntrar(), { neon: true, insignia: () => null }) : null,
      ].filter(Boolean), 560, 0);
      const parque = [
        { id: 'hamacas', nombre: 'Hamacas', emoji: '🛝', verbo: 'Hamacarte', sub: 'Se hamacan hasta 3 a la vez', pose: 1, zona: { x: 36, y: 290, w: 178, h: 80 }, slots: [{ x: 78, y: 322 }, { x: 124, y: 322 }, { x: 170, y: 322 }] },
        { id: 'trampolin', nombre: 'Cama elástica', emoji: '🤸', verbo: 'Saltar', sub: '¡Saltá todo lo que quieras!', pose: 2, zona: { x: 438, y: 296, w: 124, h: 70 } },
        { id: 'banco1', nombre: 'Banco', emoji: '🪑', verbo: 'Sentarte', sub: 'Descansá y mirá la plaza', pose: 3, zona: { x: 60, y: 420, w: 110, h: 60 }, slots: [{ x: 96, y: 452 }, { x: 134, y: 452 }] },
        { id: 'banco2', nombre: 'Banco', emoji: '🪑', verbo: 'Sentarte', sub: 'Descansá y mirá la plaza', pose: 3, zona: { x: 470, y: 420, w: 110, h: 60 }, slots: [{ x: 506, y: 452 }, { x: 544, y: 452 }] },
        { id: 'fuente', nombre: 'Fuente de los deseos', emoji: '🪙', verbo: 'Pedir un deseo', sub: 'Tirá una moneda (gratis) y mirá qué sale', deseo: true, dentro: (x, y) => { const d = Math.hypot(x - 320, y - 344); return d > 36 && d < 78; } },
      ];
      return { edificios: arriba.concat(abajo), atracciones: parque.concat([plzParada(this)]) };
    },
  },
};

// ---- Decorado propio de cada sector (se dibuja arriba del piso y abajo de los edificios) ----

const PLZ_DECOR = {
  shopping(ctx){
    [[60, 235], [580, 265], [300, 250]].forEach(([x, y], i) => arcEmoji(ctx, '🎈', x + Math.sin(plz.t * 0.7 + i) * 10, y + Math.sin(plz.t * 0.5 + i * 2) * 8, 26));
  },
  arcade(ctx){
    ctx.strokeStyle = 'rgba(120,255,255,' + (0.35 + 0.25 * Math.sin(plz.t * 3)).toFixed(2) + ')'; ctx.lineWidth = 3; arcRR(ctx, 18, 18, PLZ.W - 36, PLZ.H - 36, 18); ctx.stroke();
    for(let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(120,140,255,' + (0.10 + 0.08 * Math.sin(plz.t * 2 + i)).toFixed(2) + ')'; ctx.fillRect(PLZ_COL[i] + 116 + 20, 100, 8, PLZ.H - 140); }
  },
  eventos(ctx){
    const sx = 470 + Math.sin(plz.t * 0.9) * 90; // reflectores que barren el salón
    ctx.fillStyle = 'rgba(255,240,150,.10)'; ctx.beginPath(); ctx.moveTo(sx, 12); ctx.lineTo(sx - 60, 330); ctx.lineTo(sx + 60, 330); ctx.closePath(); ctx.fill();
    const sx2 = 170 - Math.sin(plz.t * 0.7) * 80; ctx.fillStyle = 'rgba(180,220,255,.08)'; ctx.beginPath(); ctx.moveTo(sx2, 12); ctx.lineTo(sx2 - 60, 330); ctx.lineTo(sx2 + 60, 330); ctx.closePath(); ctx.fill();
    const x = 344, y = 200, w = 272, h = 120;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; arcRR(ctx, x + 4, y + 6, w, h, 12); ctx.fill();
    ctx.fillStyle = '#1B1B2F'; arcRR(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = 3; arcRR(ctx, x + 4, y + 4, w - 8, h - 8, 9); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD84D'; ctx.font = '800 14px Poppins, sans-serif'; ctx.fillText('🎱 PRÓXIMO BINGO', x + w / 2, y + 30);
    const b = typeof mundo !== 'undefined' ? mundo.bingo : '';
    ctx.fillStyle = '#fff'; ctx.font = '800 ' + (b && b.length > 8 ? 18 : 30) + 'px Poppins, sans-serif';
    ctx.fillText(b ? b : 'A confirmar', x + w / 2, y + 68);
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.font = '600 10px Poppins, sans-serif';
    ctx.fillText(b ? 'Pasá por el Bingo unos minutos antes' : 'El coordinador avisa acá', x + w / 2, y + 98);
  },
  plaza(ctx){
    ctx.fillStyle = 'rgba(127,199,122,.6)'; arcRR(ctx, 26, 196, PLZ.W - 52, 316, 44); ctx.fill();
    [[200, 235, 0], [440, 425, 2]].forEach(([x, y, f]) => arcEmoji(ctx, '🦋', x + Math.sin(plz.t * 0.8 + f) * 50, y + Math.cos(plz.t * 1.1 + f) * 28, 18));
  },
};

// Cartel y banco de la parada del micro (se ve en todos los sectores).
function plazaDibujarParada(ctx, p){
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 26, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#5b6673'; ctx.fillRect(p.x - 2, p.y - 40, 4, 44);
  ctx.fillStyle = '#0F2A4D'; arcRR(ctx, p.x - 24, p.y - 58, 48, 24, 7); ctx.fill();
  ctx.fillStyle = '#FFD84D'; ctx.font = '800 11px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🚌 MICRO', p.x, p.y - 45.5);
}
