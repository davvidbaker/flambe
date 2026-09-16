defmodule FlambeNextWeb.TimelineShareController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Shares

  def create(conn, %{"snapshot" => snapshot}) do
    case Shares.create(snapshot) do
      {:ok, %{id: id, url: url}} ->
        json(conn, %{id: id, url: url})

      {:error, :invalid_snapshot} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "INVALID_SNAPSHOT"})

      {:error, :not_configured} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "SHARE_NOT_CONFIGURED"})

      {:error, :upload_failed} ->
        conn
        |> put_status(:bad_gateway)
        |> json(%{error: "SHARE_UPLOAD_FAILED"})
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "INVALID_SNAPSHOT"})
  end
end
