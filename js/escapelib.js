// Piezas para armar aventuras de Bus-queda sin repetir código: objetos "para mirar", "para juntar", puertas y papeles.
// Se usan en escape2.js en adelante (la primera aventura está escrita a mano).

const EO = {
  // Objeto que solo se examina (dice una frase).
  mirar(id, nombre, x, y, w, h, texto, expr, extra){
    return Object.assign({ id, nombre, x, y, w, h, pie: x + w / 2, toque: async e => { await e.yo(texto, expr || 'normal'); } }, extra || {});
  },
  // Objeto que se levanta una sola vez: da 'item' y marca 'flag'.
  tomar(id, nombre, x, y, w, h, item, flag, texto, extra){
    return Object.assign({ id, nombre, x, y, w, h, pie: x + w / 2, visible: e => !e.flag(flag), toque: async e => { e.set(flag); await e.dar(item, texto); } }, extra || {});
  },
  // Algo para leer: abre un papel y lo deja anotado en el cuaderno.
  leer(id, nombre, x, y, w, h, o, extra){
    return Object.assign({ id, nombre, x, y, w, h, pie: o.pie != null ? o.pie : x + w / 2, toque: async e => {
      if(o.nota) e.nota(o.nota, o.titulo, o.html);
      await e.leer(o.titulo, o.html, o.clase ? { clase: o.clase } : undefined);
      if(o.despues) await o.despues(e);
    } }, extra || {});
  },
  // Puerta a otra habitación. 'flag' = se abrió; 'llave' = item que la abre; 'bloqueada' = qué dice si está cerrada.
  puerta(o){
    return Object.assign({ nombre: o.nombre, pie: o.pie != null ? o.pie : o.x + o.w / 2 }, { id: o.id, x: o.x, y: o.y, w: o.w, h: o.h }, {
      toque: async e => {
        if(!o.flag || e.flag(o.flag)){ await e.ir(o.a, o.xa, o.dir || 1); return; }
        await e.yo(o.bloqueada || 'Está cerrada.', 'serio');
      },
      usar: o.llave ? { [o.llave]: async e => {
        e.quitar(o.llave); e.set(o.flag); e.sfx('puerta');
        await e.yo(o.abrir || 'Se abrió.', 'preocupado'); await e.ir(o.a, o.xa, o.dir || 1);
      } } : undefined,
    });
  },
  // Para que una pista dependa de lo que ya se hizo.
  pista(id, cuando, textos){ return { id, cuando, textos }; },
};
