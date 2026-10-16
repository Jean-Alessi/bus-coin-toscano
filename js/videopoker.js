// Póker de video (Jotas o mejor): te reparten 5 cartas, elegís cuáles guardar,
// cambiás el resto y cobrás según la mano que quede.
//
// Es solo diversión: las fichas son del juego (arrancan en 100 cada vez que se
// abre la app), no tienen valor y NO suman monedas ni ranking de premios.

const VP_TABLA = [
  [9, 'Escalera real'], [8, 'Escalera de color'], [7, 'Póker'], [6, 'Full'], [5, 'Color'],
  [4, 'Escalera'], [3, 'Trío'], [2, 'Doble pareja'], [1, 'Jotas o mejor'],
];
const VP_MULT = { 9: 250, 8: 50, 7: 25, 6: 9, 5: 6, 4: 4, 3: 3, 2: 2, 1: 1 };

let vp = { fichas: 100, apuesta: 5, estado: 'inicio', mazo: [], mano: [], retenidas: [false, false, false, false, false], resultado: null, cw: 50 };

function vpPago(evaluada, apuesta){
  const cat = evaluada.cat;
  if(cat === 0) return 0;
  if(cat === 1 && evaluada.k[0] < 11) return 0; // parejas menores a J no pagan
  if(cat === 9 && apuesta === 5) return 800;
  return VP_MULT[cat] * apuesta;
}

function iniciarVideoPoker(){
  vp.estado = 'inicio';
  vp.mano = []; vp.resultado = null;
  vp.retenidas = [false, false, false, false, false];
  if(vp.apuesta > vp.fichas) vp.apuesta = Math.max(1, Math.min(5, vp.fichas));
  vpRender();
}

function vpApuesta(d){
  if(vp.estado === 'mantener') return;
  vp.apuesta = Math.max(1, Math.min(5, vp.apuesta + d, vp.fichas || 1));
  vpRender();
}

function vpRepartir(){
  if(vp.estado === 'mantener' || vp.fichas < vp.apuesta) return;
  vp.fichas -= vp.apuesta;
  vp.mazo = frBarajar(frMazo());
  vp.mano = vp.mazo.splice(0, 5);
  vp.retenidas = [false, false, false, false, false];
  vp.estado = 'mantener';
  vp.resultado = null;
  reproducirTono('tick');
  vpRender();
}

function vpTocarCarta(i){
  if(vp.estado !== 'mantener') return;
  vp.retenidas[i] = !vp.retenidas[i];
  reproducirTono('tick');
  vpRender();
}

function vpCambiar(){
  if(vp.estado !== 'mantener') return;
  for(let i = 0; i < 5; i++) if(!vp.retenidas[i]) vp.mano[i] = vp.mazo.shift();
  const evaluada = pokerEvaluar5(vp.mano);
  const pago = vpPago(evaluada, vp.apuesta);
  vp.fichas += pago;
  vp.estado = 'fin';
  vp.retenidas = [false, false, false, false, false];
  vp.resultado = { evaluada, pago };
  reproducirTono(pago >= vp.apuesta * 6 ? 'bonus' : pago > 0 ? 'correcto' : 'incorrecto');
  if(vp.apuesta > vp.fichas) vp.apuesta = Math.max(1, Math.min(5, vp.fichas));
  vpRender();
}

function vpReiniciar(){
  vp.fichas = 100; vp.apuesta = 5;
  iniciarVideoPoker();
}

function vpRender(){
  const cont = document.getElementById('videopoker-content');
  if(!cont) return;
  document.getElementById('view-videopoker').classList.remove('juego-inmersivo');
  document.getElementById('videopoker-sub').textContent = `${vp.fichas} fichas`;

  const ganadora = vp.resultado && vp.resultado.pago > 0 ? vp.resultado.evaluada.cat : -1;
  const tabla = VP_TABLA.map(([cat, nombre]) => {
    const pago = vpPago({ cat, k: [14] }, vp.apuesta);
    return `<div class="vp-fila${ganadora === cat ? ' vp-gana' : ''}"><span>${nombre}</span><span>${pago}</span></div>`;
  }).join('');

  const estiloCarta = `--cw:${vp.cw}px;`;
  const cartas = [0, 1, 2, 3, 4].map(i => {
    const carta = vp.mano[i];
    const retenida = vp.retenidas[i] && vp.estado === 'mantener';
    const cuerpo = !carta
      ? frDorsoHTML({ estilo: estiloCarta })
      : frCartaHTML(carta, { sel: retenida, estilo: estiloCarta, onclick: vp.estado === 'mantener' ? `vpTocarCarta(${i})` : '' });
    return `<div class="vp-celda"><div class="vp-mantener">${retenida ? 'GUARDAR' : '&nbsp;'}</div>${cuerpo}</div>`;
  }).join('');

  let mensaje;
  if(vp.fichas <= 0 && vp.estado !== 'mantener') mensaje = 'Te quedaste sin fichas. Podés empezar de nuevo con 100.';
  else if(vp.estado === 'inicio') mensaje = 'Elegí la apuesta y tocá Repartir.';
  else if(vp.estado === 'mantener') mensaje = 'Tocá las cartas que querés guardar y después Cambiar.';
  else mensaje = vp.resultado.pago > 0
    ? `¡${pokerNombre(vp.resultado.evaluada)}! Ganaste ${vp.resultado.pago} fichas`
    : `${pokerNombre(vp.resultado.evaluada)}: no paga`;

  const sinFichas = vp.fichas <= 0 && vp.estado !== 'mantener';
  const principal = sinFichas
    ? `<button class="gbtn gbtn-ancho" onclick="vpReiniciar()">Empezar de nuevo</button>`
    : vp.estado === 'mantener'
      ? `<button class="gbtn gbtn-ancho" onclick="vpCambiar()">Cambiar</button>`
      : `<button class="gbtn gbtn-ancho" onclick="vpRepartir()">Repartir</button>`;

  cont.innerHTML = gEscenaHTML('casino', `
    <div class="g-hud"><span class="g-pill"><img class="vp-ficha" src="logo-empresa.png" alt=""> ${vp.fichas}</span><span class="g-pill">Apuesta ${vp.apuesta}</span></div>
    <div class="vp-tabla">${tabla}</div>
    <div class="vp-cartas" style="--cw:${vp.cw}px">${cartas}</div>
    <p class="vp-mensaje ${vp.resultado && vp.resultado.pago > 0 ? 'vp-mensaje-gana' : ''}">${mensaje}</p>
    <div class="vp-controles">
      <button class="gbtn gbtn-chico-texto" onclick="vpApuesta(-1)" ${vp.estado === 'mantener' ? 'disabled' : ''}>−</button>
      ${principal}
      <button class="gbtn gbtn-chico-texto" onclick="vpApuesta(1)" ${vp.estado === 'mantener' ? 'disabled' : ''}>+</button>
    </div>
    <p class="vp-aviso">Solo diversión: las fichas no tienen valor y no suman monedas ni ranking.</p>`, 'vp-escena');

  // Ajusta el ancho de las cartas a 5 por fila
  const fila = cont.querySelector('.vp-cartas');
  if(fila && fila.clientWidth > 0){
    const nuevo = Math.max(40, Math.min(66, Math.floor((fila.clientWidth - 4 * 6) / 5)));
    if(nuevo !== vp.cw){ vp.cw = nuevo; vpRender(); }
  }
}
