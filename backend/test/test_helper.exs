ExUnit.start()

Ecto.Adapters.SQL.Sandbox.mode(Steady.Repo, :manual)

defmodule Steady.TestHelper do
  alias Steady.{Traces, Accounts}
  alias Steady.Traces.Activity

  def user_fixture do
    {:ok, user} = Accounts.create_user(%{name: "dummy name", credential: %{email: "dummy@email"}})
    user
  end

  def trace_fixture(user) do
    {:ok, trace} = Traces.create_trace(user, %{name: "dummy trace"})
    Traces.create_thread(trace.id, %{name: "Main"})
    trace
  end

  def activity_fixture(trace, attrs) do
    [main_thread | _tail] =
      trace
      |> Steady.Repo.preload(:threads)
      |> Traces.list_trace_threads()

    case Traces.create_activity(main_thread.id, attrs) do
      {:ok, %Activity{} = activity} -> activity
      {:error, reasons} -> {:error, reasons}
    end
  end
end
