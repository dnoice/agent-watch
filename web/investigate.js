/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Investigate View (dd1 Tools Edition - v1.3)
 *     - File Name: investigate.js
 *     - Relative Path: web/investigate.js
 *     - Artifact Type: javascript
 *     - Version: 1.3.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The note
 *       as a closed How this was put together list.
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       Incidents listed and headed by the agent's description of the
 *       command, the command itself in the tooltip and in a code block under
 *       the heading; the transcript reference takes a wide cell.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Show on
 *       the timeline, beside the failing call.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's investigation stage (R01): the run's
 *       incidents, unresolved first, and one opened in full beside them.
 *
 * ✒ Description:
 *     The Investigate view: every failure of the run in focus, with retries
 *     folded together, and the one chosen laid out as evidence: the call
 *     and what came back, the steps before and after it, what the other
 *     agents were doing, the files in play, and any later recovery, said to
 *     be a correlation.
 *
 * ✒ Key Features:
 *     - Incidents unresolved first, each with its type, agent, how many
 *       times it happened and whether anything later came back ok
 *     - The failing call's command, time, duration and transcript line, and
 *       its result as text
 *     - Before, after and the other agents within two minutes, in order
 *     - The chosen incident is kept in the address (#view=investigate&event=)
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/incidents, /api/investigate
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, icon, when, clock, span, api, how } from './core.js';

const TYPE_ICON = { 'tool-error': 'warning-octagon', 'test-failure': 'flask', 'commit-failed': 'git-commit', 'log-failure': 'file-text', 'reported-failure': 'clipboard-text' };
const KIND_ICON = { say: 'chat-teardrop-text', tool: 'terminal-window', read: 'magnifying-glass', edit: 'pencil-simple-line', test: 'flask', commit: 'git-commit', error: 'warning-octagon' };

export function createInvestigateView(ctx) {
  let current = null;
  let runId = null;
  let list = [];

  function evRow(e, showAgent = false) {
    return el('li', { class: `ev mini is-${e.kind}${e.status ? ` st-${e.status}` : ''}${e.outcome ? ` oc-${e.outcome}` : ''}` },
      el('span', { class: 'ev-icon' }, icon(KIND_ICON[e.kind] || 'dot')),
      el('div', { class: 'ev-text' }, showAgent && e.agentLabel ? el('span', { class: 'ev-agent', text: e.agentLabel }) : null,
        e.tool && e.kind !== 'say' ? el('span', { class: 'ev-tool', text: e.tool }) : null, e.text),
      el('span', { class: 'ev-side' },
        e.status ? el('span', { class: `ev-status is-${e.status}`, text: e.status === 'pending' ? '…' : e.status === 'ok' ? '✓' : '✗' }) : null,
        el('time', { class: 'ev-time', text: clock(e.t), title: `${when(e.t)}${e.line ? ` · line ${e.line}` : ''}` })));
  }

  function recoveredBadge(r) {
    if (!r) return el('span', { class: 'badge is-bad', text: 'unresolved', title: 'Nothing later in the run came back ok for it' });
    return el('span', { class: `badge ${r.strength === 'direct' ? 'is-ok' : 'is-info'}`, text: r.strength === 'direct' ? 'recovered' : 'later passed', title: r.text });
  }

  function drawList() {
    const box = $('inv-list');
    if (!list.length) {
      box.replaceChildren(el('li', { class: 'empty', text: 'No failures in this run: no tool call came back as an error, no test run reported failures, and no commit failed.' }));
      return;
    }
    box.replaceChildren(...list.map((i) => el('li', {},
      el('button', {
        type: 'button', class: `incident${i.id === current ? ' is-current' : ''}`, 'aria-pressed': String(i.id === current),
        onclick: () => choose(i.id),
      },
      el('span', { class: 'incident-icon' }, icon(TYPE_ICON[i.type] || 'warning')),
      el('span', { class: 'incident-body' },
        // The description the agent gave reads better in a list than the raw command, which is
        // in the tooltip and, in full, in the detail.
        el('span', { class: 'incident-title', title: i.cmd || i.text || null }, i.tool ? el('span', { class: 'ev-tool', text: i.tool }) : null, i.text || i.cmd),
        el('span', { class: 'incident-meta', text: [i.agentLabel, i.t ? clock(i.t) : null, i.occurrences > 1 ? `${i.occurrences} times` : null].filter(Boolean).join(' · ') })),
      recoveredBadge(i.recovered)))));
  }

  function section(title, kids, emptyText) {
    return el('section', { class: 'inv-sec' }, el('h4', { class: 'sub', text: title }), kids.length ? el('ol', { class: 'mini-list' }, kids) : el('p', { class: 'empty', text: emptyText }));
  }

  async function drawDetail() {
    const box = $('inv-detail');
    if (!current) {
      box.replaceChildren(el('p', { class: 'empty', text: list.length ? 'Choose an incident to see the evidence around it.' : '' }));
      return;
    }
    const d = await api('investigate', '/api/investigate', { project: ctx.state()?.project?.slug, run: runId, event: current });
    if (d === undefined) return;
    if (!d) {
      box.replaceChildren(el('p', { class: 'empty', text: 'That incident is not in this run.' }));
      return;
    }
    const i = d.incident;
    const f = d.failing;
    const head = el('div', { class: 'inv-head' },
      el('p', { class: 'eyebrow', text: i.label }),
      el('h3', { class: 'inv-title', text: i.text || i.cmd }),
      el('p', { class: 'muted', text: [i.agentLabel && `${i.agentLabel}${i.phase ? `, ${i.phase}` : ''}`, i.t && when(i.t), i.occurrences > 1 && `${i.occurrences} times, the last at ${clock(i.last)}`].filter(Boolean).join(' · ') }));
    const call = f ? el('dl', { class: 'facts' },
      el('div', {}, el('dt', { text: 'Tool' }), el('dd', { text: f.tool || '-' })),
      el('div', {}, el('dt', { text: 'Called' }), el('dd', { text: when(f.t) })),
      el('div', {}, el('dt', { text: 'Came back' }), el('dd', { text: f.end ? `${clock(f.end)}${f.ms !== null && f.ms !== undefined ? `, after ${span(f.ms)}` : ''}` : 'no result yet' })),
      el('div', { title: f.file, class: 'is-wide' }, el('dt', { text: 'Transcript' }), el('dd', { text: `${String(f.file || '').split(/[\\/]/).pop()} line ${f.line}${f.rline ? `, result line ${f.rline}` : ''}` }))) : null;
    const onTimeline = f ? el('button', { type: 'button', class: 'btn', onclick: () => ctx.go('timeline', { run: runId, params: { event: f.id } }) }, icon('chart-line'), 'Show on the timeline') : null;
    // The exact command, when the heading is the agent's description of it.
    const cmd = i.cmd && i.cmd !== i.text ? el('pre', { class: 'out is-cmd', title: 'The command as the agent ran it', text: i.cmd }) : null;
    const out = (f?.out || i.excerpt) ? el('pre', { class: 'out', text: f?.out || i.excerpt }) : null;
    const tests = (f?.tests || i.tests) ? (() => {
      const t = f?.tests || i.tests;
      const failed = (t.cases || []).filter((c) => c.result === 'failed');
      return el('p', { class: 'muted' }, `Read as ${t.format || 'test'} output: ${t.passed ?? '-'} passed, ${t.failed ?? '-'} failed.`, failed.length ? ` Failing: ${failed.slice(0, 8).map((c) => c.name).join('; ')}${failed.length > 8 ? '…' : ''}` : '');
    })() : null;
    const rec = i.recovered
      ? el('div', { class: `callout ${i.recovered.strength === 'direct' ? 'is-ok' : 'is-info'}` }, icon(i.recovered.strength === 'direct' ? 'check-circle' : 'info'),
        el('span', {}, `${i.recovered.text}, at ${clock(i.recovered.t)}. `, el('em', { text: i.recovered.strength === 'direct' ? 'The same command, run again.' : 'A correlation in time, not a proven fix.' })))
      : el('div', { class: 'callout is-bad' }, icon('warning'), el('span', { text: 'Nothing later in the run came back ok for this command, and no later test run passed.' }));
    fill(box, head, cmd, call, onTimeline, rec, out, tests,
      how(d.note, 'How this was put together'),
      el('div', { class: 'inv-cols' },
        section('Before it, in this agent', d.before.map((e) => evRow(e)), 'Nothing before it.'),
        section('After it, in this agent', d.after.map((e) => evRow(e)), 'Nothing after it yet.')),
      section('Other agents within two minutes', d.around.map((e) => evRow(e, true)), 'No other agent wrote anything within two minutes of it.'),
      section('Files it had edited just before', d.files.map((x) => el('li', { class: 'file-row' }, icon('file-code'), el('span', { class: 'mono', text: x.path }), el('time', { text: clock(x.t) }))), 'No edits in the fifteen steps before it.'),
      section('Test runs after it', d.testsAfter.map((e) => el('li', {}, evRow(e, true), e.tests ? el('span', { class: 'muted', text: ` ${e.tests.passed} passed, ${e.tests.failed} failed` }) : null)), 'No test run after it.'));
  }

  function choose(id) {
    current = id;
    ctx.go('investigate', { run: runId, params: { event: id }, replace: true });
  }

  async function load() {
    const s = ctx.state();
    runId = ctx.ui.run || s?.focus || null;
    const body = await api('incidents', '/api/incidents', { project: s?.project?.slug || ctx.ui.project, run: runId });
    if (body === undefined) return;
    if (!body) {
      $('inv-run').textContent = 'No run to investigate.';
      list = [];
      drawList();
      return;
    }
    runId = body.run.id;
    list = body.incidents;
    $('inv-run').textContent = `${body.run.title} · ${body.counts.total} incidents, ${body.counts.unresolved} unresolved`;
    if (!current && list.length) current = list[0].id;
    drawList();
    drawDetail();
  }

  return {
    panel: 'view-investigate',
    show(params) {
      const ev = params.get('event') || null;
      const run = ctx.ui.run || ctx.state()?.focus || null;
      // The same run's list is already here: only the chosen incident changed.
      if (list.length && run === runId && ev) {
        current = ev;
        drawList();
        drawDetail();
        return;
      }
      current = ev;
      load();
    },
    onState() { /* drawn on demand; the list is reloaded when the view is opened */ },
  };
}
