/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Run Profiler (dd1 Tools Edition - v1.0)
 *     - File Name: profile.mjs
 *     - Relative Path: lib/profile.mjs
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
 *       version, for the audit's profiling stage (R09): where a run's time
 *       went, as far as its transcripts can say, and the loops it repeated.
 *
 * ✒ Description:
 *     Explains a run's elapsed time from what was recorded: the wall clock,
 *     the time its tool calls took, the phases in the order they ran and how
 *     many agents worked at once, the longest operations, and the stretches
 *     nobody wrote anything. Then the rework: commands retried after
 *     failing, files edited and tested over and over, test runs repeated
 *     until they passed. It measures; it does not judge.
 *
 * ✒ Key Features:
 *     - Three kinds of time kept apart: wall clock, observed tool time (a
 *       call and its result both seen), and unobserved stretches; time
 *       between an agent's lines is the model working, never called idle
 *     - Phases in start order with their spans and the waits between them,
 *       the run's longest observed chain since phases declare no other
 *       dependencies
 *     - Concurrency: the most agents working at once, and the average
 *     - The ten longest tool calls, each with its agent and line
 *     - Rework: a command that failed and was run again, a file edited and
 *       tested in three cycles or more, test runs repeated before a pass
 *     - Every figure says what it can and cannot see
 *
 * ✒ Usage Instructions:
 *     profile(bundle)   // { wall, tool, unobserved, phases, agents, longest, rework, notes }
 *
 * ✒ Examples:
 *     profile(b).rework.retries.filter((r) => r.times >= 3)
 *
 * ✒ Other Important Information:
 *     - Dependencies: claude.mjs (signature)
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Limits: clock skew and unrecorded work are invisible; agents in
 *       parallel can make tool time larger than wall time
 * ----------------------------------------------------------------------------
 */

import { signature } from './claude.mjs';

const GAP_MS = 2 * 60 * 1000;

/** Where a run's time went, and the loops it repeated. */
export function profile(bundle) {
  const run = bundle.run;
  const agents = [];
  const all = [];
  for (const a of bundle.agents) {
    const ev = (a.events || []).filter((e) => e.t);
    const times = ev.map((e) => e.end || e.t);
    const start = ev.length ? Math.min(...ev.map((e) => e.t)) : null;
    const end = times.length ? Math.max(...times) : null;
    const calls = ev.filter((e) => e.use && e.ms !== null && e.ms !== undefined);
    const tool = calls.reduce((s, e) => s + e.ms, 0);
    const gaps = [];
    for (let i = 1; i < ev.length; i++) {
      const prevEnd = ev[i - 1].end || ev[i - 1].t;
      if (ev[i].t - prevEnd > GAP_MS) gaps.push({ from: prevEnd, to: ev[i].t, ms: ev[i].t - prevEnd });
    }
    agents.push({ id: a.id, label: a.label, phase: a.phase, start, end, span: start && end ? end - start : 0, tool, calls: calls.length, events: (a.events || []).length, longestGap: gaps.reduce((m, g) => Math.max(m, g.ms), 0), gaps: gaps.length });
    for (const e of ev) all.push({ ...e, agent: a.id, agentLabel: a.label });
  }
  all.sort((x, y) => x.t - y.t);
  const first = all.length ? all[0].t : run.started;
  const lastSeen = all.length ? Math.max(...all.map((e) => e.end || e.t)) : run.last;
  const wallEnd = run.ended || lastSeen;
  const wall = wallEnd && first ? wallEnd - first : 0;
  const toolTotal = agents.reduce((s, a) => s + a.tool, 0);

  // Stretches when no agent wrote anything.
  const unobserved = [];
  let cursor = first;
  for (const e of all) {
    if (cursor && e.t - cursor > GAP_MS) unobserved.push({ from: cursor, to: e.t, ms: e.t - cursor });
    cursor = Math.max(cursor || 0, e.end || e.t);
  }

  // How many agents worked at once.
  const marks = [];
  for (const a of agents) {
    if (!a.start || !a.end) continue;
    marks.push([a.start, 1], [a.end, -1]);
  }
  marks.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  let now = 0;
  let peak = 0;
  for (const [, d] of marks) {
    now += d;
    peak = Math.max(peak, now);
  }
  const spanSum = agents.reduce((s, a) => s + a.span, 0);

  // Phases in the order they started, with the waits between them.
  const phases = (run.phases || []).filter((p) => p.start).map((p) => ({ title: p.title, state: p.state, start: p.start, end: p.end, span: p.end - p.start, agents: p.agents.length, share: wall ? (p.end - p.start) / wall : null }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < phases.length; i++) phases[i].waitBefore = Math.max(0, phases[i].start - phases[i - 1].end);

  const longest = all.filter((e) => e.use && e.ms).sort((a, b) => b.ms - a.ms).slice(0, 10).map((e) => ({ id: e.id, agent: e.agent, agentLabel: e.agentLabel, tool: e.tool, text: e.text, ms: e.ms, t: e.t, status: e.status, line: e.line }));

  // Rework: retries after failure, edit-and-test cycles per file, test reruns before a pass.
  const retries = [];
  const cycles = new Map();
  const reruns = [];
  for (const a of bundle.agents) {
    const bySig = new Map();
    let lastEdited = new Set();
    let failingStreak = 0;
    for (const e of a.events || []) {
      if (e.cmd || (e.use && e.kind !== 'say')) {
        const sig = e.cmd ? signature(e.cmd) : `${e.tool}:${e.text}`;
        const s = bySig.get(sig) || { sig, tool: e.tool, text: e.text, times: 0, failed: 0, first: e.t, last: e.t, ids: [] };
        s.times++;
        if (e.status === 'error' || e.outcome === 'failed') s.failed++;
        s.last = e.t || s.last;
        if (s.ids.length < 10) s.ids.push(e.id);
        bySig.set(sig, s);
      }
      if (e.kind === 'edit' && e.files) for (const f of e.files) lastEdited.add(f);
      if (e.kind === 'test' && e.status && e.status !== 'pending') {
        for (const f of lastEdited) {
          const c = cycles.get(f) || { path: f, cycles: 0, agents: new Set() };
          c.cycles++;
          c.agents.add(a.label);
          cycles.set(f, c);
        }
        lastEdited = new Set();
        if (e.outcome === 'failed') failingStreak++;
        else if (e.outcome === 'passed' && failingStreak) {
          reruns.push({ agent: a.id, agentLabel: a.label, failedRuns: failingStreak, passedAt: e.t, event: e.id });
          failingStreak = 0;
        }
      }
    }
    for (const s of bySig.values()) if (s.times >= 2 && s.failed >= 1) retries.push({ ...s, agent: a.id, agentLabel: a.label });
  }
  retries.sort((x, y) => y.times - x.times);
  const loops = [...cycles.values()].filter((c) => c.cycles >= 3).map((c) => ({ path: c.path, cycles: c.cycles, agents: [...c.agents] })).sort((x, y) => y.cycles - x.cycles);

  return {
    run: { id: run.id, title: run.title, status: run.status },
    wall,
    start: first,
    end: wallEnd,
    tool: toolTotal,
    unobserved: { total: unobserved.reduce((s, g) => s + g.ms, 0), stretches: unobserved.sort((a, b) => b.ms - a.ms).slice(0, 10) },
    concurrency: { peak, average: wall ? spanSum / wall : null },
    phases,
    agents: agents.sort((a, b) => (a.start || 0) - (b.start || 0)),
    longest,
    rework: { retries: retries.slice(0, 20), loops: loops.slice(0, 20), reruns },
    notes: [
      'Tool time counts calls whose call and result lines were both seen. Agents working at once can make it larger than the wall clock.',
      'The time between an agent\'s lines is the model working; it is not tool time, and it is not idle time either.',
      `An unobserved stretch is ${GAP_MS / 60000} minutes or more in which no agent wrote a line: waiting, a slow model call, or work the transcripts do not show. Its cause is not known.`,
      'Phases are ordered by when their first agent started; the workflow declares no other dependencies, so the chain of phases is the longest path that can be seen, not a proven critical path.',
    ],
  };
}
