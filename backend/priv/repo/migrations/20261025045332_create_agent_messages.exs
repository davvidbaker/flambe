defmodule FlambeNext.Repo.Migrations.CreateAgentMessages do
  use Ecto.Migration

  def change do
    create table(:agent_messages) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :trace_id, references(:traces, on_delete: :nilify_all)
      add :agent_id, :string, null: false
      add :body, :text, null: false
      add :delivered_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec)
    end

    create index(:agent_messages, [:user_id, :agent_id, :delivered_at])
    create index(:agent_messages, [:trace_id])
  end
end
