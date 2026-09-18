const ICONOS = {
  graduacion: '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 8v6"/>',
  libro: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5v-13Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13Z"/>',
  casa: '<path d="M3 11 12 4l9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  corazon: '<path d="M12 20.5S3 14.8 3 8.9C3 5.9 5.3 4 7.8 4c1.6 0 3.1.8 4.2 2.3C13.1 4.8 14.6 4 16.2 4 18.7 4 21 5.9 21 8.9c0 5.9-9 11.6-9 11.6Z"/>',
  grupo: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 6.5a3 3 0 1 1 0 6"/><path d="M15.5 14c2.5.3 4.5 2.5 4.5 6"/>',
  trivia: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 2Z"/>',
  musica: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  trofeo: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a3 3 0 0 0 3 4"/><path d="M16 5h3a3 3 0 0 1-3 4"/><path d="M12 12v3"/><path d="M9 20h6"/><path d="M10 17h4v3h-4z"/>',
  auriculares: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  lupa: '<circle cx="10" cy="10" r="6"/><path d="m20 20-5.2-5.2"/>',
  chat: '<path d="M4 5h16v11H8l-4 4V5Z"/>',
  moneda: '<circle cx="9" cy="9" r="6"/><circle cx="15" cy="15" r="6"/>',
  bingo: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  estrella: '<path d="M12 2.5l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.4l-6.2 3.4 1.6-6.8-5.2-4.6 6.9-.6Z"/>',
  pelota: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5 15.5 9l-1.3 4.2H9.8L8.5 9Z"/><path d="M12 2.7v3.8M4.8 7.6l3.7 1.9M19.2 7.6l-3.7 1.9M7.3 20l1.6-4.6M16.7 20l-1.6-4.6"/>',
  avion: '<path d="M2 12 22 4 14 22l-2-8-8-2Z"/>',
  pata: '<circle cx="12" cy="15.5" r="4"/><circle cx="5.5" cy="9.5" r="2.2"/><circle cx="10" cy="5" r="2.2"/><circle cx="14.5" cy="5" r="2.2"/><circle cx="19" cy="9.5" r="2.2"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  interrogacion: '<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7v.5"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9"/>',
  rompecabezas: '<path d="M4 9h3.2a1.8 1.8 0 1 1 3.6 0H14V4.8a1.8 1.8 0 1 1 3.6 0V9H20v3.2a1.8 1.8 0 1 0 0 3.6V20h-3.2a1.8 1.8 0 1 0-3.6 0H9v-4.2a1.8 1.8 0 1 0-3.6 0H4V9Z"/>',
  valija: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="3" y1="13" x2="21" y2="13"/>',
  letraA: '<path d="M12 4 5 20"/><path d="M12 4l7 16"/><path d="M8 15h8"/>',
  espia: '<path d="M2 10h3l2-3h10l2 3h3"/><circle cx="7" cy="13" r="3"/><circle cx="17" cy="13" r="3"/><path d="M10 13h4"/>',
  cartas: '<rect x="3" y="7" width="11" height="14" rx="2"/><rect x="10" y="3" width="11" height="14" rx="2"/>',
  lapiz: '<path d="M3 21l4-1 11-11-3-3L4 17l-1 4Z"/><path d="M14 5l3 3"/>',
  rayo: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
  pincel: '<path d="M4 20l4-4"/><path d="M8 16 18 6a2.8 2.8 0 0 0-4-4L4 12l4 4Z"/>',
  naipe: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="9.5" r="2.3"/><path d="M12 13v5"/>',
  trebol: '<circle cx="9" cy="8" r="3.2"/><circle cx="15" cy="8" r="3.2"/><circle cx="12" cy="13" r="3.2"/><path d="M12 15v6"/>',
  control: '<rect x="2" y="7.5" width="20" height="10" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="15.3" cy="11" r="1"/><circle cx="17.3" cy="13" r="1"/>',
  regalo: '<rect x="3" y="8.5" width="18" height="12" rx="1.2"/><path d="M3 8.5h18v3.8H3z"/><path d="M12 8.5v12"/><path d="M12 8.5c-1.8-4-6.8-3.4-6.8-.7 0 1.6 2.6 1.4 6.8.7Z"/><path d="M12 8.5c1.8-4 6.8-3.4 6.8-.7 0 1.6-2.6 1.4-6.8.7Z"/>',
  sudoku: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  patrones: '<rect x="2" y="9" width="6" height="6" rx="1.2"/><rect x="10" y="9" width="6" height="6" rx="1.2"/><rect x="18" y="9" width="4" height="6" rx="1.2" stroke-dasharray="2 2"/>',
  buscolor: '<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="12" r="4.2"/><path d="M12 7.8v8.4M7.8 12h8.4"/>',
  sopaletras: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h8"/><circle cx="17.5" cy="16.5" r="3"/><path d="m19.8 18.8 2.2 2.2"/>',
  tienda: '<path d="M4 4h16l1.5 5h-19Z"/><path d="M4.5 9V20h15V9"/><path d="M9.5 20v-6h5v6"/>'
};

function icono(nombre, size){
  size = size || 20;
  const path = ICONOS[nombre] || ICONOS.trivia;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
