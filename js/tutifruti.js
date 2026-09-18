// Tutti Frutti / Basta: se juega contra el resto de los pasajeros del mismo
// código de viaje, reusando el patrón de sala compartida por Firebase que ya
// usa Bingo. Los pasajeros se anotan en una lista (como en Bingo), y es el
// organizador quien decide cuándo cerrar la anotación y arrancar el sorteo.
// Cualquiera que esté jugando (no solo el organizador) puede cortar la ronda
// tocando "¡BASTA!" apenas termine — como en el juego real, donde gana
// también el que es más rápido. El organizador puede terminar el juego en
// cualquier momento. El organizador no juega, solo administra.

const TUTI_CATEGORIAS = ['Nombre', 'Animal', 'Color', 'Comida', 'País', 'Cosa'];
// Se excluyen solo las letras realmente difíciles en español (Ñ, W, X).
const TUTI_LETRAS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','Y','Z'];
const TUTI_DURACION_SEG = 75;
const TUTI_PUNTOS_UNICA = 10;
const TUTI_PUNTOS_REPETIDA = 5;
const TUTI_SORTEO_INTERVALO_MS = 90;

// Listas cerradas para las categorías donde tiene sentido validar de verdad
// (un país es un país, un color es un color, la comida cotidiana es más o
// menos acotada). "Nombre" y "Cosa" quedan sin lista porque son categorías
// realmente abiertas — prácticamente cualquier sustantivo es una "cosa"
// válida, y no hay forma de listar todos los nombres de persona posibles.
//
// Ninguna lista va a estar completa nunca (siempre va a faltar algún animal
// o comida real) — por eso el organizador puede corregir a mano cualquier
// palabra en la pantalla de resultados, igual que se haría en la mesa real
// discutiendo entre todos si una respuesta vale o no.
const TUTI_LISTA_PAISES = ['afganistan','albania','alemania','andorra','angola','arabia saudita','argelia','argentina','armenia','australia','austria','azerbaiyan','bahamas','bangladés','barbados','bahrein','belgica','belice','benin','bielorrusia','birmania','bolivia','bosnia','botsuana','brasil','brunei','bulgaria','burkina faso','burundi','butan','cabo verde','camboya','camerun','canada','catar','chad','chile','china','chipre','colombia','comoras','corea del norte','corea del sur','costa de marfil','costa rica','croacia','cuba','dinamarca','dominica','ecuador','egipto','el salvador','emiratos arabes unidos','eritrea','eslovaquia','eslovenia','espana','estados unidos','estonia','etiopia','filipinas','finlandia','fiyi','francia','gabon','gambia','georgia','ghana','granada','grecia','guatemala','guyana','guinea','guinea ecuatorial','guinea-bisau','haiti','honduras','hungria','india','indonesia','irak','iran','irlanda','islandia','israel','italia','jamaica','japon','jordania','kazajistan','kenia','kirguistan','kiribati','kuwait','laos','lesoto','letonia','libano','liberia','libia','liechtenstein','lituania','luxemburgo','madagascar','malasia','malaui','maldivas','mali','malta','marruecos','mauricio','mauritania','mexico','micronesia','moldavia','monaco','mongolia','montenegro','mozambique','namibia','nauru','nepal','nicaragua','niger','nigeria','noruega','nueva zelanda','oman','paises bajos','pakistan','palaos','panama','papua nueva guinea','paraguay','peru','polonia','portugal','reino unido','republica centroafricana','republica checa','republica dominicana','ruanda','rumania','rusia','samoa','san marino','senegal','serbia','seychelles','sierra leona','singapur','siria','somalia','sri lanka','sudafrica','sudan','sudan del sur','suecia','suiza','surinam','tailandia','tanzania','tayikistan','timor oriental','togo','tonga','trinidad y tobago','tunez','turkmenistan','turquia','tuvalu','ucrania','uganda','uruguay','uzbekistan','vanuatu','vaticano','venezuela','vietnam','yemen','yibuti','zambia','zimbabue'];

const TUTI_LISTA_COLORES = ['rojo','azul','verde','amarillo','naranja','violeta','morado','rosa','rosado','negro','blanco','gris','marron','celeste','turquesa','dorado','plateado','beige','bordo','magenta','lila','purpura','ocre','caqui','aguamarina','coral','cian','indigo','ambar','cobre','bronce','crema','salmon','fucsia'];

const TUTI_LISTA_ANIMALES = ['perro','gato','leon','tigre','elefante','jirafa','cebra','oso','lobo','zorro','conejo','ardilla','ballena','delfin','tiburon','aguila','condor','loro','tucan','serpiente','vibora','cascabel','cocodrilo','tortuga','rana','sapo','arana','tarantula','escorpion','hormiga','abeja','mariposa','mosca','mosquito','caballo','vaca','toro','cerdo','chancho','oveja','cabra','gallina','gallo','pato','ganso','pavo','burro','mono','gorila','koala','canguro','pinguino','foca','morsa','rinoceronte','hipopotamo','jaguar','puma','guepardo','hiena','camello','llama','alpaca','vicuna','yaguarete','murcielago','erizo','topo','raton','rata','hamster','cobaya','periquito','iguana','camaleon','lagartija','lagarto','salamandra','buho','lechuza','halcon','buitre','cuervo','gaviota','cisne','flamenco','pelicano','colibri','pinzon','canario','jilguero','avestruz','emu','faisan','codorniz','perdiz','urraca','golondrina','guacamayo','cacatua','ornitorrinco','oruga','escarabajo','cucaracha','grillo','saltamontes','libelula','luciernaga','medusa','pulpo','calamar','cangrejo','langosta','camaron','almeja','mejillon','ostra','orca','narval','raya','atun','salmon','trucha','bagre','pirana','anguila','caracol','babosa','gusano','lombriz','huron','comadreja','nutria','castor','marmota','puercoespin','armadillo','perezoso','zarigueya','mapache','tejon','gacela','antilope','bufalo','bisonte','alce','reno','ciervo','venado','jabali','chita','leopardo','pantera','lince','ocelote','dromedario','avispa','termita','piojo','pulga','garrapata','dinosaurio','tiranosaurio','velociraptor','pterodactilo','triceratops','diplodocus'];

const TUTI_LISTA_COMIDAS = ['manzana','banana','platano','naranja','mandarina','limon','pomelo','uva','sandia','melon','durazno','damasco','ciruela','pera','kiwi','ananá','pina','frutilla','frambuesa','arandano','cereza','higo','mango','papaya','coco','palta','aguacate','tomate','lechuga','papa','patata','batata','zanahoria','cebolla','ajo','pimiento','morron','berenjena','zapallo','calabaza','zapallito','choclo','maiz','arveja','poroto','lenteja','garbanzo','espinaca','acelga','brocoli','coliflor','apio','pepino','rabanito','remolacha','arroz','fideos','pasta','pan','pizza','empanada','milanesa','asado','bife','carne','pollo','pescado','cerdo','chorizo','morcilla','jamon','salame','queso','huevo','manteca','mayonesa','ketchup','mostaza','sal','azucar','miel','mermelada','chocolate','torta','budin','alfajor','galleta','helado','flan','gelatina','yogur','leche','cafe','te','mate','agua','jugo','gaseosa','vino','cerveza','sidra','fernet','pochoclo','hamburguesa','sandwich','tarta','tallarines','ravioles','noquis','locro','humita','tamal','sopa','guiso','puchero','ensalada','vinagre','aceite','harina','avena','cereal','nueces','almendras','mani','castanas','pasas'];

function tutiListaDeCategoria(categoria){
  if(categoria === 'País') return TUTI_LISTA_PAISES;
  if(categoria === 'Color') return TUTI_LISTA_COLORES;
  if(categoria === 'Animal') return TUTI_LISTA_ANIMALES;
  if(categoria === 'Comida') return TUTI_LISTA_COMIDAS;
  return null;
}

// Para categorías con lista cerrada, la palabra tiene que parecerse a algo
// de la lista (tolera tildes/errores de tipeo con la misma lógica que
// Pensamiento Lateral). Para "Nombre" y "Cosa" no hay lista posible, así que
// se acepta cualquier palabra que pase el resto de los chequeos.
function tutiPerteneceACategoria(categoria, norm){
  const lista = tutiListaDeCategoria(categoria);
  if(!lista) return true;
  return lista.some(item => palabrasCercanas(norm, tutiNormalizar(item)));
}

// Filtro barato para un error de tipeo muy común: escribir la letra de la
// ronda como recordatorio y seguir de largo sin borrarla (ej. "AAdriana" en
// vez de "Adriana"). Se excluye "ll" porque es un dígrafo real del español
// (llama, lluvia, llave...), no un error.
function tutiEsTipeoDobleLetra(norm){
  if(norm.length < 2 || norm[0] !== norm[1]) return false;
  return norm.slice(0, 2) !== 'll';
}

let tuti = null;
let tutiAnotados = {}; // { asiento: nombre } de quienes se anotaron para jugar
let tutiRespuestas = {}; // respuestas de TODOS los pasajeros de la ronda actual, por asiento
let tutiMisRespuestas = {}; // borrador local (para no perder lo tipeado si el estado se actualiza)
let tutiOverrides = {}; // { asiento: { categoria: true/false } } — corrección manual del organizador
let tutiTimerId = null;
let tutiUltimoTotalPremiado = {}; // { ronda: monedas ya entregadas } — para sumar solo la diferencia si el organizador corrige después
let tutiSorteoTimerId = null;
let tutiLetraSorteo = null; // letra que se ve "pasando" en el cartel, mientras el organizador no para el sorteo

function tutiEstadoVacio(){
  return { fase: 'lobby', letra: null, categorias: [], inicio: null, duracionSeg: TUTI_DURACION_SEG, ronda: 0, usadas: [], cortadoPor: null };
}

// Letras que todavía no salieron en este juego. Si ya salieron todas, se
// vuelve a barajar el mazo completo en vez de trabarse sin letras.
function tutiLetrasDisponibles(){
  const usadas = (tuti && tuti.usadas) || [];
  const disponibles = TUTI_LETRAS.filter(l => !usadas.includes(l));
  return disponibles.length ? disponibles : TUTI_LETRAS.slice();
}

function tutiRefEstado(){ return db.ref(`salas/${codigoViaje}/tutifruti/estado`); }
function tutiRefAnotados(){ return db.ref(`salas/${codigoViaje}/tutifruti/anotados`); }
function tutiRefRespuestas(){ return db.ref(`salas/${codigoViaje}/tutifruti/rondas/${tuti ? tuti.ronda : 0}/respuestas`); }
function tutiRefOverrides(){ return db.ref(`salas/${codigoViaje}/tutifruti/rondas/${tuti ? tuti.ronda : 0}/overrides`); }

// Sin tildes/mayúsculas, para comparar palabras de forma justa aunque las
// escriban distinto (con o sin acento).
function tutiNormalizar(txt){
  return (txt || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

let tutiListenersListos = false;

function iniciarTutifruti(){
  if(!tutiListenersListos){
    tutiListenersListos = true;
    tutiRefEstado().on('value', snap => {
      const anterior = tuti;
      tuti = Object.assign(tutiEstadoVacio(), snap.val() || {});
      if(anterior && anterior.ronda !== tuti.ronda){
        tutiMisRespuestas = {};
        tutiRespuestas = {};
        tutiOverrides = {};
      }
      if(tuti.fase === 'jugando'){
        tutiEscucharRespuestas();
        tutiEscucharOverrides();
      }
      tutiTickTimer();
      renderTutifruti();
    });
    tutiRefAnotados().on('value', snap => {
      tutiAnotados = snap.val() || {};
      // La lista de anotados solo se ve en el lobby. Si alguien se anota
      // mientras otro está jugando o el organizador está sorteando, no hay
      // que redibujar toda la pantalla — eso les cerraba el teclado a los
      // que estaban escribiendo y le hacía perder el toque al organizador
      // cuando quería parar el cartel.
      if(tuti && tuti.fase === 'lobby') renderTutifruti();
    });
  } else {
    renderTutifruti();
  }
}

function tutiEscucharRespuestas(){
  tutiRefRespuestas().on('value', snap => {
    tutiRespuestas = snap.val() || {};
    if(tuti && tuti.fase === 'resultados') renderTutifruti();
  });
}

// El organizador puede corregir a mano cualquier palabra en resultados
// (ninguna lista de animales/comidas/países va a estar completa nunca).
// Todos escuchan este cambio para que el puntaje se actualice en cada
// celular al instante.
function tutiEscucharOverrides(){
  tutiRefOverrides().on('value', snap => {
    tutiOverrides = snap.val() || {};
    if(tuti && tuti.fase === 'resultados') renderTutifruti();
  });
}

// Cambia a mano si una palabra puntual cuenta como válida o no. Solo el
// organizador puede hacerlo, viendo lo mismo que ve todo el mundo en
// pantalla — como cuando en la mesa real el grupo discute si algo vale.
function tutiAlternarValidez(asiento, categoria, valeAhora){
  if(!bingoEsOrganizador()) return;
  tutiRefOverrides().child(String(asiento)).child(categoria).set(!valeAhora);
}

function tutiAnotarme(){
  if(!miAsiento) return;
  tutiRefAnotados().child(String(miAsiento)).set(miNombre);
}

// El organizador puede sacar a alguien de la lista antes de arrancar, igual
// que en Bingo.
function tutiSacarAnotado(asiento){
  if(!bingoEsOrganizador()) return;
  tutiRefAnotados().child(String(asiento)).remove();
}

// El organizador manda a sortear: pasa a la fase "sorteando" (los pasajeros
// ven que se está por elegir letra) y en SU pantalla arranca el cartel con
// las letras pasando rápido, listo para que las pare cuando quiera.
function tutiIniciarSorteo(){
  if(!bingoEsOrganizador()) return;
  if(!tuti || (tuti.fase !== 'lobby' && tuti.fase !== 'resultados')) return;
  tutiRefEstado().child('fase').set('sorteando');
}

// Arranca (o retoma, si el organizador salió y volvió a entrar) la animación
// local del cartel. Es solo visual: no se sincroniza entre celulares, cada
// organizador ve su propio cartel pasando hasta que lo para.
//
// Importante: NO redibuja toda la pantalla en cada letra (eso hacía que el
// botón "¡Parar acá!" se recreara todo el tiempo y a veces el toque no
// llegara a registrarse). Solo actualiza el texto de la letra a mano.
function tutiAsegurarSorteoAnimado(){
  if(tutiSorteoTimerId) return;
  const disponibles = tutiLetrasDisponibles();
  tutiLetraSorteo = disponibles[Math.floor(Math.random() * disponibles.length)];
  tutiSorteoTimerId = setInterval(() => {
    const vistaActiva = document.querySelector('.view.active');
    if(!vistaActiva || vistaActiva.id !== 'view-tutifruti' || !tuti || tuti.fase !== 'sorteando'){
      clearInterval(tutiSorteoTimerId);
      tutiSorteoTimerId = null;
      return;
    }
    const disp = tutiLetrasDisponibles();
    tutiLetraSorteo = disp[Math.floor(Math.random() * disp.length)];
    const letraEl = document.getElementById('tuti-sorteo-letra');
    if(letraEl) letraEl.textContent = tutiLetraSorteo;
    else renderTutifruti();
  }, TUTI_SORTEO_INTERVALO_MS);
}

// El organizador para el cartel: la letra que haya quedado a la vista es la
// que arranca la ronda para todos, y queda marcada como usada para que no
// vuelva a salir hasta que se termine el mazo de letras.
function tutiPararSorteo(){
  if(!bingoEsOrganizador()) return;
  if(!tuti || tuti.fase !== 'sorteando') return;
  clearInterval(tutiSorteoTimerId);
  tutiSorteoTimerId = null;
  const disponibles = tutiLetrasDisponibles();
  const letra = (tutiLetraSorteo && disponibles.includes(tutiLetraSorteo)) ? tutiLetraSorteo : disponibles[Math.floor(Math.random() * disponibles.length)];
  // Si tutiLetrasDisponibles() tuvo que rebarajar el mazo completo, arranca
  // la lista de usadas de cero; si no, sigue sumando a la que ya había.
  const usadasPrevias = disponibles.length === TUTI_LETRAS.length ? [] : (tuti.usadas || []);
  const nuevaRonda = (tuti.ronda || 0) + 1;
  db.ref(`salas/${codigoViaje}/tutifruti/estado`).set({
    fase: 'jugando',
    letra,
    categorias: TUTI_CATEGORIAS,
    inicio: Date.now(),
    duracionSeg: TUTI_DURACION_SEG,
    ronda: nuevaRonda,
    usadas: [...usadasPrevias, letra],
  });
}

// No deja seguir cargando respuestas si la ronda ya no está en curso (por
// ejemplo, alguien tocó "¡Basta!" un instante antes) — evita que a alguien
// se le siga contando lo que complete después de cortada la ronda.
function tutiActualizarRespuesta(categoria, valor){
  if(!tuti || tuti.fase !== 'jugando') return;
  tutiMisRespuestas[categoria] = valor;
  if(!miAsiento) return;
  tutiRefRespuestas().child(String(miAsiento)).set({ nombre: miNombre, palabras: tutiMisRespuestas });
  const botonBasta = document.getElementById('tuti-basta-btn');
  if(botonBasta) botonBasta.disabled = !tutiPasajeroCompletoTodo();
}

// Para poder gritar "¡Basta!" hay que haber completado las 6 categorías —
// igual que en el juego real, donde solo se corta cuando alguien terminó de
// verdad. Así nadie corta la ronda a los pocos segundos sin darle chance al
// resto. El organizador no juega, así que a él esto no le aplica.
function tutiPasajeroCompletoTodo(){
  return (tuti.categorias || []).every(cat => (tutiMisRespuestas[cat] || '').trim().length > 0);
}

// Cualquiera que esté jugando puede gritar "¡Basta!" apenas termine — como
// en el juego real, corta la ronda para todos al instante. El organizador
// también puede, por si nadie termina o hay que avanzar igual. Se guarda
// quién la cortó, para mostrarlo en resultados (no siempre es el que más
// puntaje sacó — cortar rápido no siempre significa contestar mejor).
function tutiBasta(){
  if(!miAsiento) return;
  if(!tuti || tuti.fase !== 'jugando') return;
  if(!bingoEsOrganizador() && !tutiPasajeroCompletoTodo()){
    mostrarToast('Completá las 6 categorías antes de tocar "¡Basta!"');
    return;
  }
  tutiCerrarRonda({ asiento: miAsiento, nombre: miNombre });
}

function tutiCerrarRonda(cortadoPor){
  tutiRefEstado().update({ fase: 'resultados', cortadoPor: cortadoPor || null });
}

// El organizador puede terminar el juego en cualquier momento: se borra todo
// (anotados, ronda actual e historial) y vuelve a quedar un lobby vacío.
function tutiTerminarJuego(){
  if(!bingoEsOrganizador()) return;
  db.ref(`salas/${codigoViaje}/tutifruti`).remove();
}

function tutiTiempoRestante(){
  if(!tuti || !tuti.inicio) return tuti ? tuti.duracionSeg : TUTI_DURACION_SEG;
  const transcurrido = Math.floor((Date.now() - tuti.inicio) / 1000);
  return Math.max(0, tuti.duracionSeg - transcurrido);
}

function tutiTickTimer(){
  clearInterval(tutiTimerId);
  if(!tuti || tuti.fase !== 'jugando') return;
  tutiTimerId = setInterval(() => {
    const vistaActiva = document.querySelector('.view.active');
    if(!vistaActiva || vistaActiva.id !== 'view-tutifruti'){
      clearInterval(tutiTimerId);
      return;
    }
    const restante = tutiTiempoRestante();
    if(restante <= 0){
      clearInterval(tutiTimerId);
      // Cualquier celular conectado puede cerrar la ronda al llegar a cero
      // (no solo el organizador), para que no quede colgada si su celular
      // está en otra pantalla justo en ese momento.
      if(miAsiento) tutiCerrarRonda();
      return;
    }
    if(restante <= 5) reproducirTono('tick');
    // No redibuja toda la pantalla: eso destruía y recreaba los inputs de
    // categorías cada segundo, y en el celular se sentía como que "no
    // dejaba escribir" (el teclado se cerraba solo a mitad de tipear).
    // Solo actualiza el número del cronómetro a mano.
    const timerEl = document.getElementById('tuti-timer');
    if(timerEl){
      timerEl.textContent = restante;
      timerEl.classList.toggle('valija-timer-urgente', restante <= 5);
    } else {
      renderTutifruti();
    }
  }, 1000);
}

// Palabra válida: no vacía, arranca con la letra de la ronda, no es un
// típico error de tipeo de letra duplicada, y si la categoría tiene lista
// cerrada (País, Color, Animal) tiene que parecerse a algo de esa lista —
// así "AAdriana" en Animal ya no vale. Entre las válidas de una misma
// categoría, si nadie más escribió lo mismo suma el puntaje completo; si se
// repite con otro pasajero, suma la mitad. Devuelve tanto el total por
// asiento como el detalle por palabra (para mostrar cuánto sacó cada una y
// con cuántos coincidió).
function tutiCalcularPuntajes(){
  const letra = tutiNormalizar(tuti.letra);
  const asientos = Object.keys(tutiRespuestas);
  const puntos = {};
  const detalle = {};
  asientos.forEach(a => { puntos[a] = 0; detalle[a] = {}; });

  (tuti.categorias || []).forEach(categoria => {
    const porAsiento = asientos.map(a => {
      const palabra = (tutiRespuestas[a].palabras || {})[categoria] || '';
      const norm = tutiNormalizar(palabra);
      const validaAuto = norm.length > 0
        && norm.startsWith(letra)
        && !tutiEsTipeoDobleLetra(norm)
        && tutiPerteneceACategoria(categoria, norm);
      // Ninguna lista es perfecta: el organizador puede haber corregido
      // esta palabra puntual a mano, y eso pisa el resultado automático.
      const forzado = tutiOverrides[a] && tutiOverrides[a][categoria];
      const valida = typeof forzado === 'boolean' ? forzado : validaAuto;
      return { asiento: a, palabra, norm, valida, corregida: typeof forzado === 'boolean' };
    });
    porAsiento.forEach(entrada => {
      const coincidencias = entrada.valida
        ? porAsiento.filter(otra => otra.valida && otra.norm === entrada.norm).length
        : 0;
      const pts = entrada.valida ? (coincidencias > 1 ? TUTI_PUNTOS_REPETIDA : TUTI_PUNTOS_UNICA) : 0;
      puntos[entrada.asiento] += pts;
      detalle[entrada.asiento][categoria] = { puntos: pts, coincidencias, corregida: entrada.corregida };
    });
  });
  return { puntos, detalle };
}

// Suma solo la diferencia contra lo que ya se le dio en esta ronda, para
// que si el organizador corrige una palabra después (y el puntaje sube),
// la moneda de más se sume igual. Si el puntaje baja por una corrección, no
// se le quita nada de lo que ya vio sumado — la economía de monedas de la
// app nunca resta, solo premia.
function tutiSumarMisMonedasSiCorresponde(puntos){
  if(!miAsiento) return;
  const total = puntos[String(miAsiento)] || 0;
  const yaSumado = tutiUltimoTotalPremiado[tuti.ronda] || 0;
  if(total > yaSumado){
    ganarMonedas(total - yaSumado);
  }
  tutiUltimoTotalPremiado[tuti.ronda] = Math.max(total, yaSumado);
}

function tutiOrdenAsientos(mapa){
  return Object.keys(mapa).sort((a, b) => Number(a) - Number(b));
}

function renderTutifruti(){
  const cont = document.getElementById('tutifruti-content');
  if(!cont || !tuti) return;
  document.getElementById('tutifruti-sub').textContent =
    tuti.fase === 'lobby' ? 'Contra el resto del viaje' :
    tuti.fase === 'sorteando' ? 'Sorteando la letra...' :
    tuti.fase === 'jugando' ? `Letra ${tuti.letra}` : 'Resultados de la ronda';

  if(bingoEsOrganizador()){
    renderTutifrutiOrganizador(cont);
    return;
  }
  renderTutifrutiPasajero(cont);
}

function tutiUsadasHTML(){
  const usadas = (tuti && tuti.usadas) || [];
  if(!usadas.length) return '';
  return `<p class="tienda-nota">Letras que ya salieron: ${usadas.join(', ')}</p>`;
}

// Quién cortó la ronda no siempre es quien más puntaje termina sacando —
// cortar rápido no significa contestar mejor. Se muestra aparte para que
// quede claro quién la gritó, aunque el orden de la lista sea por puntaje.
function tutiCortadoPorHTML(){
  const cortadoPor = tuti && tuti.cortadoPor;
  if(!cortadoPor) return '<p>Se acabó el tiempo — nadie llegó a tocar "¡Basta!".</p>';
  const quien = String(cortadoPor.asiento) === String(miAsiento) ? 'Vos' : cortadoPor.nombre;
  return `<p>¡Basta! lo cortó <strong>${quien}</strong>.</p>`;
}

function tutiListaAnotadosHTML(conBotonSacar){
  const asientos = tutiOrdenAsientos(tutiAnotados);
  if(!asientos.length) return '<p style="color:var(--gray);font-size:13px;">Todavía no se anotó nadie.</p>';
  return `<div class="bingo-roster">${asientos.map(a => `
    <div class="bingo-roster-item">
      <span>Asiento ${a} — ${tutiAnotados[a]}</span>
      ${conBotonSacar ? `<span class="bingo-roster-derecha"><button class="btn-eliminar-pasajero" onclick="tutiSacarAnotado('${a}')" title="Sacar de la lista">✕</button></span>` : ''}
    </div>`).join('')}</div>`;
}

function renderTutifrutiOrganizador(cont){
  if(tuti.fase === 'lobby'){
    const asientos = Object.keys(tutiAnotados);
    cont.innerHTML = `
      <div class="section-label">Panel del organizador</div>
      <div class="hero" style="margin-top:8px;">
        <h2>🔤 Tutti Frutti</h2>
        <p>Categorías: ${TUTI_CATEGORIAS.join(', ')}. Los pasajeros se anotan acá abajo; arrancá cuando estén todos.</p>
      </div>
      ${tutiListaAnotadosHTML(true)}
      <button class="btn-primary" onclick="tutiIniciarSorteo()" ${asientos.length ? '' : 'disabled'}>Cerrar anotación y sortear letra</button>`;
    return;
  }

  if(tuti.fase === 'sorteando'){
    tutiAsegurarSorteoAnimado();
    cont.innerHTML = `
      <div class="section-label">Panel del organizador</div>
      <p class="tienda-nota">Mirá el cartel y pará cuando quieras — esa letra es la de la ronda.</p>
      <div class="tuti-sorteo">
        <div class="tuti-sorteo-letra" id="tuti-sorteo-letra">${tutiLetraSorteo || '?'}</div>
        <button class="btn-primary" onclick="tutiPararSorteo()">¡Parar acá!</button>
      </div>
      ${tutiUsadasHTML()}`;
    return;
  }

  if(tuti.fase === 'jugando'){
    const restante = tutiTiempoRestante();
    const urgente = restante <= 5;
    cont.innerHTML = `
      <div class="section-label">Panel del organizador</div>
      <div class="valija-topbar">
        <div class="valija-topbar-info">
          <span class="valija-topbar-emoji">🔤</span>
          <span class="valija-topbar-destino">Con la letra ${tuti.letra}</span>
        </div>
        <div class="valija-timer ${urgente ? 'valija-timer-urgente' : ''}" id="tuti-timer">${restante}</div>
      </div>
      <p class="tienda-nota">Los pasajeros están completando sus categorías. Cortá cuando quieras.</p>
      <button class="btn-primary tuti-basta" onclick="tutiBasta()">¡BASTA!</button>
      <p class="link-chico" onclick="tutiTerminarJuego()">Terminar el juego</p>`;
    return;
  }

  // fase === 'resultados'
  const { puntos, detalle } = tutiCalcularPuntajes();
  const asientos = Object.keys(tutiRespuestas).sort((a,b) => (puntos[b]||0) - (puntos[a]||0));
  cont.innerHTML = `
    <div class="section-label">Panel del organizador</div>
    <div class="hero" style="margin-top:8px;">
      <h2>Letra ${tuti.letra}</h2>
      <p>Categorías: ${(tuti.categorias || []).join(', ')}</p>
      ${tutiCortadoPorHTML()}
    </div>
    <div class="tuti-resultados">${tutiFilasResultadosHTML(asientos, puntos, detalle)}</div>
    <button class="btn-primary" onclick="tutiIniciarSorteo()">Sortear letra para otra ronda</button>
    ${tutiUsadasHTML()}
    <p class="link-chico" onclick="tutiTerminarJuego()">Terminar el juego</p>`;
}

// El pasajero puede anotarse en cualquier momento, esté la fase que esté —
// antes solo se podía anotar en el lobby, y si abría Tutti Frutti mientras
// ya había una ronda en curso o en resultados, se quedaba sin ninguna forma
// de sumarse para la próxima.
function tutiAnotarseHTML(anotado, mensajeSiYaAnotado){
  if(anotado) return mensajeSiYaAnotado ? `<p class="tienda-nota">${mensajeSiYaAnotado}</p>` : '';
  return `<button class="btn-primary" onclick="tutiAnotarme()">Anotarme para jugar</button>`;
}

function renderTutifrutiPasajero(cont){
  const anotado = !!(miAsiento && tutiAnotados[String(miAsiento)] != null);

  if(tuti.fase === 'lobby'){
    cont.innerHTML = `
      ${bingoPinHTML()}
      <div class="hero" style="margin-top:8px;">
        <h2>🔤 Tutti Frutti</h2>
        <p>Categorías: ${TUTI_CATEGORIAS.join(', ')}. Sale una letra al azar y competís contra el resto de los pasajeros de este viaje: si a alguien más se le ocurre la misma palabra, vale menos.</p>
      </div>
      ${tutiAnotarseHTML(anotado, 'Ya estás anotado. Esperá a que el organizador arranque la ronda.')}
      ${tutiListaAnotadosHTML(false)}`;
    return;
  }

  if(tuti.fase === 'sorteando'){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>🎲 Sorteando la letra...</h2>
        <p>El organizador está eligiendo con qué letra arranca esta ronda.</p>
      </div>
      ${tutiAnotarseHTML(anotado, 'Ya estás anotado.')}
      ${tutiUsadasHTML()}`;
    return;
  }

  if(tuti.fase === 'jugando'){
    const restante = tutiTiempoRestante();
    const urgente = restante <= 5;
    const categoriasHTML = (tuti.categorias || []).map(cat => {
      const valor = tutiMisRespuestas[cat] || '';
      return `
        <div class="tuti-categoria">
          <label>${cat}</label>
          <input type="text" value="${valor.replace(/"/g,'&quot;')}" placeholder="${tuti.letra}..." oninput="tutiActualizarRespuesta('${cat}', this.value)">
        </div>`;
    }).join('');
    cont.innerHTML = `
      <div class="valija-topbar">
        <div class="valija-topbar-info">
          <span class="valija-topbar-emoji">🔤</span>
          <span class="valija-topbar-destino">Con la letra ${tuti.letra}</span>
        </div>
        <div class="valija-timer ${urgente ? 'valija-timer-urgente' : ''}" id="tuti-timer">${restante}</div>
      </div>
      <div class="tuti-categorias">${categoriasHTML}</div>
      <button class="btn-primary tuti-basta" id="tuti-basta-btn" onclick="tutiBasta()" ${tutiPasajeroCompletoTodo() ? '' : 'disabled'}>¡BASTA!</button>
      <p class="tienda-nota">Completá las 6 categorías para poder tocar "¡Basta!" — corta la ronda para todos, así ganás por rapidez.</p>
      ${anotado ? '' : `<p class="tienda-nota">Podés jugar esta ronda igual, pero anotate para que el organizador sepa que seguís en las próximas.</p>${tutiAnotarseHTML(anotado)}`}`;
    return;
  }

  // fase === 'resultados'
  const { puntos, detalle } = tutiCalcularPuntajes();
  tutiSumarMisMonedasSiCorresponde(puntos);
  const asientos = Object.keys(tutiRespuestas).sort((a,b) => (puntos[b]||0) - (puntos[a]||0));

  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>Letra ${tuti.letra}</h2>
      <p>Categorías: ${(tuti.categorias || []).join(', ')}</p>
      ${tutiCortadoPorHTML()}
    </div>
    <div class="tuti-resultados">${tutiFilasResultadosHTML(asientos, puntos, detalle)}</div>
    ${tutiAnotarseHTML(anotado)}
    <p class="tienda-nota">Esperá a que el organizador arranque otra ronda.</p>`;
}

function tutiFilasResultadosHTML(asientos, puntos, detalle){
  if(!asientos.length) return '<p style="color:var(--gray);font-size:13px;">Nadie llegó a contestar esta ronda.</p>';
  const esOrganizador = bingoEsOrganizador();
  return asientos.map(a => {
    const nombre = tutiRespuestas[a].nombre || `Asiento ${a}`;
    const esMio = a === String(miAsiento);
    const detalleAsiento = (detalle && detalle[a]) || {};
    const palabrasHTML = (tuti.categorias || []).map(cat => {
      const palabra = (tutiRespuestas[a].palabras || {})[cat] || '—';
      const info = detalleAsiento[cat] || { puntos: 0, coincidencias: 0, corregida: false };
      const coincidenciaTxt = info.coincidencias > 1 ? ` (+${info.coincidencias - 1})` : '';
      const vale = info.puntos > 0;
      const clase = 'tuti-resultado-palabra' + (vale ? '' : ' tuti-resultado-invalida') + (info.corregida ? ' tuti-resultado-corregida' : '');
      // El organizador puede corregir cualquier palabra a mano: ninguna
      // lista de países/animales/comidas va a cubrir todo, así que si algo
      // quedó mal marcado, lo arregla tocándolo (como discutirlo en la mesa).
      const control = (esOrganizador && palabra !== '—')
        ? `<button class="tuti-override-btn" onclick="tutiAlternarValidez('${a}','${cat}',${vale})" title="${vale ? 'Marcar inválida' : 'Marcar válida'}">${vale ? '✕' : '✓'}</button>`
        : '';
      // Con 6 categorías en fila era fácil perder de vista a cuál corresponde
      // cada palabra. Ahora cada una lleva el nombre de su categoría arriba.
      return `<div class="tuti-resultado-item">
        <span class="tuti-resultado-cat">${cat}</span>
        <span class="${clase}">${palabra} · ${info.puntos}${coincidenciaTxt}${control}</span>
      </div>`;
    }).join('');
    return `
      <div class="rank-row ${esMio ? 'me' : ''}">
        <div class="rank-avatar">${nombre.slice(0,2).toUpperCase()}</div>
        <div class="rank-name">${esMio ? 'Vos' : nombre}<span class="tuti-resultado-detalle">${palabrasHTML}</span></div>
        <div class="rank-pts">${puntos[a] || 0} pts</div>
      </div>`;
  }).join('');
}
