defmodule FlambeNextWeb.MantraJSON do
  alias FlambeNext.Accounts.Mantra

  def index(%{mantras: mantras}), do: %{data: Enum.map(mantras, &data/1)}
  def show(%{mantra: %Mantra{} = mantra}), do: %{data: data(mantra)}

  defp data(mantra), do: %{id: mantra.id, name: mantra.name}
end
