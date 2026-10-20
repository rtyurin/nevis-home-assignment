# Clients dashboard

A dashboard of how the book of business develops over time: a stacked bar chart
over 12 months, and an expandable table you can drill from the whole company down to
a branch, an advisor and an acquisition channel. The chart follows the drill-down.

- **web/**: React 19, TypeScript, Vite, TanStack Query (server state), Zustand (UI state), CSS Modules
- **server/**: Node.js, Express 5, TypeScript, serving a JSON REST API

## Running it

Requires Node 20+.

```bash
npm install
npm run dev          # API on :3001, web on http://localhost:5173 (proxies /api)
```

Production-style, with one process serving both the API and the built app:

```bash
npm run build
npm start            # http://localhost:3001
```

Checks:

```bash
npm test             # server (Vitest + supertest), then web (Vitest + Testing Library)
npm run lint         # ESLint, including jsx-a11y and react-hooks
npm run typecheck
```

### Seeing the loading and error states

Outside production, the API accepts `delay` (ms) and `fail=1`, and the web app passes
them through from its own URL:

- http://localhost:5173/?delay=3000 shows the skeleton for 3 seconds
- http://localhost:5173/?fail=1 shows the error state after the automatic retries. "Try again" retries manually.

## API

| Route | Response |
| --- | --- |
| `GET /api/clients` | `{ months: ["2024-02", …, "2025-01"], company: <the tree from the brief, unchanged> }` |
| `GET /api/health` | `{ status: "ok" }` |
| anything else under `/api` | `404 { error: { code, message } }` |

All errors use the same `{ error: { code, message } }` shape. The client validates the
response with zod at the boundary. It then normalises the tree into one shape
(`{ id, name, kind, values, children }`), so nothing past `api.ts` knows about
`branches`, `employees` or `channels`.

## How it's put together

```
web/src/
  components/            Generic UI with no client-domain knowledge
    TreeTable/           ARIA treegrid: controlled expanded + active state, any tree shape
    StackedBarChart/     SVG stacked bars, legend, tooltip, keyboard-navigable bars
    Breadcrumbs/ Panel/ Avatar/
  features/clients/      The dashboard
    api.ts               fetch + zod schema + normalisation, typed ApiError
    useClientsQuery.ts   TanStack Query hook (retries only network/5xx errors)
    store.tsx            Zustand store: expanded rows + chart scope
    breakdown.ts         Pure mapping: tree node -> chart series (+ reconciliation)
    components/          Dashboard, chart panel, table panel, loading/error states
  lib/                   Formatting, element width hook
```

Boundaries I kept to:

- **Generic components are controlled and domain-free.** `TreeTable` takes `items`,
  `columns`, `expandedIds`/`onExpandedChange` and `activeId`/`onActiveChange`.
  `StackedBarChart` takes `categories` and `series` with colors. Neither knows about
  clients, months or the API.
- **The server owns the data and TanStack Query owns the cache. Zustand owns only
  UI state.** That state is which rows are expanded and which node the chart shows.
  The store is created per dashboard through context, not as a module singleton,
  so each test and each mounted instance starts clean.
- **How data becomes a chart is one pure function, `getBreakdown(node)`**, and is
  tested on its own.

## Accessibility

- The table is a WAI-ARIA **treegrid**. Rows expose `aria-level`, `aria-posinset`,
  `aria-setsize`, `aria-expanded` (only on rows that can expand) and `aria-selected`.
  Collapsed descendants are not rendered.
- Keyboard: <kbd>Tab</kbd> enters the grid on one row (roving tabindex). <kbd>↑</kbd>/<kbd>↓</kbd>
  move between rows and <kbd>Home</kbd>/<kbd>End</kbd> jump to the first and last row.
  <kbd>→</kbd> expands a row, or moves to its first child if already expanded.
  <kbd>←</kbd> collapses a row, or moves to its parent. <kbd>Enter</kbd>/<kbd>Space</kbd> toggle.
- The chart is a labelled group. Each month's bar is focusable (arrow keys between
  months) and has a full text description, for example
  "May 2024: Branch 1 156, Branch 2 87, Branch 3 36, Not broken down 22, Total 301".
  Focus shows the same tooltip as hover. Every figure is also in the table.
- Loading is a `status` region and errors are `alert`s. Focus rings are visible,
  and `prefers-reduced-motion` is respected.

## Testing

44 tests in total (40 web, 4 server).

- `TreeTable.test.tsx`: hierarchy semantics, click and keyboard expand/collapse,
  arrow/Home/End navigation, roving tabindex, uneven nesting.
- `breakdown.test.ts` and `StackedBarChart.test.tsx` / `layout.test.ts`: how the data maps
  into the chart. That covers series per child, stacking order and offsets, the shortfall
  segment, folding into "Other", leaf nodes, axis ticks and per-bar labels.
- `ClientsDashboard.test.tsx`: integration from `fetch` to DOM. It covers loading, then
  data; the table and chart drilling together; breadcrumbs; error and retry; and
  retry limits.
- `api.test.ts`: normalisation and error mapping. `server/src/app.test.ts` tests the API.

## Assumptions, decisions and things I think are off

**1. What the chart stacks.** The design stacks *Existing clients / New organic /
New paid* for the whole company. But channel data only exists for Anna Blackwood,
so a company-level channel split can't be drawn truthfully. My call: **the chart
stacks the direct children of the selected row.** It defaults to the company by
branch. Branch 1 shows its advisors, and Anna shows her channels, which is exactly
the design's chart. A leaf is a single series. The chart follows the focused or clicked
row, and the breadcrumb above it goes back up. *Open question:* is a company-wide
channel split the real requirement? If so, the API needs channel data on every
advisor, or pre-aggregated channel totals per node.

**2. The numbers don't reconcile.** I checked every parent against the sum of its children:

| Node | Month | Reported | Children sum |
| --- | --- | --- | --- |
| Company | May 2024 | 301 | 279 |
| Branch 1 | Aug 2024 | 214 | 216 |
| Anna Blackwood | May, Jun, Jul, Aug, Sep 2024 | 31, 32, 34, 38, 27 | 30, 33, 35, 36, 28 |

Some look like typos. Maria Gutierrez's May 22 breaks an otherwise smooth series;
44 would make Branch 1 178 and the company exactly 301, but Branch 1 itself also
says 156. Robert Chen's Aug 58 is 56 in the design, and 56 reconciles. The design
also shows Branch 1 Jul as 291 where the data says 201. I **serve the data as given
and don't silently correct it**. When children fall short, the gap is stacked as a
hatched **"Not broken down"** segment, so each bar still reaches the reported total.
When they overshoot, the bar shows the breakdown and the tooltip notes the
difference. Either way, a note under the chart lists the affected months. Parents
can legitimately hold clients with no advisor or channel, so I didn't treat a
shortfall as an error.

**3. Month labels aren't in the payload.** The brief says the values run Feb 2024 to
Jan 2025 "in the design". Hard-coding that in the frontend felt wrong, so the API
wraps the untouched tree in an envelope with a `months` array. The client rejects
any node whose `values` length doesn't match.

**4. Values are client counts at a point in time, not flows.** For Anna, "Existing
clients" in a month equals her previous month's total, which fits a snapshot
reading. So I didn't add a "total" column summing across months, because that
number would be meaningless.

**5. Branch 2 and Branch 3 have chevrons in the design but no children.** I don't
show a chevron or `aria-expanded` on rows that can't expand. A dead control is worse
than an inconsistent look. Their names stay aligned with their siblings.

**6. Smaller calls:**
- The company starts expanded, as in the design.
- The design shows advisor photos, but the data has no image URLs, so I show initials avatars.
- The chart is hand-rolled SVG, not a library. That gave exact design fidelity (only
  the top segment rounded, dotted grid), full control of the accessible markup, and
  easily testable output, for about 250 lines. With more chart types I'd move to a
  library such as visx.
- Colours: the design's three, then two more checked for colour-vision-deficiency
  separation. More than five children fold into "Other (n)", rather than generating
  colours that can't be told apart.
- Below 640px the table scrolls inside its card with a sticky name column, and the
  x-axis labels thin out. Nothing overflows the page at 375px.
- In production, the `delay` and `fail` simulation flags are off.

## What I'd do next

- Agree the reconciliation rules with the data owners, and decide whether the API
  should flag mismatches itself.
- Share the API contract between server and web (OpenAPI or a shared zod package)
  instead of mirroring types.
- Add expand/collapse-all and `*` (expand siblings), and persist the expanded state and
  chart scope in the URL so a view can be shared.
- Add a date-range control and server-side period parameters once there is more than
  a year of data.
- Add Playwright end-to-end and axe checks in CI, visual regression on the chart, and
  a screen reader pass in VoiceOver and NVDA.
- Dark mode, made from validated dark-surface colours rather than an inverted palette.
