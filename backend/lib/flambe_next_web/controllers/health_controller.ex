defmodule FlambeNextWeb.HealthController do
  use FlambeNextWeb, :controller

  def show(conn, _params) do
    case FlambeNext.Repo.query("SELECT 1") do
      {:ok, _result} ->
        json(conn, %{status: "ok"})

      {:error, _reason} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{status: "unavailable"})
    end
  end
end
