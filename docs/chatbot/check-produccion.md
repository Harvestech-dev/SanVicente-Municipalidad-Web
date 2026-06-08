
  Flujos a recorrer:

  1. Primera licencia — selección tipo trámite → categoría → requisitos → libre de multas (link WhatsApp Juzgado) → costo → turno/centro.
  2. Renovación — mismo árbol, rama renovación. Verificar requisitos distintos a primera vez.
  3. Duplicado / cambio domicilio — ramas menos usadas, probables huecos de copy.
  4. Selector localidad — domicilio DNI en localidad del circuito → confirma "tramita en San Vicente". Probar localidad fuera de lista.
  5. Contacto WhatsApp — cada botón wa.me abre chat con número 301207 y texto correcto. Probar en celular real (deep link app).
  6. Descarga PDF — footer muestra WhatsApp 3492 301207. Generar y revisar.
  7. Avance en requisitos — checklist/progreso (cambio reciente, commit 7f494d3). Marcar/desmarcar, persistencia.

  Test usabilidad

  - Mobile-first: 360px ancho. Botones tap ≥44px, sin overflow horizontal.
  - Volver atrás: cada paso debe poder retroceder sin perder estado.
  - Reinicio: ¿se puede empezar de nuevo sin recargar?
  - Carga/latencia: estados sin spinner infinito.
  - Teclado/foco: tab navega, foco visible (commits recientes tocaron outline/foco — verificar).
  - Contraste: texto sobre fondos de marca legible (WCAG AA).
  - Sin dead-ends: todo nodo terminal ofrece acción siguiente (contacto, turno, volver).

  Revisión copy — instancias

  - Números/contacto: WhatsApp 3492 301207, tel (03492) 471253, mail licenciadeconducirsv@gmail.com, dirección Buenos Aires 96,  Revisión copy — instancias
  - Contraste: texto sobre fondos de marca legible (WCAG AA).
  - Sin dead-ends: todo nodo terminal ofrece acción siguiente (contacto, turno, volver).

  Revisión copy — instancias

  - Números/contacto: WhatsApp 3492 301207, tel (03492) 471253, mail licenciadeconducirsv@gmail.com, dirección Buenos Aires 96h  - Teclado/foco: tab navega, foco visible (commits recientes tocaron outline/foco — verificar).
  - Contraste: texto sobre fondos de marca legible (WCAG AA).
  - Sin dead-ends: todo nodo terminal ofrece acción siguiente (contacto, turno, volver).

  Revisión copy — instancias

  - Números/contacto: WhatsApp 3492 301207, tel (03492) 471253, mail licenciadeconducirsv@gmail.com, dirección Buenos Aires 96,
  horario Lun–Vie 7:30–13:00. Coherencia entre licencia.json, PDF, chatbot.
  - Mensajes wa.me: texto pre-cargado correcto y sin %20 mal escapado.
  - Tono: consistente (vos/usted) en todos los nodos.
  - Typos / tildes: revisar licencia-guia.json completo.
  - Requisitos: vigentes y exactos (montos, documentos).
  - Doc vs prod: docs/chatbot/chatbot_licencia_sv_v6.html es copia de referencia — confirmar si debe publicarse o solo public/.

  Pre-publish gate

  - [ ] pnpm install && pnpm build sin errores (pnpm, no npm)
  - [ ] Links externos (maps, wa.me) 200 / abren
  - [ ] Revisar en Chrome + Safari iOS + Android
  - [ ] PR a master, no commit directo