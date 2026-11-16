/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Tests View (dd1 Tools Edition - v1.2)
 *     - File Name: tests.js
 *     - Relative Path: web/tests.js
 *     - Artifact Type: javascript
 *     - Version: 1.2.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       history as tiles with an icon each, room around them, the run's name
 *       on hover, and a legend above the table.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A Show
 *       only label for the class chips and a box that filters the cases by
 *       name, with the count shown and filtered.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's test-regression stage (R06): a run's named
 *       cases, each against the same case in earlier runs.
 *
 * ✒ Description:
 *     The Tests view: every named test case of the run in focus, its result
 *     now, what that means against earlier comparable runs (a new failure,
 *     a recovery, still failing, a flaky candidate, new, or stable), its
 *     history as a row of results, and where each result was read.
 *
 * ✒ Key Features:
 *     - Counts by class, the runs compared with and why those
 *     - A filter by class; new failures and flaky candidates first
 *     - A case that failed and then passed within this run is marked
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/tests
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, icon, when, num, api } from './core.js';

export const CLASS = {
  'new-failure': ['New failure', 'is-bad', 'Passed in the previous comparable run, fails now'],
  'flaky-candidate': ['Flaky candidate', 'is-warn', 'Its result changed at least twice across the runs compared'],
  'still-failing': ['Still failing', 'is-bad', 'Failed before and fails now'],
  recovered: ['Recovered', 'is-ok', 'Failed in the previous comparable run, passes now'],
  new: ['New', 'is-info', 'Not seen in the runs compared'],
  skipped: ['Skipped', '', 'Skipped in this run'],
  stable: ['Stable', '', 'Passed before and passes now'],
};
const SOURCE = { 'tool-result': 'a test command\'s output', 'scratch-log': 'a log in the run\'s scratch folder', 'workflow-result': 'the workflow\'s own result' };

export function createTestsView(ctx) {
  let data = null;
  let only = null;
  let q = '';
  // A result as a tile: an icon and a tint, so it never rests on colour alone.
  const CELL = { passed: ['check', 'passed'], failed: ['x', 'failed'], skipped: ['minus', 'skipped'], none: ['minus', 'not in that run'] };
  const cell = (result, extra = '', title = null) => {
    const [glyph, word] = CELL[result] || CELL.none;
    return el('span', { class: `hcell r-${CELL[result] ? result : 'none'}${extra}`, title: title || word }, icon(glyph));
  };

  function draw() {
    if (!data) return;
    fill($('tests-counts'), el('span', { class: 'filter-label', text: 'Show only' }), ...Object.entries(CLASS).filter(([k]) => data.counts[k]).map(([k, [label, cls, tip]]) => el('button', {
      type: 'button', class: `badge ${cls} as-filter`, 'aria-pressed': String(only === k), title: tip,
      onclick: () => {
        only = only === k ? null : k;
        draw();
      },
    }, `${num(data.counts[k])} ${label.toLowerCase()}`)));
    fill($('tests-legend'), el('span', { class: 'filter-label', text: 'Earlier runs, oldest first, then this one' }),
      el('span', {}, cell('passed'), 'passed'), el('span', {}, cell('failed'), 'failed'), el('span', {}, cell('none'), 'not in that run'),
      el('span', {}, cell('passed', ' is-now'), 'this run, ringed'));
    $('tests-note').textContent = data.note + (data.archive?.building ? ' The archive is still being built, so earlier runs may be missing.' : '');
    fill($('tests-compared'), data.compared.length ? [el('span', { class: 'muted', text: 'Compared with: ' }), ...data.compared.map((r, i) => el('button', { type: 'button', class: 'chip', title: `${r.status}, ${when(r.started)}`, onclick: () => ctx.go('live', { run: r.id }) }, `${i + 1}. ${r.title}`))] : []);
    const rows = data.cases.filter((c) => (!only || c.class === only) && (!q || c.name.toLowerCase().includes(q)));
    $('tests-run').textContent = `${data.run.title} · ${rows.length === data.cases.length ? `${num(data.cases.length)} named cases` : `${num(rows.length)} of ${num(data.cases.length)} named cases`}`;
    fill($('tests-rows'), rows.length ? rows.map((c) => {
      const [label, cls, tip] = CLASS[c.class] || [c.class, '', ''];
      return el('tr', {},
        el('td', { class: 'mono case-name', text: c.name }),
        el('td', {}, el('span', { class: `result r-${c.result}`, text: c.result }), c.flippedInRun ? el('span', { class: 'badge is-warn', text: 'flipped in this run', title: 'This case had more than one result within this run' }) : null),
        el('td', {}, el('span', { class: `badge ${cls}`, text: label, title: tip })),
        el('td', {}, el('span', { class: 'history', role: 'img', 'aria-label': `${c.history.map((h) => CELL[h.result || 'none']?.[1] || h.result).join(', ')}; now ${c.result}` },
          ...c.history.map((h) => {
            const i = data.compared.findIndex((r) => r.id === h.run);
            const r = data.compared[i];
            return cell(h.result || 'none', '', `${CELL[h.result || 'none']?.[1] || h.result} in ${r ? `${i + 1}. ${r.title}, ${when(r.started)}` : h.run}`);
          }),
          el('span', { class: 'hsep', 'aria-hidden': 'true' }, icon('caret-right')),
          cell(c.result, ' is-now', `${c.result} in this run`))),
        el('td', { class: 'muted', text: SOURCE[c.source] || '-' }));
    }) : [el('tr', {}, el('td', { colspan: '5', class: 'empty', text: data.cases.length ? 'No case matches.' : 'No named test cases in this run: its test commands\' output named none, or it ran none.' }))]);
  }

  $('tests-q').addEventListener('input', (e) => {
    q = e.target.value.trim().toLowerCase();
    draw();
  });

  async function load() {
    const s = ctx.state();
    const body = await api('tests', '/api/tests', { project: s?.project?.slug || ctx.ui.project, run: ctx.ui.run || s?.focus });
    if (body === undefined) return;
    data = body;
    if (!body) $('tests-run').textContent = 'No run to show.';
    draw();
  }

  return {
    panel: 'view-tests',
    show(params) {
      only = params.get('class') || null;
      load();
    },
    onState() { /* fetched when the view opens */ },
  };
}
