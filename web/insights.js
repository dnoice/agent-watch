/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Insights View (dd1 Tools Edition - v1.0)
 *     - File Name: insights.js
 *     - Relative Path: web/insights.js
 *     - Artifact Type: script
 *     - Version: 1.0.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version: the Insights tab Dennis asked for, the run in focus and the
 *       project's runs as charts.
 *
 * ✒ Description:
 *     Two views of the same project under one switch. This run: its headline
 *     figures, then what it did over time by kind with its phases above, how
 *     many agents worked at once, each agent's tool calls by result, how long
 *     the calls took, each test run's cases, the output tokens by agent and
 *     the files touched most. Every run: one column per run, oldest to
 *     newest, for its time, its tool calls, its tokens, its test runs, its
 *     errors and its commits. A column opens its run.
 *
 * ✒ Key Features:
 *     - Event kinds in the validated palette's first six slots, in that
 *       order, errors in the page's status red; pass and fail in its status
 *       green and red, since there the colour means the result
 *     - Each chart has a legend for two or more series, a tooltip, keyboard
 *       reading and a table view
 *     - Tokens from saved records and from transcripts drawn as two series,
 *       never added together
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js, chart.js; the server's /api/insights
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, span, num, when, api } from './core.js';
import { chartCard, columns, hbars, stepArea, vizTable, compact, hm } from './chart.js';

export const KIND_SERIES = [
  { key: 'say', label: 'said', cls: 'say' },
  { key: 'tool', label: 'tool call', cls: 'tool' },
  { key: 'read', label: 'read', cls: 'read' },
  { key: 'edit', label: 'edit', cls: 'edit' },
  { key: 'test', label: 'test run', cls: 'test' },
  { key: 'commit', label: 'commit', cls: 'commit' },
];
// Errors are a result, not another kind of step: a red dot above the column, not a seventh colour.
const ERROR_MARK = { key: 'error', label: 'errors', cls: 'bad' };
const RESULT_SERIES = [
  { key: 'ok', label: 'came back ok', cls: 'ok' },
  { key: 'failed', label: 'came back as an error', cls: 'bad' },
  { key: 'open', label: 'no result seen', cls: 'open' },
];
const md = (t) => {
  const d = new Date(t);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};
// A bucket's width as people say it: 10 min, 2 h, 30 s.
const stepText = (ms) => (ms >= 3600000 ? `${ms / 3600000} h` : ms >= 60000 ? `${ms / 60000} min` : `${ms / 1000} s`);
const tail = (p) => String(p || '').split(/[\\/]/).slice(-2).join('/');

export function createInsightsView(ctx) {
  let data = null;
  let scope = 'run';

  const tile = (label, value, sub = null, tone = null) => el('div', { class: `kpi${tone ? ` is-${tone}` : ''}` },
    el('span', { class: 'kpi-label', text: label }), el('b', { class: 'kpi-value', text: value }), sub ? el('span', { class: 'kpi-sub', text: sub }) : null);

  function drawRun(r) {
    if (!r) return [el('p', { class: 'empty', text: 'No run to chart yet.' })];
    const k = r.kpis;
    const kpis = el('div', { class: 'kpis' },
      tile('Wall time', k.wall ? span(k.wall) : '-', `${num(k.agents)} ${k.agents === 1 ? 'agent' : 'agents'}`),
      tile('Tool calls', compact(k.toolCalls), k.toolCalls ? `${num(k.toolsFailed)} came back as errors (${Math.round((k.toolsFailed / k.toolCalls) * 100)}%)` : null, k.toolsFailed ? 'bad' : null),
      tile('Test runs', compact(k.testRuns), k.testRuns ? `${num(k.testsPassed)} passed, ${num(k.testsFailed)} failed` : 'none ran', k.testsFailed ? 'bad' : k.testRuns ? 'ok' : null),
      tile('Commits', compact(k.commitsConfirmed), k.commits ? `confirmed of ${num(k.commits)} tried` : 'none tried'),
      tile('Errors', compact(k.errors), 'tool results marked as errors', k.errors ? 'bad' : null),
      tile('Output tokens', k.outTokens === null ? '-' : compact(k.outTokens), 'summed from the transcripts'));

    const a = r.activity;
    const actRows = a ? a.buckets.map((b) => ({ t: b.t, values: b })) : [];
    const activity = chartCard({
      title: 'What the run did, over time',
      sub: a ? `Events per ${stepText(a.step)}, by kind, with the phases above` : null,
      legendItems: [...KIND_SERIES.map((s) => ({ label: s.label, cls: s.cls })), { label: 'errors (a dot above the column)', cls: 'bad', shape: 'dot' }],
      wide: true,
      empty: a ? null : 'No event in this run has a time yet.',
      render: (w, tip) => columns({
        width: w, height: 250, series: KIND_SERIES, marker: ERROR_MARK, rows: actRows, tip, label: 'Events over time by kind',
        time: a ? { from: a.from, to: a.to, step: a.step } : null,
        bands: r.phases.map((p) => ({ from: p.start, to: p.end || r.range.end, label: p.title, cls: p.state })),
        tipTitle: (row) => `${hm(row.t)} to ${hm(row.t + a.step)}`,
        onPick: (row) => ctx.go('timeline', { run: r.run.id, params: { at: String(row.t) } }),
      }),
      table: () => vizTable(['From', ...KIND_SERIES.map((s) => s.label), 'errors'], actRows.filter((x) => KIND_SERIES.some((s) => x.values[s.key]) || x.values.error).map((x) => [hm(x.t), ...KIND_SERIES.map((s) => num(x.values[s.key])), num(x.values.error)])),
      note: 'A column opens the Timeline at that moment.',
    });

    const conc = chartCard({
      title: 'Agents at work',
      sub: 'How many agents were between their first and last event',
      empty: r.concurrency.length ? null : 'No agent has a time yet.',
      render: (w, tip) => stepArea({ width: w, height: 180, points: r.concurrency, from: r.range.start, to: r.range.end, tip, cls: 'v1', what: 'agents at work', label: 'Agents at work over time' }),
      table: () => vizTable(['From', 'Agents'], r.concurrency.map((p) => [hm(p.t), num(p.n)])),
    });

    const agentRows = r.agents.map((x) => ({ label: x.label, full: `${x.label}${x.phase ? `, ${x.phase}` : ''}: ${x.status}`, values: { ok: x.ok, failed: x.failed, open: x.open } }));
    const calls = chartCard({
      title: 'Tool calls by agent',
      sub: 'Each call by what came back',
      legendItems: RESULT_SERIES,
      empty: agentRows.some((x) => x.values.ok + x.values.failed + x.values.open) ? null : 'No tool calls yet.',
      render: (w, tip) => hbars({ width: w, series: RESULT_SERIES, rows: agentRows, tip, label: 'Tool calls by agent' }),
      table: () => vizTable(['Agent', 'Ok', 'Errors', 'No result'], agentRows.map((x) => [x.label, num(x.values.ok), num(x.values.failed), num(x.values.open)])),
    });

    const durRows = r.durations.map((d) => ({ label: d.label, short: d.label, values: { n: d.count }, ms: d.ms }));
    const durations = chartCard({
      title: 'How long the tool calls took',
      sub: 'Calls by how long each took to come back',
      empty: durRows.some((x) => x.values.n) ? null : 'No tool call has been timed yet.',
      render: (w, tip) => columns({
        width: w, height: 190, series: [{ key: 'n', label: 'calls', cls: 'v1' }], rows: durRows, tip, label: 'Tool calls by duration',
        tipTitle: (row) => `${row.label}: ${span(row.ms)} in all`,
      }),
      table: () => vizTable(['Took', 'Calls', 'Time in all'], durRows.map((x) => [x.label, num(x.values.n), x.ms ? span(x.ms) : '-'])),
    });

    const counted = r.tests.filter((t) => t.passed !== null || t.failed !== null);
    const testRows = counted.map((t) => ({ label: `${hm(t.t)}, ${t.agent}`, short: hm(t.t), t: t.t, id: t.id, values: { passed: t.passed || 0, failed: t.failed || 0 }, text: t.text }));
    const tests = chartCard({
      title: 'Cases in each test run',
      sub: 'Passed and failed cases, run by run in the order they ran',
      legendItems: [{ label: 'passed', cls: 'ok' }, { label: 'failed', cls: 'bad' }],
      empty: testRows.length ? null : (r.tests.length ? `${num(r.tests.length)} test runs, none with output an adapter could count.` : 'No test run yet.'),
      render: (w, tip) => columns({
        width: w, height: 190, series: [{ key: 'passed', label: 'passed', cls: 'ok' }, { key: 'failed', label: 'failed', cls: 'bad' }], rows: testRows, tip, label: 'Cases per test run',
        tipTitle: (row) => `${row.label}: ${row.text}`,
        onPick: (row) => ctx.go('timeline', { run: r.run.id, params: { event: row.id } }),
      }),
      table: () => vizTable(['Test run', 'Passed', 'Failed'], testRows.map((x) => [x.label, num(x.values.passed), num(x.values.failed)])),
      note: r.tests.length > counted.length ? `${num(r.tests.length - counted.length)} more test runs had output no adapter could count.` : null,
    });

    const tokRows = r.agents.filter((x) => x.outTokens).sort((x, y) => y.outTokens - x.outTokens).map((x) => ({ label: x.label, values: { t: x.outTokens } }));
    const tok = chartCard({
      title: 'Output tokens by agent',
      sub: 'From the transcripts; input and cache tokens are not in them',
      empty: tokRows.length ? null : 'No output tokens read yet.',
      render: (w, tip) => hbars({ width: w, series: [{ key: 't', label: 'output tokens', cls: 'v1' }], rows: tokRows, tip, label: 'Output tokens by agent' }),
      table: () => vizTable(['Agent', 'Output tokens'], tokRows.map((x) => [x.label, num(x.values.t)])),
    });

    const fileRows = r.files.map((f) => ({ label: tail(f.path), full: f.path, values: { edits: f.edits, reads: f.reads } }));
    const files = chartCard({
      title: 'Files touched most',
      sub: 'Edits and reads, the ten files with the most',
      legendItems: [{ label: 'reads', cls: 'read' }, { label: 'edits', cls: 'edit' }],
      empty: fileRows.length ? null : 'No file read or edited yet.',
      render: (w, tip) => hbars({ width: w, series: [{ key: 'reads', label: 'reads', cls: 'read' }, { key: 'edits', label: 'edits', cls: 'edit' }], rows: fileRows, tip, label: 'Files touched most', labelWidth: 200, onPick: () => ctx.go('files', { run: r.run.id }) }),
      table: () => vizTable(['File', 'Edits', 'Reads'], fileRows.map((x) => [x.full, num(x.values.edits), num(x.values.reads)])),
    });

    return [kpis, el('div', { class: 'viz-grid' }, activity, conc, calls, durations, tests, tok, files),
      r.notes.length ? el('ul', { class: 'viz-notes' }, r.notes.map((n) => el('li', { text: n }))) : null];
  }

  function drawProject(p) {
    if (!p || !p.runs.length) return [el('p', { class: 'empty', text: 'The archive has no runs of this project yet.' })];
    const runs = p.runs;
    const open = (row) => ctx.go('live', { run: row.id });
    const base = (r) => ({ label: `${r.title}, ${when(r.started)}`, short: md(r.started), id: r.id, status: r.status });
    const title = (row) => `${row.label} (${row.status})`;
    const hours = Math.max(...runs.map((r) => r.wall || 0)) > 2 * 3600000;
    const wallRows = runs.map((r) => ({ ...base(r), values: { w: r.wall ? r.wall / (hours ? 3600000 : 60000) : 0 }, ms: r.wall }));
    const unit = hours ? 'h' : 'min';
    const statusCounts = runs.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {});
    const walls = runs.map((r) => r.wall).filter(Boolean).sort((x, y) => x - y);
    const kpis = el('div', { class: 'kpis' },
      tile('Runs', num(runs.length), p.total > runs.length ? `the newest ${num(runs.length)} of ${num(p.total)}` : 'in the archive'),
      tile('Completed', num(statusCounts.completed || 0), Object.entries(statusCounts).filter(([s]) => s !== 'completed').map(([s, n]) => `${n} ${s}`).join(', ') || 'every one'),
      tile('Typical run', walls.length ? span(walls[Math.floor(walls.length / 2)]) : '-', 'the median wall time'),
      tile('Errors', compact(runs.reduce((s, r) => s + (r.errors || 0), 0)), 'across these runs'));

    const card = (o) => chartCard({ ...o, note: o.note || 'A column opens its run in Live.' });
    const wall = card({
      title: 'Wall time',
      sub: `Each run from its first event to its end, in ${hours ? 'hours' : 'minutes'}`,
      render: (w, tip) => columns({ width: w, series: [{ key: 'w', label: 'wall time', cls: 'v1' }], rows: wallRows, tip, label: 'Wall time per run', integer: false, fmt: (v) => `${compact(Math.round(v * 10) / 10)} ${unit}`, tipTitle: title, onPick: open }),
      table: () => vizTable(['Run', 'Started', 'Wall time'], runs.map((r) => [r.title, when(r.started), r.wall ? span(r.wall) : '-'])),
    });
    const callRows = runs.map((r) => ({ ...base(r), values: { ok: Math.max(0, (r.toolCalls || 0) - (r.toolsFailed || 0)), failed: r.toolsFailed || 0 } }));
    const calls = card({
      title: 'Tool calls',
      sub: 'By what came back, where the run was read in full',
      legendItems: RESULT_SERIES.slice(0, 2),
      render: (w, tip) => columns({ width: w, series: RESULT_SERIES.slice(0, 2), rows: callRows, tip, label: 'Tool calls per run', tipTitle: title, onPick: open }),
      table: () => vizTable(['Run', 'Ok', 'Errors'], callRows.map((x, i) => [runs[i].title, num(x.values.ok), num(x.values.failed)])),
    });
    const TOK = [{ key: 'total', label: 'total tokens (saved record)', cls: 'v1' }, { key: 'output', label: 'output tokens only (transcripts)', cls: 'v2' }];
    const tokRows = runs.map((r) => ({ ...base(r), values: { [r.tokensKind === 'output' ? 'output' : 'total']: r.tokens || 0 } }));
    const tok = card({
      title: 'Tokens',
      sub: 'Two kinds, drawn apart and not comparable',
      legendItems: TOK,
      render: (w, tip) => columns({ width: w, series: TOK, rows: tokRows, tip, label: 'Tokens per run', tipTitle: title, onPick: open }),
      table: () => vizTable(['Run', 'Tokens', 'Kind'], runs.map((r) => [r.title, r.tokens === null ? '-' : num(r.tokens), r.tokensKind || '-'])),
      note: p.note,
    });
    const testRows = runs.map((r) => ({ ...base(r), values: { passed: r.testsPassed || 0, failed: r.testsFailed || 0 } }));
    const tests = card({
      title: 'Test runs',
      sub: 'Each run\'s test commands, by verdict',
      legendItems: [{ label: 'passed', cls: 'ok' }, { label: 'failed', cls: 'bad' }],
      render: (w, tip) => columns({ width: w, series: [{ key: 'passed', label: 'passed', cls: 'ok' }, { key: 'failed', label: 'failed', cls: 'bad' }], rows: testRows, tip, label: 'Test runs per run', tipTitle: title, onPick: open }),
      table: () => vizTable(['Run', 'Passed', 'Failed'], testRows.map((x, i) => [runs[i].title, num(x.values.passed), num(x.values.failed)])),
    });
    const errRows = runs.map((r) => ({ ...base(r), values: { e: r.errors || 0 } }));
    const errors = card({
      title: 'Errors',
      sub: 'Tool results marked as errors',
      render: (w, tip) => columns({ width: w, series: [{ key: 'e', label: 'errors', cls: 'bad' }], rows: errRows, tip, label: 'Errors per run', tipTitle: title, onPick: open }),
      table: () => vizTable(['Run', 'Errors'], errRows.map((x, i) => [runs[i].title, num(x.values.e)])),
    });
    const comRows = runs.map((r) => ({ ...base(r), values: { c: r.commits || 0 } }));
    const commits = card({
      title: 'Commits confirmed',
      sub: 'Each confirmed by git\'s own summary line',
      render: (w, tip) => columns({ width: w, series: [{ key: 'c', label: 'commits', cls: 'v1' }], rows: comRows, tip, label: 'Commits per run', tipTitle: title, onPick: open }),
      table: () => vizTable(['Run', 'Commits'], comRows.map((x, i) => [runs[i].title, num(x.values.c)])),
    });
    return [kpis, el('div', { class: 'viz-grid' }, wall, calls, tok, tests, errors, commits)];
  }

  function draw() {
    if (!data) return;
    for (const b of document.querySelectorAll('#ins-scope button')) b.setAttribute('aria-pressed', String(b.dataset.scope === scope));
    $('ins-run').textContent = scope === 'run'
      ? (data.run ? `${data.run.run.title} · ${data.run.run.status}` : '')
      : (data.project ? `${num(data.project.runs.length)} runs, oldest to newest${data.archive?.building ? ' · the archive is still being built' : ''}` : '');
    fill($('ins-body'), scope === 'run' ? drawRun(data.run) : drawProject(data.project));
  }

  for (const b of document.querySelectorAll('#ins-scope button')) {
    b.addEventListener('click', () => {
      scope = b.dataset.scope;
      draw();
    });
  }

  async function load() {
    const s = ctx.state();
    const body = await api('insights', '/api/insights', { project: s?.project?.slug || ctx.ui.project, run: ctx.ui.run || s?.focus });
    if (body === undefined) return;
    data = body || { run: null, project: null };
    draw();
  }

  return {
    panel: 'view-insights',
    show(params) {
      if (params.has('scope')) scope = params.get('scope') === 'project' ? 'project' : 'run';
      load();
    },
    onState() { /* fetched when the view opens */ },
  };
}
