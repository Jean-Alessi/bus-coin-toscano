// Piezas compartidas de las "escenas" de juego (ver escenas.css).

function gDialogoHTML(titulo, sub){
  return `<div class="g-dialogo"><div class="g-dialogo-titulo">${titulo}</div>${sub ? `<div class="g-dialogo-sub">${sub}</div>` : ''}</div>`;
}

function gEscenaHTML(tema, contenido, extraClase){
  return `<div class="escena escena-${tema}${extraClase ? ' ' + extraClase : ''}">${contenido}</div>`;
}
// Naipe español: número en dos esquinas y el palo repetido en el centro
// (1 a 7), o una figura provisoria para Sota, Caballo y Rey. 'tam' puede ser
// 'grande' (tu mano), 'media' (la mesa) o 'mini' (rondas ya jugadas).
const NAIPE_FIGURA = { 10: '🛡️', 11: '🐎', 12: '👑' };

function naipeHTML(carta, tam, onclick, seleccionada){
  const clases = `tcarta tcarta-${tam} tcarta-${carta.palo}${onclick ? ' tcarta-jugable' : ''}${seleccionada ? ' tcarta-sel' : ''}`;
  if(carta.comodin){
    const claseComodin = `tcarta tcarta-${tam} tcarta-comodin${onclick ? ' tcarta-jugable' : ''}${seleccionada ? ' tcarta-sel' : ''}`;
    const cuerpoComodin = `<span class="tcarta-comodin-estrella">★</span><span class="tcarta-comodin-texto">Comodín</span>`;
    return onclick
      ? `<button class="${claseComodin}" aria-label="Comodín" onclick="${onclick}">${cuerpoComodin}</button>`
      : `<div class="${claseComodin}" role="img" aria-label="Comodín">${cuerpoComodin}</div>`;
  }
  const etiqueta = `${ESCOBA_NOMBRE_NUMERO[carta.numero] || carta.numero} de ${carta.palo}`;
  let cuerpo;
  if(tam === 'mini'){
    cuerpo = `<span class="tcarta-mini-contenido">${carta.numero}${escobaIconoPalo(carta.palo, 13)}</span>`;
  } else {
    const f = tam === 'grande' ? 1 : 0.76;
    let centro;
    if(carta.numero >= 10){
      centro = `<div class="tcarta-figura"><span class="tcarta-figura-emoji">${NAIPE_FIGURA[carta.numero]}</span>${escobaIconoPalo(carta.palo, Math.round(22 * f))}</div>`;
    } else {
      const base = carta.numero === 1 ? 46 : carta.numero <= 3 ? 24 : carta.numero === 7 ? 15 : carta.numero >= 8 && carta.numero <= 9 ? 12 : 19;
      centro = `<div class="tcarta-pips tcarta-pips-${carta.numero}">${Array.from({ length: carta.numero }).map(() => escobaIconoPalo(carta.palo, Math.round(base * f))).join('')}</div>`;
    }
    cuerpo = `<span class="tcarta-esquina tcarta-esquina-1">${carta.numero}</span>
      <span class="tcarta-esquina tcarta-esquina-2">${carta.numero}</span>
      <div class="tcarta-centro">${centro}</div>`;
  }
  return onclick
    ? `<button class="${clases}" aria-label="${etiqueta}" onclick="${onclick}">${cuerpo}</button>`
    : `<div class="${clases}" role="img" aria-label="${etiqueta}">${cuerpo}</div>`;
}

