export default function WalkThePlank() {
    return (
      <div className="min-h-screen bg-slate-950 text-red-500 flex flex-col items-center justify-center font-serif">
        <h1 className="text-6xl font-black mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] uppercase">Disqualified!</h1>
        <p className="text-2xl mt-4 text-amber-500">Ye have abandoned ship or tried to cheat!</p>
        <p className="text-xl mt-2 text-slate-400">The Captain has marked ye for the plank.</p>
        <div className="text-9xl mt-12 animate-bounce">🦈</div>
      </div>
    );
  }
