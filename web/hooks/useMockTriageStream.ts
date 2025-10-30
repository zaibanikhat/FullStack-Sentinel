import { useState, useEffect, useCallback, useRef } from 'react';
import { TriageRun, TriageStep } from '../types';
import { startTriage, getTriageStream } from '../services/mockApi';

// Helper function for exponential backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useMockTriageStream = (alertId: string | null) => {
  const [triageRun, setTriageRun] = useState<TriageRun | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sseLog, setSseLog] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Reset rate limiting state when we get a successful connection
  const processStreamEvent = useCallback((event: any) => {
    setTriageRun(prev => {
      if (!prev) return null;
      const newRun = { ...prev };

      switch (event.type) {
        case 'plan_built':
          newRun.plan = event.data.plan;
          newRun.trace = event.data.plan.map((stepName: string, i: number) => ({
            seq: i,
            step: stepName,
            status: 'pending',
            ok: null,
            duration_ms: null,
            detail: null,
          }));
          break;
        case 'tool_update':
          const stepIndex = newRun.trace.findIndex(s => s.seq === event.data.seq);
          if (stepIndex > -1) {
            newRun.trace[stepIndex] = { ...newRun.trace[stepIndex], ...event.data };
          }
          break;
        case 'decision_finalized':
          newRun.decision = event.data.decision;
          break;
        case 'sse_log':
          setSseLog(event.data.message);
          break;
        default:
          break;
      }
      return newRun;
    });
  }, []);

  const startTriageProcess = useCallback(async (id: string, attempt = 0): Promise<() => void> => {
    setIsLoading(true);
    setTriageRun(null);
    setIsConnected(false);
    setSseLog(null);
    
    let cleanupStream: (() => void) | undefined;

    try {
      const { runId } = await startTriage(id);
      
      // Reset rate limiting state on success
      setIsRateLimited(false);
      setRetryAfter(null);
      retryCountRef.current = 0;
      
      setTriageRun({
        runId,
        alertId: id,
        plan: null,
        trace: [],
        decision: null
      });
      
      setIsLoading(false);
      setIsConnected(true);
      
      cleanupStream = getTriageStream(
        runId, 
        processStreamEvent,
        () => setIsConnected(false)
      );
      
      return () => {
        if (cleanupStream) cleanupStream();
      };
      
    } catch (error: any) {
      console.error("Triage error:", error);
      
      if (error.status === 429) {
        // Handle rate limiting
        const retryAfter = error.retryAfter || 5; // Default to 5 seconds if not provided
        const nextAttempt = attempt + 1;
        
        if (nextAttempt <= maxRetries) {
          setIsRateLimited(true);
          setRetryAfter(retryAfter);
          retryCountRef.current = nextAttempt;
          
          // Schedule retry with exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, nextAttempt - 1), 30000); // Cap at 30s
          
          const retryTimer = setTimeout(() => {
            startTriageProcess(id, nextAttempt);
          }, backoffTime);
          
          // Update retry after counter
          const interval = setInterval(() => {
            setRetryAfter(prev => {
              if (prev === null) return null;
              const newTime = prev - 1;
              if (newTime <= 0) {
                clearInterval(interval);
                return null;
              }
              return newTime;
            });
          }, 1000);
          
          return () => {
            clearTimeout(retryTimer);
            clearInterval(interval);
            if (cleanupStream) cleanupStream();
          };
        }
      }
      
      // If we get here, we've exhausted retries or encountered a different error
      setIsLoading(false);
      setSseLog(`Failed to start triage: ${error.message}`);
      
      return () => {
        if (cleanupStream) cleanupStream();
      };
    }
  }, [processStreamEvent]);

  useEffect(() => {
    if (!alertId) return;
    
    let cleanup: (() => void) | undefined;
    
    const init = async () => {
      cleanup = await startTriageProcess(alertId);
    };
    
    init();
    
    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId, processStreamEvent]);

  return { 
    triageRun, 
    isLoading, 
    isConnected, 
    sseLog, 
    isRateLimited,
    retryAfter,
    retryCount: retryCountRef.current
  };
};