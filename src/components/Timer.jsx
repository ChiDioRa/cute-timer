import React from 'react';
import { Heart, Play, Pause, RefreshCw, ChevronLeft, Check, 
  Sparkles, FastForward, Star, Cat, Flower, Leaf
} from 'lucide-react';

function Timer({ 
  seconds, isRunning, setIsRunning, setSeconds, 
  activeTaskText, activeSteps, currentStepIndex, 
  handleCompleteStep, handleSkipStep, handlePrevStep,
  completeTask, speak, finishTime, remainingStepsCount, theme
}) {
  
  const [isSuccess, setIsSuccess] = React.useState(false);

  const triggerSuccess = () => {
    setIsSuccess(true);
    speak("Чудова робота!");
    setTimeout(() => setIsSuccess(false), 1000); 
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentStep = activeSteps?.[currentStepIndex];
  const nextStep = activeSteps?.[currentStepIndex + 1];
  const estimateMinutes = currentStep?.minutes || 0;
  const progressPercent = Math.min((seconds / (estimateMinutes * 60 || 1)) * 100, 100);

  const handleTogglePlay = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState) {
      speak(seconds === 0 ? `Починаємо: ${currentStep?.text}` : "Продовжуємо");
    } else {
      speak("Пауза");
    }
  };

  const particles = React.useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({ 
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 80, 
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
      size: 8 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 100
    }));
  }, [activeTaskText]);

  return (
    <div className={`relative bg-containerBg rounded-[45px] p-7 w-full max-w-md mx-auto flex flex-col items-center ring-6 ring-timerRing transition-all duration-700 
      ${isRunning 
        ? 'animate-glow scale-[1.01] shadow-[0_15px_30px_rgba(0,0,0,0.08)]' 
        : 'shadow-[0_10px_20px_rgba(0,0,0,0.05)]' 
      }`}>
      
      {/* МАГІЧНІ ЧАСТИНКИ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[45px]">
        {isRunning && particles.map((p) => (
          <React.Fragment key={p.id}>
            {theme === 'sakura' && (
              <Flower 
                className="animate-petal absolute top-[-10%] text-pink-300" 
                style={{ 
                  left: `${p.left}%`, 
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  width: p.size,
                  height: p.size,
                  '--tw-translate-x': `${p.drift}px`,
                  '--tw-translate-y': '300px'
                }} 
              />
            )}
            {theme === 'midnight' && (
              <Star 
                className="animate-star-bright absolute opacity-60"
                style={{ 
                  left: `${p.left}%`, 
                  top: `${p.top}%`, 
                  animationDelay: `${p.delay}s`,
                  width: p.size / 2,
                  height: p.size / 2
                }} 
              />
            )}
            {theme === 'matcha' && (
              <Leaf 
                className="animate-leaf absolute top-[-10%]" 
                style={{ 
                  left: `${p.left}%`, 
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration + 2}s`,
                  width: p.size,
                  height: p.size,
                  '--tw-translate-x': `${p.drift}px`,
                  '--tw-translate-y': '300px'
                }} 
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* МАСКОТ-КОТИК */}
      <div className={`absolute -top-12 transition-all duration-700 
        ${isRunning || isSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className={`bg-white p-2.5 rounded-2xl shadow-lg border-2 border-accent flex items-center justify-center
          ${isSuccess ? 'animate-bounce' : 'animate-cat'}`}>
          <Cat size={32} className="text-accent fill-accent/10" />
        </div>
      </div>

      {/* 1. СЕРДЕЧКА (З АНІМАЦІЄЮ) */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="flex justify-center gap-2">
          {activeSteps?.map((_, index) => {
            const isFilled = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            return (
              <div 
                key={index} 
                className={`transition-all duration-500 ${isFilled ? 'animate-heart-float' : ''}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <Heart 
  size={16} 
  className={`transition-all duration-500 
    ${isFilled ? 'fill-accent text-accent scale-110' : 'text-accent/20 stroke-[2.5px]'} 
    ${isCurrent && isRunning ? 'animate-heart-pulse' : ''}
  `} 
/>
              </div>
            );
          })}
        </div>
        <span className="text-[10px] font-black text-accentMuted tracking-[0.2em] opacity-40">
          {currentStepIndex + 1} / {activeSteps?.length || 0}
        </span>
      </div>

      {/* 2. ЦЕНТР: ТАЙМЕР */}
      <div className="relative flex flex-col items-center mb-6">
        {isRunning && (
          <>
            <Star size={12} className="absolute -top-6 -left-10 text-yellow-300 animate-sparkle [--tw-translate-x:-30px] [--tw-translate-y:-20px]" />
            <Star size={10} className="absolute top-12 -right-12 text-pink-300 animate-sparkle [--tw-translate-x:25px] [--tw-translate-y:15px]" />
            <div key={seconds} className="absolute -right-14 top-2 text-accent font-black text-sm animate-xp-float">+1 XP</div>
          </>
        )}

        <h1 className={`text-7xl lg:text-8xl font-black tracking-tighter text-appText mb-5 transition-all duration-500 font-timer
          ${isRunning ? 'scale-110 drop-shadow-md' : 'scale-100'}`}>
          {formatTime(seconds)}
        </h1>

        <div className="w-52">
           <div className="h-3 w-full bg-activeTaskBg rounded-full border border-containerBorder p-0.5 shadow-inner">
              <div 
                className="h-full bg-accent rounded-full transition-all duration-1000 shadow-[0_0_15px_var(--accent)]"
                style={{ width: `${progressPercent}%` }}
              />
           </div>
           <div className="flex justify-between mt-2 opacity-50 text-[9px] font-black uppercase tracking-widest text-accent">
              <span>PROGRESS</span>
              <span>PLAN: {estimateMinutes} MIN</span>
           </div>
        </div>
      </div>

      {/* 3. ДЕТАЛІ МАРШРУТУ */}
      <div className="w-full flex justify-between px-8 border-b border-containerBorder/50 pb-4">
        <div className="flex flex-col items-start gap-1">
           <span className="text-[10px] font-black text-accentMuted uppercase tracking-widest opacity-40">FINISH APPROX</span>
           <span className="text-xl font-black text-appText leading-none">{finishTime || "--:--"}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
           <span className="text-[10px] font-black text-accentMuted uppercase tracking-widest opacity-40">STEPS LEFT</span>
           <span className="text-xl font-black text-appText leading-none">{remainingStepsCount} кр.</span>
        </div>
      </div>

      {/* 4. ТЕКСТ ЗАДАЧІ ТА ПРЕВ'Ю */}
      <div className="w-full mb-8 space-y-4 pt-4">
<div className="text-center p-6 bg-activeTaskBg/20 rounded-[35px] border border-containerBorder/20 min-h-[5.5rem] flex items-center justify-center relative overflow-hidden shadow-[0_2px_2px_var(--shadow-color)]">
          <p className="text-lg font-bold text-appText leading-tight italic z-10">
            <Sparkles size={16} className={`inline mr-2 text-accent ${isRunning ? 'animate-pulse' : ''}`} />
            {currentStep?.text || activeTaskText}
          </p>
        </div>

        {nextStep && (
          /* ✨ ОНОВЛЕНИЙ БЛОК NEXT: Більше простору для 2 абзаців ✨ */
          <div className="px-6 py-4 bg-activeTaskBg/10 rounded-[30px] border border-dashed border-containerBorder/30 transition-all duration-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] opacity-50">NEXT UP:</span>
              <div className="h-[1px] flex-1 bg-accent/10" />
            </div>
            <p className="text-[13px] font-bold text-appText opacity-50 leading-relaxed text-left whitespace-pre-line line-clamp-4">
              {nextStep.text}
            </p>
          </div>
        )}
      </div>

      {/* 5. УНІФІКОВАНА ПАНЕЛЬ КЕРУВАННЯ */}
      <div className="w-full bg-activeTaskBg/40 p-3 rounded-full border border-containerBorder shadow-inner flex items-center justify-between px-6">
        <button 
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className={`p-2 transition-all ${currentStepIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-accentMuted hover:text-accent'}`}
        >
          <ChevronLeft size={26} />
        </button>

        <button onClick={() => { setSeconds(0); speak("Скинуто"); }} className="p-2 text-accentMuted/30 hover:text-accent transition-colors">
          <RefreshCw size={20} />
        </button>

        <button 
          onClick={handleTogglePlay} 
          className={`w-16 h-16 rounded-full transition-all duration-500 active:scale-95 flex items-center justify-center shadow-lg border-2 border-white/10
            ${isRunning ? 'bg-containerBorder text-accent' : 'bg-accent text-accentText hover:scale-105'}`}
        >
          {isRunning ? <Pause size={32} fill="currentColor" strokeWidth={0} /> : <Play size={32} fill="currentColor" className="ml-1" strokeWidth={0} />}
        </button>

        <button onClick={() => { handleSkipStep(); speak("Пропущено"); }} className="p-2 text-accentMuted/30 hover:text-accent transition-colors">
          <FastForward size={22} />
        </button>

        <button 
  onClick={() => {
    triggerSuccess(); 
    currentStepIndex === (activeSteps?.length - 1) ? completeTask() : handleCompleteStep();
  }}
  className={`p-4 rounded-[22px] transition-all active:scale-90 flex items-center justify-center shadow-lg
    ${currentStepIndex === (activeSteps?.length - 1) 
      ? 'bg-emerald-400 text-white shadow-[0_0_25px_rgba(52,211,153,0.5)] animate-pulse' // ✨ Глоу та пульсація на фініші
      : 'bg-accent text-accentText'
    }`}
>
  <Check size={32} strokeWidth={4} />
</button>
      </div>
    </div>
  );
}

export default Timer;