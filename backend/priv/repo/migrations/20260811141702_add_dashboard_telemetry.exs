defmodule FlambeNext.Repo.Migrations.AddDashboardTelemetry do
  use Ecto.Migration

  def change do
    create table(:mantras) do
      add :name, :string, null: false
      add :timestamp, :utc_datetime_usec, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:mantras, [:user_id, :timestamp])

    create table(:attentions) do
      add :thread_id, references(:threads, on_delete: :delete_all), null: false
      add :timestamp, :utc_datetime_usec, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:attentions, [:user_id, :timestamp])
    create index(:attentions, [:thread_id])

    create table(:tabs) do
      add :count, :integer, null: false
      add :window_count, :integer
      add :timestamp, :utc_datetime_usec, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:tabs, [:user_id, :timestamp])

    create table(:search_terms) do
      add :term, :string, null: false
      add :timestamp, :utc_datetime_usec, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:search_terms, [:user_id, :timestamp])
  end
end
