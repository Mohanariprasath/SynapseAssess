# SynapseAssess

SynapseAssess is an advanced, AI-augmented proctoring platform designed to evaluate candidate coding competency while ensuring absolute academic and recruitment integrity.

## Directory Structure

* **`proctor-backend`**: A FastAPI + Python-SocketIO server that processes telemetry, aggregates risk metrics, runs differential typing checks, and interfaces with the Google GenAI SDK for live interview challenges and candidate grading.
* **`proctor-frontend`**: A Next.js (App Router) frontend candidate assessment application and recruiter dashboard.

## System Prerequisites

### Backend
* Python 3.10+
* Virtual Environment: `python -m venv .venv`
* Dependencies: `pip install -r requirements.txt`
* Environment Variables:
  * `GEMINI_API_KEY`: Required to enable real-time Gemini challenge generation and grading.

### Frontend
* Node.js 18+
* Dependencies: `npm install`
* Dev Server: `npm run dev`

## Telemetry Metrics
The backend computes a dynamic candidate risk score based on:
* Tab switches and window focus loss
* Fullscreen departures
* Look-away detections
* Code paste/macro cadence anomalies
