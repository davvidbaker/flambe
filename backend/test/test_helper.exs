ExUnit.start()

Ecto.Adapters.SQL.Sandbox.mode(Stitch.Repo, :manual)

defmodule Stitch.TestHelper do
  alias Stitch.{Traces, Accounts}
  alias Stitch.Traces.Activity
  
  def create_dummy_user do
    {:ok, user} = Accounts.create_user(%{name: "dummy name", credential: %{email: "dummy@email"}})
    user
  end

  def create_dummy_trace(user) do
    {:ok, trace} = Traces.create_trace(user, %{name: "dummy trace"})
    Traces.create_thread(trace.id, %{name: "Main"})
    trace
  end

  def create_dummy_activity(trace, attrs) do
    [main_thread | _tail] = 
      trace
      |> Stitch.Repo.preload(:threads)
      |> Traces.list_trace_threads

    case Traces.create_activity(main_thread.id, attrs) do
      {:ok, %Activity{} = activity} -> activity
      {:error, reasons} -> {:error, reasons}
    end
        
  end
  
end