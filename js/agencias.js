// Identidad de agencia: reemplaza el PIN compartido para las tres cosas
// que de verdad necesitan saber "a qué agencia pertenece esta persona" —
// crear viajes, administrar el listado de viajes, y administrar el
// catálogo de comercios (con sus precios reales acordados con terceros).
//
// El PIN de organizador que siguen usando los juegos (Bingo, El Impostor,
// etc. — ver BINGO_PIN_ORGANIZADOR) NO cambia: ese es un rol liviano
// dentro de UN viaje puntual ("quién es el que canta los números"), no
// una cuenta de negocio, y no hace falta pedirle login a un coordinador
// solo para eso.
//
// Cómo se da de alta una agencia nueva (hoy, manual — no hay señalización
// pública todavía): se crea el usuario en Firebase Auth (email/contraseña)
// y se escribe a mano en la base `usuarios/{uid}/agenciaId` y
// `agencias/{agenciaId}/nombre`. Las reglas de Firebase impiden que un
// cliente escriba esos dos nodos por su cuenta.

let agenciaActualId = null;
let agenciaActualNombre = null;

function agenciasEsOrganizador(){
  return !!(firebase.auth().currentUser && agenciaActualId);
}

function agenciasCargarPerfil(){
  const user = firebase.auth().currentUser;
  if(!user) return Promise.resolve(null);
  return db.ref('usuarios/' + user.uid).once('value').then(snap => {
    agenciaActualId = snap.child('agenciaId').val() || null;
    if(!agenciaActualId) return null;
    return db.ref('agencias/' + agenciaActualId + '/nombre').once('value');
  }).then(snapNombre => {
    agenciaActualNombre = (snapNombre && snapNombre.val()) || agenciaActualId;
  });
}

function agenciasMensajeError(code){
  if(code === 'auth/invalid-email') return 'Ese email no es válido.';
  if(code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Email o contraseña incorrectos.';
  if(code === 'auth/too-many-requests') return 'Demasiados intentos, esperá un minuto y probá de nuevo.';
  return 'No se pudo iniciar sesión. Probá de nuevo.';
}

// idPrefijo identifica los inputs de ESTE formulario en particular (puede
// haber más de uno en la misma pantalla — crear viaje, admin viajes, admin
// comercios) y alRograrFn es el nombre de la función a llamar una vez
// logueado, para que cada pantalla siga con lo suyo.
// alLograrFnNombre es el NOMBRE (string) de la función global a llamar una
// vez logueado — no la función en sí, para poder insertarla en el HTML.
function agenciasFormularioLoginHTML(idPrefijo, alLograrFnNombre){
  return `
    <div class="bingo-pin-box">
      <p style="font-size:12.5px;color:var(--gray);margin-bottom:8px;">Iniciá sesión con tu cuenta de agencia para continuar.</p>
      <input type="email" id="${idPrefijo}-email" class="bingo-input-numero" style="width:100%;" placeholder="Email" autocomplete="username">
      <input type="password" id="${idPrefijo}-pass" class="bingo-input-numero" style="width:100%;" placeholder="Contraseña" autocomplete="current-password">
      <button class="btn-primary" onclick="agenciasIntentarLogin('${idPrefijo}', '${alLograrFnNombre}')">Ingresar</button>
      <p id="${idPrefijo}-error" class="bingo-pin-error"></p>
      <p class="link-chico" onclick="agenciasOlvidoContrasena('${idPrefijo}')">¿Olvidaste tu contraseña?</p>
    </div>`;
}

function agenciasIntentarLogin(idPrefijo, alLograrFnNombre){
  const email = (document.getElementById(`${idPrefijo}-email`) || {}).value || '';
  const pass = (document.getElementById(`${idPrefijo}-pass`) || {}).value || '';
  const error = document.getElementById(`${idPrefijo}-error`);
  if(error) error.textContent = '';
  firebase.auth().signInWithEmailAndPassword(email.trim(), pass)
    .then(() => agenciasCargarPerfil())
    .then(() => {
      if(!agenciaActualId){
        if(error) error.textContent = 'Esta cuenta todavía no está vinculada a ninguna agencia.';
        firebase.auth().signOut();
        return;
      }
      window[alLograrFnNombre]();
    })
    .catch(e => { if(error) error.textContent = agenciasMensajeError(e.code); });
}

function agenciasOlvidoContrasena(idPrefijo){
  const email = (document.getElementById(`${idPrefijo}-email`) || {}).value || '';
  const error = document.getElementById(`${idPrefijo}-error`);
  if(!email.trim()){ if(error) error.textContent = 'Escribí tu email arriba primero.'; return; }
  firebase.auth().sendPasswordResetEmail(email.trim())
    .then(() => { if(error){ error.style.color = ''; error.textContent = 'Te mandamos un mail para elegir una contraseña nueva.'; } })
    .catch(e => { if(error) error.textContent = agenciasMensajeError(e.code); });
}

function agenciasCerrarSesion(){
  firebase.auth().signOut();
  agenciaActualId = null;
  agenciaActualNombre = null;
  if(typeof renderPinCodigoNuevo === 'function') renderPinCodigoNuevo();
  if(typeof renderAdminViajes === 'function') renderAdminViajes();
  if(typeof renderAdminComercios === 'function') renderAdminComercios();
}

// Restaura la sesión sola al recargar la página (Firebase la persiste en
// el navegador) — así el organizador no tiene que loguearse cada vez.
firebase.auth().onAuthStateChanged(user => {
  agenciasCargarPerfil().then(() => {
    if(typeof renderPinCodigoNuevo === 'function') renderPinCodigoNuevo();
    if(typeof renderAdminViajes === 'function') renderAdminViajes();
    if(typeof renderAdminComercios === 'function') renderAdminComercios();
    if(typeof organizadorActualizarVisibilidad === 'function') organizadorActualizarVisibilidad();
  });
});
