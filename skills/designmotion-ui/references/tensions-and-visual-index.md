# Documented Tensions & Visual Reference Index (`@designmotionhq`)

All 11 contradictions/discrepancies observed in the `@designmotionhq` corpus are preserved explicitly—never silently pick both sides on the same project.

---

## 1. Corpus Tensions & Discrepancies (11)

| # | Topic | Side A | Side B / C | Source IDs |
| --- | --- | --- | --- | --- |
| 1 | **Submit disabled vs. live** | Disable submit until valid (`form:has(:invalid)`) or explain why disabled below (`"Name your workspace first"`). | Never disable submit: keep active/focusable, validate on click, light fields & focus first error. | `DX84_9QKwCF`, `DXEXGAwDAWQ`, `DfemaTCBncA` vs `DbvCsRetjhR` |
| 2 | **Disabled button contrast** | Disabled buttons & logos are exempt from WCAG contrast minimums. | Gray-on-gray fails legibility too; enforce `4.5:1` there as well. | `DfuDHh3h14c` vs `DbvCsRetjhR` |
| 3 | **Density vs. white space** | Airy cards: `28–40px` padding, `16–22px` gap, `1.6` leading, `28px` icon gap. | Linear precision: `13px` text, `32px` rows, `4px` grid, high density. | `DUKBLjHCsS8`, `DWCB3g6DPfi` vs `DdLvXSsNLpr` |
| 4 | **Shadows & dark mode** | Tinted double shadow (`8%`), dark mode drops shadows for stepped surfaces + `1px` top border. | Neutral `rgb(0 0 0 /.12+.08)` with negative `spread` (`-2/-4/-8px`) vs colored multi-layer glow + 3D perspective. | `DfzMvRXBaPr`, `DctFPo-tTQO` vs `De33jSIkUtH` vs `DWRLx9zsJnx`, `DUQqwPBDLhL` |
| 5 | **Motion overshoot** | Springs with overshoot (`0.95 -> 1.05`, `stiffness 180 / damping 20`), `250ms` in / `150ms` out / `500–800ms + bounce`. | Dry Linear motion: `80ms` hover, `<=150ms` max, `0 overshoot`. | `DUy5XFaDHqZ`, `DUoZ4_GDMWp`, `DYAEELCKCp1` vs `DdLvXSsNLpr` |
| 6 | **Type/spacing scales & measure** | `4px` base vs `8px` base vs `1.618` golden (`8,13,21,34,55px`); `1.2` (`60ch`, `+0.06em`) vs `1.25` (`50ch`, `+0.05em`) vs `1.618` (`68/42/26/16`); `400/600` vs `400/700` vs `800/400/300`. | — | `DVC2fsoiEFC`, `DXCMEljsw3w`, `DW87CGQDKbY`, `DfjxqzkCrUI`, `DfRucYFjrac`, `Ddd04e2tQWx`, `DfPJo9UBJ7D`, `DVw9eAhCocG` |
| 7 | **Optical centering numbers** | Play shift `+8%` bbox; circle `×1.13`; button text nudge `+2px`. | Play shift `w / 6` (`≈+16.7%`); circle `+11%` (`20/18`); `em` nudge (`.05em`, *"never px"*). | `DVqncGUjLec` vs `De_s4pZCuJk` |
| 8 | **Tooltip hover delay** | `300ms` delay for general informative tooltips. | `500ms` delay for shortcut-teaching tooltips. | `DXoUdH2t8Id` vs `DebjCwWlDJT` |
| 9 | **Nested corner visual bug** | Voiceover & formula: `inner = outer - padding` (and `- border`). | `DfmTDE1B6uX` `frame_04.png` visually printed `Outer 11 / Inner 13 / Padding 16` (graphic typo). | `DVqncGUjLec`, `Dcx__07t8e5`, `DetqvE0kU8P` vs `DfmTDE1B6uX` |
| 10 | **Table->card breakpoint** | `@container (max-width: 700px)`. | Viewport `<640px`. | `Dc8RfGzNPCN` vs `Deq_kvJBI3g` |
| 11 | **Voiceover vs slide text** | `DWCB3g6DPfi` says `32px/16px` while slide renders `40px/22px`; `DXyrs2YN9iS` says `-40%` clicks while slide cites NNG 2018 `-56% engagement`. | — | `DWCB3g6DPfi`, `DXyrs2YN9iS` |

---

## 2. Visual Before/After Pairs Index (89 rules)

If the local `designmotionhq/referencias/` pack is available in the workspace, each rule slug maps 1:1 to `<category>-<rule>-antes.png` and `<category>-<rule>-despues.png`:

- **`layout-espaciado` (20):** `espaciado-cards` (`DUKBLjHCsS8`), `ley-proximidad` (`DWHMCjKDKea`), `tokens-design-system` (`DVC2fsoiEFC`), `proporcion-aurea` (`DW87CGQDKbY`), `grilla-12-columnas` (`DWUDebQs6B0`), `border-radius` (`Dcx__07t8e5`), `correcciones-opticas` (`DVqncGUjLec`), `contencion-cards` (`Dc-4jNbtyJg`), `densidad-linear` (`DdLvXSsNLpr`), `paneles-redimensionables` (`DcGQMxYNjxh`), `css-has` (`DdGkqx_t3vH`), `css-nativo-moderno` (`DW8147gjNon`), `sistema-iconos` (`DfJ_9qyCmq3`), `blindaje-texto-real` (`DbgqEnahoz6`), `mobile-375` (`Deq_kvJBI3g`), `tablas-datos` (`Dc3KFOaNfnW`), `chat-ui` (`DdWFVgYNYRB`), `calendario-semanal` (`DdbOcQ9tpKW`), `avatares` (`DcikWR-NQPT`), `fintech-balance` (`DfhRMYRKn8p`).
- **`tipografia` (2):** `sistema-tipografico` (`Ddd04e2tQWx`), `numeros-tabulares-tiempo` (`DcYX_cxNfOA`).
- **`color` (6):** `regla-60-30-10-acento` (`DUJ5D2SCmDv`), `paleta-oklch` (`DaAWS2btQac`), `gradientes-oklch` (`Dfo5hiMh_e-`), `dark-mode-superficies` (`DctFPo-tTQO`), `sombras-elevacion` (`DfzMvRXBaPr`), `glassmorphism` (`DVdixdNjGhC`).
- **`motion-animacion` (4):** `easing-spring` (`DUDy5gNDBVM`), `duraciones-por-rol` (`DYAEELCKCp1`), `modales-fisicos` (`DUy5XFaDHqZ`), `view-transitions` (`Dd8tUtdhVYZ`).
- **`microinteracciones` (15):** `skeleton-y-carga` (`DfZczSUBFdg`), `optimistic-ui-limites` (`DaclzgJNUeQ`), `presencia-colaboracion` (`DbAsaXANvpq`), `toasts-notificaciones` (`DXRpZTTMr9a`), `undo-friccion-destructiva` (`Dam5kJONlIN`), `estados-de-exito` (`DdtNKkqNu5q`), `copy-to-clipboard` (`DcS6-2ltaLc`), `cta-conversion` (`DUQqwPBDLhL`), `drag-drop-kanban` (`Dd3nH-NNkR3`), `gestos-moviles` (`DasD0mctu1m`), `grabacion-voz` (`DeY-H8hDDRk`), `rating-estrellas` (`DZHt9j8t1vW`), `badges-notificacion` (`Dcnuc60NbeO`), `seleccion-multiple` (`Db0M74jtjQS`), `tooltips` (`DXoUdH2t8Id`).
- **`formularios` (15):** `estados-input-y-labels` (`DeJlOw2ho-y`), `validacion-onblur-errores` (`DaPx5yytc9Q`), `botones-doble-envio` (`DfemaTCBncA`), `wizard-multipaso` (`DYzSokhRAXG`), `autoguardado-offline` (`DbQJvWxty4v`), `controles-seleccion` (`DeQLuJ0KxqY`), `dropdowns` (`DXd50_jNsAf`), `sliders` (`DZUtKvIqrHo`), `date-range-picker` (`DYed0IGNeF3`), `file-upload` (`DZ2Dp5wt0pJ`), `tarjetas-credito` (`DZZ5y8cNZiE`), `otp-input` (`DZmkBhghnD8`), `passwords` (`DZ7NPPItOoJ`), `prompt-ia` (`Deh4XHEqzX_`), `edicion-inline` (`DbIaxSzNg97`).
- **`navegacion` (12):** `arquitectura-nav` (`DXyrs2YN9iS`), `command-palette` (`DZruKB6N1X0`), `tabs-horizontales` (`DYj367uNQlW`), `filter-chips` (`DZfDbWdNTU5`), `menus-contextuales` (`DaxPFk9tOuy`), `sheets-vs-modales` (`DeCPyOTqzqh`), `tree-views` (`DejRN2Oh3p0`), `busqueda-autocompletado` (`DYZfCfKhOId`), `paginacion-scroll` (`DZxM_QoNZ0n`), `settings-ux` (`DbX0IKMtBKr`), `atajos-teclado` (`DebjCwWlDJT`), `breadcrumbs` (`Degse6ngixY`).
- **`accesibilidad` (3):** `contraste-wcag` (`DfuDHh3h14c`), `targets-fitts-touch` (`DV84QvajG4R`), `foco-teclado-skip` (`DahwAvbhOmx`).
- **`visualizacion-datos` (2):** `graficos-honestos` (`DZM5K5otAGy`), `kpi-rows` (`Deoa1KZiqp2`).
- **`onboarding-empty-states` (3):** `empty-states` (`DXMgbFOsjFu`), `onboarding-funcional` (`De1Swx4hE8W`), `permisos-just-in-time` (`DewJMeuBL_s`).
- **`conversion-pricing` (4):** `pricing-psicologia` (`Ddi_Dt3NDT6`), `checkout-stripe` (`DeT0na6D8X8`), `billing-zonas` (`DfCRoE7hGsv`), `landing-anti-slop` (`DdQ7QwqNLiY`).
- **`etica-psicologia-ux` (2):** `anti-dark-patterns` (`DUJIy7pDNW7`), `psicologia-memoria-ux` (`DYUA2atNd01`).
- **`flujo-herramientas` (1):** `flujo-spec-design-md` (`DbLMlT3q8NA`).
