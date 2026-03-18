import { useState, useCallback } from 'react';
import './App.css';
import { useCountdown } from './hooks/useCountdown';
import MemoryGame from './components/MemoryGame';
import Hero from './components/sections/Hero';
import Story from './components/sections/Story';
import Message from './components/sections/Message';
import Modals from './components/modals/Modals';

const App = () => {
  const [showGallery, setShowGallery] = useState(false);
  const [journeyModal, setJourneyModal] = useState<{ show: boolean, year: number | null }>({ show: false, year: null });
  const [hasSentEmail, setHasSentEmail] = useState(false);

  const initialCelebrationDate = new Date(2026, 2, 20); // Initial 3rd Year Anniversary
  
  const onAnniversary = useCallback(async () => {
    if (!hasSentEmail) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/anniversary/send-email`, { method: 'POST' });
        setHasSentEmail(true);
      } catch (e) {
        console.error('Email failed');
      }
    }
  }, [hasSentEmail]);

  const { timeLeft, celebrationDate } = useCountdown(initialCelebrationDate, onAnniversary);

  const anniversaryCount = celebrationDate.getFullYear() - 2023;
  
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="app-container">
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

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
        />
      </main>
    </div>
  );
};

export default App;
