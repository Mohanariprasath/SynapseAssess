"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ProctorSocketOptions {
  onTriggerAIIntervention?: (question: string) => void;
  onReleaseAIIntervention?: () => void;
  onViolationOccurred?: (type: 'FOCUS_LOST' | 'TAB_SWITCH' | 'SCREEN_UNSHARED') => void;
}

export function useProctorSocket({ 
  onTriggerAIIntervention, 
  onReleaseAIIntervention, 
  onViolationOccurred 
}: ProctorSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [screenShareActive, setScreenShareActive] = useState<boolean>(false);
  const [screenDimensions, setScreenDimensions] = useState<{ width: number; height: number } | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const callbacksRef = useRef<ProctorSocketOptions>({
    onTriggerAIIntervention,
    onReleaseAIIntervention,
    onViolationOccurred
  });

  // Sync callbacks on every render to avoid stale closures
  useEffect(() => {
    callbacksRef.current = {
      onTriggerAIIntervention,
      onReleaseAIIntervention,
      onViolationOccurred
    };
  });

  const screenShareActiveRef = useRef<boolean>(false);
  useEffect(() => {
    screenShareActiveRef.current = screenShareActive;
  }, [screenShareActive]);

  // Initialize Socket.io connection
  useEffect(() => {
    // Establish connections with real-time websocket endpoint
    const socketInstance = io('http://localhost:3001', {
      autoConnect: false,
      reconnectionAttempts: 3,
      timeout: 5000
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.connect();

    // Active Interception Gate listener
    socketInstance.on('ai_intervention_trigger', (data?: { question?: string }) => {
      const questionText = data?.question || "We noticed you implemented a streamlined mathematical approach instead of an iterative calculation. Can you clarify the architectural trade-offs of this decision, particularly regarding stack memory usage and performance overhead?";
      console.log('[Telemetry] AI Intervention requested by grading engine:', questionText);
      if (callbacksRef.current.onTriggerAIIntervention) {
        callbacksRef.current.onTriggerAIIntervention(questionText);
      }
    });

    // Active Intervention Release listener
    socketInstance.on('ai_intervention_release', (data?: { success?: boolean }) => {
      console.log('[Telemetry] AI Intervention release signal received:', data);
      if (callbacksRef.current.onReleaseAIIntervention) {
        callbacksRef.current.onReleaseAIIntervention();
      }
    });

    // Handle standard log connection status
    socketInstance.on('connect', () => {
      console.log('[Telemetry] WebSocket channel initialized successfully');
    });

    socketInstance.on('connect_error', () => {
      console.warn('[Telemetry] Sockets backend offline. Running in secure client-only mode.');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Tab & Focus Telemetry Listeners
  useEffect(() => {
    const handleBlur = () => {
      if (!screenShareActiveRef.current) return;

      console.warn('[Telemetry] Focus lost anomaly caught');
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('security_anomaly', {
          type: 'FOCUS_LOST',
          timestamp: Date.now()
        });
      }
      if (callbacksRef.current.onViolationOccurred) {
        callbacksRef.current.onViolationOccurred('FOCUS_LOST');
      }
    };

    const handleVisibilityChange = () => {
      if (!screenShareActiveRef.current) return;

      if (document.visibilityState === 'hidden') {
        console.warn('[Telemetry] Tab visibility change caught (HIDDEN)');
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('security_anomaly', {
            type: 'TAB_SWITCH',
            timestamp: Date.now()
          });
        }
        if (callbacksRef.current.onViolationOccurred) {
          callbacksRef.current.onViolationOccurred('TAB_SWITCH');
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Debounced Code Synchronizer
  const syncCode = (code: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('code_update', {
          code,
          length: code.length
        });
      }
      console.log('[Telemetry] Dispatching debounced code buffer to server. Size:', code.length);
    }, 2000);
  };

  // Submit Candidate Response
  const submitAnswer = (question: string, answer: string, code: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('submit_answer', {
        question,
        answer,
        code
      });
      console.log('[Telemetry] Dispatched candidate justification answer to server');
    } else {
      // Offline fallback: release modal instantly so candidates aren't locked out in dev
      console.warn('[Telemetry] Sockets offline. Simulating release trigger locally.');
      if (callbacksRef.current.onReleaseAIIntervention) {
        callbacksRef.current.onReleaseAIIntervention();
      }
    }
  };

  // Screen Share Handshake
  const startScreenShare = async (): Promise<boolean> => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      const videoTrack = mediaStream.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();
      
      const width = settings?.width || window.screen.width;
      const height = settings?.height || window.screen.height;

      setScreenDimensions({ width, height });
      setScreenShareActive(true);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('screen_share_handshake', {
          width,
          height,
          timestamp: Date.now()
        });
      }

      console.log('[Telemetry] Screen share active. Dimensions captured:', width, 'x', height);

      // Listen for manual stream termination by candidate
      videoTrack.addEventListener('ended', () => {
        setScreenShareActive(false);
        setScreenDimensions(null);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('security_anomaly', {
            type: 'SCREEN_UNSHARED',
            timestamp: Date.now()
          });
        }
        if (callbacksRef.current.onViolationOccurred) {
          callbacksRef.current.onViolationOccurred('SCREEN_UNSHARED');
        }
      });

      return true;
    } catch (err) {
      console.error('[Telemetry] Screen share permission rejected:', err);
      setScreenShareActive(false);
      return false;
    }
  };

  return {
    socket,
    syncCode,
    submitAnswer,
    startScreenShare,
    screenShareActive,
    screenDimensions
  };
}
