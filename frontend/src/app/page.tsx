'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../hooks/useAuthStore';
import { useRouter } from 'next/navigation';
import { Activity, Shield, Users, Cpu, FileText, ChevronDown, Check, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [hospital, setHospital] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Redirect if logged in
  if (isAuthenticated) {
    router.push('/dashboard');
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = authMode === 'login' 
        ? { email, password }
        : { name, email, password, role: 'doctor', hospital };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
      setIsAuthOpen(false);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Glow Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Activity size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            MediConsensus
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 pt-20 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border-slate-700/50 text-xs font-medium text-blue-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Empowering Modern Clinical Boards with Multi-Agent AI
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-8">
            Collaborative Medical Diagnostics{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Powered by Consensus
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            Upload patient reports. Query standard LLM medical board specialists concurrently. Compute mathematical agreement indexes. Enable safe physician-driven overrides.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
              className="w-full sm:w-auto px-8 py-4 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group transition-all"
            >
              Initialize Diagnostic Console
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
              className="w-full sm:w-auto px-8 py-4 font-bold text-slate-300 hover:text-white glass rounded-xl border-slate-700/60 hover:border-slate-500/80 transition-all"
            >
              Sign in as Provider
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-8 py-24 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Enterprise Core Capabilities</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Cpu className="text-blue-400" size={32} />,
              title: "Parallel AI Specialists",
              desc: "Run diagnosis inquiries across GPT-4, Claude, Gemini, DeepSeek, and Llama models concurrently, capturing distinct medical perspectives."
            },
            {
              icon: <Activity className="text-indigo-400" size={32} />,
              title: "Consensus Engine",
              desc: "Synthesize diagnostics. Highlight absolute points of agreement, critical medical discrepancies, and evaluate safety risks instantly."
            },
            {
              icon: <Users className="text-emerald-400" size={32} />,
              title: "Clinical Collaboration",
              desc: "Physicians coordinate actions directly on patient timelines using nested comment threads, mentions, and override approvals."
            }
          ].map((item, idx) => (
            <div key={idx} className="glass p-8 rounded-2xl border-slate-800/80 hover:border-slate-700/50 transition-all group hover:-translate-y-1">
              <div className="p-3 bg-slate-900/60 w-fit rounded-xl border border-slate-800 mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing / Plan */}
      <section className="px-8 py-24 bg-slate-950/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Simple Hospital & Clinic Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-400 mb-2">Sandbox Practitioner</h3>
                <div className="text-4xl font-bold mb-6">$0<span className="text-sm text-slate-500 font-normal"> / month</span></div>
                <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Full Mock AI Diagnostic Sandbox</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Upload PDF and Text Reports</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Consensus Score Synthesis</li>
                </ul>
              </div>
              <button 
                onClick={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
                className="w-full py-3 glass hover:bg-slate-900 border-slate-800 text-sm font-semibold rounded-xl transition-all"
              >
                Launch Sandbox
              </button>
            </div>
            <div className="glass p-8 rounded-2xl border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-slate-950/50 flex flex-col justify-between relative">
              <span className="absolute top-4 right-4 text-xs font-semibold text-blue-400 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">Popular</span>
              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-2">Clinical Enterprise</h3>
                <div className="text-4xl font-bold mb-6">$299<span className="text-sm text-slate-500 font-normal"> / month</span></div>
                <ul className="space-y-3.5 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Live OpenRouter LLM API Integration</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Parallel Live Queries (GPT-4, Claude, Gemini)</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Advanced HIPAA Compliant DB Audit Logs</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Multi-doctor collaborative threads</li>
                </ul>
              </div>
              <button 
                onClick={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25"
              >
                Initiate Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-8 py-24 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "Is MediConsensus HIPAA compliant?", a: "Yes. Our architecture ensures that all processed patient files utilize secure cloud infrastructure, and private diagnostic documents remain strictly encrypted at rest and in transit." },
            { q: "How does the Consensus Engine identify contradictions?", a: "It evaluates primary output vectors (suggested disease labels, confidence thresholds, and treatment actions) and groups them statistically. An advanced AI Board synthesizer distills specific model deviations." },
            { q: "Can we configure custom AI medical models?", a: "Yes. In the workspace diagnostic page, physicians check/uncheck models depending on specialized diagnostic domains (e.g. Claude for complex narratives, Llama/Mistral for local fast inference)." }
          ].map((faq, idx) => (
            <div key={idx} className="glass rounded-xl border-slate-800/80 overflow-hidden">
              <button 
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-slate-200 hover:text-white transition-colors"
              >
                {faq.q}
                <ChevronDown size={18} className={`transform transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>&copy; 2026 MediConsensus Collaborative Diagnostics Platform. All rights reserved.</p>
        <p className="mt-2 text-slate-600">Enterprise grade medical AI decision-support utility. All models require manual physician authorization before clinical action.</p>
      </footer>

      {/* Authentication Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass max-w-md w-full p-8 rounded-2xl border-slate-850 relative"
            >
              <button 
                onClick={() => setIsAuthOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>

              <h3 className="text-2xl font-bold mb-2">
                {authMode === 'login' ? '🔑 Physician Sign In' : '🩺 Create Practitioner Account'}
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                {authMode === 'login' 
                  ? 'Access your clinical dashboard and patient records.' 
                  : 'Register to analyze clinical documents via multi-agent board consensus.'}
              </p>

              {errorMsg && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-xl mb-4">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Sarah Smith"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hospital Affiliation</label>
                      <input 
                        type="text" 
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        placeholder="Mayo Clinic Neurology Dept"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none" 
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.smith@hospital.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Secret Key Password</label>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all mt-4"
                >
                  {authMode === 'login' ? 'Authenticate' : 'Register Secure Profile'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-400">
                {authMode === 'login' ? (
                  <p>
                    New provider?{' '}
                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="text-blue-400 hover:underline"
                    >
                      Create Account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already registered?{' '}
                    <button 
                      onClick={() => setAuthMode('login')}
                      className="text-blue-400 hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
