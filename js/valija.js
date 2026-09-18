// Valija Express: 25 segundos para armar la valija con hasta 10 objetos de
// los 20 que se muestran (10 correctos para el destino + 10 señuelos). Cada
// correcto suma 2 monedas; los incorrectos no restan, pero ocupan uno de los
// 10 lugares disponibles, así que elegir mal sí "cuesta" sin hacer perder
// monedas a nadie. Armar la valija perfecta (10/10) da un bonus de +10.

// Banco compartido de objetos: de acá salen los señuelos incorrectos de
// cada destino (todo lo que no esté en la lista de "correctos" de ese
// destino puntual). Agregar destinos nuevos no requiere tocar esta lista.
const VALIJA_POOL = [
  'Campera', 'Guantes', 'Gorro', 'Bufanda', 'Botas', 'Medias gruesas', 'Pantalón térmico',
  'Protector solar', 'Documentos', 'Cargador', 'Malla', 'Ojotas', 'Lentes de sol', 'Gorra',
  'Toalla', 'Repelente', 'Botella de agua', 'Mochila', 'Linterna', 'Mapa', 'Celular',
  'Notebook', 'Camisa', 'Pantalón', 'Zapatos', 'Agenda', 'Billetera', 'Auriculares',
  'Carpa', 'Bolsa de dormir', 'Fósforos', 'Navaja multiuso', 'Abrigo', 'Comida',
  'Campera liviana', 'Zapatillas', 'Paraguas', 'Pantalón cómodo', 'Ropa elegante', 'Cámara',
  'Medicamentos personales', 'Perfume', 'Caña de pescar', 'Anzuelos', 'Navaja', 'Casco',
  'Bicicleta', 'Lentes', 'Bomba de aire', 'Kit de reparación', 'Piloto', 'Botas de lluvia',
  'Campera impermeable', 'Lentes de nieve', 'Ropa', 'Cargadores', 'Snacks', 'Juegos',
  'Brújula', 'Snorkel', 'Sombrilla', 'Salvavidas', 'Ventilador', 'Abanico', 'Short',
  'Pelota de playa', 'Sombrero de playa', 'Botas de nieve', 'Gorro de lana', 'Paraguas grande',
  'Esquíes', 'Traje de baño', 'Patines', 'Almohada de playa', 'Pelota de fútbol', 'Traje',
  'Corbata', 'Tacones', 'Sombrilla de playa', 'Pala', 'Guantes de trabajo', 'Casco de bicicleta',
  'Herramientas', 'Traje de buzo', 'Botas de esquí',
];

const VALIJA_DESTINOS = [
  { destino: 'Bariloche en invierno', consigna: 'Prepará tu valija para Bariloche en invierno.', emoji: '❄️',
    correctos: ['Campera', 'Guantes', 'Gorro', 'Bufanda', 'Botas', 'Medias gruesas', 'Pantalón térmico', 'Protector solar', 'Documentos', 'Cargador'] },
  { destino: 'Brasil en verano', consigna: 'Armá la valija para unos días de playa en Brasil.', emoji: '🏖️',
    correctos: ['Malla', 'Ojotas', 'Protector solar', 'Lentes de sol', 'Gorra', 'Toalla', 'Repelente', 'Documentos', 'Cargador', 'Botella de agua'] },
  { destino: 'Viaje a la montaña', consigna: 'Preparate para una travesía de montaña.', emoji: '⛰️',
    correctos: ['Botas', 'Campera', 'Mochila', 'Botella de agua', 'Linterna', 'Gorro', 'Protector solar', 'Mapa', 'Repelente', 'Celular'] },
  { destino: 'Día de playa', consigna: 'Armá todo para un día de playa.', emoji: '🏖️',
    correctos: ['Malla', 'Toalla', 'Protector solar', 'Lentes de sol', 'Gorra', 'Ojotas', 'Botella de agua', 'Sombrilla', 'Repelente', 'Celular'] },
  { destino: 'Viaje de negocios', consigna: 'Preparate para un viaje de negocios.', emoji: '💼',
    correctos: ['Notebook', 'Cargador', 'Documentos', 'Camisa', 'Pantalón', 'Zapatos', 'Celular', 'Agenda', 'Billetera', 'Auriculares'] },
  { destino: 'Fin de semana de camping', consigna: 'Armá la valija para acampar el fin de semana.', emoji: '🏕️',
    correctos: ['Carpa', 'Linterna', 'Bolsa de dormir', 'Mochila', 'Botella de agua', 'Repelente', 'Fósforos', 'Navaja multiuso', 'Abrigo', 'Comida'] },
  { destino: 'Viaje a Buenos Aires', consigna: 'Preparate para unos días en Buenos Aires.', emoji: '🏙️',
    correctos: ['Celular', 'Cargador', 'Documentos', 'Billetera', 'Campera liviana', 'Zapatillas', 'Paraguas', 'Auriculares', 'Mochila', 'Botella de agua'] },
  { destino: 'Viaje al campo', consigna: 'Armá la valija para unos días en el campo.', emoji: '🌾',
    correctos: ['Botas', 'Repelente', 'Protector solar', 'Gorra', 'Pantalón cómodo', 'Camisa', 'Botella de agua', 'Linterna', 'Mochila', 'Celular'] },
  { destino: 'Viaje en crucero', consigna: 'Preparate para un crucero.', emoji: '🚢',
    correctos: ['Documentos', 'Malla', 'Protector solar', 'Lentes de sol', 'Ropa elegante', 'Ojotas', 'Cargador', 'Gorra', 'Cámara', 'Medicamentos personales'] },
  { destino: 'Escapada romántica', consigna: 'Armá la valija para una escapada romántica.', emoji: '💕',
    correctos: ['Ropa elegante', 'Perfume', 'Celular', 'Cargador', 'Documentos', 'Billetera', 'Zapatos', 'Camisa', 'Cámara', 'Lentes de sol'] },
  { destino: 'Viaje de pesca', consigna: 'Preparate para un día de pesca.', emoji: '🎣',
    correctos: ['Caña de pescar', 'Anzuelos', 'Gorra', 'Botas', 'Repelente', 'Protector solar', 'Linterna', 'Mochila', 'Botella de agua', 'Navaja'] },
  { destino: 'Viaje en bicicleta', consigna: 'Armá todo para una salida en bici.', emoji: '🚴',
    correctos: ['Casco', 'Bicicleta', 'Botella de agua', 'Lentes', 'Guantes', 'Mochila', 'Protector solar', 'Bomba de aire', 'Celular', 'Kit de reparación'] },
  { destino: 'Día de lluvia', consigna: 'Preparate para un día de lluvia.', emoji: '🌧️',
    correctos: ['Paraguas', 'Piloto', 'Botas de lluvia', 'Campera impermeable', 'Celular', 'Cargador', 'Mochila', 'Toalla', 'Documentos', 'Zapatillas'] },
  { destino: 'Viaje a la nieve', consigna: 'Armá la valija para un día de nieve.', emoji: '⛷️',
    correctos: ['Campera', 'Guantes', 'Gorro', 'Bufanda', 'Botas', 'Pantalón térmico', 'Medias gruesas', 'Lentes de nieve', 'Protector solar', 'Documentos'] },
  { destino: 'Viaje familiar', consigna: 'Preparate para un viaje en familia.', emoji: '👨‍👩‍👧‍👦',
    correctos: ['Documentos', 'Ropa', 'Cargadores', 'Botella de agua', 'Snacks', 'Medicamentos personales', 'Celular', 'Mochila', 'Cámara', 'Juegos'] },
  { destino: 'Viaje de aventura', consigna: 'Armá la valija para un viaje de aventura.', emoji: '🧭',
    correctos: ['Mochila', 'Linterna', 'Botella de agua', 'Brújula', 'Mapa', 'Navaja multiuso', 'Protector solar', 'Repelente', 'Botas', 'Celular'] },
  { destino: 'Viaje a una ciudad desconocida', consigna: 'Preparate para explorar una ciudad nueva.', emoji: '🗺️',
    correctos: ['Celular', 'Cargador', 'Documentos', 'Billetera', 'Mapa', 'Auriculares', 'Botella de agua', 'Cámara', 'Mochila', 'Paraguas'] },
  { destino: 'Viaje al parque de diversiones', consigna: 'Armá la valija para un día de parque de diversiones.', emoji: '🎢',
    correctos: ['Celular', 'Billetera', 'Documentos', 'Botella de agua', 'Gorra', 'Protector solar', 'Lentes de sol', 'Zapatillas', 'Cargador', 'Mochila'] },
  { destino: 'Viaje a las sierras', consigna: 'Preparate para unos días en las sierras.', emoji: '⛰️',
    correctos: ['Zapatillas', 'Mochila', 'Botella de agua', 'Protector solar', 'Gorra', 'Repelente', 'Campera', 'Linterna', 'Celular', 'Documentos'] },
];

let valijaOrden = [];
let valijaIndex = 0;
let valijaDestinoActual = null;
let valijaSeleccionados = new Set();
let valijaTiempoRestante = 25;
let valijaTimerId = null;
let valijaFase = 'inicio'; // 'inicio' | 'jugando' | 'resultado'
let valijaUltimoResultado = null;
// Los tonos (reproducirTono) viven en sonido.js, compartidos con todos los
// juegos, así el mute de uno aplica a todos.

function iniciarValija(){
  valijaOrden = barajar([...Array(VALIJA_DESTINOS.length).keys()]);
  valijaOrden.push('sorpresa');
  valijaIndex = 0;
  valijaFase = 'inicio';
  renderValija();
}

// Antes arrancaba el cronómetro de una al entrar, así que perdías la primera
// ronda mientras todavía estabas leyendo de qué iba el juego. Ahora se
// explica primero y el cronómetro arranca recién con este botón.
function comenzarValija(){
  prepararRondaValija();
}

function prepararRondaValija(){
  clearInterval(valijaTimerId);
  const item = valijaOrden[valijaIndex];
  const esSorpresa = item === 'sorpresa';
  const base = esSorpresa ? VALIJA_DESTINOS[Math.floor(Math.random() * VALIJA_DESTINOS.length)] : VALIJA_DESTINOS[item];
  const incorrectos = barajar(VALIJA_POOL.filter(x => !base.correctos.includes(x))).slice(0, 10);
  const opciones = barajar(base.correctos.concat(incorrectos));

  valijaDestinoActual = {
    destino: esSorpresa ? '¿A dónde vas?' : base.destino,
    consigna: esSorpresa ? 'Viaje sorpresa: fijate bien la pista y armá la valija con lo que creas que hace falta.' : base.consigna,
    emoji: esSorpresa ? '🎁' : base.emoji,
    correctos: base.correctos,
    opciones,
  };
  valijaSeleccionados = new Set();
  valijaTiempoRestante = 25;
  valijaFase = 'jugando';
  renderValija();
  valijaTimerId = setInterval(tickValija, 1000);
}

function tickValija(){
  const vistaActiva = document.querySelector('.view.active');
  if(!vistaActiva || vistaActiva.id !== 'view-valija'){
    clearInterval(valijaTimerId);
    return;
  }
  valijaTiempoRestante--;
  if(valijaTiempoRestante <= 0){
    clearInterval(valijaTimerId);
    terminarRondaValija();
    return;
  }
  if(valijaTiempoRestante <= 5) reproducirTono('tick');
  renderValija();
}

function tocarItemValija(item){
  if(valijaFase !== 'jugando') return;
  if(valijaSeleccionados.has(item)){
    valijaSeleccionados.delete(item);
  } else {
    if(valijaSeleccionados.size >= 10) return;
    valijaSeleccionados.add(item);
    reproducirTono(valijaDestinoActual.correctos.includes(item) ? 'correcto' : 'incorrecto');
  }
  renderValija();
}

function terminarRondaValija(){
  valijaFase = 'resultado';
  const seleccion = [...valijaSeleccionados];
  const aciertos = seleccion.filter(x => valijaDestinoActual.correctos.includes(x)).length;
  const errores = seleccion.length - aciertos;
  const bonus = aciertos === 10 ? 10 : 0;
  const puntaje = aciertos * 2 + bonus;
  valijaUltimoResultado = { aciertos, errores, bonus, puntaje };
  if(puntaje > 0) ganarMonedas(puntaje);
  reproducirTono(bonus ? 'bonus' : 'fin');
  renderValija();
}

function siguienteValija(){
  if(valijaIndex < valijaOrden.length - 1){
    valijaIndex++;
    prepararRondaValija();
  } else {
    renderResultadoFinalValija();
  }
}

function renderValija(){
  const cont = document.getElementById('valija-content');
  if(!cont) return;

  if(valijaFase === 'inicio'){
    document.getElementById('valija-sub').textContent = 'Valija Express';
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>🧳 Valija Express</h2>
        <p>Tenés 25 segundos por destino para armar la valija: elegí hasta 10 objetos, los que creas que hacen falta para ese viaje.</p>
        <p>Cada acierto suma 2 monedas. Un error no te resta nada, pero ocupa uno de los 10 lugares — así que pensarlo vale la pena. Si la armás perfecta (10 de 10), sumás 10 de bonus.</p>
      </div>
      <button class="btn-primary" onclick="comenzarValija()">Comenzar</button>`;
    return;
  }

  document.getElementById('valija-sub').textContent = `Destino ${valijaIndex + 1} de ${valijaOrden.length}`;
  const d = valijaDestinoActual;

  if(valijaFase === 'resultado'){
    const r = valijaUltimoResultado;
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>${d.emoji} ${d.destino}</h2>
        <p>${r.aciertos === 10 ? '¡Valija perfecta!' : 'Se acabó el tiempo'}</p>
      </div>
      <div class="valija-resultado-grid">
        <div class="valija-resultado-item"><span class="valija-resultado-num">${r.puntaje}</span><span>Puntaje</span></div>
        <div class="valija-resultado-item"><span class="valija-resultado-num">${r.aciertos}/10</span><span>Aciertos</span></div>
        <div class="valija-resultado-item"><span class="valija-resultado-num">${r.errores}</span><span>Errores</span></div>
        <div class="valija-resultado-item"><span class="valija-resultado-num">+${r.bonus}</span><span>Bonus</span></div>
      </div>
      <p class="tienda-nota">Mirá cómo quedaste parado en la pestaña Ranking.</p>
      <button class="btn-primary" onclick="siguienteValija()">${valijaIndex < valijaOrden.length - 1 ? 'Siguiente destino' : 'Ver resultado final'}</button>`;
    return;
  }

  const urgente = valijaTiempoRestante <= 5;
  const itemsHTML = d.opciones.map(item => {
    const elegido = valijaSeleccionados.has(item);
    return `<button class="valija-item ${elegido ? 'valija-item-elegido' : ''}" onclick="tocarItemValija('${item.replace(/'/g, "\\'")}')">${item}</button>`;
  }).join('');
  const contenidoHTML = valijaSeleccionados.size
    ? [...valijaSeleccionados].map(x => `<span class="valija-chip">${x}</span>`).join('')
    : '<span class="valija-chip valija-chip-vacio">Vacía</span>';

  cont.innerHTML = `
    <div class="valija-topbar">
      <div class="valija-topbar-info">
        <span class="valija-topbar-emoji">${d.emoji}</span>
        <span class="valija-topbar-destino">${d.destino}</span>
      </div>
      <div class="valija-timer ${urgente ? 'valija-timer-urgente' : ''}">${valijaTiempoRestante}</div>
    </div>
    <p class="valija-consigna">${d.consigna}</p>
    <div class="valija-visual">
      <span class="valija-visual-emoji">🧳</span>
      <div class="valija-contenido">
        <span class="valija-contenido-badge">${valijaSeleccionados.size}/10</span>
        ${contenidoHTML}
      </div>
    </div>
    <div class="valija-items">${itemsHTML}</div>`;
}

function renderResultadoFinalValija(){
  document.getElementById('valija-sub').textContent = 'Valija Express';
  document.getElementById('valija-content').innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>¡Recorriste los ${valijaOrden.length} destinos!</h2>
      <p>Mirá tu puesto en el Ranking, o jugá de nuevo con otro orden de destinos.</p>
    </div>
    <button class="btn-primary" onclick="iniciarValija()">Jugar de nuevo</button>`;
}
