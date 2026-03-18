import { useState } from 'react';

const Admin = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'diana152023@jaydi') { // Updated password
      setIsAuthenticated(true);
    } else {
      alert('Wrong password!');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('Uploading to storage...');

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      setStatus('Uploading and saving...');
      
      const response = await fetch(`${apiUrl}/anniversary/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setStatus('✅ Success! Photo added.');
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
          <input 
            type="password" 
            placeholder="Enter password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button type="submit" className="btn-mint" style={{ marginLeft: '10px' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '100px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Admin Panel</h1>
      <p style={{ marginBottom: '30px' }}>Add a new photo to the collection.</p>
      
      <div style={{ background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: '20px' }} />
        {file && (
          <div style={{ marginBottom: '20px' }}>
            <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', borderRadius: '15px' }} />
          </div>
        )}
        <button 
          onClick={handleUpload} 
          disabled={uploading || !file} 
          className="btn-mint"
          style={{ width: '100%', padding: '15px' }}
        >
          {uploading ? 'Processing...' : 'Upload Memory 📸'}
        </button>
        <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{status}</p>
        <button 
           onClick={() => window.location.href = '/'} 
           style={{ marginTop: '20px', background: 'transparent', border: 'none', color: '#ff85a1', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Back to Website
        </button>
      </div>
    </div>
  );
};

export default Admin;
