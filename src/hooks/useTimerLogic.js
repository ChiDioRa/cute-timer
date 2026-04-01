import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoice } from './useVoice'; 
import { useTaskActions } from './useTaskActions';
// 1. ПЕРЕВІР ЦЕЙ ІМПОРТ (він обов'язковий для роботи "Назад")
import { fetchTaskSteps, updateTaskProgress } from '../services/notionService';
import { getLevelProgress, getFinishTime, GAME_CONFIG } from '../utils/logicHelpers';

export function useTimerLogic() {
  // --- СТАТИЧНА ЧЕРГА ХУКІВ (13 useState) ---
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
  const [stepsCache, setStepsCache] = useState(() => JSON.parse(localStorage.getItem('timer_steps_cache') || '{}'));

  const wakeLockRef = useRef(null); 
  const pendingCompletions = useRef(new Map());

  const { speak } = useVoice(); 
  const addXp = useCallback((amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      localStorage.setItem('timer_user_xp', newXp.toString());
      return newXp;
    });
  }, []);

  const actions = useTaskActions({
    tasks, setTasks, activeSteps, setActiveSteps, currentStepIndex, setCurrentStepIndex,
    setSeconds, setIsRunning, setIsSyncing, newTaskText, setNewTaskText, addXp, speak, 
    seconds, activeTaskId
  });

  // --- ЕФЕКТИ АВТОЗБЕРЕЖЕННЯ ---
  useEffect(() => {
    localStorage.setItem('timer_tasks', JSON.stringify(tasks));
    localStorage.setItem('timer_active_steps', JSON.stringify(activeSteps));
    localStorage.setItem('timer_steps_cache', JSON.stringify(stepsCache));
    localStorage.setItem('timer_seconds', seconds.toString());
    localStorage.setItem('timer_step_index', currentStepIndex.toString());
    if (activeTaskId) localStorage.setItem('timer_active_id', activeTaskId);
    else localStorage.removeItem('timer_active_id');
  }, [tasks, activeSteps, stepsCache, seconds, currentStepIndex, activeTaskId]);

  // Секундомір
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
        addXp(GAME_CONFIG.FOCUS_XP_PER_SEC);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, addXp]);

  // --- ЛОГІКА НАВІГАЦІЇ ✨ ---

  /** 🚪 РОЗУМНИЙ ВИХІД: Зберегти в хмару та згорнути */
  const resetToMain = async () => {
    if (activeTaskId) {
      try {
        // Рятуємо прогрес перед виходом
        await updateTaskProgress(activeTaskId, currentStepIndex, seconds);
        console.log("💾 Прогрес автоматично збережено");
      } catch (e) {
        console.error("Помилка автозбереження:", e);
      }
    }
    // Просто ховаємо задачу, але НЕ видаляємо її з пам'яті (seconds залишаються)
    setActiveTaskId(null);
    setIsRunning(false);
  };

  /** 🔄 ПОВНЕ СКИНУТИ: Для іконки Reset */
  const handleResetTimer = () => {
    if (window.confirm("Скинути час цього кроку?")) {
      setSeconds(0);
      setIsRunning(false);
    }
  };

  const handleTaskClick = async (id) => {
    setActiveTaskId(id);
    const targetTask = tasks.find(t => t.id === id);
    
    if (stepsCache[id]) {
      setActiveSteps(stepsCache[id]);
      setCurrentStepIndex(targetTask?.savedStep || 0);
      setSeconds(targetTask?.savedSeconds || 0);
      return;
    }

    setIsSyncing(true);
    try {
      const steps = await fetchTaskSteps(id); 
      if (steps?.length > 0) {
        setStepsCache(prev => ({ ...prev, [id]: steps }));
        setActiveSteps(steps);
        setCurrentStepIndex(targetTask?.savedStep || 0);
        setSeconds(targetTask?.savedSeconds || 0);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const { level, xpInLevel } = getLevelProgress(xp);
  const finishTime = getFinishTime(activeSteps, currentStepIndex);

  return {
    ...actions,
    xp, level, xpInLevel, energy, setEnergy,
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, tasks, activeSteps, currentStepIndex,
    isSyncing, isGenerating, newTaskText, setNewTaskText,
    handleTaskClick, resetToMain, handleResetTimer, finishTime, speak,
    remainingStepsCount: activeSteps.length > 0 ? activeSteps.length - (currentStepIndex + 1) : 0
  };
}