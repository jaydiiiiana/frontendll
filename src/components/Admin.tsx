import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const Admin = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [isAuthenticated]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/anniversary/photos`);
      const result = await res.json();
      if (result.success) {
        setPhotos(result.data);
      }
    } catch (e) {
      console.error('Failed to fetch photos');
    }
  }, [apiUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
      
      const channel = supabase
        .channel('admin photos')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'photos' }, 
          (payload) => {
            if (payload.eventType === 'INSERT') {
              fetchPhotos();
            } else if (payload.eventType === 'UPDATE') {
              fetchPhotos();
            } else if (payload.eventType === 'DELETE') {
              fetchPhotos();
            }
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, fetchPhotos]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'diana152023@jaydi') { // Updated password
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      alert('Wrong password!');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('Uploading and processing...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/anniversary/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setStatus('✅ Success! Your memory has been saved.');
      setFile(null);
      fetchPhotos(); // Refresh list
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, var(--soft-pink) 0%, var(--bg-cream) 100%)',
        padding: '20px'
      }}>
        <div className="admin-card" style={{ 
          backdropFilter: 'blur(10px)',
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid white',
          background: 'rgba(255, 255, 255, 0.8)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔐</div>
          <h2 className="handwritten" style={{ fontSize: '2.5rem', color: 'var(--deep-pink)', marginBottom: '10px' }}>Admin Login</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Manage our special memories.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="password" 
              placeholder="Magic Password..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                padding: '15px 25px', 
                borderRadius: '50px', 
                border: '1px solid #eee', 
                background: 'white',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: '0 5px 15px rgba(0,0,0,0.02)'
              }}
              autoFocus
            />
            <button type="submit" className="btn-mint" style={{ 
              padding: '12px 25px', 
              borderRadius: '50px', 
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 'bold',
              marginTop: '10px'
            }}>
              Login
            </button>
          </form>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ 
              marginTop: '25px', 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header className="admin-header">
          <div style={{ textAlign: 'left' }}>
            <h1 className="handwritten" style={{ margin: 0, color: 'var(--deep-pink)', fontSize: '2.2rem' }}>Love Dashboard</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>The control center of our memories.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
             <button onClick={() => window.location.href = '/'} style={{ padding: '10px 20px', borderRadius: '50px', border: '1px solid var(--soft-pink)', background: 'transparent', color: 'var(--deep-pink)', fontWeight: 'bold', cursor: 'pointer' }}>View Site</button>
             <button onClick={handleLogout} style={{ padding: '10px 20px', borderRadius: '50px', border: 'none', background: 'var(--soft-pink)', color: 'var(--deep-pink)', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
          </div>
        </header>

        <div className="admin-grid">
          {/* Upload Section */}
          <div>
            <div className="admin-card sticky-top">
              <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-brown)' }}>Upload New Memory</h2>
              
              <div style={{ 
                border: '2px dashed var(--soft-pink)', 
                borderRadius: '20px', 
                padding: '30px', 
                marginBottom: '20px',
                background: '#fafafa',
                position: 'relative'
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    opacity: 0, 
                    cursor: 'pointer' 
                  }} 
                />
                <div style={{ pointerEvents: 'none' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {file ? file.name : 'Click or drop a photo here'}
                  </p>
                </div>
              </div>

              {file && (
                <div style={{ marginBottom: '20px' }}>
                  <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', borderRadius: '15px', maxHeight: '200px', objectFit: 'cover' }} />
                </div>
              )}

              <button 
                onClick={handleUpload} 
                disabled={uploading || !file} 
                className="btn-mint"
                style={{ width: '100%', padding: '15px', borderRadius: '50px', justifyContent: 'center' }}
              >
                {uploading ? 'Working our magic...' : 'Upload to Gallery ✨'}
              </button>

              {status && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: status.includes('❌') ? '#fff1f0' : '#f6ffed',
                  color: status.includes('❌') ? '#ff4d4f' : '#52c41a',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  {status}
                </div>
              )}
            </div>
          </div>

          {/* Photos Management Section */}
          <div className="admin-card" style={{ minHeight: '600px' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '1.5rem', color: 'var(--text-brown)', textAlign: 'left' }}>Memory Library ({photos.length})</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: '15px',
              maxHeight: '70vh',
              overflowY: 'auto',
              padding: '5px'
            }}>
              {photos.length > 0 ? (
                photos.map((p) => (
                  <div key={p.id} style={{ 
                    position: 'relative', 
                    aspectRatio: '1/1', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.05)'
                  }}>
                    <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Uploaded" />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      background: 'rgba(0,0,0,0.3)', 
                      padding: '5px', 
                      color: 'white', 
                      fontSize: '0.7rem',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', padding: '50px 0', color: 'var(--text-muted)' }}>
                  No photos uploaded yet. They'll appear here!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
