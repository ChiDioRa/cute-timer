import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoice } from './useVoice'; 
import { useTaskActions } from './useTaskActions';
import { fetchTaskSteps } from '../services/notionService';
import { 
  getLevelProgress, 
  getFinishTime, 
  GAME_CONFIG 
} from '../utils/logicHelpers';

export function useTimerLogic() {
  // --- 1. СТАТИЧНА ЧЕРГА ХУКІВ (1-12 useState) ---
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('timer_user_xp') || '0'));
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('timer_user_energy') || '100'));
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('timer_tasks') || '[]'));
  const [taskTimes, setTaskTimes] = useState(() => JSON.parse(localStorage.getItem('timer_task_times') || '{}'));
  const [activeTaskId, setActiveTaskId] = useState(() => localStorage.getItem('timer_active_id') || null);
  const [activeSteps, setActiveSteps] = useState(() => JSON.parse(localStorage.getItem('timer_active_steps') || '[]'));
  const [currentStepIndex, setCurrentStepIndex] = useState(() => parseInt(localStorage.getItem('timer_step_index') || '0'));
  const [newTaskText, setNewTaskText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem('timer_seconds') || '0'));
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- 2. ПОСИЛАННЯ (13-14 useRef) ---
  const wakeLockRef = useRef(null); 
  const pendingCompletions = useRef(new Map());

  // --- 3. ПІДКЛЮЧЕННЯ ЛОГІКИ ТА ГОЛОСУ ---
  const { speak } = useVoice(); 
  const addXp = useCallback((amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      localStorage.setItem('timer_user_xp', newXp.toString());
      return newXp;
    });
  }, []);

  // Підключаємо дії (Notion, кроки)
  const actions = useTaskActions({
    tasks, setTasks, activeSteps, setActiveSteps, currentStepIndex, setCurrentStepIndex,
    setSeconds, setIsRunning, setIsSyncing, newTaskText, setNewTaskText, addXp, speak, seconds, activeTaskId
  });

  // --- 4. ЕФЕКТИ (Автозбереження) ---
  useEffect(() => {
    localStorage.setItem('timer_tasks', JSON.stringify(tasks));
    localStorage.setItem('timer_active_steps', JSON.stringify(activeSteps));
    localStorage.setItem('timer_step_index', currentStepIndex.toString());
    localStorage.setItem('timer_seconds', seconds.toString());
    if (activeTaskId) localStorage.setItem('timer_active_id', activeTaskId);
    else localStorage.removeItem('timer_active_id');
  }, [tasks, activeSteps, currentStepIndex, seconds, activeTaskId]);

  // --- 5. ЛОГІКА СЕКУНДОМІРА (Йде вгору) ---
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          addXp(GAME_CONFIG.FOCUS_XP_PER_SEC); // +1 XP щосекунди
          
          if (next > 0 && next % 300 === 0) {
            speak(`Ти у фокусі вже ${next / 60} хвилин.`);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, addXp, speak]);

  // --- 6. ВИПРАВЛЕНЕ ПЕРЕМИКАННЯ ЗАДАЧІ ✨ ---
  const handleTaskClick = async (id) => {
    // Спочатку миттєво ставимо ID, щоб UI перемкнувся на екран таймера
    setActiveTaskId(id); 
    setIsSyncing(true); // Показуємо лоадер на кнопках, поки вантажаться кроки
    
    try {
      const steps = await fetchTaskSteps(id); 
      if (steps?.length > 0) {
        setActiveSteps(steps);
        setCurrentStepIndex(0);
        setSeconds(0);
        setIsRunning(false); 
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToMain = () => {
    setActiveTaskId(null);
    setActiveSteps([]);
    setCurrentStepIndex(0);
    setIsRunning(false);
    setSeconds(0);
  };

  // --- 7. ПІДРАХУНКИ ДЛЯ UI (Через хелпери) ---
  const { level, xpInLevel } = getLevelProgress(xp);
  const finishTime = getFinishTime(activeSteps, currentStepIndex);

  return {
    // Стан
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, tasks, activeSteps, currentStepIndex,
    isSyncing, taskTimes, xp, level, xpInLevel, energy, setEnergy,
    newTaskText, setNewTaskText, isGenerating,
    
    // Функції
    ...actions, // handleCompleteStep, handleAddTask, syncWithNotion тощо
    handleTaskClick, 
    resetToMain,
    speak,
    finishTime,
    remainingStepsCount: activeSteps.length > 0 ? activeSteps.length - (currentStepIndex + 1) : 0
  };
}