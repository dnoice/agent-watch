/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Archive View (dd1 Tools Edition - v1.0)
 *     - File Name: archive.js
 *     - Relative Path: web/archive.js
 *     - Artifact Type: javascript
 *     - Version: 1.0.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's archive stage (R03): every run of the
 *       project, paged and filtered by status, and a search over their
 *       commands, files, tests, commits and errors that shows what matched.
 *
 * ✒ Description:
 *     The Archive view: every workflow run agent-watch has indexed for the
 *     project, not only the twelve newest, with a search. Choosing a run
 *     opens it in Live, older or not.
 *
 * ✒ Key Features:
 *     - Pages of 25 runs, newest first, filtered by status
 *     - Search words that must all match, or field:value (status, workflow,
 *       branch, agent, file, test, cmd, commit, error), with each run's
 *       matching lines under it
 *     - The index's progress while it builds, and runs whose files are gone
 *       marked as such
 *     - The query and the page are kept in the address
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/archive and /api/search
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, icon, when, span, num, tokens, api } from './core.js';

const PAGE = 25;

export function createArchiveView(ctx) {
  let q = '';
  let status = '';
  let offset = 0;
  let timer = null;
  let lastStatus = null;

  function row(e) {
    const took = e.ended && e.started ? span(e.ended - e.started) : e.last && e.started ? span(e.last - e.started) : '-';
    const o = e.outcomes || {};
    const tr = el('tr', {
      tabindex: '0',
      class: e.available === false ? 'is-gone' : null,
      title: e.available === false ? 'Its files are gone from Claude\'s folder; the index keeps what was read.' : 'Open this run in Live',
      onclick: () => open(e),
      onkeydown: (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          open(e);
        }
      },
    },
    el('td', {}, el('span', { class: 'run-title', text: e.title }), el('span', { class: 'run-id', text: `${e.id}${e.branch ? `  ·  ${e.branch}` : ''}` }),
      e.hits?.length ? el('ul', { class: 'hits' }, ...e.hits.map((h) => el('li', {}, el('b', { text: h.field }), ' ', h.text))) : null),
    el('td', { class: 'mono', text: e.name || '-' }),
    el('td', {}, el('span', { class: `status-pill is-${e.status}`, text: e.available === false ? `${e.status}, gone` : e.status })),
    el('td', { class: 'mono', text: when(e.started) }),
    el('td', { class: 'num', text: took }),
    el('td', { class: 'num', text: String(e.agents) }),
    el('td', { class: 'num', text: o.errors ? num(o.errors) : '-' }),
    el('td', { class: 'num', text: e.commits?.length || (o.commitsConfirmed ?? '-') }),
    el('td', { class: 'num', text: e.tokens === null || e.tokens === undefined ? '-' : tokens(e.tokens), title: e.tokensKind === 'output' ? 'Output tokens' : 'Total tokens' }));
    return tr;
  }

  function open(e) {
    ctx.go('live', { run: e.id });
  }

  function drawStatus(st) {
    lastStatus = st;
    const s = $('archive-status');
    if (!st) {
      s.textContent = '';
      return;
    }
    s.textContent = `${num(st.indexed)} of ${num(st.total)} runs indexed${st.gone ? `, ${num(st.gone)} gone from disk` : ''}${st.building ? ', indexing…' : ''}${st.persisted ? '' : ' (not kept: no state folder)'}`;
    s.className = `muted${st.building ? ' is-building' : ''}`;
  }

  async function load() {
    const project = ctx.state()?.project?.slug || ctx.ui.project;
    const body = q
      ? await api('archive', '/api/search', { project, q, limit: 200 })
      : await api('archive', '/api/archive', { project, offset, limit: PAGE, status });
    if (body === undefined) return;
    drawStatus(body.status);
    let rows = body.rows;
    if (q && status) rows = rows.filter((r) => r.status === status);
    const total = q ? rows.length : body.total;
    $('archive-rows').replaceChildren(...rows.map(row));
    $('archive-empty').hidden = rows.length > 0;
    $('archive-empty').textContent = q ? `No indexed run matches "${q}".` : body.status?.building ? 'The index is being built; runs appear as they are read.' : 'No runs indexed yet.';
    const from = total ? (q ? 1 : offset + 1) : 0;
    const to = q ? rows.length : Math.min(offset + PAGE, total);
    $('archive-range').textContent = total ? `${num(from)}–${num(to)} of ${num(total)}${q ? ` matching "${q}"` : ''}` : '';
    $('archive-prev').disabled = q || offset === 0;
    $('archive-next').disabled = q || offset + PAGE >= total;
    clearTimeout(timer);
    if (body.status?.building) timer = setTimeout(load, 4000);
  }

  function keep() {
    const p = {};
    if (q) p.q = q;
    if (status) p.status = status;
    if (offset) p.offset = String(offset);
    ctx.go('archive', { run: ctx.ui.run, params: p, replace: true });
  }

  $('archive-form').addEventListener('submit', (e) => {
    e.preventDefault();
    q = $('archive-q').value.trim();
    offset = 0;
    keep();
  });
  $('archive-filter').addEventListener('change', (e) => {
    status = e.target.value;
    offset = 0;
    keep();
  });
  $('archive-clear').addEventListener('click', () => {
    q = '';
    $('archive-q').value = '';
    offset = 0;
    keep();
  });
  $('archive-prev').addEventListener('click', () => {
    offset = Math.max(0, offset - PAGE);
    keep();
  });
  $('archive-next').addEventListener('click', () => {
    offset += PAGE;
    keep();
  });
  for (const b of document.querySelectorAll('[data-archive-q]')) {
    b.addEventListener('click', () => {
      const input = $('archive-q');
      input.value = `${input.value.trim()} ${b.dataset.archiveQ}`.trim();
      input.focus();
    });
  }

  return {
    panel: 'view-archive',
    show(params) {
      q = params.get('q') || '';
      status = params.get('status') || '';
      offset = Number(params.get('offset')) || 0;
      $('archive-q').value = q;
      $('archive-filter').value = status;
      load();
    },
    hide() {
      clearTimeout(timer);
    },
    onState(s) {
      if (s.archive && lastStatus && (s.archive.indexed !== lastStatus.indexed || s.archive.building !== lastStatus.building)) load();
    },
    icon: () => icon('archive'),
  };
}
