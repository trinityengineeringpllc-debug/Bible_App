# Data sources and licensing

Every dataset in this project falls into one of three buckets. The bucket
determines where the data is allowed to live, and that constraint shapes the
whole architecture. Read this before adding any new source.

---

## Bucket 1 — Owned outright

Public domain or open-licensed. Downloaded once, built into `corpus.db`,
deployed as a static asset, queried directly in the browser. No API, no
runtime dependency, no rate limit, no expiry.

### Original languages and tagging

**STEPBible-Data** — the foundation of this project.
`https://github.com/STEPBible/STEPBible-Data` — CC BY 4.0.

Created by Tyndale House Cambridge, now curated by STEPBible. The license
permits inclusion in any software without requesting permission, requires
that changes to the data be recorded and made available, and requires
pointing others back to the repository as the source.

| File | Contents |
|---|---|
| `TAGNT` | Greek NT. Contains all words in NA27/28, TR, SBLGNT, Tregelles, Byzantine, Westcott-Hort, and THGNT, with each word marked for which editions contain it. Punctuation follows THGNT. → `tokens`, `token_editions` |
| `TAHOT` | Hebrew OT. Leningrad Codex via Westminster/OpenScriptures, corrected against colour scans, full morphology and semantic tags on every word, prefix, and suffix. → `tokens` |
| `TBESG` | Brief lexicon of extended Strong's, Greek. → `lexicon` |
| `TBESH` | Brief lexicon of extended Strong's, Hebrew. → `lexicon` |
| `TFLSJ` | Formatted full Liddell-Scott-Jones. → `lexicon` (deep entries) |
| `TEGMC` / `TEHMC` | Expanded explanations of Greek/Hebrew morphology codes — parsing, meaning, examples. → morphology decoder in the word ribbon |
| `TIPNR` | Individualised proper names with all references. Disambiguates the several distinct Marys and the several distinct Antiochs. → `proper_names` |
| `TVTMS` | Versification traditions with standardisation methodology for English, Hebrew, Latin, Greek. → `versification_map` |
| `TTESV` | **CC BY-NC** (note: different license) Strong's tags for the ESV. See Bucket 3 caution. |

**Important on Strong's numbers:** STEPBible uses *extended* Strong's —
`H0430a` and `H0430b` where a printed concordance has only `H430`. The
`lexicon.base_strongs` column preserves the classic number so lookups from a
physical Strong's still work.

### English translations (public domain)

| Text | Source | Notes |
|---|---|---|
| KJV | Multiple; prefer a Strong's-tagged edition | Baseline. Pairs with Strong's, which was built against it. |
| ASV (1901) | `github.com/openbibleinfo/American-Standard-Version-Bible` — USX format | Full text, footnotes, formatting. |
| WEB | `ebible.org` | Public domain, modern English. Closest freely-owned stand-in for a contemporary translation. |
| YLT, Darby | Widely mirrored | Optional; useful for wooden-literal comparison. |

### Cross-references and topical

| Dataset | Source | License |
|---|---|---|
| Treasury of Scripture Knowledge | Widely mirrored; ~500k references compiled by R.A. Torrey from Thomas Scott's Commentary and the Comprehensive Bible | Public domain |
| OpenBible cross-references | `openbible.info/labs/cross-references/` — ~340k references drawn primarily from TSK, with relevance votes | CC BY |
| Nave's Topical Bible | Public domain (1897) | Public domain |
| Torrey's New Topical Textbook | Public domain | Public domain |

The OpenBible set is the more useful of the two cross-reference sources at
runtime because the vote counts let the UI rank references instead of dumping
all of them. Import both; TSK gives coverage, OpenBible gives ordering.

### Reference articles

Easton's Bible Dictionary (1897), ISBE (1915), Matthew Henry, Barnes' Notes,
Jamieson-Fausset-Brown, Gill — all public domain, all widely available as
clean text. **Do not attempt to extract these from any commercial platform
you own them on.** Free copies are cleaner, already structured, and legal to
redistribute.

---

## Bucket 2 — Licensed, fetched live, never stored

These are the translations that cannot go in `corpus.db` under any
circumstances. They are fetched at read time through
`functions/scripture-proxy` and held only in a short-lived cache.

### ESV — Crossway, `api.esv.org`

Free for non-commercial use. Constraints that directly shape the code:

- **No more than 500 verses stored locally**, or one-half of any book,
  whichever is less. This is the hard one. The proxy cache must be bounded
  and evicting, not accumulating.
- Max 500 verses per query, 5,000 queries/day, 1,000/hour, 60/minute.
- Attribution notice required on display.
- Access is granted per-application and may require staff approval.

### NKJV — via API.Bible (American Bible Society)

Thomas Nelson / HarperCollins Christian Publishing hold the copyright. Their
standing gratis allowance caps at 500 verses, under 25% of the work, no
complete book, and **explicitly excludes use in a commentary or other
biblical reference work** — which is exactly what this project is. A direct
license would be a custom negotiation.

API.Bible solves this. Free Starter plan: non-commercial, 5,000 API calls per
month, choice of three copyrighted translations from a catalogue that
includes NKJV, ESV, NASB, CSB, NLT and others.

**5,000/month is the binding constraint in this whole system** — roughly 165
calls a day. Cache at chapter granularity, not verse. Never fetch
speculatively for panes that aren't visible.

API.Bible also runs FUMS (Fair Use Management System) tracking; the proxy
must forward the tracking parameter rather than stripping it.

### What not to use

Several GitHub projects and public endpoints serve ESV, NIV, and NASB with no
visible license. They are redistributing copyrighted text without permission.
They will be taken down, and building on them means an outage plus a
rebuild. Ignore them.

---

## Bucket 3 — Open license, but handle with care

**TTESV** (STEPBible) is CC BY-**NC** — non-commercial only, unlike the rest
of the repo which is CC BY 4.0. It maps Strong's numbers onto ESV word
positions.

The import must **strip any ESV surface-form column and keep only position +
Strong's code**. Storing the tags is fine; storing the words they attach to
would be storing the ESV. At render time the positions are zipped against
text fetched live from the ESV API.

This is what reproduces the behaviour of a purchased ESV-with-Strong's module
without holding the ESV text.

---

## The one you cannot have

**Thompson Chain-Reference.** The chain system is Kirkbride Bible Company's
copyrighted work. There is no licensed dataset for third-party applications
and no realistic path to one for a personal project.

The replacement is the `chains` / `chain_links` tables in
`db/userdata_schema.sql`, seeded from Nave's and TSK. A chain you build
yourself — ordered, annotated, reflecting your own exegetical path through a
theme — is more useful for expositional work than someone else's taxonomy.
This is a feature, not a compromise.

---

## Attribution obligations

CC BY licenses require attribution *in the application*, not just in the
repository. `ATTRIBUTION.md` holds the canonical notices and the UI renders
them from `translations.attribution` and a static credits panel. Do not skip
this — it is the actual condition on which the STEPBible data is usable.
