defmodule FlambeNextWeb.CategoryJSON do
  alias FlambeNext.Accounts.Category

  def index(%{categories: categories}) do
    %{data: Enum.map(categories, &data/1)}
  end

  def show(%{category: %Category{} = category}) do
    %{data: data(category)}
  end

  defp data(category) do
    %{
      id: category.id,
      name: category.name,
      color_background: category.color_background,
      color_text: category.color_text
    }
  end
end
