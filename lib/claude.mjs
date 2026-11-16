/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Claude Adapter (dd1 Tools Edition - v1.2)
 *     - File Name: claude.mjs
 *     - Relative Path: lib/claude.mjs
 *     - Artifact Type: library
 *     - Version: 1.2.0
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.2.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — For the
 *       Sessions view: ingestAgentLine takes a line already parsed, and the
 *       capped event push is exported as pushEvent, so the session reader
 *       folds a terminal session's own lines with the same rules as an
 *       agent's.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
 *       StructuredOutput call reads as the agent's structured result with its
 *       first keys, not as its JSON.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, split out of collect.mjs for the audit's evidence stage
 *       (R02): each tool call is paired with its result by id, so a call is
 *       pending, ok or failed rather than counted on sight; a commit counts
 *       as confirmed only when git's own summary line comes back; test
 *       calls carry the outcome their output reports; every event keeps the
 *       transcript line it came from.
 *
 * ✒ Description:
 *     Reads Claude Code's own files: an agent's transcript into events and
 *     counts, a session transcript into its Workflow calls, a run's journal,
 *     an agent's meta file, a saved run record's facts, and a workflow
 *     script's meta block without running it.
 *
 * ✒ Key Features:
 *     - Events with stable ids (agent#seq), the time the line was written,
 *       the line number, and for a tool call its result's time, duration,
 *       status and, for errors, tests and commits, a redacted excerpt
 *     - Counts that keep attempts apart from outcomes: tool calls ok, failed
 *       and still open; tests passed, failed or unknown; commits confirmed,
 *       failed or unconfirmed
 *     - Files each agent read or edited, from the tool inputs, with whether
 *       each edit came back ok
 *     - The agent's model, working folder and git branch, from its lines
 *     - Workflow calls: arguments given as an object or as a JSON string
 *     - A run's journal: who started, in which phase, and who finished
 *     - facts(): a finished agent's or run's result reduced to counts,
 *       including the tests a workflow reports as { name, result } entries
 *
 * ✒ Usage Instructions:
 *     const st = freshAgent('a1b2');
 *     readNew(file, st, (line, no) => ingestAgentLine(st, line, no, health));
 *     st.events, st.tools, st.commitsConfirmed, ...
 *
 * ✒ Examples:
 *     kindOf('Bash', { command: 'git commit -m x' })   // 'commit'
 *     metaOf(src)                                     // { name, description, phases }
 *     facts({ findings: [{ severity: 'high' }] })     // { findings: 1, severity: { high: 1 } }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+; read.mjs, tests.mjs, evidence.mjs
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Limits: the formats are Claude Code's own and undocumented; a line
 *       that is not JSON is counted as malformed and skipped
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseLine } from './read.mjs';
import { parseTestOutput, verdict } from './tests.mjs';
import { excerpt, block } from './evidence.mjs';

export const EVENTS_MAX = 4000;
export const FEED_SENT = 80;

export function short(s, n = 160) {
  s = String(s ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/* ---------- a workflow script's meta, without eval ---------- */

/** The string literal starting at s[i] (', " or `), and where it ends. */
function literal(s, i) {
  const q = s[i];
  let out = '';
  for (let k = i + 1; k < s.length; k++) {
    const c = s[k];
    if (c === '\\') {
      out += s[k + 1] ?? '';
      k++;
    } else if (c === q) return { value: out, end: k + 1 };
    else out += c;
  }
  return { value: out, end: s.length };
}

/** name, description and phases from `export const meta = { ... }`, or null. */
export function metaOf(src) {
  const at = src.indexOf('export const meta');
  if (at < 0) return null;
  const open = src.indexOf('{', at);
  if (open < 0) return null;
  let depth = 0;
  let end = -1;
  for (let k = open; k < src.length; k++) {
    const c = src[k];
    if (c === '\'' || c === '"' || c === '`') {
      k = literal(src, k).end - 1;
      continue;
    }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) {
        end = k;
        break;
      }
    }
  }
  if (end < 0) return null;
  const body = src.slice(open, end + 1);
  const field = (name, from = 0, to = body.length) => {
    const re = new RegExp(`\\b${name}\\s*:\\s*(['"\`])`, 'g');
    re.lastIndex = from;
    const m = re.exec(body);
    if (!m || m.index > to) return null;
    return literal(body, m.index + m[0].length - 1).value;
  };
  const phases = [];
  const pAt = body.search(/\bphases\s*:\s*\[/);
  if (pAt >= 0) {
    let k = body.indexOf('[', pAt) + 1;
    while (k < body.length) {
      const c = body[k];
      if (c === ']') break;
      if (c === '{') {
        let d = 0;
        let e = k;
        for (; e < body.length; e++) {
          const ch = body[e];
          if (ch === '\'' || ch === '"' || ch === '`') {
            e = literal(body, e).end - 1;
            continue;
          }
          if (ch === '{') d++;
          else if (ch === '}' && --d === 0) break;
        }
        const title = field('title', k, e);
        if (title) phases.push({ title, detail: field('detail', k, e) || '' });
        k = e + 1;
        continue;
      }
      if (c === '\'' || c === '"' || c === '`') k = literal(body, k).end;
      else k++;
    }
  }
  return { name: field('name'), description: field('description'), phases };
}

/* ---------- tool calls ---------- */

const COMMIT = /\bgit\b(?:\s+-[cC]\s+(?:"[^"]*"|'[^']*'|\S+))*\s+(commit|merge)\b/;
const TEST = /ui-check|run-ui|\bnpm (?:run )?test\b|\bnode (?:--test\b|[\w./\\-]*test[\w-]*\.m?js)|\bpytest\b|\bpython3? (?:-m (?:pytest|unittest)\b|[\w./\\-]*(?:test_|_test|selftest)[\w-]*\.py)|\bnpx (?:jest|vitest|mocha)\b|\b(?:gradlew?|cargo|go|dotnet) test\b|\bdigi test\b|\bmvn test\b/;
export const EDIT_TOOLS = /^(Edit|Write|NotebookEdit|MultiEdit)$/;
const READ_TOOLS = /^(Read|Grep|Glob|LS)$/;

/** One line of what a tool call is for: its description, else its command or target. */
export function toolSummary(input = {}) {
  if (input.description) return short(input.description);
  if (input.command) return short(String(input.command).split('\n')[0]);
  if (input.file_path) return short(String(input.file_path).replace(/\\/g, '/').split('/').slice(-3).join('/'));
  if (input.notebook_path) return short(String(input.notebook_path).replace(/\\/g, '/').split('/').slice(-3).join('/'));
  if (input.pattern) return short(`${input.pattern}${input.path ? ` in ${path.basename(String(input.path))}` : ''}`);
  if (input.query) return short(input.query);
  if (input.prompt) return short(input.prompt);
  return short(JSON.stringify(input), 100);
}

/** What kind of action a tool call is: commit, test, edit, read or tool. */
export function kindOf(name, input = {}) {
  const cmd = String(input?.command || '');
  if (cmd && COMMIT.test(cmd)) return 'commit';
  if (cmd && TEST.test(cmd)) return 'test';
  if (EDIT_TOOLS.test(name)) return 'edit';
  if (READ_TOOLS.test(name)) return 'read';
  return 'tool';
}

/** The path a tool call names, written with forward slashes. */
export function fileOf(input = {}) {
  const p = input.file_path || input.notebook_path || null;
  return p ? String(p).replace(/\\/g, '/') : null;
}

/** A tool result's text, whether its content is a string or a list of blocks. */
export function resultText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((x) => (typeof x === 'string' ? x : x?.text || '')).join('\n');
  return '';
}

/** A command reduced to what identifies it across retries: first line, no quotes' contents. */
export function signature(cmd) {
  return short(String(cmd || '').split('\n')[0].replace(/(["'])(?:\\.|(?!\1).)*\1/g, '$1…$1').replace(/\s+/g, ' '), 200);
}

/* ---------- an agent's transcript ---------- */

export function freshAgent(agentId = '') {
  return {
    agentId,
    events: [],
    dropped: 0,
    seq: 0,
    pending: new Map(),
    files: new Map(),
    tools: 0,
    toolsOk: 0,
    toolsFailed: 0,
    byTool: {},
    tests: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsUnknown: 0,
    commits: 0,
    commitsConfirmed: 0,
    commitsFailed: 0,
    errors: 0,
    outTokens: 0,
    first: null,
    last: null,
    model: null,
    cwd: null,
    gitBranch: null,
    size: 0,
  };
}

/** Adds an event to a state's list, letting the oldest 500 go once it holds 4,500. */
export function pushEvent(st, ev) {
  st.events.push(ev);
  if (st.events.length > EVENTS_MAX + 500) {
    st.events.splice(0, 500);
    st.dropped += 500;
  }
}

function fileNote(st, p, ev, how) {
  if (!p) return;
  let f = st.files.get(p);
  if (!f) {
    f = { path: p, reads: 0, edits: 0, editsOk: 0, editsFailed: 0, first: ev.t, last: ev.t, events: [] };
    st.files.set(p, f);
  }
  if (how === 'read') f.reads++;
  else f.edits++;
  if (ev.t) {
    f.first = f.first ? Math.min(f.first, ev.t) : ev.t;
    f.last = Math.max(f.last || 0, ev.t);
  }
  if (f.events.length < 200) f.events.push(ev.id);
}

/**
 * Folds one transcript line into an agent's state. A caller that has already
 * parsed the line (the session reader) passes the object as parsed, so the
 * line is not parsed twice.
 */
export function ingestAgentLine(st, line, lineNo = null, health = null, parsed = null) {
  const o = parsed ?? parseLine(line, health, 'transcript');
  if (!o) return;
  const ts = o.timestamp ? Date.parse(o.timestamp) || null : null;
  if (ts) {
    if (!st.first) st.first = ts;
    st.last = ts;
  }
  if (o.cwd) st.cwd = o.cwd;
  if (o.gitBranch) st.gitBranch = o.gitBranch;
  const c = o.message?.content;
  if (o.type === 'assistant' && Array.isArray(c)) {
    st.outTokens += o.message.usage?.output_tokens || 0;
    if (o.message.model) st.model = o.message.model;
    for (const b of c) {
      if (b.type === 'text' && b.text?.trim()) {
        pushEvent(st, { id: `${st.agentId}#${++st.seq}`, agent: st.agentId, t: ts, line: lineNo, kind: 'say', text: excerpt(b.text, 360) });
      } else if (b.type === 'tool_use') {
        const input = b.input || {};
        const kind = kindOf(b.name, input);
        st.tools++;
        st.byTool[b.name] = (st.byTool[b.name] || 0) + 1;
        if (kind === 'test') st.tests++;
        if (kind === 'commit') st.commits++;
        const summary = b.name === 'StructuredOutput' ? `The agent's structured result (${Object.keys(input).slice(0, 4).join(', ') || 'empty'})` : toolSummary(input);
        const ev = { id: `${st.agentId}#${++st.seq}`, agent: st.agentId, t: ts, line: lineNo, kind, tool: b.name, text: excerpt(summary, 200), status: 'pending', use: b.id || null };
        if (input.command) ev.cmd = excerpt(signature(input.command), 200);
        const f = fileOf(input);
        if (f) {
          ev.files = [f];
          fileNote(st, f, ev, kind === 'edit' ? 'edit' : 'read');
        }
        if (b.id) st.pending.set(b.id, ev);
        pushEvent(st, ev);
      }
    }
  } else if (o.type === 'user' && Array.isArray(c)) {
    for (const b of c) {
      if (b.type !== 'tool_result') continue;
      const isErr = b.is_error === true;
      const ev = st.pending.get(b.tool_use_id);
      const text = resultText(b.content);
      if (ev) {
        st.pending.delete(b.tool_use_id);
        ev.end = ts;
        ev.ms = ts && ev.t ? Math.max(0, ts - ev.t) : null;
        ev.status = isErr ? 'error' : 'ok';
        ev.rline = lineNo;
        if (isErr) st.toolsFailed++;
        else st.toolsOk++;
        if (ev.kind === 'test') {
          const o2 = parseTestOutput(text);
          const v = o2 ? verdict(o2) : isErr ? 'failed' : 'unknown';
          ev.outcome = v;
          if (o2) ev.tests = { format: o2.format, passed: o2.passed, failed: o2.failed, skipped: o2.skipped, tally: o2.tally, counted: o2.counted, cases: o2.cases.slice(0, 60) };
          if (v === 'passed') st.testsPassed++;
          else if (v === 'failed') st.testsFailed++;
          else st.testsUnknown++;
          ev.out = block(text, 1200);
        } else if (ev.kind === 'commit') {
          const m = /\[[^\]\n]*?\s([0-9a-f]{7,40})\]\s*(.*)/.exec(text);
          if (isErr || /nothing to commit|no changes added to commit|nothing added to commit/i.test(text)) {
            ev.outcome = 'failed';
            st.commitsFailed++;
          } else if (m) {
            ev.outcome = 'confirmed';
            ev.commit = { hash: m[1].slice(0, 12), subject: excerpt(m[2], 160) };
            st.commitsConfirmed++;
          } else if (/^Merge made by|Fast-forward/m.test(text)) {
            ev.outcome = 'confirmed';
            st.commitsConfirmed++;
          } else ev.outcome = 'unconfirmed';
          ev.out = block(text, 800);
        } else if (ev.kind === 'edit' && ev.files) {
          const f = st.files.get(ev.files[0]);
          if (f) {
            if (isErr) f.editsFailed++;
            else f.editsOk++;
          }
        }
        if (isErr && !ev.out) ev.out = block(text, 1200);
      }
      if (isErr) {
        st.errors++;
        pushEvent(st, { id: `${st.agentId}#${++st.seq}`, agent: st.agentId, t: ts, line: lineNo, kind: 'error', tool: ev?.tool || null, of: ev?.id || null, text: excerpt(text, 240) });
      }
    }
  }
}

/** The counts the page shows for an agent, attempts kept apart from outcomes. */
export function agentStats(st) {
  return {
    tools: st.tools,
    toolsOk: st.toolsOk,
    toolsFailed: st.toolsFailed,
    toolsOpen: st.pending.size,
    byTool: st.byTool,
    tests: st.tests,
    testsPassed: st.testsPassed,
    testsFailed: st.testsFailed,
    testsUnknown: st.testsUnknown,
    commits: st.commits,
    commitsConfirmed: st.commitsConfirmed,
    commitsFailed: st.commitsFailed,
    errors: st.errors,
    outTokens: st.outTokens,
    bytes: st.size,
    events: st.events.length + st.dropped,
    dropped: st.dropped,
  };
}

/** The last events of an agent, the fields the feed needs. */
export function feedOf(st, n = FEED_SENT) {
  return st.events.slice(-n).map((e) => ({ id: e.id, t: e.t, kind: e.kind, tool: e.tool, text: e.text, status: e.status, ms: e.ms, outcome: e.outcome, of: e.of, line: e.line }));
}

/* ---------- a session transcript: its Workflow calls ---------- */

/** Arguments given as an object or as a JSON string, as an object. */
export function argsOf(a) {
  if (a && typeof a === 'object' && !Array.isArray(a)) return a;
  if (typeof a === 'string') {
    try {
      const v = JSON.parse(a);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch { /* free text */ }
  }
  return {};
}

export function freshSession() {
  return { calls: new Map(), runs: new Map(), cwd: null };
}

/** Folds one session line into its Workflow calls: run id -> { args, scriptPath, scriptFile, t }. */
export function ingestSessionLine(st, line, health = null) {
  const o = parseLine(line, health, 'session');
  if (!o) return;
  if (!st.cwd && o.cwd) st.cwd = o.cwd;
  const c = o.message?.content;
  if (!Array.isArray(c)) return;
  const ts = o.timestamp ? Date.parse(o.timestamp) || null : null;
  for (const b of c) {
    if (b.type === 'tool_use' && b.name === 'Workflow') st.calls.set(b.id, { ...(b.input || {}), t: ts });
    else if (b.type === 'tool_result' && st.calls.has(b.tool_use_id)) {
      const text = resultText(b.content);
      const id = /Run ID: (wf_[\w-]+)/.exec(text)?.[1];
      const script = /Script file: (.+)/.exec(text)?.[1]?.trim();
      const call = st.calls.get(b.tool_use_id);
      if (id) st.runs.set(id, { args: argsOf(call.args), scriptPath: call.scriptPath || null, scriptFile: script || null, t: call.t });
    }
  }
}

export const sessionFilter = (st) => (l) => (!st.cwd && l.includes('"cwd"')) || l.includes('"Workflow"') || l.includes('Run ID: wf_');

/* ---------- a run's journal ---------- */

/** Who started, in which phase, and who finished, in the order the journal says. */
export function parseJournal(text, health = null) {
  const started = new Map();
  const results = new Map();
  const order = [];
  for (const l of String(text || '').split('\n')) {
    if (!l.trim()) continue;
    const o = parseLine(l, health, 'journal');
    if (!o) continue;
    if (o.type === 'started' && o.agentId) {
      started.set(o.agentId, o);
      order.push({ type: 'started', agent: o.agentId, phase: o.phase || '' });
    } else if (o.type === 'result') {
      const id = o.agentId ?? [...started.keys()].find((k) => !results.has(k));
      if (id) {
        results.set(id, o.result ?? null);
        order.push({ type: 'result', agent: id });
      }
    }
  }
  return { started, results, order };
}

/** An agent's meta file, or null. */
export function readMeta(file, health = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') health?.malformed('agent-meta', file, err);
    return null;
  }
}

/* ---------- results ---------- */

const PASS = /^(pass|passed|ok|✓|green|success|succeeded)\b/i;
const FAIL = /^(fail|failed|failing|✗|✕|x|red|error|broken)\b/i;

/** The { name, result } test entries a workflow's result reports, at any depth up to four. */
export function reportedTests(r) {
  const cases = [];
  const walk = (v, d) => {
    if (!v || typeof v !== 'object' || d > 5 || cases.length >= 200) return;
    if (Array.isArray(v)) {
      for (const x of v) walk(x, d + 1);
      return;
    }
    if (typeof v.name === 'string' && typeof v.result === 'string') {
      const res = PASS.test(v.result.trim()) ? 'passed' : FAIL.test(v.result.trim()) ? 'failed' : 'other';
      cases.push({ name: short(v.name, 160), result: res, said: short(v.result, 80) });
      return;
    }
    for (const x of Object.values(v)) walk(x, d + 1);
  };
  walk(r, 0);
  return cases;
}

/** A finished agent's or run's result, reduced to the facts worth a line. */
export function facts(r) {
  if (!r || typeof r !== 'object') return null;
  const f = {};
  if (Array.isArray(r.commits)) f.commits = r.commits.slice(0, 10).map((c) => short(c, 140));
  if (typeof r.commit === 'string' && r.commit) f.commits = [short(r.commit, 140)];
  if (Array.isArray(r.findings)) {
    f.findings = r.findings.length;
    f.severity = {};
    for (const x of r.findings) f.severity[x.severity] = (f.severity[x.severity] || 0) + 1;
  }
  if (Array.isArray(r.risks)) f.risks = r.risks.length;
  if (Array.isArray(r.deferred)) f.deferred = r.deferred.length;
  if (Array.isArray(r.problems)) f.problems = r.problems.length;
  if (Array.isArray(r.unverified)) f.unverified = r.unverified.length;
  for (const k of ['npmTest', 'uiCheck']) if (typeof r[k] === 'string') f[k] = short(r[k], 240);
  if (typeof r.summary === 'string') f.summary = short(r.summary, 280);
  const t = reportedTests(r);
  if (t.length) f.tests = { passed: t.filter((x) => x.result === 'passed').length, failed: t.filter((x) => x.result === 'failed').length, other: t.filter((x) => x.result === 'other').length };
  return f;
}
