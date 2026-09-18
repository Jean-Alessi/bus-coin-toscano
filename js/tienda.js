// Premios del viaje: el organizador define hasta 4 premios para ese viaje
// puntual y, cuando quiere, habilita la elección. En orden de ranking
// (1° a 4°) cada uno va eligiendo el premio que quiera de los que van
// quedando; al último ya no le queda otra opción que el que sobró. Todo se
// sincroniza en Firebase para que cada pasajero vea su turno en su celular.

const PREMIOS_DEFAULT = ['Viaje gratis', '50% de descuento en tu próximo viaje', 'Remera de regalo', 'Caja de Bon o Bon'];
const PREMIOS_MEDALLAS = ['🥇', '🥈', '🥉', '🎗️'];

// La lista arranca en blanco (no con PREMIOS_DEFAULT) para cada código de
// viaje nuevo: si el organizador se olvida de cargarla, mejor que se note
// vacía a que queden puestos premios de ejemplo como si fueran los reales.
function premiosListaVacia(){ return ['', '', '', '']; }

let premiosState = { lista: premiosListaVacia(), habilitado: false, orden: null, elecciones: {} };
let premiosListenersListos = false;
let premiosEleccionesPrevias = -1; // -1 = todavía no se leyó nada; evita festejar de más al entrar a la pantalla

function premiosRef(){ return db.ref('salas/' + codigoViaje + '/premios'); }

// OJO: "elecciones" se guarda por asiento (ej. {"3": 1}), y Firebase convierte
// automáticamente un objeto con claves todas numéricas en un array, rellenando
// con null los índices que faltan (ej. eso queda como [null,null,null,1]).
// Por eso NUNCA hay que contar con Object.keys(...).length acá — cuenta
// también esos huecos null y da un número inflado. Se cuenta filtrando los
// valores reales.
function premiosCantidadElegida(){
  return Object.values(premiosState.elecciones || {}).filter(v => v !== null && v !== undefined).length;
}

function iniciarPremios(){
  if(premiosListenersListos){ renderPremiosViaje(); return; }
  premiosListenersListos = true;
  premiosRef().on('value', snap => {
    const val = snap.val() || {};
    premiosState = {
      lista: (val.lista && val.lista.length === 4) ? val.lista : premiosListaVacia(),
      habilitado: !!val.habilitado,
      orden: val.orden || null,
      elecciones: val.elecciones || {},
    };
    const cantidadElecciones = premiosCantidadElegida();
    // Festejo corto cuando se suma una elección nueva (no la primera vez que
    // carga la pantalla, para no disparar el festejo con datos ya viejos).
    if(premiosEleccionesPrevias >= 0 && cantidadElecciones > premiosEleccionesPrevias) premiosFestejarUltimaEleccion();
    premiosEleccionesPrevias = cantidadElecciones;
    renderPremiosViaje();
  });
}

function guardarListaPremios(){
  const valores = [0, 1, 2, 3].map(i => {
    const el = document.getElementById('premio-input-' + i);
    return el ? el.value.trim() : '';
  });
  premiosRef().child('lista').set(valores);
  mostrarToast('Premios guardados');
}

// Congela quiénes son el 1° a 4° puesto en este momento, para que el orden
// de elección no cambie aunque alguien siga sumando monedas mientras eligen.
// Lee el ranking directo de Firebase (no el caché local) para no quedarse
// con datos viejos si justo llegó un punto nuevo.
function habilitarEleccionPremios(){
  if(!bingoEsOrganizador()) return;
  if(!premiosState.lista.every(p => p && p.trim())){
    mostrarToast('Cargá los 4 premios antes de habilitar la elección');
    return;
  }
  rankingRefPuntos().once('value').then(snap => {
    const puntos = snap.val() || {};
    const orden = Object.keys(puntos)
      .filter(a => puntos[a])
      .sort((a, b) => (puntos[b].pts || 0) - (puntos[a].pts || 0))
      .slice(0, 4);
    if(!orden.length){
      mostrarToast('Todavía no hay nadie en el ranking');
      return;
    }
    premiosRef().update({ habilitado: true, orden });
  });
}

function elegirPremio(indexPremio){
  const turnoIndex = premiosCantidadElegida();
  const orden = premiosState.orden || [];
  const turnoAsiento = orden[turnoIndex];
  if(String(turnoAsiento) !== String(miAsiento)) return;
  if(premiosState.elecciones[String(miAsiento)] != null) return;
  premiosRef().child('elecciones').child(String(miAsiento)).set(indexPremio).then(() => {
    const eraElUltimo = (turnoIndex + 1) >= orden.length;
    if(eraElUltimo) premiosCerrarViajeAutomaticamente();
  });
}

// Red de seguridad para cuando el coordinador se olvida de cerrar el viaje:
// en cuanto el último ganador elige su premio, el viaje se cierra solo (nadie
// más puede entrar ni seguir jugando/sumando monedas). A propósito NO borra
// nada todavía — solo lo marca "listo para borrar" en Administrar viajes,
// para que el ranking y los premios elegidos sigan visibles mientras se
// reparten los premios reales, y el borrado quede como un paso manual.
function premiosCerrarViajeAutomaticamente(){
  db.ref('salas/' + codigoViaje).update({ cerrado: true, listoParaBorrar: true });
}

// Para cuando alguien no elige (ya bajó del micro, se le acabó la batería,
// etc.) y el organizador no quiere quedarse esperando: cierra el viaje
// igual, aunque falten elecciones. Requiere confirmar porque nadie más va a
// poder entrar ni elegir premio después de esto.
function premiosFinalizarIgual(){
  if(!bingoEsOrganizador()) return;
  if(!confirm('¿Finalizar el viaje igual, aunque todavía falten elegir premios?')) return;
  premiosCerrarViajeAutomaticamente();
  mostrarToast('Viaje finalizado');
}

function premiosFestejarUltimaEleccion(){
  const orden = premiosState.orden || [];
  const cantidad = premiosCantidadElegida();
  const asiento = orden[cantidad - 1];
  const nombre = (rankingPuntos[asiento] && rankingPuntos[asiento].nombre) || `Asiento ${asiento}`;
  const indicePremio = premiosState.elecciones[asiento];
  const premio = premiosState.lista[indicePremio];
  reproducirTono('bonus');
  mostrarToast(`🎉 ${nombre} eligió: ${premio}`, 'gain');
  const grid = document.getElementById('premios-grid');
  if(grid){
    grid.classList.remove('premios-grid-flash');
    void grid.offsetWidth; // fuerza el reinicio de la animación si ya estaba corriendo
    grid.classList.add('premios-grid-flash');
  }
}

function premiosGridHTML(elegidosPorIndice){
  return `<div class="premios-grid" id="premios-grid">${premiosState.lista.map((p, i) => {
    const elegido = elegidosPorIndice && elegidosPorIndice[i];
    return `
      <div class="premio-card premio-card-${i} ${elegido ? 'premio-card-elegido' : ''}">
        <div class="premio-card-medalla">${PREMIOS_MEDALLAS[i]}</div>
        <div class="premio-card-puesto">${i + 1}° puesto</div>
        <div class="premio-card-nombre">${p || 'Sin definir todavía'}</div>
        ${elegido ? `<div class="premio-card-tag">✓ Elegido por ${elegido}</div>` : ''}
      </div>`;
  }).join('')}</div>`;
}

function renderPremiosViaje(){
  const cont = document.getElementById('tienda-content');
  if(!cont) return;

  const esOrganizador = bingoEsOrganizador();

  if(!premiosState.habilitado){
    const editorHTML = esOrganizador ? `
      <div class="section-label">Editá los premios de este viaje</div>
      ${premiosState.lista.map((p, i) => `<input type="text" id="premio-input-${i}" class="bingo-input-numero" style="width:100%;" placeholder="Ej: ${PREMIOS_DEFAULT[i]}" value="${(p || '').replace(/"/g, '&quot;')}">`).join('')}
      <button class="btn-ghost" onclick="guardarListaPremios()">Guardar premios</button>
      <button class="btn-primary" onclick="habilitarEleccionPremios()">Habilitar elección de premios</button>` : '';

    cont.innerHTML = `
      <div class="premios-hero">
        <div class="premios-hero-titulo">🏆 Premios de este viaje</div>
        <p>Jugá y sumá monedas en los juegos. Al terminar el viaje, del 1° al 4° puesto del ranking eligen premio, en orden.</p>
      </div>
      ${premiosGridHTML(null)}
      ${editorHTML}`;
    return;
  }

  const orden = premiosState.orden || [];
  const turnoIndex = premiosCantidadElegida();
  const turnoAsiento = orden[turnoIndex];
  const elegidosPorIndice = {};
  orden.forEach(asiento => {
    const idx = premiosState.elecciones[asiento];
    if(idx != null) elegidosPorIndice[idx] = (rankingPuntos[asiento] && rankingPuntos[asiento].nombre) || `Asiento ${asiento}`;
  });

  const podioHTML = orden.slice(0, 3).map((asiento, i) => {
    const nombre = (rankingPuntos[asiento] && rankingPuntos[asiento].nombre) || `Asiento ${asiento}`;
    const eligio = premiosState.elecciones[asiento];
    const activo = i === turnoIndex;
    let estado = eligio != null ? `Eligió: ${premiosState.lista[eligio]}` : (activo ? 'Eligiendo ahora...' : 'Esperando su turno');
    return `
      <div class="podio-puesto podio-${i + 1} ${activo ? 'podio-activo' : ''}">
        <div class="podio-avatar">${nombre.slice(0, 2).toUpperCase()}</div>
        <div class="podio-medalla">${PREMIOS_MEDALLAS[i]}</div>
        <div class="podio-nombre">${nombre}</div>
        <div class="podio-estado">${estado}</div>
      </div>`;
  }).join('');

  const cuartoPuesto = orden.length > 3 ? (() => {
    const asiento = orden[3];
    const nombre = (rankingPuntos[asiento] && rankingPuntos[asiento].nombre) || `Asiento ${asiento}`;
    const eligio = premiosState.elecciones[asiento];
    const activo = turnoIndex === 3;
    const estado = eligio != null ? `Eligió: ${premiosState.lista[eligio]}` : (activo ? 'Eligiendo ahora...' : 'Esperando su turno');
    return `<div class="bingo-roster-item ${eligio != null ? 'bingo-roster-listo' : ''} ${activo ? 'premios-fila-activa' : ''}">
      <span>${PREMIOS_MEDALLAS[3]} ${nombre}</span>
      <span class="bingo-roster-derecha"><span>${estado}</span></span>
    </div>`;
  })() : '';

  let miTurnoHTML = '';
  if(turnoAsiento != null && String(turnoAsiento) === String(miAsiento) && premiosState.elecciones[String(miAsiento)] == null){
    const disponibles = premiosState.lista.map((p, i) => ({ p, i })).filter(o => elegidosPorIndice[o.i] == null);
    miTurnoHTML = `
      <div class="hero premios-tu-turno" style="margin-top:8px;">
        <h2>🎉 ¡Te tocó elegir!</h2>
        <p>${disponibles.length === 1 ? 'Te queda el último premio disponible.' : 'Elegí el premio que quieras de los que quedan.'}</p>
      </div>
      ${disponibles.map(o => `<button class="btn-primary" style="margin-top:8px;" onclick="elegirPremio(${o.i})">${o.p}</button>`).join('')}`;
  }

  const terminado = premiosCantidadElegida() >= orden.length;

  cont.innerHTML = `
    <div class="section-label">Elección de premios</div>
    <div class="podio">${podioHTML}</div>
    ${cuartoPuesto}
    ${miTurnoHTML}
    ${premiosGridHTML(elegidosPorIndice)}
    ${terminado ? '<p class="tienda-nota">🎊 Ya eligieron todos. ¡Felicitaciones a los ganadores!</p>' : ''}
    ${esOrganizador && !terminado ? '<p class="link-chico" onclick="premiosFinalizarIgual()">Finalizar el viaje igual, aunque falten elegir premios</p>' : ''}`;
}
