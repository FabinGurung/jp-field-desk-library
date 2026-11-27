"""Audit every published HTML route and same-site link, including legacy redirects."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import posixpath
import re

PREFIX = "/jp-field-desk-library/"

class Route(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.ids, self.links = set(), []
        self.redirect = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        for attr in ("href","src"):
            if a.get(attr):
                self.links.append(a[attr])
        if tag == "meta" and a.get("http-equiv","").lower()=="refresh":
            self.redirect = True
            match = re.search(r"url\s*=\s*(.+)$",a.get("content",""),re.I)
            if match:
                self.links.append(match.group(1).strip("'\""))

def audit_routes(directory):
    directory = Path(directory)
    routes = {}
    for p in directory.rglob("*.html"):
        rel = p.relative_to(directory).as_posix()
        html = p.read_text(encoding="utf-8")
        route = Route(html)
        if rel == "feasibility/index.html":
            embedded = re.search(r'<script type="application/json" id="rg-embedded">(.*?)</script>',html,re.S)
            if embedded:
                route.ids.update("rg-source-"+x["id"] for x in json.loads(embedded.group(1))["sources"])
        routes[rel] = route
    issues = []
    for rel, route in routes.items():
        for link in route.links:
            u = urlsplit(link)
            if u.scheme or u.netloc:
                continue
            path = unquote(u.path)
            if path.startswith("/"):
                if not path.startswith(PREFIX):
                    continue
                path = path[len(PREFIX):]
                target = posixpath.normpath(path)
            elif path:
                target = posixpath.normpath(posixpath.join(posixpath.dirname(rel),path))
            else:
                target = rel
            if target in ("",".") or path.endswith("/") or (directory/target).is_dir():
                target = posixpath.join(target,"index.html")
            if target.startswith("../") or target==".." or not (directory/target).is_file():
                issues.append((rel,link,"missing target "+target))
            elif u.fragment and target in routes and unquote(u.fragment) not in routes[target].ids:
                issues.append((rel,link,"missing anchor"))
    if issues:
        raise ValueError("Route audit failed: "+repr(issues))
    print("Full route QA PASSED:",len(routes),"HTML routes,",sum(x.redirect for x in routes.values()),"meta redirects")
    return len(routes)
