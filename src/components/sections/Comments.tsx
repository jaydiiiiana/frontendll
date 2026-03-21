import { useState, useEffect } from 'react';
import { containsBadWords } from '../../lib/profanityFilter';
import { supabase } from '../../lib/supabaseClient';

interface Comment {
  id: string;
  nickname: string;
  comment: string;
  created_at: string;
  parent_id?: string | null;
  reactions?: Record<string, string[]>;
}

const Comments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNicknameInput, setShowNicknameInput] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchComments();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('realtime comments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments' }, 
        (payload) => {
          console.log('⚡ Realtime update received!', payload);
          if (payload.eventType === 'INSERT') {
            const newC = payload.new as Comment;
            setComments((prev) => {
              if (prev.some(c => c.id === newC.id)) return prev;
              return [newC, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedC = payload.new as Comment;
            setComments((prev) => prev.map(c => c.id === updatedC.id ? updatedC : c));
          }
        }
      )
      .subscribe();

    const savedNickname = localStorage.getItem('anniversary_nickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setShowNicknameInput(false);
    }

    return () => {
      supabase.removeChannel(channel);
    };
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
        body: JSON.stringify({ 
          nickname, 
          comment: newComment,
          parent_id: replyingTo 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewComment('');
        setReplyingTo(null);
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

  const handleReact = async (commentId: string, emoji: string) => {
    if (!nickname.trim()) {
      setError('Please set a nickname first!');
      setShowNicknameInput(true);
      return;
    }

    try {
      await fetch(`${apiUrl}/anniversary/comments/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, emoji, nickname }),
      });
      // Real-time will handle the update
    } catch (e) {
      console.error('Failed to react');
    }
  };

  // Group comments: top-level and their replies
  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const emojis = ['❤️', '✨', '🥰', '🥂', '🎉'];

  const CommentItem = ({ c, isReply = false }: { c: Comment, isReply?: boolean }) => (
    <div key={c.id} style={{ 
      backgroundColor: isReply ? 'rgba(255,255,255,0.5)' : 'white', 
      padding: isReply ? '15px 20px' : '20px 30px', 
      borderRadius: '20px', 
      marginBottom: isReply ? '10px' : '20px', 
      marginLeft: isReply ? '40px' : '0',
      boxShadow: isReply ? 'none' : '0 5px 15px rgba(0,0,0,0.02)',
      border: isReply ? '1px solid var(--soft-pink)' : 'none',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: '700', color: 'var(--deep-pink)', fontSize: isReply ? '0.9rem' : '1rem' }}>{c.nickname}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
      </div>
      <p style={{ color: 'var(--text-brown)', lineHeight: '1.5', fontSize: isReply ? '0.9rem' : '1rem', marginBottom: '12px' }}>{c.comment}</p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {/* Reaction Display */}
        {c.reactions && Object.entries(c.reactions).map(([emoji, users]) => users.length > 0 && (
          <button 
            key={emoji}
            onClick={() => handleReact(c.id, emoji)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              border: users.includes(nickname) ? '1px solid var(--deep-pink)' : '1px solid #eee',
              background: users.includes(nickname) ? 'var(--soft-pink)' : '#f9f9f9',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span>{emoji}</span>
            <span style={{ fontWeight: '600', color: 'var(--text-brown)' }}>{users.length}</span>
          </button>
        ))}

        {/* Reaction Picker Overlay (Simple) */}
        {!isReply && (
          <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
            {emojis.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => handleReact(c.id, emoji)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '2px', transition: 'transform 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <button 
          onClick={() => {
            setReplyingTo(replyingTo === c.id ? null : c.id);
            if (!showNicknameInput) {
              const el = document.getElementById('comment-form');
              el?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            fontSize: '0.8rem', 
            cursor: 'pointer', 
            textDecoration: 'underline',
            marginLeft: isReply ? 'auto' : '10px'
          }}
        >
          {replyingTo === c.id ? 'Cancel Reply' : 'Reply'}
        </button>
      </div>

      {!isReply && getReplies(c.id).map(reply => (
        <CommentItem key={reply.id} c={reply} isReply={true} />
      ))}
    </div>
  );

  return (
    <section id="comments" className="section" style={{ backgroundColor: 'var(--bg-cream)', paddingTop: '40px' }}>
      <div className="container">
        <h2 className="section-title">Leave a Message</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Say something nice to us! ✨</p>

        <div id="comment-form" className="comment-form-container" style={{ maxWidth: '600px', margin: '0 auto 50px', backgroundColor: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
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
                  <span style={{ color: 'var(--text-muted)' }}>
                    {replyingTo ? (
                      <>Replying as <strong>{nickname}</strong></>
                    ) : (
                      <>Posting as <strong>{nickname}</strong></>
                    )}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowNicknameInput(true)} 
                    style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change Nickname
                  </button>
                </div>
                {replyingTo && (
                  <div style={{ marginBottom: '10px', padding: '8px 15px', background: 'var(--soft-pink)', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Replying to {comments.find(c => c.id === replyingTo)?.nickname}'s message</span>
                    <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                  </div>
                )}
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? "Write your reply..." : "Write a message..."}
                  rows={replyingTo ? 3 : 4}
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
                {isSubmitting ? 'Sending...' : (replyingTo ? 'Post Reply ✉️' : 'Post Message 💌')}
              </button>
            )}
          </form>
        </div>

        <div className="comments-list" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          {topLevelComments.length > 0 ? (
            topLevelComments.map((c) => (
              <CommentItem key={c.id} c={c} />
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
