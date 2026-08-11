defmodule FlambeNextWeb.RegistrationController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def create(conn, %{"user" => attrs}) do
    with {:ok, user} <- Accounts.register_user(attrs),
         {:ok, trace} <- Traces.create_trace(user, %{name: "Main"}) do
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
end
