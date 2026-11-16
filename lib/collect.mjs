/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Collector (dd1 Tools Edition - v1.6)
 *     - File Name: collect.mjs
 *     - Relative Path: lib/collect.mjs
 *     - Artifact Type: library
 *     - Version: 1.6.0
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.6.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
 *       project with sessions but no workflow run yet can be the one in
 *       focus: state() names it, with no runs, instead of falling back to
 *       another project; listAllProjects() lists every project folder with a
 *       session, for --project.
 *     - 1.5.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
 *       resumed run starts when its first agent did (resumed names the
 *       resume), its status note says it was resumed, and with its
 *       transcripts read its totals are summed from them; without, the
 *       record's are marked partial.
 *     - 1.4.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Agents
 *       that share a description are numbered in the order they started (docs
 *       #2). A saved run's status note reads Claude Code saved the run as
 *       "killed".
 *     - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       runBundle reads a run's session and agents' transcripts in small
 *       steps before describing it, so the deeper views never hold the
 *       service up on a large finished run.
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — runsOf
 *       can ask for a fresh list, so the archive never mistakes a run deleted
 *       a moment ago for one still there.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       audit's evidence stage (R02): the reading and parsing moved into
 *       read.mjs, claude.mjs, tests.mjs and git.mjs, and this file now
 *       assembles them. A run asked for by id is described even when it is
 *       older than the twelve shown; statuses, totals and test logs carry
 *       where they came from; live and saved tokens are labelled output or
 *       total; a scratch folder the run does not name is reported as
 *       unattributed instead of as the run's; projects and journals are
 *       cached; agent states nobody has looked at for ten minutes are let go.
 *     - 1.0.0 (11/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version.
 *
 * ✒ Description:
 *     Reads what Claude Code leaves on disk about workflow runs and turns it
 *     into the state the page draws: each run's phases, agents and what the
 *     agents did, the branch and its commits, test logs and ports, the
 *     machine's load, and how complete the picture is. It only reads.
 *
 * ✒ Key Features:
 *     - Projects: every folder under ~/.claude/projects with workflow runs,
 *       named after the folder its sessions ran in
 *     - Runs: every run, newest first; the twelve newest in the live state,
 *       and any older one in full when it is asked for by id
 *     - Status with its reason: from the saved record, or inferred from
 *       recent activity or inactivity, and said to be inferred
 *     - Totals labelled: total tokens from the record, or output tokens
 *       summed from the transcripts read so far
 *     - Agents: label, phase, model, status with its reason, counts that keep
 *       attempts apart from outcomes, and the actions of the run in focus
 *     - runBundle(): one run's agents with every event kept, its journal
 *       order, test outcomes and git, for the investigation, timeline,
 *       file, profile and handoff views
 *     - Collection health: what was read, what failed and why, and how
 *       fresh the newest source is
 *     - git and netstat through execFile with fixed arguments, cached
 *
 * ✒ Usage Instructions:
 *     import { createCollector, listProjects } from './lib/collect.mjs';
 *     const c = createCollector({ root: '~/.claude/projects' });
 *     const state = await c.state(projectSlug, runId);
 *
 * ✒ Examples:
 *     listProjects(root)                     // [{ slug, name, cwd, runs, last }]
 *     await c.state(slug)                    // { runs, current, focus, git, health, ... }
 *     await c.runBundle(slug, 'wf_abc123')   // { run, agents, order, tests, git }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+; read.mjs, claude.mjs, tests.mjs, git.mjs,
 *       evidence.mjs; git and netstat on PATH (optional)
 *     - Compatible platforms: Windows 11 (primary); macOS and Linux without
 *       the port list
 *     - Limits: the formats are Claude Code's own and undocumented; anything
 *       unreadable is counted in the health register, never guessed
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readNew, readNewAsync, readJson, createHealth } from './read.mjs';
import {
  metaOf, toolSummary, freshAgent, ingestAgentLine, agentStats, feedOf, freshSession, ingestSessionLine,
  sessionFilter, parseJournal, readMeta, facts, reportedTests, short, argsOf,
} from './claude.mjs';
import { testLogs, verdict } from './tests.mjs';
import { createGit, exec } from './git.mjs';
import { prov } from './evidence.mjs';

export { metaOf, toolSummary, facts, short };
export { readNew } from './read.mjs';
export { ingestAgentLine } from './claude.mjs';

export const RUNS_SHOWN = 12;
const RUNS_DEEP = 2;
export const QUIET_MS = 5 * 60 * 1000;
export const STALE_MS = 30 * 60 * 1000;
const IDLE_EVICT_MS = 10 * 60 * 1000;
export const SLUG = /^[\w.-]{1,200}$/;
export const RUN_ID = /^wf_[\w-]{4,64}$/;

const mtime = (p) => {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return 0;
  }
};
const sizeOf = (p) => {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
};
const exists = (p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
};

function safeDirs(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
}

/** Every workflow run folder of a project: { id, session, dir, proj, touched }. */
export function runDirs(proj) {
  const out = [];
  for (const s of safeDirs(proj)) {
    const wf = path.join(proj, s, 'subagents', 'workflows');
    for (const r of safeDirs(wf)) {
      if (!RUN_ID.test(r)) continue;
      out.push({ id: r, session: s, dir: path.join(wf, r), proj, touched: mtime(path.join(wf, r, 'journal.jsonl')) || mtime(path.join(wf, r)) });
    }
  }
  return out.sort((a, b) => b.touched - a.touched);
}

/** Projects under root that hold workflow runs, newest activity first. */
export function listProjects(root) {
  let dirs = [];
  try {
    dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && SLUG.test(d.name));
  } catch {
    return [];
  }
  const out = [];
  for (const d of dirs) {
    const proj = path.join(root, d.name);
    const runs = runDirs(proj);
    if (runs.length) {
      const cwd = cwdOf(proj);
      out.push({ slug: d.name, name: cwd ? path.basename(cwd) || cwd : nameOf(d.name), cwd, runs: runs.length, last: runs[0].touched });
    }
  }
  return out.sort((a, b) => b.last - a.last);
}

const cwdCache = new Map();
/**
 * The working directory a project's sessions ran in, from the first line
 * that names one in its newest session transcript (the first 64 KB only).
 * A slug alone cannot give it back: Claude writes every separator as "-".
 */
export function cwdOf(proj) {
  let files = [];
  try {
    files = fs.readdirSync(proj).filter((f) => f.endsWith('.jsonl')).map((f) => ({ f, m: mtime(path.join(proj, f)) })).sort((a, b) => b.m - a.m);
  } catch {
    return null;
  }
  for (const { f, m } of files.slice(0, 3)) {
    const key = `${proj}/${f}`;
    const hit = cwdCache.get(key);
    if (hit && hit.m === m) {
      if (hit.cwd) return hit.cwd;
      continue;
    }
    let cwd = null;
    try {
      const fd = fs.openSync(path.join(proj, f), 'r');
      const buf = Buffer.alloc(65536);
      const n = fs.readSync(fd, buf, 0, buf.length, 0);
      fs.closeSync(fd);
      const r = /"cwd":("(?:[^"\\]|\\.)*")/.exec(buf.toString('utf8', 0, n));
      if (r) cwd = JSON.parse(r[1]);
    } catch { /* unreadable */ }
    cwdCache.set(key, { m, cwd });
    if (cwd) return cwd;
  }
  return null;
}

/**
 * Every project folder with at least one session transcript, runs or not:
 * { slug, name, cwd, runs }. For --project, which may name a project that
 * has not started a workflow yet.
 */
export function listAllProjects(root) {
  const withRuns = new Map(listProjects(root).map((p) => [p.slug, p]));
  let dirs = [];
  try {
    dirs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && SLUG.test(d.name));
  } catch {
    return [];
  }
  const out = [];
  for (const d of dirs) {
    if (withRuns.has(d.name)) {
      out.push(withRuns.get(d.name));
      continue;
    }
    const proj = path.join(root, d.name);
    let has = false;
    try {
      has = fs.readdirSync(proj).some((f) => f.endsWith('.jsonl'));
    } catch { /* unreadable */ }
    if (!has) continue;
    const cwd = cwdOf(proj);
    out.push({ slug: d.name, name: cwd ? path.basename(cwd) || cwd : nameOf(d.name), cwd, runs: 0, last: 0 });
  }
  return out;
}

/** A readable name for a project slug when no transcript names its folder. */
export function nameOf(slug) {
  const parts = slug.split('-').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : slug;
}

/** The newest Claude scratchpad on this machine: not tied to any run. */
export function newestScratch() {
  const base = path.join(os.tmpdir(), 'claude');
  let best = null;
  for (const a of safeDirs(base)) {
    for (const b of safeDirs(path.join(base, a))) {
      const p = path.join(base, a, b, 'scratchpad');
      const t = mtime(p);
      if (t && (!best || t > best.t)) best = { p, t };
    }
  }
  return best?.p || null;
}

const ago = (ms) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

export function createCollector({ root, logs = null, health = createHealth(), git = createGit(), execFn = exec } = {}) {
  const agents = new Map();
  const sessions = new Map();
  const journals = new Map();
  const cache = new Map();
  let cpuPrev = os.cpus();
  let cpu = 0;
  const timer = setInterval(() => {
    const now = os.cpus();
    let idle = 0;
    let total = 0;
    now.forEach((c, i) => {
      const p = cpuPrev[i]?.times;
      if (!p) return;
      const t = c.times;
      idle += t.idle - p.idle;
      total += (t.user - p.user) + (t.nice - p.nice) + (t.sys - p.sys) + (t.irq - p.irq) + (t.idle - p.idle);
    });
    cpu = total ? Math.round((1 - idle / total) * 100) : 0;
    cpuPrev = now;
  }, 2000);
  timer.unref();

  async function cached(key, ms, fn) {
    const c = cache.get(key);
    if (c && Date.now() - c.at < ms) return c.value;
    const value = await fn();
    cache.set(key, { at: Date.now(), value });
    return value;
  }
  function cachedNow(key, ms, fn) {
    const c = cache.get(key);
    if (c && Date.now() - c.at < ms) return c.value;
    const value = fn();
    cache.set(key, { at: Date.now(), value });
    return value;
  }

  const projects = () => cachedNow('projects', 3000, () => listProjects(root));
  const runsOf = (slug, fresh = false) => {
    if (fresh) cache.delete(`runs:${slug}`);
    return cachedNow(`runs:${slug}`, 2000, () => runDirs(path.join(root, slug)));
  };

  function agentEntry(file, id) {
    let st = agents.get(file);
    if (!st) {
      st = freshAgent(id);
      st.reset = () => {
        const keep = st.reset;
        Object.assign(st, freshAgent(id), { reset: keep });
      };
      agents.set(file, st);
    }
    st.used = Date.now();
    return st;
  }

  function agentState(file, id) {
    const st = agentEntry(file, id);
    readNew(file, st, (l, no) => ingestAgentLine(st, l, no, health), null, health, 'transcript');
    return st;
  }

  /** The same, read in small steps, so a large transcript does not hold the service up. */
  async function agentStateAsync(file, id) {
    const st = agentEntry(file, id);
    await readNewAsync(file, st, (l, no) => ingestAgentLine(st, l, no, health), null, health, 'transcript', 0);
    return st;
  }

  function sessionState(file) {
    let st = sessions.get(file);
    if (!st) {
      st = freshSession();
      st.reset = () => {
        st.calls.clear();
        st.runs.clear();
      };
      sessions.set(file, st);
    }
    readNew(file, st, (l) => ingestSessionLine(st, l, health), sessionFilter(st), health, 'session');
    return st;
  }

  async function sessionStateAsync(file) {
    let st = sessions.get(file);
    if (!st) {
      st = freshSession();
      st.reset = () => {
        st.calls.clear();
        st.runs.clear();
      };
      sessions.set(file, st);
    }
    await readNewAsync(file, st, (l) => ingestSessionLine(st, l, health), sessionFilter(st), health, 'session');
    return st;
  }

  function journal(dir) {
    const file = path.join(dir, 'journal.jsonl');
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      return { started: new Map(), results: new Map(), order: [] };
    }
    const sig = `${stat.mtimeMs}:${stat.size}`;
    const hit = journals.get(file);
    if (hit && hit.sig === sig) return hit.value;
    let value;
    try {
      value = parseJournal(fs.readFileSync(file, 'utf8'), health);
      health.read('journal');
    } catch (err) {
      health.fail('journal', file, err);
      value = { started: new Map(), results: new Map(), order: [] };
    }
    journals.set(file, { sig, value });
    if (journals.size > 400) journals.delete(journals.keys().next().value);
    return value;
  }

  function scriptMeta(file) {
    if (!file) return null;
    return cachedNow(`meta:${file}:${mtime(file)}`, 3600000, () => {
      try {
        return metaOf(fs.readFileSync(file, 'utf8'));
      } catch {
        return null;
      }
    });
  }

  function recordOf(rn) {
    const file = path.join(rn.proj, rn.session, 'workflows', `${rn.id}.json`);
    const m = mtime(file);
    if (!m) return { file, rec: null };
    return { file, rec: cachedNow(`rec:${file}:${m}`, 3600000, () => readJson(file, health, 'record')) };
  }

  function agentMetas(rn) {
    let names = [];
    try {
      names = fs.readdirSync(rn.dir);
    } catch (err) {
      health.fail('run-folder', rn.dir, err);
    }
    const metas = [];
    for (const f of names) {
      const m = /^agent-(\w+)\.meta\.json$/.exec(f);
      if (!m) continue;
      const file = path.join(rn.dir, f);
      const meta = cachedNow(`am:${file}:${mtime(file)}`, 3600000, () => readMeta(file, health));
      if (meta) metas.push({ id: m[1], meta, born: mtime(file) });
    }
    return metas.sort((a, b) => a.born - b.born);
  }

  /** A run described for the page; deep reads its agents' transcripts. */
  function describe(rn, deep, extra = null) {
    const { file: recFile, rec } = recordOf(rn);
    const sesFile = path.join(rn.proj, `${rn.session}.jsonl`);
    const ses = deep || !rec ? sessionState(sesFile) : sessions.get(sesFile) || null;
    const call = ses?.runs.get(rn.id) || null;
    const args = { ...argsOf(rec?.args), ...(call?.args || {}), ...(extra?.args || {}) };
    const meta = rec ? { name: rec.workflowName, description: rec.summary, phases: rec.phases || [] } : scriptMeta(call?.scriptFile || call?.scriptPath);
    const j = journal(rn.dir);
    const jFile = path.join(rn.dir, 'journal.jsonl');
    const now = Date.now();
    const list = agentMetas(rn).map(({ id, meta: am, born }) => {
      const file = path.join(rn.dir, `agent-${id}.jsonl`);
      const st = deep ? agentState(file, id) : null;
      const done = j.results.has(id);
      const last = st?.last || mtime(file) || born;
      const quiet = !done && !rec && now - last > QUIET_MS;
      let status = done ? 'done' : (rec && rec.status !== 'running' ? 'stopped' : 'running');
      let why = done ? prov('journal', [jFile], 'a result line for this agent in the run journal')
        : rec ? prov('record', [recFile], `the run's record says ${rec.status}, and the journal has no result for this agent`)
          : prov('inferred-activity', [file], `no result yet; its transcript was last written ${ago(now - last)} ago${quiet ? ', longer than five minutes, so it is marked quiet' : ''}`, 'partial');
      return {
        id,
        file,
        label: am.description || id,
        phase: am.workflowPhase || j.started.get(id)?.phase || '',
        model: am.pickedEffortModel || st?.model || '',
        type: am.agentType || '',
        status,
        why,
        quiet,
        started: st?.first || born,
        last,
        stats: st ? agentStats(st) : null,
        result: done ? facts(j.results.get(id)) : null,
        feed: st ? feedOf(st) : [],
        cwd: st?.cwd || null,
        gitBranch: st?.gitBranch || null,
        st,
      };
    });
    // Two agents can carry one description (a phase run again, a retried step); the later ones
    // are numbered in the order they started, so tabs, the rail and the lanes tell them apart.
    const seen = new Map();
    for (const a of list) {
      const n = (seen.get(a.label) || 0) + 1;
      seen.set(a.label, n);
      if (n > 1) a.label = `${a.label} #${n}`;
    }
    // With no saved record a run is running while an agent is; one quiet for
    // half an hour was stopped without a record (a killed session) and is
    // called unfinished rather than shown running forever.
    const lastAny = Math.max(rn.touched, ...list.map((a) => a.last || 0));
    const live = !rec && list.some((a) => a.status === 'running') && now - lastAny < STALE_MS;
    const status = rec ? (rec.status || 'completed') : live ? 'running' : list.length ? 'unfinished' : 'starting';
    let why;
    if (rec) why = prov('record', [recFile], `Claude Code saved the run as "${rec.status || 'completed'}"`);
    else if (live) why = prov('inferred-activity', [jFile], `no saved record yet; an agent wrote to its transcript ${ago(now - lastAny)} ago, inside the 30-minute window`, 'partial');
    else if (list.length) why = prov('inferred-stale', [jFile], `no saved record, and nothing written for ${ago(now - lastAny)}, past the 30-minute window. The session may have been stopped or lost; this does not mean the work failed.`, 'partial');
    else why = prov('journal', [jFile], 'the journal exists but no agent has started', 'partial');
    if (!rec && !live) {
      for (const a of list) {
        if (a.status === 'running') {
          a.status = 'stopped';
          a.why = prov('inferred-stale', [a.file], `no result, and the run has been quiet past the 30-minute window`, 'partial');
        }
      }
    }
    const declared = (meta?.phases || []).map((p) => (typeof p === 'string' ? { title: p, detail: '' } : p));
    const titles = [...declared.map((p) => p.title), ...list.map((a) => a.phase).filter((p) => p && !declared.some((d) => d.title === p))];
    const phases = [...new Set(titles)].map((title) => {
      const own = list.filter((a) => a.phase === title);
      const detail = declared.find((d) => d.title === title)?.detail || '';
      let state = 'pending';
      if (own.some((a) => a.status === 'running')) state = 'active';
      else if (own.length && own.every((a) => a.status === 'done')) state = 'done';
      else if (own.length) state = 'stopped';
      const starts = own.map((a) => a.started).filter(Boolean);
      const ends = own.map((a) => a.last).filter(Boolean);
      return { title, detail, state, agents: own.map((a) => a.id), start: starts.length ? Math.min(...starts) : null, end: ends.length ? Math.max(...ends) : null, declared: declared.some((d) => d.title === title) };
    });
    const title = args.title || args.piece?.name || args.tab?.name || (typeof args.name === 'string' ? args.name : null) || meta?.name || rn.id;
    const allDeep = list.length > 0 && list.every((a) => a.stats);
    const sum = (k) => list.reduce((s, a) => s + (a.stats?.[k] || 0), 0);
    // A run that was resumed is saved again with the resume as its start, though its first
    // agents began hours before; the earlier of the record's start and the first agent's is
    // when the run began, and the status sentence says the run was resumed.
    const recStart = rec?.startTime ? Number(rec.startTime) : null;
    const firstAgent = list.map((a) => a.started).filter((t) => Number.isFinite(t) && t > 0).reduce((m, t) => Math.min(m, t), Infinity);
    const started = Math.min(recStart || Infinity, firstAgent) < Infinity ? Math.min(recStart || Infinity, firstAgent) : rn.touched;
    const resumed = recStart && firstAgent < recStart - 60000 ? recStart : null;
    if (resumed && why) why.note += `. The run was resumed: the record's start is the resume's, so the start shown is when its first agent began`;
    // The re-saved record's totals cover the resumed part only. With the transcripts read,
    // the agents' sums cover the whole run and are used instead; without them, the record's
    // figures stand, said to be partial.
    const fromRecord = rec && !(resumed && allDeep);
    const totals = fromRecord ? {
      tokens: rec.totalTokens || 0,
      tokensKind: 'total',
      toolCalls: rec.totalToolCalls || 0,
      why: resumed
        ? prov('record', [recFile], 'total tokens (input, output and cache) and tool calls as Claude Code saved them, for the resumed part only: the run before the resume is not in them', 'partial')
        : prov('record', [recFile], 'total tokens (input, output and cache) and tool calls as Claude Code saved them'),
    } : {
      tokens: allDeep ? sum('outTokens') : null,
      tokensKind: 'output',
      toolCalls: allDeep ? sum('tools') : null,
      why: prov('sum', list.map((a) => a.file), allDeep
        ? `output tokens and tool calls summed from the agents' transcripts; input and cache tokens are not in this sum${resumed ? '. The run was resumed, and its record\'s totals cover only the resumed part, so the whole run is summed here' : ''}`
        : 'not summed: the run\'s transcripts are read when it is chosen', allDeep ? 'complete' : 'unavailable'),
    };
    const outcomes = allDeep ? {
      toolsOk: sum('toolsOk'), toolsFailed: sum('toolsFailed'), toolsOpen: sum('toolsOpen'),
      tests: sum('tests'), testsPassed: sum('testsPassed'), testsFailed: sum('testsFailed'), testsUnknown: sum('testsUnknown'),
      commits: sum('commits'), commitsConfirmed: sum('commitsConfirmed'), commitsFailed: sum('commitsFailed'), errors: sum('errors'),
    } : null;
    const cwd = ses?.cwd || list.find((a) => a.cwd)?.cwd || null;
    return {
      id: rn.id,
      session: rn.session,
      name: meta?.name || rec?.workflowName || null,
      description: meta?.description || null,
      title: typeof title === 'string' ? title : rn.id,
      status,
      why,
      record: !!rec,
      started,
      resumed,
      ended: rec ? (Number(rec.startTime) || 0) + (rec.durationMs || 0) : null,
      last: lastAny,
      totals,
      outcomes,
      branch: typeof args.branch === 'string' ? args.branch : null,
      base: typeof args.base === 'string' ? args.base : null,
      ports: typeof args.ports === 'string' ? args.ports : null,
      scratch: typeof args.scratch === 'string' ? args.scratch : null,
      cwd,
      phases,
      agents: list,
      deep: allDeep,
      model: rec?.defaultModel || null,
      reported: rec ? reportedTests(rec.result) : [],
      resultFacts: rec ? facts(rec.result) : null,
      sources: { record: rec ? recFile : null, journal: jFile, session: sesFile, dir: rn.dir },
    };
  }

  /** A run with its agents' private state stripped, as the page receives it. */
  function forPage(r, withFeed) {
    return { ...r, agents: r.agents.map(({ st, file, ...a }) => ({ ...a, feed: withFeed ? a.feed : [] })) };
  }

  async function ports(range) {
    const m = /^(\d{2,5})-(\d{2,5})$/.exec(range || '');
    if (!m || process.platform !== 'win32') return [];
    const lo = Number(m[1]);
    const hi = Math.min(Number(m[2]), lo + 200);
    return cached(`ports:${range}`, 5000, async () => {
      const out = await execFn('netstat', ['-ano', '-p', 'TCP']);
      const found = new Map();
      for (const l of out.split('\n')) {
        const r = /^\s*TCP\s+127\.0\.0\.1:(\d+)\s+\S+\s+LISTENING\s+(\d+)/.exec(l);
        if (r && Number(r[1]) >= lo && Number(r[1]) <= hi) found.set(Number(r[1]), Number(r[2]));
      }
      return [...found].sort((a, b) => a[0] - b[0]).map(([port, pid]) => ({ port, pid }));
    });
  }

  /** The test logs for a run: its own scratch folder, or the newest scratchpad, said to be unattributed. */
  function logsFor(run) {
    if (logs) return { dir: logs, logs: testLogs(exists(logs) ? logs : null, health), why: prov('scratch-log', [logs], 'the folder given with --logs') };
    if (run?.scratch) return { dir: run.scratch, logs: testLogs(exists(run.scratch) ? run.scratch : null, health), why: prov('scratch-log', [run.scratch], 'the scratch folder the run\'s arguments name') };
    const dir = newestScratch();
    return { dir, logs: testLogs(dir, health), unattributed: true, why: prov('scratch-unattributed', [dir], 'this run names no scratch folder, so these are the newest Claude scratchpad\'s logs; they may belong to another session', dir ? 'partial' : 'unavailable') };
  }

  /** Lets go of agent states nobody has asked about for ten minutes. */
  function evict(keep) {
    const cutoff = Date.now() - IDLE_EVICT_MS;
    for (const [file, st] of agents) if (st.used < cutoff && !keep.has(file)) agents.delete(file);
  }

  function machine() {
    return { cpu, cores: os.cpus().length, memTotal: os.totalmem(), memFree: os.freemem(), uptime: os.uptime(), host: os.hostname(), why: prov('os', [], 'the whole machine, not any one agent') };
  }

  function findRun(slug, id) {
    if (!RUN_ID.test(id || '')) return null;
    return runsOf(slug).find((r) => r.id === id) || null;
  }

  return {
    health,
    projects,
    runsOf,
    describe,
    findRun,
    agentState,
    sessionStateAsync,
    journal,
    forPage,
    logsFor,
    async state(slug, focusId = null, extraFor = null) {
      let list = projects();
      let project = list.find((p) => p.slug === slug) || null;
      // A project asked for by name that has sessions but no workflow run yet is shown as itself,
      // with no runs, rather than as whichever project ran a workflow last.
      if (!project && slug && SLUG.test(slug) && exists(path.join(root, slug))) {
        const cwd = cwdOf(path.join(root, slug));
        project = { slug, name: cwd ? path.basename(cwd) || cwd : nameOf(slug), cwd, runs: 0, last: 0 };
        list = [project, ...list];
      }
      project = project || list[0] || null;
      const base = { now: Date.now(), projects: list, machine: machine(), health: { ...health.snapshot(), at: Date.now() } };
      if (!project) return { ...base, project: null, runs: [], current: null, focus: null, git: null, ports: [], logs: [], logDir: null };
      const all = runsOf(project.slug);
      const want = focusId && RUN_ID.test(focusId) ? focusId : null;
      const recent = all.slice(0, RUNS_SHOWN);
      // A run asked for by id is described in full even when it is older than the twelve shown.
      const older = want && !recent.some((r) => r.id === want) ? all.find((r) => r.id === want) : null;
      const picks = older ? [...recent, older] : recent;
      const runs = picks.map((r, i) => describe(r, i < RUNS_DEEP || r.id === want, extraFor?.(project.slug, r.id)));
      const current = runs.find((r) => r.status === 'running') || runs[0] || null;
      const focus = runs.find((r) => r.id === want) || current;
      evict(new Set(runs.flatMap((r) => r.agents.map((a) => a.file))));
      const cwd = focus?.cwd || current?.cwd || runs.find((r) => r.cwd)?.cwd || null;
      const lg = logsFor(focus);
      const [g, p] = await Promise.all([git.info(cwd, focus?.branch, focus?.base), ports(focus?.ports)]);
      return {
        ...base,
        health: { ...health.snapshot(), at: Date.now() },
        project: { ...project, cwd },
        current: current?.id || null,
        focus: focus?.id || null,
        total: all.length,
        older: older ? older.id : null,
        runs: runs.map((r) => forPage(r, r.id === focus?.id)),
        git: g,
        ports: p,
        portsWhy: prov('netstat', [], focus?.ports ? `listening ports in the run's range ${focus.ports}` : 'the run names no port range'),
        logs: lg.logs,
        logDir: lg.dir,
        logsWhy: lg.why,
        logsUnattributed: !!lg.unattributed,
      };
    },
    /** One run with every event its agents' transcripts hold, for the deeper views. */
    async runBundle(slug, id, extra = null) {
      const rn = findRun(slug, id);
      if (!rn) return null;
      // Read the transcripts in small steps first; describe then finds nothing new to read.
      await sessionStateAsync(path.join(rn.proj, `${rn.session}.jsonl`));
      for (const { id: aid } of agentMetas(rn)) await agentStateAsync(path.join(rn.dir, `agent-${aid}.jsonl`), aid);
      const run = describe(rn, true, extra);
      const j = journal(rn.dir);
      const cwd = run.cwd;
      const g = await git.info(cwd, run.branch, run.base);
      const lg = logsFor(run);
      return {
        run: forPage(run, false),
        agents: run.agents.map((a) => ({ id: a.id, label: a.label, phase: a.phase, status: a.status, started: a.started, last: a.last, model: a.model, file: a.file, events: a.st?.events || [], dropped: a.st?.dropped || 0, files: a.st ? [...a.st.files.values()] : [], stats: a.stats })),
        order: j.order,
        git: g,
        logs: lg.logs,
        logsWhy: lg.why,
        logsUnattributed: !!lg.unattributed,
        reported: run.reported,
      };
    },
    machine,
    close() {
      clearInterval(timer);
    },
  };
}

export { verdict };
