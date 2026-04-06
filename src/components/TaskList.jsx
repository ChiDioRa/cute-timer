import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Wand2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function TaskList({ 
  tasks, 
  activeTaskId, 
  onTaskClick, 
  onToggleComplete, 
  onAddTask, 
  newTaskText, 
  setNewTaskText, 
  onGenerateSteps,
  isGenerating,
  onDeleteTask,
  taskTotals = {} // 👈 Приймаємо нашу статистику часу
}) {
  // Стан для відкриття/закриття списку завершених задач
  const [showCompleted, setShowCompleted] = useState(false);

  // ✨ Розділяємо задачі на дві групи
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="w-full flex flex-col space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
      
      {/* ФОРМА ДОДАВАННЯ */}
      <form onSubmit={onAddTask} className="relative group">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Що заплануємо?.."
          className="w-full p-6 pr-20 bg-containerBg backdrop-blur-md border-2 border-transparent focus:border-accentMuted focus:bg-containerBg rounded-[32px] outline-none transition-all font-bold text-accent placeholder:text-accentMuted shadow-theme-sm group-hover:shadow-theme-lg"
        />
        <button 
          type="submit"
          className="absolute right-3 top-3 p-4 bg-accent text-accentText rounded-[24px] hover:bg-accentHover transition-all shadow-theme-sm active:scale-95"
        >
          <Plus size={24} />
        </button>
      </form>

      <div className="w-full pb-10">
        
        {/* ✨ АКТИВНІ ЗАДАЧІ ✨ */}
        <div className="space-y-4">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task.id)}
              className={`group flex items-center justify-between p-6 rounded-[35px] cursor-pointer transition-all duration-500 ${
                activeTaskId === task.id 
                  ? 'bg-containerBg border-4 border-containerBorder shadow-theme-lg scale-[1.02]' 
                  : 'bg-containerBg/80 border-4 border-transparent hover:bg-containerBg hover:shadow-theme-sm'
              }`}
            >
              <div className="flex items-center space-x-5 flex-1">
<button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleComplete(task.id);
                  }}
                  className={`transition-all duration-500 transform active:scale-50 ${
                    task.checking ? 'text-emerald-400 scale-110' : 'text-containerBorder group-hover:text-accentMuted'
                  }`}
                >
                  {task.checking ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={2.5} />}
                </button>

                <div className="flex flex-col">
                  <span className={`text-sm lg:text-base font-bold transition-all duration-500 leading-tight ${
                    task.checking ? 'text-accentMuted line-through decoration-containerBorder decoration-1' : 'text-appText'
                  }`}>
                    {task.text}
                  </span>
                  
                  {task.totalTime > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={12} className="text-accentMuted" />
                      <span className="text-[10px] font-black text-accentMuted uppercase tracking-widest">
                        {task.totalTime} хв всього
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {activeTaskId === task.id && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-activeTaskBg rounded-full animate-pulse">
                  <div className="w-2 h-2 bg-accent rounded-full shadow-theme-sm" />
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">Зараз</span>
                </div>
              )}
              
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                className="opacity-0 group-hover:opacity-100 ml-2 p-2 text-containerBorder hover:text-accent hover:bg-activeTaskBg rounded-full transition-all duration-300"
                title="Видалити задачу"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {activeTasks.length === 0 && (
            <div className="text-center py-8 opacity-50 text-accent font-bold text-sm">
              Немає активних задач. Час відпочити! 🌸
            </div>
          )}
        </div>

        {/* КНОПКА ГЕНЕРАЦІЇ КРОКІВ */}
        <button
          onClick={onGenerateSteps}
          disabled={isGenerating}
          className={`w-full mt-6 py-4 px-6 rounded-[28px] border-2 border-dashed transition-all duration-500 flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em]
            ${isGenerating 
              ? 'border-containerBorder text-containerBorder cursor-wait' 
              : 'border-containerBorder text-accentMuted hover:border-accentMuted hover:text-accent hover:bg-activeTaskBg'
            }`}
        >
          <Wand2 size={16} className={isGenerating ? 'animate-bounce' : ''} />
          {isGenerating ? 'Магія в процесі...' : 'Згенерувати кроки на нові задачі'}
        </button>

        {/* ✨ ЗАВЕРШЕНІ ЗАДАЧІ (СПОЙЛЕР) ✨ */}
        {completedTasks.length > 0 && (
          <div className="mt-10">
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-3 w-full text-left opacity-60 hover:opacity-100 transition-opacity"
            >
              <div className="p-1 bg-containerBorder/30 rounded-full text-accent">
                {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-accent">
                Завершені задачі ({completedTasks.length})
              </span>
              <div className="flex-1 h-[1px] bg-containerBorder/50" />
            </button>

            {showCompleted && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-4 fade-in duration-500">
                {completedTasks.map((task) => {
                  
                  // МАГІЯ СТАТИСТИКИ: Порівнюємо план і факт
                  const planMinutes = task.totalTime || 0;
                  const factSeconds = taskTotals[task.id] || 0;
                  const factMinutes = Math.round(factSeconds / 60);
                  
                  // Якщо витратили більше часу, ніж планували — підсвітимо іншим кольором
                  const isOvertime = planMinutes > 0 && factMinutes > planMinutes;

                  return (
                    <div
                      key={task.id}
                      className="group flex flex-col p-4 px-5 rounded-[28px] bg-containerBg/40 border-2 border-transparent hover:bg-containerBg hover:border-containerBorder transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(task.id);
                            }}
                            className="text-emerald-400 hover:scale-110 transition-transform active:scale-90"
                            title="Повернути в роботу"
                          >
                            <CheckCircle2 size={22} strokeWidth={2.5} />
                          </button>
                          <span className="text-sm font-medium text-accentMuted line-through decoration-containerBorder decoration-1">
                            {task.text}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-containerBorder hover:text-rose-400 hover:bg-rose-400/10 rounded-full transition-all duration-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* БЛОК ПЛАН vs ФАКТ */}
                      <div className="flex items-center gap-4 mt-2 ml-10">
                        <div className="flex items-center gap-1.5 opacity-50">
                          <Clock size={12} className="text-accentMuted" />
                          <span className="text-[10px] font-black text-accentMuted uppercase tracking-widest">
                            План: {planMinutes} хв
                          </span>
                        </div>

                        {factMinutes > 0 && (
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${isOvertime ? 'bg-rose-400/10' : 'bg-emerald-400/10'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isOvertime ? 'text-rose-500' : 'text-emerald-500'}`}>
                              Факт: {factMinutes} хв
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default TaskList;