"use client";

import React, { useState, useMemo } from 'react';
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
  Briefcase
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

const mockCandidates: CandidateRecord[] = [
  {
    id: 'cand-001',
    name: 'Alex Rivera',
    role: 'Senior Frontend Engineer',
    status: 'Completed',
    aiScore: 94,
    riskRating: 'Low',
    warnings: 0,
    date: 'July 2, 2026'
  },
  {
    id: 'cand-002',
    name: 'Jessica Chen',
    role: 'React Tech Lead',
    status: 'Flagged',
    aiScore: 82,
    riskRating: 'Medium',
    warnings: 2,
    date: 'July 1, 2026'
  },
  {
    id: 'cand-003',
    name: 'Marcus Vance',
    role: 'Full Stack Architect',
    status: 'Terminated',
    aiScore: 31,
    riskRating: 'High',
    warnings: 4,
    date: 'June 30, 2026'
  },
  {
    id: 'cand-004',
    name: 'Sarah Jenkins',
    role: 'Frontend UI Developer',
    status: 'Completed',
    aiScore: 88,
    riskRating: 'Low',
    warnings: 0,
    date: 'June 29, 2026'
  },
  {
    id: 'cand-005',
    name: 'David Kim',
    role: 'Software Engineer II',
    status: 'Flagged',
    aiScore: 68,
    riskRating: 'High',
    warnings: 3,
    date: 'June 28, 2026'
  },
  {
    id: 'cand-006',
    name: 'Emily Watson',
    role: 'Mobile UI Engineer',
    status: 'Completed',
    aiScore: 97,
    riskRating: 'Low',
    warnings: 1,
    date: 'June 27, 2026'
  }
];

export default function RecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [sortBy, setSortBy] = useState<'aiScore' | 'name' | 'date'>('aiScore');

  // Compute aggregation metrics
  const stats = useMemo(() => {
    const total = mockCandidates.length;
    const flagged = mockCandidates.filter(c => c.status === 'Flagged' || c.status === 'Terminated').length;
    const highRisk = mockCandidates.filter(c => c.riskRating === 'High').length;
    const avgScore = Math.round(mockCandidates.reduce((acc, curr) => acc + curr.aiScore, 0) / total);

    return { total, flagged, highRisk, avgScore };
  }, []);

  // Filtered and sorted candidate list
  const filteredCandidates = useMemo(() => {
    return mockCandidates
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
  }, [searchTerm, riskFilter, sortBy]);

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
                      No candidate profiles found matching the filter selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

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
