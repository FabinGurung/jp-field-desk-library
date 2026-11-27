import unittest
from publish_intake import project_intake_rows, person_intake_rows, person_project_rows, LIVE, ASTAM

class IntakeBoundaryTest(unittest.TestCase):
    def setUp(self):
        self.manifest={"schema_version":"1.0.0","registered_on":"2026-11-25","access":"DRIVE_PERMISSION_REQUIRED","entries":[
            {"project_id":"PRJ-000001","document_id":"SyntheticDocument000001"},
            {"project_id":"PRJ-000002","document_id":"SyntheticDocument000002"},
            {"project_id":ASTAM,"document_id":"SyntheticAstamDocument01"}]}
        self.directory={"publication_method":LIVE,"projects":[{"project_id":"PRJ-000001","name":"Public project","company":"Company"}]}
        self.astam={"project_id":ASTAM,"name":"Astam Village — Land Feasibility","company":"JP Enterprise"}

    def test_live_only_and_exact_astam(self):
        rows=project_intake_rows(self.manifest,self.directory,[self.astam])
        self.assertEqual({r["project_id"] for r in rows},{"PRJ-000001",ASTAM})
        self.assertTrue(all(set(r)=={"project_id","name","company","url"} for r in rows))
        self.assertEqual(rows[0]["url"],"https://docs.google.com/document/d/SyntheticDocument000001/edit")
        self.directory["publication_method"]="DATED_OWNER_REVIEWED_FALLBACK"
        self.assertEqual([r["project_id"] for r in project_intake_rows(self.manifest,self.directory,[self.astam])],[ASTAM])
        self.assertEqual(project_intake_rows(self.manifest,self.directory,[dict(self.astam,company="Other")]),[])

    def test_reject_private_data_and_duplicate_ids(self):
        self.manifest["entries"][0]["content"]="not allowed"
        with self.assertRaises(ValueError): project_intake_rows(self.manifest,self.directory,[])
        del self.manifest["entries"][0]["content"]
        self.manifest["entries"][1]["document_id"]=self.manifest["entries"][0]["document_id"]
        with self.assertRaises(ValueError): project_intake_rows(self.manifest,self.directory,[])

class PersonIntakeBoundaryTest(unittest.TestCase):
    def test_names_and_links_only(self):
        m={"schema_version":"1.0.0","registered_on":"2026-11-25","access":"DRIVE_PERMISSION_REQUIRED","entries":[{"name":"Example Person","document_id":"SyntheticPersonDoc1234"}]}
        self.assertEqual(person_intake_rows(m),[{"name":"Example Person","url":"https://docs.google.com/document/d/SyntheticPersonDoc1234/edit"}])
        m["entries"][0]["content"]="private"
        with self.assertRaises(ValueError): person_intake_rows(m)
        del m["entries"][0]["content"]
        m["entries"].append({"name":"example person","document_id":"OtherSyntheticDoc123"})
        with self.assertRaises(ValueError): person_intake_rows(m)

class PersonProjectBoundaryTest(unittest.TestCase):
    def test_live_eligibility_and_duplicate_guards(self):
        m={"schema_version":"1.0.0","registered_on":"2026-11-27","access":"DRIVE_PERMISSION_REQUIRED","entries":[
            {"name":"Person","project_id":"PRJ-000001","document_id":"SyntheticProjectDoc1234"}]}
        people=[{"name":"Person","url":"https://docs.google.com/document/d/SyntheticGeneralDoc1234/edit"}]
        directory={"publication_method":LIVE,"projects":[{"project_id":"PRJ-000001","name":"Project"}]}
        self.assertEqual(person_project_rows(m,directory,people)[0]["project_name"],"Project")
        directory["publication_method"]="DATED_OWNER_REVIEWED_FALLBACK"
        self.assertEqual(person_project_rows(m,directory,people),[])
        m["entries"].append(dict(m["entries"][0]))
        with self.assertRaises(ValueError): person_project_rows(m,directory,people)

if __name__=="__main__":
    unittest.main()
