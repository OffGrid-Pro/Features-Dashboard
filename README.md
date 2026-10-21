# WattSwap development dashboard

A stakeholder view of [WattSwap Feature list — Project 8](https://github.com/orgs/OffGrid-Pro/projects/8).

**Dashboard:** [Open the hosted dashboard](https://offgrid-pro.github.io/Features-Dashboard/) (available after GitHub Pages deployment).

## Run locally

Requires Node.js 20 or newer. No dependencies or build step.

```sh
npm start
```

Open http://localhost:4173. Run `npm test` for calculation, export and GitHub pagination checks.

## Connect live data

Click **Connect GitHub** and enter a GitHub token that can read WattSwap project 8 and its issue repositories. For classic tokens, GitHub documents `read:project` for queries; private repository content also needs appropriate repository access. Organisation policies/SSO may require authorisation. See [GitHub’s project API guide](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects).

The dashboard sends read-only GraphQL requests directly to `https://api.github.com/graphql`. Tokens and project data stay in tab memory and are never written to local storage, source files or the hosting server. Reloading requires reconnection. Only planning preferences persist in local storage. Refresh reloads every project page; a failed request retains the previous successful data and shows an error. Archived and inaccessible items are omitted. Sample data is explicitly labelled and never loaded automatically.

This first version requires each viewer to supply project access. A shared, automatically refreshed stakeholder view without tokens needs an authenticated server integration; publishing a private project's snapshot into this public repository is not a safe substitute.

## Planning conventions

- Matt: `MattySolja`, **24 hours/week**. Jake: `14ellisj`, **24 hours/week**.
- `Estimate` is development **days**, confirmed by Jake. **8 hours/day is an editable initial assumption.**
- Weekly hours are spread evenly over Monday–Friday. Forecast starts today in Europe/London; the start date can be changed for a scenario.
- In-progress/review work is scheduled first, followed by Priority (`P0`–`P3` or High/Medium/Low), then the project's returned item order.
- Each developer has a separate sequential queue; prerequisites are resolved before dependent tasks. A task must have exactly one owner, Matt or Jake, to receive a forecast. Other or multiple owners need planning.
- Completed items consume no future capacity. The task completion count includes all visible, unarchived project items, including any parent issues present in the project.
- Missing `Time spent` is displayed as unknown; forecasting conservatively assumes the full estimate remains. Time spent is not inferred from issue age or status.
- If time spent reaches/exceeds the estimate on an unfinished task, an explicit `Remaining` estimate is required. Unknown effort blocks that owner's later queue rather than inventing a date.
- Forecasts include recorded dependencies and weekly capacity exceptions. Unrecorded holidays, dependencies and interruptions are not included. They are planning estimates, not deadlines. Parent and child items should not both carry the same delivery estimate or their effort will be counted twice.
- Roadmap groups follow the existing `Required for prototype`, `Required for rollout`, and `Future Plans` labels. A group has no overall completion date while any unfinished item is unforecasted.

### Optional numeric project fields

| Field | Unit | Purpose |
| --- | --- | --- |
| Estimate | Development days | Original task estimate |
| Time spent | Hours by default | Actual accumulated effort; editable unit in Settings |
| Remaining | Development days | Revised remaining effort, overriding estimate minus spent |
| Progress | Percent, 0–100 | Explicit completion progress; never inferred from time consumed |

`Status`, `Priority`, and date fields named `Target date` or `Due date` are also read. Numeric field names are configurable. Add these fields to GitHub as needed; the dashboard never writes to the project. Actual effort greater than estimate is flagged even for completed tasks. Forecast dates after a recorded target are flagged separately.

CSV exports the currently filtered rows, with explicit hour units, recorded progress, forecasts and planning notes. Formula-like cell values are neutralised for spreadsheet safety.

## GitHub Pages

The included workflow tests the application, then deploys only the six static app files. No tokens or project data are included in the deployment.

1. Push this repository to `OffGrid-Pro/Features-Dashboard`.
2. In repository **Settings → Pages**, select **GitHub Actions** as the source.
3. Run the **Deploy dashboard** workflow, or push to `main`.
4. Use the HTML dashboard link at the top of this README.

The repository is public, so the deployed app is public. Private project information is only retrieved for authenticated viewers in their own browsers. Do not commit credentials or private project snapshots.


## GitHub Pages-compatible upgrades

Everything runs in the browser: no backend, database or build dependencies were added. The existing GitHub Pages workflow still deploys the application.

### Live updates and freshness

The connected dashboard refreshes every 5 minutes by default while the tab is visible; returning to the tab triggers a refresh if due. Settings allows 0 (off) or 1–60 minutes. Requests do not overlap, and failures preserve the last successful data with a warning. Data older than the greater of 15 minutes or twice the refresh interval is marked stale. Tokens remain only in tab memory. Closing/reloading disconnects live access.

### Reports for stakeholders without a token

Use **Save report** to download a JSON report with current task data, the planning scenario and forecast dates. It never contains a token. Stakeholders open the same GitHub Pages URL and choose **Open report** to view that file without GitHub credentials. Reports are read locally, not uploaded. Their original data timestamp, scenario start date and sample/live provenance are retained. The dashboard explicitly labels them as saved, not live. Reports contain project information: share only with intended viewers and do not commit private reports to this public repository.

GitHub Pages alone cannot offer a shared authenticated live integration with a server-side secret. This version deliberately provides live per-viewer connections plus token-free report viewing. A shared live backend remains outside this static-only scope.

### Capacity exceptions, ranges and release forecasts

In Settings, add a weekly exception for Matt and Jake; it replaces their normal hours for that Monday–Sunday week. Zero hours represents leave. Capacity is spread over the five weekdays. A forecast is calculated for expected effort and again for a configurable caution allowance (25% additional remaining effort by default). These are scenarios, not confidence intervals. Ranges propagate across task queues and dependencies. Prototype, rollout and future-plan forecasts aggregate those dates and remain incomplete when any open task cannot be scheduled. The scheduling horizon is ten years.

### Effort tracking and dependencies

**Plan task** lets you enter an estimate in days, actual time spent in hours, remaining effort in days, progress, a delivery owner, a blocked flag and prerequisite tasks. These are clearly labelled local adjustments, persist through refresh and are included in exported reports. They are not written back to GitHub and are lost on reload unless saved in a report. Clear local adjustments to restore GitHub values.

Alternatively add a GitHub Projects text field called **Depends on** (name configurable). Enter full issue URLs or same-repository `#number` references separated by spaces/commas. Missing or ambiguous references, dependency cycles and blocked tasks receive no forecast. Dependencies must finish before dependent work begins; the calculation conservatively starts dependent work on the next weekday. This field is independent of GitHub's native issue relationship UI; native relationships are not automatically imported.

Weekly exceptions are session-only and included in reports. General preferences such as base hours and refresh interval remain browser-local settings. The report's scenario start date is retained when reopened; change it in Settings to reforecast from today.

### Weekly review

On the first live load, the dashboard sets a session baseline. **What changed?** compares completion, status, added/removed tasks, later forecast dates, lost forecasts and changed effort against that baseline. **Compare with report** loads last week's report as a baseline without replacing the current project. It always shows the actual comparison timestamp; it does not invent a week's history. **Set baseline now** begins a new comparison period. Local scenario changes also affect comparisons and are explicitly identified as such.

CSV now includes expected and cautious dates, dependencies and whether a local adjustment is applied. It exports the current filtered view.

## Automatic public project feed

Visitors load the shared project automatically; no login or personal token is needed. GitHub Actions reads Project 8 using the repository secret `PROJECT_READ_TOKEN` and publishes an allowlisted `project-data.json` alongside the site. The secret is never put in browser code, repository files, or the Pages artifact.

Setup:
1. An organisation administrator must enable Pages for this repository (currently disabled by organisation policy). Choose GitHub Actions as the Pages source.
2. Add a fresh token under Settings → Secrets and variables → Actions, named `PROJECT_READ_TOKEN`. It needs organisation Projects read access and read access to the repositories containing project issues. Authorise organisation access where required. Revoke any token previously pasted into chat.
3. Run the Deploy dashboard workflow from Actions. It also runs on main pushes and every 30 minutes (scheduled runs can be delayed).

The public snapshot includes task titles, issue links/numbers, assignees, labels, Status, Priority, Estimate, Time spent, Remaining, Progress, Depends on, Target date and Due date. Other fields and issue bodies are excluded. Custom field mappings require adding the approved field name to `publicProject` in github.mjs.

A missing/expired token or failed sync stops deployment; the previous successful site remains available. The dashboard flags shared data older than 90 minutes. Renew the secret before its token expires and check failed Actions runs. GitHub can disable scheduled workflows in inactive public repositories after 60 days; re-enable the workflow if needed. Browser Refresh checks the published snapshot, not GitHub directly. Optional advanced connections still use a token only in that browser tab.

Local preview: set PROJECT_READ_TOKEN securely in your shell and run `node sync-project.mjs`, then `npm start`. Generated project data is ignored by Git. Do not commit credentials.
