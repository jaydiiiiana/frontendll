import { useState, useEffect } from 'react';

export interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export const useCountdown = (celebrationDate: Date, onAnniversary?: () => void) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  const [currentCelebrationDate, setCurrentCelebrationDate] = useState(celebrationDate);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const updateCounter = () => {
      const now = new Date();
      const difference = currentCelebrationDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        const isBigDay = now.getDate() === currentCelebrationDate.getDate() && now.getMonth() === currentCelebrationDate.getMonth();
        
        if (isBigDay) {
          setIsFinished(true);
          onAnniversary?.();
        } else {
          setIsFinished(false);
          const nextYear = new Date(currentCelebrationDate);
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          setCurrentCelebrationDate(nextYear);
        }
        return;
      }

      setIsFinished(false);

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days: d.toString().padStart(2, '0'),
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0')
      });
    };

    const timer = setInterval(updateCounter, 1000);
    updateCounter();
    return () => clearInterval(timer);
  }, [currentCelebrationDate, onAnniversary]);

  return { timeLeft, celebrationDate: currentCelebrationDate, isFinished };
};
