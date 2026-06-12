/**
 * PromptFactory — Database Migration
 * Connects to Supabase PostgreSQL and creates all required tables.
 * Run with: node database/migrate.js  (from project root)
 *       or: cd backend && node ../database/migrate.js
 */

// Resolve modules from the backend folder where node_modules lives
const path = require('path');
const backendDir = path.join(__dirname, '../backend');
module.paths.push(path.join(backendDir, 'node_modules'));

require('dotenv').config({ path: path.join(backendDir, '.env') });

const { Client } = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.cmrdshqokbyseaprkono:VrkCouI5wZ7ULEL5@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const SQL = `
-- ─────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text NOT NULL,
  email                  text NOT NULL UNIQUE,
  password               text,
  google_id              text UNIQUE,
  role                   text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  avatar                 text,
  is_premium             boolean NOT NULL DEFAULT false,
  daily_generations_used integer NOT NULL DEFAULT 0,
  daily_reset_at         timestamptz NOT NULL DEFAULT now(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 2. REQUESTS  (AI generation log)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  prompt_text text NOT NULL,
  output_url  text,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','completed','failed')),
  webhook_url text,
  ai_response jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 3. LLM KEYS  (admin key vault)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS llm_keys (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider   text NOT NULL UNIQUE,
  api_key    text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 4. WEBHOOKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url             text NOT NULL,
  secret          text,
  is_active       boolean NOT NULL DEFAULT true,
  last_triggered  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 5. SEED — default admin account
--    password hash = "admin123" (bcrypt, cost 12)
-- ─────────────────────────────────────────
INSERT INTO users (name, email, password, role, is_premium)
VALUES (
  'Admin User',
  'admin@promptfactory.io',
  '$2a$12$LQV37MX7lVWmJiYdQEmZTOZsOOsvdKsbC4n4HOwpBIrngMXXXXXX',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;
`;

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('\n🔗  Connecting to Supabase PostgreSQL…');
  await client.connect();
  console.log('✓  Connected\n');

  const statements = SQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let ok = 0;
  let skip = 0;

  for (const stmt of statements) {
    // Derive a short label from the first meaningful line
    const label = stmt.split('\n').find((l) => l.trim() && !l.trim().startsWith('--'))?.trim().slice(0, 60) || '…';
    try {
      await client.query(stmt);
      console.log(`  ✓  ${label}`);
      ok++;
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`  –  ${label}  [already exists, skipped]`);
        skip++;
      } else {
        console.error(`  ✗  ${label}`);
        console.error(`     ${err.message}`);
      }
    }
  }

  await client.end();

  console.log(`\n✅  Migration complete — ${ok} executed, ${skip} skipped\n`);
  console.log('Tables created:');
  console.log('  • users');
  console.log('  • requests');
  console.log('  • llm_keys');
  console.log('  • webhooks');
  console.log('\nDefault admin account seeded:');
  console.log('  email:    admin@promptfactory.io');
  console.log('  password: admin123');
  console.log('\n');
}

migrate().catch((err) => {
  console.error('\n✗  Migration failed:', err.message);
  process.exit(1);
});
