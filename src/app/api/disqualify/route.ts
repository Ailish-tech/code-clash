import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    console.log(`[API] User ${userId} has been disqualified for abandoning ship!`);

    // In a real app, update the Supabase 'disqualified' flag to true
    
    return NextResponse.json({ 
      success: true, 
      message: 'User walked the plank.' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
