import type { TimeLeft } from '../../hooks/useCountdown';

interface HeroProps {
  anniversaryCount: number;
  getOrdinal: (n: number) => string;
  timeLeft: TimeLeft;
}

const Hero = ({ anniversaryCount, getOrdinal, timeLeft }: HeroProps) => {
  return (
    <section id="hero" className="hero">
      <div className="hero-grid">
        <div className="hero-text">
          <h1>Empowering Our <br />{getOrdinal(anniversaryCount)} Anniversary</h1>
          <p className="subtitle">
            Welcome to our {getOrdinal(anniversaryCount)} Anniversary space, where we celebrate {anniversaryCount} years of laughter, growth, and beautiful memories. Join us on this journey of us.
          </p>
          <button className="btn-mint" onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}>
            Learn More ➜
          </button>

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
  );
};

export default Hero;
