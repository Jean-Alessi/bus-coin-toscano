// Reglas del Texas Hold'em sin límite (no-limit), como funciones puras que
// reciben el estado de una mesa y devuelven el nuevo estado. Las usa texas.js
// (que se ocupa de Firebase y de la pantalla) y se prueban por separado.
//
// Estado de una mesa (los mapas van por asiento, como texto):
//   jugadores [a...], fichas {a:n}, mano n, dealer a, ciega (la grande),
//   enMano [a...] (los que recibieron cartas), cartas {a:[c,c]}, comunes [c...],
//   mazo [c...], ronda 'preflop'|'flop'|'turn'|'river'|'fin',
//   aportado {a:n} (total puesto en la mano), apostado {a:n} (en esta ronda),
//   apuestaActual n, ultimaSubida n, plegados {a:true},
//   porActuar [a...] (a los que les falta hablar), turno a, resultado {...}
//
// Las fichas son solo del juego: no son monedas y no suman ranking.

const TEXAS_FICHAS_INICIO = 1000;

function texasCiega(numeroMano){
  return 20 * Math.pow(2, Math.min(6, Math.floor((numeroMano - 1) / 5)));
}

const texasClonar = o => JSON.parse(JSON.stringify(o));

// Firebase puede devolver un mapa con claves numéricas como un arreglo: se normaliza.
function texasMapa(x){
  const o = {};
  if(Array.isArray(x)) x.forEach((v, i) => { if(v != null) o[String(i)] = v; });
  else if(x) Object.keys(x).forEach(k => { o[k] = x[k]; });
  return o;
}

function texasNormalizar(mesa){
  const m = texasClonar(mesa);
  ['fichas', 'cartas', 'aportado', 'apostado', 'plegados', 'nombres'].forEach(k => { m[k] = texasMapa(m[k]); });
  m.comunes = m.comunes || [];
  m.mazo = m.mazo || [];
  m.jugadores = (m.jugadores || []).map(String);
  m.enMano = (m.enMano || []).map(String);
  m.porActuar = (m.porActuar || []).map(String);
  Object.keys(m.cartas).forEach(a => { m.cartas[a] = m.cartas[a] || []; });
  return m;
}

// Lista de asientos de 'lista' empezando justo después de 'desde' (sin incluirlo).
function texasDespuesDe(lista, desde){
  const i = lista.indexOf(String(desde));
  if(i < 0) return lista.slice();
  return lista.slice(i + 1).concat(lista.slice(0, i));
}

function texasVivos(m){ return m.jugadores.filter(a => (m.fichas[a] || 0) > 0); }
function texasNoPlegados(m){ return m.enMano.filter(a => !m.plegados[a]); }

function texasPoner(m, a, cuanto){
  const pone = Math.max(0, Math.min(cuanto, m.fichas[a] || 0));
  m.fichas[a] -= pone;
  m.aportado[a] = (m.aportado[a] || 0) + pone;
  m.apostado[a] = (m.apostado[a] || 0) + pone;
  return pone;
}

// Arranca una mano nueva: mueve el botón, reparte y pone las ciegas.
function texasRepartir(estado){
  const m = texasNormalizar(estado);
  const vivos = texasVivos(m);
  if(vivos.length < 2){
    m.fase = 'terminado';
    m.ganadorFinal = vivos[0] || null;
    m.ronda = 'fin';
    return m;
  }
  const orden = m.dealer ? texasDespuesDe(m.jugadores, m.dealer) : m.jugadores.slice();
  m.dealer = orden.find(a => vivos.includes(a)) || vivos[0];
  m.mano = (m.mano || 0) + 1;
  m.ciega = texasCiega(m.mano);
  m.enMano = m.jugadores.filter(a => vivos.includes(a));
  m.ronda = 'preflop';
  m.comunes = [];
  m.aportado = {}; m.apostado = {}; m.plegados = {};
  m.resultado = null;
  m.fase = 'jugando';

  const mazo = frBarajar(frMazo());
  const despues = texasDespuesDe(m.enMano, m.dealer);
  const headsUp = m.enMano.length === 2;
  const sb = headsUp ? m.dealer : despues[0];
  const bb = headsUp ? despues[0] : despues[1];
  m.cartas = {};
  m.enMano.forEach(a => { m.cartas[a] = []; });
  for(let i = 0; i < 2; i++) m.enMano.forEach(a => { m.cartas[a].push(mazo.pop()); });
  m.mazo = mazo;

  texasPoner(m, sb, m.ciega / 2);
  texasPoner(m, bb, m.ciega);
  m.apuestaActual = Math.max(m.apostado[sb] || 0, m.apostado[bb] || 0);
  m.ultimaSubida = m.ciega;
  // Orden de palabra: en la mesa de 2 habla primero el botón; si no, el que sigue a la ciega grande.
  const ordenPalabra = headsUp ? [sb, bb] : texasDespuesDe(m.enMano, bb).concat([bb]);
  m.porActuar = ordenPalabra.filter(a => (m.fichas[a] || 0) > 0);
  return texasAvanzar(m);
}

function texasMinimoSubir(m){
  return m.apuestaActual + Math.max(m.ultimaSubida || 0, m.ciega);
}

// Qué puede hacer el jugador 'a' ahora: lo necesita la pantalla para mostrar los botones.
function texasOpciones(m, a){
  const aportadoRonda = m.apostado[a] || 0;
  const aPagar = Math.max(0, m.apuestaActual - aportadoRonda);
  const fichas = m.fichas[a] || 0;
  const tope = aportadoRonda + fichas; // lo máximo que puede llegar a tener apostado en la ronda
  return {
    aPagar: Math.min(aPagar, fichas),
    puedePasar: aPagar === 0,
    puedeSubir: tope > m.apuestaActual,
    minimo: Math.min(texasMinimoSubir(m), tope),
    maximo: tope,
    todoAdentro: fichas <= aPagar,
  };
}

// Aplica la acción de un jugador y devuelve el estado nuevo, o null si no era válida.
//   tipo: 'plegar' | 'igualar' (pasar si no hay nada que pagar) | 'subir' (monto = apuesta total de la ronda)
function texasAccion(estado, a, tipo, monto){
  const m = texasNormalizar(estado);
  a = String(a);
  if(m.ronda === 'fin' || m.fase !== 'jugando' || String(m.turno) !== a || !m.porActuar.includes(a)) return null;
  const op = texasOpciones(m, a);

  if(tipo === 'plegar'){
    m.plegados[a] = true;
    m.porActuar = m.porActuar.filter(x => x !== a);
  } else if(tipo === 'igualar'){
    texasPoner(m, a, op.aPagar);
    m.porActuar = m.porActuar.filter(x => x !== a);
  } else if(tipo === 'subir'){
    if(!op.puedeSubir) return null;
    const objetivo = Math.floor(Number(monto));
    if(!(objetivo > m.apuestaActual)) return null;
    if(objetivo > op.maximo) return null;
    const esTodoAdentro = objetivo === op.maximo;
    if(objetivo < op.minimo && !esTodoAdentro) return null;
    texasPoner(m, a, objetivo - (m.apostado[a] || 0));
    const subioCompleto = objetivo - m.apuestaActual >= Math.max(m.ultimaSubida || 0, m.ciega);
    if(subioCompleto) m.ultimaSubida = objetivo - m.apuestaActual;
    m.apuestaActual = objetivo;
    // Una subida le da la palabra de nuevo a todos los demás que puedan seguir.
    m.porActuar = texasDespuesDe(m.enMano, a).filter(x => !m.plegados[x] && (m.fichas[x] || 0) > 0);
  } else return null;
  return texasAvanzar(m);
}

function texasSiguienteCalle(m){
  if(m.ronda === 'preflop'){ m.comunes = m.comunes.concat([m.mazo.pop(), m.mazo.pop(), m.mazo.pop()]); m.ronda = 'flop'; }
  else if(m.ronda === 'flop'){ m.comunes = m.comunes.concat([m.mazo.pop()]); m.ronda = 'turn'; }
  else if(m.ronda === 'turn'){ m.comunes = m.comunes.concat([m.mazo.pop()]); m.ronda = 'river'; }
}

// Después de cada acción: decide si sigue el turno, pasa de calle o termina la mano.
function texasAvanzar(m){
  const quedan = texasNoPlegados(m);
  if(quedan.length === 1) return texasTerminarSinMostrar(m, quedan[0]);

  // Se salta a los que ya no pueden actuar (sin fichas).
  m.porActuar = m.porActuar.filter(a => !m.plegados[a] && (m.fichas[a] || 0) > 0);
  if(m.porActuar.length){
    // Si el único que falta hablar ya igualó todo y los demás están all-in, no hay nada que decidir.
    if(m.porActuar.length === 1){
      const solo = m.porActuar[0];
      const otrosConFichas = quedan.filter(a => a !== solo && (m.fichas[a] || 0) > 0);
      if(!otrosConFichas.length && (m.apostado[solo] || 0) >= m.apuestaActual) m.porActuar = [];
    }
  }
  if(m.porActuar.length){ m.turno = m.porActuar[0]; return m; }

  // Terminó la ronda de apuestas.
  const conFichas = quedan.filter(a => (m.fichas[a] || 0) > 0);
  if(m.ronda === 'river') return texasMostrar(m);
  if(conFichas.length <= 1){
    // Ya nadie puede apostar (todos all-in): se juegan las calles que faltan.
    while(m.ronda !== 'river') texasSiguienteCalle(m);
    return texasMostrar(m);
  }

  texasSiguienteCalle(m);
  m.apostado = {}; m.apuestaActual = 0; m.ultimaSubida = m.ciega;
  // En cada calle habla primero el que está después del botón y el botón habla último (texasDespuesDe no incluye al botón, por eso se lo suma al final).
  m.porActuar = texasDespuesDe(m.enMano, m.dealer).concat([m.dealer]).filter(a => !m.plegados[a] && (m.fichas[a] || 0) > 0);
  if(m.porActuar.length <= 1){
    // Con una sola persona con fichas no hay apuesta posible: se juegan todas las calles.
    while(m.ronda !== 'river') texasSiguienteCalle(m);
    return texasMostrar(m);
  }
  m.turno = m.porActuar[0];
  return m;
}

function texasTerminarSinMostrar(m, ganador){
  const total = Object.keys(m.aportado).reduce((s, a) => s + m.aportado[a], 0);
  m.fichas[ganador] = (m.fichas[ganador] || 0) + total;
  m.ronda = 'fin';
  m.turno = null; m.porActuar = [];
  m.resultado = { tipo: 'plegaron', total, ganadores: [{ asiento: ganador, monto: total }], reveladas: {}, nombresManos: {} };
  return texasRevisarFin(m);
}

function texasMostrar(m){
  const quedan = texasNoPlegados(m);
  const mejores = {};
  quedan.forEach(a => { mejores[a] = pokerMejor(m.cartas[a].concat(m.comunes)); });

  // Botes principal y secundarios según lo aportado por cada uno.
  const niveles = [...new Set(Object.keys(m.aportado).map(a => m.aportado[a]).filter(x => x > 0))].sort((x, y) => x - y);
  const ganado = {};
  let previo = 0, total = 0;
  const ordenDesempate = texasDespuesDe(m.enMano, m.dealer);
  niveles.forEach(nivel => {
    const capa = Object.keys(m.aportado).reduce((s, a) => s + Math.max(0, Math.min(m.aportado[a], nivel) - previo), 0);
    previo = nivel;
    if(capa <= 0) return;
    total += capa;
    let elegibles = quedan.filter(a => (m.aportado[a] || 0) >= nivel);
    if(!elegibles.length) elegibles = quedan;
    let mejor = null, ganadores = [];
    elegibles.forEach(a => {
      const c = mejor ? pokerComparar(mejores[a], mejor) : 1;
      if(c > 0){ mejor = mejores[a]; ganadores = [a]; }
      else if(c === 0) ganadores.push(a);
    });
    ganadores.sort((x, y) => ordenDesempate.indexOf(x) - ordenDesempate.indexOf(y));
    const parte = Math.floor(capa / ganadores.length);
    let resto = capa - parte * ganadores.length;
    ganadores.forEach(a => { ganado[a] = (ganado[a] || 0) + parte + (resto > 0 ? 1 : 0); if(resto > 0) resto--; });
  });
  Object.keys(ganado).forEach(a => { m.fichas[a] = (m.fichas[a] || 0) + ganado[a]; });

  const reveladas = {}, nombresManos = {};
  quedan.forEach(a => { reveladas[a] = m.cartas[a]; nombresManos[a] = pokerNombre(mejores[a]); });
  m.ronda = 'fin';
  m.turno = null; m.porActuar = [];
  m.resultado = {
    tipo: 'showdown', total,
    ganadores: Object.keys(ganado).map(a => ({ asiento: a, monto: ganado[a] })),
    reveladas, nombresManos,
    mejoresCartas: Object.keys(mejores).reduce((o, a) => { o[a] = mejores[a].cartas; return o; }, {}),
  };
  return texasRevisarFin(m);
}

// Si queda un solo jugador con fichas, termina la partida.
function texasRevisarFin(m){
  const vivos = texasVivos(m);
  if(vivos.length < 2){ m.fase = 'terminado'; m.ganadorFinal = vivos[0] || null; }
  return m;
}
