/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Page Helpers (dd1 Tools Edition - v1.3)
 *     - File Name: core.js
 *     - Relative Path: web/core.js
 *     - Artifact Type: javascript
 *     - Version: 1.3.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — how():
 *       an explanation as a closed How to read this list, one sentence a row.
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
 *       sourceOf(): a figure's source as the start of a sentence; whyText()
 *       reads Inferred from recent activity. rather than From the inferred
 *       from recent activity (inferred).
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — fill():
 *       replaces an element's children leaving out null and undefined, which
 *       replaceChildren would print as "null".
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, when the page became modules for its views: the element
 *       builder, the house date and time forms, the browser store, and a
 *       fetch that numbers its requests so an older answer is dropped.
 *
 * ✒ Description:
 *     What every view of the page shares: building elements from data as
 *     text, never as HTML; dates month/day/year on the 12-hour clock;
 *     sizes, spans and token counts; the per-browser store; and the API
 *     reader that cancels a request a newer one replaces.
 *
 * ✒ Key Features:
 *     - el(): elements with text, attributes and handlers; widths set through
 *       the CSSOM, since the page's policy refuses style attributes
 *     - when(), clock(), span(), ago(): the house forms for people
 *     - whyText(): a provenance record as one sentence
 *     - api(): JSON from the service, numbered per key, the older answer
 *       dropped and the request it replaces cancelled
 *     - store: localStorage behind try/catch, for conveniences only
 *
 * ✒ Usage Instructions:
 *     import { el, api, when } from './core.js';
 *     const body = await api('archive', '/api/archive', { project });
 *
 * ✒ Other Important Information:
 *     - Dependencies: none
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

export const $ = (id) => document.getElementById(id);

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    // Through the CSSOM: the page's policy refuses style attributes.
    else if (k === 'width') n.style.width = v;
    else if (k === 'left') n.style.left = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
  return n;
}

export const icon = (name, cls = 'ph') => el('i', { class: `${cls} ph-${name}`, 'aria-hidden': 'true' });

/** Replaces a node's children, leaving out null, undefined and false (replaceChildren would print "null"). */
export function fill(node, ...kids) {
  node.replaceChildren(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));
  return node;
}
export const pad = (n) => String(n).padStart(2, '0');

export function when(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${h}:${pad(d.getMinutes())} ${ap}`;
}

export function clock(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ap}`;
}

export function span(ms) {
  if (!(ms >= 0)) return '-';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${pad(s % 60)} s`;
  return `${Math.floor(m / 60)} h ${pad(m % 60)} min`;
}

export const ago = (ms) => (ms ? `${span(Date.now() - ms)} ago` : '-');
export const num = (n) => (n || n === 0 ? Number(n).toLocaleString('en-US') : '-');
export const gb = (b) => `${(b / 1024 ** 3).toFixed(1)} GB`;
export const tokens = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)} M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)} K` : String(n || 0));

/** A provenance record as one sentence for a title or a line. */
/** Where a figure came from, as the start of a sentence: "from the run journal", or for an
 *  inference its own label, "inferred from recent activity". */
export const sourceOf = (w) => (w.basis === 'inferred' ? w.label : `from the ${w.label}`);
export const whyText = (w) => {
  if (!w) return '';
  const src = sourceOf(w);
  const part = w.completeness && w.completeness !== 'complete' ? `, ${w.completeness}` : '';
  const note = w.note ? ` ${w.note.charAt(0).toUpperCase()}${w.note.slice(1)}${/[.!?]$/.test(w.note) ? '' : '.'}` : '';
  return `${src.charAt(0).toUpperCase()}${src.slice(1)}${part}.${note}`;
};

/** A view's explanation as a closed "How to read this" list, one sentence to a row. */
export function how(note, title = 'How to read this') {
  if (!note) return null;
  const parts = String(note).split(/(?<=[.;])\s+(?=[A-Z])/).filter(Boolean);
  return el('details', { class: 'how' }, el('summary', {}, icon('info'), title), el('ul', {}, parts.map((s) => el('li', { text: s }))));
}

export const store = {
  get(k) {
    try {
      return localStorage.getItem(`agent-watch.${k}`);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      if (v === null || v === undefined) localStorage.removeItem(`agent-watch.${k}`);
      else localStorage.setItem(`agent-watch.${k}`, v);
    } catch { /* not kept */ }
  },
};

const seqs = new Map();
/**
 * JSON from the service. Requests share a key per purpose: a new one cancels
 * the one in flight, and an answer older than the newest request is dropped
 * (resolves to undefined), so a slow answer never overwrites a newer choice.
 */
export async function api(key, pathname, params = {}) {
  const prev = seqs.get(key);
  prev?.ctl.abort();
  const ctl = new AbortController();
  const seq = (prev?.seq || 0) + 1;
  seqs.set(key, { seq, ctl });
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== '') q.set(k, v);
  try {
    const r = await fetch(`${pathname}${q.toString() ? `?${q}` : ''}`, { cache: 'no-store', signal: ctl.signal });
    if (!r.ok) throw new Error((await r.text()) || `The service answered ${r.status}.`);
    const body = await r.json();
    return seqs.get(key)?.seq === seq ? body : undefined;
  } catch (err) {
    if (err.name === 'AbortError' || seqs.get(key)?.seq !== seq) return undefined;
    throw err;
  }
}

/** A status pill. */
export const pill = (status, extra = '') => el('span', { class: `status-pill is-${status}${extra}`, text: status });

/** A small empty-state line. */
export const empty = (text) => el('p', { class: 'empty', text });
