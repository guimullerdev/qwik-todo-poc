import { component$ } from "@builder.io/qwik";
import type { Filter } from "~/types";

interface TodoFilterProps {
  currentFilter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export const TodoFilter = component$<TodoFilterProps>(
  ({ currentFilter, onFilterChange }) => {
    const filters: { label: string; value: Filter }[] = [
      { label: "Todas", value: "all" },
      { label: "Ativas", value: "active" },
      { label: "Concluídas", value: "completed" },
    ];

    return (
      <div class="mb-4 flex gap-2">
        {filters.map((filterItem) => (
          <button
            key={filterItem.value}
            type="button"
            onClick$={() => onFilterChange(filterItem.value)}
            class={`rounded-lg px-4 py-2 transition-colors ${
              currentFilter === filterItem.value
                ? "bg-blue-500 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {filterItem.label}
          </button>
        ))}
      </div>
    );
  },
);
