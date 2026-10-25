// Plaza en 3D (demo): el mismo mundo de la plaza (mismas paradas, gente, puertas y movimiento) pero visto como una
// maqueta "low poly" con Three.js. No cambia nada del juego: el movimiento, las salas, los demás pasajeros y las puertas siguen
// saliendo de plaza.js; esto solo los dibuja distinto. Se activa con el botón 🧊 3D de la plaza y se puede volver al 2D.
//
// Para que ande en celulares viejos: pocas piezas, materiales simples (sin sombras reales: un círculo oscuro bajo cada personaje),
// resolución limitada y Three.js se baja solo cuando alguien toca el botón.
//
// Medidas: 1 unidad 3D = 10 píxeles de la plaza 2D (x → X, y → Z).

const P3 = { THREE_URL: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', K: 0.1 };
const p3 = { listo: false, r: null, escena: null, cam: null, canvas: null, avatares: {}, etiquetas: {}, yaw: 0, dist: 20, alto: 24, mira: null, anim: [], t: 0, luz: null, sol: null, sector: '', tiempoCambio: 0 };

function plaza3dCargar(){
  if(window.THREE) return Promise.resolve();
  return new Promise((ok, mal) => {
    const s = document.createElement('script'); s.src = P3.THREE_URL;
    s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar el 3D (¿sin conexión?)'));
    document.head.appendChild(s);
  });
}
const p3Color = h => new THREE.Color(h);
function p3Mezcla(a, b, t){ const x = p3Color(a), y = p3Color(b); return x.lerp(y, t); }
function p3Plano(geo){ const g = geo.toNonIndexed(); g.computeVertexNormals(); return g; }
const p3Mat = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: p3Color(c) }, o || {}));
function p3Caja(w, h, d, c, x, y, z, padre){ const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), p3Mat(c)); m.position.set(x, y, z); (padre || p3.escena).add(m); return m; }
function p3Cil(rt, rb, h, seg, c, x, y, z, padre){ const m = new THREE.Mesh(p3Plano(new THREE.CylinderGeometry(rt, rb, h, seg)), p3Mat(c)); m.position.set(x, y, z); (padre || p3.escena).add(m); return m; }
function p3Esf(r, c, x, y, z, padre, seg){ const m = new THREE.Mesh(p3Plano(new THREE.SphereGeometry(r, seg || 7, seg ? Math.max(4, seg - 2) : 5)), p3Mat(c)); m.position.set(x, y, z); (padre || p3.escena).add(m); return m; }
function p3Cono(r, h, c, x, y, z, padre, seg){ const m = new THREE.Mesh(p3Plano(new THREE.ConeGeometry(r, h, seg || 6)), p3Mat(c)); m.position.set(x, y, z); (padre || p3.escena).add(m); return m; }

// ---- Carteles (texto y emoji) que miran a la cámara ----
function p3Etiqueta(texto, o){
  o = o || {};
  const clave = texto + '|' + (o.fondo || '') + '|' + (o.tam || 0);
  if(p3.etiquetas[clave]) return p3.etiquetas[clave].clone();
  const c = document.createElement('canvas'), x = c.getContext('2d'), tam = o.tam || 22;
  x.font = '800 ' + tam + 'px Poppins, "Segoe UI Emoji", sans-serif';
  const w = Math.max(64, Math.ceil(x.measureText(texto).width) + 28), h = tam + 20;
  c.width = w; c.height = h;
  x.font = '800 ' + tam + 'px Poppins, "Segoe UI Emoji", sans-serif';
  x.fillStyle = o.fondo || 'rgba(15,42,77,.85)'; x.beginPath(); if(x.roundRect) x.roundRect(0, 0, w, h, h / 2); else x.rect(0, 0, w, h); x.fill();
  x.fillStyle = o.color || '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(w / (o.escala || 30), h / (o.escala || 30), 1); sp.renderOrder = 10;
  p3.etiquetas[clave] = sp;
  return sp.clone();
}

// ---- Personaje low poly con la ropa y el pelo del avatar ----
function p3Avatar(puesto){
  const p = Object.assign({}, typeof AV_PUESTO_INICIAL !== 'undefined' ? AV_PUESTO_INICIAL : {}, puesto || {});
  const piel = AV_PIELES[p.piel] || AV_PIELES[1], pelo = AV_COLORES_PELO[p.peloColor] || AV_COLORES_PELO[1];
  const remera = AV_IDX.remera[p.remera] || AV_IDX.remera.basica;
  const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
  const mangas = remera.mangas || remera.color;
  // piernas y zapatillas
  const piernas = [-1, 1].map(l => { const pg = new THREE.Group(); pg.position.set(l * 0.38, 1.0, 0); p3Caja(0.5, 1.0, 0.5, '#34476F', 0, -0.5, 0, pg); p3Caja(0.56, 0.3, 0.8, '#ffffff', 0, -1.0, 0.12, pg); cuerpo.add(pg); return pg; });
  // torso (con el color de la remera) y el logo en las que lo llevan
  p3Caja(1.4, 1.5, 0.85, remera.color, 0, 1.9, 0, cuerpo);
  if(['busmac', 'egresado', 'dorada'].indexOf(p.remera) >= 0 && typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){
    const tex = new THREE.Texture(ARC_LOGO); tex.needsUpdate = true; const l = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); l.position.set(0, 2.1, 0.44); cuerpo.add(l);
  }
  if(p.remera === 'rayas' || p.remera === 'celeste' || p.remera === 'albiceleste' || p.remera === 'campeon'){ [-0.45, 0, 0.45].forEach(x => p3Caja(0.2, 1.5, 0.87, p.remera === 'rayas' ? '#E5484D' : '#74ACDF', x, 1.9, 0, cuerpo)); }
  // brazos
  const brazos = [-1, 1].map(l => { const bg = new THREE.Group(); bg.position.set(l * 0.95, 2.55, 0); p3Caja(0.38, 0.95, 0.38, mangas, 0, -0.4, 0, bg); p3Esf(0.24, piel, 0, -1.0, 0, bg, 5); cuerpo.add(bg); return bg; });
  // cabeza
  const cabeza = new THREE.Group(); cabeza.position.set(0, 3.55, 0); cuerpo.add(cabeza);
  p3Esf(1.0, piel, 0, 0.1, 0, cabeza, 8);
  [-0.38, 0.38].forEach(x => p3Esf(0.11, '#2A1B12', x, 0.18, 0.9, cabeza, 5)); p3Caja(0.5, 0.08, 0.1, '#7A1F2A', 0, -0.32, 0.93, cabeza);
  [-0.62, 0.62].forEach(x => p3Esf(0.18, '#F2A08C', x, -0.12, 0.8, cabeza, 5));
  // pelo
  const estilo = p.peloEstilo || 'corto';
  if(estilo !== 'rapado'){ const cas = p3Esf(1.06, pelo, 0, 0.28, -0.12, cabeza, 8); cas.scale.set(1, 0.8, 1); }
  if(estilo === 'largo'){ p3Caja(1.9, 1.7, 0.5, pelo, 0, -0.35, -0.75, cabeza); }
  if(estilo === 'colita'){ p3Esf(0.38, pelo, 0, 0.1, -1.15, cabeza, 5); p3Esf(0.14, '#E5484D', 0, 0.45, -1.1, cabeza, 4); }
  if(estilo === 'rulos'){ [[-0.8, 0.5], [0.8, 0.5], [0, 1.0], [-0.5, 0.95], [0.5, 0.95], [-0.95, 0], [0.95, 0]].forEach(([x, y]) => p3Esf(0.42, pelo, x, y, -0.2, cabeza, 5)); }
  if(estilo === 'flequillo') p3Caja(1.5, 0.3, 0.3, pelo, 0, 0.62, 0.78, cabeza);
  // gorra y accesorios de la cara
  const gor = p.gorra;
  if(gor === 'lana'){ p3Cono(1.0, 1.1, '#E5484D', 0, 1.15, 0, cabeza, 7); p3Esf(0.24, '#FFE9A6', 0, 1.75, 0, cabeza, 5); }
  else if(gor === 'paja'){ p3Cil(1.7, 1.7, 0.1, 10, '#E6C27A', 0, 0.85, 0, cabeza); p3Cil(0.85, 0.95, 0.6, 8, '#F0D391', 0, 1.15, 0, cabeza); }
  else if(gor === 'visera'){ p3Esf(1.05, '#0F2A4D', 0, 0.45, -0.05, cabeza, 8).scale.set(1, 0.7, 1); p3Caja(1.1, 0.12, 0.9, '#E6A817', 0, 0.55, 0.95, cabeza); }
  else if(gor === 'birrete'){ p3Caja(1.2, 0.35, 1.2, '#1B1F3A', 0, 0.95, 0, cabeza); p3Caja(2.1, 0.1, 2.1, '#2A2F57', 0, 1.2, 0, cabeza); p3Caja(0.1, 0.8, 0.1, '#FFD84D', 1.0, 0.85, 1.0, cabeza); }
  else if(gor === 'corona'){ p3Cil(0.9, 0.95, 0.5, 6, '#FFD84D', 0, 1.0, 0, cabeza); [0, 1, 2, 3, 4].forEach(i => { const a = i * Math.PI * 2 / 5; p3Cono(0.18, 0.5, '#FFD84D', Math.sin(a) * 0.8, 1.45, Math.cos(a) * 0.8, cabeza, 4); }); }
  if(p.caraAcc === 'anteojos' || p.caraAcc === 'sol'){ const c = p.caraAcc === 'sol' ? '#12161F' : '#2A1B12'; [-0.4, 0.4].forEach(x => p3Caja(0.6, 0.42, 0.1, c, x, 0.18, 0.98, cabeza)); p3Caja(0.2, 0.08, 0.1, c, 0, 0.2, 0.98, cabeza); }
  if(p.caraAcc === 'bigote') p3Caja(0.9, 0.15, 0.1, '#2A1B12', 0, -0.2, 0.96, cabeza);
  if(p.caraAcc === 'auriculares'){ [-1, 1].forEach(l => p3Caja(0.3, 0.7, 0.5, '#E5484D', l * 1.05, 0.1, 0, cabeza)); p3Caja(2.2, 0.15, 0.2, '#2B3A67', 0, 1.05, 0, cabeza); }
  // sombra redonda en el piso
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(1.1, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.04; g.add(sombra);
  g.userData = { cuerpo, piernas, brazos, cabeza, sombra, firma: JSON.stringify(p) };
  return g;
}

// ---- Escena ----
function p3Limpiar(){
  if(!p3.escena) return;
  while(p3.escena.children.length) p3.escena.remove(p3.escena.children[0]);
  p3.avatares = {}; p3.anim = [];
}

function p3Luces(){
  p3.luz = new THREE.HemisphereLight(0xdfeeff, 0x6a7a5a, 0.95); p3.escena.add(p3.luz);
  p3.sol = new THREE.DirectionalLight(0xffffff, 0.75); p3.sol.position.set(-30, 60, 40); p3.escena.add(p3.sol);
}

function p3Noche(){
  const d = new Date(), h = plz.horaForzada != null ? plz.horaForzada : d.getHours() + d.getMinutes() / 60;
  let a = 0;
  if(PLZ_SECTOR && PLZ_SECTOR.parque){ if(h >= 21 || h < 5) a = 1; else if(h >= 18) a = (h - 18) / 3; else if(h < 8) a = (8 - h) / 3; }
  return Math.max(0, Math.min(1, a));
}

function p3Edificio(e, s){
  const x = e.x * P3.K, z = e.y * P3.K, w = e.w * P3.K, d = e.h * P3.K, abajo = e.lado !== 'arriba';
  const cx = x + w / 2, cz = z + d / 2;
  if(e.mesa){ // mesa redonda con sillas
    p3Cil(3.2, 3.2, 1.3, 10, '#2f7d4f', cx, 0.65, cz); p3Cil(3.4, 3.4, 0.2, 10, '#8a5a30', cx, 1.35, cz);
    for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3; p3Caja(1.1, 1.1, 1.1, '#6a4422', cx + Math.sin(a) * 4.4, 0.55, cz + Math.cos(a) * 4.4); }
    const et = p3Etiqueta(e.emoji + ' ' + e.nombre); et.position.set(cx, 5.2, cz); p3.escena.add(et); return;
  }
  const alto = e.padel ? 5 : e.puesto ? 4.4 : e.compacto ? 5.6 : 7.2;
  let color = e.color || '#888';
  if(e.neon) color = '#17102e'; if(e.sel) color = '#c8e3f7';
  const cuerpo = p3Caja(w, alto, d, color, cx, alto / 2, cz);
  p3Caja(w + 0.6, 0.6, d + 0.6, p3Mezcla(color, '#000000', 0.35).getStyle(), cx, alto + 0.3, cz);
  if(e.neon){ p3Caja(w * 0.9, 0.35, 0.2, '#ff4ddb', cx, alto - 0.8, abajo ? z + d + 0.12 : z - 0.12).material = new THREE.MeshBasicMaterial({ color: 0xff4ddb }); p3Caja(w * 0.9, 0.35, 0.2, '#4dd9ff', cx, 1.0, abajo ? z + d + 0.12 : z - 0.12).material = new THREE.MeshBasicMaterial({ color: 0x4dd9ff }); }
  if(e.sel){ [0, 1, 2].forEach(i => p3Caja(w / 6, alto, d + 0.1, '#74ACDF', x + w / 6 + i * w / 3, alto / 2, cz)); }
  if(e.padel){ // techo de vidrio con la cancha
    p3Caja(w - 2, 0.15, d - 2, '#2E6FD0', cx, alto + 0.7, cz); p3Caja(0.2, 0.2, d - 2.4, '#ffffff', cx, alto + 0.85, cz); p3Caja(w - 2.4, 0.2, 0.2, '#ffffff', cx, alto + 0.85, cz);
    const bola = p3Esf(0.5, '#D9F236', cx, alto + 1.6, cz, null, 6); p3.anim.push(t => { bola.position.x = cx + Math.sin(t * 1.8) * (w / 2 - 3); bola.position.y = alto + 1.6 + Math.abs(Math.sin(t * 3.6)) * 1.6; });
  }
  // puerta y toldo
  const pz = abajo ? z + d + 0.1 : z - 0.1;
  p3Caja(2.2, 3.2, 0.3, e.neon ? '#ff4ddb' : '#5A3A22', cx, 1.6, pz);
  if(e.puesto){ for(let i = 0; i < 6; i++) p3Caja(w / 6, 0.25, 2.4, i % 2 ? '#ffffff' : p3Mezcla(color, '#000000', 0.2).getStyle(), x + w / 12 + i * w / 6, 3.4 - 0.2, abajo ? z + d + 1.0 : z - 1.0).rotation.x = abajo ? 0.25 : -0.25; }
  const et = p3Etiqueta(e.emoji + ' ' + e.nombre); et.position.set(cx, alto + (e.padel ? 3.4 : 2.0), cz); p3.escena.add(et);
}

function p3Arbol(x, z, k){
  p3Cil(0.35, 0.5, 2.4, 5, '#6a4a2a', x, 1.2, z); const c = ['#3E9B4F', '#2F8A45', '#4DAA5A'][Math.floor(k * 3) % 3];
  p3Cono(2.1, 3.4, c, x, 4.0, z, null, 6); p3Cono(1.6, 2.8, c, x, 5.6, z, null, 6);
}

function p3Plaza(s){
  const W = PLZ.W * P3.K, H = PLZ.H * P3.K;
  // césped, senderos y fuente
  const cesped = new THREE.Mesh(new THREE.PlaneGeometry(W - 5.2, 31.6), p3Mat('#7FC77A')); cesped.rotation.x = -Math.PI / 2; cesped.position.set(W / 2, 0.03, 35.4); p3.escena.add(cesped);
  const f = PLZ_FUENTE;
  if(f){ const fx = f.x * P3.K, fz = f.y * P3.K, r = f.r * P3.K; p3Cil(r, r + 0.3, 1.0, 12, '#B8C2D1', fx, 0.5, fz); const agua = p3Cil(r - 0.8, r - 0.8, 0.1, 12, '#6AC2FF', fx, 1.0, fz); p3Cil(0.5, 0.7, 3.2, 6, '#C7CEDA', fx, 1.8, fz); const anillo = p3Cil(1, 1, 0.08, 10, '#ffffff', fx, 1.12, fz); anillo.material.transparent = true; p3.anim.push(t => { const k = 0.4 + (t * 0.5) % 1 * 2.2; anillo.scale.set(k, 1, k); anillo.material.opacity = 1 - (k - 0.4) / 2.2; }); }
  [[26, 200], [614, 200], [26, 280], [614, 280], [26, 400], [614, 400], [26, 470], [614, 470], [120, 210], [540, 210], [90, 500], [560, 505]].forEach(([x, y], i) => p3Arbol(x * P3.K, y * P3.K, (i * 37) % 10 / 10));
  // bancos
  [[96, 452], [506, 452]].forEach(([x, y]) => { const bx = (x + 17) * P3.K, bz = y * P3.K; p3Caja(8.2, 0.4, 1.4, '#B8793B', bx, 1.4, bz); p3Caja(8.2, 1.4, 0.3, '#8A5A2B', bx, 2.3, bz - 0.8); [-3.6, 3.6].forEach(dx => p3Caja(0.4, 1.4, 1.2, '#5A3A22', bx + dx, 0.7, bz)); });
  // hamacas
  const hx = 6, hz = 29; [0, 1].forEach(i => { const px = i ? 20.5 : 5.5; p3Caja(0.4, 8.5, 0.4, '#8A5A2B', px, 4.2, hz).rotation.z = i ? -0.15 : 0.15; p3Caja(0.4, 8.5, 0.4, '#8A5A2B', px, 4.2, hz + 3).rotation.z = i ? -0.15 : 0.15; });
  p3Caja(15.4, 0.4, 0.4, '#8A5A2B', 13, 8.4, hz + 0); p3Caja(15.4, 0.4, 0.4, '#8A5A2B', 13, 8.4, hz + 3);
  [7.8, 12.4, 17].forEach((x, i) => { const g = new THREE.Group(); g.position.set(x, 8.2, hz + 1.5); p3Caja(0.1, 6.2, 0.1, '#444', -0.9, -3.1, 0, g); p3Caja(0.1, 6.2, 0.1, '#444', 0.9, -3.1, 0, g); p3Caja(2.2, 0.35, 1.2, '#E5586E', 0, -6.2, 0, g); p3.escena.add(g); p3.anim.push(t => { g.rotation.x = Math.sin(t * 1.2 + i) * 0.12; }); });
  // cama elástica
  const tx = 50, tz = 32.8; p3Cil(5.8, 6, 0.6, 12, '#FFD84D', tx, 0.5, tz); const tela = p3Cil(5, 5, 0.1, 12, '#2B3A67', tx, 0.82, tz); p3.anim.push(t => { tela.position.y = 0.82 + Math.max(0, Math.sin(t * 5)) * 0.1; });
  // subibaja
  const sb = new THREE.Group(); sb.position.set(32, 1.2, 25); p3Cono(0.9, 1.6, '#8A5A2B', 0, -0.4, 0, null, 4); const tabla = p3Caja(11.6, 0.5, 1.6, '#E5586E', 0, 0, 0, sb); p3.escena.add(sb); p3.anim.push(() => { tabla.rotation.z = (plz.sbS || 0) / 58 * 0.9; });
  // parada del micro
  p3Caja(0.3, 5, 0.3, '#5b6673', 32, 2.5, 52.8); p3Caja(4.8, 2.4, 0.3, '#0F2A4D', 32, 5.2, 52.8);
  const et = p3Etiqueta('🚌 MICRO'); et.position.set(32, 7.4, 52.8); p3.escena.add(et);
  // flores
  [[240, 410], [400, 410], [215, 250], [430, 240], [270, 485], [372, 485]].forEach(([x, y], i) => { p3Cil(0.06, 0.06, 0.8, 4, '#3a8a3a', x * P3.K, 0.4, y * P3.K); p3Esf(0.35, i % 2 ? '#FFE066' : '#FF7AA8', x * P3.K, 0.9, y * P3.K, null, 5); });
}

function p3Construir(){
  p3Limpiar();
  const s = PLZ_SECTOR, W = PLZ.W * P3.K, H = PLZ.H * P3.K;
  p3.sector = s.id;
  p3Luces();
  p3.escena.background = p3Color(s.parque ? '#8fd0ff' : s.fuera); p3.escena.fog = new THREE.Fog(p3.escena.background.getHex(), 70, 150);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), p3Mat(s.suelo)); suelo.rotation.x = -Math.PI / 2; suelo.position.set(W / 2, 0, H / 2); p3.escena.add(suelo);
  if(!s.sinPasillos){ const c = new THREE.Mesh(new THREE.PlaneGeometry(6.8, H - 19), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })); c.rotation.x = -Math.PI / 2; c.position.set(W / 2, 0.02, 15 + (H - 19) / 2); p3.escena.add(c); }
  // borde bajito alrededor
  const bc = s.borde || s.fuera, b = 1.2;
  p3Caja(W, b, 1, bc, W / 2, b / 2, 0.5); p3Caja(W, b, 1, bc, W / 2, b / 2, H - 0.5); p3Caja(1, b, H, bc, 0.5, b / 2, H / 2); p3Caja(1, b, H, bc, W - 0.5, b / 2, H / 2);
  if(s.parque) p3Plaza(s);
  (PLZ_BLOQUES || []).forEach(bl => p3Caja(bl.w * P3.K, 4, bl.h * P3.K, p3Mezcla(s.suelo, '#000000', 0.45).getStyle(), (bl.x + bl.w / 2) * P3.K, 2, (bl.y + bl.h / 2) * P3.K));
  PLZ_EDIFICIOS.forEach(e => p3Edificio(e, s));
  // atracciones sin modelo propio: un cartel flotante con su emoji
  PLZ_ATRACCIONES.forEach(a => {
    if(a.id === 'parada' || ['hamacas', 'trampolin', 'banco1', 'banco2', 'fuente', 'subibaja'].indexOf(a.id) >= 0 && s.parque) return;
    if(!a.zona) return;
    const et = p3Etiqueta(a.emoji, { tam: 34, fondo: 'rgba(255,255,255,.25)' }); et.position.set((a.zona.x + a.zona.w / 2) * P3.K, 3.2, (a.zona.y + a.zona.h / 2) * P3.K); p3.escena.add(et);
  });
  p3.luzNoche = true;
}

// ---- Personajes ----
function p3Personaje(clave, puesto){
  const firma = JSON.stringify(puesto || {});
  let a = p3.avatares[clave];
  if(!a || a.firma !== firma){
    if(a) p3.escena.remove(a.g);
    const g = p3Avatar(puesto); p3.escena.add(g);
    a = p3.avatares[clave] = { g, firma, x: null, z: null, rumbo: 0, nombre: null, nombreSp: null, burbuja: null, burbujaSp: null };
  }
  a.vivo = true;
  return a;
}

function p3Mover(a, x, y, nombre, caminando, pose, burbuja, fase, opts){
  const g = a.g, u = g.userData, X = x * P3.K, Z = y * P3.K;
  if(a.x == null){ a.x = X; a.z = Z; }
  const dx = X - a.x, dz = Z - a.z, mov = Math.hypot(dx, dz) > 0.002;
  if(mov){ const obj = Math.atan2(dx, dz); let d = obj - a.rumbo; d = Math.atan2(Math.sin(d), Math.cos(d)); a.rumbo += d * 0.25; }
  a.x = X; a.z = Z;
  g.position.set(X, 0, Z); g.rotation.y = a.rumbo;
  const t = p3.t, sw = caminando ? Math.sin(t * 11 + fase) : 0;
  u.piernas[0].rotation.x = sw * 0.8; u.piernas[1].rotation.x = -sw * 0.8; u.brazos[0].rotation.x = -sw * 0.7; u.brazos[1].rotation.x = sw * 0.7;
  u.cuerpo.position.y = caminando ? Math.abs(Math.sin(t * 11 + fase)) * 0.18 : 0; u.cuerpo.rotation.z = 0; u.cabeza.rotation.z = 0;
  u.sombra.scale.set(1, 1, 1);
  if(pose === 3){ u.cuerpo.position.y = -0.9; u.piernas.forEach(p => { p.rotation.x = -1.45; }); }
  else if(pose === 2){ const h = Math.abs(Math.sin(t * 5 + fase)) * 4.5; u.cuerpo.position.y = h; u.brazos[0].rotation.z = 0.6; u.brazos[1].rotation.z = -0.6; u.sombra.scale.set(1 - h * 0.08, 1 - h * 0.08, 1); }
  else if(pose === 4){ u.cuerpo.position.y = Math.abs(Math.sin(t * 7 + fase)) * 0.4; u.cuerpo.rotation.z = Math.sin(t * 7 + fase) * 0.15; u.brazos[0].rotation.x = -2.6 * (Math.sin(t * 7) > 0 ? 1 : 0.5); u.brazos[1].rotation.x = -2.6 * (Math.sin(t * 7) > 0 ? 0.5 : 1); }
  else if(pose === 5){ u.brazos.forEach(b => { b.rotation.x = -2.9; }); }
  else if(pose === 1){ u.cuerpo.position.y = 0.4 + Math.sin(t * 2.4 + fase) * 0.4; u.piernas.forEach(p => { p.rotation.x = -1.3; }); }
  else if(pose === 6){ u.cuerpo.position.y = plazaSubibajaAlto(x) * P3.K * 1.6 - 0.2; u.piernas.forEach(p => { p.rotation.x = -1.4; }); a.rumbo = x < PLZ_SB.cx ? Math.PI / 2 : -Math.PI / 2; }
  if(pose !== 2) { u.brazos[0].rotation.z = 0; u.brazos[1].rotation.z = 0; }
  // nombre y burbuja
  if(a.nombre !== nombre){ if(a.nombreSp) g.remove(a.nombreSp); a.nombre = nombre; a.nombreSp = p3Etiqueta(nombre, { tam: 24, escala: 34 }); a.nombreSp.position.set(0, 5.6, 0); g.add(a.nombreSp); }
  if(a.burbuja !== (burbuja || null)){ if(a.burbujaSp) g.remove(a.burbujaSp); a.burbuja = burbuja || null; a.burbujaSp = null; if(burbuja){ a.burbujaSp = p3Etiqueta(burbuja, { tam: 26, fondo: '#ffffff', color: '#0F2A4D', escala: 30 }); a.burbujaSp.position.set(0, 7.2, 0); g.add(a.burbujaSp); } }
  g.rotation.y = a.rumbo;
}

function p3Cuadro(dt){
  p3.t += dt;
  const ahoraMs = performance.now(), ahoraServidor = plazaAhora();
  Object.keys(p3.avatares).forEach(k => { p3.avatares[k].vivo = false; });
  // yo
  const puestoYo = plazaCompacto();
  const yo = p3Personaje('yo', puestoYo);
  p3Mover(yo, plz.yo.x, plz.yo.y, 'Vos', plz.caminando && !plz.pose, plz.pose ? plz.pose.p : 0, plz.burbuja && ahoraMs < plz.burbuja.hasta ? plz.burbuja.texto : null, 0);
  // los demás
  Object.keys(plz.otros).forEach(k => {
    const o = plz.otros[k], a = p3Personaje('o' + k, o.avatar), caminando = Math.hypot(o.tx - o.x, o.ty - o.y) > 3;
    p3Mover(a, o.x, o.y, String(o.nombre).slice(0, 10), caminando && !o.p, o.p || 0, o.m != null && ahoraServidor - o.mt < 4500 ? PLZ_FRASES[o.m] : null, o.fase || 0);
  });
  plz.bots.forEach((b, i) => { const a = p3Personaje('b' + i, b.a); p3Mover(a, b.x, b.y, b.n, b.caminando, b.pose || 0, b.m != null && ahoraMs < b.hasta ? PLZ_FRASES[b.m] : null, i); });
  Object.keys(p3.avatares).forEach(k => { const a = p3.avatares[k]; if(!a.vivo){ p3.escena.remove(a.g); delete p3.avatares[k]; } });
  p3.anim.forEach(f => f(p3.t));
  // cámara
  const tx = plz.yo.x * P3.K, tz = plz.yo.y * P3.K;
  if(!p3.mira) p3.mira = new THREE.Vector3(tx, 2, tz); else { p3.mira.x += (tx - p3.mira.x) * Math.min(1, dt * 6); p3.mira.z += (tz - p3.mira.z) * Math.min(1, dt * 6); }
  const cx = p3.mira.x + Math.sin(p3.yaw) * p3.dist, cz = p3.mira.z + Math.cos(p3.yaw) * p3.dist;
  p3.cam.position.set(Math.max(-2, Math.min(PLZ.W * P3.K + 2, cx)), p3.alto, cz); p3.cam.lookAt(p3.mira.x, 1.8, p3.mira.z - 3);
  // luz de día o de noche
  const n = p3Noche();
  if(p3.luz){ p3.luz.intensity = 0.95 - 0.5 * n; p3.sol.intensity = 0.75 - 0.55 * n; }
  if(PLZ_SECTOR.parque){ const dia = p3Color('#8fd0ff'), noche = p3Color('#0a1030'); const c = dia.lerp(noche, n); p3.escena.background = c; if(p3.escena.fog) p3.escena.fog.color = c; }
}

function plaza3dFrame(dt){
  if(!p3.listo || !plz.modo3d) return;
  try { p3Cuadro(dt); p3.r.render(p3.escena, p3.cam); } catch(e){ console.error(e); plaza3dApagar(true, 'No se pudo dibujar el 3D en este celular'); }
}

// ---- Encender y apagar ----
async function plaza3dEncender(guardar){
  const caja = document.querySelector('#view-plaza .plz-caja');
  if(!caja || plz.modo3d) return;
  try {
    await plaza3dCargar();
    const test = document.createElement('canvas');
    if(!(test.getContext('webgl') || test.getContext('experimental-webgl'))) throw new Error('Este celular no soporta 3D');
    const canvas = document.createElement('canvas'); canvas.className = 'plz-canvas3d';
    const pr = Math.min(1.75, window.devicePixelRatio || 1);
    p3.r = new THREE.WebGLRenderer({ canvas, antialias: pr < 1.5, powerPreference: 'low-power' });
    p3.r.setPixelRatio(pr); p3.r.setSize(PLZ.VW, PLZ.VH, false);
    p3.escena = new THREE.Scene(); p3.cam = new THREE.PerspectiveCamera(52, PLZ.VW / PLZ.VH, 0.5, 220); p3.canvas = canvas;
    p3.mira = null; p3.yaw = 0; p3.t = 0;
    if(plz.canvas) plz.canvas.style.display = 'none';
    caja.appendChild(canvas);
    plaza3dEntrada(canvas);
    plz.modo3d = true; p3.listo = true;
    p3Construir();
    if(guardar){ try { localStorage.setItem('busmac-plaza3d', 'si'); } catch(e){} }
    plaza3dBoton();
  } catch(err){
    plaza3dApagar(false);
    if(typeof mostrarToast === 'function') mostrarToast(err && err.message ? err.message : 'No se pudo abrir el 3D');
  }
}

function plaza3dApagar(guardar, aviso){
  plz.modo3d = false; p3.listo = false;
  try { if(p3.r){ p3.r.dispose(); const gl = p3.r.getContext(); const ext = gl && gl.getExtension && gl.getExtension('WEBGL_lose_context'); if(ext) ext.loseContext(); } } catch(e){}
  if(p3.canvas && p3.canvas.parentNode) p3.canvas.parentNode.removeChild(p3.canvas);
  p3.r = null; p3.canvas = null; p3.escena = null; p3.avatares = {}; p3.anim = [];
  if(plz.canvas) plz.canvas.style.display = '';
  if(guardar){ try { localStorage.setItem('busmac-plaza3d', 'no'); } catch(e){} }
  plaza3dBoton();
  if(aviso && typeof mostrarToast === 'function') mostrarToast(aviso);
}

function plaza3dAlternar(){ if(plz.modo3d) plaza3dApagar(true); else plaza3dEncender(true); }
function plaza3dBoton(){ const b = document.getElementById('plaza-b3d'); if(b) b.textContent = plz.modo3d ? '🗺️ 2D' : '🧊 3D'; }

// Llamado al entrar a un sector: si el 3D estaba prendido, se vuelve a armar con el mapa nuevo.
function plaza3dIniciar(){
  plz.modo3d = false; p3.listo = false; plaza3dBoton();
  let quiere = false; try { quiere = localStorage.getItem('busmac-plaza3d') === 'si'; } catch(e){}
  if(quiere) plaza3dEncender(false);
}
function plaza3dDetener(){ if(plz.modo3d || p3.r) plaza3dApagar(false); }

// Tocar = caminar hasta ahí; arrastrar de costado = girar la cámara.
function plaza3dEntrada(canvas){
  let ini = null, movido = false, ultimoX = 0;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', ev => { ev.preventDefault(); ini = { x: ev.clientX, y: ev.clientY }; ultimoX = ev.clientX; movido = false; try { canvas.setPointerCapture(ev.pointerId); } catch(e){} });
  canvas.addEventListener('pointermove', ev => {
    if(!ini) return;
    if(Math.hypot(ev.clientX - ini.x, ev.clientY - ini.y) > 8) movido = true;
    if(movido){ p3.yaw -= (ev.clientX - ultimoX) * 0.012; ultimoX = ev.clientX; }
  });
  canvas.addEventListener('pointerup', ev => {
    if(ini && !movido){
      const r = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, p3.cam);
      const o = rc.ray.origin, d = rc.ray.direction;
      if(d.y < -0.01){ const t = -o.y / d.y; plz.obj = { x: (o.x + d.x * t) / P3.K, y: (o.z + d.z * t) / P3.K }; plz.ultimaActividad = performance.now(); if(plz.buscado) plz.buscado.sigue = false; }
    }
    ini = null;
  });
  canvas.addEventListener('pointercancel', () => { ini = null; });
}
