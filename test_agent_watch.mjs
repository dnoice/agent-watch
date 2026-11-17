#!/usr/bin/env node
/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Test Suite (dd1 Tools Edition - v1.13)
 *     - File Name: test_agent_watch.mjs
 *     - Relative Path: test_agent_watch.mjs
 *     - Artifact Type: test
 *     - Version: 1.13.1
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.13.1 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Checks
 *       from the first run in a cloud environment: ports from /proc,
 *       test scripts in a tests folder, and a background command from
 *       before a restart. 286 checks.
 *     - 1.13.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Checks
 *       for other environments: Host names allowed and refused, the
 *       refusal's message, --allow-host's guard, and the test ports from
 *       netstat and from ss. 282 checks.
 *     - 1.12.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Checks
 *       for the sessions reader against a fake registry and process list:
 *       prompts, turns, background commands, subagent lanes, the now line,
 *       /api/sessions and its guards, and --project for a project with no
 *       run yet. 273 checks.
 *     - 1.11.4 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       dropdown check asserts appearance: none lives only in the fallback
 *       block.
 *     - 1.11.3 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       brand check looks for the arrowheads between the line's words.
 *     - 1.11.2 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Checks
 *       that Live leads the right-hand group as Service, and that the name
 *       stands over its fitted line. 241 checks.
 *     - 1.11.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Checks
 *       for the Insights series and trends, /api/insights, structured
 *       evidence, no colour outside the theme blocks, and the masthead
 *       dropdown. 240 checks.
 *     - 1.10.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Checks
 *       that a one-column view outranks the Live grid, and that a resumed run
 *       starts with its first agent, says so and calls the record's totals
 *       partial. 227 checks.
 *     - 1.9.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A second
 *       agent under one description in the quiet fixture run; checks that it
 *       is numbered and that a run's status note does not repeat its source.
 *       225 checks.
 *     - 1.8.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Two
 *       header checks: the header, the view tabs and the page share one
 *       column; Live sits beside the name with the time of the last answer.
 *       223 checks.
 *     - 1.7.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Six
 *       logo checks: the page's copy is the master shape for shape and class
 *       for class, in paint order; the favicon's figure is the master's; the
 *       stylesheet colours every part; logo-sync.mjs finds both copies
 *       current, keeps groups and paint order, and refuses an unnamed shape.
 *       221 checks.
 *     - 1.6.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage F:
 *       the profile's time kinds, concurrency, retries, reruns and unobserved
 *       stretches; criteria from the starter set, a file and a broken file;
 *       every criterion type in each state; the Markdown and JSON report; the
 *       routes and the download; handoff and criteria. 215 checks.
 *     - 1.5.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage E:
 *       cases from test output with a flip in the run, regression classes and
 *       basis, comparison with tokens not comparable, related runs, a bundle
 *       compared, file maps with overlapping and possible collisions, failed
 *       writes, commits matched by path, a file's history; the five routes.
 *       191 checks.
 *     - 1.4.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage D:
 *       the timeline's lanes, order, ties, window, kinds, limit and buckets;
 *       the watch's first look, error, test and finish notices, no repeats,
 *       persistence, quiet spells and rules off; the routes; notices and
 *       --quiet-alert; a file rewritten in place read again from its start.
 *       163 checks.
 *     - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage C:
 *       incidents from failing tests, commits and calls, retries folded,
 *       direct and correlated recovery, unresolved first, the evidence around
 *       one, log and reported failures, the routes; and no element filled
 *       with what may be null. 134 checks.
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage B:
 *       the query parser, the archive's build, persistence, refresh of only
 *       what changed, live and finished entries, gone runs, a format change,
 *       list, search; the new routes, the file list and run-id refusal;
 *       index, runs and search; every page module checked for HTML from data,
 *       and every element looked up by id. 114 checks.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Stage A:
 *       the UTF-8 boundary, a replaced file, the health register, calls
 *       paired with results, confirmed commits, every test adapter, classify,
 *       redaction, the trunk's name, provenance, labelled tokens,
 *       unattributed logs and a run older than the twelve shown. 78 checks.
 *     - 1.0.0 (11/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version.
 *
 * ✒ Description:
 *     Checks agent-watch against a fake Claude projects folder it builds in
 *     the OS temp folder: a session transcript with a Workflow call, a run
 *     still going with two agents, a finished run with its saved record, a
 *     run left without one, a workflow script, and a test log. Nothing real
 *     is read; the fixture is removed at the end.
 *
 * ✒ Key Features:
 *     - The script reader: name, description and phases, quotes escaped
 *       inside them, and no meta at all
 *     - Incremental reading: only new lines, a partial line carried over,
 *       a file that shrank read again
 *     - The collector: projects named by their folder, runs, phases,
 *       agents, counts, the feed, branch and base, logs, the stale run
 *     - The server: the page and its files, health, state and its run
 *       focus, the Host check, GET only, the stop token
 *     - The command line: --version, --help, a bad option, projects, a
 *       project given by its path
 *     - The page script writes transcript text as text, never as HTML
 *
 * ✒ Usage Instructions:
 *     node test_agent_watch.mjs        (or: digi agent-watch test)
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Prints one line per check and "<n> passed, <m> failed"; exits 1 on
 *       any failure
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { metaOf, toolSummary, readNew, listProjects, createCollector, facts, listeningPorts, procListening } from './lib/collect.mjs';
import { readNewAsync, createHealth, readJson } from './lib/read.mjs';
import { freshAgent, ingestAgentLine, agentStats, argsOf, kindOf } from './lib/claude.mjs';
import { parseTestOutput, verdict, classify } from './lib/tests.mjs';
import { createGit, parseLog } from './lib/git.mjs';
import { redact, excerpt } from './lib/evidence.mjs';
import { createArchive, parseQuery, INDEX_VERSION } from './lib/archive.mjs';
import { incidents, investigate } from './lib/investigate.mjs';
import { timeline } from './lib/timeline.mjs';
import { createWatch } from './lib/watch.mjs';
import { casesOf, regression, compare, related, entryFromBundle } from './lib/compare.mjs';
import { fileMap, history } from './lib/files.mjs';
import { profile } from './lib/profile.mjs';
import { runInsights, projectTrends, bucketFor, KINDS } from './lib/insights.mjs';
import { loadCriteria, writeStarter, evaluate, report, STARTER } from './lib/handoff.mjs';
import { startServer, webFiles, hostName } from './lib/server.mjs';
import { slugFor, readRegistry, alivePids, userKind, taskNote, freshSession, sessionLineFilter, ingestSessionLine, peek, createSessions } from './lib/sessions.mjs';
import { resolveProject, stamp, VERSION } from './agent-watch.mjs';
import { drawingOf, inlineOf, figureOf, sync as logoSync } from './logo-sync.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(` FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/* ---------- the fixture ---------- */

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-watch-test-'));
const ROOT = path.join(TMP, 'projects');
const SLUG = 'C--fixture-work-my-project';
const PROJ = path.join(ROOT, SLUG);
const SESSION = 'sess-0001';
const CWD = path.join(TMP, 'work', 'my-project');
const SCRATCH = path.join(TMP, 'scratch');
const SCRIPT = path.join(TMP, 'fixture-workflow.js');
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const line = (o) => `${JSON.stringify(o)}\n`;
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
};

write(SCRIPT, `export const meta = {
  name: 'fixture-wf',
  description: 'A fixture\\'s run, with "quotes"',
  phases: [
    { title: 'Design', detail: 'read, then write' },
    { title: 'Build' },
    { title: 'Review', detail: "it's checked" },
  ],
}
phase('Design')
`);
write(path.join(SCRATCH, 'unit.log'), '[webgl views] The view\n  ok   one\n FAIL  two broke\n\n9 passed, 1 failed\n');
write(path.join(SCRATCH, 'older.log'), '12 passed, 0 failed\n');
fs.utimesSync(path.join(SCRATCH, 'older.log'), new Date(now - 60000), new Date(now - 60000));

write(path.join(PROJ, `${SESSION}.jsonl`), [
  line({ type: 'user', cwd: CWD, timestamp: iso(now - 600000), message: { role: 'user', content: 'go' } }),
  line({ type: 'assistant', cwd: CWD, timestamp: iso(now - 590000), message: { content: [{ type: 'tool_use', id: 'tu1', name: 'Workflow', input: { scriptPath: SCRIPT, args: { branch: 'feature-x', base: 'abc1234', scratch: SCRATCH, ports: '5390-5391', piece: { name: 'Fixture piece' } } } }] } }),
  line({ type: 'user', cwd: CWD, timestamp: iso(now - 589000), message: { content: [{ type: 'tool_result', tool_use_id: 'tu1', content: [{ type: 'text', text: `Workflow launched.\nRun ID: wf_fixture-001\nScript file: ${SCRIPT}\n` }] }] } }),
].join(''));

const WF = path.join(PROJ, SESSION, 'subagents', 'workflows');
const RUN = path.join(WF, 'wf_fixture-001');
write(path.join(RUN, 'journal.jsonl'), [
  line({ type: 'launched' }),
  line({ type: 'started', agentId: 'aaa1', label: 'design:x', phase: 'Design' }),
  line({ type: 'result', result: { risks: ['one', 'two'], commits: [] } }),
  line({ type: 'started', agentId: 'bbb2', label: 'build:x', phase: 'Build' }),
].join(''));
write(path.join(RUN, 'agent-aaa1.meta.json'), JSON.stringify({ description: 'design:x', workflowPhase: 'Design', pickedEffortModel: 'claude-opus-5-5' }));
write(path.join(RUN, 'agent-aaa1.jsonl'), [
  line({ type: 'user', timestamp: iso(now - 580000), message: { content: 'This run builds ONE piece' } }),
  line({ type: 'assistant', timestamp: iso(now - 570000), message: { usage: { output_tokens: 120 }, content: [{ type: 'text', text: 'Reading the code first.' }, { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls', description: 'List the files' } }] } }),
  line({ type: 'user', timestamp: iso(now - 560000), message: { content: [{ type: 'tool_result', tool_use_id: 't1', is_error: true, content: [{ type: 'text', text: 'No such file' }] }] } }),
  line({ type: 'assistant', timestamp: iso(now - 550000), message: { usage: { output_tokens: 80 }, content: [{ type: 'tool_use', id: 't2', name: 'Bash', input: { command: 'npm test 2>&1 | tail -3' } }, { type: 'tool_use', id: 't3', name: 'Bash', input: { command: 'git commit -qm "x"' } }, { type: 'tool_use', id: 't4', name: 'Read', input: { file_path: 'C:\\a\\b\\c\\d.js' } }] } }),
].join(''));
fs.utimesSync(path.join(RUN, 'agent-aaa1.meta.json'), new Date(now - 580000), new Date(now - 580000));
write(path.join(RUN, 'agent-bbb2.meta.json'), JSON.stringify({ description: 'build:x', workflowPhase: 'Build' }));
const BUILD = path.join(RUN, 'agent-bbb2.jsonl');
write(BUILD, line({ type: 'assistant', timestamp: iso(now - 20000), message: { usage: { output_tokens: 10 }, content: [{ type: 'tool_use', id: 'u1', name: 'Edit', input: { file_path: '/x/y/z/app.js' } }] } }));

// A finished run with its saved record.
const DONE = path.join(WF, 'wf_fixture-000');
write(path.join(DONE, 'journal.jsonl'), line({ type: 'started', agentId: 'ccc3', phase: 'Design' }) + line({ type: 'result', agentId: 'ccc3', result: { findings: [{ severity: 'high' }, { severity: 'low' }, { severity: 'low' }] } }));
write(path.join(DONE, 'agent-ccc3.meta.json'), JSON.stringify({ description: 'design:old', workflowPhase: 'Design' }));
write(path.join(DONE, 'agent-ccc3.jsonl'), line({ type: 'assistant', timestamp: iso(now - 9e6), message: { content: [{ type: 'text', text: 'done' }] } }));
write(path.join(PROJ, SESSION, 'workflows', 'wf_fixture-000.json'), JSON.stringify({
  runId: 'wf_fixture-000', workflowName: 'old-wf', summary: 'An earlier run', status: 'completed', startTime: now - 1e7, durationMs: 3600000,
  totalTokens: 123456, totalToolCalls: 77, phases: [{ title: 'Design', detail: 'it' }], args: { piece: { name: 'Earlier piece' } },
}));
for (const f of fs.readdirSync(DONE)) fs.utimesSync(path.join(DONE, f), new Date(now - 9e6), new Date(now - 9e6));

// A run left without a record: quiet for hours.
const LEFT = path.join(WF, 'wf_fixture-002');
write(path.join(LEFT, 'journal.jsonl'), line({ type: 'started', agentId: 'ddd4', phase: 'Build' }));
write(path.join(LEFT, 'agent-ddd4.meta.json'), JSON.stringify({ description: 'build:left', workflowPhase: 'Build' }));
write(path.join(LEFT, 'agent-ddd4.jsonl'), line({ type: 'assistant', timestamp: iso(now - 8e6), message: { content: [{ type: 'text', text: 'working' }] } }));
for (const f of fs.readdirSync(LEFT)) fs.utimesSync(path.join(LEFT, f), new Date(now - 8e6), new Date(now - 8e6));
// The same step started again under the same description: the second is numbered #2.
write(path.join(LEFT, 'agent-ddd5.meta.json'), JSON.stringify({ description: 'build:left', workflowPhase: 'Build' }));
write(path.join(LEFT, 'agent-ddd5.jsonl'), line({ type: 'assistant', timestamp: iso(now - 7.9e6), message: { content: [{ type: 'text', text: 'again' }] } }));
for (const f of ['agent-ddd5.meta.json', 'agent-ddd5.jsonl']) fs.utimesSync(path.join(LEFT, f), new Date(now - 7.9e6), new Date(now - 7.9e6));

/* ---------- the script reader ---------- */

const meta = metaOf(fs.readFileSync(SCRIPT, 'utf8'));
check('metaOf reads the name and a description with escaped quotes', meta?.name === 'fixture-wf' && meta.description === 'A fixture\'s run, with "quotes"', JSON.stringify(meta));
check('metaOf reads every phase, with and without a detail', JSON.stringify(meta?.phases) === JSON.stringify([{ title: 'Design', detail: 'read, then write' }, { title: 'Build', detail: '' }, { title: 'Review', detail: 'it\'s checked' }]), JSON.stringify(meta?.phases));
check('metaOf answers null for a file with no meta', metaOf('const x = 1;') === null && metaOf('export const meta = { name: ') === null);

/* ---------- small pieces ---------- */

check('toolSummary prefers the description, then the command\'s first line, then the file\'s last three parts',
  toolSummary({ description: 'Do it', command: 'x' }) === 'Do it' && toolSummary({ command: 'a\nb' }) === 'a' && toolSummary({ file_path: 'C:\\a\\b\\c\\d.js' }) === 'b/c/d.js');
check('facts keeps commits, counts findings by severity, risks and check lines',
  JSON.stringify(facts({ findings: [{ severity: 'high' }, { severity: 'high' }], risks: [1], npmTest: 'x' })) === JSON.stringify({ findings: 2, severity: { high: 2 }, risks: 1, npmTest: 'x' }) && facts(null) === null);
check('stamp writes month/day/year on the 12-hour clock', /^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/.test(stamp(now)) && stamp(Date.UTC(2026, 0, 5, 12)).startsWith('01/0'));

{
  const f = path.join(TMP, 'lines.txt');
  write(f, 'one\ntwo\nthr');
  const seen = [];
  const st = { reset: () => seen.push('RESET') };
  readNew(f, st, (l) => seen.push(l));
  check('readNew reads complete lines and keeps the partial one', seen.join(',') === 'one,two' && st.carry === 'thr', seen.join(','));
  fs.appendFileSync(f, 'ee\nfour\n');
  readNew(f, st, (l) => seen.push(l));
  check('readNew then reads only what was added, finishing the partial line', seen.join(',') === 'one,two,three,four', seen.join(','));
  write(f, 'new\n');
  readNew(f, st, (l) => seen.push(l));
  check('readNew starts again when the file shrank', seen.slice(-2).join(',') === 'RESET,new', seen.join(','));
}

/* ---------- the collector ---------- */

const projects = listProjects(ROOT);
check('listProjects finds the project and names it by its working folder', projects.length === 1 && projects[0].slug === SLUG && projects[0].name === 'my-project' && projects[0].runs === 3, JSON.stringify(projects));

const c = createCollector({ root: ROOT });
let s = await c.state(SLUG);
const cur = s.runs.find((r) => r.id === s.current);
check('the run still going is current and in focus', s.current === 'wf_fixture-001' && s.focus === 'wf_fixture-001' && cur?.status === 'running', `${s.current} ${cur?.status}`);
check('its title, workflow and description come from its args and its script', cur.title === 'Fixture piece' && cur.name === 'fixture-wf' && cur.description === 'A fixture\'s run, with "quotes"');
check('its phases follow the script, done, active and pending', cur.phases.map((p) => `${p.title}:${p.state}`).join(' ') === 'Design:done Build:active Review:pending', cur.phases.map((p) => `${p.title}:${p.state}`).join(' '));
check('branch, base, ports and scratch come from the args', cur.branch === 'feature-x' && cur.base === 'abc1234' && cur.ports === '5390-5391' && cur.scratch === SCRATCH && cur.cwd === CWD);
const design = cur.agents.find((a) => a.id === 'aaa1');
const build = cur.agents.find((a) => a.id === 'bbb2');
check('a finished agent is done with its result\'s facts', design.status === 'done' && design.result?.risks === 2 && build.status === 'running', JSON.stringify(design.result));
check('an agent\'s counts: tools, tests, commits, errors, output tokens and tools by name',
  design.stats.tools === 4 && design.stats.tests === 1 && design.stats.commits === 1 && design.stats.errors === 1 && design.stats.outTokens === 200 && design.stats.byTool.Bash === 3 && design.stats.byTool.Read === 1, JSON.stringify(design.stats));
check('the feed holds what it said, each tool by kind, and the error', design.feed.map((e) => e.kind).join(',') === 'say,tool,error,test,commit,read' && design.feed[1].text === 'List the files' && design.feed[2].text === 'No such file', design.feed.map((e) => e.kind).join(','));
check('the totals of a run still going add its agents up', cur.totals.toolCalls === 5 && cur.totals.tokens === 210, JSON.stringify(cur.totals));
const old = s.runs.find((r) => r.id === 'wf_fixture-000');
check('a finished run reads its saved record: status, title, totals, phases', old.status === 'completed' && old.title === 'Earlier piece' && old.totals.tokens === 123456 && old.totals.toolCalls === 77 && old.phases[0]?.state === 'done' && old.ended === old.started + 3600000, JSON.stringify({ s: old.status, t: old.title }));
const left = s.runs.find((r) => r.id === 'wf_fixture-002');
check('a run quiet for hours without a record is unfinished, its agent stopped', left.status === 'unfinished' && left.agents[0].status === 'stopped', `${left.status} ${left.agents[0]?.status}`);
check('two agents under one description are told apart: the later is numbered', left.agents.map((a) => a.label).join(', ') === 'build:left, build:left #2', left.agents.map((a) => a.label).join(', '));
check('a run\'s status sentence says where it came from without repeating it', old.why.note === 'Claude Code saved the run as "completed"', old.why.note);
{
  // A resumed run is saved again with the resume as its start; its first agent began earlier.
  const recPath = path.join(PROJ, SESSION, 'workflows', 'wf_fixture-000.json');
  const saved = fs.readFileSync(recPath, 'utf8');
  const st0 = fs.statSync(recPath);
  fs.writeFileSync(recPath, JSON.stringify({ ...JSON.parse(saved), startTime: now - 8e6, durationMs: 600000 }));
  const rs = await createCollector({ root: ROOT }).state(SLUG);
  const resumedRun = rs.runs.find((r) => r.id === 'wf_fixture-000');
  check('a resumed run starts when its first agent did, says it was resumed, and calls the record totals partial',
    Math.abs(resumedRun.started - (now - 9e6)) < 5000 && resumedRun.resumed === now - 8e6 && /was resumed/.test(resumedRun.why.note) && resumedRun.ended === now - 8e6 + 600000
    && resumedRun.totals.tokensKind === 'total' && resumedRun.totals.why.completeness === 'partial' && /resumed part only/.test(resumedRun.totals.why.note),
    `${resumedRun.started - now} ${resumedRun.resumed - now} ${resumedRun.why.note}`);
  fs.writeFileSync(recPath, saved);
  fs.utimesSync(recPath, st0.atime, st0.mtime);
}
check('only the run in focus carries its agents\' feeds', old.agents.every((a) => a.feed.length === 0) && design.feed.length > 0);
check('the logs are the newest first, with the tally and the FAIL lines', s.logs.length === 2 && s.logs[0].name === 'unit.log' && s.logs[0].tally === '9 passed, 1 failed' && s.logs[0].fails.length === 1 && s.logs[0].section.startsWith('[webgl views]'), JSON.stringify(s.logs[0]));
fs.appendFileSync(BUILD, line({ type: 'assistant', timestamp: iso(now - 1000), message: { usage: { output_tokens: 5 }, content: [{ type: 'tool_use', id: 'u2', name: 'Bash', input: { command: 'node tools/ui-check.mjs x' } }] } }));
s = await c.state(SLUG);
const build2 = s.runs.find((r) => r.id === s.current).agents.find((a) => a.id === 'bbb2');
check('a line added to a transcript shows on the next call', build2.stats.tools === 2 && build2.stats.tests === 1 && build2.feed.at(-1).kind === 'test', JSON.stringify(build2.stats));
s = await c.state(SLUG, 'wf_fixture-000');
check('state with a run id puts that run in focus', s.focus === 'wf_fixture-000' && s.current === 'wf_fixture-001');
s = await c.state(SLUG, '../../etc');
check('a run id that is not one is ignored', s.focus === 'wf_fixture-001');
check('a run\'s status says where it came from: the record, recent activity, or inactivity',
  old.why.method === 'record' && cur.why.method === 'inferred-activity' && cur.why.basis === 'inferred' && left.why.method === 'inferred-stale' && left.agents[0].why.method === 'inferred-stale', `${old.why.method} ${cur.why.method} ${left.why.method}`);
check('tokens are labelled: total from a record, output summed from transcripts',
  old.totals.tokensKind === 'total' && cur.totals.tokensKind === 'output' && cur.totals.why.method === 'sum' && cur.totals.why.completeness === 'complete');
check('a run\'s outcomes count tool calls ok, failed and open, and commits confirmed apart from attempted',
  cur.outcomes.commits === 1 && cur.outcomes.commitsConfirmed === 0 && cur.outcomes.toolsFailed === 1 && cur.outcomes.toolsOpen >= 3, JSON.stringify(cur.outcomes));
check('the logs say they are the run\'s own, from the scratch folder its arguments name', s.logsWhy.method === 'scratch-log' && s.logsUnattributed === false);
check('the state carries the health register', s.health.readCount > 0 && Array.isArray(s.health.recent));
c.close();

/* ---------- evidence: reading ---------- */

{
  const f = path.join(TMP, 'utf8.jsonl');
  write(f, `${'x'.repeat((4 << 20) - 1)}€\nnext\n`);
  const a = [];
  readNew(f, {}, (l) => a.push(l));
  check('readNew decodes a character split across two chunks', a.length === 2 && a[0].endsWith('€') && !a[0].includes('\ufffd') && a[1] === 'next');
  const b = [];
  await readNewAsync(f, {}, (l) => b.push(l), null, null, 'x', 0);
  check('readNewAsync decodes it too, in its smaller steps', b.length === 2 && b[0].endsWith('€') && !b[0].includes('\ufffd'));
  fs.rmSync(f);
}
{
  const f = path.join(TMP, 'swap.jsonl');
  const g = path.join(TMP, 'swap2.jsonl');
  write(f, 'a\nb\n');
  const seen = [];
  const st = { reset: () => seen.push('RESET') };
  readNew(f, st, (l) => seen.push(l));
  write(g, 'c\nd\ne\n');
  fs.rmSync(f);
  fs.renameSync(g, f);
  readNew(f, st, (l, no) => seen.push(`${l}${no}`));
  check('a file replaced by another is read again from its first line, numbered from 1', seen.join(',') === 'a,b,RESET,c1,d2,e3', seen.join(','));
  // Rewritten in place: same file, so the same id; longer, so no shrink to notice. Its first bytes changed.
  fs.writeFileSync(f, 'XYZ\nnew one\nnew two\nnew three\n');
  readNew(f, st, (l, no) => seen.push(`${l}${no}`));
  check('a file rewritten in place with longer text is read again from its first line', seen.slice(-5).join(',') === 'RESET,XYZ1,new one2,new two3,new three4', seen.join(','));
}
{
  const h = createHealth();
  const f = path.join(TMP, 'bad.jsonl');
  write(f, '{"type":"user"}\nnot json\n');
  const st = freshAgent('zz');
  readNew(f, st, (l, no) => ingestAgentLine(st, l, no, h), null, h);
  const missing = readJson(path.join(TMP, 'nowhere.json'), h);
  write(path.join(TMP, 'broken.json'), '{nope');
  readJson(path.join(TMP, 'broken.json'), h, 'record');
  const snap = h.snapshot();
  check('the health register counts malformed lines and records, and keeps why',
    missing === null && snap.malformed.transcript === 1 && snap.malformed.record === 1 && snap.failureCount === 0 && snap.recent.some((r) => r.what === 'malformed' && r.kind === 'record'), JSON.stringify(snap));
}

/* ---------- evidence: tool calls paired with their results ---------- */

{
  const st = freshAgent('pp');
  const L = (o, no) => ingestAgentLine(st, JSON.stringify(o), no);
  L({ type: 'assistant', timestamp: iso(now - 5000), message: { content: [
    { type: 'tool_use', id: 'c1', name: 'Bash', input: { command: 'git commit -m "x"' } },
    { type: 'tool_use', id: 'c2', name: 'Bash', input: { command: 'git commit -m "y"' } },
    { type: 'tool_use', id: 'c3', name: 'Bash', input: { command: 'git -C repo commit -am z' } },
    { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'node test_x.mjs' } },
    { type: 'tool_use', id: 'e1', name: 'Edit', input: { file_path: 'C:\\w\\a.js' } },
  ] } }, 7);
  L({ type: 'user', timestamp: iso(now - 3000), message: { content: [
    { type: 'tool_result', tool_use_id: 'c1', content: '[feature-x 1a2b3c4] x\n 1 file changed' },
    { type: 'tool_result', tool_use_id: 'c2', content: 'On branch x\nnothing to commit, working tree clean' },
    { type: 'tool_result', tool_use_id: 't1', is_error: true, content: [{ type: 'text', text: '  ok   one\n FAIL  two — broke\n\n1 passed, 1 failed' }] },
    { type: 'tool_result', tool_use_id: 'e1', content: 'ok' },
  ] } }, 8);
  const ev = (u) => st.events.find((e) => e.use === u);
  check('a commit counts as confirmed only when git\'s summary line comes back',
    st.commits === 3 && st.commitsConfirmed === 1 && st.commitsFailed === 1 && ev('c1').commit.hash === '1a2b3c4' && ev('c2').outcome === 'failed' && ev('c3').status === 'pending' && ev('c3').outcome === undefined);
  check('a tool call carries its result: status, duration, and both lines it came from',
    ev('c1').status === 'ok' && ev('c1').ms === 2000 && ev('c1').line === 7 && ev('c1').rline === 8 && ev('t1').status === 'error');
  check('a test call carries the outcome its output reports, and its named cases',
    ev('t1').outcome === 'failed' && ev('t1').tests.passed === 1 && ev('t1').tests.cases.find((x) => x.name === 'two')?.result === 'failed' && st.testsFailed === 1);
  check('an edit is noted against its file, with whether it came back ok', st.files.get('C:/w/a.js')?.edits === 1 && st.files.get('C:/w/a.js')?.editsOk === 1);
  const sa = agentStats(st);
  check('agentStats keeps attempts apart from outcomes', sa.tools === 5 && sa.toolsOk === 3 && sa.toolsFailed === 1 && sa.toolsOpen === 1 && sa.errors === 1, JSON.stringify(sa));
  check('the error event points at the call it answered', st.events.find((e) => e.kind === 'error')?.of === ev('t1').id);
}
check('Workflow arguments are read from an object or a JSON string', argsOf('{"branch":"x"}').branch === 'x' && argsOf('free text') && Object.keys(argsOf('free text')).length === 0 && argsOf({ a: 1 }).a === 1);
{
  const r = redact('API_KEY=sk-AbCdEf1234567890XyZ and Bearer abcdefghij and src/a/very/long/path/name/that/is/not/a/secret.js');
  check('redaction masks secrets and leaves paths alone', !r.includes('AbCdEf') && !r.includes('abcdefghij') && r.includes('src/a/very/long/path') && excerpt('a\n\nb', 10) === 'a b');
}

/* ---------- evidence: test output ---------- */

{
  const h = parseTestOutput('  ok   one\n FAIL  two — broke\n\n1 passed, 1 failed');
  check('the house adapter reads its cases and its tally', h.format === 'house' && h.passed === 1 && h.failed === 1 && h.counted === 'tally' && h.cases.map((x) => `${x.name}:${x.result}`).join(',') === 'one:passed,two:failed', JSON.stringify(h));
  const t = parseTestOutput('TAP version 13\nok 1 - adds\nnot ok 2 - subtracts\nok 3 - later # SKIP\n# tests 3\n# pass 1\n# fail 1\n# skipped 1\n');
  check('the TAP and node:test adapter reads cases and its summary', t.format === 'tap' && t.passed === 1 && t.failed === 1 && t.skipped === 1 && t.cases[1].name === 'subtracts' && t.cases[2].result === 'skipped', JSON.stringify(t));
  const p = parseTestOutput('tests/test_a.py::test_x PASSED\nFAILED tests/test_a.py::test_y - assert 1 == 2\n==== 1 failed, 1 passed in 0.12s ====');
  check('the pytest adapter reads its summary line and FAILED lines', p.format === 'pytest' && p.failed === 1 && p.passed === 1 && p.cases.some((x) => x.name.endsWith('test_y') && x.result === 'failed'), JSON.stringify(p));
  const j = parseTestOutput('  ✓ adds (3 ms)\n  ✕ subtracts (1 ms)\nTests:       1 failed, 1 passed, 2 total');
  check('the Jest adapter reads ✓ and ✕ lines and its Tests: line', j.format === 'jest' && j.failed === 1 && j.passed === 1 && j.cases[1].name === 'subtracts', JSON.stringify(j));
  const m = parseTestOutput('  12 passing (40ms)\n  1 failing');
  check('the Mocha adapter reads passing and failing', m.format === 'mocha' && m.passed === 12 && m.failed === 1);
  check('output no adapter knows is null, and its verdict unknown', parseTestOutput('Build succeeded in 3 s') === null && verdict(null) === 'unknown' && verdict(h) === 'failed');
  const cl = classify({ a: 'failed', b: 'passed', c: 'failed', d: 'passed', e: 'passed' }, [{ a: 'passed', b: 'failed', c: 'failed', e: 'failed' }, { e: 'passed' }]);
  check('classify names new failures, recoveries, still failing, new cases and flaky candidates',
    cl.a.class === 'new-failure' && cl.b.class === 'recovered' && cl.c.class === 'still-failing' && cl.d.class === 'new' && cl.e.class === 'flaky-candidate', JSON.stringify(cl));
  const fr = facts({ summary: 'done', problems: [1, 2], lanes: [{ tests: [{ name: 't1', result: 'pass' }, { name: 't2', result: 'FAILED: boom' }, { name: 't3', result: 'not run' }] }] });
  check('facts counts the tests a workflow reports, and its problems', fr.tests.passed === 1 && fr.tests.failed === 1 && fr.tests.other === 1 && fr.problems === 2 && fr.summary === 'done', JSON.stringify(fr));
}

/* ---------- evidence: git ---------- */

{
  const calls = [];
  const fake = (trunk) => async (cmd, args) => {
    calls.push(args.join(' '));
    if (args.includes('--show-toplevel')) return '/repo\n';
    if (args.includes('--abbrev-ref')) return 'topic\n';
    if (args.includes('--verify')) return args.at(-1) === trunk ? 'abc\n' : '';
    if (args.includes('log')) return '\x1eabc1234\x1f1700000000\x1fsubject one\n\nsrc/a.js\nsrc/b.js\n\x1edef5678\x1f1700000100\x1fsubject two\n';
    return '';
  };
  const g1 = await createGit(fake('master')).info('/w', 'topic', 'abc1234');
  const g2 = await createGit(fake('none')).info('/w', null, null);
  check('the trunk is named for what it is: master here, HEAD and the branch where neither exists', g1.trunkRef === 'master' && g2.trunkRef === 'HEAD (topic)', `${g1.trunkRef} | ${g2.trunkRef}`);
  check('a branch commit lists the files it changed', g1.branch[0]?.files?.join(',') === 'src/a.js,src/b.js' && g1.branch[1]?.subject === 'subject two');
  const g3 = await createGit(fake('main')).info('/w', 'x;rm -rf', 'nothex');
  check('a branch or base that is not plainly a name or a hash never reaches git', g3.branch.length === 0 && !calls.some((c) => c.includes('rm -rf')));
  check('parseLog reads commits without files', parseLog('\x1ea1\x1f1\x1fs').length === 1);
}

/* ---------- many runs: older than the twelve shown ---------- */

const MANY = 'C--fixture-work-many';
{
  const proj = path.join(ROOT, MANY);
  write(path.join(proj, 'sess-9.jsonl'), line({ type: 'user', cwd: path.join(TMP, 'work', 'many'), timestamp: iso(now - 3e7), message: { content: 'go' } }));
  for (let i = 0; i < 13; i++) {
    const dir = path.join(proj, 'sess-9', 'subagents', 'workflows', `wf_many-${String(i).padStart(3, '0')}`);
    write(path.join(dir, 'journal.jsonl'), line({ type: 'started', agentId: `m${i}`, phase: 'Build' }));
    write(path.join(dir, `agent-m${i}.meta.json`), JSON.stringify({ description: `build:${i}`, workflowPhase: 'Build' }));
    write(path.join(dir, `agent-m${i}.jsonl`), line({ type: 'assistant', timestamp: iso(now - 3e7 + i * 1000), message: { content: [{ type: 'text', text: `run ${i}` }] } }));
    for (const f of fs.readdirSync(dir)) fs.utimesSync(path.join(dir, f), new Date(now - 3e7 + i * 60000), new Date(now - 3e7 + i * 60000));
  }
}
{
  const c2 = createCollector({ root: ROOT });
  const s1 = await c2.state(MANY);
  check('the live state shows the twelve newest runs and says how many there are', s1.runs.length === 12 && s1.total === 13 && !s1.runs.some((r) => r.id === 'wf_many-000'), `${s1.runs.length} ${s1.total}`);
  const s2 = await c2.state(MANY, 'wf_many-000');
  const oldest = s2.runs.find((r) => r.id === 'wf_many-000');
  check('the thirteenth run, asked for by id, comes into focus with its agents read', s2.focus === 'wf_many-000' && s2.older === 'wf_many-000' && oldest?.deep === true && oldest.agents[0].feed.length === 1, `${s2.focus} ${s2.older}`);
  check('a run that names no scratch folder gets logs said to be unattributed', s2.logsUnattributed === true && s2.logsWhy.method === 'scratch-unattributed');
  c2.close();
}

/* ---------- failure investigation (R01) ---------- */

/** A run bundle built from transcript lines, the way runBundle would give it. */
function bundleFrom(agentsSpec, extra = {}) {
  const agents = agentsSpec.map(({ id, label, phase, lines }) => {
    const st = freshAgent(id);
    lines.forEach((o, i) => ingestAgentLine(st, JSON.stringify(o), i + 1));
    return { id, label, phase, status: 'done', file: `/t/agent-${id}.jsonl`, events: st.events, files: [...st.files.values()], stats: agentStats(st) };
  });
  return { run: { id: 'wf_bundle-1', title: 'B', ended: now, last: now }, agents, logs: [], logsUnattributed: false, reported: [], ...extra };
}
const T = (s) => iso(now - 300000 + s * 1000);
const use = (t, id, name, input) => ({ type: 'assistant', timestamp: T(t), message: { content: [{ type: 'tool_use', id, name, input }] } });
const res = (t, id, content, isError = false) => ({ type: 'user', timestamp: T(t), message: { content: [{ type: 'tool_result', tool_use_id: id, content, is_error: isError }] } });
const IB = bundleFrom([
  { id: 'ra', label: 'build', phase: 'Build', lines: [
    use(0, 'a1', 'Bash', { command: 'npm test' }), res(5, 'a1', '  ok   adds\n FAIL  subtracts\n\n1 passed, 1 failed', true),
    use(10, 'a2', 'Edit', { file_path: '/w/src/x.js' }), res(11, 'a2', 'ok'),
    use(20, 'a3', 'Bash', { command: 'npm test' }), res(25, 'a3', '  ok   adds\n  ok   subtracts\n\n2 passed, 0 failed'),
    use(30, 'a4', 'Bash', { command: 'git commit -m "a"' }), res(31, 'a4', 'nothing to commit, working tree clean'),
    use(40, 'a5', 'Bash', { command: 'ls missing' }), res(41, 'a5', 'ls: missing: No such file', true),
    use(50, 'a6', 'Bash', { command: 'ls missing' }), res(51, 'a6', 'ls: missing: No such file', true),
  ] },
  { id: 'rb', label: 'review', phase: 'Review', lines: [
    use(45, 'b1', 'Read', { file_path: '/w/src/x.js' }), res(46, 'b1', 'contents'),
    use(60, 'b2', 'Bash', { command: 'node test_y.mjs' }), res(65, 'b2', '3 passed, 0 failed'),
  ] },
]);
{
  const inc = incidents(IB);
  const by = (type) => inc.filter((i) => i.type === type);
  check('incidents gathers a failing test run, a commit that did not happen and a failed call', inc.length === 3 && by('test-failure').length === 1 && by('commit-failed').length === 1 && by('tool-error').length === 1, JSON.stringify(inc.map((i) => `${i.type}:${i.cmd}`)));
  check('retries of the same command by the same agent are one incident, counted', by('tool-error')[0].occurrences === 2 && by('tool-error')[0].events.length === 2);
  check('the same command coming back ok later is direct recovery evidence', by('test-failure')[0].recovered?.how === 'same-ok' && by('test-failure')[0].recovered.strength === 'direct');
  check('a failure nothing answered is unresolved, and the unresolved come first', !by('commit-failed')[0].recovered && !by('tool-error')[0].recovered && inc[inc.length - 1].type === 'test-failure');
  const ls = by('tool-error')[0];
  const d = investigate(IB, ls.id);
  check('investigate gives the failing call with its result and both transcript lines', d.failing.text === 'ls missing' && d.failing.out.includes('No such file') && d.failing.line === 9 && d.failing.rline === 10, JSON.stringify(d.failing));
  check('investigate gives the agent\'s steps before and after it', d.before.length === 5 && d.before.at(-1).kind === 'commit' && d.before[1].kind === 'error' && d.after.length >= 1 && d.after.some((e) => e.text === 'ls missing'), JSON.stringify(d.before.map((e) => e.kind)));
  check('investigate gives the other agents\' events within two minutes, and the tests after', d.around.some((e) => e.agent === 'rb' && e.kind === 'read') && d.testsAfter.some((e) => e.agent === 'rb' && e.outcome === 'passed'));
  check('investigate gives the files the agent edited just before it failed', d.files.length === 1 && d.files[0].path === '/w/src/x.js');
  check('a retry\'s own event id opens the same incident', investigate(IB, ls.events[1]).incident.id === ls.id);
  check('an id that is no incident gives nothing', investigate(IB, 'ra#999') === null);
  const tf = investigate(IB, by('test-failure')[0].id);
  check('a failing test run shows its failing cases', tf.failing.tests.cases.some((x) => x.name === 'subtracts' && x.result === 'failed'));
  const withLog = { ...IB, logs: [{ name: 'unit.log', path: '/s/unit.log', mtime: now, verdict: 'failed', tally: '1 passed, 1 failed', fails: [' FAIL  z'], outcome: { format: 'house', passed: 1, failed: 1, cases: [{ name: 'z', result: 'failed' }] } }], reported: [{ name: 'lane test', result: 'failed', said: 'FAILED' }] };
  check('a failing log in the run\'s own scratch folder and a failing reported test are incidents too', incidents(withLog).some((i) => i.type === 'log-failure') && incidents(withLog).some((i) => i.type === 'reported-failure'));
  check('a log that is not tied to the run is not one of its incidents', !incidents({ ...withLog, logsUnattributed: true }).some((i) => i.type === 'log-failure'));
  check('a log or reported failure says there is no step to look around', investigate(withLog, 'log:unit.log').failing === null && /no transcript step/.test(investigate(withLog, 'log:unit.log').note));
}

/* ---------- the archive (R03) ---------- */

{
  const pq = parseQuery('ui-check file:shader.js "two words" status:killed nope:x');
  check('parseQuery reads words, quoted phrases and field:value, and keeps an unknown field as a word',
    pq.terms.join('|') === 'ui-check|two words|nope:x' && pq.fields.file[0] === 'shader.js' && pq.fields.status[0] === 'killed', JSON.stringify(pq));
  const ARCH = path.join(TMP, 'state', 'archive');
  const ca = createCollector({ root: ROOT });
  const a = createArchive({ dir: ARCH, collector: ca, pauseMs: 0, readPauseMs: 0 });
  const r1 = await a.refresh(SLUG);
  const st1 = a.status(SLUG);
  check('refresh indexes every run of the project and keeps it in the state folder', r1.updated === 3 && st1.indexed === 3 && st1.total === 3 && fs.existsSync(path.join(ARCH, `${SLUG}.json`)), JSON.stringify(st1));
  const e0 = a.entry(SLUG, 'wf_fixture-000');
  const e1 = a.entry(SLUG, 'wf_fixture-001');
  check('a finished run is read in full; the running one gets a light entry, marked live', e0.deep === true && e0.live === false && e1.live === true && e1.deep === false, `${e0.deep} ${e0.live} ${e1.live}`);
  const e2 = a.entry(SLUG, 'wf_fixture-002');
  check('an unfinished run is read in full: its labels, phases and the agent\'s words are indexed', e2.deep === true && e2.labels[0] === 'build:left' && e2.terms.includes('build:left'), JSON.stringify({ deep: e2.deep, labels: e2.labels }));
  check('an entry keeps the run\'s arguments so a finished run can be titled without its session', e1.args?.branch === 'feature-x' && e1.args?.title === 'Fixture piece');
  const r2 = await a.refresh(SLUG);
  check('a second refresh reads only what changed: the live run', r2.updated === 1, JSON.stringify(r2));
  const page = a.list(SLUG, { offset: 0, limit: 2 });
  check('list pages the runs newest first, without their search text', page.total === 3 && page.rows.length === 2 && page.rows[0].started >= page.rows[1].started && page.rows[0].terms === undefined);
  check('list filters by status', a.list(SLUG, { status: 'completed' }).rows.map((x) => x.id).join() === 'wf_fixture-000');

  // The live run finishes: its record is written, and the next refresh reads it in full.
  write(path.join(PROJ, SESSION, 'workflows', 'wf_fixture-001.json'), JSON.stringify({ runId: 'wf_fixture-001', workflowName: 'fixture-wf', status: 'completed', startTime: now - 600000, durationMs: 590000, totalTokens: 999, totalToolCalls: 6, phases: [{ title: 'Design' }, { title: 'Build' }, { title: 'Review' }] }));
  await a.refresh(SLUG);
  const f1 = a.entry(SLUG, 'wf_fixture-001');
  check('a run that finishes is read in full on the next refresh: commands, files, errors, tests',
    f1.live === false && f1.deep === true && f1.commands.some((x) => x.startsWith('npm test')) && f1.files.some((x) => x.p.endsWith('d.js')) && f1.errors[0]?.text === 'No such file' && f1.tests.cases['two broke'] === 'failed' && f1.tests.sources['scratch-log'] >= 1,
    JSON.stringify({ live: f1.live, cmds: f1.commands, cases: f1.tests.cases }));
  const hit = (q) => a.search(SLUG, q).rows.map((x) => x.id).join();
  check('search finds a run by a command, a file, a test case and an error', hit('npm test') === 'wf_fixture-001' && hit('file:d.js') === 'wf_fixture-001' && hit('test:two') === 'wf_fixture-001' && hit('error:"no such file"') === 'wf_fixture-001', `${hit('npm test')}|${hit('file:d.js')}|${hit('test:two')}`);
  check('search needs every word, and field:value narrows by status', hit('npm nothing-like-this') === '' && hit('status:completed design') !== '' && hit('status:killed') === '');
  const sr = a.search(SLUG, 'cmd:ls');
  check('a search result says which line matched', sr.rows[0]?.hits?.[0]?.field === 'cmd' && sr.rows[0].hits[0].text.startsWith('ls'), JSON.stringify(sr.rows[0]?.hits));
  check('an empty query finds nothing rather than everything', a.search(SLUG, '   ').total === 0);

  // A run whose folder is gone keeps its entry, marked unavailable.
  fs.renameSync(LEFT, `${LEFT}.moved`);
  await a.refresh(SLUG);
  check('a run whose files are gone keeps its entry, marked unavailable', a.entry(SLUG, 'wf_fixture-002')?.available === false && a.status(SLUG).gone === 1);
  fs.renameSync(`${LEFT}.moved`, LEFT);
  await a.refresh(SLUG);
  check('and it is read again when its files come back', a.entry(SLUG, 'wf_fixture-002')?.available === true && a.status(SLUG).gone === 0);

  // A new archive object reads the file it left; an older index format is rebuilt.
  const b = createArchive({ dir: ARCH, collector: ca, pauseMs: 0, readPauseMs: 0 });
  check('the index survives a restart', b.status(SLUG).indexed === 3 && (await b.refresh(SLUG)).updated === 0);
  const raw = JSON.parse(fs.readFileSync(path.join(ARCH, `${SLUG}.json`), 'utf8'));
  raw.v = INDEX_VERSION - 1;
  fs.writeFileSync(path.join(ARCH, `${SLUG}.json`), JSON.stringify(raw));
  const c3 = createArchive({ dir: ARCH, collector: ca, pauseMs: 0, readPauseMs: 0 });
  check('an index written in an older format is rebuilt', c3.status(SLUG).indexed === 0 && (await c3.refresh(SLUG)).updated === 3);
  fs.rmSync(path.join(PROJ, SESSION, 'workflows', 'wf_fixture-001.json'));
  ca.close();
}

/* ---------- the timeline (R04) ---------- */

{
  const tl = timeline(IB);
  check('the timeline has a lane per agent with its phase and count', tl.lanes.length === 2 && tl.lanes[0].label === 'build' && tl.lanes[0].phase === 'Build' && tl.lanes[1].count === 2 && tl.lanes[0].count === 9, JSON.stringify(tl.lanes));
  check('its events are in time order across agents', tl.events.every((e, i) => i === 0 || tl.events[i - 1].t <= e.t) && tl.events.some((e) => e.agent === 'rb') && tl.total === tl.events.length);
  const rbRead = tl.events.findIndex((e) => e.agent === 'rb' && e.kind === 'read');
  check('another agent\'s event falls between this agent\'s by its time', tl.events[rbRead - 1].agent === 'ra' && tl.events[rbRead + 1].agent === 'ra');
  check('the range spans the first event to the last result, with buckets per lane', tl.range.start === Date.parse(T(0)) && tl.range.end === Date.parse(T(65)) && tl.buckets.length === 2 && tl.buckets[0].events.length === 120 && tl.buckets[0].errors.reduce((a, b) => a + b, 0) >= 3);
  const win = timeline(IB, { from: Date.parse(T(40)), to: Date.parse(T(46)) });
  check('a window gives only the events inside it', win.events.length > 0 && win.events.every((e) => e.t >= Date.parse(T(40)) && e.t <= Date.parse(T(46))));
  check('kinds narrow the events, and a limit cuts the list and says so', timeline(IB, { kinds: ['error'] }).events.every((e) => e.kind === 'error') && timeline(IB, { limit: 3 }).truncated === true && timeline(IB, { limit: 3 }).events.length === 3);
  const tie = bundleFrom([
    { id: 'x', label: 'x', lines: [{ type: 'assistant', timestamp: T(10), message: { content: [{ type: 'text', text: 'same' }] } }, { type: 'assistant', message: { content: [{ type: 'text', text: 'no time' }] } }] },
    { id: 'y', label: 'y', lines: [{ type: 'assistant', timestamp: T(10), message: { content: [{ type: 'text', text: 'same' }] } }] },
  ]);
  const tt = timeline(tie);
  check('two agents\' events in the same millisecond are marked as ties', tt.ties === 1 && tt.events.every((e) => e.tie === true));
  check('an event without a time is counted, not placed', tt.untimed === 1 && tt.events.length === 2);
}

/* ---------- tests, comparison, files (R06, R05, R08) ---------- */

{
  const cs = casesOf(IB);
  check('casesOf reads named cases from test output, the last result winning, and marks a case that flipped in the run',
    cs.adds?.result === 'passed' && cs.subtracts?.result === 'passed' && cs.subtracts.flipped === true && cs.adds.flipped === false && cs.subtracts.source === 'tool-result' && cs.subtracts.runs === 2, JSON.stringify(cs));
  const ent = (id, name, ago, cases, extra = {}) => ({ id, name, title: id, started: now - ago, status: 'completed', tests: { cases }, ...extra });
  const entries = [ent('e1', 'w', 1000, { adds: 'passed', subtracts: 'failed', gone: 'failed' }), ent('e2', 'w', 2000, { adds: 'failed', subtracts: 'failed' }), ent('e3', 'other', 500, { adds: 'failed' })];
  const rg = regression({ id: 'now', name: 'w', started: now, cases: { adds: { result: 'failed', source: 'tool-result' }, subtracts: { result: 'passed', source: 'scratch-log' }, fresh: 'passed' } }, entries);
  const byName = Object.fromEntries(rg.cases.map((x) => [x.name, x]));
  check('regression compares with earlier runs of the same workflow, newest first', rg.basis === 'same workflow' && rg.compared.map((x) => x.id).join() === 'e1,e2');
  check('it names a new failure, a recovery and a new case, with each case\'s history oldest first',
    byName.adds.class === 'flaky-candidate' && byName.subtracts.class === 'recovered' && byName.fresh.class === 'new' && byName.subtracts.history.map((h) => h.result).join() === 'failed,failed', JSON.stringify(rg.cases));
  const rg2 = regression({ id: 'now', name: 'w', started: now, cases: { adds: 'failed' } }, [ent('e1', 'w', 1000, { adds: 'passed' })]);
  check('a case that passed last time and fails now is a new failure, listed first', rg2.cases[0].class === 'new-failure' && rg2.counts['new-failure'] === 1);
  check('with no earlier run of the workflow it compares with any earlier run, and with none it says every case is new',
    regression({ id: 'n', name: 'zz', started: now, cases: { adds: 'passed' } }, entries).basis === 'any earlier run' && regression({ id: 'n', name: 'zz', started: now - 1e9, cases: { adds: 'passed' } }, entries).basis === 'none');

  const A = { ...ent('a', 'w', 5000, { t1: 'passed', t2: 'failed' }), tokens: 100, tokensKind: 'total', toolCalls: 10, agents: 2, deep: true, outcomes: { errors: 1 }, files: [{ p: '/w/a.js' }, { p: '/w/b.js' }], commits: [{ hash: 'abc', subject: 's' }] };
  const B = { ...ent('b', 'w', 1000, { t1: 'passed', t2: 'passed', t3: 'passed' }), tokens: 80, tokensKind: 'output', toolCalls: 12, agents: 2, deep: true, outcomes: { errors: 0 }, files: [{ p: '/w/b.js' }, { p: '/w/c.js' }], commits: [] };
  const cmp = compare(A, B);
  const rowOf = (k) => cmp.rows.find((r) => r.key === k);
  check('compare marks total against output tokens as not comparable, and says why', rowOf('tokens').comparable === false && /total tokens against output/.test(rowOf('tokens').note));
  check('compare marks what changed and what did not', rowOf('toolCalls').changed === true && rowOf('agents').changed === false && rowOf('errors').changed === true);
  check('compare lists the test cases whose result differs, and the files only one run touched',
    cmp.testsChanged === 2 && cmp.tests.find((t) => t.name === 't3').a === null && cmp.files.onlyA.join() === '/w/a.js' && cmp.files.onlyB.join() === '/w/c.js' && cmp.files.both.join() === '/w/b.js');
  const rel = related({ ...A, branch: 'x' }, [{ ...B, branch: 'x' }, ent('c', 'other', 10, {}, { files: [] })]);
  check('related suggests runs with the same workflow and branch, each reason said', rel.length === 1 && rel[0].id === 'b' && rel[0].reasons.some((r) => /same workflow/.test(r)) && rel[0].reasons.some((r) => /same branch/.test(r)));
  const eb = entryFromBundle({ ...IB, run: { ...IB.run, name: 'w', status: 'completed', agents: IB.agents, phases: [], totals: { tokens: 5, tokensKind: 'output', toolCalls: 8 } } });
  check('a run the archive has not read in full is compared from a bundle read now', eb.deep === true && eb.tests.cases.adds.result === 'passed' && eb.files.some((f) => f.p === '/w/src/x.js'));

  const CB = bundleFrom([
    { id: 'p', label: 'painter', lines: [use(0, 'p1', 'Edit', { file_path: 'C:\\w\\src\\Shared.js' }), res(1, 'p1', 'ok'), use(30, 'p2', 'Edit', { file_path: 'C:\\w\\src\\Shared.js' }), res(31, 'p2', 'ok'), use(40, 'p3', 'Write', { file_path: 'C:\\w\\src\\only.js' }), res(41, 'p3', 'no', true), use(50, 'p4', 'Edit', { file_path: 'C:\\w\\later.js' }), res(51, 'p4', 'ok')] },
    { id: 'q', label: 'fixer', lines: [use(10, 'q1', 'Edit', { file_path: 'c:/w/src/shared.js' }), res(11, 'q1', 'ok'), use(100, 'q2', 'Edit', { file_path: 'C:\\w\\later.js' }), res(101, 'q2', 'ok'), use(5, 'q3', 'Read', { file_path: 'C:\\w\\src\\only.js' })] },
  ], { git: { branch: [{ hash: 'c0ffee1', subject: 'shared change', at: now, files: ['src/Shared.js'] }] } });
  const fm = fileMap(CB);
  const shared = fm.files.find((f) => /shared\.js$/i.test(f.path));
  const laterF = fm.files.find((f) => /later\.js$/i.test(f.path));
  check('a file two agents edited while the other\'s edits were under way is an overlapping collision',
    shared.collision === 'overlapping' && shared.editors === 2 && (process.platform !== 'win32' || fm.files.filter((f) => /shared\.js$/i.test(f.path)).length === 1), JSON.stringify(shared));
  check('a file two agents edited at separate times is a possible collision only', laterF.collision === 'possible' && fm.counts.collisions === 2 && fm.counts.overlapping === 1);
  check('a failed write counts as an edit that did not come back ok, and a read is counted apart', fm.files.find((f) => f.path.endsWith('only.js')).editsFailed === 1 && fm.files.find((f) => f.path.endsWith('only.js')).reads === 1);
  check('a commit on the branch is matched to the file it changed by the end of its path', shared.commits[0]?.hash === 'c0ffee1' && laterF.commits.length === 0);
  check('collisions come first, and the note says what cannot be seen', fm.files[0].collision && /shell command/.test(fm.note));
  const hs = history(CB, 'C:\\w\\src\\Shared.js');
  check('a file\'s history lists every event that named it, in time order', hs.map((e) => e.agent).join() === (process.platform === 'win32' ? 'p,q,p' : 'p,p') && hs[0].kind === 'edit');
}

/* ---------- profile and handoff (R09, R10) ---------- */

{
  const pf = profile({ ...IB, run: { ...IB.run, started: Date.parse(T(0)), ended: Date.parse(T(65)), phases: [{ title: 'Build', state: 'done', start: Date.parse(T(0)), end: Date.parse(T(51)), agents: ['ra'] }, { title: 'Review', state: 'done', start: Date.parse(T(45)), end: Date.parse(T(65)), agents: ['rb'] }] } });
  check('profile keeps wall clock and observed tool time apart', pf.wall === 65000 && pf.tool === 20000, `${pf.wall} ${pf.tool}`);
  check('it finds two agents working at once', pf.concurrency.peak === 2 && pf.concurrency.average > 1);
  check('it lists commands retried after failing, and test runs repeated before a pass',
    pf.rework.retries.some((r) => r.sig === 'ls missing' && r.times === 2 && r.failed === 2) && pf.rework.retries.some((r) => r.sig === 'npm test' && r.failed === 1) && pf.rework.reruns.length === 1 && pf.rework.reruns[0].failedRuns === 1, JSON.stringify(pf.rework));
  check('it orders the phases and says how long one waited for the one before', pf.phases.map((p) => p.title).join() === 'Build,Review' && pf.phases[1].waitBefore === 0 && pf.longest[0].ms === 5000);
  const gap = bundleFrom([{ id: 'g', label: 'g', lines: [{ type: 'assistant', timestamp: T(0), message: { content: [{ type: 'text', text: 'a' }] } }, { type: 'assistant', timestamp: T(200), message: { content: [{ type: 'text', text: 'b' }] } }] }]);
  const pg = profile({ ...gap, run: { ...gap.run, ended: Date.parse(T(200)), phases: [] } });
  check('a stretch of two minutes or more with no line from any agent is unobserved, not idle', pg.unobserved.total === 200000 && pg.notes.some((n) => /not idle|cause is not known/.test(n)));

  // Insights: the run as series, and the project's runs as trends.
  const ins = runInsights({ ...IB, run: { ...IB.run, phases: [] } }, [{ path: 'a.js', edits: 2, reads: 1 }, { path: 'b.js', edits: 0, reads: 5 }]);
  const timedEvents = IB.agents.reduce((s, a) => s + a.events.filter((e) => e.t).length, 0);
  const counted = ins.activity.buckets.reduce((s, b) => s + KINDS.reduce((n, k) => n + b[k], 0), 0);
  check('insights: activity in whole-step buckets, at most 60, every timed event counted once', ins.activity.buckets.length <= 60 && ins.activity.from % ins.activity.step === 0 && counted === timedEvents, `${counted} of ${timedEvents}`);
  const timedCalls = IB.agents.reduce((s, a) => s + a.events.filter((e) => e.use && Number.isFinite(e.ms)).length, 0);
  check('insights: two agents at once at the peak, and each timed call in exactly one duration band', Math.max(...ins.concurrency.map((x) => x.n)) === 2 && ins.durations.reduce((s, d) => s + d.count, 0) === timedCalls && timedCalls > 0);
  check('insights: the files touched most come first, and the headline figures add up', ins.files[0].path === 'b.js' && ins.kpis.toolCalls === ins.agents.reduce((s, x) => s + x.ok + x.failed + x.open, 0) && ins.kpis.agents === IB.agents.length);
  check('bucketFor keeps a run of any length within 60 whole-step columns', bucketFor(65000) === 5000 && bucketFor(7 * 3600000) === 600000 && bucketFor(40 * 3600000) <= 40 * 3600000 / 1 && 40 * 3600000 / bucketFor(40 * 3600000) <= 60);
  const tr = projectTrends([
    { id: 'b', title: 'B', started: 2000, last: 2600, tokens: 10, tokensKind: 'output', outcomes: {} },
    { id: 'a', title: 'A', started: 1000, ended: 5000, tokens: 20, tokensKind: 'total', outcomes: { toolsFailed: 1, testsPassed: 2, testsFailed: 0, errors: 3, commitsConfirmed: 1 } },
    { id: 'x', title: 'no start' },
  ]);
  check('projectTrends: runs oldest first, tokens kept to their kind, a run with no start left out', tr.runs.map((r) => r.id).join() === 'a,b' && tr.runs[0].wall === 4000 && tr.runs[1].wall === 600 && tr.runs[0].tokensKind === 'total' && tr.runs[1].tokensKind === 'output' && /not comparable/.test(tr.note));

  const CD = path.join(TMP, 'state', 'criteria');
  const c0 = loadCriteria(CD, 'my wf');
  check('with no criteria file, the starter set is used and said to be', c0.source === 'starter' && c0.criteria === STARTER && c0.path.endsWith('my_wf.json'));
  const w1 = writeStarter(CD, 'my wf');
  check('writeStarter writes the starter set once, for editing', w1.written === true && writeStarter(CD, 'my wf').written === false && loadCriteria(CD, 'my wf').source === 'file');
  write(path.join(CD, 'broken.json'), '{nope');
  check('a criteria file that cannot be read says so and falls back to the starter set', loadCriteria(CD, 'broken').source === 'invalid' && !!loadCriteria(CD, 'broken').error);
  const HB = { ...IB, run: { ...IB.run, name: 'w', status: 'completed', why: { label: 'saved run record', basis: 'observed' }, started: now - 9000, ended: now,
    phases: [{ title: 'Build', state: 'done', declared: true }, { title: 'Review', state: 'stopped', declared: true }],
    agents: [{ label: 'build', status: 'done', result: { findings: 2, severity: { high: 1, low: 1 } } }, { label: 'review', status: 'done', result: null }],
    outcomes: { tests: 3, testsPassed: 2, testsFailed: 1, commits: 1, commitsConfirmed: 0 } } };
  const extras = { incidents: incidents(HB), cases: casesOf(HB), files: fileMap(HB).files };
  const crit = [
    { id: 'p', type: 'phases-done', label: 'phases' }, { id: 't', type: 'tests-pass', label: 'tests' }, { id: 'f', type: 'no-unresolved-failures', label: 'failures' },
    { id: 'c', type: 'commits', min: 1, label: 'commit' }, { id: 'r', type: 'result-field', field: 'findings', severity: 'high', max: 0, label: 'review' },
    { id: 'e', type: 'file-edited', match: 'src/x.js', label: 'edited' }, { id: 'a', type: 'agent-done', label: 'review' }, { id: 'n', type: 'result-field', field: 'deferred', max: 0, label: 'deferred' },
  ];
  const ev = Object.fromEntries(evaluate(HB, crit, extras).map((x) => [x.id, x]));
  check('evaluate: an unfinished phase, an unresolved failure, no confirmed commit and a high finding are unsatisfied',
    ev.p.state === 'unsatisfied' && /Review \(stopped\)/.test(ev.p.evidence[0]) && ev.f.state === 'unsatisfied' && ev.c.state === 'unsatisfied' && ev.r.state === 'unsatisfied', JSON.stringify(ev));
  check('evaluate: passing cases, an edited file and a finished agent are satisfied', ev.t.state === 'satisfied' && ev.e.state === 'satisfied' && ev.a.state === 'satisfied');
  check('evaluate: a field no agent reported is not observed, never satisfied', ev.n.state === 'not-observed' && /No agent's result reported deferred/.test(ev.n.evidence[0]));
  check('evaluate: a list stays a list (text and items), so a name holding a separator is never split', typeof ev.f.evidence[0] === 'object' && /unresolved$/.test(ev.f.evidence[0].text) && Array.isArray(ev.f.evidence[0].items) && ev.f.evidence[0].items.length >= 2, JSON.stringify(ev.f.evidence));
  const md = report(HB, { source: 'starter', path: path.join(os.homedir(), 'x.json') }, Object.values(ev), extras, 'md');
  check('the Markdown report has the criteria table, house dates and no home folder', /^# Handoff: B/.test(md) && /\| Criterion \| State \| Evidence \|/.test(md) && /UNSATISFIED/.test(md) && /\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)/.test(md) && !md.includes(os.homedir()) && /starter set is shown, not adopted/.test(md));
  const js = report(HB, { source: 'file', path: 'c' }, Object.values(ev), extras, 'json');
  check('the JSON report carries the results, the unresolved failures and its own note', js.criteria.results.length === 8 && js.unresolved.length >= 2 && /approves/.test(js.note));
}

/* ---------- watchpoints (R07) ---------- */

{
  const NFILE = path.join(TMP, 'state', 'notices.json');
  const cw = createCollector({ root: ROOT });
  const w = createWatch({ collector: cw, file: NFILE });
  const first = await w.tick();
  check('the first look raises no notice about what already happened', first.length === 0 && w.all().length === 0);
  check('attention says which projects have a run going', w.attention()[SLUG]?.running === 1 && w.attention()[MANY]?.running === 0, JSON.stringify(w.attention()));
  fs.appendFileSync(BUILD, line({ type: 'assistant', timestamp: iso(Date.now()), message: { content: [{ type: 'tool_use', id: 'w1', name: 'Bash', input: { command: 'node build.mjs' } }] } }));
  fs.appendFileSync(BUILD, line({ type: 'user', timestamp: iso(Date.now() + 1), message: { content: [{ type: 'tool_result', tool_use_id: 'w1', is_error: true, content: 'build broke' }] } }));
  fs.appendFileSync(BUILD, line({ type: 'assistant', timestamp: iso(Date.now() + 2), message: { content: [{ type: 'tool_use', id: 'w2', name: 'Bash', input: { command: 'node test_build.mjs' } }] } }));
  fs.appendFileSync(BUILD, line({ type: 'user', timestamp: iso(Date.now() + 3), message: { content: [{ type: 'tool_result', tool_use_id: 'w2', content: '  ok   a\n FAIL  b\n\n1 passed, 1 failed' }] } }));
  const second = await w.tick();
  const err = second.find((n) => n.kind === 'error');
  const tf = second.find((n) => n.kind === 'test-failed');
  check('a new error raises a notice that names its run, agent and the call', err && err.run === 'wf_fixture-001' && err.agent === 'bbb2' && /build broke/.test(err.text) && err.event && err.basis === 'observed', JSON.stringify(second));
  check('a test run that reports failures raises its own notice', tf && /1 failed, 1 passed/.test(tf.text));
  check('nothing is raised twice', (await w.tick()).length === 0);
  write(path.join(PROJ, SESSION, 'workflows', 'wf_fixture-001.json'), JSON.stringify({ runId: 'wf_fixture-001', workflowName: 'fixture-wf', status: 'completed', startTime: now - 600000, durationMs: 590000, totalTokens: 1, totalToolCalls: 1, phases: [] }));
  const fin = await w.tick();
  check('a run that finishes raises a notice that says how it is known', fin.length === 1 && fin[0].kind === 'run-finished' && fin[0].evidence === 'saved run record', JSON.stringify(fin));
  fs.rmSync(path.join(PROJ, SESSION, 'workflows', 'wf_fixture-001.json'));
  w.flush();
  const w2 = createWatch({ collector: cw, file: NFILE });
  check('notices are kept in the state folder across a restart', w2.all().length === 3 && fs.existsSync(NFILE));
  let clock = Date.now();
  const quiet = createWatch({ collector: cw, now: () => clock, rules: { quietMinutes: 10 } });
  check('a quiet agent is not noticed on the first look', (await quiet.tick()).length === 0);
  clock += 20 * 60000;
  const q = await quiet.tick();
  check('an agent quiet past the threshold is noticed, said to be inferred', q.length === 1 && q[0].kind === 'quiet' && q[0].agent === 'bbb2' && q[0].basis === 'inferred' && /20 minutes/.test(q[0].text), JSON.stringify(q));
  clock += 5 * 60000;
  check('the same quiet spell is noticed once', (await quiet.tick()).length === 0);
  let clock2 = Date.now();
  const off = createWatch({ collector: cw, now: () => clock2, rules: { quiet: false } });
  await off.tick();
  clock2 += 60 * 60000;
  check('with the quiet rule off, nothing is noticed however long the quiet', (await off.tick()).length === 0);
  cw.close();
}

/* ---------- the server ---------- */

function get(port, p, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method, headers }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], body }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.end();
  });
}

let stopped = false;
const srv = await startServer({ port: 0, root: ROOT, token: 'tok-123', version: VERSION, onStop: () => { stopped = true; }, stateDir: path.join(TMP, 'state-srv'), indexDelayMs: 0 });
const P = srv.port;
const page = await get(P, '/');
check('the page is served as HTML with its policy', page.status === 200 && /text\/html/.test(page.type) && page.body.includes('Content-Security-Policy') && page.body.includes('app.js'));
check('its scripts, stylesheet and icon are served', (await get(P, '/app.js')).status === 200 && (await get(P, '/core.js')).status === 200 && (await get(P, '/archive.js')).status === 200 && (await get(P, '/app.css')).status === 200 && (await get(P, '/favicon.svg')).status === 200);
check('a path outside the allow list is not found', (await get(P, '/lib/collect.mjs')).status === 404 && (await get(P, '/../agent-watch.mjs')).status === 404 && (await get(P, '/app.js/../../lib/server.mjs')).status === 404);
{
  const wf = webFiles();
  check('the file list is made from web/ once, of page files only', wf['/app.js'] && wf['/'] && !Object.keys(wf).some((k) => /\.mjs$|\.md$|\.\./.test(k)) && Object.values(wf).every(([f]) => f.startsWith(path.join(HERE, 'web'))));
}
await srv.archive.refresh(SLUG);
const ar = JSON.parse((await get(P, `/api/archive?project=${SLUG}&limit=2`)).body);
check('/api/archive pages the archive with its status', ar.total === 3 && ar.rows.length === 2 && ar.status.indexed === 3 && ar.status.persisted === true, JSON.stringify(ar.status));
const se = JSON.parse((await get(P, `/api/search?project=${SLUG}&q=${encodeURIComponent('cmd:ls')}`)).body);
check('/api/search answers the runs that match, with the matched lines', se.total >= 0 && Array.isArray(se.rows) && se.q === 'cmd:ls');
check('a run id that is not of the wf_ form is refused before anything is read', (await get(P, `/api/state?project=${SLUG}&run=..%2F..%2Fx`)).status === 400);
check('/api/state carries the archive\'s status', JSON.parse((await get(P, `/api/state?project=${SLUG}`)).body).archive?.indexed === 3);
{
  const inc = JSON.parse((await get(P, `/api/incidents?project=${SLUG}&run=wf_fixture-001`)).body);
  const ls = inc.incidents.find((i) => i.cmd === 'ls');
  check('/api/incidents lists the run\'s failures with counts', inc.run.id === 'wf_fixture-001' && ls?.type === 'tool-error' && inc.counts.total >= 1 && inc.counts.unresolved >= 1, JSON.stringify(inc.counts));
  const dv = await get(P, `/api/investigate?project=${SLUG}&run=wf_fixture-001&event=${encodeURIComponent(ls.id)}`);
  check('/api/investigate opens one incident in full', dv.status === 200 && JSON.parse(dv.body).failing.out.includes('No such file'));
  check('/api/investigate refuses an id of the wrong form and finds no unknown one', (await get(P, `/api/investigate?project=${SLUG}&run=wf_fixture-001&event=..%2Fx`)).status === 400 && (await get(P, `/api/investigate?project=${SLUG}&run=wf_fixture-001&event=aaa1%23999`)).status === 404);
  check('/api/incidents without a run takes the project\'s current run', JSON.parse((await get(P, `/api/incidents?project=${SLUG}`)).body).run.id === 'wf_fixture-001');
  const tlr = JSON.parse((await get(P, `/api/timeline?project=${SLUG}&run=wf_fixture-001&kinds=error,test&limit=50`)).body);
  check('/api/timeline gives the lanes and the events of the kinds asked for', tlr.lanes.length === 2 && tlr.events.length > 0 && tlr.events.every((e) => e.kind === 'error' || e.kind === 'test'), JSON.stringify({ lanes: tlr.lanes?.length, kinds: [...new Set(tlr.events?.map((e) => e.kind))] }));
  await srv.watchTick();
  const nt = JSON.parse((await get(P, '/api/notices')).body);
  check('/api/notices answers while the service watches', nt.watching === true && Array.isArray(nt.notices) && nt.rules.quietMinutes === 10 && typeof nt.attention === 'object');
  const st2 = JSON.parse((await get(P, `/api/state?project=${SLUG}`)).body);
  check('/api/state carries the projects\' attention', st2.watching === true && st2.attention?.[SLUG]?.running === 1);
  const ts = JSON.parse((await get(P, `/api/tests?project=${SLUG}&run=wf_fixture-001`)).body);
  check('/api/tests classifies the run\'s cases against earlier runs', ts.run.id === 'wf_fixture-001' && Array.isArray(ts.cases) && ts.cases.some((x) => x.name === 'b' && x.result === 'failed') && typeof ts.basis === 'string', JSON.stringify(ts.cases?.map((x) => `${x.name}:${x.class}`)));
  const cm = await get(P, `/api/compare?project=${SLUG}&a=wf_fixture-000&b=wf_fixture-002`);
  check('/api/compare lays two runs side by side', cm.status === 200 && JSON.parse(cm.body).rows.some((r) => r.key === 'status'));
  check('/api/compare refuses ids of the wrong form', (await get(P, `/api/compare?project=${SLUG}&a=wf_fixture-000&b=..%2Fx`)).status === 400);
  const rl2 = JSON.parse((await get(P, `/api/related?project=${SLUG}&run=wf_fixture-001`)).body);
  check('/api/related lists related runs with a note that each is inferred', Array.isArray(rl2.related) && /inferred/.test(rl2.note));
  const fl = JSON.parse((await get(P, `/api/files?project=${SLUG}&run=wf_fixture-001`)).body);
  check('/api/files maps the files the run touched', fl.files.some((f) => f.path.endsWith('d.js')) && typeof fl.counts.collisions === 'number');
  const fh = JSON.parse((await get(P, `/api/file?project=${SLUG}&run=wf_fixture-001&path=${encodeURIComponent('C:/a/b/c/d.js')}`)).body);
  check('/api/file gives a file\'s history, and refuses a path with control characters', fh.events.length === 1 && (await get(P, `/api/file?project=${SLUG}&run=wf_fixture-001&path=%01x`)).status === 400);
  const pr2 = JSON.parse((await get(P, `/api/profile?project=${SLUG}&run=wf_fixture-001`)).body);
  const ins2 = JSON.parse((await get(P, `/api/insights?project=${SLUG}&run=wf_fixture-001`)).body);
  check('/api/insights gives the run as series and the project as trends', ins2.run?.run.id === 'wf_fixture-001' && Array.isArray(ins2.run.durations) && Array.isArray(ins2.project?.runs));
  check('/api/profile gives the run\'s time and rework', pr2.run.id === 'wf_fixture-001' && typeof pr2.wall === 'number' && Array.isArray(pr2.rework.retries) && pr2.notes.length === 4);
  const ho = JSON.parse((await get(P, `/api/handoff?project=${SLUG}&run=wf_fixture-001`)).body);
  check('/api/handoff gives each criterion\'s state and a preview of the report', ho.criteria.source === 'starter' && ho.results.length === STARTER.length && /^# Handoff/.test(ho.preview));
  const hmd = await new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: P, path: `/api/handoff?project=${SLUG}&run=wf_fixture-001&format=md` }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], disp: res.headers['content-disposition'], body }));
    });
    req.end();
  });
  check('/api/handoff with format=md downloads the report as a dated Markdown file', hmd.status === 200 && /text\/markdown/.test(hmd.type) && /attachment; filename="handoff-wf_fixture-001-\d{4}-\d{2}-\d{2}\.md"/.test(hmd.disp) && hmd.body.startsWith('# Handoff'));
}
const h = JSON.parse((await get(P, '/api/health')).body);
check('/api/health says the version and the process', h.ok === true && h.version === VERSION && h.pid === process.pid);
const st = JSON.parse((await get(P, `/api/state?project=${SLUG}`)).body);
check('/api/state answers the project\'s state', st.current === 'wf_fixture-001' && st.project.slug === SLUG && st.version === VERSION);
check('/api/state with a slug that names nothing falls back to the newest project', JSON.parse((await get(P, '/api/state?project=..%2F..%2Fwindows')).body).project.slug === SLUG);
check('a request for another host is refused (DNS rebinding)', (await get(P, '/api/state', { headers: { Host: `evil.example:${P}` } })).status === 403);
check('anything but GET is refused', (await get(P, '/api/state', { method: 'POST' })).status === 405 && (await get(P, '/', { method: 'DELETE' })).status === 405);
check('/api/stop refuses a wrong or missing token', (await get(P, '/api/stop', { method: 'POST', headers: { 'X-Agent-Watch-Token': 'nope' } })).status === 403 && (await get(P, '/api/stop', { method: 'POST' })).status === 403);
const stop = await get(P, '/api/stop', { method: 'POST', headers: { 'X-Agent-Watch-Token': 'tok-123' } });
await new Promise((r) => setTimeout(r, 300));
check('/api/stop with the token closes the server', stop.status === 200 && stopped && (await get(P, '/api/health')).status === 0);

/* ---------- other environments: hosts and listening ports ---------- */

check('hostName reads a Host header\'s name without its port, and refuses what is no host name',
  hostName('Preview.Example.COM:443') === 'preview.example.com' && hostName('[::1]:4300') === '::1' && hostName('localhost') === 'localhost' && hostName('a b') === null && hostName('x:y:z') === null && hostName('') === null);
{
  const seen = [];
  const hs = await startServer({ port: 0, root: ROOT, version: VERSION, stateDir: path.join(TMP, 'state-hosts'), indexDelayMs: 0, watch: false, allowHosts: ['preview.example'], onRefused: (n) => seen.push(n) });
  const at = (Host) => get(hs.port, '/api/health', { headers: { Host } });
  check('a name given with allowHosts is answered on any port and in any case, beside localhost',
    (await at('preview.example')).status === 200 && (await at('PREVIEW.example:443')).status === 200 && (await at(`localhost:${hs.port}`)).status === 200);
  const other = await at('other.example:8080');
  check('a name not allowed is refused with the flag that answers it, and is noted once',
    other.status === 403 && other.body.includes('Wrong host: other.example.') && other.body.includes('--allow-host other.example') && (await at('other.example')).status === 403 && seen.join() === 'other.example');
  const junk = await at('no host!');
  check('a Host that is no host name is refused without being repeated back or noted', junk.status === 403 && junk.body === 'Wrong host.' && seen.length === 1);
  await hs.close();
}
{
  const ns = [
    '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1172',
    '  TCP    127.0.0.1:5390         0.0.0.0:0              LISTENING       4242',
    '  TCP    0.0.0.0:5391           0.0.0.0:0              LISTENING       4243',
    '  TCP    192.168.1.9:5392       0.0.0.0:0              LISTENING       9',
    '  TCP    127.0.0.1:5390         127.0.0.1:61000        ESTABLISHED     4242',
  ].join('\r\n');
  check('netstat gives the ports in range on loopback or every address, with their processes',
    JSON.stringify(listeningPorts(ns, 5390, 5392)) === JSON.stringify([{ port: 5390, pid: 4242 }, { port: 5391, pid: 4243 }]));
  const ssOut = [
    'LISTEN 0      511        127.0.0.1:5390      0.0.0.0:*    users:(("node",pid=4242,fd=21))',
    'LISTEN 0      4096         0.0.0.0:5391      0.0.0.0:*',
    'LISTEN 0      511            [::1]:5392         [::]:*    users:(("vite",pid=77,fd=3))',
    'LISTEN 0      511         10.0.0.4:5393      0.0.0.0:*    users:(("x",pid=1,fd=3))',
  ].join('\n');
  check('ss gives them on Linux, with a process only where ss could see one',
    JSON.stringify(listeningPorts(ssOut, 5390, 5393)) === JSON.stringify([{ port: 5390, pid: 4242 }, { port: 5391, pid: null }, { port: 5392, pid: 77 }]));
  const asked = [];
  const lc = createCollector({ root: ROOT, platform: 'linux', execFn: async (cmd, args) => { asked.push([cmd, ...args].join(' ')); return ssOut; } });
  const ls = await lc.state(SLUG);
  check('on Linux the Live state asks ss for the run\'s ports and says so', asked.includes('ss -Hltnp') && ls.ports.map((p) => p.port).join() === '5390,5391' && ls.portsWhy.method === 'ss');
  lc.close();
  const none = [];
  const dc = createCollector({ root: ROOT, platform: 'darwin', execFn: async (cmd) => { none.push(cmd); return ''; } });
  const ds = await dc.state(SLUG);
  check('a platform with no port listing asks nothing and says the ports are unavailable', none.length === 0 && ds.ports.length === 0 && ds.portsWhy.completeness === 'unavailable');
  dc.close();
  const proc4 = [
    '  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode',
    '   0: 0100007F:150E 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 12345 1 0000000000000000 100 0 0 10 0',
    '   1: 00000000:150F 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 12346 1 0000000000000000 100 0 0 10 0',
    '   2: 0400000A:1511 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 12347 1 0000000000000000 100 0 0 10 0',
    '   3: 0100007F:150E 0100007F:D431 01 00000000:00000000 00:00000000 00000000     0        0 12348 1 0000000000000000 20 4 30 10 -1',
  ].join('\n');
  const proc6 = '   0: 00000000000000000000000001000000:1510 00000000000000000000000000000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 22345 1 0000000000000000 100 0 0 10 0';
  check('/proc/net/tcp and tcp6 give the ports in range listening on loopback or every address',
    JSON.stringify(procListening(`${proc4}\n${proc6}`, 5390, 5393)) === JSON.stringify([{ port: 5390, pid: null }, { port: 5391, pid: null }, { port: 5392, pid: null }]));
  const pc = createCollector({ root: ROOT, platform: 'linux', execFn: async () => '', readProc: (p) => (p.endsWith('tcp6') ? proc6 : proc4) });
  const ps = await pc.state(SLUG);
  check('on Linux without ss the Live state reads the kernel\'s table and says so', ps.ports.map((p) => p.port).join() === '5390,5391' && ps.portsWhy.method === 'proc-net', JSON.stringify(ps.ports));
  pc.close();
  check('a script run from a tests folder is a test run, behind flock and env too; reading one is not',
    kindOf('Bash', { command: 'flock /tmp/pp.lock env PYTHONPATH=. python tests/workspace.py' }) === 'test'
    && kindOf('Bash', { command: '/usr/bin/python3.12 -u /work/pp/tests/run_all.py' }) === 'test'
    && kindOf('Bash', { command: 'node tests/interact.mjs' }) === 'test'
    && kindOf('Bash', { command: 'cat tests/workspace.py' }) === 'tool'
    && kindOf('Bash', { command: 'python scripts/build.py' }) === 'tool'
    && kindOf('Bash', { command: 'python -m http.server --directory tests/' }) === 'tool');
}

/* ---------- the command line ---------- */

const cli = (...a) => spawnSync(process.execPath, [path.join(HERE, 'agent-watch.mjs'), ...a], { encoding: 'utf8', env: { ...process.env, AGENT_WATCH_STATE: path.join(TMP, 'state') } });
check('--version prints the version', cli('--version').stdout.trim() === VERSION);
const help = cli('--help');
check('--help lists the commands and options', help.status === 0 && /serve/.test(help.stdout) && /--project/.test(help.stdout));
check('an unknown option exits 2 and says so', cli('serve', '--nope').status === 2 && /Unknown option/.test(cli('serve', '--nope').stderr));
check('a bad port exits 2', cli('serve', '--port', '99999').status === 2);
check('--allow-host refuses a wildcard or a name with spaces, exit 2', cli('serve', '--allow-host', '*').status === 2 && /no wildcard/.test(cli('serve', '--allow-host', '*').stderr) && cli('serve', '--allow-host', 'a b').status === 2);
const pr = cli('projects', '--root', ROOT);
check('projects lists the fixture project with its folder', pr.status === 0 && pr.stdout.includes('my-project') && pr.stdout.includes(CWD), pr.stdout);
check('status with nothing running says so', /not running/.test(cli('status').stdout));
check('stop with nothing running says so', cli('stop').status === 0 && /not running/.test(cli('stop').stdout));
check('a project given by its path resolves to its slug', resolveProject(ROOT, 'C:\\fixture\\work\\my-project') === SLUG && resolveProject(ROOT, SLUG) === SLUG);
let threw = false;
try {
  resolveProject(ROOT, 'C:\\nowhere');
} catch {
  threw = true;
}
check('a project that matches nothing is an error, not a guess', threw);
check('a project can be given by its folder\'s name too', resolveProject(ROOT, 'my-project') === SLUG);
{
  const ix = cli('index', '--root', ROOT, '--project', 'my-project');
  check('index builds the archive and says where it is kept', ix.status === 0 && /3 runs indexed/.test(ix.stdout) && ix.stdout.includes(path.join(TMP, 'state', 'archive')), ix.stdout + ix.stderr);
  const rl = cli('runs', '--root', ROOT, '--project', 'my-project', '--status', 'completed');
  check('runs lists the archive, filtered by status', rl.status === 0 && /1 runs completed/.test(rl.stdout) && rl.stdout.includes('wf_fixture-000') && !rl.stdout.includes('wf_fixture-002'), rl.stdout);
  const sr = cli('search', 'design', '--root', ROOT, '--project', 'my-project');
  check('search lists the runs that match with the lines that matched', sr.status === 0 && /match "design"/.test(sr.stdout), sr.stdout + sr.stderr);
  check('search with no words exits 1 and says what it needs', cli('search', '--root', ROOT).status === 1);
  check('a bad --status exits 2', cli('runs', '--status', 'DROP TABLE').status === 2);
  const nc = cli('notices');
  check('notices with no service running reads the notices kept from the last run', nc.status === 0 && /3 notices from the notices kept/.test(nc.stdout) && /build broke/.test(nc.stdout), nc.stdout + nc.stderr);
  check('a bad --quiet-alert exits 2', cli('serve', '--quiet-alert', '-5').status === 2 && cli('serve', '--quiet-alert', 'x').status === 2);
  const hd = cli('handoff', '--root', ROOT, '--project', 'my-project', '--run', 'wf_fixture-000');
  check('handoff prints the report for a run', hd.status === 0 && /^# Handoff: Earlier piece/.test(hd.stdout), hd.stdout.slice(0, 200) + hd.stderr);
  const outFile = path.join(TMP, 'handoff.json');
  const hj = cli('handoff', '--root', ROOT, '--project', 'my-project', '--run', 'wf_fixture-000', '--format', 'json', '--out', outFile);
  check('handoff --format json --out writes the report to a file and says so', hj.status === 0 && /written to/.test(hj.stdout) && JSON.parse(fs.readFileSync(outFile, 'utf8')).run.id === 'wf_fixture-000');
  const cr = cli('criteria', '--root', ROOT, '--project', 'my-project', '--workflow', 'fixture-wf');
  check('criteria writes the starter set into the state folder, once', cr.status === 0 && /Wrote the starter criteria/.test(cr.stdout) && fs.existsSync(path.join(TMP, 'state', 'criteria', 'fixture-wf.json')) && /criteria are in/.test(cli('criteria', '--root', ROOT, '--workflow', 'fixture-wf').stdout));
  check('a bad --run or --format exits 2', cli('handoff', '--run', '../x').status === 2 && cli('handoff', '--format', 'pdf').status === 2);
}

/* ---------- the page scripts ---------- */

for (const f of fs.readdirSync(path.join(HERE, 'web')).filter((x) => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(HERE, 'web', f), 'utf8');
  check(`${f} never writes HTML from data (no innerHTML, outerHTML or insertAdjacentHTML)`, !/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src));
  check(`${f} sets no style attribute the page's policy would refuse`, !/setAttribute\('style'|style:\s*`/.test(src));
}
{
  const html = fs.readFileSync(path.join(HERE, 'web', 'index.html'), 'utf8');
  check('the page has no inline script or style attribute its policy would refuse', !/<script(?![^>]*\bsrc=)[^>]*>/.test(html) && !/\sstyle="/.test(html) && /<script type="module" src="app.js">/.test(html));
  const ids = [...new Set([...fs.readdirSync(path.join(HERE, 'web')).filter((x) => x.endsWith('.js')).flatMap((f) => [...fs.readFileSync(path.join(HERE, 'web', f), 'utf8').matchAll(/\$\('([\w-]+)'\)/g)].map((m) => m[1]))])];
  const made = new Set(fs.readdirSync(path.join(HERE, 'web')).filter((x) => x.endsWith('.js')).flatMap((f) => [...fs.readFileSync(path.join(HERE, 'web', f), 'utf8').matchAll(/\bid: '([\w-]+)'/g)].map((m) => m[1])));
  const missing = ids.filter((id) => !html.includes(`id="${id}"`) && !made.has(id));
  check('every element the scripts look up by id is in the page', missing.length === 0, missing.join(', '));
  const css = fs.readFileSync(path.join(HERE, 'web', 'app.css'), 'utf8');
  check('a hidden view stays hidden though its layout sets display', /\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(css));
  const appSrc = fs.readFileSync(path.join(HERE, 'web', 'app.js'), 'utf8');
  const loose = fs.readdirSync(path.join(HERE, 'web')).filter((x) => x.endsWith('.js') && x !== 'core.js').flatMap((f) => (fs.readFileSync(path.join(HERE, 'web', f), 'utf8').match(/replaceChildren\((?!\)|\.\.\.|el\(|icon\()[^\n]{0,40}/g) || []).map((m) => `${f}: ${m}`));
  check('no element is filled with what may be null (it would print "null"); fill() leaves it out', loose.length === 0 && !!appSrc, loose.join(' | '));
  // The logo: the page inlines Dennis's master so it can colour and move the parts. The inline
  // copy is made from the master, never edited by hand, so the two must carry the same shapes.
  const pathsOf = (src) => [...src.matchAll(/<path\b[^>]*>/g)].map((m) => ({ cls: (/\sclass="([^"]+)"/.exec(m[0]) || [])[1] || '', d: (/\sd="([^"]+)"/.exec(m[0]) || [])[1] || '' }));
  const master = pathsOf(fs.readFileSync(path.join(HERE, 'web', 'assets', 'agent-watch-logo.svg'), 'utf8'));
  const inline = pathsOf((/<!-- logo:[\s\S]*?<!-- \/logo -->/.exec(html) || [''])[0]);
  check('the page\'s logo is the master logo, shape for shape and class for class', master.length > 0 && inline.length === master.length && inline.every((p, i) => p.d === master[i].d && p.cls === master[i].cls), `${inline.length} inline, ${master.length} in the master`);
  const figure = new Set(master.filter((p) => /aw-(suit|visor|cuff|eye)\b/.test(p.cls)).map((p) => p.d));
  const fav = pathsOf(fs.readFileSync(path.join(HERE, 'web', 'favicon.svg'), 'utf8'));
  check('the favicon\'s figure is the master\'s figure', fav.length > 0 && fav.every((p) => figure.has(p.d)), `${fav.filter((p) => !figure.has(p.d)).length} of ${fav.length} favicon shapes are not in the master`);
  const roles = ['aw-suit', 'aw-visor', 'aw-cuff', 'aw-eye', 'aw-flow', 'aw-arrow'];
  const uncoloured = roles.filter((r) => !new RegExp(`\\.brand-logo \\.${r}\\b[^{]*\\{[^}]*\\bfill:`).test(css) && !new RegExp(`\\.brand-logo \\.[\\w-]+, \\.brand-logo \\.${r}\\b[^{]*\\{[^}]*\\bfill:`).test(css));
  check('the stylesheet colours every part of the logo', uncoloured.length === 0, uncoloured.join(', '));
  check('logo-sync --check finds the page\'s copy and the favicon made from the master', logoSync({ check: true }).stale.length === 0);
  // The masthead's contents sit in the cards' column: one width and one gutter for all three.
  const column = ['.top-inner', '.views-inner', '.page'].filter((s) => { const r = new RegExp(`(^|\\n)${s.replace('.', '\\.')} \\{[^}]*max-width: var\\(--page-max\\)[^}]*\\}`).exec(css); return r && /var\(--page-pad\)/.test(r[0]); });
  check('the header, the view tabs and the page share one column, so their edges line up', column.length === 3 && /\.masthead \{[^}]*position: sticky/.test(css) && !/\n\.views \{[^}]*sticky/.test(css), column.join(', '));
  // Colours live in the two theme blocks only, so a theme is one place to change.
  let inTheme = false;
  const literals = css.split('\n').filter((l) => {
    if (/^(:root|\[data-theme="sentinel"\]) \{/.test(l)) inTheme = true;
    else if (inTheme && l.startsWith('}')) { inTheme = false; return false; }
    return !inTheme && !l.trim().startsWith('/*') && /#[0-9A-Fa-f]{3,8}\b|rgba?\(/.test(l);
  });
  check('no colour is written outside the two theme blocks', literals.length === 0, literals.slice(0, 3).join(' | '));
  // The fallback for browsers that cannot style the list sits in its own exclusive block: written
  // unconditionally, appearance: none outranked the enhancement and stopped the masthead's list opening.
  const fallback = (/@supports not \(appearance: base-select\) \{([\s\S]*?)\n\}/.exec(css) || [])[1] || '';
  check('every dropdown opens in the page\'s own style, and its fallback is only for browsers that need it',
    /@supports \(appearance: base-select\)[\s\S]*::picker\(select\)/.test(css) && /appearance: none/.test(fallback) && css.split('appearance: none').length === fallback.split('appearance: none').length);
  check('a one-column view is one column: its rule outranks the Live grid that comes later', /\.page\.page-one \{[^}]*grid-template-columns: minmax\(0, 1fr\)/.test(css));
  check('Live is the service\'s state, first in the masthead\'s right-hand group, with the time of its last answer', /<div class="top-right">\s*<div class="meter service">\s*<span class="meter-label">Service<\/span>\s*<span class="pulse" id="pulse"[^>]*>[\s\S]*?id="pulse-text"[\s\S]*?id="pulse-time"/.test(html));
  check('the name stands over its line alone, the line fitted to the name\'s width with arrowheads between its words', /<div class="brand-text">\s*<h1>Agent Watch<\/h1>\s*<p class="brand-sub" id="brand-sub"><span>Claude<\/span><svg class="brand-arrow"[^>]*aria-hidden="true"[\s\S]*?<span>Code<\/span><svg class="brand-arrow"[^>]*aria-hidden="true"[\s\S]*?<span>workflows<\/span><\/p>/.test(html) && /function fitBrand\(\)/.test(appSrc) && /document\.fonts\?\.ready\.then\(fitBrand\)/.test(appSrc));
  const tiny = drawingOf('<svg viewBox="0 0 9 9"><title>x</title><g transform="t1"><path class="aw-suit" d="M0"/><g><path class="aw-arrow aw-f3" d="M1"/></g></g><metadata><g/></metadata></svg>');
  check('logo-sync keeps the master\'s groups, transforms and paint order', inlineOf(tiny) === '<svg class="brand-logo" viewBox="0 0 9 9" role="img" aria-labelledby="brand-logo-title"><title id="brand-logo-title">Agent Watch</title><g transform="t1"><path class="aw-suit" d="M0"/><g><path class="aw-arrow aw-f3" d="M1"/></g></g></svg>' && figureOf(tiny) === '<g transform="t1"><path fill="#C9A84C" d="M0"/></g>', inlineOf(tiny));
  let unnamed = '';
  try { drawingOf('<svg viewBox="0 0 9 9"><path id="path9" d="M2"/></svg>'); } catch (err) { unnamed = err.message; }
  check('logo-sync refuses a shape no part class names, rather than guess', /path9/.test(unnamed), unnamed);
}

/* ---------- sessions: every Claude Code session on the machine ---------- */

{
  const SR = path.join(TMP, 'projects-sessions');
  const SREG = path.join(TMP, 'registry');
  const SCWD = 'C:\\fixture\\work\\live-app';
  const SSLUG = slugFor(SCWD);
  const SID = '0a1b2c3d-1111-4222-8333-944455556666';
  const OLD = '0a1b2c3d-2222-4222-8333-944455556666';
  const t0 = now - 10 * 60 * 1000;
  const at = (s) => iso(t0 + s * 1000);
  const said = (o) => line({ parentUuid: 'p', cwd: SCWD, gitBranch: 'feat/live', version: '9.9.9', ...o });
  write(path.join(SR, SSLUG, `${SID}.jsonl`), [
    line({ type: 'permission-mode', permissionMode: 'auto', sessionId: SID }),
    line({ type: 'ai-title', aiTitle: 'Live fixture work', sessionId: SID }),
    line({ type: 'api-request-blob', sessionId: SID, content: 'x'.repeat(2000) }),
    said({ type: 'user', timestamp: at(0), origin: { kind: 'human' }, message: { role: 'user', content: 'Please test and survey the code' } }),
    said({ type: 'assistant', timestamp: at(2), message: { model: 'claude-opus-5-5', usage: { output_tokens: 40 }, content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'On it.' }, { type: 'tool_use', id: 'u1', name: 'Bash', input: { command: 'npm test', description: 'Run the suite' } }] } }),
    said({ type: 'user', timestamp: at(9), message: { content: [{ type: 'tool_result', tool_use_id: 'u1', content: '12 passed, 0 failed' }] } }),
    said({ type: 'assistant', timestamp: at(10), message: { content: [{ type: 'tool_use', id: 'u2', name: 'Bash', input: { command: 'npm run build', description: 'Build in the background', run_in_background: true } }] } }),
    said({ type: 'user', timestamp: at(11), message: { content: [{ type: 'tool_result', tool_use_id: 'u2', content: 'Command running in background with ID: bg1. Output is being written to: x.output' }] } }),
    said({ type: 'assistant', timestamp: at(12), message: { content: [{ type: 'tool_use', id: 'u3', name: 'Agent', input: { description: 'Survey the code', subagent_type: 'Explore', prompt: 'look' } }] } }),
    said({ type: 'user', timestamp: at(40), message: { content: [{ type: 'tool_result', tool_use_id: 'u3', content: 'Survey done.' }] } }),
    said({ type: 'assistant', timestamp: at(41), message: { content: [{ type: 'tool_use', id: 'u4', name: 'Grep', input: { pattern: 'background' } }] } }),
    said({ type: 'user', timestamp: at(42), message: { content: [{ type: 'tool_result', tool_use_id: 'u4', content: 'notes.md:3: the old log said Command was moved to the background (ID: bg9) once' }] } }),
    line({ type: 'queue-operation', operation: 'enqueue', timestamp: at(43), content: 'also check the docs', sessionId: SID }),
    said({ type: 'user', timestamp: at(50), origin: { kind: 'task-notification' }, message: { role: 'user', content: '<task-notification>\n<task-id>bg1</task-id>\n<status>completed</status>\n<summary>Build finished</summary>\n</task-notification>' } }),
    said({ type: 'system', subtype: 'turn_duration', timestamp: at(60), durationMs: 60000, messageCount: 14 }),
    line({ type: 'cost-state', sessionId: SID, totalCostUSD: 1.25, totalLinesAdded: 30, totalLinesRemoved: 4, totalAPIDuration: 20000, totalToolDuration: 9000, startTime: t0, modelUsage: { 'claude-opus-5-5': { inputTokens: 10, outputTokens: 900, cacheReadInputTokens: 5000, cacheCreationInputTokens: 700, costUSD: 1.25 } } }),
    said({ type: 'user', timestamp: at(70), origin: { kind: 'human' }, message: { role: 'user', content: 'Now read the readme' } }),
    said({ type: 'assistant', timestamp: at(72), message: { content: [{ type: 'tool_use', id: 'u5', name: 'Read', input: { file_path: 'C:\\fixture\\work\\live-app\\README.md' } }] } }),
  ].join(''));
  write(path.join(SR, SSLUG, SID, 'subagents', 'agent-ax1.meta.json'), JSON.stringify({ agentType: 'Explore', description: 'Survey the code', toolUseId: 'u3', finished: true, pickedEffortModel: 'claude-haiku-5-5' }));
  write(path.join(SR, SSLUG, SID, 'subagents', 'agent-ax1.jsonl'), [
    line({ type: 'assistant', timestamp: at(13), message: { content: [{ type: 'tool_use', id: 'g1', name: 'Grep', input: { pattern: 'TODO' } }] } }),
    line({ type: 'user', timestamp: at(14), message: { content: [{ type: 'tool_result', tool_use_id: 'g1', content: 'none' }] } }),
  ].join(''));
  write(path.join(SR, SSLUG, `${OLD}.jsonl`), said({ type: 'user', timestamp: iso(now - 3 * 3600 * 1000), origin: { kind: 'human' }, message: { role: 'user', content: 'An older question' } }));
  write(path.join(SREG, '4242.json'), JSON.stringify({ pid: 4242, sessionId: SID, cwd: SCWD, startedAt: t0 - 5000, kind: 'interactive', name: 'live-1', status: 'busy', statusUpdatedAt: now - 2000, version: '9.9.9' }));
  write(path.join(SREG, '777.json'), JSON.stringify({ pid: 777, sessionId: OLD, cwd: SCWD, status: 'idle', statusUpdatedAt: now - 3 * 3600 * 1000 }));
  write(path.join(SREG, 'notes.txt'), 'not a registry entry');
  const tasklist = async (cmd) => (cmd === 'tasklist' ? '"System","4","Services","0","1 K"\r\n"claude.exe","4242","Console","1","500 K"\r\n"notepad.exe","777","Console","1","9 K"\r\n' : '');

  check('a working directory becomes the folder name Claude Code gives it', slugFor('C:\\work\\K9') === 'C--work-K9' && slugFor('/home/me/my.app') === '-home-me-my-app');
  const reg = readRegistry(SREG);
  check('the registry is read one entry per process, skipping what is not one', reg.length === 2 && reg.find((r) => r.pid === 4242)?.status === 'busy' && reg.find((r) => r.pid === 4242)?.name === 'live-1');
  const alive = await alivePids([4242, 777, 5], { platform: 'win32', execFn: tasklist });
  check('on Windows a pid counts as open only while a Claude Code image holds it, not a reused one', alive.has(4242) && !alive.has(777) && !alive.has(5));
  const probed = await alivePids([1, 2, 3], { platform: 'linux', probe: (p) => { if (p === 2) throw Object.assign(new Error('x'), { code: 'EPERM' }); if (p === 3) throw Object.assign(new Error('x'), { code: 'ESRCH' }); } });
  check('elsewhere a signal-0 probe decides, and a process we may not signal is still running', probed.has(1) && probed.has(2) && !probed.has(3));
  check('a prompt the person typed is told apart from a command, a notification and meta lines',
    userKind({ type: 'user', origin: { kind: 'human' }, message: { content: 'hi' } })?.kind === 'prompt'
    && userKind({ type: 'user', message: { content: '<command-name>/mcp</command-name>\n<command-message>mcp</command-message>\n<command-args>list</command-args>' } })?.text === '/mcp list'
    && userKind({ type: 'user', message: { content: '<task-notification><task-id>a</task-id></task-notification>' } })?.kind === 'notify'
    && userKind({ type: 'user', isMeta: true, message: { content: 'x' } }) === null
    && userKind({ type: 'user', message: { content: '<local-command-stdout>ok</local-command-stdout>' } }) === null
    && userKind({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'z', content: 'r' }] } }) === null
    && userKind({ type: 'user', origin: { kind: 'hook' }, message: { content: 'from a hook' } })?.kind === 'system');
  const note = taskNote('<task-notification>\n<task-id>b7</task-id>\n<status>failed</status>\n<summary>It broke</summary>\n</task-notification>');
  check('a task notification gives its task, status and summary', note.id === 'b7' && note.status === 'failed' && note.summary === 'It broke');

  const st = freshSession(SID);
  const filt = sessionLineFilter(st);
  let n = 0;
  for (const l of fs.readFileSync(path.join(SR, SSLUG, `${SID}.jsonl`), 'utf8').split('\n')) {
    n++;
    if (l && filt(l)) ingestSessionLine(st, l, n);
  }
  check('a session holds its prompts, title, permission mode and model', st.prompts.length === 2 && st.title === 'Live fixture work' && st.permissionMode === 'auto' && st.model === 'claude-opus-5-5' && st.thinking === 1);
  check('a finished turn keeps its duration, its tool calls and the prompt that began it', st.turns.length === 1 && st.turns[0].ms === 60000 && st.turns[0].tools === 4 && /test and survey/.test(st.turns[0].prompt) && st.inTurn === true);
  check('a background command is launched by its result and finished by its notification', st.bg.get('bg1')?.status === 'completed' && st.bg.get('bg1')?.summary === 'Build finished' && st.bg.get('bg1')?.kind === 'shell');
  check('a launch message quoted inside some other output launches nothing', !st.bg.has('bg9'));
  check('starting a subagent is a spawn, and a message sent mid-turn is kept', st.events.some((e) => e.kind === 'spawn' && e.tool === 'Agent' && e.status === 'ok') && st.events.some((e) => e.kind === 'queue' && e.text === 'also check the docs'));
  check('the cost record is kept as Claude Code wrote it', st.cost?.usd === 1.25 && st.cost.linesAdded === 30 && st.cost.models['claude-opus-5-5'].output === 900);
  check('the agent rules still judge tool calls in a session: the suite\'s run passed', st.testsPassed === 1 && st.tools === 5 && st.pending.has('u5'));
  check('a peek at the end of a transcript finds its title and an open turn', (() => { const p = peek(path.join(SR, SSLUG, `${SID}.jsonl`)); return p.title === 'Live fixture work' && p.inTurn === true && p.gitBranch === 'feat/live'; })());

  const ss = createSessions({ root: SR, registryDir: SREG, platform: 'win32', execFn: tasklist });
  const sv = await ss.view({ scope: 'machine' });
  const live = sv.sessions.find((s) => s.id === SID);
  const old = sv.sessions.find((s) => s.id === OLD);
  check('an open session is listed first, working as its registry says, with its name and counts', sv.sessions[0]?.id === SID && live.open && live.state === 'working' && live.name === 'live-1' && live.subagents === 1 && live.why.method === 'session-registry');
  check('a session whose process is gone is closed, dated by what it wrote, not by its file time', old && !old.open && old.state === 'closed' && Math.abs(old.last - (now - 3 * 3600 * 1000)) < 2000);
  check('following picks the working session and reads it in full', sv.following === true && sv.focus === SID && sv.detail?.session.title === 'Live fixture work');
  check('the now line names the open tool call and what else is going', sv.detail.now.state === 'tool' && /^Running Read: /.test(sv.detail.now.text));
  const lane = sv.detail.lanes[0];
  check('a subagent is a lane: its label, type, model, finished state and tool calls', sv.detail.lanes.length === 1 && lane.label === 'Survey the code' && lane.type === 'Explore' && lane.status === 'done' && lane.stats.tools === 1 && lane.latest?.tool === 'Grep');
  check('the merged feed holds both lanes in order', sv.detail.feed.some((e) => e.lane === 'ax1') && sv.detail.feed.some((e) => e.lane === 'main') && sv.detail.feed.every((e, i, a) => !i || (a[i - 1].t || 0) <= (e.t || 0)));
  check('the open turn leads the list of turns', sv.detail.turns[0]?.open === true && sv.detail.turns[1]?.ms === 60000);
  check('everything on the machine is tagged with the session it came from', Array.isArray(sv.machine) && sv.machine.length > 0 && sv.machine.every((e) => e.session && e.sessionLabel) && sv.machine.every((e, i, a) => !i || (a[i - 1].t || 0) >= (e.t || 0)));
  const one = await ss.view({ session: SID, lane: 'ax1' });
  check('one lane can be asked for alone, and a session chosen is not following', one.following === false && one.detail.lane === 'ax1' && one.detail.feed.every((e) => e.lane === 'ax1'));
  const ranged = await ss.view({ session: SID, from: t0 + 69000, to: t0 + 80000 });
  check('a turn\'s range narrows the feed to it', ranged.detail.ranged && ranged.detail.feed.length > 0 && ranged.detail.feed.every((e) => e.t >= t0 + 69000 && e.t <= t0 + 80000));
  const shut = createSessions({ root: SR, registryDir: SREG, platform: 'win32', execFn: async () => '"System","4","Services","0","1 K"\r\n' });
  const sv2 = await shut.view({});
  check('with no process alive every session is closed, and the now line says so', sv2.sessions.every((s) => !s.open) && sv2.detail?.now.state === 'closed');
  check('--project takes a project that has sessions but no workflow run yet', resolveProject(SR, SCWD) === SSLUG && resolveProject(SR, 'live-app') === SSLUG);

  const ssrv = await startServer({ port: 0, root: SR, token: 'tok-s', version: VERSION, stateDir: path.join(TMP, 'state-sessions'), indexDelayMs: 0, watch: false, registryDir: SREG, sessionOpts: { platform: 'win32', execFn: tasklist } });
  const sres = await get(ssrv.port, `/api/sessions?session=${SID}&lane=main`);
  const sbody = JSON.parse(sres.body);
  check('/api/sessions answers with the sessions and the one asked for, its lane alone', sres.status === 200 && sbody.focus === SID && sbody.detail.lane === 'main' && sbody.detail.feed.every((e) => e.lane === 'main') && sbody.sessions.length === 2);
  const sbad = JSON.parse((await get(ssrv.port, '/api/sessions?session=../../etc&lane=<x>&scope=machine')).body);
  check('/api/sessions ignores a session id or lane of the wrong form, and follows instead', sbad.following === true && sbad.detail.lane === 'all' && Array.isArray(sbad.machine));
  const sstate = JSON.parse((await get(ssrv.port, `/api/state?project=${SSLUG}`)).body);
  check('a project with no workflow run is its own Live view, with no runs, not another project\'s', sstate.project?.slug === SSLUG && sstate.runs.length === 0 && sstate.projects.some((p) => p.slug === SSLUG));
  await ssrv.close();
  const html = fs.readFileSync(path.join(HERE, 'web', 'index.html'), 'utf8');
  const sjs = fs.readFileSync(path.join(HERE, 'web', 'sessions.js'), 'utf8');
  check('the page has a Sessions tab and view, and the app registers it', /data-view="sessions"/.test(html) && /id="view-sessions"/.test(html) && /sessions: createSessionsView\(ctx\)/.test(fs.readFileSync(path.join(HERE, 'web', 'app.js'), 'utf8')) && /panel: 'view-sessions'/.test(sjs));
}

/* ---------- sessions: a background command from before a restart ---------- */

{
  const RR = path.join(TMP, 'projects-restart');
  const RREG = path.join(TMP, 'registry-restart');
  const RCWD = 'C:\\fixture\\work\\restarted';
  const RID = '0a1b2c3d-3333-4222-8333-944455556666';
  const r0 = now - 20 * 60 * 1000;
  const at = (s) => iso(r0 + s * 1000);
  const said = (o) => line({ parentUuid: 'p', cwd: RCWD, ...o });
  const launch = (id, s, bg) => [
    said({ type: 'assistant', timestamp: at(s), message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command: 'npm run dev', description: `Serve ${bg}`, run_in_background: true } }] } }),
    said({ type: 'user', timestamp: at(s + 1), message: { content: [{ type: 'tool_result', tool_use_id: id, content: `Command running in background with ID: ${bg}. Output is being written to: x.output` }] } }),
  ];
  write(path.join(RR, slugFor(RCWD), `${RID}.jsonl`), [
    said({ type: 'user', timestamp: at(0), origin: { kind: 'human' }, message: { role: 'user', content: 'Start the server' } }),
    ...launch('r1', 10, 'bgold'),
    said({ type: 'system', subtype: 'turn_duration', timestamp: at(20), durationMs: 20000, messageCount: 4 }),
    said({ type: 'user', timestamp: at(600), origin: { kind: 'human' }, message: { role: 'user', content: 'Start it again' } }),
    ...launch('r2', 610, 'bgnew'),
    said({ type: 'system', subtype: 'turn_duration', timestamp: at(620), durationMs: 20000, messageCount: 4 }),
  ].join(''));
  write(path.join(RREG, '101.json'), JSON.stringify({ pid: 101, sessionId: RID, cwd: RCWD, startedAt: r0 + 300 * 1000, kind: 'interactive', status: 'idle', statusUpdatedAt: now - 1000 }));
  const rs = createSessions({ root: RR, registryDir: RREG, platform: 'linux', probe: () => true });
  const rv = await rs.view({ session: RID });
  const bgs = Object.fromEntries((rv.detail?.background || []).map((b) => [b.id, b.status]));
  check('a background command launched before the session\'s process started reads as stopped, a later one as running',
    bgs.bgold === 'stopped' && bgs.bgnew === 'running' && /1 background task running/.test(rv.detail?.now?.text || ''), JSON.stringify({ bgs, now: rv.detail?.now?.text }));
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
