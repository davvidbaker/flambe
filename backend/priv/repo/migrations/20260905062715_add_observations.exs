defmodule FlambeNext.Repo.Migrations.AddObservations do
  use Ecto.Migration

  def change do
    create table(:observations) do
      add :kind, :string, null: false
      add :value, :float, null: false
      add :unit, :string
      add :payload, :map, null: false, default: %{}
      add :observed_on, :date
      add :timestamp, :utc_datetime_usec, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:observations, [:user_id, :timestamp])
    create index(:observations, [:user_id, :kind])

    create unique_index(:observations, [:user_id, :kind, :observed_on],
             name: :observations_user_kind_observed_on_index,
             where: "observed_on IS NOT NULL"
           )
  end
end
