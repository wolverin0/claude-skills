# 08 - Solo validar la app (`/validation` y sus modos)

Comandos: bloque A `/validation <URL>` (estándar), B `/validation --mode smoke --fresh <URL>`, C `/validation --full --fresh <URL>`, D `/validation --interactive`, E `/validation --fresh <URL>`, F `/validation --resume`

## Cuándo usarlo

Querés comprobar en un navegador real que la app anda, sin auditar el código ni arreglar nada.
Elegí el bloque según la profundidad: B para una confianza rápida, A para el ciclo completo y seguro de la interfaz, C para profundidad de release.

## Qué hace

- Estándar (A, el modo por defecto): descubre, prueba y revisa capturas; cubre cada ruta declarada o alcanzable, cada elemento no destructivo, cada modal alcanzable, 4 tamaños de pantalla, consola y red, flujos críticos y chequeos seguros de crear y borrar con prefijo `VAL_`, con un ledger de cobertura sin huecos.
- Smoke (B): rutas y flujos clave o cambiados, 2 tamaños de pantalla, con muestreo permitido.
- Completo (C): `--full` equivale a `--mode exhaustive`; suma superficies solo de código, métodos de backend, formularios, CRUD con `VAL_`, sondas de roles y seguridad, accesibilidad, rendimiento y regresión visual.
- Interactivo (D): antes de descubrir, te pregunta backend, modo de cobertura y modo de autenticación.
- Fresh (E): archiva o reemplaza el estado anterior y arranca desde el descubrimiento.
- Retomar (F): continúa una corrida incompleta desde la fase guardada.
- Todos guardan estado en `test-manifest/validation-state.json` y arman un reporte HTML.

## Qué no hace

- No arregla ni cambia el código de la app.
- Los modos estándar y completo SÍ crean y borran datos de prueba con prefijo `VAL_`: no son de solo lectura. El texto no dice si smoke escribe datos.
- No reemplaza la auditoría, ni el ciclo de battle-test.
- Un login sin credenciales no cuenta como ruta pasada: la corrida queda bloqueada.
- Smoke nunca se etiqueta como `FULLY VALIDATED`.

## Combinaciones de flags de `/validation`

| Combinación | Estado | Respaldo |
| --- | --- | --- |
| `--full --fresh` | válida: la usa battle-test | `skills/battle-test/references/stages.md:52` |
| `--mode smoke --fresh` | válida: la usa battle-test | `skills/battle-test/references/stages.md:44` |
| `--full` con `--mode` | no definido: `--full` es alias de `--mode exhaustive` | `skills/validation/SKILL.md:59` |
| `--fresh` con `--resume` | no definido: el router describe cada uno por separado | `skills/validation/SKILL.md:138-139` |
| `--interactive` con `--mode` | no definido: `--interactive` pregunta el modo | `skills/validation/SKILL.md:65-69` |

## Bloque A: estándar

```
1. Chequeo previo: Abrí el SKILL.md instalado de validation y confirmá que existe el modo standard como modo por defecto de /validation. Si no existe, pará y decímelo.
2. Objetivo y alcance: Validar en navegador real <ruta del proyecto> sobre <URL local o de staging>, con foco en <pantallas o flujo>. Credenciales por variables de entorno que ya tengo cargadas, nunca escritas en archivos. Usá la app que ya está corriendo en esa URL; si no responde, pará y avisame en lugar de levantar otra cosa.
3. Comando: /validation <URL local o de staging>
4. Límites: Prohibido: modificar el código de la app, escribir credenciales en config, estado, reportes o logs, ejecutar acciones destructivas o crear datos fuera del prefijo VAL_, marcar como pasada la pantalla de login. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: este modo crea y borra datos VAL_, así que si la URL o la base de datos son de producción, pará y avisame. No integres a main. No hagas commits. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Entregá el bloque "=== VALIDATION COMPLETE ===" (backend, modo, cobertura, rutas, elementos, flujos, CRUD/API, capturas revisadas, issues, ruta del reporte y del estado) y los principales problemas. Para dar la corrida por completa tiene que haber coverageComplete true, cero sin contabilizar, assert-coverage.js y certify-validation.js con exit 0; un resultado fallido bloquea la certificación aunque esté contabilizado. incomplete no es failed y no lo traduzcas a un veredicto limpio. Sin credenciales en una app con login: bloqueada, no pasada. El texto no define un veredicto positivo para este modo: no inventes uno.
```

## Bloque B: smoke

```
1. Chequeo previo: Abrí el SKILL.md instalado de validation y confirmá que existe el modo smoke. Si no existe, pará y decímelo.
2. Objetivo y alcance: Confianza rápida sobre <ruta del proyecto> en <URL local o de staging>, solo en las rutas y flujos clave o cambiados: <pantallas o flujo>. Credenciales por variables de entorno que ya tengo cargadas. Usá la app que ya está corriendo; si no responde, pará y avisame.
3. Comando: /validation --mode smoke --fresh <URL local o de staging>
4. Límites: Prohibido: modificar el código de la app, escribir credenciales en archivos, ejecutar acciones destructivas, marcar como pasada la pantalla de login. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL o la base de datos son de producción, pará y avisame. No integres a main. No hagas commits. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Entregá el bloque "=== VALIDATION COMPLETE ===" y el veredicto SMOKE VERIFIED solo si smokeScopeComplete es true; nunca lo llames FULLY VALIDATED. Sin credenciales en una app con login: bloqueada, no pasada. Si hubo recorte por --max-routes o --max-elements, la corrida es incomplete.
```

## Bloque C: completo (exhaustive)

```
1. Chequeo previo: Abrí el SKILL.md instalado de validation y confirmá que existe --full y que dice que es un alias de --mode exhaustive. Si no existe, pará y decímelo.
2. Objetivo y alcance: Validación de profundidad de release de <ruta del proyecto> sobre <URL local o de staging>, todas las rutas; foco en <pantallas o flujo>. Credenciales por variables de entorno, un rol por vez, nunca en archivos. Usá la app que ya está corriendo; si no responde, pará y avisame.
3. Comando: /validation --full --fresh <URL local o de staging>
4. Límites: Prohibido: modificar el código de la app, escribir credenciales en config, estado, reportes o logs, crear o borrar datos fuera del prefijo VAL_, omitir un elemento sin dejarlo en el ledger como probado, salteado con motivo o en cuarentena. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: este modo corre sondas de seguridad y crea y borra datos VAL_, así que si la URL o la base de datos son de producción, pará y avisame. No integres a main. No hagas commits. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Entregá el bloque "=== VALIDATION COMPLETE ===" y los principales problemas. Para dar la corrida por completa tiene que haber coverageComplete true, cero sin contabilizar, assert-coverage.js y certify-validation.js con exit 0. Un resultado fallido bloquea la certificación; incomplete no es failed ni un veredicto limpio. El texto no define un veredicto positivo para este modo: no inventes uno. Si es la validación de un lanzamiento, agregá como línea del checklist una pasada en un teléfono real a cargo mío.
```

## Bloque D: interactivo

```
1. Chequeo previo: Abrí el SKILL.md instalado de validation y confirmá que existe --interactive. Si no existe, pará y decímelo.
2. Objetivo y alcance: Validar <ruta del proyecto> sobre <URL local o de staging>, foco en <pantallas o flujo>. Preguntame backend, modo de cobertura y modo de autenticación antes de descubrir; yo respondo con la herramienta de preguntas. Credenciales solo por variables de entorno que ya tengo cargadas.
3. Comando: /validation --interactive
4. Límites: Prohibido: modificar el código de la app, escribir credenciales en archivos, ejecutar acciones destructivas fuera del prefijo VAL_, arrancar con respuestas que yo no di. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL o la base de datos son de producción, pará y avisame. No integres a main. No hagas commits. No desplegues. Si no tenés herramienta para preguntar, pará.
6. Cierre: Entregá el bloque "=== VALIDATION COMPLETE ===" con el modo que elegí y los principales problemas. Si elegí smoke, el veredicto es SMOKE VERIFIED solo con smokeScopeComplete true y nunca FULLY VALIDATED. Para los otros modos aplica lo mismo que en el bloque A: cobertura completa, cero sin contabilizar y los dos scripts de certificación con exit 0; el texto no define un veredicto positivo.
```

## Bloque E: empezar de cero

```
1. Chequeo previo: Abrí el SKILL.md instalado de validation y confirmá que existe --fresh. Si no existe, pará y decímelo.
2. Objetivo y alcance: Descartar el estado anterior de <ruta del proyecto> y validar de nuevo sobre <URL local o de staging>, foco en <pantallas o flujo>, en el modo estándar. Credenciales por variables de entorno que ya tengo cargadas. Usá la app que ya está corriendo; si no responde, pará y avisame.
3. Comando: /validation --fresh <URL local o de staging>
4. Límites: Prohibido: modificar el código de la app, escribir credenciales en archivos, ejecutar acciones destructivas o crear datos fuera del prefijo VAL_. Archivá o reemplazá el estado anterior solo como lo hace la skill; no borres nada más. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL o la base de datos son de producción, pará y avisame. No integres a main. No hagas commits. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Igual que el bloque A: el bloque "=== VALIDATION COMPLETE ===", cobertura completa con cero sin contabilizar, los dos scripts de certificación con exit 0 y los principales problemas. Sin credenciales en una app con login: bloqueada, no pasada.
```

## Bloque F: retomar

```
1. Chequeo previo: Abrí el SKILL.md instalado de validation y confirmá que existe --resume. Si no existe, pará y decímelo. Después fijate si <ruta del proyecto>/test-manifest/validation-state.json existe y está in_progress o incomplete; si no, pará y decímelo.
2. Objetivo y alcance: Continuar la validación incompleta de <ruta del proyecto> sobre <URL local o de staging> desde la fase guardada, foco en <pantallas o flujo>. Usá la app que ya está corriendo; si no responde o cambió de build, pará y avisame. Credenciales por variables de entorno que ya tengo cargadas.
3. Comando: /validation --resume
4. Límites: Prohibido: reiniciar desde cero, reutilizar un resultado verde de otro build, modificar el código de la app, escribir credenciales en archivos, ejecutar acciones destructivas o crear datos fuera del prefijo VAL_. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL o la base de datos son de producción, pará y avisame. No integres a main. No hagas commits. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Entregá el bloque "=== VALIDATION COMPLETE ===" y los principales problemas, con cobertura completa, cero sin contabilizar y los dos scripts de certificación con exit 0, o decí exactamente qué falta. El texto no define un veredicto positivo para estos modos.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `/validation` | `skills/validation/SKILL.md:18` | Forma sin argumentos |
| `/validation http://localhost:3000` | `skills/validation/SKILL.md:19` | Forma con URL |
| `/validation --full` | `skills/validation/SKILL.md:22` | Forma publicada de `--full` |
| `/validation --interactive` | `skills/validation/SKILL.md:23` | Forma publicada |
| `/validation --fresh` | `skills/validation/SKILL.md:24` | Forma publicada |
| `/validation --resume` | `skills/validation/SKILL.md:25` | Forma publicada |
| `Plain + /validation + standard` | `skills/validation/SKILL.md:28` | Sin flags corre el ciclo estándar |
| `ask for the URL` | `skills/validation/SKILL.md:30` | Sin URL: detecta un servidor o la pide |
| `use + --resume + only to continue an incomplete run` | `skills/validation/SKILL.md:31` | `--resume` es solo para continuar una corrida incompleta |
| `blocked` | `skills/validation/SKILL.md:41` | Login sin credenciales: bloqueada, no pasada |
| `test-manifest/validation-state.json` | `skills/validation/SKILL.md:43` | Estado |
| `validation-{timestamp}.html` | `skills/validation/SKILL.md:44` | Reporte HTML |
| `SMOKE VERIFIED` | `skills/validation/SKILL.md:50` | Veredicto de smoke; nunca FULLY VALIDATED |
| `VAL_ + create/delete checks` | `skills/validation/SKILL.md:51` | Estándar: chequeos seguros de crear y borrar con prefijo VAL_ |
| `VAL_ + scoped CRUD` | `skills/validation/SKILL.md:52` | Exhaustive: CRUD con prefijo VAL_ |
| `skipped-with-reason` | `skills/validation/SKILL.md:56` | Cada ítem queda probado, salteado con motivo o en cuarentena |
| `alias for + --mode exhaustive` | `skills/validation/SKILL.md:59` | `--full` es alias de `--mode exhaustive` |
| `--max-routes + incomplete` | `skills/validation/SKILL.md:59-60` | Recortar fuerza `incomplete` |
| `If + --interactive` | `skills/validation/SKILL.md:65` | Pregunta backend, modo y autenticación |
| `If + --fresh` | `skills/validation/SKILL.md:138` | Archiva o reemplaza el estado anterior |
| `If + --resume` | `skills/validation/SKILL.md:139` | Retoma desde `session.currentPhase` |
| `never silently reuses a green result` | `skills/validation/SKILL.md:140-141` | No reutiliza un verde de otro build |
| `smokeScopeComplete:true` | `skills/validation/SKILL.md:178` | Condición de smoke |
| `assert-coverage.js` | `skills/validation/SKILL.md:176` | Exit 0 requerido en standard y exhaustive |
| `certify-validation.js` | `skills/validation/SKILL.md:176-177` | Exit 0 requerido |
| `A failed result blocks certification` | `skills/validation/SKILL.md:177` | Un fallo bloquea aunque esté contabilizado |
| `LAUNCH` | `skills/validation/SKILL.md:180` | Pasada en teléfono real como línea del checklist |
| `Never translate it to a clean verdict` | `skills/validation/SKILL.md:191` | `incomplete` no es `failed` ni limpio |
| `=== VALIDATION COMPLETE ===` | `skills/validation/SKILL.md:198` | Bloque de cierre |
| `VALIDATION_EMAIL` | `skills/validation/references/auth.md:44` | Credenciales por variables de entorno |
| `Credentials never go into config` | `skills/validation/references/auth.md:40` | Nunca en config, estado, reportes ni logs |

## No definido en el texto

- Un veredicto positivo para los modos estándar y completo: el texto solo da `SMOKE VERIFIED` para smoke; `FULLY VALIDATED` aparece únicamente como lo que smoke nunca puede decir. Por eso los bloques piden el bloque de cierre y las condiciones, no una etiqueta.
- Si smoke crea o borra datos: el texto no lo aclara.
- `--fresh` con `--resume`, `--full` con `--mode`, `--interactive` con otros flags: no definidos (tabla de arriba).
- Cómo `/validation` limita la corrida a unas pantallas: lo declarado es `--max-routes` y `--max-elements`, y recortar fuerza `incomplete`. Por eso el foco va en el alcance, no como filtro.
- `/validation` puede levantar el servidor del repo si es inequívoco (línea 29); los bloques piden lo contrario por prudencia.
