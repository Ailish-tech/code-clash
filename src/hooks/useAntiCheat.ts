import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAntiCheat(userId: string) {
  const router = useRouter();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User switched tabs - mark as disqualified in the backend
        await fetch('/api/disqualify', {
          method: 'POST',
          body: JSON.stringify({ userId }),
          headers: { 'Content-Type': 'application/json' },
        });
        alert('Avast ye! Ye have abandoned ship (switched tabs) and are now disqualified!');
        router.push('/walk-the-plank'); // Redirect to disqualified screen
      }
    };

    // Block right click (No plundering code allowed)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert('No plundering code allowed! Keep yer hands on the keyboard.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [userId, router]);
}
