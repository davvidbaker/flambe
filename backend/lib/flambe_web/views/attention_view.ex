defmodule FlambeWeb.AttentionView do
  use FlambeWeb, :view
  alias FlambeWeb.AttentionView

  def render("index.json", %{attentions: attentions}) do
    %{data: render_many(attentions, AttentionView, "attention.json")}
  end

  def render("show.json", %{attention: attention}) do
    %{data: render_one(attention, AttentionView, "attention.json")}
  end

  def render("attention.json", %{attention: attention}) do
    %{id: attention.id}
  end
end
