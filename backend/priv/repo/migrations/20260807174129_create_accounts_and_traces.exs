defmodule FlambeNext.Repo.Migrations.CreateAccountsAndTraces do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :name, :string, null: false
      add :username, :string, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:username])

    create table(:traces) do
      add :name, :string, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:traces, [:name])
    create index(:traces, [:user_id])

    create table(:threads) do
      add :name, :string, null: false
      add :rank, :integer, null: false, default: 0
      add :trace_id, references(:traces, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:threads, [:trace_id])
  end
end
