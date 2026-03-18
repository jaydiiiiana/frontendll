import { journeyLetters } from '../../data/anniversaryData';

interface StoryProps {
  onCardClick: (index: number) => void;
}

const Story = ({ onCardClick }: StoryProps) => {
  return (
    <section id="story" className="section">
      <h2 className="section-title">Choose Your Adventure</h2>
      <p style={{ marginBottom: '40px', color: '#8d6e63' }}>Dive deeper into the topics that matter most to us.</p>
      <div className="container">
        <div className="story-grid">
          {journeyLetters.map((item, index) => (
            <div key={index} className={`story-card ${item.colorClass}`} onClick={() => onCardClick(index)}>
              <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '20px' }}>
                {index === 0 ? '🎗️' : index === 1 ? '🧬' : '📖'}
              </div>
              <h3>{index === 0 ? 'Beginning' : index === 1 ? 'Growth' : 'Future'}</h3>
              <p>{item.year}</p>
              <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>{item.letter.substring(0, 100)}...</p>
              <div style={{ marginTop: 'auto', paddingTop: '20px', fontWeight: '700', fontSize: '0.8rem' }}>LEARN MORE ➜</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Story;
