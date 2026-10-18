// Casa de la Selección: un espacio de fans (no es oficial ni está afiliado a la AFA ni a la FIFA).
// Se entra desde el Shopping. Adentro hay:
//   ⭐ Mural de ídolos: cada uno elige su jugador favorito del Mundial 2022 o del plantel 2026; se ve
//      como "⭐ Messi" abajo de su nombre en todo el mundo, y el mural cuenta los más elegidos del viaje.
//   🎽 Vestuario: camisetas albicelestes (genéricas, sin escudo ni marcas) para ponerle al personaje.
//   🏆 La copa: una copa dorada sobre el podio; el personaje la levanta con festejo y papelitos.
//   📸 Foto con el plantel: un dibujo con tu personaje y el equipo (personajes, no personas reales).
// Los nombres son solo texto. Datos: salas/{viaje}/seleccion/idolos/{asiento}, ajustes/seleccion ('off' lo cierra).

const SEL_LINEAS = [['ARQ', 'Arqueros'], ['DEF', 'Defensores'], ['MED', 'Mediocampistas'], ['DEL', 'Delanteros']];
// [línea, nombre, apodo que se muestra]
const SEL_PLANTELES = {
  '2022': [
    ['ARQ', 'Emiliano Martínez', 'Dibu'], ['ARQ', 'Gerónimo Rulli', 'Rulli'], ['ARQ', 'Franco Armani', 'Armani'],
    ['DEF', 'Nahuel Molina', 'Molina'], ['DEF', 'Gonzalo Montiel', 'Montiel'], ['DEF', 'Marcos Acuña', 'Acuña'], ['DEF', 'Cristian Romero', 'Cuti Romero'], ['DEF', 'Germán Pezzella', 'Pezzella'], ['DEF', 'Nicolás Otamendi', 'Otamendi'], ['DEF', 'Lisandro Martínez', 'Licha'], ['DEF', 'Nicolás Tagliafico', 'Tagliafico'], ['DEF', 'Juan Foyth', 'Foyth'],
    ['MED', 'Rodrigo De Paul', 'De Paul'], ['MED', 'Leandro Paredes', 'Paredes'], ['MED', 'Alexis Mac Allister', 'Mac Allister'], ['MED', 'Enzo Fernández', 'Enzo'], ['MED', 'Exequiel Palacios', 'Palacios'], ['MED', 'Guido Rodríguez', 'Guido'], ['MED', 'Alejandro Gómez', 'Papu Gómez'],
    ['DEL', 'Lionel Messi', 'Messi'], ['DEL', 'Ángel Di María', 'Di María'], ['DEL', 'Lautaro Martínez', 'Lautaro'], ['DEL', 'Julián Álvarez', 'Julián'], ['DEL', 'Paulo Dybala', 'Dybala'], ['DEL', 'Nicolás González', 'Nico González'], ['DEL', 'Joaquín Correa', 'Correa'],
  ],
  '2026': [
    ['ARQ', 'Emiliano Martínez', 'Dibu'], ['ARQ', 'Gerónimo Rulli', 'Rulli'], ['ARQ', 'Juan Musso', 'Musso'],
    ['DEF', 'Gonzalo Montiel', 'Montiel'], ['DEF', 'Nahuel Molina', 'Molina'], ['DEF', 'Lisandro Martínez', 'Licha'], ['DEF', 'Nicolás Otamendi', 'Otamendi'], ['DEF', 'Leonardo Balerdi', 'Balerdi'], ['DEF', 'Cristian Romero', 'Cuti Romero'], ['DEF', 'Nicolás Tagliafico', 'Tagliafico'], ['DEF', 'Facundo Medina', 'Medina'],
    ['MED', 'Giovani Lo Celso', 'Lo Celso'], ['MED', 'Leandro Paredes', 'Paredes'], ['MED', 'Rodrigo De Paul', 'De Paul'], ['MED', 'Exequiel Palacios', 'Palacios'], ['MED', 'Enzo Fernández', 'Enzo'], ['MED', 'Alexis Mac Allister', 'Mac Allister'], ['MED', 'Valentín Barco', 'Barco'],
    ['DEL', 'Lionel Messi', 'Messi'], ['DEL', 'Nicolás González', 'Nico González'], ['DEL', 'Giuliano Simeone', 'Simeone'], ['DEL', 'Lautaro Martínez', 'Lautaro'], ['DEL', 'José Manuel López', 'Flaco López'], ['DEL', 'Julián Álvarez', 'Julián'], ['DEL', 'Thiago Almada', 'Almada'], ['DEL', 'Nico Paz', 'Nico Paz'],
  ],
};
// Camisetas genéricas albicelestes (ids del catálogo de avatar.js)
const SEL_CAMISETAS = [['albiceleste', 'Albiceleste'], ['campeon', 'Con 3 estrellas'], ['suplente', 'Suplente violeta'], ['arquero', 'De arquero']];
const SEL_COPA_MS = 6000;

const SEL_HIMNO_LETRA = [
  'Oíd, mortales, el grito sagrado:', '¡Libertad, Libertad, Libertad!', 'Oíd el ruido de rotas cadenas,', 'ved en trono a la noble Igualdad.',
  'Ya su trono dignísimo abrieron', 'las Provincias Unidas del Sud,', 'y los libres del mundo responden:', '«Al gran pueblo argentino, salud».',
  'Sean eternos los laureles', 'que supimos conseguir:', 'coronados de gloria vivamos…', '¡o juremos con gloria morir!',
];
const sel = { himno: null, fav: null, idolos: {}, ref: null, oyente: null, panel: null, tab: '2026', copaHasta: 0 };

const selEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const selEnLinea = () => !!(typeof codigoViaje !== 'undefined' && codigoViaje && typeof miAsiento !== 'undefined' && miAsiento && miNombre);

function selFavCargar(){
  try { const v = JSON.parse(localStorage.getItem('sel-fav') || 'null'); if(v && v.e && v.j) sel.fav = v; } catch(e){}
}
selFavCargar();

function selJugador(e, nombre){ return (SEL_PLANTELES[e] || []).find(p => p[1] === nombre) || null; }
// Apodo corto del ídolo (para mostrar bajo el nombre).
function seleccionAliasFav(){
  if(!sel.fav) return null;
  const p = selJugador(sel.fav.e, sel.fav.j);
  return p ? String(p[2]).slice(0, 14) : null;
}

// ---- Entrar y salir ----

function seleccionIniciar(){
  seleccionAlSalir();
  if(!selEnLinea()) return;
  sel.ref = db.ref('salas/' + codigoViaje + '/seleccion/idolos');
  sel.oyente = sel.ref.on('value', s => { sel.idolos = s.val() || {}; seleccionRender(); });
}
function seleccionAlSalir(){
  seleccionHimnoParar(true);
  if(sel.ref && sel.oyente){ try { sel.ref.off('value', sel.oyente); } catch(e){} }
  sel.ref = null; sel.oyente = null; sel.panel = null;
  const c = document.getElementById('plaza-seleccion'); if(c) c.innerHTML = '';
}

function seleccionEntrar(){ plazaIrASector('seleccion'); }
function seleccionSalir(){
  const e = (PLZ_SECTORES.shopping.armar().edificios || []).find(x => x.id === 'seleccion');
  const z = e ? plazaZonaPuerta(e) : { x: 74, y: 420, w: 72, h: 40 };
  plazaCambiarSector('shopping', { x: z.x + z.w / 2, y: z.y + z.h / 2 + 6 });
}

// ---- Ídolos ----

function seleccionAbrirIdolos(){ sel.panel = 'idolos'; seleccionRender(); }
// Himno Nacional (versión instrumental oficial de Casa Rosada, CC BY 2.5 AR). Se escucha entero, sin repetirse,
// y la música de fondo se pausa. Es voluntario: cada uno lo inicia en su celular.
function seleccionAbrirHimno(){ sel.panel = 'himno'; seleccionRender(); }
function seleccionHimnoIniciar(){
  seleccionHimnoParar(true);
  if(typeof bolicheMusicaParar === 'function') bolicheMusicaParar();
  try {
    const a = new Audio('audio/himno.mp3'); a.volume = 0.8;
    a.onended = () => { sel.himno = null; seleccionHimnoFin(); };
    a.onerror = () => { sel.himno = null; if(typeof mostrarToast === 'function') mostrarToast('No se pudo cargar el himno (¿sin conexión?)'); seleccionHimnoFin(); };
    sel.himno = a; const r = a.play(); if(r && r.catch) r.catch(() => {});
  } catch(e){}
  seleccionRender();
}
function seleccionHimnoParar(silencioso){
  if(sel.himno){ try { sel.himno.pause(); sel.himno.removeAttribute('src'); sel.himno.load(); } catch(e){} sel.himno = null; }
  if(!silencioso) seleccionHimnoFin();
}
function seleccionHimnoFin(){
  if(typeof musicaSector === 'function' && PLZ_SECTOR && PLZ_SECTOR.id === 'seleccion') musicaSector('seleccion'); // vuelve la música de fondo
  seleccionRender();
}

function seleccionAbrirVestuario(){ sel.panel = 'vestuario'; seleccionRender(); }
function seleccionCerrar(){ if(sel.panel === 'himno') seleccionHimnoParar(false); sel.panel = null; seleccionRender(); }
function seleccionTab(e){ sel.tab = e; seleccionRender(); }

function seleccionElegirIdolo(e, nombre){
  const p = selJugador(e, nombre);
  if(!p) return;
  sel.fav = { e, j: nombre };
  try { localStorage.setItem('sel-fav', JSON.stringify(sel.fav)); } catch(x){}
  if(selEnLinea()) db.ref('salas/' + codigoViaje + '/seleccion/idolos/' + miAsiento).set({ j: nombre, e, n: String(miNombre).slice(0, 14) });
  if(typeof plazaEnviar === 'function') plazaEnviar(false);
  if(typeof mostrarToast === 'function') mostrarToast('⭐ Tu ídolo: ' + p[2]);
  if(typeof reproducirMelodia === 'function') reproducirMelodia([784, 988, 1175], 90, 'triangle');
  seleccionRender();
}
function seleccionQuitarIdolo(){
  sel.fav = null;
  try { localStorage.removeItem('sel-fav'); } catch(x){}
  if(selEnLinea()) db.ref('salas/' + codigoViaje + '/seleccion/idolos/' + miAsiento).remove();
  if(typeof plazaEnviar === 'function') plazaEnviar(false);
  seleccionRender();
}

// Los más elegidos del viaje: [{alias, n}] de mayor a menor.
function seleccionRanking(){
  const cuenta = {};
  Object.keys(sel.idolos).forEach(a => { const d = sel.idolos[a]; if(d && d.j) cuenta[d.j] = (cuenta[d.j] || 0) + 1; });
  return Object.keys(cuenta).map(j => { const p = selJugador('2026', j) || selJugador('2022', j); return { alias: p ? p[2] : j, n: cuenta[j] }; }).sort((x, y) => y.n - x.n || x.alias.localeCompare(y.alias)).slice(0, 5);
}

// ---- Camisetas ----

function seleccionPonerCamiseta(id){
  if(typeof avCargar !== 'function' || !AV_IDX.remera[id]) return;
  avCargar();
  try { if(!localStorage.getItem('sel-remera-previa')) localStorage.setItem('sel-remera-previa', avEstado.puesto.remera || 'basica'); } catch(e){}
  avEstado.puesto.remera = id;
  avGuardar();
  if(typeof plazaEnviar === 'function') plazaEnviar(true);
  if(typeof mostrarToast === 'function') mostrarToast('🎽 ¡Camiseta puesta!');
  if(typeof reproducirMelodia === 'function') reproducirMelodia([659, 784], 90, 'triangle');
  seleccionRender();
}
function seleccionVolverRemera(){
  let previa = 'basica';
  try { previa = localStorage.getItem('sel-remera-previa') || 'basica'; localStorage.removeItem('sel-remera-previa'); } catch(e){}
  if(AV_IDX.remera[previa]){ avCargar(); avEstado.puesto.remera = previa; avGuardar(); if(typeof plazaEnviar === 'function') plazaEnviar(true); }
  seleccionRender();
}

// ---- Paneles ----

function seleccionRender(){
  const cont = document.getElementById('plaza-seleccion');
  if(!cont) return;
  if(!sel.panel){ cont.innerHTML = ''; return; }
  const cerrar = '<button class="gbtn gbtn-ancho gbtn-no" onclick="seleccionCerrar()">Cerrar</button>';
  let cuerpo = '';
  if(sel.panel === 'idolos'){
    const lista = SEL_PLANTELES[sel.tab] || [];
    const rank = seleccionRanking();
    cuerpo = `<h3 class="fer-titulo">⭐ Mi ídolo</h3>
      <p class="fer-sub">Elegí tu jugador favorito: lo ven todos debajo de tu nombre.${sel.fav ? ' Ahora: <b>' + selEsc((selJugador(sel.fav.e, sel.fav.j) || [0, 0, ''])[2]) + '</b>.' : ''}</p>
      <div class="sel-tabs"><button class="${sel.tab === '2022' ? 'on' : ''}" onclick="seleccionTab('2022')">Qatar 2022</button><button class="${sel.tab === '2026' ? 'on' : ''}" onclick="seleccionTab('2026')">Mundial 2026</button></div>
      <div class="sel-lista">${SEL_LINEAS.map(([l, t]) => { const js = lista.filter(p => p[0] === l); return js.length ? `<div class="sel-linea">${t}</div><div class="sel-chips">${js.map(p => `<button class="sel-chip${sel.fav && sel.fav.e === sel.tab && sel.fav.j === p[1] ? ' on' : ''}" data-j="${selEsc(p[1])}" onclick="seleccionElegirIdolo('${sel.tab}', this.dataset.j)">${selEsc(p[2])}</button>`).join('')}</div>` : ''; }).join('')}</div>
      ${rank.length ? `<div class="sel-rank"><b>Los más elegidos del viaje:</b> ${rank.map(r => selEsc(r.alias) + ' (' + r.n + ')').join(' · ')}</div>` : ''}
      ${sel.fav ? '<button class="sel-quitar" onclick="seleccionQuitarIdolo()">Quitar mi ídolo</button>' : ''}
      <p class="sel-aviso">Espacio de fans: no es oficial ni está afiliado a la AFA ni a la FIFA.</p>`;
  } else if(sel.panel === 'himno'){
    cuerpo = `<h3 class="fer-titulo">🎶 Himno Nacional Argentino</h3>
      <p class="fer-sub">${sel.himno ? 'Sonando ahora. Escuchalo de pie, con respeto.' : 'Versión instrumental oficial de la Banda Sinfónica de la Fuerza Aérea Argentina. Es para escucharlo de pie y completo.'}</p>
      <div class="sel-letra">${SEL_HIMNO_LETRA.map(l => '<div>' + selEsc(l) + '</div>').join('')}</div>
      ${sel.himno ? '<button class="gbtn gbtn-ancho" onclick="seleccionHimnoParar(false)">⏹ Detener</button>' : '<button class="gbtn gbtn-ancho" onclick="seleccionHimnoIniciar()">▶ Escuchar el himno</button>'}
      <p class="sel-aviso">Audio de Casa Rosada, Presidencia de la Nación (Creative Commons Reconocimiento 2.5 Argentina).</p>`;
  } else {
    let actual = '';
    try { avCargar(); actual = avEstado.puesto.remera; } catch(e){}
    cuerpo = `<h3 class="fer-titulo">🎽 Vestuario</h3><p class="fer-sub">Camisetas albicelestes para tu personaje (gratis, sin escudos ni marcas).</p>
      <div class="fer-items">${SEL_CAMISETAS.map(([id, n]) => `<button class="fer-item fer-item-txt${actual === id ? ' sel-puesta' : ''}" onclick="seleccionPonerCamiseta('${id}')"><span>🎽</span>${selEsc(n)}</button>`).join('')}</div>
      <button class="sel-quitar" onclick="seleccionVolverRemera()">Volver a mi remera de antes</button>`;
  }
  cont.innerHTML = `<div class="plz-modal sel-modal"><div class="plz-modal-caja sel-caja">${cuerpo}<div class="fer-botones">${cerrar}</div></div></div>`;
}

// ---- La copa ----

function seleccionLevantarCopa(){
  sel.copaHasta = performance.now() + SEL_COPA_MS;
  if(typeof reproducirMelodia === 'function') reproducirMelodia([523, 659, 784, 1046, 1318, 1046, 1318, 1568, 2093], 95, 'triangle');
  if(typeof mostrarToast === 'function') mostrarToast('🏆 ¡Dale campeón! ¡Dale campeón!', 'gain');
}

// Copa dorada genérica (no es la copa oficial): base, pie, copa y asas.
function seleccionDibujarCopa(ctx, x, y, escala){
  const s = escala || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const oro = ctx.createLinearGradient(-14, 0, 14, 0); oro.addColorStop(0, '#B8830A'); oro.addColorStop(0.5, '#FFE27A'); oro.addColorStop(1, '#C99412');
  ctx.fillStyle = '#2f6b3a'; arcRR(ctx, -12, -4, 24, 6, 2); ctx.fill();            // base verde
  ctx.fillStyle = oro; arcRR(ctx, -10, -9, 20, 6, 2); ctx.fill();                   // base dorada
  ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(-6, -22); ctx.lineTo(6, -22); ctx.lineTo(4, -9); ctx.closePath(); ctx.fill(); // pie
  ctx.beginPath(); ctx.moveTo(-14, -42); ctx.quadraticCurveTo(-13, -22, 0, -20); ctx.quadraticCurveTo(13, -22, 14, -42); ctx.closePath(); ctx.fill(); // copa
  ctx.strokeStyle = '#B8830A'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(-14, -34, 6, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(14, -34, 6, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke(); // asas
  ctx.fillStyle = oro; ctx.beginPath(); ctx.ellipse(0, -43, 14, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-5, -32, 2.2, 7, 0.2, 0, 7); ctx.fill();
  ctx.restore();
}

// Quien levanta la copa: la sostiene arriba de la cabeza, con brillo y papelitos.
function seleccionDibujarAlzada(ctx, X, Y, alto){
  const t = plz.t;
  const sube = 4 + Math.abs(Math.sin(t * 5)) * 7;
  seleccionDibujarCopa(ctx, X, Y - alto - 4 - sube, 1.0);
  for(let i = 0; i < 26; i++){
    const ph = (t * 0.9 + i * 0.173) % 1;
    const px = X + Math.sin(i * 12.9898 + t * 0.7) * 46, py = Y - alto - 70 + ph * 120;
    ctx.fillStyle = ['#74ACDF', '#FFFFFF', '#FFD84D', '#74ACDF'][i % 4];
    ctx.save(); ctx.translate(px, py); ctx.rotate(t * 3 + i); ctx.fillRect(-2.5, -1.2, 5, 2.4); ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,236,150,' + (0.5 + 0.4 * Math.sin(t * 9)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(X + 10, Y - alto - 62 - sube, 2.6, 0, 7); ctx.fill();
}

// ---- Dibujo del salón y de la fachada ----

PLZ_DECOR.seleccion = function(ctx){
  const t = plz.t;
  // Césped con rayas y líneas de cancha
  for(let i = 0; i < 10; i++){ ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'; ctx.fillRect(16, 20 + i * 58, PLZ.W - 32, 58); }
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(320, 320, 78, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(24, 320); ctx.lineTo(616, 320); ctx.stroke();
  ctx.strokeRect(22, 22, PLZ.W - 44, PLZ.H - 44);
  // Banderines celestes y blancos
  for(let i = 0; i < 16; i++){ ctx.fillStyle = i % 2 ? '#fff' : '#74ACDF'; ctx.beginPath(); ctx.moveTo(30 + i * 38, 28); ctx.lineTo(48 + i * 38, 28); ctx.lineTo(39 + i * 38, 46 + Math.sin(t * 2 + i) * 2); ctx.closePath(); ctx.fill(); }
  // Podio y copa
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(320, 338, 54, 14, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e8edf5'; arcRR(ctx, 272, 300, 96, 30, 6); ctx.fill();
  ctx.fillStyle = '#74ACDF'; arcRR(ctx, 284, 282, 72, 22, 6); ctx.fill();
  ctx.fillStyle = '#fff'; arcRR(ctx, 296, 266, 48, 20, 6); ctx.fill();
  const alguienLaTiene = plz.pose && plz.pose.p === 5 || Object.keys(plz.otros).some(k => plz.otros[k].p === 5);
  if(!alguienLaTiene) seleccionDibujarCopa(ctx, 320, 268, 1.15);
  // Vestuario (casilleros con camisetas)
  ctx.fillStyle = '#34495e'; arcRR(ctx, 16, 80, 92, 210, 8); ctx.fill();
  for(let i = 0; i < 4; i++){
    ctx.fillStyle = '#44607a'; arcRR(ctx, 22, 88 + i * 50, 80, 44, 5); ctx.fill();
    for(let k = 0; k < 4; k++){ ctx.fillStyle = k % 2 ? '#fff' : '#74ACDF'; ctx.fillRect(30 + k * 17, 94 + i * 50, 15, 32); }
  }
  ctx.fillStyle = '#fff'; ctx.font = '800 10px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VESTUARIO', 62, 70);
  // Mural de ídolos
  ctx.fillStyle = '#0b2a4a'; arcRR(ctx, 526, 80, 98, 190, 8); ctx.fill();
  ctx.strokeStyle = '#74ACDF'; ctx.lineWidth = 3; arcRR(ctx, 526, 80, 98, 190, 8); ctx.stroke();
  ctx.fillStyle = '#FFD84D'; ctx.font = '800 11px Poppins, sans-serif'; ctx.fillText('⭐ ÍDOLOS', 575, 98);
  const rk = typeof seleccionRanking === 'function' ? seleccionRanking() : [];
  ctx.font = '700 10px Poppins, sans-serif'; ctx.fillStyle = '#fff';
  (rk.length ? rk : [{ alias: 'Elegí al tuyo', n: 0 }]).slice(0, 5).forEach((r, i) => { ctx.textAlign = 'left'; ctx.fillText((i + 1) + '. ' + String(r.alias).slice(0, 11), 534, 124 + i * 28); if(r.n){ ctx.textAlign = 'right'; ctx.fillStyle = '#FFD84D'; ctx.fillText(String(r.n), 616, 124 + i * 28); ctx.fillStyle = '#fff'; } });
  // Rincón de la foto
  ctx.fillStyle = '#74ACDF'; arcRR(ctx, 40, 410, 150, 60, 8); ctx.fill();
  for(let i = 0; i < 5; i++){ ctx.fillStyle = '#fff'; ctx.fillRect(52 + i * 28, 410, 12, 60); }
  ctx.fillStyle = '#0F2A4D'; ctx.font = '800 11px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('📸 FOTO', 115, 445);
  // Salida
  ctx.fillStyle = 'rgba(255,255,255,.14)'; arcRR(ctx, 270, 556, 100, 50, 10); ctx.fill();
  ctx.fillStyle = '#5A3A22'; arcRR(ctx, 296, 584, 48, 34, 6); ctx.fill();
  ctx.fillStyle = '#e8f0ff'; ctx.font = '800 11px Poppins, sans-serif'; ctx.fillText('🚪 SALIDA', 320, 570);
};

// Fachada de la Casa de la Selección en el Shopping: franjas celestes y blancas y tres estrellas.
function plazaDibujarSeleccion(ctx, e){
  ctx.fillStyle = 'rgba(0,0,0,.14)'; arcRR(ctx, e.x + 4, e.y + 8, e.w, e.h, 12); ctx.fill();
  ctx.save(); arcRR(ctx, e.x, e.y, e.w, e.h, 12); ctx.clip();
  for(let i = 0; i < 5; i++){ ctx.fillStyle = i % 2 ? '#fff' : '#74ACDF'; ctx.fillRect(e.x + i * (e.w / 5), e.y, e.w / 5 + 0.5, e.h); }
  ctx.restore();
  ctx.fillStyle = '#0F2A4D'; arcRR(ctx, e.x + 6, e.y + 6, e.w - 12, 22, 8); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SELECCIÓN', e.x + e.w / 2, e.y + 17.5);
  [-1, 0, 1].forEach(k => { ctx.fillStyle = '#FFD84D'; ctx.font = '800 15px Poppins, sans-serif'; ctx.fillText('★', e.x + e.w / 2 + k * 22, e.y + 48); });
  arcEmoji(ctx, '⚽', e.x + e.w / 2, e.y + 74, 22);
  const z = plazaZonaPuerta(e);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; arcRR(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
  ctx.fillStyle = '#5A3A22'; arcRR(ctx, e.x + e.w / 2 - 15, e.y + e.h - 36, 30, 36, 6); ctx.fill();
  ctx.fillStyle = '#FFD84D'; ctx.beginPath(); ctx.arc(e.x + e.w / 2 + 9, e.y + e.h - 16, 2.4, 0, 7); ctx.fill();
}

// ---- Foto con el plantel (dibujo con personajes; sin cámara ni fotos reales) ----

const SEL_PLANTEL_AV = [
  { remera: 'albiceleste', peloEstilo: 'corto', peloColor: 0, piel: 2 }, { remera: 'albiceleste', peloEstilo: 'rulos', peloColor: 1, piel: 4 }, { remera: 'albiceleste', peloEstilo: 'largo', peloColor: 3, piel: 1 },
  { remera: 'albiceleste', peloEstilo: 'rapado', peloColor: 0, piel: 5 }, { remera: 'albiceleste', peloEstilo: 'flequillo', peloColor: 2, piel: 2 }, { remera: 'arquero', peloEstilo: 'corto', peloColor: 1, piel: 3 },
  { remera: 'albiceleste', peloEstilo: 'colita', peloColor: 4, piel: 0 }, { remera: 'albiceleste', peloEstilo: 'corto', peloColor: 3, piel: 1 }, { remera: 'campeon', peloEstilo: 'largo', peloColor: 0, piel: 3 },
  { remera: 'albiceleste', peloEstilo: 'rulos', peloColor: 2, piel: 4 },
];

function seleccionFoto(){
  feria.panel = { id: 'fotoSel', modo: 'fotoSel' };
  feriaRenderPanel();
}

function seleccionDibujarFoto(intento){
  const c = document.getElementById('fer-foto');
  if(!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  const cielo = ctx.createLinearGradient(0, 0, 0, H * 0.55); cielo.addColorStop(0, '#2d7bd0'); cielo.addColorStop(1, '#bfe3ff');
  ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, H);
  // tribuna con hinchada
  ctx.fillStyle = '#26324a'; ctx.fillRect(0, H * 0.22, W, H * 0.22);
  for(let i = 0; i < 160; i++){ ctx.fillStyle = ['#74ACDF', '#ffffff', '#FFD84D', '#74ACDF'][i % 4]; ctx.beginPath(); ctx.arc((i * 37) % W, H * 0.24 + ((i * 53) % Math.round(H * 0.18)), 3.2, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#4caf50'; ctx.fillRect(0, H * 0.44, W, H * 0.56);
  for(let i = 0; i < 8; i++){ ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'; ctx.fillRect(0, H * 0.44 + i * (H * 0.07), W, H * 0.07); }
  let faltan = false;
  const dibujar = (a, cx, base, alto, nombre) => {
    const img = typeof avatarSprite === 'function' ? avatarSprite(a) : null, s = alto / 68, ancho = alto * 0.84 * 0.8, pata = 13 * s;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, ancho * 0.42, 6 * s, 0, 0, 7); ctx.fill();
    [-1, 1].forEach(l => { ctx.fillStyle = '#34476F'; arcRR(ctx, cx + l * 5.5 * s - 4.5 * s, base - pata - 1, 9 * s, pata, 3 * s); ctx.fill(); ctx.fillStyle = '#fff'; arcRR(ctx, cx + l * 5.5 * s - 5 * s, base - 5 * s, 11 * s, 5.5 * s, 2.8 * s); ctx.fill(); });
    if(img && img.complete && img.naturalWidth) ctx.drawImage(img, cx - ancho / 2, base - pata - alto + 6 * s, ancho, alto);
    else faltan = true;
    if(nombre){ ctx.font = '700 12px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(nombre).width + 12; ctx.fillStyle = 'rgba(15,42,77,.85)'; arcRR(ctx, cx - w / 2, base + 6, w, 18, 9); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(nombre, cx, base + 15); }
  };
  // el plantel (personajes genéricos) en dos filas
  SEL_PLANTEL_AV.slice(0, 5).forEach((a, i) => dibujar(a, W * (0.17 + i * 0.165), H * 0.58, 78));
  SEL_PLANTEL_AV.slice(5).forEach((a, i) => dibujar(a, W * (0.12 + i * 0.19), H * 0.72, 92));
  // los de tu sala, a los costados
  const sala = typeof feriaPersonajesDeLaSala === 'function' ? feriaPersonajesDeLaSala().slice(1, 5) : [];
  sala.forEach((g, i) => dibujar(g.a, i % 2 ? W * 0.86 : W * 0.07, H * (0.86 + (i > 1 ? 0.02 : 0)), 70, String(g.n).slice(0, 10)));
  // vos, al centro con la copa
  const yo = typeof plazaCompacto === 'function' ? plazaCompacto() : {};
  dibujar(yo, W * 0.5, H * 0.9, 132, 'Vos');
  seleccionDibujarCopa(ctx, W * 0.5 + 6, H * 0.9 - 148, 1.9);
  // marco
  ctx.lineWidth = 14; ctx.strokeStyle = '#fff'; ctx.strokeRect(7, 7, W - 14, H - 14);
  ctx.lineWidth = 3; ctx.strokeStyle = '#74ACDF'; ctx.strokeRect(16, 16, W - 32, H - 32);
  if(typeof arcLogo === 'function') [[44, 44], [W - 44, 44]].forEach(([x, y]) => arcLogo(ctx, x, y, 44, '#fff'));
  ctx.fillStyle = 'rgba(15,42,77,.88)'; arcRR(ctx, W / 2 - 150, 22, 300, 32, 16); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 17px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¡Vamos Argentina!', W / 2, 38);
  const al = seleccionAliasFav();
  if(al){ ctx.fillStyle = 'rgba(255,216,77,.95)'; arcRR(ctx, W / 2 - 100, H - 46, 200, 26, 13); ctx.fill(); ctx.fillStyle = '#0F2A4D'; ctx.font = '800 14px Poppins, sans-serif'; ctx.fillText('⭐ Mi ídolo: ' + al, W / 2, H - 33); }
  if(faltan && (intento || 0) < 6) setTimeout(() => seleccionDibujarFoto((intento || 0) + 1), 250);
}
