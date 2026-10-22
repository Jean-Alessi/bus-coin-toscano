// Bus-queda 1: "La terminal a medianoche". 4 habitaciones: Sala de espera → Boletería → Depósito de equipajes → Andén 5.
//
// La historia: Don Aurelio, el boletero, desapareció a las 3:47 de una madrugada de octubre de 1987, el día que el micro
// de Alejo Ledesma nunca salió. Desde entonces "sigue cerrando la terminal". Para salir hay que darle lo que nunca tuvo:
// un boleto sellado con la fecha justa para ese micro. En el camino hay candados, pistas repartidas entre las
// habitaciones, linternas sin pilas, una luz que se corta y alguien que no quiere que te vayas.
//
// Camino de la solución (las pistas de cada paso están repartidas, hay que volver atrás a mirar):
//  Sala:      banco A → moneda y papelito ("la hora en que murió el reloj, al revés") → reloj 3:47 → casillero 743 → linterna
//             control remoto + moneda → pila; teléfono → 2ª moneda; máquina (fila C, columna 2) → 2ª pila; linterna lista
//             (la luz se corta al abrir el casillero) → con la linterna aparece la llave de la boletería bajo el banco B.
//  Boletería: caja fuerte 4195 (los tres números de la voz del teléfono: 4-1-9, y el andén del servicio DEMORADO: 5)
//             → llave del depósito. Tablero de llaves (necesita la llavecita del depósito) → llave del andén.
//             Máquina de boletos (necesita el rollo) → solo acepta el servicio que no partió (Alejo Ledesma).
//             Sello (necesita tinta) → fecha 251087 (el diario dice que el micro salió dos días después del 23 rodeado).
//  Depósito:  valijas con etiquetas (solo una dice la verdad → la azul tiene el rollo); llavecita escondida (con luz);
//             tinta y diario en el escritorio; caja de herramientas con candado CAJAS (primeras letras de las normas) → fusible.
//  Andén 5:   tablero eléctrico: fusible + luces 3x3 → se enciende todo y aparece Don Aurelio. Se le da el boleto sellado.

const EA = {
  OL: '#14101e',
  rr(ctx, x, y, w, h, r, fill, stroke, lw){ arcRR(ctx, x, y, w, h, r); if(fill){ ctx.fillStyle = fill; ctx.fill(); } if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } },
  poly(ctx, pts, fill, stroke, lw){ ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if(fill){ ctx.fillStyle = fill; ctx.fill(); } if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } },
  circ(ctx, x, y, r, fill, stroke, lw){ ctx.beginPath(); ctx.arc(x, y, r, 0, 7); if(fill){ ctx.fillStyle = fill; ctx.fill(); } if(stroke){ ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } },
  linea(ctx, x1, y1, x2, y2, color, lw){ ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); },
  txt(ctx, s, x, y, tam, color, align, peso){ ctx.fillStyle = color || '#fff'; ctx.font = (peso || '700') + ' ' + tam + 'px Poppins, sans-serif'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); },
  // Paredes, zócalo, piso con baldosas, techo.
  cuarto(ctx, W, o){
    const g = ctx.createLinearGradient(0, 0, 0, 306); g.addColorStop(0, o.pared[0]); g.addColorStop(1, o.pared[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 306);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, 24);
    ctx.fillStyle = o.zocalo; ctx.fillRect(0, 262, W, 44); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(0, 262, W, 3);
    for(let x = 0; x < W; x += 60){ ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(x, 24, 2, 238); }
    const f = ctx.createLinearGradient(0, 306, 0, 440); f.addColorStop(0, o.piso[0]); f.addColorStop(1, o.piso[1]); ctx.fillStyle = f; ctx.fillRect(0, 306, W, 134);
    for(let r = 0; r < 5; r++){ const y = 306 + r * r * 3 + r * 14, h = 14 + r * 4; for(let x = ((r % 2) ? 0 : 30) - 30; x < W; x += 60 + r * 8){ ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(x, y, (60 + r * 8) / 2, h); } }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 306, W, 4);
    // manchas y grietas
    (o.manchas || []).forEach(([x, y, r]) => { const m = ctx.createRadialGradient(x, y, 2, x, y, r); m.addColorStop(0, 'rgba(20,28,20,.28)'); m.addColorStop(1, 'rgba(20,28,20,0)'); ctx.fillStyle = m; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    (o.grietas || []).forEach(([x, y]) => { ctx.strokeStyle = 'rgba(15,15,20,.45)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 14); ctx.lineTo(x - 4, y + 26); ctx.lineTo(x + 8, y + 44); ctx.stroke(); });
  },
  tubo(ctx, x, y, w){ EA.rr(ctx, x, y, w, 9, 4, '#cfdad6', EA.OL, 1.6); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 4, y + 2, w - 8, 2); },
  puerta(ctx, x, y, w, h, o){
    o = o || {};
    EA.rr(ctx, x - 5, y - 5, w + 10, h + 5, 3, '#2a2230', EA.OL, 2);
    ctx.fillStyle = o.abierta ? '#06060c' : (o.color || '#6b4a2f'); ctx.fillRect(x, y, w, h);
    if(!o.abierta){
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x + 6, y + 8, w - 12, h * 0.4); ctx.fillRect(x + 6, y + h * 0.5, w - 12, h * 0.44);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 6, y + 8, w - 12, h * 0.4); ctx.strokeRect(x + 6, y + h * 0.5, w - 12, h * 0.44);
      if(o.vidrio){ EA.rr(ctx, x + w * 0.22, y + 16, w * 0.56, 40, 3, '#1a2a38', EA.OL, 1.5); ctx.fillStyle = 'rgba(160,210,255,.16)'; ctx.fillRect(x + w * 0.22 + 3, y + 19, w * 0.18, 34); }
      EA.circ(ctx, x + w - 10, y + h * 0.5, 3.4, '#E6C14B', EA.OL, 1.2);
    }
    ctx.strokeStyle = EA.OL; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    if(o.cartel){ EA.rr(ctx, x - 6, y - 36, w + 12, 24, 4, '#1c2a3a', EA.OL, 1.6); EA.txt(ctx, o.cartel, x + w / 2, y - 24, 10.5, '#E6C14B', 'center', '800'); }
  },
  valija(ctx, x, y, w, h, c1, c2){
    EA.rr(ctx, x, y, w, h, 6, c1, EA.OL, 2);
    ctx.fillStyle = c2; ctx.fillRect(x + w * 0.18, y + 3, 4, h - 6); ctx.fillRect(x + w * 0.74, y + 3, 4, h - 6);
    EA.rr(ctx, x + w * 0.34, y - 8, w * 0.32, 9, 3, 'rgba(0,0,0,.0)', EA.OL, 2.4);
    EA.rr(ctx, x + w * 0.4, y + h * 0.5, w * 0.2, 7, 2, '#E6C14B', EA.OL, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + 4, y + 4, w * 0.12, h - 8);
  },
};

// Brillo del borde para marcar de dónde viene la luz de la linterna (se usa en objetos escondidos).
function esc1Brillito(ctx, x, y, t){
  const a = 0.6 + 0.4 * Math.sin(t * 6);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 1.6, y - 1.6); ctx.lineTo(x + 7, y); ctx.lineTo(x + 1.6, y + 1.6); ctx.lineTo(x, y + 7); ctx.lineTo(x - 1.6, y + 1.6); ctx.lineTo(x - 7, y); ctx.lineTo(x - 1.6, y - 1.6); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function esc1Llave(ctx, x, y, esc, color){
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.4); ctx.scale(esc || 1, esc || 1);
  EA.circ(ctx, -8, 0, 5.5, null, color || '#d9b73c', 3); EA.linea(ctx, -3, 0, 12, 0, color || '#d9b73c', 3.2); EA.linea(ctx, 8, 0, 8, 5, color || '#d9b73c', 3); EA.linea(ctx, 12, 0, 12, 4, color || '#d9b73c', 3);
  ctx.restore();
}

// ============================ SALA DE ESPERA ============================

function esc1DibujarSala(ctx, e){
  const W = 720, abierta = e.flag('puerta_boleteria_abierta');
  EA.cuarto(ctx, W, { pared: ['#5f7a74', '#7d958d'], zocalo: '#3f524e', piso: ['#8a8d78', '#6b6e5d'], manchas: [[200, 200, 60], [560, 90, 50], [90, 240, 40]], grietas: [[420, 30], [660, 40]] });
  [120, 340, 560].forEach(x => EA.tubo(ctx, x, 12, 70));
  // puerta a la Boletería
  EA.puerta(ctx, 20, 100, 76, 212, { abierta, vidrio: true, cartel: 'BOLETERÍA', color: '#6b4a2f' });
  // teléfono público
  EA.rr(ctx, 112, 150, 42, 112, 6, '#7c8794', EA.OL, 2); EA.rr(ctx, 118, 158, 30, 22, 3, '#1b2430', EA.OL, 1.4);
  for(let i = 0; i < 9; i++) EA.circ(ctx, 122 + (i % 3) * 10, 192 + Math.floor(i / 3) * 10, 2.6, '#cfd6df', null);
  EA.rr(ctx, 104, 164, 10, 60, 5, '#2b2f3a', EA.OL, 1.6); EA.linea(ctx, 114, 176, 119, 180, '#2b2f3a', 2);
  EA.rr(ctx, 123, 238, 20, 12, 2, '#3c4552', EA.OL, 1.4); EA.txt(ctx, '☎', 133, 138, 12, '#d8dde3');
  // cartelera de salidas
  EA.rr(ctx, 168, 36, 150, 106, 5, '#0f1a2e', EA.OL, 2.4); EA.rr(ctx, 172, 40, 142, 98, 3, null, 'rgba(255,255,255,.2)', 1);
  EA.txt(ctx, 'SALIDAS', 243, 51, 10, '#FFD84D', 'center', '800');
  [['Rufino', '2', '21:10', 'PARTIÓ'], ['V. Tuerto', '4', '23:30', 'PARTIÓ'], ['Rosario', '1', '00:15', 'PARTIÓ'], ['Santa Fe', '3', '01:40', 'PARTIÓ'], ['A. Ledesma', '5', '03:47', 'DEMORADO']].forEach((r, i) => {
    const y = 66 + i * 14, c = i === 4 ? '#ff7a6a' : '#9fd0c4';
    EA.txt(ctx, r[0], 176, y, 7.6, c, 'left', '600'); EA.txt(ctx, r[1], 236, y, 7.6, c, 'center', '600'); EA.txt(ctx, r[2], 262, y, 7.6, c, 'center', '600'); EA.txt(ctx, r[3], 308, y, 6.6, c, 'right', '700');
  });
  // reloj parado
  EA.circ(ctx, 353, 54, 26, '#e9e4d4', EA.OL, 3);
  for(let i = 0; i < 12; i++){ const a = i * Math.PI / 6; EA.linea(ctx, 353 + Math.sin(a) * 20, 54 - Math.cos(a) * 20, 353 + Math.sin(a) * 24, 54 - Math.cos(a) * 24, '#2b2330', 2); }
  const ah = (3 + 47 / 60) * 30 * Math.PI / 180, am = 47 * 6 * Math.PI / 180;
  EA.linea(ctx, 353, 54, 353 + Math.sin(ah) * 13, 54 - Math.cos(ah) * 13, '#2b2330', 3.4); EA.linea(ctx, 353, 54, 353 + Math.sin(am) * 20, 54 - Math.cos(am) * 20, '#2b2330', 2.2);
  EA.circ(ctx, 353, 54, 2.6, '#2b2330'); ctx.strokeStyle = 'rgba(60,80,90,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(340, 38); ctx.lineTo(352, 56); ctx.lineTo(346, 70); ctx.moveTo(352, 56); ctx.lineTo(368, 62); ctx.stroke();
  // tele sobre una mesita
  EA.rr(ctx, 326, 262, 92, 10, 3, '#5a4128', EA.OL, 2); [334, 404].forEach(x => EA.rr(ctx, x, 272, 8, 40, 2, '#4a3520', EA.OL, 1.6));
  EA.rr(ctx, 332, 178, 80, 82, 10, '#3a3a40', EA.OL, 2.4); EA.rr(ctx, 340, 187, 56, 62, 8, '#10141a', EA.OL, 1.6);
  EA.circ(ctx, 404, 200, 3, '#b8860b', EA.OL, 1); EA.circ(ctx, 404, 214, 3, '#b8860b', EA.OL, 1);
  if(!e.flag('control_tomado')){ EA.rr(ctx, 384, 252, 22, 8, 2, '#262a33', EA.OL, 1.4); [0, 1, 2].forEach(i => EA.circ(ctx, 389 + i * 6, 256, 1.6, ['#d33', '#3a3', '#33d'][i])); }
  // máquina expendedora
  EA.rr(ctx, 432, 110, 80, 202, 6, '#b3322e', EA.OL, 2.6); EA.rr(ctx, 438, 130, 52, 138, 3, '#16212c', EA.OL, 1.8);
  const prod = [['#7a4a2a', '#d9a066', '#c9a24a'], ['#6ab0e0', '#9a5a2a', '#e0a038'], ['#e063a0', '#3a3d46', '#7a46c8']];
  prod.forEach((fila, r) => fila.forEach((c, i) => EA.rr(ctx, 442 + i * 16, 136 + r * 42, 12, 28, 3, c, EA.OL, 1)));
  EA.rr(ctx, 494, 138, 14, 50, 3, '#1b1f27', EA.OL, 1.4); for(let i = 0; i < 6; i++) EA.circ(ctx, 497 + (i % 2) * 7, 146 + Math.floor(i / 2) * 12, 2.2, '#d0d6de');
  EA.rr(ctx, 494, 196, 14, 6, 2, '#0b0e12', EA.OL, 1); EA.rr(ctx, 440, 276, 50, 26, 4, '#0b0e12', EA.OL, 1.8);
  EA.txt(ctx, 'SNACKS', 472, 120, 9.5, '#FFE9A6', 'center', '800');
  // casilleros
  for(let c = 0; c < 3; c++) for(let r = 0; r < 4; r++){
    const x = 526 + c * 31, y = 120 + r * 48; EA.rr(ctx, x, y, 29, 46, 2, '#6f8aa0', EA.OL, 1.6);
    for(let k = 0; k < 3; k++) EA.linea(ctx, x + 6, y + 6 + k * 3.4, x + 23, y + 6 + k * 3.4, 'rgba(0,0,0,.4)', 1);
    EA.circ(ctx, x + 22, y + 28, 2.2, '#cfd6df', EA.OL, 0.8); EA.txt(ctx, String(r * 3 + c + 1), x + 8, y + 40, 6.5, '#e8f0f6', 'center', '700');
  }
  const lx = 526 + 31, ly = 120 + 48; // el casillero con la A
  EA.rr(ctx, lx, ly, 29, 46, 2, e.flag('casillero_abierto') ? '#0b1118' : '#7e98ae', EA.OL, 1.8); EA.txt(ctx, 'A', lx + 14, ly + 14, 12, '#f0d060', 'center', '800');
  if(e.flag('casillero_abierto')){ ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(lx + 2, ly + 2, 25, 42); }
  // puertas de vidrio encadenadas hacia los andenes
  EA.rr(ctx, 628, 86, 84, 226, 3, '#22303c', EA.OL, 2.4);
  [632, 672].forEach(x => { EA.rr(ctx, x, 92, 36, 212, 2, '#1d3550', EA.OL, 1.6); ctx.fillStyle = 'rgba(130,180,230,.18)'; ctx.fillRect(x + 3, 96, 12, 200); });
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(634, 190); ctx.lineTo(706, 200); ctx.moveTo(634, 200); ctx.lineTo(706, 190); ctx.stroke();
  EA.rr(ctx, 658, 186, 18, 22, 3, '#c9a53a', EA.OL, 2); EA.circ(ctx, 667, 197, 3, '#3a2a10');
  EA.rr(ctx, 636, 56, 70, 22, 3, '#0e3a22', EA.OL, 1.6); EA.txt(ctx, 'SALIDA', 671, 67, 11, '#7dff9f', 'center', '800');
  // bancos
  [[170, 130], [430, 130]].forEach(([x, w]) => {
    EA.rr(ctx, x, 318, w, 12, 3, '#d97a2b', EA.OL, 2); EA.rr(ctx, x, 304, w, 12, 3, '#c26a22', EA.OL, 2);
    [x + 10, x + w - 14].forEach(px => EA.rr(ctx, px, 330, 5, 24, 1, '#5b6370', EA.OL, 1.4)); EA.rr(ctx, x - 2, 351, w + 4, 4, 1, 'rgba(0,0,0,.3)');
  });
  // basurero
  EA.rr(ctx, 100, 296, 28, 40, 4, '#46505a', EA.OL, 2); EA.linea(ctx, 98, 296, 130, 296, '#6a7480', 4); [108, 114, 120].forEach(x => EA.linea(ctx, x, 304, x, 330, 'rgba(0,0,0,.3)', 1.4));
  // objetos que cambian
  if(e.flag('apagon') && !e.flag('puerta_boleteria_abierta') && !e.flag('llave_boleteria_tomada')){ /* la llave se dibuja con luz en dinamico */ }
}

function esc1DinamicoSala(ctx, e, t){
  const oscura = e.oscura();
  if(!oscura){
    // tubos que parpadean
    [120, 340, 560].forEach((x, i) => { const a = 0.14 + 0.05 * Math.sin(t * 40 + i * 2) * (e.parpadeo > 0 ? 3 : 0.3); const g = ctx.createLinearGradient(0, 21, 0, 140); g.addColorStop(0, 'rgba(230,255,245,' + a + ')'); g.addColorStop(1, 'rgba(230,255,245,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 21); ctx.lineTo(x + 70, 21); ctx.lineTo(x + 130, 150); ctx.lineTo(x - 60, 150); ctx.fill(); });
  }
  // nieve de la tele
  const sx = 340, sy = 187; ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, 56, 62); ctx.clip();
  for(let i = 0; i < 22; i++){ const v = 120 + Math.random() * 120; ctx.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.6)'; ctx.fillRect(sx + Math.random() * 56, sy + Math.random() * 62, 4 + Math.random() * 10, 1.5); }
  ctx.restore();
  // teléfono que suena: tiembla
  if(e.flag('telefono_suena') && !e.flag('mensaje_tel') && Math.sin(t * 40) > 0){ EA.circ(ctx, 133, 140, 22, null, 'rgba(255,255,160,.5)', 2); }
  // cartel de salida verde
  const pulso = 0.35 + 0.15 * Math.sin(t * 2); ctx.fillStyle = 'rgba(80,255,140,' + pulso + ')'; ctx.beginPath(); ctx.arc(671, 67, 36, 0, 7); ctx.fill();
  // la luna entra por los vidrios de la salida
  if(oscura){ const g = ctx.createLinearGradient(632, 90, 700, 300); g.addColorStop(0, 'rgba(120,170,255,.22)'); g.addColorStop(1, 'rgba(120,170,255,0)'); ctx.fillStyle = g; ctx.fillRect(632, 92, 76, 210); }
  // la llave escondida debajo del banco derecho
  if(e.flag('apagon') && !e.flag('llave_boleteria_tomada') && e.enLuz(500, 346)){ esc1Llave(ctx, 500, 348, 1.1, '#e8c84a'); esc1Brillito(ctx, 504, 342, t); }
}

// ============================ BOLETERÍA ============================

function esc1DibujarBoleteria(ctx, e){
  const W = 700;
  EA.cuarto(ctx, W, { pared: ['#6a6f5b', '#88896f'], zocalo: '#4a3a2a', piso: ['#6b5338', '#4d3b28'], manchas: [[300, 120, 70], [600, 60, 50]], grietas: [[240, 34], [470, 40]] });
  EA.rr(ctx, 330, 12, 4, 40, 1, '#222'); EA.circ(ctx, 332, 58, 7, '#f4e6a8', EA.OL, 1.6);
  // puerta izquierda (vuelve a la sala)
  EA.puerta(ctx, 14, 110, 58, 202, { color: '#6b4a2f' });
  // mostrador y ventanilla con reja
  EA.rr(ctx, 78, 74, 170, 130, 4, '#1b2330', EA.OL, 3); ctx.fillStyle = 'rgba(70,110,150,.35)'; ctx.fillRect(84, 80, 158, 118);
  for(let x = 94; x < 240; x += 16) EA.linea(ctx, x, 80, x, 198, '#8a8f98', 3);
  EA.linea(ctx, 84, 130, 242, 130, '#8a8f98', 3);
  EA.rr(ctx, 60, 204, 380, 14, 3, '#9b6e3e', EA.OL, 2.4); EA.rr(ctx, 66, 218, 368, 96, 2, '#6a4a2a', EA.OL, 2);
  [92, 190, 288, 386].forEach(x => EA.rr(ctx, x - 40, 226, 80, 80, 2, 'rgba(0,0,0,.18)', 'rgba(0,0,0,.35)', 1.2));
  // sello y almohadilla
  EA.rr(ctx, 112, 192, 44, 12, 2, '#2d4f7a', EA.OL, 1.6); EA.rr(ctx, 126, 168, 14, 24, 4, '#7a4a22', EA.OL, 1.6); EA.rr(ctx, 122, 162, 22, 8, 4, '#9a6a32', EA.OL, 1.4);
  if(e.flag('sello_entintado')){ EA.rr(ctx, 115, 194, 38, 6, 2, '#1a2a44'); }
  // caja registradora
  EA.rr(ctx, 176, 168, 60, 36, 3, '#a89a6a', EA.OL, 2); EA.rr(ctx, 184, 148, 44, 22, 3, '#2d3b2d', EA.OL, 1.6); EA.txt(ctx, '0.00', 206, 159, 9, '#9dff9d', 'center', '700');
  for(let i = 0; i < 6; i++) EA.circ(ctx, 186 + (i % 3) * 14, 180 + Math.floor(i / 3) * 12, 3.2, '#e6ddb8', EA.OL, 0.8);
  // máquina de boletos
  EA.rr(ctx, 252, 94, 84, 110, 5, '#5a6370', EA.OL, 2.4); EA.rr(ctx, 260, 104, 68, 36, 3, e.flag('papel') ? '#173b22' : '#161c24', EA.OL, 1.6);
  EA.txt(ctx, e.flag('papel') ? 'ELIJA DESTINO' : 'SIN PAPEL', 294, 122, 8.4, e.flag('papel') ? '#8dff9f' : '#ff7a6a', 'center', '800');
  EA.rr(ctx, 268, 150, 52, 8, 2, '#0b0e12', EA.OL, 1.4); for(let i = 0; i < 4; i++) EA.circ(ctx, 272 + i * 14, 176, 4, '#cfd6df', EA.OL, 1);
  // calendario
  EA.rr(ctx, 350, 54, 50, 78, 2, '#f1ead2', EA.OL, 2); EA.rr(ctx, 350, 54, 50, 16, 2, '#b3322e', EA.OL, 1.6); EA.txt(ctx, 'OCT 87', 375, 62, 8, '#fff', 'center', '800');
  for(let r = 0; r < 5; r++) for(let c = 0; c < 7; c++){ const d = r * 7 + c - 3; if(d >= 1 && d <= 31) EA.txt(ctx, String(d), 354 + c * 6.2, 79 + r * 10, 4.4, '#3a3226', 'center', '600'); }
  EA.circ(ctx, 354 + 4 * 6.2, 79 + 3 * 10 + 0, 4.4, null, '#d11', 1.2);   // el 23 rodeado
  // tablero de llaves
  const tabAb = e.flag('tablero_abierto');
  EA.rr(ctx, 420, 112, 100, 120, 4, '#5a3d22', EA.OL, 2.4); EA.rr(ctx, 428, 120, 84, 104, 2, '#1a1410', EA.OL, 1.4);
  [['BAÑO', 0], ['OFIC.', 1], ['COCHE 12', 2], ['ANDÉN 5', 3]].forEach(([n, i]) => {
    const x = 436 + (i % 2) * 40, y = 132 + Math.floor(i / 2) * 44; EA.circ(ctx, x + 8, y, 2.2, '#999'); EA.txt(ctx, n, x + 8, y + 30, 5.6, '#d8c9a0', 'center', '700');
    if(!(i === 3 && tabAb && e.flag('llave_anden_tomada'))) esc1Llave(ctx, x + 8, y + 12, 0.95, i === 3 ? '#e8c84a' : '#9aa0a8');
  });
  if(!tabAb){ ctx.fillStyle = 'rgba(160,210,255,.2)'; ctx.fillRect(428, 120, 84, 104); EA.linea(ctx, 432, 124, 450, 150, 'rgba(255,255,255,.35)', 1.4); EA.circ(ctx, 520 - 8, 172, 2.6, '#d9b73c', EA.OL, 1); }
  else { EA.poly(ctx, [[520, 112], [548, 120], [548, 232], [520, 232]], '#6a4a2a', EA.OL, 2); }
  // caja fuerte
  EA.rr(ctx, 540, 226, 68, 86, 3, '#3a4350', EA.OL, 3);
  if(e.flag('caja_abierta')){ EA.rr(ctx, 546, 232, 56, 74, 2, '#0a0d12', EA.OL, 1.6); EA.poly(ctx, [[546, 232], [526, 240], [526, 300], [546, 306]], '#4a5463', EA.OL, 2); }
  else { EA.circ(ctx, 574, 266, 18, '#59636f', EA.OL, 2.4); EA.circ(ctx, 574, 266, 12, '#2a313b', EA.OL, 1.6); for(let i = 0; i < 12; i++){ const a = i * Math.PI / 6; EA.linea(ctx, 574 + Math.sin(a) * 12, 266 - Math.cos(a) * 12, 574 + Math.sin(a) * 15, 266 - Math.cos(a) * 15, '#cfd6df', 1.2); } EA.linea(ctx, 574, 266, 580, 258, '#ff8a3a', 2.4); EA.rr(ctx, 590, 254, 8, 22, 2, '#8a929c', EA.OL, 1.4); }
  // nota pegada junto a la caja
  EA.poly(ctx, [[548, 192], [578, 190], [580, 220], [550, 222]], '#f6e27a', EA.OL, 1.6); [198, 204, 210].forEach(y => EA.linea(ctx, 553, y, 574, y - 1, 'rgba(60,40,0,.55)', 1.2));
  // puerta derecha al depósito
  EA.puerta(ctx, 640, 100, 52, 212, { color: '#4a5560', cartel: 'DEPÓSITO' });
}

function esc1DinamicoBoleteria(ctx, e, t){
  // ojos en la ventanilla cuando aparece el fantasma se dibuja desde el motor
  if(e.flag('papel')){ ctx.fillStyle = 'rgba(120,255,150,' + (0.1 + 0.04 * Math.sin(t * 5)) + ')'; ctx.fillRect(260, 104, 68, 36); }
}

// ============================ DEPÓSITO ============================

const ESC1_VALIJAS = [
  { id: 'roja', nombre: 'roja', x: 112, c: ['#c2312f', '#8e1f20'], etiqueta: 'El rollo está en esta valija.' },
  { id: 'verde', nombre: 'verde', x: 170, c: ['#2e8a5a', '#1c5a3a'], etiqueta: 'El rollo no está en la roja.' },
  { id: 'azul', nombre: 'azul', x: 228, c: ['#2f63b8', '#1f3f7a'], etiqueta: 'El rollo no está en la azul.' },
  { id: 'amarilla', nombre: 'amarilla', x: 286, c: ['#d9ac2a', '#a07a12'], etiqueta: 'El rollo está en la verde.' },
];

function esc1DibujarDeposito(ctx, e){
  const W = 720;
  EA.cuarto(ctx, W, { pared: ['#4d5560', '#6a727c'], zocalo: '#2f353d', piso: ['#5f6368', '#44474b'], manchas: [[200, 100, 70], [520, 70, 60], [640, 220, 50]], grietas: [[360, 30], [610, 36]] });
  EA.linea(ctx, 150, 12, 150, 70, '#222', 3); EA.circ(ctx, 150, 78, 8, '#e8d8a0', EA.OL, 1.6); EA.linea(ctx, 560, 12, 560, 50, '#222', 3); EA.circ(ctx, 560, 58, 8, '#e8d8a0', EA.OL, 1.6);
  EA.puerta(ctx, 16, 110, 56, 202, { color: '#4a5560' });
  // estantería con las cuatro valijas
  EA.rr(ctx, 100, 140, 240, 8, 2, '#6f7782', EA.OL, 1.8); EA.rr(ctx, 100, 214, 240, 8, 2, '#6f7782', EA.OL, 1.8); EA.rr(ctx, 100, 280, 240, 8, 2, '#6f7782', EA.OL, 1.8);
  [100, 332].forEach(x => EA.rr(ctx, x, 140, 8, 160, 1, '#5a626d', EA.OL, 1.6));
  ESC1_VALIJAS.forEach(v => {
    EA.valija(ctx, v.x, 150, 48, 62, v.c[0], v.c[1]);
    EA.poly(ctx, [[v.x + 30, 190], [v.x + 46, 190], [v.x + 46, 208], [v.x + 30, 208]], '#f4f0e4', EA.OL, 1);
    [194, 199, 204].forEach(y => EA.linea(ctx, v.x + 33, y, v.x + 43, y, 'rgba(0,0,0,.5)', 1));
  });
  EA.rr(ctx, 112, 224, 40, 54, 2, '#9a7a4a', EA.OL, 1.6); EA.rr(ctx, 160, 232, 56, 46, 2, '#8a6a3a', EA.OL, 1.6); EA.rr(ctx, 228, 244, 70, 34, 2, '#a88a58', EA.OL, 1.6);
  // aviso arriba de la estantería
  EA.rr(ctx, 112, 94, 216, 34, 3, '#e8d8a0', EA.OL, 2); EA.txt(ctx, '¡ATENCIÓN!', 220, 105, 10, '#b3322e', 'center', '800'); EA.txt(ctx, 'De las cuatro etiquetas, solo una dice la verdad', 220, 118, 6.6, '#3a2a10', 'center', '700');
  // afiche de las normas
  EA.rr(ctx, 360, 62, 84, 112, 2, '#f3eed8', EA.OL, 2); EA.txt(ctx, 'NORMAS', 402, 74, 9, '#b3322e', 'center', '800');
  ['Cargá siempre de abajo', 'Anotá el dueño de cada', 'Jamás bloquees el pasillo', 'Apilá hasta tres, no más', 'Siempre con guantes'].forEach((t, i) => { EA.txt(ctx, t[0], 368, 92 + i * 14, 8.4, '#b3322e', 'left', '800'); EA.txt(ctx, t.slice(1), 375, 92 + i * 14, 5.6, '#3a3226', 'left', '600'); });
  // escritorio del encargado
  EA.rr(ctx, 352, 228, 120, 10, 3, '#8a5a30', EA.OL, 2.2); [358, 456].forEach(x => EA.rr(ctx, x, 238, 8, 74, 1, '#6a4422', EA.OL, 1.6)); EA.rr(ctx, 370, 240, 70, 26, 2, '#7a4e28', EA.OL, 1.6); EA.circ(ctx, 405, 253, 2.4, '#d9b73c');
  if(!e.flag('tinta_tomada')){ EA.rr(ctx, 372, 204, 20, 24, 4, '#1b2a58', EA.OL, 1.6); EA.rr(ctx, 377, 198, 10, 8, 2, '#222', EA.OL, 1.2); }
  EA.rr(ctx, 402, 218, 40, 10, 2, '#6b3a2a', EA.OL, 1.6); EA.linea(ctx, 406, 223, 438, 223, '#e8d8a0', 1.6);
  // caja de herramientas
  const ab = e.flag('caja_herr_abierta');
  EA.rr(ctx, 492, 296, 62, 30, 3, '#b3322e', EA.OL, 2.2);
  if(ab){ EA.poly(ctx, [[492, 296], [554, 296], [546, 266], [500, 266]], '#8e2523', EA.OL, 2); } else { EA.rr(ctx, 492, 284, 62, 14, 3, '#c9403c', EA.OL, 2); EA.rr(ctx, 513, 291, 20, 14, 3, '#cdb23a', EA.OL, 1.6); EA.circ(ctx, 523, 298, 2.4, '#3a2a10'); }
  // cinta transportadora
  EA.rr(ctx, 566, 268, 134, 14, 3, '#2d3138', EA.OL, 2); [580, 620, 660, 690].forEach(x => EA.rr(ctx, x, 282, 5, 36, 1, '#444a52', EA.OL, 1.4));
  // puerta al andén
  EA.puerta(ctx, 658, 100, 54, 212, { color: '#3d4a58', cartel: 'ANDÉN' });
}

function esc1DinamicoDeposito(ctx, e, t){
  // rodillos de la cinta
  for(let i = 0; i < 9; i++){ const x = 572 + ((i * 14 + t * 24) % 126); EA.linea(ctx, x, 270, x, 280, 'rgba(255,255,255,.25)', 2); }
  if(!e.flag('llavecita_tomada') && e.enLuz(327, 346)){ esc1Llave(ctx, 327, 348, 0.8, '#c9d2dc'); esc1Brillito(ctx, 332, 341, t); }
}

// ============================ ANDÉN 5 ============================

function esc1DibujarAnden(ctx, e){
  const W = 720, luz = e.flag('luz_anden');
  const cielo = ctx.createLinearGradient(0, 0, 0, 300); cielo.addColorStop(0, luz ? '#243a66' : '#0a1024'); cielo.addColorStop(1, luz ? '#566fa0' : '#1c2748'); ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, 306);
  for(let i = 0; i < 40; i++){ ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 5) * 0.12) + ')'; ctx.fillRect((i * 97) % W, 24 + (i * 53) % 130, 1.6, 1.6); }
  EA.circ(ctx, 600, 56, 20, '#f1ecd2'); EA.circ(ctx, 608, 52, 18, luz ? '#3a5488' : '#16203e');
  // edificio de la terminal a la izquierda
  EA.rr(ctx, -10, 90, 240, 216, 3, '#3a4452', EA.OL, 2); for(let i = 0; i < 3; i++) EA.rr(ctx, 80 + i * 46, 118, 30, 44, 2, luz ? '#c9a85a' : '#10151f', EA.OL, 1.6);
  EA.puerta(ctx, 10, 110, 54, 202, { color: '#4a5560' });
  // piso del andén
  const f = ctx.createLinearGradient(0, 306, 0, 440); f.addColorStop(0, '#6e7078'); f.addColorStop(1, '#4a4c54'); ctx.fillStyle = f; ctx.fillRect(0, 306, W, 134);
  ctx.fillStyle = '#e6c14b'; ctx.fillRect(0, 318, W, 6); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 306, W, 4);
  for(let x = 0; x < W; x += 80){ ctx.fillStyle = 'rgba(0,0,0,.09)'; ctx.fillRect(x, 324, 40, 116); }
  // techo del andén y postes
  EA.rr(ctx, 0, 40, W, 14, 2, '#2b3340', EA.OL, 2); [250, 460].forEach(x => EA.rr(ctx, x, 54, 8, 252, 1, '#586275', EA.OL, 1.6));
  [150, 360, 580].forEach(x => { EA.rr(ctx, x - 24, 56, 48, 7, 3, luz ? '#fff3b0' : '#3a4150', EA.OL, 1.4); });
  // cartel ANDÉN 5
  EA.rr(ctx, 176, 66, 96, 34, 4, '#0f3a7a', EA.OL, 2.2); EA.txt(ctx, 'ANDÉN 5', 224, 83, 15, '#fff', 'center', '800');
  // banco
  EA.rr(ctx, 168, 318, 90, 10, 3, '#8a6a3e', EA.OL, 2); EA.rr(ctx, 168, 302, 90, 12, 3, '#9a7a4a', EA.OL, 2); [176, 244].forEach(x => EA.rr(ctx, x, 328, 5, 22, 1, '#444', EA.OL, 1.4));
  // tablero eléctrico
  EA.rr(ctx, 86, 126, 66, 100, 3, '#59636f', EA.OL, 2.4); EA.rr(ctx, 92, 134, 54, 70, 2, '#1b222c', EA.OL, 1.6);
  EA.txt(ctx, 'LUCES', 119, 142, 7.4, '#ffd84d', 'center', '800'); EA.txt(ctx, 'ANDÉN 5', 119, 214, 7, '#e8e8e8', 'center', '700');
  if(e.flag('fusible_puesto')){ EA.rr(ctx, 105, 150, 28, 14, 2, '#d9b73c', EA.OL, 1.4); for(let i = 0; i < 9; i++) EA.circ(ctx, 102 + (i % 3) * 17, 172 + Math.floor(i / 3) * 10, 3.4, luz ? '#ffe58a' : '#4a3a12', EA.OL, 1); }
  else { EA.rr(ctx, 105, 150, 28, 14, 2, '#0b0e12', EA.OL, 1.4); EA.linea(ctx, 108, 157, 130, 157, '#555', 1.4); }
  // el micro de Busmac
  const cx = 330;
  EA.rr(ctx, cx, 112, 380, 196, 14, luz ? '#f2f4f8' : '#c9ced8', EA.OL, 3);
  ctx.fillStyle = '#0F2A4D'; ctx.fillRect(cx + 2, 232, 376, 40); ctx.fillStyle = '#E6A817'; ctx.fillRect(cx + 2, 226, 376, 6);
  for(let i = 0; i < 6; i++) EA.rr(ctx, cx + 24 + i * 52, 128, 42, 60, 5, luz ? '#ffe9a0' : '#0e1624', EA.OL, 2);
  EA.rr(ctx, cx + 346, 124, 28, 70, 6, luz ? '#cfe6ff' : '#0e1624', EA.OL, 2);
  EA.rr(ctx, cx + 228, 124, 54, 164, 4, luz ? '#cfe6ff' : '#0e1624', EA.OL, 2.4); EA.linea(ctx, cx + 255, 128, cx + 255, 286, EA.OL, 2);
  if(typeof arcLogo === 'function') arcLogo(ctx, cx + 120, 252, 34, '#fff');
  EA.txt(ctx, 'BUSMAC', cx + 190, 252, 15, '#fff', 'center', '800');
  [cx + 70, cx + 300].forEach(x => { EA.circ(ctx, x, 308, 28, '#14161c', EA.OL, 2.6); EA.circ(ctx, x, 308, 14, '#9aa2ae', EA.OL, 2); });
  EA.circ(ctx, cx + 372, 270, 8, luz ? '#fff7c0' : '#4a4a40', EA.OL, 2);
  EA.rr(ctx, cx + 120, 100, 120, 14, 3, '#0b1a30', EA.OL, 1.6); EA.txt(ctx, 'ALEJO LEDESMA · 03:47', cx + 180, 107, 7.4, '#ffb347', 'center', '800');
}

function esc1DinamicoAnden(ctx, e, t){
  if(e.flag('luz_anden')){
    [150, 360, 580].forEach(x => { const g = ctx.createLinearGradient(0, 62, 0, 330); g.addColorStop(0, 'rgba(255,238,170,.32)'); g.addColorStop(1, 'rgba(255,238,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 24, 62); ctx.lineTo(x + 24, 62); ctx.lineTo(x + 90, 330); ctx.lineTo(x - 90, 330); ctx.fill(); });
    const g = ctx.createRadialGradient(702, 272, 4, 702, 272, 90); g.addColorStop(0, 'rgba(255,250,200,.4)'); g.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = g; ctx.fillRect(610, 180, 110, 200);
  }
}

// ============================ DATOS DE LA AVENTURA ============================

const ESC1_ITEMS = {
  moneda: { nombre: 'Moneda', icono: '🪙', desc: 'Una moneda vieja, del 87.' },
  moneda2: { nombre: 'Otra moneda', icono: '🪙', desc: 'Una moneda que estaba en el teléfono.' },
  control: { nombre: 'Control remoto', icono: '📺', desc: 'Control de la tele. La tapita de las pilas está atornillada.' },
  pila_a: { nombre: 'Pila', icono: '🔋', desc: 'Una pila AA que sacaste del control.' },
  pila_b: { nombre: 'Pila nueva', icono: '🔋', desc: 'Una pila AA de la máquina.' },
  linterna_v: { nombre: 'Linterna sin pilas', icono: '🔦', desc: 'Una linterna de bolsillo. Le faltan las pilas.' },
  linterna_1: { nombre: 'Linterna (1 pila)', icono: '🔦', desc: 'Tiene una pila, pero necesita dos.' },
  linterna_lista: { nombre: 'Linterna', icono: '🔦', desc: 'Funciona. Se prende sola cuando hay oscuridad.' },
  llave_boleteria: { nombre: 'Llave de la boletería', icono: '🗝️', desc: 'Una llave oxidada con una etiqueta: BOLETERÍA.' },
  llave_deposito: { nombre: 'Llave del depósito', icono: '🗝️', desc: 'Pesada, de hierro. Dice DEPÓSITO.' },
  llavecita: { nombre: 'Llavecita', icono: '🔑', desc: 'Una llavecita plateada, de vitrina.' },
  llave_anden: { nombre: 'Llave del andén', icono: '🗝️', desc: 'Dice ANDÉN 5.' },
  rollo: { nombre: 'Rollo de papel', icono: '🧻', desc: 'Papel térmico amarillento, para una máquina de boletos.' },
  tinta: { nombre: 'Frasco de tinta', icono: '🧴', desc: 'Tinta azul para almohadillas de sellos.' },
  fusible: { nombre: 'Fusible', icono: '⚡', desc: 'Un fusible grande, de tablero.' },
  boleto: { nombre: 'Boleto', icono: '🎫', desc: 'ALEJO LEDESMA · 03:47 · ANDÉN 5. Sin sellar.' },
  boleto_sellado: { nombre: 'Boleto sellado', icono: '🎟️', desc: 'El boleto, con el sello de la fecha.' },
};

const ESC1_COMBOS = [
  { a: 'moneda', b: 'control', da: 'pila_a', conserva: ['moneda'], texto: 'Usaste la moneda de destornillador: adentro del control había una pila. La sacaste.' },
  { a: 'moneda2', b: 'control', da: 'pila_a', conserva: ['moneda2'], texto: 'Usaste la moneda de destornillador: adentro del control había una pila. La sacaste.' },
  { a: 'linterna_v', b: 'pila_a', da: 'linterna_1', texto: 'Le pusiste una pila a la linterna. Todavía no prende: necesita dos.' },
  { a: 'linterna_v', b: 'pila_b', da: 'linterna_1', texto: 'Le pusiste una pila a la linterna. Todavía no prende: necesita dos.' },
  { a: 'linterna_1', b: 'pila_a', da: 'linterna_lista', texto: '¡Prende! La linterna se enciende sola cuando hay oscuridad.', alHacer: async e => { e.set('linterna_armada'); e.cara('alivio', 2); await e.bi('¡Luz! Ahora sí, ¡mové ese haz!'); } },
  { a: 'linterna_1', b: 'pila_b', da: 'linterna_lista', texto: '¡Prende! La linterna se enciende sola cuando hay oscuridad.', alHacer: async e => { e.set('linterna_armada'); e.cara('alivio', 2); await e.bi('¡Luz! Ahora sí, ¡mové ese haz!'); } },
];

const ESC1_TABLA_SALIDAS = `<table class="esc-tabla"><tr><th>DESTINO</th><th>AND.</th><th>HORA</th><th>ESTADO</th></tr><tr><td>Rufino</td><td>2</td><td>21:10</td><td>PARTIÓ</td></tr><tr><td>Venado Tuerto</td><td>4</td><td>23:30</td><td>PARTIÓ</td></tr><tr><td>Rosario</td><td>1</td><td>00:15</td><td>PARTIÓ</td></tr><tr><td>Santa Fe</td><td>3</td><td>01:40</td><td>PARTIÓ</td></tr><tr class="esc-rojo"><td>Alejo Ledesma</td><td>5</td><td>03:47</td><td>DEMORADO</td></tr></table>`;

const ESC1_PISTAS = [
  { id: 'banco', cuando: e => !e.flag('moneda_tomada'), textos: ['Los bancos de las terminales siempre guardan cosas que la gente se olvida.', 'Fijate en el banco de la izquierda, el que está frente a la cartelera.', 'Tocá el banco de la izquierda: hay una moneda y un papel doblado.'] },
  { id: 'casillero', cuando: e => !e.flag('casillero_abierto'), textos: ['El papel habla de un casillero y de un reloj. Mirá el reloj de la pared.', 'El reloj está parado en las 3:47. "Al revés" quiere decir dar vuelta los números.', 'El casillero de la A. Probá con 7, 4, 3.'] },
  { id: 'pilas', cuando: e => !e.tiene('linterna_lista') && !e.flag('linterna_armada'), textos: ['Una linterna necesita pilas, y las pilas pueden estar en cosas que las usan.', 'El control remoto de la tele tiene pilas. La tapita está atornillada: una moneda sirve de destornillador. Para la otra pila, fijate en la máquina de snacks.', 'La máquina vende pilas en la fila C, columna 2. Necesitás la moneda que está en el teléfono.'] },
  { id: 'llave1', cuando: e => !e.flag('puerta_boleteria_abierta'), textos: ['Con la linterna encendida, mirá debajo de las cosas bajas.', 'Algo brilla en el piso, cerca de los bancos.', 'Debajo del banco de la derecha, con la luz bien cerca, hay una llave.'] },
  { id: 'caja', cuando: e => !e.flag('caja_abierta'), textos: ['La caja fuerte pide 4 números. El papelito amarillo dice de dónde sacarlos.', 'Tres números los dijo una voz por teléfono (está en tu cuaderno 📓). El cuarto es el andén del servicio que nunca salió: mirá la cartelera de la sala.', 'El código es 4-1-9-5: el servicio DEMORADO (Alejo Ledesma) sale del andén 5.'] },
  { id: 'deposito', cuando: e => !e.flag('deposito_abierto'), textos: ['La caja fuerte tiene la llave de la puerta de la derecha.', 'Abrí la caja fuerte y usá la llave en la puerta del depósito.', 'Con la llave del depósito, tocá la puerta de la derecha.'] },
  { id: 'valijas', cuando: e => !e.flag('rollo_tomado'), textos: ['La máquina de boletos de la boletería no tiene papel. Alguien guardó un rollo en las valijas.', 'Solo UNA etiqueta dice la verdad. Probá suponer dónde está el rollo y contá cuántas etiquetas serían verdad.', 'Si el rollo estuviera en la azul, solo diría la verdad la etiqueta de la valija verde. En cualquier otra valija habría más de una etiqueta verdadera. Está en la azul.'] },
  { id: 'llavecita', cuando: e => !e.flag('llavecita_tomada'), textos: ['El tablero de llaves de la boletería tiene una cerradura chiquita. Hace falta una llavecita.', 'En el depósito algo brilla en el piso. Usá la linterna.', 'Cerca de la pata derecha de la estantería, en el suelo.'] },
  { id: 'cajaherr', cuando: e => !e.flag('fusible_tomado'), textos: ['El tablero del andén necesita un fusible. Puede estar en la caja de herramientas roja.', 'El candado es de 5 letras. Mirá el afiche de las normas: la etiqueta de la caja dice "las normas, en vertical".', 'Las primeras letras de cada renglón del afiche forman la palabra: C-A-J-A-S.'] },
  { id: 'tablero', cuando: e => !e.flag('tablero_abierto'), textos: ['La llave del andén está en el tablero de llaves, detrás del vidrio.', 'La cerradura chiquita se abre con la llavecita del depósito.', 'Usá la llavecita en el tablero de llaves de la boletería.'] },
  { id: 'boleto', cuando: e => !e.tiene('boleto') && !e.tiene('boleto_sellado') && !e.flag('boleto_dado'), textos: ['Aurelio necesita un boleto. La máquina de la boletería imprime, pero le falta el papel.', 'Poné el rollo en la máquina. Solo acepta un servicio: el que no partió.', 'Elegí ALEJO LEDESMA, el único DEMORADO.'] },
  { id: 'sello', cuando: e => !e.tiene('boleto_sellado') && !e.flag('boleto_dado'), textos: ['El boleto tiene que estar sellado. El sello de la boletería necesita tinta (está en el depósito).', 'Elegí la fecha correcta: el calendario tiene el 23 rodeado, pero el diario del depósito dice cuándo salió realmente el micro.', 'El micro salió dos días después del 23: 25 del 10 del 87. Escribí 251087.'] },
  { id: 'anden', cuando: e => !e.flag('deposito_a_anden'), textos: ['Todavía te falta abrir la puerta que lleva al andén.', 'La llave del andén está en el tablero de llaves de la boletería (necesita la llavecita).', 'Con la llave del andén, tocá la puerta de la derecha del depósito.'] },
  { id: 'luces', cuando: e => !e.flag('luz_anden'), textos: ['En el andén hay un tablero eléctrico al que le falta algo.', 'Poné el fusible. Después hay que dejar todas las luces prendidas: al tocar una, cambia ella y las de al lado.', 'Probá empezar tocando el foco del medio y mirá cómo cambian los demás. Se puede resolver en pocos toques.'] },
  { id: 'final', cuando: e => !e.flag('boleto_dado'), textos: ['Don Aurelio está esperando algo.', 'Quiere subir al micro de las 3:47, pero le falta el boleto.', 'Dale el boleto sellado: elegilo en la mochila y tocalo a él.'] },
];

// Tablero 3x3: se arma tocando los focos 0, 2, 4, 7 y 8 de una pantalla apagada (es resoluble).
function esc1LucesInicial(){ let est = Array.from({ length: 9 }).map(() => true); [1, 3, 4, 8].forEach(i => { est = escLucesAplicar(est, i); }); return est; }

const ESC1_SALAS = {
  sala: {
    id: 'sala', nombre: 'Sala de espera', ancho: 720, dibujar: esc1DibujarSala, dinamico: esc1DinamicoSala,
    oscura: e => e.flag('apagon'), musica: e => e.flag('apagon') ? 'oscuro' : 'tension', ambiente: ['crujido', 'susurro', 'parpadeo', 'chirrido', 'pasos', 'sombra'],
    alEntrar: async (e, primera) => {},
    objetos: [
      { id: 'puerta_boleteria', nombre: 'Boletería', x: 20, y: 100, w: 76, h: 212, pie: 58,
        toque: async e => {
          if(e.flag('puerta_boleteria_abierta')){ await e.ir('boleteria', 60, 1); return; }
          await e.yo('Cerrada con llave. Por el vidrio no se ve nada.', 'serio');
        },
        usar: { llave_boleteria: async e => {
          e.quitar('llave_boleteria'); e.set('puerta_boleteria_abierta'); if(typeof essPuerta === 'function') essPuerta();
          await e.yo('La llave gira con un chillido. La puerta se abre sola unos centímetros.', 'preocupado'); await e.ir('boleteria', 60, 1);
        } } },
      { id: 'telefono', nombre: 'Teléfono público', x: 104, y: 144, w: 54, h: 124, pie: 150,
        toque: async e => {
          if(e.flag('telefono_suena') && !e.flag('mensaje_tel')){
            e.set('mensaje_tel');
            e.cara('miedo', 5); await e.yo('Atiendo...', 'preocupado'); if(typeof essSusurro === 'function') essSusurro();
            await e.decir('…cuatro… uno… nueve…', { quien: 'voz', expr: 'miedo' });
            await e.decir('…no me dejen solo… el micro no sale… sin mí…', { quien: 'voz', expr: 'miedo' });
            if(typeof essSusto === 'function') essSusto(false);
            e.nota('mensaje_tel', 'Mensaje del teléfono', '«…<b>cuatro… uno… nueve…</b> No me dejen solo… el micro no sale sin mí…»');
            await e.bi('¡Anotalo! Yo ya me anoté... en el cuaderno, que no tengo manos.');
          }
          if(!e.flag('moneda2_tomada')){ e.set('moneda2_tomada'); await e.dar('moneda2', 'En la bandejita de devolución del teléfono hay una moneda.'); }
          else if(!e.flag('telefono_suena')) await e.yo('Línea muerta. Solo se escucha una respiración... o es el viento.', 'preocupado');
          else await e.yo('Ya no suena. Se escucha una respiración lenta del otro lado.', 'miedo');
        } },
      { id: 'cartelera', nombre: 'Cartelera de salidas', x: 168, y: 36, w: 150, h: 106, pie: 242,
        toque: async e => {
          e.nota('cartelera', 'Cartelera de salidas', ESC1_TABLA_SALIDAS);
          await e.leer('Cartelera de salidas', ESC1_TABLA_SALIDAS + '<p class="esc-chico">Todos "PARTIÓ" menos uno: "DEMORADO".</p>');
          if(!e.flag('cartelera_vista')){ e.set('cartelera_vista'); await e.yo('Un micro que sigue "demorado"... desde las 3:47.', 'curioso'); }
        } },
      { id: 'reloj', nombre: 'Reloj de pared', x: 325, y: 26, w: 56, h: 56, pie: 353,
        toque: async e => { e.set('reloj_visto'); await e.yo('El reloj está parado a las 3:47. El vidrio está rajado y la hora no se movió nunca.', 'curioso'); } },
      { id: 'tele', nombre: 'Televisor', x: 330, y: 176, w: 84, h: 86, pie: 372,
        toque: async e => {
          await e.yo('Solo nieve... Por un segundo me pareció ver una cara entre las rayas.', 'miedo');
          if(!e.flag('tele_vista')){ e.set('tele_vista'); if(typeof essSusurro === 'function') essSusurro(); await e.bi('Yo no vi nada. Yo cierro los ojos. ¿Ya pasó?'); }
        } },
      { id: 'control', nombre: 'Control remoto', x: 380, y: 248, w: 30, h: 16, pie: 396, visible: e => !e.flag('control_tomado'),
        toque: async e => { e.set('control_tomado'); await e.dar('control', 'Tomaste el control remoto. Está pegajoso y con la tapita atornillada.'); } },
      { id: 'maquina', nombre: 'Máquina de snacks', x: 432, y: 110, w: 80, h: 202, pie: 472,
        toque: async e => {
          await e.leer('Máquina de snacks', `<table class="esc-maquina"><tr><td></td><td>1</td><td>2</td><td>3</td></tr><tr><td>A</td><td>🍫</td><td>🍪</td><td>🥜</td></tr><tr><td>B</td><td>💧</td><td>🥤</td><td>🧃</td></tr><tr><td>C</td><td>🍬</td><td>🔋</td><td>🍭</td></tr></table><p class="esc-chico">Se elige una letra y un número. Solo acepta una moneda por vez.</p>`);
        },
        usar: (() => { const meter = id => async e => {
            const ok = await e.grupos({ titulo: 'Máquina de snacks', sub: 'Elegí la fila y la columna del producto', grupos: [['A', 'B', 'C'], ['1', '2', '3']], clave: 'C2' });
            if(!ok){ await e.yo('Mejor no gastar la moneda sin estar seguro.', 'serio'); return; }
            e.quitar(id); if(typeof essGolpe === 'function') essGolpe();
            await e.dar('pila_b', 'La máquina tragó la moneda y soltó una pila AA nueva en la bandeja.');
          }; return { moneda: meter('moneda'), moneda2: meter('moneda2') }; })() },
      { id: 'casilleros', nombre: 'Casilleros', x: 520, y: 114, w: 100, h: 198, pie: 570,
        toque: async e => {
          if(e.flag('casillero_abierto')){ await e.yo('El casillero A está abierto y vacío.', 'normal'); return; }
          const ok = await e.digitos({ titulo: 'Casillero A', sub: 'Candado de 3 números', n: 3, clave: '743' });
          if(!ok) return;
          e.set('casillero_abierto'); if(typeof essPuerta === 'function') essPuerta();
          await e.dar('linterna_v', 'Adentro hay una linterna.');
          await e.yo('¡Una linterna! Sin pilas, claro...', 'curioso');
          // se corta la luz
          e.set('apagon'); await e.asustar('apagon');
          if(typeof essAmbiente === 'function') essAmbiente('oscuro');
          e.asustar('sombra', { x: e.salaDef().ancho - 40 });
          await e.bi('¡¡Se apagó todo!! Quedate cerca: yo brillo un poquito.');
          await e.yo('Tengo que conseguir pilas para esta linterna.', 'preocupado');
          await e.esperar(1500);
          if(typeof essTelefono === 'function') essTelefono(3);
          e.set('telefono_suena');
          await e.bi('Eh... ¿ese es el teléfono? ¿A esta hora? Yo no atiendo.');
        } },
      { id: 'vidrios', nombre: 'Puertas a los andenes', x: 628, y: 86, w: 84, h: 226, pie: 650,
        toque: async e => { await e.yo('Una cadena gruesa y un candado enorme. Hay que llegar a los andenes por otro lado.', 'serio'); } },
      { id: 'banco_a', nombre: 'Banco', x: 170, y: 300, w: 130, h: 56, pie: 235,
        toque: async e => {
          if(!e.flag('moneda_tomada')){
            e.set('moneda_tomada');
            await e.dar('moneda', 'Entre los asientos hay una moneda y un papel doblado.');
            const txt = 'Dejé la linterna en mi casillero (el de la A). Se abre con la hora en que murió el reloj... pero al revés.<br><i>— A.</i>';
            e.nota('papelito', 'Papel del banco', txt);
            await e.leer('Papel doblado', `<p class="esc-manuscrito">${txt}</p>`);
            await e.yo('"La hora en que murió el reloj"... tiene que ser el de la pared.', 'curioso');
          } else await e.yo('Un banco de plástico naranja, rajado. No queda nada más.', 'normal');
        } },
      { id: 'banco_b', nombre: 'Banco', x: 430, y: 300, w: 130, h: 56, pie: 495,
        toque: async e => { await e.yo(e.flag('apagon') ? 'Un banco roto. Abajo hay mucha mugre, y está oscuro.' : 'Un banco de plástico, igual al otro. No hay nada acá.', 'normal'); } },
      { id: 'llave_b', nombre: 'Algo brilla', x: 488, y: 334, w: 28, h: 22, pie: 500, oculto: true, visible: e => e.flag('apagon') && !e.flag('llave_boleteria_tomada'),
        toque: async e => { e.set('llave_boleteria_tomada'); await e.dar('llave_boleteria', 'Debajo del banco había una llave oxidada con una etiqueta: BOLETERÍA.'); await e.bi('¡Brillaba! Yo lo sabía. (No sabía nada.)'); } },
      { id: 'basurero', nombre: 'Basurero', x: 98, y: 292, w: 34, h: 46, pie: 112,
        toque: async e => { await e.yo('Papeles viejos, un boleto del 87 hecho un bollo y... una cucaracha enorme. Mejor dejarlo.', 'serio'); } },
    ],
  },

  boleteria: {
    id: 'boleteria', nombre: 'Boletería', ancho: 700, dibujar: esc1DibujarBoleteria, dinamico: esc1DinamicoBoleteria,
    oscura: () => true, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sombra', 'campana'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(700); await e.bi('Qué frío hace acá... y qué silencio.');
      await e.esperar(1200); if(typeof essGolpe === 'function') essGolpe(); e.sacudir(0.4);
      e.fantasmaEn('ventana', { x: 160, y: 232, dur: 2.8, escala: 0.55, max: 0.7, dir: 1 }); if(typeof essSusurro === 'function') essSusurro();
      e.cara('miedo', 3);
      await e.bi('¡¡Ahí!! ¡En la ventanilla! ...¿o fue mi imaginación?');
      await e.yo('Si hay alguien, no quiere hablar. Hay que encontrar la forma de salir.', 'preocupado');
    },
    objetos: [
      { id: 'puerta_sala', nombre: 'Sala de espera', x: 14, y: 110, w: 58, h: 202, pie: 44, toque: async e => { await e.ir('sala', 520, 1); } },
      { id: 'ventanilla', nombre: 'Ventanilla', x: 78, y: 74, w: 170, h: 130, pie: 160,
        toque: async e => { await e.yo('Por la reja se ve la sala de espera, azulada. Parece más vieja desde acá.', 'preocupado'); } },
      { id: 'sello', nombre: 'Sello de fechas', x: 106, y: 158, w: 56, h: 48, pie: 134,
        toque: async e => {
          await e.yo(e.flag('sello_entintado') ? 'Un sello de fechas con ruedas de números. Ya tiene tinta.' : 'Un sello de fechas con ruedas de números. La almohadilla está seca como un hueso.', 'curioso');
        },
        usar: {
          tinta: async e => { e.quitar('tinta'); e.set('sello_entintado'); await e.yo('Le puse tinta a la almohadilla. Ahora el sello marca.', 'curioso'); },
          boleto: async e => {
            if(!e.flag('sello_entintado')){ await e.yo('El sello está seco: no va a marcar nada.', 'serio'); return; }
            const ok = await e.digitos({ titulo: 'Fecha del sello', sub: 'Ruedas: DÍA · MES · AÑO (6 números, ej: 010199)', n: 6, clave: '251087' });
            if(!ok){ await e.yo('Si me equivoco de fecha, el sello no sirve. Tengo que estar segura/o.', 'serio'); return; }
            e.quitar('boleto'); if(typeof essGolpe === 'function') essGolpe();
            await e.dar('boleto_sellado', '¡Clac! El boleto quedó sellado con la fecha justa.'); e.cara('alivio', 2.5);
          },
        } },
      { id: 'registradora', nombre: 'Caja registradora', x: 176, y: 146, w: 62, h: 60, pie: 206,
        toque: async e => { await e.yo('La caja está vacía. Hay un cartelito: "No hay cambio, sorry". Y una huella de mano en el polvo.', 'serio'); } },
      { id: 'maquina_boletos', nombre: 'Máquina de boletos', x: 252, y: 94, w: 84, h: 110, pie: 294,
        toque: async e => {
          if(!e.flag('papel')){ await e.yo('La pantalla dice "SIN PAPEL". Le falta un rollo.', 'serio'); return; }
          if(e.tiene('boleto') || e.tiene('boleto_sellado') || e.flag('boleto_dado')){ await e.yo('Ya imprimí el boleto que necesitaba.', 'normal'); return; }
          const i = await e.elegir('Máquina de boletos', ['Rufino · 21:10', 'Venado Tuerto · 23:30', 'Rosario · 00:15', 'Santa Fe · 01:40', 'Alejo Ledesma · 03:47'], 'Elegí el destino');
          if(i < 0) return;
          if(i !== 4){ if(typeof essError === 'function') essError(); await e.yo('"Ese servicio ya partió." La máquina no imprime.', 'serio'); return; }
          await e.dar('boleto', 'La máquina zumba y escupe un boleto amarillento: ALEJO LEDESMA · 03:47 · ANDÉN 5. Todavía sin sellar.');
        },
        usar: { rollo: async e => { e.quitar('rollo'); e.set('papel'); await e.yo('Puse el rollo. La pantalla se enciende: "ELIJA DESTINO".', 'curioso'); } } },
      { id: 'calendario', nombre: 'Calendario', x: 346, y: 50, w: 58, h: 86, pie: 375,
        toque: async e => {
          const html = `<table class="esc-cal"><tr><th colspan="7">OCTUBRE 1987</th></tr><tr><td>D</td><td>L</td><td>M</td><td>M</td><td>J</td><td>V</td><td>S</td></tr>${[0, 1, 2, 3, 4].map(r => '<tr>' + [0, 1, 2, 3, 4, 5, 6].map(c => { const d = r * 7 + c - 3; return d >= 1 && d <= 31 ? `<td${d === 23 ? ' class="esc-circ"' : ''}>${d}</td>` : '<td></td>'; }).join('') + '</tr>').join('')}</table><p class="esc-manuscrito">¡Ascenso!</p>`;
          e.nota('calendario', 'Calendario de la boletería', html);
          await e.leer('Calendario', html);
        } },
      { id: 'tablero_llaves', nombre: 'Tablero de llaves', x: 420, y: 112, w: 104, h: 120, pie: 470,
        toque: async e => {
          if(e.flag('tablero_abierto')){ if(!e.flag('llave_anden_tomada')){ e.set('llave_anden_tomada'); await e.dar('llave_anden', 'Sacaste la llave del gancho "ANDÉN 5".'); } else await e.yo('Quedan llaves que no abren nada útil.', 'normal'); return; }
          await e.yo('Un tablero con llaves detrás de un vidrio. La del gancho "ANDÉN 5" brilla. La cerradura es chiquita.', 'curioso');
        },
        usar: { llavecita: async e => { e.quitar('llavecita'); e.set('tablero_abierto'); if(typeof essPuerta === 'function') essPuerta(); await e.yo('Giré la llavecita y el vidrio se abrió.', 'curioso'); e.set('llave_anden_tomada'); await e.dar('llave_anden', 'Sacaste la llave del gancho "ANDÉN 5".'); } } },
      { id: 'caja_fuerte', nombre: 'Caja fuerte', x: 540, y: 226, w: 68, h: 86, pie: 570,
        toque: async e => {
          if(e.flag('caja_abierta')){ await e.yo('La caja fuerte está abierta y vacía.', 'normal'); return; }
          const ok = await e.digitos({ titulo: 'Caja fuerte de Aurelio', sub: 'Código de 4 números', n: 4, clave: '4195' });
          if(!ok) return;
          e.set('caja_abierta'); if(typeof essPuerta === 'function') essPuerta(); e.cara('alivio', 2);
          await e.dar('llave_deposito', 'La caja fuerte se abrió. Adentro hay una llave pesada: DEPÓSITO.');
        } },
      { id: 'nota_caja', nombre: 'Papel amarillo', x: 546, y: 188, w: 36, h: 36, pie: 560,
        toque: async e => {
          const txt = 'Caja de Aurelio.<br>Mis números: <b>los tres primeros me los dicta la voz</b>.<br>El último, el <b>andén</b> del servicio que nunca salió.';
          e.nota('nota_caja', 'Papel junto a la caja fuerte', txt);
          await e.leer('Papel amarillo', `<p class="esc-manuscrito">${txt}</p>`);
        } },
      { id: 'puerta_deposito', nombre: 'Depósito', x: 640, y: 100, w: 52, h: 212, pie: 662,
        toque: async e => {
          if(e.flag('deposito_abierto')){ await e.ir('deposito', 60, 1); return; }
          await e.yo('Una puerta de hierro con un cartel: DEPÓSITO. Necesita llave.', 'serio');
        },
        usar: { llave_deposito: async e => { e.quitar('llave_deposito'); e.set('deposito_abierto'); if(typeof essPuerta === 'function') essPuerta(); await e.yo('La puerta se abre con un quejido largo.', 'preocupado'); await e.ir('deposito', 60, 1); } } },
    ],
  },

  deposito: {
    id: 'deposito', nombre: 'Depósito', ancho: 720, dibujar: esc1DibujarDeposito, dinamico: esc1DinamicoDeposito,
    oscura: () => true, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sombra', 'campana'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(600); e.parpadear(1); await e.bi('Cuántas valijas... ¿y si alguna se mueve? ¡No me mires así, valija!');
      await e.yo('Alguien dejó todo esto hace mucho. Acá tiene que haber algo útil.', 'preocupado');
    },
    objetos: [
      { id: 'puerta_boleteria2', nombre: 'Boletería', x: 16, y: 110, w: 56, h: 202, pie: 44, toque: async e => { await e.ir('boleteria', 650, -1); } },
      { id: 'cartel_valijas', nombre: 'Aviso', x: 112, y: 94, w: 216, h: 34, pie: 220,
        toque: async e => { const t = '<b>¡ATENCIÓN!</b><br>De las cuatro etiquetas, <b>solo una dice la verdad</b>.<br><i>— El encargado</i>'; e.nota('cartel_valijas', 'Aviso sobre las valijas', t); await e.leer('Aviso', `<p class="esc-manuscrito">${t}</p>`); } },
      ...ESC1_VALIJAS.map(v => ({
        id: 'valija_' + v.id, nombre: 'Valija ' + v.nombre, x: v.x - 2, y: 142, w: 54, h: 74, pie: v.x + 24,
        toque: async e => {
          const i = await e.elegir('Valija ' + v.nombre, ['Leer la etiqueta', 'Abrirla'], 'La etiqueta cuelga del asa');
          if(i < 0) return;
          if(i === 0){
            e.nota('etiqueta_' + v.id, 'Etiqueta de la valija ' + v.nombre, `«${v.etiqueta}»`);
            await e.leer('Etiqueta · valija ' + v.nombre, `<p class="esc-manuscrito">«${v.etiqueta}»</p>`); return;
          }
          if(v.id === 'azul'){
            if(e.flag('rollo_tomado')){ await e.yo('La valija azul está abierta y ya no tiene nada.', 'normal'); return; }
            e.set('rollo_tomado'); e.cara('alivio', 2);
            await e.dar('rollo', 'Adentro, envuelto en un trapo, hay un rollo de papel térmico.'); return;
          }
          const textos = { roja: 'Adentro hay una mano pálida, aferrada al borde... ¡se mueve!', verde: 'Se abre sola y sale un olor a humedad... y un susurro: "Aquí no".', amarilla: 'Adentro hay una muñeca de porcelana con la cara partida. ¡Tiene los ojos abiertos!' }[v.id];
          const yaFallo = e.flag('fallo_' + v.id); e.set('fallo_' + v.id);
          await e.asustar('fuerte', { cuenta: !yaFallo });
          await e.decir(textos + ' No hay ningún rollo acá.', { quien: 'yo', expr: 'terror' });
          await e.bi(yaFallo ? 'Ya la habíamos abierto, ¿para qué insistís?' : '¡Mi corazoncito de logo! ¿Se puede evitar esto?');
        } })),
      { id: 'afiche', nombre: 'Afiche de normas', x: 356, y: 58, w: 92, h: 120, pie: 402,
        toque: async e => {
          const lineas = [['C', 'argá siempre de abajo hacia arriba.'], ['A', 'notá el dueño de cada valija.'], ['J', 'amás bloquees el pasillo.'], ['A', 'pilá hasta tres, no más.'], ['S', 'iempre con guantes.']];
          const html = '<div class="esc-normas">' + lineas.map(l => `<p><b>${l[0]}</b>${l[1]}</p>`).join('') + '</div>';
          e.nota('normas', 'Normas del depósito', html);
          await e.leer('NORMAS DEL DEPÓSITO', html);
        } },
      { id: 'tinta', nombre: 'Frasco de tinta', x: 368, y: 196, w: 28, h: 34, pie: 384, visible: e => !e.flag('tinta_tomada'),
        toque: async e => { e.set('tinta_tomada'); await e.dar('tinta', 'Un frasco de tinta azul para sellos. Todavía tiene un poco.'); } },
      { id: 'diario', nombre: 'Diario', x: 400, y: 214, w: 46, h: 18, pie: 424,
        toque: async e => {
          const t = '<b>Martes 20/10/87.</b> Hoy me prometieron el ascenso. Rodeé el 23 en el calendario, el día que me lo entregan.<br><br><b>Jueves 22/10.</b> El micro de Alejo Ledesma no salió: se rompió la bomba de agua. Salida "demorada" hasta nuevo aviso.<br><br><b>Sábado 24/10.</b> Todavía demorado. Dicen que mañana, <b>dos días después del 23</b>, a las 3:47, sale sí o sí. Me quedo a despedirlo yo mismo.<br><br><i>Acá termina el diario.</i>';
          e.nota('diario', 'Diario de Don Aurelio', t);
          await e.leer('Diario de Don Aurelio', `<p class="esc-manuscrito esc-largo">${t}</p>`);
          if(!e.flag('diario_leido')){ e.set('diario_leido'); e.cara('preocupado', 3); if(typeof essChirrido === 'function') essChirrido(); await e.yo('"Acá termina el diario"... Qué escalofrío.', 'preocupado'); }
        } },
      { id: 'caja_herr', nombre: 'Caja de herramientas', x: 488, y: 262, w: 70, h: 68, pie: 523,
        toque: async e => {
          if(e.flag('caja_herr_abierta')){ await e.yo('Solo quedan tornillos oxidados.', 'normal'); return; }
          const ok = await e.ruedas({ titulo: 'Caja de herramientas', sub: 'Candado de 5 letras. Etiqueta pegada: «Clave: las normas, en vertical».', n: 5, clave: 'CAJAS' });
          if(!ok) return;
          e.set('caja_herr_abierta'); if(typeof essPuerta === 'function') essPuerta(); e.set('fusible_tomado');
          await e.dar('fusible', 'Adentro hay un fusible grande, de los de tablero eléctrico.');
        } },
      { id: 'llavecita', nombre: 'Algo brilla', x: 312, y: 334, w: 30, h: 22, pie: 326, oculto: true, visible: e => !e.flag('llavecita_tomada'),
        toque: async e => { e.set('llavecita_tomada'); await e.dar('llavecita', 'Una llavecita plateada, de las de vitrina, entre el polvo.'); if(typeof essSusurro === 'function') essSusurro(); await e.bi('¿Escuchaste eso? Dijo "no te vayas". ¡Yo me voy igual!'); } },
      { id: 'cinta', nombre: 'Cinta transportadora', x: 566, y: 262, w: 134, h: 60, pie: 600,
        toque: async e => {
          await e.yo('La cinta se mueve sola, despacio. Pasa una valija vieja con una etiqueta: "A.R."', 'preocupado');
          if(!e.flag('cinta_vista')){ e.set('cinta_vista'); e.asustar('golpe'); await e.bi('Nada se mueve solo. Digo... sí, pero qué ganas de no mirar.'); }
        } },
      { id: 'puerta_anden', nombre: 'Andén', x: 658, y: 100, w: 54, h: 212, pie: 646,
        toque: async e => {
          if(e.flag('deposito_a_anden')){ await e.ir('anden', 60, 1); return; }
          await e.yo('La puerta que da al andén está cerrada con llave.', 'serio');
        },
        usar: { llave_anden: async e => { e.quitar('llave_anden'); e.set('deposito_a_anden'); if(typeof essPuerta === 'function') essPuerta(); await e.yo('La llave entra justa. Del otro lado se siente aire frío.', 'preocupado'); await e.ir('anden', 60, 1); } } },
    ],
  },

  anden: {
    id: 'anden', nombre: 'Andén 5', ancho: 720, dibujar: esc1DibujarAnden, dinamico: esc1DinamicoAnden,
    oscura: e => !e.flag('luz_anden'), musica: e => e.flag('luz_anden') ? 'calma' : 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'campana'],
    alEntrar: async (e, primera) => {
      if(e.flag('luz_anden') && !e.flag('boleto_dado')) e.fantasmaEn('quieto', { x: 505, y: 330, escala: 0.85, alfa: 0.88, max: 0.88, dir: -1 });
      if(!primera) return;
      await e.esperar(700); e.cara('curioso', 3);
      await e.yo('Un micro... con la B de Busmac. ¡Es la salida!', 'curioso');
      await e.bi('Está oscuro, apagado y... ¿por qué siento que alguien nos mira desde adentro?');
    },
    objetos: [
      { id: 'puerta_deposito2', nombre: 'Depósito', x: 10, y: 110, w: 54, h: 202, pie: 40, toque: async e => { await e.ir('deposito', 640, -1); } },
      { id: 'tablero_elec', nombre: 'Tablero eléctrico', x: 86, y: 126, w: 66, h: 100, pie: 119,
        toque: async e => {
          if(!e.flag('fusible_puesto')){ await e.yo('Un tablero abierto: "LUCES ANDÉN 5". Falta el fusible.', 'serio'); return; }
          if(e.flag('luz_anden')){ await e.yo('Las luces del andén funcionan.', 'normal'); return; }
          await esc1Luces(e);
        },
        usar: { fusible: async e => { e.quitar('fusible'); e.set('fusible_puesto'); await e.yo('Puse el fusible. Se ve un tablero de nueve focos, todos medio locos.', 'curioso'); await esc1Luces(e); } } },
      { id: 'cartel_anden', nombre: 'Cartel', x: 176, y: 64, w: 98, h: 38, pie: 224, sinResalte: true,
        toque: async e => { await e.yo('"ANDÉN 5". Hay una marca de manos en el polvo del cartel, muy arriba.', 'preocupado'); } },
      { id: 'banco_anden', nombre: 'Banco del andén', x: 168, y: 298, w: 92, h: 56, pie: 214,
        toque: async e => { await e.yo('Un banco de madera frío. Alguien dejó una gorra de boletero encima.', 'curioso'); } },
      { id: 'aurelio', nombre: 'Don Aurelio', x: 470, y: 120, w: 70, h: 200, pie: 440, visible: e => e.flag('luz_anden') && !e.flag('boleto_dado'),
        toque: async e => {
          if(!e.flag('aurelio_hablo')){ await esc1Aurelio1(e); return; }
          await e.decir('Sin boleto sellado... no se sube.', { quien: 'voz', expr: 'serio' });
        },
        usar: {
          boleto_sellado: async e => { await esc1Final(e); },
          boleto: async e => { await e.decir('Este boleto no tiene sello... No vale.', { quien: 'voz', expr: 'serio' }); },
          '*': async e => { await e.decir('Eso no es lo que busco, pasajero.', { quien: 'voz', expr: 'serio' }); },
        } },
      { id: 'puerta_micro', nombre: 'Puerta del micro', x: 560, y: 124, w: 56, h: 164, pie: 560,
        toque: async e => {
          if(!e.flag('luz_anden')){ await e.yo('El micro está apagado y cerrado. Si encontrara cómo darle luz al andén...', 'serio'); return; }
          if(!e.flag('aurelio_hablo')){ await esc1Aurelio1(e); return; }
          await e.yo('La puerta no se abre. Don Aurelio está parado al lado, esperando algo.', 'preocupado');
        },
        usar: { boleto_sellado: async e => { if(!e.flag('luz_anden')){ await e.yo('Primero tengo que dar luz al andén.', 'serio'); return; } await esc1Final(e); } } },
    ],
  },
};

async function esc1Luces(e){
  const ok = await e.luces({ titulo: 'Tablero del andén', sub: 'Dejá todos los focos prendidos. Al tocar uno, cambia él y los de al lado (arriba, abajo, izquierda, derecha).', inicial: esc1LucesInicial() });
  if(!ok) return;
  e.set('luz_anden');
  if(typeof essEncender === 'function') essEncender();
  e.flash('#fff6c0', 0.9); e.sacudir(0.3);
  if(typeof essAmbiente === 'function') essAmbiente('calma');
  await e.esperar(700);
  await e.yo('¡Se prendió todo! El micro tiene las luces encendidas.', 'alivio');
  await e.esperar(500);
  if(typeof essGolpe === 'function') essGolpe();
  e.fantasmaEn('quieto', { x: 505, y: 330, escala: 0.85, alfa: 0, max: 0.88, dir: -1 }); e.sacudir(0.4);
  e.cara('terror', 2.5);
  await e.bi('¡¡¡FANTASMAAA!!! ...que parece tener una gorra de boletero.');
  await esc1Aurelio1(e);
}

async function esc1Aurelio1(e){
  e.set('aurelio_hablo');
  const v = t => e.decir(t, { quien: 'voz', expr: 'serio' });
  await v('No tengas miedo, pasajero. Hace casi cuarenta años que espero acá.');
  await v('Soy Aurelio, el boletero. El micro de las 3:47 a Alejo Ledesma... nunca me dejaron subirlo.');
  await v('Me quedé a despedirlo y la terminal se cerró conmigo adentro. Desde entonces cierro, cierro, cierro...');
  await v('Solo puedo subir con un boleto sellado con la fecha justa del día que salía. Si me lo conseguís... te llevo yo mismo.');
  e.cara('curioso', 3);
  await e.yo('Un boleto sellado con la fecha de salida. Eso es lo que me falta.', 'curioso');
  await e.bi('Digo yo: ¿no sería más fácil si fuera un fantasma que pide pizza?');
}

async function esc1Final(e){
  e.set('boleto_dado'); e.quitar('boleto_sellado');
  e.cara('alivio', 5);
  const v = t => e.decir(t, { quien: 'voz', expr: 'alivio' });
  await v('Mi boleto... con el sello. Con la fecha justa.');
  await v('Casi cuarenta años esperando este momento. Gracias, pasajero.');
  if(typeof essCampana === 'function') essCampana();
  e.flash('#e8f4ff', 0.8);
  await e.esperar(900);
  e.fantasmaEn('quieto', { x: 575, y: 330, escala: 0.85, alfa: 0.9, max: 0.9, dir: -1 });
  await v('Ahora sí, puedo cerrar la terminal. Subí, que el micro sale ya.');
  e.quitarFantasma();
  if(typeof essMotor === 'function') essMotor();
  e.sacudir(0.8); e.flash('#fff3b0', 0.7);
  await e.narrar('El micro de las 3:47 arrancó, por fin, después de casi cuarenta años.');
  await e.narrar('Subiste. Al volante, una gorra de boletero y una sonrisa que, por primera vez, no daba miedo.');
  await e.bi('¡Escapamos! Y yo no grité... mucho.');
  if(typeof essFinal === 'function') essFinal();
  await e.esperar(1800);
  await e.fin();
}

ESC_JUEGOS.terminal = {
  id: 'terminal', titulo: 'La terminal a medianoche', emoji: '🚌', dificultad: 'Difícil', salasTotal: 4,
  resumen: 'Te dormiste en la terminal y el último micro ya salió. Las luces se cortan, el teléfono suena solo y alguien sigue cerrando las puertas desde hace casi cuarenta años.',
  inicio: { sala: 'sala', x: 130 },
  items: ESC1_ITEMS, combos: ESC1_COMBOS, pistas: ESC1_PISTAS, salas: ESC1_SALAS,
  intro: async e => {
    await e.narrar('Terminal Central. 23:47.');
    await e.narrar('Te dormiste esperando el micro de las doce. Cuando abrís los ojos, la sala está vacía.');
    if(typeof essSusurro === 'function') essSusurro();
    e.parpadear(1); e.cara('preocupado', 4);
    await e.yo('¿Hola? ¿Hay alguien?', 'preocupado');
    await e.bi('Psst. Soy Bi, tu compañero. Ni se te ocurra gritar: acá hay algo que no me gusta nada.');
    await e.yo('Tengo que salir de la terminal. Las puertas de vidrio están encadenadas, así que tiene que haber otra salida hacia los andenes.', 'serio');
    await e.bi('Tocá un lugar del piso para caminar y tocá las cosas para revisarlas. Abajo tenés la mochila, arriba el cuaderno 📓 y las pistas 💡. ¡Y quedate cerquita mío!');
  },
};
