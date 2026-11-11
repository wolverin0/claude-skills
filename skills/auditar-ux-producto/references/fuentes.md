# Fuentes metodológicas, guías de diseño y proyectos de referencia

Este archivo reúne las fuentes en las que se apoya `auditar-ux-producto`, organizadas por su aporte concreto al proceso de auditoría, diseño de interacción, comparación antes/después y documentación en `DESIGN.md`.

---

## 1. Métodos de evaluación de usabilidad y software de trabajo

- **Nielsen Norman Group (NN/g) — Task Analysis: Support Users in Achieving Their Goals**
  - URL: <https://www.nngroup.com/articles/task-analysis/>
  - Aporte: descomponer el trabajo por objetivos reales, entradas, decisiones, pasos e interdependencias antes de rediseñar pantallas.
- **Nielsen Norman Group (NN/g) — Evaluate Interface Learnability with Cognitive Walkthroughs**
  - URL: <https://www.nngroup.com/articles/cognitive-walkthroughs/>
  - Aporte: las cuatro preguntas del recorrido cognitivo para evaluar intención, descubribilidad, claridad de etiqueta y reconocimiento del progreso.
- **Nielsen Norman Group (NN/g) — 10 Usability Heuristics for User Interface Design**
  - URL: <https://www.nngroup.com/articles/ten-usability-heuristics/>
  - Aporte: visibilidad del estado del sistema, correspondencia con el mundo real, control y libertad del usuario, consistencia, prevención y recuperación de errores.
- **Nielsen Norman Group (NN/g) — CASTLE Framework for Workplace Applications UX**
  - URL: <https://www.nngroup.com/articles/castle-framework/>
  - Aporte: evaluación específica de software empresarial y paneles operativos (carga cognitiva, uso de funciones avanzadas, satisfacción, eficiencia en la tarea, aprendizaje y errores).
- **Nielsen Norman Group (NN/g) — 8 Design Guidelines for Complex Applications**
  - URL: <https://www.nngroup.com/articles/complex-application-design/>
  - Aporte: soporte a recorridos no lineales, interrupciones, trabajo en lote, reducción de memoria entre vistas y coordinación entre roles.
- **Nielsen Norman Group (NN/g) — The 3-Click Rule for Navigation Is False**
  - URL: <https://www.nngroup.com/articles/3-click-rule/>
  - Aporte: evitar reglas mecánicas de conteo de clics; priorizar claridad de información, menor esfuerzo cognitivo y preservación del contexto.
- **GOV.UK Service Manual — Using moderated usability testing**
  - URL: <https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing>
  - Aporte: diseño de escenarios de prueba basados en objetivos creíbles sin dictar dónde hacer clic.
- **Nielsen Norman Group (NN/g) — Synthetic Users: If, When, and How to Use AI-Generated "Research" & Synthetic Users vs. Human Respondents (2026)**
  - URLs: <https://www.nngroup.com/articles/synthetic-users/> y <https://www.nngroup.com/articles/synthetic-users-vs-human-respondents/>
  - Aporte: tratar las recorridas de agentes y usuarios sintéticos como hipótesis útiles de inspección temprana, sin presentarlas como evidencia de validación con usuarios humanos.

---

## 2. Patrones de interacción empresarial: contenedores, borradores, errores y notificaciones

- **IBM Carbon Design System — Dialogs & Forms Patterns**
  - URLs: <https://www.carbondesignsystem.com/building-blocks/core/patterns/dialogs> y <https://www.carbondesignsystem.com/building-blocks/core/patterns/forms>
  - Aporte: criterios para elegir entre edición inline, panel lateral, diálogo modal, página dedicada y flujo por pasos; prohibición de reconstruir flujos completos dentro de un modal.
- **IBM Carbon Design System — Notifications Pattern**
  - URL: <https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications>
  - Aporte: clasificación por urgencia, alcance e interrupción (toast transitorio, notificación inline, banner, centro de notificaciones).
- **SAP Fiori Design Guidelines — Situation Handling**
  - URL: <https://www.sap.com/design-system/fiori-design-web/v1-120/discover/sap-products/sap-s4hana-only/situation-handling>
  - Aporte: tratamiento de excepciones operativas en ERP/CRM como situaciones con contexto de negocio, rol responsable, acciones recomendadas y estado de resolución.
- **SAP Fiori Design Guidelines — Draft Handling**
  - URL: <https://www.sap.com/design-system/fiori-design-web/v1-145/foundations/best-practices/global-patterns/object-handling/draft-handling>
  - Aporte: distinción clara entre conservar un borrador de trabajo en curso y confirmar/aplicar cambios sobre una entidad activa del negocio.
- **SAP Fiori Design Guidelines — Notification Center**
  - URL: <https://www.sap.com/design-system/fiori-design-web/v1-145/ui-elements/notification-center>
  - Aporte: agrupación por tipo/prioridad, acciones directas y separación entre lectura y resolución.
- **GOV.UK Design System — Error Summary**
  - URL: <https://design-system.service.gov.uk/components/error-summary/>
  - Aporte: patrón de resumen de errores persistente al inicio del formulario con enlaces directos a cada campo que requiere corrección.
- **W3C WAI — ARIA Authoring Practices Guide (APG): Modal Dialog Pattern**
  - URL: <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>
  - Aporte: contrato de foco inicial, contención de `Tab`, cierre con `Escape`, nombre accesible y devolución del foco al elemento disparador.
- **W3C WAI — Understanding WCAG 2.2 Success Criterion 4.1.3: Status Messages**
  - URL: <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>
  - Aporte: comunicación programática de resultados de búsqueda, confirmaciones y errores dinámicos mediante `role="status"` / `role="alert"` sin robo indebido de foco.

---

## 3. Sistemas de diseño para agentes (`DESIGN.md`), skills analizadas y verificación

- **Google Labs Code / Stitch — `design.md` Specification & Philosophy**
  - URLs: <https://github.com/google-labs-code/design.md>, <https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md>, <https://github.com/google-labs-code/design.md/blob/main/docs/spec.md>
  - Aporte: especificación de `DESIGN.md` combinando tokens estructurados y prosa con intención y reglas operativas persistentes para agentes de código.
- **Design with Intent (`ghaida/intent`)**
  - URLs: <https://github.com/ghaida/intent/blob/main/skills/evaluate/SKILL.md>, <https://github.com/ghaida/intent/blob/main/skills/journey/SKILL.md>, <https://github.com/ghaida/intent/blob/main/skills/organize/SKILL.md>
  - Aporte: evaluación estructurada con protección de lo que ya funciona (`evaluate`), mapeo de recorridos multi-rol y recuperación (`journey`), y arquitectura de información (`organize`).
- **Impeccable (`pbakaus/impeccable`)**
  - URLs: <https://github.com/pbakaus/impeccable/blob/main/.claude/skills/impeccable/SKILL.md>, `reference/critique.md`, `reference/distill.md`, `reference/shape.md`, `reference/document.md`, `reference/live.md`
  - Aporte: operaciones de definición previa (`shape`), crítica de UX (`critique`), simplificación (`distill`), documentación en `DESIGN.md`/`PRODUCT.md` (`document`) y exploración de variantes (`live`/`generate`).
- **uxaudit (`gotalab/uxaudit`)**
  - URL: <https://github.com/gotalab/uxaudit/blob/main/skills/uxaudit/SKILL.md>
  - Aporte: recorrido automatizado de escenarios sobre la aplicación respaldado por capturas y trazas (comprender, decidir, actuar, recuperarse).
- **UI UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`), Emil Design Engineering (`emilkowalski/skills`), Taste Skill (`Leonxlnx/taste-skill`) y Anthropic `frontend-design` (`anthropics/skills`)**
  - URLs:
    - <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md>
    - <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>
    - <https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md>
    - <https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md>
  - Aporte: patrones de componentes, microinteracciones y dirección estética como capas complementarias una vez resueltas las tareas y el flujo de interacción.
- **Microsoft Playwright & Deque `axe-core`**
  - URLs: <https://github.com/microsoft/playwright-mcp> y <https://github.com/dequelabs/axe-core>
  - Aporte: ejecución de flujos en navegador real, capturas multi-viewport, árboles de accesibilidad y auditoría programática de reglas WCAG.
