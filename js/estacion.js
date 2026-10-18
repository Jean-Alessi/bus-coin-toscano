// Estación Busmac: la pantalla de arranque del mundo. Un micro, 5 paradas y un par de atajos.
// Desde acá se elige a qué parada ir (libre, cuando quieras), se ve cuántos hay en cada una,
// el recorrido real del viaje y el próximo bingo, y se puede mirar el micro por dentro.

let estacionOyente = null, estacionRefPlaza = null, estacionConteos = {};

function iniciarEstacion(){
  estacionSoltar();
  if(typeof musicaSector === 'function') musicaSector('estacion');
  if(typeof mundoEscuchar === 'function') mundoEscuchar();
  estacionRender();
  if(typeof codigoViaje !== 'undefined' && codigoViaje){
    estacionRefPlaza = db.ref('salas/' + codigoViaje + '/plaza');
    estacionOyente = estacionRefPlaza.on('value', s => {
      estacionConteos = mundoContar(microLeerPresencia(s.val()));
      estacionRender();
    });
  }
}

function estacionSoltar(){
  if(typeof bolicheMusicaParar === 'function') bolicheMusicaParar();
  if(estacionRefPlaza && estacionOyente){ try { estacionRefPlaza.off('value', estacionOyente); } catch(e){} }
  estacionRefPlaza = null; estacionOyente = null;
}

// Pista del túnel secreto: cuando ya lo encontraron un par, corre el rumor (sin decir dónde exactamente).
function estacionRumorTunel(){
  if(typeof tunelSpot !== 'function' || !tunelActivo() || !mundoActivo()) return '';
  const n = Object.keys(mundo.tunelDesc || {}).length;
  if(n < 2 || (mundo.tunelDesc || {})[String(miAsiento)]) return '';
  const s = PLZ_SECTORES[tunelSpot().sector];
  return `<div class="est-rumor">🕳️ Corre el rumor: ${n} pasajeros encontraron un túnel secreto por el lado de <b>${mundoEsc(s.corto)}</b>… ¿lo encontrás?</div>`;
}

function estacionBusSVG(){
  return `<svg class="est-bus" viewBox="0 0 220 90" aria-hidden="true">
    <rect x="6" y="8" width="208" height="64" rx="14" fill="#0F2A4D"/>
    <rect x="6" y="38" width="208" height="3" fill="rgba(255,255,255,.25)"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${16 + i * 32}" y="16" width="24" height="18" rx="4" fill="#B6DDFF"/><rect x="${16 + i * 32}" y="46" width="24" height="18" rx="4" fill="${i === 2 || i === 3 ? 'none' : '#B6DDFF'}"/>`).join('')}
    <circle cx="52" cy="74" r="12" fill="#222"/><circle cx="52" cy="74" r="5" fill="#B8C2D1"/>
    <circle cx="168" cy="74" r="12" fill="#222"/><circle cx="168" cy="74" r="5" fill="#B8C2D1"/>
    <text x="110" y="62" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="800" font-size="12" fill="#FFD84D">BUSMAC</text>
  </svg>`;
}

function estacionRender(){
  const cont = document.getElementById('estacion-content');
  if(!cont) return;
  const activa = document.querySelector('.view.active');
  if(!activa || activa.id !== 'view-estacion') return;
  const bingo = typeof mundoTextoBingo === 'function' ? mundoTextoBingo() : '';
  cont.innerHTML = gEscenaHTML('cielo', `
    <div class="est-cabecera">${estacionBusSVG()}<div class="est-titulo">Estación ${typeof marcaCorta === 'function' ? mundoEsc(marcaCorta()) : 'Busmac'} ${typeof musicaBotonHTML === 'function' ? musicaBotonHTML() : ''}</div><div class="est-sub">Subite al micro y elegí a dónde ir. ¡Cuando quieras volvés!</div></div>
    ${(() => { const ev = typeof mundoEventoActivo === 'function' ? mundoEventoActivo() : null; return ev ? `<button class="est-evento" onclick="mundoIrA('${ev.sector}')">📢 ${mundoEsc(ev.texto)} <span>Ir a ${mundoEsc(PLZ_SECTORES[ev.sector].nombre)} ›</span></button>` : ''; })()}
    ${bingo ? `<button class="est-bingo" onclick="mundoIrA('eventos')">🎱 Próximo bingo: <b>${mundoEsc(bingo)}</b> <span>Ir al Salón de eventos ›</span></button>` : ''}
    ${typeof mundoRecorridoHTML === 'function' ? mundoRecorridoHTML() : ''}
    ${estacionRumorTunel()}
    <div class="est-lista">${mundoParadasHTML(estacionConteos, null, 'mundoIrA')}</div>
    <div class="est-botones">
      <button class="gbtn gbtn-ancho" onclick="microAbrir()">💺 El micro por dentro</button>
    </div>
    <div class="est-creditos"><a onclick="musicaCreditos()">🎵 Créditos de la música</a>${typeof musicaVersionHTML === 'function' ? musicaVersionHTML() : ''}</div>
    <div class="est-atajos"><span>Ir directo:</span>
      <button onclick="showView('ranking')">🏆 Ranking</button><button onclick="showView('juegos')">🎮 Juegos</button><button onclick="showView('tienda')">🎁 Premios</button><button onclick="showView('avatar')">👕 Mi personaje</button><button onclick="showView('comercios')">🏪 Comercios</button><button onclick="mundoIrAlBoliche()">🕺 Bailable</button><button onclick="mundoIrALaSeleccion()">⚽ Selección</button>
    </div>`, 'est-escena');
}
