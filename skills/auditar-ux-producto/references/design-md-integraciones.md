# Integración con `DESIGN.md` y herramientas complementarias

Una auditoría UX pierde su valor si en la siguiente sesión otro agente vuelve a agregar modales innecesarios, botones duplicados o toasts para errores críticos. Este documento define cómo conservar las decisiones en `DESIGN.md` y cómo articular `auditar-ux-producto` con otras skills o herramientas cuando estén disponibles.

---

## 1. Gobernanza persistente con `DESIGN.md` (formato Google/Stitch)

El proyecto [`google-labs-code/design.md`](https://github.com/google-labs-code/design.md) de **Google/Stitch** propone combinar **tokens estructurados (YAML)** con **criterios y explicaciones en prosa (Markdown)**. Los tokens fijan valores concretos (colores, tipografía, espaciado); la prosa documenta la intención, la jerarquía y el comportamiento esperado por los agentes de código.

### Qué decisiones de interacción incorporar en `DESIGN.md`
Además de la identidad visual, `DESIGN.md` debe registrar las **decisiones de interacción acordadas para el producto**, especialmente en aplicaciones operativas (ERP, CRM, POS):

| Área | Qué regla documentar | Por qué registrar el motivo |
|---|---|---|
| **Acciones y alcance** | Dónde viven las acciones de colección, de fila/detalle, de lote y de formulario; cómo se nombran los verbos principales. | Evita que futuras funciones agreguen botones sueltos en lugares arbitrarios. |
| **Contenedores (Modal / Panel / Página)** | Cuándo corresponde usar edición inline, panel lateral, modal o página dedicada en este producto. | Impide meter formularios complejos dentro de modales o abrir páginas nuevas para microacciones. |
| **Continuidad de contexto** | Qué parámetros deben preservarse al navegar y al volver (ej. `location_id`, tienda activa, filtros de búsqueda). | Previene regresiones donde un ajuste o cancelación devuelve al usuario a una ubicación por defecto equivocada. |
| **Guardado y confirmación** | Diferencia entre borrador, ajuste directo y operación confirmada/emitida. | Protege contra acciones destructivas o contables ejecutadas sin contexto claro. |
| **Errores y feedback** | Dónde se muestran los errores de validación, las advertencias de cálculo (ej. descuentos en devoluciones) y los estados en segundo plano. | Evita toasts fugaces para errores que requieren acción y falsos mensajes de éxito prematuro. |
| **Notificaciones y pendientes** | Qué eventos van a historial, cuáles notifican y cuáles crean trabajo pendiente con responsable y estado de resolución. | Mantiene limpia la atención del operador y separa *leído* de *resuelto*. |

**Incluí siempre la razón operativa de cada regla.** Por ejemplo:

> *Se conserva el listado filtrado al editar o cancelar un ajuste de stock (`location_id`) porque el operador audita una sucursal completa de corrido; perder la ubicación al volver introduce errores de carga en la sucursal equivocada.*

---

## 2. Ciclo de trabajo con `DESIGN.md` durante la auditoría

Seguí siempre este ciclo de cuatro pasos:

1. **Leer lo existente primero:** antes de auditar o proponer cambios, leé `DESIGN.md` (y `PRODUCT.md` o documentos equivalentes de dominio si existen en el repositorio), además de inspeccionar los componentes y pantallas reales.
2. **Registrar discrepancias con precisión:** si `DESIGN.md` dice una cosa y la aplicación hace otra, no asumas automáticamente cuál está mal. Clasificá la discrepancia como:
   - *Desviación de la implementación:* la regla vigente es correcta pero una pantalla la incumple.
   - *Documentación desactualizada:* el producto evolucionó con criterio válido y falta reflejarlo en el documento.
   - *Transición incompleta:* conviven el patrón viejo y el nuevo a mitad de migración.
3. **Separar reglas vigentes de propuestas pendientes:**
   - Mientras el usuario está revisando comparaciones antes/después o eligiendo entre `C01`, `C02`, `C03`, **el `DESIGN.md` vigente no debe presentar como regla activa una alternativa que sólo se está explorando**.
   - Toda modificación al documento asociada a recomendaciones no implementadas aún debe etiquetarse claramente como **`Propuesta pendiente de implementación (vinculada a Cxx)`**.
4. **Actualizar tras implementar y comprobar:** una vez que el cambio elegido se implementa, se verifica en navegador (escritorio, tablet y móvil, sin desborde horizontal ni errores de consola/red) y se aprueba, actualizá `DESIGN.md` como regla vigente.

### Alcance de las utilidades de `design.md` (`lint`, `diff`, `export`)
Las herramientas de línea de comandos del ecosistema `design.md` ayudan a validar estructura del archivo, referencias de tokens, contraste documental y diferencias textuales entre versiones del documento (`diff`). **Un resultado limpio del linter o del `diff` documental no sustituye la comparación visual de las pantallas renderizadas ni la verificación interactiva del recorrido.**

---

## 3. Relación con otras skills y herramientas complementarias

`auditar-ux-producto` es **autosuficiente en su método y criterios**: no requiere tener instaladas otras skills para ejecutar una auditoría completa, preparar comparaciones antes/después ni actualizar `DESIGN.md`.

Sin embargo, cuando el entorno del usuario ya disponga de las siguientes herramientas o skills, podés aprovecharlas de forma selectiva según la etapa del trabajo:

| Proyecto / Herramienta | Rol complementario dentro del proceso | Precaución operativa |
|---|---|---|
| **Design with Intent (`ghaida/intent`)** | Sus módulos `evaluate`, `journey` y `organize` aportan profundidad adicional para descomponer recorridos entre roles y arquitectura de información. | Usarlo como insumo analítico; mantener siempre los requisitos de evidencia e identificación `C01..Cn` de esta skill. |
| **Impeccable (`pbakaus/impeccable`)** | Operaciones como `shape`, `critique`, `distill`, `clarify` y `document` (generación de `DESIGN.md` / `PRODUCT.md`), además de sus modos `live` y `generate` para explorar variantes visuales. Instalación oficial opcional: `npx impeccable install`. | En Impeccable, `audit` es principalmente técnico (a11y/perf/responsive) mientras que `critique` y `distill` son los relevantes para UX. **Importante:** aceptar una variante en `live`/`generate` puede escribir directamente en el código fuente; durante una fase de comparación usalo sobre una copia, worktree o rama de preview. |
| **UI UX Pro Max (`ui-ux-pro-max`)** | Biblioteca de consulta para patrones puntuales de formularios, tablas, accesibilidad y estados de componentes. | No reemplaza el análisis de tareas ni justifica por sí solo fusionar o eliminar funciones del negocio. |
| **Emil Design Engineering (`emil-design-eng`)** | Refinar la respuesta táctil, microinteracciones, transiciones y percepción de fluidez **después** de haber resuelto qué botones existen y dónde van. | No usar animaciones para maquillar un recorrido con pasos redundantes. |
| **Taste Skill / Frontend Design** | Dirección estética, tipografía, composición e identidad visual cuando el encargo incluya rediseñar el estilo o una superficie comercial. | En un ERP/CRM operativo, la claridad de tarea y densidad útil mandan sobre el impacto publicitario. |
| **Playwright (CLI / navegador real) + `axe-core`** | Ejecutar los recorridos reales como un usuario, capturar capturas equivalentes en múltiples viewports, medir overflow horizontal, verificar consola/red y correr chequeos determinísticos de accesibilidad con `axe-core`. | `axe-core` detecta problemas programáticos de accesibilidad pero no evalúa si el flujo de negocio tiene sentido; ambos niveles son complementarios. |

> **Regla de transparencia:** mencionar o recomendar un complemento nunca equivale a asumir que ya está instalado o ejecutado en el entorno actual. Verificá siempre qué herramientas están realmente disponibles antes de invocarlas.
