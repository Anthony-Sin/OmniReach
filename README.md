# Aegis Disaster-Response Agent Workforce

Aegis is an autonomous disaster-response workforce built as a system of agents, not a chatbot. It observes global incidents, reasons across competing needs, assembles relief plans, executes robotic and delivery workflows, and performs real outward handoff actions through operational incident exports.

“Aegis does not stop at analysis. After coordinating the response, it generates an operational incident export packet that a human relief team can immediately use for field execution, partner escalation, or command-center review.”

## Workforce Design

- `Sentinel` is the observer worker. It monitors multi-level GDACS incidents and publishes normalized alerts.
- `Intel` is the enrichment worker. It adds ReliefWeb humanitarian context and USGS flood observations through the A2A workflow.
- `Triage` is the prioritization worker. It ranks zones and selects the mission target.
- `Assembly` is the planning worker. It designs specialized kits for the chosen mission.
- `Logistics` is the sequencing worker. It condenses a kit into a compact robotic pick plan.
- `Robotics` is the assembly execution worker. It assigns an available arm and runs the physical kit build workflow.
- `Delivery` is the field transport worker. It chooses a route and transport mode using current weather risk.
- `Action` is the outward operations worker. It exports incident packets and can dispatch partner webhooks for real-world handoff.
- `Coordinator` is the orchestration worker. It owns mission state, queue dispatch, event ordering, and cross-agent completion.

## Queue-Based Boundaries

Aegis models independently deployable worker lanes even when running in one process. Coordinator dispatches work through named queues such as:

- `sentinel-observer`
- `triage-worker`
- `intel-worker`
- `assembly-worker`
- `logistics-worker`
- `robotics-worker`
- `delivery-worker`
- `action-worker`

These boundaries make the A2A workflow explicit and provide a clean path to splitting the system into separate services later.

## Real Act Layer

After delivery arrives, Aegis does not stop at analysis:

- It writes a structured incident packet to an operational outbox.
- It produces a handoff artifact a human relief team can use immediately.
- It records which action channels were used for the mission handoff.

## Runtime APIs

- `GET /api/health` returns service health.
- `POST /api/missions/start` starts a new mission.
- `GET /api/system/queues` returns the active worker queue snapshot.

## Environment

Set these values in `.env.local` or your process environment:

- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `AEGIS_WEBHOOK_URL` optional
- `AEGIS_PARTNER_NAME` optional
- `AEGIS_OUTBOX_DIR` optional

## Run Locally

1. Install dependencies with `npm install`.
2. Configure the environment variables.
3. Start the workforce with `npm run dev`.
4. Run verification with `npm run lint` and `npm test`.
