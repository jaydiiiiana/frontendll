import React, { useState, useEffect } from 'react';

const MemoryGame: React.FC = () => {
    const icons = ['❤️', '💖', '🎁', '🌹', '💍', '✨', '🎈', '🍪'];
    const [cards, setCards] = useState<{ id: number; icon: string; isFlipped: boolean; isMatched: boolean }[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [showWin, setShowWin] = useState(false);

    const initializeGame = () => {
        const gameCards = [...icons, ...icons]
            .sort(() => Math.random() - 0.5)
            .map((icon, index) => ({
                id: index,
                icon,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(gameCards);
        setFlippedCards([]);
        setMoves(0);
        setShowWin(false);
    };

    useEffect(() => {
        initializeGame();
    }, []);

    const handleCardClick = (id: number) => {
        if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

        const newCards = [...cards];
        newCards[id].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(moves + 1);
            const [firstId, secondId] = newFlipped;
            if (newCards[firstId].icon === newCards[secondId].icon) {
                newCards[firstId].isMatched = true;
                newCards[secondId].isMatched = true;
                setCards(newCards);
                setFlippedCards([]);
                if (newCards.every(card => card.isMatched)) {
                    setShowWin(true);
                }
            } else {
                setTimeout(() => {
                    newCards[firstId].isFlipped = false;
                    newCards[secondId].isFlipped = false;
                    setCards(newCards);
                    setFlippedCards([]);
                }, 1000);
            }
        }
    };

    return (
        <div className="memory-game-container">
            <h2 className="section-title">Our Memory Match 🧩</h2>
            <p className="game-subtitle">Match all the pairs to reveal a secret!</p>
            
            <div className="game-stats">
              <span>Moves: {moves}</span>
              <button className="reset-btn" onClick={initializeGame}>Reset Game</button>
            </div>

            <div className="memory-grid">
                {cards.map(card => (
                    <div
                        key={card.id}
                        className={`memory-card ${card.isFlipped || card.isMatched ? 'flipped' : ''}`}
                        onClick={() => handleCardClick(card.id)}
                    >
                        <div className="card-inner">
                            <div className="card-front">?</div>
                            <div className="card-back">{card.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {showWin && (
                <div className="win-message animate-fade-in">
                    <h3>You're Amazing! ❤️</h3>
                    <p>Just like these pairs, we are the perfect match.</p>
                    <button className="gift-btn" onClick={initializeGame}>Play Again</button>
                </div>
            )}
        </div>
    );
};

export default MemoryGame;
