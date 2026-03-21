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
              // If it's a reply, add it to the replies of the parent. Otherwise, add to top-level.
              // For simplicity, we'll just add it and let the sorting handle it.
              // A more robust solution might re-fetch or intelligently insert.
              return [newC, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedC = payload.new as Comment;
            setComments((prev) => prev.map(c => c.id === updatedC.id ? updatedC : c));
          } else if (payload.eventType === 'DELETE') {
            const deletedC = payload.old as Comment;
            setComments((prev) => prev.filter(c => c.id !== deletedC.id));
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
    setError(null);

    if (!nickname.trim()) {
      setError('Please set a nickname first!');
      setShowNicknameInput(true);
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    if (containsBadWords(nickname) || containsBadWords(newComment)) {
      setError('Inappropriate words detected! Please be kind.');
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
      backgroundColor: isReply ? '#fffdfd' : 'white', 
      padding: '20px', 
      borderRadius: '20px', 
      marginBottom: '15px', 
      marginLeft: isReply ? '30px' : '0',
      boxShadow: isReply ? 'none' : '0 4px 15px rgba(0,0,0,0.03)',
      border: isReply ? '1px solid #ffe8ed' : 'none',
      position: 'relative',
      transition: 'all 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontWeight: '700', color: 'var(--deep-pink)' }}>{c.nickname}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
      </div>
      <p style={{ color: 'var(--text-brown)', lineHeight: '1.6', marginBottom: '15px' }}>{c.comment}</p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {/* Reaction Display */}
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

        {/* Reaction Bar */}
        <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
          {emojis.map(emoji => (
            <button 
              key={emoji} 
              onClick={() => handleReact(c.id, emoji)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '2px', transition: 'transform 0.2s' }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
          style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {replyingTo === c.id ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {/* Inline Reply Form */}
      {replyingTo === c.id && (
        <div style={{ marginTop: '15px', padding: '15px', background: '#fcfcfc', borderRadius: '15px', border: '1px solid #eee' }}>
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

      {!isReply && getReplies(c.id).map(reply => (
        <CommentItem key={reply.id} c={reply} isReply={true} />
      ))}
    </div>
  );

  return (
    <section id="comments" className="section" style={{ backgroundColor: 'var(--bg-cream)', paddingTop: '60px' }}>
      <div className="container">
        <h2 className="section-title">Wall of Love</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Leave a sweet message for us! ✨</p>

        {/* Main Comment Form */}
        {!showNicknameInput && !replyingTo && (
          <div style={{ maxWidth: '600px', margin: '0 auto 50px', backgroundColor: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ textAlign: 'left', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem' }}>Posting as <strong>{nickname}</strong></span>
              <button onClick={() => setShowNicknameInput(true)} style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', cursor: 'pointer', fontSize: '0.8rem' }}>Change Nickname</button>
            </div>
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What's on your mind? ❤️"
              style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', outline: 'none', fontSize: '1rem', minHeight: '100px', background: '#fafafa' }}
            />
            <button 
              onClick={(e) => handleSubmit(e)} 
              disabled={isSubmitting || !newComment.trim()}
              className="btn-mint" 
              style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }}
            >
              Post Message 💌
            </button>
          </div>
        )}

        {showNicknameInput && (
          <div style={{ maxWidth: '400px', margin: '0 auto 50px', background: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-brown)' }}>Who are you?</h3>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              placeholder="Enter nickname..." 
              style={{ width: '100%', padding: '12px 20px', borderRadius: '50px', border: '1px solid #eee', outline: 'none', marginBottom: '15px' }}
            />
            <button 
               onClick={() => {
                 if (nickname.trim() && !containsBadWords(nickname)) {
                   setShowNicknameInput(false);
                   localStorage.setItem('anniversary_nickname', nickname);
                 } else {
                   setError('Invalid nickname!');
                 }
               }} 
               className="btn-mint" 
               style={{ width: '100%', justifyContent: 'center' }}
            >
              Start Commenting ✨
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          </div>
        )}

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
