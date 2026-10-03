defmodule Mix.Tasks.FlambeNext.ProvisionPluginReviewer do
  use Mix.Task

  @shortdoc "Provisions the dedicated OpenAI plugin-review account and sample trace"

  alias FlambeNext.{Accounts, Traces}

  @email "openai-reviewer@flambe.local"
  @username "openai_plugin_reviewer"
  @trace_name "OpenAI plugin review"
  @thread_name "Review work"
  @root_name "Review Flambe plugin"

  @impl Mix.Task
  def run(_args) do
    unless System.get_env("FLAMBE_ALLOW_PLUGIN_REVIEWER_SEED") in ~w(true 1) do
      Mix.raise("Set FLAMBE_ALLOW_PLUGIN_REVIEWER_SEED=true to provision the reviewer account")
    end

    password =
      System.get_env("FLAMBE_PLUGIN_REVIEWER_PASSWORD")
      |> present!("FLAMBE_PLUGIN_REVIEWER_PASSWORD")

    Mix.Task.run("app.start")

    user =
      case Accounts.get_user_by_email(@email) do
        nil -> create_user!(password)
        existing -> existing
      end

    Accounts.ensure_default_categories(user)

    trace =
      Enum.find(Traces.list_user_traces(user), &(&1.name == @trace_name)) ||
        create_trace!(user)

    ensure_review_activity!(user, trace)

    Mix.shell().info("OpenAI plugin reviewer account is ready")
    Mix.shell().info("Email: #{@email}")
    Mix.shell().info("Trace: #{trace.name} (##{trace.id})")
    Mix.shell().info("Password is intentionally not printed; use the runtime value you supplied.")
  end

  defp create_user!(password) do
    case Accounts.register_user(%{
           name: "OpenAI Plugin Reviewer",
           username: @username,
           credentials: [%{email: @email, password: password}]
         }) do
      {:ok, user} -> user
      {:error, changeset} -> Mix.raise("Could not create reviewer user: #{inspect(changeset.errors)}")
    end
  end

  defp create_trace!(user) do
    case Traces.create_trace(user, %{name: @trace_name}) do
      {:ok, trace} -> trace
      {:error, changeset} -> Mix.raise("Could not create reviewer trace: #{inspect(changeset.errors)}")
    end
  end

  defp ensure_review_activity!(user, trace) do
    {_trace, events} = Traces.get_user_trace_with_events!(user, trace.id)

    unless Enum.any?(events, &(&1.activity && &1.activity.name == @root_name && &1.phase == "B")) do
      thread =
        Traces.get_user_trace!(user, trace.id).threads
        |> Enum.find(&(&1.name == @thread_name))
        |> case do
          nil ->
            {:ok, created} = Traces.create_thread(trace, %{name: @thread_name, rank: 1})
            created

          existing ->
            existing
        end

      {:ok, _activity, _event} =
        Traces.create_activity(
          trace,
          thread,
          nil,
          %{
            description: "Stable sample parent activity for OpenAI plugin review",
            name: @root_name,
            weight: 1,
            agent_id: "reviewer:fixture",
            agent_name: "Review Fixture"
          },
          %{
            message: "Sample review activity started",
            phase: "B",
            timestamp_integer: System.system_time(:millisecond) - 300_000
          }
        )
    end
  end

  defp present!(value, label) when is_binary(value) do
    case String.trim(value) do
      "" -> Mix.raise("#{label} must not be empty")
      trimmed -> trimmed
    end
  end

  defp present!(_, label), do: Mix.raise("#{label} is required")
end
