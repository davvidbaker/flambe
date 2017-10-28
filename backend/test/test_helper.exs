ExUnit.start()

Ecto.Adapters.SQL.Sandbox.mode(Stitch.Repo, :manual)

defmodule Stitch.TestHelper do
  alias Stitch.{Traces, Accounts}
  
  def create_dummy_user do
    {:ok, user} = Accounts.create_user(%{name: "dummy name", credential: %{email: "dummy@email"}})
    user
  end

  def create_dummy_trace(user) do
    {:ok, trace} = Traces.create_trace(user, %{name: "dummy trace"})
    Traces.create_thread(trace.id, %{name: "Main"})
    trace
  end
  
end