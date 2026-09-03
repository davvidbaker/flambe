defmodule FlambeNext.Agents do
  @moduledoc false

  @names ~w(Steve Belinda Juniper Marcel Priya Otis Nia Theo Carmen Felix Imani Rory Greta Miles Suki)

  def name_for(instance_id) when is_binary(instance_id) do
    <<first, _rest::binary>> = :crypto.hash(:sha256, instance_id)
    Enum.at(@names, rem(first, length(@names)))
  end
end
