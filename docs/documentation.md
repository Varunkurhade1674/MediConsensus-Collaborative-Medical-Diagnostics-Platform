# MediConsensus Documentation

This document contains the Architecture, Workflow, and setup details for the Python + FastAPI + Octochains-based MediConsensus Collaborative Diagnostics Platform.

---

## 1. System Architecture

MediConsensus is built as a real-time responsive web dashboard powered by a FastAPI backend that runs parallel, isolated agent reasoning workflows via the Octochains framework.

*   **Frontend**: Single Page Application (HTML5, Javascript, Custom CSS). It connects via Server-Sent Events (SSE) to stream diagnostic results in real-time, displays agent metrics, renders visual diagnostics on a dynamic canvas using HTML SVG paths, and offers settings to toggle themes or save API keys in browser storage.
*   **Backend**: FastAPI REST server. Handles uploading and parsing text/PDF medical reports, parses API keys, and orchestrates the parallel multi-agent diagnostics.
*   **Orchestration Framework**: Octochains. Provides clean agent isolation and aggregation paradigms, ensuring each agent operates independently without cognitive leaks (groupthink bias).

```mermaid
graph TD
    User[Clinician] -->|1. Drag-and-Drop Dossier| UI[Web Dashboard]
    UI -->|2. POST /analyze with API Key| API[FastAPI Server]
    API -->|3. Trigger screening| CMO[Chief Medical Officer Agent]
    CMO -->|4. Parse required specialties| API
    API -->|5. Launch parallel execution| ThreadPool[Isolated Execution Threads]
    ThreadPool -->|Cardiology check| Cardio[Cardiologist Agent]
    ThreadPool -->|Mental status check| Psych[Psychologist Agent]
    ThreadPool -->|Respiration check| Pulmo[Pulmonologist Agent]
    ThreadPool -->|Brain/Neurology check| Neuro[Neurologist Agent]
    Cardio & Psych & Pulmo & Neuro -->|6. Stream progress & results| API
    API -->|7. Send Server-Sent Events (SSE)| UI
    API -->|8. Run synthesis| Aggregator[Multidisciplinary Team Aggregator]
    Aggregator -->|9. Consolidated clinical report| API
    API -->|10. Final diagnostic payload| UI
```

---

## 2. Component Workflow Details

### 1. File Ingestion & Processing (`POST /analyze`)
The clinician uploads a `.txt` or `.pdf` file.
- If it's a PDF, `pypdf` extracts the text page-by-page.
- If it's a TXT file, the text is decoded as UTF-8.
- An SSE streaming response (`StreamingResponse`) is initiated to return real-time updates as they occur.

### 2. Chief Medical Officer screening (CMO)
- The CMO acts as the supervisor agent.
- It parses the patient's medical report and determines which specialties are needed (a subset of `["Cardiologist", "Psychologist", "Pulmonologist", "Neurologist"]`).
- It outputs a JSON array, e.g., `["Cardiologist", "Psychologist"]`, allowing the system to run only the relevant agents and avoid wasting tokens/computation.

### 3. Parallel Isolated Reasoning
- The selected specialists are spawned concurrently using `asyncio.as_completed`.
- Each agent runs in its own context using specific prompt templates (defined in `Webapp/prompts.py`):
  - **Cardiologist**: Focuses on ECG findings, structural issues, arrhythmias, and cardiac enzyme counts.
  - **Psychologist**: Reviews behavioral observations, history of anxiety/depression, trauma indicators, and psychological history.
  - **Pulmonologist**: Reviews lung function assessments, breath sounds, imaging, and oxygenation levels.
  - **Neurologist**: Analyzes cognitive assessments, MRI/CT scans, reflexes, and neuro-functional metrics.
- As each specialist finishes, its results, confidence score, and execution duration are immediately streamed via SSE to the browser to dynamically update the dashboard UI.

### 4. Multidisciplinary Team Aggregation
- The `MultidisciplinaryTeam` aggregator gathers the reports from the active specialists.
- It synthesizes the findings into a single coherent medical consensus report.
- The synthesis includes:
  - **Executive Summary**: A unified synthesis narrative of the patient's health issues.
  - **Key Clinical Takeaways**: Main action points/diagnoses.
  - **Confidence Score**: Overall confidence metric.
  - **Citations**: Direct references mapping back to the individual specialist reports.

---

## 3. Core API Endpoints

The FastAPI server exposes these key endpoints:

### Serve Frontend
*   `GET /` - Returns `static/index.html` as the main interface dashboard.

### Core Analysis Route
*   `POST /analyze`
    - Accepts a `file` parameter (the medical dossier) and an optional `api_key` (Groq/OpenAI/Gemini/OpenRouter key).
    - Returns a `StreamingResponse` sending JSON lines in the following sequence:
      1.  **`supervisor_decision`**: Lists the active specialists selected by the CMO.
      2.  **`agent_done`** (Multiple events): Yielded as each agent completes execution. Contains the agent's name, diagnostic result, confidence score, and time taken.
      3.  **`consensus`**: Yielded at the end. Contains the full synthesized markdown diagnostic, overall confidence score, and metadata.
    - Status: Streaming.

---

## 4. Prompt Engineering System (`Webapp/prompts.py`)

The system separates its prompts into distinct variables:
- `SUPERVISOR_PROMPT`: Instructs the CMO to identify relevant disciplines from a predefined list and return a clean JSON array.
- `CARDIOLOGIST_PROMPT`: Directs the Cardiologist model to perform cardiac assessment.
- `PSYCHOLOGIST_PROMPT`: Directs the Psychologist model to perform mental health assessments.
- `PULMONOLOGIST_PROMPT`: Directs the Pulmonologist model to perform pulmonary assessments.
- `NEUROLOGIST_PROMPT`: Directs the Neurologist model to perform neurological assessments.
- `AGGREGATOR_PROMPT`: Directs the Multidisciplinary Team to reconcile conflicts, identify overlapping conditions, synthesize diagnostic consensus, list citations, and compute confidence.

---

## 5. Web Dashboard Styling & Interactions

The visual experience matches the platform's advanced multi-agent theme:
- **Ambient Glow Effects**: Dynamic glowing background elements reacting to theme settings.
- **Glassmorphism UI**: Backdrop filters and semi-transparent borders for high-fidelity clinical aesthetics.
- **Real-Time Flow Visualizer**: The browser dashboard renders active SVG paths with flowing animated dots that travel from the medical report to the CMO, then branch to active specialists, flow into the synthesizer, and culminate in the final diagnostic report.
- **Trace Logger**: Offers a terminal-like sidebar tracing the workflow in real-time, conforming to compliance audit log expectations (e.g. EU AI Act conformity tracing), with a button to download the trace.
- **Responsive Layout**: Adapts dynamically across screen dimensions.
