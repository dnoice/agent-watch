/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Timeline View (dd1 Tools Edition - v1.2)
 *     - File Name: timeline.js
 *     - Relative Path: web/timeline.js
 *     - Artifact Type: javascript
 *     - Version: 1.2.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — A time
 *       axis with gridlines, agents' life bands, calls as bars as long as
 *       they took, kind colours shared with Insights, zoom by drag, phase or
 *       buttons with the window shown on the whole run, and a tooltip on
 *       every mark.
 *     - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
 *       range dates its end when the run crossed midnight.
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's timeline stage (R04): every agent of a run
 *       in its own lane on one time axis, the phases over them, and a
 *       playhead that steps or plays through what was recorded.
 *
 * ✒ Description:
 *     The Timeline view: a run read across its agents. Each agent is a lane,
 *     each event a mark at the moment its line was written, and the playhead
 *     moves through them in order, showing the event under it and the
 *     events just before and after it in every lane. Replay steps through
 *     the record; nothing is run again.
 *
 * ✒ Key Features:
 *     - Lanes per agent, phase bands above, and an overview of how busy the
 *       run was, errors marked in it
 *     - A playhead to drag, step, or play at 1×, 2× or 5×
 *     - Jumps to the next error and the next failing test
 *     - Kind filters; a lane's label hides or shows it
 *     - Events in the same millisecond from two agents are marked: their
 *       order is not known
 *     - The playhead's event is kept in the address, and a failure opens in
 *       Investigate
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/timeline
 *     - Compatible platforms: current evergreen browsers
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, icon, when, clock, span, num, api } from './core.js';
import { timeTicks, tooltip } from './chart.js';

const KINDS = ['say', 'tool', 'read', 'edit', 'test', 'commit', 'error'];
const KIND_ICON = { say: 'chat-teardrop-text', tool: 'terminal-window', read: 'magnifying-glass', edit: 'pencil-simple-line', test: 'flask', commit: 'git-commit', error: 'warning-octagon' };
const SPEEDS = { 1: 700, 2: 350, 5: 140 };

export function createTimelineView(ctx) {
  let data = null;
  let runId = null;
  let idx = 0;
  let playing = null;
  let hiddenLanes = new Set();
  let kinds = new Set(KINDS);
  let speed = 1;
  let wantEvent = null;
  let wantAt = null;
  let view = null; // { start, end } while zoomed
  const tip = tooltip($('tl-lanes'));

  const shown = () => (data ? data.events.filter((e) => kinds.has(e.kind) && !hiddenLanes.has(e.agent)) : []);
  // The window on the time axis: the whole run, or the stretch zoomed to.
  const win = () => view || data.range;
  const pos = (t) => {
    const { start, end } = win();
    return end > start ? ((t - start) / (end - start)) * 100 : 0;
  };
  const posAll = (t) => {
    const { start, end } = data.range;
    return end > start ? ((t - start) / (end - start)) * 100 : 0;
  };
  const failing = (e) => e.kind === 'error' || e.status === 'error' || e.outcome === 'failed';
  const laneLabel = (id) => data.lanes.find((l) => l.id === id)?.label || id;

  function drawControls() {
    const list = shown();
    const slider = $('tl-slider');
    slider.max = String(Math.max(0, list.length - 1));
    slider.value = String(Math.min(idx, Math.max(0, list.length - 1)));
    slider.disabled = !list.length;
    $('tl-play').replaceChildren(icon(playing ? 'pause' : 'play'), playing ? 'Pause' : 'Play');
    $('tl-pos').textContent = list.length ? `${num(Math.min(idx, list.length - 1) + 1)} of ${num(list.length)}` : '0 of 0';
    $('tl-zoom-fit').disabled = !view;
    $('tl-zoom-out').disabled = !view;
    $('tl-zoom-level').textContent = view ? `${span(view.end - view.start)} shown` : 'whole run';
    // The kind chips are the legend as well as the filter: each carries its colour.
    fill($('tl-kinds'), el('span', { class: 'filter-label', text: 'Show' }), KINDS.map((k) => el('button', {
      type: 'button', class: `chip kind-chip k-${k}`, 'aria-pressed': String(kinds.has(k)),
      title: kinds.has(k) ? `Hide ${k} events` : `Show ${k} events`,
      onclick: () => {
        if (kinds.has(k)) kinds.delete(k);
        else kinds.add(k);
        keepPlace();
        draw();
      },
    }, el('span', { class: `viz-key c-${k === 'error' ? 'bad' : k}`, 'aria-hidden': 'true' }), icon(KIND_ICON[k]), k)));
  }

  /** Keeps the playhead on the same event when the filters change. */
  function keepPlace() {
    const before = currentEvent();
    const list = shown();
    const i = before ? list.findIndex((e) => e.t >= before.t) : 0;
    idx = Math.max(0, i < 0 ? list.length - 1 : i);
  }
  const currentEvent = () => shown()[idx] || null;

  /** Zooms to a stretch, at least five seconds wide and inside the run. */
  function zoomTo(a, b) {
    const { start, end } = data.range;
    const min = 5000;
    if (b - a < min) {
      const c = (a + b) / 2;
      a = c - min / 2;
      b = c + min / 2;
    }
    a = Math.max(start, a);
    b = Math.min(end, b);
    view = b - a >= (end - start) * 0.98 ? null : { start: a, end: b };
    // The playhead moves into the stretch zoomed to, or following it would pan straight back.
    const cur = currentEvent();
    if (view && (!cur || cur.t < view.start || cur.t > view.end)) {
      const list = shown();
      const i = list.findIndex((e) => e.t >= view.start);
      if (i >= 0 && list[i].t <= view.end) idx = i;
      else view = null;
      stop();
    }
    draw();
  }
  function zoomBy(f) {
    if (!data) return;
    const { start, end } = win();
    const cur = currentEvent();
    const c = cur && cur.t >= start && cur.t <= end ? cur.t : (start + end) / 2;
    const half = ((end - start) * f) / 2;
    zoomTo(c - half, c + half);
  }

  /** The axis: drag across it to zoom to that stretch; a click moves the playhead there. */
  function brush(track) {
    let x0 = null;
    let sel = null;
    const tAt = (x) => {
      const b = track.getBoundingClientRect();
      const { start, end } = win();
      return start + Math.min(1, Math.max(0, (x - b.left) / b.width)) * (end - start);
    };
    track.addEventListener('pointerdown', (e) => {
      x0 = e.clientX;
      track.setPointerCapture(e.pointerId);
      sel = el('span', { class: 'tl-brush' });
      track.append(sel);
    });
    track.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      const b = track.getBoundingClientRect();
      sel.style.left = `${Math.min(x0, e.clientX) - b.left}px`;
      sel.style.width = `${Math.abs(e.clientX - x0)}px`;
    });
    track.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const a = Math.min(x0, e.clientX);
      const b = Math.max(x0, e.clientX);
      x0 = null;
      sel?.remove();
      if (b - a > 6) zoomTo(tAt(a), tAt(b));
      else seekTime(tAt(a));
    });
  }

  function markTip(e, ev) {
    tip.show(ev.clientX, ev.clientY, `${clock(e.t)} · ${laneLabel(e.agent)}`, [
      { cls: e.kind === 'error' ? 'bad' : e.kind, value: e.kind, label: e.tool && e.kind !== 'say' ? e.tool : '' },
      { value: String(e.text || '').slice(0, 160) },
      e.ms !== null && e.ms !== undefined ? { value: span(e.ms), label: 'until its result came back' } : null,
      e.status === 'error' ? { cls: 'bad', value: 'error', label: 'the result was marked as an error' } : null,
      e.outcome && !['ok', 'confirmed', 'passed'].includes(e.outcome) ? { cls: 'bad', value: e.outcome, label: '' } : null,
      e.tie ? { value: 'same moment', label: 'as another agent; their order is not known' } : null,
    ].filter(Boolean));
  }

  function drawLanes() {
    const box = $('tl-lanes');
    if (!data || !data.lanes.length) {
      fill(box, el('p', { class: 'empty', text: 'No agent in this run has written anything yet.' }));
      return;
    }
    const list = shown();
    const cur = list[idx];
    // Follow the playhead: a zoomed window pans to keep the current event in it.
    if (view && cur && (cur.t < view.start || cur.t > view.end)) {
      const w = view.end - view.start;
      const a = Math.max(data.range.start, Math.min(data.range.end - w, cur.t - w / 2));
      view = { start: a, end: a + w };
    }
    const { start, end } = win();
    const trackW = Math.max(200, box.clientWidth - 168);
    const ticks = end > start ? timeTicks(start, end, Math.max(2, Math.floor(trackW / 120))) : [];

    const axisTrack = el('div', { class: 'tl-track tl-axis-track', title: 'Drag across the axis to zoom to that stretch; click to move the playhead there' },
      ...ticks.map((tk) => el('span', { class: 'tl-tick', left: `${pos(tk.t)}%`, text: tk.label })));
    brush(axisTrack);
    const axis = el('div', { class: 'tl-row tl-axis' }, el('span', { class: 'tl-label', text: view ? 'Zoomed' : 'Time' }), axisTrack);

    // The whole run, always: how busy it was, errors in red, and the zoomed window on it.
    const sum = new Array(120).fill(0);
    const err = new Array(120).fill(0);
    for (const b of data.buckets) {
      if (hiddenLanes.has(b.agent)) continue;
      b.events.forEach((v, i) => { sum[i] += v; });
      b.errors.forEach((v, i) => { err[i] += v; });
    }
    const max = Math.max(1, ...sum);
    const overTrack = el('div', { class: 'tl-track', title: view ? 'The whole run; click to move the zoomed window there' : 'The whole run; click to move the playhead there' },
      ...sum.map((v, i) => el('span', { class: `tl-bar${err[i] ? ' is-bad' : ''}`, left: `${(i / 120) * 100}%`, width: `${100 / 120}%`, 'data-h': String(Math.round((v / max) * 100)) })),
      view ? el('span', { class: 'tl-window', left: `${posAll(view.start)}%`, width: `${posAll(view.end) - posAll(view.start)}%` }) : null);
    overTrack.addEventListener('click', (e) => {
      const b = overTrack.getBoundingClientRect();
      const t = data.range.start + ((e.clientX - b.left) / b.width) * (data.range.end - data.range.start);
      if (view) {
        const w = view.end - view.start;
        zoomTo(t - w / 2, t + w / 2);
      } else seekTime(t);
    });
    const overview = el('div', { class: 'tl-row tl-overview' }, el('span', { class: 'tl-label', text: 'Activity' }), overTrack);
    for (const bar of overview.querySelectorAll('.tl-bar')) bar.style.height = `${Math.max(bar.dataset.h > 0 ? 8 : 0, Number(bar.dataset.h))}%`;

    const inWin = (a, b) => (b || a) >= start && a <= end;
    const phases = el('div', { class: 'tl-row tl-phases' }, el('span', { class: 'tl-label', text: 'Phases' }),
      el('div', { class: 'tl-track' }, ...data.phases.filter((p) => p.start && p.end && inWin(p.start, p.end)).map((p) => {
        const l = pos(Math.max(p.start, start));
        return el('button', { type: 'button', class: `tl-phase is-${p.state}`, left: `${l}%`, width: `${Math.max(0.6, pos(Math.min(p.end, end)) - l)}%`, title: `${p.title}: ${clock(p.start)} to ${clock(p.end)}. Click to zoom to it.`, text: p.title, onclick: () => zoomTo(p.start, p.end) });
      })));

    const lanes = data.lanes.map((l) => {
      const off = hiddenLanes.has(l.id);
      const life = !off && l.start && l.end && inWin(l.start, l.end)
        ? el('span', { class: `tl-life is-${l.status}`, left: `${pos(Math.max(l.start, start))}%`, width: `${Math.max(0.3, pos(Math.min(l.end, end)) - pos(Math.max(l.start, start)))}%` })
        : null;
      const marks = off ? [] : list.filter((e) => e.agent === l.id && inWin(e.t, e.end)).map((e) => {
        const a = pos(Math.max(e.t, start));
        const w = e.end && e.end > e.t ? pos(Math.min(e.end, end)) - a : 0;
        const long = w > 0.4; // a call that took long enough to see becomes a bar as long as it took
        return el('button', {
          type: 'button', class: `tl-mark k-${e.kind}${long ? ' is-span' : ''}${failing(e) ? ' is-bad' : ''}${e.tie ? ' is-tie' : ''}${e === cur ? ' is-current' : ''}`,
          left: `${a}%`, width: long ? `${w}%` : null, 'aria-label': `${e.kind} at ${clock(e.t)}: ${e.text}`,
          onpointerenter: (ev) => markTip(e, ev),
          onpointerleave: () => tip.hide(),
          onfocus: (ev) => { const b = ev.target.getBoundingClientRect(); markTip(e, { clientX: b.left, clientY: b.top }); },
          onblur: () => tip.hide(),
          onclick: () => {
            idx = list.indexOf(e);
            stop();
            draw();
          },
        });
      });
      return el('div', { class: `tl-row${off ? ' is-off' : ''}` },
        el('button', { type: 'button', class: 'tl-label', title: off ? 'Show this agent' : 'Hide this agent', onclick: () => { if (off) hiddenLanes.delete(l.id); else hiddenLanes.add(l.id); keepPlace(); draw(); } },
          el('b', { text: l.label }), el('span', { text: `${l.phase || ''}${l.count ? ` · ${num(l.count)}` : ''}` })),
        el('div', { class: 'tl-track' }, life, ...marks));
    });
    const at = (t) => `calc(var(--tl-label) + (100% - var(--tl-label)) * ${pos(t) / 100})`;
    const grid = el('div', { class: 'tl-grid', 'aria-hidden': 'true' }, ...ticks.map((tk) => el('span', { class: 'tl-gridline', left: at(tk.t) })));
    const head = cur && cur.t >= start && cur.t <= end ? el('div', { class: 'tl-head', left: at(cur.t), title: clock(cur.t) }) : null;
    fill(box, grid, axis, overview, phases, ...lanes, head, tip.node);
  }

  function drawDetail() {
    const list = shown();
    const cur = list[idx];
    const box = $('tl-detail');
    if (!cur) {
      fill(box, el('p', { class: 'empty', text: data ? 'Nothing to show with these filters.' : '' }));
      return;
    }
    const lane = data.lanes.find((l) => l.id === cur.agent);
    const near = list.slice(Math.max(0, idx - 5), idx + 6);
    fill(box,
      el('div', { class: 'tl-now' },
        el('span', { class: `ev-icon k-${cur.kind}` }, icon(KIND_ICON[cur.kind] || 'dot')),
        el('div', {},
          el('p', { class: 'eyebrow', text: `${lane?.label || cur.agent}${lane?.phase ? ` · ${lane.phase}` : ''} · ${when(cur.t)}` }),
          el('p', { class: 'tl-text' }, cur.tool && cur.kind !== 'say' ? el('span', { class: 'ev-tool', text: cur.tool }) : null, cur.text),
          el('p', { class: 'muted', text: [
            cur.status ? `came back ${cur.status === 'ok' ? 'ok' : cur.status === 'error' ? 'as an error' : 'with no result yet'}` : null,
            cur.outcome && cur.outcome !== 'ok' ? cur.outcome : null,
            cur.ms !== null && cur.ms !== undefined ? `took ${span(cur.ms)}` : null,
            cur.line ? `transcript line ${cur.line}` : null,
            cur.tie ? 'written in the same millisecond as another agent\'s event, so their order is not known' : null,
          ].filter(Boolean).join(' · ') }),
          failing(cur) ? el('button', { type: 'button', class: 'btn', onclick: () => ctx.go('investigate', { run: runId, params: { event: cur.of || cur.id } }) }, icon('magnifying-glass-plus'), 'Investigate') : null)),
      el('h4', { class: 'sub', text: 'Around it, every agent' }),
      el('ol', { class: 'mini-list' }, ...near.map((e) => el('li', { class: `ev mini is-${e.kind}${e === cur ? ' is-now' : ''}${e.status ? ` st-${e.status}` : ''}` },
        el('span', { class: 'ev-icon' }, icon(KIND_ICON[e.kind] || 'dot')),
        el('div', { class: 'ev-text' }, el('span', { class: 'ev-agent', text: data.lanes.find((l) => l.id === e.agent)?.label || e.agent }), e.tool && e.kind !== 'say' ? el('span', { class: 'ev-tool', text: e.tool }) : null, e.text),
        el('span', { class: 'ev-side' }, el('time', { class: 'ev-time', text: clock(e.t) })),
      ))));
  }

  function draw() {
    if (!data) return;
    const s = data;
    $('tl-run').textContent = `${s.run.title} · ${num(s.total)} events${s.truncated ? `, the first ${num(s.events.length)} shown` : ''}${s.untimed ? `, ${num(s.untimed)} without a time` : ''}${s.ties ? `, ${num(s.ties)} same-moment ties` : ''}`;
    // The end carries its date when the run crossed midnight; the same day needs only the time.
    const sameDay = s.range.start && new Date(s.range.start).toDateString() === new Date(s.range.end).toDateString();
    $('tl-range').textContent = s.range.start ? `${when(s.range.start)} to ${sameDay ? clock(s.range.end) : when(s.range.end)}, ${span(s.range.end - s.range.start)}` : '';
    drawControls();
    drawLanes();
    drawDetail();
  }

  function remember() {
    const cur = currentEvent();
    if (cur) ctx.go('timeline', { run: runId, params: { event: cur.id }, replace: true, quiet: true });
  }

  function seekTime(t) {
    const list = shown();
    const i = list.findIndex((e) => e.t >= t);
    idx = i < 0 ? list.length - 1 : i;
    stop();
    draw();
    remember();
  }

  function step(n) {
    const list = shown();
    idx = Math.max(0, Math.min(list.length - 1, idx + n));
    draw();
  }

  function next(pred) {
    const list = shown();
    const i = list.findIndex((e, k) => k > idx && pred(e));
    if (i >= 0) {
      idx = i;
      stop();
      draw();
      remember();
    }
  }

  function stop() {
    clearInterval(playing);
    playing = null;
  }
  function play() {
    if (playing) {
      stop();
      drawControls();
      remember();
      return;
    }
    if (idx >= shown().length - 1) idx = 0;
    playing = setInterval(() => {
      if (idx >= shown().length - 1) {
        stop();
        drawControls();
        remember();
        return;
      }
      step(1);
    }, SPEEDS[speed]);
    drawControls();
  }

  $('tl-play').addEventListener('click', play);
  $('tl-prev').addEventListener('click', () => { stop(); step(-1); remember(); });
  $('tl-next').addEventListener('click', () => { stop(); step(1); remember(); });
  $('tl-next-error').addEventListener('click', () => next(failing));
  $('tl-next-test').addEventListener('click', () => next((e) => e.kind === 'test' && e.outcome === 'failed'));
  $('tl-speed').addEventListener('change', (e) => {
    speed = Number(e.target.value) || 1;
    if (playing) {
      stop();
      play();
    }
  });
  $('tl-slider').addEventListener('input', (e) => {
    stop();
    idx = Number(e.target.value) || 0;
    draw();
  });
  $('tl-slider').addEventListener('change', remember);
  $('tl-zoom-in').addEventListener('click', () => zoomBy(0.5));
  $('tl-zoom-out').addEventListener('click', () => zoomBy(2));
  $('tl-zoom-fit').addEventListener('click', () => { view = null; draw(); });

  async function load() {
    const s = ctx.state();
    runId = ctx.ui.run || s?.focus || null;
    const body = await api('timeline', '/api/timeline', { project: s?.project?.slug || ctx.ui.project, run: runId });
    if (body === undefined) return;
    if (!body) {
      data = null;
      $('tl-run').textContent = 'No run to show.';
      return;
    }
    if (body.run.id !== runId) view = null;
    data = body;
    runId = body.run.id;
    const list = shown();
    if (wantEvent) {
      const i = list.findIndex((e) => e.id === wantEvent);
      if (i >= 0) idx = i;
    } else if (wantAt) {
      const i = list.findIndex((e) => e.t >= wantAt);
      idx = i < 0 ? 0 : i;
    } else idx = 0;
    draw();
  }

  return {
    panel: 'view-timeline',
    show(params) {
      wantEvent = params.get('event');
      wantAt = Number(params.get('at')) || null;
      const run = ctx.ui.run || ctx.state()?.focus || null;
      if (data && run === runId && wantEvent) {
        const i = shown().findIndex((e) => e.id === wantEvent);
        if (i >= 0) {
          idx = i;
          draw();
          return;
        }
      }
      load();
    },
    hide() {
      stop();
    },
    onState() { /* the timeline is fetched when the view opens */ },
  };
}
