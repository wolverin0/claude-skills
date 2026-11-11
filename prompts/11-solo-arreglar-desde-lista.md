# 11 - Solo arreglar desde una lista (`quality-loop --staged --from-tracks`)

Comando: `/quality-loop --staged --from-tracks`

> Nunca uses `quality-loop` sin `--staged`: sin ese flag su comportamiento por defecto es empujar los lotes verdes a main.
> Este archivo no tiene ningún prompt sin `--staged`.

## Cuándo usarlo

Ya tenés una lista de trabajo lista en `TRACKS.md` (sección AUTO) y querés que se arregle ítem por ítem, con commits en una rama aparte, sin volver a auditar ni empujar nada.
La lista la armás vos o sale de otra corrida (por ejemplo, el diagnóstico de `/battle-test`).

## Qué hace

- Trabaja en un worktree aislado y crea la rama `loop/<proyecto>` en la base que le indiques.
- Usa `TRACKS.md` tal como está, sin correr `/audit` (eso fuerza `--from-tracks`).
- Toma un ítem AUTO por vez en orden fijo: seguridad, prod-readiness, deps/CVEs, tests/cobertura, código muerto, rendimiento, a11y, ux, docs. No reordena.
- Hace el diff más chico y pasa el gate de verificación antes de cada commit; commitea solo las rutas `owns=` del ítem.
- Los ítems con `ac=` quedan en `[~]` esperando su criterio: el gate de build y tests no prueba UX.
- Lo que necesita una persona (secreto, ticket de soporte, cambio de plan, rotación de claves, decisión de producto, aprobación de deploy) va a GATED y a `gated.json`, sin ejecutarlo.
- Al terminar escribe `quality-loop-state.json` y la línea final de cierre.

## Qué no hace

- Con `--staged` no empuja a main ni a ningún lado: commitea a la rama loop y se detiene.
- No despliega: eso siempre queda GATED.
- No audita: con `--from-tracks` no corre `/audit`.
- No actúa sobre los ítems GATED.
- No define qué hacer si `TRACKS.md` no existe con `--from-tracks`.

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de quality-loop y confirmá que existen --staged ("commit to loop branch, DO NOT push") y --from-tracks ("never run /audit"). Si no existen, pará y decímelo. Después confirmá que TRACKS.md existe en la raíz del worktree de abajo; si no existe, pará: el texto no define --from-tracks sin TRACKS.md.
2. Objetivo y alcance: Arreglar los ítems AUTO de TRACKS.md de <ruta del proyecto>, uno por vez, en este worktree ya creado: <ruta del worktree>, parado en la base <SHA base>. Usá ese árbol y esa base, creá la rama loop/<proyecto> adentro y no hagas tu propio setup. Si en el árbol falta el .env, no lo copies de ningún lado: pará y avisame. Si necesitás levantar la app para probar un ítem, es <URL local o de staging>. Foco: ítems que toquen <pantallas o flujo>; el resto de AUTO también se hace en su orden.
3. Comando: /quality-loop --staged --from-tracks
4. Límites: Prohibido: hacer push de cualquier rama, correr /audit, reordenar las prioridades, agrandar un ítem, tocar rutas que no estén en el owns= del ítem, commitear TRACKS.md o gated.json, actuar sobre los ítems GATED, desplegar, rotar secretos, hacer reset --hard contra main. Diffs mínimos, sin reescrituras. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo con configuración local o de staging, nunca contra producción: antes de correr el gate, fijate que el .env del árbol apunte a local o staging; si apunta a producción, pará y avisame. No integres a main. No desplegues: queda GATED. Un gate rojo bloquea el commit: arreglá o revertí, nunca avances a ciegas. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Escribí quality-loop-state.json en la raíz del worktree (status, fixed, gated, commitRange, gateStatus, pushedToMain) y gated.json junto a TRACKS.md. La última línea es [QUALITY-LOOP COMPLETE: fixed=N gated=M gate=green commits=<base>..<head> pushed=false]. Tiene que decir pushed=false; si dijera true, es un error y avisame. Los ítems con ac= que quedaron en [~] van listados en el último checkpoint. El loop no tiene un veredicto propio: lo que se informa es gateStatus (green o red) y el rango de commits.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `--staged` | `skills/quality-loop/SKILL.md:15` | "commit to loop branch, DO NOT push" |
| `--from-tracks` | `skills/quality-loop/SKILL.md:16` | "never run /audit; work the existing pre-seeded TRACKS.md as-is" |
| `Default (no flag) = standalone auto-push` | `skills/quality-loop/SKILL.md:18` | Sin `--staged` empuja a main |
| `hands you a worktree and base` | `skills/quality-loop/SKILL.md:23` | Usa el árbol y la base que le dan y salta su propio setup |
| `Missing + .env + Copy it first` | `skills/quality-loop/SKILL.md:123` | Sin .env el build falla (la skill dice copiarlo; el prompt pide parar) |
| `do NOT run` | `skills/quality-loop/SKILL.md:38` | Con TRACKS.md existente, no corre `/audit` |
| `makes this mandatory` | `skills/quality-loop/SKILL.md:41` | `--from-tracks` lo hace obligatorio |
| `TRACKS.md` | `skills/quality-loop/SKILL.md:45` | Vive en la raíz del worktree |
| `do not reorder` | `skills/quality-loop/SKILL.md:52` | Orden fijo |
| `security → prod-readiness → deps/CVEs → tests/coverage → dead-code → perf → a11y → ux → docs` | `skills/quality-loop/SKILL.md:53` | Orden de prioridad |
| `staging only that item's` | `skills/quality-loop/SKILL.md:63` | Commitea solo las rutas `owns=` |
| `awaiting ac` | `skills/quality-loop/SKILL.md:67-68` | Los ítems con `ac=` quedan en `[~]` |
| `npm ci` | `skills/quality-loop/SKILL.md:76` | El gate de verificación |
| `A red gate blocks the commit` | `skills/quality-loop/SKILL.md:82` | Un gate rojo bloquea el commit |
| `STOP THERE` | `skills/quality-loop/SKILL.md:89` | Staged: no empuja a main |
| `Deploying is ALWAYS gated` | `skills/quality-loop/SKILL.md:92` | Deploy siempre GATED |
| `Gated items — surface, never act` | `skills/quality-loop/SKILL.md:94` | Lo gateado se anota, no se ejecuta |
| `gated.json` | `skills/quality-loop/SKILL.md:96` | Espejo de la cola GATED |
| `quality-loop-state.json` | `skills/quality-loop/SKILL.md:105` | Archivo de estado en la raíz del worktree |
| `pushedToMain` | `skills/quality-loop/SKILL.md:111` | Campo del estado |
| `QUALITY-LOOP COMPLETE` | `skills/quality-loop/SKILL.md:115` | Línea final con el campo `pushed` en true o false |
| `git reset --hard` | `skills/quality-loop/SKILL.md:121` | `reset --hard` contra main está bloqueado por guardrail |
| `--staged --from-tracks` | `skills/battle-test/references/stages.md:107` | battle-test la invoca siempre con los dos flags juntos |
| `without + --staged + its default` | `skills/battle-test/references/stages.md:108` | Sin `--staged` el default es empujar los lotes verdes a main |

## No definido en el texto

- `--from-tracks` sin un `TRACKS.md` existente: el texto no lo cubre; el prompt se detiene.
- Cómo recibe el worktree y la base una persona: el texto lo describe para un orquestador padre ("If the parent orchestrator hands you a worktree and base, use them"); el prompt le da ese rol a quien lo pega.
- Una ruta de proyecto junto a los flags: el texto muestra una forma con ruta y las formas con flag por separado, no combinadas.
- El gate usa `npm`, `tsc` y la config de lint del proyecto: para otro stack el texto no define el gate.
- `--no-push` es alias de `--staged` y se podría usar; este archivo usa `--staged` en todos lados para no mezclar.
