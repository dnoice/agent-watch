/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Watchpoints (dd1 Tools Edition - v1.0)
 *     - File Name: watch.mjs
 *     - Relative Path: lib/watch.mjs
 *     - Artifact Type: library
 *     - Version: 1.0.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's watchpoint stage (R07): every project's
 *       recent runs looked at every 15 seconds by the service itself, and a
 *       notice for each meaningful change, deduplicated and kept.
 *
 * ✒ Description:
 *     Watches every project's recent runs while the service runs, whether
 *     or not a page is open, and writes a notice when something worth a
 *     look happens: a run finishes or ends, a call comes back as an error, a
 *     test run reports failures, an agent goes quiet. It only reads; it
 *     never stops, restarts or reruns anything.
 *
 * ✒ Key Features:
 *     - The first look only learns where things stand, so starting the
 *       service raises no notice about the past
 *     - Each notice once: keyed by its run and the event that raised it;
 *       an agent's quiet spell raises one notice until it is active again
 *     - Every notice names the run, the agent and the event, so the page
 *       can open the evidence, and says how it was known: observed in a
 *       record or a tool result, or inferred from inactivity
 *     - Rules switched on or off, and the quiet threshold in minutes
 *     - The last 200 notices kept in the state folder, across restarts
 *     - attention(): for each project, its running runs and newest notice
 *
 * ✒ Usage Instructions:
 *     const w = createWatch({ collector, file, rules: { quietMinutes: 10 } });
 *     await w.tick();   // the service calls it every 15 s
 *     w.since(ms)       // notices newer than ms, newest first
 *
 * ✒ Examples:
 *     createWatch({ collector, rules: { quiet: false } })   // no quiet notices
 *     w.attention()      // { slug: { running: 1, last: 1763... } }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+ (node:fs); collect.mjs's collector
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Cost: each look reads the project folders and the running runs'
 *       new transcript lines only; finished runs are not read again
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';

const KEEP = 200;
const RECENT_MS = 6 * 3600 * 1000;
export const RULES = { finished: true, errors: true, tests: true, quiet: true, quietMinutes: 10 };

export function createWatch({ collector, file = null, rules = {}, now = () => Date.now() } = {}) {
  const r = { ...RULES, ...rules };
  const snap = new Map();
  const seen = new Set();
  let notices = [];
  let seeded = false;
  const attention = new Map();
  let saveTimer = null;

  if (file) {
    try {
      const v = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(v.notices)) notices = v.notices.slice(0, KEEP);
      for (const n of notices) seen.add(n.key);
    } catch { /* first run */ }
  }

  function save() {
    if (!file || saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const tmp = `${file}.${process.pid}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify({ v: 1, notices }));
        fs.renameSync(tmp, file);
      } catch { /* kept in memory */ }
    }, 1000);
    saveTimer.unref?.();
  }

  function raise(n) {
    if (seen.has(n.key)) return null;
    seen.add(n.key);
    const notice = { id: `${n.at || now()}-${notices.length}-${Math.random().toString(36).slice(2, 7)}`, at: n.at || now(), ...n };
    notices.unshift(notice);
    if (notices.length > KEEP) notices.length = KEEP;
    save();
    return notice;
  }

  /** One look at every project's recent runs. Returns the notices it raised. */
  async function tick() {
    const raised = [];
    const add = (n) => {
      if (!seeded) {
        seen.add(n.key);
        return;
      }
      const x = raise(n);
      if (x) raised.push(x);
    };
    const projects = collector.projects();
    for (const p of projects) {
      let running = 0;
      const recent = collector.runsOf(p.slug).filter((rn) => now() - rn.touched < RECENT_MS || snap.get(rn.id)?.status === 'running');
      for (const rn of recent) {
        let run;
        try {
          const before = snap.get(rn.id);
          const live = !before || before.status === 'running' || before.status === 'starting';
          run = collector.describe(rn, live);
        } catch {
          continue;
        }
        const prev = snap.get(rn.id);
        if (run.status === 'running') running++;
        const base = { project: p.slug, projectName: p.name, run: run.id, runTitle: run.title };
        if (r.finished && prev && prev.status === 'running' && run.status !== 'running') {
          const how = run.status === 'completed' ? 'finished' : run.status === 'unfinished' ? 'went quiet past 30 minutes without saving a record' : `ended as ${run.status}`;
          add({ ...base, key: `${run.id}|status|${run.status}`, kind: run.status === 'completed' ? 'run-finished' : 'run-ended', text: `${run.title} ${how}`, evidence: run.why?.label, basis: run.why?.basis, at: run.ended || now() });
        }
        for (const a of run.agents) {
          const feed = a.st?.events || [];
          const pa = prev?.agents?.get(a.id);
          if (r.errors) {
            for (const e of feed) {
              if (e.kind !== 'error') continue;
              if (pa && e.t && pa.lastT && e.t <= pa.lastT) continue;
              add({ ...base, key: `${run.id}|${e.id}`, kind: 'error', agent: a.id, agentLabel: a.label, event: e.of || e.id, text: `${a.label}: ${e.tool || 'a call'} came back as an error: ${e.text}`, evidence: 'tool result in the transcript', basis: 'observed', at: e.t || now() });
            }
          }
          if (r.tests) {
            for (const e of feed) {
              if (e.kind !== 'test' || e.outcome !== 'failed') continue;
              if (pa && e.end && pa.lastT && e.end <= pa.lastT) continue;
              const f = e.tests ? `${e.tests.failed} failed, ${e.tests.passed} passed` : 'failed';
              add({ ...base, key: `${run.id}|test|${e.id}`, kind: 'test-failed', agent: a.id, agentLabel: a.label, event: e.id, text: `${a.label}: tests ${f}: ${e.text}`, evidence: 'tool result in the transcript', basis: 'observed', at: e.end || e.t || now() });
            }
          }
          if (r.quiet && r.quietMinutes > 0 && a.status === 'running' && run.status === 'running') {
            const idle = now() - (a.last || 0);
            const episode = `${run.id}|quiet|${a.id}|${a.last}`;
            if (idle > r.quietMinutes * 60000) add({ ...base, key: episode, kind: 'quiet', agent: a.id, agentLabel: a.label, text: `${a.label} has written nothing for ${Math.round(idle / 60000)} minutes`, evidence: 'inferred from inactivity', basis: 'inferred', at: now() });
          }
        }
        snap.set(rn.id, { status: run.status, agents: new Map(run.agents.map((a) => [a.id, { lastT: Math.max(a.last || 0, ...(a.st?.events || []).map((e) => e.end || e.t || 0)) }])) });
      }
      const newest = notices.find((n) => n.project === p.slug);
      attention.set(p.slug, { running, last: newest ? newest.at : null, name: p.name });
    }
    seeded = true;
    return raised;
  }

  return {
    tick,
    rules: r,
    since(ms = 0, { limit = 100 } = {}) {
      return notices.filter((n) => n.at > ms || !ms).slice(0, limit);
    },
    all: () => notices.slice(),
    attention: () => Object.fromEntries(attention),
    flush() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (file) {
          try {
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, JSON.stringify({ v: 1, notices }));
          } catch { /* kept in memory */ }
        }
      }
    },
  };
}
