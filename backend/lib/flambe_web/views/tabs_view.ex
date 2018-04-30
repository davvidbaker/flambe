defmodule FlambeWeb.TabsView do
  use FlambeWeb, :view
  alias FlambeWeb.TabsView

  def render("index.json", %{tabs: tabs}) do
    %{data: render_many(tabs, TabsView, "tabs.json")}
  end

  def render("show.json", %{tabs: tabs}) do
    %{data: render_one(tabs, TabsView, "tabs.json")}
  end

  def render("tabs.json", %{tabs: tabs}) do
    %{id: tabs.id, count: tabs.count}
  end
end
