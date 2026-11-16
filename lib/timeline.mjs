/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Timeline (dd1 Tools Edition - v1.0)
 *     - File Name: timeline.mjs
 *     - Relative Path: lib/timeline.mjs
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
 *       version, for the audit's timeline stage (R04): one run's events from
 *       every agent on one time axis, lane by lane, with the phases over
 *       them, a density overview, and the ties whose order cannot be known.
 *
 * ✒ Description:
 *     Merges the events of every agent of a run into one sequence by the
 *     time each transcript line was written, so the run can be read across
 *     agents and replayed step by step. Replay means stepping through what
 *     was recorded; nothing is run again, and an agent's reasoning between
 *     its lines is not in it.
 *
 * ✒ Key Features:
 *     - Lanes: one per agent, with its phase, first and last event and count
 *     - Phase bands from the agents of each phase
 *     - Events in order: by time, then agent, then the order read; two
 *       agents' events in the same millisecond are marked as a tie, their
 *       order unknown
 *     - A window (from, to) and a limit, so a long run is sent in parts;
 *       the answer says when it was cut short
 *     - Buckets: counts per lane across the run, events and errors, for an
 *       overview of where the run was busy
 *     - Events without a time are counted, not placed
 *
 * ✒ Usage Instructions:
 *     timeline(bundle, { limit: 1500 })
 *     timeline(bundle, { from: t0, to: t1, kinds: ['error', 'test'] })
 *
 * ✒ Examples:
 *     const t = timeline(b);
 *     t.lanes.map((l) => l.label); t.events[0]; t.truncated;
 *
 * ✒ Other Important Information:
 *     - Dependencies: none
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Limits: clocks are the machine's own; a line written late places
 *       its event late
 * ----------------------------------------------------------------------------
 */

const BUCKETS = 120;

/** One run's events from every agent, on one time axis. */
export function timeline(bundle, { from = null, to = null, limit = 1500, kinds = null, agents = null } = {}) {
  const lanes = [];
  const all = [];
  let untimed = 0;
  for (const a of bundle.agents) {
    if (agents && !agents.includes(a.id)) continue;
    const times = a.events.map((e) => e.t).filter(Boolean);
    lanes.push({ id: a.id, label: a.label, phase: a.phase, status: a.status, start: times.length ? Math.min(...times) : a.started || null, end: times.length ? Math.max(...times) : a.last || null, count: a.events.length, dropped: a.dropped || 0 });
    a.events.forEach((e, i) => {
      if (!e.t) {
        untimed++;
        return;
      }
      all.push({ id: e.id, agent: a.id, t: e.t, end: e.end || null, kind: e.kind, tool: e.tool || null, text: e.text, status: e.status || null, outcome: e.outcome || null, ms: e.ms ?? null, line: e.line, of: e.of || null, order: i });
    });
  }
  all.sort((x, y) => x.t - y.t || String(x.agent).localeCompare(String(y.agent)) || x.order - y.order);
  let ties = 0;
  for (let i = 1; i < all.length; i++) {
    if (all[i].t === all[i - 1].t && all[i].agent !== all[i - 1].agent) {
      all[i].tie = true;
      all[i - 1].tie = true;
      ties++;
    }
  }
  const start = all.length ? all[0].t : null;
  const end = all.length ? Math.max(...all.map((e) => e.end || e.t)) : null;
  const buckets = [];
  if (start !== null && end > start) {
    const width = (end - start) / BUCKETS;
    for (const l of lanes) buckets.push({ agent: l.id, events: new Array(BUCKETS).fill(0), errors: new Array(BUCKETS).fill(0) });
    const byAgent = new Map(buckets.map((b) => [b.agent, b]));
    for (const e of all) {
      const k = Math.min(BUCKETS - 1, Math.floor((e.t - start) / width));
      const b = byAgent.get(e.agent);
      b.events[k]++;
      if (e.kind === 'error' || e.outcome === 'failed') b.errors[k]++;
    }
  }
  let events = all;
  if (from !== null) events = events.filter((e) => e.t >= from);
  if (to !== null) events = events.filter((e) => e.t <= to);
  if (kinds) events = events.filter((e) => kinds.includes(e.kind));
  const total = events.length;
  const truncated = total > limit;
  if (truncated) events = events.slice(0, limit);
  const phases = (bundle.run.phases || []).map((p) => ({ title: p.title, state: p.state, start: p.start, end: p.end, agents: p.agents }));
  return { run: { id: bundle.run.id, title: bundle.run.title, status: bundle.run.status, started: bundle.run.started, ended: bundle.run.ended }, lanes, phases, events, total, truncated, untimed, ties, range: { start, end }, buckets, order: bundle.order || [] };
}
