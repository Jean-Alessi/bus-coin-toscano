// Túnel secreto: en cada viaje hay una tapa escondida en uno de los mapas. No tiene cartel ni
// flecha: se ve apenas una sombra cuando pasás cerca. Quien se queda parado encima un segundo
// descubre el "Sótano de Busmac": un cofre con monedas para el personaje (una vez por persona,
// no suman al ranking), un código para el coordinador y la lista de descubridores.
// Dónde está depende del código del viaje, así cambia de viaje en viaje.
// Datos: salas/{viaje}/tunel/{contador, descubridores/{asiento}}, ajustes/tunel ('off' lo apaga),
// ajustes/tunelMensaje (texto del premio que pone el coordinador).

const TUNEL_SPOTS = [
  { sector: 'plaza', x: 596, y: 436 },
  { sector: 'shopping', x: 596, y: 232 },
  { sector: 'arcade', x: 600, y: 610 },
  { sector: 'mesas', x: 596, y: 420 },
  { sector: 'eventos', x: 600, y: 440 },
];
const TUNEL_MONEDAS = 10;
const TUNEL_DESCUBRIR_S = 1.0;
const tunel = { desc: {}, oyente: null, ref: null, cerca: 0, abierto: false };

function tunelSpot(){
  const c = (typeof codigoViaje !== 'undefined' && codigoViaje) || 'X';
  let h = 0; for(let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) % 9973;
  return TUNEL_SPOTS[h % TUNEL_SPOTS.length];
}
const tunelActivo = () => typeof mundo === 'undefined' || mundo.tunelOn !== false;
const tunelEnLinea = () => !!(typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre);
const tunelYaLoVi = () => !!tunel.desc[String(miAsiento)];
const tunelEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function tunelIniciar(){
  tunelAlSalir();
  tunel.cerca = 0; tunel.abierto = false;
  if(!tunelEnLinea()) return;
  tunel.ref = db.ref('salas/' + codigoViaje + '/tunel/descubridores');
  tunel.oyente = tunel.ref.on('value', s => { tunel.desc = s.val() || {}; tunelRender(); });
}
function tunelAlSalir(){
  if(tunel.ref && tunel.oyente){ try { tunel.ref.off('value', tunel.oyente); } catch(e){} }
  tunel.ref = null; tunel.oyente = null; tunel.abierto = false;
  const c = document.getElementById('plaza-tunel'); if(c) c.innerHTML = '';
}

// Cuadro a cuadro: si estoy un segundo parado sobre la tapa, descubro el túnel.
function tunelPaso(dt){
  if(!tunelActivo() || !tunelEnLinea() || tunel.abierto) return;
  const sp = tunelSpot();
  if(typeof PLZ_SECTOR === 'undefined' || !PLZ_SECTOR || PLZ_SECTOR.id !== sp.sector) { tunel.cerca = 0; return; }
  const d = Math.hypot(plz.yo.x - sp.x, plz.yo.y - sp.y);
  if(d < 24 && !plz.pose){
    tunel.cerca += dt;
    if(tunel.cerca > TUNEL_DESCUBRIR_S){ tunel.cerca = 0; tunelDescubrir(); }
  } else tunel.cerca = 0;
}

// Cuando ya lo descubrió, pararse encima ofrece volver a bajar.
function tunelAtraccion(){
  if(!tunelActivo() || !tunelYaLoVi()) return null;
  const sp = tunelSpot();
  if(!PLZ_SECTOR || PLZ_SECTOR.id !== sp.sector || Math.hypot(plz.yo.x - sp.x, plz.yo.y - sp.y) > 30) return null;
  return { id: 'tunel', nombre: 'Túnel secreto', emoji: '🕳️', verbo: 'Bajar al túnel', sub: 'El sótano secreto de Busmac', fn: 'tunelAbrirPanel', zona: { x: sp.x - 30, y: sp.y - 30, w: 60, h: 60 } };
}

async function tunelDescubrir(){
  const yo = String(miAsiento);
  if(!tunelYaLoVi()){
    const r = await db.ref('salas/' + codigoViaje + '/tunel/contador').transaction(n => (n || 0) + 1);
    const pos = r && r.committed ? r.snapshot.val() : 1;
    const cod = 'TUN-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    tunel.desc[yo] = { n: String(miNombre).slice(0, 20), pos, cod, t: Date.now() };
    await db.ref('salas/' + codigoViaje + '/tunel/descubridores/' + yo).set({ n: String(miNombre).slice(0, 20), pos, cod, t: firebase.database.ServerValue.TIMESTAMP });
    if(typeof reproducirMelodia === 'function') reproducirMelodia([523, 659, 784, 1046, 1318], 110, 'triangle');
    if(typeof mostrarToast === 'function') mostrarToast('🕳️ ¡Encontraste el túnel secreto! Sos el n° ' + pos, 'gain');
  }
  tunelAbrirPanel();
}

function tunelAbrirPanel(){
  if(!tunelEnLinea()) return;
  tunel.abierto = true; tunelRender();
}
function tunelCerrar(){ tunel.abierto = false; tunelRender(); }

function tunelRender(){
  const cont = document.getElementById('plaza-tunel');
  if(!cont) return;
  if(!tunel.abierto){ cont.innerHTML = ''; return; }
  const yo = String(miAsiento), mio = tunel.desc[yo] || {};
  const lista = Object.keys(tunel.desc).map(a => tunel.desc[a]).sort((x, y) => (x.pos || 0) - (y.pos || 0)).slice(0, 10);
  const msg = (typeof mundo !== 'undefined' && mundo.tunelMsg) || '';
  cont.innerHTML = `<div class="plz-modal tun-modal"><div class="plz-modal-caja tun-caja">
    <h3 class="fer-titulo">🕳️ Sótano secreto de Busmac</h3>
    <p class="fer-texto">¡Descubriste el túnel! Sos el <b>n° ${tunelEsc(mio.pos || '?')}</b> en encontrarlo.</p>
    ${mio.cofre ? '<div class="fer-grande">🎁</div><p class="fer-sub">Ya abriste el cofre (' + TUNEL_MONEDAS + ' monedas).</p>' : `<button class="tun-cofre" onclick="tunelCofre()"><span>🎁</span>Abrir el cofre</button>`}
    <div class="fer-cupon">${tunelEsc(mio.cod || '')}</div>
    <p class="fer-sub">${msg ? tunelEsc(msg) : 'Mostrale este código al coordinador. Si hay premio, es para quienes descubrieron el túnel.'}</p>
    <div class="fer-admin-t">Descubridores</div>
    <div class="tun-lista">${lista.map(d => `<div><b>${tunelEsc(d.pos)}°</b> ${tunelEsc(d.n)}</div>`).join('')}</div>
    <div class="fer-botones"><button class="gbtn gbtn-ancho gbtn-no" onclick="tunelCerrar()">Subir a la plaza</button></div></div></div>`;
}

function tunelCofre(){
  const yo = String(miAsiento), mio = tunel.desc[yo];
  if(!mio || mio.cofre) return;
  mio.cofre = true;
  db.ref('salas/' + codigoViaje + '/tunel/descubridores/' + yo + '/cofre').set(true);
  if(typeof regalarMonedas === 'function') regalarMonedas(TUNEL_MONEDAS);
  if(typeof reproducirMelodia === 'function') reproducirMelodia([784, 988, 1175], 90, 'sine');
  if(typeof mostrarToast === 'function') mostrarToast('🎁 +' + TUNEL_MONEDAS + ' monedas para tu personaje', 'gain');
  tunelRender();
}

// La tapa: una sombra casi invisible que se nota al acercarse. Si ya lo descubrió, se ve siempre.
function tunelDibujar(ctx){
  if(!tunelActivo()) return;
  const sp = tunelSpot();
  if(!PLZ_SECTOR || PLZ_SECTOR.id !== sp.sector) return;
  const d = Math.hypot(plz.yo.x - sp.x, plz.yo.y - sp.y);
  const vis = tunelYaLoVi() ? 1 : Math.max(0, Math.min(0.5, (80 - d) / 60));
  if(vis <= 0.01) return;
  ctx.save(); ctx.globalAlpha = vis;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(sp.x, sp.y + 2, 22, 11, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#4a4f5c'; ctx.beginPath(); ctx.ellipse(sp.x, sp.y, 20, 10, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
  for(let i = -2; i <= 2; i++){ ctx.beginPath(); ctx.moveTo(sp.x + i * 6 - 7, sp.y - 6); ctx.lineTo(sp.x + i * 6 + 7, sp.y + 6); ctx.stroke(); }
  if(!tunelYaLoVi() && tunel.cerca > 0){ // anillo que se completa mientras estás parado encima
    ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sp.x, sp.y, 16, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * Math.min(1, tunel.cerca / TUNEL_DESCUBRIR_S)); ctx.stroke();
  }
  ctx.restore();
}
