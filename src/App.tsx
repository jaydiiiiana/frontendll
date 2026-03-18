import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { useCountdown } from './hooks/useCountdown';
import MemoryGame from './components/MemoryGame';
import Hero from './components/sections/Hero';
import Story from './components/sections/Story';
import Message from './components/sections/Message';
import Modals from './components/modals/Modals';
import Admin from './components/Admin';
import { galleryPhotos as staticPhotos } from './data/anniversaryData';

const App = () => {
  const [showGallery, setShowGallery] = useState(false);
  const [journeyModal, setJourneyModal] = useState<{ show: boolean, year: number | null }>({ show: false, year: null });
  const [hasSentEmail, setHasSentEmail] = useState(false);
  const [dynamicPhotos, setDynamicPhotos] = useState<string[]>([]);

  // Simple routing
  const [isAdminPath, setIsAdminPath] = useState(window.location.hash === '#/admin' || window.location.pathname === '/admin');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/anniversary/photos`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        setDynamicPhotos(result.data.map((p: any) => p.url));
      }
    } catch (e) {
      console.error('Failed to fetch photos', e);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchPhotos();
    const handleHashChange = () => {
      setIsAdminPath(window.location.hash === '#/admin' || window.location.pathname === '/admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fetchPhotos]);

  const initialCelebrationDate = new Date(2026, 2, 20); // Initial 3rd Year Anniversary
  
  const onAnniversary = useCallback(async () => {
    if (!hasSentEmail) {
      try {
        await fetch(`${apiUrl}/anniversary/send-email`, { method: 'POST' });
        setHasSentEmail(true);
      } catch (e) {
        console.error('Email failed');
      }
    }
  }, [hasSentEmail, apiUrl]);

  const { timeLeft, celebrationDate } = useCountdown(initialCelebrationDate, onAnniversary);

  const anniversaryCount = celebrationDate.getFullYear() - 2023;
  
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const allPhotos = [...dynamicPhotos, ...staticPhotos];

  if (isAdminPath) {
    return <Admin />;
  }

  return (
    <div className="app-container">
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <nav className="top-nav">
        <div className="logo handwritten">Our Love</div>
        <a href="#/admin" className="login-pill">Admin Login 🔒</a>
      </nav>

      <main>
        <Hero 
          anniversaryCount={anniversaryCount} 
          getOrdinal={getOrdinal} 
          timeLeft={timeLeft} 
        />

        <Story 
          onCardClick={(index) => setJourneyModal({ show: true, year: index })} 
        />

        <section id="game" className="section">
          <div className="container">
            <MemoryGame />
          </div>
        </section>

        <Message 
          anniversaryCount={anniversaryCount} 
          onOpenGallery={() => setShowGallery(true)} 
        />

        <Modals 
          journeyModal={journeyModal}
          showGallery={showGallery}
          onCloseJourney={() => setJourneyModal({ show: false, year: null })}
          onCloseGallery={() => setShowGallery(false)}
          customPhotos={allPhotos}
        />
        
        <div style={{ textAlign: 'center', paddingBottom: '30px' }}>
          <a href="#/admin" style={{ opacity: 0.2, color: 'inherit', fontSize: '0.7rem' }}>Admin Panel</a>
        </div>
      </main>
    </div>
  );
};

export default App;
