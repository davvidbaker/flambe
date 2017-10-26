defmodule StitchWeb.CMS.PageView do
  use StitchWeb, :view

  alias Stitch.CMS

  def author_name(%CMS.Page{author: author}) do
    author.user.name
  end
end
