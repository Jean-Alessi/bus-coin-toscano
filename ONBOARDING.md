# Onboarding de un cliente nuevo (empresa de micros)

Cada cliente tiene su **propio sitio** (con su propia marca y su propio
link), pero desde que existe la multi-tenencia (ver más abajo) **todos
comparten el mismo proyecto de Firebase** — el aislamiento entre empresas
ya no depende de tener bases separadas, sino de que cada viaje y cada
comercio quedan etiquetados con la agencia dueña, y las reglas de Firebase
impiden que una agencia lea o escriba los datos de otra. En la práctica,
dar de alta un cliente nuevo es: clonar este repo, cambiar la marca,
registrar la agencia en la base compartida, y desplegar en su propio
dominio.

## 1. Firebase — usar el MISMO proyecto de todos (no crear uno nuevo)

`js/firebase-config.js` **se deja tal cual está** — todas las empresas
usan el proyecto `bus-coin-fb008`. Lo único que hay que hacer acá es
registrar a la agencia nueva en la base compartida (esto sí es manual,
todavía no hay una pantalla de alta automática):

1. Crear la cuenta de organizador en Firebase Auth (Console → Authentication
   → Users → Add user, con el email del cliente) — o desde la consola del
   navegador con `firebase.auth().createUserWithEmailAndPassword(...)`.
2. Elegir un `agenciaId` para el cliente (minúsculas, sin espacios, ej.
   `expreso-norte`) y escribir estos dos nodos en Realtime Database
   (Console → Realtime Database → Datos, o por CLI con
   `firebase database:set`):
   - `usuarios/{uid}/agenciaId` = `"expreso-norte"` (el `uid` es el que
     te da Firebase al crear la cuenta del paso 1).
   - `agencias/expreso-norte/nombre` = `"Expreso Norte S.A."`
3. Mandarle un reset de contraseña (`firebase.auth().sendPasswordResetEmail(...)`)
   para que el cliente elija su propia contraseña — nunca hace falta que
   vos ni el cliente le den play a una contraseña por chat/mail.

Con esto, cuando ese organizador se loguea en "Administrar viajes" o
"Administrar comercios", el sistema sabe que es de `expreso-norte` y
solo ve/edita lo suyo — aunque esté usando el mismo sitio y la misma
base que Busmac.

## 2. Marca del cliente — un solo archivo

Todo lo que identifica a este cliente (nombre, mensaje de bienvenida, PIN
de organizador) vive en **`js/marca.js`**. Es el único archivo que hay
que tocar para esto — el resto de la app (`index.html`, `comercios.js`,
`bingo.js`, etc.) lee estos valores de ahí, así que no hay que cazar el
nombre viejo en varios lugares ni arriesgarse a olvidar uno:

```js
const MARCA = {
  marcaPrincipal: 'nombre-empresa',       // texto de la barra de arriba
  marcaSecundaria: 'lo que hacen',        // texto chico al lado
  nombreCompleto: 'Nombre Empresa S.A.',  // <title> de la pestaña
  bienvenida: '¡Bienvenido a bordo! ...', // mensaje al abrir la app
  pinOrganizador: '0000',                 // ver nota abajo
};
```

Ojo con `pinOrganizador`: ya **no** sirve para entrar a "Administrar
viajes" ni "Administrar comercios" (eso ahora es con la cuenta del paso
1). Sigue usándose solo para el rol liviano de "director" dentro de un
viaje puntual — quién canta los números en Bingo, quién dirige El
Impostor. Igual conviene poner uno propio por cliente, para que no sea
el mismo que ya circula en otra empresa.

Además de este archivo:

- **`logo-empresa.png`** — reemplazar el archivo por el logo de la nueva
  empresa (mismo nombre de archivo, para no tener que tocar código).
- **`manifest.json`**: `"name"` y `"short_name"` si el cliente quiere ver
  otro nombre al instalar la PWA (por defecto dice "Bus Coin", se puede
  dejar así si el cliente no pide lo contrario).
- **`CNAME`**: dominio propio del cliente, si va a tener uno (o se puede
  quedar en el subdominio que dé GitHub Pages / Firebase Hosting).

El ícono "B" de Bus Coin (`icons/icon-192.png` y el resto de `icons/`)
**se queda igual siempre** — es el ícono del producto, no de la empresa
cliente.

## 3. Contenido de los juegos (revisar, no siempre hay que tocarlo)

La mayoría del contenido (trivia, sopa de letras, cartas, etc.) es
genérico y sirve para cualquier cliente sin cambios. Lo único puntual a
revisar caso por caso:

- `js/tienda.js` → `PREMIOS_DEFAULT`: son solo textos de ejemplo
  ("Ej: ...") en el campo donde el organizador carga sus premios, no hace
  falta tocarlos.
- Si el cliente pide contenido específico de su empresa/región (ej. otros
  destinos en la Sopa de letras), se arma aparte — no es parte del
  onboarding estándar.

## 4. Desplegar

- Mismo mecanismo que ya usa Busmac: sitio estático (GitHub Pages u otro
  hosting estático), sin backend propio — todo el estado en vivo vive en
  el Firebase Realtime Database compartido, aislado por `agenciaId`.
- Recordar bumpear los `?v=N` de `index.html` si se toca algo del código
  compartido, para que no quede cacheado en los celulares.

## 5. Legal / comercial (fuera del código)

- Esto no lo resuelve el código: hace falta un acuerdo de servicio simple
  con cada cliente (qué incluye, precio, quién es responsable de qué con
  los datos de sus pasajeros). Recomendado pasarlo por un abogado antes de
  firmarlo — puedo ayudar a armar un primer borrador si querés, pero no
  reemplaza la revisión legal real.
