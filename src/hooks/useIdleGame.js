import { useState, useEffect, useRef } from 'react';
import { getFarmSave, updateFarmSave } from '../services/supabaseClient';

export function useIdleGame({ isTimerActive }) {
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Використовуємо ref, щоб усередині setInterval завжди були актуальні монетки
  const coinsRef = useRef(coins);

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ (При старті)
  useEffect(() => {
    const loadGame = async () => {
      try {
        const saveData = await getFarmSave();
        
        if (saveData) {
          let loadedCoins = saveData.coins || 0;
          
          // Рахуємо офлайн дохід
          if (saveData.last_login) {
            const lastTime = new Date(saveData.last_login).getTime();
            const nowTime = new Date().getTime();
            const minutesOffline = Math.floor((nowTime - lastTime) / (1000 * 60));
            
            // Якщо була відсутня більше 1 хвилини, даємо бонус
            if (minutesOffline > 0) {
              const offlineBonus = minutesOffline * 1; // 1 монета за хвилину AFK
              loadedCoins += offlineBonus;
              console.log(`З поверненням! Ти заробила ${offlineBonus} монет поки тебе не було.`);
            }
          }
          
          setCoins(loadedCoins);
          coinsRef.current = loadedCoins;
          setInventory(saveData.inventory || []);
        }
      } catch (error) {
        console.error("Помилка завантаження гри:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();
  }, []);

  // 2. ОНЛАЙН ФАРМ (Капають монетки, поки додаток відкритий)
  useEffect(() => {
    if (isLoading) return;

    const farmInterval = setInterval(() => {
      // Базовий дохід: 1 монета на хвилину (перевіряємо кожну хвилину)
      // Але якщо таймер увімкнений (isTimerActive), даємо x3 бонус!
      const bonus = isTimerActive ? 3 : 1; 
      
      const newAmount = coinsRef.current + bonus;
      setCoins(newAmount);
      coinsRef.current = newAmount;
      
      // Одразу зберігаємо в базу
      updateFarmSave(newAmount, inventory);
      
    }, 60000); // 60000 мс = 1 хвилина

    return () => clearInterval(farmInterval);
  }, [isLoading, isTimerActive, inventory]);

  return {
    coins,
    inventory,
    isLoading
  };
}