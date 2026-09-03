defmodule FlambeNext.Agents do
  @moduledoc false

  @names ~w(Steve Belinda Juniper Marcel Priya Otis Nia Theo Carmen Felix Imani Rory Greta Miles Suki)
  @max_name_bytes 100

  def name_for(instance_id) when is_binary(instance_id) do
    <<first, _rest::binary>> = :crypto.hash(:sha256, instance_id)
    Enum.at(@names, rem(first, length(@names)))
  end

  def display_name(instance_id, provided_name, token_name \\ nil)

  def display_name(instance_id, provided_name, token_name) when is_binary(instance_id) do
    cond do
      usable_name?(provided_name) -> String.trim(provided_name)
      usable_name?(token_name) -> String.trim(token_name)
      true -> name_for(instance_id)
    end
  end

  defp usable_name?(name) when is_binary(name) do
    trimmed = String.trim(name)

    trimmed != "" and
      byte_size(trimmed) <= @max_name_bytes and
      String.printable?(trimmed) and
      not String.contains?(trimmed, ["\n", "\r"])
  end

  defp usable_name?(_), do: false
end
