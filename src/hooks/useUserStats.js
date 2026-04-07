import { useState, useCallback } from 'react';
import { getLevelProgress } from '../utils/logicHelpers';

// Важливо: обов'язково має бути "export function"
export function useUserStats() {
  // 1. Стан досвіду (XP)
  const [xp, setXp] = useState(() => 
    parseInt(localStorage.getItem('timer_user_xp') || '0')
  );

  // 2. Стан енергії
  const [energy, setEnergy] = useState(() => 
    parseInt(localStorage.getItem('timer_user_energy') || '100')
  );

  // 3. Функція додавання досвіду
  const addXp = useCallback((amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      localStorage.setItem('timer_user_xp', newXp.toString());
      return newXp;
    });
  }, []);

  // 4. Розрахунок рівня на основі XP
  const { level, xpInLevel } = getLevelProgress(xp);

  return { 
    xp, 
    level, 
    xpInLevel, 
    energy, 
    setEnergy, 
    addXp 
  };
}