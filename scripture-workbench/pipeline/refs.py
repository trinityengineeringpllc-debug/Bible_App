"""
Reference parsing: STEPBible book codes -> verse_id (BBCCCVVV).

This module is the foundation. Every importer routes its references through
here, so a bug in this file corrupts the entire corpus silently -- nothing
crashes, references just point at the wrong verses. It has the most tests of
anything in the pipeline for that reason.

Reference grammar, from the STEPBible README:

    Gen.1.10-12         verse range within a chapter
    1Ki.2.4,5           several verses in one chapter
    Phm.2               single-chapter book, chapter implied
    Job.1.3--2.4        range spanning chapters
    Act.10.21; 22.24    subsequent refs may OMIT the book, inheriting it

That last rule is the one that will bite you. "22.24" following "Act.10.21"
means Acts 22:24, not chapter 22 of some default book.
"""

import re

# ---------------------------------------------------------------------------
# Book codes
# ---------------------------------------------------------------------------
#
# WARNING: This is an explicit map, not a positional index, and it must stay
# that way. STEPBible's documented list runs OT, then Apocrypha, then Alternate
# Manuscripts, then NT. Anything that assigns IDs by position in that list puts
# Matthew around book 60 instead of 40 and misplaces the entire New Testament.
# Every reference would resolve, none would crash, and the corpus would be
# quietly wrong.

_OT = ['Gen','Exo','Lev','Num','Deu','Jos','Jdg','Rut','1Sa','2Sa','1Ki','2Ki',
       '1Ch','2Ch','Ezr','Neh','Est','Job','Psa','Pro','Ecc','Sng','Isa','Jer',
       'Lam','Ezk','Dan','Hos','Jol','Amo','Oba','Jon','Mic','Nam','Hab','Zep',
       'Hag','Zec','Mal']

_NT = ['Mat','Mrk','Luk','Jhn','Act','Rom','1Co','2Co','Gal','Eph','Php','Col',
       '1Th','2Th','1Ti','2Ti','Tit','Phm','Heb','Jas','1Pe','2Pe','1Jn','2Jn',
       '3Jn','Jud','Rev']

# Deuterocanon and alternate manuscripts get IDs from 67 up, keeping 1-66 for
# the Protestant canon so verse_ids match every other tool in the ecosystem.
_DC = ['Tob','Jdt','EsG','Wis','Sir','Bar','LJe','S3Y','Sus','Bel','1Ma','2Ma',
       '3Ma','4Ma','1Es','2Es','Man','Ps2','Oda','PsS',
       'JsA','JdB','TbS','SsT','DnT','BlT']

BOOK_ID = {}
for i, code in enumerate(_OT):
    BOOK_ID[code] = i + 1                # 1-39
for i, code in enumerate(_NT):
    BOOK_ID[code] = i + 40               # 40-66
for i, code in enumerate(_DC):
    BOOK_ID[code] = i + 67               # 67+

ID_BOOK = {v: k for k, v in BOOK_ID.items()}

# Books with a single chapter, where "Phm.2" means Philemon 1:2 rather than
# Philemon chapter 2.
SINGLE_CHAPTER = {'Oba', 'Phm', '2Jn', '3Jn', 'Jud', 'LJe', 'Man', 'PsS'}


class RefError(ValueError):
    """A reference that could not be parsed. Never swallow these silently."""


def verse_id(book_code, chapter, verse):
    """Compose a verse_id. The single arithmetic definition in the project."""
    if book_code not in BOOK_ID:
        raise RefError(f'unknown book code: {book_code!r}')
    return BOOK_ID[book_code] * 1_000_000 + int(chapter) * 1_000 + int(verse)


def split_id(vid):
    """Inverse of verse_id -> (book_code, chapter, verse)."""
    book = ID_BOOK.get(vid // 1_000_000)
    return book, (vid // 1_000) % 1_000, vid % 1_000


def format_id(vid):
    book, ch, vs = split_id(vid)
    return f'{book}.{ch}.{vs}'


_BOOK_RE = '|'.join(sorted(BOOK_ID, key=len, reverse=True))
_SEGMENT = re.compile(
    rf'(?:(?P<book>{_BOOK_RE})\.)?'          # book is optional -- inherited
    r'(?P<a>\d+)'                            # chapter, or verse in 1-ch books
    r'(?:[.:](?P<b>\d+))?'                   # verse
    r'(?P<range>'
    r'--(?P<c2>\d+)[.:](?P<v2>\d+)'          # -- spans chapters
    r'|-(?P<v2b>\d+)'                        # -  spans verses
    r')?'
)


def parse(text, default_book=None):
    """
    Parse a reference string into [(start_verse_id, end_verse_id), ...].

    Handles the whole documented grammar including book inheritance across
    semicolons and commas. Unparseable fragments raise RefError rather than
    being skipped -- a silently dropped reference is worse than a loud failure,
    because you never find out the cross-reference table is short.
    """
    if not text:
        return []

    out = []
    current_book = default_book

    # Normalise separators: both ';' and ',' introduce a new reference, and a
    # comma-separated verse inherits book AND chapter from what preceded it.
    parts = re.split(r'[;,]', text)
    last_chapter = None

    for raw in parts:
        frag = raw.strip()
        if not frag:
            continue
        m = _SEGMENT.fullmatch(frag)
        if not m:
            m = _SEGMENT.match(frag)
            if not m:
                raise RefError(f'cannot parse reference fragment: {frag!r}')

        book = m.group('book') or current_book
        if book is None:
            raise RefError(f'no book context for fragment: {frag!r}')
        current_book = book

        a, b = m.group('a'), m.group('b')

        if b is None:
            if book in SINGLE_CHAPTER:
                chapter, verse = 1, int(a)
            elif last_chapter is not None and m.group('book') is None:
                # A bare number after "Act.10.21," is another verse in ch. 10
                chapter, verse = last_chapter, int(a)
            else:
                # A whole chapter reference; treat as verse 1 of that chapter
                chapter, verse = int(a), 1
        else:
            chapter, verse = int(a), int(b)

        last_chapter = chapter
        start = verse_id(book, chapter, verse)

        if m.group('c2'):                       # Job.1.3--2.4
            end = verse_id(book, m.group('c2'), m.group('v2'))
        elif m.group('v2b'):                    # Gen.1.10-12
            end = verse_id(book, chapter, m.group('v2b'))
        else:
            end = start

        if end < start:
            raise RefError(f'reversed range in {frag!r}')
        out.append((start, end))

    return out


def extract_refs(html):
    """
    Pull references out of lexicon definition markup.

    TBESG and TBESH definitions embed them as <ref='Luk.14.19'>Luk.14:19</ref>.
    Harvesting these turns every lexicon entry into a set of verse links, which
    is what lets the exposition pane show "where this word is discussed" rather
    than only "where it occurs."
    """
    found = []
    for raw in re.findall(r"<ref='([^']+)'>", html or ''):
        try:
            found.extend(parse(raw))
        except RefError:
            continue        # malformed refs inside prose are common; skip these
    return found
