# Field & Desk — Full Repository, Pages, Actions and Drive Hierarchy
**Verified 18 November 2026. Back-office reference.**

## 1. Repository code and published website

```
FabinGurung/jp-field-desk-library
├── .github/workflows/                       [GitHub Actions instructions]
│   ├── resource-library-pages.yml           [main test + source reader + Pages publisher]
│   ├── a9-gated-preview-qa.yml              [historic preview safety checks]
│   ├── a9-provider-inventory-qa.yml         [historic provider inventory integrity]
│   ├── a9-history-transfer-qa.yml           [history transfer test]
│   └── a9-history-transfer.yml              [manual historical Git transfer]
├── site/                                    [public Pages source]
│   ├── index.html / app.js                  [Desk PDF/DWG/models project file browser]
│   ├── projects.html / projects.js          [all public project names, file categories]
│   ├── field.html / field-payments.js       [materials/work/attendance links + historical payment view]
│   ├── memory-wall/index.html              [35 original employee Sheet links]
│   ├── resources/project-documents.html    [six original Basanti A/B/C packet links]
│   ├── money.html / money.js                [finance and original worker records guide]
│   ├── operations.html / operations.js      [where source families are kept]
│   ├── editing.html                         [plain-language file update guide]
│   ├── system-map.html                      [plain-language explanation of the library]
│   ├── feasibility/index.html              [Astam land research]
│   ├── feasibility/buyer-guide/index.html  [Astam buying guide]
│   ├── workspaces.html                     [older compatible navigation]
│   ├── projects-register.baseline.json     [dated 29-public-project index fallback]
│   ├── source-custody.json                  [public-safe source-status data]
│   ├── assets/                              [styles, SVG assets]
│   └── resources/working-drawings.html     [legacy source route, not default published]
├── scripts/                                 [build and QA logic; not public-facing HTML]
│   ├── sheets_read.py                       [Google Sheets read-only double read]
│   ├── publish_library.py                   [file/folder link and client packet publisher]
│   ├── publish_project_directory.py         [public project names, explicit date fallback]
│   ├── publish_field_payments.py            [historical payments publisher]
│   ├── validate_public_artifact.py          [published schema/URL/privacy checks]
│   ├── build_browser_fixture.py             [synthetic demo records, not private records]
│   ├── browser_qa.cjs                       [Chromium desktop/mobile navigation]
│   └── test_*.py                            [source/finance/project regression tests]
├── docs/
│   ├── governance/                         [full file inventory, source-policy and this tree]
│   ├── operations/                         [source routing, finance and field-work plans]
│   └── releases/                           [v1.0.0 → v2.0.0 release evidence]
├── migration/
│   ├── audit/                              [history transfer records, error recovery]
│   ├── provider-snapshots/                 [historic GitHub Actions run metadata]
│   └── scripts/                            [guarded history transfer]
└── README.md                               [repository overview]
```

The **published** `_site/` contains only files copied to the allowlist from `site/` plus generated JSON output such as `catalog.json`, `document-packets.json`, `projects-directory.json` and `field-payments.json`. The website does **not** store project PDF, DWG, SKP or EDB binaries. These remain linked Google Drive originals.

## 2. What the five Actions workflow YAML files do

`.yml` = YAML, a text configuration format. GitHub Actions interprets these files as **automation recipes**. They are not tables, databases, source PDFs or drawings. A workflow file contains triggers, jobs, individual steps, permissions, required credentials and pass/fail checks.

| File | When it runs | What it does | Without it |
| --- | --- | --- | --- |
| `resource-library-pages.yml` | Relevant pull requests, main pushes, hourly (minute 37 UTC), or manual dispatch | Code tests, Chromium browser QA, Google identity/Sheets read-only source read, safe file-link checks, generates JSON, deploys Pages, release checks | Last deployed static website may remain available but would not receive automated updated Sheet content or safe releases |
| `a9-gated-preview-qa.yml` | Changes to pinned historical preview controls | Checks bounded legacy sample without changing original drawings | Historical preview integrity would not be tested automatically |
| `a9-provider-inventory-qa.yml` | Changes to saved provider snapshot evidence | Checks archived GitHub Actions provider metadata | Snapshot errors could go unnoticed; already stored history remains |
| `a9-history-transfer-qa.yml` | Changes to controlled migration scripts | Tests safe Git history import code | Changes to migration procedure would lack its specific safety tests |
| `a9-history-transfer.yml` | Explicit manual dispatch only | Audit prior Git refs and optionally import with exact confirmation/permissions; writes sanitized 30-day log artifact | No automated/manual helper to import legacy references; existing refs/files remain intact |

### Main workflow job sequence
```
Event: push / pull request / 37 min past each UTC hour / manually
   ├─ test (JavaScript syntax; Python tests; synthetic published file)
   ├─ browser-qa (Chromium desktop & mobile; skipped on scheduled checks)
   ├─ project  (main branch only; after QA)
   │   ├─ Google Workload Identity Federation (no long-lived service-key file)
   │   ├─ project_resources + client_document_packets + source readback
   │   ├─ historical CLEAN Payment register
   │   ├─ canonical Projects master when scoped reader permission allows
   │   ├─ source URL ↔ file ID ↔ file type ↔ owner-entered check-age gate
   │   ├─ build public-safe file metadata and page links
   │   └─ validate and upload generated site
   ├─ deploy (GitHub Pages: only a successful source build)
   ├─ scheduled-refresh-assert (scheduled runs only)
   └─ conditional release v1.3.x – v2.0.0 tag gates (when respective note changed)
```
The public site's GitHub source and generated public JSON **remain inspectable**; hiding database-like IDs and source notes in the rendered HTML does **not** make source URLs/private IDs secret. To truly hide private source identifiers or attachments, one needs a permission-controlled backend and private storage or an authenticated API; Google Drive existing access restrictions continue to govern its original files.

## 3. Google Drive — actual A9 hierarchy (observed via Drive)

```
01_JP (main Drive root)
├── 00 Colab Notebooks
├── 01 Useful References
├── 02 Website Sheets and Registers
│   └── 01 Website Source Sheets — Edit Here
│       ├── Project Resources — LIVE — V000002 [the owning document source]
│       │   ├── project_resources [74 published file/folder links]
│       │   ├── client_document_packets [six Basanti packet PDFs]
│       │   ├── resource_source_readback [owner-entered Drive metadata]
│       │   └── instruction/manifest/version-history tabs
│       ├── Projects and Locations [29 public project identities]
│       ├── Fishtail & Rohini Materials Inventory workbooks
│       ├── Fishtail & Rohini Site Operations workbooks
│       ├── Manpower Team Attendance, people, contacts and work lists
│       └── Skyforge scheduling/quantity reference folder
├── 03 Fishtail Builders
│   └── individual construction project folders and original files
├── 04 Rohini Engineering and Builders
│   └── individual project and drawing folders
├── 05 Office and Site Records
│   └── project references and source file collections
├── 06 Notification Center — Original Messages
├── 07 JP Enterprise
│   └── Astam project land source folders
├── 08 Paila Pilates
└── 99 Archive Gallery
    └── 02 Sheets Previous Versions
        └── Version History — Project Resources [11 snapshots observed]
```
A9 original files are **distributed across company/project-specific Drive folders** and are not all underneath one “Resources” folder. The seven 14 Nov received-copy folders and their 19 filenames, every registered resource link by project and six original client PDFs are listed in the accompanying [file inventory](./RESOURCE_FILE_INVENTORY_AND_DRIVE_CUSTODY_20261118.md). Technical Drive IDs, source links and duplicate proof are recorded there for back-office review.

## 4. Drawing/source categories in Desk

Company → Project → Drawing group:
```
Drawing files
├── Architectural PDF
├── Architectural DWG
├── Structural PDF
├── Structural DWG
├── Other drawing types
Models & analysis
├── ETABS E2K
├── ETABS EDB
├── SketchUp SKP
└── Other models
Reports & references
├── Soil / geotechnical
├── MEP / sanitary
├── Municipality / permit
└── Other reports
Estimates & calculations
├── Cost estimates / BOQ
└── Structural calculations
Original file folders
Client A / B / C packets
Other source files
```
**“No files listed”** means no original linked in the existing published register, not proof that the project file does not exist in the external Drive, earlier revisions, or archive. **All currently admitted drawing files are not certified as approved construction issues.**

## 5. Copied, duplicate and old files

- [Release v1.8.1, 14 Nov 2026](https://github.com/FabinGurung/jp-field-desk-library/blob/main/docs/releases/v1.8.1.md) reports 19 complete-size-matched project copies from Construction Sites to the seven A9 folders, not delete/move of the external originals. One same-name Sabitri SKP duplicate was not re-copied to that new intake group.
- [Sabitri ingest manifest](https://docs.google.com/spreadsheets/d/1mKUioeHE-BuHyyc8qFxkNONJX5kpBsHg4P2tRN1jSbo/edit) from Sep 2026 separately proves 26 original files and 26 snapshots/copies, with SHA256 equality for only four targeted SKP/XLSX duplicate candidates; old ETABS V20 report preserved beside V21 report candidate. **This proof does not transfer to the 19 Nov copies.**
- Basanti B's 21-page original PDF is one physical file linked as architecture, structure and sanitary; not three downloaded files.
- The source-book native history remains intact, including 14 November import PRE and POST and 16 November Astam PRE and POST.
- “FINAL”, “REVISED”, file creation date or identical file size is **not sufficient** to select a current construction-issue revision. Require title-block/version comparison, engineer issue evidence and preferably checksum-match of source and destination, document by document.
- [CAD identity correction issue #146](https://github.com/FabinGurung/jp-drawing-coordination/issues/146) separately records the Basanti / Ramachandra reference collision; never conflate their drawing originals.

## 6. Privacy and frontend language

The public Pages user interface should say “Project”, “Original filename”, “Open PDF/DWG”, “Check the latest approved issue”, “Google Drive”, “File not listed yet”, “Last updated”, and “How to edit.” A person using the website should not need to see raw database primary keys, technical source-tab names, checked-on metadata, workflow JSON terms or historical QA discussions.

Maintain all stable identifiers and source reconciliations in original controlled Sheets, GitHub publisher code and versioned governance documentation, but understand that a public GitHub repo and Pages-generated JSON are still inspectable by any website visitor; backend document placement in this **public** repo does not itself provide secrecy. No original source Sheets or file/folder access roles should be altered merely to simplify display.
