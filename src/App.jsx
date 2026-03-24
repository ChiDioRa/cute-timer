import { useState } from 'react';
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
    <div className={`min-h-screen flex flex-col items-center p-6 lg:p-12 transition-all duration-1000 ${logic.seconds < 0 ? 'bg-rose-100' : 'bg-pink-50'}`}>
      
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

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 items-start justify-center">
        
        {/* ЛІВА КОЛОНКА: ТАЙМЕР ТА МАРШРУТ */}
        <div className="w-full max-w-md flex flex-col items-center">
          {logic.activeSteps.length > 0 && (
            <button 
              onClick={logic.resetToMain} 
              className="mb-6 self-start text-pink-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-[-4px] transition-all"
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
            speak={logic.speak} // Передаємо функцію озвучки в таймер
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
              <h2 className="text-3xl font-black text-pink-600 tracking-tight uppercase">Задачі</h2>
              
              <div className="flex gap-2">
                {/* КНОПКА СОРТУВАННЯ */}
                <button 
                  onClick={() => setSortMode(sortMode === 'newest' ? 'shortest' : 'newest')}
                  className="px-4 py-2 bg-white/80 hover:bg-white rounded-2xl text-pink-400 transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-pink-50"
                >
                  {sortMode === 'newest' ? <SortAsc size={14} /> : <Clock size={14} />}
                  {sortMode === 'newest' ? "Нові" : "Швидкі"}
                </button>

               {/* КНОПКА СИНХРОНІЗАЦІЇ */}
                <button 
                  onClick={logic.syncWithNotion} 
                  className="p-3 bg-white hover:bg-pink-50 rounded-2xl text-pink-400 shadow-sm transition-all active:scale-90 border border-pink-50"
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
              
              // ✨ ПІДКЛЮЧАЄМО НАШУ НОВУ ФУНКЦІЮ ✨
              onToggleComplete={logic.toggleTaskStatus} 

              onAddTask={(e) => e.preventDefault()} 
              newTaskText="" 
              setNewTaskText={()=>{}}
            />
        </div>
      </div>
    </div>
  );
}

export default App;