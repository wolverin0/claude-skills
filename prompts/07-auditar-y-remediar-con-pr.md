# 07 - Auditar y remediar con PR (`/audit-remediate`), y auditar solo (`/audit`)

Comandos: `/audit-remediate --scope=<subcarpeta> --max-rounds=<N>` (bloque A) y `/audit --scope=<subcarpeta>` (bloque B)

> `/audit-remediate` crea una rama y abre un PR; abrir un PR implica publicar esa rama en tu repositorio remoto. No mergea ni toca main, pero sí deja algo publicado.
> Si solo querés el diagnóstico, usá el bloque B.

## Cuándo usarlo

Bloque A: querés que la auditoría, los arreglos y la re-auditoría corran solos en una rama y que el resultado llegue como un PR para que lo revises.
Bloque B: querés solo el informe de auditoría, de solo lectura, sin arreglos.

## Qué hace

Bloque A (`/audit-remediate`):
- Lee `--scope` (por defecto `.`) y `--max-rounds` (por defecto 4) y toma la fecha como sello.
- Te pide confirmar en una línea que va a crear una rama y abrir un PR.
- Lanza el workflow: audita en paralelo, arregla en serie en la rama con verificación por arreglo, re-audita hasta verde o hasta agotar rondas o presupuesto, y abre el PR.
- Devuelve el estado, las rondas, los hallazgos que quedan, los bloqueados, la rama, la URL del PR y la lista "HUMAN ACTION REQUIRED".

Bloque B (`/audit`):
- Carga `audit-orchestrator` y recorre las fases: método, hard stops, caza de firmas Tambon, puntos ciegos, 13 auditorías de dominio y el cierre con la autoverificación.
- Escribe un único `audit-report.md` en la raíz del proyecto con el censo de severidad, uno de los cinco veredictos exactos y el plan de remediación por fases.
- Tarda unos 40 a 70 minutos sobre el repo completo, 10 a 20 con un solo subárbol.

## Qué no hace

- `/audit-remediate`: no mergea, no toca main, no hace force push, no debilita ni borra tests para ponerlos en verde, no resuelve lo que solo podés hacer vos (rotar una clave, activar RLS, pagar un plan, migrar datos).
- `/audit`: no modifica código fuente; no arregla nada.
- Ninguno despliega.

## Bloque A: auditar, arreglar y abrir PR

```
1. Chequeo previo: Confirmá que está instalado el comando /audit-remediate y que el workflow audit-remediate está disponible (el comando lo lanza como Workflow, por ruta de script o por nombre). Si falta cualquiera de los dos, pará y decímelo.
2. Objetivo y alcance: Auditar <ruta del proyecto>, arreglar los hallazgos en una rama propia con verificación por arreglo, re-auditar y abrir un PR para que lo revise yo. Subcarpeta: <subcarpeta del proyecto, o . para todo>. Máximo de rondas: <N, por defecto 4>. Trabajá desde <ruta del proyecto>; si no estás parado ahí, pará y decímelo. Pantallas o flujo que me importan: <pantallas o flujo>; el alcance real lo fija --scope. Si el proyecto necesita app en marcha para verificar, usá <URL local o de staging>.
3. Comando: /audit-remediate --scope=<subcarpeta del proyecto, o . para todo> --max-rounds=<N, por defecto 4>
4. Límites: Prohibido: mergear el PR, tocar main, hacer force push, debilitar o borrar un test para que pase, desplegar, rotar secretos, hacer migraciones, tocar datos que no sean de prueba, arreglar fuera de <subcarpeta del proyecto>. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra código y datos locales o de staging, nunca contra producción: si el .env o la base de datos apuntan a producción, pará y avisame. Cuando pidas la confirmación de una línea sobre la rama y el PR, esperá mi sí; este prompt no cuenta como respuesta. No mergees ni integres a main. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Pasame el resumen del workflow tal como vuelve: estado (green, partial, rounds-exhausted o budget-exhausted), rondas, hallazgos restantes, cantidad de bloqueados, nombre de la rama y URL del PR. Poné primero y bien visible la lista HUMAN ACTION REQUIRED. Aclarame que el PR queda abierto para mi revisión y que no se mergeó nada.
```

## Bloque B: auditar sin arreglar

```
1. Chequeo previo: Confirmá que están instalados el comando /audit y la skill audit-orchestrator, y que el comando acepta --scope. Si falta algo, pará y decímelo.
2. Objetivo y alcance: Auditoría de solo lectura de <ruta del proyecto>. Subcarpeta: <subcarpeta del proyecto>. Trabajá desde <ruta del proyecto>; si no estás parado ahí, pará y decímelo. Foco que más me importa: <pantallas o flujo>; la auditoría igual cubre todo el alcance. Si la skill necesita una app en marcha: <URL local o de staging>.
3. Comando: /audit --scope=<subcarpeta del proyecto>
4. Límites: Prohibido: modificar código fuente, hacer commits, arreglar hallazgos, saltear la fase de hard stops, suavizar el veredicto, escribir el informe sin correr las auditorías de dominio. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo lectura sobre <subcarpeta del proyecto>; si hace falta app, solo local o staging, nunca producción. No integres a main. No hagas push. No desplegues. Si el alcance es ambiguo y no tenés herramienta para preguntar, pará. No cites el valor de ningún secreto que encuentres: nombrá el lugar.
6. Cierre: Entregá audit-report.md en la raíz del proyecto, con el AUDIT VERDICT en uno de sus cinco textos exactos y todos los hallazgos con ruta:línea, y la señal final tal como salió: [AUDIT COMPLETE: all 7 rules attested, all 13 domains covered] o [AUDIT TRUNCATED: <reason>]. Si algún dominio quedó truncado, no emitas COMPLETE. Si ya existía un audit-report.md, que quede renombrado como previo.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `Never merges, never touches main` | `commands/audit-remediate.md:3` | Nunca mergea ni toca main |
| `opens a PR` | `commands/audit-remediate.md:3` | Abre un PR |
| `--scope=<path>` | `commands/audit-remediate.md:19` | Argumento de alcance, por defecto `.` |
| `--max-rounds=<N>` | `commands/audit-remediate.md:19` | Máximo de rondas, por defecto 4 |
| `date +%Y%m%d` | `commands/audit-remediate.md:21` | Sello de fecha |
| `Confirm with the user in ONE line` | `commands/audit-remediate.md:22` | Confirmación de una línea antes de lanzar |
| `Workflow({ name: "audit-remediate"` | `commands/audit-remediate.md:33` | También se puede lanzar por nombre |
| `rounds-exhausted` | `commands/audit-remediate.md:36` | Estados del resumen: green, partial, rounds-exhausted, budget-exhausted |
| `HUMAN ACTION REQUIRED` | `commands/audit-remediate.md:37` | Lista que se muestra de forma destacada |
| `never merges; never force-pushes` | `commands/audit-remediate.md:43` | Garantía |
| `never weakened or deleted` | `commands/audit-remediate.md:46` | No se debilita ni se borra un test |
| `--scope=<relative path>` | `commands/audit.md:34` | Alcance de `/audit` |
| `--priority-domains=<comma-separated 1-13>` | `commands/audit.md:35` | Dominios a auditar |
| `--resume-from=<N>` | `commands/audit.md:36` | Retomar una auditoría truncada |
| `confirms scope with a single short question` | `commands/audit.md:38` | Sin argumentos, hace una pregunta de alcance |
| `40-70 minutes` | `commands/audit.md:42` | Tiempo del repo completo |
| `audit-report.md` | `commands/audit.md:22` | Un solo informe en la raíz del proyecto |
| `Do NOT modify any source code` | `commands/audit.md:66` | Solo lectura |
| `Do NOT skip Phase B` | `commands/audit.md:69` | La fase de hard stops siempre corre |
| `Do NOT soften the verdict` | `commands/audit.md:70` | No se suaviza el veredicto |
| `Do NOT produce a report without running the domain skills` | `commands/audit.md:67` | No se escribe el informe sin correr los dominios |
| `AUDIT COMPLETE: all 7 rules attested, all 13 domains covered` | `skills/audit/audit-orchestrator/SKILL.md:243` | Señal de fin completa |
| `AUDIT TRUNCATED: <reason>` | `skills/audit/audit-orchestrator/SKILL.md:244` | Señal de corte |
| `Emitting + AUDIT COMPLETE + if any domain truncated` | `skills/audit/audit-orchestrator/SKILL.md:304` | No se emite COMPLETE si un dominio quedó truncado |
| `🟢 ACCEPTABLE — routine cleanup; no launch-blockers` | `skills/audit/references/audit-triage-rubric.md:56` | Último de los cinco veredictos (lista completa en el caso 04) |

## No definido en el texto

- Contra qué rama base abre el PR `/audit-remediate`: el texto dice solo que nunca toca main.
- Cómo se retoma `/audit-remediate`: la línea de garantías dice "resumable" pero no da el comando. En `/audit` sí existe `--resume-from=<N>`.
- Si `--priority-domains` o `--resume-from` aplican a `/audit-remediate`: sus argumentos publicados son solo `--scope` y `--max-rounds`.
- `commands/audit.md` es inconsistente consigo mismo: la línea 3 lista dos argumentos permitidos y el cuerpo (líneas 34 a 36) lista tres.
- El workflow `audit-remediate` no viene en este repo: el comando lo nombra pero hay que instalarlo aparte; por eso el chequeo previo lo exige.
- Si `/audit` usa una app en marcha: el texto lo describe como una lectura del código; por eso el bloque B solo menciona la URL por si la skill la pide, y solo local o staging.
