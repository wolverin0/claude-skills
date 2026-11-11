# Plantillas operativas de auditoría, comparación y gobernanza

Usá estas plantillas para estructurar los entregables de `auditar-ux-producto` de manera clara, verificable y directamente accionable.

---

## 1. Mapa de tareas, roles y recorrido actual

```markdown
### Mapa de tareas auditadas

| ID Tarea | Rol | Objetivo real del trabajo | Punto de entrada actual | Datos necesarios para decidir | Pasos / cambios de contexto actuales | Qué pasa ante error, interrupción o regreso | Estado de evidencia |
|---|---|---|---|---|---|---|---|
| T01 | Operador de depósito | Corregir el stock de un artículo en una sucursal específica y seguir controlando esa misma sucursal. | `/inventory/stock` con filtro de ubicación. | Ubicación activa, stock actual en esa ubicación, motivo del ajuste. | 1) Filtrar ubicación → 2) Buscar producto → 3) Ir a Ajuste → 4) Volver al listado. | Evaluar si conserva `location_id` al entrar al ajuste y al tocar Cancelar/Guardar. | Comprobado / Inferido / Pendiente |
```

---

## 2. Evaluación semántica de acciones potencialmente duplicadas

```markdown
### Análisis de acciones candidatas a consolidar o conservar

| Acción / Control | Ubicación actual | Objeto + Operación | Alcance | Estado inicial → final | Permisos / Rol | Consecuencias de negocio | Veredicto (`Conservar ambos accesos` / `Consolidar en un flujo` / `Separar por efecto distinto`) |
|---|---|---|---|---|---|---|---|
| ... | ... | ... | Colección / Objeto / Selección / Formulario | ... | ... | ... | ... |
```

---

## 3. Ficha de hallazgo priorizado

```markdown
### [H01] Título concreto del problema observado

- **Tarea y rol afectados:** [Ej. T01 — Operador de sucursal / Atención de devoluciones]
- **Evidencia:** [Ruta, captura, selector, fragmento de código o secuencia exacta reproducida]
- **Consecuencia concreta:** [Qué error, retrabajo, pérdida de contexto o falsa confirmación sufre el usuario]
- **Priorización desglosada:**
  - **Gravedad:** Alta / Media / Baja — [por qué]
  - **Frecuencia:** Continua (por lote) / Diaria / Ocasional — [por qué]
  - **Confianza:** Comprobado / Inferido / Pendiente de validar
- **Cambio propuesto (`ID de recomendación`):** [Ej. `C01` — descripción exacta de la intervención mínima]
- **Qué funciona bien y debe conservarse:** [Controles, aprobaciones, validaciones o accesos contextuales que NO deben romperse]
- **Riesgo o compromiso del cambio:** [Qué costo o efecto secundario hay que cuidar]
- **Criterio de aceptación verificable:** [Pasos exactos para dar por resuelto el hallazgo en navegador y tests]
```

---

## 4. Matriz de recomendaciones seleccionables y comparación antes/después

```markdown
### Recomendaciones seleccionables (`C01..Cn`)

| ID | Recomendación | Hallazgos que resuelve | Tipo de cambio | Relación / Dependencias | Conflicto con otra propuesta | Estado de vista previa |
|---|---|---|---|---|---|---|
| C01 | ... | H01 | Continuidad / Contexto | Independiente | Ninguno | Generado / Combinación pendiente de generar |
| C02 | ... | H02 | Contenedor (Página dedicada) | Independiente | Alternativa incompatible con `C03` | Generado / Combinación pendiente de generar |
| C03 | ... | H02 | Contenedor (Panel lateral) | Independiente | Alternativa incompatible con `C02` | Generado / Combinación pendiente de generar |
| C04 | ... | H03 | Feedback / Advertencia en contexto | Compatible con `C02` y `C03` | Ninguno | Generado / Combinación pendiente de generar |

### Conjuntos compatibles para decidir (cuando «Aplicar todo» tiene alternativas excluyentes)

- **Original (Antes):** línea base capturada en condiciones equivalentes (mismo rol, datos, filtros y viewports).
- **Conjunto recomendado A (`C01 + C02 + C04`):** [Cuándo conviene elegir esta dirección y qué prioriza].
- **Conjunto recomendado B (`C01 + C03 + C04`):** [Cuándo conviene elegir esta dirección y qué prioriza].
- **Combinación personalizada del usuario:** [Indicar qué IDs fueron seleccionados y si la vista previa ya está renderizada o es una **`combinación pendiente de generar`**].
```

---

## 5. Ficha para evaluar o diseñar una notificación / trabajo pendiente

```markdown
### Ficha de notificación o excepción operativa

- **Evento disparador:** ...
- **Categoría:** Actividad (historial) / Feedback inmediato / Notificación a rol / Trabajo pendiente con dueño
- **Rol destinatario y motivo:** ...
- **Acción directa que habilita:** ...
- **Consecuencia si se ignora:** ...
- **Ventana de atención:** Inmediata / En el turno / Diaria / Periódica
- **Ubicación y persistencia:** Inline en contexto / Banner / Centro de avisos / Bandeja de trabajo pendiente
- **Regla de agrupación (ante eventos repetidos o masivos):** ...
- **Diferenciación de estados:**
  - *Leído:* ...
  - *Descartado (si aplica):* ...
  - *Resuelto (condición de cierre):* ...
- **Accesibilidad (WCAG 4.1.3 / manejo de foco):** ...
```

---

## 6. Actualización o propuesta para `DESIGN.md`

```markdown
### Registro para `DESIGN.md`

- **Estado de la regla:** `Vigente (implementada y verificada)` | `Propuesta pendiente de implementación (vinculada a Cxx)`
- **Área de interacción:** Acciones / Contenedores / Continuidad / Guardado / Errores y feedback / Notificaciones
- **Regla acordada:** [Enunciado claro y verificable]
- **Motivo operativo (por qué existe):** [Qué tarea protege y qué error evita]
- **Cuándo revisar esta decisión:** [Qué cambio en el trabajo del usuario justificaría replantearla]
```
