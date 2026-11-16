/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Change Provenance (dd1 Tools Edition - v1.0)
 *     - File Name: files.mjs
 *     - Relative Path: lib/files.mjs
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
 *       version, for the audit's change-provenance stage (R08): every file a
 *       run's agents read or edited, who did what to it and when, the commits
 *       that carried it, and the files two agents edited, flagged as a risk.
 *
 * ✒ Description:
 *     Connects a run's agents to the files they touched. Each file lists the
 *     agents that read or edited it, how many edits came back ok, when, and
 *     which commits on the run's branch changed it. A file two agents edited
 *     is flagged as a possible collision, more so when their edits overlap
 *     in time: a risk signal, not proof that anything was lost.
 *
 * ✒ Key Features:
 *     - From the edit and read tools' own inputs (Edit, Write, MultiEdit,
 *       NotebookEdit, Read), paths compared without regard to case or slash
 *       direction on Windows
 *     - Commits matched to files by the end of the path, from git's list of
 *       each branch commit's changed files
 *     - Collisions: two or more agents edited the file; overlapping when the
 *       spans of their edits cross
 *     - history(): every event that named the file, in time order
 *     - Says what it cannot see: a file changed by a shell command (sed, a
 *       redirect, a generator) has no edit to read
 *
 * ✒ Usage Instructions:
 *     fileMap(bundle)            // { files, collisions, note }
 *     history(bundle, path)      // events that named the file
 *
 * ✒ Examples:
 *     fileMap(b).collisions.filter((c) => c.overlapping)
 *
 * ✒ Other Important Information:
 *     - Dependencies: none
 *     - Compatible platforms: Windows 11, macOS, Linux
 * ----------------------------------------------------------------------------
 */

const WIN = process.platform === 'win32';
/** A path as a key: forward slashes, and without case on Windows. */
export const keyOf = (p) => {
  const s = String(p || '').replace(/\\/g, '/');
  return WIN || /^[a-z]:\//i.test(s) ? s.toLowerCase() : s;
};

/** Every file a run's agents named, who did what to it, the commits that changed it, and the collisions. */
export function fileMap(bundle) {
  const map = new Map();
  for (const a of bundle.agents) {
    for (const f of a.files || []) {
      const k = keyOf(f.path);
      let x = map.get(k);
      if (!x) {
        x = { path: f.path, key: k, edits: 0, editsOk: 0, editsFailed: 0, reads: 0, first: null, last: null, agents: [], commits: [] };
        map.set(k, x);
      }
      x.edits += f.edits;
      x.editsOk += f.editsOk;
      x.editsFailed += f.editsFailed;
      x.reads += f.reads;
      if (f.first) x.first = x.first ? Math.min(x.first, f.first) : f.first;
      if (f.last) x.last = Math.max(x.last || 0, f.last);
      // The span of this agent's edits to the file, from its edit events.
      const ids = new Set(f.events || []);
      const edits = (a.events || []).filter((e) => ids.has(e.id) && e.kind === 'edit' && e.t).map((e) => e.t);
      x.agents.push({ id: a.id, label: a.label, phase: a.phase, edits: f.edits, editsOk: f.editsOk, reads: f.reads, editFrom: edits.length ? Math.min(...edits) : null, editTo: edits.length ? Math.max(...edits) : null });
    }
  }
  for (const c of bundle.git?.branch || []) {
    for (const rel of c.files || []) {
      const rk = keyOf(rel);
      for (const x of map.values()) if (x.key === rk || x.key.endsWith(`/${rk}`)) x.commits.push({ hash: c.hash, subject: c.subject, at: c.at });
    }
  }
  const files = [...map.values()];
  const collisions = [];
  for (const x of files) {
    const editors = x.agents.filter((a) => a.edits > 0);
    x.editors = editors.length;
    if (editors.length < 2) continue;
    let overlapping = false;
    for (let i = 0; i < editors.length; i++) {
      for (let j = i + 1; j < editors.length; j++) {
        const p = editors[i];
        const q = editors[j];
        if (p.editFrom && q.editFrom && p.editFrom <= q.editTo && q.editFrom <= p.editTo) overlapping = true;
      }
    }
    x.collision = overlapping ? 'overlapping' : 'possible';
    collisions.push({ path: x.path, agents: editors.map((a) => a.label), overlapping, commits: x.commits.length });
  }
  files.sort((a, b) => (b.collision ? 1 : 0) - (a.collision ? 1 : 0) || b.edits - a.edits || b.reads - a.reads || a.path.localeCompare(b.path));
  return {
    files,
    collisions,
    counts: { files: files.length, edited: files.filter((f) => f.edits).length, read: files.filter((f) => f.reads && !f.edits).length, collisions: collisions.length, overlapping: collisions.filter((c) => c.overlapping).length, inCommits: files.filter((f) => f.commits.length).length },
    note: 'From the edit and read tools\' inputs. A file changed by a shell command (sed, a redirect, a generator) has no edit to read, so it is not here. Two agents editing one file is a risk signal, not proof that anything was lost; overlapping means their edits to it crossed in time.',
  };
}

/** Every event that named a file, in time order. */
export function history(bundle, p) {
  const k = keyOf(p);
  const out = [];
  for (const a of bundle.agents) {
    for (const e of a.events || []) {
      if ((e.files || []).some((f) => keyOf(f) === k)) out.push({ id: e.id, agent: a.id, agentLabel: a.label, t: e.t, kind: e.kind, tool: e.tool, text: e.text, status: e.status, line: e.line });
    }
  }
  return out.sort((x, y) => (x.t || 0) - (y.t || 0));
}
