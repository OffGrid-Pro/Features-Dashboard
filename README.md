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
- Each developer has a separate sequential queue. A task must have exactly one owner, Matt or Jake, to receive a forecast. Other or multiple owners need planning.
- Completed items consume no future capacity. The task completion count includes all visible, unarchived project items, including any parent issues present in the project.
- Missing `Time spent` is displayed as unknown; forecasting conservatively assumes the full estimate remains. Time spent is not inferred from issue age or status.
- If time spent reaches/exceeds the estimate on an unfinished task, an explicit `Remaining` estimate is required. Unknown effort blocks that owner's later queue rather than inventing a date.
- Forecasts ignore holidays, dependencies and interruptions. They are planning estimates, not deadlines. Parent and child items should not both carry the same delivery estimate or their effort will be counted twice.
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
