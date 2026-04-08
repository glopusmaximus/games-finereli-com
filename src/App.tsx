import { useState, useEffect, Suspense } from 'react';
import { games } from './games/registry';
import GameCard from './components/GameCard';
import UpdateBanner from './components/UpdateBanner';
import BackButton from './components/BackButton';

function getSlug() {
  return window.location.hash.replace(/^#\/?/, '');
}

export default function App() {
  const [slug, setSlug] = useState(getSlug);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Hash router
  useEffect(() => {
    const onHashChange = () => setSlug(getSlug());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Update checker — poll version.json every 5 minutes
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        const data = await res.json();
        if (data.hash && data.hash !== __BUILD_HASH__) {
          setUpdateAvailable(true);
        }
      } catch {
        // Offline or fetch failed — ignore
      }
    };

    // First check after 30 seconds (give SW time to install)
    const initial = setTimeout(check, 30_000);
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  const currentGame = games.find(g => g.slug === slug);

  if (currentGame) {
    const GameComponent = currentGame.component;
    return (
      <div className="game-view">
        {updateAvailable && <UpdateBanner />}
        <BackButton />
        <Suspense fallback={<div className="loading">Loading game...</div>}>
          <GameComponent />
        </Suspense>
      </div>
    );
  }

  // Home page
  return (
    <div className="home">
      {updateAvailable && <UpdateBanner />}
      <header className="home-header">
        <h1 className="home-title">Yara's Games</h1>
        <p className="home-subtitle">Learn to read, one game at a time!</p>
      </header>
      <div className="game-grid">
        {games.map((game, i) => (
          <GameCard key={game.slug} game={game} index={i} />
        ))}
      </div>
    </div>
  );
}
