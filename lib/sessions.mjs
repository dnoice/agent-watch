/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Sessions (dd1 Tools Edition - v1.0)
 *     - File Name: sessions.mjs
 *     - Relative Path: lib/sessions.mjs
 *     - Artifact Type: library
 *     - Version: 1.0.1
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.1 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
 *       background command launched before the session's Claude Code
 *       process started reads as stopped: a restart ends it without a
 *       notification, and it had been counted as running for good.
 *     - 1.0.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the Sessions view.
 *
 * ✒ Description:
 *     Everything Claude Code is doing on this machine, not only workflow
 *     runs: every terminal session that is open, what each is doing this
 *     second, and what it has done. A session is its own transcript (the
 *     person's prompts, Claude's replies and every tool call), the subagents
 *     it started, the workflow runs it launched and the commands it left
 *     running in the background. It only reads.
 *
 * ✒ Key Features:
 *     - Open sessions from Claude Code's own registry (~/.claude/sessions),
 *       each confirmed against the process list, with the busy or idle
 *       status Claude Code itself writes; closed sessions from transcripts
 *       written in the last 24 hours
 *     - The main thread read with the agent rules (calls paired with
 *       results, tests and commits judged by their output) plus what only a
 *       session holds: prompts, slash commands, finished turns and their
 *       durations, messages queued mid-turn, task notifications, the title,
 *       the permission mode and the cost record
 *     - Subagents from the session's subagents folder, background shells and
 *       workflows from their launch results, each finished by its
 *       notification
 *     - A "now" sentence for each session, with where it came from
 *     - One merged feed across every lane of a session, and one across every
 *       active session on the machine
 *     - Large transcripts read from their last 16 MB, said to be partial
 *
 * ✒ Usage Instructions:
 *     const s = createSessions({ root, collector, health });
 *     await s.list()                          // every open and recent session
 *     await s.view({ session: id, lane: 'all' })   // the page's payload
 *
 * ✒ Examples:
 *     slugFor('C:\\work\\K9')                 // 'C--work-K9'
 *     userKind({ type: 'user', message: { content: 'hi' } })   // { kind: 'prompt', text: 'hi' }
 *     taskNote('<task-id>b1</task-id><status>completed</status>')   // { id: 'b1', status: 'completed', ... }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+; read.mjs, claude.mjs, evidence.mjs,
 *       git.mjs (exec); tasklist on Windows (optional; a signal probe
 *       otherwise)
 *     - Compatible platforms: Windows 11 (primary), macOS, Linux
 *     - Limits: the registry and transcript formats are Claude Code's own
 *       and undocumented; a session started before the registry existed is
 *       seen only through its transcript
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readNewAsync, readJson, parseLine } from './read.mjs';
import { freshAgent, ingestAgentLine, agentStats, feedOf, readMeta, resultText, pushEvent } from './claude.mjs';
import { excerpt, prov } from './evidence.mjs';
import { exec } from './git.mjs';

export const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const LANE_ID = /^(?:all|main|[\w-]{1,64})$/;
/** A closed session stays on the list this long after its transcript was last written. */
export const RECENT_MS = 24 * 3600 * 1000;
/** A closed session written this recently still feeds the machine-wide activity. */
export const ACTIVE_MS = 15 * 60 * 1000;
/** A running subagent with nothing written for this long is marked quiet. */
export const QUIET_MS = 5 * 60 * 1000;
/** A transcript larger than this is read from its last 16 MB. */
export const TAIL_BYTES = 16 << 20;
const PEEK_BYTES = 256 << 10;
const CLOSED_MAX = 30;
const LANE_SENT = 120;
const MERGED_SENT = 160;
const RANGE_SENT = 600;
const MACHINE_SENT = 200;
const PER_LANE_MACHINE = 40;
const IDLE_EVICT_MS = 10 * 60 * 1000;

const mtime = (p) => {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return 0;
  }
};
const dirsOf = (p) => {
  try {
    return fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
};
const filesOf = (p) => {
  try {
    return fs.readdirSync(p);
  } catch {
    return [];
  }
};
const ago = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const tsOf = (o) => (o?.timestamp ? Date.parse(o.timestamp) || null : null);

/* ---------- where sessions are ---------- */

/** The folder name Claude Code gives a working directory: every character not a letter or digit as "-". */
export const slugFor = (cwd) => String(cwd || '').replace(/[^A-Za-z0-9]/g, '-');

/** Claude Code's registry of its own processes: one <pid>.json per terminal it has open, or had. */
export function readRegistry(dir, health = null) {
  const out = [];
  for (const f of filesOf(dir)) {
    const m = /^(\d{1,10})\.json$/.exec(f);
    if (!m) continue;
    const file = path.join(dir, f);
    const o = readJson(file, health, 'registry');
    if (!o || !SESSION_ID.test(String(o.sessionId || ''))) continue;
    const n = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
    out.push({
      pid: n(o.pid) || Number(m[1]),
      sessionId: String(o.sessionId),
      cwd: typeof o.cwd === 'string' ? o.cwd : null,
      startedAt: n(o.startedAt),
      kind: typeof o.kind === 'string' ? o.kind : null,
      name: typeof o.name === 'string' ? excerpt(o.name, 60) : null,
      status: typeof o.status === 'string' ? o.status : null,
      statusAt: n(o.statusUpdatedAt) || n(o.updatedAt),
      version: typeof o.version === 'string' ? o.version : null,
      file,
    });
  }
  return out;
}

/**
 * Which of the pids belong to running Claude Code processes. On Windows one
 * tasklist call, keeping pids whose image is claude, node or bun (a pid the
 * system has given to some other program does not count); elsewhere, or when
 * tasklist gives nothing, a signal-0 probe.
 */
export async function alivePids(pids, { platform = process.platform, execFn = exec, probe = (p) => process.kill(p, 0) } = {}) {
  const want = [...new Set(pids.filter((p) => Number.isInteger(p) && p > 0))];
  if (!want.length) return new Set();
  if (platform === 'win32') {
    const out = await execFn('tasklist', ['/FO', 'CSV', '/NH']);
    if (out) {
      const live = new Set();
      for (const l of out.split('\n')) {
        const m = /^"([^"]*)","(\d+)"/.exec(l.trim());
        if (m && /^(claude|node|bun)(\.exe)?$/i.test(m[1])) live.add(Number(m[2]));
      }
      return new Set(want.filter((p) => live.has(p)));
    }
  }
  return new Set(want.filter((p) => {
    try {
      probe(p);
      return true;
    } catch (err) {
      return err?.code === 'EPERM';
    }
  }));
}

/** A session's transcript: the folder its working directory names first, then every project folder. */
export function transcriptOf(root, id, cwd = null) {
  if (!SESSION_ID.test(String(id || ''))) return null;
  const at = (slug) => {
    const file = path.join(root, slug, `${id}.jsonl`);
    return fs.existsSync(file) ? { slug, file } : null;
  };
  if (cwd) {
    const hit = at(slugFor(cwd));
    if (hit) return hit;
  }
  for (const d of dirsOf(root)) {
    const hit = at(d);
    if (hit) return hit;
  }
  return null;
}

/* ---------- reading a session's lines ---------- */

const textOf = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.filter((b) => b?.type === 'text').map((b) => b.text || '').join('\n') : '');

/**
 * What a user line is: a prompt the person typed, a slash command, a task
 * notification, a system message, or nothing worth a row (tool results, meta
 * lines and command output are handled elsewhere or skipped).
 */
export function userKind(o) {
  if (!o || o.type !== 'user' || o.isMeta || o.isSidechain) return null;
  const c = o.message?.content;
  if (Array.isArray(c) && c.some((b) => b?.type === 'tool_result')) return null;
  const text = textOf(c).trim();
  if (!text) return null;
  if (text.includes('<task-notification>')) return { kind: 'notify', text };
  if (text.startsWith('<command-name>')) return { kind: 'command', text: commandText(text) };
  if (text.startsWith('<bash-input>')) return { kind: 'command', text: `! ${(/<bash-input>([\s\S]*?)<\/bash-input>/.exec(text) || [])[1]?.trim() || ''}` };
  if (/^<(local-command-(stdout|stderr|caveat)|bash-(stdout|stderr)|system-reminder)>/.test(text)) return null;
  if (o.origin && typeof o.origin.kind === 'string' && o.origin.kind !== 'human') return { kind: 'system', text };
  return { kind: 'prompt', text };
}

/** A slash command's wrapper as the person typed it: "/name args". */
export function commandText(text) {
  const g = (tag) => (new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(text) || [])[1]?.trim() || '';
  const name = g('command-name') || g('command-message');
  const args = g('command-args');
  return `${name.startsWith('/') ? name : `/${name}`}${args ? ` ${args}` : ''}`;
}

/** The fields of a task notification: which task, its status and summary. */
export function taskNote(text) {
  const g = (tag) => (new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(String(text || '')) || [])[1]?.trim() || null;
  return { id: g('task-id'), use: g('tool-use-id'), status: g('status'), summary: g('summary'), output: g('output-file') };
}

/** The session's cost record, reduced to what the page shows. */
export function costOf(o) {
  const models = {};
  for (const [k, v] of Object.entries(o?.modelUsage || {})) {
    models[k] = { input: v?.inputTokens || 0, output: v?.outputTokens || 0, cacheRead: v?.cacheReadInputTokens || 0, cacheWrite: v?.cacheCreationInputTokens || 0, usd: typeof v?.costUSD === 'number' ? v.costUSD : null };
  }
  const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return { usd: n(o?.totalCostUSD), apiMs: n(o?.totalAPIDuration), toolMs: n(o?.totalToolDuration), linesAdded: n(o?.totalLinesAdded), linesRemoved: n(o?.totalLinesRemoved), wallMs: n(o?.totalDuration), since: n(o?.startTime), models };
}

export function freshSession(id = '') {
  return Object.assign(freshAgent('main'), {
    sid: id,
    title: null,
    lastPrompt: null,
    prompts: [],
    turns: [],
    permissionMode: null,
    mode: null,
    version: null,
    cost: null,
    models: {},
    hooks: 0,
    hookErrors: 0,
    thinking: 0,
    inTurn: false,
    turnStart: null,
    turnTools: 0,
    turnPrompt: null,
    lastTurnEnd: null,
    bg: new Map(),
    spawns: new Map(),
    skipped: 0,
    skipPartial: false,
  });
}

// Lines no view needs, recognised before they are parsed: request bodies and attachments are most of a transcript's bytes.
const SKIP = /^\{"type":"(?:api-request|attachment|atis-latch|session-owner|tools-used)/;
/** The line filter for a session: skips the partial first line of a tail read, then the heavy kinds. */
export const sessionLineFilter = (st) => (l) => {
  if (st.skipPartial) {
    st.skipPartial = false;
    return false;
  }
  return !SKIP.test(l);
};

const BG_SHELL = /(?:Command running in background with ID|Command was moved to the background \(ID): ([\w-]+)/;
const BG_TASK = /\bTask ID: ([\w-]+)/;
const RUN_ID = /Run ID: (wf_[\w-]+)/;
const SPAWN = /^(Agent|Task|Workflow)$/;
const DONE = { completed: 'ok', failed: 'error', killed: 'error', stopped: 'error' };

function add(st, o, lineNo, kind, text, extra = {}) {
  pushEvent(st, { id: `${st.agentId}#${++st.seq}`, agent: st.agentId, t: tsOf(o), line: lineNo, kind, text, ...extra });
}

/** Folds one line of a session transcript into its state. */
export function ingestSessionLine(st, line, lineNo = null, health = null) {
  const o = parseLine(line, health, 'session');
  if (!o || o.isSidechain) return;
  const ts = tsOf(o);
  if (typeof o.version === 'string') st.version = o.version;
  // Lines the agent rules fold set the times, folder and branch themselves; the rest are set below.
  let folded = false;
  switch (o.type) {
    case 'assistant': {
      ingestAgentLine(st, line, lineNo, health, o);
      folded = true;
      const c = o.message?.content;
      if (o.message?.model) st.models[o.message.model] = (st.models[o.message.model] || 0) + 1;
      if (!Array.isArray(c)) break;
      for (const b of c) {
        if (b?.type === 'thinking' || b?.type === 'redacted_thinking') st.thinking++;
        if (b?.type !== 'tool_use') continue;
        const ev = b.id ? st.pending.get(b.id) : null;
        const input = b.input || {};
        if (ev && SPAWN.test(b.name)) {
          ev.kind = 'spawn';
          st.spawns.set(b.id, { use: b.id, tool: b.name, label: excerpt(input.description || input.name || input.title || ev.text, 160), type: input.subagent_type || null, background: input.run_in_background === true || b.name === 'Workflow', t: ts, ev: ev.id });
        }
        if (ev && input.run_in_background === true) ev.bg = true;
      }
      break;
    }
    case 'user': {
      const c = o.message?.content;
      if (Array.isArray(c) && c.some((b) => b?.type === 'tool_result')) {
        const before = new Map(c.filter((b) => b?.type === 'tool_result').map((b) => [b.tool_use_id, st.pending.get(b.tool_use_id)]));
        ingestAgentLine(st, line, lineNo, health, o);
        folded = true;
        for (const b of c) {
          if (b?.type !== 'tool_result' || b.is_error) continue;
          const ev = before.get(b.tool_use_id);
          const text = resultText(b.content);
          // Claude Code's own launch message is the result's first line. Text that only quotes one
          // (a grep through a transcript, say) launches nothing, and a known task is never reopened.
          const first = text.trimStart().split('\n')[0];
          const shell = BG_SHELL.exec(first);
          const task = /\blaunched\b/i.test(first) ? BG_TASK.exec(first) : null;
          const id = shell?.index === 0 ? shell[1] : task ? task[1] : null;
          if (!id || st.bg.has(id)) continue;
          const run = RUN_ID.exec(text)?.[1] || null;
          const kind = run || ev?.tool === 'Workflow' ? 'workflow' : ev?.tool === 'Bash' || ev?.tool === 'PowerShell' ? 'shell' : String(ev?.tool || 'task').toLowerCase();
          st.bg.set(id, { id, kind, label: ev?.text || id, run, use: b.tool_use_id, started: ev?.t || ts, ended: null, status: 'running', summary: null, of: ev?.id || null });
          if (ev) ev.bgId = id;
        }
        break;
      }
      const u = userKind(o);
      if (!u) break;
      // A notification or system message can open a turn of its own (Claude answers it with no one
      // typing); the turn is named after it rather than after the last prompt.
      if ((u.kind === 'notify' || u.kind === 'system') && !st.inTurn) {
        st.inTurn = true;
        st.turnStart = ts;
        st.turnTools = st.tools;
        st.turnPrompt = u.kind === 'notify' ? `Task notification: ${excerpt(taskNote(u.text).summary || taskNote(u.text).id || '', 200)}` : excerpt(u.text, 200);
      }
      if (u.kind === 'notify') {
        const n = taskNote(u.text);
        const task = n.id ? st.bg.get(n.id) : null;
        if (task) {
          task.status = n.status || 'finished';
          task.ended = ts;
          task.summary = n.summary ? excerpt(n.summary, 240) : null;
        }
        add(st, o, lineNo, 'notify', excerpt(n.summary || `Background task ${n.id || ''} ${n.status || 'finished'}`, 240), { status: DONE[n.status] || null, task: n.id || null });
      } else if (u.kind === 'prompt' || u.kind === 'command') {
        const text = excerpt(u.text, 600);
        st.prompts.push({ t: ts, text, command: u.kind === 'command', line: lineNo });
        if (st.prompts.length > 500) st.prompts.shift();
        st.lastPrompt = excerpt(u.text, 300);
        if (u.kind === 'prompt') {
          st.inTurn = true;
          st.turnStart = ts;
          st.turnTools = st.tools;
          st.turnPrompt = st.lastPrompt;
        }
        add(st, o, lineNo, 'prompt', text, u.kind === 'command' ? { tool: 'command' } : {});
      }
      break;
    }
    case 'system': {
      if (o.subtype === 'turn_duration') {
        const ms = Number.isFinite(Number(o.durationMs)) ? Number(o.durationMs) : (ts && st.turnStart ? ts - st.turnStart : null);
        st.turns.push({ start: st.turnStart || (ts && ms !== null ? ts - ms : null), end: ts, ms, messages: Number.isFinite(o.messageCount) ? o.messageCount : null, tools: st.tools - st.turnTools, prompt: st.turnPrompt });
        if (st.turns.length > 500) st.turns.shift();
        st.inTurn = false;
        st.lastTurnEnd = ts;
        add(st, o, lineNo, 'turn', `Turn finished${st.turns.at(-1).tools ? `, ${plural(st.turns.at(-1).tools, 'tool call')}` : ''}`, { status: 'ok', ms });
      } else if (o.subtype === 'stop_hook_summary') {
        st.hooks += Number(o.hookCount) || 0;
        st.hookErrors += Array.isArray(o.hookErrors) ? o.hookErrors.length : 0;
      } else if (o.level === 'error' || /error/i.test(String(o.subtype || ''))) {
        st.errors++;
        add(st, o, lineNo, 'error', excerpt(textOf(o.content) || o.subtype || 'An error', 240));
      } else if (o.subtype === 'compact_boundary') {
        add(st, o, lineNo, 'notify', 'The conversation was compacted to free context');
      } else if (o.subtype === 'informational' && o.content) {
        add(st, o, lineNo, 'notify', excerpt(textOf(o.content), 240));
      }
      break;
    }
    case 'ai-title':
      if (o.aiTitle) st.title = excerpt(o.aiTitle, 160);
      break;
    case 'last-prompt':
      if (o.lastPrompt) st.lastPrompt = excerpt(o.lastPrompt, 300);
      break;
    case 'permission-mode':
      if (o.permissionMode) st.permissionMode = String(o.permissionMode);
      break;
    case 'mode':
      if (o.mode) st.mode = String(o.mode);
      break;
    case 'cost-state':
      // The record carries no time of its own, and Claude Code writes it now and then rather than
      // live; it is dated by the newest line read before it, so the page can say how old it is.
      st.cost = { ...costOf(o), at: st.last || null };
      break;
    case 'queue-operation':
      if (o.operation === 'enqueue' && typeof o.content === 'string' && o.content.trim() && !o.content.includes('<task-notification>')) {
        add(st, o, lineNo, 'queue', excerpt(o.content, 240));
      }
      break;
    default:
      break;
  }
  if (!folded) {
    if (typeof o.cwd === 'string') st.cwd = o.cwd;
    if (typeof o.gitBranch === 'string') st.gitBranch = o.gitBranch;
    if (ts) {
      if (!st.first) st.first = ts;
      st.last = Math.max(st.last || 0, ts);
    }
  }
}

/**
 * What the end of a transcript says, from its last 256 KB: title, last
 * prompt, whether a turn is open, branch, cwd and the newest time written.
 */
export function peek(file) {
  let fd;
  let text = '';
  let size = 0;
  try {
    size = fs.statSync(file).size;
    const from = Math.max(0, size - PEEK_BYTES);
    fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(size - from);
    const n = fs.readSync(fd, buf, 0, buf.length, from);
    text = buf.toString('utf8', 0, n);
    if (from > 0) text = text.slice(text.indexOf('\n') + 1);
  } catch {
    return null;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
  const out = { title: null, lastPrompt: null, promptAt: null, turnEndAt: null, cwd: null, gitBranch: null, version: null, last: null, size };
  for (const l of text.split('\n')) {
    if (!l || SKIP.test(l)) continue;
    let o;
    try {
      o = JSON.parse(l);
    } catch {
      continue;
    }
    const ts = tsOf(o);
    if (ts) out.last = Math.max(out.last || 0, ts);
    if (typeof o.cwd === 'string') out.cwd = o.cwd;
    if (typeof o.gitBranch === 'string') out.gitBranch = o.gitBranch;
    if (typeof o.version === 'string') out.version = o.version;
    if (o.type === 'ai-title' && o.aiTitle) out.title = excerpt(o.aiTitle, 160);
    else if (o.type === 'last-prompt' && o.lastPrompt) out.lastPrompt = excerpt(o.lastPrompt, 300);
    else if (o.type === 'system' && o.subtype === 'turn_duration') out.turnEndAt = ts;
    else if (o.type === 'user') {
      const u = userKind(o);
      if (u?.kind === 'prompt') {
        out.promptAt = ts;
        out.lastPrompt = excerpt(u.text, 300);
      }
    }
  }
  out.inTurn = !!out.promptAt && (!out.turnEndAt || out.promptAt > out.turnEndAt);
  return out;
}

const metas = new Map();
/** The subagents a session started: <session>/subagents/agent-<id>.meta.json beside each transcript. */
export function subagentsOf(dir, health = null) {
  const out = [];
  for (const f of filesOf(dir)) {
    const m = /^agent-([\w-]+)\.meta\.json$/.exec(f);
    if (!m) continue;
    const file = path.join(dir, f);
    const born = mtime(file);
    // A meta file is rewritten when its agent finishes, so it is read again only when it changes.
    const key = `${file}:${born}`;
    let meta = metas.get(key);
    if (meta === undefined) {
      meta = readMeta(file, health);
      metas.set(key, meta);
      if (metas.size > 2000) metas.delete(metas.keys().next().value);
    }
    if (!meta) continue;
    out.push({ id: m[1], meta, born, file: path.join(dir, `agent-${m[1]}.jsonl`) });
  }
  return out.sort((a, b) => a.born - b.born);
}

/* ---------- the service's view of sessions ---------- */

export function createSessions({ root, home = os.homedir(), registryDir = null, collector = null, health = null, execFn = exec, platform = process.platform, probe, now = () => Date.now() } = {}) {
  const regDir = registryDir || path.join(home, '.claude', 'sessions');
  const states = new Map();
  const agents = new Map();
  const peeks = new Map();
  let aliveCache = { at: 0, key: '', value: new Set() };
  let listCache = { at: 0, value: null };

  async function alive(pids) {
    const key = [...pids].sort((a, b) => a - b).join(',');
    if (aliveCache.key === key && now() - aliveCache.at < 4000) return aliveCache.value;
    const value = await alivePids(pids, { platform, execFn, ...(probe ? { probe } : {}) });
    aliveCache = { at: now(), key, value };
    return value;
  }

  function peekOf(file) {
    let st;
    try {
      st = fs.statSync(file);
    } catch {
      return null;
    }
    const sig = `${st.size}:${st.mtimeMs}`;
    const hit = peeks.get(file);
    if (hit && hit.sig === sig) return hit.value;
    const value = peek(file);
    peeks.set(file, { sig, value });
    if (peeks.size > 300) peeks.delete(peeks.keys().next().value);
    return value;
  }

  /** How many subagents and workflow runs a session has, and how many are going, without reading their transcripts. */
  function counts(slug, id, open) {
    const t = now();
    const subs = subagentsOf(path.join(root, slug, id, 'subagents'));
    const subRunning = open ? subs.filter((a) => a.meta.finished !== true && t - (mtime(a.file) || a.born) < QUIET_MS).length : 0;
    const wfDir = path.join(root, slug, id, 'subagents', 'workflows');
    const runs = dirsOf(wfDir).filter((r) => /^wf_[\w-]{4,64}$/.test(r));
    const runRunning = runs.filter((r) => !fs.existsSync(path.join(root, slug, id, 'workflows', `${r}.json`)) && t - (mtime(path.join(wfDir, r, 'journal.jsonl')) || mtime(path.join(wfDir, r))) < 30 * 60 * 1000).length;
    return { subagents: subs.length, subagentsRunning: subRunning, workflows: runs.length, workflowsRunning: runRunning };
  }

  function summarize(e) {
    const t = now();
    const pk = e.file ? peekOf(e.file) : null;
    const written = e.file ? mtime(e.file) : 0;
    const cwd = e.cwd || pk?.cwd || null;
    let state;
    let why;
    if (e.open) {
      const said = e.regStatus;
      state = said === 'busy' ? 'working' : said === 'idle' ? 'waiting' : said ? said : pk?.inTurn ? 'working' : 'waiting';
      why = said
        ? prov('session-registry', [e.registry], `Claude Code wrote "${said}" for process ${e.pid} ${ago(t - (e.statusAt || written || t))} ago, and the process is running`)
        : prov('inferred-activity', [e.file], `the process is running and its registry entry gives no status, so this is read from the transcript: ${pk?.inTurn ? 'a prompt with no finished turn after it' : 'the last turn has finished'}`, 'partial');
    } else {
      state = 'closed';
      why = prov('process', [e.file], `no running Claude Code process holds this session; its transcript was last written ${ago(t - written)} ago`);
    }
    return {
      id: e.id,
      short: e.id.slice(0, 8),
      open: e.open,
      pid: e.pid || null,
      name: e.name || null,
      kind: e.kind || null,
      slug: e.slug,
      project: cwd ? path.basename(cwd) || cwd : e.slug.split('-').filter(Boolean).pop() || e.slug,
      cwd,
      title: pk?.title || null,
      lastPrompt: pk?.lastPrompt || null,
      state,
      why,
      inTurn: !!pk?.inTurn,
      // A closed session's last activity is the newest time written inside it: a sync client
      // (OneDrive) can touch a file's modified time long after the session ended.
      last: (e.open ? Math.max(written || 0, e.statusAt || 0) : pk?.last || written) || null,
      started: e.startedAt || null,
      statusAt: e.statusAt || null,
      branch: pk?.gitBranch && pk.gitBranch !== 'HEAD' ? pk.gitBranch : null,
      version: e.version || pk?.version || null,
      bytes: pk?.size || 0,
      file: e.file || null,
      ...(e.file || e.open ? counts(e.slug, e.id, e.open) : { subagents: 0, subagentsRunning: 0, workflows: 0, workflowsRunning: 0 }),
    };
  }

  /** Every open session, then the closed ones written in the last day, newest first. */
  async function list({ fresh = false } = {}) {
    if (!fresh && listCache.value && now() - listCache.at < 1500) return listCache.value;
    const t = now();
    const reg = readRegistry(regDir, health);
    const live = await alive(reg.map((r) => r.pid));
    const byId = new Map();
    for (const r of reg.sort((a, b) => (b.statusAt || 0) - (a.statusAt || 0))) {
      if (!live.has(r.pid) || byId.has(r.sessionId)) continue;
      const tr = transcriptOf(root, r.sessionId, r.cwd);
      byId.set(r.sessionId, { id: r.sessionId, open: true, pid: r.pid, name: r.name, kind: r.kind, regStatus: r.status, statusAt: r.statusAt, startedAt: r.startedAt, version: r.version, cwd: r.cwd, slug: tr?.slug || slugFor(r.cwd), file: tr?.file || null, registry: r.file });
    }
    const closed = [];
    for (const d of dirsOf(root)) {
      if (!/^[\w.-]{1,200}$/.test(d)) continue;
      for (const f of filesOf(path.join(root, d))) {
        if (!f.endsWith('.jsonl')) continue;
        const id = f.slice(0, -6);
        if (!SESSION_ID.test(id) || byId.has(id)) continue;
        const file = path.join(root, d, f);
        const m = mtime(file);
        if (t - m <= RECENT_MS) closed.push({ id, open: false, slug: d, file, m });
      }
    }
    closed.sort((a, b) => b.m - a.m);
    for (const c of closed.slice(0, CLOSED_MAX)) byId.set(c.id, c);
    const rank = { working: 0, waiting: 1 };
    const value = [...byId.values()].map(summarize).filter((s) => s.open || !s.last || t - s.last <= RECENT_MS).sort((a, b) => (a.open === b.open ? 0 : a.open ? -1 : 1) || ((rank[a.state] ?? 2) - (rank[b.state] ?? 2)) || (b.last || 0) - (a.last || 0));
    listCache = { at: t, value };
    return value;
  }

  /** A session's state, read on from where the last read stopped; a large transcript starts at its last 16 MB. */
  async function sessionState(file, id) {
    let st = states.get(file);
    if (!st) {
      st = freshSession(id);
      st.reset = () => {
        const keep = st.reset;
        Object.assign(st, freshSession(id), { reset: keep });
      };
      states.set(file, st);
    }
    st.used = now();
    if (!st.offset) {
      const size = (() => {
        try {
          return fs.statSync(file).size;
        } catch {
          return 0;
        }
      })();
      if (size > TAIL_BYTES) {
        st.offset = size - TAIL_BYTES;
        st.skipped = st.offset;
        st.skipPartial = true;
      }
    }
    await readNewAsync(file, st, (l, no) => ingestSessionLine(st, l, no, health), sessionLineFilter(st), health, 'session', 0);
    return st;
  }

  async function agentState(file, id) {
    let st = agents.get(file);
    if (!st) {
      st = freshAgent(id);
      st.reset = () => {
        const keep = st.reset;
        Object.assign(st, freshAgent(id), { reset: keep });
      };
      agents.set(file, st);
    }
    st.used = now();
    await readNewAsync(file, st, (l, no) => ingestAgentLine(st, l, no, health), null, health, 'transcript', 0);
    return st;
  }

  function evict() {
    const cutoff = now() - IDLE_EVICT_MS;
    for (const [k, st] of states) if ((st.used || 0) < cutoff) states.delete(k);
    for (const [k, st] of agents) if ((st.used || 0) < cutoff) agents.delete(k);
  }

  /** A session's subagents as lanes, each with its state read. */
  async function lanesOf(s, st) {
    const t = now();
    const out = [];
    for (const a of subagentsOf(path.join(root, s.slug, s.id, 'subagents'), health)) {
      const ast = await agentState(a.file, a.id);
      const last = ast.last || mtime(a.file) || a.born;
      const finished = a.meta.finished === true;
      const quiet = !finished && s.open && t - last > QUIET_MS;
      const status = finished ? 'done' : s.open ? 'running' : 'stopped';
      const spawn = a.meta.toolUseId ? st.spawns.get(a.meta.toolUseId) : null;
      out.push({
        id: a.id,
        label: excerpt(a.meta.description || spawn?.label || a.id, 120),
        type: a.meta.agentType || spawn?.type || null,
        model: a.meta.pickedEffortModel || ast.model || null,
        background: a.meta.requestShape === 'background' || !!spawn?.background,
        status,
        quiet,
        why: finished ? prov('agent-meta', [path.join(path.dirname(a.file), `agent-${a.id}.meta.json`)], 'its meta file says it finished')
          : s.open ? prov('inferred-activity', [a.file], `not marked finished; its transcript was last written ${ago(t - last)} ago${quiet ? ', over five minutes, so it is marked quiet' : ''}`, 'partial')
            : prov('inferred-stale', [a.file], 'not marked finished, and the session that started it is closed', 'partial'),
        started: ast.first || a.born,
        last,
        stats: agentStats(ast),
        latest: ast.events.length ? (({ kind, tool, text, t: at }) => ({ kind, tool, text, t: at }))(ast.events.at(-1)) : null,
        st: ast,
        spawnEvent: spawn?.ev || null,
      });
    }
    // Two agents can share a description; later ones are numbered in the order they started.
    const seen = new Map();
    for (const l of out) {
      const n = (seen.get(l.label) || 0) + 1;
      seen.set(l.label, n);
      if (n > 1) l.label = `${l.label} #${n}`;
    }
    return out;
  }

  /** The runs this session launched, as the collector describes them. */
  function runsOf(s) {
    if (!collector) return [];
    try {
      return collector.runsOf(s.slug).filter((r) => r.session === s.id).map((rn) => {
        const d = collector.describe(rn, false);
        return { id: d.id, title: d.title, name: d.name, status: d.status, why: d.why, started: d.started, last: d.last, agents: d.agents.length, done: d.agents.filter((a) => a.status === 'done').length, running: d.agents.filter((a) => a.status === 'running').length };
      });
    } catch (err) {
      health?.fail('session-runs', s.file, err);
      return [];
    }
  }

  /** What the session is doing this second, as one sentence with where it came from. */
  function nowOf(s, st, lanes, bg) {
    const going = lanes.filter((l) => l.status === 'running').length;
    const bgGoing = bg.filter((b) => b.status === 'running').length;
    const extras = [going ? plural(going, 'agent') + ' working' : null, bgGoing ? `${plural(bgGoing, 'background task')} running` : null].filter(Boolean);
    const tail = extras.length ? ` · ${extras.join(' · ')}` : '';
    if (!s.open) return { state: 'closed', text: `Closed${st.last ? `, last active ${ago(now() - st.last)} ago` : ''}`, since: st.last, why: s.why };
    // A call older than the last finished turn was cut off (an interrupt leaves no result); it is not open.
    const open = [...st.pending.values()].filter((e) => !e.bg && (e.t || 0) >= (st.lastTurnEnd || 0)).sort((a, b) => (b.t || 0) - (a.t || 0))[0];
    if (open && s.state === 'waiting') {
      return { state: 'blocked', text: `${open.tool} has no result yet while Claude Code reports idle: it may be waiting for your approval`, since: open.t, tool: open.tool, detail: open.text, why: prov('inferred-activity', [s.file], 'a tool call without a result while the registry says idle', 'partial') };
    }
    if (open) {
      const spawn = open.kind === 'spawn';
      return { state: spawn ? 'agent' : 'tool', text: spawn ? `Waiting on ${open.tool === 'Workflow' ? 'a workflow' : 'an agent'}: ${open.text}${tail}` : `Running ${open.tool}: ${open.text}${tail}`, since: open.t, tool: open.tool, detail: open.text, why: prov('tool-use', [s.file], 'the newest tool call in the session with no result yet') };
    }
    if (s.state === 'working') return { state: 'thinking', text: `Thinking and writing${tail}`, since: st.turnStart || st.last, why: s.why };
    return { state: 'waiting', text: `Waiting for you${tail}`, since: st.lastTurnEnd || s.statusAt || st.last, why: s.why };
  }

  const pickEvent = (e, lane, label) => ({ id: e.id, t: e.t, kind: e.kind, tool: e.tool, text: e.text, status: e.status, ms: e.ms, outcome: e.outcome, of: e.of, line: e.line, lane, laneLabel: label });

  /** A session in full for the page: hero, lanes, feed, runs, background tasks, turns. */
  async function detail(s, { lane = 'all', from = null, to = null } = {}) {
    if (!s.file) return { session: s, empty: true, lanes: [], feed: [], runs: [], background: [], turns: [], now: nowOf(s, freshSession(s.id), [], []) };
    const st = await sessionState(s.file, s.id);
    const lanes = await lanesOf(s, st);
    // A command still marked running has stopped once its session is closed, or when it began
    // before the session's current Claude Code process did: a restart ends it without a notice.
    const ended = (b) => !s.open || (s.started && (b.started || 0) < s.started);
    const bg = [...st.bg.values()].map((b) => ({ ...b, status: b.status === 'running' && ended(b) ? 'stopped' : b.status })).sort((a, b) => (b.started || 0) - (a.started || 0));
    const runs = runsOf(s);
    // A workflow's background task is the run; its notification finishes it.
    for (const b of bg) if (b.kind === 'workflow' && !b.run) b.run = runs.find((r) => Math.abs((r.started || 0) - (b.started || 0)) < 120000)?.id || null;
    const pool = [{ id: 'main', label: 'Main thread', st }, ...lanes.map((l) => ({ id: l.id, label: l.label, st: l.st }))];
    const ranged = from !== null || to !== null;
    const inRange = (e) => (from === null || (e.t || 0) >= from) && (to === null || (e.t || 0) <= to);
    let feed;
    const picked = lane === 'all' ? pool : pool.filter((p) => p.id === lane);
    // A lane that is gone (an agent's files removed) falls back to every lane rather than an empty feed.
    const want = picked.length ? picked : pool;
    if (ranged) feed = want.flatMap((p) => p.st.events.filter(inRange).map((e) => pickEvent(e, p.id, p.label))).sort((a, b) => (a.t || 0) - (b.t || 0)).slice(-RANGE_SENT);
    else if (want.length === 1) feed = feedOf(want[0].st, LANE_SENT).map((e) => ({ ...e, lane: want[0].id, laneLabel: want[0].label }));
    else feed = want.flatMap((p) => p.st.events.slice(-LANE_SENT).map((e) => pickEvent(e, p.id, p.label))).sort((a, b) => (a.t || 0) - (b.t || 0)).slice(-MERGED_SENT);
    const stats = agentStats(st);
    const turns = st.turns.slice(-40).reverse();
    const open = st.inTurn && s.open ? { start: st.turnStart, end: null, ms: null, tools: st.tools - st.turnTools, prompt: st.turnPrompt, open: true } : null;
    return {
      session: { ...s, title: st.title || s.title, lastPrompt: st.lastPrompt || s.lastPrompt, branch: st.gitBranch || s.branch, cwd: st.cwd || s.cwd, model: st.model, models: st.models, permissionMode: st.permissionMode, mode: st.mode, version: st.version || s.version, first: st.first, prompts: st.prompts.length, thinking: st.thinking, hooks: st.hooks, hookErrors: st.hookErrors, partial: st.skipped ? { skippedBytes: st.skipped, why: prov('session', [s.file], `the transcript is over 16 MB, so it was read from its last 16 MB; ${Math.round(st.skipped / 1048576)} MB before that were not read`, 'partial') } : null },
      stats,
      cost: st.cost ? { ...st.cost, why: prov('cost-state', [s.file], `the last cost record Claude Code wrote${st.cost.at ? `, near ${new Date(st.cost.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}; it writes one now and then rather than live, so it can trail the work, and a resumed session counts from the resume`, 'partial') } : null,
      now: nowOf(s, st, lanes, bg),
      lanes: lanes.map(({ st: _st, ...l }) => l),
      lane: picked.length ? lane : 'all',
      feed,
      ranged,
      runs,
      background: bg.slice(0, 30),
      turns: open ? [open, ...turns] : turns,
    };
  }

  /** The newest events of every active session on the machine, newest first. */
  async function machine(sessions, limit = MACHINE_SENT) {
    const t = now();
    const active = sessions.filter((s) => s.file && (s.open || (s.last && t - s.last < ACTIVE_MS)));
    const out = [];
    for (const s of active) {
      const st = await sessionState(s.file, s.id);
      const lanes = await lanesOf(s, st);
      const tag = { session: s.id, sessionLabel: `${s.project}${s.name ? ` · ${s.name}` : ''}` };
      for (const e of st.events.slice(-PER_LANE_MACHINE)) out.push({ ...pickEvent(e, 'main', 'Main thread'), id: `${s.short}:${e.id}`, ...tag });
      for (const l of lanes) for (const e of l.st.events.slice(-PER_LANE_MACHINE)) out.push({ ...pickEvent(e, l.id, l.label), id: `${s.short}:${e.id}`, ...tag });
    }
    return out.sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, limit);
  }

  return {
    list,
    detail,
    machine,
    sessionState,
    /** The page's payload: the list, the session in focus and, for the machine scope, everything. */
    async view({ session = null, lane = 'all', scope = 'session', from = null, to = null, closed = true } = {}) {
      const all = await list();
      const sessions = closed ? all : all.filter((s) => s.open);
      // Following: the open session most recently working, else the most recently active.
      const follow = all.find((s) => s.open && s.state === 'working') || all.find((s) => s.open) || all[0] || null;
      let focus = session ? all.find((s) => s.id === session) || null : follow;
      if (session && !focus) {
        const tr = transcriptOf(root, session);
        if (tr) focus = summarize({ id: session, open: false, slug: tr.slug, file: tr.file });
      }
      const d = focus ? await detail(focus, { lane: LANE_ID.test(lane || '') ? lane : 'all', from, to }) : null;
      const everything = scope === 'machine' ? await machine(all) : null;
      evict();
      return {
        now: now(),
        sessions,
        counts: { open: all.filter((s) => s.open).length, working: all.filter((s) => s.state === 'working').length, closed: all.filter((s) => !s.open).length },
        following: !session,
        focus: focus?.id || null,
        detail: d,
        machine: everything,
        why: prov('session-registry', [regDir], 'open sessions from Claude Code\'s registry, each checked against the process list; closed ones from transcripts written in the last 24 hours'),
      };
    },
  };
}
