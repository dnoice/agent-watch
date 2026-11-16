/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Tests and Comparison (dd1 Tools Edition - v1.0)
 *     - File Name: compare.mjs
 *     - Relative Path: lib/compare.mjs
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
 *       version, for the audit's outcome stage: a run's named test cases
 *       against the runs before it (R06), two runs side by side with what
 *       cannot be compared said so, and related runs with the reason each
 *       was suggested (R05).
 *
 * ✒ Description:
 *     Compares runs. A run's test cases are set against the same cases in
 *     earlier comparable runs, to say which failures are new, which
 *     recovered, which keep failing and which flip. Two runs are laid side
 *     by side figure by figure. Related runs are suggested with the
 *     evidence for each suggestion, which is an inference, never a claim.
 *
 * ✒ Key Features:
 *     - casesOf(): a run's named cases, from its test commands' output, its
 *       own scratch logs and the tests its workflow reported, each with
 *       where it was read; the last result of a case wins, and a case that
 *       failed then passed in the same run says so
 *     - regression(): each case classified against up to eight earlier
 *       runs, those of the same workflow when they have cases, with its
 *       history oldest to newest
 *     - compare(): status, timing, agents, phases, tool calls, tokens,
 *       outcomes, test cases, files and commits for two runs; a figure
 *       measured differently in each (output against total tokens) is
 *       marked as not comparable rather than subtracted
 *     - related(): runs sharing the workflow, the title, the branch, or
 *       many of the same files, each reason listed
 *
 * ✒ Usage Instructions:
 *     regression(bundleOrEntry, earlierEntries)
 *     compare(a, b)      // two archive entries, or entries built from bundles
 *     related(entry, allEntries)
 *
 * ✒ Examples:
 *     regression(b, archive.entries(slug)).counts   // { 'new-failure': 2, ... }
 *     compare(ea, eb).rows.find((r) => r.key === 'tokens').comparable
 *
 * ✒ Other Important Information:
 *     - Dependencies: tests.mjs (classify)
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Limits: cases are matched by name; a renamed case is a new one
 * ----------------------------------------------------------------------------
 */

import { classify } from './tests.mjs';

/** A run's named cases from a bundle: { name: { result, source, agent, t, flipped } }. */
export function casesOf(bundle) {
  const out = {};
  const seen = (name, result, source, agent = null, t = null) => {
    const prev = out[name];
    const flipped = prev && prev.result !== result && prev.source === 'tool-result' && source === 'tool-result';
    out[name] = { result, source, agent, t, flipped: !!(prev?.flipped || flipped), runs: (prev?.runs || 0) + 1 };
  };
  const events = [];
  for (const a of bundle.agents || []) for (const e of a.events || []) if (e.kind === 'test' && e.tests?.cases) events.push({ ...e, agent: a.id });
  events.sort((x, y) => (x.end || x.t || 0) - (y.end || y.t || 0));
  for (const e of events) for (const c of e.tests.cases) seen(c.name, c.result, 'tool-result', e.agent, e.end || e.t);
  if (!bundle.logsUnattributed) for (const l of bundle.logs || []) for (const c of l.outcome?.cases || []) if (!out[c.name]) seen(c.name, c.result, 'scratch-log', null, l.mtime);
  for (const c of bundle.reported || []) if (!out[c.name] && c.result !== 'other') seen(c.name, c.result, 'workflow-result');
  return out;
}

/** The fields compare() and related() read, from a bundle read just now (a run the archive has not read in full). */
export function entryFromBundle(bundle) {
  const r = bundle.run;
  const files = new Map();
  const commits = [];
  for (const a of bundle.agents) {
    for (const f of a.files || []) {
      const x = files.get(f.path) || { p: f.path, e: 0, r: 0, a: [] };
      x.e += f.edits;
      x.r += f.reads;
      if (!x.a.includes(a.id)) x.a.push(a.id);
      files.set(f.path, x);
    }
    for (const e of a.events || []) if (e.commit) commits.push({ hash: e.commit.hash, subject: e.commit.subject, agent: a.id, t: e.t });
  }
  return {
    id: r.id, title: r.title, name: r.name, status: r.status, started: r.started, ended: r.ended, last: r.last, branch: r.branch,
    agents: r.agents.length, phases: (r.phases || []).map((p) => ({ title: p.title, state: p.state })),
    tokens: r.totals?.tokens ?? null, tokensKind: r.totals?.tokensKind || null, toolCalls: r.totals?.toolCalls ?? null,
    outcomes: { ...(r.outcomes || {}), tools: r.totals?.toolCalls }, deep: true,
    tests: { cases: casesOf(bundle) }, files: [...files.values()], commits,
  };
}

/** An entry's cases as name -> result. */
const plain = (cases) => Object.fromEntries(Object.entries(cases || {}).map(([k, v]) => [k, typeof v === 'string' ? v : v.result]));

/**
 * The run's cases against earlier runs. current: { id, name, started, cases };
 * entries: archive entries of the project. Compares with up to eight earlier
 * runs that have cases, of the same workflow when there are any.
 */
export function regression(current, entries) {
  const earlier = entries.filter((e) => e.id !== current.id && (e.started || 0) < (current.started || Infinity) && Object.keys(e.tests?.cases || {}).length)
    .sort((a, b) => (b.started || 0) - (a.started || 0));
  const same = earlier.filter((e) => e.name && e.name === current.name);
  const pool = (same.length ? same : earlier).slice(0, 8);
  const basis = same.length ? 'same workflow' : earlier.length ? 'any earlier run' : 'none';
  const now = plain(current.cases);
  const cls = classify(now, pool.map((e) => e.tests.cases));
  const cases = Object.entries(cls).map(([name, c]) => ({
    name,
    ...c,
    source: typeof current.cases[name] === 'object' ? current.cases[name].source : null,
    flippedInRun: typeof current.cases[name] === 'object' ? !!current.cases[name].flipped : false,
    history: [...pool].reverse().map((e) => ({ run: e.id, result: e.tests.cases[name] || null })),
  }));
  const order = { 'new-failure': 0, 'flaky-candidate': 1, 'still-failing': 2, recovered: 3, new: 4, skipped: 5, stable: 6 };
  cases.sort((a, b) => (order[a.class] ?? 9) - (order[b.class] ?? 9) || a.name.localeCompare(b.name));
  const counts = {};
  for (const c of cases) counts[c.class] = (counts[c.class] || 0) + 1;
  return {
    cases,
    counts,
    compared: pool.map((e) => ({ id: e.id, title: e.title, started: e.started, status: e.status })),
    basis,
    note: basis === 'none'
      ? 'No earlier run of this project has named test cases yet, so every case is new.'
      : `Compared with the ${pool.length} newest earlier ${pool.length === 1 ? 'run' : 'runs'} ${basis === 'same workflow' ? 'of the same workflow' : 'of the project'} that had named cases. A case that changed result at least twice is a flaky candidate, worth a look, not a diagnosis.`,
  };
}

const dur = (e) => (e.ended && e.started ? e.ended - e.started : e.last && e.started ? e.last - e.started : null);

/** Two runs side by side. Each row: { key, label, a, b, comparable, note }. */
export function compare(a, b) {
  const rows = [];
  const row = (key, label, va, vb, comparable = true, note = '') => rows.push({ key, label, a: va ?? null, b: vb ?? null, comparable, note, changed: comparable && JSON.stringify(va) !== JSON.stringify(vb) });
  row('status', 'Status', a.status, b.status);
  row('workflow', 'Workflow', a.name, b.name);
  row('branch', 'Branch', a.branch, b.branch);
  row('started', 'Started', a.started, b.started);
  row('took', 'Took', dur(a), dur(b), true, a.status === 'running' || b.status === 'running' ? 'A run still going has taken this long so far.' : '');
  row('agents', 'Agents', a.agents, b.agents);
  row('phases', 'Phases', (a.phases || []).map((p) => `${p.title}:${p.state}`), (b.phases || []).map((p) => `${p.title}:${p.state}`));
  const sameTokens = a.tokensKind && a.tokensKind === b.tokensKind;
  row('tokens', `Tokens${sameTokens ? `, ${a.tokensKind}` : ''}`, a.tokens, b.tokens, sameTokens, sameTokens ? '' : `Not comparable: ${a.tokensKind || 'unknown'} tokens against ${b.tokensKind || 'unknown'} tokens.`);
  row('toolCalls', 'Tool calls', a.toolCalls, b.toolCalls, a.toolCalls !== null && b.toolCalls !== null, a.toolCalls === null || b.toolCalls === null ? 'Not read for one of the runs.' : '');
  const oa = a.outcomes || {};
  const ob = b.outcomes || {};
  const read = a.deep && b.deep;
  for (const [k, label] of [['toolsFailed', 'Calls failed'], ['errors', 'Errors'], ['commitsConfirmed', 'Commits confirmed'], ['testsPassed', 'Test runs passed'], ['testsFailed', 'Test runs failed']]) {
    row(k, label, oa[k], ob[k], read && oa[k] !== undefined && ob[k] !== undefined, read ? '' : 'Only counted once a run has been read in full.');
  }
  const ca = plain(a.tests?.cases);
  const cb = plain(b.tests?.cases);
  const names = [...new Set([...Object.keys(ca), ...Object.keys(cb)])].sort();
  const tests = names.map((n) => ({ name: n, a: ca[n] || null, b: cb[n] || null, changed: (ca[n] || null) !== (cb[n] || null) }));
  const fa = new Set((a.files || []).map((f) => (typeof f === 'string' ? f : f.p)));
  const fb = new Set((b.files || []).map((f) => (typeof f === 'string' ? f : f.p)));
  const files = { both: [...fa].filter((f) => fb.has(f)), onlyA: [...fa].filter((f) => !fb.has(f)), onlyB: [...fb].filter((f) => !fa.has(f)) };
  const commits = { a: (a.commits || []).map((c) => `${c.hash} ${c.subject}`), b: (b.commits || []).map((c) => `${c.hash} ${c.subject}`) };
  return { a: { id: a.id, title: a.title }, b: { id: b.id, title: b.title }, rows, tests, testsChanged: tests.filter((t) => t.changed).length, files, commits };
}

/** Runs related to one, with the reasons for each; every reason is an inference. */
export function related(e, entries, { limit = 8 } = {}) {
  const fe = new Set((e.files || []).map((f) => f.p));
  const out = [];
  for (const x of entries) {
    if (x.id === e.id) continue;
    const reasons = [];
    let score = 0;
    if (e.name && x.name === e.name) {
      reasons.push(`the same workflow, ${e.name}`);
      score += 3;
    }
    if (e.title && x.title === e.title && e.title !== e.id) {
      reasons.push('the same title');
      score += 3;
    }
    if (e.branch && x.branch === e.branch) {
      reasons.push(`the same branch, ${e.branch}`);
      score += 2;
    }
    if (fe.size) {
      const fx = new Set((x.files || []).map((f) => f.p));
      const both = [...fe].filter((f) => fx.has(f)).length;
      const jac = both / (fe.size + fx.size - both || 1);
      if (both >= 2 && jac >= 0.3) {
        reasons.push(`${both} files in common (${Math.round(jac * 100)}% of the two runs' files)`);
        score += 2;
      }
    }
    if (reasons.length) out.push({ id: x.id, title: x.title, name: x.name, status: x.status, started: x.started, reasons, score, earlier: (x.started || 0) < (e.started || 0) });
  }
  return out.sort((p, q) => q.score - p.score || (q.started || 0) - (p.started || 0)).slice(0, limit);
}
