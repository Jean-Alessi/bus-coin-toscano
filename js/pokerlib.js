// Evaluador de manos de poker, compartido por el Póker de video y el Texas
// Hold'em. Una carta es { p: 0..3, v: 1..13 } (ver cartasfr.js); el As (v = 1)
// vale 14 salvo en la escalera A-2-3-4-5.
//
// Una mano evaluada es { cat, k }: 'cat' es la categoría (0 carta alta ... 9
// escalera real) y 'k' son los valores de desempate, de mayor a menor.

const POKER_CATEGORIAS = [
  'Carta alta', 'Pareja', 'Doble pareja', 'Trío', 'Escalera', 'Color', 'Full', 'Póker', 'Escalera de color', 'Escalera real',
];

function pokerValorAlto(c){ return c.v === 1 ? 14 : c.v; }

function pokerEvaluar5(cs){
  const vals = cs.map(pokerValorAlto).sort((a, b) => b - a);
  const color = cs.every(c => c.p === cs[0].p);
  let escalera = false, altaEscalera = 0;
  if(new Set(vals).size === 5){
    if(vals[0] - vals[4] === 4){ escalera = true; altaEscalera = vals[0]; }
    else if(vals[0] === 14 && vals[1] === 5 && vals[4] === 2){ escalera = true; altaEscalera = 5; }
  }
  const cuenta = {};
  vals.forEach(v => { cuenta[v] = (cuenta[v] || 0) + 1; });
  const grupos = Object.entries(cuenta).map(([v, n]) => [Number(v), n]).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const sueltas = (excluir) => vals.filter(v => !excluir.includes(v));

  if(escalera && color) return { cat: altaEscalera === 14 ? 9 : 8, k: [altaEscalera] };
  if(grupos[0][1] === 4) return { cat: 7, k: [grupos[0][0], grupos[1][0]] };
  if(grupos[0][1] === 3 && grupos[1][1] === 2) return { cat: 6, k: [grupos[0][0], grupos[1][0]] };
  if(color) return { cat: 5, k: vals };
  if(escalera) return { cat: 4, k: [altaEscalera] };
  if(grupos[0][1] === 3) return { cat: 3, k: [grupos[0][0]].concat(sueltas([grupos[0][0]])) };
  if(grupos[0][1] === 2 && grupos[1][1] === 2) return { cat: 2, k: [grupos[0][0], grupos[1][0]].concat(sueltas([grupos[0][0], grupos[1][0]])) };
  if(grupos[0][1] === 2) return { cat: 1, k: [grupos[0][0]].concat(sueltas([grupos[0][0]])) };
  return { cat: 0, k: vals };
}

// <0 si gana b, >0 si gana a, 0 si empatan.
function pokerComparar(a, b){
  if(a.cat !== b.cat) return a.cat - b.cat;
  const n = Math.max(a.k.length, b.k.length);
  for(let i = 0; i < n; i++){
    const d = (a.k[i] || 0) - (b.k[i] || 0);
    if(d) return d;
  }
  return 0;
}

// La mejor mano de 5 cartas entre 5 a 7 disponibles. Devuelve { cat, k, cartas }.
function pokerMejor(cartas){
  if(cartas.length <= 5){
    const e = pokerEvaluar5(cartas);
    return { cat: e.cat, k: e.k, cartas: cartas.slice() };
  }
  let mejor = null;
  const n = cartas.length;
  const elegir = (desde, actual) => {
    if(actual.length === 5){
      const e = pokerEvaluar5(actual);
      if(!mejor || pokerComparar(e, mejor) > 0) mejor = { cat: e.cat, k: e.k, cartas: actual.slice() };
      return;
    }
    for(let i = desde; i < n; i++){
      if(n - i < 5 - actual.length) break;
      actual.push(cartas[i]);
      elegir(i + 1, actual);
      actual.pop();
    }
  };
  elegir(0, []);
  return mejor;
}

function pokerNombre(mano){
  const c = mano.cat;
  if(c === 1) return 'Pareja de ' + pokerNombreValor(mano.k[0]) + 's';
  if(c === 2) return 'Doble pareja de ' + pokerNombreValor(mano.k[0]) + 's y ' + pokerNombreValor(mano.k[1]) + 's';
  if(c === 3) return 'Trío de ' + pokerNombreValor(mano.k[0]) + 's';
  if(c === 7) return 'Póker de ' + pokerNombreValor(mano.k[0]) + 's';
  if(c === 0) return 'Carta alta: ' + pokerNombreValor(mano.k[0]);
  return POKER_CATEGORIAS[c];
}
function pokerNombreValor(v){ return v === 14 ? 'A' : v === 13 ? 'K' : v === 12 ? 'Q' : v === 11 ? 'J' : String(v); }
