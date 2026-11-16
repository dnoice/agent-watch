<!--
✒ Metadata
    - Title: Agent Watch Readme (dd1 Tools Edition - v1.12)
    - File Name: README.md
    - Relative Path: README.md
    - Artifact Type: docs
    - Version: 1.12.1
    - Date: 11/16/2026
    - Update: Monday, November 16, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.12.1 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Written
      for anyone who clones it: what it needs, getting it, the commands
      through node (digi is the collection's launcher), the state folder on
      every platform, the license and the repository's own files.
    - 1.12.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      Sessions view and the sessions command: every Claude Code session on
      the machine, where its figures come from, the new files and route.
    - 1.11.3 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The line
      under the name, with its arrowheads.
    - 1.11.2 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      header's order: the name over its line, the project, then the service's
      state with the meters.
    - 1.11.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      Insights view, the Timeline's axis and zoom, and the Tests history
      tiles.
    - 1.10.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] —
      Investigate's listing by description, the Tests view's filters, and how
      a resumed run is counted.
    - 1.9.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The run's
      figures panel, the status sentence, Activity's tab row, numbered agents
      and the feed that fills its card.
    - 1.8.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The header
      as reworked from Dennis's review.
    - 1.7.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      header's logo and its motion; the logo's master and logo-sync.mjs in
      the files table.
    - 1.6.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The Profile
      and Handoff views, completion criteria and the handoff report, the new
      options and files.
    - 1.5.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The Tests,
      Files and Compare views; the new routes and files.
    - 1.4.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      Timeline view, notices and the watchpoints, the new options and files.
    - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      Investigate view; the new routes and files.
    - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — The
      archive: the Archive view, index, runs and search, --status, project
      names, where the archive is kept and how it is built, the new files.
    - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — How sure a
      figure is: provenance and attempts apart from outcomes; the page's new
      figures; the new library files. It no longer says the chosen agent is
      kept in the browser.
    - 1.0.0 (11/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      version.

✒ Description:
    How to run agent-watch, what its page shows, where it reads from, and
    what it will not do. agent-watch follows Claude Code live: every
    terminal session on the machine and what it is doing, and each workflow
    run's phases, agents, tool calls, the branch's commits, test logs and the
    machine's load, in a local page in the Fire Watch design.

✒ Key Features:
    - What it needs, getting it, and starting, stopping and checking it
    - The page, region by region
    - Where every figure comes from, and what is read incrementally
    - The security model and the limits
    - The license

✒ Other Important Information:
    - Dependencies: none beyond Node.js 20
    - Compatible platforms: Windows 11 (primary), macOS, Linux
-->

# agent-watch

Follow Claude Code as it works. The Sessions view shows every terminal session open on the
machine and what each is doing this second: the person's prompts, Claude's replies and every
tool call, the subagents it started, the commands it left running in the background, its turns
and its cost. The Live view shows a workflow run in progress: its phases, its agents, what the
running agent is doing tool call by tool call, the commits on its branch, its latest test logs
and the machine's load. Every earlier run of the project is listed below it and can be opened
the same way.

It reads what Claude Code already writes to disk. It changes nothing, and it listens on
127.0.0.1 only.

## What it needs

- [Node.js](https://nodejs.org/) 20 or later. agent-watch uses Node's own modules only, so there
  is nothing to install.
- Claude Code on the same machine: agent-watch reads what it writes under `~/.claude`.
- Optional: `git` on the PATH for a run's commits, and `netstat` (Windows) for its test ports.

Windows 11 is where it is used most; macOS and Linux run it too.

## Getting it

```text
git clone https://github.com/dnoice/agent-watch.git
cd agent-watch
node agent-watch.mjs start --open
```

## Running it

```text
node agent-watch.mjs start        start it in the background; prints http://127.0.0.1:4300/
node agent-watch.mjs status       the address, the open sessions and the current run, in the terminal
node agent-watch.mjs sessions     every Claude Code session on the machine and what each is doing
node agent-watch.mjs stop         stop the background service
node agent-watch.mjs serve        run it in this terminal until Ctrl+C
node agent-watch.mjs projects     the Claude projects that hold workflow runs
node agent-watch.mjs index        build or bring up to date a project's archive of every run
node agent-watch.mjs runs         every run of a project, from the archive
node agent-watch.mjs search ...   runs that match words or field:value
node agent-watch.mjs notices      what the watchpoints noticed, newest first
node agent-watch.mjs handoff      a run against its completion criteria, as a report
node agent-watch.mjs criteria     where a workflow's criteria live; writes a starter set to edit
node agent-watch.mjs test         the suite
```

`npm start`, `npm stop` and `npm test` run the same from this folder. In the dd1 tools
collection, where it began, `digi agent-watch <command>` runs them.

| Option | What it does |
| ------ | ------------ |
| `--project <slug, path or name>` | The project. A folder path or the folder's name works as well as Claude's slug, and a project that has not run a workflow yet is accepted. Without it, the project with the newest workflow activity. |
| `--port <n>` | Port on 127.0.0.1. 4300 unless given. |
| `--open` | Open the page in the default browser once it answers. |
| `--root <dir>` | Claude's projects folder, if not `~/.claude/projects`. |
| `--lines <n>` | `status` and `sessions`: how many of the newest actions to print, 5 unless given. `runs` and `search`: how many runs, 20 unless given. |
| `--status <name>` | `runs` only: just the runs with this status, such as `completed` or `killed`. |
| `--quiet-alert <min>` | `start` and `serve`: minutes an agent may write nothing before a notice says it is quiet. 10 unless given; 0 turns that notice off. |
| `--no-watch` | `start` and `serve`: run without watchpoints, so no notices at all. |
| `--run <wf_id>` | `handoff`: the run to report on. The current run unless given. |
| `--format md\|json` | `handoff`: Markdown (the default) or JSON. |
| `--out <file>` | `handoff`: write the report to a file instead of the terminal. |
| `--workflow <name>` | `criteria`: the workflow. The current run's unless given. |

The page itself can switch projects from the picker in its header, and its choice of project and
theme is kept in the browser. The address keeps the view, the run and the agent, so a link opens
the same place.

## The page

- **The header**, in the same column as the cards below it, so its edges line up with theirs:
  Dennis's logo, with a gold wave running out along its paths for as long as the page is in
  view and its eyes blinking now and then (still, when the system asks for reduced motion);
  the name over its line, Claude Code ▸ workflows with the logo's arrowheads between the words,
  fitted to the name's width; the project, chosen from the masthead; then, on the right, the
  service's state (Live with a beating green dot and the time of the last answer, red as Not
  answering when it stops), the CPU and memory meters, the notices bell, and the theme switch
  between Parchment and Sentinel. The header and the view tabs stay at the top together as the
  page scrolls.
- **The run**: the run's title (from the workflow's arguments, such as the piece or tab it
  builds), its workflow name and description, then its figures in a panel of aligned cells: its
  branch and base, when it started, the time it has taken, how many agents are done, tool calls
  with how many failed, tokens, commits confirmed of those tried, and test runs passed and
  failed. Under it, one sentence on where the status came from, and the phase rail: every phase
  the workflow's script declares, done, active or still to come, with the agents of each and how
  long they took.
- **Activity**: the chosen agent's actions, newest first. What it said, each tool it called with
  the description it gave, whether the call came back ok or as an error and how long it took,
  and the errors that came back. Tests and commits are marked so they stand out, and an event
  that has just arrived flashes once. A tab per agent, on a row of its own under the card's
  head with the count of agents done and running; the running one is chosen by default. Two
  agents with one description (a step run again) are numbered, `docs #2`, here and in every
  view. Beside the side column the feed fills the card's height and scrolls inside it.
- **Agent**: that agent's tool calls, test runs passed of those run, commits confirmed of those
  tried, errors, output tokens and transcript size, its tools by count, and, once it has
  finished, the facts of its result: commits, findings by severity, risks, problems, the tests it
  reported, and the check lines.
- **Branch**: the commits on the run's branch since its base, and the latest commits on the
  trunk, named for what it is: `main`, `master`, or the checked-out branch when neither exists.
- **Tests**: the newest test logs in the run's scratch folder with their pass and fail tally and
  any FAIL lines, and the test ports listening in the run's port range. A run that names no
  scratch folder gets the newest Claude scratchpad's logs, under a warning that they are not
  tied to it.
- **The status bar**: how many sources were read, how many were skipped as unreadable or
  malformed (hover for why), and how long ago the newest one was written.
- **Runs**: the newest runs of the project, with how many there are in all. Choosing one shows
  it; choosing the live run again follows it. **Every run** opens the Archive.

The tab bar under the header switches views:

- **Live**: everything above.
- **Sessions**: everything Claude Code is doing on the machine, not only workflow runs. Across
  the top, a card for every open terminal session: its project, its name, its title, whether it
  is working or waiting for you (a ring breathes while it works), and how many agents and
  workflows it has going; sessions closed in the last day are one switch away. Under them, the
  session in focus: by default the one working now, following the work as it moves, or the one
  chosen. Its now line says what it is doing this second and for how long: the tool it is
  running, the agent or workflow it is waiting on, thinking, or waiting for you (and, when a
  call has no result while Claude Code reports idle, that it may be waiting for your approval).
  Its figures: folder, branch, model, permission mode, start, turns, tool calls, cost, lines
  changed, output tokens and process. Activity is its feed, newest first, with the person's own
  prompts set apart: the main thread, any one subagent, or all of them merged, filtered by kind,
  and narrowed to one turn by choosing it. Beside it, its subagents (each opens as its lane), its
  workflow runs (each opens in Live, in its own project) and background commands with their
  summaries, its turns with their durations, and its tools and cost by model. One switch shows
  everything on the machine in one feed, each row naming the session it came from.
- **Insights**: charts, in two scopes under one switch. This run: its headline figures, what it
  did over time by kind with its phases above and errors as red dots, how many agents worked at
  once, each agent's tool calls by what came back, how long the calls took, each test run's
  cases, the output tokens by agent and the files touched most. Every run of the project: one
  column per run, oldest first, for wall time, tool calls, tokens, test runs, errors and
  commits; a column opens its run. Every chart has a legend for two or more series, a tooltip,
  arrow keys to step through it, and a table of the same numbers. Tokens from a saved record
  (total) and from transcripts (output only) are drawn as two series, never added.
- **Timeline**: the run in focus read across its agents. Each agent is a lane on one time axis,
  each event a mark at the moment its line was written, the phases as bands above, and an
  overview of where the run was busy, failures in red. A playhead drags, steps, or plays at 1×,
  2× or 5×, and jumps to the next failure or failing test; under it, the event and every
  agent's events just before and after. Replay steps through the record; nothing is run again.
  Two agents' events in the same millisecond are marked as ties, their order unknown. Choosing a
  phase in Live's rail opens it here. A time axis with gridlines runs over the lanes; each
  agent's lane shows its working life as a faint band, and a tool call long enough to see is a
  bar as long as it took. Drag across the axis, click a phase, or use the zoom buttons to look
  closer; the Activity row always shows the whole run and where the zoomed window sits. Kinds
  wear the same colours as in Insights, and hovering a mark says what it was.
- **Investigate**: every failure of the run in focus. A tool call that came back as an error, a
  test run whose output reports failures, a commit that did not happen, a failing log in the
  run's scratch folder, a failing test the workflow reported. Retries of the same command fold
  into one, counted; the unresolved come first. Each is listed and headed by the description
  the agent gave its command, with the command itself beneath. The one chosen shows the call,
  what came back, the agent's steps before and after, every other agent's events within two
  minutes, the files it had just edited, the test runs after it, and any later recovery: the
  same command coming back ok, or, said to be only a correlation, a later test run that passed.
  The Live feed's failures each have an Investigate button.
- **Tests**: the run's named test cases, from its test commands' output, its scratch logs and
  the tests its workflow reported, each set against the same case in up to eight earlier runs
  (of the same workflow when there are any): a new failure, a recovery, still failing, a flaky
  candidate (its result changed at least twice), new, or stable, with its history as a row of
  results and where it was read. The class chips filter the list, and a box filters it by the
  case's name. The history is a row of tiles, one per earlier run, oldest first, then this
  run ringed: a tick for passed, a cross for failed, a dash for not in that run, each with its
  run's name on hover, and a legend above the table.
- **Files**: every file the run's agents read or edited, with the agents, the edits that came
  back ok or failed, the reads and the commits on the branch that changed it. A file two agents
  edited is flagged as a possible collision, overlapping when their edits crossed in time: a risk
  signal, not proof that anything was lost. A file changed by a shell command has no edit to read
  and is not here. Choosing a file lists every event that named it.
- **Profile**: where the run's time went, as far as its transcripts can say: the wall clock,
  observed tool time (a call and its result both seen) and unobserved stretches of two minutes
  or more, never called idle; the phases in the order they started with the waits between them;
  each agent's span; the most agents at once; the ten longest calls; and the rework: commands
  retried after failing, files edited and tested in three cycles or more, test runs repeated
  before a pass.
- **Handoff**: the run against its workflow's completion criteria, each satisfied, unsatisfied
  or not observed with its evidence, a preview of the handoff report, and buttons to download it
  as Markdown or JSON. See below for the criteria.
- **Compare**: two runs side by side: status, time, agents, phases, tool calls, tokens, outcomes,
  the test cases whose result differs, the files only one touched and the commits. A figure
  measured differently in each (total against output tokens) is marked as not comparable. The
  runs related to the first are suggested, each with its reasons: the same workflow, title or
  branch, or most of the same files. A suggestion is an inference, not a claim.
- **Archive**: every run of the project, not only the twelve newest, 25 to a page and filtered by
  status. The search finds runs by anything they did: words that must all match, or
  `field:value` for `status`, `workflow`, `branch`, `agent`, `file`, `test`, `cmd`, `commit` or
  `error`. Each result shows the lines that matched. Choosing a run opens it in Live, older ones
  included.

The page polls every 2.5 seconds while it is visible and stops while its tab is hidden.

## Where the figures come from

| What | Read from |
| ---- | --------- |
| Projects | Each folder under `~/.claude/projects` that holds workflow runs, named after the folder its sessions ran in (the first `cwd` in its newest session transcript) |
| Open sessions | Claude Code's own registry, `~/.claude/sessions/<pid>.json`: the session, folder, name and the busy or idle status it writes for itself; a session counts as open only while `tasklist` (Windows) or a signal-0 probe finds its process, as a Claude Code image |
| Closed sessions | Session transcripts, `<project>/<session>.jsonl`, written in the last 24 hours, dated by the newest time inside them (a sync client can touch a file's modified time long after) |
| A session's activity | Its transcript: prompts and slash commands, replies, tool calls paired with their results, finished turns and their durations, messages sent mid-turn, task notifications, the title, the permission mode and the cost record |
| A session's subagents | `<session>/subagents/agent-<id>.meta.json` (description, type, model, finished) and each agent's transcript |
| Background commands | The launch message that opens a Bash or Workflow result ("Command running in background with ID", "Task ID"), finished by its task notification |
| A run's agents | `<session>/subagents/workflows/<run>/`: each agent's `.meta.json`, the run's `journal.jsonl`, and each agent's transcript |
| A finished run | Its saved record, `<session>/workflows/<run>.json`: status, phases, arguments, totals, duration |
| A resumed run | The same record, which Claude Code saves again with the resume as its start and totals for the resumed part only; the run's start is taken from its first agent, and its totals are summed from its transcripts once they are read |
| A running run's phases | The workflow script named by the session transcript's Workflow call, whose `meta` block is read without running it |
| Commits | `git log` in the repository the session ran in, through `execFile` with fixed arguments |
| Test ports | `netstat -ano`, filtered to the run's own port range (Windows only) |
| Test logs | The newest `.log` files in the run's scratch folder, the last 32 KB of each |
| The machine | Node's `os` module: CPU from the cores' times, free and total memory |

Transcripts are read incrementally: each poll reads only the bytes written since the last one,
so a 100 MB session transcript costs one scan when the service starts and a few kilobytes after
that. For the Live view a session transcript is parsed only on the lines that mention a workflow;
for the Sessions view every line is read except request bodies and attachments, which are
skipped before they are parsed, and a transcript over 16 MB is read from its last 16 MB, said to
be partial. The service keeps the last 200 actions of each agent it follows in memory and sends
the page 80.

## How sure a figure is

Each status and total says where it came from. Hover over it on the page; the API carries the
same record as `why`: the method, the source files, a sentence, and whether the picture is
complete.

| Method | Meaning |
| ------ | ------- |
| saved run record | Claude Code's own record of a finished run: its status, totals and phases |
| run journal | An agent's result line: the agent is done |
| tool result | A tool call's result in the transcript: ok or an error |
| inferred from recent activity | No record yet, and an agent wrote within 30 minutes: running |
| inferred from inactivity | No record, and nothing written for 30 minutes: unfinished, which does not mean failed |
| sum of the agents' transcripts | Totals added up from what has been read |
| newest Claude scratchpad, not tied to this run | Test logs from a folder the run does not name |

Counts keep attempts apart from outcomes:

- **Tool calls**: each call is paired with its result by id, so it is ok, failed, or still open.
- **Commits**: a `git commit` counts as tried when it is called and as confirmed only when git's
  summary line (`[branch 1a2b3c4] subject`) comes back. "Nothing to commit" counts as failed.
- **Test runs**: each test command's output is read for its outcome by narrow adapters: the
  house suites (`  ok   name`, ` FAIL  name`, `<n> passed, <m> failed`), TAP and node:test,
  pytest, Jest and Vitest, and Mocha. Output none of them recognises is counted as unread, not
  as passed.
- **Tokens**: a finished run's record gives total tokens (input, output and cache); a running
  run's figure is output tokens summed from its transcripts, and is labelled so.

## Completion criteria and handoff

What a finished run of a workflow must show is written down in a file per workflow, in
`criteria/<workflow>.json` in the state folder (see [State](#state)). `criteria` writes the
starter set there to edit:

```json
{ "version": 1, "workflow": "terrane-piece", "criteria": [
  { "id": "phases", "type": "phases-done", "label": "Every declared phase finished" },
  { "id": "tests", "type": "tests-pass", "label": "Tests ran, and no case is failing at the end" },
  { "id": "failures", "type": "no-unresolved-failures", "label": "Every failure was followed by a recovery" },
  { "id": "commit", "type": "commits", "min": 1, "label": "At least one confirmed commit" },
  { "id": "review", "type": "result-field", "field": "findings", "severity": "high", "max": 0, "label": "No high-severity findings left" },
  { "id": "docs", "type": "file-edited", "match": "README.md", "label": "The README was edited" },
  { "id": "reviewer", "type": "agent-done", "label": "review" }
] }
```

Each criterion is satisfied, unsatisfied or not observed; one with no evidence is never counted
as met. Until a workflow has a file, the Handoff view shows the starter set and says it is not
adopted. The report gathers the run, the criteria, the unresolved failures, the tests, the files
edited, the confirmed commits and what the agents left open, with the home folder written as `~`
and excerpts redacted. It is made only when asked for, and sent nowhere.

## Notices

While it runs, the service looks at every project's runs of the last six hours every 15 seconds,
whether or not a page is open, and raises a notice when:

- a run finishes, or ends as killed or unfinished;
- a tool call comes back as an error;
- a test run's output reports failures;
- an agent has written nothing for 10 minutes (`--quiet-alert` changes it; 0 turns it off), a
  notice inferred from inactivity and said to be.

The first look only learns where things stand, so starting the service raises nothing about the
past, and each notice comes once. The bell in the header counts the unread; its panel lists them,
filters them by kind, and opens each one's run, or its failure in Investigate. The project picker
marks projects with a run going or unread notices. Desktop notices come only after the panel's
button asks the browser and it agrees. The service keeps the last 200 notices in
`notices.json` in the state folder; `notices` lists them in the terminal. Watching only
reads: it never stops, restarts or reruns anything. `--no-watch` turns it off.

## The archive

The service keeps an index of every run of each project it shows, in
`archive/` in the state folder, one file per project. A finished run is read once, in 1 MB
steps with a pause after each, into an entry of its facts and the words worth searching: its
commands, the files its agents read or edited, its errors, its confirmed commits and its test
cases with their last result. A running run gets a light entry and is read in full once it
finishes. The service builds a project's archive a few seconds after first showing it and brings
it up to date at most once a minute; `index` does the same from the terminal.

A run whose files Claude Code has since deleted keeps its entry, marked unavailable: what was
read stays searchable, but agent-watch cannot bring back the transcripts themselves. Excerpts
are redacted before they are stored (secrets in `key=value` form, bearer tokens, long tokens,
and the home folder written as `~`).

## Security

- It listens on 127.0.0.1 and nowhere else.
- A request whose `Host` is not 127.0.0.1 or localhost on its own port is refused, so a web page
  cannot reach it through a renamed host.
- It answers GET, and one POST: `/api/stop`, which needs the token written to the state folder
  when the service started. `stop` sends that token; nothing stops it by process id.
- Its files are served from an allow list, never from a path in the URL.
- The page's Content Security Policy allows scripts from the service only. Fonts come from
  Google Fonts and the icons from jsdelivr, pinned by hash.
- Text from a transcript reaches the page as text, never as HTML.

Transcripts hold your prompts and the tools' output. The page shows them only to this machine.

## State

The state folder is `%LOCALAPPDATA%\agent-watch` on Windows and `~/.local/state/agent-watch`
elsewhere. It holds `state.json` (the background service's process id, port and stop token),
`agent-watch.log` (its output), `archive/` (the index of every run, one file per project),
`notices.json` (the last 200 notices) and `criteria/` (completion criteria, one file per
workflow). Nothing is written in the checkout.
`AGENT_WATCH_STATE` moves the folder. `AGENT_WATCH_INDEX_PAUSE` (milliseconds between runs, 60
unless set) and `AGENT_WATCH_READ_PAUSE` (milliseconds after each megabyte read for the archive,
4 unless set) slow the indexing further.

## Limits

- The transcripts, journals and records are Claude Code's own formats and are not documented.
  Anything the service cannot read is skipped, never guessed.
- A run that stopped without saving a record and has been quiet for 30 minutes reads as
  unfinished; an agent quiet for five minutes is marked quiet but still counted as running.
- The test ports need `netstat`, so they are listed on Windows only.
- A session started before Claude Code kept its registry is seen only through its transcript, as
  closed. Cost and lines changed are the last record Claude Code wrote, which it writes now and
  then rather than live, so they can trail the work; a resumed session counts from the resume.

## Files

| File | What it is |
| ---- | ---------- |
| `agent-watch.mjs` | The command line: serve, start, stop, status, sessions, projects, index, runs, search, notices, handoff, criteria |
| `lib/collect.mjs` | Assembles runs, agents, git, ports, logs and the machine into one state |
| `lib/read.mjs` | Reads JSONL a few new bytes at a time, and keeps the health register |
| `lib/claude.mjs` | Claude Code's files: transcripts into events and counts, Workflow calls, journals |
| `lib/tests.mjs` | Test output into named cases, one adapter per format, and their history |
| `lib/git.mjs` | git's answers: the trunk, the branch's commits and the files they changed |
| `lib/evidence.mjs` | Where a figure came from, and the redaction every excerpt passes through |
| `lib/archive.mjs` | The index of every run: built once, kept in the state folder, paged and searched |
| `lib/investigate.mjs` | A run's failures as incidents, and the evidence around one |
| `lib/timeline.mjs` | A run's events from every agent on one time axis, with ties and density |
| `lib/watch.mjs` | The watchpoints: every project looked at every 15 s, and the notices they raise |
| `lib/compare.mjs` | Test cases against earlier runs, two runs side by side, and related runs |
| `lib/files.mjs` | The files a run touched, who touched each, the commits, and the collisions |
| `lib/profile.mjs` | Where a run's time went, and the loops it repeated |
| `lib/handoff.mjs` | Completion criteria, their evaluation, and the handoff report |
| `lib/insights.mjs` | The run in focus as series to chart, and the project's runs as trends |
| `lib/sessions.mjs` | Every Claude Code session on the machine: the registry, the process check, a session's lines, its subagents and background commands, and what it is doing now |
| `lib/server.mjs` | The HTTP side: the page, `/api/state`, `/api/archive`, `/api/search`, `/api/incidents`, `/api/investigate`, `/api/timeline`, `/api/notices`, `/api/tests`, `/api/compare`, `/api/related`, `/api/files`, `/api/file`, `/api/profile`, `/api/handoff`, `/api/insights`, `/api/sessions`, `/api/projects`, `/api/health`, `/api/stop` |
| `web/` | The page: `index.html`, `app.css`, `favicon.svg`, the logo's master `assets/agent-watch-logo.svg` (the page inlines it), and its modules: `core.js` (shared), `chart.js` (the SVG charts), `app.js` (the views and Live), `sessions.js`, `insights.js`, `archive.js`, `investigate.js`, `timeline.js`, `notices.js`, `tests.js`, `files.js`, `compare.js`, `profile.js`, `handoff.js` |
| `logo-sync.mjs` | Remakes the page's logo and the favicon's figure from the master after it is edited in Inkscape; `--check` says whether they match it |
| `test_agent_watch.mjs` | The suite, against a fake projects folder it builds and removes |
| `package.json`, `package.metadata.md` | The manifest (no dependencies) and its header |
| `CHANGELOG.md` | What changed, release by release |
| `.gitignore`, `.gitattributes` | What git never takes (transcripts, secrets, state) and LF line endings |
| `LICENSE` | The Apache License 2.0 |

## Testing

`node test_agent_watch.mjs` (or `npm test`) builds a fake Claude projects folder
in the OS temp folder and checks the script reader, incremental reading, the collector's runs,
phases, agents, counts and feeds, the sessions reader (a fake registry and process list, prompts,
turns, background commands, subagents, the now line and the route), the server's guards and the
command line. It prints one line
per check and ends with `<n> passed, <m> failed`.

## License

agent-watch is released under the [Apache License 2.0](LICENSE).
