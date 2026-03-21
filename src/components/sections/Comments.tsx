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
    
    const channel = supabase
      .channel('realtime comments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newC = payload.new as Comment;
            setComments((prev) => {
              if (prev.some(c => c.id === newC.id)) return prev;
              return [newC, ...prev];
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
    if (!newComment.trim()) return;

    if (containsBadWords(nickname) || containsBadWords(newComment)) {
      setError('Please be kind! Inappropriate words detected.');
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
          parent_id: parentId 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewComment('');
        setReplyingTo(null);
      }
    } catch (e) {
      setError('Could not post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReact = async (commentId: string, emoji: string) => {
    if (!nickname.trim()) {
      setShowNicknameInput(true);
      return;
    }

    try {
      await fetch(`${apiUrl}/anniversary/comments/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, emoji, nickname }),
      });
    } catch (e) {
      console.error('Failed to react');
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
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
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
              cursor: 'pointer'
            }}
          >
            <span>{emoji} {users.length}</span>
          </button>
        ))}

        <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
          {emojis.map(emoji => (
            <button key={emoji} onClick={() => handleReact(c.id, emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>{emoji}</button>
          ))}
        </div>

        <button 
          onClick={() => {
            if (!nickname.trim()) {
              setShowNicknameInput(true);
              document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
            } else {
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
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a reply..."
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #eee', outline: 'none', fontSize: '0.9rem', minHeight: '60px' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  onClick={(e) => handleSubmit(e, c.id)} 
                  disabled={isSubmitting || !newComment.trim()}
                  className="btn-mint" 
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  Post Reply
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

        {showNicknameInput ? (
          <div style={{ maxWidth: '450px', margin: '0 auto 50px', background: 'white', padding: '40px', borderRadius: '35px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: '1px solid #fff' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✨</div>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-brown)', fontSize: '1.5rem' }}>One quick thing!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '25px' }}>What's your name? (Your nickname will be used for your messages and reactions!)</p>
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
              autoFocus
            />
            <button 
               onClick={() => {
                 if (nickname.trim() && !containsBadWords(nickname)) {
                   setShowNicknameInput(false);
                   localStorage.setItem('anniversary_nickname', nickname);
                 } else {
                   setError(nickname.trim() ? 'Please use a respectful name! ❤️' : 'Setting a nickname is required to start!');
                 }
               }} 
               className="btn-mint" 
               style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1.1rem' }}
            >
              Start Commenting ✨
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
                style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', outline: 'none', fontSize: '1rem', minHeight: '120px', background: '#fafafa', resize: 'none' }}
              />
              <button 
                onClick={(e) => handleSubmit(e)} 
                disabled={isSubmitting || !newComment.trim()}
                className="btn-mint" 
                style={{ width: '100%', marginTop: '20px', justifyContent: 'center', padding: '15px' }}
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
