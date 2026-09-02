defmodule Mix.Tasks.FlambeNext.CreateApiToken do
  use Mix.Task

  alias FlambeNext.Accounts
  alias FlambeNext.Accounts.ApiTokens

  @shortdoc "Creates a personal API token for a Flambe user"

  @impl Mix.Task
  def run(args) do
    {options, positional, _invalid} = OptionParser.parse(args, strict: [raw: :boolean])
    Mix.Task.run("app.start")

    {email, name} = parse_args!(positional)
    user = Accounts.get_user_by_email(email) || Mix.raise("No Flambe user found for #{email}")

    case ApiTokens.create(user, name) do
      {:ok, api_token, raw_token} ->
        if options[:raw] do
          Mix.shell().info(raw_token)
        else
          Mix.shell().info("Created Flambe API token ##{api_token.id} (#{api_token.name}).")
          Mix.shell().info("Copy it now; only its SHA-256 hash is stored:")
          Mix.shell().info(raw_token)
        end

      {:error, changeset} ->
        Mix.raise("Could not create API token: #{inspect(changeset.errors)}")
    end
  end

  defp parse_args!([email]), do: {email, "agent"}
  defp parse_args!([email | name_parts]), do: {email, Enum.join(name_parts, " ")}

  defp parse_args!([]) do
    Mix.raise("Usage: mix flambe_next.create_api_token EMAIL [NAME] [--raw]")
  end
end
