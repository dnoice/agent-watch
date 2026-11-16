/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Run Archive (dd1 Tools Edition - v1.1)
 *     - File Name: archive.mjs
 *     - Relative Path: lib/archive.mjs
 *     - Artifact Type: library
 *     - Version: 1.1.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Index
 *       version 2: entries rebuilt once to carry numbered agents and a
 *       resumed run's true start; a resumed run read in full is totalled from
 *       its agents' sums.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's archive stage (R03): every run a project
 *       holds, indexed once into a compact entry kept in agent-watch's own
 *       state folder, paged and searched without reading a transcript
 *       again.
 *
 * ✒ Description:
 *     A file-backed index of every workflow run of a project, so runs older
 *     than the twelve the live page lists can be found, searched and opened.
 *     Each finished run is read once, in small steps with pauses, into an
 *     entry of its facts and the words worth searching; the transcripts are
 *     read again only when a run changes.
 *
 * ✒ Key Features:
 *     - One JSON file per project under <state>/archive, written whole and
 *       swapped in, versioned so a new index format rebuilds itself
 *     - Each entry: title, workflow, status, times, totals, outcomes, branch,
 *       agents, phases, confirmed commits, files touched, commands, errors,
 *       and test cases with their last result and where it was read
 *     - A running run gets a light entry, refreshed while it runs; it is
 *       read in full once it has finished
 *     - A run whose files are gone keeps its entry, marked unavailable:
 *       agent-watch cannot bring back what Claude Code deleted
 *     - search(): words that must all match, or field:value for status,
 *       workflow, branch, agent, file, test, cmd, commit and error, with the
 *       line that matched
 *     - Excerpts are redacted before they are stored
 *
 * ✒ Usage Instructions:
 *     const a = createArchive({ dir, collector, health });
 *     await a.refresh(slug);              // index what is new or changed
 *     a.list(slug, { offset: 0, limit: 25 });
 *     a.search(slug, 'test:terrain status:killed');
 *
 * ✒ Examples:
 *     a.search(slug, 'ui-check')          // runs whose commands ran ui-check
 *     a.search(slug, 'file:shader.js')    // runs that read or edited it
 *     a.status(slug)                      // { indexed, total, building }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+; collect.mjs's collector, claude.mjs,
 *       read.mjs, tests.mjs, evidence.mjs
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Cost: the first build of a project reads every transcript once, at
 *       most about 250 MB a second with the default pause; nothing is read
 *       during a live poll
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { readNewAsync } from './read.mjs';
import { freshAgent, ingestAgentLine, agentStats } from './claude.mjs';
import { testLogs } from './tests.mjs';
import { excerpt } from './evidence.mjs';

export const INDEX_VERSION = 2;
const MAX = { files: 400, commands: 300, errors: 60, commits: 60, cases: 400, testRuns: 120, terms: 60000 };
const FIELDS = ['status', 'workflow', 'branch', 'agent', 'file', 'test', 'cmd', 'commit', 'error'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lc = (s) => String(s ?? '').toLowerCase();

/** The words a query asks for: { terms: [...], fields: { file: [...], ... } }. */
export function parseQuery(q) {
  const out = { terms: [], fields: {} };
  const re = /(\w+):("([^"]*)"|\S+)|"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(String(q || '')))) {
    if (m[1] && FIELDS.includes(m[1].toLowerCase())) (out.fields[m[1].toLowerCase()] ||= []).push(lc(m[3] ?? m[2]));
    else {
      const w = lc(m[4] ?? m[5] ?? m[0]);
      if (w) out.terms.push(w);
    }
  }
  return out;
}

/** An entry built from a described run and, when it was read in full, its agents' states. */
export function entryOf(run, states = [], extra = {}) {
  const files = new Map();
  const commands = new Set();
  const errors = [];
  const commits = [];
  const cases = {};
  const testRuns = [];
  const sources = { 'tool-result': 0, 'scratch-log': 0, 'workflow-result': 0 };
  for (const { id, st } of states) {
    for (const f of st.files.values()) {
      const e = files.get(f.path) || { p: f.path, e: 0, r: 0, a: [] };
      e.e += f.edits;
      e.r += f.reads;
      if (!e.a.includes(id)) e.a.push(id);
      files.set(f.path, e);
    }
    for (const ev of st.events) {
      if (ev.cmd && commands.size < MAX.commands) commands.add(ev.cmd);
      if (ev.kind === 'error' && errors.length < MAX.errors) errors.push({ agent: id, t: ev.t, text: excerpt(ev.text, 200) });
      if (ev.commit && commits.length < MAX.commits) commits.push({ hash: ev.commit.hash, subject: ev.commit.subject, agent: id, t: ev.t });
      if (ev.kind === 'test' && ev.status && ev.status !== 'pending') {
        if (testRuns.length < MAX.testRuns) testRuns.push({ agent: id, t: ev.t, cmd: ev.cmd || ev.text, outcome: ev.outcome, passed: ev.tests?.passed ?? null, failed: ev.tests?.failed ?? null, format: ev.tests?.format || null });
        for (const c of ev.tests?.cases || []) {
          if (Object.keys(cases).length < MAX.cases || c.name in cases) {
            cases[c.name] = c.result;
            sources['tool-result']++;
          }
        }
      }
    }
  }
  for (const l of extra.logs || []) {
    for (const c of l.outcome?.cases || []) {
      if (!(c.name in cases) && Object.keys(cases).length < MAX.cases) {
        cases[c.name] = c.result;
        sources['scratch-log']++;
      }
    }
  }
  for (const c of run.reported || []) {
    if (!(c.name in cases) && Object.keys(cases).length < MAX.cases && c.result !== 'other') {
      cases[c.name] = c.result;
      sources['workflow-result']++;
    }
  }
  const fileList = [...files.values()].sort((a, b) => b.e - a.e || b.r - a.r).slice(0, MAX.files);
  const sums = states.length ? states.map((s) => agentStats(s.st)) : null;
  // A resumed run's record totals cover the resumed part only; read in full, its agents' sums
  // cover the whole run, as the live view counts it.
  const whole = run.resumed && sums;
  const entry = {
    v: INDEX_VERSION,
    id: run.id,
    session: run.session,
    title: run.title,
    name: run.name,
    description: run.description,
    status: run.status,
    record: run.record,
    started: run.started,
    ended: run.ended,
    last: run.last,
    agents: run.agents.length,
    labels: run.agents.map((a) => a.label),
    models: [...new Set(run.agents.map((a) => a.model).filter(Boolean))],
    phases: run.phases.map((p) => ({ title: p.title, state: p.state })),
    resumed: run.resumed || null,
    tokens: whole ? sums.reduce((n, x) => n + (x.outTokens || 0), 0) : run.totals?.tokens ?? null,
    tokensKind: whole ? 'output' : run.totals?.tokensKind || null,
    toolCalls: whole ? sums.reduce((n, x) => n + (x.tools || 0), 0) : run.totals?.toolCalls ?? null,
    outcomes: sums ? sumOutcomes(sums) : run.outcomes,
    branch: run.branch,
    base: run.base,
    scratch: run.scratch,
    cwd: run.cwd,
    args: { title: run.title !== run.id ? run.title : undefined, branch: run.branch || undefined, base: run.base || undefined, scratch: run.scratch || undefined, ports: run.ports || undefined },
    commits,
    files: fileList,
    commands: [...commands],
    errors,
    tests: { cases, sources, runs: testRuns },
    deep: states.length > 0,
  };
  entry.terms = [entry.title, entry.name, entry.description, entry.branch, entry.status, ...entry.labels, ...entry.phases.map((p) => p.title),
    ...entry.commands, ...fileList.map((f) => f.p), ...Object.keys(cases), ...commits.map((c) => `${c.hash} ${c.subject}`), ...errors.map((e) => e.text)]
    .filter(Boolean).map(lc).join('\n').slice(0, MAX.terms);
  return entry;
}

function sumOutcomes(list) {
  const out = {};
  for (const s of list) for (const k of ['tools', 'toolsOk', 'toolsFailed', 'tests', 'testsPassed', 'testsFailed', 'testsUnknown', 'commits', 'commitsConfirmed', 'commitsFailed', 'errors']) out[k] = (out[k] || 0) + (s[k] || 0);
  return out;
}

/** Whether an entry matches a parsed query, and the lines that matched. */
export function matchEntry(e, q) {
  const hits = [];
  const find = (list, w, field, fmt = (x) => x) => {
    const hit = list.find((x) => lc(fmt(x)).includes(w));
    if (hit !== undefined) hits.push({ field, text: excerpt(fmt(hit), 160) });
    return hit !== undefined;
  };
  for (const [field, words] of Object.entries(q.fields)) {
    for (const w of words) {
      let ok = false;
      if (field === 'status') ok = lc(e.status) === w || lc(e.status).startsWith(w);
      else if (field === 'workflow') ok = lc(e.name).includes(w);
      else if (field === 'branch') ok = lc(e.branch).includes(w);
      else if (field === 'agent') ok = find(e.labels, w, 'agent');
      else if (field === 'file') ok = find(e.files, w, 'file', (f) => f.p);
      else if (field === 'test') ok = find(Object.entries(e.tests?.cases || {}), w, 'test', ([n, r]) => `${n}: ${r}`);
      else if (field === 'cmd') ok = find(e.commands, w, 'cmd');
      else if (field === 'commit') ok = find(e.commits, w, 'commit', (c) => `${c.hash} ${c.subject}`);
      else if (field === 'error') ok = find(e.errors, w, 'error', (x) => x.text);
      if (!ok) return null;
    }
  }
  for (const w of q.terms) {
    if (!e.terms.includes(w)) return null;
    if (lc(e.title).includes(w) || lc(e.name).includes(w)) hits.push({ field: 'title', text: e.title });
    else if (!(find(e.commands, w, 'cmd') || find(e.files, w, 'file', (f) => f.p) || find(Object.keys(e.tests?.cases || {}), w, 'test') || find(e.commits, w, 'commit', (c) => `${c.hash} ${c.subject}`) || find(e.errors, w, 'error', (x) => x.text) || find(e.labels, w, 'agent'))) hits.push({ field: 'run', text: w });
  }
  return hits;
}

/** The row a list or a search returns: the entry without its search text. */
function row(e, hits = null) {
  const { terms, files, commands, errors, tests, ...rest } = e;
  return { ...rest, files: files.length, commands: commands.length, errorCount: errors.length, testCases: Object.keys(tests?.cases || {}).length, hits };
}

export function createArchive({ dir = null, collector, health = null, pauseMs = Number(process.env.AGENT_WATCH_INDEX_PAUSE ?? 60), readPauseMs = undefined } = {}) {
  const stores = new Map();
  const building = new Map();

  function fileFor(slug) {
    return dir ? path.join(dir, `${slug}.json`) : null;
  }

  function store(slug) {
    let s = stores.get(slug);
    if (s) return s;
    s = { slug, runs: {}, built: 0, errors: 0 };
    const f = fileFor(slug);
    if (f) {
      try {
        const v = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (v.v === INDEX_VERSION && v.slug === slug && v.runs) Object.assign(s, { runs: v.runs, built: v.built || 0 });
      } catch (err) {
        if (err.code !== 'ENOENT') health?.malformed('archive', f, err);
      }
    }
    stores.set(slug, s);
    return s;
  }

  function save(slug) {
    const f = fileFor(slug);
    if (!f) return;
    const s = store(slug);
    try {
      fs.mkdirSync(dir, { recursive: true });
      const tmp = `${f}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ v: INDEX_VERSION, slug, built: s.built, runs: s.runs }));
      fs.renameSync(tmp, f);
    } catch (err) {
      health?.fail('archive', f, err);
    }
  }

  /** The signature that changes when a run's journal or record changes. */
  function sigOf(rn) {
    const rec = path.join(rn.proj, rn.session, 'workflows', `${rn.id}.json`);
    let r = 0;
    try {
      r = fs.statSync(rec).mtimeMs;
    } catch { /* no record yet */ }
    return `${Math.round(rn.touched)}:${Math.round(r)}`;
  }

  async function indexRun(slug, rn) {
    const ses = await collector.sessionStateAsync(path.join(rn.proj, `${rn.session}.jsonl`));
    const call = ses.runs.get(rn.id) || null;
    const run = collector.describe(rn, false, call ? { args: call.args } : null);
    const finished = run.status !== 'running' && run.status !== 'starting';
    const states = [];
    if (finished) {
      for (const a of run.agents) {
        const st = freshAgent(a.id);
        await readNewAsync(a.file, st, (l, no) => ingestAgentLine(st, l, no, health), null, health, 'transcript', readPauseMs);
        states.push({ id: a.id, st });
      }
    }
    const logs = finished && run.scratch ? testLogs(run.scratch, health) : [];
    const e = entryOf(run, states, { logs });
    e.sig = sigOf(rn);
    e.available = true;
    e.live = !finished;
    e.indexedAt = Date.now();
    return e;
  }

  return {
    /** Indexes what is new or changed in a project; one build at a time per project. */
    refresh(slug, { onProgress = null } = {}) {
      if (building.has(slug)) return building.get(slug);
      const job = (async () => {
        const s = store(slug);
        const all = collector.runsOf(slug, true);
        const ids = new Set(all.map((r) => r.id));
        for (const [id, e] of Object.entries(s.runs)) if (!ids.has(id) && e.available !== false) e.available = false;
        const todo = all.filter((rn) => {
          const e = s.runs[rn.id];
          return !e || e.v !== INDEX_VERSION || e.live || e.sig !== sigOf(rn) || e.available === false;
        });
        let done = 0;
        let lastSave = Date.now();
        for (const rn of todo) {
          try {
            if (!fs.existsSync(rn.dir)) {
              if (s.runs[rn.id]) s.runs[rn.id].available = false;
              continue;
            }
            s.runs[rn.id] = await indexRun(slug, rn);
          } catch (err) {
            s.errors++;
            health?.fail('archive', rn.dir, err);
          }
          done++;
          onProgress?.(done, todo.length, rn.id);
          if (Date.now() - lastSave > 3000) {
            save(slug);
            lastSave = Date.now();
          }
          if (pauseMs) await sleep(pauseMs);
        }
        s.built = Date.now();
        save(slug);
        return { indexed: Object.keys(s.runs).length, updated: done };
      })().finally(() => building.delete(slug));
      building.set(slug, job);
      return job;
    },
    status(slug) {
      const s = store(slug);
      const total = collector.runsOf(slug).length;
      const entries = Object.values(s.runs);
      return { indexed: entries.filter((e) => e.available !== false).length, gone: entries.filter((e) => e.available === false).length, total, building: building.has(slug), built: s.built, persisted: !!dir };
    },
    entry(slug, id) {
      return store(slug).runs[id] || null;
    },
    entries(slug) {
      return Object.values(store(slug).runs);
    },
    /** A page of runs, newest first; status filters. */
    list(slug, { offset = 0, limit = 25, status = null } = {}) {
      let all = Object.values(store(slug).runs).sort((a, b) => (b.started || 0) - (a.started || 0));
      if (status) all = all.filter((e) => e.status === status);
      return { total: all.length, offset, limit, rows: all.slice(offset, offset + limit).map((e) => row(e)) };
    },
    /** Runs that match a query, newest first, each with the lines that matched. */
    search(slug, q, { limit = 50 } = {}) {
      const pq = parseQuery(q);
      if (!pq.terms.length && !Object.keys(pq.fields).length) return { q, total: 0, rows: [] };
      const out = [];
      for (const e of Object.values(store(slug).runs).sort((a, b) => (b.started || 0) - (a.started || 0))) {
        const hits = matchEntry(e, pq);
        if (hits) out.push(row(e, hits.slice(0, 4)));
      }
      return { q, total: out.length, rows: out.slice(0, limit) };
    },
  };
}
