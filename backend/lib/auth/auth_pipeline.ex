defmodule Steady.AuthPipeline do
  use Guardian.Plug.Pipeline, otp_app: :steady

  plug(Guardian.Plug.VerifyCookie, claims: %{"typ" => "access"})
  # plug(Guardian.Plug.VerifyHeader, claims: %{"typ" => "access"})
  plug(Guardian.Plug.EnsureAuthenticated)
  # , allow_blank: true)
  plug(Guardian.Plug.LoadResource)
end
