-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wnyqowvxfaznuqwvijbv/editor

create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  password text,
  google_id text unique,
  role text not null default 'user' check (role in ('user','admin')),
  avatar text,
  is_premium boolean not null default false,
  daily_generations_used integer not null default 0,
  daily_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prompts table
create table if not exists prompts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  text text not null,
  negative_prompt text,
  category text not null default 'travel' check (category in ('travel','music','invite','love')),
  tags text[] default '{}',
  thumbnail_url text,
  images text[] default '{}',
  click_count integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Requests table
create table if not exists requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  image_url text not null,
  prompt_text text not null,
  output_url text,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  webhook_url text,
  ai_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Webhooks table
create table if not exists webhooks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  url text not null,
  secret text,
  is_active boolean not null default true,
  last_triggered timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed sample admin user (password: admin123)
insert into users (name, email, password, role, is_premium)
values ('Admin User', 'admin@promptfactory.io', '$2a$12$LQV37MX7lVWmJiYdQEmZTOZsOOsvdKsbC4n4HOwpBIrngMXXXXXX', 'admin', true)
on conflict (email) do nothing;

-- Seed sample prompts
insert into prompts (title, text, category, tags, click_count, is_active) values
('Golden Hour Travel', 'A breathtaking golden hour landscape with rolling hills, warm amber light casting long shadows, cinematic wide angle shot, ultra realistic, 8K resolution', 'travel', array['landscape','golden hour','cinematic'], 24100, true),
('Jazz Night Vibes', 'A moody jazz club at midnight, soft blue and amber lighting, saxophone player on stage, smoke wisps, film noir aesthetic, high contrast photography', 'music', array['jazz','moody','night'], 19800, true),
('Wedding Invitation', 'Elegant floral wedding invitation design, soft blush and gold tones, watercolor roses, luxury serif typography, premium stationery aesthetic', 'invite', array['wedding','floral','elegant'], 17300, true),
('Romantic Sunset', 'A couple silhouetted against a vibrant sunset over the ocean, warm orange and pink hues, bokeh background, romantic and cinematic mood', 'love', array['romantic','sunset','couple'], 14900, true),
('Mountain Adventure', 'Epic mountain peak at sunrise, dramatic clouds, lone hiker silhouette, adventure photography style, golden light, ultra wide lens', 'travel', array['mountain','adventure','sunrise'], 12100, true),
('Concert Energy', 'Massive outdoor music festival crowd, colorful stage lights, confetti explosion, aerial drone shot, electric atmosphere, vibrant colors', 'music', array['festival','concert','energy'], 9700, true),
('Birthday Celebration', 'Vibrant birthday party invitation with balloons, confetti, modern playful typography, bright and joyful color palette', 'invite', array['birthday','party','colorful'], 8400, true),
('Love Letter', 'Aesthetic flat lay of handwritten love letters, dried flowers, vintage stamps, warm candlelight, romantic and nostalgic mood', 'love', array['vintage','romantic','aesthetic'], 7100, true)
on conflict do nothing;
