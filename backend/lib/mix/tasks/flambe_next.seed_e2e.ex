defmodule Mix.Tasks.FlambeNext.SeedE2e do
  use Mix.Task

  @shortdoc "Creates the deterministic local/browser smoke-test account"

  alias FlambeNext.{Accounts, Traces}

  @email "e2e@flambe.local"
  @username "flambe_e2e"
  @trace_name "Browser smoke trace"
  @thread_name "Browser smoke work"

  @impl Mix.Task
  def run(_args) do
    unless Mix.env() in [:dev, :test] do
      Mix.raise("flambe_next.seed_e2e is available only in development and test")
    end

    Mix.Task.run("app.start")

    password = System.get_env("FLAMBE_E2E_PASSWORD") || "e2e-password"
    user = Accounts.get_user_by_email(@email) || create_user!(password)
    trace = find_trace(user) || create_trace!(user)
    ensure_activity!(user, trace)

    Mix.shell().info("Seeded browser smoke account #{@email} on trace #{trace.id}")
  end

  defp create_user!(password) do
    {:ok, user} =
      Accounts.register_user(%{
        name: "Flambe browser smoke",
        username: @username,
        credentials: [%{email: @email, password: password}]
      })

    user
  end

  defp find_trace(user) do
    Enum.find(Traces.list_user_traces(user), &(&1.name == @trace_name))
  end

  defp create_trace!(user) do
    {:ok, trace} = Traces.create_trace(user, %{name: @trace_name})
    trace
  end

  defp ensure_activity!(user, trace) do
    {_trace, events} = Traces.get_user_trace_with_events!(user, trace.id)

    if events == [] do
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
          %{description: "Created by the browser smoke seed", name: "Smoke activity", weight: 1},
          %{
            message: "Smoke activity started",
            phase: "B",
            timestamp_integer: System.system_time(:millisecond) - 60_000
          }
        )
    end
  end
end
