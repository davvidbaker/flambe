defmodule FlambeNextWeb.ImportController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Imports

  def create(conn, params) do
    case Imports.import_bundle(conn.assigns.current_user, params) do
      {:ok, result} ->
        json(conn, %{data: result})

      {:error, :invalid_bundle} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "INVALID_BUNDLE"})
    end
  end
end
