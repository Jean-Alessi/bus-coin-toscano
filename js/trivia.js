let temaActual = null;
let qIndex = 0;
let preguntasSesion = [];
const PREGUNTAS_POR_SESION = 20;

const TEMAS = {
  cultura: {
    nombre: 'Cultura',
    icono: 'estrella',
    preguntas: [
      { cat: 'CULTURA', text: '¿En qué año se inauguró el Obelisco de Buenos Aires?', opciones: ['1936', '1910', '1950'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Cómo se llama el gaucho protagonista del poema de José Hernández?', opciones: ['Martín Fierro', 'Facundo Quiroga', 'Santos Vega'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Qué escritor argentino escribió "Rayuela"?', opciones: ['Julio Cortázar', 'Jorge Luis Borges', 'Ernesto Sábato'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué ciudad nació Lionel Messi?', opciones: ['Rosario', 'Córdoba', 'Santa Fe'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué provincia nació Domingo Faustino Sarmiento?', opciones: ['San Juan', 'Mendoza', 'San Luis'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Cómo se llama el instrumento de cuerda hecho tradicionalmente con caparazón de armadillo?', opciones: ['El charango', 'La quena', 'El bombo legüero'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué año se fundó la Universidad de Buenos Aires (UBA)?', opciones: ['1821', '1810', '1880'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Qué ciudad argentina es conocida como "La Docta" por su tradición universitaria?', opciones: ['Córdoba', 'Rosario', 'Mar del Plata'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué año se legalizó el divorcio vincular en Argentina?', opciones: ['1987', '1955', '1994'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué provincia está el santuario del Gauchito Gil, venerado popularmente?', opciones: ['Corrientes', 'Jujuy', 'Chubut'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué provincia se venera a la Difunta Correa?', opciones: ['San Juan', 'La Rioja', 'Catamarca'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Cómo se llama el álbum debut de Soda Stereo, de 1984?', opciones: ['Soda Stereo', 'Nada Personal', 'Signos'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Qué escritor argentino escribió "Ficciones" y "El Aleph"?', opciones: ['Jorge Luis Borges', 'Julio Cortázar', 'Ernesto Sábato'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué año murió Carlos Gardel en un accidente aéreo?', opciones: ['1935', '1945', '1928'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Qué escritor uruguayo escribió "Las venas abiertas de América Latina"?', opciones: ['Eduardo Galeano', 'Mario Benedetti', 'Julio Cortázar'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Qué instrumento toca tradicionalmente el payador para acompañar sus versos improvisados?', opciones: ['La guitarra', 'El bandoneón', 'El violín'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué mes se celebra el Día de la Tradición en Argentina?', opciones: ['Noviembre', 'Octubre', 'Septiembre'], correcta: 0 },
      { cat: 'CULTURA', text: '¿Qué edificio porteño fue el más alto de Sudamérica al inaugurarse en 1936?', opciones: ['El Kavanagh', 'El Obelisco', 'El Palacio Barolo'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué año declaró la UNESCO al chamamé Patrimonio Cultural Inmaterial de la Humanidad?', opciones: ['2020', '2015', '2010'], correcta: 0 },
      { cat: 'CULTURA', text: '¿En qué provincia se celebra la Fiesta Nacional de la Vendimia?', opciones: ['Mendoza', 'San Juan', 'La Rioja'], correcta: 0 },
    ]
  },
  deportes: {
    nombre: 'Deportes',
    icono: 'pelota',
    preguntas: [
      { cat: 'DEPORTES', text: '¿En qué ciudad se jugó la final del Mundial de fútbol 2022?', opciones: ['Lusail', 'Doha', 'Riad'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cuántas Champions League ganó Lionel Messi con el Barcelona?', opciones: ['4', '3', '5'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿En qué año Juan Martín del Potro ganó el US Open?', opciones: ['2009', '2012', '2016'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿En qué año Argentina ganó su primer Mundial de fútbol?', opciones: ['1978', '1986', '1962'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cuántos Mundiales de fútbol ganó Argentina hasta 2022?', opciones: ['3', '2', '4'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cómo se llama el estadio de Boca Juniors?', opciones: ['La Bombonera', 'El Monumental', 'El Cilindro'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cómo se conoce popularmente a River Plate?', opciones: ['El Millonario', 'La Academia', 'El Xeneize'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cuántos puntos vale un try en rugby?', opciones: ['5', '3', '7'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cuántos jugadores tiene un equipo de rugby en cancha?', opciones: ['15', '13', '11'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Qué apodo recibía el boxeador Carlos Monzón?', opciones: ['Ringo', 'El Zurdo', 'El Tigre'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿En qué barrio se crió Diego Maradona?', opciones: ['Villa Fiorito', 'La Boca', 'Barracas'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cuántos sets hay que ganar para llevarse un partido de tenis a Grand Slam masculino?', opciones: ['3', '2', '4'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Qué equipo ganó la final de la Copa Libertadores 2018, jugada en Madrid?', opciones: ['River Plate', 'Boca Juniors', 'Racing Club'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿En qué ciudad española se jugó la final de la Copa Libertadores 2018?', opciones: ['Madrid', 'Barcelona', 'Sevilla'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cuántos aros tiene el símbolo olímpico?', opciones: ['5', '4', '6'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cada cuántos años se celebran los Juegos Olímpicos de invierno?', opciones: ['4 años', '2 años', '3 años'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Qué selección ganó el primer Mundial de fútbol de la historia, en 1930?', opciones: ['Uruguay', 'Argentina', 'Brasil'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cómo se llama el clásico de fútbol entre Independiente y Racing?', opciones: ['Clásico de Avellaneda', 'Superclásico', 'Clásico rosarino'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Cómo se conoce al clásico entre River Plate y Boca Juniors?', opciones: ['Superclásico', 'Clásico de Avellaneda', 'El Clásico'], correcta: 0 },
      { cat: 'DEPORTES', text: '¿Qué tenista argentino ganó Roland Garros en 2004?', opciones: ['Gastón Gaudio', 'Guillermo Coria', 'David Nalbandian'], correcta: 0 },
    ]
  },
  viajes: {
    nombre: 'Viajes',
    icono: 'avion',
    preguntas: [
      { cat: 'VIAJES', text: '¿Cuál es la ciudad más poblada de Argentina después de Buenos Aires?', opciones: ['Córdoba', 'Rosario', 'Mendoza'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es el lago más grande de Argentina?', opciones: ['Lago Argentino', 'Lago Nahuel Huapi', 'Lago Fagnano'], correcta: 0 },
      { cat: 'VIAJES', text: '¿En qué provincia está el glaciar Perito Moreno?', opciones: ['Santa Cruz', 'Chubut', 'Tierra del Fuego'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Qué océano bordea la Patagonia argentina?', opciones: ['El Atlántico', 'El Pacífico', 'El Caribe'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es el pico más alto de América, ubicado en Mendoza?', opciones: ['Aconcagua', 'Ojos del Salado', 'Chimborazo'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuántas provincias tiene Argentina?', opciones: ['23', '22', '24'], correcta: 0 },
      { cat: 'VIAJES', text: '¿En qué país está el gran desierto salado llamado Salar de Uyuni?', opciones: ['Bolivia', 'Perú', 'Chile'], correcta: 0 },
      { cat: 'VIAJES', text: '¿En qué país se encuentran las Cataratas Victoria?', opciones: ['Zimbabue', 'Sudáfrica', 'Kenia'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es el río más largo de Argentina?', opciones: ['El Paraná', 'El Uruguay', 'El Colorado'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es la distancia aproximada en kilómetros entre Buenos Aires y Ushuaia?', opciones: ['3000 km', '1500 km', '5000 km'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Con qué país Argentina comparte la frontera terrestre más larga?', opciones: ['Chile', 'Brasil', 'Bolivia'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es la sede del gobierno de Bolivia (Ejecutivo, Legislativo)?', opciones: ['La Paz', 'Sucre', 'Cochabamba'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es la capital constitucional de Bolivia?', opciones: ['Sucre', 'La Paz', 'Potosí'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Qué país sudamericano, además de Bolivia, no tiene salida al mar?', opciones: ['Paraguay', 'Ecuador', 'Uruguay'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es el país más pequeño de Sudamérica en superficie?', opciones: ['Surinam', 'Guyana', 'Uruguay'], correcta: 0 },
      { cat: 'VIAJES', text: '¿A qué altura aproximada sobre el nivel del mar está la ciudad de La Paz?', opciones: ['3600 metros', '1800 metros', '5000 metros'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es el país más extenso del mundo por superficie?', opciones: ['Rusia', 'Canadá', 'China'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Qué pasaje marítimo separa América del Sur de la Antártida?', opciones: ['El Pasaje de Drake', 'El Estrecho de Magallanes', 'El Canal de Beagle'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cuál es el balneario uruguayo más elegido por los turistas argentinos, en el departamento de Maldonado?', opciones: ['Punta del Este', 'Piriápolis', 'La Paloma'], correcta: 0 },
      { cat: 'VIAJES', text: '¿Cómo se llama la moneda oficial de Chile?', opciones: ['Peso chileno', 'Sol', 'Real'], correcta: 0 },
    ]
  },
  historia: {
    nombre: 'Historia',
    icono: 'reloj',
    preguntas: [
      { cat: 'HISTORIA', text: '¿En qué año se independizó Argentina?', opciones: ['1816', '1810', '1853'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Quién fue el primer presidente bajo la Constitución de 1853?', opciones: ['Justo José de Urquiza', 'Bernardino Rivadavia', 'Bartolomé Mitre'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué año se sancionó la Ley Sáenz Peña, que estableció el voto secreto y obligatorio?', opciones: ['1912', '1916', '1930'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Quién fue el primer presidente elegido bajo el voto secreto y obligatorio, en 1916?', opciones: ['Hipólito Yrigoyen', 'Roque Sáenz Peña', 'Marcelo T. de Alvear'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Quién fue el libertador de Argentina, Chile y Perú?', opciones: ['José de San Martín', 'Simón Bolívar', 'Manuel Belgrano'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué año San Martín cruzó la Cordillera de los Andes con su ejército?', opciones: ['1817', '1810', '1820'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Quién creó la bandera argentina?', opciones: ['Manuel Belgrano', 'José de San Martín', 'Bernardino Rivadavia'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué ciudad Manuel Belgrano enarboló por primera vez la bandera argentina?', opciones: ['Rosario', 'Buenos Aires', 'Jujuy'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Qué hecho histórico se conmemora el 25 de mayo en Argentina?', opciones: ['La Revolución de Mayo', 'La Declaración de la Independencia', 'La Batalla de Maipú'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué ciudad se declaró la independencia argentina, el 9 de julio de 1816?', opciones: ['San Miguel de Tucumán', 'Buenos Aires', 'Córdoba'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Cómo se llamó el conflicto bélico entre Argentina y Reino Unido en 1982?', opciones: ['Guerra de Malvinas', 'Guerra del Paraguay', 'Guerra de la Triple Alianza'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Quién era el presidente de facto de Argentina al inicio de la Guerra de Malvinas?', opciones: ['Leopoldo Galtieri', 'Jorge Rafael Videla', 'Reynaldo Bignone'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Cómo se conoce popularmente a la primera mujer presidenta de Argentina?', opciones: ['Isabel Perón', 'Evita', 'Cristina'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué año murió Eva Perón?', opciones: ['1952', '1955', '1949'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Qué muro cayó en 1989, marcando el fin de la división de Alemania?', opciones: ['El Muro de Berlín', 'La Gran Muralla', 'El Telón de Acero'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué año se disolvió la Unión Soviética?', opciones: ['1991', '1989', '1985'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Cómo se llamaba el barco que se hundió en 1912 tras chocar con un iceberg?', opciones: ['El Titanic', 'El Lusitania', 'El Bismarck'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué año comenzó la Primera Guerra Mundial?', opciones: ['1914', '1918', '1939'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿Qué antigua civilización construyó las pirámides de Guiza?', opciones: ['El Antiguo Egipto', 'El Imperio Romano', 'Los Mayas'], correcta: 0 },
      { cat: 'HISTORIA', text: '¿En qué siglo tuvo su apogeo el Imperio Inca, antes de la conquista española?', opciones: ['Siglo XV', 'Siglo X', 'Siglo XVIII'], correcta: 0 },
    ]
  },
  animales: {
    nombre: 'Animales',
    icono: 'pata',
    preguntas: [
      { cat: 'ANIMALES', text: '¿Cuál es el animal terrestre más grande del mundo?', opciones: ['Elefante africano', 'Elefante asiático', 'Rinoceronte blanco'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuántas patas tiene una araña?', opciones: ['8', '6', '10'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuál es el animal más rápido en tierra?', opciones: ['El guepardo', 'El león', 'El antílope'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuál es el mamífero más grande del mundo?', opciones: ['La ballena azul', 'El elefante africano', 'El cachalote'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuántos corazones tiene un pulpo?', opciones: ['3', '1', '2'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuál es el felino más grande de América?', opciones: ['El jaguar', 'El puma', 'El ocelote'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cómo se llama el camélido andino más grande, usado como animal de carga?', opciones: ['La llama', 'La alpaca', 'La vicuña'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuál es el reptil vivo más grande del mundo?', opciones: ['El cocodrilo marino', 'La anaconda verde', 'El dragón de Komodo'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuál es el único mamífero capaz de volar de forma activa?', opciones: ['El murciélago', 'La ardilla voladora', 'El petauro'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuántas patas tiene un insecto?', opciones: ['6', '8', '4'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuál es el ave viva más grande del mundo?', opciones: ['El avestruz', 'El cóndor andino', 'El ñandú'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Qué ave es capaz de volar hacia atrás gracias a sus alas especiales?', opciones: ['El colibrí', 'El águila', 'El halcón'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Qué mamífero terrestre tiene la gestación más larga?', opciones: ['El elefante', 'La jirafa', 'El rinoceronte'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuántos años puede vivir aproximadamente una tortuga gigante de Galápagos?', opciones: ['Más de 100 años', 'Unos 40 años', 'Unos 20 años'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuál es el pez más grande del mundo?', opciones: ['El tiburón ballena', 'La orca', 'El tiburón blanco'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Qué animal tiene el cuello más largo del mundo?', opciones: ['La jirafa', 'El camello', 'El avestruz'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cómo se llama la cría del canguro?', opciones: ['Joey', 'Cachorro', 'Ternero'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Cuántos estómagos tiene una vaca?', opciones: ['4', '2', '3'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Qué animal tiene un olfato tan fino que se usa para detectar explosivos y enfermedades?', opciones: ['El perro', 'El elefante', 'El oso'], correcta: 0 },
      { cat: 'ANIMALES', text: '¿Qué ave es el ave nacional de Argentina?', opciones: ['El hornero', 'El cóndor', 'El ñandú'], correcta: 0 },
    ]
  },
  cine_musica: {
    nombre: 'Cine y Música',
    icono: 'musica',
    preguntas: [
      { cat: 'CINE Y MÚSICA', text: '¿Qué película argentina ganó el Oscar a Mejor Película Extranjera en 2010?', opciones: ['El Secreto de sus Ojos', 'Relatos Salvajes', 'Nueve Reinas'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué película argentina, dirigida por Luis Puenzo, ganó el Oscar a Mejor Película Extranjera en 1986?', opciones: ['La Historia Oficial', 'El Secreto de sus Ojos', 'Nueve Reinas'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿De qué país es la cantante Shakira?', opciones: ['Colombia', 'México', 'España'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Con qué apodo se conoce a Carlos Gardel?', opciones: ['El Zorzal Criollo', 'El Rey del Tango', 'El Mago'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué instrumento revolucionó Astor Piazzolla al crear el "tango nuevo"?', opciones: ['El bandoneón', 'El violín', 'El piano'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué banda de rock argentino lidera Gustavo Cerati como cantante y guitarrista?', opciones: ['Soda Stereo', 'Sumo', 'Los Redonditos de Ricota'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Quién fue el cantante de la banda Sumo, fallecido en 1987?', opciones: ['Luca Prodan', 'Gustavo Cerati', 'Charly García'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Con qué banda saltó a la fama Charly García en los años 70, antes de Serú Girán?', opciones: ['Sui Generis', 'Soda Stereo', 'Los Abuelos de la Nada'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué actor interpreta a Iron Man en el Universo Cinematográfico de Marvel?', opciones: ['Robert Downey Jr.', 'Chris Evans', 'Chris Hemsworth'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué actor interpreta a Jack Sparrow en "Piratas del Caribe"?', opciones: ['Johnny Depp', 'Orlando Bloom', 'Geoffrey Rush'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿En qué ciudad de Estados Unidos nació el jazz?', opciones: ['Nueva Orleans', 'Chicago', 'Nueva York'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Quién lanzó el álbum "Thriller" en 1982?', opciones: ['Michael Jackson', 'Prince', 'Elvis Presley'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué banda británica hizo el álbum "The Dark Side of the Moon"?', opciones: ['Pink Floyd', 'Led Zeppelin', 'The Rolling Stones'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué banda británica formaron John Lennon y Paul McCartney?', opciones: ['The Beatles', 'The Rolling Stones', 'Queen'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Quién fue el cantante de la banda Queen?', opciones: ['Freddie Mercury', 'Elton John', 'David Bowie'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿En qué década se estrenó la primera película de "Star Wars"?', opciones: ['1970s', '1960s', '1980s'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué director dirigió la trilogía original de "El Señor de los Anillos"?', opciones: ['Peter Jackson', 'James Cameron', 'Steven Spielberg'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿En qué película animada un pez payaso busca a su hijo perdido?', opciones: ['Buscando a Nemo', 'Shrek', 'Ratatouille'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿Qué instrumento es central e identitario del tango?', opciones: ['El bandoneón', 'El saxofón', 'El arpa'], correcta: 0 },
      { cat: 'CINE Y MÚSICA', text: '¿En qué ciudad cordobesa nació el festival "Cosquín Rock"?', opciones: ['Cosquín', 'Villa Carlos Paz', 'Alta Gracia'], correcta: 0 },
    ]
  },
};

function barajar(lista){
  const copia = lista.slice();
  for(let i = copia.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Mezcla el orden de las opciones de una pregunta (y recalcula cuál es la
// correcta) para que la respuesta correcta no quede siempre en el mismo
// lugar entre partida y partida.
function barajarOpciones(pregunta){
  const opcionCorrecta = pregunta.opciones[pregunta.correcta];
  const nuevasOpciones = barajar(pregunta.opciones);
  return Object.assign({}, pregunta, {
    opciones: nuevasOpciones,
    correcta: nuevasOpciones.indexOf(opcionCorrecta),
  });
}

function iniciarTrivia(){
  temaActual = null;
  renderSeleccionTema();
}

function renderSeleccionTema(){
  document.getElementById('trivia-sub').textContent = 'Elegí un tema';
  const cont = document.getElementById('trivia-content');
  cont.innerHTML = `
    <div class="section-label">Temas</div>
    ${Object.keys(TEMAS).map(id => {
      const t = TEMAS[id];
      return `<div class="card" onclick="elegirTema('${id}')">
        <div class="icon">${icono(t.icono)}</div>
        <div class="txt"><h3>${t.nombre}</h3><p>${t.preguntas.length} preguntas</p></div>
      </div>`;
    }).join('')}`;
}

function elegirTema(id){
  temaActual = id;
  preguntasSesion = barajar(TEMAS[id].preguntas).slice(0, PREGUNTAS_POR_SESION).map(barajarOpciones);
  qIndex = 0;
  renderPregunta();
}

function renderPregunta(){
  const p = preguntasSesion[qIndex];
  document.getElementById('trivia-sub').textContent = `${TEMAS[temaActual].nombre} — Pregunta ${qIndex + 1} de ${preguntasSesion.length}`;
  const cont = document.getElementById('trivia-content');
  cont.innerHTML = `
    <div class="progress-bar"><div class="progress-fill" style="width:${((qIndex + 1) / preguntasSesion.length) * 100}%"></div></div>
    <div class="question-box">
      <div class="qnum">${p.cat}</div>
      <h3>${p.text}</h3>
    </div>
    <div id="q-options">${p.opciones.map((op, i) => `<div class="option" onclick="responder(${i})">${op}</div>`).join('')}</div>`;
}

function responder(i){
  const p = preguntasSesion[qIndex];
  const opts = document.querySelectorAll('.option');
  opts.forEach((o, idx) => {
    o.onclick = null;
    if(idx === p.correcta) o.classList.add('correct');
    else if(idx === i) o.classList.add('wrong');
  });
  if(i === p.correcta){
    reproducirTono('correcto');
    ganarMonedas(5);
    mostrarToast('+5 monedas por acertar', 'gain');
  } else {
    reproducirTono('incorrecto');
    mostrarToast('Esa no era... ¡a la próxima!');
  }
  setTimeout(() => {
    if(qIndex < preguntasSesion.length - 1){
      qIndex++;
      renderPregunta();
    } else {
      renderResultadoSesion();
    }
  }, 1800);
}

function renderResultadoSesion(){
  document.getElementById('trivia-sub').textContent = 'Elegí un tema';
  const cont = document.getElementById('trivia-content');
  cont.innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>¡Terminaste ${TEMAS[temaActual].nombre}!</h2>
      <p>Podés jugar este tema de nuevo o elegir otro.</p>
    </div>
    <button class="btn-primary" onclick="elegirTema('${temaActual}')">Jugar de nuevo este tema</button>
    <button class="btn-ghost" onclick="renderSeleccionTema()">Elegir otro tema</button>`;
}
