/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Source Reader (dd1 Tools Edition - v1.0)
 *     - File Name: read.mjs
 *     - Relative Path: lib/read.mjs
 *     - Artifact Type: library
 *     - Version: 1.0.1
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.1 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A
 *       replaced file is known by its first 64 bytes as well as its id: Node
 *       gives NTFS's 64-bit file ids as a number, and two files made in the
 *       same millisecond could round to the same id, so a replacement went
 *       unnoticed about one run in three of the suite. A file rewritten in
 *       place is caught the same way.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, split out of collect.mjs for the audit's evidence stage:
 *       the incremental reader decodes UTF-8 across chunk boundaries, starts
 *       a replaced file again from its first byte, counts its lines, and
 *       reports every read failure and malformed line to a health register
 *       instead of skipping them silently.
 *
 * ✒ Description:
 *     How agent-watch reads the files Claude Code writes: a JSONL file a few
 *     new bytes at a time, and a register of what could and could not be
 *     read, so the page can say how complete its picture is.
 *
 * ✒ Key Features:
 *     - readNew: only the bytes added since the last call, whole lines only,
 *       the partial last line carried to the next call
 *     - A multi-byte character split across two chunks is decoded whole
 *     - A file that shrank, or was replaced by another file, is read again
 *       from the start and its consumer is told to reset
 *     - Line numbers, so every event can point back to the line it came from
 *     - createHealth: counts files read, read failures and malformed lines by
 *       kind, keeps the last few failures with their reason, and the newest
 *       source time seen
 *
 * ✒ Usage Instructions:
 *     const st = {};                      // keep it between calls
 *     readNew(file, st, (line, no) => ..., null, health);
 *
 * ✒ Examples:
 *     readNew('a.jsonl', st, onLine);              // every complete line
 *     readNew('a.jsonl', st, onLine, (l) => l.includes('"Workflow"'));
 *     health.snapshot();   // { files, failures, malformed, recent, newest }
 *
 * ✒ Other Important Information:
 *     - Dependencies: Node.js 20+ (node:fs, node:string_decoder)
 *     - Compatible platforms: Windows 11, macOS, Linux
 *     - It only reads; it never writes or locks a source file
 * ----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import { StringDecoder } from 'node:string_decoder';

const CHUNK = 4 << 20;

/** The identity of a file on disk, which changes when the file is replaced. */
function identity(s) {
  return `${s.dev}:${s.ino}:${Math.round(s.birthtimeMs)}`;
}

/**
 * Feeds every complete line added to a file since the last call to
 * onLine(line, lineNo), keeping the offset, the decoder and the partial last
 * line in st. A file that shrank or was replaced is read again from the start
 * (st.reset is called first). Read failures go to health when one is given.
 */
export function readNew(file, st, onLine, filter = null, health = null, kind = 'transcript') {
  // An asynchronous read of the same state is under way: leave it to finish.
  if (st.busy) return st;
  const stat = prepare(file, st, health, kind);
  if (!stat) return st;
  let fd;
  try {
    fd = fs.openSync(file, 'r');
  } catch (err) {
    health?.fail(kind, file, err);
    return st;
  }
  try {
    const buf = Buffer.alloc(Math.min(CHUNK, stat.size - st.offset));
    while (st.offset < stat.size) {
      const n = fs.readSync(fd, buf, 0, Math.min(buf.length, stat.size - st.offset), st.offset);
      if (!n) break;
      st.offset += n;
      consume(st, buf.subarray(0, n), onLine, filter);
    }
    health?.read(kind);
  } catch (err) {
    health?.fail(kind, file, err);
  } finally {
    fs.closeSync(fd);
  }
  st.size = stat.size;
  return st;
}

/**
 * The same as readNew, but in 1 MB steps with a pause between them, so a
 * long read (indexing a finished run) leaves the service and the machine
 * room to breathe. pauseMs defaults to AGENT_WATCH_READ_PAUSE or 4.
 */
export async function readNewAsync(file, st, onLine, filter = null, health = null, kind = 'transcript', pauseMs = Number(process.env.AGENT_WATCH_READ_PAUSE ?? 4)) {
  if (st.busy) return st;
  const stat = prepare(file, st, health, kind);
  if (!stat) return st;
  let fh;
  try {
    fh = await fs.promises.open(file, 'r');
  } catch (err) {
    health?.fail(kind, file, err);
    return st;
  }
  st.busy = true;
  try {
    const buf = Buffer.alloc(Math.min(1 << 20, stat.size - st.offset));
    while (st.offset < stat.size) {
      const { bytesRead: n } = await fh.read(buf, 0, Math.min(buf.length, stat.size - st.offset), st.offset);
      if (!n) break;
      st.offset += n;
      consume(st, buf.subarray(0, n), onLine, filter);
      await new Promise((r) => setTimeout(r, pauseMs));
    }
    health?.read(kind);
  } catch (err) {
    health?.fail(kind, file, err);
  } finally {
    st.busy = false;
    await fh.close();
  }
  st.size = stat.size;
  return st;
}

/** Checks the file, starting st again when the file shrank or was replaced. */
function prepare(file, st, health, kind) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch (err) {
    if (st.offset) health?.fail(kind, file, err);
    return null;
  }
  const id = identity(stat);
  // A file id alone cannot be trusted: Node gives NTFS's 64-bit ids as a
  // number and two files can round to the same one. Before new bytes are
  // read, the file's first bytes must still be the ones read the first time.
  const swapped = (st.id && st.id !== id) || (st.offset && stat.size > st.offset && st.head && head(file, st.head.length / 2) !== st.head);
  if (stat.size < (st.offset || 0) || swapped) {
    st.offset = 0;
    st.carry = '';
    st.lineNo = 0;
    st.decoder = null;
    st.head = null;
    st.reset?.();
  }
  st.id = id;
  st.mtime = stat.mtimeMs;
  health?.seen(stat.mtimeMs);
  if (stat.size <= (st.offset || 0)) return null;
  if (!st.offset) st.head = head(file, Math.min(64, stat.size));
  st.offset = st.offset || 0;
  st.carry = st.carry || '';
  st.lineNo = st.lineNo || 0;
  st.decoder = st.decoder || new StringDecoder('utf8');
  return stat;
}

/** The first n bytes of a file as hex, or null. */
function head(file, n) {
  if (!n) return null;
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(n);
    const got = fs.readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, got).toString('hex');
  } catch {
    return null;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/** Splits decoded bytes into whole lines, carrying the partial last one. */
function consume(st, bytes, onLine, filter) {
  const lines = (st.carry + st.decoder.write(bytes)).split('\n');
  st.carry = lines.pop();
  for (const l of lines) {
    st.lineNo++;
    if (l && (!filter || filter(l))) onLine(l.endsWith('\r') ? l.slice(0, -1) : l, st.lineNo);
  }
}

/** Parses one JSON line, counting a malformed one against its kind. */
export function parseLine(line, health = null, kind = 'transcript') {
  try {
    return JSON.parse(line);
  } catch {
    health?.malformed(kind);
    return null;
  }
}

/** Reads a whole JSON file, or null with the reason noted in health. */
export function readJson(file, health = null, kind = 'record', { missingOk = true } = {}) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (!(missingOk && err.code === 'ENOENT')) health?.fail(kind, file, err);
    return null;
  }
  try {
    const value = JSON.parse(text);
    health?.read(kind);
    return value;
  } catch (err) {
    health?.malformed(kind, file, err);
    return null;
  }
}

/**
 * A register of what was read and what could not be: counts by kind, the
 * last twenty failures with their reason, and the newest source time seen.
 */
export function createHealth() {
  const reads = {};
  const failures = {};
  const malformed = {};
  const recent = [];
  let newest = 0;
  const note = (kind, file, err, what) => {
    recent.push({ at: Date.now(), kind, what, file: file ? String(file) : null, reason: err ? String(err.code || err.message || err).slice(0, 160) : null });
    if (recent.length > 20) recent.shift();
  };
  return {
    read(kind) {
      reads[kind] = (reads[kind] || 0) + 1;
    },
    fail(kind, file, err) {
      failures[kind] = (failures[kind] || 0) + 1;
      note(kind, file, err, 'unreadable');
    },
    malformed(kind, file = null, err = null) {
      malformed[kind] = (malformed[kind] || 0) + 1;
      if (file) note(kind, file, err, 'malformed');
    },
    seen(ms) {
      if (ms > newest) newest = ms;
    },
    snapshot() {
      const sum = (o) => Object.values(o).reduce((s, n) => s + n, 0);
      return { reads: { ...reads }, failures: { ...failures }, malformed: { ...malformed }, readCount: sum(reads), failureCount: sum(failures), malformedCount: sum(malformed), recent: recent.slice(), newest };
    },
  };
}
