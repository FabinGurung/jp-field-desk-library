"""Read back every deployed route and verify against the current source and public contracts."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import quote
import os
import subprocess
from publish_library import SITE_FILES
from validate_public_artifact import validate
from sheets_read import ROOT

BASE = "https://fabingurung.github.io/jp-field-desk-library/"
GENERATED = ("catalog.json","document-packets.json","projects-directory.json",
             "project-intake.json","person-intake.json","person-project-intake.json","source-gallery.js")
GALLERY = b'<script defer data-jp-source-gallery src="/jp-field-desk-library/source-gallery.js"></script>\n'

def verify():
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        paths = list(dict.fromkeys([*SITE_FILES,*GENERATED]))
        def read(path):
            dest = root / path
            dest.parent.mkdir(parents=True,exist_ok=True)
            url = BASE+quote(path,safe="/")+"?revision="+os.getenv("GITHUB_SHA","readback")
            subprocess.run(["curl","-fsS","--retry","5","--retry-delay","3",
                            "--retry-all-errors","--max-time","25",url,"-o",str(dest)],check=True)
            if path in SITE_FILES:
                actual=dest.read_bytes()
                if path.endswith(".html"):
                    actual=actual.replace(GALLERY,b"",1)
                if actual!=(ROOT/"site"/path).read_bytes():
                    raise ValueError("Served static content differs from current source: "+path)
            elif path=="source-gallery.js" and dest.read_bytes()!=(ROOT/".github/source-gallery/source-gallery.js").read_bytes():
                raise ValueError("Served gallery differs from current source")
        with ThreadPoolExecutor(max_workers=5) as pool:
            list(pool.map(read,paths))
        counts=validate(root)
        import json
        projects=json.loads((root/"projects-directory.json").read_text(encoding="utf-8"))
        pp=json.loads((root/"person-project-intake.json").read_text(encoding="utf-8"))
        print("Served Pages verified:",len(paths),"files;",counts)
        print("Served project provenance:",projects["publication_method"])
        print("Served person-project links:",len(pp["assignments"]))

if __name__=="__main__":
    verify()
