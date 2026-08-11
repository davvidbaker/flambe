defmodule FlambeNextWeb.AttentionJSON do
  alias FlambeNext.Accounts.Attention

  def index(%{attentions: attentions}), do: %{data: Enum.map(attentions, &data/1)}
  def show(%{attention: %Attention{} = attention}), do: %{data: data(attention)}

  defp data(attention), do: %{id: attention.id}
end
