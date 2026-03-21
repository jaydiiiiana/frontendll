import { useState, useEffect, useMemo } from 'react';
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

const isValidMessage = (text: string) => {
  if (!text) return false;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length >= 2;
};

interface CommentItemProps {
  c: Comment;
  isReply?: boolean;
  nickname: string;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyComments: Record<string, string>;
  setReplyComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSubmit: (e: React.FormEvent, parentId: string | null) => void;
  handleReact: (commentId: string, emoji: string) => void;
  isSubmitting: boolean;
  getReplies: (parentId: string) => Comment[];
  emojis: string[];
  setError: (msg: string | null) => void;
}

const CommentItem = ({ 
  c, isReply, nickname, replyingTo, setReplyingTo, 
  replyComments, setReplyComments, handleSubmit, handleReact, 
  isSubmitting, getReplies, emojis, setError 
}: CommentItemProps) => {
  const isTargetOfReply = replyingTo === c.id;
  const currentReplyText = replyComments[c.id] || '';

  return (
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
      <p style={{ 
          color: 'var(--text-brown)', 
          lineHeight: '1.6', 
          marginBottom: '12px',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}>
        {c.comment}
      </p>
      
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
            <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReact(c.id, emoji); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '5px' }}>{emoji}</button>
          ))}
        </div>

        <button 
          onClick={() => {
            if (!nickname.trim()) return;
            setReplyingTo(isTargetOfReply ? null : c.id);
          }}
          style={{ background: 'none', border: 'none', color: 'var(--deep-pink)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}
        >
          {isTargetOfReply ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {!isReply && (
        <div style={{ marginTop: '15px' }}>
          {getReplies(c.id).map(reply => (
            <CommentItem 
              key={reply.id} 
              c={reply} 
              isReply={true}
              nickname={nickname}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyComments={replyComments}
              setReplyComments={setReplyComments}
              handleSubmit={handleSubmit}
              handleReact={handleReact}
              isSubmitting={isSubmitting}
              getReplies={getReplies}
              emojis={emojis}
              setError={setError}
            />
          ))}
          
          {isTargetOfReply && (
            <div style={{ marginTop: '15px', padding: '20px', background: 'white', borderRadius: '25px', border: '1px solid #eee', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Replying as <strong>{nickname}</strong></span>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Cancel</button>
              </div>
              <textarea 
                value={currentReplyText}
                onChange={(e) => setReplyComments(prev => ({ ...prev, [c.id]: e.target.value }))}
                placeholder="Write your sweet reply here..."
                style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', outline: 'none', fontSize: '1rem', minHeight: '100px', background: '#fafafa', resize: 'vertical' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button 
                  onClick={(e) => handleSubmit(e, c.id)} 
                  disabled={isSubmitting || !isValidMessage(currentReplyText)}
                  className="btn-mint" 
                  style={{ padding: '10px 25px' }}
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
              {!isValidMessage(currentReplyText) && currentReplyText.trim().length > 0 && (
                <p style={{ color: 'var(--deep-pink)', fontSize: '0.75rem', marginTop: '8px', textAlign: 'right' }}>Please write at least two words! ❤️</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Comments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyComments, setReplyComments] = useState<Record<string, string>>({});
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
    
    const textToSubmit = parentId ? (replyComments[parentId] || '') : newComment;
    if (!isValidMessage(textToSubmit)) {
      setError('Please write at least two words! ❤️');
      return;
    }

    if (containsBadWords(nickname) || containsBadWords(textToSubmit)) {
      setError('Please be kind! Inappropriate words detected.');
      return;
    }

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
        body: JSON.stringify({ nickname, comment: textToSubmit, parent_id: parentId }),
      });

      const data = await res.json();
      if (data.success) {
        if (parentId) setReplyComments(prev => ({ ...prev, [parentId]: '' }));
        else setNewComment('');
        setReplyingTo(null);
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId));
        setError(data.error || 'Failed to post comment.');
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
    }
  };

  const topLevelComments = useMemo(() => 
    comments.filter(c => !c.parent_id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  , [comments]);

  const getReplies = (parentId: string) => 
    comments.filter(c => c.parent_id === parentId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const emojis = ['❤️', '✨', '🥰', '🥂', '🎉'];

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
              style={{ width: '100%', padding: '15px 25px', borderRadius: '50px', border: '1px solid #eee', outline: 'none', marginBottom: '20px', fontSize: '1rem', textAlign: 'center', background: '#fafafa' }}
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
          </div>
        ) : (
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
                style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee', outline: 'none', fontSize: '1rem', minHeight: '120px', background: '#fafafa', resize: 'vertical' }}
              />
              <button 
                onClick={(e) => handleSubmit(e)} 
                disabled={isSubmitting || !isValidMessage(newComment)}
                className="btn-mint" 
                style={{ width: '100%', marginTop: '20px', justifyContent: 'center', padding: '15px' }}
              >
                {isSubmitting ? 'Posting...' : 'Post Message 💌'}
              </button>
              {!isValidMessage(newComment) && newComment.trim().length > 0 && (
                <p style={{ color: 'var(--deep-pink)', fontSize: '0.8rem', marginTop: '10px' }}>Please write at least two words! ❤️</p>
              )}
            </div>
          )
        )}

        <div className="comments-list" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          {topLevelComments.map((c) => (
            <CommentItem 
              key={c.id} 
              c={c} 
              nickname={nickname}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyComments={replyComments}
              setReplyComments={setReplyComments}
              handleSubmit={handleSubmit}
              handleReact={handleReact}
              isSubmitting={isSubmitting}
              getReplies={getReplies}
              emojis={emojis}
              setError={setError}
            />
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
