// Copa Busmac: cursos de distintos viajes (y pueblos) de la misma agencia
// compiten entre sí. Cada curso anotado tiene un capitán (lo elige el
// organizador); el capitán desafía a otro curso eligiendo juego, día y hora y
// los jugadores que lo representan; el capitán rival acepta eligiendo los
// suyos. A la hora del partido los elegidos juegan desde su celular, estén
// donde estén: Truco en vivo (1 vs 1, 2 vs 2, 3 vs 3) o Trivia por equipos
// (las mismas 10 preguntas para todos; gana el equipo que más acierta).
// Tabla: 3 puntos por partido ganado, 1 por empate.
//
// Datos (Realtime Database):
//   copa/equipos/{id}    { agenciaId, viaje, nombre, localidad, capitan:{id,nombre}, activo }
//   copa/desafios/{id}   { agenciaId, a, b, juego, cuando, estado, jugA:{id:nombre}, jugB, resultado }
//   copa/partidas/{id}   lo que pasa en el partido (mesa de truco / respuestas de trivia)
// El id de un jugador en la Copa es "{codigoViaje}-{asiento}" (dos viajes
// pueden tener el mismo número de asiento).

const COPA_JUEGOS = {
  truco2: { nombre: 'Truco 1 vs 1', icono: '🃏', jugadores: 1 },
  truco4: { nombre: 'Truco 2 vs 2', icono: '🃏', jugadores: 2 },
  truco6: { nombre: 'Truco 3 vs 3', icono: '🃏', jugadores: 3 },
  trivia: { nombre: 'Trivia por equipos', icono: '🧠', jugadores: 3 },
};
const COPA_ANTES_MS = 10 * 60000;        // se puede entrar 10 min antes
const COPA_VENTANA_MS = 3 * 3600000;      // y hasta 3 horas después
const COPA_TRIVIA_PREGUNTAS = 10;
const COPA_TRIVIA_SEG = 20;

let copaAgenciaId = null;
let copaEquipos = {}, copaDesafios = {};
let copaRefEquipos = null, copaRefDesafios = null;
let copaEscuchandoAgencia = null;
let copaVista = { v: 'inicio' };
let copaPartidaTrivia = {};      // dId -> respuestas de todos
let copaRefPartida = null;

function copaEsc(t){ return String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function copaMiId(){ return (typeof codigoViaje !== 'undefined' && codigoViaje && miAsiento) ? codigoViaje + '-' + miAsiento : ''; }
function copaMiEquipoId(){
  const curso = typeof cursosMio === 'function' ? cursosMio() : '';
  if(!curso) return null;
  return Object.keys(copaEquipos).find(id => copaEquipos[id].viaje === codigoViaje && copaEquipos[id].nombre === curso && copaEquipos[id].activo !== false) || null;
}
function copaSoyCapitan(eqId){ const e = copaEquipos[eqId]; return !!(e && e.capitan && e.capitan.id === copaMiId()); }
function copaNombreEquipo(id){ const e = copaEquipos[id]; return e ? e.nombre + (e.localidad ? ' · ' + e.localidad : '') : 'Curso'; }
function copaFecha(ts){ return new Date(ts).toLocaleString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }); }
function copaEnVentana(d){ const t = Date.now(); return d.estado === 'aceptado' && t >= d.cuando - COPA_ANTES_MS && t <= d.cuando + COPA_VENTANA_MS; }
function copaLadoDe(d, eqId){ return d.a === eqId ? 'a' : d.b === eqId ? 'b' : null; }
function copaSoyJugador(d){ const yo = copaMiId(); return yo && ((d.jugA && d.jugA[yo]) || (d.jugB && d.jugB[yo])) ? (d.jugA && d.jugA[yo] ? 'a' : 'b') : null; }

// ---- Conexión con la base ----
function copaEscuchar(){
  if(typeof codigoViaje === 'undefined' || !codigoViaje) return Promise.resolve();
  const seguir = ag => {
    if(!ag || copaEscuchandoAgencia === ag) return;
    copaEscuchandoAgencia = ag;
    if(copaRefEquipos) copaRefEquipos.off();
    if(copaRefDesafios) copaRefDesafios.off();
    copaRefEquipos = db.ref('copa/equipos').orderByChild('agenciaId').equalTo(ag);
    copaRefEquipos.on('value', s => { copaEquipos = s.val() || {}; copaRefrescar(); });
    copaRefDesafios = db.ref('copa/desafios').orderByChild('agenciaId').equalTo(ag);
    copaRefDesafios.on('value', s => { copaDesafios = s.val() || {}; copaRefrescar(); });
  };
  if(copaAgenciaId) { seguir(copaAgenciaId); return Promise.resolve(); }
  return db.ref('salas/' + codigoViaje + '/agenciaId').once('value').then(s => { copaAgenciaId = s.val() || 'sin-agencia'; seguir(copaAgenciaId); });
}
function copaRefrescar(){
  const activa = document.querySelector('.view.active');
  if(activa && activa.id === 'view-copa') renderCopa();
  if(activa && activa.id === 'view-juegos' && typeof renderJuegos === 'function') { const b = document.getElementById('copa-badge'); if(b) b.textContent = copaPendientes() || ''; }
}
// Cosas que necesitan atención (para el globito en Juegos).
function copaPendientes(){
  const eq = copaMiEquipoId(); let n = 0;
  Object.keys(copaDesafios).forEach(id => {
    const d = copaDesafios[id];
    if(eq && d.b === eq && d.estado === 'propuesto' && copaSoyCapitan(eq)) n++;
    if(copaEnVentana(d) && copaSoyJugador(d)) n++;
  });
  return n;
}

function iniciarCopa(){
  if(typeof cursosEscuchar === 'function') cursosEscuchar();
  copaVista = { v: 'inicio' };
  const cont = document.getElementById('copa-content');
  if(cont && !Object.keys(copaEquipos).length) cont.innerHTML = gEscenaHTML('noche', gDialogoHTML('🏆 Copa Busmac', 'Cargando…'));
  copaEscuchar().then(renderCopa);
}
function copaIr(v, id){ if(v !== 'trivia'){ copaTriviaEnPregunta = false; copaTriviaPausa = false; clearInterval(copaTriviaTimer); } copaVista = { v, id }; renderCopa(); window.scrollTo(0, 0); }

// ---- Tabla de posiciones ----
function copaTabla(){
  const t = {};
  Object.keys(copaEquipos).forEach(id => { if(copaEquipos[id].activo !== false) t[id] = { id, pj: 0, pg: 0, pe: 0, pp: 0, pts: 0 }; });
  Object.keys(copaDesafios).forEach(k => {
    const d = copaDesafios[k];
    if(d.estado !== 'terminado' || !d.resultado || !t[d.a] || !t[d.b]) return;
    const g = d.resultado.ganador;
    t[d.a].pj++; t[d.b].pj++;
    if(g === 'empate'){ t[d.a].pe++; t[d.b].pe++; t[d.a].pts++; t[d.b].pts++; }
    else { const w = g === 'a' ? d.a : d.b, l = g === 'a' ? d.b : d.a; t[w].pg++; t[w].pts += 3; t[l].pp++; }
  });
  return Object.values(t).sort((x, y) => y.pts - x.pts || y.pg - x.pg || x.pp - y.pp);
}

// ---- Pantalla principal ----
function renderCopa(){
  const cont = document.getElementById('copa-content');
  if(!cont) return;
  if(copaVista.v === 'desafiar') return renderCopaDesafiar(cont);
  if(copaVista.v === 'aceptar') return renderCopaAceptar(cont, copaVista.id);
  if(copaVista.v === 'trivia') return renderCopaTrivia(cont, copaVista.id);
  const curso = typeof cursosMio === 'function' ? cursosMio() : '';
  const eq = copaMiEquipoId();
  const capitan = eq && copaSoyCapitan(eq);
  let h = gDialogoHTML('🏆 Copa Busmac', 'Tu curso contra cursos de otros pueblos. El capitán desafía, elige a los mejores para cada juego, y juegan cada uno desde su celular.');
  if(!curso) h += `<div class="g-dialogo"><div class="g-dialogo-titulo">Primero elegí tu curso</div><div class="g-dialogo-sub">Está en Ranking › Cursos.</div></div><div class="g-acciones"><button class="gbtn gbtn-ancho" onclick="cursosVista='cursos';showView('ranking')">Elegir mi curso</button></div>`;
  else if(!eq) h += gDialogoHTML(copaEsc(curso) + ' todavía no está en la Copa', 'Pedile al coordinador que anote a tu curso y elija al capitán.');
  else {
    const e = copaEquipos[eq];
    h += `<div class="g-dialogo"><div class="g-dialogo-titulo">${copaEsc(e.nombre)}${e.localidad ? ' · ' + copaEsc(e.localidad) : ''}</div><div class="g-dialogo-sub">Capitán: <b>${copaEsc(e.capitan ? e.capitan.nombre : 'sin elegir')}</b>${capitan ? ' · ¡sos vos! 🧢' : ''}</div></div>`;
  }
  const ds = Object.keys(copaDesafios).map(id => Object.assign({ id }, copaDesafios[id]));
  // 1) Partidos que se están jugando ahora
  const vivos = ds.filter(copaEnVentana).sort((x, y) => x.cuando - y.cuando);
  if(vivos.length){
    h += '<div class="section-label">🔴 Ahora</div>';
    vivos.forEach(d => { h += copaTarjetaPartido(d, eq, true); });
  }
  // 2) Desafíos que recibió mi curso
  if(eq){
    const recibidos = ds.filter(d => d.b === eq && d.estado === 'propuesto');
    const enviados = ds.filter(d => d.a === eq && d.estado === 'propuesto');
    if(recibidos.length){
      h += '<div class="section-label">⚔️ Los desafiaron</div>';
      recibidos.forEach(d => {
        h += `<div class="bingo-roster-item"><span><b>${copaEsc(copaNombreEquipo(d.a))}</b><br><span style="font-size:12px;">${COPA_JUEGOS[d.juego].icono} ${COPA_JUEGOS[d.juego].nombre} · ${copaFecha(d.cuando)}</span></span><span class="bingo-roster-derecha">${capitan ? `<button class="gbtn gbtn-quiero gbtn-chico" onclick="copaIr('aceptar','${d.id}')">Aceptar</button><button class="gbtn gbtn-no gbtn-chico" onclick="copaRechazar('${d.id}')">No</button>` : '<span style="font-size:12px;">Decide el capitán</span>'}</span></div>`;
      });
    }
    if(enviados.length){
      h += '<div class="section-label">📨 Desafíos enviados</div>';
      enviados.forEach(d => {
        h += `<div class="bingo-roster-item"><span>A <b>${copaEsc(copaNombreEquipo(d.b))}</b><br><span style="font-size:12px;">${COPA_JUEGOS[d.juego].nombre} · ${copaFecha(d.cuando)} · esperando respuesta</span></span><span class="bingo-roster-derecha">${capitan ? `<button class="btn-eliminar-pasajero" onclick="copaCancelar('${d.id}')" title="Cancelar desafío">✕</button>` : ''}</span></div>`;
      });
    }
    if(capitan) h += `<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-rojo" onclick="copaIr('desafiar')">⚔️ Desafiar a otro curso</button></div>`;
  }
  // 3) Próximos partidos
  const prox = ds.filter(d => d.estado === 'aceptado' && !copaEnVentana(d) && d.cuando > Date.now()).sort((x, y) => x.cuando - y.cuando);
  if(prox.length){
    h += '<div class="section-label">📅 Próximos partidos</div>';
    prox.slice(0, 12).forEach(d => { h += copaTarjetaPartido(d, eq, false); });
  }
  // 4) Tabla
  const tabla = copaTabla();
  if(tabla.length){
    h += '<div class="section-label">🏆 Tabla de posiciones</div><div class="g-dialogo" style="padding:8px 10px;"><table style="width:100%;font-size:13px;border-collapse:collapse;"><tr style="opacity:.75;font-size:11px;"><th style="text-align:left;">Curso</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>Pts</th></tr>'
      + tabla.map((r, i) => `<tr style="${r.id === eq ? 'font-weight:800;color:#ffd166;' : ''}"><td style="padding:4px 2px;">${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${copaEsc(copaNombreEquipo(r.id))}</td><td style="text-align:center;">${r.pj}</td><td style="text-align:center;">${r.pg}</td><td style="text-align:center;">${r.pe}</td><td style="text-align:center;">${r.pp}</td><td style="text-align:center;"><b>${r.pts}</b></td></tr>`).join('') + '</table></div>';
  }
  // 5) Resultados
  const fin = ds.filter(d => d.estado === 'terminado').sort((x, y) => y.cuando - x.cuando).slice(0, 10);
  if(fin.length){
    h += '<div class="section-label">📋 Resultados</div>';
    fin.forEach(d => {
      const r = d.resultado || {};
      const txt = r.ganador === 'empate' ? 'Empate' : 'Ganó ' + copaNombreEquipo(r.ganador === 'a' ? d.a : d.b);
      h += `<div class="bingo-roster-item"><span>${COPA_JUEGOS[d.juego].icono} <b>${copaEsc(copaEquipos[d.a] ? copaEquipos[d.a].nombre : '?')}</b> vs <b>${copaEsc(copaEquipos[d.b] ? copaEquipos[d.b].nombre : '?')}</b><br><span style="font-size:12px;">${copaEsc(txt)}${r.detalle ? ' · ' + copaEsc(r.detalle) : ''}</span></span></div>`;
    });
  }
  if(!vivos.length && !prox.length && !fin.length && !tabla.length) h += '<p class="g-ayuda">Todavía no hay cursos anotados en la Copa.</p>';
  cont.innerHTML = gEscenaHTML('noche', h);
  // Partidos de trivia que ya cerraron y no tienen resultado: se calcula.
  ds.filter(d => d.juego === 'trivia' && d.estado === 'aceptado' && Date.now() > d.cuando + COPA_VENTANA_MS).forEach(d => copaTriviaCerrar(d.id));
}

function copaTarjetaPartido(d, miEq, vivo){
  const J = COPA_JUEGOS[d.juego];
  const nombres = (o) => Object.keys(o || {}).map(k => copaEsc(o[k])).join(', ') || '—';
  const lado = copaSoyJugador(d);
  const misCap = (miEq && (d.a === miEq || d.b === miEq) && copaSoyCapitan(miEq));
  let botones = '';
  if(vivo && lado) botones += `<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-quiero" onclick="copaJugar('${d.id}')">${d.juego === 'trivia' ? '🧠 ¡Responder ahora!' : '🃏 ¡Entrar a la mesa!'}</button></div>`;
  if(misCap && !vivo) botones += `<div class="g-pie"><span onclick="copaCambiarHora('${d.id}')">Cambiar día y hora</span><span onclick="copaCancelar('${d.id}')">Suspender</span></div>`;
  if(misCap && vivo) botones += `<div class="g-pie"><span></span><span onclick="copaAbandonar('${d.id}')">🏳️ Abandonar (gana el rival)</span></div>`;
  return `<div class="g-dialogo" style="padding:10px 14px;${lado ? 'border:2px solid #ffd166;' : ''}">
    <div class="g-dialogo-titulo" style="font-size:15px;">${J.icono} ${J.nombre}${vivo ? ' · <span style="color:#ff6b6b;">en juego</span>' : ''}</div>
    <div class="g-dialogo-sub"><b>${copaEsc(copaNombreEquipo(d.a))}</b>: ${nombres(d.jugA)}<br><b>${copaEsc(copaNombreEquipo(d.b))}</b>: ${nombres(d.jugB)}<br>🕒 ${copaFecha(d.cuando)}${lado && !vivo ? '<br>⭐ <b>¡Te eligieron para jugar!</b> Entrá a esa hora.' : ''}</div>
    ${botones}</div>`;
}

// ---- Elegir jugadores del curso ----
function copaJugadoresDeMiCurso(){
  const curso = typeof cursosMio === 'function' ? cursosMio() : '';
  const mes = typeof puntosMes === 'function' ? puntosMes() : '';
  return Object.keys(rankingPuntos).map(a => Object.assign({ asiento: a }, rankingPuntos[a]))
    .filter(e => e.curso === curso && e.nombre)
    .map(e => ({ id: codigoViaje + '-' + e.asiento, nombre: e.nombre, mes: (e.m && e.m[mes]) || 0, pts: e.pts || 0 }))
    .sort((x, y) => y.mes - x.mes || y.pts - x.pts);
}
function copaSelectorJugadoresHTML(n){
  const js = copaJugadoresDeMiCurso();
  if(!js.length) return '<p class="g-ayuda">Todavía nadie de tu curso entró a la app.</p>';
  return `<div class="g-dialogo-sub" style="margin:4px 0;">Elegí ${n === 1 ? '1 jugador' : n + ' jugadores'} (están ordenados por los puntos de este mes):</div>`
    + js.map(j => `<label class="bingo-roster-item" style="cursor:pointer;"><span><input type="checkbox" class="copa-jug" value="${copaEsc(j.id)}" data-nombre="${copaEsc(j.nombre)}" onchange="copaLimitarJugadores(${n})" style="width:20px;height:20px;vertical-align:middle;margin-right:8px;">${copaEsc(j.nombre)}${j.id === copaMiId() ? ' (vos)' : ''}</span><span style="font-size:12px;">${j.mes} pts este mes</span></label>`).join('');
}
function copaLimitarJugadores(n){
  const marcados = [...document.querySelectorAll('.copa-jug')].filter(c => c.checked);
  document.querySelectorAll('.copa-jug').forEach(c => { c.disabled = !c.checked && marcados.length >= n; });
}
function copaLeerJugadores(n){
  const marcados = [...document.querySelectorAll('.copa-jug')].filter(c => c.checked);
  if(marcados.length !== n){ mostrarToast('Elegí ' + (n === 1 ? '1 jugador' : n + ' jugadores')); return null; }
  const o = {}; marcados.forEach(c => { o[c.value] = c.dataset.nombre; });
  return o;
}

let copaJuegoElegido = 'truco2';
function renderCopaDesafiar(cont){
  const eq = copaMiEquipoId();
  if(!eq || !copaSoyCapitan(eq)){ copaIr('inicio'); return; }
  const rivales = Object.keys(copaEquipos).filter(id => id !== eq && copaEquipos[id].activo !== false);
  const J = COPA_JUEGOS[copaJuegoElegido];
  const manana = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');
  let h = gDialogoHTML('⚔️ Desafiar a otro curso', 'Elegí el rival, el juego, el día y la hora, y quiénes juegan. El capitán del otro curso tiene que aceptar.');
  h += '<div class="section-label">Rival</div>';
  h += rivales.length ? `<select id="copa-rival" style="width:100%;font-size:15px;padding:10px;border-radius:12px;margin-bottom:6px;">${rivales.map(id => `<option value="${id}">${copaEsc(copaNombreEquipo(id))}</option>`).join('')}</select>` : '<p class="g-ayuda">Todavía no hay otros cursos en la Copa.</p>';
  h += '<div class="section-label">Juego</div><div class="g-acciones">' + Object.keys(COPA_JUEGOS).map(k => `<button class="gbtn gbtn-chico ${copaJuegoElegido === k ? 'gbtn-sel' : 'gbtn-no'}" onclick="copaJuegoElegido='${k}';renderCopa()">${COPA_JUEGOS[k].icono} ${COPA_JUEGOS[k].nombre}</button>`).join('') + '</div>';
  h += `<div class="section-label">Día y hora</div><div style="display:flex;gap:8px;margin-bottom:6px;"><input type="date" id="copa-dia" value="${manana}" style="flex:1;font-size:15px;padding:10px;border-radius:12px;"><input type="time" id="copa-hora" value="19:00" style="width:120px;font-size:15px;padding:10px;border-radius:12px;"></div>`;
  h += '<div class="section-label">Jugadores</div>' + copaSelectorJugadoresHTML(J.jugadores);
  h += `<div class="g-acciones">${rivales.length ? '<button class="gbtn gbtn-ancho gbtn-quiero" onclick="copaEnviarDesafio()">Enviar desafío</button>' : ''}</div><div class="g-pie"><span onclick="copaIr('inicio')">‹ Volver</span></div>`;
  cont.innerHTML = gEscenaHTML('noche', h);
}
function copaEnviarDesafio(){
  const eq = copaMiEquipoId(); if(!eq) return;
  const J = COPA_JUEGOS[copaJuegoElegido];
  const jugA = copaLeerJugadores(J.jugadores); if(!jugA) return;
  const dia = document.getElementById('copa-dia').value, hora = document.getElementById('copa-hora').value;
  const cuando = new Date(dia + 'T' + (hora || '19:00')).getTime();
  if(!dia || isNaN(cuando) || cuando < Date.now() - 60000){ mostrarToast('Elegí un día y una hora que todavía no pasaron'); return; }
  const b = document.getElementById('copa-rival').value;
  db.ref('copa/desafios').push({ agenciaId: copaAgenciaId, a: eq, b, juego: copaJuegoElegido, cuando, estado: 'propuesto', jugA, creado: Date.now() }).then(() => {
    mostrarToast('¡Desafío enviado! Avisale al capitán de ' + (copaEquipos[b] ? copaEquipos[b].nombre : 'ese curso'));
    copaIr('inicio');
  });
}
function renderCopaAceptar(cont, dId){
  const d = copaDesafios[dId]; const eq = copaMiEquipoId();
  if(!d || d.b !== eq || !copaSoyCapitan(eq) || d.estado !== 'propuesto'){ copaIr('inicio'); return; }
  const J = COPA_JUEGOS[d.juego];
  let h = gDialogoHTML('Aceptar el desafío', `${copaEsc(copaNombreEquipo(d.a))} los desafía a ${J.nombre} el ${copaFecha(d.cuando)}. Juegan por ellos: ${Object.keys(d.jugA || {}).map(k => copaEsc(d.jugA[k])).join(', ')}.`);
  h += '<div class="section-label">¿Quiénes juegan por tu curso?</div>' + copaSelectorJugadoresHTML(J.jugadores);
  h += `<div class="g-acciones"><button class="gbtn gbtn-ancho gbtn-quiero" onclick="copaConfirmarAceptar('${dId}')">Aceptar el desafío</button></div><div class="g-pie"><span onclick="copaIr('inicio')">‹ Volver</span><span onclick="copaRechazar('${dId}')">No aceptar</span></div>`;
  cont.innerHTML = gEscenaHTML('noche', h);
}
function copaConfirmarAceptar(dId){
  const d = copaDesafios[dId]; if(!d) return;
  const jugB = copaLeerJugadores(COPA_JUEGOS[d.juego].jugadores); if(!jugB) return;
  db.ref('copa/desafios/' + dId).update({ jugB, estado: 'aceptado' }).then(() => { mostrarToast('¡Desafío aceptado! A prepararse 💪'); copaIr('inicio'); });
}
function copaRechazar(dId){
  if(!confirm('¿No aceptar este desafío?')) return;
  db.ref('copa/desafios/' + dId).update({ estado: 'rechazado' }).then(() => copaIr('inicio'));
}
function copaCancelar(dId){
  if(!confirm('¿Suspender este partido?')) return;
  db.ref('copa/desafios/' + dId).update({ estado: 'cancelado' }).then(() => copaIr('inicio'));
}
function copaCambiarHora(dId){
  const d = copaDesafios[dId]; if(!d) return;
  const actual = new Date(d.cuando);
  const txt = prompt('Nuevo día y hora (dd/mm hh:mm)', String(actual.getDate()).padStart(2, '0') + '/' + String(actual.getMonth() + 1).padStart(2, '0') + ' ' + String(actual.getHours()).padStart(2, '0') + ':' + String(actual.getMinutes()).padStart(2, '0'));
  if(!txt) return;
  const m = txt.match(/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/);
  if(!m){ mostrarToast('Escribilo así: 25/11 19:30'); return; }
  let f = new Date(actual.getFullYear(), Number(m[2]) - 1, Number(m[1]), Number(m[3]), Number(m[4]));
  if(f.getTime() < Date.now() - 86400000) f.setFullYear(f.getFullYear() + 1);
  db.ref('copa/desafios/' + dId).update({ cuando: f.getTime() }).then(() => mostrarToast('Partido movido al ' + copaFecha(f.getTime())));
}
function copaAbandonar(dId){
  const d = copaDesafios[dId]; const eq = copaMiEquipoId(); if(!d || !eq) return;
  if(!confirm('¿Abandonar el partido? Se lo dan por ganado al otro curso.')) return;
  const ganador = d.a === eq ? 'b' : 'a';
  copaGuardarResultado(dId, { ganador, detalle: 'abandono' });
}
function copaGuardarResultado(dId, resultado){
  return db.ref('copa/desafios/' + dId).transaction(d => {
    if(!d || d.estado === 'terminado') return;
    d.estado = 'terminado'; d.resultado = Object.assign({ en: Date.now() }, resultado);
    return d;
  });
}

function copaJugar(dId){
  const d = copaDesafios[dId]; if(!d) return;
  if(d.juego === 'trivia') { copaIr('trivia', dId); return; }
  copaTrucoEntrar(dId);
}

// ---- Truco en la Copa (usa truco.js con la mesa en copa/partidas) ----
function copaTrucoEntrar(dId){
  const d = copaDesafios[dId]; if(!d) return;
  const n = COPA_JUEGOS[d.juego].jugadores;
  const A = Object.keys(d.jugA || {}), B = Object.keys(d.jugB || {});
  const reservados = [];
  for(let i = 0; i < n; i++){ reservados.push(A[i], B[i]); }   // A1, B1, A2, B2…: el truco arma los equipos alternados
  const nombres = Object.assign({}, d.jugA, d.jugB);
  trucoEntrarModoCopa({ id: dId, ruta: 'copa/partidas/' + dId, yo: copaMiId(), reservados, nombres, capacidad: n * 2 });
  showView('truco');
}
// Lo llama truco.js cuando termina un partido de la Copa.
function copaTrucoTerminado(dId, mesa){
  const g = mesa.ganadorFinal === 'A' ? 'a' : 'b';
  copaGuardarResultado(dId, { ganador: g, detalle: (mesa.puntajeEquipos.A || 0) + ' a ' + (mesa.puntajeEquipos.B || 0) });
}

// ---- Trivia por equipos ----
function copaSemilla(txt){ let h = 1779033703; for(let i = 0; i < txt.length; i++){ h = Math.imul(h ^ txt.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function copaTriviaPreguntas(dId){
  const r = copaSemilla(dId);
  const todas = [];
  Object.keys(TEMAS).forEach(k => (TEMAS[k].preguntas || []).forEach(p => todas.push(p)));
  for(let i = todas.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [todas[i], todas[j]] = [todas[j], todas[i]]; }
  return todas.slice(0, COPA_TRIVIA_PREGUNTAS).map(p => {
    const orden = p.opciones.map((_, i) => i);
    for(let i = orden.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
    return { cat: p.cat, text: p.text, opciones: orden.map(i => p.opciones[i]), correcta: orden.indexOf(p.correcta) };
  });
}
function copaRefTrivia(dId){ return db.ref('copa/partidas/' + dId + '/trivia'); }
let copaPartidaEscuchada = null;   // dId cuyas respuestas ya llegaron
function copaEscucharPartida(dId){
  if(copaRefPartida) copaRefPartida.off();
  copaPartidaEscuchada = null;
  copaRefPartida = copaRefTrivia(dId);
  copaRefPartida.on('value', s => {
    copaPartidaTrivia[dId] = s.val() || {};
    copaPartidaEscuchada = dId;
    const activa = document.querySelector('.view.active');
    if(activa && activa.id === 'view-copa' && copaVista.v === 'trivia' && copaVista.id === dId && !copaTriviaEnPregunta && !copaTriviaPausa) renderCopa();
    copaTriviaRevisarFin(dId);
  });
}
// Mientras hay una pregunta en pantalla (o el cartel de correcto/incorrecto)
// nada redibuja la trivia: si no, cualquier novedad de la Copa la salteaba.
let copaTriviaEnPregunta = false, copaTriviaPausa = false, copaTriviaTimer = null, copaTriviaMostrada = 0;
function renderCopaTrivia(cont, dId){
  const d = copaDesafios[dId]; const lado = d && copaSoyJugador(d);
  if(!d){ copaIr('inicio'); return; }
  if(copaTriviaEnPregunta || copaTriviaPausa) return;
  // Hasta no tener las respuestas guardadas no se muestra ninguna pregunta
  // (si no, se marcaría como vista una que ya estaba respondida).
  if(copaPartidaEscuchada !== dId){
    cont.innerHTML = gEscenaHTML('noche', gDialogoHTML('🧠 Trivia por equipos', 'Cargando…'));
    if(!copaRefPartida || copaRefPartida.toString().indexOf(dId) < 0) copaEscucharPartida(dId);
    return;
  }
  const datos = copaPartidaTrivia[dId] || {};
  const yo = copaMiId();
  const mio = datos[yo] || {};
  const pregs = copaTriviaPreguntas(dId);
  const respondidas = Object.keys(mio.r || {}).length;
  if(lado && copaEnVentana(d) && respondidas < pregs.length){
    const i = respondidas;
    copaTriviaEnPregunta = true;
    copaTriviaMostrada = Date.now();
    // Se marca como vista al mostrarla: si recarga la página, cuenta como no respondida.
    copaRefTrivia(dId).child(yo).update({ nombre: miNombre, lado, ['r/' + i]: { ok: false, ms: COPA_TRIVIA_SEG * 1000 } });
    const p = pregs[i];
    cont.innerHTML = gEscenaHTML('noche', `
      <div class="g-hud"><span class="g-pill">Pregunta ${i + 1}/${pregs.length}</span><span class="g-pill" id="copa-reloj">⏱ ${COPA_TRIVIA_SEG}</span></div>
      <div style="height:8px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;margin:4px 0 10px;"><span id="copa-barra" style="display:block;height:100%;width:100%;background:#ffd166;transition:width 1s linear;"></span></div>
      ${gDialogoHTML(copaEsc(p.text), copaEsc(p.cat))}
      <div class="g-acciones" style="grid-template-columns:1fr;">${p.opciones.map((o, k) => `<button class="gbtn gbtn-ancho" onclick="copaTriviaResponder('${dId}',${i},${k})">${copaEsc(o)}</button>`).join('')}</div>`);
    clearInterval(copaTriviaTimer);
    copaTriviaTimer = setInterval(() => {
      const quedan = COPA_TRIVIA_SEG - Math.floor((Date.now() - copaTriviaMostrada) / 1000);
      const reloj = document.getElementById('copa-reloj'), barra = document.getElementById('copa-barra');
      if(reloj) reloj.textContent = '⏱ ' + Math.max(0, quedan);
      if(barra) barra.style.width = Math.max(0, quedan / COPA_TRIVIA_SEG * 100) + '%';
      if(quedan <= 0) copaTriviaResponder(dId, i, -1);
    }, 250);
    return;
  }
  copaTriviaEnPregunta = false;
  clearInterval(copaTriviaTimer);
  if(lado && respondidas >= pregs.length && !mio.fin) copaRefTrivia(dId).child(yo).update({ fin: true });
  const tot = copaTriviaTotales(d, datos);
  const misOk = Object.keys(mio.r || {}).filter(k => mio.r[k].ok).length;
  let h = gDialogoHTML('🧠 Trivia por equipos', `${copaEsc(copaNombreEquipo(d.a))} vs ${copaEsc(copaNombreEquipo(d.b))}`);
  if(lado) h += gDialogoHTML(respondidas >= pregs.length ? `Acertaste ${misOk} de ${pregs.length}` : 'Ya no se puede responder', respondidas >= pregs.length ? 'Ahora a esperar al resto de los jugadores.' : '');
  h += `<div class="g-dialogo"><div class="g-dialogo-titulo">Marcador</div><div class="g-dialogo-sub">${copaEsc(copaEquipos[d.a] ? copaEquipos[d.a].nombre : 'A')}: <b>${tot.a.ok}</b> aciertos (${tot.a.fin}/${tot.a.n} terminaron)<br>${copaEsc(copaEquipos[d.b] ? copaEquipos[d.b].nombre : 'B')}: <b>${tot.b.ok}</b> aciertos (${tot.b.fin}/${tot.b.n} terminaron)</div></div>`;
  if(d.estado === 'terminado' && d.resultado) h += gDialogoHTML(d.resultado.ganador === 'empate' ? '🤝 Empate' : '🏆 Ganó ' + copaEsc(copaNombreEquipo(d.resultado.ganador === 'a' ? d.a : d.b)), copaEsc(d.resultado.detalle || ''));
  h += `<div class="g-pie"><span onclick="copaIr('inicio')">‹ Volver a la Copa</span></div>`;
  cont.innerHTML = gEscenaHTML('noche', h);
}
function copaTriviaResponder(dId, i, k){
  if(!copaTriviaEnPregunta) return;
  copaTriviaEnPregunta = false;
  copaTriviaPausa = true;
  clearInterval(copaTriviaTimer);
  const p = copaTriviaPreguntas(dId)[i];
  const ms = Math.min(COPA_TRIVIA_SEG * 1000, Date.now() - copaTriviaMostrada);
  const ok = k === p.correcta;
  copaRefTrivia(dId).child(copaMiId()).child('r/' + i).set({ ok, ms }).then(() => {
    if(ok && typeof ganarMonedas === 'function') ganarMonedas(2);
    mostrarToast(ok ? '✅ ¡Correcto!' : k < 0 ? '⏱ Se acabó el tiempo' : '❌ Era: ' + p.opciones[p.correcta], ok ? 'gain' : 'loss');
    setTimeout(() => { copaTriviaPausa = false; renderCopa(); }, 900);
  });
}
function copaTriviaTotales(d, datos){
  const t = { a: { ok: 0, ms: 0, fin: 0, n: Object.keys(d.jugA || {}).length }, b: { ok: 0, ms: 0, fin: 0, n: Object.keys(d.jugB || {}).length } };
  Object.keys(datos || {}).forEach(id => {
    const j = datos[id]; const lado = d.jugA && d.jugA[id] ? 'a' : d.jugB && d.jugB[id] ? 'b' : null;
    if(!lado) return;
    Object.keys(j.r || {}).forEach(k => { if(j.r[k].ok) t[lado].ok++; t[lado].ms += Number(j.r[k].ms) || 0; });
    if(j.fin) t[lado].fin++;
  });
  return t;
}
function copaTriviaRevisarFin(dId){
  const d = copaDesafios[dId]; if(!d || d.estado !== 'aceptado') return;
  const t = copaTriviaTotales(d, copaPartidaTrivia[dId]);
  const todos = t.a.fin >= t.a.n && t.b.fin >= t.b.n;
  if(todos || Date.now() > d.cuando + COPA_VENTANA_MS) copaTriviaDecidir(dId, t);
}
function copaTriviaDecidir(dId, t){
  let ganador = t.a.ok > t.b.ok ? 'a' : t.b.ok > t.a.ok ? 'b' : (t.a.ms < t.b.ms ? 'a' : t.b.ms < t.a.ms ? 'b' : 'empate');
  const desempate = t.a.ok === t.b.ok && ganador !== 'empate' ? ' (desempate por rapidez)' : '';
  copaGuardarResultado(dId, { ganador, detalle: t.a.ok + ' a ' + t.b.ok + ' aciertos' + desempate });
}
function copaTriviaCerrar(dId){
  copaRefTrivia(dId).once('value').then(s => { copaPartidaTrivia[dId] = s.val() || {}; copaTriviaRevisarFin(dId); });
}

// ---- Panel del organizador: anotar los cursos del viaje en la Copa ----
let copaAdminAbiertoPara = null;
let copaAdminEquiposViaje = {};
function adminToggleCopa(codigo){
  copaAdminAbiertoPara = copaAdminAbiertoPara === codigo ? null : codigo;
  if(!copaAdminAbiertoPara){ renderAdminViajes(); return; }
  db.ref('copa/equipos').orderByChild('viaje').equalTo(codigo).once('value').then(s => { copaAdminEquiposViaje = s.val() || {}; renderAdminViajes(); });
}
function copaIdEquipo(codigo, curso){ return codigo + '_' + String(curso).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 30); }
function adminCopaPanelHTML(codigo, datos){
  if(copaAdminAbiertoPara !== codigo) return '';
  const cursos = Array.isArray(datos.cursos) ? datos.cursos : Object.values(datos.cursos || {});
  if(!cursos.length) return '<div style="margin:-6px 0 10px;font-size:13px;color:var(--gray);">Primero cargá los cursos del viaje (botón 🎓).</div>';
  const puntos = (datos.ranking && datos.ranking.puntos) || {};
  return `<div style="margin:-6px 0 10px;padding:10px;border:1px dashed var(--line-color,#ccc);border-radius:12px;">
    <p style="font-size:12.5px;color:var(--gray);margin-bottom:8px;">🏆 <b>Copa Busmac</b>: los cursos anotados pueden desafiar a cursos de otros viajes de la agencia. El capitán desafía y elige a los jugadores.</p>
    ${cursos.map((c, i) => {
      const id = copaIdEquipo(codigo, c), e = copaAdminEquiposViaje[id] || {};
      const js = Object.keys(puntos).filter(a => puntos[a] && puntos[a].curso === c && puntos[a].nombre);
      return `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px;font-size:13px;">
        <label style="min-width:130px;"><input type="checkbox" id="copa-adm-on-${codigo}-${i}" ${e.activo !== false && e.nombre ? 'checked' : ''}> <b>${copaEsc(c)}</b></label>
        <input id="copa-adm-loc-${codigo}-${i}" value="${copaEsc(e.localidad || '')}" placeholder="Colegio y pueblo (ej: Esc. 6225 · Rufino)" style="flex:1;min-width:160px;font-size:13px;">
        <select id="copa-adm-cap-${codigo}-${i}" style="font-size:13px;"><option value="">Capitán…</option>${js.map(a => `<option value="${a}" ${e.capitan && e.capitan.id === codigo + '-' + a ? 'selected' : ''}>${copaEsc(puntos[a].nombre)} (asiento ${a})</option>`).join('')}</select>
        <button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 10px;" onclick="adminGuardarEquipoCopa('${codigo}',${i})">Guardar</button>
      </div>`;
    }).join('')}
    ${cursos.some((c) => !Object.keys(puntos).some(a => puntos[a] && puntos[a].curso === c)) ? '<p style="font-size:11.5px;color:var(--gray);">Para elegir capitán, los chicos tienen que haber entrado a la app y elegido su curso.</p>' : ''}
  </div>`;
}
function adminGuardarEquipoCopa(codigo, i){
  db.ref('salas/' + codigo).once('value').then(s => {
    const datos = s.val() || {};
    const cursos = Array.isArray(datos.cursos) ? datos.cursos : Object.values(datos.cursos || {});
    const curso = cursos[i]; if(!curso) return;
    const id = copaIdEquipo(codigo, curso);
    const on = document.getElementById(`copa-adm-on-${codigo}-${i}`).checked;
    const loc = document.getElementById(`copa-adm-loc-${codigo}-${i}`).value.trim().slice(0, 60);
    const cap = document.getElementById(`copa-adm-cap-${codigo}-${i}`).value;
    const p = (datos.ranking && datos.ranking.puntos && datos.ranking.puntos[cap]) || null;
    const equipo = { agenciaId: datos.agenciaId || (typeof agenciaActualId !== 'undefined' ? agenciaActualId : ''), viaje: codigo, nombre: curso, localidad: loc, activo: on, capitan: p ? { id: codigo + '-' + cap, nombre: p.nombre } : null };
    return db.ref('copa/equipos/' + id).set(equipo).then(() => {
      copaAdminEquiposViaje[id] = equipo;
      mostrarToast(on ? curso + ' anotado en la Copa' : curso + ' fuera de la Copa');
      renderAdminViajes();
    });
  });
}
