// Vidriera del pueblo: publicidad de negocios del pueblo de los chicos (no
// del destino del viaje, eso es Comercios adheridos). Cada negocio carga un
// flyer, una promo y preguntas sobre su producto; los chicos ganan:
//   - tocar la promo: +3 monedas (una vez por día y negocio)
//   - responder bien la pregunta del día: +10 monedas y un sello (con racha
//     de días seguidos el premio sube)
//   - con los sellos que pida cada negocio: un cupón real con QR que el
//     negocio escanea con su celular para confirmarlo (como Comercios).
// Las monedas van solo a la billetera: NO suman al ranking ni a la Copa.
//
// El cartel aparece solo: al abrir la app y al terminar un juego, con un
// mínimo de minutos entre uno y otro y un tope por día. La cruz aparece a los
// pocos segundos. Además está el botón "Vidriera del día" para entrar cuando
// quieran.
//
// Datos:
//   agencias/{ag}/vidriera/{pueblo}/{id}            el negocio
//   agencias/{ag}/vidriera/{pueblo}__flyers/{id}    las páginas del flyer
//   agencias/{ag}/vidrieraStats/{pueblo}/{id}/{día} vistas, toques, respuestas, cupones, canjes
//   salas/{viaje}/pueblo                            pueblo de origen del viaje
//   salas/{viaje}/vidriera/{asiento}/{id}           sellos, días respondidos, cupones
//   salas/{viaje}/vidrieraRacha/{asiento}           { dias, ultima }

const VID_MIN_ENTRE_MS = 5 * 60000;
const VID_MAX_DIA = 6;
const VID_CRUZ_SEG = 3;
const VID_MONEDAS_TOQUE = 3;
const VID_MONEDAS_RESPUESTA = 10;
const VID_SELLOS_DEFECTO = 5;
const VID_RUBROS = ['Heladería', 'Librería', 'Ropa', 'Deportes', 'Comida', 'Panadería', 'Kiosco', 'Juguetería', 'Otros'];

let vidAgencia = null, vidPueblo = null, vidNegocios = {}, vidMios = {}, vidRacha = { dias: 0, ultima: '' };
let vidCodigoEscuchado = '', vidRefNeg = null, vidRefMios = null;
const vidFlyers = {};
let vidAbierto = null;          // id del negocio abierto en la pantalla Vidriera
let vidPreguntaAbierta = null;  // id del negocio con la pregunta en pantalla

function vidEsc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function vidHoy(){ return new Date().toLocaleDateString('en-CA'); }
function vidSlug(t){ return String(t || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function vidDia(){ return Math.floor(new Date(vidHoy() + 'T12:00:00').getTime() / 86400000); }
function vidActivos(){ return Object.keys(vidNegocios).filter(id => vidNegocios[id] && vidNegocios[id].activo !== false).map(id => Object.assign({ id }, vidNegocios[id])); }
function vidMio(id){ return vidMios[id] || {}; }
function vidPreguntaDelDia(n){
  const ps = (n.preguntas || []).filter(p => p && p.t && p.o && p.o.length >= 2);
  if(!ps.length) return null;
  // Cada negocio arranca en otra pregunta, así no se repiten todas el mismo día.
  let h = 0; for(const ch of n.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ps[(vidDia() + h) % ps.length];
}
function vidRespondioHoy(id){ return vidMio(id).resp === vidHoy(); }
function vidPendientes(){ return vidActivos().filter(n => vidPreguntaDelDia(n) && !vidRespondioHoy(n.id)).length; }
function vidMultiplicador(){ const d = vidRacha.dias || 0; return d >= 7 ? 2 : d >= 3 ? 1.5 : 1; }

function vidRefMio(){ return db.ref('salas/' + codigoViaje + '/vidriera/' + miAsiento); }
function vidStat(id, campo){
  if(!vidAgencia || !vidPueblo) return;
  db.ref('agencias/' + vidAgencia + '/vidrieraStats/' + vidPueblo + '/' + id + '/' + vidHoy() + '/' + campo).transaction(v => (Number(v) || 0) + 1);
}

// ---- Escuchar el pueblo del viaje, sus negocios y mi progreso ----
function vidEscuchar(){
  if(typeof codigoViaje === 'undefined' || !codigoViaje || !miAsiento || vidCodigoEscuchado === codigoViaje) return;
  vidCodigoEscuchado = codigoViaje;
  db.ref('salas/' + codigoViaje + '/agenciaId').once('value').then(sa => {
    vidAgencia = sa.val() || null;
    db.ref('salas/' + codigoViaje + '/pueblo').on('value', sp => {
      vidPueblo = vidSlug(sp.val() || '') || null;
      if(vidRefNeg) vidRefNeg.off();
      vidNegocios = {};
      if(!vidAgencia || !vidPueblo){ vidRefrescar(); return; }
      vidRefNeg = db.ref('agencias/' + vidAgencia + '/vidriera/' + vidPueblo);
      vidRefNeg.on('value', s => { vidNegocios = s.val() || {}; vidRefrescar(); });
    });
  });
  vidRefMios = vidRefMio();
  vidRefMios.on('value', s => { vidMios = s.val() || {}; vidRefrescar(); });
  db.ref('salas/' + codigoViaje + '/vidrieraRacha/' + miAsiento).on('value', s => { vidRacha = s.val() || { dias: 0, ultima: '' }; });
}
function vidRefrescar(){
  const activa = document.querySelector('.view.active');
  if(activa && activa.id === 'view-vidriera' && !vidPreguntaAbierta) renderVidriera();
  document.querySelectorAll('.vid-badge').forEach(b => { const n = vidPendientes(); b.textContent = n || ''; b.style.display = n ? '' : 'none'; });
}

function vidCargarFlyer(id){
  if(vidFlyers[id]) return Promise.resolve(vidFlyers[id]);
  if(!vidAgencia || !vidPueblo) return Promise.resolve([]);
  return db.ref('agencias/' + vidAgencia + '/vidriera/' + vidPueblo + '__flyers/' + id).once('value').then(s => {
    const v = s.val();
    vidFlyers[id] = v && v.paginas ? (Array.isArray(v.paginas) ? v.paginas : Object.keys(v.paginas).map(k => v.paginas[k])) : [];
    return vidFlyers[id];
  }).catch(() => []);
}

// ---- Premios ----
function vidTocar(id){
  const m = vidMio(id);
  vidStat(id, 'toques');
  if(m.toque === vidHoy()) return;
  vidRefMio().child(id).update({ toque: vidHoy() });
  regalarMonedas(VID_MONEDAS_TOQUE);
  mostrarToast('+' + VID_MONEDAS_TOQUE + ' monedas por mirar la promo 🪙', 'gain');
}
function vidResponder(id, k){
  const n = vidNegocios[id] ? Object.assign({ id }, vidNegocios[id]) : null;
  if(!n || vidRespondioHoy(id)) return;
  const p = vidPreguntaDelDia(n); if(!p) return;
  const ok = k === Number(p.c || 0);
  const hoy = vidHoy();
  vidPreguntaAbierta = null;
  vidStat(id, ok ? 'ok' : 'mal');
  // Racha: días seguidos respondiendo (cualquier negocio).
  const ayer = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
  if(vidRacha.ultima !== hoy){
    vidRacha = { dias: vidRacha.ultima === ayer ? (vidRacha.dias || 0) + 1 : 1, ultima: hoy };
    db.ref('salas/' + codigoViaje + '/vidrieraRacha/' + miAsiento).set(vidRacha);
  }
  const m = vidMio(id);
  const cambios = { resp: hoy };
  if(ok){
    const premio = Math.round(VID_MONEDAS_RESPUESTA * vidMultiplicador());
    regalarMonedas(premio);
    let sellos = (Number(m.sellos) || 0) + 1;
    const pide = Math.max(1, Number(n.sellos) || VID_SELLOS_DEFECTO);
    if(sellos >= pide && n.cupon){
      sellos -= pide;
      const cId = 'c' + Date.now().toString(36);
      cambios['cupones/' + cId] = { texto: String(n.cupon).slice(0, 120), creado: Date.now() };
      vidStat(id, 'cupones');
      setTimeout(() => mostrarToast('🎟️ ¡Ganaste un cupón de ' + n.nombre + '! Está en la Vidriera.', 'gain'), 2700);
    }
    cambios.sellos = sellos;
    mostrarToast('✅ ¡Correcto! +' + premio + ' monedas y un sello' + (vidMultiplicador() > 1 ? ' (racha 🔥)' : ''), 'gain');
  } else {
    regalarMonedas(1);
    mostrarToast('❌ Era: ' + p.o[Number(p.c || 0)] + '. La respuesta estaba en la promo. ¡Mañana hay otra!', 'loss');
  }
  vidRefMio().child(id).update(cambios);
  vidCerrarCartel();
  const activa = document.querySelector('.view.active');
  if(activa && activa.id === 'view-vidriera') setTimeout(renderVidriera, 50);
}

// ---- El cartel que aparece solo ----
let vidUltimoCartel = 0, vidMostrados = 0, vidMostradosDia = '';
let vidSesionAbierta = false, vidJuegoDesde = 0;
function vidLeerContador(){
  try { const c = JSON.parse(localStorage.getItem('vid-cartel') || '{}'); if(c.dia === vidHoy()){ vidMostrados = c.n || 0; vidUltimoCartel = c.ult || 0; } else { vidMostrados = 0; } } catch(e){}
  vidMostradosDia = vidHoy();
}
function vidGuardarContador(){ try { localStorage.setItem('vid-cartel', JSON.stringify({ dia: vidHoy(), n: vidMostrados, ult: vidUltimoCartel })); } catch(e){} }

// Lo llama showView: al abrir la app (primer Inicio de la sesión) y al salir
// de un juego en el que se estuvo al menos un minuto.
function vidAlCambiarVista(antes, despues){
  vidEscuchar();
  const juegos = typeof TABS_HIJOS_DE_JUEGOS !== 'undefined' ? TABS_HIJOS_DE_JUEGOS : [];
  const noCuentan = ['plaza', 'estacion', 'copa', 'busqueda', 'vidriera'];
  const esJuego = v => juegos.includes(v) && !noCuentan.includes(v);
  if(esJuego(despues)) vidJuegoDesde = Date.now();
  if(despues === 'home' && !vidSesionAbierta){ vidSesionAbierta = true; setTimeout(() => vidTalVezCartel(), 2500); return; }
  if(antes && esJuego(antes) && !esJuego(despues) && Date.now() - vidJuegoDesde > 60000) setTimeout(() => vidTalVezCartel(), 600);
}
function vidTalVezCartel(){
  if(document.getElementById('vid-cartel')) return;
  const activa = document.querySelector('.view.active');
  if(!activa || ['view-truco', 'view-copa', 'view-escape', 'view-onboard', 'view-codigo-viaje'].includes(activa.id)) return;
  if(vidMostradosDia !== vidHoy()) vidLeerContador();
  if(vidMostrados >= VID_MAX_DIA || Date.now() - vidUltimoCartel < VID_MIN_ENTRE_MS) return;
  const lista = vidActivos();
  if(!lista.length) return;
  // Primero los que todavía tienen la pregunta del día sin responder; entre esos, rota.
  const pend = lista.filter(n => vidPreguntaDelDia(n) && !vidRespondioHoy(n.id));
  const pool = pend.length ? pend : lista;
  const n = pool[vidMostrados % pool.length];
  vidMostrados++; vidUltimoCartel = Date.now(); vidGuardarContador();
  vidMostrarCartel(n.id);
}
function vidMostrarCartel(id){
  const n = Object.assign({ id }, vidNegocios[id] || {});
  const cont = document.querySelector('.screen') || document.body;
  const capa = document.createElement('div');
  capa.id = 'vid-cartel';
  capa.className = 'vid-cartel';
  const p = vidPreguntaDelDia(n);
  const yaResp = vidRespondioHoy(id);
  capa.innerHTML = `<div class="vid-cartel-caja">
      <div class="vid-cartel-cab"><span class="vid-etiqueta">Publicidad · negocio de tu pueblo</span><button class="vid-cruz" id="vid-cruz" disabled>${VID_CRUZ_SEG}</button></div>
      <div class="vid-flyer" id="vid-cartel-flyer" onclick="vidTocar('${id}');vidAbrirNegocio('${id}')"><div class="vid-flyer-cargando">${vidEsc(n.nombre)}</div></div>
      <div class="vid-nombre">${vidEsc(n.nombre)}</div>
      ${n.promo ? `<div class="vid-promo">${vidEsc(n.promo)}</div>` : ''}
      <div class="vid-botones">
        <button class="gbtn" onclick="vidTocar('${id}');vidAbrirNegocio('${id}')">👀 Ver la promo <small>+${VID_MONEDAS_TOQUE} 🪙</small></button>
        ${p && !yaResp ? `<button class="gbtn gbtn-quiero" onclick="vidAbrirPregunta('${id}')">❓ Pregunta del día <small>+${Math.round(VID_MONEDAS_RESPUESTA * vidMultiplicador())} 🪙 y un sello</small></button>` : ''}
      </div>
    </div>`;
  cont.appendChild(capa);
  vidStat(id, 'vistas');
  vidCargarFlyer(id).then(pags => { const f = document.getElementById('vid-cartel-flyer'); if(f && pags.length) f.innerHTML = `<img src="${pags[0]}" alt="Promo de ${vidEsc(n.nombre)}">`; });
  let s = VID_CRUZ_SEG;
  const t = setInterval(() => {
    const b = document.getElementById('vid-cruz'); if(!b){ clearInterval(t); return; }
    s--; if(s > 0){ b.textContent = s; return; }
    clearInterval(t); b.disabled = false; b.textContent = '✕'; b.onclick = vidCerrarCartel;
  }, 1000);
}
function vidCerrarCartel(){ const c = document.getElementById('vid-cartel'); if(c) c.remove(); }
function vidAbrirNegocio(id){ vidCerrarCartel(); vidAbierto = id; vidPreguntaAbierta = null; showView('vidriera'); }
function vidAbrirPregunta(id){ vidCerrarCartel(); vidAbierto = id; vidPreguntaAbierta = id; showView('vidriera'); }

// ---- Pantalla "Vidriera del día" ----
function iniciarVidriera(){ vidEscuchar(); renderVidriera(); }
function vidSellosHTML(n){
  const pide = Math.max(1, Number(n.sellos) || VID_SELLOS_DEFECTO), tengo = Math.min(pide, Number(vidMio(n.id).sellos) || 0);
  return `<span class="vid-sellos" title="${tengo} de ${pide} sellos">${Array.from({ length: pide }, (_, i) => `<span class="vid-sello${i < tengo ? ' vid-sello-on' : ''}">${i < tengo ? '★' : ''}</span>`).join('')}</span>`;
}
function vidCuponesDe(id){ const c = vidMio(id).cupones || {}; return Object.keys(c).map(k => Object.assign({ id: k }, c[k])).sort((a, b) => b.creado - a.creado); }
function renderVidriera(){
  const cont = document.getElementById('vidriera-content'); if(!cont) return;
  if(vidAbierto && vidNegocios[vidAbierto]) return renderVidrieraNegocio(cont, vidAbierto);
  vidAbierto = null;
  const lista = vidActivos();
  let h = gDialogoHTML('🏪 Vidriera del día', 'Negocios de tu pueblo. Mirá sus promos y respondé la pregunta del día: ganás monedas y sellos, y con los sellos, cupones de descuento de verdad.');
  if(vidRacha.dias) h += `<div class="g-hud"><span class="g-pill">🔥 Racha: ${vidRacha.dias} día${vidRacha.dias === 1 ? '' : 's'}</span>${vidMultiplicador() > 1 ? `<span class="g-pill">Premio x${vidMultiplicador()}</span>` : '<span class="g-pill">3 días seguidos: premio x1,5</span>'}</div>`;
  if(!lista.length) h += gDialogoHTML('Todavía no hay negocios', 'Muy pronto van a aparecer acá los negocios de tu pueblo.');
  lista.forEach(n => {
    const p = vidPreguntaDelDia(n), resp = vidRespondioHoy(n.id), cup = vidCuponesDe(n.id).filter(c => !c.canjeado);
    h += `<div class="vid-card" onclick="vidTocar('${n.id}');vidAbierto='${n.id}';renderVidriera()">
      <div class="vid-card-img" id="vid-mini-${n.id}">🏪</div>
      <div class="vid-card-datos"><div class="vid-nombre">${vidEsc(n.nombre)}</div>${n.promo ? `<div class="vid-promo-chica">${vidEsc(n.promo)}</div>` : ''}
        <div>${vidSellosHTML(n)}</div>
        <div class="vid-card-estado">${p ? (resp ? '✅ Pregunta de hoy respondida' : '❓ Pregunta del día disponible') : ''}${cup.length ? ` · 🎟️ ${cup.length} cupón${cup.length === 1 ? '' : 'es'}` : ''}</div></div>
    </div>`;
  });
  cont.innerHTML = gEscenaHTML('cielo', h);
  lista.forEach(n => vidCargarFlyer(n.id).then(pags => { const e = document.getElementById('vid-mini-' + n.id); if(e && pags.length) e.innerHTML = `<img src="${pags[0]}" alt="">`; }));
}
function renderVidrieraNegocio(cont, id){
  const n = Object.assign({ id }, vidNegocios[id]);
  const p = vidPreguntaDelDia(n), resp = vidRespondioHoy(id);
  const pide = Math.max(1, Number(n.sellos) || VID_SELLOS_DEFECTO);
  let h = '';
  if(vidPreguntaAbierta === id && p && !resp){
    h += gDialogoHTML('❓ Pregunta del día · ' + vidEsc(n.nombre), 'La respuesta está en la promo. Una sola oportunidad por día.');
    h += gDialogoHTML(vidEsc(p.t), '');
    h += `<div class="g-acciones" style="grid-template-columns:1fr;">${p.o.map((o, k) => `<button class="gbtn gbtn-ancho" onclick="vidResponder('${id}',${k})">${vidEsc(o)}</button>`).join('')}</div>`;
    h += `<div class="g-pie"><span onclick="vidPreguntaAbierta=null;renderVidriera()">‹ Ver la promo primero</span></div>`;
    cont.innerHTML = gEscenaHTML('cielo', h);
    return;
  }
  h += `<div class="vid-flyer-grande" id="vid-flyer-grande"><div class="vid-flyer-cargando">Cargando la promo…</div></div>`;
  h += `<div class="g-dialogo"><div class="g-dialogo-titulo">${vidEsc(n.nombre)}</div>${n.promo ? `<div class="g-dialogo-sub">${vidEsc(n.promo)}</div>` : ''}<div style="margin-top:6px;">${vidSellosHTML(n)} <span style="font-size:12px;">${n.cupon ? 'Con ' + pide + ' sellos: ' + vidEsc(n.cupon) : ''}</span></div></div>`;
  if(p && !resp) h += `<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-quiero" onclick="vidPreguntaAbierta='${id}';renderVidriera()">❓ Responder la pregunta del día <small>+${Math.round(VID_MONEDAS_RESPUESTA * vidMultiplicador())} 🪙 y un sello</small></button></div>`;
  else if(p) h += gDialogoHTML('✅ Ya respondiste hoy', 'Mañana hay una pregunta nueva.');
  const cups = vidCuponesDe(id);
  if(cups.length){
    h += '<div class="section-label">🎟️ Tus cupones</div>';
    cups.forEach(c => {
      h += `<div class="vid-cupon${c.canjeado ? ' vid-cupon-usado' : ''}"><div><b>${vidEsc(c.texto)}</b><br><small>${c.canjeado ? 'Usado el ' + new Date(c.canjeado).toLocaleDateString('es-AR') : 'Mostrale este QR al negocio'}</small></div>${c.canjeado ? '' : `<div class="vid-qr" id="vid-qr-${c.id}"></div>`}</div>`;
    });
  }
  h += `<div class="g-pie"><span onclick="vidAbierto=null;renderVidriera()">‹ Todos los negocios</span></div>`;
  cont.innerHTML = gEscenaHTML('cielo', h);
  vidCargarFlyer(id).then(pags => { const f = document.getElementById('vid-flyer-grande'); if(f) f.innerHTML = pags.length ? pags.map(src => `<img src="${src}" alt="Promo de ${vidEsc(n.nombre)}">`).join('') : ''; });
  cups.filter(c => !c.canjeado).forEach(c => {
    const el = document.getElementById('vid-qr-' + c.id);
    if(el && window.QRCode) new QRCode(el, { text: vidUrlCupon(id, c.id), width: 120, height: 120, correctLevel: QRCode.CorrectLevel.M });
  });
}
function vidUrlCupon(neg, c){ return location.origin + location.pathname + '?cupon=1&viaje=' + encodeURIComponent(codigoViaje) + '&asiento=' + encodeURIComponent(miAsiento) + '&neg=' + encodeURIComponent(neg) + '&c=' + encodeURIComponent(c); }

// ---- Pantalla del negocio al escanear el cupón (sin el resto de la app) ----
function vidLeerParamsCupon(){
  const q = new URLSearchParams(location.search);
  if(q.get('cupon') !== '1') return null;
  return { viaje: (q.get('viaje') || '').toUpperCase(), asiento: q.get('asiento') || '', neg: q.get('neg') || '', c: q.get('c') || '' };
}
function vidMostrarPantallaCupon(d){
  const pantalla = html => { document.body.innerHTML = comerciosCanjePantallaHTML(html); };
  pantalla('<p style="text-align:center;margin-top:40px;">Cargando…</p>');
  if(!d.viaje || !d.asiento || !d.neg || !d.c){ pantalla('<div class="hero"><h2>Cupón incompleto</h2></div>'); return; }
  db.ref('salas/' + d.viaje).once('value').then(s => {
    const sala = s.val();
    if(!sala){ pantalla('<div class="hero"><h2>No se encontró el viaje</h2></div>'); return; }
    const pasajero = (sala.ranking && sala.ranking.puntos && sala.ranking.puntos[d.asiento]) || {};
    const cupon = sala.vidriera && sala.vidriera[d.asiento] && sala.vidriera[d.asiento][d.neg] && sala.vidriera[d.asiento][d.neg].cupones && sala.vidriera[d.asiento][d.neg].cupones[d.c];
    const pueblo = vidSlug(sala.pueblo || '');
    db.ref('agencias/' + sala.agenciaId + '/vidriera/' + pueblo + '/' + d.neg).once('value').then(sn => {
      const neg = sn.val() || {};
      if(!cupon){ pantalla('<div class="hero"><h2>Este cupón no existe</h2></div>'); return; }
      if(cupon.canjeado){ pantalla(`<div class="hero"><h2>✅ Cupón ya usado</h2><p>${vidEsc(cupon.texto)}</p><p>Se usó el ${new Date(cupon.canjeado).toLocaleString('es-AR')}. No se puede usar dos veces.</p></div>`); return; }
      pantalla(`<div class="hero"><h2>${vidEsc(neg.nombre || 'Cupón')}</h2><p style="font-size:18px;"><b>${vidEsc(cupon.texto)}</b></p></div>
        <div class="comercio-confirmar-box"><p><b>Cliente:</b> ${vidEsc(pasajero.nombre || 'Pasajero')}</p></div>
        <button class="btn-primary" onclick="vidConfirmarCupon('${vidEsc(d.viaje)}','${vidEsc(d.asiento)}','${vidEsc(d.neg)}','${vidEsc(d.c)}','${vidEsc(sala.agenciaId)}','${vidEsc(pueblo)}')">Confirmar: el cupón se usó</button>
        <p class="link-chico" style="text-align:center;">Este botón lo toca el negocio, una sola vez.</p>`);
    });
  });
}
function vidConfirmarCupon(viaje, asiento, neg, c, ag, pueblo){
  db.ref('salas/' + viaje + '/vidriera/' + asiento + '/' + neg + '/cupones/' + c).transaction(x => {
    if(!x || x.canjeado) return;
    x.canjeado = Date.now(); return x;
  }).then(r => {
    if(r && r.committed) db.ref('agencias/' + ag + '/vidrieraStats/' + pueblo + '/' + neg + '/' + vidHoy() + '/canjes').transaction(v => (Number(v) || 0) + 1);
    vidMostrarPantallaCupon({ viaje, asiento, neg, c });
  });
}

// Tarjeta para Inicio y Juegos.
function vidTarjetaHTML(){
  if(!vidActivos().length) return '';
  const n = vidPendientes();
  return `<div class="categoria-juegos categoria-juegos-busqueda" onclick="vidAbierto=null;vidPreguntaAbierta=null;showView('vidriera')" style="background:linear-gradient(135deg,#1e9e52,#4cc9f0);"><span class="categoria-juegos-icono">🏪</span><div class="categoria-juegos-info"><h2>Vidriera del día <span class="vid-badge" style="${n ? '' : 'display:none;'}background:#E5484D;color:#fff;border-radius:999px;padding:0 8px;font-size:13px;">${n || ''}</span></h2><p>Promos de tu pueblo: monedas, sellos y cupones</p></div><span class="categoria-juegos-flecha">›</span></div>`;
}

// ---- Panel del organizador: negocios de cada pueblo ----
let vidAdminMostrando = false, vidAdminPueblo = '', vidAdminLista = {}, vidAdminStats = {};
function mostrarAdminVidriera(){ vidAdminMostrando = true; renderAdminVidriera(); }
function renderAdminVidriera(){
  const cont = document.getElementById('admin-vidriera-content'); if(!cont) return;
  if(!vidAdminMostrando){ cont.innerHTML = ''; return; }
  if(!agenciasEsOrganizador()){ cont.innerHTML = agenciasFormularioLoginHTML('admin-vidriera', 'renderAdminVidriera'); return; }
  let h = `<p class="link-chico">Conectado como ${agenciaActualNombre}.</p>
    <div class="section-label">🏪 Vidriera: publicidad de negocios del pueblo de los chicos</div>
    <p style="font-size:12.5px;color:var(--gray);margin-bottom:6px;">Cada viaje tiene su pueblo de origen (botón 🏘️ en Viajes): los chicos ven los negocios de ese pueblo. Solo rubros aptos para chicos (nada de alcohol, energizantes, apuestas ni préstamos). Los chicos ganan monedas y sellos, no puntos del ranking.</p>
    <input type="text" id="vid-adm-pueblo" class="bingo-input-numero" style="width:100%;" placeholder="Pueblo (ej: Rufino)" value="${vidEsc(vidAdminPueblo)}">
    <button class="btn-ghost" onclick="vidAdminCargar()">Ver negocios de este pueblo</button>`;
  if(vidAdminPueblo){
    const ids = Object.keys(vidAdminLista);
    h += `<div class="section-label">Negocios de ${vidEsc(vidAdminPueblo)}</div>`;
    if(!ids.length) h += '<p style="color:var(--gray);font-size:13px;">Todavía no hay negocios. Con 2 o 3 alcanza.</p>';
    ids.forEach(id => { h += vidAdminFormHTML(id, vidAdminLista[id]); });
    h += '<div class="section-label">Agregar negocio</div>' + vidAdminFormHTML('nuevo', null);
  }
  cont.innerHTML = h;
}
function vidAdminStatsHTML(id){
  const st = vidAdminStats[id] || {}, t = { vistas: 0, toques: 0, ok: 0, mal: 0, cupones: 0, canjes: 0 };
  Object.keys(st).forEach(dia => Object.keys(t).forEach(k => { t[k] += Number(st[dia][k]) || 0; }));
  return `<p style="font-size:12px;margin:4px 0 8px;background:#f3f7fb;border-radius:8px;padding:6px 8px;">📊 Lo vieron <b>${t.vistas}</b> veces · tocaron la promo <b>${t.toques}</b> · respondieron <b>${t.ok + t.mal}</b> (${t.ok} bien) · cupones ganados <b>${t.cupones}</b> · usados en el local <b>${t.canjes}</b></p>`;
}
function vidAdminFormHTML(id, n){
  n = n || { activo: true, sellos: VID_SELLOS_DEFECTO, preguntas: [] };
  const pre = 'vid-' + id + '-';
  const preg = Array.from({ length: 7 }, (_, i) => (n.preguntas || [])[i] || null);
  return `<div class="comercio-admin-card">
    ${id !== 'nuevo' ? vidAdminStatsHTML(id) : ''}
    <input type="text" id="${pre}nombre" class="bingo-input-numero" style="width:100%;" placeholder="Nombre del negocio" value="${vidEsc(n.nombre || '')}">
    <input type="text" id="${pre}rubro" class="bingo-input-numero" style="width:100%;" list="vid-rubros" placeholder="Rubro" value="${vidEsc(n.rubro || '')}">
    <input type="text" id="${pre}promo" class="bingo-input-numero" style="width:100%;" maxlength="140" placeholder="Promo en una línea (ej: Nuevo helado de Nutella, 2x1 los sábados)" value="${vidEsc(n.promo || '')}">
    ${typeof flyerSubirHTML === 'function' ? flyerSubirHTML('vid-' + id, n.flyerPaginas ? { flyerSubido: true, flyerPaginas: n.flyerPaginas } : null) : ''}
    <div style="display:flex;gap:6px;align-items:center;font-size:13px;margin:6px 0;"><label>Sellos para el cupón <input type="number" id="${pre}sellos" min="1" max="20" value="${Number(n.sellos) || VID_SELLOS_DEFECTO}" style="width:60px;"></label></div>
    <input type="text" id="${pre}cupon" class="bingo-input-numero" style="width:100%;" maxlength="120" placeholder="Qué da el cupón (ej: 15% en el helado nuevo)" value="${vidEsc(n.cupon || '')}">
    <p style="font-size:12px;color:var(--gray);margin:6px 0 2px;"><b>Preguntas</b> (sale una distinta cada día; la respuesta tiene que estar en el flyer o en la promo). Escribí la correcta en el primer casillero de respuesta.</p>
    ${preg.map((p, i) => `<div style="display:grid;grid-template-columns:1fr;gap:3px;margin-bottom:6px;"><input type="text" id="${pre}p${i}" style="font-size:12.5px;" placeholder="Pregunta ${i + 1}${i ? ' (opcional)' : ' (ej: ¿Qué gusto nuevo lanzamos?)'}" value="${vidEsc(p ? p.t : '')}"><div style="display:flex;gap:3px;">${[0, 1, 2].map(k => `<input type="text" id="${pre}p${i}o${k}" style="flex:1;font-size:12px;${k === 0 ? 'border-color:#1e9e52;' : ''}" placeholder="${k === 0 ? '✔ correcta' : 'otra'}" value="${vidEsc(p && p.o ? (k === 0 ? p.o[Number(p.c || 0)] : p.o.filter((_, j) => j !== Number(p.c || 0))[k - 1] || '') : '')}">`).join('')}</div></div>`).join('')}
    <label class="comercio-admin-checkbox"><input type="checkbox" id="${pre}activo" ${n.activo !== false ? 'checked' : ''}> Activo (lo ven los chicos)</label>
    <div style="display:flex;gap:8px;margin-top:6px;">
      <button class="btn-primary" style="margin-top:0;" onclick="vidAdminGuardar('${id}')">${id === 'nuevo' ? 'Agregar negocio' : 'Guardar'}</button>
      ${id !== 'nuevo' ? `<button class="btn-eliminar-pasajero" onclick="vidAdminEliminar('${id}')" title="Eliminar">✕</button>` : ''}
    </div>
    <datalist id="vid-rubros">${VID_RUBROS.map(r => `<option value="${r}">`).join('')}</datalist>
  </div>`;
}
function vidAdminRef(){ return db.ref('agencias/' + agenciaActualId + '/vidriera/' + vidSlug(vidAdminPueblo)); }
function vidAdminCargar(){
  vidAdminPueblo = (document.getElementById('vid-adm-pueblo').value || '').trim();
  if(!vidAdminPueblo){ renderAdminVidriera(); return; }
  Promise.all([vidAdminRef().once('value'), db.ref('agencias/' + agenciaActualId + '/vidrieraStats/' + vidSlug(vidAdminPueblo)).once('value').catch(() => null)]).then(([s, st]) => {
    vidAdminLista = s.val() || {}; vidAdminStats = (st && st.val()) || {};
    renderAdminVidriera();
  });
}
function vidAdminGuardar(id){
  const pre = 'vid-' + id + '-', v = k => (document.getElementById(pre + k) || {}).value || '';
  const nombre = v('nombre').trim();
  if(!nombre){ mostrarToast('Falta el nombre del negocio'); return; }
  const preguntas = [];
  for(let i = 0; i < 7; i++){
    const t = v('p' + i).trim(), o = [0, 1, 2].map(k => v('p' + i + 'o' + k).trim()).filter(Boolean);
    if(t && o.length >= 2 && v('p' + i + 'o0').trim()){
      // Se guarda con la correcta en un lugar al azar (así no es siempre la primera).
      const c = Math.floor(Math.random() * o.length);
      const ops = o.slice(1); ops.splice(c, 0, o[0]);
      preguntas.push({ t: t.slice(0, 160), o: ops.map(x => x.slice(0, 80)), c });
    }
  }
  const datos = { nombre: nombre.slice(0, 60), rubro: v('rubro').trim().slice(0, 30), promo: v('promo').trim().slice(0, 140), sellos: Math.max(1, Math.min(20, Number(v('sellos')) || VID_SELLOS_DEFECTO)), cupon: v('cupon').trim().slice(0, 120), activo: !!(document.getElementById(pre + 'activo') || {}).checked, preguntas, actualizado: Date.now() };
  const ref = id === 'nuevo' ? vidAdminRef().push() : vidAdminRef().child(id);
  const clave = 'vid-' + id;
  const pend = typeof flyerPendiente !== 'undefined' ? flyerPendiente[clave] : null;
  const quitar = typeof flyerQuitar !== 'undefined' ? flyerQuitar[clave] : null;
  if(pend) datos.flyerPaginas = pend.paginas.length;
  else if(quitar) datos.flyerPaginas = null;
  else if(id !== 'nuevo' && vidAdminLista[id]) datos.flyerPaginas = vidAdminLista[id].flyerPaginas || null;
  ref.set(datos).then(() => {
    const flyRef = db.ref('agencias/' + agenciaActualId + '/vidriera/' + vidSlug(vidAdminPueblo) + '__flyers/' + ref.key);
    let p = Promise.resolve();
    if(pend) p = flyRef.set({ paginas: pend.paginas, t: Date.now() });
    else if(quitar) p = flyRef.remove();
    if(typeof flyerPendiente !== 'undefined'){ delete flyerPendiente[clave]; delete flyerQuitar[clave]; }
    delete vidFlyers[ref.key];
    return p;
  }).then(() => { mostrarToast(id === 'nuevo' ? 'Negocio agregado' : 'Negocio guardado'); vidAdminCargar(); })
    .catch(e => mostrarToast('No se pudo guardar: ' + (e && e.message ? e.message : e)));
}
function vidAdminEliminar(id){
  if(!confirm('¿Eliminar este negocio de la Vidriera?')) return;
  Promise.all([vidAdminRef().child(id).remove(), db.ref('agencias/' + agenciaActualId + '/vidriera/' + vidSlug(vidAdminPueblo) + '__flyers/' + id).remove()]).then(vidAdminCargar);
}
// Pueblo de origen de un viaje (desde Viajes).
function adminCambiarPueblo(codigo, actual){
  const p = prompt('¿De qué pueblo son los chicos de este viaje? (para la Vidriera)', actual || '');
  if(p === null) return;
  db.ref('salas/' + codigo + '/pueblo').set(p.trim() ? p.trim().slice(0, 40) : null).then(() => { mostrarToast(p.trim() ? 'Pueblo: ' + p.trim() : 'Pueblo borrado'); renderAdminViajes(); });
}
