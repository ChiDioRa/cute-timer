import { Zap, Sparkles, Paintbrush, Moon, Leaf, Timer as TimerIcon, Coffee, Flame } from "lucide-react";
import { useState } from "react";

export default function Profile({
  level,
  xpInLevel,
  energy,
  setEnergy,
  theme,
  setTheme,
  taskTotals,
  activeTab,    
  setActiveTab  
}) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const xpNeeded = level * 1000;
  const progressPercent = (xpInLevel / xpNeeded) * 100;

  const themes = [
    { id: "sakura", name: "Sakura", icon: Sparkles },
    { id: "midnight", name: "Midnight", icon: Moon },
    { id: "matcha", name: "Matcha", icon: Leaf },
  ];

  const totalFocusSeconds = taskTotals ? Object.values(taskTotals).reduce((sum, val) => sum + val, 0) : 0;
  const totalMinutes = Math.floor(totalFocusSeconds / 60);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between bg-containerBg/50 backdrop-blur-md p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-theme-md border border-containerBorder mb-10 transition-colors duration-700 relative z-20">
      
      {/* ЛІВА ЧАСТИНА: Аватарка, Рівень, Нік, Хвилини */}
      <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto mb-6 md:mb-0">
        <div className="relative group">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-accent overflow-hidden shadow-lg transform transition-transform group-hover:scale-105 bg-white">
            <img
              src="https://pbs.twimg.com/media/GyAUFjLXEAAAhxg?format=jpg&name=small"
              alt="Мій Аватар"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-accent text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-containerBg shadow-sm text-sm">
            {level}
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-black text-appText text-lg sm:text-xl tracking-tight mb-1">
                Чі 🌸
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-appText/70">
                <Sparkles size={14} className="text-appText/70" />
                <span>{totalMinutes} хв фокусу</span>
              </div>
            </div>
            
            <span className="text-xs font-bold text-accent">
              {xpInLevel} / {xpNeeded} XP
            </span>
          </div>
          <div className="w-full h-3 sm:h-4 bg-containerBorder rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-accent transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* ПРАВА ЧАСТИНА: Перемикач, Енергія, Тема */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto justify-center md:justify-end">
        
        {/* Перемикач інтерфейсів */}
        <div className="flex items-center bg-containerBg border border-containerBorder rounded-full p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors text-xs font-bold ${
              activeTab === 'timer' 
                ? 'bg-accent text-white shadow-sm' 
                : 'text-appText/70 hover:text-accent hover:bg-containerBorder/50'
            }`}
          >
            <TimerIcon size={14} /> Фокус
          </button>
          
          <button
            onClick={() => setActiveTab('farm')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors text-xs font-bold ${
              activeTab === 'farm' 
                ? 'bg-accent text-white shadow-sm' 
                : 'text-appText/70 hover:text-accent hover:bg-containerBorder/50'
            }`}
          >
            <Coffee size={14} /> Кімната
          </button>
        </div>

        {/* Кнопка Енергії */}
        <button
          onClick={() => setEnergy(Math.min(100, energy + 20))}
          className="flex items-center gap-2 bg-yellow-100/80 hover:bg-yellow-200/90 text-yellow-700 px-4 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all border border-yellow-200"
        >
          <Zap size={16} className={energy < 30 ? "animate-bounce" : ""} />
          {energy}%
        </button>

        {/* Кнопка Теми */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2.5 bg-containerBg hover:bg-containerBorder rounded-full text-accent shadow-sm transition-all border border-containerBorder flex items-center justify-center"
          >
            <Paintbrush size={18} />
          </button>

          {showThemeMenu && (
             <div className="absolute right-0 top-12 mt-2 w-40 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
               {themes.map((t) => {
                 const Icon = t.icon;
                 return (
                   <button
                     key={t.id}
                     onClick={() => {
                       setTheme(t.id);
                       setShowThemeMenu(false);
                     }}
                     className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-sm font-bold
                       ${theme === t.id ? "bg-pink-50 text-pink-500" : "text-gray-600 hover:bg-gray-50"}
                     `}
                   >
                     <Icon size={16} /> {t.name}
                   </button>
                 );
               })}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}