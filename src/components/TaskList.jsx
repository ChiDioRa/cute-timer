import { CheckCircle2, Circle, Clock, Plus } from 'lucide-react';

function TaskList({ 
  tasks, 
  activeTaskId, 
  onTaskClick, 
  onToggleComplete, // Тепер ця функція буде обробляти і завершення, і повернення
  onAddTask, 
  newTaskText, 
  setNewTaskText, 
  onSync,
  taskTimes = {} 
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
          className="w-full p-6 pr-20 bg-white/80 backdrop-blur-md border-2 border-transparent focus:border-pink-200 focus:bg-white rounded-[32px] outline-none transition-all font-bold text-pink-600 placeholder:text-pink-200 shadow-sm group-hover:shadow-md"
        />
        <button 
          type="submit"
          className="absolute right-3 top-3 p-4 bg-pink-500 text-white rounded-[24px] hover:bg-pink-600 transition-all shadow-lg shadow-pink-100 active:scale-95"
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
                ? 'bg-pink-50/50 border-4 border-transparent opacity-60' 
                : activeTaskId === task.id 
                  ? 'bg-white border-4 border-pink-100 shadow-xl scale-[1.02]' 
                  : 'bg-white/60 border-4 border-transparent hover:bg-white hover:shadow-md'
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
                  task.completed ? 'text-emerald-400 scale-110' : 'text-pink-100 group-hover:text-pink-300'
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
  task.completed ? 'font-medium text-pink-300 line-through decoration-pink-200 decoration-1' : 'font-bold text-pink-800'
}`}>
                  {task.text}
                </span>
                
                {!task.completed && taskTimes[task.id] && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock size={12} className="text-pink-300" />
                    <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">
                      {taskTimes[task.id]} хв всього
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {activeTaskId === task.id && !task.completed && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Зараз</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskList;