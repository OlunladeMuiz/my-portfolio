-- Migration SQL to create `submissions` table and enable RLS
-- Run this in the Supabase SQL Editor (or use a DB client connected with your service_role key)

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  request_id text not null unique,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  ip_address text,
  user_agent text,
  status text not null default 'pending',
  sendgrid_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable row level security so public (anon) role cannot read/insert without policies
alter table public.submissions enable row level security;

-- Index for faster lookup by request_id (unique constraint above also creates an index)
create index if not exists idx_submissions_status on public.submissions (status);

-- service_role bypasses RLS automatically, so server-side inserts can continue to use the service key.
-- If you need to allow authenticated users to insert, create a safe policy.
-- Example: allow authenticated users to insert via JWT auth
-- create policy "authenticated users can insert" on public.submissions
-- for insert using (auth.role() = 'authenticated');
