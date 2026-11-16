/*
 * ============================================================================
 * ✒ Metadata
 *     - Title: Agent Watch Notices (dd1 Tools Edition - v1.0)
 *     - File Name: notices.js
 *     - Relative Path: web/notices.js
 *     - Artifact Type: javascript
 *     - Version: 1.0.0
 *     - Date: 11/15/2026
 *     - Update: Sunday, November 15, 2026
 *     - Author: Dennis 'dendogg' Smaltz
 *     - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
 *     - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!
 *
 * ✒ Changelog:
 *     - 1.0.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
 *       version, for the audit's watchpoint stage (R07): the service's
 *       notices behind a bell in the header, unread ones counted, each one
 *       a link to its evidence, and desktop notices only when asked for.
 *
 * ✒ Description:
 *     The page's side of the watchpoints: the notices the service raised
 *     for every project, newest first, under a bell that counts the unread.
 *     Choosing a notice opens its run, and its failure in Investigate. The
 *     project picker marks projects with a running run or unread notices.
 *
 * ✒ Key Features:
 *     - Unread counted against the last time the list was marked read,
 *       kept in this browser
 *     - Kinds shown chosen in the panel: run finished or ended, errors,
 *       failing tests, quiet agents
 *     - Desktop notices only after the button asks the browser and it says
 *       yes; then new notices are checked every 15 s even while the tab is
 *       hidden, and clicking one brings the page to it
 *     - A notice says how it was known: observed, or inferred from
 *       inactivity
 *
 * ✒ Other Important Information:
 *     - Dependencies: core.js; the server's /api/notices
 *     - Compatible platforms: current evergreen browsers; desktop notices
 *       need the browser's permission
 * ----------------------------------------------------------------------------
 */

import { $, el, fill, icon, when, ago, store, api } from './core.js';

const KIND = {
  'run-finished': { icon: 'flag-checkered', label: 'Run finished', group: 'finished' },
  'run-ended': { icon: 'stop-circle', label: 'Run ended', group: 'finished' },
  error: { icon: 'warning-octagon', label: 'Error', group: 'errors' },
  'test-failed': { icon: 'flask', label: 'Tests failed', group: 'tests' },
  quiet: { icon: 'hourglass-medium', label: 'Quiet agent', group: 'quiet' },
};
const GROUPS = [['finished', 'Runs finishing'], ['errors', 'Errors'], ['tests', 'Failing tests'], ['quiet', 'Quiet agents']];

export function createNotices(ctx) {
  let list = [];
  let latestSeen = Number(store.get('notices.read')) || 0;
  let lastFetched = 0;
  let open = false;
  let hiddenTimer = null;
  const groups = new Set(JSON.parse(store.get('notices.groups') || 'null') || GROUPS.map((g) => g[0]));
  const shownKind = (n) => groups.has(KIND[n.kind]?.group || 'errors');
  const notify = () => store.get('notices.desktop') === 'on' && typeof Notification !== 'undefined' && Notification.permission === 'granted';

  function unread() {
    return list.filter((n) => n.at > latestSeen && shownKind(n));
  }

  function drawBell() {
    const n = unread().length;
    const b = $('bell-count');
    b.textContent = n ? String(n > 99 ? '99+' : n) : '';
    b.hidden = !n;
    $('bell').title = n ? `${n} unread notices` : 'Notices';
    $('bell').classList.toggle('has-unread', n > 0);
  }

  function goTo(n) {
    open = false;
    $('notices').hidden = true;
    $('bell').setAttribute('aria-expanded', 'false');
    if (n.project && n.project !== ctx.ui.project) {
      ctx.ui.project = n.project;
      store.set('project', n.project);
    }
    if ((n.kind === 'error' || n.kind === 'test-failed') && n.event) ctx.go('investigate', { run: n.run, params: { event: n.event } });
    else ctx.go('live', { run: n.run, agent: n.agent || null });
  }

  function drawPanel() {
    const items = list.filter(shownKind);
    fill($('notices-list'), items.length ? items.map((n) => el('li', {},
      el('button', { type: 'button', class: `notice${n.at > latestSeen ? ' is-unread' : ''} n-${n.kind}`, onclick: () => goTo(n) },
        el('span', { class: 'notice-icon' }, icon(KIND[n.kind]?.icon || 'bell')),
        el('span', { class: 'notice-body' },
          el('span', { class: 'notice-text', text: n.text }),
          el('span', { class: 'notice-meta', text: `${n.projectName || n.project} · ${n.runTitle} · ${ago(n.at)}${n.basis === 'inferred' ? ' · inferred' : ''}`, title: `${when(n.at)}. Known from the ${n.evidence || 'service'}.` }))))) : [el('li', { class: 'empty', text: list.length ? 'No notices of the kinds chosen.' : 'Nothing yet. Notices appear when a run finishes, a call fails, tests fail or an agent goes quiet.' })]);
    fill($('notices-kinds'), GROUPS.map(([g, label]) => el('label', { class: 'check' },
      el('input', { type: 'checkbox', checked: groups.has(g), onchange: (e) => {
        if (e.target.checked) groups.add(g);
        else groups.delete(g);
        store.set('notices.groups', JSON.stringify([...groups]));
        drawPanel();
        drawBell();
      } }), label)));
    const d = $('notices-desktop');
    if (typeof Notification === 'undefined') {
      d.disabled = true;
      d.textContent = 'Desktop notices: not in this browser';
    } else {
      d.disabled = Notification.permission === 'denied';
      d.textContent = Notification.permission === 'denied' ? 'Desktop notices: blocked in the browser' : notify() ? 'Desktop notices: on' : 'Desktop notices: off';
      d.setAttribute('aria-pressed', String(notify()));
    }
  }

  async function fetchNotices() {
    const body = await api('notices', '/api/notices', { limit: 100 });
    if (!body) return;
    const fresh = body.notices.filter((n) => n.at > lastFetched);
    const first = !lastFetched;
    list = body.notices;
    lastFetched = Math.max(lastFetched, ...list.map((n) => n.at), 1);
    if (!first && notify()) {
      for (const n of fresh.filter(shownKind).slice(0, 5)) {
        try {
          const note = new Notification(`Agent Watch · ${KIND[n.kind]?.label || 'Notice'}`, { body: `${n.text}\n${n.projectName || ''} · ${n.runTitle}`, tag: n.id });
          note.onclick = () => {
            window.focus();
            goTo(n);
            note.close();
          };
        } catch { /* the browser refused */ }
      }
    }
    $('notices-off').hidden = body.watching !== false;
    drawBell();
    if (open) drawPanel();
  }

  $('bell').addEventListener('click', () => {
    open = !open;
    $('notices').hidden = !open;
    $('bell').setAttribute('aria-expanded', String(open));
    if (open) {
      drawPanel();
      fetchNotices();
    }
  });
  $('notices-read').addEventListener('click', () => {
    latestSeen = Date.now();
    store.set('notices.read', String(latestSeen));
    drawPanel();
    drawBell();
  });
  $('notices-desktop').addEventListener('click', async () => {
    if (typeof Notification === 'undefined') return;
    if (notify()) store.set('notices.desktop', 'off');
    else {
      const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      store.set('notices.desktop', p === 'granted' ? 'on' : 'off');
    }
    drawPanel();
    watchHidden();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) $('bell').click();
  });

  /** While the tab is hidden, check every 15 s, but only for desktop notices the person asked for. */
  function watchHidden() {
    clearInterval(hiddenTimer);
    hiddenTimer = null;
    if (document.hidden && notify()) hiddenTimer = setInterval(fetchNotices, 15000);
  }
  document.addEventListener('visibilitychange', watchHidden);

  return {
    /** Called with each state: fetches when the service has something newer. */
    onState(s) {
      if (s.latestNotice && s.latestNotice > lastFetched) fetchNotices();
      else if (!lastFetched) fetchNotices();
      drawBell();
    },
    /** How many unread notices a project has. */
    unreadFor(slug) {
      return unread().filter((n) => n.project === slug).length;
    },
  };
}
