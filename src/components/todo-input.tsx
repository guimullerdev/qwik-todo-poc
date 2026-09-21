import { component$, useSignal } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";

interface TodoInputProps {
  onAddTodo: QRL<(text: string) => void>;
}

export const TodoInput = component$<TodoInputProps>(({ onAddTodo }) => {
  const inputText = useSignal("");

  return (
    <div class="mb-6">
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={inputText}
          placeholder="Adicionar nova tarefa..."
          class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
          onKeyPress$={(e) => {
            if (e.key === "Enter") {
              onAddTodo(inputText.value);
              inputText.value = "";
            }
          }}
        />
        <button
          type="button"
          onClick$={() => {
            onAddTodo(inputText.value);
            inputText.value = "";
          }}
          class="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
});
