defmodule FlambeNext.Repo do
  use Ecto.Repo,
    otp_app: :flambe_next,
    adapter: Ecto.Adapters.Postgres
end
