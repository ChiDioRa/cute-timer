import React from "react";
import { Clock, Cat, Hourglass, Star, Check } from "lucide-react";

export default function ActiveTaskDetails({
  activeSteps,
  currentStepIndex,
  seconds,
  completeTask,
}) {
  const formatTimeHuman = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = Math.round(totalMins % 60);
    return h > 0 ? `${h}г ${m > 0 ? `${m}хв` : ""}` : `${m}хв`;
  };

  const remainingMinutes = Math.max(
    0,
    Math.round(
      activeSteps
        .slice(currentStepIndex + 1)
        .reduce((sum, s) => sum + s.minutes, 0) +
        seconds / 60,
    ),
  );

  return (
    <div className="w-full max-w-lg mx-auto mt-12 mb-24 px-1 animate-in fade-in duration-1000">
      {/* 1. ЗАГОЛОВОК */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-accent font-black text-sm uppercase tracking-[0.3em] opacity-90">
            Маршрут задачі
          </h3>
          <span className="text-[10px] font-bold text-accentMuted opacity-50 uppercase tracking-widest">
            Твій ігровий шлях
          </span>
        </div>
        <div className="flex items-center gap-2.5 bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10">
          <Hourglass size={14} className="text-accent animate-spin-slow" />
          <span className="text-xs font-black text-appText opacity-80">
            {formatTimeHuman(remainingMinutes)}
          </span>
        </div>
      </div>

      <div className="relative flex flex-col w-full">
        <div className="space-y-0">
          {" "}
          {/* Прибрали gap, щоб лінії стикувалися щільно */}
          {activeSteps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isLast = index === activeSteps.length - 1;
            const isFirst = index === 0;

            return (
              <div
                key={index}
                className="relative flex items-stretch min-h-[80px]"
              >
                {/* ЛІВА КОЛОНКА */}
                <div className="relative w-[50px] shrink-0 flex flex-col items-center">
                  {/* ✨ ГЕОМЕТРИЧНО ПРАВИЛЬНА ЛІНІЯ ✨ */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] z-0">
                    {/* Верхній сегмент (від верху до вузлика) */}
                    {!isFirst && (
                      <div className="absolute top-0 h-[40px] w-full">
                        <div className="w-full h-full bg-accent/20" />
                        <div
                          className={`absolute top-0 w-full bg-accent transition-all duration-700 ${isCompleted || isActive ? "h-full" : "h-0"}`}
                        />
                      </div>
                    )}
                    {/* Нижній сегмент (від вузлика до низу) */}
                    {!isLast && (
                      <div className="absolute top-[40px] bottom-0 w-full">
                        <div className="w-full h-full bg-accent/20" />
                        <div
                          className={`absolute top-0 w-full bg-accent transition-all duration-700 ${isCompleted ? "h-full" : "h-0"}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* ВУЗЛИК (Завжди на висоті 40px) */}
                  <div className="relative h-[80px] flex items-center justify-center z-10">
                    {/* 🐾 КОТИК (Зліва від номера) */}
                    {isActive && (
                      <div className="absolute right-[35px] -top-[1px] animate-bounce z-30">
                        <Cat
                          size={22}
                          className="text-accent fill-accent/5 -rotate-12 drop-shadow-md"
                        />
                      </div>
                    )}

                    <div
                      className={`rounded-full flex items-center justify-center transition-all duration-500
                      ${
                        isActive
                          ? "w-11 h-11 bg-accent border-2 border-accent text-accentText shadow-[0_0_20px_var(--accent)] scale-110 ring-[6px] ring-accent/10"
                          : isCompleted
                            ? "w-3.5 h-3.5 bg-accent"
                            : "w-3.5 h-3.5 bg-white border-2 border-containerBorder"
                      }`}
                    >
                      {isActive && (
                        <span className="text-[13px] font-bold">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ПРАВА КОЛОНКА (Картка) */}
                <div className="flex-1 py-3 pl-2 flex flex-col justify-center">
                  <div
                    className={`transition-all duration-500 rounded-[28px] ${
                      isActive
                        ? "bg-white p-6 border border-accent/20 shadow-theme-lg"
                        : "p-3"
                    }`}
                  >
                    <p
                      className={`leading-tight transition-all ${
                        isActive
                          ? "text-[16px] font-bold text-appText"
                          : isCompleted
                            ? "text-[14px] font-bold text-accentMuted opacity-40"
                            : "text-[15px] font-bold text-accent opacity-100"
                      }`}
                    >
                      {step.text}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${
                          isActive
                            ? "bg-accent text-accentText border-accent"
                            : "bg-accent/5 text-accent border-accent/10"
                        }`}
                      >
                        <Clock
                          size={12}
                          className={
                            isActive ? "text-accentText" : "text-accent"
                          }
                        />
                        <span className="text-[11px] font-bold uppercase tracking-[0.1em]">
                          {formatTimeHuman(step.minutes)}
                        </span>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-accent uppercase bg-accent/5 px-2.5 py-1 rounded-full border border-accent/10 shadow-sm">
                          {/* ✨ ОНОВЛЕНИЙ ІНДИКАТОР ✨ */}
                          <div className="relative flex items-center justify-center w-2 h-2 ml-0.5">
                            {/* Статична маленька крапка (центр) */}
                            <div className="w-1 h-1 rounded-full bg-accent z-10" />
                            {/* Пульсуюча хвиля (вона тепер менша і делікатніша) */}
                            <div className="absolute w-full h-full rounded-full bg-accent animate-ping opacity-60" />
                          </div>

                          <span className="tracking-widest">Зараз</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* ✨ ТЕМАТИЧНА ФІНАЛЬНА КНОПКА ✨ */}
          <div className="mt-3 flex justify-center animate-in slide-in-from-bottom-4 duration-1000">
            <button
              onClick={completeTask}
              className="relative group flex items-center gap-5 bg-containerBg px-12 py-5 rounded-[28px] border-2 border-accent shadow-theme-lg transition-all hover:scale-105 active:scale-95"
            >
              {/* Маскот тепер теж у кольорі теми */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 animate-cat-peek z-30">
                <Cat
                  size={24}
                  className="text-accent fill-accent/5 drop-shadow-sm -rotate-6"
                />
              </div>

              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent opacity-60">
                  Квест пройдено
                </span>
                <span className="text-lg font-bold tracking-tight text-appText">
                  Завершити задачу
                </span>
              </div>

              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                <Check size={28} strokeWidth={4} className="text-accentText" />
              </div>

              {/* Іскорки тепер сяють кольором теми */}
              <Star
                size={10}
                className="absolute -top-1 -right-2 text-accent animate-pulse opacity-50"
              />
              <Star
                size={6}
                className="absolute -bottom-2 -left-3 text-accent animate-bounce opacity-30"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
