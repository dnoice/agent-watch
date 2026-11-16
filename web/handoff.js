/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Handoff View (dd1 Tools Edition - v1.1)
 *     - File Name: handoff.js
 *     - Relative Path: web/handoff.js
 *     - Artifact Type: javascript
 *     - Version: 1.1.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Evidence
 *       as a summary over a list of three, the rest behind N more; the
 *       criterion in bold.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's completion stage (R10): the run against its
 *       workflow's criteria, and the handoff report to download.
 *
 * ✒ Description:
 *     The Handoff view: each completion criterion for the run's workflow,
 *     satisfied, unsatisfied or not observed, with its evidence, the report
 *     as it would read, and buttons to download it as Markdown or JSON.
 *     Until criteria are written for the workflow, a starter set is shown,
 *     labelled as not adopted, with the command that writes it for editing.
 *
 * ✒ Key Features:
 *     - Not observed is never counted as met
 *     - The criteria file's place, or why it could not be read
 *     - Downloads made only when a button is pressed
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/handoff
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, num, api } from './core.js';

const STATE = { satisfied: ['Satisfied', 'is-ok'], unsatisfied: ['Unsatisfied', 'is-bad'], 'not-observed': ['Not observed', 'is-warn'] };

export function createHandoffView(ctx) {
  async function load() {
    const s = ctx.state();
    const project = s?.project?.slug || ctx.ui.project;
    const run = ctx.ui.run || s?.focus || null;
    const d = await api('handoff', '/api/handoff', { project, run });
    if (d === undefined) return;
    if (!d) {
      $('ho-run').textContent = 'No run to show.';
      return;
    }
    $('ho-run').textContent = `${d.run.title} · ${num(d.satisfied)} of ${num(d.results.length)} satisfied`;
    const c = d.criteria;
    const src = c.source === 'file'
      ? el('p', { class: 'hint' }, 'Criteria from ', el('code', { text: c.path }), '. Edit that file to change what a finished run of this workflow must show.')
      : el('div', { class: `callout ${c.source === 'invalid' ? 'is-bad' : 'is-warn'}` },
        el('span', {}, c.source === 'invalid' ? `The criteria file could not be read (${c.error}), so the starter set is shown instead.` : 'No criteria are written for this workflow yet, so this is the starter set, shown and not adopted. ',
          'To write it out for editing: ', el('code', { text: `digi agent-watch criteria${d.run.name ? ` --workflow ${d.run.name}` : ''}` }), c.path ? ` (it goes to ${c.path})` : ''));
    const rows = d.results.map((r) => {
      const [label, cls] = STATE[r.state] || [r.state, ''];
      return el('tr', { class: 'is-plain' }, el('td', { class: 'ho-criterion', text: r.label }), el('td', {}, el('span', { class: `badge ${cls}`, text: label })), evidenceCell(r.evidence));
    });
    const q = new URLSearchParams({ project, run: d.run.id });
    fill($('ho-body'), src,
      el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, el('th', { scope: 'col', text: 'Criterion' }), el('th', { scope: 'col', text: 'State' }), el('th', { scope: 'col', text: 'Evidence' }))), el('tbody', {}, ...rows))),
      el('div', { class: 'ho-actions' },
        el('a', { class: 'btn btn-primary', href: `/api/handoff?${q}&format=md`, download: '' }, 'Download Markdown'),
        el('a', { class: 'btn', href: `/api/handoff?${q}&format=json`, download: '' }, 'Download JSON'),
        el('span', { class: 'muted', text: 'Paths are written with the home folder as ~, and excerpts are redacted. Nothing is sent anywhere.' })),
      el('h4', { class: 'sub', text: 'The report' }),
      el('pre', { class: 'out ho-preview', text: d.preview }));
  }
  /** Evidence: a line each; a listed item its text over a list of three, the rest behind "N more". */
  function evidenceCell(list) {
    return el('td', { class: 'evidence' }, list.map((e) => {
      if (typeof e === 'string') return el('p', { text: e });
      return el('div', {},
        el('p', { class: 'ev-sum', text: e.text }),
        el('ul', { class: 'ev-items' }, e.items.slice(0, 3).map((x) => el('li', { text: x }))),
        e.items.length > 3 ? el('details', { class: 'ev-more' }, el('summary', { text: `${e.items.length - 3} more` }), el('ul', { class: 'ev-items' }, e.items.slice(3).map((x) => el('li', { text: x })))) : null);
    }));
  }
  return { panel: 'view-handoff', show: load, onState() { /* fetched when the view opens */ } };
}
