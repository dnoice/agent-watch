/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Completion and Handoff (dd1 Tools Edition - v1.1)
 *     - File Name: handoff.mjs
 *     - Relative Path: lib/handoff.mjs
 *     - Artifact Type: library
 *     - Version: 1.1.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A listed
 *       evidence item travels as { text, items }, so a name holding a
 *       separator is never split; evidenceText() writes it as one line for
 *       the Markdown report.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's completion stage (R10): a run held against
 *       criteria written down for its workflow, each satisfied, unsatisfied
 *       or not observed with its evidence, and a handoff report made only
 *       when asked for.
 *
 * ✒ Description:
 *     Says how far a run's evidence goes towards the expectations set for
 *     its workflow. Criteria are explicit: a file per workflow in the state
 *     folder. Until one is written, a starter set is shown and labelled as
 *     not adopted. The handoff report gathers the run, the criteria, the
 *     unresolved failures, the tests, the files and the commits into
 *     Markdown or JSON, redacted, for the next session.
 *
 * ✒ Key Features:
 *     - Criteria types: phases done, tests pass, no unresolved failures,
 *       confirmed commits, a result field within a limit, a file edited, an
 *       agent done
 *     - Three states only: satisfied, unsatisfied, not observed; never
 *       satisfied for want of evidence
 *     - The starter set, written to the state folder by the criteria
 *       command for editing, and read back from there
 *     - report(): Markdown (dates month/day/year) or JSON, paths with the
 *       home folder written as ~, excerpts redacted
 *
 * ✒ Usage Instructions:
 *     const c = loadCriteria(dir, run.name)       // { source, path, criteria }
 *     const ev = evaluate(bundle, c.criteria, extras)
 *     report(bundle, c, ev, extras, 'md')
 *
 * ✒ Examples:
 *     { "type": "result-field", "field": "findings", "severity": "high", "max": 0 }
 *     { "type": "file-edited", "match": "README.md" }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+ (node:fs, node:path); evidence.mjs
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - It approves nothing and sends nothing: a report is a file the
 *       person asked for
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { redact, excerpt } from './evidence.mjs';

/** An evidence item as one line: a string as it is, a listed item as its text and its items. */
export const evidenceText = (e) => (typeof e === 'string' ? e : `${e.text}: ${e.items.join('; ')}`);

export const TYPES = ['phases-done', 'tests-pass', 'no-unresolved-failures', 'commits', 'result-field', 'file-edited', 'agent-done'];

export const STARTER = [
  { id: 'phases', type: 'phases-done', label: 'Every declared phase finished' },
  { id: 'tests', type: 'tests-pass', label: 'Tests ran, and no case is failing at the end' },
  { id: 'failures', type: 'no-unresolved-failures', label: 'Every failure was followed by a recovery' },
  { id: 'commit', type: 'commits', min: 1, label: 'At least one confirmed commit' },
  { id: 'review', type: 'result-field', field: 'findings', severity: 'high', max: 0, label: 'No high-severity findings left' },
];

const fileName = (name) => `${String(name || 'unnamed').replace(/[^\w.-]/g, '_').slice(0, 100)}.json`;

/** The criteria for a workflow: its file in dir, else the starter set, said not to be adopted. */
export function loadCriteria(dir, workflow) {
  const file = dir ? path.join(dir, fileName(workflow)) : null;
  if (file) {
    try {
      const v = JSON.parse(fs.readFileSync(file, 'utf8'));
      const list = (Array.isArray(v.criteria) ? v.criteria : []).filter((c) => c && TYPES.includes(c.type)).slice(0, 50);
      return { source: 'file', path: file, workflow, criteria: list.map((c, i) => ({ id: String(c.id || `c${i + 1}`).slice(0, 40), ...c, label: String(c.label || c.type).slice(0, 200) })) };
    } catch (err) {
      if (err.code !== 'ENOENT') return { source: 'invalid', path: file, workflow, error: String(err.message).slice(0, 200), criteria: STARTER };
    }
  }
  return { source: 'starter', path: file, workflow, criteria: STARTER };
}

/** Writes the starter set for a workflow, if it has no file yet. Returns the path. */
export function writeStarter(dir, workflow) {
  const file = path.join(dir, fileName(workflow));
  if (fs.existsSync(file)) return { path: file, written: false };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ version: 1, workflow, about: `Completion criteria for the ${workflow} workflow, read by agent-watch's Handoff view and handoff command. Types: ${TYPES.join(', ')}.`, criteria: STARTER }, null, 2)}\n`);
  return { path: file, written: true };
}

const glob = (pattern, p) => {
  const s = String(p).replace(/\\/g, '/').toLowerCase();
  const m = String(pattern).replace(/\\/g, '/').toLowerCase();
  if (!m.includes('*')) return s.endsWith(m) || s.includes(`/${m}`);
  const re = new RegExp(`(^|/)${m.split('**/').map((x) => x.split('*').map((y) => y.replace(/[.+?^${}()|[\]]/g, '\\$&')).join('[^/]*')).join('(?:.*/)?')}$`);
  return re.test(s);
};

/**
 * Each criterion's state and evidence. extras: { incidents, cases, files } as
 * investigate, compare and files give them.
 */
export function evaluate(bundle, criteria, extras = {}) {
  const run = bundle.run;
  const out = [];
  const results = run.agents.map((a) => ({ label: a.label, result: a.result })).filter((x) => x.result);
  for (const c of criteria) {
    let state = 'not-observed';
    const evidence = [];
    if (c.type === 'phases-done') {
      const want = Array.isArray(c.phases) && c.phases.length ? run.phases.filter((p) => c.phases.includes(p.title)) : run.phases.filter((p) => p.declared !== false);
      if (want.length) {
        const open = want.filter((p) => p.state !== 'done');
        state = open.length ? 'unsatisfied' : 'satisfied';
        evidence.push(open.length ? `Not finished: ${open.map((p) => `${p.title} (${p.state})`).join(', ')}` : `All ${want.length} phases done: ${want.map((p) => p.title).join(', ')}`);
      } else evidence.push('The run declares no phases.');
    } else if (c.type === 'tests-pass') {
      const cases = Object.entries(extras.cases || {});
      const runs = run.outcomes?.tests || 0;
      if (cases.length) {
        const failing = cases.filter(([, v]) => (v.result || v) === 'failed');
        state = failing.length ? 'unsatisfied' : 'satisfied';
        // A list stays a list: a case name can hold any separator, so it is never joined into the text.
        evidence.push(failing.length ? { text: `${failing.length} of ${cases.length} cases failing at the end`, items: failing.slice(0, 8).map(([n]) => n) } : `${cases.length} named cases, none failing at the end`);
      } else if (runs) {
        const failed = run.outcomes.testsFailed || 0;
        state = failed && !(run.outcomes.testsPassed > 0) ? 'unsatisfied' : run.outcomes.testsPassed ? 'satisfied' : 'not-observed';
        evidence.push(`${runs} test runs: ${run.outcomes.testsPassed || 0} passed, ${failed} failed, ${run.outcomes.testsUnknown || 0} unread; no named cases to check one by one`);
      } else evidence.push('No test run was seen in the transcripts.');
    } else if (c.type === 'no-unresolved-failures') {
      const inc = extras.incidents || [];
      const open = inc.filter((i) => !i.recovered);
      state = open.length ? 'unsatisfied' : 'satisfied';
      evidence.push(inc.length ? (open.length ? { text: `${inc.length} incidents, ${open.length} unresolved`, items: open.slice(0, 5).map((i) => excerpt(i.text || i.cmd, 80)) } : `${inc.length} incidents, none unresolved`) : 'No failure in the run.');
    } else if (c.type === 'commits') {
      const o = run.outcomes;
      const min = Number(c.min) || 1;
      if (!o) evidence.push('The run\'s transcripts have not been read.');
      else {
        state = (o.commitsConfirmed || 0) >= min ? 'satisfied' : 'unsatisfied';
        evidence.push(`${o.commitsConfirmed || 0} confirmed of ${o.commits || 0} tried; at least ${min} expected`);
      }
    } else if (c.type === 'result-field') {
      const field = String(c.field || '');
      const max = c.max ?? 0;
      const seen = results.filter((x) => x.result[field] !== undefined);
      if (seen.length) {
        const n = seen.reduce((s, x) => s + (c.severity ? (x.result.severity?.[c.severity] || 0) : Number(x.result[field]) || 0), 0);
        state = n <= max ? 'satisfied' : 'unsatisfied';
        evidence.push(`${n} ${c.severity ? `${c.severity}-severity ` : ''}${field} across ${seen.map((x) => x.label).join(', ')}; at most ${max} allowed`);
      } else evidence.push(`No agent's result reported ${field}.`);
    } else if (c.type === 'file-edited') {
      const files = (extras.files || []).filter((f) => f.edits > 0);
      if (!files.length && !(extras.files || []).length) evidence.push('No file was read or edited through the edit tools.');
      const hit = files.filter((f) => glob(c.match || '', f.path));
      state = hit.length ? 'satisfied' : files.length || (extras.files || []).length ? 'unsatisfied' : 'not-observed';
      evidence.push(hit.length ? `Edited: ${hit.slice(0, 5).map((f) => redact(f.path)).join(', ')}` : `No edited file matches ${c.match}`);
    } else if (c.type === 'agent-done') {
      const want = String(c.label || c.agent || '').toLowerCase();
      const a = run.agents.filter((x) => x.label.toLowerCase().includes(want));
      if (a.length) {
        state = a.every((x) => x.status === 'done') ? 'satisfied' : 'unsatisfied';
        evidence.push(a.map((x) => `${x.label}: ${x.status}`).join(', '));
      } else evidence.push(`No agent's label includes "${c.label || c.agent}".`);
    }
    out.push({ id: c.id, label: c.label, type: c.type, state, evidence });
  }
  return out;
}

const pad = (n) => String(n).padStart(2, '0');
const date = (ms) => {
  if (!ms) return '-';
  const d = new Date(ms);
  const h = d.getHours() % 12 || 12;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${h}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
};
const STATE = { satisfied: 'satisfied', unsatisfied: 'UNSATISFIED', 'not-observed': 'not observed' };
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** The handoff report, as Markdown or as an object for JSON. */
export function report(bundle, crit, ev, extras = {}, format = 'md') {
  const run = bundle.run;
  const inc = (extras.incidents || []).filter((i) => !i.recovered);
  const cases = Object.entries(extras.cases || {});
  const edited = (extras.files || []).filter((f) => f.edits > 0).map((f) => redact(f.path));
  const commits = [];
  for (const a of bundle.agents) for (const e of a.events || []) if (e.commit) commits.push(`${e.commit.hash} ${e.commit.subject}`);
  const facts = run.agents.filter((a) => a.result).map((a) => ({ agent: a.label, ...a.result }));
  const obj = {
    run: { id: run.id, title: run.title, workflow: run.name, status: run.status, statusFrom: run.why?.label, started: run.started, ended: run.ended, branch: run.branch },
    criteria: { source: crit.source, path: crit.path ? redact(crit.path) : null, results: ev },
    phases: run.phases.map((p) => ({ title: p.title, state: p.state })),
    agents: run.agents.map((a) => ({ label: a.label, phase: a.phase, status: a.status })),
    outcomes: run.outcomes,
    unresolved: inc.map((i) => ({ type: i.type, agent: i.agentLabel, text: excerpt(i.cmd || i.text, 200), t: i.t })),
    tests: { cases: cases.length, failing: cases.filter(([, v]) => (v.result || v) === 'failed').map(([n]) => n).slice(0, 50) },
    edited: edited.slice(0, 100),
    commits: commits.slice(0, 50),
    results: facts,
    made: Date.now(),
    note: 'Made by agent-watch from the run\'s own files. A criterion not observed is not met; nothing here approves the work.',
  };
  if (format === 'json') return obj;
  const sat = ev.filter((x) => x.state === 'satisfied').length;
  const L = [];
  L.push(`# Handoff: ${run.title}`, '');
  L.push(`- **Run:** ${run.id}${run.name ? ` (${run.name})` : ''}`);
  L.push(`- **Status:** ${run.status}, from the ${run.why?.label || 'run'}${run.why?.basis === 'inferred' ? ' (inferred)' : ''}`);
  L.push(`- **Started:** ${date(run.started)}${run.ended ? `; ended ${date(run.ended)}` : ''}`);
  if (run.branch) L.push(`- **Branch:** ${run.branch}`);
  L.push(`- **Report made:** ${date(obj.made)}`, '');
  L.push('## Criteria', '');
  L.push(crit.source === 'file' ? `From \`${redact(crit.path)}\`: ${sat} of ${ev.length} satisfied.` : `No criteria are written for this workflow yet, so the starter set is shown, not adopted: ${sat} of ${ev.length} would be satisfied.`, '');
  L.push('| Criterion | State | Evidence |', '| --- | --- | --- |');
  for (const x of ev) L.push(`| ${cell(x.label)} | ${STATE[x.state]} | ${cell(x.evidence.map(evidenceText).join('; '))} |`);
  L.push('', '## Phases', '');
  for (const p of run.phases) L.push(`- ${p.title}: ${p.state}`);
  L.push('', '## Unresolved failures', '');
  if (inc.length) for (const i of inc.slice(0, 20)) L.push(`- ${i.agentLabel ? `${i.agentLabel}: ` : ''}${cell(excerpt(i.cmd || i.text, 160))} (${i.label.toLowerCase()})`);
  else L.push('None.');
  L.push('', '## Tests', '');
  L.push(cases.length ? `${cases.length} named cases; ${obj.tests.failing.length} failing at the end${obj.tests.failing.length ? `: ${obj.tests.failing.slice(0, 15).join('; ')}` : '.'}` : 'No named test cases were seen.');
  L.push('', '## Files edited', '');
  if (edited.length) for (const f of edited.slice(0, 40)) L.push(`- \`${f}\``);
  else L.push('None through the edit tools.');
  L.push('', '## Confirmed commits', '');
  if (commits.length) for (const c of commits.slice(0, 30)) L.push(`- ${cell(c)}`);
  else L.push('None.');
  const open = facts.filter((f) => f.deferred || f.risks || f.unverified || f.problems);
  if (open.length) {
    L.push('', '## Left open by the agents', '');
    for (const f of open) L.push(`- ${f.agent}: ${[f.deferred && `${f.deferred} deferred`, f.risks && `${f.risks} risks`, f.unverified && `${f.unverified} unverified`, f.problems && `${f.problems} problems`].filter(Boolean).join(', ')}`);
  }
  L.push('', `_${obj.note}_`, '');
  return L.join('\n');
}
