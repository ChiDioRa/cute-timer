import { useCallback } from 'react';

export function useVoice() {
  const speak = useCallback((text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Початково ставимо українську
    utterance.lang = 'uk-UA'; 
    utterance.rate = 1.1;
    utterance.pitch = 1.2;

    const playVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // 1. Шукаємо українську мову ✨
      let voice = voices.find(v => v.lang === 'uk-UA' || v.name.includes('Ukrainian'));
      
      // 2. Якщо української немає, шукаємо російську як запасний варіант 🔄
      if (!voice) {
        voice = voices.find(v => v.lang === 'ru-RU' || v.name.includes('Russian'));
        if (voice) {
          utterance.lang = 'ru-RU'; // Змінюємо мову вимови на російську
        }
      }

      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = playVoice;
    } else {
      playVoice();
    }
  }, []);

  return { speak };
}