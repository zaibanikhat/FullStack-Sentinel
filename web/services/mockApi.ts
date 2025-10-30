// Fix: Import AlertStatus type
import { Alert, AlertStatus, Customer, Transaction, CustomerInsights, EvalReport, Case } from '../types';
import { faker } from '@faker-js/faker';

// --- Helper Functions to Generate Realistic Data ---
const generateCustomers = (count: number): Customer[] => {
  const customers: Customer[] = [];
  const kycLevels: ('tier_1' | 'tier_2' | 'tier_3')[] = ['tier_1', 'tier_2', 'tier_3'];
  for (let i = 1; i <= count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    customers.push({
      id: `cust_${i}`,
      name: `${firstName} ${lastName}`,
      email_masked: `${firstName.toLowerCase().charAt(0)}***@${faker.internet.domainName()}`,
      kyc_level: kycLevels[Math.floor(Math.random() * kycLevels.length)],
      created_at: faker.date.past({ years: 2 }).toISOString(),
    });
  }
  // Add our specific test customers
  customers[0] = { id: 'cust_1', name: 'Alice Johnson', email_masked: 'ali**@example.com', kyc_level: 'tier_3', created_at: '2023-01-15T09:30:00Z' };
  customers[4] = { id: 'cust_5', name: 'Eve Davis', email_masked: 'eve**@example.com', kyc_level: 'tier_2', created_at: '2023-09-01T10:00:00Z' };
  return customers;
};

const generateTransactionsForCustomer = (customerId: string, customerName: string): Transaction[] => {
    const txCount = faker.number.int({ min: 15, max: 50 });
    const transactions: Transaction[] = [];
    for (let i = 0; i < txCount; i++) {
        transactions.push({
            id: `tx_${customerId}_${i}`,
            ts: faker.date.recent({ days: 365 }).toISOString(),
            merchant: faker.company.name(),
            amount_cents: faker.number.int({ min: 10000, max: 2500000 }),
            currency: 'INR',
            status: 'captured',
        });
    }
    return transactions;
};

const generateInsightsForCustomer = (transactions: Transaction[]): CustomerInsights => {
    const categories: CustomerInsights['categories'] = [];
    const topMerchants: CustomerInsights['topMerchants'] = [];
    
    const trendMonthsArray: { month: string; sum: number }[] = [];
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    for (let i = 2; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        trendMonthsArray.push({ month: monthNamesShort[d.getMonth()], sum: 0 });
    }
    
    if (transactions.length > 0) {
        categories.push({ name: faker.commerce.department(), pct: 60 }, { name: faker.commerce.department(), pct: 40 });
        const merchantCounts: {[key: string]: number} = {};

        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        threeMonthsAgo.setHours(0, 0, 0, 0);

        transactions.forEach(tx => {
            merchantCounts[tx.merchant] = (merchantCounts[tx.merchant] || 0) + 1;

            const txDate = new Date(tx.ts);
            if (txDate >= threeMonthsAgo) {
                const txMonthName = monthNamesShort[txDate.getMonth()];
                const monthEntry = trendMonthsArray.find(m => m.month === txMonthName);
                if (monthEntry) {
                    monthEntry.sum += tx.amount_cents;
                }
            }
        });
        Object.entries(merchantCounts).sort((a,b) => b[1] - a[1]).slice(0, 3).forEach(([merchant, count]) => {
            topMerchants.push({ merchant, count });
        });
    }

    return {
        categories,
        topMerchants,
        monthlyTrend: trendMonthsArray,
        anomalies: Math.random() > 0.7 ? [{ note: 'Unusually large purchase.', ts: transactions[0]?.ts, z: 3.1 }] : []
    };
};


// --- Mock Data Store ---
const customers: Customer[] = generateCustomers(20);
const transactions: { [customerId: string]: Transaction[] } = {};
const insights: { [customerId: string]: CustomerInsights } = {};

customers.forEach(customer => {
    transactions[customer.id] = generateTransactionsForCustomer(customer.id, customer.name);
    insights[customer.id] = generateInsightsForCustomer(transactions[customer.id]);
});


// Add specific transactions for our scenarios
transactions['cust_1'].unshift(
    { id: 'tx_1_2', ts: '2023-08-20T12:30:00Z', merchant: 'Electronics Store', amount_cents: 8990000, currency: 'INR', status: 'captured' }
);
transactions['cust_5'].push(
    { id: 'tx_5_1', ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), merchant: 'QuickCab', amount_cents: 1500, currency: 'INR', status: 'pending' },
    { id: 'tx_5_2', ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5000).toISOString(), merchant: 'QuickCab', amount_cents: 1500, currency: 'INR', status: 'captured' }
);
insights['cust_1'].anomalies = [{ note: 'Unusually large electronics purchase.', ts: '2023-08-20T12:30:00Z', z: 3.5 }];


const generateAlerts = (customers: Customer[], count: number): Alert[] => {
    const statuses: AlertStatus[] = ['new', 'in_progress', 'resolved'];
    const alerts: Alert[] = [];
    for (let i = 0; i < count; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        alerts.push({
            id: `alert_${100 + i}`,
            customerId: customer.id,
            customerName: customer.name,
            riskScore: faker.number.int({ min: 20, max: 98 }),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            createdAt: faker.date.recent({ days: 35 }).toISOString(),
        });
    }
    return alerts;
};

const alerts: Alert[] = generateAlerts(customers, 25);
// Ensure our specific scenario alerts exist and are 'new'
alerts.unshift({ id: 'alert_1', customerId: 'cust_1', customerName: 'Alice Johnson', riskScore: 92, status: 'new', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() });
alerts.unshift({ id: 'alert_5', customerId: 'cust_5', customerName: 'Eve Davis', riskScore: 55, status: 'new', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() });


const cases: Case[] = [
    {
        id: 'case-001',
        customerId: 'cust_5',
        customerName: 'Eve Davis',
        description: 'Charged twice at QuickCab.',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        matchedTransaction: null,
        proposedReason: 'Duplicate Charge Inquiry',
        citation: { docId: 'policy_020', title: 'Pending vs. Captured Transactions' }
    },
];
let nextAlertId = 500;
let nextCaseId = 2;


// Mock API Functions
export const fetchAlerts = (): Promise<Alert[]> => new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(alerts.sort((a,b) => a.status === 'new' ? -1 : 1)))), 500));
export const fetchAllCustomers = (): Promise<Customer[]> => new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(customers))), 500));
export const fetchCustomer = (id: string): Promise<Customer | null> => new Promise(resolve => setTimeout(() => resolve(customers.find(c => c.id === id) || null), 300));

export const fetchTransactions = (
    customerId: string,
    { limit = 10, cursor }: { limit?: number; cursor?: string | null } = {}
): Promise<{ transactions: Transaction[], nextCursor: string | null }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const allCustomerTransactions = (transactions[customerId] || [])
                .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
            
            let startIndex = 0;
            if (cursor) {
                const cursorIndex = allCustomerTransactions.findIndex(tx => tx.id === cursor);
                if (cursorIndex !== -1) {
                    startIndex = cursorIndex + 1;
                }
            }

            const pageTransactions = allCustomerTransactions.slice(startIndex, startIndex + limit);
            const lastTransaction = pageTransactions[pageTransactions.length - 1];
            
            let nextCursor: string | null = null;
            if (lastTransaction && (startIndex + limit) < allCustomerTransactions.length) {
                nextCursor = lastTransaction.id;
            }

            resolve({ transactions: pageTransactions, nextCursor });
        }, 400);
    });
};

export const fetchCustomerInsights = (customerId: string): Promise<CustomerInsights | null> => new Promise(resolve => setTimeout(() => resolve(insights[customerId] || null), 600));
export const fetchAllInsights = (): Promise<{ [customerId: string]: CustomerInsights }> => new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(insights))), 600));
export const fetchAllCases = (): Promise<Case[]> => new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(cases))), 500));
export const fetchCase = (id: string): Promise<Case | null> => new Promise(resolve => setTimeout(() => resolve(cases.find(c => c.id === id) || null), 300));

export const createCaseAndAlertFromDescription = (description: string): Promise<Alert | null> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const lowerDesc = description.toLowerCase();
      const customer = customers.find(c => lowerDesc.includes(c.name.toLowerCase()));

      if (customer) {
        let newCase: Case;
        let newAlert: Alert;

        // Specific scenario for "charged twice"
        if (lowerDesc.includes('charged twice')) {
          newCase = {
              id: `case-00${nextCaseId++}`,
              customerId: customer.id,
              customerName: customer.name,
              description: description,
              status: 'OPEN',
              createdAt: new Date().toISOString(),
              matchedTransaction: null,
              proposedReason: 'Duplicate Charge Inquiry',
              citation: { docId: 'policy_020', title: 'Pending vs. Captured Transactions' },
          };
          newAlert = {
            id: `alert_${nextAlertId++}`,
            customerId: customer.id,
            customerName: customer.name,
            riskScore: 55, // Medium risk for duplicate charge scenario
            status: 'new',
            createdAt: new Date().toISOString(),
          };
        } else {
            // Generic case creation: Try to match a transaction from the description
            const customerTransactions = transactions[customer.id] || [];
            const matchedTransaction = customerTransactions.find(tx => lowerDesc.includes(tx.merchant.toLowerCase()));

            if (matchedTransaction) {
                // Found a transaction, create a high-risk dispute case
                newCase = {
                    id: `case-00${nextCaseId++}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    description: description,
                    status: 'OPEN',
                    createdAt: new Date().toISOString(),
                    matchedTransaction: matchedTransaction,
                    proposedReason: '10.4 - Unrecognized Transaction',
                    citation: { docId: 'policy_015', title: 'High-Risk Transaction Policy' },
                };
                newAlert = {
                    id: `alert_${nextAlertId++}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    riskScore: 90, // High risk for unrecognized transaction
                    status: 'new',
                    createdAt: new Date().toISOString(),
                };
            } else {
                // No transaction matched, create a general inquiry case
                newCase = {
                    id: `case-00${nextCaseId++}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    description: description,
                    status: 'OPEN',
                    createdAt: new Date().toISOString(),
                    matchedTransaction: null,
                    proposedReason: 'General Inquiry - Transaction Not Found',
                    citation: null,
                };
                 newAlert = {
                    id: `alert_${nextAlertId++}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    riskScore: 40, // Low risk for general inquiry
                    status: 'new',
                    createdAt: new Date().toISOString(),
                };
            }
        }
        
        cases.unshift(newCase);
        alerts.unshift(newAlert);
        resolve(newAlert);
        return;

      }

      resolve(null); // No customer found
    }, 500);
  });
};

// Track rate limit state
let rateLimitedUntil = 0;
let rateLimitCount = 0;

// Simulate rate limiting - fail every 3rd request with a 429
export const startTriage = (alertId: string): Promise<{ runId: string }> => {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    
    // Check if we're currently rate limited
    if (now < rateLimitedUntil) {
      const retryAfter = Math.ceil((rateLimitedUntil - now) / 1000);
      const error = new Error('Rate limit exceeded') as any;
      error.status = 429;
      error.retryAfter = retryAfter;
      reject(error);
      return;
    }

    // Simulate rate limiting - fail every 2nd request for testing
    rateLimitCount++;
    if (rateLimitCount % 2 === 0) {
      // Set rate limit for 2 seconds for testing
      rateLimitedUntil = now + 2000;
      const error = new Error('Rate limit exceeded') as any;
      error.status = 429;
      error.retryAfter = 2; // 2 seconds for testing
      reject(error);
      return;
    }

    setTimeout(() => {
      resolve({ runId: `run-${alertId}-${Date.now()}` });
    }, 200);
  });
};

export const getTriageStream = (
  runId: string,
  onEvent: (event: any) => void,
  onEnd: () => void
): (() => void) => {
  const highRiskSteps = [
    { type: 'plan_built', data: { plan: ['Fetch Customer Data', 'Analyze Transactions', 'Check KYC Level', 'Query Fraud Rules', 'Synthesize Decision'] } },
    { type: 'tool_update', data: { seq: 0, status: 'running' } },
    { type: 'tool_update', data: { seq: 0, status: 'success', ok: true, duration_ms: 150, detail: { customerId: 'cust_1' } } },
    { type: 'tool_update', data: { seq: 1, status: 'running' } },
    { type: 'tool_update', data: { seq: 1, status: 'success', ok: true, duration_ms: 300, detail: { transaction_count: 5 } } },
    { type: 'tool_update', data: { seq: 2, status: 'running' } },
    { type: 'tool_update', data: { seq: 2, status: 'success', ok: true, duration_ms: 80, detail: { kyc_level: 'tier_3' } } },
    { type: 'tool_update', data: { seq: 3, status: 'running' } },
    { type: 'sse_log', data: { message: 'Rules engine service timed out after 500ms' } },
    { type: 'tool_update', data: { seq: 3, status: 'fallback', ok: false, duration_ms: 500, detail: { error: 'Timeout' } } },
    { type: 'tool_update', data: { seq: 4, status: 'running' } },
    { type: 'tool_update', data: { seq: 4, status: 'success', ok: true, duration_ms: 400, detail: null } },
    { type: 'decision_finalized', data: {
        decision: {
          riskScore: 75, // Fallback score
          recommendedAction: 'Manual Review Required',
          otpRequired: false,
          reasons: [
            'Primary risk analysis tool (FraudRulesEngine) failed.',
          ],
          citations: [],
        }
      }
    },
  ];

  const duplicateChargeSteps = [
    { type: 'plan_built', data: { plan: ['Fetch Customer Data', 'Analyze Transactions for Duplicates', 'Check Merchant Policies', 'Synthesize Decision'] } },
    { type: 'tool_update', data: { seq: 0, status: 'running' } },
    { type: 'tool_update', data: { seq: 0, status: 'success', ok: true, duration_ms: 120, detail: { customerId: 'cust_5' } } },
    { type: 'tool_update', data: { seq: 1, status: 'running' } },
    { type: 'tool_update', data: { seq: 1, status: 'success', ok: true, duration_ms: 250, detail: { match: 'Found pending and captured pair' } } },
    { type: 'tool_update', data: { seq: 2, status: 'running' } },
    { type: 'tool_update', data: { seq: 2, status: 'success', ok: true, duration_ms: 90, detail: { policy: 'Standard pre-auth merchant' } } },
    { type: 'tool_update', data: { seq: 3, status: 'running' } },
    { type: 'tool_update', data: { seq: 3, status: 'success', ok: true, duration_ms: 200, detail: null } },
    { type: 'decision_finalized', data: {
        decision: {
          riskScore: 55,
          recommendedAction: 'Inform Customer & Close',
          otpRequired: false,
          reasons: [
            'Duplicate charge detected: one is a temporary authorization (pending), the other is the final charge (captured).',
            'This is a normal part of card processing and not a real duplicate charge.',
          ],
          citations: [{ docId: 'policy_020', title: 'Pending vs. Captured Transactions' }],
        }
      }
    },
  ];
  
  const alertId = runId.split('-')[1];
  const alert = alerts.find(a => a.id === alertId);
  
  // Define steps for freeze card with OTP required
  const freezeCardSteps = [
    { type: 'plan_built', data: { plan: ['Fetch Customer Data', 'Check Account Status', 'Verify Card Status', 'Synthesize Decision'] } },
    { type: 'tool_update', data: { seq: 0, status: 'running' } },
    { type: 'tool_update', data: { seq: 0, status: 'success', ok: true, duration_ms: 120, detail: { customerId: alert?.customerId || 'cust_1' } } },
    { type: 'tool_update', data: { seq: 1, status: 'running' } },
    { type: 'tool_update', data: { seq: 1, status: 'success', ok: true, duration_ms: 180, detail: { accountStatus: 'active' } } },
    { type: 'tool_update', data: { seq: 2, status: 'running' } },
    { type: 'tool_update', data: { seq: 2, status: 'success', ok: true, duration_ms: 150, detail: { cardStatus: 'active' } } },
    { type: 'tool_update', data: { seq: 3, status: 'running' } },
    { type: 'tool_update', data: { seq: 3, status: 'success', ok: true, duration_ms: 200, detail: null } },
    { type: 'decision_finalized', data: {
        decision: {
          riskScore: 85,
          recommendedAction: 'Freeze Card',
          otpRequired: true,
          reasons: [
            'Suspicious activity detected on card',
            'High risk transaction pattern identified',
            'Customer verification required before taking action'
          ],
          citations: [
            { docId: 'policy_101', title: 'Card Security Protocol' },
            { docId: 'procedure_42', title: 'OTP Verification Process' }
          ],
        }
      }
    },
  ];
  
  // Determine which steps to use based on alert ID or other criteria
  let steps;
  if (alertId === 'alert_1') {
    steps = freezeCardSteps; // Use freeze card flow for alert_1
  } else if (alert?.customerId === 'cust_5' || alert?.riskScore === 55) {
    steps = duplicateChargeSteps;
  } else {
    steps = highRiskSteps;
  }

  let stepIndex = 0;
  const interval = setInterval(() => {
    if (stepIndex < steps.length) {
      onEvent(steps[stepIndex]);
      stepIndex++;
    } else {
      clearInterval(interval);
      onEnd();
    }
  }, 700);

  return () => clearInterval(interval);
};


export const fetchKbArticle = (docId: string): Promise<{title: string, content: string}> => {
  const articles: {[key: string]: {title: string, content: string}} = {
    'policy_101': {
      title: 'Card Security Protocol',
      content: `### Card Security Protocol

This document outlines the security measures and protocols for handling card-related security incidents.

#### Key Security Measures
- **Immediate Card Freeze**: When suspicious activity is detected, the card should be frozen immediately to prevent further unauthorized transactions.
- **OTP Verification**: For high-risk actions, always require OTP verification to confirm the cardholder's identity.
- **Transaction Monitoring**: Continuously monitor transactions for unusual patterns or high-risk activities.

#### Procedure
1. **Verification**: Always verify the cardholder's identity before taking any action.
2. **Documentation**: Document all actions taken during the security incident.
3. **Notification**: Inform the cardholder of any security actions taken on their account.
`
    },
    'procedure_42': {
      title: 'OTP Verification Process',
      content: `### OTP Verification Process

This document details the process for One-Time Password (OTP) verification in high-security scenarios.

#### When to Use OTP
- Card freezing requests
- High-value transactions
- Changes to account security settings
- Suspicious activity alerts

#### OTP Requirements
- Must be 6 digits in length
- Valid for 5 minutes
- Can only be used once

#### Troubleshooting
- If OTP is not received, check if the customer's mobile number is up to date.
- If OTP is entered incorrectly multiple times, the request will be blocked for security reasons.
`
    },
    'policy_015': {
      title: 'High-Risk Transaction Policy',
      content: `### High-Risk Alert Triage Guide

This document outlines the standard operating procedure for handling transactions flagged as high-risk by the automated monitoring system.

#### Initial Checks
- **Verify Customer KYC Level**: Ensure the customer's KYC (Know Your Customer) level is appropriate for the transaction size. Customers at **Tier 1** have lower limits.
- **Analyze Recent History**: Look for a pattern of similar transactions. A single large, anomalous transaction is more suspicious than one that fits a pattern.
- **Check Merchant Category**: Transactions in categories like \`electronics\`, \`jewelry\`, or \`online_gaming\` are considered higher risk.

---

#### Agent Actions
If the automated system recommends an action like \`Freeze Card\`, it often requires OTP verification for security.

- **Contacting the Customer**: Use approved templates for communication. Do not divulge sensitive information until the customer's identity is verified.
- **Freezing a Card**: This is an immediate action to prevent further potential fraud. Inform the customer that their card has been temporarily frozen for their protection.
- **Marking as False Positive**: Only do this if you have high confidence the transaction is legitimate. Add a note explaining your reasoning.
`
    },
    'policy_020': {
        title: 'Pending vs. Captured Transactions',
        content: `### Understanding Pending vs. Captured Transactions

This guide explains the difference between a "pending" transaction (also known as a pre-authorization) and a "captured" one. This is a common point of confusion for customers.

#### What is a Pending Transaction?
- A **pending charge** is a temporary hold on a customer's funds by a merchant.
- This happens frequently with services like hotels, car rentals, and ride-sharing apps (e.g., QuickCab).
- The merchant does this to ensure the customer has enough funds available for the final charge.
- The pending charge may be for an estimated amount and will temporarily reduce the customer's available balance.

#### What is a Captured Transaction?
- A **captured charge** is the final, completed transaction.
- This is the point where the funds are actually transferred from the customer's account to the merchant.
- The captured amount is the final, correct amount for the goods or services.

---

#### Common Scenario: "I see two charges!"
A customer may see both the pending authorization and the final captured charge on their statement for a short period.

- **Explain to the customer**: This is normal. The pending charge is a temporary hold and will disappear from their statement automatically, usually within a few business days. They have **not** been charged twice.
- **Agent Action**: Do **not** open a dispute for this. This is a standard payment processing workflow. Inform the customer and close the alert/case.
`
    }
  };
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if(articles[docId]) {
        resolve(articles[docId]);
      } else {
        reject(new Error('Article not found'));
      }
    }, 200);
  });
};

export const runEvals = (): Promise<EvalReport> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const report: EvalReport = {
                summary: {
                    successRate: 95.5,
                    totalCases: 200,
                    passCount: 191,
                    failCount: 9,
                },
                confusionMatrix: {
                    low: { low: 98, medium: 2, high: 0 },
                    medium: { low: 3, medium: 75, high: 2 },
                    high: { low: 0, medium: 2, high: 18 },
                },
                topFailures: [
                    { caseId: 'case-eval-01', description: 'Complex multi-merchant fraud pattern', predictedRisk: 'medium', actualRisk: 'high' },
                    { caseId: 'case-eval-02', description: 'New account bust-out scheme', predictedRisk: 'low', actualRisk: 'high' },
                    { caseId: 'case-eval-03', description: 'Benign high-value purchase misflagged', predictedRisk: 'high', actualRisk: 'low' },
                ]
            };
            resolve(report);
        }, 1500);
    });
};