defmodule Steady.Guardian do
  use Guardian, otp_app: :steady

  def subject_for_token(resource, _claims) do
    sub = to_string(resource.id)
    {:ok, sub}
  end

  def subject_for_token do
    # ⚠️
    {:error, :guardian_error}
  end

  def resource_from_claims(claims) do
    id = claims["sub"]
    # ⚠️ might want to use get_user (no bang) and handle error...
    resource = Steady.Accounts.get_user!(id)
    {:ok, resource}
  end

  def resource_from_claims(_claims) do
    # ⚠️
    {:error, :guardian_error}
  end
end
