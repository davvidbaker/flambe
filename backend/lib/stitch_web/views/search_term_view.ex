defmodule StitchWeb.SearchTermView do
  use StitchWeb, :view
  alias StitchWeb.SearchTermView

  def render("index.json", %{search_term: search_term}) do
    %{data: render_many(search_term, SearchTermView, "search_term.json")}
  end

  def render("show.json", %{search_term: search_term}) do
    %{data: render_one(search_term, SearchTermView, "search_term.json")}
  end

  def render("search_term.json", %{search_term: search_term}) do
    %{id: search_term.id, term: search_term.term, timestamp: search_term.timestamp}
  end
end
