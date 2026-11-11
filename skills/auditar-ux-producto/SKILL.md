---
name: auditar-ux-producto
description: "Audita la usabilidad de aplicaciones centrada en tareas, diseño de interacción y arquitectura de información. Evalúa recorridos, acciones duplicadas, pasos evitables, contenedores (modales, paneles laterales, páginas dedicadas), formularios, manejo de errores y políticas de notificaciones o trabajo pendiente en productos operativos (ERP, CRM, paneles). Prepara comparaciones visuales antes/después con recomendaciones seleccionables y mantiene las decisiones de interacción en DESIGN.md."
---

# Auditoría UX de producto (`auditar-ux-producto`)

Esta skill conduce una **auditoría de usabilidad centrada en tareas, diseño de interacción y arquitectura de información**. Su objetivo es que una aplicación sea comprensible, ágil y predecible para las personas que la usan a diario, evitando tanto la acumulación de botones y funciones redundantes como las simplificaciones ciegas que rompen controles de negocio.

Separa siempre tres planos distintos:

1. **Organización del trabajo del usuario:** qué intenta lograr cada rol, con qué información, en qué secuencia y con qué excepciones.
2. **Diseño de la interacción:** dónde están las acciones, qué contenedor conviene usar, cuándo unir o separar pasos, cómo se guarda el progreso y cómo responde el sistema.
3. **Expresión visual:** jerarquía, lectura, agrupación y consistencia con el sistema de diseño del producto.

---

## Principios operativos obligatorios

1. **Exigir evidencia y separar niveles de certeza:** distinguí explícitamente lo **comprobado** (observado en navegador, capturas, trazas o código verificado), lo **inferido** (deducido de la estructura o del dominio) y lo **pendiente de validar** (hipótesis o datos de uso real aún no medidos).
2. **Prohibido inventar un puntaje único artificial:** no resumas la auditoría en un `"UX Score: 87/100"`. Describí problemas y consecuencias operativas concretas (*"se pierde el filtro al volver"*, *"se anuncia éxito antes de que termine el procesamiento"*, *"el operador vuelve a ingresar un dato ya conocido"*).
3. **Separar gravedad, frecuencia y confianza:** un fallo puede ser muy grave aunque ocurra poco (ej. confirmar un pago que luego falla en segundo plano) o muy frecuente pero de bajo riesgo. No los mezcles en una sola etiqueta opaca.
4. **Primera pasada con señales de usuario:** cuando audites una interfaz navegable o en capturas, intentá primero encontrar y entender las acciones usando únicamente las señales visibles para la persona usuaria. Encontrar una función leyendo su nombre interno en el código fuente **no demuestra** que sea descubrible en la pantalla.
5. **Proteger lo que funciona y permitir concluir `"conservar esto"`:** antes de proponer cambios, identificá qué partes del flujo actual resuelven bien el trabajo, protegen permisos/aprobaciones o brindan accesos contextuales útiles. Si una auditoría siempre agrega componentes, menús o pantallas nuevas, agrava el problema original.
6. **No confundir simulación por IA con validación humana:** que un agente o un usuario sintético complete un flujo no demuestra que sea intuitivo para usuarios reales. Tratá las recorridas sintéticas como hipótesis e inspección experta.

---

## Proceso de auditoría en 8 etapas (más una exportación opcional)

### 1. Reconstruir el producto desde el trabajo de las personas
Antes de opinar sobre botones o pantallas, levantá un mapa compacto de:
- **Roles y responsabilidades:** quién opera, quién supervisa, quién aprueba.
- **Resultados buscados por rol:** formulados como objetivos de trabajo (ej. *"aplicar una transferencia parcial a la factura correcta dejando claro el saldo pendiente"*), no como clics en la interfaz actual (*"abrir la pestaña Pagos y tocar Agregar"*).
- **Objetos del negocio, estados y transiciones:** clientes, pedidos, facturas, pagos, stock, reclamos, borradores, aprobaciones.
- **Permisos, aprobaciones y consecuencias:** qué acciones son reversibles y cuáles comprometen dinero, inventario, auditoría o terceros.
- **Trabajo entre personas o fuera de la app:** pasos que hoy obligan a copiar datos a una planilla, pedir confirmación por otro canal o recordar información vista en otra vista.

Consultá el detalle metodológico en [references/metodo-auditoria.md](references/metodo-auditoria.md).

### 2. Registrar el recorrido actual antes de rediseñarlo
Para cada tarea prioritaria, documentá el recorrido real de punta a punta:
- Punto de partida y señales de entrada.
- Información que la persona necesita tener a la vista para decidir.
- Decisiones que debe tomar y cambios de contexto (saltos de página, modales, pestañas).
- Datos que el sistema ya conoce pero obliga a volver a escribir o buscar.
- Cómo reconoce que la tarea terminó.
- **Caminos de excepción:** estado vacío, carga, error de validación, fallo de red/servidor, permisos insuficientes, cambios sin guardar, operación asincrónica en segundo plano y resultado parcial.

### 3. Ejecutar dos pasadas: comprensión y operación cotidiana
Evaluá cada recorrido en dos niveles complementarios (detalle en [references/metodo-auditoria.md](references/metodo-auditoria.md)):
- **Pasada de comprensión (recorrido cognitivo):**
  1. ¿La persona entiende qué necesita hacer en este punto?
  2. ¿Encuentra la acción adecuada?
  3. ¿Relaciona la etiqueta y ubicación del control con el resultado que busca?
  4. ¿Después de actuar comprende qué ocurrió y si avanzó?
- **Pasada de operación cotidiana (marco CASTLE para software de trabajo):**
  - ¿Puede procesar varios registros seguidos sin repetir búsquedas?
  - ¿Se conservan filtros, orden, selección y posición de scroll al volver?
  - ¿Puede retomar una tarea interrumpida (ej. tras una llamada) sin perder lo cargado?
  - ¿Necesita memorizar datos de una pantalla para usarlos en otra?
  - ¿Puede resolver excepciones sin reiniciar todo el flujo?
  - ¿Existen aceleradores útiles para usuarios frecuentes sin sobrecargar al ocasional?

### 4. Evaluar redundancias con significado de negocio
No fusiones ni elimines botones sólo porque se llaman parecido. Compará cada acción candidata con la fórmula:

> **Objeto + operación + alcance + estado + permisos + consecuencias**

- **Accesos contextuales legítimos (conservar):** *"Registrar pago"* desde una factura (con cliente y documento ya definidos) y *"Registrar pago"* desde la ficha del cliente o Caja pueden ser dos entradas útiles a la misma operación.
- **Duplicación real (consolidar):** dos formularios distintos para la misma operación con validaciones, nombres o efectos divergentes.
- **Operaciones distintas (no mezclar):** no fusiones automáticamente *anular*, *eliminar*, *archivar* y *revertir* sin verificar sus efectos contables, legales o de estado.
- **Funciones de baja frecuencia:** no recomiendes eliminar cierres periódicos, exportaciones regulatorias o herramientas de auditoría sin evidencia sobre su uso y obligatoriedad.

### 5. Decidir ubicación de acciones, contenedores y pasos
Aplicá las reglas operativas de [references/criterios-interaccion.md](references/criterios-interaccion.md):
- **Ubicación por alcance:** cabecera/barra para toda la colección; fila o vista de detalle para un objeto; barra contextual flotante/superior cuando hay selección múltiple; pie o barra del formulario para la tarea en curso.
- **Acción principal por contexto de decisión:** evitá tanto llenar la pantalla de botones primarios competidores como imponer artificialmente "un solo botón primario por página" cuando conviven contextos legítimos. No escondas acciones de alta frecuencia bajo un menú de tres puntos (`...`) sólo para limpiar visualmente la tabla si eso enlentece el trabajo diario.
- **Elección del contenedor:**
  - **Edición en el lugar (inline):** ajuste puntual que se comprende junto al dato.
  - **Panel lateral (drawer / split view):** inspeccionar o editar un registro manteniendo visible la lista filtrada para procesar varios casos consecutivos.
  - **Modal:** decisión o subtarea breve que requiere atención exclusiva, con foco contenido, cierre claro y retorno exacto al punto anterior.
  - **Página dedicada:** trabajo extenso, múltiples secciones, consulta de historial o necesidad de guardar borrador y retomar.
  - **Flujo por pasos (wizard):** secuencia con dependencias reales o configuración infrecuente guiada.
- **Cuándo unir o separar pasos:** uní pasos que comparten decisión e información; mantenelos separados cuando cambia el responsable (ej. carga vs aprobación), cuando hay consecuencias irreversibles o cuando conviene distinguir entre **guardar borrador** y **confirmar/emitir una entidad activa**.

### 6. Auditar feedback, errores, notificaciones y trabajo pendiente
Aplicá la política detallada en [references/notificaciones-y-feedback.md](references/notificaciones-y-feedback.md):
- Distinguí siempre cuatro mecanismos: **Actividad** (historial consultable), **Feedback** (respuesta inmediata a la acción), **Notificación** (aviso oportuno a un rol) y **Trabajo pendiente** (tarea o excepción con responsable, contexto, acción directa y estado de resolución).
- **Veracidad del estado:** jamás anuncies como exitoso un pago, sincronización o proceso en segundo plano que todavía puede fallar; informá *"En procesamiento"* / *"Pendiente de confirmación"* y convertí el fallo posterior en trabajo pendiente recuperable.
- **Persistencia proporcional a la consecuencia:** no uses un toast fugaz como único canal para comunicar un error que requiere corrección o recuperación.
- **Estados separados:** `leído`, `descartado` y `resuelto` son estados distintos. Marcar una alerta como leída nunca debe dar por resuelta una conciliación o excepción.
- **Agrupación:** si falla una integración sobre 80 registros, generá un incidente agrupado con acceso al listado afectado en lugar de 80 notificaciones sueltas.

### 7. Preparar una comparación visual antes y después
Cuando el usuario pida evaluar propuestas visuales o comparar el antes y el después, seguí obligatoriamente [references/comparacion-visual.md](references/comparacion-visual.md):
1. **Conservar un "antes" verificable:** capturas, ruta o referencia reproducible en **condiciones equivalentes** (misma tarea, mismo rol, mismos datos y filtros, mismo tamaño de pantalla, textos de longitud realista y los mismos estados de edición/error/guardado/regreso).
2. **Asignar IDs seleccionables a cada recomendación (`C01`, `C02`, `C03`...):** especificá cuáles son independientes, cuáles dependen de otra y cuáles son **alternativas mutuamente excluyentes** (ej. `C02` página dedicada vs `C03` panel lateral para el mismo editor).
3. **Resolver conflictos antes de "Aplicar todo":** si dos recomendaciones compiten sobre el mismo flujo, señalá el conflicto explícitamente y ofrecé **conjuntos compatibles recomendados** (ej. *Conjunto A: flujo en lista con panel lateral* vs *Conjunto B: flujo en página dedicada*), además de la evaluación individual.
4. **Honestidad del selector y la vista previa:** marcar una casilla o elegir una combinación **no permite afirmar que la vista previa ya muestra esa combinación** si todavía no se renderizó. Si falta generarla, identificala explícitamente como **`combinación pendiente de generar`** y producila antes de presentarla como resultado.
5. **Nivel de fidelidad:** usá comparación visual estática/HTML para decisiones de jerarquía, agrupación y proximidad de acciones; proponé o construí un prototipo navegable cuando la decisión dependa del recorrido (errores, interrupción, conservación de filtros al volver, adaptación móvil).

### 8. Documentar en `DESIGN.md` y verificar la implementación
Para evitar que futuros cambios con IA vuelvan a degradar el flujo, integrá las decisiones con `DESIGN.md` siguiendo [references/design-md-integraciones.md](references/design-md-integraciones.md):
1. **Leer lo existente:** revisá `DESIGN.md`, `PRODUCT.md` (si existe), tokens, componentes y pantallas reales.
2. **Registrar discrepancias:** si `DESIGN.md` declara una regla y la app hace otra, clasificá si es una desviación de implementación, documentación desactualizada o una transición incompleta.
3. **Separar reglas vigentes de propuestas:** mientras se comparan alternativas, `DESIGN.md` conserva las reglas vigentes. Las recomendaciones en revisión o elegidas pero aún no implementadas se marcan como **propuestas pendientes de implementación**.
4. **Incorporar con motivo explícito:** una vez implementado y verificado el cambio, actualizá `DESIGN.md` explicando **qué se hace y por qué** (ej. *"Se conserva el listado al editar porque la tarea requiere revisar varios registros seguidos; cuando la edición exige historial y reanudación, se usa página dedicada"*).

### 9. Exportar los cambios elegidos (solo si un orquestador o el usuario lo pide)
Cuando esta auditoría alimenta a otro proceso (por ejemplo `/battle-test --ux`), cerrala con una exportación; si nadie la pidió, no la hagas. Qué entra lo decide la persona operadora: presentá la tabla `C01..Cn` y los conjuntos compatibles de la etapa 7 y esperá su elección (una sola pausa). Si no hay herramienta para preguntar, escribí la decisión como pendiente en GATED y detenete.
1. **Ids con prefijo `UX-`** (`H03` → `UX-H03`, `C02` → `UX-C02`) para no chocar con los hard-stops `H1..H11` de otras auditorías ni con los `T##` de `TRACKS.md`. El prefijo se aplica solo al exportar: las plantillas siguen numerando `H01`, `C01`.
2. **`TRACKS.md`** (raíz del worktree), sección `## AUTO`: un ítem por hallazgo resuelto por los `Cnn` elegidos, con el formato de la [plantilla 7](references/plantillas.md). El `T##` de `TRACKS.md` es propio: no lo mezcles con los `T01` de las tareas auditadas. Orden: respetá las dependencias entre `Cnn`; nunca dos alternativas excluyentes.
3. **`ux-findings.json`** (raíz del worktree): el criterio de aceptación de cada ítem (rol, ruta, pasos, resultado observable y qué se conserva), con las claves de la plantilla 7.
4. **Lo no elegido** va a `## GATED` de `TRACKS.md` y a `gated.json` con `needs` = `decisión del operador`.
5. `TRACKS.md` y `ux-findings.json` son artefactos de trabajo: no se commitean.
6. Cada ítem puede nombrar en `skill` qué skill de diseño conviene, según [references/design-md-integraciones.md](references/design-md-integraciones.md), siempre como «si está instalada».
7. `DESIGN.md` no se toca acá: sigue siendo la etapa 8, después de implementar y verificar.

---

## Entregables y plantillas

Usá las estructuras de [references/plantillas.md](references/plantillas.md) para presentar el resultado:
- **Mapa de tareas, roles y recorrido actual** (incluyendo excepciones).
- **Evaluación de acciones duplicadas o conflictivas.**
- **Hallazgos priorizados** (con Tarea/rol, Evidencia, Consecuencia, Gravedad/Frecuencia/Confianza, Cambio propuesto, Qué conservar, Riesgo/compromiso y Criterio de aceptación).
- **Tabla de recomendaciones seleccionables (`C01..Cn`) y conjuntos compatibles** para comparación antes/después.
- **Ficha de política de notificaciones y trabajo pendiente** (cuando aplique a ERP/CRM/operaciones).
- **Propuesta o actualización de `DESIGN.md`** diferenciando estado vigente vs propuesto.
- **Exportación a `TRACKS.md` y `ux-findings.json`** de los `Cnn` elegidos (solo si la pide un orquestador o el usuario).

---

## Mapa de documentos de apoyo

Cargá únicamente los archivos de referencia necesarios para el encargo actual:

- [references/metodo-auditoria.md](references/metodo-auditoria.md) — Análisis de tareas, recorrido cognitivo, heurísticas, marco CASTLE, detección semántica de redundancias y orden de intervención mínima.
- [references/criterios-interaccion.md](references/criterios-interaccion.md) — Reglas para ubicar acciones según alcance, elegir entre inline/panel lateral/modal/página/pasos, manejar borradores y evaluar funciones nuevas.
- [references/notificaciones-y-feedback.md](references/notificaciones-y-feedback.md) — Separación entre actividad, feedback, notificación y trabajo pendiente; matriz de interrupción; ficha de aprobación y accesibilidad de mensajes de estado.
- [references/comparacion-visual.md](references/comparacion-visual.md) — Protocolo de comparación antes/después en condiciones equivalentes, recomendaciones seleccionables, manejo de conflictos y honestidad de vistas previas.
- [references/design-md-integraciones.md](references/design-md-integraciones.md) — Gobernanza con `DESIGN.md` (formato Google/Stitch) y uso selectivo de complementos opcionales (Design with Intent, Impeccable, UI UX Pro Max, Emil Design Eng, Taste, Playwright, axe-core).
- [references/plantillas.md](references/plantillas.md) — Plantillas listas para documentar hallazgos, comparaciones antes/después, fichas de notificación y reglas de `DESIGN.md`.
- [references/fuentes.md](references/fuentes.md) — Fuentes metodológicas, guías de sistemas de diseño y proyectos de referencia utilizados.
