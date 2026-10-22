// Bus-queda 4: "La valija perdida". 4 habitaciones: Sala de arribos → Aduana → Depósito de extraviados → Rampa de carga.
//
// La historia: llegás de viaje y tu valija no sale por la cinta. Entrás a buscarla y las puertas se cierran. En la terminal
// trabaja de noche el Maletero: murió en 1971 en la rampa, y su valija nº 13 nunca llegó a destino. No deja salir a nadie
// hasta que las valijas perdidas lleguen a donde tienen que ir.
//
// Camino de la solución:
//  Arribos:   pantalla de vuelos: el último que arribó (por horario) es el LA 2077 → persiana del mostrador (2077) → pase de personal y linterna.
//             Carrito: disco de cifrado (las etiquetas están corridas 3 letras). Tu talón: 7314 · MENDOZA.
//  Aduana:    el pase abre la puerta. Balanza: "13 kilos exactos con 3 objetos" (libros 9 + termo 3 + llavero 1) → caja de decomisos → llave del depósito.
//             Sello de aduana (se junta). Cajón con el legajo del Maletero: "valija 13, bajo la escalera del depósito".
//  Depósito:  cinco valijas con etiquetas en clave: PHQGRCD = MENDOZA es la tuya. Las otras asustan. Con luz: la valija 13 bajo la escalera.
//             Sello + tu valija = valija sellada.
//  Rampa:     barrera con tu número de talón (7314). Cinta de carga: la valija sellada y la valija 13. El Maletero las despide y abre la salida.

function esc4Valija(ctx, x, y, w, h, c1, c2, o){
  EA.rr(ctx, x, y, w, h, 5, c1, EA.OL, 2); ctx.fillStyle = c2; ctx.fillRect(x + w * 0.2, y + 3, 3, h - 6); ctx.fillRect(x + w * 0.72, y + 3, 3, h - 6);
  EA.rr(ctx, x + w * 0.34, y - 6, w * 0.32, 7, 3, null, EA.OL, 2); EA.rr(ctx, x + w * 0.4, y + h * 0.5, w * 0.2, 6, 2, '#E6C14B', EA.OL, 1);
  if(o && o.etiqueta){ EA.poly(ctx, [[x + w - 18, y + h - 22], [x + w - 4, y + h - 22], [x + w - 4, y + h - 4], [x + w - 18, y + h - 4]], '#f4f0e4', EA.OL, 1); [h - 18, h - 13, h - 8].forEach(dy => EA.linea(ctx, x + w - 15, y + dy, x + w - 7, y + dy, 'rgba(0,0,0,.5)', 1)); }
}

function esc4DibujarArribos(ctx, e){
  const W = 900, persiana = !e.flag('mostrador_abierto');
  EA.cuarto(ctx, W, { pared: ['#5a6a7c', '#7a8a9a'], zocalo: '#34404c', piso: ['#8a95a0', '#5e6872'], manchas: [[260, 130, 80], [700, 70, 60]], grietas: [[480, 34], [800, 40]] });
  [140, 440, 740].forEach(x => EA.tubo(ctx, x, 12, 80));
  // ventanales a la noche
  [[420, 60], [560, 60]].forEach(([x, y]) => { EA.rr(ctx, x, y, 120, 140, 3, '#0a1230', EA.OL, 3); for(let i = 0; i < 14; i++){ ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 6 + (i * 37) % 108, y + 8 + (i * 29) % 90, 1.5, 1.5); } EA.linea(ctx, x + 60, y, x + 60, y + 140, EA.OL, 2); });
  EA.puerta(ctx, 20, 110, 64, 202, { color: '#4a5560', cartel: 'ADUANA' });
  // pantalla de vuelos
  EA.rr(ctx, 110, 40, 200, 100, 4, '#0b1220', EA.OL, 3); EA.txt(ctx, 'ARRIBOS', 210, 52, 9, '#FFB347', 'center', '800');
  [['AR 1432', '21:10', 'ARRIBÓ'], ['AV 118', '22:30', 'ARRIBÓ'], ['LA 2077', '23:50', 'ARRIBÓ'], ['AR 1500', '00:20', 'CANCELADO']].forEach((r, i) => { const y = 70 + i * 17, c = i === 3 ? '#ff7a6a' : '#FFB347'; EA.txt(ctx, r[0], 120, y, 8, c, 'left', '700'); EA.txt(ctx, r[1], 216, y, 8, c, 'center', '700'); EA.txt(ctx, r[2], 300, y, 7, c, 'right', '700'); });
  // mostrador de equipajes perdidos con persiana
  EA.rr(ctx, 330, 130, 160, 184, 4, '#3a4654', EA.OL, 2.6); EA.rr(ctx, 344, 142, 132, 22, 3, '#0b1220', EA.OL, 1.6); EA.txt(ctx, 'EQUIPAJES PERDIDOS', 410, 153, 8.4, '#FFD84D', 'center', '800');
  EA.rr(ctx, 344, 176, 132, 100, 2, persiana ? '#7a828c' : '#06080c', EA.OL, 2);
  if(persiana){ for(let y = 182; y < 276; y += 10){ ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(344, y, 132, 2.5); } EA.rr(ctx, 396, 260, 28, 14, 2, '#2a313b', EA.OL, 1.6); for(let i = 0; i < 4; i++) EA.circ(ctx, 402 + i * 7, 267, 2, '#cfd6df'); }
  else { EA.rr(ctx, 344, 176, 132, 12, 2, '#7a828c', EA.OL, 1.6); }
  // cinta de equipaje
  EA.rr(ctx, 520, 276, 270, 30, 6, '#23282f', EA.OL, 2.6); EA.rr(ctx, 520, 270, 270, 8, 4, '#4a525c', EA.OL, 1.8); for(let i = 0; i < 18; i++) EA.linea(ctx, 530 + i * 14.5, 280, 536 + i * 14.5, 304, 'rgba(255,255,255,.08)', 2);
  EA.rr(ctx, 796, 262, 14, 50, 3, '#4a525c', EA.OL, 1.8); [0, 1, 2].forEach(i => EA.rr(ctx, 800, 266 + i * 14, 6, 10, 1, '#222', null));
  EA.txt(ctx, 'CINTA 3', 655, 252, 11, '#fff', 'center', '800');
  // carrito
  EA.rr(ctx, 826, 230, 54, 6, 2, '#8a929c', EA.OL, 1.6); EA.linea(ctx, 830, 236, 830, 312, '#8a929c', 3); EA.linea(ctx, 876, 236, 876, 312, '#8a929c', 3); EA.linea(ctx, 826, 270, 880, 270, '#8a929c', 2.4); EA.linea(ctx, 826, 300, 880, 300, '#8a929c', 2.4); EA.linea(ctx, 826, 230, 840, 170, '#8a929c', 3);
  [832, 874].forEach(x => EA.circ(ctx, x, 316, 7, '#14161c', EA.OL, 2));
  if(!e.flag('disco_tomado')){ EA.circ(ctx, 852, 224, 11, '#e6dcc0', EA.OL, 1.8); EA.circ(ctx, 852, 224, 6, '#c9b98a', EA.OL, 1.2); EA.linea(ctx, 852, 224, 858, 217, '#b3322e', 2); }
  // sillas
  [[120, 0], [190, 0], [260, 0]].forEach(([x]) => { EA.rr(ctx, x, 310, 56, 10, 3, '#3a6ea5', EA.OL, 2); EA.rr(ctx, x, 292, 56, 14, 3, '#2f5c8d', EA.OL, 2); EA.linea(ctx, x + 8, 320, x + 8, 346, '#5b6370', 3); EA.linea(ctx, x + 48, 320, x + 48, 346, '#5b6370', 3); });
  // cartel de ARRIBOS colgando
  EA.linea(ctx, 600, 24, 600, 44, '#222', 2); EA.rr(ctx, 560, 44, 80, 20, 3, '#0f3a7a', EA.OL, 1.8); EA.txt(ctx, 'ARRIBOS', 600, 54, 9, '#fff', 'center', '800');
}

function esc4DinamicoArribos(ctx, e, t){
  // la valija solitaria que da vueltas por la cinta
  const x = 540 + ((t * 26) % 230);
  esc4Valija(ctx, x, 238, 40, 32, '#3a6ea5', '#254a78', { etiqueta: true });
  ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + 0.04 * Math.sin(t * 30)) + ')'; ctx.fillRect(110, 40, 200, 100);
}

function esc4DibujarAduana(ctx, e){
  const W = 840;
  EA.cuarto(ctx, W, { pared: ['#4a5a50', '#667a6c'], zocalo: '#2c3a32', piso: ['#6a6a64', '#46463f'], manchas: [[230, 120, 70], [600, 90, 60]], grietas: [[380, 34]] });
  [140, 480].forEach(x => EA.tubo(ctx, x, 12, 80));
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#4a5560' });
  // balanza con objetos
  EA.rr(ctx, 96, 240, 220, 12, 3, '#8a929c', EA.OL, 2.2); [104, 300].forEach(x => EA.rr(ctx, x, 252, 8, 62, 1, '#5a626d', EA.OL, 1.6));
  EA.rr(ctx, 160, 168, 92, 72, 4, '#d9d4c0', EA.OL, 2.4); EA.rr(ctx, 170, 176, 72, 26, 2, '#10281a', EA.OL, 1.6); EA.txt(ctx, '13.0 kg', 206, 189, 11, '#9dffb0', 'center', '800'); EA.rr(ctx, 176, 214, 60, 14, 2, '#8a929c', EA.OL, 1.4);
  [[110, '9'], [136, '5'], [264, '4'], [288, '3']].forEach(([x, n]) => { EA.rr(ctx, x, 214, 24, 26, 3, '#a8743a', EA.OL, 1.6); EA.txt(ctx, n + 'kg', x + 12, 227, 7, '#fff', 'center', '800'); });
  // caja de decomisos
  const cd = e.flag('caja_decomisos_abierta');
  EA.rr(ctx, 330, 210, 80, 102, 3, '#3a4350', EA.OL, 2.6); EA.rr(ctx, 338, 218, 64, 88, 2, cd ? '#06080c' : '#4a5463', EA.OL, 1.8); if(!cd){ EA.circ(ctx, 370, 262, 7, '#c9a53a', EA.OL, 1.8); }
  EA.rr(ctx, 332, 168, 76, 36, 2, '#e8d8a0', EA.OL, 2); EA.txt(ctx, 'DECOMISOS', 370, 178, 7, '#b3322e', 'center', '800'); EA.txt(ctx, 'Tara exacta: 13 kg', 370, 190, 6, '#3a2a10', 'center', '700'); EA.txt(ctx, 'en 3 objetos', 370, 199, 6, '#3a2a10', 'center', '700');
  // rayos X
  EA.rr(ctx, 440, 170, 190, 90, 6, '#2a303a', EA.OL, 3); EA.rr(ctx, 460, 190, 150, 54, 4, '#06080c', EA.OL, 2); ctx.fillStyle = 'rgba(80,120,170,.12)'; ctx.fillRect(464, 194, 142, 46);
  EA.rr(ctx, 440, 260, 190, 24, 4, '#23282f', EA.OL, 2); for(let i = 0; i < 12; i++) EA.linea(ctx, 448 + i * 15, 264, 452 + i * 15, 282, 'rgba(255,255,255,.1)', 2);
  EA.rr(ctx, 520, 120, 70, 40, 3, '#0b1220', EA.OL, 2); EA.txt(ctx, 'RAYOS X', 555, 140, 9, '#7dd3ff', 'center', '800');
  // escritorio con sello y cajón
  EA.rr(ctx, 650, 236, 100, 12, 3, '#8a5a30', EA.OL, 2.2); [656, 740].forEach(x => EA.rr(ctx, x, 248, 8, 66, 1, '#6a4422', EA.OL, 1.6)); EA.rr(ctx, 668, 248, 64, 28, 2, '#7a4e28', EA.OL, 1.6); EA.circ(ctx, 700, 262, 2.6, '#d9b73c');
  if(!e.flag('sello_tomado')){ EA.rr(ctx, 676, 218, 36, 18, 3, '#2d4f7a', EA.OL, 1.6); EA.rr(ctx, 688, 198, 12, 20, 4, '#7a4a22', EA.OL, 1.6); EA.rr(ctx, 684, 192, 20, 8, 4, '#9a6a32', EA.OL, 1.4); }
  EA.puerta(ctx, 772, 110, 56, 202, { color: '#3d4a58', cartel: 'DEPÓSITO' });
  EA.rr(ctx, 690, 80, 56, 80, 2, '#f1e7c6', EA.OL, 2); EA.txt(ctx, 'ADUANA', 718, 92, 8, '#b3322e', 'center', '800'); ['Declare todo.', 'Revise su valija.', 'Nada de líquidos.'].forEach((l, i) => EA.txt(ctx, l, 718, 108 + i * 13, 5.4, '#3a2a10', 'center', '600'));
}

function esc4DinamicoAduana(ctx, e, t){
  // la figura que se ve en el monitor de rayos X
  ctx.save(); ctx.beginPath(); ctx.rect(464, 194, 142, 46); ctx.clip();
  const x = 480 + Math.sin(t * 0.6) * 40; ctx.fillStyle = 'rgba(120,200,255,.28)'; ctx.beginPath(); ctx.ellipse(x + 40, 222, 22, 8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 40, 206, 8, 0, 7); ctx.fill(); ctx.fillRect(x + 32, 206, 16, 22);
  ctx.restore();
}

const ESC4_TAGS = [
  { id: 'v_roja', nombre: 'roja', x: 110, c: ['#c2312f', '#8e1f20'], cifrado: 'FRUGRED', claro: 'CORDOBA' },
  { id: 'v_verde', nombre: 'verde', x: 200, c: ['#2e8a5a', '#1c5a3a'], cifrado: 'VDOWD', claro: 'SALTA' },
  { id: 'v_azul', nombre: 'azul', x: 290, c: ['#2f63b8', '#1f3f7a'], cifrado: 'PHQGRCD', claro: 'MENDOZA' },
  { id: 'v_amarilla', nombre: 'amarilla', x: 380, c: ['#d9ac2a', '#a07a12'], cifrado: 'URVDULR', claro: 'ROSARIO' },
  { id: 'v_gris', nombre: 'gris', x: 470, c: ['#7a828c', '#4a525c'], cifrado: 'DUJHQWLQD', claro: 'ARGENTINA' },
];

function esc4DibujarDeposito(ctx, e){
  const W = 900;
  EA.cuarto(ctx, W, { pared: ['#464e58', '#626c78'], zocalo: '#2a3038', piso: ['#5a5e64', '#3e4146'], manchas: [[200, 100, 70], [560, 70, 60], [740, 210, 50]], grietas: [[320, 30], [680, 36]] });
  [180, 560].forEach(x => { EA.linea(ctx, x + 35, 22, x + 35, 40, '#222', 2); EA.tubo(ctx, x, 38, 70); });
  EA.puerta(ctx, 14, 110, 56, 202, { color: '#4a5560' });
  // estantería con las cinco valijas etiquetadas
  EA.rr(ctx, 96, 150, 440, 8, 2, '#6f7782', EA.OL, 1.8); EA.rr(ctx, 96, 232, 440, 8, 2, '#6f7782', EA.OL, 1.8); EA.rr(ctx, 96, 304, 440, 8, 2, '#6f7782', EA.OL, 1.8); [96, 528].forEach(x => EA.rr(ctx, x, 150, 8, 166, 1, '#5a626d', EA.OL, 1.6));
  ESC4_TAGS.forEach(v => esc4Valija(ctx, v.x, 164, 70, 66, v.c[0], v.c[1], { etiqueta: true }));
  [[110, 244, 60, 56], [190, 252, 70, 48], [280, 248, 80, 52], [380, 250, 70, 50], [470, 246, 56, 54]].forEach(([x, y, w, h], i) => EA.rr(ctx, x, y, w, h, 2, ['#9a7a4a', '#8a6a3a', '#a88a58'][i % 3], EA.OL, 1.6));
  EA.rr(ctx, 108, 94, 200, 40, 3, '#e8d8a0', EA.OL, 2); EA.txt(ctx, 'EQUIPAJES EXTRAVIADOS', 208, 105, 8.4, '#b3322e', 'center', '800'); EA.txt(ctx, 'Etiquetas escritas en clave por seguridad', 208, 120, 6, '#3a2a10', 'center', '700');
  // jaula
  EA.rr(ctx, 570, 120, 150, 192, 3, null, '#8a929c', 3); for(let x = 580; x < 720; x += 14) EA.linea(ctx, x, 120, x, 312, 'rgba(138,146,156,.8)', 2); EA.linea(ctx, 570, 190, 720, 190, 'rgba(138,146,156,.8)', 2); EA.linea(ctx, 570, 250, 720, 250, 'rgba(138,146,156,.8)', 2);
  esc4Valija(ctx, 600, 270, 50, 40, '#7a6a4a', '#5a4a30'); esc4Valija(ctx, 664, 280, 40, 30, '#4a4a56', '#2a2a36');
  // escalera
  for(let i = 0; i < 6; i++) EA.rr(ctx, 744 + i * 8, 200 + i * 18, 70 - i * 8, 14, 1, '#6a4a30', EA.OL, 1.6); EA.rr(ctx, 738, 130, 8, 190, 2, '#3a2418', EA.OL, 1.6);
  // puerta a la rampa
  EA.puerta(ctx, 830, 100, 56, 212, { color: '#3d4a58', cartel: 'RAMPA' });
}

function esc4DinamicoDeposito(ctx, e, t){
  if(!e.flag('valija13_tomada') && e.enLuz(790, 350)){ esc4Valija(ctx, 770, 336, 46, 34, '#6a5a42', '#4a3c28'); EA.txt(ctx, '13', 793, 354, 11, '#e8d8a0', 'center', '800'); esc1Brillito(ctx, 822, 332, t); }
}

function esc4DibujarRampa(ctx, e){
  const W = 800, abierta = e.flag('barrera_abierta'), fin = e.flag('final_listo');
  const cielo = ctx.createLinearGradient(0, 0, 0, 306); cielo.addColorStop(0, '#0a1024'); cielo.addColorStop(1, fin ? '#7a8fbf' : '#1c2748'); ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, 306);
  for(let i = 0; i < 40; i++){ ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 5) * 0.12) + ')'; ctx.fillRect((i * 97) % W, 24 + (i * 53) % 130, 1.6, 1.6); }
  EA.circ(ctx, 700, 60, 18, '#f1ecd2'); EA.circ(ctx, 707, 56, 16, fin ? '#7a8fbf' : '#16203e');
  EA.rr(ctx, -10, 90, 150, 216, 3, '#3a4452', EA.OL, 2); EA.puerta(ctx, 10, 110, 54, 202, { color: '#4a5560' });
  const f = ctx.createLinearGradient(0, 306, 0, 440); f.addColorStop(0, '#5a5c64'); f.addColorStop(1, '#3a3c44'); ctx.fillStyle = f; ctx.fillRect(0, 306, W, 134);
  ctx.fillStyle = '#e6c14b'; ctx.fillRect(0, 320, W, 5); for(let x = 0; x < W; x += 90){ ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, 380, 48, 4); }
  // barrera y teclado
  EA.rr(ctx, 150, 150, 14, 164, 3, '#8a929c', EA.OL, 2); EA.rr(ctx, 120, 150, 70, 12, 3, '#c0392b', EA.OL, 2); EA.rr(ctx, 168, 190, 32, 56, 4, '#2b323b', EA.OL, 2); EA.rr(ctx, 173, 196, 22, 12, 2, '#0a0c10', EA.OL, 1); EA.circ(ctx, 184, 218, 3, abierta ? '#46e07a' : '#e0463a');
  for(let i = 0; i < 6; i++) EA.circ(ctx, 177 + (i % 3) * 7, 228 + Math.floor(i / 3) * 7, 1.8, '#cfd6df');
  if(abierta){ EA.poly(ctx, [[120, 150], [60, 90], [66, 80], [126, 140]], '#c0392b', EA.OL, 2); }
  // cinta de carga hacia la camioneta
  EA.rr(ctx, 300, 258, 230, 34, 6, '#23282f', EA.OL, 2.6); EA.rr(ctx, 300, 252, 230, 8, 4, '#4a525c', EA.OL, 1.8); for(let i = 0; i < 16; i++) EA.linea(ctx, 310 + i * 14, 262, 316 + i * 14, 290, 'rgba(255,255,255,.08)', 2);
  [310, 520].forEach(x => EA.rr(ctx, x, 292, 6, 24, 1, '#444a52', EA.OL, 1.4));
  EA.rr(ctx, 360, 200, 80, 30, 3, '#0b1220', EA.OL, 2); EA.txt(ctx, 'CARGA', 400, 215, 11, '#FFB347', 'center', '800');
  // micro de traslado
  const cx = 560;
  EA.rr(ctx, cx, 150, 230, 160, 14, fin ? '#f2f4f8' : '#c9ced8', EA.OL, 3); ctx.fillStyle = '#0F2A4D'; ctx.fillRect(cx + 2, 250, 226, 32); ctx.fillStyle = '#E6A817'; ctx.fillRect(cx + 2, 244, 226, 6);
  for(let i = 0; i < 4; i++) EA.rr(ctx, cx + 20 + i * 46, 164, 38, 54, 5, fin ? '#ffe9a0' : '#0e1624', EA.OL, 2);
  [cx + 50, cx + 176].forEach(x => { EA.circ(ctx, x, 310, 24, '#14161c', EA.OL, 2.6); EA.circ(ctx, x, 310, 12, '#9aa2ae', EA.OL, 2); });
  if(typeof arcLogo === 'function') arcLogo(ctx, cx + 100, 268, 28, '#fff'); EA.txt(ctx, 'BUSMAC', cx + 160, 268, 13, '#fff', 'center', '800');
  EA.rr(ctx, cx + 196, 160, 26, 90, 3, fin ? '#cfe6ff' : '#0e1624', EA.OL, 2);
}

function esc4DinamicoRampa(ctx, e, t){
  if(e.flag('final_listo')){ const g = ctx.createRadialGradient(780, 270, 4, 780, 270, 90); g.addColorStop(0, 'rgba(255,250,200,.4)'); g.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = g; ctx.fillRect(690, 180, 110, 200); }
  if(e.flag('carga_tuya')) esc4Valija(ctx, 330 + ((t * 12) % 120), 222, 36, 30, '#2f63b8', '#1f3f7a', { etiqueta: true });
  if(e.flag('carga_13')) esc4Valija(ctx, 420 + ((t * 12) % 90), 224, 34, 28, '#6a5a42', '#4a3c28');
}

// El Maletero: chaleco naranja con bandas reflectantes, cuerpo larguísimo, protectores de oído y una cara que no se ve.
function esc4Espectro(ctx, t, f){
  const bamb = Math.sin(t * 2.2) * 2.5;
  const g = ctx.createRadialGradient(0, -110, 10, 0, -110, 120); g.addColorStop(0, 'rgba(255,190,100,.2)'); g.addColorStop(1, 'rgba(255,190,100,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -110, 120, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(70,78,96,.9)'; ctx.strokeStyle = 'rgba(20,26,40,.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-24, -150); ctx.lineTo(-30 + bamb, -8); ctx.lineTo(-10 + bamb, 6); ctx.lineTo(-4 + bamb, -8); ctx.lineTo(4 + bamb, -8); ctx.lineTo(10 + bamb, 6); ctx.lineTo(30 + bamb, -8); ctx.lineTo(24, -150); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,140,30,.95)'; ctx.beginPath(); ctx.moveTo(-26, -150); ctx.lineTo(-30, -84); ctx.lineTo(30, -84); ctx.lineTo(26, -150); ctx.lineTo(10, -150); ctx.lineTo(0, -126); ctx.lineTo(-10, -150); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(235,240,200,.95)'; [-134, -112].forEach(y => ctx.fillRect(-28, y, 56, 5));
  // brazos larguísimos que casi tocan el piso
  ctx.strokeStyle = 'rgba(60,68,86,.95)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  [-1, 1].forEach(l => { ctx.beginPath(); ctx.moveTo(l * 26, -142); ctx.quadraticCurveTo(l * 40, -80, l * (34 + Math.sin(t * 1.5) * 3), -14); ctx.stroke(); ctx.lineWidth = 3; [-5, 0, 5].forEach(d => { ctx.beginPath(); ctx.moveTo(l * (34 + Math.sin(t * 1.5) * 3), -14); ctx.lineTo(l * (34 + d) + d, 6); ctx.stroke(); }); ctx.lineWidth = 10; });
  // cabeza con gorra y protectores de oído; sin cara
  ctx.fillStyle = 'rgba(40,44,56,.97)'; ctx.beginPath(); ctx.ellipse(0, -170, 16, 22, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,140,30,.95)'; ctx.beginPath(); ctx.moveTo(-17, -178); ctx.quadraticCurveTo(0, -202, 17, -178); ctx.lineTo(24, -176); ctx.lineTo(-24, -176); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(30,34,44,.97)'; [-1, 1].forEach(l => { ctx.beginPath(); ctx.ellipse(l * 18, -168, 7, 10, 0, 0, 7); ctx.fill(); });
  ctx.strokeStyle = 'rgba(30,34,44,.97)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -172, 18, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = 'rgba(210,225,235,.95)'; [-6, 6].forEach(ox => { ctx.beginPath(); ctx.arc(ox, -168, 2.6 + Math.sin(t * 5) * 0.5, 0, 7); ctx.fill(); });
}

const ESC4_ITEMS = {
  talon: { nombre: 'Talón de equipaje', icono: '🎫', desc: 'TALÓN 7314 · Destino: MENDOZA. Es el comprobante de tu valija.' },
  pase: { nombre: 'Pase de personal', icono: '🪪', desc: 'Un pase de personal de la terminal. Abre la puerta de Aduana.' },
  linterna_lista: { nombre: 'Linterna', icono: '🔦', desc: 'Una linterna de la oficina. Se prende sola con la oscuridad.' },
  disco: { nombre: 'Disco de cifrado', icono: '🔠', desc: 'Dos aros de letras. Dice: «Clave +3: cada letra se corrió 3 lugares hacia adelante».' },
  llave_deposito: { nombre: 'Llave del depósito', icono: '🗝️', desc: 'Una llave larga con un cartel: DEPÓSITO.' },
  sello_aduana: { nombre: 'Sello de Aduana', icono: '📮', desc: 'Un sello que dice INSPECCIONADO · ADUANA.' },
  valija_tuya: { nombre: 'Tu valija', icono: '🧳', desc: 'Tu valija azul, con el talón 7314. Por fin.' },
  valija_sellada: { nombre: 'Tu valija sellada', icono: '🧳', desc: 'Tu valija, con el sello de Aduana en la etiqueta.' },
  valija13: { nombre: 'Valija nº 13', icono: '💼', desc: 'Una valija muy vieja con un número: 13. Le falta llegar a destino desde 1971.' },
};
const ESC4_COMBOS = [
  { a: 'sello_aduana', b: 'valija_tuya', da: 'valija_sellada', conserva: ['sello_aduana'], texto: '¡Clac! Sellaste la etiqueta de tu valija: INSPECCIONADO.' },
];

const ESC4_PISTAS = [
  EO.pista('persiana', e => !e.flag('mostrador_abierto'), ['El mostrador de equipajes perdidos tiene la persiana trabada con un código de 4 números. Mirá la pantalla de arribos.', 'El código es el número del último vuelo que arribó (el de la hora más tarde).', 'El último arribo es el LA 2077 (23:50): escribí 2077.']),
  EO.pista('disco', e => !e.tiene('disco') && !e.flag('disco_tomado'), ['Las etiquetas de las valijas extraviadas están en clave. Algo te va a ayudar a leerlas.', 'Fijate en el carrito del final de la cinta.', 'Tomá el disco de cifrado del carrito.']),
  EO.pista('aduana', e => !e.flag('aduana_abierta'), ['La puerta de Aduana necesita un pase.', 'El pase estaba dentro del mostrador de equipajes perdidos.', 'Usá el pase en la puerta de la izquierda.']),
  EO.pista('balanza', e => !e.flag('caja_decomisos_abierta'), ['La caja de decomisos pesa un número exacto de kilos con tres objetos. Hay un cartel.', 'La balanza pide 13 kilos con 3 objetos de los que están sobre la mesa (9, 5, 4, 3 y 1 kg).', 'Libros (9) + termo (3) + llavero (1) = 13.']),
  EO.pista('deposito', e => !e.flag('deposito_abierto'), ['La caja de decomisos tiene la llave de otro lugar.', 'Con la llave larga, abrí la puerta del depósito (a la derecha de la Aduana).', 'Usá la llave del depósito en la puerta de la derecha.']),
  EO.pista('etiquetas', e => !e.tiene('valija_tuya') && !e.flag('valija_tuya_tomada'), ['Tu valija es la que dice tu destino. Mirá tu talón en la mochila.', 'Tu destino es MENDOZA. Cada letra de las etiquetas está corrida 3 lugares: la A se escribe D, la B, E...', 'La etiqueta PHQGRCD es MENDOZA: la valija azul.']),
  EO.pista('sello', e => !e.tiene('sello_aduana') && !e.flag('sello_usado'), ['La Aduana tiene un sello que quizás necesites.', 'Está sobre el escritorio de la Aduana.', 'Juntá el sello y combinalo con tu valija.']),
  EO.pista('valija13', e => !e.flag('valija13_tomada'), ['El legajo del Maletero habla de su valija nº 13. Está en el depósito, en un lugar bajo.', 'Está bajo la escalera del depósito, en la oscuridad.', 'Alumbrá con la linterna debajo de la escalera.']),
  EO.pista('barrera', e => !e.flag('barrera_abierta'), ['En la rampa hay una barrera con un código de 4 números.', 'El código es el número de tu talón.', 'Escribí 7314.']),
  EO.pista('cinta', e => !e.flag('final_listo'), ['En la rampa, la cinta de carga lleva las valijas a la camioneta.', 'Poné tu valija sellada y la valija 13 en la cinta.', 'Seleccioná cada valija y tocá la cinta de carga.']),
];

const ESC4_SALAS = {
  arribos: {
    id: 'arribos', nombre: 'Sala de arribos', ancho: 900, dibujar: esc4DibujarArribos, dinamico: esc4DinamicoArribos,
    oscura: () => false, musica: 'tension', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'parpadeo', 'sfx:viento', 'sombra'],
    alEntrar: async () => {},
    objetos: [
      { id: 'puerta_aduana', nombre: 'Aduana', x: 20, y: 110, w: 64, h: 202, pie: 52,
        toque: async e => { if(e.flag('aduana_abierta')){ await e.ir('aduana', 60, 1); return; } await e.yo('La puerta de Aduana tiene un lector de pases.', 'serio'); },
        usar: { pase: async e => { e.set('aduana_abierta'); e.sfx('puerta'); await e.yo('El lector pitó en verde. La puerta de Aduana se abre.', 'curioso'); await e.ir('aduana', 60, 1); } } },
      EO.leer('pantalla', 'Pantalla de arribos', 110, 40, 200, 100, { nota: 'pantalla', titulo: 'Arribos', html: '<table class="esc-tabla"><tr><th>VUELO</th><th>HORA</th><th>ESTADO</th></tr><tr><td>AR 1432</td><td>21:10</td><td>ARRIBÓ</td></tr><tr><td>AV 118</td><td>22:30</td><td>ARRIBÓ</td></tr><tr><td>LA 2077</td><td>23:50</td><td>ARRIBÓ</td></tr><tr class="esc-rojo"><td>AR 1500</td><td>00:20</td><td>CANCELADO</td></tr></table>' }),
      { id: 'mostrador', nombre: 'Equipajes perdidos', x: 330, y: 130, w: 160, h: 184, pie: 410,
        toque: async e => {
          if(e.flag('mostrador_abierto')){ await e.yo('El mostrador está abierto y vacío.', 'normal'); return; }
          const ok = await e.digitos({ titulo: 'Persiana de Equipajes Perdidos', sub: 'Código de 4 números. Un cartel dice: «Código: último vuelo arribado»', n: 4, clave: '2077' });
          if(!ok) return;
          e.set('mostrador_abierto'); e.sfx('arrastre'); e.sacudir(0.3);
          await e.dar('pase', 'La persiana sube. Adentro hay un pase de personal.');
          await e.dar('linterna_lista', 'Y una linterna con pilas. ¡Justo!');
          await e.bi('Qué suerte. Y qué raro: nadie cierra un mostrador dejando la linterna adentro, ¿no?');
        } },
      { id: 'cinta', nombre: 'Cinta de equipaje', x: 520, y: 236, w: 290, h: 80, pie: 640,
        toque: async e => {
          await e.yo('La cinta da vueltas con una sola valija azul. No es la mía. Cada vez que pasa, el cartel dice «CINTA 3»... aunque esta es la cinta 3.', 'preocupado');
          if(!e.flag('cinta_vista')){ e.set('cinta_vista'); e.asustar('golpe'); await e.bi('Mi mamá decía que no hay que mirar valijas que dan vueltas solas.'); }
        } },
      { id: 'carrito', nombre: 'Carrito', x: 822, y: 168, w: 66, h: 150, pie: 790,
        toque: async e => { if(!e.flag('disco_tomado')){ e.set('disco_tomado'); await e.dar('disco', 'Entre los fierros del carrito hay un disco de cifrado de cartón.'); } else await e.yo('Un carrito de equipaje. Tiene una rueda que gira sola.', 'preocupado'); } },
      EO.mirar('sillas', 'Sillas', 118, 290, 210, 60, 'Sillas de espera. Una tiene un abrigo olvidado. El abrigo respira. Sigo caminando.', 'miedo'),
    ],
  },

  aduana: {
    id: 'aduana', nombre: 'Aduana', ancho: 840, dibujar: esc4DibujarAduana, dinamico: esc4DinamicoAduana,
    oscura: () => true, penumbra: 0.8, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sombra', 'sfx:viento'],
    alEntrar: async (e, primera) => { if(!primera) return; await e.esperar(600); e.sfx('gota'); await e.bi('Mirá el monitor de rayos X: hay alguien adentro de la máquina. Alguien que no es una valija.'); },
    objetos: [
      EO.puerta({ id: 'puerta_arribos', nombre: 'Arribos', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'arribos', xa: 60, dir: 1 }),
      { id: 'balanza', nombre: 'Balanza', x: 96, y: 166, w: 224, h: 150, pie: 206,
        toque: async e => {
          if(e.flag('caja_decomisos_abierta')){ await e.yo('La balanza marca 13.0 kg y ya no se mueve.', 'normal'); return; }
          const ok = await e.secuencia({ titulo: 'Balanza', sub: 'Poné exactamente 13 kg con 3 objetos', sinOrden: true, largo: 3, items: [{ id: 'libros', txt: '📚 9 kg' }, { id: 'zapatos', txt: '👟 5 kg' }, { id: 'ropa', txt: '👕 4 kg' }, { id: 'termo', txt: '🫙 3 kg' }, { id: 'llavero', txt: '🔑 1 kg' }], clave: 'libros,termo,llavero' });
          if(!ok){ await e.yo('La balanza no marca 13.0. Con tres objetos exactos, tiene que dar justo.', 'serio'); return; }
          e.set('caja_decomisos_abierta'); e.sfx('puerta'); await e.dar('llave_deposito', 'La balanza marca 13.0 kg justos y la caja de decomisos se destraba: adentro hay una llave larga que dice DEPÓSITO.');
        } },
      EO.mirar('caja_dec', 'Caja de decomisos', 330, 166, 82, 148, 'Una caja de decomisos. El cartel dice «Tara exacta: 13 kg en 3 objetos». Se abre cuando la balanza marca eso.', 'curioso', { pie: 370 }),
      EO.mirar('rayosx', 'Rayos X', 440, 116, 192, 170, 'En el monitor se ve la silueta de una persona que camina de un lado a otro, adentro de la máquina. Desde ayer no deja de caminar.', 'miedo'),
      EO.tomar('sello', 'Sello de Aduana', 672, 190, 44, 50, 'sello_aduana', 'sello_tomado', 'Sobre el escritorio hay un sello: INSPECCIONADO · ADUANA.', { pie: 700 }),
      { id: 'cajon', nombre: 'Cajón del escritorio', x: 664, y: 246, w: 76, h: 34, pie: 700,
        toque: async e => {
          const t = '<b>LEGAJO — Raúl "El Maletero"</b><br>Año 1971. Accidente en la rampa de carga.<br>Su valija <b>nº 13</b> nunca llegó a destino.<br><i>Quedó en el depósito de extraviados, <b>bajo la escalera</b>.</i>';
          e.nota('legajo', 'Legajo del Maletero', t);
          await e.leer('Legajo', `<p class="esc-manuscrito">${t}</p>`);
        } },
      EO.mirar('cartel_aduana', 'Cartel', 688, 78, 60, 84, 'Un cartel de Aduana: «Declare todo. Revise su valija. Nada de líquidos». Alguien agregó con birome: «Ni de almas».', 'preocupado'),
      EO.puerta({ id: 'puerta_deposito', nombre: 'Depósito', x: 772, y: 110, w: 56, h: 202, pie: 800, a: 'deposito', xa: 60, dir: 1, flag: 'deposito_abierto', llave: 'llave_deposito', bloqueada: 'La puerta del depósito tiene llave.', abrir: 'La llave gira con un crujido. Del otro lado huele a cartón y naftalina.' }),
    ],
  },

  deposito: {
    id: 'deposito', nombre: 'Depósito de extraviados', ancho: 900, dibujar: esc4DibujarDeposito, dinamico: esc4DinamicoDeposito,
    oscura: () => true, penumbra: 0.8, musica: 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sombra', 'campana'],
    alEntrar: async (e, primera) => { if(!primera) return; await e.esperar(600); e.parpadear(1); await e.bi('Cientos de valijas. Una sola es la tuya. Y alguna, juro, respira.'); },
    objetos: [
      EO.puerta({ id: 'puerta_aduana2', nombre: 'Aduana', x: 14, y: 110, w: 56, h: 202, pie: 44, a: 'aduana', xa: 790, dir: -1 }),
      ...ESC4_TAGS.map(v => ({
        id: v.id, nombre: 'Valija ' + v.nombre, x: v.x - 2, y: 160, w: 76, h: 74, pie: v.x + 34,
        toque: async e => {
          const i = await e.elegir('Valija ' + v.nombre, ['Leer la etiqueta', 'Abrirla'], 'Una etiqueta cuelga del asa');
          if(i < 0) return;
          if(i === 0){ const t = `Etiqueta (en clave): <b>${v.cifrado}</b>`; e.nota('etiq_' + v.id, 'Etiqueta valija ' + v.nombre, t); await e.leer('Etiqueta · valija ' + v.nombre, `<p class="esc-manuscrito" style="font-size:22px;letter-spacing:3px;text-align:center">${v.cifrado}</p><p class="esc-chico">Está escrita con el cifrado del disco.</p>`); return; }
          if(v.id === 'v_azul'){
            if(e.flag('valija_tuya_tomada')){ await e.yo('Ya abrí mi valija.', 'normal'); return; }
            e.set('valija_tuya_tomada'); e.cara('alivio', 3); await e.dar('valija_tuya', 'Adentro está tu ropa, tus cosas y... el pasaje de vuelta. ¡Es tu valija!'); return;
          }
          const yaFallo = e.flag('fallo_' + v.id); e.set('fallo_' + v.id);
          const t = { v_roja: 'Se abre sola y adentro hay una cabeza de maniquí que gira despacio hacia vos.', v_verde: 'Adentro hay un abrigo... y el abrigo se mueve. Algo respira ahí abajo.', v_amarilla: 'Adentro hay un oso de peluche. Abre los ojos. Y la boca.', v_gris: 'Un grito agudo sale de la valija, como de un parlante viejo, y se apaga de golpe.' }[v.id];
          await e.asustar('fuerte', { cuenta: !yaFallo }); await e.decir(t + ' Esta no es tu valija.', { quien: 'yo', expr: 'terror' });
        } })),
      EO.mirar('estante_cajas', 'Cajas', 106, 240, 420, 70, 'Cajas con etiquetas de todos los años. La más vieja dice 1971, con la tinta corrida.', 'preocupado'),
      EO.mirar('jaula', 'Jaula', 570, 120, 150, 192, 'Una jaula con valijas sin dueño. Una tiene una tarjeta: «Se retira solo con la tarjeta del Maletero».', 'curioso'),
      { id: 'valija13_f', nombre: 'Algo brilla', x: 760, y: 328, w: 64, h: 44, pie: 794, oculto: true, visible: e => !e.flag('valija13_tomada'),
        toque: async e => { e.set('valija13_tomada'); await e.dar('valija13', 'Bajo la escalera, cubierta de polvo de décadas: una valija vieja con el número 13.'); if(typeof essChirrido === 'function') essChirrido(); await e.bi('Está fría. Y pesa menos de lo que debería. Y no sé por qué eso me da más miedo.'); } },
      EO.mirar('escalera', 'Escalera', 736, 130, 90, 190, 'Una escalera de madera que no lleva a ningún lado. Los escalones crujen cuando no los pisa nadie.', 'miedo', { pie: 740 }),
      EO.puerta({ id: 'puerta_rampa', nombre: 'Rampa', x: 828, y: 100, w: 60, h: 212, pie: 856, a: 'rampa', xa: 60, dir: 1 }),
    ],
  },

  rampa: {
    id: 'rampa', nombre: 'Rampa de carga', ancho: 800, dibujar: esc4DibujarRampa, dinamico: esc4DinamicoRampa,
    oscura: e => !e.flag('final_listo'), penumbra: 0.75, musica: e => e.flag('final_listo') ? 'calma' : 'oscuro', ambiente: ['crujido', 'susurro', 'chirrido', 'pasos', 'sfx:viento', 'campana'],
    alEntrar: async (e, primera) => { if(!primera) return; await e.esperar(600); await e.bi('Afuera. Se ve un micro de Busmac esperando. Es la salida... pero hay una barrera.'); },
    objetos: [
      EO.puerta({ id: 'puerta_deposito2', nombre: 'Depósito', x: 10, y: 110, w: 54, h: 202, pie: 40, a: 'deposito', xa: 856, dir: -1 }),
      { id: 'barrera', nombre: 'Barrera', x: 118, y: 148, w: 90, h: 168, pie: 224,
        toque: async e => {
          if(e.flag('barrera_abierta')){ await e.yo('La barrera está levantada.', 'normal'); return; }
          const ok = await e.digitos({ titulo: 'Barrera de la rampa', sub: 'Código de 4 números. Un cartel dice: «Número del talón del pasajero»', n: 4, clave: '7314' });
          if(!ok) return;
          e.set('barrera_abierta'); e.sfx('arrastre'); await e.yo('La barrera sube con un chirrido. Se puede pasar a la cinta de carga.', 'alivio');
        } },
      { id: 'cinta_carga', nombre: 'Cinta de carga', x: 296, y: 196, w: 240, h: 120, pie: 420,
        toque: async e => {
          if(!e.flag('barrera_abierta')){ await e.yo('La cinta de carga está del otro lado de la barrera.', 'serio'); return; }
          const f = []; if(!e.flag('carga_tuya')) f.push('tu valija sellada'); if(!e.flag('carga_13')) f.push('la valija 13');
          await e.yo('La cinta lleva las valijas hasta la camioneta de traslado. Falta cargar: ' + f.join(' y ') + '.', 'curioso');
        },
        usar: {
          valija_sellada: async e => { if(!e.flag('barrera_abierta')){ await e.yo('Primero hay que pasar la barrera.', 'serio'); return; } e.quitar('valija_sellada'); e.set('carga_tuya'); e.sfx('arrastre'); await e.yo('Puse mi valija en la cinta. Se aleja despacio hacia la camioneta.', 'curioso'); await esc4Chequear(e); },
          valija_tuya: async e => { await e.yo('Mi valija no está sellada por Aduana. En la cinta no entra así.', 'serio'); },
          valija13: async e => { if(!e.flag('barrera_abierta')){ await e.yo('Primero hay que pasar la barrera.', 'serio'); return; } e.quitar('valija13'); e.set('carga_13'); e.sfx('arrastre'); await e.yo('Puse la valija 13 en la cinta. Parece que iba a salir por esa ranura hace cincuenta años.', 'curioso'); await esc4Chequear(e); },
        } },
    ],
  },
};

async function esc4Chequear(e){
  if(!(e.flag('carga_tuya') && e.flag('carga_13'))) return;
  e.set('final_listo');
  e.sacudir(0.6); e.sfx('motor');
  await e.esperar(800);
  e.fantasmaEn('quieto', { x: 470, y: 332, escala: 0.9, alfa: 0, max: 0.9, dir: -1 });
  await e.asustar('fuerte', {}); e.cara('terror', 2.5);
  const v = t => e.decir(t, { quien: 'voz', expr: 'preocupado' });
  await v('Mi valija... la 13. Hace cincuenta años que busco este número.');
  await e.bi('Es... el Maletero. Tranquilo, Bi. Tranquilo. Tiene casco naranja. Esto es un amigo.');
  await v('Nunca pude cargarla. Se me cayó el mundo en esta rampa. Gracias, viajero.');
  e.cara('alivio', 4); e.sfx('campana'); e.flash('#fff6d8', 0.8);
  await v('Tu valija va a salir bien sellada. Y vos también. Mirá, ya sale el sol.');
  e.quitarFantasma();
  await e.esperar(700);
  await e.narrar('La camioneta de traslado de Busmac enciende las luces. La cinta lleva tu valija... y la 13, por fin, a su destino.');
  await e.narrar('Subís con tu valija. Por la ventanilla ves a un hombre de chaleco naranja que levanta una mano en señal de adiós, y se desvanece con el amanecer.');
  await e.bi('¡Escapamos! ¡Con la valija! ¡Y sin perder ni una pata de Bi!');
  if(typeof essFinal === 'function') essFinal();
  await e.esperar(1600);
  await e.fin();
}

ESC_JUEGOS.valija = {
  id: 'valija', titulo: 'La valija perdida', emoji: '🧳', dificultad: 'Difícil', salasTotal: 4, espectro: esc4Espectro,
  resumen: 'Llegás de viaje y tu valija no sale por la cinta. Entrás a buscarla al depósito de extraviados y las puertas se cierran. Alguien arrastra un carrito en la oscuridad.',
  inicio: { sala: 'arribos', x: 140, inv: ['talon'] },
  items: ESC4_ITEMS, combos: ESC4_COMBOS, pistas: ESC4_PISTAS, salas: ESC4_SALAS,
  intro: async e => {
    await e.narrar('Terminal de arribos. 00:40 de la madrugada.');
    await e.narrar('Bajaste del último vuelo hace una hora. Todos recogieron sus valijas. Vos seguís esperando la tuya y la cinta da vueltas con una sola: no es tuya.');
    e.sfx('viento'); e.parpadear(1); e.cara('preocupado', 4);
    await e.yo('Esto es increíble. Sin valija, sin gente, sin nada. Menos mal que conservo el talón: 7314, destino Mendoza.', 'preocupado');
    e.nota('talon', 'Tu talón de equipaje', '<b>TALÓN 7314</b><br>Destino: <b>MENDOZA</b>');
    await e.bi('Soy Bi. Y la cinta dijo «CINTA 3» sola, ¿la oíste? Yo digo que busquemos tu valija... y salgamos.');
  },
};
