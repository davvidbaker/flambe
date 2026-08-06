defmodule Flambe.CoreFlowTest do
  use FlambeWeb.ConnCase

  alias Flambe.{Accounts, Repo, TestHelper, Traces}
  alias FlambeWeb.TraceView

  test "a local credential can authenticate and issue a refresh token" do
    email = "smoke-test@example.com"
    user = TestHelper.user_fixture(%{email: email, password: "smoketest"})

    assert {:ok, authenticated_user} =
             Accounts.authenticate_by_email_password(email, "smoketest")

    assert authenticated_user.id == user.id

    assert {:ok, refresh_token, _claims} =
             Flambe.Guardian.encode_and_sign(authenticated_user, %{}, token_type: "refresh")

    assert {:ok, _old_token, {_access_token, %{"typ" => "access"}}} =
             Guardian.exchange(Flambe.Guardian, refresh_token, "refresh", "access", [])
  end

  test "a trace returns newly created threads in the frontend payload" do
    user = TestHelper.user_fixture()
    {:ok, trace} = Traces.create_trace(user, %{name: "Smoke-test trace"})
    {:ok, thread} = Traces.create_thread(trace, %{name: "Regression thread", rank: 1})
    thread_id = thread.id

    payload =
      TraceView.render("trace.json", %{
        trace: %{trace: Traces.get_trace!(trace.id), events: []}
      })

    assert Enum.any?(payload.threads, fn rendered_thread ->
             rendered_thread.id == thread_id and rendered_thread.name == "Regression thread" and
               rendered_thread.rank == 1
           end)
  end

  test "deleting a thread removes its attention records" do
    user = TestHelper.user_fixture()
    {:ok, trace} = Traces.create_trace(user, %{name: "Smoke-test trace"})
    [main_thread] = Traces.list_trace_threads(trace)

    {:ok, attention} =
      Accounts.create_attention(user.id, %{
        thread_id: main_thread.id,
        timestamp_integer: 1_700_000_000_000
      })

    assert {:ok, _thread} = Traces.delete_thread(main_thread)
    assert Repo.get(Accounts.Attention, attention.id) == nil
    assert Repo.get(Traces.Thread, main_thread.id) == nil
  end
end
