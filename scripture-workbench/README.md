# Scripture Workbench

A single-user study environment for expositional work: original-language text
with Strong's and morphology, lexicons, cross-references, and your own notes,
tags, and chains — all visible in parallel on one screen.

Built to run as a static front end on **Catalyst Slate**, backed by **Catalyst
Data Store** for the notes you write and **Catalyst Functions** for the two
translations that can't be stored locally.

---

## What it is for

The primary output is a commentary you write yourself, verse by verse. Every
other feature exists to serve that: the text and lexicon panes are what you
consult while writing, the coverage map is how you see where you are, and
search is how you find your way back into what you have already said.

**One comment per verse.** That constraint is enforced, not suggested. It is
what makes the accumulated notes read as a commentary rather than a pile.
Standalone essays that cut across passages are a separate, unconstrained kind
of note and hang off the spine.

## The one idea that holds it together

Everything joins on a **verse ID**: an integer formatted `BBCCCVVV`.

```
Genesis 1:1      →  1001001
Romans 3:24      → 45003024
Revelation 22:21 → 66022021
```

Verse text, word tokens, lexicon links, cross-references, note anchors, tags,
chains, highlights — all of it keys off this one number. Get it right and
every feature composes. Change it later and you rebuild the whole thing.

## The second idea: two tiers, because the data splits cleanly

Most apps mix reading and writing in one database. This one doesn't have to.

**The reference corpus never changes.** Tagged Greek and Hebrew, Strong's,
LSJ, cross-references, public-domain English texts, dictionaries. Built once
on your machine into a SQLite file, deployed as a static asset, queried
directly in the browser over HTTP range requests. No backend, no rows
consumed, no rate limit, works offline once cached.

**Your work is the only thing that's mutable.** Notes, tags, chains, anchors,
highlights, lexical annotations. A few thousand rows a year. This lives in
Catalyst Data Store and is the only thing that needs backing up.

**Licensed text is never stored at all.** ESV and NKJV are fetched through a
Catalyst function that holds the API keys server-side and caches at chapter
granularity within the providers' storage limits.

## Layout

```
client/              Static front end — deployed to Slate
  index.html
  css/               Design tokens and component styles
  js/
    corpus.js        CorpusSource adapter (seed → sql.js-httpvfs)
    store.js         Store adapter (local → Catalyst Data Store)
    seed.js          Sample corpus for development
    app.js           Panes, rendering, interaction
  data/
    corpus.db        Built artifact — gitignored, see pipeline/

functions/           Catalyst serverless functions
  scripture-proxy/   ESV + API.Bible. Holds the API keys. Only place they exist.
  notes-api/         Data Store CRUD for notes, tags, chains
  backup-cron/       Nightly export of user data to Stratus

db/
  corpus_schema.sql    Read-only reference corpus
  userdata_schema.sql  Catalyst Data Store tables

pipeline/            Corpus build — runs locally, not deployed
  sources.yaml       Every source with its URL and license
  build_corpus.py    Orchestrator
  importers/         One module per source format

docs/
  data-sources.md    Licensing rules per dataset — read before adding sources
  architecture.md    Why the tiers split where they do
  verse-id.md        Verse ID derivation and versification edge cases
```

## Getting started

**Front end, locally.** No build step and no dependencies.

Do NOT open `client/index.html` by double-clicking it. Browsers block ES
modules over the `file://` protocol, and the failure is silent: you get a
styled shell with three empty panes and no error in sight. Nothing is wrong
with the code — it needs to be served over HTTP.

Two ways to see it running:

- **`standalone.html`** in the repo root — the whole app inlined into one
  file with no modules. Double-click it and it works. This is a generated
  build for local viewing only; edit the files under `client/`, never this.
  Regenerate with `python pipeline/build_standalone.py`.

- **Serve `client/` over HTTP** — any static server. If you have Python:
  `cd client && python -m http.server` then open `http://localhost:8000`.

Deployed on Slate it is served over HTTP, so the modular version is what runs
in production and `standalone.html` is never used there.

**Corpus build.** Requires Python 3.11+.

```
cd pipeline
pip install -r requirements.txt

# one stage at a time while the pipeline is incomplete
python build_corpus.py --only lexicon \
    --greek-lexicon "sources/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt"
```

Download source files from the STEPBible repo into `pipeline/sources/` first
(that directory is gitignored). The lexicon stage alone produces a ~14 MB
database with full-text search over 10,847 entries and 47,864 scripture
citations harvested from inside the definitions.

Expect a large file and a slow first run. Rebuild only when a source updates.

**Deploying to Slate.** Slate deploys from a connected GitHub repo and needs
`catalyst.json` present. The one committed here is a starting point —
regenerate it with `catalyst init` in the Catalyst CLI so it matches your
actual project ID and current schema rather than trusting a hand-written file.

API keys go in Catalyst environment variables, read only by
`functions/scripture-proxy`. They must never appear in `client/` — anything
in that directory is public.

Catalyst publishes agent skills for Claude and other coding agents that
generate deployment-ready Catalyst code via Zoho MCP
(`github.com/catalystbyzoho`), which is worth wiring up before doing much
function work.

## Why no framework

Slate natively supports React, Vue, Vite, Next, Astro and the rest, so a
framework was available. It isn't used because the app is three panes and a
word ribbon: the state that a framework would manage is small enough to hold
in plain objects, and the cost — a dependency tree, a build step that can
fail between a push and a deploy, and churn on every upgrade — buys nothing
here. Plain ES modules also mean `index.html` opens and runs directly, which
makes iterating on it far faster.

## Status

- [x] Schemas
- [x] Licensing and source manifest
- [x] Read view — three panes, word ribbon, edition apparatus
- [x] Commentary view — comments read straight through, markdown export
- [x] Coverage map — written vs. not, per chapter
- [x] Search — notes, scripture, lexicon, and the gap finder
- [~] Corpus build pipeline
      - [x] Reference parser (`pipeline/refs.py`) — verified against the documented grammar
      - [x] Lexicon importer — 10,847 real TBESG entries, 47,864 harvested citations
      - [ ] Versification (TVTMS) — must run before tokens
      - [ ] Greek + Hebrew tokens (TAGNT, TAHOT)
      - [ ] English text and cross-references
- [ ] Catalyst functions (scripture-proxy, notes-api, backup-cron)
- [ ] Chains

## Attribution

See `ATTRIBUTION.md`. The CC BY notices are a condition of use, not a
courtesy — they must render in the application, not only in this repository.
