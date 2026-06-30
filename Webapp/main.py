import os
import uuid
import json
import asyncio
import time
import re
from fastapi.responses import StreamingResponse, PlainTextResponse
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from octochains import Agent, Aggregator, Engine
import datetime
from pydantic import BaseModel



# Import our new prompts file
import prompts

load_dotenv()
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY", "your-key-here")

def parse_confidence_and_clean(text: str) -> tuple[str, int]:
    match = re.search(r"Confidence\s+Score:\s*(\d+)%", text, re.IGNORECASE)
    confidence = 85
    if match:
        confidence = int(match.group(1))
        text = re.sub(r"\n*Confidence\s+Score:\s*\d+%\n*", "", text, flags=re.IGNORECASE).strip()
    return text, confidence

from fastapi.responses import FileResponse

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_index():
    return FileResponse("static/index.html")

session_store = {}

# --- AGENTS ---
class Cardiologist(Agent):
    def __init__(self, model="llama-3.3-70b-versatile", api_key=None):
        super().__init__(role="Cardiologist", goal="Identify arrhythmias or structural heart issues." , input_description="Medical Report")
        api_key_to_use = api_key if api_key else os.environ.get("GROQ_API_KEY")
        self.llm = ChatGroq(temperature=0, model=model, api_key=api_key_to_use)
    def execute(self, medical_report: str) -> str:
        return self.llm.invoke(prompts.CARDIOLOGIST_PROMPT.format(medical_report=medical_report)).content

class Psychologist(Agent):
    def __init__(self, model="llama-3.3-70b-versatile", api_key=None):
        super().__init__(role="Psychologist", goal="Identify mental health issues.", input_description="Medical Report")
        api_key_to_use = api_key if api_key else os.environ.get("GROQ_API_KEY")
        self.llm = ChatGroq(temperature=0, model=model, api_key=api_key_to_use)
    def execute(self, medical_report: str) -> str:
        return self.llm.invoke(prompts.PSYCHOLOGIST_PROMPT.format(medical_report=medical_report)).content

class Pulmonologist(Agent):
    def __init__(self, model="llama-3.3-70b-versatile", api_key=None):
        super().__init__(role="Pulmonologist", goal="Identify respiratory issues.", input_description="Medical Report")
        api_key_to_use = api_key if api_key else os.environ.get("GROQ_API_KEY")
        self.llm = ChatGroq(temperature=0, model=model, api_key=api_key_to_use)
    def execute(self, medical_report: str) -> str:
        return self.llm.invoke(prompts.PULMONOLOGIST_PROMPT.format(medical_report=medical_report)).content

class Neurologist(Agent):
    def __init__(self, model="llama-3.3-70b-versatile", api_key=None):
        super().__init__(role="Neurologist", goal="Identify neurological issues.", input_description="Medical Report")
        api_key_to_use = api_key if api_key else os.environ.get("GROQ_API_KEY")
        self.llm = ChatGroq(temperature=0, model=model, api_key=api_key_to_use)
    def execute(self, medical_report: str) -> str:
        return self.llm.invoke(prompts.NEUROLOGIST_PROMPT.format(medical_report=medical_report)).content

class ChiefMedicalOfficer(Agent):
    def __init__(self, model="llama-3.3-70b-versatile", api_key=None):
        super().__init__(role="ChiefMedicalOfficer", goal="Determine which specialists are needed for the case.", input_description="Medical Report")
        api_key_to_use = api_key if api_key else os.environ.get("GROQ_API_KEY")
        self.llm = ChatGroq(temperature=0, model=model, api_key=api_key_to_use)
    def execute(self, medical_report: str) -> str:
        return self.llm.invoke(prompts.SUPERVISOR_PROMPT.format(medical_report=medical_report)).content

class MultidisciplinaryTeam(Aggregator):
    def __init__(self, model="llama-3.3-70b-versatile", api_key=None):
        super().__init__(role="MultidisciplinaryTeam", goal="Synthesize reports.")
        api_key_to_use = api_key if api_key else os.environ.get("GROQ_API_KEY")
        self.llm = ChatGroq(temperature=0, model=model, api_key=api_key_to_use)
        
    def execute(self, agent_reports: dict) -> str:
        prompt = prompts.AGGREGATOR_PROMPT.format(
            cardio=agent_reports.get('Cardiologist', 'N/A'),
            psych=agent_reports.get('Psychologist', 'N/A'),
            pulmo=agent_reports.get('Pulmonologist', 'N/A'),
            neuro=agent_reports.get('Neurologist', 'N/A')
        )
        return self.llm.invoke(prompt).content

# --- ENDPOINTS ---
@app.post("/analyze")
async def analyze_report(file: UploadFile = File(...), api_key: str = Form(None)):
    content = await file.read()
    
    if file.filename.lower().endswith(".pdf") or file.content_type == "application/pdf":
        import pypdf
        from io import BytesIO
        try:
            pdf_reader = pypdf.PdfReader(BytesIO(content))
            patient_data = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    patient_data += page_text + "\n"
            patient_data = patient_data.strip()
            if not patient_data:
                return JSONResponse(
                    status_code=400,
                    content={"error": "The PDF file does not contain extractable text. Please upload a text-based PDF or a text file."}
                )
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"error": f"Failed to parse PDF file: {str(e)}"}
            )
    else:
        try:
            patient_data = content.decode("utf-8")
        except UnicodeDecodeError:
            return JSONResponse(
                status_code=400,
                content={"error": "Unable to read the file. Please upload a valid UTF-8 text file or a PDF."}
            )
    
    session_id = str(uuid.uuid4())

    async def generate_stream():
        # 1. Run the Chief Medical Officer supervisor first
        loop = asyncio.get_event_loop()
        start_t = time.perf_counter()
        
        cmo = ChiefMedicalOfficer(api_key=api_key)
        supervisor_res = await loop.run_in_executor(None, cmo.execute, patient_data)
        
        end_t = time.perf_counter()
        supervisor_duration = round(end_t - start_t, 2)
        
        active_agents_list = []
        try:
            match = re.search(r"\[\s*.*?\s*\]", supervisor_res, re.DOTALL)
            if match:
                active_agents_list = json.loads(match.group(0))
            else:
                active_agents_list = json.loads(supervisor_res)
            
            valid_names = {"Cardiologist", "Psychologist", "Pulmonologist", "Neurologist"}
            active_agents_list = [name for name in active_agents_list if name in valid_names]
        except Exception as e:
            active_agents_list = ["Cardiologist", "Psychologist", "Pulmonologist", "Neurologist"]
            
        if not active_agents_list:
            active_agents_list = ["Cardiologist", "Psychologist", "Pulmonologist", "Neurologist"]
            
        # Stream the supervisor selection event
        yield json.dumps({
            "type": "supervisor_decision",
            "active_agents": active_agents_list,
            "duration": supervisor_duration
        }) + "\n"
        
        # 2. Instantiate and run only selected agents
        agent_mapping = {
            "Cardiologist": Cardiologist(api_key=api_key),
            "Psychologist": Psychologist(api_key=api_key),
            "Pulmonologist": Pulmonologist(api_key=api_key),
            "Neurologist": Neurologist(api_key=api_key)
        }
        selected_agents = [agent_mapping[name] for name in active_agents_list]
        
        # Helper to run synchronous LLM calls in a background thread
        async def run_agent(agent):
            loop = asyncio.get_event_loop()
            start_t = time.perf_counter()
            result = await loop.run_in_executor(None, agent.execute, patient_data)
            end_t = time.perf_counter()
            duration = round(end_t - start_t, 2)
            
            clean_res, confidence = parse_confidence_and_clean(result)
            return agent.role, clean_res, confidence, duration

        # Start active agents concurrently
        tasks = [asyncio.create_task(run_agent(a)) for a in selected_agents]
        agent_reports = {}
        agent_metrics = {}
        
        # Yield results AS THEY FINISH
        for coro in asyncio.as_completed(tasks):
            role, res, confidence, duration = await coro
            agent_reports[role] = res
            agent_metrics[role] = {
                "confidence": confidence,
                "duration": duration
            }
            # Stream the individual completion to the frontend with metrics
            yield json.dumps({
                "type": "agent_done", 
                "role": role, 
                "result": res,
                "confidence": confidence,
                "duration": duration
            }) + "\n"
        
        # 3. Once selected agents are done, run the aggregator
        aggregator = MultidisciplinaryTeam(api_key=api_key)
        loop = asyncio.get_event_loop()
        start_t = time.perf_counter()
        consensus = await loop.run_in_executor(None, aggregator.execute, agent_reports)
        end_t = time.perf_counter()
        agg_duration = round(end_t - start_t, 2)
        
        clean_consensus, agg_confidence = parse_confidence_and_clean(consensus)
        
        # Save session context
        traces_text = "\n\n".join([f"--- {role} ---\n{res}" for role, res in agent_reports.items()])
        session_store[session_id] = {
            "original_data": patient_data, 
            "traces": traces_text, 
            "consensus": clean_consensus,
            "metrics": {
                "supervisor": {
                    "duration": supervisor_duration,
                    "active_agents": active_agents_list
                },
                "agents": agent_metrics,
                "aggregator": {
                    "confidence": agg_confidence,
                    "duration": agg_duration
                }
            }
        }
        
        # Stream the final result
        yield json.dumps({
            "type": "consensus", 
            "session_id": session_id, 
            "consensus": clean_consensus,
            "confidence": agg_confidence,
            "duration": agg_duration
        }) + "\n"

    # Return as a stream
    return StreamingResponse(generate_stream(), media_type="application/x-ndjson")

@app.get("/download_log/{session_id}")
async def download_log(session_id: str):
    context = session_store.get(session_id)
    if not context:
        return JSONResponse({"error": "Session not found"}, status_code=404)
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    metrics = context.get('metrics', {})
    sup_metrics = metrics.get('supervisor', {})
    agents_metrics = metrics.get('agents', {})
    agg_metrics = metrics.get('aggregator', {})
    
    metrics_str = "=================================================\n" \
                  " EXECUTION PERFORMANCE & CONFIDENCE METRICS \n" \
                  "=================================================\n"
    metrics_str += f"- Supervisor (CMO): Duration: {sup_metrics.get('duration')}s | Selected: {', '.join(sup_metrics.get('active_agents', []))}\n"
    for role, m in agents_metrics.items():
        metrics_str += f"- {role}: Confidence: {m.get('confidence')}% | Duration: {m.get('duration')}s\n"
    metrics_str += f"- Consensus: Confidence: {agg_metrics.get('confidence', 'N/A')}% | Duration: {agg_metrics.get('duration', 'N/A')}s\n\n"
    
    # Format a comprehensive, compliance-ready log file
    log_content = (
        "=================================================\n"
        " MEDICONSENSUS AI - EU AI ACT COMPLIANCE TRACE LOG \n"
        "=================================================\n"
        f"Session ID: {session_id}\n"
        f"Timestamp: {timestamp}\n"
        "Model Environment: Hierarchical Parallel Multi-Agent (LLM)\n"
        "Status: COMPLETED\n\n"
        f"{metrics_str}"
        "--- ORIGINAL INPUT DATA ---\n"
        f"{context.get('original_data', 'N/A')}\n\n"
        "=================================================\n"
        " MULTIDISCIPLINARY AGENT TRACES \n"
        "=================================================\n"
        f"{context.get('traces', 'N/A')}\n\n"
        "=================================================\n"
        " FINAL CONSENSUS REPORT \n"
        "=================================================\n"
        f"{context.get('consensus', 'N/A')}\n"
        "=================================================\n"
        "End of Trace Log."
    )
    
    # The Content-Disposition header forces the browser to download it as a .txt file
    headers = {
        "Content-Disposition": f"attachment; filename=mediconsensus_trace_{session_id}.txt"
    }
    
    return PlainTextResponse(content=log_content, headers=headers)
@app.post("/chat")
async def chat_with_team(session_id: str = Form(...), message: str = Form(...), api_key: str = Form(None)):
    context = session_store.get(session_id)
    if not context: return JSONResponse({"error": "Session not found"}, status_code=404)
    
    prompt = prompts.CHAT_PROMPT.format(traces=context['traces'], consensus=context['consensus'], message=message)
    api_key_to_use = api_key if api_key else os.environ.get("GROQ_API_KEY")
    response = ChatGroq(temperature=0.3, model="llama-3.3-70b-versatile", api_key=api_key_to_use).invoke(prompt)
    return {"reply": response.content}

class KeyValidationRequest(BaseModel):
    provider: str
    api_key: str

@app.post("/api/validate_key")
async def validate_api_key(req: KeyValidationRequest):
    try:
        api_key = req.api_key
        # We test with a lightweight request
        test_client = ChatGroq(temperature=0, model="llama-3.3-70b-versatile", api_key=api_key)
        response = test_client.invoke("Reply with 'OK'")
        
        if response and response.content:
            return {"status": "success", "message": f"Successfully connected to {req.provider}"}
        else:
            return {"status": "error", "message": "Received empty response from provider."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)