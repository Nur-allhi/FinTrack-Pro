import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default function DashboardTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try { return JSON.parse(localStorage.getItem('dashboard_todos') || '[]'); }
    catch { return []; }
  });
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    localStorage.setItem('dashboard_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="bg-canvas/80 backdrop-blur-sm rounded-xl border border-hairline p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Quick Tasks</p>
        {todos.length > 0 && (
          <span className="text-xs font-bold text-primary">{todos.filter(t => !t.done).length} pending</span>
        )}
      </div>
      <div className="space-y-1 mb-3 max-h-[180px] overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
        {todos.length === 0 ? (
          <p className="text-xs text-muted italic">No tasks yet. Add one below.</p>
        ) : (
          todos.map(todo => (
            <div key={todo.id} className="flex items-center gap-2 group py-0.5">
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${todo.done ? 'bg-primary border-primary' : 'border-hairline hover:border-muted'}`}
              >
                {todo.done && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className={`flex-1 text-xs ${todo.done ? 'line-through text-muted' : 'text-ink'}`}>{todo.text}</span>
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-semantic-down transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
      <form onSubmit={addTodo} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a task..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          className="flex-1 bg-surface-soft border border-hairline rounded-pill px-3 py-1.5 text-xs text-ink placeholder:text-muted outline-none focus:border-primary transition-colors"
        />
        <button type="submit" className="btn-primary px-3 py-1.5 text-xs">Add</button>
      </form>
    </div>
  );
}
