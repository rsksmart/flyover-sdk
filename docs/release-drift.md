# Release Branch Drift Detection

Scheduled CI job that flags commits which landed on an older release branch but
were never carried forward to newer ones (or to trunk).

The job is **detection-only**. No branches are modified. The output is a
markdown report kept as a workflow artifact.

This workflow was first introduced in the `liquidity-provider-server` repo
([FLY-2292][lps-jira]) and adopted here for the Flyover SDK under
[FLY-2355][jira]. It is phase 1 of a planned three-phase rollout.

## What it does

For every adjacent pair of release branches (sorted by semver) **and** for
every release branch against trunk, the script lists commits present on the
older side but missing from the newer side. Patch-id matching is used (via
`git log --cherry-pick`) so cherry-picked backports with different SHAs are
not flagged.

The trunk comparisons can be narrowed to just "newest release vs trunk" by
setting `COMPARE_ALL_VS_TRUNK=0` if the broader output is noisy.

Two extra filters run on top of the patch-id check:

- Commits whose subject starts with `Revert "` are dropped (the revert itself
  is not interesting drift).
- Commits that are reverted later on the same older branch — detected by a
  matching `This reverts commit <sha>` line in a later commit on that branch —
  are dropped.

## How this maps onto the SDK release model

The SDK currently releases from **one transient staging branch at a time**
(`version-X.Y.Z`, e.g. `version-1.9.1`; older tags also used the `vX.Y.Z`
form). Feature branches target that staging branch, which is then merged
**forward into `main`** via a "Version X.Y.Z → main" PR and deleted. Release
tags (`vX.Y.Z`) are cut off `main` and trigger `publish_npm.yml`.

Two consequences worth knowing when reading a report:

- While a `version-*` staging branch is open it is **expected** to be ahead of
  `main` — those in-flight commits will show up in the **vs-trunk** section.
  That is normal staging, not a problem. The signal to act on is a commit that
  stays on a release branch and is *never* merged forward (the FLY-2292
  scenario), which becomes unambiguous once the branch should have merged.
- Because staging branches are short-lived, drift is only visible while the
  branch exists. The schedule is intentionally frequent (weekly) and you can
  always trigger a run manually while a release branch is open.

## Files

- `scripts/check-release-drift.mjs` — the detector. Self-contained Node
  script; only needs `git` and Node 20+. No npm dependencies. Copied verbatim
  from the upstream `liquidity-provider-server` implementation so the two stay
  in sync — per-repo configuration lives in the workflow, not the script.
- `.github/workflows/release-drift.yml` — scheduled + manual workflow. Runs the
  script and uploads `drift-report.md` + `merge-status.json` as the
  `release-drift-report` artifact.

## Configuration

All knobs are environment variables on the script. The defaults below are the
upstream script defaults; this repo's workflow **overrides** the branch
pattern and trunk (see the "Value in this repo" column).

| Variable | Script default | Value in this repo | What it does |
| --- | --- | --- | --- |
| `RELEASE_BRANCH_PATTERN` | `v[0-9]*.[0-9]*.[0-9]*` | `v*.[0-9]*.[0-9]*` | Git glob used against `refs/remotes/$REMOTE/`. The broader glob matches both the `version-X.Y.Z` and `vX.Y.Z` naming the SDK has used. |
| `RELEASE_TAG_PATTERN` | `v[0-9]*` | `v[0-9]*` | Git glob for release tags. Drives the "Released in" column and each branch's "Latest release". |
| `TRUNK_BRANCH` | `master` | `main` | Trunk to compare release branches against. If absent on the remote, trunk comparisons are skipped. |
| `REMOTE` | `origin` | `origin` | Remote name to query. |
| `REPORT_FILE` | `drift-report.md` | `drift-report.md` | Markdown report output path. |
| `MERGE_STATUS_FILE` | `merge-status.json` | `merge-status.json` | Machine-readable mergeability output path. |
| `COMPARE_ALL_VS_TRUNK` | `1` | `1` | When `1`, every release branch is compared against trunk in addition to adjacent-pair comparisons. When `0`, only the newest release is compared against trunk. |
| `EXIT_NONZERO_ON_DRIFT` | `0` | `0` | Set to `1` to make the workflow fail (exit 2) when drift is found. Default is to always succeed — drift is reported, not enforced. |

In the GitHub workflow, `RELEASE_BRANCH_PATTERN` and `TRUNK_BRANCH` are also
exposed as `workflow_dispatch` inputs so you can override them ad hoc.

## How to read the report

The report has six sections:

1. **Configuration** — every knob the script used (pattern, trunk, scope, etc.).
2. **Summary** — total drifted commits, pairs with drift, **released vs
   unreleased** counts, and oldest / newest drifting commit dates.
3. **Release branches** — semver-sorted, with the **Latest release** tag
   reachable from each branch tip (linked to the GitHub release page). The
   release marked **★ latest** is whichever GitHub considers the current
   "latest" release, as reported by `gh release list`.
4. **Top contributors to drift** — global authors rolled up across all pairs.
5. **Merge feasibility** — for each pair, whether the forward-merge would
   apply cleanly. See [Merge feasibility](#merge-feasibility) below.
6. **Findings by branch pair**, split into two subsections:
    - **Adjacent release pairs** — older release → next release.
    - **Release branches vs trunk** — every release branch (or just the newest
      depending on `COMPARE_ALL_VS_TRUNK`) compared against trunk.

   Each pair links to a GitHub compare view and, when drift exists, includes a
   commit table with **SHA, date, author, PR (if extractable from the
   subject), Released in tag, and subject**. The "Released in" column shows
   the earliest release tag whose history contains the commit, or
   `_unreleased_` when no tag contains it yet.

The CI job also writes the report to the GitHub Actions job summary, so you
can read it without downloading the artifact.

### Merge feasibility

For every branch pair the report also includes a virtual forward-merge result,
answering: **if you tried to merge `older` into `newer` right now, would it
apply cleanly?** This uses `git merge-tree`, which performs the merge in
memory — no branches, refs, or working trees are touched.

The markdown table shows, per pair:

- **✅ clean** — the forward-merge would apply without conflicts.
- **⚠️ N conflict(s)** — followed by the first 5 conflicting paths
  (more are summarised as _"and N more"_).
- **❔ unknown** — the merge probe failed (e.g. no common ancestor, or git
  too old; see below). The reason is shown inline.

The same data is emitted in machine-readable form as `merge-status.json`
(uploaded as part of the `release-drift-report` artifact alongside the
markdown). Shape:

```json
{
  "generated_at": "2026-05-14T22:57:21Z",
  "summary": { "total_pairs": 7, "clean": 6, "conflicting": 1, "unknown": 0 },
  "pairs": [
    {
      "older": "version-1.9.1",
      "newer": "main",
      "kind": "trunk",
      "clean": false,
      "conflicts": [".github/copilot-instructions.md", "..."]
    }
  ]
}
```

#### Git version

Modern `git merge-tree --write-tree` (Git ≥ 2.38) is used when available; it
returns conflicting paths directly. On older git, the script falls back to
the legacy 3-arg form and parses its output for conflict markers inside
`changed in both` / `added in both` sections. Both code paths produce the
same JSON shape. The CI runner (`ubuntu-latest`) has Git ≥ 2.43, so the
modern path is taken there.

### Release tag markers

When the workflow runs in CI (or locally with an authenticated `gh` CLI), the
script enriches release tags with GitHub Release metadata:

- **★ latest** — the GitHub Release marked as "Latest".
- **(pre)** — flagged as a pre-release on GitHub.

### What if I don't have `gh` access?

The `gh` CLI is **optional**. The script auto-detects whether it can use it
and falls back cleanly when it can't. Three things can go wrong:

| Situation | What the script does |
|---|---|
| `gh` not on PATH | Logs `gh CLI unavailable or unauthenticated — tag-only release info`, skips the enrichment step. |
| `gh` installed but not authenticated (`gh auth status` fails) | Same — silent fallback to tag-only mode. |
| `gh release list` fails (network / auth / API error) | Logs a warning, continues without release markers. |

In every fallback path you still get:

- The **Released in** column (computed from local git tags via `git tag --contains`).
- The **Latest release** column for each branch (computed from `git tag --merged`).
- Clickable links to each tag's GitHub release page (just URL templating — no API needed).

What you lose without `gh`: only the **★ latest** and **(pre)** marker
decorations on those tag links. The data itself is unchanged.

In the CI workflow, `gh` is preinstalled on `ubuntu-latest` runners and
authenticated via `GITHUB_TOKEN` (already provided to the workflow), so
enrichment Just Works. For local runs without `gh`, simply
`brew install gh && gh auth login` if you want the markers, otherwise skip
it.

## Running on PRs

The workflow also fires on `pull_request` events with `types: [opened]` —
meaning every time a PR is opened, the drift report is generated once.
Subsequent pushes to the PR do **not** re-run the check (use a manual
dispatch or wait for the Monday schedule if you want a refresh).

The report appears under the PR's **Checks** tab as a Job Summary and as the
`release-drift-report` artifact, identical to a scheduled run.

Scheduled (Monday) and manual-dispatch runs are unaffected — they always run.

## Running locally

From a clone with all release branches available:

```bash
git fetch --prune origin
RELEASE_BRANCH_PATTERN='v*.[0-9]*.[0-9]*' TRUNK_BRANCH=main \
  node scripts/check-release-drift.mjs
cat drift-report.md
```

(The inline env mirrors what the workflow sets; without it the script falls
back to its upstream defaults of `master` / `v[0-9]*.[0-9]*.[0-9]*`, which do
not match this repo.)

## Known limitations

- **Patch-id is content-based.** A commit whose change is later reapplied with
  a substantive edit (not a clean cherry-pick) will still show as drift —
  that's usually the right call, but worth knowing.
- **Reverts are detected by message text.** The filter relies on the standard
  `This reverts commit <sha>` line that `git revert` produces. Hand-written
  reverts that omit that line will not be filtered.
- **Open staging branches read as drift vs trunk.** See the SDK release-model
  note above — an in-flight `version-*` branch ahead of `main` is expected and
  not actionable until it should have merged.
- **Allowlist not implemented.** If a commit is intentionally not being
  forward-merged, today it will keep appearing. Adding an allowlist is in the
  out-of-scope list for phase 1 — revisit if reports get noisy.

## Phase 2 / 3 (not in this change)

- Phase 2: open automated forward-merge PRs between release branches.
- Phase 3: trunk-based development with explicit backport tooling.

[jira]: https://rsklabs.atlassian.net/browse/FLY-2355
[lps-jira]: https://rsklabs.atlassian.net/browse/FLY-2292
