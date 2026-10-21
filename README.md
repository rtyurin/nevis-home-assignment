# Nevis Home Assignment

A dashboard that shows how a company's client base develops over 12 months. A stacked bar chart sits above an
expandable table that drills from the company down to branches, advisors and acquisition channels. When you select
a row, the chart follows it. A Node.js REST API serves the data. The UI handles loading and error states, works
from the keyboard, and exposes the hierarchy to assistive technology.

**Live demo:** https://nevis-home-assignment.vercel.app

<img src="docs/screenshot.png" alt="Clients dashboard: stacked bar chart of clients by branch above an expandable table" width="720" />

## Requirements

- Node.js 20+
- npm (the repo is an npm workspace with `server/` and `web/`)

## Running it

```bash
npm install
npm run dev          # API on :3001, web on http://localhost:5173 (proxies /api)
```

Production build, with one process serving both the API and the built app:

```bash
npm run build
npm start            # http://localhost:3001
```

Checks:

```bash
npm test             # server and web tests
npm run lint         # ESLint, Steiger (FSD) and Prettier
npm run typecheck
```

When running locally, the API accepts `?delay=<ms>` and `?fail=1`, and the web app passes them through from its own
URL. For example, http://localhost:5173/?delay=3000 shows the loading skeleton and http://localhost:5173/?fail=1
shows the error state. Both flags are turned off in production.

## Tech stack

**web/**: React 19, TypeScript, Vite, CSS Modules. **server/**: Node.js, Express 5, TypeScript.

| Dependency                              | Why                                                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Query**                      | Owns server state: caching, retrying only network and 5xx errors, and Suspense support, so loading and error states are handled by boundaries rather than inside components.                |
| **Zustand**                             | Holds the small piece of UI state the table and chart share: which rows are expanded and which node is selected. The store is created per page through context, so every test starts clean. |
| **TanStack Table**                      | A headless expanding-row model. It handles the tree logic while I write the markup myself, so the table can be a proper ARIA treegrid.                                                      |
| **TanStack Virtual**                    | Virtualizes the rows against the window scroll, so the table stays fast with large trees.                                                                                                   |
| **Recharts**                            | Stacked bars with custom bar shapes (rounded caps, a hatched "Not broken down" segment) and a built-in keyboard accessibility layer.                                                        |
| **Motion**                              | Animates rows expanding and collapsing, and respects `prefers-reduced-motion`. It's loaded lazily to keep the bundle small.                                                                 |
| **Zod**                                 | Validates the API response at the boundary, so the rest of the app can trust the data's types.                                                                                              |
| **Vitest + Testing Library, Supertest** | Tests the UI through roles and the keyboard, as a user would. Supertest tests the API.                                                                                                      |

## Architecture

`web/` follows [Feature-Sliced Design](https://feature-sliced.design). [Steiger](https://github.com/feature-sliced/steiger),
which runs as part of `npm run lint`, enforces the layer boundaries.

```
web/src/
  app/        Entry point, providers, global styles
  pages/      clients: the dashboard page (chart, table, drill-down state)
  entities/   client: API query, schema, tree normalisation, chart breakdown maths
  shared/     Domain-free UI (TreeTable, StackedBarChart, Breadcrumbs, …), HTTP client, formatting
```

The generic components in `shared/ui` are controlled and know nothing about clients. For example, `TreeTable` takes
`data`, `columns`, `expanded` and `activeRowId`, and the chart takes `categories` and `series`.

## Assumptions and open questions

- **The numbers don't always add up.** Some parents don't equal the sum of their children (for example, the company
  in May 2024 reports 301 against 279). The data is shown as given. A shortfall appears as a hatched "Not broken
  down" segment, and a note under the chart lists the affected months
- **Month labels.** The payload has no dates, so the API wraps the tree in an envelope with a `months` array instead
  of the frontend hard-coding the date range.
- **Rows without children** show no chevron, even where the design has one, because a control that does nothing is
  worse than an inconsistent look.
