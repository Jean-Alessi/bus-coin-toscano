// Mesas del Salón de mesas: cada juego de cartas es una mesa redonda con sillas. Se ve de lejos
// cuántas mesas hay abiertas y quién espera ("🪑 1/2"), así se sabe a cuál sentarse. Al acercarse
// se entra al lobby del juego (ahí se crea o se une a una mesa, como siempre).
// Datos (solo lectura): salas/{viaje}/{juego}/mesas/{id} → { fase, jugadores[], capacidad }.

const MESAS_JUEGOS = ['truco', 'chinchon', 'escoba', 'buscolor', 'texas'];
const mesasLobby = { oyentes: [], datos: {} };

function mesasIniciar(){
  mesasAlSalir();
  if(typeof codigoViaje === 'undefined' || !codigoViaje) return;
  MESAS_JUEGOS.forEach(j => {
    const r = db.ref('salas/' + codigoViaje + '/' + j + '/mesas');
    const cb = r.on('value', s => { mesasLobby.datos[j] = s.val() || {}; if(typeof plazaRenderAccion === 'function') plazaRenderAccion(); });
    mesasLobby.oyentes.push({ r, cb });
  });
}

function mesasAlSalir(){
  mesasLobby.oyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  mesasLobby.oyentes = []; mesasLobby.datos = {};
}

// Resumen de un juego: mesas esperando jugadores, mesas jugando y la que tiene más gente esperando.
function mesasInfo(j){
  const m = mesasLobby.datos[j] || {};
  let abiertas = 0, jugando = 0, mejor = null;
  Object.keys(m).forEach(id => {
    const x = m[id];
    if(!x) return;
    if(x.fase === 'esperando'){
      abiertas++;
      const n = (x.jugadores || []).length;
      if(!mejor || n > mejor.n) mejor = { n, cap: x.capacidad || 2 };
    } else if(x.fase === 'jugando') jugando++;
  });
  return { abiertas, jugando, mejor };
}

function mesasInsignia(j){
  const i = mesasInfo(j);
  if(i.mejor) return '🪑 ' + i.mejor.n + '/' + i.mejor.cap;
  if(i.jugando) return '▶ ' + i.jugando;
  return null;
}

function mesasSubtitulo(j, base){
  const i = mesasInfo(j);
  if(i.mejor) return (i.abiertas === 1 ? '1 mesa espera' : i.abiertas + ' mesas esperan') + ' jugadores (' + i.mejor.n + '/' + i.mejor.cap + '). ¡Sumate!';
  if(i.jugando) return i.jugando + (i.jugando === 1 ? ' mesa jugando' : ' mesas jugando') + '. Podés abrir otra.';
  return base + ' · Todavía no hay mesas abiertas';
}

// Mesa redonda con sillas: la cantidad de sillas es el tamaño de la mesa con más gente esperando
// (4 si no hay ninguna) y las ocupadas muestran una cabecita.
function plazaDibujarMesa(ctx, e){
  const cx = e.x + e.w / 2, cy = e.y + 68;
  const info = e.juego ? mesasInfo(e.juego) : { mejor: null };
  const cap = Math.max(2, Math.min(6, info.mejor ? info.mejor.cap : 4)), ocup = info.mejor ? info.mejor.n : 0;
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(cx + 3, cy + 10, 46, 28, 0, 0, 7); ctx.fill();
  // sillas
  for(let i = 0; i < cap; i++){
    const ang = -Math.PI / 2 + i * 2 * Math.PI / cap, sx = cx + Math.cos(ang) * 50, sy = cy + Math.sin(ang) * 33;
    ctx.fillStyle = '#6B4A2B'; arcRR(ctx, sx - 9, sy - 8, 18, 16, 5); ctx.fill();
    if(i < ocup){
      ctx.fillStyle = ['#F5C29B', '#D9A066', '#B9773F', '#8D5524', '#FFDBB4', '#E0AC69'][i % 6]; ctx.beginPath(); ctx.arc(sx, sy - 4, 7, 0, 7); ctx.fill();
      ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(sx, sy + 5, 6, Math.PI, 0); ctx.fill();
    }
  }
  // mesa
  ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.ellipse(cx, cy, 42, 27, 0, 0, 7); ctx.fill();
  ctx.fillStyle = e.color; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 37, 23, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 28, 15, 0, 0, 7); ctx.fill();
  arcEmoji(ctx, e.emoji, cx, cy - 3, 28);
  // nombre
  ctx.font = '800 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let tam = 12; while(tam > 8 && ctx.measureText(e.nombre).width > e.w - 18){ tam--; ctx.font = '800 ' + tam + 'px Poppins, sans-serif'; }
  const w = Math.min(e.w - 4, ctx.measureText(e.nombre).width + 16);
  ctx.fillStyle = 'rgba(15,42,77,.78)'; arcRR(ctx, cx - w / 2, e.y + 2, w, 20, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(e.nombre, cx, e.y + 12.5);
  const z = plazaZonaPuerta(e);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; arcRR(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
}
