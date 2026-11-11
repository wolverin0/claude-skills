# 03 - Solo UX/UI

Comando: `/battle-test --ux`

## Cuándo usarlo

Querés curar solo la experiencia y la interfaz de un proyecto, con una única pausa donde elegís qué cambios entran.
Termina con su propio veredicto y con commits en la rama loop: nunca integra a main.

## Qué hace

- Preflight UX: mismo worktree, app y roles; exige `validation.config.json` con TODAS las rutas en `routes[]`; deja `ux-findings.json`, `test-manifest/`, `.battle-test/` y `TRACKS.md` fuera de git.
- Diagnóstico UX: usa `auditar-ux-producto` en lugar de `audit-orchestrator` (no corre `/audit`) y se detiene en la tabla `C01..Cn` y los conjuntos compatibles.
- La única pausa humana: vos elegís un conjunto compatible o una lista `Cnn`; lo no elegido va a GATED.
- Exportación: lo elegido pasa a `TRACKS.md` como ítems `[ux]` y a `ux-findings.json`.
- Línea base: `visual-regression.js --update` sobre todas las rutas, sin revisión semántica.
- Arreglos: `quality-loop --staged --from-tracks` en el mismo worktree, solo ítems `ux`, commiteando únicamente las rutas `owns=` de cada ítem.
- Re-verificación: build/test completo, comparación visual de todas las rutas, smoke de las rutas tocadas, cada criterio `ac` repetido en un navegador real y `DESIGN.md` actualizado solo con lo implementado y verificado.
- Reporte con su veredicto propio.

## Qué no hace

- No integra a main y rechaza `--push-main`, `--quick` y `--audit-only`; se combina solo con `--resume`.
- No revisa seguridad, base de datos, dependencias, rendimiento ni código muerto.
- No hace push ni despliega: se detiene en la rama loop.
- No dice BATTLE-TESTED ni "ready".
- Los hallazgos que no son de UX/UI se listan al final del reporte y no se arreglan.

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de battle-test y confirmá que existe --ux y que dice que rechaza --push-main, --quick y --audit-only. Si no existe, pará y decímelo.
2. Objetivo y alcance: Curar solo la UX/UI de <ruta del proyecto>, centrado en <pantallas o flujo>. Trabajá desde ese directorio; si no estás parado ahí, pará y decímelo. App: <URL local o de staging>, con los roles y las credenciales por variables de entorno que ya tengo cargadas; la skill levanta la app desde su worktree aislado; si en esa URL ya corre un build de otro checkout o de otro SHA, pará y avisame, porque esa evidencia no vale. Antes de empezar confirmá que validation.config.json lista todas las rutas en routes[]. La elección de cambios es mía: preguntámela con la herramienta de preguntas, recomendá un conjunto compatible y mandá lo no elegido a GATED. Recomendá solo cambios dentro de <pantallas o flujo>.
3. Comando: /battle-test --ux
4. Límites: Prohibido: tocar seguridad, base de datos, dependencias, rendimiento, refactors ni archivos fuera de las pantallas <pantallas o flujo>. Tampoco pasar --push-main, --quick ni --audit-only. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL, el .env o la base de datos apuntan a producción, pará y avisame. No integres a main ni hagas push. No desplegues: eso queda GATED para mí. Si necesitás preguntarme algo y no tenés herramienta para preguntar, escribilo como GATED y pará; después lo retomo con --resume.
6. Cierre: Entregá el reporte HTML en <repo>/artifacts/ con el veredicto UX SCOPE VERIFIED o UX SCOPE FAILED, nunca BATTLE-TESTED ni "ready". El reporte dice que seguridad, base de datos, dependencias, rendimiento y código muerto no se revisaron, separa la comparación visual de todas las rutas del smoke de las rutas tocadas, y termina con la sección "Out of scope". Cola GATED: Cnn no elegidos, criterios fallidos y aprobación de deploy. Evidencia faltante, vieja o bloqueada cuenta como fallo, nunca como pase.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `Start the app from the isolated worktree` | `skills/battle-test/references/stages.md:25` | La skill levanta la app desde el worktree aislado |
| `evidence from another checkout is invalid` | `skills/battle-test/SKILL.md:60-61` | La evidencia de otro checkout no vale |
| `/battle-test --ux` | `skills/battle-test/SKILL.md:20` | Forma publicada; "combine only with --resume" |
| `refuse + --push-main + --quick + --audit-only` | `skills/battle-test/SKILL.md:40` | Rechaza los tres flags |
| `never integrates to main` | `skills/battle-test/SKILL.md:40` | Termina con commits en la rama loop |
| `Findings that are not UX/UI are listed at the end` | `skills/battle-test/SKILL.md:55-56` | Lista final sin arreglar (la segunda línea de límites del prompt) |
| `Minimal diffs, no rewrites, no scope creep` | `skills/battle-test/SKILL.md:67` | Alcance mínimo |
| `choose the changes` | `skills/battle-test/SKILL.md:84` | La única pausa humana |
| `No question tool: write the decision as GATED and stop` | `skills/battle-test/SKILL.md:85` | Sin herramienta para preguntar: GATED y parar |
| `EVERY route in` | `skills/battle-test/references/stages.md:157` | `routes[]` con todas las rutas |
| `ux-findings.json test-manifest/ .battle-test/ TRACKS.md` | `skills/battle-test/references/stages.md:163` | Artefactos fuera de git |
| `Do not run` | `skills/battle-test/references/stages.md:171-172` | No corre `/audit` ni hay `AUDIT VERDICT` |
| `The one human pause` | `skills/battle-test/references/stages.md:174` | La pausa; lo no elegido va a GATED (línea 176) |
| `visual-regression.js --update --role` | `skills/battle-test/references/stages.md:185` | Línea base de todas las rutas |
| `--staged --from-tracks` | `skills/battle-test/references/stages.md:191` | quality-loop con los dos flags |
| `commits only each item's` | `skills/battle-test/references/stages.md:192-193` | Commit solo de las rutas `owns=` |
| `Replay every + in a real browser` | `skills/battle-test/references/stages.md:220` | Criterios repetidos por la sesión principal |
| `Stop on the loop branch. No push, no deploy.` | `skills/battle-test/references/stages.md:230` | Corte de la etapa 4 UX |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/stages.md:234` | Veredicto de la etapa 5 UX |
| `Not reviewed in this mode: security, database` | `skills/battle-test/references/gates.md:52-53` | Lo que no revisa: seguridad, base de datos, dependencias, rendimiento y código muerto |
| `never authorizes` | `skills/battle-test/references/gates.md:39-40` | Nunca autoriza BATTLE-TESTED, integración, release ni deploy |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/report.md:19` | Veredicto 1 de 2 |
| `UX SCOPE FAILED` | `skills/battle-test/references/report.md:19` | Veredicto 2 de 2 |
| `any "ready" wording` | `skills/battle-test/references/report.md:50` | Nunca "ready" |
| `Out of scope` | `skills/battle-test/references/report.md:59` | Sección final con lo no UX |
| `unchosen + Cnn` | `skills/battle-test/references/report.md:58` | Cola GATED del modo UX |

## No definido en el texto

- Qué pasa si la URL sirve un build que no es el del worktree: el texto dice que la evidencia de otro checkout es inválida y que una identidad faltante o vieja da INCOMPLETE (`skills/battle-test/references/report.md:16`); el prompt manda parar.
- `--ux` con una ruta de proyecto: el texto no lo muestra (solo `--ux` y `--ux` con `--resume`); por eso el prompt usa el directorio actual.
- Cómo limitar la auditoría o la línea base a unas pantallas: el texto cubre todas las rutas. Por eso el prompt limita lo que se recomienda en la pausa, no el inventario.
