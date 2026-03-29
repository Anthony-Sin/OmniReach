# Aegis | Disaster Response Multi-Agent System

Aegis is a reliable "System of Agents" for disaster response, where specialized agents observe, reason, and act through an Agent-to-Agent (A2A) network. This project demonstrates a complete lifecycle from disaster detection to last-mile delivery using autonomous agents.

## System Architecture

The system is built on the **Google ADK (Agent Development Kit)**, enabling structured communication and tool execution across a distributed agent workforce.

1.  **Coordinator Agent**: The root orchestrator that manages the mission lifecycle, enforces event ordering, and handles state transitions.
2.  **Sentinel Agent**: Monitors global disaster alerts via GDACS and triggers triage for significant events.
3.  **Triage Agent**: Uses Gemini AI to analyze disaster data, prioritize affected zones, and identify specific relief needs.
4.  **Assembly Agent**: Plans customized relief kits (medical, nutrition, hygiene) based on triage recommendations.
5.  **Logistics Agent**: Manages inventory and generates pick sequences for robotic assembly.
6.  **Robotics Agent**: Simulates robotic arm execution for kit assembly using MuJoCo physics.
7.  **Delivery Agent**: Plans and simulates last-mile drone delivery routes to the target disaster zones.

## Core Technologies

-   **ADK (Agent Development Kit)**: Provides the A2A messaging and tool routing infrastructure.
-   **React & Tailwind CSS**: Powers the high-tech command center UI.
-   **MuJoCo WASM**: Real-time physics simulation for robotic assembly.
-   **Gemini AI**: High-level reasoning for triage and mission summarization.
-   **GDACS API**: Real-time global disaster monitoring.
-   **Three.js**: 3D visualization of robotic operations and drone flight.

## Mission Lifecycle

1.  **Observation**: Sentinel Agent detects a high-impact disaster event.
2.  **Reasoning**: Triage Agent analyzes the event and prioritizes a specific zone.
3.  **Planning**: Assembly Agent designs a relief kit; Logistics Agent verifies inventory.
4.  **Action (Assembly)**: Robotics Agent executes the pick-and-place sequence in simulation.
5.  **Action (Delivery)**: Delivery Agent calculates a flight path and simulates drone transport.
6.  **Completion**: Coordinator Agent generates a final mission summary and closes the mission.

## Key Features

-   **Deterministic State Machine**: Missions follow a strict sequence of events (Sentinel -> Triage -> Assembly -> Logistics -> Robotics -> Delivery).
-   **A2A Routing**: Tools are executed on target agents with clear error reporting.
-   **Real-time Monitoring**: Live GDACS feed integrated into the command center.
-   **Physics-backed Simulation**: Robotic actions are verified through MuJoCo physics.
-   **AI-driven Summarization**: Every mission ends with a Gemini-generated report.
