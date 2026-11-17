/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Server (dd1 Tools Edition - v1.9)
 *     - File Name: server.mjs
 *     - Relative Path: lib/server.mjs
 *     - Artifact Type: library
 *     - Version: 1.9.0
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.9.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       allowHosts: names a preview pane or port forward sends, answered
 *       on any port beside 127.0.0.1 and localhost on the service's own. A
 *       refused request is told the name it used and, should that be the
 *       user's own preview or forward, the flag that answers it; onRefused
 *       hears each name once.
 *     - 1.8.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — GET
 *       /api/sessions: every Claude Code session on the machine, the one in
 *       focus in full and, for the machine scope, everything at once, from
 *       sessions.mjs. A project with sessions but no workflow run yet can be
 *       asked for by its slug, so its views say it has none instead of
 *       showing another project's.
 *     - 1.7.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — GET
 *       /api/insights: the run in focus as series and the project's runs as
 *       trends, from insights.mjs.
 *     - 1.6.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       Completion and profiling (R10, R09): /api/profile, and /api/handoff
 *       with the report downloaded as Markdown or JSON when format asks for
 *       it.
 *     - 1.5.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Tests,
 *       comparison and files (R06, R05, R08): /api/tests, /api/compare,
 *       /api/related, /api/files and /api/file; a run the archive has not
 *       read in full is compared from its transcripts read now.
 *     - 1.4.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Timeline
 *       and watchpoints (R04, R07): /api/timeline and /api/notices; the watch
 *       looks at every project every 15 s while the service runs; /api/state
 *       carries each project's attention.
 *     - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       Investigation (R01): /api/incidents and /api/investigate, for a run
 *       or the project's current one; an event id of the wrong form is
 *       refused with 400.
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       archive (R03): /api/archive pages every run of a project and
 *       /api/search searches them, from an index built in the background
 *       and kept in the state folder. The page's files are listed once at
 *       start from web/, so a new script needs no entry by hand; a path is
 *       still only ever looked up in that list.
 *     - 1.0.0 (11/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version.
 *
 * ✒ Description:
 *     The HTTP side of agent-watch: serves the page in web/ and the JSON the
 *     page reads, on the loopback address only. It answers GET for the page,
 *     its files and the API, and one POST, /api/stop, which needs the token
 *     the service was started with.
 *
 * ✒ Key Features:
 *     - Listens on 127.0.0.1 only; a request whose Host is not this address
 *       and port is refused, so another site cannot read it through a
 *       renamed host (DNS rebinding)
 *     - Static files from a list made once at start of what web/ holds,
 *       never by a path from the URL
 *     - /api/state: the live state; /api/archive and /api/search: every run
 *     - Only a slug that names a project and a run id of the wf_ form are
 *       taken from a query
 *     - The archive is built in the background, throttled, at most once a
 *       minute per project, starting a few seconds after the service
 *     - /api/stop compares its token in constant time and closes the server
 *     - Every response no-store; errors as plain text, never a stack
 *
 * ✒ Usage Instructions:
 *     import { startServer } from './lib/server.mjs';
 *     const s = await startServer({ port: 4300, root, token, stateDir });
 *     s.url; await s.close();
 *
 * ✒ Examples:
 *     GET  /api/state?project=<slug>[&run=wf_...]
 *     GET  /api/archive?project=<slug>&offset=0&limit=25[&status=killed]
 *     GET  /api/search?project=<slug>&q=file:shader.js
 *     GET  /api/sessions[?session=<uuid>&lane=all|main|<agent>&scope=machine&from=&to=]
 *     GET  /api/health          { ok, version, pid, started, project }
 *     POST /api/stop            header X-Agent-Watch-Token: <token>
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+ (node:http, node:crypto); collect.mjs,
 *       archive.mjs, read.mjs, sessions.mjs
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Security: the transcripts it reports hold prompts and tool output;
 *       nothing is reachable from another machine
 * ----------------------------------------------------------------------------
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createCollector, SLUG, RUN_ID } from './collect.mjs';
import { createArchive } from './archive.mjs';
import { createHealth } from './read.mjs';
import { incidents, investigate } from './investigate.mjs';
import { timeline } from './timeline.mjs';
import { createWatch } from './watch.mjs';
import { casesOf, regression, compare, related, entryFromBundle } from './compare.mjs';
import { fileMap, history } from './files.mjs';
import { runInsights, projectTrends } from './insights.mjs';
import { profile } from './profile.mjs';
import { loadCriteria, evaluate, report } from './handoff.mjs';
import { createSessions, SESSION_ID, LANE_ID } from './sessions.mjs';

const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/** The page's files, listed once: URL path -> [file, type]. */
export function webFiles(dir = WEB) {
  const out = { '/': [path.join(dir, 'index.html'), TYPES['.html']] };
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(p, r);
      else if (TYPES[path.extname(e.name)] && /^[\w./-]+$/.test(r)) out[r] = [p, TYPES[path.extname(e.name)]];
    }
  };
  walk(dir, '');
  return out;
}

const EVENT_ID = /^(?:[\w-]{1,64}#\d{1,7}|(?:log|reported):[^\n]{1,200})$/;
/** The fields of a run a view's heading needs. */
const brief = (r) => ({ id: r.id, title: r.title, name: r.name, status: r.status, why: r.why, started: r.started, ended: r.ended, last: r.last, branch: r.branch, agents: r.agents.map((a) => ({ id: a.id, label: a.label, phase: a.phase, status: a.status })), phases: r.phases });

const same = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const int = (v, d, lo, hi) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : d;
};

/**
 * Starts the service. Resolves to { url, port, close, archive } once it
 * listens; port 0 takes a free one. onStop is called after /api/stop closes it.
 */
export function startServer({ port = 4300, root, project = null, token = null, version = '0.0.0', onStop = null, stateDir = null, indexDelayMs = 3000, watch = true, rules = {}, watchMs = 15000, registryDir = null, sessionOpts = {}, allowHosts = [], onRefused = null } = {}) {
  const health = createHealth();
  const collector = createCollector({ root, health });
  const sessions = createSessions({ root, collector, health, registryDir, ...sessionOpts });
  const archive = createArchive({ dir: stateDir ? path.join(stateDir, 'archive') : null, collector, health });
  const watcher = watch ? createWatch({ collector, file: stateDir ? path.join(stateDir, 'notices.json') : null, rules }) : null;
  const files = webFiles();
  const started = Date.now();
  const lastRefresh = new Map();
  const timers = new Set();
  let closing = false;
  let actual = port;
  let watchTimer = null;
  let watching = false;
  async function watchTick() {
    if (!watcher || watching || closing) return;
    watching = true;
    try {
      await watcher.tick();
    } catch (err) {
      health.fail('watch', null, err);
    } finally {
      watching = false;
    }
  }
  if (watcher) {
    const first = setTimeout(watchTick, Math.min(2000, watchMs));
    first.unref();
    timers.add(first);
    watchTimer = setInterval(watchTick, watchMs);
    watchTimer.unref();
  }

  /** Builds or brings up to date a project's archive, at most once a minute. */
  function scheduleIndex(slug, delay = 0) {
    if (!slug || closing) return;
    const last = lastRefresh.get(slug) || 0;
    if (Date.now() - last < 60000) return;
    lastRefresh.set(slug, Date.now());
    const t = setTimeout(() => {
      timers.delete(t);
      if (!closing) archive.refresh(slug).catch(() => {});
    }, delay);
    t.unref();
    timers.add(t);
  }
  const extraFor = (slug, id) => {
    const e = archive.entry(slug, id);
    return e?.args ? { args: Object.fromEntries(Object.entries(e.args).filter(([, v]) => v !== undefined)) } : null;
  };
  const slugOf = (url) => {
    const asked = url.searchParams.get('project') || project;
    // A project folder with sessions but no workflow run yet counts too: its views then say it has none.
    if (asked && SLUG.test(asked) && (collector.projects().some((p) => p.slug === asked) || fs.existsSync(path.join(root, asked)))) return asked;
    return collector.projects()[0]?.slug || null;
  };

  const routes = {
    '/api/health': () => ({ ok: true, version, pid: process.pid, started, project }),
    '/api/projects': () => collector.projects(),
    '/api/state': async (url) => {
      const slug = slugOf(url);
      const state = await collector.state(slug, url.searchParams.get('run'), extraFor);
      scheduleIndex(state.project?.slug, indexDelayMs);
      return { version, ...state, archive: state.project ? archive.status(state.project.slug) : null, attention: watcher ? watcher.attention() : null, latestNotice: watcher ? watcher.all()[0]?.at || null : null, watching: !!watcher };
    },
    '/api/timeline': async (url) => {
      const b = await bundleOf(url);
      if (!b) return null;
      const kinds = String(url.searchParams.get('kinds') || '').split(',').filter((k) => /^(say|tool|read|edit|test|commit|error)$/.test(k));
      const num = (k) => {
        const v = Number(url.searchParams.get(k));
        return url.searchParams.has(k) && Number.isFinite(v) ? v : null;
      };
      return timeline(b, { from: num('from'), to: num('to'), limit: int(url.searchParams.get('limit'), 1500, 1, 5000), kinds: kinds.length ? kinds : null });
    },
    '/api/notices': (url) => {
      if (!watcher) return { watching: false, notices: [], attention: {}, rules: null, now: Date.now() };
      const since = Number(url.searchParams.get('since')) || 0;
      return { watching: true, notices: watcher.since(since, { limit: int(url.searchParams.get('limit'), 100, 1, 200) }), attention: watcher.attention(), rules: watcher.rules, now: Date.now() };
    },
    '/api/archive': (url) => {
      const slug = slugOf(url);
      if (!slug) return { total: 0, rows: [], status: null };
      scheduleIndex(slug);
      const status = url.searchParams.get('status');
      return { ...archive.list(slug, { offset: int(url.searchParams.get('offset'), 0, 0, 1e6), limit: int(url.searchParams.get('limit'), 25, 1, 200), status: /^[a-z]{3,20}$/.test(status || '') ? status : null }), status: archive.status(slug) };
    },
    '/api/search': (url) => {
      const slug = slugOf(url);
      if (!slug) return { q: '', total: 0, rows: [] };
      const q = String(url.searchParams.get('q') || '').slice(0, 300);
      return { ...archive.search(slug, q, { limit: int(url.searchParams.get('limit'), 50, 1, 200) }), status: archive.status(slug) };
    },
    '/api/incidents': async (url) => {
      const b = await bundleOf(url);
      if (!b) return null;
      const list = incidents(b);
      return { run: brief(b.run), incidents: list, counts: { total: list.length, unresolved: list.filter((i) => !i.recovered).length, recovered: list.filter((i) => i.recovered).length } };
    },
    '/api/investigate': async (url) => {
      const ev = String(url.searchParams.get('event') || '');
      if (!EVENT_ID.test(ev)) return { $status: 400, text: 'An event id looks like <agent>#<n>, log:<name> or reported:<name>.' };
      const b = await bundleOf(url);
      if (!b) return null;
      const d = investigate(b, ev);
      return d ? { run: brief(b.run), ...d } : null;
    },
  };

  // The Sessions view: every Claude Code session on the machine, not only workflow runs.
  routes['/api/sessions'] = (url) => {
    const p = url.searchParams;
    const id = p.get('session');
    const lane = p.get('lane') || 'all';
    const at = (k) => {
      const v = Number(p.get(k));
      return p.has(k) && Number.isFinite(v) && v > 0 ? v : null;
    };
    return sessions.view({ session: SESSION_ID.test(id || '') ? id : null, lane: LANE_ID.test(lane) ? lane : 'all', scope: p.get('scope') === 'machine' ? 'machine' : 'session', from: at('from'), to: at('to'), closed: p.get('closed') !== '0' });
  };

  Object.assign(routes, {
    '/api/tests': async (url) => {
      const b = await bundleOf(url);
      if (!b) return null;
      const slug = slugOf(url);
      const r = regression({ id: b.run.id, name: b.run.name, started: b.run.started, cases: casesOf(b) }, archive.entries(slug));
      return { run: brief(b.run), ...r, archive: archive.status(slug) };
    },
    '/api/compare': async (url) => {
      const slug = slugOf(url);
      const a = url.searchParams.get('a');
      const bId = url.searchParams.get('b');
      if (!RUN_ID.test(a || '') || !RUN_ID.test(bId || '')) return { $status: 400, text: 'Compare needs two run ids, a and b, of the wf_ form.' };
      const [ea, eb] = await Promise.all([entryOf(slug, a), entryOf(slug, bId)]);
      if (!ea || !eb) return null;
      return compare(ea, eb);
    },
    '/api/related': async (url) => {
      const slug = slugOf(url);
      const b = await bundleOf(url);
      if (!b) return null;
      const e = await entryOf(slug, b.run.id);
      return { run: brief(b.run), related: related(e, archive.entries(slug)), archive: archive.status(slug), note: 'Each suggestion is inferred from what the runs share; none is a claim that one run continued another.' };
    },
    '/api/files': async (url) => {
      const b = await bundleOf(url);
      if (!b) return null;
      return { run: brief(b.run), ...fileMap(b) };
    },
    '/api/file': async (url) => {
      const p = String(url.searchParams.get('path') || '');
      if (!p || p.length > 500 || /[\x00-\x1f]/.test(p)) return { $status: 400, text: 'A path is up to 500 characters, with no control characters.' };
      const b = await bundleOf(url);
      if (!b) return null;
      return { run: brief(b.run), path: p, events: history(b, p) };
    },
  });

  const criteriaDir = stateDir ? path.join(stateDir, 'criteria') : null;
  Object.assign(routes, {
    '/api/profile': async (url) => {
      const b = await bundleOf(url);
      return b ? profile(b) : null;
    },
    // The Insights view: the run in focus as series, and the project's runs as trends.
    '/api/insights': async (url) => {
      const slug = slugOf(url);
      const b = await bundleOf(url);
      return {
        run: b ? runInsights(b, fileMap(b).files) : null,
        project: slug ? projectTrends(archive.entries(slug)) : null,
        archive: slug ? archive.status(slug) : null,
      };
    },
    '/api/handoff': async (url) => {
      const b = await bundleOf(url);
      if (!b) return null;
      const crit = loadCriteria(criteriaDir, b.run.name);
      const extras = { incidents: incidents(b), cases: casesOf(b), files: fileMap(b).files };
      const ev = evaluate(b, crit.criteria, extras);
      const format = url.searchParams.get('format');
      const day = new Date().toISOString().slice(0, 10);
      if (format === 'md') return { $download: report(b, crit, ev, extras, 'md'), type: 'text/markdown; charset=utf-8', name: `handoff-${b.run.id}-${day}.md` };
      if (format === 'json') return { $download: JSON.stringify(report(b, crit, ev, extras, 'json'), null, 2), type: 'application/json', name: `handoff-${b.run.id}-${day}.json` };
      return { run: brief(b.run), criteria: { source: crit.source, path: crit.path, error: crit.error || null, list: crit.criteria }, results: ev, satisfied: ev.filter((x) => x.state === 'satisfied').length, preview: report(b, crit, ev, extras, 'md') };
    },
  });

  /** A run as the archive keeps it, or read now when the archive has not read it in full. */
  async function entryOf(slug, id) {
    const e = archive.entry(slug, id);
    if (e?.deep && !e.live) return e;
    const b = await collector.runBundle(slug, id, extraFor(slug, id));
    return b ? entryFromBundle(b) : null;
  }

  /** One run's bundle: the run asked for, else the project's current run. */
  async function bundleOf(url) {
    const slug = slugOf(url);
    if (!slug) return null;
    let id = url.searchParams.get('run');
    if (!id) {
      const st = await collector.state(slug, null, extraFor);
      id = st.focus;
    }
    return id ? collector.runBundle(slug, id, extraFor(slug, id)) : null;
  }

  const allowed = new Set(allowHosts.map((h) => String(h).toLowerCase()));
  const refused = new Set();
  /** 127.0.0.1 or localhost on the service's own port, or a name it was started to answer, on any port. */
  const hostOk = (host) => host === `127.0.0.1:${actual}` || host === `localhost:${actual}` || (allowed.size > 0 && allowed.has(hostName(host)));

  const server = http.createServer(async (req, res) => {
    const send = (code, body, type = 'text/plain; charset=utf-8') => {
      res.writeHead(code, {
        'Content-Type': type,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      });
      res.end(body);
    };
    const host = String(req.headers.host || '');
    if (!hostOk(host)) {
      const name = hostName(host);
      if (name && !refused.has(name) && refused.size < 20) {
        refused.add(name);
        onRefused?.(name);
      }
      return send(403, name
        ? `Wrong host: ${name}. agent-watch answers 127.0.0.1 and localhost on its own port. If ${name} is your own preview or port forward, start agent-watch with --allow-host ${name}.`
        : 'Wrong host.');
    }
    const url = new URL(req.url, `http://${host}`);
    try {
      if (req.method === 'POST' && url.pathname === '/api/stop') {
        if (!token || !same(req.headers['x-agent-watch-token'], token)) return send(403, 'Wrong token.');
        send(200, '{"ok":true}', 'application/json');
        setTimeout(() => {
          close().then(() => onStop?.());
        }, 50);
        return undefined;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'GET only.');
      const file = files[url.pathname];
      if (file) return send(200, fs.readFileSync(file[0]), file[1]);
      const route = routes[url.pathname];
      if (route) {
        const run = url.searchParams.get('run');
        if (run && !RUN_ID.test(run)) return send(400, 'A run id looks like wf_ followed by letters, digits and dashes.');
        const body = await route(url);
        if (body === null || body === undefined) return send(404, 'No such run in this project.');
        if (body.$status) return send(body.$status, body.text);
        if (body && body.$download) {
          res.writeHead(200, { 'Content-Type': body.type, 'Content-Disposition': `attachment; filename="${body.name}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
          return res.end(body.$download);
        }
        return send(200, JSON.stringify(body), 'application/json');
      }
      return send(404, 'Not found.');
    } catch (err) {
      return send(500, short(err?.message || err));
    }
  });
  const close = () => new Promise((resolve) => {
    closing = true;
    for (const t of timers) clearTimeout(t);
    clearInterval(watchTimer);
    watcher?.flush();
    collector.close();
    server.closeAllConnections?.();
    server.close(() => resolve());
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      actual = server.address().port;
      if (project) scheduleIndex(project, indexDelayMs);
      resolve({ url: `http://127.0.0.1:${actual}/`, port: actual, close, archive, collector, sessions, routes, watcher, watchTick });
    });
  });
}

const short = (s) => String(s).split('\n')[0].slice(0, 200);

/** The name in a Host header, lower-cased and without its port; null when it is not a host name. */
export function hostName(host) {
  const m = /^(?:\[([0-9a-f:.]+)\]|([a-z0-9._-]+))(?::\d{1,5})?$/i.exec(String(host || ''));
  return m ? (m[1] || m[2]).toLowerCase() : null;
}
