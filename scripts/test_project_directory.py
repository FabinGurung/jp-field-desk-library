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
                  "projects-register.baseline.json","assets/css/field-report.css",
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
        self.assertIn("CAD identity HOLD",script)
        # No automatic mapping of the CAD workspace to Basanti originals.
        self.assertNotIn("ramachandra-devkota",script)

    def test_field_layout_has_real_order_and_no_new_financial_ledger(self):
        html=(ROOT/"site/field.html").read_text()
        sections=["start","materials","daily-work","measurements","attendance","unassigned","historical-payments","field-data-flow"]
        self.assertEqual([html.index('id="'+x+'"') for x in sections],sorted(html.index('id="'+x+'"') for x in sections))
        self.assertIn('class="field-toc"',html)
        self.assertIn('id="payment-record-body"',html)
        self.assertIn("does not establish opening stock",html)
        self.assertIn("1YshLrDAJDg3CO8F1jmIr2Eucy0-TKwiviVNF5tiAfT0",html)
        self.assertIn("1GQQDRg3bDPVIrfs1oVm_ycmyBE5NlpxEKzu1DsAz6tk",html)
        self.assertNotIn("drive.google.com/drive/folders/",html)

if __name__=="__main__":
    unittest.main()
