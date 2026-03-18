import { journeyLetters, galleryPhotos } from '../../data/anniversaryData';

interface ModalsProps {
  journeyModal: { show: boolean, year: number | null };
  showGallery: boolean;
  onCloseJourney: () => void;
  onCloseGallery: () => void;
  customPhotos?: string[];
}

const Modals = ({ journeyModal, showGallery, onCloseJourney, onCloseGallery, customPhotos }: ModalsProps) => {
  const displayPhotos = customPhotos || galleryPhotos;
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
          <div className="modal-content" style={{ maxWidth: '1000px' }} onClick={e => e.stopPropagation()}>
            <span className="close-btn" onClick={onCloseGallery}>&times;</span>
            <h2 className="handwritten">Our Beautiful Memories</h2>
            <div className="photo-grid-3x3">
              {displayPhotos.map((photo, index) => (
                <div key={index} style={{ aspectRatio: '1/1', overflow: 'hidden', borderRadius: '15px' }}>
                  <img 
                    src={photo.startsWith('http') ? photo : `/${photo}`} 
                    alt={`Memory ${index + 1}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    loading="lazy" 
                  />
                </div>
              ))}
            </div>
            <button className="btn-mint" onClick={onCloseGallery}>Close Gallery</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;
