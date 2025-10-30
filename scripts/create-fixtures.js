const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure fixtures directory exists
const fixturesDir = path.join(__dirname, '../fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Simple data generators
function generateId(prefix) {
  return `${prefix}_${uuidv4().replace(/-/g, '')}`;
}

function randomDate(start, end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 1. customers.json
const customers = Array.from({ length: 1000 }, (_, i) => ({
  id: `cust_${i + 1}`,
  name: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  joinDate: randomDate(new Date(2020, 0, 1)).toISOString(),
  status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)]
}));

// 2. cards.json
const cards = customers.flatMap(customer => {
  const numCards = Math.floor(Math.random() * 3) + 1; // 1-3 cards per customer
  return Array.from({ length: numCards }, () => ({
    id: `card_${Math.random().toString(36).substr(2, 9)}`,
    customerId: customer.id,
    last4: Math.floor(1000 + Math.random() * 9000).toString(),
    type: ['visa', 'mastercard', 'amex', 'discover'][Math.floor(Math.random() * 4)],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0]
  }));
});

// 3. accounts.json
const accounts = customers.map(customer => ({
  id: `acc_${customer.id.split('_')[1]}`,
  customerId: customer.id,
  type: ['checking', 'savings', 'credit'][Math.floor(Math.random() * 3)],
  balance: (Math.random() * 10000).toFixed(2),
  currency: 'USD',
  status: 'active'
}));

// 4. transactions.json (200k+ rows)
const transactions = [];
for (let i = 0; i < 200000; i++) {
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const amount = (Math.random() * 1000).toFixed(2);
  const date = randomDate(new Date(2023, 0, 1));
  
  transactions.push({
    id: `txn_${i + 1}`,
    customerId: customer.id,
    cardId: cards.find(c => c.customerId === customer.id)?.id || null,
    accountId: accounts.find(a => a.customerId === customer.id)?.id || null,
    amount: amount,
    currency: 'USD',
    merchant: `Merchant ${Math.floor(Math.random() * 100)}`,
    category: ['groceries', 'shopping', 'bills', 'entertainment', 'other'][Math.floor(Math.random() * 5)],
    status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
    timestamp: date.toISOString(),
    isFraud: Math.random() < 0.01 // 1% chance of being fraud
  });
}

// 5. alerts.json
const alerts = transactions
  .filter(tx => tx.isFraud || Math.random() < 0.05) // 5% of transactions get alerts
  .map((tx, i) => ({
    id: `alert_${i + 1}`,
    transactionId: tx.id,
    customerId: tx.customerId,
    type: tx.isFraud ? 'fraud' : ['suspicious', 'unusual_activity', 'high_risk'][Math.floor(Math.random() * 3)],
    status: ['open', 'investigating', 'resolved'][Math.floor(Math.random() * 3)],
    createdAt: new Date(tx.timestamp).toISOString(),
    resolvedAt: Math.random() > 0.7 ? 
      new Date(new Date(tx.timestamp).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : 
      null
  }));

// 6. kb_docs.json
const kb_docs = Array.from({ length: 50 }, (_, i) => ({
  id: `doc_${i + 1}`,
  title: `Document ${i + 1}: ${['How to', 'Guide to', 'Understanding', 'Best practices for'][Math.floor(Math.random() * 4)]} ${['fraud', 'security', 'payments', 'accounts', 'cards'][Math.floor(Math.random() * 5)]}`,
  content: `This is a sample knowledge base document #${i + 1}. ` + 
           'It contains helpful information about the system and how to resolve common issues. ' +
           'Please refer to the official documentation for more details.',
  category: ['general', 'fraud', 'billing', 'technical', 'policies'][Math.floor(Math.random() * 5)],
  lastUpdated: randomDate(new Date(2023, 0, 1)).toISOString()
}));

// 7. policies.json
const policies = [
  {
    id: 'pol_001',
    name: 'Fraud Prevention Policy',
    description: 'Guidelines and procedures for preventing fraud',
    lastUpdated: '2023-01-15T00:00:00Z',
    content: 'This policy outlines the measures taken to prevent fraudulent activities...'
  },
  {
    id: 'pol_002',
    name: 'Refund Policy',
    description: 'Terms and conditions for processing refunds',
    lastUpdated: '2023-02-20T00:00:00Z',
    content: 'This policy describes the refund process and eligibility criteria...'
  },
  {
    id: 'pol_003',
    name: 'Data Protection Policy',
    description: 'How customer data is protected and managed',
    lastUpdated: '2023-03-10T00:00:00Z',
    content: 'This policy explains our data protection measures and compliance...'
  }
];

// 8. chargebacks.json
const chargebacks = alerts
  .filter(() => Math.random() < 0.3) // 30% of alerts result in chargebacks
  .map((alert, i) => ({
    id: `chb_${i + 1}`,
    alertId: alert.id,
    transactionId: alert.transactionId,
    customerId: alert.customerId,
    amount: (Math.random() * 500).toFixed(2),
    currency: 'USD',
    reason: ['fraud', 'unauthorized', 'product_not_received', 'duplicate'][Math.floor(Math.random() * 4)],
    status: ['pending', 'won', 'lost', 'disputed'][Math.floor(Math.random() * 4)],
    createdAt: alert.createdAt,
    resolvedAt: alert.resolvedAt
  }));

// 9. devices.json
const devices = customers.flatMap(customer => {
  const numDevices = Math.floor(Math.random() * 3) + 1; // 1-3 devices per customer
  return Array.from({ length: numDevices }, (_, i) => ({
    id: `dev_${customer.id.split('_')[1]}_${i + 1}`,
    customerId: customer.id,
    type: ['mobile', 'tablet', 'desktop', 'other'][Math.floor(Math.random() * 4)],
    os: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'][Math.floor(Math.random() * 5)],
    lastSeen: randomDate(new Date(2023, 0, 1)).toISOString()
  }));
});

// 10. evals/*.json
const evalCases = [
  {
    id: 'eval_001',
    name: 'High Value Transaction',
    description: 'Transaction with amount > $10,000',
    expected: {
      alert: true,
      riskScore: { $gt: 0.8 },
      reason: 'high_value'
    }
  },
  {
    id: 'eval_002',
    name: 'Multiple Transactions in Short Time',
    description: 'More than 5 transactions in 10 minutes',
    expected: {
      alert: true,
      riskScore: { $gt: 0.7 },
      reason: 'velocity'
    }
  },
  {
    id: 'eval_003',
    name: 'International Transaction',
    description: 'Transaction from a new country',
    expected: {
      alert: true,
      riskScore: { $gt: 0.6 },
      reason: 'new_country'
    }
  }
];

// Save all files
function saveToFile(filename, data) {
  const filePath = path.join(fixturesDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Generated ${data.length} items in ${filename}`);
}

// Save all the data
saveToFile('customers.json', customers);
saveToFile('cards.json', cards);
saveToFile('accounts.json', accounts);
saveToFile('transactions.json', transactions);
saveToFile('alerts.json', alerts);
saveToFile('kb_docs.json', kb_docs);
saveToFile('policies.json', policies);
saveToFile('chargebacks.json', chargebacks);
saveToFile('devices.json', devices);

// Save eval cases
evalCases.forEach(evalCase => {
  const evalPath = path.join(fixturesDir, 'evals', `${evalCase.id}.json`);
  fs.writeFileSync(evalPath, JSON.stringify(evalCase, null, 2));
});
console.log(`Generated ${evalCases.length} evaluation cases in evals/`);

console.log('\nAll fixture files have been generated successfully!');
console.log(`Location: ${fixturesDir}`);
