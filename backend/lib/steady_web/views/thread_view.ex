defmodule SteadyWeb.ThreadView do
  use SteadyWeb, :view
  alias SteadyWeb.ThreadView

  def render("index.json", %{threads: threads}) do
    %{data: render_many(threads, ThreadView, "thread.json")}
  end

  def render("show.json", %{thread: thread}) do
    %{data: render_one(thread, ThreadView, "thread.json")}
  end

  def render("thread.json", %{thread: thread}) do
    %{id: thread.id, name: thread.name}
  end
end
