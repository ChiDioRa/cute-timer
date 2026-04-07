import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'; 
import { useVoice } from './useVoice'; 
import { useTaskActions } from './useTaskActions';
import { fetchTaskSteps, updateTaskProgress, updateTaskStatusInNotion, updateTaskTypeInNotion, updateRoutineInNotion} from '../services/notionService';
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

  // ✨ Стан для накопичення загального часу кожної задачі
  const [taskTotals, setTaskTotals] = useState(() => 
    JSON.parse(localStorage.getItem('timer_task_totals') || '{}')
  );

  const wakeLockRef = useRef(null); 
  const { speak } = useVoice(); 

  const isRoutineDoneForToday = (lastDoneDate) => {
  if (!lastDoneDate) return false;

  const now = new Date();
  const lastDone = new Date(lastDoneDate);

  // Створюємо точку останнього "скидання" (сьогодні о 05:00)
  const resetPoint = new Date();
  resetPoint.setHours(5, 0, 0, 0);

  // Якщо зараз ще НЕМАЄ 5-ї ранку, то день почався вчора о 5-й
  if (now.getHours() < 5) {
    resetPoint.setDate(resetPoint.getDate() - 1);
  }

  // Якщо час виконання пізніший за останню 5-ту ранку — задача свіжа!
  return lastDone > resetPoint;
};
  
  // Зберігає стан задачі на момент її відкриття
  const initialTaskState = useRef({ step: 0, seconds: 0 });

  // --- 2. ОБРОБКА СПИСКУ ЗАДАЧ (Фільтр + Сортування) ---
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    if (sortMode === 'shortest') {
      result.sort((a, b) => {
        const timeA = a.totalTime || 999;
        const timeB = b.totalTime || 999;
        return timeA - timeB;
      });
    } else {
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
    seconds, activeTaskId, taskTotals
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
    
    // Збереження загального часу
    localStorage.setItem('timer_task_totals', JSON.stringify(taskTotals));
  }, [tasks, activeSteps, stepsCache, seconds, currentStepIndex, activeTaskId, taskTotals]);

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
        
        // Накопичуємо час для активної задачі
        if (activeTaskId) {
          setTaskTotals(prev => ({
            ...prev,
            [activeTaskId]: (prev[activeTaskId] || 0) + 1
          }));
        }

        addXp(GAME_CONFIG.FOCUS_XP_PER_SEC);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTaskId, addXp]);

  // --- 4. ДОДАТКОВІ ФУНКЦІЇ ---

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

        initialTaskState.current = { step: savedStep, seconds: savedSeconds };
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToMain = () => {
    setIsTimerOpen(false);

    if (activeTaskId) {
      const hasChanged = 
        currentStepIndex !== initialTaskState.current.step || 
        seconds !== initialTaskState.current.seconds;

      if (hasChanged) {
        const totalSpentSeconds = taskTotals[activeTaskId] || 0;

        updateTaskProgress(activeTaskId, currentStepIndex, seconds, totalSpentSeconds)
          .then(() => console.log(`💾 Збережено. Загальний час задачі: ${totalSpentSeconds} сек`))
          .catch((e) => console.error("Помилка збереження:", e));
      }
    }
  };

const toggleTaskStatus = async (targetId) => {
    const idToComplete = targetId || activeTaskId; 
    if (!idToComplete) return;

    const task = tasks.find(t => t.id === idToComplete);
    if (!task) return;

    // ✨ Рутини ми не чіпаємо, вони вже вміють писати час через incrementRoutine
    if (task.isRoutine && !task.completed) {
      incrementRoutine(idToComplete);
      return; 
    }

    const currentState = task.checking !== undefined ? task.checking : task.completed;
    const willBeCompleted = !currentState;
    
    // 🕒 СТВОРЮЄМО ВІДБИТОК ЧАСУ
    const nowIso = new Date().toISOString();

    if (willBeCompleted) {
      // 🟢 1. РОБИМО ЗАДАЧУ ВИКОНАНОЮ (Анімація)
      setTasks(prev => prev.map(t => 
        t.id === idToComplete ? { ...t, checking: true, lastDoneDate: nowIso } : t
      ));
      
      speak("Задачу виконано!");
      addXp(GAME_CONFIG.STEP_XP * 2);
      if (activeTaskId === idToComplete) resetToMain();

      setTimeout(() => {
        setTasks(prev => prev.map(t => {
          if (t.id === idToComplete && t.checking === true) {
            return { ...t, completed: true, checking: undefined };
          }
          return t;
        }));
      }, 1500); 
      
    } else {
      // 🔴 2. СКАСОВУЄМО ВИКОНАННЯ (Стираємо час у UI)
      setTasks(prev => prev.map(t => 
        t.id === idToComplete ? { ...t, completed: false, checking: undefined, lastDoneDate: null } : t
      ));
      speak("Скасовано");
    }

    // 3. Відправляємо офіційний статус ТА ЧАС у Notion
// 3. Відправляємо офіційний статус у Notion
    try {
      // ✨ ДОДАЄМО nowIso сюди:
      await updateTaskStatusInNotion(idToComplete, willBeCompleted, nowIso); 
    } catch (e) {
      console.error("Помилка Notion:", e);
    }
  };

  // ✨ Перемикач типу задачі
  const toggleTaskType = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newIsRoutine = !task.isRoutine;
    
    // Візуально переносимо в іншу вкладку
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, isRoutine: newIsRoutine } : t
    ));
    speak(newIsRoutine ? "Тепер це рутина" : "Тепер це квест");

    try {
      await updateTaskTypeInNotion(taskId, newIsRoutine);
    } catch (e) { console.error("Помилка Notion:", e); }
  };

  // ✨ Лічильник повторень (замість галочки для рутин)
  const incrementRoutine = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCount = (task.repetitions || 0) + 1;
    const nowIso = new Date().toISOString(); // ✨ Фіксуємо точну секунду виконання!

    // Локально робимо її "виконаною" і ховаємо
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, repetitions: newCount, completed: true, lastDoneDate: nowIso } : t
    ));

    speak(`Рутину виконано!`);

    try {
      // Викликаємо оновлену функцію (передай сюди правильну назву з notionService)
      await updateRoutineInNotion(taskId, newCount, nowIso);
    } catch (e) {
      console.error(e);
    }
  };

const handleResetTimer = () => {
    // 1. Перевіряємо, чи взагалі є активна задача
    if (!activeTaskId) {
      console.error("❌ Помилка: Немає activeTaskId");
      setSeconds(0); // Просто скидаємо час як запасний варіант
      return;
    }

    const task = tasks.find(t => t.id === activeTaskId);
    
    // 2. Лог для відладки (бачимо в консолі F12)
    console.log("🔍 Скидання для задачі:", task);

    if (!task) {
      console.warn("⚠️ Задачу не знайдено в списку tasks. Скидаю лише час.");
      setSeconds(0);
      setIsRunning(false);
      return;
    }

    const isRoutine = task.isRoutine === true;
    const message = isRoutine 
      ? "Почати рутину з першого кроку та обнулити час?" 
      : "Скинути таймер цього кроку?";

    // 3. Тільки тепер викликаємо вікно підтвердження
    if (window.confirm(message)) {
      setSeconds(0);
      setIsRunning(false);

      if (isRoutine) {
        console.log("🔄 Скидаю кроки рутини...");
        setCurrentStepIndex(0);
        
        // Синхронізація з Notion
        updateTaskProgress(activeTaskId, 0, 0, taskTotals[activeTaskId] || 0)
          .catch(e => console.error("❌ Помилка Notion при скиданні:", e));
          
        speak("Починаємо спочатку");
      } else {
        speak("Таймер скинуто");
      }
    }
  };

  const { level, xpInLevel } = getLevelProgress(xp);
  const finishTime = getFinishTime(activeSteps, currentStepIndex);

  const handleGenerateSteps = async () => {
    const tasksToProcess = tasks.filter(t => !t.completed && !t.isRoutine);

    if (tasksToProcess.length === 0) {
      speak("Усі активні квести вже мають кроки!");
      return;
    }

    setIsGenerating(true);
    speak("Закликаю ШІ магію для створення кроків...");

    try {
      const webhookUrl = import.meta.env.VITE_GENERATE_STEPS_WEBHOOK;
      
      if (!webhookUrl) {
        throw new Error("Не знайдено посилання на вебхук");
      }

      // ✨ МАГІЯ АНТИ-CORS ✨
      // Ми просто стукаємо у вебхук як у двері, без складних заголовків і тіла
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors' // 👈 Цей рядок каже браузеру ігнорувати CORS
      });

      speak("Запит успішно відправлено! Зачекай хвилинку і натисни синхронізацію.");
      
    } catch (error) {
      console.error("Помилка виклику вебхука:", error);
      speak("Ой, зв'язок із магічним сервером розірвано.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 5. ПОВЕРНЕННЯ ---
  return {
    ...actions,
    xp, level, xpInLevel, energy, setEnergy,
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, 
    tasks: processedTasks, 
    activeSteps, currentStepIndex,
    isSyncing, isGenerating, newTaskText, setNewTaskText,
    handleTaskClick, resetToMain, handleResetTimer, toggleTaskStatus, finishTime, speak,
    filterMode, setFilterMode, 
    updateTaskTypeInNotion, updateRoutineInNotion, toggleTaskType, incrementRoutine, sortMode, setSortMode,     
    isTimerOpen, setIsTimerOpen, isRoutineDoneForToday,
    taskTotals, handleGenerateSteps,
    remainingStepsCount: activeSteps.length > 0 ? activeSteps.length - (currentStepIndex + 1) : 0
  };
}