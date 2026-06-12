/**
 * PromptFactory — Admin Users Migration
 * Creates admin_users table and seeds a super-admin account.
 * Run: node database/migrate_admin_users.js
 */
const path = require('path');
const backendDir = path.join(__dirname, '../backend');
module.paths.push(path.join(backendDir, 'node_modules'));

require('dotenv').config({ path: path.join(backendDir, '.env') });

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.cmrdshqokbyseaprkono:VrkCouI5wZ7ULEL5@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  console.log('\n🔗  Connecting…');
  await client.connect();
  console.log('✓  Connected\n');

  // 1. Create table
  await client.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      name        text        NOT NULL,
      email       text        NOT NULL UNIQUE,
      password    text        NOT NULL,
      role        text        NOT NULL DEFAULT 'manager'
                              CHECK (role IN ('admin', 'manager')),
      is_active   boolean     NOT NULL DEFAULT true,
      created_by  uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
      last_login  timestamptz,
      created_at  timestamptz NOT NULL DEFAULT now(),
      updated_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
  console.log('  ✓  admin_users table created (or already exists)');

  // 2. Seed super-admin  (password: Admin@123)
  const hash = await bcrypt.hash('Admin@123', 12);
  await client.query(`
    INSERT INTO admin_users (name, email, password, role, is_active)
    VALUES ('Super Admin', 'superadmin@promptfactory.io', $1, 'admin', true)
    ON CONFLICT (email) DO NOTHING
  `, [hash]);
  console.log('  ✓  Super-admin seeded  (or already exists)');

  // 3. Seed a sample manager
  const mgrHash = await bcrypt.hash('Manager@123', 12);
  await client.query(`
    INSERT INTO admin_users (name, email, password, role, is_active)
    VALUES ('Content Manager', 'manager@promptfactory.io', $1, 'manager', true)
    ON CONFLICT (email) DO NOTHING
  `, [mgrHash]);
  console.log('  ✓  Sample manager seeded  (or already exists)');

  await client.end();
  console.log('\n✅  Done\n');
  console.log('Default admin portal accounts:');
  console.log('  Super Admin   →  superadmin@promptfactory.io  /  Admin@123');
  console.log('  Manager       →  manager@promptfactory.io     /  Manager@123');
  console.log();
}

run().catch((err) => { console.error('✗ Migration failed:', err.message); process.exit(1); });
