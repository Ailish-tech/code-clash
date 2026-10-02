import pg from 'pg';

const client = new pg.Client({
  user: 'postgres',
  password: 'Bethelegend@21',
  host: 'db.imsbhffjtuxtlzzdwsoo.supabase.co',
  port: 5432,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- 1. Users Table (The Crew)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    score INTEGER DEFAULT 0,
    disqualified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In Supabase, usually users map to auth.users. 
-- Since we are running this as postgres user, we don't need REFERENCES auth.users 
-- for the public schema if it's just a mockup, but normally we'd keep it.
-- Let's stick to the basic schema without the strict auth.users FK for testing, 
-- or we can assume auth.users exists (it does in Supabase).
-- Wait, the original schema had REFERENCES auth.users, which requires the auth schema.
-- Supabase creates auth.users by default. We'll leave it as is if it fails, we will remove the FK.

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TABLE public.users (
        id UUID PRIMARY KEY REFERENCES auth.users,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        score INTEGER DEFAULT 0,
        disqualified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- 2. Problems Table (The Maps & Treasures)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    constraints TEXT NOT NULL,
    memory_limit INTEGER NOT NULL, -- in KB
    time_limit FLOAT NOT NULL, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Test Cases Table (The Trials)
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Submissions Table (The Plunder)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    source_code TEXT NOT NULL,
    language_id INTEGER NOT NULL, -- e.g., 71 for Python in Judge0
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

async function setup() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected. Running schema setup...');
    await client.query(sql);
    console.log('Schema created successfully!');
    
    // Let's insert a dummy problem so it works right away
    const insertProblem = `
    INSERT INTO public.problems (title, description, constraints, memory_limit, time_limit)
    VALUES ('Treasure Sort', 'Captain Blackbeard has a list of chests with varying amounts of gold. Sort them in descending order so he can plunder the richest first!', '1 <= N <= 10^5', 256000, 2.0)
    ON CONFLICT DO NOTHING;
    `;
    await client.query(insertProblem);
    console.log('Dummy problem inserted!');
    
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
}

setup();
