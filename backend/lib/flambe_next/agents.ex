defmodule FlambeNext.Agents do
  @moduledoc """
  Agent identity (ADR-012). An agent is a stable `agent_id` a worker sends on every
  request. The reducer gives each agent of a user a name no other agent of that user
  has, persists it, and tells the worker so it can use it from then on. A name the
  worker supplies wins and is stored too. The optional platform ("Cursor Cloud", "Codex",
  "Claude Code") is the product the agent runs on; many agents share one.
  """

  import Ecto.Query

  alias FlambeNext.Accounts.User
  alias FlambeNext.Agents.Agent
  alias FlambeNext.Repo

  @names ~w(
    Steve Belinda Juniper Marcel Priya Otis Nia Theo Carmen Felix Imani Rory Greta Miles Suki
    Anouk Bastian Cleo Dashiell Esme Fitz Hollis Ines Jasper Kenji Lucia Mattias Noor Oona
    Pilar Quill Ravi Sable Tamsin Ulla Vera Wren Xiomara Yusuf Zadie
  )
  @max_name_bytes 100

  @type identity :: %{
          agent: Agent.t(),
          assigned?: boolean()
        }

  @doc """
  Resolves the agent for `agent_id`, creating it with a fresh name when unknown.

  `assigned?` is true only on the request that coined a name, so callers can tell the
  worker once.
  """
  @spec identify(User.t(), String.t(), String.t() | nil, String.t() | nil) ::
          {:ok, identity()} | {:error, term()}
  def identify(%User{} = user, agent_id, provided_name, platform \\ nil)
      when is_binary(agent_id) do
    now = DateTime.utc_now(:second)
    provided = if usable_name?(provided_name), do: String.trim(provided_name)
    platform = if usable_name?(platform), do: String.trim(platform)

    case Repo.get_by(Agent, user_id: user.id, agent_id: agent_id) do
      nil ->
        insert_new(user, agent_id, provided, platform, now)

      %Agent{} = agent ->
        attrs =
          if provided && provided != agent.name,
            do: %{name: provided, name_source: "provided", last_seen_at: now},
            else: %{last_seen_at: now}

        attrs = if platform, do: Map.put(attrs, :platform, platform), else: attrs

        with {:ok, agent} <- agent |> Agent.changeset(attrs) |> Repo.update() do
          {:ok, %{agent: agent, assigned?: false}}
        end
    end
  end

  @doc "Every agent of `user`, most recently seen first."
  def list(%User{} = user) do
    from(a in Agent, where: a.user_id == ^user.id, order_by: [desc: a.last_seen_at, asc: a.id])
    |> Repo.all()
  end

  def get(%User{} = user, agent_id) when is_binary(agent_id) do
    Repo.get_by(Agent, user_id: user.id, agent_id: agent_id)
  end

  @doc """
  A name for `agent_id` that none of `taken` uses. Deterministic for a given id so
  retries after a race converge; falls back to a numbered variant when the list is used up.
  """
  def pick_name(agent_id, taken) when is_binary(agent_id) do
    taken = MapSet.new(taken, &String.downcase/1)
    <<offset::unsigned-integer-size(16), _::binary>> = :crypto.hash(:sha256, agent_id)
    count = length(@names)

    0..(count - 1)
    |> Enum.map(&Enum.at(@names, rem(offset + &1, count)))
    |> Enum.find(&(not MapSet.member?(taken, String.downcase(&1))))
    |> case do
      nil -> numbered_name(Enum.at(@names, rem(offset, count)), taken, 2)
      name -> name
    end
  end

  defp numbered_name(base, taken, n) do
    candidate = "#{base} #{n}"

    if MapSet.member?(taken, String.downcase(candidate)),
      do: numbered_name(base, taken, n + 1),
      else: candidate
  end

  defp insert_new(user, agent_id, provided, platform, now) do
    {name, source} =
      case provided do
        nil -> {pick_name(agent_id, taken_names(user)), "assigned"}
        name -> {name, "provided"}
      end

    %Agent{user_id: user.id}
    |> Agent.changeset(%{
      agent_id: agent_id,
      name: name,
      name_source: source,
      platform: platform,
      last_seen_at: now
    })
    |> Repo.insert()
    |> case do
      {:ok, agent} ->
        {:ok, %{agent: agent, assigned?: source == "assigned"}}

      {:error, %Ecto.Changeset{} = changeset} ->
        # Two first requests from the same new agent raced; the other one won.
        if unique_violation?(changeset),
          do: identify(user, agent_id, provided, platform),
          else: {:error, changeset}
    end
  end

  defp unique_violation?(%Ecto.Changeset{errors: errors}) do
    Enum.any?(errors, fn {_field, {_msg, opts}} -> opts[:constraint] == :unique end)
  end

  defp taken_names(user) do
    from(a in Agent, where: a.user_id == ^user.id, select: a.name) |> Repo.all()
  end

  def usable_name?(name) when is_binary(name) do
    trimmed = String.trim(name)

    trimmed != "" and
      byte_size(trimmed) <= @max_name_bytes and
      String.printable?(trimmed) and
      not String.contains?(trimmed, ["\n", "\r"])
  end

  def usable_name?(_), do: false
end
