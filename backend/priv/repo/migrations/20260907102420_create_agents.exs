defmodule FlambeNext.Repo.Migrations.CreateAgents do
  use Ecto.Migration

  def change do
    create table(:agents) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :agent_id, :string, null: false
      add :name, :string, null: false
      add :name_source, :string, null: false
      add :last_seen_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:agents, [:user_id, :agent_id])
    create index(:agents, [:user_id, :name])
  end
end
