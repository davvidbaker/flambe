defmodule FlambeNextWeb.UserJSON do
  alias FlambeNext.Accounts.User

  def show(%{
        user: %User{} = user,
        traces: traces,
        categories: categories,
        todos: todos,
        mantras: mantras,
        attentions: attentions,
        tabs: tabs,
        search_terms: search_terms,
        observations: observations
      }) do
    %{
      data: %{
        id: user.id,
        name: user.name,
        username: user.username,
        settings: user.settings || %{},
        traces: Enum.map(traces, &trace_data/1),
        categories: Enum.map(categories, &category_data/1),
        todos: Enum.map(todos, &todo_data/1),
        mantras: Enum.map(mantras, &mantra_data/1),
        attentionShifts: Enum.map(attentions, &attention_data/1),
        tabs: Enum.map(tabs, &tab_data/1),
        searchTerms: Enum.map(search_terms, &search_term_data/1),
        observations: Enum.map(observations, &FlambeNextWeb.ObservationJSON.data/1)
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

  defp todo_data(todo), do: %{id: todo.id, name: todo.name, description: todo.description}
  defp mantra_data(mantra), do: %{id: mantra.id, name: mantra.name, timestamp: mantra.timestamp}

  defp attention_data(attention),
    do: %{id: attention.id, thread_id: attention.thread_id, timestamp: attention.timestamp}

  defp tab_data(tab) do
    %{id: tab.id, count: tab.count, window_count: tab.window_count, timestamp: tab.timestamp}
  end

  defp search_term_data(search_term) do
    %{id: search_term.id, term: search_term.term, timestamp: search_term.timestamp}
  end
end
