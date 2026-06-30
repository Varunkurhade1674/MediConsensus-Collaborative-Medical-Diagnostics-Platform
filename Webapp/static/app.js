// --- Theme Toggle Control ---
const themeToggleBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');

if (initialTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
} else {
    document.documentElement.setAttribute('data-theme', 'light');
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const chatBtn = document.getElementById('chat-btn');
const logCont = document.getElementById('log-container');
const timelineTrack = document.getElementById('timeline-track');
const gaugesContainer = document.getElementById('gauges-container');
const metricsPanel = document.getElementById('metrics-panel');

function addTimelineItem(role, duration) {
    const item = document.createElement('div');
    item.className = 'timeline-item completed';
    let colorClass = 'cardio';
    if (role.toLowerCase().includes('psych')) colorClass = 'psych';
    else if (role.toLowerCase().includes('pulmo')) colorClass = 'pulmo';
    else if (role.toLowerCase().includes('neuro')) colorClass = 'neuro';
    else if (role.toLowerCase().includes('team') || role.toLowerCase().includes('consensus')) colorClass = 'consensus';
    
    item.innerHTML = `
        <span class="time-dot ${colorClass}"></span>
        <span class="time-label">${role} Completed</span>
        <span class="time-value">+${duration}s</span>
    `;
    timelineTrack.appendChild(item);
    timelineTrack.scrollTop = timelineTrack.scrollHeight;
}

function addConfidenceGauge(role, confidence) {
    let colorClass = 'cardio';
    if (role.toLowerCase().includes('psych')) colorClass = 'psych';
    else if (role.toLowerCase().includes('pulmo')) colorClass = 'pulmo';
    else if (role.toLowerCase().includes('neuro')) colorClass = 'neuro';
    else if (role.toLowerCase().includes('team') || role.toLowerCase().includes('consensus')) colorClass = 'consensus';
    
    const gaugeItem = document.createElement('div');
    gaugeItem.className = `gauge-item ${colorClass}`;
    gaugeItem.innerHTML = `
        <div class="gauge-header">
            <span class="gauge-name">${role}</span>
            <span class="gauge-pct">${confidence}%</span>
        </div>
        <div class="gauge-bar-bg">
            <div class="gauge-bar-fill" style="width: 0%"></div>
        </div>
    `;
    gaugesContainer.appendChild(gaugeItem);
    
    setTimeout(() => {
        const fill = gaugeItem.querySelector('.gauge-bar-fill');
        if (fill) fill.style.width = `${confidence}%`;
    }, 50);
}

let session = "";

window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        location.reload();
    }
});

// --- Zoom Controls ---
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const canvasEl = document.querySelector('.canvas');
const downloadLogBtn = document.getElementById('download-log-btn');
// Function to read the current scale from CSS, regardless of media queries
function getCanvasScale() {
    const transform = window.getComputedStyle(canvasEl).getPropertyValue('transform');
    if (transform !== 'none') {
        const matrix = transform.match(/^matrix\((.+)\)$/);
        if (matrix) return parseFloat(matrix[1].split(', ')[0]);
    }
    return 1;
}

// Ensure we grab the base scale initially applied by CSS
let currentScale = getCanvasScale();

zoomInBtn.addEventListener('click', () => {
    currentScale += 0.1;
    canvasEl.style.transform = `scale(${currentScale})`;
});

zoomOutBtn.addEventListener('click', () => {
    currentScale -= 0.1;
    canvasEl.style.transform = `scale(${currentScale})`;
});

function addBubble(text, type = "system") {
    const b = document.createElement('div');
    b.className = `bubble ${type}`;
    
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    b.innerHTML = formattedText;
    chatContainer.appendChild(b);
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

downloadLogBtn.addEventListener('click', () => {
    if (session) {
        // Pointing the window location to this endpoint automatically triggers the browser's file download behavior
        window.location.href = `/download_log/${session}`;
    }
});

function setProcessing(selector, isActive) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        isActive ? el.classList.add('processing') : el.classList.remove('processing');
    });
}
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', e => { 
    e.preventDefault(); 
    dropzone.classList.add('dragover'); 
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => { 
    e.preventDefault(); 
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); 
});
fileInput.addEventListener('change', e => { 
    if (e.target.files.length) handleFile(e.target.files[0]); 
});

function getDotRole(agentName) {
    const name = agentName.toLowerCase();
    if (name.includes("cardio")) return "cardio";
    if (name.includes("psych")) return "psych";
    if (name.includes("pulmo")) return "pulmo";
    if (name.includes("neuro")) return "neuro";
    return name;
}

async function handleFile(file) {
    document.getElementById('n-doc').classList.remove('pulse');
    const pageEl = document.querySelector('.page');
    if (pageEl) {
        pageEl.classList.remove('state-upload');
        pageEl.classList.add('state-process');
    }

    // Reset metrics panel
    timelineTrack.innerHTML = `
        <div class="timeline-item completed" id="time-upload">
            <span class="time-dot"></span>
            <span class="time-label">Dossier Uploaded</span>
            <span class="time-value">0.0s</span>
        </div>
    `;
    gaugesContainer.innerHTML = '';
    
    // Reset all nodes state
    const allNodes = ['n-cmo', 'n-cardio', 'n-psych', 'n-pulmo', 'n-neuro', 'n-llm', 'n-final'];
    allNodes.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('done', 'processing', 'bypassed');
            delete el.dataset.result;
            if (id === 'n-final') el.style.opacity = '0.5';
        }
    });
    
    // Reset all dots
    document.querySelectorAll('.dot').forEach(el => el.classList.remove('active'));

    setTimeout(async () => {
        // Start Phase 0: Dossier to CMO
        document.querySelectorAll('.phase-cmo').forEach(el => el.classList.add('active')); 
        document.querySelectorAll('.phase-cmo animateMotion').forEach(anim => anim.beginElement()); 

        setTimeout(() => {
            document.querySelectorAll('.phase-cmo').forEach(el => el.classList.remove('active'));
            setProcessing('#n-cmo', true); 
            document.getElementById('working-text').classList.add('active');
        }, 1000);

        const fd = new FormData(); 
        fd.append("file", file);
        const apiKey = savedApiKey || "";
        fd.append("api_key", apiKey);
        
        try {
            const res = await fetch('/analyze', { method: 'POST', body: fd });
            
            if (!res.ok) {
                let errorMsg = "An error occurred while analyzing the file.";
                try {
                    const errJson = await res.json();
                    if (errJson && errJson.error) {
                        errorMsg = errJson.error;
                    }
                } catch (_) {}
                
                alert(`⚠️ Error: ${errorMsg}`);
                
                // Reset page state
                const pageEl = document.querySelector('.page');
                if (pageEl) {
                    pageEl.classList.remove('state-process');
                    pageEl.classList.add('state-upload');
                }
                document.getElementById('n-doc').classList.add('pulse');
                return;
            }
            
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            
            let buffer = "";
            let consensusData = null;
            let agentsDoneCount = 0;
            let activeAgents = [];

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                let boundary = buffer.indexOf('\n');
                
                while (boundary !== -1) {
                    const chunk = buffer.slice(0, boundary).trim();
                    buffer = buffer.slice(boundary + 1);
                    boundary = buffer.indexOf('\n');
                    
                    if (chunk) {
                        const data = JSON.parse(chunk);
                        
                        if (data.type === "supervisor_decision") {
                            activeAgents = data.active_agents;
                            
                            // CMO node completes
                            const cmoEl = document.getElementById('n-cmo');
                            cmoEl.classList.remove('processing');
                            cmoEl.classList.add('done');
                            
                            addTimelineItem("CMO Screening", data.duration);
                            addTimelineItem("Specialists Selected: " + activeAgents.join(", "), 0);
                            
                            // Set specialists states
                            const specialists = ["Cardiologist", "Psychologist", "Pulmonologist", "Neurologist"];
                            specialists.forEach(agent => {
                                const role = agent.toLowerCase();
                                let nodeId = "";
                                if (role.includes("cardio")) nodeId = "n-cardio";
                                else if (role.includes("psych")) nodeId = "n-psych";
                                else if (role.includes("pulmo")) nodeId = "n-pulmo";
                                else if (role.includes("neuro")) nodeId = "n-neuro";
                                
                                const el = document.getElementById(nodeId);
                                if (el) {
                                    if (activeAgents.includes(agent)) {
                                        el.classList.add("processing");
                                        
                                        // Animate dot from CMO to this specialist
                                        const dotRole = getDotRole(agent);
                                        const dot = document.getElementById(`dot-p1-${dotRole}`);
                                        if (dot) {
                                            dot.classList.add('active');
                                            const anim = dot.querySelector('animateMotion');
                                            if (anim) anim.beginElement();
                                        }
                                    } else {
                                        el.classList.add("bypassed");
                                    }
                                }
                            });
                        }
                        else if (data.type === "agent_done") {
                            const role = data.role.toLowerCase();
                            let nodeId = "";
                            if (role.includes("cardio")) nodeId = "n-cardio";
                            else if (role.includes("psych")) nodeId = "n-psych";
                            else if (role.includes("pulmo")) nodeId = "n-pulmo";
                            else if (role.includes("neuro")) nodeId = "n-neuro";
                            
                            if (nodeId) {
                                const el = document.getElementById(nodeId);
                                el.classList.remove("processing");
                                el.classList.add("done");
                                el.dataset.result = data.result; 
                            }

                            // Dynamic Metrics Addition
                            addTimelineItem(data.role, data.duration);
                            addConfidenceGauge(data.role, data.confidence);

                            agentsDoneCount++;
                            if (agentsDoneCount === activeAgents.length) {
                                document.getElementById('working-text').classList.remove('active');
                                
                                // Deactivate phase1 dots
                                document.querySelectorAll('.phase1').forEach(el => el.classList.remove('active'));
                                
                                // Activate Phase 2 dots from active agents to LLM
                                activeAgents.forEach(agent => {
                                    const dotRole = getDotRole(agent);
                                    const dot = document.getElementById(`dot-p2-${dotRole}`);
                                    if (dot) {
                                        dot.classList.add('active');
                                        const anim = dot.querySelector('animateMotion');
                                        if (anim) anim.beginElement();
                                    }
                                });

                                // let's put 2s delay for dots flight
                                setTimeout(() => { 
                                    setProcessing('#n-llm', true);
                                }, 2000);
                            }
                        } 
                        else if (data.type === "consensus") {
                            consensusData = data;
                            session = data.session_id;
                        }
                    }
                }
            }

            const teamThinkingTime = Math.floor(Math.random() * (6000 - 2500 + 1)) + 2500;

            setTimeout(() => {
                setProcessing('#n-llm', false); 
                document.querySelectorAll('.phase2').forEach(el => el.classList.remove('active'));
                
                // Animate final phase 3 dot
                document.querySelectorAll('.phase3').forEach(el => el.classList.add('active'));
                document.querySelectorAll('.phase3 animateMotion').forEach(anim => anim.beginElement());
                
                setTimeout(() => {
                    document.querySelectorAll('.phase3').forEach(el => el.classList.remove('active'));
                    document.getElementById('n-final').style.opacity = '1';
                    document.getElementById('n-final').classList.add('done');
                    
                    const pageEl = document.querySelector('.page');
                    if (pageEl) {
                        pageEl.classList.remove('state-process');
                        pageEl.classList.add('state-result');
                    }
    
                    // Add Consensus Metrics
                    addTimelineItem("Consensus Team", consensusData.duration);
                    addConfidenceGauge("Consensus Team", consensusData.confidence);
    
                    // time out of 1 second
                    setTimeout(() => {
                        logCont.classList.add('active'); 
                        addBubble(consensusData.consensus, "team");
                        downloadLogBtn.classList.remove('hidden');
                        chatContainer.scrollTop = 0;
                    }, 1000);
                }, 1500);

            }, teamThinkingTime);

        } catch (e) { 
            addBubble("Connection error. Please try again.", "system"); 
            console.error(e);
        }
    }, 2000);
}

const tooltip = document.getElementById('tooltip');
let tooltipTimeout;

document.querySelectorAll('.agent').forEach(node => {
    node.addEventListener('mouseenter', (e) => {
        clearTimeout(tooltipTimeout);
        
        if (node.classList.contains('done') && node.dataset.result) {
            const title = node.innerText.trim();
            let formatted = node.dataset.result
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\n/g, '<br>');
            
            tooltip.innerHTML = `<div class="tooltip-title">${title} Notes:</div><div class="tooltip-content">${formatted}</div>`;
            tooltip.classList.add('visible');
            
            const rect = node.getBoundingClientRect();
            const tooltipHeight = tooltip.offsetHeight;
            const windowHeight = window.innerHeight;
            
            let topPosition = rect.top;
            
            // Adjust vertical bounds
            if (topPosition + tooltipHeight > windowHeight - 20) {
                topPosition = windowHeight - tooltipHeight - 20;
            }
            if (topPosition < 20) {
                topPosition = 20; 
            }
            
            let leftPosition = rect.right + 20;
            
            // Responsive logic: Adjust horizontal bounds to prevent screen clipping
            const tipWidth = tooltip.offsetWidth || 340; // fallback to CSS default if 0
            if (leftPosition + tipWidth > window.innerWidth - 20) {
                // Try moving it to the left of the node
                leftPosition = rect.left - tipWidth - 20;
                
                // If it ALSO clips on the left (very small screens), center it
                if (leftPosition < 10) {
                    leftPosition = Math.max(10, (window.innerWidth / 2) - (tipWidth / 2));
                    topPosition = rect.bottom + 15; // move directly beneath the node
                }
            }
            
            tooltip.style.left = leftPosition + 'px';
            tooltip.style.top = topPosition + 'px';
        }
    });
    
    node.addEventListener('mouseleave', () => {
        tooltipTimeout = setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 250);
    });

    node.addEventListener('wheel', (e) => {
        if (tooltip.classList.contains('visible')) {
            const content = tooltip.querySelector('.tooltip-content');
            if (content) {
                content.scrollTop += e.deltaY;
                e.preventDefault();
            }
        }
    }, { passive: false });
});

tooltip.addEventListener('mouseenter', () => {
    clearTimeout(tooltipTimeout);
});

tooltip.addEventListener('mouseleave', () => {
    tooltipTimeout = setTimeout(() => {
        tooltip.classList.remove('visible');
    }, 250);
});

async function sendMessage() {
    const msg = chatInput.value.trim(); 
    if (!msg) return;
    
    addBubble(msg, "user"); 
    chatInput.value = ""; 
    
    const thinkingId = Date.now();
    addBubble("Team is typing...", `system thinking-${thinkingId}`);
    
        const apiKey = savedApiKey || "";
        try {
        const res = await fetch('/chat', { 
            method: 'POST', 
            body: new URLSearchParams({ session_id: session, message: msg, api_key: apiKey }) 
        });
        const data = await res.json();
        
        document.querySelector(`.thinking-${thinkingId}`).remove();
        addBubble(data.reply, "team");
    } catch (e) {
        addBubble("The team is currently unavailable.", "system");
    }
}

chatBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { 
    if (e.key === 'Enter') sendMessage(); 
});

// --- API Key Modal Logic ---
const apiKeyModal = document.getElementById('api-key-modal');
const modalApiKeyInput = document.getElementById('modal-api-key-input');
const providerSelect = document.getElementById('provider-select');
const modalSaveBtn = document.getElementById('modal-save-btn');
const testConnectionBtn = document.getElementById('test-connection-btn');
const demoModeBtn = document.getElementById('demo-mode-btn');
const rememberKeyCheckbox = document.getElementById('remember-key-checkbox');
const validationMessage = document.getElementById('validation-message');
const toggleVisibilityBtn = document.getElementById('toggle-key-visibility');
const toastContainer = document.getElementById('toast-container');

let savedApiKey = localStorage.getItem('auditflow_api_key') || sessionStorage.getItem('auditflow_api_key');

if (savedApiKey) {
    apiKeyModal.style.display = 'none';
} else {
    apiKeyModal.style.display = 'flex';
}

const openApiKeyBtn = document.getElementById('open-api-key-btn');
if (openApiKeyBtn) {
    openApiKeyBtn.addEventListener('click', () => {
        apiKeyModal.style.display = 'flex';
    });
}

toggleVisibilityBtn.addEventListener('click', () => {
    if (modalApiKeyInput.type === 'password') {
        modalApiKeyInput.type = 'text';
    } else {
        modalApiKeyInput.type = 'password';
    }
});

// Toast Helper
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `✅ ${message}`;
    toastContainer.appendChild(toast);
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3500);
}

// Validation API call
async function validateKey(provider, key) {
    try {
        const response = await fetch('/api/validate_key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: provider, api_key: key })
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: 'Failed to reach backend server.' };
    }
}

testConnectionBtn.addEventListener('click', async () => {
    const key = modalApiKeyInput.value.trim();
    if (!key) {
        validationMessage.className = 'validation-message error';
        validationMessage.innerText = 'Please enter an API Key to test.';
        return;
    }
    
    testConnectionBtn.disabled = true;
    testConnectionBtn.innerText = 'Testing...';
    validationMessage.style.display = 'none';
    
    const result = await validateKey(providerSelect.value, key);
    
    validationMessage.style.display = 'block';
    if (result.status === 'success') {
        validationMessage.className = 'validation-message success';
        validationMessage.innerText = 'Connection successful!';
    } else {
        validationMessage.className = 'validation-message error';
        validationMessage.innerText = result.message || 'Validation failed.';
    }
    
    testConnectionBtn.disabled = false;
    testConnectionBtn.innerText = 'Test Connection';
});

modalSaveBtn.addEventListener('click', async () => {
    const key = modalApiKeyInput.value.trim();
    if (!key) {
        validationMessage.style.display = 'block';
        validationMessage.className = 'validation-message error';
        validationMessage.innerText = 'Please enter a valid API Key.';
        return;
    }

    modalSaveBtn.disabled = true;
    modalSaveBtn.innerText = 'Validating...';
    
    const result = await validateKey(providerSelect.value, key);
    
    if (result.status === 'success') {
        if (rememberKeyCheckbox.checked) {
            localStorage.setItem('auditflow_api_key', key);
            sessionStorage.removeItem('auditflow_api_key');
        } else {
            sessionStorage.setItem('auditflow_api_key', key);
            localStorage.removeItem('auditflow_api_key');
        }
        savedApiKey = key;
        apiKeyModal.style.display = 'none';
        showToast('API Connected Successfully');
    } else {
        validationMessage.style.display = 'block';
        validationMessage.className = 'validation-message error';
        validationMessage.innerText = result.message || 'Validation failed.';
    }
    
    modalSaveBtn.disabled = false;
    modalSaveBtn.innerText = 'Save & Continue';
});

demoModeBtn.addEventListener('click', () => {
    savedApiKey = ''; // Uses backend fallback (.env)
    apiKeyModal.style.display = 'none';
    showToast('Demo Mode Enabled');
});
