# Verse IDs and versification

## Format

`BBCCCVVV` as an integer. Book 1-66, chapter zero-padded to 3, verse
zero-padded to 3.

    verse_id = book_id * 1_000_000 + chapter * 1_000 + verse

    Genesis 1:1       1001001
    Psalm 119:176    19119176
    Romans 3:24      45003024
    Revelation 22:21 66022021

Sorting by `verse_id` gives canonical order for free. Range queries
(`start <= x AND end >= x`) are how every anchor, cross-reference, and
highlight resolves, which is why the composite indexes in both schemas lead
with these columns.

## The part that will bite you

Verse numbering is not universal. The Hebrew, Greek, Latin, and English
traditions disagree, and the disagreements are concentrated in places you
will actually study:

- **Psalm superscriptions** are verse 1 in Hebrew and unnumbered in English,
  so most of the Psalter is offset by one between the Hebrew text and any
  English translation.
- **Joel** — Hebrew has 4 chapters, English has 3.
- **Malachi** — Hebrew has 3 chapters, English has 4.
- **3 John** — some editions have 14 verses, some 15.
- Scattered single-verse splits and merges elsewhere.

If you ignore this, the parallel panes drift apart silently and only in the
places where precision matters most.

## How this project handles it

The **English tradition is the canonical internal representation.** Every
verse ID in every table is an ENG-tradition ID.

`versification_map` in `corpus.db` holds the mappings, imported from
STEPBible's TVTMS dataset. Hebrew and Greek source data is translated to ENG
IDs **at import time**, not at query time — so nothing downstream has to know
that the problem exists.

The `relation` column records how each mapping behaved (`exact`, `split`,
`merge`, `absent`) so the UI can flag a passage where the underlying Hebrew
divides differently than the English display suggests. That flag is worth
surfacing in the word ribbon: it is exactly the kind of detail that belongs
in a footnote of a serious expositional note.
