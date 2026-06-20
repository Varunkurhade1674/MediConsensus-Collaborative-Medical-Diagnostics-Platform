# MediConsensus – Collaborative Medical Diagnostics Platform

## Overview

MediConsensus is an Agentic AI-powered medical diagnostics platform that leverages multiple specialized AI agents to analyze patient medical reports and generate consensus-based diagnostic insights.

The system employs domain-specific medical agents such as Cardiologist, Pulmonologist, and Psychologist agents that independently evaluate medical information. Their findings are synthesized into a unified diagnostic report, demonstrating the power of multi-agent collaboration and consensus-driven decision-making.

---

## Key Features

* Multi-Agent AI Architecture
* Specialized Medical Diagnostic Agents
* Parallel Agent Reasoning
* Consensus-Based Decision Making
* Automated Diagnostic Report Generation
* FastAPI Web Interface
* Markdown Report Export
* Real-Time Medical Analysis

---

## Agent Workflow

Patient Medical Report
↓
Cardiologist Agent
↓
Pulmonologist Agent
↓
Psychologist Agent
↓
Consensus Synthesizer
↓
Final Diagnostic Report

---

## Tech Stack

### AI & Agent Framework

* Python
* Groq Llama 3.3
* Octochains
* Agentic AI
* Multi-Agent Systems

### Backend

* FastAPI
* Uvicorn

### Frontend

* HTML
* CSS
* JavaScript

### Utilities

* Python Dotenv
* Markdown Reporting

---

## Project Structure

```text
MediConsensus/
│
├── Agents/
├── Webapp/
│   ├── main.py
│   ├── templates/
│   └── static/
│
├── results/
│   └── Diagnostic_Report.md
│
├── run_demo.py
├── requirements.txt
├── .env
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/Varunkurhade1674/MediConsensus-Collaborative-Medical-Diagnostics-Platform.git

cd MediConsensus-Collaborative-Medical-Diagnostics-Platform
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows

```bash
venv\Scripts\activate
```

Linux / macOS

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
```

Never commit your `.env` file or API keys to GitHub.

---

# Running the Application

## Option 1: Web Application (Recommended)

Navigate to the Webapp directory:

```bash
cd Webapp
```

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

Open your browser:

```text
http://127.0.0.1:8000
```

---

## Option 2: Terminal Demo

Return to the project root directory:

```bash
cd ..
```

Run the demo:

```bash
python run_demo.py
```

The system will:

* Execute all specialist agents
* Generate diagnostic reasoning
* Produce a consensus diagnosis
* Save the report in:

```text
results/Diagnostic_Report.md
```

---

## Example Use Cases

* Preliminary Medical Diagnostics
* Clinical Decision Support
* Multi-Specialist Case Review
* Medical Report Analysis
* Healthcare AI Research

---

## AI Concepts Demonstrated

* Agentic AI
* Multi-Agent Collaboration
* Parallel Reasoning
* Consensus Generation
* Autonomous AI Workflows
* Medical Decision Support Systems

---

## Resume Highlights

* Built a multi-agent healthcare diagnostic platform using specialized medical AI agents.
* Implemented parallel reasoning and consensus-based diagnosis through agent orchestration.
* Generated diagnostic insights from medical reports using Groq-hosted LLMs.
* Developed a FastAPI-based web interface for interactive healthcare analysis.

---

## Future Enhancements

* Electronic Health Record (EHR) Integration
* Medical Image Analysis
* Doctor Feedback Loop
* RAG-Based Medical Knowledge Retrieval
* PDF Report Upload Support
* Voice-Based Patient Interaction

---

## Author

Varun Kurhade

GitHub:
https://github.com/Varunkurhade1674

---

## License

This project is intended for educational and research purposes.
