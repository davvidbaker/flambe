defmodule SteadyWeb.MantraView do
  use SteadyWeb, :view
  alias SteadyWeb.MantraView

  def render("index.json", %{mantras: mantras}) do
    %{data: render_many(mantras, MantraView, "mantra.json")}
  end

  def render("show.json", %{mantra: mantra}) do
    %{data: render_one(mantra, MantraView, "mantra.json")}
  end

  def render("mantra.json", %{mantra: mantra}) do
    %{id: mantra.id, name: mantra.name}
  end
end
