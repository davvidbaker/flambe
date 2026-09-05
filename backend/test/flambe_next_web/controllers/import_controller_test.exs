defmodule FlambeNextWeb.ImportControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.{Accounts, Traces}

  test "imports a local export as a new trace and skips a second copy", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Importer", username: "importer"})
    {:ok, _existing} = Traces.create_trace(user, %{name: "Main"})

    bundle = %{
      "format" => "flambe-local-export",
      "version" => 1,
      "categories" => [
        %{
          "export_id" => "cat-1",
          "name" => "coding",
          "color_background" => "#efc360",
          "color_text" => "#000000"
        }
      ],
      "traces" => [
        %{
          "export_id" => "trace-work",
          "name" => "Main",
          "threads" => [%{"export_id" => "thread-main", "name" => "Main", "rank" => 0}],
          "activities" => [
            %{
              "export_id" => "act-root",
              "name" => "Laptop work",
              "description" => nil,
              "weight" => nil,
              "parent_export_id" => nil,
              "thread_export_id" => "thread-main",
              "category_export_ids" => ["cat-1"],
              "agent_id" => "cursor:1",
              "agent_name" => "Grok"
            },
            %{
              "export_id" => "act-child",
              "name" => "Nested",
              "parent_export_id" => "act-root",
              "thread_export_id" => "thread-main",
              "category_export_ids" => []
            }
          ],
          "events" => [
            %{
              "export_id" => "ev-1",
              "activity_export_id" => "act-root",
              "timestamp_integer" => 1_700_000_000_000,
              "phase" => "B",
              "message" => nil
            },
            %{
              "export_id" => "ev-2",
              "activity_export_id" => "act-child",
              "timestamp_integer" => 1_700_000_000_100,
              "phase" => "B",
              "message" => nil
            },
            %{
              "export_id" => "ev-3",
              "activity_export_id" => "act-child",
              "timestamp_integer" => 1_700_000_000_200,
              "phase" => "E",
              "message" => "done"
            }
          ]
        }
      ],
      "observations" => []
    }

    conn = conn |> authenticated_as(user) |> post(~p"/api/imports", bundle)

    assert %{
             "data" => %{
               "traces" => [
                 %{
                   "id" => trace_id,
                   "name" => "Main (imported)",
                   "skipped" => false,
                   "import_key" => "trace-work"
                 }
               ]
             }
           } = json_response(conn, 200)

    {trace, events} = Traces.get_user_trace_with_events!(user, trace_id)
    assert trace.name == "Main (imported)"
    assert length(events) == 3

    root = Enum.find(events, &(&1.activity.name == "Laptop work")).activity
    child = Enum.find(events, &(&1.activity.name == "Nested")).activity
    assert child.parent_id == root.id
    assert root.agent_name == "Grok"
    assert hd(root.categories).name == "coding"

    conn = conn |> recycle() |> authenticated_as(user) |> post(~p"/api/imports", bundle)

    assert %{
             "data" => %{
               "traces" => [
                 %{"id" => ^trace_id, "skipped" => true, "import_key" => "trace-work"}
               ]
             }
           } = json_response(conn, 200)

    assert length(Traces.list_user_traces(user)) == 2
  end

  test "rejects a malformed bundle", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Importer", username: "bad-import"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/imports", %{"format" => "nope"})

    assert json_response(conn, 422) == %{"error" => "INVALID_BUNDLE"}
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
