# 05 - Rápido: revisión chica, nunca "battle-tested"

Comando: `/battle-test --quick`

## Cuándo usarlo

Hiciste un cambio chico y querés confianza rápida sobre las rutas clave o las que cambiaste.
Es una revisión claramente más débil que el ciclo completo: no prueba que el proyecto esté listo.

## Qué hace

- Corre `vibe-to-prod`: una autoevaluación guiada de solo lectura, por capas.
- Corre `validation --mode smoke --fresh` sobre las rutas clave o cambiadas.
- Revisa todas las capturas que salgan y exige `smokeScopeComplete:true`.
- Si la app tiene interfaz web, mide una vez el presupuesto de rendimiento (Lighthouse) en la ruta de inicio.
- Escribe el reporte QUICK CHECK y se detiene.

## Qué no hace

- No corre la auditoría completa, el endurecimiento autónomo, la profundidad de seguridad ni el ledger exhaustivo.
- Nunca emite BATTLE-TESTED.
- Nunca hace push ni despliega, ni autoriza integración o release.

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de battle-test y confirmá que existe --quick ("vibe-to-prod + validation smoke; no battle-tested verdict"). Si no existe, pará y decímelo. Confirmá también que están instaladas las skills vibe-to-prod y validation; si falta alguna, pará y decímelo.
2. Objetivo y alcance: Revisión rápida de <ruta del proyecto>, solo sobre las rutas clave o cambiadas: <pantallas o flujo>. Trabajá desde ese directorio; si no estás parado ahí, pará y decímelo. App en marcha: <URL local o de staging>, con las credenciales por variables de entorno que ya tengo cargadas. Si es una app con login y faltan credenciales, la validación queda bloqueada, no pasada: anotalo como GATED y no digas QUICK CHECK PASSED.
3. Comando: /battle-test --quick
4. Límites: Prohibido: correr la auditoría completa, endurecer o arreglar código, hacer commits, integrar a main, hacer push, desplegar. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL, el .env o la base de datos apuntan a producción, pará y avisame. No integres a main. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, escribilo como GATED y pará.
6. Cierre: Entregá el reporte QUICK CHECK con las capturas revisadas y smokeScopeComplete. Veredicto: QUICK CHECK PASSED o QUICK CHECK FAILED, nunca BATTLE-TESTED. Aclarame que un QUICK CHECK PASSED no autoriza integración, release ni despliegue y que no reemplaza el ciclo completo.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `--quick` | `skills/battle-test/SKILL.md:18` | Forma publicada: "vibe-to-prod + validation smoke; no battle-tested verdict" |
| `clearly weaker smoke/readiness check` | `skills/battle-test/SKILL.md:3` | Revisión más débil, nunca battle-tested |
| `validation --mode smoke --fresh` | `skills/battle-test/references/stages.md:44` | Qué corre |
| `smokeScopeComplete:true` | `skills/battle-test/references/stages.md:45` | Exige el alcance de smoke completo |
| `skip the full audit` | `skills/battle-test/references/stages.md:45-46` | No corre auditoría completa, endurecimiento autónomo, seguridad en profundidad ni ledger exhaustivo |
| `perf budget once on the home` | `skills/battle-test/references/stages.md:46-47` | Presupuesto de rendimiento una vez en la ruta de inicio si hay UI web |
| `never push or deploy` | `skills/battle-test/references/stages.md:48` | Nunca hace push ni despliega |
| `QUICK CHECK PASSED` | `skills/battle-test/references/gates.md:34` | Veredicto 1 de 2 |
| `QUICK CHECK FAILED` | `skills/battle-test/references/gates.md:35` | Veredicto 2 de 2 |
| `never authorizes` | `skills/battle-test/references/gates.md:35` | No autoriza BATTLE-TESTED, integración, release ni despliegue |
| `smokeScopeComplete:true` | `skills/battle-test/references/gates.md:33` | Condición del gate rápido |
| `QUICK CHECK PASSED` | `skills/battle-test/references/report.md:18` | Solo para `--quick` |
| `blocked + not passed` | `skills/validation/SKILL.md:41` | App con login sin credenciales: bloqueada, no pasada |
| `SMOKE VERIFIED` | `skills/validation/SKILL.md:50` | Veredicto propio del modo smoke de validation |
| `Read-only by default` | `skills/vibe-to-prod/SKILL.md:116` | `vibe-to-prod` es de solo lectura salvo pedido |

## No definido en el texto

- Cómo se eligen las "key/changed routes": el texto no dice si se pasan al comando; el prompt las declara en el alcance.
- Qué veredicto corresponde cuando la revisión rápida queda bloqueada por falta de credenciales: el texto solo dice QUICK CHECK PASSED o QUICK CHECK FAILED; el prompt exige no decir PASSED.
- Si `--quick` crea el worktree aislado de la etapa 0: la sección del perfil rápido no lo dice.
- `--quick` junto a `--push-main`, `--audit-only` o `--resume`: no se menciona; solo se sabe que `--quick` nunca hace push ni despliega.
- Si el smoke crea o borra datos de prueba: el modo smoke no lo aclara (el texto habla de `VAL_` solo para standard y exhaustive).
- `vibe-to-prod` pide un archivo de referencia (el playbook) que este repo no incluye: si falta, la skill lo cita como profundidad opcional.
