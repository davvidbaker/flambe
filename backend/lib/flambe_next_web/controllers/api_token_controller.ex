defmodule FlambeNextWeb.ApiTokenController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Accounts.ApiTokens

  def index(conn, _params) do
    render(conn, :index, api_tokens: ApiTokens.list(conn.assigns.current_user))
  end

  def create(conn, params) do
    name = token_name(params)

    case ApiTokens.create(conn.assigns.current_user, name) do
      {:ok, api_token, raw_token} ->
        conn
        |> put_status(:created)
        |> render(:created, api_token: api_token, raw_token: raw_token)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          errors: Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
        })
    end
  end

  def delete(conn, %{"id" => id}) do
    {:ok, _api_token} = ApiTokens.revoke(conn.assigns.current_user, id)
    send_resp(conn, :no_content, "")
  end

  defp token_name(%{"api_token" => %{"name" => name}}) when is_binary(name) and name != "",
    do: name

  defp token_name(%{"name" => name}) when is_binary(name) and name != "", do: name
  defp token_name(_params), do: "agent"
end
