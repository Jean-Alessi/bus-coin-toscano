// Vouchers de premio: lo que se lleva el ganador para reclamar su premio en la empresa.
//   - Ganadores del ranking (1° a 4° puesto): el premio es el que eligieron en Premios (salas/{viaje}/premios).
//   - Ganador del sorteo de la feria: el premio es el que cargó el organizador (salas/{viaje}/sorteo).
// El voucher NO se guarda como dato aparte: se arma siempre con lo que está en el viaje, así que solo existe si esa persona es ganadora de verdad.
// Cada voucher tiene dos pantallas que se abren directo desde un link (sin pasar por el ingreso al viaje, así siguen andando cuando el viaje ya terminó):
//   ?voucher=1&viaje=X&asiento=N&tipo=ranking|sorteo         → el voucher del ganador, con un QR para mostrar
//   ...&v=1                                                   → lo que ve la empresa al escanear el QR: si es válido y un botón (con PIN) para confirmar la entrega, una sola vez
// La entrega queda en salas/{viaje}/vouchers/{tipo}-{asiento} = { t, premio }.

const VOUCHER_TIPOS = { ranking: 'Premio del ranking', sorteo: 'Ganador del sorteo' };
const VOUCHER_PUESTOS = ['🥇 1° puesto', '🥈 2° puesto', '🥉 3° puesto', '🎗️ 4° puesto'];

function voucherEsc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

function voucherUrl(tipo, viaje, asiento, verificar){
  return `${location.origin}${location.pathname}?voucher=1&viaje=${encodeURIComponent(viaje)}&asiento=${encodeURIComponent(asiento)}&tipo=${encodeURIComponent(tipo)}${verificar ? '&v=1' : ''}`;
}

// ---- Vouchers que esta persona ya vio (para poder abrirlos aunque el viaje haya terminado) ----
function voucherGuardarLocal(v){
  let lista = []; try { lista = JSON.parse(localStorage.getItem('mis-vouchers')) || []; } catch(e){}
  lista = lista.filter(x => !(x.viaje === v.viaje && x.tipo === v.tipo && String(x.asiento) === String(v.asiento)));
  lista.unshift({ viaje: v.viaje, tipo: v.tipo, asiento: String(v.asiento), premio: v.premio, t: Date.now() });
  try { localStorage.setItem('mis-vouchers', JSON.stringify(lista.slice(0, 6))); } catch(e){}
}

// Arma lo que dice el voucher a partir de los datos del viaje. Devuelve null si esa persona no es ganadora.
function voucherResolver(sala, tipo, asiento){
  const pas = sala.ranking && sala.ranking.puntos && sala.ranking.puntos[asiento];
  const nombre = (pas && pas.nombre) || '';
  if(tipo === 'sorteo'){
    const g = sala.sorteo && sala.sorteo.ganador;
    if(!g || String(g.asiento) !== String(asiento)) return null;
    return { tipo, nombre: nombre || g.n || 'Asiento ' + asiento, premio: (sala.sorteo.premio || '').trim() || 'Premio del sorteo', detalle: 'Ganó el número #' + g.num, listo: true };
  }
  const p = sala.premios || {};
  const orden = Array.isArray(p.orden) ? p.orden : Object.values(p.orden || {});
  const i = orden.findIndex(x => String(x) === String(asiento));
  if(i < 0) return null;
  const el = p.elecciones ? p.elecciones[asiento] : null;
  const lista = Array.isArray(p.lista) ? p.lista : Object.values(p.lista || {});
  if(el == null) return { tipo, nombre: nombre || 'Asiento ' + asiento, premio: '', detalle: VOUCHER_PUESTOS[i] || (i + 1) + '° puesto', listo: false };
  return { tipo, nombre: nombre || 'Asiento ' + asiento, premio: lista[el] || 'Premio', detalle: VOUCHER_PUESTOS[i] || (i + 1) + '° puesto', listo: true };
}

function voucherFechaHora(t){ return new Date(t).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }

// ---- Tarjeta dentro de la app (Premios y Sorteo): QR chico + botón para abrir el voucher en pantalla completa ----
function voucherTarjetaHTML(tipo, viaje, asiento, premio){
  if(!viaje) return '';
  voucherGuardarLocal({ viaje, tipo, asiento, premio });
  return `<div class="g-dialogo" style="margin-top:14px;text-align:center;">
    <div class="g-dialogo-titulo">🎟️ Tu voucher de premio</div>
    <div class="g-dialogo-sub">${voucherEsc(premio)}</div>
    <div data-voucher-qr="${voucherEsc(voucherUrl(tipo, viaje, asiento, true))}" style="display:inline-block;background:#fff;padding:10px;border-radius:12px;margin:10px 0 6px;"></div>
    <p style="font-size:12.5px;opacity:.85;margin:0 0 8px;">Presentalo en la oficina de ${voucherEsc(typeof MARCA !== 'undefined' ? MARCA.nombreCorto : 'la empresa')} para retirar tu premio.</p>
    <button class="gbtn gbtn-ancho" onclick="location.href='${voucherEsc(voucherUrl(tipo, viaje, asiento, false))}'">Abrir mi voucher</button>
  </div>`;
}
// Dibuja los QR de las tarjetas que hay en pantalla.
function voucherPintarQRs(){
  if(!window.QRCode) return;
  document.querySelectorAll('[data-voucher-qr]').forEach(el => {
    if(el.dataset.listo === el.dataset.voucherQr) return;
    el.innerHTML = ''; new QRCode(el, { text: el.dataset.voucherQr, width: 150, height: 150, correctLevel: QRCode.CorrectLevel.M });
    el.dataset.listo = el.dataset.voucherQr;
  });
}

// ---- Pantallas que se abren desde el link (reemplazan la app) ----
function voucherLeerParams(){
  const q = new URLSearchParams(location.search);
  if(q.get('voucher') !== '1') return null;
  return { viaje: (q.get('viaje') || '').toUpperCase().trim(), asiento: (q.get('asiento') || '').trim(), tipo: q.get('tipo') === 'sorteo' ? 'sorteo' : 'ranking', verificar: q.get('v') === '1' };
}

function voucherPantalla(html){
  return `<style>
    .v-card{background:#fff;border-radius:22px;box-shadow:0 8px 28px rgba(15,42,77,.18);padding:22px 18px 20px;text-align:center;border-top:8px solid #E8720F;}
    .v-sello{display:inline-block;background:#0F2A4D;color:#FFD84D;font-weight:800;font-size:13px;letter-spacing:.8px;padding:6px 14px;border-radius:999px;}
    .v-premio{font-size:26px;font-weight:800;color:#0F2A4D;margin:14px 0 4px;line-height:1.15;}
    .v-detalle{font-size:14px;color:#E8720F;font-weight:700;margin-bottom:10px;}
    .v-datos{font-size:14px;color:#334;margin:6px 0 14px;line-height:1.5;}
    .v-qr{display:inline-block;background:#fff;padding:12px;border:2px dashed #cbd5e1;border-radius:14px;}
    .v-nota{font-size:12.5px;color:#556;margin:14px 6px 0;line-height:1.45;}
    .v-ok{background:#E7F8EE;color:#14753C;border-radius:12px;padding:10px;font-weight:800;margin:12px 0;}
    .v-ya{background:#FDECEC;color:#B3261E;border-radius:12px;padding:10px;font-weight:800;margin:12px 0;}
    .v-pend{background:#FFF4DB;color:#8A5A00;border-radius:12px;padding:10px;font-weight:700;margin:12px 0;}
    .v-btn{display:block;width:100%;border:none;border-radius:14px;padding:14px;font-size:16px;font-weight:800;background:#E8720F;color:#fff;margin-top:10px;cursor:pointer;font-family:inherit;}
    .v-link{display:block;text-align:center;margin-top:14px;font-size:13px;color:#667;text-decoration:underline;cursor:pointer;}
  </style><div class="device"><div class="screen" style="justify-content:flex-start;overflow:auto;">
    <div class="statusbar"><img src="logo-empresa.png?v=2" alt="Logo" class="statusbar-logo"><span class="statusbar-brand">${MARCA.marcaPrincipal} <em>${MARCA.marcaSecundaria}</em></span></div>
    <div class="view active" style="padding:18px 16px;">${html}</div></div></div>`;
}
function voucherError(msg){ document.body.innerHTML = voucherPantalla(`<div class="v-card"><div class="v-premio" style="font-size:20px;">No se pudo abrir</div><p class="v-nota">${msg}</p></div>`); }

function voucherMostrarPantalla(d){
  document.body.innerHTML = voucherPantalla('<p style="text-align:center;color:#667;margin-top:40px;">Cargando…</p>');
  if(!d.viaje || !d.asiento){ voucherError('Este link de voucher está incompleto.'); return; }
  db.ref('salas/' + d.viaje).once('value').then(snap => {
    if(!snap.exists()){ voucherError('Este viaje no existe.'); return; }
    const sala = snap.val() || {};
    const v = voucherResolver(sala, d.tipo, d.asiento);
    if(!v){ voucherError('No hay ningún premio a nombre de este asiento en el viaje ' + voucherEsc(d.viaje) + '.'); return; }
    const entrega = sala.vouchers && sala.vouchers[d.tipo + '-' + d.asiento];
    const cabecera = `<div class="v-sello">🎟️ VOUCHER DE PREMIO</div>
      ${v.listo ? `<div class="v-premio">${voucherEsc(v.premio)}</div>` : '<div class="v-premio" style="font-size:20px;">Premio sin elegir todavía</div>'}
      <div class="v-detalle">${voucherEsc(v.detalle)}</div>
      <div class="v-datos">Ganador/a: <b>${voucherEsc(v.nombre)}</b><br>Asiento ${voucherEsc(d.asiento)} · Viaje <b>${voucherEsc(d.viaje)}</b></div>`;
    if(!v.listo){
      document.body.innerHTML = voucherPantalla(`<div class="v-card">${cabecera}<div class="v-pend">Todavía no elegiste tu premio. Cuando lo elijas en la app, acá aparece tu voucher.</div></div>`);
      return;
    }
    const estado = entrega ? `<div class="v-ya">✅ Premio ya retirado el ${voucherFechaHora(entrega.t)}. No se puede usar de nuevo.</div>` : `<div class="v-ok">${d.verificar ? '✅ VOUCHER VÁLIDO · pendiente de entrega' : 'Pendiente de entrega'}</div>`;
    if(d.verificar){ // lo que ve la empresa al escanear
      document.body.innerHTML = voucherPantalla(`<div class="v-card">${cabecera}${estado}
        ${entrega ? '' : `<button class="v-btn" onclick="voucherConfirmarEntrega('${voucherEsc(d.viaje)}','${d.tipo}','${voucherEsc(d.asiento)}')">Confirmar entrega del premio</button><p class="v-nota">Lo toca la empresa, una sola vez, con el PIN del organizador. Pedí el DNI del ganador.</p>`}</div>`);
      return;
    }
    document.body.innerHTML = voucherPantalla(`<div class="v-card">${cabecera}${estado}
      ${entrega ? '' : '<div class="v-qr" id="v-qr"></div>'}
      <p class="v-nota">Presentá este voucher (o una captura de esta pantalla) en la oficina de <b>${voucherEsc(MARCA.nombreCompleto)}</b>, con tu DNI, para retirar tu premio. Se puede usar una sola vez.</p></div>
      <span class="v-link" onclick="location.href=location.pathname">‹ Volver a la app</span>`);
    const caja = document.getElementById('v-qr');
    if(caja && window.QRCode) new QRCode(caja, { text: voucherUrl(d.tipo, d.viaje, d.asiento, true), width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
  });
}

function voucherConfirmarEntrega(viaje, tipo, asiento){
  const pin = prompt('PIN del organizador de ' + MARCA.nombreCorto + ' para confirmar la entrega:');
  if(pin === null) return;
  if(String(pin).trim() !== String(MARCA.pinOrganizador)){ alert('PIN incorrecto'); return; }
  db.ref('salas/' + viaje).once('value').then(snap => {
    const v = voucherResolver(snap.val() || {}, tipo, asiento);
    if(!v || !v.listo) return voucherMostrarPantalla({ viaje, tipo, asiento, verificar: true });
    return db.ref(`salas/${viaje}/vouchers/${tipo}-${asiento}`).transaction(actual => actual ? undefined : { t: Date.now(), premio: v.premio }).then(() => voucherMostrarPantalla({ viaje, tipo, asiento, verificar: true }));
  });
}
