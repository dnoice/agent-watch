/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Insights (dd1 Tools Edition - v1.0)
 *     - File Name: insights.mjs
 *     - Relative Path: lib/insights.mjs
 *     - Artifact Type: library
 *     - Version: 1.0.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the Insights view Dennis asked for: a run's figures and
 *       the project's runs side by side, as series ready to chart.
 *
 * ✒ Description:
 *     Turns what the collector read into series the page charts without
 *     arithmetic of its own: for the run in focus, its activity over time
 *     by kind, how many agents worked at once, each agent's tool calls by
 *     result and its output tokens, how long tool calls took, each test run's
 *     cases, and the files touched most; for the project, one row per run
 *     with its time, calls, tokens, tests, commits and errors. It counts; it
 *     does not judge.
 *
 * ✒ Key Features:
 *     - Activity in buckets of a whole number of seconds or minutes, chosen
 *       so a run of any length gives at most 60 columns
 *     - Durations in fixed bands, from under a second to over ten minutes,
 *       for every tool call whose result was seen
 *     - Tokens from a saved record (total) and from transcripts (output)
 *       kept apart per run, since the two are not comparable
 *     - Every series says what it cannot see in a note beside it
 *
 * ✒ Usage Instructions:
 *     runInsights(bundle, fileMap(bundle).files)   // { kpis, activity, concurrency, agents, durations, tests, files }
 *     projectTrends(archive.entries(slug))          // { runs: [...], kinds }
 *
 * ✒ Other Important Information:
 *     - Dependencies: none
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Limits: events without a time are left out of the time series and
 *       counted; a tool call with no result has no duration
 * ----------------------------------------------------------------------------
 */

export const KINDS = ['say', 'tool', 'read', 'edit', 'test', 'commit', 'error'];
const STEPS = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400].map((s) => s * 1000);
const MAX_BUCKETS = 60;
export const BANDS = [
  { label: 'under 1 s', max: 1000 },
  { label: '1–5 s', max: 5000 },
  { label: '5–30 s', max: 30000 },
  { label: '30 s – 2 min', max: 120000 },
  { label: '2–10 min', max: 600000 },
  { label: 'over 10 min', max: Infinity },
];

/** The smallest whole step that keeps a span within the bucket limit. */
export function bucketFor(span) {
  return STEPS.find((s) => span / s <= MAX_BUCKETS) || Math.ceil(span / MAX_BUCKETS / 3600000) * 3600000;
}

/** A run's figures as series for the Insights view. */
export function runInsights(bundle, files = []) {
  const run = bundle.run;
  const events = [];
  let untimed = 0;
  for (const a of bundle.agents) {
    for (const e of a.events || []) {
      if (!e.t) untimed++;
      else events.push({ ...e, agent: a.id });
    }
  }
  events.sort((x, y) => x.t - y.t);
  const start = events.length ? events[0].t : run.started || null;
  const end = events.length ? Math.max(...events.map((e) => e.end || e.t)) : run.last || null;

  // Activity: whole-step buckets aligned to the step, so their edges fall on round times.
  let activity = null;
  if (start && end && end >= start) {
    const step = bucketFor(Math.max(1, end - start));
    const from = Math.floor(start / step) * step;
    const n = Math.max(1, Math.ceil((end - from + 1) / step));
    const buckets = Array.from({ length: n }, (_, i) => ({ t: from + i * step, ...Object.fromEntries(KINDS.map((k) => [k, 0])) }));
    for (const e of events) {
      const k = KINDS.includes(e.kind) ? e.kind : 'tool';
      buckets[Math.min(n - 1, Math.floor((e.t - from) / step))][k]++;
    }
    activity = { step, from, to: from + n * step, buckets };
  }

  // How many agents worked at once: each agent from its first event to its last.
  const spans = bundle.agents.map((a) => {
    const ts = (a.events || []).filter((e) => e.t).map((e) => e.t);
    const ends = (a.events || []).filter((e) => e.t).map((e) => e.end || e.t);
    return ts.length ? { id: a.id, label: a.label, from: Math.min(...ts), to: Math.max(...ends) } : null;
  }).filter(Boolean);
  const edges = spans.flatMap((s) => [{ t: s.from, d: 1 }, { t: s.to, d: -1 }]).sort((x, y) => x.t - y.t || y.d - x.d);
  const concurrency = [];
  let level = 0;
  for (const e of edges) {
    level += e.d;
    const last = concurrency[concurrency.length - 1];
    if (last && last.t === e.t) last.n = level;
    else concurrency.push({ t: e.t, n: level });
  }

  // Each agent's calls by result, its tools and its output tokens.
  const agents = bundle.agents.map((a) => {
    const calls = (a.events || []).filter((e) => e.use);
    const byTool = {};
    for (const e of calls) byTool[e.tool || 'other'] = (byTool[e.tool || 'other'] || 0) + 1;
    return {
      id: a.id,
      label: a.label,
      phase: a.phase,
      status: a.status,
      ok: calls.filter((e) => e.status === 'ok').length,
      failed: calls.filter((e) => e.status === 'error').length,
      open: calls.filter((e) => e.status !== 'ok' && e.status !== 'error').length,
      outTokens: a.stats?.outTokens ?? null,
      byTool,
    };
  });

  const timed = events.filter((e) => e.use && Number.isFinite(e.ms));
  const durations = BANDS.map((b, i) => {
    const inBand = timed.filter((e) => e.ms < b.max && (i === 0 || e.ms >= BANDS[i - 1].max));
    return { label: b.label, count: inBand.length, ms: inBand.reduce((s, e) => s + e.ms, 0) };
  });

  const labelOf = new Map(bundle.agents.map((a) => [a.id, a.label]));
  const tests = events.filter((e) => e.kind === 'test').map((e) => ({
    id: e.id,
    t: e.t,
    agent: labelOf.get(e.agent) || e.agent,
    text: e.text,
    outcome: e.outcome || 'unknown',
    passed: e.tests?.passed ?? null,
    failed: e.tests?.failed ?? null,
    format: e.tests?.format || null,
  }));

  const commits = events.filter((e) => e.kind === 'commit');
  const kpis = {
    wall: start && end ? (run.ended || end) - start : null,
    agents: bundle.agents.length,
    toolCalls: agents.reduce((s, a) => s + a.ok + a.failed + a.open, 0),
    toolsFailed: agents.reduce((s, a) => s + a.failed, 0),
    testRuns: tests.length,
    testsPassed: tests.filter((t) => t.outcome === 'passed').length,
    testsFailed: tests.filter((t) => t.outcome === 'failed').length,
    commits: commits.length,
    commitsConfirmed: commits.filter((e) => e.outcome === 'confirmed').length,
    errors: events.filter((e) => e.kind === 'error').length,
    outTokens: agents.every((a) => a.outTokens !== null) ? agents.reduce((s, a) => s + a.outTokens, 0) : null,
  };

  const top = [...files].sort((x, y) => (y.edits + y.reads) - (x.edits + x.reads)).slice(0, 10)
    .map((f) => ({ path: f.path, edits: f.edits, reads: f.reads }));

  return {
    run: { id: run.id, title: run.title, name: run.name, status: run.status, started: run.started, ended: run.ended },
    range: { start, end },
    untimed,
    kpis,
    phases: (run.phases || []).filter((p) => p.start).map((p) => ({ title: p.title, state: p.state, start: p.start, end: p.end })),
    activity,
    concurrency,
    agents,
    durations,
    tests,
    files: top,
    notes: [
      untimed ? `${untimed} events carry no time and are left out of the charts over time.` : null,
      timed.length < agents.reduce((s, a) => s + a.ok + a.failed, 0) ? 'A tool call is timed only when its call and its result were both seen.' : null,
    ].filter(Boolean),
  };
}

/** The project's runs, oldest first, one row each, for the Insights view's trends. */
export function projectTrends(entries, limit = 40) {
  const runs = [...entries].filter((e) => e.started).sort((a, b) => a.started - b.started).slice(-limit).map((e) => {
    const o = e.outcomes || {};
    return {
      id: e.id,
      title: e.title,
      name: e.name,
      status: e.status,
      started: e.started,
      wall: e.ended ? e.ended - e.started : (e.last ? e.last - e.started : null),
      tokens: e.tokens ?? null,
      tokensKind: e.tokensKind || null,
      toolCalls: e.toolCalls ?? null,
      toolsFailed: o.toolsFailed ?? null,
      testsPassed: o.testsPassed ?? null,
      testsFailed: o.testsFailed ?? null,
      commits: o.commitsConfirmed ?? (e.commits?.length ?? null),
      errors: o.errors ?? null,
      agents: e.agents ?? null,
      available: e.available !== false,
    };
  });
  return {
    runs,
    total: entries.length,
    note: 'Tokens from a saved record are the run\'s total (input, output and cache); from transcripts they are output tokens only. The two are drawn apart and are not comparable.',
  };
}
