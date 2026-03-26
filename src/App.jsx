import { useState, useEffect } from 'react';
import { useTimerLogic } from './hooks/useTimerLogic';
import Timer from './components/Timer';
import TaskList from './components/TaskList';
import ActiveTaskDetails from './components/ActiveTaskDetails';
import { ArrowLeft, SortAsc, Clock, RefreshCw } from 'lucide-react';

function App() {
  const logic = useTimerLogic();
  
  // СТАН ДЛЯ СОРТУВАННЯ
  const [sortMode, setSortMode] = useState('newest'); // 'newest' або 'shortest'

  const activeTask = logic.tasks.find(t => t.id === logic.activeTaskId);
  const currentStep = logic.activeSteps[logic.currentStepIndex];
  
  // Додаємо збереження теми в пам'ять браузера, щоб вона не злітала після оновлення
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'sakura';
  });
  
// Зберігаємо зміну теми
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    // 🔥 МАГІЯ ТУТ: Вішаємо тему на самий корінь сайту (тег html)
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ЛОГІКА СОРТУВАННЯ СПИСКУ ЗАДАЧ
  const sortedTasks = [...logic.tasks].sort((a, b) => {
    if (sortMode === 'shortest') {
      const timeA = logic.taskTimes[a.id] || 0;
      const timeB = logic.taskTimes[b.id] || 0;
      return timeA - timeB; // Від найкоротших до найдовших
    }
    return 0; // Порядок за замовчуванням з Notion
  });

  return (
    <div className={`min-h-screen bg-appBg text-appText p-4 sm:p-8 font-sans transition-colors duration-700`}>
      {/* ✨ ТУТ МАГІЯ: class theme-${theme} активує потрібні CSS-змінні */}
      
      {/* ПЕРЕМИКАЧ ТЕМ (Фіксований у правому верхньому куті) */}
      <div className="w-full max-w-5xl mx-auto flex justify-end gap-3 mb-6 relative z-50">
        <button 
          onClick={() => setTheme('sakura')}
          className={`w-8 h-8 rounded-full bg-pink-300 hover:scale-110 transition-transform ${theme === 'sakura' ? 'ring-4 ring-pink-200 shadow-lg' : 'opacity-50 hover:opacity-100'}`}
          title="Sakura Mode 🌸"
        />
        <button 
          onClick={() => setTheme('midnight')}
          className={`w-8 h-8 rounded-full bg-slate-800 hover:scale-110 transition-transform ${theme === 'midnight' ? 'ring-4 ring-fuchsia-600/50 shadow-lg' : 'opacity-50 hover:opacity-100'}`}
          title="Midnight Mode 🌙"
        />
        <button 
          onClick={() => setTheme('matcha')}
          className={`w-8 h-8 rounded-full bg-emerald-300 hover:scale-110 transition-transform ${theme === 'matcha' ? 'ring-4 ring-emerald-200 shadow-lg' : 'opacity-50 hover:opacity-100'}`}
          title="Matcha Mode 🍵"
        />
      </div>

      {/* АУДІО-РЕСУРСИ (ПРИХОВАНІ) */}
      <div className="hidden">
        <audio ref={logic.halfwayAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" preload="auto" />
        <audio 
          ref={logic.warningAudioRef} 
          src="https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3" 
          onCanPlay={(e) => e.target.volume = 0.3} 
          preload="auto" 
        />
        <audio ref={logic.finishAudioRef} src="https://assets.mixkit.co/active_storage/sfx/1071/1071-preview.mp3" preload="auto" />
      </div>

      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 items-start justify-center">
        
        {/* ЛІВА КОЛОНКА: ТАЙМЕР ТА МАРШРУТ */}
        <div className="w-full max-w-md flex flex-col items-center">
          {logic.activeSteps.length > 0 && (
            <button 
              onClick={logic.resetToMain} 
              className="mb-6 self-start text-accent font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-[-4px] transition-all"
            >
              <ArrowLeft size={16} /> Назад до списку
            </button>
          )}

          <Timer 
            seconds={logic.seconds} 
            isRunning={logic.isRunning} 
            setIsRunning={logic.setIsRunning} 
            setSeconds={logic.setSeconds}
            showModeButtons={logic.activeSteps.length === 0}
            activeTaskText={currentStep ? currentStep.text : (activeTask?.text || 'Оберіть задачу')}
            activeSteps={logic.activeSteps}
            currentStepIndex={logic.currentStepIndex}
            handleNextStep={logic.handleNextStep}
            handlePrevStep={logic.handlePrevStep}
            completeTask={logic.completeTask}
            speak={logic.speak} 
          />

          {/* ДЕТАЛІ ЗАДАЧІ (Маршрут та час) */}
          {logic.activeSteps.length > 0 && (
            <ActiveTaskDetails 
              activeSteps={logic.activeSteps}
              currentStepIndex={logic.currentStepIndex}
              seconds={logic.seconds}
            />
          )}
        </div>

        {/* ПРАВА КОЛОНКА: СПИСОК ЗАДАЧ */}
        <div className={`w-full max-w-md ${logic.activeSteps.length > 0 ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-3xl font-black text-appText tracking-tight uppercase">Задачі</h2>
              
              <div className="flex gap-2">
                {/* КНОПКА СОРТУВАННЯ */}
                <button 
                  onClick={() => setSortMode(sortMode === 'newest' ? 'shortest' : 'newest')}
                  className="px-4 py-2 bg-containerBg hover:bg-opacity-100 rounded-2xl text-accent transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-containerBorder"
                >
                  {sortMode === 'shortest' ? <SortAsc size={14} /> : <Clock size={14} />}
                  {sortMode === 'shortest' ? "Нові" : "Швидкі"}
                </button>

               {/* КНОПКА СИНХРОНІЗАЦІЇ */}
                <button 
                  onClick={logic.syncWithNotion} 
                  className="p-3 bg-containerBg hover:bg-containerBorder rounded-2xl text-accent shadow-sm transition-all active:scale-90 border border-containerBorder"
                >
                  <RefreshCw size={20} className={logic.isSyncing ? 'animate-spin' : ''} />
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