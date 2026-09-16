defmodule FlambeNextWeb.CategorySettingsController do
  use FlambeNextWeb, :controller

  alias FlambeNext.Accounts
  alias FlambeNextWeb.EventStream

  def index(conn, _params) do
    render_index(conn, categories(conn))
  end

  def create(conn, %{"category" => attrs}) do
    user = conn.assigns.current_user

    case Accounts.create_category(user, [], attrs) do
      {:ok, _category} ->
        EventStream.broadcast_categories(user)
        redirect(conn, to: ~p"/settings/categories")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render_index(categories(conn), error: error_text(changeset))
    end
  end

  def update(conn, %{"id" => id, "category" => attrs}) do
    user = conn.assigns.current_user
    category = Accounts.get_user_category!(user, id)

    case Accounts.update_category(category, attrs) do
      {:ok, _category} ->
        EventStream.broadcast_categories(user)
        redirect(conn, to: ~p"/settings/categories")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render_index(categories(conn), error: error_text(changeset))
    end
  end

  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    category = Accounts.get_user_category!(user, id)
    {:ok, _category} = Accounts.delete_category(category)
    EventStream.broadcast_categories(user)
    redirect(conn, to: ~p"/settings/categories")
  end

  defp categories(conn), do: Accounts.ensure_default_categories(conn.assigns.current_user)

  defp render_index(conn, categories, opts \\ []) do
    render(conn, :index, categories: categories, error: Keyword.get(opts, :error))
  end

  defp error_text(changeset) do
    changeset
    |> Ecto.Changeset.traverse_errors(fn {message, _options} -> message end)
    |> Enum.map_join("; ", fn {field, messages} -> "#{field} #{Enum.join(messages, ", ")}" end)
  end
end
