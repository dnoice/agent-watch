/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Test Outcomes (dd1 Tools Edition - v1.0)
 *     - File Name: tests.mjs
 *     - Relative Path: lib/tests.mjs
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
 *       version, for the audit's test-regression work (R06): test output
 *       read into named cases by one narrow adapter per format, the scratch
 *       logs read with them, and each case's history classified across runs.
 *
 * ✒ Description:
 *     Turns test output into structured outcomes: which cases passed,
 *     failed or were skipped, and the run's tally. Output no adapter
 *     recognises reads as unknown; nothing is inferred from a partial log.
 *     Then compares a run's cases with earlier runs' to find new failures,
 *     recoveries and cases that flip between results.
 *
 * ✒ Key Features:
 *     - Adapters, each narrow: the house suites ("  ok   name", " FAIL  name",
 *       "<n> passed, <m> failed"), TAP and node:test, pytest, Jest and
 *       Vitest, Mocha
 *     - A tally with no named cases is kept as a tally; named cases without a
 *       tally are counted, and the outcome says which it was
 *     - testLogs: the newest .log files in a folder, the last 32 KB of each,
 *       each read by the same adapters
 *     - classify: per case, new failure, recovered, still failing, new,
 *       stable, or a flaky candidate when its result changed at least twice
 *       in the runs compared
 *
 * ✒ Usage Instructions:
 *     const o = parseTestOutput(text);   // null when no adapter matched
 *     o.passed, o.failed, o.cases        // cases: [{ name, result }]
 *     classify(nowCases, [prevCases, olderCases])
 *
 * ✒ Examples:
 *     parseTestOutput('  ok   one\n FAIL  two\n\n1 passed, 1 failed')
 *     parseTestOutput('# pass 3\n# fail 0')
 *     parseTestOutput('==== 2 failed, 9 passed in 1.2s ====')
 *     classify({ a: 'failed' }, [{ a: 'passed' }])   // { a: 'new-failure' }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+ (node:fs, node:path)
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - Limits: a format not listed is unknown, and a log cut off before its
 *       tally reports its named cases only
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';

const MAX_CASES = 120;
const short = (s, n) => {
  s = String(s ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};
const caseName = (s) => short(String(s).replace(/\s+[—–-]{1,2}\s+.*$/, '').replace(/\s+\(\d+(\.\d+)?\s*m?s\)$/, ''), 160);

function outcome(format) {
  return { format, passed: 0, failed: 0, skipped: 0, total: null, tally: '', cases: [], counted: 'cases' };
}
function addCase(o, name, result) {
  if (!name) return;
  if (o.cases.length < MAX_CASES) o.cases.push({ name: caseName(name), result });
}
function fromCases(o) {
  o.passed = o.cases.filter((c) => c.result === 'passed').length;
  o.failed = o.cases.filter((c) => c.result === 'failed').length;
  o.skipped = o.cases.filter((c) => c.result === 'skipped').length;
}
const n = (v) => (v === undefined ? 0 : Number(v));

/** The house suites: "  ok   name", " FAIL  name — detail", "<n> passed, <m> failed". */
function house(lines) {
  const o = outcome('house');
  let tally = null;
  for (const l of lines) {
    let m = /^\s{0,4}ok {2,}(\S.*)$/.exec(l);
    if (m) addCase(o, m[1], 'passed');
    else if ((m = /^\s{0,4}FAIL {1,}(\S.*)$/.exec(l))) addCase(o, m[1], 'failed');
    const t = /\b(\d+) passed, (\d+) failed\b(?:, (\d+) skipped)?/.exec(l);
    if (t) tally = { l, t };
  }
  if (!tally && !o.cases.length) return null;
  fromCases(o);
  if (tally) {
    o.passed = n(tally.t[1]);
    o.failed = n(tally.t[2]);
    o.skipped = n(tally.t[3]);
    o.tally = short(tally.l, 140);
    o.counted = 'tally';
  }
  return o;
}

/** TAP, including node:test's: "ok 1 - name", "not ok 2 - name", "# pass 3". */
function tap(lines) {
  const o = outcome('tap');
  const sum = {};
  for (const l of lines) {
    const m = /^\s*(not )?ok \d+(?: -)? ?(.*?)(?:\s+#\s*(SKIP|TODO)\b.*)?$/i.exec(l);
    if (m) addCase(o, m[2] || '(unnamed)', m[3] ? 'skipped' : m[1] ? 'failed' : 'passed');
    const s = /^#\s*(pass|fail|skipped|skip|todo|tests)\s+(\d+)\s*$/i.exec(l.trim());
    if (s) sum[s[1].toLowerCase()] = Number(s[2]);
  }
  if (!o.cases.length && sum.pass === undefined && sum.fail === undefined) return null;
  fromCases(o);
  if (sum.pass !== undefined || sum.fail !== undefined) {
    o.passed = n(sum.pass);
    o.failed = n(sum.fail);
    o.skipped = n(sum.skipped ?? sum.skip) + n(sum.todo);
    o.total = sum.tests ?? null;
    o.tally = `# pass ${o.passed}, # fail ${o.failed}`;
    o.counted = 'tally';
  }
  return o;
}

/** pytest: the "== 2 failed, 9 passed in 1.2s ==" line, FAILED and PASSED case lines. */
function pytest(lines) {
  const o = outcome('pytest');
  let tally = null;
  for (const l of lines) {
    let m = /^(FAILED|ERROR)\s+(\S+::\S+)/.exec(l);
    if (m) addCase(o, m[2], 'failed');
    else if ((m = /^(\S+::\S+)\s+(PASSED|FAILED|SKIPPED|ERROR|XFAIL|XPASS)\b/.exec(l))) addCase(o, m[1], { PASSED: 'passed', XPASS: 'passed', SKIPPED: 'skipped', XFAIL: 'skipped' }[m[2]] || 'failed');
    if (/^=+ .*\b(passed|failed|error|errors|skipped)\b.* in [\d.]+s/.test(l)) tally = l;
  }
  if (!tally && !o.cases.length) return null;
  fromCases(o);
  if (tally) {
    const get = (w) => Number(new RegExp(`(\\d+) ${w}\\b`).exec(tally)?.[1] || 0);
    o.passed = get('passed');
    o.failed = get('failed') + get('errors?');
    o.skipped = get('skipped');
    o.tally = short(tally.replace(/^=+\s*|\s*=+$/g, ''), 140);
    o.counted = 'tally';
  }
  return o;
}

/** Jest and Vitest: "Tests: 1 failed, 5 passed, 6 total", "Tests  2 failed | 5 passed (7)", ✓ and ✕ lines. */
function jest(lines) {
  const o = outcome('jest');
  let tally = null;
  for (const l of lines) {
    const m = /^\s*(✓|√|✔|✕|×|✗|↓)\s+(.+?)(?:\s+\(\d+\s*m?s\))?$/.exec(l);
    if (m) addCase(o, m[2], { '✕': 'failed', '×': 'failed', '✗': 'failed', '↓': 'skipped' }[m[1]] || 'passed');
    if (/^\s*Tests:?\s+.*\b(\d+) (total|passed|failed)\b/.test(l) && !/Test Files/.test(l)) tally = l;
  }
  if (!tally && !o.cases.length) return null;
  fromCases(o);
  if (tally) {
    const get = (w) => Number(new RegExp(`(\\d+) ${w}\\b`).exec(tally)?.[1] || 0);
    o.passed = get('passed');
    o.failed = get('failed');
    o.skipped = get('skipped') + get('todo');
    o.tally = short(tally, 140);
    o.counted = 'tally';
  }
  return o;
}

/** Mocha: "12 passing", "1 failing", "2 pending". */
function mocha(lines) {
  const o = outcome('mocha');
  let p = null;
  let f = 0;
  let s = 0;
  for (const l of lines) {
    let m = /^\s*(\d+) passing\b/.exec(l);
    if (m) p = Number(m[1]);
    if ((m = /^\s*(\d+) failing\b/.exec(l))) f = Number(m[1]);
    if ((m = /^\s*(\d+) pending\b/.exec(l))) s = Number(m[1]);
  }
  if (p === null) return null;
  Object.assign(o, { passed: p, failed: f, skipped: s, tally: `${p} passing, ${f} failing`, counted: 'tally' });
  return o;
}

const ADAPTERS = [house, tap, pytest, jest, mocha];

/**
 * The outcome of test output: { format, passed, failed, skipped, total,
 * tally, cases, counted }, where counted is 'tally' when the runner's own
 * summary line gave the counts and 'cases' when they were counted from case
 * lines. Null when no adapter recognises the text.
 */
export function parseTestOutput(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  let best = null;
  for (const a of ADAPTERS) {
    const o = a(lines);
    if (!o) continue;
    // A runner's own tally outranks a count of case lines.
    if (!best || (o.counted === 'tally' && best.counted !== 'tally') || (o.counted === best.counted && o.cases.length > best.cases.length)) best = o;
  }
  if (best) best.total = best.total ?? best.passed + best.failed + best.skipped;
  return best;
}

/** The overall result of an outcome: failed, passed, or unknown when nothing ran. */
export function verdict(o) {
  if (!o) return 'unknown';
  if (o.failed > 0) return 'failed';
  if (o.passed > 0) return 'passed';
  return 'unknown';
}

/** The newest .log files in dir (six), each with its outcome and the lines worth showing. */
export function testLogs(dir, health = null) {
  if (!dir) return [];
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.log')).map((f) => {
      const p = path.join(dir, f);
      const s = fs.statSync(p);
      return { f, p, m: s.mtimeMs, s: s.size };
    });
  } catch (err) {
    health?.fail('test-log', dir, err);
    return [];
  }
  return files.sort((a, b) => b.m - a.m).slice(0, 6).map(({ f, p, m, s }) => {
    const size = Math.min(s, 32000);
    const buf = Buffer.alloc(size);
    let text = '';
    try {
      const fd = fs.openSync(p, 'r');
      try {
        fs.readSync(fd, buf, 0, size, s - size);
      } finally {
        fs.closeSync(fd);
      }
      text = buf.toString('utf8');
      health?.read('test-log');
    } catch (err) {
      health?.fail('test-log', p, err);
    }
    const lines = text.split('\n');
    const o = parseTestOutput(text);
    const fails = lines.filter((l) => /^\s*FAIL\s/.test(l) || /^not ok \d/.test(l.trim()) || /^(FAILED|ERROR)\s/.test(l)).slice(-4).map((l) => short(l, 220));
    const section = [...lines].reverse().find((l) => /^\[[\w-]+ [\w-]+\]/.test(l.trim())) || '';
    return { name: f, path: p, mtime: m, partial: s > size, tally: o?.tally || '', outcome: o, verdict: verdict(o), fails, section: short(section, 140) };
  });
}

/**
 * Classifies each case of the run in hand against earlier runs, newest
 * first: new-failure, recovered, still-failing, new, stable, or
 * flaky-candidate when its result changed at least twice across them.
 * Cases maps name -> 'passed' | 'failed' | 'skipped'.
 */
export function classify(now, earlier = []) {
  const out = {};
  for (const [name, result] of Object.entries(now || {})) {
    const history = earlier.map((c) => c?.[name]).filter((r) => r === 'passed' || r === 'failed');
    const prev = history[0];
    const seq = [result, ...history].filter((r) => r === 'passed' || r === 'failed');
    let flips = 0;
    for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) flips++;
    let c;
    if (result === 'skipped') c = 'skipped';
    else if (flips >= 2) c = 'flaky-candidate';
    else if (!prev) c = 'new';
    else if (prev === 'passed' && result === 'failed') c = 'new-failure';
    else if (prev === 'failed' && result === 'passed') c = 'recovered';
    else if (result === 'failed') c = 'still-failing';
    else c = 'stable';
    out[name] = { result, class: c, previous: prev || null, seen: history.length };
  }
  return out;
}
