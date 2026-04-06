import { Zap, Palette } from 'lucide-react';

export default function Profile({ level, xpInLevel, energy, setEnergy, theme, setTheme, taskTotals = {} }) {

  // ✨ Вираховуємо загальний час фокусу (сумуємо всі секунди з усіх задач)
  const totalFocusSeconds = Object.values(taskTotals).reduce((sum, val) => sum + val, 0);
  const totalMinutes = Math.floor(totalFocusSeconds / 60);

  const getEnergyColor = (val) => {
    if (val > 60) return 'bg-emerald-400 border-emerald-600 shadow-[0_0_12px_rgba(52,211,153,0.4)]';
    if (val > 20) return 'bg-yellow-400 border-yellow-600 shadow-[0_0_12px_rgba(250,204,21,0.4)]';
    return 'bg-rose-400 border-rose-600 shadow-[0_0_12px_rgba(251,113,133,0.4)]';
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 px-4">
      <div className="flex flex-col lg:flex-row justify-center items-center gap-3 lg:gap-6">
        
        {/* КАРТКА 1: LVL ТА XP */}
        <div className="w-full lg:flex-[1.1] flex items-center gap-4 bg-containerBg/80 backdrop-blur-sm p-4 pr-8 rounded-[28px] border border-containerBorder shadow-theme-sm">
          <div className="w-14 h-14 bg-accent rounded-2xl flex flex-col items-center justify-center text-accentText shadow-lg shrink-0">
            <span className="text-[10px] font-black leading-none opacity-70 uppercase">Lvl</span>
            <span className="text-2xl font-black leading-none">{level}</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-end">
               <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-60">Experience</span>
               <span className="text-[11px] font-bold opacity-40">{xpInLevel} / 500</span>
            </div>
            <div className="h-2.5 w-full bg-containerBorder rounded-full overflow-hidden border border-containerBorder/50 p-0.5">
              <div 
                className="h-full bg-accent rounded-full transition-all duration-1000 shadow-[0_0_10px_var(--accent)]" 
                style={{ width: `${(xpInLevel / 500) * 100}%` }}
              />
            </div>
          </div>

          {/* ✨ БЛОК СТАТИСТИКИ ЧАСУ ✨ */}
          <div className="flex flex-col items-end shrink-0 ml-2">
            <span className="text-[10px] font-black text-accent uppercase opacity-60 tracking-widest">Фокус</span>
            <span className="text-sm font-bold opacity-80">{totalMinutes} хв</span>
          </div>
        </div>

        <div className="w-full flex flex-row gap-3 lg:contents">
          
          {/* КАРТКА 2: ЕНЕРГІЯ */}
          <div className="flex-[1.5] lg:flex-1 flex items-center justify-center gap-2 sm:gap-4 bg-containerBg/80 backdrop-blur-sm p-3 sm:p-4 lg:px-8 rounded-[28px] border border-containerBorder shadow-theme-sm">
            <Zap size={20} className={`${energy <= 20 ? 'text-rose-400' : 'text-amber-400'} fill-current shrink-0`} />
            <div className="flex gap-1.5 sm:gap-2">
              {[...Array(5)].map((_, i) => {
                const dotValue = (i + 1) * 20;
                return (
                  <button 
                    key={i} 
                    onClick={() => setEnergy(dotValue)}
                    className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 rounded-md sm:rounded-lg transition-all duration-300 border-b-2 active:scale-75
                      ${energy >= dotValue ? `${getEnergyColor(energy)} shadow-md` : 'bg-accent/5 border-accent/10 opacity-60 hover:opacity-100'}`}
                  />
                );
              })}
            </div>
          </div>

          {/* КАРТКА 3: СКІНИ */}
          <div className="flex-1 lg:flex-none lg:w-fit flex items-center justify-center gap-2 sm:gap-4 bg-containerBg/80 backdrop-blur-sm p-3 sm:p-4 lg:px-8 rounded-[28px] border border-containerBorder shadow-theme-sm">
            <div className="hidden sm:flex flex-col items-start leading-none opacity-40">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-accent">Skins</span>
              <Palette size={12} className="mt-1" />
            </div>
            <div className="flex gap-2 sm:gap-3">
              {['sakura', 'midnight', 'matcha'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setTheme(t)} 
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all duration-300 hover:rotate-12 hover:scale-125
                    ${t === 'sakura' ? 'bg-pink-300' : t === 'midnight' ? 'bg-slate-800' : 'bg-emerald-300'}
                    ${theme === t ? 'ring-2 ring-offset-2 ring-accent scale-110 shadow-lg' : 'opacity-30 hover:opacity-100'}`} 
                />
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}