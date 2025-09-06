import { createContextId } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import type { Todo, Filter } from "~/types";

export interface TodoStore {
  todos: Signal<Todo[]>;
  filter: Signal<Filter>;
}

export const TodoContext = createContextId<TodoStore>("todo-context");
