# 02 - Todo e integrar a main

Comando: `/battle-test --push-main`

> **ADVERTENCIA: donde hay auto-deploy, integrar a main equivale a desplegar.**
> El flag solo autoriza integrar a main; la skill nunca despliega por sí misma. Pero si tu plataforma despliega cada vez que entra algo a main, este prompt termina en producción.
> Si no estás seguro de que tu proyecto no tiene auto-deploy, corré el caso 01 y mergeá a mano.

## Cuándo usarlo

Querés el ciclo completo del caso 01 y que, solo si todos los gates dan verde, el rango de commits probado entre a main.
Es el único caso de esta carpeta que toca main.

## Qué hace

- Todo lo del caso 01, etapas 0 a 4, en un worktree aislado y con commits en la rama loop.
- Etapa 4, paso final: hace fetch, prueba que main sigue siendo un avance directo (fast-forward) desde la base registrada, repite el build/test y recién ahí integra solo el rango probado.
- Un lote que regresa no se integra: queda como ítem de TRACKS.
- Etapa 5: reporte HTML y cola GATED.

## Qué no hace

- No despliega: `--push-main` autoriza solo la integración a main (`vercel --prod` y equivalentes siguen GATED).
- No hace migraciones, rotación de secretos ni cambios de plataforma: piden autoridad aparte.
- No integra con una señal roja, vieja o que no coincide con el candidato exacto.
- No declara BATTLE-TESTED con algo rojo.

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de battle-test y confirmá que existe --push-main, que dice que autoriza integrar a main solo después de pasar todos los gates y que el despliegue nunca es automático. Si no lo dice, pará y decímelo.
2. Objetivo y alcance: Curación completa de <ruta del proyecto> e integración a main del rango de commits probado, solo si todos los gates dan verde. Trabajá desde ese directorio; si no estás parado ahí, pará y decímelo. App para las etapas de navegador: <URL local o de staging>; la skill levanta la app desde su worktree aislado; si en esa URL ya corre un build de otro checkout o de otro SHA, pará y avisame, porque esa evidencia no vale. Foco que más me importa: <pantallas o flujo>; el ciclo igual cubre todo el proyecto. Las credenciales llegan por variables de entorno que ya tengo cargadas; si faltan, anotá lo que falta como GATED y seguí con lo que se pueda correr.
3. Comando: /battle-test --push-main
4. Límites: Prohibido: desplegar, hacer migraciones, rotar secretos, cambiar plataformas externas, tocar datos que no sean de prueba, hacer force push o reset --hard contra main, integrar algo que no sea el rango probado. Arreglos con diffs mínimos, sin reescrituras. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL, el .env o la base de datos apuntan a producción, pará y avisame. Integrá a main únicamente si, después del fetch, main sigue descendiendo de la base registrada, el build/test pasa y todos los gates de la etapa 4 están en verde sobre el candidato exacto; si algo está rojo, viejo o no coincide, no integres y dejalo como ítem de TRACKS. Después de integrar no desplegues: eso queda GATED para mí. Si necesitás preguntarme algo y no tenés herramienta para preguntar, escribilo como GATED y pará.
6. Cierre: Entregá el reporte HTML abierto y verificado en <repo>/artifacts/, la cola GATED y el rango de commits. Decí si el rango quedó en la rama loop o se integró, y solo escribí que se integró si tenés la evidencia del push. Veredicto: uno solo de BATTLE-TESTED, READY WITH GATED ITEMS, NOT READY o INCOMPLETE. No digas BATTLE-TESTED con algo rojo, cobertura incompleta, capturas sin revisar o SHA que no coincide.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `Start the app from the isolated worktree` | `skills/battle-test/references/stages.md:25` | La skill levanta la app desde el worktree aislado |
| `evidence from another checkout is invalid` | `skills/battle-test/SKILL.md:60-61` | La evidencia de otro checkout no vale |
| `--push-main` | `skills/battle-test/SKILL.md:19` | Forma publicada: autoriza integrar después de pasar todos los gates |
| `deployment is never automatic` | `skills/battle-test/SKILL.md:3` | El despliegue nunca es automático |
| `With + --push-main` | `skills/battle-test/SKILL.md:64-65` | Integra solo tras el gate de quality-loop y la re-validación exhaustiva de la etapa 4 |
| `Deploy is never automatic` | `skills/battle-test/SKILL.md:66` | Deploy siempre GATED |
| `With + --push-main` | `skills/battle-test/references/stages.md:132-134` | Fetch, prueba de fast-forward, build/test, integra solo el rango probado; el lote que regresa queda como TRACKS |
| `Deploy remains GATED regardless` | `skills/battle-test/references/stages.md:135` | Deploy gateado igual |
| `--push-main + never deploy` | `skills/battle-test/references/gates.md:63` | `--push-main` autoriza solo integración a main, nunca deploy |
| `Main integration, deployment, migrations, secret rotation` | `skills/battle-test/references/gates.md:62` | Migraciones, secretos y plataformas piden autoridad aparte |
| `prove it still descends from the recorded base` | `skills/battle-test/references/gates.md:69-70` | Condición de integración |
| `A failed or stale signal blocks` | `skills/battle-test/references/gates.md:71-72` | Señal fallida o vieja bloquea el push |
| `Never list a commit as pushed` | `skills/battle-test/references/report.md:44` | No decir "pushed" sin evidencia |
| `BATTLE-TESTED` | `skills/battle-test/references/report.md:11` | Veredicto 1 de 4 |
| `READY WITH GATED ITEMS` | `skills/battle-test/references/report.md:13` | Veredicto 2 |
| `NOT READY` | `skills/battle-test/references/report.md:15` | Veredicto 3 |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Veredicto 4 |
| `git reset --hard` | `skills/quality-loop/SKILL.md:121` | `reset --hard` contra main está bloqueado por guardrail |

## No definido en el texto

- Qué pasa si la URL sirve un build que no es el del worktree: el texto dice que la evidencia de otro checkout es inválida y que una identidad faltante o vieja da INCOMPLETE (`skills/battle-test/references/report.md:16`); el prompt manda parar.
- Cuál es la rama destino además de "main": el texto dice "main" y "the target" sin más.
- Si `--push-main` se combina con `--resume`, `--quick` o `--audit-only`: no se menciona. Sobre `--quick`, el texto solo dice que nunca hace push ni deploy.
- Qué plataformas tienen auto-deploy: lo sabés vos; la skill no lo detecta.
