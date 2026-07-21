"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ShieldAlert, 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Plus,
  Trash2,
  ListChecks,
  Code
} from 'lucide-react';

interface CandidateRecord {
  id: string;
  name: string;
  role: string;
  status: 'Completed' | 'Flagged' | 'Terminated' | 'In Progress';
  aiScore: number;
  riskRating: 'Low' | 'Medium' | 'High';
  warnings: number;
  date: string;
}

// Dynamic candidate roster container (starts clean and populates dynamically from real candidate sessions)
const mockCandidates: CandidateRecord[] = [];

export default function RecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [sortBy, setSortBy] = useState<'aiScore' | 'name' | 'date'>('aiScore');

  // Dynamic candidate list state
  const [candidates, setCandidates] = useState<CandidateRecord[]>(mockCandidates);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'candidates' | 'exams'>('candidates');
  const [exams, setExams] = useState<any[]>([]);

  // Form states for creating a new exam
  const [newExamId, setNewExamId] = useState('');
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamRole, setNewExamRole] = useState('');
  const [newExamType, setNewExamType] = useState<'coding' | 'mcq'>('coding');
  const [newCameraEnabled, setNewCameraEnabled] = useState(true);
  const [newFullscreenEnabled, setNewFullscreenEnabled] = useState(true);
  
  // Coding exam details
  const [newDescription, setNewDescription] = useState('');
  const [newStarterCode, setNewStarterCode] = useState('');
  const [newHiddenInput, setNewHiddenInput] = useState('100');
  const [newHiddenOutput, setNewHiddenOutput] = useState('200');

  // MCQ exam details (dynamic questions input)
  const [mcqQuestionsList, setMcqQuestionsList] = useState<any[]>([
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctIndex: 0 }
  ]);

  // Dynamically fetch candidate sessions from backend & merge with localStorage
  useEffect(() => {
    const fetchDynamicCandidates = async () => {
      let merged = [...mockCandidates];

      // Read locally saved sessions
      if (typeof window !== 'undefined') {
        const localSaved = localStorage.getItem('completed_candidate_sessions');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed)) {
              merged = [...parsed, ...merged];
            }
          } catch (e) {
            console.error("Error loading local candidate sessions:", e);
          }
        }
      }

      // Fetch dynamic live backend sessions
      try {
        const res = await fetch('http://localhost:3001/api/recruiter/candidates');
        if (res.ok) {
          const apiCandidates = await res.json();
          if (Array.isArray(apiCandidates) && apiCandidates.length > 0) {
            // Deduplicate by ID
            const apiMap = new Map();
            apiCandidates.forEach((c: any) => apiMap.set(c.id, c));
            merged.forEach((c: any) => {
              if (!apiMap.has(c.id)) {
                apiMap.set(c.id, c);
              }
            });
            merged = Array.from(apiMap.values());
          }
        }
      } catch (err) {
        console.warn("Backend candidate query unavailable, using local dynamic roster:", err);
      }

      setCandidates(merged);
    };

    fetchDynamicCandidates();
  }, []);

  // Synchronize active exams with localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_exams');
      if (stored) {
        try {
          setExams(JSON.parse(stored));
        } catch (e) {
          console.error("Error loading exams:", e);
        }
      } else {
        const presets = [
          {
            examId: 'EXAM-FE-982',
            examTitle: 'Synapse Stream Multiplier',
            examRole: 'Senior Frontend Engineer',
            examType: 'coding',
            examDescription: '### Challenge Description\nImplement a core multiplier function that takes an integer input, scales the stream throughput by a factor of two, and outputs the result.\n\n### Input Specifications\n- `input`: An integer representing the raw stream throughput.\n\n### Output Specifications\n- Returns the throughput scaled by 2x.\n\n### Verification Examples\n- `solve(5)` => `10`\n- `solve(-3)` => `-6`\n\n### Architectural Notes\nEnsure bounds checking matches typical IEEE-754 specifications to prevent integer overflows.',
            starterCode: `function solve(input) {
  // Write your enterprise grade algorithm here
  console.log("Processing synapse data...");
  return input * 2;
}`,
            cameraEnabled: true,
            fullscreenEnabled: true,
            hiddenInput: '100',
            hiddenOutput: '200'
          },
          {
            examId: 'EXAM-MCQ-505',
            examTitle: 'React & Systems Architecture MCQ',
            examRole: 'React Tech Lead',
            examType: 'mcq',
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
              }
            ]
          }
        ];
        localStorage.setItem('active_exams', JSON.stringify(presets));
        setExams(presets);
      }
    }
  }, []);

  // Form helpers for dynamic questions list
  const addQuestionField = () => {
    setMcqQuestionsList(prev => [...prev, { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctIndex: 0 }]);
  };

  const removeQuestionField = (idx: number) => {
    if (mcqQuestionsList.length === 1) return;
    setMcqQuestionsList(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestionField = (idx: number, field: string, val: any) => {
    setMcqQuestionsList(prev => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newExamId || !newExamTitle || !newExamRole) {
      alert("Please fill in all general exam fields.");
      return;
    }

    if (exams.some(ex => ex.examId.toUpperCase() === newExamId.toUpperCase())) {
      alert("An exam with this Exam ID already exists.");
      return;
    }

    let newExamData: any = {
      examId: newExamId.toUpperCase().trim(),
      examTitle: newExamTitle.trim(),
      examRole: newExamRole.trim(),
      examType: newExamType,
      cameraEnabled: newCameraEnabled,
      fullscreenEnabled: newFullscreenEnabled
    };

    if (newExamType === 'coding') {
      newExamData.examDescription = newDescription.trim() || 'No description provided.';
      newExamData.starterCode = newStarterCode.trim() || `function solve(input) {\n  return input;\n}`;
      newExamData.hiddenInput = newHiddenInput.trim() || '100';
      newExamData.hiddenOutput = newHiddenOutput.trim() || '200';
    } else {
      const validQuestions = mcqQuestionsList.filter(q => q.question.trim());
      if (validQuestions.length === 0) {
        alert("Please add at least one question for the MCQ exam.");
        return;
      }
      newExamData.mcqQuestions = validQuestions.map((q, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        question: q.question.trim(),
        options: [q.optionA.trim(), q.optionB.trim(), q.optionC.trim(), q.optionD.trim()].filter(Boolean),
        correctIndex: parseInt(q.correctIndex)
      }));
    }

    const updatedExams = [...exams, newExamData];
    setExams(updatedExams);
    localStorage.setItem('active_exams', JSON.stringify(updatedExams));

    // Reset Form
    setNewExamId('');
    setNewExamTitle('');
    setNewExamRole('');
    setNewDescription('');
    setNewStarterCode('');
    setNewHiddenInput('100');
    setNewHiddenOutput('200');
    setNewCameraEnabled(true);
    setNewFullscreenEnabled(true);
    setMcqQuestionsList([{ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctIndex: 0 }]);
    alert(`Exam ID ${newExamId.toUpperCase()} has been successfully registered!`);
  };

  const handleDeleteExam = (id: string) => {
    if (!confirm(`Are you sure you want to delete Exam ID: ${id}?`)) {
      return;
    }
    const updated = exams.filter(ex => ex.examId !== id);
    setExams(updated);
    localStorage.setItem('active_exams', JSON.stringify(updated));
  };

  // Compute aggregation metrics dynamically based on current candidates state
  const stats = useMemo(() => {
    const total = candidates.length || 1;
    const flagged = candidates.filter(c => c.status === 'Flagged' || c.status === 'Terminated').length;
    const highRisk = candidates.filter(c => c.riskRating === 'High').length;
    const avgScore = Math.round(candidates.reduce((acc, curr) => acc + curr.aiScore, 0) / total);

    return { total: candidates.length, flagged, highRisk, avgScore };
  }, [candidates]);

  // Filtered and sorted candidate list
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(candidate => {
        const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              candidate.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'All' || candidate.riskRating === riskFilter;
        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        if (sortBy === 'aiScore') return b.aiScore - a.aiScore;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [candidates, searchTerm, riskFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden select-none">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Recruiter Dashboard Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-8 mb-8 relative z-10 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SynapseAssess Recruiter Panel
            </h1>
            <p className="text-xs text-slate-400">Hiring Diagnostics & Security Audits</p>
          </div>
        </div>

        {/* Global Security Summary Indicator */}
        <div className="flex items-center space-x-2 text-xs bg-slate-900/50 border border-slate-850 px-3.5 py-2 rounded-full">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">All Proctoring Handshakes Verified</span>
        </div>
      </header>

      {/* Tab Selectors */}
      <div className="max-w-7xl mx-auto flex items-center space-x-4 border-b border-slate-900 pb-4 mb-6 relative z-10">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center space-x-2 pb-2 text-sm font-semibold transition border-b-2 cursor-pointer ${
            activeTab === 'candidates'
              ? 'border-indigo-500 text-white font-bold'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Candidate Roster</span>
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center space-x-2 pb-2 text-sm font-semibold transition border-b-2 cursor-pointer ${
            activeTab === 'exams'
              ? 'border-indigo-500 text-white font-bold'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Exam Configurations</span>
        </button>
      </div>

      {activeTab === 'exams' ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          {/* Left Form: Create New Exam */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Register New Exam Session</h2>
              <p className="text-xs text-slate-450 mt-1 font-medium">Configure candidate credentials and proctoring content sheets.</p>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam ID (Alpha-Numeric)</label>
                <input
                  type="text"
                  placeholder="e.g. EXAM-PY-404"
                  value={newExamId}
                  onChange={(e) => setNewExamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-650 transition uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam Title</label>
                <input
                  type="text"
                  placeholder="e.g. Python Array Processing"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-650 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Job Role</label>
                <input
                  type="text"
                  placeholder="e.g. Python Developer"
                  value={newExamRole}
                  onChange={(e) => setNewExamRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-650 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewExamType('coding')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-1.5 ${
                      newExamType === 'coding'
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    <span>Coding Task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExamType('mcq')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-1.5 ${
                      newExamType === 'mcq'
                        ? 'bg-indigo-650/10 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    <span>MCQ Sheet</span>
                  </button>
                </div>
              </div>

              {/* Proctoring Settings Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div 
                  onClick={() => setNewCameraEnabled(!newCameraEnabled)}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition select-none ${
                    newCameraEnabled 
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/5' 
                      : 'bg-slate-950 border-slate-850 text-slate-500'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider">Camera Proctor</span>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-xs font-semibold">{newCameraEnabled ? 'Active' : 'Off'}</span>
                    <div className={`w-7 h-4 flex items-center rounded-full p-0.5 transition duration-300 ${newCameraEnabled ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                      <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ${newCameraEnabled ? 'translate-x-2.5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setNewFullscreenEnabled(!newFullscreenEnabled)}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition select-none ${
                    newFullscreenEnabled 
                      ? 'bg-amber-600/10 border-amber-500/40 text-white shadow-lg shadow-amber-500/5' 
                      : 'bg-slate-950 border-slate-850 text-slate-500'
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider">Fullscreen Lock</span>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-xs font-semibold">{newFullscreenEnabled ? 'Active' : 'Off'}</span>
                    <div className={`w-7 h-4 flex items-center rounded-full p-0.5 transition duration-300 ${newFullscreenEnabled ? 'bg-amber-500' : 'bg-slate-800'}`}>
                      <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ${newFullscreenEnabled ? 'translate-x-2.5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional Sections */}
              {newExamType === 'coding' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Task Description</label>
                    <textarea
                      placeholder="Describe the coding challenge here..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-650 transition resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Starter Boilerplate Code</label>
                    <textarea
                      placeholder={`function solve(input) {\n  return input;\n}`}
                      value={newStarterCode}
                      onChange={(e) => setNewStarterCode(e.target.value)}
                      className="w-full h-28 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 placeholder-slate-700 transition resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hidden Test Case Input</label>
                      <input
                        type="text"
                        placeholder="e.g. 100"
                        value={newHiddenInput}
                        onChange={(e) => setNewHiddenInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hidden Test Expected Output</label>
                      <input
                        type="text"
                        placeholder="e.g. 200"
                        value={newHiddenOutput}
                        onChange={(e) => setNewHiddenOutput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 transition"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MCQ Questions ({mcqQuestionsList.length})</span>
                    <button
                      type="button"
                      onClick={addQuestionField}
                      className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center space-x-1 cursor-pointer font-sans"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto space-y-4 pr-1">
                    {mcqQuestionsList.map((q, idx) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500">Question #{idx + 1}</span>
                          {mcqQuestionsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestionField(idx)}
                              className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Enter question statement..."
                          value={q.question}
                          onChange={(e) => updateQuestionField(idx, 'question', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 transition"
                          required
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Option A"
                            value={q.optionA}
                            onChange={(e) => updateQuestionField(idx, 'optionA', e.target.value)}
                            className="bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-[11px] text-slate-350 placeholder-slate-600"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Option B"
                            value={q.optionB}
                            onChange={(e) => updateQuestionField(idx, 'optionB', e.target.value)}
                            className="bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-[11px] text-slate-355 placeholder-slate-600"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Option C"
                            value={q.optionC}
                            onChange={(e) => updateQuestionField(idx, 'optionC', e.target.value)}
                            className="bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-[11px] text-slate-355 placeholder-slate-600"
                          />
                          <input
                            type="text"
                            placeholder="Option D"
                            value={q.optionD}
                            onChange={(e) => updateQuestionField(idx, 'optionD', e.target.value)}
                            className="bg-slate-900 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-[11px] text-slate-355 placeholder-slate-600"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-450">Correct Option</label>
                          <select
                            value={q.correctIndex}
                            onChange={(e) => updateQuestionField(idx, 'correctIndex', e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1 focus:border-violet-500 focus:outline-none cursor-pointer"
                          >
                            <option value={0}>Option A</option>
                            <option value={1}>Option B</option>
                            <option value={2}>Option C</option>
                            <option value={3}>Option D</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 mt-2 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-500/10 active:scale-97 cursor-pointer"
              >
                Register Active Exam ID
              </button>
            </form>
          </div>

          {/* Right Area: List of Registered Exams */}
          <div className="lg:col-span-7 bg-slate-900/25 border border-slate-900 rounded-3xl p-6 shadow-inner flex flex-col space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Exam Registry</h2>
              <p className="text-xs text-slate-450 mt-1">Exams currently configured and matching candidate requests.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-4">Exam ID / Title</th>
                    <th className="py-4 px-4">Job Role</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/80">
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <tr key={exam.examId} className="hover:bg-slate-900/30 transition duration-150">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-mono text-xs text-violet-400 font-bold tracking-wider">{exam.examId}</span>
                            <h4 className="font-semibold text-slate-200 text-xs mt-0.5">{exam.examTitle}</h4>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {exam.examRole}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${
                              exam.examType === 'coding'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                               : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            }`}>
                              {exam.examType}
                            </span>
                            <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${
                              exam.cameraEnabled !== false
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                                : 'bg-slate-800/40 text-slate-500 border-slate-805/60'
                            }`}>
                              Cam: {exam.cameraEnabled !== false ? 'ON' : 'OFF'}
                            </span>
                            <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${
                              exam.fullscreenEnabled !== false
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                : 'bg-slate-800/40 text-slate-500 border-slate-805/60'
                            }`}>
                              Fullscreen: {exam.fullscreenEnabled !== false ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteExam(exam.examId)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-400 cursor-pointer flex items-center space-x-1 ml-auto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500 text-xs">
                        No active exam configurations registry found. Use the form on the left to register one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto space-y-8 relative z-10">
          
          {/* Metric Aggregates Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Candidates</span>
                <p className="text-3xl font-extrabold text-white">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-400">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Flagged/Terminated</span>
                <p className="text-3xl font-extrabold text-amber-500">{stats.flagged}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">High Risk Profile</span>
                <p className="text-3xl font-extrabold text-rose-500">{stats.highRisk}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex items-center justify-between shadow-lg">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average AI Score</span>
                <p className="text-3xl font-extrabold text-violet-400">{stats.avgScore}%</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* Dashboard Control Bar */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search Box */}
            <div className="w-full lg:w-80 relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-650 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Filtering Matrix Options */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2 flex items-center space-x-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Risk Threshold</span>
              </span>
              {['All', 'Low', 'Medium', 'High'].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk as any)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl border transition active:scale-97 font-semibold ${
                    riskFilter === risk 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {risk} Risk
                </button>
              ))}
            </div>

            {/* Sorting controls */}
            <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl focus:border-violet-500 focus:outline-none cursor-pointer font-medium"
              >
                <option value="aiScore">AI Score (High-Low)</option>
                <option value="name">Candidate Name</option>
                <option value="date">Evaluation Date</option>
              </select>
            </div>
          </div>

          {/* Candidate Evaluation Grid / Table */}
          <div className="bg-slate-900/25 border border-slate-900 rounded-3xl overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4.5 px-6">Candidate Details</th>
                    <th className="py-4.5 px-6">Proctoring Status</th>
                    <th className="py-4.5 px-6 text-center">Infractions</th>
                    <th className="py-4.5 px-6 text-center">AI Score</th>
                    <th className="py-4.5 px-6 text-center">Risk Assessment</th>
                    <th className="py-4.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/80">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-900/30 transition duration-150 group">
                        
                        {/* Name & Role */}
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-semibold text-slate-100 text-sm group-hover:text-white transition">
                              {candidate.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{candidate.role}</div>
                          </div>
                        </td>

                        {/* Proctoring Status Badge */}
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {candidate.status === 'Completed' && (
                              <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Completed</span>
                              </span>
                            )}
                            {candidate.status === 'Flagged' && (
                              <span className="flex items-center space-x-1.5 text-xs text-amber-500 font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Flagged</span>
                              </span>
                            )}
                            {candidate.status === 'Terminated' && (
                              <span className="flex items-center space-x-1.5 text-xs text-rose-500 font-medium">
                                <XCircle className="h-4 w-4 animate-pulse" />
                                <span>Terminated</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Warnings / Infractions Count */}
                        <td className="py-4 px-6 text-center font-mono text-xs text-slate-300">
                          {candidate.warnings}
                        </td>

                        {/* AI Evaluation Grade */}
                        <td className="py-4 px-6 text-center">
                          <div className="inline-block">
                            <span className={`text-sm font-bold font-mono px-2.5 py-1 rounded-lg ${
                              candidate.aiScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                              candidate.aiScore >= 70 ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' :
                              'bg-rose-500/10 text-rose-550 border border-rose-500/25'
                            }`}>
                              {candidate.aiScore}%
                            </span>
                          </div>
                        </td>

                        {/* Risk Rating Badge */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                              candidate.riskRating === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              candidate.riskRating === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}>
                              {candidate.riskRating}
                            </span>
                          </div>
                        </td>

                        {/* Detail Link */}
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/recruiter/report/${candidate.id}`}
                            className="inline-flex items-center space-x-1 text-xs text-violet-400 hover:text-violet-300 font-semibold transition active:scale-97 hover:underline decoration-violet-500 underline-offset-4 cursor-pointer"
                          >
                            <span>Diagnostics</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                        No active candidate sessions recorded. Candidates will automatically appear here in real time as they log in and take assessments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      )}

      {/* Recruiter Panel Footer */}
      <footer className="max-w-7xl mx-auto border-t border-slate-900/60 pt-6 mt-16 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 relative z-10 gap-2">
        <p>© 2026 SynapseAssess Inc. Recruiter Administration Terminal v4.2.1</p>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-slate-400">Proctoring Telemetry GDPR Compliance</a>
          <a href="#" className="hover:text-slate-400">Hiring Bias Declarations</a>
        </div>
      </footer>
    </div>
  );
}
