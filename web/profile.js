/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Profile View (dd1 Tools Edition - v1.1)
 *     - File Name: profile.js
 *     - Relative Path: web/profile.js
 *     - Artifact Type: javascript
 *     - Version: 1.1.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
 *       retried command is clamped to two lines, the whole of it in its
 *       tooltip.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's profiling stage (R09): where the run's time
 *       went and what it repeated.
 *
 * ✒ Description:
 *     The Profile view: the run's wall clock beside its observed tool time
 *     and the stretches nobody wrote anything, its phases in order with the
 *     waits between them, how many agents worked at once, the longest tool
 *     calls, and the rework: retried failures, files edited and tested over
 *     and over, test runs repeated before a pass. Each figure says what it
 *     can and cannot see.
 *
 * ✒ Key Features:
 *     - Three kinds of time kept apart, never one called idle
 *     - The phase chain as bars on the run's own time
 *     - Longest calls and retries open on the timeline or in Investigate
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/profile
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, clock, span, num, api } from './core.js';

const tail = (p) => String(p).replace(/\\/g, '/').split('/').slice(-3).join('/');

export function createProfileView(ctx) {
  let runId = null;

  function stat(label, value, tip) {
    return el('div', { class: 'stat', title: tip || null }, el('b', { text: value }), el('span', { text: label }));
  }

  function draw(p) {
    $('prof-run').textContent = p.run.title;
    const pct = (ms) => (p.wall ? `${Math.round((ms / p.wall) * 100)}%` : '-');
    fill($('prof-stats'),
      stat('wall clock', span(p.wall), 'From the first event to the run\'s end'),
      stat('tool time', span(p.tool), `Calls with both their call and result seen; ${pct(p.tool)} of the wall clock, more than 100% when agents worked at once`),
      stat('unobserved', span(p.unobserved.total), `Stretches of two minutes or more in which no agent wrote a line; ${pct(p.unobserved.total)} of the wall clock`),
      stat('agents at once', p.concurrency.peak ? `${p.concurrency.peak} at most` : '-', p.concurrency.average ? `${p.concurrency.average.toFixed(1)} on average across the run` : ''),
      stat('retries', num(p.rework.retries.length), 'Commands that failed and were run again'),
      stat('edit-test loops', num(p.rework.loops.length), 'Files edited and tested in three cycles or more'));
    const start = p.start;
    const pos = (t) => (p.wall ? ((t - start) / p.wall) * 100 : 0);
    fill($('prof-phases'), p.phases.length ? p.phases.map((ph) => el('div', { class: 'prof-row' },
      el('span', { class: 'prof-label', title: ph.title }, el('b', { text: ph.title }), el('span', { text: `${span(ph.span)}${ph.waitBefore ? `, waited ${span(ph.waitBefore)}` : ''}` })),
      el('span', { class: 'prof-track' }, el('button', { type: 'button', class: `prof-bar is-${ph.state}`, left: `${pos(ph.start)}%`, width: `${Math.max(0.8, (ph.span / (p.wall || 1)) * 100)}%`, title: `${ph.title}: ${clock(ph.start)} to ${clock(ph.end)}, ${ph.agents} agents`, onclick: () => ctx.go('timeline', { run: runId, params: { at: String(ph.start) } }) })))) : [el('p', { class: 'empty', text: 'No phase has started.' })]);
    fill($('prof-agents'), p.agents.map((a) => el('div', { class: 'prof-row' },
      el('span', { class: 'prof-label', title: a.label }, el('b', { text: a.label }), el('span', { text: `${span(a.span)}, tools ${span(a.tool)}${a.longestGap ? `, longest silence ${span(a.longestGap)}` : ''}` })),
      el('span', { class: 'prof-track' }, a.start ? el('span', { class: 'prof-bar is-agent', left: `${pos(a.start)}%`, width: `${Math.max(0.8, (a.span / (p.wall || 1)) * 100)}%`, title: `${clock(a.start)} to ${clock(a.end)}` }) : null))));
    fill($('prof-longest'), p.longest.length ? p.longest.map((e) => el('li', { class: `ev mini${e.status ? ` st-${e.status}` : ''}` },
      el('span', { class: 'ev-icon', text: '⏱' }),
      el('div', { class: 'ev-text' }, el('span', { class: 'ev-agent', text: e.agentLabel }), el('span', { class: 'ev-tool', text: e.tool }), e.text),
      el('span', { class: 'ev-side' }, el('b', { class: 'mono', text: span(e.ms) }),
        el('button', { type: 'button', class: 'link-btn plain', onclick: () => ctx.go('timeline', { run: runId, params: { event: e.id } }) }, 'timeline')))) : [el('li', { class: 'empty', text: 'No call had both its call and result seen.' })]);
    const r = p.rework;
    fill($('prof-rework'),
      el('h4', { class: 'sub', text: 'Commands retried after failing' }),
      r.retries.length ? el('ol', { class: 'mini-list' }, ...r.retries.map((x) => el('li', { class: 'rework' },
        el('span', { class: 'mono rework-cmd', title: x.sig, text: x.sig }), el('span', { class: 'muted', text: ` ${x.agentLabel} · run ${x.times} times, ${x.failed} failed` }),
        el('button', { type: 'button', class: 'link-btn', onclick: () => ctx.go('investigate', { run: runId, params: { event: x.ids[0] } }) }, 'Investigate')))) : el('p', { class: 'empty', text: 'No command failed and was run again.' }),
      el('h4', { class: 'sub', text: 'Files edited and tested in three cycles or more' }),
      r.loops.length ? el('ol', { class: 'mini-list' }, ...r.loops.map((x) => el('li', { class: 'rework' }, el('span', { class: 'mono', title: x.path, text: tail(x.path) }), el('span', { class: 'muted', text: ` ${x.cycles} cycles · ${x.agents.join(', ')}` })))) : el('p', { class: 'empty', text: 'No file went round three edit-and-test cycles.' }),
      el('h4', { class: 'sub', text: 'Test runs repeated before a pass' }),
      r.reruns.length ? el('ol', { class: 'mini-list' }, ...r.reruns.map((x) => el('li', { class: 'rework' }, el('span', { text: `${x.agentLabel}: ${x.failedRuns} failing ${x.failedRuns === 1 ? 'run' : 'runs'}, then a pass at ${clock(x.passedAt)}` })))) : el('p', { class: 'empty', text: 'No failing test run was followed by a passing one.' }));
    fill($('prof-notes'), p.notes.map((n) => el('li', { text: n })));
  }

  async function load() {
    const s = ctx.state();
    runId = ctx.ui.run || s?.focus || null;
    const body = await api('profile', '/api/profile', { project: s?.project?.slug || ctx.ui.project, run: runId });
    if (body === undefined) return;
    if (!body) {
      $('prof-run').textContent = 'No run to show.';
      return;
    }
    runId = body.run.id;
    draw(body);
  }

  return { panel: 'view-profile', show: load, onState() { /* fetched when the view opens */ } };
}
