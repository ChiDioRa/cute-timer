// src/hooks/useTaskActions.js
import { 
  fetchNotionTasks, 
  addNotionTask, 
  updateTaskProgress 
} from '../services/notionService';
import { GAME_CONFIG, getSpeedBonus } from '../utils/logicHelpers';

export function useTaskActions(state) {
  const { 
    tasks, setTasks, activeSteps, setActiveSteps, currentStepIndex, setCurrentStepIndex,
    setSeconds, setIsRunning, setIsSyncing, newTaskText, setNewTaskText, addXp, speak,
    activeTaskId, 
    seconds // 👈 ДОДАНО: Тепер функція бачить час таймера!
  } = state;

  /** 1. Синхронізація (завантаження списку) */
const syncWithNotion = async () => {
  setIsSyncing(true);
  try { 
    const nt = await fetchNotionTasks(); // Тут іде запит, який тепер має повернути totalTime
    setTasks(nt || []); 
  } finally { 
    setIsSyncing(false); 
  }
};

  /** 2. Завершення квесту/кроку */
  const handleCompleteStep = async () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      // Використовуємо seconds для розрахунку бонусу
      const bonus = getSpeedBonus(seconds, activeSteps[currentStepIndex]?.minutes);
      
      if (bonus > 0) speak(`Бонус швидкості: ${bonus} XP!`);
      addXp(GAME_CONFIG.STEP_XP + bonus);
      
      setCurrentStepIndex(nextIndex);
      setSeconds(0);

      if (activeTaskId) await updateTaskProgress(activeTaskId, nextIndex, 0);
    }
  };

  /** 3. Пропуск квесту */
  const handleSkipStep = async () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setSeconds(0);
      if (activeTaskId) await updateTaskProgress(activeTaskId, nextIndex, 0);
    }
  };

  /** 4. Повернення назад */
  const handlePrevStep = async () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setSeconds(0);
      setIsRunning(false);
      if (activeTaskId) await updateTaskProgress(activeTaskId, prevIndex, 0);
    }
  };

  /** 5. Додавання нової задачі */
  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    setIsSyncing(true);
    try {
      await addNotionTask(newTaskText);
      setNewTaskText('');
      addXp(GAME_CONFIG.PLANNING_XP);
      const nt = await fetchNotionTasks();
      setTasks(nt || []);
    } finally { setIsSyncing(false); }
  };

  /** ✨ 6. РУЧНА СИНХРОНІЗАЦІЯ (Save + Refresh) ✨ */
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
        const freshTasks = await fetchNotionTasks();
      // Тепер seconds визначено, і помилки не буде!
      if (activeTaskId) {
        await updateTaskProgress(activeTaskId, currentStepIndex, seconds);
        console.log("💾 Прогрес збережено в Notion");
      }

if (freshTasks && freshTasks.length > 0) {
        setTasks(freshTasks); // Оновлюємо список лише тоді, коли дані вже прийшли
        // localStorage оновиться автоматично завдяки useEffect у useTimerLogic
      }
      
      speak("Дані оновлено!");
    } catch (error) {
      console.error("Помилка синхронізації:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    handleCompleteStep, 
    handleSkipStep, 
    handlePrevStep,
    handleAddTask,
    handleManualSync, // Для виклику як handleManualSync
    syncWithNotion: handleManualSync // Для виклику через стару назву в Timer.jsx
  };
}