/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Sessions View (dd1 Tools Edition - v1.0)
 *     - File Name: sessions.js
 *     - Relative Path: web/sessions.js
 *     - Artifact Type: script
 *     - Version: 1.0.0
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Description:
 *     The Sessions view: everything Claude Code is doing on this machine,
 *     live. Every open terminal session as a card with its state, the one in
 *     focus in full (what it is doing this second, its prompts, replies and
 *     tool calls, its subagents, workflow runs and background tasks, its
 *     turns, tools and cost) and, one click away, a single feed of every
 *     active session at once.
 *
 * ✒ Key Features:
 *     - Follows the work: with nothing chosen, the open session that is
 *       working is shown, and the view moves when the work moves
 *     - A "now" line that counts up: the tool running, the agent waited on,
 *       thinking, or waiting for you
 *     - Lanes: the main thread, each subagent, or all of them merged
 *     - Kind filters kept per browser; a turn chosen narrows the feed to it
 *     - Workflow runs open in the Live view of their own project
 *     - Polls every 2.5 s while the view is open and the tab is visible;
 *       keyboard focus survives each redraw
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the service's /api/sessions
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, icon, when, clock, span, ago, num, tokens, whyText, sourceOf, store, api, how } from './core.js';

const POLL_MS = 2500;
const SESSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LANE = /^(?:all|main|[\w-]{1,64})$/;

const KIND_ICON = {
  prompt: 'user', say: 'chat-teardrop-text', tool: 'terminal-window', read: 'magnifying-glass', edit: 'pencil-simple-line',
  test: 'flask', commit: 'git-commit', error: 'warning-octagon', spawn: 'tree-structure', turn: 'flag-checkered',
  notify: 'bell-simple-ringing', queue: 'chat-circle-dots',
};
/** The filter chips, and which event kinds each one covers. */
const FILTERS = [
  ['prompt', 'Prompts', ['prompt', 'queue', 'turn']],
  ['say', 'Replies', ['say']],
  ['tool', 'Commands', ['tool']],
  ['read', 'Reads', ['read']],
  ['edit', 'Edits', ['edit']],
  ['test', 'Tests', ['test']],
  ['commit', 'Commits', ['commit']],
  ['spawn', 'Agents', ['spawn']],
  ['notify', 'Notices', ['notify']],
  ['error', 'Errors', ['error']],
];
const FILTER_OF = Object.fromEntries(FILTERS.flatMap(([key, , kinds]) => kinds.map((k) => [k, key])));
const STATE_TEXT = { working: 'working', waiting: 'waiting for you', closed: 'closed' };
const PILL = { working: 'running', waiting: 'waiting', closed: 'closed' };
const NOW_ICON = { tool: 'terminal-window', agent: 'robot', thinking: 'brain', waiting: 'hourglass-medium', blocked: 'hand-palm', closed: 'moon-stars' };
const STATUS_ICON = { ok: 'check', error: 'x', pending: 'dots-three' };

const tail = (p) => String(p || '').replace(/\\/g, '/').split('/').filter(Boolean).slice(-2).join('/');
const model = (m) => String(m || '').replace(/^claude-/, '').replace(/-(\d+)-(\d+)$/, ' $1.$2') || '-';
const usd = (n) => (typeof n === 'number' ? `$${n < 10 ? n.toFixed(2) : n.toFixed(0)}` : '-');

export function createSessionsView(ctx) {
  const v = {
    on: false,
    timer: null,
    data: null,
    session: null,
    lane: 'all',
    scope: 'session',
    turn: null,
    closed: store.get('sessions.closed') === '1',
    kinds: new Set((store.get('sessions.kinds') || FILTERS.map(([k]) => k).join(',')).split(',').filter((k) => FILTER_OF[k] || FILTERS.some(([f]) => f === k))),
    feedKey: '',
    seen: null,
    seenFor: null,
  };

  /* ---------- the address and the choices ---------- */

  function readParams(p) {
    const id = p?.get('session');
    v.session = SESSION.test(id || '') ? id : null;
    const lane = p?.get('lane');
    v.lane = LANE.test(lane || '') ? lane : 'all';
    v.scope = p?.get('scope') === 'machine' ? 'machine' : 'session';
  }
  function navigate() {
    const params = {};
    if (v.session) params.session = v.session;
    if (v.lane !== 'all') params.lane = v.lane;
    if (v.scope !== 'session') params.scope = v.scope;
    ctx.go('sessions', { run: ctx.ui.run, params, replace: true });
  }
  function choose(id) {
    v.session = id;
    v.lane = 'all';
    v.scope = 'session';
    v.turn = null;
    navigate();
  }

  $('sess-follow').addEventListener('click', () => {
    v.session = null;
    v.lane = 'all';
    v.turn = null;
    navigate();
  });
  $('sess-closed').addEventListener('click', () => {
    v.closed = !v.closed;
    store.set('sessions.closed', v.closed ? '1' : null);
    load();
  });
  for (const b of $('sess-scope').querySelectorAll('[data-scope]')) {
    b.addEventListener('click', () => {
      v.scope = b.dataset.scope;
      v.turn = null;
      navigate();
    });
  }

  /* ---------- polling ---------- */

  async function load() {
    clearTimeout(v.timer);
    if (!v.on) return;
    try {
      const body = await api('sessions', '/api/sessions', {
        session: v.session, lane: v.lane, scope: v.scope, from: v.turn?.from ?? null, to: v.turn?.to ?? null, closed: v.closed ? '1' : '0',
      });
      if (body !== undefined && v.on) {
        v.data = body;
        draw(body);
      }
    } catch (err) {
      $('sess-feed-empty').hidden = false;
      $('sess-feed-empty').textContent = `The service did not answer: ${err.message || err}. Trying again every ${POLL_MS / 1000} s.`;
    } finally {
      if (v.on && !document.hidden) v.timer = setTimeout(load, POLL_MS);
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (v.on && !document.hidden) load();
  });

  /* ---------- drawing ---------- */

  function draw(b) {
    drawList(b);
    drawHero(b, b.detail);
    drawLanes(b.detail);
    const items = b.machine && v.scope === 'machine' ? b.machine : (b.detail?.feed || []).slice().reverse();
    drawKinds(items);
    drawFeed(b, items);
    drawSide(b.detail);
    tick();
  }

  /** Redraws a list while keeping keyboard focus on the same item, found again by its data-key. */
  function keepFocus(node, redraw) {
    const key = document.activeElement && node.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    redraw();
    if (key) node.querySelector(`[data-key="${CSS.escape(key)}"]`)?.focus();
  }

  function drawList(b) {
    const open = b.sessions.filter((s) => s.open);
    const closed = b.sessions.filter((s) => !s.open);
    const c = b.counts;
    $('sess-count').textContent = `${num(c.open)} open${c.working ? ` · ${num(c.working)} working` : ''}${c.closed ? ` · ${num(c.closed)} closed in the last day` : ''}`;
    $('sess-count').title = whyText(b.why);
    $('sess-follow').setAttribute('aria-pressed', String(b.following));
    $('sess-closed').setAttribute('aria-pressed', String(v.closed));
    const card = (s) => {
      const meta = [
        s.open ? (s.state === 'working' ? `working, ${ago(s.last)}` : `quiet since ${clock(s.last)}`) : `closed ${ago(s.last)}`,
        s.subagents ? `${s.subagentsRunning ? `${s.subagentsRunning} of ` : ''}${s.subagents} ${s.subagents === 1 ? 'agent' : 'agents'}` : null,
        s.workflows ? `${s.workflowsRunning ? `${s.workflowsRunning} of ` : ''}${s.workflows} ${s.workflows === 1 ? 'workflow' : 'workflows'}` : null,
        s.branch,
      ].filter(Boolean).join(' · ');
      return el('li', {}, el('button', {
        type: 'button',
        class: `sess-card is-${s.state}`,
        'data-key': s.id,
        'aria-pressed': String(s.id === b.focus),
        title: `${s.cwd || s.project}\n${whyText(s.why)}`,
        onclick: () => choose(s.id),
      },
      el('span', { class: 'sess-card-top' },
        el('span', { class: `sess-dot is-${s.state}`, 'aria-hidden': 'true' }),
        el('b', { class: 'sess-project', text: s.project }),
        s.name ? el('span', { class: 'sess-name', text: s.name }) : null,
        el('span', { class: 'sess-state', text: STATE_TEXT[s.state] || s.state })),
      el('span', { class: 'sess-card-title', text: s.title || s.lastPrompt || 'No prompt yet' }),
      el('span', { class: 'sess-card-meta', text: meta })));
    };
    keepFocus($('sess-list'), () => fill($('sess-list'),
      open.length ? open.map(card) : el('li', { class: 'empty sess-none', text: 'No Claude Code session is open on this machine. Start claude in a terminal and it appears here.' }),
      v.closed ? closed.map(card) : null));
  }

  function drawHero(b, d) {
    if (!d) {
      $('sess-eyebrow').textContent = 'Sessions';
      $('sess-title').textContent = b.sessions.length ? 'Choose a session' : 'No Claude Code session yet';
      $('sess-prompt').textContent = '';
      $('sess-state').className = 'status-pill';
      $('sess-state').textContent = '-';
      fill($('sess-now'));
      fill($('sess-facts'));
      fill($('sess-why'));
      return;
    }
    const s = d.session;
    $('sess-eyebrow').textContent = `${s.project}${s.name ? ` · ${s.name}` : ''}${b.following ? ' · following the work' : ''}`;
    $('sess-title').textContent = s.title || s.lastPrompt || 'Untitled session';
    $('sess-prompt').textContent = s.title && s.lastPrompt ? `Last prompt: ${s.lastPrompt}` : '';
    const pill = $('sess-state');
    pill.className = `status-pill is-${PILL[s.state] || s.state}${s.why?.basis === 'inferred' ? ' is-inferred' : ''}`;
    fill(pill, s.state === 'working' ? icon('circle-notch') : null, STATE_TEXT[s.state] || s.state);
    if (s.state === 'working') pill.firstChild.classList.add('spin');
    pill.title = whyText(s.why);
    const n = d.now;
    const nowEl = $('sess-now');
    nowEl.className = `sess-now is-${n.state}`;
    nowEl.title = whyText(n.why);
    fill(nowEl, icon(NOW_ICON[n.state] || 'dot', 'ph-duotone'), el('span', { class: 'sess-now-text', text: n.text }), n.since && n.state !== 'closed' ? el('time', { class: 'sess-now-since', id: 'sess-now-since', 'data-since': String(n.since) }) : null);
    const st = d.stats;
    const c = d.cost;
    const turnsDone = d.turns.filter((t) => !t.open).length;
    const going = d.turns.some((t) => t.open);
    const costTip = c ? `${whyText(c.why)}\n${Object.entries(c.models).map(([k, m]) => `${model(k)}: ${usd(m.usd)}, ${tokens(m.output)} out, ${tokens(m.input)} in, ${tokens(m.cacheRead)} cache read, ${tokens(m.cacheWrite)} cache written`).join('\n')}` : null;
    const facts = [
      ['Session', s.short, `${s.id}\n${s.file || ''}`],
      ['Folder', tail(s.cwd) || '-', s.cwd],
      s.branch ? ['Branch', s.branch] : null,
      ['Model', model(s.model), Object.keys(s.models || {}).length > 1 ? `Replies by model: ${Object.entries(s.models).map(([k, x]) => `${model(k)} ${x}`).join(', ')}` : null],
      s.permissionMode ? ['Permissions', s.permissionMode, 'The permission mode the session last recorded'] : null,
      ['Started', when(s.started || s.first), s.started ? 'When this Claude Code process started, from its registry entry' : 'The first line read from the transcript'],
      ['Elapsed', null],
      ['Turns', `${num(turnsDone)}${going ? ' + 1 going' : ''}`, `${num(s.prompts)} prompts and commands typed`],
      ['Tool calls', `${num(st.tools)}${st.toolsFailed ? `, ${num(st.toolsFailed)} failed` : ''}`, `${num(st.toolsOk)} came back ok, ${num(st.toolsFailed)} as errors, ${num(st.toolsOpen)} still open`],
      c ? ['Cost, last recorded', `${usd(c.usd)}${c.at ? ` at ${clock(c.at).replace(/:\d\d (?=[AP]M)/, ' ')}` : ''}`, costTip] : null,
      c && (c.linesAdded || c.linesRemoved) ? ['Lines', `+${num(c.linesAdded)} −${num(c.linesRemoved)}`, 'Lines added and removed, as Claude Code counted them for this process'] : null,
      ['Tokens, output', tokens(st.outTokens), 'Output tokens summed from the transcript read; input and cache tokens are in the cost'],
      s.pid ? ['Process', `pid ${s.pid}`, s.version ? `Claude Code ${s.version}` : null] : (s.version ? ['Claude Code', s.version] : null),
    ].filter(Boolean);
    fill($('sess-facts'), facts.map(([k, val, tip]) => el('div', { title: tip || null, class: val && val.length > 18 ? 'is-wide' : null }, el('dt', { text: k }), el('dd', k === 'Elapsed' ? { id: 'sess-elapsed', 'data-from': String(s.started || s.first || ''), 'data-to': s.open ? '' : String(s.last || '') } : { text: val }))));
    const why = s.partial?.why || s.why;
    fill($('sess-why'), why ? [icon(why.basis === 'inferred' ? 'question' : 'info'), `State ${sourceOf(why)}: ${why.note}${/[.!?]$/.test(why.note || '') ? '' : '.'}`] : []);
    $('sess-why').className = s.partial ? 'why is-warn' : 'why';
    if (!$('sess-how').firstChild) {
      $('sess-how').append(how('Open sessions come from Claude Code\'s own registry of its processes, each checked against the process list, so a session shows as open only while its terminal is. Working and waiting are the status Claude Code writes for itself. The now line names the newest tool call without a result, or says the session is thinking or waiting for you. Prompts, replies and tool calls are read from the session\'s transcript as it grows, with each call paired with its result by id. Subagents come from the session\'s subagents folder, background commands and workflows from their launch results, each finished by its notification. Cost and lines changed are Claude Code\'s own count for the current process.'));
    }
  }

  function drawLanes(d) {
    const tabs = $('sess-lanes');
    if (!d || v.scope === 'machine' || !d.lanes.length) {
      fill(tabs);
      return;
    }
    const lane = d.lane || 'all';
    const tab = (id, label, glyph, tip) => el('button', {
      class: 'agent-tab', role: 'tab', type: 'button', 'data-key': id, 'aria-selected': String(id === lane), title: tip || label,
      onclick: () => {
        v.lane = id;
        v.turn = null;
        navigate();
      },
    }, glyph, label);
    keepFocus(tabs, () => fill(tabs,
      tab('all', 'Everything', icon('stack')),
      tab('main', 'Main thread', icon('terminal-window')),
      d.lanes.map((l) => tab(l.id, l.label, l.status === 'running' ? el('span', { class: `live${l.quiet ? ' is-quiet' : ''}` }) : icon(l.status === 'done' ? 'check' : 'stop'), `${l.label}: ${l.status}${l.quiet ? ', quiet for over five minutes' : ''}. ${whyText(l.why)}`))));
  }

  function drawKinds(items) {
    const counts = {};
    for (const e of items) {
      const k = FILTER_OF[e.kind] || e.kind;
      counts[k] = (counts[k] || 0) + 1;
    }
    fill($('sess-kinds'), FILTERS.filter(([k]) => counts[k] || !v.kinds.has(k)).map(([k, label]) => el('button', {
      type: 'button', class: `chip sess-kind k-${k}`, 'aria-pressed': String(v.kinds.has(k)), title: v.kinds.has(k) ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`,
      onclick: () => {
        if (v.kinds.has(k)) v.kinds.delete(k);
        else v.kinds.add(k);
        store.set('sessions.kinds', [...v.kinds].join(','));
        v.feedKey = '';
        if (v.data) draw(v.data);
      },
    }, icon(KIND_ICON[k] || 'dot'), label, el('span', { class: 'chip-count', text: num(counts[k] || 0) }))));
  }

  function statusTip(e) {
    if (e.kind === 'turn') return `The turn took ${span(e.ms)}`;
    if (e.status === 'pending') return 'No result yet';
    return `${e.status === 'ok' ? 'Came back ok' : 'Came back as an error'}${e.outcome && e.outcome !== 'ok' ? `, ${e.outcome}` : ''}${e.ms !== null && e.ms !== undefined ? `, after ${span(e.ms)}` : ''}`;
  }

  function drawFeed(b, all) {
    const machine = v.scope === 'machine';
    const items = all.filter((e) => v.kinds.has(FILTER_OF[e.kind] || e.kind));
    const range = $('sess-range');
    range.hidden = !v.turn;
    if (v.turn) {
      fill(range, icon('funnel'), `One turn: ${v.turn.label}. `, el('button', {
        type: 'button', class: 'link-btn plain', onclick: () => {
          v.turn = null;
          load();
        },
      }, 'Show everything'));
    }
    $('sess-feed-count').textContent = items.length < all.length ? `${num(items.length)} of ${num(all.length)} shown` : `${num(all.length)} newest`;
    const key = `${v.scope}:${b.focus}:${v.lane}:${items.length}:${items[0]?.id}:${items.map((e) => e.status || '').join('')}`;
    if (key !== v.feedKey) {
      const ctxKey = `${v.scope}:${b.focus}:${v.lane}`;
      const seen = v.seenFor === ctxKey ? v.seen : null;
      v.feedKey = key;
      v.seenFor = ctxKey;
      v.seen = new Set(items.map((e) => e.id));
      fill($('sess-feed'), items.map((e) => el('li', { class: `ev is-${e.kind}${e.status ? ` st-${e.status}` : ''}${e.outcome ? ` oc-${e.outcome}` : ''}${seen && !seen.has(e.id) ? ' is-new' : ''}` },
        el('span', { class: 'ev-icon' }, icon(KIND_ICON[e.kind] || 'dot')),
        el('div', { class: 'ev-text' },
          machine && e.session ? el('button', { type: 'button', class: 'ev-session', title: 'Open this session', onclick: () => choose(e.session), text: e.sessionLabel }) : null,
          e.lane && e.lane !== 'main' && (machine || v.lane === 'all') ? el('span', { class: 'ev-agent', text: e.laneLabel }) : null,
          e.kind === 'prompt' && e.tool === 'command' ? el('span', { class: 'ev-tool', text: 'command' }) : null,
          e.tool && !['say', 'prompt', 'turn', 'notify', 'queue'].includes(e.kind) ? el('span', { class: 'ev-tool', text: e.tool }) : null,
          e.kind === 'queue' ? el('span', { class: 'ev-tool', text: 'sent while working' }) : null,
          e.text),
        el('span', { class: 'ev-side' },
          e.status || e.kind === 'turn' ? el('span', { class: `ev-status is-${e.status || 'ok'}`, title: statusTip(e) }, icon(e.kind === 'turn' ? 'timer' : STATUS_ICON[e.status] || 'dot'), e.ms !== null && e.ms !== undefined ? el('span', { text: span(e.ms) }) : null) : null,
          el('time', { class: 'ev-time', text: clock(e.t), title: `${when(e.t)}${e.line ? ` · transcript line ${e.line}` : ''}` })))));
    }
    const empty = $('sess-feed-empty');
    empty.hidden = items.length > 0;
    if (!items.length) empty.textContent = all.length ? 'Nothing of the kinds chosen. Turn a filter back on above.' : machine ? 'No session on this machine has written anything in the last fifteen minutes.' : b.detail ? 'Nothing yet. Prompts, replies and tool calls appear here as they happen.' : 'No session to show yet.';
  }

  function item(cls, glyph, title, meta, extra = null, onclick = null, keyId = null) {
    const body = [el('span', { class: 'sess-item-icon' }, glyph), el('span', { class: 'sess-item-body' }, el('b', { class: 'sess-item-title', text: title }), meta ? el('span', { class: 'sess-item-meta', text: meta }) : null, extra)];
    return el('li', { class: `sess-item ${cls}` }, onclick ? el('button', { type: 'button', class: 'sess-item-btn', 'data-key': keyId, onclick }, ...body) : el('div', { class: 'sess-item-btn' }, ...body));
  }

  function drawSide(d) {
    if (!d) {
      for (const id of ['sess-agents', 'sess-jobs', 'sess-turns', 'sess-tools', 'sess-stats', 'sess-cost']) fill($(id));
      for (const id of ['sess-agents-count', 'sess-jobs-count', 'sess-turns-count']) $(id).textContent = '';
      return;
    }
    // Agents
    const lanes = d.lanes;
    const going = lanes.filter((l) => l.status === 'running').length;
    $('sess-agents-count').textContent = lanes.length ? `${num(lanes.length)}${going ? ` · ${num(going)} working` : ''}` : '';
    keepFocus($('sess-agents'), () => fill($('sess-agents'), lanes.length ? lanes.slice().reverse().map((l) => {
      const glyph = l.status === 'running' ? el('span', { class: `live${l.quiet ? ' is-quiet' : ''}` }) : icon(l.status === 'done' ? 'check-circle' : 'stop-circle', 'ph-duotone');
      const meta = [l.type, model(l.model), `${num(l.stats.tools)} tools`, l.status === 'running' ? `active ${ago(l.last)}` : span(l.last - l.started), l.background ? 'background' : null].filter((x) => x && x !== '-').join(' · ');
      const latest = l.latest ? el('span', { class: 'sess-item-latest', text: `${l.latest.tool && l.latest.kind !== 'say' ? `${l.latest.tool}: ` : ''}${l.latest.text}` }) : null;
      return item(`is-${l.status}${l.id === d.lane ? ' is-current' : ''}`, glyph, l.label, meta, latest, () => {
        v.lane = l.id;
        v.scope = 'session';
        v.turn = null;
        navigate();
      }, `agent:${l.id}`);
    }) : el('li', { class: 'empty', text: 'This session has not started any subagents.' })));
    // Workflow runs and background tasks
    const runs = d.runs;
    const bg = d.background.filter((x) => !(x.kind === 'workflow' && x.run && runs.some((r) => r.id === x.run)));
    const live = runs.filter((r) => r.status === 'running').length + bg.filter((x) => x.status === 'running').length;
    $('sess-jobs-count').textContent = runs.length + bg.length ? `${num(runs.length + bg.length)}${live ? ` · ${num(live)} running` : ''}` : '';
    keepFocus($('sess-jobs'), () => fill($('sess-jobs'),
      runs.slice().reverse().map((r) => item(`is-${r.status}`, icon('tree-structure', 'ph-duotone'), r.title, `${r.status} · ${num(r.done)} of ${num(r.agents)} agents done${r.running ? `, ${num(r.running)} running` : ''} · ${r.status === 'running' ? `started ${ago(r.started)}` : span((r.last || r.started) - r.started)}`,
        el('span', { class: 'sess-item-action' }, icon('arrow-square-out'), 'Open in Live'), () => ctx.openRun(d.session.slug, r.id), `run:${r.id}`)),
      bg.map((x) => item(`is-${x.status}`, icon(x.kind === 'shell' ? 'terminal' : x.kind === 'workflow' ? 'tree-structure' : 'gear-six', 'ph-duotone'), x.label, `${x.kind} · ${x.status}${x.started ? ` · ${x.ended ? span(x.ended - x.started) : `for ${span(Date.now() - x.started)}`}` : ''}`,
        x.summary ? el('span', { class: 'sess-item-latest', text: x.summary }) : null)),
      runs.length || bg.length ? null : el('li', { class: 'empty', text: 'No workflow runs or background commands in this session.' })));
    // Turns
    const turns = d.turns;
    $('sess-turns-count').textContent = turns.length ? `${num(turns.length)} newest` : '';
    keepFocus($('sess-turns'), () => fill($('sess-turns'), turns.length ? turns.slice(0, 14).map((t, i) => {
      const chosen = v.turn && v.turn.from === t.start;
      return item(`${t.open ? 'is-running' : 'is-done'}${chosen ? ' is-current' : ''}`, t.open ? el('span', { class: 'live' }) : icon('chat-circle-text', 'ph-duotone'), t.prompt || 'A turn with no prompt read', `${t.open ? `going for ${span(Date.now() - t.start)}` : span(t.ms)} · ${num(t.tools)} tool calls${t.start ? ` · ${clock(t.start)}` : ''}`, null, t.start ? () => {
        v.turn = chosen ? null : { from: t.start, to: t.end || null, label: (t.prompt || 'a turn').slice(0, 80) };
        v.scope = 'session';
        v.feedKey = '';
        load();
      } : null, `turn:${t.start || i}`);
    }) : el('li', { class: 'empty', text: 'No turn has finished yet.' })));
    // Tools and cost
    const st = d.stats;
    const stat = (label, val, bad, tip) => el('div', { class: `stat${bad ? ' is-bad' : ''}`, title: tip || null }, el('b', { text: val }), el('span', { text: label }));
    fill($('sess-stats'),
      stat('tool calls', num(st.tools), false, `${num(st.toolsOk)} came back ok, ${num(st.toolsFailed)} as errors, ${num(st.toolsOpen)} still open`),
      stat('errors', num(st.errors), st.errors > 0, 'Tool results marked as errors, and errors the session recorded'),
      stat('test runs', st.tests ? `${num(st.testsPassed)}/${num(st.tests)}` : '0', st.testsFailed > 0, `${num(st.tests)} test commands: ${num(st.testsPassed)} passed, ${num(st.testsFailed)} failed, ${num(st.testsUnknown)} with output no adapter could read`),
      stat('commits', st.commits ? `${num(st.commitsConfirmed)}/${num(st.commits)}` : '0', st.commitsFailed > 0, `${num(st.commits)} tried, ${num(st.commitsConfirmed)} confirmed by git's summary line`),
      stat('edits', num(Object.entries(st.byTool).filter(([k]) => /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(k)).reduce((n, [, x]) => n + x, 0)), false, 'Edit, Write and notebook edits'),
      stat('log', `${(st.bytes / 1048576).toFixed(1)} MB`, false, `The transcript's size; ${num(st.events)} events read${d.session.partial ? ', from its last 16 MB' : ''}`));
    const by = Object.entries(st.byTool).sort((x, y) => y[1] - x[1]).slice(0, 8);
    const max = by[0]?.[1] || 1;
    fill($('sess-tools'), by.map(([k, n]) => el('div', { class: 'tool-row' }, el('span', { text: k, title: k }), el('span', { class: 'bar' }, el('span', { width: `${Math.round((n / max) * 100)}%` })), el('b', { text: num(n) }))));
    const c = d.cost;
    fill($('sess-cost'), c ? [
      el('p', {}, el('b', { text: `${usd(c.usd)} ` }), `in Claude Code's last cost record${c.at ? `, written near ${clock(c.at)}` : ''}${c.apiMs ? `: ${span(c.apiMs)} of model time` : ''}${c.toolMs ? ` and ${span(c.toolMs)} in tools` : ''}. It writes one now and then, not live, so it can trail the work.`),
      ...Object.entries(c.models).map(([k, m]) => el('p', { class: 'mono sess-model' }, `${model(k)}  ${usd(m.usd)} · ${tokens(m.output)} out · ${tokens(m.cacheRead)} cache read`)),
    ] : el('p', { class: 'muted', text: 'No cost record yet: Claude Code writes one as the session goes.' }));
  }

  /** The counters that run on their own between answers: elapsed and the now line's "for". */
  function tick() {
    if (!v.on) return;
    const e = $('sess-elapsed');
    if (e && e.dataset.from) {
      const to = Number(e.dataset.to) || Date.now();
      e.textContent = span(to - Number(e.dataset.from));
    }
    const s = $('sess-now-since');
    if (s) s.textContent = `for ${span(Date.now() - Number(s.dataset.since))}`;
  }
  setInterval(tick, 1000);

  return {
    panel: 'view-sessions',
    show(params) {
      readParams(params);
      v.on = true;
      v.feedKey = '';
      load();
    },
    hide() {
      v.on = false;
      clearTimeout(v.timer);
    },
    onState() { /* the view polls /api/sessions itself; the project's state does not change it */ },
  };
}
