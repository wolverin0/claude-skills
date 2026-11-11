# Política de feedback, errores, notificaciones y trabajo pendiente (ERP / CRM)

En productos operativos (ERP, CRM, administración, inventario, cobranzas), la falta de una política clara hace que cada módulo invente su propia forma de avisar: algunos usan toasts fugaces para errores críticos, otros llenan una campana de avisos que nadie acciona y otros anuncian "Éxito" antes de que el proceso real haya terminado.

---

## 1. Separar cuatro cosas que suelen mezclarse

Antes de elegir un componente visual, clasificá la información en una de estas cuatro categorías:

| Categoría | Qué es | Ejemplo en ERP / CRM | Dónde vive |
|---|---|---|---|
| **1. Actividad** | Registro histórico de algo que ocurrió y puede consultarse cuando haga falta. | *"Juan ajustó el stock de Cruz Alta (+5 u.) a las 14:20"*. | Historial del objeto, bitácora o auditoría. No debe interrumpir a otros usuarios. |
| **2. Feedback** | Respuesta inmediata del sistema a la acción que la persona acaba de ejecutar. | *"Ajuste guardado"*, *"El motivo es obligatorio"*, *"Descuento del 10% aplicado"*. | En el mismo lugar donde actúa el usuario (junto al campo, en el contenedor activo o en un estado local/toast según impacto). |
| **3. Notificación** | Aviso oportuno dirigido a un rol porque ocurrió un evento que le importa conocer. | *"Terminó la exportación de catálogo solicitada"*, *"Se recibió una nota de crédito del proveedor"*. | Centro de notificaciones / avisos recuperables con enlace directo al recurso. |
| **4. Trabajo pendiente (Situación / Excepción)** | Algo requiere que un rol tome una decisión o resuelva un problema concreto, con responsable y seguimiento. | *"Pago recibido sin conciliar"*, *"Diferencia de stock en reconciliación diaria"*, *"Devolución pendiente de autorización"*. | Bandeja de pendientes / cola operativa con contexto, acciones directas y estado de resolución (inspirado en **SAP Fiori Situation Handling**). |

---

## 2. Regla de oro sobre operaciones asíncronas o en segundo plano

**Nunca anuncies éxito definitivo si la operación todavía puede fallar.**

- Si un pago, sincronización, importación o emisión se encola o procesa en segundo plano:
  - El feedback inmediato debe decir la verdad: **"Pago enviado a procesamiento"** o **"Sincronización en curso"**, mostrando ese estado en el registro.
  - Si luego falla, el sistema debe actualizar el estado del objeto y crear un **trabajo pendiente recuperable** para el rol responsable, explicando qué falló y cómo reintentar o corregir.
- Mostrar un toast verde de *"Pago registrado con éxito"* antes de que falle la pasarela o conciliación es un **hallazgo de gravedad alta**.

---

## 3. Matriz para elegir el nivel de interrupción y el componente

Elegí el tratamiento proporcional a la consecuencia y a la necesidad de acción (alineado con IBM Carbon Notifications y GOV.UK Design System):

| Situación | Tratamiento recomendado | Qué evitar |
|---|---|---|
| **El cambio ya es evidente en la propia interfaz** (ej. se marca un ítem o cambia un filtro con actualización inmediata). | Actualizar el dato o estado en el lugar; agregar texto adicional sólo si aporta claridad. | Disparar un toast o modal por cada clic menor. |
| **Confirmación breve de bajo impacto** que no requiere acción posterior (ej. *"Enlace copiado"*, *"Preferencia guardada"*). | Toast discreto que no tape botones de acción ni navegación. | Usar un diálogo modal que obligue a hacer clic en *"Aceptar"*. |
| **Error corregible en un campo de formulario.** | Mensaje claro junto al campo afectado y, en formularios extensos, **resumen de errores al inicio** con enlaces directos a cada campo (patrón GOV.UK Error Summary). | Borrar los datos ya escritos por el usuario o mostrar sólo *"Datos inválidos"* en un toast que desaparece. |
| **Advertencia o condición de negocio que afecta la decisión actual** (ej. devolución sobre una venta que tuvo descuento o recargo). | Alerta persistente en contexto (`.alert-warning` / banner inline junto a los artículos o totales) explicando el cálculo real. | Ocultar la condición en un tooltip o avisar recién después de enviado el formulario. |
| **Problema que impide completar la tarea actual** (ej. fallo al guardar, conflicto de versión, stock insuficiente). | Mensaje persistente dentro del formulario o vista activa, conservando todo lo que el usuario cargó y explicando cómo recuperarse. | Mostrar un toast temporal de 3 segundos como único aviso del fallo. |
| **Condición general del sistema o ventana operativa** (ej. modo sólo lectura en ventana de reconciliación o servicio degradado). | Banner superior persistente con el alcance exacto y qué tareas siguen disponibles. | Permitir que el usuario complete un formulario largo para recién rechazarlo al final. |
| **Evento asincrónico relevante para el solicitante** (ej. reporte o importación finalizada). | Aviso recuperable con enlace directo al resultado descargable o al detalle de errores. | Perder el enlace si el usuario no alcanzó a tocar el toast en el momento. |
| **Excepción operativa que alguien debe resolver.** | Ítem en bandeja de **Trabajo pendiente** con responsable, antigüedad, datos de contexto y acción de resolución. | Mandar un aviso genérico sin enlace al objeto ni distinción de si ya fue resuelto por otro compañero. |

---

## 4. Estados obligatorios: `leído` ≠ `descartado` ≠ `resuelto`

En cualquier bandeja de notificaciones o excepciones de un ERP/CRM, exigí separar estos tres estados:

1. **Leído / Visto:** la persona abrió o vio el aviso. **Abrir o marcar como leído jamás debe dar por aprobada una excepción ni por resuelto un problema.**
2. **Descartado / Silenciado (cuando sea informativo):** el usuario decide ocultar un aviso informativo que no requiere acción.
3. **Resuelto / Cerrado:** la causa de negocio se solucionó (por ejemplo, el pago fue conciliado, el stock fue ajustado o la solicitud fue aprobada/rechazada), quedando registrado quién y cuándo lo resolvió, o cerrándose automáticamente cuando la condición desaparece.

### Agrupación ante fallos masivos
Si una sincronización o integración falla sobre 80 registros, **no generes 80 notificaciones individuales**. Creá **un único incidente agrupado** (*"Fallo de sincronización en 80 artículos de Cruz Alta"*) que lleve a una vista filtrada con los registros afectados y las acciones de reintento o revisión.

---

## 5. Ficha obligatoria para aprobar una nueva notificación

Antes de agregar una notificación nueva al producto, el diseño debe responder estos 9 puntos:

1. **Evento disparador exacto:** ¿qué condición precisa la genera?
2. **Destinatario y motivo:** ¿qué rol específico necesita enterarse y para qué?
3. **Acción disponible:** ¿qué puede hacer esa persona desde el aviso (enlace directo, acción rápida)?
4. **Consecuencia de ignorarla:** ¿qué pasa en el negocio si nadie actúa?
5. **Ventana de tiempo / urgencia:** ¿es inmediata, del turno, diaria o periódica?
6. **Canal, ubicación y persistencia:** ¿va en contexto, en bandeja recuperable, en cola de trabajo pendiente?
7. **Regla de agrupación y deduplicación:** ¿cómo se agrupa si ocurre 50 veces seguidas?
8. **Condición de resolución o caducidad:** ¿cuándo deja de estar vigente automáticamente?
9. **Control del usuario:** ¿qué umbrales o avisos informativos puede configurar sin apagar alertas críticas de seguridad o cumplimiento?

---

## 6. Accesibilidad de mensajes de estado (WCAG 2.2 SC 4.1.3)

Todo mensaje de estado que informe resultados de búsqueda (ej. *"3 ventas encontradas"* o *"No se encontraron ventas para ese criterio"*), progreso, confirmación de guardado o errores dinámicos sin cambio de página debe poder ser anunciado por tecnologías de asistencia sin mover forzosamente el foco cuando no corresponde (`role="status"`, `role="alert"` o `aria-live` apropiado), salvo cuando un resumen de errores o diálogo modal deba recibir el foco explícitamente para guiar la corrección.
