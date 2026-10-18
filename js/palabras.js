// Banco de palabras de El Impostor y de Dibujar y Adivinar: más de 400 palabras en 27 categorías,
// todas cosas concretas que se pueden dibujar o describir sin decir la palabra. Se sortean con una
// bolsa (azar.js): no se repite ninguna hasta haber salido todas, y no salen dos veces seguidas
// de la misma categoría.

const PALABRAS = {
  'Animales': ['León', 'Elefante', 'Jirafa', 'Cocodrilo', 'Pingüino', 'Canguro', 'Delfín', 'Tiburón', 'Caballo', 'Perro', 'Gato', 'Tortuga', 'Mono', 'Oso', 'Pulpo', 'Mariposa', 'Búho', 'Zorro', 'Loro', 'Vaca', 'Cerdo', 'Ballena', 'Cebra', 'Hormiga'],
  'Películas': ['Titanic', 'Frozen', 'Avatar', 'Shrek', 'Rocky', 'Gladiador', 'Coco', 'Toy Story', 'Harry Potter', 'El Rey León', 'Buscando a Nemo', 'Matrix', 'Jurassic Park', 'Volver al Futuro', 'Spider-Man', 'Batman', 'Cars', 'Moana', 'Los Minions', 'Karate Kid'],
  'Comidas': ['Empanada', 'Asado', 'Milanesa', 'Pizza', 'Choripán', 'Locro', 'Alfajor', 'Helado', 'Fideos', 'Hamburguesa', 'Ravioles', 'Tortilla', 'Dulce de leche', 'Sándwich de miga', 'Papas fritas', 'Ensalada', 'Flan', 'Torta', 'Medialunas', 'Pancho', 'Ñoquis', 'Tarta'],
  'Lugares': ['Playa', 'Montaña', 'Aeropuerto', 'Hospital', 'Escuela', 'Cancha', 'Boliche', 'Terminal de ómnibus', 'Plaza', 'Cine', 'Supermercado', 'Biblioteca', 'Museo', 'Zoológico', 'Farmacia', 'Estación de servicio', 'Camping', 'Hotel', 'Banco', 'Parque de diversiones', 'Panadería', 'Pileta'],
  'Profesiones': ['Bombero', 'Médico', 'Profesor', 'Chofer', 'Cocinero', 'Policía', 'Peluquero', 'Piloto', 'Carpintero', 'Astronauta', 'Dentista', 'Cartero', 'Payaso', 'Albañil', 'Mago', 'Veterinario', 'Cantante', 'Fotógrafo', 'Plomero', 'Panadero'],
  'Objetos': ['Paraguas', 'Mochila', 'Bicicleta', 'Guitarra', 'Anteojos', 'Billetera', 'Termo', 'Almohada', 'Reloj', 'Llave', 'Cuaderno', 'Tijera', 'Lámpara', 'Espejo', 'Pelota', 'Martillo', 'Cepillo de dientes', 'Silla', 'Candado', 'Linterna'],
  'Deportes': ['Fútbol', 'Tenis', 'Básquet', 'Rugby', 'Vóley', 'Boxeo', 'Truco', 'Ajedrez', 'Natación', 'Ciclismo', 'Hockey', 'Golf', 'Pádel', 'Handball', 'Esquí', 'Surf', 'Atletismo', 'Gimnasia', 'Karate', 'Patinaje'],
  'Transportes': ['Micro', 'Avión', 'Tren', 'Barco', 'Moto', 'Taxi', 'Subte', 'Helicóptero', 'Camión', 'Ambulancia', 'Submarino', 'Globo aerostático', 'Monopatín', 'Tractor', 'Cohete', 'Colectivo'],
  'Instrumentos': ['Piano', 'Batería', 'Violín', 'Trompeta', 'Flauta', 'Bandoneón', 'Acordeón', 'Bombo', 'Arpa', 'Saxofón', 'Pandereta', 'Charango', 'Ukelele', 'Micrófono'],
  'Ropa': ['Remera', 'Pantalón', 'Zapatillas', 'Campera', 'Gorra', 'Bufanda', 'Guantes', 'Pollera', 'Medias', 'Pijama', 'Short', 'Ojotas', 'Sombrero', 'Corbata', 'Vestido', 'Bufandas'],
  'Frutas y verduras': ['Manzana', 'Banana', 'Naranja', 'Frutilla', 'Sandía', 'Uva', 'Durazno', 'Ananá', 'Tomate', 'Zanahoria', 'Papa', 'Cebolla', 'Choclo', 'Lechuga', 'Zapallo', 'Limón'],
  'Naturaleza': ['Volcán', 'Cascada', 'Río', 'Bosque', 'Desierto', 'Arcoíris', 'Isla', 'Cueva', 'Glaciar', 'Lago', 'Nube', 'Tormenta', 'Luna', 'Sol', 'Estrella', 'Cactus'],
  'La casa': ['Heladera', 'Cocina', 'Cama', 'Sillón', 'Ventana', 'Puerta', 'Escalera', 'Baño', 'Techo', 'Jardín', 'Garaje', 'Ducha', 'Televisor', 'Ventilador', 'Microondas', 'Mesa'],
  'Cuerpo humano': ['Mano', 'Ojo', 'Nariz', 'Oreja', 'Pie', 'Corazón', 'Dedo', 'Boca', 'Pelo', 'Diente', 'Rodilla', 'Codo', 'Lengua', 'Cerebro'],
  'Personajes y cuentos': ['Caperucita Roja', 'Cenicienta', 'Superman', 'Pinocho', 'Papá Noel', 'Hada', 'Dragón', 'Pirata', 'Sirena', 'Fantasma', 'Robot', 'Vampiro', 'Bruja', 'Príncipe', 'Gigante', 'Duende'],
  'Fiestas': ['Cumpleaños', 'Navidad', 'Casamiento', 'Carnaval', 'Año Nuevo', 'Fogata', 'Fuegos artificiales', 'Disfraz', 'Piñata', 'Globos', 'Brindis', 'Regalo'],
  'Tecnología': ['Celular', 'Computadora', 'Auriculares', 'Cámara', 'Joystick', 'Cargador', 'Drone', 'Impresora', 'Parlante', 'Teclado', 'Mouse', 'Pantalla'],
  'Viajes': ['Valija', 'Pasaporte', 'Mapa', 'Carpa', 'Brújula', 'Binoculares', 'Souvenir', 'Excursión', 'Mochilero', 'Postal', 'Guía turístico', 'Cinturón de seguridad', 'Asiento del micro', 'Equipaje', 'Boleto', 'Hamaca paraguaya'],
  'La escuela': ['Pizarrón', 'Regla', 'Lápiz', 'Goma', 'Recreo', 'Maestra', 'Banco escolar', 'Tiza', 'Guardapolvo', 'Examen', 'Calculadora', 'Cartuchera', 'Globo terráqueo', 'Mapa mudo'],
  'Juegos': ['Dados', 'Rompecabezas', 'Escondidas', 'Bingo', 'Rayuela', 'Soga', 'Barrilete', 'Yo-yo', 'Trompo', 'Metegol', 'Cartas', 'Dominó', 'Sapo', 'Pelota paleta'],
  'Bebidas': ['Mate', 'Café', 'Té', 'Gaseosa', 'Jugo', 'Licuado', 'Agua', 'Chocolate caliente', 'Limonada', 'Submarino', 'Leche', 'Soda'],
  'El clima': ['Lluvia', 'Nieve', 'Viento', 'Niebla', 'Granizo', 'Relámpago', 'Rocío', 'Calor', 'Invierno', 'Verano', 'Otoño', 'Primavera'],
  'Argentina': ['Obelisco', 'Gaucho', 'Tango', 'Cóndor', 'Cataratas', 'Perito Moreno', 'Bombilla', 'Yerba', 'Facón', 'Zamba', 'Ushuaia', 'Casa Rosada'],
  'Mar y playa': ['Sombrilla', 'Salvavidas', 'Castillo de arena', 'Ola', 'Cangrejo', 'Caracol', 'Faro', 'Ancla', 'Velero', 'Medusa', 'Snorkel', 'Reposera'],
  'Música y baile': ['Disco', 'Karaoke', 'Auriculares', 'Concierto', 'Micrófono', 'Bailarina', 'DJ', 'Cumbia', 'Banda', 'Orquesta', 'Parlante gigante', 'Cantante'],
  'Aventura y campamento': ['Fogata', 'Linterna', 'Bolsa de dormir', 'Carpa', 'Mochila', 'Cuerda', 'Mapa del tesoro', 'Cofre', 'Escalada', 'Canoa', 'Catalejo', 'Brújula'],
  'Hogar y cocina': ['Cuchara', 'Tenedor', 'Cuchillo', 'Plato', 'Vaso', 'Olla', 'Sartén', 'Pava', 'Licuadora', 'Tostadora', 'Rallador', 'Mantel'],
};

// Lista plana { categoria, palabra } sin palabras repetidas entre categorías.
const IMPOSTOR_BANCO = (() => {
  const vistas = new Set(), lista = [];
  Object.keys(PALABRAS).forEach(c => PALABRAS[c].forEach(p => { if(!vistas.has(p)){ vistas.add(p); lista.push({ categoria: c, palabra: p }); } }));
  return lista;
})();

// Sortea sin repetir hasta agotar el banco, y sin repetir la categoría de la vuelta anterior.
function palabraSinRepetir(){
  const kCat = 'azar-palabras-cat-' + ((typeof codigoViaje !== 'undefined' && codigoViaje) || '');
  let ultimaCat = '';
  try { ultimaCat = localStorage.getItem(kCat) || ''; } catch(e){}
  let elegido = IMPOSTOR_BANCO[azarSiguiente('palabras', IMPOSTOR_BANCO.length, 24)];
  for(let intento = 0; intento < 6 && elegido.categoria === ultimaCat; intento++) elegido = IMPOSTOR_BANCO[azarSiguiente('palabras', IMPOSTOR_BANCO.length, 24)];
  try { localStorage.setItem(kCat, elegido.categoria); } catch(e){}
  return elegido;
}
