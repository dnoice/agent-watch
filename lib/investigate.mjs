/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Failure Investigation (dd1 Tools Edition - v1.0)
 *     - File Name: investigate.mjs
 *     - Relative Path: lib/investigate.mjs
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
 *       version, for the audit's investigation stage (R01): a run's failures
 *       gathered into incidents, each with the call that failed, what came
 *       back, what led up to it and followed it, what the other agents were
 *       doing, the files in play, and whether anything later came back ok.
 *
 * ✒ Description:
 *     Turns one run's events into incidents a person can investigate: a
 *     failed tool call, a test run whose output reports failures, a commit
 *     that did not happen, a failing scratch log. Retries of the same command
 *     by the same agent are one incident. It connects evidence; it does not
 *     name a cause, and a recovery is a correlation in time.
 *
 * ✒ Key Features:
 *     - incidents(): every failure in the run, retries folded together, the
 *       unresolved first, each with how many times it happened
 *     - Recovery evidence, strongest first: the same command later came back
 *       ok; a later test run passed in the same agent; a later test run
 *       passed in another agent. Each says which it is
 *     - investigate(): one incident in full: the failing call and its result,
 *       the agent's ten steps before and after, every agent's events within
 *       two minutes, the files the agent edited before it failed, the test
 *       runs after it, and the transcript lines each came from
 *     - Pure functions over a run bundle: no reading, easily tested
 *
 * ✒ Usage Instructions:
 *     const b = await collector.runBundle(slug, runId);
 *     incidents(b)                 // [{ id, type, agent, text, recovered, ... }]
 *     investigate(b, incidentId)   // the full picture of one
 *
 * ✒ Examples:
 *     incidents(b).filter((i) => !i.recovered)
 *     investigate(b, 'a1b2#14').around   // every agent, two minutes either side
 *
 * ✒ Other Important Information:
 *     - Dependencies: claude.mjs (signature)
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Limits: a failure the transcript does not mark (a command that
 *       printed an error but exited 0) is not an incident unless it ran tests
 * ----------------------------------------------------------------------------
 */

import { signature } from './claude.mjs';

const WINDOW_MS = 2 * 60 * 1000;
const TYPES = {
  'tool-error': 'A tool call came back as an error',
  'test-failure': 'A test run reported failures',
  'commit-failed': 'A commit did not happen',
  'log-failure': 'A test log in the run\'s scratch folder reports failures',
  'reported-failure': 'The workflow\'s result reports a failing test',
};

/** What identifies a call across retries: its command, else its tool and target. */
export function sigOf(ev) {
  return ev.cmd ? signature(ev.cmd) : `${ev.tool || ev.kind}:${ev.text || ''}`;
}

function typeOf(ev) {
  if (ev.kind === 'test' && ev.outcome === 'failed') return 'test-failure';
  if (ev.kind === 'commit' && ev.outcome === 'failed') return 'commit-failed';
  if (ev.status === 'error') return 'tool-error';
  return null;
}

/** All events of a bundle, each with its agent, in time order (ties by agent, then order read). */
export function allEvents(bundle) {
  const out = [];
  for (const a of bundle.agents) for (const [i, e] of a.events.entries()) out.push({ ...e, agentLabel: a.label, phase: a.phase, order: i });
  return out.sort((x, y) => (x.t ?? 0) - (y.t ?? 0) || String(x.agent).localeCompare(String(y.agent)) || x.order - y.order);
}

/** How a failure was later answered, strongest evidence first, or null. */
function recovery(bundle, agent, ev, sig) {
  const later = (e) => (e.t ?? 0) > (ev.end ?? ev.t ?? 0) || (e.agent === ev.agent && e.order > ev.order);
  const same = agent.events.map((e, i) => ({ ...e, order: i })).filter((e) => e.order > ev.order);
  const again = same.find((e) => e.use && sigOf(e) === sig && e.status === 'ok' && (e.kind !== 'test' || e.outcome === 'passed'));
  if (again) return { how: 'same-ok', text: 'The same command came back ok later', event: again.id, agent: again.agent, t: again.t, strength: 'direct' };
  if (ev.kind === 'test' || ev.kind === 'tool' || ev.kind === 'edit') {
    const test = same.find((e) => e.kind === 'test' && e.outcome === 'passed');
    if (test) return { how: 'test-passed', text: 'A later test run in the same agent passed', event: test.id, agent: test.agent, t: test.t, strength: 'correlation' };
  }
  for (const a of bundle.agents) {
    if (a.id === agent.id) continue;
    const t = a.events.find((e) => e.kind === 'test' && e.outcome === 'passed' && later(e));
    if (t && ev.kind === 'test') return { how: 'other-test-passed', text: `A later test run by ${a.label} passed`, event: t.id, agent: a.id, t: t.t, strength: 'correlation' };
  }
  return null;
}

/** Every failure in the run, retries of the same command by the same agent folded together. */
export function incidents(bundle) {
  const groups = new Map();
  for (const a of bundle.agents) {
    a.events.forEach((e, i) => {
      const type = typeOf(e);
      if (!type) return;
      const ev = { ...e, order: i };
      const sig = sigOf(ev);
      const key = `${a.id}|${type}|${sig}`;
      let g = groups.get(key);
      if (!g) {
        g = { id: ev.id, type, label: TYPES[type], agent: a.id, agentLabel: a.label, phase: a.phase, tool: ev.tool, kind: ev.kind, text: ev.text, cmd: ev.cmd || null, sig, t: ev.t, last: ev.t, occurrences: 0, events: [], line: ev.line, file: a.file, excerpt: firstLines(ev.out), tests: ev.tests || null };
        groups.set(key, g);
      }
      g.occurrences++;
      g.last = ev.t ?? g.last;
      if (g.events.length < 20) g.events.push(ev.id);
      g.lastEvent = ev;
    });
  }
  const out = [];
  for (const g of groups.values()) {
    const agent = bundle.agents.find((x) => x.id === g.agent);
    g.recovered = recovery(bundle, agent, g.lastEvent, g.sig);
    delete g.lastEvent;
    out.push(g);
  }
  for (const l of bundle.logsUnattributed ? [] : bundle.logs || []) {
    if (l.verdict !== 'failed') continue;
    out.push({ id: `log:${l.name}`, type: 'log-failure', label: TYPES['log-failure'], agent: null, agentLabel: null, text: l.name, t: l.mtime, last: l.mtime, occurrences: 1, excerpt: [l.tally, ...l.fails].filter(Boolean).join('\n'), file: l.path, tests: l.outcome ? { format: l.outcome.format, passed: l.outcome.passed, failed: l.outcome.failed, cases: l.outcome.cases.filter((c) => c.result === 'failed').slice(0, 20) } : null, recovered: null });
  }
  for (const c of bundle.reported || []) {
    if (c.result !== 'failed') continue;
    out.push({ id: `reported:${c.name}`, type: 'reported-failure', label: TYPES['reported-failure'], agent: null, agentLabel: null, text: c.name, t: bundle.run.ended || bundle.run.last, last: null, occurrences: 1, excerpt: c.said, recovered: null });
  }
  return out.sort((x, y) => (!!x.recovered - !!y.recovered) || (x.t ?? 0) - (y.t ?? 0));
}

function firstLines(s, n = 12) {
  return s ? String(s).split('\n').slice(0, n).join('\n') : '';
}

const brief = (e) => ({ id: e.id, agent: e.agent, agentLabel: e.agentLabel, t: e.t, kind: e.kind, tool: e.tool, text: e.text, status: e.status, outcome: e.outcome, ms: e.ms, line: e.line, files: e.files });

/** One incident in full, by its id (the first failing event's id), or null. */
export function investigate(bundle, id) {
  const list = incidents(bundle);
  const inc = list.find((i) => i.id === id || i.events?.includes(id));
  if (!inc) return null;
  if (!inc.agent) return { incident: inc, failing: null, before: [], after: [], around: [], files: [], testsAfter: [], note: 'This failure comes from a log or the workflow\'s own result, not from a tool call, so there is no transcript step to look around.' };
  const agent = bundle.agents.find((a) => a.id === inc.agent);
  const idx = agent.events.findIndex((e) => e.id === inc.id);
  const failing = agent.events[idx];
  const mine = agent.events.map((e) => ({ ...e, agentLabel: agent.label }));
  const before = mine.slice(Math.max(0, idx - 10), idx).map(brief);
  const after = mine.slice(idx + 1, idx + 11).map(brief);
  const t0 = failing.t;
  const around = t0 ? allEvents(bundle).filter((e) => e.agent !== agent.id && e.t && Math.abs(e.t - t0) <= WINDOW_MS).slice(0, 40).map(brief) : [];
  const files = [];
  for (const e of mine.slice(Math.max(0, idx - 15), idx + 1)) {
    if (e.kind === 'edit' && e.files) for (const f of e.files) if (!files.some((x) => x.path === f)) files.push({ path: f, event: e.id, t: e.t, status: e.status });
  }
  const testsAfter = allEvents(bundle).filter((e) => e.kind === 'test' && e.status !== 'pending' && (e.t ?? 0) > (t0 ?? 0)).slice(0, 12).map((e) => ({ ...brief(e), tests: e.tests ? { passed: e.tests.passed, failed: e.tests.failed, format: e.tests.format } : null }));
  return {
    incident: inc,
    failing: { ...brief(failing), agentLabel: agent.label, out: failing.out || '', tests: failing.tests || null, rline: failing.rline, end: failing.end, file: agent.file, cmd: failing.cmd || null },
    before,
    after,
    around,
    files,
    testsAfter,
    note: 'Events are placed by the time their transcript line was written. Recovery evidence is a correlation in time, not a proven cause.',
  };
}
