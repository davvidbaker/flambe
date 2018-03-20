defmodule Stitch.Accounts.UserFromAuth do
  @moduledoc """
  Retrieve user info from auth request
  """
  alias Ueberauth.Auth
  alias Stitch.Accounts
  alias Stitch.Accounts.User

  def find_or_create(%Auth{} = auth) do
    basic_info = basic_info(auth)

    case Accounts.get_user_from_credential_info(basic_info) do
      {:ok, user} -> {:ok, user} |> IO.inspect
      {:error, :does_not_exist} -> basic_info |> Accounts.create_user |> IO.inspect
    end
  end

  # github does it this way
  defp avatar_from_auth(%{info: %{urls: %{avatar_url: image}}}), do: image

  defp basic_info(auth) do
    %{provider: Atom.to_string(auth.provider), uid: auth.uid, name: name_from_auth(auth), avatar: avatar_from_auth(auth)}
  end

  defp name_from_auth(auth) do
    if auth.info.name do
      auth.info.name
    else
      name =
        [auth.info.first_name, auth.info.last_name]
        |> Enum.filter(&(&1 != nil and &1 != ""))

      cond do
        length(name) == 0 -> auth.info.nickname
        true -> Enum.join(name, " ")
      end
    end
  end
end
