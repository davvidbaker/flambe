defmodule FlambeNextWeb.ObservationControllerTest do
  use FlambeNextWeb.ConnCase, async: true

  alias FlambeNext.Accounts

  test "creates dated observations, merges payload on the same day, and lists them on the dashboard",
       %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Obs User", username: "obs-user"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/observations", %{
        "observation" => %{
          "kind" => "carbon",
          "value" => 312.4,
          "unit" => "gCO2eq/kWh",
          "observed_on" => "2026-09-04",
          "payload" => %{"source" => "us-ba-mean"},
          "timestamp_integer" => 1_757_000_000_000
        }
      })

    assert %{
             "data" => %{
               "id" => observation_id,
               "kind" => "carbon",
               "value" => 312.4,
               "unit" => "gCO2eq/kWh",
               "observed_on" => "2026-09-04",
               "payload" => %{"source" => "us-ba-mean"}
             }
           } = json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> authenticated_as(user)
      |> post(~p"/api/observations", %{
        "observation" => %{
          "kind" => "carbon",
          "value" => 310.1,
          "unit" => "gCO2eq/kWh",
          "observed_on" => "2026-09-04",
          "payload" => %{"kwh_actual" => 12.5},
          "timestamp_integer" => 1_757_000_100_000
        }
      })

    assert %{
             "data" => %{
               "id" => ^observation_id,
               "value" => 310.1,
               "payload" => %{"source" => "us-ba-mean", "kwh_actual" => 12.5}
             }
           } = json_response(conn, 200)

    conn = conn |> recycle() |> authenticated_as(user) |> get(~p"/api/users/#{user}")

    assert %{
             "data" => %{
               "observations" => [
                 %{
                   "id" => ^observation_id,
                   "kind" => "carbon",
                   "observed_on" => "2026-09-04"
                 }
               ]
             }
           } = json_response(conn, 200)
  end

  test "undated observations insert instead of upserting", %{conn: conn} do
    {:ok, user} = Accounts.create_user(%{name: "Mood User", username: "mood-user"})

    conn =
      conn
      |> authenticated_as(user)
      |> post(~p"/api/observations", %{
        "observation" => %{
          "kind" => "mood",
          "value" => 0.7,
          "timestamp_integer" => 1_757_000_000_000
        }
      })

    assert %{"data" => %{"id" => first_id}} = json_response(conn, 201)

    conn =
      conn
      |> recycle()
      |> authenticated_as(user)
      |> post(~p"/api/observations", %{
        "observation" => %{
          "kind" => "mood",
          "value" => 0.4,
          "timestamp_integer" => 1_757_000_200_000
        }
      })

    assert %{"data" => %{"id" => second_id}} = json_response(conn, 201)
    refute second_id == first_id
  end

  defp authenticated_as(conn, user) do
    conn
    |> init_test_session(%{})
    |> put_session(:user_id, user.id)
  end
end
