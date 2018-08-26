defmodule Flambe.AuthErrorHandler do
  import Plug.Conn

  def auth_error(conn, {type, reason}, opts) do
    # {:ok, claims} =
      # Flambe.Guardian.decode_and_verify(conn.cookies["steady_token"], %{"typ" => "access"})

      key = Guardian.Plug.Pipeline.current_key(conn)
      IO.puts "\n🔥key"
      IO.inspect key

    # IO.puts("\n🔥claims")
    # IO.inspect(claims)

    IO.puts("\n🔥🐵conn")
    IO.inspect(conn)
    IO.puts("\n🔥type")
    IO.inspect(type)
    IO.puts("\n🔥reason")
    IO.inspect(reason)
    IO.puts("\opts")
    IO.inspect(opts)

    body = Poison.encode!(%{message: to_string(type)})
    send_resp(conn, 401, body)
  end
end
