import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS and fetch hidden test cases securely
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_KEY!
);

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358';

export async function POST(req: Request) {
  try {
    const { userId, problemId, sourceCode, languageId } = await req.json();

    console.log(`[API] Received submission from ${userId} for problem ${problemId}`);

    // 1. Fetch hidden test cases securely on the backend
    const { data: testCases, error: tcError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('problem_id', problemId);

    if (tcError) {
      console.error('[API] Error fetching test cases:', tcError);
    } else {
      console.log(`[API] Found ${testCases?.length || 0} test cases.`);
    }

    // 4. Create the pending submission in Supabase 
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .insert({
        user_id: userId,
        problem_id: problemId,
        source_code: sourceCode,
        language_id: languageId,
        status: 'pending',
        score: 0,
      })
      .select()
      .single();

    // Simulate background processing delay and Judge0 metrics
    setTimeout(async () => {
        // Mock metrics: execution time between 0.1s and 1.5s, memory between 10MB and 50MB
        const mockTime = (Math.random() * 1.4 + 0.1).toFixed(3);
        const mockMemory = Math.floor(Math.random() * 40000) + 10000;
        const mockScore = 100; // Mocking a perfect score for demo

        await supabase
          .from('submissions')
          .update({ 
            status: 'accepted',
            score: mockScore,
            execution_time: mockTime,
            memory_used: mockMemory
          })
          .eq('id', submission?.id);

        console.log(`[API] Background processing finished for ${userId}. Score hidden.`);
    }, 5000);

    // 6. Return generic success to the frontend (Blind Results Rule)
    return NextResponse.json({ 
      success: true, 
      message: 'Submission received by the Captain. Results hidden until the end!' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
