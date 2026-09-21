import { component$ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import type { Todo } from "~/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: QRL<(id: string) => void>;
  onRemove: QRL<(id: string) => void>;
}

export const TodoItem = component$<TodoItemProps>(
  ({ todo, onToggle, onRemove }) => {
    return (
      <li class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange$={() => onToggle(todo.id)}
          class="h-5 w-5 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500"
        />

        <span
          class={`flex-1 ${todo.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
        >
          {todo.text}
        </span>

        <button
          type="button"
          onClick$={() => onRemove(todo.id)}
          class="rounded px-3 py-1 text-red-600 transition-colors hover:bg-red-50"
          title="Remover tarefa"
        >
          ✕
        </button>
      </li>
    );
  },
);
