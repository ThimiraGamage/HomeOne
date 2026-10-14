# HomeOne — Milestone 1

A local smart-home dashboard built with React, TypeScript and Vite. All twelve sections use one typed simulation service. No backend, authentication, MQTT broker or physical device is connected.

## Run locally

Use Node.js 22.20 or later. From `client/`:

```sh
npm install
npm run dev
```

Dependencies are already installed in the current workspace. On PowerShell systems that block `npm.ps1`, use `npm.cmd` instead of `npm`.

## Checks

```sh
npm test
npm run lint
npm run build
```

The test runner uses Node's built-in test framework and the existing TypeScript compiler. It adds no test dependencies. Tests cover all twelve page renders, cross-page state updates, command confirmation/failure/timeout, duplicate requests, offline control rejection, settings validation, storage fallback, telemetry freshness and cancellation on reset. Rendering checks do not replace browser interaction, chart layout or mobile visual verification.

## Try the demonstration

1. Open **Dashboard** to review whole-home metrics and unresolved alerts.
2. In **Devices**, select a command outcome and request OFF for Living room lights. Confirmed state stays ON while pending. Rejection or timeout leaves it unchanged; success confirms OFF.
3. Inspect the offline study lamp and monitor-only refrigerator. Neither offers an active control.
4. In **Rooms**, compare fresh living-room readings with stale bedroom readings and the unavailable kitchen CO₂ channel. View history values beneath each chart.
5. Acknowledge or resolve an alert. **Dashboard** reflects the change while underlying device faults remain visible.
6. Enable the garden preview rule in **Automations** and view its configuration status in **Garden**. No watering timer or action runs.
7. Save a home name or water threshold in **Settings**. **Water**, the header and navigation use the saved preferences. Invalid threshold ordering is rejected.
8. Reset the demo in **Settings** to restore all seeded state and remove saved preferences.

## Simulation and persistence

- A global simulation notice remains visible across the application.
- Healthy simulated nodes refresh their observation timestamps every 15 seconds. Values are stable fixtures, not real measurements. Stale, invalid and offline fixtures retain their original timestamps.
- Commands visibly take 1.4 seconds to confirm/reject or 2.5 seconds to time out. Requested and reported states are independent.
- Home preferences persist only in this browser under `homeone.demo.settings.v1`. If storage is blocked, preferences still work for the current session.
- Device commands, alert changes and automation toggles survive navigation but reset on browser refresh. Reset also clears pending command results.
- Enabling an automation is a configuration preview. There is no scheduler, threshold evaluator, physical pump command, remote unlock or feeder action.
- Energy cost uses an illustrative flat sample rate in LKR. It is not an official tariff or billing calculation.
- The home timezone is Asia/Colombo. History and event timestamps include this display context.

## Structure

```text
src/services/models.ts           Domain models and replaceable HomeService contract
src/services/seed.ts             Internally consistent sample records
src/services/mockHomeService.ts  Observable simulation service and validation
src/services/homeStore.ts        Service injection point
src/services/useHome.ts          Shared snapshot subscription
src/pages/OverviewPages.tsx      Dashboard, Energy, Water
src/pages/HomePages.tsx          Rooms, Devices, Security, Garden, Pets
src/pages/ManagementPages.tsx    Automations, Alerts, Maintenance, Settings
src/components/ui/               Cards, status, measurement and history components
src/HomePages.css                Responsive content styles
 tests/                         Service and page rendering checks
```

The existing shell and navigation remain in `src/components/layout/` and `src/data/navigation.ts`. Charts load on demand and include a readable history table.

For Milestone 2, implement the `HomeService` contract with an API adapter and supply it through `HomeServiceContext`. Keep authorization and device communication in the backend/gateway, not in page components. The full scope and later release gates are in [`../docs/PROJECT_PLAN.md`](../docs/PROJECT_PLAN.md).
