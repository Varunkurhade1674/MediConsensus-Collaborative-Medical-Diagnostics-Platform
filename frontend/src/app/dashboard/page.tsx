'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../hooks/useAuthStore';
import { 
  FileUp, Activity, CheckCircle, Clock, AlertTriangle, Users, LogOut, ArrowRight, User as UserIcon, PlusCircle, Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user, token, logout, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  // State for new patient upload form
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [medicalHistory, setMedicalHistory] = useState('');
  
  // Upload file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // List states
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isReportsLoading, setIsReportsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchDashboardData = async () => {
    try {
      if (!token) return;
      
      // Get Reports list
      const repRes = await fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const repData = await repRes.json();
      if (repRes.ok) setReports(repData);

      // Get dashboard stats
      const statsRes = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      setIsReportsLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please choose a medical file to process.");
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading record securely to database...');
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patientName', patientName);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('bloodGroup', bloodGroup);
      formData.append('medicalHistory', medicalHistory);

      const res = await fetch('/api/reports/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setUploadProgress(70);
      setUploadStatus('OCR Processing & clinical details parsing completed.');

      // Wait a moment, then automatically route to the diagnostics panel
      setTimeout(() => {
        setUploadProgress(100);
        router.push(`/diagnose/${data.report._id}`);
      }, 1000);

    } catch (err: any) {
      alert(err.message);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      {/* Top Console Bar */}
      <header className="glass-nav sticky top-0 z-40 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Activity size={20} />
          </div>
          <span className="font-bold tracking-tight text-slate-100">MediConsensus Console</span>
          <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            {user?.hospital || 'Local Practitioner'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-sm font-semibold">
              {user?.name.split(' ').pop()?.charAt(0) || 'D'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            title="Log Out Securely"
            className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-400 border border-transparent hover:border-red-500/20 transition-all active:scale-95"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Stats Grid */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Board Diagnoses', val: stats?.summary?.totalReports || 0, icon: <Activity className="text-blue-400" /> },
            { label: 'Consensus Rate', val: `${stats?.summary?.consensusRate || 100}%`, icon: <CheckCircle className="text-emerald-400" /> },
            { label: 'Unresolved Cases', val: stats?.summary?.pendingReports || 0, icon: <Clock className="text-amber-400" /> },
            { label: 'Board Doctors', val: stats?.summary?.totalDoctors || 0, icon: <Users className="text-indigo-400" /> }
          ].map((card, idx) => (
            <div key={idx} className="glass p-6 rounded-2xl flex items-center justify-between border-slate-800/80">
              <div>
                <div className="text-xs text-slate-400 font-medium mb-1">{card.label}</div>
                <div className="text-2xl font-bold">{card.val}</div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Content Workspace Split */}
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Upload and Patient Info Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass p-8 rounded-2xl border-slate-800/85">
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <FileUp className="text-blue-400" size={20} />
                Ingest Patient Records
              </h2>
              <p className="text-xs text-slate-400 mb-6">Create patient file and upload lab evaluations, neurology scripts, or diagnostics notes.</p>
              
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Patient Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Eleanor Vance"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Age</label>
                    <input 
                      type="number" 
                      required 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="54"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gender</label>
                    <select 
                      value={gender} 
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none text-slate-300"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Blood Group</label>
                    <input 
                      type="text" 
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      placeholder="A+"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Patient Clinical History</label>
                  <textarea 
                    rows={2}
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="E.g. History of chronic hypertension managed with Lisinopril..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-blue-500 focus:outline-none resize-none" 
                  />
                </div>

                {/* Drag and Drop Zone */}
                <div className="border border-dashed border-slate-700/60 bg-slate-900/30 hover:bg-slate-900/50 hover:border-blue-500/50 rounded-2xl p-6 transition-all text-center relative cursor-pointer group">
                  <input 
                    type="file" 
                    required 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <FileUp className="mx-auto mb-3 text-slate-500 group-hover:scale-110 transition-transform group-hover:text-blue-400" size={32} />
                  <div className="text-xs font-semibold text-slate-300 mb-1">
                    {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload diagnosis record'}
                  </div>
                  <div className="text-[10px] text-slate-500">Supports PDF, TXT, DOCX up to 10MB</div>
                </div>

                {/* Progress bar */}
                {isUploading && (
                  <div className="space-y-2 mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span>{uploadStatus}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                >
                  <PlusCircle size={16} />
                  Ingest and Analyze Record
                </button>
              </form>
            </div>
          </div>

          {/* Active Diagnoses / Recent list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-2xl border-slate-800/85">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="text-blue-400 animate-pulse" size={18} />
                Medical Cases Board
              </h2>

              {isReportsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-xl bg-slate-900 animate-pulse" />
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No medical cases found. Ingest a record to begin.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {reports.map((report) => (
                    <div 
                      key={report._id}
                      onClick={() => router.push(`/diagnose/${report._id}`)}
                      className="p-4 bg-slate-950/45 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {report.patientId?.name || 'Unknown Patient'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {report.fileName}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          report.status === 'complete' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                            : report.status === 'processing'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10 animate-pulse'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                        }`}>
                          {report.status}
                        </span>
                        <ArrowRight size={14} className="text-slate-500 group-hover:text-slate-300 transform group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Logs / Activity */}
            <div className="glass p-6 rounded-2xl border-slate-800/85">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Board Activity Logs</h2>
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 text-[11px]">
                {stats?.recentActivities?.map((act: any) => (
                  <div key={act._id} className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-200">{act.userId?.name || 'Dr. Guest'} </span>
                      <span className="text-slate-400">{act.details}</span>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
