defmodule StitchWeb.TabsView do
  use StitchWeb, :view
  alias StitchWeb.TabsView

  def render("index.json", %{tabs: tabs}) do
    %{data: render_many(tabs, TabsView, "tabs.json")}
  end

  def render("show.json", %{tabs: tabs}) do
    %{data: render_one(tabs, TabsView, "tabs.json")}
  end

  def render("tabs.json", %{tabs: tabs}) do
    %{id: tabs.id,
      count: tabs.count}
  end
end
