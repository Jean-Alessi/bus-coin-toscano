// Instrumentación mínima de uso: cuántos viajes abren cada juego, cuánto
// tiempo se queda la gente ahí, y cuántas monedas se generan por juego.
// A propósito NO guarda nombre, asiento ni ningún dato personal — solo lo
// necesario para responder "¿qué se juega y cuánto?".
//
// Se guarda fuera de salas/{codigo} (en analytics/eventos, con el código de
// viaje como un campo más) porque "Finalizar viaje" borra todo el árbol
// salas/{codigo}: si esto viviera ahí adentro, se perdería justo lo que
// queremos poder mirar después de que el viaje terminó.

let analyticsVistaActual = null;
let analyticsEntradaTs = 0;

function analyticsJuegosConocidos(){
  return new Set(TARJETAS_SOLO.concat(TARJETAS_GRUPO).map(t => t.view));
}

function analyticsRefEventos(){ return db.ref('analytics/eventos'); }

function analyticsRegistrar(tipo, extra){
  if(!codigoViaje) return;
  analyticsRefEventos().push(Object.assign({ tipo, codigoViaje, ts: Date.now() }, extra || {}));
}

// Se llama desde showView(): si veníamos de un juego, cierra esa sesión: si
// vamos a un juego nuevo, abre una. Cubre los juegos solo y los de grupo con
// un solo enganche, sin tocar cada archivo de juego por separado.
function analyticsAlCambiarVista(nombreNuevo){
  const juegos = analyticsJuegosConocidos();
  if(analyticsVistaActual && juegos.has(analyticsVistaActual) && analyticsVistaActual !== nombreNuevo){
    analyticsRegistrar('juego_cerrado', { juego: analyticsVistaActual, duracionMs: Date.now() - analyticsEntradaTs });
  }
  if(juegos.has(nombreNuevo) && nombreNuevo !== analyticsVistaActual){
    analyticsRegistrar('juego_abierto', { juego: nombreNuevo });
    analyticsEntradaTs = Date.now();
  }
  analyticsVistaActual = nombreNuevo;
}
