defmodule FlambeWeb.CategoryView do
  use FlambeWeb, :view
  alias FlambeWeb.CategoryView

  def render("index.json", %{categories: categories}) do
    %{data: render_many(categories, CategoryView, "category.json")}
  end

  def render("show.json", %{category: category}) do
    %{data: render_one(category, CategoryView, "category.json")}
  end

  def render("category.json", %{category: category}) do
    %{
      id: category.id,
      name: category.name,
      color_background: category.color_background,
      color_text: category.color_text
    }
  end
end
