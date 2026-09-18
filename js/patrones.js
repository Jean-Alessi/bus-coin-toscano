// Patrones: juego solo — se muestran 4 figuras que siguen una regla (giran,
// cambian de color, de forma, o se van sumando de a una) y hay que elegir
// cuál sigue entre 4 opciones. Los 20 puzzles de PATRONES_BANCO están
// generados y verificados de antemano (una sola respuesta correcta posible
// por construcción, con un script aparte) — nada se arma al azar en vivo
// salvo el orden en que aparecen y las opciones que se mezclan.

const PATRONES_BANCO = {"facil":[{"tipo":"rotacion","secuencia":[{"forma":"estrella","color":"#3B9B5A","rot":45,"escala":1,"cantidad":1},{"forma":"estrella","color":"#3B9B5A","rot":135,"escala":1,"cantidad":1},{"forma":"estrella","color":"#3B9B5A","rot":225,"escala":1,"cantidad":1},{"forma":"estrella","color":"#3B9B5A","rot":315,"escala":1,"cantidad":1}],"correcta":{"forma":"estrella","color":"#3B9B5A","rot":45,"escala":1,"cantidad":1},"distractores":[{"forma":"estrella","color":"#3B9B5A","rot":315,"escala":1,"cantidad":1},{"forma":"estrella","color":"#3B9B5A","rot":135,"escala":1,"cantidad":1},{"forma":"estrella","color":"#3B9B5A","rot":225,"escala":1,"cantidad":1}]},{"tipo":"cantidad","secuencia":[{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":2},{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":3},{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4}],"correcta":{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":5},"distractores":[{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4},{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":6},{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":3}]},{"tipo":"color","secuencia":[{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#8E44AD","rot":0,"escala":1,"cantidad":1}],"correcta":{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},"distractores":[{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#8E44AD","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#E8720F","rot":0,"escala":1,"cantidad":1}]},{"tipo":"forma","secuencia":[{"forma":"triangulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"estrella","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1}],"correcta":{"forma":"triangulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},"distractores":[{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"estrella","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1}]},{"tipo":"rotacion","secuencia":[{"forma":"triangulo","color":"#8E44AD","rot":30,"escala":1,"cantidad":1},{"forma":"triangulo","color":"#8E44AD","rot":75,"escala":1,"cantidad":1},{"forma":"triangulo","color":"#8E44AD","rot":120,"escala":1,"cantidad":1},{"forma":"triangulo","color":"#8E44AD","rot":165,"escala":1,"cantidad":1}],"correcta":{"forma":"triangulo","color":"#8E44AD","rot":210,"escala":1,"cantidad":1},"distractores":[{"forma":"triangulo","color":"#8E44AD","rot":120,"escala":1,"cantidad":1},{"forma":"triangulo","color":"#8E44AD","rot":165,"escala":1,"cantidad":1},{"forma":"triangulo","color":"#8E44AD","rot":345,"escala":1,"cantidad":1}]},{"tipo":"cantidad","secuencia":[{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":2},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":3},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4}],"correcta":{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":5},"distractores":[{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":3},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":6}]},{"tipo":"color","secuencia":[{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"rombo","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"rombo","color":"#8E44AD","rot":0,"escala":1,"cantidad":1}],"correcta":{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},"distractores":[{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"rombo","color":"#8E44AD","rot":0,"escala":1,"cantidad":1},{"forma":"rombo","color":"#E8720F","rot":0,"escala":1,"cantidad":1}]},{"tipo":"forma","secuencia":[{"forma":"rombo","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"estrella","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#E8720F","rot":0,"escala":1,"cantidad":1}],"correcta":{"forma":"rombo","color":"#E8720F","rot":0,"escala":1,"cantidad":1},"distractores":[{"forma":"circulo","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"estrella","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#E8720F","rot":0,"escala":1,"cantidad":1}]},{"tipo":"rotacion","secuencia":[{"forma":"rombo","color":"#0F2A4D","rot":45,"escala":1,"cantidad":1},{"forma":"rombo","color":"#0F2A4D","rot":90,"escala":1,"cantidad":1},{"forma":"rombo","color":"#0F2A4D","rot":135,"escala":1,"cantidad":1},{"forma":"rombo","color":"#0F2A4D","rot":180,"escala":1,"cantidad":1}],"correcta":{"forma":"rombo","color":"#0F2A4D","rot":225,"escala":1,"cantidad":1},"distractores":[{"forma":"rombo","color":"#0F2A4D","rot":315,"escala":1,"cantidad":1},{"forma":"rombo","color":"#0F2A4D","rot":180,"escala":1,"cantidad":1},{"forma":"rombo","color":"#0F2A4D","rot":135,"escala":1,"cantidad":1}]},{"tipo":"cantidad","secuencia":[{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":5},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":4},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":3},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":2}],"correcta":{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},"distractores":[{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":4},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":3},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":2}]},{"tipo":"color","secuencia":[{"forma":"cuadrado","color":"#8E44AD","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1}],"correcta":{"forma":"cuadrado","color":"#8E44AD","rot":0,"escala":1,"cantidad":1},"distractores":[{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#E8720F","rot":0,"escala":1,"cantidad":1}]},{"tipo":"forma","secuencia":[{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"estrella","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"triangulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1}],"correcta":{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},"distractores":[{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"triangulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"estrella","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1}]}],"dificil":[{"tipo":"cantidad+forma","secuencia":[{"forma":"estrella","color":"#8E44AD","rot":0,"escala":1,"cantidad":2},{"forma":"cuadrado","color":"#8E44AD","rot":0,"escala":1,"cantidad":3},{"forma":"circulo","color":"#8E44AD","rot":0,"escala":1,"cantidad":4},{"forma":"triangulo","color":"#8E44AD","rot":0,"escala":1,"cantidad":5}],"correcta":{"forma":"estrella","color":"#8E44AD","rot":0,"escala":1,"cantidad":6},"distractores":[{"forma":"estrella","color":"#8E44AD","rot":0,"escala":1,"cantidad":5},{"forma":"cuadrado","color":"#8E44AD","rot":0,"escala":1,"cantidad":5},{"forma":"cuadrado","color":"#8E44AD","rot":0,"escala":1,"cantidad":6}]},{"tipo":"cantidad+forma","secuencia":[{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":2},{"forma":"estrella","color":"#3B9B5A","rot":0,"escala":1,"cantidad":3},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4},{"forma":"triangulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":5}],"correcta":{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":6},"distractores":[{"forma":"estrella","color":"#3B9B5A","rot":0,"escala":1,"cantidad":6},{"forma":"estrella","color":"#3B9B5A","rot":0,"escala":1,"cantidad":5},{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":5}]},{"tipo":"cantidad+forma","secuencia":[{"forma":"rombo","color":"#E8720F","rot":0,"escala":1,"cantidad":1},{"forma":"estrella","color":"#E8720F","rot":0,"escala":1,"cantidad":2},{"forma":"cuadrado","color":"#E8720F","rot":0,"escala":1,"cantidad":3},{"forma":"triangulo","color":"#E8720F","rot":0,"escala":1,"cantidad":4}],"correcta":{"forma":"rombo","color":"#E8720F","rot":0,"escala":1,"cantidad":5},"distractores":[{"forma":"estrella","color":"#E8720F","rot":0,"escala":1,"cantidad":5},{"forma":"estrella","color":"#E8720F","rot":0,"escala":1,"cantidad":4},{"forma":"rombo","color":"#E8720F","rot":0,"escala":1,"cantidad":4}]},{"tipo":"cantidad+forma","secuencia":[{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":1},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":2},{"forma":"estrella","color":"#3B9B5A","rot":0,"escala":1,"cantidad":3},{"forma":"triangulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4}],"correcta":{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":5},"distractores":[{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4},{"forma":"rombo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":5},{"forma":"circulo","color":"#3B9B5A","rot":0,"escala":1,"cantidad":4}]},{"tipo":"rotacion+color","secuencia":[{"forma":"estrella","color":"#E8720F","rot":30,"escala":1,"cantidad":1},{"forma":"estrella","color":"#8E44AD","rot":120,"escala":1,"cantidad":1},{"forma":"estrella","color":"#3B9B5A","rot":210,"escala":1,"cantidad":1},{"forma":"estrella","color":"#0F2A4D","rot":300,"escala":1,"cantidad":1}],"correcta":{"forma":"estrella","color":"#E8720F","rot":30,"escala":1,"cantidad":1},"distractores":[{"forma":"estrella","color":"#8E44AD","rot":120,"escala":1,"cantidad":1},{"forma":"estrella","color":"#E8720F","rot":120,"escala":1,"cantidad":1},{"forma":"estrella","color":"#E8720F","rot":210,"escala":1,"cantidad":1}]},{"tipo":"cantidad+forma","secuencia":[{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":1},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":2},{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":3},{"forma":"estrella","color":"#0F2A4D","rot":0,"escala":1,"cantidad":4}],"correcta":{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":5},"distractores":[{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":4},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":5},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":4}]},{"tipo":"rotacion+color","secuencia":[{"forma":"estrella","color":"#E8720F","rot":30,"escala":1,"cantidad":1},{"forma":"estrella","color":"#0F2A4D","rot":120,"escala":1,"cantidad":1},{"forma":"estrella","color":"#8E44AD","rot":210,"escala":1,"cantidad":1},{"forma":"estrella","color":"#3B9B5A","rot":300,"escala":1,"cantidad":1}],"correcta":{"forma":"estrella","color":"#E8720F","rot":30,"escala":1,"cantidad":1},"distractores":[{"forma":"estrella","color":"#E8720F","rot":120,"escala":1,"cantidad":1},{"forma":"estrella","color":"#0F2A4D","rot":120,"escala":1,"cantidad":1},{"forma":"estrella","color":"#E8720F","rot":210,"escala":1,"cantidad":1}]},{"tipo":"cantidad+forma","secuencia":[{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":2},{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":3},{"forma":"circulo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":4},{"forma":"estrella","color":"#0F2A4D","rot":0,"escala":1,"cantidad":5}],"correcta":{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":6},"distractores":[{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":6},{"forma":"rombo","color":"#0F2A4D","rot":0,"escala":1,"cantidad":5},{"forma":"cuadrado","color":"#0F2A4D","rot":0,"escala":1,"cantidad":5}]}],"avanzado":[{"tipo":"manija","secuencia":[{"tipo":"manija","angulo":30},{"tipo":"manija","angulo":90},{"tipo":"manija","angulo":150},{"tipo":"manija","angulo":210}],"correcta":{"tipo":"manija","angulo":270},"distractores":[{"tipo":"manija","angulo":90},{"tipo":"manija","angulo":150},{"tipo":"manija","angulo":330}]},{"tipo":"relleno","secuencia":[{"tipo":"relleno","fraccion":0},{"tipo":"relleno","fraccion":1},{"tipo":"relleno","fraccion":2},{"tipo":"relleno","fraccion":3}],"correcta":{"tipo":"relleno","fraccion":4},"distractores":[{"tipo":"relleno","fraccion":6},{"tipo":"relleno","fraccion":3},{"tipo":"relleno","fraccion":7}]},{"tipo":"rayas","secuencia":[{"tipo":"rayas","rayas":1},{"tipo":"rayas","rayas":2},{"tipo":"rayas","rayas":3},{"tipo":"rayas","rayas":4}],"correcta":{"tipo":"rayas","rayas":5},"distractores":[{"tipo":"rayas","rayas":4},{"tipo":"rayas","rayas":6},{"tipo":"rayas","rayas":3}]},{"tipo":"esquina","secuencia":[{"tipo":"esquina","esquina":1},{"tipo":"esquina","esquina":2},{"tipo":"esquina","esquina":3},{"tipo":"esquina","esquina":0}],"correcta":{"tipo":"esquina","esquina":1},"distractores":[{"tipo":"esquina","esquina":0},{"tipo":"esquina","esquina":2},{"tipo":"esquina","esquina":3}]},{"tipo":"manija","secuencia":[{"tipo":"manija","angulo":0},{"tipo":"manija","angulo":60},{"tipo":"manija","angulo":120},{"tipo":"manija","angulo":180}],"correcta":{"tipo":"manija","angulo":240},"distractores":[{"tipo":"manija","angulo":60},{"tipo":"manija","angulo":120},{"tipo":"manija","angulo":180}]},{"tipo":"relleno","secuencia":[{"tipo":"relleno","fraccion":0},{"tipo":"relleno","fraccion":1},{"tipo":"relleno","fraccion":2},{"tipo":"relleno","fraccion":3}],"correcta":{"tipo":"relleno","fraccion":4},"distractores":[{"tipo":"relleno","fraccion":3},{"tipo":"relleno","fraccion":7},{"tipo":"relleno","fraccion":2}]},{"tipo":"rayas","secuencia":[{"tipo":"rayas","rayas":1},{"tipo":"rayas","rayas":2},{"tipo":"rayas","rayas":3},{"tipo":"rayas","rayas":4}],"correcta":{"tipo":"rayas","rayas":5},"distractores":[{"tipo":"rayas","rayas":4},{"tipo":"rayas","rayas":6},{"tipo":"rayas","rayas":3}]},{"tipo":"esquina","secuencia":[{"tipo":"esquina","esquina":3},{"tipo":"esquina","esquina":0},{"tipo":"esquina","esquina":1},{"tipo":"esquina","esquina":2}],"correcta":{"tipo":"esquina","esquina":3},"distractores":[{"tipo":"esquina","esquina":0},{"tipo":"esquina","esquina":1},{"tipo":"esquina","esquina":2}]},{"tipo":"manija","secuencia":[{"tipo":"manija","angulo":0},{"tipo":"manija","angulo":45},{"tipo":"manija","angulo":90},{"tipo":"manija","angulo":135}],"correcta":{"tipo":"manija","angulo":180},"distractores":[{"tipo":"manija","angulo":270},{"tipo":"manija","angulo":90},{"tipo":"manija","angulo":135}]},{"tipo":"relleno","secuencia":[{"tipo":"relleno","fraccion":0},{"tipo":"relleno","fraccion":1},{"tipo":"relleno","fraccion":2},{"tipo":"relleno","fraccion":3}],"correcta":{"tipo":"relleno","fraccion":4},"distractores":[{"tipo":"relleno","fraccion":2},{"tipo":"relleno","fraccion":7},{"tipo":"relleno","fraccion":5}]},{"tipo":"rayas","secuencia":[{"tipo":"rayas","rayas":1},{"tipo":"rayas","rayas":2},{"tipo":"rayas","rayas":3},{"tipo":"rayas","rayas":4}],"correcta":{"tipo":"rayas","rayas":5},"distractores":[{"tipo":"rayas","rayas":3},{"tipo":"rayas","rayas":6},{"tipo":"rayas","rayas":4}]},{"tipo":"esquina","secuencia":[{"tipo":"esquina","esquina":3},{"tipo":"esquina","esquina":0},{"tipo":"esquina","esquina":1},{"tipo":"esquina","esquina":2}],"correcta":{"tipo":"esquina","esquina":3},"distractores":[{"tipo":"esquina","esquina":1},{"tipo":"esquina","esquina":2},{"tipo":"esquina","esquina":0}]}]};

const PATRONES_NOMBRE_NIVEL = { facil: 'Fácil', dificil: 'Difícil', avanzado: 'Avanzado' };

const PATRONES_FORMA_SVG = {
  circulo: '<circle cx="12" cy="12" r="9"/>',
  cuadrado: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
  triangulo: '<polygon points="12,3 21,20 3,20"/>',
  estrella: '<polygon points="12,2 14.7,9 22,9.3 16.2,14.1 18.2,21.2 12,17.1 5.8,21.2 7.8,14.1 2,9.3 9.3,9"/>',
  rombo: '<polygon points="12,2 22,12 12,22 2,12"/>',
};

// JSON.stringify alcanza como clave: siempre se comparan items del mismo
// tipo entre sí (armados por el mismo generador), así que el orden de las
// propiedades es consistente.
function patronesItemKey(it){ return JSON.stringify(it); }

const PATRONES_COLOR_LINEA = '#0F2A4D';

// Nivel "Avanzado": la figura de AFUERA se mantiene igual y lo que cambia es
// un detalle interno (una manija que gira, una porción rellena que crece,
// la cantidad de rayas, un punto que salta de esquina en esquina) — más
// parecido a un test de razonamiento real que a cambiar la figura entera.
function patronesFiguraAvanzadaHTML(item, tamano){
  const c = PATRONES_COLOR_LINEA;
  if(item.tipo === 'manija'){
    const rad = item.angulo * Math.PI / 180;
    const x2 = (12 + 8 * Math.sin(rad)).toFixed(2);
    const y2 = (12 - 8 * Math.cos(rad)).toFixed(2);
    return `<svg viewBox="0 0 24 24" width="${tamano}" height="${tamano}">
      <circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="1.6"/>
      <line x1="12" y1="12" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="1.2" fill="${c}"/>
    </svg>`;
  }
  if(item.tipo === 'relleno'){
    const frac = item.fraccion / 8;
    let relleno = '';
    if(frac >= 1){
      relleno = `<circle cx="12" cy="12" r="9" fill="${c}"/>`;
    } else if(frac > 0){
      const ang = frac * 360 * Math.PI / 180;
      const x = (12 + 9 * Math.sin(ang)).toFixed(2);
      const y = (12 - 9 * Math.cos(ang)).toFixed(2);
      const largeArc = frac > 0.5 ? 1 : 0;
      relleno = `<path d="M12,12 L12,3 A9,9 0 ${largeArc},1 ${x},${y} Z" fill="${c}"/>`;
    }
    return `<svg viewBox="0 0 24 24" width="${tamano}" height="${tamano}">
      ${relleno}
      <circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="1.6"/>
    </svg>`;
  }
  if(item.tipo === 'rayas'){
    const apiceY = 4, baseY = 20, medioX = 12, mitadBase = 8.5;
    let lineas = '';
    for(let i = 1; i <= item.rayas; i++){
      const y = apiceY + (baseY - apiceY) * (i / (item.rayas + 1));
      const mitadAncho = mitadBase * (y - apiceY) / (baseY - apiceY);
      lineas += `<line x1="${(medioX - mitadAncho).toFixed(2)}" y1="${y.toFixed(2)}" x2="${(medioX + mitadAncho).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${c}" stroke-width="1.4"/>`;
    }
    return `<svg viewBox="0 0 24 24" width="${tamano}" height="${tamano}">
      <polygon points="${medioX},${apiceY} ${medioX + mitadBase},${baseY} ${medioX - mitadBase},${baseY}" fill="none" stroke="${c}" stroke-width="1.6"/>
      ${lineas}
    </svg>`;
  }
  // esquina
  const puntos = [[6.5, 6.5], [17.5, 6.5], [17.5, 17.5], [6.5, 17.5]];
  const [cx, cy] = puntos[item.esquina];
  return `<svg viewBox="0 0 24 24" width="${tamano}" height="${tamano}">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="${c}" stroke-width="1.6"/>
    <circle cx="${cx}" cy="${cy}" r="1.8" fill="${c}"/>
  </svg>`;
}

function patronesFiguraHTML(item, tamano){
  tamano = tamano || 40;
  if(item.tipo === 'manija' || item.tipo === 'relleno' || item.tipo === 'rayas' || item.tipo === 'esquina'){
    return patronesFiguraAvanzadaHTML(item, tamano);
  }
  const unaFigura = size => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="transform:rotate(${item.rot}deg); flex-shrink:0;"><g fill="${item.color}">${PATRONES_FORMA_SVG[item.forma]}</g></svg>`;
  if(item.cantidad <= 1) return unaFigura(tamano);
  const chica = Math.round(tamano * 0.42);
  return `<div style="display:flex; flex-wrap:wrap; gap:2px; align-items:center; justify-content:center; width:${tamano}px;">${Array.from({ length: item.cantidad }).map(() => unaFigura(chica)).join('')}</div>`;
}

let patronesNivelElegido = 'facil';
let patronesOrden = [];
let patronesIndice = 0;
let patronesPuzzle = null;
let patronesOpciones = []; // 4 items mezclados
let patronesRespuesta = null; // indice elegido, o null
let patronesAciertos = 0;
let patronesFase = 'inicio'; // 'inicio' | 'jugando' | 'final'

function iniciarPatrones(){
  patronesFase = 'inicio';
  renderPatrones();
}

function patronesElegirNivel(nivel){
  patronesNivelElegido = nivel;
  renderPatrones();
}

function patronesComenzar(){
  patronesOrden = barajar(PATRONES_BANCO[patronesNivelElegido].map((_, i) => i));
  patronesIndice = 0;
  patronesAciertos = 0;
  patronesFase = 'jugando';
  patronesPrepararRonda();
}

function patronesPrepararRonda(){
  patronesPuzzle = PATRONES_BANCO[patronesNivelElegido][patronesOrden[patronesIndice]];
  patronesOpciones = barajar([patronesPuzzle.correcta, ...patronesPuzzle.distractores]);
  patronesRespuesta = null;
  renderPatrones();
}

function patronesElegir(i){
  if(patronesFase !== 'jugando' || patronesRespuesta != null) return;
  patronesRespuesta = i;
  const correcto = patronesItemKey(patronesOpciones[i]) === patronesItemKey(patronesPuzzle.correcta);
  reproducirTono(correcto ? 'correcto' : 'incorrecto');
  if(correcto){ patronesAciertos++; ganarMonedas(5); }
  renderPatrones();
  setTimeout(() => {
    if(patronesIndice < patronesOrden.length - 1){
      patronesIndice++;
      patronesPrepararRonda();
    } else {
      patronesFase = 'final';
      renderPatrones();
    }
  }, 900);
}

function renderPatrones(){
  const cont = document.getElementById('patrones-content');
  if(!cont) return;

  if(patronesFase === 'inicio'){
    document.getElementById('patrones-sub').textContent = 'Elegí un nivel';
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>🧩 Patrones</h2>
        <p>Mirá la secuencia de 4 figuras, descubrí la regla, y elegí cuál sigue entre las 4 opciones.</p>
      </div>
      <div class="section-label">Nivel</div>
      <div class="chip-row" style="margin-bottom:16px;">
        ${Object.keys(PATRONES_NOMBRE_NIVEL).map(n => `<div class="chip ${patronesNivelElegido === n ? 'selected' : ''}" onclick="patronesElegirNivel('${n}')">${PATRONES_NOMBRE_NIVEL[n]}</div>`).join('')}
      </div>
      <button class="btn-primary" onclick="patronesComenzar()">Comenzar</button>`;
    return;
  }

  document.getElementById('patrones-sub').textContent = `Nivel ${PATRONES_NOMBRE_NIVEL[patronesNivelElegido]}`;

  if(patronesFase === 'final'){
    cont.innerHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>🏁 ¡Completaste la ronda!</h2>
        <p>Acertaste ${patronesAciertos} de ${patronesOrden.length}.</p>
      </div>
      <button class="btn-primary" onclick="iniciarPatrones()">Jugar de nuevo</button>`;
    return;
  }

  const secuenciaHTML = patronesPuzzle.secuencia.map(item => `<div class="patron-celda">${patronesFiguraHTML(item, 40)}</div>`).join('');
  const opcionesHTML = patronesOpciones.map((op, i) => {
    let clase = '';
    if(patronesRespuesta != null){
      const esCorrecta = patronesItemKey(op) === patronesItemKey(patronesPuzzle.correcta);
      if(esCorrecta) clase = 'patron-opcion-correcta';
      else if(i === patronesRespuesta) clase = 'patron-opcion-incorrecta';
    }
    return `<button class="patron-opcion ${clase}" ${patronesRespuesta != null ? 'disabled' : ''} onclick="patronesElegir(${i})">${patronesFiguraHTML(op, 44)}</button>`;
  }).join('');

  cont.innerHTML = `
    <p class="tienda-nota">Figura ${patronesIndice + 1} de ${patronesOrden.length} · Aciertos: ${patronesAciertos}</p>
    <div class="patrones-secuencia">
      ${secuenciaHTML}
      <div class="patron-celda patron-celda-incognita">?</div>
    </div>
    <div class="section-label">¿Cuál sigue?</div>
    <div class="patrones-opciones">${opcionesHTML}</div>
    <p class="link-chico" onclick="iniciarPatrones()">‹ Elegir otro nivel</p>`;
}
