const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');

// Ensure fixtures directory exists
const fixturesDir = path.join(__dirname, '../fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Generate customers data
function generateCustomers(count = 1000) {
  return Array.from({ length: count }, (_, i) => ({
    id: `cust_${uuidv4()}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    createdAt: faker.date.past(2),
    status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
    riskScore: faker.number.float({ min: 0, max: 1, fractionDigits: 2 })
  }));
}

// Generate transactions data
function generateTransactions(count = 200000) {
  return Array.from({ length: count }, (_, i) => {
    const amount = faker.finance.amount(1, 10000, 2);
    const isFraud = Math.random() < 0.01; // 1% chance of being fraudulent
    
    return {
      id: `txn_${uuidv4()}`,
      customerId: `cust_${faker.number.int({ min: 1, max: 1000 })}`,
      cardId: `card_${faker.finance.creditCardNumber().replace(/\D/g, '')}`,
      merchant: faker.company.name(),
      amount: amount,
      currency: 'USD',
      category: faker.helpers.arrayElement([
        'groceries', 'shopping', 'dining', 'utilities', 'entertainment',
        'travel', 'gas', 'online_services', 'healthcare', 'education'
      ]),
      status: faker.helpers.arrayElement(['completed', 'pending', 'declined']),
      isFraud: isFraud,
      location: {
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        city: faker.location.city(),
        country: faker.location.countryCode()
      },
      timestamp: faker.date.between({ from: '2023-01-01', to: '2025-10-30' }).toISOString(),
      deviceId: faker.string.uuid(),
      ipAddress: faker.internet.ip()
    };
  });
}

// Generate cards data
function generateCards(customers) {
  return customers.flatMap(customer => {
    const numCards = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: numCards }, () => ({
      id: `card_${faker.finance.creditCardNumber().replace(/\D/g, '')}`,
      customerId: customer.id,
      type: faker.helpers.arrayElement(['visa', 'mastercard', 'amex', 'discover']),
      last4: faker.finance.creditCardNumber().slice(-4),
      expiryMonth: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0'),
      expiryYear: (new Date().getFullYear() + faker.number.int({ min: 1, max: 5 })).toString(),
      status: faker.helpers.arrayElement(['active', 'inactive', 'blocked', 'expired']),
      issueDate: faker.date.past(3),
      creditLimit: faker.finance.amount(1000, 50000, 2),
      balance: faker.finance.amount(0, 5000, 2)
    }));
  });
}

// Generate alerts data
function generateAlerts(transactions) {
  // Filter potentially fraudulent transactions
  const suspiciousTransactions = transactions
    .filter(tx => tx.isFraud || Math.random() < 0.1) // Include all fraud + 10% random
    .slice(0, 10000); // Limit to 10,000 alerts

  return suspiciousTransactions.map(tx => ({
    id: `alert_${uuidv4()}`,
    transactionId: tx.id,
    customerId: tx.customerId,
    type: tx.isFraud ? 'confirmed_fraud' : faker.helpers.arrayElement([
      'suspicious_activity', 'unusual_location', 'high_value', 'unusual_time'
    ]),
    severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    status: faker.helpers.arrayElement(['open', 'in_review', 'resolved', 'false_positive']),
    description: `Suspicious activity detected: ${tx.merchant} - $${tx.amount}`,
    createdAt: new Date(tx.timestamp).toISOString(),
    resolvedAt: Math.random() > 0.7 ? faker.date.soon({ days: 3, refDate: tx.timestamp }).toISOString() : null
  }));
}

// Generate knowledge base documents
function generateKnowledgeBase() {
  const categories = ['fraud_prevention', 'compliance', 'customer_support', 'technical', 'policies'];
  return Array.from({ length: 50 }, (_, i) => ({
    id: `doc_${uuidv4()}`,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(faker.number.int({ min: 3, max: 10 })),
    category: faker.helpers.arrayElement(categories),
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
      faker.lorem.word()
    ),
    lastUpdated: faker.date.recent(90).toISOString(),
    author: faker.person.fullName(),
    status: faker.helpers.arrayElement(['draft', 'published', 'archived'])
  }));
}

// Generate chargebacks
function generateChargebacks(transactions) {
  const eligibleTransactions = transactions
    .filter(tx => tx.status === 'completed' && !tx.isFraud)
    .slice(0, 1000); // Limit to 1,000 chargebacks

  return eligibleTransactions.map(tx => ({
    id: `chb_${uuidv4()}`,
    transactionId: tx.id,
    customerId: tx.customerId,
    amount: tx.amount,
    currency: tx.currency,
    reason: faker.helpers.arrayElement([
      'unauthorized_transaction',
      'product_not_received',
      'product_unacceptable',
      'duplicate_processing',
      'fraudulent'
    ]),
    status: faker.helpers.arrayElement(['pending', 'won', 'lost', 'accepted', 'denied']),
    filedAt: faker.date.soon({ days: 30, refDate: tx.timestamp }).toISOString(),
    resolvedAt: Math.random() > 0.7 ? 
      faker.date.soon({ days: 60, refDate: tx.timestamp }).toISOString() : null,
    evidence: {
      customerStatement: faker.lorem.paragraph(),
      documentation: Math.random() > 0.5 ? [
        faker.internet.url(),
        faker.internet.url()
      ] : []
    }
  }));
}

// Generate devices
function generateDevices(customers) {
  return customers.flatMap(customer => {
    const numDevices = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: numDevices }, () => ({
      id: `dev_${uuidv4()}`,
      customerId: customer.id,
      type: faker.helpers.arrayElement(['mobile', 'tablet', 'desktop', 'other']),
      os: faker.helpers.arrayElement(['iOS', 'Android', 'Windows', 'macOS', 'Linux']),
      browser: faker.helpers.arrayElement(['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Internet']),
      userAgent: faker.internet.userAgent(),
      lastUsed: faker.date.recent(30).toISOString(),
      ipAddress: faker.internet.ip(),
      isTrusted: faker.datatype.boolean(),
      firstSeen: faker.date.past(2)
    }));
  });
}

// Generate accounts
function generateAccounts(customers) {
  return customers.flatMap(customer => {
    const numAccounts = faker.number.int({ min: 1, max: 2 });
    return Array.from({ length: numAccounts }, () => ({
      id: `acc_${uuidv4()}`,
      customerId: customer.id,
      type: faker.helpers.arrayElement(['checking', 'savings', 'credit_card', 'loan']),
      accountNumber: faker.finance.accountNumber(10),
      routingNumber: faker.finance.routingNumber(),
      balance: faker.finance.amount(0, 50000, 2),
      currency: 'USD',
      status: faker.helpers.arrayElement(['active', 'inactive', 'closed', 'dormant']),
      openedDate: faker.date.past(5),
      interestRate: faker.number.float({ min: 0, max: 0.2, fractionDigits: 3 })
    }));
  });
}

// Generate policies
function generatePolicies() {
  const policyTypes = [
    'fraud_prevention', 'aml', 'kyc', 'data_privacy', 
    'refund', 'shipping', 'returns', 'terms_of_service'
  ];
  
  return policyTypes.map(type => ({
    id: `pol_${type}`,
    type: type,
    title: `${type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Policy`,
    content: faker.lorem.paragraphs(faker.number.int({ min: 3, max: 10 })),
    version: `v${faker.number.int({ min: 1, max: 5 })}.${faker.number.int({ min: 0, max: 9 })}`,
    effectiveDate: faker.date.past(1).toISOString(),
    lastUpdated: faker.date.recent(30).toISOString(),
    appliesTo: faker.helpers.arrayElements(
      ['customers', 'merchants', 'partners', 'employees', 'all'],
      faker.number.int({ min: 1, max: 3 })
    )
  }));
}

// Generate evaluation test cases
function generateEvalCases() {
  return [
    {
      id: 'eval_case_001',
      name: 'High Value Transaction',
      description: 'Transaction with amount significantly higher than customer average',
      input: {
        transaction: {
          amount: 5000,
          currency: 'USD',
          customerId: 'cust_high_spender',
          merchant: 'Luxury Store',
          category: 'shopping',
          location: {
            city: 'New York',
            country: 'US'
          }
        },
        customer: {
          id: 'cust_high_spender',
          averageTransaction: 150,
          riskScore: 0.3
        }
      },
      expected: {
        alert: true,
        riskScore: {
          $gt: 0.7
        },
        reason: 'high_value_transaction'
      }
    },
    {
      id: 'eval_case_002',
      name: 'Unusual Location',
      description: 'Transaction from a location not seen in customer history',
      input: {
        transaction: {
          amount: 200,
          currency: 'USD',
          customerId: 'cust_frequent_traveler',
          merchant: 'Local Market',
          category: 'groceries',
          location: {
            city: 'Tokyo',
            country: 'JP'
          },
          ipAddress: '45.12.34.56'
        },
        customer: {
          id: 'cust_frequent_traveler',
          locations: [
            { city: 'New York', country: 'US', count: 12 },
            { city: 'London', country: 'GB', count: 5 },
            { city: 'Paris', country: 'FR', count: 3 }
          ]
        }
      },
      expected: {
        alert: true,
        riskScore: {
          $gt: 0.6
        },
        reason: 'unusual_location'
      }
    },
    {
      id: 'eval_case_003',
      name: 'Card Not Present - High Risk',
      description: 'High value card-not-present transaction',
      input: {
        transaction: {
          amount: 1200,
          currency: 'USD',
          customerId: 'cust_online_shopper',
          merchant: 'Online Electronics',
          category: 'electronics',
          isCardPresent: false,
          deviceId: 'new_device_123',
          ipAddress: '192.168.1.100'
        },
        customer: {
          id: 'cust_online_shopper',
          devices: ['device_abc', 'device_def'],
          averageOnlinePurchase: 150
        }
      },
      expected: {
        alert: true,
        riskScore: {
          $gt: 0.8
        },
        reason: 'card_not_present_high_risk'
      }
    }
  ];
}

// Main function to generate all fixtures
async function generateFixtures() {
  console.log('Generating test data...');
  
  // Generate customers first
  const customers = generateCustomers(1000);
  console.log(`Generated ${customers.length} customers`);
  
  // Generate transactions (200k by default)
  const transactions = generateTransactions(200000);
  console.log(`Generated ${transactions.length} transactions`);
  
  // Generate related data
  const cards = generateCards(customers);
  const accounts = generateAccounts(customers);
  const alerts = generateAlerts(transactions);
  const kbDocs = generateKnowledgeBase();
  const chargebacks = generateChargebacks(transactions);
  const devices = generateDevices(customers);
  const policies = generatePolicies();
  const evalCases = generateEvalCases();

  // Save all data to files
  fs.writeFileSync(
    path.join(fixturesDir, 'customers.json'),
    JSON.stringify(customers, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'transactions.json'),
    JSON.stringify(transactions, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'cards.json'),
    JSON.stringify(cards, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'accounts.json'),
    JSON.stringify(accounts, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'alerts.json'),
    JSON.stringify(alerts, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'kb_docs.json'),
    JSON.stringify(kbDocs, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'chargebacks.json'),
    JSON.stringify(chargebacks, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'devices.json'),
    JSON.stringify(devices, null, 2)
  );
  
  fs.writeFileSync(
    path.join(fixturesDir, 'policies.json'),
    JSON.stringify(policies, null, 2)
  );
  
  // Create evals directory if it doesn't exist
  const evalsDir = path.join(fixturesDir, 'evals');
  if (!fs.existsSync(evalsDir)) {
    fs.mkdirSync(evalsDir, { recursive: true });
  }
  
  // Save evaluation test cases
  evalCases.forEach(testCase => {
    fs.writeFileSync(
      path.join(evalsDir, `${testCase.id}.json`),
      JSON.stringify(testCase, null, 2)
    );
  });

  console.log('All fixtures generated successfully!');
  console.log('Files saved to:', fixturesDir);
}

// Run the generator
generateFixtures().catch(console.error);
