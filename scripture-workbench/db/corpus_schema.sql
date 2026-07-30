-- ============================================================================
-- corpus.db — READ-ONLY REFERENCE CORPUS
-- ============================================================================
-- Built once on the local machine, then deployed to Catalyst web hosting as a
-- STATIC ASSET. Queried directly from the browser via sql.js-httpvfs using HTTP
-- range requests, so only the pages actually touched are downloaded.
--
-- Nothing in this file is ever written to at runtime. Rebuild + redeploy when
-- source data updates.
--
-- UNIVERSAL KEY: verse_id INTEGER, formatted BBCCCVVV
--   Genesis 1:1   =  1001001
--   Matthew 1:1   = 40001001
--   Revelation 22:21 = 66022021
-- Every table in both databases joins on this. Do not deviate.
-- ============================================================================

PRAGMA journal_mode = OFF;      -- read-only artifact, no WAL needed
PRAGMA page_size = 4096;        -- matches sql.js-httpvfs range-request granularity


-- ----------------------------------------------------------------------------
-- CANON
-- ----------------------------------------------------------------------------

CREATE TABLE books (
    book_id         INTEGER PRIMARY KEY,   -- 1-39 OT, 40-66 NT, 67+ reserved
    osis_code       TEXT NOT NULL UNIQUE,  -- 'Gen', 'Matt', 'Rev'
    name_en         TEXT NOT NULL,
    abbrev_en       TEXT NOT NULL,
    testament       TEXT NOT NULL CHECK (testament IN ('OT','NT','DC')),
    chapter_count   INTEGER NOT NULL,
    canonical_order INTEGER NOT NULL
);

CREATE TABLE translations (
    translation_id  TEXT PRIMARY KEY,      -- 'KJV','ASV','WEB','THGNT','WLC'
    name            TEXT NOT NULL,
    language        TEXT NOT NULL,         -- ISO 639-3: 'eng','grc','hbo'
    year            INTEGER,
    license         TEXT NOT NULL,         -- 'PD', 'CC BY 4.0', etc.
    attribution     TEXT,                  -- required notice, rendered in UI
    source_url      TEXT,
    is_local        INTEGER NOT NULL DEFAULT 1  -- 0 = fetched live via API
);

-- ----------------------------------------------------------------------------
-- VERSE TEXT (public-domain + open-licensed translations only)
-- ----------------------------------------------------------------------------
-- NKJV and ESV are deliberately absent. They are never stored — see the
-- licensed-text proxy in the Catalyst functions layer.

CREATE TABLE verses (
    translation_id  TEXT NOT NULL REFERENCES translations(translation_id),
    verse_id        INTEGER NOT NULL,
    text            TEXT NOT NULL,
    PRIMARY KEY (translation_id, verse_id)
) WITHOUT ROWID;

CREATE INDEX ix_verses_verse ON verses(verse_id);

CREATE VIRTUAL TABLE verses_fts USING fts5(
    text,
    translation_id UNINDEXED,
    verse_id       UNINDEXED,
    tokenize = 'porter unicode61'
);

-- ----------------------------------------------------------------------------
-- VERSIFICATION (from STEPBible TVTMS)
-- ----------------------------------------------------------------------------
-- Hebrew, Greek, Latin and English traditions disagree on verse boundaries —
-- Psalm superscriptions, Joel, Malachi, 3 John, and others. Without this table
-- your parallel panes silently drift apart in exactly those places.
-- Canonical internal representation is the ENG tradition; everything maps to it.

CREATE TABLE versification_map (
    tradition       TEXT NOT NULL,      -- 'HEB','GRK','LAT','ENG'
    source_verse_id INTEGER NOT NULL,
    target_verse_id INTEGER NOT NULL,   -- standardized ENG verse_id
    relation        TEXT,               -- 'exact','split','merge','absent'
    note            TEXT,
    PRIMARY KEY (tradition, source_verse_id)
) WITHOUT ROWID;

-- ----------------------------------------------------------------------------
-- ORIGINAL-LANGUAGE TOKENS (from STEPBible TAGNT + TAHOT, CC BY 4.0)
-- ----------------------------------------------------------------------------
-- One row per word. This is the Strong's layer and the heart of the app.

CREATE TABLE tokens (
    token_id    INTEGER PRIMARY KEY,
    verse_id    INTEGER NOT NULL,
    position    INTEGER NOT NULL,   -- word order within the verse, 1-based
    surface     TEXT NOT NULL,      -- inflected form as printed
    lemma       TEXT,               -- dictionary form
    strongs     TEXT,               -- extended Strong's: 'G0032', 'H0430a'
    morph       TEXT,               -- Robinson (Greek) / OSHB (Hebrew) code
    gloss       TEXT,               -- context-sensitive English gloss
    language    TEXT NOT NULL CHECK (language IN ('grc','hbo','arc')),
    UNIQUE (verse_id, position)
);

CREATE INDEX ix_tokens_verse   ON tokens(verse_id, position);
CREATE INDEX ix_tokens_strongs ON tokens(strongs);
CREATE INDEX ix_tokens_lemma   ON tokens(lemma);

-- Variant apparatus. TAGNT marks each Greek word with which printed editions
-- contain it. Storing this costs almost nothing and cannot be reconstructed
-- later without a full re-import.
CREATE TABLE token_editions (
    token_id    INTEGER NOT NULL REFERENCES tokens(token_id),
    edition     TEXT NOT NULL,      -- 'THGNT','NA28','NA27','SBLGNT','TR',
                                    -- 'BYZ','WH','TREG'
    PRIMARY KEY (token_id, edition)
) WITHOUT ROWID;

CREATE INDEX ix_token_editions_edition ON token_editions(edition);

-- Default reading surface: Tyndale House / Cambridge GNT.
CREATE VIEW v_thgnt AS
SELECT t.*
FROM tokens t
JOIN token_editions e ON e.token_id = t.token_id AND e.edition = 'THGNT';

-- Words where the editions disagree — drives the apparatus indicator in the UI.
CREATE VIEW v_variant_words AS
SELECT t.verse_id, t.position, t.surface, t.strongs,
       GROUP_CONCAT(e.edition, ',') AS editions,
       COUNT(e.edition) AS edition_count
FROM tokens t
JOIN token_editions e ON e.token_id = t.token_id
WHERE t.language = 'grc'
GROUP BY t.token_id
HAVING edition_count < 8;

-- ----------------------------------------------------------------------------
-- ESV WORD TAGS (from STEPBible TTESV, CC BY-NC)
-- ----------------------------------------------------------------------------
-- Strong's alignment for the ESV, stored WITHOUT the ESV text itself. At render
-- time these positions are zipped against text fetched live from api.esv.org.
-- Import note: strip any ESV surface-form column from the source file before
-- loading — keep only position + Strong's code.

CREATE TABLE esv_tags (
    verse_id    INTEGER NOT NULL,
    position    INTEGER NOT NULL,
    strongs     TEXT NOT NULL,
    PRIMARY KEY (verse_id, position)
) WITHOUT ROWID;

-- ----------------------------------------------------------------------------
-- LEXICON (Strong's PD + STEPBible TBESG/TBESH/TFLSJ, CC BY 4.0)
-- ----------------------------------------------------------------------------

CREATE TABLE lexicon (
    strongs         TEXT PRIMARY KEY,   -- extended: 'G0032', 'H0430a'
    base_strongs    TEXT,               -- classic: 'G32', 'H430' — for lookup
                                        -- from printed concordances
    language        TEXT NOT NULL,
    lemma           TEXT NOT NULL,
    transliteration TEXT,
    pronunciation   TEXT,
    part_of_speech  TEXT,
    short_def       TEXT,
    full_def        TEXT,
    derivation      TEXT,
    kjv_usage       TEXT,               -- Strong's original usage list
    lsj_ref         TEXT,               -- links into TFLSJ
    source          TEXT NOT NULL       -- 'Strongs','TBESG','TBESH','TFLSJ'
) WITHOUT ROWID;

CREATE INDEX ix_lexicon_base  ON lexicon(base_strongs);
CREATE INDEX ix_lexicon_lemma ON lexicon(lemma);

-- Scripture references harvested from inside lexicon definitions.
-- Abbott-Smith cites verses constantly; extracting those citations turns every
-- entry into a set of verse links. This is what powers "where is this word
-- DISCUSSED" as distinct from "where does it OCCUR" -- the occurrence list
-- comes from `tokens`, this comes from the lexicographers.
CREATE TABLE lexicon_refs (
    strongs     TEXT NOT NULL REFERENCES lexicon(strongs),
    verse_start INTEGER NOT NULL,
    verse_end   INTEGER NOT NULL
);

CREATE INDEX ix_lexrefs_strongs ON lexicon_refs(strongs);
CREATE INDEX ix_lexrefs_verse   ON lexicon_refs(verse_start, verse_end);

CREATE VIRTUAL TABLE lexicon_fts USING fts5(
    lemma, short_def, full_def, kjv_usage,
    strongs UNINDEXED,
    tokenize = 'porter unicode61'
);

-- ----------------------------------------------------------------------------
-- CROSS-REFERENCES (TSK, PD + OpenBible.info, CC BY)
-- ----------------------------------------------------------------------------

CREATE TABLE cross_refs (
    from_verse_id   INTEGER NOT NULL,
    to_verse_start  INTEGER NOT NULL,
    to_verse_end    INTEGER NOT NULL,
    source          TEXT NOT NULL,      -- 'TSK','OpenBible'
    votes           INTEGER DEFAULT 0   -- OpenBible relevance ranking
);

CREATE INDEX ix_xref_from ON cross_refs(from_verse_id, votes DESC);
CREATE INDEX ix_xref_to   ON cross_refs(to_verse_start, to_verse_end);

-- ----------------------------------------------------------------------------
-- TOPICAL INDEX (Nave's / Torrey's, PD)
-- ----------------------------------------------------------------------------
-- Read-only starting point. Your own chains live in the user database and are
-- what actually replaces Thompson.

CREATE TABLE topics (
    topic_id        INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    parent_topic_id INTEGER REFERENCES topics(topic_id),
    source          TEXT NOT NULL       -- 'Naves','Torrey'
);

CREATE INDEX ix_topics_parent ON topics(parent_topic_id);
CREATE INDEX ix_topics_name   ON topics(name);

CREATE TABLE topic_refs (
    topic_id        INTEGER NOT NULL REFERENCES topics(topic_id),
    verse_start     INTEGER NOT NULL,
    verse_end       INTEGER NOT NULL,
    sort_order      INTEGER
);

CREATE INDEX ix_topic_refs_topic ON topic_refs(topic_id, sort_order);
CREATE INDEX ix_topic_refs_verse ON topic_refs(verse_start, verse_end);

-- ----------------------------------------------------------------------------
-- REFERENCE ARTICLES (Easton's, ISBE, Matthew Henry, Barnes, JFB — all PD)
-- ----------------------------------------------------------------------------
-- One generic shape for dictionaries and commentaries. entry_type distinguishes
-- them so the exposition pane can filter.

CREATE TABLE articles (
    article_id  INTEGER PRIMARY KEY,
    source      TEXT NOT NULL,      -- 'Eastons','ISBE','MatthewHenry','Barnes'
    entry_type  TEXT NOT NULL,      -- 'dictionary','commentary','introduction'
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,      -- markdown or lightly-tagged HTML
    sort_key    TEXT
);

CREATE INDEX ix_articles_source ON articles(source, sort_key);

CREATE TABLE article_refs (
    article_id  INTEGER NOT NULL REFERENCES articles(article_id),
    verse_start INTEGER NOT NULL,
    verse_end   INTEGER NOT NULL
);

CREATE INDEX ix_article_refs_verse ON article_refs(verse_start, verse_end);

CREATE VIRTUAL TABLE articles_fts USING fts5(
    title, body,
    article_id UNINDEXED,
    source     UNINDEXED,
    tokenize = 'porter unicode61'
);

-- ----------------------------------------------------------------------------
-- PROPER NAMES (STEPBible TIPNR, CC BY 4.0)
-- ----------------------------------------------------------------------------
-- Disambiguated people and places — there are several distinct Marys and
-- several distinct Antiochs, and TIPNR keeps them apart.

CREATE TABLE proper_names (
    name_id         INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    transliteration TEXT,
    strongs         TEXT,
    entity_type     TEXT,           -- 'person','place','group','other'
    description     TEXT
);

CREATE INDEX ix_proper_names_name ON proper_names(name);

CREATE TABLE proper_name_refs (
    name_id     INTEGER NOT NULL REFERENCES proper_names(name_id),
    verse_id    INTEGER NOT NULL
);

CREATE INDEX ix_pnr_name  ON proper_name_refs(name_id);
CREATE INDEX ix_pnr_verse ON proper_name_refs(verse_id);

-- ----------------------------------------------------------------------------
-- PERICOPES
-- ----------------------------------------------------------------------------
-- Passage units for pericope-level exposition anchoring. Seed from a PD
-- outline; editable copies live in the user database.

CREATE TABLE pericopes (
    pericope_id INTEGER PRIMARY KEY,
    verse_start INTEGER NOT NULL,
    verse_end   INTEGER NOT NULL,
    title       TEXT NOT NULL,
    source      TEXT NOT NULL
);

CREATE INDEX ix_pericopes_verse ON pericopes(verse_start, verse_end);

-- ----------------------------------------------------------------------------
-- BUILD-TIME OPTIMIZATION
-- ----------------------------------------------------------------------------
-- Run after all imports, before deploying. VACUUM is important: it compacts the
-- file so range requests hit fewer pages.

-- ANALYZE;
-- VACUUM;
