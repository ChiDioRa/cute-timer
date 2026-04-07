import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getLevelProgress, GAME_CONFIG } from '../utils/logicHelpers';

const UserContext = createContext();

export function UserProvider({ children }) {
  // Переносимо стани XP та Енергії сюди
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('timer_user_xp') || '0'));
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('timer_user_energy') || '100'));
  
  // Переносимо taskTotals сюди (це тепер частина статистики користувача)
  const [taskTotals, setTaskTotals] = useState(() => 
    JSON.parse(localStorage.getItem('timer_task_totals') || '{}')
  );

  const addXp = useCallback((amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      localStorage.setItem('timer_user_xp', newXp.toString());
      return newXp;
    });
  }, []);

  // Автозбереження статистики
  useEffect(() => {
    localStorage.setItem('timer_task_totals', JSON.stringify(taskTotals));
  }, [taskTotals]);

  const { level, xpInLevel } = getLevelProgress(xp);

  const value = {
    xp, level, xpInLevel, energy, setEnergy, addXp, 
    taskTotals, setTaskTotals
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Кастомний хук для зручного доступу
export const useUser = () => useContext(UserContext);