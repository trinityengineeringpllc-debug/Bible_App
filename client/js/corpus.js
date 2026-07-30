/**
 * CorpusSource — read access to the immutable reference corpus.
 *
 * Two implementations behind one interface:
 *
 *   SeedCorpus     in-memory sample, no network, used for development
 *   SqliteCorpus   the real corpus.db over sql.js-httpvfs (not yet wired)
 *
 * Every method returns a promise even when the seed answers synchronously, so
 * swapping implementations changes nothing in the calling code.
 */

import {
  BOOKS, TRANSLATIONS, VERSES, LEXICON, CROSS_REFS, PERICOPES,
  parseTokens
} from './seed.js';

export class SeedCorpus {
  get name() { return 'seed'; }

  async books()        { return BOOKS; }
  async translations() { return TRANSLATIONS; }

  /** Verse rows for one translation across an inclusive verse_id range. */
  async verses(translationId, start, end) {
    const table = VERSES[translationId] || {};
    return Object.keys(table)
      .map(Number)
      .filter(id => id >= start && id <= end)
      .sort((a, b) => a - b)
      .map(id => ({ verse_id: id, text: table[id] }));
  }

  async tokens(start, end) {
    const out = [];
    for (let id = start; id <= end; id++) {
      const t = parseTokens(id);
      if (t.length) out.push(...t);
    }
    return out;
  }

  async lexicon(strongs) {
    const entry = LEXICON[strongs];
    return entry ? { strongs, ...entry } : null;
  }

  async crossRefs(verseId) {
    return (CROSS_REFS[verseId] || []).slice().sort((a, b) => b.votes - a.votes);
  }

  async pericopeFor(verseId) {
    return PERICOPES.find(p => verseId >= p.start && verseId <= p.end) || null;
  }

  async pericopes() { return PERICOPES; }

  /** Which passages the seed actually contains — drives the navigator. */
  async availableRanges() {
    return PERICOPES.map(p => ({ ...p }));
  }

  // -- search surfaces -------------------------------------------------------
  //
  // These are what let a search cross between your notes and the text. Because
  // both key on verse_id, "where does this word occur that I have NOT written
  // on" is a set difference, not a heuristic. No study app that licenses its
  // corpus can answer that question — it needs to own both halves.

  /** Every verse_id the corpus has original-language tokens for. */
  async taggedVerses() {
    const ids = [];
    for (const p of PERICOPES) {
      for (let id = p.start; id <= p.end; id++) {
        if (parseTokens(id).length) ids.push(id);
      }
    }
    return ids;
  }

  /** Verse IDs where a Strong's number occurs, with the inflected forms. */
  async occurrencesOf(strongs) {
    const out = [];
    for (const id of await this.taggedVerses()) {
      const hits = parseTokens(id).filter(t => t.strongs === strongs);
      if (hits.length) out.push({ verse_id: id, forms: hits.map(h => h.surface), count: hits.length });
    }
    return out;
  }

  /** Resolve a query to a Strong's number: a code, a lemma, or a gloss. */
  async resolveStrongs(query) {
    const q = query.trim();
    const code = q.toUpperCase().replace(/^([GH])\s*0*(\d+)$/, (_, l, n) => l + String(n).padStart(4, '0'));
    if (LEXICON[code]) return code;
    const lower = q.toLowerCase();
    for (const [s, e] of Object.entries(LEXICON)) {
      if (e.lemma === q || e.translit.toLowerCase() === lower) return s;
    }
    for (const [s, e] of Object.entries(LEXICON)) {
      if (e.short.toLowerCase().includes(lower)) return s;
    }
    return null;
  }

  /** Substring search over local translation text and Greek surface forms. */
  async searchText(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits = [];
    for (const [tid, table] of Object.entries(VERSES)) {
      for (const [idStr, text] of Object.entries(table)) {
        if (text.toLowerCase().includes(q)) {
          hits.push({ verse_id: Number(idStr), translation: tid, text });
        }
      }
    }
    return hits.sort((a, b) => a.verse_id - b.verse_id);
  }

  async lexiconSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.entries(LEXICON)
      .filter(([s, e]) =>
        s.toLowerCase().includes(q) || e.lemma.includes(query.trim()) ||
        e.translit.toLowerCase().includes(q) || e.short.toLowerCase().includes(q) ||
        e.full.toLowerCase().includes(q))
      .map(([strongs, e]) => ({ strongs, ...e }));
  }

  decodeMorph(code) { return decodeMorph(code); }
}

/**
 * The real corpus. Wire this up once pipeline/build_corpus.py has produced
 * client/data/corpus.db.
 *
 * Implementation sketch:
 *   import { createDbWorker } from 'sql.js-httpvfs';
 *   this.worker = await createDbWorker(
 *     [{ from: 'inline', config: { serverMode: 'full',
 *        url: '/data/corpus.db', requestChunkSize: 4096 } }],
 *     workerUrl, wasmUrl);
 *   ...then each method becomes a single SQL query against the schema in
 *   db/corpus_schema.sql. Page size there is 4096 to match requestChunkSize.
 *
 * Nothing in app.js changes.
 */
export class SqliteCorpus {
  get name() { return 'sqlite'; }
  constructor(dbUrl = '/data/corpus.db') { this.dbUrl = dbUrl; }
  async init() { throw new Error('SqliteCorpus is not wired up yet. Build corpus.db first.'); }
}

// ---------------------------------------------------------------------------
// Morphology decoding
// ---------------------------------------------------------------------------

const TENSE = { P: 'present', I: 'imperfect', F: 'future', A: 'aorist', R: 'perfect', L: 'pluperfect', '2A': 'aorist', '2R': 'perfect', '2F': 'future' };
const VOICE = { A: 'active', M: 'middle', P: 'passive', E: 'middle or passive', D: 'deponent', O: 'middle or passive deponent' };
const MOOD  = { I: 'indicative', S: 'subjunctive', O: 'optative', M: 'imperative', N: 'infinitive', P: 'participle' };
const CASE  = { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative', V: 'vocative' };
const GEND  = { M: 'masculine', F: 'feminine', N: 'neuter' };
const NUM   = { S: 'singular', P: 'plural' };
const POS   = { N: 'noun', V: 'verb', A: 'adjective', T: 'article', P: 'pronoun', R: 'relative pronoun', D: 'demonstrative pronoun', PREP: 'preposition', CONJ: 'conjunction', ADV: 'adverb' };

/**
 * Turn "V-2AAI-3P" into an ordered list of parsed components for the ribbon.
 * Returns [{ label, value }] so the UI never has to know the code grammar.
 */
export function decodeMorph(code) {
  if (!code) return [];
  if (POS[code]) return [{ label: 'part of speech', value: POS[code] }];

  const parts = code.split('-');
  const head = parts[0];
  const out = [];

  if (head === 'V') {
    out.push({ label: 'part of speech', value: 'verb' });
    const tvm = parts[1] || '';
    const m = tvm.match(/^(2?[PIFARL])([AMPEDO])([ISOMNP])$/);
    if (m) {
      out.push({ label: 'tense', value: TENSE[m[1]] || m[1] });
      out.push({ label: 'voice', value: VOICE[m[2]] || m[2] });
      out.push({ label: 'mood',  value: MOOD[m[3]]  || m[3] });
      if (m[1].startsWith('2')) out.push({ label: 'form', value: 'second aorist / perfect' });
    }
    const tail = parts[2] || '';
    if (/^[123][SP]$/.test(tail)) {
      out.push({ label: 'person', value: tail[0] + (tail[0] === '1' ? 'st' : tail[0] === '2' ? 'nd' : 'rd') });
      out.push({ label: 'number', value: NUM[tail[1]] });
    } else if (/^[NGDAV][SP][MFN]$/.test(tail)) {
      out.push({ label: 'case',   value: CASE[tail[0]] });
      out.push({ label: 'number', value: NUM[tail[1]] });
      out.push({ label: 'gender', value: GEND[tail[2]] });
    }
    return out;
  }

  if (POS[head]) out.push({ label: 'part of speech', value: POS[head] });
  const decl = parts[1] || '';
  if (/^[NGDAV][SP][MFN]$/.test(decl)) {
    out.push({ label: 'case',   value: CASE[decl[0]] });
    out.push({ label: 'number', value: NUM[decl[1]] });
    out.push({ label: 'gender', value: GEND[decl[2]] });
  }
  return out;
}
