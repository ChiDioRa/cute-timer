// --- КОНСТАНТИ ГРИ ---
export const GAME_CONFIG = {
  LEVEL_XP: 500,          // XP для нового рівня
  TASK_XP: 200,           // Бонус за цілу задачу
  STEP_XP: 50,            // Бонус за крок
  PLANNING_XP: 10,        // Бонус за додавання задачі
  FOCUS_XP_PER_SEC: 1     // XP щосекунди
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

/** Бонус за швидкість (якщо завершив швидше естімейту) */
export const getSpeedBonus = (seconds, estimatedMinutes) => {
  const estimatedSeconds = (estimatedMinutes || 5) * 60;
  if (seconds < estimatedSeconds) {
    const savedMinutes = Math.floor((estimatedSeconds - seconds) / 60);
    return savedMinutes * 10; // 10 XP за кожну збережену хвилину
  }
  return 0;
};