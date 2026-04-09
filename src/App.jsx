import { useState, useEffect } from "react";
import { useTimerLogic } from "./hooks/useTimerLogic";
import Timer from "./components/Timer";
import TaskList from "./components/TaskList";
import Profile from "./components/Profile";
import ActiveTaskDetails from "./components/ActiveTaskDetails";
import { ArrowLeft, SortAsc, Clock, RefreshCw, Timer as TimerIcon, Coffee } from "lucide-react"; // ✨ Оновлені іконки
import GameBoard from './components/IdleGame/GameBoard';
import { useIdleGame } from './hooks/useIdleGame';

function App() {
  const logic = useTimerLogic();

  // Використовуємо активну задачу та крок прямо з logic
  const activeTask = logic.tasks.find((t) => t.id === logic.activeTaskId);
  const currentStep = logic.activeSteps[logic.currentStepIndex];

  const [activeTab, setActiveTab] = useState('timer'); // 'timer' або 'farm'
  const idleGame = useIdleGame({ isTimerActive: logic.isRunning });

  // Тема оформлення
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "sakura";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // sortedTasks — це просто logic.tasks
  const sortedTasks = logic.tasks;

  return (
    // ✨ Додали pb-24, щоб контент не ховався під новим нижнім меню
    <div className="min-h-screen bg-appBg text-appText p-4 sm:p-8 font-sans transition-colors duration-700 pb-24" data-theme={theme}>
      
      {/* 🌸 ПАНЕЛЬ ПРОФІЛЮ (залишається видимою завжди) */}
{/* 🌸 ПАНЕЛЬ ПРОФІЛЮ */}
      <Profile
        level={logic.level}
        xpInLevel={logic.xpInLevel}
        energy={logic.energy}
        setEnergy={logic.setEnergy}
        theme={theme}
        setTheme={setTheme}
        taskTotals={logic.taskTotals}
        // ✨ ОСЬ ЦІ ДВА РЯДКИ РОБЛЯТЬ КНОПКИ ФУНКЦІОНАЛЬНИМИ:
        activeTab={activeTab}       
        setActiveTab={setActiveTab} 
      />

      <div
        className="-mt-12 lg:-mt-16 h-8 pointer-events-none"
        aria-hidden="true"
      />

      {/* ✨ МАГІЯ ПЕРЕМИКАННЯ ЕКРАНІВ */}
      {activeTab === 'timer' ? (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 lg:gap-15 items-start justify-center">
          
          {/* ЛІВА КОЛОНКА: ТАЙМЕР ТА МАРШРУТ */}
          <div className={`w-full max-w-md flex flex-col items-center gap-4 ${logic.isTimerOpen ? "flex" : "hidden lg:flex"}`}>
            
            <button
              onClick={logic.resetToMain}
              className="mb-2 mt-3 self-start text-accent font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-[-4px] transition-all"
            >
              <ArrowLeft size={16} /> Назад до списку
            </button>

            <Timer
              seconds={logic.seconds}
              isRunning={logic.isRunning}
              setIsRunning={logic.setIsRunning}
              setSeconds={logic.setSeconds}
              activeTaskText={
                currentStep
                  ? currentStep.text
                  : activeTask?.text || "Оберіть задачу"
              }
              activeSteps={logic.activeSteps}
              currentStepIndex={logic.currentStepIndex}
              handleCompleteStep={logic.handleCompleteStep}
              handleSkipStep={logic.handleSkipStep}
              handlePrevStep={logic.handlePrevStep}
              completeTask={logic.toggleTaskStatus}
              onReset={logic.handleResetTimer} // 👈 ДОДАЙ ЦЕЙ РЯДОК
              onToggle={logic.toggleTimer}
              speak={logic.speak}
              finishTime={logic.finishTime}
              remainingStepsCount={logic.remainingStepsCount}
              theme={theme}
            />

            {logic.activeSteps.length > 0 && (
              <ActiveTaskDetails
                activeSteps={logic.activeSteps}
                currentStepIndex={logic.currentStepIndex}
                seconds={logic.seconds}
                completeTask={logic.toggleTaskStatus}
              />
            )}
          </div>

          {/* ПРАВА КОЛОНКА: СПИСОК ЗАДАЧ */}
          <div className={`w-full max-w-md ${logic.isTimerOpen ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-3xl font-black text-appText tracking-tight uppercase">
                Задачі
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    logic.setSortMode(
                      logic.sortMode === "newest" ? "shortest" : "newest",
                    )
                  }
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 transition-all active:scale-95
                    ${
                      logic.sortMode === "shortest"
                        ? "bg-accent text-white border-accent"
                        : "bg-containerBg text-accent border-containerBorder"
                    }`}
                >
                  {logic.sortMode === "shortest" ? (
                    <>
                      <Clock size={14} />
                      <span>Швидкі</span>
                    </>
                  ) : (
                    <>
                      <SortAsc size={14} />
                      <span>Нові</span>
                    </>
                  )}
                </button>

                <button
                  onClick={logic.syncWithNotion}
                  className="p-3 bg-containerBg rounded-2xl text-accent border border-containerBorder shadow-sm transition-all active:scale-90"
                >
                  <RefreshCw
                    size={20}
                    className={logic.isSyncing ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            <TaskList
              tasks={sortedTasks}
              activeTaskId={logic.activeTaskId}
              onTaskClick={logic.handleTaskClick}
              onSync={logic.syncWithNotion}
              isSyncing={logic.isSyncing}
              taskTimes={logic.taskTimes}
              onToggleComplete={logic.toggleTaskStatus}
              onAddTask={logic.handleAddTask}
              newTaskText={logic.newTaskText}
              setNewTaskText={logic.setNewTaskText}
              onGenerateSteps={logic.handleGenerateSteps}
              isGenerating={logic.isGenerating}
              onDeleteTask={logic.handleDeleteTask}
              taskTotals={logic.taskTotals}
              onToggleType={logic.toggleTaskType}        // ✅ БЕЗ КОМИ В КІНЦІ
              onIncrementRoutine={logic.incrementRoutine} // ✅ БЕЗ КОМИ В КІНЦІ
            />
          </div>
        </div>
      ) : (
        // ✨ ЕКРАН ФЕРМИ
        <GameBoard coins={idleGame.coins} isLoading={idleGame.isLoading} />
      )}

    </div>
  );
}

export default App;