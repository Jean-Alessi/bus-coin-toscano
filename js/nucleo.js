// Núcleo compartido por todas las pantallas (juegos y servicios). Antes vivía dentro de arcade.js, trivia.js y bingo.js, pero lo usan
// muchos otros archivos: sacarlo acá permite cargar cada juego solo cuando hace falta (ver DIVISION.md).
//
// Qué hay: (1) monedas por partida con tope diario y utilidades para dibujar en canvas (logo, emoji, cartelitos), (2) barajar,
// (3) el rol de "organizador" con PIN. Se carga ANTES que todos los juegos.

// ---- 1. Monedas por partida y dibujo en canvas ----

const ARC_TOPE_DIA = 40; // monedas por juego por día
const ARC_TOPE_PARTIDA = 15; // monedas por partida

function arcFechaHoy(){ return new Date().toLocaleDateString('en-CA'); }
function arcLeer(clave, defecto){
  try { const v = JSON.parse(localStorage.getItem(clave)); return v == null ? defecto : v; } catch(e){ return defecto; }
}
function arcGuardar(clave, valor){ try { localStorage.setItem(clave, JSON.stringify(valor)); } catch(e){} }
function arcMejor(id){ return arcLeer('arcade-mejor-' + id, 0); }

// Entrega monedas respetando el tope diario del juego; devuelve cuántas entregó.
function arcOtorgarMonedas(id, ganadas){
  const hoy = arcFechaHoy();
  let est = arcLeer('arcade-dia', null);
  if(!est || est.fecha !== hoy) est = { fecha: hoy, juegos: {} };
  const ya = est.juegos[id] || 0;
  const otorgar = Math.max(0, Math.min(ganadas, ARC_TOPE_DIA - ya));
  est.juegos[id] = ya + otorgar;
  arcGuardar('arcade-dia', est);
  if(otorgar > 0) ganarMonedas(otorgar);
  return otorgar;
}

// ---- Utilidades de dibujo ----

const ARC_FUENTE_EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

function arcRR(ctx, x, y, w, h, r){
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// El logo de Busmac (la B) para usarlo como pieza o adorno dentro de los juegos.
// 'fondo' (opcional) le dibuja un disco detrás para que se lea sobre colores oscuros.
const ARC_LOGO = new Image();
ARC_LOGO.src = 'logo-empresa.png?v=2';
function marcaCorta(){ return (typeof MARCA !== 'undefined' && MARCA.nombreCorto) || 'Busmac'; }

// Un logo con el nombre escrito (ancho) necesita una placa blanca para leerse sobre fondos
// oscuros; la "b" de Busmac se dibuja sola, sin ningún recuadro ni círculo detrás.
function logoAncho(){
  return ARC_LOGO.complete && ARC_LOGO.naturalWidth > 0 && ARC_LOGO.naturalWidth / ARC_LOGO.naturalHeight > 1.4;
}
if(typeof document !== 'undefined'){
  const marcarAncho = () => { if(logoAncho()) document.documentElement.classList.add('logo-ancho'); };
  ARC_LOGO.addEventListener('load', marcarAncho);
  marcarAncho();
}

function arcLogo(ctx, x, y, tam, fondo){
  if(ARC_LOGO.complete && ARC_LOGO.naturalWidth){
    // Se ajusta a su proporción: un logo cuadrado ocupa 'tam' de alto y uno ancho (con el
    // nombre escrito) hasta 1,4 veces 'tam' de ancho, sin deformarse.
    const asp = ARC_LOGO.naturalWidth / ARC_LOGO.naturalHeight;
    const lado = asp > 1.4 ? tam * 1.4 : tam;
    const w = asp >= 1 ? lado : lado * asp, h = asp >= 1 ? lado / asp : lado;
    if(fondo && asp > 1.4){
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      arcRR(ctx, x - w / 2 - 3, y - h / 2 - 2, w + 6, h + 4, 4); ctx.fill();
    }
    ctx.drawImage(ARC_LOGO, x - w / 2, y - h / 2, w, h);
  } else {
    ctx.fillStyle = '#F28A1E';
    ctx.font = '800 ' + Math.round(tam) + 'px "Baloo 2", Poppins, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('b', x, y);
  }
}

function arcEmoji(ctx, emoji, x, y, tam){
  ctx.font = `${tam}px ${ARC_FUENTE_EMOJI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
}

function arcCartel(ctx, texto, ancho, y, alfa){
  if(alfa <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alfa);
  ctx.font = '800 13px Poppins, sans-serif';
  const w = ctx.measureText(texto).width + 24;
  ctx.fillStyle = 'rgba(15,42,77,.85)';
  arcRR(ctx, (ancho - w) / 2, y, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, ancho / 2, y + 13.5);
  ctx.restore();
}

function arcMezcla(a, b, t){
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// ---- 2. Mezclar listas y preguntas ----

function barajar(lista){
  const copia = lista.slice();
  for(let i = copia.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Mezcla el orden de las opciones de una pregunta (y recalcula cuál es la
// correcta) para que la respuesta correcta no quede siempre en el mismo
// lugar entre partida y partida.
function barajarOpciones(pregunta){
  const opcionCorrecta = pregunta.opciones[pregunta.correcta];
  const nuevasOpciones = barajar(pregunta.opciones);
  return Object.assign({}, pregunta, {
    opciones: nuevasOpciones,
    correcta: nuevasOpciones.indexOf(opcionCorrecta),
  });
}

// ---- 3. Rol de organizador (PIN) ----
// Quién canta los números en Bingo, quién dirige El Impostor, etc. Es un rol liviano dentro de un viaje puntual; se guarda en
// este celular. (Los nombres empiezan con "bingo" porque nació en ese juego.)

let bingoMostrandoPin = false;
const BINGO_PIN_ORGANIZADOR = MARCA.pinOrganizador;

function bingoEsOrganizador(){
  return localStorage.getItem('bingo-organizador') === 'si';
}

function bingoCerrarSesionOrganizador(){
  localStorage.removeItem('bingo-organizador');
  if(typeof renderBingo === 'function') renderBingo();
}

function bingoMostrarPinOrganizador(){
  bingoMostrandoPin = true;
  if(typeof renderBingo === 'function') renderBingo();
  if(typeof renderImpostor === 'function') renderImpostor();
}

function bingoIntentarSerOrganizador(){
  const input = document.getElementById('bingo-pin-input');
  const pin = input ? input.value.trim() : '';
  const error = document.getElementById('bingo-pin-error');
  if(pin !== BINGO_PIN_ORGANIZADOR){
    if(error) error.textContent = 'PIN incorrecto';
    return;
  }
  localStorage.setItem('bingo-organizador', 'si');
  bingoMostrandoPin = false;
  if(typeof renderBingo === 'function') renderBingo();
  // El mismo PIN también da el rol de director en El Impostor — si esa
  // pantalla está abierta (o se abrió antes en esta sesión), se refresca
  // también para que aparezcan sus controles sin tener que ir y volver.
  if(typeof renderImpostor === 'function') renderImpostor();
}

function bingoPinHTML(){
  if(!bingoMostrandoPin){
    return `<div class="g-pie"><span onclick="bingoMostrarPinOrganizador()">👤 ¿Sos el organizador? Entrá acá</span></div>`;
  }
  return `
    <div class="bingo-pin-box">
      <input type="password" id="bingo-pin-input" class="bingo-input-numero" inputmode="numeric" maxlength="4" placeholder="PIN del organizador">
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="bingoIntentarSerOrganizador()">Entrar como organizador</button></div>
      <p id="bingo-pin-error" class="bingo-pin-error"></p>
    </div>`;
}

function bingoCerrarSesionOrganizadorHTML(){
  return `<div class="g-pie"><span onclick="bingoCerrarSesionOrganizador()">Cerrar sesión de organizador</span></div>`;
}
