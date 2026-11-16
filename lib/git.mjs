/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Git Adapter (dd1 Tools Edition - v1.0)
 *     - File Name: git.mjs
 *     - Relative Path: lib/git.mjs
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
 *       version, split out of collect.mjs: the trunk is named for what it
 *       is (main, master, or the checked-out branch when neither exists)
 *       rather than always "main", and each commit on a run's branch lists
 *       the files it changed, for file provenance.
 *
 * ✒ Description:
 *     What git says about the repository a run worked in: the checked-out
 *     branch, the latest commits on the trunk, and the commits on the run's
 *     branch since its base with the files each one changed. Every call is
 *     execFile with fixed arguments, and the answers are cached briefly.
 *
 * ✒ Key Features:
 *     - The trunk: main, else master, else HEAD, named in trunkRef
 *     - The branch's commits since its base, up to 40, each with its files
 *     - A branch name or base that is not plainly a name or a hash is
 *       refused before git sees it
 *     - No repository, or no git on PATH: empty lists, never an error
 *
 * ✒ Usage Instructions:
 *     const g = createGit();
 *     await g.info(cwd, branch, base)   // { repo, head, trunkRef, main, branch }
 *
 * ✒ Examples:
 *     await g.info('C:/work/terrane', 'piece/x', 'a1b2c3d')
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+ (node:child_process); git on PATH
 *     - Compatible platforms: Windows 11, macOS, Linux
 * ----------------------------------------------------------------------------
 */

import { execFile } from 'node:child_process';

const SEP = '\x1f';
const REC = '\x1e';

export const exec = (cmd, args) => new Promise((resolve) => {
  execFile(cmd, args, { timeout: 8000, windowsHide: true, maxBuffer: 4 << 20 }, (err, out) => resolve(err ? '' : String(out)));
});

const BRANCH = /^[\w./-]{1,120}$/;
const HASH = /^[0-9a-f]{4,40}$/i;

/** Commits from `git log --name-only` with the record separator format. */
export function parseLog(out, withFiles = false) {
  return String(out).split(REC).map((chunk) => chunk.replace(/^\n+/, '')).filter(Boolean).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [hash, at, ...subject] = head.split(SEP);
    const c = { hash, at: Number(at) * 1000, subject: subject.join(' ') };
    if (withFiles) c.files = rest.map((l) => l.trim()).filter(Boolean).slice(0, 200);
    return c;
  }).filter((c) => c.hash);
}

export function createGit(run = exec) {
  const cache = new Map();
  async function cached(key, ms, fn) {
    const c = cache.get(key);
    if (c && Date.now() - c.at < ms) return c.value;
    const value = await fn();
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 64) cache.delete(cache.keys().next().value);
    return value;
  }
  const empty = { repo: null, head: null, trunkRef: null, main: [], branch: [] };
  return {
    async info(cwd, branch, base) {
      if (!cwd) return empty;
      return cached(`git:${cwd}:${branch}:${base}`, 10000, async () => {
        const top = (await run('git', ['-C', cwd, 'rev-parse', '--show-toplevel'])).trim();
        if (!top) return empty;
        const head = (await run('git', ['-C', top, 'rev-parse', '--abbrev-ref', 'HEAD'])).trim();
        let trunkRef = 'HEAD';
        for (const ref of ['main', 'master']) {
          if ((await run('git', ['-C', top, 'rev-parse', '--verify', '--quiet', ref])).trim()) {
            trunkRef = ref;
            break;
          }
        }
        const fmt = `--format=${REC}%h${SEP}%ct${SEP}%s`;
        const main = parseLog(await run('git', ['-C', top, 'log', '--first-parent', '-n', '10', fmt, trunkRef]));
        let onBranch = [];
        if (branch && BRANCH.test(branch) && !branch.includes('..') && base && HASH.test(base)) {
          onBranch = parseLog(await run('git', ['-C', top, 'log', '-n', '40', '--name-only', fmt, `${base}..${branch}`]), true);
        }
        return { repo: top, head, trunkRef: trunkRef === 'HEAD' ? `HEAD (${head || 'detached'})` : trunkRef, main, branch: onBranch };
      });
    },
  };
}
