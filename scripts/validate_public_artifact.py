"""Check the generated GitHub Pages artifact, not just its Python source."""
import argparse
import json
import re
from collections import Counter
from pathlib import Path

DRIVE_FILE = re.compile(r"https://drive\.google\.com/file/d/[A-Za-z0-9_-]+/view")
DRIVE_FOLDER = re.compile(r"https://drive\.google\.com/drive/folders/[A-Za-z0-9_-]+")


def validate(directory):
    directory = Path(directory)
    catalog = json.loads((directory / "catalog.json").read_text(encoding="utf-8"))
    packets = json.loads((directory / "document-packets.json").read_text(encoding="utf-8"))
    directory_index = json.loads((directory / "projects-directory.json").read_text(encoding="utf-8"))
    public_projects = directory_index.get("projects", [])
    pids = [p.get("project_id") for p in public_projects]
    if directory_index.get("publication_method") not in {
        "AUTHENTICATED_DOUBLE_READ__CANONICAL_PROJECTS",
        "AUTHENTICATED_SOURCE_ACCESS_UNVERIFIED__DATED_FALLBACK",
        "DATED_OWNER_REVIEWED_FALLBACK",
    } or not directory_index.get("baseline_reviewed_on"):
        raise ValueError("Missing or unknown project directory source provenance")
    if (directory_index.get("schema_version") != "1.0.0"
            or directory_index.get("no_documents_inferred") is not True
            or len(public_projects) < 29
            or len(set(pids)) != len(pids)
            or "PRJ-000030" in pids
            or any(not re.fullmatch(r"PRJ-[0-9]{6}", pid or "") for pid in pids)):
        raise ValueError("Public canonical project directory source validation failed")

    intake = json.loads((directory / "project-intake.json").read_text(encoding="utf-8"))
    if (set(intake) != {"schema_version", "access", "contents_published", "registered_on", "projects"}
            or intake["schema_version"] != "1.0.0" or intake["access"] != "DRIVE_PERMISSION_REQUIRED"
            or intake["contents_published"] is not False):
        raise ValueError("Invalid intake public boundary")
    eligible = {p["project_id"]:p for p in public_projects} if directory_index["publication_method"] == "AUTHENTICATED_DOUBLE_READ__CANONICAL_PROJECTS" else {}
    for p in catalog["projects"]:
        if p["project_id"] == "JPENT-ASTAM-2026-01" and p["company"] == "JP Enterprise" and p["name"] == "Astam Village — Land Feasibility":
            eligible[p["project_id"]] = p
    intake_ids, intake_urls = set(), set()
    for row in intake["projects"]:
        if (set(row) != {"project_id", "name", "company", "url"} or row["project_id"] not in eligible
                or row["project_id"] in intake_ids or row["url"] in intake_urls
                or not re.fullmatch(r"https://docs\.google\.com/document/d/[A-Za-z0-9_-]{15,100}/edit", row["url"])):
            raise ValueError("Unsafe or duplicate intake public link")
        if any(row[k] != eligible[row["project_id"]][k] for k in ("name", "company")):
            raise ValueError("Intake identity mismatch")
        intake_ids.add(row["project_id"]); intake_urls.add(row["url"])
    person_intake = json.loads((directory / "person-intake.json").read_text(encoding="utf-8"))
    if (set(person_intake) != {"schema_version", "access", "contents_published", "registered_on", "people"}
            or person_intake["schema_version"] != "1.0.0"
            or person_intake["access"] != "DRIVE_PERMISSION_REQUIRED"
            or person_intake["contents_published"] is not False):
        raise ValueError("Invalid person intake public boundary")
    person_names, person_urls = set(), set()
    for row in person_intake["people"]:
        if (set(row) != {"name", "url"} or not isinstance(row["name"], str) or not row["name"].strip()
                or row["name"].strip().casefold() in person_names or row["url"] in person_urls
                or row["url"] in intake_urls
                or not re.fullmatch(r"https://docs\.google\.com/document/d/[A-Za-z0-9_-]{15,100}/edit", row["url"])):
            raise ValueError("Unsafe or duplicate personal intake link")
        person_names.add(row["name"].strip().casefold()); person_urls.add(row["url"])
    pp = json.loads((directory / "person-project-intake.json").read_text(encoding="utf-8"))
    if (set(pp) != {"schema_version", "access", "contents_published", "registered_on", "assignments"}
            or pp["schema_version"] != "1.0.0" or pp["access"] != "DRIVE_PERMISSION_REQUIRED"
            or pp["contents_published"] is not False):
        raise ValueError("Invalid person-project boundary")
    pairs, pp_urls = set(), set()
    people = {p["name"] for p in person_intake["people"]}
    for row in pp["assignments"]:
        if set(row) != {"name", "project_id", "project_name", "url"}:
            raise ValueError("Unexpected personal project metadata")
        pid, name, url = row["project_id"], row["name"], row["url"]
        if (name not in people or pid not in eligible or not re.fullmatch(r"PRJ-[0-9]{6}",pid)
                or row["project_name"] != eligible[pid]["name"] or (name,pid) in pairs
                or url in pp_urls or url in intake_urls or url in person_urls
                or not re.fullmatch(r"https://docs\.google\.com/document/d/[A-Za-z0-9_-]{15,100}/edit",url)):
            raise ValueError("Invalid or duplicate person-project publication")
        pairs.add((name,pid));pp_urls.add(url)
    guide = (directory / "editing.html").read_text(encoding="utf-8")
    links = re.findall(r'href="(https://docs\.google\.com/spreadsheets/d/[A-Za-z0-9_-]+/edit)"', guide)
    if len(set(links)) != 1:
        raise ValueError("Desk editing guide must point to one authoritative catalogue")
    for path in ("field-payments.json", "field-payments.js", "source-custody.json"):
        if (directory / path).exists():
            raise ValueError("Field data leaked into Desk Resources")
    if catalog.get("schema_version") != "2.0.0" or packets.get("schema_version") != "1.0.0":
        raise ValueError("Unexpected public artifact schema")
    source = catalog["source_manifest"]
    if source.get("private_payroll_connected") is not False:
        raise ValueError("Private payroll cannot be exposed by the Pages publisher")
    if source.get("original_drive_files_rechecked") is not False or source.get("source_revision_proven") is not False:
        raise ValueError("False independent Drive revision/readback claim")
    groups = {c["key"] for c in catalog["groups"]}
    companies = {c["key"]: c for c in catalog["companies"]}
    projects = {p["project_id"]: p for p in catalog["projects"]}
    if len(companies) != len(catalog["companies"]) or len(projects) != len(catalog["projects"]):
        raise ValueError("Duplicate company/project display identities")
    resource_counts = Counter()
    packet_counts = Counter()
    ids = set()
    for r in catalog["resources"]:
        if (r["id"] in ids or r.get("kind") != "desk"
                or not (DRIVE_FILE.fullmatch(r["url"]) or DRIVE_FOLDER.fullmatch(r["url"]))):
            raise ValueError("Duplicate or invalid public resource")
        ids.add(r["id"])
        if r["group"] not in groups or r["project_id"] not in projects:
            raise ValueError("Unrecognized category/project")
        p = projects[r["project_id"]]
        if p["company_key"] != r["company_key"] or p["company"] != r["company"]:
            raise ValueError("Resource company/project inconsistency")
        if not r.get("readback_checked_on") or r["origin_tab"] != "project_resources" or not r.get("discipline") or not r.get("revision_note"):
            raise ValueError("Unproven published row")
        resource_counts[r["project_id"]] += 1
    for d in packets["documents"]:
        if d["project_id"] not in projects or d["document_id"] in ids or not DRIVE_FILE.fullmatch(d["drive_url"]):
            raise ValueError("Broken packet identity")
        ids.add(d["document_id"])
        packet_counts[d["project_id"]] += 1
    for pid, p in projects.items():
        if p["company_key"] not in companies:
            raise ValueError("Project has no company directory")
        if resource_counts[pid] != p["resource_count"] or packet_counts[pid] != p["document_count"]:
            raise ValueError("Incorrect project display counts")
        if p["company"] == "Company confirmation required" and p["company_assignment"] != "NEEDS_OWNER_CONFIRMATION":
            raise ValueError("Unknown company was silently approved")
    for key, c in companies.items():
        related = [p for p in projects.values() if p["company_key"] == key]
        if (len(related), sum(p["resource_count"] for p in related),
            sum(p["document_count"] for p in related)) != (
                c["project_count"], c["resource_count"], c["document_count"]):
            raise ValueError("Company summary counts differ from underlying rows")
    for path in ("index.html", "app.js", "styles.css", "editing.html",
                 "editing.css", "workspaces.html", "field.html", "money.html",
                 "operations.html", "legacy-route.js",
                 "resources/project-documents.html", "intake.html", "intake.js", "assets/css/blueprint-gallery.css"):
        if not (directory / path).is_file():
            raise ValueError("Missing public route/asset: " + path)
    # Astam's previously public-safe client resources live with the Library.
    astam_routes = (
        "feasibility/index.html", "feasibility/buyer-guide/index.html",
        "ops/data/land-feasibility/astam-village-public.v1.0.json",
        "assets/css/jp-theme-tokens.css", "assets/css/site-shell.css",
        "assets/css/jp-botanical.css", "assets/botanical/garden-left.svg",
        "assets/botanical/garden-right.svg", "assets/botanical/corner-sprig.svg",
        "assets/botanical/empty-garden.svg", "assets/botanical/tree-silhouette.svg",
    )
    for path in astam_routes:
        if not (directory / path).is_file():
            raise ValueError("Missing migrated Astam route/asset: " + path)
    overview = json.loads((directory / "ops/data/land-feasibility/astam-village-public.v1.0.json").read_text())
    embedded = re.search(r'<script type="application/json" id="rg-embedded">(.*?)</script>', (directory / "feasibility/index.html").read_text(encoding="utf-8"), re.S)
    if not embedded:
        raise ValueError("Missing canonical buyer guide")
    guide = json.loads(embedded.group(1))
    if len(guide.get("checklist", [])) != 46 or any((directory / p).exists() for p in ("feasibility/buyer-guide/guide.json", "ops/data/land-feasibility/astam-buyer-guide-public.v1.0.json")):
        raise ValueError("Duplicated or incomplete buyer guide")
    if overview["project"].get("legal_status") != "UNVERIFIED" or not guide.get("public_scope") == "EDUCATIONAL_PUBLIC_SAFE":
        raise ValueError("Astam feasibility and buyer guide qualification drift")
    from audit_routes import audit_routes
    audit_routes(directory)
    return {"companies": len(companies), "projects": len(projects),
            "resources": len(catalog["resources"]), "packet_files": len(packets["documents"])}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", default="_site")
    args = parser.parse_args()
    print("Public artifact QA PASSED:", validate(args.site))
