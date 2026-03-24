import { Clock, CheckCircle } from 'lucide-react';

export default function ActiveTaskDetails({ 
  activeSteps, currentStepIndex, seconds 
}) {
  // Розрахунок загального часу, що залишився
  const remainingMinutes = Math.max(0, Math.round(
    activeSteps.slice(currentStepIndex + 1).reduce((sum, s) => sum + s.minutes, 0) + (seconds / 60)
  ));

  const finishTime = new Date();
  finishTime.setMinutes(finishTime.getMinutes() + remainingMinutes);
  const finishStr = finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
      
      {/* ІНФО-ПАНЕЛЬ */}
      <div className="w-full bg-white/50 backdrop-blur-sm rounded-[35px] p-7 flex justify-between items-center border border-white/50 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-pink-400 font-black text-[10px] uppercase tracking-widest">
            <Clock size={12}/> Залишилось
          </div>
          <div className="text-2xl text-pink-600 font-black">
            {remainingMinutes} хв всього
          </div>
        </div>
        <div className="text-right flex flex-col gap-1">
          <div className="text-pink-400 font-black text-[10px] uppercase tracking-widest">
            Фініш о
          </div>
          <div className="text-2xl text-pink-600 font-black">
            {finishStr}
          </div>
        </div>
      </div>

      {/* МАРШРУТ */}
      <div className="space-y-4">
        <div className="px-5">
           <h3 className="text-pink-300 font-black text-[11px] uppercase tracking-[0.3em]">Маршрут задачі</h3>
        </div>
        
        <div className="space-y-4 pb-20">
          {activeSteps.map((step, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-5 p-6 rounded-[35px] transition-all duration-500 ${
                index === currentStepIndex 
                  ? 'bg-white text-pink-600 shadow-xl ring-[12px] ring-pink-100/30 scale-[1.02]' 
                  : index < currentStepIndex
                    ? 'opacity-30 grayscale' 
                    : 'bg-white/40 text-pink-300'
              }`}
            >
              <div className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl font-black text-lg ${
                index === currentStepIndex ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' : 'bg-white text-pink-200'
              }`}>
                {index < currentStepIndex ? <CheckCircle size={22} strokeWidth={3} /> : index + 1}
              </div>
              <span className="flex-1 font-bold text-sm lg:text-base leading-tight">{step.text}</span>
              <span className="text-xs font-black opacity-30">{step.minutes}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}