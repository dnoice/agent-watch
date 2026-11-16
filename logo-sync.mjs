#!/usr/bin/env node
/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Logo Sync (dd1 Tools Edition - v1.0)
 *     - File Name: logo-sync.mjs
 *     - Relative Path: logo-sync.mjs
 *     - Artifact Type: script
 *     - Version: 1.0.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version: remakes the page's logo and the favicon's figure from the
 *       master, and --check says whether they already match it.
 *
 * ✒ Description:
 *     The page header carries an inline copy of web/assets/agent-watch-logo.svg
 *     so the stylesheet can colour and animate its parts, and the favicon
 *     carries the figure alone. Both are made from the master by this script,
 *     never by hand: after the master is edited in Inkscape, run it and the
 *     two copies follow.
 *
 * ✒ Key Features:
 *     - Reads the parts from the master's own classes (aw-suit, aw-visor,
 *       aw-cuff, aw-eye, aw-flow, aw-arrow, and aw-f0 to aw-f9 on the paths)
 *       and keeps its groups, transforms and paint order
 *     - Refuses a master with a shape no class names, rather than guess
 *     - --check changes nothing and exits 1 when either copy is stale
 *
 * ✒ Usage Instructions:
 *     node logo-sync.mjs           remake the page's copy and the favicon
 *     node logo-sync.mjs --check   exit 0 when both already match the master
 *
 * ✒ Other Important Information:
 *     - Dependencies: none (Node's own modules)
 *     - Compatible platforms: any Node 20 or later
 *     - The favicon keeps its tile, header and placement; only the figure's
 *       shapes are remade. A redrawn figure of a new size needs its
 *       placement (the outer translate and scale) set again.
 * ----------------------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MASTER = path.join(HERE, 'web', 'assets', 'agent-watch-logo.svg');
const PAGE = path.join(HERE, 'web', 'index.html');
const FAVICON = path.join(HERE, 'web', 'favicon.svg');
const START = '<!-- logo: made from assets/agent-watch-logo.svg by logo-sync.mjs; do not edit by hand -->';
const END = '<!-- /logo -->';
const ROLES = ['suit', 'visor', 'cuff', 'eye', 'flow', 'arrow'];
const FIGURE = { suit: '#C9A84C', visor: '#0B1220', cuff: '#8B6914', eye: '#F5F0E8' };

const attr = (tag, name) => (new RegExp(`\\s${name}="([^"]*)"`).exec(tag) || [])[1];

/** The master's drawing as a list of group opens, group closes and paths, in document order. */
export function drawingOf(src) {
  const svgOpen = /<svg\b[^>]*>/.exec(src);
  if (!svgOpen) throw new Error('the master has no <svg> element');
  const viewBox = attr(svgOpen[0], 'viewBox');
  const body = src.slice(svgOpen.index + svgOpen[0].length).replace(/<metadata\b[\s\S]*?<\/metadata>/, '');
  const out = [];
  const stack = [];
  for (const m of body.matchAll(/<(\/?)(g|path)\b([^>]*?)(\/?)>/g)) {
    const [tag, close, name, , self] = m;
    if (name === 'g' && close) {
      stack.pop();
      out.push({ type: 'close' });
    } else if (name === 'g') {
      const transform = attr(tag, 'transform');
      stack.push(transform);
      out.push({ type: 'open', transform });
      if (self) { stack.pop(); out.push({ type: 'close' }); }
    } else {
      const cls = attr(tag, 'class') || '';
      const role = ROLES.find((r) => cls.split(/\s+/).includes(`aw-${r}`));
      const d = attr(tag, 'd');
      if (!role || !d) throw new Error(`a shape in the master has no aw- part class: ${(attr(tag, 'id') || tag.slice(0, 60))}`);
      out.push({ type: 'path', role, cls, d, transform: attr(tag, 'transform'), chain: stack.filter(Boolean) });
    }
  }
  if (stack.length) throw new Error('the master\'s groups do not close');
  return { viewBox, items: out };
}

const tf = (t) => (t ? ` transform="${t}"` : '');

/** The page's inline copy: classes only, no style attributes (the page's policy refuses them). */
export function inlineOf({ viewBox, items }) {
  const inner = items.map((it) => {
    if (it.type === 'open') return `<g${tf(it.transform)}>`;
    if (it.type === 'close') return '</g>';
    return `<path${tf(it.transform)} class="${it.cls}" d="${it.d}"/>`;
  }).join('');
  return `<svg class="brand-logo" viewBox="${viewBox}" role="img" aria-labelledby="brand-logo-title"><title id="brand-logo-title">Agent Watch</title>${inner}</svg>`;
}

/** The favicon's figure group: the suit, visor, cuffs and eyes inside their groups' transforms. */
export function figureOf({ items }) {
  const fig = items.filter((it) => it.type === 'path' && FIGURE[it.role]);
  if (!fig.length) throw new Error('the master has no figure');
  const chain = fig[0].chain.join('|');
  if (fig.some((p) => p.chain.join('|') !== chain)) throw new Error('the figure\'s shapes sit in different groups');
  const paths = fig.map((p) => `<path${tf(p.transform)} fill="${FIGURE[p.role]}" d="${p.d}"/>`).join('');
  return fig[0].chain.reduceRight((acc, t) => `<g transform="${t}">${acc}</g>`, paths);
}

function pageWith(html, inline) {
  const a = html.indexOf(START);
  const b = html.indexOf(END, a);
  if (a < 0 || b < 0) throw new Error('index.html has no logo markers');
  const indent = /[ \t]*$/.exec(html.slice(0, a))[0];
  return `${html.slice(0, a)}${START}\n${indent}${inline}\n${indent}${html.slice(b)}`;
}

function faviconWith(src, figure) {
  // The placement group is the one line that starts with <g transform="translate(... scale(...)">.
  const re = /^([ \t]*<g transform="translate\([^"]*\) scale\([^"]*\)">)[^\n]*(<\/g>)[ \t]*$/m;
  if (!re.test(src)) throw new Error('favicon.svg has no placement group');
  return src.replace(re, (_, open, close) => `${open}${figure}${close}`);
}

export function sync({ check = false } = {}) {
  const drawing = drawingOf(fs.readFileSync(MASTER, 'utf8'));
  const html = fs.readFileSync(PAGE, 'utf8');
  const fav = fs.readFileSync(FAVICON, 'utf8');
  const eol = (s) => (s.includes('\r\n') ? '\r\n' : '\n');
  const norm = (s) => s.replace(/\r\n/g, '\n');
  const nextHtml = pageWith(norm(html), inlineOf(drawing)).replace(/\n/g, eol(html));
  const nextFav = faviconWith(norm(fav), figureOf(drawing)).replace(/\n/g, eol(fav));
  const stale = [[PAGE, html, nextHtml], [FAVICON, fav, nextFav]].filter(([, a, b]) => a !== b);
  if (!check) for (const [file, , next] of stale) fs.writeFileSync(file, next);
  return { stale: stale.map(([file]) => path.relative(HERE, file).replace(/\\/g, '/')), shapes: drawing.items.filter((it) => it.type === 'path').length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  try {
    const { stale, shapes } = sync({ check });
    if (check) {
      console.log(stale.length ? `Stale: ${stale.join(', ')}. Run node logo-sync.mjs.` : `Both copies match the master (${shapes} shapes).`);
      process.exitCode = stale.length ? 1 : 0;
    } else {
      console.log(stale.length ? `Remade ${stale.join(', ')} from the master (${shapes} shapes).` : `Both copies already match the master (${shapes} shapes).`);
    }
  } catch (err) {
    console.error(`logo-sync: ${err.message}`);
    process.exitCode = 2;
  }
}
