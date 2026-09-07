defmodule FlambeNextWeb.RegistrationController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, InviteCode, Traces}

  def create(conn, params) do
    if InviteCode.valid?(invite_code(params)) do
      register(conn, params)
    else
      conn
      |> put_status(:unprocessable_entity)
      |> json(%{errors: %{invite_code: ["is invalid"]}})
    end
  end

  defp register(conn, %{"user" => attrs}) do
    with {:ok, user} <- Accounts.register_user(attrs),
         {:ok, trace} <- Traces.create_trace(user, %{name: "Main"}) do
      Accounts.ensure_default_categories(user)
      conn
      |> put_status(:created)
      |> json(%{
        data: %{
          id: user.id,
          name: user.name,
          username: user.username,
          traces: [%{id: trace.id, name: trace.name}]
        }
      })
    else
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          errors: Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
        })
    end
  end

  defp register(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: %{user: ["is invalid"]}})
  end

  defp invite_code(%{"invite_code" => code}), do: code
  defp invite_code(_params), do: nil
end
