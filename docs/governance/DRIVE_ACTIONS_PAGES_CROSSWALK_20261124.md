# Desk Resources — source-to-publication crosswalk (24 November 2026)

Checkpoint: main 5ea69331f99e4437c8f222ebc5ee199d1f3e2184, 23 November 2026. This is a public-safe routing and evidence record, not a duplicate editable register or permission grant.

## Current source paths

The signed-in Desk Resources source library is registered in the JP Drive Explorer. Its six immediate areas are Project Resource and File Registers; Fishtail Project Folder Template and Shared Standards; Document Engineering and Templates; and the three company/project original galleries. The former Field Work Material and Attendance Registers folder is empty and outside this active root. Original custody is different from publisher ownership.

| Source / authority | Reader and target | Status |
| --- | --- | --- |
| Project Resources LIVE, project_resources (gid 8000011) | scripts/publish_library.py -> catalog.json -> Desk Resources | Direct authenticated read; approved rows only |
| Same workbook, client_document_packets (gid 8230001) | scripts/publish_library.py -> document-packets.json -> project document viewer | Direct authenticated read; approved rows only |
| Same workbook, resource_source_readback (gid 8230002) | scripts/publish_library.py -> joins and validates the previous two outputs | Stored source receipts, NOT a fresh Drive API file check |
| A7 Projects and Locations, projects (gid 1131378788) | scripts/publish_project_directory.py -> projects-directory.json -> All Projects | Authenticated double read when accessible; explicit dated fallback otherwise |
| Project Source References, project_source_links (gid 567690616) | Human reference register | No direct reader in current Desk publisher |
| Fishtail project folder template/shared standards | Human reference and source-folder organization | No direct Docs reader |
| Document Engineering and Templates | Human-controlled original/reusable source library | No direct Docs reader; no public private branding, agreements or extracted evidence |
| Fishtail/Rohini/JP Enterprise company project originals | Reviewed resource IDs/links via Project Resources | Permission-gated or approved public links only, not recursive ingestion |
| Astam feasibility and buyer guide | Curated static public-safe JSON/HTML in site/feasibility and site/ops/data/land-feasibility | Dated Git snapshot, not a live Drive workbook import; legal status UNVERIFIED |
| Source gallery | .github/source-gallery/install.py and source-gallery.js | Three curated navigation cards, not a recursive Drive sync |
| Historical Payment, working field records and financial calculations | JP Cost Estimation; old field.html and money.html redirect | Not Desk publisher inputs |
| Operations status/map, Drawing Coordination source models, Structural calculations and Scheduling engine | Respective domain owners | No automatic cross-repository ingestion here |

The permanent workbook links already approved in the website are [Project Resources](https://docs.google.com/spreadsheets/d/1e019Jac4lDveZ2glXMph4RLHivqPFEachbcNi-R1DZk/edit) and [Projects and Locations](https://docs.google.com/spreadsheets/d/1JqzjBNBCT_AAIBkuGsIR5VBOJ3_HyifdPDc7K_jF5Bo/edit). Source IDs and permissions are unchanged. Do not add restricted descendant IDs, evidence text, worker records, private cadastral information or approval documents to public Git.

## Verified production evidence

[Run 45259794184](https://github.com/FabinGurung/jp-field-desk-library/actions/runs/45259794184), scheduled 23 November 20:28 UTC (24 November NPT): WIF authentication, authoritative resource read, artifact QA, gallery installation, Pages deployment and scheduled-refresh assertion all passed. Project job logs report 74 resources, 6 packets, 10 catalogue projects, 3 companies and 29 canonical directory entries; gallery installed on 9 routes. [Run 45156452784](https://github.com/FabinGurung/jp-field-desk-library/actions/runs/45156452784) also passed desktop/mobile synthetic browser QA. These counts do not establish a new Drive-file revision check or a successful A7 live read. Current workflow uses spreadsheets.readonly, not Docs or Drive API scope. The project directory job historically does not log the actual fallback mode; a 29-row count alone is ambiguous. Direct independent public HTTP readback was unavailable during this audit.

## Discrepancies and open checks

- README present-tense Payment description was stale after Field migration; distinguish historical release notes from current ownership.
- The project-directory JSON already encodes source mode, but the public provenance text did not surface it. Make the existing status paragraph report actual build mode, and log it in Actions. Unknown/missing mode must fail artifact validation.
- Resource receipts prove the recorded source link/admission checks; not the latest original revision, actual construction approval, or current access of every reader. Publication metadata explicitly sets original_drive_files_rechecked and source_revision_proven false.
- Project identity source has separate permissions; do not assume Desk WIF access merely from successful catalogue publishing. Preserve dated fallback and never widen access without owner review.
- Template and company original subtrees contain private and other-domain evidence. A bounded inventory is not exhaustive: deeper project folders and excluded historical/intake trees need further source-level review. A listing is not a content audit.
- Source-gallery installation follows base artifact validation. Its current three configured cards are curated; future gallery changes need explicit post-install link QA.
- The public Drive Explorer is a separate navigation product; its live served state was not independently confirmed here. Do not equate registry links with ingestion.

## Operating contract

Edit source content in its original Google Sheet or Doc. Add reviewed publication entries to the existing catalogue with stable identity and appropriate admission evidence. Retain original Drive ACLs, exact source IDs and PRE/POST records; never copy or make private records public for a successful build. GitHub owns code, tests, schemas and stable templates; Actions owns validation and generated projections. Keep routine content updates out of HTML and generated JSON. No source movement or new permission grants were made by this audit. A source change does not establish a fresh deployment until Actions succeeds and the published output is independently checked.
