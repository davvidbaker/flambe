defmodule FlambeNextWeb.AttentionController do
  use FlambeNextWeb, :controller

  alias FlambeNext.{Accounts, Traces}

  def index(conn, _params),
    do: render(conn, :index, attentions: Accounts.list_user_attentions(conn.assigns.current_user))

  def create(conn, %{"attention" => attrs}) do
    user = conn.assigns.current_user

    with _thread <- Traces.get_user_thread!(user, Map.fetch!(attrs, "thread_id")),
         {:ok, attention} <- Accounts.create_attention(user, attrs) do
      conn
      |> put_status(:created)
      |> render(:show, attention: attention)
    else
      {:error, changeset} -> invalid(conn, changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    render(conn, :show, attention: Accounts.get_user_attention!(conn.assigns.current_user, id))
  end

  def update(conn, %{"id" => id, "attention" => attrs}) do
    attention = Accounts.get_user_attention!(conn.assigns.current_user, id)

    case Accounts.update_attention(attention, attrs) do
      {:ok, attention} -> render(conn, :show, attention: attention)
      {:error, changeset} -> invalid(conn, changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    attention = Accounts.get_user_attention!(conn.assigns.current_user, id)
    {:ok, _attention} = Accounts.delete_attention(attention)
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
