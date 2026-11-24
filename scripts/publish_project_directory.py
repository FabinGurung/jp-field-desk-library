"""Refresh the public-safe project directory from the existing canonical Google Sheet.

This is a read-only projection. Source ownership and raw Sheets remain unchanged.
When the project's Google Sheets reader has no permission, retain the explicit,
dated public snapshot rather than claiming a live refresh or failing Desk Pages.
Invalid or conflicting *accessible* source data fail publication.
"""
import json
import os
import re
from pathlib import Path

from sheets_read import ROOT, read_all

PROJECT_SHEET = "1JqzjBNBCT_AAIBkuGsIR5VBOJ3_HyifdPDc7K_jF5Bo"
SOURCES = {"projects": (PROJECT_SHEET, "projects")}
COMPANIES = {
    "ORG-000001": "Fishtail Builders Pvt Ltd",
    "ORG-000002": "Rohini Engineering and Builders Pvt Ltd",
}
HEADERS = ("Project ID", "Display Name", "Company Project Code",
           "Executing Company ID", "Status", "Project Category",
           "Verification Status", "Data Quality Status", "Is Public")


def public_rows(rows):
    if not rows:
        raise ValueError("Canonical project workbook is empty")
    headers = [str(x).strip() for x in rows[0]]
    if len(headers) != len(set(headers)) or not set(HEADERS).issubset(headers):
        raise ValueError("Canonical project workbook headers changed")
    pos = {key: headers.index(key) for key in HEADERS}
    def get(row, name):
        i = pos[name]
        return str(row[i] if i < len(row) and row[i] is not None else "").strip()
    public = []
    seen = set()
    for row in rows[1:]:
        if not any(str(x).strip() for x in row):
            continue
        pid = get(row, "Project ID")
        is_public = get(row, "Is Public").upper()
        if is_public not in ("TRUE", "FALSE"):
            raise ValueError("Public flag missing or invalid in canonical project")
        if is_public != "TRUE":
            continue
        if not re.fullmatch(r"PRJ-[0-9]{6}", pid) or pid in seen:
            raise ValueError("Invalid or duplicate published project identity")
        seen.add(pid)
        name = get(row, "Display Name")
        company_id = get(row, "Executing Company ID")
        if not name or not company_id:
            raise ValueError("Public project missing identity or company")
        public.append({
            "project_id": pid,
            "name": name,
            "company_project_code": get(row, "Company Project Code"),
            "company_id": company_id,
            "company": COMPANIES.get(company_id, "Company verification required"),
            "status": get(row, "Status") or "Unspecified",
            "category": get(row, "Project Category"),
            "verification": get(row, "Verification Status"),
            "data_quality": get(row, "Data Quality Status"),
        })
    return sorted(public, key=lambda x: x["project_id"])


def publish_project_directory(output, received_at):
    output = Path(output)
    baseline = json.loads((ROOT / "site/projects-register.baseline.json").read_text(encoding="utf-8"))
    projects = baseline["projects"]
    method = "DATED_OWNER_REVIEWED_FALLBACK"
    token = os.getenv("GOOGLE_ACCESS_TOKEN")
    if token:
        try:
            first = read_all(SOURCES, token)["projects"]
            second = read_all(SOURCES, token)["projects"]
        except RuntimeError:
            # An owner-controlled viewer grant may not yet exist on the
            # canonical source. Keep published names, but be explicit.
            method = "AUTHENTICATED_SOURCE_ACCESS_UNVERIFIED__DATED_FALLBACK"
        else:
            if first != second:
                raise ValueError("Project master changed during readback")
            projects = public_rows(first)
            method = "AUTHENTICATED_DOUBLE_READ__CANONICAL_PROJECTS"
    print("Project identity publication method:", method)
    payload = {
        "schema_version": "1.0.0",
        "source_sheet_id": PROJECT_SHEET,
        "source_tab": "projects",
        "source_authority": "Projects and Locations — v1.3",
        "publication_method": method,
        "baseline_reviewed_on": baseline["reviewed_on"],
        "published_on": received_at,
        "projects": projects,
        "no_documents_inferred": True,
        "note": "Only Is Public=TRUE canonical projects. Retired IDs are not displayed. Registered file links are joined separately from the verified Project Resources catalogue.",
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "projects-directory.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return len(projects)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    print("Public project directory rows:", publish_project_directory(args.output, "manual"))
