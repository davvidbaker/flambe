defmodule FlambeNextWeb.TodoJSON do
  alias FlambeNext.Accounts.Todo

  def index(%{todos: todos}), do: %{data: Enum.map(todos, &data/1)}

  def show(%{todo: %Todo{} = todo}), do: %{data: data(todo)}

  defp data(todo), do: %{id: todo.id, name: todo.name, description: todo.description}
end
