// Bus-queda: juegos de escape. Tu personaje (el de "Mi personaje", de cuerpo entero) pasa por habitaciones,
// junta objetos, resuelve acertijos y trata de salir. Este archivo es el motor; cada aventura está en su propio
// archivo (escape1.js...) como datos: habitaciones, objetos tocables, cosas que se juntan, combinaciones y pistas.
//
// Cómo se juega: tocás un lugar del piso y tu personaje camina; tocás un objeto y va hasta él y lo examina.
// Abajo está la mochila: tocás un objeto para elegirlo y después tocás otro objeto (de la mochila o de la
// habitación) para usarlo o combinarlo. Hay cuaderno (todas las notas que fuiste leyendo) y pistas (que restan).
//
// Una aventura define habitaciones con { ancho, dibujar(ctx, e), dinamico(ctx, e, t), oscura(e), objetos: [...] }.
// Cada objeto tiene un rectángulo (x, y, w, h en coordenadas de la habitación), dónde se para el personaje (pie)
// y qué pasa al tocarlo (toque) o al usarle un objeto (usar: { idObjeto: fn }). Las funciones son async: pueden
// hablar, esperar, abrir candados, asustar, etc. con los métodos de 'e' (ver ESC_METODOS).

const ESC = { VW: 340, VH: 440, PISO: 398, ESC_PJ: 0.72, VEL: 128, HORIZONTE: 306 };
const ESC_JUEGOS = {};
let esc = null;

const escEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const escRnd = (a, b) => a + Math.random() * (b - a);
const escClave = id => 'busmac-escape-' + id;

// ---- Partida ----

function escNueva(def, guardado, opciones){
  const o = opciones || {};
  const g = guardado || {};
  esc = Object.assign({
    def, activo: false, test: !!o.test, rapido: !!o.test || !!o.rapido, respuestas: o.respuestas || [],
    sala: g.sala || def.inicio.sala, flags: g.flags || {}, inv: g.inv || (def.inicio.inv || []).slice(), notas: g.notas || [], pistas: g.pistas || 0, nivelPista: g.nivelPista || {}, fallas: g.fallas || 0, seg: g.seg || 0,
    x: g.x != null ? g.x : def.inicio.x, dir: 1, anim: 'quieto', camX: 0, objetivoX: null, pendiente: null, caminando: false, tPaso: 0,
    sel: null, mira: null, miraHasta: 0, miraSuave: null, t: 0, bloq: 0, ov: null, cap: null, capCola: [],
    sacudida: 0, flashA: 0, flashColor: '#fff', parpadeo: 0, fantasma: null, miedo: 0, sigAmb: 14, expr: 'normal', exprHasta: 0, susto: 0, resaltar: 0, fundido: 0,
    version: 0, cache: {}, log: [], terminado: !!g.terminado, tocoPuerta: 0, ultimoGuardado: 0,
  }, ESC_METODOS);
  Object.defineProperty(esc, 'ocupado', { get(){ return this.bloq > 0; }, configurable: true });
  return esc;
}

// ---- Métodos que usan las aventuras ----

const ESC_METODOS = {
  salaDef(){ return this.def.salas[this.sala]; },
  tiene(id){ return this.inv.indexOf(id) >= 0; },
  flag(k){ return !!this.flags[k]; },
  set(k, v){ this.flags[k] = v === undefined ? true : v; this.version++; escGuardar(); },
  dar(id, texto){
    if(this.tiene(id)) return Promise.resolve();
    this.inv.push(id); this.version++; escRenderInv(); escGuardar();
    if(typeof essItem === 'function') essItem();
    const it = this.def.items[id];
    this.log.push('+' + id);
    return texto === false ? Promise.resolve() : this.decir(texto || ('Conseguiste: ' + (it ? it.nombre : id) + '.'), { quien: 'item', expr: 'curioso' });
  },
  quitar(...ids){ ids.forEach(id => { const i = this.inv.indexOf(id); if(i >= 0) this.inv.splice(i, 1); if(this.sel === id) this.sel = null; }); this.version++; escRenderInv(); escGuardar(); },
  nota(id, titulo, html){
    if(this.notas.some(n => n.id === id)) return;
    this.notas.push({ id, titulo, html }); escGuardar();
    if(typeof escActualizarBotones === 'function') escActualizarBotones();
  },
  decir(texto, o){ return escDecir(texto, o); },
  yo(texto, expr){ return escDecir(texto, { quien: 'yo', expr }); },
  bi(texto){ return escDecir(texto, { quien: 'bi' }); },
  narrar(texto){ return escDecir(texto, { quien: 'narra' }); },
  esperar(ms){ return this.rapido ? Promise.resolve() : new Promise(r => setTimeout(r, ms)); },
  cara(expr, ms){ this.expr = expr; this.exprHasta = this.t + (ms || 2.5); },
  sacudir(a){ this.sacudida = Math.max(this.sacudida, a || 0.6); },
  flash(color, a){ this.flashColor = color || '#fff'; this.flashA = a || 1; },
  parpadear(s){ this.parpadeo = s || 0.8; if(typeof essZumbido === 'function') essZumbido(); },
  asustar(tipo, o){ return escSusto(tipo, o || {}); },
  fantasmaEn(modo, o){ esc.fantasma = Object.assign({ modo, t: 0, dur: 2.5, alfa: 0, x: 300, y: 330, escala: 1, dir: 1 }, o || {}); },
  quitarFantasma(){ this.fantasma = null; },
  ir(sala, x, dir){ return escIrSala(sala, x, dir); },
  oscura(){ const s = this.salaDef(); return !!(s.oscura && s.oscura(this)); },
  linternaOn(){ return this.tiene('linterna_lista') && this.oscura() && !this.flag('luz_apagada'); },
  // ¿el punto (x, y) de la habitación está iluminado por la linterna?
  enLuz(x, y){
    if(this.forzarLuz) return true;
    if(!this.oscura()) return true;
    const c = escCentroLuz();
    return !!c && Math.hypot(x - c.x, y - c.y) < c.r * 0.92;
  },
  digitos(o){ return escAbrirDigitos(o); },
  grupos(o){ return escAbrirGrupos(o); },
  ruedas(o){ return escAbrirRuedas(o); },
  luces(o){ return escAbrirLuces(o); },
  secuencia(o){ return escAbrirSecuencia(o); },
  sfx(n, ...a){ const f = (typeof window !== 'undefined' ? window : globalThis)['ess' + n[0].toUpperCase() + n.slice(1)]; if(typeof f === 'function') f(...a); },
  leer(titulo, html, o){ return escAbrirLeer(titulo, html, o); },
  elegir(titulo, opciones, sub){ return escAbrirElegir(titulo, opciones, sub); },
  fin(){ return escTerminar(); },
};

// ---- Entrar y salir ----

function iniciarBusqueda(){
  const cont = document.getElementById('busqueda-content');
  if(!cont) return;
  const lista = Object.keys(ESC_JUEGOS).map(id => ESC_JUEGOS[id]);
  const prox = [
    ['🚌', 'El micro fantasma', 'Un garage donde nada anda y alguien no quiere que te vayas.'],
    ['🏨', 'Hotel de la ruta', 'Se rompió el micro y la única cama libre es la de la habitación 12.'],
    ['🧳', 'La valija perdida', 'Una aduana, un depósito y cientos de valijas. Una sola es la tuya.'],
    ['🗺️', 'El mapa del tesoro', 'Pistas por pueblos y plazas. No todos los que te ayudan están vivos.'],
  ];
  cont.innerHTML = gEscenaHTML('noche', `
    ${gDialogoHTML('🔎 Bus-queda', 'Juegos de escape con sustos. Tu personaje tiene que salir de lugares que no quieren dejarte ir. Mejor con auriculares y la luz baja.')}
    ${lista.map(d => escTarjetaHTML(d)).join('')}
    ${prox.map(([e, t, s]) => `<div class="esc-card esc-card-prox"><div class="esc-card-ico">${e}</div><div class="esc-card-txt"><h3>${t}</h3><p>${s}</p><span class="esc-card-estado">Próximamente</span></div></div>`).join('')}`, 'esc-menu');
}

function escGuardadoDe(id){ try { return JSON.parse(localStorage.getItem(escClave(id))); } catch(e){ return null; } }

function escTarjetaHTML(d){
  const g = escGuardadoDe(d.id);
  const est = g && g.terminado ? '★'.repeat(g.estrellas || 1) + '☆'.repeat(3 - (g.estrellas || 1)) + ' · completado' : (g && g.flags && Object.keys(g.flags).length ? 'En curso' : 'Nuevo');
  return `<div class="esc-card" onclick="escAbrir('${d.id}')"><div class="esc-card-ico">${d.emoji}</div><div class="esc-card-txt"><h3>${escEsc(d.titulo)}</h3><p>${escEsc(d.resumen)}</p><span class="esc-card-estado">${est} · ${d.salasTotal} habitaciones · ${escEsc(d.dificultad)}</span></div></div>`;
}

function escAbrir(id){
  const def = ESC_JUEGOS[id];
  if(!def) return;
  if(typeof bolicheMusicaParar === 'function') { try { bolicheMusicaParar(); } catch(e){} }
  showView('escape');
  escPantallaInicio(def);
}

function escPantallaInicio(def){
  const cont = document.getElementById('escape-content');
  const g = escGuardadoDe(def.id);
  const sigue = g && !g.terminado && g.flags && Object.keys(g.flags).length;
  document.getElementById('view-escape').classList.remove('juego-inmersivo');
  const sub = document.getElementById('escape-sub'); if(sub) sub.textContent = def.titulo;
  cont.innerHTML = gEscenaHTML('noche', `
    <div class="esc-portada"><div class="esc-portada-ico">${def.emoji}</div><h2>${escEsc(def.titulo)}</h2><p>${escEsc(def.resumen)}</p></div>
    <div class="esc-aviso">⚠️ Tiene <b>sustos</b>, sonidos fuertes y oscuridad. Mejor con auriculares y el volumen no muy alto. Si no te gustan los sustos, salí con la flecha ←.</div>
    <div class="g-acciones">${sigue ? '<button class="gbtn gbtn-ancho gbtn-quiero" onclick="escEmpezar(true)">▶ Continuar</button>' : ''}<button class="gbtn gbtn-ancho ${sigue ? 'gbtn-no' : ''}" onclick="escEmpezar(false)">${sigue ? '↺ Empezar de nuevo' : '▶ Entrar'}</button></div>
    ${g && g.terminado ? `<p class="esc-nota">Ya escapaste con ${'★'.repeat(g.estrellas || 1)}. Podés volver a jugarla (las monedas grandes se dan una sola vez).</p>` : ''}`, 'esc-menu');
  escEmpezar.def = def;
}

function escEmpezar(continuar){
  const def = escEmpezar.def;
  if(!def) return;
  const prev = escGuardadoDe(def.id);
  escNueva(def, continuar ? prev : null);
  esc.recompensado = !!(prev && prev.recompensado);
  escMontar();
  esc.activo = true;
  escEntrarSala(esc.sala, esc.x, true);
  esc.ultimo = 0; esc.raf = requestAnimationFrame(escBucle);
  if(!esc.flag('intro_vista')) escIntro();
}

const escBloq = n => { esc.bloq = Math.max(0, (esc.bloq || 0) + n); };

async function escIntro(){
  escBloq(1);
  try { const intro = esc.def.intro; if(intro) await intro(esc); esc.set('intro_vista'); } finally { escBloq(-1); }
}

function escSalir(){
  if(esc){ cancelAnimationFrame(esc.raf); esc.activo = false; escGuardar(true); }
  if(typeof essTodoParar === 'function') essTodoParar();
}

// ---- Guardado ----

function escGuardar(ya){
  if(!esc || esc.test) return;
  const ahora = Date.now();
  if(!ya && ahora - esc.ultimoGuardado < 600) return;
  esc.ultimoGuardado = ahora;
  try {
    localStorage.setItem(escClave(esc.def.id), JSON.stringify({ sala: esc.sala, x: Math.round(esc.x), flags: esc.flags, inv: esc.inv, notas: esc.notas, pistas: esc.pistas, nivelPista: esc.nivelPista, fallas: esc.fallas, seg: Math.round(esc.seg), terminado: esc.terminado, estrellas: esc.estrellas, recompensado: !!esc.recompensado }));
  } catch(e){}
}

// ---- Pantalla ----

function escMontar(){
  const cont = document.getElementById('escape-content');
  document.getElementById('view-escape').classList.add('juego-inmersivo');
  cont.innerHTML = gEscenaHTML('noche', `<div class="esc-barra"><span class="esc-sala" id="esc-sala"></span>
      <button class="esc-btn" id="esc-b-ojo" onclick="escResaltar()" title="Ver qué se puede tocar">👁️</button>
      <button class="esc-btn" id="esc-b-nota" onclick="escCuaderno()" title="Cuaderno">📓</button>
      <button class="esc-btn" id="esc-b-pista" onclick="escPedirPista()" title="Pista">💡</button>
      <button class="esc-btn" id="esc-b-son" onclick="escSonido()" title="Sonido">${essActivo() ? '🔊' : '🔇'}</button></div>
    <div class="esc-caja"><canvas class="esc-canvas"></canvas><div class="esc-cap" id="esc-cap" onclick="escCerrarCap()"></div><div class="esc-ov" id="esc-ov"></div></div>
    <div class="esc-inv" id="esc-inv"></div>`, 'esc-escena');
  esc.canvas = cont.querySelector('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  esc.dpr = dpr;
  esc.canvas.width = ESC.VW * dpr; esc.canvas.height = ESC.VH * dpr;
  esc.ctx = esc.canvas.getContext('2d'); esc.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  esc.luzCv = document.createElement('canvas'); esc.luzCv.width = ESC.VW * dpr; esc.luzCv.height = ESC.VH * dpr;
  esc.luzCtx = esc.luzCv.getContext('2d'); esc.luzCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const aMundo = ev => { const r = esc.canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left) * ESC.VW / r.width + esc.camX, y: (ev.clientY - r.top) * ESC.VH / r.height }; };
  let abajo = false;
  esc.canvas.addEventListener('pointerdown', ev => { ev.preventDefault(); abajo = true; try { esc.canvas.setPointerCapture(ev.pointerId); } catch(e){} const p = aMundo(ev); esc.mira = p; esc.miraHasta = esc.t + 3; escTocar(p.x, p.y); });
  esc.canvas.addEventListener('pointermove', ev => { if(!abajo) return; const p = aMundo(ev); esc.mira = p; esc.miraHasta = esc.t + 3; });
  const soltar = () => { abajo = false; };
  esc.canvas.addEventListener('pointerup', soltar); esc.canvas.addEventListener('pointercancel', soltar);
  escPrecargarPJ();
  escRenderInv();
  escActualizarBotones();
  escAjustar();
}

function escAjustar(){
  const vista = document.getElementById('view-escape'), caja = esc && esc.canvas && esc.canvas.parentElement;
  if(!vista || !caja || !vista.classList.contains('active')) return;
  caja.style.width = '100%';
  const top = caja.getBoundingClientRect().top - vista.getBoundingClientRect().top + vista.scrollTop;
  const inv = document.getElementById('esc-inv'), altoInv = inv ? inv.offsetHeight + 16 : 70;
  const libre = vista.clientHeight - top - altoInv - 6;
  const escena = caja.parentElement, est = getComputedStyle(escena);
  const util = escena.clientWidth - parseFloat(est.paddingLeft) - parseFloat(est.paddingRight);
  caja.style.width = Math.max(220, Math.min(util, libre * ESC.VW / ESC.VH)) + 'px';
}
window.addEventListener('resize', () => { if(typeof escAjustar === 'function') escAjustar(); });

function escPrecargarPJ(){
  if(typeof avcPrecargar !== 'function' || typeof avatarPuestoActual !== 'function') return;
  esc.puesto = Object.assign({}, avatarPuestoActual(), { manoAcc: avatarPuestoActual().manoAcc === 'mochila' ? 'mochila' : null });
  avcPrecargar(esc.puesto);
}

function escActualizarBotones(){
  const n = document.getElementById('esc-b-nota'); if(n) n.textContent = '📓' + (esc.notas.length ? ' ' + esc.notas.length : '');
  const s = document.getElementById('esc-b-son'); if(s) s.textContent = essActivo() ? '🔊' : '🔇';
  const sa = document.getElementById('esc-sala'); if(sa) sa.textContent = esc.salaDef().nombre;
}
function escSonido(){ if(typeof essAlternar === 'function'){ essAlternar(); escActualizarBotones(); } }
function escResaltar(){ esc.resaltar = esc.t + 2.6; }

// ---- Mochila ----

function escRenderInv(){
  const el = document.getElementById('esc-inv');
  if(!el || !esc) return;
  const it = id => esc.def.items[id] || { nombre: id, icono: '❔' };
  el.innerHTML = esc.inv.length
    ? esc.inv.map(id => `<button class="esc-item${esc.sel === id ? ' esc-item-sel' : ''}" onclick="escTocarItem('${id}')"><span class="esc-item-ico">${it(id).icono}</span><span class="esc-item-nom">${escEsc(it(id).nombre)}</span></button>`).join('')
    : '<span class="esc-inv-vacia">Acá van los objetos que encuentres</span>';
  if(typeof escAjustar === 'function') escAjustar();
}

function escTocarItem(id){
  if(esc.ocupado || esc.ov) return;
  const it = esc.def.items[id] || {};
  if(esc.sel && esc.sel !== id){ escCombinar(esc.sel, id); return; }
  if(esc.sel === id){ esc.sel = null; escRenderInv(); return; }
  esc.sel = id; escRenderInv();
  escDecir((it.nombre || id) + ': ' + (it.desc || '') + ' (Tocá otro objeto para usarlo o combinarlo.)', { quien: 'yo', corto: true });
}

async function escCombinar(a, b){
  const rec = (esc.def.combos || []).find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
  escBloq(1);
  try {
    if(!rec){ if(typeof essError === 'function') essError(); await esc.decir('Eso no se puede combinar.', { quien: 'yo', expr: 'serio' }); esc.sel = null; escRenderInv(); return; }
    esc.quitar(...[rec.a, rec.b].filter(x => !(rec.conserva || []).includes(x))); esc.sel = null;
    await esc.dar(rec.da, rec.texto);
    if(rec.alHacer) await rec.alHacer(esc);
  } finally { escBloq(-1); }
}

// ---- Toques ----

function escObjetosActivos(){
  const s = esc.salaDef();
  return (s.objetos || []).filter(o => (!o.visible || o.visible(esc)) && (!o.oculto || esc.enLuz(o.x + o.w / 2, o.y + o.h / 2)));
}

function escTocar(wx, wy){
  if(esc.ocupado || esc.ov || esc.fundido > 0.5) return;
  if(esc.cap && esc.cap.bloquea) return;
  const objs = escObjetosActivos();
  for(let i = objs.length - 1; i >= 0; i--){
    const o = objs[i], m = o.margen == null ? 6 : o.margen;
    if(wx >= o.x - m && wx <= o.x + o.w + m && wy >= o.y - m && wy <= o.y + o.h + m){ escIrAObjeto(o); return; }
  }
  esc.pendiente = null; esc.objetivoX = escClamp(wx, 24, esc.salaDef().ancho - 24);
}

function escIrAObjeto(o){
  const pie = o.pie != null ? o.pie : o.x + o.w / 2;
  esc.pendiente = o; esc.objetivoX = escClamp(pie, 24, esc.salaDef().ancho - 24);
  if(esc.rapido){ esc.x = esc.objetivoX; esc.objetivoX = null; escLlego(); }
}

function escLlego(){
  const o = esc.pendiente; esc.pendiente = null; esc.anim = 'quieto';
  if(o) return escInteraccion(o);
}

async function escInteraccion(o){
  if(esc.ocupado) return;
  escBloq(1);
  try {
    const sel = esc.sel;
    if(sel){
      const f = o.usar && (o.usar[sel] || o.usar['*']);
      if(f){ const r = await f(esc, sel); if(r !== false){ /* usado */ } }
      else { if(typeof essError === 'function') essError(); await esc.decir(escElegir(['No creo que eso sirva acá.', 'No pasa nada.', 'Probé, pero no funciona.']), { quien: 'yo', expr: 'serio' }); }
    } else if(o.toque){ await o.toque(esc); }
  } catch(err){ if(esc.test) throw err; console.error(err); }
  finally { escBloq(-1); }
}
const escElegir = lista => lista[Math.floor(Math.random() * lista.length)];

// Para las pruebas: tocar un objeto por id (con un objeto de la mochila elegido si se pide).
async function escActuar(id, itemUsado){
  for(let i = 0; esc.ocupado && i < 200; i++) await new Promise(r => (typeof setImmediate === 'function' ? setImmediate(r) : setTimeout(r, 0))); // esperar a que termine lo que esté pasando
  const o = (esc.salaDef().objetos || []).find(x => x.id === id);
  if(!o) throw new Error('No hay objeto ' + id + ' en ' + esc.sala);
  if(o.visible && !o.visible(esc)) throw new Error('Objeto no visible: ' + id);
  if(esc.test && o.oculto) esc.miraSuave = { x: o.x + o.w / 2, y: o.y + o.h / 2 }; // en las pruebas se apunta la linterna al objeto
  if(o.oculto && !esc.enLuz(o.x + o.w / 2, o.y + o.h / 2)) throw new Error('Objeto a oscuras: ' + id);
  esc.sel = itemUsado || null;
  const pie = o.pie != null ? o.pie : o.x + o.w / 2;
  esc.x = escClamp(pie, 24, esc.salaDef().ancho - 24); esc.pendiente = null;
  await escInteraccion(o);
  esc.sel = null;
}

// ---- Cambiar de habitación ----

async function escIrSala(sala, x, dir){
  if(!esc.def.salas[sala]) return;
  if(!esc.rapido){ esc.fundido = 1; await esc.esperar(380); }
  escEntrarSala(sala, x, false, dir);
  if(!esc.rapido){ await esc.esperar(120); }
}

function escEntrarSala(sala, x, inicio, dir){
  esc.sala = sala; esc.x = x; esc.dir = dir || esc.dir; esc.objetivoX = null; esc.pendiente = null; esc.anim = 'quieto'; esc.fantasma = null; esc.sel = null;
  const s = esc.salaDef();
  esc.camX = escClamp(esc.x - ESC.VW / 2, 0, s.ancho - ESC.VW);
  esc.mira = null; esc.version++;
  if(typeof escRenderInv === 'function' && esc.canvas) escRenderInv();
  if(esc.canvas) escActualizarBotones();
  esc.sigAmb = escRnd(8, 16);
  const primera = !esc.flag('visita_' + sala);
  esc.flags['visita_' + sala] = true;
  if(typeof essAmbiente === 'function') essAmbiente(s.musica ? (typeof s.musica === 'function' ? s.musica(esc) : s.musica) : 'calma');
  if(typeof essPuerta === 'function' && !inicio) essPuerta();
  if(s.alEntrar) escLanzar(s.alEntrar(esc, primera));
  escGuardar();
}
function escLanzar(p){ if(p && p.then){ escBloq(1); p.then(() => escBloq(-1)).catch(err => { escBloq(-1); if(esc.test) throw err; console.error(err); }); } }

// ---- Diálogos ----

function escDecir(texto, o){
  o = o || {};
  esc.log.push((o.quien || 'yo') + ': ' + texto);
  if(o.expr) esc.cara(o.expr, 3);
  if(esc.rapido) return Promise.resolve();
  return new Promise(res => { esc.capCola.push({ texto, quien: o.quien || 'yo', res, bloquea: !!o.bloquea, corto: !!o.corto }); if(!esc.cap) escSiguienteCap(); });
}
function escSiguienteCap(){
  const el = document.getElementById('esc-cap');
  const c = esc.cap = esc.capCola.shift() || null;
  if(!el) { if(c) c.res(); esc.cap = null; return; }
  if(!c){ el.className = 'esc-cap'; el.innerHTML = ''; return; }
  const q = { yo: ['', 'esc-cap-yo'], bi: ['Bi', 'esc-cap-bi'], narra: ['', 'esc-cap-narra'], item: ['🎒', 'esc-cap-item'], voz: ['👻', 'esc-cap-voz'] }[c.quien] || ['', ''];
  el.className = 'esc-cap esc-cap-on ' + q[1];
  el.innerHTML = (q[0] ? `<b class="esc-cap-q">${q[0]}</b> ` : '') + escEsc(c.texto) + ' <span class="esc-cap-sig">▾</span>';
  c.ts = esc.t; c.dur = Math.max(2.2, c.texto.length * 0.06 + 1.2);
}
function escCerrarCap(){
  if(!esc.cap) return;
  const c = esc.cap; esc.cap = null; c.res();
  escSiguienteCap();
}

// ---- Susto ----
// tipos: 'fuerte' (cara grande en pantalla), 'sombra' (algo pasa al fondo), 'golpe', 'apagon', 'mano'
async function escSusto(tipo, o){
  if(o.cuenta){ esc.fallas++; escGuardar(); }
  esc.log.push('susto:' + tipo);
  esc.miedo = Math.min(1, esc.miedo + (tipo === 'fuerte' ? 0.7 : 0.4));
  if(esc.rapido) return;
  if(tipo === 'fuerte' || tipo === 'mano'){
    esc.susto = 1; esc.cara('terror', 2.2); esc.sacudir(0.7); esc.flash(o.rojo ? '#ff2a2a' : '#ffffff', 0.9);
    if(typeof essSusto === 'function') essSusto(true);
    await esc.esperar(900);
  } else if(tipo === 'sombra'){
    esc.fantasmaEn('sombra', { dur: 2.8, x: o.x != null ? o.x : esc.camX - 40, y: 300, alfa: 0, dir: 1 }); if(typeof essSusurro === 'function') essSusurro();
  } else if(tipo === 'golpe'){
    esc.sacudir(0.5); if(typeof essGolpe === 'function') essGolpe(); esc.cara('miedo', 1.6); await esc.esperar(300);
  } else if(tipo === 'apagon'){
    esc.flash('#000', 1); esc.sacudir(0.35); if(typeof essApagon === 'function') essApagon(); esc.cara('preocupado', 3); await esc.esperar(700);
  }
}

// ---- Overlays ----

function escOvAbrir(html, cls){
  const el = document.getElementById('esc-ov');
  if(!el) return;
  el.className = 'esc-ov esc-ov-on ' + (cls || ''); el.innerHTML = html;
}
function escOvCerrar(valor){
  const ov = esc.ov; esc.ov = null;
  const el = document.getElementById('esc-ov'); if(el){ el.className = 'esc-ov'; el.innerHTML = ''; }
  if(ov && ov.res) ov.res(valor);
}
function escRespuesta(){ return esc.respuestas.length ? esc.respuestas.shift() : undefined; }

function escAbrirDigitos(o){
  if(esc.test){ const r = escRespuesta(); return Promise.resolve(r !== undefined && String(r) === String(o.clave)); }
  return new Promise(res => {
    esc.ov = { tipo: 'digitos', o, valor: '', res };
    escDibujarDigitos();
  });
}
function escDibujarDigitos(){
  const ov = esc.ov, o = ov.o;
  const cajas = Array.from({ length: o.n }).map((_, i) => `<span class="esc-dig${ov.error ? ' esc-dig-err' : ''}">${ov.valor[i] != null ? escEsc(ov.valor[i]) : ''}</span>`).join('');
  const teclas = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button onclick="escDig('${n}')">${n}</button>`).join('') + `<button onclick="escDigBorrar()">⌫</button><button onclick="escDig('0')">0</button><button class="esc-ok" onclick="escDigOk()">✔</button>`;
  escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">${escEsc(o.titulo)}</div>${o.sub ? `<div class="esc-panel-s">${o.sub}</div>` : ''}<div class="esc-digs">${cajas}</div><div class="esc-teclado">${teclas}</div><button class="esc-cerrar" onclick="escOvCerrar(false)">Cerrar</button></div>`);
}
function escDig(d){ const ov = esc.ov; if(!ov || ov.tipo !== 'digitos') return; if(ov.valor.length < ov.o.n){ ov.valor += d; ov.error = false; if(typeof essTecla === 'function') essTecla(); escDibujarDigitos(); } }
function escDigBorrar(){ const ov = esc.ov; if(!ov) return; ov.valor = ov.valor.slice(0, -1); ov.error = false; escDibujarDigitos(); }
function escDigOk(){
  const ov = esc.ov; if(!ov) return;
  if(ov.valor === String(ov.o.clave)){ if(typeof essExito === 'function') essExito(); escOvCerrar(true); }
  else { if(typeof essError === 'function') essError(); ov.error = true; ov.valor = ''; escDibujarDigitos(); }
}

// Elegir una letra de cada grupo (por ejemplo, fila y columna de la máquina expendedora).
function escAbrirGrupos(o){
  if(esc.test){ const r = escRespuesta(); return Promise.resolve(r !== undefined && String(r) === String(o.clave)); }
  return new Promise(res => { esc.ov = { tipo: 'grupos', o, valor: o.grupos.map(() => null), res }; escDibujarGrupos(); });
}
function escDibujarGrupos(){
  const ov = esc.ov, o = ov.o;
  const filas = o.grupos.map((g, i) => `<div class="esc-grupo">${g.map(x => `<button class="${ov.valor[i] === x ? 'esc-sel' : ''}" onclick="escGrp(${i},'${x}')">${escEsc(x)}</button>`).join('')}</div>`).join('');
  escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">${escEsc(o.titulo)}</div>${o.sub ? `<div class="esc-panel-s">${o.sub}</div>` : ''}<div class="esc-visor${ov.error ? ' esc-dig-err' : ''}">${ov.valor.map(v => v || '–').join(' ')}</div>${filas}<div class="esc-acc"><button class="esc-cerrar" onclick="escOvCerrar(false)">Cerrar</button><button class="esc-ok2" onclick="escGrpOk()">Aceptar</button></div></div>`);
}
function escGrp(i, x){ const ov = esc.ov; if(!ov) return; ov.valor[i] = x; ov.error = false; if(typeof essTecla === 'function') essTecla(); escDibujarGrupos(); }
function escGrpOk(){
  const ov = esc.ov; if(!ov) return;
  if(ov.valor.join('') === String(ov.o.clave)){ if(typeof essExito === 'function') essExito(); escOvCerrar(true); }
  else { if(typeof essError === 'function') essError(); ov.error = true; escDibujarGrupos(); }
}

// Ruedas de letras (como un candado de palabra).
function escAbrirRuedas(o){
  if(esc.test){ const r = escRespuesta(); return Promise.resolve(r !== undefined && String(r).toUpperCase() === String(o.clave).toUpperCase()); }
  return new Promise(res => { esc.ov = { tipo: 'ruedas', o, valor: Array.from({ length: o.n }).map(() => 0), res }; escDibujarRuedas(); });
}
function escDibujarRuedas(){
  const ov = esc.ov, o = ov.o;
  const r = ov.valor.map((v, i) => `<div class="esc-rueda"><button onclick="escRue(${i},1)">▲</button><span class="${ov.error ? 'esc-dig-err' : ''}">${escLista(o, i)[v]}</span><button onclick="escRue(${i},-1)">▼</button></div>`).join('');
  escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">${escEsc(o.titulo)}</div>${o.sub ? `<div class="esc-panel-s">${o.sub}</div>` : ''}<div class="esc-ruedas">${r}</div><div class="esc-acc"><button class="esc-cerrar" onclick="escOvCerrar(false)">Cerrar</button><button class="esc-ok2" onclick="escRueOk()">Probar</button></div></div>`);
}
const ESC_ABC = Array.from('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ');
function escLista(o, i){ return o.listas ? o.listas[i] : (Array.isArray(o.letras) ? o.letras : (o.letras ? Array.from(o.letras) : ESC_ABC)); }
function escRue(i, d){ const ov = esc.ov; if(!ov) return; const n = escLista(ov.o, i).length; ov.valor[i] = (ov.valor[i] + d + n) % n; ov.error = false; if(typeof essTecla === 'function') essTecla(); escDibujarRuedas(); }
function escRueOk(){
  const ov = esc.ov; if(!ov) return;
  if(ov.valor.map((v, i) => escLista(ov.o, i)[v]).join('').toUpperCase() === String(ov.o.clave).toUpperCase()){ if(typeof essExito === 'function') essExito(); escOvCerrar(true); }
  else { if(typeof essError === 'function') essError(); ov.error = true; escDibujarRuedas(); }
}

// Tablero de luces 3 x 3: tocar una la cambia a ella y a las de al lado. Hay que dejarlas todas prendidas.
function escLucesAplicar(estado, i){
  const f = Math.floor(i / 3), c = i % 3, r = estado.slice();
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([df, dc]) => { const ff = f + df, cc = c + dc; if(ff >= 0 && ff < 3 && cc >= 0 && cc < 3) r[ff * 3 + cc] = !r[ff * 3 + cc]; });
  return r;
}
function escAbrirLuces(o){
  if(esc.test){ const r = escRespuesta(); let est = o.inicial.slice(); (r || []).forEach(i => { est = escLucesAplicar(est, i); }); return Promise.resolve(est.every(Boolean)); }
  return new Promise(res => { esc.ov = { tipo: 'luces', o, estado: o.inicial.slice(), toques: 0, res }; escDibujarLuces(); });
}
function escDibujarLuces(){
  const ov = esc.ov, o = ov.o;
  const celdas = ov.estado.map((v, i) => `<button class="esc-foco${v ? ' esc-foco-on' : ''}" onclick="escFoco(${i})">${v ? '💡' : ''}</button>`).join('');
  escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">${escEsc(o.titulo)}</div>${o.sub ? `<div class="esc-panel-s">${o.sub}</div>` : ''}<div class="esc-focos">${celdas}</div><div class="esc-acc"><button class="esc-cerrar" onclick="escOvCerrar(false)">Cerrar</button><button class="esc-ok2" onclick="escFocoReiniciar()">Reiniciar</button></div></div>`);
}
function escFoco(i){
  const ov = esc.ov; if(!ov) return;
  ov.estado = escLucesAplicar(ov.estado, i); ov.toques++;
  if(typeof essTecla === 'function') essTecla();
  if(ov.estado.every(Boolean)){ if(typeof essExito === 'function') essExito(); escDibujarLuces(); setTimeout(() => escOvCerrar(true), 500); return; }
  escDibujarLuces();
}
function escFocoReiniciar(){ const ov = esc.ov; if(!ov) return; ov.estado = ov.o.inicial.slice(); escDibujarLuces(); }

// Secuencia: se tocan elementos (símbolos, colores, notas...) en el orden que se cree correcto. 'clave' = ids separados por coma.
function escAbrirSecuencia(o){
  if(esc.test){ const r = escRespuesta(); return Promise.resolve(r !== undefined && String(r) === String(o.clave)); }
  return new Promise(res => { esc.ov = { tipo: 'secuencia', o, valor: [], res }; escDibujarSecuencia(); });
}
function escDibujarSecuencia(){
  const ov = esc.ov, o = ov.o;
  const txt = id => (o.items.find(x => x.id === id) || {}).txt || id;
  escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">${escEsc(o.titulo)}</div>${o.sub ? `<div class="esc-panel-s">${o.sub}</div>` : ''}<div class="esc-visor esc-visor-sec${ov.error ? ' esc-dig-err' : ''}">${ov.valor.length ? ov.valor.map(txt).join(' ') : '–'}</div><div class="esc-secitems">${o.items.map(x => `<button onclick="escSecTocar('${x.id}')">${x.txt}</button>`).join('')}</div><div class="esc-acc"><button class="esc-cerrar" onclick="escSecBorrar()">Borrar</button><button class="esc-ok2" onclick="escSecOk()">Probar</button></div><button class="esc-cerrar" onclick="escOvCerrar(false)">Cerrar</button></div>`);
}
function escSecTocar(id){ const ov = esc.ov; if(!ov || ov.tipo !== 'secuencia') return; if(ov.valor.length < (ov.o.largo || 12)){ ov.valor.push(id); ov.error = false; if(typeof ov.o.alTocar === 'function') ov.o.alTocar(id); else if(typeof essTecla === 'function') essTecla(); escDibujarSecuencia(); } }
function escSecBorrar(){ const ov = esc.ov; if(!ov) return; ov.valor = []; ov.error = false; escDibujarSecuencia(); }
function escSecOk(){
  const ov = esc.ov; if(!ov) return;
  if(ov.valor.join(',') === String(ov.o.clave)){ if(typeof essExito === 'function') essExito(); escOvCerrar(true); }
  else { if(typeof essError === 'function') essError(); ov.error = true; ov.valor = []; escDibujarSecuencia(); }
}

function escAbrirLeer(titulo, html, o){
  if(esc.test) return Promise.resolve();
  return new Promise(res => { esc.ov = { tipo: 'leer', res }; escOvAbrir(`<div class="esc-papel ${(o && o.clase) || ''}"><div class="esc-papel-t">${escEsc(titulo)}</div><div class="esc-papel-c">${html}</div><button class="esc-cerrar esc-cerrar-papel" onclick="escOvCerrar(true)">Cerrar</button></div>`); });
}
function escAbrirElegir(titulo, opciones, sub){
  if(esc.test){ const r = escRespuesta(); return Promise.resolve(r === undefined ? -1 : r); }
  return new Promise(res => { esc.ov = { tipo: 'elegir', res }; escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">${escEsc(titulo)}</div>${sub ? `<div class="esc-panel-s">${sub}</div>` : ''}<div class="esc-lista">${opciones.map((x, i) => `<button onclick="escOvCerrar(${i})">${x}</button>`).join('')}</div><button class="esc-cerrar" onclick="escOvCerrar(-1)">Cerrar</button></div>`); });
}

function escCuaderno(){
  if(esc.ocupado || esc.ov) return;
  const n = esc.notas;
  esc.ov = { tipo: 'cuaderno', res: null };
  escOvAbrir(`<div class="esc-papel esc-cuaderno"><div class="esc-papel-t">📓 Cuaderno</div><div class="esc-papel-c">${n.length ? n.map(x => `<div class="esc-nota"><b>${escEsc(x.titulo)}</b><div>${x.html}</div></div>`).join('') : '<p>Todavía no anotaste nada. Lo que leas o escuches se guarda acá.</p>'}</div><button class="esc-cerrar esc-cerrar-papel" onclick="escOvCerrar(true)">Cerrar</button></div>`);
}

// ---- Pistas ----

function escPistaActual(){ return (esc.def.pistas || []).find(p => p.cuando(esc)) || null; }
function escPedirPista(){
  if(esc.ocupado || esc.ov) return;
  const p = escPistaActual();
  esc.ov = { tipo: 'pista', res: null };
  if(!p){ escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">💡 Bi</div><div class="esc-panel-s">Por ahora no se me ocurre nada que te pueda ayudar. ¡Probá tocar todo!</div><button class="esc-cerrar" onclick="escOvCerrar(false)">Cerrar</button></div>`); return; }
  const nivel = esc.nivelPista[p.id] || 0;
  escOvAbrir(`<div class="esc-panel"><div class="esc-panel-t">💡 ¿Querés una pista?</div><div class="esc-panel-s">Cada pista que pedís te saca puntos de estrellas y monedas al final. Esta es la pista ${Math.min(nivel + 1, p.textos.length)} de ${p.textos.length}.</div><div class="esc-acc"><button class="esc-cerrar" onclick="escOvCerrar(false)">Seguir solo</button><button class="esc-ok2" onclick="escDarPista()">Dame una pista</button></div></div>`);
}
async function escDarPista(){
  const p = escPistaActual();
  escOvCerrar(true);
  if(!p) return;
  const nivel = Math.min(esc.nivelPista[p.id] || 0, p.textos.length - 1);
  if((esc.nivelPista[p.id] || 0) < p.textos.length) esc.pistas++;
  esc.nivelPista[p.id] = Math.min(p.textos.length, (esc.nivelPista[p.id] || 0) + 1);
  escGuardar();
  if(esc.test){ esc.log.push('pista:' + p.id + ':' + nivel); return; }
  await esc.bi(p.textos[nivel]);
}

// ---- Final y premios ----

function escEstrellas(){
  const e = esc;
  return e.pistas === 0 && e.fallas <= 2 ? 3 : (e.pistas <= 3 ? 2 : 1);
}
function escMonedasPorEstrellas(n){ return n >= 3 ? 15 : (n === 2 ? 10 : 6); }

async function escTerminar(){
  esc.terminado = true; esc.estrellas = escEstrellas();
  const primera = !esc.recompensado;
  let monedas = 0;
  if(primera){ esc.recompensado = true; monedas = typeof arcOtorgarMonedas === 'function' ? arcOtorgarMonedas('escape-' + esc.def.id, escMonedasPorEstrellas(esc.estrellas)) : 0; }
  else monedas = typeof arcOtorgarMonedas === 'function' ? arcOtorgarMonedas('escape-' + esc.def.id, 3) : 0;
  esc.premio = monedas;
  escGuardar(true);
  if(typeof analyticsRegistrar === 'function') { try { analyticsRegistrar('escape_terminado', { juego: esc.def.id, pistas: esc.pistas, estrellas: esc.estrellas }); } catch(e){} }
  if(esc.test) return;
  const min = Math.floor(esc.seg / 60), seg = Math.round(esc.seg % 60);
  esc.ov = { tipo: 'fin', res: null };
  escOvAbrir(`<div class="esc-panel esc-fin"><div class="esc-fin-ico">🚌✨</div><div class="esc-panel-t">¡Escapaste!</div><div class="esc-estrellas">${'★'.repeat(esc.estrellas)}${'☆'.repeat(3 - esc.estrellas)}</div><div class="esc-panel-s">Tiempo: <b>${min} min ${seg} s</b><br>Pistas usadas: <b>${esc.pistas}</b> · Sustos de más: <b>${esc.fallas}</b><br>${monedas > 0 ? `<b>+${monedas} 🪙</b>${primera ? '' : ' (por jugarla de nuevo)'}` : 'Hoy ya juntaste el máximo de monedas en este juego'}</div><div class="esc-acc"><button class="esc-cerrar" onclick="escSalirAlMenu()">Salir</button></div></div>`);
}
function escSalirAlMenu(){ escOvCerrar(true); escSalir(); showView('busqueda'); }

// ---- Bucle ----

function escBucle(ts){
  if(!esc || !esc.activo) return;
  const vista = document.getElementById('view-escape');
  if(!vista || !vista.classList.contains('active')){ escSalir(); return; }
  const dt = esc.ultimo ? Math.min(0.05, (ts - esc.ultimo) / 1000) : 0.016;
  esc.ultimo = ts;
  escPaso(dt);
  escDibujar(esc.ctx);
  esc.raf = requestAnimationFrame(escBucle);
}

function escPaso(dt){
  const s = esc.salaDef();
  esc.t += dt;
  if(!esc.terminado) esc.seg += dt;
  // caminar
  if(esc.objetivoX != null){
    const dx = esc.objetivoX - esc.x;
    if(Math.abs(dx) < 3){ esc.objetivoX = null; esc.caminando = false; escLlego(); }
    else {
      esc.dir = dx > 0 ? 1 : -1; esc.x += esc.dir * Math.min(Math.abs(dx), ESC.VEL * dt); esc.caminando = true;
      esc.tPaso -= dt; if(esc.tPaso <= 0){ esc.tPaso = 0.34; if(typeof essPasos === 'function') essPasos(1); }
    }
  } else esc.caminando = false;
  esc.camX += (escClamp(esc.x - ESC.VW / 2, 0, s.ancho - ESC.VW) - esc.camX) * Math.min(1, dt * 5);
  // luz
  if(esc.mira && esc.t > esc.miraHasta) esc.mira = null;
  const blanco = esc.mira ? { x: esc.mira.x, y: esc.mira.y } : { x: esc.x + esc.dir * 70, y: ESC.PISO - 70 };
  if(!esc.miraSuave) esc.miraSuave = blanco; else { const k = Math.min(1, dt * 9); esc.miraSuave.x += (blanco.x - esc.miraSuave.x) * k; esc.miraSuave.y += (blanco.y - esc.miraSuave.y) * k; }
  // efectos
  esc.sacudida = Math.max(0, esc.sacudida - dt); esc.flashA = Math.max(0, esc.flashA - dt * 2.2); esc.parpadeo = Math.max(0, esc.parpadeo - dt);
  esc.fundido = Math.max(0, esc.fundido - dt * 2.6); esc.susto = Math.max(0, esc.susto - dt * 1.1);
  if(esc.exprHasta && esc.t > esc.exprHasta){ esc.exprHasta = 0; esc.expr = 'normal'; }
  // miedo y latido
  esc.miedo = Math.max(0, esc.miedo - dt * 0.045);
  const bpm = esc.miedo > 0.12 ? Math.round((52 + esc.miedo * 70) / 6) * 6 : 0;
  if(typeof essLatido === 'function' && bpm !== esc.bpm){ esc.bpm = bpm; essLatido(bpm); }
  // diálogo
  if(esc.cap && esc.t - esc.cap.ts > esc.cap.dur && !esc.cap.bloquea) escCerrarCap();
  // fantasma
  const f = esc.fantasma;
  if(f){
    f.t += dt;
    if(f.modo === 'sombra'){ f.x += 95 * dt * f.dir; f.alfa = Math.sin(Math.min(1, f.t / f.dur) * Math.PI) * 0.5; }
    else if(f.modo === 'ventana'){ f.alfa = Math.sin(Math.min(1, f.t / f.dur) * Math.PI) * (f.max || 0.8); }
    else if(f.modo === 'frente'){ f.alfa = Math.sin(Math.min(1, f.t / f.dur) * Math.PI) * 0.9; f.escala += dt * 0.25; }
    else if(f.modo === 'quieto'){ f.alfa = Math.min(1, f.alfa + dt * 1.2) * (f.max || 0.85); }
    if(f.modo !== 'quieto' && f.t > f.dur) esc.fantasma = null;
  }
  // ambiente
  if(!esc.ocupado && !esc.ov && s.ambiente !== false){
    esc.sigAmb -= dt;
    if(esc.sigAmb <= 0){ esc.sigAmb = escRnd(13, 32); escAmbiente(s); }
  }
}

function escAmbiente(s){
  const lista = (s.ambiente && s.ambiente.length) ? s.ambiente : ['crujido', 'susurro', 'parpadeo', 'chirrido', 'pasos'];
  const e = escElegir(lista);
  if(e === 'crujido' && typeof essCrujido === 'function') essCrujido();
  else if(e === 'susurro' && typeof essSusurro === 'function') essSusurro();
  else if(e === 'chirrido' && typeof essChirrido === 'function') essChirrido();
  else if(e === 'pasos' && typeof essPasos === 'function') essPasos(3);
  else if(e === 'parpadeo') esc.parpadear(escRnd(0.5, 1.1));
  else if(e === 'sombra') esc.asustar('sombra', { x: esc.camX - 40 });
  else if(e === 'campana' && typeof essCampana === 'function') essCampana();
  else if(typeof e === 'string' && e.indexOf('sfx:') === 0) esc.sfx(e.slice(4));
  esc.miedo = Math.min(1, esc.miedo + 0.06);
}

// ---- Luz (linterna) ----

function escCentroLuz(){
  const e = esc;
  if(e.linternaOn()){
    const m = e.miraSuave || { x: e.x + e.dir * 70, y: ESC.PISO - 70 };
    return { x: m.x, y: m.y, r: 108 + Math.sin(e.t * 8) * 2 };
  }
  return null;
}

// ---- Dibujo ----

function escCacheSala(){
  const s = esc.salaDef(), dpr = esc.dpr || 1;
  let c = esc.cache[esc.sala];
  if(!c){ c = esc.cache[esc.sala] = { cv: document.createElement('canvas'), v: -1 }; c.cv.width = s.ancho * dpr; c.cv.height = ESC.VH * dpr; c.ctx = c.cv.getContext('2d'); }
  if(c.v !== esc.version){
    c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); c.ctx.clearRect(0, 0, s.ancho, ESC.VH);
    s.dibujar(c.ctx, esc); c.v = esc.version;
  }
  return c;
}

function escDibujar(ctx){
  const e = esc, s = e.salaDef();
  ctx.save();
  ctx.fillStyle = '#05060b'; ctx.fillRect(0, 0, ESC.VW, ESC.VH);
  if(e.sacudida > 0) ctx.translate((Math.random() - 0.5) * 9 * Math.min(1, e.sacudida * 2), (Math.random() - 0.5) * 7 * Math.min(1, e.sacudida * 2));
  const cam = Math.round(e.camX);
  ctx.drawImage(escCacheSala().cv, cam * e.dpr, 0, ESC.VW * e.dpr, ESC.VH * e.dpr, 0, 0, ESC.VW, ESC.VH);
  ctx.save(); ctx.translate(-cam, 0);
  if(s.dinamico) s.dinamico(ctx, e, e.t);
  // personaje y Bi
  escDibujarPJ(ctx);
  ctx.restore();
  // oscuridad
  const oscura = e.oscura();
  if(oscura) escDibujarOscuridad(ctx);
  else if(e.parpadeo > 0 && Math.random() < 0.6){ ctx.fillStyle = 'rgba(0,0,0,' + (0.25 + Math.random() * 0.35).toFixed(2) + ')'; ctx.fillRect(0, 0, ESC.VW, ESC.VH); }
  // fantasma
  if(e.fantasma && e.fantasma.alfa > 0.01){ ctx.save(); ctx.translate(-cam, 0); escDibujarFantasma(ctx, e.fantasma, e.t); ctx.restore(); }
  // resaltar lo que se puede tocar
  if(e.resaltar > e.t) escDibujarResaltados(ctx, cam);
  // viñeta
  const g = ctx.createRadialGradient(ESC.VW / 2, ESC.VH * 0.55, ESC.VH * 0.28, ESC.VW / 2, ESC.VH * 0.55, ESC.VH * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,6,' + (0.55 + e.miedo * 0.25).toFixed(2) + ')');
  ctx.fillStyle = g; ctx.fillRect(0, 0, ESC.VW, ESC.VH);
  if(e.miedo > 0.5){ ctx.fillStyle = 'rgba(120,0,0,' + ((e.miedo - 0.5) * 0.22 * (0.7 + 0.3 * Math.sin(e.t * 9))).toFixed(3) + ')'; ctx.fillRect(0, 0, ESC.VW, ESC.VH); }
  // retrato con la expresión
  escDibujarRetrato(ctx);
  // susto grande
  if(e.susto > 0) escDibujarSustoGrande(ctx);
  if(e.flashA > 0){ ctx.globalAlpha = Math.min(1, e.flashA); ctx.fillStyle = e.flashColor; ctx.fillRect(0, 0, ESC.VW, ESC.VH); ctx.globalAlpha = 1; }
  if(e.fundido > 0){ ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, e.fundido) + ')'; ctx.fillRect(0, 0, ESC.VW, ESC.VH); }
  ctx.restore();
}

function escDibujarOscuridad(ctx){
  const e = esc, lc = e.luzCtx, c = escCentroLuz();
  const base = c ? 0.91 : (e.salaDef().penumbra || 0.87);
  lc.save(); lc.setTransform(e.dpr, 0, 0, e.dpr, 0, 0); lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, ESC.VW, ESC.VH);
  lc.fillStyle = 'rgba(2,3,10,' + (e.parpadeo > 0 && Math.random() < 0.5 ? 1 : base) + ')'; lc.fillRect(0, 0, ESC.VW, ESC.VH);
  lc.globalCompositeOperation = 'destination-out';
  const hueco = (x, y, r, a) => { const g = lc.createRadialGradient(x, y, r * 0.15, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(0.65, 'rgba(0,0,0,' + (a * 0.7) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.beginPath(); lc.arc(x, y, r, 0, 7); lc.fill(); };
  const cam = e.camX;
  const bi = escPosBi();
  hueco(bi.x - cam, bi.y, 46, 0.55);                       // Bi alumbra un poquito
  hueco(e.x - cam, ESC.PISO - 20, 36, 0.4);                // y algo alrededor de los pies
  if(c){
    hueco(c.x - cam, c.y, c.r, 1);
    // el haz que sale de la mano
    const mano = e.manoPos || { x: e.x + e.dir * 30, y: ESC.PISO - 100 };
    lc.beginPath(); lc.moveTo(mano.x, mano.y); const ang = Math.atan2(c.y - mano.y, c.x - cam - mano.x), d = Math.hypot(c.x - cam - mano.x, c.y - mano.y);
    lc.lineTo(c.x - cam + Math.cos(ang + Math.PI / 2) * c.r * 0.5, c.y + Math.sin(ang + Math.PI / 2) * c.r * 0.5);
    lc.lineTo(c.x - cam + Math.cos(ang - Math.PI / 2) * c.r * 0.5, c.y + Math.sin(ang - Math.PI / 2) * c.r * 0.5); lc.closePath();
    const gg = lc.createLinearGradient(mano.x, mano.y, c.x - cam, c.y); gg.addColorStop(0, 'rgba(0,0,0,.9)'); gg.addColorStop(1, 'rgba(0,0,0,.45)'); lc.fillStyle = gg; lc.fill();
  }
  lc.restore();
  ctx.drawImage(e.luzCv, 0, 0, ESC.VW, ESC.VH);
  if(c){ const g = ctx.createRadialGradient(c.x - cam, c.y, 4, c.x - cam, c.y, c.r); g.addColorStop(0, 'rgba(255,238,170,.22)'); g.addColorStop(1, 'rgba(255,238,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x - cam, c.y, c.r, 0, 7); ctx.fill(); }
}

function escPosBi(){
  const e = esc;
  return { x: e.x - e.dir * 42 + Math.sin(e.t * 1.7) * 6, y: ESC.PISO - 118 + Math.sin(e.t * 2.3) * 5 };
}

function escDibujarPJ(ctx){
  const e = esc;
  const anim = e.susto > 0.3 ? 'susto' : (e.expr === 'miedo' || e.expr === 'terror') ? (e.expr === 'terror' ? 'terror' : 'miedo') : e.linternaOn() ? 'linterna' : e.caminando ? 'camina' : e.animForzada || (e.expr === 'curioso' ? 'pensar' : e.expr === 'alivio' ? 'alivio' : e.expr === 'preocupado' && e.oscura() ? 'preocupado' : 'quieto');
  let expr = e.expr;
  if(expr === 'normal') expr = e.oscura() ? 'preocupado' : (e.miedo > 0.3 ? 'miedo' : 'normal');
  if(anim === 'linterna' && expr === 'normal') expr = 'serio';
  let mira = 0; if(e.miraSuave){ const d = e.miraSuave.x - e.x; mira = escClamp(d / 120, -1, 1) * e.dir; mira = mira > 0.35 ? 1 : mira < -0.35 ? -1 : 0; }
  if(typeof avcDibujar === 'function' && e.puesto){
    const r = avcDibujar(ctx, e.puesto, e.x, ESC.PISO, ESC.ESC_PJ, { dir: e.dir, anim, t: e.t, expr, mira, susto: 1 - e.susto });
    if(r && r.mano) e.manoPos = { x: r.mano.x - e.camX, y: r.mano.y };
    if(r && r.mano && (anim === 'linterna')) escDibujarLinterna(ctx, r.mano);
  }
  escDibujarBi(ctx);
  e.exprActual = expr;
}

function escDibujarLinterna(ctx, m){
  ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(Math.atan2(m.dy, m.dx * esc.dir) * 0 + (esc.dir > 0 ? 0 : Math.PI) + (esc.dir > 0 ? -0.1 : 0.1));
  ctx.fillStyle = '#2b2f3a'; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1;
  ctx.fillRect(-2, -4.5, 22, 9); ctx.strokeRect(-2, -4.5, 22, 9);
  ctx.fillStyle = '#6b7280'; ctx.fillRect(18, -6, 7, 12);
  ctx.fillStyle = '#FFF3B0'; ctx.fillRect(25, -5, 2.5, 10);
  ctx.restore();
}

function escDibujarBi(ctx){
  const e = esc, p = escPosBi();
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(255,200,120,.16)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, ESC.PISO - p.y - 4, 12, 3.5, 0, 0, 7); ctx.fill();
  if(typeof arcLogo === 'function') arcLogo(ctx, 0, 0, 30, '#fff');
  // ojos que miran hacia donde alumbra la linterna
  const m = e.miraSuave || { x: e.x, y: ESC.PISO }, dx = escClamp((m.x - e.x) / 100, -1, 1) * 1.6, asust = e.miedo > 0.35 ? 1.5 : 0;
  [-5, 5].forEach(ox => { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ox, -3, 4.4 + asust * 0.6, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1a2a'; ctx.beginPath(); ctx.arc(ox + dx, -3 + 0.6, 1.8, 0, 7); ctx.fill(); });
  ctx.restore();
}

function escDibujarRetrato(ctx){
  const e = esc;
  ctx.save();
  ctx.fillStyle = 'rgba(6,8,20,.78)'; ctx.beginPath(); ctx.arc(32, 34, 27, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(32, 34, 25, 0, 7); ctx.clip();
  const ex = e.exprActual || e.expr || 'normal';
  if(typeof avcRetrato === 'function' && e.puesto) avcRetrato(ctx, e.puesto, 32, 36 + (e.miedo > 0.5 ? Math.sin(e.t * 50) * 0.8 : 0), 54, ex, 0);
  ctx.restore();
  ctx.strokeStyle = e.miedo > 0.45 ? '#ff5a5a' : 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(32, 34, 27, 0, 7); ctx.stroke();
  ctx.restore();
}

function escDibujarResaltados(ctx, cam){
  const e = esc, a = Math.min(1, (e.resaltar - e.t) * 2);
  escObjetosActivos().forEach(o => {
    if(o.sinResalte) return;
    const x = o.x - cam, y = o.y;
    ctx.save(); ctx.globalAlpha = a * (0.55 + 0.35 * Math.sin(e.t * 8));
    ctx.strokeStyle = '#FFD84D'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeRect(x - 2, y - 2, o.w + 4, o.h + 4);
    ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,216,77,.12)'; ctx.fillRect(x - 2, y - 2, o.w + 4, o.h + 4);
    ctx.restore();
  });
}

// ---- El fantasma: Don Aurelio, el boletero ----

function escDibujarFantasma(ctx, f, t){
  const x = f.x, y = f.y, k = f.escala || 1, a = Math.min(1, f.alfa);
  const flick = f.modo === 'quieto' ? 1 : 0.8 + 0.2 * Math.sin(t * 31);
  ctx.save(); ctx.translate(x, y); ctx.scale(k * (f.dir || 1), k); ctx.globalAlpha = a * flick;
  (esc && esc.def && esc.def.espectro ? esc.def.espectro : escEspectroAurelio)(ctx, t, f);
  ctx.restore();
}

// Cada aventura puede dibujar su propio espectro (def.espectro): se dibuja con los pies en (0, 0) y 200 unidades de alto.
function escEspectroAurelio(ctx, t, f){
  const bamb = Math.sin(t * 2.2) * 3;
  // resplandor
  const g = ctx.createRadialGradient(0, -110, 10, 0, -110, 120); g.addColorStop(0, 'rgba(170,220,255,.28)'); g.addColorStop(1, 'rgba(170,220,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -110, 120, 0, 7); ctx.fill();
  // saco del uniforme, que termina en jirones
  ctx.fillStyle = 'rgba(190,210,225,.88)'; ctx.strokeStyle = 'rgba(40,60,80,.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-26, -150); ctx.quadraticCurveTo(-38, -90, -32 + bamb, -10);
  for(let i = 0; i <= 6; i++){ const px = -32 + i * 10.6 + bamb, py = -10 + (i % 2 ? 14 : -2) + Math.sin(t * 3 + i) * 3; ctx.lineTo(px, py); }
  ctx.quadraticCurveTo(38, -90, 26, -150); ctx.closePath(); ctx.fill(); ctx.stroke();
  // botones y solapa
  ctx.fillStyle = 'rgba(70,90,110,.8)'; [-100, -80, -60].forEach(by => { ctx.beginPath(); ctx.arc(0, by, 2.4, 0, 7); ctx.fill(); });
  ctx.strokeStyle = 'rgba(70,90,110,.6)'; ctx.beginPath(); ctx.moveTo(-14, -150); ctx.lineTo(0, -118); ctx.lineTo(14, -150); ctx.stroke();
  // brazos largos
  ctx.strokeStyle = 'rgba(200,220,235,.9)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  [-1, 1].forEach(l => { ctx.beginPath(); ctx.moveTo(l * 26, -140); ctx.quadraticCurveTo(l * 44, -100, l * (36 + Math.sin(t * 1.4) * 3), -52); ctx.stroke(); ctx.lineWidth = 3; [-4, 0, 4].forEach(d => { ctx.beginPath(); ctx.moveTo(l * (36 + Math.sin(t * 1.4) * 3), -52); ctx.lineTo(l * (36 + d) + d, -36); ctx.stroke(); }); ctx.lineWidth = 9; });
  // cabeza alargada con gorra de boletero
  ctx.fillStyle = 'rgba(215,228,238,.95)'; ctx.strokeStyle = 'rgba(40,60,80,.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, -168, 17, 24, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(30,40,70,.92)'; ctx.beginPath(); ctx.moveTo(-19, -178); ctx.quadraticCurveTo(0, -208, 19, -178); ctx.lineTo(25, -176); ctx.lineTo(-25, -176); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(230,168,23,.9)'; ctx.fillRect(-19, -180, 38, 3);
  // ojos huecos que brillan y boca estirada
  ctx.fillStyle = '#05060b'; [-7, 7].forEach(ox => { ctx.beginPath(); ctx.ellipse(ox, -168, 4.6, 7, 0, 0, 7); ctx.fill(); });
  ctx.fillStyle = 'rgba(190,240,255,.95)'; [-7, 7].forEach(ox => { ctx.beginPath(); ctx.arc(ox + Math.sin(t * 3) * 0.8, -167, 1.5, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#05060b'; ctx.beginPath(); ctx.ellipse(0, -152, 6.5, 8 + Math.abs(Math.sin(t * 2.5)) * 5, 0, 0, 7); ctx.fill();
}

function escDibujarSustoGrande(ctx){
  const e = esc, k = e.susto;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.9, k).toFixed(2) + ')'; ctx.fillRect(0, 0, ESC.VW, ESC.VH);
  const s = 4.4 + (1 - k) * 1.4;
  ctx.translate(ESC.VW / 2 + (Math.random() - 0.5) * 10 * k, ESC.VH * 0.46 + 168 * s + (Math.random() - 0.5) * 8 * k);
  ctx.globalAlpha = Math.min(1, k * 1.4);
  escDibujarFantasma(ctx, { x: 0, y: 0, escala: s * 1.0, alfa: 1, dir: 1, modo: 'quieto' }, e.t);
  ctx.restore();
  ctx.fillStyle = 'rgba(160,0,0,' + (k * 0.28).toFixed(2) + ')'; ctx.fillRect(0, 0, ESC.VW, ESC.VH);
}
