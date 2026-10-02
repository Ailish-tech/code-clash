'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'LEADERBOARD' | 'PROBLEMS' | 'ROUNDS'>('LEADERBOARD');
  
  // States for Leaderboard
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  // States for Problems
  const [problems, setProblems] = useState<any[]>([]);
  const [newProblem, setNewProblem] = useState({ title: '', description: '', constraints: '', memory_limit: 256000, time_limit: 2.0 });

  // States for Rounds
  const [rounds, setRounds] = useState<any[]>([]);
  const [newRound, setNewRound] = useState({ name: '', is_code_in_the_dark: false, duration_seconds: 3600 });
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');

  useEffect(() => {
    fetchSubmissions();
    fetchProblems();
    fetchRounds();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id, status, score, execution_time, memory_used, created_at,
        users ( name, email, disqualified ),
        problems ( title )
      `)
      .order('score', { ascending: false })
      .order('execution_time', { ascending: true })
      .order('memory_used', { ascending: true });
      
    if (!error) setSubmissions(data || []);
    setLoading(false);
  };

  const fetchProblems = async () => {
    const { data } = await supabase.from('problems').select('*').order('created_at', { ascending: false });
    if (data) setProblems(data);
  };

  const fetchRounds = async () => {
    const { data } = await supabase.from('rounds').select(`
      *,
      round_problems ( problem_id )
    `).order('created_at', { ascending: false });
    if (data) setRounds(data);
  };

  const handleCreateProblem = async () => {
    const { error } = await supabase.from('problems').insert([newProblem]);
    if (!error) {
      alert('Map added to the repository!');
      fetchProblems();
      setNewProblem({ title: '', description: '', constraints: '', memory_limit: 256000, time_limit: 2.0 });
    } else {
      alert('Failed to add problem: ' + error.message);
    }
  };

  const handleCreateRound = async () => {
    const { error } = await supabase.from('rounds').insert([newRound]);
    if (!error) {
      alert('New round created!');
      fetchRounds();
      setNewRound({ name: '', is_code_in_the_dark: false, duration_seconds: 3600 });
    } else {
      alert('Failed to create round: ' + error.message);
    }
  };

  const handleSetActiveRound = async (roundId: string) => {
    // Deactivate all
    await supabase.from('rounds').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // hack to update all
    // Activate target
    await supabase.from('rounds').update({ is_active: true }).eq('id', roundId);
    fetchRounds();
  };

  const handleAddProblemToRound = async (roundId: string) => {
    if (!selectedProblemId) return;
    await supabase.from('round_problems').insert([{ round_id: roundId, problem_id: selectedProblemId }]);
    fetchRounds();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-500 p-8 font-serif">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b-4 border-amber-900 pb-6 mb-8 gap-4">
          <h1 className="text-4xl font-black uppercase drop-shadow-[0_0_15px_rgba(217,119,6,0.8)]">
            👑 Captain's Quarters
          </h1>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('LEADERBOARD')} className={`px-6 py-2 rounded font-bold ${activeTab === 'LEADERBOARD' ? 'bg-amber-700 text-slate-900' : 'border border-amber-700 hover:bg-slate-900'}`}>Leaderboard</button>
            <button onClick={() => setActiveTab('PROBLEMS')} className={`px-6 py-2 rounded font-bold ${activeTab === 'PROBLEMS' ? 'bg-amber-700 text-slate-900' : 'border border-amber-700 hover:bg-slate-900'}`}>Problems</button>
            <button onClick={() => setActiveTab('ROUNDS')} className={`px-6 py-2 rounded font-bold ${activeTab === 'ROUNDS' ? 'bg-amber-700 text-slate-900' : 'border border-amber-700 hover:bg-slate-900'}`}>Rounds</button>
          </div>
        </div>

        {/* --- LEADERBOARD TAB --- */}
        {activeTab === 'LEADERBOARD' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setRevealed(!revealed)} className={`px-6 py-3 font-bold rounded-lg shadow-lg ${revealed ? 'bg-red-800 text-white' : 'bg-green-700 text-white'}`}>
                {revealed ? 'Hide the Loot' : 'Reveal Leaderboard'}
              </button>
            </div>
            
            <div className="bg-slate-900 border-2 border-amber-900 rounded-xl overflow-hidden shadow-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-900 text-amber-400">
                    <th className="p-4">Pirate Name</th>
                    <th className="p-4">Problem</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Time (s)</th>
                    <th className="p-4 text-center">Space (KB)</th>
                    <th className="p-4 text-center">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="p-4">{sub.users?.name || 'Unknown'} {sub.users?.disqualified && <span className="text-red-500 font-bold">(Cheater!)</span>}</td>
                      <td className="p-4 text-slate-300">{sub.problems?.title}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${sub.status === 'accepted' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-300">{sub.execution_time ? sub.execution_time.toFixed(3) : '-'}</td>
                      <td className="p-4 text-center text-slate-300">{sub.memory_used || '-'}</td>
                      <td className="p-4 text-center font-black text-2xl text-amber-400">
                        {revealed ? sub.score : '???'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PROBLEMS TAB --- */}
        {activeTab === 'PROBLEMS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-amber-900">
              <h2 className="text-2xl font-bold mb-4">Add New Problem (Map)</h2>
              <input type="text" placeholder="Title" value={newProblem.title} onChange={e => setNewProblem({...newProblem, title: e.target.value})} className="w-full mb-4 p-3 bg-slate-800 rounded border border-slate-700" />
              <textarea placeholder="Description" value={newProblem.description} onChange={e => setNewProblem({...newProblem, description: e.target.value})} className="w-full mb-4 p-3 bg-slate-800 rounded border border-slate-700 h-32" />
              <input type="text" placeholder="Constraints" value={newProblem.constraints} onChange={e => setNewProblem({...newProblem, constraints: e.target.value})} className="w-full mb-4 p-3 bg-slate-800 rounded border border-slate-700" />
              <div className="flex gap-4 mb-4">
                <input type="number" placeholder="Time Limit (s)" value={newProblem.time_limit} onChange={e => setNewProblem({...newProblem, time_limit: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-800 rounded border border-slate-700" />
                <input type="number" placeholder="Memory Limit (KB)" value={newProblem.memory_limit} onChange={e => setNewProblem({...newProblem, memory_limit: parseInt(e.target.value)})} className="w-full p-3 bg-slate-800 rounded border border-slate-700" />
              </div>
              <button onClick={handleCreateProblem} className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-slate-950 font-bold rounded">Upload Map</button>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Existing Maps</h2>
              {problems.map(p => (
                <div key={p.id} className="bg-slate-900 p-4 mb-4 rounded border border-amber-900">
                  <h3 className="text-xl font-bold">{p.title}</h3>
                  <p className="text-sm text-slate-400">Time: {p.time_limit}s | Mem: {p.memory_limit}KB</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ROUNDS TAB --- */}
        {activeTab === 'ROUNDS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-amber-900">
              <h2 className="text-2xl font-bold mb-4">Create New Round</h2>
              <input type="text" placeholder="Round Name (e.g. Round 2 - Dark)" value={newRound.name} onChange={e => setNewRound({...newRound, name: e.target.value})} className="w-full mb-4 p-3 bg-slate-800 rounded border border-slate-700" />
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input type="checkbox" checked={newRound.is_code_in_the_dark} onChange={e => setNewRound({...newRound, is_code_in_the_dark: e.target.checked})} className="w-6 h-6 accent-amber-600" />
                <span className="text-xl font-bold">Enable "Code in the Dark" Mode? 🏴‍☠️</span>
              </label>
              <input type="number" placeholder="Duration (seconds)" value={newRound.duration_seconds} onChange={e => setNewRound({...newRound, duration_seconds: parseInt(e.target.value)})} className="w-full mb-4 p-3 bg-slate-800 rounded border border-slate-700" />
              <button onClick={handleCreateRound} className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-slate-950 font-bold rounded">Deploy Round</button>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Manage Active Rounds</h2>
              {rounds.map(r => (
                <div key={r.id} className={`p-4 mb-4 rounded border-2 ${r.is_active ? 'border-green-500 bg-slate-900' : 'border-amber-900 bg-slate-900/50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">{r.name} {r.is_code_in_the_dark && '🕶️'}</h3>
                    {!r.is_active && (
                      <button onClick={() => handleSetActiveRound(r.id)} className="px-3 py-1 bg-green-700 text-white rounded font-bold text-sm">Set Active</button>
                    )}
                    {r.is_active && <span className="text-green-500 font-bold animate-pulse">ACTIVE NOW</span>}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="font-bold text-sm text-amber-600 mb-2">Assigned Problems: {r.round_problems?.length || 0}</h4>
                    <div className="flex gap-2">
                      <select onChange={e => setSelectedProblemId(e.target.value)} className="bg-slate-800 p-1 rounded text-sm flex-grow">
                        <option value="">Select Map to Add...</option>
                        {problems.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                      <button onClick={() => handleAddProblemToRound(r.id)} className="px-3 bg-amber-700 text-slate-900 font-bold rounded text-sm">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
