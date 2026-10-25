// Plaza en 3D: el mismo mundo de la plaza (mismas paradas, gente, puertas y movimiento) pero visto en tres dimensiones, con el
// "estilo Bus Coin": piso con el mismo dibujo del 2D, piezas redondeadas con contorno, y personajes con la cara, el pelo y la ropa
// de cada jugador (ver plaza3dmod.js). No cambia nada del juego: el movimiento, las salas, los demás pasajeros y las puertas
// siguen saliendo de plaza.js; esto solo los dibuja distinto y suma choques (bancos, árboles, hamacas...) y alturas (cama elástica,
// escenario) que solo existen en 3D. Se activa con el botón 🧊 3D de la plaza y se puede volver al 2D.
//
// Medidas: 1 unidad 3D = 10 píxeles de la plaza 2D (x → X, y → Z).

const P3 = { THREE_URL: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', K: 0.1 };
const p3 = { listo: false, r: null, escena: null, cam: null, canvas: null, avatares: {}, etiquetas: {}, yaw: 0, mira: null, anim: [], t: 0, luz: null, sol: null, sector: '', zonas: [], faroles: [], carteles: {}, destino: null, nubes: [], modo: 0, zoom: 1, marca: null, btnCam: null, sombras: [], solidos: [], plat: [], hamacas: [], cielo: null, nochePrev: -1, luzQuads: [], luzMesh: null, matVentana: null, brillosN: [], estrellas: null, luna: null, montes: null, nocheMan: null, btnNoche: null, fps: { t: 0, n: 0, listo: false } };
const P3_CAM = [{ n: 'Normal', d: 17, a: 27 }, { n: 'Cerca', d: 10, a: 15 }, { n: 'Arriba', d: 4, a: 48 }, { n: 'Sigue', d: 17, a: 25, auto: true }];
const P3_NC = {};   // colores de la noche (se crean cuando ya cargó Three.js)
function p3InitColores(){ if(P3_NC.hemi) return; P3_NC.hemi = new THREE.Color(0x7f86ff); P3_NC.suelo = new THREE.Color(0x1c2040); P3_NC.sol = new THREE.Color(0x8fa5ff); P3_NC.vent = new THREE.Color(0xFFD27A); }
const P3_NULO = new Proxy(function(){}, { get: () => P3_NULO, apply: () => P3_NULO, set: () => true });

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

// ---- Choques y alturas (en píxeles del 2D, para poder usar los mismos números que plaza.js) ----
function p3SolC(x, y, r){ p3.solidos.push({ t: 0, x, y, r }); }
function p3SolR(x, y, w, h){ p3.solidos.push({ t: 1, x, y, w, h }); }
function p3SolEn(x, y){
  for(const s of p3.solidos){ if(s.t === 0 ? Math.hypot(x - s.x, y - s.y) < s.r : (x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h)) return true; }
  return false;
}
function p3PlatC(x, y, r, alto){ p3.plat.push({ t: 0, x, y, r, alto }); }
function p3PlatR(x, y, w, h, alto){ p3.plat.push({ t: 1, x, y, w, h, alto }); }
// Lo llama plazaChoca() de plaza.js: bloquea el paso, salvo que ya estés adentro (para poder salir).
function plaza3dChoca(x, y){
  if(!p3.listo || !plz.modo3d) return false;
  if(p3SolEn(plz.yo.x, plz.yo.y)) return false;
  return p3SolEn(x, y);
}
function plaza3dAltura(x, y){
  let h = 0;
  for(const p of p3.plat){ if(p.t === 0 ? Math.hypot(x - p.x, y - p.y) < p.r : (x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h)) h = Math.max(h, p.alto); }
  return h;
}

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
  return new THREE.Mesh(new THREE.PlaneGeometry(ancho, ancho * 150 / 400), new THREE.MeshBasicMaterial({ map: p3.etiquetas[clave], transparent: true, side: THREE.DoubleSide }));
}
// Marca en el piso (alfombra de la puerta o círculo de una atracción): se enciende cuando estás cerca, igual que el botón de abajo.
function p3Zona(id, x, z, w, d, redonda){
  const m = new THREE.Mesh(redonda ? new THREE.CircleGeometry(w, 24) : new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.08, z); m.renderOrder = 3; p3.escena.add(m); p3.zonas.push({ mesh: m, id, base: redonda ? 0.16 : 0.38 });
  return m;
}
const p3Icono = (em, x, y, z, tam) => { const ic = p3Etiqueta(em, { tam: tam || 34, fondo: 'rgba(255,255,255,.55)', escala: 24 }); ic.position.set(x, y, z); p3.escena.add(ic); return ic; };

// Mancha de luz redonda y suave para los faroles.
function p3TexGlow(){ if(p3.texGlow) return p3.texGlow; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (p3.texGlow = new THREE.CanvasTexture(c)); }
function p3Brillo(x, y, z, tam){ const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: p3TexGlow(), color: 0xFFC860, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.set(tam, tam, 1); gl.position.set(x, y, z); p3.escena.add(gl); p3.faroles.push(gl); return gl; }

// Charcos de luz en el piso y halos en las paredes: todos juntos en una sola malla aditiva que se prende de noche.
function p3LuzPiso(x, z, r, hex){ p3.luzQuads.push({ t: 0, x, z, r, c: hex }); }
function p3LuzPared(x, y, z, w, h, hex){ p3.luzQuads.push({ t: 1, x, y, z, w, h, c: hex }); }
function p3ArmarLuces(){
  if(!p3.luzQuads.length) return;
  const pos = [], uv = [], col = [], c = new THREE.Color();
  const q = (a, b, cc, d, hex) => { c.set(hex); [a, b, cc, a, cc, d].forEach(([px, py, pz, u, w]) => { pos.push(px, py, pz); uv.push(u, w); col.push(c.r, c.g, c.b); }); };
  p3.luzQuads.forEach(l => {
    if(l.t === 0) q([l.x - l.r, 0.1, l.z + l.r, 0, 0], [l.x + l.r, 0.1, l.z + l.r, 1, 0], [l.x + l.r, 0.1, l.z - l.r, 1, 1], [l.x - l.r, 0.1, l.z - l.r, 0, 1], l.c);
    else q([l.x - l.w / 2, l.y - l.h / 2, l.z, 0, 0], [l.x + l.w / 2, l.y - l.h / 2, l.z, 1, 0], [l.x + l.w / 2, l.y + l.h / 2, l.z, 1, 1], [l.x - l.w / 2, l.y + l.h / 2, l.z, 0, 1], l.c);
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  p3.luzMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: p3TexGlow(), vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  p3.luzMesh.renderOrder = 4; p3.luzMesh.frustumCulled = false; p3.escena.add(p3.luzMesh);
}
// Brillo (sprite aditivo) que crece de noche
function p3BrilloN(x, y, z, tam, hex, k){ const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: p3TexGlow(), color: hex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.set(tam, tam, 1); gl.position.set(x, y, z); p3.escena.add(gl); p3.brillosN.push({ sp: gl, k }); return gl; }
// Guirnalda de lucecitas colgada entre dos puntos
function p3Guirnalda(x1, z1, x2, z2, y, caida){
  const N = 26, pos = [], pts = [];
  for(let i = 0; i <= N; i++){ const t = i / N, yy = y - caida * 4 * t * (1 - t); pos.push(x1 + (x2 - x1) * t, yy, z1 + (z2 - z1) * t); pts.push(new THREE.Vector3(x1 + (x2 - x1) * t, yy, z1 + (z2 - z1) * t)); }
  p3.escena.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x2a1a3a })));
  const cols = [], c = new THREE.Color(), bulbos = [];
  for(let i = 1; i < N; i++){ if(i % 2) continue; bulbos.push(pos[i * 3], pos[i * 3 + 1] - 0.15, pos[i * 3 + 2]); c.set(['#FFD27A', '#FF9ADB', '#8FE3FF', '#FFE9A6'][(i / 2) % 4]); cols.push(c.r, c.g, c.b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(bulbos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.1, map: p3TexGlow(), vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); m.userData.guirnalda = true; p3.escena.add(m);
  p3.brillosN.push({ pts: m, k: 0.45 });
}

// ---- Cielo, luces y noche ----
function p3Noche(){
  if(PLZ_SECTOR && PLZ_SECTOR.parque && p3.nocheMan != null) return p3.nocheMan;
  const d = new Date(), h = plz.horaForzada != null ? plz.horaForzada : d.getHours() + d.getMinutes() / 60;
  let a = 0;
  if(PLZ_SECTOR && PLZ_SECTOR.parque){ if(h >= 21 || h < 5) a = 1; else if(h >= 18) a = (h - 18) / 3; else if(h < 8) a = (8 - h) / 3; }
  return Math.max(0, Math.min(1, a));
}
function p3Cielo(){
  const g = new THREE.SphereGeometry(190, 16, 10), n = g.attributes.position.count;
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  p3.cielo = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); p3.cielo.renderOrder = -10; p3.cielo.frustumCulled = false;
  p3.escena.add(p3.cielo); p3.nochePrev = -1;
  if(PLZ_SECTOR && PLZ_SECTOR.parque){
    const sp = [], R = 180; let sd = 11; const al = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for(let i = 0; i < 260; i++){ const a = al() * Math.PI * 2, e = 0.12 + al() * 1.2; sp.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); }
    const gs = new THREE.BufferGeometry(); gs.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    p3.estrellas = new THREE.Points(gs, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false })); p3.cielo.add(p3.estrellas);
    p3.luna = new THREE.Sprite(new THREE.SpriteMaterial({ map: p3TexGlow(), color: 0xE8EEFF, transparent: true, opacity: 0, fog: false, depthWrite: false })); p3.luna.scale.set(40, 40, 1); p3.luna.position.set(-70, 95, -120); p3.cielo.add(p3.luna);
    const mg = new THREE.CylinderGeometry(150, 150, 1, 56, 1, true), mp = mg.attributes.position; mg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(mp.count * 3), 3));
    for(let i = 0; i < mp.count; i++){ const a = Math.atan2(mp.getZ(i), mp.getX(i)); mp.setY(i, mp.getY(i) > 0 ? 7 + 6 * Math.sin(a * 3 + 1) + 4 * Math.sin(a * 7) + 2.5 * Math.sin(a * 13 + 2) : -4); }
    p3.montes = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })); p3.montes.renderOrder = -9; p3.montes.frustumCulled = false; p3.escena.add(p3.montes);
  }
}
function p3CieloColores(n){
  const s = PLZ_SECTOR, g = p3.cielo.geometry, pos = g.attributes.position, col = g.attributes.color;
  const alto = p3Color(s.parque ? '#4FA8F5' : s.fuera).lerp(p3Color('#05081c'), s.parque ? n : 0.3), horizonte = p3Color(s.parque ? '#D6EEFF' : p3Mezcla(s.fuera, '#ffffff', 0.12).getStyle()).lerp(p3Color('#1a1f4a'), s.parque ? n : 0.2), c = new THREE.Color();
  for(let i = 0; i < pos.count; i++){ const t = Math.max(0, Math.min(1, pos.getY(i) / 120)); c.copy(horizonte).lerp(alto, Math.pow(t, 0.7)); col.setXYZ(i, c.r, c.g, c.b); }
  col.needsUpdate = true;
  p3.escena.fog.color.copy(horizonte);
  if(p3.montes){ const base = horizonte.clone().lerp(p3Color('#7FB28F'), 0.5 * (1 - n)).lerp(p3Color('#0c1030'), n * 0.8), cima = p3Color('#7FB28F').lerp(p3Color('#161b42'), n), mc = p3.montes.geometry.attributes.color, mpz = p3.montes.geometry.attributes.position; for(let i = 0; i < mc.count; i++){ const cc = mpz.getY(i) > 0 ? cima : base; mc.setXYZ(i, cc.r, cc.g, cc.b); } mc.needsUpdate = true; }
}
function p3Luces(){
  p3.luz = new THREE.HemisphereLight(0xeaf4ff, 0x8a9a7a, 0.6); p3.escena.add(p3.luz);
  p3.sol = new THREE.DirectionalLight(0xfff4e0, 0.4); p3.sol.position.set(-30, 60, 40); p3.escena.add(p3.sol);
}

// ---- Piso: el mismo dibujo del 2D (baldosas, pasillos, césped) pegado como textura ----
function p3TexSuelo(s){
  const k = 1.5, c = document.createElement('canvas'); c.width = Math.round(PLZ.W * k); c.height = Math.round(PLZ.H * k);
  const x = c.getContext('2d'); x.scale(k, k);
  const decorOrig = PLZ_DECOR[s.decor], paradaOrig = s.parada;
  // solo lo que es "piso": el resto (globos, bola de espejos, tablero, parada...) se arma en 3D
  const pisos = {
    plaza(cx){
      cx.fillStyle = 'rgba(127,199,122,.6)'; arcRR(cx, 26, 196, PLZ.W - 52, 316, 44); cx.fill();
      const fx = 320, fy = 340;   // plazoleta de adoquines alrededor de la fuente, con anillos como en una plaza de pueblo
      cx.fillStyle = '#DCD0B8'; cx.beginPath(); cx.arc(fx, fy, 126, 0, 7); cx.fill();
      cx.fillStyle = '#C9BA9C'; cx.beginPath(); cx.arc(fx, fy, 112, 0, 7); cx.fill(); cx.fillStyle = '#E2D7C0'; cx.beginPath(); cx.arc(fx, fy, 100, 0, 7); cx.fill();
      cx.strokeStyle = '#A8977A'; cx.lineWidth = 4; [126, 112, 100, 86].forEach(rr => { cx.beginPath(); cx.arc(fx, fy, rr, 0, 7); cx.stroke(); });
      cx.strokeStyle = 'rgba(120,100,70,.4)'; cx.lineWidth = 2;
      [[102, 110, 90], [114, 124, 110], [88, 98, 70]].forEach(([r0, r1, n]) => { for(let i = 0; i < n; i++){ const a = i * Math.PI * 2 / n + (r0 % 7) * 0.1; cx.beginPath(); cx.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0); cx.lineTo(fx + Math.cos(a) * r1, fy + Math.sin(a) * r1); cx.stroke(); } });
    },
    seleccion(cx){
      for(let i = 0; i < 10; i++){ cx.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'; cx.fillRect(16, 20 + i * 58, PLZ.W - 32, 58); }
      cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(320, 320, 78, 0, 7); cx.stroke(); cx.beginPath(); cx.moveTo(24, 320); cx.lineTo(616, 320); cx.stroke(); cx.strokeRect(22, 22, PLZ.W - 44, PLZ.H - 44);
    },
  };
  try {
    s.parada = null;
    if(s.decor) PLZ_DECOR[s.decor] = pisos[s.id] || function(){};
    plazaDibujarFondo(x);
  } finally { s.parada = paradaOrig; if(s.decor) PLZ_DECOR[s.decor] = decorOrig; }
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.anisotropy = 2;
  return t;
}

// ---- Piezas ----
function p3TexTejas(base){
  const clave = 'tejas|' + base;
  if(p3.etiquetas[clave]) return p3.etiquetas[clave];
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 128, 128);
  for(let f = 0; f < 8; f++){ for(let i = 0; i < 8; i++){ const ox = (f % 2) * 8, px = i * 16 + ox; x.fillStyle = 'rgba(0,0,0,' + (0.05 + ((i * 7 + f * 3) % 5) * 0.03) + ')'; x.beginPath(); if(x.roundRect) x.roundRect(px, f * 16, 15, 14, 5); else x.rect(px, f * 16, 15, 14); x.fill(); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(px + 1, f * 16 + 1, 13, 3); } x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, f * 16 + 14, 128, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; p3.etiquetas[clave] = t; return t;
}

function p3Maceta(x, z, solido){
  p3Cil(0.55, 0.42, 0.85, 10, '#C9694A', x, 0.43, z); p3Esf(0.72, '#4BAA5C', x, 1.3, z);
  [[-0.35, 0.1], [0.34, 0.2], [0, -0.35]].forEach(([dx, dz], i) => p3Esf(0.19, ['#FF6A8A', '#FFD84D', '#ffffff'][i], x + dx, 1.75, z + dz));
  p3Sombra(x, z, 1.1);
  if(solido !== false) p3SolC(x / P3.K, z / P3.K, 7);
}
function p3Farol(x, z){
  p3Sombra(x, z, 0.9);
  p3Cil(0.16, 0.24, 4.6, 8, '#3a3f52', x, 2.3, z); p3Esf(0.34, '#3a3f52', x, 0.2, z); p3Caja(1.0, 0.14, 0.14, '#3a3f52', x + 0.45, 4.6, z, null, 0.05);
  const lamp = p3Caja(0.56, 0.8, 0.56, '#FFD98A', x + 0.9, 4.2, z, null, 0.2); lamp.material = new THREE.MeshBasicMaterial({ color: 0xFFE3A0 });
  p3Cono(0.55, 0.45, '#3a3f52', x + 0.9, 4.85, z);
  p3Brillo(x + 0.9, 4.2, z, 5.4); p3LuzPiso(x + 0.9, z, 6.5, 0xFFB860);
  p3SolC(x / P3.K, z / P3.K, 6);
}
function p3Arbol(x, z, k){
  const e = 0.78;
  p3Sombra(x, z, 3.4 * e);
  p3Cil(0.5 * e, 0.7 * e, 4.8 * e, 8, '#7A5230', x, 2.4 * e, z);
  const a = ['#58B368', '#4FAE62', '#5FBE72'][Math.floor(k * 3) % 3], b = '#43A057', c = '#74CC82';
  p3Esf(2.9 * e, b, x, 6.6 * e, z); p3Esf(2.2 * e, a, x + 1.9 * e, 5.8 * e, z + 0.6 * e); p3Esf(2.3 * e, a, x - 1.9 * e, 6.0 * e, z - 0.5 * e); p3Esf(2.0 * e, c, x + 0.2 * e, 8.4 * e, z + 0.1 * e);
  p3SolC(x / P3.K, z / P3.K, 15);
}
function p3Banco(cx, cz, id){
  const g = new THREE.Group(); g.position.set(cx, 0, cz); p3.escena.add(g);
  p3Sombra(cx, cz + 0.2, 5.0, 2.0);
  p3Caja(8.2, 0.5, 2.0, '#C98B45', 0, 1.6, 0.3, g, 0.18); p3Caja(8.2, 1.6, 0.5, '#8A5A2B', 0, 2.7, -0.75, g, 0.2);
  [-3.6, 3.6].forEach(dx => { p3Caja(0.7, 1.5, 1.9, '#5A3A22', dx, 0.75, 0.3, g, 0.2); p3Caja(0.7, 0.4, 2.0, '#5A3A22', dx, 2.2, 0.2, g, 0.15); });
  p3SolR(cx / P3.K - 41, cz / P3.K - 17, 82, 34);
  if(id){ p3Zona(id, cx, cz + 1.5, 7.2, 0, true); p3Icono('🪑', cx, 6.2, cz); }
}

// El micro de Busmac estacionado en la parada, con el logo y las balizas que parpadean.
function p3Micro(x, z){
  const g = new THREE.Group(); g.position.set(x, 0, z); p3.escena.add(g);
  p3Sombra(x, z, 3.2, 8);
  p3Caja(3.7, 3.5, 14, '#F4F6FA', 0, 2.95, 0, g, 0.7); p3Caja(3.76, 1.0, 14.02, '#0F2A4D', 0, 1.65, 0, g, 0.35); p3Caja(3.78, 0.28, 14.04, '#E6A817', 0, 2.3, 0, g, 0.1); p3Caja(3.3, 0.35, 13.6, '#D5DAE3', 0, 4.8, 0, g, 0.15);
  for(let i = 0; i < 5; i++) [-1, 1].forEach(l => p3CajaSC(0.08, 1.2, 1.9, '#2a3a52', l * 1.86, 3.55, -5.2 + i * 2.6, g));
  p3CajaSC(3.0, 1.5, 0.08, '#2a3a52', 0, 3.55, 7.04, g); p3CajaSC(2.4, 0.5, 0.08, '#0b1a30', 0, 4.45, 7.06, g);
  [-1, 1].forEach(l => { const f = p3CajaSC(0.7, 0.45, 0.1, '#ffffff', l * 1.2, 1.25, 7.07, g); f.material = new THREE.MeshBasicMaterial({ color: 0xFFF3B0 }); });
  [[-1, 4.6], [1, 4.6], [-1, -4.6], [1, -4.6]].forEach(([l, dz]) => { const w = p3Cil(0.95, 0.95, 0.75, 12, '#1b1d26', l * 1.8, 0.95, dz, g); w.rotation.z = Math.PI / 2; const r = p3Cil(0.5, 0.5, 0.78, 8, '#aab2be', l * 1.8, 0.95, dz, g); r.rotation.z = Math.PI / 2; });
  if(typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){ const tl = new THREE.Texture(ARC_LOGO); tl.needsUpdate = true; [-1, 1].forEach(l => { const lg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: tl, transparent: true })); lg.position.set(l * 1.9, 1.7, 1.5); lg.rotation.y = l * Math.PI / 2; g.add(lg); }); }
  const luces = [-1, 1].map(l => { const b = p3Esf(0.24, '#FFB000', l * 1.5, 5.0, 6.9, g); b.material = new THREE.MeshBasicMaterial({ color: 0xFFB000 }); b.userData.vivo = true; return b; });
  p3.anim.push(t => { const on = Math.sin(t * 6) > 0; luces[0].visible = on; luces[1].visible = !on; });
  p3SolR(x / P3.K - 20, z / P3.K - 70, 40, 140);
  const et = p3Etiqueta('🚌 Tu micro', { tam: 24, escala: 30 }); et.position.set(x, 7.4, z); p3.escena.add(et);
}

function p3Arcade(e, w, d, cx, cz, abajo){
  const lado = abajo ? 1 : -1, fz = cz + lado * d * 0.25, col = e.color || '#7E57FF';
  p3Sombra(cx, cz, w * 0.5, d * 0.45);
  p3Caja(w * 0.72, 3.4, d * 0.5, '#1c2040', cx, 1.7, cz, null, 0.5); p3Caja(w * 0.72, 1.4, d * 0.5, col, cx, 4.5, cz, null, 0.5);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.58, 2.2), new THREE.MeshBasicMaterial({ color: p3Mezcla(col, '#ffffff', 0.35).getHex() })); pantalla.position.set(cx, 3.4, fz + lado * 0.06); pantalla.rotation.x = -0.3 * lado; if(!abajo) pantalla.rotation.y = Math.PI; p3.escena.add(pantalla);
  p3Caja(w * 0.62, 0.4, 1.3, '#2a2f55', cx, 2.2, fz + lado * 0.7, null, 0.15);
  p3Esf(0.3, '#E5484D', cx - w * 0.15, 2.7, fz + lado * 0.7); [0, 1, 2].forEach(i => p3Esf(0.22, ['#FFD84D', '#4FB8FF', '#5BE88D'][i], cx + w * 0.08 + i * 0.6, 2.55, fz + lado * 0.7));
}

function p3Edificio(e, s){
  const x = e.x * P3.K, z = e.y * P3.K, w = e.w * P3.K, d = e.h * P3.K, abajo = e.lado !== 'arriba';
  const cx = x + w / 2, cz = z + d / 2;
  if(e.mesa){ // mesa redonda con sillas
    p3Sombra(cx, cz, 5.4);
    p3Cil(3.2, 3.2, 1.3, 14, '#2f7d4f', cx, 0.65, cz); p3Cil(3.5, 3.5, 0.28, 14, '#8a5a30', cx, 1.4, cz);
    for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3; p3Caja(1.2, 1.2, 1.2, '#6a4422', cx + Math.sin(a) * 4.5, 0.6, cz + Math.cos(a) * 4.5, null, 0.4); }
    p3Zona(e.id, cx, cz, 6.4, 0, true); const et = p3Etiqueta(e.emoji + ' ' + e.nombre, { tam: 26, escala: 26 }); et.position.set(cx, 5.4, cz); p3.escena.add(et); return;
  }
  const arcade = s.id === 'arcade' && e.compacto;
  const casa = !e.puesto && !e.padel && !e.neon && !e.sel && !arcade;       // las casas llevan techo de tejas a dos aguas
  const alto = e.padel ? 5 : e.puesto ? 4.4 : e.compacto ? 5.6 : 7.2;
  let color = e.color || '#888';
  if(e.neon) color = '#17102e'; if(e.sel) color = '#c8e3f7';
  p3Sombra(cx + 0.4, cz + 0.6, w * 0.56, d * 0.56);
  if(arcade) p3Arcade(e, w, d, cx, cz, abajo); else p3Caja(w, alto, d, color, cx, alto / 2, cz, null, 0.55);
  if(casa){
    p3Caja(w + 0.3, 0.9, d + 0.3, p3Mezcla(color, '#6a5a4a', 0.55).getStyle(), cx, 0.45, cz, null, 0.3);                         // zócalo de piedra
    const rh = 3.4, teja = p3Mezcla(color, '#B4552E', 0.72).getStyle();
    const tex = p3TexTejas(teja).clone(); tex.needsUpdate = true; tex.repeat.set(4, 2);
    const techo = new THREE.Mesh(p3Plano(new THREE.ConeGeometry(1, rh, 4)), p3MatToon('#ffffff', { map: tex })); techo.rotation.y = Math.PI / 4;
    const sx = (w + 1) / Math.SQRT2, sz = (d + 1) / Math.SQRT2; techo.scale.set(sx, 1, sz); techo.position.set(cx, alto + rh / 2, cz); p3.escena.add(techo);
    const oc = new THREE.Mesh(techo.geometry, p3MatCont()); oc.scale.set(1 + P3M.T / sx, 1 + 2 * P3M.T / rh, 1 + P3M.T / sz); oc.userData.contorno = true; techo.add(oc);
    p3Caja(w + 1.1, 0.4, d + 1.1, p3Mezcla(color, '#000000', 0.5).getStyle(), cx, alto + 0.1, cz, null, 0.18);
  } else if(!arcade) p3Caja(w + 0.6, 0.6, d + 0.6, p3Mezcla(color, '#000000', 0.35).getStyle(), cx, alto + 0.3, cz, null, 0.25);
  const fz = abajo ? z + d : z;
  const lado = abajo ? 1 : -1;
  if(e.neon){ [[alto - 0.8, 0xff4ddb], [1.0, 0x4dd9ff]].forEach(([yy, col]) => { const b = p3CajaSC(w * 0.9, 0.35, 0.2, '#ffffff', cx, yy, fz + lado * 0.12); b.material = new THREE.MeshBasicMaterial({ color: col }); }); }
  if(e.sel){ [0, 1, 2].forEach(i => p3Caja(w / 6, alto, d + 0.1, '#74ACDF', x + w / 6 + i * w / 3, alto / 2, cz, null, 0.3)); }
  if(e.padel){
    p3Caja(w - 2, 0.2, d - 2, '#2E6FD0', cx, alto + 0.7, cz, null, 0.08); p3CajaSC(0.2, 0.2, d - 2.4, '#ffffff', cx, alto + 0.85, cz); p3CajaSC(w - 2.4, 0.2, 0.2, '#ffffff', cx, alto + 0.85, cz);
    const bola = p3Esf(0.5, '#D9F236', cx, alto + 1.6, cz); bola.userData.vivo = true; p3.anim.push(t => { bola.position.x = cx + Math.sin(t * 1.8) * (w / 2 - 3); bola.position.y = alto + 1.6 + Math.abs(Math.sin(t * 3.6)) * 1.6; });
  }
  // puerta con marco, escalón y macetas
  if(!arcade){
    p3Caja(3.2, 3.8, 0.35, e.neon ? '#ff4ddb' : '#3A2418', cx, 1.9, fz + lado * 0.08, null, 0.3);
    p3Caja(2.4, 3.3, 0.35, e.neon ? '#ff9ae9' : '#8A5A32', cx, 1.65, fz + lado * 0.22, null, 0.3);
    p3Esf(0.16, '#FFD84D', cx + 0.8, 1.6, fz + lado * 0.5);
    p3Caja(3.6, 0.3, 1.5, '#a39d90', cx, 0.15, fz + lado * 0.9, null, 0.12); p3LuzPiso(cx, fz + lado * 2.8, 4.2, 0xFFA848);
  }
  if(e.puesto){ for(let i = 0; i < 6; i++) p3Caja(w / 6, 0.3, 2.4, i % 2 ? '#ffffff' : p3Mezcla(color, '#000000', 0.2).getStyle(), x + w / 12 + i * w / 6, 3.4 - 0.2, fz + lado * 1.0, null, 0.12).rotation.x = abajo ? 0.25 : -0.25; }
  if(casa){
    p3Maceta(cx - 2.8, fz + lado * 1.3); p3Maceta(cx + 2.8, fz + lado * 1.3);
    { // toldo rayado sobre la puerta y faroles de pared
      const tc = ['#C0392B', '#2E8A5A', '#2F63B8', '#E6A817'][(Math.floor(e.x / 7) + Math.floor(e.y / 11)) % 4];
      for(let i = 0; i < 4; i++) p3Caja(0.95, 0.14, 1.9, i % 2 ? '#ffffff' : tc, cx - 1.42 + i * 0.95, 4.0, fz + lado * 1.0, null, 0.06).rotation.x = lado * 0.35;
      [-1, 1].forEach(l => { const lm = p3Caja(0.36, 0.55, 0.36, '#FFE3A0', cx + l * 2.8, 3.0, fz + lado * 0.35, null, 0.14); lm.material = new THREE.MeshBasicMaterial({ color: 0xFFE3A0 }); p3Brillo(cx + l * 2.8, 3.0, fz + lado * 0.6, 3); });
    }
    [-0.3, 0.3].forEach(k => {   // ventanas con marco y postigos
      const vx = cx + w * k, vy = alto * 0.62, vz = fz + lado * 0.12;
      p3Caja(2.7, 2.9, 0.3, '#5A3A22', vx, vy, vz, null, 0.2); const v = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.3), p3.matVentana); v.position.set(vx, vy, vz + lado * 0.18); if(!abajo) v.rotation.y = Math.PI; p3.escena.add(v); p3LuzPared(vx, vy, vz + lado * 0.6, 4.6, 4.8, 0xFFB45A);
      p3CajaSC(0.12, 2.3, 0.1, '#5A3A22', vx, vy, vz + lado * 0.2); p3CajaSC(2.1, 0.12, 0.1, '#5A3A22', vx, vy, vz + lado * 0.2);
      [-1, 1].forEach(l => p3Caja(0.8, 2.9, 0.18, p3Mezcla(color, '#1a3a2a', 0.65).getStyle(), vx + l * 1.75, vy, vz + lado * 0.1, null, 0.1));
      p3Caja(3.0, 0.3, 0.8, '#8A7A68', vx, vy - 1.6, vz + lado * 0.4, null, 0.1);
      if(alto >= 7){ p3Caja(3.5, 0.26, 1.4, '#8A7A68', vx, vy - 1.75, vz + lado * 0.8, null, 0.1); p3CajaSC(3.5, 0.12, 0.12, '#3a2a1a', vx, vy - 1.0, vz + lado * 1.45); [-1.6, 0, 1.6].forEach(dx => p3CajaSC(0.1, 0.7, 0.1, '#3a2a1a', vx + dx, vy - 1.3, vz + lado * 1.45)); }
    });
  }
  // cartel grande y legible, inclinado hacia la cámara (en las casas, apoyado en el techo)
  p3Zona(e.id, cx, fz + lado * 2.8, Math.min(8, w * 0.7), 4.2, false);
  const anchoCartel = Math.min(w * 1.0, 13.5), cartel = p3Cartel(e, e.neon ? '#7E2DBB' : (e.sel ? '#4A8FC4' : color), anchoCartel);
  const gc = new THREE.Group();
  if(casa){ const rh = 3.4, pend = Math.atan2(rh, d / 2 + 0.5), t = 0.4; gc.position.set(cx, alto + t * rh + 0.5, z + d + 0.5 - t * (d / 2 + 0.5)); cartel.rotation.x = -(Math.PI / 2 - pend); }
  else { gc.position.set(cx, alto + 0.6 + anchoCartel * 0.2, z + d - 0.3); cartel.rotation.x = -0.87; [-1, 1].forEach(l => p3Caja(0.3, anchoCartel * 0.24 + 0.4, 0.3, '#3a3a44', cx + l * anchoCartel * 0.36, alto + anchoCartel * 0.1 + 0.4, z + d - 0.3, null, 0.1)); }
  gc.add(cartel); p3.escena.add(gc); p3.carteles[e.id] = gc;
  p3BrilloN(gc.position.x, gc.position.y + 1, gc.position.z + 0.5, anchoCartel * 1.7, p3Color(e.neon ? '#FF4DDB' : color).getHex(), 0.5);
}

// ---- Parque de la plaza: todo ubicado donde está en el 2D ----
function p3Plaza(s){
  const K = P3.K;
  // fuente de tres pisos con chorros (de noche brilla celeste)
  const f = PLZ_FUENTE;
  if(f){
    const fx = f.x * K, fz = f.y * K, r = f.r * K;
    const disco = (rad, y, hex) => { const d = new THREE.Mesh(new THREE.CircleGeometry(rad, 28), new THREE.MeshBasicMaterial({ color: hex })); d.rotation.x = -Math.PI / 2; d.position.set(fx, y, fz); p3.escena.add(d); return d; };
    p3Sombra(fx, fz, r + 1.6);
    p3Cil(r + 0.2, r + 0.45, 1.3, 24, '#C9D1DE', fx, 0.65, fz); p3Cil(r - 0.45, r - 0.45, 0.25, 24, '#B2BCCD', fx, 1.3, fz); disco(r - 0.75, 1.46, 0x74D2FF);
    p3Cil(0.9, 1.25, 2.6, 12, '#CED5E0', fx, 2.3, fz);
    p3Cil(2.5, 1.5, 0.7, 20, '#C9D1DE', fx, 3.65, fz); disco(2.15, 4.03, 0x86DCFF);
    p3Cil(0.5, 0.75, 1.7, 10, '#CED5E0', fx, 4.8, fz);
    p3Cil(1.35, 0.9, 0.5, 16, '#C9D1DE', fx, 5.75, fz); disco(1.05, 6.02, 0x9AE4FF);
    p3Cil(0.25, 0.4, 1.3, 8, '#CED5E0', fx, 6.7, fz); p3Esf(0.5, '#DDE4EE', fx, 7.5, fz);
    const anillo = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide })); anillo.rotation.x = -Math.PI / 2; anillo.position.set(fx, 1.5, fz); anillo.userData.vivo = true; p3.escena.add(anillo);
    p3.anim.push(t => { const k = 0.6 + ((t * 0.5) % 1) * (r - 1.8); anillo.scale.set(k, k, k); anillo.material.opacity = 0.9 - ((t * 0.5) % 1) * 0.9; });
    // chorros y gotas que caen de piso en piso
    const E = [{ r0: 0.1, r1: 1.7, y0: 7.6, y1: 6.05, h: 1.2, n: 16, v: 0.9 }, { r0: 1.0, r1: 2.6, y0: 6.05, y1: 4.1, h: 0.8, n: 20, v: 0.8 }, { r0: 2.4, r1: r - 0.9, y0: 4.1, y1: 1.55, h: 1.1, n: 28, v: 0.75 }];
    const total = E.reduce((a, e) => a + e.n, 0), arr = new Float32Array(total * 3), gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const gotas = new THREE.Points(gg, new THREE.PointsMaterial({ size: 0.6, map: p3TexGlow(), color: 0xD2F4FF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gotas.frustumCulled = false; gotas.userData.vivo = true; p3.escena.add(gotas);
    p3.anim.push(t => { let k = 0; E.forEach(e => { for(let i = 0; i < e.n; i++){ const ph = (t * e.v + i / e.n) % 1, a = i * 2.399 + e.r1, rr = e.r0 + (e.r1 - e.r0) * ph; arr[k * 3] = fx + Math.cos(a) * rr; arr[k * 3 + 1] = e.y0 + (e.y1 - e.y0) * ph + e.h * 4 * ph * (1 - ph); arr[k * 3 + 2] = fz + Math.sin(a) * rr; k++; } }); gg.attributes.position.needsUpdate = true; });
    p3LuzPiso(fx, fz, r * 2.5, 0x2FC8FF); p3BrilloN(fx, 4.8, fz, 11, 0x4FD8FF, 0.6);
    if(typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){ const tl = new THREE.Texture(ARC_LOGO); tl.needsUpdate = true; const lg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: tl, transparent: true, side: THREE.DoubleSide })); lg.position.set(fx, 9.4, fz); lg.userData.vivo = true; p3.escena.add(lg); p3.anim.push(() => { lg.quaternion.copy(p3.cam.quaternion); }); }
  }
  // árboles
  [[26, 200], [614, 200], [26, 280], [614, 280], [26, 400], [614, 400], [26, 470], [614, 470], [120, 210], [540, 210], [90, 500], [560, 505]].forEach(([x, y], i) => p3Arbol(x * K, y * K, (i * 37) % 10 / 10));
  // bancos (los mismos del 2D: x 74..156 / 484..566)
  [[115, 443, 'banco1'], [525, 443, 'banco2']].forEach(([x, y, id]) => p3Banco(x * K, y * K, id));
  // hamacas: dos caballetes y una barra; los asientos cuelgan donde están los lugares del 2D
  const barZ = 32.2, barY = 8.2;
  [50, 198].forEach(x => { [-1, 1].forEach(l => { const pata = p3Cil(0.28, 0.28, 8.6, 8, '#8A5A2B', x * K, barY / 2, barZ + l * 1.05); pata.rotation.x = l * -0.25; p3SolC(x, barZ * 10 + l * 21, 6); p3Esf(0.34, '#6A4220', x * K, 0.1, barZ + l * 2.1 + l * 0.0); }); p3Sombra(x * K, barZ, 1.4, 3); });
  p3Cil(0.32, 0.32, 15.6, 8, '#8A5A2B', (50 + 198) / 2 * K, barY, barZ).rotation.z = Math.PI / 2;
  [78, 124, 170].forEach((sx, i) => {
    const g = new THREE.Group(); g.position.set(sx * K, barY, barZ); g.userData.vivo = true; p3.escena.add(g);
    [-0.95, 0.95].forEach(dx => p3CajaSC(0.08, 6.2, 0.08, '#444444', dx, -3.1, 0, g)); p3Caja(2.3, 0.34, 1.3, '#E5586E', 0, -6.2, 0, g, 0.14);
    p3.hamacas.push({ g, x: sx, y: 322, i });
  });
  p3.anim.push(t => { p3.hamacas.forEach(h => { h.g.rotation.x = Math.sin(t * 1.2 + h.i) * 0.12; }); });
  p3Zona('hamacas', 12.4, 33, 8, 0, true); p3Icono('🛝', 12.4, 11.6, barZ);
  // cama elástica (se puede subir y caminar encima; saltás al tocar "Saltar")
  const tx = 50, tz = 32.8;
  p3Sombra(tx, tz, 7.8);
  p3Cil(6.4, 6.4, 0.4, 20, '#E8B923', tx, 0.95, tz); p3Cil(6.0, 6.0, 0.26, 20, '#1D2B55', tx, 1.12, tz);
  for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3; p3Cil(0.3, 0.2, 1.0, 8, '#9AA4B5', tx + Math.sin(a) * 6.0, 0.5, tz + Math.cos(a) * 6.0); }
  const tela = new THREE.Mesh(new THREE.CircleGeometry(5.7, 24), new THREE.MeshBasicMaterial({ color: 0x2B3A67 })); tela.rotation.x = -Math.PI / 2; tela.position.set(tx, 1.27, tz); tela.userData.vivo = true; p3.escena.add(tela);
  const aro = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.2, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })); aro.rotation.x = -Math.PI / 2; aro.position.set(tx, 1.29, tz); aro.userData.vivo = true; p3.escena.add(aro);
  if(typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){ const tl = new THREE.Texture(ARC_LOGO); tl.needsUpdate = true; const lg = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: tl, transparent: true })); lg.rotation.x = -Math.PI / 2; lg.position.set(tx, 1.3, tz); lg.userData.vivo = true; p3.escena.add(lg); }
  p3PlatC(500, 328, 62, 1.25); p3Zona('trampolin', tx, tz, 8.4, 0, true); p3Icono('🤸', tx, 5.8, tz);
  // subibaja (mismos números que el 2D: pivote en 320,250 y tablas de 58 px a cada lado)
  const sbx = PLZ_SB.cx * K, sbz = PLZ_SB.cy * K;
  p3Sombra(sbx, sbz, 7.4, 1.6);
  p3Cono(1.1, 1.7, '#8A5A2B', sbx, 0.85, sbz); p3Esf(0.35, '#6A4220', sbx, 1.65, sbz);
  const sb = new THREE.Group(); sb.position.set(sbx, 1.85, sbz); sb.userData.vivo = true; p3.escena.add(sb);
  p3Caja(11.8, 0.5, 1.8, '#E5586E', 0, 0, 0, sb, 0.22); [-1, 1].forEach(l => { p3Caja(0.2, 0.9, 0.2, '#FFD84D', l * 4.1, 0.65, 0.4, sb, 0.08); p3Caja(0.9, 0.1, 0.4, '#FFD84D', l * 4.1, 1.1, 0.4, sb, 0.04); });
  p3.anim.push(() => { sb.rotation.z = (plz.sbS || 0) / PLZ_SB.L * 0.9; });
  p3SolR(PLZ_SB.cx - 62, PLZ_SB.cy - 8, 124, 16); p3Zona('subibaja', sbx, sbz + 1.5, 9, 0, true); p3Icono('⚖️', sbx, 5.6, sbz - 1);
  // fuente: zona y moneda
  p3Zona('fuente', 32, 34, 7.6, 0, true); p3Icono('🪙', 32, 7.8, 34);
  // parada del micro: cartel y micro estacionado en la calle
  p3Sombra(32, 52.8, 1.3);
  p3Cil(0.18, 0.2, 5.4, 8, '#5b6673', 32, 2.7, 52.8); p3Caja(4.8, 2.5, 0.35, '#0F2A4D', 32, 5.6, 52.8, null, 0.3);
  p3SolC(320, 528, 5);
  const et = p3Etiqueta('🚌 MICRO'); et.position.set(32, 7.9, 52.8); p3.escena.add(et);
  p3Micro(32, 61);
  // flores y matitas de pasto
  [[240, 410], [400, 410], [215, 250], [430, 240], [270, 485], [372, 485]].forEach(([x, y], i) => { p3Cil(0.07, 0.07, 0.9, 6, '#3a8a3a', x * K, 0.45, y * K); p3Esf(0.4, i % 2 ? '#FFE066' : '#FF7AA8', x * K, 1.0, y * K); p3Esf(0.16, '#ffffff', x * K, 1.12, y * K + 0.25); });
  let seed = 7; const al = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for(let i = 0; i < 40; i++){ const fx = 4 + al() * 56, fz = 20.6 + al() * 30; const dx = fx - 32, dz = fz - 34; if(Math.hypot(dx, dz) < 7 || Math.abs(dx) < 4.2 || Math.abs(fx - 50) < 8 && Math.abs(fz - 32.8) < 8) continue; p3Esf(0.1 + al() * 0.06, ['#FF7AA8', '#FFE066', '#ffffff', '#B79CFF'][i % 4], fx, 0.12, fz); }
}

// ---- Decorado de cada sector, en el mismo lugar que el 2D ----
function p3Decor(s){
  const K = P3.K, W = PLZ.W * K, H = PLZ.H * K;
  const globo = (x, z, c, i) => { const g = new THREE.Group(); g.position.set(x, 9, z); g.userData.vivo = true; p3Esf(1.5, c, 0, 0, 0, g); p3Cono(0.3, 0.4, c, 0, -1.55, 0, g).rotation.x = Math.PI; p3CajaSC(0.06, 5, 0.06, '#ffffff', 0, -4, 0, g); p3.escena.add(g); p3.anim.push(t => { g.position.y = 9 + Math.sin(t * 0.8 + i) * 0.8; g.rotation.y = t * 0.3; }); };
  if(s.id === 'shopping'){
    [[6, 23.5, '#FF5E8A'], [58, 26.5, '#4FB8FF'], [30, 25, '#FFD84D'], [45, 23, '#5BE88D']].forEach(([x, z, c], i) => globo(x, z, c, i));
    p3Banco(15, 24.5, null); p3Banco(49, 24.5, null);
    [[32, 24.5], [4, 27], [60, 27]].forEach(([x, z]) => p3Maceta(x, z));
  } else if(s.id === 'arcade'){
    const franjas = [[2.4, H / 2, 0.5, H - 6, 0x22E6FF], [W - 2.4, H / 2, 0.5, H - 6, 0xFF3DBE], [W / 2, 2.4, W - 6, 0.5, 0x7E57FF], [W / 2, H - 2.4, W - 6, 0.5, 0x22E6FF]].map(([x, z, w, d, c]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 })); m.position.set(x, 0.12, z); m.userData.vivo = true; p3.escena.add(m); return m; });
    p3.anim.push(t => { franjas.forEach((m, i) => { m.material.opacity = 0.55 + 0.4 * Math.sin(t * 3 + i * 1.6); }); });
  } else if(s.id === 'mesas'){
    PLZ_EDIFICIOS.filter(e => e.mesa).forEach(e => { const cx = (e.x + e.w / 2) * K, cz = (e.y + e.h / 2) * K; p3Cil(0.06, 0.06, 9, 6, '#222222', cx, 12.5, cz); p3Cono(1.7, 1.2, '#E6A817', cx, 8.2, cz); const b = p3Esf(0.5, '#fff6c0', cx, 7.4, cz); b.material = new THREE.MeshBasicMaterial({ color: 0xFFF3B0 }); p3Brillo(cx, 7.4, cz, 6); });
  } else if(s.id === 'eventos'){
    p3Sombra(48, 26.5, 15, 7);
    p3Caja(27.2, 1.0, 12, '#9A6A3C', 48, 0.5, 26, null, 0.4); p3Caja(27.2, 0.22, 12.2, '#C98B45', 48, 1.05, 26, null, 0.1); p3PlatR(344, 200, 272, 120, 1.1);
    const c = document.createElement('canvas'); c.width = 400; c.height = 160; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c);
    let ultimo = null; const pintar = () => { const b = typeof mundo !== 'undefined' ? mundo.bingo : ''; if(b === ultimo) return; ultimo = b; x.fillStyle = '#1B1B2F'; x.fillRect(0, 0, 400, 160); x.strokeStyle = '#FFD84D'; x.lineWidth = 8; x.strokeRect(6, 6, 388, 148); x.textAlign = 'center'; x.fillStyle = '#FFD84D'; x.font = '800 30px Poppins, sans-serif'; x.fillText('🎱 PRÓXIMO BINGO', 200, 50); x.fillStyle = '#fff'; x.font = '800 ' + (b && b.length > 8 ? 36 : 56) + 'px Poppins, sans-serif'; x.fillText(b || 'A confirmar', 200, 112); tex.needsUpdate = true; };
    pintar(); const cartel = new THREE.Mesh(new THREE.PlaneGeometry(18, 7.2), new THREE.MeshBasicMaterial({ map: tex })); cartel.position.set(48, 6.6, 21.2); cartel.rotation.x = -0.25; cartel.userData.vivo = true; p3.escena.add(cartel);
    [-1, 1].forEach(l => p3Cil(0.25, 0.25, 6, 8, '#3a3a44', 48 + l * 9.4, 4, 21.2));
    p3.anim.push(t => { if(Math.floor(t) !== p3.bingoT){ p3.bingoT = Math.floor(t); pintar(); } });
    [-1, 1].forEach((l, i) => { const g = new THREE.Group(); g.position.set(48 + l * 12, 14, 24); g.userData.vivo = true; const cono = new THREE.Mesh(new THREE.ConeGeometry(2.4, 14, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF0A0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide })); cono.position.y = -7; g.add(cono); p3.escena.add(g); p3.anim.push(t => { g.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.35; g.rotation.x = Math.cos(t * 0.7 + i) * 0.2; }); });
  } else if(s.id === 'boliche'){
    const colores = [0xFF4DDB, 0x4DD9FF, 0xFFD84D, 0x7E57FF, 0x5BE88D]; const baldosas = [];
    for(let j = 0; j < 6; j++) for(let i = 0; i < 8; i++){ const m = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.0), new THREE.MeshBasicMaterial({ color: colores[(i + j) % 5], transparent: true, opacity: 0.7 })); m.rotation.x = -Math.PI / 2; m.position.set(15 + 2.1 + i * 4.2, 0.1, 22.4 + 2.1 + j * 4.2); m.userData.vivo = true; p3.escena.add(m); baldosas.push(m); }
    p3.anim.push(t => { baldosas.forEach((m, k) => { m.material.color.setHex(colores[(Math.floor(t * 2.2) + k + Math.floor(k / 8)) % 5]); m.material.opacity = 0.45 + 0.35 * Math.sin(t * 5 + k); }); });
    // cabina del DJ y barra (mismas medidas que los bloques del 2D)
    p3Sombra(32.0, 6.6, 10.5, 5.5); p3Caja(18.8, 3.4, 9.2, '#1a1233', 32, 1.7, 6.6, null, 0.6); p3Caja(18.0, 0.4, 8.4, '#2a1f4a', 32, 3.5, 6.6, null, 0.15);
    const nDj = p3CajaSC(17, 0.3, 0.3, '#ffffff', 32, 3.1, 11.3); nDj.material = new THREE.MeshBasicMaterial({ color: 0xFF4DDB });
    p3Cil(1.4, 1.4, 0.4, 14, '#101020', 29, 3.9, 6.6); p3Cil(1.4, 1.4, 0.4, 14, '#101020', 35, 3.9, 6.6); p3Icono('🎧', 32, 7.4, 8);
    [19.8].forEach(sx => { p3Caja(4.4, 8.0, 3.2, '#16142b', sx, 4, 5.2, null, 0.5); p3Cil(1.5, 1.5, 0.4, 14, '#2b2840', sx, 5.6, 6.9).rotation.x = Math.PI / 2; p3Cil(0.8, 0.8, 0.4, 12, '#3d3a58', sx, 2.4, 6.9).rotation.x = Math.PI / 2; });
    p3Sombra(53, 7.8, 10.5, 6.6); p3Caja(18.8, 3.6, 11.6, '#2c1c14', 53, 1.8, 7.8, null, 0.6); p3Caja(18.8, 0.4, 3.8, '#5a3a22', 53, 3.7, 11.0, null, 0.15);
    const nBa = p3CajaSC(16.8, 0.3, 0.3, '#ffffff', 53, 3.0, 13.7); nBa.material = new THREE.MeshBasicMaterial({ color: 0xFF4DDB });
    [0, 1, 2, 3, 4].forEach(i => p3Cil(0.28, 0.25, 1.1, 8, ['#4FB8FF', '#FFB347', '#5BE88D', '#FF5E8A', '#FFD84D'][i], 46.6 + i * 3.4, 4.45, 11.0)); p3Icono('🍹', 53, 7.6, 10);
    [46.6, 53, 59.4].forEach(sx => { p3Cil(0.14, 0.14, 1.4, 8, '#3a2a66', sx, 0.7, 15); p3Cil(0.9, 0.9, 0.35, 12, '#7E57FF', sx, 1.55, 15); p3SolC(sx * 10, 150, 9); });
    // sillones
    [[1.6, 21.4, 6.6, 4.8], [55.8, 30.4, 6.6, 4.8]].forEach(([sx0, sz0, sw, sd]) => { const cx = sx0 + sw / 2, cz = sz0 + sd / 2; p3Sombra(cx, cz, sw * 0.7, sd * 0.7); p3Caja(sw, 1.5, sd, '#5b2a86', cx, 0.75, cz, null, 0.5); p3Caja(sw - 0.8, 0.8, 2.3, '#7a3fb0', cx, 1.75, cz + 0.9, null, 0.35); p3Caja(sw, 2.2, 1.3, '#5b2a86', cx, 2.0, cz - 1.7, null, 0.5); [-1, 1].forEach(l => p3Caja(0.9, 1.8, sd, '#4a2070', cx + l * (sw / 2 - 0.1), 1.2, cz, null, 0.4)); p3SolR(sx0 * 10, sz0 * 10, sw * 10, sd * 10); });
    // bola de espejos y luces
    const bola = new THREE.Group(); bola.position.set(32, 13, 17.6); bola.userData.vivo = true; const bs = p3Esf(2.2, '#d6dcec', 0, 0, 0, bola); bs.material = new THREE.MeshBasicMaterial({ color: 0xd6dcec }); p3CajaSC(0.08, 7, 0.08, '#888888', 0, 5.5, 0, bola); p3.escena.add(bola);
    p3.anim.push(t => { bola.rotation.y = t * 0.9; });
    [0, 1, 2].forEach(i => { const g = new THREE.Group(); g.position.set(15 + i * 17, 17, 4); g.userData.vivo = true; const cono = new THREE.Mesh(new THREE.ConeGeometry(2.8, 20, 12, 1, true), new THREE.MeshBasicMaterial({ color: colores[i], transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); cono.position.y = -10; g.add(cono); p3.escena.add(g); p3.anim.push(t => { g.rotation.z = Math.sin(t * 1.3 + i * 2.1) * 0.5; g.rotation.x = Math.cos(t * 1.1 + i * 1.7) * 0.5 - 0.3; }); });
    // salida
    p3Caja(6.4, 0.4, 0.8, '#5A3A22', 32, 4.6, 60.4, null, 0.1); p3Caja(1.0, 4.6, 0.8, '#5A3A22', 29, 2.3, 60.4, null, 0.2); p3Caja(1.0, 4.6, 0.8, '#5A3A22', 35, 2.3, 60.4, null, 0.2); p3Icono('🚪', 32, 7.4, 60);
  } else if(s.id === 'seleccion'){
    // vestuario (casilleros) y mural de ídolos: son los bloques del 2D
    p3Sombra(6.2, 18.5, 6.4, 12); p3Caja(9.2, 6.4, 21, '#34495e', 6.2, 3.2, 18.5, null, 0.5);
    for(let i = 0; i < 4; i++) for(let k = 0; k < 4; k++) p3Caja(0.3, 5.6 / 1.0 * 0.2 + 0.4, 1.5, k % 2 ? '#ffffff' : '#74ACDF', 10.9, 3.6, 10.5 + i * 5.0 + k * 1.2, null, 0.1);
    p3Caja(0.5, 0.5, 9, '#0F2A4D', 10.9, 6.8, 18.5, null, 0.1); p3Icono('🎽', 6.2, 9.4, 18.5);
    p3Sombra(57.5, 17.5, 6.4, 11); p3Caja(9.8, 8.6, 19, '#0b2a4a', 57.5, 4.3, 17.5, null, 0.5); p3Caja(0.4, 7.4, 17.4, '#74ACDF', 52.5, 4.3, 17.5, null, 0.1);
    const rk = typeof seleccionRanking === 'function' ? seleccionRanking() : []; { const c = document.createElement('canvas'); c.width = 256; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#0b2a4a'; x.fillRect(0, 0, 256, 400); x.fillStyle = '#FFD84D'; x.font = '800 30px Poppins, sans-serif'; x.textAlign = 'center'; x.fillText('⭐ ÍDOLOS', 128, 50); x.font = '700 24px Poppins, sans-serif'; (rk.length ? rk : [{ alias: 'Elegí al tuyo', n: 0 }]).slice(0, 5).forEach((r, i) => { x.textAlign = 'left'; x.fillStyle = '#fff'; x.fillText((i + 1) + '. ' + String(r.alias).slice(0, 11), 16, 110 + i * 56); if(r.n){ x.textAlign = 'right'; x.fillStyle = '#FFD84D'; x.fillText(String(r.n), 244, 110 + i * 56); } }); const pn = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 13.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); pn.rotation.y = -Math.PI / 2; pn.position.set(52.25, 4.6, 17.5); p3.escena.add(pn); }
    p3Icono('⭐', 57.5, 10.8, 17.5);
    // podio y copa (mismas medidas que el 2D)
    p3Sombra(32, 29.5, 7.2, 4.4); p3Caja(9.6, 1.0, 3.0, '#e8edf5', 32, 0.5, 31.5, null, 0.3); p3Caja(7.2, 1.0, 2.2, '#74ACDF', 32, 1.5, 29.3, null, 0.3); p3Caja(4.8, 1.0, 2.0, '#ffffff', 32, 2.5, 27.6, null, 0.3);
    const copa = new THREE.Group(); copa.position.set(32, 3.0, 27.6); copa.userData.vivo = true; p3Cil(0.5, 0.7, 0.7, 10, '#FFD84D', 0, 0.35, 0, copa); p3Cil(1.1, 0.4, 2.0, 12, '#FFD84D', 0, 1.6, 0, copa); [-1, 1].forEach(l => p3Caja(0.28, 1.2, 0.28, '#FFD84D', l * 1.25, 2.0, 0, copa, 0.1)); p3Esf(0.55, '#FFD84D', 0, 3.0, 0, copa); p3.escena.add(copa);
    p3.anim.push(t => { copa.rotation.y = t * 0.8; copa.position.y = 3.0 + Math.sin(t * 2) * 0.1; }); p3Icono('🏆', 32, 8.2, 27.6);
    // rincón de la foto
    p3Caja(15, 4.4, 0.6, '#74ACDF', 11.5, 2.2, 41.3, null, 0.2); for(let i = 0; i < 5; i++) p3CajaSC(1.2, 4.3, 0.7, '#ffffff', 5.2 + i * 2.8, 2.2, 41.3); p3Icono('📸', 11.5, 7, 41.3);
    // banderines
    for(let i = 0; i < 16; i++){ const b = p3Cono(0.9, 1.6, i % 2 ? '#ffffff' : '#74ACDF', 3 + i * 3.8, 8.6 + Math.sin(i * 0.7) * 0.15, 3.2); b.rotation.x = Math.PI; } p3Cil(0.05, 0.05, 61, 4, '#555555', 32, 9.5, 3.2).rotation.z = Math.PI / 2;
  }
}

function p3Limpiar(){
  if(!p3.escena) return;
  while(p3.escena.children.length) p3.escena.remove(p3.escena.children[0]);
  p3.avatares = {}; p3.anim = []; p3.zonas = []; p3.faroles = []; p3.carteles = {}; p3.nubes = []; p3.destino = null; p3.sombras = []; p3.solidos = []; p3.plat = []; p3.hamacas = []; p3.marca = null; p3.mira = null; p3.luzQuads = []; p3.brillosN = []; p3.luzMesh = null; p3.estrellas = null; p3.luna = null; p3.montes = null; p3.matVentana = null;
}

function p3Construir(){
  p3Limpiar();
  const s = PLZ_SECTOR, W = PLZ.W * P3.K, H = PLZ.H * P3.K;
  p3.sector = s.id;
  p3Luces();
  p3.escena.fog = new THREE.Fog(0xcfe8ff, 80, 180);
  p3Cielo();
  // piso: el mismo dibujo del 2D; alrededor, el color de "afuera" del 2D
  const fuera = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshToonMaterial({ color: p3Color(s.fuera), gradientMap: p3Grad() })); fuera.rotation.x = -Math.PI / 2; fuera.position.set(W / 2, -0.04, H / 2); p3.escena.add(fuera);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshToonMaterial({ map: p3TexSuelo(s), gradientMap: p3Grad() })); suelo.rotation.x = -Math.PI / 2; suelo.position.set(W / 2, 0, H / 2); p3.escena.add(suelo);
  // los bloques fijos del 2D (cabina del DJ, vestuario...) también chocan
  (PLZ_BLOQUES || []).forEach(bl => { if(s.id !== 'boliche' && s.id !== 'seleccion') p3Caja(bl.w * P3.K, 4, bl.h * P3.K, p3Mezcla(s.suelo, '#000000', 0.45).getStyle(), (bl.x + bl.w / 2) * P3.K, 2, (bl.y + bl.h / 2) * P3.K, null, 0.4); });
  p3.matVentana = new THREE.MeshBasicMaterial({ color: 0xBFE3FF });
  if(s.parque) p3Plaza(s);
  PLZ_EDIFICIOS.forEach(e => p3Edificio(e, s));
  // atracciones sin modelo propio: un círculo en el piso y su emoji flotando
  PLZ_ATRACCIONES.forEach(a => {
    if(a.id === 'parada' || (['hamacas', 'trampolin', 'banco1', 'banco2', 'fuente', 'subibaja'].indexOf(a.id) >= 0 && s.parque)) return;
    if(!a.zona) return;
    const ax = (a.zona.x + a.zona.w / 2) * P3.K, az = (a.zona.y + a.zona.h / 2) * P3.K;
    p3Zona(a.id, ax, az, Math.min(a.zona.w, a.zona.h) * P3.K * 0.5, 0, true);
    if(!(s.id === 'boliche' || s.id === 'seleccion')) p3Icono(a.emoji, ax, 4.2, az);
  });
  p3Decor(s);
  if(s.parque){ p3Guirnalda(4.4, 15, 59.6, 15, 9.4, 2.4); p3Guirnalda(4.4, 52, 59.6, 52, 9.4, 2.4); }
  if(s.parque) [[44, 150], [596, 150], [44, 340], [596, 340], [44, 520], [596, 520]].forEach(([fx, fy]) => { if(fy * P3.K < H - 4) p3Farol(fx * P3.K, fy * P3.K); });
  p3.destino = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 24), new THREE.MeshBasicMaterial({ color: 0xFFD84D, transparent: true, opacity: 0.9, depthWrite: false })); p3.destino.rotation.x = -Math.PI / 2; p3.destino.visible = false; p3.destino.userData.vivo = true; p3.escena.add(p3.destino);
  { const mg = new THREE.Group(); const an = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 24), new THREE.MeshBasicMaterial({ color: 0xFFD84D, side: THREE.DoubleSide })); an.rotation.x = -Math.PI / 2; an.position.y = 0.12; mg.add(an); const fl = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2, 4), new THREE.MeshBasicMaterial({ color: 0xFFD84D })); fl.rotation.x = Math.PI; fl.position.y = 9; mg.add(fl); mg.visible = false; mg.userData.vivo = true; p3.escena.add(mg); p3.marca = mg; }
  // nubes blandas
  if(s.parque){ for(let i = 0; i < 7; i++){ const n = new THREE.Group(); n.userData.vivo = true; [[0, 0, 4.6], [4.4, -0.8, 3.6], [-4.2, -0.5, 3.4], [1.2, 1.6, 3.6]].forEach(([x, y, r]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.93, fog: false })); b.position.set(x, y, 0); n.add(b); }); n.scale.set(1, 0.7, 1); n.position.set(i * 12 + 4, 42 + (i % 3) * 5, 6 + (i * 17) % 60); p3.escena.add(n); p3.nubes.push(n); } }
  p3ArmarLuces();
  p3Fusionar();
}

// ---- Personajes ----
function p3Personaje(clave, puesto){
  const firma = JSON.stringify(puesto || {});
  let a = p3.avatares[clave];
  if(!a || a.firma !== firma){
    if(a) p3.escena.remove(a.g);
    const g = p3Avatar(puesto, clave === 'yo'); p3.escena.add(g);
    a = p3.avatares[clave] = { g, firma, x: null, z: null, y: 0, rumbo: 0, dirPant: 1, nombre: null, nombreSp: null, burbuja: null, burbujaSp: null };
  }
  a.vivo = true;
  return a;
}

function p3Mover(a, x, y, nombre, caminando, pose, burbuja, fase, ex){
  const g = a.g, u = g.userData, K = P3.K, X = x * K, Z = y * K, t = p3.t;
  const suelo = plaza3dAltura(x, y);
  if(a.x == null){ a.x = X; a.z = Z; a.y = suelo; }
  const dx = X - a.x, dz = Z - a.z, mov = Math.hypot(dx, dz) > 0.002;
  const girar = obj => { let d = obj - a.rumbo; d = Math.atan2(Math.sin(d), Math.cos(d)); a.rumbo += d * 0.22; };
  if(mov && !pose) girar(Math.atan2(dx, dz));
  a.x = X; a.z = Z; a.y += (suelo - a.y) * 0.3;
  // vuelve todo a la posición base antes de aplicar la pose
  u.bal.rotation.set(0, 0, 0); u.bal.position.set(0, 0, 0); u.cuerpo.position.set(0, 0, 0); u.cuerpo.rotation.set(0, 0, 0); u.hamaca.visible = false;
  u.brazos.forEach(b => b.rotation.set(0, 0, 0)); u.piernas.forEach(p => p.rotation.set(0, 0, 0));
  g.position.set(X, a.y, Z); u.sombra.position.set(0, 0.06, 0); u.sombra.scale.set(1, 1, 1);
  const sw = Math.sin(t * 11 + fase);
  if(caminando && !pose){ u.piernas[0].rotation.x = sw * 0.8; u.piernas[1].rotation.x = -sw * 0.8; u.brazos[0].rotation.x = -sw * 0.7; u.brazos[1].rotation.x = sw * 0.7; u.cuerpo.position.y = Math.abs(sw) * 0.2; }
  else if(!pose){ u.cuerpo.position.y = Math.sin(t * 2.1 + fase) * 0.04; u.brazos[0].rotation.z = 0.06; u.brazos[1].rotation.z = -0.06; }
  if(pose === 3){ girar(0); u.cuerpo.position.y = 0.3; u.piernas.forEach(p => { p.rotation.x = -1.5; }); u.brazos.forEach(b => { b.rotation.x = -0.35; }); }
  else if(pose === 2){ const h = Math.abs(Math.sin(t * 5 + fase)) * 4.5; u.cuerpo.position.y = h; u.brazos[0].rotation.z = 2.4; u.brazos[1].rotation.z = -2.4; u.piernas.forEach((p, i) => { p.rotation.x = h > 1 ? (i ? 0.5 : -0.4) : 0; }); const k = Math.max(0.35, 1 - h * 0.12); u.sombra.scale.set(k, k, k); u.sombra.position.y = 0.06; }
  else if(pose === 4){ const b = Math.abs(Math.sin(t * 7 + fase)); u.cuerpo.position.y = b * 0.5; u.cuerpo.rotation.z = Math.sin(t * 7 + fase) * 0.15; u.brazos[0].rotation.x = -2.6 * (Math.sin(t * 7) > 0 ? 1 : 0.5); u.brazos[1].rotation.x = -2.6 * (Math.sin(t * 7) > 0 ? 0.5 : 1); u.piernas[0].rotation.x = Math.sin(t * 7 + fase) * 0.5; u.piernas[1].rotation.x = -Math.sin(t * 7 + fase) * 0.5; }
  else if(pose === 5){ girar(0); u.brazos.forEach(b => { b.rotation.x = -2.9; }); }
  else if(pose === 1){ // en la hamaca: péndulo (mismo vaivén que el 2D), con la hamaca y las sogas
    girar(0); const th = Math.sin(t * 2.4 + fase) * 0.5, L = 6.2, barra = 8.2;
    g.position.set(X, a.y + barra, Z); u.bal.rotation.x = -th; u.cuerpo.position.y = -L - P3_AV.CAD + 0.35; u.hamaca.visible = true;
    u.piernas.forEach(p => { p.rotation.x = -1.2 + th * 0.4; }); u.brazos.forEach(b => { b.rotation.x = -0.7; });
    u.sombra.position.set(0, 0.06 - barra, 0);
  }
  else if(pose === 6){ // subibaja: cada uno mira al que tiene enfrente
    girar(x < PLZ_SB.cx ? Math.PI / 2 : -Math.PI / 2); const alto = plazaSubibajaAlto(x);
    u.cuerpo.position.y = 0.55 + alto * 0.09 + 0.2; u.piernas.forEach(p => { p.rotation.x = -1.35; }); u.brazos.forEach(b => { b.rotation.x = -1.0; });
  }
  g.rotation.y = a.rumbo;
  // cara: la mirada del dibujo del avatar mira siempre a la cámara y se da vuelta según para dónde camina
  const sd = Math.sin(a.rumbo - p3.yaw); if(Math.abs(sd) > 0.3) a.dirPant = sd > 0 ? 1 : -1;
  g.updateMatrixWorld(true);
  const pq = p3.pq; u.cuerpo.getWorldQuaternion(pq); pq.invert(); u.cabeza.quaternion.copy(pq).multiply(p3.cam.quaternion);
  u.cabeza.scale.x = a.dirPant;
  u.boca.visible = !!burbuja; if(burbuja){ u.boca.scale.set(1, 0.5 + Math.abs(Math.sin(t * 14)) * 1.4, 1); }
  p3AvatarImagenes(g, 'normal');
  // torta de cumpleaños, bebidas y brindis
  const clave = ex ? [ex.cumple ? 1 : 0, ex.bebida || '', ex.brindis ? 1 : 0].join('|') : '';
  if(a.exClave !== clave){
    a.exClave = clave; while(u.extras.children.length) u.extras.remove(u.extras.children[0]);
    if(ex){
      const ic = (em, tam, esc, px, py, pz) => { const sp = p3Etiqueta(em, { tam, fondo: 'rgba(255,255,255,0)', escala: esc }); sp.position.set(px, py, pz); u.extras.add(sp); };
      if(ex.cumple) ic('🎂', 40, 22, 1.9, 5.4, 0); if(ex.bebida) ic(ex.bebida, 30, 26, -2.1, 3.0, 0.4); if(ex.brindis) ic('🥂', 46, 20, 0, 5.6, 0);
    }
  }
  // nombre y burbuja
  if(a.nombre !== nombre){ if(a.nombreSp) g.remove(a.nombreSp); a.nombre = nombre; a.nombreSp = p3Etiqueta(nombre, { tam: 24, escala: 34 }); g.add(a.nombreSp); }
  if(a.burbuja !== (burbuja || null)){ if(a.burbujaSp) g.remove(a.burbujaSp); a.burbuja = burbuja || null; a.burbujaSp = null; if(burbuja){ a.burbujaSp = p3Etiqueta(burbuja, { tam: 26, fondo: '#ffffff', color: '#0F2A4D', escala: 30 }); g.add(a.burbujaSp); } }
  // las etiquetas viven dentro del grupo: si el grupo cuelga de la barra de la hamaca, se las baja a donde está el personaje
  const bajar = pose === 1 ? -7.35 : 0;
  if(a.nombreSp) a.nombreSp.position.set(0, 7.0 + bajar, 0);
  if(a.burbujaSp) a.burbujaSp.position.set(0, 8.8 + bajar, 0);
  u.extras.position.y = bajar;
}

function p3Cuadro(dt){
  p3.t += dt;
  const ahoraMs = performance.now(), ahoraServidor = plazaAhora();
  // cámara
  const tx = plz.yo.x * P3.K, tz = plz.yo.y * P3.K;
  if(!p3.mira) p3.mira = new THREE.Vector3(tx, 2, tz); else { p3.mira.x += (tx - p3.mira.x) * Math.min(1, dt * 6); p3.mira.z += (tz - p3.mira.z) * Math.min(1, dt * 6); }
  const cm = P3_CAM[p3.modo] || P3_CAM[0], dist = cm.d * p3.zoom, alto = cm.a * p3.zoom;
  if(cm.auto && plz.caminando && p3.avatares.yo){ let da = (p3.avatares.yo.rumbo + Math.PI) - p3.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); p3.yaw += da * Math.min(1, dt * 1.8); }
  const cx = p3.mira.x + Math.sin(p3.yaw) * dist, cz = p3.mira.z + Math.cos(p3.yaw) * dist;
  p3.cam.position.set(Math.max(-2, Math.min(PLZ.W * P3.K + 2, cx)), alto, cz); p3.cam.lookAt(p3.mira.x, 2.2, p3.mira.z - (cm.d < 6 ? 0.5 : 2));
  p3.cam.updateMatrixWorld(true);
  if(p3.cielo) p3.cielo.position.copy(p3.cam.position);
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
  // las hamacas vacías se mecen; las que tienen a alguien se esconden (esa persona trae la suya)
  if(p3.hamacas.length){ const oc = plazaPosOcupadas(1); p3.hamacas.forEach(h => { h.g.visible = !oc.some(o => Math.abs(o.x - h.x) < 8 && Math.abs(o.y - h.y) < 8); }); }
  p3.anim.forEach(f => f(p3.t));
  if(plz.buscado && typeof microDibujarBuscado === 'function') microDibujarBuscado(P3_NULO, ahoraMs);
  const bo = plz.buscado && plz.otros[plz.buscado.a];
  if(p3.marca){ p3.marca.visible = !!bo; if(bo){ p3.marca.position.set(bo.x * P3.K, 0, bo.y * P3.K); p3.marca.children[1].position.y = 9 + Math.abs(Math.sin(p3.t * 7)) * 0.7; const k = 1 + 0.12 * Math.sin(p3.t * 7); p3.marca.children[0].scale.set(k, k, k); } }
  const n = p3Noche(); p3.faroles.forEach(g => { g.material.opacity = 0.14 + 0.8 * n; });
  const cerca = plz.puerta ? plz.puerta.id : null;
  p3.zonas.forEach(z => { const on = cerca && z.id === cerca; z.mesh.material.opacity = z.base + (on ? 0.35 + 0.25 * Math.sin(p3.t * 7) : 0); const k = on ? 1 + 0.07 * Math.sin(p3.t * 7) : 1; z.mesh.scale.set(k, k, k); });
  Object.keys(p3.carteles).forEach(id => { const k = id === cerca ? 1.1 + 0.05 * Math.sin(p3.t * 7) : 1; p3.carteles[id].scale.set(k, k, k); });
  if(p3.destino){ if(plz.obj){ p3.destino.visible = true; p3.destino.position.set(plz.obj.x * P3.K, 0.12, plz.obj.y * P3.K); const k = 1 + 0.2 * Math.sin(p3.t * 8); p3.destino.scale.set(k, k, k); } else p3.destino.visible = false; }
  p3.nubes.forEach((c, i) => { c.position.x += dt * (1.2 + i * 0.15); if(c.position.x > PLZ.W * P3.K + 30) c.position.x = -30; });
  // luz de día o de noche
  if(p3.luz){
    p3.luz.intensity = 0.6 - 0.1 * n; p3.sol.intensity = 0.4 - 0.22 * n;
    p3.luz.color.set(0xeaf4ff).lerp(P3_NC.hemi, n); p3.luz.groundColor.set(0x8a9a7a).lerp(P3_NC.suelo, n); p3.sol.color.set(0xfff4e0).lerp(P3_NC.sol, n);
  }
  const nn = Math.max(0, n - 0.04) / 0.96;
  if(p3.luzMesh) p3.luzMesh.material.opacity = nn * 0.9;
  if(p3.matVentana) p3.matVentana.color.set(0xBFE3FF).lerp(P3_NC.vent, n);
  p3.brillosN.forEach(b => { if(b.sp) b.sp.material.opacity = b.k * (0.12 + 0.88 * n); if(b.pts) b.pts.material.opacity = 0.35 + 0.65 * n; });
  if(p3.estrellas){ p3.estrellas.material.opacity = nn; p3.luna.material.opacity = nn * 0.9; }
  if(p3.montes) p3.montes.position.set(p3.cam.position.x, 0, p3.cam.position.z);
  { const tk = 1 - 0.5 * n; Object.keys(p3.avatares).forEach(k => { const u = p3.avatares[k].g.userData; [u.atras, u.frente, u.ghost].forEach(m => { if(m) m.material.color.setRGB(Math.min(1, tk * 0.95 + 0.03), Math.min(1, tk * 0.97 + 0.03), Math.min(1, tk + 0.1)); }); }); }
  if(Math.abs(n - p3.nochePrev) > 0.02){ p3.nochePrev = n; p3CieloColores(n); }
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
    await plaza3dCargar(); p3InitColores();
    const test = document.createElement('canvas');
    if(!(test.getContext('webgl') || test.getContext('experimental-webgl'))) throw new Error('Este celular no soporta 3D');
    const canvas = document.createElement('canvas'); canvas.className = 'plz-canvas3d';
    const pr = Math.min(1.75, window.devicePixelRatio || 1);
    p3.r = new THREE.WebGLRenderer({ canvas, antialias: pr < 1.5, powerPreference: 'low-power' });
    p3.r.setPixelRatio(pr); p3.r.setSize(PLZ.VW, PLZ.VH, false);
    p3.escena = new THREE.Scene(); p3.cam = new THREE.PerspectiveCamera(50, PLZ.VW / PLZ.VH, 0.5, 260); p3.canvas = canvas; p3.pq = new THREE.Quaternion();
    p3.mira = null; p3.yaw = 0; p3.t = 0; p3.fps = { t: 0, n: 0, listo: false };
    if(plz.canvas) plz.canvas.style.display = 'none';
    caja.appendChild(canvas);
    const bc = document.createElement('button'); bc.className = 'plz-b3cam'; bc.textContent = '🎥';
    bc.onclick = ev => { ev.stopPropagation(); p3.modo = (p3.modo + 1) % P3_CAM.length; bc.textContent = '🎥 ' + P3_CAM[p3.modo].n; clearTimeout(p3.tBtn); p3.tBtn = setTimeout(() => { bc.textContent = '🎥'; }, 1800); };
    caja.appendChild(bc); p3.btnCam = bc;
    { let guardado = 'auto'; try { guardado = localStorage.getItem('busmac-plaza3d-noche') || 'auto'; } catch(e){}
      const ESTADOS = { auto: ['⏱️ Auto', null], noche: ['🌙 Noche', 1], dia: ['☀️ Día', 0] }, orden = ['auto', 'noche', 'dia'];
      let est = ESTADOS[guardado] ? guardado : 'auto'; p3.nocheMan = ESTADOS[est][1];
      const bn = document.createElement('button'); bn.className = 'plz-b3cam plz-b3noche'; bn.textContent = est === 'auto' ? '🌙' : ESTADOS[est][0];
      bn.onclick = ev => { ev.stopPropagation(); est = orden[(orden.indexOf(est) + 1) % 3]; p3.nocheMan = ESTADOS[est][1]; bn.textContent = ESTADOS[est][0]; try { localStorage.setItem('busmac-plaza3d-noche', est); } catch(e){} clearTimeout(p3.tBtn2); p3.tBtn2 = setTimeout(() => { bn.textContent = est === 'auto' ? '🌙' : ESTADOS[est][0]; }, 1800); };
      caja.appendChild(bn); p3.btnNoche = bn; }
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
  if(p3.btnNoche && p3.btnNoche.parentNode) p3.btnNoche.parentNode.removeChild(p3.btnNoche); p3.btnNoche = null;
  p3.r = null; p3.canvas = null; p3.escena = null; p3.avatares = {}; p3.anim = []; p3.solidos = []; p3.plat = [];
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
