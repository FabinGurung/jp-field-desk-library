"""A9 Resource Library: source-owner finance routes and shared navigation regressions."""
import json
import re
import unittest
from pathlib import Path
from publish_library import SITE_FILES

ROOT=Path(__file__).resolve().parents[1]
EST="https://fabingurung.github.io/jp-estimating-and-boq/"
PAGES=("index.html","field.html","money.html","operations.html","editing.html",
       "memory-wall/index.html","workspaces.html","resources/project-documents.html","feasibility/index.html")

class ResourceFinanceNavigationTest(unittest.TestCase):
    def test_shared_responsive_theme_in_every_library_surface(self):
        self.assertIn("assets/css/resource-unified.css",SITE_FILES)
        self.assertTrue((ROOT/"site/assets/css/resource-unified.css").exists())
        for path in PAGES:
            body=(ROOT/"site"/path).read_text(encoding="utf-8")
            self.assertIn("resource-unified.css",body,path)
        css=(ROOT/"site/assets/css/resource-unified.css").read_text()
        self.assertIn("@media(max-width:700px)",css)
        self.assertIn(".finance-router",css)

    def test_link_to_financial_owner_without_replication(self):
        for path in ("field.html","money.html","memory-wall/index.html","operations.html","editing.html"):
            text=(ROOT/"site"/path).read_text(encoding="utf-8")
            self.assertIn(EST,text,path)
        for path in ("money.html","field.html"):
            text=(ROOT/"site"/path).read_text()
            self.assertIn("finance.html#cost-register-triad",text)
            self.assertIn("memory-posters.html#contractor-bills-intake",text)
        # Never advertise direct private Estimation financial working Sheet IDs on Pages.
        for path in PAGES:
            text=(ROOT/"site"/path).read_text()
            for private_id in ("1wR99Ww0BcEVecmstH6zSuax-LYhb7UhzYgcnsena-b0",
                               "1eLxWq8eKgod6i98uxrRqF-xJA85HLScWBPNj0ztUgz4",
                               "1_MYCZ98tsfmWgTn_-jQBU9OcdrygwC9nlE9BF1gWK2k"):
                self.assertNotIn(private_id,text)
        self.assertEqual((ROOT/"site/memory-wall/index.html").read_text().count('class="sheet-card"'),35)

    def test_source_custody_has_safe_clickable_owner_pages(self):
        data=json.loads((ROOT/"site/source-custody.json").read_text())
        item=next(x for x in data["subjects"] if x["id"]=="financial-source-evidence")
        self.assertEqual(item["status"],"EXTERNAL_OWNER_LINKED")
        self.assertEqual(item["group"],"field")
        self.assertEqual(len(item["public_links"]),3)
        self.assertTrue(all(x["url"].startswith(EST) for x in item["public_links"]))
        self.assertIn("16 OPEN",item["limit"])
        self.assertIn("EXTERNAL_OWNER_LINKED",(ROOT/"site/operations.js").read_text())
        self.assertFalse(data["live_worker_sync"])

    def test_project_pages_have_no_duplicate_sheet_navigation(self):
        docs=(ROOT/"site/resources/project-documents.html").read_text()
        self.assertEqual(len(re.findall(r'<a href="../memory-wall/">',docs)),1)
        self.assertIn("back-to-project",docs)
        self.assertIn("?project=JPENT-ASTAM-2026-01",(ROOT/"site/feasibility/index.html").read_text())

if __name__=="__main__":
    unittest.main()
