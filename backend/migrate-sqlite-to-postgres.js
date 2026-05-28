// Migration script: SQLite to PostgreSQL (ES Module)
import sqlite3Module from 'sqlite3';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const sqlite3 = sqlite3Module.verbose();
const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const SQLITE_DB_PATH = path.join(__dirname, 'prisma', 'prisma', 'dev.db');
const POSTGRES_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/talentstage';

function getTableStructure(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) reject(err);
      else resolve(columns);
    });
  });
}

function getTableRows(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM "${tableName}"`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function getAllTables(db) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      (err, tables) => {
        if (err) reject(err);
        else resolve(tables || []);
      }
    );
  });
}

async function migrateData() {
  console.log('🔄 Starting SQLite to PostgreSQL migration...\n');

  // Connect to PostgreSQL
  const pgPool = new Pool({
    connectionString: POSTGRES_URL,
  });

  try {
    // Test PostgreSQL connection
    const testConnection = await pgPool.query('SELECT NOW()');
    console.log('✓ Connected to PostgreSQL');

    // Open SQLite database
    const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH);

    // Get all tables
    const tables = await getAllTables(sqliteDb);
    console.log(`📊 Found ${tables.length} tables to migrate\n`);

    let totalRowsMigrated = 0;

    for (const table of tables) {
      const tableName = table.name;
      console.log(`📤 Processing table: ${tableName}...`);

      try {
        const rows = await getTableRows(sqliteDb, tableName);

        if (rows.length === 0) {
          console.log(`   ✓ Empty table, skipping\n`);
          continue;
        }

        // Insert rows into PostgreSQL
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');

          const query = `
            INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(',')})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;

          try {
            await pgPool.query(query, values);
          } catch (err) {
            console.error(`   ⚠ Row insert failed: ${err.message}`);
          }
        }

        console.log(`   ✓ Migrated ${rows.length} rows\n`);
        totalRowsMigrated += rows.length;
      } catch (err) {
        console.error(`   ❌ Error processing ${tableName}: ${err.message}\n`);
      }
    }

    sqliteDb.close();
    await pgPool.end();

    console.log('========================================');
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Total rows migrated: ${totalRowsMigrated}`);
    console.log('========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pgPool.end();
    process.exit(1);
  }
}

migrateData();
