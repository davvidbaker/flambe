defmodule Flambe.Repo do
  use Ecto.Repo,
    otp_app: :flambe,
    adapter: Ecto.Adapters.Postgres
end
