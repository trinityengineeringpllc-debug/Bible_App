/**
 * Scripture Workbench — four views over one dataset.
 *
 *   read        three panes: text, exposition, comment
 *   commentary  your comments read straight through, in canonical order
 *   coverage    what you've written on and what you haven't
 *   search      across your notes, the scripture text, and the lexicon
 *
 * All four read through CorpusSource and Store. Swapping SeedCorpus →
 * SqliteCorpus and LocalStore → CatalystStore requires no edits below.
 */

import { SeedCorpus, decodeMorph } from './corpus.js';
import { LocalStore } from './store.js';
import { BOOKS } from './seed.js';

// --- verse id helpers -------------------------------------------------------

const bookOf   = id => BOOKS.find(b => b.book_id === Math.floor(id / 1e6)) || {};
const bookName = id => bookOf(id).name   || '?';
const bookAbbr = id => bookOf(id).abbrev || '?';
const chapterOf = id => Math.floor(id / 1000) % 1000;
const verseOf   = id => id % 1000;

export const ref      = id => `${bookName(id)} ${chapterOf(id)}:${verseOf(id)}`;
export const shortRef = id => `${bookAbbr(id)} ${chapterOf(id)}:${verseOf(id)}`;

function rangeRef(start, end) {
  if (start === end) return ref(start);
  return chapterOf(start) === chapterOf(end)
    ? `${ref(start)}\u2013${verseOf(end)}`
    : `${ref(start)}\u2013${ref(end)}`;
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const $ = id => document.getElementById(id);

function highlight(text, q) {
  const frag = document.createDocumentFragment();
  if (!q) { frag.append(document.createTextNode(text)); return frag; }
  const lower = text.toLowerCase(), needle = q.toLowerCase();
  let i = 0, at;
  while ((at = lower.indexOf(needle, i)) !== -1) {
    if (at > i) frag.append(document.createTextNode(text.slice(i, at)));
    frag.append(el('mark', null, text.slice(at, at + q.length)));
    i = at + q.length;
  }
  frag.append(document.createTextNode(text.slice(i)));
  return frag;
}

// --- state ------------------------------------------------------------------

const state = {
  corpus: null, store: null,
  mode: 'read',
  passage: null,
  versions: ['THGNT', 'KJV'],
  activeToken: null,
  selection: null,
  editing: null,        // note_id being revised, if any
  essayMode: false,
  tagFilter: null,
  translations: [],
  query: ''
};

// --- boot -------------------------------------------------------------------

async function boot() {
  state.corpus = new SeedCorpus();
  state.store  = await new LocalStore().init();
  state.translations = await state.corpus.translations();

  const ranges = await state.corpus.availableRanges();
  state.passage = ranges[0];
  state.ranges = ranges;

  wireModes();
  renderRail();
  await renderMode();
}

function wireModes() {
  for (const btn of $('mode-nav').querySelectorAll('button')) {
    btn.onclick = async () => {
      state.mode = btn.dataset.mode;
      for (const b of $('mode-nav').querySelectorAll('button')) {
        b.setAttribute('aria-current', String(b === btn));
      }
      await renderMode();
    };
  }
}

async function renderMode() {
  const three = $('three-pane'), wide = $('wide-view');
  const reading = state.mode === 'read';
  three.hidden = !reading;
  wide.hidden = reading;
  $('rail-passages').hidden = !reading;

  if (reading) return renderRead();
  if (state.mode === 'commentary') return renderCommentary();
  if (state.mode === 'coverage')   return renderCoverage();
  if (state.mode === 'search')     return renderSearch();
}

async function renderRead() {
  await Promise.all([renderText(), renderExposition(), renderComment()]);
  await renderStat();
}

// --- rail -------------------------------------------------------------------

function renderRail() {
  const list = $('passage-list');
  list.replaceChildren(...state.ranges.map(r => {
    const li = el('li');
    const btn = el('button');
    btn.append(document.createTextNode(r.title));
    btn.append(el('span', 'ref', rangeRef(r.start, r.end)));
    btn.setAttribute('aria-current', String(r === state.passage));
    btn.onclick = async () => {
      state.passage = r;
      state.activeToken = null; state.selection = null; state.editing = null;
      renderRail();
      await renderRead();
    };
    li.append(btn);
    return li;
  }));

  if (state.store.warning) {
    const box = $('store-warning');
    box.textContent = state.store.warning;
    box.hidden = false;
  }
  renderTagCloud();
}

async function renderTagCloud() {
  const tags = await state.store.listTags();
  const wrap = $('tag-cloud');
  if (!tags.length) { wrap.replaceChildren(el('span', 'label', 'none yet')); return; }
  wrap.replaceChildren(...tags.map(t => {
    const b = el('button', 'chip', t.name);
    b.setAttribute('aria-pressed', String(state.tagFilter === t.tag_id));
    b.onclick = async () => {
      state.tagFilter = state.tagFilter === t.tag_id ? null : t.tag_id;
      renderTagCloud();
      await renderMode();
    };
    return b;
  }));
}

async function renderStat() {
  const comments = await state.store.allComments();
  const essays = await state.store.essays();
  const tagged = (await state.corpus.taggedVerses()).length;
  const el2 = $('rail-stat');
  el2.replaceChildren();
  const line = (label, val) => {
    const d = el('div');
    d.append(document.createTextNode(label + ' '));
    d.append(Object.assign(document.createElement('b'), { textContent: String(val) }));
    return d;
  };
  el2.append(line('comments', comments.length));
  el2.append(line('essays', essays.length));
  el2.append(line('verses in corpus', tagged));
}

// --- text pane --------------------------------------------------------------

function renderVersionBar() {
  $('version-bar').replaceChildren(...state.translations.map(t => {
    const b = el('button', null, t.id);
    const on = state.versions.includes(t.id);
    b.setAttribute('aria-pressed', String(on));
    b.title = t.is_local ? t.name : `${t.name} \u2014 fetched live, needs the Catalyst proxy`;
    if (!t.is_local) b.disabled = true;
    b.onclick = async () => {
      state.versions = on ? state.versions.filter(v => v !== t.id) : [...state.versions, t.id];
      await renderText(); renderVersionBar();
    };
    return b;
  }));
}

async function renderText() {
  const { start, end } = state.passage;
  $('text-head').textContent = rangeRef(start, end);
  $('text-count').textContent = `${end - start + 1} vv`;
  renderVersionBar();

  const [tokens, anchored] = await Promise.all([
    state.corpus.tokens(start, end),
    state.store.anchoredVerses(start, end)
  ]);

  const texts = {};
  for (const v of state.versions) {
    texts[v] = Object.fromEntries(
      (await state.corpus.verses(v, start, end)).map(r => [r.verse_id, r.text]));
  }

  const blocks = [];
  for (let id = start; id <= end; id++) {
    const block = el('div', 'verse-block');
    block.dataset.verse = id;
    block.setAttribute('aria-selected', String(
      Boolean(state.selection && id >= state.selection.start && id <= state.selection.end)));

    const row = el('div', 'verse-row');
    const num = el('div', 'verse-num');
    const numBtn = el('button', null, String(verseOf(id)));
    numBtn.title = `Comment on ${ref(id)}`;
    numBtn.onclick = () => selectVerse(id);
    num.append(numBtn);
    if (anchored.has(id)) num.append(el('span', 'anchor-mark'));
    row.append(num);

    const body = el('div', 'verse-body');
    for (const v of state.versions) {
      const trn = state.translations.find(t => t.id === v);
      if (trn && trn.lang === 'grc') {
        const line = el('div', 'line-grc');
        const vt = tokens.filter(t => t.verse_id === id);
        vt.forEach((t, i) => {
          const w = el('span', 'w' + (t.is_variant ? ' variant' : ''), t.surface);
          w.setAttribute('role', 'button');
          w.setAttribute('tabindex', '0');
          w.setAttribute('aria-pressed', String(
            state.activeToken && state.activeToken.verse_id === id &&
            state.activeToken.position === t.position));
          w.title = `${t.gloss} \u00b7 ${t.strongs}`;
          const open = () => openToken(t);
          w.onclick = open;
          w.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
          line.append(w);
          if (i < vt.length - 1) line.append(document.createTextNode(' '));
        });
        if (!vt.length && texts[v] && texts[v][id]) line.textContent = texts[v][id];
        body.append(line);
      } else {
        const line = el('div', 'line-eng');
        line.append(el('span', 'tr', v));
        const t = texts[v] && texts[v][id];
        if (t) line.append(document.createTextNode(t));
        else { line.classList.add('pending'); line.append(document.createTextNode('Not in the seed corpus.')); }
        body.append(line);
      }
    }
    row.append(body);
    block.append(row);

    const ribbon = el('div', 'ribbon');
    ribbon.dataset.for = id;
    ribbon.append(el('div'));
    ribbon.append(el('div', 'ribbon-body'));
    block.append(ribbon);
    blocks.push(block);
  }

  $('text-body').replaceChildren(...blocks);
  if (state.activeToken) paintRibbon();
}

async function selectVerse(id) {
  if (state.selection && state.selection.start === id && state.selection.end === id) {
    state.selection = null;
  } else if (state.selection && id > state.selection.start && !state.essayMode) {
    state.selection = { start: state.selection.start, end: id };
  } else {
    state.selection = { start: id, end: id };
  }
  await renderText();
  await renderComment();
}

// --- word ribbon ------------------------------------------------------------

async function openToken(token) {
  const same = state.activeToken &&
    state.activeToken.verse_id === token.verse_id &&
    state.activeToken.position === token.position;
  state.activeToken = same ? null : token;
  await renderText();
  await renderExposition();
}

async function paintRibbon() {
  const t = state.activeToken;
  if (!t) return;
  const ribbon = document.querySelector(`.ribbon[data-for="${t.verse_id}"]`);
  if (!ribbon) return;

  const entry = await state.corpus.lexicon(t.strongs);
  const body = ribbon.querySelector('.ribbon-body');
  body.replaceChildren();

  const head = el('div', 'ribbon-lemma');
  head.append(el('span', 'lemma', entry ? entry.lemma : t.surface));
  if (entry) head.append(el('span', 'translit', entry.translit));
  head.append(el('span', 'strongs', t.strongs));
  body.append(head);
  body.append(el('div', 'ribbon-gloss', t.gloss));

  const parse = el('div', 'parse');
  const decoded = decodeMorph(t.morph);
  const chips = decoded.length ? decoded : [{ label: 'code', value: t.morph || '\u2014' }];
  for (const d of chips) {
    const chip = el('div', 'parse-chip');
    chip.append(el('span', 'k', d.label));
    chip.append(el('span', 'v', d.value));
    parse.append(chip);
  }
  body.append(parse);

  const ALL = ['THGNT', 'NA28', 'SBLGNT', 'TREG', 'WH', 'TR', 'BYZ'];
  const app = el('div', 'apparatus' + (t.is_variant ? ' split' : ''));
  app.append(el('span', 'label', t.is_variant ? 'editions divide' : 'in all editions'));
  for (const ed of ALL) app.append(el('span', `ed ${t.editions.includes(ed) ? 'present' : 'absent'}`, ed));
  body.append(app);

  const actions = el('div', 'ribbon-actions');
  const noteBtn = el('button', 'mini', 'Comment on this verse');
  noteBtn.onclick = async () => {
    state.selection = { start: t.verse_id, end: t.verse_id };
    await renderText(); await renderComment();
    $('note-body').focus();
  };
  actions.append(noteBtn);
  const traceBtn = el('button', 'mini', `Trace ${t.strongs}`);
  traceBtn.onclick = async () => {
    state.query = t.strongs; state.mode = 'search';
    for (const b of $('mode-nav').querySelectorAll('button'))
      b.setAttribute('aria-current', String(b.dataset.mode === 'search'));
    await renderMode();
  };
  actions.append(traceBtn);
  body.append(actions);

  ribbon.classList.add('open');
}

// --- exposition pane --------------------------------------------------------

async function renderExposition() {
  const pane = $('expo-body');
  const t = state.activeToken;
  const sections = [];

  if (t) {
    const entry = await state.corpus.lexicon(t.strongs);
    const lex = el('section', 'expo-section');
    lex.append(el('h3', 'label', 'lexicon'));
    if (entry) {
      const head = el('div', 'lex-head');
      head.append(el('span', 'lemma', entry.lemma));
      head.append(el('span', 'translit', entry.translit));
      head.append(el('span', 'pos', entry.pos));
      lex.append(head);
      lex.append(el('p', 'lex-short', entry.short));
      lex.append(el('p', 'lex-full', entry.full));
    } else {
      lex.append(el('p', 'lex-full',
        `No entry for ${t.strongs} in the seed lexicon. The full corpus carries the complete extended Strong's set plus LSJ.`));
    }
    sections.push(lex);

    const { start, end } = state.passage;
    const all = await state.corpus.tokens(start, end);
    const others = all.filter(x => x.strongs === t.strongs);
    if (others.length > 1) {
      const occ = el('section', 'expo-section');
      occ.append(el('h3', 'label', `also in this passage \u00b7 ${others.length}`));
      const wrap = el('div', 'occurrences');
      for (const o of others) {
        const b = el('button', 'occ', `${shortRef(o.verse_id)} ${o.surface}`);
        b.onclick = () => openToken(o);
        wrap.append(b);
      }
      occ.append(wrap);
      sections.push(occ);
    }
  }

  const focus = state.selection ? state.selection.start : (t ? t.verse_id : state.passage.start);
  const xrefs = await state.corpus.crossRefs(focus);
  const xs = el('section', 'expo-section');
  xs.append(el('h3', 'label', `cross-references \u00b7 ${ref(focus)}`));
  if (xrefs.length) {
    const ul = el('ul', 'xref-list');
    const max = Math.max(...xrefs.map(x => x.votes));
    for (const x of xrefs) {
      const li = el('li');
      li.append(el('span', 'ref', x.label));
      const w = el('span', 'weight');
      w.style.width = `${Math.round((x.votes / max) * 52) + 6}px`;
      li.append(w);
      li.title = `${x.votes} relevance votes \u00b7 TSK / OpenBible`;
      ul.append(li);
    }
    xs.append(ul);
  } else {
    xs.append(el('p', 'lex-full', 'No references for this verse in the seed set.'));
  }
  sections.push(xs);

  if (!t) {
    const hint = el('section', 'empty');
    hint.append(el('strong', null, 'Open a word'));
    hint.append(document.createTextNode(
      'Click any Greek word for its lexical entry, parsing, and which printed editions carry it. A dotted red underline marks where the editions divide.'));
    sections.unshift(hint);
  }
  pane.replaceChildren(...sections);
}

// --- comment pane -----------------------------------------------------------

async function renderComment() {
  const sel = state.selection;
  const target = $('compose-target');
  const hint = $('compose-hint');
  const save = $('note-save');
  const essayBtn = $('note-essay');

  essayBtn.setAttribute('aria-pressed', String(state.essayMode));
  essayBtn.textContent = state.essayMode ? 'Writing an essay' : 'Essay\u2026';

  if (!sel) {
    target.textContent = 'click a verse number to comment';
    hint.textContent = '';
    hint.className = 'compose-hint';
    save.disabled = true;
    state.editing = null;
  } else if (state.essayMode) {
    target.textContent = `essay linked to ${rangeRef(sel.start, sel.end)}`;
    hint.textContent = 'Essays are standalone. Many can link to the same passage.';
    hint.className = 'compose-hint';
    save.disabled = false;
    save.textContent = 'Save essay';
  } else {
    const existing = await state.store.getComment(sel.start);
    target.textContent = `${rangeRef(sel.start, sel.end)}`;
    save.disabled = false;
    if (existing) {
      state.editing = existing.note_id;
      $('note-title').value = existing.title || '';
      $('note-body').value = existing.body_md || '';
      hint.textContent = 'You have already commented here. Saving revises it.';
      hint.className = 'compose-hint revising';
      save.textContent = 'Revise comment';
    } else {
      state.editing = null;
      hint.textContent = 'One comment per verse. This is the commentary spine.';
      hint.className = 'compose-hint';
      save.textContent = 'Save comment';
    }
  }

  const { start, end } = state.passage;
  let notes = await state.store.notesForRange(start, end);
  if (state.tagFilter) {
    const tagged = await state.store.notesWithTag(state.tagFilter);
    const ids = new Set(tagged.map(n => n.note_id));
    notes = notes.filter(n => ids.has(n.note_id));
  }
  $('notes-count').textContent = String(notes.length);

  const pane = $('notes-body');
  if (!notes.length) {
    const empty = el('div', 'empty');
    empty.append(el('strong', null, 'Nothing written here yet'));
    empty.append(document.createTextNode(
      'Click a verse number, then write. Each comment you save becomes an entry in the commentary.'));
    pane.replaceChildren(empty);
    return;
  }

  const cards = [];
  for (const n of notes.sort((a, b) => b.updated_at.localeCompare(a.updated_at))) {
    const card = el('article', 'note-card');
    const meta = el('div', 'meta');
    meta.append(el('span', 'note-type', n.note_type === 'annotation' ? 'comment' : n.note_type));
    const del = el('button', 'del', 'remove');
    del.onclick = async () => {
      await state.store.deleteNote(n.note_id);
      state.editing = null;
      await renderRead();
    };
    meta.append(del);
    card.append(meta);
    if (n.title) card.append(el('h4', null, n.title));
    if (n.body_md) card.append(el('div', 'body', n.body_md));

    const anchors = el('div', 'anchors');
    for (const a of n.anchors) anchors.append(el('span', 'anchor-pill', rangeRef(a.start_verse_id, a.end_verse_id)));
    for (const t of await state.store.tagsForNote(n.note_id)) anchors.append(el('span', 'chip', t.name));
    card.append(anchors);
    cards.push(card);
  }
  pane.replaceChildren(...cards);
}

async function saveComment() {
  const sel = state.selection;
  if (!sel) return;
  const title = $('note-title').value.trim();
  const body  = $('note-body').value.trim();
  const tagText = $('note-tags').value.trim();
  if (!title && !body) { $('note-body').focus(); return; }

  let noteId;
  if (state.essayMode) {
    const note = await state.store.createNote({
      note_type: 'document', title, body_md: body,
      anchors: [{ anchor_type: 'reference', start_verse_id: sel.start,
                  end_verse_id: sel.end, is_primary: true }]
    });
    noteId = note.note_id;
  } else {
    const { note } = await state.store.upsertComment(sel.start, sel.end, { title, body_md: body });
    noteId = note.note_id;
  }

  if (tagText) {
    const ids = [];
    for (const name of tagText.split(',').map(s => s.trim()).filter(Boolean)) {
      ids.push((await state.store.createTag(name)).tag_id);
    }
    await state.store.setNoteTags(noteId, ids);
  }

  clearCompose();
  state.selection = null;
  state.essayMode = false;
  renderTagCloud();
  await renderRead();
}

function clearCompose() {
  $('note-title').value = '';
  $('note-body').value = '';
  $('note-tags').value = '';
}

// --- commentary view --------------------------------------------------------

async function renderCommentary() {
  $('wide-head').textContent = 'commentary';
  const comments = await state.store.allComments();
  $('wide-count').textContent = `${comments.length} entries`;

  const body = $('wide-body');
  if (!comments.length) {
    const empty = el('div', 'empty');
    empty.append(el('strong', null, 'The commentary is empty'));
    empty.append(document.createTextNode(
      'Comments you write while reading collect here, in canonical order. Go to Read, click a verse number, and write something.'));
    body.replaceChildren(empty);
    return;
  }

  const wrap = el('div', 'commentary');
  let currentBook = null;
  let previous = null;
  const english = state.versions.find(v => {
    const t = state.translations.find(x => x.id === v);
    return t && t.lang === 'eng' && t.is_local;
  }) || 'KJV';

  for (const c of comments) {
    const bid = Math.floor(c.start / 1e6);
    if (bid !== currentBook) {
      currentBook = bid;
      previous = null;
      const head = el('div', 'comm-book');
      head.append(el('h2', null, bookName(c.start)));
      const exp = el('button', 'btn ghost', 'Export markdown');
      exp.onclick = () => exportBook(bid);
      head.append(exp);
      wrap.append(head);
    }

    const entry = el('div', 'comm-entry');

    if (previous !== null && c.start > previous + 1) {
      const gapCount = c.start - previous - 1;
      entry.append(el('div', 'comm-gap',
        `${gapCount} verse${gapCount === 1 ? '' : 's'} without comment`));
    }
    previous = c.end;

    const refCol = el('div', 'comm-ref');
    const jump = el('button', null, rangeRef(c.start, c.end));
    jump.title = 'Open in Read';
    jump.onclick = () => jumpTo(c.start);
    refCol.append(jump);
    entry.append(refCol);

    const main = el('div');
    const rows = await state.corpus.verses(english, c.start, c.end);
    if (rows.length) {
      main.append(el('div', 'comm-scripture', rows.map(r => r.text).join(' ')));
    }
    if (c.title) main.append(el('h3', 'comm-heading', c.title));
    if (c.body_md) main.append(el('div', 'comm-body', c.body_md));

    const tags = await state.store.tagsForNote(c.note_id);
    if (tags.length) {
      const t = el('div', 'anchors');
      for (const tg of tags) t.append(el('span', 'chip', tg.name));
      main.append(t);
    }
    entry.append(main);
    wrap.append(entry);
  }

  body.replaceChildren(wrap);
}

async function jumpTo(verseId) {
  const range = state.ranges.find(r => verseId >= r.start && verseId <= r.end);
  if (range) state.passage = range;
  state.selection = { start: verseId, end: verseId };
  state.mode = 'read';
  for (const b of $('mode-nav').querySelectorAll('button'))
    b.setAttribute('aria-current', String(b.dataset.mode === 'read'));
  renderRail();
  await renderMode();
}

// --- export -----------------------------------------------------------------

/**
 * Markdown export. This is what keeps the commentary yours regardless of what
 * happens to this app, to Catalyst, or to any hosting decision later.
 */
async function exportBook(bookId) {
  const comments = await state.store.commentsForBook(bookId);
  if (!comments.length) return;
  const name = bookName(bookId * 1e6 + 1001);
  const english = 'KJV';

  const lines = [`# Commentary on ${name}`, '',
    `Exported ${new Date().toISOString().slice(0, 10)} \u00b7 ${comments.length} entries`, ''];

  let chapter = null;
  for (const c of comments) {
    if (chapterOf(c.start) !== chapter) {
      chapter = chapterOf(c.start);
      lines.push('', `## ${name} ${chapter}`, '');
    }
    lines.push(`### ${rangeRef(c.start, c.end)}`, '');
    const rows = await state.corpus.verses(english, c.start, c.end);
    if (rows.length) {
      lines.push(`> ${rows.map(r => r.text).join(' ')}`, '', `*${english}*`, '');
    }
    if (c.title) lines.push(`**${c.title}**`, '');
    if (c.body_md) lines.push(c.body_md, '');
    const tags = await state.store.tagsForNote(c.note_id);
    if (tags.length) lines.push(`\`${tags.map(t => t.name).join('\u2003')}\``, '');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `commentary-${name.toLowerCase().replace(/\s+/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// --- coverage view ----------------------------------------------------------

async function renderCoverage() {
  $('wide-head').textContent = 'coverage';
  const body = $('wide-body');
  const wrap = el('div', 'coverage');

  const legend = el('div', 'cov-legend');
  const item = (cls, text) => {
    const s = el('span');
    const i = el('i');
    i.className = cls;
    i.style.background = cls === 'done' ? 'var(--amber)' : 'var(--ink-700)';
    s.append(i, document.createTextNode(text));
    return s;
  };
  legend.append(item('done', 'commented'), item('', 'in corpus, not yet written on'));
  wrap.append(legend);

  const comments = await state.store.allComments();
  const booksTouched = [...new Set(state.ranges.map(r => Math.floor(r.start / 1e6)))];
  $('wide-count').textContent = `${comments.length} of ${(await state.corpus.taggedVerses()).length} verses`;

  for (const bid of booksTouched) {
    const book = BOOKS.find(b => b.book_id === bid);
    const covered = await state.store.coverage(bid);
    const inCorpus = (await state.corpus.taggedVerses()).filter(v => Math.floor(v / 1e6) === bid);

    const sec = el('section', 'cov-book');
    sec.append(el('h2', null, book.name));
    const done = inCorpus.filter(v => covered.has(v)).length;
    const pct = inCorpus.length ? Math.round((done / inCorpus.length) * 100) : 0;
    const sum = el('div', 'cov-summary');
    sum.append(Object.assign(document.createElement('b'), { textContent: `${done}` }));
    sum.append(document.createTextNode(` of ${inCorpus.length} verses in the corpus \u00b7 ${pct}%`));
    sec.append(sum);

    const chapters = [...new Set(inCorpus.map(chapterOf))].sort((a, b) => a - b);
    for (const ch of chapters) {
      const row = el('div', 'cov-chapter');
      row.append(el('span', 'ch', String(ch)));
      const cells = el('div', 'cov-cells');
      const verses = inCorpus.filter(v => chapterOf(v) === ch).sort((a, b) => a - b);
      for (const v of verses) {
        const c = el('button', 'cov-cell' + (covered.has(v) ? ' done' : ''));
        c.title = `${ref(v)} \u2014 ${covered.has(v) ? 'commented' : 'not yet'}`;
        c.onclick = () => jumpTo(v);
        cells.append(c);
      }
      row.append(cells);
      sec.append(row);
    }
    wrap.append(sec);
  }

  const note = el('div', 'empty');
  note.append(el('strong', null, 'Reading this map'));
  note.append(document.createTextNode(
    'Only verses the corpus actually contains are shown. Once the full corpus is built this becomes a map of the whole canon, and the empty cells are your working queue.'));
  wrap.append(note);

  body.replaceChildren(wrap);
}

// --- search view ------------------------------------------------------------

async function renderSearch() {
  $('wide-head').textContent = 'search';
  const body = $('wide-body');
  const wrap = el('div', 'search-wrap');

  const field = el('div', 'search-field');
  const input = el('input');
  input.type = 'search';
  input.placeholder = 'A word, a phrase, a Strong\u2019s number, a lemma\u2026';
  input.value = state.query;
  field.append(input);
  wrap.append(field);

  const results = el('div');
  wrap.append(results);
  body.replaceChildren(wrap);

  let timer;
  const run = async () => {
    state.query = input.value;
    await paintResults(results, state.query);
  };
  input.oninput = () => { clearTimeout(timer); timer = setTimeout(run, 140); };
  input.onkeydown = e => { if (e.key === 'Enter') { clearTimeout(timer); run(); } };

  input.focus();
  await paintResults(results, state.query);
}

async function paintResults(container, query) {
  const q = query.trim();
  container.replaceChildren();
  $('wide-count').textContent = '';

  if (!q) {
    const empty = el('div', 'empty');
    empty.append(el('strong', null, 'Search across everything at once'));
    empty.append(document.createTextNode(
      'Your comments, the scripture text, and the lexicon share one key, so a search can cross between them. Try a Strong\u2019s number like G2435, a lemma, or a phrase from something you wrote.'));
    container.append(empty);
    return;
  }

  let total = 0;

  // The gap finder — the query this whole design exists to make possible.
  const strongs = await state.corpus.resolveStrongs(q);
  if (strongs) {
    const entry = await state.corpus.lexicon(strongs);
    const occs = await state.corpus.occurrencesOf(strongs);
    const written = [], todo = [];
    for (const o of occs) {
      const c = await state.store.getComment(o.verse_id);
      (c ? written : todo).push(o);
    }

    const gf = el('div', 'gapfinder');
    const head = el('div', 'headline');
    head.append(el('span', 'lemma', entry ? entry.lemma : strongs));
    head.append(document.createTextNode(
      ` \u00b7 ${strongs} \u00b7 ${occs.length} occurrence${occs.length === 1 ? '' : 's'} in the corpus`));
    gf.append(head);

    const split = el('div', 'split');
    const col = (title, list, cls) => {
      const c = el('div', 'col' + (cls ? ' ' + cls : ''));
      c.append(el('span', 'label', `${title} \u00b7 ${list.length}`));
      if (!list.length) c.append(el('div', 'occ-row', '\u2014'));
      for (const o of list) {
        const row = el('div', 'occ-row');
        const b = el('button', null, shortRef(o.verse_id));
        b.onclick = () => jumpTo(o.verse_id);
        row.append(b);
        row.append(el('span', 'form', o.forms.join(', ')));
        c.append(row);
      }
      return c;
    };
    split.append(col('written on', written));
    split.append(col('not yet', todo, 'todo'));
    gf.append(split);
    container.append(gf);
    total += occs.length;
  }

  const noteHits = await state.store.searchNotes(q);
  if (noteHits.length) {
    const g = el('div', 'res-group');
    g.append(el('h3', 'label', `your notes \u00b7 ${noteHits.length}`));
    for (const h of noteHits) {
      const r = el('div', 'res');
      const rc = el('div', 'r-ref');
      if (h.start) {
        const b = el('button', null, rangeRef(h.start, h.end));
        b.onclick = () => jumpTo(h.start);
        rc.append(b);
      } else rc.append(document.createTextNode('\u2014'));
      r.append(rc);
      const txt = el('div', 'r-text');
      txt.append(highlight(h.excerpt, q));
      r.append(txt);
      g.append(r);
    }
    container.append(g);
    total += noteHits.length;
  }

  const textHits = await state.corpus.searchText(q);
  if (textHits.length) {
    const g = el('div', 'res-group');
    g.append(el('h3', 'label', `scripture \u00b7 ${textHits.length}`));
    for (const h of textHits.slice(0, 40)) {
      const r = el('div', 'res');
      const rc = el('div', 'r-ref');
      const b = el('button', null, shortRef(h.verse_id));
      b.onclick = () => jumpTo(h.verse_id);
      rc.append(b);
      rc.append(el('div', null, h.translation));
      r.append(rc);
      const txt = el('div', 'r-text');
      txt.append(highlight(h.text, q));
      r.append(txt);
      g.append(r);
    }
    container.append(g);
    total += textHits.length;
  }

  const lexHits = await state.corpus.lexiconSearch(q);
  if (lexHits.length) {
    const g = el('div', 'res-group');
    g.append(el('h3', 'label', `lexicon \u00b7 ${lexHits.length}`));
    for (const h of lexHits.slice(0, 15)) {
      const r = el('div', 'res');
      const rc = el('div', 'r-ref');
      const b = el('button', null, h.strongs);
      b.onclick = async () => {
        const input = document.querySelector('.search-field input');
        if (input) { input.value = h.strongs; state.query = h.strongs; }
        await paintResults(container, h.strongs);
      };
      rc.append(b);
      r.append(rc);
      const txt = el('div', 'r-text');
      txt.append(el('span', 'lemma', h.lemma + ' \u2014 '));
      txt.append(highlight(h.short, q));
      r.append(txt);
      g.append(r);
    }
    container.append(g);
    total += lexHits.length;
  }

  $('wide-count').textContent = total ? `${total} results` : '';

  if (!total) {
    const empty = el('div', 'empty');
    empty.append(el('strong', null, 'Nothing found'));
    empty.append(document.createTextNode(
      'The seed corpus covers Romans 3:21\u201326 and John 1:1\u20135. The full corpus will search the whole canon.'));
    container.append(empty);
  }
}

// --- wiring -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  $('note-save').onclick = saveComment;
  $('note-clear').onclick = async () => {
    state.selection = null; state.editing = null; state.essayMode = false;
    clearCompose();
    await renderText(); await renderComment();
  };
  $('note-essay').onclick = async () => {
    state.essayMode = !state.essayMode;
    clearCompose();
    await renderComment();
  };

  boot().catch(err => {
    console.error(err);
    $('text-body').replaceChildren(Object.assign(document.createElement('div'), {
      className: 'empty',
      textContent: `The workbench could not start: ${err.message}`
    }));
  });
});
