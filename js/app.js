// Monedas Bus Coin: no se compran con plata, todos arrancan en cero. Solo suben
// jugando (respuesta correcta o ganar el Bingo); un error no resta nada, no
// hay riesgo, solo premio por acertar. Sirven para el ranking del viaje y
// para elegir premio al final. Como nadie paga para jugar, esto es una
// promoción de fidelización gratuita, no un juego de azar.
let monedasCoin = 0;

const EMOJIS_DISPONIBLES = ['😊', '😎', '🤩', '😜', '🥳', '😇', '🤠', '🧐', '🤓', '💃', '🕺', '😴'];

// Separados en dos grupos para que la lista de Juegos no sea una sola tira
// larga: los que se juegan solo, mirando tu propia pantalla, y los que
// necesitan un grupo (así sea todo el micro o unos pocos asientos).
const TARJETAS_SOLO = [
  { icon: "trivia", title: "Trivia", sub: "Elegí un tema y sumá puntos", view: "trivia" },
  { icon: "interrogacion", title: "Acertijos", sub: "Pensá en grupo antes de rendirte", view: "acertijos" },
  { icon: "rompecabezas", title: "Pensamiento lateral", sub: "Resolvé el caso a puro sí o no", view: "pensamiento" },
  { icon: "libro", title: "Ahorcado", sub: "Adiviná la palabra letra por letra", view: "ahorcado" },
  { icon: "lupa", title: "4+1", sub: "4 imágenes, 1 palabra", view: "cuatrouno" },
  { icon: "valija", title: "Valija Express", sub: "25 segundos para armar la valija", view: "valija" },
  { icon: "cartas", title: "Memoria", sub: "Encontrá los pares, cada nivel más grande", view: "memoria" },
  { icon: "sudoku", title: "Sudoku", sub: "Sin cronómetro, elegí tu nivel", view: "sudoku" },
  { icon: "patrones", title: "Patrones", sub: "Descubrí la regla y completá la secuencia", view: "patrones" },
  { icon: "sopaletras", title: "Sopa de letras", sub: "Destinos y cosas del viaje, escondidos en la grilla", view: "sopa" },
];

const TARJETAS_GRUPO = [
  { icon: "letraA", title: "Tutti Frutti", sub: "Una letra, contra el resto del viaje", view: "tutifruti" },
  { icon: "espia", title: "El Impostor", sub: "Para tu grupo, no todo el micro", view: "impostor" },
  { icon: "bingo", title: "Bingo", sub: "Números del 00 al 99, con su significado", view: "bingo" },
  { icon: "rayo", title: "Trivia en Vivo", sub: "Todo el micro responde junto, estilo Kahoot", view: "triviavivo" },
  { icon: "lapiz", title: "Cadáver Exquisito", sub: "Una historia armada entre todos, a ciegas", view: "cuento" },
  { icon: "pincel", title: "Dibujar y Adivinar", sub: "Uno dibuja con el dedo, el resto adivina", view: "dibujar" },
  { icon: "naipe", title: "Escoba de 15", sub: "De a 2, sumá 15 para llevarte las cartas", view: "escoba" },
  { icon: "cartas", title: "Chinchón", sub: "De 2 a 4, armá grupos y escaleras", view: "chinchon" },
  { icon: "trebol", title: "Truco", sub: "De a 2, 4 o 6, con envido y sin flor", view: "truco" },
  { icon: "buscolor", title: "BusColor", sub: "De 2 a 6, quedate sin cartas primero", view: "buscolor" },
];


// ---- Código de viaje: agrupa Bingo/Ranking/DJ bajo un mismo código, para
// poder arrancar un viaje nuevo (pasajeros y nombres nuevos) sin mezclarlo
// con datos de un viaje anterior, y para poder borrar viajes ya terminados. ----

let codigoViaje = '';

function leerCodigoViajeDeURL(){
  const params = new URLSearchParams(location.search);
  return (params.get('viaje') || '').toUpperCase().trim();
}

function codigoAlAzar(){
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para que no se confundan al leerlo
  let codigo = '';
  for(let i = 0; i < 5; i++) codigo += letras[Math.floor(Math.random() * letras.length)];
  return codigo;
}

// Generar un código nuevo queda atrás del PIN: si cualquiera pudiera tocarlo,
// un pasajero se manda solo a un viaje vacío sin querer. Escribir un código
// ya existente, en cambio, lo puede hacer cualquiera (eso es "unirse").
let mostrandoPinCodigoNuevo = false;

function mostrarGenerarCodigo(){
  mostrandoPinCodigoNuevo = true;
  renderPinCodigoNuevo();
}

function renderPinCodigoNuevo(){
  const cont = document.getElementById('generar-codigo-content');
  if(!cont) return;
  if(!mostrandoPinCodigoNuevo){ cont.innerHTML = ''; return; }
  if(!agenciasEsOrganizador()){
    cont.innerHTML = agenciasFormularioLoginHTML('generar-codigo', 'renderPinCodigoNuevo');
    return;
  }
  cont.innerHTML = `
    <p class="link-chico" style="margin-bottom:8px;">Conectado como ${agenciaActualNombre}. <span onclick="agenciasCerrarSesion()" style="text-decoration:underline;cursor:pointer;">Cerrar sesión</span></p>
    <div class="bingo-pin-box">
      <input type="text" id="codigo-personalizado-input" class="bingo-input-numero" style="text-transform:uppercase;" placeholder="Código a elección (opcional)">
      <input type="number" id="capacidad-viaje-input" class="bingo-input-numero" min="1" placeholder="Cantidad de pasajeros (opcional)">
      <input type="text" id="destino-viaje-input" class="bingo-input-numero" style="width:100%;" placeholder="Destino (opcional, ej: Mar del Plata)">
      <textarea id="lista-pasajeros-crear-input" rows="4" style="width:100%;font-family:monospace;font-size:12.5px;border:1px solid var(--line-color,#ccc);border-radius:10px;padding:10px;margin-bottom:10px;" placeholder="Opcional: seleccioná en Excel las columnas de Apellido y Nombre, copialas (Ctrl+C) y pegalas acá (Ctrl+V) — así cada uno elige su nombre en vez de tipearlo"></textarea>
      <button class="btn-primary" onclick="confirmarGenerarCodigo()">Crear código de viaje</button>
      <p id="pin-codigo-nuevo-error" class="bingo-pin-error"></p>
      <p class="link-chico" style="margin-top:6px;">Si ponés una cantidad, nadie más va a poder entrar con este código una vez que se llenen esos cupos — aunque lo sigan reenviando.</p>
      <p class="link-chico" style="margin-top:2px;">Si ponés un destino y ya hay comercios cargados para ese destino, les va a aparecer solo el botón de "Comercios adheridos".</p>
    </div>`;
}

// El organizador puede elegir su propio código (ej. el nombre del viaje) o
// dejarlo vacío para que se genere uno al azar. Si el código elegido ya
// está en uso por otro viaje, avisa para que pruebe con otro.
function confirmarGenerarCodigo(){
  if(!agenciasEsOrganizador()) return;
  const error = document.getElementById('pin-codigo-nuevo-error');
  if(error) error.textContent = '';
  const personalizadoInput = document.getElementById('codigo-personalizado-input');
  const personalizado = personalizadoInput ? personalizadoInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
  const codigo = personalizado || codigoAlAzar();
  const capacidadInput = document.getElementById('capacidad-viaje-input');
  const capacidad = capacidadInput ? Number(capacidadInput.value) : 0;

  db.ref('salas/' + codigo + '/creado').once('value').then(snap => {
    if(snap.val() != null){
      if(error) error.textContent = 'Ese código ya está en uso, elegí otro.';
      return;
    }
    localStorage.setItem('bingo-organizador', 'si');
    codigoViaje = codigo;
    localStorage.setItem('codigo-viaje', codigoViaje);
    db.ref('salas/' + codigoViaje + '/creado').set(Date.now());
    db.ref('salas/' + codigoViaje + '/agenciaId').set(agenciaActualId);
    if(capacidad > 0) db.ref('salas/' + codigoViaje + '/capacidad').set(capacidad);
    const destinoInput = document.getElementById('destino-viaje-input');
    const destino = destinoInput ? destinoInput.value.trim() : '';
    if(destino) db.ref('salas/' + codigoViaje + '/destino').set(destino);
    const listaInput = document.getElementById('lista-pasajeros-crear-input');
    const listaTexto = listaInput ? listaInput.value.trim() : '';
    if(listaTexto) listaPasajerosGuardarEnViaje(codigoViaje, listaTexto);
    mostrandoPinCodigoNuevo = false;
    renderPinCodigoNuevo();
    showView('onboard');
  });
}

function actualizarBotonCodigoViaje(){
  const val = document.getElementById('codigo-viaje-input').value.trim();
  document.getElementById('btn-continuar-codigo').disabled = val.length === 0;
}

// Si el organizador definió una cantidad de pasajeros al crear el viaje, una
// vez alcanzada nadie nuevo puede entrar con el código — así no importa
// cuánto se siga reenviando, no se llena de gente que no iba en ese micro.
// Un dispositivo que ya se había anotado (mismo asiento ya en el ranking de
// este viaje) puede volver a entrar sin problema, aunque el cupo ya esté lleno.
function viajeAlcanzoCapacidad(snap){
  const capacidad = snap.child('capacidad').val();
  if(!capacidad) return false;
  const yaAnotado = miAsiento && snap.child('ranking/puntos/' + miAsiento).exists();
  if(yaAnotado) return false;
  return snap.child('ranking/puntos').numChildren() >= capacidad;
}

// Solo se puede entrar con un código que un organizador haya generado de
// verdad (marcado en Firebase con "creado"): así nadie tipea cualquier cosa
// y arranca sin querer un viaje fantasma separado del resto.
function confirmarCodigoViaje(){
  const codigo = document.getElementById('codigo-viaje-input').value.trim().toUpperCase();
  const error = document.getElementById('codigo-viaje-error');
  if(error) error.textContent = '';
  if(!codigo) return;

  db.ref('salas/' + codigo).once('value').then(snap => {
    if(!snap.exists() || snap.child('creado').val() == null){
      if(error) error.textContent = 'Ese código no existe. Pedile el código al organizador del viaje.';
      return;
    }
    if(snap.child('cerrado').val()){
      if(error) error.textContent = 'Este viaje ya terminó y dejó de estar disponible.';
      return;
    }
    if(viajeAlcanzoCapacidad(snap)){
      if(error) error.textContent = 'Este viaje ya llegó al límite de pasajeros.';
      return;
    }
    codigoViaje = codigo;
    localStorage.setItem('codigo-viaje', codigoViaje);
    showView('onboard');
  });
}

function copiarLinkViaje(){
  if(!codigoViaje) return;
  const url = `${location.origin}${location.pathname}?viaje=${encodeURIComponent(codigoViaje)}`;
  navigator.clipboard.writeText(url).then(() => mostrarToast('Link del viaje copiado'));
}

// ---- Administración de viajes: mismo PIN que el organizador del Bingo,
// para listar y borrar viajes ya terminados. ----

let adminMostrandoPin = false;

function mostrarAdminViajes(){
  adminMostrandoPin = true;
  renderAdminViajes();
}

function renderAdminViajes(){
  const cont = document.getElementById('admin-viajes-content');
  if(!cont) return;
  if(!agenciasEsOrganizador()){
    if(!adminMostrandoPin){ cont.innerHTML = ''; return; }
    cont.innerHTML = agenciasFormularioLoginHTML('admin-viajes', 'renderAdminViajes');
    return;
  }
  cont.innerHTML = `<p class="link-chico">Conectado como ${agenciaActualNombre}. <span onclick="agenciasCerrarSesion()" style="text-decoration:underline;cursor:pointer;">Cerrar sesión</span></p><p style="color:var(--gray);font-size:13px;">Cargando viajes...</p>`;
  db.ref('salas').orderByChild('agenciaId').equalTo(agenciaActualId).once('value').then(snap => {
    const datos = snap.val() || {};
    const codigos = Object.keys(datos);
    if(!codigos.length){
      cont.innerHTML = '<p style="color:var(--gray);font-size:13px;">Todavía no hay viajes guardados.</p>';
      return;
    }
    cont.innerHTML = `<div class="section-label">Viajes guardados</div>` + codigos.map(c => {
      const pasajeros = Object.keys((datos[c].ranking && datos[c].ranking.puntos) || {}).length;
      const cerrado = !!datos[c].cerrado;
      const capacidad = datos[c].capacidad;
      const listaLen = (datos[c].listaPasajeros || []).length;
      const listaAbierta = adminListaAbiertaPara === c;
      const listoParaBorrar = !!datos[c].listoParaBorrar;
      const canjesAbiertos = adminCanjesAbiertoPara === c;
      const mayoresDe12 = Object.values((datos[c].ranking && datos[c].ranking.puntos) || {}).filter(p => p.mayorDe12).length;
      return `<div class="bingo-roster-item">
        <span>${c}${cerrado ? ' 🔒' : ''}${listoParaBorrar ? ' <span style="color:#B85A0B;font-weight:600;">· ✅ Listo para borrar</span>' : ''}</span>
        <span class="bingo-roster-derecha">
          <span>${pasajeros}${capacidad ? '/' + capacidad : ''} pasajero${pasajeros === 1 ? '' : 's'}</span>
          <button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;" onclick="adminToggleLista('${c}')" title="Cargar lista de pasajeros">📋${listaLen ? ' ' + listaLen : ''}</button>
          ${datos[c].destino ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;" onclick="adminToggleCanjes('${c}')" title="Ver canjes de comercios">🏪</button>` : ''}
          <button class="btn-finalizar-viaje" onclick="toggleCerrarViaje('${c}',${!cerrado})">${cerrado ? 'Reabrir' : 'Finalizar'}</button>
          <button class="btn-eliminar-pasajero" onclick="eliminarViaje('${c}')" title="Eliminar viaje">✕</button>
        </span>
      </div>
      ${listaAbierta ? `
      <div style="margin:-6px 0 10px;">
        <textarea id="admin-lista-input-${c}" rows="4" style="width:100%;font-family:monospace;font-size:12.5px;border:1px solid var(--line-color,#ccc);border-radius:10px;padding:10px;margin-bottom:6px;" placeholder="Seleccioná en Excel las columnas de Apellido y Nombre, copialas (Ctrl+C) y pegalas acá (Ctrl+V)">${(datos[c].listaPasajeros || []).map(p => `${p.apellido}\t${p.nombre}`).join('\n')}</textarea>
        <button class="btn-primary" style="margin-bottom:4px;" onclick="adminGuardarLista('${c}')">Guardar lista</button>
      </div>` : ''}
      ${canjesAbiertos ? `
      <div style="margin:-6px 0 10px;">
        <p style="font-size:11.5px;color:var(--gray);margin-bottom:4px;">Destino: ${datos[c].destino} — ${mayoresDe12} mayores de 12 de ${pasajeros} pasajeros</p>
        ${comerciosResumenViajeHTML(datos[c])}
      </div>` : ''}`;
    }).join('');
  });
}

let adminListaAbiertaPara = null;
let adminCanjesAbiertoPara = null;

function adminToggleCanjes(codigo){
  adminCanjesAbiertoPara = adminCanjesAbiertoPara === codigo ? null : codigo;
  renderAdminViajes();
}

function adminToggleLista(codigo){
  adminListaAbiertaPara = adminListaAbiertaPara === codigo ? null : codigo;
  renderAdminViajes();
}

function adminGuardarLista(codigo){
  const input = document.getElementById('admin-lista-input-' + codigo);
  const texto = input ? input.value.trim() : '';
  listaPasajerosGuardarEnViaje(codigo, texto).then(cantidad => {
    mostrarToast(cantidad ? `Lista cargada: ${cantidad} pasajeros` : 'Lista borrada');
    adminListaAbiertaPara = null;
    renderAdminViajes();
  });
}

function eliminarViaje(codigo){
  db.ref('salas/' + codigo).remove().then(() => renderAdminViajes());
}

// "Finalizar" no borra nada (así el ranking queda para entregar los premios
// después): solo marca la sala como cerrada, y desde ese momento nadie más
// puede entrar con ese código. "Reabrir" deshace eso, por si hace falta.
function toggleCerrarViaje(codigo, cerrar){
  db.ref('salas/' + codigo + '/cerrado').set(cerrar).then(() => renderAdminViajes());
}

// ---- Identidad y ranking compartido: cada celular dice su emoji, nombre y
// asiento una vez, y los puntos que gana se suman a una tabla en vivo en Firebase.
// Se guarda por asiento (no por nombre) para que dos pasajeros con el mismo
// nombre no se mezclen en una sola fila. ----

let miNombre = localStorage.getItem('mi-nombre') || '';
let miAsiento = localStorage.getItem('mi-asiento') || '';
let miEmoji = localStorage.getItem('mi-emoji') || '';
let rankingPuntos = {};
let rankingListener = null;

function rankingRefPuntos(){ return db.ref('salas/' + codigoViaje + '/ranking/puntos'); }

function rankingUnirse(){
  if(!miNombre || !miAsiento) return;
  const ref = rankingRefPuntos().child(String(miAsiento));
  ref.once('value').then(snap => {
    if(snap.val() == null) ref.set({ nombre: miNombre, pts: 0, mayorDe12: !!miMayorDe12 });
  });
  if(!rankingListener){
    rankingListener = rankingRefPuntos().on('value', snap => {
      rankingPuntos = snap.val() || {};
      renderRanking();
    });
  }
}

// Se guarda al elegir en el onboarding (no hace falta Firebase todavía: recién
// se manda cuando se confirma todo en goHome()).
let miMayorDe12 = null;

function elegirMayorDe12(valor){
  miMayorDe12 = valor;
  const chips = document.querySelectorAll('#mi-mayor-de-12-chips .chip');
  chips.forEach((chip, i) => chip.classList.toggle('selected', (i === 0) === valor));
  actualizarBotonContinuar();
}

function actualizarBotonContinuar(){
  const nombreOk = document.getElementById('mi-nombre-input').value.trim().length > 0;
  const asientoOk = Number(document.getElementById('mi-asiento-input').value) > 0;
  const edadOk = miMayorDe12 !== null;
  document.getElementById('btn-continuar').disabled = !(nombreOk && asientoOk && edadOk);
}

// Ya no se elige a mano: se asigna solo (pero siempre el mismo para la misma
// persona, no cambia en cada visita) para no sumarle una pantalla más al
// arranque solo por elegir un emoji.
function elegirEmojiAutomatico(nombre, asiento){
  const base = String(nombre || '') + String(asiento || '');
  let hash = 0;
  for(let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  return EMOJIS_DISPONIBLES[hash % EMOJIS_DISPONIBLES.length];
}

// Si el viaje se cierra mientras alguien ya está adentro (por ejemplo, por el
// cierre automático de premiosCerrarViajeAutomaticamente), esto lo saca de
// vuelta a la pantalla de entrada para que no pueda seguir jugando ni sumando
// monedas. A quien esté mirando Premios o Ranking no lo interrumpe de golpe
// (justo ahí es donde el propio ganador ve la confirmación de su premio),
// pero igual le oculta las pestañas para que no pueda volver a los juegos.
let cierreDeViajeListenerActivo = false;

function activarListenerCierreDeViaje(){
  if(cierreDeViajeListenerActivo || !codigoViaje) return;
  cierreDeViajeListenerActivo = true;
  db.ref('salas/' + codigoViaje + '/cerrado').on('value', snap => {
    if(!snap.val()) return;
    mostrarToast('Este viaje ya terminó. ¡Gracias por jugar!');
    document.getElementById('tabbar').style.display = 'none';
    const vistaActual = document.querySelector('.view.active');
    const enVistaSegura = vistaActual && (vistaActual.id === 'view-tienda' || vistaActual.id === 'view-ranking');
    codigoViaje = '';
    localStorage.removeItem('codigo-viaje');
    if(!enVistaSegura) showView('codigo-viaje');
  });
}

function goHome(){
  miNombre = document.getElementById('mi-nombre-input').value.trim();
  miAsiento = document.getElementById('mi-asiento-input').value.trim();
  miEmoji = elegirEmojiAutomatico(miNombre, miAsiento);
  localStorage.setItem('mi-nombre', miNombre);
  localStorage.setItem('mi-asiento', miAsiento);
  localStorage.setItem('mi-emoji', miEmoji);
  localStorage.setItem('mi-mayor-de-12', miMayorDe12 ? '1' : '0');
  rankingUnirse();
  activarListenerCierreDeViaje();
  iniciarComerciosDestino();
  showView('home');
  document.getElementById('tabbar').style.display = 'flex';
  actualizarMonedasEnPantalla();
  renderHome();
}

function renderTarjetas(lista, contenedorId){
  const container = document.getElementById(contenedorId);
  lista.forEach(c=>{
    const div = document.createElement('div');
    div.className = 'card';
    div.onclick = ()=> showView(c.view);
    div.innerHTML = `<div class="icon">${icono(c.icon)}</div><div class="txt"><h3>${c.title}</h3><p>${c.sub}</p></div>`;
    container.appendChild(div);
  });
}

function renderHome(){
  document.getElementById('home-saludo').textContent = `${miEmoji} Hola, ${miNombre}`;
  document.getElementById('home-viaje').textContent = `Viaje ${codigoViaje} · copiar link`;
  // Los juegos ya están en la pestaña Juegos y el ranking en su propia
  // pestaña; Inicio se queda solo con el logo (más publicidad) y la
  // raspadita del día, sin repetir lo que ya está a un toque de distancia.
  document.getElementById('home-content').innerHTML = `
    <div class="home-logo-banner"><img src="logo-empresa.png" alt="Logo"></div>
    ${pwaInstalarHTML()}
    ${raspaditaHTML()}`;
}

// Con tantos juegos la lista se hacía larga para escanear de un vistazo, así
// que quedan agrupados atrás de botones grandes que se despliegan al
// tocarlos (cada uno se abre y cierra por separado). Se muestran igual en
// Inicio y en Juegos, así en Inicio no se repite toda la lista suelta —
// por eso las funciones llevan un "vista" para no chocar los mismos ids.
// Dentro de "jugar en grupo" separamos los de cartas del resto, para no
// mezclar en una sola tira Truco con Bingo o Dibujar y Adivinar.
let juegosAbiertos = { solo: false, grupoCartas: false, grupoOtros: false };

const TARJETAS_GRUPO_CARTAS_VISTAS = new Set(['escoba', 'chinchon', 'truco', 'buscolor']);
const TARJETAS_GRUPO_CARTAS = TARJETAS_GRUPO.filter(t => TARJETAS_GRUPO_CARTAS_VISTAS.has(t.view));
const TARJETAS_GRUPO_OTROS = TARJETAS_GRUPO.filter(t => !TARJETAS_GRUPO_CARTAS_VISTAS.has(t.view));

function toggleCategoriaJuegos(categoria){
  juegosAbiertos[categoria] = !juegosAbiertos[categoria];
  renderHome();
  renderJuegos();
}

function categoriaJuegosHTML(vista, categoria, clase, icono, titulo, sub){
  const abierto = juegosAbiertos[categoria];
  return `
    <div class="categoria-juegos ${clase}" onclick="toggleCategoriaJuegos('${categoria}')">
      <span class="categoria-juegos-icono">${icono}</span>
      <div class="categoria-juegos-info">
        <h2>${titulo}</h2>
        <p>${sub}</p>
      </div>
      <span class="categoria-juegos-flecha ${abierto ? 'categoria-juegos-flecha-abierta' : ''}">▾</span>
    </div>
    ${abierto ? `<div class="categoria-juegos-lista" id="lista-${vista}-${categoria}"></div>` : ''}`;
}

function categoriasJuegosHTML(vista){
  return categoriaJuegosHTML(vista, 'solo', 'categoria-juegos-solo', '🧠', 'Desafiá tu mente', `${TARJETAS_SOLO.length} juegos para vos solo`) +
    categoriaJuegosHTML(vista, 'grupoCartas', 'categoria-juegos-cartas', '🃏', 'Juegos de cartas', `${TARJETAS_GRUPO_CARTAS.length} juegos de cartas en grupo`) +
    categoriaJuegosHTML(vista, 'grupoOtros', 'categoria-juegos-grupo', '🤝', 'Jugar en grupo, conecta.', `${TARJETAS_GRUPO_OTROS.length} juegos para tu grupo`);
}

function renderCategoriasEnListas(vista){
  if(juegosAbiertos.solo) renderTarjetas(TARJETAS_SOLO, `lista-${vista}-solo`);
  if(juegosAbiertos.grupoCartas) renderTarjetas(TARJETAS_GRUPO_CARTAS, `lista-${vista}-grupoCartas`);
  if(juegosAbiertos.grupoOtros) renderTarjetas(TARJETAS_GRUPO_OTROS, `lista-${vista}-grupoOtros`);
}

function renderJuegos(){
  document.getElementById('juegos-content').innerHTML = categoriasJuegosHTML('juegos');
  renderCategoriasEnListas('juegos');
}

// Trivia, Acertijos y Bingo se entran desde el menú "Juegos" del tabbar, así
// que esa pestaña queda marcada activa aunque ya estés adentro de uno de ellos.
const TABS_HIJOS_DE_JUEGOS = ['trivia', 'acertijos', 'pensamiento', 'ahorcado', 'cuatrouno', 'valija', 'memoria', 'sudoku', 'patrones', 'sopa', 'tutifruti', 'impostor', 'bingo', 'triviavivo', 'cuento', 'dibujar', 'escoba', 'chinchon', 'truco', 'buscolor'];

function showView(name){
  analyticsAlCambiarVista(name);
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  const tabName = TABS_HIJOS_DE_JUEGOS.includes(name) ? 'juegos' : name;
  const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if(tab) tab.classList.add('active');
  if(name==='juegos'){ renderJuegos(); }
  if(name==='trivia'){ iniciarTrivia(); }
  if(name==='acertijos'){ iniciarAcertijos(); }
  if(name==='pensamiento'){ iniciarPensamiento(); }
  if(name==='ahorcado'){ iniciarAhorcado(); }
  if(name==='cuatrouno'){ iniciarCuatrouno(); }
  if(name==='valija'){ iniciarValija(); }
  if(name==='memoria'){ iniciarMemoria(); }
  if(name==='sudoku'){ iniciarSudoku(); }
  if(name==='patrones'){ iniciarPatrones(); }
  if(name==='sopa'){ iniciarSopa(); }
  if(name==='tutifruti'){ iniciarTutifruti(); }
  if(name==='impostor'){ iniciarImpostor(); }
  if(name==='ranking'){ renderRanking(); }
  if(name==='bingo'){ iniciarBingo(); }
  if(name==='triviavivo'){ iniciarTriviaVivo(); }
  if(name==='cuento'){ iniciarCuento(); }
  if(name==='dibujar'){ iniciarDibujar(); }
  if(name==='escoba'){ iniciarEscoba(); }
  if(name==='chinchon'){ iniciarChinchon(); }
  if(name==='truco'){ iniciarTruco(); }
  if(name==='buscolor'){ iniciarBuscolor(); }
  if(name==='comercios'){ iniciarComercios(); }
  if(name==='tienda'){ iniciarPremios(); }
  if(name==='onboard'){ listaPasajerosCargarParaOnboarding(); }
}

const MEDALLAS_RANKING = ['🥇', '🥈', '🥉'];

function renderRanking(){
  const list = document.getElementById('ranking-list');
  if(!list) return;
  const filas = Object.keys(rankingPuntos)
    .map(asiento => ({ asiento, nombre: rankingPuntos[asiento].nombre, pts: rankingPuntos[asiento].pts, me: asiento === String(miAsiento) }))
    .sort((a,b)=> b.pts - a.pts);
  list.innerHTML = filas.length ? '' : '<p style="color:var(--gray);font-size:13px;">Todavía nadie sumó puntos.</p>';
  filas.forEach((r,i)=>{
    const div = document.createElement('div');
    div.className = 'rank-row' + (r.me ? ' me' : '');
    div.innerHTML = `<div class="rank-num">${MEDALLAS_RANKING[i] || i+1}</div><div class="rank-avatar">${r.nombre.slice(0,2).toUpperCase()}</div><div class="rank-name">${r.me ? 'Vos' : r.nombre} <span class="rank-asiento">· asiento ${r.asiento}</span></div><div class="rank-pts">${r.pts} pts</div>`;
    list.appendChild(div);
  });
}

function totalMonedas(){
  return monedasCoin;
}

function alcanzanMonedas(cantidad){
  return monedasCoin >= cantidad;
}

function gastarMonedas(cantidad){
  if(!alcanzanMonedas(cantidad)) return false;
  monedasCoin -= cantidad;
  actualizarMonedasEnPantalla();
  return true;
}

function actualizarMonedasEnPantalla(){
  const el = document.getElementById('monedas-coin-count');
  if(el) el.textContent = monedasCoin;
}

// Suma o resta monedas jugando (positivo si acertaste, negativo si no);
// nunca deja el saldo en negativo. Todos los juegos usan esto, Bingo incluido,
// y también actualiza el Ranking en vivo con el mismo número.
function ganarMonedas(cantidad){
  monedasCoin = Math.max(0, monedasCoin + cantidad);
  actualizarMonedasEnPantalla();
  if(!miNombre || !miAsiento) return;
  const asiento = String(miAsiento);
  const puntosActuales = (rankingPuntos[asiento] && rankingPuntos[asiento].pts) || 0;
  const nuevoPts = Math.max(0, puntosActuales + cantidad);
  rankingPuntos[asiento] = Object.assign({}, rankingPuntos[asiento], { nombre: miNombre, pts: nuevoPts });
  // .update() en vez de .set(): así no pisa otros campos del mismo registro,
  // como el "mayorDe12" que usa Comercios para decidir qué canjes facturar.
  rankingRefPuntos().child(asiento).update({ nombre: miNombre, pts: nuevoPts });
  analyticsRegistrar('monedas_ganadas', { cantidad, juego: analyticsVistaActual });
}


let toastTimer = null;

// tipo: 'gain' (sumaste monedas), 'loss' (perdiste monedas) o vacío (neutro).
// Dura más y se resalta con color para que dé tiempo a leerlo antes de
// pasar a la siguiente pregunta.
function mostrarToast(msg, tipo){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('toast-gain', 'toast-loss');
  if(tipo === 'gain') t.classList.add('toast-gain');
  if(tipo === 'loss') t.classList.add('toast-loss');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2600);
}

document.addEventListener('DOMContentLoaded', ()=>{
  // Si se abrió desde el QR de un comercio (?canjear=1&...), es el celular
  // DEL COMERCIO, no el de un pasajero: se muestra solo la confirmación del
  // canje y se corta acá, sin arrancar el resto de la app.
  const datosCanje = comerciosLeerParamsCanje();
  if(datosCanje){
    comerciosMostrarPantallaCanje(datosCanje);
    return;
  }

  document.querySelectorAll('[data-icon]').forEach(el=>{
    el.innerHTML = icono(el.dataset.icon);
  });
  const nombreInput = document.getElementById('mi-nombre-input');
  if(nombreInput && miNombre) nombreInput.value = miNombre;
  const asientoInput = document.getElementById('mi-asiento-input');
  if(asientoInput && miAsiento) asientoInput.value = miAsiento;
  const mayorDe12Guardado = localStorage.getItem('mi-mayor-de-12');
  if(mayorDe12Guardado !== null) elegirMayorDe12(mayorDe12Guardado === '1');
  actualizarBotonContinuar();

  const codigoURL = leerCodigoViajeDeURL();
  const codigoInput = document.getElementById('codigo-viaje-input');
  if(codigoURL){
    // Se abrió con un link compartido (?viaje=CODIGO): valida contra Firebase
    // antes de entrar directo, por si el código ya no existe.
    db.ref('salas/' + codigoURL).once('value').then(snap => {
      if(snap.exists() && snap.child('creado').val() != null && !snap.child('cerrado').val() && !viajeAlcanzoCapacidad(snap)){
        codigoViaje = codigoURL;
        localStorage.setItem('codigo-viaje', codigoViaje);
        showView('onboard');
      } else if(codigoInput){
        codigoInput.value = codigoURL;
        actualizarBotonCodigoViaje();
        const error = document.getElementById('codigo-viaje-error');
        if(error) error.textContent = !snap.exists() || snap.child('creado').val() == null
          ? 'Ese código ya no existe. Pedile uno nuevo al organizador.'
          : snap.child('cerrado').val()
            ? 'Este viaje ya terminó y dejó de estar disponible.'
            : 'Este viaje ya llegó al límite de pasajeros.';
      }
    });
  } else if(codigoInput){
    codigoInput.value = localStorage.getItem('codigo-viaje') || '';
    actualizarBotonCodigoViaje();
  }
});
