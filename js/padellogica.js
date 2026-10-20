// Padelbus: reglas y física del partido. Son funciones puras (sin pantalla ni Firebase) para poder probarlas
// en Node. La pantalla y la red están en padelbus.js.
//
// La cancha se ve desde arriba: el equipo 0 juega en la mitad de abajo (y > RED) y el equipo 1 en la de arriba.
// La pelota tiene altura (z): los golpes se calculan para que caiga justo donde se apunta, y después rebota en
// el piso y en las paredes como en el pádel (se puede devolver después de que pegue en la pared).
//
// Reglas (simples):
//  - Se juega al mejor de 'hasta' puntos (5, 7 o 10), sin diferencia de 2.
//  - Después de cada golpe la pelota tiene que picar UNA vez del lado rival; si pica dos veces sin que la
//    devuelvan, el punto es del que pegó. Si pega en la pared antes de picar, cae de su lado, se va por encima
//    de la pared o pega en la red: punto para el otro equipo.
//  - Cada 2 puntos cambia el equipo que saca (y rota el jugador que saca).

const PADEL = {
  W: 240, H: 440, RED: 220,
  G: 620,            // gravedad de la pelota (px/s²)
  RED_ALTO: 26,      // alto de la red
  PARED_ALTO: 150,   // si pasa más alto que esto, se fue afuera
  ALCANCE: 30,       // hasta dónde llega la paleta
  ALTO_GOLPE: 78,    // a qué altura se puede pegar
  VEL: 210,          // velocidad de un jugador (px/s)
  PAUSA_PUNTO: 2.2,  // segundos de pausa después de un punto
  FALLA_BOT: 0.2,    // chance de que el entrenador no llegue a una pelota
  ESPERA_SAQUE: 5,   // segundos hasta que saque solo quien tiene que sacar
};

const padelRnd = (a, b) => a + Math.random() * (b - a);
const padelEntre = (v, a, b) => Math.max(a, Math.min(b, v));

function padelNuevoPartido(equipos, hasta, bots){
  const est = {
    hasta: hasta || 7, equipos, puntos: [0, 0], jug: {}, fase: 'saque', saca: 0, sacador: null,
    bola: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }, ultimo: null, rebotes: 0, ganador: null, espera: 0, msg: '',
    evN: 0, evLista: [], t: 0, pausa: 0, golpes: 0, puntoEq: null,
  };
  equipos.forEach((ids, eq) => ids.forEach(id => {
    est.jug[id] = { id, eq, x: PADEL.W / 2, y: eq === 0 ? PADEL.H - 60 : 60, vx: 0, bot: !!(bots && bots.indexOf(id) >= 0), gHasta: 0, gVisto: 0, golpeT: -9, objX: 0, objY: 0, decide: 0, falloN: -1, falla: false };
  }));
  padelPrepararSaque(est);
  return est;
}

function padelEvento(est, tipo, extra){
  est.evN++; est.evLista.push(tipo); if(est.evLista.length > 4) est.evLista.shift();
  return Object.assign({ t: tipo }, extra || {});
}

// Pone a todos en su lugar y la pelota en la mano de quien saca.
function padelPrepararSaque(est){
  const n = est.puntos[0] + est.puntos[1];
  est.saca = Math.floor(n / 2) % 2;
  const sacan = est.equipos[est.saca];
  est.sacador = sacan[Math.floor(n / 4) % sacan.length];
  est.equipos.forEach((ids, eq) => {
    const atras = eq === 0 ? PADEL.H - 50 : 50, red = eq === 0 ? PADEL.RED + 75 : PADEL.RED - 75;
    let ordenado = ids.slice();
    if(eq === est.saca) ordenado = [est.sacador].concat(ids.filter(i => i !== est.sacador));
    else if(ids.length === 2 && n % 2) ordenado = [ids[1], ids[0]];
    ordenado.forEach((id, i) => {
      const j = est.jug[id];
      if(ordenado.length === 1){ j.x = PADEL.W / 2; j.y = atras; }
      else if(i === 0){ j.x = (n + eq) % 2 ? PADEL.W * 0.72 : PADEL.W * 0.28; j.y = atras; }
      else { j.x = (n + eq) % 2 ? PADEL.W * 0.28 : PADEL.W * 0.72; j.y = red; }
      j.vx = 0; j.objX = j.x; j.objY = j.y; j.gHasta = 0;
    });
  });
  const s = est.jug[est.sacador];
  est.bola = { x: s.x, y: s.y, z: 34, vx: 0, vy: 0, vz: 0 };
  est.fase = 'saque'; est.ultimo = null; est.rebotes = 0; est.espera = 0; est.pausa = 0; est.msg = ''; est.puntoEq = null;
}

// Lanza la pelota desde donde está para que caiga en (tx, ty) dentro de T segundos.
function padelLanzar(b, tx, ty, T){
  b.vx = (tx - b.x) / T; b.vy = (ty - b.y) / T;
  b.vz = (PADEL.G * T * T / 2 - b.z) / T;
}

function padelSacar(est, id){
  if(est.fase !== 'saque' || id !== est.sacador) return [];
  const j = est.jug[id], b = est.bola, eq = j.eq;
  const tx = padelEntre(j.x < PADEL.W / 2 ? PADEL.W * padelRnd(0.6, 0.85) : PADEL.W * padelRnd(0.15, 0.4), 16, PADEL.W - 16);
  const prof = padelRnd(0.36, 0.6), mitad = PADEL.H / 2 - 12;
  const ty = eq === 0 ? PADEL.RED - prof * mitad : PADEL.RED + prof * mitad;
  padelLanzar(b, tx, ty, 1.05);
  est.fase = 'juego'; est.ultimo = eq; est.rebotes = 0; j.golpeT = est.t; est.golpes++;
  return [padelEvento(est, 'saque', { eq })];
}

// Un golpe: según qué tan cerca de la paleta pegó la pelota y hacia dónde se movía el jugador, sale más cruzado,
// más corto o más afuera. Con el botón de globo la pelota sube alto y cae al fondo; si la pelota viene alta, es remate.
function padelGolpear(est, j, globo, apuntar){
  const b = est.bola, eq = j.eq;
  const borde = Math.min(1, Math.hypot(b.x - j.x, b.y - j.y) / PADEL.ALCANCE);
  const lejos = Math.max(0, borde - 0.7) / 0.3;
  const remate = !globo && b.z >= 48;
  let tx = b.x + (b.x - j.x) * 3 + (j.vx || 0) * 0.35 + padelRnd(-1, 1) * (8 + 60 * lejos);
  let prof, T;
  if(globo){ prof = padelRnd(0.88, 0.96); T = padelRnd(1.45, 1.65); }
  else if(remate){ prof = padelRnd(0.62, 0.88); T = padelRnd(0.5, 0.6); }
  else { prof = padelRnd(0.5, 0.8); T = padelRnd(0.85, 1.0); }
  prof *= 1 - 0.35 * lejos;
  if(apuntar){ if(typeof apuntar.x === 'number') tx = apuntar.x; if(typeof apuntar.prof === 'number') prof = apuntar.prof; }
  tx = padelEntre(tx, 14, PADEL.W - 14);
  const mitad = PADEL.H / 2 - 12;
  const ty = eq === 0 ? PADEL.RED - prof * mitad : PADEL.RED + prof * mitad;
  padelLanzar(b, tx, ty, T);
  est.ultimo = eq; est.rebotes = 0; j.golpeT = est.t; est.golpes++;
  return padelEvento(est, remate ? 'remate' : (globo ? 'globo' : 'golpe'), { eq, x: b.x, y: b.y });
}

// Física de la pelota sola (sin reglas): la usan también los celulares invitados para mover la pelota entre
// mensajes del anfitrión. 'cb' avisa lo que pasó: 'piso', 'pared', 'red', 'fuera'.
function padelFisica(b, dt, cb){
  const yAntes = b.y;
  b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= PADEL.G * dt;
  if((yAntes - PADEL.RED) * (b.y - PADEL.RED) < 0 && cb) cb('red');
  if(b.z <= 0 && b.vz < 0){
    b.z = 0; b.vz = -b.vz * 0.72; b.vx *= 0.88; b.vy *= 0.88;
    if(b.vz < 30) b.vz = 0;
    if(cb) cb('piso');
  }
  if(b.z <= 0 && b.vz === 0){ b.vx *= 1 - Math.min(1, 2.2 * dt); b.vy *= 1 - Math.min(1, 2.2 * dt); }
  [['x', PADEL.W], ['y', PADEL.H]].forEach(([e, lim]) => {
    if(b[e] < 0 || b[e] > lim){
      if(b.z > PADEL.PARED_ALTO){ if(cb) cb('fuera'); return; }
      b[e] = b[e] < 0 ? 0 : lim; b['v' + e] = -b['v' + e] * 0.78;
      if(cb) cb('pared');
    }
  });
}

function padelPunto(est, eq, motivo, evs){
  est.puntos[eq]++; est.puntoEq = eq; est.msg = motivo; est.fase = 'punto'; est.pausa = PADEL.PAUSA_PUNTO;
  evs.push(padelEvento(est, 'punto', { eq, motivo }));
  if(est.puntos[eq] >= est.hasta){ est.fase = 'fin'; est.ganador = eq; evs.push(padelEvento(est, 'fin', { eq })); }
}

// Mueve un jugador hacia (x, y) a velocidad 'vel', sin salirse de su mitad de la cancha.
function padelMoverJugador(est, j, x, y, vel, dt){
  const dx = x - j.x, dy = y - j.y, d = Math.hypot(dx, dy);
  const paso = Math.min(d, vel * dt);
  const vx = d > 0.001 ? dx / d * paso : 0, vy = d > 0.001 ? dy / d * paso : 0;
  j.x = padelEntre(j.x + vx, 14, PADEL.W - 14);
  j.y = j.eq === 0 ? padelEntre(j.y + vy, PADEL.RED + 14, PADEL.H - 14) : padelEntre(j.y + vy, 14, PADEL.RED - 14);
  j.vx = dt > 0 ? vx / dt : 0;
}

// El entrenador: va hacia la pelota cuando le toca, vuelve a su posición cuando no, y pega con algo de error.
function padelMoverBot(est, j, dt){
  const b = est.bola, ritmo = 0.62;
  j.decide -= dt;
  const mios = est.equipos[j.eq].map(id => est.jug[id]);
  const lado = j.eq === 0 ? b.y > PADEL.RED - 20 : b.y < PADEL.RED + 20;
  const meToca = est.fase === 'juego' && est.ultimo !== j.eq && lado;
  const masCerca = mios.reduce((m, o) => Math.hypot(o.x - b.x, o.y - b.y) < Math.hypot(m.x - b.x, m.y - b.y) ? o : m, mios[0]);
  if(meToca && masCerca === j){
    if(j.decide <= 0){
      j.decide = 0.16;
      j.objX = padelEntre(b.x + b.vx * 0.22 + padelRnd(-14, 14), 14, PADEL.W - 14);
      j.objY = padelEntre(b.y + b.vy * 0.22 + padelRnd(-10, 10), 0, PADEL.H);
    }
    padelMoverJugador(est, j, j.objX, j.objY, PADEL.VEL * ritmo, dt);
  } else {
    const base = est.equipos[j.eq].length === 1 ? { x: PADEL.W / 2, y: j.eq === 0 ? PADEL.H - 90 : 90 } : { x: j === mios[0] ? PADEL.W * 0.3 : PADEL.W * 0.7, y: j.eq === 0 ? PADEL.RED + (j === mios[0] ? 130 : 80) : PADEL.RED - (j === mios[0] ? 130 : 80) };
    padelMoverJugador(est, j, base.x, base.y, PADEL.VEL * 0.45, dt);
  }
}

// Un paso del partido (lo corre el anfitrión). 'entradas' = {id: {x, y, vx, g}} de los jugadores de carne y hueso
// (g es un contador: cada vez que sube, el jugador pidió globo). Devuelve la lista de cosas que pasaron.
function padelPaso(est, dt, entradas){
  const evs = [];
  est.t += dt;
  Object.keys(est.jug).forEach(id => {
    const j = est.jug[id];
    if(j.bot){ padelMoverBot(est, j, dt); return; }
    const e = entradas && entradas[id];
    if(!e) return;
    j.x = padelEntre(Number(e.x) || j.x, 14, PADEL.W - 14);
    const y = Number(e.y) || j.y;
    j.y = j.eq === 0 ? padelEntre(y, PADEL.RED + 14, PADEL.H - 14) : padelEntre(y, 14, PADEL.RED - 14);
    j.vx = Number(e.vx) || 0;
    if(typeof e.g === 'number' && e.g !== j.gVisto){ j.gVisto = e.g; j.gHasta = est.t + 1.4; }
  });

  if(est.fase === 'saque'){
    const s = est.jug[est.sacador];
    est.bola.x = s.x; est.bola.y = s.y; est.bola.z = 34 + Math.sin(est.t * 6) * 3; est.bola.vx = est.bola.vy = est.bola.vz = 0;
    est.espera += dt;
    if(s.bot ? est.espera > 1.2 : est.espera > PADEL.ESPERA_SAQUE) padelSacar(est, est.sacador).forEach(x => evs.push(x));
    return evs;
  }

  if(est.fase === 'punto'){
    padelFisica(est.bola, dt, null);
    est.pausa -= dt;
    if(est.pausa <= 0) padelPrepararSaque(est);
    return evs;
  }
  if(est.fase !== 'juego') return evs;

  const b = est.bola;
  padelFisica(b, dt, (que) => {
    if(est.fase !== 'juego') return;
    const rival = 1 - est.ultimo;
    if(que === 'piso'){
      est.rebotes++;
      evs.push(padelEvento(est, 'piso'));
      if(est.rebotes === 1){
        const ladoRival = est.ultimo === 0 ? b.y < PADEL.RED : b.y > PADEL.RED;
        if(!ladoRival) padelPunto(est, rival, '¡Cayó de su lado!', evs);
      } else if(est.rebotes >= 2){ padelPunto(est, est.ultimo, '¡Dos piques!', evs); }
    } else if(que === 'pared'){
      evs.push(padelEvento(est, 'pared'));
      if(est.rebotes === 0) padelPunto(est, rival, '¡Pegó en la pared antes de picar!', evs);
    } else if(que === 'red'){
      if(est.rebotes === 0 && b.z < PADEL.RED_ALTO){ evs.push(padelEvento(est, 'red')); padelPunto(est, rival, '¡Se quedó en la red!', evs); }
      else if(est.rebotes >= 1){ padelPunto(est, est.ultimo, '¡No la devolvieron a tiempo!', evs); }
    } else if(que === 'fuera'){
      padelPunto(est, rival, '¡Se fue afuera!', evs);
    }
  });
  if(est.fase !== 'juego') return evs;

  // ¿Alguien le pega? El que está más cerca, de los que pueden (el equipo que pegó último no).
  let mejor = null, mejorD = 1e9;
  Object.keys(est.jug).forEach(id => {
    const j = est.jug[id];
    if(j.eq === est.ultimo || est.t - j.golpeT < 0.2) return;
    if(j.bot){ if(j.falloN !== est.golpes){ j.falloN = est.golpes; j.falla = Math.random() < PADEL.FALLA_BOT; } if(j.falla) return; }
    if(j.eq === 0 ? b.y < PADEL.RED : b.y > PADEL.RED) return;
    if(b.z > PADEL.ALTO_GOLPE) return;
    const d = Math.hypot(b.x - j.x, b.y - j.y);
    if(d <= PADEL.ALCANCE && d < mejorD){ mejor = j; mejorD = d; }
  });
  if(mejor){
    const globo = mejor.bot ? Math.random() < 0.12 : est.t < mejor.gHasta;
    let apuntar = null;
    if(mejor.bot){
      const rivales = est.equipos[1 - mejor.eq].map(id => est.jug[id]);
      const rx = rivales.reduce((s, r) => s + r.x, 0) / rivales.length;
      apuntar = { x: rx < PADEL.W / 2 ? PADEL.W * padelRnd(0.6, 0.88) : PADEL.W * padelRnd(0.12, 0.4) };
    }
    mejor.gHasta = 0;
    evs.push(padelGolpear(est, mejor, globo, apuntar));
  }
  return evs;
}

// ---- Para mandar el estado por la red (el anfitrión arma esto, los invitados lo aplican) ----

function padelCompactar(est){
  const r = n => Math.round(n * 10) / 10;
  const j = {};
  Object.keys(est.jug).forEach(id => { j[id] = [r(est.jug[id].x), r(est.jug[id].y), r(est.jug[id].vx || 0), est.jug[id].golpeT > est.t - 0.25 ? 1 : 0]; });
  return {
    p: est.puntos.slice(), f: est.fase, s: est.saca, sd: est.sacador, u: est.ultimo === null ? -1 : est.ultimo, r: est.rebotes, g: est.ganador === null ? -1 : est.ganador, m: est.msg, pe: est.puntoEq === null ? -1 : est.puntoEq,
    b: [r(est.bola.x), r(est.bola.y), r(est.bola.z), r(est.bola.vx), r(est.bola.vy), r(est.bola.vz)], j, e: est.evN, el: est.evLista.slice(), h: est.hasta,
  };
}

// Aplica lo que mandó el anfitrión. 'suave' acerca los jugadores en vez de teletransportarlos.
function padelAplicar(est, snap, yo){
  if(!snap || !snap.b) return;
  est.puntos = snap.p.slice(); est.fase = snap.f; est.saca = snap.s; est.sacador = snap.sd; est.ultimo = snap.u < 0 ? null : snap.u;
  est.rebotes = snap.r; est.puntoEq = snap.pe < 0 ? null : snap.pe; est.ganador = snap.g < 0 ? null : snap.g; est.msg = snap.m || ''; est.hasta = snap.h || est.hasta;
  const b = est.bola, s = snap.b;
  const error = Math.hypot(b.x - s[0], b.y - s[1]);
  const k = error < 25 && est.fase === 'juego' ? 0.45 : 1;
  b.x += (s[0] - b.x) * k; b.y += (s[1] - b.y) * k; b.z += (s[2] - b.z) * k;
  b.vx = s[3]; b.vy = s[4]; b.vz = s[5];
  Object.keys(snap.j || {}).forEach(id => {
    const j = est.jug[id], d = snap.j[id];
    if(!j) return;
    if(d[3]) j.golpeT = est.t;
    if(id === yo) return;
    j.objX = d[0]; j.objY = d[1]; j.vx = d[2];
  });
}
