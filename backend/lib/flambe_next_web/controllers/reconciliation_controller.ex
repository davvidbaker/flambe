defmodule FlambeNextWeb.ReconciliationController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Traces.Reconciliation

  def show(conn, %{"id" => id}), do: run(conn, id, &Reconciliation.version/2)

  def create(conn, %{"id" => id} = params) do
    case conn.assigns[:agent] do
      nil -> failure(conn, :unprocessable_entity, "AGENT_ID_REQUIRED")
      agent -> run(conn, id, &Reconciliation.apply(&1, &2, agent, Map.delete(params, "id")))
    end
  end

  defp run(conn, id, operation) do
    with {trace_id, ""} <- Integer.parse(id),
         {:ok, data} <- operation.(conn.assigns.current_user, trace_id) do
      json(conn, %{data: data})
    else
      {:error, :invalid_reconciliation} ->
        failure(conn, :unprocessable_entity, "INVALID_RECONCILIATION")

      {:error, :trace_version_changed} ->
        failure(conn, :conflict, "TRACE_VERSION_CHANGED")

      {:error, :repair_id_reused} ->
        failure(conn, :conflict, "REPAIR_ID_REUSED")

      _ ->
        failure(conn, :not_found, "NOT_FOUND")
    end
  end

  defp failure(conn, status, code), do: conn |> put_status(status) |> json(%{error: code})
end
