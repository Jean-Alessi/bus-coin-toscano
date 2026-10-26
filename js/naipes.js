// Mazo español y dibujo de los palos. Lo usan Escoba de 15, Chinchón, Truco y el dibujo de las cartas (escenas.js → naipeHTML).
// Antes vivía dentro de escoba.js. Se carga antes que esos juegos.

const ESCOBA_PALOS = ['oro', 'copa', 'espada', 'basto'];
const ESCOBA_NUMEROS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const ESCOBA_NOMBRE_NUMERO = { 10: 'Sota', 11: 'Caballo', 12: 'Rey' };

// Dibujos propios en vez de emoji: el 🌳 de basto se confundía con la copa de
// un árbol o su tronco. Cada palo tiene su forma y color reales del mazo
// español (oro=moneda, copa=cáliz, espada=hoja recta, basto=garrote de
// madera), para poder distinguirlos de un vistazo aunque la carta sea chica.
const ESCOBA_ICONO_PALO = {
  oro: '<circle cx="12" cy="12" r="8.5" fill="#F5C242" stroke="#B8860B" stroke-width="1.4"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#B8860B" stroke-width="1.1"/>',
  copa: '<path d="M6.5 3.5h11l-.6 5.2a5 5 0 0 1-9.8 0l-.6-5.2Z" fill="#D64545" stroke="#8B2E2E" stroke-width="1.1"/><path d="M12 13.5V18M8.3 20.5h7.4" stroke="#8B2E2E" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  espada: '<path d="M12 2 13.5 14.6h-3Z" fill="#2D3E50"/><path d="M7.6 15h8.8" stroke="#2D3E50" stroke-width="2" stroke-linecap="round"/><rect x="11.1" y="15.6" width="1.8" height="3.6" rx="0.8" fill="#2D3E50"/><circle cx="12" cy="20.1" r="1.2" fill="#2D3E50"/>',
  basto: '<path d="M7.5 20 17 5.3" stroke="#8B5E34" stroke-width="4.6" stroke-linecap="round"/><circle cx="17" cy="5.3" r="3" fill="#A9713F" stroke="#6B4423" stroke-width="1"/>',
};

function escobaIconoPalo(palo, size){
  size = size || 20;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${ESCOBA_ICONO_PALO[palo] || ''}</svg>`;
}

function escobaNombreCarta(carta){ return `${ESCOBA_NOMBRE_NUMERO[carta.numero] || carta.numero} de ${carta.palo}`; }

function escobaCrearMazo(){
  const mazo = [];
  ESCOBA_PALOS.forEach(palo => ESCOBA_NUMEROS.forEach(numero => mazo.push({ palo, numero })));
  return barajar(mazo);
}
