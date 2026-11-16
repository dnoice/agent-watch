#!/usr/bin/env node
/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch (dd1 Tools Edition - v1.12)
 *     - File Name: agent-watch.mjs
 *     - Relative Path: agent-watch.mjs
 *     - Artifact Type: CLI
 *     - Version: 1.12.1
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.12.1 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.12.1, its own public repository: the examples name a generic
 *       project, and the state folder is given for every platform.
 *     - 1.12.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.12.0, the Sessions view: every Claude Code session on the machine,
 *       not only workflow runs, as Dennis asked. The sessions command prints
 *       them in the terminal, status adds what the open sessions are doing,
 *       and --project takes a project that has not run a workflow yet.
 *     - 1.11.4 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.11.4.
 *     - 1.11.3 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.11.3.
 *     - 1.11.2 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.11.2.
 *     - 1.11.1 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.11.1.
 *     - 1.11.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.11.0, the Insights tab.
 *     - 1.10.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.10.0, the other eight views' pass.
 *     - 1.9.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.9.0, the Live view's pass.
 *     - 1.8.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.8.0, the header from Dennis's review.
 *     - 1.7.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Version
 *       1.7.0, the release that puts Dennis's logo in the header.
 *     - 1.6.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage F:
 *       handoff (--run, --format, --out) and criteria (--workflow). VERSION
 *       1.6.0.
 *     - 1.5.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage E:
 *       tests, comparison and files. VERSION 1.5.0; the command line is
 *       unchanged.
 *     - 1.4.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage D:
 *       notices; --quiet-alert and --no-watch for start and serve, which
 *       start forwards to the service. VERSION 1.4.0.
 *     - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage C:
 *       the Investigate view's release. VERSION 1.3.0; the command line is
 *       unchanged.
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage B:
 *       the archive. index, runs and search; --status; --project takes a
 *       folder's name too; serve keeps the archive in the state folder.
 *       VERSION 1.2.0.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage A
 *       of the audit's roadmap: the state it serves now carries where each
 *       figure came from, tool calls paired with their results, and test
 *       outcomes. VERSION 1.1.0.
 *     - 1.0.0 (11/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version.
 *
 * ✒ Description:
 *     Follows Claude Code live: every terminal session on the machine, what
 *     it is doing this second, its subagents and background tasks, and the
 *     workflow runs it starts, with each run's phases, agents, tool calls,
 *     the branch's commits, the latest test logs and the machine's load. This file is the command line: it serves the page in the
 *     foreground or the background, stops it, and reports in the terminal.
 *
 * ✒ Key Features:
 *     - serve: run the page in this terminal until Ctrl+C
 *     - start and stop: the same in the background, stopped by a token kept
 *       in the state folder, never by killing a process id
 *     - status: the service's address, the open sessions and the current run
 *       in the terminal, phase by phase, with the running agent's last actions
 *     - sessions: every Claude Code session open on the machine and those
 *       closed in the last day, what each is doing, and the newest actions of
 *       the one most recently working
 *     - projects: the Claude projects that hold workflow runs, newest first
 *     - index, runs and search: the archive of every run of a project, built
 *       once and kept in the state folder, listed and searched in the terminal
 *     - handoff: a run against its workflow's completion criteria, as a
 *       Markdown or JSON report; criteria writes a starter set to edit
 *     - notices: what the service's watchpoints noticed, newest first; the
 *       service watches every project while it runs (--no-watch turns it off,
 *       --quiet-alert sets the minutes before a quiet agent is noticed)
 *     - --project takes a slug, the project's own folder path or its name,
 *       including a project that has not run a workflow yet
 *     - Zero dependencies: Node's own modules only
 *
 * ✒ Usage Instructions:
 *     node agent-watch.mjs start            then open http://127.0.0.1:4300/
 *     node agent-watch.mjs status
 *     node agent-watch.mjs stop
 *     npm start, npm stop and npm test run the same from this folder;
 *     in the dd1 tools collection, digi agent-watch start, and so on.
 *
 * ✒ Examples:
 *     node agent-watch.mjs serve --port 4310
 *     node agent-watch.mjs start --project "C:\work\my-project"
 *     node agent-watch.mjs start --open
 *     node agent-watch.mjs status --lines 8
 *     node agent-watch.mjs sessions
 *     node agent-watch.mjs projects
 *     node agent-watch.mjs index --project my-project
 *     node agent-watch.mjs runs --status killed
 *     node agent-watch.mjs search file:shader.js status:completed
 *
 * ✒ Command-Line Arguments:
 *     Commands:
 *         serve | start | stop | status | sessions | projects | index | runs
 *         | search <words> | notices | handoff | criteria
 *     Input:
 *         --project <slug|path>  The project to open on (default: the one
 *                                with the newest workflow activity)
 *         --root <dir>           Claude's projects folder
 *                                (default ~/.claude/projects)
 *     Output:
 *         --port <n>             Port on 127.0.0.1 (default 4300)
 *         --open                 Open the page in the default browser
 *         --lines <n>            status, sessions: how many recent actions
 *                                (default 5);
 *                                runs and search: how many runs (default 20)
 *         --status <name>        runs: only runs with this status
 *     Handoff (handoff, criteria):
 *         --run <wf_id>          handoff: the run (default: the current run)
 *         --format md|json       handoff: the report's form (default md)
 *         --out <file>           handoff: write the report there, not to the
 *                                terminal
 *         --workflow <name>      criteria: the workflow (default: the current
 *                                run's)
 *     Watchpoints (serve, start):
 *         --quiet-alert <min>    Minutes an agent may write nothing before it
 *                                is noticed (default 10; 0 turns it off)
 *         --no-watch             Raise no notices at all
 *     Other:
 *         --help, --version
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+; git and netstat on PATH for the commits
 *       and the test ports (optional)
 *     - Compatible platforms: Windows 11 (primary); macOS and Linux
 *     - State: %LOCALAPPDATA%\agent-watch on Windows, ~/.local/state/
 *       agent-watch elsewhere, or AGENT_WATCH_STATE (state.json with the
 *       pid, port and stop token; agent-watch.log), outside the checkout
 *     - Security: listens on 127.0.0.1 only and checks the Host header; it
 *       reads Claude's transcripts, which hold prompts and tool output
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startServer } from './lib/server.mjs';
import { listProjects, listAllProjects, createCollector } from './lib/collect.mjs';
import { createSessions } from './lib/sessions.mjs';
import { createArchive } from './lib/archive.mjs';
import { createHealth } from './lib/read.mjs';
import { incidents } from './lib/investigate.mjs';
import { casesOf } from './lib/compare.mjs';
import { fileMap } from './lib/files.mjs';
import { loadCriteria, evaluate, report, writeStarter, TYPES } from './lib/handoff.mjs';

export const VERSION = '1.12.1';
const SELF = fileURLToPath(import.meta.url);
const STATE_DIR = process.env.AGENT_WATCH_STATE
  || (process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'agent-watch')
    : path.join(os.homedir(), '.local', 'state', 'agent-watch'));
const STATE = path.join(STATE_DIR, 'state.json');
const LOG = path.join(STATE_DIR, 'agent-watch.log');

const HELP = `
  agent-watch ${VERSION}: follow Claude Code live in a local page: every terminal
  session on this machine, its agents and background tasks, and its workflow runs.

  Usage: node agent-watch.mjs <command> [options]

  Commands
    serve       Run the page in this terminal until Ctrl+C
    start       Run it in the background and print its address
    stop        Stop the background service
    status      The service's address, the open sessions and the current run
    sessions    Every Claude Code session open on this machine and those closed
                in the last day: what each is doing, its agents and workflows
    projects    The Claude projects that hold workflow runs, newest first
    index       Build or bring up to date a project's archive of every run
    runs        Every run of a project from its archive, newest first
    search      Runs whose title, commands, files, tests, commits or errors
                hold every word given; field:value narrows (status, workflow,
                branch, agent, file, test, cmd, commit, error)
    notices     What the watchpoints noticed: runs finishing, errors, failing
                tests, quiet agents, newest first
    handoff     A run against its workflow's completion criteria, as a report
    criteria    Where a workflow's criteria are kept; writes a starter set to
                edit when there is none

  Options
    --project <slug|path|name>  The project (default: newest activity)
    --root <dir>            Claude's projects folder (default ~/.claude/projects)
    --port <n>              Port on 127.0.0.1 (default 4300)
    --open                  Open the page in the default browser
    --lines <n>             status, sessions: recent actions (default 5); runs, search:
                            how many runs (default 20)
    --status <name>         runs: only runs with this status
    --quiet-alert <min>     serve, start: minutes before a quiet agent is
                            noticed (default 10; 0 turns it off)
    --no-watch              serve, start: raise no notices
    --run <wf_id>           handoff: the run (default: the current run)
    --format md|json        handoff: the report's form (default md)
    --out <file>            handoff: write the report to a file
    --workflow <name>       criteria: the workflow (default: the current run's)
    --help, --version
`;

function parseArgs(argv) {
  const out = { cmd: null, port: 4300, project: null, root: path.join(os.homedir(), '.claude', 'projects'), open: false, lines: null, status: null, words: [], quietAlert: null, watch: true, run: null, format: 'md', out: null, workflow: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value.`);
      return v;
    };
    if (a === '--help' || a === '-h') out.cmd = 'help';
    else if (a === '--version' || a === '-v') out.cmd = 'version';
    else if (a === '--port') out.port = Number(val());
    else if (a === '--project') out.project = val();
    else if (a === '--root') out.root = path.resolve(val());
    else if (a === '--lines') out.lines = Number(val());
    else if (a === '--open') out.open = true;
    else if (a === '--status') out.status = val();
    else if (a === '--quiet-alert') out.quietAlert = Number(val());
    else if (a === '--no-watch') out.watch = false;
    else if (a === '--run') out.run = val();
    else if (a === '--format') out.format = val();
    else if (a === '--out') out.out = path.resolve(val());
    else if (a === '--workflow') out.workflow = val();
    else if (a.startsWith('-')) throw new Error(`Unknown option ${a}. See --help.`);
    else if (!out.cmd) out.cmd = a;
    else if (out.cmd === 'search') out.words.push(a);
    else throw new Error(`Unexpected argument ${a}. See --help.`);
  }
  if (!Number.isInteger(out.port) || out.port < 1 || out.port > 65535) throw new Error('--port takes a whole number from 1 to 65535.');
  if (out.lines !== null && (!Number.isInteger(out.lines) || out.lines < 0 || out.lines > 200)) throw new Error('--lines takes a whole number from 0 to 200.');
  if (out.quietAlert !== null && (!Number.isInteger(out.quietAlert) || out.quietAlert < 0 || out.quietAlert > 1440)) throw new Error('--quiet-alert takes a whole number of minutes from 0 to 1440.');
  if (out.run !== null && !/^wf_[\w-]{4,64}$/.test(out.run)) throw new Error('--run takes a run id such as wf_1a2b3c4d.');
  if (!['md', 'json'].includes(out.format)) throw new Error('--format takes md or json.');
  if (out.workflow !== null && !/^[\w. -]{1,100}$/.test(out.workflow)) throw new Error('--workflow takes a workflow name.');
  if (out.status !== null && !/^[a-z]{3,20}$/.test(out.status)) throw new Error('--status takes a status such as completed, killed, unfinished or running.');
  return out;
}

/** A project given as a slug, its folder path or its folder's name, matched against what exists. */
export function resolveProject(root, given) {
  if (!given) return null;
  const asSlug = given.replace(/[:\\/]/g, '-');
  const match = (projects) => {
    const byName = projects.filter((p) => p.name.toLowerCase() === given.toLowerCase());
    return projects.find((p) => p.slug === given) || projects.find((p) => p.slug.toLowerCase() === asSlug.toLowerCase()) || (byName.length === 1 ? byName[0] : null);
  };
  // A project that has sessions but has not run a workflow yet is still a project: its Sessions
  // view works now, and its runs appear as soon as one starts.
  const hit = match(listProjects(root)) || match(listAllProjects(root));
  if (!hit) throw new Error(`No Claude project matches "${given}". Run projects to list them.`);
  return hit.slug;
}

const readState = () => {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return null;
  }
};

function request(port, pathname, { method = 'GET', headers = {}, timeout = 2500 } = {}) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, path: pathname, method, headers, timeout }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function health(port) {
  const r = await request(port, '/api/health');
  if (!r || r.status !== 200) return null;
  try {
    return JSON.parse(r.body);
  } catch {
    return null;
  }
}

function openPage(url) {
  if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', url], { windowsHide: true });
  else execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [url]);
}

/** MM/DD/YYYY h:mm AM, the house form for a date a person reads. */
export function stamp(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  const h = d.getHours() % 12 || 12;
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()} ${h}:${p(d.getMinutes())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
}

const ago = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
};

async function serve(opts) {
  const project = resolveProject(opts.root, opts.project);
  const token = process.env.AGENT_WATCH_TOKEN || crypto.randomBytes(24).toString('base64url');
  const s = await startServer({ port: opts.port, root: opts.root, project, token, version: VERSION, onStop: () => finish(0), stateDir: STATE_DIR, watch: opts.watch, rules: opts.quietAlert === null ? {} : { quiet: opts.quietAlert > 0, quietMinutes: opts.quietAlert } });
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE, JSON.stringify({ pid: process.pid, port: s.port, token, project, started: Date.now(), log: LOG }, null, 2));
  const finish = (code) => {
    const st = readState();
    if (st && st.pid === process.pid) fs.rmSync(STATE, { force: true });
    process.exit(code);
  };
  process.on('SIGINT', () => s.close().then(() => finish(0)));
  process.on('SIGTERM', () => s.close().then(() => finish(0)));
  console.log(`\n  agent-watch ${VERSION}\n  Projects : ${opts.root}\n  Project  : ${project || 'the one with the newest activity'}\n  Open     : ${s.url}\n\n  Ctrl+C to stop.\n`);
  if (opts.open) openPage(s.url);
}

async function start(opts) {
  const st = readState();
  if (st) {
    const h = await health(st.port);
    if (h && h.pid === st.pid) {
      console.log(`  agent-watch is already running: http://127.0.0.1:${st.port}/ (pid ${st.pid})`);
      if (opts.open) openPage(`http://127.0.0.1:${st.port}/`);
      return 0;
    }
  }
  resolveProject(opts.root, opts.project);
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const log = fs.openSync(LOG, 'a');
  const token = crypto.randomBytes(24).toString('base64url');
  const args = [SELF, 'serve', '--port', String(opts.port), '--root', opts.root];
  if (opts.project) args.push('--project', opts.project);
  if (opts.quietAlert !== null) args.push('--quiet-alert', String(opts.quietAlert));
  if (!opts.watch) args.push('--no-watch');
  const child = spawn(process.execPath, args, {
    detached: true, windowsHide: true, stdio: ['ignore', log, log], env: { ...process.env, AGENT_WATCH_TOKEN: token },
  });
  child.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const h = await health(opts.port);
    if (h && h.pid === child.pid) {
      console.log(`  agent-watch ${VERSION} is running in the background: http://127.0.0.1:${opts.port}/ (pid ${child.pid})`);
      console.log(`  Stop it with: node agent-watch.mjs stop`);
      if (opts.open) openPage(`http://127.0.0.1:${opts.port}/`);
      return 0;
    }
  }
  console.error(`  agent-watch did not answer on port ${opts.port} within 10 s. Its log: ${LOG}`);
  return 1;
}

async function stop() {
  const st = readState();
  if (!st) {
    console.log('  agent-watch is not running (no state file).');
    return 0;
  }
  const r = await request(st.port, '/api/stop', { method: 'POST', headers: { 'X-Agent-Watch-Token': st.token } });
  if (r && r.status === 200) {
    for (let i = 0; i < 20 && (await health(st.port)); i++) await new Promise((res) => setTimeout(res, 150));
    fs.rmSync(STATE, { force: true });
    console.log(`  agent-watch stopped (pid ${st.pid}, port ${st.port}).`);
    return 0;
  }
  if (!(await health(st.port))) {
    fs.rmSync(STATE, { force: true });
    console.log('  agent-watch was not answering; its stale state file is removed.');
    return 0;
  }
  console.error(`  agent-watch on port ${st.port} refused the stop token. Stop it from its own terminal.`);
  return 1;
}

async function status(opts) {
  const st = readState();
  const h = st ? await health(st.port) : null;
  if (!h) {
    console.log('  agent-watch is not running. Start it with: node agent-watch.mjs start');
    return 0;
  }
  console.log(`  agent-watch ${h.version} at http://127.0.0.1:${st.port}/ (pid ${h.pid}, up ${ago(Date.now() - h.started)})`);
  const ss = await request(st.port, '/api/sessions?closed=0', { timeout: 15000 });
  if (ss && ss.status === 200) {
    const v = JSON.parse(ss.body);
    for (const x of v.sessions) console.log(`  Session : ${x.project}${x.name ? ` · ${x.name}` : ''}, ${x.state}${x.id === v.focus && v.detail ? `: ${v.detail.now.text}` : ''}`);
  }
  const r = await request(st.port, `/api/state${st.project ? `?project=${encodeURIComponent(st.project)}` : ''}`, { timeout: 15000 });
  if (!r || r.status !== 200) return 0;
  const s = JSON.parse(r.body);
  const run = s.runs.find((x) => x.id === s.current);
  console.log(`  Project : ${s.project?.name || '-'}`);
  if (!run) return 0;
  console.log(`  Run     : ${run.title} (${run.status}, ${run.id}${run.branch ? `, branch ${run.branch}` : ''})`);
  console.log(`  Phases  : ${run.phases.map((p) => `${p.title} ${{ done: '✓', active: '▶', pending: '·', stopped: '■' }[p.state] || '?'}`).join('   ')}`);
  for (const a of run.agents.filter((x) => x.status === 'running')) {
    console.log(`  Agent   : ${a.label}, ${a.stats?.tools ?? 0} tool calls, last active ${ago(Date.now() - a.last)} ago${a.quiet ? ' (quiet)' : ''}`);
    for (const e of a.feed.slice(-(opts.lines ?? 5))) console.log(`            ${e.kind.padEnd(6)} ${e.status === 'error' ? '✗' : e.status === 'ok' ? '✓' : ' '} ${e.text}`);
  }
  return 0;
}

/** The archive of a project, opened in this process and brought up to date. */
async function openArchive(opts, { quiet = false } = {}) {
  const slug = resolveProject(opts.root, opts.project) || listProjects(opts.root)[0]?.slug;
  if (!slug) throw new Error(`No Claude project under ${opts.root} holds workflow runs.`);
  const collector = createCollector({ root: opts.root, health: createHealth() });
  const archive = createArchive({ dir: path.join(STATE_DIR, 'archive'), collector, pauseMs: 0 });
  const before = archive.status(slug);
  let shown = 0;
  const r = await archive.refresh(slug, {
    onProgress: quiet ? null : (done, total) => {
      if (done === total || Date.now() - shown > 1000) {
        shown = Date.now();
        process.stdout.write(`\r  Indexing ${done} of ${total} new or changed runs...`);
      }
    },
  });
  if (!quiet && r.updated) process.stdout.write('\n');
  collector.close();
  return { slug, archive, before, updated: r.updated, project: collector.projects().find((p) => p.slug === slug) };
}

const runLine = (e) => {
  const took = e.ended && e.started ? ago(e.ended - e.started) : e.last && e.started ? ago(e.last - e.started) : '-';
  const o = e.outcomes || {};
  return `  ${stamp(e.started).padEnd(20)} ${String(e.status).padEnd(10)} ${took.padStart(11)}  ${String(e.agents).padStart(2)} agents  ${(o.errors ? `${o.errors} err` : '').padEnd(7)} ${e.title}${e.available === false ? '  (source gone)' : ''}\n${' '.repeat(23)}${e.id}${e.name ? `  ${e.name}` : ''}`;
};

async function index(opts) {
  const { archive, slug, updated, project } = await openArchive(opts);
  const st = archive.status(slug);
  console.log(`  ${project?.name || slug}: ${st.indexed} runs indexed${st.gone ? `, ${st.gone} whose files are gone` : ''}; ${updated} read this time. Kept in ${path.join(STATE_DIR, 'archive')}`);
  return 0;
}

async function runs(opts) {
  const { archive, slug, project } = await openArchive(opts);
  const page = archive.list(slug, { limit: opts.lines ?? 20, status: opts.status });
  console.log(`  ${project?.name || slug}: ${page.total} runs${opts.status ? ` ${opts.status}` : ''}, newest first${page.total > page.rows.length ? ` (the first ${page.rows.length}; --lines shows more)` : ''}`);
  for (const e of page.rows) console.log(runLine(e));
  return 0;
}

async function search(opts) {
  if (!opts.words.length) throw new Error('search needs words to look for, such as: search file:shader.js status:killed');
  const { archive, slug, project } = await openArchive(opts, { quiet: true });
  const r = archive.search(slug, opts.words.join(' '), { limit: opts.lines ?? 20 });
  console.log(`  ${project?.name || slug}: ${r.total} ${r.total === 1 ? 'run matches' : 'runs match'} "${r.q}"`);
  for (const e of r.rows) {
    console.log(runLine(e));
    for (const h of e.hits || []) console.log(`${' '.repeat(23)}${h.field.padEnd(7)} ${h.text}`);
  }
  return 0;
}

function projects(opts) {
  const list = listProjects(opts.root);
  if (!list.length) {
    console.log(`  No Claude project under ${opts.root} holds workflow runs.`);
    return 0;
  }
  for (const p of list) console.log(`  ${p.name.padEnd(22)} ${String(p.runs).padStart(3)} ${p.runs === 1 ? 'run ' : 'runs'}   last ${stamp(p.last)}   ${p.cwd || p.slug}`);
  return 0;
}

const STATE_MARK = { working: '●', waiting: '○', closed: '·' };

/** Every session on the machine in the terminal, and the newest actions of the one in focus. */
async function sessionsCmd(opts) {
  const collector = createCollector({ root: opts.root });
  try {
    const v = await createSessions({ root: opts.root, collector }).view({});
    const open = v.sessions.filter((x) => x.open);
    console.log(`  ${open.length ? `${open.length} Claude Code ${open.length === 1 ? 'session is' : 'sessions are'} open` : 'No Claude Code session is open'} on this machine${v.counts.closed ? `; ${v.counts.closed} closed in the last day` : ''}.`);
    const shown = [...open, ...v.sessions.filter((x) => !x.open).slice(0, 6)];
    for (const x of shown) {
      console.log(`\n  ${STATE_MARK[x.state] || '○'} ${x.project}${x.name ? ` · ${x.name}` : ''}   ${x.state}${x.last ? `, last active ${ago(Date.now() - x.last)} ago` : ''}`);
      if (x.title || x.lastPrompt) console.log(`      ${x.title || x.lastPrompt}`);
      const parts = [x.subagents ? `agents ${x.subagentsRunning} running of ${x.subagents}` : null, x.workflows ? `workflows ${x.workflowsRunning} running of ${x.workflows}` : null, x.branch ? `branch ${x.branch}` : null, x.pid ? `pid ${x.pid}` : null, x.short].filter(Boolean);
      console.log(`      ${parts.join(' · ')}`);
    }
    const d = v.detail;
    if (d) {
      console.log(`\n  Now in ${d.session.project}${d.session.name ? ` · ${d.session.name}` : ''}: ${d.now.text}`);
      for (const e of d.feed.slice(-(opts.lines ?? 5))) console.log(`      ${e.kind.padEnd(6)} ${e.status === 'error' ? '✗' : e.status === 'ok' ? '✓' : ' '} ${e.lane && e.lane !== 'main' ? `[${e.laneLabel}] ` : ''}${e.text}`);
    }
    return 0;
  } finally {
    collector.close();
  }
}

const NOTICE_MARK = { 'run-finished': '✓', 'run-ended': '■', error: '✗', 'test-failed': '✗', quiet: '…' };

async function notices(opts) {
  const st = readState();
  const h = st ? await health(st.port) : null;
  let list = null;
  let from = '';
  if (h) {
    const r = await request(st.port, '/api/notices?limit=200', { timeout: 5000 });
    if (r && r.status === 200) {
      const body = JSON.parse(r.body);
      list = body.notices;
      from = body.watching ? 'the running service' : 'the running service, which was started with --no-watch';
    }
  }
  if (!list) {
    try {
      list = JSON.parse(fs.readFileSync(path.join(STATE_DIR, 'notices.json'), 'utf8')).notices || [];
      from = 'the notices kept from the last time the service ran';
    } catch {
      console.log('  No notices yet. The service raises them while it runs: node agent-watch.mjs start');
      return 0;
    }
  }
  const shown = list.slice(0, opts.lines ?? 20);
  console.log(`  ${list.length} notices from ${from}${list.length > shown.length ? `, the newest ${shown.length}` : ''}`);
  for (const n of shown) console.log(`  ${stamp(n.at).padEnd(20)} ${NOTICE_MARK[n.kind] || '·'} ${String(n.projectName || n.project).padEnd(16)} ${n.text}${n.basis === 'inferred' ? ' (inferred)' : ''}`);
  return 0;
}

/** One run of a project read in full, for handoff: the run asked for, else the current one. */
async function bundleFor(opts) {
  const slug = resolveProject(opts.root, opts.project) || listProjects(opts.root)[0]?.slug;
  if (!slug) throw new Error(`No Claude project under ${opts.root} holds workflow runs.`);
  const collector = createCollector({ root: opts.root, health: createHealth() });
  let id = opts.run;
  if (!id) id = (await collector.state(slug)).focus;
  const b = id ? await collector.runBundle(slug, id) : null;
  collector.close();
  if (!b) throw new Error(opts.run ? `No run ${opts.run} in this project. Run runs to list them.` : 'This project has no runs yet.');
  return b;
}

async function handoff(opts) {
  const b = await bundleFor(opts);
  const crit = loadCriteria(path.join(STATE_DIR, 'criteria'), b.run.name);
  const extras = { incidents: incidents(b), cases: casesOf(b), files: fileMap(b).files };
  const ev = evaluate(b, crit.criteria, extras);
  const body = opts.format === 'json' ? JSON.stringify(report(b, crit, ev, extras, 'json'), null, 2) : report(b, crit, ev, extras, 'md');
  if (opts.out) {
    fs.writeFileSync(opts.out, body);
    console.log(`  Handoff for ${b.run.title} written to ${opts.out}: ${ev.filter((x) => x.state === 'satisfied').length} of ${ev.length} criteria satisfied${crit.source === 'file' ? '' : ' (the starter set, not adopted)'}.`);
  } else process.stdout.write(`${body}\n`);
  return 0;
}

async function criteria(opts) {
  let workflow = opts.workflow;
  if (!workflow) workflow = (await bundleFor(opts)).run.name;
  if (!workflow) throw new Error('The current run names no workflow; give one with --workflow.');
  const r = writeStarter(path.join(STATE_DIR, 'criteria'), workflow);
  console.log(r.written ? `  Wrote the starter criteria for ${workflow} to ${r.path}. Edit it to set what a finished run of this workflow must show.` : `  ${workflow}'s criteria are in ${r.path}.`);
  console.log(`  Types: ${TYPES.join(', ')}.`);
  return 0;
}

async function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(`  ${err.message}`);
    return 2;
  }
  try {
    switch (opts.cmd) {
      case 'serve': await serve(opts); return null;
      case 'start': return await start(opts);
      case 'stop': return await stop();
      case 'status': return await status(opts);
      case 'sessions': return await sessionsCmd(opts);
      case 'projects': return projects(opts);
      case 'index': return await index(opts);
      case 'runs': return await runs(opts);
      case 'search': return await search(opts);
      case 'notices': return await notices(opts);
      case 'handoff': return await handoff(opts);
      case 'criteria': return await criteria(opts);
      case 'version': console.log(VERSION); return 0;
      case 'help': case null: console.log(HELP); return 0;
      default: console.error(`  Unknown command ${opts.cmd}. See --help.`); return 2;
    }
  } catch (err) {
    console.error(`  ${err.message}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main(process.argv.slice(2)).then((code) => {
    if (code !== null) process.exitCode = code;
  });
}
