defmodule FlambeNext.Accounts.ApiTokens do
  @moduledoc "User-scoped personal API tokens for non-browser clients."

  import Ecto.Query

  alias FlambeNext.Accounts.{ApiToken, User}
  alias FlambeNext.Repo

  @prefix "flb_"
  @token_bytes 32
  @encoded_token_length 43

  def create(%User{} = user, name \\ "agent") when is_binary(name) do
    raw_token =
      @prefix <> Base.url_encode64(:crypto.strong_rand_bytes(@token_bytes), padding: false)

    result =
      %ApiToken{user_id: user.id}
      |> ApiToken.changeset(%{name: name, token_hash: hash(raw_token)})
      |> Repo.insert()

    case result do
      {:ok, api_token} -> {:ok, api_token, raw_token}
      {:error, changeset} -> {:error, changeset}
    end
  end

  def list(%User{} = user) do
    from(api_token in ApiToken,
      where: api_token.user_id == ^user.id,
      order_by: [desc: api_token.inserted_at, desc: api_token.id]
    )
    |> Repo.all()
  end

  def get_user_token!(%User{} = user, id) do
    from(api_token in ApiToken,
      where: api_token.id == ^id and api_token.user_id == ^user.id
    )
    |> Repo.one!()
  end

  def revoke(%User{} = user, id) do
    api_token = get_user_token!(user, id)
    Repo.delete(api_token)
  end

  def touch_last_used(%ApiToken{id: id}) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    from(api_token in ApiToken, where: api_token.id == ^id)
    |> Repo.update_all(set: [last_used_at: now, updated_at: now])

    :ok
  rescue
    _ -> :ok
  end

  def authenticate(raw_token) when is_binary(raw_token) do
    case authenticate_with_token(raw_token) do
      {:ok, user, _api_token} -> {:ok, user}
      {:error, :invalid_token} -> {:error, :invalid_token}
    end
  end

  def authenticate(_raw_token), do: {:error, :invalid_token}

  def authenticate_with_token(raw_token) when is_binary(raw_token) do
    if valid_format?(raw_token) do
      api_token =
        from(api_token in ApiToken,
          join: user in assoc(api_token, :user),
          where: api_token.token_hash == ^hash(raw_token),
          preload: [user: user]
        )
        |> Repo.one()

      if api_token, do: {:ok, api_token.user, api_token}, else: {:error, :invalid_token}
    else
      {:error, :invalid_token}
    end
  end

  def authenticate_with_token(_raw_token), do: {:error, :invalid_token}

  defp valid_format?(raw_token) do
    String.starts_with?(raw_token, @prefix) and
      byte_size(raw_token) == byte_size(@prefix) + @encoded_token_length
  end

  defp hash(raw_token) do
    raw_token
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
  end
end
