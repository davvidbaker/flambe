defmodule FlambeNextWeb.ActivityMoveController do
  use FlambeNextWeb, :controller
  alias FlambeNext.Traces.ActivityMoves

  def create(conn, %{"id" => trace_id, "activity_ids" => ids, "thread_id" => thread_id}) do
    case ActivityMoves.move(conn.assigns.current_user, trace_id, ids, thread_id) do
      {:ok, token} -> json(conn, %{data: %{undo_token: token}})
      {:error, _} -> conn |> put_status(:unprocessable_entity) |> json(%{error: "INVALID_MOVE"})
    end
  end

  def create(conn, _params),
    do: conn |> put_status(:unprocessable_entity) |> json(%{error: "INVALID_MOVE"})

  def undo(conn, %{"id" => trace_id, "undo_token" => token}) do
    case ActivityMoves.undo(conn.assigns.current_user, trace_id, token) do
      {:ok, inverse} -> json(conn, %{data: %{undo_token: inverse}})
      {:error, :conflict} -> conn |> put_status(:conflict) |> json(%{error: "MOVE_CHANGED"})
      {:error, _} -> conn |> put_status(:unprocessable_entity) |> json(%{error: "INVALID_UNDO"})
    end
  end

  def undo(conn, _params),
    do: conn |> put_status(:unprocessable_entity) |> json(%{error: "INVALID_UNDO"})

  def reverse_creation(conn, %{"id" => trace_id} = params) do
    case FlambeNext.Traces.CreationHistory.reverse(conn.assigns.current_user, trace_id, params) do
      {:ok, inverse} ->
        json(conn, %{data: %{undo_token: inverse}})

      {:error, :invalid} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: "INVALID_HISTORY"})

      {:error, _} ->
        conn |> put_status(:conflict) |> json(%{error: "HISTORY_CHANGED"})
    end
  end
end
