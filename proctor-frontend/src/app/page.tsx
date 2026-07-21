"use client";

import React, { useState, useEffect, useRef } from 'react';
import PreFlightGate from '../components/PreFlightGate';
import SecureWorkspace from '../components/SecureWorkspace';
import AIInterventionModal from '../components/AIInterventionModal';
import { ShieldAlert, Maximize, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

import CandidateLogin from '../components/CandidateLogin';

type ExamPhase = 'login' | 'preflight' | 'secure-workspace' | 'terminated' | 'completed';

export default function Home() {
  const [phase, setPhase] = useState<ExamPhase>('login');
  const [candidateName, setCandidateName] = useState<string>('');
  const [examId, setExamId] = useState<string>('');
  const [examType, setExamType] = useState<'coding' | 'mcq'>('coding');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDescription, setExamDescription] = useState<string>('');
  const [starterCode, setStarterCode] = useState<string>('');
  const [mcqQuestions, setMcqQuestions] = useState<any[]>([]);
  const [hiddenInput, setHiddenInput] = useState<string>('100');
  const [hiddenOutput, setHiddenOutput] = useState<string>('200');

  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);
  const [isFullscreenViolation, setIsFullscreenViolation] = useState<boolean>(false);
  const [isAIInterventionOpen, setIsAIInterventionOpen] = useState<boolean>(false);
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [violationsCount, setViolationsCount] = useState<number>(0);
  const [justifications, setJustifications] = useState<string[]>([]);
  const [isScreenShareActive, setIsScreenShareActive] = useState<boolean>(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState<boolean>(true);

  const submitAnswerRef = useRef<((answer: string) => void) | null>(null);

  // Monitor browser fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (phase === 'secure-workspace' && isScreenShareActive && isFullscreenEnabled) {
        const isCurrentlyFull = !!document.fullscreenElement;
        // If not in fullscreen, flag it as a violation
        setIsFullscreenViolation(!isCurrentlyFull);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [phase, isScreenShareActive, isFullscreenEnabled]);

  // Helper to dynamically synchronize real candidate attempts to Recruiter Dashboard & Backend Ledger
  const syncCandidateToRecruiter = (
    cName: string,
    eTitle: string,
    vCount: number,
    isTerminated: boolean,
    isCompleted: boolean,
    score?: number
  ) => {
    if (!cName) return;
    const status = isTerminated ? 'Terminated' : (vCount > 0 ? 'Flagged' : (isCompleted ? 'Completed' : 'In Progress'));
    const riskRating = vCount >= 3 ? 'High' : (vCount > 0 ? 'Medium' : 'Low');
    const aiScore = score !== undefined ? score : (isTerminated ? 25 : (isCompleted ? 92 : 85));
    const candId = `cand-${cName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}`;

    const record = {
      id: candId,
      name: cName,
      role: eTitle || 'Software Engineer',
      status,
      aiScore,
      riskRating,
      warnings: vCount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    // 1. Sync to localStorage for immediate cross-tab availability
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('completed_candidate_sessions');
      let sessions: any[] = [];
      if (existing) {
        try { sessions = JSON.parse(existing); } catch (e) {}
      }
      const filtered = sessions.filter(s => s.id !== candId);
      filtered.unshift(record);
      localStorage.setItem('completed_candidate_sessions', JSON.stringify(filtered));
    }

    // 2. Post sync payload to backend FastAPI
    fetch('http://localhost:3001/api/recruiter/candidates/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    }).catch(err => console.warn('Candidate backend sync warning:', err));
  };

  // Handle successful login
  const handleLoginSuccess = (data: {
    candidateName: string;
    examId: string;
    examType: 'coding' | 'mcq';
    examTitle: string;
    examDescription?: string;
    starterCode?: string;
    mcqQuestions?: any[];
    cameraEnabled?: boolean;
    fullscreenEnabled?: boolean;
    hiddenInput?: string;
    hiddenOutput?: string;
  }) => {
    setCandidateName(data.candidateName);
    setExamId(data.examId);
    setExamType(data.examType);
    setExamTitle(data.examTitle);
    setExamDescription(data.examDescription || '');
    setStarterCode(data.starterCode || '');
    setMcqQuestions(data.mcqQuestions || []);
    setIsCameraEnabled(data.cameraEnabled !== false);
    setIsFullscreenEnabled(data.fullscreenEnabled !== false);
    setHiddenInput(data.hiddenInput || '100');
    setHiddenOutput(data.hiddenOutput || '200');
    setPhase('preflight');

    // Register active candidate on Recruiter Dashboard
    syncCandidateToRecruiter(data.candidateName, data.examTitle, 0, false, false);
  };

  // Request fullscreen and advance state
  const handleEnterSecureRoom = (photoBase64: string) => {
    setVerificationPhoto(photoBase64);
    
    if (!isFullscreenEnabled) {
      setPhase('secure-workspace');
      setIsFullscreenViolation(false);
      return;
    }

    // Request fullscreen using browser-native Fullscreen API
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen()
        .then(() => {
          setPhase('secure-workspace');
          setIsFullscreenViolation(false);
        })
        .catch((err) => {
          console.error("Failed to enter fullscreen mode:", err);
          // Still enter room, but trigger the fullscreen lock immediately to enforce it
          setPhase('secure-workspace');
          setIsFullscreenViolation(true);
        });
    } else {
      setPhase('secure-workspace');
    }
  };

  // Re-enable secure fullscreen session
  const resumeFullscreenSession = () => {
    if (!isFullscreenEnabled) return;
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen()
        .then(() => {
          setIsFullscreenViolation(false);
        })
        .catch((err) => {
          console.error("Failed to re-enter fullscreen:", err);
        });
    }
  };

  // Callback when user commits an anti-cheating violation (blur, tab switch, etc.)
  const handleViolationOccurred = (count: number) => {
    setViolationsCount(count);
    const isTerminated = count > 3;
    syncCandidateToRecruiter(candidateName, examTitle, count, isTerminated, false);

    if (isTerminated) {
      // Exit fullscreen if we are terminating the exam
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error("Error exiting fullscreen on termination:", err));
      }
      setPhase('terminated');
    }
  };

  // Callback when AI intervention response is submitted
  const handleAIInterventionSubmit = (justification: string) => {
    setJustifications((prev) => [...prev, justification]);
    if (submitAnswerRef.current) {
      submitAnswerRef.current(justification);
    } else {
      setIsAIInterventionOpen(false);
    }
  };

  // Callback when candidate submits the exam
  const handleExamSubmitted = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen on submit:", err));
    }
    syncCandidateToRecruiter(candidateName, examTitle, violationsCount, false, true, 96);
    setPhase('completed');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* 0. Candidate Login Entry State */}
      {phase === 'login' && (
        <CandidateLogin onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 1. Preflight Verification State */}
      {phase === 'preflight' && (
        <PreFlightGate 
          onEnterSecureRoom={handleEnterSecureRoom} 
          cameraEnabled={isCameraEnabled}
          fullscreenEnabled={isFullscreenEnabled}
        />
      )}

      {/* 2. Active Secure Workspace State */}
      {phase === 'secure-workspace' && verificationPhoto && (
        <>
          <SecureWorkspace 
            photoBase64={verificationPhoto}
            examId={examId}
            examType={examType}
            examTitle={examTitle}
            examDescription={examDescription}
            starterCode={starterCode}
            mcqQuestions={mcqQuestions}
            cameraEnabled={isCameraEnabled}
            fullscreenEnabled={isFullscreenEnabled}
            hiddenInput={hiddenInput}
            hiddenOutput={hiddenOutput}
            onScreenShareActiveChange={setIsScreenShareActive}
            onTriggerIntervention={(question) => {
              setAiQuestion(question);
              setIsAIInterventionOpen(true);
            }}
            onReleaseIntervention={() => setIsAIInterventionOpen(false)}
            onViolationOccurred={handleViolationOccurred}
            onSubmitAnswerRef={submitAnswerRef}
            onExamSubmitted={handleExamSubmitted}
          />
          
          {/* AI Interruption Overlay Modal */}
          <AIInterventionModal 
            isOpen={isAIInterventionOpen}
            question={aiQuestion}
            onSubmit={handleAIInterventionSubmit}
          />
        </>
      )}

      {/* 3. Fullscreen Lockout Overlay (Active when user attempts to escape fullscreen) */}
      {phase === 'secure-workspace' && isFullscreenViolation && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none pointer-events-auto">
          <div className="absolute top-[10%] w-[40%] h-[40%] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
            <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Fullscreen Security Lockout</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                You have exited the secure fullscreen workspace. This event has been flagged and logged as a proctoring violation in your candidate history.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-left text-xs space-y-2 text-slate-400">
              <div className="flex items-center space-x-1.5 text-amber-500 font-semibold mb-1">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Security Protocol Warning</span>
              </div>
              <p>
                Leaving fullscreen locks editing access. Re-enter fullscreen immediately to avoid automatic session termination.
              </p>
            </div>

            <button
              onClick={resumeFullscreenSession}
              className="w-full py-3.5 bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border border-amber-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-amber-500/10 active:scale-97 cursor-pointer"
            >
              Re-Enter Secure Fullscreen Room
            </button>
          </div>
        </div>
      )}

      {/* 4. Session Terminated Hard Lockout State */}
      {phase === 'terminated' && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute top-[10%] w-[40%] h-[40%] bg-rose-900/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-lg w-full bg-slate-900 border border-rose-900/30 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 relative z-10">
            <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Session Disqualified</h1>
              <p className="text-sm text-rose-400 font-medium">Excessive Proctoring Violations Recorded</p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto pt-2">
                This testing session has been automatically flagged and suspended due to multiple security violations (exceeding the threshold of 3 infractions).
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 text-left text-xs space-y-3.5 text-slate-400">
              <h4 className="font-semibold text-slate-200 uppercase tracking-wider">Session Audit Log</h4>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span>Initial Verification:</span>
                  <span className="text-emerald-400">PASSED</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span>Anti-Cheating Infractions:</span>
                  <span className="text-rose-400 font-bold">{violationsCount} Detected</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span>AI Interventions Answered:</span>
                  <span className="text-slate-300">{justifications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overall Status:</span>
                  <span className="text-rose-500 font-bold">DISQUALIFIED & SUSPENDED</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              If you believe this was an error, contact your recruitment supervisor or institution system administrator.
            </p>
          </div>
        </div>
      )}

      {/* 5. Exam Completed Receipt State */}
      {phase === 'completed' && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute top-[10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-md w-full bg-slate-900 border border-emerald-900/30 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6 relative z-10">
            <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
              <ShieldCheck className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Exam Submitted Successfully</h1>
              <p className="text-sm text-emerald-400 font-medium">Session Finalized & Integrity Audited</p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto pt-2">
                Thank you, <span className="text-white font-semibold">{candidateName}</span>. Your exam answers and security proctor logs have been securely packaged and transmitted to the recruiter panel.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 text-left text-xs space-y-3.5 text-slate-400">
              <h4 className="font-semibold text-slate-200 uppercase tracking-wider">Submission Receipt</h4>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span>Exam ID:</span>
                  <span className="text-violet-400 font-semibold">{examId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span>Exam Name:</span>
                  <span className="text-slate-350">{examTitle}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span>Exam Type:</span>
                  <span className="text-slate-350 uppercase font-bold">{examType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span>Total Infractions:</span>
                  <span className={violationsCount > 0 ? 'text-amber-500 font-bold' : 'text-emerald-400 font-bold'}>
                    {violationsCount} Flags
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Proctoring Status:</span>
                  <span className="text-emerald-400 font-bold">TRANSMITTED</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPhase('login');
                setVerificationPhoto(null);
                setViolationsCount(0);
                setJustifications([]);
              }}
              className="w-full py-3 bg-slate-950 border border-slate-850 hover:border-slate-750 text-slate-300 font-semibold rounded-xl text-xs transition active:scale-97 cursor-pointer"
            >
              Return to Entrance Gate
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
