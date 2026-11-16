/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Evidence Records (dd1 Tools Edition - v1.1)
 *     - File Name: evidence.mjs
 *     - Relative Path: lib/evidence.mjs
 *     - Artifact Type: library
 *     - Version: 1.1.0
 *     - Date: 11/16/2026
 *     - Update: Monday, November 16, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.1.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Four
 *       methods for the Sessions view: Claude Code's session registry, the
 *       process list, the session transcript and the session's cost record.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's provenance stage (R02): one small record of
 *       where a value came from and how it was reached, the words each method
 *       is shown with, and the redaction every excerpt passes through.
 *
 * ✒ Description:
 *     The shared vocabulary for saying where a figure came from. Every
 *     status, count and outcome the collector reports can carry a
 *     provenance record: the kind of source, its path, the method that
 *     turned it into the value, and whether the picture is complete.
 *
 * ✒ Key Features:
 *     - prov(): { method, label, sources, note, completeness }, with a
 *       fixed set of methods so the page can say each one the same way
 *     - Methods separate what was read directly (a saved record, a tool
 *       result, git's output) from what was inferred (quiet for 30 minutes)
 *     - redact(): masks secrets in an excerpt (key=value secrets, bearer
 *       tokens, long hex or base64 runs) and writes the home folder as ~
 *     - excerpt(): bounded, single-line, redacted text for the page
 *
 * ✒ Usage Instructions:
 *     prov('record', [recFile], 'status from the saved run record')
 *     excerpt(text, 400)
 *
 * ✒ Examples:
 *     prov('inferred-stale', [journal], 'no record; quiet 31 min', 'partial')
 *     redact('curl -H "Authorization: Bearer abc.def"')  // Bearer ‹redacted›
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+ (node:os)
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - No confidence percentages: a value is observed, inferred, partial or
 *       unavailable, and the method says which
 * ----------------------------------------------------------------------------
 */

import os from 'node:os';

/** Each method, the way the page names it, and whether it is observed or inferred. */
export const METHODS = {
  record: { label: 'saved run record', basis: 'observed' },
  journal: { label: 'run journal', basis: 'observed' },
  'agent-meta': { label: 'agent meta file', basis: 'observed' },
  transcript: { label: 'agent transcript', basis: 'observed' },
  'tool-result': { label: 'tool result in the transcript', basis: 'observed' },
  'tool-use': { label: 'tool call, no result yet', basis: 'observed' },
  'session-call': { label: 'Workflow call in the session transcript', basis: 'observed' },
  'script-meta': { label: "workflow script's meta block", basis: 'declared' },
  git: { label: "git's output", basis: 'observed' },
  netstat: { label: 'netstat', basis: 'observed' },
  'scratch-log': { label: "log in the run's scratch folder", basis: 'observed' },
  'scratch-unattributed': { label: 'newest Claude scratchpad, not tied to this run', basis: 'unattributed' },
  'workflow-result': { label: "tests the workflow's result reported", basis: 'reported' },
  os: { label: "Node's os module, the whole machine", basis: 'observed' },
  'session-registry': { label: "Claude Code's session registry", basis: 'observed' },
  process: { label: "the machine's process list", basis: 'observed' },
  session: { label: 'session transcript', basis: 'observed' },
  'cost-state': { label: "the session's own cost record", basis: 'reported' },
  'inferred-activity': { label: 'inferred from recent activity', basis: 'inferred' },
  'inferred-stale': { label: 'inferred from inactivity', basis: 'inferred' },
  sum: { label: "sum of the agents' transcripts", basis: 'derived' },
  index: { label: "agent-watch's archive index", basis: 'derived' },
  criteria: { label: 'acceptance criteria', basis: 'declared' },
};

/** A provenance record. completeness: 'complete' | 'partial' | 'unavailable'. */
export function prov(method, sources = [], note = '', completeness = 'complete') {
  const m = METHODS[method] || { label: method, basis: 'observed' };
  return { method, label: m.label, basis: m.basis, sources: sources.filter(Boolean).map(String), note, completeness };
}

const HOME = os.homedir();
const SECRET_KV = /\b([\w-]*(?:token|secret|passw(?:or)?d|api[_-]?key|access[_-]?key)[\w-]*)(\s*[:=]\s*)(["']?)(?!\d+\b)[^\s"'&,;]{8,}\3/gi;
const BEARER = /\b(Bearer|Basic)\s+[\w.~+/=-]{8,}/g;
const LONG_RUN = /\b(?=[\w+-]*\d)(?=[\w+-]*[a-z])(?=[\w+-]*[A-Z])[\w+-]{32,}={0,2}(?![\w/.])/g;

/** The text with secrets masked and the home folder written as ~. */
export function redact(text) {
  let s = String(text ?? '');
  if (HOME && HOME.length > 3) s = s.split(HOME).join('~').split(HOME.replace(/\\/g, '/')).join('~');
  return s.replace(SECRET_KV, (m, k, sep, q) => `${k}${sep}${q}‹redacted›${q}`).replace(BEARER, '$1 ‹redacted›').replace(LONG_RUN, '‹redacted›');
}

/** One bounded, redacted line of text. */
export function excerpt(text, n = 400) {
  const s = redact(String(text ?? '').replace(/\s+/g, ' ').trim());
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** A bounded, redacted block that keeps its line breaks (for a result shown whole). */
export function block(text, n = 1600) {
  const s = redact(String(text ?? '')).replace(/\r/g, '').trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
