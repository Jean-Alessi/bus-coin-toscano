// Fase A de identidad de pasajero (ver conversación sobre protección de
// datos): el organizador puede pegar la lista de pasajeros del viaje (la que
// ya arma en Excel) para que cada uno elija su nombre en vez de tipearlo a
// mano — soluciona el caso de un menor que entra con el celular del padre.
//
// A propósito, de esa lista SOLO se guarda nombre y apellido en Firebase,
// aunque se pegue una columna de DNI o de "es menor": ese dato vive nada más
// que en el viaje (se borra con "Finalizar"/"Eliminar viaje", como todo lo
// demás en salas/{codigo}), así que hoy no agrega ninguna base de datos
// persistente. El DNI queda para la Fase B, cuando haya reglas de seguridad
// más cerradas y el aviso de consentimiento andando.

// Acepta filas pegadas desde Excel (separadas por tab) o por comas, con
// columnas Apellido, Nombre y, opcionalmente, DNI y "Menor" (se ignoran acá).
function listaPasajerosParsearTexto(texto){
  return (texto || '').split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(linea => {
      const cols = linea.includes('\t') ? linea.split('\t') : linea.split(',');
      return { apellido: (cols[0] || '').trim(), nombre: (cols[1] || '').trim() };
    })
    .filter(p => p.apellido || p.nombre);
}

function listaPasajerosGuardarEnViaje(codigo, texto){
  const lista = listaPasajerosParsearTexto(texto);
  return db.ref('salas/' + codigo + '/listaPasajeros').set(lista).then(() => lista.length);
}

// ---- Selector en el onboarding ----

let listaPasajerosDatos = null;
let listaPasajerosSeleccionado = null;
let listaPasajerosOmitido = false;

function listaPasajerosCargarParaOnboarding(){
  listaPasajerosDatos = null;
  listaPasajerosSeleccionado = null;
  listaPasajerosOmitido = false;
  const cont = document.getElementById('lista-pasajeros-onboard');
  if(cont) cont.innerHTML = '';
  if(!codigoViaje) return;
  db.ref('salas/' + codigoViaje + '/listaPasajeros').once('value').then(snap => {
    listaPasajerosDatos = snap.val();
    renderListaPasajerosOnboarding();
  });
}

function listaPasajerosElegir(id){
  const p = listaPasajerosDatos[id];
  if(!p) return;
  listaPasajerosSeleccionado = Object.assign({ id }, p);
  const nombreInput = document.getElementById('mi-nombre-input');
  if(nombreInput){
    nombreInput.value = `${p.nombre} ${p.apellido}`.trim();
    actualizarBotonContinuar();
  }
  renderListaPasajerosOnboarding();
}

function listaPasajerosOmitir(){
  listaPasajerosOmitido = true;
  renderListaPasajerosOnboarding();
}

function listaPasajerosVolverABuscar(){
  listaPasajerosOmitido = false;
  listaPasajerosSeleccionado = null;
  renderListaPasajerosOnboarding();
}

// Los resultados se renderizan en su propio contenedor, separado del buscador,
// para que escribir no le haga perder el foco al input en cada tecla.
function listaPasajerosRenderizarResultados(){
  const resultadosCont = document.getElementById('lista-pasajeros-resultados');
  if(!resultadosCont) return;
  const buscador = document.getElementById('lista-pasajeros-buscador');
  const filtro = (buscador ? buscador.value : '').trim().toLowerCase();
  const filtrados = listaPasajerosDatos
    .map((p, i) => Object.assign({ id: i }, p))
    .filter(p => !filtro || (p.apellido + ' ' + p.nombre).toLowerCase().includes(filtro))
    .slice(0, 8);

  resultadosCont.innerHTML = filtrados.map(p => `
    <div class="bingo-roster-item" style="cursor:pointer;" onclick="listaPasajerosElegir(${p.id})">
      <span>${p.apellido}, ${p.nombre}</span>
    </div>`).join('') || (filtro ? '<p style="color:var(--gray);font-size:13px;">No encontramos ese nombre. Podés escribir el tuyo abajo igual.</p>' : '');
}

function renderListaPasajerosOnboarding(){
  const cont = document.getElementById('lista-pasajeros-onboard');
  if(!cont) return;
  if(!listaPasajerosDatos || !listaPasajerosDatos.length){ cont.innerHTML = ''; return; }

  if(listaPasajerosOmitido){
    cont.innerHTML = `<p class="link-chico" onclick="listaPasajerosVolverABuscar()">‹ Volver a buscar en la lista de pasajeros</p>`;
    return;
  }

  if(listaPasajerosSeleccionado){
    cont.innerHTML = `
      <div class="chip-row" style="margin-bottom:14px;">
        <div class="chip selected">✓ ${listaPasajerosSeleccionado.apellido}, ${listaPasajerosSeleccionado.nombre}</div>
      </div>
      <p class="link-chico" onclick="listaPasajerosVolverABuscar()">¿No sos vos? Elegí de nuevo</p>`;
    return;
  }

  if(!document.getElementById('lista-pasajeros-buscador')){
    cont.innerHTML = `
      <div class="section-label">¿Sos vos? Buscá tu nombre en la lista del viaje</div>
      <input type="text" id="lista-pasajeros-buscador" class="bingo-input-numero" style="width:100%;margin-bottom:8px;" placeholder="Escribí tu apellido..." oninput="listaPasajerosRenderizarResultados()">
      <div id="lista-pasajeros-resultados"></div>
      <p class="link-chico" onclick="listaPasajerosOmitir()">No encuentro mi nombre / prefiero escribir el mío</p>`;
  }
  listaPasajerosRenderizarResultados();
}
