defmodule StitchWeb.AttentionController do
  use StitchWeb, :controller

  alias Stitch.Accounts
  alias Stitch.Accounts.Attention

  action_fallback StitchWeb.FallbackController

  def index(conn, _params) do
    attentions = Accounts.list_attentions()
    render(conn, "index.json", attentions: attentions)
  end

  def create(conn, %{"user_id" => user_id, "attention" => attention_params}) do
    with {:ok, %Attention{} = attention} <- Accounts.create_attention(user_id, attention_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", attention_path(conn, :show, attention))
      |> render("show.json", attention: attention)
    end
  end

  def show(conn, %{"id" => id}) do
    attention = Accounts.get_attention!(id)
    render(conn, "show.json", attention: attention)
  end

  def update(conn, %{"id" => id, "attention" => attention_params}) do
    attention = Accounts.get_attention!(id)

    with {:ok, %Attention{} = attention} <- Accounts.update_attention(attention, attention_params) do
      render(conn, "show.json", attention: attention)
    end
  end

  def delete(conn, %{"id" => id}) do
    attention = Accounts.get_attention!(id)
    with {:ok, %Attention{}} <- Accounts.delete_attention(attention) do
      send_resp(conn, :no_content, "")
    end
  end
end
