defmodule Flambe.Plug.ConnInterceptor do
  import Plug.Conn, only: [assign: 3]

  def init(default), do: default

  def call(conn, _default) do
    require IEx
    IO.inspect(conn, label: "conn")
    conn
  end
end
