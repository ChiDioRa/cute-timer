import { useCallback } from 'react';

export function useVoice() {
  const speak = useCallback((text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU'; // Використовуємо російську, оскільки українська може бути недоступна
    utterance.rate = 1.1;
    utterance.pitch = 1.2;

    const playVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name.includes('Google українська') || v.lang === 'uk-UA');
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = playVoice;
    } else { playVoice(); }
  }, []);

  return { speak };
}