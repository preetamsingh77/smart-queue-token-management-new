-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('ADMIN', 'OFFICER', 'STAFF')) DEFAULT 'OFFICER',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICES
CREATE TABLE services (
  id TEXT PRIMARY KEY, -- e.g., 'DL_RENEWAL'
  name TEXT NOT NULL,
  prefix TEXT NOT NULL, -- e.g., 'A' for A101
  description TEXT,
  avg_time_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COUNTERS
CREATE TABLE counters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL, -- 'Counter 1'
  assigned_services TEXT[] DEFAULT '{}', -- Array of service IDs
  current_officer_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('ONLINE', 'OFFLINE', 'BREAK')) DEFAULT 'OFFLINE',
  is_active BOOLEAN DEFAULT TRUE
);

-- TOKENS (The Queue)
CREATE TABLE tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token_number TEXT NOT NULL, -- 'A-101'
  service_id TEXT REFERENCES services(id),
  citizen_name TEXT,
  phone TEXT,
  status TEXT CHECK (status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED')) DEFAULT 'WAITING',
  priority_level TEXT CHECK (priority_level IN ('NORMAL', 'SENIOR', 'EMERGENCY')) DEFAULT 'NORMAL',
  priority_status TEXT CHECK (priority_status IN ('NONE', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED')) DEFAULT 'NONE',
  medical_proof TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Assignment
  counter_id INTEGER REFERENCES counters(id),
  officer_id UUID REFERENCES profiles(id)
);

-- METRICS / LOGS (Optional for analytics)
-- We can derive most metrics from proper timestamps in 'tokens' table.

-- RLS POLICIES (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (for Display Board)
CREATE POLICY "Public Display Read Tokens" ON tokens FOR SELECT USING (true);
CREATE POLICY "Public Read Counters" ON counters FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);

-- 2. Officer/Admin Write Access
-- (Requires authentication setup to work fully)
CREATE POLICY "Officer Update Tokens" ON tokens FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('OFFICER', 'ADMIN')));

CREATE POLICY "Admin Manage Services" ON services FOR ALL
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'ADMIN'));
