# 10 - Solo capturas (`visual-route-sweep`)

Comando: `$visual-route-sweep <URL>` (forma publicada; sin `--fix`)

## Cuándo usarlo

Querés ver cómo se ve cada ruta segura de la app en claro y oscuro, en escritorio, tableta y celular, con las fallas de pantalla y de consola detectadas.
Es solo la parte visual: no corre seguridad, CRUD ni arquitectura.

## Qué hace

- Registra el SHA del repo, la imagen o revisión en marcha, la URL, el método de autenticación, los roles, los temas y los tamaños.
- Inventaría las rutas del runtime y los links del mismo origen; clasifica cada ruta como probada, no visual, destructiva, superada, dinámica sin resolver o en cuarentena, con motivo.
- Se autentica antes de las rutas protegidas.
- Captura pantalla visible y página completa de cada ruta segura en escritorio, tableta y celular, en claro y oscuro.
- Registra estado HTTP, URL final, errores de consola y de página, requests fallidos, ancho del documento y hallazgos de responsive.
- Revisa cada captura de verdad (genera una hoja de contactos, pero captura no es revisión).
- Escribe un ledger de rutas que solo se agrega y un reporte JSON y HTML con las rutas dinámicas sin resolver.

## Qué no hace

- Sin `--fix` no remedia nada: no toca el código.
- No despliega.
- No cubre seguridad, CRUD, integridad de datos ni el ciclo completo de battle-test.
- No inventa registros para las rutas dinámicas.

## Prompt para copiar

```
1. Chequeo previo: Abrí el SKILL.md instalado de visual-route-sweep y confirmá que existe la forma "$visual-route-sweep <url>" y que --fix es un flag aparte. Confirmá también que está instalada la skill validation junto a esta, porque el barrido usa su script responsive-audit.js. Si falta algo, o si tu agente no reconoce el $, pará y decímelo.
2. Objetivo y alcance: Barrido visual de <ruta del proyecto> sobre <URL local o de staging>. El barrido inventaría todas las rutas seguras; al final destacá en el resumen lo que corresponda a <pantallas o flujo>. Autenticación solo por variables de entorno o por un estado de navegador guardado que ya tengo; si faltan, pará y avisame.
3. Comando: $visual-route-sweep <URL local o de staging>
4. Límites: Prohibido: usar --fix, modificar código, ejecutar acciones destructivas, inventar registros o IDs para rutas dinámicas, usar una pantalla de login, de error o en blanco como prueba. Lo que encuentres fuera de alcance va en una lista al final, sin arreglarlo.
5. Lado conservador: Solo contra <URL local o de staging>, nunca contra producción: si la URL apunta a producción, pará y avisame. No integres a main. No hagas commits ni push. No desplegues. Si necesitás preguntarme algo y no tenés herramienta para preguntar, pará.
6. Cierre: Entregá el ledger de rutas, el reporte JSON y HTML con las rutas de evidencia y las rutas dinámicas sin resolver. El único veredicto que define la skill es VISUAL ROUTE SWEEP GREEN y exige cero errores del navegador propios de la app, cero rutas seguras sin contabilizar, cero hallazgos responsive altos y la revisión de capturas completa sobre el build exacto. Si no se cumple, decí exactamente qué falta y no uses GREEN. GREEN nunca significa seguridad, CRUD, integridad de datos ni battle-test completo.
```

## Respaldo en el texto publicado

| Token | Archivo:línea | Qué respalda |
| --- | --- | --- |
| `$visual-route-sweep <url>` | `skills/visual-route-sweep/SKILL.md:13` | Forma publicada de invocación |
| `$visual-route-sweep <url> --fix` | `skills/visual-route-sweep/SKILL.md:14` | Con remediación (este caso no la usa) |
| `--resume` | `skills/visual-route-sweep/SKILL.md:15` | Retomar |
| `--fix` + `does not authorize` | `skills/visual-route-sweep/SKILL.md:18-19` | `--fix` autoriza remediar y no el despliegue |
| `environment + saved browser state` | `skills/visual-route-sweep/SKILL.md:19-20` | Credenciales por variables de entorno o estado de navegador guardado |
| `Record repository SHA` | `skills/visual-route-sweep/SKILL.md:24` | Paso 1 |
| `Inventory runtime routes` | `skills/visual-route-sweep/SKILL.md:25` | Paso 2: inventario y clasificación |
| `Authenticate before protected routes` | `skills/visual-route-sweep/SKILL.md:27` | Paso 3 |
| `responsive-audit.js` | `skills/visual-route-sweep/SKILL.md:32` | Usa un script de la skill validation |
| `do not equate capture` | `skills/visual-route-sweep/SKILL.md:35-36` | Captura no es revisión |
| `With + --fix + isolated worktree` | `skills/visual-route-sweep/SKILL.md:37` | La remediación solo existe con `--fix` |
| `Never fabricate representative records` | `skills/visual-route-sweep/SKILL.md:40` | No inventar registros |
| `append-only route ledger` | `skills/visual-route-sweep/SKILL.md:39` | Ledger y reporte |
| `VISUAL ROUTE SWEEP GREEN` | `skills/visual-route-sweep/SKILL.md:46` | El veredicto más fuerte |
| `never means security, CRUD` | `skills/visual-route-sweep/SKILL.md:48` | Alcance del veredicto |
| `Every discovered GET route must be one of` | `skills/visual-route-sweep/references/coverage-contract.md:13` | Clasificación de rutas |
| `A coverage cap makes the run incomplete` | `skills/visual-route-sweep/references/coverage-contract.md:15` | Recortar la cobertura deja la corrida incompleta |
| `delegate to` | `skills/validation/SKILL.md:35` | Para solo capturas, validation delega en esta skill |

## No definido en el texto

- Un veredicto distinto de `VISUAL ROUTE SWEEP GREEN`: el texto nombra solo el más fuerte y no define uno de falla.
- Cómo limitar el barrido a unas rutas: el contrato inventaría todas y un tope de cobertura deja la corrida incompleta; por eso las pantallas del alcance solo se destacan en el resumen.
- Dónde se escriben el ledger y el reporte: el texto dice qué se escribe, no la ruta.
- La invocación con barra o sin `$` en agentes que no usan `$`: el texto publica solo la forma con `$`; el prompt pide parar si no se reconoce.
- `--fix` con `--resume`: no se menciona.
