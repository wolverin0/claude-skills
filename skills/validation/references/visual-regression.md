# Visual Regression

Measured responsiveness proves a layout is *currently* usable; visual regression proves a change
didn't *break* it. `scripts/visual-regression.js` screenshots each route × breakpoint, stores a
baseline, and on later runs pixel-diffs against the baseline and flags layouts that changed beyond
a threshold — "the fix broke the page" before a human sees it.

It decodes and diffs entirely inside the browser via `<canvas>`, so it needs no native image
libraries — just Playwright + Chrome.

## Workflow

1. **Establish baseline** (first run, or right after an *intended* UI change):

   ```bash
   node path/to/scripts/visual-regression.js --url http://localhost:5173/ \
     --config validation.config.json --update --channel chrome
   ```

   Writes `<out>/baseline/[role/]<route>-<breakpoint>.png`.

2. **Compare** (later runs — e.g. the `/battle-test` re-validate stage after fixes):

   ```bash
   node path/to/scripts/visual-regression.js --url http://localhost:5173/ \
     --config validation.config.json --storage-state test-manifest/auth/admin-state.json \
     --threshold 0.2 --channel chrome
   ```

   Captures current shots to `<out>/visual/`, diffs vs baseline, and reports per route+breakpoint:
   `pct` (percent of pixels changed), `regression` (over threshold or dimensions changed), and the
   `bbox` of the changed region. Exit 1 if any regression **or expected baseline is missing**, 0
   otherwise. Compare mode never creates a baseline.

## Options

| Flag | Meaning |
| --- | --- |
| `--update` | Write/refresh baselines instead of comparing (use after intended changes). |
| `--threshold <pct>` | Percent of changed pixels that counts as a regression. Default `0.2`. |
| `--tol <0-255>` | Per-channel color tolerance to absorb anti-aliasing noise. Default `12`. |
| `--storage-state <file>` | Run authenticated (per role); baselines are stored under `baseline/<role>/`. |
| `--role <id>` | Namespace baselines/output by role. |
| `--channel chrome` | Browser channel (same resilient launch as the other scripts). |

## Using it well

- Run it **per role** with each role's storage-state — different roles see different UI.
- Baselines are intentional state: commit them (or store under `test-manifest/baseline/`) so the
  next run compares against the agreed-good layout. When a change is *meant* to alter the UI,
  re-baseline with `--update` and note why.
- A regression is a signal, not always a defect: review the `bbox` and the `current` vs `baseline`
  screenshots before deciding. `sizeChanged: true` (page got taller/wider) is the strongest signal
  of a real layout break.
- An intended visual fix will normally change pixels. Review and approve that changed route, then
  refresh only its baseline after the fixed layout passes semantic and responsive review. Do not
  weaken the global threshold to make an intended change disappear.
- Pair with the responsive audit: responsive-audit says *is this layout valid now*; visual
  regression says *did it change from last time*. Both run at every breakpoint.
