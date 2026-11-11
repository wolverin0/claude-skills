# Prompts para correr cada modo de battle-test y sus skills hermanas

> **Nota: ningún modo se corrió todavía de punta a punta.** Estos prompts están derivados del texto publicado de las skills, no de una corrida real. Cada flag, combinación y veredicto cita `archivo:línea`; donde el texto calla dice "no definido". Ver "No probado" al final.

Un archivo por caso de uso. Cada uno trae un bloque listo para copiar y pegar en el agente de tu proyecto, para correr un modo sin recordar flags y sin que el agente se pase de alcance.

## Cómo usarlos

1. Pegá el bloque en el agente que trabaja en tu proyecto, con el directorio de trabajo en el proyecto.
2. Reemplazá los placeholders: `<ruta del proyecto>`, `<URL local o de staging>`, `<pantallas o flujo>` (y los pocos propios de un caso, como `<subcarpeta del proyecto>` o `<ruta del worktree>`).
3. Usá una versión instalada actual de las skills: el primer paso de cada bloque le hace confirmar que existe el flag. Si tu agente tiene una versión vieja, tiene que parar y avisarte.

Todos los bloques siguen el mismo orden, con las mismas seis etiquetas: 1. Chequeo previo, 2. Objetivo y alcance, 3. Comando, 4. Límites, 5. Lado conservador, 6. Cierre. Todos fijan el lado conservador: nunca contra producción, no integrar a main (salvo el caso 02), no desplegar, y parar si falta una herramienta para preguntar.

## Los casos

| Caso | Archivo | Comando | Qué hace | Qué NO hace | ¿Integra a main? |
| --- | --- | --- | --- | --- | --- |
| 1. Todo | [01-todo.md](01-todo.md) | `/battle-test` | Ciclo completo: diagnóstico, validación en navegador, arreglos y re-verificación | No integra a main, no despliega | No |
| 2. Todo e integrar | [02-todo-e-integrar.md](02-todo-e-integrar.md) | `/battle-test --push-main` | Lo del caso 1 y, con todos los gates en verde, integra el rango probado | No despliega (donde hay auto-deploy, integrar equivale a desplegar) | Sí, solo con gates verdes |
| 3. Solo UX/UI | [03-solo-ux-ui.md](03-solo-ux-ui.md) | `/battle-test --ux` | Cura solo UX/UI con una pausa para que elijas qué cambios entran | No toca seguridad, base de datos, dependencias, rendimiento ni código muerto; no integra | No |
| 4. Solo auditar | [04-solo-auditar.md](04-solo-auditar.md) | `/battle-test --audit-only` | Preflight y auditoría, y se detiene | No arregla nada | No |
| 5. Rápido | [05-rapido.md](05-rapido.md) | `/battle-test --quick` | `vibe-to-prod` más smoke de validación sobre rutas clave | Nunca dice "battle-tested"; nunca hace push ni despliega | No |
| 6. Retomar | [06-retomar.md](06-retomar.md) | `/battle-test --resume`, `/battle-test --ux --resume` | Continúa una corrida pausada desde su checkpoint | No reinicia ni cambia de modo; no integra | No |
| 7. Auditar y remediar con PR | [07-auditar-y-remediar-con-pr.md](07-auditar-y-remediar-con-pr.md) | `/audit-remediate`; `/audit` | Audita, arregla en una rama, re-audita y abre un PR; o solo audita | No mergea, no toca main; `/audit` no modifica código | No (abre un PR, no mergea) |
| 8. Solo validar la app | [08-solo-validar-la-app.md](08-solo-validar-la-app.md) | `/validation` y sus modos | Validación en navegador real, sin auditar el código | No arregla; estándar y completo crean y borran datos `VAL_` | No |
| 9. Auditoría UX sin arreglos | [09-auditoria-ux-sin-arreglos.md](09-auditoria-ux-sin-arreglos.md) | skill `auditar-ux-producto` | Auditoría de usabilidad y tabla de cambios `C01..Cn` | No arregla, no exporta, no escribe `DESIGN.md`, sin puntaje | No |
| 10. Solo capturas | [10-solo-capturas.md](10-solo-capturas.md) | `$visual-route-sweep <URL>` | Capturas de cada ruta segura en claro y oscuro, tres anchos, con revisión | Sin `--fix` no remedia; no cubre seguridad ni CRUD | No |
| 11. Solo arreglar desde una lista | [11-solo-arreglar-desde-lista.md](11-solo-arreglar-desde-lista.md) | `/quality-loop --staged --from-tracks` | Arregla los ítems AUTO de `TRACKS.md` en una rama loop | No empuja, no audita, no despliega | No |

## Combinaciones válidas y rechazadas

Solo las filas con `archivo:línea` están respaldadas por el texto. Las de la segunda tabla son "no definido": el texto no dice si se combinan, y estos prompts no las usan.

| Combinación | Estado | Respaldo |
| --- | --- | --- |
| `--resume` | válida | `skills/battle-test/SKILL.md:16` |
| `--audit-only` | válida | `skills/battle-test/SKILL.md:17` |
| `--quick` | válida | `skills/battle-test/SKILL.md:18` |
| `--push-main` | válida | `skills/battle-test/SKILL.md:19` |
| `--ux` | válida | `skills/battle-test/SKILL.md:20` |
| `--ux + --resume` | válida: `--ux` se combina solo con `--resume` | `skills/battle-test/SKILL.md:20` |
| `--ux + --push-main` | rechazada | `skills/battle-test/SKILL.md:37-40` |
| `--ux + --quick` | rechazada | `skills/battle-test/SKILL.md:37-40` |
| `--ux + --audit-only` | rechazada | `skills/battle-test/references/stages.md:145-148` |
| `--staged + --from-tracks` | válida: así la invoca battle-test | `skills/battle-test/references/stages.md:107` |
| `--no-push + --staged` | válida: `--no-push` es alias de `--staged` | `skills/quality-loop/SKILL.md:18` |
| `--full + --fresh` | válida (de `/validation`) | `skills/battle-test/references/stages.md:52` |
| `--mode smoke + --fresh` | válida (de `/validation`) | `skills/battle-test/references/stages.md:44` |
| `--scope + --max-rounds` | válida (de `/audit-remediate`) | `commands/audit-remediate.md:19` |

Las que el texto no define (no están respaldadas; cada una se documenta como "no definido"):

| Combinación | Qué dice el texto |
| --- | --- |
| `--resume` con `--audit-only`, `--quick` o `--push-main` | Nada. Solo `--ux --resume` está definido. El caso 06 no integra y se detiene si el estado dice que la corrida original usaba `--push-main`. |
| `--quick` con `--push-main` | Nada sobre cómo se combinan. Sobre `--quick` solo dice que nunca hace push ni despliega (`skills/battle-test/references/stages.md:48`). |
| `--audit-only` con `--push-main` o `--quick` | Nada. |
| Cualquier flag de battle-test con una ruta de proyecto | El texto muestra la ruta sola (`skills/battle-test/SKILL.md:15`) y los flags solos; no la combinación. Los prompts usan el directorio actual. |
| `--fix` con `--resume` (`visual-route-sweep`) | Nada. |
| `--fresh` con `--resume`, `--full` con `--mode`, `--interactive` con otros flags (`/validation`) | Nada. `--full` es alias de `--mode exhaustive`. |
| `--priority-domains` o `--resume-from` con `/audit-remediate` | Sus argumentos publicados son solo `--scope` y `--max-rounds`. |
| `--scope`, `--priority-domains` y `--resume-from` entre sí (`/audit`) | Están listados como argumentos soportados, sin reglas de combinación. |
| `--from-tracks` sin `TRACKS.md` (quality-loop) | Nada. Con `TRACKS.md` presente, `--from-tracks` hace obligatorio no re-auditar. |
| `quality-loop` sin `--staged` | Definido: el comportamiento por defecto empuja los lotes verdes a main. Por eso ningún prompt de esta carpeta lo usa. |

## Flags, veredictos y señales: dónde está cada uno

Cada fila se verificó contra el texto: la línea citada contiene el token.

| Token | Archivo:línea | Qué es |
| --- | --- | --- |
| `--resume` | `skills/battle-test/SKILL.md:16` | battle-test: continuar una corrida pausada |
| `--audit-only` | `skills/battle-test/SKILL.md:17` | battle-test: parar después del diagnóstico |
| `--quick` | `skills/battle-test/SKILL.md:18` | battle-test: revisión rápida |
| `--push-main` | `skills/battle-test/SKILL.md:19` | battle-test: autoriza integrar a main |
| `--ux` | `skills/battle-test/SKILL.md:20` | battle-test: solo UX/UI |
| `--staged` | `skills/quality-loop/SKILL.md:15` | quality-loop: commitea a la rama loop y no empuja |
| `--from-tracks` | `skills/quality-loop/SKILL.md:16` | quality-loop: no audita, usa `TRACKS.md` |
| `--no-push` | `skills/quality-loop/SKILL.md:18` | quality-loop: alias de `--staged` |
| `--mode` | `skills/validation/SKILL.md:20` | validation: elige el modo |
| `--full` | `skills/validation/SKILL.md:22` | validation: alias de `--mode exhaustive` |
| `--interactive` | `skills/validation/SKILL.md:23` | validation: pregunta backend, modo y autenticación |
| `--fresh` | `skills/validation/SKILL.md:24` | validation: empezar de cero |
| `--resume` | `skills/validation/SKILL.md:25` | validation: continuar una corrida incompleta |
| `--max-routes` | `skills/validation/SKILL.md:59` | validation: tope de rutas; recortar deja la corrida incompleta |
| `--fix` | `skills/visual-route-sweep/SKILL.md:14` | visual-route-sweep: con remediación (los prompts no lo usan) |
| `--scope` | `commands/audit.md:34` | `/audit`: alcance |
| `--priority-domains` | `commands/audit.md:35` | `/audit`: dominios a auditar |
| `--resume-from` | `commands/audit.md:36` | `/audit`: retomar una auditoría truncada |
| `--max-rounds` | `commands/audit-remediate.md:19` | `/audit-remediate`: rondas máximas (por defecto 4) |
| `BATTLE-TESTED` | `skills/battle-test/references/report.md:11` | Veredicto del ciclo completo |
| `READY WITH GATED ITEMS` | `skills/battle-test/references/report.md:13` | Veredicto del ciclo completo |
| `NOT READY` | `skills/battle-test/references/report.md:15` | Veredicto del ciclo completo |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Veredicto del ciclo completo |
| `QUICK CHECK PASSED` | `skills/battle-test/references/report.md:18` | Veredicto de `--quick` |
| `QUICK CHECK FAILED` | `skills/battle-test/references/report.md:18` | Veredicto de `--quick` |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/report.md:19` | Veredicto de `--ux` |
| `UX SCOPE FAILED` | `skills/battle-test/references/report.md:19` | Veredicto de `--ux` |
| `SMOKE VERIFIED` | `skills/validation/SKILL.md:50` | Veredicto del modo smoke de validation |
| `VISUAL ROUTE SWEEP GREEN` | `skills/visual-route-sweep/SKILL.md:46` | Veredicto de visual-route-sweep |
| `🛑 DO NOT LAUNCH UNTIL HARD STOPS RESOLVED` | `skills/audit/references/audit-triage-rubric.md:52` | Veredicto de la auditoría (1 de 5) |
| `🟢 ACCEPTABLE — routine cleanup; no launch-blockers` | `skills/audit/references/audit-triage-rubric.md:56` | Veredicto de la auditoría (5 de 5) |
| `AUDIT COMPLETE: all 7 rules attested, all 13 domains covered` | `skills/audit/audit-orchestrator/SKILL.md:243` | Señal de fin de la auditoría |
| `AUDIT TRUNCATED: <reason>` | `skills/audit/audit-orchestrator/SKILL.md:244` | Señal de corte de la auditoría |
| `QUALITY-LOOP COMPLETE` | `skills/quality-loop/SKILL.md:115` | Señal de fin de quality-loop |
| `=== VALIDATION COMPLETE ===` | `skills/validation/SKILL.md:198` | Cierre de validation |
| `rounds-exhausted` | `commands/audit-remediate.md:36` | Estados de `/audit-remediate`: green, partial, rounds-exhausted, budget-exhausted |

Los otros cuatro veredictos de la auditoría están en `04-solo-auditar.md`, también con su línea.

## No definido: lo que el texto de las skills no dice

Se repite acá lo que cada caso dice en su sección propia.

- Casos 01 a 06: cómo se combina una ruta con un flag; qué reporte escribe `--audit-only`; qué veredicto de battle-test le toca; cómo pasa la respuesta de la pausa a `--ux --resume`; si `--quick` crea el worktree; si el estado guarda `--push-main`.
- Caso 07: contra qué rama abre el PR `/audit-remediate`; cómo se retoma; el workflow `audit-remediate` no viene en este repo.
- Caso 08: no hay un veredicto positivo para los modos estándar y completo; si smoke escribe datos.
- Caso 09: no hay comando con barra, flags ni veredicto; el texto no fija dónde se guarda el entregable.
- Caso 10: no hay un veredicto de falla; no se puede limitar el barrido a unas rutas sin dejarlo incompleto.
- Caso 11: `--from-tracks` sin `TRACKS.md`.

## No probado

- Ningún modo se corrió de punta a punta. Tampoco se pegó ninguno de estos prompts en un agente.
- Las citas se verificaron con un script que comprueba que cada línea citada contiene el flag o el veredicto. Eso prueba que no se inventó ninguno; no prueba que la skill se comporte como describe su texto.
- Se asumió que una versión instalada actual tiene los flags. No se verificó qué versión tiene cada agente.
- No se verificó que existan en tu instalación el workflow `audit-remediate`, los agentes `audit-runner` y `audit-domain-runner`, ni el archivo de referencia que cita `vibe-to-prod`; el repo no los incluye.
- La forma `$visual-route-sweep` es la publicada; no se probó en un agente que no use `$`.
- Los prompts nunca se pusieron a prueba contra un proyecto con auto-deploy, ni contra uno sin `validation.config.json`.
- No se leyó cómo reacciona un agente a las instrucciones de "parar y decímelo": es la intención del prompt, no un comportamiento observado.
