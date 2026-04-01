// src/hooks/useTaskActions.js
import { 
  fetchNotionTasks, 
  fetchTaskSteps, 
  addNotionTask, 
  updateTaskProgress 
} from '../services/notionService';
import { GAME_CONFIG, getSpeedBonus } from '../utils/logicHelpers';

export function useTaskActions(state) {
  const { 
    tasks, setTasks, activeSteps, setActiveSteps, currentStepIndex, setCurrentStepIndex,
    setSeconds, setIsRunning, setIsSyncing, newTaskText, setNewTaskText, addXp, speak,
    activeTaskId // 👈 Обов'язково додаємо сюди
  } = state;

  const syncWithNotion = async () => {
    setIsSyncing(true);
    try { const nt = await fetchNotionTasks(); setTasks(nt || []); } finally { setIsSyncing(false); }
  };

  const handleCompleteStep = async () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const bonus = getSpeedBonus(state.seconds, activeSteps[currentStepIndex]?.minutes);
      
      if (bonus > 0) speak(`Бонус швидкості: ${bonus} XP!`);
      addXp(GAME_CONFIG.STEP_XP + bonus);
      
      setCurrentStepIndex(nextIndex);
      setSeconds(0);

      // Синхронізація з Notion ✨
      if (activeTaskId) await updateTaskProgress(activeTaskId, nextIndex, 0);
    }
  };

  // ✨ ДОДАЄМО SKIP (якого не вистачало)
  const handleSkipStep = async () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setSeconds(0);
      if (activeTaskId) await updateTaskProgress(activeTaskId, nextIndex, 0);
    }
  };

  // ✨ ДОДАЄМО PREV
  const handlePrevStep = async () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setSeconds(0);
      setIsRunning(false);
      if (activeTaskId) await updateTaskProgress(activeTaskId, prevIndex, 0);
    }
  };

  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    setIsSyncing(true);
    try {
      await addNotionTask(newTaskText);
      setNewTaskText('');
      addXp(GAME_CONFIG.PLANNING_XP);
      await syncWithNotion();
    } finally { setIsSyncing(false); }
  };

  return { 
    syncWithNotion, 
    handleCompleteStep, 
    handleSkipStep, // 👈 Тепер ця функція існує!
    handlePrevStep,
    handleAddTask 
  };
}