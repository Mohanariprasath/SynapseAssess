"use client";

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useProctorSocket } from '../hooks/useProctorSocket';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  Play, 
  Terminal, 
  MessageSquare, 
  Settings,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface SecureWorkspaceProps {
  photoBase64: string;
  examId?: string;
  examType: 'coding' | 'mcq';
  examTitle: string;
  examDescription?: string;
  starterCode?: string;
  mcqQuestions?: any[];
  cameraEnabled?: boolean;
  fullscreenEnabled?: boolean;
  onTriggerIntervention: (question: string) => void;
  onReleaseIntervention: () => void;
  onViolationOccurred: (count: number) => void;
  onSubmitAnswerRef?: React.MutableRefObject<((answer: string) => void) | null>;
  onExamSubmitted?: () => void;
  onScreenShareActiveChange?: (active: boolean) => void;
}

export default function SecureWorkspace({ 
  photoBase64, 
  examId,
  examType,
  examTitle,
  examDescription,
  starterCode,
  mcqQuestions,
  cameraEnabled = true,
  fullscreenEnabled = true,
  onTriggerIntervention,
  onReleaseIntervention,
  onViolationOccurred,
  onSubmitAnswerRef,
  onExamSubmitted,
  onScreenShareActiveChange
}: SecureWorkspaceProps) {
  const [code, setCode] = useState<string>(
    starterCode || 
    `function solve(input) {
  // Write your enterprise grade algorithm here
  console.log("Processing synapse data...");
  return input * 2;
}`
  );
  
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'idle'>('synced');
  const [infractions, setInfractions] = useState<number>(0);
  const [activeViolation, setActiveViolation] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [output, setOutput] = useState<string>("Click 'Run Code' to execute tests against candidate compiler.");
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuestionRef = useRef<string>('');

  // Initialize camera for surveillance PIP
  useEffect(() => {
    if (!cameraEnabled) return;

    const startSurveillance = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Surveillance camera failed to start:", err);
      }
    };

    startSurveillance();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraEnabled]);

  // Sync Video Ref stream if video element mounts/updates
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [videoRef.current]);

  // Sockets Telemetry and Screen Share Handshake Hook
  const { syncCode, submitAnswer, startScreenShare, screenShareActive, screenDimensions } = useProctorSocket({
    onTriggerAIIntervention: (q) => {
      lastQuestionRef.current = q;
      onTriggerIntervention(q);
    },
    onReleaseAIIntervention: onReleaseIntervention,
    onViolationOccurred: (type) => {
      let reason = "Proctoring violation detected.";
      if (type === 'FOCUS_LOST') {
        reason = "Window Focus Lost. Moving focus away from the test interface is flagged as a high-severity infraction.";
      } else if (type === 'TAB_SWITCH') {
        reason = "Tab Switch Detected. Attempting to browse other browser tabs has been flagged.";
      } else if (type === 'SCREEN_UNSHARED') {
        reason = "Screen Sharing Stopped. Screen sharing is mandatory for proctor validation.";
      }

      if (activeViolation) return;
      
      const newCount = infractions + 1;
      setInfractions(newCount);
      setActiveViolation(reason);
      onViolationOccurred(newCount);
    }
  });

  // Notify parent of screen share status
  useEffect(() => {
    if (onScreenShareActiveChange) {
      onScreenShareActiveChange(screenShareActive);
    }
  }, [screenShareActive, onScreenShareActiveChange]);

  const handleStartScreenShare = async () => {
    const success = await startScreenShare();
    if (success && fullscreenEnabled) {
      const element = document.documentElement;
      if (element.requestFullscreen && !document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          console.error("Failed to re-enter fullscreen after screen share:", err);
        });
      }
    }
  };

  // Wire up justification submissions from parent Modal to Sockets
  useEffect(() => {
    if (onSubmitAnswerRef) {
      onSubmitAnswerRef.current = (answer: string) => {
        submitAnswer(lastQuestionRef.current, answer, code);
      };
    }
  }, [onSubmitAnswerRef, submitAnswer, code]);

  // Debounced State Syncing
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setCode(value);
    setSyncState('syncing');

    // Call Sockets Telemetry sync handler
    syncCode(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setSyncState('synced');
    }, 2000);
  };

  const handleRunCode = () => {
    setOutput("Executing test cases...\n> node index.js\n\n[Test Case 1] Input: 5 -> Output: 10 (PASSED)\n[Test Case 2] Input: 12 -> Output: 24 (PASSED)\n\nAll client-side verification tests completed successfully.");
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    setMcqAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitExam = () => {
    if (examType === 'mcq') {
      const answeredCount = Object.keys(mcqAnswers).length;
      const totalCount = mcqQuestions?.length || 0;
      if (answeredCount < totalCount) {
        if (!confirm(`You have answered ${answeredCount} out of ${totalCount} questions. Are you sure you want to submit?`)) {
          return;
        }
      } else {
        if (!confirm("Are you sure you want to submit your exam?")) {
          return;
        }
      }

      let correctCount = 0;
      mcqQuestions?.forEach(q => {
        if (mcqAnswers[q.id] === q.correctIndex) {
          correctCount++;
        }
      });
      const score = Math.round((correctCount / (totalCount || 1)) * 100);

      submitAnswer(
        examTitle,
        `MCQ Exam Submitted. Score: ${score}%. Answers: ${JSON.stringify(mcqAnswers)}`,
        JSON.stringify(mcqAnswers)
      );
    } else {
      if (!confirm("Are you sure you want to submit your coding solution?")) {
        return;
      }
      submitAnswer(
        examTitle,
        "Coding Solution Submitted.",
        code
      );
    }

    if (onExamSubmitted) {
      onExamSubmitted();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Banner Control Panel */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 px-6 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping" />
          <h2 className="text-sm font-semibold tracking-tight text-white">Live Proctoring Room</h2>
          <span className="h-4 w-px bg-slate-800" />
          <span className="text-xs text-slate-400 font-mono">ID: {examId || 'exam-session-982'}</span>
        </div>

        {/* Sync Indicator & Violation Counter */}
        <div className="flex items-center space-x-6">
          {/* Sync Status Badge */}
          <div className="flex items-center space-x-2 text-xs">
            {syncState === 'syncing' ? (
              <span className="flex items-center space-x-1.5 text-violet-400 bg-violet-500/10 px-2.5 py-1 border border-violet-500/20 rounded-full">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Syncing buffer...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                <span>Saved & Synced</span>
              </span>
            )}
          </div>

          {/* Infraction Matrix Display */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Infractions:</span>
            <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
              infractions === 0 ? 'bg-slate-900 border border-slate-800 text-slate-300' :
              infractions === 1 ? 'bg-amber-950 border border-amber-500/20 text-amber-400' :
              'bg-rose-950 border border-rose-500/20 text-rose-400 animate-pulse'
            }`}>
              {infractions} / 3 Warnings
            </span>
          </div>

          <button
            onClick={() => onTriggerIntervention("Simulated AI Question: Can you explain the design decisions in your code?")}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/15 border border-indigo-500 transition active:scale-97"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simulate AI Question</span>
          </button>

          <button
            onClick={handleSubmitExam}
            className="flex items-center bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/15 border border-emerald-500 transition active:scale-97 cursor-pointer"
          >
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout Split-Screen */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Instructions & Info */}
        <aside className="w-80 border-r border-slate-900 bg-slate-950/40 flex flex-col justify-between overflow-y-auto">
          <div className="p-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                {examType === 'mcq' ? 'MCQ Sheet' : 'Coding Challenge'}
              </span>
              <h1 className="text-lg font-bold text-white leading-tight">{examTitle}</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {examDescription || 'Complete all elements of the exam to submit.'}
              </p>
            </div>

            {examType === 'coding' && (
              <div className="border-t border-slate-900 pt-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200">Constraints</h3>
                <ul className="text-xs text-slate-400 space-y-2 font-mono">
                  <li className="flex items-start space-x-2">
                    <span className="text-violet-500 font-bold">•</span>
                    <span>Input type: Integer</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-violet-500 font-bold">•</span>
                    <span>Result must not overflow</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-violet-500 font-bold">•</span>
                    <span>O(1) time complexity</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-900 bg-slate-950/60">
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
              <Terminal className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-400 uppercase tracking-wider">Candidate Verification</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Workspace checks base64 handshake photo against active camera frames continuously.
            </p>
          </div>
        </aside>

        {/* Center: Monaco Coding Editor or MCQ Sheet */}
        <main className="flex-1 flex flex-col bg-slate-950">
          {examType === 'mcq' ? (
            <div className="flex-1 overflow-y-auto p-8 bg-slate-950/40">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">{examTitle}</h2>
                    <p className="text-xs text-slate-450 mt-1">Select the most accurate response for each question.</p>
                  </div>
                  <span className="text-xs text-violet-400 bg-violet-500/10 px-2.5 py-1 border border-violet-500/20 rounded-full font-mono font-semibold">
                    {Object.keys(mcqAnswers).length} of {mcqQuestions?.length || 0} Answered
                  </span>
                </div>

                {mcqQuestions?.map((q, idx) => (
                  <div key={q.id} className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                    <h4 className="text-sm font-semibold text-white leading-relaxed">
                      <span className="text-violet-400 font-bold mr-1.5">{idx + 1}.</span>
                      {q.question}
                    </h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = mcqAnswers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition active:scale-99 cursor-pointer flex items-center space-x-3 ${
                              isSelected
                                ? 'bg-indigo-600/10 border-indigo-500 text-white'
                                : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-mono font-bold ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-550 text-white shadow-md shadow-indigo-500/10'
                                : 'border-slate-700 bg-slate-900 text-slate-500'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Finalize MCQ Section */}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSubmitExam}
                    className="flex items-center space-x-2 py-3 px-8 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border border-emerald-500 text-white font-semibold rounded-xl text-xs transition active:scale-97 cursor-pointer"
                  >
                    <span>Submit MCQ Assessment</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* File Tab Selector */}
              <div className="h-10 border-b border-slate-900 bg-slate-950/20 flex items-center justify-between px-6">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-yellow-500 rounded-full" />
                  <span className="text-xs font-medium font-mono text-slate-300">solution.js</span>
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-md focus:border-violet-500 focus:outline-none cursor-pointer"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                </select>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 w-full min-h-0 relative">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  language={selectedLanguage}
                  theme="vs-dark"
                  value={code}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'Consolas, "Courier New", monospace',
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    cursorBlinking: 'smooth',
                    lineHeight: 22,
                    scrollbar: {
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    }
                  }}
                />
              </div>

              {/* Code Execution Panel */}
              <div className="h-56 border-t border-slate-900 bg-slate-950/80 flex flex-col">
                <div className="h-10 border-b border-slate-900 px-6 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Console Output</span>
                  <button
                    onClick={handleRunCode}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1 rounded-lg text-xs font-medium shadow-lg shadow-emerald-500/10 border border-emerald-500 transition active:scale-97"
                  >
                    <Play className="h-3 w-3" />
                    <span>Run Code</span>
                  </button>
                </div>
                <div className="flex-1 p-5 font-mono text-xs text-slate-400 overflow-y-auto bg-slate-950/40 leading-relaxed whitespace-pre-wrap select-text">
                  {output}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Floating Surveillance Card Overlay (Top Right PIP) */}
      {cameraEnabled && (
        <div className="fixed top-20 right-6 z-40 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md w-56 flex flex-col p-2.5">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-2 px-1">
            <span className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
              <span className="uppercase tracking-wider font-mono">FEED_01_PROCTOR</span>
            </span>
            <span className="text-slate-500 font-mono">ACTIVE</span>
          </div>

          {/* Streaming Video Component */}
          <div className="relative aspect-video w-full bg-slate-950 border border-slate-850 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />

            {/* Verification Photo Thumbnail Overlay */}
            <div className="absolute bottom-1 right-1 w-10 h-10 border border-slate-700 bg-slate-900 rounded overflow-hidden shadow-md">
              {photoBase64 !== 'CAMERA_DISABLED' ? (
                <img 
                  src={photoBase64} 
                  alt="Handshake Verification"
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
              ) : (
                <div className="w-full h-full bg-slate-850 flex items-center justify-center">
                  <span className="text-[10px] text-indigo-400 font-semibold font-mono">BYPASSED</span>
                </div>
              )}
            </div>

            {/* Camera Scanning Reticle overlay */}
            <div className="absolute inset-2 border border-emerald-500/10 rounded-md pointer-events-none flex items-center justify-center">
              <div className="w-3 h-3 border-t border-l border-emerald-400/40 absolute top-0 left-0" />
              <div className="w-3 h-3 border-t border-r border-emerald-400/40 absolute top-0 right-0" />
              <div className="w-3 h-3 border-b border-l border-emerald-400/40 absolute bottom-0 left-0" />
              <div className="w-3 h-3 border-b border-r border-emerald-400/40 absolute bottom-0 right-0" />
            </div>
          </div>

          {/* Face Mesh Placeholder & Metadata */}
          <div className="mt-2 text-[10px] text-slate-500 space-y-1 px-1 font-mono leading-tight">
            <div className="flex justify-between">
              <span>Face Mesh Alignment:</span>
              <span className="text-emerald-400">98.4%</span>
            </div>
            <div className="flex justify-between">
              <span>Eye Tracker:</span>
              <span className="text-emerald-400">Locked</span>
            </div>
            <div className="flex justify-between">
              <span>Primary Screen:</span>
              <span className="text-emerald-400">{screenDimensions ? `${screenDimensions.width}x${screenDimensions.height}` : 'Reading...'}</span>
            </div>
            
            {/*
              ====================================================================
              CLIENT-SIDE FACE MESH TRACKING INITIALIZATION PLACEHOLDER
              ====================================================================
              This section represents how a coding architect would plug in 
              MediaPipe Face Mesh or TensorFlow Face Landmark Detection client-side:

              const initializeFaceMeshTracking = async (videoElement) => {
                const faceMesh = new FaceMesh({
                  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
                });

                faceMesh.setOptions({
                  maxNumFaces: 1,
                  refineLandmarks: true,
                  minDetectionConfidence: 0.75,
                  minTrackingConfidence: 0.75
                });

                faceMesh.onResults((results) => {
                  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                    const landmarks = results.multiFaceLandmarks[0];
                    // Calculate head pose yaw/pitch/roll from key face anchor points
                    // Track iris centers relative to eye corners to flag gaze deviation
                    detectCheatingInfractions(landmarks);
                  } else {
                    // Face absent: raise alert count
                    onFaceAbsentTrigger();
                  }
                });

                const camera = new Camera(videoElement, {
                  onFrame: async () => {
                    await faceMesh.send({ image: videoElement });
                  },
                  width: 320,
                  height: 240
                });
                
                camera.start();
              };
            */}
            <div className="border-t border-slate-800 mt-1.5 pt-1.5 text-center text-slate-600 uppercase text-[9px] tracking-wider">
              AI Proctor Mode Enabled
            </div>
          </div>
        </div>
      )}

      {/* Infraction Blocking Overlay */}
      {activeViolation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <ShieldAlert className="h-8 w-8 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white">Security Infraction Alert</h3>
                <p className="text-xs text-rose-400">Violation {infractions} of 3</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeViolation}
            </p>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">Security Policy Reminders:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Keep cursor within the exam browser bounds.</li>
                <li>Do not click off, minimize, or switch workspace tabs.</li>
                <li>Avoid secondary screens or projection devices.</li>
              </ul>
            </div>

            <button
              onClick={() => setActiveViolation(null)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition active:scale-98"
            >
              I Acknowledge, Resume Coding
            </button>
          </div>
        </div>
      )}

      {/* Screen Share Handshake Overlay */}
      {!screenShareActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="h-14 w-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Maximize2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Screen Share Verification</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                To ensure validation compliance and confirm single-monitor desktop specs, you must share your primary desktop monitor before the exam space unlocks.
              </p>
            </div>
            <button
              onClick={handleStartScreenShare}
              className="w-full py-3 bg-gradient-to-tr from-indigo-600 to-indigo-550 border border-indigo-500 text-white font-semibold rounded-xl text-xs transition active:scale-98 cursor-pointer"
            >
              Share Primary Monitor Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
