// Tope común para los juegos que se arman con una lista de anotados ("grupos chicos"):
// El Impostor, Cadáver Exquisito y Dibujar y Adivinar. Entran hasta JUEGO_GRUPO_MAX (12, igual
// que las salas del mundo). Los juegos de mesa (Truco, Chinchón, Escoba, BusColor, Texas) ya
// tienen su propio tamaño de mesa, y Bingo, Trivia en vivo y Tutti Frutti son para todo el micro.

const JUEGO_GRUPO_MAX = 12;

// Anota a 'yo' en la lista 'ref' ({asiento: nombre}) sin pasar el tope, aunque dos se anoten a la vez
// (transacción). Devuelve una promesa con true si quedó anotado.
function grupoAnotarse(ref, yo, nombre, max){
  const tope = max || JUEGO_GRUPO_MAX;
  return ref.transaction(actual => {
    actual = actual || {};
    if(actual[yo] == null && Object.keys(actual).length >= tope) return; // grupo completo
    actual[yo] = nombre;
    return actual;
  }).then(r => {
    const ok = !!(r && r.committed);
    if(!ok && typeof mostrarToast === 'function') mostrarToast('El grupo ya está completo (' + tope + ' jugadores)');
    return ok;
  });
}

// Botón de "Anotarme" o "Grupo completo" para el lobby de un juego.
function grupoBotonAnotarmeHTML(funcion, cantidad){
  return cantidad >= JUEGO_GRUPO_MAX
    ? '<button class="gbtn gbtn-no gbtn-ancho" disabled>Grupo completo (' + JUEGO_GRUPO_MAX + '/' + JUEGO_GRUPO_MAX + ')</button>'
    : '<button class="gbtn gbtn-ancho" onclick="' + funcion + '()">Anotarme a este grupo (' + cantidad + '/' + JUEGO_GRUPO_MAX + ')</button>';
}
