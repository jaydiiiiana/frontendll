import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const Admin = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [storyForm, setStoryForm] = useState({ id: '', title: '', letter: '', image_url: '', color: 'card-pink' });
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [storyFile, setStoryFile] = useState<File | null>(null);

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
      if (result.success) setPhotos(result.data);
    } catch (e) {
      console.error('Failed to fetch photos');
    }
  }, [apiUrl]);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/anniversary/stories`);
      const result = await res.json();
      if (result.success) setStories(result.data);
    } catch (e) {
      console.error('Failed to fetch stories');
    }
  }, [apiUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
      fetchStories();
      
      const photosChannel = supabase.channel('admin photos').on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => fetchPhotos()).subscribe();
      const storiesChannel = supabase.channel('admin stories').on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => fetchStories()).subscribe();
      
      return () => {
        supabase.removeChannel(photosChannel);
        supabase.removeChannel(storiesChannel);
      };
    }
  }, [isAuthenticated, fetchPhotos, fetchStories]);

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = storyForm.image_url;

    if (storyFile) {
      const formData = new FormData();
      formData.append('file', storyFile);
      const res = await fetch(`${apiUrl}/anniversary/upload-asset`, { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) finalImageUrl = result.url;
    }

    const payload = { ...storyForm, image_url: finalImageUrl };
    const method = isEditingStory ? 'PUT' : 'POST';
    const url = isEditingStory ? `${apiUrl}/anniversary/stories/${storyForm.id}` : `${apiUrl}/anniversary/stories`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.success) {
      fetchStories();
      setStoryForm({ id: '', title: '', letter: '', image_url: '', color: 'card-pink' });
      setStoryFile(null);
      setIsEditingStory(false);
    }
  };

  const handleEditStory = (story: any) => {
    setStoryForm({
      id: story.id,
      title: story.year_title,
      letter: story.letter_content,
      image_url: story.image_url,
      color: story.color_class
    });
    setIsEditingStory(true);
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;
    const res = await fetch(`${apiUrl}/anniversary/stories/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) fetchStories();
  };


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

        {/* Stories Management Section */}
        <div style={{ marginTop: '50px' }}>
          <div className="admin-card">
            <h2 style={{ marginBottom: '25px', fontSize: '1.8rem', color: 'var(--deep-pink)' }}>Anniversary Stories Manager</h2>
            
            <form onSubmit={handleStorySubmit} className="admin-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Anniversary Title (e.g. 4th Anniversary)" 
                  value={storyForm.title}
                  onChange={e => setStoryForm({...storyForm, title: e.target.value})}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #eee' }}
                />
                <textarea 
                  placeholder="The Story/Letter..." 
                  value={storyForm.letter}
                  onChange={e => setStoryForm({...storyForm, letter: e.target.value})}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #eee', minHeight: '150px' }}
                />
                <select 
                  value={storyForm.color}
                  onChange={e => setStoryForm({...storyForm, color: e.target.value})}
                  style={{ padding: '12px', borderRadius: '10px', border: '1px solid #eee' }}
                >
                  <option value="card-yellow">Yellow Theme</option>
                  <option value="card-pink">Pink Theme</option>
                  <option value="card-peach">Peach Theme</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '10px', textAlign: 'center', position: 'relative' }}>
                  <input type="file" accept="image/*" onChange={e => setStoryFile(e.target.files?.[0] || null)} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
                  {storyFile ? storyFile.name : (storyForm.image_url ? 'Change Photo' : 'Upload Card Photo')}
                </div>
                { (storyFile || storyForm.image_url) && (
                  <img 
                    src={storyFile ? URL.createObjectURL(storyFile) : storyForm.image_url} 
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px' }} 
                  />
                )}
                <button type="submit" className="btn-mint" style={{ marginTop: 'auto', padding: '15px', justifyContent: 'center' }}>
                  {isEditingStory ? 'Update Anniversary Story ✨' : 'Add New Anniversary Story ✨'}
                </button>
                {isEditingStory && (
                  <button type="button" onClick={() => { setIsEditingStory(false); setStoryForm({ id: '', title: '', letter: '', image_url: '', color: 'card-pink' }); }} style={{ padding: '10px', background: '#eee', border: 'none', borderRadius: '10px' }}>Cancel Edit</button>
                )}
              </div>
            </form>

            <div className="admin-story-list-grid">
              {stories.map(story => (
                <div key={story.id} className={`story-card ${story.color_class}`} style={{ position: 'relative', overflow: 'hidden', padding: '20px', borderRadius: '20px' }}>
                  <img src={story.image_url} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '15px', marginBottom: '15px' }} />
                  <h3>{story.year_title}</h3>
                  <p style={{ fontSize: '0.85rem' }}>{story.letter_content.substring(0, 100)}...</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button onClick={() => handleEditStory(story)} style={{ flex: 1, padding: '8px', border: '1px solid var(--deep-pink)', background: 'white', color: 'var(--deep-pink)', borderRadius: '10px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDeleteStory(story.id)} style={{ flex: 1, padding: '8px', border: 'none', background: '#ff4d4f', color: 'white', borderRadius: '10px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
