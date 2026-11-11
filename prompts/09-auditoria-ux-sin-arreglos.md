# 09 - Auditoría UX sin arreglos (`auditar-ux-producto`)

Comando: no hay comando con barra; se invoca la skill por su nombre: "Usá la skill auditar-ux-producto".

## Cuándo usarlo

Querés el diagnóstico de usabilidad y la tabla de cambios elegibles `C01..Cn`, sin que se toque nada.
Existe porque `/battle-test --ux` rechaza `--audit-only`: no hay forma de pedir "solo auditar la UX" desde battle-test.

## Qué hace

La skill es en español y tiene 8 etapas más una exportación opcional:
- Etapa 1: arma el mapa de roles, objetivos de trabajo, objetos del negocio, permisos y trabajo fuera de la app.
- Etapa 2: registra el recorrido actual de cada tarea prioritaria, con los caminos de excepción.
- Etapa 3: dos pasadas, comprensión (recorrido cognitivo) y operación cotidiana (marco CASTLE).
- Etapa 4: evalúa acciones redundantes por su sentido de negocio antes de proponer fusionar o quitar.
- Etapa 5: decide la ubicación de las acciones, el contenedor (en el lugar, panel lateral, modal, página, pasos) y cuándo unir o separar pasos.
- Etapa 6: audita feedback, errores, notificaciones y trabajo pendiente.
- Etapa 7: prepara la comparación antes y después con recomendaciones seleccionables `C01..Cn` y conjuntos compatibles.
- Etapa 8: revisa `DESIGN.md` y separa reglas vigentes de propuestas.

## Qué no hace

- No arregla ni cambia código, ni la interfaz.
- No hace la etapa 9 (exportar a `TRACKS.md` y `ux-findings.json`): solo se hace si un orquestador o el usuario la pide.
- No actualiza `DESIGN.md`: eso se hace después de implementar y verificar el cambio; hasta entonces lo elegido queda como "propuesta pendiente de implementación".
- No da un puntaje único ("UX Score") ni un veredicto.
- No reemplaza la validación con personas reales: una recorrida de un agente es una hipótesis.

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de auditar-ux-producto y confirmá que describe un proceso de 8 etapas más una exportación opcional (etapa 9) y la tabla C01..Cn. Si no es así, pará y decímelo.
2. Objetivo y alcance: Usá la skill auditar-ux-producto para auditar la UX de <ruta del proyecto>, centrada en <pantallas o flujo>. Navegá la app en <URL local o de staging> con los roles que correspondan, sin ejecutar acciones que cambien datos; credenciales por variables de entorno que ya tengo cargadas. Hacé las etapas 1 a 8 y presentá la tabla C01..Cn con los conjuntos compatibles. En la etapa 8 solo leé DESIGN.md y escribí la propuesta en tu respuesta.
3. Comando: Usá la skill auditar-ux-producto
4. Límites: Prohibido: modificar código, estilos, textos o la interfaz, editar o crear DESIGN.md, TRACKS.md o ux-findings.json, hacer la etapa 9, hacer commits, tocar seguridad, base de datos, dependencias o rendimiento. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL o la base de datos son de producción, pará y avisame. No integres a main. No hagas commits ni push. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará. El texto de la skill no fija dónde se guarda el entregable: dejalo en tu respuesta y no crees archivos en el proyecto.
6. Cierre: Entregá el mapa de tareas, roles y recorrido actual con las excepciones, la evaluación de acciones duplicadas, los hallazgos priorizados (tarea o rol, evidencia, consecuencia, gravedad, frecuencia y confianza por separado, cambio propuesto, qué conservar, riesgo y criterio de aceptación), la tabla C01..Cn con conjuntos compatibles y la propuesta de DESIGN.md con lo vigente separado de lo propuesto. Distinguí lo comprobado, lo inferido y lo pendiente de validar. Sin puntaje único ni veredicto: la skill no define ninguno. Incluí lo que concluyas que hay que conservar.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `Refuse` | `skills/battle-test/references/stages.md:148` | `--ux` rechaza `--audit-only` (por eso existe este caso) |
| `Use the auditar-ux-producto skill` | `skills/battle-test/references/stages.md:171` | Forma de invocación de la skill (no hay comando con barra) |
| `8 etapas` | `skills/auditar-ux-producto/SKILL.md:29` | 8 etapas más una exportación opcional |
| `Exigir evidencia` | `skills/auditar-ux-producto/SKILL.md:20` | Comprobado, inferido y pendiente de validar |
| `Prohibido inventar un puntaje único` | `skills/auditar-ux-producto/SKILL.md:21` | Sin puntaje |
| `Separar gravedad, frecuencia y confianza` | `skills/auditar-ux-producto/SKILL.md:22` | Tres ejes separados |
| `navegable o en capturas` | `skills/auditar-ux-producto/SKILL.md:23` | Se audita una interfaz navegable o capturas |
| `conservar esto` | `skills/auditar-ux-producto/SKILL.md:24` | Puede concluir que hay que conservar |
| `simulación por IA` | `skills/auditar-ux-producto/SKILL.md:25` | Una recorrida de un agente no valida con humanos |
| `Pasada de comprensión` | `skills/auditar-ux-producto/SKILL.md:52` | Etapa 3 |
| `CASTLE` | `skills/auditar-ux-producto/SKILL.md:57` | Etapa 3 |
| `Objeto + operación + alcance + estado + permisos + consecuencias` | `skills/auditar-ux-producto/SKILL.md:68` | Etapa 4 |
| `Elección del contenedor` | `skills/auditar-ux-producto/SKILL.md:79` | Etapa 5 |
| `Veracidad del estado` | `skills/auditar-ux-producto/SKILL.md:90` | Etapa 6 |
| `C01` | `skills/auditar-ux-producto/SKILL.md:98` | IDs seleccionables y conjuntos compatibles |
| `propuestas pendientes de implementación` | `skills/auditar-ux-producto/SKILL.md:107` | Hasta implementar, lo elegido queda como propuesta |
| `una vez implementado y verificado` | `skills/auditar-ux-producto/SKILL.md:108` | `DESIGN.md` se actualiza después de implementar |
| `solo si un orquestador o el usuario lo pide` | `skills/auditar-ux-producto/SKILL.md:110` | La etapa 9 es opcional |
| `si nadie la pidió, no la hagas` | `skills/auditar-ux-producto/SKILL.md:111` | No se exporta sin pedido |
| `Hallazgos priorizados` | `skills/auditar-ux-producto/SKILL.md:127` | Campos del entregable |
| `Tabla de recomendaciones seleccionables` | `skills/auditar-ux-producto/SKILL.md:128` | Tabla `C01..Cn` con conjuntos compatibles |
| `Propuesta o actualización de` | `skills/auditar-ux-producto/SKILL.md:130` | Entregable de `DESIGN.md` con vigente versus propuesto |

## No definido en el texto

- Un comando con barra, flags o argumentos: la skill no los define; solo se la invoca por nombre.
- Un veredicto o un cierre fijo: la skill prohíbe el puntaje único y no define una etiqueta de resultado.
- Dónde se guarda el entregable: el texto lista los entregables pero no una ruta de salida.
- Si la etapa 8 escribe `DESIGN.md` durante una auditoría sin implementación: el texto dice que se actualiza una vez implementado y verificado; el prompt prohíbe escribirlo.
- Si la etapa 7 se hace siempre: el texto la condiciona a que el usuario pida comparar propuestas; el prompt la pide expresamente.
