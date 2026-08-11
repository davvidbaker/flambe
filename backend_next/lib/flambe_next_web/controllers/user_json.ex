defmodule FlambeNextWeb.UserJSON do
  alias FlambeNext.Accounts.User

  def show(%{user: %User{} = user, traces: traces, categories: categories}) do
    %{
      data: %{
        id: user.id,
        name: user.name,
        username: user.username,
        traces: Enum.map(traces, &trace_data/1),
        categories: Enum.map(categories, &category_data/1),
        todos: [],
        mantras: [],
        attentionShifts: [],
        tabs: [],
        searchTerms: []
      }
    }
  end

  defp trace_data(trace), do: %{id: trace.id, name: trace.name}

  defp category_data(category) do
    %{
      id: category.id,
      name: category.name,
      color_background: category.color_background,
      color_text: category.color_text
    }
  end
end
