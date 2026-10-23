// Guerra de cursos: el organizador carga los cursos de cada viaje
// (salas/{viaje}/cursos), cada alumno elige el suyo y el ranking muestra
// también una tabla por curso. El puntaje de un curso es el promedio de sus
// 10 mejores jugadores, así no gana el curso que simplemente es más grande.
//
// Los puntos son los del ranking del viaje: salen de juegos de habilidad (lo
// que depende del azar va a la billetera y no cuenta).

const CURSOS_MEJORES = 10;
let cursosViaje = [];
let cursosCodigoEscuchado = '';
let cursosRefEscuchada = null;
let cursosVista = 'jugadores'; // 'jugadores' | 'cursos'

// Metas del mes: cada curso tiene que juntar entre todos (meta por jugador ×
// jugadores del curso) en el mes. Cada mes cumplido es una ⭐ que queda para
// siempre; al final las estrellas se canjean por el premio que defina la
// agencia (salas/{viaje}/ajustes/metas: { porJugador, premio }).
const CURSOS_META_DEFECTO = 500;
let cursosMetas = { porJugador: CURSOS_META_DEFECTO, premio: '' };
let cursosMetasRef = null;
const CURSOS_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function cursosNombreMes(mes){ return CURSOS_MESES[Number(String(mes).slice(5, 7)) - 1] || mes; }
function cursosMesActual(){ return typeof puntosMes === 'function' ? puntosMes() : new Date().toLocaleDateString('en-CA').slice(0, 7); }

function cursosMetasCalcular(){
  const mesAct = cursosMesActual();
  return cursosViaje.map(c => {
    const js = Object.keys(rankingPuntos).map(a => rankingPuntos[a]).filter(e => e && e.curso === c);
    const meta = Math.max(1, js.length) * (Number(cursosMetas.porJugador) || CURSOS_META_DEFECTO);
    const sumas = {};
    js.forEach(e => Object.keys(e.m || {}).forEach(mes => { sumas[mes] = (sumas[mes] || 0) + (Number(e.m[mes]) || 0); }));
    const cumplidos = Object.keys(sumas).filter(mes => mes < mesAct && sumas[mes] >= meta).sort();
    const actual = sumas[mesAct] || 0;
    if(actual >= meta) cumplidos.push(mesAct);
    return { curso: c, jugadores: js.length, meta, actual, cumplidos, actualCumplido: actual >= meta };
  });
}

function cursosMetaMiaHTML(){
  const mio = cursosMio();
  if(!mio) return '';
  const m = cursosMetasCalcular().find(x => x.curso === mio);
  if(!m) return '';
  const pct = Math.min(100, Math.round(m.actual / m.meta * 100));
  const mesTxt = cursosNombreMes(cursosMesActual());
  const estrellas = m.cumplidos.length ? m.cumplidos.map(mes => `<span title="${cursosNombreMes(mes)}" style="display:inline-flex;flex-direction:column;align-items:center;font-size:20px;line-height:1;">⭐<small style="font-size:9.5px;font-weight:700;opacity:.8;margin-top:2px;">${cursosNombreMes(mes).slice(0, 3)}</small></span>`).join('') : '<span style="font-size:12px;opacity:.8;">Todavía ninguna: ¡la primera puede ser este mes!</span>';
  return `<div class="g-dialogo" style="padding:12px 14px;">
    <div class="g-dialogo-titulo">🎯 Meta de ${mesTxt} · ${cursosEsc(mio)}</div>
    <div style="height:14px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;margin:8px 0 4px;"><span style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#ffb347,#5ee08a);"></span></div>
    <div class="g-dialogo-sub">${m.actualCumplido ? '🎉 ¡Meta cumplida! Ya ganaron la ⭐ de ' + mesTxt + '.' : `${m.actual.toLocaleString('es-AR')} de ${m.meta.toLocaleString('es-AR')} puntos entre los ${m.jugadores} del curso · faltan ${(m.meta - m.actual).toLocaleString('es-AR')}`}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-top:8px;"><b style="font-size:13px;">Estrellas del curso:</b> ${estrellas}</div>
    ${cursosMetas.premio ? `<div class="g-dialogo-sub" style="margin-top:8px;">🎁 ${cursosEsc(cursosMetas.premio)}</div>` : ''}
  </div>`;
}

function cursosEsc(t){
  return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function cursosEscuchar(){
  if(typeof codigoViaje === 'undefined' || !codigoViaje || cursosCodigoEscuchado === codigoViaje) return;
  if(cursosRefEscuchada) cursosRefEscuchada.off();
  cursosCodigoEscuchado = codigoViaje;
  cursosRefEscuchada = db.ref('salas/' + codigoViaje + '/cursos');
  cursosRefEscuchada.on('value', snap => {
    const v = snap.val();
    cursosViaje = (Array.isArray(v) ? v : (v ? Object.keys(v).map(k => v[k]) : [])).map(String).filter(Boolean);
    if(typeof renderRanking === 'function' && document.getElementById('ranking-list')) renderRanking();
  });
  if(cursosMetasRef) cursosMetasRef.off();
  cursosMetasRef = db.ref('salas/' + codigoViaje + '/ajustes/metas');
  cursosMetasRef.on('value', snap => {
    const v = snap.val() || {};
    cursosMetas = { porJugador: Number(v.porJugador) || CURSOS_META_DEFECTO, premio: String(v.premio || '') };
    if(typeof renderRanking === 'function' && document.getElementById('ranking-list')) renderRanking();
  });
}

function cursosMio(){
  try { return localStorage.getItem('mi-curso-' + codigoViaje) || ''; } catch(e){ return ''; }
}

function cursosElegir(i){
  const curso = cursosViaje[i];
  if(!curso) return;
  try { localStorage.setItem('mi-curso-' + codigoViaje, curso); } catch(e){}
  cursosSincronizar();
  if(typeof mostrarToast === 'function') mostrarToast('Ya sumás para ' + curso);
  renderRanking();
}

function cursosCambiar(){
  try { localStorage.removeItem('mi-curso-' + codigoViaje); } catch(e){}
  renderRanking();
}

function cursosSincronizar(){
  if(typeof miAsiento === 'undefined' || !miAsiento || !miNombre || !codigoViaje) return;
  const curso = cursosMio();
  if(!curso) return;
  try { rankingRefPuntos().child(String(miAsiento)).update({ curso }); } catch(e){}
}

function cursosVer(v){ cursosVista = v; renderRanking(); }
function cursosVistaActiva(){ return cursosVista === 'cursos' && cursosViaje.length > 0; }

// Botones "Jugadores | Cursos" para arriba del ranking (solo si el viaje tiene cursos).
function cursosSelectorHTML(){
  if(!cursosViaje.length) return '';
  return `<div class="cur-selector"><button class="cur-opcion${cursosVista === 'jugadores' ? ' cur-opcion-sel' : ''}" onclick="cursosVer('jugadores')">👤 Jugadores</button><button class="cur-opcion${cursosVista === 'cursos' ? ' cur-opcion-sel' : ''}" onclick="cursosVer('cursos')">🎓 Cursos</button></div>`;
}

// Tabla de cursos: promedio de los mejores jugadores de cada uno.
function cursosCalcular(){
  const porCurso = {};
  cursosViaje.forEach(c => { porCurso[c] = []; });
  Object.keys(rankingPuntos).forEach(a => {
    const e = rankingPuntos[a];
    if(e && e.curso && porCurso[e.curso]) porCurso[e.curso].push(e.pts || 0);
  });
  return cursosViaje.map(c => {
    const pts = porCurso[c].sort((x, y) => y - x).slice(0, CURSOS_MEJORES);
    const promedio = pts.length ? Math.round(pts.reduce((s, x) => s + x, 0) / pts.length) : 0;
    return { curso: c, promedio, jugadores: porCurso[c].length };
  }).sort((a, b) => b.promedio - a.promedio || b.jugadores - a.jugadores);
}

function cursosRankingHTML(){
  const mio = cursosMio();
  const tabla = cursosCalcular();
  const metas = {};
  cursosMetasCalcular().forEach(m => { metas[m.curso] = m; });
  const maximo = Math.max(1, ...tabla.map(t => t.promedio));
  const medallas = ['🥇', '🥈', '🥉'];
  const eleccion = mio ? '' : `<div class="cur-elegir"><div class="cur-elegir-titulo">¿De qué curso sos?</div><div class="cur-elegir-sub">Elegilo y tus puntos suman a la Guerra de cursos.</div><div class="cur-elegir-lista">${cursosViaje.map((c, i) => `<button class="cur-chip" onclick="cursosElegir(${i})">${cursosEsc(c)}</button>`).join('')}</div></div>`;
  const filas = tabla.map((t, i) => `<div class="cur-fila${t.curso === mio ? ' cur-fila-yo' : ''}">
    <span class="cur-puesto">${medallas[i] || (i + 1)}</span>
    <div class="cur-datos"><div class="cur-nombre">${cursosEsc(t.curso)}</div>
      <div class="cur-barra"><span style="width:${Math.round(t.promedio / maximo * 100)}%"></span></div>
      <div class="cur-sub">${t.jugadores} jugador${t.jugadores === 1 ? '' : 'es'}${t.curso === mio ? ' · tu curso' : ''}${metas[t.curso] ? ` · 🎯 ${Math.min(100, Math.round(metas[t.curso].actual / metas[t.curso].meta * 100))}% del mes · ${metas[t.curso].cumplidos.length ? '⭐'.repeat(Math.min(metas[t.curso].cumplidos.length, 12)) : 'sin ⭐'}` : ''}</div></div>
    <span class="cur-pts">${t.promedio}<small> pts</small></span>
  </div>`).join('');
  return gEscenaHTML('noche', `
    ${cursosSelectorHTML()}
    <div class="g-dialogo"><div class="g-dialogo-titulo">🎓 Guerra de cursos</div><div class="g-dialogo-sub">Cuenta el promedio de los ${CURSOS_MEJORES} mejores de cada curso.</div></div>
    ${eleccion}
    ${cursosMetaMiaHTML()}
    <div class="cur-lista">${filas}</div>
    ${mio ? `<p class="g-ayuda" onclick="cursosCambiar()" style="text-decoration:underline;cursor:pointer;">Cambiar mi curso</p>` : ''}`);
}

// ---- Panel del organizador: cargar los cursos de un viaje ----

let adminCursosAbiertoPara = null;
let adminCursosDatos = {};

function adminToggleCursos(codigo){
  adminCursosAbiertoPara = adminCursosAbiertoPara === codigo ? null : codigo;
  renderAdminViajes();
}

function adminGuardarCursos(codigo){
  const input = document.getElementById('admin-cursos-input-' + codigo);
  const lineas = (input ? input.value : '').split('\n').map(l => l.trim().slice(0, 40)).filter(Boolean).slice(0, 60);
  const unicos = lineas.filter((l, i) => lineas.indexOf(l) === i);
  const metaInput = document.getElementById('admin-cursos-meta-' + codigo);
  const premioInput = document.getElementById('admin-cursos-premio-' + codigo);
  if(metaInput) db.ref('salas/' + codigo + '/ajustes/metas').set({ porJugador: Math.max(50, Math.min(5000, Number(metaInput.value) || CURSOS_META_DEFECTO)), premio: (premioInput ? premioInput.value.trim() : '').slice(0, 160) });
  db.ref('salas/' + codigo + '/cursos').set(unicos.length ? unicos : null).then(() => {
    if(typeof mostrarToast === 'function') mostrarToast(unicos.length ? 'Cursos cargados: ' + unicos.length : 'Cursos borrados');
    adminCursosAbiertoPara = null;
    renderAdminViajes();
  });
}

function adminCursosPanelHTML(codigo, lista, metas){
  if(adminCursosAbiertoPara !== codigo) return '';
  metas = metas || {};
  return `<div style="margin:-6px 0 10px;">
    <textarea id="admin-cursos-input-${codigo}" rows="5" style="width:100%;font-size:13px;border:1px solid var(--line-color,#ccc);border-radius:10px;padding:10px;margin-bottom:6px;" placeholder="Un curso por línea. Ej:&#10;5° A - Colegio San Martín&#10;5° B - Colegio San Martín">${cursosEsc((lista || []).join('\n'))}</textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:13px;margin-bottom:6px;"><label>🎯 Meta del mes por jugador <input id="admin-cursos-meta-${codigo}" type="number" min="50" max="5000" step="50" value="${Number(metas.porJugador) || CURSOS_META_DEFECTO}" style="width:90px;"></label><span style="color:var(--gray);font-size:12px;">(con el tope de 100 por día, 500 es jugar un rato casi todos los días)</span></div>
    <input id="admin-cursos-premio-${codigo}" type="text" maxlength="160" value="${cursosEsc(metas.premio || '')}" placeholder="Premio por las estrellas (lo ven los chicos). Ej: cada ⭐ es un 5% de descuento en la última cuota" style="width:100%;font-size:13px;margin-bottom:6px;">
    <button class="btn-primary" style="margin-bottom:4px;" onclick="adminGuardarCursos('${codigo}')">Guardar cursos y metas</button>
  </div>`;
}
