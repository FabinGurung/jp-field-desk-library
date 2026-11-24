"""Install the approved source gallery in the generated Pages artifact."""

import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MARKER = 'data-jp-source-gallery'
REDIRECT = re.compile(r'<meta\b[^>]*http-equiv\s*=\s*["\']?refresh\b', re.I)
BODY_END = re.compile(r'</body\s*>', re.I)


def inject(html, script):
    if MARKER in html or REDIRECT.search(html):
        return html
    endings = list(BODY_END.finditer(html))
    if not endings:
        return html
    end = endings[-1].start()
    return html[:end] + script + '\n' + html[end:]


def install(site, slug):
    if not site.is_dir():
        raise ValueError(f'Pages build missing: {site}')
    script = f'<script defer {MARKER} src="/{slug}/source-gallery.js"></script>'
    processed = 0
    for page in site.rglob('*.html'):
        original = page.read_bytes().decode('utf-8')
        revised = inject(original, script)
        if revised != original:
            page.write_bytes(revised.encode('utf-8'))
        processed += script in revised
    if not processed:
        raise ValueError('The Pages build has no gallery entry points')
    (site / 'source-gallery.js').write_bytes((ROOT / 'source-gallery.js').read_bytes())
    # Validate the final injected artifact, including curated URL boundaries.
    gallery = (site / 'source-gallery.js').read_text(encoding='utf-8')
    match = re.search(r'^  const config = (\{.*\});$', gallery, re.M)
    if not match:
        raise ValueError('Missing structured gallery config')
    cards = json.loads(match.group(1))['cards']
    if slug == 'jp-field-desk-library':
        approved = {
            'https://docs.google.com/spreadsheets/d/1e019Jac4lDveZ2glXMph4RLHivqPFEachbcNi-R1DZk/edit',
            '/jp-field-desk-library/resources/project-documents.html',
            'https://drive.google.com/drive/u/0/search?q=jp-field-desk-library',
        }
        if len(cards) != len(approved) or {card['url'] for card in cards} != approved:
            raise ValueError('Unapproved or duplicated Desk gallery source')
        if not (site / 'resources/project-documents.html').is_file():
            raise ValueError('Missing gallery internal target')
    verified = 0
    for page in site.rglob('*.html'):
        html = page.read_text(encoding='utf-8')
        expected = not REDIRECT.search(html) and bool(BODY_END.search(html))
        if html.count(MARKER) != int(expected) or html.count(script) != int(expected):
            raise ValueError('Gallery route mismatch: ' + str(page.relative_to(site)))
        verified += int(expected)
    if verified != processed:
        raise ValueError('Gallery route count mismatch')
    print(f'Installed the Google Drive source gallery on {processed} Pages routes')
    print(f'Post-install gallery QA PASSED: {verified} routes, {len(cards)} curated cards')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('site', type=Path)
    parser.add_argument('slug')
    arguments = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9_.-]+', arguments.slug):
        parser.error('Invalid GitHub Pages repository name')
    install(arguments.site, arguments.slug)
