/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Charts (dd1 Tools Edition - v1.0)
 *     - File Name: chart.js
 *     - Relative Path: web/chart.js
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
 *       version, for the Insights view and the Timeline's axis: SVG charts
 *       with no library, drawn to the house chart rules.
 *
 * ✒ Description:
 *     The page's charts, drawn as SVG from plain series: stacked or single
 *     columns on a band or a time axis, ranked horizontal bars, and a step
 *     area. Each sits in a card with its title, a legend for two or more
 *     series, a tooltip on hover and on keyboard focus, and a table view of
 *     the same numbers. Colours come from classes the stylesheet maps to the
 *     validated palette, so both themes are the stylesheet's business.
 *
 * ✒ Key Features:
 *     - Thin marks: columns and bars at most 24 px, a 4 px rounded data end
 *       square at the baseline, a 2 px surface gap between stacked parts
 *     - Hairline solid gridlines on clean ticks; compact figures on an axis
 *       that reaches ten thousand
 *     - Time ticks on whole minutes or hours, the date where a day changes
 *     - The hit target of a column is its whole band, full height; arrow keys
 *       move through the columns when the chart has focus
 *     - Every label goes in with textContent, never as markup
 *
 * ✒ Usage Instructions:
 *     import { chartCard, columns } from './chart.js';
 *     box.append(chartCard({ title, legend, render: (w, tip) => columns({ width: w, ... }), table }));
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js
 *     - Compatible platforms: current evergreen browsers
 *     - The page's policy refuses style attributes: positions go through the
 *       CSSOM and colours through classes
 * ----------------------------------------------------------------------------
 */

import { el, fill, icon } from './core.js';

const NS = 'http://www.w3.org/2000/svg';
const pad2 = (n) => String(n).padStart(2, '0');

/** An SVG element: attributes by setAttribute, `class`, `text` and on* handlers as el() takes them. */
export function S(tag, attrs = {}, ...kids) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) n.append(c);
  return n;
}

/** 1,284 / 12.9K / 2.3M: in full under ten thousand, compact from there. */
export function compact(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '-';
  const a = Math.abs(n);
  // Trailing zeros go: 2M, not 2.00M; 2.5 h stays 2.5.
  const trim = (s) => s.replace(/\.0+(?=[KMB]?$)/, '').replace(/(\.\d*?[1-9])0+(?=[KMB]?$)/, '$1');
  if (a < 10000) return Number.isInteger(n) || a >= 100 ? Math.round(n).toLocaleString('en-US') : trim(n.toFixed(1));
  if (a < 1e6) return trim(`${(n / 1e3).toFixed(a < 1e5 ? 1 : 0)}K`);
  if (a < 1e9) return trim(`${(n / 1e6).toFixed(a < 1e7 ? 2 : 1)}M`);
  return trim(`${(n / 1e9).toFixed(1)}B`);
}

/** A clean top for an axis and its ticks: 0 and three or four round steps. */
export function ticksFor(max, count = 4, integer = true) {
  if (!(max > 0)) return { top: 1, ticks: [0, 1] };
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || 10 * mag;
  // A count never steps by a fraction: one commit is not four quarter-ticks.
  if (integer) step = Math.max(1, Math.ceil(step));
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { top, ticks };
}

/** 8:30 PM, or 8:30:15 PM when the axis needs seconds. */
export function hm(t, seconds = false) {
  const d = new Date(t);
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad2(d.getMinutes())}${seconds ? `:${pad2(d.getSeconds())}` : ''} ${ap}`;
}
const md = (t) => {
  const d = new Date(t);
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
};

const TIME_STEPS = [10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400].map((s) => s * 1000);
/** Ticks on whole seconds, minutes or hours; a tick where the day changes carries the date. */
export function timeTicks(from, to, max = 6) {
  const span = Math.max(1, to - from);
  const step = TIME_STEPS.find((s) => span / s <= max) || 86400000 * Math.ceil(span / max / 86400000);
  const offset = new Date(from).getTimezoneOffset() * 60000;
  let t = Math.ceil((from - offset) / step) * step + offset;
  const out = [];
  let lastDay = new Date(from).toDateString();
  for (; t <= to; t += step) {
    const day = new Date(t).toDateString();
    out.push({ t, label: day !== lastDay ? `${md(t)} ${hm(t)}` : hm(t, step < 60000) });
    lastDay = day;
  }
  return out;
}

/** A rectangle with its data end rounded: up for a column, right for a bar. */
function endPath(x, y, w, h, r, dir) {
  if (w <= 0 || h <= 0) return '';
  if (dir === 'up') {
    const q = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + q}Q${x},${y} ${x + q},${y}H${x + w - q}Q${x + w},${y} ${x + w},${y + q}V${y + h}Z`;
  }
  const q = Math.min(r, h / 2, w);
  return `M${x},${y}H${x + w - q}Q${x + w},${y} ${x + w},${y + q}V${y + h - q}Q${x + w},${y + h} ${x + w - q},${y + h}H${x}Z`;
}

/** The legend: a swatch beside each label, a short line for a line series. */
export function legend(items) {
  return el('ul', { class: 'viz-legend' }, items.map((it) => el('li', {},
    el('span', { class: `viz-key${it.shape ? ` is-${it.shape}` : ''} c-${it.cls}`, 'aria-hidden': 'true' }), it.label)));
}

/** A tooltip for a host: a title and rows, the value first and the series after it. */
export function tooltip(host) {
  const box = el('div', { class: 'viz-tip', role: 'tooltip', hidden: true });
  return {
    node: box,
    show(x, y, title, rows) {
      fill(box,
        title ? el('p', { class: 'viz-tip-title', text: title }) : null,
        ...rows.map((r) => el('p', { class: 'viz-tip-row' },
          r.cls ? el('span', { class: `viz-key is-line c-${r.cls}`, 'aria-hidden': 'true' }) : null,
          el('b', { text: r.value }), r.label ? el('span', { text: r.label }) : null)),
      );
      box.hidden = false;
      const hb = host.getBoundingClientRect();
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      let left = x - hb.left + 14;
      if (left + w > hb.width - 4) left = x - hb.left - w - 14;
      let top = y - hb.top - h - 10;
      if (top < 4) top = y - hb.top + 16;
      box.style.left = `${Math.max(4, left)}px`;
      box.style.top = `${top}px`;
    },
    hide() {
      box.hidden = true;
    },
  };
}

/**
 * A chart in its card: the title, an optional subtitle and legend, a note, and a toggle between the
 * chart and a table of the same numbers. render(width, tip) returns the SVG; it is drawn again when
 * the card's width changes.
 */
export function chartCard({ title, sub = null, legendItems = null, note = null, render, table, wide = false, empty = null }) {
  const body = el('div', { class: 'viz-body' });
  const card = el('section', { class: `viz-card${wide ? ' is-wide' : ''}` });
  const tip = tooltip(card);
  let asTable = false;
  let lastW = 0;
  const toggle = el('button', { type: 'button', class: 'viz-toggle', 'aria-pressed': 'false', title: 'Show these numbers as a table' }, icon('table'), 'Table');
  const draw = () => {
    if (empty) {
      fill(body, el('p', { class: 'empty', text: empty }));
      return;
    }
    if (asTable) {
      fill(body, el('div', { class: 'table-wrap viz-table' }, table()));
      return;
    }
    const w = Math.max(240, Math.floor(body.clientWidth || card.clientWidth || 600));
    lastW = w;
    fill(body, render(w, tip));
  };
  toggle.addEventListener('click', () => {
    asTable = !asTable;
    toggle.setAttribute('aria-pressed', String(asTable));
    toggle.replaceChildren(icon(asTable ? 'chart-bar' : 'table'), asTable ? 'Chart' : 'Table');
    tip.hide();
    draw();
  });
  fill(card,
    tip.node,
    el('header', { class: 'viz-head' },
      el('div', {}, el('h4', { class: 'viz-title', text: title }), sub ? el('p', { class: 'viz-sub', text: sub }) : null),
      empty ? null : toggle),
    legendItems && legendItems.length > 1 && !empty ? legend(legendItems) : null,
    body,
    note ? el('p', { class: 'viz-note', text: note }) : null,
  );
  const ro = new ResizeObserver(() => {
    const w = Math.floor(body.clientWidth);
    if (!asTable && w && Math.abs(w - lastW) > 8) draw();
  });
  ro.observe(body);
  card.redraw = draw;
  queueMicrotask(draw);
  return card;
}

/** A plot frame: margins, y gridlines with their labels, and the baseline. */
function frame(width, height, top, { left = 46, right = 12, topPad = 10, bottom = 26, fmt = compact, integer = true } = {}) {
  const m = { left, right, top: topPad, bottom };
  const pw = Math.max(10, width - m.left - m.right);
  const ph = Math.max(10, height - m.top - m.bottom);
  const { top: max, ticks } = ticksFor(top, 4, integer);
  const y = (v) => m.top + ph - (v / max) * ph;
  const grid = S('g', { class: 'viz-gridlines' }, ticks.map((v) => S('g', {},
    S('line', { x1: m.left, x2: m.left + pw, y1: y(v), y2: y(v), class: v === 0 ? 'viz-base' : 'viz-gridline' }),
    S('text', { x: m.left - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'viz-tick', text: fmt(v) }))));
  return { m, pw, ph, y, max, grid };
}

/**
 * Columns, stacked by series, on a band axis (rows in order) or a time axis (rows with t, and from,
 * to and step). Each row: { label?, t?, values: { key: n }, title? }.
 */
export function columns({ width, height = 200, series, rows, tip, time = null, bands = null, marker = null, fmt = compact, integer = true, tipTitle = null, onPick = null, label = 'Chart' }) {
  const totals = rows.map((r) => series.reduce((s, k) => s + (r.values[k.key] || 0), 0));
  const f = frame(width, height, Math.max(1, ...totals), { fmt, integer, topPad: bands && bands.length && time ? 34 : 10 });
  const n = rows.length;
  const band = f.pw / Math.max(1, time ? Math.ceil((time.to - time.from) / time.step) : n);
  const xOf = (r, i) => (time ? f.m.left + ((r.t - time.from) / (time.to - time.from)) * f.pw : f.m.left + i * band);
  const bw = Math.max(2, Math.min(24, band * 0.72));
  const marks = S('g', { class: 'viz-marks' });
  const hits = S('g', { class: 'viz-hits' });
  const svg = S('svg', { class: 'viz', width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label, tabindex: '0' });
  let active = -1;
  const show = (i, cx, cy) => {
    if (i < 0 || i >= n) return;
    active = i;
    for (const g of marks.children) g.classList.toggle('is-dim', Number(g.dataset.i) !== i);
    const r = rows[i];
    const list = series.filter((s) => r.values[s.key]).map((s) => ({ cls: s.cls, value: fmt(r.values[s.key]), label: s.label }));
    if (marker && r.values[marker.key]) list.push({ cls: marker.cls, value: fmt(r.values[marker.key]), label: marker.label });
    tip.show(cx, cy, tipTitle ? tipTitle(r, i) : r.label, list.length ? list : [{ value: '0', label: 'nothing' }]);
  };
  const clear = () => {
    active = -1;
    for (const g of marks.children) g.classList.remove('is-dim');
    tip.hide();
  };
  rows.forEach((r, i) => {
    const x0 = xOf(r, i) + (band - bw) / 2;
    const g = S('g', { 'data-i': String(i) });
    let acc = 0;
    const present = series.filter((s) => r.values[s.key] > 0);
    present.forEach((s, k) => {
      const v = r.values[s.key];
      const yTop = f.y(acc + v);
      const yBot = f.y(acc);
      const gap = k > 0 ? 2 : 0; // the surface gap between stacked parts
      const h = Math.max(0, yBot - yTop - gap);
      const isTop = k === present.length - 1;
      g.append(S('path', { d: isTop ? endPath(x0, yTop, bw, h, 4, 'up') : `M${x0},${yTop}h${bw}v${h}h${-bw}Z`, class: `viz-mark c-${s.cls}` }));
      acc += v;
    });
    // A marker above the stack: a count of something that is not part of it, such as errors.
    if (marker && r.values[marker.key]) g.append(S('circle', { cx: x0 + bw / 2, cy: f.y(acc) - 9, r: 4, class: `viz-dot c-${marker.cls}` }));
    marks.append(g);
    hits.append(S('rect', {
      x: xOf(r, i), y: f.m.top, width: Math.max(band, 1), height: f.ph, class: `viz-hit${onPick ? ' is-pick' : ''}`,
      onpointermove: (e) => show(i, e.clientX, e.clientY),
      onpointerleave: clear,
      onclick: onPick ? () => onPick(r, i) : null,
    }));
  });
  // The x axis: time ticks, or a label under every few bands.
  const xAxis = S('g', { class: 'viz-xaxis' });
  if (time) {
    for (const tk of timeTicks(time.from, time.to, Math.max(2, Math.floor(f.pw / 110)))) {
      const x = f.m.left + ((tk.t - time.from) / (time.to - time.from)) * f.pw;
      xAxis.append(S('line', { x1: x, x2: x, y1: f.m.top + f.ph, y2: f.m.top + f.ph + 4, class: 'viz-base' }),
        S('text', { x, y: height - 6, 'text-anchor': 'middle', class: 'viz-tick', text: tk.label }));
    }
  } else {
    const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(f.pw / 84))));
    rows.forEach((r, i) => {
      if (i % every) return;
      xAxis.append(S('text', { x: f.m.left + i * band + band / 2, y: height - 6, 'text-anchor': 'middle', class: 'viz-tick', text: r.short || r.label }));
    });
  }
  svg.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Escape') return clear();
    if (e.key === 'Enter' && onPick && active >= 0) return onPick(rows[active], active);
    const i = e.key === 'Home' || active < 0 ? 0 : e.key === 'End' ? n - 1 : Math.max(0, Math.min(n - 1, active + (e.key === 'ArrowLeft' ? -1 : 1)));
    const b = svg.getBoundingClientRect();
    show(i, b.left + ((xOf(rows[i], i) + band / 2) / width) * b.width, b.top + 20);
  });
  svg.addEventListener('blur', clear);
  // Phases (or any spans) in a strip above the plot, named where the name fits.
  const strip = S('g', { class: 'viz-bands' });
  if (bands && time) {
    for (const b of bands) {
      if (!b.from) continue;
      const x1 = f.m.left + ((Math.max(b.from, time.from) - time.from) / (time.to - time.from)) * f.pw;
      const x2 = f.m.left + ((Math.min(b.to || time.to, time.to) - time.from) / (time.to - time.from)) * f.pw;
      const w = Math.max(3, x2 - x1 - 2);
      const g = S('g', {}, S('title', { text: `${b.label}: ${hm(b.from)} to ${hm(b.to || time.to)}` }),
        S('rect', { x: x1, y: 6, width: w, height: 18, rx: 4, class: `viz-band is-${b.cls || 'done'}` }));
      if (w > b.label.length * 6.6 + 14) g.append(S('text', { x: x1 + 7, y: 19, class: 'viz-band-label', text: b.label }));
      strip.append(g);
    }
  }
  svg.append(f.grid, strip, marks, xAxis, hits);
  return svg;
}

/** Ranked horizontal bars, one row each, stacked by series, the total at the tip. */
export function hbars({ width, series, rows, tip, fmt = compact, labelWidth = 170, label = 'Chart', onPick = null }) {
  const rowH = 30;
  const height = rows.length * rowH + 8;
  const totals = rows.map((r) => series.reduce((s, k) => s + (r.values[k.key] || 0), 0));
  const max = Math.max(1, ...totals);
  const left = Math.min(labelWidth, Math.floor(width * 0.4));
  const right = 64;
  const pw = Math.max(20, width - left - right);
  const svg = S('svg', { class: 'viz', width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label });
  rows.forEach((r, i) => {
    const y = i * rowH + 6;
    const bh = 14;
    const g = S('g', { class: 'viz-row' });
    const name = S('text', { x: left - 10, y: y + bh - 2, 'text-anchor': 'end', class: 'viz-label', text: r.label });
    g.append(S('title', { text: r.full || r.label }), name);
    let acc = 0;
    const present = series.filter((s) => r.values[s.key] > 0);
    present.forEach((s, k) => {
      const v = r.values[s.key];
      const x = left + (acc / max) * pw + (k > 0 ? 2 : 0);
      const w = Math.max(0, (v / max) * pw - (k > 0 ? 2 : 0));
      g.append(S('path', { d: k === present.length - 1 ? endPath(x, y, w, bh, 4, 'right') : `M${x},${y}h${w}v${bh}h${-w}Z`, class: `viz-mark c-${s.cls}` }));
      acc += v;
    });
    g.append(S('text', { x: left + (acc / max) * pw + 8, y: y + bh - 2, class: 'viz-value', text: fmt(totals[i]) }));
    g.append(S('rect', {
      x: 0, y: y - 6, width, height: rowH, class: `viz-hit${onPick ? ' is-pick' : ''}`, tabindex: '0',
      onpointermove: (e) => tip.show(e.clientX, e.clientY, r.full || r.label, present.map((s) => ({ cls: s.cls, value: fmt(r.values[s.key]), label: s.label }))),
      onpointerleave: () => tip.hide(),
      onfocus: (e) => { const b = e.target.getBoundingClientRect(); tip.show(b.left + left, b.top, r.full || r.label, present.map((s) => ({ cls: s.cls, value: fmt(r.values[s.key]), label: s.label }))); },
      onblur: () => tip.hide(),
      onclick: onPick ? () => onPick(r, i) : null,
    }));
    svg.append(g);
  });
  return svg;
}

/** A step area over time for one series: a 2 px line and a wash beneath it. */
export function stepArea({ width, height = 160, points, from, to, tip, cls = 'v1', fmt = (v) => String(v), what = 'value', label = 'Chart' }) {
  // Headroom above the highest level, so one agent at a time does not fill the plot.
  const peak = Math.max(1, ...points.map((p) => p.n));
  const f = frame(width, height, peak + 1, { fmt: (v) => (Number.isInteger(v) ? String(v) : '') });
  const x = (t) => f.m.left + ((t - from) / Math.max(1, to - from)) * f.pw;
  let d = '';
  let prev = null;
  for (const p of points) {
    if (prev === null) d += `M${x(p.t)},${f.y(0)}V${f.y(p.n)}`;
    else d += `H${x(p.t)}V${f.y(p.n)}`;
    prev = p;
  }
  if (prev) d += `H${x(to)}`;
  const area = d ? `${d}V${f.y(0)}Z` : '';
  const svg = S('svg', { class: 'viz', width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label });
  const xAxis = S('g', { class: 'viz-xaxis' });
  for (const tk of timeTicks(from, to, Math.max(2, Math.floor(f.pw / 110)))) {
    xAxis.append(S('text', { x: x(tk.t), y: height - 6, 'text-anchor': 'middle', class: 'viz-tick', text: tk.label }));
  }
  const cross = S('line', { class: 'viz-cross', y1: f.m.top, y2: f.m.top + f.ph, x1: 0, x2: 0, visibility: 'hidden' });
  const hit = S('rect', {
    x: f.m.left, y: f.m.top, width: f.pw, height: f.ph, class: 'viz-hit',
    onpointermove: (e) => {
      const b = svg.getBoundingClientRect();
      const px = ((e.clientX - b.left) / b.width) * width;
      const t = from + ((px - f.m.left) / f.pw) * (to - from);
      let p = points[0];
      for (const q of points) if (q.t <= t) p = q;
      cross.setAttribute('x1', px);
      cross.setAttribute('x2', px);
      cross.setAttribute('visibility', 'visible');
      tip.show(e.clientX, e.clientY, hm(t), [{ cls, value: fmt(p ? p.n : 0), label: what }]);
    },
    onpointerleave: () => {
      cross.setAttribute('visibility', 'hidden');
      tip.hide();
    },
  });
  svg.append(f.grid, S('path', { d: area, class: `viz-area c-${cls}` }), S('path', { d, class: `viz-line c-${cls}` }), xAxis, cross, hit);
  return svg;
}

/** A table of rows for a chart's table view: head labels and cell functions. */
export function vizTable(head, rows) {
  return el('table', {},
    el('thead', {}, el('tr', {}, head.map((h, i) => el('th', { scope: 'col', class: i ? 'num' : null, text: h })))),
    el('tbody', {}, rows.map((r) => el('tr', { class: 'is-plain' }, r.map((c, i) => el(i ? 'td' : 'th', { scope: i ? null : 'row', class: i ? 'num' : null, text: c }))))));
}
