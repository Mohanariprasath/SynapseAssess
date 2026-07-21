"use client";

import React, { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  ShieldAlert, 
  Activity, 
  Terminal, 
  BrainCircuit, 
  Cpu, 
  Sliders, 
  Eye, 
  User, 
  Calendar, 
  Trophy, 
  AlertTriangle 
} from 'lucide-react';

interface TelemetryLog {
  id: string;
  timestamp: number; // millisecond timestamp
  type: 'FULLSCREEN_DEVIATION' | 'LOOK_AWAY' | 'PASTE_TRIGGER' | 'FOCUS_LOST';
  label: string;
  color: string;
  description: string;
  metrics: {
    durationMs?: number;
    clipboardSize?: number;
    gazeAngleDegrees?: number;
    detectedScreens?: number;
    [key: string]: any;
  };
}

interface CandidateReportData {
  id: string;
  name: string;
  role: string;
  date: string;
  duration: string;
  overallScore: number;
  integrityScore: number;
  riskRating: 'Low' | 'Medium' | 'High';
  aiInsights: {
    technicalCore: string;
    codeClarity: string;
    sessionIntegrity: string;
  };
  telemetry: TelemetryLog[];
}

const mockReports: Record<string, CandidateReportData> = {
  'cand-001': {
    id: 'cand-001',
    name: 'Alex Rivera',
    role: 'Senior Frontend Engineer',
    date: 'July 2, 2026',
    duration: '45m 12s',
    overallScore: 94,
    integrityScore: 100,
    riskRating: 'Low',
    aiInsights: {
      technicalCore: "Demonstrated excellent command over React hooks optimization. Algorithmic complexity was ideal, utilizing map structures to solve stream transformations in O(N) time with minimal allocation footprints.",
      codeClarity: "Code styling adhered perfectly to clean architecture principles. Explanatory comments are sparse but highly contextual. Used logical variable namings and robust error catch blocks.",
      sessionIntegrity: "A perfect 100% integrity score. Browser fullscreen mode remained locked, focus was never lost, and webcam monitoring registered full-face gaze compliance across the entire duration."
    },
    telemetry: []
  },
  'cand-002': {
    id: 'cand-002',
    name: 'Jessica Chen',
    role: 'React Tech Lead',
    date: 'July 1, 2026',
    duration: '58m 30s',
    overallScore: 82,
    integrityScore: 78,
    riskRating: 'Medium',
    aiInsights: {
      technicalCore: "Excellent design patterns utilized for asynchronous buffers. However, the recursive approach inside the synchronizer could lead to stack depth exhausts for large datasets.",
      codeClarity: "Strong ES6 syntax. Structure was highly modular, separating state variables cleanly from DOM renders. Documentation headers could be slightly improved.",
      sessionIntegrity: "The candidate exited fullscreen mode once during the 40th minute. Two focus loss anomalies were caught, indicating switching to background communication windows."
    },
    telemetry: [
      {
        id: 'tel-01',
        timestamp: 1782900000000 + 600000, // +10 min
        type: 'PASTE_TRIGGER',
        label: 'Paste Anomaly Trigger',
        color: 'bg-yellow-500 text-yellow-950 border-yellow-400',
        description: 'Large content insertion detected in Monaco editor.',
        metrics: { clipboardSize: 320, pastedSnippet: 'const fetchBuffer = async (url) => { return new Promise(...' }
      },
      {
        id: 'tel-02',
        timestamp: 1782900000000 + 1500000, // +25 min
        type: 'LOOK_AWAY',
        label: 'Look-Away Event',
        color: 'bg-amber-500 text-amber-950 border-amber-400',
        description: 'Iris tracking telemetry registered gaze drift off-screen.',
        metrics: { gazeAngleDegrees: 34.5, durationMs: 4800 }
      },
      {
        id: 'tel-03',
        timestamp: 1782900000000 + 2400000, // +40 min
        type: 'FULLSCREEN_DEVIATION',
        label: 'Fullscreen Deviation',
        color: 'bg-rose-500 text-rose-950 border-rose-400',
        description: 'Exited secure screen state, triggering system lock screen.',
        metrics: { durationMs: 12500 }
      }
    ]
  },
  'cand-003': {
    id: 'cand-003',
    name: 'Marcus Vance',
    role: 'Full Stack Architect',
    date: 'June 30, 2026',
    duration: '22m 15s',
    overallScore: 31,
    integrityScore: 10,
    riskRating: 'High',
    aiInsights: {
      technicalCore: "Incomplete assessment. Coding flow was interrupted early. The initial class structures proposed had syntactic errors and unhandled reference exceptions.",
      codeClarity: "No coherent formatting. Development patterns indicated copy-pasting segments without refactoring variable bounds to match the problem schema.",
      sessionIntegrity: "Exam terminated. Flagged by continuous look-away metrics (suspected dual monitor secondary workspace) and 4 subsequent browser blur anomalies inside the first 20 minutes."
    },
    telemetry: [
      {
        id: 'tel-11',
        timestamp: 1782900000000 + 120000, // +2 min
        type: 'FOCUS_LOST',
        label: 'Focus Lost Anomaly',
        color: 'bg-orange-500 text-orange-950 border-orange-400',
        description: 'Application focus shifted away from exam browser tab.',
        metrics: { durationMs: 8200 }
      },
      {
        id: 'tel-12',
        timestamp: 1782900000000 + 360000, // +6 min
        type: 'LOOK_AWAY',
        label: 'Secondary Screen Gaze',
        color: 'bg-amber-500 text-amber-950 border-amber-400',
        description: 'Face orientation coordinates shifted, indicating secondary screen.',
        metrics: { gazeAngleDegrees: 48.0, durationMs: 14200 }
      },
      {
        id: 'tel-13',
        timestamp: 1782900000000 + 720000, // +12 min
        type: 'FULLSCREEN_DEVIATION',
        label: 'Fullscreen Exit',
        color: 'bg-rose-500 text-rose-950 border-rose-400',
        description: 'Candidate escaped fullscreen mode, locking code canvas.',
        metrics: { durationMs: 18000 }
      },
      {
        id: 'tel-14',
        timestamp: 1782900000000 + 1080000, // +18 min
        type: 'FOCUS_LOST',
        label: 'Focus Lost Anomaly',
        color: 'bg-orange-500 text-orange-950 border-orange-400',
        description: 'Workspace blur triggered. Screen captures reveal secondary IDE active.',
        metrics: { durationMs: 34000 }
      }
    ]
  }
};

export default function CandidateReport({ params }: { params: Promise<{ candidateId: string }> }) {
  const resolvedParams = use(params);
  const candidateId = resolvedParams.candidateId;
  
  // Dynamically resolve candidate data from localStorage or mockReports fallback
  const report = useMemo(() => {
    if (mockReports[candidateId]) {
      return mockReports[candidateId];
    }
    
    // Read dynamic sessions from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('completed_candidate_sessions');
      if (stored) {
        try {
          const sessions = JSON.parse(stored);
          const matched = sessions.find((s: any) => s.id === candidateId || s.id.toLowerCase() === candidateId.toLowerCase());
          if (matched) {
            return {
              id: matched.id,
              name: matched.name,
              role: matched.role || 'Software Engineer',
              date: matched.date || 'July 2026',
              duration: '35m 40s',
              overallScore: matched.aiScore || 90,
              integrityScore: matched.warnings > 0 ? (100 - matched.warnings * 25) : 100,
              riskRating: matched.riskRating || 'Low',
              aiInsights: {
                technicalCore: `Evaluated candidate submission for ${matched.role}. Algorithmic approach demonstrated sound structural understanding and clean modular separation.`,
                codeClarity: `Code style followed clean development practices with optimal time complexity bounds.`,
                sessionIntegrity: matched.warnings > 0 
                  ? `Recorded ${matched.warnings} security infractions during the proctored assessment session.`
                  : `Perfect integrity rating. Full screen and gaze tracking verification passed with zero infractions.`
              },
              telemetry: matched.warnings > 0 ? [
                {
                  id: 'tel-dyn-1',
                  timestamp: Date.now() - 300000,
                  type: 'FOCUS_LOST',
                  label: 'Focus Deviation Alert',
                  color: 'bg-amber-500 text-amber-950 border-amber-400',
                  description: 'Application focus shifted away from active proctoring room.',
                  metrics: { durationMs: 4200 }
                }
              ] : []
            };
          }
        } catch (e) {
          console.error("Error loading candidate dynamic report:", e);
        }
      }
    }

    return mockReports['cand-002'];
  }, [candidateId]);

  const [selectedLog, setSelectedLog] = useState<TelemetryLog | null>(
    report.telemetry.length > 0 ? report.telemetry[0] : null
  );

  // Structural Timeline Point Calculations (Percentage position along the track line)
  const timelineNodes = useMemo(() => {
    if (report.telemetry.length === 0) return [];
    
    const times = report.telemetry.map(t => t.timestamp);
    const minTime = Math.min(...times) - 60000; // Pad start by 1 min
    const maxTime = Math.max(...times) + 60000; // Pad end by 1 min
    const timeDelta = maxTime - minTime || 1;

    return report.telemetry.map(log => {
      const percentage = ((log.timestamp - minTime) / timeDelta) * 100;
      // Clamp between 5% and 95% for layout margins
      const clamped = Math.max(5, Math.min(95, percentage));
      
      const dateObj = new Date(log.timestamp);
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      const timeStr = `${minutes}:${seconds}`;

      return {
        ...log,
        position: clamped,
        timeStr
      };
    });
  }, [report.telemetry]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden select-none">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-6 gap-4">
          <div className="space-y-1">
            <Link 
              href="/recruiter/dashboard" 
              className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-200 transition mb-2 hover:underline underline-offset-4 decoration-slate-500 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Metrics Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">{report.name}</h1>
            <p className="text-xs text-slate-400 font-mono">Assessment ID: {report.id}</p>
          </div>
          
          <div className="flex items-center space-x-4 bg-slate-900/40 border border-slate-850 px-4 py-3 rounded-2xl">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Exam Role</span>
              <p className="text-xs font-semibold text-slate-200">{report.role}</p>
            </div>
            <span className="h-6 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Completed On</span>
              <p className="text-xs font-semibold text-slate-200">{report.date}</p>
            </div>
          </div>
        </div>

        {/* Global Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* OverAll Score Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex items-center space-x-5 shadow-lg">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border font-mono font-bold text-lg ${
              report.overallScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              report.overallScore >= 60 ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
              'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              {report.overallScore}%
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Algorithmic Grade</span>
              <h3 className="text-sm font-semibold text-white">Technical Core Performance</h3>
              <p className="text-xs text-slate-400">Total metrics composite grade</p>
            </div>
          </div>

          {/* Session Integrity Score Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex items-center space-x-5 shadow-lg">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border font-mono font-bold text-lg ${
              report.integrityScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              report.integrityScore >= 70 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              {report.integrityScore}%
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trust Rating</span>
              <h3 className="text-sm font-semibold text-white">Session Integrity Score</h3>
              <p className="text-xs text-slate-400">Computed via raw telemetry events</p>
            </div>
          </div>

          {/* Risk Level Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex items-center space-x-5 shadow-lg">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border font-mono font-bold text-xs uppercase ${
              report.riskRating === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              report.riskRating === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              {report.riskRating}
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Category</span>
              <h3 className="text-sm font-semibold text-white">Proctoring Risk Level</h3>
              <p className="text-xs text-slate-400">Calculated violation severity</p>
            </div>
          </div>
        </div>

        {/* Dynamic Diagnostics Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Area: Anomaly Timeline & Telemetry Inspector (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Custom Interactive Linear Timeline Chart */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-lg flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <Activity className="h-4 w-4 text-violet-400" />
                  <span>Interactive Anomaly Telemetry Timeline</span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Duration: {report.duration}</span>
                </div>
              </div>

              {report.telemetry.length > 0 ? (
                <div className="space-y-6 select-none py-4">
                  {/* Timeline Track Line Container */}
                  <div className="relative h-2.5 w-full bg-slate-950 border border-slate-850 rounded-full my-6">
                    {/* Glowing background gradient indicator */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-amber-500/10 to-rose-500/20 rounded-full" />
                    
                    {/* Node Tick Markers */}
                    {timelineNodes.map((node) => {
                      const isSelected = selectedLog?.id === node.id;
                      return (
                        <button
                          key={node.id}
                          onClick={() => setSelectedLog(node)}
                          style={{ left: `${node.position}%` }}
                          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${node.color} ${
                            isSelected 
                              ? 'scale-135 shadow-lg shadow-violet-500/30 border-white ring-4 ring-violet-500/10' 
                              : 'hover:scale-120 border-slate-950 opacity-80'
                          }`}
                          title={`${node.label} at ${node.timeStr}`}
                        >
                          <span className="h-1.5 w-1.5 bg-white rounded-full" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Relative timeline time legends */}
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
                    <span>0:00 (Start)</span>
                    <span>Timeline relative occurrences (Minutes:Seconds)</span>
                    <span>{report.duration} (End)</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No security telemetry anomalies flagged during this candidate session.
                </div>
              )}
            </div>

            {/* Telemetry Inspector Card Panel */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-3">
                <Terminal className="h-4 w-4 text-violet-400" />
                <span>Diagnostics Anomaly Inspector</span>
              </div>

              {selectedLog ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Parameter Panel */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Flagged Event</span>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          selectedLog.type === 'FULLSCREEN_DEVIATION' ? 'bg-rose-500' :
                          selectedLog.type === 'LOOK_AWAY' ? 'bg-amber-500' : 'bg-yellow-500'
                        }`} />
                        <span>{selectedLog.label}</span>
                      </h4>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incident Description</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedLog.description}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Time Elapsed</span>
                        <span className="text-xs font-mono font-semibold text-slate-200">
                          {(() => {
                            const node = timelineNodes.find(t => t.id === selectedLog.id);
                            return node ? `${node.timeStr} mins` : 'N/A';
                          })()}
                        </span>
                      </div>
                      <span className="h-6 w-px bg-slate-800" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Anomaly Code</span>
                        <span className="text-xs font-mono font-semibold text-slate-200">{selectedLog.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Raw JSON Parameter Panel */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-mono">
                        RAW_TELEMETRY_RECORD
                      </span>
                      <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap select-text leading-relaxed">
                        {JSON.stringify(selectedLog.metrics, null, 2)}
                      </pre>
                    </div>
                    <div className="text-right text-[9px] text-slate-600 font-mono mt-3">
                      PACKET_ID: {selectedLog.id}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Select a timeline event node to inspect hardware packet data.
                </div>
              )}
            </div>

          </div>

          {/* Right Area: AI Insights Summaries (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* General Candidate Profile Info */}
            <div className="bg-gradient-to-tr from-slate-900/80 to-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <User className="h-4 w-4 text-violet-400" />
                <span>Evaluation Metadata</span>
              </h3>
              
              <div className="space-y-3 text-xs text-slate-400">
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Standard Duration:</span>
                  <span className="text-slate-200 font-mono">60 mins limit</span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Actual Time Spent:</span>
                  <span className="text-slate-200 font-mono">{report.duration}</span>
                </div>
                <div className="flex justify-between border-b border-slate-950 pb-2">
                  <span>Compiler Submissions:</span>
                  <span className="text-slate-200 font-mono">4 times</span>
                </div>
                <div className="flex justify-between">
                  <span>Gaze Tracking Integrity:</span>
                  <span className={`font-semibold ${
                    report.riskRating === 'Low' ? 'text-emerald-400' :
                    report.riskRating === 'Medium' ? 'text-amber-400' : 'text-rose-500'
                  }`}>
                    {report.integrityScore}% Confident
                  </span>
                </div>
              </div>
            </div>

            {/* AI Insights: Technical Core Card */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-lg space-y-3.5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-10 w-10 bg-violet-500/5 rounded-bl-full flex items-center justify-center" />
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <Cpu className="h-4 w-4 text-violet-400" />
                <span>Technical Core Capabilities</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {report.aiInsights.technicalCore}
              </p>
            </div>

            {/* AI Insights: Execution Code Clarity Card */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-lg space-y-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-10 w-10 bg-indigo-500/5 rounded-bl-full flex items-center justify-center" />
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <span>Execution Code Clarity</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {report.aiInsights.codeClarity}
              </p>
            </div>

            {/* AI Insights: Session Integrity Evaluation Card */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-lg space-y-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-10 w-10 bg-emerald-500/5 rounded-bl-full flex items-center justify-center" />
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <BrainCircuit className="h-4 w-4 text-emerald-400" />
                <span>Evaluation of Session Integrity</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {report.aiInsights.sessionIntegrity}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Recruiter Report Footer */}
      <footer className="max-w-7xl mx-auto border-t border-slate-900/60 pt-6 mt-16 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 relative z-10 gap-2">
        <p>© 2026 SynapseAssess Inc. Diagnostic Evaluation Reports Module v4.2.1</p>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-slate-400">Report Export Policy</a>
          <a href="#" className="hover:text-slate-400">Data De-identification Systems</a>
        </div>
      </footer>
    </div>
  );
}
