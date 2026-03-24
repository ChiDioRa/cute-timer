import { useState, useEffect, useRef } from 'react';
import { fetchNotionTasks, fetchTaskSteps, fetchTaskTotalTime, markTaskAsDone } from '../services/notionService';

export function useTimerLogic() {
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('timer_tasks') || '[]'));
  const [taskTimes, setTaskTimes] = useState(() => JSON.parse(localStorage.getItem('timer_task_times') || '{}'));
  const [activeTaskId, setActiveTaskId] = useState(localStorage.getItem('timer_active_id') || null);
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem('timer_seconds') || '1500'));
  const [currentStepIndex, setCurrentStepIndex] = useState(() => parseInt(localStorage.getItem('timer_step_index') || '0'));
  const [isRunning, setIsRunning] = useState(false);
  const [activeSteps, setActiveSteps] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const halfwayAudioRef = useRef(null);
  const warningAudioRef = useRef(null);
  const finishAudioRef = useRef(null);

  // ЄДИНА ФУНКЦІЯ ДЛЯ ОЗВУЧКИ
  const speak = (text) => {
    if (!text) return;
    console.log("Озвучка:", text);
    
    // Спробуємо системну озвучку (якщо пакет встановлено) 
    // Або заміни цей блок на playAudio('file.mp3'), якщо використовуєш файли
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uk-UA';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const nextValue = prev - 1;
          
          if (nextValue === 30) {
            speak("Залишилось тридцять секунд");
          }

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

  const handleTaskClick = async (id) => {
    setActiveTaskId(id);
    localStorage.setItem('timer_active_id', id);
    const steps = await fetchTaskSteps(id);
    if (steps?.length > 0) {
      setActiveSteps(steps);
      setCurrentStepIndex(0);
      setSeconds(steps[0].minutes * 60);
    }
  };

const completeTask = (taskId) => {
  const id = taskId || activeTaskId;
  if (!id) return;

  // 1. ВІЗУАЛЬНИЙ ЕФЕКТ (Миттєво)
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    )
  );

  // Перевіряємо, чи ми поставили галочку
  const targetTask = tasks.find(t => t.id === id);
  const isNowCompleted = !targetTask?.completed;

  if (isNowCompleted) {
    speak("Заплановано до завершення");

    // 2. ДОВГА ЗАТРИМКА (120000 мс = 2 хвилини)
    setTimeout(() => {
      setTasks(currentTasks => {
        const stillDone = currentTasks.find(t => t.id === id && t.completed);
        
        if (stillDone) {
          console.log("Тут би була відправка в Notion для ID:", id);
          // ПОКИ ЩО НЕ ВИДАЛЯЄМО І НЕ ВІДПРАВЛЯЄМО В NOTION
          // Якщо захочеш, щоб вона таки зникла через 2 хвилини, 
          // розкоментуй рядок нижче:
          // return currentTasks.filter(t => t.id !== id);
        }
        return currentTasks;
      });
    }, 120000); 

  } else {
    speak("Повертаємо задачу");
  }
};

  const handleNextStep = () => {
    if (currentStepIndex < activeSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setSeconds(activeSteps[nextIndex].minutes * 60);
      speak(`Наступний крок: ${activeSteps[nextIndex].text}`);
    }
  };

  const syncWithNotion = async () => {
    setIsSyncing(true);
    try {
      const notionTasks = await fetchNotionTasks();
      setTasks(notionTasks || []);
    } finally { setIsSyncing(false); }
  };

  return {
    seconds, isRunning, setIsRunning, setSeconds,
    activeTaskId, tasks, activeSteps, currentStepIndex,
    isSyncing, taskTimes,
    halfwayAudioRef, warningAudioRef, finishAudioRef,
    syncWithNotion, handleTaskClick, handleNextStep, completeTask, speak
  };
}