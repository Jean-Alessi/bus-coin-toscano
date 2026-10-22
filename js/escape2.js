// Bus-queda 2: "El micro fantasma". 4 habitaciones: Playa del garage → Taller → Oficina de despacho → Cabina del interno 13.
//
// La historia: en el garage de Busmac cuentan que el interno 13 arranca solo de noche. Su chofer, Don Ramón Peralta, salió
// a las 3:27 de una madrugada y nunca volvió. Quedaste encerrado en el garage: para salir hay que hacer andar al 13.
// Tenés el celular (con linterna) y a Bi. No hay electricidad hasta que arregles el tablero.
//
// Camino de la solución:
//  Playa:    patente del 13 (AB 407 CD) → candado del taller (407). Con luz: martillo (bajo el interno 7) y alicate (junto al surtidor).
//  Taller:   destornillador (banco); llave inglesa (en el foso, con luz); tablero de herramientas: llave inglesa + martillo + alicate
//            → compartimento con la llave del interno 13. Caja de fusibles: abrir con el destornillador y encender en el orden de
//            la pizarra de la oficina (rojo, blanco, azul, verde, amarillo) → vuelve la luz. Batería y bidón.
//  Oficina:  pizarra (el procedimiento y la frecuencia 104.7); radio (1047): "el portón abre con mi legajo y los minutos de mi última
//            salida"; cajón forzado con el destornillador → llave del archivero → legajo 0412 y la gorra de Don Ramón;
//            libro de salidas: el 13 salió a las 03:27 → portón 041227.
//  Afuera:   surtidor (con luz): bidón con combustible → motor del 13; batería → motor del 13. Llave del 13 → cabina.
//  Cabina:   pegatina del parabrisas (se ve al revés): 4926 → arranque. Don Ramón pide su gorra. Después el portón (041227) y a salir.

function esc2Micro(ctx, x, y, w, num, o){
  o = o || {};
  const h = 150, c = o.color || '#d8dde6';
  EA.rr(ctx, x, y, w, h, 12, c, EA.OL, 3);
  ctx.fillStyle = '#0F2A4D'; ctx.fillRect(x + 2, y + h - 52, w - 4, 26); ctx.fillStyle = '#E6A817'; ctx.fillRect(x + 2, y + h - 56, w - 4, 5);
  for(let i = 0; i < Math.floor((w - 70) / 46); i++) EA.rr(ctx, x + 26 + i * 46, y + 18, 38, 50, 5, o.ventana || '#10161f', EA.OL, 2);
  EA.rr(ctx, x + w - 42, y + 14, 30, 60, 6, o.ventana || '#10161f', EA.OL, 2);
  [x + 50, x + w - 70].forEach(px => { EA.circ(ctx, px, y + h, 26, '#14161c', EA.OL, 3); EA.circ(ctx, px, y + h, 12, '#9aa2ae', EA.OL, 2); });
  EA.rr(ctx, x + w - 22, y + h - 38, 14, 10, 3, o.farol || '#5a5a48', EA.OL, 1.5);
  EA.txt(ctx, String(num), x + w / 2, y + h - 39, 15, '#fff', 'center', '800');
  if(typeof arcLogo === 'function') arcLogo(ctx, x + w / 2 - 46, y + h - 40, 22, '#fff');
  if(o.oxido){ ctx.fillStyle = 'rgba(120,60,20,.35)'; [[x + 30, y + 90, 22], [x + w - 100, y + 100, 18], [x + 90, y + 20, 14]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, 7); ctx.fill(); }); }
}

function esc2DibujarPlaya(ctx, e){
  const W = 860, luz = e.flag('luz_garage');
  EA.cuarto(ctx, W, { pared: ['#323a42', '#525b64'], zocalo: '#262c33', piso: ['#6c7075', '#484b50'], manchas: [[260, 140, 80], [700, 90, 60]], grietas: [[420, 34], [590, 30]] });
  [100, 420, 730].forEach(x => { EA.linea(ctx, x + 35, 22, x + 35, 40, '#222', 2); EA.tubo(ctx, x, 38, 70); });
  // líneas de estacionamiento
  ctx.fillStyle = 'rgba(230,193,75,.5)'; [350, 560, 590].forEach(x => ctx.fillRect(x, 330, 5, 100));
  // oficina
  EA.puerta(ctx, 20, 110, 60, 202, { color: '#5a6a5a', cartel: 'OFICINA' });
  // taller con candado y cadena
  const ta = e.flag('taller_abierto');
  EA.puerta(ctx, 104, 110, 60, 202, { color: '#6a5a4a', cartel: 'TALLER', abierta: false });
  if(!ta){ ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(106, 200); ctx.lineTo(162, 214); ctx.moveTo(106, 214); ctx.lineTo(162, 200); ctx.stroke(); EA.rr(ctx, 123, 196, 22, 26, 4, '#c9a53a', EA.OL, 2); EA.circ(ctx, 134, 209, 3, '#3a2a10'); EA.poly(ctx, [[178, 150], [240, 146], [242, 196], [180, 200]], '#f4f0e4', EA.OL, 1.6); }
  // portón con panel
  const pa = e.flag('porton_abierto');
  EA.rr(ctx, 184, 92, 150, 222, 3, '#1f252c', EA.OL, 3);
  if(pa){ ctx.fillStyle = '#0a1230'; ctx.fillRect(190, 98, 138, 210); for(let i = 0; i < 20; i++){ ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(194 + (i * 53) % 130, 102 + (i * 37) % 120, 1.5, 1.5); } EA.rr(ctx, 190, 98, 138, 28, 2, '#8a929c', EA.OL, 2); }
  else { ctx.fillStyle = '#7a828c'; ctx.fillRect(190, 98, 138, 210); for(let y = 106; y < 308; y += 14){ ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(190, y, 138, 3); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(190, y + 3, 138, 2); } }
  EA.rr(ctx, 340, 186, 30, 52, 4, '#2b323b', EA.OL, 2); EA.rr(ctx, 345, 192, 20, 12, 2, luz ? '#0d2a14' : '#0a0c10', EA.OL, 1);
  EA.txt(ctx, luz ? (pa ? 'ABIERTO' : '------') : '', 355, 198, 4.6, '#8dff9f', 'center', '800'); EA.circ(ctx, 355, 212, 3, pa ? '#46e07a' : (luz ? '#e0463a' : '#3a3a3a'));
  for(let i = 0; i < 6; i++) EA.circ(ctx, 349 + (i % 3) * 6, 222 + Math.floor(i / 3) * 6, 1.7, '#cfd6df');
  // interno 7 (sucio)
  esc2Micro(ctx, 390, 162, 190, 7, { ventana: '#1b222d' });
  EA.txt(ctx, 'NO ARRANQUES EL 13', 486, 232, 7, 'rgba(255,255,255,.55)', 'center', '700');
  // surtidor
  EA.rr(ctx, 600, 186, 46, 126, 5, '#c0392b', EA.OL, 2.4); EA.rr(ctx, 606, 196, 34, 22, 3, luz ? '#0d2a14' : '#10141a', EA.OL, 1.4); EA.txt(ctx, luz ? '0.0 L' : '', 623, 207, 7, '#8dff9f', 'center', '800'); EA.linea(ctx, 646, 230, 662, 250, '#222', 4); EA.circ(ctx, 664, 252, 5, '#555', EA.OL, 1.5);
  // interno 13 (oxidado)
  esc2Micro(ctx, 680, 150, 160, 13, { color: '#a6a39c', oxido: true, ventana: '#0a0d14' });
  EA.rr(ctx, 690, 168, 54, 70, 4, '#4a4a46', EA.OL, 2); [0, 1, 2].forEach(i => EA.linea(ctx, 696, 180 + i * 14, 738, 180 + i * 14, 'rgba(0,0,0,.4)', 2));
  EA.rr(ctx, 692, 246, 50, 18, 2, '#e8e2c8', EA.OL, 1.6); EA.txt(ctx, 'AB 407 CD', 717, 255, 7.4, '#222', 'center', '800');
  EA.rr(ctx, 806, 168, 26, 100, 3, '#2a2f38', EA.OL, 2);
  // charco de aceite
  ctx.fillStyle = 'rgba(10,10,20,.5)'; ctx.beginPath(); ctx.ellipse(300, 372, 46, 10, 0, 0, 7); ctx.fill();
  // martillo y alicate se ven con luz (en dinamico)
}

function esc2DinamicoPlaya(ctx, e, t){
  if(!e.flag('luz_garage')) { /* a oscuras: la luz entra por el portón */ const g = ctx.createLinearGradient(190, 98, 330, 300); g.addColorStop(0, 'rgba(110,150,220,.16)'); g.addColorStop(1, 'rgba(110,150,220,0)'); ctx.fillStyle = g; ctx.fillRect(190, 98, 138, 210); }
  else { [100, 420, 730].forEach(x => { const g = ctx.createLinearGradient(0, 46, 0, 300); g.addColorStop(0, 'rgba(240,250,230,.22)'); g.addColorStop(1, 'rgba(240,250,230,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 46); ctx.lineTo(x + 70, 46); ctx.lineTo(x + 130, 300); ctx.lineTo(x - 60, 300); ctx.fill(); }); }
  if(!e.flag('martillo_tomado') && e.enLuz(490, 346)){ EA.rr(ctx, 484, 342, 20, 6, 2, '#6a6f78', EA.OL, 1.4); EA.rr(ctx, 480, 338, 12, 12, 2, '#2b2f3a', EA.OL, 1.4); esc1Brillito(ctx, 504, 338, t); }
  if(!e.flag('alicate_tomado') && e.enLuz(584, 350)){ EA.linea(ctx, 578, 354, 592, 344, '#9aa2ae', 3); EA.linea(ctx, 578, 344, 592, 354, '#9aa2ae', 3); EA.circ(ctx, 585, 349, 2.2, '#c0392b'); esc1Brillito(ctx, 596, 342, t); }
}

function esc2DibujarTaller(ctx, e){
  const W = 700;
  EA.cuarto(ctx, W, { pared: ['#51463c', '#6e6256'], zocalo: '#34302b', piso: ['#5f5b56', '#403d39'], manchas: [[150, 110, 60], [560, 80, 50]], grietas: [[330, 30]] });
  [120, 440].forEach(x => { EA.linea(ctx, x + 35, 22, x + 35, 40, '#222', 2); EA.tubo(ctx, x, 38, 70); });
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#6a5a4a' });
  // banco de trabajo
  EA.rr(ctx, 96, 250, 170, 12, 3, '#8a5a30', EA.OL, 2.2); [104, 252].forEach(x => EA.rr(ctx, x, 262, 8, 56, 1, '#6a4422', EA.OL, 1.6)); EA.rr(ctx, 120, 262, 120, 30, 2, '#7a4e28', EA.OL, 1.6); EA.circ(ctx, 180, 277, 2.6, '#d9b73c');
  EA.rr(ctx, 100, 180, 70, 70, 3, '#3a3a3a', EA.OL, 2); EA.linea(ctx, 104, 200, 166, 200, 'rgba(255,255,255,.2)', 1.4); // tornillo de banco
  if(!e.flag('destornillador_tomado')){ EA.rr(ctx, 190, 236, 44, 8, 3, '#d9a21a', EA.OL, 1.4); EA.linea(ctx, 234, 240, 252, 240, '#9aa2ae', 3); }
  // tablero de herramientas
  EA.rr(ctx, 284, 66, 140, 140, 3, '#6a5238', EA.OL, 2.4); for(let i = 0; i < 6; i++) for(let j = 0; j < 6; j++) EA.circ(ctx, 296 + i * 22, 80 + j * 22, 1.3, 'rgba(0,0,0,.4)');
  const marca = (x, y, dibujar, flag, color) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = flag ? color : 'rgba(0,0,0,.45)'; ctx.strokeStyle = flag ? EA.OL : 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.4; dibujar(); ctx.restore(); };
  marca(308, 90, () => { EA.rr(ctx, 0, 0, 14, 64, 4, ctx.fillStyle, ctx.strokeStyle, 1.4); EA.circ(ctx, 7, 6, 11, ctx.fillStyle, ctx.strokeStyle, 1.4); }, e.flag('herr_inglesa'), '#9aa2ae');
  marca(344, 96, () => { EA.rr(ctx, 0, 0, 40, 18, 3, ctx.fillStyle, ctx.strokeStyle, 1.4); EA.rr(ctx, 14, 18, 10, 52, 3, ctx.fillStyle, ctx.strokeStyle, 1.4); }, e.flag('herr_martillo'), '#6a6f78');
  marca(392, 90, () => { EA.rr(ctx, 0, 0, 8, 24, 2, ctx.fillStyle, ctx.strokeStyle, 1.4); EA.linea(ctx, 0, 24, 14, 60, ctx.fillStyle, 4); EA.linea(ctx, 8, 24, -6, 60, ctx.fillStyle, 4); }, e.flag('herr_alicate'), '#c0392b');
  EA.rr(ctx, 330, 214, 50, 30, 3, e.flag('tablero_abierto') ? '#0a0d12' : '#5a4630', EA.OL, 2); if(!e.flag('tablero_abierto')) EA.circ(ctx, 355, 229, 2.6, '#999');
  // foso
  EA.rr(ctx, 280, 340, 170, 58, 3, '#08090c', EA.OL, 2.4); [296, 430].forEach(x => EA.linea(ctx, x, 340, x, 398, '#555', 3));
  // caja de fusibles
  EA.rr(ctx, 462, 100, 70, 120, 3, '#59636f', EA.OL, 2.4);
  if(e.flag('panel_abierto')){ EA.poly(ctx, [[462, 100], [440, 108], [440, 214], [462, 220]], '#4a5463', EA.OL, 2); EA.rr(ctx, 468, 106, 58, 108, 2, '#10141a', EA.OL, 1.4); ['#d33', '#37e', '#2b4', '#ec2', '#eee'].forEach((c, i) => { EA.rr(ctx, 478 + i * 9, 116, 6, 28, 2, c, EA.OL, 1); }); EA.txt(ctx, e.flag('luz_garage') ? 'OK' : '—', 497, 162, 10, e.flag('luz_garage') ? '#8dff9f' : '#999', 'center', '800'); }
  else { [[470, 108], [524, 108], [470, 212], [524, 212]].forEach(([x, y]) => EA.circ(ctx, x, y, 2.6, '#cfd6df', EA.OL, 1)); EA.txt(ctx, '⚡', 497, 160, 20, '#ec2', 'center'); }
  // estante con la batería
  EA.rr(ctx, 560, 190, 120, 8, 2, '#6f7782', EA.OL, 1.8); [562, 670].forEach(x => EA.rr(ctx, x, 190, 6, 130, 1, '#5a626d', EA.OL, 1.6));
  if(!e.flag('bateria_tomada')){ EA.rr(ctx, 590, 160, 54, 30, 3, '#26313d', EA.OL, 2); EA.rr(ctx, 598, 152, 10, 8, 1, '#c0392b', EA.OL, 1.2); EA.rr(ctx, 626, 152, 10, 8, 1, '#222', EA.OL, 1.2); EA.txt(ctx, '12V', 617, 175, 8, '#ec2', 'center', '800'); }
  if(!e.flag('bidon_tomado')){ EA.rr(ctx, 600, 292, 34, 44, 4, '#c0392b', EA.OL, 2); EA.rr(ctx, 608, 284, 14, 10, 2, '#222', EA.OL, 1.4); EA.txt(ctx, 'F', 617, 316, 12, '#fff', 'center', '800'); }
  // cartel
  EA.rr(ctx, 560, 70, 110, 40, 3, '#e8d8a0', EA.OL, 2); EA.txt(ctx, 'TALLER', 615, 84, 10, '#b3322e', 'center', '800'); EA.txt(ctx, 'Deje cada herramienta en su lugar', 615, 99, 5.6, '#3a2a10', 'center', '700');
}

function esc2DinamicoTaller(ctx, e, t){
  if(!e.flag('llave_inglesa_tomada') && e.enLuz(366, 378)){ EA.rr(ctx, 358, 370, 12, 50, 4, '#9aa2ae', EA.OL, 1.4); EA.circ(ctx, 364, 372, 10, '#9aa2ae', EA.OL, 1.4); esc1Brillito(ctx, 382, 372, t); }
  if(e.flag('panel_abierto') && !e.flag('luz_garage') && Math.sin(t * 17) > 0.7) EA.circ(ctx, 497, 130, 40, null, 'rgba(255,230,120,.25)', 3);
}

function esc2DibujarOficina(ctx, e){
  const W = 700;
  EA.cuarto(ctx, W, { pared: ['#5a6455', '#7b8576'], zocalo: '#3b3f35', piso: ['#7a6a55', '#54483a'], manchas: [[240, 120, 70], [620, 90, 50]], grietas: [[520, 32]] });
  [140, 460].forEach(x => { EA.linea(ctx, x + 35, 22, x + 35, 40, '#222', 2); EA.tubo(ctx, x, 38, 70); });
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#5a6a5a' });
  // pizarra del procedimiento
  EA.rr(ctx, 88, 66, 148, 118, 3, '#243a2e', EA.OL, 3); EA.rr(ctx, 94, 72, 136, 106, 2, null, 'rgba(255,255,255,.18)', 1);
  EA.txt(ctx, 'ARRANQUE ELÉCTRICO', 162, 84, 7.6, '#f4f0e4', 'center', '800');
  ['El rojo va primero.', 'El blanco antes que el azul.', 'El verde, justo después del azul.', 'El amarillo, al último.'].forEach((l, i) => EA.txt(ctx, l, 162, 100 + i * 14, 6.2, '#e8e4d4', 'center', '600'));
  EA.txt(ctx, 'BASE: 104.7 FM', 162, 168, 7, '#ffd84d', 'center', '800');
  // reloj fichador
  EA.rr(ctx, 252, 86, 52, 66, 4, '#8a8f98', EA.OL, 2.4); EA.rr(ctx, 260, 94, 36, 20, 2, '#1b2430', EA.OL, 1.4); EA.txt(ctx, '03:27', 278, 104, 8, '#ff7a6a', 'center', '800'); EA.rr(ctx, 266, 124, 24, 8, 1, '#0b0e12', EA.OL, 1);
  // escritorio con radio y libro
  EA.rr(ctx, 320, 244, 170, 12, 3, '#8a5a30', EA.OL, 2.2); [328, 478].forEach(x => EA.rr(ctx, x, 256, 8, 58, 1, '#6a4422', EA.OL, 1.6)); EA.rr(ctx, 346, 256, 84, 34, 2, '#7a4e28', EA.OL, 1.6); EA.circ(ctx, 388, 273, 2.6, '#d9b73c');
  EA.rr(ctx, 330, 196, 70, 48, 4, '#3a2f22', EA.OL, 2.2); EA.circ(ctx, 350, 220, 14, '#1b1b1b', EA.OL, 1.6); EA.rr(ctx, 372, 206, 20, 8, 2, e.flag('luz_garage') ? '#173b22' : '#222', EA.OL, 1.2); EA.linea(ctx, 396, 196, 412, 170, '#999', 2);
  EA.rr(ctx, 418, 230, 56, 14, 2, '#6b3a2a', EA.OL, 1.6); EA.linea(ctx, 424, 236, 468, 236, '#e8d8a0', 1.6);
  // archivero
  EA.rr(ctx, 510, 120, 80, 196, 3, '#6f7782', EA.OL, 2.4); [0, 1, 2].forEach(i => { EA.rr(ctx, 518, 128 + i * 62, 64, 56, 2, e.flag('archivero_abierto') && i === 1 ? '#10141a' : '#7e8794', EA.OL, 1.6); EA.rr(ctx, 540, 150 + i * 62, 20, 6, 2, '#cfd6df', EA.OL, 1); });
  // ventana con vista al garage
  EA.rr(ctx, 612, 90, 70, 90, 3, '#10141f', EA.OL, 2.4); ctx.fillStyle = 'rgba(80,120,180,.2)'; ctx.fillRect(616, 94, 62, 82); EA.linea(ctx, 647, 90, 647, 180, EA.OL, 2); EA.linea(ctx, 612, 135, 682, 135, EA.OL, 2);
  // placa de fundación
  EA.rr(ctx, 612, 200, 70, 36, 2, '#b8860b', EA.OL, 2); EA.txt(ctx, 'GARAGE BUSMAC', 647, 212, 6.2, '#3a2a00', 'center', '800'); EA.txt(ctx, 'Fundado en 1974', 647, 226, 6, '#3a2a00', 'center', '700');
}

function esc2DinamicoOficina(ctx, e, t){
  if(e.flag('luz_garage') && !e.flag('radio_oida')){ ctx.fillStyle = 'rgba(120,255,150,' + (0.12 + 0.08 * Math.sin(t * 4)) + ')'; ctx.fillRect(372, 206, 20, 8); }
}

function esc2DibujarCabina(ctx, e){
  const W = 560;
  const c = ctx.createLinearGradient(0, 0, 0, 306); c.addColorStop(0, '#1f242c'); c.addColorStop(1, '#3a414b'); ctx.fillStyle = c; ctx.fillRect(0, 0, W, 306);
  ctx.fillStyle = '#10141c'; ctx.fillRect(0, 306, W, 134); ctx.fillStyle = '#2a2f38'; ctx.fillRect(0, 306, W, 5);
  for(let x = 0; x < W; x += 56){ ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fillRect(x, 310, 28, 130); }
  // vidrios laterales y parabrisas
  EA.rr(ctx, 120, 40, 200, 90, 8, '#0a0e18', EA.OL, 3); ctx.fillStyle = 'rgba(90,130,200,.14)'; ctx.fillRect(126, 46, 188, 78);
  EA.rr(ctx, 360, 30, 170, 120, 10, '#080c16', EA.OL, 3.4); ctx.fillStyle = 'rgba(90,130,200,.12)'; ctx.fillRect(366, 36, 158, 108);
  EA.rr(ctx, 396, 56, 70, 40, 3, 'rgba(230,193,75,.22)', 'rgba(230,193,75,.5)', 1.5); EA.txt(ctx, 'ARRANQUE', 431, 70, 7, 'rgba(255,230,160,.8)', 'center', '800');
  // asientos de pasajeros
  [[40, 180], [150, 180], [260, 180]].forEach(([x, y]) => { EA.rr(ctx, x, y, 80, 90, 8, '#2d4f7a', EA.OL, 2.4); EA.rr(ctx, x + 6, y + 70, 68, 34, 6, '#264266', EA.OL, 2); EA.rr(ctx, x + 14, y - 12, 52, 16, 6, '#375f90', EA.OL, 2); });
  // asiento del chofer y volante
  EA.rr(ctx, 368, 190, 70, 100, 8, '#333a46', EA.OL, 2.6); EA.rr(ctx, 372, 270, 62, 36, 6, '#2a303a', EA.OL, 2.2);
  EA.rr(ctx, 450, 190, 96, 120, 4, '#2a303a', EA.OL, 2.6); // tablero
  EA.circ(ctx, 480, 220, 34, null, '#8a8f98', 5); EA.linea(ctx, 446, 220, 514, 220, '#8a8f98', 4); EA.linea(ctx, 480, 220, 480, 254, '#8a8f98', 4); EA.circ(ctx, 480, 220, 6, '#8a8f98', EA.OL, 1.6);
  EA.rr(ctx, 500, 262, 36, 26, 3, '#0d1117', EA.OL, 1.6); EA.circ(ctx, 510, 275, 4, e.flag('motor_arrancado') ? '#46e07a' : '#a02a2a'); EA.circ(ctx, 524, 275, 4, '#555');
  EA.rr(ctx, 330, 210, 38, 70, 3, '#3a3f48', EA.OL, 2); EA.txt(ctx, '🎫', 349, 235, 16, '#fff');
  // retrovisor
  EA.rr(ctx, 332, 20, 44, 26, 4, '#aab4c0', EA.OL, 2); ctx.fillStyle = 'rgba(40,50,70,.8)'; ctx.fillRect(336, 24, 36, 18);
  EA.rr(ctx, 12, 120, 60, 192, 3, '#3d4a58', EA.OL, 2.4); EA.txt(ctx, 'SALIDA', 42, 132, 7, '#ffd84d', 'center', '800');
}

function esc2DinamicoCabina(ctx, e, t){
  if(e.flag('motor_arrancado')){ ctx.fillStyle = 'rgba(255,200,120,.06)'; ctx.fillRect(0, 0, 560, 440); EA.circ(ctx, 510, 275, 8, 'rgba(70,224,122,.35)'); }
}

// Don Ramón: el chofer. Uniforme azul, gorra, ojos de brasa y las manos en un volante que no está.
function esc2Espectro(ctx, t, f){
  const bamb = Math.sin(t * 2.4) * 2.5;
  const g = ctx.createRadialGradient(0, -110, 10, 0, -110, 120); g.addColorStop(0, 'rgba(255,170,90,.22)'); g.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -110, 120, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(42,62,118,.9)'; ctx.strokeStyle = 'rgba(10,20,50,.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-30, -150); ctx.quadraticCurveTo(-40, -80, -34 + bamb, -4);
  for(let i = 0; i <= 6; i++){ ctx.lineTo(-34 + i * 11.3 + bamb, -4 + (i % 2 ? 12 : -2) + Math.sin(t * 3 + i) * 3); }
  ctx.quadraticCurveTo(40, -80, 30, -150); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(235,240,250,.9)'; ctx.beginPath(); ctx.moveTo(-10, -150); ctx.lineTo(0, -122); ctx.lineTo(10, -150); ctx.fill();
  ctx.fillStyle = 'rgba(170,40,40,.9)'; ctx.fillRect(-2.5, -130, 5, 30);
  ctx.fillStyle = 'rgba(230,193,75,.9)'; [-96, -80, -64].forEach(y => { ctx.beginPath(); ctx.arc(14, y, 2.4, 0, 7); ctx.fill(); });
  // brazos adelante con las manos en un volante invisible
  ctx.strokeStyle = 'rgba(52,76,140,.95)'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  [-1, 1].forEach(l => { ctx.beginPath(); ctx.moveTo(l * 28, -138); ctx.quadraticCurveTo(l * 44, -110, l * 26, -90); ctx.stroke(); });
  ctx.strokeStyle = 'rgba(200,210,230,.55)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, -90, 26, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(220,226,236,.95)'; [-26, 26].forEach(x => { ctx.beginPath(); ctx.arc(x, -90, 6, 0, 7); ctx.fill(); });
  // cabeza, gorra con visera, ojos de brasa
  ctx.fillStyle = 'rgba(220,226,236,.97)'; ctx.strokeStyle = 'rgba(30,40,70,.5)'; ctx.beginPath(); ctx.ellipse(0, -170, 17, 23, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(20,32,80,.95)'; ctx.beginPath(); ctx.moveTo(-19, -180); ctx.quadraticCurveTo(0, -204, 19, -180); ctx.lineTo(27, -178); ctx.lineTo(-27, -178); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(230,168,23,.95)'; ctx.fillRect(-12, -192, 24, 6);
  ctx.fillStyle = '#05060b'; [-7, 7].forEach(ox => { ctx.beginPath(); ctx.ellipse(ox, -170, 4.4, 6, 0, 0, 7); ctx.fill(); });
  ctx.fillStyle = 'rgba(255,150,40,.98)'; [-7, 7].forEach(ox => { ctx.beginPath(); ctx.arc(ox, -169, 1.9 + Math.sin(t * 6) * 0.4, 0, 7); ctx.fill(); });
  ctx.strokeStyle = '#05060b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -154); ctx.quadraticCurveTo(0, -150, 6, -154); ctx.stroke();
}

const ESC2_ITEMS = {
  linterna_lista: { nombre: 'Celular (linterna)', icono: '🔦', desc: 'La linterna del celular. Se prende sola cuando hay oscuridad.' },
  destornillador: { nombre: 'Destornillador', icono: '🪛', desc: 'Sirve para abrir paneles y forzar cosas. No se gasta.' },
  llave_inglesa: { nombre: 'Llave inglesa', icono: '🔧', desc: 'Una llave inglesa grande, con grasa.' },
  martillo: { nombre: 'Martillo', icono: '🔨', desc: 'Un martillo de mecánico.' },
  alicate: { nombre: 'Alicate', icono: '🗜️', desc: 'Un alicate con mangos rojos.' },
  llave_interno13: { nombre: 'Llave del interno 13', icono: '🗝️', desc: 'Una llave con un llavero: «13».' },
  bateria: { nombre: 'Batería', icono: '🔋', desc: 'Una batería de 12 voltios. Pesa un montón.' },
  bidon: { nombre: 'Bidón vacío', icono: '🛢️', desc: 'Un bidón rojo, vacío.' },
  bidon_lleno: { nombre: 'Bidón con combustible', icono: '⛽', desc: 'Un bidón lleno de combustible.' },
  llave_archivero: { nombre: 'Llave del archivero', icono: '🔑', desc: 'Una llavecita con una etiqueta: ARCHIVO.' },
  gorra_chofer: { nombre: 'Gorra de chofer', icono: '🧢', desc: 'Una gorra azul con una chapita: R. PERALTA.' },
};

const ESC2_PISTAS = [
  EO.pista('patente', e => !e.flag('taller_abierto'), ['La puerta del taller tiene un candado de 3 números y una nota pegada.', 'La nota habla de la patente del 13. Mirá la parte de atrás de ese micro.', 'La patente dice AB 407 CD. El código es 407.']),
  EO.pista('herr', e => !e.flag('tablero_abierto'), ['El tablero de herramientas del taller tiene tres siluetas vacías.', 'Faltan una llave inglesa, un martillo y un alicate. Algunas cosas brillan en el piso, con la linterna: bajo un micro, al lado del surtidor, en el foso.', 'Colgá las tres herramientas en el tablero y se abre un compartimento con la llave del 13.']),
  EO.pista('luz', e => !e.flag('luz_garage'), ['Sin electricidad el garage no funciona. Hay una caja de fusibles en el taller.', 'El panel se abre con el destornillador del banco. El orden correcto de las llaves está en la pizarra de la oficina.', 'Orden: rojo, blanco, azul, verde, amarillo (el rojo primero; el blanco antes que el azul; el verde justo después del azul; el amarillo último).']),
  EO.pista('cajon', e => !e.flag('archivero_abierto'), ['Para saber el código del portón necesitás más datos. Mirá la oficina.', 'El cajón del escritorio está trabado: forzalo con el destornillador. La llave es del archivero.', 'En el archivero está el legajo de Don Ramón (0412) y su gorra.']),
  EO.pista('radio', e => !e.flag('radio_oida'), ['La radio de la oficina funciona con electricidad. Mirá la pizarra: dice una frecuencia.', 'Sintonizá 104.7 (escribí 1047).', 'Escuchá el mensaje: el portón se abre con el legajo y los minutos de la última salida del 13 (mirá el libro de salidas).']),
  EO.pista('bateria', e => !e.flag('bateria_puesta'), ['Un micro sin batería no arranca. Hay una en el taller.', 'Llevála afuera y usala en el motor del interno 13 (el compartimento de atrás).', 'Seleccioná la batería y tocá el motor del 13.']),
  EO.pista('combustible', e => !e.flag('combustible_puesto'), ['El 13 también necesita combustible. En el taller hay un bidón.', 'El surtidor del garage funciona con electricidad. Usá el bidón en el surtidor.', 'Después usá el bidón lleno en el motor del 13.']),
  EO.pista('cabina', e => !e.flag('bus_abierto'), ['Para entrar al interno 13 necesitás su llave.', 'La llave está en el compartimento del tablero de herramientas del taller.', 'Usá la llave del 13 sobre la puerta del micro.']),
  EO.pista('arranque', e => !e.flag('motor_arrancado'), ['Adentro del 13, el arranque pide un código.', 'Hay una pegatina en el parabrisas, pegada del lado de afuera: se ve al revés desde adentro.', 'La pegatina dice 4926 (leela de derecha a izquierda, dada vuelta).']),
  EO.pista('gorra', e => !e.flag('chofer_en_paz'), ['Don Ramón está inquieto. Algo le falta.', 'Su gorra estaba guardada en el archivero de la oficina.', 'Seleccioná la gorra y tocá el asiento del chofer.']),
  EO.pista('porton', e => !e.flag('porton_abierto'), ['Falta abrir el portón. Tiene un panel con código de 6 números.', 'El código es el legajo de Don Ramón y los minutos de su última salida.', 'Legajo 0412 y salida 03:27: escribí 041227.']),
  EO.pista('final', e => !e.flag('fin_listo'), ['Ya está todo. Subí al interno 13.', 'Tocá la puerta del micro.', 'Entrá al 13 y salí por el portón.']),
];

const ESC2_SALAS = {
  playa: {
    id: 'playa', nombre: 'Playa del garage', ancho: 860, dibujar: esc2DibujarPlaya, dinamico: esc2DinamicoPlaya,
    oscura: e => !e.flag('luz_garage'), musica: e => e.flag('luz_garage') ? 'tension' : 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sombra', 'parpadeo'],
    alEntrar: async () => {},
    objetos: [
      EO.puerta({ id: 'puerta_oficina', nombre: 'Oficina', x: 20, y: 110, w: 60, h: 202, pie: 50, a: 'oficina', xa: 70, dir: 1 }),
      { id: 'puerta_taller', nombre: 'Taller', x: 104, y: 110, w: 60, h: 202, pie: 134,
        toque: async e => {
          if(e.flag('taller_abierto')){ await e.ir('taller', 70, 1); return; }
          const ok = await e.digitos({ titulo: 'Candado del taller', sub: 'Nota pegada: «Código: la patente del 13 (solo los números)»', n: 3, clave: '407' });
          if(!ok) return;
          e.set('taller_abierto'); e.sfx('puerta'); await e.yo('El candado se abre. La cadena cae al piso con un golpe.', 'preocupado'); await e.ir('taller', 70, 1);
        } },
      { id: 'porton', nombre: 'Portón', x: 184, y: 92, w: 190, h: 222, pie: 360,
        toque: async e => {
          if(e.flag('porton_abierto')){ await e.yo('El portón está abierto. Afuera es de noche y no hay nadie.', 'normal'); return; }
          if(!e.flag('luz_garage')){ await e.yo('El panel del portón está muerto: sin electricidad no hay nada que hacer.', 'serio'); return; }
          const ok = await e.digitos({ titulo: 'Portón del garage', sub: 'Código de 6 números', n: 6, clave: '041227' });
          if(!ok) return;
          e.set('porton_abierto'); e.sfx('arrastre'); e.sacudir(0.5); await e.yo('El portón sube con un rugido oxidado. Se ve la calle.', 'alivio');
        } },
      EO.mirar('interno7', 'Interno 7', 392, 162, 190, 150, 'El interno 7. Alguien escribió con el dedo en el polvo: «NO ARRANQUES EL 13». Qué simpático.', 'preocupado'),
      { id: 'martillo_p', nombre: 'Algo brilla', x: 478, y: 332, w: 34, h: 24, pie: 492, oculto: true, visible: e => !e.flag('martillo_tomado'),
        toque: async e => { e.set('martillo_tomado'); await e.dar('martillo', 'Debajo del interno 7 había un martillo de mecánico.'); } },
      { id: 'alicate_p', nombre: 'Algo brilla', x: 572, y: 334, w: 36, h: 26, pie: 590, oculto: true, visible: e => !e.flag('alicate_tomado'),
        toque: async e => { e.set('alicate_tomado'); await e.dar('alicate', 'Al lado del surtidor, tirado en un charco seco: un alicate de mangos rojos.'); } },
      { id: 'surtidor', nombre: 'Surtidor', x: 598, y: 184, w: 52, h: 130, pie: 622,
        toque: async e => {
          if(!e.flag('luz_garage')){ await e.yo('Un surtidor viejo. Sin electricidad, no bombea nada.', 'serio'); return; }
          await e.yo('El surtidor funciona. Necesito un recipiente para llevar combustible.', 'curioso');
        },
        usar: { bidon: async e => {
          if(!e.flag('luz_garage')){ await e.yo('El surtidor no tiene corriente: no bombea.', 'serio'); return; }
          e.quitar('bidon'); e.sfx('arrastre'); await e.dar('bidon_lleno', 'Llenaste el bidón. Se oye el glu-glu del combustible.');
        } } },
      { id: 'charco', nombre: 'Charco de aceite', x: 250, y: 360, w: 100, h: 26, pie: 300,
        toque: async e => {
          await e.yo('Aceite viejo. Una huella de zapato... y no hay nadie con zapatos acá.', 'miedo');
          if(!e.flag('charco_visto')){ e.set('charco_visto'); e.asustar('sombra', { x: e.camX - 40 }); await e.bi('Tengo una idea: ¿y si no miramos al piso?'); }
        } },
      { id: 'patente', nombre: 'Patente del 13', x: 686, y: 242, w: 62, h: 26, pie: 718,
        toque: async e => { e.nota('patente', 'Patente del interno 13', '<b>AB 407 CD</b>'); await e.leer('Patente', '<p class="esc-manuscrito" style="font-size:22px;text-align:center">AB 407 CD</p><p class="esc-chico">Interno 13 · Busmac</p>'); } },
      { id: 'motor13', nombre: 'Motor del 13', x: 686, y: 164, w: 60, h: 80, pie: 716,
        toque: async e => {
          const f = [];
          if(!e.flag('bateria_puesta')) f.push('le falta la batería'); if(!e.flag('combustible_puesto')) f.push('le falta combustible');
          await e.yo(f.length ? 'El compartimento del motor del 13: ' + f.join(' y ') + '.' : 'El motor del 13 tiene batería y combustible. Ahora hay que arrancarlo desde adentro.', f.length ? 'serio' : 'curioso');
        },
        usar: {
          bateria: async e => { e.quitar('bateria'); e.set('bateria_puesta'); e.sfx('placa'); await e.yo('Conecté la batería. Un indicador del tablero parpadeó solo.', 'curioso'); },
          bidon_lleno: async e => { e.quitar('bidon_lleno'); e.set('combustible_puesto'); await e.yo('Le cargué el combustible al tanque del 13.', 'curioso'); },
          bidon: async e => { await e.yo('El bidón está vacío. Primero hay que llenarlo.', 'serio'); },
        } },
      { id: 'puerta13', nombre: 'Puerta del interno 13', x: 804, y: 164, w: 34, h: 150, pie: 790,
        toque: async e => {
          if(!e.flag('bus_abierto')){ await e.yo('La puerta del 13 está cerrada con llave.', 'serio'); return; }
          if(e.flag('motor_arrancado') && e.flag('chofer_en_paz') && e.flag('porton_abierto')){ await esc2Final(e); return; }
          await e.ir('cabina', 70, 1);
        },
        usar: { llave_interno13: async e => { e.quitar('llave_interno13'); e.set('bus_abierto'); e.sfx('puerta'); await e.yo('La puerta del 13 se abre sola, como si me estuviera esperando.', 'preocupado'); await e.ir('cabina', 70, 1); } } },
    ],
  },

  taller: {
    id: 'taller', nombre: 'Taller', ancho: 700, dibujar: esc2DibujarTaller, dinamico: esc2DinamicoTaller,
    oscura: e => !e.flag('luz_garage'), musica: e => e.flag('luz_garage') ? 'tension' : 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'campana', 'parpadeo'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(500); e.sfx('gota'); await e.bi('Gotea algo. Digo que es agua. ¿Es agua, no?');
    },
    objetos: [
      EO.puerta({ id: 'puerta_playa', nombre: 'Playa', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'playa', xa: 134, dir: 1 }),
      EO.tomar('destornillador', 'Destornillador', 186, 226, 76, 24, 'destornillador', 'destornillador_tomado', 'Un destornillador grande, sobre el banco.', { pie: 224 }),
      EO.mirar('banco', 'Banco de trabajo', 96, 244, 170, 76, 'Un banco con tornillos, tuercas y una huella de dedos manchada de aceite. Los dedos son demasiado largos.', 'preocupado'),
      { id: 'llave_inglesa_f', nombre: 'Algo brilla', x: 340, y: 362, w: 50, h: 56, pie: 366, oculto: true, visible: e => !e.flag('llave_inglesa_tomada'),
        toque: async e => { e.set('llave_inglesa_tomada'); await e.dar('llave_inglesa', 'En el fondo del foso: una llave inglesa enorme.'); } },
      EO.mirar('foso', 'Foso', 280, 340, 170, 58, 'El foso de mecánico. No se ve el fondo. Prefiero no asomarme mucho.', 'miedo', { pie: 270 }),
      { id: 'tablero_herr', nombre: 'Tablero de herramientas', x: 284, y: 66, w: 140, h: 180, pie: 354,
        toque: async e => {
          if(e.flag('tablero_abierto')){ await e.yo('El compartimento está abierto y vacío.', 'normal'); return; }
          const f = [];
          if(!e.flag('herr_inglesa')) f.push('una llave inglesa'); if(!e.flag('herr_martillo')) f.push('un martillo'); if(!e.flag('herr_alicate')) f.push('un alicate');
          await e.yo('Un tablero con la silueta de cada herramienta. Faltan: ' + f.join(', ') + '. Debajo hay un compartimento cerrado.', 'curioso');
        },
        usar: (() => { const colgar = (item, flag, nombre) => async e => {
            e.quitar(item); e.set(flag); e.sfx('placa'); await e.yo('Colgué ' + nombre + ' en su lugar.', 'curioso');
            if(e.flag('herr_inglesa') && e.flag('herr_martillo') && e.flag('herr_alicate')){
              e.set('tablero_abierto'); e.sfx('puerta'); e.set('llave13_tomada');
              await e.dar('llave_interno13', 'Con las tres herramientas en su lugar, se abrió el compartimento: adentro había una llave con un llavero «13».');
            }
          }; return { llave_inglesa: colgar('llave_inglesa', 'herr_inglesa', 'la llave inglesa'), martillo: colgar('martillo', 'herr_martillo', 'el martillo'), alicate: colgar('alicate', 'herr_alicate', 'el alicate') }; })() },
      { id: 'caja_fusibles', nombre: 'Caja de fusibles', x: 440, y: 100, w: 94, h: 120, pie: 497,
        toque: async e => {
          if(!e.flag('panel_abierto')){ await e.yo('Una caja de fusibles con la tapa atornillada.', 'curioso'); return; }
          if(e.flag('luz_garage')){ await e.yo('Todo en orden: el garage tiene electricidad.', 'normal'); return; }
          const ok = await e.secuencia({ titulo: 'Llaves térmicas', sub: 'Apretá las cinco en el orden correcto. Un error da chispazo.', items: [{ id: 'rojo', txt: '🔴' }, { id: 'azul', txt: '🔵' }, { id: 'verde', txt: '🟢' }, { id: 'amarillo', txt: '🟡' }, { id: 'blanco', txt: '⚪' }], largo: 5, clave: 'rojo,blanco,azul,verde,amarillo' });
          if(!ok){ const yaFallo = e.flag('fallo_fusibles'); e.set('fallo_fusibles'); await e.asustar('fuerte', { cuenta: !yaFallo }); await e.yo('¡Un chispazo! Casi me quedo sin pelo. Tiene que haber un orden correcto.', 'terror'); return; }
          e.set('luz_garage'); e.sfx('encender'); e.flash('#fff6c0', 0.9); e.sacudir(0.3);
          if(typeof essAmbiente === 'function') essAmbiente('tension');
          e.cara('alivio', 2.5); await e.yo('¡Volvió la luz! Se prendieron los tubos de todo el garage.', 'alivio'); await e.bi('¡Luz! Aunque ahora vemos mejor lo que da miedo.');
        },
        usar: { destornillador: async e => {
          if(e.flag('panel_abierto')){ await e.yo('El panel ya está abierto.', 'normal'); return; }
          e.set('panel_abierto'); e.sfx('placa'); await e.yo('Saqué los tornillos. Adentro hay cinco llaves térmicas de colores. Estarán en algún orden...', 'curioso');
        } } },
      EO.tomar('bateria', 'Batería', 586, 150, 62, 44, 'bateria', 'bateria_tomada', 'Una batería de 12 voltios. Pesa una tonelada, pero la agarrás.', { pie: 616 }),
      EO.tomar('bidon', 'Bidón', 596, 280, 44, 60, 'bidon', 'bidon_tomado', 'Un bidón rojo, vacío. Sirve para llevar combustible.', { pie: 618 }),
    ],
  },

  oficina: {
    id: 'oficina', nombre: 'Oficina de despacho', ancho: 700, dibujar: esc2DibujarOficina, dinamico: esc2DinamicoOficina,
    oscura: e => !e.flag('luz_garage'), musica: e => e.flag('luz_garage') ? 'tension' : 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'campana'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(700); e.fantasmaEn('ventana', { x: 647, y: 180, dur: 2.4, escala: 0.45, max: 0.65, dir: -1 }); e.sfx('susurro'); e.cara('miedo', 2.5);
      await e.bi('Ahí, en la ventana... se fue. Qué lindo trabajo tiene la gente de oficina.');
    },
    objetos: [
      EO.puerta({ id: 'puerta_playa2', nombre: 'Playa', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'playa', xa: 50, dir: 1 }),
      EO.leer('pizarra', 'Pizarra', 88, 66, 148, 118, { nota: 'pizarra', titulo: 'Pizarra: arranque eléctrico', html: '<p><b>ARRANQUE ELÉCTRICO</b> (cinco llaves térmicas de colores):</p><ul><li>El <b>rojo</b> va primero.</li><li>El <b>blanco</b> antes que el azul.</li><li>El <b>verde</b>, justo después del azul.</li><li>El <b>amarillo</b>, al último.</li></ul><p><b>BASE: 104.7 FM</b> (canal de emergencia)</p>' }),
      EO.mirar('fichador', 'Reloj fichador', 250, 84, 56, 70, 'El reloj fichador marca 03:27, pero hoy nadie fichó. La tarjeta que asoma dice «PERALTA».', 'preocupado'),
      { id: 'radio', nombre: 'Radio', x: 328, y: 194, w: 76, h: 50, pie: 366,
        toque: async e => {
          if(!e.flag('luz_garage')){ await e.yo('Una radio base muy vieja. Sin electricidad no hace ni ruido.', 'serio'); return; }
          if(e.flag('radio_oida')){ await e.decir('...mi legajo... y los minutos de mi última salida... no me dejes solo...', { quien: 'voz', expr: 'preocupado' }); return; }
          const ok = await e.digitos({ titulo: 'Radio base', sub: 'Sintonizá la frecuencia (por ejemplo 98.1 = 0981)', n: 4, clave: '1047' });
          if(!ok) return;
          e.set('radio_oida'); e.sfx('radio'); await e.esperar(1200);
          await e.decir('Base... base... interno trece a base... el portón abre con mi legajo y los minutos de mi última salida...', { quien: 'voz', expr: 'miedo' });
          await e.decir('...no me dejes solo en la ruta...', { quien: 'voz', expr: 'miedo' });
          e.nota('radio', 'Mensaje de la radio', 'Una voz: «El portón abre con <b>mi legajo</b> y los <b>minutos de mi última salida</b>...»');
          await e.bi('Un portón con código de legajo. Qué burocrático para un fantasma.');
        } },
      { id: 'cajon', nombre: 'Cajón del escritorio', x: 344, y: 254, w: 90, h: 38, pie: 388,
        toque: async e => {
          if(e.flag('cajon_abierto')){ await e.yo('El cajón está abierto y vacío.', 'normal'); return; }
          await e.yo('El cajón está trabado. Con algo fino quizás pueda forzarlo.', 'curioso');
        },
        usar: { destornillador: async e => {
          if(e.flag('cajon_abierto')){ await e.yo('Ya lo abrí.', 'normal'); return; }
          e.set('cajon_abierto'); e.sfx('placa'); await e.dar('llave_archivero', 'Forzaste el cajón: adentro había una llavecita con una etiqueta que dice ARCHIVO.');
        } } },
      EO.leer('libro', 'Libro de salidas', 414, 222, 66, 26, { nota: 'libro', titulo: 'Libro de salidas', html: `<table class="esc-tabla"><tr><th>INT.</th><th>CHOFER</th><th>SALE</th><th>VUELVE</th></tr><tr><td>3</td><td>Gómez</td><td>21:40</td><td>22:55</td></tr><tr><td>9</td><td>Ruiz</td><td>22:10</td><td>23:30</td></tr><tr><td>7</td><td>Díaz</td><td>23:05</td><td>00:20</td></tr><tr class="esc-rojo"><td>13</td><td>Peralta</td><td>03:27</td><td>—</td></tr></table><p class="esc-chico">La última línea no tiene hora de vuelta.</p>` }),
      { id: 'archivero', nombre: 'Archivero', x: 508, y: 120, w: 84, h: 196, pie: 550,
        toque: async e => {
          if(!e.flag('archivero_abierto')){ await e.yo('Un archivero metálico, con llave.', 'serio'); return; }
          await e.yo('Ya revisé el archivero.', 'normal');
        },
        usar: { llave_archivero: async e => {
          e.quitar('llave_archivero'); e.set('archivero_abierto'); e.sfx('puerta');
          const t = '<b>LEGAJO 0412</b><br>Peralta, Ramón<br>Chofer · Interno 13<br><i>Última salida: sin retorno.</i>';
          e.nota('legajo', 'Legajo de Don Ramón', t);
          await e.leer('Legajo', `<p class="esc-manuscrito">${t}</p>`);
          e.set('gorra_tomada'); await e.dar('gorra_chofer', 'En el cajón de abajo, envuelta en plástico, estaba su gorra de chofer, con una chapita: R. PERALTA.');
        } } },
      EO.mirar('ventana', 'Ventana', 612, 90, 70, 90, 'La ventana da al garage. Se ve el interno 13, con una luz amarilla adentro... que se apaga cuando la miro.', 'miedo'),
      EO.mirar('placa', 'Placa', 612, 200, 70, 36, 'Una placa de bronce: «Garage Busmac, fundado en 1974». Alguien rayó una fecha más abajo. No quiero saber cuál.', 'serio'),
    ],
  },

  cabina: {
    id: 'cabina', nombre: 'Cabina del interno 13', ancho: 560, dibujar: esc2DibujarCabina, dinamico: esc2DinamicoCabina,
    oscura: () => true, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'campana'],
    alEntrar: async (e, primera) => {
      if(e.flag('motor_arrancado') && !e.flag('chofer_en_paz')) e.fantasmaEn('quieto', { x: 400, y: 304, escala: 0.8, alfa: 0.9, max: 0.9, dir: -1 });
      if(!primera) return;
      await e.esperar(600); e.sfx('susurro'); await e.bi('Huele a nafta vieja y a algo peor. ¿Subimos igual? ...Sí, subimos.');
    },
    objetos: [
      { id: 'puerta_salida', nombre: 'Salida', x: 12, y: 120, w: 60, h: 192, pie: 42, toque: async e => { await e.ir('playa', 790, -1); } },
      EO.mirar('asientos', 'Asientos', 40, 168, 300, 120, 'Los asientos todavía tienen forma de pasajeros sentados. No quiero mirar mucho.', 'preocupado'),
      { id: 'parabrisas', nombre: 'Parabrisas', x: 360, y: 30, w: 170, h: 124, pie: 440,
        toque: async e => {
          const html = '<p>Hay una pegatina pegada en el vidrio. Está del lado de <b>afuera</b>, así que desde adentro se ve <b>al revés</b>:</p><div class="esc-espejo" style="font-size:34px;font-weight:800;letter-spacing:6px;text-align:center;color:#b3322e;margin:8px 0">4 9 2 6</div><p class="esc-chico">«CÓDIGO DE ARRANQUE»</p>';
          e.nota('pegatina', 'Pegatina del parabrisas', html);
          await e.leer('Parabrisas', html);
        } },
      EO.mirar('retrovisor', 'Retrovisor', 330, 18, 48, 30, 'En el retrovisor se ve el último asiento... con alguien sentado. Me doy vuelta: no hay nadie. Vuelvo a mirar: sigue.', 'miedo'),
      EO.mirar('boletera', 'Boletera', 328, 208, 42, 74, 'La máquina de boletos, cubierta de polvo. Todavía dice «DESTINO: ?».', 'curioso'),
      { id: 'asiento_chofer', nombre: 'Asiento del chofer', x: 366, y: 188, w: 76, h: 112, pie: 392,
        toque: async e => {
          if(e.flag('chofer_en_paz')){ await e.yo('El asiento del chofer está vacío. Por fin.', 'alivio'); return; }
          if(e.flag('motor_arrancado')){ await e.decir('Mi gorra... sin mi gorra no manejo...', { quien: 'voz', expr: 'serio' }); return; }
          await e.yo('El asiento del chofer. Está frío como una heladera.', 'preocupado');
        },
        usar: { gorra_chofer: async e => {
          if(!e.flag('motor_arrancado')){ await e.yo('Todavía no hay nadie a quien dársela.', 'serio'); return; }
          e.quitar('gorra_chofer'); e.set('chofer_en_paz'); e.quitarFantasma(); e.cara('alivio', 4); e.sfx('campana');
          await e.decir('Mi gorra... Gracias, pasajero. Hace mucho que no me sentía yo.', { quien: 'voz', expr: 'alivio' });
          await e.decir('El portón solo abre con mi legajo y los minutos de mi última salida. Ya lo sabés. Yo me quedo acá... pero llevá el micro afuera.', { quien: 'voz', expr: 'alivio' });
          await e.yo('El micro está andando y Don Ramón está en paz. Solo falta abrir el portón.', 'alivio');
        } } },
      { id: 'contacto', nombre: 'Arranque', x: 488, y: 250, w: 58, h: 50, pie: 470,
        toque: async e => {
          if(e.flag('motor_arrancado')){ await e.yo('El motor ronronea. Todo funciona.', 'alivio'); return; }
          if(!e.flag('bateria_puesta') || !e.flag('combustible_puesto')){
            e.sfx('motorFalla');
            await e.yo('Giro la llave... y nada. ' + (!e.flag('bateria_puesta') ? 'No hay batería. ' : '') + (!e.flag('combustible_puesto') ? 'No hay combustible. ' : '') + 'Antes hay que arreglar eso desde afuera.', 'serio'); return;
          }
          const ok = await e.digitos({ titulo: 'Arranque del interno 13', sub: 'Código de 4 números (la pegatina del parabrisas)', n: 4, clave: '4926' });
          if(!ok) return;
          e.set('motor_arrancado'); e.sfx('motor'); e.sacudir(0.9); e.flash('#ffd9a0', 0.6);
          if(typeof essAmbiente === 'function') essAmbiente('tension');
          await e.esperar(900);
          e.fantasmaEn('quieto', { x: 400, y: 304, escala: 0.8, alfa: 0, max: 0.9, dir: -1 }); await e.asustar('fuerte', {}); e.cara('terror', 2.5);
          await e.decir('¿Quién arrancó mi micro?', { quien: 'voz', expr: 'serio' });
          await e.decir('Treinta años esperando salir... y se me perdió la gorra. Sin mi gorra, no manejo.', { quien: 'voz', expr: 'serio' });
          await e.bi('Tranqui, Bi. Tranqui. Es solo un chofer... muerto... y enojado... Estoy bien.');
          await e.yo('Su gorra. Tiene que estar en algún lado de la oficina.', 'preocupado');
        } },
      EO.mirar('volante', 'Volante', 440, 188, 80, 70, 'Un volante grande, forrado en cuero gastado. Está tibio, como si alguien lo acabara de soltar.', 'miedo'),
    ],
  },
};

async function esc2Final(e){
  e.set('fin_listo');
  e.cara('alivio', 6);
  await e.narrar('Te sentás en el lugar del chofer. El 13 ronronea como nuevo.');
  e.sfx('motor'); e.sacudir(0.7);
  await e.esperar(700);
  await e.narrar('El portón está abierto. Salís del garage a las 3:27 de la madrugada, con las luces del 13 prendidas.');
  await e.bi('¡Lo hicimos! ¡Y yo manejé... digo, miré para adelante!');
  await e.narrar('Por el retrovisor ves el último asiento: un chofer con gorra azul te saluda con la mano y se desvanece. Ahora sí, terminó su recorrido.');
  e.flash('#fff3b0', 0.8);
  if(typeof essFinal === 'function') essFinal();
  await e.esperar(1600);
  await e.fin();
}

ESC_JUEGOS.micro = {
  id: 'micro', titulo: 'El micro fantasma', emoji: '🚌', dificultad: 'Difícil', salasTotal: 4, espectro: esc2Espectro,
  resumen: 'Quedaste encerrado en el garage de Busmac. Dicen que el interno 13 arranca solo de noche. Hay que hacerlo andar para salir... con su chofer adentro.',
  inicio: { sala: 'playa', x: 120, inv: ['linterna_lista'] },
  items: ESC2_ITEMS, combos: [], pistas: ESC2_PISTAS, salas: ESC2_SALAS,
  intro: async e => {
    await e.narrar('Garage de Busmac. 3:10 de la mañana.');
    await e.narrar('Te quedaste dormido en el último micro que entró. Cuando despertás, el portón está cerrado y todas las luces apagadas.');
    e.sfx('susurro'); e.parpadear(1); e.cara('preocupado', 4);
    await e.yo('¿Hay alguien? ...Perfecto. Solo yo y mi celular con la linterna.', 'preocupado');
    await e.bi('Soy Bi. Esto me da mala espina: en el 7 alguien escribió «No arranques el 13». ¿Adivinás cuál vamos a arrancar?');
    await e.yo('Para salir hay que abrir el portón. Y sin luz, no hay panel. Primero hay que ver qué pasa con la electricidad.', 'serio');
  },
};
