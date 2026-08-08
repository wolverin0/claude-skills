# Checklist Design dataset reference

## Provenance

- Publisher: Checklist Design Pty Ltd / Checklist Design
- Creator shown by the site: George Hatzis
- Public site: https://www.checklist.design
- Public index API: https://www.checklist.design/api/checklists/grouped
- Public detail API: https://www.checklist.design/api/checklists/by-slug
- Robots policy observed at capture time: public crawling allowed, with admin/login/plugin paths excluded
- Captured: see `source.scraped_at_utc` in `checklists.json`
- Content hash: see `source.content_sha256`

The publisher's `/terms` route returned 404 at capture time, so no redistribution license is assumed. Use this snapshot internally for product/design audits, preserve attribution and canonical URLs, and do not re-host inspiration images. Image assets remain remote URLs and should be loaded only when needed for an audit.

## Snapshot coverage

- 5 categories
- 110 checklists
- 637 standard criteria
- 66 flow-step criteria
- 703 total auditable items
- 30 inspiration images across 15 checklists
- 70 design-system documentation images
- 66 flow-step reference images

Category counts:

- Website: 23
- Web app: 26
- Design system: 28
- Mobile app: 20
- Flows: 13

## Schema

Top level:

- `schema_version`
- `source`: provenance, freshness and content hash
- `categories`: category metadata and live index counts
- `checklists`: normalized checklist records
- `counts`: aggregate completeness metrics
- `validation`: local validation result

Each checklist includes:

- canonical identity: `id`, `name`, `slug`, `category`
- source metadata: `source_url`, `source_api_url`, description, icon and collections
- `criteria`: normal checklist items with title, description and optional source suggestion
- `resources`: typed `inspiration`, `documentation` or `flow_step` image records
- `inspiration`: convenience subset of resources
- `related`: related checklist links
- `same_name_other_platforms`: cross-platform variants

Flows intentionally have no normal `criteria`; their `flow_step` resources are the auditable sequence.

## Refresh

From the skill directory:

```bash
python3 scripts/scrape_checklist_design.py \
  --output references/checklists.json \
  --delay 0.20
```

Use `--expected-count 110` only to reproduce this exact snapshot. Omit it for future refreshes so legitimate additions are accepted while index/detail parity and uniqueness are still validated.

After refreshing, run:

```bash
python3 scripts/checklist_audit.py stats
python3 scripts/checklist_audit.py inventory \
  --app-name "Refresh smoke test" \
  --format json \
  --output /tmp/checklist-design-inventory.json
```
