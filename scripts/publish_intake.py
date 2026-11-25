"""Publish approved intake links only, never read or export the Google Docs contents."""
import json
import re
from pathlib import Path
from sheets_read import ROOT

LIVE = "AUTHENTICATED_DOUBLE_READ__CANONICAL_PROJECTS"
ASTAM = "JPENT-ASTAM-2026-01"

def project_intake_rows(manifest, directory, catalogue_projects):
    if set(manifest) != {"schema_version", "registered_on", "access", "entries"} or manifest["schema_version"] != "1.0.0" or manifest["access"] != "DRIVE_PERMISSION_REQUIRED":
        raise ValueError("Invalid intake manifest")
    ids, docs = set(), set()
    for row in manifest["entries"]:
        if set(row) != {"project_id", "document_id"}:
            raise ValueError("Intake manifest must contain IDs only")
        pid, doc = row["project_id"], row["document_id"]
        if not (re.fullmatch(r"PRJ-[0-9]{6}", pid) or pid == ASTAM) or not re.fullmatch(r"[A-Za-z0-9_-]{15,100}", doc) or pid in ids or doc in docs:
            raise ValueError("Duplicate or invalid intake identity")
        ids.add(pid); docs.add(doc)
    # Do not disclose links for a project whose current public eligibility is unknown.
    eligible = {}
    if directory.get("publication_method") == LIVE:
        eligible.update({p["project_id"]:p for p in directory["projects"] if p["project_id"] != "PRJ-000030"})
    for p in catalogue_projects:
        if p["project_id"] == ASTAM and p["company"] == "JP Enterprise" and p["name"] == "Astam Village — Land Feasibility":
            eligible[ASTAM] = p
    return [{"project_id":r["project_id"],"name":eligible[r["project_id"]]["name"],
             "company":eligible[r["project_id"]]["company"],
             "url":"https://docs.google.com/document/d/"+r["document_id"]+"/edit"}
            for r in manifest["entries"] if r["project_id"] in eligible]

def publish_intake(output, catalogue_projects):
    output = Path(output)
    manifest = json.loads((ROOT / "registry/project-intake-links.json").read_text(encoding="utf-8"))
    directory = json.loads((output / "projects-directory.json").read_text(encoding="utf-8"))
    rows = project_intake_rows(manifest, directory, catalogue_projects)
    payload = {"schema_version":"1.0.0","access":"DRIVE_PERMISSION_REQUIRED",
               "contents_published":False,"registered_on":manifest["registered_on"],
               "projects":rows}
    (output / "project-intake.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Project intake link-only directory:",len(rows))
    publish_person_intake(output)

def person_intake_rows(manifest):
    if (set(manifest) != {"schema_version", "registered_on", "access", "entries"}
            or manifest["schema_version"] != "1.0.0" or manifest["access"] != "DRIVE_PERMISSION_REQUIRED"
            or not isinstance(manifest["entries"], list)):
        raise ValueError("Invalid person intake manifest")
    names, docs, rows = set(), set(), []
    for row in manifest["entries"]:
        if set(row) != {"name", "document_id"}:
            raise ValueError("Person intake metadata must contain names and IDs only")
        name, doc = row["name"], row["document_id"]
        if (not isinstance(name, str) or not name.strip() or len(name) > 100
                or name.strip().casefold() in names or doc in docs
                or not re.fullmatch(r"[A-Za-z0-9_-]{15,100}", doc)):
            raise ValueError("Invalid or duplicate person intake")
        names.add(name.strip().casefold()); docs.add(doc)
        rows.append({"name":name.strip(), "url":"https://docs.google.com/document/d/"+doc+"/edit"})
    return rows

def publish_person_intake(output):
    manifest = json.loads((ROOT / "registry/person-intake-links.json").read_text(encoding="utf-8"))
    rows = person_intake_rows(manifest)
    payload = {"schema_version":"1.0.0","access":"DRIVE_PERMISSION_REQUIRED",
               "contents_published":False,"registered_on":manifest["registered_on"],"people":rows}
    (Path(output) / "person-intake.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Person intake link-only directory:",len(rows))
