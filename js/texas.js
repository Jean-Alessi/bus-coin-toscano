// Texas Hold'em para 2 a 6 jugadores, con el mismo sistema de "mesas" que
// Chinchón y Truco: varias mesas pueden convivir dentro del mismo viaje. Las
// reglas están en texaslogica.js; acá se maneja la mesa, Firebase y la pantalla.
//
// Es solo diversión: las fichas son del juego (cada uno arranca con 1000 al
// empezar la mesa) y NO suman monedas ni ranking de premios. El organizador lo
// enciende por viaje.

let texasMesas = {};
let texasMesaIdActual = null;
let texasCapacidadElegida = 4;
let texasObjetivo = 0; // monto elegido para subir (apuesta total de la ronda)
let texasListenersListos = false;

function texasRefMesas(){ return db.ref(`salas/${codigoViaje}/texas/mesas`); }

function iniciarTexas(){
  if(!texasListenersListos){
    texasListenersListos = true;
    texasRefMesas().on('value', snap => {
      texasMesas = snap.val() || {};
      renderTexas();
    });
  } else {
    renderTexas();
  }
}

function texasMesaActual(){
  const crudo = texasMesaIdActual ? texasMesas[texasMesaIdActual] : null;
  return crudo ? texasNormalizar(crudo) : null;
}

function texasElegirCapacidad(n){
  texasCapacidadElegida = n;
  renderTexas();
}

function texasCrearMesa(){
  if(!miAsiento) return;
  const ref = texasRefMesas().push();
  ref.set({
    jugadores: [String(miAsiento)],
    nombres: { [miAsiento]: miNombre },
    capacidad: texasCapacidadElegida,
    creador: String(miAsiento),
    fase: 'esperando',
  });
  texasMesaIdActual = ref.key;
}

function texasUnirseAMesa(mesaId){
  if(!miAsiento) return;
  const mesa = texasMesas[mesaId];
  if(!mesa || mesa.fase !== 'esperando') return;
  const jugadores = (mesa.jugadores || []).map(String);
  if(jugadores.includes(String(miAsiento)) || jugadores.length >= mesa.capacidad) return;
  const nuevos = jugadores.concat([String(miAsiento)]);
  const nombres = Object.assign({}, mesa.nombres, { [miAsiento]: miNombre });
  const updates = { jugadores: nuevos, nombres };
  texasMesaIdActual = mesaId;
  if(nuevos.length === mesa.capacidad){ texasEmpezar(mesaId, nuevos, nombres); return; }
  texasRefMesas().child(mesaId).update(updates);
}

// Empieza la partida (cuando se llena la mesa o cuando el que la creó dice "Empezar").
function texasEmpezar(mesaId, jugadores, nombres){
  const fichas = {};
  jugadores.forEach(a => { fichas[a] = TEXAS_FICHAS_INICIO; });
  const base = { jugadores, nombres, fichas, capacidad: jugadores.length, creador: (texasMesas[mesaId] || {}).creador || jugadores[0], mano: 0 };
  const m = texasRepartir(base);
  texasGuardar(mesaId, m);
}

function texasEmpezarYa(){
  const mesa = texasMesaActual();
  if(!mesa || mesa.fase !== 'esperando' || mesa.jugadores.length < 2 || String(mesa.creador) !== String(miAsiento)) return;
  texasEmpezar(texasMesaIdActual, mesa.jugadores, mesa.nombres);
}

function texasGuardar(mesaId, m){
  const datos = {
    jugadores: m.jugadores, nombres: m.nombres, capacidad: m.capacidad, creador: m.creador,
    fase: m.fase, ganadorFinal: m.ganadorFinal || null,
    fichas: m.fichas, mano: m.mano, dealer: m.dealer || null, ciega: m.ciega || 20,
    enMano: m.enMano || [], cartas: m.cartas || {}, comunes: m.comunes || [], mazo: m.mazo || [],
    ronda: m.ronda, aportado: m.aportado || {}, apostado: m.apostado || {},
    apuestaActual: m.apuestaActual || 0, ultimaSubida: m.ultimaSubida || 0,
    plegados: m.plegados || {}, porActuar: m.porActuar || [], turno: m.turno || null,
    resultado: m.resultado || null,
  };
  texasRefMesas().child(mesaId).set(datos);
}

function texasVolverAlLobby(){
  texasMesaIdActual = null;
  renderTexas();
}

function texasTerminarMesa(mesaId){
  texasRefMesas().child(mesaId).remove();
  if(texasMesaIdActual === mesaId) texasVolverAlLobby();
}

function texasActuar(tipo, monto){
  const mesa = texasMesaActual();
  if(!mesa || mesa.fase !== 'jugando') return;
  const nuevo = texasAccion(mesa, miAsiento, tipo, monto);
  if(!nuevo) return;
  reproducirTono(tipo === 'plegar' ? 'incorrecto' : 'tick');
  texasGuardar(texasMesaIdActual, nuevo);
}

function texasSiguienteMano(){
  const mesa = texasMesaActual();
  if(!mesa || mesa.fase !== 'jugando' || mesa.ronda !== 'fin') return;
  texasGuardar(texasMesaIdActual, texasRepartir(mesa));
}

function texasAjustarObjetivo(delta){
  const mesa = texasMesaActual();
  if(!mesa) return;
  const op = texasOpciones(mesa, miAsiento);
  texasObjetivo = Math.max(op.minimo, Math.min(op.maximo, texasObjetivo + delta));
  renderTexas();
}

function texasObjetivoRapido(modo){
  const mesa = texasMesaActual();
  if(!mesa) return;
  const op = texasOpciones(mesa, miAsiento);
  const bote = Object.keys(mesa.aportado).reduce((s, a) => s + mesa.aportado[a], 0);
  let obj = op.minimo;
  if(modo === 'bote') obj = mesa.apuestaActual + bote + op.aPagar;
  else if(modo === 'mitad') obj = mesa.apuestaActual + Math.floor((bote + op.aPagar) / 2);
  else if(modo === 'todo') obj = op.maximo;
  texasObjetivo = Math.max(op.minimo, Math.min(op.maximo, obj));
  renderTexas();
}

function texasFichaHTML(n){
  return `<span class="tx-ficha"><img src="logo-empresa.png?v=2" alt="">${n}</span>`;
}

function texasInsignias(mesa, a){
  const despues = texasDespuesDe(mesa.enMano, mesa.dealer);
  const headsUp = mesa.enMano.length === 2;
  const sb = headsUp ? mesa.dealer : despues[0], bb = headsUp ? despues[0] : despues[1];
  const out = [];
  if(a === mesa.dealer) out.push('D');
  if(a === sb) out.push('CC'); // ciega chica
  if(a === bb) out.push('CG'); // ciega grande
  return out.map(t => `<span class="tx-insignia">${t}</span>`).join('');
}

function texasRivalHTML(mesa, a){
  const enMano = mesa.enMano.includes(a);
  const plego = !!mesa.plegados[a];
  const todoAdentro = enMano && !plego && (mesa.fichas[a] || 0) === 0 && mesa.ronda !== 'fin';
  const revelada = mesa.resultado && mesa.resultado.reveladas && mesa.resultado.reveladas[a];
  const turno = String(mesa.turno) === a && mesa.ronda !== 'fin';
  const estado = !enMano ? 'Sin fichas' : plego ? 'Se retiró' : todoAdentro ? 'All-in' : (mesa.apostado[a] ? `Apostó ${mesa.apostado[a]}` : '');
  const cartas = !enMano ? '' : revelada
    ? revelada.map(c => frCartaHTML(c, { estilo: '--cw:30px;' })).join('')
    : (plego ? '' : '<div class="tx-dorsos">' + frDorsoHTML({ estilo: '--cw:26px;' }) + frDorsoHTML({ estilo: '--cw:26px;' }) + '</div>');
  const ganador = mesa.resultado && mesa.resultado.ganadores.some(g => g.asiento === a);
  return `<div class="tx-rival ${turno ? 'tx-turno' : ''} ${plego || !enMano ? 'tx-fuera' : ''} ${ganador ? 'tx-ganador' : ''}">
    <div class="tx-rival-nombre">${mesa.nombres[a] || 'Jugador'} ${texasInsignias(mesa, a)}</div>
    <div class="tx-rival-cartas">${cartas}</div>
    <div class="tx-rival-fichas">${texasFichaHTML(mesa.fichas[a] || 0)}</div>
    <div class="tx-rival-estado">${estado}${revelada && mesa.resultado.nombresManos ? '<br>' + mesa.resultado.nombresManos[a] : ''}</div>
  </div>`;
}

function renderTexasLobby(){
  const cont = document.getElementById('texas-content');
  const mesasArray = Object.keys(texasMesas).map(id => Object.assign({ id }, texasMesas[id]));
  const listaHTML = mesasArray.length ? mesasArray.map(m => {
    const jugadores = (m.jugadores || []).map(String);
    const nombres = jugadores.map(a => (m.nombres || {})[a]).join(', ');
    const estado = m.fase === 'esperando' ? `Esperando jugadores (${jugadores.length}/${m.capacidad})` : m.fase === 'jugando' ? `Jugando (mano ${m.mano})` : 'Terminada';
    const puedoUnirme = m.fase === 'esperando' && jugadores.length < m.capacidad && !jugadores.includes(String(miAsiento));
    const puedoEntrar = jugadores.includes(String(miAsiento));
    return `<div class="bingo-roster-item">
      <span>${nombres}<br><span style="font-size:11px;color:var(--gray);">${estado}</span></span>
      <span class="bingo-roster-derecha">
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="texasMesaIdActual='${m.id}'; renderTexas();">Entrar</button>` : ''}
        ${puedoUnirme ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;background:#3B9B5A;color:#fff;border-color:#3B9B5A;" onclick="texasUnirseAMesa('${m.id}')">Unirme</button>` : ''}
        ${puedoEntrar ? `<button class="btn-eliminar-pasajero" onclick="texasTerminarMesa('${m.id}')" title="Eliminar mesa">✕</button>` : ''}
      </span>
    </div>`;
  }).join('') : '<p style="color:var(--gray);font-size:13px;">Todavía no hay mesas. ¡Armá la primera!</p>';

  cont.innerHTML = `
    ${gEscenaHTML('casino', `
      ${gDialogoHTML("Texas Hold'em", 'De 2 a 6 jugadores. Cada uno recibe 2 cartas y se destapan 5 en la mesa: armá la mejor mano de 5. Solo diversión: las fichas no tienen valor y no suman monedas ni ranking.')}
      <div class="g-dialogo-sub" style="text-align:center;margin-bottom:6px;font-weight:700;">¿Para cuántos jugadores?</div>
      <div class="g-acciones tx-capacidades">
        ${[2, 3, 4, 5, 6].map(n => `<button class="gbtn ${texasCapacidadElegida === n ? 'gbtn-sel' : 'gbtn-no'}" onclick="texasElegirCapacidad(${n})">${n}</button>`).join('')}
      </div>
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="texasCrearMesa()">Crear mesa nueva</button></div>`)}
    <div class="section-label">Mesas</div>
    ${listaHTML}`;
}

function renderTexasMesa(){
  const cont = document.getElementById('texas-content');
  const mesa = texasMesaActual();
  if(!mesa){ texasVolverAlLobby(); return; }

  if(mesa.fase === 'esperando'){
    const soyCreador = String(mesa.creador) === String(miAsiento);
    cont.innerHTML = gEscenaHTML('casino', `
      ${gDialogoHTML('Esperando jugadores...', `${mesa.jugadores.length} de ${mesa.capacidad}. ${soyCreador && mesa.jugadores.length >= 2 ? 'Podés empezar ya con los que están.' : 'Compartí la app para que se sumen los que falten.'}`)}
      <div class="m-rival-mano" style="margin:6px 0 10px;">${Array.from({ length: mesa.capacidad }).map((_, i) => frDorsoHTML({ estilo: `--cw:34px;${i < mesa.jugadores.length ? '' : 'opacity:.3;'}` })).join('')}</div>
      ${soyCreador && mesa.jugadores.length >= 2 ? `<div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="texasEmpezarYa()">Empezar con ${mesa.jugadores.length}</button></div>` : ''}
      <div class="g-pie"><span onclick="texasVolverAlLobby()">‹ Volver a la lista de mesas</span><span onclick="texasTerminarMesa('${texasMesaIdActual}')">Cancelar esta mesa</span></div>`);
    return;
  }

  const yo = String(miAsiento);
  const bote = Object.keys(mesa.aportado).reduce((s, a) => s + mesa.aportado[a], 0);
  const otros = mesa.jugadores.filter(a => a !== yo);

  if(mesa.fase === 'terminado'){
    const g = mesa.ganadorFinal;
    cont.innerHTML = gEscenaHTML('casino', `
      ${gDialogoHTML(String(g) === yo ? '🏆 ¡Ganaste la mesa!' : `Ganó ${mesa.nombres[g] || 'otro jugador'}`, 'Se quedó con todas las fichas. Recordá que son solo del juego.')}
      <div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="texasTerminarMesa('${texasMesaIdActual}')">Cerrar esta mesa</button></div>
      <div class="g-pie"><span onclick="texasVolverAlLobby()">‹ Volver a la lista de mesas</span></div>`);
    return;
  }

  const enMano = mesa.enMano.includes(yo);
  const misCartas = (mesa.cartas && mesa.cartas[yo]) || [];
  const comunesHTML = [0, 1, 2, 3, 4].map(i => mesa.comunes[i]
    ? frCartaHTML(mesa.comunes[i], { estilo: '--cw:46px;' })
    : frHuecoHTML({ estilo: '--cw:46px;' })).join('');

  // Qué mano tengo hasta ahora
  let miManoTxt = '';
  if(enMano && misCartas.length === 2){
    const evaluada = pokerMejor(misCartas.concat(mesa.comunes));
    miManoTxt = mesa.comunes.length ? pokerNombre(evaluada) : (misCartas[0].v === misCartas[1].v ? 'Pareja en mano' : '');
  }

  let accionesHTML = '', estadoTxt;
  const soyTurno = enMano && String(mesa.turno) === yo && mesa.ronda !== 'fin';
  const fin = mesa.ronda === 'fin' && mesa.resultado;

  if(fin){
    const r = mesa.resultado;
    const lineas = r.ganadores.map(gn => `${gn.asiento === yo ? 'Vos' : mesa.nombres[gn.asiento]} ${gn.asiento === yo ? 'ganaste' : 'ganó'} ${gn.monto}${r.nombresManos && r.nombresManos[gn.asiento] ? ' con ' + r.nombresManos[gn.asiento] : ''}`);
    estadoTxt = lineas.join(' · ');
    accionesHTML = `<div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="texasSiguienteMano()">Siguiente mano</button></div>`;
  } else if(soyTurno){
    const op = texasOpciones(mesa, yo);
    if(texasObjetivo < op.minimo || texasObjetivo > op.maximo) texasObjetivo = op.minimo;
    estadoTxt = op.puedePasar ? 'Es tu turno: pasá o apostá' : `Es tu turno: pagar ${op.aPagar} para seguir`;
    accionesHTML = `
      <div class="tx-acciones">
        <button class="gbtn gbtn-rojo gbtn-chico-texto" onclick="texasActuar('plegar')">Retirarme</button>
        <button class="gbtn" onclick="texasActuar('igualar')">${op.puedePasar ? 'Pasar' : (op.todoAdentro ? `All-in ${op.aPagar}` : `Igualar ${op.aPagar}`)}</button>
      </div>
      ${op.puedeSubir ? `
      <div class="tx-subir">
        <button class="gbtn gbtn-chico-texto" onclick="texasAjustarObjetivo(-${mesa.ciega})">−</button>
        <button class="gbtn gbtn-ancho tx-btn-subir" onclick="texasActuar('subir', ${texasObjetivo})">${texasObjetivo === op.maximo ? 'All-in' : (mesa.apuestaActual ? 'Subir a' : 'Apostar')} ${texasObjetivo}</button>
        <button class="gbtn gbtn-chico-texto" onclick="texasAjustarObjetivo(${mesa.ciega})">+</button>
      </div>
      <div class="tx-rapidas"><span onclick="texasObjetivoRapido('min')">Mínimo</span><span onclick="texasObjetivoRapido('mitad')">½ bote</span><span onclick="texasObjetivoRapido('bote')">Bote</span><span onclick="texasObjetivoRapido('todo')">All-in</span></div>` : ''}`;
  } else if(!enMano){
    estadoTxt = 'Estás mirando esta mano';
  } else if(mesa.plegados[yo]){
    estadoTxt = 'Te retiraste de esta mano';
  } else {
    estadoTxt = `Turno de ${mesa.nombres[mesa.turno] || '...'}`;
  }

  const rondaTxt = { preflop: 'Pre-flop', flop: 'Flop', turn: 'Turn', river: 'River', fin: 'Fin de la mano' }[mesa.ronda];
  cont.innerHTML = gEscenaHTML('casino', `
    <div class="g-hud tx-hud"><span class="g-pill">${texasFichaHTML(bote)} bote</span><span class="g-pill">Mano ${mesa.mano} · ${rondaTxt}</span></div>
    <div class="tx-rivales">${otros.map(a => texasRivalHTML(mesa, a)).join('')}</div>
    <div class="tx-mesa">
      <div class="tx-comunes">${comunesHTML}</div>
      <div class="tx-ciegas">Ciegas ${mesa.ciega / 2} / ${mesa.ciega}</div>
    </div>
    <div class="tx-yo ${soyTurno ? 'tx-turno' : ''} ${mesa.plegados[yo] ? 'tx-fuera' : ''}">
      <div class="tx-yo-cartas">${misCartas.map(c => frCartaHTML(c, { estilo: '--cw:58px;' })).join('') || ''}</div>
      <div class="tx-yo-datos"><div>${texasFichaHTML(mesa.fichas[yo] || 0)} ${texasInsignias(mesa, yo)}</div>${miManoTxt ? `<div class="tx-mi-mano">${miManoTxt}</div>` : ''}${mesa.apostado[yo] ? `<div class="tx-apostado">Apostaste ${mesa.apostado[yo]}</div>` : ''}</div>
    </div>
    <p class="tx-estado ${soyTurno ? 'tx-estado-turno' : ''}">${estadoTxt}</p>
    ${accionesHTML}
    <div class="g-pie"><span onclick="texasVolverAlLobby()">‹ Lista de mesas</span><span onclick="texasTerminarMesa('${texasMesaIdActual}')">Abandonar mesa</span></div>`, 'tx-escena');
}

function renderTexas(){
  const cont = document.getElementById('texas-content');
  if(!cont) return;
  document.getElementById('texas-sub').textContent = texasMesaIdActual ? 'En una mesa' : 'Elegí o creá una mesa';
  const enMesa = !!(texasMesaIdActual && texasMesas[texasMesaIdActual]);
  document.getElementById('view-texas').classList.toggle('juego-inmersivo', enMesa);
  if(enMesa) renderTexasMesa();
  else { texasMesaIdActual = null; renderTexasLobby(); }
}
