// Plaza en 3D (demo): el mismo mundo de la plaza (mismas paradas, gente, puertas y movimiento) pero visto como una
// maqueta "low poly" con Three.js. No cambia nada del juego: el movimiento, las salas, los demás pasajeros y las puertas siguen
// saliendo de plaza.js; esto solo los dibuja distinto. Se activa con el botón 🧊 3D de la plaza y se puede volver al 2D.
//
// Para que ande en celulares viejos: pocas piezas, materiales simples (sin sombras reales: un círculo oscuro bajo cada personaje),
// resolución limitada y Three.js se baja solo cuando alguien toca el botón.
//
// Medidas: 1 unidad 3D = 10 píxeles de la plaza 2D (x → X, y → Z).

const P3 = { THREE_URL: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', K: 0.1 };
const p3 = { listo: false, r: null, escena: null, cam: null, canvas: null, avatares: {}, etiquetas: {}, yaw: 0, dist: 20, alto: 24, mira: null, anim: [], t: 0, luz: null, sol: null, sector: '', tiempoCambio: 0, zonas: [], faroles: [], carteles: {}, destino: null, nubes: [], modo: 0, zoom: 1, marca: null, btnCam: null, fps: { t: 0, n: 0, listo: false } };

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

// Cartel grande y legible, inclinado sobre el techo hacia la cámara (como el cartel de la fachada en el 2D).
function p3Cartel(e, color, ancho){
  const clave = 'cartel|' + e.emoji + '|' + e.nombre + '|' + color;
  if(!p3.etiquetas[clave]){
    const c = document.createElement('canvas'); c.width = 400; c.height = 150; const x = c.getContext('2d');
    x.fillStyle = color; x.beginPath(); if(x.roundRect) x.roundRect(4, 4, 392, 142, 30); else x.rect(4, 4, 392, 142); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 8; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); if(x.roundRect) x.roundRect(10, 10, 380, 50, 24); else x.rect(10, 10, 380, 50); x.fill();
    x.font = '56px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(e.emoji, 64, 77);
    let tam = 54; x.font = '800 ' + tam + 'px Poppins, sans-serif';
    while(x.measureText(e.nombre).width > 270 && tam > 22){ tam -= 2; x.font = '800 ' + tam + 'px Poppins, sans-serif'; }
    x.lineWidth = 7; x.strokeStyle = 'rgba(0,0,0,.45)'; x.strokeText(e.nombre, 238, 80); x.fillStyle = '#fff'; x.fillText(e.nombre, 238, 80);
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter; p3.etiquetas[clave] = tex;
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, ancho * 150 / 400), new THREE.MeshBasicMaterial({ map: p3.etiquetas[clave], transparent: true, side: THREE.DoubleSide }));
  return m;
}
// Marca en el piso (alfombra de la puerta o círculo de una atracción): se enciende cuando estás cerca, igual que el botón de abajo.
function p3Zona(id, x, z, w, d, redonda){
  const m = new THREE.Mesh(redonda ? new THREE.CircleGeometry(w, 20) : new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z); p3.escena.add(m); p3.zonas.push({ mesh: m, id, base: redonda ? 0.16 : 0.38 });
  return m;
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
  if(p.remera === 'hawaiana'){ [[-0.4, 2.3, '#FFD84D'], [0.3, 2.45, '#FF7AA8'], [-0.1, 1.8, '#FF7AA8'], [0.45, 1.65, '#FFD84D'], [-0.45, 1.5, '#FFD84D']].forEach(([x, y, c]) => p3Caja(0.22, 0.22, 0.88, c, x, y, 0, cuerpo)); }
  if(p.remera === 'estrellas'){ [[-0.4, 2.4], [0.35, 2.5], [0, 1.9], [0.45, 1.6], [-0.4, 1.5], [0.05, 1.3]].forEach(([x, y]) => p3Caja(0.2, 0.2, 0.88, '#FFF3B0', x, y, 0, cuerpo)); }
  if(p.remera === 'chofer'){ p3Caja(0.2, 0.9, 0.88, '#0F2A4D', 0, 1.95, 0, cuerpo); p3Caja(0.7, 0.18, 0.88, '#ffffff', 0, 2.55, 0, cuerpo); }
  if(p.remera === 'busmac' || p.remera === 'egresado'){ p3Caja(1.42, 0.2, 0.88, '#E6A817', 0, 1.35, 0, cuerpo); }
  if(p.remera === 'rayas' || p.remera === 'celeste' || p.remera === 'albiceleste' || p.remera === 'campeon'){ [-0.45, 0, 0.45].forEach(x => p3Caja(0.2, 1.5, 0.87, p.remera === 'rayas' ? '#E5484D' : '#74ACDF', x, 1.9, 0, cuerpo)); }
  // brazos
  const brazos = [-1, 1].map(l => { const bg = new THREE.Group(); bg.position.set(l * 0.95, 2.55, 0); p3Caja(0.38, 0.95, 0.38, mangas, 0, -0.4, 0, bg); p3Esf(0.24, piel, 0, -1.0, 0, bg, 5); cuerpo.add(bg); return bg; });
  // cabeza
  const cabeza = new THREE.Group(); cabeza.position.set(0, 3.55, 0); cuerpo.add(cabeza);
  p3Esf(1.0, piel, 0, 0.1, 0, cabeza, 8);
  const ojos = [-0.38, 0.38].map(x => p3Esf(0.11, '#2A1B12', x, 0.18, 0.9, cabeza, 5)); const boca = p3Caja(0.5, 0.08, 0.1, '#7A1F2A', 0, -0.32, 0.93, cabeza);
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
  else if(gor === 'visera'){ p3Esf(1.05, '#0F2A4D', 0, 0.45, -0.05, cabeza, 8).scale.set(1, 0.7, 1); p3Caja(1.1, 0.12, 0.9, '#E6A817', 0, 0.55, 0.95, cabeza); if(typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){ const tl = new THREE.Texture(ARC_LOGO); tl.needsUpdate = true; const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: tl, transparent: true })); lg.position.set(0, 0.95, 0.99); lg.rotation.x = -0.3; cabeza.add(lg); } }
  else if(gor === 'birrete'){ p3Caja(1.2, 0.35, 1.2, '#1B1F3A', 0, 0.95, 0, cabeza); p3Caja(2.1, 0.1, 2.1, '#2A2F57', 0, 1.2, 0, cabeza); p3Caja(0.1, 0.8, 0.1, '#FFD84D', 1.0, 0.85, 1.0, cabeza); }
  else if(gor === 'corona'){ p3Cil(0.9, 0.95, 0.5, 6, '#FFD84D', 0, 1.0, 0, cabeza); [0, 1, 2, 3, 4].forEach(i => { const a = i * Math.PI * 2 / 5; p3Cono(0.18, 0.5, '#FFD84D', Math.sin(a) * 0.8, 1.45, Math.cos(a) * 0.8, cabeza, 4); }); }
  if(p.caraAcc === 'anteojos' || p.caraAcc === 'sol'){ const c = p.caraAcc === 'sol' ? '#12161F' : '#2A1B12'; [-0.4, 0.4].forEach(x => p3Caja(0.6, 0.42, 0.1, c, x, 0.18, 0.98, cabeza)); p3Caja(0.2, 0.08, 0.1, c, 0, 0.2, 0.98, cabeza); }
  if(p.caraAcc === 'bigote') p3Caja(0.9, 0.15, 0.1, '#2A1B12', 0, -0.2, 0.96, cabeza);
  if(p.caraAcc === 'auriculares'){ [-1, 1].forEach(l => p3Caja(0.3, 0.7, 0.5, '#E5484D', l * 1.05, 0.1, 0, cabeza)); p3Caja(2.2, 0.15, 0.2, '#2B3A67', 0, 1.05, 0, cabeza); }
  // sombra redonda en el piso
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(1.1, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.04; g.add(sombra);
  const extras = new THREE.Group(); g.add(extras);
  g.userData = { cuerpo, piernas, brazos, cabeza, sombra, ojos, boca, extras, firma: JSON.stringify(p) };
  return g;
}


// ---- Piezas nuevas: banco, micro, decorados de cada parada, fusión de piezas ----
const P3_NULO = new Proxy(function(){}, { get: () => P3_NULO, apply: () => P3_NULO, set: () => true });
const P3_CAM = [{ n: 'Normal', d: 20, a: 24 }, { n: 'Cerca', d: 12, a: 14 }, { n: 'Arriba', d: 4, a: 46 }, { n: 'Sigue', d: 20, a: 22, auto: true }];

// Mancha de luz redonda y suave para los faroles (sin textura se veían cuadrados).
function p3TexGlow(){ if(p3.texGlow) return p3.texGlow; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (p3.texGlow = new THREE.CanvasTexture(c)); }

function p3Banco(bx, bz, id){
  const g = new THREE.Group(); g.position.set(bx, 0, bz); g.scale.set(1.5, 1.5, 1.5);
  p3Caja(8.2, 0.45, 1.8, '#E0A04C', 0, 1.5, 0, g); p3Caja(8.2, 1.7, 0.4, '#C0752B', 0, 2.6, -0.95, g); [-3.6, 3.6].forEach(dx => p3Caja(0.5, 1.5, 1.6, '#6A4422', dx, 0.75, 0, g));
  p3.escena.add(g);
  if(id){ p3Zona(id, bx, bz, 7.4, 0, true); const ic = p3Etiqueta('🪑', { tam: 34, fondo: 'rgba(255,255,255,.4)', escala: 24 }); ic.position.set(bx, 6.4, bz); p3.escena.add(ic); }
}

// El micro de Busmac estacionado en la parada, con el logo y las balizas que parpadean.
function p3Micro(x, z){
  const g = new THREE.Group(); g.position.set(x, 0, z);
  p3Caja(3.6, 3.4, 14, '#F2F4F8', 0, 2.9, 0, g); p3Caja(3.64, 0.9, 14.02, '#0F2A4D', 0, 1.6, 0, g); p3Caja(3.66, 0.25, 14.04, '#E6A817', 0, 2.2, 0, g); p3Caja(3.3, 0.3, 13.6, '#D5DAE3', 0, 4.75, 0, g);
  for(let i = 0; i < 5; i++) [-1, 1].forEach(l => p3Caja(0.06, 1.2, 1.9, '#1d2a3a', l * 1.84, 3.5, -5.2 + i * 2.6, g));
  p3Caja(3.0, 1.5, 0.06, '#1d2a3a', 0, 3.5, 7.02, g); p3Caja(2.4, 0.5, 0.06, '#0b1a30', 0, 4.4, 7.04, g);
  [-1, 1].forEach(l => { const f = p3Caja(0.7, 0.45, 0.1, '#ffffff', l * 1.2, 1.2, 7.05, g); f.material = new THREE.MeshBasicMaterial({ color: 0xFFF3B0 }); });
  [[-1, 4.6], [1, 4.6], [-1, -4.6], [1, -4.6]].forEach(([l, dz]) => { const w = p3Cil(0.9, 0.9, 0.7, 8, '#14161c', l * 1.8, 0.9, dz, g); w.rotation.z = Math.PI / 2; const r = p3Cil(0.45, 0.45, 0.72, 6, '#9aa2ae', l * 1.8, 0.9, dz, g); r.rotation.z = Math.PI / 2; });
  if(typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){ const tl = new THREE.Texture(ARC_LOGO); tl.needsUpdate = true; [-1, 1].forEach(l => { const lg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: tl, transparent: true })); lg.position.set(l * 1.86, 1.62, 1.5); lg.rotation.y = l * Math.PI / 2; g.add(lg); }); }
  const luces = [-1, 1].map(l => { const b = p3Esf(0.22, '#FFB000', l * 1.5, 4.9, 6.9, g, 5); b.material = new THREE.MeshBasicMaterial({ color: 0xFFB000 }); return b; });
  p3.anim.push(t => { const on = Math.sin(t * 6) > 0; luces[0].visible = on; luces[1].visible = !on; });
  p3.escena.add(g);
  const et = p3Etiqueta('🚌 Tu micro', { tam: 24, escala: 30 }); et.position.set(x, 7.2, z); p3.escena.add(et);
}

function p3Arcade(e, w, d, cx, cz, abajo){
  const lado = abajo ? 1 : -1, fz = cz + lado * d * 0.25, col = e.color || '#7E57FF';
  p3Caja(w * 0.72, 3.4, d * 0.5, '#1c2040', cx, 1.7, cz); p3Caja(w * 0.72, 1.3, d * 0.5, col, cx, 4.5, cz);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.58, 2.2), new THREE.MeshBasicMaterial({ color: p3Mezcla(col, '#ffffff', 0.35).getHex() })); pantalla.position.set(cx, 3.4, fz + lado * 0.06); pantalla.rotation.x = -0.3 * lado; if(!abajo) pantalla.rotation.y = Math.PI; p3.escena.add(pantalla);
  p3Caja(w * 0.62, 0.35, 1.3, '#2a2f55', cx, 2.2, fz + lado * 0.7);
  p3Esf(0.28, '#E5484D', cx - w * 0.15, 2.7, fz + lado * 0.7, null, 5); [0, 1, 2].forEach(i => p3Esf(0.2, ['#FFD84D', '#4FB8FF', '#5BE88D'][i], cx + w * 0.08 + i * 0.6, 2.5, fz + lado * 0.7, null, 5));
}

function p3Decor(s){
  const K = P3.K, W = PLZ.W * K, H = PLZ.H * K;
  const globo = (x, z, c, i) => { const g = new THREE.Group(); g.position.set(x, 9, z); p3Esf(1.5, c, 0, 0, 0, g, 7); p3Caja(0.06, 5, 0.06, '#ffffff', 0, -3.4, 0, g); p3.escena.add(g); p3.anim.push(t => { g.position.y = 9 + Math.sin(t * 0.8 + i) * 0.8; g.rotation.y = t * 0.3; }); };
  if(s.id === 'shopping'){
    [[6, 23.5, '#FF5E8A'], [58, 26.5, '#4FB8FF'], [30, 25, '#FFD84D'], [45, 23, '#5BE88D']].forEach(([x, z, c], i) => globo(x, z, c, i));
    p3Banco(15, 24.5, null); p3Banco(49, 24.5, null);
    [[32, 24.5], [4, 27], [60, 27]].forEach(([x, z]) => { p3Cil(1.5, 1.2, 1.8, 7, '#B8654A', x, 0.9, z); p3Esf(1.6, '#3E9B4F', x, 2.8, z, null, 7); [[-0.6, 0.4], [0.7, 0.2], [0, -0.6]].forEach(([dx, dz], i) => p3Esf(0.3, ['#FF5A7A', '#FFD84D', '#ffffff'][i], x + dx, 3.7, z + dz, null, 4)); });
  } else if(s.id === 'arcade'){
    const franjas = [[2.4, H / 2, 0.5, H - 6, 0x22E6FF], [W - 2.4, H / 2, 0.5, H - 6, 0xFF3DBE], [W / 2, 2.4, W - 6, 0.5, 0x7E57FF], [W / 2, H - 2.4, W - 6, 0.5, 0x22E6FF]].map(([x, z, w, d, c]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 })); m.position.set(x, 0.12, z); p3.escena.add(m); return m; });
    p3.anim.push(t => { franjas.forEach((m, i) => { m.material.opacity = 0.55 + 0.4 * Math.sin(t * 3 + i * 1.6); }); });
  } else if(s.id === 'mesas'){
    PLZ_EDIFICIOS.filter(e => e.mesa).forEach(e => { const cx = (e.x + e.w / 2) * K, cz = (e.y + 68) * K; p3Cil(0.05, 0.05, 9, 4, '#222', cx, 12.5, cz); p3Cono(1.6, 1.1, '#E6A817', cx, 8.2, cz, null, 8); const b = p3Esf(0.5, '#fff6c0', cx, 7.4, cz, null, 5); b.material = new THREE.MeshBasicMaterial({ color: 0xFFF3B0 }); });
  } else if(s.id === 'eventos'){
    p3Caja(27.2, 1.0, 12, '#8A5A30', 48, 0.5, 26); p3Caja(27.2, 0.2, 12.2, '#C0752B', 48, 1.05, 26);
    const c = document.createElement('canvas'); c.width = 400; c.height = 160; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c);
    let ultimo = null; const pintar = () => { const b = typeof mundoTextoBingo === 'function' ? mundoTextoBingo() : ''; if(b === ultimo) return; ultimo = b; x.fillStyle = '#1B1B2F'; x.fillRect(0, 0, 400, 160); x.strokeStyle = '#FFD84D'; x.lineWidth = 8; x.strokeRect(6, 6, 388, 148); x.textAlign = 'center'; x.fillStyle = '#FFD84D'; x.font = '800 30px Poppins, sans-serif'; x.fillText('🎱 PRÓXIMO BINGO', 200, 50); x.fillStyle = '#fff'; x.font = '800 ' + (b && b.length > 8 ? 36 : 56) + 'px Poppins, sans-serif'; x.fillText(b || 'A confirmar', 200, 112); tex.needsUpdate = true; };
    pintar(); const cartel = new THREE.Mesh(new THREE.PlaneGeometry(18, 7.2), new THREE.MeshBasicMaterial({ map: tex })); cartel.position.set(48, 6.4, 20.4); cartel.rotation.x = -0.25; p3.escena.add(cartel); cartel.userData.vivo = true;
    p3.anim.push(t => { if(Math.floor(t) !== p3.bingoT){ p3.bingoT = Math.floor(t); pintar(); } });
    [-1, 1].forEach((l, i) => { const g = new THREE.Group(); g.position.set(48 + l * 12, 14, 24); const cono = new THREE.Mesh(new THREE.ConeGeometry(2.4, 14, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF0A0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); cono.position.y = -7; g.add(cono); p3.escena.add(g); p3.anim.push(t => { g.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.35; g.rotation.x = Math.cos(t * 0.7 + i) * 0.2; }); });
  } else if(s.id === 'boliche'){
    const colores = [0xFF4DDB, 0x4DD9FF, 0xFFD84D, 0x7E57FF, 0x5BE88D]; const baldosas = [];
    for(let i = 0; i < 6; i++) for(let j = 0; j < 4; j++){ const m = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), new THREE.MeshBasicMaterial({ color: colores[(i + j) % 5], transparent: true, opacity: 0.7 })); m.rotation.x = -Math.PI / 2; m.position.set(15.8 + i * 5.6, 0.1, 23.2 + j * 5.6); p3.escena.add(m); baldosas.push(m); }
    p3.anim.push(t => { baldosas.forEach((m, k) => { m.material.color.setHex(colores[(Math.floor(t * 2.2) + k + Math.floor(k / 6)) % 5]); m.material.opacity = 0.45 + 0.35 * Math.sin(t * 5 + k); }); });
    const bola = new THREE.Group(); bola.position.set(32, 13, 35); const bs = p3Esf(2.2, '#d6dcec', 0, 0, 0, bola, 8); bs.material = new THREE.MeshBasicMaterial({ color: 0xd6dcec }); p3Cil(0.05, 0.05, 6, 4, '#555', 0, 4, 0, bola); p3.escena.add(bola); bola.userData.vivo = true;
    p3.anim.push(t => { bola.rotation.y = t * 0.9; });
    [0, 1, 2].forEach(i => { const g = new THREE.Group(); g.position.set(32, 16, 35); const cono = new THREE.Mesh(new THREE.ConeGeometry(2.6, 16, 10, 1, true), new THREE.MeshBasicMaterial({ color: colores[i], transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); cono.position.y = -8; g.add(cono); p3.escena.add(g); p3.anim.push(t => { g.rotation.z = Math.sin(t * 1.3 + i * 2.1) * 0.7; g.rotation.x = Math.cos(t * 1.1 + i * 1.7) * 0.7; }); });
    p3Caja(14, 3, 4.6, '#2a1f4a', 32, 1.5, 14); const t1 = p3Caja(12, 0.3, 3.4, '#ffffff', 32, 3.1, 14); t1.material = new THREE.MeshBasicMaterial({ color: 0xFF4DDB }); p3Etiqueta('🎧', { tam: 34, fondo: 'rgba(255,255,255,.4)', escala: 24 }); { const ic = p3Etiqueta('🎧', { tam: 34, fondo: 'rgba(255,255,255,.4)', escala: 24 }); ic.position.set(32, 6, 14); p3.escena.add(ic); }
    p3Caja(16, 3.4, 4.6, '#6a4422', 53, 1.7, 16); [0, 1, 2, 3].forEach(i => p3Cil(0.28, 0.28, 1.2, 5, ['#4FB8FF', '#FFB347', '#5BE88D', '#FF5E8A'][i], 47 + i * 2.4, 4.1, 16)); { const ic = p3Etiqueta('🍹', { tam: 34, fondo: 'rgba(255,255,255,.4)', escala: 24 }); ic.position.set(53, 6.4, 16); p3.escena.add(ic); }
  } else if(s.id === 'seleccion'){
    for(let i = 0; i < 8; i++) p3Caja(8, 14, 0.4, i % 2 ? '#ffffff' : '#74ACDF', 4 + i * 8, 7, 1.2);
    p3Cil(2.2, 2.6, 2.2, 8, '#d8d8d8', 32, 1.1, 36); const copa = new THREE.Group(); copa.position.set(32, 2.2, 36); p3Cil(0.5, 0.7, 1.2, 8, '#FFD84D', 0, 0.6, 0, copa); p3Cil(1.5, 0.6, 2.4, 8, '#FFD84D', 0, 2.4, 0, copa); [-1, 1].forEach(l => { p3Caja(0.3, 1.4, 0.3, '#FFD84D', l * 1.7, 2.8, 0, copa); }); p3Esf(0.7, '#FFD84D', 0, 4.2, 0, copa, 6); p3.escena.add(copa); copa.userData.vivo = true;
    p3.anim.push(t => { copa.rotation.y = t * 0.8; copa.position.y = 2.2 + Math.sin(t * 2) * 0.12; });
    { const ic = p3Etiqueta('🏆', { tam: 40, fondo: 'rgba(255,255,255,.4)', escala: 22 }); ic.position.set(32, 9, 36); p3.escena.add(ic); }
  }
}

// Junta las piezas fijas del mismo color en una sola (así el celular dibuja unas pocas decenas de cosas en vez de cientos).
function p3Fusionar(){
  const esc = p3.escena; esc.updateMatrixWorld(true);
  const grupos = {}, quitar = [];
  esc.children.forEach(m => {
    if(!m.isMesh || m.userData.vivo || !m.material || m.material.map || m.material.transparent || !(m.material.isMeshLambertMaterial || m.material.isMeshBasicMaterial)) return;
    const k = (m.material.isMeshBasicMaterial ? 'b' : 'l') + m.material.color.getHex();
    (grupos[k] = grupos[k] || []).push(m);
  });
  Object.keys(grupos).forEach(k => {
    const lista = grupos[k]; if(lista.length < 2) return;
    const pos = [], nor = [];
    lista.forEach(m => {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
      const a = g.attributes.position.array, n = g.attributes.normal ? g.attributes.normal.array : null;
      for(let i = 0; i < a.length; i++){ pos.push(a[i]); nor.push(n ? n[i] : 0); }
      g.dispose(); quitar.push(m);
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    esc.add(new THREE.Mesh(geo, lista[0].material));
  });
  quitar.forEach(m => { esc.remove(m); if(m.geometry) m.geometry.dispose(); });
}

// ---- Escena ----
function p3Limpiar(){
  if(!p3.escena) return;
  while(p3.escena.children.length) p3.escena.remove(p3.escena.children[0]);
  p3.avatares = {}; p3.anim = []; p3.zonas = []; p3.faroles = []; p3.carteles = {}; p3.nubes = []; p3.destino = null;
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

function p3TexTejas(base){
  const clave = 'tejas|' + base;
  if(p3.etiquetas[clave]) return p3.etiquetas[clave];
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  for(let f = 0; f < 8; f++){ for(let i = 0; i < 8; i++){ const ox = (f % 2) * 8, px = i * 16 + ox; x.fillStyle = 'rgba(0,0,0,' + (0.05 + ((i * 7 + f * 3) % 5) * 0.03) + ')'; x.fillRect(px, f * 16, 15, 14); x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(px, f * 16, 15, 3); } x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, f * 16 + 14, 128, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; p3.etiquetas[clave] = t; return t;
}
function p3TexAdoquin(base){
  const clave = 'adoq|' + base;
  if(p3.etiquetas[clave]) return p3.etiquetas[clave];
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = p3Mezcla(base, '#000000', 0.28).getStyle(); x.fillRect(0, 0, 128, 128);
  const col = p3Color(base);
  for(let f = 0; f < 7; f++){ for(let i = 0; i < 7; i++){ const px = i * 19 + (f % 2) * 9 - 4, py = f * 19; const v = ((i * 13 + f * 29) % 7) / 7; x.fillStyle = col.clone().multiplyScalar(0.86 + v * 0.22).getStyle(); x.beginPath(); if(x.roundRect) x.roundRect(px + 1, py + 1, 17, 17, 5); else x.rect(px + 1, py + 1, 17, 17); x.fill(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; p3.etiquetas[clave] = t; return t;
}
function p3Maceta(x, z){
  p3Cil(0.5, 0.38, 0.8, 7, '#C0603A', x, 0.4, z); p3Esf(0.62, '#3E9B4F', x, 1.2, z, null, 6);
  [[-0.3, 0.1], [0.3, 0.2], [0, -0.3]].forEach(([dx, dz], i) => p3Esf(0.16, ['#FF5A7A', '#FFD84D', '#ffffff'][i], x + dx, 1.5, z + dz, null, 4));
}
function p3Farol(x, z){
  p3Cil(0.14, 0.2, 4.4, 5, '#2b2f3a', x, 2.2, z); p3Caja(0.9, 0.12, 0.12, '#2b2f3a', x + 0.4, 4.4, z);
  const lamp = p3Caja(0.5, 0.7, 0.5, '#FFD98A', x + 0.8, 4.2, z); lamp.material = new THREE.MeshBasicMaterial({ color: 0xFFE3A0 });
  p3Cono(0.45, 0.35, '#2b2f3a', x + 0.8, 4.7, z, null, 4);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: p3TexGlow(), color: 0xFFC860, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(5, 5, 1); glow.position.set(x + 0.8, 4.2, z); p3.escena.add(glow); p3.faroles.push(glow);
}

function p3Edificio(e, s){
  const x = e.x * P3.K, z = e.y * P3.K, w = e.w * P3.K, d = e.h * P3.K, abajo = e.lado !== 'arriba';
  const cx = x + w / 2, cz = z + d / 2;
  if(e.mesa){ // mesa redonda con sillas
    p3Cil(3.2, 3.2, 1.3, 10, '#2f7d4f', cx, 0.65, cz); p3Cil(3.4, 3.4, 0.2, 10, '#8a5a30', cx, 1.35, cz);
    for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3; p3Caja(1.1, 1.1, 1.1, '#6a4422', cx + Math.sin(a) * 4.4, 0.55, cz + Math.cos(a) * 4.4); }
    p3Zona(e.id, cx, cz, 6.4, 0, true); const et = p3Etiqueta(e.emoji + ' ' + e.nombre, { tam: 26, escala: 26 }); et.position.set(cx, 5.4, cz); p3.escena.add(et); return;
  }
  const arcade = s.id === 'arcade' && e.compacto;
  const casa = !e.puesto && !e.padel && !e.neon && !e.sel && !arcade;       // las casas llevan techo de tejas a dos aguas
  const alto = e.padel ? 5 : e.puesto ? 4.4 : e.compacto ? 5.6 : 7.2;
  let color = e.color || '#888';
  if(e.neon) color = '#17102e'; if(e.sel) color = '#c8e3f7';
  if(arcade) p3Arcade(e, w, d, cx, cz, abajo); else p3Caja(w, alto, d, color, cx, alto / 2, cz);
  if(casa){
    p3Caja(w + 0.3, 0.9, d + 0.3, p3Mezcla(color, '#6a5a4a', 0.55).getStyle(), cx, 0.45, cz);                         // zócalo de piedra
    const rh = 3.4, teja = p3Mezcla(color, '#B4552E', 0.72).getStyle();
    const tex = p3TexTejas(teja).clone(); tex.needsUpdate = true; tex.repeat.set(4, 2);
    const techo = new THREE.Mesh(p3Plano(new THREE.ConeGeometry(1, rh, 4)), new THREE.MeshLambertMaterial({ map: tex })); techo.rotation.y = Math.PI / 4; techo.scale.set((w + 1) / Math.SQRT2, 1, (d + 1) / Math.SQRT2); techo.position.set(cx, alto + rh / 2, cz); p3.escena.add(techo);
    p3Caja(w + 1.1, 0.35, d + 1.1, p3Mezcla(color, '#000000', 0.5).getStyle(), cx, alto + 0.1, cz);
  } else if(!arcade) p3Caja(w + 0.6, 0.6, d + 0.6, p3Mezcla(color, '#000000', 0.35).getStyle(), cx, alto + 0.3, cz);
  const fz = abajo ? z + d : z;
  const lado = abajo ? 1 : -1;
  if(e.neon){ [[alto - 0.8, 0xff4ddb], [1.0, 0x4dd9ff]].forEach(([yy, col]) => { const b = p3Caja(w * 0.9, 0.35, 0.2, '#ffffff', cx, yy, fz + lado * 0.12); b.material = new THREE.MeshBasicMaterial({ color: col }); }); }
  if(e.sel){ [0, 1, 2].forEach(i => p3Caja(w / 6, alto, d + 0.1, '#74ACDF', x + w / 6 + i * w / 3, alto / 2, cz)); }
  if(e.padel){
    p3Caja(w - 2, 0.15, d - 2, '#2E6FD0', cx, alto + 0.7, cz); p3Caja(0.2, 0.2, d - 2.4, '#ffffff', cx, alto + 0.85, cz); p3Caja(w - 2.4, 0.2, 0.2, '#ffffff', cx, alto + 0.85, cz);
    const bola = p3Esf(0.5, '#D9F236', cx, alto + 1.6, cz, null, 6); bola.userData.vivo = true; p3.anim.push(t => { bola.position.x = cx + Math.sin(t * 1.8) * (w / 2 - 3); bola.position.y = alto + 1.6 + Math.abs(Math.sin(t * 3.6)) * 1.6; });
  }
  // puerta con marco, escalón y macetas
  if(!arcade){
  p3Caja(3, 3.7, 0.3, e.neon ? '#ff4ddb' : '#3A2418', cx, 1.85, fz + lado * 0.08);
  p3Caja(2.2, 3.2, 0.3, e.neon ? '#ff9ae9' : '#8A5A32', cx, 1.6, fz + lado * 0.2);
  p3Caja(3.4, 0.25, 1.4, '#9a9488', cx, 0.12, fz + lado * 0.9);
  }
  if(e.puesto){ for(let i = 0; i < 6; i++) p3Caja(w / 6, 0.25, 2.4, i % 2 ? '#ffffff' : p3Mezcla(color, '#000000', 0.2).getStyle(), x + w / 12 + i * w / 6, 3.4 - 0.2, fz + lado * 1.0).rotation.x = abajo ? 0.25 : -0.25; }
  if(casa){
    p3Maceta(cx - 2.6, fz + lado * 1.1); p3Maceta(cx + 2.6, fz + lado * 1.1);
    { // toldo rayado sobre la puerta y faroles de pared
      const tc = ['#C0392B', '#2E8A5A', '#2F63B8', '#E6A817'][(Math.floor(e.x / 7) + Math.floor(e.y / 11)) % 4];
      for(let i = 0; i < 4; i++) p3Caja(0.95, 0.12, 1.9, i % 2 ? '#ffffff' : tc, cx - 1.42 + i * 0.95, 4.0, fz + lado * 1.0).rotation.x = lado * 0.35;
      [-1, 1].forEach(l => { const lm = p3Caja(0.35, 0.55, 0.35, '#FFE3A0', cx + l * 2.7, 3.0, fz + lado * 0.35); lm.material = new THREE.MeshBasicMaterial({ color: 0xFFE3A0 }); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: p3TexGlow(), color: 0xFFC860, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.set(2.8, 2.8, 1); gl.position.set(cx + l * 2.7, 3.0, fz + lado * 0.6); p3.escena.add(gl); p3.faroles.push(gl); });
    }
    [-0.3, 0.3].forEach(k => {   // ventanas con marco y postigos
      const vx = cx + w * k, vy = alto * 0.62, vz = fz + lado * 0.12;
      p3Caja(2.6, 2.8, 0.25, '#5A3A22', vx, vy, vz); const v = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.3), new THREE.MeshBasicMaterial({ color: 0xA9D8FF })); v.position.set(vx, vy, vz + lado * 0.14); if(!abajo) v.rotation.y = Math.PI; p3.escena.add(v);
      p3Caja(0.12, 2.3, 0.1, '#5A3A22', vx, vy, vz + lado * 0.16); p3Caja(2.1, 0.12, 0.1, '#5A3A22', vx, vy, vz + lado * 0.16);
      [-1, 1].forEach(l => p3Caja(0.8, 2.8, 0.15, p3Mezcla(color, '#1a3a2a', 0.65).getStyle(), vx + l * 1.7, vy, vz + lado * 0.08));
      p3Caja(2.9, 0.25, 0.7, '#8A7A68', vx, vy - 1.55, vz + lado * 0.4);
      if(alto >= 7){ p3Caja(3.4, 0.22, 1.3, '#8A7A68', vx, vy - 1.7, vz + lado * 0.75); p3Caja(3.4, 0.12, 0.12, '#3a2a1a', vx, vy - 1.0, vz + lado * 1.35); [-1.6, 0, 1.6].forEach(dx => p3Caja(0.1, 0.7, 0.1, '#3a2a1a', vx + dx, vy - 1.3, vz + lado * 1.35)); }
    });
  }
  // cartel grande y legible, inclinado hacia la cámara (en las casas, apoyado en el techo)
  p3Zona(e.id, cx, fz + lado * 2.8, Math.min(8, w * 0.7), 4.2, false);
  const anchoCartel = Math.min(w * 1.0, 13.5), cartel = p3Cartel(e, e.neon ? '#7E2DBB' : (e.sel ? '#4A8FC4' : color), anchoCartel);
  const gc = new THREE.Group();
  if(casa){ const rh = 3.4, pend = Math.atan2(rh, d / 2 + 0.5), t = 0.4; gc.position.set(cx, alto + t * rh + 0.5, z + d + 0.5 - t * (d / 2 + 0.5)); cartel.rotation.x = -(Math.PI / 2 - pend); }
  else { gc.position.set(cx, alto + 0.6 + anchoCartel * 0.2, z + d - 0.3); cartel.rotation.x = -0.87; [-1, 1].forEach(l => p3Caja(0.25, anchoCartel * 0.24 + 0.4, 0.25, '#3a3a44', cx + l * anchoCartel * 0.36, alto + anchoCartel * 0.1 + 0.4, z + d - 0.3)); }
  gc.add(cartel); p3.escena.add(gc); p3.carteles[e.id] = gc;
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
  if(f){ const fx = f.x * P3.K, fz = f.y * P3.K, r = f.r * P3.K; p3Cil(r, r + 0.3, 1.0, 12, '#B8C2D1', fx, 0.5, fz); const agua = p3Cil(r - 0.8, r - 0.8, 0.1, 12, '#6AC2FF', fx, 1.0, fz); p3Cil(0.5, 0.7, 3.2, 6, '#C7CEDA', fx, 1.8, fz); const anillo = p3Cil(1, 1, 0.08, 10, '#ffffff', fx, 1.12, fz); anillo.material.transparent = true; anillo.userData.vivo = true; p3.anim.push(t => { const k = 0.4 + (t * 0.5) % 1 * 2.2; anillo.scale.set(k, 1, k); anillo.material.opacity = 1 - (k - 0.4) / 2.2; }); }
  [[26, 200], [614, 200], [26, 280], [614, 280], [26, 400], [614, 400], [26, 470], [614, 470], [120, 210], [540, 210], [90, 500], [560, 505]].forEach(([x, y], i) => p3Arbol(x * P3.K, y * P3.K, (i * 37) % 10 / 10));
  // bancos
  [[96, 452, 'banco1'], [506, 452, 'banco2']].forEach(([x, y, id]) => p3Banco((x + 17) * P3.K, y * P3.K, id));
  // hamacas
  const hx = 6, hz = 29; [0, 1].forEach(i => { const px = i ? 20.5 : 5.5; p3Caja(0.4, 8.5, 0.4, '#8A5A2B', px, 4.2, hz).rotation.z = i ? -0.15 : 0.15; p3Caja(0.4, 8.5, 0.4, '#8A5A2B', px, 4.2, hz + 3).rotation.z = i ? -0.15 : 0.15; });
  p3Caja(15.4, 0.4, 0.4, '#8A5A2B', 13, 8.4, hz + 0); p3Caja(15.4, 0.4, 0.4, '#8A5A2B', 13, 8.4, hz + 3);
  [7.8, 12.4, 17].forEach((x, i) => { const g = new THREE.Group(); g.position.set(x, 8.2, hz + 1.5); p3Caja(0.1, 6.2, 0.1, '#444', -0.9, -3.1, 0, g); p3Caja(0.1, 6.2, 0.1, '#444', 0.9, -3.1, 0, g); p3Caja(2.2, 0.35, 1.2, '#E5586E', 0, -6.2, 0, g); p3.escena.add(g); p3.anim.push(t => { g.rotation.x = Math.sin(t * 1.2 + i) * 0.12; }); });
  // cama elástica
  const tx = 50, tz = 32.8; p3Cil(7, 7.2, 0.9, 14, '#FFD84D', tx, 0.45, tz); p3Cil(7.2, 7.2, 0.25, 14, '#E5484D', tx, 0.95, tz); const tela = p3Cil(6.1, 6.1, 0.15, 14, '#2B3A67', tx, 1.06, tz); tela.userData.vivo = true;
  [0, 1, 2].forEach(i => { const b = p3Caja(12, 0.05, 0.4, '#ffffff', tx, 1.16, tz); b.rotation.y = i * Math.PI / 3; });
  if(typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){ const tl = new THREE.Texture(ARC_LOGO); tl.needsUpdate = true; const lg = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: tl, transparent: true })); lg.rotation.x = -Math.PI / 2; lg.position.set(tx, 1.2, tz); p3.escena.add(lg); }
  p3.anim.push(t => { tela.position.y = 1.06 + Math.max(0, Math.sin(t * 5)) * 0.14; }); p3Zona('trampolin', tx, tz, 8.4, 0, true);
  [['🤸', tx, 5.6, tz], ['🛝', 13, 11.2, 31], ['⚖️', 32, 5.2, 25], ['🪙', 32, 6.6, 34]].forEach(([em, x, y, z]) => { const ic = p3Etiqueta(em, { tam: 34, fondo: 'rgba(255,255,255,.4)', escala: 24 }); ic.position.set(x, y, z); p3.escena.add(ic); });
  p3Zona('hamacas', 13, 30.5, 10, 0, true); p3Zona('subibaja', 32, 25, 9, 0, true); p3Zona('fuente', 32, 34, 7.6, 0, true);
  // subibaja
  const sb = new THREE.Group(); sb.position.set(32, 1.2, 25); p3Cono(0.9, 1.6, '#8A5A2B', 0, -0.4, 0, null, 4); const tabla = p3Caja(11.6, 0.5, 1.6, '#E5586E', 0, 0, 0, sb); p3.escena.add(sb); p3.anim.push(() => { tabla.rotation.z = (plz.sbS || 0) / 58 * 0.9; });
  // parada del micro
  p3Caja(0.3, 5, 0.3, '#5b6673', 32, 2.5, 52.8); p3Caja(4.8, 2.4, 0.3, '#0F2A4D', 32, 5.2, 52.8);
  const et = p3Etiqueta('🚌 MICRO'); et.position.set(32, 7.4, 52.8); p3.escena.add(et);
  p3Micro(32, 61);
  // flores
  [[240, 410], [400, 410], [215, 250], [430, 240], [270, 485], [372, 485]].forEach(([x, y], i) => { p3Cil(0.06, 0.06, 0.8, 4, '#3a8a3a', x * P3.K, 0.4, y * P3.K); p3Esf(0.35, i % 2 ? '#FFE066' : '#FF7AA8', x * P3.K, 0.9, y * P3.K, null, 5); });
}

function p3Construir(){
  p3Limpiar();
  const s = PLZ_SECTOR, W = PLZ.W * P3.K, H = PLZ.H * P3.K;
  p3.sector = s.id;
  p3Luces();
  p3.escena.background = p3Color(s.parque ? '#8fd0ff' : s.fuera); p3.escena.fog = new THREE.Fog(p3.escena.background.getHex(), 70, 150);
  const tAd = p3TexAdoquin(p3Mezcla(s.suelo, '#8a7a6a', s.parque ? 0.18 : 0.3).getStyle()).clone(); tAd.needsUpdate = true; tAd.repeat.set(W / 8, H / 8); const suelo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: tAd })); suelo.rotation.x = -Math.PI / 2; suelo.position.set(W / 2, 0, H / 2); p3.escena.add(suelo);
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
    if(a.pose === 3 && a.zona){ p3Caja(a.zona.w * P3.K * 0.9, 1.2, a.zona.h * P3.K * 0.6, '#8A5A2B', (a.zona.x + a.zona.w / 2) * P3.K, 0.6, (a.zona.y + a.zona.h / 2) * P3.K); }
    if(!a.zona) return;
    p3Zona(a.id, (a.zona.x + a.zona.w / 2) * P3.K, (a.zona.y + a.zona.h / 2) * P3.K, Math.min(a.zona.w, a.zona.h) * P3.K * 0.5, 0, true);
    const et = p3Etiqueta(a.emoji, { tam: 34, fondo: 'rgba(255,255,255,.4)', escala: 24 }); et.position.set((a.zona.x + a.zona.w / 2) * P3.K, 4.2, (a.zona.y + a.zona.h / 2) * P3.K); p3.escena.add(et);
  });
  p3Decor(s);
  [[44, 150], [596, 150], [44, 340], [596, 340], [44, 520], [596, 520]].forEach(([fx, fy]) => { if(fy * P3.K < H - 4) p3Farol(fx * P3.K, fy * P3.K); });
  p3.destino = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 20), new THREE.MeshBasicMaterial({ color: 0xFFD84D, transparent: true, opacity: 0.9, depthWrite: false })); p3.destino.rotation.x = -Math.PI / 2; p3.destino.visible = false; p3.destino.userData.vivo = true; p3.escena.add(p3.destino);
  { const mg = new THREE.Group(); const an = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 20), new THREE.MeshBasicMaterial({ color: 0xFFD84D, side: THREE.DoubleSide })); an.rotation.x = -Math.PI / 2; an.position.y = 0.12; mg.add(an); const fl = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 4), new THREE.MeshBasicMaterial({ color: 0xFFD84D })); fl.rotation.x = Math.PI; fl.position.y = 9; mg.add(fl); mg.visible = false; p3.escena.add(mg); p3.marca = mg; }
  if(s.parque){ for(let i = 0; i < 6; i++){ const n = new THREE.Group(); [[0, 0, 4], [3.6, -0.6, 3.2], [-3.4, -0.4, 3], [1, 1.2, 3.2]].forEach(([x, y, r]) => { const b = p3Esf(r, '#ffffff', x, y, 0, n, 6); b.material.transparent = true; b.material.opacity = 0.92; }); n.position.set(i * 14 + 6, 40 + (i % 3) * 5, 8 + (i * 17) % 60); p3.escena.add(n); p3.nubes.push(n); } }
  p3Fusionar();
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

function p3Mover(a, x, y, nombre, caminando, pose, burbuja, fase, ex){
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
  // cara viva: parpadea y mueve la boca cuando habla
  const parpadeo = ((t * 0.9 + fase * 1.7) % 3.6) > 3.46;
  u.ojos.forEach(o => { o.scale.y = parpadeo ? 0.12 : 1; });
  u.boca.scale.y = burbuja ? 1 + Math.abs(Math.sin(t * 14)) * 2.6 : 1; u.boca.scale.x = burbuja ? 0.75 : 1;
  // torta de cumpleaños, bebidas y brindis
  const clave = ex ? [ex.cumple ? 1 : 0, ex.bebida || '', ex.brindis ? 1 : 0].join('|') : '';
  if(a.exClave !== clave){
    a.exClave = clave; while(u.extras.children.length) u.extras.remove(u.extras.children[0]);
    if(ex){
      const ic = (em, tam, esc, px, py, pz) => { const sp = p3Etiqueta(em, { tam, fondo: 'rgba(255,255,255,0)', escala: esc }); sp.position.set(px, py, pz); u.extras.add(sp); };
      if(ex.cumple) ic('🎂', 40, 22, 1.9, 4.9, 0); if(ex.bebida) ic(ex.bebida, 30, 26, -2.1, 3.0, 0.4); if(ex.brindis) ic('🥂', 46, 20, 0, 4.9, 0);
    }
  }
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
  p3Mover(yo, plz.yo.x, plz.yo.y, 'Vos', plz.caminando && !plz.pose, plz.pose ? plz.pose.p : 0, plz.burbuja && ahoraMs < plz.burbuja.hasta ? plz.burbuja.texto : null, 0, { cumple: typeof feria !== 'undefined' && !!feria.cumple, bebida: typeof bolicheBebidasEmoji === 'function' ? bolicheBebidasEmoji() : null, brindis: typeof bol !== 'undefined' && performance.now() < bol.brindis });
  // los demás
  Object.keys(plz.otros).forEach(k => {
    const o = plz.otros[k], a = p3Personaje('o' + k, o.avatar), caminando = Math.hypot(o.tx - o.x, o.ty - o.y) > 3;
    p3Mover(a, o.x, o.y, String(o.nombre).slice(0, 10), caminando && !o.p, o.p || 0, o.m != null && ahoraServidor - o.mt < 4500 ? PLZ_FRASES[o.m] : null, o.fase || 0, { cumple: !!o.cu, bebida: o.bb, brindis: !!(o.br && ahoraServidor - o.br < 2200) });
  });
  plz.bots.forEach((b, i) => { const a = p3Personaje('b' + i, b.a); p3Mover(a, b.x, b.y, b.n, b.caminando, b.pose || 0, b.m != null && ahoraMs < b.hasta ? PLZ_FRASES[b.m] : null, i); });
  Object.keys(p3.avatares).forEach(k => { const a = p3.avatares[k]; if(!a.vivo){ p3.escena.remove(a.g); delete p3.avatares[k]; } });
  p3.anim.forEach(f => f(p3.t));
  if(plz.buscado && typeof microDibujarBuscado === 'function') microDibujarBuscado(P3_NULO, ahoraMs);
  const bo = plz.buscado && plz.otros[plz.buscado.a];
  if(p3.marca){ p3.marca.visible = !!bo; if(bo){ p3.marca.position.set(bo.x * P3.K, 0, bo.y * P3.K); p3.marca.children[1].position.y = 9 + Math.abs(Math.sin(p3.t * 7)) * 0.7; const k = 1 + 0.12 * Math.sin(p3.t * 7); p3.marca.children[0].scale.set(k, k, k); } }
  const nochePct = p3Noche(); p3.faroles.forEach(g => { g.material.opacity = 0.18 + 0.75 * nochePct; });
  const cerca = plz.puerta ? plz.puerta.id : null;
  p3.zonas.forEach(z => { const on = cerca && z.id === cerca; z.mesh.material.opacity = z.base + (on ? 0.35 + 0.25 * Math.sin(p3.t * 7) : 0); const k = on ? 1 + 0.07 * Math.sin(p3.t * 7) : 1; z.mesh.scale.set(k, k, k); });
  Object.keys(p3.carteles).forEach(id => { const k = id === cerca ? 1.1 + 0.05 * Math.sin(p3.t * 7) : 1; p3.carteles[id].scale.set(k, k, k); });
  if(p3.destino){ if(plz.obj){ p3.destino.visible = true; p3.destino.position.set(plz.obj.x * P3.K, 0.1, plz.obj.y * P3.K); const k = 1 + 0.2 * Math.sin(p3.t * 8); p3.destino.scale.set(k, k, k); } else p3.destino.visible = false; }
  p3.nubes.forEach((n, i) => { n.position.x += dt * (1.2 + i * 0.15); if(n.position.x > PLZ.W * P3.K + 20) n.position.x = -20; });
  // cámara
  const tx = plz.yo.x * P3.K, tz = plz.yo.y * P3.K;
  if(!p3.mira) p3.mira = new THREE.Vector3(tx, 2, tz); else { p3.mira.x += (tx - p3.mira.x) * Math.min(1, dt * 6); p3.mira.z += (tz - p3.mira.z) * Math.min(1, dt * 6); }
  const cm = P3_CAM[p3.modo] || P3_CAM[0], dist = cm.d * p3.zoom, alto = cm.a * p3.zoom;
  if(cm.auto && plz.caminando && p3.avatares.yo){ let da = (p3.avatares.yo.rumbo + Math.PI) - p3.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); p3.yaw += da * Math.min(1, dt * 1.8); }
  const cx = p3.mira.x + Math.sin(p3.yaw) * dist, cz = p3.mira.z + Math.cos(p3.yaw) * dist;
  p3.cam.position.set(Math.max(-2, Math.min(PLZ.W * P3.K + 2, cx)), alto, cz); p3.cam.lookAt(p3.mira.x, 1.8, p3.mira.z - (cm.d < 6 ? 0.5 : 3));
  // luz de día o de noche
  const n = p3Noche();
  if(p3.luz){ p3.luz.intensity = 0.95 - 0.5 * n; p3.sol.intensity = 0.75 - 0.55 * n; }
  if(PLZ_SECTOR.parque){ const dia = p3Color('#8fd0ff'), noche = p3Color('#0a1030'); const c = dia.lerp(noche, n); p3.escena.background = c; if(p3.escena.fog) p3.escena.fog.color = c; }
}

function plaza3dFrame(dt){
  if(!p3.listo || !plz.modo3d) return;
  // Modo liviano: si el celular va lento, baja la resolución (se nota poco y rinde mucho más).
  if(!p3.fps.listo){ p3.fps.t += dt; p3.fps.n++; if(p3.fps.n >= 90){ p3.fps.listo = true; if(p3.fps.t / p3.fps.n > 0.04 && p3.r.getPixelRatio() > 1){ p3.r.setPixelRatio(1); p3.r.setSize(PLZ.VW, PLZ.VH, false); if(typeof mostrarToast === 'function') mostrarToast('Modo liviano: bajé un poco la calidad para que vaya más fluido'); } } }
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
    p3.mira = null; p3.yaw = 0; p3.t = 0; p3.fps = { t: 0, n: 0, listo: false };
    if(plz.canvas) plz.canvas.style.display = 'none';
    caja.appendChild(canvas);
    const bc = document.createElement('button'); bc.className = 'plz-b3cam'; bc.textContent = '🎥';
    bc.onclick = ev => { ev.stopPropagation(); p3.modo = (p3.modo + 1) % P3_CAM.length; bc.textContent = '🎥 ' + P3_CAM[p3.modo].n; clearTimeout(p3.tBtn); p3.tBtn = setTimeout(() => { bc.textContent = '🎥'; }, 1800); };
    caja.appendChild(bc); p3.btnCam = bc;
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
  if(p3.btnCam && p3.btnCam.parentNode) p3.btnCam.parentNode.removeChild(p3.btnCam); p3.btnCam = null;
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

// Tocar = caminar hasta ahí; arrastrar de costado = girar la cámara; pellizcar con dos dedos = acercar o alejar.
function plaza3dEntrada(canvas){
  const ptrs = new Map(); let ini = null, movido = false, ultimoX = 0, dist0 = 0;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', ev => {
    ev.preventDefault(); ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); try { canvas.setPointerCapture(ev.pointerId); } catch(e){}
    if(ptrs.size === 1){ ini = { x: ev.clientX, y: ev.clientY }; ultimoX = ev.clientX; movido = false; }
    else { movido = true; const [a, b] = Array.from(ptrs.values()); dist0 = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  canvas.addEventListener('pointermove', ev => {
    if(!ptrs.has(ev.pointerId)) return;
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if(ptrs.size >= 2){ const [a, b] = Array.from(ptrs.values()), d = Math.hypot(a.x - b.x, a.y - b.y); if(dist0 > 0 && d > 0){ p3.zoom = Math.max(0.55, Math.min(1.8, p3.zoom * dist0 / d)); dist0 = d; } return; }
    if(!ini) return;
    if(Math.hypot(ev.clientX - ini.x, ev.clientY - ini.y) > 8) movido = true;
    if(movido){ p3.yaw -= (ev.clientX - ultimoX) * 0.012; ultimoX = ev.clientX; }
  });
  const soltar = ev => {
    const eraUno = ptrs.size === 1; ptrs.delete(ev.pointerId);
    if(eraUno && ini && !movido && ev.type === 'pointerup'){
      const r = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, p3.cam);
      const o = rc.ray.origin, d = rc.ray.direction;
      if(d.y < -0.01){ const t = -o.y / d.y; plz.obj = { x: (o.x + d.x * t) / P3.K, y: (o.z + d.z * t) / P3.K }; plz.ultimaActividad = performance.now(); if(plz.buscado) plz.buscado.sigue = false; }
    }
    if(!ptrs.size) ini = null;
  };
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
}
