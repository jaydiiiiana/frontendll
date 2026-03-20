import { useState, useEffect } from 'react';
import { containsBadWords } from '../../lib/profanityFilter';

interface Comment {
  id: string;
  nickname: string;
  comment: string;
  created_at: string;
}

const Comments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNicknameInput, setShowNicknameInput] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchComments();
    const savedNickname = localStorage.getItem('anniversary_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setShowNicknameInput(false);
    }
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${apiUrl}/anniversary/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch comments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nickname.trim()) {
      setError('Please set a nickname first!');
      setShowNicknameInput(true);
      return;
    }

    if (!newComment.trim()) {
      setError('Comment cannot be empty!');
      return;
    }

    if (containsBadWords(nickname) || containsBadWords(newComment)) {
      setError('Your nickname or comment contains inappropriate words. Please be respectful!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/anniversary/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, comment: newComment }),
      });

      const data = await res.json();
      if (data.success) {
        setNewComment('');
        fetchComments();
        localStorage.setItem('anniversary_nickname', nickname);
      } else {
        setError(data.message || 'Failed to post comment');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="comments" className="section" style={{ backgroundColor: 'var(--bg-cream)', paddingTop: '40px' }}>
      <div className="container">
        <h2 className="section-title">Leave a Message</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Say something nice to us! ✨</p>

        <div className="comment-form-container" style={{ maxWidth: '600px', margin: '0 auto 50px', backgroundColor: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit}>
            {showNicknameInput ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', textAlign: 'left', marginBottom: '8px', fontWeight: '600', color: 'var(--text-brown)' }}>Who are you? (Nickname)</label>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname..."
                  style={{ width: '100%', padding: '12px 20px', borderRadius: '50px', border: '1px solid #eee', background: '#f9f9f9', fontSize: '1rem', outline: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => nickname.trim() && !containsBadWords(nickname) ? setShowNicknameInput(false) : setError(containsBadWords(nickname) ? 'Inappropriate nickname!' : 'Nickname is required!')}
                  style={{ marginTop: '15px', background: 'var(--soft-pink)', color: 'var(--deep-pink)', border: 'none', padding: '8px 20px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Save Nickname
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Posting as <strong>{nickname}</strong></span>
                  <button 
                    type="button" 
                    onClick={() => setShowNicknameInput(true)} 
                    style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change Nickname
                  </button>
                </div>
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a message..."
                  rows={4}
                  style={{ width: '100%', padding: '15px 20px', borderRadius: '20px', border: '1px solid #eee', background: '#f9f9f9', fontSize: '1rem', outline: 'none', resize: 'none' }}
                />
              </div>
            )}

            {error && <p style={{ color: '#ff4b2b', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</p>}

            {!showNicknameInput && (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-mint"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isSubmitting ? 'Sending...' : 'Post Message 💌'}
              </button>
            )}
          </form>
        </div>

        <div className="comments-list" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} style={{ backgroundColor: 'white', padding: '20px 30px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--deep-pink)' }}>{c.nickname}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ color: 'var(--text-brown)', lineHeight: '1.6' }}>{c.comment}</p>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No messages yet. Be the first to leave one!</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Comments;
