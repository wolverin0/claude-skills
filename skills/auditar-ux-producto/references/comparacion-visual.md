# Procedimiento de comparación visual antes/después y selección de propuestas

Cuando la auditoría pasa de diagnosticar problemas a proponer mejoras de interfaz o de recorrido, este protocolo asegura que las comparaciones **antes/después** sean honestas, equivalentes y accionables, permitiendo evaluar cambios **por separado y como conjunto coherente**.

---

## 1. Conservar primero un «antes» verificable en condiciones equivalentes

Antes de modificar código o maquetar el "después", registrá el estado original (capturas reales, commit/SHA o referencia reproducible).

Para que la comparación sea válida y no engañosa, el **antes** y el **después** deben mantener **condiciones equivalentes**:

- **La misma tarea y el mismo rol de usuario.**
- **Los mismos datos, filtros y selección activa** (por ejemplo, la misma sucursal/ubicación seleccionada, el mismo producto o la misma venta con descuento).
- **Los mismos tamaños de pantalla (viewports):** escritorio (`1440×900`), tablet (`768×1024`) y móvil (`390×844`), o los viewports definidos en el contrato visual del proyecto.
- **Contenido de longitud realista:** nombres largos de productos o clientes, importes reales, tablas con volumen representativo. **Está prohibido hacer que el "después" parezca más limpio simplemente porque tiene menos filas, textos cortos inventados o datos vacíos.**
- **Los estados que importan para decidir:** estado inicial, búsqueda/selección, edición, advertencia o error, confirmación/guardado y regreso al listado.

---

## 2. Qué tipo de comparación preparar según el material disponible

Adaptá el formato de la comparación a los insumos reales del proyecto y declará siempre qué parte es código real y qué parte es reconstrucción:

| Material disponible | Comparación que debe prepararse | Qué debe aclararse explícitamente |
|---|---|---|
| **Aplicación en ejecución + código fuente** | Capturar el original en navegador real y construir las propuestas reutilizando los componentes/estilos del proyecto en una copia, rama o entorno de preview. | SHA/estado base, rutas capturadas y si las variantes corren sobre datos reales o de prueba. |
| **Aplicación navegable sin código fuente** | Capturar los recorridos reales como "antes" y construir un mockup HTML/CSS fiel para el "después". | Qué estilos o comportamientos del "después" son aproximaciones externas al repositorio. |
| **Sólo capturas de pantalla** | Usar las capturas aportadas como "antes" y maquetar el "después" respetando la densidad real de datos. | Qué estados del recorrido (errores, vuelta al listado, móvil) siguen pendientes de observar en vivo. |
| **Sólo descripción verbal o escrita** | Preparar escenarios de tarea y bocetos conceptuales de las alternativas; el "antes" visual queda marcado como pendiente de obtener. | Que aún no existe evidencia visual del producto actual. |

Para decisiones de interfaz, priorizá siempre **vistas renderizadas en HTML/CSS o en los componentes reales del proyecto** y verificadas en navegador, en lugar de descripciones abstractas.

---

## 3. Recomendaciones identificadas, dependencias y conflictos

Cada cambio propuesto debe tener un **identificador estable (`C01`, `C02`, `C03`...)** y declarar su relación con los demás:

| Tipo de relación | Significado | Ejemplo concreto |
|---|---|---|
| **Independiente** | Puede aplicarse y evaluarse por sí solo sin requerir otros cambios. | `C01`: Preservar `location_id` al abrir Ajuste de Stock y en el botón Cancelar. |
| **Dependiente (`requiere Cxx`)** | Necesita que otra recomendación esté activa para funcionar con sentido. | `C04`: Conservar la fila activa resaltada al cerrar el panel lateral (`requiere C03`). |
| **Alternativa incompatible (`conflicto con Cxx`)** | Resuelve el mismo problema mediante una arquitectura o contenedor distinto. | `C02`: Llevar la edición extensa a una página dedicada vs. `C03`: Editar en un panel lateral manteniendo la lista visible. |

### Cómo manejar «Aplicar todo» cuando hay alternativas incompatibles
- **"Aplicar todo" nunca debe mezclar silenciosamente dos propuestas contradictorias** (como usar simultáneamente un panel lateral y una página dedicada para el mismo paso).
- Cuando existan alternativas incompatibles en la lista de recomendaciones, debés:
  1. Señalar explícitamente el conflicto (ej. `C02` vs `C03`).
  2. Ofrecer **conjuntos compatibles recomendados** (por ejemplo: **Conjunto recomendado A** = `C01 + C02 + C04` orientado a edición profunda en página dedicada; **Conjunto recomendado B** = `C01 + C03 + C04` orientado a procesamiento rápido en lista con panel lateral).
  3. Permitir también revisar cada cambio separable de forma individual o la combinación específica que elija la persona.

No hace falta renderizar de antemano todas las permutaciones matemáticas posibles (`2^n`): empezá por el **antes**, los **cambios individuales clave** o **conjuntos recomendados compatibles**, y generá a pedido cualquier combinación adicional seleccionada.

---

## 4. Regla de integridad entre el selector y la vista previa

Si presentás un comparador interactivo (con casillas para activar/desactivar `C01`, `C02`, `C03`...) o una tabla de selección de cambios:

> **Marcar una casilla no permite afirmar que la vista previa ya muestra esa combinación.** Si una combinación seleccionada todavía no fue renderizada o capturada, la interfaz o el informe debe indicarlo explícitamente como **`combinación pendiente de generar`** y producir la vista real correspondiente antes de presentarla como el resultado visual de esa selección.

Esto evita un engaño frecuente en prototipos generados por IA: un selector de recomendaciones que parece interactivo pero muestra siempre la misma imagen estática del "después" sin importar qué casillas estén marcadas.

---

## 5. Qué puede decidirse visualmente y qué exige probar el recorrido

Distinguí qué decisiones quedan resueltas mirando las pantallas comparadas y cuáles requieren interactuar con el flujo:

- **Lo que sí permite decidir una comparación visual estática:**
  - Si se entiende de inmediato qué hacer primero.
  - Si las acciones están ubicadas cerca de los datos necesarios para decidir.
  - Si se redujo el ruido visual o las acciones duplicadas sin esconder información crítica.
  - Si las advertencias importantes (como descuentos en una devolución o sucursal activa) quedan visibles en el lugar correcto.
  - Si la propuesta mantiene la identidad del producto en escritorio, tablet y móvil.
- **Lo que requiere un prototipo navegable o prueba del recorrido en vivo:**
  - Elegir entre **modal, panel lateral y página dedicada** cuando importa cómo se entra, qué pasa ante un error de validación, cómo se interrumpe la tarea y cómo se regresa al listado.
  - Comprobar que los filtros, la tienda/ubicación y la selección realmente se conservan al ir y volver.
  - Verificar navegación por teclado, manejo del foco y ausencia de errores de consola o red.

La preferencia visual sirve para elegir una dirección; para afirmar que un cambio **ahorra pasos, evita errores o conserva el contexto**, hay que comprobarlo ejecutando las tareas correspondientes.
