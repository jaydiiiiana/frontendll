import React, { useState, useEffect, useRef } from 'react';

interface Target {
  id: number;
  x: number;
  y: number;
  type: string;
  size: number;
  speed: number;
}

const HeartShooter: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState<Target[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextTargetId = useRef(0);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setGameWon(false);
  };

  useEffect(() => {
    if (!isPlaying) return;

    if (timeLeft <= 0) {
      if (score >= 15) setGameWon(true);
      setIsPlaying(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    const spawner = setInterval(() => {
      const newTarget: Target = {
        id: nextTargetId.current++,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        type: Math.random() > 0.2 ? '❤️' : '💖',
        size: Math.random() * 20 + 30,
        speed: Math.random() * 2 + 1,
      };
      setTargets(prev => [...prev, newTarget]);

      // Remove target after some time if not hit
      setTimeout(() => {
        setTargets(prev => prev.filter(t => t.id !== newTarget.id));
      }, 2000);
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [isPlaying, timeLeft, score]);

  const handleShot = (id: number) => {
    setScore(prev => prev + 1);
    setTargets(prev => prev.filter(t => t.id !== id));
    
    // Create a little "pop" effect if needed, but for now just score
  };

  return (
    <div className="fps-game-container">
      <h2 className="section-title">Love Accuracy Challenge 🏹</h2>
      <p className="game-subtitle">Hit 15 hearts to capture my love!</p>

      {!isPlaying && !gameWon && (
        <div className="game-screen start-screen">
          <button className="gift-btn" onClick={startGame}>Start Challenge</button>
        </div>
      )}

      {isPlaying && (
        <div className="game-screen game-board" ref={gameAreaRef}>
          <div className="game-hud">
            <span>Hearts Captured: {score}</span>
            <span>Time: {timeLeft}s</span>
          </div>
          
          <div className="crosshair"></div>

          {targets.map(target => (
            <div
              key={target.id}
              className="target-heart"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                fontSize: `${target.size}px`,
              }}
              onClick={() => handleShot(target.id)}
            >
              {target.type}
            </div>
          ))}
        </div>
      )}

      {gameWon && (
        <div className="game-screen win-screen animate-fade-in">
          <h3>Excellent Shot! 🎯</h3>
          <p className="handwritten">"Your love always hits the mark. Happy Anniversary!"</p>
          <button className="gift-btn" onClick={startGame}>Try Again</button>
        </div>
      )}

      {!isPlaying && score > 0 && !gameWon && (
        <div className="game-screen lose-screen">
            <h3>Keep Trying!</h3>
            <p>You caught {score} hearts. Need 15!</p>
            <button className="gift-btn" onClick={startGame}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default HeartShooter;
