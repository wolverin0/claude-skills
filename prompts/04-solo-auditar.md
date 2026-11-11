# 04 - Solo auditar: diagnóstico sin arreglos

Comando: `/battle-test --audit-only`

## Cuándo usarlo

Querés saber cómo está el proyecto antes de decidir qué arreglar. Corre el preflight y la auditoría de la etapa 1 y se frena ahí.
No toca el código del proyecto: no hay etapa de arreglos.

## Qué hace

- Preflight (etapa 0): resuelve el proyecto, registra `HEAD` y el SHA, crea un worktree aislado y arma `validation.config.json`.
- Diagnóstico (etapa 1): usa `audit-orchestrator` con el alcance del proyecto (unos 40 a 70 minutos) y espera la señal `[AUDIT COMPLETE: ...]` o `[AUDIT TRUNCATED: <reason>]`.
- Lee `audit-report.md` y el bloque `AUDIT VERDICT`.
- Si el veredicto es 🛑 o 🔴, te pregunta fix-first / proceed / stop.
- Extrae la lista de hallazgos (`F-...`, con severidad y `ruta:línea`) al estado de la corrida.
- Escribe el reporte y se detiene ahí.

## Qué no hace

- No arregla nada: no corre la línea base, ni quality-loop, ni la re-verificación.
- No integra a main, no despliega.
- No usa `--ux`: `--ux` rechaza `--audit-only`. Para una auditoría de UX sin arreglos, caso 09.

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de battle-test y confirmá que existe --audit-only ("stop after diagnose (no fixes)"). Si no existe, pará y decímelo.
2. Objetivo y alcance: Diagnosticar <ruta del proyecto> sin arreglar nada. Trabajá desde ese directorio; si no estás parado ahí, pará y decímelo. Si hace falta app para el preflight: <URL local o de staging>; si faltan URL o credenciales, anotá lo que falta como GATED y seguí con la auditoría. Foco que más me importa: <pantallas o flujo>; la auditoría igual cubre el proyecto entero.
3. Comando: /battle-test --audit-only
4. Límites: Prohibido: modificar el código del proyecto, hacer commits, correr la línea base, quality-loop o la re-verificación, integrar a main, hacer push, desplegar. Los únicos archivos nuevos son los que genera la auditoría (audit-report.md y el estado de la corrida); si ya había un audit-report.md, que lo renombre como indica la skill. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL, el .env o la base de datos apuntan a producción, pará y avisame. No integres a main. No desplegues. Si el veredicto es 🛑 o 🔴 y el flujo ofrece fix-first / proceed / stop, preguntámelo a mí y recomendá stop: este modo no arregla. Si necesitás preguntarme algo y no tenés herramienta para preguntar, escribilo como GATED y pará.
6. Cierre: Entregá audit-report.md, el AUDIT VERDICT con uno de sus cinco textos exactos, sin suavizarlo, y la señal [AUDIT COMPLETE: ...] o [AUDIT TRUNCATED: <reason>] tal como salió. Además la lista de hallazgos F-... con severidad y ruta:línea. No uses ningún veredicto de battle-test (BATTLE-TESTED y los demás): este modo no tiene uno.
```

## Veredictos esperados (los cinco textos exactos de la auditoría)

| Token | Archivo:línea | Cuándo |
| --- | --- | --- |
| `🛑 DO NOT LAUNCH UNTIL HARD STOPS RESOLVED` | `skills/audit/references/audit-triage-rubric.md:52` | Hay algún hard stop |
| `🔴 BLOCK LAUNCH — fix EXPLOITABLE-NOW findings before any production traffic` | `skills/audit/references/audit-triage-rubric.md:53` | Al menos un hallazgo EXPLOITABLE-NOW, sin hard stops |
| `🟠 FIX BEFORE LAUNCH — multiple critical issues; estimate days-to-weeks` | `skills/audit/references/audit-triage-rubric.md:54` | 3 o más críticos, o 1 crítico en pagos/auth/borrados |
| `🟡 SHIPPABLE WITH PLAN — significant tech debt; schedule remediation sprint` | `skills/audit/references/audit-triage-rubric.md:55` | 3 o más altos, sin críticos |
| `🟢 ACCEPTABLE — routine cleanup; no launch-blockers` | `skills/audit/references/audit-triage-rubric.md:56` | Mayormente medios y bajos |

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `--audit-only` | `skills/battle-test/SKILL.md:17` | Forma publicada: "stop after diagnose (no fixes)" |
| `no fixes` | `skills/battle-test/SKILL.md:17` | Sin arreglos |
| `Resolve the project path` | `skills/battle-test/references/stages.md:9` | Etapa 0: proyecto = argumento o cwd |
| `continue with whatever can run` | `skills/battle-test/references/stages.md:28` | Sin URL o credenciales: GATED y seguir (el ejemplo es audit-only) |
| `Use the audit-orchestrator skill` | `skills/battle-test/references/stages.md:32` | Etapa 1; ~40-70 min |
| `[AUDIT COMPLETE: ...]` | `skills/battle-test/references/stages.md:33` | Señal de fin |
| `[AUDIT TRUNCATED: <reason>]` | `skills/battle-test/references/stages.md:33` | Señal de corte |
| `AUDIT VERDICT` | `skills/battle-test/references/stages.md:35` | El bloque a leer: uno de los cinco textos exactos |
| `AskUserQuestion: fix-first / proceed / stop` | `skills/battle-test/references/stages.md:36` | Pausa con 🛑/🔴 |
| `F-1.3` | `skills/battle-test/references/stages.md:38` | Formato de los ids de hallazgo, con severidad y ruta:línea |
| `write the report and stop here` | `skills/battle-test/references/stages.md:40` | Corte del modo |
| `Refuse` | `skills/battle-test/references/stages.md:148` | `--ux` rechaza `--audit-only` |
| `Read-only audit` | `commands/audit.md:66` | La auditoría no modifica código fuente |
| `audit-report.md` | `commands/audit.md:22` | Archivo de salida, en la raíz del proyecto |
| `audit-report.previous-YYYYMMDD-HHMM.md` | `skills/audit/audit-orchestrator/SKILL.md:227` | Si ya había un reporte, lo renombra |
| `[AUDIT COMPLETE: all 7 rules attested, all 13 domains covered]` | `skills/audit/audit-orchestrator/SKILL.md:243` | Texto completo de la señal de fin |
| `[AUDIT TRUNCATED: <reason>]` | `skills/audit/audit-orchestrator/SKILL.md:244` | Texto completo de la señal de corte |

## No definido en el texto

- Qué reporte escribe "write the report and stop here" (`skills/battle-test/references/stages.md:40`): el `audit-report.md` se genera seguro; el texto no dice si además se arma el HTML unificado.
- Qué veredicto de battle-test corresponde: `skills/battle-test/references/report.md:7-19` no define ninguno para `--audit-only`. El único veredicto es el de la auditoría.
- Cómo encaja la pausa fix-first / proceed / stop en un modo sin arreglos: el texto no lo dice; el prompt recomienda stop.
- Cuánto del preflight corre en este modo (worktree, arranque de la app): el texto no dice que se saltee, por eso el prompt lo trata como corrido.
- `--audit-only` junto a `--quick`, `--push-main` o `--resume`: no se menciona.
