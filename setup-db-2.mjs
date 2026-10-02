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
-- Create Rounds Table
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_code_in_the_dark BOOLEAN DEFAULT FALSE,
    duration_seconds INTEGER NOT NULL DEFAULT 3600,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Map problems to rounds
CREATE TABLE IF NOT EXISTS public.round_problems (
    round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    PRIMARY KEY (round_id, problem_id)
);

-- Update Submissions table to store execution time and memory
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS execution_time FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS memory_used INTEGER DEFAULT 0;

-- Create an initial default round if none exists
INSERT INTO public.rounds (name, is_active, is_code_in_the_dark, duration_seconds)
SELECT 'Round 1 (Normal)', TRUE, FALSE, 3600
WHERE NOT EXISTS (SELECT 1 FROM public.rounds);

-- Add our existing problem to this new round
INSERT INTO public.round_problems (round_id, problem_id)
SELECT r.id, p.id
FROM public.rounds r, public.problems p
WHERE r.name = 'Round 1 (Normal)' AND p.title = 'Treasure Sort'
ON CONFLICT DO NOTHING;
`;

async function setup() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected. Running schema update...');
    await client.query(sql);
    console.log('Schema updated successfully!');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await client.end();
  }
}

setup();
