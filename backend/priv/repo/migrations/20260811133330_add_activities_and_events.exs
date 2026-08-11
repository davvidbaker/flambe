defmodule FlambeNext.Repo.Migrations.AddActivitiesAndEvents do
  use Ecto.Migration

  def change do
    create table(:activities) do
      add :name, :string, null: false
      add :description, :string
      add :weight, :integer
      add :thread_id, references(:threads, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:activities, [:thread_id])

    create table(:events) do
      add :timestamp, :utc_datetime_usec, null: false
      add :phase, :string, null: false
      add :message, :string
      add :trace_id, references(:traces, on_delete: :delete_all), null: false
      add :activity_id, references(:activities, on_delete: :delete_all)

      timestamps(type: :utc_datetime)
    end

    create index(:events, [:trace_id, :timestamp])
    create index(:events, [:activity_id])
  end
end
