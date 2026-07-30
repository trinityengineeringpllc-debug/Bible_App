#!/usr/bin/env python3
"""
Generate standalone.html -- the whole app inlined into a single file.

Why this exists: browsers block ES module imports over the file:// protocol,
so double-clicking client/index.html gives a styled shell with empty panes and
no error message. That is a browser security rule, not a bug, but it makes
casual local viewing impossible.

This concatenates the modules in dependency order, strips the import/export
statements, wraps everything in an IIFE and inlines the CSS. The result opens
by double-click.

    python pipeline/build_standalone.py

standalone.html is GENERATED. Never edit it -- edit client/ and regenerate.
Production on Slate serves the modular version over HTTP and ignores this file.
"""

import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CLIENT = REPO / 'client'
ORDER = ['js/seed.js', 'js/corpus.js', 'js/store.js', 'js/app.js']

IMPORT = re.compile(r'^import\s+[\s\S]*?from\s+[\'"][^\'"]+[\'"];\s*$', re.M)
EXPORT_KW = re.compile(r'^export\s+(?=(const|let|var|function|class|async))', re.M)
EXPORT_LIST = re.compile(r'^export\s*\{[^}]*\};\s*$', re.M)


def main():
    css = (CLIENT / 'css' / 'app.css').read_text(encoding='utf-8')
    html = (CLIENT / 'index.html').read_text(encoding='utf-8')

    parts = []
    for rel in ORDER:
        src = (CLIENT / rel).read_text(encoding='utf-8')
        src = IMPORT.sub('', src)
        src = EXPORT_KW.sub('', src)
        src = EXPORT_LIST.sub('', src)
        parts.append(f'/* ===== {rel} ===== */\n{src}')

    bundle = '\n\n'.join(parts)

    html = html.replace('<link rel="stylesheet" href="css/app.css">',
                        f'<style>\n{css}\n</style>')
    html = html.replace('<script type="module" src="js/app.js"></script>',
                        f'<script>\n(function(){{\n"use strict";\n{bundle}\n}})();\n</script>')
    html = html.replace('seed corpus &middot; v0.2',
                        'seed corpus &middot; v0.2 &middot; standalone')

    out = REPO / 'standalone.html'
    out.write_text(html, encoding='utf-8')
    print(f'wrote {out} ({len(html):,} bytes)')


if __name__ == '__main__':
    main()
