import { component$, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { TodoInput } from "~/components/todo-input";
import { TodoItem } from "~/components/todo-item";
import { TodoFilter } from "~/components/todo-filter";
import { useTodos } from "~/hooks/useTodos";

export default component$(() => {
  const {
    todos,
    filter,
    filteredTodos,
    stats,
    addTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    setFilter,
  } = useTodos();

  useVisibleTask$(() => {
    if (todos.value.length === 0) {
      todos.value = [
        {
          id: "1",
          text: "Aprender Qwik",
          completed: false,
          createdAt: new Date(),
        },
        {
          id: "2",
          text: "Configurar Tailwind CSS",
          completed: true,
          createdAt: new Date(),
        },
      ];
    }
  });

  return (
    <div class="min-h-screen bg-gray-100 py-8">
      <div class="container mx-auto max-w-2xl px-4">
        <div class="rounded-lg bg-white p-6 shadow-lg">
          <h1 class="mb-6 text-center text-3xl font-bold text-gray-800">
            📝 Minhas Tarefas - Qwik
          </h1>

          <TodoInput onAddTodo={addTodo} />

          <TodoFilter currentFilter={filter.value} onFilterChange={setFilter} />

          {stats.value.total > 0 && (
            <div class="mb-4 rounded-lg bg-gray-50 p-3">
              <p class="text-sm text-gray-600">
                Total: {stats.value.total} | Ativas: {stats.value.active} |
                Concluídas: {stats.value.completed}
              </p>
            </div>
          )}

          <ul class="space-y-2">
            {filteredTodos.value.length > 0 ? (
              filteredTodos.value.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onRemove={removeTodo}
                />
              ))
            ) : (
              <li class="py-8 text-center text-gray-500">
                {filter.value === "active" && "Nenhuma tarefa ativa"}
                {filter.value === "completed" && "Nenhuma tarefa concluída"}
                {filter.value === "all" && "Nenhuma tarefa adicionada ainda"}
              </li>
            )}
          </ul>

          {stats.value.completed > 0 && (
            <div class="mt-6 text-center">
              <button
                type="button"
                onClick$={clearCompleted}
                class="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
              >
                Limpar Concluídas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Todo App - Qwik",
  meta: [
    {
      name: "description",
      content:
        "Uma aplicação de tarefas feita com Qwik, TypeScript e Tailwind CSS",
    },
  ],
};
