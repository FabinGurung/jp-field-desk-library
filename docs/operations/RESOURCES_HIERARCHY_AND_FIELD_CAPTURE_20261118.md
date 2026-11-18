# A7/A9 Resources — Project & Field Capture Renovation, 18 November 2026

## Source inventory and verified gaps

**Canonical project directory:** [Projects and Locations — v1.3](https://docs.google.com/spreadsheets/d/1JqzjBNBCT_AAIBkuGsIR5VBOJ3_HyifdPDc7K_jF5Bo/edit), `projects`, has 29 public canonical project IDs `PRJ-000001`–`PRJ-000029`; `PRJ-000030` is a retired alias to Basanti's `PRJ-000029` and is *not* a second active project. The current Resource Library verified document catalogue is narrower: 10 admitted project records, 74 source links, six Basanti packet PDFs, three company groups including one JP Enterprise Astam feasibility intake `JPENT-ASTAM-2026-01`. Do not infer an approved architectural/structural PDF/DWG for projects without admitted files.

**Project presentation:** The separate `projects-directory.json` is derived from the canonical project's `Is Public=TRUE` rows where authenticated service-account access exists. When it does not, a named dated snapshot of 29 source-observed public projects is used, and publication provenance explicitly says it is **not a live reader**. All original Drive links come only from `Project Resources — LIVE` readback; *no* private folders, coordinates, legal identities, new CAD assets, approvals or guessed links are disclosed or generated.

## What already exists in Google Drive (reuse rather than create)

| Subject | Original working source | Source tab / status |
|---|---|---|
| Fishtail material movements | [Fishtail Materials Inventory LIVE V000004](https://docs.google.com/spreadsheets/d/1YshLrDAJDg3CO8F1jmIr2Eucy0-TKwiviVNF5tiAfT0/edit) | `materials_inventory`; 13 historical OPC/PPC consumption events |
| Rohini material movements | [Rohini Materials Inventory LIVE V000004](https://docs.google.com/spreadsheets/d/1GQQDRg3bDPVIrfs1oVm_ycmyBE5NlpxEKzu1DsAz6tk/edit) | `materials_inventory`; 3 historical consumption events |
| Shared material naming | [Materials v1.1](https://docs.google.com/spreadsheets/d/10D96YqZn6NbbSm6X6nsPVw4tG_IELIj957uZ2DmhJZs/edit) | `materials_master`; source units unverified for some materials |
| Site material stock | [Unused template V000004](https://docs.google.com/spreadsheets/d/1J0c-usE3jUubT_hCTxxklHzyVBzxoFZaJtCsuG3toWA/edit) | `project_material_inventory`; headers only, **NOT** an authoritative stock balance |
| Daily Fishtail work | [Fishtail Site Operations LIVE](https://docs.google.com/spreadsheets/d/1-pE1d4uxytIZsKF8Tzu3eBDlXL4MLIYiGGvVoKMqo1k/edit) | `2_OPS_DAILY_PROGRESS` and `3_OPS_DAILY_READINESS` |
| Daily Rohini work | [Rohini Site Operations LIVE](https://docs.google.com/spreadsheets/d/1agDIiVfTwicWAxix07HaukX7EemNdO4IyghYcBH_kys/edit) | Same stage-separated work/readiness tabs |
| Measurement evidence | [Fishtail Work Measurement Evidence — Review V000002](https://docs.google.com/spreadsheets/d/1NvvOD7UUDAvWVnGOC33q2MOy3h6ZDoD1Y2es9l3dpiY/edit) | 1,156 source entries pending semantic review; blank quantity is NOT zero |
| Attendance | [Manpower Team Attendance v2.7](https://docs.google.com/spreadsheets/d/1FuFvccGvDwlszfzGL7_TP4qChBptA8Pil7eq6O5qlPw/edit) | Site tabs Narayani and Bishal, 23 roster members; blank means UNRECORDED |
| Project work | [Project Work v1.1](https://docs.google.com/spreadsheets/d/17YPRpaXIdHloH5-lzsjUpNvXLbsDfrIrlsn2jZ-7KKc/edit) | `project_work_items` (3 verified source rows before current edits) |
| Finance | JP Cost Estimation V000007 owner map | Vendor Bills, Contractor Bills, Payments to Projects, BOQ/AOC/calculation/reconciliation stay there |
| Notifications | Notification Center Sheets in Site Operations | Decisions and derived reviewed notifications; no unreviewed source-to-notification claim |

## Field recording contract — one event per row

1. **Project:** choose canonical `Project ID`, preserving company and site semantics.
2. **Material received:** record delivery separately, with date/time, item, unit, movement identity, challan or receipt and source evidence. A purchase or vendor bill alone does not prove actual receipt.
3. **Material issued / consumed / returned / adjusted:** record actual observations as separate movement events in the existing owning inventory, with source and reviewer. Do not call an order "consumption".
4. **Work executed:** record date, project, activity, real status and source evidence in `2_OPS_DAILY_PROGRESS`. Plan/readiness is recorded separately in `3_OPS_DAILY_READINESS`.
5. **Measured quantity:** record original observed quantity and location in the Work Measurement Evidence review source; independent verification/certification is needed before acceptance as a bill quantity.
6. **Attendance:** record at the project source tab. Blank/unknown is not absence or zero man-days. Keep personal rows restricted.
7. **Financial processing:** reconciliation, invoicing, payment and BOQ/AOC are governed by the Estimation original financial working Sheets. Field retains source scans/proof and links to owner views.

No usable available-stock value can be asserted until opening stock, actual receipts, returns, transfers, consumption, corrections and dates/units reconcile. The existing inventories contain consumption history, *not* independently verified stock balances.

## Notification and downstream processing — architecture, not a live integration claim

```
Drive original working Sheets / source evidence
   ↓ approved scoped reader + identity + source dates
GitHub Actions: source authorization, schema, dedupe, provenance, redaction
   ↓ valid public-safe accepted JSON projection
 ├─ Field & Desk Resources: source links + non-personal reviewed summaries
 ├─ JP Site Operations: daily project progress + materials status (only when admitted)
 ├─ Notification Center: outstanding tasks with original link, owner and closure evidence
 ├─ Skyforge Scheduling: approved consumption/output rates and resource capacity
 └─ JP Cost Estimation: financial quantity, rate, vendor/contractor/project payments
```

An ordinary Sheet edit does not yet trigger all downstream repositories. WIF-based permissions, deterministic source grain, per-subject projection contracts, privacy reviews, test fixtures, freshness policies, authenticated deploy and final served-JSON readback must be added *before* automated material/attendance forwarding. Do not introduce an unreviewed cron, claim notifications are already generated, or mirror personal attendance on public Pages.

## Pages and Actions hierarchy

**Primary pages**: `projects.html` → `index.html` (reviewed drawing/files) → `field.html` (eight ordered chapters) → `memory-wall/index.html` (35 original Sheet cards).
**Supporting pages**: `money.html`, `operations.html`, `editing.html`, `resources/project-documents.html`, `feasibility/index.html` and buyer guide, `system-map.html`.
**Compatibility and internal**: `workspaces.html`, not-promoted `site/resources/working-drawings.html`, old data snapshots, .github and migration receipts. Keep backward-compatible links.

**Main workflow** `resource-library-pages.yml`: unit/syntax/test → desktop/mobile browser QA → authenticated read-only source publisher → public-safety artifact validation → Pages deploy → scheduled deploy assertion and historical release-tag gates. Additional independent workflows `a9-gated-preview-qa.yml`, `a9-provider-inventory-qa.yml`, `a9-history-transfer-qa.yml`, `a9-history-transfer.yml` are for archival/provider QA and not routine page content editing.

Keep original files and history. Hide redundant primary routes. Preserve Git tags/commits rather than copying historical repository trees into Drive merely to save memory. A7 PRE/POST and private Drive originals cannot be replaced by git history.

## Next integration requirements (not implemented by this page redesign)

- Validate read-only WIF permissions to the project, inventory, progress, measurement and attendance source books independently.
- Review privacy of original employee attendance, material delivery/vendor fields and site financial evidence; publish *no* private record rows by default.
- Define a common project/material/activity event contract, update ownership and publication flags in existing source governance, not by blindly restructuring the user-edited Sheets.
- Build reviewed derived readers and cross-repository consumers in their respective GitHub Actions after source acceptance and QA.
- For projects without registered originals, scope and verify Drive project source folders before adding an approved readback row. Do not transfer or publish a restricted file automatically.
