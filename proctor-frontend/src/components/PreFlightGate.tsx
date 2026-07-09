"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Play, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

interface PreFlightGateProps {
  onEnterSecureRoom: (photoBase64: string) => void;
  cameraEnabled?: boolean;
  fullscreenEnabled?: boolean;
}

type DeviceStatus = 'idle' | 'checking' | 'success' | 'failed';

export default function PreFlightGate({ 
  onEnterSecureRoom,
  cameraEnabled = true,
  fullscreenEnabled = true
}: PreFlightGateProps) {
  const [cameraStatus, setCameraStatus] = useState<DeviceStatus>(cameraEnabled ? 'idle' : 'success');
  const [micStatus, setMicStatus] = useState<DeviceStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(cameraEnabled ? null : 'CAMERA_DISABLED');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize and check hardware devices
  const checkHardware = async () => {
    setErrorMsg(null);
    if (cameraEnabled) {
      setCameraStatus('checking');
    }
    setMicStatus('checking');

    let videoStream: MediaStream | null = null;
    let audioStream: MediaStream | null = null;
    let cameraOk = !cameraEnabled;
    let micOk = false;

    // Check camera
    if (cameraEnabled) {
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        cameraOk = true;
        setCameraStatus('success');
        setStream(videoStream);
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }
      } catch (err) {
        console.error("Camera check error:", err);
        setCameraStatus('failed');
      }
    }

    // Check microphone
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micOk = true;
      setMicStatus('success');
      // Release microphone immediately after verifying permission to avoid feedback loops
      audioStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone check error:", err);
      setMicStatus('failed');
    }

    if (!cameraOk || !micOk) {
      setErrorMsg(`Failed to access ${!cameraOk ? 'camera or ' : ''}microphone. Please enable permissions in your browser settings and try again.`);
    }
  };

  useEffect(() => {
    checkHardware();

    return () => {
      // Clean up camera stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video element source if stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Capture Base64 Snapshot
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhoto(dataUrl);
      }
    } catch (err) {
      console.error("Snapshot capture error:", err);
      setErrorMsg("Error capturing snapshot. Make sure the webcam is active.");
    }
  };

  const handleEnterSecureRoom = () => {
    if (cameraStatus !== 'success' || micStatus !== 'success' || !photo) return;
    onEnterSecureRoom(photo);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-slate-800/80 pb-6 mb-8 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SynapseAssess Secure Gate
            </h1>
            <p className="text-xs text-slate-400">Next-Gen Proctoring System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-full">
          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-300 font-medium">Secure Handshake Active</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 my-auto">
        {/* Left Side: Instructions & Device Verification */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              System Pre-Flight Checks
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              To guarantee exam integrity, we must verify your system peripherals and establish your identity prior to unlocking the secure workspace.
            </p>
          </div>

          {/* Hardware Checks Status Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Device Matrix</h3>
            
            <div className="space-y-3">
              {/* Camera Status */}
              {cameraEnabled && (
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      cameraStatus === 'success' ? 'bg-emerald-950/40 text-emerald-400' :
                      cameraStatus === 'failed' ? 'bg-rose-950/40 text-rose-400' : 'bg-slate-800/50 text-slate-400'
                    }`}>
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">Video Surveillance Check</h4>
                      <p className="text-xs text-slate-400">Integrated Web Camera</p>
                    </div>
                  </div>
                  <div>
                    {cameraStatus === 'checking' && (
                      <RefreshCw className="h-4 w-4 text-violet-400 animate-spin" />
                    )}
                    {cameraStatus === 'success' && (
                      <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Ready</span>
                      </span>
                    )}
                    {cameraStatus === 'failed' && (
                      <span className="flex items-center space-x-1.5 text-xs text-rose-400 font-medium px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Failed</span>
                      </span>
                    )}
                    {cameraStatus === 'idle' && (
                      <span className="text-xs text-slate-500 px-2 py-1">Pending</span>
                    )}
                  </div>
                </div>
              )}

              {/* Microphone Status */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    micStatus === 'success' ? 'bg-emerald-950/40 text-emerald-400' :
                    micStatus === 'failed' ? 'bg-rose-950/40 text-rose-400' : 'bg-slate-800/50 text-slate-400'
                  }`}>
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">Acoustic Monitoring Check</h4>
                    <p className="text-xs text-slate-400">Primary Microphone Input</p>
                  </div>
                </div>
                <div>
                  {micStatus === 'checking' && (
                    <RefreshCw className="h-4 w-4 text-violet-400 animate-spin" />
                  )}
                  {micStatus === 'success' && (
                    <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Ready</span>
                    </span>
                  )}
                  {micStatus === 'failed' && (
                    <span className="flex items-center space-x-1.5 text-xs text-rose-400 font-medium px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Failed</span>
                    </span>
                  )}
                  {micStatus === 'idle' && (
                    <span className="text-xs text-slate-500 px-2 py-1">Pending</span>
                  )}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start space-x-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {cameraEnabled && (
              <button
                onClick={checkHardware}
                className="w-full flex items-center justify-center space-x-2 py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-900 rounded-xl transition text-xs font-medium text-slate-300 active:scale-98"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Device Hardware Check</span>
              </button>
            )}
          </div>

          {/* Secure Environment Checklist Card */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-sm font-semibold text-slate-300">Rules & Environment Protocols</h3>
            <ul className="text-xs text-slate-400 space-y-2.5">
              {fullscreenEnabled && (
                <li className="flex items-start space-x-2">
                  <span className="h-1.5 w-1.5 bg-violet-500 rounded-full mt-1.5 shrink-0" />
                  <span><strong>Fullscreen Enforcement:</strong> Exiting fullscreen at any point triggers a lock event that restricts exam page access.</span>
                </li>
              )}
              <li className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 bg-violet-500 rounded-full mt-1.5 shrink-0" />
                <span><strong>Tab & Focus Tracking:</strong> All page unfocus/blur actions are recorded and count towards automatic session flagging.</span>
              </li>
              {cameraEnabled && (
                <li className="flex items-start space-x-2">
                  <span className="h-1.5 w-1.5 bg-violet-500 rounded-full mt-1.5 shrink-0" />
                  <span><strong>Surveillance Stream:</strong> Video stream is analyzed client-side for head pose alignment (proctoring validation).</span>
                </li>
              )}
              {!cameraEnabled && (
                <li className="flex items-start space-x-2">
                  <span className="h-1.5 w-1.5 bg-indigo-500/40 rounded-full mt-1.5 shrink-0" />
                  <span className="text-slate-400"><strong>Camera Surveillance:</strong> Disabled by recruiter. No video monitoring active for this session.</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Side: Camera Live Feed & Identity Photo Capture */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 px-1 uppercase tracking-wider">Identity Capture Panel</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Live Web Camera Viewport */}
              <div className="relative aspect-video md:aspect-square bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center group shadow-inner">
                {!cameraEnabled ? (
                  <div className="text-center p-4 space-y-2">
                    <Camera className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-450 font-semibold uppercase tracking-wider">Webcam Proctoring Off</p>
                    <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto leading-relaxed">Verification photo capture is not required for this exam configuration.</p>
                  </div>
                ) : cameraStatus === 'success' && !photo ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* Retro Camera Reticle HUD */}
                    <div className="absolute inset-4 border border-dashed border-violet-500/20 rounded-lg pointer-events-none flex items-center justify-center">
                      <div className="w-8 h-8 border-t-2 border-l-2 border-violet-500/60 absolute top-0 left-0" />
                      <div className="w-8 h-8 border-t-2 border-r-2 border-violet-500/60 absolute top-0 right-0" />
                      <div className="w-8 h-8 border-b-2 border-l-2 border-violet-500/60 absolute bottom-0 left-0" />
                      <div className="w-8 h-8 border-b-2 border-r-2 border-violet-500/60 absolute bottom-0 right-0" />
                      <span className="text-[10px] uppercase font-mono tracking-widest text-violet-400/50 px-2 py-0.5 bg-slate-950/80 border border-slate-800 rounded-md">Live Stream</span>
                    </div>
                  </>
                ) : cameraStatus !== 'success' ? (
                  <div className="text-center p-4">
                    <Camera className="h-10 w-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs text-slate-500">Camera feed unavailable</p>
                  </div>
                ) : photo ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-center p-4">
                    <div className="space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                      <p className="text-xs text-slate-400">Active feed suspended. Snapshot saved.</p>
                      <button
                        onClick={() => {
                          setPhoto(null);
                          if (stream && videoRef.current) {
                            videoRef.current.srcObject = stream;
                          }
                        }}
                        className="text-xs text-violet-400 hover:text-violet-300 font-medium underline underline-offset-4"
                      >
                        Reset & Reactivate Stream
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Saved Photo Frame / Preview */}
              <div className="relative aspect-video md:aspect-square bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                {!cameraEnabled ? (
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-full border border-slate-800/80 bg-slate-900/60 flex items-center justify-center mx-auto">
                      <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-350">Photo Gate Bypassed</h4>
                      <p className="text-[11px] text-slate-550 leading-relaxed max-w-[200px] mx-auto mt-1">
                        Metadata photo snap is automatically waived for this session.
                      </p>
                    </div>
                  </div>
                ) : photo ? (
                  <div className="relative w-full h-full flex flex-col justify-between">
                    <div className="relative flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mb-3">
                      <img
                        src={photo}
                        alt="Candidate Identity Photo"
                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                      <span>verification_photo.jpg</span>
                      <span className="font-mono text-emerald-400 text-[10px]">BASE64 STRING STORED</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-full border border-slate-800/80 bg-slate-900/60 flex items-center justify-center mx-auto">
                      <ShieldCheck className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300">No Photo Captured Yet</h4>
                      <p className="text-[11px] text-slate-550 leading-relaxed max-w-[200px] mx-auto mt-1">
                        Capture a face photo to link with your exam metadata.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Trigger Row */}
            {cameraEnabled && (
              <div className="mt-4 flex items-center justify-end space-x-3">
                <button
                  disabled={cameraStatus !== 'success'}
                  onClick={captureSnapshot}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-55 disabled:hover:bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl transition text-xs font-medium active:scale-98"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capture Verification Snapshot</span>
                </button>
              </div>
            )}
          </div>

          {/* Secure Entry Action Gate */}
          <div className="bg-gradient-to-r from-slate-900/80 to-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md">
            <div className="space-y-1 relative z-10">
              <h3 className="text-sm font-semibold text-white">Unlock Secure Exam Workspace</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Requires green light status across all device gates and verification snapshot capture.
              </p>
            </div>
            
            <button
              onClick={handleEnterSecureRoom}
              disabled={cameraStatus !== 'success' || micStatus !== 'success' || !photo}
              className="relative z-10 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-xl group border active:scale-97 disabled:scale-100 bg-gradient-to-tr from-violet-600 to-indigo-600 border-indigo-500 text-white hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-500/25 disabled:from-slate-850 disabled:to-slate-850 disabled:border-slate-800 disabled:text-slate-500 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              <span>Enter Secure Exam Room</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto border-t border-slate-900 pt-6 mt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 relative z-10">
        <p>© 2026 SynapseAssess Inc. All Rights Reserved. Client Proctor Wrapper build v1.0.4</p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="#" className="hover:text-slate-400">Security Sandbox Specs</a>
          <a href="#" className="hover:text-slate-400">Data Retention Statement</a>
        </div>
      </footer>
    </div>
  );
}
