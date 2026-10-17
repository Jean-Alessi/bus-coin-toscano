// El mundo de Bus Coin: un micro con 5 paradas (ver sectores.js). Acá vive lo que comparten
// la Estación, el mapa de cada parada y el micro:
//   - el modo del viaje: "mundo" (por defecto) o "clásico" (sin mundo, solo menú de siempre),
//   - el recorrido real del viaje (las líneas de la cartelera) y en qué parada real estamos,
//   - el próximo bingo, que el coordinador anuncia y se ve en todas las paradas.
// Datos en salas/{viaje}/: ajustes/modo, ajustes/paradaReal (número de línea), ajustes/proximoBingo,
// feriaConfig/cartelera (líneas "Hora | Lugar").

const mundo = { modo: 'mundo', recorrido: [], actual: -1, bingo: '', oyentes: [], viaje: '', primera: true };

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
    mundoAlCambiar(antes);
  });
  escuchar('feriaConfig/cartelera', v => {
    mundo.recorrido = (Array.isArray(v) ? v : (v ? Object.keys(v).map(k => v[k]) : [])).filter(x => x != null).map(String);
    if(typeof estacionRender === 'function') estacionRender();
  });
}

function mundoSoltar(){
  mundo.oyentes.forEach(o => { try { o.r.off('value', o.cb); } catch(e){} });
  mundo.oyentes = []; mundo.viaje = '';
}

function mundoAlCambiar(modoAntes){
  const activa = document.querySelector('.view.active');
  const id = activa ? activa.id.replace('view-', '') : '';
  if(!mundoActivo() && (id === 'plaza' || id === 'estacion')) showView('home');
  else if(mundoActivo() && mundo.primera && id === 'home'){
    // Al entrar a un viaje con mundo, la app arranca en la Estación (una vez por sesión).
    let ya = false;
    try { ya = sessionStorage.getItem('mundo-abierto-' + codigoViaje) === '1'; sessionStorage.setItem('mundo-abierto-' + codigoViaje, '1'); } catch(e){}
    if(!ya) showView('estacion');
  }
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
  }).join('');
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
