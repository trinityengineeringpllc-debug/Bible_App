-- ============================================================================
-- USER DATA — Catalyst Data Store
-- ============================================================================
-- Everything you create: notes, tags, chains, highlights, lexical annotations.
-- Small (a few thousand rows a year), frequently written, and the only thing
-- in the system that actually needs backing up.
--
-- Written here as standard SQL DDL because that is the clearest source of
-- truth. See the CATALYST TRANSLATION NOTES at the bottom before creating
-- these tables in the Catalyst console — Data Store is not plain SQLite and a
-- few things do not carry over.
--
-- Joins to the corpus are by verse_id (BBCCCVVV) and by strongs. They are
-- CROSS-DATABASE joins performed in the client, not in SQL — the corpus lives
-- in the browser, this lives in Catalyst. Design queries accordingly: fetch a
-- verse range's anchors from Catalyst, then resolve them against corpus.db
-- locally.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------
-- All three note styles are one object. They differ only in how many anchors
-- they carry and how they are displayed.
--
--   'annotation' — pinned to a verse or short range; shows inline in the
--                  text pane margin
--   'exposition' — pericope-level; shows in the exposition pane when the
--                  passage is in view
--   'document'   — standalone essay; shows in the notes pane, and surfaces
--                  as a backlink wherever any of its anchors are in view
--
-- Keeping one table means one query powers the notes pane regardless of type,
-- and a note can be promoted from annotation to document without migration.

CREATE TABLE notes (
    note_id     INTEGER PRIMARY KEY,
    note_type   TEXT NOT NULL
                CHECK (note_type IN ('annotation','exposition','document')),
    title       TEXT,
    body_md     TEXT NOT NULL DEFAULT '',
    is_pinned   INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE INDEX ix_notes_type    ON notes(note_type, updated_at DESC);
CREATE INDEX ix_notes_updated ON notes(updated_at DESC);

-- ----------------------------------------------------------------------------
-- NOTE ANCHORS
-- ----------------------------------------------------------------------------
-- The join that makes all three note styles behave uniformly. One note, many
-- anchors. An annotation has one; a document may have forty.
--
-- 'primary' marks the anchor a document is *about* as opposed to ones it
-- merely cites — so the notes pane can distinguish "this passage is the
-- subject" from "this passage is referenced."

CREATE TABLE note_anchors (
    anchor_id       INTEGER PRIMARY KEY,
    note_id         INTEGER NOT NULL REFERENCES notes(note_id),
    anchor_type     TEXT NOT NULL
                    CHECK (anchor_type IN ('verse_range','pericope','reference')),
    start_verse_id  INTEGER NOT NULL,
    end_verse_id    INTEGER NOT NULL,
    is_primary      INTEGER NOT NULL DEFAULT 0,
    label           TEXT,           -- optional display override
    sort_order      INTEGER NOT NULL DEFAULT 0
);

-- The workhorse index. "Which notes touch the passage on screen?" resolves to:
--   WHERE start_verse_id <= :view_end AND end_verse_id >= :view_start
CREATE INDEX ix_anchors_range ON note_anchors(start_verse_id, end_verse_id);
CREATE INDEX ix_anchors_note  ON note_anchors(note_id, sort_order);

-- ----------------------------------------------------------------------------
-- THE ONE-COMMENT-PER-VERSE RULE
-- ----------------------------------------------------------------------------
-- A "comment" is an annotation note whose primary anchor STARTS at a given
-- verse. There is at most one per verse. This is the commentary spine: it is
-- what makes the commentary readable straight through, and it is what lets the
-- editor say "you have already written here, saving revises it" instead of
-- quietly creating a duplicate you will find two years later and not be able
-- to adjudicate between.
--
-- Exposition and document notes are deliberately NOT constrained. Many essays
-- may point at the same passage. The spine is single; the thematic work
-- hanging off it is not.
--
-- SQLite could express this as a partial unique index:
--
--   CREATE UNIQUE INDEX ux_one_comment_per_verse
--     ON note_anchors(start_verse_id)
--     WHERE is_primary = 1
--       AND note_id IN (SELECT note_id FROM notes WHERE note_type = 'annotation');
--
-- ...except that partial indexes cannot contain subqueries, and Catalyst Data
-- Store has no partial unique indexes at all. So the rule is enforced in the
-- application layer instead: LocalStore.upsertComment() today, and notes-api
-- server-side once CatalystStore is implemented. If you ever write a second
-- client against this data, it must enforce the same rule.

-- ----------------------------------------------------------------------------
-- TAGS
-- ----------------------------------------------------------------------------
-- Hierarchical. parent_tag_id lets you build 'Soteriology > Justification >
-- Imputation' and query the whole subtree.

CREATE TABLE tags (
    tag_id        INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    parent_tag_id INTEGER REFERENCES tags(tag_id),
    color         TEXT,
    description   TEXT,
    created_at    TEXT NOT NULL
);

CREATE INDEX ix_tags_parent ON tags(parent_tag_id);
CREATE UNIQUE INDEX ux_tags_name_parent ON tags(name, parent_tag_id);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(note_id),
    tag_id  INTEGER NOT NULL REFERENCES tags(tag_id),
    PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX ix_note_tags_tag ON note_tags(tag_id);

-- Tag scripture directly, without needing a note as an intermediary.
CREATE TABLE verse_tags (
    verse_tag_id   INTEGER PRIMARY KEY,
    tag_id         INTEGER NOT NULL REFERENCES tags(tag_id),
    start_verse_id INTEGER NOT NULL,
    end_verse_id   INTEGER NOT NULL,
    created_at     TEXT NOT NULL
);

CREATE INDEX ix_verse_tags_range ON verse_tags(start_verse_id, end_verse_id);
CREATE INDEX ix_verse_tags_tag   ON verse_tags(tag_id);

-- ----------------------------------------------------------------------------
-- CHAINS — your Thompson replacement
-- ----------------------------------------------------------------------------
-- An ordered walk through scripture on a theme. The ordering is the whole
-- point and is what distinguishes a chain from a tag: a tag is a set, a chain
-- is a path with a beginning and an end.

CREATE TABLE chains (
    chain_id    INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    tag_id      INTEGER REFERENCES tags(tag_id),  -- optional topical link
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE chain_links (
    link_id        INTEGER PRIMARY KEY,
    chain_id       INTEGER NOT NULL REFERENCES chains(chain_id),
    seq            INTEGER NOT NULL,
    start_verse_id INTEGER NOT NULL,
    end_verse_id   INTEGER NOT NULL,
    note           TEXT,       -- why this link is here / what it contributes
    UNIQUE (chain_id, seq)
);

CREATE INDEX ix_chain_links_chain ON chain_links(chain_id, seq);
CREATE INDEX ix_chain_links_verse ON chain_links(start_verse_id, end_verse_id);

-- ----------------------------------------------------------------------------
-- LEXICAL NOTES
-- ----------------------------------------------------------------------------
-- Your own accumulated observations on a Greek or Hebrew word, keyed to the
-- extended Strong's number. Displays in the lexicon pane beneath the published
-- entry. Over time this becomes the most valuable table in the system.

CREATE TABLE strongs_notes (
    strongs     TEXT PRIMARY KEY,
    body_md     TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- HIGHLIGHTS
-- ----------------------------------------------------------------------------

CREATE TABLE highlights (
    highlight_id   INTEGER PRIMARY KEY,
    start_verse_id INTEGER NOT NULL,
    end_verse_id   INTEGER NOT NULL,
    color          TEXT NOT NULL,
    created_at     TEXT NOT NULL
);

CREATE INDEX ix_highlights_range ON highlights(start_verse_id, end_verse_id);

-- ----------------------------------------------------------------------------
-- USER PERICOPES
-- ----------------------------------------------------------------------------
-- Your own passage divisions, overriding the seeded ones from corpus.db where
-- you disagree with the received outline.

CREATE TABLE user_pericopes (
    pericope_id INTEGER PRIMARY KEY,
    verse_start INTEGER NOT NULL,
    verse_end   INTEGER NOT NULL,
    title       TEXT NOT NULL,
    created_at  TEXT NOT NULL
);

CREATE INDEX ix_user_pericopes_verse ON user_pericopes(verse_start, verse_end);

-- ----------------------------------------------------------------------------
-- APP STATE
-- ----------------------------------------------------------------------------
-- Last reading position, pane layout, active translation set, pane sync mode.

CREATE TABLE app_state (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,      -- JSON
    updated_at  TEXT NOT NULL
);


-- ============================================================================
-- CATALYST TRANSLATION NOTES
-- ============================================================================
-- Data Store is a managed relational store queried with ZCQL, not SQLite.
-- Differences that matter here:
--
-- 1. ROWID
--    Every Data Store table gets an auto-generated ROWID as its primary key.
--    Do not declare your own INTEGER PRIMARY KEY columns — let Catalyst supply
--    ROWID and treat it as note_id, tag_id, etc. Adjust the foreign-key
--    columns above to hold ROWID values (BIGINT).
--
-- 2. FOREIGN KEYS AND CHECK CONSTRAINTS
--    Not enforced the way they are here. The REFERENCES and CHECK clauses
--    above are documentation of intent — enforce them in the Node function
--    layer. In particular, validate note_type and anchor_type on write, and
--    cascade-delete note_anchors and note_tags yourself when a note is deleted.
--
-- 3. COMPOSITE PRIMARY KEYS
--    note_tags uses one above. In Data Store, create it with a ROWID PK and a
--    unique index on (note_id, tag_id) instead.
--
-- 4. INDEXES
--    Set per-column in the Data Store console. The range indexes above are the
--    ones that matter for performance — index start_verse_id and end_verse_id
--    on note_anchors, verse_tags, chain_links, and highlights.
--
-- 5. FULL-TEXT SEARCH ON YOUR NOTES
--    Catalyst Search Integration indexes Data Store columns and will serve
--    "find my notes mentioning X" well enough at this volume. If it proves
--    limiting, the fallback is to mirror notes into a client-side FTS5 table
--    on load — a few thousand rows is nothing.
--
-- 6. BACKUP
--    This database is irreplaceable; corpus.db is not. Set a CRON function to
--    export these tables to JSON in Stratus object storage nightly. Do this
--    before you start writing notes in earnest, not after.
-- ============================================================================
