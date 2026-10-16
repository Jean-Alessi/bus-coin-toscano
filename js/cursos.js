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
  const maximo = Math.max(1, ...tabla.map(t => t.promedio));
  const medallas = ['🥇', '🥈', '🥉'];
  const eleccion = mio ? '' : `<div class="cur-elegir"><div class="cur-elegir-titulo">¿De qué curso sos?</div><div class="cur-elegir-sub">Elegilo y tus puntos suman a la Guerra de cursos.</div><div class="cur-elegir-lista">${cursosViaje.map((c, i) => `<button class="cur-chip" onclick="cursosElegir(${i})">${cursosEsc(c)}</button>`).join('')}</div></div>`;
  const filas = tabla.map((t, i) => `<div class="cur-fila${t.curso === mio ? ' cur-fila-yo' : ''}">
    <span class="cur-puesto">${medallas[i] || (i + 1)}</span>
    <div class="cur-datos"><div class="cur-nombre">${cursosEsc(t.curso)}</div>
      <div class="cur-barra"><span style="width:${Math.round(t.promedio / maximo * 100)}%"></span></div>
      <div class="cur-sub">${t.jugadores} jugador${t.jugadores === 1 ? '' : 'es'}${t.curso === mio ? ' · tu curso' : ''}</div></div>
    <span class="cur-pts">${t.promedio}<small> pts</small></span>
  </div>`).join('');
  return gEscenaHTML('noche', `
    ${cursosSelectorHTML()}
    <div class="g-dialogo"><div class="g-dialogo-titulo">🎓 Guerra de cursos</div><div class="g-dialogo-sub">Cuenta el promedio de los ${CURSOS_MEJORES} mejores de cada curso.</div></div>
    ${eleccion}
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
  db.ref('salas/' + codigo + '/cursos').set(unicos.length ? unicos : null).then(() => {
    if(typeof mostrarToast === 'function') mostrarToast(unicos.length ? 'Cursos cargados: ' + unicos.length : 'Cursos borrados');
    adminCursosAbiertoPara = null;
    renderAdminViajes();
  });
}

function adminCursosPanelHTML(codigo, lista){
  if(adminCursosAbiertoPara !== codigo) return '';
  return `<div style="margin:-6px 0 10px;">
    <textarea id="admin-cursos-input-${codigo}" rows="5" style="width:100%;font-size:13px;border:1px solid var(--line-color,#ccc);border-radius:10px;padding:10px;margin-bottom:6px;" placeholder="Un curso por línea. Ej:&#10;5° A - Colegio San Martín&#10;5° B - Colegio San Martín">${cursosEsc((lista || []).join('\n'))}</textarea>
    <button class="btn-primary" style="margin-bottom:4px;" onclick="adminGuardarCursos('${codigo}')">Guardar cursos</button>
  </div>`;
}
