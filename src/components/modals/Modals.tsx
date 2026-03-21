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
    if (!nickname.trim()) return;

    // Optimistic Update: Update the local display list immediately
    if (customPhotos) {
      // Create a function to update the parent state if passed, but here we can try to update the current list 
      // if we are displaying it. However, the true state is in App.tsx. 
      // Let's modify the parent (App.tsx) to handle the reaction logic instead?
      // For now, if we cannot update parent directly, we'll just wait.
      // Wait! I'll check how Modals.tsx gets its data.
    }

    // Proceed with reaction
    try {
      await fetch(`${apiUrl}/anniversary/photos/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, emoji, nickname }),
      });
    } catch (e) {
      console.error('Failed to react');
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
            <div className="photo-grid-3x3" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '15px', scrollbarWidth: 'thin' }}>
              {displayPhotos.map((photo, index) => {
                const isLiked = photo.reactions?.['❤️']?.includes(nickname);
                
                return (
                  <div key={photo.id} style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    boxShadow: '0 8px 25px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'transform 0.3s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ aspectRatio: '1/1', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={photo.url.startsWith('http') ? photo.url : `/${photo.url}`} 
                        alt={`Memory ${index + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        loading="lazy" 
                      />
                      {isLiked && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>❤️</div>
                      )}
                    </div>
                    
                    <div style={{ padding: '12px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                        {emojis.map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => handleReact(photo.id, emoji)}
                            style={{ 
                              background: photo.reactions?.[emoji]?.includes(nickname) ? 'var(--soft-pink)' : 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              fontSize: '1.2rem', 
                              padding: '5px',
                              borderRadius: '10px',
                              transition: 'all 0.2s'
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                        {photo.reactions && Object.entries(photo.reactions).map(([emoji, users]) => users.length > 0 && (
                          <span key={emoji} style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)',
                            background: '#f9f9f9',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontWeight: '600'
                          }}>
                            {emoji} {users.length}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn-mint" style={{ marginTop: '30px' }} onClick={onCloseGallery}>Close Gallery</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;
