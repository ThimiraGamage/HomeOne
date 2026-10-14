# HomeOne — finalized delivery plan

Version 1.1 · 14 October 2026 · Approved Milestone 1 baseline

Based on the user-supplied *Smart Home Management Platform — Full Project Documentation v1.0* (13 October 2026). This document resolves delivery scope and engineering decisions; it does not certify a hardware installation. The user approved Milestone 1 on 14 October 2026. Later milestones remain planned work.

## Product and scope

HomeOne gives one household a clear view of energy, water, rooms, device status and alerts. It grows from a simulated software demonstration into a local-first home pilot. The gateway owns local device communication and essential rules; the browser uses a backend API. Internet availability must not determine whether manual controls or independent protection systems work.

| Priority | Deliverable | Boundary |
| --- | --- | --- |
| P0 | Dashboard, energy, water, room environment, device inventory, alerts, maintenance and settings | Required for the first software and hardware milestones |
| P1 | Door/leak monitoring, selected convenience controls, structured automations, one garden zone | Add after the core data and command path is reliable |
| P2 | Commercial lock/camera integrations, pet feeder, additional air-quality channels | Optional; UI previews may precede integrations |
| P3 | Matter/Thread, custom PCBs, manufacturing, fleet management, advanced analytics | Separate productization project based on pilot evidence |

A complete navigation system does not mean every module is production-ready. The UI must identify simulation and deferred integrations explicitly.

## Decisions resolved

- Keep the existing `client/` React, TypeScript, Vite and React Router application. A Next.js migration offers no necessary capability for the initial local dashboard.
- Preserve the existing HomeOne shell and branding; replace the placeholder pages with useful content rather than rebuilding navigation.
- Build the first milestone against a typed, asynchronous mock service. Data and mutations belong behind this interface, so a later API adapter can replace simulation without rewriting presentation components.
- Use one home in the pilot; include `homeId` in persisted entities and future API paths to preserve tenancy boundaries.
- Use a TypeScript backend, PostgreSQL and a local MQTT broker in later milestones. NestJS and Prisma are proposed defaults, not dependencies of the first milestone.
- Keep simulation local in the existing workspace. Hosting, cloud services and external account integrations require a separate deployment decision.
- Display money in LKR and timestamps in Asia/Colombo. Sample energy prices are labelled illustrative; current official tariffs must be verified before a real billing feature is enabled.
- Do not implement browser authentication or imply role enforcement in a mock-only frontend. Actual authorization belongs in the backend milestone.

## Milestone 1 — complete simulated website

Approved scope for the current implementation. No database, MQTT connection, firmware or real-device commands.

| Page | Required experience |
| --- | --- |
| Dashboard | Whole-home metrics, water reserve, room conditions, device health, active alerts and links to detail pages |
| Energy | Power/energy history, daily consumption, sample tariff metadata and clearly labelled estimated cost |
| Water | Tank percentage and litres, history, thresholds, sensor quality and pump status; no live pump control |
| Rooms | Room cards with temperature/RH, optional measurements, last update and stale/offline indicators |
| Devices | Inventory, room/type/status filtering and selected simulated convenience commands |
| Security | Door position and lock position displayed independently, contact status and sample event history; no unlock action |
| Garden | One simulated zone with soil moisture, valve state and irrigation constraints; integration status clearly indicated |
| Pets | Explicit optional-module preview with sample schedule/feeding records; no actual feeding command |
| Automations | Structured sample trigger/condition/action rules; enable/disable simulation and execution history |
| Alerts | Severity/status filters, acknowledgement, resolution and history |
| Maintenance | Availability, firmware, signal, last-seen timestamps and issues |
| Settings | Editable demo home preferences and validated water thresholds; clear persistence/reset behavior |

### Interaction and state contract

- A visible simulation indicator applies across the application.
- Availability (`ONLINE`, `OFFLINE`, `UNKNOWN`) and measurement quality (`GOOD`, `STALE`, `SUSPECT`, `INVALID`) remain separate.
- Device command state is separate from reported state: `IDLE → PENDING → ACKNOWLEDGED`, or `FAILED`/`TIMED_OUT`. Sending a command never immediately changes confirmed state.
- Offline devices and monitor-only appliances do not offer control. Refrigerators, locks, pumps and other sensitive equipment are excluded from initial convenience controls.
- A stale value retains its last timestamp and is never presented as a fresh healthy measurement. Invalid readings do not contribute to a healthy aggregate.
- Door `OPEN/CLOSED/UNKNOWN` and lock `LOCKED/UNLOCKED/JAMMED/UNKNOWN` are independent fields.
- Empty, loading and service-error states are part of the reusable UI.
- Demo mutations survive navigation; persistent settings and any other persisted data must state their browser-local scope. Provide a reset path if browser persistence is used.

### Acceptance gate

1. All twelve routes show meaningful content and work on desktop and phone widths.
2. Summary values derive from the same service data as detail pages.
3. At least one offline device and one stale sensor demonstrate clear handling.
4. A simulated command visibly waits for confirmation; failure leaves confirmed state unchanged.
5. Alert and automation interactions update their corresponding summaries.
6. Inputs have labels, controls support keyboard use, status is communicated with text as well as color, and charts have readable summaries.
7. TypeScript production build and repository lint pass. Meaningful tests cover command lifecycle, invalid input and shared state; browser verification limits are reported.

## Later milestones and release gates

| Milestone | Implementation | Gate before moving on |
| --- | --- | --- |
| 2 — Backend | API, database migrations, authentication, permissions, validation, seed data, audit and health endpoint | UI uses API adapter; role and cross-home denial tests pass; backup/restore demonstrated |
| 3 — IoT simulation | Local broker, registry, ingestion, versioned schemas, simulator, command correlation and state acknowledgement | Reconnect, duplicate/out-of-order data, timeout and device ACL tests pass |
| 4 — First hardware | One water node and one room node with documented provisioning and calibration | Continuous bench run, restart recovery and sensor-fault tests recorded |
| 5 — Energy/control | Qualified metering installation, reference comparison and selected control integration | Calibration recorded; command, manual override and recovery verified |
| 6 — Home pilot | Door/leak sensing, bounded irrigation, optional commercial security integrations | Offline rules, alert quality and manual fallback verified |
| 7 — Hardening | Service auto-start, backups, secure provisioning/OTA, retention and observability | Pilot runs without the developer laptop; documented recovery and security review |
| 8 — Productization | Market scope, enclosure/PCB, manufacturing and compliance plan | Pilot evidence supports the feature set and business case |

Use completion gates rather than a promised calendar. Duration depends on weekly development capacity, hardware delivery and access to installation expertise.

## Backend and device contracts to freeze after the UI

Core entities: Home, Room, Device, SensorChannel, TelemetryReading, DeviceState, Command, WaterTank, EnergyReading, TariffVersion, Alert, Automation, SecurityEvent, AccessEvent and AuditEvent. Garden and pet entities remain extensions.

Every record belongs to a home. Timestamps use ISO 8601; storage uses UTC and the frontend formats the home timezone. Measurements carry units, observation time and quality. Commands include a correlation ID, issuer, desired state, creation/expiry times and result; the latest actual state is independently reported.

All future endpoints are versioned and home-scoped, for example:

```text
GET  /api/v1/homes/{homeId}/summary
GET  /api/v1/homes/{homeId}/rooms
GET  /api/v1/homes/{homeId}/devices
GET  /api/v1/homes/{homeId}/energy/history?from=&to=&interval=
GET  /api/v1/homes/{homeId}/water/tanks/{tankId}
POST /api/v1/homes/{homeId}/devices/{deviceId}/commands
GET  /api/v1/homes/{homeId}/commands/{commandId}
GET  /api/v1/homes/{homeId}/alerts
POST /api/v1/homes/{homeId}/alerts/{alertId}/acknowledge
GET  /api/v1/homes/{homeId}/automations
```

MQTT namespace: `shmp/v1/{homeId}/{deviceId}/{telemetry|state|command|event|availability}`. Device credentials and ACLs isolate namespaces. Commands are not retained; retained actual state includes its observation timestamp and must still be checked for freshness. Correlate acknowledgements; suppress duplicates and expired commands. Do not expose the broker or device HTTP endpoints publicly.

The local gateway evaluates essential rules using valid, fresh measurements, persistence windows, hysteresis, bounded durations and fault interlocks. Enabling a rule in the first UI milestone does not imply that a gateway scheduler exists.

## Pilot validation and budget decisions

Before purchasing duplicate nodes, demonstrate one sensor through telemetry, history, alert and recovery. Purchase water/room equipment first; defer camera, lock and feeder spending. The PDF's budget ranges are planning estimates, not current supplier quotations. Verify prices and compatibility when buying.

Proposed measurable pilot targets, to confirm against actual sensor capabilities:

- Seven consecutive days of core logging, with at least 99% expected samples present outside documented maintenance windows.
- Mark a channel stale after three missed reporting intervals; mark device offline using availability plus a bounded heartbeat policy.
- Command timeout of ten seconds for initial convenience controls, configurable per integration; never retry a non-idempotent action blindly.
- Record water calibration at five tank levels, temperature/RH comparison and energy comparison at representative loads. Declare tolerances before each hardware test rather than asserting undocumented accuracy.
- Exercise Internet outage, Wi-Fi loss, broker restart, gateway reboot, invalid data and restore-from-backup; record pass/fail and recovery time.

Independent certified protection, local/manual access and qualified mains installation remain boundaries inherited from the proposed project. HomeOne cannot be represented as a billing meter or a certified fire/security system on the basis of this prototype.

## Current repository assessment

Milestone 1 has been implemented in the existing `client/` app. All twelve routes have typed simulated data and meaningful content. Shared state supports command confirmation/rejection/timeout, alert acknowledgement/resolution, rule toggles, validated browser-local preferences and reset. Healthy simulated telemetry timestamps refresh every 15 seconds; offline/stale/invalid examples retain their timestamps.

Seventeen service and page-rendering tests pass, as do repository lint and the TypeScript/Vite production build. Charts load in a separate bundle and expose readable history tables. Browser visual/interaction checks were unavailable in the implementation session, so responsive layouts and actual chart rendering still require local browser review. See `client/README.md` for run instructions and a demonstration walkthrough.

There is no backend, database, authentication, MQTT, firmware or physical device integration. Milestone 2 is the next separately scoped implementation step.

## Open decisions

Milestone 1 scope is approved and implemented. Complete local browser review before treating its UI acceptance gate as fully verified.

Before backend/hardware: choose the gateway host and pilot devices, confirm household users/roles and remote-access needs, set retention/backup limits, identify a qualified installer and confirm the hardware budget. These decisions do not block the simulated website.
