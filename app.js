(() => {
  'use strict';

  const KEY = 'wortschatzkiste.v1';
  const UIKEY = 'wortschatzkiste.ui';
  const THEMEKEY = 'wortschatzkiste.theme';

  const CATS = {
    neologismus: 'Neologismus',
    kompositum: 'Kompositum',
    selten: 'Selten / veraltet',
    witzig: 'Witzig',
    form: 'Besondere Form',
    sonstiges: 'Sonstiges'
  };

  /* ---------- Helfer ---------- */
  const $ = s => document.querySelector(s);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch (_) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); }
      catch (_) { toast('Speichern im Browser nicht möglich'); }
    }
  };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function clean(e) {
    return {
      id: String(e.id || uid()),
      word: String(e.word || '').trim(),
      category: CATS[e.category] ? e.category : 'sonstiges',
      meaning: String(e.meaning || '').trim(),
      example: String(e.example || '').trim(),
      source: String(e.source || '').trim(),
      note: String(e.note || '').trim(),
      tags: Array.isArray(e.tags) ? e.tags.map(t => String(t).trim()).filter(Boolean) : [],
      variants: Array.isArray(e.variants)
        ? e.variants
            .map(v => ({ form: String((v && v.form) || '').trim(), hint: String((v && v.hint) || '').trim() }))
            .filter(v => v.form)
        : [],
      fav: !!e.fav,
      created: Number(e.created) || Date.now()
    };
  }

  function seeds() {
    const now = Date.now();
    return [
      {
        word: 'auserkoren',
        category: 'form',
        meaning: 'ausgewählt, erwählt',
        variants: [{ form: 'auserkiest', hint: 'regelmäßig gebildete Nebenform' }],
        example: 'Er fühlte sich zu Höherem auserkoren.',
        tags: ['Beispiel', 'Partizip']
      },
      {
        word: 'verschlimmbessern',
        category: 'witzig',
        meaning: 'etwas durch gut gemeinte Verbesserungen schlechter machen',
        example: 'Ich wollte den Text nur kürzen und habe ihn komplett verschlimmbessert.',
        tags: ['Beispiel', 'Lieblingswort']
      },
      {
        word: 'Backpfeifengesicht',
        category: 'kompositum',
        meaning: 'ein Gesicht, das zum Ohrfeigen einlädt',
        tags: ['Beispiel', 'Kompositum']
      },
      {
        word: 'Schlafittchen',
        category: 'selten',
        meaning: 'Flügelansatz; heute fast nur noch in „am Schlafittchen packen“',
        example: 'Der Lehrer nahm ihn am Schlafittchen.',
        tags: ['Beispiel', 'Redewendung']
      }
    ].map((s, i) => clean({ ...s, created: now - i * 1000 }));
  }

  /* ---------- Zustand ---------- */
  let entries = (() => {
    const saved = store.get(KEY, null);
    if (Array.isArray(saved)) return saved.map(clean).filter(e => e.word);
    const s = seeds();
    store.set(KEY, s);
    return s;
  })();

  const ui = Object.assign({ cat: 'all', tag: '', sort: 'az', fav: false }, store.get(UIKEY, {}));
  ui.q = '';

  const persist = () => store.set(KEY, entries);
  const persistUi = () => store.set(UIKEY, { cat: ui.cat, tag: ui.tag, sort: ui.sort, fav: ui.fav });
  const byId = id => entries.find(e => e.id === id);

  /* ---------- Filter & Liste ---------- */
  function matches(e) {
    if (ui.cat !== 'all' && e.category !== ui.cat) return false;
    if (ui.tag && !e.tags.includes(ui.tag)) return false;
    if (ui.fav && !e.fav) return false;
    const q = ui.q.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      e.word, e.meaning, e.example, e.source, e.note,
      e.tags.join(' '),
      e.variants.map(v => v.form + ' ' + v.hint).join(' ')
    ].join(' ').toLowerCase();
    return q.split(/\s+/).every(part => hay.includes(part));
  }

  function sorter(a, b) {
    if (ui.sort === 'new') return b.created - a.created;
    if (ui.sort === 'old') return a.created - b.created;
    return a.word.localeCompare(b.word, 'de', { sensitivity: 'base' });
  }

  function letterOf(word) {
    const c = word.trim().charAt(0).normalize('NFD').charAt(0).toUpperCase();
    return /[A-Z]/.test(c) ? c : '#';
  }

  function row(e) {
    const b = el('button', 'row');
    b.type = 'button';
    const head = el('span', 'rhead');
    head.append(el('span', 'rw', e.word));
    if (e.fav) head.append(el('span', 'rstar', '★'));
    b.append(head);
    if (e.meaning) b.append(el('span', 'rm', e.meaning));
    b.addEventListener('click', () => openDetail(e.id));
    return b;
  }

  function renderFilters() {
    const chips = $('#chips');
    chips.replaceChildren();
    [['all', 'Alle'], ...Object.entries(CATS)].forEach(([key, label]) => {
      const b = el('button', 'chip', label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(ui.cat === key));
      b.addEventListener('click', () => { ui.cat = key; persistUi(); render(); });
      chips.append(b);
    });

    const sel = $('#tagSel');
    const tags = [...new Set(entries.flatMap(e => e.tags))].sort((a, b) =>
      a.localeCompare(b, 'de', { sensitivity: 'base' })
    );
    if (ui.tag && !tags.includes(ui.tag)) ui.tag = '';
    sel.replaceChildren(new Option('Alle Tags', ''));
    tags.forEach(t => sel.append(new Option('#' + t, t)));
    sel.value = ui.tag;

    $('#sortSel').value = ui.sort;
    $('#favBtn').setAttribute('aria-pressed', String(ui.fav));

    const active = (ui.cat !== 'all') + (ui.tag ? 1 : 0) + (ui.fav ? 1 : 0);
    $('#filterCount').textContent = active ? ' · ' + active : '';
  }

  function render() {
    renderFilters();
    const shown = entries.filter(matches).sort(sorter);
    const list = $('#list');
    list.replaceChildren();

    if (!entries.length) {
      list.append(el('p', 'empty', 'Noch leer. Tippe auf +, um dein erstes Wort einzutragen.'));
    } else if (!shown.length) {
      list.append(el('p', 'empty', 'Keine Treffer.'));
    } else {
      let last = null;
      shown.forEach(e => {
        if (ui.sort === 'az') {
          const l = letterOf(e.word);
          if (l !== last) { list.append(el('div', 'letter', l)); last = l; }
        }
        list.append(row(e));
      });
    }

    const filtered = shown.length !== entries.length;
    $('#count').textContent = !entries.length
      ? ''
      : filtered
        ? shown.length + ' von ' + entries.length
        : entries.length + (entries.length === 1 ? ' Wort' : ' Wörter');
  }

  /* ---------- Detailansicht ---------- */
  const detail = $('#detail');
  let detailId = null;

  function fillDetail(e) {
    const body = $('#detailBody');
    body.replaceChildren();
    body.append(el('div', 'd-cat', CATS[e.category]), el('h2', 'd-word', e.word));
    if (e.meaning) body.append(el('p', 'd-meaning', e.meaning));

    if (e.variants.length) {
      const ul = el('ul', 'd-forms');
      e.variants.forEach(v => {
        const li = el('li');
        li.append(el('b', null, v.form));
        if (v.hint) li.append(document.createTextNode(' – '), el('i', null, v.hint));
        ul.append(li);
      });
      body.append(ul);
    }
    if (e.example) body.append(el('blockquote', 'd-example', e.example));
    const noteText = [e.source ? 'Fundort: ' + e.source : '', e.note].filter(Boolean).join('\n');
    if (noteText) body.append(el('p', 'd-note', noteText));

    if (e.tags.length) {
      const tags = el('div', 'd-tags');
      e.tags.forEach(t => {
        const b = el('button', null, '#' + t);
        b.type = 'button';
        b.addEventListener('click', () => {
          ui.tag = t;
          persistUi();
          detail.close();
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        tags.append(b);
      });
      body.append(tags);
    }

    const actions = el('div', 'd-actions');
    const fav = el('button', null, e.fav ? '★ Favorit' : '☆ Favorit');
    fav.type = 'button';
    fav.addEventListener('click', () => {
      e.fav = !e.fav;
      persist();
      render();
      fillDetail(e);
    });
    const edit = el('button', null, 'Bearbeiten');
    edit.type = 'button';
    edit.addEventListener('click', () => { detail.close(); openEditor(e); });
    const del = el('button', 'del', 'Löschen');
    del.type = 'button';
    del.addEventListener('click', () => {
      if (!confirm('„' + e.word + '“ wirklich löschen?')) return;
      entries = entries.filter(x => x.id !== e.id);
      persist();
      detail.close();
      render();
      toast('Gelöscht');
    });
    actions.append(fav, edit, del);
    body.append(actions);
  }

  function openDetail(id) {
    const e = byId(id);
    if (!e) return;
    detailId = id;
    fillDetail(e);
    if (!detail.open) detail.showModal();
  }

  /* ---------- Editor ---------- */
  const dlg = $('#editor');
  const form = $('#form');
  let editingId = null;
  let formCat = 'sonstiges';

  function renderFormCats() {
    const box = $('#f-cats');
    box.replaceChildren();
    Object.entries(CATS).forEach(([key, label]) => {
      const b = el('button', 'chip', label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(formCat === key));
      b.addEventListener('click', () => { formCat = key; renderFormCats(); });
      box.append(b);
    });
  }

  // "form (Hinweis), form2" <-> [{form, hint}]
  const parseForms = s =>
    s.split(/[,;](?![^(]*\))/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => {
        const m = p.match(/^(.*?)\s*\((.*)\)\s*$/);
        return m ? { form: m[1].trim(), hint: m[2].trim() } : { form: p, hint: '' };
      })
      .filter(v => v.form);
  const formsToText = list => list.map(v => (v.hint ? v.form + ' (' + v.hint + ')' : v.form)).join(', ');

  function openEditor(e) {
    editingId = e ? e.id : null;
    form.reset();
    formCat = e ? e.category : (ui.cat !== 'all' ? ui.cat : 'sonstiges');
    renderFormCats();
    $('#editorTitle').textContent = e ? 'Wort bearbeiten' : 'Neues Wort';
    const more = $('#more');
    more.open = false;
    if (e) {
      $('#f-word').value = e.word;
      $('#f-meaning').value = e.meaning;
      $('#f-forms').value = formsToText(e.variants);
      $('#f-example').value = e.example;
      $('#f-tags').value = e.tags.join(', ');
      $('#f-note').value = e.note;
      more.open = !!(e.variants.length || e.example || e.note || e.tags.length || e.category !== 'sonstiges');
    }
    dlg.showModal();
    if (!e) setTimeout(() => $('#f-word').focus(), 50);
  }

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const word = $('#f-word').value.trim();
    if (!word) { $('#f-word').focus(); return; }
    const data = {
      word,
      category: formCat,
      meaning: $('#f-meaning').value,
      variants: parseForms($('#f-forms').value),
      example: $('#f-example').value,
      note: $('#f-note').value,
      tags: $('#f-tags').value.split(',').map(t => t.replace(/^#/, '').trim()).filter(Boolean)
    };
    if (editingId) {
      const i = entries.findIndex(x => x.id === editingId);
      if (i >= 0) entries[i] = clean({ ...entries[i], ...data });
    } else {
      entries.push(clean(data));
    }
    persist();
    render();
    dlg.close();
    toast('Gespeichert');
  });

  $('#cancelBtn').addEventListener('click', () => dlg.close());
  $('#fab').addEventListener('click', () => openEditor(null));

  /* ---------- Menü & Daten ---------- */
  const menu = $('#menuDlg');
  $('#menuBtn').addEventListener('click', () => menu.showModal());
  $('#closeMenu').addEventListener('click', () => menu.close());
  $('#closeDetail').addEventListener('click', () => detail.close());

  [dlg, detail, menu].forEach(d =>
    d.addEventListener('click', ev => { if (ev.target === d) d.close(); })
  );

  $('#randomBtn').addEventListener('click', () => {
    menu.close();
    if (!entries.length) { toast('Noch keine Wörter'); return; }
    const pool = entries.length > 1 ? entries.filter(e => e.id !== detailId) : entries;
    openDetail(pool[Math.floor(Math.random() * pool.length)].id);
  });

  $('#exportBtn').addEventListener('click', () => {
    const payload = { app: 'wortschatzkiste', version: 1, exported: new Date().toISOString(), entries };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wortschatzkiste-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sicherung heruntergeladen');
  });

  $('#importFile').addEventListener('change', async ev => {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const incoming = Array.isArray(json) ? json : json.entries;
      if (!Array.isArray(incoming)) throw new Error('format');
      const have = new Set(entries.map(e => e.id));
      const haveWords = new Set(entries.map(e => e.word.toLowerCase()));
      let added = 0;
      incoming.map(clean).filter(e => e.word).forEach(e => {
        if (have.has(e.id) || haveWords.has(e.word.toLowerCase())) return;
        entries.push(e);
        have.add(e.id);
        haveWords.add(e.word.toLowerCase());
        added++;
      });
      persist();
      render();
      menu.close();
      toast(added + (added === 1 ? ' neues Wort' : ' neue Wörter') + ' übernommen');
    } catch (_) {
      toast('Datei konnte nicht gelesen werden');
    }
  });

  $('#wipeBtn').addEventListener('click', () => {
    if (!confirm('Wirklich ALLE Wörter löschen? Das lässt sich nicht rückgängig machen. Tipp: erst eine Sicherung herunterladen.')) return;
    entries = [];
    persist();
    render();
    menu.close();
    toast('Alles gelöscht');
  });

  /* ---------- Suche & Filter ---------- */
  let qTimer;
  $('#q').addEventListener('input', ev => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { ui.q = ev.target.value; render(); }, 120);
  });

  $('#filterBtn').addEventListener('click', () => {
    const panel = $('#filters');
    panel.hidden = !panel.hidden;
    $('#filterBtn').setAttribute('aria-expanded', String(!panel.hidden));
  });
  $('#tagSel').addEventListener('change', ev => { ui.tag = ev.target.value; persistUi(); render(); });
  $('#sortSel').addEventListener('change', ev => { ui.sort = ev.target.value; persistUi(); render(); });
  $('#favBtn').addEventListener('click', () => { ui.fav = !ui.fav; persistUi(); render(); });
  $('#resetBtn').addEventListener('click', () => {
    ui.cat = 'all'; ui.tag = ''; ui.fav = false; ui.sort = 'az';
    persistUi();
    render();
  });

  /* ---------- Design ---------- */
  const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(t) {
    const root = document.documentElement;
    if (t === 'light' || t === 'dark') root.dataset.theme = t;
    else delete root.dataset.theme;
    const dark = t === 'dark' || (!t && prefersDark());
    $('#themeBtn').textContent = dark ? 'Hellmodus' : 'Dunkelmodus';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#1c1916' : '#fbf8f2';
  }
  $('#themeBtn').addEventListener('click', () => {
    const cur = store.get(THEMEKEY, null);
    const dark = cur === 'dark' || (!cur && prefersDark());
    const next = dark ? 'light' : 'dark';
    store.set(THEMEKEY, next);
    applyTheme(next);
  });
  applyTheme(store.get(THEMEKEY, null));

  /* ---------- Start ---------- */
  render();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
