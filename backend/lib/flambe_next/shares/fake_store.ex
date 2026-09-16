defmodule FlambeNext.Shares.FakeStore do
  @moduledoc false

  def put(pathname, _body) when is_binary(pathname) do
    {:ok, "https://blob.test/#{pathname}"}
  end
end
