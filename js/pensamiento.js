// Pensamiento lateral: 20 casos con una historia inicial rara y una
// explicación lógica. Se responde con una palabra clave (no hace falta
// escribir la solución entera), hay preguntas de sí/no sugeridas para
// pedir ayuda (opcionales, restan 1 punto cada una si se usan) y se puede
// pedir la solución directamente si se dan por vencidos (sin puntos).

const PENSAMIENTOS_LATERALES = [
  {
    titulo: 'Romeo y Julieta',
    historia: 'Romeo y Julieta aparecen muertos en el piso de una habitación. A su alrededor hay agua y vidrios rotos. No tienen heridas ni signos de violencia. Nadie más entró a la casa.',
    respuesta: 'Romeo y Julieta son peces. Vivían en una pecera que se cayó de su soporte y se hizo pedazos contra el piso; sin agua, murieron poco después.',
    clave: 'peces',
    dificultad: 'Media',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13c0-5 3.5-8 8-8s8 3 8 8"/><path d="M3 14l4-2-1 4z" fill="#E8720F" stroke="none"/><path d="M21 14l-4-2 1 4z" fill="#0F2A4D" stroke="none"/><path d="M7 19c1.6-2 3-2 4.5 0 1.5-2 3-2 4.5 0"/><circle cx="9" cy="16" r="1.6" fill="#E8720F" stroke="none"/></svg>',
    preguntas: [
      { q: '¿Son personas?', a: 'No' },
      { q: '¿Alguien los atacó?', a: 'No' },
      { q: '¿Estaban vivos antes de que se rompiera algo?', a: 'Sí' },
      { q: '¿El agua tiene relación con la causa de la muerte?', a: 'Sí' },
    ],
  },
  {
    titulo: 'El ahorcado sobre el charco',
    historia: 'Encuentran a un hombre colgado del techo de un galpón, en el centro de la habitación. Debajo de sus pies, solo un charco de agua en el piso. No hay sillas, escaleras ni nada donde haya podido pararse, y la puerta estaba cerrada por dentro.',
    respuesta: 'Se subió a un bloque de hielo para alcanzar la soga, pasó el tiempo y el hielo se derritió por completo, dejándolo colgado y formando el charco de agua en el piso.',
    clave: 'hielo',
    dificultad: 'Difícil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="4" width="8" height="8" rx="1" transform="rotate(10 12 8)"/><path d="M12 12v4"/><ellipse cx="12" cy="19" rx="7" ry="2.4" fill="#FDEBDA" stroke="#E8720F"/></svg>',
    preguntas: [
      { q: '¿Fue asesinado por otra persona?', a: 'No' },
      { q: '¿Usó algo para pararse que ya no está?', a: 'Sí' },
      { q: '¿Ese algo se transformó en el charco?', a: 'Sí' },
      { q: '¿Pasó bastante tiempo entre que se paró y que murió?', a: 'Sí' },
    ],
  },
  {
    titulo: 'El vaso de agua que curó el hipo',
    historia: 'Un hombre entra a un bar con hipo y le pide al cantinero un vaso de agua. El cantinero, sin decir palabra, saca un arma y apunta al hombre. El hombre se asusta, deja el vaso, agradece y se va tranquilo, sin hipo.',
    respuesta: 'El cantinero entendió que el hipo era el verdadero problema y que el susto era la cura más rápida. El agua nunca hizo falta.',
    clave: 'susto',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 15a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1Z"/><path d="M9.3 7h5.4"/><path d="M18 5v4"/><circle cx="18" cy="12" r=".8" fill="#E8720F" stroke="none"/></svg>',
    preguntas: [
      { q: '¿El cantinero quería lastimarlo de verdad?', a: 'No' },
      { q: '¿El susto tuvo un efecto físico en el hombre?', a: 'Sí' },
      { q: '¿El agua era realmente necesaria?', a: 'No' },
      { q: '¿El hombre se fue enojado?', a: 'No' },
    ],
  },
  {
    titulo: 'El paquete que nunca se abrió',
    historia: 'En medio de un campo abierto aparece un hombre muerto. A su lado hay un paquete sin abrir. No hay huellas de otra persona, ni vehículos, ni marcas de arrastre en la tierra.',
    respuesta: 'Era un paracaidista. El paquete es el paracaídas de reserva, que no llegó a abrir a tiempo después de que fallara el principal.',
    clave: 'paracaidas',
    dificultad: 'Difícil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10a9 6 0 0 1 18 0"/><path d="M3 10l3 8M8 10l1.5 8M12 10v8M16 10l-1.5 8M21 10l-3 8"/><rect x="9" y="18" width="6" height="4" rx="1" fill="#E8720F" stroke="none"/></svg>',
    preguntas: [
      { q: '¿Cayó desde arriba?', a: 'Sí' },
      { q: '¿El paquete debía usarse antes de morir?', a: 'Sí' },
      { q: '¿Alguien más estuvo involucrado?', a: 'No' },
      { q: '¿El paquete es un objeto de seguridad?', a: 'Sí' },
    ],
  },
  {
    titulo: 'Treinta centavos, dos monedas',
    historia: 'Un hombre tiene dos monedas argentinas en el bolsillo que suman treinta centavos. Le dice a un amigo: "una de las dos no es de cinco". El amigo responde que entonces las dos deberían ser de otro valor, pero el hombre insiste en que tiene razón.',
    respuesta: 'Una de las monedas es de veinticinco centavos y la otra sí es de cinco. La frase "una de las dos no es de cinco" es verdadera: se refiere a la de veinticinco, no a la otra.',
    clave: 'veinticinco',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6" fill="#FDEBDA" stroke="#E8720F"/></svg>',
    preguntas: [
      { q: '¿Las dos monedas son del mismo valor?', a: 'No' },
      { q: '¿Hay efectivamente una moneda de cinco entre las dos?', a: 'Sí' },
      { q: '¿El hombre mintió?', a: 'No' },
    ],
  },
  {
    titulo: 'El hombre bajito del ascensor',
    historia: 'Un hombre vive en el piso doce de un edificio. Todas las mañanas baja en ascensor hasta la planta baja sin problema. Pero al volver, solo llega en ascensor hasta el piso seis, y desde ahí sube el resto caminando por la escalera. Los días de lluvia, en cambio, llega derecho hasta el piso doce en ascensor.',
    respuesta: 'El hombre es muy bajo y no llega al botón del piso doce, solo hasta el seis. Los días de lluvia lleva paraguas y usa la punta para presionar el botón más alto.',
    clave: 'altura',
    dificultad: 'Media',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="18" rx="1"/><circle cx="7" cy="8" r=".7" fill="#0F2A4D" stroke="none"/><circle cx="7" cy="12" r=".7" fill="#0F2A4D" stroke="none"/><circle cx="7" cy="16" r=".7" fill="#E8720F" stroke="none"/><path d="M14 10a5 5 0 0 1 10 0Z" fill="#E8720F" stroke="#E8720F"/><path d="M19 10v10"/><path d="M19 20q-2 2-3 0"/></svg>',
    preguntas: [
      { q: '¿Tiene algún problema físico relacionado con esto?', a: 'Sí, su altura' },
      { q: '¿El clima influye directamente?', a: 'Sí' },
      { q: '¿Necesita ayuda de otra persona los días de lluvia?', a: 'No' },
      { q: '¿Lleva algo distinto los días de lluvia?', a: 'Sí' },
    ],
  },
  {
    titulo: 'El hielo que escondía el veneno',
    historia: 'En una reunión, todos los invitados toman la misma bebida servida de la misma jarra. Uno de ellos toma su vaso de un trago; el resto lo toma despacio, charlando. Horas después, solo el que tomó rápido sigue vivo; los demás se descompensan.',
    respuesta: 'El veneno estaba en los cubitos de hielo, no en la bebida. El que tomó rápido no le dio tiempo al hielo de derretirse y liberar el veneno; los demás, al tomar despacio, sí lo consumieron.',
    clave: 'hielo',
    dificultad: 'Media',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5h12l-1.5 15a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1Z"/><rect x="9" y="9" width="3" height="3" fill="#E8720F" stroke="none"/><rect x="13" y="11" width="3" height="3" fill="#FDEBDA" stroke="#E8720F"/></svg>',
    preguntas: [
      { q: '¿Todos bebieron de la misma jarra?', a: 'Sí' },
      { q: '¿El veneno estaba disuelto desde el principio en el líquido?', a: 'No' },
      { q: '¿La velocidad al tomar influyó en el resultado?', a: 'Sí' },
      { q: '¿El hielo tiene algo que ver?', a: 'Sí' },
    ],
  },
  {
    titulo: 'El amor de un solo funeral',
    historia: 'Una mujer va al funeral de una persona que no conocía. Ahí conoce a un hombre y es amor a primera vista, pero no llegan a intercambiar datos de contacto. Días después, la mujer mata a su propia hermana.',
    respuesta: 'La mujer esperaba que el hombre volviera a aparecer en otro funeral de la familia, y decidió provocar esa oportunidad matando a su hermana.',
    clave: 'funeral',
    dificultad: 'Difícil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="2.2" fill="#E8720F" stroke="none"/><circle cx="8.5" cy="10" r="2.2" fill="#E8720F" stroke="none"/><circle cx="15.5" cy="10" r="2.2" fill="#E8720F" stroke="none"/><circle cx="12" cy="11.5" r="2" fill="#FDEBDA" stroke="#E8720F"/><path d="M12 13v8"/></svg>',
    preguntas: [
      { q: '¿Conocía al hombre de antes?', a: 'No' },
      { q: '¿La muerte de la hermana fue un accidente?', a: 'No' },
      { q: '¿Tiene relación con el primer funeral?', a: 'Sí' },
      { q: '¿Buscaba volver a ver al hombre?', a: 'Sí' },
    ],
  },
  {
    titulo: 'El fotógrafo "asesino"',
    historia: 'Un hombre agarra a una persona, la sumerge en un líquido durante varios minutos, después la cuelga para que se seque. Esa misma noche, ambos cenan juntos tranquilamente.',
    respuesta: 'Es un fotógrafo revelando una foto en el cuarto oscuro: sumerge el papel fotográfico en los químicos de revelado y luego lo cuelga para que se seque. La "persona" es la imagen de alguien en la foto.',
    clave: 'foto',
    dificultad: 'Difícil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="8" rx="1.5"/><circle cx="8" cy="11" r="2.2"/><path d="M6 7l1-2h2l1 2"/><line x1="16" y1="4" x2="16" y2="20"/><rect x="14.3" y="10" width="4.4" height="5.4" fill="#FDEBDA" stroke="#E8720F"/></svg>',
    preguntas: [
      { q: '¿La persona sumergida está viva?', a: 'No es una persona real, es una imagen' },
      { q: '¿Ocurre en una habitación oscura?', a: 'Sí' },
      { q: '¿El líquido es agua común?', a: 'No, son químicos de revelado' },
    ],
  },
  {
    titulo: 'El oso y los tres pasos',
    historia: 'Un cazador camina un kilómetro hacia el sur, después un kilómetro hacia el este, y finalmente un kilómetro hacia el norte. Al terminar, está exactamente en el punto de partida y ve un oso. ¿De qué color es el oso?',
    respuesta: 'Blanco. El único lugar de la Tierra donde ese recorrido devuelve al punto de partida es el Polo Norte, y ahí solo hay osos polares.',
    clave: 'blanco',
    dificultad: 'Media',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="6" fill="#FDEBDA" stroke="#0F2A4D"/><circle cx="8" cy="8" r="1.8"/><circle cx="16" cy="8" r="1.8"/><circle cx="12" cy="14" r="1.4" fill="#0F2A4D" stroke="none"/></svg>',
    preguntas: [
      { q: '¿El lugar tiene que ver con la respuesta?', a: 'Sí' },
      { q: '¿Está en un punto geográfico especial?', a: 'Sí' },
      { q: '¿Hace mucho frío ahí?', a: 'Sí' },
    ],
  },
  {
    titulo: 'Veinte bodas sin bigamia',
    historia: 'Un hombre se casó con veinte mujeres distintas a lo largo de su vida, todas siguen vivas, él nunca se divorció de ninguna, y jamás cometió el delito de bigamia.',
    respuesta: 'Es sacerdote: ofició las veinte bodas, no se casó él mismo con esas mujeres.',
    clave: 'sacerdote',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20l3-6 3 6"/><path d="M12 14V6"/><path d="M9 8h6"/><path d="M12 4v2"/><path d="M11 3h2"/><circle cx="18" cy="18" r="3" fill="#FDEBDA" stroke="#E8720F"/></svg>',
    preguntas: [
      { q: '¿Se casó él personalmente con esas veinte mujeres?', a: 'No' },
      { q: '¿Tiene un oficio relacionado con casamientos?', a: 'Sí' },
      { q: '¿Cometió algún delito?', a: 'No' },
    ],
  },
  {
    titulo: 'La caída sin un rasguño',
    historia: 'Un hombre se cae de un edificio de cincuenta pisos y no sufre ni un rasguño. ¿Cómo es posible?',
    respuesta: 'Se cayó desde la planta baja o el primer piso del edificio, no desde el piso cincuenta.',
    clave: 'planta baja',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="14" width="12" height="7"/><rect x="9" y="17" width="2" height="4" fill="#E8720F" stroke="none"/><rect x="13" y="17" width="2" height="4" fill="#E8720F" stroke="none"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
    preguntas: [
      { q: '¿Cayó desde muy arriba?', a: 'No' },
      { q: '¿Hay algo que amortiguó la caída?', a: 'No hace falta, la caída fue corta' },
    ],
  },
  {
    titulo: 'El reloj adelantado',
    historia: 'Un hombre pone su reloj diez minutos adelantado a propósito, aunque sabe perfectamente la hora real. Aun así, sigue llegando tarde a todos lados.',
    respuesta: 'Su cabeza ya descuenta automáticamente esos diez minutos cada vez que mira la hora, así que el truco deja de funcionar apenas se acostumbra a él.',
    clave: 'costumbre',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><path d="M12 9v3l2 1.5"/><path d="M10 4h4M10 20h4"/></svg>',
    preguntas: [
      { q: '¿Sabe que el reloj está adelantado?', a: 'Sí' },
      { q: '¿El truco funciona con el tiempo?', a: 'No, deja de funcionar' },
      { q: '¿Es un problema de memoria o de costumbre?', a: 'De costumbre' },
    ],
  },
  {
    titulo: 'El campeón que nunca entrenaba',
    historia: 'Un chico le ganaba todos los torneos de ping-pong del barrio sin entrenar nunca, según decía. Un rival, cansado de perder, contrató a un entrenador para descubrir su secreto.',
    respuesta: 'El entrenador descubrió que el chico sí entrenaba, todas las noches, contra su padre, un ex jugador profesional, en el living de su casa.',
    clave: 'padre',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9" cy="14" rx="5" ry="6" transform="rotate(-20 9 14)"/><line x1="13" y1="18" x2="17" y2="21"/><circle cx="18" cy="8" r="2.4" fill="#E8720F" stroke="none"/></svg>',
    preguntas: [
      { q: '¿El chico mentía sobre no entrenar?', a: 'Sí, a su manera' },
      { q: '¿Entrenaba fuera de su casa?', a: 'No' },
      { q: '¿Alguien de la familia tiene que ver?', a: 'Sí' },
    ],
  },
  {
    titulo: 'La heladería que se llenó de golpe',
    historia: 'Una heladería llevaba años casi vacía. De un lunes para el otro, sin cambiar el menú, sin bajar los precios y sin hacer publicidad, empezó a llenarse todos los días.',
    respuesta: 'Enfrente de la heladería se inauguró un edificio de oficinas con cientos de empleados nuevos en la zona, que antes no existían como clientela cercana.',
    clave: 'oficinas',
    dificultad: 'Media',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3" fill="#E8720F" stroke="none"/><path d="M6.5 8l2.5 10 2.5-10"/><rect x="15" y="6" width="6" height="14"/><line x1="17" y1="9" x2="19" y2="9"/><line x1="17" y1="12" x2="19" y2="12"/><line x1="17" y1="15" x2="19" y2="15"/></svg>',
    preguntas: [
      { q: '¿La heladería cambió algo por dentro?', a: 'No' },
      { q: '¿El cambio vino de afuera?', a: 'Sí' },
      { q: '¿Tiene que ver con la cantidad de gente que circula por la zona?', a: 'Sí' },
    ],
  },
  {
    titulo: 'El micro con un pasajero de menos',
    historia: 'Un micro de larga distancia salió con todos los asientos ocupados y el mismo chofer de siempre. Llegó a destino con un pasajero menos a bordo, y nadie se sorprendió ni hizo preguntas.',
    respuesta: 'Un pasajero había comprado el pasaje solo hasta una parada intermedia y se bajó ahí con normalidad; nadie desapareció ni pasó nada raro.',
    clave: 'parada',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="9" rx="2"/><line x1="7" y1="7" x2="7" y2="16"/><line x1="17" y1="7" x2="17" y2="16"/><circle cx="7" cy="18" r="1.6" fill="#0F2A4D" stroke="none"/><circle cx="17" cy="18" r="1.6" fill="#E8720F" stroke="none"/></svg>',
    preguntas: [
      { q: '¿Pasó algo malo con ese pasajero?', a: 'No' },
      { q: '¿Se bajó en una parada autorizada?', a: 'Sí' },
      { q: '¿Había comprado el pasaje completo?', a: 'No' },
    ],
  },
  {
    titulo: 'La media maratón sin trampa',
    historia: 'Un corredor cruza la línea de llegada en primer lugar, mucho antes que el resto, sin haber corrido ni un metro del circuito que corrieron todos los demás. No hizo trampa y todos lo felicitan.',
    respuesta: 'Compite en la categoría de handbike (bicicleta de mano para personas con discapacidad), con su propio recorrido, y llega a la misma meta que la carrera general.',
    clave: 'bicicleta',
    dificultad: 'Media',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="16" r="5"/><circle cx="8" cy="16" r="1.4" fill="#E8720F" stroke="none"/><path d="M8 16 16 10"/><circle cx="18" cy="8" r="2"/></svg>',
    preguntas: [
      { q: '¿Corrió el mismo circuito que los demás?', a: 'No' },
      { q: '¿Compite en otra categoría?', a: 'Sí' },
      { q: '¿Hizo trampa?', a: 'No' },
    ],
  },
  {
    titulo: 'El boleto de más',
    historia: 'Un matemático siempre viaja en avión llevando un paquete propio en su valija. Cuando le preguntan qué lleva, explica que es más tranquilo así, aunque su explicación no tiene nada que ver con seguridad personal ni con miedo a volar.',
    respuesta: 'Calculó que la probabilidad de que haya un objeto peligroso en un avión ya es muy baja, y que la probabilidad de que haya dos al mismo tiempo, sin relación entre sí, es todavía muchísimo menor. Por eso lleva el suyo: cree que así reduce la chance de viajar junto a un segundo, sin darse cuenta de que su razonamiento de probabilidad está mal aplicado.',
    clave: 'probabilidad',
    dificultad: 'Difícil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="9" height="8" rx="1.4"/><path d="M7 10V8a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 11 8v2"/><path d="M14 12 22 6l-3 8-3-1-1-3Z" fill="#E8720F" stroke="none"/></svg>',
    preguntas: [
      { q: '¿Tiene miedo a volar?', a: 'No' },
      { q: '¿Su razón se basa en un cálculo de probabilidades?', a: 'Sí' },
      { q: '¿El razonamiento es correcto?', a: 'No, es un error clásico de lógica' },
    ],
  },
  {
    titulo: 'El ajedrecista que jugaba a ciegas por teléfono',
    historia: 'Un jugador amateur de ajedrez, sin ser un gran maestro, logra empatar o ganar partidas simultáneas contra dos grandes maestros de ajedrez, jugando ambas partidas al mismo tiempo por correspondencia, sin ayuda externa ni trampas técnicas.',
    respuesta: 'Juega una partida con blancas contra el maestro A y otra con negras contra el maestro B. En cada turno, copia la jugada que le hizo un maestro y se la pasa como propia al otro, dejando que ellos jueguen entre sí sin saberlo. En el peor de los casos empata las dos; en el mejor, gana una.',
    clave: 'copia',
    dificultad: 'Difícil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="12" height="12"/><line x1="3" y1="7" x2="15" y2="7"/><line x1="3" y1="11" x2="15" y2="11"/><line x1="7" y1="3" x2="7" y2="15"/><line x1="11" y1="3" x2="11" y2="15"/><rect x="16" y="13" width="6" height="9" rx="1.5" fill="#FDEBDA" stroke="#E8720F"/></svg>',
    preguntas: [
      { q: '¿Juega las dos partidas por separado, sin relación entre ellas?', a: 'No, están conectadas' },
      { q: '¿Copia las jugadas de un rival para pasárselas al otro?', a: 'Sí' },
      { q: '¿Hace trampa en el sentido de usar ayuda externa?', a: 'No' },
    ],
  },
  {
    titulo: 'El fuego que se apagó solo',
    historia: 'En una cocina se prende fuego una sartén con aceite. Nadie usa agua, nadie usa un matafuegos, nadie llama a los bomberos, y el fuego se apaga solo en pocos segundos sin dejar mayores daños.',
    respuesta: 'Alguien le puso la tapa a la sartén: sin oxígeno, el fuego se apaga solo. Es, además, la forma correcta de apagar un fuego de aceite (nunca con agua).',
    clave: 'oxigeno',
    dificultad: 'Fácil',
    dibujo: '<svg viewBox="0 0 24 24" width="72" height="72" fill="none" stroke="#0F2A4D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="10" cy="14" rx="7" ry="3"/><line x1="17" y1="14" x2="22" y2="12"/><path d="M6 14a4 3 0 0 1 8 0" fill="#FDEBDA" stroke="#E8720F"/><circle cx="10" cy="9" r="1" fill="#0F2A4D" stroke="none"/></svg>',
    preguntas: [
      { q: '¿Alguien echó agua?', a: 'No, y menos mal' },
      { q: '¿Se usó algo que ya estaba en la cocina?', a: 'Sí, la tapa de la sartén' },
      { q: '¿Tiene que ver con cortarle el oxígeno al fuego?', a: 'Sí' },
    ],
  },
];

let pensOrden = [];
let pensIndex = 0;
let pensFase = 'jugando'; // 'jugando' | 'confirmando' | 'revelado' | 'acertado'
let pensDesafioActual = '';
let pensPreguntasUsadas = new Set();

function iniciarPensamiento(){
  pensOrden = barajar(PENSAMIENTOS_LATERALES.map((_, i) => i));
  pensIndex = 0;
  pensFase = 'jugando';
  pensPreguntasUsadas = new Set();
  renderPensamiento();
}

function pensActual(){
  return PENSAMIENTOS_LATERALES[pensOrden[pensIndex]];
}

function renderPensamiento(){
  const p = pensActual();
  document.getElementById('pensamiento-sub').textContent = `Caso ${pensIndex + 1} de ${PENSAMIENTOS_LATERALES.length}`;
  const cont = document.getElementById('pensamiento-content');

  let abajoHTML;
  if(pensFase === 'acertado'){
    abajoHTML = `
      <div class="acertijo-respuesta">
        <div class="section-label">¡Correcto!</div>
        <p>${p.respuesta}</p>
      </div>
      <button class="btn-primary" onclick="siguientePensamiento()">Siguiente caso</button>`;
  } else if(pensFase === 'revelado'){
    abajoHTML = `
      <div class="acertijo-respuesta acertijo-respuesta-neutra">
        <div class="section-label">Solución</div>
        <p>${p.respuesta}</p>
      </div>
      <button class="btn-primary" onclick="siguientePensamiento()">Siguiente caso</button>`;
  } else if(pensFase === 'confirmando'){
    abajoHTML = `
      <div class="hero" style="margin-top:8px;">
        <h2>${pensDesafioActual}</h2>
      </div>
      <div class="acertijo-botones">
        <button class="btn-primary" onclick="confirmarRevelarPensamiento()">Sí, mostrame la solución</button>
        <button class="btn-ghost" onclick="cancelarRevelarPensamiento()">No, seguimos pensando</button>
      </div>`;
  } else {
    const preguntasHTML = p.preguntas.map((pr, i) => {
      if(pensPreguntasUsadas.has(i)){
        return `<div class="pens-pregunta pens-pregunta-usada"><span>${pr.q}</span><span class="pens-pregunta-resp">${pr.a}</span></div>`;
      }
      return `<button class="pens-pregunta-btn" onclick="usarPistaPensamiento(${i})"><span>${pr.q}</span><span class="pens-costo">-1 pto</span></button>`;
    }).join('');
    abajoHTML = `
      <input type="text" id="pensamiento-respuesta-input" class="bingo-input-numero" style="width:100%; margin-top:0;" placeholder="Escribí tu solución" onkeydown="if(event.key==='Enter') comprobarPensamiento();">
      <button class="btn-primary" onclick="comprobarPensamiento()">Comprobar respuesta</button>
      <div class="section-label">Preguntas de sí/no (opcionales, -1 punto c/u)</div>
      <div class="pens-preguntas">${preguntasHTML}</div>
      <button class="btn-ghost" onclick="pedirRevelarPensamiento()">Me doy por vencido, mostrar solución</button>`;
  }

  cont.innerHTML = `
    <div class="progress-bar"><div class="progress-fill" style="width:${((pensIndex + 1) / PENSAMIENTOS_LATERALES.length) * 100}%"></div></div>
    <div class="question-box">
      <div class="qnum">CASO ${pensIndex + 1} · DIFICULTAD ${p.dificultad.toUpperCase()}</div>
      <div class="pens-dibujo">${p.dibujo}</div>
      <h3>${p.titulo}</h3>
      <p class="pens-historia">${p.historia}</p>
    </div>
    ${abajoHTML}`;

  if(pensFase === 'jugando'){
    const input = document.getElementById('pensamiento-respuesta-input');
    if(input) input.focus();
  }
}

function usarPistaPensamiento(i){
  if(pensPreguntasUsadas.has(i)) return;
  pensPreguntasUsadas.add(i);
  renderPensamiento();
}

// 5 puntos por acertar, menos 1 por cada pregunta sugerida que hayan usado en este caso.
function comprobarPensamiento(){
  const input = document.getElementById('pensamiento-respuesta-input');
  const intento = input ? input.value : '';
  const p = pensActual();
  if(esRespuestaCorrecta(intento, p.clave)){
    reproducirTono('correcto');
    const puntos = Math.max(0, 5 - pensPreguntasUsadas.size);
    ganarMonedas(puntos);
    mostrarToast(`+${puntos} monedas, ¡lo resolviste!`, 'gain');
    pensFase = 'acertado';
  } else {
    reproducirTono('incorrecto');
    mostrarToast('No es eso... ¡seguí pensando o pedí una pista!');
  }
  renderPensamiento();
}

function pedirRevelarPensamiento(){
  pensDesafioActual = ACERTIJO_DESAFIOS[Math.floor(Math.random() * ACERTIJO_DESAFIOS.length)];
  pensFase = 'confirmando';
  renderPensamiento();
}

function confirmarRevelarPensamiento(){
  pensFase = 'revelado';
  renderPensamiento();
}

function cancelarRevelarPensamiento(){
  pensFase = 'jugando';
  renderPensamiento();
}

function siguientePensamiento(){
  pensFase = 'jugando';
  pensPreguntasUsadas = new Set();
  if(pensIndex < PENSAMIENTOS_LATERALES.length - 1){
    pensIndex++;
    renderPensamiento();
  } else {
    renderResultadoPensamiento();
  }
}

function renderResultadoPensamiento(){
  document.getElementById('pensamiento-sub').textContent = 'Pensamiento lateral';
  document.getElementById('pensamiento-content').innerHTML = `
    <div class="hero" style="margin-top:8px;">
      <h2>¡Resolviste los 20 casos!</h2>
      <p>¿Jugamos otra ronda, en otro orden?</p>
    </div>
    <button class="btn-primary" onclick="iniciarPensamiento()">Jugar de nuevo</button>`;
}
