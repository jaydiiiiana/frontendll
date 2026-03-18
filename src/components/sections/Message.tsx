interface MessageProps {
  anniversaryCount: number;
  onOpenGallery: () => void;
}

const Message = ({ anniversaryCount, onOpenGallery }: MessageProps) => {
  return (
    <section id="surprise" className="section">
      <div className="container">
        <h2 className="section-title">My Message to You</h2>
        <div className="message-box" style={{ margin: '0 auto', textAlign: 'left', padding: '40px', background: 'white', borderRadius: '30px' }}>
          <h2 className="handwritten" style={{ marginBottom: '20px' }}>Happy {anniversaryCount} Years!</h2>
          <p style={{ lineHeight: '1.8', color: '#555', fontFamily: 'Playfair Display' }}>
            Happy Anniversary, my love! I wanted to make something special for you to show how much you mean to me. 
            You are my best friend, my partner, and my everything. Thank you for making every day brighter 
            just by being in it.
          </p>
          <div className="btn-group" style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button className="btn-mint" onClick={onOpenGallery}>Our Photo Collection 📸</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Message;
