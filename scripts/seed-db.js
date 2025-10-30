const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database configuration - update these values if needed
const pool = new Pool({
  user: 'user',
  host: 'localhost',
  database: 'sentineldb',
  password: 'password',
  port: 5432,
});

// Sample categories and merchants
const categories = ['groceries', 'entertainment', 'utilities', 'shopping', 'dining'];
const merchants = [
  'Walmart', 'Amazon', 'Netflix', 'Starbucks', 'Uber',
  'Spotify', 'Apple', 'Google', 'Target', 'Best Buy'
];

// Generate a random date within the last 30 days
function randomDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
}

// Generate test transactions
async function generateTestTransactions(customerId, count = 50) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Generate and insert transactions
    for (let i = 0; i < count; i++) {
      const amount = Math.floor(Math.random() * 10000) + 100; // $1.00 to $100.00
      const category = categories[Math.floor(Math.random() * categories.length)];
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const timestamp = randomDate();
      
      await client.query(
        `INSERT INTO transactions (id, customer_id, merchant, amount_cents, currency, ts, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          uuidv4(),
          customerId,
          merchant,
          amount,
          'USD',
          timestamp,
          category
        ]
      );
    }
    
    await client.query('COMMIT');
    console.log(`Successfully inserted ${count} test transactions for customer ${customerId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error generating test transactions:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Get customer ID from command line or use default
const customerId = process.argv[2] || '123';

// Run the script
generateTestTransactions(customerId, 50)
  .then(() => {
    console.log('Database seeded successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
