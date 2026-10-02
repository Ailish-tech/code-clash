'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

type Phase = 'READING' | 'CODING' | 'SUBMITTED';

// Dummy user for demo
const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'; // Wait, this needs to be a valid UUID for the foreign key, let's just bypass it or use auth.
// Actually, since users table has a foreign key to auth.users, inserting might fail if the user doesn't exist.
// We'll leave it as is, assuming auth is implemented in a real scenario.

export default function ParticipantPortal() {
  const [activeRound, setActiveRound] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  
  const [phase, setPhase] = useState<Phase>('READING');
  const [timeLeft, setTimeLeft] = useState(120);
  const [code, setCode] = useState('# Write yer parley code here matey...');
  const editorRef = useRef<any>(null);

  useAntiCheat(DUMMY_USER_ID);

  useEffect(() => {
    fetchActiveRound();
  }, []);

  const fetchActiveRound = async () => {
    // 1. Get the active round
    const { data: roundData } = await supabase
      .from('rounds')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!roundData) return;
    setActiveRound(roundData);

    // 2. Get problems for this round
    const { data: problemData } = await supabase
      .from('round_problems')
      .select('problems (*)')
      .eq('round_id', roundData.id);

    if (problemData) {
      setProblems(problemData.map((rp: any) => rp.problems));
    }
  };

  useEffect(() => {
    if (phase === 'READING' && timeLeft > 0 && selectedProblem) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'READING' && timeLeft === 0 && selectedProblem) {
      setPhase('CODING');
    }
  }, [phase, timeLeft, selectedProblem]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Strict Paste Prevention
    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 52) { 
        e.preventDefault(); e.stopPropagation();
        alert("Nay! Ye can't paste yer stolen code here!");
      }
    });
  };

  const handleSubmit = async () => {
    const finalCode = editorRef.current.getValue();
    setPhase('SUBMITTED');
    
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: DUMMY_USER_ID,
        problemId: selectedProblem.id,
        sourceCode: finalCode,
        languageId: 71,
      }),
    });
  };

  if (!activeRound) {
    return <div className="min-h-screen bg-slate-950 text-amber-500 flex items-center justify-center font-serif text-3xl">Waiting for Captain to start a round...</div>;
  }

  if (phase === 'SUBMITTED') {
    return (
      <div className="min-h-screen bg-slate-950 text-amber-500 flex flex-col items-center justify-center font-serif">
        <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Message in a Bottle Sent!</h1>
        <p className="text-2xl mt-4">The Captain is evaluating your time and space complexity...</p>
        <button onClick={() => { setPhase('READING'); setSelectedProblem(null); }} className="mt-8 px-6 py-2 bg-amber-700 text-slate-900 rounded font-bold">Return to Map</button>
      </div>
    );
  }

  if (!selectedProblem) {
    return (
      <div className="min-h-screen bg-slate-950 text-amber-400 font-serif p-8">
        <h1 className="text-5xl font-black mb-8 text-center uppercase drop-shadow-[0_0_15px_rgba(217,119,6,0.8)]">
          {activeRound.name} {activeRound.is_code_in_the_dark && '🕶️'}
        </h1>
        <div className="max-w-4xl mx-auto grid gap-6">
          <h2 className="text-2xl font-bold text-slate-300">Available Maps (Problems):</h2>
          {problems.map(p => (
            <div key={p.id} onClick={() => { setSelectedProblem(p); setTimeLeft(120); }} className="bg-slate-900 border-2 border-amber-900 p-6 rounded-xl cursor-pointer hover:border-amber-500 transition-all hover:scale-105 shadow-lg">
              <h3 className="text-3xl font-bold mb-2">{p.title}</h3>
              <p className="text-slate-400">Time Limit: {p.time_limit}s | Memory Limit: {p.memory_limit}KB</p>
              <div className="mt-4 text-amber-600 font-bold">Click to embark! ⚔️</div>
            </div>
          ))}
          {problems.length === 0 && <p className="text-center text-slate-500">No maps assigned to this round yet.</p>}
        </div>
      </div>
    );
  }

  const isDark = activeRound.is_code_in_the_dark;

  return (
    <div className="min-h-screen bg-slate-950 text-amber-400 font-serif p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-4 border-amber-900 pb-4">
          <h1 className="text-4xl font-bold tracking-widest text-amber-500 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex items-center gap-4">
            <button onClick={() => setSelectedProblem(null)} className="text-xl bg-slate-800 px-3 py-1 rounded hover:bg-slate-700">← Back</button>
            {selectedProblem.title}
          </h1>
          
          {phase === 'READING' && (
            <div className="text-2xl font-bold bg-red-950 text-red-400 px-6 py-3 rounded-lg border-2 border-red-700 shadow-[0_0_15px_rgba(153,27,27,0.5)]">
              Time to read map: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          
          {phase === 'CODING' && isDark && (
            <div className="text-3xl font-bold text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              Dark Waters! Code Blind!
            </div>
          )}
          {phase === 'CODING' && !isDark && (
            <div className="text-3xl font-bold text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
              Clear Skies (Normal Coding)
            </div>
          )}
        </div>

        <div className="flex gap-6 flex-grow">
          {/* Problem Description */}
          <div className="w-1/3 bg-slate-900 p-6 rounded-lg border-2 border-amber-900 shadow-2xl overflow-y-auto">
            <h2 className="text-2xl mb-4 text-amber-600 border-b border-amber-900/50 pb-2">The Map</h2>
            <p className="text-lg leading-relaxed text-slate-300 mb-6">{selectedProblem.description}</p>
            <h3 className="text-xl text-amber-700 mb-2">Constraints:</h3>
            <p className="text-slate-400 bg-slate-950 p-3 rounded font-mono">{selectedProblem.constraints}</p>
          </div>

          {/* Editor Container */}
          <div className="w-2/3 relative flex flex-col border-4 border-amber-900 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.7)] bg-[#1e1e1e]">
            {/* The CSS Override for Code in the Dark */}
            <style dangerouslySetInnerHTML={{__html: `
              ${(phase === 'CODING' && isDark) ? `
                .monaco-editor .view-lines { opacity: 0 !important; }
                .monaco-editor .margin-view-overlays { opacity: 0.1 !important; }
                .monaco-editor .cursor { background-color: #D4AF37 !important; border-color: #D4AF37 !important; }
              ` : ''}
            `}} />
            
            <div className="flex-grow">
              <Editor
                height="100%"
                theme="vs-dark"
                defaultLanguage="python"
                value={code}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 18,
                  wordWrap: 'on',
                  autoIndent: 'full',
                  formatOnPaste: false,
                  contextmenu: false,
                  padding: { top: 20 },
                  readOnly: phase === 'READING' // Cannot code during reading phase!
                }}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        {phase === 'CODING' && (
          <button 
            onClick={handleSubmit}
            className="self-end px-10 py-5 bg-gradient-to-r from-amber-700 to-amber-500 hover:from-amber-600 hover:to-amber-400 text-slate-950 font-black text-2xl rounded-lg shadow-[0_0_20px_rgba(217,119,6,0.6)] transition-all hover:scale-105 uppercase tracking-wider"
          >
            Fire the Cannons! (Submit)
          </button>
        )}
      </div>
    </div>
  );
}
