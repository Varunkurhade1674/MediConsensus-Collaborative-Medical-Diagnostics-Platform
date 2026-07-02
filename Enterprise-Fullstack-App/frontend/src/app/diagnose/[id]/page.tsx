'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { 
  ArrowLeft, Cpu, Users, Award, ShieldAlert, Sparkles, MessageSquare, Mic, Volume2, Send, Save, CheckCircle
} from 'lucide-react';

export default function DiagnosePage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const id = params?.id as string;

  // UI state
  const [report, setReport] = useState<any>(null);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [consensus, setConsensus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Model selection
  const [selectedModels, setSelectedModels] = useState<string[]>(['GPT-4', 'Claude', 'Gemini']);
  const availableModels = ['GPT-4', 'Claude', 'Gemini', 'DeepSeek', 'Nemotron', 'Mistral', 'Llama'];

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Doctor override recommendation state
  const [recommendationOverride, setRecommendationOverride] = useState('');
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Speech helper state
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fetchCaseData = async () => {
    try {
      if (!token || !id) return;
      const res = await fetch(`/api/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        setAiResults(data.aiResults || []);
        setConsensus(data.consensus || null);
        if (data.consensus) {
          setRecommendationOverride(data.consensus.recommendations);
        }
      }

      // Fetch comments
      const commentRes = await fetch(`/api/reports/${id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const commentData = await commentRes.json();
      if (commentRes.ok) {
        setComments(commentData);
      }

      setIsLoading(false);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchCaseData();
    }
  }, [token, id]);

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev => 
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  const handleTriggerAnalysis = async () => {
    if (selectedModels.length === 0) {
      alert("Please select at least one AI model for the diagnostic board.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportId: id,
          models: selectedModels
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAiResults(data.aiResults);
      setConsensus(data.consensus);
      setRecommendationOverride(data.consensus.recommendations);
      
      // Refresh case file status
      fetchCaseData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOverrideSave = async () => {
    setIsSavingOverride(true);
    try {
      const res = await fetch(`/api/reports/${id}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recommendations: recommendationOverride
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      
      setConsensus(data.consensus);
      alert('Override saved and consensus report updated.');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/reports/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [...prev, data]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTextToSpeech = () => {
    const textToRead = consensus?.recommendations || recommendationOverride;
    if (!textToRead) return;

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsPlayingSpeech(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingSpeech(true);
    }
  };

  const handleSpeechToText = () => {
    // Check Web Speech API availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice Dictation (Speech-to-Text) is not supported by your browser. Please try Chrome or Safari.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewComment(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      {/* Top console bar */}
      <header className="glass-nav sticky top-0 z-40 flex items-center justify-between px-8 py-4">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="text-center font-bold tracking-tight text-slate-100">
          Diagnosis Board Console
        </div>
        <div className="text-xs text-slate-500 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
          Patient ID: {report?.patientId?._id?.substring(18)}
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto grid lg:grid-cols-4 gap-8">
        
        {/* Left column: Patient Summary & AI Model selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Details */}
          <div className="glass p-6 rounded-2xl border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Information</h3>
            <div className="space-y-2">
              <div className="text-lg font-bold">{report?.patientId?.name}</div>
              <div className="text-xs text-slate-400">
                Age: <span className="text-slate-200">{report?.patientId?.age}</span> | Gender: <span className="text-slate-200">{report?.patientId?.gender}</span>
              </div>
              <div className="text-xs text-slate-400">
                Blood Group: <span className="text-slate-200">{report?.patientId?.bloodGroup}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Clinical History:</span>
              <p className="mt-1 leading-relaxed">{report?.patientId?.medicalHistory || 'No historical clinical summaries loaded.'}</p>
            </div>
          </div>

          {/* AI Model Selector */}
          <div className="glass p-6 rounded-2xl border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-blue-400" />
              Configure Board Agents
            </h3>
            <div className="space-y-2">
              {availableModels.map(model => {
                const isSelected = selectedModels.includes(model);
                return (
                  <div 
                    key={model}
                    onClick={() => handleModelToggle(model)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-300' 
                        : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-semibold">{model}</span>
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleTriggerAnalysis}
              disabled={isAnalyzing}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-t border-white" />
                  Running Concurrently...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Assemble Boards
                </>
              )}
            </button>
          </div>
        </div>

        {/* Central & Right panels: AI Results & Consensus comparison */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* AI Diagnosis Cards list */}
          {aiResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu size={14} className="text-blue-400" /> Model Diagnostic Output
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {aiResults.map((res) => (
                  <div key={res._id} className="glass p-5 rounded-2xl border-slate-800/80 space-y-3 relative group overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-blue-400">{res.modelName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        {res.confidence}% Conf.
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-300">Diagnosis</div>
                      <p className="text-xs leading-relaxed text-slate-200">{res.diagnosis}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400">Reasoning summary</div>
                      <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                        {res.reasoningSummary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consensus Findings and recommendations */}
          {consensus && (
            <div className="glass p-8 rounded-2xl border-slate-800/80 space-y-6 bg-gradient-to-tr from-slate-950/60 to-indigo-950/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Award className="text-blue-400" size={22} />
                    Consensus Diagnosis Report
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Aggregated board comparison based on {aiResults.length} models.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Agreement Index</div>
                    <div className="text-2xl font-black text-blue-400">{consensus.consensusScore}%</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-blue-500/30 bg-blue-500/10 flex items-center justify-center font-bold text-blue-300 text-sm">
                    {consensus.consensusScore >= 80 ? 'HIGH' : 'MED'}
                  </div>
                </div>
              </div>

              {/* Findings Matching Accordion List */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Agreed Findings</h4>
                  <div className="space-y-2">
                    {consensus.findingsMatch?.map((match: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs space-y-1">
                        <div className="font-semibold text-slate-200">{match.finding}</div>
                        <div className="text-[10px] text-slate-500">
                          Agreed by: <span className="text-blue-400">{match.agreeingModels.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-500" /> Contradictions & Risks
                  </h4>
                  <div className="space-y-2">
                    {consensus.disagreements?.map((dis: any, idx: number) => (
                      <div key={idx} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs space-y-1">
                        <div className="font-semibold text-amber-300">{dis.topic}</div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{dis.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Doctors Override Text Area */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    Consensus Treatment Protocol / Recommendations
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleTextToSpeech}
                      title="Listen to Protocol"
                      className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                        isPlayingSpeech 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Volume2 size={14} />
                      {isPlayingSpeech ? 'Stop' : 'Listen'}
                    </button>
                  </div>
                </div>
                <textarea 
                  rows={4}
                  value={recommendationOverride}
                  onChange={(e) => setRecommendationOverride(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                />
                
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Report review status: <b className="capitalize text-slate-400">{consensus.status}</b></span>
                  <button 
                    onClick={handleOverrideSave}
                    disabled={isSavingOverride}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-blue-500/10"
                  >
                    <Save size={12} />
                    Approve and Sign Override
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Doctor Collaboration & comments Section */}
          <div className="glass p-6 rounded-2xl border-slate-800/80 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-400" />
              Physician Consultation Thread
            </h3>

            {/* Existing Comments list */}
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No consultation logs. Add a message to coordinate diagnostics.
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] text-indigo-400 font-bold">
                          {comment.authorId?.name.split(' ').pop()?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200">{comment.authorId?.name}</span>
                          <span className="text-[9px] text-slate-500 ml-2">
                            {comment.authorId?.hospital || 'Hospital Affiliated'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-8">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment input form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
              <button 
                type="button"
                onClick={handleSpeechToText}
                title="Voice Dictation"
                className={`p-3 rounded-xl border transition-colors flex-shrink-0 ${
                  isRecording 
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Mic size={16} />
              </button>
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isRecording ? "Listening to voice dictation..." : "Add board comment, type @Dr. to tag..."}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs focus:border-blue-500 focus:outline-none"
              />
              <button 
                type="submit"
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
