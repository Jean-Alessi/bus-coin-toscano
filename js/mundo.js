// El mundo de Bus Coin: un micro con 5 paradas (ver sectores.js). Acá vive lo que comparten
// la Estación, el mapa de cada parada y el micro:
//   - el modo del viaje: "mundo" (por defecto) o "clásico" (sin mundo, solo menú de siempre),
//   - el recorrido real del viaje (las líneas de la cartelera) y en qué parada real estamos,
//   - el próximo bingo, que el coordinador anuncia y se ve en todas las paradas.
// Datos en salas/{viaje}/: ajustes/modo, ajustes/paradaReal (número de línea), ajustes/proximoBingo,
// feriaConfig/cartelera (líneas "Hora | Lugar").

const mundo = { modo: 'mundo', recorrido: [], actual: -1, bingo: '', oyentes: [], viaje: '', primera: true, evento: null, bolicheOn: true, padelOn: true, seleccionOn: true, tunelOn: true, tunelMsg: '', tunelDesc: {} };
const MUNDO_EVENTO_MS = 3 * 3600 * 1000; // un aviso de evento dura 3 horas

const mundoActivo = () => mundo.modo !== 'clasico';
const mundoEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function mundoEscuchar(){
  if(typeof codigoViaje === 'undefined' || !codigoViaje || mundo.viaje === codigoViaje) return;
  mundoSoltar();
  mundo.viaje = codigoViaje; mundo.primera = true;
  const escuchar = (ruta, f) => { const r = db.ref('salas/' + codigoViaje + '/' + ruta); const cb = r.on('value', s => f(s.val())); mundo.oyentes.push({ r, cb }); };
  escuchar('ajustes', v => {
    v = v || {};
    const antes = mundo.modo;
    mundo.modo = v.modo === 'clasico' ? 'clasico' : 'mundo';
    mundo.actual = typeof v.paradaReal === 'number' ? v.paradaReal : -1;
    mundo.bingo = typeof v.proximoBingo === 'string' ? v.proximoBingo : '';
    const eventoAntes = mundo.evento;
    mundo.evento = v.evento && v.evento.texto && PLZ_SECTORES[v.evento.sector] ? v.evento : null;
    mundo.tunelOn = v.tunel !== 'off';
    const selAntes = mundo.seleccionOn;
    mundo.seleccionOn = v.seleccion !== 'off';
    if(selAntes !== mundo.seleccionOn && typeof plazaCargarSector === 'function' && typeof plz !== 'undefined' && plz.activo && PLZ_SECTOR){
      if(!mundo.seleccionOn && PLZ_SECTOR.id === 'seleccion' && typeof seleccionSalir === 'function') seleccionSalir();
      else if(PLZ_SECTOR.id === 'shopping') plazaCargarSector('shopping');
    }
    const bolicheAntes = mundo.bolicheOn;
    mundo.bolicheOn = v.boliche !== 'off';
    if(bolicheAntes !== mundo.bolicheOn && typeof plazaCargarSector === 'function' && typeof plz !== 'undefined' && plz.activo && PLZ_SECTOR){
      if(!mundo.bolicheOn && PLZ_SECTOR.id === 'boliche' && typeof bolicheSalir === 'function') bolicheSalir();
      else if(PLZ_SECTOR.id === 'plaza') plazaCargarSector('plaza');
    }
    const padelAntes = mundo.padelOn;
    mundo.padelOn = v.padel !== 'off';
    if(padelAntes !== mundo.padelOn && typeof plazaCargarSector === 'function' && typeof plz !== 'undefined' && plz.activo && PLZ_SECTOR && PLZ_SECTOR.id === 'plaza') plazaCargarSector('plaza');
    mundo.tunelMsg = typeof v.tunelMensaje === 'string' ? v.tunelMensaje : '';
    mundoAlCambiar(antes);
    if(!mundo.primera && mundo.evento && mundoEventoActivo() && (!eventoAntes || eventoAntes.t !== mundo.evento.t) && typeof mostrarToast === 'function'){
      mostrarToast('📢 ' + mundo.evento.texto + ' · en ' + PLZ_SECTORES[mundo.evento.sector].corto, 'gain');
      if(typeof reproducirMelodia === 'function') reproducirMelodia([784, 988, 1175, 988], 120, 'sine');
    }
  });
  escuchar('tunel/descubridores', v => { mundo.tunelDesc = v || {}; if(typeof estacionRender === 'function') estacionRender(); });
  escuchar('feriaConfig/cartelera', v => {
    mundo.recorrido = (Array.isArray(v) ? v : (v ? Object.keys(v).map(k => v[k]) : [])).filter(x => x != null).map(String);
    if(typeof estacionRender === 'function') estacionRender();
  });
}

// El evento que anunció el organizador, mientras siga vigente.
function mundoEventoActivo(){
  const e = mundo.evento;
  if(!e) return null;
  return Date.now() - (Number(e.t) || 0) < MUNDO_EVENTO_MS ? e : null;
}

function mundoSoltar(){
  mundo.oyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  mundo.oyentes = []; mundo.viaje = '';
}

function mundoAlCambiar(modoAntes){
  const activa = document.querySelector('.view.active');
  const id = activa ? activa.id.replace('view-', '') : '';
  if(!mundoActivo() && (id === 'plaza' || id === 'estacion')) showView('home');
  mundo.primera = false;
  if(modoAntes !== mundo.modo && typeof renderHome === 'function' && id === 'home') renderHome();
  if(typeof estacionRender === 'function') estacionRender();
  if(typeof plazaActualizarAviso === 'function') plazaActualizarAviso();
}

// Cuenta cuántos hay en cada parada a partir de la presencia (ver microLeerPresencia).
function mundoContar(pres){
  const c = {};
  Object.keys(pres || {}).forEach(a => { const s = pres[a].sector; if(s) c[s] = (c[s] || 0) + 1; });
  return c;
}

// El próximo bingo, con "en N min" si lo cargaron como hora (HH:MM).
function mundoTextoBingo(){
  const b = (mundo.bingo || '').trim();
  if(!b) return '';
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(b);
  if(!m) return b;
  const ahora = new Date(), t = new Date();
  t.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
  const min = Math.round((t - ahora) / 60000);
  const hora = m[1].padStart(2, '0') + ':' + m[2];
  if(min > 1) return hora + ' · en ' + (min >= 60 ? Math.floor(min / 60) + ' h ' + (min % 60) + ' min' : min + ' min');
  if(min >= -30) return hora + ' · ¡empieza ya!';
  return hora;
}

// Las 5 paradas como tarjetas. 'accion' es el nombre de la función que recibe el id del sector.
function mundoParadasHTML(conteos, actualId, accion){
  return PLZ_ORDEN_SECTORES.map(id => {
    const s = PLZ_SECTORES[id], n = (conteos && conteos[id]) || 0, aca = id === actualId;
    return `<button class="est-parada${aca ? ' aca' : ''}" style="--c:${s.color}" onclick="${accion}('${id}')">
      <span class="est-emoji">${s.emoji}</span>
      <span class="est-info"><b>${mundoEsc(id === 'plaza' || id === 'shopping' ? s.corto + ' ' + (typeof marcaCorta === 'function' ? marcaCorta() : '') : s.nombre)}</b><small>${mundoEsc(s.desc)}</small></span>
      <span class="est-cant">${aca ? 'Estás acá' : (n ? '👥 ' + n : 'Ir')}</span>
    </button>`;
  }).join('') + (mundo.seleccionOn ? `<button class="est-parada est-seleccion" style="--c:#74ACDF" onclick="mundoIrALaSeleccion()">
      <span class="est-emoji">⚽</span>
      <span class="est-info"><b>Casa de la Selección</b><small>Elegí tu ídolo de 2022 o 2026, levantá la copa y sacate la foto. Se entra por el Shopping.</small></span>
      <span class="est-cant">${conteos && conteos.seleccion ? '👥 ' + conteos.seleccion : 'Ir'}</span>
    </button>` : '') + (mundo.bolicheOn ? `<button class="est-parada est-boliche" style="--c:#FF4DDB" onclick="mundoIrAlBoliche()">
      <span class="est-emoji">🕺</span>
      <span class="est-info"><b>Confitería bailable</b><small>Música, luces, bola de espejos y barra. Se entra por la Plaza.</small></span>
      <span class="est-cant">${conteos && conteos.boliche ? '👥 ' + conteos.boliche : 'Ir'}</span>
    </button>` : '') + (mundo.padelOn ? `<button class="est-parada est-padel" style="--c:#0E7C86" onclick="mundoIrAPadelbus()">
      <span class="est-emoji">🎾</span>
      <span class="est-info"><b>Padelbus</b><small>Pádel de a 2 o de a 4 con paredes que rebotan. Se entra por la Plaza.</small></span>
      <span class="est-cant">Jugar</span>
    </button>` : '');
}

// El recorrido real del viaje: dónde estamos y qué sigue.
function mundoRecorridoHTML(){
  if(!mundo.recorrido.length) return '';
  const fila = i => { const [h, t] = String(mundo.recorrido[i]).split('|').map(x => x.trim()); return t ? `${mundoEsc(h)} · ${mundoEsc(t)}` : mundoEsc(h); };
  const a = mundo.actual;
  const ahora = a >= 0 && a < mundo.recorrido.length ? `<div class="est-rec-ahora">📍 Ahora: <b>${fila(a)}</b></div>` : '';
  const sigue = a + 1 >= 0 && a + 1 < mundo.recorrido.length ? `<div class="est-rec-sigue">Sigue: ${fila(a + 1)}</div>` : (a < 0 ? `<div class="est-rec-sigue">Primera parada: ${fila(0)}</div>` : '');
  return `<div class="est-recorrido"><div class="est-rec-t">🗺️ Recorrido del viaje</div>${ahora}${sigue}</div>`;
}

// Ir a una parada desde cualquier lado (estación, mapa o micro).
function mundoIrA(id){
  if(typeof micCerrarSiempre === 'function') micCerrarSiempre();
  if(!PLZ_SECTORES[id]) return;
  const activa = document.querySelector('.view.active');
  if(activa && activa.id === 'view-plaza' && typeof plazaIrASector === 'function' && id === plz.sector){ return; }
  if(activa && activa.id === 'view-plaza' && typeof plazaIrASector === 'function'){ plazaIrASector(id); return; }
  plz.sector = id; plz.posGuardada = null;
  showView('plaza');
}

// Atajo a la Casa de la Selección: te deja frente a su puerta en el Shopping.
function mundoIrALaSeleccion(){
  if(!mundo.seleccionOn){ if(typeof mostrarToast === 'function') mostrarToast('La Casa de la Selección está cerrada en este viaje'); return; }
  if(typeof micCerrarSiempre === 'function') micCerrarSiempre();
  const e = PLZ_SECTORES.shopping.armar().edificios.find(x => x.id === 'seleccion');
  const z = e ? plazaZonaPuerta(e) : { x: 38, y: 420, w: 72, h: 40 };
  const pos = { x: z.x + z.w / 2, y: z.y + z.h / 2 + 6 };
  const activa = document.querySelector('.view.active');
  if(activa && activa.id === 'view-plaza' && typeof plazaCambiarSector === 'function'){ plazaCambiarSector('shopping', pos); return; }
  plz.sector = 'shopping';
  plz.posGuardada = { x: pos.x, y: pos.y, t: Date.now(), viaje: (typeof codigoViaje !== 'undefined' ? codigoViaje : ''), sector: 'shopping' };
  showView('plaza');
}

// Atajo a Padelbus: abre directo la pantalla del juego (la puerta está al fondo de la Plaza).
function mundoIrAPadelbus(){
  if(!mundo.padelOn){ if(typeof mostrarToast === 'function') mostrarToast('Padelbus está cerrado en este viaje'); return; }
  if(typeof micCerrarSiempre === 'function') micCerrarSiempre();
  showView('padel');
}

// Atajo a la confitería bailable: te deja frente a la puerta de neón de la Plaza.
function mundoIrAlBoliche(){
  if(!mundo.bolicheOn){ if(typeof mostrarToast === 'function') mostrarToast('La confitería bailable está cerrada en este viaje'); return; }
  if(typeof micCerrarSiempre === 'function') micCerrarSiempre();
  const e = PLZ_SECTORES.plaza.armar().edificios.find(x => x.id === 'boliche');
  const z = e ? plazaZonaPuerta(e) : { x: 530, y: 680, w: 72, h: 40 };
  const pos = { x: z.x + z.w / 2, y: z.y + z.h / 2 + 6 };
  const activa = document.querySelector('.view.active');
  if(activa && activa.id === 'view-plaza' && typeof plazaCambiarSector === 'function'){ plazaCambiarSector('plaza', pos); return; }
  plz.sector = 'plaza';
  plz.posGuardada = { x: pos.x, y: pos.y, t: Date.now(), viaje: (typeof codigoViaje !== 'undefined' ? codigoViaje : ''), sector: 'plaza' };
  showView('plaza');
}
