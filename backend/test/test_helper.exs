ExUnit.start()

Ecto.Adapters.SQL.Sandbox.mode(Flambe.Repo, :manual)

defmodule Flambe.TestHelper do
  alias Flambe.{Traces, Accounts}
  alias Flambe.Traces.Activity

  def user_fixture(attrs \\ %{}) do
    username = "user#{System.unique_integer([:positive])}"

    {:ok, user} =
      attrs
      |> Enum.into(%{
        name: "Some User",
        username: username,
        credentials: [
          %{
            email: attrs[:email] || "#{username}@example.com",
            password: attrs[:password] || "supersecret"
          }
        ]
      })
      |> Accounts.register_user()

    user
  end

  def trace_fixture() do
    user = user_fixture(%{})
    trace_fixture(user)
  end

  def trace_fixture(user) do
    {:ok, trace} = Traces.create_trace(user, %{name: "dummy trace"})
    trace
  end

  def activity_fixture(trace, attrs) do
    [main_thread | _tail] =
      trace
      |> Flambe.Repo.preload(:threads)
      |> Traces.list_trace_threads()

    case Traces.create_activity(main_thread.id, attrs) do
      {:ok, %Activity{} = activity} -> activity
      {:error, reasons} -> {:error, reasons}
    end
  end
end
