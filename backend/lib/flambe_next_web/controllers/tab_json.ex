defmodule FlambeNextWeb.TabJSON do
  alias FlambeNext.Accounts.Tab

  def index(%{tabs: tabs}), do: %{data: Enum.map(tabs, &data/1)}
  def show(%{tab: %Tab{} = tab}), do: %{data: data(tab)}

  defp data(tab), do: %{id: tab.id, count: tab.count}
end
