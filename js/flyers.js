// Flyers propios de los comercios: se puede subir una imagen o un PDF directamente desde el celular o la
// compu, sin pasar por Google Drive. Para que se vea igual en cualquier celular (los PDF no se ven bien
// adentro de la app en Android), al subirlo se convierte en imágenes: una por página (hasta 5), comprimidas.
// Dónde se guarda: las páginas, aparte del catálogo (así no se bajan cada vez que alguien abre la lista), en
//   agencias/{agencia}/comercios/{destino}__flyers/{comercio}/paginas
// y en el comercio solo queda "flyerSubido: true" y "flyerPaginas: N". Si un comercio tiene flyer subido,
// se muestra ese; si no, el link de siempre (flyerUrl).

const FLYER_MAX_PAGINAS = 5;
const FLYER_MAX_ENTRADA = 15 * 1024 * 1024;   // tamaño máximo del archivo elegido
const FLYER_ANCHO = 1100;                      // ancho de cada página en píxeles
const FLYER_MAX_CHARS = 2800000;               // tope del total guardado (unos 2 MB de imagen)
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let flyerPendiente = {};   // clave ('nuevo' o id del comercio) -> { nombre, paginas: [dataURL] } listo para guardar
let flyerQuitar = {};      // id -> true: hay que borrar el flyer subido al guardar
const flyerCache = {};     // id -> [dataURL] (lo que ya se bajó)

const flyerEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function flyerRefPaginas(agenciaId, destino, comercioId){
  return db.ref('agencias/' + agenciaId + '/comercios/' + comerciosSlugDestino(destino) + '__flyers/' + comercioId);
}

// ---- Convertir lo que se eligió en imágenes ----

function flyerCargarPdfJs(){
  if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = PDFJS_URL; s.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; ok(window.pdfjsLib); } catch(e){ mal(e); } };
    s.onerror = () => mal(new Error('No se pudo cargar el lector de PDF (¿sin conexión?)'));
    document.head.appendChild(s);
  });
}

function flyerCanvasAJpeg(canvas, calidad){ return canvas.toDataURL('image/jpeg', calidad); }

// Devuelve las páginas como imágenes JPEG (dataURL), reduciendo la calidad si pasan el tope de tamaño.
async function flyerProcesarArchivo(file){
  if(!file) throw new Error('No elegiste ningún archivo');
  if(file.size > FLYER_MAX_ENTRADA) throw new Error('El archivo pesa más de 15 MB');
  const lienzos = [];
  const esPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if(esPdf){
    const pdfjs = await flyerCargarPdfJs();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const n = Math.min(pdf.numPages, FLYER_MAX_PAGINAS);
    for(let i = 1; i <= n; i++){
      const pagina = await pdf.getPage(i);
      const base = pagina.getViewport({ scale: 1 });
      const vista = pagina.getViewport({ scale: FLYER_ANCHO / base.width });
      const c = document.createElement('canvas');
      c.width = Math.round(vista.width); c.height = Math.round(vista.height);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await pagina.render({ canvasContext: ctx, viewport: vista }).promise;
      lienzos.push(c);
    }
  } else if(/^image\//.test(file.type)){
    const img = await new Promise((ok, mal) => { const u = URL.createObjectURL(file); const i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => mal(new Error('No se pudo leer la imagen')); i.src = u; });
    const k = Math.min(1, FLYER_ANCHO / img.naturalWidth);
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    lienzos.push(c);
  } else {
    throw new Error('Elegí una imagen (JPG, PNG) o un PDF');
  }
  let calidad = 0.82, paginas = lienzos.map(c => flyerCanvasAJpeg(c, calidad));
  while(paginas.join('').length > FLYER_MAX_CHARS && calidad > 0.45){ calidad -= 0.1; paginas = lienzos.map(c => flyerCanvasAJpeg(c, calidad)); }
  if(paginas.join('').length > FLYER_MAX_CHARS) throw new Error('El flyer es muy pesado: probá con menos páginas o una imagen más chica');
  return paginas;
}

// ---- En el formulario del comercio ----

function flyerSubirHTML(clave, c){
  const subido = c && c.flyerSubido;
  return `<div class="flyer-subir">
    <label class="btn-ghost flyer-subir-btn">📎 Subir flyer (imagen o PDF)<input type="file" accept="image/*,application/pdf" style="display:none" onchange="flyerElegido(this, '${flyerEsc(clave)}')"></label>
    <div class="flyer-estado" id="flyer-estado-${flyerEsc(clave)}">${subido ? `✅ Ya hay un flyer subido (${Number(c.flyerPaginas) || 1} pág.). Si subís otro, lo reemplaza. <a onclick="flyerMarcarQuitar('${flyerEsc(clave)}')">Quitarlo</a>` : 'No es necesario Drive: elegí el archivo y tocá Guardar.'}</div>
  </div>`;
}

function flyerEstado(clave, html){ const el = document.getElementById('flyer-estado-' + clave); if(el) el.innerHTML = html; }

async function flyerElegido(input, clave){
  const file = input.files && input.files[0];
  if(!file) return;
  flyerEstado(clave, '⏳ Procesando ' + flyerEsc(file.name) + '...');
  try {
    const paginas = await flyerProcesarArchivo(file);
    flyerPendiente[clave] = { nombre: file.name, paginas };
    delete flyerQuitar[clave];
    flyerEstado(clave, '✅ ' + flyerEsc(file.name) + ': ' + paginas.length + ' página' + (paginas.length === 1 ? '' : 's') + ' lista' + (paginas.length === 1 ? '' : 's') + '. Se sube cuando toques Guardar.');
  } catch(e){
    delete flyerPendiente[clave];
    flyerEstado(clave, '❌ ' + flyerEsc(e.message || 'No se pudo procesar el archivo'));
  }
  input.value = '';
}

function flyerMarcarQuitar(clave){
  flyerQuitar[clave] = true; delete flyerPendiente[clave];
  flyerEstado(clave, '🗑️ El flyer subido se borra cuando toques Guardar.');
}

// Campos que se suman a los datos del comercio antes de guardarlo.
function flyerCamposParaGuardar(clave){
  if(flyerPendiente[clave]) return { flyerSubido: true, flyerPaginas: flyerPendiente[clave].paginas.length };
  if(flyerQuitar[clave]) return { flyerSubido: null, flyerPaginas: null };
  return {};
}

// Después de guardar el comercio: sube (o borra) las páginas.
function flyerAplicar(clave, comercioId){
  const ref = flyerRefPaginas(agenciaActualId, comerciosAdminDestino, comercioId);
  let promesa = Promise.resolve();
  if(flyerPendiente[clave]){
    const p = flyerPendiente[clave];
    promesa = ref.set({ nombre: String(p.nombre).slice(0, 80), paginas: p.paginas, t: firebase.database.ServerValue.TIMESTAMP });
    delete flyerCache[comercioId];
  } else if(flyerQuitar[clave]){
    promesa = ref.remove(); delete flyerCache[comercioId];
  }
  delete flyerPendiente[clave]; delete flyerQuitar[clave];
  return promesa;
}

// ---- Para los pasajeros ----

async function flyerMostrarSubido(comercioId, nombre){
  const caja = document.getElementById('flyer-sub-box');
  if(!caja) return;
  try {
    if(!flyerCache[comercioId]){
      const snap = await flyerRefPaginas(comerciosAgenciaViaje, comerciosDestinoViaje, comercioId).once('value');
      const v = snap.val();
      flyerCache[comercioId] = v && v.paginas ? (Array.isArray(v.paginas) ? v.paginas : Object.keys(v.paginas).map(k => v.paginas[k])) : [];
    }
    const paginas = flyerCache[comercioId];
    const caja2 = document.getElementById('flyer-sub-box');
    if(!caja2) return; // ya cambió de pantalla
    caja2.innerHTML = paginas.length
      ? paginas.map((src, i) => '<img src="' + src + '" alt="Flyer de ' + flyerEsc(nombre) + ' (página ' + (i + 1) + ')" class="comercio-flyer-img flyer-pagina">').join('')
      : '<p class="cm-nota">No se pudo cargar el flyer.</p>';
  } catch(e){
    const c3 = document.getElementById('flyer-sub-box');
    if(c3) c3.innerHTML = '<p class="cm-nota">No se pudo cargar el flyer (¿sin conexión?).</p>';
  }
}
