// Configuración de la empresa que usa esta copia de Bus Coin.
//
// Para dar de alta un cliente nuevo, este es EL archivo a tocar para su
// nombre y su PIN de juegos (además de reemplazar logo-empresa.png por su
// logo). js/firebase-config.js se deja igual: todos los clientes comparten
// el mismo proyecto de Firebase, aislados por agencia — ver ONBOARDING.md.
const MARCA = {
  // Como aparece en la barra de arriba, al lado del logo.
  marcaPrincipal: 'toscano',
  marcaSecundaria: 'viajes',

  // <title> de la pestaña del navegador.
  nombreCompleto: 'Turismo Toscano',

  // Mensaje de bienvenida en la pantalla de "código de viaje".
  bienvenida: '¡Bienvenido a bordo! 🚌 Arrancamos esta nueva experiencia con Turismo Toscano',

  // PIN de 4 dígitos para el rol de "director" dentro de un viaje puntual
  // (quién canta los números en Bingo, etc.) — ya no hace falta para
  // administrar viajes ni comercios, eso ahora es con cuenta y contraseña.
  // Nunca reusar el PIN de otro cliente.
  pinOrganizador: '7391',
};

// Aplica el nombre/mensaje de marca a los elementos ya presentes en el
// HTML. Este script se carga al final del body, así que el DOM ya existe
// y no hace falta esperar a DOMContentLoaded.
document.title = MARCA.nombreCompleto;
const elMarcaStatusbar = document.getElementById('marca-statusbar');
if(elMarcaStatusbar) elMarcaStatusbar.innerHTML = `${MARCA.marcaPrincipal} <em>${MARCA.marcaSecundaria}</em>`;
const elMarcaBienvenida = document.getElementById('marca-bienvenida');
if(elMarcaBienvenida) elMarcaBienvenida.textContent = MARCA.bienvenida;
