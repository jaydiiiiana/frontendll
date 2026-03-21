interface StoryProps {
  onCardClick: (index: number) => void;
  stories: any[];
}

const Story = ({ onCardClick, stories }: StoryProps) => {
  return (
    <section id="story" className="section">
      <h2 className="section-title">Our Journey</h2>
      <p style={{ marginBottom: '40px', color: '#8d6e63' }}>Dive deeper into the topics that matter most to us.</p>
      <div className="container">
        <div className="story-grid">
          {stories.map((item, index) => (
            <div key={index} className={`story-card ${item.colorClass || item.color_class || 'card-pink'}`} onClick={() => onCardClick(index)}>
              <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '20px' }}>
                {index === 0 ? '🎗️' : index === 1 ? '🧬' : '📖'}
              </div>
              <h3>{item.year || item.year_title}</h3>
              <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                {(item.letter || item.letter_content || '').substring(0, 100)}...
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '20px', fontWeight: '700', fontSize: '0.8rem' }}>LEARN MORE ➜</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Story;
