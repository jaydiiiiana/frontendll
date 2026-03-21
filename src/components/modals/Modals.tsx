import { journeyLetters } from '../../data/anniversaryData';

interface Photo {
  id: string;
  url: string;
  reactions?: Record<string, string[]>;
}

interface ModalsProps {
  journeyModal: { show: boolean, year: number | null };
  showGallery: boolean;
  onCloseJourney: () => void;
  onCloseGallery: () => void;
  customPhotos?: Photo[];
}

const Modals = ({ journeyModal, showGallery, onCloseJourney, onCloseGallery, customPhotos }: ModalsProps) => {
  const displayPhotos = customPhotos || [];
  const nickname = localStorage.getItem('anniversary_nickname') || 'Someone';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const emojis = ['❤️', '✨', '🥰', '🔥'];

  const handleReact = async (photoId: string, emoji: string) => {
    if (photoId.startsWith('static-')) return; // Can't react to static photos if not in DB
    try {
      await fetch(`${apiUrl}/anniversary/photos/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, emoji, nickname }),
      });
    } catch (e) {
      console.error('Failed to react to photo');
    }
  };

  return (
    <>
      {journeyModal.show && journeyModal.year !== null && (
        <div className="modal" onClick={onCloseJourney}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-btn" onClick={onCloseJourney}>&times;</span>
            <div style={{
              width: '100%',
              height: '300px',
              background: `url(${journeyModal.year === 0 ? '/us1.png.jpg' : journeyModal.year === 1 ? '/us2.png.jpg' : '/us3.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '20px',
              marginBottom: '20px'
            }}></div>
            <h2 className="handwritten">{journeyLetters[journeyModal.year].year}</h2>
            <div style={{ marginTop: '20px', lineHeight: '1.8', color: '#555', textAlign: 'left' }}>
              <p>{journeyLetters[journeyModal.year].letter}</p>
            </div>
            <button className="btn-mint" style={{ marginTop: '20px' }} onClick={onCloseJourney}>Close Letter</button>
          </div>
        </div>
      )}

      {showGallery && (
        <div className="modal" onClick={onCloseGallery}>
          <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <span className="close-btn" onClick={onCloseGallery}>&times;</span>
            <h2 className="handwritten" style={{ marginBottom: '30px' }}>Our Beautiful Memories</h2>
            <div className="photo-grid-3x3" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}>
              {displayPhotos.map((photo, index) => (
                <div key={photo.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '15px', 
                  overflow: 'hidden', 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                    <img 
                      src={photo.url.startsWith('http') ? photo.url : `/${photo.url}`} 
                      alt={`Memory ${index + 1}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      loading="lazy" 
                    />
                  </div>
                  {!photo.id.startsWith('static-') && (
                    <div style={{ padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '5px', width: '100%', justifyContent: 'center' }}>
                        {emojis.map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => handleReact(photo.id, emoji)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.1s' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                        {photo.reactions && Object.entries(photo.reactions).map(([emoji, users]) => users.length > 0 && (
                          <span key={emoji} style={{ 
                            fontSize: '0.7rem', 
                            background: users.includes(nickname) ? 'var(--soft-pink)' : '#f5f5f5', 
                            padding: '2px 6px', 
                            borderRadius: '10px',
                            border: users.includes(nickname) ? '1px solid var(--deep-pink)' : 'none'
                          }}>
                            {emoji} {users.length}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="btn-mint" style={{ marginTop: '30px' }} onClick={onCloseGallery}>Close Gallery</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;
