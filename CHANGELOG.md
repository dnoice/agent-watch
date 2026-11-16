<!--
✒ Metadata
    - Title: Agent Watch Changelog (dd1 Tools Edition - v1.12)
    - File Name: CHANGELOG.md
    - Relative Path: CHANGELOG.md
    - Artifact Type: docs
    - Version: 1.12.1
    - Date: 11/16/2026
    - Update: Monday, November 16, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5.5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Changelog:
    - 1.12.1 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.12.1, its own public repository.
    - 1.12.0 (11/16/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.12.0, the Sessions view.
    - 1.11.4 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.11.4, the cascade checked and tidied.
    - 1.11.3 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.11.3, the arrowheads under the name.
    - 1.11.2 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.11.2, Live moved right and the name's block.
    - 1.11.1 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.11.1, the history ring in the result's colour.
    - 1.11.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.11.0: Insights, the Timeline rework, dropdowns, Tests history and
      structure.
    - 1.10.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.10.0, the other eight views.
    - 1.9.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.9.0, the Live view card by card.
    - 1.8.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.8.0, the header from Dennis's review.
    - 1.7.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.7.0, Dennis's logo in the header.
    - 1.6.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.6.0, Stage F of the roadmap.
    - 1.5.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.5.0, Stage E of the roadmap.
    - 1.4.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.4.0, Stage D of the roadmap.
    - 1.3.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.3.0, Stage C of the roadmap.
    - 1.2.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.2.0, Stage B of the roadmap.
    - 1.1.0 (11/15/2026) [dendogg + Anthropic - Claude Opus 5.5] — Added
      1.1.0, Stage A of the audit's roadmap.
    - 1.0.0 (11/14/2026) [dendogg + Anthropic - Claude Opus 5.5] — First
      version, with the 1.0.0 release.

✒ Description:
    agent-watch's releases, newest first, each with what it changed and why.

✒ Key Features:
    - One section per release, its date month/day/year
    - The attribution tag first, then what changed and the figures measured
    - The long form; the code's headers keep their own short entries

✒ Other Important Information:
    - Dependencies: none
    - Compatible platforms: any Markdown viewer
-->

# agent-watch changelog

## 1.12.1 (11/16/2026)

[dendogg + Anthropic - Claude Opus 5.5] — agent-watch becomes its own repository, public at
github.com/dnoice/agent-watch under the Apache License 2.0, at Dennis's ask. Its history through
1.12.0 stays in the dd1 tools collection, where it was built; this repository starts here.

- **For anyone who clones it:** the README says what it needs (Node.js 20, Claude Code on the
  same machine) and how to get it, and runs every command through `node agent-watch.mjs`, with
  `digi` named as the collection's launcher. The state folder is given for every platform, and
  the criteria, notices and archive are placed in it rather than at a Windows path.
- **The repository's own files:** `.gitignore` keeps out Claude Code transcripts, secrets and
  machine-local settings, agent-watch's state should `AGENT_WATCH_STATE` point into the
  checkout, dependency trees and lockfiles, test output, Inkscape backups, and editor and OS
  leftovers. `.gitattributes` keeps every text file LF on any machine. `LICENSE` is the Apache
  License 2.0, and `package.json` names it with the repository, home page and issues.
- **Headers:** every Relative Path counts from this repository's root, as in every repository
  inside the collection, so `agent-watch/lib/sessions.mjs` reads `lib/sessions.mjs`. The entry
  point's examples name a generic project instead of a folder on Dennis's machine.
- Suite: 273 checks, all passing.

## 1.12.0 (11/16/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The Sessions view, at Dennis's ask: agent-watch now
follows everything Claude Code is doing on the machine while he works in the terminal, not only
workflow runs. It had also refused `--project` for a project with no run yet (K9 that morning).

- **Open sessions** come from Claude Code's own registry, `~/.claude/sessions/<pid>.json`, each
  checked against the process list so a reused pid does not count, with the busy or idle status
  Claude Code writes for itself. Closed sessions are the transcripts written in the last day,
  dated by the newest time inside them, since OneDrive touches file times.
- **A session read in full**: prompts and slash commands, replies, tool calls judged by the agent
  rules, finished turns with their durations and tool counts (a task notification that starts a
  turn names it), messages sent mid-turn, the title, the permission mode and the cost record,
  dated and said to trail the work, since Claude Code writes it now and then rather than live.
  Request bodies and attachments are skipped before parsing; a transcript over 16 MB is read
  from its last 16 MB and said to be partial.
- **Subagents** are lanes, from the session's subagents folder. **Background commands** and
  **workflows** are launched by the message that opens their result and finished by their
  notification; a launch message quoted inside other output (a grep through a transcript)
  launches nothing.
- **The now line** names the newest call without a result, the agent or workflow waited on,
  thinking, or waiting for you, and counts up. A call left without a result by an interrupt is
  not treated as running.
- **The page**: session cards across the top, the focused session's hero and facts, Activity
  with lanes, kind filters and one-turn narrowing, and side lists of agents, runs and background
  commands, turns, tools and cost. Following is the default; a workflow run opens in Live in its
  own project. One switch shows every active session's feed at once.
- **The command line**: `sessions` prints them; `status` adds the open sessions; `--project`
  takes a project that has sessions but no workflow run, whose Live view then says so instead of
  showing another project's.
- **Tests**: 30 new, against a fake registry, process list, transcript and subagent; 273 pass.

## 1.11.4 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The stylesheet's cascade, checked at Dennis's ask after
DevTools showed many rules struck out. The order of stylesheets was already right (fonts, the
icon sets, then `app.css` last). A scan in the browser took every rule and property on every
view, at 1600 and 1000 px and in both themes, and found which declaration wins on each element;
21 never won anywhere. Most are a base default that a state replaces, which is the cascade
working (Live before its first answer, a pending phase, a status with no colour of its own).
The rest were tidied:

- **Dropdown fallbacks** sit in `@supports not (appearance: base-select)`, so a browser that
  styles the list never sees them crossed out; the masthead no longer needs a rule to undo
  `appearance: none`, and three generic declarations every wrapper replaced are gone.
- **Activity's height and the feed's cap** are set per width range, not one value over another.
- **The notices panel** lays out as a column only while it is open.
- **Dead base values** removed: `.why`'s margin (every use sets its own) and the history tile's
  colours (every tile carries its result).
- **Tests:** the dropdown check now asserts the fallback is only for browsers that need it.

## 1.11.3 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — Dennis's idea: the gaps in the line under the name
carry the logo's flowchart arrowheads, CLAUDE ▸ CODE ▸ WORKFLOWS, so the spacing reads as
intended. The line is set to the name's measured width and its words and arrows spread evenly
across it (each word's trailing tracking taken back, so every arrow sits centred); the gaps and
arrows are sized in em, so a line made smaller to fit shrinks as one. The name is a size up, so
the line fits at its natural size and the name and line stand as tall as the logo beside them.

## 1.11.2 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The masthead, at Dennis's ask. Live stood beside the
name and ran past the line under it, which read awkwardly.

- **Live moves to the right**, first in the group with the CPU and memory meters, in their
  label-over-value rhythm: "Service" over a beating green dot, LIVE and the time of the last
  answer (red, Not answering, when it stops). The pill's border and wash are gone so its row
  matches theirs; the time keeps a fixed width so the group does not shift as it ticks.
- **The name and its line are one block.** The name is a little larger, and the line under it
  is tracked to the name's measured width once the fonts have loaded, so the two sit flush at
  both edges: letter-spacing fills a shorter line, a smaller size fits a longer one.

## 1.11.1 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The Tests history's tile for this run was ringed in
gold whatever its result, so a pass wore green inside gold, a pairing that read poorly on the
dark theme and blurred a success. At Dennis's ask the ring now takes the result's own colour:
green round a pass, red round a failure, the gap between tile and ring kept.

## 1.11.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — A new Insights tab, a reworked Timeline, dropdowns
that open as part of the page, the Tests history redone, and structure where text was dense:
each from Dennis's ask, built to the dataviz method (form first, colour last and validated).

- **Insights.** Charts in two scopes. This run: six headline figures; what it did over time,
  stacked by kind with its phases in a strip above and errors as red dots; agents at work over
  time; tool calls by agent and by what came back; how long the calls took; cases in each test
  run; output tokens by agent; the files touched most. Every run: wall time, tool calls, tokens,
  test runs, errors and commits per run, oldest first; a column opens its run. The server does
  the arithmetic (`lib/insights.mjs`, `/api/insights`); the page draws SVG with no library
  (`web/chart.js`).
- **Colour, validated.** Event kinds take the validated categorical palette's first six slots
  in their validated order, checked with the palette validator against both themes' cards:
  all pass in Sentinel; in Parchment three slots sit under 3:1, so every chart carries a legend
  and a table view. Pass and fail use the page's status green and red, since there the colour
  means the result; errors are a different mark (a dot), not a seventh colour.
- **Every chart:** thin columns and bars with a 4 px rounded data end and a 2 px gap between
  stacked parts, hairline gridlines on clean ticks (a count never steps by a fraction), a
  tooltip on hover with the column dimmed around it, arrow keys through the columns, and a
  Table toggle that shows the same numbers.
- **Timeline.** A time axis with gridlines through every lane; each agent's working life as a
  faint band; a tool call long enough to see drawn as a bar as long as it took; kinds in the
  Insights colours, the kind chips their legend; zoom by dragging across the axis, clicking a
  phase, or the zoom buttons, with the Activity row always showing the whole run and the window
  on it; a tooltip on every mark; the controls in labelled groups; the explanation as a closed
  list.
- **Dropdowns.** Every select opens its list in the card's colours with a hover wash and the
  chosen row in gold with its check (Chrome's customizable select), the masthead's project
  included; elsewhere the closed control matches and the options keep the theme.
- **Tests history.** A tile per earlier run, oldest first, then this run ringed: a tick,
  a cross or a dash as well as the tint, room around each, the run's name and date on hover,
  and a legend above the table.
- **Structure.** Handoff's evidence is a summary line over a list of three, the rest behind
  "N more"; lists travel from the server as lists, so a case name holding a "; " stays whole.
  Files' and Investigate's explanations are closed "How to read this" lists; Investigate's
  sections are set off by rules.
- **Colours in one place.** The masthead's and the notices' colours, written as literals until
  now, are tokens in the theme block; the suite checks no colour is written anywhere else.
- **Tests: 240 checks.** New: the run series (buckets, concurrency, duration bands, files) and
  the project trends, `/api/insights`, structured evidence, no colour outside the theme blocks,
  and the dropdown rule that lets the masthead's list open.

## 1.10.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The other eight views, element by element, after the
Live view: the same pass Dennis asked for, checked against the terrane project's runs.

- **Every view but Live sat in two-thirds of the page.** The one-column rule came before the
  Live grid in the stylesheet and lost to it, so Investigate, Timeline, Tests, Files, Profile,
  Handoff, Compare and Archive drew in the left column with an empty 380 px column beside them.
  The rule now outranks the grid, and the suite checks it does. A scan of every element's
  classes in every view found two more rules lost the same way: the Agent card's result block
  shared a class with the Tests view's pass/fail pill and pushed every pill 12 px down, and
  Profile's six figures sat three across. Both are fixed; what the scan found besides was
  intended, a modifier after its base.
- **A resumed run kept its start.** Claude Code saves a resumed run again with the resume as
  its start and totals for the resumed part only, so a seven-hour terrane run read as fourteen
  minutes and 92 tool calls. A run starts when its first agent did, the Started cell names the
  resume, and the status sentence says the run was resumed. With the transcripts read, its
  totals are summed from them; without them, the record's figures are marked partial. The
  archive index is rebuilt once (index version 2), so its entries carry the same starts,
  totals and numbered agents.
- **Investigate** lists each incident by the description the agent gave its command, not the
  raw command, clamped to three lines with the command in the tooltip; the detail is headed
  the same way, with the exact command in a code block beneath. The transcript reference no
  longer breaks mid-word.
- **Timeline** dates the end of a run that crossed midnight.
- **Tests:** the class chips look like the filters they are, with a hover and a ring on the
  chosen one, and a box filters the cases by name ("62 of 282 named cases").
- **Files, Runs and Archive:** numeric columns' headings are right-aligned over their figures,
  and Files' "Edits ok" is "Edits", with what it counts in its tooltip.
- **Profile:** a retried command shows two lines, the whole of it on hover.
- **Tests: 227 checks.** Two new: a one-column view outranks the Live grid, and a resumed run
  starts with its first agent, says it was resumed and calls the record's totals partial.

## 1.9.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The Live view, card by card, after the header: the
same element-by-element pass Dennis asked for, checked against the terrane project's runs.

- **The run's figures** sat in a wrapping row whose second line did not line up with the first.
  They are a panel of aligned cells now; a figure too long for one cell (the branch with its
  base, the test tally) takes two.
- **The status sentence** repeated itself ("saved run record. "killed" as Claude Code saved it
  in the run's record"). It reads "Status from the saved run record: Claude Code saved the run
  as "killed"." with an icon, and every tooltip built from a figure's source reads the same
  way: an inference says "Inferred from recent activity." rather than "From the inferred from
  recent activity (inferred)."
- **The eyebrow** names the workflow alone; the project is in the masthead.
- **Agents with one description.** A docs step run twice showed two tabs both called
  `docs:terrain2`, and the rail listed the name twice. The collector numbers the later ones in
  the order they started (`docs:terrain2 #2`), so every view tells them apart.
- **Activity's agent tabs** wrapped beside the card's title; they have a row of their own, and
  the head counts the agents done and running.
- **The feed fills its card.** Beside the side column the Activity card was as tall as the
  column, about 1,450 px on a wide screen, while its feed stopped at 640 px. The feed now takes
  the card's height and scrolls inside it; on a narrow screen it keeps its cap.
- **Only a new event flashes.** Every redraw rebuilt the feed and flashed the newest row gold,
  whether or not it was new; now only an event that was not there at the last redraw does.
- **Branch:** each commit's hash was a grey chip stretched to its row's full height; it is a
  chip the height of its text.
- **Tests:** a FAIL line can be a whole JSON dump; it shows three lines, the rest on hover.
- **The status bar** sits in the cards' column, like the header.
- **Tests: 225 checks.** Two new: agents under one description are numbered, and a run's status
  sentence does not repeat its source.

## 1.8.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The header, reworked from Dennis's review of it: in
Inkscape he marked five areas on a screenshot of the running page and wrote what each needed.
Each change below answers one of his notes.

- **One column.** The header's contents and the view tabs sat at the window's edges while the
  cards sat in a centred column, so on a wide screen the brand, the tabs, the run's title and
  the machine's meters each stood apart from the page. They now share the cards' width and
  gutter: the logo, the first tab and the cards start on one line, and the meters, the bell,
  the run's title and the cards end on another. The suite checks the three keep one width.
- **Live, beside the name.** The tagline's "live" became the service's state: a pill next to
  "Agent Watch" with a green dot beating while it answers and the time of its last answer, red
  as Not answering when it stops. It replaces the clock that stood alone at the right.
- **The logo stays alive.** The paths rest in the header's light slate and the arrowheads in
  parchment, brighter than the dim slate they faded back to, and the gold wave now runs
  outward continuously while the page is in view, several bands lit at once.
- **The project, part of the masthead.** The picker was a boxed field beside the brand; it is
  now a label over the project's name in the heading face, set off from the brand by a rule.
- **The machine, in the same rhythm.** CPU and memory read label over value, like the project,
  with a rule before the notices bell and the theme switch.
- **The header and tabs scroll as one.** The tab bar was pinned 53 px from the top, which the
  taller logo of 1.7.0 overran by 16 px; both now sit in one sticky block.
- **Tests: 223 checks.** Two new: the header, the tabs and the page share one column, and Live
  sits beside the name with the time of the last answer.

## 1.7.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — Dennis's logo, drawn by him in Inkscape, takes the
header's place of the binoculars icon. The drawing is his; the recolouring, the page copy, the
favicon and the motion are this release's.

- **The master, recoloured.** `web/assets/agent-watch-logo.svg` keeps every shape as drawn and
  takes the Fire Watch palette: the suit in gold `#C9A84C`, visor and cuffs in navy `#1B2A4A`,
  the eyes in parchment `#F5F0E8`, and the dashed paths and arrows in slate `#2A3D5F`. Each
  shape carries a class for its part (`aw-suit`, `aw-visor`, `aw-cuff`, `aw-eye`, `aw-flow`,
  `aw-arrow`) and, for the paths, its distance band from the figure (`aw-f0` nearest to `aw-f9`
  the far arrows). It carries the house SVG metadata: the header, a title, labels on its groups
  and the Dublin Core block.
- **In the page.** The header inlines the master between two markers, made from it and not
  edited by hand, so the stylesheet can colour the parts for the navy header: the suit in the
  header's gold, the visor near-black, the paths in slate. A gold pulse runs outward along the
  paths band by band every few seconds, and the eyes blink now and then. The page's
  reduced-motion rule stops both.
- **The favicon** is the figure alone on the header's navy tile, drawn from the same shapes.
- **`logo-sync.mjs`** remakes both copies from the master, reading the parts from its classes
  and keeping its groups and paint order, so a drawing edited in Inkscape reaches the page with
  one command. It refuses a shape no class names rather than guess what part it is, and
  `--check` changes nothing and exits 1 when either copy is stale.
- **Tests: 221 checks.** Six new: the page's copy is the master shape for shape and class for
  class, in the master's paint order; the favicon's shapes are the master's figure; the
  stylesheet colours every part; and `logo-sync.mjs` finds both copies current, keeps groups,
  transforms and paint order, and refuses an unnamed shape.


[dendogg + Anthropic - Claude Opus 5.5] — Stage F of the roadmap, its last: evidence-based
completion and handoff (R10), and the workflow critical-path and rework profiler (R09).

- **Completion criteria, written down.** What a finished run of a workflow must show lives in a
  file per workflow in `%LOCALAPPDATA%\agent-watch\criteria`, because the workflows themselves do
  not declare it. Seven kinds: every phase done, tests pass with no case failing at the end, no
  unresolved failure, at least so many confirmed commits, a field of the agents' results within
  a limit (such as no high-severity findings), a file edited, an agent done. Each is satisfied,
  unsatisfied or not observed, with the evidence; a criterion with no evidence is never counted
  as met. Until a workflow has a file, a starter set is shown and labelled as not adopted;
  `criteria` writes it out for editing. A file that cannot be read says why.
- **The handoff report.** The run, the criteria and their states, the phases, the unresolved
  failures, the tests, the files edited, the confirmed commits, and what the agents left open
  (deferred, risks, unverified, problems), as Markdown with dates month/day/year or as JSON. Paths
  have the home folder written as `~`, excerpts are redacted. It is made only when asked for:
  the Handoff view's download buttons, or `handoff` in the terminal (`--format`, `--out`). It
  approves nothing and sends nothing.
- **The profile.** Where a run's time went, as far as its transcripts can say. Three kinds of
  time are kept apart: the wall clock, observed tool time (a call and its result both seen), and
  unobserved stretches of two minutes or more in which no agent wrote a line, whose cause is not
  known. The time between an agent's lines is the model working, and is never called idle. The
  phases in the order they started, with the waits between them, are the longest chain that can
  be seen, not a proven critical path. The most agents working at once, the ten longest calls,
  and the rework: commands retried after failing, files edited and tested in three cycles or more,
  test runs repeated before a pass.
- **The page.** The Profile and Handoff views. A phase bar in the profile opens the timeline; a
  retry opens Investigate. The tab bar, now ten views wide, scrolls without a scrollbar on a
  narrow window, and the run's name beside it gives way under 1,280 pixels.
- **The command line.** `handoff` (`--run`, `--format md|json`, `--out`) and `criteria`
  (`--workflow`).
- **The server.** `/api/profile` and `/api/handoff`, which downloads the report as
  `handoff-<run>-<date>.md` or `.json` with `format`.

Checked in the browser on a real run of 33 minutes: the profile gave 19 minutes of tool time,
6 minutes unobserved, six agents at once at most and one retry, and the handoff showed the
starter set, one criterion satisfied, two unsatisfied, two not observed. The suite has 215 checks,
all passing.

## 1.5.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — Stage E of the roadmap: test regression intelligence
(R06), run lineage and comparison (R05), and change provenance with collision detection (R08).

- **Test cases with a history.** A run's named cases come from its test commands' output, its own
  scratch logs, and the tests its workflow's result reported, each with where it was read; the
  last result of a case wins, and a case that changed result within the run says so. Each case is
  set against the same case in up to eight earlier runs, those of the same workflow when any have
  cases: a new failure, a recovery, still failing, a flaky candidate (its result changed at least
  twice: worth a look, not a diagnosis), new, or stable. The archive keeps every run's cases, so
  the history reaches past the twelve newest runs.
- **Two runs side by side.** Status, time, agents, phases, tool calls, tokens, the outcomes,
  every test case whose result differs, the files only one run touched, and the confirmed
  commits. A figure measured differently in each run is marked as not comparable rather than
  subtracted: total tokens from a saved record against output tokens summed from transcripts,
  or a count not yet read for one of them.
- **Related runs.** For any run, the runs that share its workflow, its title, its branch, or
  most of its files, each reason listed. Every suggestion is an inference; none claims that one
  run continued another. On a real project the first suggestion was the same workflow's earlier
  attempt, killed after 30 seconds.
- **Files.** Every file a run's agents read or edited through the edit and read tools: which
  agents, how many edits came back ok or failed, how many reads, and which commits on the run's
  branch changed it (matched by the end of the path). Paths are compared without regard to case
  or slash direction on Windows. A file two agents edited is a possible collision, and an
  overlapping one when their edits crossed in time: a risk signal, not proof that anything was
  lost. A file changed by a shell command has no edit to read, and the view says so. Choosing a
  file lists every event that named it.
- **The page.** Three views: Tests, Files and Compare, which keeps both runs in the address.
- **The server.** `/api/tests`, `/api/compare`, `/api/related`, `/api/files` and `/api/file`. A
  run the archive has not read in full is compared from its transcripts read now.

Checked in the browser on a real project: Compare, Files and Tests drew without a console error,
and the Files table was given the wide side of its split. The suite has 191 checks, all passing.

## 1.4.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — Stage D of the roadmap: the unified cross-agent
timeline and replay (R04), and operational watchpoints with multi-project attention (R07).

- **The timeline.** Every agent of a run in its own lane on one time axis, each event a mark at
  the moment its transcript line was written, the phases as bands above and an overview of where
  the run was busy, failures marked in red. Events are ordered by time, then agent, then the
  order read; two agents' events in the same millisecond are marked as ties, since their order
  cannot be known, and events without a time are counted rather than placed. A long run is sent
  in parts (1,500 events unless asked otherwise) and says so.
- **Replay.** A playhead to drag, step, or play at 1×, 2× or 5×, with jumps to the next failure
  and the next failing test. The event under it is shown with every agent's events just before
  and after it. Replay steps through what was recorded; nothing is run again. Kind filters, and a
  lane's label hides or shows it. A phase in the Live rail opens the timeline at its start;
  Investigate shows a failure on the timeline; the timeline opens a failure in Investigate.
- **Watchpoints.** While it runs, the service looks at every project's runs of the last six hours
  every 15 seconds, whether or not a page is open, and raises a notice when a run finishes or
  ends, a call comes back as an error, a test run reports failures, or an agent goes quiet (10
  minutes unless `--quiet-alert` says otherwise; 0 turns it off). The first look only learns
  where things stand, so starting the service raises nothing about the past. Each notice comes
  once, names its run, agent and event, and says whether it was observed or inferred. The last
  200 are kept in `%LOCALAPPDATA%\agent-watch\notices.json`. It only reads: it never stops,
  restarts or reruns anything. `--no-watch` turns it off.
- **Attention.** A bell in the header counts the unread notices; its panel lists them, filters
  them by kind, and opens each one's run, or its failure in Investigate. The project picker marks
  projects with a run going and unread notices. Desktop notices only after the panel's button
  asks the browser and it agrees; then new notices are checked every 15 seconds even while the
  tab is hidden.
- **The command line.** `notices` lists them from the running service, or from the file kept
  since it last ran. `start` and `serve` take `--quiet-alert <minutes>` and `--no-watch`.
- **The server.** `/api/timeline` (window, kinds, limit) and `/api/notices`; `/api/state` carries
  each project's attention and the newest notice's time.
- **A fix found on the way.** One check failed about one run in three: a transcript replaced by
  another file was sometimes read on from where the old one ended. Node gives NTFS's 64-bit
  file ids as a number, and two files made in the same millisecond could round to the same id.
  The reader now also keeps a file's first 64 bytes and starts again from the top when they
  change, which catches a file rewritten in place as well (`lib/read.mjs` 1.0.1). Four runs in a
  row passed after it.

Checked in the browser on a real run of eleven agents and 318 events: the lanes, phases and
overview drew, Next failure moved to the right event, and the notices panel opened, all without a
console error. The suite has 163 checks, all passing.

## 1.3.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — Stage C of the roadmap: the Failure Investigation
Workbench (R01), built on the paired calls and results of Stage A and the archive of Stage B.

- **Incidents.** Every failure of a run in one list: a tool call that came back as an error, a
  test run whose output reports failures, a commit that did not happen, a failing log in the
  run's own scratch folder, and a failing test the workflow's result reports. Retries of the same
  command by the same agent fold into one incident, counted. The unresolved come first.
- **Recovery, said for what it is.** The strongest evidence first: the same command later came
  back ok (direct); a later test run in the same agent passed; a later test run by another agent
  passed. The last two are labelled a correlation in time, not a proven fix. A failure nothing
  answered is unresolved.
- **The evidence around one.** The failing call with its tool, time, duration and both transcript
  lines (the call's and its result's); what came back, as text; the agent's ten steps before and
  after; every other agent's events within two minutes; the files the agent edited in the fifteen
  steps before; the test runs after it.
- **The page.** A new Investigate view, its list beside the chosen incident, which the address
  keeps. Every failure in the Live feed has an Investigate button that opens it there.
- **The server.** `/api/incidents` and `/api/investigate`, for a run or the project's current
  one; an event id of the wrong form is refused with 400 and an unknown one gives 404. Opening a
  run's deeper views reads its transcripts in small steps first, so a large finished run does not
  hold the service up.
- **Polish.** A `StructuredOutput` call, an agent's final result, reads as "The agent's
  structured result" with its first keys, not as a wall of JSON. Checking the view in a browser
  found another bare null printed as "null"; the page now fills elements through `fill()`, which
  leaves empties out, and the suite refuses any fill that could hand one over.

Measured read-only on a real project: three runs gave six, four and two incidents, one with
direct recovery, each opened in a few milliseconds once its run was read. The suite has 134
checks, all passing.

## 1.2.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — Stage B of the roadmap: the complete run archive and
evidence search (R03).

- **An archive of every run.** The live page lists the twelve newest runs; a project can hold
  many more. Each finished run is now read once, in 1 MB steps with a pause after each, into a
  compact entry: title, workflow, status, times, totals and outcomes, branch, agents, phases,
  confirmed commits, the files read or edited, the commands run, the errors, and every named
  test case with its last result and where it was read (a tool result, the run's scratch logs,
  or the tests the workflow's own result reported). A running run gets a light entry, refreshed
  as it runs, and is read in full once it has finished.
- **Where it is kept.** One file per project under `%LOCALAPPDATA%\agent-watch\archive`, written
  whole and swapped in, versioned so a new format rebuilds itself. A run whose files have gone
  keeps its entry, marked unavailable: agent-watch cannot bring back what Claude Code deleted,
  but what it read stays searchable. The transcripts are read again only when a run changes.
- **When it is built.** The service builds a project's archive in the background a few seconds
  after the project is first shown, and brings it up to date at most once a minute. Nothing is
  read for the archive during a live poll.
- **Search.** Every word given must match; `field:value` narrows by `status`, `workflow`,
  `branch`, `agent`, `file`, `test`, `cmd`, `commit` or `error`. Each result shows the lines that
  matched.
- **The page.** A tab bar: Live and the new Archive view, which pages every run, filters by
  status, searches, and opens any run in Live, older ones included. The address keeps the view,
  the run and the agent, so a link opens the same place. The Runs card says how many runs there
  are and opens the archive. The page's script is now ES modules: `core.js` (shared), `app.js`
  (the views and Live), `archive.js`.
- **The command line.** `index` builds or brings the archive up to date, `runs` lists it
  (`--status`, `--lines`), and `search <words>` searches it. `--project` also takes a project's
  folder name, such as `terrane`.
- **The server.** `/api/archive` and `/api/search`; `/api/state` carries the archive's status.
  The page's files are listed once at start from `web/`, so a new module needs no hand-made
  entry; a URL is still only looked up in that list. A `run` that is not of the `wf_` form is
  refused before anything is read.
- **Fixes found on the way.** The archive asked the collector for its run list, which is cached
  for two seconds, so a run deleted a moment ago still looked present; it now asks for a fresh
  list. Checking the page in a browser found two more: the status pill of every finished run
  read "nullcompleted" (since 1.0.0, a null handed to the element as text), and a view's
  `hidden` was overridden by its own grid layout. Both are fixed, and the suite now checks for
  them.

Measured read-only on a real project of five runs: indexed in a few seconds into 314 KB, about
60 KB a run; checked in the browser, Live and the Archive drew without a console error. The
suite has 114 checks, all passing.

## 1.1.0 (11/15/2026)

[dendogg + Anthropic - Claude Opus 5.5] — Stage A of the audit and roadmap Dennis brought
(`AGENT_WATCH_AUDIT_AND_DEVELOPMENT_ROADMAP.md`): evidence that says where it came from (R02),
and the parsing and metric fixes the audit found, before anything is built on them.

- **Tool calls paired with their results.** A call is matched to its result by id, so each one
  is ok, failed, or still open, with its duration and the transcript lines it came from. The
  audit's F02: a `git commit` used to count as a commit the moment it was called; it now counts
  as tried, and as confirmed only when git's own summary line comes back. "Nothing to commit"
  counts as failed.
- **Test outcomes.** Each test command's output is read for passed, failed and skipped cases by
  one narrow adapter per format: the house suites, TAP and node:test, pytest, Jest and Vitest,
  and Mocha. Output none of them knows is counted as unread rather than as a pass. The scratch
  logs are read by the same adapters.
- **Where each figure came from.** A run's status, an agent's status and the run's totals carry
  a record of their source and method. A status inferred from activity or inactivity says so
  (F05): an unfinished run is one with no record that went quiet, which does not mean it failed.
  Tokens are labelled total (from the saved record) or output (summed from transcripts), so the
  two are no longer compared as one figure (F03).
- **Test logs attributed.** A run that names no scratch folder used to be shown the newest Claude
  scratchpad's logs as its own (F04). They are still shown, under a warning that they are not
  tied to the run.
- **Runs older than the twelve shown.** A run asked for by id is described in full even when it
  is older than the twelve the live state lists (F01); the state says how many runs there are.
- **Reading.** A character split across two 4 MB chunks used to decode as replacement characters
  (F06); the reader now decodes across the boundary. A transcript replaced by another file is
  read again from its first line. Every unreadable file and malformed line is counted in a
  health register shown in the status bar, instead of being skipped silently (F10). Projects
  and journals are cached, and agent states nobody has looked at for ten minutes are let go
  (F09).
- **The page.** A newer poll cancels one still in flight, and an older answer is dropped, so a
  slow answer for the run left behind cannot overwrite the run just chosen (F07). The trunk is
  named for what it is, `main`, `master` or the checked-out branch (F12). The README no longer
  says the chosen agent is kept in the browser; it never was (F11).
- **Layout.** The collector's reading and parsing moved into `lib/read.mjs`, `lib/claude.mjs`,
  `lib/tests.mjs`, `lib/git.mjs` and `lib/evidence.mjs`; `lib/collect.mjs` assembles them.

Measured read-only on a real project of five runs: the first state took 0.6 s and the next 5 ms,
a 139 KB answer, with every one of the 468 tool calls paired with its result. The suite has 78
checks, all passing.

## 1.0.0 (11/14/2026)

[dendogg + Anthropic - Claude Opus 5.5] — The first release, asked for by Dennis as a page that
follows the progress of Claude Code's workflow runs and their agents, and as a proper tool of
the collection rather than a one-off.

- A command line with `serve`, `start`, `stop`, `status` and `projects`. The background service
  is stopped by a token kept in `%LOCALAPPDATA%\agent-watch`, never by a process id.
- A collector that reads runs, agents, transcripts, saved records, workflow scripts, git, the
  test ports and test logs, and the machine's load. Transcripts are read incrementally; a
  session transcript is parsed only on its workflow lines; a script's `meta` block is read with
  a small scanner, never run.
- A page in the Fire Watch design system, Parchment and Sentinel, with the run's phase rail,
  each agent's actions, the agent's counts, the branch's commits, the test logs and ports, and
  every run of the project.
- A server on 127.0.0.1 that checks the Host header, answers GET only besides the stop route,
  serves its files from an allow list, and sends no stack traces.
- A suite of 46 checks against a fake projects folder.
- Measured on the terrane project, eleven runs and a 107 MB session transcript: the first state
  in 0.8 s, then about 50 ms a poll.
