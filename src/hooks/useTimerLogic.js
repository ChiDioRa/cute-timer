import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'; // Додано useMemo в імпорт
import { useVoice } from './useVoice'; 
import { useTaskActions } from './useTaskActions';
import { fetchTaskSteps, updateTaskProgress } from '../services/notionService';
import { getLevelProgress, getFinishTime, GAME_CONFIG } from '../utils/logicHelpers';

export function useTimerLogic() {
  // --- 1. УСІ СТАНИ (Hooks) ---
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('timer_user_xp') || '0'));
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('timer_user_energy') || '100'));
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('timer_tasks') || '[]'));
  const [activeTaskId, setActiveTaskId] = useState(() => localStorage.getItem('timer_active_id') || null);
  const [activeSteps, setActiveSteps] = useState(() => JSON.parse(localStorage.getItem('timer_active_steps') || '[]'));
  const [currentStepIndex, setCurrentStepIndex] = useState(() => parseInt(localStorage.getItem('timer_step_index') || '0'));
  const [newTaskText, setNewTaskText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem('timer_seconds') || '0'));
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stepsCache, setStepsCache] = useState(() => JSON.parse(localStorage.getItem('timer_steps_cache') || '{}'));
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  // Режими відображення списку
  const [filterMode, setFilterMode] = useState('all'); 
  const [sortMode, setSortMode] = useState('newest');

  const wakeLockRef = useRef(null); 
  const { speak } = useVoice(); 
  // Зберігає стан задачі на момент її відкриття ✨
const initialTaskState = useRef({ step: 0, seconds: 0 });

  // --- 2. ОБРОБКА СПИСКУ ЗАДАЧ (Фільтр + Сортування) ✨ ---
  // Ми винесли це з функцій на верхній рівень
const processedTasks = useMemo(() => {
  let result = [...tasks];

  if (sortMode === 'shortest') {
    // ⚡ Режим "Швидкі": за часом (0 хв — у кінець)
    result.sort((a, b) => {
      const timeA = a.totalTime || 999;
      const timeB = b.totalTime || 999;
      return timeA - timeB;
    });
  } else {
    // 🆕 Режим "Нові": за датою створення (якщо вона є)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return result;
}, [tasks, sortMode]);

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

  // --- 3. ЕФЕКТИ АВТОЗБЕРЕЖЕННЯ ---
  useEffect(() => {
    localStorage.setItem('timer_tasks', JSON.stringify(tasks));
    localStorage.setItem('timer_active_steps', JSON.stringify(activeSteps));
    localStorage.setItem('timer_steps_cache', JSON.stringify(stepsCache));
    localStorage.setItem('timer_seconds', seconds.toString());
    localStorage.setItem('timer_step_index', currentStepIndex.toString());
    if (activeTaskId) localStorage.setItem('timer_active_id', activeTaskId);
    else localStorage.removeItem('timer_active_id');
  }, [tasks, activeSteps, stepsCache, seconds, currentStepIndex, activeTaskId]);

useEffect(() => {
  if (activeTaskId) {
    setIsTimerOpen(true);
  }
}, [activeTaskId]);

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

  const handleResetTimer = () => {
    if (window.confirm("Скинути час цього кроку?")) {
      setSeconds(0);
      setIsRunning(false);
    }
  };

const handleTaskClick = async (id) => {
    setIsTimerOpen(true);
    if (activeTaskId === id) return;

    setActiveTaskId(id);
    const targetTask = tasks.find((t) => t.id === id);

    if (stepsCache[id]) {
      setActiveSteps(stepsCache[id]);
      const savedStep = targetTask?.savedStep || 0;
      const savedSeconds = targetTask?.savedSeconds || 0;
      
      setCurrentStepIndex(savedStep);
      setSeconds(savedSeconds);
      
      // ✨ ЗАПАМ'ЯТОВУЄМО ПОЧАТКОВИЙ СТАН ✨
      initialTaskState.current = { step: savedStep, seconds: savedSeconds };
      return;
    }

    setIsSyncing(true);
    try {
      const steps = await fetchTaskSteps(id);
      if (steps?.length > 0) {
        setStepsCache((prev) => ({ ...prev, [id]: steps }));
        setActiveSteps(steps);
        
        const savedStep = targetTask?.savedStep || 0;
        const savedSeconds = targetTask?.savedSeconds || 0;
        
        setCurrentStepIndex(savedStep);
        setSeconds(savedSeconds);

        // ✨ ЗАПАМ'ЯТОВУЄМО ПОЧАТКОВИЙ СТАН (при завантаженні з Notion) ✨
        initialTaskState.current = { step: savedStep, seconds: savedSeconds };
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Оновлюємо функцію виходу до списку
const resetToMain = () => {
    // 1. Миттєво ховаємо таймер
    setIsTimerOpen(false);

    if (activeTaskId) {
      // 2. ПЕРЕВІРЯЄМО ЧИ БУЛИ ЗМІНИ ✨
      const hasChanged = 
        currentStepIndex !== initialTaskState.current.step || 
        seconds !== initialTaskState.current.seconds;

      if (hasChanged) {
        // Якщо зміни були - відправляємо в Notion
        updateTaskProgress(activeTaskId, currentStepIndex, seconds)
          .then(() => console.log("💾 Збережено: прогрес змінився"))
          .catch((e) => console.error("Помилка збереження:", e));
      } else {
        // Якщо змін не було - просто ігноруємо
        console.log("🙈 Змін не було, запит до Notion скасовано");
      }
    }
  };

  const { level, xpInLevel } = getLevelProgress(xp);
  const finishTime = getFinishTime(activeSteps, currentStepIndex);

  // --- 5. ПОВЕРНЕННЯ ---
  return {
    ...actions,
    xp, level, xpInLevel, energy, setEnergy,
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, 
    tasks: processedTasks, // ТЕПЕР ПОВЕРТАЄМО ОБРОБЛЕНИЙ СПИСОК ✨
    activeSteps, currentStepIndex,
    isSyncing, isGenerating, newTaskText, setNewTaskText,
    handleTaskClick, resetToMain, handleResetTimer, finishTime, speak,
    filterMode, setFilterMode, // Для кнопки фільтра
    sortMode, setSortMode,     // Для кнопки сортування
      isTimerOpen, setIsTimerOpen,
    remainingStepsCount: activeSteps.length > 0 ? activeSteps.length - (currentStepIndex + 1) : 0
  };
}