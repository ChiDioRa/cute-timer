import { useState, useEffect } from "react";
import { useTimerLogic } from "./hooks/useTimerLogic";
import Timer from "./components/Timer";
import TaskList from "./components/TaskList";
import Profile from "./components/Profile";
import ActiveTaskDetails from "./components/ActiveTaskDetails";
import {
  ArrowLeft,
  SortAsc,
  Clock,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";

function App() {
  const logic = useTimerLogic();
  const [sortMode, setSortMode] = useState("newest");
  const activeTask = logic.tasks.find((t) => t.id === logic.activeTaskId);
  const currentStep = logic.activeSteps[logic.currentStepIndex];

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "sakura";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const sortedTasks = [...logic.tasks].sort((a, b) => {
    if (sortMode === "shortest") {
      const timeA = logic.taskTimes[a.id] || 0;
      const timeB = logic.taskTimes[b.id] || 0;
      return timeA - timeB;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-appBg text-appText p-4 sm:p-8 font-sans transition-colors duration-700">
      {/* 🌸 ПАНЕЛЬ ПРОФІЛЮ */}
      <Profile
        level={logic.level}
        xpInLevel={logic.xpInLevel}
        energy={logic.energy}
        setEnergy={logic.setEnergy}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Примарний стягувач: тримає блоки поруч, але його не видно ✨ */}
<div className="-mt-12 h-8 pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-15 items-start justify-center">
        {/* ЛІВА КОЛОНКА: ТАЙМЕР ТА МАРШРУТ */}
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          {logic.activeSteps.length > 0 && (
            <button
              onClick={logic.resetToMain}
              className="mb-2 self-start text-accent font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-[-4px] transition-all"
            >
              <ArrowLeft size={16} /> Назад до списку
            </button>
          )}

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
            completeTask={logic.toggleTaskStatus} // Використовуємо toggleTaskStatus
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
              completeTask={logic.toggleTaskStatus} // ✨ Замінив logic.completeTask на logic.toggleTaskStatus ✨
            />
          )}
        </div>

        {/* ПРАВА КОЛОНКА: СПИСОК ЗАДАЧ */}
        <div
          className={`w-full max-w-md ${logic.activeSteps.length > 0 ? "hidden lg:block" : "block"}`}
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-3xl font-black text-appText tracking-tight uppercase">
              Задачі
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSortMode(sortMode === "newest" ? "shortest" : "newest")
                }
                className="px-4 py-2.5 bg-containerBg rounded-2xl text-accent text-[10px] font-black uppercase tracking-widest border border-containerBorder shadow-sm flex items-center gap-2 transition-all active:scale-95"
              >
                {sortMode === "shortest" ? (
                  <SortAsc size={14} />
                ) : (
                  <Clock size={14} />
                )}
                {sortMode === "shortest" ? "Нові" : "Швидкі"}
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
          />
        </div>
      </div>
    </div>
  );
}

export default App;
