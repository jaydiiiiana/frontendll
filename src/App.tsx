import { useState, useEffect } from 'react';
import './App.css';
import MemoryGame from './components/MemoryGame';

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const App = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  const [showGallery, setShowGallery] = useState(false);
  const [journeyModal, setJourneyModal] = useState<{ show: boolean, year: number | null }>({ show: false, year: null });

  const [celebrationDate, setCelebrationDate] = useState(() => {
    const d = new Date(2026, 2, 20); // Initial 3rd Year Anniversary
    const today = new Date();
    if (today > d && today.getDate() !== d.getDate()) {
       d.setFullYear(today.getFullYear() + (today > d ? 1 : 0));
    }
    return d;
  });

  const [hasSentEmail, setHasSentEmail] = useState(false);

  useEffect(() => {
    const triggerAnniversaryEmail = async () => {
      try {
        await fetch('http://localhost:3000/anniversary/send-email', { method: 'POST' });
        setHasSentEmail(true);
      } catch (e) {
        console.error('Email failed');
      }
    };

    const updateCounter = () => {
      const now = new Date();
      const difference = celebrationDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        const isBigDay = now.getDate() === celebrationDate.getDate() && now.getMonth() === celebrationDate.getMonth();
        if (isBigDay) {
           if (!hasSentEmail) triggerAnniversaryEmail();
        } else {
           const nextYear = new Date(celebrationDate);
           nextYear.setFullYear(nextYear.getFullYear() + 1);
           setCelebrationDate(nextYear);
           setHasSentEmail(false);
        }
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d.toString().padStart(2, '0'),
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0')
      });
    };

    const timer = setInterval(updateCounter, 1000);
    updateCounter();
    return () => clearInterval(timer);
  }, [celebrationDate]);


  const journeyLetters = [
    {
      year: "Year One (2023-2024)",
      photo: "us-photo-1",
      colorClass: "card-yellow",
      letter: "Our very first year together was like a beautiful dream. From the first moment we met, I knew you were someone special. Every message, every laugh, and every quiet moment we shared built the foundation of the love we have today."
    },
    {
      year: "Year Two (2024-2025)",
      photo: "us-photo-2",
      colorClass: "card-pink",
      letter: "The second year was when our roots grew deep. We learned more about each other's strengths and weaknesses, and through it all, our love only got stronger. We've weathered challenges and celebrated triumphs together."
    },
    {
      year: "Year Three (2025-2026)",
      photo: "us-photo-3",
      colorClass: "card-peach",
      letter: "Now we're here, celebrating three incredible years. Looking back, my heart is so full of gratitude. You've become my home, my peace, and my greatest adventure. I'm so excited to see what the next hundred years hold for us."
    }
  ];

  const galleryPhotos = [
    "8a88748e-1133-4e3f-aa98-d6714788258c.jpg",
    "8bc4e4a0-b1da-4722-a601-442e10a90c38.jpg",
    "45da56fd-fc4c-457e-bb0a-d09137738578.jpg",
    "103a4531-d3fc-4e80-b7a5-cf8c07423b8c.jpg",
    "278befba-a4b9-4a1a-9a66-eaecbf362a10.jpg",
    "3643aecd-3296-4c57-bb91-dd5b181ad08e.jpg",
    "5705e082-142f-4f90-8529-f54dd47dc22a.jpg",
    "d7e5cc38-edac-482f-8491-2a794af1f9f8.jpg",
    "c065dabc-926c-4597-bd26-6104881873ad.jpg",
    "b7ea6491-e2a4-451e-8619-68e8c6781506.jpg",
    "ab66e3b2-9a75-4836-a7ce-3fd58221660d.jpg",
    "a71f8474-4875-470f-9053-7a146218d764.jpg",
    "a3c24c49-eb19-4cd8-907f-3915acba95ca.jpg",
    "29522ba9-c1fa-44e3-9ed6-957836be21cf.jpg",
    "6332db14-d62d-4382-8fea-d25b06c6839f.jpg"
  ];

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
        {/* Desktop Hero Section */}
        <section id="hero" className="hero">
          <div className="hero-grid">
            <div className="hero-text">
              <h1>Empowering Our <br/>{getOrdinal(anniversaryCount)} Anniversary</h1>
              <p className="subtitle">Welcome to our {getOrdinal(anniversaryCount)} Anniversary space, where we celebrate {anniversaryCount} years of laughter, growth, and beautiful memories. Join us on this journey of us.</p>
              <button className="btn-mint" onClick={() => document.getElementById('story')?.scrollIntoView({behavior: 'smooth'})}>Learn More ➜</button>
              
              <div className="countdown-container">
                <div id="countdown" className="countdown">
                  <div className="time-part"><span>{timeLeft.days}</span><label>Days</label></div>
                  <div className="time-part"><span>{timeLeft.hours}</span><label>Hours</label></div>
                  <div className="time-part"><span>{timeLeft.minutes}</span><label>Mins</label></div>
                  <div className="time-part"><span>{timeLeft.seconds}</span><label>Secs</label></div>
                </div>
              </div>
            </div>
            <div className="hero-images">
              <div className="polaroid p1">
                 <img src="/us1.png.jpg" alt="Us Year 1" />
              </div>
              <div className="polaroid p2">
                 <img src="/us2.png.jpg" alt="Us Year 2" />
              </div>
              <div className="polaroid p3">
                 <img src="/us3.png" alt="Us Year 3" />
              </div>
            </div>
          </div>
        </section>

        {/* Journey Section - Choose Your Adventure style */}
        <section id="story" className="section">
          <h2 className="section-title">Choose Your Adventure</h2>
          <p style={{marginBottom: '40px', color: '#8d6e63'}}>Dive deeper into the topics that matter most to us.</p>
          <div className="container">
            <div className="story-grid">
              {journeyLetters.map((item, index) => (
                <div key={index} className={`story-card ${item.colorClass}`} onClick={() => setJourneyModal({ show: true, year: index })}>
                  <div className="card-icon" style={{fontSize: '2rem', marginBottom: '20px'}}>
                     {index === 0 ? '🎗️' : index === 1 ? '🧬' : '📖'}
                  </div>
                  <h3>{index === 0 ? 'Beginning' : index === 1 ? 'Growth' : 'Future'}</h3>
                  <p>{item.year}</p>
                  <p style={{marginTop: '10px', fontSize: '0.9rem'}}>{item.letter.substring(0, 100)}...</p>
                  <div style={{marginTop: 'auto', paddingTop: '20px', fontWeight: '700', fontSize: '0.8rem'}}>LEARN MORE ➜</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Game Section */}
        <section id="game" className="section">
          <div className="container">
            <MemoryGame />
          </div>
        </section>

        {/* Message Section */}
        <section id="surprise" className="section">
          <div className="container">
            <h2 className="section-title">My Message to You</h2>
            <div className="message-box" style={{margin: '0 auto', textAlign: 'left', padding: '40px', background: 'white', borderRadius: '30px'}}>
              <h2 className="handwritten" style={{marginBottom: '20px'}}>Happy {anniversaryCount} Years!</h2>
              <p style={{lineHeight: '1.8', color: '#555', fontFamily: 'Playfair Display'}}>Happy Anniversary, my love! I wanted to make something special for you to show how much you mean to me. You are my best friend, my partner, and my everything. Thank you for making every day brighter just by being in it.</p>
              <div className="btn-group" style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
                 <button className="btn-mint" onClick={() => setShowGallery(true)}>Our Photo Collection 📸</button>
              </div>
            </div>
          </div>
        </section>



        {journeyModal.show && journeyModal.year !== null && (
          <div className="modal" onClick={() => setJourneyModal({ show: false, year: null })}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <span className="close-btn" onClick={() => setJourneyModal({ show: false, year: null })}>&times;</span>
              <div style={{width: '100%', height: '300px', background: `url(${journeyModal.year === 0 ? '/us1.png.jpg' : journeyModal.year === 1 ? '/us2.png.jpg' : '/us3.png'})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '20px', marginBottom: '20px'}}></div>
              <h2 className="handwritten">{journeyLetters[journeyModal.year].year}</h2>
              <div style={{marginTop: '20px', lineHeight: '1.8', color: '#555', textAlign: 'left'}}>
                <p>{journeyLetters[journeyModal.year].letter}</p>
              </div>
              <button className="btn-mint" style={{marginTop: '20px'}} onClick={() => setJourneyModal({ show: false, year: null })}>Close Letter</button>
            </div>
          </div>
        )}

        {showGallery && (
          <div className="modal" onClick={() => setShowGallery(false)}>
            <div className="modal-content" style={{maxWidth: '1000px'}} onClick={e => e.stopPropagation()}>
              <span className="close-btn" onClick={() => setShowGallery(false)}>&times;</span>
              <h2 className="handwritten">Our Beautiful Memories</h2>
              <div className="photo-grid-3x3">
                {galleryPhotos.map((photo, index) => (
                  <div key={index} style={{aspectRatio: '1/1', overflow: 'hidden', borderRadius: '15px'}}>
                    <img src={`/${photo}`} alt={`Memory ${index + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} loading="lazy" />
                  </div>
                ))}
              </div>
              <button className="btn-mint" onClick={() => setShowGallery(false)}>Close Gallery</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
