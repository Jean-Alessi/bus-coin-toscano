// Monedas Bus Coin: no se compran con plata, todos arrancan en cero. Solo suben
// jugando (respuesta correcta o ganar el Bingo); un error no resta nada, no
// hay riesgo, solo premio por acertar. Sirven para el ranking del viaje y
// para elegir premio al final. Como nadie paga para jugar, esto es una
// promoción de fidelización gratuita, no un juego de azar.
// La billetera se guarda en el celular y sirve para vestir al personaje. Los
// puntos del ranking del viaje son otra cosa y no se tocan al gastar.
let monedasCoin = (() => { try { return Math.max(0, Number(localStorage.getItem('busmac-monedas')) || 0); } catch(e){ return 0; } })();
function guardarMonedas(){ try { localStorage.setItem('busmac-monedas', String(monedasCoin)); } catch(e){} }
// Suma solo a la billetera (regalos): no cuenta para el ranking.
function regalarMonedas(n){ monedasCoin += n; guardarMonedas(); actualizarMonedasEnPantalla(); }

const EMOJIS_DISPONIBLES = ['😊', '😎', '🤩', '😜', '🥳', '😇', '🤠', '🧐', '🤓', '💃', '🕺', '😴'];

// Separados en dos grupos para que la lista de Juegos no sea una sola tira
// larga: los que se juegan solo, mirando tu propia pantalla, y los que
// necesitan un grupo (así sea todo el micro o unos pocos asientos).
const TARJETAS_SOLO = [
  { icon: "trivia", title: "Trivia", sub: "Elegí un tema y sumá puntos", view: "trivia" },
  { icon: "libro", title: "Ahorcado", sub: "Adiviná la palabra letra por letra", view: "ahorcado" },
  { icon: "valija", title: "Valija Express", sub: "25 segundos para armar la valija", view: "valija" },
  { icon: "cartas", title: "Memoria", sub: "Encontrá los pares, cada nivel más grande", view: "memoria" },
  { icon: "sudoku", title: "Sudoku", sub: "Sin cronómetro, elegí tu nivel", view: "sudoku" },
  { icon: "sopaletras", title: "Sopa de letras", sub: "Destinos y cosas del viaje, escondidos en la grilla", view: "sopa" },
  { icon: "naipe", title: "Solitario", sub: "Ordená todas las cartas de poker en sus pilas", view: "solitario" },
  { icon: "rompecabezas", title: "Categorías Viajeras", sub: "Agrupá las cosas del viaje por categoría", view: "categorias" },
];

// Juegos de acción (se dibujan en un canvas, ver js/arcade.js).
const TARJETAS_VIDEO = [
  { icon: "micro", title: "Corredor del Micro", sub: "Esquivá obstáculos y juntá monedas por la ruta", view: "corredor" },
  { icon: "avion", title: "Vuelo", sub: "Un toque para subir, pasá entre las torres", view: "vuelo" },
  { icon: "serpiente", title: "Serpiente", sub: "Comé medialunas sin chocarte", view: "serpiente" },
  { icon: "tetris", title: "Tetris", sub: "Encajá las piezas y completá líneas", view: "tetris" },
  { icon: "ladrillos", title: "Ladrillos", sub: "Rebotá la pelota y rompé todo", view: "ladrillos" },
  { icon: "parking", title: "Estacionar el Micro", sub: "Entrá derecho al lugar libre", view: "parking" },
  { icon: "laberinto", title: "Laberinto del Micro", sub: "Juntá todo y escapá de los camiones", view: "laberinto" },
  { icon: "tanque", title: "Defensa del Garage", sub: "Protegé el garage de Busmac", view: "tanque" },
  { icon: "pinball", title: "Pinball", sub: "Paletas, rebotadores y puntos", view: "pinball" },
  { icon: "bombas", title: "Bombas y Bloques", sub: "Abrite paso y sacá a los enemigos", view: "bombas" },
  { icon: "plataformas", title: "Aventura del Pasajero", sub: "Corré, saltá y juntá las B", view: "plataformas" },
];

const TARJETAS_GRUPO = [
  { icon: "letraA", title: "Tutti Frutti", sub: "Una letra, contra el resto del viaje", view: "tutifruti" },
  { icon: "espia", title: "El Impostor", sub: "Para tu grupo, no todo el micro", view: "impostor" },
  { icon: "bingo", title: "Bingo", sub: "Números del 00 al 99, con su significado", view: "bingo" },
  { icon: "lapiz", title: "Cadáver Exquisito", sub: "Una historia armada entre todos, a ciegas", view: "cuento" },
  { icon: "pincel", title: "Dibujar y Adivinar", sub: "Uno dibuja con el dedo, el resto adivina", view: "dibujar" },
  { icon: "naipe", title: "Escoba de 15", sub: "De a 2, sumá 15 para llevarte las cartas", view: "escoba" },
  { icon: "cartas", title: "Chinchón", sub: "De 2 a 4, armá grupos y escaleras", view: "chinchon" },
  { icon: "trebol", title: "Truco", sub: "De a 2, 4 o 6, con envido y sin flor", view: "truco" },
  { icon: "buscolor", title: "BusColor", sub: "De 2 a 6, quedate sin cartas primero", view: "buscolor" },
];


// ---- Póker: queda apagado por defecto en cada viaje y lo enciende el
// organizador (salas/{codigo}/ajustes/poker). Sirve para dejarlo afuera, por
// ejemplo, de los viajes de estudiantes. Las fichas del póker no suman
// monedas ni ranking. ----
const TARJETA_VIDEOPOKER = { icon: "naipe", title: "Póker de video", sub: "Elegí las cartas y armá la mejor mano", view: "videopoker" };
const TARJETA_TEXAS = { icon: "trebol", title: "Texas Hold'em", sub: "De 2 a 6: 2 cartas tuyas y 5 en la mesa", view: "texas" };
const VISTAS_POKER = ['videopoker', 'texas'];
let pokerHabilitado = false, pokerCodigoEscuchado = '', pokerRefEscuchada = null;

function pokerAplicarAjuste(habilitado){
  pokerHabilitado = !!habilitado;
  const pares = [[TARJETAS_SOLO, TARJETA_VIDEOPOKER]];
  if(typeof TARJETAS_GRUPO_CARTAS !== 'undefined' && typeof TARJETA_TEXAS !== 'undefined') pares.push([TARJETAS_GRUPO_CARTAS, TARJETA_TEXAS]);
  pares.forEach(([lista, tarjeta]) => {
    const i = lista.indexOf(tarjeta);
    if(i >= 0) lista.splice(i, 1);
    if(pokerHabilitado) lista.push(tarjeta);
  });
  const activa = document.querySelector('.view.active');
  if(!pokerHabilitado && activa && VISTAS_POKER.includes(activa.id.replace('view-', ''))) showView('juegos');
  else if(typeof renderJuegos === 'function' && document.getElementById('juegos-content')) renderJuegos();
}

function pokerEscucharAjuste(){
  if(!codigoViaje || pokerCodigoEscuchado === codigoViaje) return;
  if(pokerRefEscuchada) pokerRefEscuchada.off();
  pokerCodigoEscuchado = codigoViaje;
  pokerRefEscuchada = db.ref('salas/' + codigoViaje + '/ajustes/poker');
  pokerRefEscuchada.on('value', snap => pokerAplicarAjuste(snap.val() === true));
}

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

// El bloque de organizador (generar código / administrar viajes / administrar
// comercios / panel general) viene oculto por defecto: un pasajero no tiene
// nada que hacer ahí, y mostrárselo solo lo iba a tentar a tocarlo. Se
// revela solo si este celular ya organizó algo antes o tiene una sesión de
// agencia activa -- así el organizador de siempre lo sigue viendo directo,
// sin pasos de más.
function organizadorActualizarVisibilidad(){
  const bloque = document.getElementById('bloque-organizador');
  if(!bloque) return;
  if(bingoEsOrganizador() || agenciasEsOrganizador()) bloque.hidden = false;
}

// Para un organizador en un celular nuevo (donde todavía no hay ninguna
// marca de que ya organizó algo): tocando 5 veces seguidas el logo de
// arriba en menos de 2 segundos aparece el bloque de organizador. Un
// pasajero no tiene forma de adivinar este gesto sin que se lo cuenten.
let tapsLogoOrganizador = 0;
let tapsLogoOrganizadorTimer = null;
function tapLogoOrganizador(){
  tapsLogoOrganizador++;
  clearTimeout(tapsLogoOrganizadorTimer);
  tapsLogoOrganizadorTimer = setTimeout(() => { tapsLogoOrganizador = 0; }, 2000);
  if(tapsLogoOrganizador >= 5){
    tapsLogoOrganizador = 0;
    const bloque = document.getElementById('bloque-organizador');
    if(bloque) bloque.hidden = false;
  }
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
  const agenciaIdAlPedir = agenciaActualId;
  db.ref('salas').orderByChild('agenciaId').equalTo(agenciaActualId).once('value').then(snap => {
    // Si mientras cargaba se cerró sesión (o se inició otra), esta respuesta
    // ya está vieja: no pisar la pantalla de login con datos de otra sesión.
    if(agenciaActualId !== agenciaIdAlPedir) return;
    const datos = snap.val() || {};
    const codigos = Object.keys(datos);
    if(!codigos.length){
      cont.innerHTML = '<p style="color:var(--gray);font-size:13px;">Todavía no hay viajes guardados.</p>';
      return;
    }
    if(typeof pedidosVigilar === 'function') pedidosVigilar(codigos);
    cont.innerHTML = `<div class="section-label">Viajes guardados</div>` + codigos.map(c => {
      const pasajeros = Object.keys((datos[c].ranking && datos[c].ranking.puntos) || {}).length;
      const cerrado = !!datos[c].cerrado;
      const capacidad = datos[c].capacidad;
      const listaLen = (datos[c].listaPasajeros || []).length;
      const listaAbierta = adminListaAbiertaPara === c;
      const listaCursos = Array.isArray(datos[c].cursos) ? datos[c].cursos : Object.values(datos[c].cursos || {});
      const listoParaBorrar = !!datos[c].listoParaBorrar;
      const canjesAbiertos = adminCanjesAbiertoPara === c;
      const mayoresDe12 = Object.values((datos[c].ranking && datos[c].ranking.puntos) || {}).filter(p => p.mayorDe12).length;
      return `<div class="bingo-roster-item">
        <span>${c}${cerrado ? ' 🔒' : ''}${listoParaBorrar ? ' <span style="color:#B85A0B;font-weight:600;">· ✅ Listo para borrar</span>' : ''}</span>
        <span class="bingo-roster-derecha">
          <button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;background:#E5586E;color:#fff;" onclick="pedidosToggle('${c}')" title="Bandeja con todos los pedidos de los pasajeros">📥<span id="pedidos-num-${c}">${typeof pedidosPendientes === 'function' && pedidosPendientes(c) ? ' ' + pedidosPendientes(c) : ''}</span></button>
          <span>${pasajeros}${capacidad ? '/' + capacidad : ''} pasajero${pasajeros === 1 ? '' : 's'}</span>
          <button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;" onclick="adminToggleLista('${c}')" title="Cargar lista de pasajeros">📋${listaLen ? ' ' + listaLen : ''}</button>
          <button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;" onclick="adminToggleCursos('${c}')" title="Cursos para la Guerra de cursos">🎓${listaCursos.length ? ' ' + listaCursos.length : ''}</button>
          <button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;" onclick="adminToggleFeria('${c}')" title="Feria de la plaza: kiosco, agencia y sorteo">🎪</button>
          ${datos[c].destino ? `<button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;" onclick="adminToggleCanjes('${c}')" title="Ver canjes de comercios">🏪</button>` : ''}
          <button class="btn-eliminar-pasajero" style="width:auto;border-radius:10px;padding:4px 8px;font-size:11px;" onclick="adminTogglePoker('${c}',${!(datos[c].ajustes && datos[c].ajustes.poker === true)})" title="Póker en este viaje (apagado para estudiantiles)">🃏 ${datos[c].ajustes && datos[c].ajustes.poker === true ? 'Sí' : 'No'}</button>
          <button class="btn-finalizar-viaje" onclick="toggleCerrarViaje('${c}',${!cerrado})">${cerrado ? 'Reabrir' : 'Finalizar'}</button>
          <button class="btn-eliminar-pasajero" onclick="eliminarViaje('${c}')" title="Eliminar viaje">✕</button>
        </span>
      </div>
      ${typeof adminCursosPanelHTML === 'function' ? adminCursosPanelHTML(c, listaCursos) : ''}
      ${typeof pedidosPanelHTML === 'function' ? pedidosPanelHTML(c) : ''}
      ${typeof adminFeriaPanelHTML === 'function' ? adminFeriaPanelHTML(c, datos[c]) : ''}
      ${listaAbierta ? `
      <div style="margin:-6px 0 10px;">
        <textarea id="admin-lista-input-${c}" rows="4" style="width:100%;font-family:monospace;font-size:12.5px;border:1px solid var(--line-color,#ccc);border-radius:10px;padding:10px;margin-bottom:6px;" placeholder="Seleccioná en Excel las columnas Apellido, Nombre y (si querés) Curso, copialas (Ctrl+C) y pegalas acá (Ctrl+V). El curso tiene que estar cargado antes en el botón 🎓, con el mismo nombre.">${(datos[c].listaPasajeros || []).map(p => `${p.apellido}\t${p.nombre}${p.curso ? '\t' + p.curso : ''}`).join('\n')}</textarea>
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

function adminTogglePoker(codigo, habilitar){
  db.ref('salas/' + codigo + '/ajustes/poker').set(habilitar).then(() => {
    mostrarToast(habilitar ? 'Póker habilitado en este viaje' : 'Póker apagado en este viaje');
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
    if(typeof avatarSincronizar === 'function') avatarSincronizar();
    if(typeof cursosSincronizar === 'function') cursosSincronizar();
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
  const categoria = contenedorId.split('-').pop();
  const claseColor = categoria === 'solo' ? 'juego-tile-solo' : categoria === 'video' ? 'juego-tile-video' : categoria === 'grupoCartas' ? 'juego-tile-cartas' : 'juego-tile-grupo';
  container.classList.add('juego-tiles');
  lista.forEach(c=>{
    const boton = document.createElement('button');
    boton.className = `juego-tile ${claseColor}`;
    boton.onclick = ()=> showView(c.view);
    boton.innerHTML = `<span class="juego-tile-icono">${icono(c.icon)}</span><span class="juego-tile-nombre">${c.title}</span><span class="juego-tile-sub">${c.sub}</span>`;
    container.appendChild(boton);
  });
}

// Desde adentro de un viaje, el organizador vuelve a su panel (Viajes, comercios,
// cursos, póker) por esta tarjeta de Inicio: ese panel vive en la pantalla de entrada.
function irAlPanelOrganizador(){
  const bloque = document.getElementById('bloque-organizador');
  if(bloque) bloque.hidden = false;
  showView('codigo-viaje');
}

function organizadorTarjetaHomeHTML(){
  if(!(bingoEsOrganizador() || agenciasEsOrganizador())) return '';
  return `<div class="av-home org-home" onclick="irAlPanelOrganizador()"><div class="org-home-img">⚙️</div><div class="av-home-txt"><h3>Panel del organizador</h3><p>Viajes, cursos, comercios y póker</p></div><span class="av-home-flecha">›</span></div>`;
}

function renderHome(){
  pokerEscucharAjuste();
  const saludo = document.getElementById('home-saludo');
  saludo.textContent = '';
  if(typeof avatarMiniHTML === 'function'){
    const av = document.createElement('span');
    av.className = 'home-avatar';
    av.innerHTML = avatarMiniHTML(avatarPuestoActual(), 38);
    av.onclick = () => showView('avatar');
    saludo.appendChild(av);
    saludo.appendChild(document.createTextNode(' Hola, ' + miNombre));
  } else saludo.textContent = `${miEmoji} Hola, ${miNombre}`;
  // El link para entrar directo al viaje lo ve solo quien organiza: si lo
  // tuviera cualquier pasajero, podría reenviarlo a gente que no va en el micro.
  const elViaje = document.getElementById('home-viaje');
  if(bingoEsOrganizador() || agenciasEsOrganizador()){
    elViaje.textContent = `🔗 Viaje ${codigoViaje} · copiar`;
    elViaje.className = 'sub home-viaje-link';
    elViaje.onclick = copiarLinkViaje;
  } else {
    elViaje.textContent = `Viaje ${codigoViaje}`;
    elViaje.className = 'sub';
    elViaje.onclick = null;
  }
  // Los juegos ya están en la pestaña Juegos y el ranking en su propia
  // pestaña; Inicio se queda solo con el logo (más publicidad) y la
  // ruleta del día, sin repetir lo que ya está a un toque de distancia.
  document.getElementById('home-content').innerHTML = gEscenaHTML('cielo', `
    <div class="home-logo-banner"><img src="logo-empresa.png?v=2" alt="Logo"></div>
    ${organizadorTarjetaHomeHTML()}
    ${typeof plazaTarjetaHomeHTML === 'function' ? plazaTarjetaHomeHTML() : ''}
    ${typeof avatarTarjetaHomeHTML === 'function' ? avatarTarjetaHomeHTML() : ''}
    ${pwaInstalarHTML()}
    ${ruletaHTML()}`);
}

// Con tantos juegos la lista se hacía larga para escanear de un vistazo, así
// que quedan agrupados atrás de botones grandes que se despliegan al
// tocarlos (cada uno se abre y cierra por separado). Se muestran igual en
// Inicio y en Juegos, así en Inicio no se repite toda la lista suelta —
// por eso las funciones llevan un "vista" para no chocar los mismos ids.
// Dentro de "jugar en grupo" separamos los de cartas del resto, para no
// mezclar en una sola tira Truco con Bingo o Dibujar y Adivinar.
let juegosAbiertos = { solo: false, video: false, grupoCartas: false, grupoOtros: false };

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
    categoriaJuegosHTML(vista, 'video', 'categoria-juegos-video', '🎮', 'Video juegos', `${TARJETAS_VIDEO.length} juegos de acción`) +
    categoriaJuegosHTML(vista, 'grupoCartas', 'categoria-juegos-cartas', '🃏', 'Juegos de cartas', `${TARJETAS_GRUPO_CARTAS.length} juegos de cartas`) +
    categoriaJuegosHTML(vista, 'grupoOtros', 'categoria-juegos-grupo', '🤝', 'Jugar en grupo', `${TARJETAS_GRUPO_OTROS.length} juegos para tu grupo`);
}

function renderCategoriasEnListas(vista){
  if(juegosAbiertos.solo) renderTarjetas(TARJETAS_SOLO, `lista-${vista}-solo`);
  if(juegosAbiertos.video) renderTarjetas(TARJETAS_VIDEO, `lista-${vista}-video`);
  if(juegosAbiertos.grupoCartas) renderTarjetas(TARJETAS_GRUPO_CARTAS, `lista-${vista}-grupoCartas`);
  if(juegosAbiertos.grupoOtros) renderTarjetas(TARJETAS_GRUPO_OTROS, `lista-${vista}-grupoOtros`);
}

function renderJuegos(){
  pokerEscucharAjuste();
  document.getElementById('juegos-content').innerHTML = gEscenaHTML('neon', categoriasJuegosHTML('juegos'), 'juegos-escena');
  renderCategoriasEnListas('juegos');
}

// Trivia, Acertijos y Bingo se entran desde el menú "Juegos" del tabbar, así
// que esa pestaña queda marcada activa aunque ya estés adentro de uno de ellos.
const TABS_HIJOS_DE_JUEGOS = ['trivia', 'acertijos', 'pensamiento', 'ahorcado', 'cuatrouno', 'valija', 'memoria', 'sudoku', 'patrones', 'sopa', 'tutifruti', 'impostor', 'bingo', 'triviavivo', 'cuento', 'dibujar', 'escoba', 'chinchon', 'truco', 'buscolor', 'corredor', 'vuelo', 'serpiente', 'tetris', 'ladrillos', 'parking', 'laberinto', 'tanque', 'pinball', 'bombas', 'plataformas', 'solitario', 'videopoker', 'texas', 'plaza', 'categorias'];

// Volver desde cualquier juego: el botón ← del título, el flotante (cuando el
// juego ocupa toda la escena) y el "atrás" del celular hacen lo mismo. En la
// trivia el primer paso es volver a la lista de temas.
function volverDeJuego(){
  const activa = document.querySelector('.view.active');
  if(activa && activa.id === 'view-trivia'){ triviaVolver(); return; }
  if(activa && activa.id === 'view-plaza'){ showView('home'); return; }
  showView('juegos');
}

// Agrega la flecha de volver a todos los juegos que no la traían: dentro del
// título (tomando su lugar a la izquierda) y una flotante para cuando el
// título se oculta porque el juego ocupa toda la escena.
function juegosAgregarBotonesVolver(){
  TABS_HIJOS_DE_JUEGOS.forEach(nombre => {
    const vista = document.getElementById('view-' + nombre);
    if(!vista) return;
    const cabecera = vista.querySelector('.app-header');
    if(cabecera && !cabecera.querySelector('.btn-back')){
      const titulo = cabecera.firstElementChild;
      const envoltorio = document.createElement('div');
      envoltorio.style.cssText = 'display:flex; align-items:center; gap:10px;';
      envoltorio.innerHTML = '<button class="btn-back" aria-label="Volver" onclick="volverDeJuego()">←</button>';
      cabecera.insertBefore(envoltorio, titulo);
      envoltorio.appendChild(titulo);
    } else if(cabecera){
      cabecera.querySelector('.btn-back').setAttribute('onclick', 'volverDeJuego()');
    }
    const flotante = document.createElement('button');
    flotante.className = 'btn-back btn-back-flotante';
    flotante.setAttribute('aria-label', 'Volver');
    flotante.setAttribute('onclick', 'volverDeJuego()');
    flotante.textContent = '←';
    vista.insertBefore(flotante, vista.firstChild);
  });
}

// El botón "atrás" del celular (o el gesto) sale del juego y vuelve a la
// lista de juegos, en vez de cerrar la app. Al entrar a un juego se agrega un
// paso al historial; al salir por la flecha se descarta ese paso.
let juegoPasoHistorial = false;
window.addEventListener('popstate', () => {
  juegoPasoHistorial = false;
  const activa = document.querySelector('.view.active');
  if(activa && TABS_HIJOS_DE_JUEGOS.includes(activa.id.replace('view-', ''))){
    const seQuedaEnTrivia = activa.id === 'view-trivia' && temaActual !== null;
    volverDeJuego();
    if(seQuedaEnTrivia){ try { history.pushState({ juego: 'trivia' }, ''); juegoPasoHistorial = true; } catch(e){} }
  }
});

function showView(name){
  const activaAntes = document.querySelector('.view.active');
  if(activaAntes && activaAntes.id === 'view-plaza' && name !== 'plaza' && typeof plazaAlSalir === 'function') plazaAlSalir();
  const esJuego = TABS_HIJOS_DE_JUEGOS.includes(name);
  if(esJuego && !juegoPasoHistorial){
    try { history.pushState({ juego: name }, ''); juegoPasoHistorial = true; } catch(e){}
  } else if(!esJuego && juegoPasoHistorial){
    juegoPasoHistorial = false;
    try { history.back(); } catch(e){}
  }
  analyticsAlCambiarVista(name);
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  const tabName = (name === 'avatar' || name === 'plaza') ? 'home' : (TABS_HIJOS_DE_JUEGOS.includes(name) ? 'juegos' : name);
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
  if(name==='solitario'){ iniciarSolitario(); }
  if(name==='categorias'){ iniciarCategorias(); }
  if(name==='videopoker'){ iniciarVideoPoker(); }
  if(name==='texas'){ iniciarTexas(); }
  if(name==='avatar'){ iniciarAvatar(); }
  if(name==='plaza'){ iniciarPlaza(); }
  if(typeof ARC_JUEGOS !== 'undefined' && ARC_JUEGOS[name]){ arcIniciarVista(name); }
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
  if(typeof cursosEscuchar === 'function') cursosEscuchar();
  if(typeof cursosVistaActiva === 'function' && cursosVistaActiva()){ list.innerHTML = cursosRankingHTML(); return; }
  const filas = Object.keys(rankingPuntos)
    .map(asiento => ({ asiento, nombre: rankingPuntos[asiento].nombre, pts: rankingPuntos[asiento].pts, avatar: rankingPuntos[asiento].avatar, me: asiento === String(miAsiento) }))
    .sort((a,b)=> b.pts - a.pts);
  if(!filas.length){
    list.innerHTML = gEscenaHTML('noche', gDialogoHTML('🏆 Todavía nadie sumó puntos', 'Jugá y sumá monedas para aparecer acá.'));
    return;
  }

  const iniciales = nombre => String(nombre || '?').slice(0, 2).toUpperCase();
  const carita = (r, tam) => (typeof avatarMiniHTML === 'function' && (r.me || r.avatar)) ? avatarMiniHTML(r.me ? avatarPuestoActual() : r.avatar, tam) : iniciales(r.nombre);
  const miPuesto = filas.findIndex(r => r.me);
  // Podio: el 1° al centro y más alto, el 2° a su izquierda y el 3° a su derecha.
  const lugares = [{ pos: 1, clase: 'rk-2' }, { pos: 0, clase: 'rk-1' }, { pos: 2, clase: 'rk-3' }];
  const podioHTML = lugares.filter(l => filas[l.pos]).map(l => {
    const r = filas[l.pos];
    return `<div class="rk-puesto ${l.clase} ${r.me ? 'rk-yo' : ''}">
      ${l.pos === 0 ? '<div class="rk-corona">👑</div>' : ''}
      <div class="rk-avatar">${carita(r, 62)}</div>
      <div class="rk-nombre">${r.me ? 'Vos' : r.nombre}</div>
      <div class="rk-pts">${r.pts} pts</div>
      <div class="rk-base"><span>${MEDALLAS_RANKING[l.pos]}</span></div>
    </div>`;
  }).join('');

  const restoHTML = filas.slice(3).map((r, i) => `
    <div class="rk-fila ${r.me ? 'rk-fila-yo' : ''}">
      <span class="rk-fila-num">${i + 4}</span>
      <span class="rk-fila-avatar">${carita(r, 34)}</span>
      <span class="rk-fila-nombre">${r.me ? 'Vos' : r.nombre}<small>asiento ${r.asiento}</small></span>
      <span class="rk-fila-pts">${r.pts} pts</span>
    </div>`).join('');

  list.innerHTML = gEscenaHTML('noche', `
    ${typeof cursosSelectorHTML === 'function' ? cursosSelectorHTML() : ''}
    ${miPuesto >= 0 ? `<div class="g-hud"><span class="g-pill">Tu puesto: ${miPuesto + 1}°</span><span class="g-pill">🪙 ${filas[miPuesto].pts}</span></div>` : ''}
    <div class="rk-podio">${podioHTML}</div>
    ${restoHTML ? `<div class="rk-resto">${restoHTML}</div>` : ''}`);
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
  guardarMonedas();
  actualizarMonedasEnPantalla();
  return true;
}

function actualizarMonedasEnPantalla(){
  const el = document.getElementById('monedas-coin-count');
  if(el) el.textContent = monedasCoin;
  document.querySelectorAll('.js-monedas').forEach(e => { e.textContent = monedasCoin; });
}

// Suma o resta monedas jugando (positivo si acertaste, negativo si no);
// nunca deja el saldo en negativo. Todos los juegos usan esto, Bingo incluido,
// y también actualiza el Ranking en vivo con el mismo número.
function ganarMonedas(cantidad){
  monedasCoin = Math.max(0, monedasCoin + cantidad);
  guardarMonedas();
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

// Aviso de "sin conexión": en el micro se corta el internet seguido y los juegos en
// grupo parecen trabados. Se espera unos segundos antes de avisar para no mostrarlo
// mientras la app recién se está conectando.
let conexionAntes = null, conexionTimer = null;
function conexionVigilar(){
  try {
    db.ref('.info/connected').on('value', snap => {
      const conectado = snap.val() === true;
      const banner = document.getElementById('banner-sin-conexion');
      clearTimeout(conexionTimer);
      if(conectado){
        if(banner) banner.classList.remove('show');
        if(conexionAntes === false) mostrarToast('Conexión recuperada');
      } else {
        conexionTimer = setTimeout(() => { if(banner) banner.classList.add('show'); }, 4000);
      }
      conexionAntes = conectado;
    });
  } catch(e){}
}

document.addEventListener('DOMContentLoaded', ()=>{
  juegosAgregarBotonesVolver();
  conexionVigilar();
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

  organizadorActualizarVisibilidad();
});
