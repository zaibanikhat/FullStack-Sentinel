export type AlertStatus = 'new' | 'in_progress' | 'resolved';

export type TriageStepStatus = 'pending' | 'running' | 'success' | 'error' | 'fallback';

export interface TriageStep {
  seq: number;
  step: string;
  status: TriageStepStatus;
  ok: boolean | null;
  duration_ms: number | null;
  detail: any | null;
}

export interface TriageDecision {
  riskScore: number;
  recommendedAction: string;
  reasons: string[];
  citations: { docId: string; title: string }[];
  otpRequired?: boolean;
}

export interface TriageRun {
  runId: string;
  alertId: string;
  plan: string[] | null;
  trace: TriageStep[];
  decision: TriageDecision | null;
}

export interface Alert {
  id: string;
  customerId: string;
  customerName: string;
  riskScore: number;
  status: AlertStatus;
  createdAt: string;
  triageRun?: TriageRun | null;
  caseId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email_masked: string;
  kyc_level: 'tier_1' | 'tier_2' | 'tier_3';
  created_at: string;
}

export interface Transaction {
  id: string;
  ts: string;
  merchant: string;
  amount_cents: number;
  currency: 'INR';
  status: 'pending' | 'captured' | 'refunded';
}

export interface CustomerInsights {
  categories: { name: string; pct: number }[];
  topMerchants: { merchant: string; count: number }[];
  monthlyTrend: { month: string; sum: number }[];
  anomalies: { note: string; ts: string; z: number }[];
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface EvalReport {
    summary: {
        successRate: number;
        totalCases: number;
        passCount: number;
        failCount: number;
    };
    confusionMatrix: {
        [key in RiskLevel]: { [key in RiskLevel]: number };
    };
    topFailures: {
        caseId: string;
        description: string;
        predictedRisk: RiskLevel;
        actualRisk: RiskLevel;
    }[];
}

export interface Case {
    id: string;
    customerId: string;
    customerName: string;
    description: string;
    status: 'OPEN' | 'CLOSED';
    createdAt: string;
    matchedTransaction: Transaction | null;
    proposedReason: string | null;
    citation: { docId: string; title: string } | null;
}
