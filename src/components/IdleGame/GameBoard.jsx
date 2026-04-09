import React from 'react';
import { Coins, Cat, Home, Store } from 'lucide-react';

export default function GameBoard({ coins, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-accent animate-pulse">
        <Cat size={48} className="mb-4 opacity-50" />
        <p className="font-bold">Завантаження кімнати...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white/40 backdrop-blur-xl rounded-[40px] p-6 shadow-theme-lg border border-white/50 mt-4">
      {/* Шапка з монетами */}
      <div className="flex justify-between items-center mb-6 bg-white/80 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-2">
          <Home className="text-accent" />
          <h2 className="font-bold text-appText text-lg">Кімната</h2>
        </div>
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full shadow-inner">
          <Coins size={20} className="text-yellow-500 animate-bounce" />
          <span className="font-black text-yellow-700 text-lg">{coins}</span>
        </div>
      </div>

      {/* Сцена з котиком */}
      <div className="h-72 bg-gradient-to-b from-blue-50/50 to-pink-50/50 rounded-[30px] border-2 border-dashed border-accent/20 flex flex-col items-center justify-center relative overflow-hidden mb-6 shadow-inner">
        <div className="bg-white p-6 rounded-full shadow-lg mb-4">
          <Cat size={64} className="text-accent animate-cat" />
        </div>
        <p className="text-sm font-bold text-appText opacity-60">Твій маскот відпочиває...</p>
        
        {/* Індикатор доходу */}
        <div className="absolute bottom-4 bg-white/80 px-4 py-1.5 rounded-full text-xs font-bold text-accent shadow-sm">
          +1 монета / хв (x3 під час фокусу)
        </div>
      </div>

      {/* Магазин (Заглушка на майбутнє) */}
      <div className="bg-white/60 p-5 rounded-3xl flex items-center justify-between opacity-70 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <Store className="text-accent" />
          <span className="font-bold text-appText">Магазин предметів</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-gray-200/50 text-gray-500 px-3 py-1.5 rounded-full">
          Скоро
        </span>
      </div>
    </div>
  );
}