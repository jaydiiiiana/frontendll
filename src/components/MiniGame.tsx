import React, { useState, useEffect, useRef } from 'react';

const MiniGame: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameUnlocked, setGameUnlocked] = useState(false);
  const [items, setItems] = useState<{ id: number; left: number; type: string }[]>([]);
  const timeoutId = useRef<any>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [basketPos, setBasketPos] = useState(50);

  const startNewGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setItems([]);
  };

  useEffect(() => {
    if (!isPlaying) return;

    if (timeLeft <= 0) {
      if (score >= 20) setGameUnlocked(true);
      setIsPlaying(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score]);

  useEffect(() => {
    if (!isPlaying) return;

    const spawnItem = () => {
      const id = Date.now();
      const left = Math.random() * 90;
      const type = Math.random() > 0.2 ? '❤️' : '✨';
      setItems(prev => [...prev, { id, left, type }]);

      const delay = Math.max(400, 1000 - score * 20);
      timeoutId.current = setTimeout(spawnItem, delay);
    };

    spawnItem();
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [isPlaying, score]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setBasketPos(Math.min(Math.max(x, 5), 95));
    }
  };

  const catchItem = (id: number) => {
    setScore(prev => prev + 1);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="mini-game-container">
      <h2 className="section-title">Catch My Heart 💖</h2>
      {!isPlaying && !gameUnlocked && (
        <div className="game-start">
          <p>Catch 20 hearts to unlock our special message!</p>
          <button className="gift-btn" onClick={startNewGame}>Start Game</button>
        </div>
      )}

      {isPlaying && (
        <div className="game-area" ref={gameAreaRef} onMouseMove={handleMouseMove}>
          <div className="game-stats">
            <span>Score: {score}</span>
            <span>Time: {timeLeft}s</span>
          </div>
          
          {items.map(item => (
            <div
              key={item.id}
              className="falling-item"
              style={{ left: `${item.left}%`, animationDuration: '3s' }}
              onMouseEnter={() => catchItem(item.id)}
            >
              {item.type}
            </div>
          ))}

          <div className="basket" style={{ left: `${basketPos}%` }}>🧺</div>
        </div>
      )}

      {gameUnlocked && !isPlaying && (
        <div className="game-won animate-fade-in">
          <h3>You've won! 🏆</h3>
          <p className="handwritten">"You've been catching my heart for 3 years, and I hope you never stop."</p>
          <button className="gift-btn" onClick={() => { setGameUnlocked(false); setScore(0); }}>Play Again</button>
        </div>
      )}

      {!isPlaying && score > 0 && score < 20 && (
        <div className="game-over">
          <h3>Game Over!</h3>
          <p>Score: {score}. Try catching 20!</p>
          <button className="gift-btn" onClick={startNewGame}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default MiniGame;
