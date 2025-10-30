const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'sentinel-support.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Promisify db methods
db.runAsync = promisify(db.run).bind(db);
db.getAsync = promisify(db.get).bind(db);
db.allAsync = promisify(db.all).bind(db);

// Initialize database tables
async function initDatabase() {
  try {
    // Disable foreign key checks during initialization
    await db.runAsync('PRAGMA foreign_keys = OFF');
    await db.runAsync('PRAGMA journal_mode = WAL');
    
    // Drop existing tables if they exist to avoid conflicts
    await db.runAsync('DROP TABLE IF EXISTS disputes');
    await db.runAsync('DROP TABLE IF EXISTS cases');
    await db.runAsync('DROP TABLE IF EXISTS cards');
    await db.runAsync('DROP TABLE IF EXISTS transactions');
    await db.runAsync('DROP TABLE IF EXISTS customers');
    
    // Re-enable foreign keys after dropping tables
    await db.runAsync('PRAGMA foreign_keys = ON');
    
    // Recreate tables with consistent column naming (camelCase)
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        customerId TEXT,
        amount REAL,
        currency TEXT,
        merchant TEXT,
        category TEXT,
        status TEXT,
        isFraud BOOLEAN,
        timestamp TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customerId) REFERENCES customers(id)
      )
    `);
    
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        transaction_id TEXT,
        reason TEXT,
        priority TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      )
    `);
    
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        last_four TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);
    
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS disputes (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        transaction_id TEXT,
        amount INTEGER,
        currency TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      )
    `);
    
    console.log('Database tables created successfully');
    
    // Check if we need to import data
    const { count } = await db.getAsync('SELECT COUNT(*) as count FROM transactions');
    if (count === 0) {
      console.log('No transactions found in database, importing from fixtures...');
      const transactions = await loadTransactions();
      
      if (transactions.length > 0) {
        // Start a transaction
        await db.runAsync('BEGIN TRANSACTION');
        
        try {
          // First, extract and insert unique customers
          const customerIds = [...new Set(transactions.map(tx => tx.customerId).filter(Boolean))];
          console.log(`Found ${customerIds.length} unique customer IDs to import`);
          
          const customerStmt = await db.prepare('INSERT OR IGNORE INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)');
          for (const customerId of customerIds) {
            await customerStmt.run(
              customerId, 
              `Customer ${customerId}`, 
              `customer${customerId}@example.com`,
              '+1234567890'
            );
          }
          await customerStmt.finalize();
          console.log('Successfully imported customers');
          
          // Now import transactions
          console.log(`Importing ${transactions.length} transactions...`);
          const stmt = await db.prepare('INSERT OR IGNORE INTO transactions (id, customerId, amount, currency, merchant, category, status, isFraud, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
          
          // Process transactions in batches to avoid memory issues
          const batchSize = 1000;
          for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transactions.length / batchSize)}`);
            
            for (const tx of batch) {
              try {
                await stmt.run(
                  tx.id, 
                  tx.customerId, 
                  tx.amount, 
                  tx.currency, 
                  tx.merchant, 
                  tx.category, 
                  tx.status, 
                  tx.isFraud ? 1 : 0, // Convert boolean to integer for SQLite
                  tx.timestamp
                );
              } catch (err) {
                console.error('Error inserting transaction:', err);
                console.error('Problematic transaction:', JSON.stringify(tx, null, 2));
                throw err; // Re-throw to trigger rollback
              }
            }
          }
          
          await stmt.finalize();
          console.log('Successfully imported transactions');
          
          console.log('All transactions imported successfully');
          
          await db.runAsync('COMMIT');
          console.log('Successfully imported all data');
          
          // Re-enable foreign key checks after successful import
          await db.runAsync('PRAGMA foreign_keys = ON');
          
        } catch (error) {
          await db.runAsync('ROLLBACK');
          // Re-enable foreign key checks even if there was an error
          await db.runAsync('PRAGMA foreign_keys = ON');
          console.error('Error importing data:', error);
          throw error;
        }
      }
    } else {
      console.log(`Found ${count.count} existing transactions in database`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Load transactions from JSON file
async function loadTransactions() {
  const possiblePaths = [
    path.join(__dirname, 'fixtures/transactions.json'),
    path.join(__dirname, '../fixtures/transactions.json'),
    '/usr/src/app/fixtures/transactions.json'
  ];

  for (const filePath of possiblePaths) {
    try {
      console.log(`Attempting to load transactions from: ${filePath}`);
      const data = await fs.readFile(filePath, 'utf8');
      const transactions = JSON.parse(data);
      console.log(`Successfully loaded ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      console.log(`File not found at: ${filePath}`);
    }
  }
  
  console.log('No transaction file found, starting with empty transactions');
  return [];
}

// Load knowledge base documents
async function loadKnowledgeBase() {
  const possiblePaths = [
    path.join(__dirname, 'fixtures/kb_docs.json'),
    path.join(__dirname, '../fixtures/kb_docs.json'),
    '/usr/src/app/fixtures/kb_docs.json'
  ];

  for (const filePath of possiblePaths) {
    try {
      console.log(`Loading knowledge base from: ${filePath}`);
      const data = await fs.readFile(filePath, 'utf8');
      const docs = JSON.parse(data);
      console.log(`Successfully loaded ${docs.length} knowledge base documents`);
      return docs;
    } catch (error) {
      console.log(`Knowledge base file not found at: ${filePath}`);
    }
  }
  
  console.log('No knowledge base file found, starting with empty knowledge base');
  return [];
}

// Customer endpoints
app.get('/api/customer/:id/transactions', async (req, res) => {
    try {
        const customerId = req.params.id;
        const { startDate, endDate } = req.query;
        
        console.log(`Fetching transactions for customer ${customerId}`);
        
        let query = 'SELECT * FROM transactions WHERE customerId = ?';
        const params = [customerId];
        
        if (startDate) {
            query += ' AND timestamp >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND timestamp <= ?';
            params.push(endDate);
        }
        
        const transactions = await db.allAsync(query, params);
        res.json(transactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Case management endpoints
app.get('/api/cases', async (req, res) => {
    try {
        const cases = await db.allAsync('SELECT * FROM cases');
        res.json(cases);
    } catch (err) {
        console.error('Error fetching cases:', err);
        res.status(500).json({ error: 'Failed to fetch cases' });
    }
});

app.post('/api/cases', async (req, res) => {
    try {
        const { customerId, transactionId, reason, priority } = req.body;
        const id = `case_${Date.now()}`;
        const createdAt = new Date().toISOString();
        
        await db.runAsync(
            'INSERT INTO cases (id, customer_id, transaction_id, reason, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, customerId, transactionId, reason, priority, 'open', createdAt]
        );
        
        res.status(201).json({
            id,
            customerId,
            transactionId,
            reason,
            priority,
            status: 'open',
            createdAt
        });
    } catch (err) {
        console.error('Error creating case:', err);
        res.status(500).json({ error: 'Failed to create case' });
    }
});

// Card actions
app.post('/api/action/freeze-card', async (req, res) => {
    try {
        const { cardId, reason } = req.body;
        // In a real app, you would update the card status in the database
        console.log(`Card ${cardId} frozen. Reason: ${reason}`);
        res.json({
            success: true,
            message: 'Card frozen successfully',
            cardId,
            status: 'frozen',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error freezing card:', err);
        res.status(500).json({ error: 'Failed to freeze card' });
    }
});

app.post('/api/action/open-dispute', async (req, res) => {
    try {
        const { transactionId, reason, amount, currency } = req.body;
        // In a real app, you would create a dispute record in the database
        console.log(`Dispute opened for transaction ${transactionId}`);
        res.json({
            success: true,
            message: 'Dispute opened successfully',
            disputeId: `disp_${Date.now()}`,
            transactionId,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error opening dispute:', err);
        res.status(500).json({ error: 'Failed to open dispute' });
    }
});

// Triage system
app.post('/api/triage', async (req, res) => {
    try {
        const { customerId, transactionId, alertType } = req.body;
        const runId = `triage_${Date.now()}`;
        
        // In a real app, you would start an async triage process
        console.log(`Starting triage for customer ${customerId}, transaction ${transactionId}`);
        
        res.status(202).json({
            runId,
            status: 'started',
            message: 'Triage process started',
            streamUrl: `/api/triage/${runId}/stream`
        });
    } catch (err) {
        console.error('Error starting triage:', err);
        res.status(500).json({ error: 'Failed to start triage' });
    }
});

app.get('/api/triage/:runId/stream', (req, res) => {
    const { runId } = req.params;
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    
    // Simulate progress updates
    const steps = [
        { status: 'analyzing', progress: 20, message: 'Analyzing transaction patterns' },
        { status: 'reviewing', progress: 50, message: 'Reviewing customer history' },
        { status: 'evaluating', progress: 80, message: 'Evaluating risk factors' },
        { status: 'completed', progress: 100, message: 'Triage completed', result: { riskScore: 0.75, recommendation: 'Review required' } }
    ];
    
    let step = 0;
    const interval = setInterval(() => {
        if (step < steps.length) {
            res.write(`data: ${JSON.stringify(steps[step])}\n\n`);
            step++;
        } else {
            clearInterval(interval);
            res.end();
        }
    }, 1500);
    
    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

// Knowledge base search endpoint
app.get('/api/kb/search', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
        example: '/api/kb/search?q=password'
      });
    }

    console.log(`\n🔍 Searching knowledge base for: "${query}"`);
    const kbDocs = await loadKnowledgeBase();
    console.log(`   Found ${kbDocs.length} total documents`);
    
    // Enhanced search that handles partial word matches
    const results = kbDocs.filter(doc => {
      const searchIn = [
        doc.title.toLowerCase(),
        doc.content.toLowerCase(),
        doc.category.toLowerCase()
      ].join(' ');
      
      // Split query into terms and check if all terms appear in the document
      const terms = query.split(/\s+/);
      return terms.every(term => searchIn.includes(term));
    });

    console.log(`   Found ${results.length} matching documents`);
    
    const formattedResults = results.map(doc => {
      // Find the position of the first query term for better snippet
      const content = doc.content.toLowerCase();
      const position = Math.max(0, content.indexOf(query));
      const start = Math.max(0, position - 50);
      const end = Math.min(content.length, position + 150);
      const snippet = (start > 0 ? '...' : '') + 
                    doc.content.substring(start, end) + 
                    (end < doc.content.length ? '...' : '');
      
      return {
        id: doc.id,
        title: doc.title,
        snippet: snippet.trim(),
        category: doc.category,
        lastUpdated: doc.lastUpdated
      };
    });

    res.json({
      query,
      count: formattedResults.length,
      results: formattedResults
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({
      error: 'Failed to search knowledge base',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.getAsync('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Initialize and start the server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    
    // Load transactions (if any)
    const transactions = await loadTransactions();
    console.log(`Loaded ${transactions.length} transactions`);
    
    // Start the server
    const PORT = process.env.PORT || 3001;
    // Load knowledge base on startup
    const kbDocs = await loadKnowledgeBase();
    
    app.listen(PORT, () => {
      console.log(`\n✅ Server is running on http://localhost:${PORT}`);
      console.log('\n🔗 Available API endpoints:');
      console.log('   - GET  /health');
      console.log('   - GET  /api/kb/search?q=query');
      console.log(`\n📚 Loaded ${kbDocs.length} knowledge base documents`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
      process.exit(1);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});

// Start the application
startServer();
