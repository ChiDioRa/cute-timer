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
    seconds, taskTotals
  } = state;

  /** 1. Синхронізація (завантаження списку) */
  const syncWithNotion = async () => {
    setIsSyncing(true);
    try { 
      const nt = await fetchNotionTasks(); 
      setTasks(nt || []); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  /** 2. Завершення квесту/кроку */
  const handleCompleteStep = async () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const bonus = getSpeedBonus(seconds, activeSteps[currentStepIndex]?.minutes);
      
      // ✨ Формуємо спільну фразу для озвучки
      let phrase = "Чудова робота! ";
      if (bonus > 0) phrase += `Бонус швидкості ${bonus} XP! `;
      phrase += `Наступний крок: ${activeSteps[nextIndex].text}`;
      
      speak(phrase);

      addXp(GAME_CONFIG.STEP_XP + bonus);
      
      setCurrentStepIndex(nextIndex);
      setSeconds(0);

      if (activeTaskId) {
        const totalSpentSeconds = taskTotals ? (taskTotals[activeTaskId] || 0) : 0;
        await updateTaskProgress(activeTaskId, nextIndex, 0, totalSpentSeconds);
      }
    }
  };

  /** 3. Пропуск квесту */
  const handleSkipStep = async () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      
      // ✨ Озвучуємо скіп і наступний крок
      speak(`Крок пропущено. Наступний крок: ${activeSteps[nextIndex].text}`);

      setCurrentStepIndex(nextIndex);
      setSeconds(0);
      
      if (activeTaskId) {
        const totalSpentSeconds = taskTotals ? (taskTotals[activeTaskId] || 0) : 0;
        await updateTaskProgress(activeTaskId, nextIndex, 0, totalSpentSeconds);
      }
    }
  };

  /** 4. Повернення назад */
  const handlePrevStep = async () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setSeconds(0);
      setIsRunning(false);
      
      if (activeTaskId) {
        const totalSpentSeconds = taskTotals ? (taskTotals[activeTaskId] || 0) : 0;
        await updateTaskProgress(activeTaskId, prevIndex, 0, totalSpentSeconds);
      }
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
      
      if (activeTaskId) {
        const totalSpentSeconds = taskTotals ? (taskTotals[activeTaskId] || 0) : 0;
        await updateTaskProgress(activeTaskId, currentStepIndex, seconds, totalSpentSeconds);
        console.log("💾 Прогрес збережено в Notion");
      }

      if (freshTasks && freshTasks.length > 0) {
        setTasks(freshTasks);
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
    handleManualSync, 
    syncWithNotion: handleManualSync 
  };
}