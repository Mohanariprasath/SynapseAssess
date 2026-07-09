"use client";

import React, { useState, useEffect } from 'react';
import { KeyRound, User, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';

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
    examDescription: 'Implement a core multiplier function that takes an integer input, scales the stream throughput by a factor of two, and outputs the result. Ensure bounds checking matches typical IEEE-754 specifications.',
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
          "It automatically binds class methods",
          "It prevents re-renders of a functional component if its props haven't changed",
          "It synchronizes component state with localStorage",
          "It speeds up network API requests"
        ],
        correctIndex: 1
      },
      {
        id: 'q3',
        question: "In Next.js Turbopack mode, what is the default behavior for server vs client components?",
        options: [
          "All components are Client Components by default",
          "All components are Server Components by default unless marked with 'use client'",
          "It does not support client components",
          "Components are determined based on import paths only"
        ],
        correctIndex: 1
      }
    ]
  }
];

export default function CandidateLogin({ onLoginSuccess }: CandidateLoginProps) {
  const [candidateName, setCandidateName] = useState('');
  const [examId, setExamId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize default exams in localStorage if not present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_exams');
      if (!stored) {
        localStorage.setItem('active_exams', JSON.stringify(DEFAULT_EXAMS));
      }
    }
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
      fullscreenEnabled: matchedExam.fullscreenEnabled !== false
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between border-b border-slate-900 pb-6 mb-8 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SynapseAssess Secure Entry
            </h1>
            <p className="text-xs text-slate-400">Candidate Examination Portal</p>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative z-10 my-auto space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold tracking-tight text-white">Verification Required</h2>
          <p className="text-xs text-slate-400">
            Enter your candidate credentials and the Exam ID provided by your recruiter to begin the pre-flight check.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Candidate Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition"
              />
            </div>
          </div>

          {/* Exam ID Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recruiter Exam ID</label>
            <div className="relative">
              <KeyRound className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. EXAM-FE-982"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition uppercase"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-indigo-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-500/15 active:scale-97 cursor-pointer flex items-center justify-center space-x-2 group"
          >
            <span>Proceed to System Check</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </form>

        {/* Informative Tip */}
        <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 text-xs text-slate-400 flex items-start space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Upon verification, the browser will request access to your camera and microphone to initiate proctoring telemetry.
          </p>
        </div>

        {/* Demo Helper */}
        <div className="text-center pt-2 border-t border-slate-900">
          <p className="text-[10px] text-slate-500">
            Demo Active Exam IDs: <span className="font-mono text-violet-400 font-semibold select-all">EXAM-FE-982</span> (Coding) or <span className="font-mono text-violet-400 font-semibold select-all">EXAM-MCQ-505</span> (MCQ)
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto border-t border-slate-900 pt-6 mt-8 text-center text-[10px] text-slate-500 relative z-10">
        <p>© 2026 SynapseAssess Inc. Recruiter Verification Gateway</p>
      </footer>
    </div>
  );
}
