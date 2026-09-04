defmodule FlambeNext.InviteCode do
  @moduledoc "Shared invite secret that gates public registration when configured."

  def configured do
    case Application.get_env(:flambe_next, :invite_code) do
      code when code in [nil, ""] -> nil
      code when is_binary(code) -> code
    end
  end

  def valid?(provided) do
    case configured() do
      nil ->
        true

      expected when is_binary(provided) ->
        Plug.Crypto.secure_compare(hash(expected), hash(provided))

      _ ->
        false
    end
  end

  defp hash(value), do: :crypto.hash(:sha256, value)
end
