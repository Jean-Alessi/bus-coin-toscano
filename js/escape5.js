// Bus-queda 5: "El mapa del tesoro". 4 lugares: Plaza de Villa Silencio → Almacén de ramos generales → Iglesia → Cementerio.
//
// La historia: la excursión del micro paró en Villa Silencio, un pueblo abandonado donde dicen que Don Bartolo Ferrer enterró un
// tesoro en 1923. Te quedaste atrás con la noche encima. El campanero del pueblo, el Sepulturero, sigue esperando el último toque
// de campana: perdió el badajo (la lengüeta de la campana) y no puede avisar que amaneció. El micro vuelve a las 6:00.
//
// Camino de la solución:
//  Plaza:      kiosco: toque de campana "grave, agudo, grave, grave" y la mitad del mapa (empieza en la tumba de Bartolo; seguí el vitral).
//              Monumento: Bartolo Ferrer 1860–1923 → portón del cementerio 1923. Mango de pala escondido (con luz).
//  Almacén:    lista de precios: docena de velas $35 + kilo de sal $8 = 43 → caja registradora 043 → llave de la iglesia. Otra mitad del mapa (leyenda de colores).
//  Iglesia:    cuerda de la campana: grave, agudo, grave, grave → se abre la sacristía (cabeza de pala). Vitral: rojo, rojo, azul, verde, azul.
//  Cementerio: pala (mango + cabeza). Camino desde la tumba de Bartolo con la leyenda (rojo=N, azul=E, verde=S, amarillo=O): N,N,E,S,E → cofre con el badajo.
//  Final:      el badajo a la campana; toque del alba (agudo, agudo, grave, agudo) que dice la carta del cofre.

function esc5Edificio(ctx, x, y, w, h, c, o){
  o = o || {};
  EA.rr(ctx, x, y, w, h, 3, c, EA.OL, 2.6);
  for(let i = 0; i < (o.vent || 0); i++){ const vx = x + 16 + i * ((w - 32 - 26) / Math.max(1, (o.vent - 1))); EA.rr(ctx, vx, y + 22, 26, 36, 3, o.luz ? '#f2d98a' : '#0c101c', EA.OL, 2); EA.linea(ctx, vx + 13, y + 22, vx + 13, y + 58, EA.OL, 1.6); }
  if(o.techo){ EA.poly(ctx, [[x - 8, y], [x + w / 2, y - 40], [x + w + 8, y]], o.techo, EA.OL, 2.6); }
}

function esc5DibujarPlaza(ctx, e){
  const W = 1000;
  const cielo = ctx.createLinearGradient(0, 0, 0, 306); cielo.addColorStop(0, '#080d22'); cielo.addColorStop(1, '#27304f'); ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, 306);
  for(let i = 0; i < 60; i++){ ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 5) * 0.12) + ')'; ctx.fillRect((i * 83) % W, 12 + (i * 47) % 150, 1.6, 1.6); }
  EA.circ(ctx, 760, 64, 24, '#f1ecd2'); EA.circ(ctx, 770, 58, 22, '#1a2240');
  // edificios
  esc5Edificio(ctx, 90, 110, 130, 200, '#6a5444', { vent: 2, techo: '#5a3a2a' }); EA.rr(ctx, 118, 74, 74, 22, 3, '#e8d8a0', EA.OL, 2); EA.txt(ctx, 'ALMACÉN', 155, 85, 11, '#5a1a1a', 'center', '800');
  EA.rr(ctx, 126, 190, 58, 120, 3, '#4a2e1c', EA.OL, 2.4); EA.circ(ctx, 174, 252, 3, '#d9b73c');
  // iglesia con torre y reloj
  esc5Edificio(ctx, 420, 120, 190, 190, '#8a8478', { techo: '#5a4a3a' }); EA.rr(ctx, 480, 20, 70, 120, 3, '#8a8478', EA.OL, 2.6); EA.poly(ctx, [[474, 22], [515, 0], [556, 22]], '#4a3a2c', EA.OL, 2.4);
  EA.circ(ctx, 515, 58, 20, '#e9e4d4', EA.OL, 2.6); EA.linea(ctx, 515, 58, 515, 44, '#222', 2.4); EA.linea(ctx, 515, 58, 526, 62, '#222', 2);
  EA.rr(ctx, 500, 88, 30, 30, 3, '#1a1410', EA.OL, 2); EA.circ(ctx, 515, 104, 10, '#b8860b', EA.OL, 2);
  EA.rr(ctx, 480, 190, 70, 120, 28, '#4a2e1c', EA.OL, 2.6); EA.linea(ctx, 515, 190, 515, 310, EA.OL, 2); EA.circ(ctx, 507, 252, 3, '#d9b73c'); EA.circ(ctx, 523, 252, 3, '#d9b73c');
  EA.linea(ctx, 515, 150, 515, 176, '#d8cfb8', 3); EA.linea(ctx, 504, 160, 526, 160, '#d8cfb8', 3);
  // kiosco
  EA.rr(ctx, 246, 190, 96, 120, 3, '#2f6a5a', EA.OL, 2.4); EA.poly(ctx, [[238, 190], [294, 160], [350, 190]], '#c0392b', EA.OL, 2.4); EA.rr(ctx, 258, 206, 72, 40, 2, '#0c101c', EA.OL, 1.8); EA.rr(ctx, 252, 248, 84, 8, 2, '#8a5a30', EA.OL, 1.8);
  EA.txt(ctx, 'KIOSCO', 294, 178, 9, '#fff', 'center', '800');
  if(!e.flag('kiosco_pieza')){ EA.poly(ctx, [[268, 232], [292, 230], [294, 246], [270, 248]], '#e8d8a0', EA.OL, 1.2); }
  // fuente seca y monumento
  EA.rr(ctx, 650, 268, 120, 40, 8, '#8a8f98', EA.OL, 2.4); EA.rr(ctx, 662, 276, 96, 24, 6, '#3a3f48', EA.OL, 1.6); EA.rr(ctx, 702, 214, 16, 58, 4, '#a0a6b0', EA.OL, 2); EA.circ(ctx, 710, 212, 10, '#a0a6b0', EA.OL, 2);
  EA.rr(ctx, 600, 218, 40, 90, 3, '#aeb4be', EA.OL, 2.4); EA.rr(ctx, 604, 232, 32, 34, 2, '#e8e4d4', EA.OL, 1.4); ['Bartolo Ferrer', '1860 – 1923', 'Fundador'].forEach((l, i) => EA.txt(ctx, l, 620, 240 + i * 9, i === 1 ? 5.6 : 5, '#3a3226', 'center', '700'));
  // árbol seco y poste del micro
  EA.linea(ctx, 400, 310, 396, 220, '#2a1c14', 9); EA.linea(ctx, 396, 240, 370, 200, '#2a1c14', 5); EA.linea(ctx, 398, 226, 424, 190, '#2a1c14', 5); EA.linea(ctx, 380, 214, 366, 186, '#2a1c14', 3);
  EA.linea(ctx, 810, 310, 810, 190, '#8a929c', 4); EA.rr(ctx, 790, 176, 52, 22, 3, '#0f3a7a', EA.OL, 1.8); EA.txt(ctx, '🚌 6:00', 816, 187, 8, '#fff', 'center', '800');
  // portón del cementerio
  EA.rr(ctx, 870, 100, 110, 214, 3, '#2a2f38', EA.OL, 3); for(let x = 880; x < 976; x += 12){ EA.linea(ctx, x, 106, x, 308, '#6a707c', 3); EA.circ(ctx, x, 104, 3, '#6a707c'); }
  EA.linea(ctx, 870, 190, 980, 190, '#6a707c', 3); EA.linea(ctx, 870, 260, 980, 260, '#6a707c', 3);
  if(!e.flag('cementerio_abierto')){ ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(872, 205); ctx.lineTo(978, 218); ctx.moveTo(872, 218); ctx.lineTo(978, 205); ctx.stroke(); EA.rr(ctx, 912, 200, 22, 26, 4, '#c9a53a', EA.OL, 2); EA.circ(ctx, 923, 213, 3, '#3a2a10'); }
  EA.rr(ctx, 890, 62, 70, 26, 3, '#1a1410', EA.OL, 2); EA.txt(ctx, 'CEMENTERIO', 925, 75, 8, '#d8cfb8', 'center', '800');
  // piso de tierra
  const f = ctx.createLinearGradient(0, 306, 0, 440); f.addColorStop(0, '#4a4034'); f.addColorStop(1, '#2e2820'); ctx.fillStyle = f; ctx.fillRect(0, 306, W, 134); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 306, W, 4);
  for(let i = 0; i < 40; i++){ ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect((i * 61) % W, 330 + (i * 29) % 90, 10 + i % 6, 2); }
}

function esc5DinamicoPlaza(ctx, e, t){
  if(!e.flag('mango_tomado') && e.enLuz(566, 352)){ EA.rr(ctx, 548, 350, 40, 6, 3, '#8a5a30', EA.OL, 1.4); esc1Brillito(ctx, 592, 344, t); }
  // hojas secas
  for(let i = 0; i < 6; i++){ const x = (t * 20 + i * 170) % 1000, y = 320 + Math.sin(t * 2 + i) * 6 + i * 12; ctx.fillStyle = 'rgba(160,110,50,.5)'; ctx.fillRect(x, y, 5, 3); }
}

function esc5DibujarAlmacen(ctx, e){
  const W = 760;
  EA.cuarto(ctx, W, { pared: ['#6a5a46', '#8a7860'], zocalo: '#3a2e20', piso: ['#6a5238', '#4a3826'], manchas: [[200, 120, 70], [560, 80, 50]], grietas: [[420, 34]] });
  EA.linea(ctx, 380, 12, 380, 40, '#222', 2); EA.circ(ctx, 380, 48, 8, '#f4e6a8', EA.OL, 1.6);
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#4a2e1c' });
  // mostrador y caja registradora
  EA.rr(ctx, 90, 232, 250, 80, 3, '#5a3a22', EA.OL, 2.4); EA.rr(ctx, 84, 220, 262, 14, 3, '#8a5a30', EA.OL, 2.2);
  EA.rr(ctx, 150, 168, 70, 52, 4, '#a89a6a', EA.OL, 2.2); EA.rr(ctx, 158, 150, 54, 22, 3, '#2d3b2d', EA.OL, 1.6); EA.txt(ctx, e.flag('caja_registradora_abierta') ? '' : '000', 185, 161, 9, '#9dff9d', 'center', '800');
  for(let i = 0; i < 6; i++) EA.circ(ctx, 160 + (i % 3) * 20, 186 + Math.floor(i / 3) * 14, 4, '#e6ddb8', EA.OL, 0.8);
  if(e.flag('caja_registradora_abierta')) EA.rr(ctx, 156, 204, 58, 16, 2, '#0a0806', EA.OL, 1.4);
  // lista de precios
  EA.rr(ctx, 366, 64, 120, 118, 3, '#243a2e', EA.OL, 3); EA.txt(ctx, 'PRECIOS', 426, 78, 9, '#f4f0e4', 'center', '800');
  [['Yerba', '40'], ['Azúcar', '25'], ['Docena de velas', '35'], ['Kilo de sal', '8'], ['Fósforos', '5']].forEach(([n, p], i) => { EA.txt(ctx, n, 376, 96 + i * 16, 7.4, '#e8e4d4', 'left', '600'); EA.txt(ctx, '$' + p, 478, 96 + i * 16, 7.4, '#ffd84d', 'right', '800'); });
  // cartel sobre la caja
  EA.poly(ctx, [[232, 150], [320, 146], [322, 190], [234, 194]], '#f6e27a', EA.OL, 1.6); EA.txt(ctx, 'Clave de la caja:', 277, 160, 6.4, '#3a2a10', 'center', '800'); EA.txt(ctx, 'docena de velas', 277, 172, 6.2, '#3a2a10', 'center', '700'); EA.txt(ctx, '+ kilo de sal', 277, 183, 6.2, '#3a2a10', 'center', '700');
  // barril de galletitas
  EA.rr(ctx, 520, 244, 70, 68, 8, '#8a5a30', EA.OL, 2.4); [256, 276, 296].forEach(y => EA.linea(ctx, 520, y, 590, y, '#3a2410', 2)); EA.rr(ctx, 514, 236, 82, 10, 4, '#a8743a', EA.OL, 2);
  if(!e.flag('pieza_b_tomada')){ EA.poly(ctx, [[540, 232], [566, 228], [570, 242], [544, 246]], '#e8d8a0', EA.OL, 1.2); }
  // estante con frascos
  EA.rr(ctx, 620, 140, 110, 8, 2, '#6a4422', EA.OL, 1.8); EA.rr(ctx, 620, 210, 110, 8, 2, '#6a4422', EA.OL, 1.8); [632, 664, 696].forEach((x, i) => { EA.rr(ctx, x, 106, 22, 34, 4, ['#c9a53a', '#2e8a5a', '#c2312f'][i], EA.OL, 1.6); EA.rr(ctx, x, 176, 22, 34, 4, ['#8a5a30', '#2f63b8', '#d9ac2a'][i], EA.OL, 1.6); });
}

function esc5DibujarIglesia(ctx, e){
  const W = 900;
  EA.cuarto(ctx, W, { pared: ['#6a645a', '#8a8478'], zocalo: '#3a342c', piso: ['#6a5a48', '#4a3e30'], manchas: [[260, 130, 80], [640, 90, 60]], grietas: [[380, 36], [780, 40]] });
  [200, 600].forEach(x => { EA.linea(ctx, x, 12, x, 48, '#222', 2); for(let i = -1; i <= 1; i++) EA.circ(ctx, x + i * 16, 54, 5, '#f4e6a8', EA.OL, 1.4); EA.linea(ctx, x - 18, 50, x + 18, 50, '#b8860b', 3); });
  EA.puerta(ctx, 14, 110, 62, 202, { color: '#4a2e1c' });
  // bancos
  [110, 250].forEach(x => { EA.rr(ctx, x, 296, 120, 14, 3, '#6a4422', EA.OL, 2); EA.rr(ctx, x, 270, 120, 24, 3, '#7a5232', EA.OL, 2); [x + 8, x + 106].forEach(px => EA.linea(ctx, px, 310, px, 340, '#4a3020', 4)); });
  // vitral de cinco paneles
  EA.rr(ctx, 400, 40, 150, 170, 62, '#1a1410', EA.OL, 3);
  [['#d33', 'rojo'], ['#d33', 'rojo'], ['#37e', 'azul'], ['#2b4', 'verde'], ['#37e', 'azul']].forEach(([c, n], i) => { EA.rr(ctx, 412 + (i % 3) * 42, 64 + Math.floor(i / 3) * 58 + (i % 3 === 1 ? 14 : 0), 34, 48, 6, c, EA.OL, 1.6); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(416 + (i % 3) * 42, 68 + Math.floor(i / 3) * 58 + (i % 3 === 1 ? 14 : 0), 8, 40); });
  // altar
  EA.rr(ctx, 590, 236, 130, 76, 3, '#7a5232', EA.OL, 2.4); EA.rr(ctx, 580, 226, 150, 12, 3, '#d8cfb8', EA.OL, 2); EA.linea(ctx, 655, 130, 655, 220, '#d8cfb8', 5); EA.linea(ctx, 634, 156, 676, 156, '#d8cfb8', 5);
  [610, 700].forEach(x => { EA.rr(ctx, x, 196, 10, 30, 2, '#f4efd8', EA.OL, 1.4); EA.circ(ctx, x + 5, 190, 3, '#ffb347'); });
  // cuerda de la campana
  EA.linea(ctx, 760, 20, 760, 290, '#c9b98a', 4); EA.circ(ctx, 760, 292, 8, '#8a5a30', EA.OL, 1.8); EA.rr(ctx, 744, 14, 32, 24, 4, '#b8860b', EA.OL, 2);
  // sacristía
  const sa = e.flag('sacristia_abierta');
  EA.puerta(ctx, 800, 110, 62, 202, { color: sa ? '#4a2e1c' : '#3a2418', abierta: sa, cartel: 'SACRISTÍA' });
  if(!sa) EA.rr(ctx, 826, 220, 14, 18, 3, '#6a6f78', EA.OL, 1.4);
}

function esc5DinamicoIglesia(ctx, e, t){
  [615, 705].forEach(x => { ctx.fillStyle = 'rgba(255,190,90,' + (0.18 + 0.08 * Math.sin(t * 9 + x)) + ')'; ctx.beginPath(); ctx.arc(x, 192, 18, 0, 7); ctx.fill(); });
  const g = ctx.createLinearGradient(475, 100, 475, 300); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(430, 100); ctx.lineTo(520, 100); ctx.lineTo(560, 300); ctx.lineTo(400, 300); ctx.fill();
}

function esc5DibujarCementerio(ctx, e){
  const W = 900;
  const cielo = ctx.createLinearGradient(0, 0, 0, 306); cielo.addColorStop(0, '#060a1c'); cielo.addColorStop(1, '#1c2442'); ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, 306);
  for(let i = 0; i < 50; i++){ ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 5) * 0.12) + ')'; ctx.fillRect((i * 89) % W, 12 + (i * 41) % 160, 1.6, 1.6); }
  EA.circ(ctx, 700, 70, 22, '#f1ecd2'); EA.circ(ctx, 709, 64, 20, '#141a34');
  // niebla baja y cerca
  ctx.fillStyle = 'rgba(160,180,210,.07)'; ctx.fillRect(0, 220, W, 90);
  for(let x = 0; x < W; x += 20){ EA.linea(ctx, x, 150, x, 300, 'rgba(40,46,60,.9)', 3); } EA.linea(ctx, 0, 190, W, 190, 'rgba(40,46,60,.9)', 3); EA.linea(ctx, 0, 260, W, 260, 'rgba(40,46,60,.9)', 3);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 140, W, 170);
  const f = ctx.createLinearGradient(0, 306, 0, 440); f.addColorStop(0, '#3a3a2c'); f.addColorStop(1, '#22221a'); ctx.fillStyle = f; ctx.fillRect(0, 306, W, 134); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 306, W, 4);
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#2a2f38' });
  // tumbas
  const tumba = (x, y, w, h, txt, c) => { EA.rr(ctx, x, y, w, h, w / 2, c || '#8a8f98', EA.OL, 2.4); EA.linea(ctx, x + w / 2, y + 10, x + w / 2, y + 26, 'rgba(0,0,0,.4)', 3); EA.linea(ctx, x + w / 2 - 7, y + 17, x + w / 2 + 7, y + 17, 'rgba(0,0,0,.4)', 3); if(txt) EA.txt(ctx, txt, x + w / 2, y + h - 14, 5.8, '#2a2a30', 'center', '700'); };
  tumba(120, 220, 56, 90, 'L. Pérez', '#7a7f88'); tumba(210, 232, 50, 78, 'M. Gómez', '#868b94'); tumba(300, 200, 70, 110, 'B. FERRER', '#a0a6b0'); tumba(430, 228, 52, 82, 'A. Soto', '#7a7f88');
  EA.circ(ctx, 335, 190, 7, '#e6c14b'); EA.txt(ctx, '1923', 335, 280, 6, '#3a3226', 'center', '800');
  // parcela para cavar
  const ca = e.flag('cofre_hallado');
  ctx.fillStyle = ca ? 'rgba(20,14,10,.8)' : 'rgba(70,56,40,.55)'; ctx.beginPath(); ctx.ellipse(640, 340, 70, 16, 0, 0, 7); ctx.fill();
  if(e.flag('parcela_cavada')){ EA.rr(ctx, 600, 322, 80, 30, 4, '#3a2410', EA.OL, 2); EA.rr(ctx, 612, 316, 56, 18, 3, '#8a5a30', EA.OL, 2); EA.txt(ctx, ca ? '' : '?', 640, 326, 10, '#ffd84d', 'center', '800'); }
  // galpón
  EA.rr(ctx, 780, 160, 100, 150, 3, '#4a3a2c', EA.OL, 2.6); EA.poly(ctx, [[772, 160], [830, 130], [888, 160]], '#2a1c14', EA.OL, 2.4); EA.rr(ctx, 810, 220, 40, 90, 2, '#2a1c14', EA.OL, 2);
}

function esc5DinamicoCementerio(ctx, e, t){
  ctx.fillStyle = 'rgba(160,190,230,' + (0.05 + 0.03 * Math.sin(t * 0.8)) + ')'; ctx.fillRect(0, 250, 900, 90);
}

// El Sepulturero: sombrero ancho, tapado largo, la cara vacía, una pala y un farol de llama azul.
function esc5Espectro(ctx, t, f){
  const bamb = Math.sin(t * 2.0) * 2.5;
  const g = ctx.createRadialGradient(0, -110, 10, 0, -110, 120); g.addColorStop(0, 'rgba(120,170,255,.22)'); g.addColorStop(1, 'rgba(120,170,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -110, 120, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(26,30,44,.94)'; ctx.strokeStyle = 'rgba(10,12,20,.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-22, -150); ctx.quadraticCurveTo(-40, -80, -36 + bamb, -2);
  for(let i = 0; i <= 6; i++) ctx.lineTo(-36 + i * 12 + bamb, -2 + (i % 2 ? 12 : -3) + Math.sin(t * 3 + i) * 3);
  ctx.quadraticCurveTo(40, -80, 22, -150); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,76,96,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -140); ctx.lineTo(0, -10); ctx.stroke();
  // pala apoyada
  ctx.strokeStyle = 'rgba(120,90,60,.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(38, -170); ctx.lineTo(40, -4); ctx.stroke(); ctx.fillStyle = 'rgba(150,156,170,.95)'; ctx.beginPath(); ctx.moveTo(32, -4); ctx.lineTo(48, -4); ctx.lineTo(44, 14); ctx.lineTo(36, 14); ctx.closePath(); ctx.fill();
  // farol con llama azul
  ctx.strokeStyle = 'rgba(200,210,230,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-34, -112); ctx.lineTo(-42, -84); ctx.stroke(); ctx.fillStyle = 'rgba(40,50,80,.9)'; ctx.fillRect(-52, -84, 20, 26); ctx.fillStyle = 'rgba(120,180,255,' + (0.8 + Math.sin(t * 9) * 0.15) + ')'; ctx.beginPath(); ctx.ellipse(-42, -70, 5, 10, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(30,34,50,.97)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; [-1, 1].forEach(l => { ctx.beginPath(); ctx.moveTo(l * 22, -140); ctx.quadraticCurveTo(l * 38, -108, l * 34, -86); ctx.stroke(); });
  // cabeza con sombrero y la cara vacía
  ctx.fillStyle = 'rgba(30,34,48,.98)'; ctx.beginPath(); ctx.ellipse(0, -164, 14, 20, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(20,22,32,.98)'; ctx.beginPath(); ctx.ellipse(0, -176, 34, 7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-17, -176); ctx.quadraticCurveTo(0, -214, 17, -176); ctx.fill();
  ctx.fillStyle = 'rgba(232,236,246,.95)'; ctx.beginPath(); ctx.ellipse(0, -160, 9, 12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#05060b'; [-4, 4].forEach(ox => { ctx.beginPath(); ctx.ellipse(ox, -162, 2.6, 4, 0, 0, 7); ctx.fill(); }); ctx.beginPath(); ctx.ellipse(0, -151, 3, 3.6 + Math.abs(Math.sin(t * 2)) * 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(150,210,255,.95)'; [-4, 4].forEach(ox => { ctx.beginPath(); ctx.arc(ox, -161, 1.1, 0, 7); ctx.fill(); });
}

const ESC5_ITEMS = {
  linterna_lista: { nombre: 'Celular (linterna)', icono: '🔦', desc: 'La linterna del celular. Se prende sola con la oscuridad.' },
  llave_iglesia: { nombre: 'Llave de la iglesia', icono: '🗝️', desc: 'Una llave larga y fría. Dice: IGLESIA.' },
  mango: { nombre: 'Mango de pala', icono: '🪵', desc: 'Un mango de madera largo. Le falta la parte de metal.' },
  cabeza_pala: { nombre: 'Cabeza de pala', icono: '⛏️', desc: 'La parte de metal de una pala, sin mango.' },
  pala: { nombre: 'Pala', icono: '🪏', desc: 'Una pala entera. Sirve para cavar.' },
  badajo: { nombre: 'Badajo de la campana', icono: '🔔', desc: 'La lengüeta de bronce de la campana. Estaba enterrada.' },
};
const ESC5_COMBOS = [
  { a: 'mango', b: 'cabeza_pala', da: 'pala', texto: 'Encajaste la cabeza de pala en el mango. Ahora sí es una pala.' },
];

const ESC5_PISTAS = [
  EO.pista('kiosco', e => !e.flag('kiosco_pieza'), ['En un pueblo abandonado, el kiosco suele guardar papeles. Mirá el de la plaza.', 'Hay un papel debajo del mostrador del kiosco, con una mitad de mapa.', 'Tocá el kiosco: tiene una pieza del mapa y la nota del toque de campana.']),
  EO.pista('caja', e => !e.flag('caja_registradora_abierta'), ['El almacén tiene una caja registradora con candado de 3 números.', 'Un cartel sobre la caja dice qué sumar. Los precios están en la pizarra.', 'Docena de velas $35 + kilo de sal $8 = 43: escribí 043.']),
  EO.pista('iglesia', e => !e.flag('iglesia_abierta'), ['La iglesia está cerrada. Las llaves suelen guardarse en la caja registradora del almacén.', 'Abrí la caja registradora y usá la llave en la puerta de la iglesia.', 'Con la llave de la iglesia, tocá la puerta grande de la iglesia.']),
  EO.pista('campana', e => !e.flag('sacristia_abierta'), ['La sacristía está cerrada con un mecanismo. La cuerda de la campana tiene algo que ver.', 'El kiosco tenía una nota con el toque de difuntos: grave, agudo, grave, grave.', 'Tocá la cuerda de la campana en ese orden: grave, agudo, grave, grave.']),
  EO.pista('mango', e => !e.tiene('mango') && !e.flag('mango_tomado') && !e.tiene('pala'), ['Para cavar necesitás una pala. En la plaza hay algo en el piso.', 'Con la linterna, mirá cerca del monumento a Bartolo.', 'En el piso, junto al monumento, hay un mango de pala.']),
  EO.pista('pala', e => !e.tiene('pala') && !e.flag('pala_hecha'), ['Una pala necesita mango y cabeza.', 'La cabeza de pala está en la sacristía de la iglesia.', 'Combiná el mango con la cabeza de pala en la mochila.']),
  EO.pista('portón', e => !e.flag('cementerio_abierto'), ['El portón del cementerio tiene un candado de 4 números y un cartel.', 'Mirá el monumento de la plaza: dice cuándo se apagó el fundador.', 'Bartolo murió en 1923: escribí 1923.']),
  EO.pista('mapa', e => !e.flag('mapa_completo'), ['Las dos mitades del mapa dicen cómo seguir. Una está en el kiosco y otra en el almacén (dentro del barril).', 'Una mitad dice que hay que seguir el vitral; la otra explica qué significa cada color.', 'Rojo = Norte, azul = Este, verde = Sur, amarillo = Oeste. Mirá el vitral de la iglesia.']),
  EO.pista('cavar', e => !e.flag('cofre_hallado'), ['Empezá en la tumba de Bartolo y seguí el camino del vitral con la leyenda de colores.', 'El vitral dice: rojo, rojo, azul, verde, azul. Cambialo por direcciones.', 'Norte, Norte, Este, Sur, Este. Usá la pala en la parcela de tierra.']),
  EO.pista('final', e => !e.flag('amanecio'), ['El cofre tiene algo que le falta a la campana: el badajo.', 'Poné el badajo en la campana de la iglesia y tocá el toque del alba que dice la carta del cofre.', 'El toque del alba: agudo, agudo, grave, agudo (en la cuerda de la campana).']),
];

const ESC5_SALAS = {
  plaza: {
    id: 'plaza', nombre: 'Plaza de Villa Silencio', ancho: 1000, dibujar: esc5DibujarPlaza, dinamico: esc5DinamicoPlaza,
    oscura: () => true, penumbra: 0.74, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'sfx:viento', 'pasos', 'sombra', 'campana', 'chirrido'],
    alEntrar: async () => {},
    objetos: [
      EO.puerta({ id: 'puerta_almacen', nombre: 'Almacén', x: 120, y: 188, w: 70, h: 124, pie: 156, a: 'almacen', xa: 60, dir: 1 }),
      { id: 'kiosco', nombre: 'Kiosco', x: 236, y: 160, w: 120, h: 152, pie: 294,
        toque: async e => {
          if(!e.flag('kiosco_pieza')){
            e.set('kiosco_pieza');
            const a = '<b>MITAD DEL MAPA (1/2)</b><br>«Empezá en la tumba de Bartolo. Después seguí el camino que marca el <b>vitral</b> de la iglesia.»';
            e.nota('pieza_a', 'Mitad del mapa (1/2)', a);
            await e.leer('Papel debajo del mostrador', `<p class="esc-manuscrito">${a}</p>`);
            const b = '<b>TOQUE DE DIFUNTOS</b><br>Se toca la campana así: <b>grave, agudo, grave, grave</b>.';
            e.nota('toque', 'Nota del campanero', b);
            await e.leer('Nota del campanero', `<p class="esc-manuscrito">${b}</p>`);
            await esc5Mapa(e);
          } else await e.yo('El kiosco sigue cerrado desde hace décadas. Todavía huele a caramelos viejos.', 'normal');
        } },
      EO.mirar('reloj_torre', 'Reloj de la torre', 480, 20, 70, 140, 'El reloj de la iglesia marca las 4:20 desde hace mucho. Cuando lo miro, el minutero se mueve un poquito.', 'miedo', { pie: 515 }),
      { id: 'monumento', nombre: 'Monumento', x: 596, y: 214, w: 48, h: 94, pie: 620,
        toque: async e => { const t = '«<b>Bartolo Ferrer</b><br>1860 – 1923<br>Fundador de Villa Silencio»'; e.nota('monumento', 'Monumento de la plaza', t); await e.leer('Monumento', `<p class="esc-manuscrito" style="text-align:center">${t}</p>`); } },
      EO.mirar('fuente', 'Fuente', 650, 214, 124, 96, 'La fuente está seca. En el fondo hay monedas oxidadas y una mano de piedra que sostiene... nada.', 'curioso'),
      { id: 'mango_p', nombre: 'Algo brilla', x: 542, y: 340, w: 60, h: 24, pie: 570, oculto: true, visible: e => !e.flag('mango_tomado'),
        toque: async e => { e.set('mango_tomado'); await e.dar('mango', 'Entre las hojas secas, junto al monumento, hay un mango de pala.'); } },
      EO.mirar('arbol', 'Árbol seco', 360, 180, 80, 140, 'Un árbol seco. De una rama cuelga un zapato chiquito. Giro la cabeza. Ya no está.', 'miedo'),
      EO.mirar('parada', 'Parada del micro', 786, 176, 60, 140, 'La parada del micro: «6:00». Son las 3:40. Quedan horas, sombras y un portón.', 'preocupado'),
      EO.puerta({ id: 'puerta_iglesia', nombre: 'Iglesia', x: 476, y: 186, w: 80, h: 126, pie: 515, a: 'iglesia', xa: 60, dir: 1, flag: 'iglesia_abierta', llave: 'llave_iglesia', bloqueada: 'La puerta de la iglesia está cerrada con llave.', abrir: 'La llave gira con un quejido. La puerta de la iglesia se abre sola.' }),
      { id: 'porton', nombre: 'Cementerio', x: 868, y: 98, w: 112, h: 218, pie: 900,
        toque: async e => {
          if(e.flag('cementerio_abierto')){ await e.ir('cementerio', 60, 1); return; }
          const ok = await e.digitos({ titulo: 'Candado del cementerio', sub: 'Código de 4 números. Un cartel dice: «Se abre con el año en que se apagó el fundador»', n: 4, clave: '1923' });
          if(!ok) return;
          e.set('cementerio_abierto'); e.sfx('puerta'); await e.yo('El candado se abre y la cadena cae. El portón rechina.', 'preocupado'); await e.ir('cementerio', 60, 1);
        } },
    ],
  },

  almacen: {
    id: 'almacen', nombre: 'Almacén', ancho: 760, dibujar: esc5DibujarAlmacen, dinamico: () => {},
    oscura: () => true, penumbra: 0.78, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'sfx:gota', 'pasos', 'sombra', 'campana'],
    alEntrar: async (e, primera) => { if(!primera) return; await e.esperar(500); e.sfx('gota'); await e.bi('Frascos con cosas adentro. No voy a preguntar qué cosas.'); },
    objetos: [
      EO.puerta({ id: 'puerta_plaza', nombre: 'Plaza', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'plaza', xa: 156, dir: 1 }),
      { id: 'caja_reg', nombre: 'Caja registradora', x: 146, y: 146, w: 80, h: 80, pie: 186,
        toque: async e => {
          if(e.flag('caja_registradora_abierta')){ await e.yo('La caja registradora está abierta y vacía.', 'normal'); return; }
          const ok = await e.digitos({ titulo: 'Caja registradora', sub: 'Código de 3 números. El cartel de la caja dice qué sumar', n: 3, clave: '043' });
          if(!ok) return;
          e.set('caja_registradora_abierta'); e.sfx('puerta'); await e.dar('llave_iglesia', 'La caja se abre con un «¡ding!». Adentro hay una llave larga: IGLESIA.');
        } },
      EO.leer('precios', 'Pizarra de precios', 366, 64, 120, 118, { nota: 'precios', titulo: 'Pizarra de precios', html: '<table class="esc-tabla"><tr><th>PRODUCTO</th><th>PRECIO</th></tr><tr><td>Yerba</td><td>$40</td></tr><tr><td>Azúcar</td><td>$25</td></tr><tr><td>Docena de velas</td><td>$35</td></tr><tr><td>Kilo de sal</td><td>$8</td></tr><tr><td>Fósforos</td><td>$5</td></tr></table>' }),
      EO.leer('cartel_caja', 'Cartel de la caja', 230, 146, 94, 48, { nota: 'cartel_caja', titulo: 'Cartel pegado a la caja', html: '<p class="esc-manuscrito">Clave de la caja:<br><b>docena de velas + kilo de sal</b></p>' }),
      { id: 'barril', nombre: 'Barril de galletitas', x: 514, y: 230, w: 84, h: 84, pie: 556,
        toque: async e => {
          if(!e.flag('pieza_b_tomada')){
            e.set('pieza_b_tomada');
            const t = '<b>MITAD DEL MAPA (2/2)</b><br>Leyenda de los colores del vitral:<br><b>Rojo = Norte · Azul = Este · Verde = Sur · Amarillo = Oeste</b>';
            e.nota('pieza_b', 'Mitad del mapa (2/2)', t);
            await e.leer('Papel dentro del barril', `<p class="esc-manuscrito">${t}</p>`);
            await esc5Mapa(e);
          } else await e.yo('Un barril lleno de galletitas del siglo pasado. Una se movió. Cierro la tapa.', 'miedo');
        } },
      EO.mirar('estante', 'Estante', 618, 100, 120, 120, 'Frascos con cosas oscuras flotando en líquido. En uno veo un ojo que me mira. En otro, un ojo que parpadea.', 'terror'),
    ],
  },

  iglesia: {
    id: 'iglesia', nombre: 'Iglesia', ancho: 900, dibujar: esc5DibujarIglesia, dinamico: esc5DinamicoIglesia,
    oscura: () => true, penumbra: 0.78, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'sfx:viento', 'pasos', 'campana', 'sombra'],
    alEntrar: async (e, primera) => { if(!primera) return; await e.esperar(600); e.sfx('campana'); e.sacudir(0.3); await e.bi('La campana sonó sola. Sin badajo. Juro por mi B que no tiene badajo.'); },
    objetos: [
      EO.puerta({ id: 'puerta_plaza2', nombre: 'Plaza', x: 14, y: 110, w: 62, h: 202, pie: 44, a: 'plaza', xa: 515, dir: 1 }),
      EO.mirar('bancos', 'Bancos', 106, 266, 270, 80, 'Los bancos de la iglesia. En uno hay un libro de oraciones abierto, con una hoja marcada: «No toquen la campana sin su corazón».', 'preocupado'),
      { id: 'vitral', nombre: 'Vitral', x: 398, y: 38, w: 154, h: 174, pie: 475,
        toque: async e => {
          const html = '<p>El vitral tiene cinco paneles de colores. De arriba hacia abajo y de izquierda a derecha:</p><div style="font-size:22px;text-align:center;letter-spacing:4px;margin:8px 0">🔴 🔴 🔵 🟢 🔵</div><p class="esc-chico">(rojo, rojo, azul, verde, azul)</p>';
          e.nota('vitral', 'Vitral de la iglesia', html);
          await e.leer('Vitral', html);
          await esc5Mapa(e);
        } },
      EO.mirar('altar', 'Altar', 576, 120, 156, 196, 'El altar tiene velas encendidas. Nadie las prendió. Se apagan una por una cuando me acerco y se vuelven a prender cuando me alejo.', 'miedo'),
      { id: 'cuerda', nombre: 'Cuerda de la campana', x: 740, y: 14, w: 40, h: 292, pie: 760,
        toque: async e => {
          const tone = (id) => { if(typeof essNota === 'function') essNota(id === 'grave' ? 110 : 330); };
          if(!e.flag('sacristia_abierta')){
            const ok = await e.secuencia({ titulo: 'Cuerda de la campana', sub: 'Tocá la campana con el toque de difuntos (4 golpes)', items: [{ id: 'grave', txt: '🔔 Grave' }, { id: 'agudo', txt: '🔔 Agudo' }], largo: 4, clave: 'grave,agudo,grave,grave', alTocar: tone });
            if(!ok){ await e.yo('La campana suena desafinada y un eco repite mi error desde el fondo de la iglesia. Ese no es el toque.', 'preocupado'); return; }
            e.set('sacristia_abierta'); e.sfx('campana'); e.sacudir(0.4); await e.yo('Un clic seco suena en la pared: la puerta de la sacristía se destrabó.', 'curioso'); return;
          }
          if(!e.tiene('badajo') && !e.flag('badajo_puesto')){ await e.yo('Tiro de la cuerda: la campana se mueve pero no suena. Le falta el badajo, la lengüeta de bronce.', 'serio'); return; }
          if(e.flag('amanecio')){ await e.yo('La campana ya avisó que amaneció.', 'alivio'); return; }
          await e.yo('Le falta ponerle el badajo. Tengo que elegirlo en la mochila y usarlo en la cuerda.', 'curioso');
        },
        usar: { badajo: async e => {
          e.quitar('badajo'); e.set('badajo_puesto'); e.sfx('placa'); await e.yo('Colgué el badajo adentro de la campana. Ahora hay que tocar el toque del alba.', 'curioso');
          const ok = await e.secuencia({ titulo: 'Toque del alba', sub: 'Tocá el toque que dice la carta del cofre', items: [{ id: 'grave', txt: '🔔 Grave' }, { id: 'agudo', txt: '🔔 Agudo' }], largo: 4, clave: 'agudo,agudo,grave,agudo', alTocar: id => { if(typeof essNota === 'function') essNota(id === 'grave' ? 110 : 330); } });
          if(!ok){ await e.yo('Ese no es el toque del alba. Tiene que ser como dice la carta.', 'serio'); return; }
          await esc5Final(e);
        } } },
      { id: 'puerta_sacristia', nombre: 'Sacristía', x: 800, y: 110, w: 62, h: 202, pie: 830,
        toque: async e => { await e.yo(e.flag('sacristia_abierta') ? 'La sacristía está abierta. Adentro, en el piso, se ve algo de metal.' : 'La sacristía está trabada. Hay un mecanismo atado a la cuerda de la campana.', e.flag('sacristia_abierta') ? 'curioso' : 'serio'); } },
      EO.tomar('cabeza_pala', 'Cabeza de pala', 812, 250, 44, 60, 'cabeza_pala', 'cabeza_tomada', 'En el suelo de la sacristía hay una cabeza de pala, oxidada.', { pie: 836, visible: e => e.flag('sacristia_abierta') && !e.flag('cabeza_tomada') }),
    ],
  },

  cementerio: {
    id: 'cementerio', nombre: 'Cementerio', ancho: 900, dibujar: esc5DibujarCementerio, dinamico: esc5DinamicoCementerio,
    oscura: () => true, penumbra: 0.74, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'sfx:viento', 'pasos', 'sombra', 'campana'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(700); e.fantasmaEn('sombra', { x: e.camX - 40, dur: 3.2 }); e.sfx('viento'); e.cara('miedo', 2.5);
      await e.bi('No quiero ser dramático, pero una luz azul se movió entre las tumbas. Digo, para que sepas.');
    },
    objetos: [
      EO.puerta({ id: 'puerta_plaza3', nombre: 'Plaza', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'plaza', xa: 900, dir: -1 }),
      EO.mirar('tumbas', 'Tumbas', 116, 200, 150, 112, 'Lápidas del pueblo. Todas dicen que murieron un 22 de octubre. Todas, el mismo día. No pregunto.', 'miedo'),
      { id: 'tumba_bartolo', nombre: 'Tumba de Bartolo', x: 296, y: 196, w: 78, h: 118, pie: 335,
        toque: async e => { await e.yo('«B. FERRER · 1923». Es el punto de partida del mapa. Desde acá hay que seguir el camino del vitral.', 'curioso'); await esc5Mapa(e); } },
      EO.mirar('tumba_soto', 'Tumba', 424, 224, 62, 92, 'En esta lápida alguien dibujó un reloj marcando las 4:20. La hora de la torre.', 'preocupado'),
      { id: 'parcela', nombre: 'Tierra removida', x: 560, y: 318, w: 160, h: 44, pie: 640,
        toque: async e => { await e.yo(e.flag('cofre_hallado') ? 'Acá estaba el cofre. Ya está abierto.' : 'Un pedazo de tierra distinto al resto, como removido. Para cavar necesito una pala.', 'curioso'); },
        usar: { pala: async e => {
          if(e.flag('cofre_hallado')){ await e.yo('Ya cavé acá.', 'normal'); return; }
          const ok = await e.secuencia({ titulo: 'Camino desde la tumba de Bartolo', sub: 'Paso a paso, siguiendo el camino del vitral con la leyenda del mapa', items: [{ id: 'n', txt: '⬆️ N' }, { id: 'e', txt: '➡️ E' }, { id: 's', txt: '⬇️ S' }, { id: 'o', txt: '⬅️ O' }], largo: 5, clave: 'n,n,e,s,e' });
          if(!ok){ const yaFallo = e.flag('fallo_cavar'); e.set('fallo_cavar'); e.sfx('arrastre'); await e.asustar('fuerte', { cuenta: !yaFallo }); await e.yo('Cavé un poco y la tierra empezó a moverse sola: de la fosa salió una mano. ¡Ese no es el lugar!', 'terror'); return; }
          e.set('parcela_cavada'); e.sfx('arrastre'); await e.yo('Cavo. La pala golpea madera. Un cofre viejo, justo en el lugar que marcaba el mapa.', 'alivio');
          e.set('cofre_hallado'); await e.dar('badajo', 'En el cofre no hay oro, sino una lengüeta de bronce enorme: el badajo de la campana.');
          const t = '<i>«Para quien siga mi mapa: el verdadero tesoro del pueblo es su campana. Sin badajo, nadie avisa que amanece. Cuando lo cuelguen, que toquen el alba: <b>agudo, agudo, grave, agudo</b>.»</i><br>— B. Ferrer';
          e.nota('carta', 'Carta de Bartolo', t);
          await e.leer('Carta dentro del cofre', `<p class="esc-manuscrito">${t}</p>`);
        } } },
      EO.mirar('galpon', 'Galpón', 780, 130, 110, 190, 'El galpón del sepulturero. Adentro hay palas, picos y un farol colgado con una llama azul que se apaga cuando entro.', 'miedo'),
    ],
  },
};

async function esc5Mapa(e){
  if(e.flag('mapa_completo')) return;
  if(!(e.flag('kiosco_pieza') && e.flag('pieza_b_tomada') && e.notas.some(n => n.id === 'vitral'))) return;
  e.set('mapa_completo'); e.cara('curioso', 3);
  const svg = '<svg viewBox="0 0 180 120" width="100%" style="background:#f1e7c6;border-radius:6px"><rect x="6" y="6" width="168" height="108" fill="none" stroke="#8a6a3a" stroke-width="2" stroke-dasharray="4 3"/><rect x="20" y="86" width="22" height="22" fill="#a0a6b0" stroke="#333"/><text x="31" y="100" font-size="8" text-anchor="middle">B</text><path d="M31 86 L31 70 L31 54 L55 54 L55 70 L79 70" fill="none" stroke="#b3322e" stroke-width="2.4" stroke-dasharray="4 3"/><text x="132" y="30" font-size="14" text-anchor="middle">✖</text><text x="140" y="46" font-size="8" text-anchor="middle" fill="#b3322e">¡Acá!</text><text x="160" y="20" font-size="9">N↑</text></svg>';
  const t = '<b>MAPA COMPLETO</b><br>Empezá en la tumba de Bartolo y seguí el vitral con la leyenda: <b>rojo=Norte, azul=Este, verde=Sur, amarillo=Oeste</b>.<br>' + svg;
  e.nota('mapa', 'Mapa completo', t);
  await e.bi('¡Juntaste todo el mapa! Está anotado en el cuaderno 📓.');
}

async function esc5Final(e){
  e.set('amanecio'); e.sfx('campana'); e.sacudir(0.6); await e.esperar(700); e.sfx('campana');
  e.fantasmaEn('quieto', { x: 740, y: 332, escala: 0.9, alfa: 0, max: 0.9, dir: -1 });
  await e.asustar('fuerte', {}); e.cara('terror', 2.5);
  const v = t => e.decir(t, { quien: 'voz', expr: 'preocupado' });
  await v('La campana... suena. Casi cien años sin oírla.');
  await e.bi('Es... el sepulturero. Con pala. Y farol azul. Y sombrero. Quedate quieto, Bi... quedate quieto...');
  await v('Fui el campanero de Villa Silencio. El último toque no pude darlo, porque el badajo se perdió con el fundador. Gracias, viajero.');
  e.cara('alivio', 4); e.flash('#fff6d8', 0.8);
  await v('Ya amanece. Andá a la parada: el micro de las 6:00 ya llega.');
  e.quitarFantasma();
  await e.esperar(800);
  await e.narrar('Los primeros rayos entran por el vitral y pintan el piso de rojo, azul y verde. Desde la plaza llega una bocina que conocés bien.');
  await e.narrar('El micro de Busmac te espera en la parada, con el grupo adentro aplaudiendo. En el pueblo, por primera vez en cien años, la campana sigue sonando.');
  await e.bi('¡Escapamos! ¡Y sin tesoro! ...bueno, el tesoro fue haber vivido para contarlo.');
  if(typeof essFinal === 'function') essFinal();
  await e.esperar(1600);
  await e.fin();
}

ESC_JUEGOS.tesoro = {
  id: 'tesoro', titulo: 'El mapa del tesoro', emoji: '🗺️', dificultad: 'Difícil', salasTotal: 4, espectro: esc5Espectro,
  resumen: 'La excursión paró en un pueblo abandonado y te quedaste atrás. Dicen que hay un tesoro enterrado, un mapa partido en pedazos y un campanero que no se fue.',
  inicio: { sala: 'plaza', x: 120, inv: ['linterna_lista'] },
  items: ESC5_ITEMS, combos: ESC5_COMBOS, pistas: ESC5_PISTAS, salas: ESC5_SALAS,
  intro: async e => {
    await e.narrar('Villa Silencio, un pueblo abandonado. 3:40 de la madrugada.');
    await e.narrar('El micro de la excursión paró a dejar que el grupo viera las ruinas. Vos te alejaste a sacar una foto... y cuando volviste, el micro ya no estaba. Solo quedó una nota: «Volvemos a las 6:00».');
    e.sfx('viento'); e.parpadear(1); e.cara('preocupado', 4);
    await e.yo('¿Me dejaron en un pueblo fantasma? Genial. Tengo el celular con linterna y cuatro horas de noche por delante.', 'preocupado');
    await e.bi('Soy Bi. Dicen que acá enterraron un tesoro. Yo solo quiero que amanezca. Revisemos el pueblo con cuidado.');
  },
};
