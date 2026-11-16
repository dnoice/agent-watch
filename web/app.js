/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Page Script (dd1 Tools Edition - v1.12)
 *     - File Name: app.js
 *     - Relative Path: web/app.js
 *     - Artifact Type: javascript
 *     - Version: 1.12.0
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.12.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       Sessions view joins the views; openRun() opens a run in the Live view
 *       of its own project, so a session's workflow is one click away; the
 *       Live view of a project with no run yet points to Sessions.
 *     - 1.11.3 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       fitBrand() sets the line to the name's width and lets its words and
 *       arrows spread across it.
 *     - 1.11.2 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       fitBrand(): tracks the line under the name to the name's measured
 *       width, again once the fonts load.
 *     - 1.11.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       Insights view registered.
 *     - 1.10.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       Started cell names a resumed run's resume.
 *     - 1.9.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The Live
 *       view's pass: the eyebrow names the workflow; the status sentence with
 *       its icon; wide figures take two cells; the agent count in Activity's
 *       head; only new events flash; FAIL lines carry their full text as a
 *       tooltip.
 *     - 1.8.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Live and
 *       the time of the last answer are drawn into the pill beside the name,
 *       with the state in its tooltip.
 *     - 1.6.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       Profile and Handoff views join.
 *     - 1.5.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       Tests, Files and Compare views join.
 *     - 1.4.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       Timeline view and the notices bell join; a phase in the rail opens
 *       the timeline at its start; the project picker marks projects with a
 *       run going or unread notices.
 *     - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       Investigate view joins the views; every failure in the Live feed has
 *       an Investigate button.
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
 *       module now, with views: Live and the Archive (R03), chosen from a
 *       tab bar, and the view, run and agent kept in the address so a link
 *       opens the same place. The helpers moved to core.js. The runs table
 *       says how many runs there are and opens the archive.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A run's
 *       status, totals and test logs say where they came from; tool calls
 *       show their result and duration; commits read as confirmed of tried;
 *       the trunk is named; the status bar shows the health register. A
 *       newer poll cancels an older one, whose answer is dropped (F07).
 *     - 1.0.0 (11/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version.
 *
 * ✒ Description:
 *     Polls /api/state and draws it, and switches between the page's views.
 *     Live is the run in focus with its phase rail, its agents' actions, the
 *     side cards and the latest runs; the other views each draw one question
 *     about a run or about every run. The project and the theme are kept in
 *     this browser; the view, run and agent are kept in the address.
 *
 * ✒ Key Features:
 *     - Polls every 2.5 s while the page is visible, and not at all while
 *       it is hidden; a failed poll says so in the header and the status bar
 *     - A newer poll cancels an older one, whose answer is dropped
 *     - Every text from a transcript goes in as text, never as HTML
 *     - The clock of a running run ticks each second between polls
 *     - The address holds the view and the run: #view=archive, #run=wf_...;
 *       the Sessions view adds the session, lane and scope
 *     - Dates month/day/year, times on the 12-hour clock
 *
 * ✒ Other Important Information:
 *     - Dependencies: index.html's elements, core.js, the views' modules, the
 *       server's /api/state
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, icon, when, clock, span, ago, num, gb, tokens, whyText, sourceOf, store, api } from './core.js';
import { createArchiveView } from './archive.js';
import { createInvestigateView } from './investigate.js';
import { createTimelineView } from './timeline.js';
import { createNotices } from './notices.js';
import { createTestsView } from './tests.js';
import { createFilesView } from './files.js';
import { createCompareView } from './compare.js';
import { createProfileView } from './profile.js';
import { createInsightsView } from './insights.js';
import { createHandoffView } from './handoff.js';
import { createSessionsView } from './sessions.js';

const POLL_MS = 2500;

const ui = {
  project: store.get('project'),
  run: null,
  agent: null,
  view: 'live',
  params: new URLSearchParams(),
  state: null,
  lastOk: 0,
  timer: null,
  feedKey: '',
  feedAgent: null,
  feedSeen: null,
};

/* ---------- the address: #view=...&run=...&agent=... ---------- */

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  ui.params = p;
  ui.view = views[p.get('view')] ? p.get('view') : 'live';
  const run = p.get('run');
  ui.run = /^wf_[\w-]{4,64}$/.test(run || '') ? run : null;
  ui.agent = p.get('agent') || null;
}
function writeHash(replace = false) {
  const p = new URLSearchParams();
  if (ui.view !== 'live') p.set('view', ui.view);
  if (ui.run) p.set('run', ui.run);
  if (ui.agent) p.set('agent', ui.agent);
  for (const [k, v] of ui.params) if (!['view', 'run', 'agent'].includes(k) && v) p.set(k, v);
  const h = p.toString() ? `#${p}` : '';
  if (h === location.hash || (!h && !location.hash)) return;
  if (replace) history.replaceState(null, '', h || location.pathname);
  else history.pushState(null, '', h || location.pathname);
}

/** Opens a view, optionally on a run, keeping or replacing extra parameters. */
function go(view, { run = ui.run, agent = null, params = {}, replace = false } = {}) {
  const runChanged = run !== ui.run;
  ui.view = views[view] ? view : 'live';
  ui.run = run;
  ui.agent = agent;
  ui.params = new URLSearchParams(params);
  if (runChanged) ui.feedKey = '';
  writeHash(replace);
  showView();
  if (runChanged || view === 'live') poll();
}

/* ---------- theme ---------- */

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  const b = $('theme');
  b.replaceChildren(icon(t === 'sentinel' ? 'sun' : 'moon'));
  b.setAttribute('aria-label', t === 'sentinel' ? 'Switch to Parchment' : 'Switch to Sentinel');
}
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
applyTheme(store.get('theme') || (prefersDark ? 'sentinel' : 'parchment'));
$('theme').addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'sentinel' ? 'parchment' : 'sentinel';
  store.set('theme', t);
  applyTheme(t);
});

/* ---------- polling ---------- */

async function poll() {
  try {
    const body = await api('state', '/api/state', { project: ui.project, run: ui.run });
    if (body === undefined) return;
    ui.state = body;
    ui.lastOk = Date.now();
    $('foot-error').textContent = '';
    draw();
  } catch (err) {
    $('pulse').className = 'pulse is-error';
    $('pulse-text').textContent = 'Not answering';
    $('pulse').title = ui.lastOk ? `The service has not answered since ${clock(ui.lastOk)}; retrying every ${POLL_MS / 1000} s` : `The service has not answered; retrying every ${POLL_MS / 1000} s`;
    $('foot-error').textContent = `${err.message || err}. Retrying every ${POLL_MS / 1000} s.`;
  }
}
function schedule() {
  clearTimeout(ui.timer);
  if (document.hidden) return;
  ui.timer = setTimeout(async () => {
    await poll();
    schedule();
  }, POLL_MS);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) poll().then(schedule);
  else clearTimeout(ui.timer);
});

/* ---------- drawing ---------- */

function draw() {
  const s = ui.state;
  notices.onState(s);
  drawHeader(s);
  drawFoot(s);
  const v = views[ui.view];
  v.onState?.(s);
}

function drawFoot(s) {
  $('foot-version').textContent = `agent-watch ${s.version || ''}`;
  $('foot-paths').textContent = [s.project?.cwd, s.logDir].filter(Boolean).join('   ·   ');
  const h = s.health;
  if (h) {
    const bad = h.failureCount + h.malformedCount;
    const fh = $('foot-health');
    const a = s.archive;
    fh.textContent = `${num(h.readCount)} reads${bad ? `, ${num(bad)} skipped` : ''}${h.newest ? `, newest source ${ago(h.newest)}` : ''}${a ? `   ·   archive ${num(a.indexed)} of ${num(a.total)}${a.building ? ', indexing' : ''}` : ''}`;
    fh.className = bad ? 'foot-health is-bad' : 'foot-health';
    fh.title = bad ? h.recent.slice(-5).map((r) => `${r.what} ${r.kind}: ${r.reason || ''} ${r.file || ''}`.trim()).join('\n') : 'Every source read cleanly.';
  }
}

function drawHeader(s) {
  const sel = $('project');
  const want = s.project?.slug || '';
  // Each project with what needs attention: a run going, notices not yet read.
  const label = (p) => {
    const a = s.attention?.[p.slug];
    const unread = notices.unreadFor(p.slug);
    return `${p.name} (${p.runs} runs)${a?.running ? ` · ${a.running} running` : ''}${unread ? ` · ${unread} new` : ''}`;
  };
  const opts = s.projects.map((p) => `${p.slug}|${label(p)}`).join(';');
  if (sel.dataset.opts !== opts) {
    sel.replaceChildren(...s.projects.map((p) => el('option', { value: p.slug, text: label(p) })));
    sel.dataset.opts = opts;
  }
  if (sel.value !== want) sel.value = want;
  $('pulse').className = 'pulse is-live';
  $('pulse-text').textContent = 'Live';
  $('pulse-time').textContent = clock(s.now);
  $('pulse').title = `Last answer at ${clock(s.now)}; polling every ${POLL_MS / 1000} s while the page is in view`;
  const m = s.machine;
  $('cpu').textContent = `${m.cpu}%`;
  $('cpu-bar').style.width = `${m.cpu}%`;
  $('cpu-bar').classList.toggle('is-high', m.cpu >= 85);
  const used = m.memTotal - m.memFree;
  const pct = Math.round((used / m.memTotal) * 100);
  $('mem').textContent = `${gb(m.memFree)} free`;
  $('mem-bar').style.width = `${pct}%`;
  $('mem-bar').classList.toggle('is-high', pct >= 85);
  const run = s.runs.find((r) => r.id === s.focus);
  $('views-run').textContent = run ? run.title : '';
  $('views-run').title = run ? `${run.id}, ${run.status}` : '';
}

/* ---------- the Live view ---------- */

const live = {
  panel: 'view-live',
  onState(s) {
    const run = s.runs.find((r) => r.id === s.focus) || null;
    drawRun(run, s);
    drawActivity(run);
    drawBranch(s, run);
    drawTests(s);
    drawRuns(s);
  },
};

function drawRun(run, s) {
  if (!run) {
    $('run-workflow').textContent = s.project ? s.project.name : 'No project';
    $('run-title').textContent = 'No workflow run yet';
    // Not running a workflow is not the same as not working: the Sessions view shows everything else.
    fill($('run-desc'), 'Runs appear here as soon as a workflow starts in this project. ', el('button', { type: 'button', class: 'link-btn plain', onclick: () => go('sessions') }, icon('terminal-window'), 'See what Claude is doing in Sessions'));
    $('run-status').textContent = '-';
    $('run-status').className = 'status-pill';
    $('run-facts').replaceChildren();
    $('run-why').textContent = '';
    $('rail').replaceChildren();
    return;
  }
  // The project is named in the masthead; the eyebrow names the workflow this run is of.
  $('run-workflow').textContent = run.name || 'Workflow run';
  $('run-title').textContent = run.title;
  $('run-desc').textContent = run.description || '';
  const pillEl = $('run-status');
  pillEl.className = `status-pill is-${run.status}${run.why?.basis === 'inferred' ? ' is-inferred' : ''}`;
  pillEl.replaceChildren(...[run.status === 'running' ? icon('circle-notch') : null, run.status].filter(Boolean));
  pillEl.title = whyText(run.why);
  if (run.status === 'running') pillEl.firstChild.classList.add('spin');
  const t = run.totals || {};
  const o = run.outcomes;
  const facts = [
    ['Run', run.id],
    run.branch ? ['Branch', run.base ? `${run.branch}  ←  ${run.base}` : run.branch] : null,
    ['Started', when(run.started), run.resumed ? `Resumed at ${when(run.resumed)}; Claude Code saved that as the run's start.` : null],
    ['Elapsed', null],
    ['Agents', `${run.agents.filter((a) => a.status === 'done').length} of ${run.agents.length} done`],
    ['Tool calls', t.toolCalls === null || t.toolCalls === undefined ? 'not read yet' : `${num(t.toolCalls)}${o?.toolsFailed ? `, ${num(o.toolsFailed)} failed` : ''}`, whyText(t.why)],
    [t.tokensKind === 'total' ? 'Tokens, total' : 'Tokens, output', t.tokens === null || t.tokens === undefined ? 'not read yet' : tokens(t.tokens), whyText(t.why)],
    o && o.commits ? ['Commits', `${num(o.commitsConfirmed)} confirmed of ${num(o.commits)} tried`, 'A commit counts as confirmed when git\'s own summary line came back in the tool result.'] : null,
    o && o.tests ? ['Test runs', `${num(o.testsPassed)} passed, ${num(o.testsFailed)} failed${o.testsUnknown ? `, ${num(o.testsUnknown)} unread` : ''}`, 'From each test command\'s output, read by the adapters for the house suites, TAP, pytest, Jest and Mocha.'] : null,
  ].filter(Boolean);
  // A figure too long for one grid cell (the branch with its base, the test tally) takes two.
  $('run-facts').replaceChildren(...facts.map(([k, v, tip]) => el('div', { title: tip || null, class: v && v.length > 18 ? 'is-wide' : null }, el('dt', { text: k }), el('dd', k === 'Elapsed' ? { id: 'elapsed' } : { text: v }))));
  const w = run.why;
  $('run-why').replaceChildren(...(w ? [icon(w.basis === 'inferred' ? 'question' : 'info'), `Status ${sourceOf(w)}: ${w.note}${/[.!?]$/.test(w.note || '') ? '' : '.'}`] : []));
  tick();
  $('rail').replaceChildren(...run.phases.map((p) => {
    const own = run.agents.filter((a) => p.agents.includes(a.id));
    const meta = own.length ? `${own.map((a) => a.label).join(', ')} · ${span((p.state === 'active' ? Date.now() : p.end) - p.start)}` : '';
    const glyph = { done: 'check', active: 'circle-notch', stopped: 'stop', pending: 'circle' }[p.state] || 'circle';
    const dot = el('span', { class: 'step-dot' }, icon(glyph, p.state === 'done' ? 'ph-fill' : 'ph'));
    if (p.state === 'active') dot.firstChild.classList.add('spin');
    const title = p.start
      ? el('button', { type: 'button', class: 'step-title as-link', title: 'Show this phase on the timeline', onclick: () => go('timeline', { run: run.id, params: { at: String(p.start) } }), text: p.title })
      : el('p', { class: 'step-title', text: p.title });
    return el('li', { class: `step is-${p.state}`, 'aria-current': p.state === 'active' ? 'step' : null },
      dot, title, el('p', { class: 'step-detail', text: p.detail || '' }), el('p', { class: 'step-meta', text: meta }));
  }));
}

function tick() {
  const s = ui.state;
  const run = s && s.runs.find((r) => r.id === s.focus);
  const e = $('elapsed');
  if (!run || !e) return;
  const end = run.status === 'running' ? Date.now() : (run.ended || run.last);
  e.textContent = span(end - run.started);
}
setInterval(tick, 1000);

const KIND_ICON = { say: 'chat-teardrop-text', tool: 'terminal-window', read: 'magnifying-glass', edit: 'pencil-simple-line', test: 'flask', commit: 'git-commit', error: 'warning-octagon' };
const STATUS_ICON = { ok: 'check', error: 'x', pending: 'dots-three' };
/** A feed event that is a failure Investigate can open: an error, a failed call, a failing test or commit. */
const failed = (e) => (e.kind === 'error' && e.of) || (e.kind !== 'error' && (e.status === 'error' || e.outcome === 'failed'));
const statusTip = (e) => {
  if (e.status === 'pending') return 'No result yet';
  const out = e.outcome && e.outcome !== 'ok' ? `, ${e.outcome}` : '';
  return `${e.status === 'ok' ? 'Came back ok' : 'Came back as an error'}${out}${e.ms !== null && e.ms !== undefined ? `, after ${span(e.ms)}` : ''}`;
};

function drawActivity(run) {
  const tabs = $('agent-tabs');
  const feed = $('feed');
  if (!run) {
    tabs.replaceChildren();
    feed.replaceChildren();
    $('activity-count').textContent = '';
    $('feed-empty').hidden = false;
    drawAgent(null);
    return;
  }
  const running = run.agents.find((a) => a.status === 'running');
  const agent = run.agents.find((a) => a.id === ui.agent) || running || run.agents[run.agents.length - 1] || null;
  tabs.replaceChildren(...run.agents.map((a) => el('button', {
    class: 'agent-tab', role: 'tab', type: 'button', 'aria-selected': String(a === agent),
    title: `${a.label}: ${a.status}${a.quiet ? ', quiet for over five minutes' : ''}`,
    onclick: () => {
      ui.agent = a.id;
      writeHash(true);
      draw();
    },
  }, a.status === 'running' ? el('span', { class: `live${a.quiet ? ' is-quiet' : ''}` }) : icon(a.status === 'done' ? 'check' : 'stop'), a.label)));
  const done = run.agents.filter((a) => a.status === 'done').length;
  const going = run.agents.filter((a) => a.status === 'running').length;
  $('activity-count').textContent = `${run.agents.length} ${run.agents.length === 1 ? 'agent' : 'agents'} · ${done} done${going ? ` · ${going} running` : ''}`;
  const items = (agent?.feed || []).slice().reverse();
  const key = `${agent?.id}:${items.length}:${items[0]?.t}:${items[0]?.text}:${items.map((e) => e.status || '').join('')}`;
  if (key !== ui.feedKey) {
    // New means not shown at the last redraw of this same agent; a first draw flashes nothing.
    const seen = ui.feedAgent === agent?.id ? ui.feedSeen : null;
    ui.feedKey = key;
    ui.feedAgent = agent?.id;
    ui.feedSeen = new Set(items.map((e) => e.id));
    feed.replaceChildren(...items.map((e) => el('li', { class: `ev is-${e.kind}${e.status ? ` st-${e.status}` : ''}${e.outcome ? ` oc-${e.outcome}` : ''}${seen && !seen.has(e.id) ? ' is-new' : ''}` },
      el('span', { class: 'ev-icon' }, icon(KIND_ICON[e.kind] || 'dot')),
      el('div', { class: 'ev-text' }, e.tool && e.kind !== 'say' ? el('span', { class: 'ev-tool', text: e.tool }) : null, e.text),
      el('span', { class: 'ev-side' },
        e.status ? el('span', { class: `ev-status is-${e.status}`, title: statusTip(e) }, icon(STATUS_ICON[e.status] || 'dot'), e.ms !== null && e.ms !== undefined ? el('span', { text: span(e.ms) }) : null) : null,
        el('time', { class: 'ev-time', text: clock(e.t), title: `${when(e.t)}${e.line ? ` · transcript line ${e.line}` : ''}` }),
        failed(e) ? el('button', {
          type: 'button', class: 'link-btn', title: 'Open this failure in Investigate',
          onclick: () => go('investigate', { run: ui.state?.focus || ui.run, params: { event: e.of || e.id } }),
        }, icon('magnifying-glass-plus'), 'Investigate') : null))));
  }
  $('feed-empty').hidden = items.length > 0;
  $('feed-empty').textContent = agent && !agent.stats ? 'This agent\'s actions are read when its run is chosen.' : 'Nothing yet. The agent\'s actions appear here as it works.';
  drawAgent(agent);
}

function drawAgent(a) {
  $('agent-name').textContent = a ? `${a.label} · ${a.status}${a.status === 'running' ? `, active ${ago(a.last)}` : ''}` : '';
  $('agent-name').title = a ? `${whyText(a.why)}${a.model ? ` Model: ${a.model}.` : ''}` : '';
  const st = a?.stats;
  const stat = (label, v, bad, tip) => el('div', { class: `stat${bad ? ' is-bad' : ''}`, title: tip || null }, el('b', { text: v }), el('span', { text: label }));
  $('agent-stats').replaceChildren(...(st ? [
    stat('tool calls', num(st.tools), false, `${num(st.toolsOk)} came back ok, ${num(st.toolsFailed)} as errors, ${num(st.toolsOpen)} still open`),
    stat('test runs', st.tests ? `${num(st.testsPassed)}/${num(st.tests)}` : '0', st.testsFailed > 0, `${num(st.tests)} test commands: ${num(st.testsPassed)} passed, ${num(st.testsFailed)} failed, ${num(st.testsUnknown)} with output no adapter could read`),
    stat('commits', st.commits ? `${num(st.commitsConfirmed)}/${num(st.commits)}` : '0', st.commitsFailed > 0, `${num(st.commits)} tried, ${num(st.commitsConfirmed)} confirmed by git's summary line, ${num(st.commitsFailed)} failed or had nothing to commit`),
    stat('errors', num(st.errors), st.errors > 0, 'Tool results marked as errors'),
    stat('out tokens', tokens(st.outTokens), false, 'Output tokens only, summed from the transcript'),
    stat('log', `${(st.bytes / 1048576).toFixed(1)} MB`, false, `The transcript's size; ${num(st.events)} events read`),
  ] : []));
  const by = st ? Object.entries(st.byTool).sort((x, y) => y[1] - x[1]).slice(0, 7) : [];
  const max = by[0]?.[1] || 1;
  $('agent-tools').replaceChildren(...by.map(([k, v]) => el('div', { class: 'tool-row' },
    el('span', { text: k }), el('span', { class: 'bar' }, el('span', { width: `${Math.round((v / max) * 100)}%` })), el('b', { text: num(v) }))));
  const r = a?.result;
  const lines = [];
  if (r?.summary) lines.push(el('p', { text: r.summary }));
  if (r?.commits?.length) lines.push(el('p', {}, el('b', { text: `${r.commits.length} commits. ` }), r.commits[0]));
  if (r?.findings !== undefined) lines.push(el('p', { text: `${r.findings} findings: ${Object.entries(r.severity || {}).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}` }));
  if (r?.risks !== undefined) lines.push(el('p', { text: `${r.risks} risks named for the builder.` }));
  if (r?.problems !== undefined) lines.push(el('p', { text: `${r.problems} problems reported${r.unverified ? `, ${r.unverified} things unverified` : ''}.` }));
  if (r?.tests) lines.push(el('p', { text: `Tests it reported: ${r.tests.passed} passed, ${r.tests.failed} failed${r.tests.other ? `, ${r.tests.other} other` : ''}.` }));
  if (r?.npmTest) lines.push(el('p', { text: `npm test: ${r.npmTest}` }));
  if (r?.uiCheck) lines.push(el('p', { text: `ui-check: ${r.uiCheck}` }));
  $('agent-result').replaceChildren(...lines);
}

function commitRows(list, emptyText) {
  if (!list?.length) return [el('li', { class: 'empty', text: emptyText })];
  return list.map((c) => el('li', {}, el('code', { text: c.hash }), el('span', {}, c.subject, el('time', { text: when(c.at) }))));
}

function drawBranch(s, run) {
  $('branch-name').textContent = run?.branch || s.git?.head || '';
  $('branch-commits').replaceChildren(...commitRows(s.git?.branch, run?.branch ? 'No commits on the branch yet.' : 'This run names no branch.'));
  $('trunk-label').textContent = s.git?.trunkRef || 'main';
  $('main-commits').replaceChildren(...commitRows(s.git?.main?.slice(0, 6), 'No repository found for this project.'));
}

function drawTests(s) {
  $('ports').replaceChildren(...(s.ports || []).map((p) => el('span', { class: 'port', title: `pid ${p.pid}`, text: `:${p.port}` })));
  const note = $('logs-why');
  note.textContent = s.logsUnattributed ? 'Not tied to this run: it names no scratch folder, so these are the newest Claude scratchpad\'s logs.' : '';
  note.title = whyText(s.logsWhy);
  const logs = s.logs || [];
  if (!logs.length) {
    $('logs').replaceChildren(el('li', { class: 'empty', text: s.logsUnattributed ? 'No test logs found.' : 'No test logs in the run\'s scratch folder yet.' }));
    return;
  }
  $('logs').replaceChildren(...logs.map((l) => {
    const bad = l.verdict === 'failed' || l.fails.length > 0;
    return el('li', {},
      el('div', { class: 'log-name' }, el('span', { text: l.name }), el('time', { text: ago(l.mtime) })),
      el('span', { class: `tally${l.tally ? (bad ? ' is-bad' : '') : ' is-none'}`, text: l.tally || (l.section ? `running: ${l.section}` : 'no tally yet'), title: l.outcome ? `Read as ${l.outcome.format} output${l.partial ? ', from the last 32 KB' : ''}` : 'No adapter recognised this log yet' }),
      ...l.fails.map((f) => el('p', { class: 'fail', text: f, title: f })));
  }));
}

function drawRuns(s) {
  $('runs-count').textContent = s.total > s.runs.length - (s.older ? 1 : 0) ? `the ${s.runs.length - (s.older ? 1 : 0)} newest of ${s.total}` : `${s.runs.length} shown`;
  $('runs').replaceChildren(...s.runs.map((r) => el('tr', {
    'aria-current': String(r.id === s.focus),
    tabindex: '0',
    class: r.id === s.older ? 'is-older' : null,
    title: r.id === s.current ? 'The live run' : r.id === s.older ? 'An older run, opened from the archive' : 'Show this run',
    onclick: () => choose(r.id === s.current ? null : r.id),
    onkeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(r.id === s.current ? null : r.id);
      }
    },
  },
  el('td', {}, el('span', { class: 'run-title', text: r.title }), el('span', { class: 'run-id', text: r.id })),
  el('td', { class: 'mono', text: r.name || '-' }),
  el('td', {}, el('span', { class: `status-pill is-${r.status}${r.why?.basis === 'inferred' ? ' is-inferred' : ''}`, text: r.status, title: whyText(r.why) })),
  el('td', { class: 'mono', text: when(r.started) }),
  el('td', { class: 'num', text: r.status === 'running' ? span(Date.now() - r.started) : span((r.ended || r.last) - r.started) }),
  el('td', { class: 'num', text: String(r.agents.length) }),
  el('td', { class: 'num', text: r.totals?.tokens === null || r.totals?.tokens === undefined ? '-' : tokens(r.totals.tokens), title: r.totals?.tokensKind === 'output' ? 'Output tokens' : 'Total tokens' }))));
}

function choose(runId) {
  go('live', { run: runId });
}

$('project').addEventListener('change', (e) => {
  ui.project = e.target.value;
  store.set('project', ui.project);
  ui.feedKey = '';
  go(ui.view, { run: null });
});
$('open-archive').addEventListener('click', () => go('archive'));

/* ---------- views ---------- */

/** Opens a run in the Live view of its own project, which may not be the project chosen now. */
function openRun(slug, run) {
  if (slug && slug !== ui.project) {
    ui.project = slug;
    store.set('project', slug);
    ui.feedKey = '';
  }
  go('live', { run });
}

const ctx = { ui, go, poll: () => poll(), state: () => ui.state, openRun };
const notices = createNotices(ctx);
const views = {
  live,
  sessions: createSessionsView(ctx),
  insights: createInsightsView(ctx),
  archive: createArchiveView(ctx),
  investigate: createInvestigateView(ctx),
  timeline: createTimelineView(ctx),
  tests: createTestsView(ctx),
  files: createFilesView(ctx),
  compare: createCompareView(ctx),
  profile: createProfileView(ctx),
  handoff: createHandoffView(ctx),
};

function showView() {
  for (const [name, v] of Object.entries(views)) {
    const panel = $(v.panel);
    const on = name === ui.view;
    panel.hidden = !on;
    if (on) v.show?.(ui.params);
    else v.hide?.();
  }
  for (const b of document.querySelectorAll('#views [data-view]')) b.setAttribute('aria-current', b.dataset.view === ui.view ? 'page' : 'false');
  if (ui.state) draw();
}

for (const b of document.querySelectorAll('#views [data-view]')) {
  b.addEventListener('click', () => go(b.dataset.view, { run: ui.run }));
}
window.addEventListener('hashchange', () => {
  const before = ui.run;
  readHash();
  showView();
  if (before !== ui.run) poll();
});

/* ---------- the name and its line ---------- */

/**
 * Sets the line under the name to the name's measured width, so the two sit flush at both edges
 * whatever the fonts render at; the line's words and arrowheads spread evenly across it. A line
 * wider than the name at its natural size is made smaller to fit. Run again once the web fonts
 * have loaded, since they change both widths.
 */
function fitBrand() {
  const name = document.querySelector('.brand h1');
  const line = $('brand-sub');
  if (!name || !line) return;
  line.style.width = '';
  line.style.fontSize = '';
  const want = name.getBoundingClientRect().width;
  const have = line.getBoundingClientRect().width;
  if (!want || !have) return;
  if (have > want) line.style.fontSize = `${parseFloat(getComputedStyle(line).fontSize) * (want / have)}px`;
  line.style.width = `${want}px`;
}
fitBrand();
document.fonts?.ready.then(fitBrand);

readHash();
showView();
poll().then(schedule);
