import { useState, useEffect, useRef } from 'react';
import { 
  fetchNotionTasks, 
  fetchTaskSteps, 
  fetchTaskTotalTime, 
  markTaskAsDone, 
  addNotionTask // <--- ДОДАЙ ЦЕ СЮДИ
} from '../services/notionService';

export function useTimerLogic() {
  // 1. ІНІЦІАЛІЗАЦІЯ З LOCAL STORAGE (Завантажуємо збережене)
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('timer_tasks') || '[]'));
  const [taskTimes, setTaskTimes] = useState(() => JSON.parse(localStorage.getItem('timer_task_times') || '{}'));
  const [activeTaskId, setActiveTaskId] = useState(() => localStorage.getItem('timer_active_id') || null);
  const [activeSteps, setActiveSteps] = useState(() => JSON.parse(localStorage.getItem('timer_active_steps') || '[]'));
  const [currentStepIndex, setCurrentStepIndex] = useState(() => parseInt(localStorage.getItem('timer_step_index') || '0'));
  const [newTaskText, setNewTaskText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Відновлюємо час. Якщо його немає — ставимо базові 25 хв (1500 сек)
  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem('timer_seconds');
    return saved ? parseInt(saved) : 1500;
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const halfwayAudioRef = useRef(null);
  const warningAudioRef = useRef(null);
  const finishAudioRef = useRef(null);
  const wakeLockRef = useRef(null); // Реф для тримання екрану ввімкненим
  const pendingCompletions = useRef(new Map()); // Пам'ять для таймерів відміни

  // ЄДИНА ФУНКЦІЯ ДЛЯ ОЗВУЧКИ
  const speak = (text) => {
    if (!text) return;
    console.log("Озвучка:", text);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uk-UA';
    window.speechSynthesis.speak(utterance);
  };

  // 2. АВТОЗБЕРЕЖЕННЯ (Зберігаємо кожну зміну локально)
  useEffect(() => { localStorage.setItem('timer_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('timer_task_times', JSON.stringify(taskTimes)); }, [taskTimes]);
  useEffect(() => { localStorage.setItem('timer_active_steps', JSON.stringify(activeSteps)); }, [activeSteps]);
  useEffect(() => { localStorage.setItem('timer_step_index', currentStepIndex.toString()); }, [currentStepIndex]);
  useEffect(() => { localStorage.setItem('timer_seconds', seconds.toString()); }, [seconds]);
  useEffect(() => {
    if (activeTaskId) localStorage.setItem('timer_active_id', activeTaskId);
    else localStorage.removeItem('timer_active_id');
  }, [activeTaskId]);

  // 3. ЩОБ ЕКРАН НА АЙФОНІ НЕ ГАСНУВ (Wake Lock API)
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isRunning) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('🌞 Екран заблоковано від вимкнення');
        }
      } catch (err) {
        console.error('Помилка Wake Lock:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current !== null) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('🌙 Екран може гаснути');
      }
    };

    if (isRunning) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Якщо ми звернули і розгорнули браузер
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning) requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  // 4. ТАЙМЕР
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const nextValue = prev - 1;
          if (nextValue === 30) speak("Залишилось тридцять секунд");
          if (nextValue === 0) {
            finishAudioRef.current?.play().catch(() => {});
            speak("Крок завершено");
          }
          return nextValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeSteps]);

  // ВИБІР ЗАДАЧІ
  const handleTaskClick = async (id) => {
    setActiveTaskId(id);
    const steps = await fetchTaskSteps(id);
    if (steps?.length > 0) {
      setActiveSteps(steps);
      setCurrentStepIndex(0);
      setSeconds(steps[0].minutes * 60);
      setIsRunning(false); // Ставимо на паузу, щоб не стартував сам
    }
  };

  // НАСТУПНИЙ КРОК
  const handleNextStep = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setSeconds(activeSteps[nextIndex].minutes * 60);
      speak(`Наступний крок: ${activeSteps[nextIndex].text}`);
    }
  };
  // ФУНКЦІЯ ПЕРЕХОДУ НА ПОПЕРЕДНІЙ КРОК
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setSeconds(activeSteps[prevIndex].minutes * 60); // Повертаємо час цього кроку
      speak(`Повертаємось до кроку: ${activeSteps[prevIndex].text}`);
      setIsRunning(false); // Краще зупинити таймер при переході назад
    }
  };

  // ПОВЕРНЕННЯ В ГОЛОВНЕ МЕНЮ (якщо ти вийшла з задачі)
  const resetToMain = () => {
    setActiveTaskId(null);
    setActiveSteps([]);
    setCurrentStepIndex(0);
    setIsRunning(false);
    setSeconds(1500); // Скидаємо на дефолтні 25 хв
  };

  // СИНХРОНІЗАЦІЯ З NOTION (з підтягуванням часу!)
  const syncWithNotion = async () => {
    setIsSyncing(true);
    try {
      const notionTasks = await fetchNotionTasks();
      setTasks(notionTasks || []);
      
      // ✨ Ось тут ми записуємо час кожної задачі в пам'ять!
      const newTimes = {};
      (notionTasks || []).forEach(t => {
        if (t.totalTime) newTimes[t.id] = t.totalTime;
      });
      
      setTaskTimes(prev => {
        const merged = { ...prev, ...newTimes };
        return merged;
      });

    } finally { setIsSyncing(false); }
  };

// ✨ ФУНКЦІЯ ЗАКРИТТЯ З 3-СЕКУНДНОЮ ПАУЗОЮ ✨
  const toggleTaskStatus = (taskId) => {
    // Шукаємо задачу
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const isNowCompleted = !targetTask.completed;

    // 1. Миттєво міняємо колір і закреслюємо на екрані
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: isNowCompleted } : t
    ));

    if (isNowCompleted) {
      console.log("🌸 Галочка натиснута! Чекаємо 3 сек...");
      
      const timeoutId = setTimeout(async () => {
        try {
          await markTaskAsDone(taskId);
          console.log("✅ Задача полетіла в Notion!");
          await syncWithNotion();
        } catch (error) {
          console.error("❌ Помилка закриття:", error);
          // Якщо сталася помилка з інтернетом, повертаємо галочку назад
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: false } : t));
        }
        pendingCompletions.current.delete(taskId);
      }, 10000); 

      pendingCompletions.current.set(taskId, timeoutId);
    } else {
      console.log("⏪ Скасовано! Задача повертається.");
      if (pendingCompletions.current.has(taskId)) {
        clearTimeout(pendingCompletions.current.get(taskId));
        pendingCompletions.current.delete(taskId);
      }
    }
  };

  const handleAddTask = async (e) => {
  if (e) e.preventDefault();
  if (!newTaskText.trim()) return;

  setIsSyncing(true);
  try {
    await addNotionTask(newTaskText); // Відправляємо в Notion
    setNewTaskText('');              // Очищуємо поле
    await syncWithNotion();          // Оновлюємо список задач
  } catch (error) {
    console.error("Не вдалося додати задачу:", error);
  } finally {
    setIsSyncing(false);
  }
};

const handleGenerateSteps = async () => {
  setIsGenerating(true);
  try {
    // Заміни URL на свій реальний вебхук з Make/Zapier
    const webhookUrl = import.meta.env.VITE_GENERATE_STEPS_WEBHOOK; 

    const response = await fetch(webhookUrl, {
      method: 'POST',
      // Можна нічого не передавати, якщо скрипт сам шукає задачі в Notion
      body: JSON.stringify({ action: 'generate_steps' }), 
    });

    if (response.ok) {
      alert("🪄 Магія запущена! Кроки з'являться за декілька секунд.");
    }
  } catch (error) {
    console.error("Помилка вебхука:", error);
    alert("Ой, магія не спрацювала. Перевір консоль.");
  } finally {
    setIsGenerating(false);
    await syncWithNotion(); // Оновити список, щоб побачити зміни
  }
};

return {
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, tasks, activeSteps, currentStepIndex,
    isSyncing, taskTimes,
    halfwayAudioRef, warningAudioRef, finishAudioRef,
    syncWithNotion, handleTaskClick, handleNextStep, newTaskText, setNewTaskText, handleAddTask, 
  addNotionTask, // також додай імпорт функції з сервісу
    handlePrevStep, // ✨ ОСЬ ВОНО! ТЕПЕР КНОПКА ПОБАЧИТЬ ЦЮ ФУНКЦІЮ ✨
    speak, markTaskAsDone, resetToMain, toggleTaskStatus, isGenerating, handleGenerateSteps
  };
}