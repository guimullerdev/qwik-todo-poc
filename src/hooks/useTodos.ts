import { $, useSignal, useComputed$ } from "@builder.io/qwik";
import type { Todo, Filter } from "~/types";

export const useTodos = () => {
  const todos = useSignal<Todo[]>([]);
  const filter = useSignal<Filter>("all");

  const filteredTodos = useComputed$(() => {
    const todosValue = todos.value;
    const filterValue = filter.value;

    switch (filterValue) {
      case "active":
        return todosValue.filter((todo) => !todo.completed);
      case "completed":
        return todosValue.filter((todo) => todo.completed);
      default:
        return todosValue;
    }
  });

  const stats = useComputed$(() => ({
    total: todos.value.length,
    completed: todos.value.filter((todo) => todo.completed).length,
    active: todos.value.filter((todo) => !todo.completed).length,
  }));

  const addTodo = $((text: string) => {
    if (text.trim()) {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        text: text.trim(),
        completed: false,
        createdAt: new Date(),
      };
      todos.value = [...todos.value, newTodo];
    }
  });

  const toggleTodo = $((id: string) => {
    todos.value = todos.value.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    );
  });

  const removeTodo = $((id: string) => {
    todos.value = todos.value.filter((todo) => todo.id !== id);
  });

  const clearCompleted = $(() => {
    todos.value = todos.value.filter((todo) => !todo.completed);
  });

  const setFilter = $((newFilter: Filter) => {
    filter.value = newFilter;
  });

  return {
    todos,
    filter,
    filteredTodos,
    stats,
    addTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    setFilter,
  };
};
