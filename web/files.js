/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Files View (dd1 Tools Edition - v1.1)
 *     - File Name: files.js
 *     - Relative Path: web/files.js
 *     - Artifact Type: javascript
 *     - Version: 1.1.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The note
 *       as a closed How to read the file list.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's change-provenance stage (R08): the files a
 *       run touched, who touched each, and the ones two agents edited.
 *
 * ✒ Description:
 *     The Files view: every file the run's agents read or edited, with the
 *     agents, the edits that came back ok or failed, the reads, and the
 *     commits on the branch that changed it. Files two agents edited are
 *     flagged as possible collisions, overlapping when the edits crossed in
 *     time. Choosing a file lists every event that named it.
 *
 * ✒ Key Features:
 *     - Collisions first, then the most edited
 *     - Filters: collisions only, edited only
 *     - A file's history, each event with its agent and transcript line
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/files and /api/file
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, icon, clock, when, num, api, how } from './core.js';

const tail = (p, n = 3) => String(p).replace(/\\/g, '/').split('/').slice(-n).join('/');

export function createFilesView(ctx) {
  let data = null;
  let filter = 'all';
  let chosen = null;

  async function drawHistory() {
    const box = $('files-history');
    if (!chosen) {
      fill(box, el('p', { class: 'empty', text: 'Choose a file to see every event that named it.' }));
      return;
    }
    const s = ctx.state();
    const body = await api('file', '/api/file', { project: s?.project?.slug || ctx.ui.project, run: ctx.ui.run || s?.focus, path: chosen });
    if (body === undefined) return;
    fill(box, el('h4', { class: 'sub', text: tail(chosen, 4) }), el('p', { class: 'muted mono path', text: chosen }),
      body?.events?.length ? el('ol', { class: 'mini-list' }, ...body.events.map((e) => el('li', { class: `ev mini is-${e.kind}${e.status ? ` st-${e.status}` : ''}` },
        el('span', { class: 'ev-icon' }, icon({ edit: 'pencil-simple-line', read: 'magnifying-glass' }[e.kind] || 'terminal-window')),
        el('div', { class: 'ev-text' }, el('span', { class: 'ev-agent', text: e.agentLabel }), el('span', { class: 'ev-tool', text: e.tool }), e.status === 'error' ? 'came back as an error' : e.status === 'pending' ? 'no result yet' : ''),
        el('span', { class: 'ev-side' }, el('time', { class: 'ev-time', text: clock(e.t), title: `${when(e.t)} · line ${e.line}` })))))
        : el('p', { class: 'empty', text: 'No event named it.' }));
  }

  function draw() {
    if (!data) return;
    const c = data.counts;
    $('files-run').textContent = `${data.run.title} · ${num(c.files)} files, ${num(c.edited)} edited`;
    fill($('files-counts'),
      el('button', { type: 'button', class: 'badge as-filter', 'aria-pressed': String(filter === 'all'), onclick: () => { filter = 'all'; draw(); } }, `${num(c.files)} files`),
      el('button', { type: 'button', class: 'badge is-info as-filter', 'aria-pressed': String(filter === 'edited'), onclick: () => { filter = 'edited'; draw(); } }, `${num(c.edited)} edited`),
      el('button', { type: 'button', class: `badge ${c.collisions ? 'is-warn' : ''} as-filter`, 'aria-pressed': String(filter === 'collisions'), onclick: () => { filter = 'collisions'; draw(); }, title: 'Files two or more agents edited' }, `${num(c.collisions)} possible collisions${c.overlapping ? `, ${num(c.overlapping)} overlapping` : ''}`),
      el('span', { class: 'badge', title: 'Files a commit on the run\'s branch changed' }, `${num(c.inCommits)} in commits`));
    fill($('files-note'), how(data.note, 'How to read the file list'));
    const rows = data.files.filter((f) => filter === 'all' || (filter === 'edited' && f.edits) || (filter === 'collisions' && f.collision));
    fill($('files-rows'), rows.length ? rows.slice(0, 400).map((f) => el('tr', {
      tabindex: '0', 'aria-current': String(f.path === chosen), class: f.collision ? `is-collision c-${f.collision}` : null,
      onclick: () => {
        chosen = f.path;
        draw();
        drawHistory();
      },
      onkeydown: (e) => {
        if (e.key === 'Enter') {
          chosen = f.path;
          draw();
          drawHistory();
        }
      },
    },
    el('td', { class: 'mono', title: f.path, text: tail(f.path) }),
    el('td', {}, ...f.agents.map((a) => el('span', { class: 'ev-agent', title: `${a.label}: ${a.edits} edits, ${a.reads} reads`, text: `${a.label}${a.edits ? ` ✎${a.edits}` : ''}` }))),
    el('td', { class: 'num', text: f.edits ? `${num(f.editsOk)}${f.editsFailed ? ` +${num(f.editsFailed)} failed` : ''}` : '-' }),
    el('td', { class: 'num', text: f.reads ? num(f.reads) : '-' }),
    el('td', { class: 'mono', text: f.commits.map((x) => x.hash).join(' ') || '-', title: f.commits.map((x) => `${x.hash} ${x.subject}`).join('\n') }),
    el('td', {}, f.collision ? el('span', { class: `badge ${f.collision === 'overlapping' ? 'is-bad' : 'is-warn'}`, text: f.collision === 'overlapping' ? 'overlapping edits' : 'two editors', title: 'A risk signal, not proof that anything was lost' }) : null))) : [el('tr', {}, el('td', { colspan: '6', class: 'empty', text: data.files.length ? 'No file matches the filter.' : 'No agent of this run read or edited a file through the edit and read tools.' }))]);
  }

  async function load() {
    const s = ctx.state();
    const body = await api('files', '/api/files', { project: s?.project?.slug || ctx.ui.project, run: ctx.ui.run || s?.focus });
    if (body === undefined) return;
    data = body;
    if (!body) $('files-run').textContent = 'No run to show.';
    draw();
    drawHistory();
  }

  return {
    panel: 'view-files',
    show() {
      chosen = null;
      load();
    },
    onState() { /* fetched when the view opens */ },
  };
}
