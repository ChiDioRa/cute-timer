import { useState, useEffect, useRef } from 'react';
import { 
  fetchNotionTasks, 
  fetchTaskSteps, 
  fetchTaskTotalTime, 
  markTaskAsDone,
  deleteNotionTask, 
  addNotionTask 
} from '../services/notionService';

export function useTimerLogic() {
  // 1. ГЕЙМІФІКАЦІЯ (Відновлено) ✨
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

  // 2. СТАН ЗАДАЧ ТА ТАЙМЕРА
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('timer_tasks') || '[]'));
  const [taskTimes, setTaskTimes] = useState(() => JSON.parse(localStorage.getItem('timer_task_times') || '{}'));
  const [activeTaskId, setActiveTaskId] = useState(() => localStorage.getItem('timer_active_id') || null);
  const [activeSteps, setActiveSteps] = useState(() => JSON.parse(localStorage.getItem('timer_active_steps') || '[]'));
  const [currentStepIndex, setCurrentStepIndex] = useState(() => parseInt(localStorage.getItem('timer_step_index') || '0'));
  const [newTaskText, setNewTaskText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem('timer_seconds');
    return saved ? parseInt(saved) : 1500;
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const wakeLockRef = useRef(null); 
  const pendingCompletions = useRef(new Map()); 

  // 3. ОЗВУЧКА (Об'єднано з ігровими параметрами) 🐾
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uk-UA';
    utterance.rate = 1.1; // Жвавість
    utterance.pitch = 1.2; // Милість

    const playVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      let bestVoice = voices.find(v => v.name.includes('Google українська') || (v.name.includes('Google') && v.lang === 'uk-UA'));
      if (!bestVoice) bestVoice = voices.find(v => v.lang === 'uk-UA' || v.lang === 'uk_UA');
      if (!bestVoice) bestVoice = voices.find(v => v.name === 'Google русский' || v.lang === 'ru-RU');
      
      if (bestVoice) utterance.voice = bestVoice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', playVoice, { once: true });
    } else {
      playVoice();
    }
  };

  // 4. АВТОЗБЕРЕЖЕННЯ
  useEffect(() => { localStorage.setItem('timer_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('timer_task_times', JSON.stringify(taskTimes)); }, [taskTimes]);
  useEffect(() => { localStorage.setItem('timer_active_steps', JSON.stringify(activeSteps)); }, [activeSteps]);
  useEffect(() => { localStorage.setItem('timer_step_index', currentStepIndex.toString()); }, [currentStepIndex]);
  useEffect(() => { localStorage.setItem('timer_seconds', seconds.toString()); }, [seconds]);
  useEffect(() => { localStorage.setItem('timer_user_energy', energy.toString()); }, [energy]);
  useEffect(() => {
    if (activeTaskId) localStorage.setItem('timer_active_id', activeTaskId);
    else localStorage.removeItem('timer_active_id');
  }, [activeTaskId]);

  // 5. WAKE LOCK
  useEffect(() => {
    const requestWakeLock = async () => {
      try { if ('wakeLock' in navigator && isRunning) wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) {}
    };
    const releaseWakeLock = async () => {
      if (wakeLockRef.current !== null) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
    };
    if (isRunning) requestWakeLock(); else releaseWakeLock();
    return () => releaseWakeLock();
  }, [isRunning]);

  // 6. ТАЙМЕР + XP ЗА ФОКУС ✨
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 0) return 0;
          const nextValue = prev - 1;
          
          addXp(1); // +1 XP щосекунди фокусу

          const currentStep = activeSteps[currentStepIndex];
          const totalSeconds = currentStep ? currentStep.minutes * 60 : 1500;
          const halfway = Math.floor(totalSeconds / 2);

          if (nextValue === halfway && totalSeconds > 60) speak("Половина часу минула");
          if (nextValue === 30) speak("Залишилось тридцять секунд");
          if (nextValue === 0) speak("Крок завершено");
          
          return nextValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeSteps, currentStepIndex]);

  const handleTaskClick = async (id) => {
    setActiveTaskId(id);
    const steps = await fetchTaskSteps(id);
    if (steps?.length > 0) {
      setActiveSteps(steps);
      setCurrentStepIndex(0);
      setSeconds(steps[0].minutes * 60);
      setIsRunning(false); 
    }
  };

  // НАСТУПНИЙ КРОК + БОНУСИ ✨
  const handleNextStep = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      // Логіка XP за завершення кроку
      let baseStepXp = 50;
      let speedBonus = 0;
      if (seconds > 0) { // Завершили швидше ніж планували
        speedBonus = Math.floor(seconds / 60) * 10;
        if (speedBonus > 0) speak(`Чудова швидкість! Бонус ${speedBonus} досвіду.`);
      }
      addXp(baseStepXp + speedBonus);

      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setSeconds(activeSteps[nextIndex].minutes * 60);
      
      if (isRunning) speak(`Наступний крок: ${activeSteps[nextIndex].text}`);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setSeconds(activeSteps[prevIndex].minutes * 60); 
      if (isRunning) speak(`Повертаємось до: ${activeSteps[prevIndex].text}`);
      setIsRunning(false);
    }
  };

  const resetToMain = () => {
    setActiveTaskId(null); setActiveSteps([]); setCurrentStepIndex(0); setIsRunning(false); setSeconds(1500); 
  };

  const syncWithNotion = async () => {
    setIsSyncing(true);
    try {
      const notionTasks = await fetchNotionTasks();
      setTasks(notionTasks || []);
      const newTimes = {};
      (notionTasks || []).forEach(t => { if (t.totalTime) newTimes[t.id] = t.totalTime; });
      setTaskTimes(prev => ({ ...prev, ...newTimes }));
    } finally { setIsSyncing(false); }
  };

  const toggleTaskStatus = (taskId) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const isNowCompleted = !targetTask.completed;

    if (isNowCompleted) {
      addXp(200); // Бонус за ціле виконане завдання ✨
      speak("Завдання виконано! Плюс двісті досвіду.");
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: isNowCompleted } : t));

    if (isNowCompleted) {
      const timeoutId = setTimeout(async () => {
        try { await markTaskAsDone(taskId); await syncWithNotion(); } 
        catch (error) { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: false } : t)); }
        pendingCompletions.current.delete(taskId);
      }, 10000); 
      pendingCompletions.current.set(taskId, timeoutId);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!window.confirm(`Видалити "${taskToDelete?.text || 'задачу'}"? 🌸`)) return;
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (activeTaskId === taskId) resetToMain();
      await deleteNotionTask(taskId);
    } catch (error) { await syncWithNotion(); }
  };

  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    setIsSyncing(true);
    try {
      await addNotionTask(newTaskText); 
      setNewTaskText('');              
      addXp(10); // Маленький бонус за планування
      await syncWithNotion();          
    } catch (error) {} finally { setIsSyncing(false); }
  };

  const handleGenerateSteps = async () => {
    const webhookUrl = import.meta.env.VITE_GENERATE_STEPS_WEBHOOK;
    if (!webhookUrl) return;
    setIsGenerating(true); 
    try {
      await fetch(webhookUrl, { method: 'POST', body: JSON.stringify({ action: 'generate_steps' }) });
    } catch (error) {} finally {
      setTimeout(async () => { await syncWithNotion(); setIsGenerating(false); }, 2000);
    }
  };

  return {
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, tasks, activeSteps, currentStepIndex,
    isSyncing, taskTimes, xp, level, xpInLevel, energy, setEnergy,
    syncWithNotion, handleTaskClick, handleNextStep, handlePrevStep,
    newTaskText, setNewTaskText, handleAddTask, handleDeleteTask,
    speak, resetToMain, toggleTaskStatus, isGenerating, handleGenerateSteps
  };
}