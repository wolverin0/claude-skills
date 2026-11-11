# Método de auditoría UX centrada en tareas

Este documento detalla el marco metodológico de `auditar-ux-producto` para evaluar aplicaciones existentes sin reducir la UX a una cuestión puramente cosmética.

---

## 1. Combinación de métodos y qué pregunta responde cada uno

| Método | Pregunta central que responde | Cuándo pesa más |
|---|---|---|
| **Análisis de tareas (Task Analysis)** | ¿Qué intenta conseguir la persona, qué información necesita y qué trabajo realiza dentro y fuera del sistema? | Al inicio del assessment y antes de proponer fusiones o cambios de flujo. |
| **Recorrido cognitivo (Cognitive Walkthrough)** | ¿La persona entiende qué hacer, encuentra el control, comprende su etiqueta y reconoce el resultado? | Al evaluar descubribilidad, claridad de llamadas a la acción y pasos confusos. |
| **Evaluación heurística** | ¿Se respetan visibilidad del estado, consistencia, control del usuario, prevención y recuperación de errores? | Al revisar formularios, estados asíncronos, confirmaciones y mensajes de error. |
| **Arquitectura de información** | ¿Los objetos, vistas, menús y etiquetas reflejan el modelo mental del trabajo y permiten encontrar cada función? | Cuando hay navegación dispersa, nombres ambiguos o módulos duplicados. |
| **Marco CASTLE (NN/g)** | ¿Qué carga mental, eficiencia cotidiana, uso de funciones avanzadas, aprendizaje y tasa/recuperación de errores tiene la herramienta de trabajo? | En paneles operativos, ERP, CRM, backoffice y flujos de alta repetición. |
| **Pruebas con usuarios reales** | ¿Las personas representativas completan el objetivo sin ayuda y comprenden qué ocurrió? | Para validar hipótesis de la inspección cuando el cambio tiene impacto alto. |

El análisis de tareas define qué trabajo importa; el recorrido cognitivo y las heurísticas examinan cómo responde la interfaz; las pruebas con personas reales contrastan las hipótesis.

---

## 2. Reconstrucción del trabajo real (Etapa A)

Evitá describir el producto por sus pantallas actuales (*"el módulo de clientes tiene tres pestañas"*). Reconstruí:

1. **Roles activos e interdependencias:**
   - Quién inicia la tarea (ej. vendedor, cajero, operador de depósito).
   - Quién recibe el resultado o debe aprobar/conciliar (ej. administración, supervisor).
2. **Objetivos de dominio:**
   - Expresá la tarea como un resultado verificable de negocio:
     - *Incorrecto:* "Abrir el modal de ajuste y cambiar el número."
     - *Correcto:* "Corregir una diferencia de stock detectada en el depósito de una sucursal específica, dejando trazabilidad del motivo y volviendo al listado de esa misma sucursal."
3. **Objetos, estados y transiciones:**
   - Identificá los objetos principales y sus estados reales (borrador, pendiente de aprobación, emitido, pagado parcial, conciliado, anulado, fallido).
4. **Trabajo invisible o externo:**
   - Detectá si el usuario necesita abrir otra pestaña para buscar un código, anotar un monto en papel o pasar por WhatsApp/planilla un dato que el sistema debería conservar en contexto.

---

## 3. Registro verificable del recorrido actual (Etapa B)

Para cada tarea crítica, registrá:

- **Entrada:** desde dónde empieza cada rol y qué contexto trae consigo (filtros activos, sucursal seleccionada, cliente o documento actual).
- **Insumos de decisión:** qué datos necesita ver antes de hacer clic (saldo, stock en esa ubicación, historial, restricciones, descuentos aplicados).
- **Cambios de contexto:** cuántas veces cambia de página, abre/cierra modales o pierde de vista la referencia que estaba consultando.
- **Reingreso de datos:** qué campos pide completar manualmente cuando el sistema ya los conoce por el punto de entrada.
- **Señal de cierre y continuidad:** cómo confirma que la operación terminó y dónde queda parado para el siguiente caso.
- **Matriz de estados no felices:**
  - Sin resultados / estado vacío.
  - Cargando / procesando en segundo plano.
  - Error de validación en campos.
  - Error de servidor, red o conflicto de concurrencia.
  - Permisos insuficientes o necesidad de autorización de otro rol.
  - Interrupción a mitad de carga (cambios sin guardar / borrador).
  - Resultado parcial (ej. se procesaron 12 ítems y fallaron 3).

---

## 4. Doble pasada: Comprensión vs. Operación cotidiana (Etapa C)

### Pasada 1: Comprensión y aprendizaje (Recorrido cognitivo)
En cada paso de la tarea, respondé con evidencia:
1. **Intención:** ¿La persona usuaria sabría qué intenta lograr en este paso?
2. **Descubribilidad:** ¿Está visible o claramente accesible la acción que necesita?
3. **Asociación semántica:** ¿El texto del botón, ícono o enlace permite anticipar qué va a pasar al activarlo?
4. **Reconocimiento de progreso:** ¿Después de la acción recibe una respuesta clara y verdadera sobre el nuevo estado?

> **Regla para agentes de IA:** hacé esta primera pasada guiándote por los textos visibles, la jerarquía visual y el árbol de accesibilidad. Si sólo descubrís qué hace un botón porque leíste `onClick={handlePartialReconcile}` en el código, registrá un problema de descubribilidad o etiquetado en la interfaz.

### Pasada 2: Operación intensiva (CASTLE y aplicaciones complejas)
En sistemas de uso diario (ERP, CRM, POS, atención de casos), alguien que ya aprendió dónde está el botón igual sufre si el flujo es torpe. Evaluá:
- **Continuidad de lote:** ¿Puede resolver 20 casos seguidos sin volver a elegir tienda, ubicación, fecha o filtro cada vez?
- **Memoria de trabajo (carga cognitiva):** ¿La pantalla de acción muestra los datos necesarios o fuerza a recordar importes, códigos o condiciones vistas en el paso anterior?
- **Tolerancia a interrupciones:** si entra una llamada o falta un dato, ¿puede guardar borrador o salir a consultar sin perder todo?
- **Manejo de excepciones en contexto:** cuando algo sale del camino estándar (descuento, pago parcial, cambio de sucursal), ¿hay una salida clara sin reiniciar la operación desde cero?
- **Aceleradores:** ¿Hay búsqueda directa, teclado, valores por defecto coherentes con la sesión y acciones rápidas para lo frecuente?

---

## 5. Detección de redundancias con significado de negocio (Etapa D)

Cuando una aplicación creció con ayuda de IA o por agregados sucesivos, suelen aparecer acciones parecidas en varios lugares. Antes de proponer fusionarlas o borrarlas, comparalas con esta estructura:

```text
Objeto + Operación + Alcance + Estado inicial/final + Permisos + Consecuencias
```

### Cuándo conservar múltiples puntos de entrada
Dos botones con el mismo nombre pueden ser **accesos contextuales legítimos** a una misma operación:
- *"Registrar pago"* desde el detalle de una factura (precarga cliente y factura).
- *"Registrar pago"* desde la cuenta corriente del cliente o desde Caja (permite elegir a qué comprobantes imputar).

**Qué hacer:** conservar ambos puntos de entrada si responden a momentos reales del trabajo, asegurando que compartan las mismas reglas de negocio, validaciones y componentes subyacentes, y que el acceso desde un objeto específico **precargue** ese contexto en lugar de volver a pedirlo.

### Cuándo consolidar duplicaciones reales
Hay duplicación dañina cuando:
- Existen dos pantallas o modales distintos para hacer la misma operación con campos, nombres o validaciones diferentes.
- Una misma vista ofrece dos botones que compiten sin explicar su diferencia (ej. *"Guardar"*, *"Actualizar"* y *"Aplicar cambios"* en el mismo formulario).
- Un flujo pide en dos pasos seguidos decidir exactamente lo mismo sin nueva información en el medio.

### Cuándo NO fusionar ni eliminar
- **Verbos con consecuencias distintas:** *Anular*, *Eliminar*, *Archivar*, *Devolver* y *Revertir* suelen tener efectos contables, de stock o de auditoría muy diferentes. Nunca los unifiques sin verificar el modelo de dominio.
- **Controles de segregación de funciones:** si un paso existe porque otra persona o rol debe autorizar o revisar, no lo elimines bajo el argumento de "ahorrar clics".
- **Operaciones infrecuentes pero críticas:** cierres mensuales/anuales, conciliaciones, ajustes por inventario o exportaciones legales no deben proponerse para eliminación sin evidencia de uso real y requisitos del negocio.

---

## 6. Orden de intervención mínima y criterio de priorización (Etapa E)

Al formular mejoras, seguí este orden de preferencia:

1. **Eliminar trabajo repetido o innecesario** (no volver a pedir datos que el contexto ya tiene).
2. **Conservar el contexto del usuario** (filtros, ubicación/sucursal, selección, scroll).
3. **Unificar reglas y etiquetas inconsistentes** para que la misma operación se llame y comporte igual.
4. **Ubicar la acción junto a la información necesaria para decidir.**
5. **Revelar opciones secundarias progresivamente** en lugar de mostrar todos los casos borde al mismo nivel que la tarea principal.
6. **Agregar componentes o vistas nuevas únicamente cuando el trabajo no pueda resolverse limpiamente con lo existente.**

### Cómo calificar los hallazgos (sin puntajes ficticios)
Calificá cada hallazgo en tres ejes independientes:
- **Gravedad del impacto:**
  - *Alta:* induce a error de negocio/dinero/stock, muestra estados falsos, provoca pérdida de datos o bloquea la tarea.
  - *Media:* agrega pasos repetitivos, rompe la continuidad del lote, pierde filtros/contexto o exige memorizar información entre pantallas.
  - *Baja:* fricción menor de lectura, alineación o etiquetas mejorables sin riesgo de error operativo.
- **Frecuencia estimada:** tarea continua de cada turno, tarea diaria, o caso excepcional/periódico.
- **Confianza de la evidencia:** `Comprobado` (reproducido/observado en UI o código), `Inferido` (deducido de reglas/estructura) o `Pendiente` (requiere datos de producción o prueba con usuarios).
