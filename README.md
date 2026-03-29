This is a comprehensive update to your `README.md`, transitioning the project from "Aegis" to **OMIREACH**. This version incorporates your new mission statement, the technical "A2A" (Analysis-to-Action) narrative, and the specific logic for mission efficiency.

---

# 🌐 OMIREACH: Simulated Disaster-Response Workforce

**OMIREACH** is an autonomous disaster-response system designed as a workforce of specialized agents, not a chatbot. It bridges the **Analysis-to-Action (A2A) Gap** by observing global incidents, reasoning across competing humanitarian needs, and generating simulated robotic logistics and operational handoff artifacts.

> "OMIREACH does not stop at analysis. It moves beyond 'summarizing' a disaster to 'solving' it through a high-fidelity agentic ecosystem that creates structured, field-ready incident exports."

---

## 🏗️ Workforce Architecture
OMIREACH utilizes the **Google Agent Development Kit (ADK)** to define distinct, decoupled worker lanes.

* **`Sentinel` (The Observer):** Monitors live **GDACS** and **USGS** feeds to identify and normalize global incident alerts.
* **`Intel` (The Enricher):** Adds humanitarian context via **ReliefWeb** and environmental data using `ParallelAgent` workflows.
* **`Triage` (The Strategist):** Ranks zones and selects mission targets based on urgency and impact.
* **`Assembly` (The Architect):** Designs specialized kits (Medical, Food, Shelter) using `LoopAgent` for iterative verification.
* **`Logistics` (The Sequencer):** Calculates efficient routes and condenses kits into compact robotic pick plans.
* **`Robotics` (The Constructor):** Assigns simulated hardware and executes the physical kit build workflow.
* **`Delivery` (The Navigator):** Determines transport modes and paths by factoring in real-time weather risks.
* **`Action` (The Operator):** Generates the **Operational Incident Export** and dispatches partner webhooks.
* **`Coordinator` (The Orchestrator):** Manages mission state, event ordering, and cross-agent completion rules.

---

## 📐 The Logic of Logistics
To ensure the **Logistics** agent prioritizes the highest-impact missions, the system calculates the efficiency of a proposed mission $M$ using distance $d$, weather risk $\omega$, and urgency $\mu$:

$$\text{Efficiency}(M) = \frac{\mu}{d \cdot \omega}$$



---

## 🚦 Queue-Based Boundaries
OMIREACH models independently deployable worker lanes. The **Coordinator** dispatches work through named queues to ensure a clean path to microservices:

* `sentinel-observer` | `intel-worker` | `triage-worker`
* `assembly-worker` | `logistics-worker` | `robotics-worker`
* `delivery-worker` | `action-worker`

---

## 🛠️ Tech Stack
* **Core Reasoning:** Gemini API
* **Orchestration:** Node.js & Google Agent Development Kit (ADK)
* **Operator UI:** Next.js, React, TypeScript
* **Geospatial:** Google Maps API (Live incident visualization)
* **Data Sources:** GDACS (Global Disaster Alert and Coordination System), USGS, ReliefWeb

---

## 🚀 Getting Started

### Environment Variables
Create a `.env.local` file with the following:
```bash
GEMINI_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
AEGIS_WEBHOOK_URL=optional_callback_url
AEGIS_OUTBOX_DIR=./outbox
```

### Installation & Run
1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the workforce:**
    ```bash
    npm run dev
    ```
3.  **Validation:**
    ```bash
    npm run lint
    npm test
    ```

### Runtime APIs
* `GET /api/health`: Service status.
* `POST /api/missions/start`: Manually trigger a new autonomous mission cycle.
* `GET /api/system/queues`: View a live snapshot of active worker queues.

---

## 🚧 Challenges & Learnings
Building OMIREACH taught us that the future of relief lies in **Agentic Orchestration**. We overcame the "Simulated Autonomy" hurdle by building a Coordinator that handles event ordering without human intervention, ensuring a seamless hand-off between "Data Agents" and "Mechanical Agents."

**Would you like me to help you draft the `Action-Worker` logic to format the final Incident Export packet?**
