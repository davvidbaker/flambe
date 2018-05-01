defmodule FlambeWeb.TodoView do
  use FlambeWeb, :view
  alias FlambeWeb.TodoView

  def render("index.json", %{todos: todos}) do
    %{data: render_many(todos, TodoView, "todo.json")}
  end

  def render("show.json", %{todo: todo}) do
    %{data: render_one(todo, TodoView, "todo.json")}
  end

  def render("todo.json", %{todo: todo}) do
    %{id: todo.id, name: todo.name, description: todo.description}
  end
end
