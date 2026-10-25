// Plaza 3D - modelos: el "estilo Bus Coin" en 3D.
//
// Para que el 3D se parezca al 2D dibujado: materiales tipo dibujo animado (3 o 4 tonos de luz, sin brillos), cada pieza con
// un contorno oscuro como el de los personajes del 2D, formas redondeadas (nada de cubos afilados) y el personaje armado con la
// cara, el pelo, la gorra, los anteojos y la remera REALES del avatar del jugador (las mismas imágenes que usa el 2D).
//
// Rendimiento: lo que no se mueve (casas, árboles, bancos...) se arma como piezas sueltas y al final se junta todo en UNA sola
// malla con colores por vértice (más una para los contornos). Lo que se mueve se marca con userData.vivo y no se junta.

const P3M = { T: 0.11 };           // grosor del contorno (en unidades 3D; 1 unidad = 10 px del 2D)
const P3G = {};                    // geometrías en caché
const P3_CONT = 0x2a1a3a;          // color del contorno (el mismo violeta oscuro del 2D)
let P3_GRAD = null, P3_MCONT = null;

function p3Grad(){
  if(P3_GRAD) return P3_GRAD;
  const t = new THREE.DataTexture(new Uint8Array([70, 140, 205, 255]), 4, 1, THREE.LuminanceFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return (P3_GRAD = t);
}
function p3MatCont(){ return P3_MCONT || (P3_MCONT = new THREE.MeshBasicMaterial({ color: P3_CONT, side: THREE.BackSide })); }
function p3MatToon(c, extra){ return new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(c), gradientMap: p3Grad() }, extra || {})); }

// Caja con las esquinas redondeadas (normales suaves: se ve "mullida", no de cubo).
function p3GeoCaja(w, h, d, r){
  const k = ['c', w, h, d, r].map(v => typeof v === 'number' ? v.toFixed(3) : v).join('|');
  if(P3G[k]) return P3G[k];
  const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2).toNonIndexed();
  const hx = w / 2, hy = h / 2, hz = d / 2, ix = Math.max(0, hx - r), iy = Math.max(0, hy - r), iz = Math.max(0, hz - r);
  const pos = g.attributes.position, nor = g.attributes.normal, v = new THREE.Vector3(), q = new THREE.Vector3();
  for(let i = 0; i < pos.count; i++){
    v.fromBufferAttribute(pos, i);
    q.set(Math.max(-ix, Math.min(ix, v.x)), Math.max(-iy, Math.min(iy, v.y)), Math.max(-iz, Math.min(iz, v.z)));
    v.sub(q);
    if(v.lengthSq() > 1e-8){ v.normalize(); nor.setXYZ(i, v.x, v.y, v.z); q.addScaledVector(v, r); pos.setXYZ(i, q.x, q.y, q.z); }
  }
  return (P3G[k] = g);
}
function p3GeoEsf(r){
  const seg = r < 0.3 ? 8 : r < 1 ? 12 : 16, k = 'e|' + r.toFixed(3);
  return P3G[k] || (P3G[k] = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.66)));
}
function p3GeoCil(rt, rb, h){
  const rm = Math.max(rt, rb), seg = rm < 0.25 ? 6 : rm < 1 ? 10 : 16, k = 'y|' + [rt, rb, h].map(v => v.toFixed(3)).join('|');
  return P3G[k] || (P3G[k] = new THREE.CylinderGeometry(rt, rb, h, seg));
}
function p3GeoCono(r, h){
  const k = 'o|' + r.toFixed(3) + '|' + h.toFixed(3);
  return P3G[k] || (P3G[k] = new THREE.ConeGeometry(r, h, r < 0.5 ? 8 : 14));
}

// Malla con su contorno (un casco un poquito más grande, pintado de oscuro y visto "desde adentro").
function p3Malla(geo, color, esc, x, y, z, padre, sinContorno){
  const m = new THREE.Mesh(geo, p3MatToon(color));
  m.position.set(x, y, z);
  if(!sinContorno){
    const o = new THREE.Mesh(geo, p3MatCont()); o.scale.set(esc[0], esc[1], esc[2]); o.userData.contorno = true; m.add(o);
  }
  (padre || p3.escena).add(m);
  return m;
}
const p3Grosor = (...dims) => Math.min(P3M.T, Math.min(...dims) * 0.3);

function p3Caja(w, h, d, c, x, y, z, padre, r){
  const t = p3Grosor(w, h, d), rr = r != null ? r : Math.min(0.3, Math.min(w, h, d) * 0.22);
  return p3Malla(p3GeoCaja(w, h, d, Math.min(rr, Math.min(w, h, d) * 0.48)), c, [1 + 2 * t / w, 1 + 2 * t / h, 1 + 2 * t / d], x, y, z, padre);
}
function p3Esf(r, c, x, y, z, padre){
  const t = p3Grosor(r * 2), s = 1 + t / r;
  return p3Malla(p3GeoEsf(r), c, [s, s, s], x, y, z, padre);
}
function p3Cil(rt, rb, h, seg, c, x, y, z, padre){
  const rm = Math.max(rt, rb), t = p3Grosor(rm * 2, h), s = 1 + t / rm;
  return p3Malla(p3GeoCil(rt, rb, h), c, [s, 1 + 2 * t / h, s], x, y, z, padre);
}
function p3Cono(r, h, c, x, y, z, padre){
  const t = p3Grosor(r * 2, h), s = 1 + t / r;
  return p3Malla(p3GeoCono(r, h), c, [s, 1 + 2 * t / h, s], x, y, z, padre);
}
// Pieza sin contorno (cosas finas o brillantes)
function p3CajaSC(w, h, d, c, x, y, z, padre){ return p3Malla(p3GeoCaja(w, h, d, 0.01), c, null, x, y, z, padre, true); }

// ---- Sombras blandas en el piso (todas juntas en una sola malla) ----
function p3Sombra(x, z, rx, rz){ p3.sombras.push([x, z, rx, rz == null ? rx : rz]); }
function p3TexSombra(){
  if(P3G.texSombra) return P3G.texSombra;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(20,10,40,.42)'); g.addColorStop(0.6, 'rgba(20,10,40,.22)'); g.addColorStop(1, 'rgba(20,10,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (P3G.texSombra = new THREE.CanvasTexture(c));
}

// ---- Junta todo lo fijo en pocas mallas ----
function p3Fusionar(){
  const esc = p3.escena; esc.updateMatrixWorld(true);
  const cuerpo = { pos: [], nor: [], col: [] }, cont = { pos: [] }, quitar = [];
  const m4 = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
  const agregar = (lote, h, conColor) => {
    const g = h.geometry, pos = g.attributes.position, nor = g.attributes.normal, idx = g.index, n = idx ? idx.count : pos.count;
    m4.copy(h.matrixWorld); nm.getNormalMatrix(m4);
    const c = conColor ? h.material.color : null;
    for(let i = 0; i < n; i++){
      const k = idx ? idx.getX(i) : i;
      v.fromBufferAttribute(pos, k).applyMatrix4(m4); lote.pos.push(v.x, v.y, v.z);
      if(conColor){ v.fromBufferAttribute(nor, k).applyMatrix3(nm).normalize(); lote.nor.push(v.x, v.y, v.z); lote.col.push(c.r, c.g, c.b); }
    }
  };
  const visitar = (o, vivo) => {
    o.children.slice().forEach(h => {
      const vh = vivo || !!h.userData.vivo;
      if(h.isMesh && !vh && h.visible && h.material){
        if(h.userData.contorno){ agregar(cont, h, false); quitar.push(h); }
        else if(h.material.isMeshToonMaterial && !h.material.map && !h.material.transparent){ agregar(cuerpo, h, true); quitar.push(h); }
      }
      if(h.children.length) visitar(h, vh);
    });
  };
  visitar(esc, false);
  quitar.forEach(h => { if(h.parent) h.parent.remove(h); });
  if(cuerpo.pos.length){
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(cuerpo.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(cuerpo.nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cuerpo.col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: p3Grad() })); m.frustumCulled = false; esc.add(m);
  }
  if(cont.pos.length){
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(cont.pos, 3));
    const m = new THREE.Mesh(geo, p3MatCont()); m.frustumCulled = false; esc.add(m);
  }
  if(p3.sombras.length){
    const pos = [], uv = [];
    p3.sombras.forEach(([x, z, rx, rz]) => {
      [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, -1, 0, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].forEach(([a, b, u, w]) => { pos.push(x + a * rx, 0.05, z + b * rz); uv.push(u, 1 - w); });
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: p3TexSombra(), transparent: true, depthWrite: false })); m.renderOrder = 1; m.frustumCulled = false; esc.add(m);
  }
}

// Junta las piezas de un grupo (una pierna, un brazo, el torso) en una sola malla + un solo contorno, en las coordenadas del grupo.
function p3FusionarLocal(raiz){
  const cuerpo = { pos: [], nor: [], col: [] }, cont = { pos: [] }, quitar = [];
  const nm = new THREE.Matrix3(), v = new THREE.Vector3();
  const agregar = (lote, h, m4, conColor) => {
    const g = h.geometry, pos = g.attributes.position, nor = g.attributes.normal, idx = g.index, n = idx ? idx.count : pos.count;
    nm.getNormalMatrix(m4); const c = conColor ? h.material.color : null;
    for(let i = 0; i < n; i++){
      const k = idx ? idx.getX(i) : i;
      v.fromBufferAttribute(pos, k).applyMatrix4(m4); lote.pos.push(v.x, v.y, v.z);
      if(conColor){ v.fromBufferAttribute(nor, k).applyMatrix3(nm).normalize(); lote.nor.push(v.x, v.y, v.z); lote.col.push(c.r, c.g, c.b); }
    }
  };
  const rec = (o, acc) => o.children.slice().forEach(h => {
    h.updateMatrix(); const mm = acc.clone().multiply(h.matrix);
    if(h.isMesh && h.material){
      if(h.userData.contorno){ agregar(cont, h, mm, false); quitar.push(h); }
      else if(h.material.isMeshToonMaterial && !h.material.map && !h.material.transparent){ agregar(cuerpo, h, mm, true); quitar.push(h); }
    }
    if(h.children.length) rec(h, mm);
  });
  rec(raiz, new THREE.Matrix4());
  quitar.forEach(h => { if(h.parent) h.parent.remove(h); });
  if(cuerpo.pos.length){
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(cuerpo.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(cuerpo.nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cuerpo.col, 3));
    raiz.add(new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: p3Grad() })));
  }
  if(cont.pos.length){ const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(cont.pos, 3)); raiz.add(new THREE.Mesh(geo, p3MatCont())); }
}

// ---- Imágenes del avatar (las mismas del 2D) como texturas ----
const P3_TEX_IMG = new WeakMap();
function p3TexImg(img){
  if(!img || !(img.complete && img.naturalWidth)) return null;
  let t = P3_TEX_IMG.get(img);
  if(!t){ t = new THREE.Texture(img); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; P3_TEX_IMG.set(img, t); }
  return t;
}

// ---- Personaje: cuerpo 3D redondeado + cabeza, cara y remera del avatar del jugador ----
// Medidas: pies en y = 0, cadera en 1.5, hombros en 3.3, cabeza centrada en 4.5 (alto total ~ 5.9).
const P3_AV = { CAD: 1.5, HOM: 3.3, CAB: 4.5, CW: 2.6, CH: 2.83 };

function p3Avatar(puesto, esYo){
  const p = Object.assign({}, typeof AV_PUESTO_INICIAL !== 'undefined' ? AV_PUESTO_INICIAL : {}, puesto || {});
  const piel = AV_PIELES[p.piel] || AV_PIELES[1];
  const remera = AV_IDX.remera[p.remera] || AV_IDX.remera.basica;
  const manga = remera.mangas || remera.color, mangaLarga = !!remera.mangas && ['dorada', 'egresado', 'chofer'].indexOf(remera.id) >= 0;
  const g = new THREE.Group(), bal = new THREE.Group(), cuerpo = new THREE.Group(); g.add(bal); bal.add(cuerpo);
  const previo = P3M.T; P3M.T = 0.06;
  // piernas (jean) y zapatillas
  const piernas = [-1, 1].map(l => {
    const pg = new THREE.Group(); pg.position.set(l * 0.5, P3_AV.CAD, 0); cuerpo.add(pg);
    p3Cil(0.38, 0.34, 0.95, 10, '#34476F', 0, -0.52, 0, pg); p3Esf(0.38, '#34476F', 0, -0.05, 0, pg);
    p3Caja(0.82, 0.46, 1.35, '#ffffff', 0, -1.24, 0.22, pg, 0.2); p3Caja(0.86, 0.16, 1.4, '#5D6577', 0, -1.47, 0.22, pg, 0.07);
    return pg;
  });
  // torso: color de la remera + el dibujo de la remera (logo, rayas, estrellas...) al frente
  const tor = new THREE.Group(); cuerpo.add(tor);
  p3Caja(1.9, 0.5, 1.2, '#3B4F82', 0, P3_AV.CAD + 0.1, 0, tor, 0.22);
  const torso = p3Caja(1.9, 2.1, 1.2, remera.color, 0, 2.5, 0, tor, 0.5);
  const decalTorso = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.2), p3MatToon('#ffffff', { transparent: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  decalTorso.position.set(0, 2.45, 0.62); decalTorso.visible = false; cuerpo.add(decalTorso);
  p3Cil(0.3, 0.34, 0.5, 8, piel, 0, 3.7, 0, tor);
  // brazos
  const brazos = [-1, 1].map(l => {
    const bg = new THREE.Group(); bg.position.set(l * 1.2, P3_AV.HOM, 0); cuerpo.add(bg);
    p3Esf(0.4, manga, 0, 0, 0, bg); p3Cil(0.32, 0.3, 0.85, 10, manga, 0, -0.48, 0, bg);
    p3Cil(0.27, 0.25, 0.8, 10, mangaLarga ? manga : piel, 0, -1.22, 0, bg); p3Esf(0.31, piel, 0, -1.72, 0, bg);
    return bg;
  });
  P3M.T = previo;
  piernas.forEach(p3FusionarLocal); brazos.forEach(p3FusionarLocal); p3FusionarLocal(tor);
  // cabeza: dos dibujos (pelo de atrás y cara con pelo/gorra/anteojos) que siempre miran a la cámara
  const cabeza = new THREE.Group(); cabeza.position.set(0, P3_AV.CAB, 0); cuerpo.add(cabeza);
  const plano = (z, dep) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(P3_AV.CW, P3_AV.CH), new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: true })); m.position.set(0, -0.04 * P3_AV.CH, z); m.visible = false; cabeza.add(m); return m; };
  const atras = plano(-0.03), frente = plano(0.0);
  // boca que se mueve cuando habla
  const boca = new THREE.Mesh(new THREE.CircleGeometry(0.17, 12), new THREE.MeshBasicMaterial({ color: 0x5A1520 })); boca.position.set(0, -0.12 * P3_AV.CH, 0.01); boca.visible = false; frente.add(boca);
  let ghost = null;
  if(esYo){ // "vista de rayos X": si una casa te tapa, igual se ve tu cara
    ghost = new THREE.Mesh(new THREE.PlaneGeometry(P3_AV.CW, P3_AV.CH), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthTest: false, side: THREE.DoubleSide }));
    ghost.position.set(0, -0.04 * P3_AV.CH, 0.02); ghost.renderOrder = 6; ghost.visible = false; cabeza.add(ghost);
  }
  // hamaca (aparece solo cuando está hamacándose)
  const hamaca = new THREE.Group(); hamaca.visible = false; cuerpo.add(hamaca);
  p3CajaSC(2.3, 0.32, 1.3, '#E5586E', 0, P3_AV.CAD - 0.35, 0, hamaca); [-0.95, 0.95].forEach(x => p3CajaSC(0.08, 6.2, 0.08, '#444444', x, P3_AV.CAD - 0.35 + 3.1, 0, hamaca));
  // sombra blanda en el piso
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: p3TexSombra(), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.06; sombra.renderOrder = 2; g.add(sombra);
  const extras = new THREE.Group(); g.add(extras);
  g.userData = { p, cuerpo, bal, piernas, brazos, cabeza, atras, frente, boca, ghost, decalTorso, torsoMesh: torso, hamaca, sombra, extras, firma: JSON.stringify(p), esYo };
  return g;
}

// Pone en el personaje las imágenes de su avatar cuando ya cargaron.
function p3AvatarImagenes(g, expr){
  const u = g.userData, p = u.p;
  if(typeof avcImagen !== 'function') return;
  const ta = p3TexImg(avcImagen(p, 'atras')), tf = p3TexImg(avcImagen(p, 'frente', expr || 'normal', 0)), tt = p3TexImg(avcImagen(p, 'torso'));
  if(ta && u.atras.material.map !== ta){ u.atras.material.map = ta; u.atras.material.needsUpdate = true; u.atras.visible = true; }
  if(tf && u.frente.material.map !== tf){ u.frente.material.map = tf; u.frente.material.needsUpdate = true; u.frente.visible = true; if(u.ghost){ u.ghost.material.map = tf; u.ghost.material.needsUpdate = true; u.ghost.visible = true; } }
  if(tt && u.decalTorso.material.map !== tt){ u.decalTorso.material.map = tt; u.decalTorso.material.needsUpdate = true; u.decalTorso.visible = true; }
}
