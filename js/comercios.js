// Comercios adheridos: comercios con descuento en el destino del viaje.
//
// El catálogo se carga UNA sola vez por destino (no por viaje): al crear un
// viaje con destino "Mar del Plata", automáticamente aparecen los comercios
// que ya estén cargados para "Mar del Plata", sin tener que cargarlos de
// nuevo cada vez. Se guarda en comercios/{destino-slug}/{comercioId}.
//
// Cada pasajero dice si es mayor de 12 años al anotarse (eso define a quién
// se le factura al comercio; los menores igual pueden usar el descuento, ese
// canje simplemente no cuenta para lo que se cobra).
//
// El comercio confirma el canje escaneando CON SU PROPIO CELULAR el QR que
// le muestra el pasajero — no hace falta que tenga la app instalada. El QR
// apunta a esta misma página con parámetros en la URL (?canjear=1&...) que
// abren una pantalla mínima de confirmación, sin nada del resto de la app.
// Ese registro (quién confirmó, cuándo) es la prueba para facturarle
// después: no depende de la palabra de nadie.

function comerciosSlugDestino(destino){
  return (destino || '')
    .toString().trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function comerciosRefCatalogo(agenciaId, destino){
  return db.ref('agencias/' + agenciaId + '/comercios/' + comerciosSlugDestino(destino));
}

const COMERCIOS_RUBROS_SUGERIDOS = ['Comida', 'Heladería', 'Tienda', 'Artesanías', 'Bebidas', 'Otro'];

// Puntos de ranking que gana el pasajero cuando el comercio confirma su
// canje. Es el incentivo para que el pasajero se preocupe de que el
// comercio realmente toque "Confirmar canje" (si no confirma, el pasajero
// no suma nada, así que no le conviene mirar para el costado).
const COMERCIOS_PUNTOS_POR_CANJE = 30;

// ---- Escucha en segundo plano el destino del viaje y su catálogo de
// comercios, para que la pestaña "Comercios" ya tenga todo listo apenas el
// pasajero la abre (no depende de que la haya abierto antes). ----

let comerciosDestinoViaje = null;
let comerciosAgenciaViaje = null;
let comerciosCatalogoActual = {};
let comerciosListenerDestinoListo = false;

function iniciarComerciosDestino(){
  if(comerciosListenerDestinoListo || !codigoViaje) return;
  comerciosListenerDestinoListo = true;
  db.ref('salas/' + codigoViaje + '/agenciaId').once('value').then(snapAgencia => {
    comerciosAgenciaViaje = snapAgencia.val() || null;
    db.ref('salas/' + codigoViaje + '/destino').on('value', snap => {
      comerciosDestinoViaje = snap.val() || null;
      if(!comerciosDestinoViaje || !comerciosAgenciaViaje){
        comerciosCatalogoActual = {};
        renderComercios();
        return;
      }
      comerciosRefCatalogo(comerciosAgenciaViaje, comerciosDestinoViaje).on('value', snapCat => {
        comerciosCatalogoActual = snapCat.val() || {};
        renderComercios();
      });
    });
  });
}

// ---- Vista del pasajero: lista de comercios + su código para canjear ----

let comerciosVerCodigoDe = null; // id del comercio cuyo QR se está mostrando
let comerciosCanjeListenerRef = null;
let comerciosMiCanjeConfirmado = false;

function iniciarComercios(){
  comerciosDejarDeEscucharMiCanje();
  comerciosVerCodigoDe = null;
  renderComercios();
}

function comerciosVerCodigo(comercioId){
  comerciosVerCodigoDe = comercioId;
  comerciosMiCanjeConfirmado = false;
  renderComercios();
  comerciosRegistrarVista(comercioId);
  comerciosEscucharMiCanje(comercioId);
}

function comerciosVolverALista(){
  comerciosDejarDeEscucharMiCanje();
  comerciosVerCodigoDe = null;
  renderComercios();
}

// Deja registro de que el pasajero mostró este código (sin que el comercio
// haga nada todavía). Sirve para detectar, comparando contra los canjes
// confirmados, comercios donde muchos pasajeros mostraron el código pero
// casi nadie quedó confirmado — señal de que puede no estar escaneando.
function comerciosRegistrarVista(comercioId){
  if(!codigoViaje || !miAsiento) return;
  const c = comerciosCatalogoActual[comercioId];
  db.ref(`salas/${codigoViaje}/comercios/${comercioId}/vistas/${miAsiento}`).set({
    nombre: miNombre || '',
    comercioNombre: (c && c.nombre) || '',
    momento: Date.now(),
  });
}

// Mientras el pasajero tiene el código en pantalla, escucha en vivo si su
// propio canje se confirma, para mostrarle ahí mismo que sumó los puntos
// (así le queda claro que le conviene que el comercio confirme).
function comerciosEscucharMiCanje(comercioId){
  comerciosDejarDeEscucharMiCanje();
  if(!codigoViaje || !miAsiento) return;
  comerciosCanjeListenerRef = db.ref(`salas/${codigoViaje}/comercios/${comercioId}/canjes/${miAsiento}`);
  comerciosCanjeListenerRef.on('value', snap => {
    comerciosMiCanjeConfirmado = snap.exists();
    if(comerciosVerCodigoDe === comercioId) renderComercios();
  });
}

function comerciosDejarDeEscucharMiCanje(){
  if(comerciosCanjeListenerRef) comerciosCanjeListenerRef.off();
  comerciosCanjeListenerRef = null;
}

// Algunos links de flyer no son una imagen directa (un PDF, o la página de
// vista previa de Drive), así que si falla como <img> lo mostramos en un
// iframe: siempre se ve adentro de la app, nunca abriendo otra pestaña.
function comerciosFlyerComoIframe(contenedorId, url){
  const cont = document.getElementById(contenedorId);
  if(cont) cont.innerHTML = `<iframe src="${url}" class="comercio-flyer-iframe" loading="lazy"></iframe>`;
}

function comerciosUrlCanje(comercioId){
  return `${location.origin}${location.pathname}?canjear=1&viaje=${encodeURIComponent(codigoViaje)}&asiento=${encodeURIComponent(miAsiento)}&comercio=${encodeURIComponent(comercioId)}`;
}

function comerciosFilaHTML(id, c){
  return `<button class="comercio-fila" onclick="comerciosVerCodigo('${id}')">
    <div class="comercio-fila-txt">
      <h3>${c.nombre}</h3>
      <p>${c.descuento}</p>
    </div>
    <span class="comercio-fila-flecha">›</span>
  </button>`;
}

function renderComercios(){
  const cont = document.getElementById('comercios-content');
  if(!cont) return;

  if(comerciosVerCodigoDe){
    const c = comerciosCatalogoActual[comerciosVerCodigoDe];
    if(!c){ comerciosVerCodigoDe = null; renderComercios(); return; }
    const flyerBoxId = `comercio-flyer-${comerciosVerCodigoDe}`;
    const flyerUrlSeguro = (c.flyerUrl || '').replace(/"/g, '&quot;');
    const flyerHTML = c.flyerUrl ? `
      <div class="comercio-flyer-box">
        <p class="section-label" style="margin-top:0;">Productos de ${c.nombre}</p>
        <div id="${flyerBoxId}">
          <img src="${flyerUrlSeguro}" alt="Flyer de ${c.nombre}" class="comercio-flyer-img" onerror="comerciosFlyerComoIframe('${flyerBoxId}', '${flyerUrlSeguro}')">
        </div>
      </div>` : '';
    const confirmadoHTML = comerciosMiCanjeConfirmado ? `
      <div class="comercio-confirmado-banner">✅ El comercio confirmó tu compra. ¡Sumaste ${COMERCIOS_PUNTOS_POR_CANJE} puntos en el ranking!</div>` : '';
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>${c.nombre}</h2>
        <p>${c.descuento}</p>
      </div>
      ${confirmadoHTML}
      <div class="comercio-qr-box">
        <div id="comercio-qr-canvas"></div>
        <p class="comercio-qr-nota">${comerciosMiCanjeConfirmado ? 'Ya quedó confirmado, no hace falta mostrarlo de nuevo.' : `Mostrale esta pantalla al comercio: la escanean con su celular, te confirman el descuento y sumás ${COMERCIOS_PUNTOS_POR_CANJE} puntos.`}</p>
      </div>
      ${flyerHTML}
      <p class="link-chico" onclick="comerciosVolverALista()">‹ Volver a la lista</p>`;
    const qrCont = document.getElementById('comercio-qr-canvas');
    if(qrCont && window.QRCode){
      qrCont.innerHTML = '';
      new QRCode(qrCont, { text: comerciosUrlCanje(comerciosVerCodigoDe), width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
    }
    return;
  }

  if(!comerciosDestinoViaje){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>🏪 Comercios adheridos</h2>
        <p>Aprovechá los descuentos en nuestros comercios adheridos.</p>
      </div>
      <p style="color:var(--gray);font-size:13px;">Este viaje todavía no tiene un destino cargado, así que por ahora no hay comercios para mostrar.</p>`;
    return;
  }

  const entradas = Object.keys(comerciosCatalogoActual)
    .map(id => ({ id, ...comerciosCatalogoActual[id] }))
    .filter(c => c.activo);

  if(!entradas.length){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>🏪 Comercios adheridos</h2>
        <p>Aprovechá los descuentos en nuestros comercios adheridos.</p>
      </div>
      <p style="color:var(--gray);font-size:13px;">Todavía no hay comercios cargados para ${comerciosDestinoViaje}. ¡Volvé a mirar más adelante!</p>`;
    return;
  }

  const oficial = entradas.find(c => c.oficial);
  const resto = entradas.filter(c => !c.oficial);

  const porRubro = {};
  resto.forEach(c => {
    const rubro = c.rubro || 'Otro';
    if(!porRubro[rubro]) porRubro[rubro] = [];
    porRubro[rubro].push(c);
  });

  const oficialHTML = oficial ? `
    <div class="section-label">⭐ Parada de este viaje</div>
    ${comerciosFilaHTML(oficial.id, oficial)}` : '';

  const restoHTML = Object.keys(porRubro).map(rubro => `
    <div class="section-label">${rubro}</div>
    ${porRubro[rubro].map(c => comerciosFilaHTML(c.id, c)).join('')}`).join('');

  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>🏪 Comercios en ${comerciosDestinoViaje}</h2>
      <p>Aprovechá los descuentos en nuestros comercios adheridos. Tocá uno para ver tu código y mostrárselo cuando compres.</p>
    </div>
    ${oficialHTML}
    ${restoHTML}`;
}

// ---- Pantalla de confirmación para el comercio (no pasa por el resto de la
// app: se abre directo desde el QR, sin login ni onboarding). ----

function comerciosLeerParamsCanje(){
  const params = new URLSearchParams(location.search);
  if(params.get('canjear') !== '1') return null;
  return {
    viaje: (params.get('viaje') || '').toUpperCase().trim(),
    asiento: (params.get('asiento') || '').trim(),
    comercioId: (params.get('comercio') || '').trim(),
  };
}

function comerciosCanjePantallaHTML(contenidoHTML){
  return `<div class="device"><div class="screen" style="justify-content:flex-start;">
    <div class="statusbar">
      <img src="logo-empresa.png" alt="Logo" class="statusbar-logo">
      <span class="statusbar-brand">${MARCA.marcaPrincipal} <em>${MARCA.marcaSecundaria}</em></span>
    </div>
    <div class="view active" style="padding:20px;">${contenidoHTML}</div>
  </div></div>`;
}

function comerciosCanjeErrorHTML(mensaje){
  return comerciosCanjePantallaHTML(`<div class="hero" style="margin-top:8px;"><h2>No se pudo abrir</h2><p>${mensaje}</p></div>`);
}

function comerciosMostrarPantallaCanje(datos){
  document.body.innerHTML = comerciosCanjePantallaHTML('<p style="text-align:center;color:var(--gray);margin-top:40px;">Cargando...</p>');

  if(!datos.viaje || !datos.asiento || !datos.comercioId){
    document.body.innerHTML = comerciosCanjeErrorHTML('Este link de canje está incompleto.');
    return;
  }

  db.ref('salas/' + datos.viaje).once('value').then(snapSala => {
    if(!snapSala.exists()){
      document.body.innerHTML = comerciosCanjeErrorHTML('Este viaje no existe.');
      return;
    }
    const sala = snapSala.val();
    const pasajero = sala.ranking && sala.ranking.puntos && sala.ranking.puntos[datos.asiento];
    if(!pasajero){
      document.body.innerHTML = comerciosCanjeErrorHTML('No se encontró a este pasajero en el viaje.');
      return;
    }
    comerciosRefCatalogo(sala.agenciaId, sala.destino).child(datos.comercioId).once('value').then(snapComercio => {
      const comercio = snapComercio.val();
      if(!comercio){
        document.body.innerHTML = comerciosCanjeErrorHTML('Este comercio ya no está disponible.');
        return;
      }
      const refCanje = db.ref(`salas/${datos.viaje}/comercios/${datos.comercioId}/canjes/${datos.asiento}`);
      refCanje.once('value').then(snapCanje => {
        if(snapCanje.exists()){
          document.body.innerHTML = comerciosCanjePantallaHTML(comerciosCanjeYaConfirmadoHTML(comercio, snapCanje.val()));
          return;
        }
        document.body.innerHTML = comerciosCanjePantallaHTML(comerciosCanjeConfirmarHTML(comercio, pasajero, datos));
      });
    });
  });
}

function comerciosCanjeYaConfirmadoHTML(comercio, canje){
  const fecha = new Date(canje.momento).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `
    <div class="hero" style="margin-top:8px;">
      <h2>✅ Canje ya confirmado</h2>
      <p>${canje.nombre} — ${comercio.nombre}</p>
      <p>Confirmado el ${fecha}. No se puede confirmar dos veces.</p>
    </div>`;
}

function comerciosCanjeConfirmarHTML(comercio, pasajero, datos){
  const montoTexto = comercio.oficial ? 'Parada oficial del viaje (sin cargo por canje individual)' : `$${comercio.precioPorCanje || 0}`;
  return `
    <div class="hero" style="margin-top:8px;">
      <h2>${comercio.nombre}</h2>
      <p>${comercio.descuento}</p>
    </div>
    <div class="comercio-confirmar-box">
      <p><b>Pasajero:</b> ${pasajero.nombre} (asiento ${datos.asiento})</p>
      <p><b>A cargo del comercio:</b> ${montoTexto}</p>
    </div>
    <button class="btn-primary" onclick="comerciosConfirmarCanjeAhora('${datos.viaje}', '${datos.asiento}', '${datos.comercioId}')">Confirmar canje</button>
    <p class="link-chico" style="text-align:center;">Este botón lo toca el comercio, una sola vez.</p>`;
}

function comerciosConfirmarCanjeAhora(viaje, asiento, comercioId){
  db.ref('salas/' + viaje).once('value').then(snapSala => {
    const sala = snapSala.val() || {};
    const pasajero = (sala.ranking && sala.ranking.puntos && sala.ranking.puntos[asiento]) || {};
    comerciosRefCatalogo(sala.agenciaId, sala.destino).child(comercioId).once('value').then(snapComercio => {
      const comercio = snapComercio.val() || {};
      const refCanje = db.ref(`salas/${viaje}/comercios/${comercioId}/canjes/${asiento}`);
      refCanje.transaction(actual => {
        if(actual) return; // ya estaba confirmado, no lo pisa
        return {
          momento: Date.now(),
          nombre: pasajero.nombre || `Asiento ${asiento}`,
          mayorDe12: !!pasajero.mayorDe12,
          comercioNombre: comercio.nombre || '',
          precioPorCanje: comercio.oficial ? 0 : (comercio.precioPorCanje || 0),
          oficial: !!comercio.oficial,
        };
      }).then(resultado => {
        if(resultado.committed) comerciosOtorgarPuntosPorCanje(viaje, asiento, pasajero.nombre || `Asiento ${asiento}`);
        comerciosMostrarPantallaCanje({ viaje, asiento, comercioId });
      });
    });
  });
}

// Le suma los puntos del canje al ranking del pasajero (el mismo ranking
// que usa Premios), para que confirmar la compra le sirva de algo real.
function comerciosOtorgarPuntosPorCanje(viaje, asiento, nombreFallback){
  // Se parte de "actual" completo (no solo nombre/pts) para no pisar otros
  // campos del registro, como "mayorDe12".
  db.ref(`salas/${viaje}/ranking/puntos/${asiento}`).transaction(actual => Object.assign({}, actual, {
    nombre: (actual && actual.nombre) || nombreFallback,
    pts: ((actual && actual.pts) || 0) + COMERCIOS_PUNTOS_POR_CANJE,
  }));
}

// ---- Administración del catálogo (por destino) ----

let comerciosAdminMostrandoPin = false;
let comerciosAdminDestino = null;
let comerciosAdminCatalogo = {};

function mostrarAdminComercios(){
  comerciosAdminMostrandoPin = true;
  renderAdminComercios();
}

function renderAdminComercios(){
  const cont = document.getElementById('admin-comercios-content');
  if(!cont) return;

  if(!comerciosAdminMostrandoPin){ cont.innerHTML = ''; return; }

  if(!agenciasEsOrganizador()){
    cont.innerHTML = agenciasFormularioLoginHTML('admin-comercios', 'renderAdminComercios');
    return;
  }

  const buscadorHTML = `
    <p class="link-chico">Conectado como ${agenciaActualNombre}. <span onclick="agenciasCerrarSesion()" style="text-decoration:underline;cursor:pointer;">Cerrar sesión</span></p>
    <div class="section-label">¿Qué destino querés administrar?</div>
    <input type="text" id="admin-comercios-destino-input" class="bingo-input-numero" style="width:100%;" placeholder="Ej: Mar del Plata" value="${comerciosAdminDestino || ''}">
    <button class="btn-ghost" onclick="comerciosAdminCargarDestino()">Ver comercios de este destino</button>`;

  if(!comerciosAdminDestino){
    cont.innerHTML = buscadorHTML;
    return;
  }

  const entradas = Object.keys(comerciosAdminCatalogo).map(id => ({ id, ...comerciosAdminCatalogo[id] }));
  const hayOficial = entradas.some(c => c.oficial);

  const listaHTML = entradas.map(c => `
    <div class="comercio-admin-card">
      <input type="text" id="ca-nombre-${c.id}" class="bingo-input-numero" style="width:100%;" placeholder="Nombre del comercio" value="${(c.nombre || '').replace(/"/g, '&quot;')}">
      <input type="text" id="ca-rubro-${c.id}" class="bingo-input-numero" style="width:100%;" list="comercios-rubros-sugeridos" placeholder="Rubro" value="${(c.rubro || '').replace(/"/g, '&quot;')}">
      <input type="text" id="ca-descuento-${c.id}" class="bingo-input-numero" style="width:100%;" placeholder="Ej: 20% de descuento" value="${(c.descuento || '').replace(/"/g, '&quot;')}">
      <input type="number" id="ca-precio-${c.id}" class="bingo-input-numero" style="width:100%;" placeholder="Precio por canje ($)" value="${c.precioPorCanje || ''}">
      <label class="comercio-admin-checkbox"><input type="checkbox" id="ca-oficial-${c.id}" ${c.oficial ? 'checked' : ''}> Es la parada oficial de este destino</label>
      <input type="number" id="ca-montofijo-${c.id}" class="bingo-input-numero" style="width:100%;" placeholder="Monto fijo por ser la parada oficial ($)" value="${c.montoFijoOficial || ''}">
      <label class="comercio-admin-checkbox"><input type="checkbox" id="ca-activo-${c.id}" ${c.activo !== false ? 'checked' : ''}> Activo (visible para los pasajeros)</label>
      <input type="text" id="ca-flyer-${c.id}" class="bingo-input-numero" style="width:100%;" placeholder="Link al flyer (imagen, o PDF con /preview si es de Drive)" value="${(c.flyerUrl || '').replace(/"/g, '&quot;')}">
      <p style="font-size:11.5px;color:var(--gray);margin:2px 0 8px;">Si es un link de Google Drive, usá el que termina en <b>/preview</b> (no /view) para que se vea dentro de la app.${c.flyerUrl ? ` Flyer actual: <a href="${c.flyerUrl}" target="_blank" rel="noopener">ver</a>` : ''}</p>
      <div style="display:flex; gap:8px; margin-top:6px;">
        <button class="btn-ghost" style="margin-top:0;" onclick="comerciosAdminGuardar('${c.id}')">Guardar</button>
        <button class="btn-eliminar-pasajero" onclick="comerciosAdminEliminar('${c.id}')" title="Eliminar">✕</button>
      </div>
    </div>`).join('');

  cont.innerHTML = `
    ${buscadorHTML}
    <div class="section-label">Comercios en ${comerciosAdminDestino}${hayOficial ? '' : ' — sin parada oficial todavía'}</div>
    ${listaHTML || '<p style="color:var(--gray);font-size:13px;">Todavía no hay comercios cargados acá.</p>'}
    <datalist id="comercios-rubros-sugeridos">${COMERCIOS_RUBROS_SUGERIDOS.map(r => `<option value="${r}">`).join('')}</datalist>
    <div class="section-label">Agregar comercio nuevo</div>
    <div class="comercio-admin-card">
      <input type="text" id="ca-nuevo-nombre" class="bingo-input-numero" style="width:100%;" placeholder="Nombre del comercio">
      <input type="text" id="ca-nuevo-rubro" class="bingo-input-numero" style="width:100%;" list="comercios-rubros-sugeridos" placeholder="Rubro">
      <input type="text" id="ca-nuevo-descuento" class="bingo-input-numero" style="width:100%;" placeholder="Ej: 20% de descuento">
      <input type="number" id="ca-nuevo-precio" class="bingo-input-numero" style="width:100%;" placeholder="Precio por canje ($)">
      <label class="comercio-admin-checkbox"><input type="checkbox" id="ca-nuevo-oficial"> Es la parada oficial de este destino</label>
      <input type="number" id="ca-nuevo-montofijo" class="bingo-input-numero" style="width:100%;" placeholder="Monto fijo por ser la parada oficial ($)">
      <input type="text" id="ca-nuevo-flyer" class="bingo-input-numero" style="width:100%;" placeholder="Link al flyer (imagen, o PDF con /preview si es de Drive)">
      <p style="font-size:11.5px;color:var(--gray);margin:2px 0 8px;">Si es un link de Google Drive, usá el que termina en <b>/preview</b> (no /view) para que se vea dentro de la app.</p>
      <button class="btn-primary" onclick="comerciosAdminAgregar()">Agregar comercio</button>
    </div>`;
}

function comerciosAdminCargarDestino(){
  const input = document.getElementById('admin-comercios-destino-input');
  const destino = input ? input.value.trim() : '';
  if(!destino) return;
  comerciosAdminDestino = destino;
  comerciosRefCatalogo(agenciaActualId, destino).once('value').then(snap => {
    comerciosAdminCatalogo = snap.val() || {};
    renderAdminComercios();
  });
}

// Si se marca un comercio como "oficial", se le saca esa marca a cualquier
// otro de este mismo destino: no tiene sentido que el micro pare en dos
// paradas oficiales el mismo viaje.
function comerciosAdminSacarOficialDeOtros(exceptoId){
  const actualizaciones = {};
  Object.keys(comerciosAdminCatalogo).forEach(id => {
    if(id !== exceptoId && comerciosAdminCatalogo[id].oficial) actualizaciones[id + '/oficial'] = false;
  });
  return Object.keys(actualizaciones).length ? comerciosRefCatalogo(agenciaActualId, comerciosAdminDestino).update(actualizaciones) : Promise.resolve();
}

function comerciosAdminGuardar(id){
  const leer = campo => {
    const el = document.getElementById(`ca-${campo}-${id}`);
    return el ? el.value.trim() : '';
  };
  const marcado = campo => {
    const el = document.getElementById(`ca-${campo}-${id}`);
    return el ? el.checked : false;
  };
  const oficial = marcado('oficial');
  const datos = {
    nombre: leer('nombre'),
    rubro: leer('rubro') || 'Otro',
    descuento: leer('descuento'),
    precioPorCanje: Number(leer('precio')) || 0,
    oficial,
    montoFijoOficial: Number(leer('montofijo')) || 0,
    activo: marcado('activo'),
    flyerUrl: leer('flyer'),
  };
  const guardar = () => comerciosRefCatalogo(agenciaActualId, comerciosAdminDestino).child(id).update(datos).then(() => {
    mostrarToast('Comercio guardado');
    comerciosAdminCargarDestino();
  });
  if(oficial) comerciosAdminSacarOficialDeOtros(id).then(guardar);
  else guardar();
}

function comerciosAdminEliminar(id){
  if(!confirm('¿Eliminar este comercio? No se puede deshacer.')) return;
  comerciosRefCatalogo(agenciaActualId, comerciosAdminDestino).child(id).remove().then(() => comerciosAdminCargarDestino());
}

function comerciosAdminAgregar(){
  const leer = idSufijo => {
    const el = document.getElementById('ca-nuevo-' + idSufijo);
    return el ? el.value.trim() : '';
  };
  const marcado = idSufijo => {
    const el = document.getElementById('ca-nuevo-' + idSufijo);
    return el ? el.checked : false;
  };
  const nombre = leer('nombre');
  if(!nombre){ mostrarToast('Ponele un nombre al comercio'); return; }
  const oficial = marcado('oficial');
  const datos = {
    nombre,
    rubro: leer('rubro') || 'Otro',
    descuento: leer('descuento'),
    precioPorCanje: Number(leer('precio')) || 0,
    oficial,
    montoFijoOficial: Number(leer('montofijo')) || 0,
    activo: true,
    flyerUrl: leer('flyer'),
  };
  const ref = comerciosRefCatalogo(agenciaActualId, comerciosAdminDestino).push();
  const guardar = () => ref.set(datos).then(() => {
    mostrarToast('Comercio agregado');
    comerciosAdminCargarDestino();
  });
  if(oficial) comerciosAdminSacarOficialDeOtros(null).then(guardar);
  else guardar();
}

// ---- Resumen de canjes por viaje (para facturarle a cada comercio) ----

function comerciosResumenViajeHTML(sala){
  const comerciosDelViaje = sala.comercios || {};
  const ids = Object.keys(comerciosDelViaje);
  if(!ids.length) return '<p style="color:var(--gray);font-size:12.5px;margin:4px 0 0;">Todavía no hay canjes registrados en este viaje.</p>';

  const filas = ids.map(id => {
    const datos = comerciosDelViaje[id] || {};
    const canjes = Object.values(datos.canjes || {});
    const vistas = Object.values(datos.vistas || {});
    const facturables = canjes.filter(c => c.mayorDe12 && !c.oficial);
    const nombre = (canjes[0] && canjes[0].comercioNombre) || (vistas[0] && vistas[0].comercioNombre) || id;
    const esOficial = canjes.some(c => c.oficial);
    const precio = facturables.length ? facturables[0].precioPorCanje : 0;
    const monto = facturables.length * precio;
    const brecha = vistas.length - canjes.length;
    const alertaHTML = brecha > 0
      ? `<br><span style="color:#C0392B;">⚠️ ${vistas.length} mostraron el código acá y solo ${canjes.length} quedaron confirmados</span>`
      : '';
    return `<div class="bingo-roster-item">
      <span>${esOficial ? '⭐ ' : ''}${nombre}<br><span style="font-size:11px;color:var(--gray);">${canjes.length} canje${canjes.length === 1 ? '' : 's'} (${facturables.length} facturable${facturables.length === 1 ? '' : 's'})${alertaHTML}</span></span>
      <span class="bingo-roster-derecha"><b>$${monto}</b></span>
    </div>`;
  }).join('');

  return `<div class="section-label" style="margin-top:10px;">🏪 Canjes de comercios</div>${filas}`;
}
