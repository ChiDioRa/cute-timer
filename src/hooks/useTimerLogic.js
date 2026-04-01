import { useState, useEffect, useRef } from 'react';
import { 
  fetchNotionTasks, 
  fetchTaskSteps, 
  markTaskAsDone,
  deleteNotionTask, 
  addNotionTask 
} from '../services/notionService';

export function useTimerLogic() {
  // 1. ГЕЙМІФІКАЦІЯ
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('timer_user_xp') || '0'));
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('timer_user_energy') || '100'));
  
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      localStorage.setItem('timer_user_xp', newXp.toString());
      return newXp;
    });
  };

  // 2. СТАН ЗАДАЧ ТА СЕКУНДОМІРА
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('timer_tasks') || '[]'));
  const [taskTimes, setTaskTimes] = useState(() => JSON.parse(localStorage.getItem('timer_task_times') || '{}'));
  const [activeTaskId, setActiveTaskId] = useState(() => localStorage.getItem('timer_active_id') || null);
  const [activeSteps, setActiveSteps] = useState(() => JSON.parse(localStorage.getItem('timer_active_steps') || '[]'));
  const [currentStepIndex, setCurrentStepIndex] = useState(() => parseInt(localStorage.getItem('timer_step_index') || '0'));
  const [newTaskText, setNewTaskText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem('timer_seconds');
    return saved ? parseInt(saved) : 0;
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const wakeLockRef = useRef(null); 
  const pendingCompletions = useRef(new Map()); 

  const speak = (text) => {
  if (!text) return;
  window.speechSynthesis.cancel(); // Зупиняємо попередню чергу
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'uk-UA';
  utterance.rate = 1.1; // Трохи швидше для жвавості
  utterance.pitch = 1.2; // Трохи вище для "милості"

  const playVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Шукаємо спочатку Google Українську, потім будь-яку українську
    let voice = voices.find(v => v.name.includes('Google українська') || v.lang === 'uk-UA');
    
    if (voice) {
      utterance.voice = voice;
    } else {
      // Якщо української немає, шукаємо англійську як "міжнародну" або залишаємо дефолт
      utterance.lang = 'ru-RU'; // Спроба російської як запасного варіанту
    }
    
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = playVoice;
  } else {
    playVoice();
  }
};

  // 4. АВТОЗБЕРЕЖЕННЯ
  useEffect(() => { localStorage.setItem('timer_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('timer_active_steps', JSON.stringify(activeSteps)); }, [activeSteps]);
  useEffect(() => { localStorage.setItem('timer_step_index', currentStepIndex.toString()); }, [currentStepIndex]);
  useEffect(() => { localStorage.setItem('timer_seconds', seconds.toString()); }, [seconds]);
  useEffect(() => {
    if (activeTaskId) localStorage.setItem('timer_active_id', activeTaskId);
    else localStorage.removeItem('timer_active_id');
  }, [activeTaskId]);

  // 5. ЛОГІКА СЕКУНДОМІРА + XP
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const nextValue = prev + 1;
          addXp(1); // +1 XP щосекунди
          if (nextValue > 0 && nextValue % 300 === 0) {
            speak(`Ти у фокусі вже ${nextValue / 60} хвилин.`);
          }
          return nextValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // 6. КЕРУВАННЯ КРОКАМИ
  const handleTaskClick = async (id) => {
    setActiveTaskId(id);
    const steps = await fetchTaskSteps(id);
    if (steps?.length > 0) {
      setActiveSteps(steps);
      setCurrentStepIndex(0);
      setSeconds(0);
      setIsRunning(false); 
    }
  };

  const handleCompleteStep = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const currentStep = activeSteps[currentStepIndex];
      const estimatedSeconds = (currentStep?.minutes || 5) * 60;
      let baseStepXp = 50;
      let speedBonus = 0;

      if (seconds < estimatedSeconds) {
        const savedMinutes = Math.floor((estimatedSeconds - seconds) / 60);
        speedBonus = savedMinutes * 10;
        if (speedBonus > 0) speak(`Чудова швидкість! Бонус ${speedBonus} досвіду.`);
      }

      addXp(baseStepXp + speedBonus);
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setSeconds(0);
      if (isRunning) speak(`Наступний крок: ${activeSteps[nextIndex].text}`);
    }
  };

  const handleSkipStep = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setSeconds(0);
      if (isRunning) speak(`Пропущено. Наступний крок: ${activeSteps[nextIndex].text}`);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setSeconds(0); 
      setIsRunning(false); 
    }
  };

  // 7. СИНХРОНІЗАЦІЯ ТА Notion
  const toggleTaskStatus = (taskId) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const isNowCompleted = !targetTask.completed;
    if (isNowCompleted) addXp(200);

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: isNowCompleted } : t));

    if (isNowCompleted) {
      const timeoutId = setTimeout(async () => {
        try {
          await markTaskAsDone(taskId);
          await syncWithNotion();
        } catch (e) {}
      }, 10000); 
      pendingCompletions.current.set(taskId, timeoutId);
    }
  };

  const syncWithNotion = async () => {
    setIsSyncing(true);
    try {
      const notionTasks = await fetchNotionTasks();
      setTasks(notionTasks || []);
    } finally { setIsSyncing(false); }
  };

  const resetToMain = () => {
    setActiveTaskId(null); setActiveSteps([]); setCurrentStepIndex(0); setIsRunning(false); setSeconds(0); 
  };

  const calculateFinishTime = () => {
    if (!activeSteps || activeSteps.length === 0) return "--:--";
    const remainingSteps = activeSteps.slice(currentStepIndex);
    const totalRemainingMinutes = remainingSteps.reduce((acc, step) => acc + (step.minutes || 0), 0);
    const finishDate = new Date(new Date().getTime() + totalRemainingMinutes * 60000);
    return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return {
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, tasks, activeSteps, currentStepIndex,
    isSyncing, taskTimes, xp, level, xpInLevel, energy, setEnergy,
    syncWithNotion, handleTaskClick, resetToMain, toggleTaskStatus,
    handleCompleteStep, handleSkipStep, handlePrevStep, speak,
    finishTime: calculateFinishTime(),
    remainingStepsCount: activeSteps.length > 0 ? activeSteps.length - (currentStepIndex + 1) : 0,
    handleDeleteTask: () => {}, handleAddTask: () => {}, handleGenerateSteps: () => {}, // додай якщо треба
    newTaskText, setNewTaskText, isGenerating
  };
}