defmodule FlambeNextWeb.ObservationController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Accounts

  def index(conn, params) do
    observations =
      Accounts.list_user_observations(conn.assigns.current_user, kind: params["kind"])

    render(conn, :index, observations: observations)
  end

  def create(conn, %{"observation" => attrs}) do
    case Accounts.upsert_observation(conn.assigns.current_user, attrs) do
      {:ok, observation, :created} ->
        conn |> put_status(:created) |> render(:show, observation: observation)

      {:ok, observation, :updated} ->
        render(conn, :show, observation: observation)

      {:error, changeset} ->
        invalid(conn, changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show,
      observation: Accounts.get_user_observation!(conn.assigns.current_user, id)
    )
  end

  def update(conn, %{"id" => id, "observation" => attrs}) do
    observation = Accounts.get_user_observation!(conn.assigns.current_user, id)

    case Accounts.update_observation(observation, attrs) do
      {:ok, observation} -> render(conn, :show, observation: observation)
      {:error, changeset} -> invalid(conn, changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    observation = Accounts.get_user_observation!(conn.assigns.current_user, id)
    {:ok, _observation} = Accounts.delete_observation(observation)
    send_resp(conn, :no_content, "")
  end

  defp invalid(conn, changeset) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{
      errors: Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
    })
  end
end
