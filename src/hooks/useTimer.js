import { useState, useRef, useEffect } from 'react';

// Важливо: має бути саме "export function", щоб працював іменований імпорт
export function useTimer(onTick) {
  const [seconds, setSeconds] = useState(() => parseInt(localStorage.getItem('timer_seconds') || '0'));
  const [isRunning, setIsRunning] = useState(false);
  const wakeLockRef = useRef(null);

  // Основний цикл таймера
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
        // Викликаємо функцію handleTick з useTimerLogic, щоб нараховувати XP
        if (onTick) onTick(); 
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, onTick]);

  // Логіка WakeLock (щоб екран не гаснув під час роботи таймера)
  useEffect(() => {
    if (isRunning && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => { wakeLockRef.current = lock; })
        .catch(err => console.error("WakeLock Error:", err));
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, [isRunning]);

  return { seconds, setSeconds, isRunning, setIsRunning };
}