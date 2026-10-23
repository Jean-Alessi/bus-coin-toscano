// Puntos del viaje con techo por día. Las monedas (billetera, para vestir al
// personaje) se siguen ganando sin límite, pero los PUNTOS del ranking, de la
// Guerra de cursos y de la Copa tienen un máximo diario por chico:
// 50 jugando solo + 50 jugando en grupo. Así gana el que entra todos los días,
// no el que se pasa horas con el celular, y para completar el día hay que
// jugar con otros.
//
// También se guarda cuánto sumó cada uno en el mes (ranking/puntos/{asiento}/m/{AAAA-MM})
// para las metas mensuales de cada curso (ver cursos.js).

const PUNTOS_TOPE_SOLO = 50;
const PUNTOS_TOPE_GRUPO = 50;
// Vistas que cuentan como "en grupo" (el resto es "solo").
const PUNTOS_VISTAS_GRUPO = new Set(['tutifruti', 'impostor', 'bingo', 'triviavivo', 'cuento', 'dibujar', 'escoba', 'chinchon', 'truco', 'buscolor', 'padel', 'texas', 'copa', 'plaza']);

function puntosHoy(){ return new Date().toLocaleDateString('en-CA'); }
function puntosMes(){ return puntosHoy().slice(0, 7); }

function puntosLeerDia(){
  const clave = 'puntos-dia-' + (typeof codigoViaje !== 'undefined' ? codigoViaje : '');
  let d = null;
  try { d = JSON.parse(localStorage.getItem(clave)); } catch(e){}
  if(!d || d.fecha !== puntosHoy()) d = { fecha: puntosHoy(), solo: 0, grupo: 0, avisado: {} };
  return { clave, d };
}

function puntosTipoActual(){
  const vista = typeof analyticsVistaActual !== 'undefined' ? analyticsVistaActual : '';
  return PUNTOS_VISTAS_GRUPO.has(vista) ? 'grupo' : 'solo';
}

// Devuelve cuántos de esos puntos entran hoy en el ranking (las restas pasan
// enteras: nunca hacen falta topes para bajar).
function puntosAplicarTope(cantidad){
  if(!(cantidad > 0)) return cantidad;
  const tipo = puntosTipoActual();
  const tope = tipo === 'grupo' ? PUNTOS_TOPE_GRUPO : PUNTOS_TOPE_SOLO;
  const { clave, d } = puntosLeerDia();
  const permitido = Math.max(0, Math.min(cantidad, tope - (d[tipo] || 0)));
  d[tipo] = (d[tipo] || 0) + permitido;
  let avisar = false;
  if(permitido < cantidad && !d.avisado[tipo]){ d.avisado[tipo] = true; avisar = true; }
  try { localStorage.setItem(clave, JSON.stringify(d)); } catch(e){}
  if(avisar && typeof mostrarToast === 'function'){
    const otro = tipo === 'grupo' ? 'jugando solo' : 'jugando en grupo';
    const lleno = (d.solo || 0) >= PUNTOS_TOPE_SOLO && (d.grupo || 0) >= PUNTOS_TOPE_GRUPO;
    setTimeout(() => mostrarToast(lleno
      ? '🌟 ¡Completaste los 100 puntos de hoy! Mañana sumás más. Las monedas para tu personaje siguen.'
      : `Ya hiciste los ${tope} puntos de hoy ${tipo === 'grupo' ? 'en grupo' : 'jugando solo'}. Te quedan puntos ${otro}.`), 2900);
  }
  return permitido;
}

function puntosHoyTotal(){
  const { d } = puntosLeerDia();
  return { solo: d.solo || 0, grupo: d.grupo || 0, total: (d.solo || 0) + (d.grupo || 0), tope: PUNTOS_TOPE_SOLO + PUNTOS_TOPE_GRUPO };
}

// Pastilla para el Ranking: "Hoy 63/100" con el detalle solo/grupo.
function puntosHoyPillHTML(){
  const h = puntosHoyTotal();
  return `<span class="g-pill" title="Solo ${h.solo}/${PUNTOS_TOPE_SOLO} · En grupo ${h.grupo}/${PUNTOS_TOPE_GRUPO}">Hoy ${h.total}/${h.tope}</span>`;
}

function puntosHoyDetalleHTML(){
  const h = puntosHoyTotal();
  const barra = (v, t, color) => `<div style="flex:1;"><div style="font-size:11.5px;font-weight:700;opacity:.85;margin-bottom:3px;">${color === 'solo' ? '🧠 Solo' : '🤝 En grupo'} ${v}/${t}</div><div style="height:8px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;"><span style="display:block;height:100%;width:${Math.round(v / t * 100)}%;background:${color === 'solo' ? '#ffb347' : '#5ee08a'};"></span></div></div>`;
  return `<div class="g-dialogo" style="padding:10px 14px;"><div class="g-dialogo-titulo" style="font-size:15px;">Puntos de hoy: ${h.total} de ${h.tope}</div><div style="display:flex;gap:12px;margin-top:6px;">${barra(h.solo, PUNTOS_TOPE_SOLO, 'solo')}${barra(h.grupo, PUNTOS_TOPE_GRUPO, 'grupo')}</div><div class="g-dialogo-sub" style="margin-top:6px;">Gana el que juega todos los días un rato, no el que se pasa horas. Las monedas para tu personaje no tienen tope.</div></div>`;
}
