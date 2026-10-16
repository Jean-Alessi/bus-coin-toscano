// Mi personaje: un "pasajerito" redondo que cada uno viste con las monedas que
// junta jugando. Se dibuja con SVG (sin imágenes de personajes), con la B de
// Busmac en la gorra, las remeras y más.
//
// Comprar ropa gasta de la billetera (monedasCoin) y NO toca los puntos del
// ranking del viaje, que son los que definen los premios.
//
// El personaje se guarda en este celular ('avatar-estado') y se copia al
// ranking del viaje (campo "avatar") para que los demás lo vean.

const AV_PIELES = ['#FFDCC2', '#F5C29B', '#E0A06E', '#C58452', '#8D5A36', '#5C3A24'];
const AV_COLORES_PELO = ['#2A1B12', '#5A3A22', '#A56B2E', '#E2B24A', '#D6401E', '#7E57FF', '#2FB5B5'];
const AV_PELOS = [
  { id: 'corto', nombre: 'Corto' }, { id: 'largo', nombre: 'Largo' }, { id: 'rulos', nombre: 'Rulos' },
  { id: 'flequillo', nombre: 'Flequillo' }, { id: 'colita', nombre: 'Colita' }, { id: 'rapado', nombre: 'Rapado' },
];
const AV_CARAS = [
  { id: 'sonrisa', nombre: 'Sonrisa' }, { id: 'contento', nombre: 'Contento' },
  { id: 'guino', nombre: 'Guiño' }, { id: 'sorpresa', nombre: 'Sorpresa' },
];

const AV_TORSO = 'M24 120 V98 C24 84 35 76 50 76 C65 76 76 84 76 98 V120 Z';

// Logo de la empresa sobre un disco blanco, centrado en (x, y) con 'tam' de alto.
let AV_LOGO_SRC = 'logo-empresa.png';
function avLogo(x, y, tam, fondo){
  // La caja es más ancha que alta: un logo cuadrado se ajusta por el alto y uno ancho
  // (con el nombre escrito) por el ancho, sin deformarse.
  const w = tam * 1.4;
  return `${fondo ? `<circle cx="${x}" cy="${y}" r="${tam * 0.62}" fill="${fondo}"/>` : ''}<image href="${AV_LOGO_SRC}" x="${x - w / 2}" y="${y - tam / 2}" width="${w}" height="${tam}" preserveAspectRatio="xMidYMid meet"/>`;
}

// ---- Catálogo de la tienda ----
// 'deco' recibe (uid) y devuelve el SVG que va sobre el torso (recortado al torso).
const AV_REMERAS = [
  { id: 'basica', nombre: 'Remera lisa', precio: 0, color: '#9FD3FF' },
  { id: 'naranja', nombre: 'Remera naranja', precio: 15, color: '#F28A1E' },
  { id: 'rayas', nombre: 'Rayas rojas', precio: 25, color: '#FFFFFF', deco: () => [82, 90, 98, 106, 114].map(y => `<rect x="20" y="${y}" width="60" height="4" fill="#E5484D"/>`).join('') },
  { id: 'celeste', nombre: 'Celeste y blanca', precio: 35, color: '#FFFFFF', deco: () => [24, 36, 48, 60, 72].map(x => `<rect x="${x}" y="70" width="6" height="52" fill="#7EC8FF"/>`).join('') },
  { id: 'hawaiana', nombre: 'Hawaiana', precio: 40, color: '#2FB5B5', deco: () => [[36, 90, '#FFD84D'], [58, 86, '#FF7AA8'], [46, 104, '#FF7AA8'], [66, 106, '#FFD84D'], [34, 112, '#FFD84D']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`).join('') },
  { id: 'estrellas', nombre: 'Estrellas', precio: 50, color: '#1D2B6B', deco: () => [[36, 88], [60, 84], [48, 100], [68, 104], [34, 110], [54, 114]].map(([x, y]) => `<path d="M${x} ${y - 3.4} L${x + 1} ${y - 1} L${x + 3.4} ${y} L${x + 1} ${y + 1} L${x} ${y + 3.4} L${x - 1} ${y + 1} L${x - 3.4} ${y} L${x - 1} ${y - 1} Z" fill="#FFF3B0"/>`).join('') },
  { id: 'chofer', nombre: 'Camisa de chofer', precio: 60, color: '#BFE6FF', deco: () => `<path d="M40 76 L50 90 L60 76 Z" fill="#fff"/><path d="M48 89 L52 89 L53.5 105 L50 109 L46.5 105 Z" fill="#0F2A4D"/><rect x="56" y="96" width="9" height="8" rx="1.5" fill="#9CCBEA"/>` },
  { id: 'busmac', nombre: 'Remera ' + marcaCorta(), precio: 80, color: '#0F2A4D', deco: () => `<rect x="20" y="98" width="60" height="5" fill="#E6A817"/>${avLogo(50, 89, 14, '#fff')}`, mangas: '#E6A817' },
  { id: 'egresado', nombre: 'Buzo de egresado', precio: 100, color: '#7E57FF', deco: () => `<rect x="20" y="104" width="60" height="4" fill="#FFD84D"/>${avLogo(50, 91, 13, '#fff')}`, mangas: '#5D3FD4' },
  { id: 'dorada', nombre: 'Campera dorada', precio: 130, color: '#E6A817', deco: () => `<path d="M50 78 V122" stroke="#8B5A12" stroke-width="1.6"/><path d="M30 90 Q36 84 42 86" stroke="#FFF3B0" stroke-width="2" fill="none" stroke-linecap="round"/>`, mangas: '#C98F0F' },
];

// 'capa' dice dónde se dibuja: la gorra va arriba de todo.
const AV_GORRAS = [
  { id: 'lana', nombre: 'Gorro de lana', precio: 20, svg: () => `<path d="M24 36 C24 14 76 14 76 36 Z" fill="#E5484D"/><rect x="22" y="32" width="56" height="9" rx="4.5" fill="#B83238"/><circle cx="50" cy="13" r="6" fill="#FFE9A6"/>` },
  { id: 'paja', nombre: 'Sombrero de paja', precio: 30, svg: () => `<ellipse cx="50" cy="35" rx="42" ry="9" fill="#E6C27A"/><path d="M28 34 C28 10 72 10 72 34 Z" fill="#F0D391"/><rect x="28" y="28" width="44" height="6" fill="#B5651D"/>` },
  { id: 'visera', nombre: 'Gorra ' + marcaCorta(), precio: 45, svg: () => `<path d="M22 38 C22 12 78 12 78 38 Z" fill="#0F2A4D"/><path d="M46 38 H92 C92 43 70 46 46 42 Z" fill="#E6A817"/>${avLogo(50, 26, 15, '#fff')}` },
  { id: 'birrete', nombre: 'Birrete de egresado', precio: 70, svg: () => `<rect x="30" y="28" width="40" height="10" fill="#1B1F3A"/><path d="M12 24 L50 8 L88 24 L50 40 Z" fill="#2A2F57"/><path d="M50 24 L84 27 V40" stroke="#FFD84D" stroke-width="2" fill="none"/><circle cx="84" cy="42" r="3" fill="#FFD84D"/>` },
  { id: 'corona', nombre: 'Corona', precio: 150, svg: () => `<path d="M26 34 L30 12 L40 24 L50 8 L60 24 L70 12 L74 34 Z" fill="#FFD84D" stroke="#C9A227" stroke-width="1.5" stroke-linejoin="round"/><circle cx="50" cy="26" r="3" fill="#E5484D"/><circle cx="36" cy="28" r="2" fill="#4FB8FF"/><circle cx="64" cy="28" r="2" fill="#5BE88D"/>` },
];

const AV_CARA_ACC = [
  { id: 'anteojos', nombre: 'Anteojos', precio: 20, svg: () => `<circle cx="40" cy="48" r="8" fill="rgba(255,255,255,.25)" stroke="#2A1B12" stroke-width="2"/><circle cx="60" cy="48" r="8" fill="rgba(255,255,255,.25)" stroke="#2A1B12" stroke-width="2"/><path d="M48 48 H52" stroke="#2A1B12" stroke-width="2"/>` },
  { id: 'sol', nombre: 'Anteojos de sol', precio: 30, svg: () => `<rect x="30" y="42" width="18" height="12" rx="5" fill="#12161F"/><rect x="52" y="42" width="18" height="12" rx="5" fill="#12161F"/><path d="M48 46 H52" stroke="#12161F" stroke-width="2.5"/><path d="M33 45 L38 45" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/><path d="M55 45 L60 45" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>` },
  { id: 'bigote', nombre: 'Bigote', precio: 25, svg: () => `<path d="M50 57 C46 52 38 54 36 58 C40 60 46 59 50 58 C54 59 60 60 64 58 C62 54 54 52 50 57 Z" fill="#2A1B12"/>` },
  { id: 'auriculares', nombre: 'Auriculares', precio: 40, svg: () => `<path d="M22 50 C20 14 80 14 78 50" stroke="#2B3A67" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="15" y="44" width="10" height="16" rx="5" fill="#E5484D"/><rect x="75" y="44" width="10" height="16" rx="5" fill="#E5484D"/>` },
];

const AV_MANO_ACC = [
  { id: 'mate', nombre: 'Mate', precio: 35, svg: () => `<rect x="76" y="98" width="14" height="18" rx="6" fill="#8B5A2B"/><rect x="76" y="98" width="14" height="5" rx="2.5" fill="#5BBF5A"/><path d="M86 96 L96 80" stroke="#C7CEDA" stroke-width="2.2" stroke-linecap="round"/><circle cx="96.5" cy="79.5" r="2.2" fill="#C7CEDA"/>` },
  { id: 'valija', nombre: 'Valija', precio: 40, svg: () => `<rect x="68" y="98" width="26" height="20" rx="3" fill="#B5651D"/><rect x="68" y="106" width="26" height="2.5" fill="#8B4A12"/><path d="M76 98 V94 H86 V98" stroke="#6B3A10" stroke-width="2" fill="none"/><rect x="79" y="105" width="4" height="5" rx="1" fill="#FFD84D"/>` },
  { id: 'mochila', nombre: 'Mochila', precio: 30, capa: 'cuerpo', svg: () => `<path d="M33 78 L30 114" stroke="#E5484D" stroke-width="6" stroke-linecap="round"/><path d="M67 78 L70 114" stroke="#E5484D" stroke-width="6" stroke-linecap="round"/>` },
];

const AV_FONDOS = [
  { id: 'celeste', nombre: 'Cielo', precio: 0, svg: u => `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6AC2FF"/><stop offset="1" stop-color="#CFEBFF"/></linearGradient></defs><rect width="100" height="120" rx="16" fill="url(#${u}f)"/><circle cx="20" cy="22" r="9" fill="rgba(255,255,255,.85)"/><circle cx="30" cy="24" r="7" fill="rgba(255,255,255,.85)"/>` },
  { id: 'menta', nombre: 'Menta', precio: 10, svg: u => `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5BE88D"/><stop offset="1" stop-color="#C2F7D8"/></linearGradient></defs><rect width="100" height="120" rx="16" fill="url(#${u}f)"/>` },
  { id: 'atardecer', nombre: 'Atardecer', precio: 25, svg: u => `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A5B"/><stop offset="1" stop-color="#FFD78A"/></linearGradient></defs><rect width="100" height="120" rx="16" fill="url(#${u}f)"/><circle cx="76" cy="26" r="11" fill="#FFF3B0"/>` },
  { id: 'ruta', nombre: 'La ruta', precio: 35, svg: u => `<rect width="100" height="120" rx="16" fill="#7EC8FF"/><path d="M0 80 L100 80 L100 120 L0 120 Z" fill="#4B5260"/><path d="M0 80 C30 72 70 72 100 80 Z" fill="#7AC37A"/>${[6, 30, 54, 78].map(x => `<rect x="${x}" y="103" width="14" height="3" fill="#F5D547"/>`).join('')}<circle cx="80" cy="20" r="9" fill="#FFF3B0"/>` },
  { id: 'noche', nombre: 'Noche', precio: 40, svg: u => `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151A57"/><stop offset="1" stop-color="#4B3AA8"/></linearGradient></defs><rect width="100" height="120" rx="16" fill="url(#${u}f)"/>${[[14, 14], [34, 30], [70, 16], [86, 38], [22, 52], [78, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#FFF3B0"/>`).join('')}<circle cx="80" cy="18" r="8" fill="#FFF3B0"/><circle cx="84" cy="15" r="7" fill="#2A2F8A"/>` },
  { id: 'oro', nombre: 'Dorado', precio: 60, svg: u => `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD84D"/><stop offset="1" stop-color="#FFF3B0"/></linearGradient></defs><rect width="100" height="120" rx="16" fill="url(#${u}f)"/>${[[16, 20], [82, 28], [24, 62], [76, 70]].map(([x, y]) => `<path d="M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z" fill="#fff" opacity=".8"/>`).join('')}` },
];

const AV_POR_ID = lista => lista.reduce((o, x) => { o[x.id] = x; return o; }, {});
const AV_IDX = { remera: AV_POR_ID(AV_REMERAS), gorra: AV_POR_ID(AV_GORRAS), caraAcc: AV_POR_ID(AV_CARA_ACC), manoAcc: AV_POR_ID(AV_MANO_ACC), fondo: AV_POR_ID(AV_FONDOS) };

const AV_PUESTO_INICIAL = { piel: 1, peloEstilo: 'corto', peloColor: 1, cara: 'sonrisa', remera: 'basica', gorra: null, caraAcc: null, manoAcc: null, fondo: 'celeste' };

// ---- Dibujo ----
let avContador = 0;

function avPeloAtras(estilo, c){
  if(estilo === 'largo') return `<path d="M20 48 C20 18 80 18 80 48 V86 C80 94 71 96 66 88 V64 H34 V88 C29 96 20 94 20 86 Z" fill="${c}"/>`;
  if(estilo === 'colita') return `<circle cx="80" cy="38" r="9" fill="${c}"/><circle cx="76" cy="34" r="3" fill="#E5484D"/>`;
  return '';
}
function avPeloFrente(estilo, c){
  const casquete = `<path d="M22 46 C20 20 38 14 50 14 C64 14 80 22 78 46 C72 34 62 30 50 30 C38 30 28 34 22 46 Z" fill="${c}"/>`;
  if(estilo === 'rulos') return [[28, 32], [40, 22], [54, 21], [67, 29], [74, 42], [24, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10.5" fill="${c}"/>`).join('');
  if(estilo === 'flequillo') return `${casquete}<path d="M24 44 C26 26 74 26 76 44 C68 40 62 34 50 38 C38 34 32 40 24 44 Z" fill="${c}"/>`;
  if(estilo === 'rapado') return `<path d="M24 42 C26 24 74 24 76 42 C68 32 32 32 24 42 Z" fill="${c}" opacity=".55"/>`;
  return casquete;
}

function avCara(id){
  const ojo = '#2A1B12';
  const mejillas = `<circle cx="33" cy="58" r="4.4" fill="rgba(255,110,110,.35)"/><circle cx="67" cy="58" r="4.4" fill="rgba(255,110,110,.35)"/>`;
  const ojosAbiertos = (dx2 = 0) => `<ellipse cx="40" cy="48" rx="3.2" ry="4.2" fill="${ojo}"/><circle cx="41" cy="46.5" r="1.1" fill="#fff"/><ellipse cx="60" cy="48" rx="3.2" ry="4.2" fill="${ojo}"/><circle cx="61" cy="46.5" r="1.1" fill="#fff"/>`;
  if(id === 'contento') return `<path d="M36 49 Q40 43 44 49" stroke="${ojo}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M56 49 Q60 43 64 49" stroke="${ojo}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${mejillas}<path d="M41 57 Q50 69 59 57 Z" fill="#7A1F2A"/><path d="M43 58 H57" stroke="#fff" stroke-width="2"/>`;
  if(id === 'guino') return `<ellipse cx="40" cy="48" rx="3.2" ry="4.2" fill="${ojo}"/><circle cx="41" cy="46.5" r="1.1" fill="#fff"/><path d="M56 49 Q60 45 64 49" stroke="${ojo}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${mejillas}<path d="M42 58 Q50 65 58 58" stroke="${ojo}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  if(id === 'sorpresa') return `${ojosAbiertos()}${mejillas}<ellipse cx="50" cy="61" rx="3.6" ry="4.6" fill="#7A1F2A"/>`;
  return `${ojosAbiertos()}${mejillas}<path d="M42 58 Q50 65 58 58" stroke="${ojo}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
}

// 'p' es el personaje; 'tam' el alto en px; opts.busto recorta cabeza y hombros.
function avatarSVG(p, tam, opts){
  p = Object.assign({}, AV_PUESTO_INICIAL, p || {});
  const o = opts || {};
  const u = 'av' + (++avContador);
  const piel = AV_PIELES[p.piel] || AV_PIELES[1];
  const peloColor = AV_COLORES_PELO[p.peloColor] || AV_COLORES_PELO[1];
  const remera = AV_IDX.remera[p.remera] || AV_IDX.remera.basica;
  const fondo = AV_IDX.fondo[p.fondo] || AV_IDX.fondo.celeste;
  const gorra = p.gorra && AV_IDX.gorra[p.gorra];
  const caraAcc = p.caraAcc && AV_IDX.caraAcc[p.caraAcc];
  const manoAcc = p.manoAcc && AV_IDX.manoAcc[p.manoAcc];
  const manga = remera.mangas || remera.color;

  const cuerpo = `
    <clipPath id="${u}t"><path d="${AV_TORSO}"/></clipPath>
    <rect x="14" y="84" width="15" height="29" rx="7.5" fill="${manga}"/><rect x="71" y="84" width="15" height="29" rx="7.5" fill="${manga}"/>
    <circle cx="21.5" cy="114" r="6.5" fill="${piel}"/><circle cx="78.5" cy="114" r="6.5" fill="${piel}"/>
    <path d="${AV_TORSO}" fill="${remera.color}"/>
    ${remera.deco ? `<g clip-path="url(#${u}t)">${remera.deco(u)}</g>` : ''}`;
  const cuello = `<rect x="43" y="66" width="14" height="14" rx="4" fill="${piel}"/><path d="M43 74 Q50 80 57 74" fill="rgba(0,0,0,.08)"/>`;
  const cabeza = `<circle cx="23" cy="49" r="5.5" fill="${piel}"/><circle cx="77" cy="49" r="5.5" fill="${piel}"/><circle cx="50" cy="46" r="27" fill="${piel}"/>`;

  const contenido = `
    ${o.sinFondo ? '' : fondo.svg(u)}
    ${avPeloAtras(p.peloEstilo, peloColor)}
    ${cuerpo}
    ${manoAcc && manoAcc.capa === 'cuerpo' ? manoAcc.svg() : ''}
    ${cuello}${cabeza}
    ${avCara(p.cara)}
    ${avPeloFrente(p.peloEstilo, peloColor)}
    ${caraAcc ? caraAcc.svg() : ''}
    ${gorra ? gorra.svg() : ''}
    ${manoAcc && manoAcc.capa !== 'cuerpo' ? manoAcc.svg() : ''}`;

  const vb = o.busto ? '8 4 84 84' : '0 0 100 120';
  const ancho = o.busto ? tam : tam * 100 / 120;
  return `<svg class="av-svg" viewBox="${vb}" width="${Math.round(ancho)}" height="${tam}" role="img" aria-label="Personaje">${contenido}</svg>`;
}

// Cuadradito redondo con la cara (para el ranking y los saludos).
function avatarMiniHTML(p, tam){
  return `<span class="av-mini" style="width:${tam}px;height:${tam}px;">${avatarSVG(p, tam, { busto: true })}</span>`;
}

// ---- Estado del personaje (en este celular) ----

const AV_OPCIONALES = ['gorra', 'caraAcc', 'manoAcc'];
let avEstado = null;

function avCargar(){
  if(avEstado) return;
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem('avatar-estado')); } catch(e){}
  avEstado = {
    puesto: Object.assign({}, AV_PUESTO_INICIAL, (guardado && guardado.puesto) || {}),
    dueno: (guardado && Array.isArray(guardado.dueno)) ? guardado.dueno : [],
  };
}

function avGuardar(){
  try { localStorage.setItem('avatar-estado', JSON.stringify(avEstado)); } catch(e){}
  avatarSincronizar();
}

function avatarPuestoActual(){ avCargar(); return avEstado.puesto; }

// Copia el personaje al ranking del viaje para que los demás lo vean.
function avatarSincronizar(){
  if(typeof miAsiento === 'undefined' || !miAsiento || !miNombre || typeof codigoViaje === 'undefined' || !codigoViaje) return;
  avCargar();
  const compacto = {};
  Object.keys(avEstado.puesto).forEach(k => { if(avEstado.puesto[k] != null) compacto[k] = avEstado.puesto[k]; });
  try { rankingRefPuntos().child(String(miAsiento)).update({ avatar: compacto }); } catch(e){}
}

function avTieneItem(cat, id){
  const it = AV_IDX[cat] && AV_IDX[cat][id];
  return !!it && (it.precio === 0 || avEstado.dueno.includes(cat + ':' + id));
}

// ---- Pantalla "Mi personaje" ----

const AV_TABS = [['cuerpo', 'Cuerpo'], ['remera', 'Remeras'], ['gorra', 'Gorras'], ['caraAcc', 'Cara'], ['manoAcc', 'Mano'], ['fondo', 'Fondos']];
const AV_CATALOGOS = { remera: AV_REMERAS, gorra: AV_GORRAS, caraAcc: AV_CARA_ACC, manoAcc: AV_MANO_ACC, fondo: AV_FONDOS };
const AV_BIENVENIDA = 60;
let avTab = 'cuerpo';
let avPendiente = null;

function iniciarAvatar(){
  avCargar();
  avTab = 'cuerpo';
  avPendiente = null;
  let regalado = false;
  try { regalado = localStorage.getItem('avatar-regalo') === 'si'; } catch(e){}
  if(!regalado){
    try { localStorage.setItem('avatar-regalo', 'si'); } catch(e){}
    if(typeof regalarMonedas === 'function') regalarMonedas(AV_BIENVENIDA);
    if(typeof mostrarToast === 'function') mostrarToast('¡Regalo de bienvenida: +' + AV_BIENVENIDA + ' monedas para tu personaje!', 'gain');
  }
  avatarSincronizar();
  renderAvatar();
}

function avElegirTab(tab){ avTab = tab; avPendiente = null; renderAvatar(); }

function avElegirCuerpo(campo, valor){
  avEstado.puesto[campo] = valor;
  avPendiente = null;
  avGuardar();
  renderAvatar();
}

function avTocarItem(cat, id){
  const p = avEstado.puesto;
  if(avTieneItem(cat, id)){
    p[cat] = (p[cat] === id && AV_OPCIONALES.includes(cat)) ? null : id;
    avPendiente = null;
    avGuardar();
    reproducirTono('tick');
  } else {
    avPendiente = { cat, id };
  }
  renderAvatar();
}

function avQuitar(cat){
  avEstado.puesto[cat] = null;
  avPendiente = null;
  avGuardar();
  renderAvatar();
}

function avComprar(){
  if(!avPendiente) return;
  const { cat, id } = avPendiente;
  const it = AV_IDX[cat][id];
  if(!gastarMonedas(it.precio)){
    mostrarToast('Te faltan ' + (it.precio - monedasCoin) + ' monedas. ¡Seguí jugando!');
    return;
  }
  avEstado.dueno.push(cat + ':' + id);
  avEstado.puesto[cat] = id;
  avPendiente = null;
  avGuardar();
  reproducirTono('bonus');
  mostrarToast('¡Ya es tuyo! ' + it.nombre, 'gain');
  renderAvatar();
}

function avCancelar(){ avPendiente = null; renderAvatar(); }

function avItemHTML(cat, it, p){
  const tiene = avTieneItem(cat, it.id), puesto = p[cat] === it.id;
  const vista = Object.assign({}, p, { [cat]: it.id });
  const etiqueta = puesto ? 'Puesto' : tiene ? 'Tuyo' : '🪙 ' + it.precio;
  return `<button class="av-item${puesto ? ' av-item-sel' : ''}${!tiene ? ' av-item-bloq' : ''}${avPendiente && avPendiente.cat === cat && avPendiente.id === it.id ? ' av-item-pend' : ''}" onclick="avTocarItem('${cat}','${it.id}')">
    ${avatarSVG(vista, 76)}<span class="av-item-nombre">${it.nombre}</span><span class="av-item-precio">${etiqueta}</span></button>`;
}

function avTabCuerpoHTML(p){
  const circulos = (lista, campo, actual) => lista.map((c, i) => `<button class="av-color${actual === i ? ' av-color-sel' : ''}" style="background:${c}" aria-label="Opción ${i + 1}" onclick="avElegirCuerpo('${campo}',${i})"></button>`).join('');
  const tiles = (lista, campo, actual, extra) => lista.map(x => `<button class="av-item av-item-chico${actual === x.id ? ' av-item-sel' : ''}" onclick="avElegirCuerpo('${campo}','${x.id}')">${avatarMiniHTML(Object.assign({}, p, { [campo]: x.id }, extra || {}), 54)}<span class="av-item-nombre">${x.nombre}</span></button>`).join('');
  return `
    <div class="av-seccion">Piel</div><div class="av-colores">${circulos(AV_PIELES, 'piel', p.piel)}</div>
    <div class="av-seccion">Peinado</div><div class="av-grilla av-grilla-3">${tiles(AV_PELOS, 'peloEstilo', p.peloEstilo)}</div>
    <div class="av-seccion">Color de pelo</div><div class="av-colores">${circulos(AV_COLORES_PELO, 'peloColor', p.peloColor)}</div>
    <div class="av-seccion">Expresión</div><div class="av-grilla av-grilla-4">${tiles(AV_CARAS, 'cara', p.cara)}</div>`;
}

function renderAvatar(){
  const cont = document.getElementById('avatar-content');
  if(!cont) return;
  avCargar();
  const p = avEstado.puesto;
  const pend = avPendiente ? AV_IDX[avPendiente.cat][avPendiente.id] : null;
  const vistaPrevia = pend ? Object.assign({}, p, { [avPendiente.cat]: avPendiente.id }) : p;

  let cuerpo;
  if(avTab === 'cuerpo') cuerpo = avTabCuerpoHTML(p);
  else {
    const lista = AV_CATALOGOS[avTab];
    const ninguno = AV_OPCIONALES.includes(avTab)
      ? `<button class="av-item${p[avTab] == null ? ' av-item-sel' : ''}" onclick="avQuitar('${avTab}')"><span class="av-nada">∅</span><span class="av-item-nombre">Ninguno</span><span class="av-item-precio">${p[avTab] == null ? 'Puesto' : 'Sacar'}</span></button>`
      : '';
    cuerpo = `<div class="av-grilla av-grilla-3">${ninguno}${lista.map(it => avItemHTML(avTab, it, p)).join('')}</div>`;
  }

  const confirmar = pend ? `<div class="av-confirmar"><div>${pend.nombre} · <b>🪙 ${pend.precio}</b></div><div class="av-confirmar-botones"><button class="gbtn gbtn-chico-texto gbtn-no" onclick="avCancelar()">Ahora no</button><button class="gbtn gbtn-chico-texto" onclick="avComprar()">Comprar</button></div></div>` : '';

  cont.innerHTML = gEscenaHTML('cielo', `
    <div class="g-hud"><span class="g-pill">🪙 <span class="js-monedas">${monedasCoin}</span></span><span class="g-pill">Mi personaje</span></div>
    <div class="av-preview">${avatarSVG(vistaPrevia, 176)}</div>
    ${confirmar}
    <div class="av-tabs">${AV_TABS.map(([id, nombre]) => `<button class="av-tab${avTab === id ? ' av-tab-sel' : ''}" onclick="avElegirTab('${id}')">${nombre}</button>`).join('')}</div>
    <div class="av-cuerpo">${cuerpo}</div>
    <p class="av-nota">Las monedas que gastás acá no bajan tu puntaje del ranking.</p>`, 'av-escena');
}

// Tarjeta de Inicio: lleva a la pantalla del personaje.
function avatarTarjetaHomeHTML(){
  avCargar();
  return `<div class="av-home" onclick="showView('avatar')"><div class="av-home-img">${avatarSVG(avEstado.puesto, 84)}</div><div class="av-home-txt"><h3>Mi personaje</h3><p>Vestilo con las monedas que juntes jugando</p></div><span class="av-home-flecha">›</span></div>`;
}

// ---- Sprites para el mundo (canvas): el personaje sin fondo, como imagen ----
const AV_SPRITES = {};
let avLogoDatos = null;

function avLogoComoDatos(){
  if(avLogoDatos) return avLogoDatos;
  try {
    if(typeof ARC_LOGO !== 'undefined' && ARC_LOGO.complete && ARC_LOGO.naturalWidth){
      const c = document.createElement('canvas');
      c.width = ARC_LOGO.naturalWidth; c.height = ARC_LOGO.naturalHeight;
      c.getContext('2d').drawImage(ARC_LOGO, 0, 0);
      avLogoDatos = c.toDataURL('image/png');
    }
  } catch(e){}
  return avLogoDatos;
}

// Devuelve una imagen (que puede tardar un instante en cargar) del personaje, con cache.
function avatarSprite(p){
  const clave = JSON.stringify(p || {});
  if(AV_SPRITES[clave]) return AV_SPRITES[clave];
  const previo = AV_LOGO_SRC;
  const datos = avLogoComoDatos();
  if(datos) AV_LOGO_SRC = datos;
  const svg = avatarSVG(p, 120, { sinFondo: true }).replace('class="av-svg"', 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
  AV_LOGO_SRC = previo;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  AV_SPRITES[clave] = img;
  return img;
}
