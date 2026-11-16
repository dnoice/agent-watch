/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Compare View (dd1 Tools Edition - v1.0)
 *     - File Name: compare.js
 *     - Relative Path: web/compare.js
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
 *       version, for the audit's comparison stage (R05): two runs side by
 *       side, and the runs related to the first with the reasons.
 *
 * ✒ Description:
 *     The Compare view: two runs of the project, chosen from every run the
 *     archive holds, laid side by side: status, time, agents, phases,
 *     tokens, tool calls, outcomes, test cases, files and commits. A figure
 *     measured differently in each run is marked as not comparable. The
 *     runs related to the first are suggested, each with its reasons.
 *
 * ✒ Key Features:
 *     - Run A defaults to the run in focus, run B to its strongest related
 *       run, else the run before it
 *     - Changed figures marked; not comparable ones say why
 *     - Test cases whose result differs, files only one run touched
 *     - Both runs kept in the address (&a=...&b=...)
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/archive, /api/related,
 *       /api/compare
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, when, span, num, tokens, api } from './core.js';

const tail = (p) => String(p).replace(/\\/g, '/').split('/').slice(-3).join('/');

function show(key, v) {
  if (v === null || v === undefined) return '-';
  if (key === 'started') return when(v);
  if (key === 'took') return span(v);
  if (key === 'tokens') return tokens(v);
  if (Array.isArray(v)) return v.join(', ') || '-';
  if (typeof v === 'number') return num(v);
  return String(v);
}

export function createCompareView(ctx) {
  let runs = [];
  let a = null;
  let b = null;

  function options(sel, value) {
    fill(sel, runs.map((r) => el('option', { value: r.id, text: `${r.title} · ${when(r.started)} · ${r.status}`, selected: r.id === value })));
    sel.value = value || '';
  }

  async function drawCompare() {
    const project = ctx.state()?.project?.slug || ctx.ui.project;
    if (!a || !b) {
      fill($('cmp-body'), el('p', { class: 'empty', text: 'Choose two runs.' }));
      return;
    }
    if (a === b) {
      fill($('cmp-body'), el('p', { class: 'empty', text: 'Choose two different runs.' }));
      return;
    }
    const d = await api('compare', '/api/compare', { project, a, b });
    if (d === undefined) return;
    if (!d) {
      fill($('cmp-body'), el('p', { class: 'empty', text: 'One of the runs is no longer in this project.' }));
      return;
    }
    const table = el('table', { class: 'cmp-table' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: '' }), el('th', { scope: 'col', text: `A · ${d.a.title}` }), el('th', { scope: 'col', text: `B · ${d.b.title}` }))),
      el('tbody', {}, ...d.rows.map((r) => el('tr', { class: !r.comparable ? 'is-incomparable' : r.changed ? 'is-changed' : null, title: r.note || null },
        el('th', { scope: 'row', text: r.label }),
        el('td', { class: 'mono', text: show(r.key, r.a) }),
        el('td', { class: 'mono' }, show(r.key, r.b), !r.comparable ? el('span', { class: 'badge', text: 'not comparable', title: r.note }) : null)))));
    const changedTests = d.tests.filter((t) => t.changed);
    const tests = el('section', { class: 'inv-sec' }, el('h4', { class: 'sub', text: `Test cases: ${num(d.tests.length)}, ${num(changedTests.length)} with a different result` }),
      changedTests.length ? el('table', {}, el('tbody', {}, ...changedTests.slice(0, 200).map((t) => el('tr', {}, el('td', { class: 'mono case-name', text: t.name }),
        el('td', {}, el('span', { class: `result r-${t.a || 'none'}`, text: t.a || 'absent' })), el('td', {}, el('span', { class: `result r-${t.b || 'none'}`, text: t.b || 'absent' }))))))
        : el('p', { class: 'empty', text: d.tests.length ? 'Every case has the same result in both runs.' : 'Neither run has named test cases.' }));
    const list = (title, items) => el('details', {}, el('summary', { text: `${title} (${num(items.length)})` }), el('ul', { class: 'mini-list mono' }, ...items.slice(0, 300).map((p) => el('li', { title: p, text: tail(p) }))));
    const files = el('section', { class: 'inv-sec' }, el('h4', { class: 'sub', text: 'Files read or edited' }),
      list('In both', d.files.both), list('Only in A', d.files.onlyA), list('Only in B', d.files.onlyB));
    const commits = el('section', { class: 'inv-sec' }, el('h4', { class: 'sub', text: 'Confirmed commits' }),
      el('div', { class: 'inv-cols' }, el('ul', { class: 'mini-list mono' }, ...(d.commits.a.length ? d.commits.a.map((c) => el('li', { text: c })) : [el('li', { class: 'empty', text: 'None in A' })])),
        el('ul', { class: 'mini-list mono' }, ...(d.commits.b.length ? d.commits.b.map((c) => el('li', { text: c })) : [el('li', { class: 'empty', text: 'None in B' })]))));
    fill($('cmp-body'), table, tests, files, commits);
  }

  async function drawRelated() {
    const project = ctx.state()?.project?.slug || ctx.ui.project;
    if (!a) return;
    const d = await api('related', '/api/related', { project, run: a });
    if (d === undefined || !d) return;
    fill($('cmp-related'), d.related.length ? d.related.map((r) => el('li', {},
      el('button', { type: 'button', class: `related${r.id === b ? ' is-current' : ''}`, onclick: () => setB(r.id) },
        el('span', { class: 'run-title', text: r.title }), el('span', { class: 'muted', text: ` ${when(r.started)} · ${r.status}${r.earlier ? ', earlier' : ', later'}` }),
        el('span', { class: 'reasons', text: r.reasons.join('; ') })))) : [el('li', { class: 'empty', text: 'No run shares this one\'s workflow, title, branch or files.' })]);
    if (!b && d.related[0]) setB(d.related[0].id);
    $('cmp-related-note').textContent = d.note;
  }

  function keep() {
    ctx.go('compare', { run: ctx.ui.run, params: { a: a || '', b: b || '' }, replace: true });
  }
  function setB(id) {
    b = id;
    keep();
  }

  $('cmp-a').addEventListener('change', (e) => {
    a = e.target.value;
    b = null;
    keep();
  });
  $('cmp-b').addEventListener('change', (e) => setB(e.target.value));
  $('cmp-swap').addEventListener('click', () => {
    [a, b] = [b, a];
    keep();
  });

  async function load(params) {
    const s = ctx.state();
    const project = s?.project?.slug || ctx.ui.project;
    const list = await api('cmp-runs', '/api/archive', { project, limit: 200 });
    if (list === undefined) return;
    runs = list?.rows || [];
    a = params.get('a') || ctx.ui.run || s?.focus || runs[0]?.id || null;
    b = params.get('b') || null;
    options($('cmp-a'), a);
    options($('cmp-b'), b);
    $('cmp-note').textContent = list?.status?.building ? 'The archive is still being built; runs appear here as they are read.' : '';
    await drawRelated();
    if (!b) {
      const i = runs.findIndex((r) => r.id === a);
      b = runs[i + 1]?.id || runs.find((r) => r.id !== a)?.id || null;
      options($('cmp-b'), b);
    }
    drawCompare();
  }

  return {
    panel: 'view-compare',
    show(params) {
      load(params);
    },
    onState() { /* fetched when the view opens */ },
  };
}
