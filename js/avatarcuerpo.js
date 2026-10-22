// Avatar de cuerpo entero (para la Bus-queda): el mismo personaje de "Mi personaje" (piel, pelo, remera, gorra,
// anteojos...) pero con proporciones más humanas: cuello, hombros, brazos con codo y manos con dedos, piernas con
// zapatillas, y caras con cejas para que se note el miedo, la sorpresa o el alivio.
//
// Se arma en un canvas: la cabeza y la remera son imágenes (las dibuja el SVG del avatar de siempre, así los
// accesorios y las remeras son exactamente los del personaje del jugador) y el resto (brazos, manos, piernas,
// zapatillas) se dibuja con trazos para poder animarlo: caminar, agarrar, temblar de miedo, alzar los brazos.
//
// Unidades del personaje: los pies en (0, 0) y la punta de la cabeza en (0, -200); mira hacia +x (para el otro lado
// se espeja). 'sc' es cuántos píxeles vale cada unidad.

const AVC = {
  HS: 0.85,                         // escala de la cabeza (el SVG del avatar está dibujado en un cuadro de 100)
  CABEZA: { x: 0, y: -176 },        // centro de la cabeza
  CUELLO_Y: -152, HOMBRO_Y: -143, HOMBRO_X: 23, CADERA_Y: -92, CADERA_X: 10,
  BRAZO1: 32, BRAZO2: 28, JEAN: '#3B4F82', JEAN_OSC: '#243158', CONTORNO: 'rgba(30,18,40,.45)',
  TORSO_W: 50, TORSO_H: 58,
};
const AVC_EXPRESIONES = ['normal', 'serio', 'curioso', 'preocupado', 'miedo', 'terror', 'alivio', 'sorpresa'];
const AVC_IMGS = {};

function avcPuesto(p){ return Object.assign({}, AV_PUESTO_INICIAL, p || {}); }
function avcClavePuesto(p){ p = avcPuesto(p); return [p.piel, p.peloEstilo, p.peloColor, p.cara, p.remera, p.gorra, p.caraAcc, p.manoAcc === 'mochila' ? 'm' : ''].join('|'); }

// Cejas y caras con expresión, dibujadas en el cuadro de la cabeza del avatar (cabeza centrada en 50, 46).
function avcCara(expr, p, mira){
  p = avcPuesto(p);
  if(!expr || expr === 'normal') return avCara(p.cara);
  const ojo = '#2A1B12', cejaC = AV_COLORES_PELO[p.peloColor] || '#2A1B12';
  const ceja = d => `<path d="${d}" stroke="${cejaC === '#E2B24A' || cejaC === '#D6401E' ? '#6B3E12' : cejaC}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const mejillas = `<circle cx="33" cy="58" r="4.2" fill="rgba(255,110,110,.28)"/><circle cx="67" cy="58" r="4.2" fill="rgba(255,110,110,.28)"/>`;
  const m = (mira || 0) * 1.8;
  const ojoBlanco = (rx, ry, pr) => [40, 60].map(cx => `<ellipse cx="${cx}" cy="48" rx="${rx}" ry="${ry}" fill="#fff" stroke="${ojo}" stroke-width="1.3"/><circle cx="${cx + m}" cy="${48 + (mira ? 0 : 0.6)}" r="${pr}" fill="${ojo}"/><circle cx="${cx + m + 0.7}" cy="${47.2}" r="0.7" fill="#fff"/>`).join('');
  const ojoNormal = () => [40, 60].map(cx => `<ellipse cx="${cx}" cy="48" rx="3.2" ry="4.2" fill="${ojo}"/><circle cx="${cx + 1}" cy="46.5" r="1.1" fill="#fff"/>`).join('');
  if(expr === 'serio') return `${ojoNormal()}${ceja('M33 41 L46 43.5')}${ceja('M67 41 L54 43.5')}<path d="M43 61 H57" stroke="${ojo}" stroke-width="2.2" stroke-linecap="round"/>`;
  if(expr === 'curioso') return `${ojoBlanco(3.8, 4.6, 2)}${ceja('M33 36 Q40 31 46 35')}${ceja('M54 41 L67 39')}<path d="M44 61 Q51 58 58 62" stroke="${ojo}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  if(expr === 'preocupado') return `${ojoBlanco(4, 5, 1.9)}${ceja('M33 40 L46 35.5')}${ceja('M67 40 L54 35.5')}<path d="M43 63 Q50 58.5 57 63" stroke="${ojo}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`;
  if(expr === 'miedo') return `${ojoBlanco(5.4, 6.6, 1.8)}${ceja('M32 39 L46 33')}${ceja('M68 39 L54 33')}${mejillas}<ellipse cx="50" cy="62" rx="3.6" ry="4.8" fill="#5A1520"/><ellipse cx="50" cy="64" rx="2" ry="1.8" fill="#C4546A"/>`;
  if(expr === 'terror') return `${ojoBlanco(6.2, 7.6, 1.2)}${ceja('M31 37 L46 29.5')}${ceja('M69 37 L54 29.5')}<path d="M37 57 Q50 54 63 57 Q62 77 50 78 Q38 77 37 57 Z" fill="#4A0F1A"/><path d="M39 58.2 Q50 55.8 61 58.2 L60 61.5 Q50 59.4 40 61.5 Z" fill="#fff"/><ellipse cx="50" cy="72" rx="6" ry="3.4" fill="#C4546A"/>`;
  if(expr === 'alivio') return `<path d="M35 50 Q40 45 45 50" stroke="${ojo}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M55 50 Q60 45 65 50" stroke="${ojo}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${ceja('M34 40 Q40 37 46 39')}${ceja('M66 40 Q60 37 54 39')}${mejillas}<path d="M40 58 Q50 68 60 58" stroke="${ojo}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M74 33 Q77.5 38 74 41 Q70.5 38 74 33 Z" fill="#8FD3FF"/>`;
  if(expr === 'sorpresa') return `${ojoBlanco(4.6, 5.6, 1.8)}${ceja('M33 36.5 Q40 32 46 36')}${ceja('M67 36.5 Q60 32 54 36')}<ellipse cx="50" cy="62" rx="3.4" ry="4.6" fill="#5A1520"/>`;
  return avCara(p.cara);
}

// Arma un SVG de la cabeza (capa 'atras' o 'frente') o de la remera, ya como imagen para el canvas.
function avcSvgAImagen(svg){
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img;
}
function avcSinDistorsion(deco, sx, sy){
  // Los logos son imágenes: se estiran junto con la remera, así que se les aplica la escala inversa.
  return deco.replace(/<image ([^>]*?)x="([\d.\-]+)" y="([\d.\-]+)" width="([\d.\-]+)" height="([\d.\-]+)"([^>]*)\/>/g, (m, a, x, y, w, h, z) => {
    const cx = +x + +w / 2, cy = +y + +h / 2;
    return `<g transform="translate(${cx} ${cy}) scale(${(1 / sx).toFixed(3)} ${(1 / sy).toFixed(3)}) translate(${-cx} ${-cy})">${m}</g>`;
  });
}

function avcImagen(p, tipo, expr, mira){
  p = avcPuesto(p);
  const clave = tipo + '#' + avcClavePuesto(p) + '#' + (expr || 'normal') + '#' + (mira || 0);
  if(AVC_IMGS[clave]) return AVC_IMGS[clave];
  const previo = AV_LOGO_SRC, datos = typeof avLogoComoDatos === 'function' ? avLogoComoDatos() : null;
  if(datos) AV_LOGO_SRC = datos;
  const piel = AV_PIELES[p.piel] || AV_PIELES[1], pelo = AV_COLORES_PELO[p.peloColor] || AV_COLORES_PELO[1];
  const remera = AV_IDX.remera[p.remera] || AV_IDX.remera.basica;
  const gorra = p.gorra && AV_IDX.gorra[p.gorra], caraAcc = p.caraAcc && AV_IDX.caraAcc[p.caraAcc];
  const ns = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
  let svg;
  if(tipo === 'atras'){
    svg = `<svg ${ns} viewBox="4 0 92 100" width="276" height="300">${avPeloAtras(p.peloEstilo, pelo)}</svg>`;
  } else if(tipo === 'frente'){
    svg = `<svg ${ns} viewBox="4 0 92 100" width="276" height="300"><circle cx="23" cy="49" r="5.5" fill="${piel}"/><circle cx="77" cy="49" r="5.5" fill="${piel}"/><circle cx="50" cy="46" r="27" fill="${piel}"/>${avcCara(expr, p, mira)}${avPeloFrente(p.peloEstilo, pelo)}${caraAcc ? caraAcc.svg() : ''}${gorra ? gorra.svg() : ''}</svg>`;
  } else { // torso
    const W = AVC.TORSO_W, H = AVC.TORSO_H, sx = W / 52, sy = H / 44;
    const deco = remera.deco ? avcSinDistorsion(remera.deco('avc'), sx, sy) : '';
    const mochila = p.manoAcc === 'mochila' ? AV_IDX.manoAcc.mochila.svg() : '';
    svg = `<svg ${ns} viewBox="24 76 52 44" preserveAspectRatio="none" width="${W * 4}" height="${H * 4}"><defs><clipPath id="avct"><path d="${AV_TORSO}"/></clipPath></defs><path d="${AV_TORSO}" fill="${remera.color}"/><g clip-path="url(#avct)">${deco}${avcSinDistorsion(mochila, sx, sy)}</g></svg>`;
  }
  AV_LOGO_SRC = previo;
  return (AVC_IMGS[clave] = avcSvgAImagen(svg));
}

function avcListo(p, expr, mira){
  return ['atras', 'frente', 'torso'].every(t => { const i = avcImagen(p, t, expr, mira); return i.complete && i.naturalWidth; });
}
// Carga con anticipación las caras que se van a usar.
function avcPrecargar(p, exprs){
  avcImagen(p, 'atras'); avcImagen(p, 'torso');
  (exprs || AVC_EXPRESIONES).forEach(e => { avcImagen(p, 'frente', e, 0); });
}

// ---- Dibujo con trazos ----

function avcCapsula(ctx, x1, y1, x2, y2, w, color){
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = AVC.CONTORNO; ctx.lineWidth = w + 2.2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

// Mano: la palma, cuatro dedos y el pulgar. 'dx, dy' es la dirección del antebrazo. modo 'puno' = cerrada (agarra algo).
function avcMano(ctx, x, y, dx, dy, modo, piel, lado){
  ctx.save();
  ctx.translate(x, y); ctx.rotate(Math.atan2(-dx, dy));
  const L = (a, b, c, d, w) => avcCapsula(ctx, a, b, c, d, w, piel);
  if(modo === 'puno'){
    ctx.fillStyle = AVC.CONTORNO; ctx.beginPath(); ctx.ellipse(0, 6.5, 7.2, 7.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = piel; ctx.beginPath(); ctx.ellipse(0, 6.5, 6.2, 6.4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(80,40,20,.35)'; ctx.lineWidth = 1; [-2.8, 0, 2.8].forEach(i => { ctx.beginPath(); ctx.moveTo(i, 8.5); ctx.lineTo(i, 12); ctx.stroke(); });
    L(-3 * lado, 3, 1 * lado, 7.5, 3.2);
  } else {
    L(-3 * lado, 3.5, -7.6 * lado, 9, 3.4); // pulgar
    [[-3.6, 16.2], [-1.2, 17.6], [1.2, 17.2], [3.6, 14.8]].forEach(([fx, fy]) => L(fx * 0.8, 9, fx * 1.35, fy, 2.7));
    ctx.fillStyle = AVC.CONTORNO; ctx.beginPath(); ctx.ellipse(0, 6, 6.3, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = piel; ctx.beginPath(); ctx.ellipse(0, 6, 5.4, 6.1, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// Zapatilla blanca vista de tres cuartos; 'lado' (-1 o 1) hacia dónde apunta la punta.
function avcZapatilla(ctx, x, y, lado, giro){
  ctx.save();
  ctx.translate(x, y); ctx.rotate((giro || 0) * lado);
  const w = 24, h = 11;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(lado * 2, 1.2, w / 2, 3.4, 0, 0, 7); ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = AVC.CONTORNO;
  ctx.fillStyle = '#5D6577'; ctx.beginPath(); ctx.ellipse(lado * 3, -1.2, w / 2, 3.2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath();
  ctx.moveTo(-lado * 7, -h + 2); ctx.quadraticCurveTo(-lado * 9, -2, -lado * 8, -2.2);
  ctx.lineTo(lado * 12, -2.6); ctx.quadraticCurveTo(lado * 15, -4, lado * 11, -7.8); ctx.quadraticCurveTo(lado * 4, -h - 1, -lado * 3, -h + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#E8EDF7'; ctx.beginPath(); ctx.ellipse(lado * 9.4, -4.2, 4.2, 2.6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8691A8'; ctx.lineWidth = 1; [0, 1, 2].forEach(i => { ctx.beginPath(); ctx.moveTo(lado * (1 + i * 2.6), -h + 1.4 + i * 0.4); ctx.lineTo(lado * (3.4 + i * 2.6), -h + 3.6 + i * 0.4); ctx.stroke(); });
  ctx.restore();
}

// Pose para el estado actual: ángulos de los brazos (0 = colgando, 90 = horizontal hacia afuera, 180 = hacia arriba),
// pasos de las piernas, rebote del cuerpo, inclinación de la cabeza y temblor.
function avcPose(st){
  const t = st.t || 0, anim = st.anim || 'quieto';
  const camina = anim === 'camina', s = camina ? Math.sin(t * 8.5) : 0, resp = Math.sin(t * 2.1);
  const P = {
    bob: camina ? Math.abs(s) * 2.6 : resp * 0.7, inclina: camina ? s * 0.02 : 0, temblor: 0, salto: 0, torsoEsc: 1 + resp * 0.012,
    cabezaGiro: 0, cabezaY: 0,
    piernas: [{ dx: camina ? 5.5 * s : 0, lev: camina ? Math.max(0, s) * 8 : 0 }, { dx: camina ? -5.5 * s : 0, lev: camina ? Math.max(0, -s) * 8 : 0 }], // [delantera, trasera]
    d: { a1: 9 + (camina ? -s * 13 : resp * 1.5), a2: 5 + (camina ? -s * 18 : resp * 2), mano: 'abierta' },
    i: { a1: 9 + (camina ? s * 13 : -resp * 1.5), a2: 5 + (camina ? s * 18 : -resp * 2), mano: 'abierta' },
    expr: st.expr || 'normal',
  };
  if(anim === 'miedo' || anim === 'preocupado'){
    P.temblor = anim === 'miedo' ? 0.9 : 0.35; P.d = { a1: 30, a2: 205, mano: 'abierta' }; P.i = { a1: 30, a2: 205, mano: 'abierta' }; P.cabezaGiro = -0.04;
    P.piernas = [{ dx: 3, lev: 0 }, { dx: -3, lev: 0 }];
  } else if(anim === 'terror' || anim === 'susto'){
    P.temblor = 1.3; P.d = { a1: 150, a2: 168, mano: 'abierta' }; P.i = { a1: 150, a2: 168, mano: 'abierta' };
    P.salto = anim === 'susto' ? Math.max(0, 1 - (st.susto || 0)) * 16 : 0; P.cabezaGiro = 0.08;
  } else if(anim === 'alcanzar'){
    P.d = { a1: 98 + Math.sin(t * 5) * 2, a2: 92, mano: 'abierta' }; P.i = { a1: 12, a2: 6, mano: 'abierta' }; P.cabezaGiro = 0.05;
    P.piernas = [{ dx: 4, lev: 0 }, { dx: -4, lev: 0 }];
  } else if(anim === 'linterna'){
    P.d = { a1: 66, a2: 86, mano: 'puno' }; P.i = { a1: 14, a2: 8, mano: 'abierta' };
    if(camina){ P.d.a1 += s * 2; }
  } else if(anim === 'pensar'){
    P.d = { a1: 24, a2: 212, mano: 'puno' }; P.i = { a1: 12, a2: 6, mano: 'abierta' }; P.cabezaGiro = 0.1; P.torsoEsc = 1;
  } else if(anim === 'alivio'){
    P.bob = Math.sin(t * 2) * 0.9; P.d = { a1: 6, a2: 3, mano: 'abierta' }; P.i = { a1: 6, a2: 3, mano: 'abierta' }; P.cabezaGiro = 0.06;
  }
  if(anim === 'linterna' && !camina){ P.piernas = [{ dx: 3, lev: 0 }, { dx: -3, lev: 0 }]; }
  return P;
}

// Dibuja el personaje parado con los pies en (x, y). st = { dir: 1|-1, anim, t, expr, mira, susto, linterna }.
// Devuelve la posición (en píxeles de pantalla) de la mano que sostiene algo y la de la punta de la linterna.
function avcDibujar(ctx, p, x, y, sc, st){
  p = avcPuesto(p); st = st || {};
  const dir = st.dir < 0 ? -1 : 1, P = avcPose(st);
  const piel = AV_PIELES[p.piel] || AV_PIELES[1];
  const remera = AV_IDX.remera[p.remera] || AV_IDX.remera.basica, manga = remera.mangas || remera.color;
  const mangaLarga = !!remera.mangas && ['dorada', 'egresado', 'chofer'].indexOf(remera.id) >= 0;
  const expr = P.expr, mira = st.mira || 0;
  const imgA = avcImagen(p, 'atras'), imgF = avcImagen(p, 'frente', expr, mira), imgT = avcImagen(p, 'torso');
  const out = { mano: null, punta: null };

  // sombra en el piso
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 26 * sc, 6.5 * sc, 0, 0, 7); ctx.fill();
  const jx = P.temblor ? (Math.sin(st.t * 55) + Math.sin(st.t * 37)) * 0.5 * P.temblor : 0;
  ctx.translate(x + jx * sc, y - P.salto * sc);
  ctx.scale(sc * dir, sc);
  const B = -P.bob; // el cuerpo sube un poco al caminar

  // 1) pelo de atrás
  const IW = 92 * AVC.HS, IH = 100 * AVC.HS, hx = AVC.CABEZA.x - 46 * AVC.HS, hy = AVC.CABEZA.y - 46 * AVC.HS;
  const cabeza = (img) => {
    if(!(img.complete && img.naturalWidth)) return;
    ctx.save(); ctx.translate(0, AVC.CUELLO_Y + B); ctx.rotate(P.cabezaGiro + P.inclina); ctx.translate(0, -AVC.CUELLO_Y);
    ctx.drawImage(img, hx, hy, IW, IH);
    ctx.restore();
  };
  cabeza(imgA);

  // 2) piernas (jean) y zapatillas
  [[-1, P.piernas[1]], [1, P.piernas[0]]].forEach(([lado, pie]) => {
    const hxp = lado * AVC.CADERA_X, hyp = AVC.CADERA_Y + B * 0.6;
    const ax = hxp + lado * 4 + pie.dx * dir * 1.0, ay = -7 - pie.lev;
    avcCapsula(ctx, hxp, hyp, ax, ay, 16, AVC.JEAN);
    ctx.strokeStyle = AVC.JEAN_OSC; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax - 7, ay - 14); ctx.lineTo(ax + 7, ay - 14); ctx.stroke();
    avcZapatilla(ctx, ax + lado * 1.5, ay + 7, lado, 0.16);
  });

  // 3) torso
  if(imgT.complete && imgT.naturalWidth){
    ctx.save(); ctx.translate(0, AVC.CADERA_Y + B * 0.6); ctx.scale(1, P.torsoEsc);
    ctx.drawImage(imgT, -AVC.TORSO_W / 2, -AVC.TORSO_H, AVC.TORSO_W, AVC.TORSO_H);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-AVC.TORSO_W / 2 + 1, -3, AVC.TORSO_W - 2, 3);
    ctx.restore();
  }
  // 4) cuello y cabeza
  ctx.fillStyle = piel; ctx.beginPath(); ctx.moveTo(-6.5, AVC.CUELLO_Y + B - 8); ctx.lineTo(6.5, AVC.CUELLO_Y + B - 8); ctx.lineTo(7.5, AVC.CUELLO_Y + B + 5); ctx.lineTo(-7.5, AVC.CUELLO_Y + B + 5); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, AVC.CUELLO_Y + B - 5, 7, 4, 0, 0, Math.PI); ctx.fill();
  cabeza(imgF);

  // 5) brazos (arriba de todo, así las manos pueden taparte la cara)
  [['i', -1], ['d', 1]].forEach(([k, lado]) => {
    const a = P[k], r1 = a.a1 * Math.PI / 180, r2 = a.a2 * Math.PI / 180;
    const sx = lado * AVC.HOMBRO_X, sy = AVC.HOMBRO_Y + B * 0.7;
    const ex = sx + lado * Math.sin(r1) * AVC.BRAZO1, ey = sy + Math.cos(r1) * AVC.BRAZO1;
    const wx = ex + lado * Math.sin(r2) * AVC.BRAZO2, wy = ey + Math.cos(r2) * AVC.BRAZO2;
    // el brazo "delantero" es el de la derecha del personaje
    avcCapsula(ctx, ex, ey, wx, wy, 11.5, piel);
    avcCapsula(ctx, sx, sy, ex, ey, 13.5, manga);
    if(mangaLarga) avcCapsula(ctx, ex, ey, ex + (wx - ex) * 0.55, ey + (wy - ey) * 0.55, 12.2, manga);
    ctx.fillStyle = manga; ctx.beginPath(); ctx.arc(sx, sy, 7.4, 0, 7); ctx.fill();
    const dx = lado * Math.sin(r2), dy = Math.cos(r2);
    avcMano(ctx, wx + dx * 3, wy + dy * 3, dx, dy, a.mano, piel, lado);
    if(k === 'd'){
      out.manoLocal = { x: wx + dx * 9, y: wy + dy * 9, dx, dy };
    }
  });
  ctx.restore();

  if(out.manoLocal){
    const m = out.manoLocal;
    out.mano = { x: x + jx * sc + dir * m.x * sc, y: y - P.salto * sc + m.y * sc, dx: dir * m.dx, dy: m.dy };
  }
  return out;
}

// Retrato: la cabeza grande con su expresión, para el recuadro de la esquina.
function avcRetrato(ctx, p, x, y, tam, expr, mira){
  p = avcPuesto(p);
  const imgA = avcImagen(p, 'atras'), imgF = avcImagen(p, 'frente', expr, mira);
  const k = tam / 70, IW = 92 * 0.85, IH = 100 * 0.85; // el dibujo de la cabeza ocupa unas 70 unidades de alto
  ctx.save();
  ctx.translate(x, y); ctx.scale(k, k);
  if(imgA.complete && imgA.naturalWidth) ctx.drawImage(imgA, -IW / 2, -46 * 0.85 + 6, IW, IH);
  ctx.fillStyle = AV_PIELES[p.piel] || AV_PIELES[1]; ctx.fillRect(-8, 20, 16, 16);
  if(imgF.complete && imgF.naturalWidth) ctx.drawImage(imgF, -IW / 2, -46 * 0.85 + 6, IW, IH);
  ctx.restore();
}
