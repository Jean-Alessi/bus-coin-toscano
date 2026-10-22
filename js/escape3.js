// Bus-queda 3: "Hotel de la ruta". 4 habitaciones: Habitación 12 → Recepción → Cocina → Sótano (calderas).
//
// La historia: se rompió el micro en la ruta y el grupo durmió en el Hotel Los Álamos. Despertás solo/a en la habitación 12.
// El hotel está vacío, con olor a azahar y una caja de música que suena sola. En 1962 una novia, Elena, desapareció la noche de
// bodas. Perdió su anillo y no puede irse sin él. Para salir hay que abrir la puerta principal (llave maestra) y devolverle
// el anillo.
//
// Camino de la solución:
//  Hab. 12:   espejo con números escritos al revés (6275) → ropero → farol vacío. Aceite (cómoda) + fósforos (mesa de luz) → farol listo.
//             Con luz: llave de la 12 bajo la cama. La caja de música toca una melodía (MI-SOL-FA-MI-RE). Nota: "mañana, 17, nuestro día".
//  Recepción: libro de huéspedes (marzo = 03); caja fuerte = 17 + 03 → 1703 → llave de la cocina. Piano: la melodía de la caja de música
//             → compartimento con el anillo. Puerta de la cocina.
//  Cocina:    receta + nota del cocinero: harina, azúcar, huevos, manteca (secuencia) → horno → llave del sótano.
//  Sótano:    placa: tres válvulas A>B>C distintas de 1 a 5, suman 10 y B es par → 5-4-1 → compuerta con la llave maestra.
//  Final:     puerta principal con la llave maestra; Elena aparece; se le devuelve el anillo.

function esc3Cama(ctx, x, y){
  EA.rr(ctx, x, y, 200, 70, 8, '#8a4a52', EA.OL, 2.4); EA.rr(ctx, x - 6, y - 70, 12, 140, 4, '#4a3020', EA.OL, 2); EA.rr(ctx, x + 194, y - 40, 12, 110, 4, '#4a3020', EA.OL, 2);
  EA.rr(ctx, x + 10, y - 16, 70, 24, 10, '#e8dcc8', EA.OL, 2); EA.rr(ctx, x + 10, y + 6, 180, 50, 6, '#b86a74', EA.OL, 2); EA.linea(ctx, x + 100, y + 6, x + 100, y + 56, 'rgba(0,0,0,.2)', 2);
}

function esc3DibujarHab(ctx, e){
  const W = 940;
  EA.cuarto(ctx, W, { pared: ['#6e4a54', '#8b6a72'], zocalo: '#3a2428', piso: ['#5a4030', '#3e2c20'], manchas: [[260, 140, 70], [680, 90, 60]], grietas: [[420, 34], [610, 40]] });
  for(let x = 24; x < W; x += 48){ ctx.fillStyle = 'rgba(255,220,230,.08)'; ctx.beginPath(); ctx.arc(x, 90 + (x % 96), 7, 0, 7); ctx.fill(); ctx.arc(x + 20, 190 - (x % 60), 5, 0, 7); ctx.fill(); }
  EA.linea(ctx, 400, 12, 400, 44, '#222', 2); EA.circ(ctx, 400, 52, 8, '#f4e6a8', EA.OL, 1.6);
  EA.puerta(ctx, 20, 110, 62, 202, { color: '#5a3a2a', cartel: '12' });
  // ventana con luna
  EA.rr(ctx, 100, 60, 96, 128, 3, '#0e1224', EA.OL, 3); ctx.fillStyle = 'rgba(90,120,190,.3)'; ctx.fillRect(104, 64, 88, 120); EA.circ(ctx, 160, 100, 14, '#f1ecd2'); EA.linea(ctx, 148, 60, 148, 188, EA.OL, 2.4); EA.linea(ctx, 100, 124, 196, 124, EA.OL, 2.4);
  // cómoda con aceite y caja de música
  EA.rr(ctx, 214, 236, 130, 76, 4, '#6a4428', EA.OL, 2.4); [0, 1].forEach(i => { EA.rr(ctx, 220, 244 + i * 32, 118, 28, 2, '#7a5232', EA.OL, 1.6); EA.circ(ctx, 279, 258 + i * 32, 2.6, '#d9b73c'); });
  if(!e.flag('aceite_tomado')){ EA.rr(ctx, 232, 202, 20, 34, 4, '#c9a53a', EA.OL, 1.8); EA.rr(ctx, 237, 194, 10, 10, 2, '#5a3a10', EA.OL, 1.2); }
  EA.rr(ctx, 280, 212, 50, 24, 3, '#8a5a2a', EA.OL, 1.8); EA.rr(ctx, 280, 204, 50, 10, 3, '#a8743a', EA.OL, 1.6); EA.txt(ctx, '♪', 305, 224, 12, '#ffd84d', 'center', '800');
  // espejo
  EA.rr(ctx, 372, 56, 94, 150, 44, '#b8860b', EA.OL, 3); EA.rr(ctx, 380, 64, 78, 134, 38, '#7c8a96', EA.OL, 2); ctx.fillStyle = 'rgba(210,225,240,.25)'; ctx.fillRect(386, 72, 66, 40);
  // el escrito en el espejo, dibujado al revés
  ctx.save(); ctx.translate(419, 130); ctx.scale(-1, 1); EA.txt(ctx, '6 2 7 5', 0, 0, 13, 'rgba(180,30,40,.85)', 'center', '800'); ctx.restore();
  // ropero
  const ro = e.flag('ropero_abierto');
  EA.rr(ctx, 500, 70, 120, 244, 4, '#5a3a22', EA.OL, 2.6); EA.rr(ctx, 506, 76, 52, 232, 2, ro ? '#0a0806' : '#6a4a2c', EA.OL, 1.8); EA.rr(ctx, 562, 76, 52, 232, 2, '#6a4a2c', EA.OL, 1.8);
  if(!ro){ EA.circ(ctx, 551, 200, 3, '#d9b73c'); EA.circ(ctx, 569, 200, 3, '#d9b73c'); EA.rr(ctx, 548, 214, 24, 28, 3, '#6a6f78', EA.OL, 1.6); EA.circ(ctx, 560, 224, 3, '#1b1b1b'); }
  // cama y mesa de luz
  esc3Cama(ctx, 640, 250);
  // mesa de luz con lámpara
  EA.rr(ctx, 860, 250, 52, 66, 3, '#6a4428', EA.OL, 2.2); EA.rr(ctx, 866, 262, 40, 22, 2, '#7a5232', EA.OL, 1.6); EA.circ(ctx, 886, 273, 2.4, '#d9b73c'); EA.rr(ctx, 878, 218, 16, 32, 3, '#c9a53a', EA.OL, 1.6); EA.poly(ctx, [[868, 218], [904, 218], [896, 196], [876, 196]], '#e8d8c0', EA.OL, 1.8);
  EA.poly(ctx, [[850, 150], [884, 140], [892, 188], [858, 196]], '#e8d8a0', EA.OL, 1.4);
}

function esc3DinamicoHab(ctx, e, t){
  if(!e.flag('llave12_tomada') && e.enLuz(738, 350)){ esc1Llave(ctx, 738, 352, 1, '#e8c84a'); esc1Brillito(ctx, 746, 344, t); }
}

function esc3DibujarLobby(ctx, e){
  const W = 900, pa = e.flag('puerta_principal_abierta');
  EA.cuarto(ctx, W, { pared: ['#4a3a30', '#6a5444'], zocalo: '#2c2018', piso: ['#6a5a48', '#4a3e30'], manchas: [[300, 120, 80], [700, 80, 60]], grietas: [[360, 36], [760, 38]] });
  for(let x = 0; x < W; x += 90){ ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(x, 24, 4, 238); }
  EA.linea(ctx, 450, 12, 450, 50, '#222', 2); for(let i = -2; i <= 2; i++) EA.circ(ctx, 450 + i * 20, 60 + Math.abs(i) * 4, 6, '#f4e6a8', EA.OL, 1.4); EA.linea(ctx, 410, 58, 490, 58, '#b8860b', 3);
  EA.puerta(ctx, 20, 110, 62, 202, { color: '#5a3a2a', cartel: 'HAB. 12' });
  // mostrador de recepción
  EA.rr(ctx, 110, 220, 230, 96, 4, '#5a3a22', EA.OL, 2.6); EA.rr(ctx, 100, 210, 250, 14, 3, '#8a5a30', EA.OL, 2); [0, 1, 2].forEach(i => EA.rr(ctx, 124 + i * 70, 236, 60, 70, 2, 'rgba(0,0,0,.2)', 'rgba(0,0,0,.4)', 1.4));
  EA.rr(ctx, 130, 190, 54, 20, 2, '#e8d8a0', EA.OL, 1.6); EA.linea(ctx, 136, 198, 178, 198, '#6b3a2a', 1.6); EA.linea(ctx, 136, 204, 170, 204, '#6b3a2a', 1.6);
  EA.rr(ctx, 200, 196, 22, 14, 2, '#c0a040', EA.OL, 1.4); // campanilla
  // caja fuerte debajo
  const cf = e.flag('caja_abierta');
  EA.rr(ctx, 236, 262, 62, 50, 3, '#3a4350', EA.OL, 2.6); if(!cf){ EA.circ(ctx, 262, 287, 14, '#59636f', EA.OL, 2); EA.linea(ctx, 262, 287, 267, 280, '#ff8a3a', 2); } else { EA.rr(ctx, 241, 267, 52, 40, 2, '#0a0d12', EA.OL, 1.6); }
  // llaveros detrás
  EA.rr(ctx, 130, 110, 190, 70, 3, '#3a2a1c', EA.OL, 2.2); for(let i = 0; i < 8; i++){ EA.circ(ctx, 146 + i * 22, 130, 2.4, '#b8860b'); esc1Llave(ctx, 146 + i * 22, 146, 0.6, i === 3 ? '#555' : '#c9a53a'); }
  // reloj de pared parado
  EA.circ(ctx, 380, 86, 24, '#e9e4d4', EA.OL, 3); for(let i = 0; i < 12; i++){ const a = i * Math.PI / 6; EA.linea(ctx, 380 + Math.sin(a) * 18, 86 - Math.cos(a) * 18, 380 + Math.sin(a) * 22, 86 - Math.cos(a) * 22, '#2b2330', 1.8); }
  EA.linea(ctx, 380, 86, 380, 68, '#2b2330', 2.8); EA.linea(ctx, 380, 86, 393, 86, '#2b2330', 2.2); EA.circ(ctx, 380, 86, 2.2, '#2b2330');
  // piano
  EA.rr(ctx, 440, 196, 170, 100, 5, '#1a1410', EA.OL, 2.6); EA.rr(ctx, 440, 270, 170, 14, 2, '#f1ecd8', EA.OL, 2); for(let i = 0; i < 12; i++) EA.linea(ctx, 452 + i * 13.5, 270, 452 + i * 13.5, 284, 'rgba(0,0,0,.5)', 1); [1, 2, 4, 5, 6, 8, 9].forEach(i => EA.rr(ctx, 446 + i * 13.5, 270, 8, 9, 1, '#111', null));
  EA.rr(ctx, 460, 210, 130, 50, 3, '#2a2018', EA.OL, 1.6); EA.rr(ctx, 456, 296, 8, 20, 1, '#1a1410', EA.OL, 1.4); EA.rr(ctx, 586, 296, 8, 20, 1, '#1a1410', EA.OL, 1.4);
  if(e.flag('piano_abierto')){ EA.rr(ctx, 510, 220, 40, 14, 2, '#0a0806', EA.OL, 1.4); }
  // puerta de la cocina
  EA.puerta(ctx, 636, 110, 62, 202, { color: '#6a5a4a', cartel: 'COCINA' });
  // escalera decorativa
  for(let i = 0; i < 6; i++) EA.rr(ctx, 730 + i * 8, 200 + i * 18, 60 - i * 6, 16, 1, '#6a4a30', EA.OL, 1.6); EA.rr(ctx, 724, 130, 8, 170, 2, '#3a2418', EA.OL, 1.6);
  // puerta principal (vidrio)
  EA.rr(ctx, 806, 90, 84, 224, 3, '#22303c', EA.OL, 2.6);
  EA.rr(ctx, 812, 96, 72, 212, 2, pa ? '#0a1230' : '#1d3550', EA.OL, 1.6); if(!pa){ ctx.fillStyle = 'rgba(130,180,230,.18)'; ctx.fillRect(816, 100, 20, 204); EA.rr(ctx, 840, 200, 14, 28, 3, '#c9a53a', EA.OL, 1.8); EA.circ(ctx, 847, 214, 2.6, '#3a2a10'); }
  EA.rr(ctx, 818, 56, 64, 22, 3, '#0e3a22', EA.OL, 1.6); EA.txt(ctx, 'SALIDA', 850, 67, 10, '#7dff9f', 'center', '800');
}

function esc3DinamicoLobby(ctx, e, t){
  // la luna por los vidrios
  const g = ctx.createLinearGradient(812, 96, 880, 300); g.addColorStop(0, 'rgba(120,170,255,.2)'); g.addColorStop(1, 'rgba(120,170,255,0)'); ctx.fillStyle = g; ctx.fillRect(812, 96, 72, 208);
}

function esc3DibujarCocina(ctx, e){
  const W = 720;
  EA.cuarto(ctx, W, { pared: ['#b9c4b8', '#8a9b8c'], zocalo: '#4e6252', piso: ['#8a8d82', '#5a5d54'], manchas: [[200, 130, 60], [560, 100, 50]], grietas: [[330, 40]] });
  for(let x = 0; x < W; x += 36) for(let y = 24; y < 262; y += 36){ ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.strokeRect(x, y, 36, 36); }
  EA.tubo(ctx, 150, 38, 70); EA.tubo(ctx, 460, 38, 70);
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#6a5a4a' });
  // receta colgada
  EA.rr(ctx, 100, 78, 90, 110, 2, '#f1e7c6', EA.OL, 2); EA.txt(ctx, 'TORTA DE LA NOVIA', 145, 90, 6.4, '#7a2a1a', 'center', '800'); ['La manteca va última.', 'Los huevos, justo antes', 'que la manteca.', 'La harina, antes que', 'el azúcar.'].forEach((l, i) => EA.txt(ctx, l, 145, 108 + i * 12, 5.6, '#3a2a10', 'center', '600'));
  // horno
  EA.rr(ctx, 290, 150, 130, 160, 5, '#3a3d44', EA.OL, 2.6); EA.rr(ctx, 304, 190, 102, 100, 4, e.flag('horno_abierto') ? '#0a0806' : '#16181e', EA.OL, 2); [0, 1, 2, 3].forEach(i => EA.circ(ctx, 316 + i * 26, 168, 6, '#8a929c', EA.OL, 1.4)); EA.linea(ctx, 312, 200, 400, 200, '#8a929c', 4);
  // mesa con la nota del cocinero y los ingredientes
  EA.rr(ctx, 450, 250, 130, 10, 3, '#8a5a30', EA.OL, 2.2); [458, 564].forEach(x => EA.rr(ctx, x, 260, 8, 56, 1, '#6a4422', EA.OL, 1.6)); EA.rr(ctx, 470, 226, 22, 24, 3, '#e8e0d0', EA.OL, 1.6); EA.txt(ctx, 'H', 481, 238, 10, '#555', 'center', '800'); EA.rr(ctx, 498, 230, 22, 20, 3, '#f4f4f4', EA.OL, 1.6); EA.txt(ctx, 'A', 509, 240, 10, '#555', 'center', '800');
  EA.rr(ctx, 528, 234, 24, 16, 6, '#f6e8c0', EA.OL, 1.6); EA.rr(ctx, 556, 230, 20, 20, 3, '#f2d96a', EA.OL, 1.6);
  EA.poly(ctx, [[536, 214], [558, 212], [560, 232], [538, 234]], '#f6e27a', EA.OL, 1.2);
  // heladera
  EA.rr(ctx, 596, 110, 70, 204, 5, '#cfd6df', EA.OL, 2.6); EA.linea(ctx, 596, 190, 666, 190, EA.OL, 2); EA.rr(ctx, 652, 130, 6, 40, 2, '#6a6f78', EA.OL, 1.2); EA.rr(ctx, 652, 210, 6, 60, 2, '#6a6f78', EA.OL, 1.2);
  // puerta al sótano
  EA.puerta(ctx, 640, 110, 56, 202, { color: '#3d4a58', cartel: 'SÓTANO' });
  // ollas colgadas
  [200, 232, 264].forEach((x, i) => { EA.linea(ctx, x, 24, x, 56 + i * 6, '#333', 2); EA.circ(ctx, x, 66 + i * 6, 12, '#8a929c', EA.OL, 2); });
}

function esc3DibujarSotano(ctx, e){
  const W = 640;
  const c = ctx.createLinearGradient(0, 0, 0, 306); c.addColorStop(0, '#2c2420'); c.addColorStop(1, '#4a3a30'); ctx.fillStyle = c; ctx.fillRect(0, 0, W, 306);
  for(let y = 24; y < 306; y += 18) for(let x = ((y / 18) % 2) * 18; x < W; x += 36){ ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.strokeRect(x, y, 36, 18); }
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, 24);
  const f = ctx.createLinearGradient(0, 306, 0, 440); f.addColorStop(0, '#4a4540'); f.addColorStop(1, '#2e2a26'); ctx.fillStyle = f; ctx.fillRect(0, 306, W, 134); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 306, W, 4);
  [[160, 330], [420, 372], [560, 340]].forEach(([x, y]) => { ctx.fillStyle = 'rgba(30,40,60,.5)'; ctx.beginPath(); ctx.ellipse(x, y, 30, 7, 0, 0, 7); ctx.fill(); });
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#3d4a58' });
  // tuberías
  [[90, 60, 560], [90, 90, 400], [200, 40, 430]].forEach(([x, y, w]) => { EA.rr(ctx, x, y, w, 10, 5, '#8a6a48', EA.OL, 1.8); });
  [160, 300, 420].forEach(x => EA.rr(ctx, x, 60, 10, 90, 4, '#8a6a48', EA.OL, 1.8));
  // caldera
  EA.rr(ctx, 190, 130, 150, 182, 14, '#59636f', EA.OL, 3); EA.circ(ctx, 265, 170, 26, '#e9e4d4', EA.OL, 3); EA.linea(ctx, 265, 170, 280, 156, '#c0392b', 2.6); for(let i = 0; i < 9; i++){ const a = (-120 + i * 30) * Math.PI / 180; EA.linea(ctx, 265 + Math.sin(a) * 20, 170 - Math.cos(a) * 20, 265 + Math.sin(a) * 24, 170 - Math.cos(a) * 24, '#333', 1.4); }
  EA.rr(ctx, 220, 220, 90, 70, 6, '#2a2f36', EA.OL, 2); ctx.fillStyle = 'rgba(255,140,40,.35)'; ctx.fillRect(228, 258, 74, 24);
  // tres válvulas
  [['A', 370], ['B', 410], ['C', 450]].forEach(([n, x]) => { EA.rr(ctx, x - 5, 120, 10, 60, 3, '#6a4a2a', EA.OL, 1.6); EA.circ(ctx, x, 190, 16, '#c0392b', EA.OL, 2.4); EA.linea(ctx, x - 14, 190, x + 14, 190, '#7a1f1a', 3); EA.linea(ctx, x, 176, x, 204, '#7a1f1a', 3); EA.txt(ctx, n, x, 220, 11, '#fff', 'center', '800'); });
  // placa
  EA.rr(ctx, 360, 232, 110, 52, 2, '#c9c0a0', EA.OL, 2); ['Suma 10. Mayor a menor:', 'A, B, C (distintas, de 1 a 5).', 'B es par.'].forEach((l, i) => EA.txt(ctx, l, 415, 244 + i * 13, 5.8, '#2a2010', 'center', '700'));
  // compuerta
  const co = e.flag('compuerta_abierta');
  EA.rr(ctx, 520, 160, 90, 130, 4, '#3a4350', EA.OL, 3); EA.rr(ctx, 530, 170, 70, 110, 2, co ? '#06080c' : '#4a5463', EA.OL, 2); if(!co){ EA.circ(ctx, 565, 225, 8, '#c9a53a', EA.OL, 2); EA.linea(ctx, 530, 190, 600, 190, 'rgba(0,0,0,.3)', 2); EA.linea(ctx, 530, 260, 600, 260, 'rgba(0,0,0,.3)', 2); }
}

function esc3DinamicoSotano(ctx, e, t){
  ctx.fillStyle = 'rgba(255,140,40,' + (0.12 + 0.05 * Math.sin(t * 5)) + ')'; ctx.fillRect(228, 258, 74, 24);
  if(Math.random() < 0.02) EA.circ(ctx, 160 + Math.random() * 400, 60 + Math.random() * 90, 1.5, 'rgba(180,220,255,.6)');
}

// Elena, la novia: vestido blanco, velo, el pelo oscuro cubriéndole la cara y un ramo marchito.
function esc3Espectro(ctx, t, f){
  const bamb = Math.sin(t * 1.8) * 3;
  const g = ctx.createRadialGradient(0, -110, 10, 0, -110, 120); g.addColorStop(0, 'rgba(255,240,250,.26)'); g.addColorStop(1, 'rgba(255,240,250,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -110, 120, 0, 7); ctx.fill();
  // vestido con falda ancha y bordes rasgados
  ctx.fillStyle = 'rgba(238,236,246,.92)'; ctx.strokeStyle = 'rgba(90,80,110,.45)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-18, -146); ctx.quadraticCurveTo(-24, -100, -52 + bamb, -2);
  for(let i = 0; i <= 8; i++) ctx.lineTo(-52 + i * 13 + bamb, -2 + (i % 2 ? 13 : -3) + Math.sin(t * 2.6 + i) * 3);
  ctx.quadraticCurveTo(24, -100, 18, -146); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,140,170,.5)'; ctx.lineWidth = 1.2; [-20, 0, 20].forEach(x => { ctx.beginPath(); ctx.moveTo(x * 0.5, -130); ctx.quadraticCurveTo(x, -70, x * 1.9, -8); ctx.stroke(); });
  ctx.fillStyle = 'rgba(70,60,80,.9)'; ctx.fillRect(-16, -104, 32, 5);
  // brazos finos y ramo
  ctx.strokeStyle = 'rgba(232,230,242,.95)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  [-1, 1].forEach(l => { ctx.beginPath(); ctx.moveTo(l * 18, -140); ctx.quadraticCurveTo(l * 34, -100, l * 12, -84); ctx.stroke(); });
  ctx.fillStyle = 'rgba(110,70,90,.95)'; [[-6, -84], [0, -90], [6, -84], [0, -80]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); });
  // pelo largo y negro, velo
  ctx.fillStyle = 'rgba(14,10,18,.97)'; ctx.beginPath(); ctx.moveTo(-17, -190); ctx.quadraticCurveTo(-32, -150, -26 + bamb * 0.5, -100); ctx.lineTo(-12, -100); ctx.lineTo(-10, -150); ctx.quadraticCurveTo(0, -160, 10, -150); ctx.lineTo(12, -100); ctx.lineTo(26 + bamb * 0.5, -100); ctx.quadraticCurveTo(32, -150, 17, -190); ctx.quadraticCurveTo(0, -204, -17, -190); ctx.fill();
  ctx.fillStyle = 'rgba(236,240,252,.55)'; ctx.beginPath(); ctx.moveTo(-26, -196); ctx.quadraticCurveTo(0, -214, 26, -196); ctx.quadraticCurveTo(46, -140, 34 + bamb, -60); ctx.lineTo(-34 + bamb, -60); ctx.quadraticCurveTo(-46, -140, -26, -196); ctx.fill();
  // cara pálida detrás del pelo, ojos negros
  ctx.fillStyle = 'rgba(226,230,240,.96)'; ctx.beginPath(); ctx.ellipse(0, -168, 11, 17, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#05060b'; [-4.5, 4.5].forEach(ox => { ctx.beginPath(); ctx.ellipse(ox, -170, 3.4, 5.6, 0, 0, 7); ctx.fill(); });
  ctx.fillStyle = 'rgba(255,255,255,.8)'; [-4.5, 4.5].forEach(ox => { ctx.beginPath(); ctx.arc(ox, -168.5, 0.9, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#05060b'; ctx.beginPath(); ctx.ellipse(0, -158, 2.8, 3 + Math.abs(Math.sin(t * 2)) * 3, 0, 0, 7); ctx.fill();
}

const ESC3_ITEMS = {
  farol_v: { nombre: 'Farol vacío', icono: '🏮', desc: 'Un farol de aceite, sin aceite ni llama.' },
  aceite: { nombre: 'Aceite', icono: '🫗', desc: 'Una botellita de aceite para lámparas.' },
  fosforos: { nombre: 'Fósforos', icono: '🔥', desc: 'Una cajita con pocos fósforos.' },
  farol_1: { nombre: 'Farol con aceite', icono: '🏮', desc: 'Tiene aceite, pero falta encenderlo.' },
  linterna_lista: { nombre: 'Farol', icono: '🏮', desc: 'El farol encendido. Alumbra solo cuando hay oscuridad.' },
  llave_12: { nombre: 'Llave de la 12', icono: '🗝️', desc: 'La llave de la habitación 12.' },
  anillo: { nombre: 'Anillo de bodas', icono: '💍', desc: 'Un anillo de oro con un grabado: «E. & R. 1962».' },
  llave_cocina: { nombre: 'Llave de la cocina', icono: '🔑', desc: 'Una llave de bronce con una etiqueta: COCINA.' },
  llave_sotano: { nombre: 'Llave del sótano', icono: '🗝️', desc: 'Una llave oxidada y fría. Dice SÓTANO.' },
  llave_maestra: { nombre: 'Llave maestra', icono: '🗝️', desc: 'La llave maestra del hotel: abre todo.' },
};
const ESC3_COMBOS = [
  { a: 'farol_v', b: 'aceite', da: 'farol_1', texto: 'Le echaste aceite al farol. Falta una llama.' },
  { a: 'farol_1', b: 'fosforos', da: 'linterna_lista', texto: '¡Prendió! El farol alumbra con una llama tranquila.', alHacer: async e => { e.set('linterna_armada'); e.cara('alivio', 2); await e.bi('¡Fuego! Digo... luz. Ahora el hotel da menos miedo. Un poquito menos.'); } },
];

const ESC3_PISTAS = [
  EO.pista('ropero', e => !e.flag('ropero_abierto'), ['Estás a oscuras. Hay un ropero con candado de 4 números.', 'En el espejo hay algo escrito con lápiz labial, pero al revés.', 'El espejo dice 6275 (leelo de derecha a izquierda y dado vuelta).']),
  EO.pista('farol', e => !e.tiene('linterna_lista') && !e.flag('linterna_armada'), ['Para ver mejor, armá un farol: hacen falta el farol, aceite y fósforos.', 'El farol está en el ropero. El aceite, en la cómoda. Los fósforos, en la mesa de luz.', 'Combiná: farol + aceite, y después + fósforos.']),
  EO.pista('llave12', e => !e.flag('puerta12_abierta'), ['La puerta está cerrada con llave. A veces las llaves se caen y quedan donde nadie mira.', 'Con el farol encendido, mirá debajo de la cama.', 'Usá la llave de la 12 en la puerta.']),
  EO.pista('caja', e => !e.flag('caja_abierta'), ['La caja fuerte de recepción tiene un código de 4 números. Se refiere a una fecha.', 'En la habitación 12 hay una nota que dice cuál es "nuestro día". El mes está en el libro de huéspedes.', 'Día 17 y mes 03: escribí 1703.']),
  EO.pista('melodia', e => !e.flag('piano_abierto'), ['El piano tiene algo escondido. Se abre con una melodía.', 'La caja de música de la habitación 12 toca una melodía de cinco notas. Fijate en la cómoda.', 'La melodía es MI, SOL, FA, MI, RE.']),
  EO.pista('cocina', e => !e.flag('cocina_abierta'), ['Para seguir, necesitás entrar a la cocina.', 'La llave de la cocina está en la caja fuerte de recepción.', 'Usá la llave de la cocina en la puerta de la derecha.']),
  EO.pista('horno', e => !e.flag('horno_abierto'), ['El horno está trabado. La receta de la pared da el orden de los ingredientes.', 'La manteca va última, los huevos justo antes, y la harina antes que el azúcar.', 'El orden es harina, azúcar, huevos, manteca.']),
  EO.pista('sotano', e => !e.flag('sotano_abierto'), ['La puerta del sótano necesita su llave.', 'La llave del sótano está en el horno de la cocina.', 'Usala en la puerta del sótano.']),
  EO.pista('valvulas', e => !e.flag('compuerta_abierta'), ['En el sótano, la compuerta se abre con las tres válvulas. Hay una placa con las reglas.', 'Suman 10, A es mayor que B y B mayor que C, todas distintas de 1 a 5, y B es par.', 'La combinación es A=5, B=4, C=1.']),
  EO.pista('final', e => !e.flag('elena_paz'), ['Ya tenés lo necesario. Volvé a la recepción: la puerta principal está cerrada.', 'Hay alguien que busca algo antes de dejarte ir: su anillo.', 'Usá la llave maestra en la puerta y dale el anillo a la novia.']),
];

const ESC3_SALAS = {
  hab: {
    id: 'hab', nombre: 'Habitación 12', ancho: 940, penumbra: 0.7, dibujar: esc3DibujarHab, dinamico: esc3DinamicoHab,
    oscura: e => !e.tiene('linterna_lista'), musica: e => e.tiene('linterna_lista') ? 'tension' : 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'sfx:cajaMusica', 'pasos', 'sombra', 'parpadeo'],
    alEntrar: async () => {},
    objetos: [
      { id: 'puerta_hab', nombre: 'Puerta', x: 20, y: 110, w: 62, h: 202, pie: 52,
        toque: async e => { if(e.flag('puerta12_abierta')){ await e.ir('lobby', 90, 1); return; } await e.yo('Está cerrada con llave. Por la rendija entra olor a flores marchitas.', 'serio'); },
        usar: { llave_12: async e => { e.quitar('llave_12'); e.set('puerta12_abierta'); e.sfx('puerta'); await e.yo('La puerta se abre. El pasillo huele a azahar.', 'preocupado'); await e.ir('lobby', 90, 1); } } },
      EO.mirar('ventana', 'Ventana', 100, 60, 96, 128, 'La luna se ve enorme. En el vidrio hay marcas de manos... desde afuera.', 'miedo'),
      EO.tomar('aceite', 'Aceite', 228, 190, 30, 50, 'aceite', 'aceite_tomado', 'Sobre la cómoda hay una botellita de aceite para lámparas.', { pie: 244 }),
      { id: 'caja_musica', nombre: 'Caja de música', x: 276, y: 202, w: 60, h: 36, pie: 306,
        toque: async e => {
          e.sfx('cajaMusica');
          await e.yo('Una cajita de música. Al abrirla suena una nana: ♪ MI – SOL – FA – MI – RE ♪', 'curioso');
          e.nota('melodia', 'Caja de música', 'Suena una nana de 5 notas: <b>MI – SOL – FA – MI – RE</b>');
          if(!e.flag('caja_musica_vista')){ e.set('caja_musica_vista'); await e.bi('Qué linda... y qué escalofrío. ¿Quién la dejó abierta?'); }
        } },
      { id: 'espejo', nombre: 'Espejo', x: 372, y: 56, w: 94, h: 150, pie: 419,
        toque: async e => {
          const html = '<p>En el espejo hay números escritos con lápiz labial. Se ven <b>al revés</b>, porque el espejo da vuelta todo:</p><div class="esc-espejo" style="font-size:36px;font-weight:800;letter-spacing:6px;text-align:center;color:#b3322e;margin:8px 0">6 2 7 5</div>';
          e.nota('espejo', 'Espejo de la habitación 12', html);
          await e.leer('Espejo', html);
          if(!e.flag('espejo_visto')){ e.set('espejo_visto'); e.cara('preocupado', 3); await e.yo('Alguien lo escribió... pero desde el otro lado del vidrio.', 'preocupado'); }
        } },
      { id: 'ropero', nombre: 'Ropero', x: 500, y: 70, w: 120, h: 244, pie: 560,
        toque: async e => {
          if(e.flag('ropero_abierto')){ await e.yo('El ropero está abierto: solo quedan perchas vacías que se mueven solas.', 'preocupado'); return; }
          const ok = await e.digitos({ titulo: 'Ropero de la 12', sub: 'Candado de 4 números', n: 4, clave: '6275' });
          if(!ok) return;
          e.set('ropero_abierto'); e.sfx('puerta');
          await e.dar('farol_v', 'Adentro hay un farol de aceite, apagado y sin aceite.');
        } },
      { id: 'cama', nombre: 'Cama', x: 634, y: 180, w: 214, h: 160, pie: 600,
        toque: async e => { await e.yo(e.tiene('linterna_lista') ? 'Una cama de bronce con la colcha manchada. Abajo hay lugar para esconder cosas.' : 'Una cama grande. Abajo está muy oscuro para ver algo.', 'curioso'); } },
      { id: 'llave12_f', nombre: 'Algo brilla', x: 716, y: 338, w: 44, h: 28, pie: 740, oculto: true, visible: e => !e.flag('llave12_tomada'),
        toque: async e => { e.set('llave12_tomada'); await e.dar('llave_12', 'Debajo de la cama, entre el polvo, estaba la llave de la habitación 12.'); } },
      { id: 'mesa_luz', nombre: 'Mesa de luz', x: 856, y: 228, w: 56, h: 90, pie: 880, visible: () => true,
        toque: async e => {
          if(!e.flag('fosforos_tomados')){ e.set('fosforos_tomados'); await e.dar('fosforos', 'En el cajón de la mesa de luz hay una cajita de fósforos.'); }
          const t = 'Mi amor: mañana, <b>17</b>, será nuestro día. Guardé el anillo donde solo la música lo encuentra. — Elena';
          e.nota('nota_elena', 'Nota sobre la mesa de luz', t);
          await e.leer('Nota de Elena', `<p class="esc-manuscrito">${t}</p>`);
        } },
    ],
  },

  lobby: {
    id: 'lobby', nombre: 'Recepción', ancho: 900, dibujar: esc3DibujarLobby, dinamico: esc3DinamicoLobby,
    oscura: e => !e.tiene('linterna_lista'), musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'sfx:cajaMusica', 'pasos', 'sombra', 'campana'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(700); e.sfx('nota', 523); await e.esperar(500); e.sfx('nota', 392); await e.esperar(500); e.sfx('nota', 330);
      e.asustar('sombra', { x: e.camX - 40 }); await e.bi('¿Alguien tocó el piano? ¡Nadie toca el piano! ¡Decime que nadie toca el piano!');
    },
    objetos: [
      EO.puerta({ id: 'puerta_hab2', nombre: 'Habitación 12', x: 20, y: 110, w: 62, h: 202, pie: 52, a: 'hab', xa: 100, dir: 1 }),
      EO.leer('libro', 'Libro de huéspedes', 126, 184, 62, 28, { nota: 'libro', titulo: 'Libro de huéspedes', html: `<table class="esc-tabla"><tr><th>HAB.</th><th>HUÉSPED</th><th>INGRESO</th><th>EGRESO</th></tr><tr><td>4</td><td>Sr. Ferrero</td><td>01/03/62</td><td>03/03/62</td></tr><tr><td>7</td><td>Fam. Lugo</td><td>08/03/62</td><td>10/03/62</td></tr><tr><td>9</td><td>Dr. Paz</td><td>11/03/62</td><td>13/03/62</td></tr><tr class="esc-rojo"><td>12</td><td>Sres. Alvear (luna de miel)</td><td>14/03/62</td><td>NO REGISTRA</td></tr></table><p class="esc-chico">Todos los ingresos son del mes de marzo de 1962.</p>` }),
      EO.mirar('llaveros', 'Llaves', 130, 110, 190, 70, 'El tablero de llaves de las habitaciones. Falta la de la 12... y la de la puerta principal.', 'curioso'),
      { id: 'caja_fuerte', nombre: 'Caja fuerte', x: 234, y: 260, w: 66, h: 54, pie: 266,
        toque: async e => {
          if(e.flag('caja_abierta')){ await e.yo('La caja fuerte está vacía.', 'normal'); return; }
          const ok = await e.digitos({ titulo: 'Caja fuerte de recepción', sub: 'Código de 4 números: una fecha (día y mes)', n: 4, clave: '1703' });
          if(!ok) return;
          e.set('caja_abierta'); e.sfx('puerta'); await e.dar('llave_cocina', 'La caja fuerte se abrió: adentro hay una llave de bronce con la etiqueta COCINA.');
        } },
      EO.mirar('reloj', 'Reloj', 354, 60, 52, 52, 'El reloj de la recepción está parado a las 12 en punto. Medianoche... otra vez.', 'preocupado'),
      { id: 'piano', nombre: 'Piano', x: 438, y: 190, w: 176, h: 130, pie: 526,
        toque: async e => {
          if(e.flag('piano_abierto')){ await e.yo('Un piano de cola. El compartimento secreto está vacío.', 'normal'); return; }
          const ok = await e.secuencia({ titulo: 'Piano', sub: 'Tocá la melodía de la nana (5 notas)', items: [{ id: 'do', txt: 'DO' }, { id: 're', txt: 'RE' }, { id: 'mi', txt: 'MI' }, { id: 'fa', txt: 'FA' }, { id: 'sol', txt: 'SOL' }, { id: 'la', txt: 'LA' }, { id: 'si', txt: 'SI' }], largo: 5, clave: 'mi,sol,fa,mi,re',
            alTocar: id => { const f = { do: 262, re: 294, mi: 330, fa: 349, sol: 392, la: 440, si: 494 }[id]; if(typeof essNota === 'function') essNota(f); } });
          if(!ok){ const yaFallo = e.flag('fallo_piano'); e.set('fallo_piano'); await e.asustar('fuerte', { cuenta: !yaFallo }); await e.yo('¡La tapa del piano se cerró de golpe! Esa no era la melodía.', 'terror'); return; }
          e.set('piano_abierto'); e.sfx('puerta'); e.cara('curioso', 3);
          await e.dar('anillo', 'Un compartimento secreto se abrió en el piano. Adentro brilla un anillo de oro: «E. & R. 1962».');
          await e.bi('Un anillo de bodas. Creo que sé a quién le pertenece, y no me gusta.');
        } },
      EO.puerta({ id: 'puerta_cocina', nombre: 'Cocina', x: 636, y: 110, w: 62, h: 202, pie: 666, a: 'cocina', xa: 70, dir: 1, flag: 'cocina_abierta', llave: 'llave_cocina', bloqueada: 'La puerta de la cocina tiene llave.', abrir: 'La llave gira. Del otro lado se siente frío.' }),
      EO.mirar('escalera', 'Escalera', 724, 130, 90, 190, 'La escalera sube a las habitaciones. Cuando miro hacia arriba, el último escalón cruje solo.', 'miedo'),
      { id: 'puerta_principal', nombre: 'Puerta principal', x: 806, y: 90, w: 84, h: 224, pie: 790,
        toque: async e => {
          if(e.flag('puerta_principal_abierta')){ await e.yo('Es la salida. Afuera ya empieza a amanecer.', 'alivio'); return; }
          await e.yo('La puerta principal está cerrada con llave maestra. Se ve la ruta, y el micro roto, allá a lo lejos.', 'serio');
        },
        usar: { llave_maestra: async e => { e.quitar('llave_maestra'); e.sfx('puerta'); await esc3Final(e); } } },
    ],
  },

  cocina: {
    id: 'cocina', nombre: 'Cocina', ancho: 720, dibujar: esc3DibujarCocina, dinamico: () => {},
    oscura: e => !e.tiene('linterna_lista'), musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sfx:gota', 'sombra'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(500); e.sfx('gota'); await e.bi('Huele a torta... vieja. Muy vieja. ¿Quién cocina a esta hora?');
    },
    objetos: [
      EO.puerta({ id: 'puerta_lobby', nombre: 'Recepción', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'lobby', xa: 666, dir: -1 }),
      EO.leer('receta', 'Receta', 100, 78, 90, 110, { nota: 'receta', titulo: 'Receta: torta de la novia', html: '<p><b>TORTA DE LA NOVIA</b> (ingredientes: harina, azúcar, huevos, manteca)</p><ul><li>La <b>manteca</b> va última.</li><li>Los <b>huevos</b>, justo antes que la manteca.</li><li>La <b>harina</b>, antes que el azúcar.</li></ul>' }),
      { id: 'horno', nombre: 'Horno', x: 288, y: 150, w: 134, h: 160, pie: 355,
        toque: async e => {
          if(e.flag('horno_abierto')){ await e.yo('El horno está abierto. Ya no queda nada adentro.', 'normal'); return; }
          const ok = await e.secuencia({ titulo: 'Horno de la torta', sub: 'Poné los ingredientes en el orden de la receta', items: [{ id: 'harina', txt: '🌾 Harina' }, { id: 'azucar', txt: '🍬 Azúcar' }, { id: 'huevos', txt: '🥚 Huevos' }, { id: 'manteca', txt: '🧈 Manteca' }], largo: 4, clave: 'harina,azucar,huevos,manteca' });
          if(!ok){ await e.yo('El horno rechina y vuelve a trabarse. Ese no era el orden.', 'serio'); return; }
          e.set('horno_abierto'); e.sfx('puerta'); await e.dar('llave_sotano', 'El horno se destrabó. Adentro, sobre una bandeja, hay una llave oxidada: SÓTANO.');
        } },
      EO.leer('ingredientes', 'Ingredientes', 466, 214, 118, 40, { nota: 'ingredientes', titulo: 'Sobre la mesa', html: '<p>Sobre la mesa quedaron una bolsa de <b>harina</b>, un frasco de <b>azúcar</b>, <b>huevos</b> y un pan de <b>manteca</b>. Todo con una capa de polvo de décadas.</p>' }, { pie: 520 }),
      EO.mirar('heladera', 'Heladera', 594, 110, 74, 204, 'Una heladera enorme. Adentro hay un vestido de novia colgado en una percha... Cierro. No abro más.', 'terror'),
      EO.puerta({ id: 'puerta_sotano', nombre: 'Sótano', x: 640, y: 110, w: 56, h: 202, pie: 612, a: 'sotano', xa: 70, dir: 1, flag: 'sotano_abierto', llave: 'llave_sotano', bloqueada: 'La puerta del sótano está cerrada con llave.', abrir: 'La puerta del sótano se abre. Sube un aire húmedo y caliente.' }),
    ],
  },

  sotano: {
    id: 'sotano', nombre: 'Sótano', ancho: 640, dibujar: esc3DibujarSotano, dinamico: esc3DinamicoSotano,
    oscura: e => !e.tiene('linterna_lista'), musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sfx:gota', 'sfx:viento'],
    alEntrar: async (e, primera) => {
      if(!primera) return;
      await e.esperar(600); e.sfx('gota'); await e.bi('Hace calor. Las cañerías suenan como si respiraran. Yo digo: no toquemos nada. Digo yo.');
      await e.esperar(900); e.fantasmaEn('sombra', { x: e.camX - 40, dur: 3 });
    },
    objetos: [
      EO.puerta({ id: 'puerta_cocina2', nombre: 'Cocina', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'cocina', xa: 612, dir: -1 }),
      EO.mirar('caldera', 'Caldera', 188, 128, 154, 186, 'La caldera de las habitaciones. El manómetro marca presión peligrosa. Algo adentro hace «tac, tac, tac», como alguien golpeando.', 'miedo'),
      EO.leer('placa', 'Placa de las válvulas', 358, 230, 114, 56, { nota: 'placa', titulo: 'Placa', html: '<p><b>VÁLVULAS A, B y C</b> (cada una se regula de 1 a 5):</p><ul><li>Suman <b>10</b>.</li><li>De mayor a menor: <b>A, B, C</b> (todas distintas).</li><li><b>B es par</b>.</li></ul>' }),
      { id: 'valvulas', nombre: 'Válvulas', x: 352, y: 112, w: 118, h: 124, pie: 410,
        toque: async e => {
          if(e.flag('compuerta_abierta')){ await e.yo('Las válvulas están reguladas: la presión bajó.', 'normal'); return; }
          const ok = await e.ruedas({ titulo: 'Válvulas A · B · C', sub: 'Regulá cada válvula del 1 al 5 según la placa', n: 3, listas: [['1', '2', '3', '4', '5'], ['1', '2', '3', '4', '5'], ['1', '2', '3', '4', '5']], clave: '541' });
          if(!ok){ const yaFallo = e.flag('fallo_valvulas'); e.set('fallo_valvulas'); e.sfx('viento'); await e.asustar('fuerte', { cuenta: !yaFallo }); await e.yo('¡Un chorro de vapor casi me quema! Esa no era la combinación.', 'terror'); return; }
          e.set('compuerta_abierta'); e.sfx('arrastre'); e.sacudir(0.5); e.cara('alivio', 2.5);
          await e.yo('La presión baja con un largo suspiro y la compuerta de la pared se abre sola.', 'alivio');
          await e.dar('llave_maestra', 'Dentro de la compuerta, colgada de un clavo, estaba la llave maestra del hotel.');
        } },
      { id: 'compuerta', nombre: 'Compuerta', x: 520, y: 160, w: 90, h: 130, pie: 560,
        toque: async e => { await e.yo(e.flag('compuerta_abierta') ? 'La compuerta está abierta y vacía.' : 'Una compuerta de hierro cerrada. Un cartel dice: «Se abre sola cuando baja la presión».', e.flag('compuerta_abierta') ? 'normal' : 'curioso'); } },
    ],
  },
};

async function esc3Final(e){
  e.set('puerta_principal_abierta');
  await e.narrar('La llave maestra gira... pero la puerta no se abre.');
  e.sfx('cajaMusica'); e.parpadear(1); e.sacudir(0.4); await e.esperar(1200);
  e.fantasmaEn('quieto', { x: 740, y: 330, escala: 0.9, alfa: 0, max: 0.9, dir: -1 });
  await e.asustar('fuerte', {}); e.cara('terror', 2.5);
  const v = t => e.decir(t, { quien: 'voz', expr: 'preocupado' });
  await v('Mi anillo... lo perdí esa noche... y no pude irme sin él.');
  await e.bi('Ay, ay, ay. Tranquila, señora. Tenemos algo para usted.');
  await e.yo('Tengo su anillo. Estaba en el piano, donde solo la música lo encuentra.', 'alivio');
  e.cara('alivio', 4); e.sfx('campana');
  await v('Gracias, gracias... Ahora puedo descansar. La puerta ya está abierta. Seguí tu camino.');
  e.quitar('anillo'); e.set('elena_paz'); e.quitarFantasma(); e.flash('#fff3f8', 0.9);
  await e.esperar(900);
  await e.narrar('La puerta principal se abre y entra el aire frío y limpio de la madrugada. El hotel se queda en silencio, ahora sí, en paz.');
  await e.bi('¡Escapamos del hotel! Y la caja de música dejó de sonar. Qué bonito final. Qué susto.');
  if(typeof essFinal === 'function') essFinal();
  await e.esperar(1600);
  await e.fin();
}

ESC_JUEGOS.hotel = {
  id: 'hotel', titulo: 'Hotel de la ruta', emoji: '🏨', dificultad: 'Difícil', salasTotal: 4, espectro: esc3Espectro,
  resumen: 'Se rompió el micro y dormiste en un hotel de ruta. Te despertás solo/a en la habitación 12, con una caja de música que suena sola y una novia que no se fue.',
  inicio: { sala: 'hab', x: 110 },
  items: ESC3_ITEMS, combos: ESC3_COMBOS, pistas: ESC3_PISTAS, salas: ESC3_SALAS,
  intro: async e => {
    await e.narrar('Hotel Los Álamos, en plena ruta. 2:40 de la madrugada.');
    await e.narrar('El micro se rompió y el grupo durmió acá. Pero cuando abrís los ojos, la habitación 12 está sola, fría y a oscuras.');
    e.sfx('cajaMusica'); e.parpadear(1); e.cara('preocupado', 4);
    await e.yo('¿Hola? ¿Chicos? ...Me dejaron solo/a. Perfecto.', 'preocupado');
    await e.bi('Soy Bi. Oí una cajita de música, y yo no tengo oídos. Mirá lo que digo. Vamos a salir de acá.');
    await e.yo('Sin luz no voy a llegar lejos. Primero hay que ver qué hay en la habitación.', 'serio');
  },
};
