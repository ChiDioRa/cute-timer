// --- КОНСТАНТИ ГРИ ---
export const GAME_CONFIG = {
  LEVEL_XP: 500,
  TASK_XP: 200,
  STEP_XP: 50,
  PLANNING_XP: 10,
  FOCUS_XP_PER_SEC: 1
};

// --- МАТЕМАТИКА ТА ФОРМАТУВАННЯ ---

/** Розрахунок рівня та прогресу */
export const getLevelProgress = (xp) => {
  const level = Math.floor(xp / GAME_CONFIG.LEVEL_XP) + 1;
  const xpInLevel = xp % GAME_CONFIG.LEVEL_XP;
  return { level, xpInLevel };
};

/** Розрахунок часу завершення */
export const getFinishTime = (activeSteps, currentStepIndex) => {
  if (!activeSteps || activeSteps.length === 0) return "--:--";
  const remainingSteps = activeSteps.slice(currentStepIndex);
  const totalRemainingMinutes = remainingSteps.reduce((acc, step) => acc + (step.minutes || 0), 0);
  const finishDate = new Date(Date.now() + totalRemainingMinutes * 60000);
  return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/** Бонус за швидкість */
export const getSpeedBonus = (seconds, estimatedMinutes) => {
  const estimatedSeconds = (estimatedMinutes || 5) * 60;
  if (seconds < estimatedSeconds) {
    const savedMinutes = Math.floor((estimatedSeconds - seconds) / 60);
    return savedMinutes * 10;
  }
  return 0;
};

/** ✨ Перевірка виконання рутини (Режим Сови о 05:00) */
export const isRoutineDoneForToday = (dateString, startHour = 5) => {
  if (!dateString) return false;
  
  const lastDone = new Date(dateString);
  const now = new Date();

  // "Відмотуємо" час назад для розрахунку дня
  const shiftDate = (date) => 
    new Date(date.getTime() - startHour * 60 * 60 * 1000).toDateString();
  
  return shiftDate(lastDone) === shiftDate(now);
};