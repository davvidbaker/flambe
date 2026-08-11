defmodule FlambeNextWeb.SearchTermJSON do
  alias FlambeNext.Accounts.SearchTerm

  def index(%{search_terms: search_terms}), do: %{data: Enum.map(search_terms, &data/1)}
  def show(%{search_term: %SearchTerm{} = search_term}), do: %{data: data(search_term)}

  defp data(search_term) do
    %{id: search_term.id, term: search_term.term, timestamp: search_term.timestamp}
  end
end
