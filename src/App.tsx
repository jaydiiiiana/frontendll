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
import logo from './assets/anniversary_logo.png';
import { useRef } from 'react';

const App = () => {
  const [showGallery, setShowGallery] = useState(false);
  const [journeyModal, setJourneyModal] = useState<{ show: boolean, year: number | null }>({ show: false, year: null });
  const [hasSentEmail, setHasSentEmail] = useState(false);
  const [dynamicPhotos, setDynamicPhotos] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simple routing
  const [isAdminPath, setIsAdminPath] = useState(window.location.hash === '#/admin' || window.location.pathname === '/admin');

  const [isCelebrationDismissed, setIsCelebrationDismissed] = useState(false);

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

  const { timeLeft, celebrationDate, isFinished } = useCountdown(initialCelebrationDate, onAnniversary);

  useEffect(() => {
    if (isFinished && audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked by browser', e));
    }
  }, [isFinished]);

  const anniversaryCount = celebrationDate.getFullYear() - 2023;
  
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // PWA Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const allPhotos = [...dynamicPhotos, ...staticPhotos];

  if (isAdminPath) {
    return <Admin />;
  }

  return (
    <div className={`app-container ${isFinished ? 'celebration-mode' : ''}`}>
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {isFinished && !isCelebrationDismissed && (
        <div className="celebration-overlay">
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div key={i} className={`confetti c-${i % 5}`}></div>
            ))}
          </div>
          <div className="celebration-content">
            <h1 className="handwritten animate-bounce">Happy {getOrdinal(anniversaryCount)} Anniversary! ❤️</h1>
            <p>Today is our special day! I love you so much.</p>
            <button className="btn-mint" onClick={() => setIsCelebrationDismissed(true)}>
              Exit ✨
            </button>
          </div>
        </div>
      )}

      <nav className="top-nav">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="nav-logo" />
          <div className="logo-text handwritten">Our Love</div>
        </div>
        <div className="nav-actions">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="install-pill">Download App 📥</button>
          )}
          <a href="#/admin" className="login-pill">Admin Login 🔒</a>
        </div>
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
      
      {/* Hidden celebration sound */}
      <audio 
        ref={audioRef} 
        src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" 
        preload="auto"
      />
    </div>
  );
};

export default App;
