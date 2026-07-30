"""
Importer for TBESG (Greek) and TBESH (Hebrew) -- the extended Strong's lexicons.

Written against the actual files, not the documentation. Format notes that
matter and are not obvious from the README:

  * The file opens with a UTF-8 BOM and roughly 25 lines of title, licence and
    field documentation. Data begins at the first line matching ^[GH]\\d{4}\\t.
    Do not skip a fixed number of lines -- the preamble length changes between
    releases.

  * Data rows have 8 tab-separated fields:
        0  extended Strong's       G0152
        1  disambiguated form      "G0152 ="
        2  base/unicode Strong's   G0152
        3  lemma                   αἰσχύνη
        4  transliteration         aischunē
        5  part-of-speech class    G:N-F, G:V
        6  short gloss             shame
        7  full definition         HTML with <b> <BR /> <ref='...'> <i> <re>

  * Rows with other field counts exist (1, 2, 14, 38) -- they are headers,
    separators and documentation, not data. Filter on the field count AND the
    Strong's pattern, not either alone.

  * Definitions embed scripture references as <ref='Luk.14.19'>. Harvesting
    these gives every entry a set of verse links, which is what powers "where
    is this word discussed" as distinct from "where does it occur".
"""

import re
import sys
import unicodedata

sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent.parent))
from refs import extract_refs, RefError            # noqa: E402

DATA_ROW = re.compile(r'^[GH]\d{4}')

# STEPBible part-of-speech classes -> readable labels
POS_CLASS = {
    'N': 'noun', 'V': 'verb', 'A': 'adjective', 'D': 'adverb',
    'P': 'preposition', 'C': 'conjunction', 'T': 'article',
    'I': 'interjection', 'X': 'particle', 'R': 'pronoun',
}
GENDER = {'M': 'masculine', 'F': 'feminine', 'N': 'neuter'}


def normalise_pos(raw):
    """'G:N-F' -> 'noun, feminine'. Unknown shapes pass through unchanged."""
    if not raw:
        return None
    body = raw.split(':', 1)[-1]
    head, _, tail = body.partition('-')
    label = POS_CLASS.get(head)
    if not label:
        return body
    if tail in GENDER:
        return f'{label}, {GENDER[tail]}'
    return label


def base_strongs(extended):
    """
    'G0152' -> 'G152'; 'H0430a' -> 'H430'.

    This is what lets a lookup from a printed Strong's concordance still find
    the entry after STEPBible has split a number into disambiguated senses.
    """
    m = re.match(r'^([GH])0*(\d+)', extended)
    return f'{m.group(1)}{int(m.group(2))}' if m else extended


TAGS = re.compile(r'<[^>]+>')
WS = re.compile(r'\s+')


def strip_markup(html):
    """Plain-text form of a definition, for full-text indexing."""
    text = re.sub(r'<BR\s*/?>', ' ', html or '', flags=re.I)
    text = TAGS.sub('', text)
    return WS.sub(' ', text).strip()


def parse_file(path, language):
    """
    Yield lexicon dicts from a TBESG/TBESH file.

    Returns dicts matching the `lexicon` table in db/corpus_schema.sql, plus a
    'refs' key holding harvested (start, end) verse ranges.
    """
    seen = set()
    with open(path, encoding='utf-8-sig') as fh:
        for lineno, line in enumerate(fh, 1):
            line = line.rstrip('\n').rstrip('\r')
            if not DATA_ROW.match(line):
                continue
            fields = line.split('\t')
            if len(fields) < 8:
                continue

            strongs = fields[0].strip()
            if not strongs or strongs in seen:
                continue
            seen.add(strongs)

            full_html = fields[7]
            yield {
                'strongs': strongs,
                'base_strongs': base_strongs(strongs),
                'language': language,
                'lemma': unicodedata.normalize('NFC', fields[3].strip()),
                'transliteration': fields[4].strip() or None,
                'pronunciation': None,
                'part_of_speech': normalise_pos(fields[5].strip()),
                'short_def': fields[6].strip() or None,
                'full_def': strip_markup(full_html) or None,
                'full_html': full_html or None,
                'derivation': None,
                'kjv_usage': None,
                'lsj_ref': None,
                'source': 'TBESG' if language == 'grc' else 'TBESH',
                'refs': extract_refs(full_html),
                '_lineno': lineno,
            }


def load(conn, path, language):
    """Import into an open SQLite connection. Returns (entries, references)."""
    rows, ref_rows = [], []
    for e in parse_file(path, language):
        rows.append((
            e['strongs'], e['base_strongs'], e['language'], e['lemma'],
            e['transliteration'], e['pronunciation'], e['part_of_speech'],
            e['short_def'], e['full_def'], e['derivation'], e['kjv_usage'],
            e['lsj_ref'], e['source'],
        ))
        for start, end in e['refs']:
            ref_rows.append((e['strongs'], start, end))

    conn.executemany(
        'INSERT OR REPLACE INTO lexicon '
        '(strongs, base_strongs, language, lemma, transliteration, pronunciation, '
        ' part_of_speech, short_def, full_def, derivation, kjv_usage, lsj_ref, source) '
        'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', rows)

    conn.executemany(
        'INSERT INTO lexicon_refs (strongs, verse_start, verse_end) VALUES (?,?,?)',
        ref_rows)

    conn.executemany(
        'INSERT INTO lexicon_fts (lemma, short_def, full_def, kjv_usage, strongs) '
        'VALUES (?,?,?,?,?)',
        [(r[3], r[7], r[8], r[10], r[0]) for r in rows])

    return len(rows), len(ref_rows)
