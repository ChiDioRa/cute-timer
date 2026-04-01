import { CheckCircle2, Circle, Clock, Plus, Wand2, Trash2 } from 'lucide-react';

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
  onSync,
  onDeleteTask,
}) {
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

      {/* СПИСОК ЗАДАЧ */}
      <div className="space-y-4 w-full pb-10">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => !task.completed && onTaskClick(task.id)}
            className={`group flex items-center justify-between p-6 rounded-[35px] cursor-pointer transition-all duration-500 ${
              task.completed 
                ? 'bg-containerBg opacity-60 border-4 border-transparent' 
                : activeTaskId === task.id 
                  ? 'bg-containerBg border-4 border-containerBorder shadow-theme-lg scale-[1.02]' 
                  : 'bg-containerBg/80 border-4 border-transparent hover:bg-containerBg hover:shadow-theme-sm'
            }`}
          >
            <div className="flex items-center space-x-5 flex-1">
              {/* ГАЛОЧКА (Кнопка завершення/скасування) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleComplete(task.id);
                }}
                className={`transition-all duration-500 transform active:scale-50 ${
                  task.completed ? 'text-emerald-400 scale-110' : 'text-containerBorder group-hover:text-accentMuted'
                }`}
              >
                {task.completed ? (
                  <CheckCircle2 size={24} strokeWidth={2.5} className="animate-in zoom-in duration-300" />
                ) : (
                  <Circle size={24} strokeWidth={2.5} />
                )}
              </button>

              <div className="flex flex-col">
                <span className={`text-sm lg:text-base transition-all duration-500 leading-tight ${
                  task.completed ? 'font-medium text-accentMuted line-through decoration-containerBorder decoration-1' : 'font-bold text-appText'
                }`}>
                  {task.text}
                </span>
                
{!task.completed && task.totalTime && (
  <div className="flex items-center gap-1.5 mt-1">
    <Clock size={12} className="text-accentMuted" />
    <span className="text-[10px] font-black text-accentMuted uppercase tracking-widest">
      {task.totalTime} хв всього
    </span>
  </div>
)}
                
              </div>
            </div>
            
            {/* БЕЙДЖ "ЗАРАЗ" */}
            {activeTaskId === task.id && !task.completed && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-activeTaskBg rounded-full animate-pulse">
                <div className="w-2 h-2 bg-accent rounded-full shadow-theme-sm" />
                <span className="text-[9px] font-black text-accent uppercase tracking-widest">Зараз</span>
              </div>
            )}
            
            {/* КНОПКА ВИДАЛЕННЯ */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); 
                onDeleteTask(task.id);
              }}
              className="opacity-0 group-hover:opacity-100 ml-2 p-2 text-containerBorder hover:text-accent hover:bg-activeTaskBg rounded-full transition-all duration-300"
              title="Видалити задачу"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

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
      </div>
    </div>
  );
}

export default TaskList;