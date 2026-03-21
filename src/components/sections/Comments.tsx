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
  const [replyComment, setReplyComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNicknameInput, setShowNicknameInput] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchComments();
    
    const channel = supabase
      .channel('realtime comments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newC = payload.new as Comment;
            setComments((prev) => {
              // Check if we already have this exact ID
              if (prev.some(c => c.id === newC.id)) return prev;
              
              // NEW: Remove any matching optimistic 'temp-' comment
              // We match by nickname and content (and it must start with 'temp-')
              const filtered = prev.filter(c => 
                !(c.id.startsWith('temp-') && 
                  c.nickname === newC.nickname && 
                  c.comment === newC.comment)
              );
              
              return [newC, ...filtered];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedC = payload.new as Comment;
            setComments((prev) => prev.map(c => c.id === updatedC.id ? updatedC : c));
          } else if (payload.eventType === 'DELETE') {
            setComments((prev) => prev.filter(c => c.id !== payload.old.id));
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

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setShowNicknameInput(true);
      return;
    }
    
    const textToSubmit = parentId ? replyComment : newComment;
    const words = textToSubmit.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length < 2) {
      setError('Please write at least two words! ❤️');
      return;
    }

    if (containsBadWords(nickname) || containsBadWords(textToSubmit)) {
      setError('Please be kind! Inappropriate words detected.');
      return;
    }

    // Optimistic Update: Create a temporary comment object
    const tempId = 'temp-' + Date.now();
    const tempComment: Comment = {
      id: tempId,
      nickname,
      comment: textToSubmit,
      created_at: new Date().toISOString(),
      parent_id: parentId,
      reactions: {}
    };
    
    setComments(prev => [tempComment, ...prev]);

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/anniversary/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nickname, 
          comment: textToSubmit,
          parent_id: parentId 
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (parentId) setReplyComment('');
        else setNewComment('');
        setReplyingTo(null);
      } else {
        // Rollback on failure
        setComments(prev => prev.filter(c => c.id !== tempId));
        setError('Failed to post comment.');
      }
    } catch (e) {
      setError('Could not post comment.');
      setComments(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReact = async (commentId: string, emoji: string) => {
    if (!nickname.trim()) {
      setShowNicknameInput(true);
      return;
    }

    // Optimistic Update locally
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const reactions = { ...(c.reactions || {}) };
      const users = reactions[emoji] ? [...reactions[emoji]] : [];
      const idx = users.indexOf(nickname);
      if (idx > -1) users.splice(idx, 1);
      else users.push(nickname);
      return { ...c, reactions: { ...reactions, [emoji]: users } };
    }));

    try {
      await fetch(`${apiUrl}/anniversary/comments/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, emoji, nickname }),
      });
    } catch (e) {
      console.error('Failed to react');
      // On failure, real-time will eventually sync it back (or refresh)
    }
  };

  const topLevelComments = comments.filter(c => !c.parent_id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const emojis = ['❤️', '✨', '🥰', '🥂', '🎉'];

  const CommentItem = ({ c, isReply = false }: { c: Comment, isReply?: boolean }) => (
    <div key={c.id} style={{ 
      backgroundColor: isReply ? '#fffdfd' : 'white', 
      padding: '20px', 
      borderRadius: '20px', 
      marginBottom: '15px', 
      marginLeft: isReply ? '40px' : '0',
      boxShadow: isReply ? 'none' : '0 4px 15px rgba(0,0,0,0.03)',
      border: isReply ? '1px solid #ffe8ed' : 'none',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: '700', color: 'var(--deep-pink)' }}>{c.nickname}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
      </div>
      <p style={{ color: 'var(--text-brown)', lineHeight: '1.6', marginBottom: '12px' }}>{c.comment}</p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {/* Reactions Display */}
        {c.reactions && Object.entries(c.reactions).map(([emoji, users]) => users.length > 0 && (
          <button 
            key={emoji}
            onClick={() => handleReact(c.id, emoji)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              border: users.includes(nickname) ? '1px solid var(--deep-pink)' : '1px solid #eee',
              background: users.includes(nickname) ? 'var(--soft-pink)' : '#f9f9f9',
              fontSize: '0.8rem',
              cursor: 'pointer',
              zIndex: 5
            }}
          >
            <span>{emoji} {users.length}</span>
          </button>
        ))}

        {/* Reaction Picker */}
        <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto', zIndex: 10 }}>
          {emojis.map(emoji => (
            <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReact(c.id, emoji); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '5px' }}>{emoji}</button>
          ))}
        </div>

        <button 
          onClick={() => {
            if (!nickname.trim()) {
              setShowNicknameInput(true);
            } else {
              setReplyComment('');
              setReplyingTo(replyingTo === c.id ? null : c.id);
            }
          }}
          style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}
        >
          {replyingTo === c.id ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {!isReply && (
        <div style={{ marginTop: '15px' }}>
          {getReplies(c.id).map(reply => (
            <CommentItem key={reply.id} c={reply} isReply={true} />
          ))}
          
          {replyingTo === c.id && (
            <div style={{ marginLeft: '40px', marginTop: '10px', padding: '15px', background: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
              <textarea 
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                placeholder="Write a reply..."
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', fontSize: '0.9rem', minHeight: '60px', direction: 'ltr', textAlign: 'left' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  onClick={(e) => handleSubmit(e, c.id)} 
                  disabled={isSubmitting || !replyComment.trim()}
                  className="btn-mint" 
                  style={{ padding: '8px 20px', fontSize: '0.85rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting && replyingTo === c.id ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section id="comments" className="section" style={{ backgroundColor: 'var(--bg-cream)', paddingTop: '60px' }}>
      <div className="container">
        <h2 className="section-title">Wall of Love</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Leave a sweet message for us! ❤️</p>
        
        {error && (
          <div style={{ maxWidth: '600px', margin: '0 auto 20px', padding: '15px', borderRadius: '15px', background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffccc7', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {showNicknameInput ? (
          <div style={{ maxWidth: '450px', margin: '0 auto 50px', background: 'white', padding: '40px', borderRadius: '35px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: '1px solid #fff' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✨</div>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-brown)', fontSize: '1.5rem' }}>One quick thing!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '25px' }}>What's your name?</p>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              placeholder="Your cute nickname..." 
              style={{ 
                width: '100%', 
                padding: '15px 25px', 
                borderRadius: '50px', 
                border: '1px solid #eee', 
                outline: 'none', 
                marginBottom: '20px',
                fontSize: '1rem',
                textAlign: 'center',
                background: '#fafafa'
              }}
            />
            <button 
               onClick={() => {
                 if (nickname.trim() && !containsBadWords(nickname)) {
                   setShowNicknameInput(false);
                   localStorage.setItem('anniversary_nickname', nickname);
                 } else {
                   setError(nickname.trim() ? 'Please use a respectful name! ❤️' : 'Nickname is required!');
                 }
               }} 
               className="btn-mint" 
               style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1.1rem' }}
            >
              Start ✨
            </button>
            {error && <p style={{ color: '#ff4d4f', marginTop: '15px', fontSize: '0.9rem', fontWeight: 'bold' }}>{error}</p>}
          </div>
        ) : (
          /* Main Comment Form */
          !replyingTo && (
            <div style={{ maxWidth: '600px', margin: '0 auto 50px', backgroundColor: 'white', padding: '30px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <div style={{ textAlign: 'left', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Posting as <strong>{nickname}</strong></span>
                <button onClick={() => setShowNicknameInput(true)} style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>Change Nickname</button>
              </div>
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your sweet message here..."
                style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', outline: 'none', fontSize: '1rem', minHeight: '120px', background: '#fafafa', resize: 'none', direction: 'ltr', textAlign: 'left' }}
              />
              <button 
                onClick={(e) => handleSubmit(e)} 
                disabled={isSubmitting || !newComment.trim()}
                className="btn-mint" 
                style={{ width: '100%', marginTop: '20px', justifyContent: 'center', padding: '15px', cursor: 'pointer' }}
              >
                {isSubmitting ? 'Posting...' : 'Post Message 💌'}
              </button>
              {error && <p style={{ color: 'red', marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>}
            </div>
          )
        )}

        <div className="comments-list" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          {topLevelComments.map((c) => (
            <CommentItem key={c.id} c={c} />
          ))}
          {topLevelComments.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No messages yet. Be the first to share the love! ✨</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Comments;
