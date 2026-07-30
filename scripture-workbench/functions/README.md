# Catalyst Functions

Not yet implemented. Three are planned, in this order of importance:

## scripture-proxy

The only place ESV and API.Bible keys exist. Never put them in `client/`.

Responsibilities:
- Fetch ESV passages from api.esv.org and NKJV from API.Bible
- Cache at **chapter** granularity in Catalyst Cache, never verse
- Enforce a bounded, evicting cache — ESV terms cap local storage at 500
  verses or half a book, so the cache must have a ceiling and drop the oldest
  entries rather than accumulating
- Track monthly call count against the API.Bible Starter limit of 5,000 and
  degrade gracefully to public-domain text when exhausted, rather than
  failing the request
- Forward the API.Bible FUMS tracking parameter; do not strip it

## notes-api

ZCQL against Data Store for everything in `db/userdata_schema.sql`. Mirrors
the `Store` interface in `client/js/store.js` exactly, so `CatalystStore`
becomes a thin fetch wrapper.

Data Store does not enforce foreign keys or composite primary keys, so this
layer owns: cascade deletes when a note is removed, uniqueness on
`(note_id, tag_id)`, and validation of `note_type` and `anchor_type`.

## backup-cron

Nightly export of the user tables to JSON in Stratus. Set this up before
writing notes in earnest — `corpus.db` is rebuildable in an afternoon and
your notes are not rebuildable at all.
