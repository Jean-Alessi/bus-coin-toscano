// Azar sin repeticiones seguidas. Un sorteo "puro" puede devolver lo mismo dos veces seguidas; acá
// se usa una "bolsa": se reparten TODOS los elementos (en orden al azar) antes de volver a repetir
// alguno, y cuando la bolsa se vacía y se rearma, los que salieron últimos quedan al final para
// que no abran la bolsa siguiente. La bolsa se guarda en este celular (por juego y por viaje), así
// sigue aunque se cierre la app.

function azarBarajar(lista){
  const l = lista.slice();
  for(let i = l.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const t = l[i]; l[i] = l[j]; l[j] = t;
  }
  return l;
}

function azarEstado(clave, total){
  let est = null;
  try { est = JSON.parse(localStorage.getItem(clave) || 'null'); } catch(e){}
  if(!est || est.total !== total || !Array.isArray(est.bolsa) || !Array.isArray(est.ultimos)) est = { total, bolsa: [], ultimos: [] };
  return est;
}

// Próximo número de 0 a total-1. 'evitar' = cuántos de los últimos no deberían abrir la bolsa nueva.
function azarSiguiente(clave, total, evitar){
  if(!(total > 0)) return 0;
  const k = 'azar-' + clave + '-' + ((typeof codigoViaje !== 'undefined' && codigoViaje) || '');
  const est = azarEstado(k, total);
  if(!est.bolsa.length){
    const n = Math.min(evitar == null ? 4 : evitar, Math.floor(total / 2));
    const ultimos = est.ultimos.slice(-n);
    const todos = []; for(let i = 0; i < total; i++) todos.push(i);
    est.bolsa = azarBarajar(todos.filter(i => !ultimos.includes(i))).concat(azarBarajar(ultimos));
  }
  const i = est.bolsa.shift();
  est.ultimos.push(i); est.ultimos = est.ultimos.slice(-16);
  try { localStorage.setItem(k, JSON.stringify(est)); } catch(e){}
  return i;
}

// 'cuantos' números distintos seguidos de la misma bolsa (por ejemplo, las preguntas de una partida).
function azarVarios(clave, total, cuantos){
  const r = [];
  for(let i = 0; i < Math.min(cuantos, total); i++) r.push(azarSiguiente(clave, total, Math.min(cuantos, 4)));
  return r;
}
