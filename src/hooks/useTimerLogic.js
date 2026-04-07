import { useState, useEffect, useRef, useCallback, useMemo } from 'react'; 
import { useVoice } from './useVoice'; 
import { useTaskActions } from './useTaskActions';
import { useUserStats } from './useUserStats'; 
import { useTimer } from './useTimer';         
import { 
  fetchTaskSteps, 
  updateTaskProgress, 
  updateTaskStatusInNotion, 
  updateTaskTypeInNotion, 
  updateRoutineInNotion,
  deleteNotionTask
} from '../services/notionService';
import { 
  getFinishTime, 
  GAME_CONFIG, 
  isRoutineDoneForToday 
} from '../utils/logicHelpers';

export function useTimerLogic() {
  // --- 1. УСІ ОСНОВНІ СТАНИ (Оголошуємо першими!) ---
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('timer_tasks') || '[]'));
  const [activeTaskId, setActiveTaskId] = useState(() => localStorage.getItem('timer_active_id') || null);
  const [activeSteps, setActiveSteps] = useState(() => JSON.parse(localStorage.getItem('timer_active_steps') || '[]'));
  const [currentStepIndex, setCurrentStepIndex] = useState(() => parseInt(localStorage.getItem('timer_step_index') || '0'));
  const [newTaskText, setNewTaskText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepsCache, setStepsCache] = useState(() => JSON.parse(localStorage.getItem('timer_steps_cache') || '{}'));
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [taskTotals, setTaskTotals] = useState(() => JSON.parse(localStorage.getItem('timer_task_totals') || '{}'));
  const [filterMode, setFilterMode] = useState('all'); 
  const [sortMode, setSortMode] = useState('newest');

  const { speak } = useVoice(); 
  const initialTaskState = useRef({ step: 0, seconds: 0 }); // Для контролю змін перед збереженням

  // --- 2. ПІДКЛЮЧЕННЯ МОДУЛЬНИХ ХУКІВ ---
  const { xp, level, xpInLevel, energy, setEnergy, addXp } = useUserStats();
  
  // Логіка того, що відбувається щосекунди (XP + статистика часу)
  const handleTick = useCallback(() => {
    if (activeTaskId) {
      setTaskTotals(prev => ({
        ...prev,
        [activeTaskId]: (prev[activeTaskId] || 0) + 1
      }));
    }
    addXp(GAME_CONFIG.FOCUS_XP_PER_SEC);
  }, [activeTaskId, addXp]);

  const { seconds, setSeconds, isRunning, setIsRunning } = useTimer(handleTick);

  // --- 3. ОБРОБКА СПИСКУ ЗАДАЧ ---
  const processedTasks = useMemo(() => {
    let result = [...tasks];
    if (sortMode === 'shortest') {
      result.sort((a, b) => (a.totalTime || 999) - (b.totalTime || 999));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  }, [tasks, sortMode]);

  // Підключаємо екшени (синхронізація, додавання тощо)
  const actions = useTaskActions({
    tasks, setTasks, activeSteps, setActiveSteps, currentStepIndex, setCurrentStepIndex,
    setSeconds, setIsRunning, setIsSyncing, newTaskText, setNewTaskText, addXp, speak, 
    seconds, activeTaskId, taskTotals
  });

  // --- 4. ЕФЕКТИ АВТОЗБЕРЕЖЕННЯ ---
  useEffect(() => {
    localStorage.setItem('timer_tasks', JSON.stringify(tasks));
    localStorage.setItem('timer_active_steps', JSON.stringify(activeSteps));
    localStorage.setItem('timer_steps_cache', JSON.stringify(stepsCache));
    localStorage.setItem('timer_seconds', seconds.toString());
    localStorage.setItem('timer_step_index', currentStepIndex.toString());
    localStorage.setItem('timer_task_totals', JSON.stringify(taskTotals));
    if (activeTaskId) localStorage.setItem('timer_active_id', activeTaskId);
    else localStorage.removeItem('timer_active_id');
  }, [tasks, activeSteps, stepsCache, seconds, currentStepIndex, activeTaskId, taskTotals]);

  // Відкриття таймера при активній задачі
  useEffect(() => { if (activeTaskId) setIsTimerOpen(true); }, [activeTaskId]);

  // --- 5. ФУНКЦІЇ КЕРУВАННЯ ---

  // Клік по задачі: завантаження кроків та відновлення стану
  const handleTaskClick = async (id) => {
    setIsTimerOpen(true);
    if (activeTaskId === id) return;
    setActiveTaskId(id);
    const targetTask = tasks.find((t) => t.id === id);

    const savedStep = targetTask?.savedStep || 0;
    const savedSeconds = targetTask?.savedSeconds || 0;

    if (stepsCache[id]) {
      setActiveSteps(stepsCache[id]);
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
        setCurrentStepIndex(savedStep);
        setSeconds(savedSeconds);
        initialTaskState.current = { step: savedStep, seconds: savedSeconds };
      }
    } finally { setIsSyncing(false); }
  };

  // Вихід до головного списку та збереження прогресу в Notion
  const resetToMain = () => {
    setIsTimerOpen(false);
    if (activeTaskId) {
      const hasChanged = 
        currentStepIndex !== initialTaskState.current.step || 
        seconds !== initialTaskState.current.seconds;

      if (hasChanged) {
        const totalSpentSeconds = taskTotals[activeTaskId] || 0;
        updateTaskProgress(activeTaskId, currentStepIndex, seconds, totalSpentSeconds)
          .catch((e) => console.error("Помилка збереження прогресу:", e));
      }
    }
  };

  // Перемикання статусу (Квест vs Рутина)
  const toggleTaskStatus = async (targetId) => {
    const id = targetId || activeTaskId;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.isRoutine && !task.completed) {
      incrementRoutine(id);
      return;
    }

    const currentState = task.checking !== undefined ? task.checking : task.completed;
    const willBeCompleted = !currentState;
    const nowIso = new Date().toISOString();

    if (willBeCompleted) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, checking: true, lastDoneDate: nowIso } : t));
      speak("Задачу виконано!");
      addXp(GAME_CONFIG.STEP_XP * 2);
      
      // Анімація завершення
      setTimeout(() => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true, checking: undefined } : t));
      }, 1500);
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: false, checking: undefined, lastDoneDate: null } : t));
      speak("Скасовано");
    }

    try {
      await updateTaskStatusInNotion(id, willBeCompleted, nowIso);
    } catch (e) { console.error("Помилка Notion:", e); }
  };

  // Зміна типу задачі
  const toggleTaskType = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newIsRoutine = !task.isRoutine;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isRoutine: newIsRoutine } : t));
    speak(newIsRoutine ? "Тепер це рутина" : "Тепер це квест");
    try {
      await updateTaskTypeInNotion(taskId, newIsRoutine);
    } catch (e) { console.error("Помилка Notion:", e); }
  };

  // Виконання рутини (+1 повторення)
  const incrementRoutine = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newCount = (task.repetitions || 0) + 1;
    const nowIso = new Date().toISOString();

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, repetitions: newCount, completed: true, lastDoneDate: nowIso } : t
    ));
    speak(`Рутину виконано!`);
    try {
      await updateRoutineInNotion(taskId, newCount, nowIso);
    } catch (e) { console.error(e); }
  };

  // Скидання таймера
  const handleResetTimer = () => {
    if (!activeTaskId) return;
    const task = tasks.find(t => t.id === activeTaskId);
    const message = task?.isRoutine ? "Почати рутину спочатку?" : "Скинути таймер кроку?";
    if (window.confirm(message)) {
      setSeconds(0);
      setIsRunning(false);
      if (task?.isRoutine) setCurrentStepIndex(0);
      speak("Скинуто");
    }
  };

  // Генерація кроків через ШІ
  const handleGenerateSteps = async () => {
    const tasksToProcess = tasks.filter(t => !t.completed && !t.isRoutine);
    if (tasksToProcess.length === 0) {
      speak("Усі активні квести вже мають кроки!");
      return;
    }
    setIsGenerating(true);
    speak("Закликаю ШІ магію...");
    try {
      await fetch(import.meta.env.VITE_GENERATE_STEPS_WEBHOOK, { method: 'POST', mode: 'no-cors' });
      speak("Запит відправлено! Зачекай хвилину.");
    } catch (e) { speak("Помилка зв'язку."); }
    finally { setIsGenerating(false); }
  };

  const handleDeleteTask = async (taskId) => {
  // Видаляємо візуально відразу
  setTasks(prev => prev.filter(t => t.id !== taskId));
  if (activeTaskId === taskId) {
    setActiveTaskId(null);
    setIsTimerOpen(false);
  }
  
  try {
    await deleteNotionTask(taskId);
    speak("Квест видалено");
  } catch (e) {
    console.error("Помилка видалення:", e);
  }
};

  // --- 6. ПОВЕРНЕННЯ ОБ'ЄКТА ---
  return {
    ...actions,
    xp, level, xpInLevel, energy, setEnergy,
    seconds, isRunning, setIsRunning, setSeconds,
    tasks: processedTasks,
    activeTaskId, activeSteps, currentStepIndex,
    isSyncing, isGenerating, newTaskText, setNewTaskText,
    handleTaskClick, resetToMain, handleResetTimer, toggleTaskStatus,
    toggleTaskType, incrementRoutine,
    filterMode, setFilterMode, sortMode, setSortMode,
    isTimerOpen, setIsTimerOpen, taskTotals, handleGenerateSteps,
    finishTime: getFinishTime(activeSteps, currentStepIndex),
    speak, handleDeleteTask,
    // Наша розумна перевірка свіжості
    isRoutineDoneForToday: (date) => isRoutineDoneForToday(date, 5),
    remainingStepsCount: activeSteps.length > 0 ? activeSteps.length - (currentStepIndex + 1) : 0
  };
}