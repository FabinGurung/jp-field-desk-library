"""Validate public canonical project IDs separately from reviewed resource links."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from publish_project_directory import public_rows, publish_project_directory, PROJECT_SHEET, COMPANIES
from publish_library import SITE_FILES

ROOT=Path(__file__).resolve().parents[1]

class ProjectDirectoryTests(unittest.TestCase):
    def test_29_public_projects_baseline_and_retired_alias(self):
        data=json.loads((ROOT/"site/projects-register.baseline.json").read_text(encoding="utf-8"))
        projects=data["projects"]
        self.assertEqual(len(projects),29)
        self.assertEqual(len({p["project_id"] for p in projects}),29)
        self.assertNotIn("PRJ-000030",{p["project_id"] for p in projects})
        self.assertEqual(sum(p["company_id"]=="ORG-000001" for p in projects),27)
        self.assertEqual(sum(p["company_id"]=="ORG-000002" for p in projects),2)
        self.assertTrue(all(p["name"] and p["project_id"].startswith("PRJ-") for p in projects))
        for f in ("projects.html","projects.js","assets/css/project-guide.css",
                  "projects-register.baseline.json",
                  "system-map.html"):
            self.assertIn(f,SITE_FILES)
    def test_explicit_dated_fallback_when_no_source_viewer(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.dict("os.environ",{"GOOGLE_ACCESS_TOKEN":""}):
                count=publish_project_directory(folder,"2026-11-18")
            payload=json.loads((Path(folder)/"projects-directory.json").read_text())
            self.assertEqual(count,29)
            self.assertEqual(payload["publication_method"],"DATED_OWNER_REVIEWED_FALLBACK")
            self.assertTrue(payload["no_documents_inferred"])
    def test_access_failure_is_classified_without_exposing_source(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.dict("os.environ", {"GOOGLE_ACCESS_TOKEN": "synthetic-test-token"}):
                with patch("publish_project_directory.read_all", side_effect=RuntimeError("Sheets read failed (403) for projects")):
                    with patch("builtins.print") as log:
                        publish_project_directory(folder, "2026-11-24")
            log.assert_any_call("Project identity source read failure:", "403")
            result = json.loads((Path(folder)/"projects-directory.json").read_text())
            self.assertEqual(result["publication_method"], "AUTHENTICATED_SOURCE_ACCESS_UNVERIFIED__DATED_FALLBACK")

    def test_double_read_and_validated_public_only(self):
        columns=["Project ID","Display Name","Company Project Code","Executing Company ID","Status",
                 "Project Category","Verification Status","Data Quality Status","Is Public"]
        rows=[columns,
              ["PRJ-000001","Sample A","REB-001","ORG-000002","Construction","RESIDENTIAL","VERIFIED","VALID","TRUE"],
              ["PRJ-000030","RETIRED ALIAS","REB-003","ORG-000002","","","RETIRED","RETIRED","FALSE"]]
        clean=public_rows(rows)
        self.assertEqual(len(clean),1)
        self.assertEqual(clean[0]["name"],"Sample A")
        with tempfile.TemporaryDirectory() as folder:
            with patch("publish_project_directory.read_all",return_value={"projects":rows}):
                with patch.dict("os.environ",{"GOOGLE_ACCESS_TOKEN":"synthetic-test-token"}):
                    count=publish_project_directory(folder,"2026-11-18")
            result=json.loads((Path(folder)/"projects-directory.json").read_text())
            self.assertEqual(count,1)
            self.assertEqual(result["publication_method"],"AUTHENTICATED_DOUBLE_READ__CANONICAL_PROJECTS")
            self.assertNotIn("PRJ-000030",[p["project_id"] for p in result["projects"]])
        rows.append(rows[1])
        with self.assertRaisesRegex(ValueError,"duplicate"):
            public_rows(rows)
    def test_specialist_cad_identity_collision_is_explicit_hold(self):
        project=(ROOT/"site/projects.html").read_text(encoding="utf-8")
        script=(ROOT/"site/projects.js").read_text(encoding="utf-8")
        tree=(ROOT/"site/system-map.html").read_text(encoding="utf-8")
        self.assertIn("specialist-projects",project)
        for name in ("ashok-adhikari","harisharan-adhikari",
                     "ramachandra-devkota","js-buddha-jewelers"):
            self.assertIn(name,project)
        self.assertIn("issues/146",project)
        self.assertIn("issues/146",tree)
        self.assertIn('if(p.project_id==="PRJ-000029")',script)
        self.assertIn("Similar project references",script)
        # No automatic mapping of the CAD workspace to Basanti originals.
        self.assertNotIn("ramachandra-devkota",script)


if __name__=="__main__":
    unittest.main()
