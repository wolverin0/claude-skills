# 01 - Todo: curación completa, sin integrar a main

Comando: `/battle-test`

## Cuándo usarlo

Querés el ciclo completo sobre un proyecto: diagnóstico, validación en navegador, arreglos y re-verificación.
Los arreglos quedan como commits en una rama aparte; a main no entra nada. Es una corrida de varias horas y guarda estado por etapa.

## Qué hace

- Etapa 0, preflight: crea un worktree aislado en el SHA registrado, arma `validation.config.json` y levanta la app desde ese worktree.
- Etapa 1, diagnóstico: corre `audit-orchestrator`, lee `audit-report.md` y el bloque `AUDIT VERDICT`; con 🛑 o 🔴 te pregunta fix-first / proceed / stop.
- Etapa 2, línea base: `validation --full --fresh`, multi-rol, `security-probe.js`, `visual-regression.js --update` y presupuesto de rendimiento con Lighthouse.
- Etapa 3, arreglos: `quality-loop --staged --from-tracks` en el mismo worktree; commits en la rama `loop/<proyecto>`.
- Etapa 4, re-verificación: repite la validación exhaustiva sobre el build candidato y compara contra la línea base.
- Etapa 5, reporte: HTML en `<repo>/artifacts/` y la cola GATED con lo que solo podés hacer vos.

## Qué no hace

- No integra a main: sin `--push-main` se queda en la rama loop.
- No despliega: `vercel --prod` y equivalentes son siempre un ítem GATED.
- No declara BATTLE-TESTED si algo de la etapa 4 está rojo, si hay un hallazgo crítico de seguridad abierto o si la cobertura está incompleta.
- No se frena a preguntar salvo en los gates de abajo.

## Avisos antes de pegarlo

- La etapa 2 crea y borra datos de prueba con prefijo `VAL_` y corre sondas de seguridad activas: solo contra datos locales o de staging.
- El presupuesto de rendimiento ejecuta `npx lighthouse`, que se descarga de npm la primera vez y necesita Chrome.
- Pausas que te va a pedir: veredicto 🛑/🔴 de la auditoría, falta de app en marcha o de credenciales, y push/deploy sin autorización (van a GATED).

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de battle-test y confirmá que dice que la integración a main requiere --push-main y que existe --ux (señal de que es la versión nueva). Si no lo dice, pará y decímelo.
2. Objetivo y alcance: Curación completa de <ruta del proyecto>, sin integrar a main. Trabajá desde ese directorio; si no estás parado ahí, pará y decímelo. App para las etapas de navegador: <URL local o de staging>; la skill levanta la app desde su worktree aislado; si en esa URL ya corre un build de otro checkout o de otro SHA, pará y avisame, porque esa evidencia no vale. Foco que más me importa: <pantallas o flujo>; el ciclo igual cubre todo el proyecto. Las credenciales llegan por variables de entorno que ya tengo cargadas; si faltan, anotá lo que falta como GATED y seguí con lo que se pueda correr.
3. Comando: /battle-test
4. Límites: Prohibido: integrar a main, hacer push de cualquier rama, desplegar, hacer migraciones, rotar secretos, cambiar plataformas externas o tocar datos que no sean de prueba. Arreglos con diffs mínimos, sin reescrituras. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL, el .env o la base de datos apuntan a producción, pará y avisame. No integres a main. No desplegues: eso queda en la cola GATED para mí. Si necesitás preguntarme algo y no tenés herramienta para preguntar, escribilo como GATED y pará.
6. Cierre: Entregá el reporte HTML abierto y verificado en <repo>/artifacts/, la cola GATED, el rango de commits de la rama loop y la línea [QUALITY-LOOP COMPLETE: ...] con pushed=false. Veredicto: uno solo de BATTLE-TESTED, READY WITH GATED ITEMS, NOT READY o INCOMPLETE. No digas BATTLE-TESTED con algo rojo, cobertura incompleta, capturas sin revisar o SHA que no coincide. Lo que no corrió va como NOT RUN, BLOCKED o INCOMPLETE, nunca como cero.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `/battle-test` | `skills/battle-test/SKILL.md:14` | Forma sin argumentos: proyecto actual |
| `--push-main` | `skills/battle-test/SKILL.md:3` | La integración a main requiere el flag; el despliegue nunca es automático |
| `Without + --push-main` | `skills/battle-test/SKILL.md:64` | Sin el flag se queda con commits en la rama loop |
| `Deploy is never automatic` | `skills/battle-test/SKILL.md:66` | Deploy siempre GATED |
| `multi-hour` | `skills/battle-test/SKILL.md:87` | Corrida multi-hora con checkpoints |
| `Start the app from the isolated worktree` | `skills/battle-test/references/stages.md:25` | La skill levanta la app desde el worktree aislado |
| `evidence from another checkout is invalid` | `skills/battle-test/SKILL.md:60-61` | La evidencia de otro checkout no vale |
| `Resolve the project path` | `skills/battle-test/references/stages.md:9` | Proyecto = argumento o cwd |
| `Credentials go in env vars only` | `skills/battle-test/references/stages.md:24` | Credenciales solo por variables de entorno |
| `record the` | `skills/battle-test/references/stages.md:27` | Si faltan URL o credenciales: GATED y seguir con lo que corra |
| `[AUDIT COMPLETE: ...]` | `skills/battle-test/references/stages.md:33` | Señal de fin de la auditoría |
| `AskUserQuestion: fix-first / proceed / stop` | `skills/battle-test/references/stages.md:36` | Pausa con 🛑/🔴 |
| `validation --full --fresh` | `skills/battle-test/references/stages.md:52` | Línea base de la etapa 2 |
| `visual-regression.js --update` | `skills/battle-test/references/stages.md:62` | Baseline visual |
| `fetches it on first use` | `skills/battle-test/references/stages.md:92` | Lighthouse se descarga con npx |
| `--staged --from-tracks` | `skills/battle-test/references/stages.md:107` | Cómo invoca quality-loop |
| `Do **not** let it push to main yet` | `skills/battle-test/references/stages.md:111` | Sin push en la etapa 3 |
| `Deploy remains GATED regardless` | `skills/battle-test/references/stages.md:135` | Deploy gateado |
| `Do not claim "battle-tested"` | `skills/battle-test/references/stages.md:140` | Condiciones para no declararlo |
| `Hard stops: choose fix-first` | `skills/battle-test/references/gates.md:59` | Primer punto de decisión humana |
| `require + separate explicit authority` | `skills/battle-test/references/gates.md:62-63` | Migraciones, secretos, plataformas y deploy piden autoridad aparte |
| `BATTLE-TESTED` | `skills/battle-test/references/report.md:11` | Veredicto 1 de 4 |
| `READY WITH GATED ITEMS` | `skills/battle-test/references/report.md:13` | Veredicto 2 |
| `NOT READY` | `skills/battle-test/references/report.md:15` | Veredicto 3 |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Veredicto 4 |
| `<repo>/artifacts/YYYY-MM-DD-battle-test.html` | `skills/battle-test/references/report.md:3` | Dónde queda el reporte |
| `NOT RUN` | `skills/battle-test/references/report.md:44` | Nunca mostrar cero por lo no ejecutado |
| `VAL_` | `skills/validation/SKILL.md:52` | El modo full crea datos con prefijo VAL_ |
| `QUALITY-LOOP COMPLETE` | `skills/quality-loop/SKILL.md:115` | Línea final de quality-loop |

## No definido en el texto

- Qué pasa si la URL sirve un build que no es el del worktree: el texto dice que la evidencia de otro checkout es inválida y que una identidad faltante o vieja da INCOMPLETE (`skills/battle-test/references/report.md:16`); el prompt manda parar.
- Cómo se combina una ruta de proyecto con un flag: el texto solo muestra una forma con ruta relativa de ejemplo y las formas con flag por separado, por eso el prompt usa el directorio actual.
- Qué pasa si hay cambios sin commitear en el proyecto: la etapa 0 dice parar y preguntar (`skills/battle-test/references/stages.md:10`), pero no dice cómo se responde en una corrida desatendida.
