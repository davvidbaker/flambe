defmodule FlambeNextWeb.CategoryController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def index(conn, _params) do
    render(conn, :index, categories: Accounts.list_user_categories(conn.assigns.current_user))
  end

  def create(conn, %{"category" => attrs} = params) do
    user = conn.assigns.current_user
    activity_ids = Map.get(params, "activity_ids", [])

    with {:ok, activities} <- Traces.get_user_activities(user, activity_ids),
         {:ok, category} <- Accounts.create_category(user, activities, attrs) do
      conn
      |> put_status(:created)
      |> render(:show, category: category)
    else
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "NOT_FOUND"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show, category: Accounts.get_user_category!(conn.assigns.current_user, id))
  end

  def update(conn, %{"id" => id, "category" => attrs}) do
    category = Accounts.get_user_category!(conn.assigns.current_user, id)

    case Accounts.update_category(category, attrs) do
      {:ok, category} ->
        render(conn, :show, category: category)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    category = Accounts.get_user_category!(conn.assigns.current_user, id)
    {:ok, _category} = Accounts.delete_category(category)
    send_resp(conn, :no_content, "")
  end

  defp errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, _options} -> message end)
  end
end
