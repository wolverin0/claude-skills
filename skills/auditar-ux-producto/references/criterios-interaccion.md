# Criterios de diseño de interacción: acciones, contenedores y formularios

Guía operativa para decidir dónde ubicar botones, cuándo usar modales, paneles laterales o páginas dedicadas, cuándo unir o separar pasos y cómo controlar la incorporación de funciones nuevas.

---

## 1. Dónde ubicar las acciones según su alcance

La pregunta rectora es: **«¿Sobre qué objeto o conjunto estoy actuando y en qué momento de la tarea lo necesito?»**

| Alcance de la acción | Ubicación recomendada | Ejemplos claros | Errores frecuentes a corregir |
|---|---|---|---|
| **Toda la colección o módulo** | Cabecera de la vista o barra superior de herramientas. | *Nuevo producto*, *Importar lista*, filtros globales, selector de sucursal/ubicación. | Repetir botones globales dentro de cada fila o esconder el filtro principal en un submenú. |
| **Un objeto individual** | En la fila correspondiente de la tabla o en la cabecera/barra de su vista de detalle. | *Ajustar stock*, *Registrar pago*, *Editar*, *Ver historial*. | Obligar a ir a otro módulo y volver a buscar por código el objeto que el usuario ya tenía frente a sí. |
| **Varios objetos seleccionados** | Barra contextual de selección (aparece o se activa al marcar elementos). | *Cambiar estado en lote*, *Exportar seleccionados*, *Asignar responsable*. | Mostrar permanentemente 8 botones de lote deshabilitados o ejecutar una acción masiva sin indicar cuántos registros afectará. |
| **La tarea o formulario en curso** | Área de acciones del formulario (pie visible o cabecera fija del editor). | *Guardar borrador*, *Confirmar ajuste*, *Emitir factura*, *Cancelar*. | Mezclar el botón de envío del formulario con acciones secundarias de navegación o hacer que desaparezca fuera del viewport sin barra fija. |

### Jerarquía y visibilidad de botones
- **Acción principal por contexto de decisión:** cada unidad de decisión debe dejar claro cuál es el camino principal (ej. *Confirmar devolución*) y cuál es la salida segura (*Cancelar* / volver conservando el contexto). No fuerces "un único botón destacado en toda la pantalla" si la vista combina legítimamente dos contextos independientes (por ejemplo, una barra de búsqueda operativa y un panel de resultados).
- **Cuidado con el menú de tres puntos (`...`):** agrupar acciones secundarias o destructivas poco frecuentes en un menú desplegable ayuda a reducir ruido, pero **nunca ocultes ahí la acción principal por la que el rol entra a esa tabla** sin comprobar el costo en clics y tiempo para quien procesa decenas de filas seguidas.
- **Etiquetas con verbo y objeto o efecto claro:** preferí *"Ajustar stock"*, *"Guardar borrador"*, *"Emitir y enviar"* antes que etiquetas ambiguas como *"Aceptar"*, *"Procesar"* o *"Continuar"* cuando la acción tiene consecuencias finales.

---

## 2. Cuándo usar cada contenedor (Inline, Panel lateral, Modal, Página dedicada, Pasos)

No elijas un modal por costumbre ni una página nueva para cada microedición. Evaluá la tarea según estos criterios (alineados con las guías de formularios y diálogos de IBM Carbon y W3C ARIA APG):

| Contenedor | Cuándo elegirlo | Cuándo evitarlo | Requisitos de continuidad y accesibilidad |
|---|---|---|---|
| **Edición en el lugar (Inline)** | Cambio breve de 1–2 datos que se comprende viendo la fila o tarjeta actual (ej. cambiar estado, responsable o cantidad rápida). | Cuando el cambio exige explicar motivos extensos, adjuntar respaldos o desencadena cálculos complejos en cascada. | Mostrar estado de guardado claro, permitir cancelar con `Escape` y no desplazar bruscamente la fila activa. |
| **Panel lateral (Drawer / Split view)** | Revisar o editar un registro **conservando visible la lista filtrada** para trabajar varios ítems consecutivos sin perder la referencia. | Cuando el formulario necesita comparar tablas anchas, múltiples columnas o subtareas anidadas que quedan apretadas en un ancho reducido. | Mantener filtros, selección y scroll del listado base; marcar claramente qué fila está abierta; adaptar a pantalla completa en móvil. |
| **Modal (Diálogo)** | Decisión acotada, confirmación con consecuencias explícitas o subtarea breve que requiere atención exclusiva antes de volver exactamente al mismo punto. | **Nunca reconstruir una aplicación entera dentro de un modal:** evitar formularios largos, tablas con paginación interna, modales sobre modales o tareas que requieran consultar datos tapados por el propio diálogo. | Mover el foco al abrir, contener la navegación por teclado (`Tab`), cerrar con `Escape` (con resguardo si hay datos cargados), tener título accesible (`aria-labelledby`) y devolver el foco al control que lo abrió. |
| **Página dedicada** | Tarea extensa con varias secciones, renglones de detalle, consulta de historial, carga de adjuntos, necesidad de compartir URL o de retomar más tarde. | Para confirmaciones simples o cambios de un solo atributo que obligan a perder el listado y esperar dos cargas completas de página. | **Preservar el contexto de origen en la URL o sesión** (ej. `?location_id=17` o filtros activos) tanto al entrar como en el botón *Cancelar / Volver*. |
| **Flujo por pasos (Wizard / Stepper)** | Cuando existen dependencias reales entre etapas (el paso 2 depende de lo elegido en el paso 1) o una tarea poco frecuente necesita guía progresiva. | Para tareas diarias de operadores expertos donde partir 6 campos conocidos en 4 pantallas sólo multiplica clics y oculta el panorama completo. | Permitir revisar y corregir pasos previos sin perder lo ingresado; indicar claramente en qué paso se actúa y cuándo se ejecuta el efecto final. |

### Preguntas de control para elegir entre Modal, Panel lateral y Página dedicada
1. ¿La persona necesita seguir viendo la lista o comparar con otros registros mientras decide? → **Panel lateral** o vista dividida.
2. ¿Qué pasa si aparece un error o le falta un dato y tiene que buscarlo en otra parte? → Si un **modal** la obliga a cerrarlo y perder todo lo escrito, usá **página dedicada** o **panel con borrador**.
3. ¿Cómo vuelve al listado después de guardar o cancelar? → Debe volver manteniendo la tienda, ubicación, búsqueda, filtros y posición que tenía antes de abrir el editor.
4. ¿Cómo se comporta en tablet y teléfono (`768px` y `390px`)? → Sin desborde horizontal, con acciones principales accesibles y sin controles tapados.

---

## 3. Cuándo juntar pasos y cuándo mantenerlos separados

### Cuándo unir pasos en uno solo
- Cuando dos pantallas o botones consecutivos forman parte de **la misma decisión del mismo rol** y comparten los mismos datos (por ejemplo, buscar un producto desde una ubicación ya filtrada y abrir su ajuste manteniendo esa ubicación preseleccionada).
- Cuando la separación actual obliga a **copiar o recordar un código/importe** de un paso para pegarlo manualmente en el siguiente.
- Cuando un modo de búsqueda por defecto puede **resolver con fallback inteligente** (por ejemplo, si el operador busca ventas por código de producto, variante o etiqueta sin haber cambiado antes un selector secundario).

### Cuándo mantener pasos separados
- **Borrador vs. Entidad activa (SAP Fiori Draft Handling):** preservar cambios parciales en un borrador no es lo mismo que emitir una factura, impactar stock o confirmar una devolución. Cuando la acción final tiene consecuencias contables o de inventario, diferenciá claramente *Guardar borrador* de *Confirmar / Emitir*.
- **Cambio de responsable o aprobación:** cuando quien prepara la operación no es quien la autoriza, mantené separados el envío a revisión y la aprobación, dejando visible el estado intermedio.
- **Confirmación de consecuencias no obvias:** si una devolución afecta una venta que tuvo descuentos o recargos, mostrá una advertencia clara en contexto con el monto real a reintegrar antes de ejecutar la acción.

> **Sobre la "regla de los 3 clics":** no uses un tope arbitrario de tres clics como ley universal. Reducir clics mejora la UX sólo cuando reduce carga mental, reingreso de datos o cambios de contexto; comprimir diez decisiones distintas en una sola pantalla sobrecargada empeora el uso y aumenta los errores.

---

## 4. Filtro para evitar que próximas funciones vuelvan a sobrecargar el producto

Antes de aprobar o diseñar una función nueva o un botón adicional, exigí respuestas concretas a estas siete preguntas:

1. **¿Qué tarea existente mejora o qué objetivo nuevo habilita?**
2. **¿Qué rol la necesita y con qué frecuencia?**
3. **¿Dónde esperaría encontrarla ese rol dentro de su recorrido natural?**
4. **¿Qué decisiones nuevas le exige tomar al usuario?**
5. **¿Qué trabajo manual o paso redundante elimina a cambio?**
6. **¿Qué ocurre si falla, queda a mitad de camino o se ejecuta por error?**
7. **¿Cómo vamos a verificar que realmente facilitó el trabajo?**

### Dinamismo predecible
Una interfaz "dinámica" en un sistema operativo debe responder al contexto (precargar tienda/ubicación única, actualizar el placeholder según el criterio elegido, habilitar el botón de envío cuando hay ítems válidos seleccionados, mostrar herramientas de lote al seleccionar filas) **sin mover repentinamente los botones de lugar ni reordenar la fila sobre la que el usuario está por hacer clic**.
