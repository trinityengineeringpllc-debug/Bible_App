#!/usr/bin/env python3
"""
Build client/data/corpus.db from the sources in sources.yaml.

Runs locally, never deployed. The output is a static asset served by Slate and
queried in the browser over HTTP range requests.

    python build_corpus.py --only lexicon      # one importer
    python build_corpus.py                     # everything

Importers run in dependency order and each one is idempotent, so a failed run
can be resumed rather than restarted.

ORDER MATTERS. Versification must run first: every other importer maps its
source verse IDs through versification_map, and if that table is empty the
Hebrew and Greek data lands on English verse numbers that do not correspond to
it. Nothing crashes. Psalms is simply wrong from then on.
"""

import argparse
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
SCHEMA = REPO / 'db' / 'corpus_schema.sql'
OUT = REPO / 'client' / 'data' / 'corpus.db'
CACHE = ROOT / 'sources'

sys.path.insert(0, str(ROOT))


def create_db(path, schema_path):
    """Fresh database from the committed schema. The schema is the source of
    truth; this script never issues its own CREATE TABLE."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    conn = sqlite3.connect(path)
    conn.executescript(schema_path.read_text(encoding='utf-8'))
    conn.commit()
    return conn


def finalise(conn):
    """Compact and analyse. VACUUM matters more than usual here: sql.js-httpvfs
    fetches by page, so a fragmented file costs extra round trips on every
    query for the life of the deployment."""
    conn.execute('ANALYZE')
    conn.commit()
    conn.execute('VACUUM')
    conn.commit()


STAGES = ['versification', 'lexicon', 'tokens', 'text', 'crossrefs']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', choices=STAGES, help='run a single stage')
    ap.add_argument('--out', default=str(OUT))
    ap.add_argument('--greek-lexicon', help='path to TBESG file')
    ap.add_argument('--hebrew-lexicon', help='path to TBESH file')
    args = ap.parse_args()

    out = Path(args.out)
    print(f'building {out}')
    conn = create_db(out, SCHEMA)
    started = time.time()
    totals = {}

    stages = [args.only] if args.only else STAGES

    for stage in stages:
        t0 = time.time()
        if stage == 'lexicon':
            from importers import lexicon
            entries = refs = 0
            for path, lang in ((args.greek_lexicon, 'grc'),
                               (args.hebrew_lexicon, 'hbo')):
                if not path:
                    continue
                e, r = lexicon.load(conn, path, lang)
                entries += e
                refs += r
                print(f'  lexicon[{lang}]  {e:>7,} entries  {r:>7,} refs')
            conn.commit()
            totals['lexicon entries'] = entries
            totals['lexicon refs'] = refs
        else:
            print(f'  {stage:14} not implemented yet -- skipped')
            continue
        print(f'  {stage:14} done in {time.time() - t0:.1f}s')

    finalise(conn)

    print()
    for k, v in totals.items():
        print(f'  {k:20} {v:>10,}')
    size = out.stat().st_size
    print(f'  {"file size":20} {size / 1e6:>10.1f} MB')
    print(f'  {"elapsed":20} {time.time() - started:>10.1f}s')
    conn.close()


if __name__ == '__main__':
    main()
