# 06 - Retomar una corrida pausada

Comandos: `/battle-test --resume` (bloque A) y `/battle-test --ux --resume` (bloque B)

## Cuándo usarlo

Una corrida de battle-test se pausó (llegó a un gate, se quedó sin contexto o esperaba tu respuesta) y querés seguir desde donde quedó.
Usá el bloque A para una corrida completa y el bloque B para una corrida en modo UX.

## Qué hace

- Lee el checkpoint `<repo>/.battle-test/state.json`, que se guarda después de cada etapa, y continúa desde ahí.
- En modo UX, el estado guarda `mode: ux` para que `--resume` lo restaure.
- En modo UX, si la corrida quedó esperando tu elección de cambios (sin herramienta para preguntar), `--resume` sigue desde tu respuesta.

## Qué no hace

- No empieza de cero ni cambia de modo.
- No integra a main ni despliega.
- No define cómo se combina con `--push-main`, `--quick` o `--audit-only`.

## Bloque A: corrida completa

```
1. Chequeo previo: Abrí el SKILL.md instalado de battle-test y confirmá que existe --resume ("continue a paused run"). Si no existe, pará y decímelo. Después leé <ruta del proyecto>/.battle-test/state.json; si no existe, pará y decímelo.
2. Objetivo y alcance: Retomar la corrida pausada de <ruta del proyecto>. Trabajá desde ese directorio; si no estás parado ahí, pará y decímelo. Antes de seguir decime en una línea: modo, última etapa completada, SHA registrado y si el estado dice que la corrida original tenía --push-main. Si el estado dice mode: ux, pará y usá el bloque B. App en marcha: <URL local o de staging>; si ya no responde ahí, no la apuntes a otra URL, y si sirve un build de otro SHA que el registrado, esa evidencia no vale: pará y avisame en ambos casos. Foco que más me importa: <pantallas o flujo>; la corrida igual cubre todo el proyecto.
3. Comando: /battle-test --resume
4. Límites: Prohibido: reiniciar la corrida, cambiar de modo, integrar a main, hacer push, desplegar, tocar datos que no sean de prueba. Esta corrida NO integra a main aunque la original lo haya pedido: si el estado lo pedía, pará y avisame, porque el texto no define cómo se combina --resume con --push-main. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL, el .env o la base de datos apuntan a producción, pará y avisame. No integres a main. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, escribilo como GATED y pará.
6. Cierre: Terminá las etapas que faltan y entregá el reporte HTML en <repo>/artifacts/ y la cola GATED. Veredicto: uno solo de BATTLE-TESTED, READY WITH GATED ITEMS, NOT READY o INCOMPLETE; nunca BATTLE-TESTED con algo rojo, cobertura incompleta, capturas sin revisar o SHA que no coincide. Si el SHA, el build o el config no coinciden con el estado guardado, es INCOMPLETE.
```

## Bloque B: corrida en modo UX

```
1. Chequeo previo: Abrí el SKILL.md instalado de battle-test y confirmá que existen --ux y --resume, y que --ux se combina solo con --resume. Si no, pará y decímelo. Después leé <ruta del proyecto>/.battle-test/state.json; si no existe, pará y decímelo.
2. Objetivo y alcance: Retomar la corrida UX pausada de <ruta del proyecto>, centrada en <pantallas o flujo>. Trabajá desde ese directorio; si no estás parado ahí, pará y decímelo. Antes de seguir decime en una línea: modo, última etapa completada y SHA registrado. Si el estado quedó esperando mi elección de cambios, mi elección es: <conjunto compatible, lista Cnn o ninguno>. Si el estado no está esperando una elección, ignorá esa línea. App en marcha: <URL local o de staging>; si ya no responde ahí, o si sirve un build de otro SHA que el registrado, pará y avisame.
3. Comando: /battle-test --ux --resume
4. Límites: Prohibido: tocar seguridad, base de datos, dependencias, rendimiento, refactors ni archivos fuera de las pantallas <pantallas o flujo>. Tampoco pasar --push-main, --quick ni --audit-only. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL, el .env o la base de datos apuntan a producción, pará y avisame. No integres a main ni hagas push. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, escribilo como GATED y pará.
6. Cierre: Terminá las etapas UX que faltan y entregá el reporte HTML en <repo>/artifacts/ con el veredicto UX SCOPE VERIFIED o UX SCOPE FAILED, nunca BATTLE-TESTED ni "ready", más la sección "Out of scope" y la cola GATED. Evidencia faltante, vieja o bloqueada cuenta como fallo.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `--resume` | `skills/battle-test/SKILL.md:16` | Forma publicada: "continue a paused run" |
| `combine only with --resume` | `skills/battle-test/SKILL.md:20` | `--ux` se combina solo con `--resume` |
| `Record + mode: ux` | `skills/battle-test/SKILL.md:41` | El estado guarda `mode: ux` para que `--resume` lo restaure |
| `resumes with` | `skills/battle-test/SKILL.md:88` | La corrida guarda checkpoint por etapa y se retoma con `/battle-test --resume` |
| `state.json` | `skills/battle-test/references/stages.md:3` | Checkpoint después de cada etapa |
| `--resume + continues from the` | `skills/battle-test/references/stages.md:149-150` | En modo UX, retoma desde la respuesta del operador |
| `Without + AskUserQuestion + GATED + stop` | `skills/battle-test/references/stages.md:149-150` | Sin herramienta para preguntar: GATED y parar |
| `INCOMPLETE` | `skills/battle-test/references/report.md:16` | Veredicto cuando falta evidencia o no coincide la identidad |
| `UX SCOPE VERIFIED` | `skills/battle-test/references/report.md:19` | Veredicto del modo UX |

## No definido en el texto

- `--resume` junto a `--push-main`, `--quick` o `--audit-only`: no se menciona. Por eso el bloque A no integra y se detiene si el estado dice que la corrida original lo pedía.
- Si el estado guarda `--push-main`: el texto no lo dice.
- Cómo se le pasa a la corrida la respuesta de la pausa del modo UX: el texto dice que `--resume` sigue "from the operator's answer" pero no el mecanismo; el bloque B la incluye en el alcance.
- Si `--resume` solo restaura el modo UX o si hace falta repetir `--ux`: el texto dice que el estado guarda `mode: ux` para que `--resume` lo restaure y también muestra `--ux --resume`.
- La ubicación exacta del estado: el texto dice `<repo>/.battle-test/state.json` en un lugar y `<worktree>/.battle-test/<timestamp>/` para los artefactos en otro.
