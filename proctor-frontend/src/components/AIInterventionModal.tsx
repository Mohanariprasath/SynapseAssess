"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, BrainCircuit, User, AlertCircle, Eye } from 'lucide-react';

interface AIInterventionModalProps {
  isOpen: boolean;
  question: string;
  onSubmit: (justification: string) => void;
}

export default function AIInterventionModal({ isOpen, question, onSubmit }: AIInterventionModalProps) {
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Lock scroll on body when modal is open and focus the textarea
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Intercept background keyboard inputs when modal is active
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow user to type in textarea, but block Tab or Escape from closing/focus-escaping the modal
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = text.trim();
    if (trimmed.length < 25) {
      setError("Please provide a more descriptive architectural explanation (minimum 25 characters).");
      return;
    }

    onSubmit(trimmed);
    setText(''); // Reset text field
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xl p-4 md:p-8 animate-fade-in">
      {/* Heavy Input Blocking Shield */}
      <div className="absolute inset-0 pointer-events-auto" />

      {/* Main Glassmorphic Modal Window */}
      <div className="relative z-10 bg-slate-900/90 border border-slate-800/80 max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[520px] max-h-full">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500" />

        {/* Left Panel: AI Interviewer */}
        <div className="md:w-1/2 bg-slate-950/50 border-r border-slate-800/60 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <BrainCircuit className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Evaluation Engine</h3>
                <p className="text-[10px] text-slate-500">SYNAPSE PROCTOR V4.2</p>
              </div>
            </div>

            {/* AI Avatar / Waveform Graphic */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 relative group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 border border-indigo-400/20 relative">
                <BrainCircuit className="h-8 w-8 text-white" />
                <span className="absolute inset-0 rounded-full border border-violet-500 animate-ping opacity-25" />
              </div>
              <div className="flex items-center space-x-1.5 justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[10px] text-violet-400 font-mono tracking-widest uppercase ml-1">Analyzing Code Flow</span>
              </div>
            </div>

            {/* AI Question Prompt Block */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Intervention Question</span>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {question || "We noticed you implemented a streamlined mathematical approach instead of an iterative calculation. Can you clarify the architectural trade-offs of this decision, particularly regarding stack memory usage and performance overhead?"}
              </p>
            </div>
          </div>

          {/* Warning notice */}
          <div className="flex items-start space-x-2 text-slate-500 text-[10px] border-t border-slate-900 pt-4 mt-4 relative z-10">
            <AlertCircle className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>The exam workspace is frozen. Your coding timer is paused. Respond to resume.</span>
          </div>
        </div>

        {/* Right Panel: Developer Textarea Input Justification */}
        <form onSubmit={handleSubmit} className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-slate-900/40">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center">
              <label htmlFor="justification" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Developer Justification
              </label>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                <User className="h-3 w-3" />
                <span>CANDIDATE INPUT</span>
              </div>
            </div>

            {/* Textarea Input Wrapper */}
            <div className="flex-1 min-h-0 relative flex flex-col">
              <textarea
                id="justification"
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: By using a direct mathematical multiplier, we achieve O(1) time and space complexity, completely avoiding call stack frames or recursive overhead..."
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:border-violet-500 focus:outline-none resize-none font-sans leading-relaxed min-h-[180px]"
              />
              {/* Word Count / Character Count indicator */}
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500">
                {text.length} characters (Min 25)
              </div>
            </div>

            {error && (
              <div className="flex items-start space-x-1.5 text-rose-400 text-[11px] bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="border-t border-slate-900/60 pt-4 mt-4 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/10 active:scale-97 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Response & Resume Exam</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
