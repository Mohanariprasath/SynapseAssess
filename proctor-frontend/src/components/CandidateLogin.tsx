"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  KeyRound, 
  User, 
  ArrowRight, 
  AlertCircle, 
  ShieldAlert, 
  Lock, 
  Activity 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CandidateLoginProps {
  onLoginSuccess: (data: {
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
  }) => void;
}

export const DEFAULT_EXAMS = [
  {
    examId: 'EXAM-FE-982',
    examTitle: 'Synapse Stream Multiplier',
    examRole: 'Senior Frontend Engineer',
    examType: 'coding' as const,
    cameraEnabled: true,
    fullscreenEnabled: true,
    hiddenInput: '100',
    hiddenOutput: '200',
    examDescription: '### Challenge Description\nImplement a core multiplier function that takes an integer input, scales the stream throughput by a factor of two, and outputs the result.\n\n### Input Specifications\n- `input`: An integer representing the raw stream throughput.\n\n### Output Specifications\n- Returns the throughput scaled by 2x.\n\n### Verification Examples\n- `solve(5)` => `10`\n- `solve(-3)` => `-6`\n\n### Architectural Notes\nEnsure bounds checking matches typical IEEE-754 specifications to prevent integer overflows.',
    starterCode: `function solve(input) {
  // Write your enterprise grade algorithm here
  console.log("Processing synapse data...");
  return input * 2;
}`
  },
  {
    examId: 'EXAM-MCQ-505',
    examTitle: 'React & Systems Architecture MCQ',
    examRole: 'React Tech Lead',
    examType: 'mcq' as const,
    cameraEnabled: true,
    fullscreenEnabled: true,
    mcqQuestions: [
      {
        id: 'q1',
        question: "Which of the following describes the behavior of useEffect when its dependency array is omitted?",
        options: [
          "It runs only once on initial mount",
          "It runs on the initial mount and after every single component render",
          "It never runs until state changes",
          "It runs only when component unmounts"
        ],
        correctIndex: 1
      },
      {
        id: 'q2',
        question: "What is the primary benefit of React.memo?",
        options: [
          "It prevents re-renders of a functional component if its props haven't changed",
          "It synchronizes component state with localStorage",
          "It speeds up network API requests"
        ],
        correctIndex: 1
      }
    ]
  }
];

export default function CandidateLogin({ onLoginSuccess }: CandidateLoginProps) {
  const [candidateName, setCandidateName] = useState<string>('');
  const [examId, setExamId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const loginCardRef = useRef<HTMLDivElement>(null);

  // Terminal emulation state
  const [terminalLineIndex, setTerminalLineIndex] = useState(0);
  const terminalLines = [
    "Initializing SynapseAssess proctoring sandbox...",
    "Loading secure node subsystems and subprocess execution runtimes...",
    "Querying active local media streams (camera/mic/telemetry)...",
    "Pre-flight checksum verification: PASSED",
    "Awaiting candidate verification credentials..."
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_exams');
      if (!stored) {
        localStorage.setItem('active_exams', JSON.stringify(DEFAULT_EXAMS));
      }
    }

    // Animate terminal writing line-by-line
    const interval = setInterval(() => {
      setTerminalLineIndex(prev => (prev < terminalLines.length ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!candidateName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!examId.trim()) {
      setError('Please enter an Exam ID.');
      return;
    }

    // Retrieve active exams
    let activeExams = DEFAULT_EXAMS;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_exams');
      if (stored) {
        try {
          activeExams = JSON.parse(stored);
        } catch (err) {
          console.error("Error parsing stored exams:", err);
        }
      }
    }

    // Match Exam ID
    const matchedExam = activeExams.find(
      (exam) => exam.examId.trim().toUpperCase() === examId.trim().toUpperCase()
    );

    if (!matchedExam) {
      setError('Invalid Exam ID. This exam does not match any active recruiter configurations.');
      return;
    }

    // Success login
    onLoginSuccess({
      candidateName: candidateName.trim(),
      examId: matchedExam.examId,
      examType: matchedExam.examType as 'coding' | 'mcq',
      examTitle: matchedExam.examTitle,
      examDescription: matchedExam.examDescription,
      starterCode: matchedExam.starterCode,
      mcqQuestions: matchedExam.mcqQuestions,
      cameraEnabled: matchedExam.cameraEnabled !== false,
      fullscreenEnabled: matchedExam.fullscreenEnabled !== false,
      hiddenInput: (matchedExam as any).hiddenInput,
      hiddenOutput: (matchedExam as any).hiddenOutput
    });
  };

  const handleScrollToLogin = () => {
    loginCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans overflow-x-hidden relative selection:bg-violet-500/30 selection:text-white">
      {/* Vercel Glowing Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0d_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Absolute Glowing Orbs */}
      <div className="absolute top-[-10%] left-20 size-[500px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute top-[30%] right-10 size-[600px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Global Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between border-b border-slate-900/60 relative z-20 backdrop-blur-md bg-black/35 sticky top-0">
        <div className="flex items-center gap-2">
          {/* Stunning minimalist triangle-synapse logo */}
          <div className="relative flex items-center justify-center">
            <svg className="size-8 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" viewBox="0 0 100 100" fill="none">
              <polygon points="50,12 90,82 10,82" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" fill="black" />
              <circle cx="50" cy="50" r="10" fill="white" className="animate-ping" />
              <circle cx="50" cy="50" r="6" fill="white" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider text-white font-mono uppercase">SynapseAssess</span>
            <span className="text-[10px] text-slate-500 font-medium">Next-Gen Evaluation</span>
          </div>
        </div>

        {/* Navigation spacer */}
        <div className="flex-1" />

        <div>
          <Badge variant="outline" className="px-3.5 py-1.5 text-[10px] rounded-full border-slate-800 bg-slate-950 text-slate-400 font-mono">
            System: Active
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-6 md:px-12 pt-20 pb-16 text-center flex flex-col items-center gap-6 relative z-10">
        <Badge variant="outline" className="px-3.5 py-1 text-[11px] rounded-full border-violet-500/30 bg-violet-950/20 text-violet-400 backdrop-blur-sm shadow-sm inline-flex gap-1.5 items-center font-mono">
          <Activity className="size-3 animate-pulse" />
          <span>v2.1 live: Sandboxed execution node</span>
        </Badge>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-none">
          Assess. Proctor.<br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-250 to-white bg-clip-text text-transparent filter drop-shadow-[0_4px_16px_rgba(139,92,246,0.15)]">
            Validate Securely.
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          AI proctoring telemetry, isolated code runtime subprocesses, and instant cheating logs built for technical recruiters.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button
            onClick={handleScrollToLogin}
            className="px-8 py-3.5 bg-white text-black font-semibold rounded-full text-sm hover:bg-slate-200 transition duration-150 active:scale-97 cursor-pointer shadow-lg shadow-white/5 flex items-center gap-1.5 font-sans"
          >
            <span>Start Exam System Check</span>
            <ArrowRight className="size-4" />
          </button>
          
          <Link
            href="/recruiter/dashboard"
            className="px-8 py-3.5 bg-black border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold rounded-full text-sm transition duration-150 active:scale-97 cursor-pointer"
          >
            Manage Configurations
          </Link>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-8" />

      {/* Entrance / Login Card Form (The Portal Gate) */}
      <section id="entrance" ref={loginCardRef} className="w-full max-w-md mx-auto px-6 pb-24 relative z-10 scroll-mt-24">
        <Card className="bg-slate-950/70 border-violet-500/25 backdrop-blur-xl shadow-2xl overflow-hidden shadow-violet-500/5 relative">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <CardHeader className="text-center pb-4">
            <div className="size-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-indigo-500/15 mb-3">
              <Lock className="size-5 text-white" />
            </div>
            <CardTitle className="text-white font-bold text-lg">Identity Verification Gate</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Enter your credentials and the Exam ID provided by your recruiter to initiate the pre-flight check.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full bg-black border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition"
                  />
                </div>
              </div>

              {/* Exam ID Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recruiter Exam ID</label>
                <div className="relative">
                  <KeyRound className="size-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. EXAM-FE-982"
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full bg-black border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 transition uppercase"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-indigo-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-500/15 active:scale-97 cursor-pointer flex items-center justify-center gap-1.5 group"
              >
                <span>Proceed to System Check</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Verification Helper Tip */}
            <div className="bg-black/50 border border-slate-900 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-2.5">
              <ShieldAlert className="size-4 text-violet-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Prior to starting, the portal will request camera and screen-sharing authorization to configure secure telemetry handshakes.
              </p>
            </div>

            {/* Preset IDs */}
            <div className="text-center pt-3 border-t border-slate-900/60">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Demo Exam IDs: <span className="font-mono text-violet-400 font-semibold select-all">EXAM-FE-982</span> (Coding) or <span className="font-mono text-violet-400 font-semibold select-all">EXAM-MCQ-505</span> (MCQ)
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 md:px-12 py-10 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 mt-auto text-[10px] text-slate-500 relative z-10">
        <div className="flex items-center gap-2">
          <svg className="size-4 text-slate-650" viewBox="0 0 100 100" fill="none">
            <polygon points="50,12 90,82 10,82" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" fill="none" />
          </svg>
          <span>© 2026 SynapseAssess Inc. Recruiter Verification Gateway.</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Secure Candidate Portal Gateway</span>
        </div>
      </footer>
    </div>
  );
}
