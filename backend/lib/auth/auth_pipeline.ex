defmodule Flambe.AuthPipeline do
  use Guardian.Plug.Pipeline, otp_app: :flambe

  plug(Guardian.Plug.VerifySession, claims: %{"typ" => "access"})
  # plug(Guardian.Plug.VerifyHeader, claims: %{"typ" => "access"})
  plug(Guardian.Plug.EnsureAuthenticated)
  # , allow_blank: true)
  plug(Guardian.Plug.LoadResource)
end
