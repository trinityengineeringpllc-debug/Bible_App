/**
 * Store — read/write access to everything you create.
 *
 * The ONLY mutable data in the system: notes, anchors, tags, chains,
 * highlights, lexical annotations.
 *
 *   LocalStore     browser-side persistence for development
 *   CatalystStore  Catalyst Data Store via functions/notes-api (not yet wired)
 *
 * Both satisfy the same interface. app.js never knows which is running.
 */

const KEY = 'workbench:userdata:v1';

/** Pull a readable window of text around the first match. */
function excerpt(text, q, pad = 60) {
  const flat = text.replace(/\s+/g, ' ').trim();
  const at = flat.toLowerCase().indexOf(q);
  if (at === -1) return flat.slice(0, pad * 2);
  const from = Math.max(0, at - pad);
  const to = Math.min(flat.length, at + q.length + pad);
  return (from > 0 ? '\u2026' : '') + flat.slice(from, to) + (to < flat.length ? '\u2026' : '');
}

function emptyState() {
  return { notes: [], anchors: [], tags: [], noteTags: [], seq: 1 };
}

export class LocalStore {
  get name() { return 'local'; }

  constructor() {
    this.state = emptyState();
    this.backing = null;
    this.warning = null;
  }

  async init() {
    // Prefer host-provided persistence when present; fall back to session
    // memory rather than failing. Never localStorage.
    if (typeof window !== 'undefined' && window.storage && window.storage.get) {
      this.backing = window.storage;
      try {
        const res = await window.storage.get(KEY);
        if (res && res.value) this.state = JSON.parse(res.value);
      } catch {
        // No key yet. Starting empty is the correct outcome, not an error.
      }
    } else {
      this.warning = 'Notes are held in memory for this session only. They persist once this is deployed to Catalyst.';
    }
    return this;
  }

  async #flush() {
    if (!this.backing) return;
    try {
      await this.backing.set(KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('Could not save notes:', err);
      throw new Error('Changes were not saved. Check the connection and try again.');
    }
  }

  #id() { return this.state.seq++; }

  // -- notes ---------------------------------------------------------------

  async listNotes() { return this.state.notes.slice(); }

  async notesForRange(start, end) {
    const hits = new Map();
    for (const a of this.state.anchors) {
      if (a.start_verse_id <= end && a.end_verse_id >= start) {
        const note = this.state.notes.find(n => n.note_id === a.note_id);
        if (note && !note.is_archived) {
          if (!hits.has(note.note_id)) hits.set(note.note_id, { ...note, anchors: [] });
          hits.get(note.note_id).anchors.push(a);
        }
      }
    }
    return [...hits.values()];
  }

  async createNote({ note_type, title, body_md, anchors }) {
    const now = new Date().toISOString();
    const note = {
      note_id: this.#id(), note_type,
      title: title || '', body_md: body_md || '',
      is_pinned: 0, is_archived: 0, created_at: now, updated_at: now
    };
    this.state.notes.push(note);
    for (const a of anchors || []) {
      this.state.anchors.push({
        anchor_id: this.#id(), note_id: note.note_id,
        anchor_type: a.anchor_type || 'verse_range',
        start_verse_id: a.start_verse_id, end_verse_id: a.end_verse_id,
        is_primary: a.is_primary ? 1 : 0, label: a.label || null, sort_order: 0
      });
    }
    await this.#flush();
    return note;
  }

  async updateNote(noteId, patch) {
    const note = this.state.notes.find(n => n.note_id === noteId);
    if (!note) throw new Error('That note no longer exists.');
    Object.assign(note, patch, { updated_at: new Date().toISOString() });
    await this.#flush();
    return note;
  }

  async deleteNote(noteId) {
    this.state.notes = this.state.notes.filter(n => n.note_id !== noteId);
    this.state.anchors = this.state.anchors.filter(a => a.note_id !== noteId);
    this.state.noteTags = this.state.noteTags.filter(nt => nt.note_id !== noteId);
    await this.#flush();
  }

  async anchorsForNote(noteId) {
    return this.state.anchors.filter(a => a.note_id === noteId);
  }

  async addAnchor(noteId, anchor) {
    const row = {
      anchor_id: this.#id(), note_id: noteId,
      anchor_type: anchor.anchor_type || 'reference',
      start_verse_id: anchor.start_verse_id, end_verse_id: anchor.end_verse_id,
      is_primary: 0, label: anchor.label || null, sort_order: 0
    };
    this.state.anchors.push(row);
    await this.#flush();
    return row;
  }

  async removeAnchor(anchorId) {
    this.state.anchors = this.state.anchors.filter(a => a.anchor_id !== anchorId);
    await this.#flush();
  }

  /** Verse IDs that carry at least one note — drives the gutter marks. */
  async anchoredVerses(start, end) {
    const set = new Set();
    for (const a of this.state.anchors) {
      const from = Math.max(a.start_verse_id, start);
      const to = Math.min(a.end_verse_id, end);
      for (let id = from; id <= to; id++) set.add(id);
    }
    return set;
  }

  // -- comments ------------------------------------------------------------
  //
  // A "comment" is the canonical annotation on a verse: at most one per verse,
  // keyed by the START verse of its primary anchor. This is the commentary
  // spine. Exposition and document notes are unconstrained and hang off it.
  //
  // The uniqueness is enforced here rather than in the database because
  // Catalyst Data Store has no partial unique indexes. When CatalystStore is
  // implemented, notes-api must enforce the same rule server-side.

  #primaryAnchor(noteId) {
    return this.state.anchors.find(a => a.note_id === noteId && a.is_primary);
  }

  /** The canonical comment on a verse, or null. */
  async getComment(verseId) {
    for (const note of this.state.notes) {
      if (note.note_type !== 'annotation' || note.is_archived) continue;
      const a = this.#primaryAnchor(note.note_id);
      if (a && a.start_verse_id === verseId) return { ...note, anchor: a };
    }
    return null;
  }

  /**
   * Create or replace the comment on a verse. Returns { note, created }.
   * Callers use `created` to tell the difference between writing something
   * new and revising something that was already there.
   */
  async upsertComment(startVerseId, endVerseId, { title, body_md }) {
    const existing = await this.getComment(startVerseId);
    if (existing) {
      const anchor = this.#primaryAnchor(existing.note_id);
      if (anchor) anchor.end_verse_id = endVerseId;
      const note = await this.updateNote(existing.note_id, { title, body_md });
      return { note, created: false };
    }
    const note = await this.createNote({
      note_type: 'annotation', title, body_md,
      anchors: [{ anchor_type: 'verse_range', start_verse_id: startVerseId,
                  end_verse_id: endVerseId, is_primary: true }]
    });
    return { note, created: true };
  }

  /** Every comment in canonical order. This is the commentary. */
  async allComments() {
    const out = [];
    for (const note of this.state.notes) {
      if (note.note_type !== 'annotation' || note.is_archived) continue;
      const a = this.#primaryAnchor(note.note_id);
      if (a) out.push({ ...note, start: a.start_verse_id, end: a.end_verse_id });
    }
    return out.sort((x, y) => x.start - y.start);
  }

  async commentsForBook(bookId) {
    const lo = bookId * 1e6, hi = lo + 999999;
    return (await this.allComments()).filter(c => c.start >= lo && c.start <= hi);
  }

  /** Verse IDs carrying a comment, for the coverage map. */
  async coverage(bookId) {
    const set = new Set();
    for (const c of await this.commentsForBook(bookId)) {
      for (let id = c.start; id <= c.end; id++) set.add(id);
    }
    return set;
  }

  /** Non-comment notes: expositions and standalone documents. */
  async essays() {
    return this.state.notes
      .filter(n => n.note_type !== 'annotation' && !n.is_archived)
      .map(n => ({ ...n, anchors: this.state.anchors.filter(a => a.note_id === n.note_id) }));
  }

  // -- search --------------------------------------------------------------
  //
  // Substring matching over in-memory state. Once corpus.db is live this
  // becomes an FTS5 query — and because notes and corpus share the verse_id
  // key, note search and scripture search can run in ONE statement. Keep the
  // return shape stable so that swap changes nothing upstream.

  async searchNotes(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits = [];
    for (const n of this.state.notes) {
      if (n.is_archived) continue;
      const hay = `${n.title}\n${n.body_md}`.toLowerCase();
      const at = hay.indexOf(q);
      if (at === -1) continue;
      const a = this.#primaryAnchor(n.note_id) ||
                this.state.anchors.find(x => x.note_id === n.note_id);
      hits.push({
        note: n,
        start: a ? a.start_verse_id : null,
        end: a ? a.end_verse_id : null,
        excerpt: excerpt(`${n.title} ${n.body_md}`, q)
      });
    }
    return hits.sort((x, y) => (x.start || 0) - (y.start || 0));
  }

  // -- tags ----------------------------------------------------------------

  async listTags() { return this.state.tags.slice(); }

  async createTag(name, color) {
    const existing = this.state.tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const tag = { tag_id: this.#id(), name, color: color || null,
                  parent_tag_id: null, created_at: new Date().toISOString() };
    this.state.tags.push(tag);
    await this.#flush();
    return tag;
  }

  async tagsForNote(noteId) {
    const ids = this.state.noteTags.filter(nt => nt.note_id === noteId).map(nt => nt.tag_id);
    return this.state.tags.filter(t => ids.includes(t.tag_id));
  }

  async setNoteTags(noteId, tagIds) {
    this.state.noteTags = this.state.noteTags.filter(nt => nt.note_id !== noteId);
    for (const tag_id of tagIds) this.state.noteTags.push({ note_id: noteId, tag_id });
    await this.#flush();
  }

  async notesWithTag(tagId) {
    const ids = this.state.noteTags.filter(nt => nt.tag_id === tagId).map(nt => nt.note_id);
    return this.state.notes.filter(n => ids.includes(n.note_id));
  }
}

/**
 * Production store. Every method here becomes a fetch to
 * functions/notes-api, which does the ZCQL against Data Store.
 *
 * Remember when implementing: Data Store supplies ROWID as the primary key,
 * does not enforce foreign keys, and has no composite primary keys — so
 * cascade deletes and the note_tags uniqueness constraint are this layer's
 * responsibility. See the translation notes in db/userdata_schema.sql.
 */
export class CatalystStore {
  get name() { return 'catalyst'; }
  constructor(base = '/server/notes-api') { this.base = base; }
  async init() { throw new Error('CatalystStore is not wired up yet.'); }
}
