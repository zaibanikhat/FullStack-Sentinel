import React, { useEffect, useRef, useState } from 'react';
import { Alert, TriageRun, TriageStep } from '../types';
import { useMockTriageStream } from '../hooks/useMockTriageStream';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon, InformationCircleIcon, CpuChipIcon, DocumentTextIcon, LockClosedIcon, PaperAirplaneIcon, ExclamationTriangleIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

// Helper function to redact credit card numbers
const redactPII = (text: string | null | undefined): { text: string; hasRedacted: boolean } => {
  if (!text) return { text: text || '', hasRedacted: false };
  
  // Match 13-16 digit numbers that could be credit cards
  const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  let hasRedacted = false;
  
  const redactedText = text.replace(creditCardRegex, (match) => {
    // Remove non-digit characters for validation
    const digits = match.replace(/\D/g, '');
    // Simple Luhn check for potential credit card numbers
    if (digits.length >= 13 && digits.length <= 16) {
      hasRedacted = true;
      return '****REDACTED****';
    }
    return match;
  });
  
  return { text: redactedText, hasRedacted };
};

// Wrapper for console methods that redacts PII
const safeConsole = {
  log: (...args: any[]) => {
    const redactedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return redactPII(arg).text;
      } else if (arg && typeof arg === 'object') {
        return JSON.parse(JSON.stringify(arg, (key, value) => {
          if (typeof value === 'string') {
            return redactPII(value).text;
          }
          return value;
        }));
      }
      return arg;
    });
    console.log(...redactedArgs);
  },
  error: (...args: any[]) => {
    const redactedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return redactPII(arg).text;
      } else if (arg && typeof arg === 'object') {
        return JSON.parse(JSON.stringify(arg, (key, value) => {
          if (typeof value === 'string') {
            return redactPII(value).text;
          }
          return value;
        }));
      }
      return arg;
    });
    console.log(...redactedArgs);
  }
};
import { fetchKbArticle } from '../services/mockApi';
import KnowledgeBaseModal from './KnowledgeBaseModal';
import { getRiskColorClasses, getRiskLevel } from '../utils/colors';

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const StepStatusIcon: React.FC<{ status: TriageStep['status'] }> = ({ status }) => {
    switch (status) {
        case 'running': return <Spinner />;
        case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        case 'error': return <XCircleIcon className="h-5 w-5 text-red-500" />;
        case 'fallback': return <InformationCircleIcon className="h-5 w-5 text-yellow-500" />;
        default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
};

const ContactCustomerModal: React.FC<{ isOpen: boolean; onClose: () => void; customerName: string; onSend: () => void; recommendedAction?: string; }> = ({ isOpen, onClose, customerName, onSend, recommendedAction }) => {
    if (!isOpen) return null;

    const templates = {
        "Duplicate Charge Explanation": `Hi ${customerName},\n\nThanks for reaching out. I've reviewed your account and it looks like the duplicate charge you're seeing is a temporary authorization hold, which is common for merchants like ride-sharing apps. This is a normal part of card processing and the pending charge will disappear from your statement in a few business days. You have not been charged twice.`,
        "Suspicious Activity Inquiry": `Hi ${customerName},\n\nWe've detected some unusual activity on your account and want to make sure everything is okay. Could you please verify the recent transaction...`,
        "Transaction Verification": `Hi ${customerName},\n\nFor your security, we need to verify a recent transaction. Please confirm if you authorized the charge from...`,
        "Request for Information": `Hi ${customerName},\n\nTo help us resolve your case, could you please provide some additional information regarding...`
    };

    const getDefaultTemplate = () => {
        if (recommendedAction === 'Inform Customer & Close') {
            return templates["Duplicate Charge Explanation"];
        }
        return templates["Suspicious Activity Inquiry"];
    }

    const [message, setMessage] = useState(getDefaultTemplate());

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const key = e.target.value as keyof typeof templates;
        if (key in templates) {
            setMessage(templates[key]);
        } else {
            setMessage('');
        }
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4">
                <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Contact {customerName}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-gray-400 mb-1">Message Template</label>
                        <select
                            id="template"
                            defaultValue={recommendedAction === 'Inform Customer & Close' ? "Duplicate Charge Explanation" : "Suspicious Activity Inquiry"}
                            onChange={handleTemplateChange}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            {Object.keys(templates).map(key => <option key={key} value={key}>{key}</option>)}
                            <option value="custom">Custom Message</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-1">Message</label>
                        <textarea
                            id="message"
                            rows={6}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-900/50 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition">Cancel</button>
                    <button onClick={onSend} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center">
                        <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                        Send Message
                    </button>
                </div>
            </div>
         </div>
    );
};


const TriageDrawer: React.FC<{ alert: Alert; onClose: (actionTaken?: boolean, finalTriageRun?: TriageRun | null) => void }> = ({ alert, onClose }) => {
  const isResolved = !!alert.triageRun;
  const { 
    triageRun: streamTriageRun, 
    isLoading, 
    isConnected, 
    sseLog, 
    isRateLimited, 
    retryAfter, 
    retryCount 
  } = useMockTriageStream(isResolved ? null : alert.id);
  const [triageRun, setTriageRun] = useState<TriageRun | null>(alert.triageRun || null);
  const [lastTriageAttempt, setLastTriageAttempt] = useState<number>(0);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [activeKbArticle, setActiveKbArticle] = useState<{title: string; content: string;} | null>(null);
  
  useEffect(() => {
    if (streamTriageRun && !isResolved) {
      setTriageRun(streamTriageRun);
    }
  }, [streamTriageRun, isResolved]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isContactModalOpen) {
            setIsContactModalOpen(false);
        } else if (isKbModalOpen) {
            setIsKbModalOpen(false);
        } else {
            onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isContactModalOpen, isKbModalOpen]);

  const handleActionClick = (action: string) => {
    // Log action with PII redaction
    safeConsole.log('Action triggered:', { 
      action,
      alertId: alert.id,
      masked: true,
      timestamp: new Date().toISOString()
    });
    
    if (action === "Freeze Card") {
        if (triageRun?.decision?.otpRequired) {
            setShowOtpInput(true);
        } else {
            // If no OTP required, proceed directly with the action
            const newTrace: TriageStep[] = [
                ...(triageRun?.trace || []),
                {
                    seq: triageRun?.trace?.length || 0,
                    step: 'freezeCard',
                    status: 'success',
                    ok: true,
                    duration_ms: 50,
                    detail: { status: 'FROZEN' }
                }
            ];
            const finalTriageRun = triageRun ? { ...triageRun, trace: newTrace } : null;
            setTriageRun(finalTriageRun);
            setActionStatus('frozen');
            setTimeout(() => {
                onClose(true, finalTriageRun);
            }, 2000);
        }
    } else if (action === "Contact Customer") {
        setIsContactModalOpen(true);
    } else {
        window.alert(`Action: ${action} triggered.`);
        onClose(true, triageRun);
    }
  }

  const handleOtpSubmit = () => {
    if (otp === '123456') {
        setOtpError('');
        safeConsole.log('Metric incremented: action_blocked_total{policy=otp_required}');
        setActionStatus('frozen');

        if (!triageRun) return;

        const newTrace: TriageStep[] = [
            ...triageRun.trace,
            {
                seq: triageRun.trace.length,
                step: 'freezeCard',
                status: 'success',
                ok: true,
                duration_ms: 50,
                detail: { otp_verified: true, status: 'FROZEN' }
            }
        ];

        const finalTriageRun: TriageRun = { ...triageRun, trace: newTrace };
        setTriageRun(finalTriageRun);

        setTimeout(() => {
            onClose(true, finalTriageRun);
        }, 2000);
    } else {
        setOtpError('Invalid OTP');
        setOtp('');
    }
  }

  const handleSendMessage = () => {
    // Log the message being sent with PII redaction
    safeConsole.log('Sending message to customer', {
      alertId: alert.id,
      action: 'customer_contacted',
      timestamp: new Date().toISOString(),
      masked: true
    });
    
    setIsContactModalOpen(false);
    setActionStatus('informed');
    setTimeout(() => {
        onClose(true, triageRun);
    }, 2000);
  }

  const handleViewCitation = async (docId: string) => {
    try {
        const article = await fetchKbArticle(docId);
        // Redact PII in the article content
        const redactedArticle = {
          ...article,
          content: redactPII(article.content).text
        };
        setActiveKbArticle(redactedArticle);
        setIsKbModalOpen(true);
    } catch (error) {
        safeConsole.error("Failed to fetch KB article", error);
        // Fix: Use window.alert to avoid conflict with the 'alert' prop.
        window.alert("Could not load knowledge base article.");
    }
  };

  const isFallbackFailure = triageRun?.decision?.recommendedAction === 'Manual Review Required';

  return (
    <>
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-40"
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex" ref={drawerRef}>
        <div className="w-screen flex flex-col bg-gray-800 text-gray-200 shadow-xl">
            <div className="px-6 py-4 bg-gray-900 flex justify-between items-center border-b border-gray-700">
                <h2 id="slide-over-title" className="text-lg font-semibold">Triage for Alert #{alert.id.split('_')[1]}</h2>
                <button onClick={() => onClose()} className="p-1 rounded-full hover:bg-gray-700">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoading && (
                  <div className="text-center p-4 bg-gray-800 rounded-md">
                    <div className="flex items-center justify-center space-x-2">
                      <Spinner />
                      <span>Initializing Triage...</span>
                    </div>
                  </div>
                )}
                
                {isRateLimited && retryAfter !== null && (
                  <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-md mb-4">
                    <div className="flex items-center space-x-2 text-yellow-300">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="font-medium">Rate Limited</span>
                    </div>
                    <p className="mt-1 text-sm text-yellow-200">
                      Too many requests. Please wait {retryAfter} seconds before retrying.
                    </p>
                    <div className="mt-2 w-full bg-yellow-900/30 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(retryAfter / 30) * 100}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-yellow-300">
                      Attempt {retryCount} of 3
                    </p>
                  </div>
                )}
                {triageRun && (
                <>
                    <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Triage Trace 
                            {!isResolved && isConnected && !actionStatus && <span className="text-green-500 animate-pulse ml-2 text-xs">(Live)</span>}
                            {isResolved && <span className="text-gray-500 ml-2 text-xs">(Completed)</span>}
                        </h3>
                        <ul className="space-y-2">
                        {triageRun.trace.map(step => (
                            <li key={step.seq} className="flex items-start p-3 bg-gray-700/50 rounded-md">
                                <StepStatusIcon status={step.status} />
                                <div className="ml-3 flex-1">
                                    <p className="font-medium text-sm">
                                      {redactPII(step.step).text}
                                      {redactPII(step.step).hasRedacted && (
                                        <span className="ml-2 text-xs text-yellow-400 flex items-center">
                                          <EyeSlashIcon className="h-3 w-3 mr-1" />
                                          PII Redacted
                                        </span>
                                      )}
                                    </p>
                                    {step.detail?.status === 'FROZEN' && <p className="text-xs font-semibold text-blue-400">Status: FROZEN</p>}
                                    {step.status === 'fallback' && step.detail?.error && (
                                      <p className="text-xs text-yellow-400">
                                        Fallback Used: {redactPII(step.detail.error).text}
                                      </p>
                                    )}
                                </div>
                                {step.duration_ms !== null && <span className="text-xs font-mono text-gray-500">{step.duration_ms}ms</span>}
                            </li>
                        ))}
                        </ul>
                    </div>

                    {triageRun.decision && (
                        isFallbackFailure ? (
                            <div className="bg-red-900/50 border border-red-500/30 p-4 rounded-lg space-y-2 text-red-200">
                                <p className="font-semibold flex items-center">
                                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                    Risk analysis tool failed (timeout)
                                </p>
                                <p>🔁 Fallback triggered</p>
                                <p>💡 Recommendation: {triageRun.decision.recommendedAction}</p>
                                <p>🧩 Reason: <span className="font-mono bg-gray-700 px-1 rounded">{triageRun.decision.reasons[0]}</span></p>
                                {sseLog && <p className="text-xs text-gray-400 pt-2 border-t border-red-500/20">📜 SSE Log: {sseLog}</p>}
                            </div>
                        ) : (
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <h3 className="text-md font-semibold text-white mb-3 flex items-center"><CpuChipIcon className="h-5 w-5 mr-2 text-blue-400"/>AI Recommendation</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-800 p-3 rounded">
                                        <div className="text-xs text-gray-400">Risk Score</div>
                                        <div className={`text-2xl font-bold ${getRiskColorClasses(getRiskLevel(triageRun.decision.riskScore)).text}`}>
                                          {triageRun.decision.riskScore}
                                        </div>
                                    </div>
                                    <div className="bg-gray-800 p-3 rounded">
                                        <div className="text-xs text-gray-400">Recommended Action</div>
                                        <div className="text-lg font-semibold text-blue-400">
                                          {redactPII(triageRun.decision.recommendedAction).text}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1 text-gray-300">Top Reasons</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                    {triageRun.decision.reasons.map((r, i) => {
                                      const { text, hasRedacted } = redactPII(r);
                                      return (
                                        <li key={i} className="flex items-start">
                                          <span>{text}</span>
                                          {hasRedacted && (
                                            <span className="ml-1 text-yellow-400 text-xs flex items-center">
                                              <EyeSlashIcon className="h-3 w-3 mr-0.5" />
                                              <span>PII</span>
                                            </span>
                                          )}
                                        </li>
                                      );
                                    })}
                                </ul>
                                    </div>
                                    {triageRun.decision.citations.length > 0 &&
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1 text-gray-300">Citations</h4>
                                        <div className="flex items-center text-sm">
                                            <DocumentTextIcon className="h-4 w-4 mr-1 text-blue-400"/>
                                            {triageRun.decision.citations.map(citation => (
                                                <div key={citation.docId} className="flex items-center">
                                              <button 
                                                  onClick={() => handleViewCitation(citation.docId)} 
                                                  className="text-blue-400 hover:underline text-left"
                                              >
                                                  {citation.title}
                                              </button>
                                              {redactPII(citation.title).hasRedacted && (
                                                <span className="ml-1 text-yellow-400 text-xs flex items-center">
                                                  <EyeSlashIcon className="h-3 w-3 mr-0.5" />
                                                  <span>PII</span>
                                                </span>
                                              )}
                                            </div>
                                            ))}
                                        </div>
                                    </div>
                                    }
                                </div>
                            </div>
                        )
                    )}
                </>
                )}
            </div>
            
            {triageRun?.decision && (
                 <div className="px-6 py-4 border-t border-gray-700 bg-gray-900">
                    {isResolved ? (
                        <div className="text-center font-semibold text-green-400 flex items-center justify-center">
                            <CheckCircleIcon className="h-6 w-6 mr-2"/>
                            Alert has been resolved.
                        </div>
                    ) : actionStatus === 'frozen' || actionStatus === 'informed' ? (
                        <div className="text-center font-semibold text-green-400 flex items-center justify-center">
                            <CheckCircleIcon className="h-6 w-6 mr-2"/>
                             {actionStatus === 'frozen' ? 'Card frozen.' : 'Customer informed.'} Alert resolved. Closing...
                        </div>
                    ) : showOtpInput ? (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <LockClosedIcon className="h-5 w-5 text-gray-400"/>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => {
                                        // Only allow numeric input
                                        const value = e.target.value.replace(/\D/g, '');
                                        // Limit to 6 digits
                                        if (value.length <= 6) {
                                            setOtp(value);
                                            if (otpError) setOtpError('');
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        // Submit on Enter key
                                        if (e.key === 'Enter') {
                                            handleOtpSubmit();
                                        }
                                    }}
                                    placeholder="Enter 6-digit OTP"
                                    className={`flex-1 bg-gray-700 border ${otpError ? 'border-red-500' : 'border-gray-600'} rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500`}
                                    aria-label="Enter 6-digit OTP"
                                    maxLength={6}
                                />
                                <button 
                                    onClick={handleOtpSubmit} 
                                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                                    aria-label="Confirm freeze with OTP"
                                >
                                    Confirm Freeze
                                </button>
                            </div>
                            {otpError && (
                                <p className="text-sm text-red-400 pl-7">{otpError}</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-end space-x-3">
                           {isRateLimited ? (
                             <div className="w-full text-center py-2 text-yellow-400 text-sm">
                               Actions disabled during cooldown
                             </div>
                           ) : isFallbackFailure ? (
                             <p className="text-sm text-yellow-400">Actions disabled due to tool failure. Please review manually.</p>
                           ) : triageRun.decision.recommendedAction === 'Inform Customer & Close' ? (
                                <>
                                    <button onClick={() => handleActionClick("Mark False Positive")} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition">Mark False Positive</button>
                                    <button onClick={() => handleActionClick("Contact Customer")} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition">Contact Customer</button>
                                </>
                           ) : (
                                <>
                                    <button onClick={() => handleActionClick("Mark False Positive")} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition">Mark False Positive</button>
                                    <button onClick={() => handleActionClick("Contact Customer")} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition">Contact Customer</button>
                                    <button onClick={() => handleActionClick("Open Dispute")} className="bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-yellow-700 transition">Open Dispute</button>
                                    <button 
                                        onClick={() => handleActionClick("Freeze Card")} 
                                        className={`bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition ${
                                            triageRun?.decision?.recommendedAction === 'Freeze Card' ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-red-500' : ''
                                        }`}
                                    >
                                        {triageRun?.decision?.otpRequired ? 'Freeze Card (OTP Required)' : 'Freeze Card'}
                                    </button>
                                </>
                           )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
    <ContactCustomerModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        customerName={alert.customerName}
        onSend={handleSendMessage}
        recommendedAction={triageRun?.decision?.recommendedAction}
    />
    <KnowledgeBaseModal 
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        title={activeKbArticle?.title || 'Loading...'}
        content={activeKbArticle?.content || ''}
    />
    </>
  );
};

export default TriageDrawer;