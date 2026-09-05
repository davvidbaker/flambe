defmodule FlambeNextWeb.ApiTokenJSON do
  alias FlambeNext.Accounts.ApiToken

  def index(%{api_tokens: api_tokens}) do
    %{data: Enum.map(api_tokens, &data/1)}
  end

  def created(%{api_token: api_token, raw_token: raw_token}) do
    %{data: Map.put(data(api_token), :raw_token, raw_token)}
  end

  defp data(%ApiToken{} = api_token) do
    %{
      id: api_token.id,
      name: api_token.name,
      inserted_at: api_token.inserted_at,
      last_used_at: api_token.last_used_at
    }
  end
end
