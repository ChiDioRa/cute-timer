import { Play, Pause, RefreshCw, Coffee, Target, Brain, ChevronRight, ChevronLeft, Check } from 'lucide-react';

function Timer({ 
  seconds, isRunning, setIsRunning, setSeconds, 
  activeTaskText, showModeButtons, activeSteps, currentStepIndex, 
  handleNextStep, handlePrevStep, completeTask, speak 
}) {
  
  const formatTime = (s) => {
    const isOver = s < 0;
    const absS = Math.abs(s);
    const mins = Math.floor(absS / 60);
    const secs = absS % 60;
    return `${isOver ? '+' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setMode = (mins) => {
    setIsRunning(false);
    setSeconds(mins * 60);
  };

  const isWarning = seconds <= 30 && seconds > 0;
  const isOvertime = seconds < 0;
  const isLastStep = activeSteps && activeSteps.length > 0 && currentStepIndex === activeSteps.length - 1;

  const handleTogglePlay = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);

    if (nextState && !showModeButtons) {
      const currentStep = activeSteps[currentStepIndex];
      const isInitialStart = seconds === (currentStep?.minutes * 60);
      
      if (isInitialStart) {
        speak(`Розпочинаємо крок: ${currentStep?.text || activeTaskText}`);
      } else {
        speak("Продовжуємо");
      }
    }
  };

  return (
  
<div className={`relative bg-containerBg rounded-[45px] shadow-2xl p-10 w-full flex flex-col items-center transition-all duration-700 
  ${isOvertime ? 'ring-[10px] ring-overtimeRing bg-overtimeBg' : 'ring-8 ring-timerRing'}`}>
        
      {/* ІНДИКАТОР КРОКІВ */}
      {!showModeButtons && activeSteps && activeSteps.length > 0 && (
        <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-2 px-6">
          
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em] animate-in fade-in zoom-in duration-500">
            Крок {Number(currentStepIndex) + 1} з {activeSteps.length}
          </span>
          
          <div className="flex justify-center gap-1.5 w-full">
            {activeSteps.map((_, index) => (
              <div 
                key={index}
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  index === currentStepIndex 
                    ? 'w-8 bg-accent shadow-theme-sm' 
                    : index < currentStepIndex 
                      ? 'w-4 bg-emerald-400 shadow-sm' 
                      : 'w-4 bg-containerBorder'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ПАНЕЛЬ ШВИДКИХ РЕЖИМІВ */}
      {showModeButtons && (
        <div className="flex space-x-2 mb-8 bg-activeTaskBg p-2 rounded-2xl animate-in fade-in zoom-in duration-500">
          <button onClick={() => setMode(25)} className="px-4 py-2 rounded-xl hover:bg-containerBg transition-all text-xs font-black text-accentHover flex items-center gap-1">
            <Target size={14}/> 25m
          </button>
          <button onClick={() => setMode(5)} className="px-4 py-2 rounded-xl hover:bg-containerBg transition-all text-xs font-black text-accentHover flex items-center gap-1">
            <Coffee size={14}/> 5m
          </button>
          <button onClick={() => setMode(15)} className="px-4 py-2 rounded-xl hover:bg-containerBg transition-all text-xs font-black text-accentHover flex items-center gap-1">
            <Brain size={14}/> 15m
          </button>
        </div>
      )}

      {!showModeButtons && <div className="h-6" />}

      {/* ЦИФРИ ТАЙМЕРА */}
<h1 className={`text-7xl lg:text-8xl font-black mb-6 tracking-tighter transition-all duration-500 
  ${isWarning ? 'animate-pulse text-accent drop-shadow-lg' : 
    /* Додаємо animate-pulse сюди 👇 */
    isOvertime ? 'animate-pulse text-overtimeText scale-105 drop-shadow-lg' : 'text-accentHover'}`}>
  {formatTime(seconds)}
</h1>

      {/* ПОТОЧНИЙ КРОК */}
      <div className="text-center px-4 min-h-[4rem] flex flex-col items-center justify-center mb-10">
        <p className="text-md lg:text-lg font-bold text-accentMuted italic leading-tight">
          ✨ {activeTaskText}
        </p>
        {!showModeButtons && activeSteps && activeSteps[currentStepIndex + 1] && (
          <p className="text-[10px] font-black text-accentMuted opacity-80 mt-2 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-1">
            Далі: {activeSteps[currentStepIndex + 1].text}
          </p>
        )}
      </div>

      {/* КЕРУВАННЯ */}
      <div className="flex space-x-8 mb-8 items-center">
        <button 
          onClick={handleTogglePlay} 
          className={`w-24 h-24 rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center 
            ${isRunning 
              ? 'bg-containerBorder text-accent hover:bg-accentMuted shadow-theme-sm' 
              : 'bg-accent text-accentText hover:bg-accentHover shadow-theme-lg' 
            }`}
        >
          {isRunning ? <Pause size={42} fill="currentColor" strokeWidth={0} /> : <Play size={42} fill="currentColor" className="ml-1" strokeWidth={0} />}
        </button>
        <button 
          onClick={() => { setIsRunning(false); setSeconds(25 * 60); }} 
          className="w-20 h-20 bg-activeTaskBg text-accentMuted rounded-full hover:bg-containerBorder hover:text-accent transition-all active:scale-90 shadow-sm flex items-center justify-center"
        >
          <RefreshCw size={32} strokeWidth={3} />
        </button>
      </div>

      {/* НАВІГАЦІЯ ПО КРОКАХ */}
      {!showModeButtons && activeSteps && activeSteps.length > 0 && (
        <div className="w-full max-w-xs space-y-4">
          {isLastStep ? (
            <button 
              onClick={completeTask}
              className="w-full py-5 bg-emerald-400 text-white rounded-[28px] font-black text-lg shadow-lg hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              ЗАКРИТИ ЗАДАЧУ <Check size={24} strokeWidth={4} /> 🌸
            </button>
          ) : (
            <button 
              onClick={handleNextStep}
              className="w-full py-5 bg-accent text-accentText rounded-[28px] font-black text-lg shadow-theme-lg hover:bg-accentHover active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              НАСТУПНИЙ КРОК <ChevronRight size={24} />
            </button>
          )}

          {currentStepIndex > 0 && (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handlePrevStep();
              }}
              className="w-full flex items-center justify-center gap-2 text-accentMuted font-black text-[11px] uppercase tracking-widest hover:text-accent transition-colors"
            >
              <ChevronLeft size={14} /> повернутись назад
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Timer;